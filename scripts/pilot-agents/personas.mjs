// Pilot-ágens személyiségek. Minden személyiség saját Supabase Auth fiókból
// dolgozik, a valódi RPC-ken és RLS-en keresztül, ahogy egy tényleges
// felhasználó tenné a felületen. A fiókokat a TEST Supabase projektben kell
// előre létrehozni (lásd README.md), a jelszót és e-mailt környezeti
// változóként kell megadni – ide sosem kerül valódi érték.

const REQUIRED = ['PILOT_SUPABASE_URL', 'PILOT_SUPABASE_ANON_KEY']

export function readEnvConfig(env = process.env) {
  const missing = REQUIRED.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Hiányzó környezeti változó: ${missing.join(', ')}`)
  }
  return {
    supabaseUrl: env.PILOT_SUPABASE_URL,
    supabaseAnonKey: env.PILOT_SUPABASE_ANON_KEY
  }
}

/**
 * A kötelező személyiségek: kommunikációs vezető, projektgazda, munkatárs.
 * A technikai admin opcionális – csak egy negatív (RLS-tiltási) ellenőrzéshez
 * kell, és hiányában a forgatókönyv kihagyja azt a lépést.
 */
export function readPersonas(env = process.env) {
  const persona = (key, roleHu) => {
    const email = env[`PILOT_${key}_EMAIL`]
    const password = env[`PILOT_${key}_PASSWORD`]
    return email && password ? { key, roleHu, email, password } : null
  }

  const lead = persona('LEAD', 'Kommunikációs vezető')
  const owner = persona('OWNER', 'Projektgazda')
  const staff = persona('STAFF', 'Munkatárs')
  const admin = persona('ADMIN', 'Technikai admin')

  const required = { lead, owner, staff }
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(
      `Hiányzó pilot-fiók adatok: ${missing.join(', ')}. Állítsd be a PILOT_<SZEREP>_EMAIL és ` +
      'PILOT_<SZEREP>_PASSWORD környezeti változókat (lásd scripts/pilot-agents/README.md).'
    )
  }

  return { lead, owner, staff, admin }
}
