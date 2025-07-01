import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false, // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mathjs: ['mathjs'],
          echarts: ['echarts', 'echarts-for-react']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 