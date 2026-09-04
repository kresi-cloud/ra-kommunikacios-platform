import { useQuery } from '@tanstack/react-query'
import { listCalendarEvents } from '../api/events'
import { CalendarAgenda } from '../components/CalendarAgenda'
import { supabase } from '../lib/supabase'

const DAYS_AROUND_TODAY = 31

export function CalendarPage() {
  const now = new Date()
  const rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const rangeEnd = new Date(now.getTime() + DAYS_AROUND_TODAY * 24 * 60 * 60 * 1000)
  const query = useQuery({
    queryKey: ['calendar', rangeStart.toISOString().slice(0, 10), rangeEnd.toISOString().slice(0, 10)],
    queryFn: () => {
      if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
      return listCalendarEvents(supabase, rangeStart, rangeEnd)
    },
    enabled: Boolean(supabase)
  })

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Europe/Budapest</p><h1>Naptár</h1></div>
        <button className="primary-button" disabled>Új esemény</button>
      </div>
      <p className="lead">Heti előzmény és a következő 31 nap eseményei, budapesti helyi időben.</p>
      {query.isPending && supabase && <p aria-live="polite">Naptár betöltése…</p>}
      {query.isError && <div className="error-banner" role="alert">A naptár betöltése nem sikerült.</div>}
      {!query.isPending && !query.isError && <CalendarAgenda events={query.data ?? []} />}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig a naptár nem kér le üzleti adatot.</div>}
    </main>
  )
}

