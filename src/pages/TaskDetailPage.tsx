import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changeTaskDeadline, getTask, getTaskCapabilities, reassignTask, transitionTask } from '../api/tasks'
import { listActiveUsers } from '../api/events'
import { useAuth } from '../auth/AuthProvider'
import { TaskEditPanel } from '../components/TaskEditPanel'
import { canResponsibleTransitionTask, taskStatusLabels, type TaskStatus } from '../domain/tasks'
import { formatBudapestDateTime } from '../lib/time'
import { supabase } from '../lib/supabase'

const actions: { status: TaskStatus; label: string; reason: boolean }[] = [
  { status: 'accepted', label: 'Elfogadom', reason: false }, { status: 'clarification_needed', label: 'Pontosítást kérek', reason: true },
  { status: 'blocked', label: 'Akadályt jelzek', reason: true }, { status: 'in_progress', label: 'Elkezdtem', reason: false },
  { status: 'in_review', label: 'Felülvizsgálatra küldöm', reason: false }, { status: 'completed', label: 'Befejezem', reason: false }
]

export function TaskDetailPage() {
  const { taskId = '' } = useParams(); const { session } = useAuth(); const queryClient = useQueryClient(); const [reason, setReason] = useState('')
  const query = useQuery({ queryKey: ['task', taskId], queryFn: () => { if (!supabase) throw new Error(); return getTask(supabase, taskId) }, enabled: Boolean(supabase && taskId) })
  const capabilities = useQuery({ queryKey: ['task-capabilities', taskId], queryFn: () => { if (!supabase) throw new Error(); return getTaskCapabilities(supabase, taskId) }, enabled: Boolean(supabase && taskId) })
  const users = useQuery({ queryKey: ['active-users'], queryFn: () => { if (!supabase) throw new Error(); return listActiveUsers(supabase) }, enabled: Boolean(supabase && capabilities.data?.canReassign) })
  const transition = useMutation({ mutationFn: ({ status, reason }: { status: TaskStatus; reason?: string | undefined }) => { if (!supabase) throw new Error(); return transitionTask(supabase, taskId, status, reason) }, onSuccess: async () => { setReason(''); await Promise.all([queryClient.invalidateQueries({ queryKey: ['task', taskId] }), queryClient.invalidateQueries({ queryKey: ['tasks'] })]) } })
  const deadline = useMutation({ mutationFn: ({ dueAt, reason }: { dueAt: string | null; reason: string }) => { if (!supabase) throw new Error(); return changeTaskDeadline(supabase, taskId, dueAt, reason) }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['task', taskId] }), queryClient.invalidateQueries({ queryKey: ['tasks'] })]) } })
  const reassign = useMutation({ mutationFn: ({ userId, reason }: { userId: string; reason: string }) => { if (!supabase) throw new Error(); return reassignTask(supabase, taskId, userId, reason) }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['task', taskId] }), queryClient.invalidateQueries({ queryKey: ['tasks'] }), queryClient.invalidateQueries({ queryKey: ['task-capabilities', taskId] })]) } })
  if (query.isPending) return <main className="page-content"><p>Feladat betöltése…</p></main>
  if (query.isError || !query.data) return <main className="page-content"><div className="error-banner">A feladat nem érhető el.</div></main>
  const task = query.data
  const available = session?.user.id === task.responsibleUserId ? actions.filter((action) => canResponsibleTransitionTask(task.status, action.status, task.requiresReview)) : []
  return (
    <main className="page-content detail-page"><Link to="/feladatok">← Vissza a feladatokhoz</Link><div className="page-heading"><div><p className="eyebrow">{task.taskCode}</p><h1>{task.title}</h1></div><span className={`status-badge task-${task.status}`}>{taskStatusLabels[task.status]}</span></div>
      <p className="lead">{task.description || 'Nincs részletes leírás.'}</p>
      <dl className="detail-grid"><div><dt>Prioritás</dt><dd>{task.priority === 'critical' ? 'Kritikus' : 'Normál'}</dd></div><div><dt>Határidő</dt><dd>{task.dueAt ? formatBudapestDateTime(task.dueAt) : 'Nincs ütemezve'}</dd></div><div><dt>Elfogadás</dt><dd>{task.acceptanceStatus}</dd></div><div><dt>Felülvizsgálat</dt><dd>{task.requiresReview ? 'Szükséges' : 'Nem szükséges'}</dd></div></dl>
      {available.length > 0 && <section className="action-panel"><h2>Következő művelet</h2>{available.some((action) => action.reason) && <><label htmlFor="transition-reason">Indoklás pontosításhoz vagy akadályhoz</label><textarea id="transition-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></>}<div className="button-row">{available.map((action) => <button className={action.status === 'completed' ? 'primary-button' : 'outline-button'} key={action.status} disabled={transition.isPending || (action.reason && !reason.trim())} onClick={() => transition.mutate({ status: action.status, reason: action.reason ? reason : undefined })}>{action.label}</button>)}</div>{transition.isError && <p className="form-error">{transition.error.message}</p>}</section>}
      <TaskEditPanel key={task.updatedAt} task={task} users={users.data ?? []} canChangeDeadline={capabilities.data?.canChangeDeadline ?? false} canReassign={capabilities.data?.canReassign ?? false} busy={deadline.isPending || reassign.isPending} onDeadlineChange={(dueAt, changeReason) => deadline.mutateAsync({ dueAt, reason: changeReason })} onReassign={(userId, transferReason) => reassign.mutateAsync({ userId, reason: transferReason })} />
    </main>
  )
}
