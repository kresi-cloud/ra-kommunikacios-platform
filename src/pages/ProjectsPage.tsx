import { useQuery } from '@tanstack/react-query'
import { listProjects } from '../api/projects'
import { ProjectList } from '../components/ProjectList'
import { supabase } from '../lib/supabase'

export function ProjectsPage() {
  const query = useQuery({
    queryKey: ['projects'],
    queryFn: () => {
      if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
      return listProjects(supabase)
    },
    enabled: Boolean(supabase)
  })

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Napi koordináció</p><h1>Projektek</h1></div>
        <button className="primary-button" disabled>Új projekt</button>
      </div>
      {query.isPending && supabase && <p aria-live="polite">Projektek betöltése…</p>}
      {query.isError && <div className="error-banner" role="alert">A projektek betöltése nem sikerült.</div>}
      {!query.isPending && !query.isError && <ProjectList projects={query.data ?? []} />}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig a projektlista nem kér le üzleti adatot.</div>}
    </main>
  )
}
