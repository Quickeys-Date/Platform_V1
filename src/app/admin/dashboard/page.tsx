'use client'
// src/app/admin/dashboard/page.tsx — S-20 Admin Dashboard
// Founders access only. Role-gated.
// Analytics sections: Daily Snapshot, Pax Performance, User Patterns, Raw Feedback, Reports Queue
// Moderation: Suspend, Restore, Deactivate, Remove Photo, Export Data — all logged
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PAX_RESPONSES } from '@/lib/pax'
import toast from 'react-hot-toast'

type Tab = 'dashboard' | 'users' | 'pax' | 'reports' | 'feedback'

const EMOTION_LABELS: Record<string, string> = {
  PAX_GOOD: 'Good', PAX_NEUTRAL: 'Neutral', PAX_NOT_GREAT: 'Not Great',
  PAX_CONFUSED: 'Confused', PAX_DISAPPOINTED: 'Disappointed',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
    supabase.from('profiles').select('*').eq('role', 'USER').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data || []))
  }, []) // eslint-disable-line

  const modUser = async (userId: string, action: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) { toast.error('Action failed'); return }

    if (action === 'EXPORT_DATA') {
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `user_${userId}_export.json`; a.click()
      toast.success('Data exported')
      return
    }

    toast.success(`${action.charAt(0) + action.slice(1).toLowerCase()} applied`)
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      if (action === 'SUSPEND') return { ...u, status: 'SUSPENDED' }
      if (action === 'RESTORE') return { ...u, status: 'ACTIVE' }
      if (action === 'DEACTIVATE') return { ...u, status: 'DEACTIVATED' }
      return u
    }))
  }

  const dismissReport = async (reportId: string) => {
    await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DISMISSED' }),
    })
    toast.success('Report dismissed')
    setStats((s: any) => s ? { ...s, reportQueue: s.reportQueue.filter((r: any) => r.id !== reportId) } : s)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'pax', icon: '🔑', label: 'Pax' },
    { id: 'reports', icon: '⚑', label: 'Reports' },
    { id: 'feedback', icon: '💬', label: 'Feedback' },
  ]

  const totalEmotions = stats ? (Object.values(stats.emotionBreakdown || {}).reduce((a: any, b: any) => a + b, 0) as number) : 0
  const feedbackTotal = stats ? (stats.feedbackYes + stats.feedbackNo) : 0

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button className="text-lg">☰</button>
        <span className="font-black text-lg tracking-tight">QuicKeys</span>
        <button onClick={signOut} title="Sign out" className="text-sm text-gray-400 hover:text-black">↩</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-14 bg-black flex flex-col items-center py-4 gap-1.5 flex-shrink-0">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} title={item.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors
                ${activeTab === item.id ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {item.icon}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={signOut} className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white/60" title="Sign out">
            🚪
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── DASHBOARD — Daily Snapshot ── */}
              {activeTab === 'dashboard' && stats && (
                <>
                  <div className="mb-4">
                    <h1 className="text-xl font-black tracking-tight">Dashboard</h1>
                    <p className="text-xs text-gray-500">Overview of key metrics and activity.</p>
                  </div>

                  {/* Daily Snapshot */}
                  <div className="mb-2">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daily Snapshot</h2>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), sub: `+${stats.newSignups || 0} this week`, pos: true, icon: '👤' },
                        { label: 'Active Users', value: (stats.activeUsers || 0).toLocaleString(), sub: 'Currently active', pos: true, icon: '📈' },
                        { label: 'Convs Started Today', value: (stats.convsStartedToday || 0).toLocaleString(), sub: 'New conversations', pos: null, icon: '💬' },
                        { label: 'Pax Triggered Today', value: (stats.paxToday || 0).toLocaleString(), sub: `Close: ${stats.closeConvToday || 0} · Inactivity: ${stats.inactivityToday || 0}`, pos: null, icon: '🔑' },
                        { label: 'Pending Reports', value: (stats.pendingReports || 0).toString(), sub: 'Needs review', pos: stats.pendingReports === 0, icon: '⚑' },
                      ].map(m => (
                        <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-start">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                            <div className="text-2xl font-black tracking-tight">{m.value}</div>
                            <div className={`text-xs font-medium mt-0.5 ${m.pos === true ? 'text-green-600' : m.pos === false ? 'text-red-500' : 'text-gray-400'}`}>
                              {m.sub}
                            </div>
                          </div>
                          <span className="text-gray-300 text-lg">{m.icon}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sign-ups chart */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <h2 className="font-bold text-sm mb-4">Sign Ups Over Time</h2>
                    <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                      {(stats.signupTrend || []).map((d: any, i: number) => {
                        const max = Math.max(...(stats.signupTrend || []).map((x: any) => x.count), 1)
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-black rounded-sm"
                              style={{ height: `${Math.max(3, (d.count / max) * 64)}px` }} />
                            <span className="text-[9px] text-gray-400">{d.date.split(' ')[1]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent signups */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold text-sm">Recent Sign Ups</h2>
                      <button onClick={() => setActiveTab('users')} className="text-xs font-bold" style={{ color: '#C9A84C' }}>View All</button>
                    </div>
                    {(stats.recentSignups || []).map((u: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">👤</div>
                        <div className="flex-1 min-w-0 text-xs truncate">{u.email}</div>
                        <div className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── USERS ── */}
              {activeTab === 'users' && (
                <>
                  <div className="mb-4">
                    <h1 className="text-xl font-black tracking-tight">Users</h1>
                    <p className="text-xs text-gray-500">Moderation and account management. All actions are logged.</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {users.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No users yet.</div>}
                    {users.map((u, i) => (
                      <div key={u.id} className={`p-3.5 ${i < users.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{u.first_name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          </div>
                          {u.status === 'SUSPENDED' && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Suspended</span>}
                          {u.status === 'DEACTIVATED' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Deactivated</span>}
                        </div>
                        {u.status !== 'DEACTIVATED' && (
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => modUser(u.id, u.status === 'SUSPENDED' ? 'RESTORE' : 'SUSPEND')}
                              className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg font-semibold"
                              style={{ color: u.status === 'SUSPENDED' ? '#16a34a' : '#f59e0b' }}>
                              {u.status === 'SUSPENDED' ? 'Restore' : 'Suspend'}
                            </button>
                            <button onClick={() => { if (confirm(`Deactivate ${u.first_name || u.email}? This permanently disables their access.`)) modUser(u.id, 'DEACTIVATE') }}
                              className="text-[11px] px-2.5 py-1 border border-red-100 rounded-lg font-semibold text-red-500">
                              Deactivate
                            </button>
                            <button onClick={() => modUser(u.id, 'EXPORT_DATA')}
                              className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg font-semibold text-gray-500">
                              Export CSV/JSON
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── PAX PERFORMANCE ── */}
              {activeTab === 'pax' && stats && (
                <>
                  <div className="mb-4">
                    <h1 className="text-xl font-black tracking-tight">Pax Performance</h1>
                    <p className="text-xs text-gray-500">Trigger data, emotion breakdown, feedback by state.</p>
                  </div>

                  {/* Summary metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: 'Pax Today', value: stats.paxToday || 0 },
                      { label: 'Total Helpful (Yes)', value: stats.feedbackYes || 0 },
                      { label: 'Close Conversation', value: stats.closeConvToday || 0 },
                      { label: 'Inactivity Triggers', value: stats.inactivityToday || 0 },
                    ].map(m => (
                      <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                        <div className="text-2xl font-black tracking-tight">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Emotion breakdown */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <h2 className="font-bold text-sm mb-4">Emotion State Selection</h2>
                    {Object.entries(stats.emotionBreakdown || {}).sort((a: any, b: any) => b[1] - a[1]).map(([state, count]: [string, any]) => {
                      const pct = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0
                      return (
                        <div key={state} className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{PAX_RESPONSES[state]?.emoji} {EMOTION_LABELS[state]}</span>
                            <span className="text-gray-400">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Feedback ratio overall */}
                  {feedbackTotal > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                      <h2 className="font-bold text-sm mb-3">Overall Feedback Ratio</h2>
                      <div className="flex gap-2 h-8">
                        <div className="rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ flex: stats.feedbackYes, background: '#16a34a', minWidth: 40 }}>
                          Yes {Math.round(stats.feedbackYes / feedbackTotal * 100)}%
                        </div>
                        <div className="rounded-lg flex items-center justify-center text-xs font-bold text-gray-600"
                          style={{ flex: stats.feedbackNo, background: '#e5e5e5', minWidth: 40 }}>
                          Not Quite {Math.round(stats.feedbackNo / feedbackTotal * 100)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback ratio by state — which state receives most Not Quite */}
                  {Object.keys(stats.feedbackByState || {}).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-sm">Yes vs Not Quite by State</h2>
                        {stats.mostNotQuite && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            Most Not Quite: {EMOTION_LABELS[stats.mostNotQuite]}
                          </span>
                        )}
                      </div>
                      {Object.entries(stats.feedbackByState || {}).map(([state, fb]: [string, any]) => {
                        const total = fb.yes + fb.notQuite
                        if (total === 0) return null
                        return (
                          <div key={state} className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{PAX_RESPONSES[state]?.emoji} {EMOTION_LABELS[state]}</span>
                              <span className="text-gray-400">{total} responses</span>
                            </div>
                            <div className="flex gap-1 h-5">
                              {fb.yes > 0 && <div className="rounded-sm flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ flex: fb.yes, background: '#16a34a' }}>
                                {Math.round(fb.yes / total * 100)}%
                              </div>}
                              {fb.notQuite > 0 && <div className="rounded-sm flex items-center justify-center text-[10px] font-bold text-gray-600"
                                style={{ flex: fb.notQuite, background: '#e5e5e5' }}>
                                {Math.round(fb.notQuite / total * 100)}%
                              </div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* User Patterns */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <h2 className="font-bold text-sm mb-3">User Patterns</h2>
                    <div className="space-y-0 text-sm">
                      <div className="flex justify-between py-2.5 border-b border-gray-100">
                        <span className="text-gray-600">Users who triggered Pax more than once</span>
                        <span className="font-bold">{stats.multipleTriggersCount || 0}</span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-gray-100">
                        <span className="text-gray-600">Avg time from match to Close Conversation</span>
                        <span className="font-bold">
                          {stats.avgTimeToCloseHours != null
                            ? `${stats.avgTimeToCloseHours}h`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-gray-100">
                        <span className="text-gray-600">Close Conversation triggers (today)</span>
                        <span className="font-bold">{stats.closeConvToday || 0}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-gray-600">Inactivity triggers (today)</span>
                        <span className="font-bold">{stats.inactivityToday || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Drop-off point in flow */}
                  {(stats.dropOffData || []).some((d: any) => d.count > 0) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h2 className="font-bold text-sm mb-1">Drop-off Point in Flow</h2>
                      <p className="text-xs text-gray-400 mb-3">Unique users who reached each screen</p>
                      {(stats.dropOffData || []).map((d: any, i: number) => {
                        const max = Math.max(...(stats.dropOffData || []).map((x: any) => x.count), 1)
                        const pct = max > 0 ? Math.round((d.count / max) * 100) : 0
                        return (
                          <div key={i} className="mb-2.5">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">{d.label}</span>
                              <span className="font-medium">{d.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── REPORTS QUEUE ── */}
              {activeTab === 'reports' && stats && (
                <>
                  <div className="mb-4">
                    <h1 className="text-xl font-black tracking-tight">Reports Queue</h1>
                    <p className="text-xs text-gray-500">{(stats.reportQueue || []).length} pending. Reports are reviewed manually.</p>
                  </div>
                  {(stats.reportQueue || []).length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">No pending reports. ✓</div>
                  ) : (stats.reportQueue || []).map((r: any) => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {r.report_type?.replace('REPORT_', '')}
                        </span>
                        <span className="text-xs text-gray-400">{r.source_screen} · {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-0.5">
                        <strong>Reporter:</strong> {r.reporter?.email}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>Reported:</strong> {r.reported?.first_name || '—'} ({r.reported?.email})
                      </div>
                      {r.note && <p className="text-xs text-gray-500 italic mb-3 leading-relaxed">"{r.note}"</p>}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => modUser(r.reported_id, 'SUSPEND')}
                          className="text-[11px] px-3 py-1.5 border border-amber-100 rounded-lg font-semibold text-amber-600">
                          Suspend User
                        </button>
                        <button onClick={() => { if (confirm('Deactivate this user?')) modUser(r.reported_id, 'DEACTIVATE') }}
                          className="text-[11px] px-3 py-1.5 border border-red-100 rounded-lg font-semibold text-red-500">
                          Deactivate User
                        </button>
                        <button onClick={() => dismissReport(r.id)}
                          className="text-[11px] px-3 py-1.5 border border-gray-200 rounded-lg font-semibold text-green-600">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ── RAW FEEDBACK ── */}
              {activeTab === 'feedback' && stats && (
                <>
                  <div className="mb-4">
                    <h1 className="text-xl font-black tracking-tight">Raw Feedback</h1>
                    <p className="text-xs text-gray-500">All open text responses, with state ID and timestamp.</p>
                  </div>
                  {(stats.openFeedback || []).length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
                      No open text feedback yet.
                    </div>
                  ) : (stats.openFeedback || []).map((f: any, i: number) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {PAX_RESPONSES[f.state_id_selected]?.emoji} {EMOTION_LABELS[f.state_id_selected]}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(f.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 italic leading-relaxed">"{f.feedback_open_text}"</p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
