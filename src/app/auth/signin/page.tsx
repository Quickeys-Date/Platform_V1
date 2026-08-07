'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Please enter your email address and password.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        })

      if (authError) {
        setError('Invalid email or password.')
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        return
      }

      // This preference is deliberately separate from the Supabase auth
      // cookie. It controls whether opening the public QuiKeys URL later
      // should resume at Discover or show the landing page first.
      document.cookie = form.remember
        ? `quikeys-remember-me=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
        : 'quikeys-remember-me=; Path=/; Max-Age=0; SameSite=Lax'

      const { data: profile } = await supabase
        .from('profiles')
        .select('status, age_confirmed_at, profile_complete, pax_onboarded, role')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        window.location.href = '/auth/age-verification'
      } else if (profile.role === 'ADMIN' && profile.status === 'ACTIVE') {
        window.location.href = '/feed'
      } else if (profile.status === 'PENDING_EMAIL') {
        window.location.href = '/auth/age-verification'
      } else if (profile.status !== 'ACTIVE') {
        window.location.href = '/auth/pending-approval'
      } else if (!profile.profile_complete) {
        window.location.href = '/onboarding/welcome'
      } else if (!profile.pax_onboarded) {
        window.location.href = '/onboarding/welcome'
      } else {
        window.location.href = '/feed'
      }
    } catch {
      setError('Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="signin-page">
      <div className="signin-frame" aria-hidden="true" />

      <section className="signin-content">
        <div className="signin-logo">
          <Image
            src="/quikeys-logo.png"
            alt="QuiKeys heart and key logo"
            width={84}
            height={84}
            priority
          />
        </div>

        <header className="signin-heading">
          <h1>Welcome back</h1>

          <p>
            Log in to continue your QuiKeys journey
          </p>
        </header>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="signin-field">
            <label htmlFor="signin-email">
              Email address
            </label>

            <input
              id="signin-email"
              type="email"
              placeholder="name@email.com"
              autoComplete="email"
              disabled={loading}
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
            />
          </div>

          <div className="signin-field">
            <label htmlFor="signin-password">
              Password
            </label>

            <div className="signin-input-wrapper">
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
              />

              <button
                type="button"
                className="signin-eye"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
              >
                {showPassword ? '◉' : '◎'}
              </button>
            </div>
          </div>

          <div className="signin-options">
            <label className="signin-remember">
              <input
                type="checkbox"
                checked={form.remember}
                disabled={loading}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    remember: event.target.checked,
                  }))
                }
              />

              <span>Remember me</span>
            </label>

            <Link
              href="/auth/reset-password"
              className="signin-forgot"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="signin-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="signin-submit"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="signin-signup">
          New to QuiKeys?{' '}
          <Link href="/auth/signup">
            Create your account
          </Link>
        </p>

        <Link href="/" className="signin-home">
          ← Return home
        </Link>
      </section>
    </main>
  )
}
