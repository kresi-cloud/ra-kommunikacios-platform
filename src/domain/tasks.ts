import { z } from 'zod'

export const taskStatuses = [
  'draft', 'assigned', 'accepted', 'in_progress', 'clarification_needed',
  'blocked', 'in_review', 'completed', 'withdrawn', 'archived'
] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskStatusLabels: Record<TaskStatus, string> = {
  draft: 'Tervezet',
  assigned: 'Kiosztva',
  accepted: 'Elfogadva',
  in_progress: 'Folyamatban',
  clarification_needed: 'Pontosításra vár',
  blocked: 'Blokkolt',
  in_review: 'Felülvizsgálaton',
  completed: 'Befejezett',
  withdrawn: 'Visszavont',
  archived: 'Archivált'
}

export const taskSchema = z.object({
  id: z.uuid(),
  taskCode: z.string().min(1),
  title: z.string().trim().min(1).max(250),
  description: z.string().max(10000).nullable(),
  responsibleUserId: z.uuid(),
  projectId: z.uuid().nullable(),
  eventId: z.uuid().nullable(),
  status: z.enum(taskStatuses),
  acceptanceStatus: z.enum([
    'not_requested', 'pending', 'accepted', 'clarification_requested', 'obstacle_reported'
  ]),
  priority: z.enum(['normal', 'critical']),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
  unscheduled: z.boolean(),
  requiresReview: z.boolean(),
  reviewerUserId: z.uuid().nullable(),
  updatedAt: z.iso.datetime({ offset: true })
}).refine(({ unscheduled, dueAt }) => unscheduled === (dueAt === null), {
  message: 'Az ütemezési jelző és a határidő ellentmond egymásnak.',
  path: ['dueAt']
}).refine(({ requiresReview, reviewerUserId }) => !requiresReview || reviewerUserId !== null, {
  message: 'Felülvizsgálathoz felülvizsgáló szükséges.',
  path: ['reviewerUserId']
})

export type Task = z.infer<typeof taskSchema>

/**
 * A saját Hono API (server/routes/tasks.ts) a Drizzle-séma camelCase
 * mezőnevein adja vissza a feladatot, ezért itt – a korábbi Supabase-sortól
 * eltérően – nincs snake_case-ről való átalakítás.
 */
export function parseTaskRow(row: Record<string, unknown>): Task {
  return taskSchema.parse({
    id: row.id,
    taskCode: row.taskCode,
    title: row.title,
    description: row.description ?? null,
    responsibleUserId: row.responsibleUserId,
    projectId: row.projectId ?? null,
    eventId: row.eventId ?? null,
    status: row.status,
    acceptanceStatus: row.acceptanceStatus,
    priority: row.priority,
    dueAt: row.dueAt ?? null,
    unscheduled: row.unscheduled,
    requiresReview: row.requiresReview,
    reviewerUserId: row.reviewerUserId ?? null,
    updatedAt: row.updatedAt
  })
}

export function isTaskOverdue(task: Task, currentUserId: string, now = new Date()): boolean {
  return task.responsibleUserId === currentUserId
    && task.acceptanceStatus === 'accepted'
    && task.dueAt !== null
    && new Date(task.dueAt) < now
    && !['blocked', 'completed', 'withdrawn', 'archived'].includes(task.status)
}

export function canResponsibleTransitionTask(from: TaskStatus, to: TaskStatus, requiresReview = false): boolean {
  if (from === 'assigned') return ['accepted', 'clarification_needed', 'blocked'].includes(to)
  if (from === 'accepted') return to === 'in_progress'
  if (from === 'in_progress') {
    return ['clarification_needed', 'blocked', requiresReview ? 'in_review' : 'completed'].includes(to)
  }
  return false
}

const boardTargets: Record<string, TaskStatus | undefined> = {
  accepted: 'accepted', in_progress: 'in_progress', clarification: 'clarification_needed',
  blocked: 'blocked', review: 'in_review', completed: 'completed'
}

export function resolveBoardDropStatus(task: Task, columnId: string): TaskStatus | null {
  const target = boardTargets[columnId]
  return target && canResponsibleTransitionTask(task.status, target, task.requiresReview) ? target : null
}
