---
read_when:
    - شما از پیام‌های خصوصی در حالت جفت‌سازی استفاده می‌کنید و باید فرستندگان را تأیید کنید
summary: مرجع CLI برای `openclaw pairing` (تأیید/فهرست‌کردن درخواست‌های جفت‌سازی)
title: جفت‌سازی
x-i18n:
    generated_at: "2026-07-12T09:45:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

درخواست‌های جفت‌سازی پیام مستقیم را برای کانال‌هایی که از جفت‌سازی پشتیبانی می‌کنند تأیید یا بررسی کنید (فقط پیام‌های مستقیم گفتگو؛ جفت‌سازی Node/دستگاه از `openclaw devices` استفاده می‌کند).

مرتبط: [فرایند جفت‌سازی](/fa/channels/pairing)

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

| گزینه                  | توضیحات                                      |
| ----------------------- | -------------------------------------------- |
| `[channel]`             | شناسهٔ کانال به‌صورت آرگومان موقعیتی          |
| `--channel <channel>`   | شناسهٔ صریح کانال                             |
| `--account <accountId>` | شناسهٔ حساب برای کانال‌های چندحسابی           |
| `--json`                | خروجی قابل‌خواندن توسط ماشین                  |

اگر چند کانال دارای قابلیت جفت‌سازی پیکربندی شده‌اند، کانال را به‌صورت آرگومان موقعیتی یا با `--channel` مشخص کنید. کانال‌های افزونه‌ای تا زمانی که شناسهٔ کانال معتبر باشد، کار می‌کنند.

## `pairing approve`

یک کد جفت‌سازی در انتظار را تأیید کنید و به آن فرستنده اجازه دهید.

نحوهٔ استفاده:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- وقتی دقیقاً یک کانال دارای قابلیت جفت‌سازی پیکربندی شده است، `openclaw pairing approve <code>`

گزینه‌ها: `--channel <channel>`، `--account <accountId>`، `--notify` (ارسال تأییدیه به درخواست‌کننده در همان کانال).

### راه‌اندازی اولیهٔ مالک

اگر هنگام تأیید یک کد جفت‌سازی، `commands.ownerAllowFrom` خالی باشد، OpenClaw فرستندهٔ تأییدشده را نیز با استفاده از یک ورودی مختص کانال مانند `telegram:123456789` به‌عنوان مالک فرمان ثبت می‌کند. این کار فقط نخستین مالک را راه‌اندازی می‌کند؛ تأییدهای بعدی جفت‌سازی هرگز `commands.ownerAllowFrom` را جایگزین یا گسترش نمی‌دهند.

مالک فرمان، حساب اپراتور انسانی است که اجازه دارد فرمان‌های مختص مالک را اجرا کند و اقدامات خطرناکی مانند `/diagnostics`، `/export-trajectory`، `/config` و تأییدهای اجرا را تأیید کند. جفت‌سازی فقط به فرستنده اجازه می‌دهد با عامل گفتگو کند؛ به‌خودی‌خود، فراتر از این راه‌اندازی یک‌باره، امتیازهای مالک را اعطا نمی‌کند.

اگر پیش از وجود این راه‌اندازی اولیه فرستنده‌ای را تأیید کرده‌اید، `openclaw doctor` را اجرا کنید؛ اگر هیچ مالک فرمانی پیکربندی نشده باشد، هشدار می‌دهد و فرمان دقیق `openclaw config set commands.ownerAllowFrom ...` را برای رفع آن نشان می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی کانال](/fa/channels/pairing)
