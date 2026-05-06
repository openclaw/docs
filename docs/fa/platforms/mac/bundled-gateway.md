---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd Gateway در macOS
    - نصب CLI Gateway برای macOS
summary: محیط اجرای Gateway در macOS (سرویس خارجی launchd)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-05-06T09:29:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا runtimeِ Gateway را همراه خود ارائه نمی‌کند. برنامهٔ macOS
انتظار دارد `openclaw` CLI به‌صورت **خارجی** نصب شده باشد، Gateway را به‌عنوان
فرایند فرزند اجرا نمی‌کند، و یک سرویس launchd به‌ازای هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به همان متصل می‌شود).

## نصب CLI (برای حالت محلی الزامی است)

Node 24 runtime پیش‌فرض در Mac است. Node 22 LTS، که اکنون `22.14+` است، همچنان برای سازگاری کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

دکمهٔ **Install CLI** در برنامهٔ macOS همان جریان نصب سراسری را اجرا می‌کند که برنامه
به‌صورت داخلی استفاده می‌کند: ابتدا npm را ترجیح می‌دهد، سپس pnpm، و سپس bun را اگر تنها
مدیر بستهٔ شناسایی‌شده باشد. Node همچنان runtime پیشنهادی برای Gateway است.

## Launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ قالب قدیمی `com.openclaw.*` ممکن است باقی بماند)

محل Plist (به‌ازای هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامهٔ macOS در حالت Local مالک نصب/به‌روزرسانی LaunchAgent است.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw Active» ‏LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه Gateway را متوقف نمی‌کند (launchd آن را زنده نگه می‌دارد).
- اگر Gateway از قبل روی پورت پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  شروع یک نمونهٔ جدید به آن متصل می‌شود.

ثبت گزارش:

- stdout/err مربوط به launchd: `/tmp/openclaw/openclaw-gateway.log`

## سازگاری نسخه

برنامهٔ macOS نسخهٔ gateway را با نسخهٔ خودش بررسی می‌کند. اگر ناسازگار باشند،
CLI سراسری را به‌روزرسانی کنید تا با نسخهٔ برنامه مطابقت داشته باشد.

## بررسی سریع

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

- [برنامهٔ macOS](/fa/platforms/macos)
- [راهنمای عملیاتی Gateway](/fa/gateway)
