// @vitest-environment node
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import type { AppDatabase } from '../db/client'

process.env.DATABASE_PATH = ':memory:'

let db: AppDatabase
let userTable: typeof import('../db/auth-schema')['user']
let roles: typeof import('../db/schema')['roles']
let userRoleAssignments: typeof import('../db/schema')['userRoleAssignments']
let taskDeadlineHistory: typeof import('../db/schema')['taskDeadlineHistory']
let tasksTable: typeof import('../db/schema')['tasks']
let createProject: typeof import('./projects')['createProject']
let createTask: typeof import('./tasks')['createTask']
let transitionTask: typeof import('./tasks')['transitionTask']
let changeTaskDeadline: typeof import('./tasks')['changeTaskDeadline']
let reassignTask: typeof import('./tasks')['reassignTask']
let getTaskCapabilities: typeof import('./tasks')['getTaskCapabilities']

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
  ;({ roles, userRoleAssignments, taskDeadlineHistory, tasks: tasksTable } = await import('../db/schema'))
  ;({ createProject } = await import('./projects'))
  ;({ createTask, transitionTask, changeTaskDeadline, reassignTask, getTaskCapabilities } = await import('./tasks'))

  await db.insert(roles).values([
    { id: ROLE_LEAD, code: 'communication_lead', nameHu: 'Kommunikációs vezető', requiresMfa: true },
    { id: ROLE_TECH_ADMIN, code: 'technical_admin', nameHu: 'Technikai admin', requiresMfa: true },
    { id: ROLE_OWNER, code: 'project_owner', nameHu: 'Projektgazda', requiresMfa: true }
  ])

  await insertUser('lead')
  await assignRole('lead', ROLE_LEAD)
  await insertUser('owner')
  await insertUser('staff')
  await insertUser('tech')
  await assignRole('tech', ROLE_TECH_ADMIN)
  await insertUser('external', false)
})

describe('createTask', () => {
  it('a vezető feladatot oszthat ki a projektgazdának saját feladatként is', async () => {
    const task = await createTask(db, 'lead', { title: 'Sajtóközlemény', responsibleUserId: 'staff' })
    expect(task.status).toBe('assigned')
    expect(task.acceptanceStatus).toBe('pending')
    expect(task.taskCode).toMatch(/^RA-TASK-\d{4}-/)
  })

  it('technikai admin nem hozhat létre feladatot', async () => {
    await expect(createTask(db, 'tech', { title: 'X', responsibleUserId: 'staff' }))
      .rejects.toThrow('Nincs jogosultság feladat létrehozására.')
  })

  it('önálló feladatot csak saját részre hozhat létre a munkatárs', async () => {
    await expect(createTask(db, 'staff', { title: 'X', responsibleUserId: 'owner' }))
      .rejects.toThrow('Önálló feladat csak saját részre hozható létre.')
    const own = await createTask(db, 'staff', { title: 'Saját feladat', responsibleUserId: 'staff' })
    expect(own.status).toBe('assigned')
  })

  it('külső (nem aktív belső) felelős esetén elutasít', async () => {
    await expect(createTask(db, 'lead', { title: 'X', responsibleUserId: 'external' }))
      .rejects.toThrow('A felelős nem aktív felhasználó.')
  })

  it('kritikus prioritáshoz indoklás kell', async () => {
    await expect(createTask(db, 'lead', { title: 'X', responsibleUserId: 'staff', priority: 'critical' }))
      .rejects.toThrow('Kritikus prioritáshoz indoklás szükséges.')
  })

  it('felülvizsgálathoz felülvizsgáló kell', async () => {
    await expect(createTask(db, 'lead', { title: 'X', responsibleUserId: 'staff', requiresReview: true }))
      .rejects.toThrow('Felülvizsgálathoz felülvizsgáló szükséges.')
  })
})

describe('transitionTask', () => {
  it('a felelős elfogadhatja a kiosztott feladatot, majd elindíthatja', async () => {
    const task = await createTask(db, 'lead', { title: 'Elfogadandó', responsibleUserId: 'staff' })
    const accepted = await transitionTask(db, 'staff', task.id, 'accepted', null, null, false)
    expect(accepted.acceptanceStatus).toBe('accepted')
    const started = await transitionTask(db, 'staff', task.id, 'in_progress', null, null, false)
    expect(started.status).toBe('in_progress')
    expect(started.startedAt).not.toBeNull()
  })

  it('nem engedélyezett átmenetet elutasít', async () => {
    const task = await createTask(db, 'lead', { title: 'Tiltott átmenet', responsibleUserId: 'staff' })
    await expect(transitionTask(db, 'staff', task.id, 'completed', null, null, false))
      .rejects.toThrow('Nem engedélyezett feladatállapot-átmenet.')
  })

  it('blokkoláshoz indoklás szükséges, és rögzíti a blokk-részletet', async () => {
    const task = await createTask(db, 'lead', { title: 'Blokkolandó', responsibleUserId: 'staff' })
    await expect(transitionTask(db, 'staff', task.id, 'blocked', null, null, false))
      .rejects.toThrow('Nem engedélyezett feladatállapot-átmenet.')
    const blocked = await transitionTask(db, 'staff', task.id, 'blocked', 'Függő beszerzés', null, false)
    expect(blocked.status).toBe('blocked')
  })

  it('publikációs feladat határidő nélkül nem indítható', async () => {
    const task = await createTask(db, 'lead', { title: 'Publikációs', responsibleUserId: 'staff' })
    await db.update(tasksTable).set({ isPublicationRequired: true }).where(eq(tasksTable.id, task.id))
    await transitionTask(db, 'staff', task.id, 'accepted', null, null, false)
    await expect(transitionTask(db, 'staff', task.id, 'in_progress', null, null, false))
      .rejects.toThrow('Publikációs feladat határidő nélkül nem indítható.')
  })

  it('review nélküli feladatot a felelős fejezheti be közvetlenül', async () => {
    const task = await createTask(db, 'lead', { title: 'Egyszerű', responsibleUserId: 'staff' })
    await transitionTask(db, 'staff', task.id, 'accepted', null, null, false)
    await transitionTask(db, 'staff', task.id, 'in_progress', null, null, false)
    const done = await transitionTask(db, 'staff', task.id, 'completed', null, null, false)
    expect(done.status).toBe('completed')
    expect(done.completedBy).toBe('staff')
  })

  it('review-köteles feladatot a felelős nem zárhat le közvetlenül, csak a felülvizsgáló', async () => {
    const task = await createTask(db, 'lead', {
      title: 'Review-s', responsibleUserId: 'staff', requiresReview: true, reviewerUserId: 'owner'
    })
    await transitionTask(db, 'staff', task.id, 'accepted', null, null, false)
    await transitionTask(db, 'staff', task.id, 'in_progress', null, null, false)
    await expect(transitionTask(db, 'staff', task.id, 'completed', null, null, false))
      .rejects.toThrow('Nem engedélyezett feladatállapot-átmenet.')
    const inReview = await transitionTask(db, 'staff', task.id, 'in_review', null, null, false)
    expect(inReview.status).toBe('in_review')
    const done = await transitionTask(db, 'owner', task.id, 'completed', null, null, false)
    expect(done.status).toBe('completed')
  })
})

describe('changeTaskDeadline', () => {
  it('indoklás nélkül nem módosítható, indokkal append-only előzményt ír', async () => {
    const task = await createTask(db, 'lead', { title: 'Határidős', responsibleUserId: 'staff' })
    await expect(changeTaskDeadline(db, 'staff', task.id, '2026-12-01T10:00:00.000Z', ''))
      .rejects.toThrow('A határidő módosításához indoklás szükséges.')
    const updated = await changeTaskDeadline(db, 'staff', task.id, '2026-12-01T10:00:00.000Z', 'Egyeztetett új határidő')
    expect(updated.dueAt).toBe('2026-12-01T10:00:00.000Z')
    const history = await db.select().from(taskDeadlineHistory)
    expect(history.some((row) => row.taskId === task.id && row.reason === 'Egyeztetett új határidő')).toBe(true)
  })

  it('visszamenőleges határidőt csak a vezető adhat', async () => {
    const task = await createTask(db, 'lead', { title: 'Visszamenőleges', responsibleUserId: 'staff' })
    await expect(changeTaskDeadline(db, 'staff', task.id, '2020-01-01T00:00:00.000Z', 'Múltbeli'))
      .rejects.toThrow('Visszamenőleges határidőt csak a kommunikációs vezető adhat.')
    const updated = await changeTaskDeadline(db, 'lead', task.id, '2020-01-01T00:00:00.000Z', 'Múltbeli, vezetői döntés')
    expect(updated.dueAt).toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('reassignTask', () => {
  it('átadja a felelősséget, visszaállítja Kiosztva/Pending állapotba, és előzményt ír', async () => {
    const task = await createTask(db, 'lead', { title: 'Átadandó', responsibleUserId: 'staff' })
    await transitionTask(db, 'staff', task.id, 'accepted', null, null, false)
    const reassigned = await reassignTask(db, 'lead', task.id, 'owner', 'Kapacitás átrendezése')
    expect(reassigned.responsibleUserId).toBe('owner')
    expect(reassigned.status).toBe('assigned')
    expect(reassigned.acceptanceStatus).toBe('pending')
  })

  it('technikai admin nem jelölhető ki felelősnek', async () => {
    const task = await createTask(db, 'lead', { title: 'Átadás admin felé', responsibleUserId: 'staff' })
    await expect(reassignTask(db, 'lead', task.id, 'tech', 'Próba'))
      .rejects.toThrow('Az új felelős nem aktív, kijelölhető felhasználó.')
  })

  it('indoklás nélkül nem adható át', async () => {
    const task = await createTask(db, 'lead', { title: 'Indok nélküli átadás', responsibleUserId: 'staff' })
    await expect(reassignTask(db, 'lead', task.id, 'owner', ''))
      .rejects.toThrow('A feladat átadásához indoklás szükséges.')
  })
})

describe('getTaskCapabilities', () => {
  it('a felelős módosíthatja a határidőt és átadhatja a feladatot', async () => {
    const task = await createTask(db, 'lead', { title: 'Jogosultság-teszt', responsibleUserId: 'staff' })
    const capabilities = await getTaskCapabilities(db, 'staff', task.id)
    expect(capabilities).toEqual({ canChangeDeadline: true, canReassign: true })
  })

  it('technikai admin egyik jogosultsággal sem rendelkezik', async () => {
    const task = await createTask(db, 'lead', { title: 'Admin-teszt', responsibleUserId: 'staff' })
    const capabilities = await getTaskCapabilities(db, 'tech', task.id)
    expect(capabilities).toEqual({ canChangeDeadline: false, canReassign: false })
  })
})

describe('projekthez kötött feladat', () => {
  it('a projektgazda (project_owner szereppel) is kioszthat és módosíthat feladatot a saját projektjében', async () => {
    const project = await createProject(db, 'lead', { title: 'Feladat-projekt', ownerUserId: 'owner' })
    await assignRole('owner', ROLE_OWNER, 'project', project.id)
    const task = await createTask(db, 'owner', {
      title: 'Projektfeladat', responsibleUserId: 'staff', projectId: project.id
    })
    expect(task.projectId).toBe(project.id)
    const updated = await changeTaskDeadline(db, 'owner', task.id, '2026-12-15T09:00:00.000Z', 'Projektgazda állítja be')
    expect(updated.dueAt).toBe('2026-12-15T09:00:00.000Z')
  })

  it('projekt-jogosultság nélkül nem hozható létre feladat a projektben', async () => {
    const project = await createProject(db, 'lead', { title: 'Zárt projekt', ownerUserId: 'owner' })
    await expect(createTask(db, 'staff', { title: 'X', responsibleUserId: 'staff', projectId: project.id }))
      .rejects.toThrow('A projektben nincs feladatlétrehozási jogosultság.')
  })
})
