// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../db/client'

process.env.DATABASE_PATH = ':memory:'

let db: AppDatabase
let userTable: typeof import('../db/auth-schema')['user']
let roles: typeof import('../db/schema')['roles']
let userRoleAssignments: typeof import('../db/schema')['userRoleAssignments']
let projectCriticalBlocks: typeof import('../db/schema')['projectCriticalBlocks']
let createProject: typeof import('./projects')['createProject']
let transitionProject: typeof import('./projects')['transitionProject']

const ROLE_LEAD = '10000000-0000-0000-0000-000000000001'
const ROLE_TECH_ADMIN = '10000000-0000-0000-0000-000000000002'
const ROLE_OWNER = '10000000-0000-0000-0000-000000000003'

async function insertUser(id: string, internal = true) {
  await db.insert(userTable).values({
    id, name: id, email: `${id}@example.test`, emailVerified: false,
    createdAt: new Date(), updatedAt: new Date(),
    display_name: id, account_status: 'active', is_internal_member: internal
  })
}

async function assignRole(userId: string, roleId: string, scopeType: 'global' | 'project' = 'global', scopeId: string | null = null) {
  await db.insert(userRoleAssignments).values({
    id: crypto.randomUUID(), userId, roleId, scopeType, scopeId,
    validFrom: new Date().toISOString(), appointedBy: userId, initiatedBy: userId,
    reason: 'teszt', createdAt: new Date().toISOString()
  })
}

beforeAll(async () => {
  ;({ db } = await import('../db/client'))
  const { runMigrations } = await import('../db/migrate')
  runMigrations()
  ;({ user: userTable } = await import('../db/auth-schema'))
  ;({ roles, userRoleAssignments, projectCriticalBlocks } = await import('../db/schema'))
  ;({ createProject, transitionProject } = await import('./projects'))

  await db.insert(roles).values([
    { id: ROLE_LEAD, code: 'communication_lead', nameHu: 'Kommunikációs vezető', requiresMfa: true },
    { id: ROLE_TECH_ADMIN, code: 'technical_admin', nameHu: 'Technikai admin', requiresMfa: true },
    { id: ROLE_OWNER, code: 'project_owner', nameHu: 'Projektgazda', requiresMfa: true }
  ])

  await insertUser('lead')
  await assignRole('lead', ROLE_LEAD)
  await insertUser('owner')
  await insertUser('tech')
  await assignRole('tech', ROLE_TECH_ADMIN)
  await insertUser('external', false)
})

describe('createProject', () => {
  it('a vezető létrehozhat projektet aktív belső gazdával', async () => {
    const project = await createProject(db, 'lead', { title: 'Sajtókampány' , ownerUserId: 'owner' })
    expect(project.status).toBe('draft')
    expect(project.projectCode).toMatch(/^RA-PROJ-\d{4}-/)
  })

  it('technikai admin nem hozhat létre projektet', async () => {
    await expect(createProject(db, 'tech', { title: 'X', ownerUserId: 'owner' }))
      .rejects.toThrow('A technikai admin nem hozhat létre kommunikációs projektet.')
  })

  it('sima munkatárs jogosultság nélkül nem hozhat létre projektet', async () => {
    await insertUser('staff')
    await expect(createProject(db, 'staff', { title: 'X', ownerUserId: 'owner' }))
      .rejects.toThrow('Nincs jogosultság projekt létrehozására.')
  })

  it('külső (nem belső) gazda esetén elutasít', async () => {
    await expect(createProject(db, 'lead', { title: 'X', ownerUserId: 'external' }))
      .rejects.toThrow('A projektgazda nem aktív belső felhasználó.')
  })

  it('üres cím esetén elutasít', async () => {
    await expect(createProject(db, 'lead', { title: '   ', ownerUserId: 'owner' }))
      .rejects.toThrow('A projekt címe hibás.')
  })
})

describe('transitionProject', () => {
  it('draft -> active engedélyezett a projektgazdának, ha van project_owner szerepe', async () => {
    const project = await createProject(db, 'lead', { title: 'Átmenet teszt', ownerUserId: 'owner' })
    await assignRole('owner', ROLE_OWNER, 'project', project.id)
    const updated = await transitionProject(db, 'owner', project.id, 'active', null)
    expect(updated.status).toBe('active')
  })

  it('a gazda project_owner szerep nélkül nem válthat állapotot', async () => {
    await insertUser('owner-no-role')
    const project = await createProject(db, 'lead', { title: 'Szerep nélküli gazda', ownerUserId: 'owner-no-role' })
    await expect(transitionProject(db, 'owner-no-role', project.id, 'active', null))
      .rejects.toThrow('Nincs jogosultság a projekt állapotváltására.')
  })

  it('aktív kritikus blokk mellett nem zárható le', async () => {
    const project = await createProject(db, 'lead', { title: 'Blokkolt projekt', ownerUserId: 'owner' })
    await transitionProject(db, 'lead', project.id, 'active', null)
    await db.insert(projectCriticalBlocks).values({
      id: crypto.randomUUID(), projectId: project.id, description: 'Függő beszerzés',
      raisedBy: 'lead', raisedAt: new Date().toISOString()
    })
    await expect(transitionProject(db, 'lead', project.id, 'closed', null))
      .rejects.toThrow('Aktív kritikus blokk mellett a projekt nem zárható le.')
  })

  it('lezárt projektet a vezető indoklással újranyithat', async () => {
    const project = await createProject(db, 'lead', { title: 'Újranyitandó', ownerUserId: 'owner' })
    await transitionProject(db, 'lead', project.id, 'active', null)
    await transitionProject(db, 'lead', project.id, 'closed', null)
    const reopened = await transitionProject(db, 'lead', project.id, 'active', 'Utólagos kiegészítés szükséges')
    expect(reopened.status).toBe('active')
  })

  it('indoklás nélkül nem nyitható újra', async () => {
    const project = await createProject(db, 'lead', { title: 'Indok nélkül', ownerUserId: 'owner' })
    await transitionProject(db, 'lead', project.id, 'active', null)
    await transitionProject(db, 'lead', project.id, 'closed', null)
    await expect(transitionProject(db, 'lead', project.id, 'active', null))
      .rejects.toThrow('Nem engedélyezett projektállapot-átmenet.')
  })
})
