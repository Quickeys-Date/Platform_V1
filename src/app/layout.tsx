import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuicKeys™ — A dating app that goes beyond dating',
  description: 'A guided dating experience that helps you navigate what happens after the conversation, not just during it.',
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
