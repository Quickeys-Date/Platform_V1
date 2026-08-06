'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { PhotoDisplay } from '@/components/PhotoDisplay'
import type { Conversation, Profile } from '@/lib/types'
import { apiFetch } from '@/lib/api'

function getPreview(conversation: Conversation) {
  const message = conversation.last_message
  if (!message?.content) return 'Start your conversation with intention.'
  return message.content.length > 72 ? `${message.content.slice(0, 72)}…` : message.content
}

function formatTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/conversations?status=active')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setConversations(data.conversations || [])
    } catch {
      setError('We could not load your messages. Please try again.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadMessages() }, [loadMessages])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredConversations = conversations.filter(conversation => {
    if (!normalizedQuery) return true
    const profile = conversation.other_profile as Profile | undefined
    return [profile?.first_name, conversation.last_message?.content]
      .some(value => value?.toLowerCase().includes(normalizedQuery))
  })

  return (
    <main className="messages-page">
      <header className="messages-header">
        <Link
          href="/feed"
          className="messages-back"
          aria-label="Return to Discover"
          title="Return to Discover"
        >
          <span aria-hidden="true">←</span>
        </Link>
        <div><p>Connections</p><h1>Messages</h1><span>Conversations begin after a request is accepted.</span></div>
      </header>

      <div className="messages-content">
        {loading ? <div className="messages-state">Loading conversations…</div> : error ? (
          <div className="messages-state"><p>{error}</p><button type="button" onClick={loadMessages}>Try again</button></div>
        ) : conversations.length === 0 ? (
          <div className="messages-state"><span aria-hidden="true">♡</span><h2>No conversations yet</h2><p>When someone accepts a connection request, your conversation will appear here.</p><a href="/feed">Return to Discover</a></div>
        ) : (
          <>
          <label className="messages-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search messages"
              aria-label="Search conversations"
            />
          </label>
          {filteredConversations.length === 0 ? (
            <div className="messages-search-empty">
              <h2>No matching conversations</h2>
              <p>Try searching for a different name or message.</p>
            </div>
          ) : <section className="messages-list" aria-label="Active conversations">
            {filteredConversations.map(conversation => {
              const profile = conversation.other_profile as Profile | undefined
              return <a className="message-row" href={`/chat/${conversation.id}`} key={conversation.id}>
                <PhotoDisplay photos={profile?.photos || []} size={58} className="message-avatar" />
                <span className="message-copy"><strong>{profile?.first_name || 'QuiKeys member'}</strong><small>{getPreview(conversation)}</small></span>
                <span className="message-meta"><time>{formatTime(conversation.last_message_at)}</time>{Boolean(conversation.unread_count) && <b>{conversation.unread_count}</b>}</span>
              </a>
            })}
          </section>}
          </>
        )}
      </div>
      <BottomNav active="messages" />
    </main>
  )
}
