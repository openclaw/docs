---
read_when:
    - دنبال پشتیبانی سیستم‌عامل یا مسیرهای نصب هستید
    - تصمیم‌گیری درباره محل اجرای Gateway
summary: مرور کلی پشتیبانی پلتفرم (Gateway + برنامه‌های همراه)
title: پلتفرم‌ها
x-i18n:
    generated_at: "2026-04-29T23:09:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 16
---

هسته OpenClaw با TypeScript نوشته شده است. **Node زمان اجرای پیشنهادی است**.
Bun برای Gateway توصیه نمی‌شود — مشکلات شناخته‌شده‌ای با کانال‌های WhatsApp و
Telegram وجود دارد؛ برای جزئیات، [Bun (آزمایشی)](/fa/install/bun) را ببینید.

برنامه‌های همراه برای macOS (برنامه نوار منو) و گره‌های موبایل (iOS/Android) وجود دارند. برنامه‌های همراه Windows و
Linux برنامه‌ریزی شده‌اند، اما Gateway امروز به‌طور کامل پشتیبانی می‌شود.
برنامه‌های همراه بومی برای Windows نیز برنامه‌ریزی شده‌اند؛ استفاده از Gateway از طریق WSL2 توصیه می‌شود.

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
- exe.dev (VM + پراکسی HTTPS): [exe.dev](/fa/install/exe-dev)

## پیوندهای رایج

- راهنمای نصب: [شروع به کار](/fa/start/getting-started)
- راهنمای عملیاتی Gateway: [Gateway](/fa/gateway)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- وضعیت سرویس: `openclaw gateway status`

## نصب سرویس Gateway (CLI)

از یکی از این موارد استفاده کنید (همگی پشتیبانی می‌شوند):

- راه‌انداز مرحله‌به‌مرحله (پیشنهادی): `openclaw onboard --install-daemon`
- مستقیم: `openclaw gateway install`
- جریان پیکربندی: `openclaw configure` → **سرویس Gateway** را انتخاب کنید
- تعمیر/مهاجرت: `openclaw doctor` (پیشنهاد نصب یا رفع مشکل سرویس را می‌دهد)

هدف سرویس به سیستم‌عامل بستگی دارد:

- macOS: LaunchAgent (`ai.openclaw.gateway` یا `ai.openclaw.<profile>`؛ قدیمی: `com.openclaw.*`)
- Linux/WSL2: سرویس کاربری systemd (`openclaw-gateway[-<profile>].service`)
- Windows بومی: وظیفه زمان‌بندی‌شده (`OpenClaw Gateway` یا `OpenClaw Gateway (<profile>)`)، با جایگزین آیتم ورود پوشه Startup برای هر کاربر در صورتی که ایجاد وظیفه رد شود

## مرتبط

- [نمای کلی نصب](/fa/install)
- [برنامه macOS](/fa/platforms/macos)
- [برنامه iOS](/fa/platforms/ios)
