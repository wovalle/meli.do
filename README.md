# meli.do

Portfolio CMS for Melissa Encarnacion (Art Director). Astro 6 + Cloudflare (Workers + D1 + R2 + Access).

Status: **Phase 1 — Kickstart** (scaffold only; CRUD lands in P2).

## Stack

- **Astro 6** with `@astrojs/cloudflare` adapter, `output: 'server'`
- **D1** for case studies + blocks (Drizzle ORM, SQL migrations in `drizzle/`)
- **R2** for images (binding `IMAGES`)
- **Cloudflare Access** gates `/admin/*` + `/api/*` (group `meli-admins`)
- **Cloudflare Workers Builds** auto-deploys on push to `main`

## Project layout

```
src/
  pages/
    index.astro                  # public placeholder (prerendered)
    admin/index.astro            # behind Access
    legacy/picker/index.astro    # variation picker (prerendered)
  middleware.ts                  # Access JWT verify
  db/schema.ts                   # Drizzle schema
  env.d.ts                       # Locals type extension
public/
  legacy/
    variations/*.html            # 6 design HTMLs (raw)
    previews/*.png               # screenshots
drizzle/                         # generated SQL migrations
scripts/setup-access.mjs         # Access app + group provisioner
legacy/research/                 # CMS evaluation screenshots
astro.config.mjs
wrangler.jsonc
drizzle.config.ts
```

## Local dev

Requires Node 22+ (Astro 6).

```sh
npm install
npm run dev                      # http://localhost:4321
```

Middleware skips Access in dev (`import.meta.env.DEV`).

## One-time Cloudflare setup

```sh
npx wrangler login

# D1
npx wrangler d1 create meli-do-db
# → copy database_id into wrangler.jsonc → d1_databases[0].database_id

# R2
npx wrangler r2 bucket create meli-do-images

# Apply schema
npm run db:migrate:remote        # or :local for local dev
```

### Cloudflare Access

`scripts/setup-access.mjs` provisions the Access app + `meli-admins` group.

```sh
export CF_API_TOKEN=...          # scopes: Access:Edit, Workers:Edit, D1:Edit, R2:Edit
export CF_ACCOUNT_ID=d5705803ba3e46be8c7b0566e47ff7d6
export ACCESS_EMAILS=hey@willy.im,melissa@example.com
export MELIDO_DOMAIN=meli-do.<your-subdomain>.workers.dev
npm run setup:access
```

If Zero Trust is not yet enabled on the account, the script exits and prints the dashboard click-path. Bootstrap once at <https://one.dash.cloudflare.com/>, then re-run.

The script prints `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` to set as worker secrets:

```sh
npx wrangler secret put ACCESS_TEAM_DOMAIN
npx wrangler secret put ACCESS_AUD
```

### Deploy hook (used in P2)

```sh
# In CF dashboard → Workers Builds → Settings → Deploy Hooks → create
npx wrangler secret put DEPLOY_HOOK_URL
```

## Deploy

```sh
npm run deploy                   # astro build && wrangler deploy
```

Or push to `main` — Workers Builds runs `npm run build` and deploys.

## Verifying P1

- [ ] `npm run dev` → `/`, `/legacy/picker/`, `/legacy/variations/*.html` all work.
- [ ] `npx wrangler d1 execute meli-do-db --remote --command "select name from sqlite_master where type='table'"` shows `case_studies` + `blocks`.
- [ ] `npx wrangler r2 bucket list` shows `meli-do-images`.
- [ ] `npm run setup:access` is idempotent.
- [ ] Deployed `/admin` returns Access challenge for unauthed; allowed user reaches placeholder.
