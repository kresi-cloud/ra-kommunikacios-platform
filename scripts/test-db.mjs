import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const databaseUrl = process.env.SUPABASE_DB_URL

if (!databaseUrl || databaseUrl.includes('[CONFIGURE_ME]')) {
  console.error('A DB-teszt nem futott: a SUPABASE_DB_URL nincs konfigurálva.')
  process.exit(2)
}

const testFile = path.join(root, 'tests', 'db', 'rls.sql')
if (!existsSync(testFile)) throw new Error('Hiányzik a DB-tesztfájl.')

execFileSync('psql', [databaseUrl, '--set', 'ON_ERROR_STOP=1', '--file', testFile], {
  cwd: root,
  stdio: 'inherit'
})
