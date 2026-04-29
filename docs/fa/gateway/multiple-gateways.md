---
read_when:
    - اجرای بیش از یک Gateway روی یک ماشین واحد
    - برای هر Gateway به پیکربندی/وضعیت/پورت‌های ایزوله نیاز دارید
summary: اجرای چند Gateway OpenClaw در یک میزبان (ایزوله‌سازی، پورت‌ها و پروفایل‌ها)
title: چند Gateway
x-i18n:
    generated_at: "2026-04-29T22:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

بیشتر راه‌اندازی‌ها باید از یک Gateway استفاده کنند، زیرا یک Gateway واحد می‌تواند چندین اتصال پیام‌رسانی و agent را مدیریت کند. اگر به جداسازی یا افزونگی قوی‌تری نیاز دارید (مثلاً یک ربات نجات)، Gatewayهای جداگانه را با پروفایل‌ها/پورت‌های جداشده اجرا کنید.

## بهترین راه‌اندازی پیشنهادی

برای بیشتر کاربران، ساده‌ترین راه‌اندازی ربات نجات این است:

- ربات اصلی را روی پروفایل پیش‌فرض نگه دارید
- ربات نجات را روی `--profile rescue` اجرا کنید
- برای حساب نجات از یک ربات Telegram کاملاً جدا استفاده کنید
- ربات نجات را روی یک پورت پایه متفاوت، مثل `19789`، نگه دارید

این کار ربات نجات را از ربات اصلی جدا نگه می‌دارد تا اگر ربات اصلی از کار افتاد، بتواند اشکال‌زدایی کند یا تغییرات
پیکربندی را اعمال کند. بین پورت‌های پایه حداقل 20 پورت فاصله بگذارید
تا پورت‌های مشتق‌شده مرورگر/canvas/CDP هرگز با هم تداخل نداشته باشند.

## شروع سریع ربات نجات

از این مسیر به‌عنوان مسیر پیش‌فرض استفاده کنید، مگر اینکه دلیل محکمی برای انجام کار
دیگری داشته باشید:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

اگر ربات اصلی شما از قبل در حال اجرا است، معمولاً همین کافی است.

در طول اجرای `openclaw --profile rescue onboard`:

- از توکن ربات Telegram جداگانه استفاده کنید
- پروفایل `rescue` را نگه دارید
- از یک پورت پایه استفاده کنید که حداقل 20 تا بالاتر از ربات اصلی باشد
- فضای کاری نجات پیش‌فرض را بپذیرید، مگر اینکه از قبل خودتان یکی را مدیریت می‌کنید

اگر فرایند onboarding قبلاً سرویس نجات را برای شما نصب کرده باشد، اجرای نهایی
`gateway install` لازم نیست.

## چرا این کار جواب می‌دهد

ربات نجات مستقل می‌ماند چون موارد زیر را جداگانه دارد:

- پروفایل/پیکربندی
- دایرکتوری وضعیت
- فضای کاری
- پورت پایه (به‌علاوه پورت‌های مشتق‌شده)
- توکن ربات Telegram

برای بیشتر راه‌اندازی‌ها، برای پروفایل نجات از یک ربات Telegram کاملاً جدا استفاده کنید:

- نگه‌داشتن آن فقط برای operatorها آسان است
- توکن و هویت ربات جداگانه دارد
- از نصب channel/app ربات اصلی مستقل است
- مسیر بازیابی ساده مبتنی بر DM را وقتی ربات اصلی خراب است فراهم می‌کند

## تغییرات `--profile rescue onboard`

`openclaw --profile rescue onboard` از جریان onboarding معمولی استفاده می‌کند، اما
همه چیز را در یک پروفایل جداگانه می‌نویسد.

در عمل، این یعنی ربات نجات موارد زیر را جداگانه دریافت می‌کند:

- فایل پیکربندی
- دایرکتوری وضعیت
- فضای کاری (به‌طور پیش‌فرض `~/.openclaw/workspace-rescue`)
- نام سرویس مدیریت‌شده

در غیر این صورت، promptها همان promptهای onboarding معمولی هستند.

## راه‌اندازی عمومی چند Gateway

طرح ربات نجات بالا ساده‌ترین حالت پیش‌فرض است، اما همین الگوی جداسازی
برای هر جفت یا گروهی از Gatewayها روی یک میزبان هم کار می‌کند.

برای یک راه‌اندازی عمومی‌تر، به هر Gateway اضافی پروفایل نام‌دار خودش و
پورت پایه خودش را بدهید:

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

سرویس‌ها از همین الگو پیروی می‌کنند:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

وقتی یک مسیر operator پشتیبان می‌خواهید، از شروع سریع ربات نجات استفاده کنید. وقتی
برای channelها، tenantها، فضاهای کاری یا نقش‌های عملیاتی متفاوت چند Gateway
بلندمدت می‌خواهید، از الگوی عمومی پروفایل استفاده کنید.

## چک‌لیست جداسازی

این موارد را برای هر نمونه Gateway یکتا نگه دارید:

- `OPENCLAW_CONFIG_PATH` — فایل پیکربندی مختص هر نمونه
- `OPENCLAW_STATE_DIR` — نشست‌ها، اعتبارنامه‌ها و cacheهای مختص هر نمونه
- `agents.defaults.workspace` — ریشه فضای کاری مختص هر نمونه
- `gateway.port` (یا `--port`) — برای هر نمونه یکتا
- پورت‌های مشتق‌شده مرورگر/canvas/CDP

اگر این موارد مشترک باشند، با raceهای پیکربندی و تداخل پورت مواجه می‌شوید.

## نگاشت پورت (مشتق‌شده)

پورت پایه = `gateway.port` (یا `OPENCLAW_GATEWAY_PORT` / `--port`).

- پورت سرویس کنترل مرورگر = پایه + 2 (فقط loopback)
- میزبان canvas روی سرور HTTP Gateway سرو می‌شود (همان پورت `gateway.port`)
- پورت‌های CDP پروفایل مرورگر به‌طور خودکار از `browser.controlPort + 9 .. + 108` تخصیص داده می‌شوند

اگر هرکدام از این‌ها را در پیکربندی یا env بازنویسی می‌کنید، باید آن‌ها را برای هر نمونه یکتا نگه دارید.

## نکات مرورگر/CDP (اشتباه رایج)

- `browser.cdpUrl` را در چند نمونه روی مقادیر یکسان pin نکنید.
- هر نمونه به پورت کنترل مرورگر و بازه CDP خودش نیاز دارد (مشتق‌شده از پورت gateway خودش).
- اگر به پورت‌های CDP صریح نیاز دارید، `browser.profiles.<name>.cdpPort` را برای هر نمونه تنظیم کنید.
- Chrome راه دور: از `browser.profiles.<name>.cdpUrl` استفاده کنید (برای هر پروفایل، برای هر نمونه).

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

- `gateway status --deep` کمک می‌کند سرویس‌های قدیمی launchd/systemd/schtasks از نصب‌های قدیمی‌تر شناسایی شوند.
- متن هشدار `gateway probe` مانند `multiple reachable gateways detected` فقط زمانی مورد انتظار است که عمداً بیش از یک gateway جداشده را اجرا می‌کنید.

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [قفل Gateway](/fa/gateway/gateway-lock)
- [پیکربندی](/fa/gateway/configuration)
