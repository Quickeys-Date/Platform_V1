'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SetupProgress } from '@/components/SetupProgress'
import styles from './page.module.css'

function calculateAge(dateOfBirth: string) {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const beforeBirthday = today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export default function AgeVerificationPage() {
  const router = useRouter()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/signin')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('date_of_birth, status')
        .eq('id', user.id)
        .single()
      if (data?.status === 'PENDING_APPROVAL' || data?.status === 'REJECTED') {
        router.replace('/auth/pending-approval')
        return
      }
      if (data?.status === 'ACTIVE') {
        router.replace('/onboarding/welcome')
        return
      }
      // Signup records the date in auth metadata before the profile trigger
      // copies it. Use that original value when the trigger is delayed or an
      // older database installation did not copy the field.
      const signupDateOfBirth = typeof user.user_metadata?.date_of_birth === 'string'
        ? user.user_metadata.date_of_birth
        : ''
      const profileDateOfBirth = data?.date_of_birth && !data.date_of_birth.startsWith('1900-')
        ? data.date_of_birth
        : ''
      setDateOfBirth(profileDateOfBirth || signupDateOfBirth)
      if (!profileDateOfBirth && !signupDateOfBirth) {
        setError('Your date of birth was not saved. Please contact the QuiKeys team for assistance.')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const continueToReview = async () => {
    if (!confirmed || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/beta/confirm-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_of_birth: dateOfBirth }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to confirm your eligibility.')
        return
      }
      router.replace('/auth/pending-approval')
    } catch {
      setError('Unable to confirm your eligibility. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null

  return (
    <main className={styles.page}>
      <SetupProgress active={3} />
      <header className={styles.header}>
        <button type="button" className={styles.mobileBack} onClick={() => router.back()} aria-label="Go back">←</button>
        <Link className={styles.brand} href="/" aria-label="QuiKeys home">
          <Image src="/quikeys-logo.png" alt="" width={48} height={48} style={{ objectFit: 'contain' }} priority />
          <span>QuiKeys™</span>
        </Link>
      </header>

      <section className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.stepLabel}>Step 3 of 5</p>
          <h1>Confirm You&apos;re<br />18 or Older</h1>
          <div className={styles.divider}><span>♡</span></div>
          <p>QuiKeys is an adults-only experience. Confirm your eligibility before submitting your beta application.</p>
        </div>

        <div className={styles.verification}>
          <div className={styles.shield} aria-hidden="true">
            <svg viewBox="0 0 120 140">
              <path d="M60 6 108 25v39c0 32-19 56-48 69C31 120 12 96 12 64V25L60 6Z" />
              <path d="m35 69 16 17 35-42" />
            </svg>
          </div>

          {loading ? <p className={styles.status}>Checking your account…</p> : (
            <div className={styles.confirmCard}>
              <span className={styles.confirmLabel}>Date of birth</span>
              <strong>{dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not available'}</strong>
              {age !== null && <small>Calculated age: {age}</small>}
              <label className={styles.confirmCheck}>
                <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
                <span>I confirm that I am 18 or older.</span>
              </label>
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="button" className={styles.uploadButton} onClick={continueToReview} disabled={loading || !dateOfBirth || !confirmed || submitting || (age !== null && age < 18)}>
            <span>{submitting ? 'Submitting…' : 'Continue to Beta Review'}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </main>
  )
}
