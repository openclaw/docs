---
read_when:
    - شما در حال نصب، پیکربندی، یا ممیزی Plugin ‏codex-supervisor هستید
summary: جلسات سرور برنامه Codex را از OpenClaw نظارت کنید.
title: Plugin ناظر Codex
x-i18n:
    generated_at: "2026-06-27T18:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin سرپرست Codex

نشست‌های app-server Codex را از OpenClaw نظارت کنید.

## توزیع

- بسته: `@openclaw/codex-supervisor`
- مسیر نصب: در OpenClaw گنجانده شده است

## سطح

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## فهرست نشست‌ها

`codex_sessions_list` به طور پیش‌فرض فقط نشست‌های بارگذاری‌شده Codex را نشان می‌دهد. `include_stored` را تنظیم کنید تا تاریخچه ذخیره‌شده هم شامل شود؛ Plugin از مسیر فهرست‌گیری فقط state-DB در app-server Codex استفاده می‌کند و به طور پیش‌فرض نتایج ذخیره‌شده را به 200 محدود می‌کند. `max_stored_sessions` را ارسال کنید تا این سقف را کاهش یا افزایش دهید، حداکثر تا 1000.

<!-- openclaw-plugin-reference:manual-end -->
