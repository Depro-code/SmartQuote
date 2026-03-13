import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-tools';
          }

          if (id.includes('recharts')) {
            return 'charts';
          }

          if (
            id.includes('@radix-ui') ||
            id.includes('cmdk') ||
            id.includes('embla-carousel-react') ||
            id.includes('vaul')
          ) {
            return 'ui-vendor';
          }

          if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('sonner')) {
            return 'app-vendor';
          }

          return 'vendor';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
