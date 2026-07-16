---
read_when:
    - در جست‌وجوی پشتیبانی از سیستم‌عامل یا مسیرهای نصب هستید؟
    - تصمیم‌گیری دربارهٔ محل اجرای Gateway
summary: نمای کلی پشتیبانی از پلتفرم‌ها (Gateway + برنامه‌های همراه)
title: پلتفرم‌ها
x-i18n:
    generated_at: "2026-07-16T16:37:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

هستهٔ OpenClaw با TypeScript نوشته شده است. **Node محیط اجرای الزامی است**، زیرا
مخزن وضعیت متعارف از `node:sqlite` استفاده می‌کند. Bun همچنان برای
نصب وابستگی‌ها و اسکریپت‌های بسته در دسترس است؛ به [Bun](/fa/install/bun) مراجعه کنید.

برنامه‌های همراه برای Windows Hub، macOS (برنامهٔ نوار منو) و نودهای همراه
(iOS/Android) وجود دارند. برنامه‌های همراه Linux برنامه‌ریزی شده‌اند، اما Gateway
در حال حاضر کاملاً پشتیبانی می‌شود. در Windows، برای برنامهٔ دسکتاپ Windows Hub،
برای استفادهٔ مبتنی بر ترمینال نصب بومی PowerShell، یا برای سازگارترین محیط اجرای
Gateway با Linux، WSL2 را انتخاب کنید.

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
- Azure (ماشین مجازی Linux): [Azure](/fa/install/azure)
- exe.dev (ماشین مجازی + پراکسی HTTPS): [exe.dev](/fa/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/fa/platforms/easyrunner)

## پیوندهای رایج

- راهنمای نصب: [شروع به کار](/fa/start/getting-started)
- Windows Hub: [Windows](/fa/platforms/windows)
- راهنمای عملیاتی Gateway: [Gateway](/fa/gateway)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- وضعیت سرویس: `openclaw gateway status`

## نصب سرویس Gateway (CLI)

از یکی از این روش‌ها استفاده کنید (همه پشتیبانی می‌شوند):

- ویزارد (توصیه‌شده): `openclaw onboard --install-daemon`
- مستقیم: `openclaw gateway install`
- جریان پیکربندی: `openclaw configure` → **Gateway service** را انتخاب کنید
- تعمیر/مهاجرت: `openclaw doctor` (نصب یا رفع اشکال سرویس را پیشنهاد می‌دهد)

هدف سرویس به سیستم‌عامل بستگی دارد:

- macOS: LaunchAgent (`ai.openclaw.gateway`، یا `ai.openclaw.<profile>` برای پروفایل نام‌گذاری‌شده)
- Linux/WSL2: سرویس کاربری systemd ‏(`openclaw-gateway[-<profile>].service`)
- Windows بومی: Scheduled Task ‏(`OpenClaw Gateway` یا `OpenClaw Gateway (<profile>)`)؛ اگر ایجاد وظیفه رد شود، یک مورد ورود به سیستم برای هر کاربر در پوشهٔ Startup به‌عنوان راهکار جایگزین استفاده می‌شود

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Windows Hub](/fa/platforms/windows)
- [برنامهٔ macOS](/fa/platforms/macos)
- [برنامهٔ iOS](/fa/platforms/ios)
