'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { QuicKeysLogo } from '@/components/QuicKeysLogo'
import { SetupProgress } from '@/components/SetupProgress'

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get('email') || 'your email'
  const errorCode = params.get('error_code') || ''
  const isExpired = errorCode === 'otp_expired'
  const sentAt = Number(params.get('sent_at') || 0)

  const [cooldown, setCooldown] = useState(0)
  const [initialDeliveryWindow, setInitialDeliveryWindow] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendEmail, setResendEmail] = useState(email === 'your email' ? '' : email)

  useEffect(() => {
    if (!sentAt) return
    const remaining = Math.max(0, Math.ceil((sentAt + 60_000 - Date.now()) / 1000))
    setInitialDeliveryWindow(remaining > 0)
    setCooldown(remaining)
  }, [sentAt])

  useEffect(() => {
    if (cooldown <= 0) {
      setInitialDeliveryWindow(false)
      return
    }

    const timer = window.setTimeout(() => {
      setCooldown(current => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    const destination = resendEmail.trim()
    if (cooldown > 0 || !destination.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Enter the email address used to create your account.')
      return
    }

    const supabase = createClient()
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: destination,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        const message = error.message.toLowerCase()
        if (message.includes('rate') || message.includes('security purposes') || message.includes('seconds')) {
          setCooldown(60)
          toast.error('Please wait before requesting another verification email.')
        } else if (message.includes('already') && message.includes('confirm')) {
          toast.error('This email is already verified. Return to sign in.')
        } else {
          toast.error(error.message || 'Unable to send the verification email.')
        }
        return
      }

      toast.success('Verification email sent!')
      setCooldown(60)
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="verify-page">
      <div className="verify-frame" aria-hidden="true" />
      <SetupProgress active={2} />

      <section className="verify-content">
        <div className="verify-logo">
          <QuicKeysLogo size="md" showWordmark={false} />
        </div>

        <p className="verify-eyebrow">
          {isExpired ? 'Verification required' : 'Almost there'}
        </p>

        <h1 className="verify-title">
          {isExpired ? 'Link expired' : 'Check your email'}
        </h1>

        <p className="verify-description">
          {isExpired ? (
            <>
              Your verification link has expired. Request another email to
              continue creating your QuiKeys account.
            </>
          ) : (
            <>
              We sent a verification link to{' '}
              <span className="verify-email">{email}</span>. Open the link to
              activate your account.
            </>
          )}
        </p>

        <div className="verify-actions">
          {(isExpired || email === 'your email') && (
            <div className="verify-email-field">
              <label htmlFor="verification-email">Account email</label>
              <input
                id="verification-email"
                type="email"
                value={resendEmail}
                onChange={event => setResendEmail(event.target.value)}
                placeholder="name@email.com"
                autoComplete="email"
              />
            </div>
          )}
          {initialDeliveryWindow && cooldown > 0 ? (
            <p className="verify-delivery-note" role="status">
              Verification email sent. Check your inbox and spam folder.
            </p>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resending || cooldown > 0}
              className="verify-resend"
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : isExpired
                    ? 'Send a new link'
                    : 'Resend email'}
            </button>
          )}

          <a href="/auth/signin" className="verify-back">
            Back to sign in
          </a>
        </div>
      </section>

      <style jsx>{`
        .verify-page {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100svh;
          min-height: 520px;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(
              circle at 50% 27%,
              rgba(13, 158, 166, 0.14),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #061b1e 0%,
              #0a0a0a 48%,
              #021415 100%
            );
        }

        .verify-frame {
          position: absolute;
          inset: 20px 28px;
          border: 1px solid rgba(217, 155, 52, 0.22);
          pointer-events: none;
        }

        .verify-content {
          position: relative;
          z-index: 1;
          width: min(100%, 650px);
          margin-top: -10vh;
          padding: 24px;
          text-align: center;
        }

        .verify-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 34px;
        }

        .verify-eyebrow {
          margin: 0 0 20px;
          color: #ffc766;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .verify-title {
          margin: 0 0 24px;
          color: #ffffff;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 700;
          line-height: 1.08;
        }

        .verify-description {
          max-width: 600px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.58);
          font-size: clamp(14px, 1.3vw, 16px);
          line-height: 1.8;
        }

        .verify-email {
          color: #ffc766;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .verify-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 40px;
        }

        .verify-email-field {
          width: min(100%, 380px);
          margin-bottom: 20px;
          text-align: left;
        }

        .verify-email-field label {
          display: block;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .verify-email-field input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border: 1px solid rgba(217, 155, 52, 0.35);
          border-radius: 12px;
          outline: none;
          background: rgba(255, 255, 255, 0.045);
          color: #ffffff;
          font: inherit;
        }

        .verify-email-field input:focus {
          border-color: #0fb7bf;
          box-shadow: 0 0 0 3px rgba(15, 183, 191, 0.12);
        }

        .verify-resend {
          width: auto;
          min-width: 210px;
          max-width: 100%;
          padding: 12px 25px;
          border: 1px solid rgba(15, 183, 191, 0.65);
          border-radius: 999px;
          background: rgba(4, 53, 56, 0.25);
          color: #66f6ff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .verify-resend:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #0fb7bf;
          background: rgba(15, 183, 191, 0.14);
        }

        .verify-resend:disabled {
          cursor: default;
          border-color: rgba(217, 155, 52, 0.32);
          background: rgba(217, 155, 52, 0.08);
          color: #ffc766;
          opacity: 0.72;
        }

        .verify-delivery-note {
          margin: 0;
          color: #66f6ff;
          font-size: 13px;
          line-height: 1.5;
        }

        .verify-back {
          display: inline-block;
          margin-top: 30px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.2;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .verify-back:hover {
          color: #ffc766;
        }

        @media (max-width: 600px) {
          .verify-page {
            min-height: 500px;
            padding: 20px;
          }

          .verify-frame {
            inset: 12px;
          }

          .verify-content {
            margin-top: -7vh;
            padding: 18px 12px;
          }

          .verify-logo {
            margin-bottom: 28px;
          }

          .verify-eyebrow {
            margin-bottom: 17px;
            font-size: 12px;
          }

          .verify-title {
            margin-bottom: 20px;
            font-size: 32px;
          }

          .verify-description {
            max-width: 340px;
            font-size: 14px;
            line-height: 1.7;
          }

          .verify-actions {
            margin-top: 34px;
          }

          .verify-resend {
            min-width: 146px;
            padding: 11px 22px;
          }

          .verify-back {
            margin-top: 27px;
            font-size: 12px;
          }
        }

        @media (max-height: 650px) {
          .verify-content {
            margin-top: -3vh;
          }

          .verify-logo {
            margin-bottom: 20px;
          }

          .verify-eyebrow {
            margin-bottom: 14px;
          }

          .verify-title {
            margin-bottom: 16px;
          }

          .verify-actions {
            margin-top: 25px;
          }

          .verify-back {
            margin-top: 22px;
          }
        }
      `}</style>
    </main>
  )
}

function VerifyFallback() {
  return (
    <div className="verify-fallback">
      <div className="verify-spinner" />

      <style jsx>{`
        .verify-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100svh;
          background: #0a0a0a;
        }

        .verify-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #0fb7bf;
          border-top-color: transparent;
          border-radius: 50%;
          animation: verify-spin 0.8s linear infinite;
        }

        @keyframes verify-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  )
}
