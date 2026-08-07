import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QuiKeys™ Administration',
  description: 'Authorized QuiKeys administration workspace.',
  icons: {
    icon: [{ url: '/quickeys-icon.png?v=2', type: 'image/png', sizes: '695x695' }],
    shortcut: '/quickeys-icon.png?v=2',
    apple: '/quickeys-icon.png?v=2',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
