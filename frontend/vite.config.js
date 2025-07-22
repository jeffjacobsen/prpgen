import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 1420, // Tauri default port
        strictPort: true,
    },
    base: './',
    build: {
        // Ensure assets are copied and paths are relative
        assetsDir: 'assets',
        // Copy public files to dist
        copyPublicDir: true
    },
    // Tauri expects to find the app on localhost during development
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
});
