// src/app/api/usage/route.ts
// Records usage events: LOGIN, SCREEN_VIEW, SESSION_END
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_type, screen, session_duration_seconds, metadata } = await req.json()
  const validTypes = ['LOGIN', 'SCREEN_VIEW', 'SESSION_END']
  if (!validTypes.includes(event_type)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
  }

  const { error } = await supabase.from('usage_events').insert({
    user_id: user.id,
    event_type,
    screen: screen || null,
    session_duration_seconds: session_duration_seconds || null,
    metadata: metadata || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
