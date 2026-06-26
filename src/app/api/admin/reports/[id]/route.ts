import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  const { error } = await admin.from('reports').update({ status }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_actions').insert({
    admin_id: user.id,
    action: status === 'DISMISSED' ? 'DISMISS_REPORT' : 'REVIEW_REPORT',
    target_report_id: params.id,
  })

  return NextResponse.json({ success: true })
}
