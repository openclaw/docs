# Cloudflare Hosting

Internal notes for `https://documentation.openclaw.ai`.

## Target Design

Vincent's design is the desired steady state:

- Cloudflare R2 bucket `openclaw-docs` stores the full generated docs site.
- `documentation.openclaw.ai` is served from R2 through Cloudflare's CDN, not through a Worker on normal page traffic.
- `documentation.openclaw.ai/ask-molty/*` stays on the separate Ask Molty Worker.
- The docs site stays static/CDN-first, with full locale HTML, locale markdown, Pagefind search, and source indexes.

The repo-side pieces are in place:

- `npm run docs:build:r2`
- `scripts/docs-site/r2-prepare.mjs`
- `scripts/docs-site/r2-upload.mjs`
- `.github/workflows/r2-pages.yml`

`r2-prepare.mjs` writes `dist/docs-r2-manifest.json`. The manifest includes each object key, source file, SHA-256, content type, cache policy, and slashless HTML aliases such as:

- `/concepts/models` -> `concepts/models/index.html`
- `/concepts/models.md` -> `concepts/models.md`

`r2-upload.mjs` downloads `.openclaw-docs-r2-manifest.json` from R2, compares hashes and metadata, uploads only changed objects, and then writes the new manifest back. The first upload seeds everything; later uploads should be small.

## Current Production State

Production is still on the safe Worker Static Assets fallback until the Cloudflare account can write R2:

- Worker: `openclaw-docs-router`
- Route: `documentation.openclaw.ai/*`
- Static assets binding: `env.ASSETS`
- Header: `X-OpenClaw-Docs-Origin: cloudflare-static-assets`
- Cache-Control follows the same policy as the R2 manifest.

The fallback uses two cache mechanisms:

- `workers/docs-router.ts` sets headers for slashless docs pages and `Accept: text/markdown` responses because those paths run through Worker code.
- `scripts/docs-site/cloudflare-prune.mjs` writes `dist/docs-site/_headers` so direct asset-first paths like `/assets/docs-site.css`, `/concepts/models.md`, and `/llms-full.txt` get the same cache policy without forcing all traffic through Worker code.

The fallback exists because the Services@openclaw.org Cloudflare token currently cannot access R2. Local verification against account `91b59577e757131d68d55a471fe32aca` fails before bucket operations with Cloudflare API auth error `10000`.

Do not remove the Worker route or switch `.github/workflows/pages.yml` to R2-only until R2 access is fixed and the R2 workflow has completed successfully.

## Required Cloudflare Access

Cloudflare account:

- account: `Services@openclaw.org`
- account id: `91b59577e757131d68d55a471fe32aca`
- zone: `openclaw.ai`

Required token scopes:

- `Account: R2 Storage: Edit`
- `Zone: DNS: Edit`
- `Zone: Cache Rules: Edit` or `Zone: Rulesets: Edit`
- `Zone: Zone Settings: Edit`
- `Zone: Read`

R2 must be enabled for the account before bucket creation works.

## Deploy Flow

The production fallback workflow remains:

1. `.github/workflows/pages.yml`
2. `npm run docs:build:cloudflare`
3. `npm run docs:smoke`
4. `npx wrangler@4.88.0 deploy --config wrangler.toml`
5. `docs-live-smoke.yml`

The R2 target workflow is manual until access is fixed:

1. `.github/workflows/r2-pages.yml`
2. `npm run docs:build:r2`
3. `npm run docs:smoke`
4. `npm run docs:r2:upload`

Local R2 build:

```sh
npm run docs:build:r2
```

Local R2 upload after access is fixed:

```sh
source ~/.profile
CLOUDFLARE_ACCOUNT_ID=91b59577e757131d68d55a471fe32aca \
CLOUDFLARE_R2_BUCKET=openclaw-docs \
CLOUDFLARE_API_TOKEN="$CRABBOX_CLOUDFLARE_API_TOKEN" \
npm run docs:r2:upload
```

## URL Behavior

The generated R2 manifest uploads both canonical files and slashless aliases:

- `/concepts/models` serves HTML from object key `concepts/models`.
- `/concepts/models.md` serves markdown from object key `concepts/models.md`.
- `/docs/platforms/digitalocean` serves the compatibility redirect HTML.

Plain R2 custom domains cannot do `Accept: text/markdown` negotiation by themselves. To keep the request path Worker-free, prefer explicit `.md` URLs. If `Accept: text/markdown` must stay, add a tiny Worker in front of only that behavior or keep the current router.

Root `/` may need a Cloudflare URL rewrite to `/index.html`, depending on R2 custom-domain behavior at cutover time. Test it before removing the fallback Worker.

## Cache Policy

`r2-prepare.mjs` assigns per-object `Cache-Control`:

- hashed/static assets: `public, max-age=31536000, immutable`
- HTML and slashless HTML aliases: `public, max-age=60, s-maxage=86400, stale-while-revalidate=604800`
- markdown, JSON, JSONL, and text indexes: `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`
- upload manifest: `private, max-age=0, no-store`

Recommended Cloudflare cache rules:

1. Cache static assets and Pagefind files for one year.
2. Cache HTML at the edge for one day with short browser TTL.
3. Cache `.md`, `.txt`, `.json`, and `.jsonl` for one hour at the edge.
4. Bypass cache for `/ask-molty/*`.

After cutover, verify repeated requests show `cf-cache-status: MISS` then `HIT`.

## Cutover Checklist

1. Enable R2 on the Services@openclaw.org account.
2. Fix the GitHub `CLOUDFLARE_API_TOKEN` scopes listed above.
3. Create the bucket:

   ```sh
   source ~/.profile
   CLOUDFLARE_ACCOUNT_ID=91b59577e757131d68d55a471fe32aca \
   CLOUDFLARE_API_TOKEN="$CRABBOX_CLOUDFLARE_API_TOKEN" \
   npx wrangler@4.88.0 r2 bucket create openclaw-docs
   ```

4. Run the manual `R2 Pages` workflow, or run the local upload command above.
5. Attach the R2 custom domain for `documentation.openclaw.ai`.
6. Add or verify Cloudflare rules:
   - `/` rewrites to `/index.html` if needed.
   - non-root trailing-slash docs paths redirect to slashless paths.
   - cache rules match the policy above.
   - `/ask-molty/*` remains routed to `openclaw-docs-chat-proxy`.
7. Remove the `documentation.openclaw.ai/*` route from `openclaw-docs-router`.
8. Purge Cloudflare cache.
9. Live-test the URLs below.

## Live Smoke

Use these after every deploy:

```sh
curl -I https://documentation.openclaw.ai/
curl -I https://documentation.openclaw.ai/start/getting-started
curl -I https://documentation.openclaw.ai/concepts/models
curl -I https://documentation.openclaw.ai/concepts/models.md
curl -I https://documentation.openclaw.ai/docs/platforms/digitalocean
curl -I https://documentation.openclaw.ai/llms-full.txt
curl -I https://documentation.openclaw.ai/assets/docs-site.css
curl -i https://documentation.openclaw.ai/ask-molty/api/session
```

Expected after R2 cutover:

- slashless HTML paths return `200`.
- `.md` paths return `text/markdown`.
- static assets become `cf-cache-status: HIT` on repeat requests.
- `/ask-molty/api/session` returns `401` when logged out.
- no `X-OpenClaw-Docs-Origin: cloudflare-static-assets` header on normal docs pages.

Expected before R2 cutover:

- the same URLs work through the Worker Static Assets fallback.
- docs responses include `X-OpenClaw-Docs-Origin: cloudflare-static-assets`.
- repeated requests should show Cloudflare `cf-cache-status: HIT`.

## Rollback

If R2 cutover misbehaves:

1. Re-add the `documentation.openclaw.ai/*` route to `openclaw-docs-router`.
2. Re-run `.github/workflows/pages.yml` or deploy locally:

   ```sh
   source ~/.profile
   CLOUDFLARE_API_TOKEN="$CRABBOX_CLOUDFLARE_API_TOKEN" npx wrangler@4.88.0 deploy --config wrangler.toml
   ```

3. Purge Cloudflare cache.
4. Re-run the live smoke.
