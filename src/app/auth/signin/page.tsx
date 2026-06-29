'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError('Invalid email or password.'); setLoading(false); return }
    if (!data.user) { setError('Login failed. Please try again.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_complete, pax_onboarded, role')
      .eq('id', data.user.id)
      .single()

    if (!profile || profile.role === undefined) {
      window.location.href = '/onboarding/profile'
    } else if (profile.role === 'ADMIN') {
      window.location.href = '/admin/dashboard'
    } else if (!profile.profile_complete) {
      window.location.href = '/onboarding/profile'
    } else if (!profile.pax_onboarded) {
      window.location.href = '/onboarding/pax'
    } else {
      window.location.href = '/feed'
    }
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div className="status-bar"><span>9:41</span><span>●●● WiFi 🔋</span></div>

      <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        <div className="mb-6">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</Link>
        </div>

        <div className="flex justify-center mb-8">
          <QuicKeysLogo size="md" showWordmark={false} />
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 28, fontSize: 15 }}>
          Log in to access your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" placeholder="Email address"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="input-dark"
          />
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} placeholder="Password"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="input-dark pr-12"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}

          <div className="flex justify-between items-center py-1">
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Remember me</span>
            <Link href="/auth/reset-password" style={{ fontSize: 13, color: '#0FB7BF', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-gold">
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </form>

        <p className="text-center mt-8" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          New to QuicKeys?{' '}
          <Link href="/auth/signup" style={{ color: '#FFC766', fontWeight: 600 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
