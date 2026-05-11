---
read_when:
    - هنوز از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به فرمان‌های چرخهٔ حیات سرویس (install/start/stop/restart/status) نیاز دارید
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-05-11T20:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای فرمان‌های مدیریت سرویس Gateway.

`openclaw daemon ...` به همان سطح کنترل سرویس نگاشت می‌شود که فرمان‌های سرویس `openclaw gateway ...` استفاده می‌کنند.

## نحوهٔ استفاده

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## زیر‌فرمان‌ها

- `status`: وضعیت نصب سرویس را نشان می‌دهد و سلامت Gateway را بررسی می‌کند
- `install`: سرویس را نصب می‌کند (`launchd`/`systemd`/`schtasks`)
- `uninstall`: سرویس را حذف می‌کند
- `start`: سرویس را شروع می‌کند
- `stop`: سرویس را متوقف می‌کند
- `restart`: سرویس را دوباره راه‌اندازی می‌کند

## گزینه‌های رایج

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- چرخهٔ عمر (`uninstall|start|stop`): `--json`

نکته‌ها:

- `status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی resolve می‌کند.
- اگر یک SecretRef احراز هویت لازم در این مسیر فرمان resolve نشود، `daemon status --json` هنگامی که اتصال/احراز هویت بررسی شکست می‌خورد، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً پاس دهید یا ابتدا منبع secret را resolve کنید.
- اگر بررسی موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
- `status --deep` یک اسکن سرویس در سطح سیستم را به‌صورت best-effort اضافه می‌کند. وقتی سرویس‌های دیگری شبیه Gateway پیدا کند، خروجی انسانی راهنمایی‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که همچنان توصیهٔ عادی، یک Gateway برای هر ماشین است.
- `status --deep` همچنین اعتبارسنجی پیکربندی را در حالت آگاه از Plugin اجرا می‌کند و هشدارهای مانیفست Plugin پیکربندی‌شده را نمایش می‌دهد (برای مثال نبود metadata پیکربندی کانال) تا بررسی‌های smoke نصب و به‌روزرسانی آن‌ها را پیدا کنند. `status` پیش‌فرض مسیر سریع فقط‌خواندنی را نگه می‌دارد که اعتبارسنجی Plugin را رد می‌کند.
- در نصب‌های systemd لینوکس، بررسی‌های token-drift در `status` هر دو منبع unit یعنی `Environment=` و `EnvironmentFile=` را شامل می‌شوند.
- بررسی‌های Drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده resolve می‌کنند (ابتدا env فرمان سرویس، سپس env فرایند به‌عنوان fallback).
- اگر احراز هویت token عملاً فعال نباشد (`gateway.auth.mode` صریحِ `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد در جایی که password می‌تواند برنده شود و هیچ کاندیدای token نمی‌تواند برنده شود)، بررسی‌های token-drift از resolve کردن token پیکربندی صرف‌نظر می‌کنند.
- وقتی احراز هویت token به token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `install` اعتبارسنجی می‌کند که SecretRef قابل resolve باشد اما token حل‌شده را در metadata محیط سرویس ذخیره نمی‌کند.
- اگر احراز هویت token به token نیاز داشته باشد و SecretRef پیکربندی‌شدهٔ token resolve نشده باشد، نصب به‌صورت بسته شکست می‌خورد.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.
- در macOS، `install` plistهای LaunchAgent را فقط در مالکیت owner نگه می‌دارد و مقدارهای محیط سرویس مدیریت‌شده را به‌جای سریال‌سازی کلیدهای API یا env refهای auth-profile در `EnvironmentVariables`، از طریق یک فایل و wrapper فقط در اختیار owner بارگذاری می‌کند.
- اگر عمداً چند Gateway را روی یک میزبان اجرا می‌کنید، portها، پیکربندی/وضعیت و workspaceها را جدا کنید؛ [/gateway#multiple-gateways-same-host](/fa/gateway#multiple-gateways-same-host) را ببینید.
- `restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را preflight کند و پس از تخلیه شدن کار فعال، یک restart ادغام‌شده را زمان‌بندی کند. `restart` ساده رفتار موجود service-manager را حفظ می‌کند؛ `--force` همچنان مسیر override فوری باقی می‌ماند.
- `restart --safe --skip-deferral` restart امنِ آگاه از OpenClaw را اجرا می‌کند اما gate تعویق کار فعال را دور می‌زند تا Gateway حتی وقتی blockerها گزارش شده‌اند، restart را فوراً صادر کند. راه گریز operator زمانی است که یک اجرای task گیرکرده restart امن را pinned می‌کند؛ به `--safe` نیاز دارد.

## ترجیح دهید

برای مستندات و مثال‌های فعلی از [`openclaw gateway`](/fa/cli/gateway) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Runbook Gateway](/fa/gateway)
