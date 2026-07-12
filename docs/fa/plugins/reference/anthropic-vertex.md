---
read_when:
    - شما در حال نصب، پیکربندی یا ممیزی Plugin ‏anthropic-vertex هستید
summary: Plugin ارائه‌دهندهٔ Anthropic Vertex برای OpenClaw جهت استفاده از مدل‌های Claude در Google Vertex AI.
title: Plugin آنتروپیک ورتکس
x-i18n:
    generated_at: "2026-07-12T10:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin ‏Anthropic Vertex

Plugin ارائه‌دهنده Anthropic Vertex در OpenClaw برای مدل‌های Claude در Google Vertex AI.

## توزیع

- بسته: `@openclaw/anthropic-vertex-provider`
- مسیر نصب: npm؛ ClawHub

## سطح

ارائه‌دهندگان: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

در مناطقی از Google Cloud که مدل در دسترس است، از `anthropic-vertex/claude-fable-5` استفاده کنید.
Fable 5 همیشه از تفکر تطبیقی استفاده می‌کند و تلاش پیش‌فرض آن `high` است. `/think off` و
`/think minimal` از تلاش `low` استفاده می‌کنند، زیرا مدل از غیرفعال‌کردن تفکر پشتیبانی نمی‌کند.

## Claude Sonnet 5

از `anthropic-vertex/claude-sonnet-5` با نقطه پایانی `global`، `us` یا `eu` متعلق به Vertex
استفاده کنید. Sonnet 5 به‌طور پیش‌فرض از تفکر تطبیقی با تلاش `high` استفاده می‌کند و از
`/think off` یا سطوح بومی `/think xhigh|max` پشتیبانی می‌کند. OpenClaw پنجره زمینه
۱٬۰۰۰٬۰۰۰ توکنی و محدودیت خروجی ۱۲۸٬۰۰۰ توکنی آن را به‌طور خودکار منتشر می‌کند.

قیمت‌گذاری کاتالوگ تا ۳۱ اوت ۲۰۲۶ از نرخ مقدماتی جهانی Vertex به میزان `$2/$10` به‌ازای
هر یک میلیون توکن ورودی/خروجی پیروی می‌کند و از ۱ سپتامبر به `$3/$15` تغییر می‌یابد.
نقاط پایانی چندمنطقه‌ای `us` و `eu` از هزینه اضافی مستندشده ۱۰ درصدی Vertex استفاده می‌کنند.

<!-- openclaw-plugin-reference:manual-end -->
