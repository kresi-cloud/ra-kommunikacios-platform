import { useQuery } from '@tanstack/react-query'
import { listCalendarEvents } from '../api/events'
import { listOpenTasks } from '../api/tasks'
import { useAuth } from '../auth/AuthProvider'
import { calculateDashboardMetrics } from '../domain/dashboard'
import { supabase } from '../lib/supabase'

export function DashboardPage() {
  const { session } = useAuth()
  const now = new Date()
  const tasks = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: listOpenTasks
  })
  const events = useQuery({
    queryKey: ['calendar', 'dashboard'],
    queryFn: () => listCalendarEvents(
      supabase!,
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    ),
    enabled: Boolean(supabase)
  })
  const metrics = calculateDashboardMetrics(
    tasks.data ?? [], events.data ?? [], session?.user.id ?? '', now
  )

  return (
    <main className="page-content">
      <p className="eyebrow">Mai helyzetkép</p>
      <h1>Kezdőlap</h1>
      <div className="dashboard-grid">
        <section className="metric-card"><strong>{metrics.awaitingAcceptance}</strong><span>Visszaigazolásra vár</span></section>
        <section className="metric-card"><strong>{metrics.upcomingDeadlines}</strong><span>Közelgő határidő</span></section>
        <section className="metric-card"><strong>{metrics.todayEvents}</strong><span>Mai esemény</span></section>
      </div>
      {(tasks.isError || events.isError) && <div className="error-banner" role="alert">A napi helyzetkép részben nem tölthető be.</div>}
      {!supabase && <p className="demo-note">A naptári adatok a Supabase-átállás befejezéséig nem érhetők el, ezért a mai esemény mutató üres állapotot mutat.</p>}
    </main>
  )
}
