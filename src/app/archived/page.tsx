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
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
    apiFetch('/api/conversations?status=archived')
      .then(r => r.json())
      .then(d => { setConvs(d.conversations || []); setLoading(false) })
  }, []) // eslint-disable-line

  const openConversation = async (conv: Conversation) => {
    setViewingConv(conv)
    const res = await apiFetch(`/api/conversations/${conv.id}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  if (viewingConv) {
    const other = viewingConv.other_profile as any
    return (
      <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          borderBottom: '1px solid rgba(15,183,191,0.1)',
          background: 'rgba(6,27,30,0.9)', backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => { setViewingConv(null); setMessages([]) }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>←</button>
          <h1 style={{ fontWeight: 700, fontSize: 16, color: 'white', flex: 1, textAlign: 'center' }}>
            {other?.first_name} — archived
          </h1>
          <div style={{ width: 28 }} />
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              No messages in this conversation.
            </div>
          )}
          {messages.map((msg: any) => {
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
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 16, textAlign: 'center', background: 'rgba(6,27,30,0.6)' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>This conversation is archived and read-only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
      {/* Dark header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid rgba(15,183,191,0.1)',
        background: 'rgba(6,27,30,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => window.location.href = '/feed'}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>←</button>
        <h1 style={{ fontWeight: 700, fontSize: 16, color: 'white', flex: 1, textAlign: 'center' }}>Archive</h1>
        <div style={{ width: 28 }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #0FB7BF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : convs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8 }}>No archived conversations</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Closed conversations will appear here.</p>
          </div>
        ) : (
          convs.map(conv => {
            const other = conv.other_profile as any
            const lastMsg = conv.last_message as any
            return (
              <button key={conv.id} onClick={() => openConversation(conv)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #043538, #0A6469)',
                  border: '1.5px solid rgba(15,183,191,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#0FB7BF',
                }}>
                  {(other?.first_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Name — clearly visible */}
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 3 }}>
                    {other?.first_name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} className="truncate">
                    {lastMsg?.content ? lastMsg.content.split('\n')[0].slice(0, 50) : 'No messages'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
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
