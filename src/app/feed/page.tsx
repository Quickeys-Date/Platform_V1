'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import type {
  Conversation,
  Profile,
} from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { ProfileCard } from '@/components/ProfileCard'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { apiFetch } from '@/lib/api'

type LoadState =
  | 'checking'
  | 'ready'
  | 'redirecting'

export default function FeedPage() {
  const [loadState, setLoadState] =
    useState<LoadState>('checking')

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeConvs, setActiveConvs] =
    useState<Conversation[]>([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    const checkInactivity = async () => {
      try {
        const response = await apiFetch('/api/pax')
        const data = await response.json()
        const pending = data.triggers || []

        if (pending.length > 0) {
          const ids = pending
            .map((trigger: any) => trigger.id)
            .join(',')

          setLoadState('redirecting')

          window.location.href =
            `/pax/checkin?triggers=${encodeURIComponent(ids)}` +
            '&index=0&type=INACTIVITY'

          return
        }
      } catch {
        // Continue loading the feed if the Pax check fails.
      }

      setLoadState('ready')
    }

    checkInactivity()
  }, [])

  const loadFeed = useCallback(async () => {
    setFeedLoading(true)

    try {
      const [conversationResponse, feedResponse] =
        await Promise.all([
          apiFetch('/api/conversations?status=active'),
          apiFetch('/api/profiles/feed'),
        ])

      const [conversationData, feedData] =
        await Promise.all([
          conversationResponse.json(),
          feedResponse.json(),
        ])

      setActiveConvs(
        conversationData.conversations || []
      )
      setProfiles(feedData.profiles || [])
    } finally {
      setFeedLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadState === 'ready') {
      loadFeed()
    }
  }, [loadState, loadFeed])

  const startConversation = async (
    profileId: string
  ) => {
    const response = await apiFetch(
      '/api/conversations',
      {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: profileId,
        }),
      }
    )

    const data = await response.json()

    if (data.conversation) {
      window.location.href =
        `/chat/${data.conversation.id}`
    }
  }

  if (
    loadState === 'checking' ||
    loadState === 'redirecting'
  ) {
    return (
      <div className="feed-loading-page">
        <div className="feed-loading-spinner" />
      </div>
    )
  }

  return (
    <main className="feed-page">
      <header className="feed-header">
        <div className="feed-header-inner">
          <QuicKeysLogo
            size="sm"
            showWordmark
          />

          <button
            type="button"
            className="feed-profile-button"
            aria-label="Open my profile"
            onClick={() => {
              window.location.href = '/me'
            }}
          >
            ◎
          </button>
        </div>
      </header>

      <div className="feed-scroll-area">
        <div className="feed-content">
          {activeConvs.length > 0 && (
            <section className="feed-section">
              <h2 className="feed-section-title">
                Active conversations
              </h2>

              <div className="feed-conversation-grid">
                {activeConvs.map((conversation) => {
                  const other =
                    conversation.other_profile as any

                  const message =
                    conversation.last_message
                      ? (
                          conversation.last_message as any
                        ).content?.slice(0, 40) + '…'
                      : 'Say hello!'

                  return (
                    <article
                      key={conversation.id}
                      className="feed-conversation-card"
                    >
                      <button
                        type="button"
                        className="feed-conversation-profile"
                        onClick={() => {
                          window.location.href =
                            `/profile/${other?.id}`
                        }}
                      >
                        <span className="feed-conversation-avatar">
                          {other?.first_name?.[0] || '?'}
                        </span>

                        <span className="feed-conversation-copy">
                          <span className="feed-conversation-name">
                            {other?.first_name}
                          </span>

                          <span className="feed-conversation-message">
                            {message}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="feed-chat-button"
                        aria-label={`Message ${
                          other?.first_name || 'connection'
                        }`}
                        onClick={() => {
                          window.location.href =
                            `/chat/${conversation.id}`
                        }}
                      >
                        💬
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <section className="feed-section">
            <h2 className="feed-section-title">
              New connections
            </h2>

            {feedLoading ? (
              <div className="feed-profile-grid">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="feed-profile-skeleton"
                  />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className="feed-empty">
                <div className="feed-empty-icon">
                  🌐
                </div>

                <h3>
                  No connections available right now.
                </h3>

                <p>Check back soon.</p>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/me'
                  }}
                >
                  Expand your filters
                </button>
              </div>
            ) : (
              <>
                {profiles.length < 5 && (
                  <p className="feed-more-message">
                    More connections coming soon.
                  </p>
                )}

                <div className="feed-profile-grid">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onViewProfile={() => {
                        window.location.href =
                          `/profile/${profile.id}`
                      }}
                      onStartChat={() =>
                        startConversation(profile.id)
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <BottomNav active="feed" />
    </main>
  )
}