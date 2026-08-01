'use client'

import type { Profile } from '@/lib/types'
import { PhotoDisplay } from './PhotoDisplay'

function getAge(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return ''
  const born = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age -= 1
  return age >= 18 ? `, ${age}` : ''
}

export function ProfileCard({ profile, onViewProfile, onPass, onConnect, onQuiKey, onMenu }: {
  profile: Profile
  onViewProfile: () => void
  onPass: () => void
  onConnect: () => void
  onQuiKey: () => void
  onMenu: () => void
}) {
  const location = [profile.city, profile.state].filter(Boolean).join(', ')

  return (
    <article className="discover-card">
      <div className="discover-card-photo">
        <button type="button" className="discover-photo-open" onClick={onViewProfile} aria-label={`Open ${profile.first_name}'s profile`} />
        <PhotoDisplay photos={profile.photos} fill className="object-cover" />
        <span className="discover-card-shade" aria-hidden="true" />
        <button type="button" className="discover-more" onClick={onMenu} aria-label={`More safety options for ${profile.first_name}`}>•••</button>
        <span className="discover-identity">
          <strong>{profile.first_name}{getAge(profile.date_of_birth)}</strong>
          {location && <small>⌖ {location}</small>}
        </span>
      </div>

      <div className="discover-details">
        <section className="discover-about">
          <div><h2>About Me</h2><p>{profile.bio || 'Getting ready to share more about myself.'}</p></div>
        </section>

        {profile.connection_prompt && (
          <section className="discover-prompt">
            <span>Connection prompt</span>
            <p>{profile.connection_prompt}</p>
          </section>
        )}

        <div className="discover-actions" aria-label="Profile actions">
          <button type="button" className="discover-action discover-pass" onClick={onPass} aria-label={`Pass on ${profile.first_name}`} title="Pass">×</button>
          <button type="button" className="discover-action discover-connect" onClick={onConnect} aria-label={`Connect with ${profile.first_name}`} title="Connect">♡</button>
          <button type="button" className="discover-action discover-save" onClick={onQuiKey} aria-label={`Send ${profile.first_name} a QuiKey`} title="Send a thoughtful QuiKey">⚿</button>
        </div>
        <div className="discover-action-labels" aria-hidden="true"><span>Pass</span><span>Interested</span><span>QuiKey</span></div>
      </div>
    </article>
  )
}
