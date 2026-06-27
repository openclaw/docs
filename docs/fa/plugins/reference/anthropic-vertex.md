---
read_when:
    - شما در حال نصب، پیکربندی، یا ممیزی Plugin ‏anthropic-vertex هستید.
summary: Plugin ارائه‌دهنده Anthropic Vertex در OpenClaw برای مدل‌های Claude در Google Vertex AI.
title: Plugin انتروپیک Vertex
x-i18n:
    generated_at: "2026-06-27T18:23:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin آنتروپیک Vertex

Plugin ارائه‌دهنده OpenClaw آنتروپیک Vertex برای مدل‌های Claude در Google Vertex AI.

## توزیع

- بسته: `@openclaw/anthropic-vertex-provider`
- مسیر نصب: npm؛ ClawHub

## سطح

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

از `anthropic-vertex/claude-fable-5` در جایی استفاده کنید که مدل در منطقه Google Cloud شما در دسترس است.
Fable 5 همیشه از تفکر تطبیقی استفاده می‌کند و به‌طور پیش‌فرض روی تلاش `high` قرار دارد. `/think off` و
`/think minimal` از تلاش `low` استفاده می‌کنند، زیرا مدل از غیرفعال‌کردن تفکر پشتیبانی نمی‌کند.

<!-- openclaw-plugin-reference:manual-end -->
