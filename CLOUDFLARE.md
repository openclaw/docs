# Cloudflare Hosting

Internal notes for `https://docs.openclaw.ai`.

## Hosting Design

- Cloudflare R2 bucket `openclaw-docs` stores the full generated docs site.
- `docs.openclaw.ai` is served from R2 through the `openclaw-docs-router` Worker and Cloudflare CDN.
- `docs.openclaw.ai/ask-molty/*` stays on the separate Ask Molty Worker.
- `documentation.openclaw.ai` is legacy and redirects to `docs.openclaw.ai`.
- `docs2.openclaw.ai` and `mintlify.openclaw.ai` are compatibility aliases that redirect directly to `https://docs.openclaw.ai`, retaining each request path and query.
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

Manifest files refer directly to the checked `dist/docs-site` tree; preparation
does not make a second `dist/docs-r2` copy. Keep that tree unchanged until upload
finishes. Slashless aliases reuse their physical file's hashes and HTTP metadata;
remote object comparison and deletion accounting are unchanged.

## Current Production State

The deployed website uses R2-backed storage with a small Worker router in front:

- Worker: `openclaw-docs-router`
- Routes: `docs.openclaw.ai/*`, `documentation.openclaw.ai/*`, `docs2.openclaw.ai/*`, `mintlify.openclaw.ai/*`
- Router storage: native `DOCS_BUCKET` R2 binding to bucket `openclaw-docs`
- Header: `X-OpenClaw-Docs-Origin: cloudflare-r2`
- The Worker applies the runtime cache policy below over the R2 object's metadata.

Why a Worker still exists:

- R2 object storage does not serve `/` as `/index.html` without router logic.
- R2 object storage does not redirect non-root trailing slash docs paths to slashless paths.
- R2 object storage cannot negotiate markdown from `Accept: text/markdown` without router logic.
- The CLI search endpoint `/api/search` reads `docs-search.json` from R2 and needs Worker logic.
## Required Cloudflare Access

Cloudflare account:

- account: the OpenClaw deployment account
- account id: stored in the private `CLOUDFLARE_ACCOUNT_ID` secret/local environment variable
- zone: `openclaw.ai`

Required Cloudflare API token scopes for bucket/domain/DNS setup:

- `Account: R2 Storage: Edit`
- `Account: Workers Scripts: Edit`
- `Zone: DNS: Edit`
- `Zone: Workers Routes: Edit`
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

### Incremental article rendering

R2 upload already skips unchanged objects; the builder also reuses unchanged
rendered articles from `.cache/docs-render`. The deployment restores this cache
before building and saves it after publication and live-smoke scheduling. A cold
or evicted cache still builds the complete site normally.

Cache identity includes the raw page, its source-relative path and route, the
renderer/parser source, locked dependencies, and Node version/platform. It does
not include the source commit, so a one-page edit does not invalidate all locales.
Pages containing `<Snippet` always render afresh, including nested or newly
available snippet dependencies. Removed pages' entries are pruned.

Only article HTML is cached by this cache. Navigation, locale-aware links, page chrome, edit
links, redirects, Markdown exports, and search indexes are rebuilt from
the current snapshot. Deletions and publication ordering are unchanged. Logs
report article hits, misses, and snippet bypasses. For an uncached comparison,
run `DOCS_SITE_RENDER_CACHE=0 npm run docs:build:r2`; preview builds bypass the
cache automatically. This optimization does not remove the upstream source-sync
queue or full MDX validation, and the first deployment must populate the cache.

### Preview image reuse

Per-page social-preview PNGs use the separate `.cache/docs-og` cache. A hit needs
the same generated SVG (title, summary and navigation label), renderer/options,
font bytes, locked dependencies and Node/platform identity. Missing or damaged
entries render again; only images selected by the current page/navigation snapshot
are written to the output, and unselected cache entries are pruned. Preview mode
still skips per-page OG generation.

The deployment restores images before building and saves them after publication.
Logs distinguish reused images from actual renders. `DOCS_SITE_RENDER_CACHE=0`
also bypasses this cache, without creating or pruning it. The renderer uses the
locked `@resvg/resvg-js` package with embedded fonts, not `rsvg-convert`, so the
workflow does not install `librsvg2-bin`.

Published image URLs include a version derived from the actual PNG bytes. Title,
summary, or renderer changes that alter an image therefore refresh client caches;
unchanged images retain their URL, including locale pages using the generic card.
The public image path remains stable.

Within the selected upload scope, R2 publication completes non-HTML objects
before publishing HTML. This keeps a newly versioned image URL from becoming
visible before its PNG is available. A prerequisite upload failure stops HTML
publication; deletions and the final catalog update still follow successful uploads.

Pagefind still builds a complete current index. Its immutable-file reuse is not
enabled here: retaining an old output directory without an exact current-file
inventory would also retain obsolete search fragments. Publication order, search
coverage and old-object deletion remain unchanged.

### Router deployment

1. On a main push that changes `workers/**` or `wrangler.toml`, `r2-pages.yml` deploys the matching Worker after any required R2 upload, provided that snapshot passed admission before the build.
2. `pages.yml` pushes validate the Worker bundle with `wrangler deploy --dry-run`; they do not deploy it.
3. Manual `pages.yml` dispatch with `deploy_worker=true` deploys the router using the workflow's pinned Wrangler version.
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

The Worker router preserves `Accept: text/markdown` negotiation and root `/` behavior while reading objects from R2 through the bucket binding. The retired hostnames have no independent publisher. Both HTTP and HTTPS requests redirect directly to the canonical HTTPS host. The existing more-specific Ask Molty routes on `docs` and `documentation` remain unchanged.

### Markdown for page aliases

Central `docs.json` internal page aliases support explicit `.md` requests and negotiation with `text/markdown`, `text/x-markdown`, or `application/markdown`. After a Markdown object miss, the Worker reads the HTML alias's current R2 metadata and serves the published canonical Markdown object as HTTP `200 text/markdown` in the first response. GET returns the whole exact canonical document, including frontmatter and every section, even when the HTML destination has an anchor. HEAD returns `200` with no body. Both include `Vary: Accept` and no `Location`; a plain `curl -fsS https://docs.openclaw.ai/refactor/database-first.md` receives readable content without `-L`. Existing Markdown objects, including migration stubs, take precedence through the normal asset lookup. Emitted compatibility aliases use their configured target even when the unprefixed URL has a source stub. HTML aliases remain HTML with a Markdown alternate Link that serves the canonical content.

The builder resolves chains to actual published pages, preferring a translated target when present and otherwise falling back to English. Explicit locale alias prefixes are preserved; targets use their actual published locale routes. HTML destinations keep their configured queries and anchors. Markdown body lookup uses only the canonical pathname, ignoring destination and incoming queries and fragments; it never extracts an anchored section. Compatibility aliases under `/docs` and `DOCS_SITE_BASE_PATH` use the actual Markdown object without adding a hosting prefix. Dotted canonical pages and aliases such as `reference/AGENTS.default` and `AGENTS.default` negotiate all three Markdown media types on GET and HEAD when the current R2 object is HTML. Literal and percent-encoded dots use the same decoded object identity for ownership and cache policy while retaining the requested URL spelling and query in cache keys. Static objects remain static even if a same-named `.md` companion exists. Explicit `.html` requests do not negotiate. Accept matching still ignores quality weights; base-prefixed canonical pages and locale-root negotiation retain their existing limitations.

The build writes deterministic `dist/docs-markdown-redirects.json` outside the served output and clears it at every build, including preview builds. R2 preparation validates that each canonical Markdown object exists and attaches `openclaw-markdown-target` custom metadata to emitted redirect `index.html` objects and their slashless aliases. This sidecar is a build input, not a public object or request-time manifest. The uploader compares and HEAD-audits this field independently of HTML hashes and ETags, including metadata removal. Shell publishes include HTML aliases; page and locale publishes also include aliases whose current or previous Markdown target belongs to the selected page or locale, including compatibility prefixes. This refreshes aliases when translations appear or fall back to English.

Conflicting rules, cycles without a terminal source page, missing internal page targets, wildcard rules, unsafe paths, and unsupported URL schemes fail the build with a diagnostic. HTTP(S), protocol-relative external destinations, and non-page file destinations retain HTML redirects without Markdown metadata. Their Markdown requests retain the existing miss/HTML fallback behavior. No alias Markdown files are synthesized.

The Worker reads alias metadata directly on every Markdown object miss, even when canonical Markdown is cached. Dotted negotiation first checks current HTML ownership with R2 HEAD and reuses that response for alias metadata or a bodyless HTML/static fallback. Real Markdown objects still take precedence over alias targets. Canonical bodies use the existing asset cache under their canonical path; the Worker never stores the served body under the missing alias Markdown key. HTML responses at negotiable URLs include `Vary: Accept`, preserving other Vary values, and retain their Markdown alternate Link. Updated alias metadata selects the current canonical target without invalidating unrelated cached documents.

Rollout requires **both the rebuilt R2 artifact and the matching Worker**: publish a full artifact with canonical Markdown objects and redirect metadata, then deploy the Worker. The R2 workflow uploads before its Worker deployment; the manual Pages workflow can deploy the Worker separately. Deploying the Worker alone cannot repair aliases without metadata. Source retirement also requires removal of the old real Markdown object; its normal cache lifetime still applies. Missing metadata preserves the earlier explicit miss or negotiated HTML fallback during rollout. After deployment, verify explicit and negotiated GET/HEAD without following redirects: require `200`, Markdown MIME, `Vary: Accept`, no `Location`, exact canonical GET bytes and an empty HEAD body. Verify HTML queries and anchors independently, and check a metadata target change after prior HTML and Markdown requests. Building and testing locally does not publish or deploy either part.

## MCP Search

`POST /mcp` serves the legacy JSON-RPC documentation search tool. A request can
contain one object or a batch of at most 32 items. Larger batches return HTTP 200
with JSON-RPC error `-32600` (`Batch too large`) before any item is handled or the
search index is read. Split larger requests into batches of at most 32. The
single-object request format and existing notification behavior are unchanged.

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

The Worker does not write HTML to `caches.default` and ignores older entries labeled HTML, including dotted aliases cached with obsolete year-immutable headers. Current R2 HTML receives the 60-second runtime policies above. Dotted Markdown negotiation verifies current R2 ownership even with warm caches; it adds one HEAD and never probes a Markdown companion for a proven static object. Ordinary warm static GETs retain their Worker cache HIT with no new R2 reads, and explicit canonical `.md` GETs retain their existing cache behavior. This bounded contract does not detect arbitrary static-to-HTML transitions on ordinary warm non-HTML cache hits, invalidate downstream clients already holding immutable content, or change existing TTLs. These are router behavior guarantees after deploying the change, not a claim of deployment or a cache purge.

After router deployment, repeated HTML requests remain `X-OpenClaw-Docs-Cache: MISS`; repeated static or Markdown requests can show `MISS` then `HIT`.

## Live Smoke

Run `gh workflow run docs-live-smoke.yml --ref main` after deployment. It checks the current site and all three compatibility redirects. Use these URLs for manual checks:

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

Expected results:

- slashless HTML paths return `200`.
- `.md` paths return `text/markdown`.
- `/llms.txt` and `/.well-known/llms.txt` return the lightweight docs index.
- `/robots.txt` returns `200 text/plain`.
- `/sitemap.xml` returns `200 application/xml` with mutable cache headers, not `immutable`.
- `/api/search?q=heartbeat` returns JSON search results from `X-OpenClaw-Docs-Origin: cloudflare-r2`.
- `/llms-full.txt` and `/.well-known/llms-full.txt` return `200 text/plain` after the scheduled `LLMs Full Corpus` workflow has uploaded the nightly corpus.
- docs responses include `X-OpenClaw-Docs-Origin: cloudflare-r2`.
- repeated static or Markdown requests can become `X-OpenClaw-Docs-Cache: HIT`; HTML stays `MISS`.
- `/ask-molty/api/session` returns `401` when logged out.
- both retired hostnames and `documentation` return direct `308` redirects to `https://docs.openclaw.ai`, retaining path and query (also test HTTP).

## Recovery

For a router regression, use Cloudflare's deployment history to roll back to the
prior Worker version, then rerun live smoke. Routine deployment does not change DNS.
