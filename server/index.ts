// A Hono API-alkalmazás. Fejlesztésben a @hono/vite-dev-server plugin
// (lásd vite.config.ts) egy folyamatban futtatja a Vite-tal; élesben a
// server/serve.ts önálló Node-folyamatként indítja @hono/node-server-rel.
import { Hono } from 'hono'
import { auth } from './auth'
import { runMigrations } from './db/migrate'
import { ensureDevPersonas } from './dev-seed'
import { registerProjectRoutes } from './routes/projects'

runMigrations()

// Fejlesztői gyorsbelépő fiókok (lásd shared/dev-personas.ts). Élesben
// (NODE_ENV=production) sosem fut le.
if (process.env.NODE_ENV !== 'production') {
  await ensureDevPersonas()
}

export const app = new Hono()

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.get('/api/me', async (c) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!result) return c.json({ user: null }, 200)
  return c.json({ user: result.user })
})

registerProjectRoutes(app)

export default app
