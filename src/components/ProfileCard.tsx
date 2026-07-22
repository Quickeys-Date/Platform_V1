'use client'

import type { Profile } from '@/lib/types'
import { PhotoDisplay } from './PhotoDisplay'

function getAge(
  dateOfBirth: string | null | undefined
): string {
  if (!dateOfBirth) return ''

  const age = Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  return age > 0 ? `, ${age}` : ''
}

export function ProfileCard({
  profile,
  onViewProfile,
  onStartChat,
}: {
  profile: Profile
  onViewProfile: () => void
  onStartChat: () => void
}) {
  return (
    <article className="profile-card">
      <button
        type="button"
        className="profile-card-main"
        onClick={onViewProfile}
      >
        <div className="profile-card-photo">
          <PhotoDisplay
            photos={profile.photos}
            fill
            className="object-cover"
          />

          <div className="profile-card-overlay" />

          <div className="profile-card-identity">
            <div className="profile-card-name">
              {profile.first_name}
              {getAge(profile.date_of_birth)}
            </div>

            <div className="profile-card-location">
              {[profile.city, profile.state]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="profile-card-bio">
            {profile.bio.slice(0, 60)}
            {profile.bio.length > 60 ? '…' : ''}
          </div>
        )}
      </button>

      <div className="profile-card-action">
        <button
          type="button"
          onClick={onStartChat}
        >
          Message
        </button>
      </div>
    </article>
  )
}