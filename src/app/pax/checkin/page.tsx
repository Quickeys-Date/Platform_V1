'use client'
// src/app/pax/checkin/page.tsx — S-13 Emotional Check-In
// Handles both CLOSE_CONVERSATION (trigger_id in URL) and INACTIVITY (triggers list + index in URL).
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EMOTION_OPTIONS } from '@/lib/pax'

function CheckinContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const isInactivity = triggerType === 'INACTIVITY'

  // For CLOSE_CONVERSATION: single trigger_id in URL
  // For INACTIVITY: comma-separated list + current index
  const singleTriggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerIds = triggersParam ? triggersParam.split(',').filter(Boolean) : []
  const currentTriggerId = isInactivity ? (triggerIds[indexParam] || '') : singleTriggerId

  const proceed = async () => {
    if (!selected) return
    setSaving(true)

    if (currentTriggerId) {
      await fetch('/api/pax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_id: currentTriggerId, state_id_selected: selected }),
      })
    }

    const next = new URLSearchParams()
    next.set('state', selected)
    next.set('trigger_id', currentTriggerId)
    next.set('type', triggerType)
    if (isInactivity) {
      next.set('triggers', triggersParam)
      next.set('index', String(indexParam))
    }
    router.push(`/pax/response?${next.toString()}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>

      {isInactivity && (
        <div className="rounded-xl p-4 mb-5 text-sm leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
          Looks like this conversation may have cooled off a bit.<br />
          Want to check in before moving on?
        </div>
      )}

      <h1 className="text-xl font-bold tracking-tight mb-2 text-white">
        How are you feeling about that interaction?
      </h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Select one to continue.</p>

      <div className="space-y-2.5 flex-1">
        {EMOTION_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-[1.5px] text-left font-semibold text-sm transition-all text-white
              ${selected === opt.id ? 'border-[#C9A84C] bg-white/15' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
            <span className="text-xl">{opt.emoji}</span>
            <span>{opt.label}</span>
            {selected === opt.id && <span className="ml-auto" style={{ color: '#C9A84C' }}>✓</span>}
          </button>
        ))}
      </div>

      <button disabled={!selected || saving} onClick={proceed}
        className={`w-full py-4 rounded-xl font-semibold text-base mt-6 transition-all
          ${selected && !saving ? 'bg-white text-black' : 'bg-white/20 text-white/40'}`}>
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}

export default function PaxCheckinPage() {
  return (
    <Suspense fallback={<div className="pax-screen items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckinContent />
    </Suspense>
  )
}
