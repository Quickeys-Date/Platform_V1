'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { SetupProgress } from '@/components/SetupProgress'

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
    firstName: '',
    bio: '',
    gender: '',
    interestedIn: [] as string[],
    city: '',
    state: '',
    ageMin: 18,
    ageMax: 45,
    radius: '25mi',
    connectionPrompt: '',
    photos: [] as string[],
    dob: '',
  })
  const supabase = createClient()

  const uploadPhoto = async (file: File) => {
    if (form.photos.length >= 3) {
      toast.error('Maximum 3 photos.')
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('JPG or PNG only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB.')
      return
    }

    setUploading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUploading(false)
      toast.error('Please sign in again.')
      return
    }

    const ext = file.type === 'image/jpeg' ? 'jpg' : 'png'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)

    if (error) {
      toast.error('Upload failed.')
      setUploading(false)
      return
    }

    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrl(path, 3600)

    setForm(previous => ({
      ...previous,
      photos: [...previous.photos, path],
    }))

    if (signed?.signedUrl) {
      setSignedUrls(previous => ({
        ...previous,
        [path]: signed.signedUrl,
      }))
    }

    setUploading(false)
  }

  const removePhoto = async (path: string) => {
    await supabase.storage.from('photos').remove([path])
    setForm(previous => ({
      ...previous,
      photos: previous.photos.filter(photo => photo !== path),
    }))
  }

  const save = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      toast.error('Please sign in again.')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
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
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile.')
      setLoading(false)
      return
    }

    router.push('/onboarding/welcome')
  }

  const toggleInterest = (interest: string) => {
    setForm(previous => ({
      ...previous,
      interestedIn: previous.interestedIn.includes(interest)
        ? previous.interestedIn.filter(item => item !== interest)
        : [...previous.interestedIn, interest],
    }))
  }

  const BackButton = ({ target }: { target: number }) => (
    <button
      type="button"
      className="profile-builder-back"
      onClick={() => setStep(target)}
      aria-label="Go to previous step"
    >
      ←
    </button>
  )

  const StepHeading = ({
    title,
    description,
  }: {
    title: string
    description?: string
  }) => (
    <header className="profile-builder-heading">
      <p className="profile-builder-step">Step {step} of 5</p>
      <h1>{title}</h1>
      {description && <p className="profile-builder-description">{description}</p>}
    </header>
  )

  if (step === 1) {
    return (
      <main className="profile-builder-page">
        <SetupProgress active={4} />
        <section className="profile-builder-shell">
          <div className="profile-builder-logo">
            <QuicKeysLogo size="sm" showWordmark={false} />
          </div>

          <StepHeading
            title="What's your name?"
            description="This is how you'll appear to other members."
          />

          <div className="profile-builder-content">
            <div className="profile-builder-field">
              <label htmlFor="first-name">First name</label>
              <input
                id="first-name"
                value={form.firstName}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    firstName: event.target.value,
                  }))
                }
                placeholder="First name only"
                className="input-dark profile-builder-input"
              />
            </div>

            <div className="profile-builder-field">
              <label htmlFor="date-of-birth">Date of birth</label>
              <input
                id="date-of-birth"
                type="date"
                value={form.dob}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    dob: event.target.value,
                  }))
                }
                className="input-dark profile-builder-input"
              />
              <p className="profile-builder-help">
                Must be 18+. Not shown on your profile.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!form.firstName.trim() || !form.dob}
            onClick={() => setStep(2)}
            className="btn-gold profile-builder-submit"
          >
            Continue →
          </button>
        </section>
      </main>
    )
  }

  if (step === 2) {
    return (
      <main className="profile-builder-page">
        <SetupProgress active={4} />
        <section className="profile-builder-shell">
          <BackButton target={1} />
          <StepHeading title="Tell us about yourself" />

          <div className="profile-builder-content profile-builder-content-spacious">
            <fieldset className="profile-builder-fieldset">
              <legend>I am a…</legend>
              <div className="profile-builder-chips">
                {GENDERS.map(gender => (
                  <button
                    type="button"
                    key={gender}
                    className={`profile-builder-chip ${
                      form.gender === gender ? 'is-selected' : ''
                    }`}
                    onClick={() =>
                      setForm(previous => ({ ...previous, gender }))
                    }
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="profile-builder-fieldset">
              <legend>Interested in…</legend>
              <div className="profile-builder-chips">
                {INTERESTS.map(interest => (
                  <button
                    type="button"
                    key={interest}
                    className={`profile-builder-chip ${
                      form.interestedIn.includes(interest) ? 'is-selected' : ''
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            type="button"
            disabled={!form.gender || form.interestedIn.length === 0}
            onClick={() => setStep(3)}
            className="btn-gold profile-builder-submit"
          >
            Continue →
          </button>
        </section>
      </main>
    )
  }

  if (step === 3) {
    return (
      <main className="profile-builder-page">
        <SetupProgress active={4} />
        <section className="profile-builder-shell profile-builder-shell-wide">
          <BackButton target={2} />
          <StepHeading title="Where are you?" />

          <div className="profile-builder-content">
            <div className="profile-builder-location-grid">
              <div className="profile-builder-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={event =>
                    setForm(previous => ({
                      ...previous,
                      city: event.target.value,
                    }))
                  }
                  placeholder="City"
                  className="input-dark profile-builder-input"
                />
              </div>

              <div className="profile-builder-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  value={form.state}
                  onChange={event =>
                    setForm(previous => ({
                      ...previous,
                      state: event.target.value,
                    }))
                  }
                  placeholder="State"
                  className="input-dark profile-builder-input"
                />
              </div>
            </div>

            <fieldset className="profile-builder-fieldset">
              <legend>Distance</legend>
              <div className="profile-builder-chips">
                {RADII.map(radius => (
                  <button
                    type="button"
                    key={radius}
                    className={`profile-builder-chip ${
                      form.radius === radius ? 'is-selected' : ''
                    }`}
                    onClick={() =>
                      setForm(previous => ({ ...previous, radius }))
                    }
                  >
                    {radius}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="profile-builder-fieldset">
              <legend>
                Age range: {form.ageMin}–{form.ageMax}
              </legend>

              <div className="profile-builder-ranges">
                <label className="profile-builder-range">
                  <span>Min</span>
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={form.ageMin}
                    step="1"
                    onChange={event =>
                      setForm(previous => ({
                        ...previous,
                        ageMin: Math.min(
                          Number(event.target.value),
                          previous.ageMax - 1,
                        ),
                      }))
                    }
                  />
                  <strong>{form.ageMin}</strong>
                </label>

                <label className="profile-builder-range">
                  <span>Max</span>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={form.ageMax}
                    step="1"
                    onChange={event =>
                      setForm(previous => ({
                        ...previous,
                        ageMax: Math.max(
                          Number(event.target.value),
                          previous.ageMin + 1,
                        ),
                      }))
                    }
                  />
                  <strong>{form.ageMax}</strong>
                </label>
              </div>
            </fieldset>
          </div>

          <button
            type="button"
            disabled={!form.city.trim() || !form.state.trim()}
            onClick={() => setStep(4)}
            className="btn-gold profile-builder-submit"
          >
            Continue →
          </button>
        </section>
      </main>
    )
  }

  if (step === 4) {
    return (
      <main className="profile-builder-page">
        <SetupProgress active={4} />
        <section className="profile-builder-shell profile-builder-shell-wide">
          <BackButton target={3} />
          <StepHeading title="Add photos & bio" />

          <div className="profile-builder-content">
            <fieldset className="profile-builder-fieldset">
              <legend>Photos (up to 3)</legend>
              <div className="profile-builder-photos">
                {form.photos.map(path => (
                  <div className="profile-builder-photo" key={path}>
                    {signedUrls[path] ? (
                      <img src={signedUrls[path]} alt="Profile preview" />
                    ) : (
                      <span className="profile-builder-photo-placeholder">
                        Photo
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(path)}
                      className="profile-builder-photo-remove"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {form.photos.length < 3 && (
                  <label className="profile-builder-photo profile-builder-photo-add">
                    <span className="profile-builder-photo-plus">+</span>
                    <span>{uploading ? 'Uploading…' : 'Add photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      disabled={uploading}
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) uploadPhoto(file)
                        event.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </fieldset>

            <div className="profile-builder-field">
              <label htmlFor="bio">Bio (optional)</label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    bio: event.target.value,
                  }))
                }
                maxLength={250}
                rows={4}
                placeholder="Tell people a bit about yourself…"
                className="profile-builder-textarea"
              />
              <p className="profile-builder-counter">{form.bio.length}/250</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(5)}
            className="btn-gold profile-builder-submit"
          >
            Continue →
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-builder-page">
      <SetupProgress active={4} />
      <section className="profile-builder-shell">
        <BackButton target={4} />
        <StepHeading
          title="One last thing"
          description="What matters most to you in a connection? (Optional)"
        />

        <div className="profile-builder-content">
          <div className="profile-builder-field">
            <label htmlFor="connection-prompt">Your answer</label>
            <textarea
              id="connection-prompt"
              value={form.connectionPrompt}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  connectionPrompt: event.target.value,
                }))
              }
              maxLength={150}
              rows={6}
              placeholder="e.g. honesty, laughter, someone who shows up…"
              className="profile-builder-textarea profile-builder-prompt"
            />
            <p className="profile-builder-counter">
              {form.connectionPrompt.length}/150
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={save}
          className="btn-gold profile-builder-submit"
        >
          {loading ? 'Saving…' : 'Complete Profile →'}
        </button>
      </section>
    </main>
  )
}
