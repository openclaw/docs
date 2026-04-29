---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd Gateway در macOS
    - نصب CLI Gateway برای macOS
summary: محیط اجرای Gateway در macOS (سرویس launchd خارجی)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-04-29T23:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا زمان اجرای Gateway را همراه خود ارائه نمی‌کند. برنامه macOS
انتظار دارد `openclaw` CLI به‌صورت **خارجی** نصب شده باشد، Gateway را به‌عنوان
فرایند فرزند اجرا نمی‌کند، و یک سرویس launchd ویژه هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به همان متصل می‌شود).

## نصب CLI (برای حالت محلی الزامی است)

Node 24 زمان اجرای پیش‌فرض روی Mac است. Node 22 LTS، که در حال حاضر `22.14+` است، همچنان برای سازگاری کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

دکمه **نصب CLI** در برنامه macOS همان جریان نصب سراسری را اجرا می‌کند که برنامه
در داخل استفاده می‌کند: ابتدا npm را ترجیح می‌دهد، سپس pnpm، سپس bun اگر تنها
مدیر بسته شناسایی‌شده باشد. Node همچنان زمان اجرای توصیه‌شده برای Gateway است.

## launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ نسخه قدیمی `com.openclaw.*` ممکن است باقی بماند)

محل plist (برای هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامه macOS نصب/به‌روزرسانی LaunchAgent را در حالت محلی بر عهده دارد.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw فعال» LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه، gateway را متوقف **نمی‌کند** (launchd آن را زنده نگه می‌دارد).
- اگر یک Gateway از قبل روی پورت پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  راه‌اندازی یک نمونه جدید، به آن متصل می‌شود.

ثبت گزارش:

- stdout/err مربوط به launchd: `/tmp/openclaw/openclaw-gateway.log`

## سازگاری نسخه

برنامه macOS نسخه gateway را با نسخه خودش بررسی می‌کند. اگر ناسازگار باشند،
CLI سراسری را به‌روزرسانی کنید تا با نسخه برنامه مطابقت داشته باشد.

## بررسی دود

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
- [دفترچه عملیاتی Gateway](/fa/gateway)
