// Jogosultság-ellenőrzési réteg. SQLite-nak nincs sor szintű biztonsága
// (RLS), ezért ami korábban a Postgres `private.*` security definer
// függvényeiben és RLS-policyiban élt, az itt, alkalmazáskódban fut le –
// minden route-nak explicit módon kell hívnia a megfelelő ellenőrzést,
// mielőtt adatot olvas vagy ír. Ez az egyetlen hely, ahol ez a logika él;
// route-ban közvetlenül tábla-hozzáférést végző kód nem kerülheti meg.
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm'
import type { AppDatabase } from './db/client'
import { user } from './db/auth-schema'
import {
  permissions, projectMembers, projects, roleCodeValues, roles, userPermissionGrants, userRoleAssignments
} from './db/schema'

export type ScopeType = 'global' | 'project' | 'content' | 'task' | 'event'
export type RoleCode = (typeof roleCodeValues)[number]

/** A profiles.account_status='active' és (belső tag vagy még nem járt le a külső hozzáférés) ellenőrzés megfelelője. */
export async function isActiveUser(db: AppDatabase, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const [row] = await db
    .select({
      status: user.account_status,
      internal: user.is_internal_member,
      externalExpiresAt: user.external_expires_at
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!row) return false
  if (row.status !== 'active') return false
  if (row.internal) return true
  return Boolean(row.externalExpiresAt && row.externalExpiresAt.getTime() > Date.now())
}

/** private.has_role megfelelője: aktív, nem visszavont, időben érvényes, global vagy megadott scope-ra szóló kiosztás. */
export async function hasRole(
  db: AppDatabase,
  userId: string | null | undefined,
  roleCode: RoleCode,
  scope?: { type: Exclude<ScopeType, 'global'>; id: string }
): Promise<boolean> {
  if (!(await isActiveUser(db, userId))) return false
  const now = new Date().toISOString()
  const rows = await db
    .select({ scopeType: userRoleAssignments.scopeType, scopeId: userRoleAssignments.scopeId })
    .from(userRoleAssignments)
    .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
    .where(and(
      eq(userRoleAssignments.userId, userId as string),
      eq(roles.code, roleCode),
      eq(roles.isActive, true),
      isNull(userRoleAssignments.revokedAt),
      lte(userRoleAssignments.validFrom, now),
      or(isNull(userRoleAssignments.validUntil), gte(userRoleAssignments.validUntil, now))
    ))
  return rows.some((row) =>
    row.scopeType === 'global' || (scope !== undefined && row.scopeType === scope.type && row.scopeId === scope.id)
  )
}

/** private.has_permission megfelelője. */
export async function hasPermission(
  db: AppDatabase,
  userId: string | null | undefined,
  permissionCode: string,
  scope?: { type: Exclude<ScopeType, 'global'>; id: string }
): Promise<boolean> {
  if (!(await isActiveUser(db, userId))) return false
  const now = new Date().toISOString()
  const rows = await db
    .select({ scopeType: userPermissionGrants.scopeType, scopeId: userPermissionGrants.scopeId })
    .from(userPermissionGrants)
    .innerJoin(permissions, eq(permissions.id, userPermissionGrants.permissionId))
    .where(and(
      eq(userPermissionGrants.userId, userId as string),
      eq(permissions.code, permissionCode),
      eq(permissions.isActive, true),
      isNull(userPermissionGrants.revokedAt),
      lte(userPermissionGrants.validFrom, now),
      or(isNull(userPermissionGrants.validUntil), gte(userPermissionGrants.validUntil, now))
    ))
  return rows.some((row) =>
    row.scopeType === 'global' || (scope !== undefined && row.scopeType === scope.type && row.scopeId === scope.id)
  )
}

export const isCommunicationLead = (db: AppDatabase, userId: string | null | undefined) =>
  hasRole(db, userId, 'communication_lead')

export const isTechnicalAdmin = (db: AppDatabase, userId: string | null | undefined) =>
  hasRole(db, userId, 'technical_admin')

/** private.is_project_owner megfelelője: a projekt owner_user_id mezője egyezik, és a projekt nincs törölve. */
export async function isProjectOwnerOfRecord(
  db: AppDatabase, userId: string | null | undefined, projectId: string
): Promise<boolean> {
  if (!(await isActiveUser(db, userId))) return false
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerUserId, userId as string), isNull(projects.deletedAt)))
    .limit(1)
  return Boolean(row)
}

/**
 * private.is_project_owner megfelelője: a saját projekt gazdája ÉS
 * rendelkezik a "project_owner" szereppel (global vagy az adott projektre
 * szóló scope-pal) – a puszta owner_user_id önmagában nem elég jogosultság.
 */
export async function isProjectOwner(
  db: AppDatabase, userId: string | null | undefined, projectId: string
): Promise<boolean> {
  if (!(await isProjectOwnerOfRecord(db, userId, projectId))) return false
  return hasRole(db, userId, 'project_owner', { type: 'project', id: projectId })
}

/** private.is_project_member megfelelője. */
export async function isProjectMember(
  db: AppDatabase, userId: string | null | undefined, projectId: string
): Promise<boolean> {
  if (!(await isActiveUser(db, userId))) return false
  const [row] = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(
      eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId as string), isNull(projectMembers.leftAt)
    ))
    .limit(1)
  return Boolean(row)
}

/** private.can_access_project megfelelője. */
export async function canAccessProject(
  db: AppDatabase, userId: string | null | undefined, projectId: string
): Promise<boolean> {
  if (!(await isActiveUser(db, userId))) return false
  if (await isTechnicalAdmin(db, userId)) return false
  if (await isCommunicationLead(db, userId)) return true
  if (await isProjectOwnerOfRecord(db, userId, projectId)) return true
  return isProjectMember(db, userId, projectId)
}

export class ForbiddenError extends Error {
  constructor(message = 'Nincs jogosultság a művelethez.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'A rekord nem található.') {
    super(message)
    this.name = 'NotFoundError'
  }
}
