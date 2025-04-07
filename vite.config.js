import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Final-Project-Work/', // Set the base path for GitHub Pages
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        destination: 'destination.html',
        favorites: 'favorites.html',
        about: 'about.html',
      }
    }
  }
});
