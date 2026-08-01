'use client'

import { useCallback, useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { PhotoDisplay } from '@/components/PhotoDisplay'
import type { ConnectionRequest, Profile } from '@/lib/types'
import { apiFetch } from '@/lib/api'

function age(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return ''
  const born = new Date(dateOfBirth)
  const now = new Date()
  let value = now.getFullYear() - born.getFullYear()
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) value -= 1
  return value >= 18 ? `, ${value}` : ''
}

function RequestIdentity({ profile }: { profile?: Profile }) {
  return <div className="request-identity"><PhotoDisplay photos={profile?.photos || []} size={62} className="request-avatar" /><div><strong>{profile?.first_name || 'QuiKeys member'}{age(profile?.date_of_birth)}</strong><span>{[profile?.city, profile?.state].filter(Boolean).join(', ')}</span></div></div>
}

export default function RequestsPage() {
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([])
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([])
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workingId, setWorkingId] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await apiFetch('/api/connection-requests')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setIncoming(data.incoming || []); setOutgoing(data.outgoing || [])
    } catch { setError('We could not load your connection requests.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const respond = async (request: ConnectionRequest, action: 'accept' | 'decline') => {
    setWorkingId(request.id)
    const response = await apiFetch(`/api/connection-requests/${request.id}`, { method: 'PATCH', body: JSON.stringify({ action }) })
    const data = await response.json()
    setWorkingId('')
    if (!response.ok) { setError(data.error || 'Unable to update this request.'); return }
    if (action === 'accept' && data.conversation?.id) { window.location.href = `/chat/${data.conversation.id}`; return }
    setIncoming(current => current.filter(item => item.id !== request.id))
  }

  const requests = tab === 'incoming' ? incoming : outgoing

  return (
    <main className="requests-page">
      <header className="requests-header"><div><p>Connections</p><h1>Requests</h1><span>Choose intention over collecting.</span></div></header>
      <div className="requests-content">
        <div className="requests-tabs" role="tablist">
          <button type="button" className={tab === 'incoming' ? 'is-active' : ''} onClick={() => setTab('incoming')}>Received <span>{incoming.length}</span></button>
          <button type="button" className={tab === 'outgoing' ? 'is-active' : ''} onClick={() => setTab('outgoing')}>Sent <span>{outgoing.length}</span></button>
        </div>
        {loading ? <div className="requests-state">Loading requests…</div> : error ? <div className="requests-state"><p>{error}</p><button type="button" onClick={loadRequests}>Try again</button></div> : requests.length === 0 ? (
          <div className="requests-state"><span aria-hidden="true">♡</span><h2>{tab === 'incoming' ? 'No new requests' : 'No requests waiting'}</h2><p>{tab === 'incoming' ? 'When someone is interested, their request will appear here.' : 'Requests you send will remain here until they respond.'}</p></div>
        ) : <div className="requests-list">{requests.map(request => {
          const profile = tab === 'incoming' ? request.sender : request.recipient
          return <article className="request-card" key={request.id}>
            <RequestIdentity profile={profile} />
            {request.request_type === 'QUIKEY' ? <div className="request-quikey"><span>QuiKey opener</span><h2>{request.prompt_question}</h2><p>“{request.prompt_answer}”</p></div> : <p className="request-standard">Sent you a sincere connection request.</p>}
            {tab === 'incoming' ? <div className="request-actions"><button type="button" className="request-decline" disabled={workingId === request.id} onClick={() => respond(request, 'decline')}>Decline</button><button type="button" className="request-accept" disabled={workingId === request.id} onClick={() => respond(request, 'accept')}>{workingId === request.id ? 'Please wait…' : 'Accept & Connect'}</button></div> : <div className="request-pending">Waiting for their response</div>}
          </article>
        })}</div>}
      </div>
      <BottomNav active="requests" />
    </main>
  )
}
