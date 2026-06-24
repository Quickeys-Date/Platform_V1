// src/app/api/profiles/feed/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get current user's profile for filter params
  const { data: me } = await supabase
    .from('profiles')
    .select('gender, interested_in, age_range_min, age_range_max, location_radius, city, state')
    .eq('id', user.id)
    .single()

  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Get IDs already in conversations with current user
  const { data: existingConvs } = await supabase
    .from('conversations')
    .select('initiator_id, recipient_id')
    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const excludeIds = new Set([user.id])
  existingConvs?.forEach(c => {
    excludeIds.add(c.initiator_id)
    excludeIds.add(c.recipient_id)
  })

  // Build gender filter: show profiles whose gender matches what I'm interested in
  // AND who are interested in my gender
  let query = supabase
    .from('profiles')
    .select('id, first_name, age, city, state, gender, interested_in, bio, photos, connection_prompt')
    .eq('status', 'ACTIVE')
    .eq('profile_complete', true)
    .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
    .gte('age', me.age_range_min)
    .lte('age', me.age_range_max)

  // Apply interest filter
  if (!me.interested_in.includes('Everyone')) {
    if (me.interested_in.includes('Men')) query = query.in('gender', ['Man'])
    else if (me.interested_in.includes('Women')) query = query.in('gender', ['Woman'])
  }

  const { data: profiles, error } = await query.limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Near-random: shuffle and return 5
  const shuffled = (profiles || []).sort(() => Math.random() - 0.5).slice(0, 5)

  return NextResponse.json({ profiles: shuffled })
}
