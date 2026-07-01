import Link from 'next/link'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center" style={{ background: 'linear-gradient(160deg, #061B1E 0%, #0A0A0A 60%)' }}>
      <div className="mb-8"><QuicKeysLogo size="lg" showWordmark /></div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 8 }}>Profile created!</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 40 }}>
        Before you start connecting, we'd like to introduce you to Pax — your insight partner.
      </p>
      <Link href="/onboarding/pax" style={{ display: 'block', width: '100%', padding: 16, background: 'linear-gradient(135deg, #FFC766, #D99B34)', color: '#0A0A0A', fontWeight: 700, fontSize: 16, borderRadius: 14, textDecoration: 'none' }}>
        Meet Pax →
      </Link>
    </div>
  )
}
