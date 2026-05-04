---
read_when:
    - شما هنوز از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به دستورهای چرخهٔ عمر سرویس نیاز دارید (install/start/stop/restart/status)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای دستورهای مدیریت سرویس Gateway.

`openclaw daemon ...` به همان سطح کنترل سرویس نگاشت می‌شود که دستورهای سرویس `openclaw gateway ...` استفاده می‌کنند.

## کاربرد

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## زیردستورها

- `status`: نمایش وضعیت نصب سرویس و بررسی سلامت Gateway
- `install`: نصب سرویس (`launchd`/`systemd`/`schtasks`)
- `uninstall`: حذف سرویس
- `start`: راه‌اندازی سرویس
- `stop`: توقف سرویس
- `restart`: راه‌اندازی دوباره سرویس

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- چرخه عمر (`uninstall|start|stop`): `--json`

یادداشت‌ها:

- `status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند.
- اگر یک SecretRef احراز هویت ضروری در این مسیر دستور حل نشده باشد، `daemon status --json` هنگام شکست اتصال/احراز هویت بررسی، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحا ارسال کنید یا ابتدا منبع secret را حل کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم و بر پایه بهترین تلاش اضافه می‌کند. وقتی سرویس‌های دیگری شبیه gateway پیدا کند، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که همچنان توصیه معمول، یک gateway برای هر ماشین است.
- در نصب‌های systemd لینوکس، بررسی‌های token-drift شامل هر دو منبع unit یعنی `Environment=` و `EnvironmentFile=` می‌شود.
- بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده حل می‌کنند؛ ابتدا env دستور سرویس و سپس به‌عنوان جایگزین env فرایند.
- اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح برابر با `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد و password بتواند برنده شود و هیچ نامزد توکنی نتواند برنده شود)، بررسی‌های token-drift از حل توکن پیکربندی صرف‌نظر می‌کنند.
- وقتی احراز هویت توکنی به یک توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، `install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد، اما توکن حل‌شده را در فراداده محیط سرویس پایدار نمی‌کند.
- اگر احراز هویت توکنی به یک توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، نصب به‌صورت بسته شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحا تنظیم شود مسدود می‌ماند.
- در macOS، `install` plistهای LaunchAgent را فقط برای مالک نگه می‌دارد و مقدارهای محیط سرویس مدیریت‌شده را به‌جای سریال‌سازی API keyها یا ارجاع‌های env پروفایل احراز هویت در `EnvironmentVariables`، از طریق یک فایل فقط‌مالک و wrapper بارگذاری می‌کند.
- اگر عمدا چند gateway را روی یک میزبان اجرا می‌کنید، پورت‌ها، پیکربندی/وضعیت، و workspaceها را جدا کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
- `restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌بررسی کند و پس از تخلیه کار فعال، یک راه‌اندازی دوباره ادغام‌شده زمان‌بندی کند. `restart` ساده رفتار موجود service-manager را حفظ می‌کند؛ `--force` همچنان مسیر override فوری است.

## ترجیح دهید

برای مستندات و مثال‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
