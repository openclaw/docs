---
read_when:
    - شما همچنان از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به دستورهای چرخهٔ عمر سرویس نیاز دارید (install/start/stop/restart/status)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-06-30T14:15:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای فرمان‌های مدیریت سرویس Gateway.

`openclaw daemon ...` به همان سطح کنترل سرویس نگاشت می‌شود که فرمان‌های سرویس `openclaw gateway ...` استفاده می‌کنند.

## کاربرد

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## زیرفرمان‌ها

- `status`: نمایش وضعیت نصب سرویس و بررسی سلامت Gateway
- `install`: نصب سرویس (`launchd`/`systemd`/`schtasks`)
- `uninstall`: حذف سرویس
- `start`: راه‌اندازی سرویس
- `stop`: متوقف کردن سرویس
- `restart`: راه‌اندازی دوباره سرویس

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- چرخه عمر (`uninstall|start|stop`): `--json`

نکته‌ها:

- `status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند.
- اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان حل‌نشده باشد، وقتی اتصال/احراز هویت بررسی ناموفق شود، `daemon status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صراحتا بفرستید یا ابتدا منبع secret را حل کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم و با بهترین تلاش اضافه می‌کند. وقتی سرویس‌های دیگری شبیه Gateway پیدا کند، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که همچنان توصیه عادی، یک Gateway برای هر دستگاه است.
- `status --deep` همچنین اعتبارسنجی پیکربندی را در حالت آگاه از Plugin اجرا می‌کند و هشدارهای manifest مربوط به Pluginهای پیکربندی‌شده را نمایش می‌دهد (برای مثال نبود فراداده پیکربندی کانال) تا بررسی‌های دود نصب و به‌روزرسانی آن‌ها را پیدا کنند. `status` پیش‌فرض مسیر سریع و فقط‌خواندنی را نگه می‌دارد که اعتبارسنجی Plugin را رد می‌کند.
- در نصب‌های systemd روی Linux، بررسی‌های token-drift در `status` هر دو منبع unit یعنی `Environment=` و `EnvironmentFile=` را شامل می‌شوند.
- بررسی‌های drift مقدار SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده حل می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
- اگر احراز هویت توکن عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد و password بتواند برنده شود و هیچ نامزد token نتواند برنده شود)، بررسی‌های token-drift حل توکن پیکربندی را رد می‌کنند.
- وقتی احراز هویت توکن به یک توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد، اما توکن حل‌شده را در فراداده محیط سرویس ماندگار نمی‌کند.
- اگر احراز هویت توکن به یک توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت بسته و ایمن شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صراحتا تنظیم شود مسدود می‌شود.
- در macOS، `install` فایل‌های plist مربوط به LaunchAgent را فقط در مالکیت مالک نگه می‌دارد و به‌جای سریال‌سازی کلیدهای API یا ارجاع‌های env مربوط به auth-profile در `EnvironmentVariables`، مقادیر محیط سرویس مدیریت‌شده را از طریق یک فایل و wrapper فقط‌مالک بارگذاری می‌کند.
- اگر عمدا چند Gateway را روی یک میزبان اجرا می‌کنید، پورت‌ها، پیکربندی/وضعیت، و workspaceها را جدا کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
- `restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌بررسی کند و پس از تخلیه کار فعال، یک راه‌اندازی دوباره تجمیع‌شده زمان‌بندی کند. راه‌اندازی دوباره امن پیش‌فرض تا سقف `gateway.reload.deferralTimeoutMs` پیکربندی‌شده (پیش‌فرض ۵ دقیقه) منتظر کار فعال می‌ماند؛ وقتی این بودجه منقضی شود، راه‌اندازی دوباره اجباری می‌شود. برای انتظار امن نامحدود که هرگز اجبار نمی‌کند، `gateway.reload.deferralTimeoutMs` را روی `0` تنظیم کنید. `restart` ساده رفتار موجود مدیر سرویس را نگه می‌دارد؛ `--force` همچنان مسیر override فوری است.
- `restart --safe --skip-deferral` راه‌اندازی دوباره امن آگاه از OpenClaw را اجرا می‌کند، اما دروازه تعویق کار فعال را دور می‌زند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی دوباره را بلافاصله منتشر کند. این راه فرار اپراتور است وقتی یک اجرای task گیرکرده راه‌اندازی دوباره امن را نگه می‌دارد؛ به `--safe` نیاز دارد.

## ترجیح دهید

برای مستندات و مثال‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
