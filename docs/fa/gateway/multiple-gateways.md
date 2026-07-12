---
read_when:
    - اجرای بیش از یک Gateway روی یک دستگاه
    - برای هر Gateway به پیکربندی، وضعیت و پورت‌های مجزا نیاز دارید
summary: اجرای چند Gateway متعلق به OpenClaw روی یک میزبان (ایزوله‌سازی، پورت‌ها و پروفایل‌ها)
title: چندین Gateway
x-i18n:
    generated_at: "2026-07-12T10:04:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

بیشتر راه‌اندازی‌ها به یک Gateway نیاز دارند؛ یک Gateway واحد چندین اتصال پیام‌رسانی و عامل را مدیریت می‌کند. تنها زمانی Gatewayهای جداگانه با پروفایل‌ها/درگاه‌های ایزوله اجرا کنید که به ایزوله‌سازی قوی‌تر یا افزونگی نیاز دارید (برای مثال، یک ربات نجات).

## شروع سریع ربات نجات

ساده‌ترین راه‌اندازی ربات نجات:

- ربات اصلی را روی پروفایل پیش‌فرض نگه دارید.
- ربات نجات را با `--profile rescue` و توکن ربات Telegram مختص خودش اجرا کنید.
- ربات نجات را روی درگاه پایه متفاوتی، برای مثال `19789`، قرار دهید.

این کار باعث می‌شود اگر ربات اصلی از کار افتاد، ربات نجات همچنان بتواند اشکال‌زدایی کند یا تغییرات پیکربندی را اعمال کند. بین درگاه‌های پایه دست‌کم ۲۰ درگاه فاصله بگذارید تا درگاه‌های مشتق‌شده مرورگر/CDP هرگز با یکدیگر تداخل نداشته باشند.

```bash
# ربات نجات (ربات Telegram جداگانه، پروفایل جداگانه، درگاه 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

اگر ربات اصلی شما از قبل در حال اجرا است، معمولاً همین کافی است. اگر فرایند راه‌اندازی اولیه از قبل سرویس نجات را نصب کرده است، از اجرای `gateway install` نهایی صرف‌نظر کنید.

هنگام اجرای `openclaw --profile rescue onboard`:

- از یک توکن ربات Telegram جداگانه و اختصاص‌یافته به حساب نجات استفاده کنید (به‌راحتی می‌توان آن را فقط در اختیار اپراتور نگه داشت، از نصب کانال/برنامه ربات اصلی مستقل است و یک مسیر بازیابی ساده مبتنی بر پیام خصوصی فراهم می‌کند).
- نام پروفایل `rescue` را حفظ کنید.
- از درگاه پایه‌ای استفاده کنید که دست‌کم ۲۰ شماره بالاتر از درگاه ربات اصلی باشد.
- فضای کاری پیش‌فرض نجات را بپذیرید، مگر اینکه از قبل خودتان یکی را مدیریت می‌کنید.

### آنچه `--profile rescue onboard` تغییر می‌دهد

`--profile rescue onboard` جریان عادی راه‌اندازی اولیه را اجرا می‌کند، اما همه‌چیز را در پروفایلی جداگانه می‌نویسد؛ بنابراین ربات نجات موارد اختصاصی زیر را خواهد داشت:

- فایل پروفایل/پیکربندی
- پوشه وضعیت
- فضای کاری (پیش‌فرض: `~/.openclaw/workspace-rescue`)
- نام سرویس مدیریت‌شده
- درگاه پایه (به‌همراه درگاه‌های مشتق‌شده)
- توکن ربات Telegram

سایر پرسش‌ها با راه‌اندازی اولیه عادی یکسان هستند.

## راه‌اندازی عمومی چند Gateway

همین الگوی ایزوله‌سازی برای هر جفت یا گروهی از Gatewayها روی یک میزبان کاربرد دارد؛ به هر Gateway اضافی، پروفایل نام‌گذاری‌شده و درگاه پایه مختص خودش را اختصاص دهید:

```bash
# اصلی (پروفایل پیش‌فرض)
openclaw setup
openclaw gateway --port 18789

# Gateway اضافی
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

استفاده از پروفایل‌های نام‌گذاری‌شده برای هر دو نیز امکان‌پذیر است:

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

برای یک مسیر اپراتوری پشتیبان از شروع سریع ربات نجات استفاده کنید؛ برای چندین Gateway بلندمدت در کانال‌ها، مستأجرها، فضاهای کاری یا نقش‌های عملیاتی مختلف، از الگوی عمومی پروفایل استفاده کنید.

## چک‌لیست ایزوله‌سازی

این موارد را برای هر نمونه Gateway یکتا نگه دارید:

| تنظیم                         | هدف                                           |
| ---------------------------- | --------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | فایل پیکربندی مختص هر نمونه                   |
| `OPENCLAW_STATE_DIR`         | نشست‌ها، اطلاعات ورود و حافظه‌های نهان هر نمونه |
| `agents.defaults.workspace`  | ریشه فضای کاری مختص هر نمونه                  |
| `gateway.port` (یا `--port`) | یکتا برای هر نمونه                            |
| درگاه‌های مشتق‌شده مرورگر/CDP | پایین را ببینید                               |

اشتراک‌گذاری هرکدام از این موارد باعث رقابت در پیکربندی و تداخل درگاه‌ها می‌شود.

## نگاشت درگاه‌ها (مشتق‌شده)

درگاه پایه = `gateway.port` (یا `OPENCLAW_GATEWAY_PORT` / `--port`).

- درگاه سرویس کنترل مرورگر = درگاه پایه + ۲ (فقط local loopback).
- میزبان Canvas روی خود سرور HTTP متعلق به Gateway ارائه می‌شود (همان درگاه `gateway.port`).
- درگاه‌های CDP پروفایل مرورگر به‌طور خودکار از `browser control port + 9` تا `+ 108` تخصیص می‌یابند.

اگر هرکدام از این موارد را در پیکربندی یا متغیرهای محیطی بازنویسی کنید، باید آن‌ها را برای هر نمونه یکتا نگه دارید.

## نکات مرورگر/CDP (اشتباه رایج)

- مقدار `browser.cdpUrl` را در چند نمونه روی یک مقدار یکسان **ثابت نکنید**.
- هر نمونه به درگاه کنترل مرورگر و بازه CDP مختص خودش نیاز دارد (که از درگاه Gateway آن مشتق می‌شوند).
- برای درگاه‌های صریح CDP، مقدار `browser.profiles.<name>.cdpPort` را برای هر نمونه تنظیم کنید.
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
- متن هشدار `gateway probe` مانند `multiple reachable gateway identities detected` تنها زمانی مورد انتظار است که عمداً بیش از یک Gateway ایزوله اجرا می‌کنید، یا زمانی که OpenClaw نمی‌تواند اثبات کند اهداف قابل‌دسترسی کاوش به یک Gateway یکسان تعلق دارند. یک تونل SSH، نشانی پراکسی یا نشانی راه‌دور پیکربندی‌شده به همان Gateway، حتی اگر درگاه‌های انتقال متفاوت باشند، یک Gateway با چند انتقال محسوب می‌شود.

## مطالب مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [قفل Gateway](/fa/gateway/gateway-lock)
- [پیکربندی](/fa/gateway/configuration)
