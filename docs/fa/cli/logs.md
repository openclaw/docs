---
read_when:
    - باید لاگ‌های Gateway را از راه دور دنبال کنید (بدون SSH)
    - شما خطوط گزارش JSON را برای ابزارسازی می‌خواهید.
summary: مرجع CLI برای `openclaw logs` (مشاهدهٔ زندهٔ لاگ‌های Gateway از طریق RPC)
title: گزارش‌ها
x-i18n:
    generated_at: "2026-06-27T17:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

لاگ‌های فایلی Gateway را از طریق RPC دنبال کنید (در حالت راه دور کار می‌کند).

مرتبط:

- نمای کلی ثبت لاگ: [ثبت لاگ](/fa/logging)
- CLI Gateway: [gateway](/fa/cli/gateway)

## گزینه‌ها

- `--limit <n>`: حداکثر تعداد خطوط لاگ برای بازگرداندن (پیش‌فرض `200`)
- `--max-bytes <n>`: حداکثر تعداد بایت‌هایی که از فایل لاگ خوانده می‌شود (پیش‌فرض `250000`)
- `--follow`: دنبال کردن جریان لاگ
- `--interval <ms>`: فاصله نظرسنجی هنگام دنبال کردن (پیش‌فرض `1000`)
- `--json`: تولید رویدادهای JSON جداشده با خط
- `--plain`: خروجی متن ساده بدون قالب‌بندی سبک‌دار
- `--no-color`: غیرفعال کردن رنگ‌های ANSI
- `--local-time`: نمایش زمان‌ها در منطقه زمانی محلی شما (پیش‌فرض)
- `--utc`: نمایش زمان‌ها در UTC

## گزینه‌های مشترک RPC برای Gateway

`openclaw logs` همچنین پرچم‌های استاندارد کلاینت Gateway را می‌پذیرد:

- `--url <url>`: نشانی WebSocket Gateway
- `--token <token>`: توکن Gateway
- `--timeout <ms>`: مهلت زمانی بر حسب ms (پیش‌فرض `30000`)
- `--expect-final`: وقتی فراخوانی Gateway با پشتیبانی عامل انجام می‌شود، منتظر پاسخ نهایی بمانید

وقتی `--url` را ارسال می‌کنید، CLI اطلاعات اعتبارسنجی پیکربندی یا محیط را به‌صورت خودکار اعمال نمی‌کند. اگر Gateway مقصد به احراز هویت نیاز دارد، `--token` را صریحا وارد کنید.

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

- زمان‌ها به‌صورت پیش‌فرض در منطقه زمانی محلی شما نمایش داده می‌شوند. برای خروجی UTC از `--utc` استفاده کنید.
- اگر Gateway ضمنی local loopback درخواست جفت‌سازی بدهد، هنگام اتصال بسته شود، یا پیش از پاسخ `logs.tail` مهلت زمانی‌اش تمام شود، `openclaw logs` به‌صورت خودکار به لاگ فایلی Gateway پیکربندی‌شده برمی‌گردد. مقصدهای صریح `--url` از این fallback استفاده نمی‌کنند.
- `openclaw logs --follow` پس از شکست‌های RPC برای Gateway محلی ضمنی، fallbackهای فایل پیکربندی‌شده را دنبال نمی‌کند. در Linux، در صورت دسترس بودن، از ژورنال Gateway فعال user-systemd بر اساس PID استفاده می‌کند و منبع لاگ انتخاب‌شده را چاپ می‌کند؛ در غیر این صورت، به جای دنبال کردن یک فایل کنار‌دستی که ممکن است قدیمی باشد، تلاش برای Gateway زنده را ادامه می‌دهد.
- هنگام استفاده از `--follow`، قطع‌های موقت Gateway (بسته شدن WebSocket، پایان مهلت زمانی، قطع اتصال) باعث اتصال مجدد خودکار با backoff نمایی می‌شوند (تا 8 تلاش مجدد، با سقف 30 ثانیه بین تلاش‌ها). در هر تلاش مجدد، یک هشدار در stderr چاپ می‌شود و پس از موفق شدن یک نظرسنجی، اعلان `[logs] gateway reconnected` چاپ می‌شود. در حالت `--json`، هم هشدار تلاش مجدد و هم گذار اتصال مجدد به‌صورت رکوردهای `{"type":"notice"}` در stderr منتشر می‌شوند. خطاهای غیرقابل بازیابی (شکست احراز هویت، پیکربندی نادرست) همچنان بلافاصله خارج می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [ثبت لاگ Gateway](/fa/gateway/logging)
