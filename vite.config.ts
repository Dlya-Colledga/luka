import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative paths also work for project sites hosted below a GitHub Pages subpath.
  base: './',
});
