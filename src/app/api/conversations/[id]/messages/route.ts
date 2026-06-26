import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conv } = await supabase
    .from('conversations')
    .select('initiator_id, recipient_id')
    .eq('id', params.id)
    .single()

  if (!conv || (conv.initiator_id !== user.id && conv.recipient_id !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClientFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const { data: conv } = await supabase
    .from('conversations')
    .select('initiator_id, recipient_id, status')
    .eq('id', params.id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conv.initiator_id !== user.id && conv.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (conv.status !== 'active') {
    return NextResponse.json({ error: 'Conversation is archived' }, { status: 400 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: params.id, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message })
}
