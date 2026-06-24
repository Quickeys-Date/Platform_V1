'use client'
// src/app/pax/thankyou/page.tsx — S-16 Thank You
// Copy locked. Handles sequential inactivity triggers — if more pending, fires next one.
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ThankYouContent() {
  const router = useRouter()
  const params = useSearchParams()

  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'

  const triggerIds = triggersParam ? triggersParam.split(',').filter(Boolean) : []
  const nextIndex = indexParam + 1
  const hasMore = triggerType === 'INACTIVITY' && nextIndex < triggerIds.length

  const handleReturn = () => {
    if (hasMore) {
      // Fire next inactivity trigger in sequence — per spec: fires for each in sequence
      router.push(`/pax/checkin?triggers=${encodeURIComponent(triggersParam)}&index=${nextIndex}&type=INACTIVITY`)
    } else {
      router.push('/feed')
    }
  }

  return (
    <div className="pax-screen animate-fade-up" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="font-black text-lg mb-10 self-start" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Exact locked copy — do not alter without founder approval */}
        <h1 className="text-3xl font-black tracking-tight mb-6 text-white">Thank you.</h1>
        <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          The goal isn't to get every interaction right.<br />
          It's to understand them more clearly.
        </p>
      </div>
      {/* Button text exact per spec */}
      <button onClick={handleReturn}
        className="w-full py-4 rounded-xl font-semibold text-base bg-white text-black">
        Return to Connections
      </button>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="pax-screen items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}
