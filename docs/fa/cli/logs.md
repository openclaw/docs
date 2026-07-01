---
read_when:
    - باید لاگ‌های Gateway را از راه دور دنبال کنید (بدون SSH)
    - به خطوط گزارش JSON برای ابزارها نیاز دارید
summary: مرجع CLI برای `openclaw logs` (دنبال‌کردن لاگ‌های Gateway از طریق RPC)
title: لاگ‌ها
x-i18n:
    generated_at: "2026-07-01T15:28:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

لاگ‌های فایل Gateway را از طریق RPC دنبال کنید (در حالت راه‌دور کار می‌کند).

مرتبط:

- نمای کلی لاگ‌گیری: [لاگ‌گیری](/fa/logging)
- CLI Gateway: [gateway](/fa/cli/gateway)

## گزینه‌ها

- `--limit <n>`: حداکثر تعداد خطوط لاگ برای بازگرداندن (پیش‌فرض `200`)
- `--max-bytes <n>`: حداکثر بایت‌هایی که از فایل لاگ خوانده می‌شود (پیش‌فرض `250000`)
- `--follow`: دنبال کردن جریان لاگ
- `--interval <ms>`: فاصله نظرسنجی هنگام دنبال کردن (پیش‌فرض `1000`)
- `--json`: انتشار رویدادهای JSON جداشده با خط
- `--plain`: خروجی متن ساده بدون قالب‌بندی سبک‌دار
- `--no-color`: غیرفعال کردن رنگ‌های ANSI
- `--local-time`: نمایش زمان‌ها در منطقه زمانی محلی شما (پیش‌فرض)
- `--utc`: نمایش زمان‌ها در UTC

## گزینه‌های مشترک RPC Gateway

`openclaw logs` همچنین پرچم‌های استاندارد کلاینت Gateway را می‌پذیرد:

- `--url <url>`: نشانی WebSocket Gateway
- `--token <token>`: توکن Gateway
- `--timeout <ms>`: مهلت زمانی بر حسب میلی‌ثانیه (پیش‌فرض `30000`)
- `--expect-final`: وقتی فراخوانی Gateway با پشتیبانی عامل انجام می‌شود، منتظر پاسخ نهایی بمانید

وقتی `--url` را می‌دهید، CLI پیکربندی یا اعتبارنامه‌های محیط را به‌طور خودکار اعمال نمی‌کند. اگر Gateway هدف به احراز هویت نیاز دارد، `--token` را صریحاً وارد کنید.

## نمونه‌ها

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## نکته‌ها

- زمان‌ها به‌طور پیش‌فرض در منطقه زمانی محلی شما نمایش داده می‌شوند. برای خروجی UTC از `--utc` استفاده کنید.
- اگر Gateway ضمنی local loopback درخواست جفت‌سازی کند، هنگام اتصال بسته شود، یا پیش از پاسخ دادن `logs.tail` مهلت زمانی‌اش تمام شود، `openclaw logs` به‌طور خودکار به لاگ فایل Gateway پیکربندی‌شده بازمی‌گردد. اهداف صریح `--url` از این بازگشت استفاده نمی‌کنند.
- `openclaw logs --follow` پس از شکست‌های ضمنی RPC Gateway محلی، بازگشت‌های فایل پیکربندی‌شده را دنبال نمی‌کند. در Linux، هر زمان در دسترس باشد از ژورنال Gateway فعال user-systemd بر اساس PID استفاده می‌کند و منبع لاگ انتخاب‌شده را چاپ می‌کند؛ در غیر این صورت به‌جای دنبال کردن یک فایل کنار‌به‌کنار که ممکن است کهنه باشد، تلاش دوباره برای Gateway زنده را ادامه می‌دهد.
- هنگام استفاده از `--follow`، قطع‌های گذرای Gateway (بسته شدن WebSocket، پایان مهلت زمانی، قطع اتصال) باعث اتصال مجدد خودکار با عقب‌نشینی نمایی می‌شوند (تا 8 تلاش دوباره، با سقف 30 ثانیه بین تلاش‌ها). در هر تلاش دوباره، یک هشدار در stderr چاپ می‌شود و پس از موفق شدن یک نظرسنجی، یک اعلان `[logs] gateway reconnected` چاپ می‌شود. در حالت `--json`، هم هشدار تلاش دوباره و هم گذار اتصال مجدد به‌صورت رکوردهای `{"type":"notice"}` در stderr منتشر می‌شوند. خطاهای غیرقابل‌بازیابی (شکست احراز هویت، پیکربندی نادرست) همچنان بلافاصله خارج می‌شوند.
- در حالت `--follow --json`، گذارهای منبع لاگ به‌صورت رکوردهای `{"type":"meta"}` منتشر می‌شوند. مصرف‌کنندگان باید نشانگرها را برای هر `sourceKind` جداگانه دنبال کنند: یک جریان می‌تواند از خروجی فایل Gateway (`sourceKind: "file"`) به بازگشت ژورنال محلی (`sourceKind: "journal"`،‏ `localFallback: true`، همراه با `service.pid`/`service.unit`) و پس از بازیابی دوباره به خروجی فایل Gateway منتقل شود. یک منبع یا نشانگر پایدار برای کل نشست دنبال‌کردن فرض نکنید، و وقتی بازیابی نشانگر فایل Gateway را بازپخش می‌کند، خطوط هم‌پوشان را تحمل کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [لاگ‌گیری Gateway](/fa/gateway/logging)
