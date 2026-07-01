'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import toast from 'react-hot-toast'

const RADII = ['25mi', '50mi', '100mi', 'Anywhere']
const INTERESTS = ['Men', 'Women', 'Everyone']

const S = {
  label: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 },
  value: { fontSize: 15, color: 'white', lineHeight: 1.5 },
  muted: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' as const },
  section: { padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  chip: (active: boolean) => ({
    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 as const, cursor: 'pointer' as const,
    border: `1.5px solid ${active ? '#0FB7BF' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(15,183,191,0.15)' : 'transparent',
    color: active ? '#0FB7BF' : 'rgba(255,255,255,0.5)',
  }),
}

export default function MyProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [form, setForm] = useState({
    bio: '', connection_prompt: '', age_range_min: 18, age_range_max: 45,
    location_radius: '25mi', interested_in: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data) return
        setProfile(data)
        setForm({
          bio: data.bio || '', connection_prompt: data.connection_prompt || '',
          age_range_min: data.age_range_min || 18, age_range_max: data.age_range_max || 45,
          location_radius: data.location_radius || '25mi', interested_in: data.interested_in || [],
        })
        loadPhotoUrls(data.photos || [])
      })
    })
  }, []) // eslint-disable-line

  const loadPhotoUrls = async (photos: string[]) => {
    const urls = await Promise.all(photos.map(async (path) => {
      const { data } = await supabase.storage.from('photos').createSignedUrl(path, 3600)
      return data?.signedUrl || ''
    }))
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
  }

  const save = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      bio: form.bio.trim() || null, connection_prompt: form.connection_prompt.trim() || null,
      age_range_min: form.age_range_min, age_range_max: form.age_range_max,
      location_radius: form.location_radius, interested_in: form.interested_in,
    }).eq('id', profile.id)
    if (error) { toast.error('Failed to save.'); setSaving(false); return }
    setProfile(p => p ? { ...p, ...form } : p)
    setEditing(false)
    toast.success('Profile updated.')
    setSaving(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', background: '#0A0A0A' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #0FB7BF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px',
        borderBottom: '1px solid rgba(15,183,191,0.1)',
        background: 'rgba(6,27,30,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => window.location.href = '/feed'} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>My Profile</span>
        <button onClick={() => editing ? save() : setEditing(true)} disabled={saving}
          style={{ color: editing ? '#FFC766' : '#0FB7BF', fontWeight: 700, fontSize: 14 }}>
          {editing ? (saving ? '…' : 'Save') : 'Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Identity */}
        <div style={{ ...S.section, display: 'flex', alignItems: 'center', gap: 14 }}>
          {photoUrls[0] ? (
            <img src={photoUrls[0]} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(15,183,191,0.4)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #043538, #0A6469)', border: '2px solid rgba(15,183,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#0FB7BF', flexShrink: 0 }}>
              {profile.first_name?.[0] || '?'}
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{profile.first_name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{profile.city}, {profile.state}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontStyle: 'italic' }}>
              First name, DOB and email cannot be changed here.
            </div>
          </div>
        </div>

        {/* Photos */}
        <div style={S.section}>
          <div style={S.label}>Photos (1–3)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {(profile.photos || []).map((_, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {photoUrls[i] ? <img src={photoUrls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 24 }}>📷</div>}
                {editing && <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', border: 'none', color: 'white', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>}
              </div>
            ))}
            {editing && (profile.photos || []).length < 3 && (
              <label style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed rgba(15,183,191,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,183,191,0.5)', fontSize: 12 }}>
                <span style={{ fontSize: 24 }}>+</span>
                <span style={{ marginTop: 4 }}>{uploading ? 'Uploading…' : 'Add'}</span>
                <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={S.section}>
          <div style={S.label}>Bio</div>
          {editing ? (
            <>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} maxLength={250} rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(15,183,191,0.2)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{form.bio.length}/250</div>
            </>
          ) : (
            <div style={profile.bio ? S.value : S.muted}>{profile.bio || 'No bio yet.'}</div>
          )}
        </div>

        {/* Connection prompt */}
        <div style={S.section}>
          <div style={S.label}>Connection Prompt</div>
          {editing ? (
            <>
              <textarea value={form.connection_prompt} onChange={e => setForm(p => ({ ...p, connection_prompt: e.target.value }))} maxLength={150} rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(15,183,191,0.2)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{form.connection_prompt.length}/150</div>
            </>
          ) : (
            <div style={profile.connection_prompt ? { ...S.value, fontStyle: 'italic' as const } : S.muted}>
              {profile.connection_prompt ? `"${profile.connection_prompt}"` : 'Not answered.'}
            </div>
          )}
        </div>

        {/* Interested in */}
        <div style={S.section}>
          <div style={S.label}>Interested In</div>
          {editing ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {INTERESTS.map(g => (
                <button key={g} onClick={() => setForm(p => ({ ...p, interested_in: p.interested_in.includes(g) ? p.interested_in.filter(x => x !== g) : [...p.interested_in, g] }))}
                  style={S.chip(form.interested_in.includes(g))}>
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div style={S.value}>{(profile.interested_in || []).join(', ') || '—'}</div>
          )}
        </div>

        {/* Age range */}
        <div style={S.section}>
          <div style={S.label}>Age Range: {editing ? form.age_range_min : profile.age_range_min}–{editing ? form.age_range_max : profile.age_range_max}</div>
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 24 }}>Min</span>
                <input type="range" min="18" max="60" value={form.age_range_min} step="1"
                  onChange={e => setForm(p => ({ ...p, age_range_min: Math.min(+e.target.value, p.age_range_max - 1) }))}
                  style={{ flex: 1, accentColor: '#0FB7BF' }} />
                <span style={{ fontSize: 13, color: 'white', fontWeight: 600, width: 24, textAlign: 'right' }}>{form.age_range_min}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 24 }}>Max</span>
                <input type="range" min="18" max="80" value={form.age_range_max} step="1"
                  onChange={e => setForm(p => ({ ...p, age_range_max: Math.max(+e.target.value, p.age_range_min + 1) }))}
                  style={{ flex: 1, accentColor: '#0FB7BF' }} />
                <span style={{ fontSize: 13, color: 'white', fontWeight: 600, width: 24, textAlign: 'right' }}>{form.age_range_max}</span>
              </div>
            </div>
          )}
        </div>

        {/* Distance */}
        <div style={S.section}>
          <div style={S.label}>Distance</div>
          {editing ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 4 }}>
              {RADII.map(r => (
                <button key={r} onClick={() => setForm(p => ({ ...p, location_radius: r }))} style={S.chip(form.location_radius === r)}>{r}</button>
              ))}
            </div>
          ) : (
            <div style={S.value}>{profile.location_radius}</div>
          )}
        </div>

        {/* Account */}
        <div style={S.section}>
          <div style={S.label}>Account</div>
          {[
            { label: 'Change password', icon: '🔒', action: async () => { await supabase.auth.resetPasswordForEmail(profile.email); toast.success('Password reset email sent.') } },
            { label: 'Request data deletion', icon: '📋', action: () => toast('Email ofelia@quickeysdating.com to request data deletion.', { duration: 6000 }) },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
            }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>→</span>
            </button>
          ))}
          <button onClick={() => setShowSignOut(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 0', background: 'transparent', cursor: 'pointer', textAlign: 'left',
          }}>
            <span>🚪</span>
            <span style={{ fontSize: 14, color: '#ff6b6b', fontWeight: 600 }}>Sign out</span>
          </button>
        </div>
      </div>

      {showSignOut && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={() => setShowSignOut(false)}>
          <div style={{ width: '100%', background: 'linear-gradient(160deg, #061B1E, #0A0A0A)', borderTop: '1px solid rgba(255,80,80,0.2)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8 }}>Sign out?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>You'll need to log in again to access your account.</p>
            <button onClick={signOut} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #c0392b, #e74c3c)', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', marginBottom: 10 }}>Sign Out</button>
            <button onClick={() => setShowSignOut(false)} style={{ width: '100%', padding: 12, background: 'transparent', color: 'rgba(255,255,255,0.35)', fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancel</button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  )
}
