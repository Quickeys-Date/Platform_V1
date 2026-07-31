import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const QUIKEY_QUESTION = 'What is something you are genuinely looking forward to?'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [incomingResult, outgoingResult] = await Promise.all([
    supabase.from('connection_requests')
      .select('*, sender:profiles!connection_requests_sender_id_fkey(id, first_name, date_of_birth, city, state, photos, bio, connection_prompt)')
      .eq('recipient_id', user.id).eq('status', 'PENDING').order('created_at', { ascending: false }),
    supabase.from('connection_requests')
      .select('*, recipient:profiles!connection_requests_recipient_id_fkey(id, first_name, date_of_birth, city, state, photos, bio, connection_prompt)')
      .eq('sender_id', user.id).eq('status', 'PENDING').order('created_at', { ascending: false }),
  ])

  if (incomingResult.error) return NextResponse.json({ error: incomingResult.error.message }, { status: 500 })
  if (outgoingResult.error) return NextResponse.json({ error: outgoingResult.error.message }, { status: 500 })
  return NextResponse.json({ incoming: incomingResult.data || [], outgoing: outgoingResult.data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const recipientId = String(body.recipient_id || '')
  const requestType = body.request_type === 'QUIKEY' ? 'QUIKEY' : 'STANDARD'
  const promptAnswer = String(body.prompt_answer || '').trim()
  if (!recipientId || recipientId === user.id) return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
  if (requestType === 'QUIKEY' && (!promptAnswer || promptAnswer.length > 300)) {
    return NextResponse.json({ error: 'A QuiKey answer between 1 and 300 characters is required.' }, { status: 400 })
  }

  const { data: block } = await supabase.from('user_blocks').select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id})`).maybeSingle()
  if (block) return NextResponse.json({ error: 'This connection request is unavailable.' }, { status: 403 })

  const { data: existingConversation } = await supabase.from('conversations').select('id')
    .or(`and(initiator_id.eq.${user.id},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${user.id})`).maybeSingle()
  if (existingConversation) return NextResponse.json({ error: 'You are already connected.' }, { status: 409 })

  const { data, error } = await supabase.from('connection_requests').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    request_type: requestType,
    prompt_question: requestType === 'QUIKEY' ? QUIKEY_QUESTION : null,
    prompt_answer: requestType === 'QUIKEY' ? promptAnswer : null,
  }).select().single()

  if (error?.code === '23505') return NextResponse.json({ error: 'A request is already pending.' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data }, { status: 201 })
}
