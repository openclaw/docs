---
read_when:
    - در حال انجام راه‌اندازی اجرای نخست با جادوگر آغازبه‌کار CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
    - برای اسکریپت‌ها به پرچم راه‌اندازی فقط خط مبنا نیاز دارید
summary: مرجع CLI برای `openclaw setup` (نام مستعار برای راه‌اندازی اولیه، با راه‌اندازی پایه که از طریق پرچم در دسترس است)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-06-30T22:27:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

جریان کامل راه‌اندازی اولیه CLI را اجرا کنید. `openclaw setup` نام مستعار `openclaw onboard` است؛ وقتی فقط باید پوشه‌های پیکربندی/فضای کاری را بدون ویزارد مقداردهی اولیه کنید، از `--baseline` استفاده کنید.

<Note>
`openclaw setup` برای نصب‌های پیکربندی قابل تغییر است. در حالت Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw نوشتن تنظیمات را رد می‌کند، چون فایل پیکربندی توسط Nix مدیریت می‌شود. از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) رسمی یا پیکربندی منبع معادل برای یک بسته Nix دیگر استفاده کنید.
</Note>

## گزینه‌ها

| پرچم                       | توضیح                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | دایرکتوری فضای کاری عامل (پیش‌فرض `~/.openclaw/workspace`؛ با نام `agents.defaults.workspace` ذخیره می‌شود). |
| `--baseline`               | پوشه‌های پایه پیکربندی/فضای کاری/نشست را بدون راه‌اندازی اولیه ایجاد کنید.                                |
| `--wizard`                 | برای سازگاری پذیرفته می‌شود؛ setup به‌طور پیش‌فرض راه‌اندازی اولیه را اجرا می‌کند.                                       |
| `--non-interactive`        | راه‌اندازی اولیه را بدون اعلان اجرا کنید.                                                                     |
| `--accept-risk`            | ریسک دسترسی عامل به کل سیستم را تأیید کنید؛ همراه با `--non-interactive` الزامی است.                       |
| `--mode <mode>`            | حالت راه‌اندازی اولیه: `local` یا `remote`.                                                               |
| `--import-from <provider>` | ارائه‌دهنده مهاجرت برای اجرا هنگام راه‌اندازی اولیه.                                                        |
| `--import-source <path>`   | خانه عامل منبع برای `--import-from`.                                                              |
| `--import-secrets`         | رازهای پشتیبانی‌شده را هنگام مهاجرت راه‌اندازی اولیه وارد کنید.                                               |
| `--remote-url <url>`       | URL WebSocket مربوط به Gateway راه دور.                                                                       |
| `--remote-token <token>`   | توکن Gateway راه دور (اختیاری).                                                                    |

### حالت پایه

`openclaw setup --baseline` رفتار قدیمی‌ترِ فقط پایه را حفظ می‌کند: پیکربندی، فضای کاری و دایرکتوری‌های نشست را ایجاد می‌کند، سپس بدون اجرای راه‌اندازی اولیه خارج می‌شود.

## مثال‌ها

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## نکات

- `openclaw setup` ساده همان مسیر هدایت‌شده `openclaw onboard` را اجرا می‌کند.
- پس از setup پایه، برای مسیر کامل هدایت‌شده `openclaw setup` یا `openclaw onboard` را اجرا کنید، برای تغییرات هدفمند از `openclaw configure` استفاده کنید، یا برای افزودن حساب‌های کانال `openclaw channels add` را اجرا کنید.
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه تعاملی می‌تواند مهاجرت را به‌صورت خودکار پیشنهاد کند. راه‌اندازی اولیه واردسازی به یک setup تازه نیاز دارد؛ برای برنامه‌های اجرای آزمایشی، پشتیبان‌گیری‌ها و حالت بازنویسی خارج از راه‌اندازی اولیه، از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- [شروع به کار](/fa/start/getting-started)
- [نمای کلی نصب](/fa/install)
