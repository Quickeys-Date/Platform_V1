// src/components/BottomNav.tsx
'use client'
import Link from 'next/link'

type NavItem = 'feed' | 'archived' | 'profile'

export function BottomNav({ active }: { active: NavItem }) {
  const items = [
    { id: 'feed' as NavItem, icon: '🏠', label: 'Feed', href: '/feed' },
    { id: 'archived' as NavItem, icon: '📁', label: 'Archive', href: '/archived' },
    { id: 'profile' as NavItem, icon: '👤', label: 'Profile', href: '/me' },
  ]
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-gray-200 bg-white flex safe-bottom z-20">
      {items.map(item => (
        <Link key={item.id} href={item.href}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${active === item.id ? 'text-black' : 'text-gray-400'}`}>
          <span className="text-xl leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
