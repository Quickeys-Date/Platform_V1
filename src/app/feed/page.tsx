'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { ProfileCard } from '@/components/ProfileCard'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { PhotoDisplay } from '@/components/PhotoDisplay'
import { apiFetch } from '@/lib/api'

const FEED_CACHE_KEY = 'quikeys-feed-cache-v1'
const FEED_CACHE_TTL = 5 * 60 * 1000
type FeedCache = {
  profiles: Profile[]
  viewer: { first_name: string; photos: string[] } | null
  currentIndex: number
  savedAt: number
}

export default function FeedPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quiKeyOpen, setQuiKeyOpen] = useState(false)
  const [quiKeyAnswer, setQuiKeyAnswer] = useState('')
  const [requestSending, setRequestSending] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [viewer, setViewer] = useState<{ first_name: string; photos: string[] } | null>(null)
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false)
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const requestMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTemporaryRequestMessage = useCallback((message: string) => {
    if (requestMessageTimer.current) clearTimeout(requestMessageTimer.current)
    setRequestMessage(message)
    requestMessageTimer.current = setTimeout(() => {
      setRequestMessage('')
      requestMessageTimer.current = null
    }, 1000)
  }, [])

  useEffect(() => () => {
    if (requestMessageTimer.current) clearTimeout(requestMessageTimer.current)
  }, [])

  const loadFeed = useCallback(async ({ background = false, preserveProfileId = '' }: { background?: boolean; preserveProfileId?: string } = {}) => {
    if (!background) setFeedLoading(true)
    setFeedError('')
    try {
      const feedResponse = await apiFetch('/api/profiles/feed')
      if (feedResponse.status === 401) {
        window.location.href = '/auth/signin'
        return
      }
      if (!feedResponse.ok) throw new Error('Unable to load connections')
      const feedData = await feedResponse.json()
      const nextProfiles = feedData.profiles || []
      const nextViewer = feedData.viewer || null
      const preservedIndex = preserveProfileId
        ? Math.max(0, nextProfiles.findIndex((profile: Profile) => profile.id === preserveProfileId))
        : 0
      setProfiles(nextProfiles)
      setViewer(nextViewer)
      setCurrentIndex(preservedIndex)
      sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
        profiles: nextProfiles,
        viewer: nextViewer,
        currentIndex: preservedIndex,
        savedAt: Date.now(),
      } satisfies FeedCache))
    } catch {
      if (!background) setFeedError('We could not load your connections. Please try again.')
    } finally {
      if (!background) setFeedLoading(false)
    }
  }, [])

  useEffect(() => {
    let restored = false
    let preservedProfileId = ''
    try {
      const rawCache = sessionStorage.getItem(FEED_CACHE_KEY)
      if (rawCache) {
        const cache = JSON.parse(rawCache) as FeedCache
        if (Date.now() - cache.savedAt < FEED_CACHE_TTL && cache.profiles.length) {
          setProfiles(cache.profiles)
          setViewer(cache.viewer || null)
          setCurrentIndex(Math.min(cache.currentIndex || 0, cache.profiles.length - 1))
          preservedProfileId = cache.profiles[Math.min(cache.currentIndex || 0, cache.profiles.length - 1)]?.id || ''
          setFeedLoading(false)
          restored = true
        }
      }
    } catch {
      sessionStorage.removeItem(FEED_CACHE_KEY)
    }
    loadFeed({ background: restored, preserveProfileId: preservedProfileId })
  }, [loadFeed])

  useEffect(() => {
    if (feedLoading || !profiles.length) return
    try {
      sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify({
        profiles,
        viewer,
        currentIndex,
        savedAt: Date.now(),
      } satisfies FeedCache))
    } catch { /* The feed still works when browser storage is unavailable. */ }
  }, [profiles, viewer, currentIndex, feedLoading])

  const sendConnectionRequest = async (profileId: string, requestType: 'STANDARD' | 'QUIKEY', promptAnswer = '') => {
    setRequestSending(true)
    setRequestMessage('')
    const response = await apiFetch('/api/connection-requests', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: profileId, request_type: requestType, prompt_answer: promptAnswer }),
    })
    const data = await response.json()
    setRequestSending(false)
    if (!response.ok) {
      setRequestMessage(data.error || 'Unable to send your request. Please try again.')
      return
    }
    setQuiKeyOpen(false)
    setQuiKeyAnswer('')
    showTemporaryRequestMessage(requestType === 'QUIKEY' ? 'Your thoughtful QuiKey was sent.' : 'Your connection request was sent.')
    setCurrentIndex(index => index + 1)
  }

  const blockProfile = async (profileId: string) => {
    setBlocking(true)
    const response = await apiFetch('/api/blocks', { method: 'POST', body: JSON.stringify({ blocked_id: profileId }) })
    const data = await response.json()
    setBlocking(false)
    if (!response.ok) { setRequestMessage(data.error || 'Unable to block this profile.'); return }
    setBlockConfirmOpen(false)
    setSafetyMenuOpen(false)
    setRequestMessage('Profile blocked. You will no longer see each other.')
    setCurrentIndex(index => index + 1)
  }

  const currentProfile = profiles[currentIndex]

  return (
    <main className="feed-page">
      <header className="feed-header">
        <div className="feed-header-inner">
          <QuicKeysLogo size="sm" showWordmark />
          <button type="button" className="feed-profile-button" aria-label="Open my profile" onClick={() => window.location.href = '/me'}>
            {viewer?.photos?.length ? <PhotoDisplay photos={viewer.photos} size={38} className="feed-profile-photo" /> : <span>{viewer?.first_name?.[0]?.toUpperCase() || 'P'}</span>}
          </button>
        </div>
      </header>

      <div className="feed-scroll-area">
        <div className="feed-content">
          <section className="feed-section discover-section">
            <div className="discover-heading">
              <div><p>Discover</p><h1>One meaningful connection at a time.</h1></div>
            </div>
            {requestMessage && <p className="discover-request-message" role="status">{requestMessage}</p>}

            {feedLoading ? (
              <div className="discover-stage discover-loading" role="status">
                <div className="feed-profile-skeleton" />
                <p>Finding a meaningful connection…</p>
              </div>
            ) : feedError ? (
              <div className="feed-empty" role="alert"><h3>Connections unavailable</h3><p>{feedError}</p><button type="button" onClick={() => loadFeed()}>Try again</button></div>
            ) : !currentProfile ? (
              <div className="feed-empty"><div className="feed-empty-icon">⌕</div><h3>{profiles.length ? 'You have seen everyone for now.' : 'No connections available right now.'}</h3><p>Check back soon.</p><button type="button" onClick={profiles.length ? () => loadFeed() : () => window.location.href = '/me'}>{profiles.length ? 'Review profiles again' : 'Expand your filters'}</button></div>
            ) : (
              <div className="discover-stage">
                <ProfileCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  onViewProfile={() => window.location.href = `/profile/${currentProfile.id}`}
                  onPass={() => setCurrentIndex(index => index + 1)}
                  onConnect={() => sendConnectionRequest(currentProfile.id, 'STANDARD')}
                  onQuiKey={() => { setRequestMessage(''); setQuiKeyOpen(true) }}
                  onMenu={() => setSafetyMenuOpen(true)}
                />
              </div>
            )}
          </section>
        </div>
      </div>
      {quiKeyOpen && currentProfile && (
        <div className="quikey-modal-backdrop" role="presentation" onMouseDown={() => !requestSending && setQuiKeyOpen(false)}>
          <section className="quikey-modal" role="dialog" aria-modal="true" aria-labelledby="quikey-title" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="quikey-modal-close" onClick={() => setQuiKeyOpen(false)} aria-label="Close">×</button>
            <span className="quikey-modal-icon" aria-hidden="true">⚿</span>
            <p className="quikey-modal-eyebrow">Send a QuiKey to {currentProfile.first_name}</p>
            <h2 id="quikey-title">Start with intention.</h2>
            <label htmlFor="quikey-answer">What is something you are genuinely looking forward to?</label>
            <textarea id="quikey-answer" value={quiKeyAnswer} onChange={event => setQuiKeyAnswer(event.target.value)} maxLength={300} rows={4} placeholder="Share a thoughtful, honest answer…" autoFocus />
            <small>{quiKeyAnswer.length}/300</small>
            <button type="button" className="quikey-modal-send" disabled={!quiKeyAnswer.trim() || requestSending} onClick={() => sendConnectionRequest(currentProfile.id, 'QUIKEY', quiKeyAnswer)}>{requestSending ? 'Sending…' : 'Send QuiKey'}</button>
            {requestMessage && <p className="quikey-modal-error" role="alert">{requestMessage}</p>}
          </section>
        </div>
      )}
      {safetyMenuOpen && currentProfile && (
        <div className="profile-safety-backdrop" onMouseDown={() => setSafetyMenuOpen(false)}>
          <section className="profile-safety-menu" role="dialog" aria-modal="true" aria-labelledby="safety-title" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="profile-safety-close" onClick={() => setSafetyMenuOpen(false)} aria-label="Close">×</button>
            <p>Safety options</p>
            <h2 id="safety-title">What would you like to do?</h2>
            <button type="button" className="profile-safety-option" onClick={() => window.location.href = `/report?reported_id=${currentProfile.id}&source=Connection+Profile`}><strong>Report profile</strong><span>Tell the QuiKeys safety team what happened.</span></button>
            <button type="button" className="profile-safety-option is-danger" onClick={() => { setSafetyMenuOpen(false); setBlockConfirmOpen(true) }}><strong>Block {currentProfile.first_name}</strong><span>You will be hidden from each other.</span></button>
            <button type="button" className="profile-safety-cancel" onClick={() => setSafetyMenuOpen(false)}>Cancel</button>
          </section>
        </div>
      )}
      {blockConfirmOpen && currentProfile && (
        <div className="profile-safety-backdrop" onMouseDown={() => !blocking && setBlockConfirmOpen(false)}>
          <section className="profile-safety-menu profile-block-confirm" role="alertdialog" aria-modal="true" aria-labelledby="block-title" onMouseDown={event => event.stopPropagation()}>
            <span className="profile-block-icon" aria-hidden="true">!</span>
            <h2 id="block-title">Block {currentProfile.first_name}?</h2>
            <p className="profile-block-copy">You will no longer see each other, exchange requests, or send messages. They will not be notified.</p>
            <button type="button" className="profile-block-button" disabled={blocking} onClick={() => blockProfile(currentProfile.id)}>{blocking ? 'Blocking…' : 'Yes, block profile'}</button>
            <button type="button" className="profile-safety-cancel" disabled={blocking} onClick={() => setBlockConfirmOpen(false)}>Cancel</button>
          </section>
        </div>
      )}
      <BottomNav active="feed" />
    </main>
  )
}
