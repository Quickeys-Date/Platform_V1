// src/app/page.tsx — S-01 Landing

import Image from 'next/image'
import Link from 'next/link'

const features = [
  {
    label: (
      <>
        Real people.
        <br />
        Real conversations.
      </>
    ),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" />
      </svg>
    ),
  },
  {
    label: (
      <>
        Thoughtful gestures.
        <br />
        Deeper connections.
      </>
    ),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19" />
      </svg>
    ),
  },
  {
    label: (
      <>
        Unlock meaningful
        <br />
        relationships.
      </>
    ),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="10" width="16" height="10" rx="1.4" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-frame" aria-hidden="true" />

      <header className="landing-brand">
        <div className="landing-mark">
          <Image
            src="/quickeys-icon.png"
            alt="QuicKeys"
            width={118}
            height={118}
            priority
          />
        </div>
      </header>

      <section className="landing-content">
        <div className="landing-headline">
          <h1>
            Meaningful connections. Made <em>beautifully</em> simple.
          </h1>

          <div className="landing-rule" aria-hidden="true" />

          <p className="landing-subtitle">
            A dating app that goes beyond dating
          </p>
        </div>

        <div className="landing-features">
          {features.map((feature, index) => (
            <div className="landing-feature" key={index}>
              <div className="landing-feature-icon">{feature.icon}</div>
              <p>{feature.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-actions">
        <div className="landing-buttons">
          <Link
            href="/auth/signup"
            className="landing-button landing-button-primary"
          >
            Create Your Profile
          </Link>

          <Link
            href="/auth/signin"
            className="landing-button landing-button-secondary"
          >
            Log In
          </Link>
        </div>

        <p className="landing-footnote">
          New to QuicKeys?{' '}
          <Link href="/auth/signup">Learn more</Link>
        </p>
      </footer>
    </main>
  )
}