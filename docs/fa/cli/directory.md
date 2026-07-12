---
read_when:
    - می‌خواهید شناسه‌های مخاطبان/گروه‌ها/خودتان را برای یک کانال پیدا کنید
    - شما در حال توسعه یک سازگارکنندهٔ فهرست کانال هستید
summary: مرجع CLI برای `openclaw directory` (خود، همتاها، گروه‌ها)
title: دایرکتوری
x-i18n:
    generated_at: "2026-07-12T09:49:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

جست‌وجو در فهرست برای کانال‌هایی که از آن پشتیبانی می‌کنند: مخاطبان/همتایان، گروه‌ها و «من» (خود).

نتایج برای جای‌گذاری در فرمان‌های دیگر، به‌ویژه `openclaw message send --target ...`، در نظر گرفته شده‌اند.

## پرچم‌های مشترک

- `--channel <name>`: شناسه/نام مستعار کانال (هنگامی که چند کانال پیکربندی شده باشد الزامی است؛ اگر فقط یک کانال پیکربندی شده باشد، به‌طور خودکار انتخاب می‌شود)
- `--account <id>`: شناسه حساب (پیش‌فرض: حساب پیش‌فرض کانال)
- `--json`: خروجی JSON

خروجی پیش‌فرض (غیر JSON) شامل `id` (و گاهی `name`) است که با یک نویسه تب از هم جدا شده‌اند.

## نکات

- برای بسیاری از کانال‌ها، نتایج به‌جای فهرست زنده ارائه‌دهنده، از پیکربندی (فهرست‌های مجاز / گروه‌های پیکربندی‌شده) به دست می‌آیند.
- ممکن است Plugin کانالی که از قبل نصب شده است، از فهرست پشتیبانی نکند. در این حالت، فرمان پشتیبانی‌نشدن عملیات را گزارش می‌کند؛ برای افزودن پشتیبانی، تلاشی برای نصب مجدد یا ارتقای Plugin انجام نمی‌دهد.

## استفاده از نتایج با `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## قالب شناسه بر اساس کانال

| کانال                               | قالب شناسه مقصد                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (پیام مستقیم)، `1234567890-1234567890@g.us` (گروه)، `120363123456789@newsletter` (کانال/خبرنامه، فقط خروجی)    |
| Signal                              | نام‌های مستعار پیکربندی‌شده به مقصدهای پیام مستقیم E.164/UUID یا مقصدهای گروهی `group:<id>` تبدیل می‌شوند                     |
| Telegram                            | `@username` یا شناسه عددی گفت‌وگو؛ گروه‌ها از شناسه‌های عددی استفاده می‌کنند                                                  |
| Slack                               | `user:U…` و `channel:C…`                                                                                                      |
| Discord                             | `user:<id>` و `channel:<id>`                                                                                                  |
| Matrix (Plugin)                     | `user:@user:server`، `room:!roomId:server` یا `#alias:server`                                                                 |
| Microsoft Teams (Plugin)            | `user:<id>` و `conversation:<id>`                                                                                             |
| Zalo (Plugin)                       | شناسه کاربر (Bot API)                                                                                                         |
| Zalo Personal / `zalouser` (Plugin) | شناسه رشته گفت‌وگو (پیام مستقیم/گروه)، دریافت‌شده از `zca` (`me`، `friend list`، `group list`)                               |

## خود («من»)

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
