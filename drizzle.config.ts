import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./server/db/auth-schema.ts', './server/db/schema.ts'],
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? './data/ra-kommunikacios-platform.sqlite'
  }
})
