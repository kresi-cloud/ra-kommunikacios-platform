// Üzleti adatmodell (SQLite/Drizzle). A better-auth saját táblái (user,
// session, account, verification) az auth-schema.ts fájlban generálódnak;
// ez a fájl az azokra épülő szerep-, jogosultság-, audit- és
// projektmodellt tartalmazza. A korábbi Supabase/Postgres migrációk
// (supabase/migrations/, archív, már nem fut) RLS-policyi helyett itt
// minden hozzáférés-ellenőrzés a server/authz.ts rétegben, alkalmazáskódban
// történik – SQLite-nak nincs sor szintű biztonsági mechanizmusa.
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'

export const accountStatusValues = [
  'invited', 'activation_pending', 'active', 'suspended', 'inactive', 'expired', 'archived'
] as const

export const roleCodeValues = [
  'communication_lead', 'technical_admin', 'project_owner', 'staff_member',
  'privacy_legal_officer', 'namesake', 'external_contributor'
] as const

export const scopeTypeValues = ['global', 'project', 'content', 'task', 'event'] as const
export const projectStatusValues = ['draft', 'active', 'closed', 'archived'] as const

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  code: text('code', { enum: roleCodeValues }).notNull().unique(),
  nameHu: text('name_hu').notNull(),
  isSystemRole: integer('is_system_role', { mode: 'boolean' }).notNull().default(true),
  requiresMfa: integer('requires_mfa', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
})

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  nameHu: text('name_hu').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
})

export const userRoleAssignments = sqliteTable('user_role_assignments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  scopeType: text('scope_type', { enum: scopeTypeValues }).notNull().default('global'),
  scopeId: text('scope_id'),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until'),
  appointedBy: text('appointed_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  initiatedBy: text('initiated_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  revokedAt: text('revoked_at'),
  revokedBy: text('revoked_by').references(() => user.id, { onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  createdAt: text('created_at').notNull()
}, (table) => ({
  // Csak egy aktív (nem visszavont) szerepkiosztás lehet ugyanarra a
  // felhasználó+szerep+scope kombinációra – ez a private.has_role logika
  // egyik előfeltétele.
  activeUnique: uniqueIndex('user_role_assignments_active_unique')
    .on(table.userId, table.roleId, table.scopeType, table.scopeId)
    .where(sql`${table.revokedAt} is null`)
}))

export const userPermissionGrants = sqliteTable('user_permission_grants', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'restrict' }),
  scopeType: text('scope_type', { enum: scopeTypeValues }).notNull().default('global'),
  scopeId: text('scope_id'),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until'),
  grantedBy: text('granted_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  revokedAt: text('revoked_at'),
  revokedBy: text('revoked_by').references(() => user.id, { onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  createdAt: text('created_at').notNull()
})

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  occurredAt: text('occurred_at').notNull(),
  actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'restrict' }),
  actorType: text('actor_type', { enum: ['user', 'system', 'service'] }).notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  projectId: text('project_id'),
  oldValues: text('old_values', { mode: 'json' }),
  newValues: text('new_values', { mode: 'json' }),
  reason: text('reason'),
  requestId: text('request_id'),
  metadata: text('metadata', { mode: 'json' }).notNull().default(sql`'{}'`)
})

export const seasons = sqliteTable('seasons', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  startsOn: text('starts_on').notNull(),
  endsOn: text('ends_on').notNull()
})

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  projectCode: text('project_code').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  objective: text('objective'),
  ownerUserId: text('owner_user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  startsOn: text('starts_on'),
  endsOn: text('ends_on'),
  seasonId: text('season_id').references(() => seasons.id, { onDelete: 'set null' }),
  status: text('status', { enum: projectStatusValues }).notNull().default('draft'),
  closedAt: text('closed_at'),
  closedBy: text('closed_by').references(() => user.id, { onDelete: 'restrict' }),
  archivedAt: text('archived_at'),
  archivedBy: text('archived_by').references(() => user.id, { onDelete: 'restrict' }),
  deletedAt: text('deleted_at'),
  deletedBy: text('deleted_by').references(() => user.id, { onDelete: 'restrict' }),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull().references(() => user.id, { onDelete: 'restrict' })
})

export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  membershipRole: text('membership_role', { enum: ['owner', 'member'] }).notNull().default('member'),
  addedBy: text('added_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  addedAt: text('added_at').notNull(),
  leftAt: text('left_at')
}, (table) => ({
  activeMemberUnique: uniqueIndex('project_members_active_unique')
    .on(table.projectId, table.userId)
    .where(sql`${table.leftAt} is null`)
}))

export const projectCriticalBlocks = sqliteTable('project_critical_blocks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
  description: text('description').notNull(),
  raisedBy: text('raised_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  raisedAt: text('raised_at').notNull(),
  resolvedAt: text('resolved_at'),
  resolvedBy: text('resolved_by').references(() => user.id, { onDelete: 'restrict' })
})
