import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function calculateAge(dateOfBirth: string) {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`)
  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday = today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: loadError } = await supabase
    .from('profiles')
    .select('date_of_birth, status, terms_accepted_at, privacy_accepted_at')
    .eq('id', user.id)
    .single()

  if (loadError || !profile?.date_of_birth) {
    return NextResponse.json({ error: 'Your date of birth could not be verified.' }, { status: 400 })
  }
  if (calculateAge(profile.date_of_birth) < 18) {
    return NextResponse.json({ error: 'You must be 18 or older to use QuiKeys.' }, { status: 403 })
  }
  if (!profile.terms_accepted_at || !profile.privacy_accepted_at) {
    return NextResponse.json({ error: 'Terms and Privacy acceptance is required.' }, { status: 400 })
  }
  if (!['PENDING_EMAIL', 'PENDING_APPROVAL'].includes(profile.status)) {
    return NextResponse.json({ status: profile.status })
  }

  const now = new Date().toISOString()
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      age_confirmed_at: now,
      application_submitted_at: now,
      status: 'PENDING_APPROVAL',
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ status: 'PENDING_APPROVAL' })
}
