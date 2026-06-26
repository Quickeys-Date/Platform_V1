import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trigger_id, state_id_selected } = await req.json()
  const validStates = ['PAX_GOOD', 'PAX_NEUTRAL', 'PAX_NOT_GREAT', 'PAX_CONFUSED', 'PAX_DISAPPOINTED']
  if (!validStates.includes(state_id_selected)) {
    return NextResponse.json({ error: 'Invalid state_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pax_triggers')
    .update({ state_id_selected })
    .eq('id', trigger_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ trigger: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trigger_id, feedback_response, feedback_open_text } = await req.json()

  const { data, error } = await supabase
    .from('pax_triggers')
    .update({
      feedback_response: feedback_response || null,
      feedback_open_text: feedback_open_text?.trim().slice(0, 300) || null,
    })
    .eq('id', trigger_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ trigger: data })
}

export async function GET(req: NextRequest) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: inactiveConvs } = await supabase
    .from('conversations')
    .select('id, last_message_at')
    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'active')
    .lt('last_message_at', cutoff72h)

  if (!inactiveConvs || inactiveConvs.length === 0) {
    return NextResponse.json({ triggers: [] })
  }

  const inactiveIds = inactiveConvs.map(c => c.id)

  const { data: existing } = await supabase
    .from('pax_triggers')
    .select('conversation_id')
    .eq('user_id', user.id)
    .eq('trigger_type', 'INACTIVITY')
    .in('conversation_id', inactiveIds)

  const alreadyTriggeredIds = new Set((existing || []).map(t => t.conversation_id))
  const toCreate = inactiveConvs.filter(c => !alreadyTriggeredIds.has(c.id))

  if (toCreate.length > 0) {
    await supabase.from('pax_triggers').insert(
      toCreate.map(c => ({
        user_id: user.id,
        conversation_id: c.id,
        trigger_type: 'INACTIVITY',
      }))
    )
  }

  const { data: pending } = await supabase
    .from('pax_triggers')
    .select('id, conversation_id, trigger_type, created_at')
    .eq('user_id', user.id)
    .eq('trigger_type', 'INACTIVITY')
    .is('state_id_selected', null)
    .in('conversation_id', inactiveIds)
    .order('created_at', { ascending: true })

  return NextResponse.json({ triggers: pending || [] })
}
