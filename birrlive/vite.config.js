import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunking to split large chunks into smaller ones
        manualChunks: {
          vendor: ['react', 'react-dom'], // Example: Split React into a separate chunk
          // Add other manual chunks as needed
        },
      },
    },
    // Increase the chunk size warning limit if needed
    chunkSizeWarningLimit: 5000, // Set to 1000 kB, adjust as necessary
  },
});