/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base so one build runs from the GitHub Pages subpath, from
  // file:// and inside the Capacitor WebView without rebuilding.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Pishani — the forehead guessing game',
        short_name: 'Pishani',
        description:
          'Heads Up–style party game with desi and global decks. Tilt or swipe. Works fully offline.',
        theme_color: '#1c1c1a',
        background_color: '#efece6',
        display: 'fullscreen',
        // "any", not portrait: the menu is portrait-friendly but a round is
        // played in landscape on the forehead.
        orientation: 'any',
        start_url: './index.html',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // No backend at all, so precaching everything *is* the offline story.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
