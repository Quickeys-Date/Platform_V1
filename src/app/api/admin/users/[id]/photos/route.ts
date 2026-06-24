// src/app/api/admin/users/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!adminProfile || adminProfile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { photo_path } = await req.json()
  if (!photo_path) return NextResponse.json({ error: 'photo_path required' }, { status: 400 })

  // Remove from storage
  await admin.storage.from('photos').remove([photo_path])

  // Remove from profile photos array
  const { data: targetProfile } = await admin.from('profiles').select('photos').eq('id', params.id).single()
  if (targetProfile) {
    const updatedPhotos = (targetProfile.photos || []).filter((p: string) => p !== photo_path)
    await admin.from('profiles').update({ photos: updatedPhotos }).eq('id', params.id)
  }

  // Log action
  await admin.from('admin_actions').insert({
    admin_id: user.id,
    action: 'REMOVE_PHOTO',
    target_user_id: params.id,
    notes: photo_path,
  })

  return NextResponse.json({ success: true })
}
