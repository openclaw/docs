---
read_when:
    - شما در حال انجام راه‌اندازی نخستین اجرا بدون فرایند کامل آماده‌سازی CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
summary: مرجع CLI برای `openclaw setup` (مقداردهی اولیه پیکربندی + فضای کاری)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-06T17:55:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` و فضای کاری عامل را مقداردهی اولیه کنید.

<Note>
`openclaw setup` برای نصب‌های دارای پیکربندی قابل تغییر است. در حالت Nix (`OPENCLAW_NIX_MODE=1`)، OpenClaw نوشتن تنظیمات setup را رد می‌کند، زیرا فایل پیکربندی توسط Nix مدیریت می‌شود. عامل‌ها باید از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) رسمی یا پیکربندی منبع معادل برای یک بسته Nix دیگر استفاده کنند.
</Note>

مرتبط:

- شروع کار: [شروع کار](/fa/start/getting-started)
- راه‌اندازی اولیه CLI: [راه‌اندازی اولیه (CLI)](/fa/start/wizard)

## مثال‌ها

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## گزینه‌ها

- `--workspace <dir>`: دایرکتوری فضای کاری عامل (به‌صورت `agents.defaults.workspace` ذخیره می‌شود)
- `--wizard`: اجرای راه‌اندازی اولیه
- `--non-interactive`: اجرای راه‌اندازی اولیه بدون اعلان‌ها
- `--mode <local|remote>`: حالت راه‌اندازی اولیه
- `--import-from <provider>`: ارائه‌دهنده مهاجرت برای اجرا هنگام راه‌اندازی اولیه
- `--import-source <path>`: خانه عامل مبدأ برای `--import-from`
- `--import-secrets`: وارد کردن اسرار پشتیبانی‌شده هنگام مهاجرت راه‌اندازی اولیه
- `--remote-url <url>`: URL وب‌سوکت Gateway راه دور
- `--remote-token <token>`: توکن Gateway راه دور

برای اجرای راه‌اندازی اولیه از طریق setup:

```bash
openclaw setup --wizard
```

نکته‌ها:

- اجرای ساده `openclaw setup` پیکربندی و فضای کاری را بدون جریان کامل راه‌اندازی اولیه مقداردهی اولیه می‌کند.
- پس از setup ساده، برای انتخاب مدل‌ها، کانال‌ها، Gateway، plugins، Skills، یا بررسی‌های سلامت، `openclaw configure` را اجرا کنید.
- راه‌اندازی اولیه زمانی به‌صورت خودکار اجرا می‌شود که هرکدام از پرچم‌های راه‌اندازی اولیه وجود داشته باشند (`--wizard`، `--non-interactive`، `--mode`، `--import-from`، `--import-source`، `--import-secrets`، `--remote-url`، `--remote-token`).
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه تعاملی می‌تواند مهاجرت را به‌صورت خودکار پیشنهاد کند. راه‌اندازی اولیه واردسازی به یک setup تازه نیاز دارد؛ برای طرح‌های dry-run، پشتیبان‌گیری‌ها و حالت بازنویسی بیرون از راه‌اندازی اولیه از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی نصب](/fa/install)
