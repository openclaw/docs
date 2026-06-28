---
read_when:
    - شما از پیام‌های مستقیم حالت جفت‌سازی استفاده می‌کنید و باید فرستندگان را تأیید کنید
summary: مرجع CLI برای `openclaw pairing` (تأیید/فهرست کردن درخواست‌های جفت‌سازی)
title: جفت‌سازی
x-i18n:
    generated_at: "2026-05-06T17:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw pairing`

درخواست‌های جفت‌سازی پیام مستقیم را تأیید یا بررسی کنید (برای کانال‌هایی که از جفت‌سازی پشتیبانی می‌کنند).

مرتبط:

- جریان جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)

## دستورها

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

درخواست‌های جفت‌سازی در انتظار را برای یک کانال فهرست کنید.

گزینه‌ها:

- `[channel]`: شناسه موقعیتی کانال
- `--channel <channel>`: شناسه صریح کانال
- `--account <accountId>`: شناسه حساب برای کانال‌های چندحسابی
- `--json`: خروجی قابل خواندن برای ماشین

نکته‌ها:

- اگر چند کانال دارای قابلیت جفت‌سازی پیکربندی شده باشند، باید کانالی را یا به‌صورت موقعیتی یا با `--channel` ارائه کنید.
- کانال‌های افزونه مجاز هستند، به شرطی که شناسه کانال معتبر باشد.

## `pairing approve`

یک کد جفت‌سازی در انتظار را تأیید کنید و به آن فرستنده اجازه دهید.

نحوه استفاده:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` هنگامی که دقیقاً یک کانال دارای قابلیت جفت‌سازی پیکربندی شده باشد

گزینه‌ها:

- `--channel <channel>`: شناسه صریح کانال
- `--account <accountId>`: شناسه حساب برای کانال‌های چندحسابی
- `--notify`: ارسال تأییدیه به درخواست‌کننده در همان کانال

راه‌اندازی اولیه مالک:

- اگر هنگام تأیید یک کد جفت‌سازی، `commands.ownerAllowFrom` خالی باشد، OpenClaw فرستنده تأییدشده را نیز به‌عنوان مالک دستور ثبت می‌کند، با استفاده از یک ورودی دارای دامنه کانال مانند `telegram:123456789`.
- این کار فقط اولین مالک را راه‌اندازی اولیه می‌کند. تأییدهای بعدی جفت‌سازی، `commands.ownerAllowFrom` را جایگزین یا گسترش نمی‌دهند.
- مالک دستور، حساب اپراتور انسانی است که اجازه دارد دستورهای مخصوص مالک را اجرا کند و اقدامات خطرناکی مانند `/diagnostics`، `/export-trajectory`، `/config` و تأییدهای اجرا را تأیید کند.

## نکته‌ها

- ورودی کانال: آن را به‌صورت موقعیتی (`pairing list telegram`) یا با `--channel <channel>` ارسال کنید.
- `pairing list` از `--account <accountId>` برای کانال‌های چندحسابی پشتیبانی می‌کند.
- `pairing approve` از `--account <accountId>` و `--notify` پشتیبانی می‌کند.
- اگر فقط یک کانال دارای قابلیت جفت‌سازی پیکربندی شده باشد، `pairing approve <code>` مجاز است.
- اگر پیش از وجود این راه‌اندازی اولیه، فرستنده‌ای را تأیید کرده‌اید، `openclaw doctor` را اجرا کنید؛ وقتی هیچ مالک دستوری پیکربندی نشده باشد هشدار می‌دهد و دستور `openclaw config set commands.ownerAllowFrom ...` را برای رفع آن نشان می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی کانال](/fa/channels/pairing)
