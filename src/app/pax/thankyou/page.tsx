'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ThankYouContent() {
  const params = useSearchParams()
  const triggersParam = params.get('triggers') || ''
  const indexParam = parseInt(params.get('index') || '0', 10)
  const triggerType = params.get('type') || 'CLOSE_CONVERSATION'
  const triggerIds = triggersParam ? triggersParam.split(',').filter(Boolean) : []
  const nextIndex = indexParam + 1
  const hasMore = triggerType === 'INACTIVITY' && nextIndex < triggerIds.length

  return (
    <div className="pax-screen items-center justify-center text-center animate-fade-up">
      <div style={{ fontWeight: 900, fontSize: 18, color: '#FFC766', marginBottom: 32 }}>Pax™</div>
      <div style={{ fontSize: 48, marginBottom: 20 }}>✦</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 12 }}>Thank you.</h1>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 40px' }}>
        The goal isn't to get every interaction right. It's to understand them more clearly.
      </p>

      {hasMore ? (
        <button onClick={() => {
          const next = new URLSearchParams()
          next.set('triggers', triggersParam)
          next.set('index', String(nextIndex))
          next.set('type', triggerType)
          next.set('trigger_id', triggerIds[nextIndex])
          window.location.href = `/pax/checkin?${next.toString()}`
        }} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #FFC766, #D99B34)', color: '#0A0A0A', fontWeight: 700, fontSize: 15, borderRadius: 14, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          Next check-in
        </button>
      ) : null}

      <button onClick={() => window.location.href = '/feed'}
        style={{ width: '100%', padding: 16, background: hasMore ? 'transparent' : 'white', color: hasMore ? 'rgba(255,255,255,0.5)' : '#0A0A0A', fontWeight: hasMore ? 500 : 700, fontSize: 15, borderRadius: 14, border: hasMore ? '1px solid rgba(255,255,255,0.1)' : 'none', cursor: 'pointer' }}>
        Return to Connections
      </button>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="pax-screen items-center justify-center"><div style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <ThankYouContent />
    </Suspense>
  )
}
