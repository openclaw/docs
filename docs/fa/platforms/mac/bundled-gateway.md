---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd متعلق به Gateway در macOS
    - نصب CLI درگاه برای macOS
summary: زمان اجرای Gateway در macOS (سرویس خارجی launchd)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-06-28T00:13:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا زمان‌اجرای Gateway را همراه خود ارائه نمی‌کند. برنامه macOS
انتظار دارد CLI **خارجی** `openclaw` نصب شده باشد، Gateway را به‌عنوان
فرایند فرزند اجرا نمی‌کند، و یک سرویس launchd مخصوص هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به همان متصل می‌شود).

## نصب CLI (برای حالت محلی الزامی است)

Node 24 زمان‌اجرای پیش‌فرض روی Mac است. Node 22 LTS، که در حال حاضر `22.19+` است، همچنان برای سازگاری کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

دکمه **Install CLI** در برنامه macOS همان جریان نصب سراسری را اجرا می‌کند که برنامه
در داخل استفاده می‌کند: ابتدا npm را ترجیح می‌دهد، سپس pnpm، و بعد bun اگر تنها
مدیر بسته شناسایی‌شده باشد. Node همچنان زمان‌اجرای پیشنهادی Gateway است.

## Launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ `com.openclaw.*` قدیمی ممکن است باقی بماند)

مکان Plist (برای هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامه macOS مالک نصب/به‌روزرسانی LaunchAgent در حالت Local است.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw Active» LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه Gateway را متوقف **نمی‌کند** (launchd آن را زنده نگه می‌دارد).
- اگر Gateway از قبل روی پورت پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  شروع نمونه‌ای جدید، به آن متصل می‌شود.

ثبت گزارش:

- stdout مربوط به launchd: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند)
- stderr مربوط به launchd: سرکوب‌شده

## سازگاری نسخه

برنامه macOS نسخه gateway را با نسخه خودش بررسی می‌کند. اگر ناسازگار باشند،
CLI سراسری را به‌روزرسانی کنید تا با نسخه برنامه مطابقت داشته باشد.

## پوشه وضعیت در macOS

وضعیت OpenClaw را روی یک دیسک محلی و غیرهمگام‌سازی‌شده نگه دارید. از iCloud Drive و دیگر
پوشه‌های همگام‌شده با ابر اجتناب کنید، زیرا تأخیر همگام‌سازی و قفل‌های فایل می‌توانند روی نشست‌ها،
اعتبارنامه‌ها، و وضعیت Gateway اثر بگذارند.

`OPENCLAW_STATE_DIR` را فقط زمانی روی یک مسیر محلی تنظیم کنید که به override نیاز دارید.
`openclaw doctor` درباره مسیرهای رایج وضعیت که با ابر همگام می‌شوند هشدار می‌دهد و توصیه می‌کند
به ذخیره‌سازی محلی برگردید. ببینید
[متغیرهای محیطی](/fa/help/environment#path-related-env-vars) و
[Doctor](/fa/gateway/doctor).

## اشکال‌زدایی اتصال برنامه

از CLI اشکال‌زدایی macOS در یک source checkout استفاده کنید تا همان منطق دست‌دهی WebSocket
و کشف Gateway را که برنامه استفاده می‌کند اجرا کنید:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` گزینه‌های `--url`، `--token`، `--timeout`، و `--json` را می‌پذیرد. `discover`
گزینه‌های `--timeout`، `--json`، و `--include-local` را می‌پذیرد. وقتی لازم است کشف CLI
را از مشکلات اتصال سمت برنامه جدا کنید، خروجی کشف را با `openclaw gateway discover --json`
مقایسه کنید.

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
