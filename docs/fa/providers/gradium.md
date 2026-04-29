---
read_when:
    - برای تبدیل متن به گفتار، Gradium را می‌خواهید
    - به کلید API Gradium یا پیکربندی صوتی نیاز دارید
summary: استفاده از تبدیل متن به گفتار Gradium در OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-29T23:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 16
---

Gradium یک ارائه‌دهنده تبدیل متن به گفتارِ همراه OpenClaw است. می‌تواند پاسخ‌های صوتی معمولی، خروجی Opus سازگار با یادداشت صوتی، و صدای u-law با 8 kHz را برای سطوح تلفنی تولید کند.

## راه‌اندازی

یک کلید API برای Gradium ایجاد کنید، سپس آن را در اختیار OpenClaw قرار دهید:

```bash
export GRADIUM_API_KEY="gsk_..."
```

همچنین می‌توانید کلید را در پیکربندی، زیر `messages.tts.providers.gradium.apiKey` ذخیره کنید.

## پیکربندی

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## صداها

| نام       | شناسه صدا          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

صدای پیش‌فرض: Emma.

## خروجی

- پاسخ‌های فایل صوتی از WAV استفاده می‌کنند.
- پاسخ‌های یادداشت صوتی از Opus استفاده می‌کنند و به‌عنوان سازگار با صدا علامت‌گذاری می‌شوند.
- سنتز تلفنی از `ulaw_8000` در 8 kHz استفاده می‌کند.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [نمای کلی رسانه](/fa/tools/media-overview)
