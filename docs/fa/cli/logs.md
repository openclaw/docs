---
read_when:
    - باید لاگ‌های Gateway را از راه دور به‌صورت زنده دنبال کنید (بدون SSH)
    - برای ابزارها به خطوط گزارش JSON نیاز دارید
summary: مرجع CLI برای `openclaw logs` (دنبال کردن لاگ‌های Gateway از طریق RPC)
title: گزارش‌ها
x-i18n:
    generated_at: "2026-05-03T11:33:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

لاگ‌های فایل Gateway را از طریق RPC از انتهای فایل بخوانید (در حالت راه دور کار می‌کند).

مرتبط:

- نمای کلی لاگ‌گیری: [لاگ‌گیری](/fa/logging)
- CLI مربوط به Gateway: [gateway](/fa/cli/gateway)

## گزینه‌ها

- `--limit <n>`: بیشترین تعداد خطوط لاگی که برگردانده می‌شود (پیش‌فرض `200`)
- `--max-bytes <n>`: بیشترین تعداد بایت‌هایی که از فایل لاگ خوانده می‌شود (پیش‌فرض `250000`)
- `--follow`: دنبال کردن جریان لاگ
- `--interval <ms>`: فاصلهٔ نظرسنجی هنگام دنبال کردن (پیش‌فرض `1000`)
- `--json`: رویدادهای JSON جداشده با خط را خروجی بده
- `--plain`: خروجی متن ساده بدون قالب‌بندی سبک‌دهی‌شده
- `--no-color`: غیرفعال کردن رنگ‌های ANSI
- `--local-time`: نمایش زمان‌ها در منطقهٔ زمانی محلی شما

## گزینه‌های مشترک RPC مربوط به Gateway

`openclaw logs` همچنین فلگ‌های استاندارد کلاینت Gateway را می‌پذیرد:

- `--url <url>`: نشانی WebSocket مربوط به Gateway
- `--token <token>`: توکن Gateway
- `--timeout <ms>`: مهلت زمانی بر حسب میلی‌ثانیه (پیش‌فرض `30000`)
- `--expect-final`: وقتی فراخوانی Gateway با پشتیبانی عامل انجام می‌شود، منتظر پاسخ نهایی بمان

وقتی `--url` را پاس می‌دهید، CLI پیکربندی یا اعتبارنامه‌های محیطی را به‌طور خودکار اعمال نمی‌کند. اگر Gateway هدف به احراز هویت نیاز دارد، `--token` را صراحتاً اضافه کنید.

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## یادداشت‌ها

- از `--local-time` برای نمایش زمان‌ها در منطقهٔ زمانی محلی خود استفاده کنید.
- اگر Gateway ضمنی local loopback درخواست جفت‌سازی کند، هنگام اتصال بسته شود، یا پیش از پاسخ دادن `logs.tail` مهلتش تمام شود، `openclaw logs` به‌طور خودکار به لاگ فایل Gateway پیکربندی‌شده برمی‌گردد. هدف‌های صریح `--url` از این جایگزین استفاده نمی‌کنند.
- هنگام استفاده از `--follow`، قطع‌های گذرای gateway (بسته شدن WebSocket، پایان مهلت، قطع اتصال) باعث اتصال مجدد خودکار با پس‌روی نمایی می‌شود (تا ۸ تلاش مجدد، با سقف ۳۰ ثانیه بین تلاش‌ها). در هر تلاش مجدد، یک هشدار در stderr چاپ می‌شود و وقتی یک نظرسنجی موفق شود، اعلان `[logs] gateway reconnected` چاپ می‌شود. در حالت `--json`، هم هشدار تلاش مجدد و هم گذار اتصال مجدد به‌صورت رکوردهای `{"type":"notice"}` در stderr صادر می‌شوند. خطاهای غیرقابل‌بازیابی (شکست احراز هویت، پیکربندی نامعتبر) همچنان بلافاصله خارج می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [لاگ‌گیری Gateway](/fa/gateway/logging)
