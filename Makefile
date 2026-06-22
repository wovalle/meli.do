.DEFAULT_GOAL := help

help:  ## list available targets
	@grep -E '^[a-zA-Z_:\\-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/\\//g' | awk 'BEGIN{FS=":[^:]*## "}{printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

setup:  ## install deps, generate worker types, apply local D1 migrations, seed sample data
	npm install --ignore-scripts
	npx wrangler types
	npm run db:migrate:local
	npm run db:seed:local

dev:  ## run the dev server (Cloudflare Workers runtime, local D1 + remote R2)
	npm run dev

.PHONY: help setup dev
