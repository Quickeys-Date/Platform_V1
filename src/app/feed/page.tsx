'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Profile, Conversation } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { ProfileCard } from '@/components/ProfileCard'
import { apiFetch } from '@/lib/api'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

type LoadState = 'checking' | 'ready' | 'redirecting'

export default function FeedPage() {
  const [loadState, setLoadState] = useState<LoadState>('checking')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeConvs, setActiveConvs] = useState<Conversation[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    const checkInactivity = async () => {
      try {
        const res = await apiFetch('/api/pax')
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
      apiFetch('/api/conversations?status=active'),
      apiFetch('/api/profiles/feed'),
    ])
    const [convData, feedData] = await Promise.all([convRes.json(), feedRes.json()])
    setActiveConvs(convData.conversations || [])
    setProfiles(feedData.profiles || [])
    setFeedLoading(false)
  }, [])

  useEffect(() => { if (loadState === 'ready') loadFeed() }, [loadState, loadFeed])

  const startConversation = async (profileId: string) => {
    const res = await apiFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: profileId }),
    })
    const data = await res.json()
    if (data.conversation) window.location.href = `/chat/${data.conversation.id}`
  }

  if (loadState === 'checking' || loadState === 'redirecting') {
    return (
      <div className="flex items-center justify-center min-h-svh" style={{ background: '#0A0A0A' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #0FB7BF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(15, 183, 191, 0.1)',
        background: 'rgba(6, 27, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <QuicKeysLogo size="sm" showWordmark />
        <button onClick={() => window.location.href = '/me'}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15, 183, 191, 0.1)', border: '1px solid rgba(15, 183, 191, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0FB7BF', fontSize: 16 }}>
          ◎
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Active conversations */}
        {activeConvs.length > 0 && (
          <div className="mb-5">
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Active conversations
            </h2>
            <div className="space-y-2">
              {activeConvs.map(conv => {
                const other = conv.other_profile as any
                return (
                  <div key={conv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(15,183,191,0.15)',
                    borderRadius: 14,
                  }}>
                    <button onClick={() => window.location.href = `/profile/${other?.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #043538, #0A6469)',
                        border: '1.5px solid rgba(15,183,191,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#0FB7BF', flexShrink: 0,
                      }}>
                        {other?.first_name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{other?.first_name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }} className="truncate">
                          {conv.last_message ? (conv.last_message as any).content?.slice(0, 40) + '…' : 'Say hello!'}
                        </div>
                      </div>
                    </button>
                    <button onClick={() => window.location.href = `/chat/${conv.id}`}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,183,191,0.15)', border: '1px solid rgba(15,183,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      💬
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          New connections
        </h2>

        {feedLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderRadius: 16, background: 'rgba(255,255,255,0.04)', aspectRatio: '1', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8 }}>No connections available right now.</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 16 }}>Check back soon.</p>
            <button onClick={() => window.location.href = '/me'}
              style={{ color: '#FFC766', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
              Expand your filters
            </button>
          </div>
        ) : (
          <>
            {profiles.length < 5 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 12 }}>
                More connections coming soon.
              </p>
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
