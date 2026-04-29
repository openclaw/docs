---
read_when:
    - در حال انجام راه‌اندازی نخستین اجرا بدون فرایند کامل آماده‌سازی CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
summary: مرجع CLI برای `openclaw setup` (مقداردهی اولیه پیکربندی + فضای کاری)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-04-29T22:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` و فضای کاری عامل را مقداردهی اولیه کنید.

مرتبط:

- شروع به کار: [شروع به کار](/fa/start/getting-started)
- راه‌اندازی اولیه CLI: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)

## نمونه‌ها

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## گزینه‌ها

- `--workspace <dir>`: دایرکتوری فضای کاری عامل (به‌صورت `agents.defaults.workspace` ذخیره می‌شود)
- `--wizard`: راه‌اندازی اولیه را اجرا کنید
- `--non-interactive`: راه‌اندازی اولیه را بدون اعلان‌ها اجرا کنید
- `--mode <local|remote>`: حالت راه‌اندازی اولیه
- `--import-from <provider>`: ارائه‌دهنده مهاجرت برای اجرا در هنگام راه‌اندازی اولیه
- `--import-source <path>`: خانه عامل مبدأ برای `--import-from`
- `--import-secrets`: رازهای پشتیبانی‌شده را هنگام مهاجرت در راه‌اندازی اولیه وارد کنید
- `--remote-url <url>`: نشانی WebSocket ‏Gateway راه دور
- `--remote-token <token>`: توکن Gateway راه دور

برای اجرای راه‌اندازی اولیه از طریق setup:

```bash
openclaw setup --wizard
```

نکته‌ها:

- `openclaw setup` ساده، پیکربندی و فضای کاری را بدون جریان کامل راه‌اندازی اولیه مقداردهی اولیه می‌کند.
- وقتی هرکدام از پرچم‌های راه‌اندازی اولیه حاضر باشند، راه‌اندازی اولیه به‌طور خودکار اجرا می‌شود (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه تعاملی می‌تواند مهاجرت را به‌طور خودکار پیشنهاد دهد. راه‌اندازی اولیه واردسازی به یک setup تازه نیاز دارد؛ برای طرح‌های اجرای آزمایشی، پشتیبان‌گیری‌ها و حالت بازنویسی خارج از راه‌اندازی اولیه از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی نصب](/fa/install)
