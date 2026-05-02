---
read_when:
    - شما در حال انجام راه‌اندازی اولیه بدون فرایند کامل آغازبه‌کار CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
summary: مرجع CLI برای `openclaw setup` (مقداردهی اولیه پیکربندی + فضای کاری)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-02T20:42:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` و فضای کاری عامل را مقداردهی اولیه کنید.

مرتبط:

- شروع به کار: [شروع به کار](/fa/start/getting-started)
- راه‌اندازی CLI: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)

## نمونه‌ها

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## گزینه‌ها

- `--workspace <dir>`: دایرکتوری فضای کاری عامل (با نام `agents.defaults.workspace` ذخیره می‌شود)
- `--wizard`: راه‌اندازی اولیه را اجرا کنید
- `--non-interactive`: راه‌اندازی اولیه را بدون اعلان‌ها اجرا کنید
- `--mode <local|remote>`: حالت راه‌اندازی اولیه
- `--import-from <provider>`: ارائه‌دهندهٔ مهاجرت برای اجرا در طول راه‌اندازی اولیه
- `--import-source <path>`: خانهٔ عامل مبدأ برای `--import-from`
- `--import-secrets`: رازهای پشتیبانی‌شده را در طول مهاجرتِ راه‌اندازی اولیه وارد کنید
- `--remote-url <url>`: نشانی وب‌سوکت Gateway راه‌دور
- `--remote-token <token>`: توکن Gateway راه‌دور

برای اجرای راه‌اندازی اولیه از طریق setup:

```bash
openclaw setup --wizard
```

نکته‌ها:

- `openclaw setup` ساده، پیکربندی + فضای کاری را بدون جریان کامل راه‌اندازی اولیه مقداردهی اولیه می‌کند.
- پس از setup ساده، `openclaw configure` را اجرا کنید تا مدل‌ها، کانال‌ها، Gateway، Pluginها، Skills یا بررسی‌های سلامت را انتخاب کنید.
- وقتی هرکدام از پرچم‌های راه‌اندازی اولیه وجود داشته باشد، راه‌اندازی اولیه به‌طور خودکار اجرا می‌شود (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیهٔ تعاملی می‌تواند مهاجرت را به‌طور خودکار پیشنهاد کند. راه‌اندازی اولیهٔ واردسازی به setup تازه نیاز دارد؛ برای طرح‌های اجرای آزمایشی، پشتیبان‌گیری‌ها و حالت بازنویسی خارج از راه‌اندازی اولیه، از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی نصب](/fa/install)
