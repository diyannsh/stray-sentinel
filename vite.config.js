import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Optimize for multi-page routing during the build process
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // Landing Page (Phase 2)
        citizen: resolve(__dirname, 'citizen.html'), // Citizen Portal (Phase 3)
        contractor: resolve(__dirname, 'contractor.html'), // Contractor Dashboard (Phase 4)
      }
    }
  },
  server: {
    port: 3000,
    open: true, // Automatically open in browser to save time
  }
});