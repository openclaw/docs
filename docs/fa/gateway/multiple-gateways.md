---
read_when:
    - اجرای بیش از یک Gateway روی یک دستگاه
    - برای هر Gateway به پیکربندی، وضعیت و پورت‌های مجزا نیاز دارید
summary: اجرای چند Gateway متعلق به OpenClaw روی یک میزبان (جداسازی، پورت‌ها و پروفایل‌ها)
title: چند Gateway
x-i18n:
    generated_at: "2026-07-16T16:17:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

بیشتر راه‌اندازی‌ها به یک Gateway نیاز دارند — یک Gateway واحد چندین اتصال پیام‌رسانی و عامل را مدیریت می‌کند. فقط زمانی Gatewayهای جداگانه با پروفایل‌ها/درگاه‌های ایزوله اجرا کنید که به ایزوله‌سازی قوی‌تر یا افزونگی نیاز دارید (برای مثال، یک ربات نجات).

## شروع سریع ربات نجات

ساده‌ترین راه‌اندازی ربات نجات:

- ربات اصلی را روی پروفایل پیش‌فرض نگه دارید.
- ربات نجات را روی `--profile rescue` و با توکن ربات Telegram مختص خودش اجرا کنید.
- ربات نجات را روی یک درگاه پایه متفاوت، برای مثال `19789`، قرار دهید.

با این کار، اگر ربات اصلی از کار بیفتد، ربات نجات همچنان می‌تواند اشکال‌زدایی کند یا تغییرات پیکربندی را اعمال کند. بین درگاه‌های پایه حداقل 20 درگاه فاصله بگذارید تا درگاه‌های مشتق‌شده مرورگر/CDP هرگز با یکدیگر تداخل نکنند.

```bash
# ربات نجات (ربات Telegram جداگانه، پروفایل جداگانه، درگاه 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

اگر ربات اصلی از قبل در حال اجراست، معمولاً همین تمام چیزی است که نیاز دارید. اگر فرایند راه‌اندازی اولیه قبلاً سرویس نجات را نصب کرده است، `gateway install` نهایی را رد کنید.

در طول `openclaw --profile rescue onboard`:

- از یک توکن ربات Telegram جداگانه و اختصاصی برای حساب نجات استفاده کنید (به‌راحتی می‌توان دسترسی آن را فقط به اپراتور محدود کرد، از نصب کانال/برنامه ربات اصلی مستقل است و یک مسیر ساده بازیابی مبتنی بر پیام خصوصی فراهم می‌کند).
- نام پروفایل `rescue` را حفظ کنید.
- از درگاه پایه‌ای استفاده کنید که حداقل 20 شماره از درگاه ربات اصلی بیشتر باشد.
- فضای کاری پیش‌فرض نجات را بپذیرید، مگر اینکه از قبل خودتان یکی را مدیریت می‌کنید.

### تغییراتی که `--profile rescue onboard` ایجاد می‌کند

`--profile rescue onboard` جریان عادی راه‌اندازی اولیه را اجرا می‌کند، اما همه‌چیز را در یک پروفایل جداگانه می‌نویسد؛ بنابراین ربات نجات موارد مختص خودش را دریافت می‌کند:

- فایل پروفایل/پیکربندی
- دایرکتوری وضعیت
- فضای کاری (پیش‌فرض: `~/.openclaw/workspace-rescue`)
- نام سرویس مدیریت‌شده
- درگاه پایه (به‌همراه درگاه‌های مشتق‌شده)
- توکن ربات Telegram

سایر اعلان‌ها با راه‌اندازی اولیه عادی یکسان هستند.

## راه‌اندازی عمومی چند Gateway

همین الگوی ایزوله‌سازی برای هر جفت یا گروهی از Gatewayها روی یک میزبان کار می‌کند — به هر Gateway اضافی، پروفایل نام‌گذاری‌شده و درگاه پایه مختص خودش را بدهید:

```bash
# اصلی (پروفایل پیش‌فرض)
openclaw setup
openclaw gateway --port 18789

# Gateway اضافی
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

پروفایل‌های نام‌گذاری‌شده در هر دو طرف نیز کار می‌کنند:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

سرویس‌ها نیز از همین الگو پیروی می‌کنند:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

برای داشتن یک مسیر اپراتوری پشتیبان از شروع سریع ربات نجات استفاده کنید؛ برای چندین Gateway با عمر طولانی در کانال‌ها، مستأجرها، فضاهای کاری یا نقش‌های عملیاتی مختلف، از الگوی عمومی پروفایل استفاده کنید.

## چک‌لیست ایزوله‌سازی

این موارد را برای هر نمونه Gateway منحصربه‌فرد نگه دارید:

| تنظیم                         | هدف                                  |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | فایل پیکربندی مختص هر نمونه          |
| `OPENCLAW_STATE_DIR`         | نشست‌ها، اعتبارنامه‌ها و حافظه‌های نهان مختص هر نمونه |
| `agents.defaults.workspace`  | ریشه فضای کاری مختص هر نمونه         |
| `gateway.port` (یا `--port`) | منحصربه‌فرد برای هر نمونه            |
| درگاه‌های مشتق‌شده مرورگر/CDP | بخش زیر را ببینید                    |

اشتراک‌گذاری هرکدام از این موارد باعث تداخل پیکربندی، وضعیت یا درگاه می‌شود. راه‌اندازی Gateway
مالکیت منحصربه‌فرد دایرکتوری وضعیت را حتی زمانی اعمال می‌کند که
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` تک‌نمونه‌ای بودن هر پیکربندی را نادیده می‌گیرد.

## نگاشت درگاه‌ها (مشتق‌شده)

درگاه پایه = `gateway.port` (یا `OPENCLAW_GATEWAY_PORT` / `--port`).

- درگاه سرویس کنترل مرورگر = پایه + 2 (فقط loopback).
- میزبان Canvas روی خود سرور HTTP متعلق به Gateway ارائه می‌شود (همان درگاه `gateway.port`).
- درگاه‌های CDP پروفایل مرورگر به‌طور خودکار از `browser control port + 9` تا `+ 108` تخصیص داده می‌شوند.

اگر هرکدام از این موارد را در پیکربندی یا متغیرهای محیطی بازنویسی کنید، باید آن‌ها را برای هر نمونه منحصربه‌فرد نگه دارید.

## نکات مرورگر/CDP (اشتباه رایج)

- `browser.cdpUrl` را در چند نمونه روی یک مقدار یکسان **ثابت نکنید**.
- هر نمونه به درگاه کنترل مرورگر و محدوده CDP مختص خودش نیاز دارد (که از درگاه Gateway آن مشتق می‌شود).
- برای درگاه‌های صریح CDP، `browser.profiles.<name>.cdpPort` را برای هر نمونه تنظیم کنید.
- برای Chrome راه‌دور، از `browser.profiles.<name>.cdpUrl` استفاده کنید (برای هر پروفایل و هر نمونه).

## نمونه دستی متغیرهای محیطی

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

- `gateway status --deep` سرویس‌های قدیمی launchd/systemd/schtasks باقی‌مانده از نصب‌های پیشین را شناسایی می‌کند.
- متن هشدار `gateway probe`، مانند `multiple reachable gateway identities detected`، فقط زمانی مورد انتظار است که عمداً بیش از یک Gateway ایزوله اجرا می‌کنید، یا زمانی که OpenClaw نمی‌تواند ثابت کند اهداف بررسی دردسترس همان Gateway هستند. یک تونل SSH، نشانی پروکسی یا نشانی راه‌دور پیکربندی‌شده به همان Gateway، حتی اگر درگاه‌های انتقال متفاوت باشند، یک Gateway با چند روش انتقال محسوب می‌شود.

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [قفل Gateway](/fa/gateway/gateway-lock)
- [پیکربندی](/fa/gateway/configuration)
