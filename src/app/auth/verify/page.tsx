'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get('email') || 'your email'
  const errorCode = params.get('error_code') || ''
  const isExpired = errorCode === 'otp_expired'
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [cooldown])

  const resend = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { toast.error('Failed to resend. Try again.'); return }
    toast.success('Verification email sent!')
    setCooldown(60)
  }

  return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div className="mb-8"><QuicKeysLogo size="md" showWordmark={false} /></div>

      {isExpired ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏱</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Link expired</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 28 }}>
            This verification link has expired. Request a new one below.
          </p>
          <button onClick={resend} disabled={cooldown > 0} style={{
            width: '100%', padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: cooldown > 0 ? 'default' : 'pointer', border: 'none',
            background: cooldown > 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #FFC766, #D99B34)',
            color: cooldown > 0 ? 'rgba(255,255,255,0.3)' : '#0A0A0A',
          }}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Check your email</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 28 }}>
            We sent a verification link to <span style={{ color: '#FFC766', fontWeight: 600 }}>{email}</span>. Click it to activate your account.
          </p>
          <button onClick={resend} disabled={cooldown > 0} style={{
            width: '100%', padding: 14, borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: cooldown > 0 ? 'default' : 'pointer',
            background: 'transparent', border: '1.5px solid rgba(15,183,191,0.3)',
            color: cooldown > 0 ? 'rgba(255,255,255,0.2)' : '#0FB7BF',
          }}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          </button>
        </>
      )}

      <a href="/auth/signin" style={{ display: 'block', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
        Back to sign in
      </a>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '2px solid #0FB7BF', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <VerifyContent />
    </Suspense>
  )
}
