'use client'
// src/app/auth/signin/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: false })
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

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Fetch profile to determine where to redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_complete, pax_onboarded, role')
      .eq('id', data.user.id)
      .single()

    // Use window.location.href for hard navigation so session cookie
    // is guaranteed to be sent with the next request
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
    <div className="flex flex-col min-h-svh animate-fade-up">
      <div className="flex justify-between items-center px-5 pt-3 text-xs font-semibold">
        <span>9:41</span><span>●●● WiFi 🔋</span>
      </div>

      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="mb-7">
          <Link href="/" className="text-2xl">←</Link>
        </div>

        <h1 className="text-[28px] font-black tracking-tight mb-1">Welcome back</h1>
        <p className="text-gray-500 mb-7">Log in to access your account.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full pl-10 pr-12 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={e => setForm(p => ({ ...p, remember: e.target.checked }))}
                className="accent-black"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link href="/auth/reset-password" className="text-sm font-semibold text-black">
              Forgot password?
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base disabled:opacity-40"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          New to QuicKeys?{' '}
          <Link href="/auth/signup" className="text-black font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  )
}
