# Header community links

Screenshots captured from the docs site on 2026-10-02 UTC, without image editing.

- `desktop-before.png`: live production before this change, Chromium, 1440px viewport, dark theme.
- `desktop-dark-after.png`: bounded local preview of this change, Chromium, 1440px viewport, dark theme.
- `desktop-light-after.png`: bounded local preview, WebKit, 1440px viewport, light theme.
- `mobile-after.png`: bounded local preview of `/start/getting-started` with its navigation drawer open, WebKit, 390 x 844 viewport, dark theme.

Preview: `DOCS_SITE_PREVIEW_INCLUDE_FIXTURE=1 npm run docs:build:preview -- --page start/getting-started`.

The header retains GitHub and adds X and Reddit alongside Discord. The same four links use accessible icon controls in the mobile drawer. Existing icon assets are reused.
