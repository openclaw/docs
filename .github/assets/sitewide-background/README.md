# Shared background on all pages

WebKit screenshots from bounded local previews, captured on 2026-10-02 UTC.

The files show English, German, and right-to-left Arabic pages, desktop/mobile widths, and both themes. `article` captures use `/start/getting-started` in the named locale; `home` captures use that locale's homepage. Viewport height is 900px; filenames include width and theme.

Reproduce each locale preview with `DOCS_SITE_PREVIEW_MAX_PAGES=5 DOCS_SITE_PREVIEW_LOCALE=<locale> DOCS_SITE_ARTIFACT_MODE=shell node scripts/docs-site/build.mjs --page index --page start/getting-started`, using a separate managed output directory for each locale.

The artwork, opacity, fade, and responsive assets are reused from the existing English homepage. The shared renderer now includes the background on every page in every locale.
