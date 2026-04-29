---
read_when:
    - باید لاگ‌های Gateway را از راه دور به‌صورت زنده دنبال کنید (بدون SSH)
    - نیاز به خطوط لاگ JSON برای ابزارها دارید
summary: مرجع CLI برای `openclaw logs` (دنبال‌کردن گزارش‌های Gateway از طریق RPC)
title: لاگ‌ها
x-i18n:
    generated_at: "2026-04-29T22:36:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

لاگ‌های فایل Gateway را از طریق RPC دنبال کنید (در حالت راه دور کار می‌کند).

مرتبط:

- نمای کلی لاگ‌گیری: [لاگ‌گیری](/fa/logging)
- CLI Gateway: [Gateway](/fa/cli/gateway)

## گزینه‌ها

- `--limit <n>`: حداکثر تعداد خطوط لاگ برای بازگرداندن (پیش‌فرض `200`)
- `--max-bytes <n>`: حداکثر بایت‌ها برای خواندن از فایل لاگ (پیش‌فرض `250000`)
- `--follow`: دنبال کردن جریان لاگ
- `--interval <ms>`: بازه نظرسنجی هنگام دنبال کردن (پیش‌فرض `1000`)
- `--json`: انتشار رویدادهای JSON با جداکننده خط
- `--plain`: خروجی متن ساده بدون قالب‌بندی سبک‌دار
- `--no-color`: غیرفعال کردن رنگ‌های ANSI
- `--local-time`: نمایش برچسب‌های زمانی در منطقه زمانی محلی شما

## گزینه‌های مشترک RPC Gateway

`openclaw logs` همچنین پرچم‌های استاندارد کلاینت Gateway را می‌پذیرد:

- `--url <url>`: URL وب‌سوکت Gateway
- `--token <token>`: توکن Gateway
- `--timeout <ms>`: مهلت زمانی بر حسب میلی‌ثانیه (پیش‌فرض `30000`)
- `--expect-final`: هنگامی که فراخوانی Gateway متکی به عامل است، منتظر پاسخ نهایی بمانید

وقتی `--url` را ارسال می‌کنید، CLI پیکربندی یا اعتبارنامه‌های محیط را به‌صورت خودکار اعمال نمی‌کند. اگر Gateway مقصد به احراز هویت نیاز دارد، `--token` را صراحتاً وارد کنید.

## مثال‌ها

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

## نکته‌ها

- از `--local-time` برای نمایش برچسب‌های زمانی در منطقه زمانی محلی خود استفاده کنید.
- اگر Gateway ضمنی local loopback درخواست جفت‌سازی کند، هنگام اتصال بسته شود، یا پیش از پاسخ `logs.tail` مهلت زمانی‌اش تمام شود، `openclaw logs` به‌صورت خودکار به لاگ فایل Gateway پیکربندی‌شده بازمی‌گردد. مقصدهای صریح `--url` از این بازگشت استفاده نمی‌کنند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [لاگ‌گیری Gateway](/fa/gateway/logging)
