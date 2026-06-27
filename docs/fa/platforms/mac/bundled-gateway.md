---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd مربوط به Gateway در macOS
    - نصب CLI Gateway برای macOS
summary: زمان اجرای Gateway در macOS (سرویس خارجی launchd)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-06-27T18:07:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا زمان‌اجرای Gateway را همراه خود ارائه نمی‌کند. برنامه macOS
انتظار دارد `openclaw` CLI به‌صورت **خارجی** نصب شده باشد، Gateway را به‌عنوان
فرایند فرزند اجرا نمی‌کند، و یک سرویس launchd مخصوص هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به آن متصل می‌شود).

## نصب CLI (برای حالت محلی الزامی است)

Node 24 زمان‌اجرای پیش‌فرض روی Mac است. Node 22 LTS، در حال حاضر `22.19+`، همچنان برای سازگاری کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

دکمه **Install CLI** در برنامه macOS همان جریان نصب سراسری را اجرا می‌کند که برنامه
در داخل استفاده می‌کند: ابتدا npm را ترجیح می‌دهد، سپس pnpm، و سپس bun را اگر تنها
مدیر بسته شناسایی‌شده باشد. Node همچنان زمان‌اجرای توصیه‌شده برای Gateway است.

## Launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ `com.openclaw.*` قدیمی ممکن است باقی بماند)

محل Plist (برای هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامه macOS مالک نصب/به‌روزرسانی LaunchAgent در حالت Local است.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw Active»‏ LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه، gateway را متوقف نمی‌کند (launchd آن را زنده نگه می‌دارد).
- اگر یک Gateway از قبل روی درگاه پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  شروع یک نمونه جدید، به آن متصل می‌شود.

ثبت گزارش:

- stdout مربوط به launchd: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند)
- stderr مربوط به launchd: سرکوب‌شده

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
- [راهنمای عملیاتی Gateway](/fa/gateway)
