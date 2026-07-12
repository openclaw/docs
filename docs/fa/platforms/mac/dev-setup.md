---
read_when:
    - راه‌اندازی محیط توسعه macOS
summary: راهنمای راه‌اندازی برای توسعه‌دهندگانی که روی برنامه macOS اوپن‌کلاو کار می‌کنند
title: راه‌اندازی محیط توسعه در macOS
x-i18n:
    generated_at: "2026-07-12T10:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# راه‌اندازی توسعه در macOS

برنامه macOS ‏OpenClaw را از کد منبع بسازید و اجرا کنید.

## پیش‌نیازها

- **Xcode 26.2+** (زنجیره‌ابزار Swift 6.2)، روی جدیدترین نسخه macOS موجود در
  Software Update.
- **Node.js 24 و pnpm** برای Gateway، ‏CLI و اسکریپت‌های بسته‌بندی. Node
  22.19+ نیز کار می‌کند.

## ۱. نصب وابستگی‌ها

```bash
pnpm install
```

## ۲. ساخت و بسته‌بندی برنامه

```bash
./scripts/package-mac-app.sh
```

خروجی در `dist/OpenClaw.app` قرار می‌گیرد. اگر گواهی Apple Developer ID موجود نباشد،
اسکریپت از امضای موقت استفاده می‌کند.

برای حالت‌های اجرای توسعه، پرچم‌های امضا و عیب‌یابی Team ID، به
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)
مراجعه کنید. چرخه سریع توسعه از ریشه مخزن: `scripts/restart-mac.sh` (برای
امضای موقت، `--no-sign` را اضافه کنید؛ مجوزهای TCC با `--no-sign` پایدار نمی‌مانند).

<Note>
برنامه‌هایی با امضای موقت ممکن است هشدارهای امنیتی ایجاد کنند. اگر برنامه
بلافاصله با پیام «Abort trap 6» از کار افتاد، به [عیب‌یابی](#troubleshooting) مراجعه کنید.
</Note>

## ۳. نصب CLI و Gateway

برنامه بسته‌بندی‌شده، نصب‌کننده مرجع `scripts/install-cli.sh` را در خود دارد. در یک
پروفایل تازه، هنگام راه‌اندازی اولیه **This Mac** را انتخاب کنید؛ برنامه پیش از آغاز
دستیار Gateway، ‏CLI و محیط اجرای فضای کاربری منطبق را نصب می‌کند.

برای بازیابی دستی محیط توسعه، ‏CLI منطبق را خودتان نصب کنید:

```bash
npm install -g openclaw@<version>
```

دستورهای `pnpm add -g openclaw@<version>` و `bun add -g openclaw@<version>` نیز
کار می‌کنند. Node همچنان محیط اجرای توصیه‌شده برای خود Gateway است.

## عیب‌یابی

### شکست ساخت: ناهماهنگی زنجیره‌ابزار یا SDK

ساخت برنامه macOS به جدیدترین SDK سیستم macOS و زنجیره‌ابزار Swift 6.2
نیاز دارد (Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

اگر نسخه‌ها مطابقت ندارند، macOS/Xcode را به‌روزرسانی و ساخت را دوباره اجرا کنید.

### از کار افتادن برنامه هنگام اعطای مجوز

اگر هنگام تلاش برای اجازه‌دادن دسترسی **Speech Recognition** یا
**Microphone** برنامه از کار می‌افتد، ممکن است کش TCC خراب یا امضا ناهماهنگ باشد.

۱. مجوزهای TCC را برای شناسه بسته اشکال‌زدایی بازنشانی کنید:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

۲. اگر این کار موفق نبود، به‌طور موقت `BUNDLE_ID` را در
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   تغییر دهید تا macOS از یک وضعیت کاملاً پاک آغاز کند.

### ماندن Gateway برای همیشه روی «Starting...»

بررسی کنید آیا یک فرایند معلق درگاه را در اختیار دارد:

```bash
openclaw gateway status
openclaw gateway stop

# اگر از LaunchAgent استفاده نمی‌کنید (حالت توسعه / اجراهای دستی)، فرایند شنونده را پیدا کنید:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

اگر یک اجرای دستی درگاه را در اختیار دارد، آن را متوقف کنید (Ctrl+C)، یا به‌عنوان
آخرین راه‌حل، PID یافت‌شده در بالا را خاتمه دهید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [نمای کلی نصب](/fa/install)
