// vite.config.ts
import { defineConfig } from "file:///C:/Users/HP/OneDrive/Desktop/Soil_Sathi/soil_sathi/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/HP/OneDrive/Desktop/Soil_Sathi/soil_sathi/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/HP/OneDrive/Desktop/Soil_Sathi/soil_sathi/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\HP\\OneDrive\\Desktop\\Soil_Sathi\\soil_sathi";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path2) => path2.replace(/^\/api/, "/api"),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Proxying:", req.method, req.url);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  // Optimize esbuild for faster builds
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: mode === "production" ? "none" : "inline"
  },
  // Optimize dependency pre-bundling for faster dev server
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "lucide-react",
      "recharts",
      "zod",
      "react-hook-form",
      "@hookform/resolvers",
      "firebase/app",
      "firebase/firestore",
      "firebase/storage",
      "firebase/analytics"
    ],
    exclude: ["lovable-tagger", "@google/genai"],
    // Exclude @google/genai (backend only)
    esbuildOptions: {
      target: "es2020"
    }
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    // Faster than terser
    cssCodeSplit: true,
    sourcemap: mode === "development",
    reportCompressedSize: false,
    // Faster builds
    // Chunk splitting for better caching and faster loads
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip"
          ],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "chart-vendor": ["recharts"]
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      },
      // Configure plugins to handle Firebase correctly
      plugins: []
    },
    commonjsOptions: {
      // Don't transform Firebase modules - they're ESM-only
      exclude: [/firebase/],
      // Ensure Firebase is not processed by commonjs plugin
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1e3
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    // Ensure Firebase modules resolve correctly
    dedupe: ["firebase"],
    // Force ESM resolution for Firebase
    mainFields: ["module", "jsnext:main", "jsnext"]
  },
  // Reduce logging overhead for faster dev server
  logLevel: "warn"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFNvaWxfU2F0aGlcXFxcc29pbF9zYXRoaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcSFBcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxTb2lsX1NhdGhpXFxcXHNvaWxfc2F0aGlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0hQL09uZURyaXZlL0Rlc2t0b3AvU29pbF9TYXRoaS9zb2lsX3NhdGhpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIFwiL2FwaVwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCBcIi9hcGlcIiksXHJcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1Byb3h5IGVycm9yOicsIGVycik7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQcm94eWluZzonLCByZXEubWV0aG9kLCByZXEudXJsKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcclxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIFxyXG4gIC8vIE9wdGltaXplIGVzYnVpbGQgZm9yIGZhc3RlciBidWlsZHNcclxuICBlc2J1aWxkOiB7XHJcbiAgICBkcm9wOiBtb2RlID09PSAncHJvZHVjdGlvbicgPyBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSA6IFtdLFxyXG4gICAgbGVnYWxDb21tZW50czogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ25vbmUnIDogJ2lubGluZScsXHJcbiAgfSxcclxuXHJcbiAgLy8gT3B0aW1pemUgZGVwZW5kZW5jeSBwcmUtYnVuZGxpbmcgZm9yIGZhc3RlciBkZXYgc2VydmVyXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxyXG4gICAgICAnbHVjaWRlLXJlYWN0JyxcclxuICAgICAgJ3JlY2hhcnRzJyxcclxuICAgICAgJ3pvZCcsXHJcbiAgICAgICdyZWFjdC1ob29rLWZvcm0nLFxyXG4gICAgICAnQGhvb2tmb3JtL3Jlc29sdmVycycsXHJcbiAgICAgICdmaXJlYmFzZS9hcHAnLFxyXG4gICAgICAnZmlyZWJhc2UvZmlyZXN0b3JlJyxcclxuICAgICAgJ2ZpcmViYXNlL3N0b3JhZ2UnLFxyXG4gICAgICAnZmlyZWJhc2UvYW5hbHl0aWNzJyxcclxuICAgIF0sXHJcbiAgICBleGNsdWRlOiBbJ2xvdmFibGUtdGFnZ2VyJywgJ0Bnb29nbGUvZ2VuYWknXSwgLy8gRXhjbHVkZSBAZ29vZ2xlL2dlbmFpIChiYWNrZW5kIG9ubHkpXHJcbiAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxyXG4gICAgfSxcclxuICB9LFxyXG5cclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcImRpc3QvY2xpZW50XCIsXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgIHRhcmdldDogJ2VzMjAyMCcsXHJcbiAgICBtaW5pZnk6ICdlc2J1aWxkJywgLy8gRmFzdGVyIHRoYW4gdGVyc2VyXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcsXHJcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsIC8vIEZhc3RlciBidWlsZHNcclxuICAgIFxyXG4gICAgLy8gQ2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZyBhbmQgZmFzdGVyIGxvYWRzXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICd1aS12ZW5kb3InOiBbXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2cnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWF2YXRhcicsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtbGFiZWwnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXInLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdGFicycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXAnLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgICdmb3JtLXZlbmRvcic6IFsncmVhY3QtaG9vay1mb3JtJywgJ0Bob29rZm9ybS9yZXNvbHZlcnMnLCAnem9kJ10sXHJcbiAgICAgICAgICAnY2hhcnQtdmVuZG9yJzogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW2V4dF0vW25hbWVdLVtoYXNoXS5bZXh0XScsXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIENvbmZpZ3VyZSBwbHVnaW5zIHRvIGhhbmRsZSBGaXJlYmFzZSBjb3JyZWN0bHlcclxuICAgICAgcGx1Z2luczogW10sXHJcbiAgICB9LFxyXG4gICAgY29tbW9uanNPcHRpb25zOiB7XHJcbiAgICAgIC8vIERvbid0IHRyYW5zZm9ybSBGaXJlYmFzZSBtb2R1bGVzIC0gdGhleSdyZSBFU00tb25seVxyXG4gICAgICBleGNsdWRlOiBbL2ZpcmViYXNlL10sXHJcbiAgICAgIC8vIEVuc3VyZSBGaXJlYmFzZSBpcyBub3QgcHJvY2Vzc2VkIGJ5IGNvbW1vbmpzIHBsdWdpblxyXG4gICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgfSxcclxuXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gICAgLy8gRW5zdXJlIEZpcmViYXNlIG1vZHVsZXMgcmVzb2x2ZSBjb3JyZWN0bHlcclxuICAgIGRlZHVwZTogWydmaXJlYmFzZSddLFxyXG4gICAgLy8gRm9yY2UgRVNNIHJlc29sdXRpb24gZm9yIEZpcmViYXNlXHJcbiAgICBtYWluRmllbGRzOiBbJ21vZHVsZScsICdqc25leHQ6bWFpbicsICdqc25leHQnXSxcclxuICB9LFxyXG5cclxuICAvLyBSZWR1Y2UgbG9nZ2luZyBvdmVyaGVhZCBmb3IgZmFzdGVyIGRldiBzZXJ2ZXJcclxuICBsb2dMZXZlbDogJ3dhcm4nLFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1YsU0FBUyxvQkFBb0I7QUFDblgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxF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
