---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامهٔ macOS OpenClaw کار می‌کنند
title: راه‌اندازی محیط توسعه macOS
x-i18n:
    generated_at: "2026-05-06T09:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه‌دهنده macOS

برنامه macOS مربوط به OpenClaw را از منبع بسازید و اجرا کنید.

## پیش‌نیازها

پیش از ساخت برنامه، مطمئن شوید موارد زیر نصب شده‌اند:

1. **Xcode 26.2+**: برای توسعه با Swift لازم است.
2. **Node.js 24 و pnpm**: برای Gateway، CLI و اسکریپت‌های بسته‌بندی توصیه می‌شود. Node 22 LTS، که در حال حاضر `22.14+` است، برای سازگاری همچنان پشتیبانی می‌شود.

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

برای حالت‌های اجرای توسعه، پرچم‌های امضا و عیب‌یابی Team ID، README برنامه macOS را ببینید:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **نکته**: برنامه‌هایی که با امضای ad-hoc امضا شده‌اند ممکن است اعلان‌های امنیتی ایجاد کنند. اگر برنامه بلافاصله با پیام "Abort trap 6" از کار می‌افتد، بخش [عیب‌یابی](#troubleshooting) را ببینید.

## 3. نصب CLI

برنامه macOS انتظار دارد یک نصب سراسری از CLI با نام `openclaw` برای مدیریت کارهای پس‌زمینه وجود داشته باشد.

**برای نصب آن (توصیه‌شده):**

1. برنامه OpenClaw را باز کنید.
2. به زبانه تنظیمات **عمومی** بروید.
3. روی **"نصب CLI"** کلیک کنید.

در غیر این صورت، آن را به‌صورت دستی نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز کار می‌کنند.
برای زمان اجرای Gateway، Node همچنان مسیر توصیه‌شده است.

## عیب‌یابی

### ساخت ناموفق است: ناسازگاری زنجیره‌ابزار یا SDK

ساخت برنامه macOS انتظار دارد آخرین SDK مربوط به macOS و زنجیره‌ابزار Swift 6.2 وجود داشته باشد.

**وابستگی‌های سیستم (لازم):**

- **آخرین نسخه macOS موجود در Software Update** (موردنیاز SDKهای Xcode 26.2)
- **Xcode 26.2** (زنجیره‌ابزار Swift 6.2)

**بررسی‌ها:**

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی کنید و ساخت را دوباره اجرا کنید.

### برنامه هنگام اعطای مجوز از کار می‌افتد

اگر برنامه هنگام تلاش برای اجازه دادن به دسترسی **Speech Recognition** یا **Microphone** از کار می‌افتد، ممکن است علت آن خرابی کش TCC یا ناسازگاری امضا باشد.

**رفع مشکل:**

1. مجوزهای TCC را بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر ناموفق بود، `BUNDLE_ID` را به‌طور موقت در [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) تغییر دهید تا macOS را مجبور به شروع از یک «وضعیت پاک» کنید.

### Gateway به‌طور نامحدود روی "Starting..." می‌ماند

اگر وضعیت Gateway روی "Starting..." باقی می‌ماند، بررسی کنید آیا یک فرایند zombie در حال نگه داشتن پورت است یا نه:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی پورت را نگه داشته است، آن فرایند را متوقف کنید (Ctrl+C). به‌عنوان آخرین راه‌حل، PIDای را که در بالا پیدا کردید kill کنید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
