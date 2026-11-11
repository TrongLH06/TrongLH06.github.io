import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (
            id.includes('audius_vietnam_full') ||
            id.includes('vietnamese_artists_catalog') ||
            id.includes('spotify_avatars')
          ) {
            return 'music-catalog';
          }
        }
      }
    }
  }
});
