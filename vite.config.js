import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:       'dist',
    sourcemap:    false,       // disable in production for security
    minify:       'esbuild',   // fast + small
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor':    ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
