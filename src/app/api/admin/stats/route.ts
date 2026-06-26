import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { count: totalUsers },
    { count: newSignups },
    { count: activeUsers },
    { count: pendingReports },
    { count: convsStartedToday },
    { count: paxToday },
    { count: closeConvToday },
    { count: inactivityToday },
    { data: allTriggers },
    { data: allFeedback },
    { data: recentSignups },
    { data: reportQueue },
    { data: openFeedback },
    { data: paxMoreThanOnce },
    { data: closedConvTimings },
    { data: screenViews },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'USER'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'USER').gte('created_at', sevenDaysAgo),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'USER').eq('status', 'ACTIVE'),
    admin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    admin.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('pax_triggers').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    admin.from('pax_triggers').select('*', { count: 'exact', head: true }).eq('trigger_type', 'CLOSE_CONVERSATION').gte('created_at', todayStart),
    admin.from('pax_triggers').select('*', { count: 'exact', head: true }).eq('trigger_type', 'INACTIVITY').gte('created_at', todayStart),
    admin.from('pax_triggers').select('state_id_selected').not('state_id_selected', 'is', null),
    admin.from('pax_triggers').select('state_id_selected, feedback_response').not('feedback_response', 'is', null),
    admin.from('profiles').select('email, created_at').eq('role', 'USER').order('created_at', { ascending: false }).limit(10),
    admin.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(email), reported:profiles!reports_reported_id_fkey(email, first_name)').eq('status', 'PENDING').order('created_at', { ascending: false }).limit(20),
    admin.from('pax_triggers').select('state_id_selected, feedback_open_text, created_at').not('feedback_open_text', 'is', null).order('created_at', { ascending: false }).limit(50),
    admin.from('pax_triggers').select('user_id').not('state_id_selected', 'is', null),
    admin.from('conversations').select('created_at, archived_at').eq('status', 'archived').not('archived_at', 'is', null).limit(500),
    admin.from('usage_events').select('screen, user_id').eq('event_type', 'SCREEN_VIEW'),
  ])

  const emotionTally: Record<string, number> = {}
  ;(allTriggers || []).forEach((r: any) => {
    if (r.state_id_selected) emotionTally[r.state_id_selected] = (emotionTally[r.state_id_selected] || 0) + 1
  })

  const feedbackYes = (allFeedback || []).filter((r: any) => r.feedback_response === 'FEEDBACK_YES').length
  const feedbackNo = (allFeedback || []).filter((r: any) => r.feedback_response === 'FEEDBACK_NOT_QUITE').length

  const feedbackByState: Record<string, { yes: number; notQuite: number }> = {}
  ;(allFeedback || []).forEach((r: any) => {
    const s = r.state_id_selected
    if (!s) return
    if (!feedbackByState[s]) feedbackByState[s] = { yes: 0, notQuite: 0 }
    if (r.feedback_response === 'FEEDBACK_YES') feedbackByState[s].yes++
    if (r.feedback_response === 'FEEDBACK_NOT_QUITE') feedbackByState[s].notQuite++
  })
  const mostNotQuite = Object.entries(feedbackByState).sort((a, b) => b[1].notQuite - a[1].notQuite)[0]?.[0] || null

  const userTriggerCounts: Record<string, number> = {}
  ;(paxMoreThanOnce || []).forEach((r: any) => { userTriggerCounts[r.user_id] = (userTriggerCounts[r.user_id] || 0) + 1 })
  const multipleTriggersCount = Object.values(userTriggerCounts).filter(c => c > 1).length

  let avgTimeToCloseHours: number | null = null
  if (closedConvTimings && closedConvTimings.length > 0) {
    const validTimings = closedConvTimings.filter((c: any) => c.created_at && c.archived_at)
    if (validTimings.length > 0) {
      const totalMs = validTimings.reduce((sum: number, c: any) => sum + (new Date(c.archived_at).getTime() - new Date(c.created_at).getTime()), 0)
      avgTimeToCloseHours = Math.round((totalMs / validTimings.length) / (1000 * 60 * 60) * 10) / 10
    }
  }

  const screenUserCounts: Record<string, Set<string>> = {}
  ;(screenViews || []).forEach((e: any) => {
    if (!e.screen || !e.user_id) return
    if (!screenUserCounts[e.screen]) screenUserCounts[e.screen] = new Set()
    screenUserCounts[e.screen].add(e.user_id)
  })
  const dropOffData = [
    { screen: 'feed', label: 'Connection Feed', count: screenUserCounts['feed']?.size || 0 },
    { screen: 'chat', label: 'Chat', count: screenUserCounts['chat']?.size || 0 },
    { screen: 'pax/checkin', label: 'Pax Check-In', count: screenUserCounts['pax/checkin']?.size || 0 },
    { screen: 'pax/response', label: 'Pax Response', count: screenUserCounts['pax/response']?.size || 0 },
    { screen: 'pax/feedback', label: 'Pax Feedback', count: screenUserCounts['pax/feedback']?.size || 0 },
    { screen: 'pax/thankyou', label: 'Thank You', count: screenUserCounts['pax/thankyou']?.size || 0 },
  ]

  const signupTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 3600000)
    const dateStr = d.toISOString().split('T')[0]
    const count = (recentSignups || []).filter((u: any) => u.created_at?.startsWith(dateStr)).length
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }
  })

  return NextResponse.json({
    totalUsers: totalUsers || 0, newSignups: newSignups || 0, activeUsers: activeUsers || 0,
    pendingReports: pendingReports || 0, convsStartedToday: convsStartedToday || 0,
    paxToday: paxToday || 0, closeConvToday: closeConvToday || 0, inactivityToday: inactivityToday || 0,
    emotionBreakdown: emotionTally, feedbackYes, feedbackNo, feedbackByState, mostNotQuite,
    multipleTriggersCount, signupTrend, recentSignups: (recentSignups || []).slice(0, 5),
    reportQueue: reportQueue || [], openFeedback: openFeedback || [],
    avgTimeToCloseHours, dropOffData,
  })
}
