# Cloudflare Hosting

Internal notes for `https://documentation.openclaw.ai`.

## Current Setup

- `documentation.openclaw.ai/*` is served by the Cloudflare Worker `openclaw-docs-router`.
- The Worker is deployed from this repo with `wrangler.toml`.
- Static files come from Workers Static Assets, bound as `env.ASSETS`.
- The Worker route is:
  - zone: `openclaw.ai`
  - account: `Services@openclaw.org`
  - account id: `91b59577e757131d68d55a471fe32aca`
- DNS still has a proxied `CNAME` for `documentation.openclaw.ai` pointing at `openclaw.github.io`, but that is only a proxied placeholder. The Worker route handles traffic first.
- `docs.openclaw.ai` still points at Mintlify.

Source files:

- `wrangler.toml`
- `workers/docs-router.ts`
- `.github/workflows/pages.yml`
- `scripts/docs-site/cloudflare-prune.mjs`

Ops note lives in `~/Projects/manager/DNS.md`.

## Deploy Flow

`.github/workflows/pages.yml` runs on `main` pushes that touch docs/build files.

The workflow:

1. Checks out this repo.
2. Reads `.openclaw-sync/source.json`.
3. Checks out the matching `openclaw/openclaw` source commit.
4. Runs `npm ci`.
5. Installs `librsvg2-bin` for OG image rendering.
6. Runs `npm run docs:build:cloudflare`.
7. Runs `npm run docs:smoke`.
8. Runs `npx wrangler@4.88.0 deploy --config wrangler.toml`.
9. Dispatches `docs-live-smoke.yml`.

Required GitHub secret:

- `CLOUDFLARE_API_TOKEN`: Services@openclaw.org Cloudflare token with Worker deploy and route permissions.

## Runtime Behavior

`workers/docs-router.ts` handles:

- HTTP to HTTPS redirect.
- Slashless docs URLs:
  - `/concepts/models` serves `/concepts/models/index.html`.
  - `/concepts/models/` redirects to `/concepts/models`.
- Markdown URLs:
  - `/concepts/models.md` serves markdown.
  - `Accept: text/markdown` on `/concepts/models` serves `/concepts/models.md`.
- Static asset serving from the `ASSETS` binding.

The router sets:

- `X-OpenClaw-Docs-Origin: cloudflare-static-assets`

Use that header to verify traffic is no longer coming from GitHub Pages.

Ask Molty is separate:

- `documentation.openclaw.ai/ask-molty/*` routes to Worker `openclaw-docs-chat-proxy`.
- That Worker is managed from `~/Projects/manager`.
- It should continue to take precedence over the docs static route.

## Cloudflare Limits

Cloudflare Workers Static Assets currently limits asset files per Worker version:

- Free: `20,000`
- Paid: `100,000`

Individual static asset file size limit:

- `25 MiB`

Official docs:

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/

The unpruned docs build exceeded the Free limit:

- `36,872` asset manifest files
- deploy error: `Invalid manifest: manifest contains 36,872 files which exceeds the limit of 20,000`

After pruning, the deploy fit:

- `13,834` asset manifest files

## Pruning

`npm run docs:build:cloudflare` runs the normal docs build and then `scripts/docs-site/cloudflare-prune.mjs`.

The prune step keeps:

- all English HTML pages
- all localized HTML pages
- English `.md` endpoints
- static assets
- generated source indexes

The prune step removes:

- localized `.md` duplicates, such as `/it/channels.md`
- stale/junk files such as `.DS_Store`

The prune step also rebuilds Pagefind from canonical English HTML pages only.

User-visible tradeoff:

- Localized docs pages still work.
- English markdown endpoints still work.
- `Accept: text/markdown` works for English docs.
- Localized markdown endpoints such as `/it/channels.md` return `404`.
- Search is currently English-only after pruning.

This is intentional while the Cloudflare account is on the Free static asset file limit.

## If Cloudflare Is Upgraded

If Services@openclaw.org gets Workers Paid or another limit increase:

1. Remove or relax `scripts/docs-site/cloudflare-prune.mjs`.
2. Change `.github/workflows/pages.yml` back to `npm run docs:build` if no deploy pruning is needed.
3. Keep `workers/docs-router.ts` and `wrangler.toml`; they are still the right hosting model.
4. Re-run `npm run docs:build`.
5. Check file count:

   ```sh
   find dist/docs-site -type f | wc -l
   ```

6. Deploy:

   ```sh
   source ~/.profile
   CLOUDFLARE_API_TOKEN="$CRABBOX_CLOUDFLARE_API_TOKEN" npx wrangler deploy --config wrangler.toml
   ```

7. Live-test:

   ```sh
   curl -I https://documentation.openclaw.ai/concepts/models
   curl -I https://documentation.openclaw.ai/concepts/models/
   curl -I https://documentation.openclaw.ai/concepts/models.md
   curl -I -H 'Accept: text/markdown' https://documentation.openclaw.ai/concepts/models
   curl -I https://documentation.openclaw.ai/it/channels
   curl -I https://documentation.openclaw.ai/pagefind/pagefind.js
   curl -i https://documentation.openclaw.ai/ask-molty/api/session
   ```

Expected highlights:

- `/concepts/models`: `200`, `text/html`, `X-OpenClaw-Docs-Origin: cloudflare-static-assets`
- `/concepts/models/`: `308` to `/concepts/models`
- `/concepts/models.md`: `200`, markdown
- `Accept: text/markdown`: `200`, `text/markdown`, `Vary: Accept`
- `/ask-molty/api/session`: `401` when logged out

## Why Not Cloudflare Pages

Cloudflare Pages project creation/listing was blocked by the available Services@openclaw.org token.

Workers Static Assets was deployable with the existing token and gives us the router behavior we need:

- slashless canonical URLs
- markdown negotiation
- same hostname with Ask Molty Worker route
- static asset hosting without GitHub Pages as origin

If we later switch to Cloudflare Pages, keep a Worker in front or use Pages Functions for the markdown negotiation. A plain static Pages project would lose `.md` and `Accept: text/markdown` behavior.
