import { NextRequest, NextResponse } from 'next/server'
import { StreamClient } from '@stream-io/node-sdk'
import { createClient } from '@/lib/supabase/server'

function getStreamClient() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
  const secret = process.env.STREAM_API_SECRET
  if (!apiKey || !secret) throw new Error('QuiKey Chat is not configured yet.')
  return { apiKey, client: new StreamClient(apiKey, secret) }
}

async function getContext(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const conversationId = req.nextUrl.searchParams.get('conversation_id')
  if (!conversationId) return { error: NextResponse.json({ error: 'conversation_id required' }, { status: 400 }) }
  const { data: conversation } = await supabase.from('conversations').select('id, initiator_id, recipient_id, status').eq('id', conversationId).single()
  if (!conversation || ![conversation.initiator_id, conversation.recipient_id].includes(user.id)) {
    return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) }
  }
  return { supabase, user, conversation, conversationId }
}

function addCredentials(call: any, userId: string) {
  const { apiKey, client } = getStreamClient()
  const callId = call.room_name
  const token = client.generateCallToken({
    user_id: userId,
    call_cids: [`default:${callId}`],
    validity_in_seconds: 5 * 60,
  })
  return { ...call, call_id: callId, api_key: apiKey, token }
}

export async function GET(req: NextRequest) {
  try {
    const context = await getContext(req)
    if ('error' in context) return context.error
    const { supabase, user, conversationId } = context
    const { data: call } = await supabase.from('video_calls').select('*').eq('conversation_id', conversationId)
      .in('status', ['pending', 'active']).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!call) return NextResponse.json({ call: null })
    if (call.status === 'active' && call.ends_at && new Date(call.ends_at) <= new Date()) {
      await supabase.from('video_calls').update({ status: 'ended', updated_at: new Date().toISOString() }).eq('id', call.id)
      return NextResponse.json({ call: null })
    }
    return NextResponse.json({ call: call.status === 'active' ? addCredentials(call, user.id) : call })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'QuiKey Chat failed.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getContext(req)
    if ('error' in context) return context.error
    const { supabase, user, conversation, conversationId } = context
    const { action = 'initiate', call_id: recordId } = await req.json().catch(() => ({}))

    if (action === 'initiate') {
      if (conversation.status !== 'active') return NextResponse.json({ error: 'This conversation is not active.' }, { status: 400 })
      const { data: existing } = await supabase.from('video_calls').select('*').eq('conversation_id', conversationId)
        .in('status', ['pending', 'active']).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (existing) return NextResponse.json({ call: existing })
      const { data: call, error } = await supabase.from('video_calls').insert({ conversation_id: conversationId, initiated_by: user.id }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ call })
    }

    const { data: call } = await supabase.from('video_calls').select('*').eq('id', recordId).eq('conversation_id', conversationId).single()
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    if (action === 'decline' || action === 'end') {
      if (action === 'end' && call.room_name) {
        const { client } = getStreamClient()
        await client.video.call('default', call.room_name).end().catch(() => undefined)
      }
      await supabase.from('video_calls').update({ status: action === 'decline' ? 'declined' : 'ended', updated_at: new Date().toISOString() }).eq('id', call.id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'accept') {
      if (call.initiated_by === user.id) return NextResponse.json({ error: 'The other person must accept this call.' }, { status: 400 })
      const now = new Date()
      const endsAt = new Date(now.getTime() + 120_000)
      const streamCallId = `quikey-${call.id}`
      const { client } = getStreamClient()
      await client.video.call('default', streamCallId).getOrCreate({
        data: {
          created_by_id: call.initiated_by,
          members: [{ user_id: conversation.initiator_id }, { user_id: conversation.recipient_id }],
          settings_override: {
            limits: { max_duration_seconds: 120, max_participants: 2 },
            recording: { mode: 'disabled' },
            screensharing: { enabled: false },
          },
          custom: { feature: 'quikey_chat', conversation_id: conversationId },
        },
      })
      const { data: active, error } = await supabase.from('video_calls').update({
        status: 'active', room_name: streamCallId, room_url: null,
        started_at: now.toISOString(), ends_at: endsAt.toISOString(), updated_at: now.toISOString(),
      }).eq('id', call.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ call: addCredentials(active, user.id) })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'QuiKey Chat failed.' }, { status: 500 })
  }
}
