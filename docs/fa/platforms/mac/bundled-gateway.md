---
read_when:
    - بسته‌بندی OpenClaw.app
    - اشکال‌زدایی سرویس launchd در macOS برای Gateway
    - نصب CLI مربوط به Gateway برای macOS
summary: زمان اجرای Gateway در macOS (سرویس خارجی launchd)
title: Gateway در macOS
x-i18n:
    generated_at: "2026-07-04T06:43:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app دیگر Node/Bun یا runtime مربوط به Gateway را همراه خود ارائه نمی‌کند. برنامه macOS
انتظار دارد نصب **خارجی** از CLI `openclaw` وجود داشته باشد، Gateway را به‌عنوان
فرایند فرزند اجرا نمی‌کند، و یک سرویس launchd مخصوص هر کاربر را مدیریت می‌کند تا Gateway
در حال اجرا بماند (یا اگر یک Gateway محلی از قبل در حال اجرا باشد، به همان متصل می‌شود).

## راه‌اندازی خودکار

روی یک Mac تازه، هنگام راه‌اندازی اولیه **این Mac** را انتخاب کنید. برنامه پیش از جادوگر Gateway،
نصاب امضاشده و همراه خود را اجرا می‌کند، یک runtime کاربرمحور Node
و CLI متناظر `openclaw` را زیر `~/.openclaw` نصب می‌کند، سپس سرویس launchd
مخصوص هر کاربر را نصب و راه‌اندازی می‌کند. این مسیر به Terminal، Homebrew یا
دسترسی مدیر نیاز ندارد.

برنامه اسکریپت نصاب را همراه دارد، نه بار Node یا Gateway را. بنابراین راه‌اندازی
برای دانلود runtime و بسته متناظر OpenClaw به اتصال اینترنت نیاز دارد.

## بازیابی دستی

Node 24 برای نصب دستی توصیه می‌شود. Node 22 LTS، در حال حاضر `22.19+`،
نیز کار می‌کند. سپس `openclaw` را به‌صورت سراسری نصب کنید:

```bash
npm install -g openclaw@<version>
```

پس از راه‌اندازی خودکار ناموفق، از **تلاش دوباره برای راه‌اندازی** استفاده کنید. اگر باز هم ناموفق بود،
CLI را با دستور بالا به‌صورت دستی نصب کنید، سپس در راه‌اندازی اولیه **بررسی دوباره** را انتخاب کنید.
Node همچنان runtime توصیه‌شده برای Gateway است.

## Launchd (Gateway به‌عنوان LaunchAgent)

برچسب:

- `ai.openclaw.gateway` (یا `ai.openclaw.<profile>`؛ `com.openclaw.*` قدیمی ممکن است باقی بماند)

محل Plist (مخصوص هر کاربر):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (یا `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

مدیر:

- برنامه macOS نصب/به‌روزرسانی LaunchAgent را در حالت محلی مالکیت می‌کند.
- CLI نیز می‌تواند آن را نصب کند: `openclaw gateway install`.

رفتار:

- «OpenClaw فعال» LaunchAgent را فعال/غیرفعال می‌کند.
- خروج از برنامه Gateway را متوقف نمی‌کند (launchd آن را زنده نگه می‌دارد).
- اگر یک Gateway از قبل روی پورت پیکربندی‌شده در حال اجرا باشد، برنامه به‌جای
  شروع نمونه‌ای جدید، به همان متصل می‌شود.

لاگ‌گیری:

- stdout مربوط به launchd: `~/Library/Logs/openclaw/gateway.log` (پروفایل‌ها از `gateway-<profile>.log` استفاده می‌کنند)
- stderr مربوط به launchd: سرکوب‌شده

## سازگاری نسخه

برنامه macOS نسخه Gateway را با نسخه خودش بررسی می‌کند. وقتی CLI موجود نیست یا
ناسازگار است، راه‌اندازی اولیه به‌طور خودکار راه‌اندازی مدیریت‌شده را اجرا می‌کند.
برای تکرار نصب از **تلاش دوباره برای راه‌اندازی** استفاده کنید یا پس از تعمیر یک CLI خارجی
**بررسی دوباره** را انتخاب کنید.

## پوشه وضعیت روی macOS

وضعیت OpenClaw را روی یک دیسک محلی و غیرهمگام‌سازی‌شده نگه دارید. از iCloud Drive و پوشه‌های
دیگر همگام‌شده با ابر پرهیز کنید، چون تاخیر همگام‌سازی و قفل‌های فایل می‌توانند روی نشست‌ها،
اعتبارنامه‌ها و وضعیت Gateway اثر بگذارند.

`OPENCLAW_STATE_DIR` را فقط وقتی به بازنویسی نیاز دارید روی یک مسیر محلی تنظیم کنید.
`openclaw doctor` درباره مسیرهای رایج وضعیت که با ابر همگام می‌شوند هشدار می‌دهد و توصیه می‌کند
به ذخیره‌سازی محلی برگردید. ببینید
[متغیرهای محیطی](/fa/help/environment#path-related-env-vars) و
[Doctor](/fa/gateway/doctor).

## اشکال‌زدایی اتصال برنامه

از CLI اشکال‌زدایی macOS از یک checkout منبع استفاده کنید تا همان دست‌دهی WebSocket مربوط به Gateway
و منطق کشف را که برنامه استفاده می‌کند اجرا کنید:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` گزینه‌های `--url`، `--token`، `--timeout` و `--json` را می‌پذیرد. `discover`
گزینه‌های `--timeout`، `--json` و `--include-local` را می‌پذیرد. وقتی لازم است کشف CLI
را از مشکلات اتصال سمت برنامه جدا کنید، خروجی کشف را با `openclaw gateway discover --json` مقایسه کنید.

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
- [runbook مربوط به Gateway](/fa/gateway)
