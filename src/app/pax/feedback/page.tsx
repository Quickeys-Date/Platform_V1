'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'

function FeedbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const triggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const [rating, setRating] = useState<string | null>(null)
  const [openText, setOpenText] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    if (triggerId) {
      await apiFetch('/api/pax', {
        method: 'PATCH',
        body: JSON.stringify({ trigger_id: triggerId, feedback_response: rating || null, feedback_open_text: openText.trim() || null }),
      })
    }
    router.push(`/pax/thankyou?triggers=${encodeURIComponent(triggersParam)}&index=${indexParam}&type=${triggerType}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      {/* CR#17: Back button */}
      <button onClick={() => router.back()} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>

      <div style={{ fontWeight: 900, fontSize: 18, color: '#FFC766', marginBottom: 24 }}>Pax™</div>

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

      <button onClick={submit} disabled={saving} style={{
        width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, marginTop: 16,
        background: 'white', color: '#0A0A0A', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving…' : 'Continue'}
      </button>
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
