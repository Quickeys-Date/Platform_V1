'use client'

import { useState } from 'react'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { createClient } from '@/lib/supabase/client'

export default function EmailVerifiedPage() {
  const [leaving, setLeaving] = useState(false)

  const goToSignIn = async () => {
    setLeaving(true)
    await createClient().auth.signOut({ scope: 'local' })
    window.location.href = '/auth/signin?verified=1'
  }

  return (
    <main className="verified-page">
      <section className="verified-card">
        <QuicKeysLogo size="md" showWordmark={false} />
        <div className="verified-check" aria-hidden="true">✓</div>
        <p className="verified-eyebrow">Verification confirmed</p>
        <h1>Your email is verified.</h1>
        <p>Return to sign in to continue with age verification, administrator approval, and your QuiKeys profile.</p>
        <button type="button" onClick={goToSignIn} disabled={leaving}>
          {leaving ? 'Opening sign in…' : 'Go to sign in'}
        </button>
      </section>

      <style jsx>{`
        .verified-page {
          display: grid;
          min-height: 100svh;
          place-items: center;
          padding: 24px;
          background: radial-gradient(circle at 50% 35%, rgba(15,183,191,.14), transparent 34%), #071517;
          color: #fff;
        }
        .verified-card {
          width: min(100%, 520px);
          padding: 42px 28px;
          border: 1px solid rgba(217,155,52,.32);
          border-radius: 22px;
          background: rgba(5,15,16,.76);
          text-align: center;
          box-shadow: 0 24px 70px rgba(0,0,0,.32);
        }
        .verified-check {
          display: grid;
          width: 56px;
          height: 56px;
          margin: 28px auto 20px;
          place-items: center;
          border: 1px solid #0fb7bf;
          border-radius: 50%;
          color: #66f6ff;
          font-size: 26px;
        }
        .verified-eyebrow {
          margin: 0 0 12px;
          color: #ffc766;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0 0 14px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 5vw, 44px);
        }
        p:not(.verified-eyebrow) {
          max-width: 390px;
          margin: 0 auto 28px;
          color: rgba(255,255,255,.62);
          line-height: 1.7;
        }
        button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          border: 1px solid rgba(217,155,52,.7);
          border-radius: 999px;
          background: transparent;
          color: #ffc766;
          font: inherit;
          cursor: pointer;
          text-decoration: none;
        }
        button:disabled { cursor: wait; opacity: .65; }
      `}</style>
    </main>
  )
}
