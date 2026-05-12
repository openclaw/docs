---
read_when:
    - ورود به ClawHub
    - استفاده از CLI ClawHub
    - اشکال‌زدایی خطاهای 401
summary: ورود به ClawHub، توکن‌های API، ورود از طریق CLI، ذخیره‌سازی توکن و ابطال آن.
x-i18n:
    generated_at: "2026-05-12T00:56:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# احراز هویت

ClawHub از GitHub برای ورود وب استفاده می‌کند. CLI از توکن‌های API مربوط به ClawHub استفاده می‌کند که
از طریق همان حسابِ واردشده ساخته می‌شوند.

## ورود وب

برای ورود در [clawhub.ai](https://clawhub.ai) از GitHub استفاده کنید.

حساب‌های حذف‌شده، مسدودشده، یا غیرفعال نمی‌توانند ورود عادی به ClawHub را تکمیل کنند.
اگر ورود شما را به وضعیت خارج‌شده برگرداند، ممکن است حساب شما در وضعیت مناسبی
نباشد.

## ورود CLI

جریان پیش‌فرض ورود CLI مرورگر شما را باز می‌کند:

```bash
clawhub login
clawhub whoami
```

چه اتفاقی می‌افتد:

1. CLI یک سرور callback موقت را روی `127.0.0.1` راه‌اندازی می‌کند.
2. مرورگر شما صفحه ورود ClawHub را باز می‌کند.
3. پس از ورود با GitHub، ClawHub یک توکن API می‌سازد.
4. مرورگر به callback محلی هدایت می‌شود.
5. CLI توکن را در فایل پیکربندی ClawHub شما ذخیره می‌کند.

اگر مرورگر شما به‌دلیل فایروال، VPN، یا
قواعد proxy نتواند به callback محلی دسترسی پیدا کند، از جریان توکن بدون مرورگر استفاده کنید.

## ورود بدون مرورگر

در رابط کاربری وب ClawHub یک توکن بسازید، سپس آن را به CLI بدهید:

```bash
clawhub login --token clh_...
```

از این جریان برای سرورها، کارهای CI، یا محیط‌های فقط ترمینال استفاده کنید.

برای shellهای راه دور که می‌توانید در جایی دیگر مرورگر باز کنید، اجرا کنید:

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

## لغو اعتبار

می‌توانید توکن‌های API را در رابط کاربری وب ClawHub لغو اعتبار کنید.

توکن‌های لغوشده، نامعتبر، یا مفقود `401 Unauthorized` برمی‌گردانند. دوباره
با `clawhub login` وارد شوید یا با `clawhub login --token` یک توکن تازه ارائه کنید.

حساب‌های حذف‌شده، مسدودشده، یا غیرفعال نمی‌توانند به استفاده از توکن‌های API موجود ادامه دهند.
