import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, listTasks, transitionTask } from '../api/tasks'
import { listAssignableUsers } from '../api/events'
import { listProjects } from '../api/projects'
import { TaskBoard } from '../components/TaskBoard'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export function TasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'list' | 'board'>('list')
  const [projectId, setProjectId] = useState('')
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => { if (!supabase) throw new Error(); return listTasks(supabase) }, enabled: Boolean(supabase) })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => { if (!supabase) throw new Error(); return listProjects(supabase) }, enabled: Boolean(supabase && showForm) })
  const users = useQuery({ queryKey: ['assignable-users', projectId], queryFn: () => { if (!supabase) throw new Error(); return listAssignableUsers(supabase, projectId || undefined) }, enabled: Boolean(supabase && showForm) })
  const create = useMutation({ mutationFn: async (input: Parameters<typeof createTask>[1]) => { if (!supabase) throw new Error(); return createTask(supabase, input) }, onSuccess: async () => { setShowForm(false); await queryClient.invalidateQueries({ queryKey: ['tasks'] }) } })
  const transition = useMutation({ mutationFn: ({ taskId, status, reason }: { taskId: string; status: Parameters<typeof transitionTask>[2]; reason?: string | undefined }) => { if (!supabase) throw new Error(); return transitionTask(supabase, taskId, status, reason) }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['tasks'] }) } })
  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Napi koordináció</p><h1>Feladatok</h1></div>
        <button className="primary-button" onClick={() => setShowForm((value) => !value)}>Új feladat</button>
      </div>
      <p className="lead">A saját és a projekthatókörödben elérhető feladatok.</p>
      {showForm && session && <TaskForm projects={projects.data ?? []} users={users.data ?? [{ id: session.user.id, displayName: session.user.email ?? 'Saját magam' }]} currentUserId={session.user.id} busy={create.isPending} onProjectChange={setProjectId} onSubmit={(input) => create.mutateAsync(input)} onCancel={() => setShowForm(false)} />}
      <div className="view-switch" aria-label="Nézetválasztó"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Lista</button><button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Kanban</button></div>
      {tasks.isPending && supabase && <p aria-live="polite">Feladatok betöltése…</p>}
      {tasks.isError && <div className="error-banner" role="alert">A feladatok betöltése nem sikerült.</div>}
      {!tasks.isPending && !tasks.isError && (view === 'list' ? <TaskList tasks={tasks.data ?? []} /> : <TaskBoard tasks={tasks.data ?? []} currentUserId={session?.user.id} onTransition={(task, status, reason) => transition.mutateAsync({ taskId: task.id, status, reason })} />)}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig a feladatlista nem kér le üzleti adatot.</div>}
    </main>
  )
}
