---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامه macOS ‏OpenClaw کار می‌کنند
title: راه‌اندازی محیط توسعه در macOS
x-i18n:
    generated_at: "2026-07-16T16:38:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی محیط توسعه macOS

برنامه OpenClaw برای macOS را از کد منبع بسازید و اجرا کنید.

## پیش‌نیازها

- **Xcode 26.2+** (زنجیره‌ابزار Swift 6.2)، روی جدیدترین نسخه macOS موجود در
  Software Update.
- **Node.js 24.15+ و pnpm** برای Gateway، CLI و اسکریپت‌های بسته‌بندی. Node
  22.22.3+ نیز کار می‌کند.

## 1. نصب وابستگی‌ها

```bash
pnpm install
```

## 2. ساخت و بسته‌بندی برنامه

```bash
./scripts/package-mac-app.sh
```

خروجی در `dist/OpenClaw.app` قرار می‌گیرد. بدون گواهی Apple Developer ID،
اسکریپت از امضای موقت استفاده می‌کند.

برای حالت‌های اجرای توسعه، پرچم‌های امضا و عیب‌یابی Team ID، به
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md) مراجعه کنید.
چرخه سریع توسعه از ریشه مخزن: `scripts/restart-mac.sh` (برای امضای موقت،
`--no-sign` را اضافه کنید؛ مجوزهای TCC با `--no-sign` پایدار نمی‌مانند).

<Note>
برنامه‌هایی با امضای موقت ممکن است اعلان‌های امنیتی ایجاد کنند. اگر برنامه
بلافاصله با خطای "Abort trap 6" از کار افتاد، به [عیب‌یابی](#troubleshooting) مراجعه کنید.
</Note>

## 3. نصب CLI و Gateway

برنامه بسته‌بندی‌شده، نصب‌کننده رسمی `scripts/install-cli.sh` را در خود دارد. در یک
پروفایل جدید، هنگام راه‌اندازی اولیه **This Mac** را انتخاب کنید؛ برنامه پیش از شروع
راهنمای Gateway، CLI و محیط اجرای منطبق در فضای کاربری را نصب می‌کند.

برای بازیابی دستی محیط توسعه، CLI منطبق را خودتان نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز
کار می‌کنند. Node همچنان محیط اجرای توصیه‌شده برای خود Gateway است.

## عیب‌یابی

### شکست ساخت: ناهماهنگی زنجیره‌ابزار یا SDK

ساخت برنامه macOS به جدیدترین SDK سیستم‌عامل macOS و زنجیره‌ابزار Swift 6.2
(Xcode 26.2+) نیاز دارد.

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی و ساخت را دوباره اجرا کنید.

### از کار افتادن برنامه هنگام اعطای مجوز

اگر برنامه هنگام تلاش برای اجازه‌دادن دسترسی **Speech Recognition** یا
**Microphone** از کار می‌افتد، ممکن است حافظه نهان TCC خراب شده یا امضا ناهماهنگ باشد.

1. مجوزهای TCC را برای شناسه بسته اشکال‌زدایی بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر این کار ناموفق بود، موقتاً `BUNDLE_ID` را در
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   تغییر دهید تا macOS از ابتدا و با وضعیت پاک شروع کند.

### ماندن نامحدود Gateway روی "Starting..."

بررسی کنید که آیا فرایندی رهاشده پورت را در اختیار دارد:

```bash
openclaw gateway status
openclaw gateway stop

# اگر از LaunchAgent استفاده نمی‌کنید (حالت توسعه / اجرای دستی)، فرایند شنونده را پیدا کنید:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی پورت را در اختیار دارد، آن را متوقف کنید (Ctrl+C)، یا به‌عنوان
آخرین راه‌حل، PID یافت‌شده در بالا را خاتمه دهید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
