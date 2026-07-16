---
read_when:
    - در حال نصب، پیکربندی یا ممیزی Plugin ‏anthropic-vertex هستید
summary: Plugin ارائه‌دهنده Anthropic Vertex برای مدل‌های Claude در Google Vertex AI در OpenClaw.
title: Plugin ورتکس Anthropic
x-i18n:
    generated_at: "2026-07-16T16:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin ‏Anthropic Vertex

Plugin ارائه‌دهنده Anthropic Vertex در OpenClaw برای مدل‌های Claude در Google Vertex AI.

## توزیع

- بسته: `@openclaw/anthropic-vertex-provider`
- مسیر نصب: npm؛ ClawHub

## سطح

ارائه‌دهندگان: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

در مناطقی از Google Cloud که مدل در دسترس است، از `anthropic-vertex/claude-fable-5` استفاده کنید.
Fable 5 همیشه از تفکر تطبیقی استفاده می‌کند و میزان تلاش پیش‌فرض آن `high` است. `/think off` و
`/think minimal` از میزان تلاش `low` استفاده می‌کنند، زیرا مدل از غیرفعال‌کردن تفکر پشتیبانی نمی‌کند.

## Claude Sonnet 5

از `anthropic-vertex/claude-sonnet-5` با نقطه پایانی `global`، `us` یا `eu`
در Vertex استفاده کنید. پیش‌فرض Sonnet 5 تفکر تطبیقی با میزان تلاش `high` است و از
`/think off` یا سطوح بومی `/think xhigh|max` پشتیبانی می‌کند. OpenClaw پنجره زمینه
1,000,000 توکنی و محدودیت خروجی 128,000 توکنی آن را به‌طور خودکار منتشر می‌کند.

قیمت‌گذاری کاتالوگ تا 31 اوت 2026 از نرخ مقدماتی جهانی Vertex به میزان `$2/$10` به‌ازای
هر یک میلیون توکن ورودی/خروجی پیروی می‌کند و سپس از 1 سپتامبر به `$3/$15` تغییر می‌یابد.
نقاط پایانی چندمنطقه‌ای `us` و `eu` شامل
۱۰٪ هزینه اضافی مستندشده Vertex هستند.

<!-- openclaw-plugin-reference:manual-end -->
