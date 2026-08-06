'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { apiFetch } from '@/lib/api'

type IncomingCall = {
  id: string
  conversation_id: string
  caller_name: string
  created_at: string
}

const PUBLIC_PREFIXES = ['/auth/', '/onboarding/', '/admin/']

export function IncomingCallListener() {
  const pathname = usePathname()
  const [call, setCall] = useState<IncomingCall | null>(null)
  const [busy, setBusy] = useState(false)

  // Chat has its own listener because it also mounts the Stream video room.
  const shouldListen = pathname !== '/' &&
    !pathname.startsWith('/chat/') &&
    !PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))

  const refresh = useCallback(async () => {
    if (!shouldListen || document.visibilityState === 'hidden') return
    try {
      const response = await apiFetch('/api/video-calls/incoming')
      if (response.status === 401) return setCall(null)
      if (!response.ok) return
      const data = await response.json()
      setCall(data.call || null)
    } catch {
      // Calling is optional; a temporary network failure must not block the site.
    }
  }, [shouldListen])

  useEffect(() => {
    if (!shouldListen) {
      setCall(null)
      return
    }

    refresh()
    const timer = window.setInterval(refresh, 2500)
    const onVisible = () => refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, shouldListen])

  const respond = async (action: 'accept' | 'decline') => {
    if (!call) return
    setBusy(true)
    const response = await apiFetch(`/api/video-calls?conversation_id=${call.conversation_id}`, {
      method: 'POST',
      body: JSON.stringify({ action, call_id: call.id }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) {
      toast.error(data.error || 'The call is no longer available.')
      setCall(null)
      return
    }
    if (action === 'decline') {
      setCall(null)
      return
    }
    window.location.href = `/chat/${call.conversation_id}`
  }

  if (!call) return null

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true" aria-labelledby="incoming-call-title">
      <section className="incoming-call-card">
        <div className="incoming-call-symbol" aria-hidden="true">♡</div>
        <p className="incoming-call-kicker">Incoming QuiKey call</p>
        <h2 id="incoming-call-title">{call.caller_name} is calling</h2>
        <p>You can accept now or choose not now if this is not a good time.</p>
        <div className="incoming-call-limit" role="note">
          <span aria-hidden="true">◷</span>
          This call is limited to 2 minutes.
        </div>
        <div className="incoming-call-actions">
          <button type="button" onClick={() => respond('decline')} disabled={busy}>Not now</button>
          <button type="button" className="incoming-call-accept" onClick={() => respond('accept')} disabled={busy}>
            {busy ? 'Connecting…' : 'Accept call'}
          </button>
        </div>
      </section>
    </div>
  )
}
