'use client'
// src/app/auth/update-password/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8 || !/\d/.test(password)) {
      toast.error('Password must be at least 8 characters and include a number.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated!')
    router.push('/feed')
  }

  return (
    <div className="flex flex-col min-h-svh justify-center px-6">
      <h1 className="text-[28px] font-black tracking-tight mb-2">New password</h1>
      <p className="text-gray-500 mb-7">Choose a new password for your account.</p>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
        />
        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
