---
read_when:
    - از پیام‌های خصوصی در حالت جفت‌سازی استفاده می‌کنید و باید فرستندگان را تأیید کنید
summary: مرجع CLI برای `openclaw pairing` (تأیید/فهرست‌کردن درخواست‌های جفت‌سازی)
title: جفت‌سازی
x-i18n:
    generated_at: "2026-07-16T15:48:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

درخواست‌های جفت‌سازی پیام مستقیم را برای کانال‌هایی که از جفت‌سازی پشتیبانی می‌کنند تأیید یا بررسی کنید (فقط پیام‌های مستقیم چت — جفت‌سازی Node/دستگاه از `openclaw devices` استفاده می‌کند).

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

درخواست‌های جفت‌سازی در انتظار را برای یک کانال فهرست می‌کند.

| گزینه                  | توضیحات                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | شناسهٔ موقعیتی کانال                 |
| `--channel <channel>`   | شناسهٔ صریح کانال                   |
| `--account <accountId>` | شناسهٔ حساب برای کانال‌های چندحسابی |
| `--json`                | خروجی قابل‌خواندن برای ماشین               |

اگر چند کانال دارای قابلیت جفت‌سازی پیکربندی شده‌اند، کانال را به‌صورت موقعیتی یا با `--channel` مشخص کنید. کانال‌های افزونه‌ای تا زمانی کار می‌کنند که شناسهٔ کانال معتبر باشد.

## `pairing approve`

یک کد جفت‌سازی در انتظار را تأیید می‌کند و به آن فرستنده اجازه می‌دهد.

نحوهٔ استفاده:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` هنگامی که دقیقاً یک کانال دارای قابلیت جفت‌سازی پیکربندی شده است

گزینه‌ها: `--channel <channel>`، `--account <accountId>`، `--notify` (یک تأییدیه را در همان کانال برای درخواست‌کننده ارسال می‌کند).

### راه‌اندازی اولیهٔ مالک

اگر هنگام تأیید یک کد جفت‌سازی، `commands.ownerAllowFrom` خالی باشد، OpenClaw فرستندهٔ تأییدشده را نیز با استفاده از یک ورودی مختص کانال مانند `telegram:123456789` به‌عنوان مالک فرمان ثبت می‌کند. این کار فقط نخستین مالک را راه‌اندازی می‌کند — تأییدهای بعدی جفت‌سازی هرگز `commands.ownerAllowFrom` را جایگزین یا گسترش نمی‌دهند.

مالک فرمان، حساب اپراتور انسانی است که اجازه دارد فرمان‌های مختص مالک را اجرا و اقدام‌های خطرناکی مانند `/diagnostics`، `/export-session`، `/export-trajectory`، `/config` و تأییدهای اجرا را تأیید کند. جفت‌سازی فقط به فرستنده اجازه می‌دهد با عامل گفتگو کند؛ به‌خودی‌خود و جز در این راه‌اندازی اولیهٔ یک‌باره، امتیازهای مالک را اعطا نمی‌کند.

اگر پیش از ایجاد این راه‌اندازی اولیه، فرستنده‌ای را تأیید کرده‌اید، `openclaw doctor` را اجرا کنید؛ این فرمان در صورت پیکربندی‌نشدن مالک فرمان هشدار می‌دهد و فرمان دقیق `openclaw config set commands.ownerAllowFrom ...` را برای رفع مشکل نشان می‌دهد.

## مطالب مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی کانال](/fa/channels/pairing)
