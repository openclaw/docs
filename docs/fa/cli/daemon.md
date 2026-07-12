---
read_when:
    - شما همچنان از `openclaw daemon ...` در اسکریپت‌ها استفاده می‌کنید
    - به فرمان‌های چرخهٔ عمر سرویس نیاز دارید (نصب/راه‌اندازی/توقف/راه‌اندازی مجدد/وضعیت)
summary: مرجع CLI برای `openclaw daemon` (نام مستعار قدیمی برای مدیریت سرویس Gateway)
title: دِیمِن
x-i18n:
    generated_at: "2026-07-12T09:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

نام مستعار قدیمی برای مدیریت سرویس Gateway است. `openclaw daemon ...` به همان فرمان‌های کنترل سرویس نگاشت می‌شود که `openclaw gateway ...` استفاده می‌کند. برای مستندات و نمونه‌های فعلی، [`openclaw gateway`](/fa/cli/gateway) را ترجیح دهید.

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

| زیرفرمان    | گزینه‌ها                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json` |
| `install`   | `--port`، `--runtime <node\|bun>`، `--token`، `--wrapper <path>`، `--force`، `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`، `--disable` (فقط launchd: تا شروع بعدی، KeepAlive/RunAtLoad را به‌طور پایدار غیرفعال می‌کند) |
| `restart`   | `--force`، `--safe`، `--skip-deferral`، `--wait <duration>`، `--json`                            |

- `status`: وضعیت نصب سرویس (launchd/systemd/schtasks) را نمایش می‌دهد و سلامت Gateway را بررسی می‌کند.
- `install`: سرویس را نصب می‌کند؛ `--force` نصب موجود را دوباره نصب یا بازنویسی می‌کند.
- `restart --safe`: از Gateway در حال اجرا می‌خواهد کارهای فعال را پیشاپیش بررسی کند و پس از پایان آن‌ها، یک راه‌اندازی مجدد ادغام‌شده را زمان‌بندی کند؛ این انتظار به `gateway.reload.deferralTimeoutMs` محدود است (پیش‌فرض ۳۰۰۰۰۰ میلی‌ثانیه/۵ دقیقه؛ برای انتظار نامحدود آن را روی `0` تنظیم کنید). با پایان این مهلت، راه‌اندازی مجدد در هر صورت اجباری می‌شود. `restart` ساده مستقیماً از مدیر سرویس استفاده می‌کند؛ `--force` بازنویسی فوری این رفتار است.
- `restart --safe --skip-deferral`: دروازه تعویق ناشی از کار فعال را دور می‌زند تا Gateway حتی هنگام گزارش موانع نیز فوراً راه‌اندازی مجدد شود. به `--safe` نیاز دارد.

## نکته‌ها

- `status` در صورت امکان، SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی حل می‌کند. اگر SecretRef الزامی حل‌نشده باشد، `status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً ارسال کنید یا ابتدا منبع محرمانه را حل کنید. هنگامی که بررسی از سایر جهات موفق شود، هشدارهای احراز هویت حل‌نشده نمایش داده نمی‌شوند.
- `status --deep` یک پیمایش سیستمی با بهترین تلاش برای یافتن سایر سرویس‌های مشابه Gateway اضافه می‌کند (راهنمای پاک‌سازی را نمایش می‌دهد؛ همچنان توصیه می‌شود در هر دستگاه فقط یک Gateway اجرا شود) و اعتبارسنجی پیکربندی را در حالت آگاه از Plugin اجرا می‌کند تا هشدارهای مانیفست Plugin را که مسیر سریع پیش‌فرض نادیده می‌گیرد، نمایش دهد.
- در نصب‌های systemd لینوکس، بررسی‌های ناهماهنگی توکن هر دو منبع واحد `Environment=` و `EnvironmentFile=` را بازرسی می‌کنند.
- بررسی‌های ناهماهنگی توکن، SecretRefهای `gateway.auth.token` را با استفاده از محیط ادغام‌شده زمان اجرا حل می‌کنند (ابتدا محیط فرمان سرویس و سپس محیط فرایند). اگر احراز هویت توکنی عملاً فعال نباشد (`gateway.auth.mode` برابر با `password`/`none`/`trusted-proxy` باشد، یا تنظیم نشده باشد و گذرواژه بتواند اولویت پیدا کند)، حل توکن پیکربندی انجام نمی‌شود.
- `install` بررسی می‌کند که `gateway.auth.token` مدیریت‌شده با SecretRef قابل حل باشد، اما هرگز مقدار حل‌شده را در فراداده محیط سرویس ذخیره نمی‌کند؛ اگر قابل حل نباشد، نصب با حالت بسته و امن شکست می‌خورد.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، `install` تا زمانی که حالت را صریحاً تنظیم کنید مسدود می‌شود.
- در macOS، `install` به‌جای جاسازی اطلاعات محرمانه در `EnvironmentVariables`، فایل‌های plist مربوط به LaunchAgent و فایل محیطی/پوشاننده تولیدشده را فقط برای مالک قابل دسترسی نگه می‌دارد (حالت `0600`/`0700`).
- اجرای چند Gateway روی یک میزبان: درگاه‌ها، پیکربندی/وضعیت و فضاهای کاری را از هم جدا کنید. به [چند Gateway](/fa/gateway#multiple-gateways-same-host) مراجعه کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
