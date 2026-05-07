---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامه macOS OpenClaw کار می‌کنند
title: راه‌اندازی محیط توسعه macOS
x-i18n:
    generated_at: "2026-05-07T13:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه‌دهنده macOS

برنامه macOS مربوط به OpenClaw را از منبع بسازید و اجرا کنید.

## پیش‌نیازها

پیش از ساخت برنامه، مطمئن شوید موارد زیر را نصب کرده‌اید:

1. **Xcode 26.2+**: برای توسعه Swift لازم است.
2. **Node.js 24 و pnpm**: برای Gateway، CLI و اسکریپت‌های بسته‌بندی توصیه می‌شود. Node 22 LTS، در حال حاضر `22.16+`، همچنان برای سازگاری پشتیبانی می‌شود.

## 1. نصب وابستگی‌ها

وابستگی‌های سراسر پروژه را نصب کنید:

```bash
pnpm install
```

## 2. ساخت و بسته‌بندی برنامه

برای ساخت برنامه macOS و بسته‌بندی آن در `dist/OpenClaw.app`، اجرا کنید:

```bash
./scripts/package-mac-app.sh
```

اگر گواهی Apple Developer ID ندارید، اسکریپت به‌طور خودکار از **امضای ad-hoc** (`-`) استفاده می‌کند.

برای حالت‌های اجرای توسعه، پرچم‌های امضا و عیب‌یابی Team ID، README برنامه macOS را ببینید:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **نکته**: برنامه‌های امضاشده به‌صورت ad-hoc ممکن است اعلان‌های امنیتی ایجاد کنند. اگر برنامه بلافاصله با "Abort trap 6" خراب شد، بخش [عیب‌یابی](#troubleshooting) را ببینید.

## 3. نصب CLI

برنامه macOS برای مدیریت کارهای پس‌زمینه انتظار دارد CLI سراسری `openclaw` نصب باشد.

**برای نصب آن (توصیه‌شده):**

1. برنامه OpenClaw را باز کنید.
2. به زبانه تنظیمات **General** بروید.
3. روی **"Install CLI"** کلیک کنید.

همچنین می‌توانید آن را به‌صورت دستی نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز کار می‌کنند.
برای زمان اجرای Gateway، Node همچنان مسیر توصیه‌شده است.

## عیب‌یابی

### ساخت ناموفق است: ناهماهنگی زنجیره‌ابزار یا SDK

ساخت برنامه macOS به آخرین SDK macOS و زنجیره‌ابزار Swift 6.2 نیاز دارد.

**وابستگی‌های سیستم (الزامی):**

- **آخرین نسخه macOS موجود در Software Update** (موردنیاز SDKهای Xcode 26.2)
- **Xcode 26.2** (زنجیره‌ابزار Swift 6.2)

**بررسی‌ها:**

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی کنید و ساخت را دوباره اجرا کنید.

### برنامه هنگام اعطای مجوز خراب می‌شود

اگر هنگام تلاش برای اجازه دادن به دسترسی **Speech Recognition** یا **Microphone** برنامه خراب می‌شود، ممکن است به‌دلیل خرابی کش TCC یا ناهماهنگی امضا باشد.

**رفع مشکل:**

1. مجوزهای TCC را بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر این کار ناموفق بود، `BUNDLE_ID` را موقتاً در [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) تغییر دهید تا macOS را مجبور کنید از یک «لوح پاک» شروع کند.

### Gateway به‌طور نامحدود روی "Starting..." می‌ماند

اگر وضعیت Gateway روی "Starting..." باقی می‌ماند، بررسی کنید آیا یک فرایند زامبی پورت را نگه داشته است یا نه:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی پورت را نگه داشته است، آن فرایند را متوقف کنید (Ctrl+C). به‌عنوان آخرین راهکار، PID پیدا شده در بالا را بکشید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
