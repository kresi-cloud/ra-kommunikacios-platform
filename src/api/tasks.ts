import type { SupabaseClient } from '@supabase/supabase-js'
import { parseTaskRow, type Task, type TaskStatus } from '../domain/tasks'

const taskColumns = 'id,task_code,title,description,responsible_user_id,project_id,event_id,status,acceptance_status,priority,due_at,unscheduled,requires_review,reviewer_user_id,updated_at'
type RpcResult = { data: unknown; error: { message?: string } | null }

function rpcRow(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Érvénytelen szerverválasz.')
  return value as Record<string, unknown>
}

export async function listOpenTasks(client: SupabaseClient): Promise<Task[]> {
  const { data, error } = await client
    .from('tasks')
    .select(taskColumns)
    .neq('status', 'completed')
    .neq('status', 'withdrawn')
    .neq('status', 'archived')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(100)

  if (error) throw new Error('A feladatok betöltése nem sikerült.')
  return (data ?? []).map((row) => parseTaskRow(row))
}

export async function listTasks(client: SupabaseClient): Promise<Task[]> {
  const { data, error } = await client.from('tasks').select(taskColumns)
    .neq('status', 'withdrawn').neq('status', 'archived')
    .order('due_at', { ascending: true, nullsFirst: false }).limit(200)
  if (error) throw new Error('A feladatok betöltése nem sikerült.')
  return (data ?? []).map((row) => parseTaskRow(row))
}

export async function getTask(client: SupabaseClient, id: string): Promise<Task> {
  const { data, error } = await client.from('tasks').select(taskColumns).eq('id', id).single()
  if (error) throw new Error('A feladat betöltése nem sikerült.')
  return parseTaskRow(data)
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

export async function createTask(client: SupabaseClient, input: CreateTaskInput): Promise<Task> {
  const { data, error } = await client.rpc('create_task', {
    task_title: input.title,
    task_responsible_user_id: input.responsibleUserId,
    task_project_id: input.projectId || null,
    task_description: input.description || null,
    task_due_at: input.dueAt || null,
    task_priority: input.priority,
    task_requires_review: false,
    task_reviewer_user_id: null,
    assign_immediately: true,
    critical_reason: input.criticalReason || null
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'A feladat létrehozása nem sikerült.')
  return parseTaskRow(rpcRow(data))
}

export async function transitionTask(
  client: SupabaseClient,
  taskId: string,
  status: TaskStatus,
  reason?: string
): Promise<Task> {
  const { data, error } = await client.rpc('transition_task', {
    target_task_id: taskId,
    target_status: status,
    transition_reason: reason || null,
    new_due_at: null,
    confirm_existing_due: false
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'Az állapotváltás nem sikerült.')
  return parseTaskRow(rpcRow(data))
}
