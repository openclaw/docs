---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی اپلیکیشن macOS OpenClaw کار می‌کنند
title: راه‌اندازی محیط توسعه macOS
x-i18n:
    generated_at: "2026-04-29T23:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه‌دهندهٔ macOS

برنامهٔ macOS مربوط به OpenClaw را از کد منبع بسازید و اجرا کنید.

## پیش‌نیازها

پیش از ساخت برنامه، مطمئن شوید موارد زیر را نصب کرده‌اید:

1. **Xcode 26.2+**: برای توسعه با Swift لازم است.
2. **Node.js 24 و pnpm**: برای Gateway، CLI و اسکریپت‌های بسته‌بندی توصیه می‌شود. Node 22 LTS، که در حال حاضر `22.14+` است، همچنان برای سازگاری پشتیبانی می‌شود.

## 1. نصب وابستگی‌ها

وابستگی‌های سراسری پروژه را نصب کنید:

```bash
pnpm install
```

## 2. ساخت و بسته‌بندی برنامه

برای ساخت برنامهٔ macOS و بسته‌بندی آن در `dist/OpenClaw.app` اجرا کنید:

```bash
./scripts/package-mac-app.sh
```

اگر گواهی Apple Developer ID ندارید، اسکریپت به‌صورت خودکار از **امضای موقت** (`-`) استفاده می‌کند.

برای حالت‌های اجرای توسعه، پرچم‌های امضا و رفع اشکال شناسهٔ تیم، README برنامهٔ macOS را ببینید:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **نکته**: برنامه‌های دارای امضای موقت ممکن است اعلان‌های امنیتی نمایش دهند. اگر برنامه بلافاصله با «Abort trap 6» کرش می‌کند، بخش [رفع اشکال](#troubleshooting) را ببینید.

## 3. نصب CLI

برنامهٔ macOS انتظار دارد یک نصب سراسری از CLI با نام `openclaw` برای مدیریت وظایف پس‌زمینه وجود داشته باشد.

**برای نصب آن (توصیه‌شده):**

1. برنامهٔ OpenClaw را باز کنید.
2. به زبانهٔ تنظیمات **عمومی** بروید.
3. روی **«نصب CLI»** کلیک کنید.

در غیر این صورت، آن را دستی نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز کار می‌کنند.
برای زمان اجرای Gateway، Node همچنان مسیر توصیه‌شده است.

## رفع اشکال

### ساخت شکست می‌خورد: ناسازگاری زنجیره‌ابزار یا SDK

ساخت برنامهٔ macOS انتظار دارد جدیدترین SDK مربوط به macOS و زنجیره‌ابزار Swift 6.2 در دسترس باشد.

**وابستگی‌های سیستم (ضروری):**

- **جدیدترین نسخهٔ macOS موجود در به‌روزرسانی نرم‌افزار** (مورد نیاز SDKهای Xcode 26.2)
- **Xcode 26.2** (زنجیره‌ابزار Swift 6.2)

**بررسی‌ها:**

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی کنید و ساخت را دوباره اجرا کنید.

### برنامه هنگام اعطای مجوز کرش می‌کند

اگر برنامه هنگام تلاش برای اجازه دادن به دسترسی **تشخیص گفتار** یا **میکروفون** کرش می‌کند، ممکن است علت آن خرابی کش TCC یا ناسازگاری امضا باشد.

**راه‌حل:**

1. مجوزهای TCC را بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر این کار ناموفق بود، `BUNDLE_ID` را به‌صورت موقت در [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) تغییر دهید تا macOS را وادار کنید از یک وضعیت «کاملاً پاک» شروع کند.

### Gateway به‌طور نامحدود روی «Starting...» می‌ماند

اگر وضعیت Gateway روی «Starting...» می‌ماند، بررسی کنید آیا یک فرایند زامبی پورت را نگه داشته است یا نه:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی پورت را نگه داشته است، آن فرایند را متوقف کنید (Ctrl+C). به‌عنوان آخرین راه‌حل، PIDی را که در بالا پیدا کردید از بین ببرید.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
