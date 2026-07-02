import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Objectif Evian — PWA offline-first, mobile (Android), aucun backend.
// Le service worker precache l'app shell + plan.json + nutrition.json + polices woff2.
export default defineConfig({
  // start_url "." (§10) → base relative pour fonctionner quel que soit le sous-chemin d'hébergement.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Assets copiés depuis public/ que l'on veut garantir dans le precache.
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon.png',
        'plan.json',
        'nutrition.json',
      ],
      manifest: {
        name: 'Objectif Evian',
        short_name: 'Evian',
        description: "Suivi d'entraînement — préparation triathlon Full Distance Evian",
        theme_color: '#0F1216',
        background_color: '#0F1216',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        lang: 'fr',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache complet de l'app shell + données + polices → offline total après 1re visite.
        globPatterns: ['**/*.{js,css,html,json,woff2,png,svg,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
