# Community invitation visual proof

Captured from the bounded docs preview for the community-popup update.

- `fallback-before-after.webp`: WebKit before/after with the `corner-shape` enhancement rules removed. This exercises the normal CSS cascade used by Safari versions without that feature; it is not a screenshot of a different Safari version.
- `desktop-chromium.webp`: the selected Reddit / Discord / X button design on the docs homepage in Chromium.
- `desktop-webkit-light.webp`: the light theme in WebKit with the rounded fallback active.

The same before/after behavior was also checked visually in native Safari on the development Mac. The mobile invitation stays docked below navigation; its flush corners are intentional.

The underwater artwork at `scripts/docs-site/assets/community-invite.webp` was generated for this task with OpenAI's image API using the existing docs invitation as a reference, selected by Hannes Rudolph for the docs popup, and resized to 768 × 320 WebP. It introduces Reddit and X beside Discord; the platform marks identify the linked community destinations. Original generated PNGs and prompts remain in the local concept-workshop artifacts. This PR adds no font files.
