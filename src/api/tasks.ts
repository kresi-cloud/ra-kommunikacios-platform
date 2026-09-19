// A saját Hono API-t hívja (server/routes/tasks.ts) a korábbi
// Supabase-kliens helyett. Lásd src/api/projects.ts a mintázatért.
import { parseTaskRow, type Task, type TaskStatus } from '../domain/tasks'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? String(body.error) : null
    throw new Error(message || 'A kérés nem sikerült.')
  }
  return body as T
}

export type TaskCapabilities = { canChangeDeadline: boolean; canReassign: boolean }

export async function listOpenTasks(): Promise<Task[]> {
  const data = await apiFetch<{ tasks: Record<string, unknown>[] }>('/api/tasks?onlyOpen=true')
  return data.tasks.map((row) => parseTaskRow(row))
}

export async function listTasks(): Promise<Task[]> {
  const data = await apiFetch<{ tasks: Record<string, unknown>[] }>('/api/tasks?onlyOpen=false')
  return data.tasks.map((row) => parseTaskRow(row))
}

export async function getTask(id: string): Promise<Task> {
  const data = await apiFetch<{ task: Record<string, unknown> }>(`/api/tasks/${id}`)
  return parseTaskRow(data.task)
}

export type CreateTaskInput = {
  title: string
  description?: string | undefined
  responsibleUserId: string
  projectId?: string | undefined
  dueAt?: string | undefined
  priority: 'normal' | 'critical'
  criticalReason?: string | undefined
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = await apiFetch<{ task: Record<string, unknown> }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      responsibleUserId: input.responsibleUserId,
      projectId: input.projectId || null,
      description: input.description || null,
      dueAt: input.dueAt || null,
      priority: input.priority,
      criticalReason: input.criticalReason || null
    })
  })
  return parseTaskRow(data.task)
}

export async function transitionTask(taskId: string, status: TaskStatus, reason?: string): Promise<Task> {
  const data = await apiFetch<{ task: Record<string, unknown> }>(`/api/tasks/${taskId}/transition`, {
    method: 'POST',
    body: JSON.stringify({ targetStatus: status, reason: reason || null })
  })
  return parseTaskRow(data.task)
}

export async function getTaskCapabilities(taskId: string): Promise<TaskCapabilities> {
  return apiFetch<TaskCapabilities>(`/api/tasks/${taskId}/capabilities`)
}

export async function changeTaskDeadline(taskId: string, dueAt: string | null, reason: string): Promise<Task> {
  const data = await apiFetch<{ task: Record<string, unknown> }>(`/api/tasks/${taskId}/deadline`, {
    method: 'POST',
    body: JSON.stringify({ dueAt, reason })
  })
  return parseTaskRow(data.task)
}

export async function reassignTask(taskId: string, responsibleUserId: string, reason: string): Promise<Task> {
  const data = await apiFetch<{ task: Record<string, unknown> }>(`/api/tasks/${taskId}/reassign`, {
    method: 'POST',
    body: JSON.stringify({ responsibleUserId, reason })
  })
  return parseTaskRow(data.task)
}
