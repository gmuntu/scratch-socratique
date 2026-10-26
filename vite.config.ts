import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Stratégie de cache (Workbox, générée par vite-plugin-pwa) :
 *  - Shell applicatif (JS/CSS/HTML/icônes) : PRÉCACHÉ au build → l'app démarre hors-ligne.
 *  - Podcasts (/podcasts/*.mp3)            : CacheFirst + Range Requests (lecture audio avec seek).
 *  - Modèle Gemma (/models/*.task, ~500 Mo): CacheFirst, PAS précaché (trop gros pour le précache
 *                                            et le build) ; il est mis en cache au 1er téléchargement
 *                                            déclenché par aiRouter.preloadLocalModel().
 *  - Runtime WASM MediaPipe                : servi en local (/mediapipe-wasm/), CacheFirst.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Scratch Socratique',
        short_name: 'ScratchSocrate',
        description: 'Apprendre Scratch par le questionnement socratique, en ligne comme hors-ligne.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4c97ff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Exclut explicitement les gros fichiers du précache.
        globIgnores: ['**/models/**', '**/podcasts/**', '**/mediapipe-wasm/**'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/podcasts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'podcasts-v1',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          },
          {
            // Modèle local (/models/) ou hébergé ailleurs (ex. Hugging Face) : tout fichier .task.
            urlPattern: ({ url }) => url.pathname.startsWith('/models/') || url.pathname.endsWith('.task'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'llm-models-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 2 }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/mediapipe-wasm/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-wasm-v1',
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      }
    })
  ],
  // Le runtime WASM de MediaPipe ne doit pas être pré-bundlé par esbuild.
  optimizeDeps: { exclude: ['@mediapipe/tasks-genai'] }
});
