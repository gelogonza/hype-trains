import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5103, strictPort: true },
  preview: { port: 4103, strictPort: true },
})
