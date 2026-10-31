import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev proxy to the backend: /data -> data server (:4000), /inference -> inference server (:4100).
const DATA = process.env.DATA_URL ?? 'http://127.0.0.1:4000'
const INFERENCE = process.env.INFERENCE_URL ?? 'http://127.0.0.1:4100'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/data': { target: DATA, changeOrigin: true, rewrite: (p) => p.replace(/^\/data/, '') },
      '/inference': { target: INFERENCE, changeOrigin: true, rewrite: (p) => p.replace(/^\/inference/, '') },
    },
  },
})
