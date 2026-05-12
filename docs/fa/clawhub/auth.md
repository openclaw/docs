---
read_when:
    - ورود به ClawHub
    - استفاده از CLI ClawHub
    - اشکال‌زدایی خطاهای 401
summary: ورود به ClawHub، توکن‌های API، ورود CLI، ذخیره‌سازی توکن، و ابطال.
x-i18n:
    generated_at: "2026-05-12T12:49:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# احراز هویت

ClawHub برای ورود وب از GitHub استفاده می‌کند. CLI از توکن‌های API ClawHub استفاده می‌کند که
از طریق همان حسابِ واردشده ساخته می‌شوند.

## ورود وب

برای ورود در [clawhub.ai](https://clawhub.ai) از GitHub استفاده کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند ورود عادی ClawHub را کامل کنند.
اگر ورود شما را به حالت خارج‌شده از حساب برگرداند، ممکن است حساب شما وضعیت مناسبی
نداشته باشد.

## ورود CLI

روند پیش‌فرض ورود CLI مرورگر شما را باز می‌کند:

```bash
clawhub login
clawhub whoami
```

چه اتفاقی می‌افتد:

1. CLI یک سرور callback موقت روی `127.0.0.1` راه‌اندازی می‌کند.
2. مرورگر شما صفحه ورود ClawHub را باز می‌کند.
3. پس از ورود با GitHub، ClawHub یک توکن API ایجاد می‌کند.
4. مرورگر دوباره به callback محلی هدایت می‌شود.
5. CLI توکن را در فایل پیکربندی ClawHub شما ذخیره می‌کند.

اگر مرورگر شما به دلیل قوانین فایروال، VPN یا
پراکسی نتواند به callback محلی برسد، از روند توکن بدون واسط گرافیکی استفاده کنید.

## ورود بدون واسط گرافیکی

در رابط وب ClawHub یک توکن ایجاد کنید، سپس آن را به CLI بدهید:

```bash
clawhub login --token clh_...
```

از این روند برای سرورها، کارهای CI یا محیط‌های فقط ترمینال استفاده کنید.

برای پوسته‌های راه دور که می‌توانید در جای دیگری مرورگر باز کنید، اجرا کنید:

```bash
clawhub login --device
```

CLI یک کد یک‌بارمصرف چاپ می‌کند و منتظر می‌ماند تا شما آن را در
`https://clawhub.ai/cli/device` مجاز کنید.

## ذخیره‌سازی توکن

مسیرهای پیش‌فرض پیکربندی:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

مسیر را با این مقدار بازنویسی کنید:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## لغو

می‌توانید توکن‌های API را در رابط وب ClawHub لغو کنید.

توکن‌های لغوشده، نامعتبر یا مفقود `401 Unauthorized` برمی‌گردانند. دوباره
با `clawhub login` وارد شوید یا با `clawhub login --token` یک توکن تازه ارائه کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند به استفاده از توکن‌های API موجود ادامه دهند.
