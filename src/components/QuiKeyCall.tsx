'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'
import { EmbeddedCall } from '@stream-io/video-react-sdk/embedded'
import '@stream-io/video-react-sdk/dist/css/embedded.css'

type Call = { id: string; initiated_by: string; status: 'pending' | 'active'; call_id?: string; api_key?: string; token?: string; ends_at?: string }

export function QuiKeyCall({ conversationId, userId, otherName }: { conversationId: string; userId: string | null; otherName: string }) {
  const [call, setCall] = useState<Call | null>(null)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(120)
  const [available, setAvailable] = useState(true)

  const refresh = async () => {
    try {
      const response = await apiFetch(`/api/video-calls?conversation_id=${conversationId}`)
      if (!response.ok) {
        setAvailable(false)
        return
      }
      const data = await response.json()
      setAvailable(data.available !== false)
      setCall(data.call)
    } catch {
      setAvailable(false)
    }
  }

  useEffect(() => {
    if (!available) return
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

  const incoming = call?.status === 'pending' && call.initiated_by !== userId
  const waiting = call?.status === 'pending' && call.initiated_by === userId
  const active = call?.status === 'active' && call.call_id && call.api_key && call.token && userId

  // Calls are an optional enhancement. If their migration or provider is not
  // configured, omit the control instead of letting it block normal chat.
  if (!available) return null

  return <>
    <button type="button" className="chat-video-button" onClick={() => act('initiate')} disabled={busy || Boolean(call)} aria-label="Start a two-minute QuiKey Chat" title="Start a two-minute QuiKey Chat">
      <span className="chat-video-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <rect x="3.5" y="7" width="18" height="18" rx="5" />
          <path d="M21.5 12.2 28 9v14l-6.5-3.2" />
          <path className="chat-video-heart" d="M12.5 20.5s-5-2.8-5-6.2c0-2.6 3.4-3.3 5-1.1 1.6-2.2 5-1.5 5 1.1 0 3.4-5 6.2-5 6.2Z" />
        </svg>
      </span>
      <span className="chat-video-label">2 min</span>
    </button>

    {(incoming || waiting || active) && <div className="quikey-call-overlay" role="dialog" aria-modal="true" aria-label="QuiKey Chat">
      <div className={`quikey-call-card${active ? ' quikey-call-card-active' : ''}`}>
        {incoming && <><p className="quikey-call-kicker">QuiKey Chat</p><h2>{otherName} is inviting you to a two-minute call</h2><p>Camera and microphone access are used only for this live introduction.</p><div className="quikey-call-actions"><button onClick={() => act('decline')} disabled={busy}>Not now</button><button className="quikey-call-primary" onClick={() => act('accept')} disabled={busy}>Accept call</button></div></>}
        {waiting && <><p className="quikey-call-kicker">QuiKey Chat</p><h2>Calling {otherName}…</h2><p>The two-minute timer begins only after they accept.</p><button onClick={() => act('end')} disabled={busy}>Cancel invitation</button></>}
        {active && <>
          <div className="quikey-call-topbar"><div><strong>QuiKey Chat</strong><span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></div><button onClick={() => act('end')} aria-label="End call">End call</button></div>
          <div className="quikey-call-video">
            <EmbeddedCall
              apiKey={call.api_key!}
              callType="default"
              callId={call.call_id!}
              user={{ id: userId!, name: 'QuiKeys member' }}
              token={call.token!}
              layout="SpeakerTop"
              onError={() => toast.error('The call could not connect. Check camera and microphone access.')}
            />
          </div>
        </>}
      </div>
    </div>}
  </>
}
