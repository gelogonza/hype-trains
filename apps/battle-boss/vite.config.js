import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5102, strictPort: true },
  preview: { port: 4102, strictPort: true },
})
