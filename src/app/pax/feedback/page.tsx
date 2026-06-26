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
        body: JSON.stringify({
          trigger_id: triggerId,
          feedback_response: rating || null,
          feedback_open_text: openText.trim() || null,
        }),
      })
    }
    router.push(`/pax/thankyou?triggers=${encodeURIComponent(triggersParam)}&index=${indexParam}&type=${triggerType}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-8" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1">
        <h1 className="text-xl font-bold tracking-tight mb-8 text-white">Was this helpful?</h1>
        <div className="flex gap-3 mb-8">
          <button onClick={() => setRating(r => r === 'FEEDBACK_YES' ? null : 'FEEDBACK_YES')}
            className={`px-8 py-3.5 rounded-full font-semibold text-sm transition-all border-[1.5px]
              ${rating === 'FEEDBACK_YES' ? 'bg-white text-black border-white' : 'bg-white text-black border-white/80 opacity-90'}`}>
            Yes
          </button>
          <button onClick={() => setRating(r => r === 'FEEDBACK_NOT_QUITE' ? null : 'FEEDBACK_NOT_QUITE')}
            className={`px-8 py-3.5 rounded-full font-semibold text-sm transition-all border-[1.5px]
              ${rating === 'FEEDBACK_NOT_QUITE' ? 'bg-white/15 text-white border-white/40' : 'bg-transparent text-white/60 border-white/20'}`}>
            Not Quite
          </button>
        </div>
        {rating === 'FEEDBACK_NOT_QUITE' && (
          <div className="animate-fade-up">
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>What felt missing?</p>
            <textarea value={openText} onChange={e => setOpenText(e.target.value)}
              maxLength={300} rows={4} placeholder="Optional…"
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'inherit' }} />
            <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{openText.length}/300</p>
          </div>
        )}
      </div>
      <button onClick={submit} disabled={saving}
        className="w-full py-4 rounded-xl font-semibold text-base bg-white text-black disabled:opacity-70 mt-4">
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="pax-screen items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}>
      <FeedbackContent />
    </Suspense>
  )
}
