import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// En dev, host-app tourne sur son propre port (Vite) mais parle au serveur
// (API + WebSocket) sur le port 3000. Le proxy évite les soucis de CORS et
// permet d'utiliser des chemins relatifs (/api/..., socket.io) dans le code.
export default defineConfig({
  base: '/host/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
