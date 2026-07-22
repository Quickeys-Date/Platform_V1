'use client'

import { QuicKeysLogo } from '@/components/QuicKeysLogo'

type Tab = 'feed' | 'archived' | 'profile'

export function BottomNav({ active }: { active: Tab }) {
  const tabs = [
    {
      id: 'feed' as Tab,
      icon: '⊙',
      label: 'Discover',
      href: '/feed',
    },
    {
      id: 'archived' as Tab,
      icon: '◯',
      label: 'Archive',
      href: '/archived',
    },
    {
      id: 'profile' as Tab,
      icon: '◎',
      label: 'Profile',
      href: '/me',
    },
  ]

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-brand">
        <QuicKeysLogo size="sm" showWordmark />
      </div>

      <div className="bottom-nav-inner">
        {tabs.map(tab => {
          const selected = active === tab.id

          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`bottom-nav-link ${
                selected ? 'bottom-nav-link-active' : ''
              }`}
              aria-current={selected ? 'page' : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                {tab.icon}
              </span>

              <span className="bottom-nav-label">
                {tab.label}
              </span>

              {selected && (
                <span className="bottom-nav-indicator" aria-hidden="true" />
              )}
            </a>
          )
        })}
      </div>
    </nav>
  )
}