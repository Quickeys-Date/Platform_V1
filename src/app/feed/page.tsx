'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, Conversation } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { ProfileCard } from '@/components/ProfileCard'
import { PhotoDisplay } from '@/components/PhotoDisplay'

type LoadState = 'checking' | 'ready' | 'redirecting'

export default function FeedPage() {
  const router = useRouter()
  const [loadState, setLoadState] = useState<LoadState>('checking')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeConvs, setActiveConvs] = useState<Conversation[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    const checkInactivity = async () => {
      try {
        const res = await fetch('/api/pax')
        const data = await res.json()
        const pending = data.triggers || []
        if (pending.length > 0) {
          const ids = pending.map((t: any) => t.id).join(',')
          setLoadState('redirecting')
          window.location.href = `/pax/checkin?triggers=${encodeURIComponent(ids)}&index=0&type=INACTIVITY`
          return
        }
      } catch {}
      setLoadState('ready')
    }
    checkInactivity()
  }, [])

  const loadFeed = useCallback(async () => {
    setFeedLoading(true)
    const [convRes, feedRes] = await Promise.all([
      fetch('/api/conversations?status=active'),
      fetch('/api/profiles/feed'),
    ])
    const [convData, feedData] = await Promise.all([convRes.json(), feedRes.json()])
    setActiveConvs(convData.conversations || [])
    setProfiles(feedData.profiles || [])
    setFeedLoading(false)
  }, [])

  useEffect(() => {
    if (loadState === 'ready') loadFeed()
  }, [loadState, loadFeed])

  const startConversation = async (profileId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: profileId }),
    })
    const data = await res.json()
    if (data.conversation) window.location.href = `/chat/${data.conversation.id}`
  }

  if (loadState === 'checking' || loadState === 'redirecting') {
    return (
      <div className="flex items-center justify-center min-h-svh bg-white">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="text-2xl font-black tracking-[-1.5px]">QuicKeys</span>
        <button onClick={() => window.location.href = '/me'} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100">
          <span className="text-lg">👤</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {activeConvs.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Active conversations</h2>
            <div className="space-y-2">
              {activeConvs.map(conv => (
                <button key={conv.id} onClick={() => window.location.href = `/chat/${conv.id}`}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-left">
                  <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(conv.other_profile as any)?.first_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{(conv.other_profile as any)?.first_name}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.last_message ? (conv.last_message as any).content?.slice(0, 45) + '…' : 'Say hello!'}
                    </div>
                  </div>
                  <span className="text-gray-300">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">New connections</h2>

        {feedLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse" style={{ aspectRatio: '1' }} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌐</div>
            <h3 className="font-bold text-lg mb-2">No connections available right now.</h3>
            <p className="text-gray-400 text-sm mb-4">Check back soon.</p>
            <button onClick={() => window.location.href = '/me'} className="text-sm font-semibold text-black underline">
              Expand your filters
            </button>
          </div>
        ) : (
          <>
            {profiles.length < 5 && (
              <p className="text-xs text-gray-400 mb-3 text-center">More connections coming soon.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {profiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewProfile={() => window.location.href = `/profile/${profile.id}`}
                  onStartChat={() => startConversation(profile.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
