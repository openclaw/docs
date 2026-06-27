---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامه macOS OpenClaw کار می‌کنند
title: راه‌اندازی توسعه macOS
x-i18n:
    generated_at: "2026-06-27T18:07:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه‌دهنده macOS

برنامه macOS OpenClaw را از منبع بسازید و اجرا کنید.

## پیش‌نیازها

پیش از ساخت برنامه، مطمئن شوید موارد زیر را نصب کرده‌اید:

1. **Xcode 26.2+**: برای توسعه Swift لازم است.
2. **Node.js 24 و pnpm**: برای gateway، CLI، و اسکریپت‌های بسته‌بندی توصیه می‌شود. Node 22 LTS، که در حال حاضر `22.19+` است، برای سازگاری همچنان پشتیبانی می‌شود.

## 1. نصب وابستگی‌ها

وابستگی‌های سراسری پروژه را نصب کنید:

```bash
pnpm install
```

## 2. ساخت و بسته‌بندی برنامه

برای ساخت برنامه macOS و بسته‌بندی آن در `dist/OpenClaw.app`، اجرا کنید:

```bash
./scripts/package-mac-app.sh
```

اگر گواهی Apple Developer ID ندارید، اسکریپت به‌صورت خودکار از **امضای ad-hoc** (`-`) استفاده می‌کند.

برای حالت‌های اجرای توسعه، پرچم‌های امضا، و عیب‌یابی Team ID، README برنامه macOS را ببینید:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **نکته**: برنامه‌های امضاشده با ad-hoc ممکن است اعلان‌های امنیتی ایجاد کنند. اگر برنامه بلافاصله با «Abort trap 6» خراب می‌شود، بخش [عیب‌یابی](#troubleshooting) را ببینید.

## 3. نصب CLI

برنامه macOS انتظار دارد یک نصب سراسری `openclaw` CLI برای مدیریت کارهای پس‌زمینه وجود داشته باشد.

**برای نصب آن (توصیه‌شده):**

1. برنامه OpenClaw را باز کنید.
2. به زبانه تنظیمات **General** بروید.
3. روی **"Install CLI"** کلیک کنید.

یا آن را به‌صورت دستی نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز کار می‌کنند.
برای زمان اجرای Gateway، Node همچنان مسیر توصیه‌شده است.

## عیب‌یابی

### ساخت ناموفق است: عدم تطابق زنجیره ابزار یا SDK

ساخت برنامه macOS انتظار آخرین SDK macOS و زنجیره ابزار Swift 6.2 را دارد.

**وابستگی‌های سیستم (ضروری):**

- **آخرین نسخه macOS موجود در Software Update** (موردنیاز SDKهای Xcode 26.2)
- **Xcode 26.2** (زنجیره ابزار Swift 6.2)

**بررسی‌ها:**

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی کنید و ساخت را دوباره اجرا کنید.

### برنامه هنگام اعطای مجوز خراب می‌شود

اگر برنامه هنگام تلاش برای اجازه دادن به دسترسی **Speech Recognition** یا **Microphone** خراب می‌شود، ممکن است به دلیل خرابی کش TCC یا عدم تطابق امضا باشد.

**رفع مشکل:**

1. مجوزهای TCC را بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر این کار ناموفق بود، `BUNDLE_ID` را به‌طور موقت در [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) تغییر دهید تا macOS مجبور شود از یک «clean slate» استفاده کند.

### Gateway به‌طور نامحدود روی "Starting..." می‌ماند

اگر وضعیت gateway روی «Starting...» می‌ماند، بررسی کنید آیا یک فرایند zombie پورت را نگه داشته است:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی پورت را نگه داشته است، آن فرایند را متوقف کنید (Ctrl+C). به‌عنوان آخرین راهکار، PIDای را که در بالا پیدا کردید بکشید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
