'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'

const REPORT_OPTIONS = [
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
    if (!res.ok) { toast.error('Failed to submit report'); setSubmitting(false); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center animate-fade-up">
      <div className="text-5xl mb-5">✅</div>
      <h1 className="text-2xl font-bold tracking-tight mb-3">Report received</h1>
      <p className="text-gray-500 leading-relaxed mb-10">
        Thank you. Your report has been received and will be reviewed by the QuicKeys™ team.
      </p>
      <button onClick={() => router.back()} className="w-full bg-black text-white py-4 rounded-xl font-semibold">
        Return
      </button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h1 className="font-bold text-base flex-1 text-center">Report this user</h1>
        <div className="w-7" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-gray-500 text-sm mb-5">
          Select the reason for your report. All reports are reviewed by the QuicKeys™ team.
        </p>
        <div className="space-y-2 mb-5">
          {REPORT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-[1.5px] text-left text-sm transition-all
                ${selected === opt.id ? 'border-black bg-gray-50 font-semibold' : 'border-gray-200 hover:border-gray-300'}`}>
              <span>{opt.icon}</span>
              <span className="flex-1">{opt.label}</span>
              {selected === opt.id && <span>✓</span>}
            </button>
          ))}
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Anything else we should know? (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={4}
            placeholder="Optional details…"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm resize-none" />
          <p className="text-xs text-gray-400 text-right mt-1">{note.length}/300</p>
        </div>
        <button disabled={!selected || submitting} onClick={submit}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40">
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-svh"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>}>
      <ReportContent />
    </Suspense>
  )
}
