import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import the path module

// You MUST have 'export default' here
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This maps "src" to the actual physical directory
      'src': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // This redirects frontend calls to your Express server
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // This removes "/api" from the start of the URL
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            // This prevents the error from crashing the proxy process
            // and keeps your terminal cleaner.
            if ("code" in err && err.code === 'ECONNREFUSED') {
              console.warn('⚠️ Backend unreachable, retrying via client backoff...');
            }
          });
        },
      },
      '/ws': {
        target: 'ws://localhost:8000',
        changeOrigin: true,
        // This removes "/api" from the start of the URL
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  }
});