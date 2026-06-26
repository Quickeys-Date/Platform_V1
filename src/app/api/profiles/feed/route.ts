import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('gender, interested_in, age_range_min, age_range_max, location_radius, city, state, date_of_birth')
    .eq('id', user.id)
    .single()

  if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: existingConvs } = await supabase
    .from('conversations')
    .select('initiator_id, recipient_id')
    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const excludeIds = new Set([user.id])
  existingConvs?.forEach(c => {
    excludeIds.add(c.initiator_id)
    excludeIds.add(c.recipient_id)
  })

  const excludeList = Array.from(excludeIds)

  let query = supabase
    .from('profiles')
    .select('id, first_name, date_of_birth, city, state, gender, interested_in, bio, photos, connection_prompt')
    .eq('status', 'ACTIVE')
    .eq('profile_complete', true)
    .not('id', 'in', `(${excludeList.join(',')})`)

  if (me.interested_in && !me.interested_in.includes('Everyone')) {
    if (me.interested_in.includes('Men')) query = query.eq('gender', 'Man')
    else if (me.interested_in.includes('Women')) query = query.eq('gender', 'Woman')
  }

  const { data: profiles, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const filtered = (profiles || [])
    .map(p => {
      const age = p.date_of_birth
        ? Math.floor((now - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 3600000))
        : 25
      return { ...p, age }
    })
    .filter(p => p.age >= (me.age_range_min || 18) && p.age <= (me.age_range_max || 45))

  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 5)
  return NextResponse.json({ profiles: shuffled })
}
