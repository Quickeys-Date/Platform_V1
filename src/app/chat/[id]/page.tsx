'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

import {
  CloseConversationModal,
  UnmatchConfirmModal,
} from '@/components/CloseConversationModal'
import { apiFetch } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/lib/types'

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

  const [conversation, setConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastMessageAge, setLastMessageAge] = useState(0)

  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
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

      const foundConversation = data.conversations?.find(
        (item: Conversation) => item.id === id
      )

      if (foundConversation) {
        setConversation(foundConversation)
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

      setLastMessageAge(
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
          const newMessage = payload.new as Message

          setMessages(currentMessages => {
            const alreadyExists = currentMessages.some(
              message => message.id === newMessage.id
            )

            if (alreadyExists) return currentMessages

            return [...currentMessages, newMessage]
          })

          setLastMessageAge(0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  const sendMessage = async () => {
    const content = text.trim()

    if (!content || sending) return

    setSending(true)
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

      toast.error(error.error || 'Failed to send message.')
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
      toast.error('Failed to archive conversation.')
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
      toast.error('Failed to unmatch.')
      return
    }

    window.location.href =
      `/pax/checkin?trigger_id=${data.pax_trigger_id || ''}` +
      '&type=CLOSE_CONVERSATION'
  }

  const otherProfile = conversation?.other_profile as any
  const isArchived = conversation?.status === 'archived'

  const showInactivityMessage =
    !isArchived &&
    lastMessageAge >= 48 &&
    messages.length > 0

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <button
            type="button"
            className="chat-back"
            aria-label="Return to conversations"
            onClick={() => {
              window.location.href = isArchived
                ? '/archived'
                : '/feed'
            }}
          >
            ←
          </button>

          {otherProfile ? (
            <button
              type="button"
              className="chat-profile"
              onClick={() => {
                window.location.href =
                  `/profile/${otherProfile.id}`
              }}
            >
              <span className="chat-avatar">
                {otherProfile.first_name?.[0]?.toUpperCase() ||
                  '?'}
              </span>

              <span className="chat-profile-copy">
                <span className="chat-profile-name">
                  {otherProfile.first_name}
                  {getAge(otherProfile.date_of_birth)}
                </span>

                <span className="chat-profile-hint">
                  Tap to view profile
                </span>
              </span>
            </button>
          ) : (
            <div className="chat-profile" />
          )}

          <div className="chat-header-actions">
            {!isArchived && (
              <button
                type="button"
                className="chat-options"
                aria-label="Conversation options"
                onClick={() => setShowOptions(true)}
              >
                •••
              </button>
            )}

            <button
              type="button"
              className="chat-report"
              aria-label="Report this user"
              onClick={() => {
                window.location.href =
                  `/report?reported_id=${otherProfile?.id}` +
                  '&source=Chat'
              }}
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

        {showInactivityMessage && (
          <div className="chat-inactivity">
            No messages in a while — say hello?
          </div>
        )}

        <div className="chat-messages">
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
                  You matched with{' '}
                  {otherProfile?.first_name || 'this person'}!
                </p>

                <span>
                  Send a message to start the conversation.
                </span>
              </div>
            )}

            {messages.map(message => {
              const isMine = message.sender_id === userId

              return (
                <div
                  key={message.id}
                  className={
                    isMine
                      ? 'chat-message chat-message-mine'
                      : 'chat-message chat-message-theirs'
                  }
                >
                  <div
                    className={
                      isMine
                        ? 'bubble-mine'
                        : 'bubble-theirs'
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

            <div ref={messageEndRef} />
          </div>
        </div>

        {!isArchived ? (
          <footer className="chat-composer">
            <div className="chat-composer-inner">
              <textarea
                ref={inputRef}
                value={text}
                rows={1}
                className="chat-textarea"
                placeholder="Message…"
                aria-label="Message"
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
              />

              <button
                type="button"
                className="chat-send"
                disabled={!text.trim() || sending}
                aria-label="Send message"
                onClick={sendMessage}
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

            {otherProfile && (
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    `/profile/${otherProfile.id}`
                }}
              >
                View {otherProfile.first_name}&apos;s profile →
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