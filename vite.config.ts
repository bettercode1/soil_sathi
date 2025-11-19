import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  
  // Optimize esbuild for faster builds
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: mode === 'production' ? 'none' : 'inline',
  },

  // Optimize dependency pre-bundling for faster dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'recharts',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
    ],
    exclude: ['lovable-tagger', '@google/genai'], // Exclude @google/genai (backend only) and let Vite auto-detect Firebase
    esbuildOptions: {
      target: 'es2020',
    },
  },

  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild', // Faster than terser
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    reportCompressedSize: false, // Faster builds
    
    // Chunk splitting for better caching and faster loads
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts'],
          'firebase-vendor': ['firebase'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure Firebase modules resolve correctly
    dedupe: ['firebase'],
  },

  // Reduce logging overhead for faster dev server
  logLevel: 'warn',
}));
