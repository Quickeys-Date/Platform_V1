'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EMOTION_OPTIONS } from '@/lib/pax'
import { apiFetch } from '@/lib/api'

function CheckinContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const isInactivity = triggerType === 'INACTIVITY'
  const singleTriggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerIds = triggersParam ? triggersParam.split(',').filter(Boolean) : []
  const currentTriggerId = isInactivity ? (triggerIds[indexParam] || '') : singleTriggerId

  const proceed = async () => {
    if (!selected) return
    setSaving(true)
    if (currentTriggerId) {
      await apiFetch('/api/pax', {
        method: 'POST',
        body: JSON.stringify({ trigger_id: currentTriggerId, state_id_selected: selected }),
      })
    }
    const next = new URLSearchParams()
    next.set('state', selected)
    next.set('trigger_id', currentTriggerId)
    next.set('type', triggerType)
    if (isInactivity) { next.set('triggers', triggersParam); next.set('index', String(indexParam)) }
    router.push(`/pax/response?${next.toString()}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      {/* CR#17: Back button */}
      <button onClick={() => router.back()} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>

      <div style={{ fontWeight: 900, fontSize: 18, color: '#FFC766', marginBottom: 16 }}>Pax™</div>

      {isInactivity && (
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          Looks like this conversation may have cooled off a bit. Want to check in before moving on?
        </div>
      )}

      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 6, lineHeight: 1.3 }}>
        How are you feeling about that interaction?
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Select one to continue.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {EMOTION_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => setSelected(opt.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderRadius: 14, textAlign: 'left', cursor: 'pointer',
            border: `1.5px solid ${selected === opt.id ? '#FFC766' : 'rgba(255,255,255,0.1)'}`,
            background: selected === opt.id ? 'rgba(255,199,102,0.1)' : 'rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 22 }}>{opt.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: selected === opt.id ? '#FFC766' : 'rgba(255,255,255,0.85)', flex: 1 }}>{opt.label}</span>
            {selected === opt.id && <span style={{ color: '#FFC766' }}>✓</span>}
          </button>
        ))}
      </div>

      <button disabled={!selected || saving} onClick={proceed} style={{
        width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, marginTop: 20,
        border: 'none', cursor: selected ? 'pointer' : 'default',
        background: selected ? 'linear-gradient(135deg, #FFC766, #D99B34)' : 'rgba(255,255,255,0.1)',
        color: selected ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
      }}>
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )
}

export default function PaxCheckinPage() {
  return (
    <Suspense fallback={<div className="pax-screen" style={{ alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid #FFC766', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <CheckinContent />
    </Suspense>
  )
}
