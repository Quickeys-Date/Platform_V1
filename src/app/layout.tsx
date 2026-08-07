import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { IncomingCallListener } from '@/components/IncomingCallListener'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuiKeys™ — A dating app that goes beyond dating',
  description: 'A guided dating experience that helps you navigate what happens after the conversation, not just during it.',
  icons: {
    // Use the square, tightly cropped brand mark for browser tabs. The full
    // 3:2 logo becomes too small and looks washed out at 16–32px favicon size.
    icon: [{ url: '/quickeys-icon.png?v=2', type: 'image/png', sizes: '695x695' }],
    shortcut: '/quickeys-icon.png?v=2',
    apple: '/quickeys-icon.png?v=2',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
        </div>
        <IncomingCallListener />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#061B1E',
              color: 'white',
              border: '1px solid rgba(15,183,191,0.3)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
