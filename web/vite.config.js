import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Lets `vite dev` alone resolve /js/firebase-config.js against the
      // real Express backend (which serves public/js/* there) -- mirrors
      // the /api proxy above. Production doesn't need this: Express already
      // serves that same path directly.
      '/js': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
