'use client'
// src/app/pax/response/page.tsx — S-14 Pax Response
// V1 RULE: responses displayed verbatim — no AI modification permitted.
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PAX_RESPONSES } from '@/lib/pax'

function ResponseContent() {
  const router = useRouter()
  const params = useSearchParams()

  const stateId = params.get('state') || 'PAX_NEUTRAL'
  const triggerId = params.get('trigger_id') || ''
  const triggersParam = params.get('triggers') || ''
  const indexParam = params.get('index') || '0'
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'

  const response = PAX_RESPONSES[stateId] || PAX_RESPONSES['PAX_NEUTRAL']

  const proceed = () => {
    const nextParams = new URLSearchParams()
    nextParams.set('trigger_id', triggerId)
    nextParams.set('state', stateId)
    if (triggerType === 'INACTIVITY') {
      nextParams.set('triggers', triggersParam)
      nextParams.set('index', indexParam)
      nextParams.set('type', 'INACTIVITY')
    }
    router.push(`/pax/feedback?${nextParams.toString()}`)
  }

  return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {response.emoji} {response.label}
        </div>
        {/* Clean readable text, no icons, no images, no formatting beyond paragraphs — spec */}
        <div className="rounded-xl p-6"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <p className="text-lg leading-relaxed tracking-tight text-white">
            {response.text}
          </p>
        </div>
      </div>

      <button onClick={proceed}
        className="w-full py-4 rounded-xl font-semibold text-base bg-white text-black mt-8">
        Continue
      </button>
    </div>
  )
}

export default function PaxResponsePage() {
  return (
    <Suspense fallback={
      <div className="pax-screen items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResponseContent />
    </Suspense>
  )
}
