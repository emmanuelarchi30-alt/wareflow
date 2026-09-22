import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('react-three') || id.includes('@react-three') || id.includes('three-stdlib')) return 'three';
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor';
          if (id.includes('node_modules/@supabase/')) return 'supabase';
          if (id.includes('node_modules/react-router')) return 'router';
        },
      },
    },
  },
});