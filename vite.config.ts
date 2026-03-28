import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true
  },
  build: {
    assetsInlineLimit: 0,
    outDir: 'dist'
  }
})
