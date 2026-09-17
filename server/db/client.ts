// SQLite-kapcsolat és Drizzle-példány. A fájl helye környezeti változóval
// felülírható (pl. tesztekhez ideiglenes fájlt vagy memóriabeli adatbázist
// használunk); élesben egyetlen, verziókezelésből kizárt fájlba írunk.
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as authSchema from './auth-schema'
import * as appSchema from './schema'

export const schema = { ...authSchema, ...appSchema }

const DEFAULT_DB_PATH = resolve(process.cwd(), 'data/ra-kommunikacios-platform.sqlite')

export function resolveDbPath(): string {
  if (!process.env.DATABASE_PATH) return DEFAULT_DB_PATH
  // A ':memory:' a better-sqlite3 speciális jelölése egy be nem íródó,
  // memóriabeli adatbázisra (teszteknél használjuk); a path.resolve()
  // ezt féloldalasan relatív útvonalként kezelné és eltorzítaná.
  if (process.env.DATABASE_PATH === ':memory:') return ':memory:'
  return resolve(process.env.DATABASE_PATH)
}

function ensureDirectory(filePath: string) {
  if (filePath === ':memory:') return
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const dbPath = resolveDbPath()
ensureDirectory(dbPath)

export const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export type AppDatabase = typeof db
