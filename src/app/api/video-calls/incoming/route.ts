import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RING_TIMEOUT_MS = 30_000

function unavailable(error: { code?: string; message?: string } | null) {
  return Boolean(error && (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    error.message?.includes('video_calls')
  ))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ call: null }, { status: 401 })

  const { data: calls, error } = await supabase
    .from('video_calls')
    .select('id, conversation_id, initiated_by, status, created_at')
    .eq('status', 'pending')
    .neq('initiated_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (unavailable(error)) return NextResponse.json({ call: null, available: false })
  if (error) return NextResponse.json({ call: null }, { status: 503 })

  const now = Date.now()
  const stale = (calls || []).filter(call => now - new Date(call.created_at).getTime() >= RING_TIMEOUT_MS)
  if (stale.length) {
    await supabase
      .from('video_calls')
      .update({ status: 'ended', updated_at: new Date().toISOString() })
      .in('id', stale.map(call => call.id))
  }

  const call = (calls || []).find(item => now - new Date(item.created_at).getTime() < RING_TIMEOUT_MS)
  if (!call) return NextResponse.json({ call: null })

  const { data: caller } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', call.initiated_by)
    .maybeSingle()

  return NextResponse.json({
    call: {
      ...call,
      caller_name: caller?.first_name || 'Your QuiKeys connection',
    },
  })
}
