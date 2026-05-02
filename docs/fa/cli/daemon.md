---
read_when:
    - هنوز از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به دستورهای چرخهٔ عمر سرویس نیاز دارید (install/start/stop/restart/status)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-05-02T22:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای فرمان‌های مدیریت سرویس Gateway.

`openclaw daemon ...` به همان سطح کنترل سرویس نگاشت می‌شود که فرمان‌های سرویس `openclaw gateway ...` از آن استفاده می‌کنند.

## نحوه استفاده

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## زیرفرمان‌ها

- `status`: وضعیت نصب سرویس را نشان می‌دهد و سلامت Gateway را بررسی می‌کند
- `install`: سرویس را نصب می‌کند (`launchd`/`systemd`/`schtasks`)
- `uninstall`: سرویس را حذف می‌کند
- `start`: سرویس را شروع می‌کند
- `stop`: سرویس را متوقف می‌کند
- `restart`: سرویس را بازراه‌اندازی می‌کند

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- چرخه عمر (`uninstall|start|stop`): `--json`

نکات:

- `status` در صورت امکان، SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند.
- اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان حل نشود، وقتی اتصال‌پذیری/احراز هویت بررسی شکست بخورد، `daemon status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحا پاس دهید یا ابتدا منبع secret را حل کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم و در حد بهترین تلاش اضافه می‌کند. وقتی سرویس‌های دیگری شبیه Gateway پیدا کند، خروجی انسانی راهنمایی‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که همچنان توصیه معمول، یک Gateway برای هر ماشین است.
- در نصب‌های systemd روی Linux، بررسی‌های انحراف توکن `status` هم منبع‌های واحد `Environment=` و هم `EnvironmentFile=` را شامل می‌شوند.
- بررسی‌های انحراف، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرا ادغام‌شده حل می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
- اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا حالتی که mode تنظیم نشده باشد و password بتواند برنده شود و هیچ گزینه توکنی نتواند برنده شود)، بررسی‌های انحراف توکن از حل توکن پیکربندی عبور می‌کنند.
- وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد، اما توکن حل‌شده را در فراداده محیط سرویس ماندگار نمی‌کند.
- اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب با حالت بسته شکست می‌خورد.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode به‌صراحت تنظیم شود مسدود می‌شود.
- در macOS، `install` فایل‌های plist مربوط به LaunchAgent را فقط برای مالک نگه می‌دارد و به‌جای سریال‌سازی API keyها یا env refهای auth-profile در `EnvironmentVariables`، مقادیر محیط سرویس مدیریت‌شده را از طریق یک فایل و wrapper فقط برای مالک بارگذاری می‌کند.
- اگر عمدا چند Gateway را روی یک میزبان اجرا می‌کنید، پورت‌ها، پیکربندی/وضعیت، و workspaceها را جدا کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.

## ترجیح دهید

برای مستندات و مثال‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
