import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Cache everything for offline-first experience
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Cache the main app shell
            urlPattern: /^https:\/\/localhost:\d+\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 3,
            }
          }
        ],
        // Generate SW that claims clients immediately
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: {
        name: 'Karu Authenticator',
        short_name: 'KaruAuth',
        description: 'A secure TOTP authenticator with developer tools',
        theme_color: '#1a73e8',
        background_color: '#f8f9fa',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ],
        shortcuts: [
          {
            name: 'Add Account',
            short_name: 'Add',
            description: 'Add a new authenticator account',
            url: '/?action=add',
            icons: [
              {
                src: '/vite.svg',
                sizes: '96x96',
                type: 'image/svg+xml'
              }
            ]
          }
        ],
        categories: ['productivity', 'security', 'utilities']
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
