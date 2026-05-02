---
read_when:
    - می‌خواهید شناسه‌های مخاطبان/گروه‌ها/خودتان را برای یک کانال جست‌وجو کنید
    - شما در حال توسعهٔ یک آداپتور دایرکتوری کانال هستید
summary: مرجع CLI برای `openclaw directory` (خود، همتایان، گروه‌ها)
title: دایرکتوری
x-i18n:
    generated_at: "2026-05-02T11:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

جست‌وجوهای Directory برای کانال‌هایی که از آن پشتیبانی می‌کنند (مخاطبان/همتاها، گروه‌ها، و «من»).

## پرچم‌های مشترک

- `--channel <name>`: شناسه/نام مستعار کانال (وقتی چند کانال پیکربندی شده باشند الزامی است؛ وقتی فقط یک کانال پیکربندی شده باشد خودکار است)
- `--account <id>`: شناسه حساب (پیش‌فرض: پیش‌فرض کانال)
- `--json`: خروجی JSON

## نکته‌ها

- `directory` برای این است که به شما کمک کند شناسه‌هایی را پیدا کنید که می‌توانید در فرمان‌های دیگر جای‌گذاری کنید (به‌ویژه `openclaw message send --target ...`).
- برای بسیاری از کانال‌ها، نتیجه‌ها به‌جای یک Directory زنده از ارائه‌دهنده، بر پایه پیکربندی هستند (فهرست‌های مجاز / گروه‌های پیکربندی‌شده).
- Pluginهای کانال نصب‌شده همچنان می‌توانند پشتیبانی از Directory را حذف کنند؛ در این حالت، فرمان به‌جای نصب دوباره Plugin، عملیات Directory پشتیبانی‌نشده را گزارش می‌کند.
- خروجی پیش‌فرض `id` (و گاهی `name`) است که با یک تب جدا شده‌اند؛ برای اسکریپت‌نویسی از `--json` استفاده کنید.

## استفاده از نتیجه‌ها با `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## قالب‌های شناسه (بر اساس کانال)

- WhatsApp: `+15551234567` (پیام مستقیم)، `1234567890-1234567890@g.us` (گروه)
- Telegram: `@username` یا شناسه عددی گفت‌وگو؛ گروه‌ها شناسه‌های عددی هستند
- Slack: `user:U…` و `channel:C…`
- Discord: `user:<id>` و `channel:<id>`
- Matrix (Plugin): `user:@user:server`، `room:!roomId:server`، یا `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و `conversation:<id>`
- Zalo (Plugin): شناسه کاربر (رابط برنامه‌نویسی ربات)
- Zalo Personal / `zalouser` (Plugin): شناسه رشته گفت‌وگو (پیام مستقیم/گروه) از `zca` (`me`، `friend list`، `group list`)

## خود کاربر ("me")

```bash
openclaw directory self --channel zalouser
```

## همتاها (مخاطبان/کاربران)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## گروه‌ها

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## مرتبط

- [مرجع CLI](/fa/cli)
