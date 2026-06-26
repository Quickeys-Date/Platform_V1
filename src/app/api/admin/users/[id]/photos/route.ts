import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { photo_path } = await req.json()

  await admin.storage.from('photos').remove([photo_path])

  const { data: targetProfile } = await admin.from('profiles').select('photos').eq('id', params.id).single()
  if (targetProfile) {
    const newPhotos = (targetProfile.photos || []).filter((p: string) => p !== photo_path)
    await admin.from('profiles').update({ photos: newPhotos }).eq('id', params.id)
  }

  await admin.from('admin_actions').insert({ admin_id: user.id, action: 'REMOVE_PHOTO', target_user_id: params.id })
  return NextResponse.json({ success: true })
}
