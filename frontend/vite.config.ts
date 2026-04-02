import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the Flask backend (avoids CORS + preserves cookies).
      '/api': 'http://localhost:5000',
      // Also proxy logout/dashboard routes if you decide to reuse them later.
      '/logout': 'http://localhost:5000',
      '/dashboard': 'http://localhost:5000',
    },
  },
})
