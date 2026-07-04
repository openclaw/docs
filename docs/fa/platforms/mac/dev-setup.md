---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامه macOS OpenClaw کار می‌کنند
title: راه‌اندازی توسعه macOS
x-i18n:
    generated_at: "2026-07-04T06:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه‌دهنده macOS

برنامه macOS متعلق به OpenClaw را از روی منبع بسازید و اجرا کنید.

## پیش‌نیازها

پیش از ساخت برنامه، مطمئن شوید موارد زیر را نصب کرده‌اید:

1. **Xcode 26.2+**: برای توسعه Swift لازم است.
2. **Node.js 24 و pnpm**: برای Gateway، CLI و اسکریپت‌های بسته‌بندی توصیه می‌شود. Node 22 LTS، که در حال حاضر `22.19+` است، همچنان برای سازگاری پشتیبانی می‌شود.

## 1. نصب وابستگی‌ها

وابستگی‌های کل پروژه را نصب کنید:

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

> **نکته**: برنامه‌های امضاشده با ad-hoc ممکن است اعلان‌های امنیتی ایجاد کنند. اگر برنامه بلافاصله با "Abort trap 6" کرش کرد، بخش [عیب‌یابی](#troubleshooting) را ببینید.

## 3. نصب CLI و Gateway

برنامه بسته‌بندی‌شده نصب‌کننده مرجع `scripts/install-cli.sh` را در خود دارد. در یک
پروفایل تازه، هنگام راه‌اندازی اولیه **این Mac** را انتخاب کنید؛ برنامه پیش از
شروع ویزارد Gateway، CLI و runtime منطبق در فضای کاربر را نصب می‌کند.

برای بازیابی دستی در توسعه، CLI منطبق را خودتان نصب کنید:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز کار می‌کنند.
برای runtime مربوط به Gateway، Node همچنان مسیر توصیه‌شده است.

## عیب‌یابی

### ساخت ناموفق است: ناسازگاری زنجیره‌ابزار یا SDK

ساخت برنامه macOS به آخرین macOS SDK و زنجیره‌ابزار Swift 6.2 نیاز دارد.

**وابستگی‌های سیستم (الزامی):**

- **آخرین نسخه macOS موجود در Software Update** (مورد نیاز SDKهای Xcode 26.2)
- **Xcode 26.2** (زنجیره‌ابزار Swift 6.2)

**بررسی‌ها:**

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی کنید و ساخت را دوباره اجرا کنید.

### برنامه هنگام اعطای مجوز کرش می‌کند

اگر برنامه هنگام تلاش برای اجازه دادن به دسترسی **Speech Recognition** یا **Microphone** کرش می‌کند، ممکن است علت آن خرابی کش TCC یا ناسازگاری امضا باشد.

**رفع مشکل:**

1. مجوزهای TCC را بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. اگر این کار ناموفق بود، `BUNDLE_ID` را به‌طور موقت در [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) تغییر دهید تا macOS مجبور شود از یک «شروع پاک» استفاده کند.

### Gateway به‌طور نامحدود روی «در حال شروع...» می‌ماند

اگر وضعیت Gateway روی «در حال شروع...» باقی ماند، بررسی کنید آیا یک فرایند zombie پورت را نگه داشته است یا نه:

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
