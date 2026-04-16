import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Quest Life',
        short_name: 'Quest Life',
        description: 'AI-Powered Personal RPG Habit Tracker',
        theme_color: '#C4714A',
        background_color: '#F5ECD7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to accommodate WebLLM lib
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.huggingface\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'hf-api-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  worker: {
    format: 'es',
  },
})
