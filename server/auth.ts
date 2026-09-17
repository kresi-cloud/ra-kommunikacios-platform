// A Supabase Auth (Google OAuth + e-mail/jelszó) helyettesítője. A profilt
// leíró mezők közvetlenül a better-auth `user` tábláján kiegészítő
// mezőkként (additionalFields) élnek – nincs külön "profiles" tábla, mint a
// korábbi Supabase-modellben, mert itt nincs auth.users/public.profiles
// séma-elválasztás.
//
// A jelszó minimális hossza (12) és a nyilvános regisztráció letiltása a
// korábbi Supabase-specifikáció közvetlen folytatása (lásd
// docs/security-and-privacy.md: "nincs nyilvános regisztráció" – ezért
// `emailAndPassword.disableSignUp: true`; fiókot csak meghívással, a
// server/routes/invitations.ts RPC-jén keresztül lehet létrehozni, amit
// egy külön increment ad hozzá).
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, schema } from './db/client'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
  // A helyi fejlesztői szerver portja géptől és a Vite saját portfoglalási
  // logikájától függően eltérhet az 5173-től (lásd vite.config.ts); a
  // csillagos minta csak localhost-originokra illeszkedik, külső hosztra nem.
  trustedOrigins: process.env.BETTER_AUTH_URL ? [] : ['http://localhost:*'],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    disableSignUp: true
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
        }
      }
    : undefined,
  user: {
    additionalFields: {
      displayName: { type: 'string', required: true, fieldName: 'display_name' },
      jobTitle: { type: 'string', required: false, fieldName: 'job_title' },
      organizationalUnit: { type: 'string', required: false, fieldName: 'organizational_unit' },
      isInternalMember: {
        type: 'boolean', required: true, defaultValue: true, fieldName: 'is_internal_member'
      },
      accountStatus: {
        type: 'string', required: true, defaultValue: 'activation_pending', fieldName: 'account_status'
      },
      externalExpiresAt: { type: 'date', required: false, fieldName: 'external_expires_at' }
    }
  },
  advanced: {
    database: { generateId: () => crypto.randomUUID() }
  }
})

export type Auth = typeof auth
