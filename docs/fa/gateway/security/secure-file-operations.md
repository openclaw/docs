---
read_when:
    - تغییر دسترسی به فایل، استخراج بایگانی، ذخیره‌سازی فضای کاری، یا توابع کمکی فایل‌سیستم Plugin
summary: OpenClaw چگونه دسترسی به فایل‌های محلی را به‌صورت ایمن مدیریت می‌کند و چرا کمک‌ابزار اختیاری Python با نام fs-safe به‌طور پیش‌فرض غیرفعال است
title: عملیات ایمن فایل
x-i18n:
    generated_at: "2026-05-06T09:21:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw از [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) برای عملیات حساس امنیتی روی فایل‌های محلی استفاده می‌کند: خواندن/نوشتن محدود به ریشه، جایگزینی اتمیک، استخراج آرشیو، فضاهای کاری موقت، وضعیت JSON و مدیریت فایل‌های محرمانه.

هدف، یک **گاردریل کتابخانه‌ای** سازگار برای کد مورداعتماد OpenClaw است که نام مسیرهای نامطمئن را دریافت می‌کند. این sandbox نیست. مجوزهای فایل‌سیستم میزبان، کاربران سیستم‌عامل، کانتینرها، و سیاست agent/tool همچنان محدوده اثر واقعی را تعیین می‌کنند.

## پیش‌فرض: بدون کمک‌برنامه Python

OpenClaw کمک‌برنامه Python مربوط به fs-safe POSIX را به‌طور پیش‌فرض **خاموش** می‌کند.

دلیل:

- Gateway نباید یک sidecar پایدار Python را اجرا کند مگر اینکه operator آن را فعال کرده باشد؛
- بسیاری از نصب‌ها به سخت‌سازی اضافی برای تغییرات دایرکتوری والد نیاز ندارند؛
- غیرفعال کردن Python رفتار package/runtime را در محیط‌های دسکتاپ، Docker، CI و برنامه‌های بسته‌بندی‌شده قابل‌پیش‌بینی‌تر نگه می‌دارد.

OpenClaw فقط پیش‌فرض را تغییر می‌دهد. اگر صراحتاً حالتی را تنظیم کنید، fs-safe به آن پایبند می‌ماند:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

نام‌های عمومی fs-safe نیز کار می‌کنند: `FS_SAFE_PYTHON_MODE` و `FS_SAFE_PYTHON`.

## چه چیزهایی بدون Python محافظت‌شده می‌مانند

با خاموش بودن کمک‌برنامه، OpenClaw همچنان از مسیرهای Node در fs-safe برای موارد زیر استفاده می‌کند:

- رد کردن گریزهای مسیر نسبی مانند `..`، مسیرهای مطلق، و جداکننده‌های مسیر در جاهایی که فقط نام مجاز است؛
- حل‌وفصل عملیات از طریق یک handle ریشه مورداعتماد به‌جای بررسی‌های موردی `path.resolve(...).startsWith(...)`؛
- رد کردن الگوهای symlink و hardlink در APIهایی که چنین سیاستی را لازم دارند؛
- باز کردن فایل‌ها با بررسی هویت در جاهایی که API محتوای فایل را برمی‌گرداند یا مصرف می‌کند؛
- نوشتن‌های اتمیک با فایل موقت هم‌سطح برای فایل‌های وضعیت/پیکربندی؛
- محدودیت بایت برای خواندن و استخراج آرشیو؛
- حالت‌های خصوصی برای فایل‌های محرمانه و وضعیت در جاهایی که API آن‌ها را لازم دارد.

این محافظت‌ها مدل تهدید معمول OpenClaw را پوشش می‌دهند: کد مورداعتماد Gateway که ورودی مسیر نامطمئن model/Plugin/channel را درون یک مرز operator مورداعتماد واحد مدیریت می‌کند.

## Python چه چیزی اضافه می‌کند

در POSIX، کمک‌برنامه اختیاری fs-safe یک فرایند پایدار Python را نگه می‌دارد و برای تغییرات دایرکتوری والد مانند rename، remove، mkdir، stat/list و برخی مسیرهای نوشتن، از عملیات فایل‌سیستم نسبی به fd استفاده می‌کند.

این کار پنجره‌های race هم‌UID را کوچک‌تر می‌کند؛ یعنی جایی که فرایند دیگری می‌تواند یک دایرکتوری والد را بین اعتبارسنجی و تغییر جایگزین کند. این یک دفاع لایه‌ای برای میزبان‌هایی است که در آن‌ها فرایندهای محلی نامطمئن می‌توانند همان دایرکتوری‌هایی را که OpenClaw روی آن‌ها کار می‌کند تغییر دهند.

اگر deployment شما چنین ریسکی دارد و وجود Python تضمین‌شده است، از این استفاده کنید:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

وقتی کمک‌برنامه بخشی از وضعیت امنیتی شماست، به‌جای `auto` از `require` استفاده کنید؛ `auto` عمداً در صورت در دسترس نبودن کمک‌برنامه، به رفتار فقط Node برمی‌گردد.

## راهنمای Plugin و core

- دسترسی فایل رو‌به‌روی Plugin باید وقتی مسیر از پیام، خروجی model، پیکربندی یا ورودی Plugin می‌آید، از طریق helperهای `openclaw/plugin-sdk/*` انجام شود، نه `fs` خام.
- کد core باید از wrapperهای محلی fs-safe زیر `src/infra/*` استفاده کند تا سیاست فرایند OpenClaw به‌صورت سازگار اعمال شود.
- استخراج آرشیو باید از helperهای آرشیو fs-safe با محدودیت‌های صریح اندازه، تعداد entry، link و مقصد استفاده کند.
- secrets باید از helperهای secret در OpenClaw یا helperهای secret/private-state در fs-safe استفاده کنند؛ بررسی‌های mode را دور `fs.writeFile` به‌صورت دستی پیاده‌سازی نکنید.
- اگر به جداسازی در برابر کاربر محلی متخاصم نیاز دارید، فقط به fs-safe اتکا نکنید. Gatewayهای جداگانه را زیر کاربران/میزبان‌های سیستم‌عامل جدا اجرا کنید یا از sandboxing استفاده کنید.

مرتبط: [امنیت](/fa/gateway/security)، [Sandboxing](/fa/gateway/sandboxing)، [تأییدیه‌های exec](/fa/tools/exec-approvals)، [Secrets](/fa/gateway/secrets).
