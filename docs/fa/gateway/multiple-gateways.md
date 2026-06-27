---
read_when:
    - اجرای بیش از یک Gateway روی همان دستگاه
    - برای هر Gateway به پیکربندی/وضعیت/پورت‌های ایزوله نیاز دارید
summary: اجرای چند Gateway OpenClaw روی یک میزبان (جداسازی، درگاه‌ها و پروفایل‌ها)
title: چندین Gateway
x-i18n:
    generated_at: "2026-06-27T17:45:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

بیشتر راه‌اندازی‌ها باید از یک Gateway استفاده کنند، چون یک Gateway واحد می‌تواند چندین اتصال پیام‌رسانی و عامل را مدیریت کند. اگر به جداسازی یا افزونگی قوی‌تری نیاز دارید (مثلاً یک ربات نجات)، Gatewayهای جداگانه را با پروفایل‌ها/درگاه‌های جداشده اجرا کنید.

## بهترین راه‌اندازی پیشنهادی

برای بیشتر کاربران، ساده‌ترین راه‌اندازی ربات نجات این است:

- ربات اصلی را روی پروفایل پیش‌فرض نگه دارید
- ربات نجات را روی `--profile rescue` اجرا کنید
- برای حساب نجات از یک ربات Telegram کاملاً جدا استفاده کنید
- ربات نجات را روی یک درگاه پایه متفاوت مثل `19789` نگه دارید

این کار ربات نجات را از ربات اصلی جدا نگه می‌دارد تا اگر ربات اصلی از کار افتاد، بتواند اشکال‌زدایی کند یا تغییرات پیکربندی را اعمال کند. بین درگاه‌های پایه حداقل ۲۰ درگاه فاصله بگذارید تا درگاه‌های مشتق‌شده مرورگر/canvas/CDP هرگز با هم تداخل نداشته باشند.

## شروع سریع ربات نجات

از این مسیر به‌عنوان مسیر پیش‌فرض استفاده کنید، مگر اینکه دلیل محکمی برای انجام کاری دیگر داشته باشید:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

اگر ربات اصلی شما از قبل در حال اجراست، معمولاً همین کافی است.

در طول `openclaw --profile rescue onboard`:

- از توکن ربات Telegram جداگانه استفاده کنید
- پروفایل `rescue` را نگه دارید
- از یک درگاه پایه استفاده کنید که حداقل ۲۰ تا بالاتر از ربات اصلی باشد
- فضای کاری پیش‌فرض نجات را بپذیرید، مگر اینکه از قبل خودتان یکی را مدیریت کنید

اگر فرایند ورود اولیه قبلاً سرویس نجات را برای شما نصب کرده باشد، دستور نهایی `gateway install` لازم نیست.

## چرا این کار جواب می‌دهد

ربات نجات مستقل می‌ماند چون موارد اختصاصی خودش را دارد:

- پروفایل/پیکربندی
- دایرکتوری وضعیت
- فضای کاری
- درگاه پایه (به‌علاوه درگاه‌های مشتق‌شده)
- توکن ربات Telegram

برای بیشتر راه‌اندازی‌ها، از یک ربات Telegram کاملاً جدا برای پروفایل نجات استفاده کنید:

- محدود نگه داشتن آن به اپراتورها آسان است
- توکن و هویت ربات جداگانه
- مستقل از نصب کانال/برنامه ربات اصلی
- مسیر بازیابی ساده مبتنی بر پیام مستقیم وقتی ربات اصلی خراب است

## آنچه `--profile rescue onboard` تغییر می‌دهد

`openclaw --profile rescue onboard` از جریان ورود اولیه معمول استفاده می‌کند، اما همه‌چیز را در یک پروفایل جداگانه می‌نویسد.

در عمل، یعنی ربات نجات موارد اختصاصی خودش را می‌گیرد:

- فایل پیکربندی
- دایرکتوری وضعیت
- فضای کاری (به‌طور پیش‌فرض `~/.openclaw/workspace-rescue`)
- نام سرویس مدیریت‌شده

در غیر این صورت، اعلان‌ها همان اعلان‌های ورود اولیه معمول هستند.

## راه‌اندازی عمومی چند Gateway

چیدمان ربات نجات در بالا ساده‌ترین پیش‌فرض است، اما همین الگوی جداسازی برای هر جفت یا گروهی از Gatewayها روی یک میزبان کار می‌کند.

برای یک راه‌اندازی عمومی‌تر، به هر Gateway اضافه، پروفایل نام‌دار خودش و درگاه پایه خودش را بدهید:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

اگر می‌خواهید هر دو Gateway از پروفایل‌های نام‌دار استفاده کنند، این هم کار می‌کند:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

سرویس‌ها هم از همین الگو پیروی می‌کنند:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

وقتی یک مسیر جایگزین برای اپراتور می‌خواهید، از شروع سریع ربات نجات استفاده کنید. وقتی برای کانال‌ها، مستأجرها، فضاهای کاری، یا نقش‌های عملیاتی مختلف چند Gateway بلندمدت می‌خواهید، از الگوی عمومی پروفایل استفاده کنید.

## چک‌لیست جداسازی

این موارد را برای هر نمونه Gateway یکتا نگه دارید:

- `OPENCLAW_CONFIG_PATH` — فایل پیکربندی مخصوص هر نمونه
- `OPENCLAW_STATE_DIR` — نشست‌ها، اعتبارنامه‌ها، و حافظه‌های نهان مخصوص هر نمونه
- `agents.defaults.workspace` — ریشه فضای کاری مخصوص هر نمونه
- `gateway.port` (یا `--port`) — یکتا برای هر نمونه
- درگاه‌های مشتق‌شده مرورگر/canvas/CDP

اگر این‌ها مشترک باشند، با رقابت‌های پیکربندی و تداخل درگاه روبه‌رو می‌شوید.

## نگاشت درگاه (مشتق‌شده)

درگاه پایه = `gateway.port` (یا `OPENCLAW_GATEWAY_PORT` / `--port`).

- درگاه سرویس کنترل مرورگر = پایه + ۲ (فقط local loopback)
- میزبان canvas روی سرور HTTP مربوط به Gateway ارائه می‌شود (همان درگاه `gateway.port`)
- درگاه‌های CDP پروفایل مرورگر به‌طور خودکار از `browser.controlPort + 9 .. + 108` تخصیص می‌یابند

اگر هرکدام از این‌ها را در پیکربندی یا env بازنویسی کنید، باید آن‌ها را برای هر نمونه یکتا نگه دارید.

## نکات مرورگر/CDP (اشتباه رایج)

- `browser.cdpUrl` را روی مقادیر یکسان در چند نمونه **ثابت نکنید**.
- هر نمونه به درگاه کنترل مرورگر و بازه CDP خودش نیاز دارد (مشتق‌شده از درگاه Gateway خودش).
- اگر به درگاه‌های CDP صریح نیاز دارید، `browser.profiles.<name>.cdpPort` را برای هر نمونه تنظیم کنید.
- Chrome راه‌دور: از `browser.profiles.<name>.cdpUrl` استفاده کنید (برای هر پروفایل، برای هر نمونه).

## نمونه env دستی

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## بررسی‌های سریع

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

تفسیر:

- `gateway status --deep` کمک می‌کند سرویس‌های launchd/systemd/schtasks قدیمی از نصب‌های قبلی را پیدا کنید.
- متن هشدار `gateway probe` مثل `multiple reachable gateway identities detected` فقط وقتی انتظار می‌رود که عمداً بیش از یک Gateway جداشده اجرا می‌کنید، یا وقتی OpenClaw نمی‌تواند ثابت کند مقصدهای قابل دسترسِ بررسی همان Gateway هستند. تونل SSH، URL پراکسی، یا URL راه‌دور پیکربندی‌شده به همان Gateway، یک Gateway با چند انتقال است، حتی وقتی درگاه‌های انتقال متفاوت باشند.

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [قفل Gateway](/fa/gateway/gateway-lock)
- [پیکربندی](/fa/gateway/configuration)
