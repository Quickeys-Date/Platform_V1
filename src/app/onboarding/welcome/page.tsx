import Link from 'next/link'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { SetupProgress } from '@/components/SetupProgress'

export default function WelcomePage() {
  return (
    <main className="profile-welcome-page">
      <SetupProgress active={5} />
      <section className="profile-welcome-content">
        <QuicKeysLogo size="lg" showWordmark />

        <div className="profile-welcome-copy">
          <p className="profile-welcome-eyebrow">You’re all set</p>

          <h1>Profile created!</h1>

          <p>
            Before you start connecting, we&apos;d like to introduce you
            to Pax — your insight partner.
          </p>
        </div>

        <Link href="/onboarding/pax" className="profile-welcome-button">
          Meet Pax <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  )
}
