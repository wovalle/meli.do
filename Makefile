.DEFAULT_GOAL := help

help:  ## list available targets
	@grep -E '^[a-zA-Z_:\\-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/\\//g' | awk 'BEGIN{FS=":[^:]*## "}{printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

setup:  ## install deps + generate worker types + apply local D1 migrations + seed sample data
	npm install --ignore-scripts
	npx wrangler types
	$(MAKE) db:migrate:local
	$(MAKE) db:seed:local

dev:  ## astro dev (Cloudflare Workers runtime, local D1 + local R2)
	npm run dev

build:  ## astro build
	npm run build

preview:  ## astro preview (built worker locally)
	npm run preview

deploy:  ## astro build + wrangler deploy (production)
	npm run deploy

check:  ## astro check (typecheck .astro files)
	npm run check

# ─── DB (D1 + Drizzle) ──────────────────────────────────────────────────────
# Decision tree:
#   First time / fresh checkout              → make setup (calls db:migrate:local)
#   Edited src/db/schema.ts                  → make db:generate then db:migrate:local
#   New migration file from teammate         → make db:migrate:local
#   Push schema to production                → make db:migrate:remote

db\:generate:  ## drizzle-kit generate — produce a new migration from src/db/schema.ts
	npm run db:generate

db\:migrate\:local:  ## wrangler d1 migrations apply --local (run after schema changes or fresh checkout)
	npm run db:migrate:local

db\:migrate\:remote:  ## wrangler d1 migrations apply --remote (production D1)
	npm run db:migrate:remote

db\:seed\:local:  ## load 4 sample case studies from scripts/seed-local.sql into local D1
	npm run db:seed:local

# ─── Imports ────────────────────────────────────────────────────────────────
# Both scripts upload to the *remote* R2 + D1 by design (one-shot import jobs).
# Use the :dry variants first to preview without writing.

import\:wix:  ## import Wix portfolio → remote D1 + R2 (real run)
	npm run import:wix

import\:wix\:dry:  ## dry-run the Wix import (no DB / R2 writes)
	npm run import:wix:dry

import\:behance:  ## import Behance portfolio → remote D1 + R2 (real run)
	npm run import:behance

import\:behance\:dry:  ## dry-run the Behance import
	npm run import:behance:dry

# ─── Access ─────────────────────────────────────────────────────────────────

access:  ## provision Cloudflare Access (needs CF_API_TOKEN, CF_ACCOUNT_ID, ACCESS_EMAILS, MELIDO_DOMAIN)
	npm run setup:access

.PHONY: help setup dev build preview deploy check \
	db\:generate db\:migrate\:local db\:migrate\:remote db\:seed\:local \
	import\:wix import\:wix\:dry import\:behance import\:behance\:dry \
	access
