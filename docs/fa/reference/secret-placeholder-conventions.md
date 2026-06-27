---
read_when:
    - نوشتن مستنداتی که شامل توکن‌ها، کلیدهای API یا قطعه‌های اعتبارنامه هستند
    - به‌روزرسانی مثال‌هایی که ممکن است توسط ابزارهای تشخیص اسرار اسکن شوند
summary: قراردادهای جای‌نگهدارِ ایمن برای اسکنر اسرار در مستندات و نمونه‌ها
title: قراردادهای جای‌نگهدار محرمانه
x-i18n:
    generated_at: "2026-06-27T18:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# قراردادهای جای‌نگهدار رازها

از جای‌نگهدارهایی استفاده کنید که برای انسان خوانا باشند اما شبیه رازهای واقعی به نظر نرسند.

## سبک پیشنهادی

- مقادیر توصیفی مانند `example-openai-key-not-real` یا `example-discord-bot-token` را ترجیح دهید.
- برای قطعه‌کدهای shell، `${OPENAI_API_KEY}` را به رشته‌های درون‌خطی شبیه token ترجیح دهید.
- مثال‌ها را آشکارا ساختگی و محدود به هدف نگه دارید (provider، channel، نوع auth).

## از این الگوها در مستندات پرهیز کنید

- متن لفظی سربرگ یا پابرگ کلید خصوصی PEM.
- پیشوندهایی که شبیه اعتبارنامه‌های زنده هستند، برای مثال `sk-...`، `xoxb-...`، `AKIA...`.
- tokenهای bearer واقع‌نما که از لاگ‌های runtime کپی شده‌اند.

## مثال

```bash
# خوب
export OPENAI_API_KEY="example-openai-key-not-real"

# بهتر (وقتی مستند درباره اتصال env است)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
