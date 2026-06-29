// src/app/page.tsx — S-01 Landing
// Redesigned with QuicKeys brand: deep black, teal, gold
import Link from 'next/link'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 50%, #021415 100%)' }}>
      {/* Status bar */}
      <div className="status-bar">
        <span>9:41</span>
        <span>●●● WiFi 🔋</span>
      </div>

      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-6">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center pt-6">
          <QuicKeysLogo size="lg" showWordmark showTagline />
        </div>

        {/* Hero image placeholder + text */}
        <div className="flex-1 flex flex-col items-center justify-center w-full my-6">
          {/* Teal glow orb behind text */}
          <div className="relative w-full flex items-center justify-center" style={{ minHeight: 220 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div style={{
                width: 280, height: 280,
                background: 'radial-gradient(circle, rgba(13,158,166,0.15) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />
            </div>
            <div className="relative text-center px-4">
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 600,
                color: 'white',
                lineHeight: 1.3,
                marginBottom: 12,
              }}>
                Meaningful connections.<br />
                Made <em style={{ color: '#FFC766' }}>beautifully</em> simple.
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                A dating app that goes beyond dating
              </p>
            </div>
          </div>

          {/* Three feature icons */}
          <div className="flex justify-center gap-8 mt-2">
            {[
              { icon: '♡', label: 'Real people.\nReal conversations.' },
              { icon: '❋', label: 'Thoughtful gestures.\nDeeper connections.' },
              { icon: '🗝', label: 'Unlock meaningful\nrelationships.' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-2" style={{ maxWidth: 80 }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'rgba(4, 53, 56, 0.8)',
                  border: '1px solid rgba(15, 183, 191, 0.3)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: '0 0 16px rgba(13, 158, 166, 0.2)',
                }}>
                  {f.icon}
                </div>
                <span style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center', lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="w-full space-y-3 pb-6">
          <Link href="/auth/signup">
            <div style={{
              background: 'linear-gradient(135deg, #043538, #0A6469)',
              border: '1.5px solid #0FB7BF',
              borderRadius: 16,
              padding: '17px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 4px 24px rgba(13, 158, 166, 0.2)',
            }}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#FFC766', fontSize: 16 }}>✦</span>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Create Your Profile</span>
              </div>
              <span style={{ color: '#FFC766', fontSize: 18 }}>→</span>
            </div>
          </Link>

          <Link href="/auth/signin">
            <div style={{
              background: 'transparent',
              border: '1.5px solid rgba(217, 155, 52, 0.4)',
              borderRadius: 16,
              padding: '16px 24px',
              textAlign: 'center',
              color: '#FFC766',
              fontWeight: 600,
              fontSize: 16,
            }}>
              Log In
            </div>
          </Link>

          <div className="flex items-center justify-center gap-2 pt-2">
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(217,155,52,0.5)', fontSize: 14 }}>♡</span>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <p className="text-center" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            New to QuicKeys?{' '}
            <Link href="/auth/signup" style={{ color: '#0FB7BF', fontWeight: 500 }}>
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
