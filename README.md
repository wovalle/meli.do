# meli.do

Portfolio site for Melissa Encarnacion (Art Director). Six static HTML variations in `.context/designs/` served via Cloudflare Workers static assets.

## Deploy

```sh
npm install
npx wrangler login         # one-time
npm run deploy             # → https://meli-do.<account>.workers.dev
```

## Dev

```sh
npm run dev                # http://localhost:8787/
```

## Structure

```
.context/designs/          # source HTMLs + screenshots (authoritative)
scripts/sync-public.mjs    # copies source → public/ before build
public/                    # generated, served by Workers (gitignored)
wrangler.jsonc             # CF Workers config (assets-only, no worker script)
```
