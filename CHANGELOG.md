# Changelog

## Unreleased

**Highlights:** Stable section links and more reliable translated docs, with bounded publishing requests and workflow jobs.

- Preserve published heading IDs, emit unambiguous Mintlify link aliases and component targets, and open nested accordions for fragment navigation using the source-owned shared parsing and redirect contract.
- Recover parser-diagnosed translation markup damage before validation, preserving translated prose and the existing failed-shard publication checks; thanks @hxy91819.
- Fix redundant locale rendering by excluding locale-owned roots from English page collection, including accidental localized `AGENTS.md` pages and duplicate locale-root Markdown exports.
- Reject malformed remote R2 manifests before scoped uploads can replace the catalog and lose unrelated pages; thanks @SebTardif.
- Skip locale publication when the source metadata is missing, unreadable, or empty, while preserving publication for matching source snapshots; thanks @SebTardif.
- Abort stalled signed R2 requests so uploads can retry instead of hanging indefinitely; configure the per-request budget with `R2_UPLOAD_FETCH_TIMEOUT_MS`; thanks @SebTardif.
- Bound live docs smoke requests and jobs while preserving the dispatch retry window; thanks @SebTardif.
- Bound maintenance and translation workflow jobs, including reusable workflow callees and the incremental debounce; thanks @SebTardif.
- Abort stalled Cloudflare hostname cutover requests, with a configurable `CLOUDFLARE_API_TIMEOUT_MS` budget; thanks @SebTardif.
- Reject malformed and overflowing request timeout settings before network operations begin.
- Refresh syntax highlighting, icons, Markdown and HTML parsing, and diagrams with highlight.js 11.12.0, Lucide 1.41.0, markdown-it 15.0.1, htmlparser2 12.0.0, and Mermaid 11.17.2.
- Refresh browser verification and Cloudflare deployment tooling with Playwright 1.63.0 and Wrangler 4.129.0.
- Update CodeQL actions to 4.37.9 for the current analysis bundle.
