---
read_when:
    - شما هنوز از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به دستورهای چرخهٔ عمر سرویس نیاز دارید (install/start/stop/restart/status)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-04-29T22:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای فرمان‌های مدیریت سرویس Gateway.

`openclaw daemon ...` به همان سطح کنترل سرویس نگاشت می‌شود که فرمان‌های سرویس `openclaw gateway ...` دارند.

## استفاده

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
- `stop`: توقف سرویس
- `restart`: راه‌اندازی دوبارهٔ سرویس

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- چرخهٔ حیات (`uninstall|start|stop|restart`): `--json`

نکته‌ها:

- `status` در صورت امکان SecretRefهای پیکربندی‌شدهٔ احراز هویت را برای احراز هویت بررسی حل می‌کند.
- اگر یک SecretRef الزامیِ احراز هویت در این مسیر فرمان حل نشود، وقتی اتصال/احراز هویت بررسی ناموفق باشد، `daemon status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً پاس دهید یا ابتدا منبع secret را حل کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم و با بهترین تلاش اضافه می‌کند. وقتی سرویس‌های دیگری شبیه Gateway پیدا کند، خروجی انسانی راهنمایی‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که همچنان توصیهٔ معمول، یک Gateway برای هر ماشین است.
- در نصب‌های Linux systemd، بررسی‌های token-drift در `status` شامل هر دو منبع واحد `Environment=` و `EnvironmentFile=` می‌شوند.
- بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env ادغام‌شدهٔ runtime حل می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
- اگر احراز هویت token عملاً فعال نباشد (`gateway.auth.mode` صریحِ `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد که در آن password می‌تواند برنده شود و هیچ کاندیدای token نمی‌تواند برنده شود)، بررسی‌های token-drift از حل token پیکربندی می‌گذرند.
- وقتی احراز هویت token به یک token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد، اما token حل‌شده را در فرادادهٔ محیط سرویس پایدار نمی‌کند.
- اگر احراز هویت token به یک token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.
- در macOS، `install` فایل‌های plist مربوط به LaunchAgent را فقط در اختیار مالک نگه می‌دارد و مقادیر محیط سرویس مدیریت‌شده را به‌جای سریال‌سازی کلیدهای API یا ارجاع‌های env مربوط به auth-profile در `EnvironmentVariables`، از طریق یک فایل و wrapper فقط-مالک بارگذاری می‌کند.
- اگر عمداً چند Gateway را روی یک میزبان اجرا می‌کنید، پورت‌ها، پیکربندی/وضعیت، و workspaceها را جدا کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.

## ترجیح دهید

برای مستندات و نمونه‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [runbook Gateway](/fa/gateway)
