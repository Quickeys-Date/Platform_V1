'use client'
// src/app/feed/page.tsx — S-09 Connection Feed
// Per spec: inactivity Pax prompt appears BEFORE feed loads. Feed is blocked until all pending
// inactivity triggers are resolved. Multiple inactive chats fire in sequence.
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Conversation } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { ProfileCard } from '@/components/ProfileCard'
import { PhotoDisplay } from '@/components/PhotoDisplay'

type LoadState = 'checking' | 'ready' | 'redirecting'

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loadState, setLoadState] = useState<LoadState>('checking')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeConvs, setActiveConvs] = useState<Conversation[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  // Step 1: Check for pending inactivity triggers BEFORE rendering feed.
  // If any exist, redirect to pax flow with trigger IDs in URL (not sessionStorage).
  // Multiple inactive convs fire in sequence via index param.
  useEffect(() => {
    const checkInactivity = async () => {
      try {
        const res = await fetch('/api/pax')
        const data = await res.json()
        const pending = data.triggers || []

        if (pending.length > 0) {
          // Encode all trigger IDs into URL so sequence survives page refreshes
          const ids = pending.map((t: any) => t.id).join(',')
          setLoadState('redirecting')
          router.replace(`/pax/checkin?triggers=${encodeURIComponent(ids)}&index=0&type=INACTIVITY`)
          return
        }
      } catch {
        // If check fails, proceed to feed — don't block the user
      }
      setLoadState('ready')
    }
    checkInactivity()
  }, [router]) // eslint-disable-line

  // Step 2: Only load feed data once inactivity check passes
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
    if (data.conversation) router.push(`/chat/${data.conversation.id}`)
  }

  // Show a blank screen while checking — feed never flashes before redirect
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
        <Link href="/me" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100">
          <span className="text-lg">👤</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Active conversations */}
        {activeConvs.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Active conversations</h2>
            <div className="space-y-2">
              {activeConvs.map(conv => (
                <Link key={conv.id} href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <PhotoDisplay photos={(conv.other_profile as any)?.photos || []} size={44} className="rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{(conv.other_profile as any)?.first_name}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.last_message ? (conv.last_message as any).content?.slice(0, 45) + '…' : 'Say hello!'}
                    </div>
                  </div>
                  <span className="text-gray-300">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New connections — S-09 spec */}
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
            <Link href="/me" className="text-sm font-semibold text-black underline">
              Expand your filters
            </Link>
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
                  onViewProfile={() => router.push(`/profile/${profile.id}`)}
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
