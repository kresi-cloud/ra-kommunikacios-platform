import { useQuery } from '@tanstack/react-query'
import { listOpenTasks } from '../api/tasks'
import { TaskList } from '../components/TaskList'
import { supabase } from '../lib/supabase'

export function TasksPage() {
  const query = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => {
      if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
      return listOpenTasks(supabase)
    },
    enabled: Boolean(supabase)
  })

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Napi koordináció</p><h1>Feladatok</h1></div>
        <button className="primary-button" disabled>Új feladat</button>
      </div>
      <p className="lead">A saját és a projekthatókörödben elérhető nyitott feladatok.</p>
      {query.isPending && supabase && <p aria-live="polite">Feladatok betöltése…</p>}
      {query.isError && <div className="error-banner" role="alert">A feladatok betöltése nem sikerült.</div>}
      {!query.isPending && !query.isError && <TaskList tasks={query.data ?? []} />}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig a feladatlista nem kér le üzleti adatot.</div>}
    </main>
  )
}

