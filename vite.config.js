import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Pre-bundle heavy Three.js dependencies for faster dev startup
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'framer-motion',
      'framer-motion-3d',
    ],
  },

  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Chunk splitting: separate Three.js from app code
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three-core';
          if (id.includes('node_modules/@react-three/')) return 'r3f';
          if (id.includes('node_modules/framer-motion')) return 'motion';
        },
      },
    },

    // Increase chunk size warning limit for 3D assets
    chunkSizeWarningLimit: 800,
  },
})
