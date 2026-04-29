---
read_when:
    - باید بدانید مهرهای زمانی چگونه برای مدل نرمال‌سازی می‌شوند
    - پیکربندی منطقه زمانی کاربر برای پرامپت‌های سیستمی
summary: مدیریت منطقه زمانی برای عامل‌ها، پاکت‌ها و پرامپت‌ها
title: مناطق زمانی
x-i18n:
    generated_at: "2026-04-29T22:47:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw مُهرهای زمانی را استاندارد می‌کند تا مدل یک **زمان مرجع واحد** ببیند.

## پوشش‌های پیام (به‌طور پیش‌فرض محلی)

پیام‌های ورودی در پوششی مانند این قرار می‌گیرند:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

مُهر زمانی در پوشش، **به‌طور پیش‌فرض محلیِ میزبان** است، با دقت دقیقه.

می‌توانید این را با مورد زیر بازنویسی کنید:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` از UTC استفاده می‌کند.
- `envelopeTimezone: "user"` از `agents.defaults.userTimezone` استفاده می‌کند (در صورت نبود، به منطقه زمانی میزبان برمی‌گردد).
- برای یک آفست ثابت، از یک منطقه زمانی صریح IANA استفاده کنید (برای مثال، `"Europe/Vienna"`).
- `envelopeTimestamp: "off"` مُهرهای زمانی مطلق را از سرآیندهای پوشش حذف می‌کند.
- `envelopeElapsed: "off"` پسوندهای زمان سپری‌شده را حذف می‌کند (سبک `+2m`).

### مثال‌ها

**محلی (پیش‌فرض):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**منطقه زمانی ثابت:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**زمان سپری‌شده:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## محموله‌های ابزار (داده خام ارائه‌دهنده + فیلدهای نرمال‌شده)

فراخوانی‌های ابزار (`channels.discord.readMessages`، `channels.slack.readMessages` و غیره) **مُهرهای زمانی خام ارائه‌دهنده** را برمی‌گردانند.
همچنین برای سازگاری، فیلدهای نرمال‌شده را ضمیمه می‌کنیم:

- `timestampMs` (میلی‌ثانیه‌های epoch در UTC)
- `timestampUtc` (رشته UTC با قالب ISO 8601)

فیلدهای خام ارائه‌دهنده حفظ می‌شوند.

## منطقه زمانی کاربر برای پرامپت سیستم

`agents.defaults.userTimezone` را تنظیم کنید تا منطقه زمانی محلی کاربر را به مدل بگویید. اگر تنظیم نشده باشد،
OpenClaw **منطقه زمانی میزبان را در زمان اجرا** تشخیص می‌دهد (بدون نوشتن پیکربندی).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

پرامپت سیستم شامل موارد زیر است:

- بخش `Current Date & Time` با زمان محلی و منطقه زمانی
- `Time format: 12-hour` یا `24-hour`

می‌توانید قالب پرامپت را با `agents.defaults.timeFormat` (`auto` | `12` | `24`) کنترل کنید.

برای رفتار کامل و مثال‌ها، [تاریخ و زمان](/fa/date-time) را ببینید.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) — ساعت‌های فعال از منطقه زمانی برای زمان‌بندی استفاده می‌کنند
- [کارهای Cron](/fa/automation/cron-jobs) — عبارت‌های cron از منطقه زمانی برای زمان‌بندی استفاده می‌کنند
- [تاریخ و زمان](/fa/date-time) — رفتار کامل تاریخ/زمان و مثال‌ها
