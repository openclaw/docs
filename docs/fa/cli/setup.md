---
read_when:
    - در حال انجام راه‌اندازی اجرای نخست بدون فرایند کامل راه‌اندازی اولیه CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
    - به همهٔ پرچم‌ها و اینکه راه‌اندازی چگونه بین حالت پایه و حالت راهنما تصمیم می‌گیرد نیاز دارید
summary: مرجع CLI برای `openclaw setup` (پیکربندی به‌همراه فضای کاری را مقداردهی اولیه می‌کند؛ به‌صورت اختیاری راه‌اندازی اولیه را اجرا می‌کند)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-05-10T19:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

پیکربندی پایه و فضای کاری عامل را مقداردهی اولیه کنید. با وجود هر پرچم راه‌اندازی اولیه، جادوگر را نیز اجرا می‌کند.

<Note>
`openclaw setup` برای نصب‌های پیکربندی تغییرپذیر است. در حالت Nix (`OPENCLAW_NIX_MODE=1`)، OpenClaw نوشتن‌های setup را رد می‌کند، چون فایل پیکربندی توسط Nix مدیریت می‌شود. از [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) فرست‌پارتی یا پیکربندی منبع معادل برای یک بسته Nix دیگر استفاده کنید.
</Note>

## گزینه‌ها

| پرچم                       | توضیح                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دایرکتوری فضای کاری عامل (پیش‌فرض `~/.openclaw/workspace`؛ به‌صورت `agents.defaults.workspace` ذخیره می‌شود). |
| `--wizard`                 | راه‌اندازی اولیه تعاملی را اجرا کنید.                                                                         |
| `--non-interactive`        | راه‌اندازی اولیه را بدون اعلان‌ها اجرا کنید.                                                                     |
| `--mode <mode>`            | حالت راه‌اندازی اولیه: `local` یا `remote`.                                                               |
| `--import-from <provider>` | ارائه‌دهنده مهاجرت برای اجرا در طول راه‌اندازی اولیه.                                                        |
| `--import-source <path>`   | خانه عامل منبع برای `--import-from`.                                                              |
| `--import-secrets`         | رازهای پشتیبانی‌شده را در طول مهاجرت راه‌اندازی اولیه وارد کنید.                                               |
| `--remote-url <url>`       | URL WebSocket مربوط به Gateway راه‌دور.                                                                       |
| `--remote-token <token>`   | توکن Gateway راه‌دور (اختیاری).                                                                    |

### راه‌اندازی خودکار جادوگر

`openclaw setup` وقتی هرکدام از این پرچم‌ها صراحتا وجود داشته باشند، حتی بدون `--wizard`، جادوگر را اجرا می‌کند:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## نمونه‌ها

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## نکته‌ها

- `openclaw setup` ساده، پیکربندی و فضای کاری را بدون اجرای جریان کامل راه‌اندازی اولیه مقداردهی اولیه می‌کند.
- پس از setup ساده، برای مسیر هدایت‌شده کامل `openclaw onboard`، برای تغییرات هدفمند `openclaw configure`، یا برای افزودن حساب‌های کانال `openclaw channels add` را اجرا کنید.
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه تعاملی می‌تواند مهاجرت را به‌صورت خودکار پیشنهاد کند. راه‌اندازی اولیه واردسازی به یک setup تازه نیاز دارد؛ برای طرح‌های اجرای آزمایشی، پشتیبان‌گیری‌ها و حالت بازنویسی خارج از راه‌اندازی اولیه، از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- [شروع به کار](/fa/start/getting-started)
- [نمای کلی نصب](/fa/install)
