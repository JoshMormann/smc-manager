import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Temporarily disabled Sentry plugin for debugging
    // sentryVitePlugin({
    //   org: 'sref-manager',
    //   project: 'sref-manager-frontend',
    //   authToken: process.env.SENTRY_AUTH_TOKEN,
    // }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
});
