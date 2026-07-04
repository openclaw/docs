---
read_when:
    - ورود به ClawHub
    - استفاده از CLI ClawHub
    - اشکال‌زدایی خطاهای 401
summary: ورود به ClawHub، توکن‌های API، ورود CLI، ذخیره‌سازی توکن و ابطال.
x-i18n:
    generated_at: "2026-07-04T03:56:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# احراز هویت

ClawHub برای ورود وب از GitHub استفاده می‌کند. CLI از توکن‌های API مربوط به ClawHub استفاده می‌کند که از طریق همان حساب واردشده ساخته شده‌اند.

## ورود وب

برای ورود، از GitHub در [clawhub.ai](https://clawhub.ai) استفاده کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند ورود عادی ClawHub را کامل کنند. اگر پس از ورود به حالت خارج‌شده بازگردانده می‌شوید، ممکن است حساب شما وضعیت مناسبی نداشته باشد. اگر حساب شما مسدود یا غیرفعال شده است و فکر می‌کنید این یک اشتباه است، از [فرم درخواست تجدیدنظر ClawHub](https://appeals.openclaw.ai/) استفاده کنید.

## ورود CLI

جریان پیش‌فرض ورود CLI مرورگر شما را باز می‌کند:

```bash
clawhub login
clawhub whoami
```

چه اتفاقی می‌افتد:

1. CLI یک سرور بازفراخوان موقت روی `127.0.0.1` راه‌اندازی می‌کند.
2. مرورگر شما صفحه ورود ClawHub را باز می‌کند.
3. پس از ورود با GitHub، ClawHub یک توکن API می‌سازد.
4. مرورگر دوباره به بازفراخوان محلی هدایت می‌شود.
5. CLI توکن را در فایل پیکربندی ClawHub شما ذخیره می‌کند.

اگر مرورگر شما به دلیل قوانین firewall، VPN یا proxy نمی‌تواند به بازفراخوان محلی دسترسی پیدا کند، از جریان توکن بدون رابط گرافیکی استفاده کنید.

## ورود بدون رابط گرافیکی

یک توکن در رابط کاربری وب ClawHub بسازید، سپس آن را به CLI بدهید:

```bash
clawhub login --token clh_...
```

از این جریان برای سرورها، کارهای CI یا محیط‌های فقط ترمینال استفاده کنید.

برای shellهای راه‌دور که می‌توانید در جایی دیگر مرورگر باز کنید، اجرا کنید:

```bash
clawhub login --device
```

CLI یک کد یک‌بارمصرف چاپ می‌کند و منتظر می‌ماند تا آن را در `https://clawhub.ai/cli/device` مجاز کنید.

## ذخیره‌سازی توکن

مسیرهای پیش‌فرض پیکربندی:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

مسیر را با این مورد بازنویسی کنید:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

توکن ذخیره‌شده را برای راه‌اندازی CI با این دستور چاپ کنید:

```bash
clawhub token
```

## لغو اعتبار

می‌توانید توکن‌های API را در رابط کاربری وب ClawHub لغو اعتبار کنید.

توکن‌های لغواعتبارشده، نامعتبر یا گم‌شده، `401 Unauthorized` برمی‌گردانند. دوباره با `clawhub login` وارد شوید یا با `clawhub login --token` یک توکن تازه ارائه کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند به استفاده از توکن‌های API موجود ادامه دهند. اگر حساب شما مسدود یا غیرفعال شده است و فکر می‌کنید این یک اشتباه است، از [فرم درخواست تجدیدنظر ClawHub](https://appeals.openclaw.ai/) استفاده کنید.
