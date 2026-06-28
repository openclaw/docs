---
read_when:
    - می‌خواهید شناسه‌های مخاطبان/گروه‌ها/خود را برای یک کانال جست‌وجو کنید
    - شما در حال توسعهٔ یک آداپتور دایرکتوری کانال هستید
summary: مرجع CLI برای `openclaw directory` (خود، همتایان، گروه‌ها)
title: پوشه
x-i18n:
    generated_at: "2026-05-06T17:52:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

جست‌وجوهای دایرکتوری برای کانال‌هایی که از آن پشتیبانی می‌کنند (مخاطبان/همتاها، گروه‌ها، و «من»).

## پرچم‌های رایج

- `--channel <name>`: شناسه/نام مستعار کانال (وقتی چند کانال پیکربندی شده باشند الزامی است؛ وقتی فقط یک کانال پیکربندی شده باشد خودکار است)
- `--account <id>`: شناسه حساب (پیش‌فرض: پیش‌فرض کانال)
- `--json`: خروجی JSON

## نکات

- `directory` برای کمک به یافتن شناسه‌هایی است که می‌توانید در فرمان‌های دیگر جای‌گذاری کنید (به‌ویژه `openclaw message send --target ...`).
- برای بسیاری از کانال‌ها، نتایج به‌جای دایرکتوری زنده ارائه‌دهنده، مبتنی بر پیکربندی هستند (فهرست‌های مجاز / گروه‌های پیکربندی‌شده).
- Pluginهای کانال نصب‌شده همچنان می‌توانند پشتیبانی از دایرکتوری را حذف کنند؛ در این حالت، فرمان به‌جای نصب دوباره Plugin، عملیات دایرکتوری پشتیبانی‌نشده را گزارش می‌کند.
- خروجی پیش‌فرض `id` (و گاهی `name`) است که با یک تب جدا شده‌اند؛ برای اسکریپت‌نویسی از `--json` استفاده کنید.

## استفاده از نتایج با `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## قالب‌های شناسه (بر اساس کانال)

- WhatsApp: `+15551234567` (DM)، `1234567890-1234567890@g.us` (گروه)، `120363123456789@newsletter` (هدف خروجی Channel/Newsletter)
- Telegram: `@username` یا شناسه عددی گفت‌وگو؛ گروه‌ها شناسه‌های عددی هستند
- Slack: `user:U…` و `channel:C…`
- Discord: `user:<id>` و `channel:<id>`
- Matrix (Plugin): `user:@user:server`، `room:!roomId:server`، یا `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` و `conversation:<id>`
- Zalo (Plugin): شناسه کاربر (Bot API)
- Zalo Personal / `zalouser` (Plugin): شناسه رشته گفت‌وگو (DM/گروه) از `zca` (`me`، `friend list`، `group list`)

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
