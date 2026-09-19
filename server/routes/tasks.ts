import { eq } from 'drizzle-orm'
import type { Hono } from 'hono'
import { z } from 'zod'
import { auth } from '../auth'
import { canAccessTask, ForbiddenError, NotFoundError, ValidationError } from '../authz'
import { db } from '../db/client'
import { priorityLevelValues, taskStatusValues, tasks } from '../db/schema'
import {
  changeTaskDeadline, createTask, getTaskCapabilities, reassignTask, transitionTask
} from '../services/tasks'

async function requireUserId(headers: Headers): Promise<string> {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new ForbiddenError('Bejelentkezés szükséges.')
  return session.user.id
}

function errorResponse(error: unknown): { status: 400 | 403 | 404 | 422 | 500; body: { error: string } } {
  if (error instanceof ForbiddenError) return { status: 403, body: { error: error.message } }
  if (error instanceof ValidationError) return { status: 422, body: { error: error.message } }
  if (error instanceof NotFoundError) return { status: 404, body: { error: error.message } }
  if (error instanceof z.ZodError) return { status: 422, body: { error: 'A kérés adatai hibásak.' } }
  console.error(error)
  return { status: 500, body: { error: 'Váratlan szerverhiba történt.' } }
}

const createTaskSchema = z.object({
  title: z.string(),
  responsibleUserId: z.string(),
  projectId: z.string().nullish(),
  description: z.string().nullish(),
  dueAt: z.string().nullish(),
  priority: z.enum(priorityLevelValues).nullish(),
  requiresReview: z.boolean().nullish(),
  reviewerUserId: z.string().nullish(),
  assignImmediately: z.boolean().nullish(),
  criticalReason: z.string().nullish()
})

const transitionTaskSchema = z.object({
  targetStatus: z.enum(taskStatusValues),
  reason: z.string().nullish(),
  newDueAt: z.string().nullish(),
  confirmExistingDue: z.boolean().nullish()
})

const deadlineSchema = z.object({ dueAt: z.string().nullable(), reason: z.string() })
const reassignSchema = z.object({ responsibleUserId: z.string(), reason: z.string() })

export function registerTaskRoutes(app: Hono): void {
  app.get('/api/tasks', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const onlyOpen = c.req.query('onlyOpen') !== 'false'
      const closed: (typeof taskStatusValues)[number][] = ['completed', 'withdrawn', 'archived']
      const rows = await db.select().from(tasks)
      const visible = []
      for (const task of rows) {
        if (onlyOpen && closed.includes(task.status)) continue
        if (await canAccessTask(db, userId, task.id)) visible.push(task)
      }
      visible.sort((a, b) => {
        if (a.dueAt === b.dueAt) return 0
        if (a.dueAt === null) return 1
        if (b.dueAt === null) return -1
        return a.dueAt.localeCompare(b.dueAt)
      })
      return c.json({ tasks: visible.slice(0, 200) })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.get('/api/tasks/:id', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const taskId = c.req.param('id')
      if (!(await canAccessTask(db, userId, taskId))) throw new NotFoundError('A feladat nem található.')
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
      if (!task) throw new NotFoundError('A feladat nem található.')
      return c.json({ task })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.get('/api/tasks/:id/capabilities', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const capabilities = await getTaskCapabilities(db, userId, c.req.param('id'))
      return c.json(capabilities)
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.post('/api/tasks', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const input = createTaskSchema.parse(await c.req.json())
      const task = await createTask(db, userId, {
        title: input.title,
        responsibleUserId: input.responsibleUserId,
        projectId: input.projectId ?? null,
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
        priority: input.priority ?? undefined,
        requiresReview: input.requiresReview ?? false,
        reviewerUserId: input.reviewerUserId ?? null,
        assignImmediately: input.assignImmediately ?? true,
        criticalReason: input.criticalReason ?? null
      })
      return c.json({ task }, 201)
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.post('/api/tasks/:id/transition', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const input = transitionTaskSchema.parse(await c.req.json())
      const task = await transitionTask(
        db, userId, c.req.param('id'), input.targetStatus,
        input.reason ?? null, input.newDueAt ?? null, input.confirmExistingDue ?? false
      )
      return c.json({ task })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.post('/api/tasks/:id/deadline', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const input = deadlineSchema.parse(await c.req.json())
      const task = await changeTaskDeadline(db, userId, c.req.param('id'), input.dueAt, input.reason)
      return c.json({ task })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.post('/api/tasks/:id/reassign', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const input = reassignSchema.parse(await c.req.json())
      const task = await reassignTask(db, userId, c.req.param('id'), input.responsibleUserId, input.reason)
      return c.json({ task })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })
}
