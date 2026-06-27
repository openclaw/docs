---
read_when:
    - به دنبال پشتیبانی سیستم‌عامل یا مسیرهای نصب
    - تصمیم‌گیری دربارهٔ محل اجرای Gateway
summary: نمای کلی پشتیبانی پلتفرم (Gateway + اپلیکیشن‌های همراه)
title: پلتفرم‌ها
x-i18n:
    generated_at: "2026-06-27T18:06:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

هسته OpenClaw با TypeScript نوشته شده است. **Node زمان اجرای پیشنهادی است**.
Bun برای Gateway توصیه نمی‌شود؛ به‌دلیل مشکلات شناخته‌شده با کانال‌های WhatsApp و
Telegram. برای جزئیات، [Bun (آزمایشی)](/fa/install/bun) را ببینید.

برنامه‌های همراه برای Windows Hub، macOS (برنامه نوار منو)، و گره‌های موبایل
(iOS/Android) وجود دارند. برنامه‌های همراه Linux برنامه‌ریزی شده‌اند، اما Gateway امروز
به‌طور کامل پشتیبانی می‌شود. در Windows، برای برنامه دسکتاپ Windows Hub را انتخاب کنید،
برای استفاده ترمینال‌محور نصب بومی PowerShell را انتخاب کنید، یا برای سازگارترین زمان اجرای
Gateway با Linux از WSL2 استفاده کنید.

## سیستم‌عامل خود را انتخاب کنید

- macOS: [macOS](/fa/platforms/macos)
- iOS: [iOS](/fa/platforms/ios)
- Android: [Android](/fa/platforms/android)
- Windows: [Windows](/fa/platforms/windows)
- Linux: [Linux](/fa/platforms/linux)

## VPS و میزبانی

- هاب VPS: [میزبانی VPS](/fa/vps)
- Fly.io: [Fly.io](/fa/install/fly)
- Hetzner (Docker): [Hetzner](/fa/install/hetzner)
- GCP (Compute Engine): [GCP](/fa/install/gcp)
- Azure (Linux VM): [Azure](/fa/install/azure)
- exe.dev (VM + پروکسی HTTPS): [exe.dev](/fa/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/fa/platforms/easyrunner)

## پیوندهای رایج

- راهنمای نصب: [شروع به کار](/fa/start/getting-started)
- Windows Hub: [Windows](/fa/platforms/windows)
- راهنمای عملیاتی Gateway: [Gateway](/fa/gateway)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- وضعیت سرویس: `openclaw gateway status`

## نصب سرویس Gateway (CLI)

از یکی از این‌ها استفاده کنید (همه پشتیبانی می‌شوند):

- ویزارد (توصیه‌شده): `openclaw onboard --install-daemon`
- مستقیم: `openclaw gateway install`
- جریان پیکربندی: `openclaw configure` → **سرویس Gateway** را انتخاب کنید
- تعمیر/مهاجرت: `openclaw doctor` (پیشنهاد نصب یا رفع مشکل سرویس را می‌دهد)

هدف سرویس به سیستم‌عامل بستگی دارد:

- macOS: LaunchAgent (`ai.openclaw.gateway` یا `ai.openclaw.<profile>`؛ قدیمی `com.openclaw.*`)
- Linux/WSL2: سرویس کاربر systemd (`openclaw-gateway[-<profile>].service`)
- Windows بومی: Scheduled Task (`OpenClaw Gateway` یا `OpenClaw Gateway (<profile>)`)، با جایگزین آیتم ورود پوشه Startup برای هر کاربر، اگر ایجاد وظیفه رد شود

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Windows Hub](/fa/platforms/windows)
- [برنامه macOS](/fa/platforms/macos)
- [برنامه iOS](/fa/platforms/ios)
