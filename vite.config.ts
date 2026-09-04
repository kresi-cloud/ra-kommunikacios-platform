import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'RA Kommunikációs Platform',
        short_name: 'RA Kommunikáció',
        description: 'A Rátgéber Akadémia belső kommunikációs platformja',
        theme_color: '#0f2742',
        background_color: '#f5f7fa',
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
    include: ['tests/**/*.{test,spec}.{ts,tsx}']
  }
})
