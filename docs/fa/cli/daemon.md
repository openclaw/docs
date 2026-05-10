---
read_when:
    - شما همچنان از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به فرمان‌های چرخه حیات سرویس (install/start/stop/restart/status) نیاز دارید
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-05-10T19:31:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
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
- `start`: شروع سرویس
- `stop`: توقف سرویس
- `restart`: راه‌اندازی مجدد سرویس

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- چرخهٔ حیات (`uninstall|start|stop`): `--json`

نکته‌ها:

- `status` تا جای ممکن SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند.
- اگر یک SecretRef لازم برای احراز هویت در این مسیر فرمان حل‌نشده باشد، `daemon status --json` هنگام شکست اتصال/احراز هویت بررسی، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً بدهید یا ابتدا منبع secret را حل کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم و با بهترین تلاش اضافه می‌کند. وقتی سرویس‌های دیگری شبیه Gateway پیدا کند، خروجی انسانی راهنمای پاک‌سازی چاپ می‌کند و هشدار می‌دهد که همچنان توصیهٔ معمول، یک Gateway برای هر ماشین است.
- در نصب‌های Linux systemd، بررسی‌های token-drift در `status` هر دو منبع واحد `Environment=` و `EnvironmentFile=` را شامل می‌شوند.
- بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از محیط اجرایی ادغام‌شده حل می‌کنند (ابتدا محیط فرمان سرویس، سپس محیط فرایند به‌عنوان جایگزین).
- اگر احراز هویت token عملاً فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد و password بتواند برنده شود و هیچ نامزد token نتواند برنده شود)، بررسی‌های token-drift حل token پیکربندی را رد می‌کنند.
- وقتی احراز هویت token به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، `install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد، اما token حل‌شده را در فرادادهٔ محیط سرویس ماندگار نمی‌کند.
- اگر احراز هویت token به token نیاز داشته باشد و SecretRef token پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.
- در macOS، `install` plistهای LaunchAgent را فقط در مالکیت owner نگه می‌دارد و به‌جای سریال‌سازی کلیدهای API یا ارجاع‌های محیط auth-profile در `EnvironmentVariables`، مقادیر محیط سرویس مدیریت‌شده را از طریق یک فایل و wrapper فقط در مالکیت owner بارگذاری می‌کند.
- اگر عمداً چند Gateway را روی یک میزبان اجرا می‌کنید، portها، پیکربندی/وضعیت، و workspaceها را ایزوله کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
- `restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌بررسی کند و پس از تخلیهٔ کار فعال، یک راه‌اندازی مجدد ادغام‌شده زمان‌بندی کند. `restart` ساده رفتار موجود مدیر سرویس را حفظ می‌کند؛ `--force` همچنان مسیر override فوری است.
- `restart --safe --skip-deferral` راه‌اندازی مجدد امنِ آگاه از OpenClaw را اجرا می‌کند اما gate تعویق کار فعال را دور می‌زند، بنابراین Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند راه‌اندازی مجدد را فوراً صادر می‌کند. راه گریز operator وقتی یک اجرای task گیرکرده راه‌اندازی مجدد امن را pin می‌کند؛ به `--safe` نیاز دارد.

## ترجیح داده‌شده

برای مستندات و مثال‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
