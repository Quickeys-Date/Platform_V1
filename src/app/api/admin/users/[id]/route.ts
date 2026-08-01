import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, reason, notes } = await req.json()

  if (action === 'EXPORT_DATA') {
    const { data: userData } = await admin.from('profiles').select('*').eq('id', params.id).single()
    const { data: convData } = await admin.from('conversations').select('*').or(`initiator_id.eq.${params.id},recipient_id.eq.${params.id}`)
    const { data: msgData } = await admin.from('messages').select('*').eq('sender_id', params.id)
    await admin.from('admin_actions').insert({ admin_id: user.id, action: 'EXPORT_DATA', target_user_id: params.id })
    return NextResponse.json({ profile: userData, conversations: convData, messages: msgData })
  }

  if (action === 'APPROVE') {
    const [{ data: target, error: targetError }, { data: authData, error: authError }] = await Promise.all([
      admin.from('profiles').select('status, date_of_birth, age_confirmed_at, terms_accepted_at, privacy_accepted_at').eq('id', params.id).single(),
      admin.auth.admin.getUserById(params.id),
    ])
    if (targetError || authError || !target) {
      return NextResponse.json({ error: 'Applicant could not be verified.' }, { status: 400 })
    }
    if (target.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Only pending applications can be approved.' }, { status: 409 })
    }
    if (!authData.user.email_confirmed_at || !target.age_confirmed_at || !target.terms_accepted_at || !target.privacy_accepted_at) {
      return NextResponse.json({ error: 'Email, age, Terms, and Privacy must be confirmed first.' }, { status: 400 })
    }

    const now = new Date()
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const { error } = await admin.from('profiles').update({
      status: 'ACTIVE', reviewed_at: now.toISOString(), approved_at: now.toISOString(),
      approved_by: user.id, rejection_reason: null, activated_at: now.toISOString(),
      pax_access_started_at: now.toISOString(), pax_access_ends_at: endsAt.toISOString(),
    }).eq('id', params.id).eq('status', 'PENDING_APPROVAL')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await admin.from('admin_actions').insert({ admin_id: user.id, action: 'APPROVE', target_user_id: params.id, notes: notes || null })

    let emailSent = false
    let emailWarning = ''
    const recipient = authData.user.email
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.APPROVAL_FROM_EMAIL
    if (recipient && resendApiKey && fromEmail) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `beta-approved-${params.id}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient],
            subject: 'Your QuiKeys account is approved',
            text: `Your QuiKeys account has been approved. Sign in to continue: ${process.env.NEXT_PUBLIC_APP_URL || 'https://quikeys-v1.vercel.app'}/auth/signin`,
          }),
        })
        emailSent = emailResponse.ok
        if (!emailResponse.ok) emailWarning = 'The account was approved, but the approval email could not be sent.'
      } catch {
        emailWarning = 'The account was approved, but the approval email could not be sent.'
      }
    } else {
      emailWarning = 'The account was approved. Approval email is not configured yet.'
    }

    return NextResponse.json({
      success: true,
      status: 'ACTIVE',
      pax_access_ends_at: endsAt.toISOString(),
      email_sent: emailSent,
      email_warning: emailWarning || null,
    })
  }

  if (action === 'REJECT') {
    if (!reason?.trim()) return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
    const now = new Date().toISOString()
    const { error } = await admin.from('profiles').update({
      status: 'REJECTED', reviewed_at: now, approved_at: null, approved_by: user.id,
      rejection_reason: reason.trim().slice(0, 300), activated_at: null,
      pax_access_started_at: null, pax_access_ends_at: null,
    }).eq('id', params.id).eq('status', 'PENDING_APPROVAL')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await admin.from('admin_actions').insert({ admin_id: user.id, action: 'REJECT', target_user_id: params.id, notes: notes || reason.trim().slice(0, 300) })
    return NextResponse.json({ success: true, status: 'REJECTED' })
  }

  const validActions = ['SUSPEND', 'RESTORE', 'DEACTIVATE']
  if (!validActions.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const statusMap: Record<string, string> = { SUSPEND: 'SUSPENDED', RESTORE: 'ACTIVE', DEACTIVATE: 'DEACTIVATED' }
  const { error } = await admin.from('profiles').update({ status: statusMap[action] }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('admin_actions').insert({ admin_id: user.id, action, target_user_id: params.id })
  return NextResponse.json({ success: true })
}
