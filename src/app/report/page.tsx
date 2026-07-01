'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'

const OPTIONS = [
  { id: 'REPORT_INAPPROPRIATE', label: 'Inappropriate content', icon: '⚠️' },
  { id: 'REPORT_HARASSMENT', label: 'Harassment', icon: '🚫' },
  { id: 'REPORT_SPAM', label: 'Spam', icon: '📨' },
  { id: 'REPORT_FAKE', label: 'Fake profile', icon: '🎭' },
  { id: 'REPORT_OTHER', label: 'Other', icon: '⋯' },
]

function ReportContent() {
  const router = useRouter()
  const params = useSearchParams()
  const reportedId = params.get('reported_id')
  const source = params.get('source') || 'Chat'
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async () => {
    if (!selected || !reportedId) return
    setSubmitting(true)
    const res = await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ reported_id: reportedId, report_type: selected, note, source_screen: source }),
    })
    if (!res.ok) { toast.error('Failed to submit'); setSubmitting(false); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center" style={{ background: '#0A0A0A' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>Report received</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 32 }}>
        Thank you. Your report will be reviewed by the QuicKeys™ team.
      </p>
      <button onClick={() => router.back()} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #FFC766, #D99B34)', color: '#0A0A0A', fontWeight: 700, fontSize: 15, borderRadius: 14, border: 'none', cursor: 'pointer' }}>
        Return
      </button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,27,30,0.9)' }}>
        <button onClick={() => router.back()} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</button>
        <h1 style={{ fontWeight: 700, fontSize: 16, color: 'white', flex: 1, textAlign: 'center' }}>Report this user</h1>
        <div style={{ width: 28 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
          Select the reason for your report. All reports are reviewed by the QuicKeys™ team.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSelected(opt.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 14, textAlign: 'left', cursor: 'pointer',
              border: `1.5px solid ${selected === opt.id ? '#0FB7BF' : 'rgba(255,255,255,0.08)'}`,
              background: selected === opt.id ? 'rgba(15,183,191,0.1)' : 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: selected === opt.id ? '#0FB7BF' : 'rgba(255,255,255,0.8)' }}>{opt.label}</span>
              {selected === opt.id && <span style={{ color: '#0FB7BF' }}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Additional details (optional)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={4}
            placeholder="Optional details…"
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 4 }}>{note.length}/300</p>
        </div>
        <button disabled={!selected || submitting} onClick={submit} style={{
          width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: selected ? 'pointer' : 'default', border: 'none',
          background: selected ? 'linear-gradient(135deg, #FFC766, #D99B34)' : 'rgba(255,255,255,0.08)',
          color: selected ? '#0A0A0A' : 'rgba(255,255,255,0.2)',
        }}>
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid #FFC766', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <ReportContent />
    </Suspense>
  )
}
