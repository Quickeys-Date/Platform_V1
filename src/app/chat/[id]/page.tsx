'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation, Profile } from '@/lib/types'
import { PhotoDisplay } from '@/components/PhotoDisplay'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import {
  CloseConversationModal,
  UnmatchConfirmModal,
} from '@/components/CloseConversationModal'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'
import { QuiKeyCall } from '@/components/QuiKeyCall'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''

  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  return age > 0 ? `, ${age}` : ''
}

function getConversationPreview(conversation: Conversation) {
  const content = conversation.last_message?.content
  if (!content) return 'Start your conversation with intention.'
  return content.length > 54 ? `${content.slice(0, 54)}…` : content
}

function formatConversationTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  // Keep one browser client for the lifetime of this screen. Recreating it on
  // every keystroke caused the load effect and realtime subscription to restart.
  const supabase = useMemo(() => createClient(), [])

  const [conv, setConv] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationSearch, setConversationSearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showUnmatchConfirm, setShowUnmatchConfirm] =
    useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastMsgAge, setLastMsgAge] = useState(0)
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport) return

    const syncViewport = () => {
      setViewport({
        height: visualViewport.height,
        top: visualViewport.offsetTop,
      })
    }

    syncViewport()
    visualViewport.addEventListener('resize', syncViewport)
    visualViewport.addEventListener('scroll', syncViewport)
    return () => {
      visualViewport.removeEventListener('resize', syncViewport)
      visualViewport.removeEventListener('scroll', syncViewport)
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setUserId(user.id)

    const activeResponse = await apiFetch('/api/conversations?status=active')
    const activeData = await activeResponse.json()
    const activeConversations = activeData.conversations || []
    setConversations(activeConversations)

    const activeConversation = activeConversations.find(
      (conversation: Conversation) => conversation.id === id
    )

    if (activeConversation) {
      setConv(activeConversation)
    } else {
      const archivedResponse = await apiFetch('/api/conversations?status=archived')
      const archivedData = await archivedResponse.json()
      const archivedConversation = archivedData.conversations?.find(
        (conversation: Conversation) => conversation.id === id
      )
      if (archivedConversation) setConv(archivedConversation)
    }

    const messageResponse = await apiFetch(
      `/api/conversations/${id}/messages`
    )

    const messageData = await messageResponse.json()
    const loadedMessages = messageData.messages || []

    setMessages(loadedMessages)

    if (loadedMessages.length > 0) {
      const lastMessage = new Date(
        loadedMessages[loadedMessages.length - 1].created_at
      )

      setLastMsgAge(
        (Date.now() - lastMessage.getTime()) /
          (1000 * 60 * 60)
      )
    }
  }, [id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        payload => {
          setMessages(previousMessages => {
            const newMessage = payload.new as Message

            if (
              previousMessages.find(
                message => message.id === newMessage.id
              )
            ) {
              return previousMessages
            }

            return [...previousMessages, newMessage]
          })

          setLastMsgAge(0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  const send = async () => {
    if (!text.trim() || sending) return

    setSending(true)

    const content = text.trim()
    setText('')

    try {
      const response = await apiFetch(
        `/api/conversations/${id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(result.error || 'Failed to send')
        setText(content)
      } else if (result.message) {
        // Do not make the sender wait for Supabase Realtime. The subscription
        // below still delivers messages from the other person and de-duplicates
        // this server-confirmed message when it arrives through realtime.
        setMessages(previousMessages =>
          previousMessages.some(message => message.id === result.message.id)
            ? previousMessages
            : [...previousMessages, result.message]
        )
        setLastMsgAge(0)
      }
    } catch {
      toast.error('The message could not be sent. Please try again.')
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const archiveConversation = async () => {
    setShowOptions(false)

    const response = await apiFetch(
      `/api/conversations/${id}/close`,
      {
        method: 'POST',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      toast.error('Failed to archive')
      return
    }

    window.location.href =
      `/pax/checkin?trigger_id=${data.pax_trigger_id || ''}` +
      '&type=CLOSE_CONVERSATION'
  }

  const unmatchConversation = async () => {
    setShowUnmatchConfirm(false)

    const response = await apiFetch(
      `/api/conversations/${id}/unmatch`,
      {
        method: 'POST',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      toast.error('Failed to unmatch')
      return
    }

    window.location.href =
      `/pax/checkin?trigger_id=${data.pax_trigger_id || ''}` +
      '&type=CLOSE_CONVERSATION'
  }

  const other = conv?.other_profile as any
  const isArchived = conv?.status === 'archived'

  const show48hIndicator =
    !isArchived &&
    lastMsgAge >= 48 &&
    messages.length > 0

  const filteredConversations = conversations.filter(conversation => {
    const profile = conversation.other_profile as Profile | undefined
    return (profile?.first_name || '')
      .toLowerCase()
      .includes(conversationSearch.trim().toLowerCase())
  })

  return (
    <main
      className="chat-page"
      style={viewport ? { height: `${viewport.height}px`, top: `${viewport.top}px`, bottom: 'auto' } : undefined}
    >
      <aside className="chat-inbox" aria-label="Your conversations">
        <div className="chat-inbox-brand">
          <QuicKeysLogo size="sm" />
        </div>

        <div className="chat-inbox-heading">
          <a
            href="/feed"
            className="chat-inbox-home"
            aria-label="Return to Discover"
            title="Return to Discover"
          >
            ←
          </a>
          <div>
            <span>Connections</span>
            <h1>Messages</h1>
          </div>
        </div>

        <label className="chat-inbox-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search conversations</span>
          <input
            type="search"
            value={conversationSearch}
            onChange={event => setConversationSearch(event.target.value)}
            placeholder="Search messages"
          />
        </label>

        <nav className="chat-inbox-list">
          {filteredConversations.map(conversation => {
            const profile = conversation.other_profile as Profile | undefined
            const isCurrent = conversation.id === id

            return (
              <a
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={`chat-inbox-row${isCurrent ? ' chat-inbox-row-active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <PhotoDisplay
                  photos={profile?.photos || []}
                  size={48}
                  className="chat-inbox-avatar"
                />
                <span className="chat-inbox-copy">
                  <strong>{profile?.first_name || 'QuiKeys member'}</strong>
                  <small>{getConversationPreview(conversation)}</small>
                </span>
                <span className="chat-inbox-meta">
                  <time>{formatConversationTime(conversation.last_message_at)}</time>
                  {Boolean(conversation.unread_count) && !isCurrent && (
                    <b>{conversation.unread_count}</b>
                  )}
                </span>
              </a>
            )
          })}

          {filteredConversations.length === 0 && (
            <p className="chat-inbox-empty">No conversations found.</p>
          )}
        </nav>

        <a className="chat-inbox-footer" href="/feed">
          <span aria-hidden="true">♡</span>
          Discover connections
        </a>
      </aside>

      <section className="chat-shell">
        <header className="chat-header">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/messages'
            }}
            className="chat-back"
            aria-label="Return to messages"
            title="Return to messages"
          >
            ←
          </button>

          {other ? (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/profile/${other.id}`
              }}
              className="chat-profile"
            >
              <span className="chat-avatar">
                {other.first_name?.[0]?.toUpperCase() || '?'}
              </span>

              <span className="chat-profile-copy">
                <span className="chat-profile-name">
                  {other.first_name}
                  {getAge(other.date_of_birth)}
                </span>

                <span className="chat-profile-hint">
                  Tap to view profile
                </span>
              </span>
            </button>
          ) : (
            <div className="chat-profile-placeholder" />
          )}

          <div className="chat-header-actions">
            {!isArchived && conv && (
              <QuiKeyCall conversationId={conv.id} userId={userId} otherName={other?.first_name || 'your connection'} />
            )}
            {!isArchived && (
              <button
                type="button"
                onClick={() => setShowOptions(true)}
                className="chat-options"
                aria-label="Conversation options"
              >
                ⋯
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  `/report?reported_id=${other?.id}` +
                  '&source=Chat'
              }}
              className="chat-report"
              aria-label="Report this user"
            >
              ⚑
            </button>

            {isArchived && (
              <span className="chat-archived-badge">
                Archived
              </span>
            )}
          </div>
        </header>

        {show48hIndicator && (
          <div className="chat-inactivity">
            No messages in a while — say hello?
          </div>
        )}

        <section className="chat-messages">
          <div className="chat-message-list">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div
                  className="chat-empty-symbol"
                  aria-hidden="true"
                >
                  ♡
                </div>

                <p>
                  You matched with {other?.first_name}!
                </p>

                <span>
                  Send a message to start the conversation.
                </span>
              </div>
            )}

            {messages.map(message => {
              const mine = message.sender_id === userId

              return (
                <div
                  key={message.id}
                  className={
                    mine
                      ? 'chat-message chat-message-mine'
                      : 'chat-message chat-message-theirs'
                  }
                >
                  <div
                    className={
                      mine ? 'bubble-mine' : 'bubble-theirs'
                    }
                  >
                    {message.content}
                  </div>

                  <time className="chat-message-time">
                    {new Date(
                      message.created_at
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              )
            })}

            <div ref={endRef} />
          </div>
        </section>

        {!isArchived ? (
          <footer className="chat-composer">
            <div className="chat-composer-inner">
              <label htmlFor="chat-message" className="sr-only">
                Message
              </label>

              <textarea
                id="chat-message"
                ref={inputRef}
                value={text}
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault()
                    send()
                  }
                }}
                placeholder="Message…"
                rows={1}
                className="chat-textarea"
              />

              <button
                type="button"
                onClick={send}
                disabled={!text.trim() || sending}
                className="chat-send"
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
          </footer>
        ) : (
          <footer className="chat-read-only">
            <p>
              This conversation is archived and read-only.
            </p>

            {other && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/profile/${other.id}`
                }}
              >
                View {other.first_name}&apos;s profile →
              </button>
            )}
          </footer>
        )}
      </section>

      {showOptions && (
        <CloseConversationModal
          onArchive={archiveConversation}
          onUnmatch={() => {
            setShowOptions(false)
            setShowUnmatchConfirm(true)
          }}
          onCancel={() => setShowOptions(false)}
        />
      )}

      {showUnmatchConfirm && (
        <UnmatchConfirmModal
          onConfirm={unmatchConversation}
          onCancel={() => setShowUnmatchConfirm(false)}
        />
      )}
    </main>
  )
}
