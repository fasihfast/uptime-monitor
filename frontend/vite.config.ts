import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // required for Docker to expose the port
    port: 5173,
    proxy: {
      // In local dev, forward /api calls to your Express backend
      // This means you don't need VITE_API_URL at all
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})