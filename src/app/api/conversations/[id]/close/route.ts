import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, status, initiator_id, recipient_id')
    .eq('id', params.id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conv.initiator_id !== user.id && conv.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (conv.status === 'archived') {
    return NextResponse.json({ error: 'Already archived' }, { status: 400 })
  }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: user.id })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: paxTrigger } = await supabase
    .from('pax_triggers')
    .insert({
      user_id: user.id,
      conversation_id: params.id,
      trigger_type: 'CLOSE_CONVERSATION',
    })
    .select()
    .single()

  return NextResponse.json({ success: true, pax_trigger_id: paxTrigger?.id })
}
