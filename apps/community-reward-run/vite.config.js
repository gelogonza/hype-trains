import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5104, strictPort: true },
  preview: { port: 4104, strictPort: true },
})
