import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend proxy: /data -> data server (:4000), /inference -> inference server (:4100).
const DATA = process.env.DATA_URL ?? 'http://127.0.0.1:4000';
const INFERENCE = process.env.INFERENCE_URL ?? 'http://127.0.0.1:4100';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/data': { target: DATA, changeOrigin: true, rewrite: p => p.replace(/^\/data/, '') },
      '/inference': { target: INFERENCE, changeOrigin: true, rewrite: p => p.replace(/^\/inference/, '') },
    },
  },
});
