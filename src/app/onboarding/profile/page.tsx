'use client'
// src/app/onboarding/profile/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']
const INTERESTS = ['Men', 'Women', 'Everyone']
const RADII = ['25mi', '50mi', '100mi', 'Anywhere']

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    firstName: '', bio: '', gender: '', interestedIn: [] as string[],
    city: '', state: '', ageMin: 18, ageMax: 45,
    radius: '25mi', connectionPrompt: '', photos: [] as string[]
  })

  const supabase = createClient()

  const uploadPhoto = async (file: File) => {
    if (form.photos.length >= 3) { toast.error('Maximum 3 photos allowed.'); return }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('JPG or PNG only.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB.'); return }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (error) { toast.error('Upload failed.'); setUploading(false); return }

    // Signed URL for preview — never use public URL per security spec
    const { data: signed } = await supabase.storage.from('photos').createSignedUrl(path, 3600)
    if (signed?.signedUrl) {
      setSignedUrls(prev => ({ ...prev, [path]: signed.signedUrl }))
    }
    setForm(p => ({ ...p, photos: [...p.photos, path] }))
    setUploading(false)
  }

  const removePhoto = async (path: string) => {
    await supabase.storage.from('photos').remove([path])
    setSignedUrls(prev => { const n = { ...prev }; delete n[path]; return n })
    setForm(p => ({ ...p, photos: p.photos.filter(x => x !== path) }))
  }

  const getPhotoUrl = (path: string): string => signedUrls[path] || ''

  const toggleInterest = (v: string) => {
    setForm(p => ({
      ...p,
      interestedIn: p.interestedIn.includes(v)
        ? p.interestedIn.filter(x => x !== v)
        : [...p.interestedIn, v]
    }))
  }

  const canProceedStep1 = form.firstName.trim() && form.photos.length >= 1
  const canProceedStep2 = form.gender && form.interestedIn.length > 0 && form.city.trim() && form.state.trim()

  const finish = async () => {
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
      profile_complete: true,
    }).eq('id', user.id)

    if (error) { toast.error('Failed to save profile.'); setLoading(false); return }
    router.push('/onboarding/welcome')
  }

  return (
    <div className="flex flex-col min-h-svh animate-fade-up">
      <div className="flex justify-between items-center px-5 pt-3 text-xs font-semibold">
        <span>9:41</span><span>●●● WiFi 🔋</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => step === 2 ? setStep(1) : router.push('/')} className="text-xl">←</button>
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: `${step * 50}%` }} />
        </div>
        <span className="text-xs text-gray-400 font-medium">{step}/2</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-black tracking-tight mb-1 mt-2">Build your profile</h1>
            <p className="text-gray-500 mb-6">Let people know who you are.</p>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First name *</label>
              <input
                type="text"
                placeholder="Your first name"
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                maxLength={30}
                className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos * (1–3)</label>
              <div className="grid grid-cols-3 gap-3">
                {form.photos.map((path, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={getPhotoUrl(path)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(path)}
                      className="absolute top-1.5 right-1.5 bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >×</button>
                  </div>
                ))}
                {form.photos.length < 3 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors bg-gray-50">
                    <span className="text-2xl text-gray-300">+</span>
                    <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading…' : 'Add photo'}</span>
                    <input type="file" accept="image/jpeg,image/png" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">JPG or PNG only. Max 5MB each.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio (optional)</label>
              <textarea
                placeholder="Tell people a bit about yourself…"
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                maxLength={250}
                rows={4}
                className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-base resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.bio.length}/250</p>
            </div>

            <button
              disabled={!canProceedStep1 || uploading}
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-black tracking-tight mb-1 mt-2">Your preferences</h1>
            <p className="text-gray-500 mb-6">Help us find the right connections.</p>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map(g => (
                  <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                    className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-colors ${form.gender === g ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-gray-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interested in *</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(g => (
                  <button key={g} onClick={() => toggleInterest(g)}
                    className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-colors ${form.interestedIn.includes(g) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-gray-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                <input type="text" placeholder="e.g. Dallas" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                <input type="text" placeholder="e.g. TX" value={form.state} maxLength={2}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-4 border-[1.5px] border-gray-200 rounded-xl text-base uppercase" />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age range: {form.ageMin}–{form.ageMax}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">Min</span>
                  <input type="range" min="18" max="60" value={form.ageMin} step="1"
                    onChange={e => setForm(p => ({ ...p, ageMin: Math.min(+e.target.value, p.ageMax - 1) }))}
                    className="flex-1 accent-black" />
                  <span className="text-sm font-medium w-6 text-right">{form.ageMin}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">Max</span>
                  <input type="range" min="18" max="80" value={form.ageMax} step="1"
                    onChange={e => setForm(p => ({ ...p, ageMax: Math.max(+e.target.value, p.ageMin + 1) }))}
                    className="flex-1 accent-black" />
                  <span className="text-sm font-medium w-6 text-right">{form.ageMax}</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Distance</label>
              <div className="flex flex-wrap gap-2">
                {RADII.map(r => (
                  <button key={r} onClick={() => setForm(p => ({ ...p, radius: r }))}
                    className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-colors ${form.radius === r ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                What matters most to you in a connection? (optional)
              </label>
              <textarea
                placeholder="Share what you're looking for…"
                value={form.connectionPrompt}
                onChange={e => setForm(p => ({ ...p, connectionPrompt: e.target.value }))}
                maxLength={150}
                rows={3}
                className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-base resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.connectionPrompt.length}/150</p>
            </div>

            <button
              disabled={!canProceedStep2 || loading}
              onClick={finish}
              className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Finish Setup'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
