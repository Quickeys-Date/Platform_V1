'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import toast from 'react-hot-toast'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''

  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  return age > 0 ? `, ${age}` : ''
}

export default function ConnectionProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .neq('status', 'DEACTIVATED')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push('/feed')
          return
        }

        setProfile(data)

        Promise.all(
          (data.photos || []).map(async (path: string) => {
            const { data: signed } = await supabase.storage
              .from('photos')
              .createSignedUrl(path, 3600)

            return signed?.signedUrl || ''
          })
        ).then(urls => {
          setPhotoUrls(urls.filter(Boolean))
        })

        setLoading(false)
      })
  }, [id, router, supabase])

  const startConversation = async () => {
    setStarting(true)

    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: id,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      toast.error('Could not start conversation')
      setStarting(false)
      return
    }

    window.location.href = `/chat/${data.conversation.id}`
  }

  if (loading) {
    return (
      <main className="connection-profile-loading">
        <div className="connection-profile-spinner" />
      </main>
    )
  }

  if (!profile) return null

  const photos = photoUrls
  const hasMultiplePhotos = photos.length > 1
  const profileInitial = profile.first_name?.[0]?.toUpperCase() || '?'

  return (
    <main className="connection-profile-page">
      <div className="connection-profile-shell">
        <section className="connection-profile-photo-panel">
          {photos[photoIndex] ? (
            <img
              src={photos[photoIndex]}
              alt={`${profile.first_name}'s profile`}
              className="connection-profile-image"
            />
          ) : (
            <div className="connection-profile-placeholder">
              {profileInitial}
            </div>
          )}

          <div className="connection-profile-photo-gradient" />

          <button
            type="button"
            onClick={() => router.back()}
            className="connection-profile-back"
            aria-label="Return to previous page"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                `/report?reported_id=${id}` +
                '&source=Connection+Profile'
            }}
            className="connection-profile-report-icon"
            aria-label="Report this profile"
          >
            ⚑
          </button>

          {hasMultiplePhotos && photoIndex > 0 && (
            <button
              type="button"
              onClick={() => setPhotoIndex(index => index - 1)}
              className="connection-profile-photo-arrow connection-profile-photo-previous"
              aria-label="View previous photograph"
            >
              ‹
            </button>
          )}

          {hasMultiplePhotos && photoIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={() => setPhotoIndex(index => index + 1)}
              className="connection-profile-photo-arrow connection-profile-photo-next"
              aria-label="View next photograph"
            >
              ›
            </button>
          )}

          {hasMultiplePhotos && (
            <div className="connection-profile-dots">
              {photos.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setPhotoIndex(index)}
                  className={
                    index === photoIndex
                      ? 'connection-profile-dot connection-profile-dot-active'
                      : 'connection-profile-dot'
                  }
                  aria-label={`View photograph ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className="connection-profile-photo-name">
            <h1>
              {profile.first_name}
              {getAge(profile.date_of_birth)}
            </h1>

            {(profile.city || profile.state) && (
              <p>
                {[profile.city, profile.state]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        </section>

        <section className="connection-profile-details">
          <div className="connection-profile-details-header">
            <p className="connection-profile-eyebrow">
              Connection profile
            </p>

            <h2>
              Get to know {profile.first_name}
            </h2>
          </div>

          <div className="connection-profile-information">
            {profile.bio && (
              <div className="connection-profile-section">
                <h3>About</h3>

                <p className="connection-profile-bio">
                  {profile.bio}
                </p>
              </div>
            )}

            {profile.connection_prompt && (
              <div className="connection-profile-section">
                <h3>What matters most to them</h3>

                <blockquote className="connection-profile-prompt">
                  “{profile.connection_prompt}”
                </blockquote>
              </div>
            )}
          </div>

          <div className="connection-profile-actions">
            <button
              type="button"
              disabled={starting}
              onClick={startConversation}
              className="connection-profile-start"
            >
              {starting ? 'Starting…' : 'Start Conversation'}
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  `/report?reported_id=${id}` +
                  '&source=Connection+Profile'
              }}
              className="connection-profile-report"
            >
              Report User
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
