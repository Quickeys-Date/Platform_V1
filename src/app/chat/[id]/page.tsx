'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/lib/types'
import {
  CloseConversationModal,
  UnmatchConfirmModal,
} from '@/components/CloseConversationModal'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''

  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  return age > 0 ? `, ${age}` : ''
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showUnmatchConfirm, setShowUnmatchConfirm] =
    useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastMsgAge, setLastMsgAge] = useState(0)

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

    for (const status of ['active', 'archived']) {
      const response = await apiFetch(
        `/api/conversations?status=${status}`
      )

      const data = await response.json()

      const found = data.conversations?.find(
        (conversation: Conversation) =>
          conversation.id === id
      )

      if (found) {
        setConv(found)
        break
      }
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

    const response = await apiFetch(
      `/api/conversations/${id}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    )

    if (!response.ok) {
      const error = await response.json()

      toast.error(error.error || 'Failed to send')
      setText(content)
    }

    setSending(false)
    inputRef.current?.focus()
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

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/feed'
            }}
            className="chat-back"
            aria-label="Return to connections"
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