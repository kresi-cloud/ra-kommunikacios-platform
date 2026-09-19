import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, listTasks, transitionTask } from '../api/tasks'
import { listProjects } from '../api/projects'
import { TaskBoard } from '../components/TaskBoard'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import { useAuth } from '../auth/AuthProvider'

export function TasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'list' | 'board'>('list')
  const [, setProjectId] = useState('')
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: listTasks })
  const projects = useQuery({ queryKey: ['projects'], queryFn: listProjects, enabled: showForm })
  const create = useMutation({
    mutationFn: createTask,
    onSuccess: async () => { setShowForm(false); await queryClient.invalidateQueries({ queryKey: ['tasks'] }) }
  })
  const transition = useMutation({
    mutationFn: ({ taskId, status, reason }: { taskId: string; status: Parameters<typeof transitionTask>[1]; reason?: string | undefined }) =>
      transitionTask(taskId, status, reason),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['tasks'] }) }
  })
  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Napi koordináció</p><h1>Feladatok</h1></div>
        <button className="primary-button" onClick={() => setShowForm((value) => !value)}>Új feladat</button>
      </div>
      <p className="lead">A saját és a projekthatókörödben elérhető feladatok.</p>
      {showForm && session && (
        <TaskForm
          projects={projects.data ?? []}
          users={[{ id: session.user.id, displayName: session.user.email ?? 'Saját magam' }]}
          currentUserId={session.user.id}
          busy={create.isPending}
          onProjectChange={setProjectId}
          onSubmit={(input) => create.mutateAsync(input)}
          onCancel={() => setShowForm(false)}
        />
      )}
      <div className="view-switch" aria-label="Nézetválasztó"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Lista</button><button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Kanban</button></div>
      {tasks.isPending && <p aria-live="polite">Feladatok betöltése…</p>}
      {tasks.isError && <div className="error-banner" role="alert">A feladatok betöltése nem sikerült.</div>}
      {!tasks.isPending && !tasks.isError && (view === 'list' ? <TaskList tasks={tasks.data ?? []} /> : <TaskBoard tasks={tasks.data ?? []} currentUserId={session?.user.id} onTransition={(task, status, reason) => transition.mutateAsync({ taskId: task.id, status, reason })} />)}
    </main>
  )
}
