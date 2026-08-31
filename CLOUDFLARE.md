# Cloudflare Hosting

Internal notes for `https://docs.openclaw.ai`.

## Target Design

Vincent's design is the desired steady state:

- Cloudflare R2 bucket `openclaw-docs` stores the full generated docs site.
- `docs.openclaw.ai` is served from R2 through Cloudflare's CDN, not through a Worker on normal page traffic.
- `docs.openclaw.ai/ask-molty/*` stays on the separate Ask Molty Worker.
- `documentation.openclaw.ai` is legacy and redirects to `docs.openclaw.ai`.
- `docs2.openclaw.ai` is the old Mintlify backup hostname.
- `mintlify.openclaw.ai` redirects to `docs2.openclaw.ai`.
- The docs site stays static/CDN-first, with full locale HTML, locale markdown, Pagefind search, the `/api/search` CLI endpoint, and source indexes.

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
- Routes: `docs.openclaw.ai/*`, `documentation.openclaw.ai/*`
- Router storage: native `DOCS_BUCKET` R2 binding to bucket `openclaw-docs`
- Header: `X-OpenClaw-Docs-Origin: cloudflare-r2`
- The Worker applies the runtime cache policy below over the R2 object's metadata.

Why a Worker still exists:

- R2 object storage does not serve `/` as `/index.html` without router logic.
- R2 object storage does not redirect non-root trailing slash docs paths to slashless paths.
- R2 object storage cannot negotiate markdown from `Accept: text/markdown` without router logic.
- The CLI search endpoint `/api/search` reads `docs-search.json` from R2 and needs Worker logic.
- The available Cloudflare auth can manage R2, DNS, custom domains, and Worker routes, but not zone Rulesets/Page Rules. Dashboard-session replay via `mcporter chrome-devtools` also returned Cloudflare API auth error `10000` for `/rulesets`.

The pure Vincent target remains possible after a Cloudflare token/session with `Zone: Rulesets: Edit` is available. Until then, the Worker is the compatibility layer and R2 is the storage/source of truth.

The old Worker Static Assets build remains the rollback path in git history.

## Required Cloudflare Access

Cloudflare account:

- account: the OpenClaw deployment account
- account id: stored in the private `CLOUDFLARE_ACCOUNT_ID` secret/local environment variable
- zone: `openclaw.ai`

Required Cloudflare API token scopes for bucket/domain/DNS setup:

- `Account: R2 Storage: Edit`
- `Account: Workers Scripts: Edit`
- `Zone: DNS: Edit`
- `Zone: Cache Rules: Edit` or `Zone: Rulesets: Edit`
- `Zone: Zone Settings: Edit`
- `Zone: Read`

R2 must be enabled for the account before bucket creation works.

Required R2 upload credentials:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The Worker router reads through the `DOCS_BUCKET` R2 binding declared in `wrangler.toml`; it does not need R2 S3 secrets. Do not commit the account id or credentials to this repository.

For Cloudflare R2 API tokens, the access key id is the account-token id returned by:

```sh
curl -H "Authorization: Bearer $OPENCLAW_CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify"
```

CI verifies `CLOUDFLARE_API_TOKEN`, tries to mint short-lived R2 credentials, then falls back to the R2 token's direct S3 credential form: the access key id is the token id, and the secret access key is the SHA-256 hex digest of the token value. If the Cloudflare token cannot be verified, CI falls back to `OPENCLAW_R2_ACCESS_KEY_ID` / `OPENCLAW_R2_SECRET_ACCESS_KEY` if those upload credentials are rotated directly.

## Deploy Flow

Production docs object deploy:

1. `.github/workflows/r2-pages.yml`
2. `npm run docs:build:r2`
3. `npm run docs:smoke`
4. `npm run docs:r2:upload`

The global `r2-pages` queue serializes admission, build, and publication. After scope classification and any page/locale content refresh from main, the workflow checks freshness before source checkout, dependency installation, and build. Artifact-relevant stale snapshots yield to an existing successor run or dispatch a full successor when none exists; stale scoped translation dispatches fail so callers retry. Artifact-unaffected drift is admitted. Once admitted, the job publishes that snapshot even if main advances during the build; there is no second freshness veto before upload. Page/locale dispatches retain their selected workflow code and existing partial-upload boundaries, using the refreshed docs and source metadata throughout the build.

After successful R2 publication (or a Worker-only deployment), the same head/successor helper checks main again and dispatches a full successor for artifact-relevant drift with no verified run. This catches changes whose push did not trigger R2, including `GITHUB_TOKEN` and skip-ci pushes during the build. API lookup failure biases to dispatch; dispatch failure fails the job without undoing publication. Catch-up also runs if live-smoke scheduling failed after publication. It never changes the admission verdict or gates the completed upload. This ordering applies to the automatic R2 queue without relying on FIFO ordering; manual Pages router deployment remains operator-owned outside that queue.

Production router deploy:

1. On a main push that changes `workers/**` or `wrangler.toml`, `r2-pages.yml` deploys the matching Worker after any required R2 upload, provided that snapshot passed admission before the build.
2. `pages.yml` pushes validate the Worker bundle with `wrangler deploy --dry-run`; they do not deploy it.
3. Manual `pages.yml` dispatch with `deploy_worker=true` deploys the router using the workflow's pinned Wrangler version. Leave `cutover_docs_hosts=false` for an ordinary router update.
4. Successful deployments dispatch `docs-live-smoke.yml`. Verify the actual upload and Worker deployment steps, not just a green workflow that skipped a stale snapshot. If a docs-only successor uploads the artifact without deploying the changed Worker, use the manual router dispatch.

Local R2 build:

```sh
npm run docs:build:r2
```

Local R2 upload:

```sh
source ~/.profile
OPENCLAW_R2_ACCESS_KEY_ID="$(curl -fsS -H "Authorization: Bearer $OPENCLAW_CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  | node -e 'const fs = require("node:fs"); const data = JSON.parse(fs.readFileSync(0, "utf8")); if (!data.success || !data.result?.id) process.exit(1); process.stdout.write(data.result.id);')"
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
CLOUDFLARE_R2_BUCKET=openclaw-docs \
OPENCLAW_R2_ACCESS_KEY_ID="$OPENCLAW_R2_ACCESS_KEY_ID" \
OPENCLAW_R2_SECRET_ACCESS_KEY="$(printf '%s' "$OPENCLAW_CLOUDFLARE_API_TOKEN" | shasum -a 256 | awk '{print $1}')" \
R2_UPLOAD_CONCURRENCY=64 \
npm run docs:r2:upload
```

## URL Behavior

The generated R2 manifest uploads both canonical files and slashless aliases:

- `/concepts/models` serves HTML from object key `concepts/models`.
- `/concepts/models.md` serves markdown from object key `concepts/models.md`.
- `/docs/platforms/digitalocean` serves the compatibility redirect HTML.

The Worker router preserves `Accept: text/markdown` negotiation and root `/` behavior while reading objects from R2 through the bucket binding. Pure R2 custom-domain serving still needs Cloudflare URL rewrite/redirect rules.

### Markdown for page aliases

Central `docs.json` internal page aliases support explicit `.md` requests and negotiation with `text/markdown`, `text/x-markdown`, or `application/markdown`. After a Markdown object miss, the Worker reads the HTML alias's current R2 metadata and serves the published canonical Markdown object as HTTP `200 text/markdown` in the first response. GET returns the whole exact canonical document, including frontmatter and every section, even when the HTML destination has an anchor. HEAD returns `200` with no body. Both include `Vary: Accept` and no `Location`; a plain `curl -fsS https://docs.openclaw.ai/refactor/database-first.md` receives readable content without `-L`. Existing Markdown objects, including migration stubs, take precedence through the normal asset lookup. Emitted compatibility aliases use their configured target even when the unprefixed URL has a source stub. HTML aliases remain HTML with a Markdown alternate Link that serves the canonical content.

The builder resolves chains to actual published pages, preferring a translated target when present and otherwise falling back to English. Explicit locale alias prefixes are preserved; targets use their actual published locale routes. HTML destinations keep their configured queries and anchors. Markdown body lookup uses only the canonical pathname, ignoring destination and incoming queries and fragments; it never extracts an anchored section. Compatibility aliases under `/docs` and `DOCS_SITE_BASE_PATH` use the actual Markdown object without adding a hosting prefix. Dotted canonical pages and aliases such as `reference/AGENTS.default` and `AGENTS.default` negotiate all three Markdown media types on GET and HEAD when the current R2 object is HTML. Literal and percent-encoded dots use the same decoded object identity for ownership and cache policy while retaining the requested URL spelling and query in cache keys. Static objects remain static even if a same-named `.md` companion exists. Explicit `.html` requests do not negotiate. Accept matching still ignores quality weights; base-prefixed canonical pages and locale-root negotiation retain their existing limitations.

The build writes deterministic `dist/docs-markdown-redirects.json` outside the served output and clears it at every build, including preview builds. R2 preparation validates that each canonical Markdown object exists and attaches `openclaw-markdown-target` custom metadata to emitted redirect `index.html` objects and their slashless aliases. This sidecar is a build input, not a public object or request-time manifest. The uploader compares and HEAD-audits this field independently of HTML hashes and ETags, including metadata removal. Shell publishes include HTML aliases; page and locale publishes also include aliases whose current or previous Markdown target belongs to the selected page or locale, including compatibility prefixes. This refreshes aliases when translations appear or fall back to English.

Conflicting rules, cycles without a terminal source page, missing internal page targets, wildcard rules, unsafe paths, and unsupported URL schemes fail the build with a diagnostic. HTTP(S), protocol-relative external destinations, and non-page file destinations retain HTML redirects without Markdown metadata. Their Markdown requests retain the existing miss/HTML fallback behavior. No alias Markdown files are synthesized.

The Worker reads alias metadata directly on every Markdown object miss, even when canonical Markdown is cached. Dotted negotiation first checks current HTML ownership with R2 HEAD and reuses that response for alias metadata or a bodyless HTML/static fallback. Real Markdown objects still take precedence over alias targets. Canonical bodies use the existing asset cache under their canonical path; the Worker never stores the served body under the missing alias Markdown key. HTML responses at negotiable URLs include `Vary: Accept`, preserving other Vary values, and retain their Markdown alternate Link. Updated alias metadata selects the current canonical target without invalidating unrelated cached documents.

Rollout requires **both the rebuilt R2 artifact and the matching Worker**: publish a full artifact with canonical Markdown objects and redirect metadata, then deploy the Worker. The R2 workflow uploads before its Worker deployment; the manual Pages workflow can deploy the Worker separately. Deploying the Worker alone cannot repair aliases without metadata. Source retirement also requires removal of the old real Markdown object; its normal cache lifetime still applies. Missing metadata preserves the earlier explicit miss or negotiated HTML fallback during rollout. After deployment, verify explicit and negotiated GET/HEAD without following redirects: require `200`, Markdown MIME, `Vary: Accept`, no `Location`, exact canonical GET bytes and an empty HEAD body. Verify HTML queries and anchors independently, and check a metadata target change after prior HTML and Markdown requests. Building and testing locally does not publish or deploy either part.

## Cache Policy

`r2-prepare.mjs` assigns per-object `Cache-Control`:

- hashed/static assets: `public, max-age=31536000, immutable`
- HTML and slashless HTML aliases: `public, max-age=60, s-maxage=86400, stale-while-revalidate=604800`
- markdown, JSON, JSONL, and text indexes: `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`
- upload manifest: `private, max-age=0, no-store`

The Worker router splits browser and edge cache headers so cached HTML does not become stale in users' browsers:

- HTML and slashless HTML aliases:
  - `Cache-Control: public, max-age=60, stale-while-revalidate=60`
  - `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control: public, s-maxage=60, stale-while-revalidate=60`
- markdown, JSON, JSONL, and text indexes:
  - `Cache-Control: public, max-age=300, stale-while-revalidate=300`
  - `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- hashed/static assets:
  - `Cache-Control: public, max-age=31536000, immutable`

The Worker does not write HTML to `caches.default` and ignores older entries labeled HTML, including dotted aliases cached with obsolete year-immutable headers. Current R2 HTML receives the 60-second runtime policies above. Dotted Markdown negotiation verifies current R2 ownership even with warm caches; it adds one HEAD and never probes a Markdown companion for a proven static object. Ordinary warm static GETs retain their Worker cache HIT with no new R2 reads, and explicit canonical `.md` GETs retain their existing cache behavior. This bounded contract does not detect arbitrary static-to-HTML transitions on ordinary warm non-HTML cache hits, invalidate downstream clients already holding immutable content, or change existing TTLs. These are router behavior guarantees after deploying the change, not a claim of deployment or a cache purge. Recommended Cloudflare cache rules for the later pure-R2 path:

1. Cache static assets and Pagefind files for one year.
2. Cache HTML at the edge for one day with short browser TTL.
3. Cache `.md`, `.txt`, `.json`, and `.jsonl` for one hour at the edge.
4. Bypass cache for `/ask-molty/*`.

After router deploy, verify repeated HTML requests remain `X-OpenClaw-Docs-Cache: MISS` and repeated static or markdown requests show `MISS` then `HIT`. After pure-R2 ruleset cutover, verify repeated requests show `cf-cache-status: MISS` then `HIT`.

## Cutover Checklist

1. Confirm R2 is enabled on the OpenClaw deployment account.
2. Confirm the GitHub Cloudflare secrets are present:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Confirm the bucket exists:

   ```sh
   source ~/.profile
   CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
   CLOUDFLARE_API_TOKEN="$OPENCLAW_CLOUDFLARE_API_TOKEN" \
   npx wrangler@4.119.0 r2 bucket list
   ```

4. Run the manual `R2 Pages` workflow, or run the local upload command above.
5. Deploy `openclaw-docs-router` from the manual Pages workflow.
6. Live-test the URLs below.

Pure R2 follow-up, blocked on `Zone: Rulesets: Edit`:

1. Add or verify Cloudflare rules:
   - `/` rewrites to `/index.html` if needed.
   - non-root trailing-slash docs paths redirect to slashless paths.
   - cache rules match the policy above.
   - `/ask-molty/*` remains routed to `openclaw-docs-chat-proxy`.
2. Remove the `docs.openclaw.ai/*` and `documentation.openclaw.ai/*` routes from `openclaw-docs-router`.
3. Purge Cloudflare cache.
4. Live-test the URLs below.

## Live Smoke

Use these after every deploy:

```sh
curl -I https://docs.openclaw.ai/
curl -I https://docs.openclaw.ai/start/getting-started
curl -I https://docs.openclaw.ai/concepts/models
curl -I https://docs.openclaw.ai/concepts/models.md
curl -I https://docs.openclaw.ai/docs/platforms/digitalocean
curl -I https://docs.openclaw.ai/llms.txt
curl -I https://docs.openclaw.ai/.well-known/llms.txt
curl -I https://docs.openclaw.ai/robots.txt
curl -I https://docs.openclaw.ai/sitemap.xml
curl -sS 'https://docs.openclaw.ai/api/search?q=heartbeat'
curl -I https://docs.openclaw.ai/llms-full.txt
curl -I https://docs.openclaw.ai/.well-known/llms-full.txt
curl -I https://docs.openclaw.ai/assets/docs-site.css
curl -i https://docs.openclaw.ai/ask-molty/api/session
curl -I https://documentation.openclaw.ai/start/getting-started
curl -I https://docs2.openclaw.ai/
curl -I https://mintlify.openclaw.ai/
```

Expected after R2 cutover:

- slashless HTML paths return `200`.
- `.md` paths return `text/markdown`.
- `/llms.txt` and `/.well-known/llms.txt` return the lightweight docs index.
- `/robots.txt` returns `200 text/plain`.
- `/sitemap.xml` returns `200 application/xml` with mutable cache headers, not `immutable`.
- `/api/search?q=heartbeat` returns JSON search results from `X-OpenClaw-Docs-Origin: cloudflare-r2`.
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

1. Re-add the `docs.openclaw.ai/*` and `documentation.openclaw.ai/*` routes to `openclaw-docs-router`.
2. Re-run `.github/workflows/pages.yml` or deploy locally:

   ```sh
   source ~/.profile
   CLOUDFLARE_API_TOKEN="$CRABBOX_CLOUDFLARE_API_TOKEN" npx wrangler@4.119.0 deploy --config wrangler.toml
   ```

3. Purge Cloudflare cache.
4. Re-run the live smoke.
