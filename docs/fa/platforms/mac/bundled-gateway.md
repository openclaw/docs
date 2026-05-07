---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd مربوط به Gateway در macOS
    - نصب CLI Gateway برای macOS
summary: محیط اجرای Gateway در macOS (سرویس خارجی launchd)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-05-07T13:25:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا زمان اجرای Gateway را همراه خود بسته‌بندی نمی‌کند. برنامه macOS
انتظار دارد CLI `openclaw` به‌صورت **خارجی** نصب شده باشد، Gateway را به‌عنوان
فرآیند فرزند اجرا نمی‌کند، و یک سرویس launchd مختص هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به همان متصل می‌شود).

## نصب CLI (برای حالت محلی الزامی است)

Node 24 زمان اجرای پیش‌فرض در Mac است. Node 22 LTS، در حال حاضر `22.16+`، همچنان برای سازگاری کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

دکمه **Install CLI** در برنامه macOS همان جریان نصب سراسری را اجرا می‌کند که برنامه
در داخل از آن استفاده می‌کند: ابتدا npm را ترجیح می‌دهد، سپس pnpm، و بعد bun را اگر تنها
مدیر بسته شناسایی‌شده باشد. Node همچنان زمان اجرای توصیه‌شده برای Gateway است.

## Launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ قالب قدیمی `com.openclaw.*` ممکن است باقی بماند)

محل Plist (مختص هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامه macOS نصب/به‌روزرسانی LaunchAgent را در حالت محلی بر عهده دارد.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw Active»‏ LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه Gateway را متوقف نمی‌کند (launchd آن را زنده نگه می‌دارد).
- اگر یک Gateway از قبل روی پورت پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  شروع نمونه‌ای جدید، به همان متصل می‌شود.

ثبت رخداد:

- خروجی استاندارد/خطای launchd: `/tmp/openclaw/openclaw-gateway.log`

## سازگاری نسخه

برنامه macOS نسخه Gateway را با نسخه خودش بررسی می‌کند. اگر ناسازگار باشند،
CLI سراسری را به‌روزرسانی کنید تا با نسخه برنامه مطابقت داشته باشد.

## بررسی Smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

سپس:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [راهنمای عملیاتی Gateway](/fa/gateway)
