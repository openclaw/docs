---
read_when:
    - در جست‌وجوی پشتیبانی سیستم‌عامل یا مسیرهای نصب
    - تصمیم‌گیری درباره محل اجرای Gateway
summary: نمای کلی پشتیبانی از پلتفرم (Gateway + برنامه‌های همراه)
title: پلتفرم‌ها
x-i18n:
    generated_at: "2026-05-06T09:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

هسته OpenClaw با TypeScript نوشته شده است. **Node زمان اجرای توصیه‌شده است**.
Bun برای Gateway توصیه نمی‌شود — مشکلات شناخته‌شده‌ای با کانال‌های WhatsApp و
Telegram دارد؛ برای جزئیات به [Bun (آزمایشی)](/fa/install/bun) مراجعه کنید.

اپ‌های همراه برای macOS (اپ نوار منو) و Nodeهای موبایل (iOS/Android) وجود دارند. اپ‌های همراه Windows و
Linux برنامه‌ریزی شده‌اند، اما Gateway امروز به‌طور کامل پشتیبانی می‌شود.
اپ‌های همراه بومی برای Windows نیز برنامه‌ریزی شده‌اند؛ استفاده از Gateway از طریق WSL2 توصیه می‌شود.

## سیستم‌عامل خود را انتخاب کنید

- macOS: [macOS](/fa/platforms/macos)
- iOS: [iOS](/fa/platforms/ios)
- Android: [Android](/fa/platforms/android)
- Windows: [Windows](/fa/platforms/windows)
- Linux: [Linux](/fa/platforms/linux)

## VPS و میزبانی

- مرکز VPS: [میزبانی VPS](/fa/vps)
- Fly.io: [Fly.io](/fa/install/fly)
- Hetzner (Docker): [Hetzner](/fa/install/hetzner)
- GCP (Compute Engine): [GCP](/fa/install/gcp)
- Azure (Linux VM): [Azure](/fa/install/azure)
- exe.dev (VM + پروکسی HTTPS): [exe.dev](/fa/install/exe-dev)

## پیوندهای رایج

- راهنمای نصب: [شروع به کار](/fa/start/getting-started)
- راهنمای عملیاتی Gateway: [Gateway](/fa/gateway)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- وضعیت سرویس: `openclaw gateway status`

## نصب سرویس Gateway (CLI)

از یکی از این‌ها استفاده کنید (همگی پشتیبانی می‌شوند):

- جادوگر (توصیه‌شده): `openclaw onboard --install-daemon`
- مستقیم: `openclaw gateway install`
- جریان پیکربندی: `openclaw configure` → **سرویس Gateway** را انتخاب کنید
- تعمیر/مهاجرت: `openclaw doctor` (پیشنهاد نصب یا رفع مشکل سرویس را می‌دهد)

هدف سرویس به سیستم‌عامل بستگی دارد:

- macOS: LaunchAgent (`ai.openclaw.gateway` یا `ai.openclaw.<profile>`؛ قدیمی: `com.openclaw.*`)
- Linux/WSL2: سرویس کاربر systemd (`openclaw-gateway[-<profile>].service`)
- Windows بومی: Scheduled Task (`OpenClaw Gateway` یا `OpenClaw Gateway (<profile>)`)، با یک آیتم ورود پوشه Startup برای هر کاربر به‌عنوان جایگزین در صورت رد شدن ایجاد task

## مرتبط

- [نمای کلی نصب](/fa/install)
- [اپ macOS](/fa/platforms/macos)
- [اپ iOS](/fa/platforms/ios)
