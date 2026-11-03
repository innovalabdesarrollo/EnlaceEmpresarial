import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },
      adapter: adapter(),
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5710,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5710,
    strictPort: true,
  },
});
