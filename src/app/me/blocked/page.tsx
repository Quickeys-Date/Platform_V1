'use client'

import { useCallback, useEffect, useState } from 'react'
import { PhotoDisplay } from '@/components/PhotoDisplay'
import { apiFetch } from '@/lib/api'

type BlockedRow = {
  id: string
  blocked_id: string
  created_at: string
  blocked?: { id: string; first_name: string; city: string; state: string; photos: string[] }
}

export default function BlockedProfilesPage() {
  const [blocks, setBlocks] = useState<BlockedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<BlockedRow | null>(null)
  const [working, setWorking] = useState(false)

  const loadBlocks = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await apiFetch('/api/blocks')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setBlocks(data.blocks || [])
    } catch { setError('We could not load your blocked profiles.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  const unblock = async () => {
    if (!confirming) return
    setWorking(true)
    const response = await apiFetch('/api/blocks', { method: 'DELETE', body: JSON.stringify({ blocked_id: confirming.blocked_id }) })
    setWorking(false)
    if (!response.ok) { setError('Unable to unblock this profile.'); return }
    setBlocks(current => current.filter(row => row.id !== confirming.id))
    setConfirming(null)
  }

  return <main className="blocked-page">
    <header className="blocked-header"><button type="button" onClick={() => window.location.href = '/me'} aria-label="Back to profile">←</button><div><p>Safety &amp; Privacy</p><h1>Blocked Profiles</h1></div><span /></header>
    <div className="blocked-content">
      <p className="blocked-intro">Blocked people cannot see your profile, send requests, or message you. They are never notified.</p>
      {loading ? <div className="blocked-state">Loading…</div> : error ? <div className="blocked-state"><p>{error}</p><button type="button" onClick={loadBlocks}>Try again</button></div> : blocks.length === 0 ? <div className="blocked-state"><span aria-hidden="true">⊘</span><h2>No blocked profiles</h2><p>People you block will appear here privately.</p></div> : <div className="blocked-list">{blocks.map(row => <article className="blocked-row" key={row.id}>
        <PhotoDisplay photos={row.blocked?.photos || []} size={54} className="blocked-avatar" />
        <div><strong>{row.blocked?.first_name || 'QuiKeys member'}</strong><span>{[row.blocked?.city, row.blocked?.state].filter(Boolean).join(', ')}</span></div>
        <button type="button" onClick={() => setConfirming(row)}>Unblock</button>
      </article>)}</div>}
    </div>
    {confirming && <div className="blocked-confirm-backdrop" onMouseDown={() => !working && setConfirming(null)}><section className="blocked-confirm" role="alertdialog" aria-modal="true" aria-labelledby="unblock-title" onMouseDown={event => event.stopPropagation()}><h2 id="unblock-title">Unblock {confirming.blocked?.first_name || 'this person'}?</h2><p>You may see each other in Discover again. Previous requests and conversations will not be restored automatically.</p><div><button type="button" onClick={() => setConfirming(null)} disabled={working}>Cancel</button><button type="button" className="is-primary" onClick={unblock} disabled={working}>{working ? 'Unblocking…' : 'Unblock'}</button></div></section></div>}
  </main>
}
