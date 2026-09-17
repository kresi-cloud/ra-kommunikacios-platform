// Migrációalkalmazó: a szerver induláskor (server/serve.ts) és a
// `npm run db:migrate` parancs is ezt hívja. Idempotens – a drizzle-orm
// migrátor saját `__drizzle_migrations` táblában tartja számon, mit
// alkalmazott már.
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './client'

export function runMigrations(): void {
  migrate(db, { migrationsFolder: './server/db/migrations' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
  console.log('Migrációk alkalmazva.')
}
