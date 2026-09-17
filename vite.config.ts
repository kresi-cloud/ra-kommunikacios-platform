import devServer from '@hono/vite-dev-server'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// A Claude Code harness a PORT környezeti változóval jelöli ki a szabad
// portot (autoPort), amikor az alapértelmezett 5173 már foglalt egy másik
// projekt szerverétől; enélkül Vite figyelmen kívül hagyná ezt, és a saját
// növekményes portválasztásával (5174, 5175, …) eltérne a harness várt
// portjától, üres oldalt eredményezve.
const harnessPort = Number(process.env.PORT)

export default defineConfig({
  server: harnessPort ? { port: harnessPort, strictPort: true } : undefined,
  plugins: [
    // A saját Hono API-szervert (server/index.ts) egy folyamatban futtatja a
    // Vite dev szerverrel; a /api/* kéréseket a Hono app szolgálja ki, minden
    // mást (HTML, JS, statikus fájl) továbbra is a Vite. Élesben ehelyett a
    // server/serve.ts önálló @hono/node-server-t indít (lásd README.md).
    devServer({
      entry: 'server/index.ts',
      // A plugin alapból csak néhány statikus kiterjesztést zár ki, a "/"
      // gyökeret (az index.html-t) is a Hono felé továbbítaná, ami 404-et
      // adna. Csak a /api alatti kéréseket engedjük a Hono felé, minden
      // mást a Vite maga szolgál ki (HTML, JS/CSS modulok, statikus fájlok).
      exclude: [/^(?!\/api\/).*/]
    }),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'RA Kommunikációs Platform',
        short_name: 'RA Kommunikáció',
        description: 'A Rátgéber Akadémia belső kommunikációs platformja',
        theme_color: '#212121',
        background_color: '#f5f3f1',
        display: 'standalone',
        lang: 'hu-HU',
        start_url: '/',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: []
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'server/**/*.test.ts']
  }
})
