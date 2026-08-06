import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const status = body.status === 'ADDRESSED' ? 'ADDRESSED' : body.status === 'OPEN' ? 'OPEN' : null
  if (!status) return NextResponse.json({ error: 'Status must be OPEN or ADDRESSED' }, { status: 400 })

  const changes = status === 'ADDRESSED'
    ? { feedback_status: status, feedback_addressed_at: new Date().toISOString(), feedback_addressed_by: user.id }
    : { feedback_status: status, feedback_addressed_at: null, feedback_addressed_by: null }

  const { data, error } = await admin
    .from('pax_triggers')
    .update(changes)
    .eq('id', params.id)
    .not('feedback_open_text', 'is', null)
    .select('id, feedback_status, feedback_addressed_at, feedback_addressed_by')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_actions').insert({
    admin_id: user.id,
    action: status === 'ADDRESSED' ? 'ADDRESS_FEEDBACK' : 'REOPEN_FEEDBACK',
    notes: `Pax feedback ${params.id}`,
  })

  return NextResponse.json({ feedback: data })
}
