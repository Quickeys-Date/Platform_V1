import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('user_blocks')
    .select('id, blocked_id, created_at, blocked:profiles!user_blocks_blocked_id_fkey(id, first_name, city, state, photos)')
    .eq('blocker_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blocks: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { blocked_id } = await req.json()
  if (!blocked_id || blocked_id === user.id) return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })

  const { error } = await supabase.from('user_blocks').upsert({ blocker_id: user.id, blocked_id }, { onConflict: 'blocker_id,blocked_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const timestamp = new Date().toISOString()
  await Promise.all([
    supabase.from('connection_requests').update({ status: 'CANCELLED', responded_at: timestamp })
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${blocked_id}),and(sender_id.eq.${blocked_id},recipient_id.eq.${user.id})`).eq('status', 'PENDING'),
    supabase.from('conversations').update({ status: 'archived', archived_at: timestamp, archived_by: user.id })
      .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${blocked_id}),and(initiator_id.eq.${blocked_id},recipient_id.eq.${user.id})`).eq('status', 'active'),
  ])

  return NextResponse.json({ blocked: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { blocked_id } = await req.json()
  if (!blocked_id) return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
  const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blocked_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ unblocked: true })
}
