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

`r2-upload.mjs` downloads `.openclaw-docs-r2-manifest.json` from R2, compares hashes and metadata, uploads only changed objects through the R2 S3 API, and then writes the new manifest back. The first upload seeds everything; later uploads should be small.

## Current Production State

Production is cut over to R2-backed storage with a small Worker router in front:

- Worker: `openclaw-docs-router`
- Route: `documentation.openclaw.ai/*`
- Router storage: signed R2 S3 reads from bucket `openclaw-docs`
- Header: `X-OpenClaw-Docs-Origin: cloudflare-r2`
- Cache-Control follows the same policy as the R2 manifest.

Why a Worker still exists:

- R2 object storage does not serve `/` as `/index.html` without router logic.
- R2 object storage does not redirect non-root trailing slash docs paths to slashless paths.
- R2 object storage cannot negotiate markdown from `Accept: text/markdown` without router logic.
- The available Cloudflare auth can manage R2, DNS, custom domains, and Worker routes, but not zone Rulesets/Page Rules. Dashboard-session replay via `mcporter chrome-devtools` also returned Cloudflare API auth error `10000` for `/rulesets`.

The pure Vincent target remains possible after a Cloudflare token/session with `Zone: Rulesets: Edit` is available. Until then, the Worker is the compatibility layer and R2 is the storage/source of truth.

The old Worker Static Assets build remains the rollback path in git history.

## Required Cloudflare Access

Cloudflare account:

- account: `Services@openclaw.org`
- account id: stored in the private `CLOUDFLARE_ACCOUNT_ID` secret/local environment variable
- zone: `openclaw.ai`

Required Cloudflare API token scopes for bucket/domain/DNS setup:

- `Account: R2 Storage: Edit`
- `Zone: DNS: Edit`
- `Zone: Cache Rules: Edit` or `Zone: Rulesets: Edit`
- `Zone: Zone Settings: Edit`
- `Zone: Read`

R2 must be enabled for the account before bucket creation works.

Required R2 S3 upload credentials:

- `CLOUDFLARE_ACCOUNT_ID`
- `OPENCLAW_R2_ACCESS_KEY_ID`
- `OPENCLAW_R2_SECRET_ACCESS_KEY`

The Worker router uses the same private account id value through the `OPENCLAW_R2_ACCOUNT_ID` Worker secret. The Pages workflow writes the R2 credentials to Worker secrets before deployment, so the Worker deploy token does not need `Account: R2 Storage: Read`. Do not commit the account id or credentials to this repository.

For Cloudflare R2 API tokens, the access key id is the account-token id returned by:

```sh
curl -H "Authorization: Bearer $OPENCLAW_CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$OPENCLAW_CLOUDFLARE_ACCOUNT_ID/tokens/verify"
```

The secret access key is the SHA-256 hex digest of the R2 token value. These are stored locally in `~/.profile` and should be added to GitHub Actions secrets before enabling the R2 workflow in CI.

## Deploy Flow

Production docs object deploy:

1. `.github/workflows/r2-pages.yml`
2. `npm run docs:build:r2`
3. `npm run docs:smoke`
4. `npm run docs:r2:upload`

Production router deploy:

1. `.github/workflows/pages.yml`
2. `npx wrangler@4.88.0 deploy --config wrangler.toml`
3. `docs-live-smoke.yml`

Local R2 build:

```sh
npm run docs:build:r2
```

Local R2 upload:

```sh
source ~/.profile
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
CLOUDFLARE_R2_BUCKET=openclaw-docs \
OPENCLAW_R2_ACCESS_KEY_ID="$OPENCLAW_R2_ACCESS_KEY_ID" \
OPENCLAW_R2_SECRET_ACCESS_KEY="$OPENCLAW_R2_SECRET_ACCESS_KEY" \
R2_UPLOAD_CONCURRENCY=64 \
npm run docs:r2:upload
```

## URL Behavior

The generated R2 manifest uploads both canonical files and slashless aliases:

- `/concepts/models` serves HTML from object key `concepts/models`.
- `/concepts/models.md` serves markdown from object key `concepts/models.md`.
- `/docs/platforms/digitalocean` serves the compatibility redirect HTML.

The Worker router preserves `Accept: text/markdown` negotiation and root `/` behavior while reading objects from R2 with signed S3 requests. Pure R2 custom-domain serving still needs Cloudflare URL rewrite/redirect rules.

## Cache Policy

`r2-prepare.mjs` assigns per-object `Cache-Control`:

- hashed/static assets: `public, max-age=31536000, immutable`
- HTML and slashless HTML aliases: `public, max-age=60, s-maxage=86400, stale-while-revalidate=604800`
- markdown, JSON, JSONL, and text indexes: `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`
- upload manifest: `private, max-age=0, no-store`

The Worker router splits browser and edge cache headers so cached HTML does not become stale in users' browsers:

- HTML and slashless HTML aliases:
  - `Cache-Control: public, max-age=60, stale-while-revalidate=60`
  - `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
- markdown, JSON, JSONL, and text indexes:
  - `Cache-Control: public, max-age=300, stale-while-revalidate=300`
  - `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- hashed/static assets:
  - `Cache-Control: public, max-age=31536000, immutable`

The Worker also uses `caches.default` for production router responses. Recommended Cloudflare cache rules for the later pure-R2 path:

1. Cache static assets and Pagefind files for one year.
2. Cache HTML at the edge for one day with short browser TTL.
3. Cache `.md`, `.txt`, `.json`, and `.jsonl` for one hour at the edge.
4. Bypass cache for `/ask-molty/*`.

After router deploy, verify repeated requests show `X-OpenClaw-Docs-Cache: MISS` then `HIT`. After pure-R2 ruleset cutover, verify repeated requests show `cf-cache-status: MISS` then `HIT`.

## Cutover Checklist

1. Confirm R2 is enabled on the Services@openclaw.org account.
2. Confirm the GitHub R2 upload secrets are present:
   - `OPENCLAW_R2_ACCESS_KEY_ID`
   - `OPENCLAW_R2_SECRET_ACCESS_KEY`
3. Confirm the bucket exists:

   ```sh
   source ~/.profile
   CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
   CLOUDFLARE_API_TOKEN="$OPENCLAW_CLOUDFLARE_API_TOKEN" \
   npx wrangler@4.88.0 r2 bucket list
   ```

4. Run the manual `R2 Pages` workflow, or run the local upload command above.
5. Deploy `openclaw-docs-router`; the Pages workflow syncs the R2 S3 credentials into Worker secrets before deploy.
6. Live-test the URLs below.

Pure R2 follow-up, blocked on `Zone: Rulesets: Edit`:

1. Add or verify Cloudflare rules:
   - `/` rewrites to `/index.html` if needed.
   - non-root trailing-slash docs paths redirect to slashless paths.
   - cache rules match the policy above.
   - `/ask-molty/*` remains routed to `openclaw-docs-chat-proxy`.
2. Remove the `documentation.openclaw.ai/*` route from `openclaw-docs-router`.
3. Purge Cloudflare cache.
4. Live-test the URLs below.

## Live Smoke

Use these after every deploy:

```sh
curl -I https://documentation.openclaw.ai/
curl -I https://documentation.openclaw.ai/start/getting-started
curl -I https://documentation.openclaw.ai/concepts/models
curl -I https://documentation.openclaw.ai/concepts/models.md
curl -I https://documentation.openclaw.ai/docs/platforms/digitalocean
curl -I https://documentation.openclaw.ai/llms.txt
curl -I https://documentation.openclaw.ai/.well-known/llms.txt
curl -I https://documentation.openclaw.ai/robots.txt
curl -I https://documentation.openclaw.ai/sitemap.xml
curl -I https://documentation.openclaw.ai/llms-full.txt
curl -I https://documentation.openclaw.ai/.well-known/llms-full.txt
curl -I https://documentation.openclaw.ai/assets/docs-site.css
curl -i https://documentation.openclaw.ai/ask-molty/api/session
```

Expected after R2 cutover:

- slashless HTML paths return `200`.
- `.md` paths return `text/markdown`.
- `/llms.txt` and `/.well-known/llms.txt` return the lightweight docs index.
- `/robots.txt` returns `200 text/plain`.
- `/sitemap.xml` returns `200 application/xml` with mutable cache headers, not `immutable`.
- `/llms-full.txt` and `/.well-known/llms-full.txt` return `200 text/plain` after the scheduled `LLMs Full Corpus` workflow has uploaded the nightly corpus.
- docs responses include `X-OpenClaw-Docs-Origin: cloudflare-r2`.
- repeated router requests become `X-OpenClaw-Docs-Cache: HIT`.
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
