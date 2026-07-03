---
read_when:
    - می‌خواهید شناسه‌های مخاطبان/گروه‌ها/خود را برای یک کانال جست‌وجو کنید.
    - شما در حال توسعهٔ یک آداپتور دایرکتوری کانال هستید
summary: مرجع CLI برای `openclaw directory` (خود، همتایان، گروه‌ها)
title: فهرست
x-i18n:
    generated_at: "2026-07-03T17:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

جست‌وجوهای دایرکتوری برای کانال‌هایی که از آن پشتیبانی می‌کنند (مخاطبان/همتاها، گروه‌ها و «من»).

## پرچم‌های مشترک

- `--channel <name>`: شناسه/نام مستعار کانال (وقتی چند کانال پیکربندی شده باشد الزامی است؛ وقتی فقط یک کانال پیکربندی شده باشد خودکار است)
- `--account <id>`: شناسه حساب (پیش‌فرض: پیش‌فرض کانال)
- `--json`: خروجی JSON

## یادداشت‌ها

- `directory` برای این است که به شما کمک کند شناسه‌هایی را پیدا کنید که می‌توانید در فرمان‌های دیگر جای‌گذاری کنید (به‌ویژه `openclaw message send --target ...`).
- برای بسیاری از کانال‌ها، نتایج به‌جای دایرکتوری زنده ارائه‌دهنده، پشتوانه پیکربندی دارند (فهرست‌های مجاز / گروه‌های پیکربندی‌شده).
- Pluginهای کانال نصب‌شده همچنان می‌توانند پشتیبانی از دایرکتوری را حذف کنند؛ در آن حالت فرمان به‌جای نصب دوباره Plugin، عملیات دایرکتوری پشتیبانی‌نشده را گزارش می‌کند.
- خروجی پیش‌فرض `id` (و گاهی `name`) است که با یک تب جدا شده‌اند؛ برای اسکریپت‌نویسی از `--json` استفاده کنید.

## استفاده از نتایج با `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## قالب‌های شناسه (بر اساس کانال)

- WhatsApp: `+15551234567` (پیام مستقیم)، `1234567890-1234567890@g.us` (گروه)، `120363123456789@newsletter` (هدف خروجی کانال/خبرنامه)
- Signal: نام‌های مستعار پیکربندی‌شده به هدف‌های پیام مستقیم E.164/UUID یا هدف‌های گروهی `group:<id>` حل می‌شوند
- Telegram: `@username` یا شناسه عددی چت؛ گروه‌ها شناسه‌های عددی هستند
- Slack: `user:U…` و `channel:C…`
- Discord: `user:<id>` و `channel:<id>`
- Matrix (Plugin): `user:@user:server`، `room:!roomId:server`، یا `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و `conversation:<id>`
- Zalo (Plugin): شناسه کاربر (Bot API)
- Zalo Personal / `zalouser` (Plugin): شناسه رشته گفتگو (پیام مستقیم/گروه) از `zca` (`me`، `friend list`، `group list`)

## خود («من»)

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
