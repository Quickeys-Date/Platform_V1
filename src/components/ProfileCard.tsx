'use client'
import type { Profile } from '@/lib/types'
import { PhotoDisplay } from './PhotoDisplay'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000))
  return age > 0 ? `, ${age}` : ''
}

export function ProfileCard({ profile, onViewProfile, onStartChat }: {
  profile: Profile
  onViewProfile: () => void
  onStartChat: () => void
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(15, 183, 191, 0.15)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.2s, border-color 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,183,191,0.4)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,183,191,0.15)' }}>
      <button onClick={onViewProfile} className="w-full text-left">
        <div className="relative" style={{ aspectRatio: '1' }}>
          <PhotoDisplay photos={profile.photos} fill className="object-cover" />
          {/* Gold gradient overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(to top, rgba(4,53,56,0.9), transparent)',
          }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
              {profile.first_name}{getAge(profile.date_of_birth)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {profile.city}, {profile.state}
            </div>
          </div>
        </div>
        {profile.bio && (
          <div style={{ padding: '8px 10px 4px', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
            {profile.bio.slice(0, 60)}{profile.bio.length > 60 ? '…' : ''}
          </div>
        )}
      </button>
      <div style={{ padding: '4px 8px 8px' }}>
        <button onClick={onStartChat} style={{
          width: '100%', padding: '7px 0', fontSize: 12, fontWeight: 600,
          background: 'linear-gradient(135deg, rgba(15,183,191,0.2), rgba(10,100,105,0.3))',
          border: '1px solid rgba(15,183,191,0.3)',
          borderRadius: 8, color: '#0FB7BF',
          cursor: 'pointer',
        }}>
          Message
        </button>
      </div>
    </div>
  )
}
