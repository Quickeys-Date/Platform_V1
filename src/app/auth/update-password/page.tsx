'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import toast from 'react-hot-toast'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match.'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated!')
    window.location.href = '/feed'
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-8"><QuicKeysLogo size="sm" showWordmark={false} /></div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 8, alignSelf: 'flex-start' }}>New password</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, alignSelf: 'flex-start' }}>
          Set your new password below.
        </p>
        <form onSubmit={submit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" placeholder="New password" value={password}
            onChange={e => setPassword(e.target.value)} className="input-dark" />
          <input type="password" placeholder="Confirm password" value={confirm}
            onChange={e => setConfirm(e.target.value)} className="input-dark" />
          <div style={{ paddingTop: 8 }}>
            <button type="submit" disabled={loading || !password || !confirm} className="btn-gold">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
