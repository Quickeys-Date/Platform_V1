'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { apiFetch } from '@/lib/api'

export default function ArchivedPage() {
  const supabase = createClient()

  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingConv, setViewingConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUserId(user?.id || null)
      })

    apiFetch('/api/conversations?status=archived')
      .then(response => response.json())
      .then(data => {
        setConvs(data.conversations || [])
        setLoading(false)
      })
      .catch(() => {
        setConvs([])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openConversation = async (conv: Conversation) => {
    setViewingConv(conv)
    setMessages([])

    const response = await apiFetch(
      `/api/conversations/${conv.id}/messages`
    )
    const data = await response.json()

    setMessages(data.messages || [])
  }

  const closeConversationView = () => {
    setViewingConv(null)
    setMessages([])
  }

  /*
   * Archived conversation detail
   */
  if (viewingConv) {
    const other = viewingConv.other_profile as any

    return (
      <main className="archive-page archive-detail-page">
        <header className="archive-header">
          <div className="archive-header-inner">
            <button
              type="button"
              onClick={closeConversationView}
              className="archive-back-button"
              aria-label="Return to archived conversations"
            >
              ←
            </button>

            <h1 className="archive-header-title">
              {other?.first_name || 'Conversation'} — archived
            </h1>

            <div className="archive-header-spacer" aria-hidden="true" />
          </div>
        </header>

        <section className="archive-message-region">
          <div className="archive-message-list">
            {messages.length === 0 ? (
              <div className="archive-message-empty">
                No messages in this conversation.
              </div>
            ) : (
              messages.map((msg: any) => {
                const mine = msg.sender_id === userId

                return (
                  <div
                    key={msg.id}
                    className={
                      mine
                        ? 'archive-message archive-message-mine'
                        : 'archive-message archive-message-theirs'
                    }
                  >
                    <div
                      className={mine ? 'bubble-mine' : 'bubble-theirs'}
                    >
                      {msg.content}
                    </div>

                    <time className="archive-message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <footer className="archive-read-only">
          <div className="archive-read-only-inner">
            This conversation is archived and read-only.
          </div>
        </footer>

        <BottomNav active="archived" />
      </main>
    )
  }

  /*
   * Archived conversation list
   */
  return (
    <main className="archive-page">
      <header className="archive-header">
        <div className="archive-header-inner">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/feed'
            }}
            className="archive-back-button"
            aria-label="Return to connections"
          >
            ←
          </button>

          <h1 className="archive-header-title">Archive</h1>

          <div className="archive-header-spacer" aria-hidden="true" />
        </div>
      </header>

      <section className="archive-content">
        {loading ? (
          <div className="archive-loading">
            <div className="archive-spinner" />
          </div>
        ) : convs.length === 0 ? (
          <div className="archive-empty-state">
            <div className="archive-empty-icon">📁</div>

            <h2>No archived conversations</h2>

            <p>Closed conversations will appear here.</p>
          </div>
        ) : (
          <div className="archive-list">
            {convs.map(conv => {
              const other = conv.other_profile as any
              const lastMessage = conv.last_message as any

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="archive-row"
                >
                  <div className="archive-avatar">
                    {(other?.first_name || '?')[0].toUpperCase()}
                  </div>

                  <div className="archive-row-content">
                    <div className="archive-row-name">
                      {other?.first_name || 'Unknown'}
                    </div>

                    <div className="archive-row-preview">
                      {lastMessage?.content
                        ? lastMessage.content
                            .split('\n')[0]
                            .slice(0, 80)
                        : 'No messages'}
                    </div>
                  </div>

                  {conv.archived_at && (
                    <time
                      className="archive-row-date"
                      dateTime={conv.archived_at}
                    >
                      {new Date(conv.archived_at).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </time>
                  )}

                  <span className="archive-row-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <BottomNav active="archived" />
    </main>
  )
}