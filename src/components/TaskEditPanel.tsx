import { useState, type FormEvent } from 'react'
import type { Task } from '../domain/tasks'
import type { AssignableUser } from '../domain/events'
import { budapestInputToUtc, formatBudapestInput } from '../lib/time'

const formString = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function TaskEditPanel({ task, users, canChangeDeadline, canReassign, busy, onDeadlineChange, onReassign }: {
  task: Task; users: AssignableUser[]; canChangeDeadline: boolean; canReassign: boolean; busy: boolean
  onDeadlineChange: (dueAt: string | null, reason: string) => Promise<unknown>
  onReassign: (userId: string, reason: string) => Promise<unknown>
}) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function changeDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const data = new FormData(event.currentTarget)
    const dueInput = formString(data, 'dueAt')
    const reason = formString(data, 'deadlineReason').trim()
    if (!reason) return setError('A határidő módosításához indoklás szükséges.')
    try { await onDeadlineChange(dueInput ? budapestInputToUtc(dueInput) : null, reason); setSuccess('A határidő módosítása megtörtént.') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A módosítás nem sikerült.') }
  }

  async function reassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const data = new FormData(event.currentTarget)
    const userId = formString(data, 'responsibleUserId')
    const reason = formString(data, 'transferReason').trim()
    if (!userId || !reason) return setError('Az új felelős és az átadás indoklása kötelező.')
    try { await onReassign(userId, reason); setSuccess('A feladat átadása megtörtént; az új felelős visszaigazolása szükséges.') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Az átadás nem sikerült.') }
  }

  if (!canChangeDeadline && !canReassign) return null
  return (
    <section className="action-panel" aria-labelledby="task-edit-title">
      <h2 id="task-edit-title">Feladat szerkesztése</h2>
      {canChangeDeadline && <form className="stacked-form" noValidate onSubmit={(event) => void changeDeadline(event)}>
        <h3>Határidő módosítása</h3>
        <div className="form-grid">
          <div><label htmlFor="task-edit-due">Új határidő (budapesti idő)</label><input id="task-edit-due" name="dueAt" type="datetime-local" defaultValue={task.dueAt ? formatBudapestInput(task.dueAt) : ''} /></div>
          <div><label htmlFor="deadline-reason">Indoklás</label><textarea id="deadline-reason" name="deadlineReason" rows={2} required /></div>
        </div>
        <button className="outline-button" disabled={busy}>Határidő mentése</button>
      </form>}
      {canReassign && <form className="stacked-form" noValidate onSubmit={(event) => void reassign(event)}>
        <h3>Feladat átadása</h3>
        <div className="form-grid">
          <div><label htmlFor="new-responsible">Új felelős</label><select id="new-responsible" name="responsibleUserId" defaultValue=""><option value="">Válassz felhasználót</option>{users.filter((user) => user.id !== task.responsibleUserId).map((user) => <option value={user.id} key={user.id}>{user.displayName}</option>)}</select></div>
          <div><label htmlFor="transfer-reason">Átadás indoklása</label><textarea id="transfer-reason" name="transferReason" rows={2} required /></div>
        </div>
        <p className="form-help">Átadás után a feladat Kiosztva állapotba kerül, és az új felelősnek el kell fogadnia.</p>
        <button className="outline-button" disabled={busy}>Feladat átadása</button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
    </section>
  )
}
