'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PAX_RESPONSE_A = `When we're disappointed, it's easy to make ourselves the explanation.

Sometimes the most useful first step is recognizing there may not be enough information yet to draw a conclusion.`

const PAX_RESPONSE_B = `Sometimes the most honest thing we can do is stay curious.

When something feels unclear, it often means we're missing context — not that something is wrong with us or with them.`

const PAX_TELL_ME_MORE = `Patterns in how we interpret silence, distance, or slow responses often form early — and they can shape the way we read situations before we have all the facts.

Pax is here to help you notice those patterns, not to tell you what they mean.`

type Step = 'intro' | 'example' | 'responds' | 'tellmemore'
type Answer = 'A' | 'B'

export default function PaxOnboardingPage() {
  const [step, setStep] = useState<Step>('intro')
  const [selected, setSelected] = useState<Answer | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single()

      if (data?.first_name) {
        setFirstName(data.first_name)
      }
    }

    loadProfile()
  }, [])

  const finish = async () => {
    if (finishing) return

    setFinishing(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ pax_onboarded: true })
          .eq('id', user.id)

        if (error) {
          console.error('Unable to finish Pax onboarding:', error)
          setFinishing(false)
          return
        }
      }

      window.location.href = '/feed'
    } catch (error) {
      console.error('Unable to finish Pax onboarding:', error)
      setFinishing(false)
    }
  }

  const goBack = () => {
    if (step === 'intro') {
      window.location.href = '/onboarding/welcome'
      return
    }

    if (step === 'example') {
      setSelected(null)
      setStep('intro')
      return
    }

    if (step === 'responds') {
      setStep('example')
      return
    }

    setStep('responds')
  }

  const selectedResponse =
    selected === 'A' ? PAX_RESPONSE_A : PAX_RESPONSE_B

  return (
    <main className="pax-page">
      <button
        type="button"
        onClick={goBack}
        className="pax-back-button"
        aria-label="Go back"
      >
        ← Back
      </button>

      {step === 'intro' && (
        <section className="pax-layout pax-intro-layout">
          <div className="pax-content pax-intro-content">
            <p className="pax-wordmark">Pax™</p>

            <div className="pax-intro-copy">
              <p className="pax-lead">I&apos;m Pax.</p>

              <p>Most dating apps help you find people.</p>

              <p>I help you think clearly about the people you meet.</p>

              <p>
                Sometimes a conversation feels exciting. Sometimes confusing.
                Sometimes disappointing.
              </p>

              <p>
                When that happens, I&apos;m here to help you slow down, see
                things more clearly, and decide what matters next.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('example')}
            className="pax-primary-button"
          >
            Continue
          </button>
        </section>
      )}

      {step === 'example' && (
        <section className="pax-layout">
          <div className="pax-content">
            <p className="pax-wordmark">Pax™</p>

            <p className="pax-eyebrow">
              Here&apos;s an example of how Pax works.
            </p>

            <div className="pax-question-area">
              <p className="pax-situation-label">Situation:</p>

              <h1 className="pax-situation">
                Someone you&apos;ve enjoyed talking with suddenly stops
                responding.
              </h1>

              <h2 className="pax-question">
                What is your first thought?
              </h2>

              <div className="pax-options">
                <button
                  type="button"
                  onClick={() => setSelected('A')}
                  className={`pax-option ${
                    selected === 'A' ? 'pax-option-selected' : ''
                  }`}
                >
                  <span className="pax-option-letter">A</span>
                  <span>Something is wrong with me</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelected('B')}
                  className={`pax-option ${
                    selected === 'B' ? 'pax-option-selected' : ''
                  }`}
                >
                  <span className="pax-option-letter">B</span>
                  <span>Maybe something changed on their side</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!selected}
            onClick={() => setStep('responds')}
            className="pax-primary-button"
          >
            Continue
          </button>
        </section>
      )}

      {step === 'responds' && (
        <section className="pax-layout">
          <div className="pax-content">
            <p className="pax-wordmark">Pax™</p>

            <div className="pax-response-card">
              {selectedResponse.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="pax-actions">
            <button
              type="button"
              onClick={() => setStep('tellmemore')}
              className="pax-secondary-button"
            >
              Tell Me More
            </button>

            <button
              type="button"
              onClick={finish}
              disabled={finishing}
              className="pax-primary-button"
            >
              {finishing ? 'Finishing…' : 'I Understand'}
            </button>
          </div>
        </section>
      )}

      {step === 'tellmemore' && (
        <section className="pax-layout">
          <div className="pax-content">
            <p className="pax-wordmark">Pax™</p>

            <div className="pax-response-card">
              {PAX_TELL_ME_MORE.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={finish}
            disabled={finishing}
            className="pax-primary-button"
          >
            {finishing ? 'Finishing…' : 'I Understand'}
          </button>
        </section>
      )}

      <style jsx>{`
        .pax-page {
          --pax-deep: #0a0a0a;
          --pax-outer: #061b1e;
          --pax-mid: #043538;
          --pax-teal: #0fb7bf;
          --pax-teal-highlight: #66f6ff;
          --pax-gold: #ffc766;
          --pax-gold-mid: #d99b34;
          --pax-gold-dark: #8a5a12;

          position: relative;
          width: 100%;
          min-height: 100svh;
          overflow-x: hidden;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 50% 40%,
              rgba(13, 158, 166, 0.18),
              transparent 48%
            ),
            linear-gradient(
              145deg,
              var(--pax-mid) 0%,
              var(--pax-outer) 50%,
              #021415 100%
            );
        }

        .pax-back-button {
          position: absolute;
          top: max(22px, env(safe-area-inset-top));
          left: clamp(20px, 4vw, 64px);
          z-index: 10;
          padding: 8px 4px;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font: inherit;
          font-size: 14px;
          cursor: pointer;
          transition:
            color 180ms ease,
            transform 180ms ease;
        }

        .pax-back-button:hover {
          color: var(--pax-teal-highlight);
          transform: translateX(-2px);
        }

        .pax-layout {
          width: min(100% - 40px, 760px);
          min-height: 100svh;
          margin: 0 auto;
          padding:
            max(82px, calc(env(safe-area-inset-top) + 62px))
            0
            max(28px, env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
        }

        .pax-intro-layout {
          width: min(100% - 40px, 680px);
        }

        .pax-content {
          width: 100%;
          margin: auto 0;
        }

        .pax-intro-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .pax-wordmark {
          margin: 0 0 clamp(42px, 7vh, 72px);
          color: var(--pax-gold-mid);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(22px, 2.2vw, 30px);
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .pax-intro-copy {
          display: grid;
          gap: clamp(22px, 3.5vh, 34px);
          font-size: clamp(17px, 1.3vw, 21px);
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.88);
        }

        .pax-intro-copy p {
          margin: 0;
        }

        .pax-intro-copy .pax-lead {
          color: #ffffff;
          font-weight: 700;
          font-size: clamp(21px, 1.6vw, 26px);
        }

        .pax-eyebrow {
          margin: 0 0 18px;
          color: rgba(102, 246, 255, 0.65);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .pax-question-area {
          width: 100%;
        }

        .pax-situation-label {
          margin: 0 0 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .pax-situation {
          margin: 0 0 28px;
          max-width: 680px;
          color: #ffffff;
          font-size: clamp(20px, 2vw, 27px);
          font-weight: 700;
          line-height: 1.4;
        }

        .pax-question {
          margin: 0 0 26px;
          color: #ffffff;
          font-size: clamp(19px, 1.7vw, 24px);
          font-weight: 700;
        }

        .pax-options {
          display: grid;
          gap: 12px;
        }

        .pax-option {
          width: 100%;
          min-height: 58px;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(102, 246, 255, 0.18);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.055);
          color: rgba(255, 255, 255, 0.88);
          font: inherit;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .pax-option:hover {
          border-color: rgba(15, 183, 191, 0.55);
          background: rgba(15, 183, 191, 0.11);
          transform: translateY(-1px);
        }

        .pax-option-selected {
          border-color: var(--pax-teal);
          background: rgba(15, 183, 191, 0.16);
          box-shadow: 0 0 22px rgba(13, 158, 166, 0.12);
        }

        .pax-option-letter {
          color: var(--pax-gold);
          font-weight: 800;
        }

        .pax-response-card {
          padding: clamp(22px, 4vw, 34px);
          border: 1px solid rgba(217, 155, 52, 0.4);
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              rgba(138, 90, 18, 0.17),
              rgba(255, 199, 102, 0.06)
            );
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.22);
        }

        .pax-response-card p {
          margin: 0 0 20px;
          color: rgba(255, 255, 255, 0.9);
          font-size: clamp(16px, 1.4vw, 20px);
          line-height: 1.7;
        }

        .pax-response-card p:last-child {
          margin-bottom: 0;
        }

        .pax-actions {
          width: min(100%, 360px);
          margin: 0 auto;
          display: grid;
          gap: 12px;
        }

        .pax-primary-button,
        .pax-secondary-button {
          width: min(100%, 340px);
          min-height: 52px;
          margin: 0 auto;
          padding: 14px 24px;
          border-radius: 14px;
          font: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 180ms ease,
            opacity 180ms ease,
            box-shadow 180ms ease;
        }

        .pax-primary-button {
          border: 1px solid var(--pax-gold-mid);
          background: linear-gradient(
            135deg,
            #ffe7b1 0%,
            var(--pax-gold) 46%,
            var(--pax-gold-mid) 100%
          );
          color: var(--pax-deep);
          box-shadow: 0 8px 28px rgba(217, 155, 52, 0.22);
        }

        .pax-secondary-button {
          border: 1px solid rgba(102, 246, 255, 0.3);
          background: rgba(15, 183, 191, 0.09);
          color: var(--pax-teal-highlight);
        }

        .pax-primary-button:hover:not(:disabled),
        .pax-secondary-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .pax-primary-button:hover:not(:disabled) {
          box-shadow: 0 12px 34px rgba(217, 155, 52, 0.3);
        }

        .pax-primary-button:disabled,
        .pax-secondary-button:disabled {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.35);
          box-shadow: none;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .pax-back-button {
            top: max(14px, env(safe-area-inset-top));
            left: 16px;
          }

          .pax-layout,
          .pax-intro-layout {
            width: min(100% - 32px, 520px);
            padding-top: max(
              68px,
              calc(env(safe-area-inset-top) + 54px)
            );
          }

          .pax-wordmark {
            margin-bottom: 32px;
          }

          .pax-intro-copy {
            gap: 20px;
            line-height: 1.55;
          }

          .pax-primary-button,
          .pax-secondary-button {
            width: 100%;
          }

          .pax-response-card {
            padding: 22px 18px;
          }
        }

        @media (max-height: 720px) and (min-width: 641px) {
          .pax-layout {
            padding-top: 66px;
            padding-bottom: 18px;
            gap: 20px;
          }

          .pax-wordmark {
            margin-bottom: 26px;
          }

          .pax-intro-copy {
            gap: 16px;
            font-size: 16px;
            line-height: 1.45;
          }

          .pax-primary-button,
          .pax-secondary-button {
            min-height: 46px;
            padding-block: 11px;
          }
        }
      `}</style>
    </main>
  )
}