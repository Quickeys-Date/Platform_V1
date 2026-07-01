'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']
const INTERESTS = ['Men', 'Women', 'Everyone']
const RADII = ['25mi', '50mi', '100mi', 'Anywhere']

const chip = (active: boolean) => ({
  padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600 as const, cursor: 'pointer' as const,
  border: `1.5px solid ${active ? '#0FB7BF' : 'rgba(255,255,255,0.1)'}`,
  background: active ? 'rgba(15,183,191,0.15)' : 'transparent',
  color: active ? '#0FB7BF' : 'rgba(255,255,255,0.5)',
})

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    firstName: '', bio: '', gender: '', interestedIn: [] as string[],
    city: '', state: '', ageMin: 18, ageMax: 45,
    radius: '25mi', connectionPrompt: '', photos: [] as string[], dob: ''
  })
  const supabase = createClient()

  const uploadPhoto = async (file: File) => {
    if (form.photos.length >= 3) { toast.error('Maximum 3 photos.'); return }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('JPG or PNG only.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB.'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (error) { toast.error('Upload failed.'); setUploading(false); return }
    const { data: signed } = await supabase.storage.from('photos').createSignedUrl(path, 3600)
    setForm(p => ({ ...p, photos: [...p.photos, path] }))
    if (signed?.signedUrl) setSignedUrls(u => ({ ...u, [path]: signed.signedUrl }))
    setUploading(false)
  }

  const removePhoto = async (path: string) => {
    await supabase.storage.from('photos').remove([path])
    setForm(p => ({ ...p, photos: p.photos.filter(ph => ph !== path) }))
  }

  const save = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      first_name: form.firstName.trim(),
      bio: form.bio.trim() || null,
      gender: form.gender,
      interested_in: form.interestedIn,
      city: form.city.trim(),
      state: form.state.trim(),
      age_range_min: form.ageMin,
      age_range_max: form.ageMax,
      location_radius: form.radius,
      connection_prompt: form.connectionPrompt.trim() || null,
      photos: form.photos,
      date_of_birth: form.dob || null,
      profile_complete: true,
    }).eq('id', user.id)

    if (error) { toast.error('Failed to save profile.'); setLoading(false); return }
    router.push('/onboarding/welcome')
  }

  const BG = { background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }
  const LABEL = { fontSize: 11, fontWeight: 700 as const, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10, display: 'block' }

  // Step 1 — Name + DOB
  if (step === 1) return (
    <div className="flex flex-col min-h-svh px-6 py-8" style={BG}>
      <div className="flex justify-center mb-8"><QuicKeysLogo size="sm" showWordmark={false} /></div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 5</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 4 }}>What's your name?</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>This is how you'll appear to other members.</p>

      <div className="space-y-4 flex-1">
        <div>
          <label style={LABEL}>First name</label>
          <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
            placeholder="First name only" className="input-dark" />
        </div>
        <div>
          <label style={LABEL}>Date of birth</label>
          <input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
            className="input-dark" />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Must be 18+. Not shown on your profile.</p>
        </div>
      </div>

      <button disabled={!form.firstName.trim() || !form.dob} onClick={() => setStep(2)} className="btn-gold mt-6">Continue →</button>
    </div>
  )

  // Step 2 — Gender + Interest
  if (step === 2) return (
    <div className="flex flex-col min-h-svh px-6 py-8" style={BG}>
      <button onClick={() => setStep(1)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, marginBottom: 20, textAlign: 'left' }}>←</button>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 5</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 28 }}>Tell us about yourself</h1>

      <div className="space-y-6 flex-1">
        <div>
          <label style={LABEL}>I am a…</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {GENDERS.map(g => <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))} style={chip(form.gender === g)}>{g}</button>)}
          </div>
        </div>
        <div>
          <label style={LABEL}>Interested in…</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {INTERESTS.map(g => (
              <button key={g} onClick={() => setForm(p => ({ ...p, interestedIn: p.interestedIn.includes(g) ? p.interestedIn.filter(x => x !== g) : [...p.interestedIn, g] }))}
                style={chip(form.interestedIn.includes(g))}>{g}</button>
            ))}
          </div>
        </div>
      </div>

      <button disabled={!form.gender || form.interestedIn.length === 0} onClick={() => setStep(3)} className="btn-gold mt-6">Continue →</button>
    </div>
  )

  // Step 3 — Location + Age
  if (step === 3) return (
    <div className="flex flex-col min-h-svh px-6 py-8" style={BG}>
      <button onClick={() => setStep(2)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, marginBottom: 20 }}>←</button>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Step 3 of 5</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 28 }}>Where are you?</h1>

      <div className="space-y-6 flex-1">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL}>City</label>
            <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="City" className="input-dark" />
          </div>
          <div>
            <label style={LABEL}>State</label>
            <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="State" className="input-dark" />
          </div>
        </div>
        <div>
          <label style={LABEL}>Distance</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {RADII.map(r => <button key={r} onClick={() => setForm(p => ({ ...p, radius: r }))} style={chip(form.radius === r)}>{r}</button>)}
          </div>
        </div>
        <div>
          <label style={LABEL}>Age range: {form.ageMin}–{form.ageMax}</label>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 24 }}>Min</span>
              <input type="range" min="18" max="60" value={form.ageMin} step="1"
                onChange={e => setForm(p => ({ ...p, ageMin: Math.min(+e.target.value, p.ageMax - 1) }))}
                style={{ flex: 1, accentColor: '#0FB7BF' }} />
              <span style={{ fontSize: 13, color: 'white', fontWeight: 600, width: 24 }}>{form.ageMin}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 24 }}>Max</span>
              <input type="range" min="18" max="80" value={form.ageMax} step="1"
                onChange={e => setForm(p => ({ ...p, ageMax: Math.max(+e.target.value, p.ageMin + 1) }))}
                style={{ flex: 1, accentColor: '#0FB7BF' }} />
              <span style={{ fontSize: 13, color: 'white', fontWeight: 600, width: 24 }}>{form.ageMax}</span>
            </div>
          </div>
        </div>
      </div>
      <button disabled={!form.city.trim() || !form.state.trim()} onClick={() => setStep(4)} className="btn-gold mt-6">Continue →</button>
    </div>
  )

  // Step 4 — Photos + Bio
  if (step === 4) return (
    <div className="flex flex-col min-h-svh px-6 py-8" style={BG}>
      <button onClick={() => setStep(3)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, marginBottom: 20 }}>←</button>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Step 4 of 5</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 28 }}>Add photos & bio</h1>

      <div className="space-y-6 flex-1">
        <div>
          <label style={LABEL}>Photos (up to 3)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {form.photos.map((path, i) => (
              <div key={path} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                {signedUrls[path] ? <img src={signedUrls[path]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>📷</div>}
                <button onClick={() => removePhoto(path)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
            {form.photos.length < 3 && (
              <label style={{ aspectRatio: '1', borderRadius: 12, border: '1.5px dashed rgba(15,183,191,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,183,191,0.5)', fontSize: 11 }}>
                <span style={{ fontSize: 24 }}>+</span>
                <span style={{ marginTop: 4 }}>{uploading ? '…' : 'Add photo'}</span>
                <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>
        <div>
          <label style={LABEL}>Bio (optional)</label>
          <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} maxLength={250} rows={4}
            placeholder="Tell people a bit about yourself…"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(15,183,191,0.2)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, resize: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>
      <button onClick={() => setStep(5)} className="btn-gold mt-6">Continue →</button>
    </div>
  )

  // Step 5 — Connection prompt
  return (
    <div className="flex flex-col min-h-svh px-6 py-8" style={BG}>
      <button onClick={() => setStep(4)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, marginBottom: 20 }}>←</button>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 5</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 8 }}>One last thing</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>What matters most to you in a connection? (Optional)</p>

      <textarea value={form.connectionPrompt} onChange={e => setForm(p => ({ ...p, connectionPrompt: e.target.value }))} maxLength={150} rows={5}
        placeholder="e.g. honesty, laughter, someone who shows up…"
        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(15,183,191,0.2)', borderRadius: 14, padding: '14px 16px', color: 'white', fontSize: 15, resize: 'none', fontFamily: 'inherit', flex: 1 }} />
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 6 }}>{form.connectionPrompt.length}/150</p>

      <button disabled={loading} onClick={save} className="btn-gold mt-6">
        {loading ? 'Saving…' : 'Complete Profile →'}
      </button>
    </div>
  )
}
