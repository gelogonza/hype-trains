import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Each app in the monorepo gets its own fixed dev port (see the root README's port table),
// and a configurable base path so `npm run build:site` can host every app under one domain.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5101, strictPort: true },
  preview: { port: 4101, strictPort: true },
})
