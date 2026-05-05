---
read_when:
    - شما در حال نصب، پیکربندی، یا ممیزی Plugin WhatsApp هستید
summary: سطح کانال WhatsApp را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

سطح کانال WhatsApp را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

## توزیع

- بسته: `@openclaw/whatsapp`
- مسیر نصب: npm؛ ClawHub

## سطح

channels: whatsapp

## نکته نصب در Windows

در Windows، Plugin WhatsApp هنگام نصب npm به Git در `PATH` نیاز دارد، زیرا یکی از وابستگی‌های Baileys/libsignal آن از یک URL مربوط به git دریافت می‌شود. Git for Windows را نصب کنید، سپس shell را دوباره راه‌اندازی کنید و نصب را دوباره اجرا کنید:

```powershell
winget install --id Git.Git -e
```

Portable Git نیز در صورتی کار می‌کند که دایرکتوری `bin` آن در `PATH` باشد.

## مستندات مرتبط

- [whatsapp](/fa/channels/whatsapp)
