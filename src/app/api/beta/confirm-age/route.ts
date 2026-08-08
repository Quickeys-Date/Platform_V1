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

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: loadError } = await supabase
    .from('profiles')
    .select('date_of_birth, status, terms_accepted_at, privacy_accepted_at')
    .eq('id', user.id)
    .single()

  const requestBody = await request.json().catch(() => ({})) as { date_of_birth?: string }
  const metadataDateOfBirth = typeof user.user_metadata?.date_of_birth === 'string'
    ? user.user_metadata.date_of_birth
    : ''
  const profileDateOfBirth = profile?.date_of_birth && !profile.date_of_birth.startsWith('1900-')
    ? profile.date_of_birth
    : ''
  const dateOfBirth = profileDateOfBirth || metadataDateOfBirth

  // Never accept a client-only date. It must match the value recorded by
  // Supabase Auth during signup, unless the profile already contains it.
  if (!dateOfBirth || (requestBody.date_of_birth && requestBody.date_of_birth !== dateOfBirth)) {
    return NextResponse.json({ error: 'Your date of birth could not be verified.' }, { status: 400 })
  }
  if (loadError && loadError.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Your account details could not be loaded.' }, { status: 400 })
  }
  if (calculateAge(dateOfBirth) < 18) {
    return NextResponse.json({ error: 'You must be 18 or older to use QuiKeys.' }, { status: 403 })
  }
  const acceptedBetaTerms = user.user_metadata?.accepted_beta_terms === true
  if ((!profile?.terms_accepted_at || !profile?.privacy_accepted_at) && !acceptedBetaTerms) {
    return NextResponse.json({ error: 'Terms and Privacy acceptance is required.' }, { status: 400 })
  }
  if (profile?.status && !['PENDING_EMAIL', 'PENDING_APPROVAL'].includes(profile.status)) {
    return NextResponse.json({ status: profile.status })
  }

  const now = new Date().toISOString()
  const admin = createAdminClient()
  const consentedAt = profile?.terms_accepted_at || now
  const { error } = await admin
    .from('profiles')
    .update({
      date_of_birth: dateOfBirth,
      terms_accepted_at: profile?.terms_accepted_at || consentedAt,
      terms_version: 'beta-v1',
      privacy_accepted_at: profile?.privacy_accepted_at || consentedAt,
      privacy_version: 'beta-v1',
      age_confirmed_at: now,
      application_submitted_at: now,
      status: 'PENDING_APPROVAL',
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ status: 'PENDING_APPROVAL' })
}
