---
read_when:
    - در حال انجام راه‌اندازی اولیه بدون فرایند کامل شروع به کار CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
    - شما به همهٔ پرچم‌ها و اینکه setup چگونه بین حالت baseline و wizard تصمیم می‌گیرد نیاز دارید.
summary: مرجع CLI برای `openclaw setup` (مقداردهی اولیه پیکربندی به‌همراه فضای کاری، و در صورت تمایل اجرای فرایند راه‌اندازی اولیه)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-06-27T17:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

پیکربندی پایه و فضای کاری عامل را مقداردهی اولیه کنید. اگر هر پرچم راه‌اندازی اولیه‌ای وجود داشته باشد، راه‌انداز تعاملی را نیز اجرا می‌کند.

<Note>
`openclaw setup` برای نصب‌های پیکربندی قابل تغییر است. در حالت Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw از نوشتن تنظیمات خودداری می‌کند، چون فایل پیکربندی توسط Nix مدیریت می‌شود. از [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) رسمی یا پیکربندی منبع معادل برای یک بسته Nix دیگر استفاده کنید.
</Note>

## گزینه‌ها

| پرچم                      | توضیح                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دایرکتوری فضای کاری عامل (پیش‌فرض `~/.openclaw/workspace`؛ به‌صورت `agents.defaults.workspace` ذخیره می‌شود). |
| `--wizard`                 | راه‌اندازی اولیه تعاملی را اجرا کنید.                                                                      |
| `--non-interactive`        | راه‌اندازی اولیه را بدون اعلان‌ها اجرا کنید.                                                               |
| `--accept-risk`            | خطر دسترسی عامل به کل سیستم را تأیید کنید؛ همراه با `--non-interactive` الزامی است.                       |
| `--mode <mode>`            | حالت راه‌اندازی اولیه: `local` یا `remote`.                                                               |
| `--import-from <provider>` | ارائه‌دهنده مهاجرت برای اجرا در طول راه‌اندازی اولیه.                                                     |
| `--import-source <path>`   | خانه عامل مبدأ برای `--import-from`.                                                                       |
| `--import-secrets`         | اسرار پشتیبانی‌شده را در طول مهاجرت راه‌اندازی اولیه وارد کنید.                                           |
| `--remote-url <url>`       | URL مربوط به WebSocket در Gateway راه دور.                                                                 |
| `--remote-token <token>`   | توکن Gateway راه دور (اختیاری).                                                                            |

### فعال‌سازی خودکار راه‌انداز تعاملی

`openclaw setup` وقتی هرکدام از این پرچم‌ها به‌صراحت وجود داشته باشند، حتی بدون `--wizard`، راه‌انداز تعاملی را اجرا می‌کند:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## نمونه‌ها

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## یادداشت‌ها

- `openclaw setup` ساده، پیکربندی و فضای کاری را بدون اجرای جریان کامل راه‌اندازی اولیه مقداردهی اولیه می‌کند.
- پس از راه‌اندازی ساده، برای مسیر کامل هدایت‌شده `openclaw onboard`، برای تغییرات هدفمند `openclaw configure`، یا برای افزودن حساب‌های کانال `openclaw channels add` را اجرا کنید.
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه تعاملی می‌تواند مهاجرت را به‌طور خودکار پیشنهاد دهد. راه‌اندازی اولیه همراه با وارد کردن داده‌ها به یک راه‌اندازی تازه نیاز دارد؛ برای طرح‌های اجرای آزمایشی، پشتیبان‌گیری‌ها، و حالت بازنویسی خارج از راه‌اندازی اولیه، از [Migrate](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- [شروع به کار](/fa/start/getting-started)
- [نمای کلی نصب](/fa/install)
