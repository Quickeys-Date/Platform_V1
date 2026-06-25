'use client'
// src/app/auth/signup/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', confirm: '', dob: '', terms: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address.'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!/\d/.test(form.password)) e.password = 'Password must include at least one number.'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.'
    if (!form.dob) { e.dob = 'Date of birth is required.' }
    else {
      const age = (Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 3600000)
      if (age < 18) e.dob = 'QuicKeys is for users 18 and older.'
    }
    if (!form.terms) e.terms = 'You must agree to the Terms of Service.'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setErrors({ email: 'An account with this email already exists.' })
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    // Create profile via server-side API route using service role key
    if (data.user) {
      const res = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: data.user.id, 
          email: form.email 
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('Profile creation failed:', err)
        // Don't block the user — they can still verify email
        // Profile will be created on first login if needed
      }
    }

    window.location.href = '/auth/verify?email=' + encodeURIComponent(form.email)
  }

  const f = (k: string) => (ev: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }))

  return (
    <div className="flex flex-col min-h-svh animate-fade-up">
      <div className="flex justify-between items-center px-5 pt-3 text-xs font-semibold">
        <span>9:41</span><span>●●● WiFi 🔋</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="mt-4 mb-7">
          <Link href="/" className="text-2xl">←</Link>
        </div>

        <h1 className="text-[28px] font-black tracking-tight mb-1">Create account</h1>
        <p className="text-gray-500 mb-7">Start your QuicKeys journey.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
              <input type="email" placeholder="Email address" value={form.email} onChange={f('email')}
                className="w-full pl-10 pr-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base focus:border-black" />
            </div>
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={f('password')}
                className="w-full pl-10 pr-12 py-4 border-[1.5px] border-gray-200 rounded-xl text-base focus:border-black" />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              <input type="password" placeholder="Confirm password" value={form.confirm} onChange={f('confirm')}
                className="w-full pl-10 pr-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base focus:border-black" />
            </div>
            {errors.confirm && <p className="text-red-600 text-sm mt-1">{errors.confirm}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of birth</label>
            <input type="date" value={form.dob} onChange={f('dob')}
              className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base focus:border-black" />
            {errors.dob && <p className="text-red-600 text-sm mt-1">{errors.dob}</p>}
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.terms}
                onChange={e => setForm(p => ({ ...p, terms: e.target.checked }))}
                className="accent-black" />
              <span className="text-sm text-gray-600">
                I agree to the <span className="text-black font-semibold underline">Terms of Service</span>
              </span>
            </label>
            {errors.terms && <p className="text-red-600 text-sm mt-1">{errors.terms}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base disabled:opacity-40">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-black font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
