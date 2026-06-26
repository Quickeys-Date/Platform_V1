-e export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { user_id, email } = await req.json()
  if (!user_id || !email) return NextResponse.json({ error: 'user_id and email required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').upsert({
    id: user_id, email, first_name: '', gender: 'Prefer not to say', interested_in: [],
    city: '', state: '', photos: [], age_range_min: 18, age_range_max: 45,
    location_radius: '25mi', role: 'USER', status: 'ACTIVE', pax_onboarded: false, profile_complete: false,
  }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
