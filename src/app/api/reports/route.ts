-e export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reported_id, report_type, note, source_screen } = await req.json()
  const validTypes = ['REPORT_INAPPROPRIATE', 'REPORT_HARASSMENT', 'REPORT_SPAM', 'REPORT_FAKE', 'REPORT_OTHER']
  const validSources = ['Chat', 'Connection Profile']
  if (!reported_id || !validTypes.includes(report_type) || !validSources.includes(source_screen)) return NextResponse.json({ error: 'Invalid report data' }, { status: 400 })

  const { data, error } = await supabase.from('reports').insert({ reporter_id: user.id, reported_id, report_type, note: note?.trim() || null, source_screen }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: data })
}
