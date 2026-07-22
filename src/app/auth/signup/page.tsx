'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    dob: '',
    terms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    } else if (!/\d/.test(form.password)) {
      nextErrors.password =
        'Password must include at least one number.'
    }

    if (form.password !== form.confirm) {
      nextErrors.confirm = 'Passwords do not match.'
    }

    if (!form.dob) {
      nextErrors.dob = 'Date of birth is required.'
    } else {
      const birthDate = new Date(form.dob)
      const today = new Date()

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDifference =
        today.getMonth() - birthDate.getMonth()

      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          today.getDate() < birthDate.getDate())
      ) {
        age -= 1
      }

      if (age < 18) {
        nextErrors.dob =
          'QuicKeys is for users 18 and older.'
      }
    }

    if (!form.terms) {
      nextErrors.terms =
        'You must agree to the Terms of Service.'
    }

    return nextErrors
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({
            email:
              'An account with this email already exists.',
          })
        } else {
          toast.error(error.message)
        }

        return
      }

      if (data.user) {
        const profileResponse = await fetch(
          '/api/profiles/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: data.user.id,
              email: form.email.trim(),
            }),
          }
        )

        if (!profileResponse.ok) {
          toast.error(
            'Your account was created, but the profile could not be initialized.'
          )
          return
        }
      }

      window.location.href =
        '/auth/verify?email=' +
        encodeURIComponent(form.email.trim())
    } catch {
      toast.error(
        'Unable to create your account. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="signup-page">
      <div className="signup-frame" aria-hidden="true" />

      <section className="signup-content">
        <div className="signup-logo">
          <Image
            src="/quickeys-icon.png"
            alt="QuicKeys"
            width={84}
            height={84}
            priority
          />
        </div>

        <header className="signup-heading">
          <h1>Create your account</h1>
          <p>Start your QuicKeys journey</p>
        </header>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="signup-field">
            <label htmlFor="signup-email">
              Email address
            </label>

            <input
              id="signup-email"
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

            {errors.email && (
              <p className="signup-error">{errors.email}</p>
            )}
          </div>

          <div className="signup-field">
            <label htmlFor="signup-password">
              Password
            </label>

            <div className="signup-input-wrapper">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                autoComplete="new-password"
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
                className="signup-eye"
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

            {errors.password && (
              <p className="signup-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="signup-field">
            <label htmlFor="signup-confirm">
              Confirm password
            </label>

            <div className="signup-input-wrapper">
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={loading}
                value={form.confirm}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    confirm: event.target.value,
                  }))
                }
              />

              <button
                type="button"
                className="signup-eye"
                aria-label={
                  showConfirm
                    ? 'Hide confirmation password'
                    : 'Show confirmation password'
                }
                onClick={() =>
                  setShowConfirm((previous) => !previous)
                }
              >
                {showConfirm ? '◉' : '◎'}
              </button>
            </div>

            {errors.confirm && (
              <p className="signup-error">
                {errors.confirm}
              </p>
            )}
          </div>

          <div className="signup-field">
            <label htmlFor="signup-dob">
              Date of birth
            </label>

            <input
              id="signup-dob"
              type="date"
              autoComplete="bday"
              disabled={loading}
              value={form.dob}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  dob: event.target.value,
                }))
              }
            />

            {errors.dob && (
              <p className="signup-error">{errors.dob}</p>
            )}
          </div>

          <div>
            <label className="signup-terms">
              <input
                type="checkbox"
                checked={form.terms}
                disabled={loading}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    terms: event.target.checked,
                  }))
                }
              />

              <span>
                I agree to the{' '}
                <Link href="/terms">
                  Terms of Service
                </Link>
              </span>
            </label>

            {errors.terms && (
              <p className="signup-error signup-terms-error">
                {errors.terms}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading
              ? 'Creating account…'
              : 'Create your profile →'}
          </button>
        </form>

        <p className="signup-login">
          Already have an account?{' '}
          <Link href="/auth/signin">Log in</Link>
        </p>
      </section>
    </main>
  )
}