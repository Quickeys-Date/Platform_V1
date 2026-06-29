'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/lib/types'
import { CloseConversationModal, UnmatchConfirmModal } from '@/components/CloseConversationModal'
import { apiFetch } from '@/lib/api'
import toast from 'react-hot-toast'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000))
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
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastMsgAge, setLastMsgAge] = useState<number>(0)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    for (const status of ['active', 'archived']) {
      const res = await apiFetch(`/api/conversations?status=${status}`)
      const data = await res.json()
      const found = data.conversations?.find((c: Conversation) => c.id === id)
      if (found) { setConv(found); break }
    }

    const msgRes = await apiFetch(`/api/conversations/${id}/messages`)
    const msgData = await msgRes.json()
    const msgs = msgData.messages || []
    setMessages(msgs)
    if (msgs.length > 0) {
      const last = new Date(msgs[msgs.length - 1].created_at)
      setLastMsgAge((Date.now() - last.getTime()) / (1000 * 60 * 60))
    }
  }, [id, supabase])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const channel = supabase.channel(`messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === (payload.new as Message).id)) return prev
            return [...prev, payload.new as Message]
          })
          setLastMsgAge(0)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, supabase])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const res = await apiFetch(`/api/conversations/${id}/messages`, {
      method: 'POST', body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Failed to send')
      setText(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const archiveConversation = async () => {
    setShowOptions(false)
    const res = await apiFetch(`/api/conversations/${id}/close`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error('Failed to archive'); return }
    window.location.href = `/pax/checkin?trigger_id=${data.pax_trigger_id || ''}&type=CLOSE_CONVERSATION`
  }

  const unmatchConversation = async () => {
    setShowUnmatchConfirm(false)
    const res = await apiFetch(`/api/conversations/${id}/unmatch`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error('Failed to unmatch'); return }
    window.location.href = `/pax/checkin?trigger_id=${data.pax_trigger_id || ''}&type=CLOSE_CONVERSATION`
  }

  const other = conv?.other_profile as any
  const isArchived = conv?.status === 'archived'
  const show48hIndicator = !isArchived && lastMsgAge >= 48 && messages.length > 0

  return (
    <div className="flex flex-col h-svh" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderBottom: '1px solid rgba(15,183,191,0.1)',
        background: 'rgba(6,27,30,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
      }}>
        <button onClick={() => window.location.href = '/feed'} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, padding: 4 }}>←</button>
        {other && (
          <button onClick={() => window.location.href = `/profile/${other.id}`}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #043538, #0A6469)',
              border: '1.5px solid rgba(15,183,191,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#0FB7BF', flexShrink: 0,
            }}>
              {other.first_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{other.first_name}{getAge(other.date_of_birth)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Tap to view profile</div>
            </div>
          </button>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isArchived && (
            <button onClick={() => setShowOptions(true)} style={{
              padding: '6px 12px', borderRadius: 20,
              border: '1.5px solid rgba(217,155,52,0.4)',
              color: '#FFC766', fontSize: 12, fontWeight: 600,
            }}>
              ⋯
            </button>
          )}
          <button onClick={() => window.location.href = `/report?reported_id=${other?.id}&source=Chat`}
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 4 }}>⚑</button>
        </div>
        {isArchived && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 20 }}>
            Archived
          </span>
        )}
      </div>

      {show48hIndicator && (
        <div style={{ padding: '8px 16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          No messages in a while — say hello?
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
            <p style={{ fontSize: 14 }}>You matched with {other?.first_name}!<br />Send a message to start the conversation.</p>
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <div className={mine ? 'bubble-mine' : 'bubble-theirs'}
                style={{ maxWidth: '78%', padding: '10px 14px', fontSize: 14, lineHeight: 1.5 }}>
                {msg.content}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3, padding: '0 4px' }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {!isArchived ? (
        <div style={{
          borderTop: '1px solid rgba(15,183,191,0.1)',
          padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'rgba(6,27,30,0.9)', backdropFilter: 'blur(20px)', flexShrink: 0,
        }}>
          <textarea
            ref={inputRef} value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Message…" rows={1}
            style={{
              flex: 1, padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(15,183,191,0.2)',
              borderRadius: 20, color: 'white', fontSize: 14, resize: 'none',
              fontFamily: 'inherit', maxHeight: 120, outline: 'none',
            }}
          />
          <button onClick={send} disabled={!text.trim() || sending}
            style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: text.trim() ? 'linear-gradient(135deg, #FFC766, #D99B34)' : 'rgba(255,255,255,0.1)',
              color: text.trim() ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
              border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            }}>
            ↑
          </button>
        </div>
      ) : (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px',
          textAlign: 'center', background: 'rgba(6,27,30,0.6)', flexShrink: 0,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            This conversation is archived and read-only.
          </p>
          {other && (
            <button onClick={() => window.location.href = `/profile/${other.id}`}
              style={{ color: '#FFC766', fontSize: 13, fontWeight: 600 }}>
              View {other.first_name}'s profile →
            </button>
          )}
        </div>
      )}

      {showOptions && (
        <CloseConversationModal
          onArchive={archiveConversation}
          onUnmatch={() => { setShowOptions(false); setShowUnmatchConfirm(true) }}
          onCancel={() => setShowOptions(false)}
        />
      )}
      {showUnmatchConfirm && (
        <UnmatchConfirmModal
          onConfirm={unmatchConversation}
          onCancel={() => setShowUnmatchConfirm(false)}
        />
      )}
    </div>
  )
}
