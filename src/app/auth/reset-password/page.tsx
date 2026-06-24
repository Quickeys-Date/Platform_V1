'use client'
// src/app/auth/reset-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
  }

  if (sent) return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center">
      <div className="text-5xl mb-5">📧</div>
      <h1 className="text-2xl font-bold mb-3">Check your email</h1>
      <p className="text-gray-500 mb-8">We sent a password reset link to <strong className="text-black">{email}</strong>.</p>
      <Link href="/auth/signin" className="text-black font-semibold">Back to Sign In</Link>
    </div>
  )

  return (
    <div className="flex flex-col min-h-svh">
      <div className="px-5 pt-5 mb-6"><Link href="/auth/signin" className="text-xl">←</Link></div>
      <div className="flex-1 px-6">
        <h1 className="text-[28px] font-black tracking-tight mb-2">Reset password</h1>
        <p className="text-gray-500 mb-7">We'll send you a link to reset your password.</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="w-full pl-10 pr-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base" />
          </div>
          <button type="submit" disabled={loading || !email}
            className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40">
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
