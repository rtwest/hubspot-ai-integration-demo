import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/functions/v1')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 