import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Fixed per-app ports keep everyone's dev servers from colliding.
// BASE_PATH lets `npm run build:site` host every app under one domain.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: { port: __PORT__, strictPort: true },
  preview: { port: __PREVIEW_PORT__, strictPort: true },
})
