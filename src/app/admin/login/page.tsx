'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import styles from './page.module.css'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })

      if (authError || !data.user) {
        setError('The email or password is incorrect.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single()

      if (!profile || profile.role !== 'ADMIN' || profile.status !== 'ACTIVE') {
        setError('This account does not have active administrator access.')
        await supabase.auth.signOut()
        return
      }

      window.location.href = '/admin/dashboard'
    } catch {
      setError('The admin portal is temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <Link href="/" className={styles.backLink}>← Return to QuiKeys</Link>

      <section className={styles.card} aria-labelledby="admin-login-title">
        <header className={styles.header}>
          <QuicKeysLogo size="md" showWordmark />
          <span className={styles.portalBadge}>Authorized access</span>
          <h1 id="admin-login-title">Admin Portal</h1>
          <p>Review beta applications and manage the QuiKeys experience.</p>
        </header>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="admin-email">Email address</label>
            <div className={styles.inputWrap}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/></svg>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@quikeys.com"
                value={form.email}
                disabled={loading}
                required
                onChange={event => setForm(previous => ({ ...previous, email: event.target.value }))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="admin-password">Password</label>
            <div className={styles.inputWrap}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                disabled={loading}
                required
                onChange={event => setForm(previous => ({ ...previous, password: event.target.value }))}
              />
              <button type="button" className={styles.visibility} onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.submit} disabled={loading}>
            <span>{loading ? 'Signing in…' : 'Sign in to Admin Portal'}</span>
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <footer className={styles.footer}>
          <span className={styles.lock} aria-hidden="true">◇</span>
          <p><strong>Private and secure</strong><br />Access is limited to authorized QuiKeys administrators.</p>
        </footer>
      </section>
    </main>
  )
}
