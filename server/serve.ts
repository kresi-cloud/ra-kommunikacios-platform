// Éles/önálló indítás Node-on, a beépített Vite dev szerver nélkül
// (`npm run build` után `node server/serve.js`, vagy fejlesztésben
// `npm run server:dev`). A statikus frontendet a dist/ mappából szolgálja
// ki, minden más útvonalon a Hono app dönt.
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import app from './index'

app.use('/*', serveStatic({ root: './dist' }))

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Szerver fut: http://localhost:${info.port}`)
})
