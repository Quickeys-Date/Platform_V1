'use client'
// src/app/archived/page.tsx — S-17 Archived Conversations
// Sorted by date closed, most recent first.
// Each item shows: other user first name, date archived, first line of last message.
// Read-only — no reply, no resume, no unarchive.
// Other user profile is not linked — name display only per spec.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'

export default function ArchivedPage() {
  const router = useRouter()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingConv, setViewingConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get current user ID for message display
    fetch('/api/profiles/me').then(r => r.json()).then(d => setUserId(d.profile?.id))
    // Sorted by archived_at desc per spec
    fetch('/api/conversations?status=archived')
      .then(r => r.json())
      .then(d => { setConvs(d.conversations || []); setLoading(false) })
  }, [])

  const openConversation = async (conv: Conversation) => {
    setViewingConv(conv)
    const res = await fetch(`/api/conversations/${conv.id}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  // Read-only conversation view
  if (viewingConv) {
    const other = viewingConv.other_profile as any
    return (
      <div className="flex flex-col min-h-svh">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={() => { setViewingConv(null); setMessages([]) }} className="text-xl">←</button>
          {/* Name display only — profile not linked per spec */}
          <h1 className="font-bold text-base flex-1 text-center">{other?.first_name} — archived</h1>
          <div className="w-7" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-6">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No messages in this conversation.</div>
          )}
          {messages.map((msg: any) => {
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
        </div>
        {/* Read-only notice */}
        <div className="border-t border-gray-100 px-4 py-4 text-center text-sm text-gray-400 bg-white">
          This conversation is archived and read-only.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => window.location.href = '/feed'} className="text-xl">←</button>
        <h1 className="font-bold text-base flex-1 text-center">Archive</h1>
        <div className="w-7" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : convs.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="text-5xl mb-4">📁</div>
            <h2 className="font-bold text-lg mb-2">No archived conversations</h2>
            <p className="text-gray-400 text-sm">Closed conversations will appear here.</p>
          </div>
        ) : (
          // Sorted by date closed most recent first (handled by API)
          convs.map(conv => {
            const other = conv.other_profile as any
            const lastMsg = conv.last_message as any
            return (
              <button key={conv.id} onClick={() => openConversation(conv)}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 text-left">
                {/* Name only — no profile link per spec */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm flex-shrink-0">
                  {(other?.first_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{other?.first_name || 'Unknown'}</div>
                  {/* First line of last message per spec */}
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {lastMsg?.content || lastMsg?.text
                      ? (lastMsg.content || lastMsg.text).split('\n')[0].slice(0, 60)
                      : 'No messages'}
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-right flex-shrink-0">
                  {conv.archived_at ? new Date(conv.archived_at).toLocaleDateString() : ''}
                </div>
              </button>
            )
          })
        )}
      </div>
      <BottomNav active="archived" />
    </div>
  )
}
