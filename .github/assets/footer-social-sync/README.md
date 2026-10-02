# Footer social sync

Captured on 2026-10-02 UTC. Reference: https://openclaw.ai/.

- `openclaw-reference.png`: live main-site footer, Chromium, 1440px viewport.
- `desktop-dark.png`: docs preview footer, Chromium, 1440px viewport.
- `desktop-light.png`: docs preview footer, WebKit, 1440px viewport.
- `mobile-{dark,light}.png`: docs preview footer brand/social region, WebKit, 390px viewport.

The footer social order and destinations match the live main site. The four newly needed brand SVG glyphs were copied from its public footer; existing local glyphs are reused for X, GitHub, Discord, and Reddit.

Preview: `DOCS_SITE_PREVIEW_MAX_PAGES=5 DOCS_SITE_PREVIEW_LOCALE=en DOCS_SITE_ARTIFACT_MODE=shell node scripts/docs-site/build.mjs --page start/getting-started`.
