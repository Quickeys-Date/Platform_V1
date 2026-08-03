'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PAX_RESPONSES } from '@/lib/pax'
import { PaxMark } from '@/components/PaxMark'

function ResponseContent() {
  const router = useRouter()
  const params = useSearchParams()
  const stateId = params.get('state') || 'PAX_NEUTRAL'
  const triggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = params.get('index') || '0'
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const response = PAX_RESPONSES[stateId] || PAX_RESPONSES['PAX_NEUTRAL']

  const changeEmotion = () => {
    const previous = new URLSearchParams()
    previous.set('state', stateId)
    previous.set('trigger_id', triggerId)
    previous.set('type', triggerType)
    if (triggersParam) previous.set('triggers', triggersParam)
    previous.set('index', indexParam)
    router.push(`/pax/checkin?${previous.toString()}`)
  }

  const proceed = () => {
    const next = new URLSearchParams()
    next.set('trigger_id', triggerId)
    next.set('type', triggerType)
    next.set('state', stateId)
    next.set('triggers', triggersParam)
    next.set('index', indexParam)
    router.push(`/pax/feedback?${next.toString()}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      <PaxMark style={{ marginBottom: 24 }} />
      <button onClick={changeEmotion} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 10, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>← Change emotion</button>
      <div className="flex-1 flex flex-col justify-center">
        <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 16, padding: '24px 20px' }}>
          {response.text.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: 17, lineHeight: 1.65, color: 'white', marginTop: i > 0 ? 16 : 0 }}>{para}</p>
          ))}
        </div>
      </div>
      <button className="pax-flow-primary" onClick={proceed}>
        Continue
      </button>
    </div>
  )
}

export default function PaxResponsePage() {
  return (
    <Suspense fallback={<div className="pax-screen items-center justify-center"><div style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <ResponseContent />
    </Suspense>
  )
}
