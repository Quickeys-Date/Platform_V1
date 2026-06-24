'use client'
// src/app/admin/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authErr) { setError('Invalid admin credentials.'); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (!profile || profile.role !== 'ADMIN') {
      setError('Access denied. Admin credentials required.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
  }

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex justify-between items-center px-5 pt-3 text-xs font-semibold">
        <span>9:41</span><span>●●● WiFi 🔋</span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-10">
        <div className="text-center mb-10">
          <h1 className="text-[42px] font-black tracking-[-2.5px] mb-2">QuicKeys</h1>
          <p className="text-sm text-gray-500 font-medium">Admin Portal</p>
        </div>

        <div className="text-center mb-7">
          <h2 className="text-xl font-bold tracking-tight mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500">Log in to access the admin dashboard.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
            <input
              type="email" placeholder="Email"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              type={showPass ? 'text' : 'password'} placeholder="Password"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full pl-10 pr-12 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-black" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button type="button" className="text-sm font-semibold text-black">Forgot password?</button>
          </div>

          <div className="pt-1">
            <button type="submit" disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base disabled:opacity-40">
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="text-center mt-10 text-xs text-gray-400 leading-relaxed">
          QuicKeys Admin Portal<br />
          Secure access for authorized administrators only.
        </div>
      </div>
    </div>
  )
}
