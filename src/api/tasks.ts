import type { SupabaseClient } from '@supabase/supabase-js'
import { parseTaskRow, type Task } from '../domain/tasks'

export async function listOpenTasks(client: SupabaseClient): Promise<Task[]> {
  const { data, error } = await client
    .from('tasks')
    .select('id,task_code,title,description,responsible_user_id,project_id,event_id,status,acceptance_status,priority,due_at,unscheduled,requires_review,reviewer_user_id,updated_at')
    .neq('status', 'completed')
    .neq('status', 'withdrawn')
    .neq('status', 'archived')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(100)

  if (error) throw new Error('A feladatok betöltése nem sikerült.')
  return (data ?? []).map((row) => parseTaskRow(row))
}

