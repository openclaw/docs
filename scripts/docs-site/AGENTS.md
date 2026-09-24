# AGENTS.md

Scope: docs shell generator, hidden visual fixtures, local smoke checks, and R2 artifact preparation.

- Do not edit generated `dist/docs-site/**`; rebuild it.
- Keep authored docs under `docs/**` out of this subtree. Use virtual fixtures or generator code here when testing shell UI.
- The hidden component fixture is generated at `/__elements`; keep it `noindex` and out of `sitemap.xml` and `llms.txt`.
- For a page preview, run `npm run docs:build:preview -- --page plugins/reference/crabbox`. Repeat `--page <route>` to include other pages, even outside navigation. Routes are relative to the locale root, without `.md` or `.mdx`.
- To preview unsynced edits from the main repository, add `--source-root /absolute/path/to/openclaw --output-dir /absolute/path/to/openclaw/.cache/docs-preview`. Both flags are preview-only: content, snippets, navigation and content assets come from the source checkout; the renderer and site assets come from this publisher checkout. Output is the HTML site root. Use an empty or previously managed preview directory; tracked files and source directories cannot be output destinations.
- Previews build at most 30 pages in English. Add `DOCS_SITE_PREVIEW_INCLUDE_FIXTURE=1` to include `/__elements` within that limit. They skip other locale trees, per-page OG rendering, redirects, and publishing indexes; do not run translation, R2 preparation, or full builds just for screenshots.
- For a smaller or translated preview, use `DOCS_SITE_PREVIEW_MAX_PAGES=5 DOCS_SITE_PREVIEW_LOCALE=fr node scripts/docs-site/build.mjs --page <route>`.
- Validate bounded renderer, CSS, fixture, or preview changes with focused tests and the relevant preview pages. Run `make docs-check` when the change needs full publishing validation, such as cross-locale routing, indexes, or R2 artifacts. A preview does not replace that check when it is needed.
- After the preview build, use `make docs-serve` plus `make docs-elements-open` for visual review.
- Add smoke coverage in `scripts/docs-site/smoke.mjs` for any new visual contract that would be annoying to catch by eye later.
- Keep R2 uploads diff-friendly: no generated timestamp churn, randomized output, or broad rewrites unless the source docs changed.
