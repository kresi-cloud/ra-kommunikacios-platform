import { useState, type FormEvent } from 'react'
import type { CreateEventInput } from '../api/events'
import { eventTypeLabels, type AssignableUser } from '../domain/events'
import type { Project } from '../domain/projects'
import { budapestInputToUtc } from '../lib/time'

const formString = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function EventForm({ projects, users, currentUserId, busy, onProjectChange, onSubmit, onCancel }: {
  projects: Project[]; users: AssignableUser[]; currentUserId: string; busy: boolean
  onProjectChange: (projectId: string) => void; onSubmit: (input: CreateEventInput) => Promise<unknown>; onCancel: () => void
}) {
  const [error, setError] = useState(''); const [projectId, setProjectId] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const data = new FormData(event.currentTarget)
    const starts = formString(data, 'startsAt'); const ends = formString(data, 'endsAt')
    const locationName = formString(data, 'locationName').trim(); const onlineUrl = formString(data, 'onlineUrl').trim()
    if (!formString(data, 'title').trim() || !starts || !ends) return setError('A cím, a kezdés és a befejezés megadása kötelező.')
    if (!locationName && !onlineUrl) return setError('Helyszín vagy online elérés megadása kötelező.')
    const startsAt = budapestInputToUtc(starts); const endsAt = budapestInputToUtc(ends)
    if (new Date(endsAt) <= new Date(startsAt)) return setError('A befejezésnek a kezdés után kell lennie.')
    try {
      await onSubmit({ title: formString(data, 'title').trim(), description: formString(data, 'description').trim(),
        eventType: formString(data, 'eventType') as CreateEventInput['eventType'], responsibleUserId: formString(data, 'responsibleUserId') || currentUserId,
        projectId: projectId || undefined, startsAt, endsAt, locationName, onlineUrl, isMandatory: data.get('isMandatory') === 'on' })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'A mentés nem sikerült.') }
  }
  return (
    <section className="editor-panel" aria-labelledby="new-event-title">
      <div className="panel-heading"><h2 id="new-event-title">Új esemény</h2><button className="text-button" onClick={onCancel}>Bezárás</button></div>
      <form noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="event-title">Cím</label><input id="event-title" name="title" maxLength={250} required />
        <label htmlFor="event-description">Leírás</label><textarea id="event-description" name="description" rows={3} maxLength={10000} />
        <div className="form-grid">
          <div><label htmlFor="event-type">Típus</label><select id="event-type" name="eventType">{Object.entries(eventTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          <div><label htmlFor="event-project">Projekt</label><select id="event-project" value={projectId} onChange={(event) => { setProjectId(event.target.value); onProjectChange(event.target.value) }}><option value="">Önálló esemény</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></div>
          <div><label htmlFor="event-responsible">Felelős</label><select id="event-responsible" name="responsibleUserId" defaultValue={currentUserId}>{users.map((user) => <option value={user.id} key={user.id}>{user.displayName}</option>)}</select></div>
          <div><label htmlFor="event-start">Kezdés (budapesti idő)</label><input id="event-start" name="startsAt" type="datetime-local" required /></div>
          <div><label htmlFor="event-end">Befejezés (budapesti idő)</label><input id="event-end" name="endsAt" type="datetime-local" required /></div>
          <div><label htmlFor="event-location">Helyszín</label><input id="event-location" name="locationName" /></div>
          <div><label htmlFor="event-online">Online hivatkozás</label><input id="event-online" name="onlineUrl" type="url" /></div>
        </div>
        <label className="checkbox-label"><input name="isMandatory" type="checkbox" /> Kötelező részvétel</label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Mentés…' : 'Esemény ütemezése'}</button>
      </form>
    </section>
  )
}
