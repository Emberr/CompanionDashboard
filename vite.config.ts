import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  define: {
    // Prevent "process is not defined" for libraries that check envs
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Allow imports of 'process' in browser contexts
      process: 'process/browser',
    }
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
}));
