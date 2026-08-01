'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { createClient } from '@/lib/supabase/client'

type Tab = 'feed' | 'requests' | 'messages' | 'archived' | 'profile'

function NavIcon({ name }: { name: Tab }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'feed') return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9 3.9-1.7Z"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>
  if (name === 'requests') return <svg {...common}><path d="M20.2 5.8a5 5 0 0 0-7.1 0L12 6.9l-1.1-1.1a5 5 0 0 0-7.1 7.1L12 21l8.2-8.1a5 5 0 0 0 0-7.1Z"/><path d="M16.5 8.5v4M14.5 10.5h4"/></svg>
  if (name === 'messages') return <svg {...common}><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
  if (name === 'archived') return <svg {...common}><path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/></svg>
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>
}

export function BottomNav({ active }: { active: Tab }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
      setIsAdmin(data?.role === 'ADMIN' && data?.status === 'ACTIVE')
    }
    checkRole()
  }, [])

  const tabs: Array<{ id: Tab; label: string; href: string }> = [
    { id: 'feed', label: 'Discover', href: '/feed' },
    { id: 'requests', label: 'Requests', href: '/requests' },
    { id: 'messages', label: 'Messages', href: '/messages' },
    { id: 'archived', label: 'Archive', href: '/archived' },
    { id: 'profile', label: 'Profile', href: '/me' },
  ]

  return <nav className="bottom-nav" aria-label="Primary navigation">
    <div className="bottom-nav-brand"><QuicKeysLogo size="sm" showWordmark /></div>
    <div className="bottom-nav-inner">{tabs.map(tab => {
      const selected = active === tab.id
      return <Link key={tab.id} href={tab.href} className={`bottom-nav-link ${selected ? 'is-active' : ''}`} aria-current={selected ? 'page' : undefined}>
        <span className="bottom-nav-icon" aria-hidden="true"><NavIcon name={tab.id} /></span>
        <span className="bottom-nav-label">{tab.label}</span>
        {selected && <span className="bottom-nav-indicator" aria-hidden="true" />}
      </Link>
    })}
      {isAdmin && (
        <Link href="/admin/dashboard" className="bottom-nav-link bottom-nav-admin-link">
          <span className="bottom-nav-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v5.2c0 4.7 2.9 8 7.5 9.8 4.6-1.8 7.5-5.1 7.5-9.8V6L12 3Z"/><path d="M9 12h6M12 9v6"/></svg>
          </span>
          <span className="bottom-nav-label">Admin Dashboard</span>
        </Link>
      )}
    </div>
  </nav>
}
