'use client'
// src/components/BottomNav.tsx — dark brand theme
type Tab = 'feed' | 'archived' | 'profile'

export function BottomNav({ active }: { active: Tab }) {
  const tabs = [
    { id: 'feed' as Tab, icon: '⊙', label: 'Discover', href: '/feed' },
    { id: 'archived' as Tab, icon: '💬', label: 'Archive', href: '/archived' },
    { id: 'profile' as Tab, icon: '◎', label: 'Profile', href: '/me' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'rgba(6, 27, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(15, 183, 191, 0.15)',
      display: 'flex',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      paddingTop: 10,
      zIndex: 50,
    }}>
      {tabs.map(tab => (
        <a key={tab.id} href={tab.href} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          textDecoration: 'none',
        }}>
          <span style={{
            fontSize: 20,
            color: active === tab.id ? '#FFC766' : 'rgba(255,255,255,0.35)',
            transition: 'color 0.2s',
          }}>
            {tab.icon}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? '#FFC766' : 'rgba(255,255,255,0.35)',
            letterSpacing: '0.05em',
          }}>
            {tab.label}
          </span>
          {active === tab.id && (
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: '#FFC766',
              boxShadow: '0 0 6px #FFC766',
            }} />
          )}
        </a>
      ))}
    </nav>
  )
}
