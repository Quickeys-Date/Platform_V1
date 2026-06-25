'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/lib/types'
import { CloseConversationModal } from '@/components/CloseConversationModal'
import toast from 'react-hot-toast'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000))
  return age > 0 ? `, ${age}` : ''
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showClose, setShowClose] = useState(false)
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
      const res = await fetch(`/api/conversations?status=${status}`)
      const data = await res.json()
      const found = data.conversations?.find((c: Conversation) => c.id === id)
      if (found) { setConv(found); break }
    }

    const msgRes = await fetch(`/api/conversations/${id}/messages`)
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
    const channel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
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
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Failed to send')
      setText(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const closeConversation = async () => {
    const res = await fetch(`/api/conversations/${id}/close`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error('Failed to close'); return }
    const triggerId = data.pax_trigger_id || ''
    window.location.href = `/pax/checkin?trigger_id=${triggerId}&type=CLOSE_CONVERSATION`
  }

  const other = conv?.other_profile as any
  const isArchived = conv?.status === 'archived'
  const show48hIndicator = !isArchived && lastMsgAge >= 48 && messages.length > 0

  return (
    <div className="flex flex-col h-svh">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 flex-shrink-0">
        <button onClick={() => window.location.href = '/feed'} className="text-xl p-1">←</button>
        {other && (
          <>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {other.first_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{other.first_name}{getAge(other.date_of_birth)}</div>
              <div className="text-xs text-gray-400">{other.city}, {other.state}</div>
            </div>
          </>
        )}
        {!isArchived && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowClose(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border-[1.5px] rounded-full text-xs font-bold"
              style={{ borderColor: '#C9A84C', color: '#C9A84C' }}>
              ✕ Close
            </button>
            <button onClick={() => window.location.href = `/report?reported_id=${other?.id}&source=Chat`}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500">
              ⚑
            </button>
          </div>
        )}
        {isArchived && (
          <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-full">Archived</span>
        )}
      </div>

      {show48hIndicator && (
        <div className="px-4 py-2 text-center text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
          No messages in a while — say hello?
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-sm">You matched with {other?.first_name}!<br />Send a message to start the conversation.</p>
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed ${mine ? 'bubble-mine' : 'bubble-theirs'}`}>
                {msg.content}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {!isArchived ? (
        <div className="border-t border-gray-200 px-4 py-3 pb-safe flex gap-3 items-end bg-white flex-shrink-0">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Message…"
            rows={1}
            className="flex-1 px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-2xl text-sm resize-none focus:border-gray-400 leading-5 max-h-28"
          />
          <button onClick={send} disabled={!text.trim() || sending}
            className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0 text-base">
            ↑
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-4 text-center text-sm text-gray-400 bg-white flex-shrink-0">
          This conversation is archived and read-only.
        </div>
      )}

      {showClose && (
        <CloseConversationModal onConfirm={closeConversation} onCancel={() => setShowClose(false)} />
      )}
    </div>
  )
}
