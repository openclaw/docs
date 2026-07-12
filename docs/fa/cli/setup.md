---
read_when:
    - در حال انجام راه‌اندازی اولیه با راهنمای گام‌به‌گام آغاز به کار CLI هستید
    - می‌خواهید مسیر پیش‌فرض فضای کاری را تنظیم کنید
    - برای اسکریپت‌ها به پرچم راه‌اندازی مختص خط مبنا نیاز دارید
summary: مرجع CLI برای `openclaw setup` (نام مستعار فرایند راه‌اندازی اولیه، با امکان انجام تنظیمات پایه از طریق پرچم)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-07-12T09:46:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` همان فرایند هدایت‌شدهٔ راه‌اندازی اولیهٔ `openclaw onboard` را اجرا می‌کند:
ابتدا استنتاج را اعتبارسنجی و ذخیره می‌کند، سپس Crestodian را برای پیکربندی
فضای کاری، Gateway، کانال‌ها، Skills و سلامت سامانه راه‌اندازی می‌کند. زمانی از `--baseline` استفاده کنید که
فقط می‌خواهید پوشه‌های پیکربندی/فضای کاری را بدون ویزارد مقداردهی اولیه کنید.

در حالت هدایت‌شده، `--workspace <dir>` فضای کاری پیشنهادی به Crestodian است؛
این مقدار فقط پس از تأیید پیشنهاد شما ذخیره می‌شود. راه‌اندازی پایه، کلاسیک و
غیرتعاملی، فضای کاری ارائه‌شده را از طریق فرایند عادی خود ذخیره می‌کنند.

`setup` همان پرچم‌های راه‌اندازی اولیهٔ `openclaw onboard` را می‌پذیرد، از جمله
احراز هویت (`--auth-choice`، `--token`، پرچم‌های کلید ارائه‌دهنده)، Gateway
(`--gateway-port`، `--gateway-bind`، `--gateway-auth`، `--install-daemon`)،
Tailscale (`--tailscale`)، بازنشانی (`--reset`، `--reset-scope`)، جریان
(`--flow quickstart|advanced|manual|import`) و پرچم‌های رد کردن
(`--skip-channels`، `--skip-skills`، `--skip-bootstrap`، `--skip-search`،
`--skip-health`، `--skip-ui`، `--skip-hooks`). برای مرجع کامل پرچم‌ها و
نمونه‌های غیرتعاملی، به [راه‌اندازی اولیه](/fa/cli/onboard) و
[خودکارسازی CLI](/fa/start/wizard-cli-automation) مراجعه کنید. `openclaw onboard --modern` نام مستعار
سازگاری برای دستیار Crestodian با الزام استنتاج است و معادلی در `setup` ندارد.

<Note>
`openclaw setup` برای نصب‌هایی با پیکربندی قابل‌تغییر است. در حالت Nix (`OPENCLAW_NIX_MODE=1`)، OpenClaw نوشتن توسط setup را نمی‌پذیرد، زیرا فایل پیکربندی توسط Nix مدیریت می‌شود. از [شروع سریع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) رسمی یا پیکربندی منبع معادل برای بستهٔ Nix دیگری استفاده کنید.
</Note>

## گزینه‌ها

| پرچم                       | توضیحات                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | پیشنهاد فضای کاری در حالت هدایت‌شده؛ در راه‌اندازی پایه، کلاسیک و غیرتعاملی مستقیماً ذخیره می‌شود. |
| `--baseline`               | پوشه‌های پایهٔ پیکربندی/فضای کاری/نشست را بدون راه‌اندازی اولیه ایجاد می‌کند.                                  |
| `--wizard`                 | برای سازگاری پذیرفته می‌شود؛ setup به‌طور پیش‌فرض راه‌اندازی اولیه را اجرا می‌کند.                                         |
| `--non-interactive`        | راه‌اندازی اولیه را بدون درخواست ورودی اجرا می‌کند.                                                                       |
| `--accept-risk`            | پذیرش خطر دسترسی عامل به کل سامانه؛ همراه `--non-interactive` الزامی است.                         |
| `--mode <mode>`            | حالت راه‌اندازی اولیه: `local` یا `remote`.                                                                 |
| `--flow <flow>`            | جریان راه‌اندازی اولیه: `quickstart`، `advanced`، `manual` یا `import`.                                        |
| `--reset`                  | پیکربندی + اعتبارنامه‌ها + نشست‌ها را پیش از راه‌اندازی اولیه بازنشانی می‌کند (فضای کاری فقط با `--reset-scope full`).   |
| `--reset-scope <scope>`    | دامنهٔ بازنشانی: `config`، `config+creds+sessions` یا `full`.                                            |
| `--import-from <provider>` | ارائه‌دهندهٔ مهاجرتی که هنگام راه‌اندازی اولیه اجرا می‌شود.                                                          |
| `--import-source <path>`   | خانهٔ عامل مبدأ برای `--import-from`.                                                                |
| `--import-secrets`         | اسرار پشتیبانی‌شده را هنگام مهاجرت راه‌اندازی اولیه وارد می‌کند.                                                 |
| `--remote-url <url>`       | نشانی WebSocket مربوط به Gateway راه‌دور.                                                                         |
| `--remote-token <token>`   | توکن Gateway راه‌دور (اختیاری).                                                                      |
| `--json`                   | یک خلاصهٔ JSON خروجی می‌دهد.                                                                                |

`--classic` و `--non-interactive` با یکدیگر ناسازگارند: حالت کلاسیک
ویزارد دارای درخواست ورودی را باز می‌کند، درحالی‌که راه‌اندازی غیرتعاملی از مسیر خودکارسازی استفاده می‌کند.

### حالت پایه

`openclaw setup --baseline` رفتار قدیمیِ محدود به حالت پایه را حفظ می‌کند:
دایرکتوری‌های پیکربندی، فضای کاری و نشست را ایجاد می‌کند و سپس بدون
اجرای راه‌اندازی اولیه خارج می‌شود.

## نمونه‌ها

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## نکات

- پس از راه‌اندازی پایه، برای طی‌کردن کامل فرایند هدایت‌شده `openclaw setup` یا `openclaw onboard`، برای تغییرات هدفمند `openclaw configure`، یا برای افزودن حساب‌های کانال `openclaw channels add` را اجرا کنید.
- اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیهٔ تعاملی می‌تواند مهاجرت را به‌طور خودکار پیشنهاد دهد. راه‌اندازی اولیه از طریق واردکردن به یک راه‌اندازی تازه نیاز دارد؛ برای طرح‌های اجرای آزمایشی، پشتیبان‌گیری و حالت بازنویسی خارج از راه‌اندازی اولیه، از [مهاجرت](/fa/cli/migrate) استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [راه‌اندازی اولیه](/fa/cli/onboard)
- [راه‌اندازی اولیه (CLI)](/fa/start/wizard)
- [شروع کار](/fa/start/getting-started)
- [نمای کلی نصب](/fa/install)
