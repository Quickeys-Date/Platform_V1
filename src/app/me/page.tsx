'use client'
// src/app/me/page.tsx — S-18 User Profile
// Editable: photos, bio, connection_prompt, age_range, location_radius, interested_in
// Non-editable: first_name, date_of_birth, email (contact founders to change)
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import toast from 'react-hot-toast'

const RADII = ['25mi', '50mi', '100mi', 'Anywhere']
const INTERESTS = ['Men', 'Women', 'Everyone']

export default function MyProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [form, setForm] = useState({
    bio: '',
    connection_prompt: '',
    age_range_min: 18,
    age_range_max: 45,
    location_radius: '25mi',
    interested_in: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data) return
        setProfile(data)
        setForm({
          bio: data.bio || '',
          connection_prompt: data.connection_prompt || '',
          age_range_min: data.age_range_min || 18,
          age_range_max: data.age_range_max || 45,
          location_radius: data.location_radius || '25mi',
          interested_in: data.interested_in || [],
        })
        // Load signed URLs for photos
        loadPhotoUrls(data.photos || [])
      })
    })
  }, []) // eslint-disable-line

  const loadPhotoUrls = async (photos: string[]) => {
    const urls = await Promise.all(
      photos.map(async (path) => {
        const { data } = await supabase.storage.from('photos').createSignedUrl(path, 3600)
        return data?.signedUrl || ''
      })
    )
    setPhotoUrls(urls.filter(Boolean))
  }

  const uploadPhoto = async (file: File) => {
    if (!profile) return
    if ((profile.photos || []).length >= 3) { toast.error('Maximum 3 photos.'); return }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('JPG or PNG only.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB per photo.'); return }

    setUploading(true)
    const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const path = `${profile.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (error) { toast.error('Upload failed.'); setUploading(false); return }

    const newPhotos = [...(profile.photos || []), path]
    await supabase.from('profiles').update({ photos: newPhotos }).eq('id', profile.id)
    setProfile(p => p ? { ...p, photos: newPhotos } : p)
    await loadPhotoUrls(newPhotos)
    setUploading(false)
    toast.success('Photo added.')
  }

  const removePhoto = async (index: number) => {
    if (!profile) return
    const path = profile.photos[index]
    await supabase.storage.from('photos').remove([path])
    const newPhotos = profile.photos.filter((_, i) => i !== index)
    await supabase.from('profiles').update({ photos: newPhotos }).eq('id', profile.id)
    setProfile(p => p ? { ...p, photos: newPhotos } : p)
    setPhotoUrls(u => u.filter((_, i) => i !== index))
    toast.success('Photo removed.')
  }

  const toggleInterest = (v: string) => {
    setForm(p => ({
      ...p,
      interested_in: p.interested_in.includes(v) ? p.interested_in.filter(x => x !== v) : [...p.interested_in, v]
    }))
  }

  const save = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      bio: form.bio.trim() || null,
      connection_prompt: form.connection_prompt.trim() || null,
      age_range_min: form.age_range_min,
      age_range_max: form.age_range_max,
      location_radius: form.location_radius,
      interested_in: form.interested_in,
    }).eq('id', profile.id)

    if (error) { toast.error('Failed to save.'); setSaving(false); return }
    setProfile(p => p ? { ...p, ...form, bio: form.bio || null, connection_prompt: form.connection_prompt || null } : p)
    setEditing(false)
    toast.success('Profile updated.')
    setSaving(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const changePassword = async () => {
    if (!profile) return
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email)
    if (error) { toast.error(error.message); return }
    toast.success('Password reset email sent.')
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.push('/feed')} className="text-xl">←</button>
        <h1 className="font-bold text-base">My Profile</h1>
        <button onClick={() => editing ? save() : setEditing(true)}
          className="font-semibold text-sm" disabled={saving}>
          {editing ? (saving ? '…' : 'Save') : 'Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Identity — non-editable fields */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-3">
            {photoUrls[0] ? (
              <img src={photoUrls[0]} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">👤</div>
            )}
            <div>
              <h2 className="text-xl font-black tracking-tight">{profile.first_name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{profile.city}, {profile.state} · Age {profile.age}</p>
            </div>
          </div>
          {/* Non-editable notice per spec */}
          <p className="text-xs text-gray-400 italic">
            First name, date of birth, and email cannot be changed here.{' '}
            <a href="mailto:ofelia@quickeysdating.com" className="underline">Contact founders</a> to update.
          </p>
        </div>

        {/* Photos — editable: add/remove within 1-3 limit */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Photos (1–3)</h2>
          <div className="grid grid-cols-3 gap-3">
            {(profile.photos || []).map((_, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                {photoUrls[i] ? (
                  <img src={photoUrls[i]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">📷</div>
                )}
                {editing && (
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center">
                    ×
                  </button>
                )}
              </div>
            ))}
            {editing && (profile.photos || []).length < 3 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                <span className="text-2xl text-gray-300">+</span>
                <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading…' : 'Add'}</span>
                <input type="file" accept="image/jpeg,image/png" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bio</h2>
          {editing ? (
            <>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                maxLength={250} rows={4}
                className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm resize-none" />
              <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/250</p>
            </>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">
              {profile.bio || <span className="text-gray-400">No bio yet.</span>}
            </p>
          )}
        </div>

        {/* Connection prompt */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Connection prompt</h2>
          {editing ? (
            <>
              <textarea value={form.connection_prompt} onChange={e => setForm(p => ({ ...p, connection_prompt: e.target.value }))}
                maxLength={150} rows={3}
                className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm resize-none" />
              <p className="text-xs text-gray-400 text-right mt-1">{form.connection_prompt.length}/150</p>
            </>
          ) : (
            <p className="text-gray-700 text-sm italic leading-relaxed">
              {profile.connection_prompt ? `"${profile.connection_prompt}"` : <span className="not-italic text-gray-400">Not answered.</span>}
            </p>
          )}
        </div>

        {/* Interested in — editable */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Interested in</h2>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(g => (
                <button key={g} onClick={() => toggleInterest(g)}
                  className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-colors
                    ${form.interested_in.includes(g) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}>
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-sm">{(profile.interested_in || []).join(', ') || '—'}</p>
          )}
        </div>

        {/* Age range — editable */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Age range: {editing ? form.age_range_min : profile.age_range_min}–{editing ? form.age_range_max : profile.age_range_max}
          </h2>
          {editing && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">Min</span>
                <input type="range" min="18" max="60" value={form.age_range_min} step="1"
                  onChange={e => setForm(p => ({ ...p, age_range_min: Math.min(+e.target.value, p.age_range_max - 1) }))}
                  className="flex-1 accent-black" />
                <span className="text-sm font-medium w-6 text-right">{form.age_range_min}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">Max</span>
                <input type="range" min="18" max="80" value={form.age_range_max} step="1"
                  onChange={e => setForm(p => ({ ...p, age_range_max: Math.max(+e.target.value, p.age_range_min + 1) }))}
                  className="flex-1 accent-black" />
                <span className="text-sm font-medium w-6 text-right">{form.age_range_max}</span>
              </div>
            </div>
          )}
        </div>

        {/* Location radius — editable */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Distance</h2>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {RADII.map(r => (
                <button key={r} onClick={() => setForm(p => ({ ...p, location_radius: r }))}
                  className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-colors
                    ${form.location_radius === r ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}>
                  {r}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-sm">{profile.location_radius}</p>
          )}
        </div>

        {/* Account actions */}
        <div className="px-5 py-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account</h2>
          {[
            { label: 'Change password', icon: '🔒', action: changePassword },
            { label: 'Request data deletion', icon: '📋', action: () => toast('Email ofelia@quickeysdating.com to request data deletion.', { duration: 6000, icon: '📧' }) },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="w-full flex items-center gap-3 py-3.5 border-b border-gray-100 text-left">
              <span>{item.icon}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-gray-300 text-sm">→</span>
            </button>
          ))}
          <button onClick={() => setShowSignOut(true)}
            className="w-full flex items-center gap-3 py-3.5 text-left mt-2">
            <span>🚪</span>
            <span className="text-sm text-red-500 font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {showSignOut && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSignOut(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="font-bold text-lg mb-2">Sign out?</h2>
            <p className="text-gray-500 text-sm mb-6">You'll need to log in again to access your account.</p>
            <button onClick={signOut} className="w-full py-4 rounded-xl font-semibold bg-red-500 text-white mb-3">Sign Out</button>
            <button onClick={() => setShowSignOut(false)} className="w-full py-3 text-gray-500 font-medium">Cancel</button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  )
}
