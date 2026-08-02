import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// port différent de host-app (5173) pour pouvoir lancer les deux en même
// temps pendant le dev. Le proxy évite les soucis CORS avec le serveur.
export default defineConfig({
  base: '/play/',
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/quiz-media': 'http://localhost:3000',
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