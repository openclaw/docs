---
read_when:
    - شما از پیام‌های مستقیم حالت جفت‌سازی استفاده می‌کنید و باید فرستندگان را تأیید کنید
summary: مرجع CLI برای `openclaw pairing` (تأیید/فهرست کردن درخواست‌های جفت‌سازی)
title: جفت‌سازی
x-i18n:
    generated_at: "2026-04-29T22:37:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

درخواست‌های جفت‌سازی DM را تأیید یا بررسی کنید (برای کانال‌هایی که از جفت‌سازی پشتیبانی می‌کنند).

مرتبط:

- جریان جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)

## فرمان‌ها

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

- `[channel]`: شناسه کانال موضعی
- `--channel <channel>`: شناسه کانال صریح
- `--account <accountId>`: شناسه حساب برای کانال‌های چندحسابی
- `--json`: خروجی قابل‌خواندن توسط ماشین

نکات:

- اگر چند کانال با قابلیت جفت‌سازی پیکربندی شده باشند، باید یک کانال را یا به‌صورت موضعی یا با `--channel` ارائه کنید.
- کانال‌های افزونه تا زمانی مجازند که شناسه کانال معتبر باشد.

## `pairing approve`

یک کد جفت‌سازی در انتظار را تأیید کنید و به آن فرستنده اجازه دهید.

کاربرد:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` زمانی که دقیقاً یک کانال با قابلیت جفت‌سازی پیکربندی شده باشد

گزینه‌ها:

- `--channel <channel>`: شناسه کانال صریح
- `--account <accountId>`: شناسه حساب برای کانال‌های چندحسابی
- `--notify`: ارسال تأییدیه به درخواست‌کننده در همان کانال

راه‌اندازی اولیه مالک:

- اگر هنگام تأیید یک کد جفت‌سازی، `commands.ownerAllowFrom` خالی باشد، OpenClaw فرستنده تأییدشده را نیز به‌عنوان مالک فرمان ثبت می‌کند، با استفاده از یک ورودی محدود به کانال مانند `telegram:123456789`.
- این کار فقط نخستین مالک را راه‌اندازی اولیه می‌کند. تأییدهای جفت‌سازی بعدی، `commands.ownerAllowFrom` را جایگزین یا گسترش نمی‌دهند.
- مالک فرمان، حساب اپراتور انسانی است که اجازه دارد فرمان‌های فقط‌مالک را اجرا کند و اقدام‌های خطرناکی مانند `/diagnostics`، `/export-trajectory`، `/config` و تأییدهای exec را تأیید کند.

## نکات

- ورودی کانال: آن را به‌صورت موضعی (`pairing list telegram`) یا با `--channel <channel>` ارسال کنید.
- `pairing list` از `--account <accountId>` برای کانال‌های چندحسابی پشتیبانی می‌کند.
- `pairing approve` از `--account <accountId>` و `--notify` پشتیبانی می‌کند.
- اگر فقط یک کانال با قابلیت جفت‌سازی پیکربندی شده باشد، `pairing approve <code>` مجاز است.
- اگر پیش از وجود این راه‌اندازی اولیه، فرستنده‌ای را تأیید کرده‌اید، `openclaw doctor` را اجرا کنید؛ این فرمان زمانی هشدار می‌دهد که هیچ مالک فرمانی پیکربندی نشده باشد و فرمان `openclaw config set commands.ownerAllowFrom ...` را برای رفع آن نشان می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی کانال](/fa/channels/pairing)
