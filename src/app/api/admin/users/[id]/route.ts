import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action } = await req.json()

  if (action === 'EXPORT_DATA') {
    const { data: userData } = await admin.from('profiles').select('*').eq('id', params.id).single()
    const { data: convData } = await admin.from('conversations').select('*').or(`initiator_id.eq.${params.id},recipient_id.eq.${params.id}`)
    const { data: msgData } = await admin.from('messages').select('*').eq('sender_id', params.id)
    await admin.from('admin_actions').insert({ admin_id: user.id, action: 'EXPORT_DATA', target_user_id: params.id })
    return NextResponse.json({ profile: userData, conversations: convData, messages: msgData })
  }

  const validActions = ['SUSPEND', 'RESTORE', 'DEACTIVATE']
  if (!validActions.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const statusMap: Record<string, string> = { SUSPEND: 'SUSPENDED', RESTORE: 'ACTIVE', DEACTIVATE: 'DEACTIVATED' }
  const { error } = await admin.from('profiles').update({ status: statusMap[action] }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_actions').insert({ admin_id: user.id, action, target_user_id: params.id })
  return NextResponse.json({ success: true })
}
