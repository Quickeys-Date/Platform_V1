'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  SpeakerLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

type Call = { id: string; initiated_by: string; status: 'pending' | 'active'; call_id?: string; api_key?: string; token?: string; started_at?: string; ends_at?: string }

function JoinedStreamCall({
  apiKey,
  callId,
  token,
  userId,
  onEnd,
  onError,
  onJoined,
}: {
  apiKey: string
  callId: string
  token: string
  userId: string
  onEnd: () => void
  onError: () => void
  onJoined: () => void
}) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [streamCall, setStreamCall] = useState<ReturnType<StreamVideoClient['call']> | null>(null)

  useEffect(() => {
    let disposed = false
    const videoClient = new StreamVideoClient({
      apiKey,
      user: { id: userId },
      token,
    })
    const nextCall = videoClient.call('default', callId)

    const join = async () => {
      try {
        // The QuiKeys accept screen is the lobby. Join immediately after the
        // browser grants media permission so users are never asked twice.
        await Promise.allSettled([
          nextCall.camera.enable(),
          nextCall.microphone.enable(),
        ])
        await nextCall.join()
        if (disposed) {
          await nextCall.leave().catch(() => undefined)
          return
        }
        setClient(videoClient)
        setStreamCall(nextCall)
        onJoined()
      } catch {
        if (!disposed) onError()
      }
    }

    join()
    return () => {
      disposed = true
      nextCall.leave().catch(() => undefined)
      videoClient.disconnectUser().catch(() => undefined)
    }
  }, [apiKey, callId, token, userId, onError, onJoined])

  if (!client || !streamCall) {
    return <div className="quikey-call-joining" role="status"><span aria-hidden="true" />Connecting your call…</div>
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={streamCall}>
        <div className="quikey-call-stage">
          <SpeakerLayout participantsBarPosition="bottom" />
          <div className="quikey-call-media-controls" aria-label="Camera and microphone controls">
            <ToggleAudioPublishingButton />
            <ToggleVideoPublishingButton />
            <button type="button" className="quikey-call-hangup" onClick={onEnd} aria-label="End call">
              <span aria-hidden="true">☎</span>
            </button>
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  )
}

export function QuiKeyCall({ conversationId, userId, otherName }: { conversationId: string; userId: string | null; otherName: string }) {
  const [call, setCall] = useState<Call | null>(null)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(120)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [confirmStart, setConfirmStart] = useState(false)
  const minuteAlertShown = useRef(false)
  const connectionError = useCallback(() => {
    toast.error('The call could not connect. Check camera and microphone access.')
  }, [])

  const refresh = async () => {
    try {
      const response = await apiFetch(`/api/video-calls?conversation_id=${conversationId}`)
      if (!response.ok) {
        setAvailable(false)
        return
      }
      const data = await response.json()
      setAvailable(data.available !== false)
      // GET returns a freshly generated Stream token. Replacing the active
      // call object on every poll remounts the video client, causing mobile
      // video to blink and reconnect. Keep the original credentials until
      // the call actually changes or ends.
      setCall(current => (
        current?.status === 'active' &&
        data.call?.status === 'active' &&
        current.id === data.call.id
          ? { ...current, started_at: data.call.started_at, ends_at: data.call.ends_at }
          : data.call
      ))
    } catch {
      setAvailable(false)
    }
  }

  useEffect(() => {
    if (available === false) return
    refresh()
    const timer = window.setInterval(refresh, 2500)
    return () => window.clearInterval(timer)
  }, [conversationId, available])

  useEffect(() => {
    if (call?.status !== 'active' || !call.ends_at) return
    const update = () => setSeconds(Math.max(0, Math.ceil((new Date(call.ends_at!).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [call?.id, call?.status, call?.ends_at])

  useEffect(() => {
    minuteAlertShown.current = false
  }, [call?.id])

  useEffect(() => {
    if (call?.status !== 'active' || seconds > 60 || seconds <= 0 || minuteAlertShown.current) return
    minuteAlertShown.current = true
    toast('One minute remaining in your QuiKey call.', {
      duration: 5000,
      icon: '⏱',
      style: { background: '#062326', color: '#ffd178', border: '1px solid rgba(217,155,52,.7)' },
    })
  }, [call?.status, seconds])

  const act = async (action: string) => {
    setBusy(true)
    const response = await apiFetch(`/api/video-calls?conversation_id=${conversationId}`, {
      method: 'POST', body: JSON.stringify({ action, call_id: call?.id }),
    })
    const data = await response.json()
    setBusy(false)
    if (!response.ok) return toast.error(data.error || 'QuiKey Chat could not start.')
    if (action === 'decline' || action === 'end') setCall(null)
    else setCall(data.call)
  }

  const markJoined = useCallback(async () => {
    const response = await apiFetch(`/api/video-calls?conversation_id=${conversationId}`, {
      method: 'POST', body: JSON.stringify({ action: 'joined', call_id: call?.id }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast.error(data.error || 'The timed call could not start.')
      return
    }
    setCall(current => current && data.call?.id === current.id
      ? { ...current, started_at: data.call.started_at, ends_at: data.call.ends_at }
      : current)
  }, [call?.id, conversationId])

  const incoming = call?.status === 'pending' && call.initiated_by !== userId
  const waiting = call?.status === 'pending' && call.initiated_by === userId
  const active = call?.status === 'active' && call.call_id && call.api_key && call.token && userId

  // Calls are an optional enhancement. If their migration or provider is not
  // configured, omit the control instead of letting it block normal chat.
  if (available !== true) return null

  return <>
    <button type="button" className="chat-video-button" onClick={() => setConfirmStart(true)} disabled={busy || Boolean(call)} aria-label="Start a QuiKey call" title="Start a QuiKey call">
      <span className="chat-video-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <rect x="3.5" y="7" width="18" height="18" rx="5" />
          <path d="M21.5 12.2 28 9v14l-6.5-3.2" />
          <path className="chat-video-heart" d="M12.5 20.5s-5-2.8-5-6.2c0-2.6 3.4-3.3 5-1.1 1.6-2.2 5-1.5 5 1.1 0 3.4-5 6.2-5 6.2Z" />
        </svg>
      </span>
    </button>

    {confirmStart && !call && <div className="quikey-call-overlay" role="dialog" aria-modal="true" aria-labelledby="start-quikey-call-title">
      <div className="quikey-call-card">
        <p className="quikey-call-kicker">QuiKey call</p>
        <h2 id="start-quikey-call-title">Is now a good time to connect?</h2>
        <p>For a thoughtful experience, make sure you and {otherName} have agreed on a good time to call.</p>
        <div className="quikey-call-actions">
          <button type="button" onClick={() => setConfirmStart(false)}>Not now</button>
          <button type="button" className="quikey-call-primary" disabled={busy} onClick={() => { setConfirmStart(false); act('initiate') }}>Start call</button>
        </div>
      </div>
    </div>}

    {(incoming || waiting || active) && <div className="quikey-call-overlay" role="dialog" aria-modal="true" aria-label="QuiKey Chat">
      <div className={`quikey-call-card${active ? ' quikey-call-card-active' : ''}`}>
        {incoming && <><p className="quikey-call-kicker">QuiKey Chat</p><h2>{otherName} is inviting you to a two-minute call</h2><p>Camera and microphone access are used only for this live introduction.</p><div className="quikey-call-actions"><button onClick={() => act('decline')} disabled={busy}>Not now</button><button className="quikey-call-primary" onClick={() => act('accept')} disabled={busy}>Accept call</button></div></>}
        {waiting && <><p className="quikey-call-kicker">QuiKey Chat</p><h2>Calling {otherName}…</h2><p>The two-minute timer begins only after they accept.</p><button onClick={() => act('end')} disabled={busy}>Cancel invitation</button></>}
        {active && <>
          <div className="quikey-call-topbar">
            <div><strong>QuiKey Chat</strong></div>
            <div className="quikey-call-topbar-actions">
              <span className={`quikey-call-header-timer${call.ends_at && seconds <= 60 ? ' quikey-call-header-timer-warning' : ''}`} role="timer" aria-live={seconds === 60 ? 'assertive' : 'off'}>
                {call.ends_at ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Waiting for both'}
              </span>
              <button onClick={() => act('end')} aria-label="End call">End call</button>
            </div>
          </div>
          <div className="quikey-call-video">
            <JoinedStreamCall
              apiKey={call.api_key!}
              callId={call.call_id!}
              userId={userId!}
              token={call.token!}
              onEnd={() => act('end')}
              onError={connectionError}
              onJoined={markJoined}
            />
          </div>
        </>}
      </div>
    </div>}
  </>
}
