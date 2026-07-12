---
read_when:
    - در جست‌وجوی پشتیبانی سیستم‌عامل یا مسیرهای نصب هستید؟
    - تصمیم‌گیری درباره محل اجرای Gateway
summary: نمای کلی پشتیبانی از پلتفرم‌ها (Gateway + برنامه‌های همراه)
title: پلتفرم‌ها
x-i18n:
    generated_at: "2026-07-12T10:21:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

هستهٔ OpenClaw با TypeScript نوشته شده است. **Node محیط اجرای پیشنهادی است**.
استفاده از Bun برای Gateway توصیه نمی‌شود — به‌دلیل مشکلات شناخته‌شده در کانال‌های WhatsApp و
Telegram؛ برای جزئیات، [Bun (آزمایشی)](/fa/install/bun) را ببینید.

برنامه‌های همراه برای Windows Hub، macOS (برنامهٔ نوار منو) و نودهای همراه
(iOS/Android) موجودند. برنامه‌های همراه Linux در دست برنامه‌ریزی هستند، اما Gateway در حال حاضر
به‌طور کامل پشتیبانی می‌شود. در Windows، برای برنامهٔ دسکتاپ Windows Hub، برای استفادهٔ
متمرکز بر ترمینال نصب بومی PowerShell، یا برای محیط اجرای Gateway با بیشترین
سازگاری با Linux، WSL2 را انتخاب کنید.

## سیستم‌عامل خود را انتخاب کنید

- macOS: [macOS](/fa/platforms/macos)
- iOS: [iOS](/fa/platforms/ios)
- Android: [Android](/fa/platforms/android)
- Windows: [Windows](/fa/platforms/windows)
- Linux: [Linux](/fa/platforms/linux)

## سرور خصوصی مجازی و میزبانی

- هاب سرور خصوصی مجازی: [میزبانی سرور خصوصی مجازی](/fa/vps)
- Fly.io: [Fly.io](/fa/install/fly)
- Hetzner (Docker): [Hetzner](/fa/install/hetzner)
- GCP (Compute Engine): [GCP](/fa/install/gcp)
- Azure (ماشین مجازی Linux): [Azure](/fa/install/azure)
- exe.dev (ماشین مجازی + پراکسی HTTPS): [exe.dev](/fa/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/fa/platforms/easyrunner)

## پیوندهای رایج

- راهنمای نصب: [شروع به کار](/fa/start/getting-started)
- Windows Hub: [Windows](/fa/platforms/windows)
- راهنمای عملیاتی Gateway: [Gateway](/fa/gateway)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- وضعیت سرویس: `openclaw gateway status`

## نصب سرویس Gateway ‏(CLI)

از یکی از این روش‌ها استفاده کنید (همه پشتیبانی می‌شوند):

- راهنما (پیشنهادی): `openclaw onboard --install-daemon`
- مستقیم: `openclaw gateway install`
- روند پیکربندی: `openclaw configure` ← **سرویس Gateway** را انتخاب کنید
- تعمیر/مهاجرت: `openclaw doctor` (نصب یا رفع اشکال سرویس را پیشنهاد می‌دهد)

مقصد سرویس به سیستم‌عامل بستگی دارد:

- macOS: ‏LaunchAgent ‏(`ai.openclaw.gateway`، یا `ai.openclaw.<profile>` برای یک پروفایل نام‌گذاری‌شده)
- Linux/WSL2: سرویس کاربری systemd ‏(`openclaw-gateway[-<profile>].service`)
- Windows بومی: وظیفهٔ زمان‌بندی‌شده (`OpenClaw Gateway` یا `OpenClaw Gateway (<profile>)`)، همراه با یک مورد ورود به سیستم در پوشهٔ Startup مخصوص هر کاربر به‌عنوان راهکار جایگزین، اگر ایجاد وظیفه رد شود

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Windows Hub](/fa/platforms/windows)
- [برنامهٔ macOS](/fa/platforms/macos)
- [برنامهٔ iOS](/fa/platforms/ios)
