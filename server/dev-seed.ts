// A shared/dev-personas.ts fiókjait hozza létre idempotensen. Csak
// fejlesztésben hívjuk (lásd server/index.ts NODE_ENV-ellenőrzését) – éles
// üzemben nyilvános regisztráció helyett a
// server/scripts/bootstrap-admin.ts szkript hozza létre az első fiókot.
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { DEV_PERSONAS, type DevPersonaRole } from '../shared/dev-personas'
import { db } from './db/client'
import { account, user } from './db/auth-schema'
import { roles, userRoleAssignments } from './db/schema'

const ROLE_IDS: Record<DevPersonaRole, string> = {
  communication_lead: '10000000-0000-0000-0000-000000000001',
  technical_admin: '10000000-0000-0000-0000-000000000002',
  project_owner: '10000000-0000-0000-0000-000000000003',
  staff_member: '10000000-0000-0000-0000-000000000004'
}

const ROLE_NAMES_HU: Record<DevPersonaRole, string> = {
  communication_lead: 'Kommunikációs vezető',
  technical_admin: 'Technikai admin',
  project_owner: 'Projektgazda',
  staff_member: 'Szervezeti munkatárs'
}

const ROLE_REQUIRES_MFA: Record<DevPersonaRole, boolean> = {
  communication_lead: true,
  technical_admin: true,
  project_owner: true,
  staff_member: false
}

export async function ensureDevPersonas(): Promise<void> {
  for (const roleCode of Object.keys(ROLE_IDS) as DevPersonaRole[]) {
    await db.insert(roles).values({
      id: ROLE_IDS[roleCode], code: roleCode, nameHu: ROLE_NAMES_HU[roleCode],
      requiresMfa: ROLE_REQUIRES_MFA[roleCode]
    }).onConflictDoNothing()
  }

  for (const persona of DEV_PERSONAS) {
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, persona.email)).limit(1)
    if (existing) continue

    const now = new Date()
    const userId = crypto.randomUUID()
    await db.insert(user).values({
      id: userId,
      name: persona.displayName,
      email: persona.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      display_name: persona.displayName,
      account_status: 'active',
      is_internal_member: true
    })
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId,
      providerId: 'credential',
      accountId: userId,
      password: await hashPassword(persona.password),
      createdAt: now,
      updatedAt: now
    })
    await db.insert(userRoleAssignments).values({
      id: crypto.randomUUID(),
      userId,
      roleId: ROLE_IDS[persona.roleCode],
      scopeType: 'global',
      validFrom: now.toISOString(),
      appointedBy: userId,
      initiatedBy: userId,
      reason: 'Fejlesztői demó-fiók',
      createdAt: now.toISOString()
    })
    console.log(`Fejlesztői demó-fiók létrehozva: ${persona.email} (${persona.roleLabel})`)
  }
}
