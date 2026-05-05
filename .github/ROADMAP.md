# Roadmap: portfolio CMS on Cloudflare

## Context

Melissa Encarnacion (Art Director, Head of Design at Liquid Digital) needs a portfolio site to replace her Wix setup. Behance-style case studies: title + ordered stack of image blocks (single full-width OR 2-col pair). She edits via `/admin` (Cloudflare Access protected). Public pages render from D1. Images in R2. Custom micro-CMS on Cloudflare free tier, no third-party lock-in.

## Architecture

- **Astro 5.x hybrid** — `output: 'server'` + `@astrojs/cloudflare`. Admin/API routes SSR; public routes `prerender=true` (static assets).
- **Storage**: D1 (case studies + blocks) + R2 (images). KV skipped.
- **Build-time D1 read** for public pages via D1 REST API (`CF_API_TOKEN` secret).
- **Publish pipeline**: admin PATCH → `DEPLOY_HOOK_URL` → CF Workers Builds rebuilds → ~60-90s to live.
- **Auth**: Cloudflare Access on `/admin/*` + `/api/*`, group `meli-admins`. JWT verified in `src/middleware.ts`. Provisioned declaratively via `scripts/setup-access.mjs`.
- **Admin UI**: Astro Actions + plain `<form>` for 80% (meta, publish, delete, create). One vanilla-TS script (`src/scripts/blocks-editor.ts`) with SortableJS for drag-reorder + direct-to-R2 upload. Zero framework.
- **Public UI**: pure Astro, zero JS.
- **Styling**: Tailwind v4 via `@tailwindcss/vite`, palette/fonts ported from `.context/designs/current.html` (y2k-illustrated + postcard).
- **Deploy**: `wrangler deploy` via CF Workers Builds, `main` → production.

Cost: $0/mo within CF + Access free tiers.

## Phases

- [ ] **P1 — Kickstart**: Astro + CF adapter scaffold, D1 + R2 bindings, Drizzle schema (`case_studies`, `blocks`), Access middleware + `scripts/setup-access.mjs`, Deploy Hook secret. Verify: `/admin` gated by Access, D1 tables exist, R2 bucket exists, push-to-deploy works. Legacy picker moved to `/legacy/picker/`.
- [ ] **P2 — Dynamic CRUD + rebuild**: Astro Actions for meta/publish/delete/create. Vanilla-TS blocks editor with SortableJS. Direct-to-R2 presigned upload. Public home + `/work/[slug]` prerender from D1 REST. Publish → Deploy Hook fires → ~90s rebuild.
- [ ] **P3 — Merge winning design**: port `current.html` (Nav/Hero/Marquee/About/WorkGrid/Playlist/Contact/Footer) to Astro components. Work section dynamic from D1. Admin keeps neutral wireframe look.
- [ ] **P4a — Data migration**: `scripts/import-behance.mjs` + `scripts/import-wix.mjs` → R2 + D1 drafts. Melissa curates + publishes via admin.
- [ ] **P4b — UI polish**: lazy-load, prev/next nav, 404 page, a11y (alt text enforced, keyboard nav), toasts, orphan R2 cleanup cron.
- [ ] **P5 — SEO + AI + custom domain**: `meli.do` DNS, sitemap, `robots.txt` (allow GPTBot/ClaudeBot/CCBot/PerplexityBot/Google-Extended), OG/Twitter/JSON-LD, CF Web Analytics, submit to GSC.

## Progress

Each phase = one PR. Comment here when a PR opens/lands. Check the box when merged.

## Source Sites (P4a migration targets)

- **Wix portfolio**: https://melissaencarnacion8.wixsite.com/mellen-portfolio/portfolio (16 projects)
- **Behance**: https://www.behance.net/melissaencaa0c

## Out of scope (v1)

Revision history, scheduled publishing, i18n, contact form submissions, collaborators, image crop controls, AI alt-text.
