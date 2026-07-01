'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
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
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div style={{ padding: '16px 20px' }}>
        <a href="/auth/signin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-8"><QuicKeysLogo size="sm" showWordmark={false} /></div>

        {sent ? (
          <div className="text-center">
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Check your email</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              We sent a password reset link to <span style={{ color: '#FFC766' }}>{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 8, alignSelf: 'flex-start' }}>Reset password</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, alignSelf: 'flex-start' }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={submit} style={{ width: '100%' }}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark" style={{ marginBottom: 16 }} />
              <button type="submit" disabled={loading || !email} className="btn-gold">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
