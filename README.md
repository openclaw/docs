# openclaw-docs

<!-- Keep README-owned media outside docs/**; docs/** is mirror output and sync prunes files absent from upstream source. -->
![OpenClaw Docs banner](.github/assets/readme-banner.jpg)

Mirror repo for the published OpenClaw docs site.

Source of truth lives in [`openclaw/openclaw`](https://github.com/openclaw/openclaw), under `docs/`.

## How it works

1. English docs are authored in `openclaw/openclaw`.
2. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` mirrors the docs tree into this repo.
3. This repo stores the published docs tree plus generated locale output.
4. `openclaw/docs/.github/workflows/translate-incremental.yml` debounces normal docs changes, while `translate-all.yml` handles full reconciliation for glossary changes, weekly schedule, release dispatch, or manual dispatch.
5. `.github/workflows/r2-pages.yml` builds the full unpruned static site and uploads changed objects to Cloudflare R2.
6. `.github/workflows/pages.yml` deploys the small Cloudflare Worker router that preserves clean URLs and markdown negotiation while reading docs from R2.

## Translation behavior

- Locale pages under `docs/<locale>/**` are generated output.
- Each translated page stores `x-i18n.source_hash`.
- The translate workflow computes a pending file list before calling the model.
- If no English source hashes changed, the workflow skips the expensive translation step entirely.
- If files changed, only the pending files are translated.
- The workflow retries transient model-format failures.
- Locale outputs are uploaded as artifacts first, then committed together by the finalizer.
- Incremental and full translation use separate concurrency lanes, so small docs edits do not cancel weekly or glossary-triggered full reconciliation.
- The weekly scheduled run uses full reconciliation mode to repair missed or flaky locale updates.

## Editing rules

- Do not treat this repo as the primary place for English doc edits.
- Make English doc changes in `openclaw/openclaw`, then let sync copy them here.
- Locale pages under `docs/<locale>/**` are generated output.
- `.openclaw-sync/source.json` records which `openclaw/openclaw` commit this mirror was synced from.

## Static site build

- `npm run docs:build` renders the mirrored Mintlify-flavored docs into `dist/docs-site`.
- English collection excludes top-level roots owned by published locales; each locale renders its own sources once, while nested or unrecognized directory names remain ordinary English paths.
- `npm run docs:build:cloudflare` is the legacy Worker Static Assets fallback build.
- `npm run docs:build:r2` renders the full unpruned site and prepares `dist/docs-r2-manifest.json` for R2 upload.
- `npm run docs:r2:upload` uploads only changed R2 objects, reports cache hits/misses, and refuses to turn a broken remote manifest read into a full-tree reupload.
- Manual R2 refreshes audit objects before upload; unchanged objects remain cache hits, and transient HEAD failures fall back to the signed manifest. `R2_UPLOAD_PUT_ALL=1` is the emergency escape hatch for intentionally rewriting every object.
- `npm run docs:smoke` checks representative English and locale pages plus the Pagefind search bundle.
- `npm run docs:check` runs both steps.
- The generated site includes the language picker and static full-text search via Pagefind.
- Cloudflare deploys `workers/docs-router.ts`, which serves slashless page URLs, English markdown responses for `.md` paths or `Accept: text/markdown`, and `/api/search` through the `DOCS_BUCKET` R2 binding.
- Cloudflare hosting details and limitations are documented in `CLOUDFLARE.md`.

Signed R2 requests and the hostname cutover helper default to a 30-second
per-request timeout. A stalled R2 request enters the existing retry loop; a
stalled cutover request fails the helper. Set `R2_UPLOAD_FETCH_TIMEOUT_MS` for
`scripts/docs-site/r2-upload.mjs`, or `CLOUDFLARE_API_TIMEOUT_MS` for
`scripts/cloudflare-cutover-docs-hosts.mjs` (including dry runs), to raise the
relevant budget. Use an integer from 1 to 2147483647 milliseconds (Node's maximum
timer delay). The workflow job timeout remains an outer limit even when a request
budget is raised.

## Secrets

- `OPENCLAW_DOCS_SYNC_TOKEN` lives in `openclaw/openclaw` and lets the source repo push into this repo.
- `OPENCLAW_DOCS_I18N_OPENAI_API_KEY` lives in this repo and powers locale translation refreshes.
- `CLOUDFLARE_API_TOKEN` lives in this repo and deploys the `docs.openclaw.ai` router.
- R2 uploads verify `CLOUDFLARE_API_TOKEN`, try temporary R2 credentials, and normally fall back to the token-derived direct S3 credential form. `OPENCLAW_R2_ACCESS_KEY_ID` / `OPENCLAW_R2_SECRET_ACCESS_KEY` are only fallback upload credentials when the Cloudflare token cannot be verified.

## Anchor contract

The source-owned `.openclaw-sync/lib/docs-markdown.mjs` supplies Markdown/MDX-ish
preprocessing, tokens, IDs and links to both this renderer and the source
`docs:check-links:anchors` command. `docs-redirects.mjs` owns redirect resolution.
These files are generated by source sync; never edit their mirror copies.
Missing support files fail the build through their imports.

MarkdownIt Anchor 9.2.1 heading IDs remain canonical, including punctuation,
percent bytes and duplicate suffixes. TOC entries and copy controls use those IDs.
Compatibility aliases follow the compiler shipped with `mint@4.2.808`
(`@mintlify/common@1.0.1096`, `@sindresorhus/slugify@2.2.0`) for existing Mintlify
links. They are emitted only when unambiguous. Markdown headings and authored HTML
or component IDs reserve their names first. A conflicting alias is omitted and
reported by the source audit; an alias never moves a published target. Existing
duplicate authored/canonical IDs remain visible as audit failures.

Titled Accordion/Expandable, Step and Tab components and named fields now emit
fragment targets. Explicit IDs take precedence. Generated component targets
allocate the next available numeric suffix after canonical/authored IDs and
heading aliases have been reserved. Components without a title/name or explicit
ID do not receive a synthetic target. A title that produces an empty Mintlify
slug also needs an explicit ID. The `{#custom}` heading syntax remains
unsupported; use explicit HTML IDs when authoring a distinct target.

Relative document links resolve from the final published page URL and render as
root-relative HTML page links, including directory index pages. Explicit root-relative
`.md` links still request raw Markdown and cannot carry HTML section fragments.

Fragment navigation checks literal percent-containing IDs first, then one URL
decode, and opens every containing `details` element before scrolling. Heading
aliases live inside their canonical heading; scrolling and TOC selection use that
owner. The same
behavior applies to initial loads, same-page links, PJAX and browser history.

Rollout order: land the source parser, dependencies and support-sync changes;
wait for their generated support files to reach this mirror; then roll out this
renderer and its lockfile; activate the source shared anchor audit only after the
deployed renderer emits the shared targets. Validate the combined tree with `npm test` and
`make docs-check` before publication. A support-file-only change must trigger a
full artifact build; scoped content refreshes include the complete sync closure.
