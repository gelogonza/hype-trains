import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5105, strictPort: true },
  preview: { port: 4105, strictPort: true },
});
