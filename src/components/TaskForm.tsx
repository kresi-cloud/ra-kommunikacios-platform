import { useState, type FormEvent } from 'react'
import type { Project } from '../domain/projects'
import type { AssignableUser } from '../domain/events'
import type { CreateTaskInput } from '../api/tasks'
import { budapestInputToUtc } from '../lib/time'

const formString = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function TaskForm({ projects, users, currentUserId, busy, onProjectChange, onSubmit, onCancel }: {
  projects: Project[]; users: AssignableUser[]; currentUserId: string; busy: boolean
  onProjectChange: (projectId: string) => void; onSubmit: (input: CreateTaskInput) => Promise<unknown>; onCancel: () => void
}) {
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<'normal' | 'critical'>('normal')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    const title = formString(data, 'title').trim()
    const responsibleUserId = formString(data, 'responsibleUserId') || currentUserId
    const dueAt = formString(data, 'dueAt')
    const criticalReason = formString(data, 'criticalReason').trim()
    if (!title) return setError('A cím megadása kötelező.')
    if (priority === 'critical' && !criticalReason) return setError('Kritikus prioritáshoz indoklás szükséges.')
    try {
      await onSubmit({ title, description: formString(data, 'description').trim(), responsibleUserId,
        projectId: projectId || undefined, dueAt: dueAt ? budapestInputToUtc(dueAt) : undefined, priority, criticalReason })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'A mentés nem sikerült.') }
  }

  return (
    <section className="editor-panel" aria-labelledby="new-task-title">
      <div className="panel-heading"><h2 id="new-task-title">Új feladat</h2><button className="text-button" onClick={onCancel}>Bezárás</button></div>
      <form noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="task-title">Cím</label><input id="task-title" name="title" maxLength={250} required />
        <label htmlFor="task-description">Leírás</label><textarea id="task-description" name="description" rows={4} maxLength={10000} />
        <div className="form-grid">
          <div><label htmlFor="task-project">Projekt</label><select id="task-project" value={projectId} onChange={(event) => { setProjectId(event.target.value); onProjectChange(event.target.value) }}><option value="">Önálló feladat</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></div>
          <div><label htmlFor="task-responsible">Felelős</label><select id="task-responsible" name="responsibleUserId" defaultValue={currentUserId}>{users.map((user) => <option value={user.id} key={user.id}>{user.displayName}</option>)}</select></div>
          <div><label htmlFor="task-due">Határidő (budapesti idő)</label><input id="task-due" name="dueAt" type="datetime-local" /></div>
          <div><label htmlFor="task-priority">Prioritás</label><select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as 'normal' | 'critical')}><option value="normal">Normál</option><option value="critical">Kritikus</option></select></div>
        </div>
        {priority === 'critical' && <><label htmlFor="critical-reason">Kritikus indoklás</label><textarea id="critical-reason" name="criticalReason" rows={2} required /></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Mentés…' : 'Feladat kiosztása'}</button>
      </form>
    </section>
  )
}
