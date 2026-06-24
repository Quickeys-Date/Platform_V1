// src/components/ProfileCard.tsx — S-09 profile card
// Shows: first name, age, city/state, first photo, first 80 characters of bio
// User can tap to view full profile OR tap chat button to initiate chat directly
'use client'
import type { Profile } from '@/lib/types'
import { PhotoDisplay } from './PhotoDisplay'

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
    <div className="text-left bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all hover:-translate-y-0.5">
      {/* Photo — tapping goes to full profile */}
      <button onClick={onViewProfile} className="w-full text-left">
        <div className="relative aspect-square">
          <PhotoDisplay photos={profile.photos} fill className="object-cover" />
        </div>
        <div className="p-2.5">
          <div className="font-bold text-sm tracking-tight">{profile.first_name}, {profile.age}</div>
          <div className="text-xs text-gray-500 mt-0.5">{profile.city}, {profile.state}</div>
          {profile.bio && (
            <div className="text-xs text-gray-400 mt-1 leading-relaxed">
              {/* First 80 characters of bio per spec */}
              {profile.bio.slice(0, 80)}{profile.bio.length > 80 ? '…' : ''}
            </div>
          )}
        </div>
      </button>
      {/* Direct chat button — initiates chat without viewing profile per spec */}
      <div className="px-2.5 pb-2.5">
        <button
          onClick={onStartChat}
          className="w-full py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:opacity-80 transition-opacity"
        >
          Message
        </button>
      </div>
    </div>
  )
}
