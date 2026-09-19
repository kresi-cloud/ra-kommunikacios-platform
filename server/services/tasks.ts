// public.create_task, transition_task, change_task_deadline, reassign_task
// és get_task_capabilities megfelelője. A validációs sorrend és az
// elfogadott átmenetek szó szerint követik az eredeti Postgres-függvényeket
// (lásd supabase/migrations/202609040003_tasks_events_calendar.sql és
// 202609040007_i1b2_editing.sql).
import { and, eq, isNull } from 'drizzle-orm'
import type { AppDatabase } from '../db/client'
import { user } from '../db/auth-schema'
import {
  priorityLevelValues, taskAcceptanceStatusValues, taskAssignmentsHistory, taskBlockDetails,
  taskDeadlineHistory, taskStatusValues, tasks
} from '../db/schema'
import { writeAudit } from '../audit'
import {
  ForbiddenError, NotFoundError, ValidationError, isCommunicationLead, isProjectOwner, isTechnicalAdmin
} from '../authz'

export type TaskStatus = (typeof taskStatusValues)[number]
export type TaskAcceptanceStatus = (typeof taskAcceptanceStatusValues)[number]
export type PriorityLevel = (typeof priorityLevelValues)[number]
export type TaskRow = typeof tasks.$inferSelect

function generateTaskCode(): string {
  const year = new Date().getUTCFullYear()
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `RA-TASK-${year}-${suffix}`
}

async function isActiveAssignableUser(db: AppDatabase, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ status: user.account_status, internal: user.is_internal_member, externalExpiresAt: user.external_expires_at })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!row || row.status !== 'active') return false
  return row.internal || Boolean(row.externalExpiresAt && row.externalExpiresAt.getTime() > Date.now())
}

export type CreateTaskInput = {
  title: string
  responsibleUserId: string
  projectId?: string | null
  description?: string | null
  dueAt?: string | null
  priority?: PriorityLevel
  requiresReview?: boolean
  reviewerUserId?: string | null
  assignImmediately?: boolean
  criticalReason?: string | null
}

export async function createTask(db: AppDatabase, actingUserId: string, input: CreateTaskInput): Promise<TaskRow> {
  if (await isTechnicalAdmin(db, actingUserId)) {
    throw new ForbiddenError('Nincs jogosultság feladat létrehozására.')
  }
  if (!input.projectId) {
    if (!((await isCommunicationLead(db, actingUserId)) || input.responsibleUserId === actingUserId)) {
      throw new ForbiddenError('Önálló feladat csak saját részre hozható létre.')
    }
  } else if (!((await isCommunicationLead(db, actingUserId)) || (await isProjectOwner(db, actingUserId, input.projectId)))) {
    throw new ForbiddenError('A projektben nincs feladatlétrehozási jogosultság.')
  }

  const title = input.title.trim()
  if (title === '' || title.length > 250) throw new ValidationError('A feladat címe hibás.')
  if (!(await isActiveAssignableUser(db, input.responsibleUserId))) {
    throw new ValidationError('A felelős nem aktív felhasználó.')
  }
  const priority: PriorityLevel = input.priority ?? 'normal'
  if (priority === 'critical' && !input.criticalReason?.trim()) {
    throw new ValidationError('Kritikus prioritáshoz indoklás szükséges.')
  }
  if (input.requiresReview && !input.reviewerUserId) {
    throw new ValidationError('Felülvizsgálathoz felülvizsgáló szükséges.')
  }

  const assignImmediately = input.assignImmediately ?? true
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const task: TaskRow = {
    id,
    taskCode: generateTaskCode(),
    title,
    description: input.description ?? null,
    responsibleUserId: input.responsibleUserId,
    projectId: input.projectId ?? null,
    contentId: null,
    eventId: null,
    parentTaskId: null,
    status: assignImmediately ? 'assigned' : 'draft',
    acceptanceStatus: assignImmediately ? 'pending' : 'not_requested',
    priority,
    dueAt: input.dueAt ?? null,
    unscheduled: !input.dueAt,
    isPublicationRequired: false,
    requiresReview: input.requiresReview ?? false,
    reviewerUserId: input.reviewerUserId ?? null,
    startedAt: null,
    completedAt: null,
    completedBy: null,
    withdrawnAt: null,
    withdrawnBy: null,
    createdAt: now,
    createdBy: actingUserId,
    updatedAt: now,
    updatedBy: actingUserId
  }
  await db.insert(tasks).values(task)
  await db.insert(taskAssignmentsHistory).values({
    id: crypto.randomUUID(), taskId: id, fromUserId: null, toUserId: input.responsibleUserId,
    reason: 'Első kijelölés', changedBy: actingUserId, changedAt: now
  })
  await writeAudit(db, {
    actorUserId: actingUserId, actorType: 'user', action: 'task.created', entityType: 'task',
    entityId: id, projectId: task.projectId,
    newValues: { status: task.status, responsibleUserId: task.responsibleUserId, priority: task.priority }
  })
  return task
}

export type TaskCapabilities = { canChangeDeadline: boolean; canReassign: boolean }

export async function getTaskCapabilities(db: AppDatabase, actingUserId: string, taskId: string): Promise<TaskCapabilities> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task) throw new NotFoundError('A feladat nem található.')
  if (await isTechnicalAdmin(db, actingUserId)) return { canChangeDeadline: false, canReassign: false }
  const isResponsible = task.responsibleUserId === actingUserId
  const isCreator = task.createdBy === actingUserId
  const isLead = await isCommunicationLead(db, actingUserId)
  const isOwner = Boolean(task.projectId) && (await isProjectOwner(db, actingUserId, task.projectId as string))
  const closedStatuses: TaskStatus[] = ['completed', 'withdrawn', 'archived']
  const canChangeDeadline = !closedStatuses.includes(task.status) && (isResponsible || isLead || isOwner)
  const canReassign = ![...closedStatuses, 'blocked' as TaskStatus].includes(task.status)
    && (isResponsible || isCreator || isLead || isOwner)
  return { canChangeDeadline, canReassign }
}

export async function transitionTask(
  db: AppDatabase, actingUserId: string, taskId: string,
  targetStatus: TaskStatus, reason: string | null, newDueAt: string | null, confirmExistingDue: boolean
): Promise<TaskRow> {
  const [current] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!current) throw new NotFoundError('A feladat nem található.')
  if (await isTechnicalAdmin(db, actingUserId)) throw new ForbiddenError('Nincs jogosultság.')

  const previousStatus = current.status
  const isResponsible = current.responsibleUserId === actingUserId
  const isLead = await isCommunicationLead(db, actingUserId)
  const isOwner = Boolean(current.projectId) && (await isProjectOwner(db, actingUserId, current.projectId as string))
  if (previousStatus === targetStatus) throw new ValidationError('Az állapot nem változott.')

  const trimmedReason = reason?.trim() || null
  const next: Partial<TaskRow> = {}

  if (previousStatus === 'draft' && targetStatus === 'assigned' && (current.createdBy === actingUserId || isOwner || isLead)) {
    next.acceptanceStatus = 'pending'
  } else if (previousStatus === 'assigned' && targetStatus === 'accepted' && isResponsible) {
    next.acceptanceStatus = 'accepted'
  } else if (previousStatus === 'assigned' && targetStatus === 'clarification_needed' && isResponsible && trimmedReason) {
    next.acceptanceStatus = 'clarification_requested'
  } else if (previousStatus === 'assigned' && targetStatus === 'blocked' && isResponsible && trimmedReason) {
    next.acceptanceStatus = 'obstacle_reported'
  } else if (previousStatus === 'accepted' && targetStatus === 'in_progress' && isResponsible) {
    if (current.isPublicationRequired && !current.dueAt) {
      throw new ValidationError('Publikációs feladat határidő nélkül nem indítható.')
    }
    next.startedAt = current.startedAt ?? new Date().toISOString()
  } else if (previousStatus === 'in_progress' && targetStatus === 'blocked' && (isResponsible || isOwner || isLead) && trimmedReason) {
    // nincs mezőváltozás, csak státusz
  } else if (previousStatus === 'in_progress' && targetStatus === 'clarification_needed' && isResponsible && trimmedReason) {
    // nincs mezőváltozás
  } else if (previousStatus === 'in_progress' && targetStatus === 'in_review' && isResponsible && current.requiresReview) {
    // nincs mezőváltozás
  } else if (previousStatus === 'in_progress' && targetStatus === 'completed' && isResponsible && !current.requiresReview) {
    next.completedAt = new Date().toISOString(); next.completedBy = actingUserId
  } else if (previousStatus === 'in_review' && targetStatus === 'completed'
    && (current.reviewerUserId === actingUserId || isOwner || isLead)) {
    next.completedAt = new Date().toISOString(); next.completedBy = actingUserId
  } else if (previousStatus === 'in_review' && targetStatus === 'in_progress'
    && (current.reviewerUserId === actingUserId || isOwner || isLead) && trimmedReason) {
    // nincs mezőváltozás
  } else if (previousStatus === 'clarification_needed' && targetStatus === 'assigned'
    && (current.createdBy === actingUserId || isOwner || isLead) && trimmedReason) {
    next.acceptanceStatus = 'pending'
  } else if (previousStatus === 'blocked' && (targetStatus === 'accepted' || targetStatus === 'in_progress')
    && (isOwner || isLead) && trimmedReason && (newDueAt || confirmExistingDue)) {
    await db.update(taskBlockDetails)
      .set({ resolvedAt: new Date().toISOString(), resolvedBy: actingUserId, resolutionNote: trimmedReason })
      .where(and(eq(taskBlockDetails.taskId, taskId), isNull(taskBlockDetails.resolvedAt)))
    next.acceptanceStatus = 'accepted'
  } else if (previousStatus === 'completed' && targetStatus === 'in_progress' && isLead && trimmedReason) {
    next.completedAt = null; next.completedBy = null
  } else if (!(['completed', 'withdrawn', 'archived'] as TaskStatus[]).includes(previousStatus) && targetStatus === 'withdrawn'
    && (current.createdBy === actingUserId || isOwner || isLead) && trimmedReason) {
    next.withdrawnAt = new Date().toISOString(); next.withdrawnBy = actingUserId
  } else if ((previousStatus === 'completed' || previousStatus === 'withdrawn') && targetStatus === 'archived' && (isOwner || isLead)) {
    // nincs mezőváltozás
  } else {
    throw new ValidationError('Nem engedélyezett feladatállapot-átmenet.')
  }

  if (targetStatus === 'blocked') {
    if (!trimmedReason) throw new ValidationError('Blokkoláshoz indoklás szükséges.')
    await db.insert(taskBlockDetails).values({
      id: crypto.randomUUID(), taskId, blockReasonCode: 'other', details: trimmedReason,
      startedAt: new Date().toISOString()
    })
  }
  let dueAt = current.dueAt
  let unscheduled = current.unscheduled
  if (newDueAt && newDueAt !== current.dueAt) {
    await db.insert(taskDeadlineHistory).values({
      id: crypto.randomUUID(), taskId, oldDueAt: current.dueAt, newDueAt,
      reason: trimmedReason ?? '', changedBy: actingUserId, changedAt: new Date().toISOString()
    })
    dueAt = newDueAt
    unscheduled = false
  }

  const updated: TaskRow = {
    ...current, ...next, status: targetStatus, dueAt, unscheduled, updatedBy: actingUserId,
    updatedAt: new Date().toISOString()
  }
  await db.update(tasks).set(updated).where(eq(tasks.id, taskId))
  await writeAudit(db, {
    actorUserId: actingUserId, actorType: 'user', action: 'task.transitioned', entityType: 'task',
    entityId: taskId, projectId: current.projectId,
    oldValues: { status: previousStatus }, newValues: { status: targetStatus }, reason: trimmedReason
  })
  return updated
}

export async function changeTaskDeadline(
  db: AppDatabase, actingUserId: string, taskId: string, targetDueAt: string | null, reason: string
): Promise<TaskRow> {
  const [current] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!current) throw new NotFoundError('A feladat nem található.')
  const isLead = await isCommunicationLead(db, actingUserId)
  const isOwner = Boolean(current.projectId) && (await isProjectOwner(db, actingUserId, current.projectId as string))
  const closedStatuses: TaskStatus[] = ['completed', 'withdrawn', 'archived']
  if (
    (await isTechnicalAdmin(db, actingUserId))
    || closedStatuses.includes(current.status)
    || !(current.responsibleUserId === actingUserId || isLead || isOwner)
  ) {
    throw new ForbiddenError('Nincs jogosultság a határidő módosításához.')
  }
  const trimmedReason = reason.trim()
  if (!trimmedReason) throw new ValidationError('A határidő módosításához indoklás szükséges.')
  if (targetDueAt && new Date(targetDueAt) < new Date() && !isLead) {
    throw new ForbiddenError('Visszamenőleges határidőt csak a kommunikációs vezető adhat.')
  }
  if (targetDueAt === current.dueAt) throw new ValidationError('A határidő nem változott.')

  await db.insert(taskDeadlineHistory).values({
    id: crypto.randomUUID(), taskId, oldDueAt: current.dueAt, newDueAt: targetDueAt,
    reason: trimmedReason, changedBy: actingUserId, changedAt: new Date().toISOString()
  })
  const updated: TaskRow = {
    ...current, dueAt: targetDueAt, unscheduled: !targetDueAt,
    updatedBy: actingUserId, updatedAt: new Date().toISOString()
  }
  await db.update(tasks).set(updated).where(eq(tasks.id, taskId))
  await writeAudit(db, {
    actorUserId: actingUserId, actorType: 'user', action: 'task.deadline_changed', entityType: 'task',
    entityId: taskId, projectId: current.projectId,
    oldValues: { dueAt: current.dueAt }, newValues: { dueAt: targetDueAt }, reason: trimmedReason
  })
  return updated
}

export async function reassignTask(
  db: AppDatabase, actingUserId: string, taskId: string, newResponsibleUserId: string, transferReason: string
): Promise<TaskRow> {
  const [current] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!current) throw new NotFoundError('A feladat nem található.')
  const isOwner = Boolean(current.projectId) && (await isProjectOwner(db, actingUserId, current.projectId as string))
  const isLead = await isCommunicationLead(db, actingUserId)
  if (
    (await isTechnicalAdmin(db, actingUserId))
    || !(current.responsibleUserId === actingUserId || current.createdBy === actingUserId || isOwner || isLead)
  ) {
    throw new ForbiddenError('Nincs jogosultság a feladat átadására.')
  }
  if ((['completed', 'withdrawn', 'archived', 'blocked'] as TaskStatus[]).includes(current.status)) {
    throw new ValidationError('Ebben az állapotban a feladat nem adható át.')
  }
  const trimmedReason = transferReason.trim()
  if (!trimmedReason) throw new ValidationError('A feladat átadásához indoklás szükséges.')
  if (newResponsibleUserId === current.responsibleUserId) throw new ValidationError('A felelős nem változott.')

  if (!(await isActiveAssignableUser(db, newResponsibleUserId))) {
    throw new ValidationError('Az új felelős nem aktív, kijelölhető felhasználó.')
  }
  const isNewResponsibleTechAdmin = await isTechnicalAdmin(db, newResponsibleUserId)
  if (isNewResponsibleTechAdmin) throw new ValidationError('Az új felelős nem aktív, kijelölhető felhasználó.')

  const now = new Date().toISOString()
  await db.insert(taskAssignmentsHistory).values({
    id: crypto.randomUUID(), taskId, fromUserId: current.responsibleUserId, toUserId: newResponsibleUserId,
    reason: trimmedReason, changedBy: actingUserId, changedAt: now
  })
  const updated: TaskRow = {
    ...current, responsibleUserId: newResponsibleUserId, status: 'assigned', acceptanceStatus: 'pending',
    startedAt: null, completedAt: null, completedBy: null, updatedBy: actingUserId, updatedAt: now
  }
  await db.update(tasks).set(updated).where(eq(tasks.id, taskId))
  await writeAudit(db, {
    actorUserId: actingUserId, actorType: 'user', action: 'task.reassigned', entityType: 'task',
    entityId: taskId, projectId: current.projectId,
    oldValues: { responsibleUserId: current.responsibleUserId },
    newValues: { responsibleUserId: newResponsibleUserId, status: 'assigned', acceptanceStatus: 'pending' },
    reason: trimmedReason
  })
  return updated
}
