import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on Cloudflare Pages, Netlify or GitHub Pages sub-paths.
  base: './',
  build: { target: 'es2020' },
});
