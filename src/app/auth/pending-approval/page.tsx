'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

type ReviewStatus = 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED' | 'LOADING'

export default function PendingApprovalPage() {
  const router = useRouter()
  const [status, setStatus] = useState<ReviewStatus>('LOADING')
  const [email, setEmail] = useState('')

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
        .select('status, profile_complete, pax_onboarded')
        .eq('id', user.id)
        .single()
      setEmail(user.email || '')
      if (!data || data.status === 'PENDING_EMAIL') {
        router.replace('/auth/age-verification')
      } else if (data.status === 'ACTIVE') {
        router.replace(!data.profile_complete ? '/onboarding/welcome' : !data.pax_onboarded ? '/onboarding/welcome' : '/feed')
      } else {
        setStatus(data.status as ReviewStatus)
      }
    }
    load()
  }, [router])

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  const rejected = status === 'REJECTED'
  const unavailable = status === 'SUSPENDED' || status === 'DEACTIVATED'

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image src="/quickeys-icon.png" alt="QuiKeys" width={78} height={78} priority />
        <p className={styles.eyebrow}>QuiKeys™ V1 Beta</p>
        {status === 'LOADING' ? (
          <><h1>Checking your application…</h1><div className={styles.loader} /></>
        ) : rejected ? (
          <>
            <div className={styles.symbol}>—</div>
            <h1>Beta application update</h1>
            <p>We&apos;re unable to offer access to this beta group at this time. Thank you for your interest in QuiKeys.</p>
          </>
        ) : unavailable ? (
          <>
            <div className={styles.symbol}>!</div>
            <h1>Account unavailable</h1>
            <p>This account is not currently able to access QuiKeys. Contact the QuiKeys team if you believe this is an error.</p>
          </>
        ) : (
          <>
            <div className={styles.symbol}>✓</div>
            <h1>Your application is under review</h1>
            <p>Your email and 18+ eligibility are confirmed. The QuiKeys team is reviewing your application for the private V1 beta.</p>
            <div className={styles.steps}>
              <div><span>✓</span><p><strong>Account created</strong><small>{email}</small></p></div>
              <div><span>✓</span><p><strong>Eligibility confirmed</strong><small>Email verified and age 18+</small></p></div>
              <div className={styles.current}><span>3</span><p><strong>Founder review</strong><small>We&apos;ll update your access after review</small></p></div>
              <div><span>4</span><p><strong>Meet Pax</strong><small>Begins after approval</small></p></div>
            </div>
            <p className={styles.note}>You can close this page and return later. Your application will remain saved.</p>
          </>
        )}
        <button type="button" className={styles.secondary} onClick={signOut}>Sign out</button>
      </section>
    </main>
  )
}
