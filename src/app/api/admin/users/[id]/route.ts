// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!adminProfile || adminProfile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, notes } = await req.json()
  const validActions = ['SUSPEND', 'RESTORE', 'DEACTIVATE', 'REMOVE_PHOTO', 'EXPORT_DATA']

  if (!validActions.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  let updateData: Record<string, string> = {}
  if (action === 'SUSPEND') updateData.status = 'SUSPENDED'
  else if (action === 'RESTORE') updateData.status = 'ACTIVE'
  else if (action === 'DEACTIVATE') updateData.status = 'DEACTIVATED'

  if (Object.keys(updateData).length > 0) {
    await admin.from('profiles').update(updateData).eq('id', params.id)
  }

  if (action === 'EXPORT_DATA') {
    const { data: userData } = await admin.from('profiles').select('*').eq('id', params.id).single()
    const { data: userMessages } = await admin.from('messages').select('*').eq('sender_id', params.id)
    const { data: userTriggers } = await admin.from('pax_triggers').select('*').eq('user_id', params.id)
    // Log the action
    await admin.from('admin_actions').insert({ admin_id: user.id, action, target_user_id: params.id, notes })
    return NextResponse.json({ profile: userData, messages: userMessages, pax_triggers: userTriggers })
  }

  // Log action
  await admin.from('admin_actions').insert({ admin_id: user.id, action, target_user_id: params.id, notes })

  return NextResponse.json({ success: true, action })
}
