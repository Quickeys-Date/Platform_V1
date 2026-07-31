import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action } = await req.json()
  if (!['accept', 'decline'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: request, error: requestError } = await supabase.from('connection_requests')
    .select('*').eq('id', params.id).eq('recipient_id', user.id).eq('status', 'PENDING').single()
  if (requestError || !request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  if (action === 'decline') {
    const { error } = await supabase.from('connection_requests').update({ status: 'DECLINED', responded_at: new Date().toISOString() }).eq('id', request.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ declined: true })
  }

  const { data: existing } = await supabase.from('conversations').select('id')
    .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${request.sender_id}),and(initiator_id.eq.${request.sender_id},recipient_id.eq.${user.id})`).maybeSingle()
  let conversation = existing
  if (!conversation) {
    const result = await supabase.from('conversations').insert({ initiator_id: user.id, recipient_id: request.sender_id }).select().single()
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    conversation = result.data
  }

  await supabase.from('connection_requests').update({ status: 'ACCEPTED', responded_at: new Date().toISOString() }).eq('id', request.id)
  return NextResponse.json({ conversation })
}
