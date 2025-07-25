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
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],

          // UI and animation libraries
          'ui-vendor': [
            'framer-motion',
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
          ],

          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/auth-js'],

          // Form and validation
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Other utilities
          'utils-vendor': ['fast-deep-equal', 'sonner'],
        },
      },
    },
  },
});
