import { z } from 'zod'

export const projectStatuses = ['draft', 'active', 'closed', 'archived'] as const
export type ProjectStatus = (typeof projectStatuses)[number]

export const projectStatusLabels: Record<ProjectStatus, string> = {
  draft: 'Tervezet',
  active: 'Aktív',
  closed: 'Lezárt',
  archived: 'Archivált'
}

export const projectSchema = z
  .object({
    id: z.uuid(),
    projectCode: z.string().min(1).max(50),
    title: z.string().trim().min(1, 'A projekt címe kötelező.').max(250),
    summary: z.string().max(2000).nullable(),
    objective: z.string().max(2000).nullable(),
    ownerUserId: z.uuid(),
    startsOn: z.iso.date().nullable(),
    endsOn: z.iso.date().nullable(),
    status: z.enum(projectStatuses),
    seasonId: z.uuid().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true })
  })
  .refine(
    ({ startsOn, endsOn }) => !startsOn || !endsOn || endsOn >= startsOn,
    { message: 'A projekt vége nem lehet korábbi a kezdésénél.', path: ['endsOn'] }
  )

export type Project = z.infer<typeof projectSchema>

export type ProjectActor = 'communication_lead' | 'project_owner'

type TransitionContext = {
  actor: ProjectActor
  isOwner: boolean
  hasActiveCriticalBlock: boolean
  reason?: string
}

export function canTransitionProject(
  from: ProjectStatus,
  to: ProjectStatus,
  context: TransitionContext
): boolean {
  if (from === to) return false

  if (context.actor === 'communication_lead') {
    if (from === 'active' && to === 'closed') return !context.hasActiveCriticalBlock
    if ((from === 'closed' || from === 'archived') && to === 'active') {
      return Boolean(context.reason?.trim())
    }
    return (
      (from === 'draft' && to === 'active') ||
      (from === 'closed' && to === 'archived')
    )
  }

  return (
    context.isOwner &&
    ((from === 'draft' && to === 'active') ||
      (from === 'active' && to === 'closed' && !context.hasActiveCriticalBlock))
  )
}

export function parseProjectRow(row: Record<string, unknown>): Project {
  return projectSchema.parse({
    id: row.id,
    projectCode: row.project_code,
    title: row.title,
    summary: row.summary ?? null,
    objective: row.objective ?? null,
    ownerUserId: row.owner_user_id,
    startsOn: row.starts_on ?? null,
    endsOn: row.ends_on ?? null,
    status: row.status,
    seasonId: row.season_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })
}
