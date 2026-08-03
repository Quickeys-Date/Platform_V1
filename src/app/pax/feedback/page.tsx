'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { PaxMark } from '@/components/PaxMark'

function FeedbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const triggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const stateId = params.get('state') || 'PAX_NEUTRAL'
  const [rating, setRating] = useState<string | null>(null)
  const [openText, setOpenText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const submit = async () => {
    setSaving(true)
    setSaveError('')
    try {
      if (!triggerId) throw new Error('This check-in is no longer available.')
      const response = await apiFetch('/api/pax', {
        method: 'PATCH',
        body: JSON.stringify({ trigger_id: triggerId, feedback_response: rating || null, feedback_open_text: openText.trim() || null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'We could not save your feedback.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'We could not save your feedback. Please try again.')
      setSaving(false)
      return
    }
    router.push(`/pax/thankyou?triggers=${encodeURIComponent(triggersParam)}&index=${indexParam}&type=${triggerType}`)
  }

  const changeEmotion = () => {
    const previous = new URLSearchParams()
    previous.set('state', stateId)
    previous.set('trigger_id', triggerId)
    previous.set('type', triggerType)
    if (triggersParam) previous.set('triggers', triggersParam)
    previous.set('index', String(indexParam))
    router.push(`/pax/checkin?${previous.toString()}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      {/* CR#17: Back button */}
      <button onClick={changeEmotion} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}>← Change emotion</button>

      <PaxMark style={{ marginBottom: 24 }} />

      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 24 }}>Was this helpful?</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { id: 'FEEDBACK_YES', label: 'Yes', primary: true },
            { id: 'FEEDBACK_NOT_QUITE', label: 'Not Quite', primary: false },
          ].map(btn => (
            <button key={btn.id} onClick={() => setRating(r => r === btn.id ? null : btn.id)} style={{
              padding: '12px 28px', borderRadius: 28, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              border: `1.5px solid ${rating === btn.id ? (btn.primary ? '#FFC766' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)'}`,
              background: rating === btn.id ? (btn.primary ? 'rgba(255,199,102,0.15)' : 'rgba(255,255,255,0.08)') : 'transparent',
              color: rating === btn.id ? (btn.primary ? '#FFC766' : 'white') : 'rgba(255,255,255,0.45)',
            }}>
              {btn.label}
            </button>
          ))}
        </div>

        {rating === 'FEEDBACK_NOT_QUITE' && (
          <div style={{ animation: 'fadeUp 0.2s ease' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>What felt missing?</p>
            <textarea value={openText} onChange={e => setOpenText(e.target.value)} maxLength={300} rows={4}
              placeholder="Optional…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
            <p style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{openText.length}/300</p>
          </div>
        )}
      </div>

      <button className="pax-flow-primary" onClick={submit} disabled={saving}>
        {saving ? 'Saving…' : 'Continue'}
      </button>
      {saveError && <p role="alert" style={{ color: '#ff9b91', fontSize: 13, lineHeight: 1.5, marginTop: 10, textAlign: 'center' }}>{saveError}</p>}
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="pax-screen" style={{ alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <FeedbackContent />
    </Suspense>
  )
}
