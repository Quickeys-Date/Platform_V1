import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { user_id, email, date_of_birth, accepted_terms } = await req.json()
  if (!user_id || !email || !date_of_birth || !accepted_terms) {
    return NextResponse.json({ error: 'Account details and consent are required' }, { status: 400 })
  }

  const dob = new Date(`${date_of_birth}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: 'A valid date of birth is required' }, { status: 400 })
  }

  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const beforeBirthday = today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate())
  if (beforeBirthday) age -= 1
  if (age < 18) return NextResponse.json({ error: 'QuiKeys is for users 18 and older.' }, { status: 403 })

  const consentedAt = new Date().toISOString()
  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(user_id)
  if (authError || !authData.user || authData.user.email?.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Account identity could not be verified' }, { status: 403 })
  }
  if (authData.user.user_metadata?.date_of_birth !== date_of_birth || authData.user.user_metadata?.accepted_beta_terms !== true) {
    return NextResponse.json({ error: 'Account registration details do not match' }, { status: 403 })
  }

  const profileValues = {
    id: user_id, email, first_name: '', gender: 'Prefer not to say', interested_in: [],
    city: '', state: '', photos: [], age_range_min: 18, age_range_max: 45,
    date_of_birth, location_radius: '25mi', role: 'USER', status: 'PENDING_EMAIL',
    terms_accepted_at: consentedAt, terms_version: 'beta-v1',
    privacy_accepted_at: consentedAt, privacy_version: 'beta-v1',
    pax_onboarded: false, profile_complete: false,
  }
  const { data: existing } = await admin.from('profiles').select('status').eq('id', user_id).maybeSingle()
  const result = existing
    ? await admin.from('profiles').update({
        date_of_birth,
        terms_accepted_at: consentedAt,
        terms_version: 'beta-v1',
        privacy_accepted_at: consentedAt,
        privacy_version: 'beta-v1',
      }).eq('id', user_id).eq('status', 'PENDING_EMAIL')
    : await admin.from('profiles').insert(profileValues)
  const { error } = result
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
