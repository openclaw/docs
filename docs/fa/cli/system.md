---
read_when:
    - می‌خواهید یک رویداد سیستمی را بدون ایجاد یک کار Cron در صف قرار دهید
    - باید Heartbeatها را فعال یا غیرفعال کنید
    - می‌خواهید ورودی‌های حضور سیستم را بررسی کنید
summary: مرجع CLI برای `openclaw system` (رویدادهای سیستم، Heartbeat، حضور)
title: سیستم
x-i18n:
    generated_at: "2026-04-29T22:39:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

کمک‌ابزارهای سطح سیستم برای Gateway: رویدادهای سیستم را در صف قرار دهید، Heartbeat‌ها را کنترل کنید،
و حضور را مشاهده کنید.

همه زیر‌فرمان‌های `system` از RPC در Gateway استفاده می‌کنند و پرچم‌های مشترک کلاینت را می‌پذیرند:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## فرمان‌های رایج

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

یک رویداد سیستم را در جلسه **اصلی** در صف قرار دهید. Heartbeat بعدی آن را
به‌صورت یک خط `System:` در اعلان تزریق می‌کند. از `--mode now` برای اجرای فوری Heartbeat
استفاده کنید؛ `next-heartbeat` تا تیک زمان‌بندی‌شده بعدی منتظر می‌ماند.

پرچم‌ها:

- `--text <text>`: متن الزامی رویداد سیستم.
- `--mode <mode>`: `now` یا `next-heartbeat` (پیش‌فرض).
- `--json`: خروجی قابل خواندن توسط ماشین.
- `--url`، `--token`، `--timeout`، `--expect-final`: پرچم‌های مشترک RPC در Gateway.

## `system heartbeat last|enable|disable`

کنترل‌های Heartbeat:

- `last`: آخرین رویداد Heartbeat را نشان دهید.
- `enable`: Heartbeat‌ها را دوباره روشن کنید (اگر غیرفعال شده بودند، از این استفاده کنید).
- `disable`: Heartbeat‌ها را موقتاً متوقف کنید.

پرچم‌ها:

- `--json`: خروجی قابل خواندن توسط ماشین.
- `--url`، `--token`، `--timeout`، `--expect-final`: پرچم‌های مشترک RPC در Gateway.

## `system presence`

ورودی‌های فعلی حضور سیستم را که Gateway از آن‌ها اطلاع دارد فهرست کنید (گره‌ها،
نمونه‌ها، و خطوط وضعیت مشابه).

پرچم‌ها:

- `--json`: خروجی قابل خواندن توسط ماشین.
- `--url`، `--token`، `--timeout`، `--expect-final`: پرچم‌های مشترک RPC در Gateway.

## یادداشت‌ها

- به یک Gateway در حال اجرا نیاز دارد که از طریق پیکربندی فعلی شما (محلی یا راه دور) قابل دسترسی باشد.
- رویدادهای سیستم موقتی هستند و پس از راه‌اندازی مجدد پایدار نمی‌مانند.

## مرتبط

- [مرجع CLI](/fa/cli)
