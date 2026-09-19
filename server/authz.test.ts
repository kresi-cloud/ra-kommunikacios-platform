// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { AppDatabase } from './db/client'

process.env.DATABASE_PATH = ':memory:'

let db: AppDatabase
let userTable: typeof import('./db/auth-schema')['user']
let roles: typeof import('./db/schema')['roles']
let userRoleAssignments: typeof import('./db/schema')['userRoleAssignments']
let tasksTable: typeof import('./db/schema')['tasks']
let authz: typeof import('./authz')

const ROLE_LEAD = '10000000-0000-0000-0000-000000000001'
const ROLE_TECH_ADMIN = '10000000-0000-0000-0000-000000000002'
const ROLE_PROJECT_OWNER = '10000000-0000-0000-0000-000000000003'

async function insertUser(id: string, status: 'active' | 'activation_pending' = 'active') {
  await db.insert(userTable).values({
    id,
    name: id,
    email: `${id}@example.test`,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    display_name: id,
    account_status: status,
    is_internal_member: true
  })
}

async function assignRole(userId: string, roleId: string, scopeType: 'global' | 'project' = 'global', scopeId: string | null = null) {
  await db.insert(userRoleAssignments).values({
    id: crypto.randomUUID(),
    userId,
    roleId,
    scopeType,
    scopeId,
    validFrom: new Date().toISOString(),
    appointedBy: userId,
    initiatedBy: userId,
    reason: 'teszt',
    createdAt: new Date().toISOString()
  })
}

beforeAll(async () => {
  ;({ db } = await import('./db/client'))
  const { runMigrations } = await import('./db/migrate')
  runMigrations()
  ;({ user: userTable } = await import('./db/auth-schema'))
  ;({ roles, userRoleAssignments, tasks: tasksTable } = await import('./db/schema'))
  authz = await import('./authz')

  await db.insert(roles).values([
    { id: ROLE_LEAD, code: 'communication_lead', nameHu: 'Kommunikációs vezető', requiresMfa: true },
    { id: ROLE_TECH_ADMIN, code: 'technical_admin', nameHu: 'Technikai admin', requiresMfa: true },
    { id: ROLE_PROJECT_OWNER, code: 'project_owner', nameHu: 'Projektgazda', requiresMfa: true }
  ])
})

describe('isActiveUser', () => {
  it('aktív fiókra igazat ad', async () => {
    await insertUser('u-active')
    expect(await authz.isActiveUser(db, 'u-active')).toBe(true)
  })

  it('nem aktív fiókra hamisat ad', async () => {
    await insertUser('u-pending', 'activation_pending')
    expect(await authz.isActiveUser(db, 'u-pending')).toBe(false)
  })

  it('hiányzó felhasználóra hamisat ad', async () => {
    expect(await authz.isActiveUser(db, 'nincs-ilyen')).toBe(false)
  })
})

describe('hasRole', () => {
  it('global szereppel bármely scope-ra igazat ad', async () => {
    await insertUser('u-lead')
    await assignRole('u-lead', ROLE_LEAD)
    expect(await authz.isCommunicationLead(db, 'u-lead')).toBe(true)
    expect(await authz.hasRole(db, 'u-lead', 'communication_lead', { type: 'project', id: 'akarmi' })).toBe(true)
  })

  it('projekt-scope-hoz kötött szerep csak arra a projektre érvényes', async () => {
    await insertUser('u-owner')
    await assignRole('u-owner', ROLE_PROJECT_OWNER, 'project', 'proj-1')
    expect(await authz.hasRole(db, 'u-owner', 'project_owner', { type: 'project', id: 'proj-1' })).toBe(true)
    expect(await authz.hasRole(db, 'u-owner', 'project_owner', { type: 'project', id: 'proj-2' })).toBe(false)
    expect(await authz.hasRole(db, 'u-owner', 'project_owner')).toBe(false)
  })

  it('visszavont szerep nem érvényes', async () => {
    await insertUser('u-revoked')
    const assignmentId = crypto.randomUUID()
    await db.insert(userRoleAssignments).values({
      id: assignmentId, userId: 'u-revoked', roleId: ROLE_LEAD, scopeType: 'global',
      validFrom: new Date().toISOString(), appointedBy: 'u-revoked', initiatedBy: 'u-revoked',
      reason: 'teszt', createdAt: new Date().toISOString(), revokedAt: new Date().toISOString()
    })
    expect(await authz.isCommunicationLead(db, 'u-revoked')).toBe(false)
  })
})

describe('canAccessProject', () => {
  it('a technikai admin sosem fér hozzá', async () => {
    await insertUser('u-tech')
    await assignRole('u-tech', ROLE_TECH_ADMIN)
    expect(await authz.canAccessProject(db, 'u-tech', 'proj-x')).toBe(false)
  })
})

describe('canAccessTask', () => {
  async function insertTask(id: string, responsibleUserId: string) {
    const now = new Date().toISOString()
    await db.insert(tasksTable).values({
      id, taskCode: `TASK-${id}`, title: 'Teszt feladat', responsibleUserId,
      status: 'assigned', acceptanceStatus: 'pending', priority: 'normal', unscheduled: true,
      createdAt: now, createdBy: responsibleUserId, updatedAt: now, updatedBy: responsibleUserId
    })
  }

  it('a felelős mindig hozzáfér a saját feladatához', async () => {
    await insertUser('u-task-responsible')
    await insertTask('t-1', 'u-task-responsible')
    expect(await authz.canAccessTask(db, 'u-task-responsible', 't-1')).toBe(true)
  })

  it('idegen, projekt nélküli feladathoz nem fér hozzá más munkatárs', async () => {
    await insertUser('u-task-other')
    expect(await authz.canAccessTask(db, 'u-task-other', 't-1')).toBe(false)
  })

  it('a technikai admin a saját feladatához sem fér hozzá', async () => {
    // A 'u-tech' fiók a "canAccessProject" leírásban már megkapta a
    // technical_admin szerepet; itt csak egy hozzá rendelt feladatot kell
    // felvenni ugyanahhoz a fiókhoz.
    await insertTask('t-2', 'u-tech')
    expect(await authz.canAccessTask(db, 'u-tech', 't-2')).toBe(false)
  })

  it('nem létező feladatra hamisat ad', async () => {
    expect(await authz.canAccessTask(db, 'u-task-responsible', 'nincs-ilyen')).toBe(false)
  })
})
