---
read_when:
    - شما همچنان در اسکریپت‌ها از `openclaw daemon ...` استفاده می‌کنید
    - به فرمان‌های چرخه عمر سرویس نیاز دارید (نصب/راه‌اندازی/توقف/راه‌اندازی مجدد/وضعیت)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دیمون
x-i18n:
    generated_at: "2026-07-16T16:29:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای مدیریت سرویس Gateway. `openclaw daemon ...` به همان فرمان‌های کنترل سرویس `openclaw gateway ...` نگاشت می‌شود. برای مستندات و نمونه‌های فعلی، [`openclaw gateway`](/fa/cli/gateway) را ترجیح دهید.

## نحوه استفاده

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## زیرفرمان‌ها و گزینه‌ها

| زیرفرمان  | گزینه‌ها                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (فقط launchd: سرکوب دائمی KeepAlive/RunAtLoad تا شروع بعدی) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: وضعیت نصب سرویس (launchd/systemd/schtasks) را نمایش می‌دهد و سلامت Gateway را بررسی می‌کند.
- `install`: سرویس را نصب می‌کند؛ `--force` یک نصب موجود را دوباره نصب/بازنویسی می‌کند.
- `restart --safe`: از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌بررسی کند و پس از تخلیه کار، یک راه‌اندازی مجدد تجمیع‌شده را زمان‌بندی کند که به `gateway.reload.deferralTimeoutMs` محدود است (پیش‌فرض 300000ms/5 دقیقه؛ برای انتظار نامحدود روی `0` تنظیم کنید). وقتی این مهلت تمام شود، راه‌اندازی مجدد در هر صورت اجباری می‌شود. `restart` ساده مستقیماً از مدیر سرویس استفاده می‌کند؛ `--force` بازنویسی فوری است.
- `restart --safe --skip-deferral`: دروازه تعویق کار فعال را دور می‌زند تا Gateway حتی هنگام گزارش مسدودکننده‌ها فوراً راه‌اندازی مجدد شود. به `--safe` نیاز دارد.

## نکات

- `status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند. اگر یک SecretRef الزامی حل‌نشده باشد، `status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را به‌صراحت ارسال کنید یا ابتدا منبع راز را حل کنید. پس از موفقیت بررسی از سایر جهات، هشدارهای احراز هویت حل‌نشده سرکوب می‌شوند.
- `status --deep` یک پویش سطح سیستم با بهترین تلاش برای یافتن سایر سرویس‌های مشابه Gateway اضافه می‌کند (راهنمای پاک‌سازی را چاپ می‌کند؛ همچنان یک Gateway برای هر دستگاه توصیه می‌شود) و اعتبارسنجی پیکربندی را در حالت آگاه از Plugin اجرا می‌کند و هشدارهای مانیفست Plugin را که مسیر سریع پیش‌فرض نادیده می‌گیرد، نمایش می‌دهد.
- در نصب‌های systemd لینوکس، بررسی‌های تغییر توکن هر دو منبع واحد `Environment=` و `EnvironmentFile=` را وارسی می‌کنند.
- بررسی‌های تغییر توکن، SecretRefهای `gateway.auth.token` را با استفاده از محیط زمان اجرای ادغام‌شده حل می‌کنند (ابتدا محیط فرمان سرویس، سپس محیط فرایند). اگر احراز هویت توکنی عملاً فعال نباشد (`gateway.auth.mode` از `password`/`none`/`trusted-proxy`، یا تنظیم‌نشده باشد و گذرواژه بتواند اولویت پیدا کند)، حل توکن پیکربندی نادیده گرفته می‌شود.
- `install` اعتبارسنجی می‌کند که `gateway.auth.token` مدیریت‌شده با SecretRef قابل حل باشد، اما هرگز مقدار حل‌شده را در فراداده محیط سرویس ذخیره نمی‌کند؛ اگر قابل حل نباشد، نصب به‌صورت بسته و ایمن شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، `install` تا زمانی که حالت را به‌صراحت تنظیم کنید، مسدود می‌شود.
- در macOS، `install` فایل‌های plist مربوط به LaunchAgent و فایل محیطی/پوشش تولیدشده را فقط برای مالک قابل دسترسی نگه می‌دارد (حالت `0600`/`0700`) و رازها را در `EnvironmentVariables` جاسازی نمی‌کند.
- اجرای چند Gateway روی یک میزبان: درگاه‌ها، پیکربندی/وضعیت و فضاهای کاری را از هم جدا کنید. [چند Gateway](/fa/gateway#multiple-gateways-same-host) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
