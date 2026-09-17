import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, listProjects } from '../api/projects'
import { useAuth } from '../auth/AuthProvider'
import { ProjectList } from '../components/ProjectList'

export function ProjectsPage() {
  const { session } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const query = useQuery({ queryKey: ['projects'], queryFn: listProjects })

  const create = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      setShowForm(false)
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!session) return
    const data = new FormData(event.currentTarget)
    const titleValue = data.get('title')
    const summaryValue = data.get('summary')
    const title = (typeof titleValue === 'string' ? titleValue : '').trim()
    const summary = (typeof summaryValue === 'string' ? summaryValue : '').trim()
    try {
      // A gazda kijelölésének felülete (felhasználólista-választó) a
      // feladatmodullal együtt kerül át az új háttérrendszerre; addig a
      // létrehozó saját magát jelöli ki gazdának.
      await create.mutateAsync({ title, ownerUserId: session.user.id, summary: summary || undefined })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A projekt létrehozása nem sikerült.')
    }
  }

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Napi koordináció</p><h1>Projektek</h1></div>
        <button className="primary-button" onClick={() => setShowForm((value) => !value)}>Új projekt</button>
      </div>

      {showForm && (
        <form className="stacked-form" onSubmit={(event) => void handleCreate(event)}>
          <label htmlFor="project-title">Cím</label>
          <input id="project-title" name="title" required maxLength={250} />
          <label htmlFor="project-summary">Összefoglaló</label>
          <textarea id="project-summary" name="summary" rows={3} maxLength={2000} />
          <div className="button-row">
            <button className="primary-button" type="submit" disabled={create.isPending}>
              {create.isPending ? 'Létrehozás…' : 'Létrehozás'}
            </button>
            <button className="text-button" type="button" onClick={() => setShowForm(false)}>Mégse</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}

      {query.isPending && <p aria-live="polite">Projektek betöltése…</p>}
      {query.isError && <div className="error-banner" role="alert">A projektek betöltése nem sikerült.</div>}
      {!query.isPending && !query.isError && <ProjectList projects={query.data ?? []} />}
    </main>
  )
}
