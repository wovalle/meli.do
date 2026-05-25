import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mellen.do',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      experimentalRemoteBindings: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
