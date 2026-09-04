import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { resolveBoardDropStatus, taskStatusLabels, type Task, type TaskStatus } from '../domain/tasks'
import { formatBudapestDateTime } from '../lib/time'

type Column = { id: string; title: string; statuses: TaskStatus[]; target?: TaskStatus }

const columns: Column[] = [
  { id: 'assigned', title: 'Kiosztva', statuses: ['draft', 'assigned'] },
  { id: 'accepted', title: 'Elfogadva', statuses: ['accepted'], target: 'accepted' },
  { id: 'in_progress', title: 'Folyamatban', statuses: ['in_progress'], target: 'in_progress' },
  { id: 'clarification', title: 'Pontosításra vár', statuses: ['clarification_needed'], target: 'clarification_needed' },
  { id: 'blocked', title: 'Blokkolt', statuses: ['blocked'], target: 'blocked' },
  { id: 'review', title: 'Felülvizsgálaton', statuses: ['in_review'], target: 'in_review' },
  { id: 'completed', title: 'Befejezett', statuses: ['completed'], target: 'completed' }
]

const needsReason = (status: TaskStatus) => status === 'blocked' || status === 'clarification_needed'

export function TaskBoard({ tasks, currentUserId, onTransition }: {
  tasks: Task[]; currentUserId?: string | undefined
  onTransition?: ((task: Task, status: TaskStatus, reason?: string) => Promise<unknown>) | undefined
}) {
  const [pending, setPending] = useState<{ task: Task; status: TaskStatus } | null>(null)
  const [reason, setReason] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)

  function draggedTask(event: DragEvent): Task | undefined {
    const id = event.dataTransfer.getData('text/task-id') || event.dataTransfer.getData('text/plain')
    return tasks.find((task) => task.id === id)
  }
  async function runTransition(task: Task, status: TaskStatus, transitionReason?: string) {
    if (!onTransition) return
    setBusy(true); setMessage('')
    try { await onTransition(task, status, transitionReason); setMessage(`A(z) ${task.title} állapota megváltozott.`); setPending(null); setReason('') }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Az állapotváltás nem sikerült.') }
    finally { setBusy(false) }
  }
  function drop(event: DragEvent, column: Column) {
    event.preventDefault(); const task = draggedTask(event)
    if (!task || task.responsibleUserId !== currentUserId) return setMessage('Ez a feladat itt nem mozgatható.')
    const status = resolveBoardDropStatus(task, column.id)
    if (!status) return setMessage('Ez az állapotváltás nem engedélyezett.')
    if (needsReason(status)) setPending({ task, status }); else void runTransition(task, status)
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">{message}</p>
      <div className="kanban" aria-label="Feladat Kanban">
        {columns.map((column) => {
          const items = tasks.filter((task) => column.statuses.includes(task.status))
          return (
            <section className="kanban-column" data-column={column.id} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, column)}>
              <h2>{column.title} <span>{items.length}</span></h2>
              <div className="kanban-stack">
                {items.map((task) => {
                  const draggable = Boolean(onTransition && currentUserId === task.responsibleUserId && columns.some((candidate) => resolveBoardDropStatus(task, candidate.id)))
                  return <Link className={`kanban-card priority-${task.priority}${draggable ? ' draggable' : ''}`} draggable={draggable} onDragStart={(event) => { event.dataTransfer.setData('text/task-id', task.id); event.dataTransfer.effectAllowed = 'move' }} to={`/feladatok/${task.id}`} key={task.id}>
                    <span className="eyebrow">{task.taskCode}</span><strong>{task.title}</strong><small>{taskStatusLabels[task.status]} · {task.dueAt ? formatBudapestDateTime(task.dueAt) : 'Nincs határidő'}</small>
                  </Link>
                })}
                {items.length === 0 && <p className="column-empty">Nincs feladat</p>}
              </div>
            </section>
          )
        })}
      </div>
      {pending && <section className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="kanban-reason-title">
        <div className="dialog-card"><h2 id="kanban-reason-title">Indoklás szükséges</h2><p>{pending.status === 'blocked' ? 'Írd le a feladatot akadályozó okot.' : 'Írd le, milyen pontosítás szükséges.'}</p>
          <label htmlFor="kanban-reason">Indoklás</label><textarea id="kanban-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} autoFocus />
          <div className="button-row"><button className="primary-button" disabled={busy || !reason.trim()} onClick={() => void runTransition(pending.task, pending.status, reason.trim())}>Állapotváltás</button><button className="outline-button" disabled={busy} onClick={() => { setPending(null); setReason('') }}>Mégse</button></div>
        </div>
      </section>}
    </>
  )
}
