'use client'
// src/app/auth/verify/page.tsx — S-03 Email Verification
// Required before user can access the app.
// Expired or used links show: "This link has expired. Please request a new one."
// Resend available after 60 seconds.
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const email = params.get('email') || 'your email'

  // Supabase passes error info in the URL hash when a link is expired/invalid
  const errorCode = params.get('error_code') || ''
  const errorDesc = params.get('error_description') || ''
  const isExpiredLink = errorCode === 'otp_expired' ||
    errorDesc.toLowerCase().includes('expired') ||
    errorDesc.toLowerCase().includes('invalid')

  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)

  const startTimer = () => {
    setTimer(60)
    setCanResend(false)
    const t = setInterval(() => {
      setTimer(p => {
        if (p <= 1) { setCanResend(true); clearInterval(t); return 0 }
        return p - 1
      })
    }, 1000)
    return t
  }

  useEffect(() => {
    const t = startTimer()
    return () => clearInterval(t)
  }, []) // eslint-disable-line

  // Listen for successful verification
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        router.push('/onboarding/profile')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const resend = async () => {
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) { toast.error(error.message); setResending(false); return }
    toast.success('Verification email resent!')
    setResending(false)
    startTimer()
  }

  // S-03: Expired or used links show this exact message
  if (isExpiredLink) {
    return (
      <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center animate-fade-up">
        <div className="text-5xl mb-5">⚠️</div>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Link expired</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          This link has expired. Please request a new one.
        </p>
        <button
          onClick={resend}
          disabled={resending}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40"
        >
          {resending ? 'Sending…' : 'Request new verification email'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center animate-fade-up">
      <div className="text-5xl mb-5">📬</div>
      <h1 className="text-2xl font-bold tracking-tight mb-3">Check your inbox</h1>
      <p className="text-gray-500 leading-relaxed mb-4">
        We sent a verification link to{' '}
        <strong className="text-black">{email}</strong>.{' '}
        Please check your inbox and verify your account to continue.
      </p>
      {/* S-03: verification link single use, expires after 24 hours */}
      <p className="text-sm text-gray-400 mb-8">
        Verification link expires after 24 hours.
      </p>
      <div>
        {/* S-03: resend available after 60 seconds */}
        {canResend ? (
          <button
            onClick={resend}
            disabled={resending}
            className="text-black font-semibold text-sm underline disabled:opacity-40"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
        ) : (
          <p className="text-sm text-gray-400">Resend available in {timer}s</p>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-svh">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
