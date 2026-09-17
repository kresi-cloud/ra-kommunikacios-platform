// Az első fiók létrehozása. Nyilvános regisztráció nincs
// (`emailAndPassword.disableSignUp: true` a server/auth.ts-ben), ezért a
// legelső belépő fiókot valakinek szerveroldalon, ezzel a szkripttel kell
// létrehoznia – ez a korábbi Supabase-rendszer `bootstrap_activations`
// koncepciójának ideiglenes, egyszerűbb megfelelője. A user+account
// beírás pontosan a better-auth saját `/sign-up/email` végpontjának
// lépéseit követi (lásd node_modules/better-auth/dist/api/routes/sign-up.mjs),
// hogy a jelszóval utána valóban be lehessen jelentkezni.
//
// Használat:
//   npm run auth:bootstrap-admin -- --email=lead@example.test --password=... --name="Kommunikációs vezető"
import { hashPassword } from 'better-auth/crypto'
import { db } from '../db/client'
import { user, account } from '../db/auth-schema'
import { roles, userRoleAssignments } from '../db/schema'

const ROLE_LEAD_ID = '10000000-0000-0000-0000-000000000001'

function parseArgs(): { email: string; password: string; name: string } {
  const args = new Map(
    process.argv.slice(2)
      .filter((arg) => arg.startsWith('--'))
      .map((arg) => {
        const [key, ...rest] = arg.slice(2).split('=')
        return [key, rest.join('=')]
      })
  )
  const email = args.get('email')
  const password = args.get('password')
  const name = args.get('name') ?? 'Kommunikációs vezető'
  if (!email || !password) {
    throw new Error('Kötelező: --email=... --password=... (opcionális: --name="...")')
  }
  if (password.length < 12) throw new Error('A jelszónak legalább 12 karakter hosszúnak kell lennie.')
  return { email, password, name }
}

async function main() {
  const { email, password, name } = parseArgs()
  const now = new Date()
  const userId = crypto.randomUUID()

  await db.insert(roles).values({
    id: ROLE_LEAD_ID, code: 'communication_lead', nameHu: 'Kommunikációs vezető', requiresMfa: true
  }).onConflictDoNothing()

  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    display_name: name,
    account_status: 'active',
    is_internal_member: true
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId,
    providerId: 'credential',
    accountId: userId,
    password: await hashPassword(password),
    createdAt: now,
    updatedAt: now
  })

  await db.insert(userRoleAssignments).values({
    id: crypto.randomUUID(),
    userId,
    roleId: ROLE_LEAD_ID,
    scopeType: 'global',
    validFrom: now.toISOString(),
    appointedBy: userId,
    initiatedBy: userId,
    reason: 'Bootstrap: első fiók',
    createdAt: now.toISOString()
  })

  console.log(`Fiók létrehozva: ${email} (Kommunikációs vezető). Bejelentkezhet a belépő oldalon.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
