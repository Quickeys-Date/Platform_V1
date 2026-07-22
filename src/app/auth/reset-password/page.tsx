'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!email.trim()) return

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/update-password`,
      }
    )

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main className="reset-page">
      <Link
        href="/auth/signin"
        className="reset-back"
        aria-label="Return to login"
      >
        ←
      </Link>

      <section className="reset-card">
        <div className="reset-logo">
          <QuicKeysLogo size="sm" showWordmark={false} />
        </div>

        {sent ? (
          <div className="reset-success" aria-live="polite">
            <div className="reset-success-symbol" aria-hidden="true">
              ✓
            </div>

            <h1 className="reset-title">Check your email</h1>

            <p className="reset-description">
              We sent a password reset link to{' '}
              <span className="reset-email">{email}</span>.
            </p>

            <Link href="/auth/signin" className="reset-return-link">
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <div className="reset-introduction">
              <p className="reset-eyebrow">Account recovery</p>

              <h1 className="reset-title">Reset password</h1>

              <p className="reset-description">
                Enter your email address and we&apos;ll send you a secure
                password reset link.
              </p>
            </div>

            <form onSubmit={submit} className="reset-form">
              <div className="reset-field">
                <label htmlFor="reset-email" className="reset-label">
                  Email address
                </label>

                <input
                  id="reset-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="input-dark reset-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-gold reset-submit"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="reset-alternate">
              Remember your password?{' '}
              <Link href="/auth/signin">Log in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}