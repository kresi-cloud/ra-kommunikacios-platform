// public.create_project és public.transition_project megfelelője. A
// validációs sorrend és az elfogadott átmenetek szándékosan szó szerint
// követik az eredeti Postgres-függvényeket (lásd
// supabase/migrations/202609040001_projects.sql), csak a végrehajtás
// helye változott Postgres RPC-ből alkalmazáskódra.
import { and, eq, isNull } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { user } from '../db/auth-schema'
import { projectCriticalBlocks, projectMembers, projects, projectStatusValues } from '../db/schema'
import { writeAudit } from '../audit'
import {
  ForbiddenError, NotFoundError, ValidationError, hasPermission, hasRole,
  isCommunicationLead, isTechnicalAdmin
} from '../authz'

export type ProjectStatus = (typeof projectStatusValues)[number]
export type ProjectRow = typeof projects.$inferSelect

function generateProjectCode(): string {
  const year = new Date().getUTCFullYear()
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
  return `RA-PROJ-${year}-${suffix}`
}

export type CreateProjectInput = {
  title: string
  ownerUserId: string
  summary?: string | null
  objective?: string | null
  startsOn?: string | null
  endsOn?: string | null
  seasonId?: string | null
}

export async function createProject(
  db: AppDatabase, actingUserId: string, input: CreateProjectInput
): Promise<ProjectRow> {
  if (await isTechnicalAdmin(db, actingUserId)) {
    throw new ForbiddenError('A technikai admin nem hozhat létre kommunikációs projektet.')
  }
  const canCreate = (await isCommunicationLead(db, actingUserId)) || (await hasPermission(db, actingUserId, 'create_project'))
  if (!canCreate) throw new ForbiddenError('Nincs jogosultság projekt létrehozására.')

  const title = input.title.trim()
  if (title === '' || title.length > 250) throw new ValidationError('A projekt címe hibás.')
  if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) {
    throw new ValidationError('A projekt vége nem lehet korábbi a kezdésénél.')
  }

  const [owner] = await db
    .select({ status: user.account_status, internal: user.is_internal_member })
    .from(user)
    .where(eq(user.id, input.ownerUserId))
    .limit(1)
  if (!owner || owner.status !== 'active' || !owner.internal) {
    throw new ValidationError('A projektgazda nem aktív belső felhasználó.')
  }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const project: ProjectRow = {
    id,
    projectCode: generateProjectCode(),
    title,
    summary: input.summary ?? null,
    objective: input.objective ?? null,
    ownerUserId: input.ownerUserId,
    startsOn: input.startsOn ?? null,
    endsOn: input.endsOn ?? null,
    seasonId: input.seasonId ?? null,
    status: 'draft',
    closedAt: null,
    closedBy: null,
    archivedAt: null,
    archivedBy: null,
    deletedAt: null,
    deletedBy: null,
    createdAt: now,
    createdBy: actingUserId,
    updatedAt: now,
    updatedBy: actingUserId
  }
  await db.insert(projects).values(project)
  await db.insert(projectMembers).values({
    id: crypto.randomUUID(),
    projectId: id,
    userId: input.ownerUserId,
    membershipRole: 'owner',
    addedBy: actingUserId,
    addedAt: now,
    leftAt: null
  })
  await writeAudit(db, {
    actorUserId: actingUserId,
    actorType: 'user',
    action: 'project.created',
    entityType: 'project',
    entityId: id,
    projectId: id,
    newValues: { status: project.status, ownerUserId: project.ownerUserId }
  })
  return project
}

export async function transitionProject(
  db: AppDatabase, actingUserId: string, projectId: string, targetStatus: ProjectStatus, reason: string | null
): Promise<ProjectRow> {
  const [current] = await db
    .select().from(projects).where(and(eq(projects.id, projectId), isNull(projects.deletedAt))).limit(1)
  if (!current) throw new NotFoundError('A projekt nem található.')

  const isLead = await isCommunicationLead(db, actingUserId)
  const isOwnerOfRecord = current.ownerUserId === actingUserId
  const isOwnerWithRole = isOwnerOfRecord && (
    (await hasRole(db, actingUserId, 'project_owner'))
    || (await hasRole(db, actingUserId, 'project_owner', { type: 'project', id: projectId }))
  )
  if (!(isLead || isOwnerWithRole)) throw new ForbiddenError('Nincs jogosultság a projekt állapotváltására.')
  if (current.status === targetStatus) throw new ValidationError('Az új állapot megegyezik a jelenlegivel.')

  const trimmedReason = reason?.trim() || null
  const reopenWithLead = isLead && (current.status === 'closed' || current.status === 'archived')
    && targetStatus === 'active' && trimmedReason !== null
  const archiveWithLead = isLead && current.status === 'closed' && targetStatus === 'archived'

  if (current.status === 'draft' && targetStatus === 'active') {
    // engedélyezett, nincs előfeltétel
  } else if (current.status === 'active' && targetStatus === 'closed') {
    const [openBlock] = await db
      .select({ id: projectCriticalBlocks.id })
      .from(projectCriticalBlocks)
      .where(and(eq(projectCriticalBlocks.projectId, projectId), isNull(projectCriticalBlocks.resolvedAt)))
      .limit(1)
    if (openBlock) throw new ValidationError('Aktív kritikus blokk mellett a projekt nem zárható le.')
  } else if (archiveWithLead || reopenWithLead) {
    // engedélyezett: vezető archiválhat lezártból, vagy indoklással újranyithat lezártból/archiváltból
  } else {
    throw new ValidationError('Nem engedélyezett projektállapot-átmenet.')
  }

  const now = new Date().toISOString()
  const updated: ProjectRow = {
    ...current,
    status: targetStatus,
    closedAt: targetStatus === 'closed' ? now : null,
    closedBy: targetStatus === 'closed' ? actingUserId : null,
    archivedAt: targetStatus === 'archived' ? now : null,
    archivedBy: targetStatus === 'archived' ? actingUserId : null,
    updatedAt: now,
    updatedBy: actingUserId
  }
  await db.update(projects).set(updated).where(eq(projects.id, projectId))
  await writeAudit(db, {
    actorUserId: actingUserId,
    actorType: 'user',
    action: 'project.transitioned',
    entityType: 'project',
    entityId: projectId,
    projectId,
    oldValues: { status: current.status },
    newValues: { status: targetStatus },
    reason: trimmedReason
  })
  return updated
}
