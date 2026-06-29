'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', confirm: '', dob: '', terms: false })
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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'An account with this email already exists.' })
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email: form.email }),
      })
    }

    window.location.href = '/auth/verify?email=' + encodeURIComponent(form.email)
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div className="status-bar"><span>9:41</span><span>●●● WiFi 🔋</span></div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="mt-4 mb-6">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</Link>
        </div>

        <div className="flex justify-center mb-6">
          <QuicKeysLogo size="sm" showWordmark={false} />
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 6 }}>
          Create your account
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>
          Start your QuicKeys journey.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-dark" />
            {errors.email && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-dark pr-12" />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
          </div>

          <div>
            <input type="password" placeholder="Confirm password" value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              className="input-dark" />
            {errors.confirm && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{errors.confirm}</p>}
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Date of Birth
            </label>
            <input type="date" value={form.dob}
              onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
              className="input-dark" />
            {errors.dob && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{errors.dob}</p>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer" style={{ paddingTop: 4 }}>
            <input type="checkbox" checked={form.terms}
              onChange={e => setForm(p => ({ ...p, terms: e.target.checked }))}
              style={{ accentColor: '#0FB7BF', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              I agree to the{' '}
              <span style={{ color: '#FFC766', fontWeight: 600 }}>Terms of Service</span>
            </span>
          </label>
          {errors.terms && <p style={{ color: '#ff6b6b', fontSize: 12 }}>{errors.terms}</p>}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-gold">
              {loading ? 'Creating account…' : 'Create Your Profile →'}
            </button>
          </div>
        </form>

        <p className="text-center mt-6" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: '#FFC766', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
