import { isNull } from 'drizzle-orm'
import type { Hono } from 'hono'
import { z } from 'zod'
import { auth } from '../auth'
import { canAccessProject, ForbiddenError, NotFoundError, ValidationError } from '../authz'
import { db } from '../db/client'
import { projects, projectStatusValues } from '../db/schema'
import { createProject, transitionProject } from '../services/projects'

const createProjectSchema = z.object({
  title: z.string(),
  ownerUserId: z.string(),
  summary: z.string().nullish(),
  objective: z.string().nullish(),
  startsOn: z.string().nullish(),
  endsOn: z.string().nullish(),
  seasonId: z.string().nullish()
})

const transitionProjectSchema = z.object({
  targetStatus: z.enum(projectStatusValues),
  reason: z.string().nullish()
})

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

/**
 * projects_read RLS-policy megfelelője: deleted_at is null és
 * can_access_project(id). Mivel SQLite-ban nincs sor szintű szűrés,
 * itt kézzel listázzuk, majd szűrjük a látható projekteket.
 */
export function registerProjectRoutes(app: Hono): void {
  app.get('/api/projects', async (c) => {
    let userId: string
    try {
      userId = await requireUserId(c.req.raw.headers)
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }

    const allActive = await db.select().from(projects).where(isNull(projects.deletedAt))
    const visible = []
    for (const project of allActive) {
      if (await canAccessProject(db, userId, project.id)) visible.push(project)
    }
    visible.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return c.json({ projects: visible.slice(0, 100) })
  })

  app.post('/api/projects', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const input = createProjectSchema.parse(await c.req.json())
      const project = await createProject(db, userId, {
        title: input.title,
        ownerUserId: input.ownerUserId,
        summary: input.summary ?? null,
        objective: input.objective ?? null,
        startsOn: input.startsOn ?? null,
        endsOn: input.endsOn ?? null,
        seasonId: input.seasonId ?? null
      })
      return c.json({ project }, 201)
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })

  app.post('/api/projects/:id/transition', async (c) => {
    try {
      const userId = await requireUserId(c.req.raw.headers)
      const projectId = c.req.param('id')
      const input = transitionProjectSchema.parse(await c.req.json())
      const project = await transitionProject(db, userId, projectId, input.targetStatus, input.reason ?? null)
      return c.json({ project })
    } catch (error) {
      const { status, body } = errorResponse(error)
      return c.json(body, status)
    }
  })
}

