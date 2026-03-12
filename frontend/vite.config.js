import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Forward all /api/* requests to the Express backend.
      // The backend runs on port 4000 (set via PORT in backend/.env).
      '/api': {
        target:       'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
