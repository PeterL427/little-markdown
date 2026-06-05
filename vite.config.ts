import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // Deployed under the GitHub Pages project subpath
  // (https://<user>.github.io/little-markdown/). This also affects dev/preview,
  // so locally the app is served at /little-markdown/ too.
  base: '/little-markdown/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split the heavy syntax-highlighter (Prism/refractor) into its own
        // chunk so neither bundle trips the 500 kB warning and it caches apart
        // from app code.
        manualChunks: {
          highlighter: ['react-syntax-highlighter'],
        },
      },
    },
  },
});
