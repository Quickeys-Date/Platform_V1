import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || 'active'

  let query = supabase
    .from('conversations')
    .select(`*, initiator:profiles!conversations_initiator_id_fkey(id, first_name, date_of_birth, city, state, photos, bio), recipient:profiles!conversations_recipient_id_fkey(id, first_name, date_of_birth, city, state, photos, bio)`)
    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', status)

  if (status === 'archived') {
    query = query.order('archived_at', { ascending: false })
  } else {
    query = query.order('last_message_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const convs = (data || []).map(c => ({
    ...c,
    other_profile: c.initiator_id === user.id ? c.recipient : c.initiator,
  }))

  return NextResponse.json({ conversations: convs })
}

export async function POST(req: NextRequest) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipient_id } = await req.json()
  if (!recipient_id) return NextResponse.json({ error: 'recipient_id required' }, { status: 400 })
  if (recipient_id === user.id) return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 })

  const { data: existing } = await supabase
    .from('conversations')
    .select('id, status')
    .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(initiator_id.eq.${recipient_id},recipient_id.eq.${user.id})`)
    .single()

  if (existing) return NextResponse.json({ conversation: existing, existing: true })

  const { data, error } = await supabase
    .from('conversations')
    .insert({ initiator_id: user.id, recipient_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversation: data })
}
