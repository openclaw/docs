---
read_when:
    - می‌خواهید شناسه‌های مخاطبان/گروه‌ها/خود را برای یک کانال پیدا کنید
    - شما در حال توسعه‌ی یک آداپتور فهرست کانال هستید
summary: مرجع CLI برای `openclaw directory` (خود، همتایان، گروه‌ها)
title: دایرکتوری
x-i18n:
    generated_at: "2026-04-29T22:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

جست‌وجوهای دایرکتوری برای کانال‌هایی که از آن پشتیبانی می‌کنند (مخاطبان/همتایان، گروه‌ها، و «من»).

## پرچم‌های مشترک

- `--channel <name>`: شناسه/نام مستعار کانال (وقتی چند کانال پیکربندی شده باشند الزامی است؛ وقتی فقط یکی پیکربندی شده باشد خودکار است)
- `--account <id>`: شناسه حساب (پیش‌فرض: پیش‌فرض کانال)
- `--json`: خروجی JSON

## نکته‌ها

- `directory` برای کمک به یافتن شناسه‌هایی است که می‌توانید در فرمان‌های دیگر جای‌گذاری کنید (به‌ویژه `openclaw message send --target ...`).
- برای بسیاری از کانال‌ها، نتایج به‌جای دایرکتوری زنده ارائه‌دهنده، مبتنی بر پیکربندی هستند (فهرست‌های مجاز / گروه‌های پیکربندی‌شده).
- خروجی پیش‌فرض `id` (و گاهی `name`) است که با یک تب جدا شده‌اند؛ برای اسکریپت‌نویسی از `--json` استفاده کنید.

## استفاده از نتایج با `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## قالب‌های شناسه (بر اساس کانال)

- WhatsApp: `+15551234567` (پیام مستقیم)، `1234567890-1234567890@g.us` (گروه)
- Telegram: `@username` یا شناسه عددی چت؛ گروه‌ها شناسه‌های عددی هستند
- Slack: `user:U…` و `channel:C…`
- Discord: `user:<id>` و `channel:<id>`
- Matrix (Plugin): `user:@user:server`، `room:!roomId:server`، یا `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و `conversation:<id>`
- Zalo (Plugin): شناسه کاربر (Bot API)
- Zalo Personal / `zalouser` (Plugin): شناسه رشته گفتگو (پیام مستقیم/گروه) از `zca` (`me`، `friend list`، `group list`)

## خود ("me")

```bash
openclaw directory self --channel zalouser
```

## همتایان (مخاطبان/کاربران)

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
