---
read_when:
    - ورود به ClawHub
    - استفاده از CLI ClawHub
    - اشکال‌زدایی خطاهای 401
summary: ورود به ClawHub، توکن‌های API، ورود CLI، ذخیره‌سازی توکن، و لغو آن.
x-i18n:
    generated_at: "2026-07-03T17:29:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# احراز هویت

ClawHub برای ورود وب از GitHub استفاده می‌کند. CLI از توکن‌های API ClawHub استفاده می‌کند که
از طریق همان حساب واردشده ایجاد می‌شوند.

## ورود وب

برای ورود در [clawhub.ai](https://clawhub.ai) از GitHub استفاده کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند ورود عادی ClawHub را کامل کنند.
اگر ورود شما را به وضعیت خارج‌شده برمی‌گرداند، ممکن است حساب شما در وضعیت مناسبی
نباشد. اگر حساب شما مسدود یا غیرفعال شده است، در صورتی که فکر می‌کنید این یک
اشتباه است، از [فرم تجدیدنظر ClawHub](https://appeals.openclaw.ai/) استفاده کنید.

## ورود CLI

جریان پیش‌فرض ورود CLI مرورگر شما را باز می‌کند:

```bash
clawhub login
clawhub whoami
```

چه اتفاقی می‌افتد:

1. CLI یک سرور callback موقت روی `127.0.0.1` راه‌اندازی می‌کند.
2. مرورگر شما صفحه ورود ClawHub را باز می‌کند.
3. پس از ورود با GitHub، ClawHub یک توکن API ایجاد می‌کند.
4. مرورگر به callback محلی هدایت می‌شود.
5. CLI توکن را در فایل پیکربندی ClawHub شما ذخیره می‌کند.

اگر مرورگر شما به دلیل قواعد فایروال، VPN یا پروکسی نمی‌تواند به callback محلی برسد،
از جریان توکن headless استفاده کنید.

## ورود headless

در رابط کاربری وب ClawHub یک توکن ایجاد کنید، سپس آن را به CLI بدهید:

```bash
clawhub login --token clh_...
```

از این جریان برای سرورها، کارهای CI، یا محیط‌های فقط ترمینال استفاده کنید.

برای shellهای راه دور که می‌توانید مرورگری را در جای دیگری باز کنید، اجرا کنید:

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

مسیر را با این مورد بازنویسی کنید:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

توکن ذخیره‌شده را برای راه‌اندازی CI با این دستور چاپ کنید:

```bash
clawhub token
```

## ابطال

می‌توانید توکن‌های API را در رابط کاربری وب ClawHub ابطال کنید.

توکن‌های ابطال‌شده، نامعتبر یا مفقود `401 Unauthorized` برمی‌گردانند. دوباره
با `clawhub login` وارد شوید یا با `clawhub login --token` یک توکن تازه ارائه کنید.

حساب‌های حذف‌شده، مسدودشده یا غیرفعال‌شده نمی‌توانند به استفاده از توکن‌های API موجود ادامه دهند.
اگر حساب شما مسدود یا غیرفعال شده است، در صورتی که فکر می‌کنید این یک
اشتباه است، از [فرم تجدیدنظر ClawHub](https://appeals.openclaw.ai/) استفاده کنید.
