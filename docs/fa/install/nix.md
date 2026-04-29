---
read_when:
    - شما نصب‌های قابل بازتولید و قابل بازگردانی می‌خواهید
    - شما از قبل از Nix/NixOS/Home Manager استفاده می‌کنید
    - می‌خواهید همه‌چیز تثبیت‌شده و به‌صورت اعلانی مدیریت شود
summary: OpenClaw را به‌صورت اعلانی با Nix نصب کنید
title: Nix
x-i18n:
    generated_at: "2026-04-29T23:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 16
---

OpenClaw را به‌صورت اعلانی با **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** نصب کنید — یک ماژول Home Manager کامل و آماده.

<Info>
مخزن [nix-openclaw](https://github.com/openclaw/nix-openclaw) منبع حقیقت برای نصب Nix است. این صفحه یک نمای کلی سریع است.
</Info>

## چه چیزی دریافت می‌کنید

- Gateway + برنامهٔ macOS + ابزارها (whisper، spotify، دوربین‌ها) -- همه پین شده‌اند
- سرویس launchd که پس از راه‌اندازی مجدد هم باقی می‌ماند
- سیستم Plugin با پیکربندی اعلانی
- بازگشت فوری: `home-manager switch --rollback`

## شروع سریع

<Steps>
  <Step title="Install Determinate Nix">
    اگر Nix از قبل نصب نیست، دستورالعمل‌های [نصاب Determinate Nix](https://github.com/DeterminateSystems/nix-installer) را دنبال کنید.
  </Step>
  <Step title="Create a local flake">
    از قالب agent-first در مخزن nix-openclaw استفاده کنید:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    توکن بات پیام‌رسانی و کلید API ارائه‌دهندهٔ مدل خود را تنظیم کنید. فایل‌های ساده در `~/.secrets/` به‌خوبی کار می‌کنند.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    تأیید کنید سرویس launchd در حال اجراست و بات شما به پیام‌ها پاسخ می‌دهد.
  </Step>
</Steps>

برای گزینه‌ها و نمونه‌های کامل ماژول، [README nix-openclaw](https://github.com/openclaw/nix-openclaw) را ببینید.

## رفتار زمان اجرای حالت Nix

وقتی `OPENCLAW_NIX_MODE=1` تنظیم شده باشد (با nix-openclaw به‌صورت خودکار)، OpenClaw وارد حالتی قطعی می‌شود که جریان‌های نصب خودکار را غیرفعال می‌کند.

همچنین می‌توانید آن را دستی تنظیم کنید:

```bash
export OPENCLAW_NIX_MODE=1
```

در macOS، برنامهٔ GUI به‌صورت خودکار متغیرهای محیطی shell را به ارث نمی‌برد. به‌جای آن، حالت Nix را از طریق defaults فعال کنید:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### چه چیزهایی در حالت Nix تغییر می‌کند

- جریان‌های نصب خودکار و خودتغییری غیرفعال می‌شوند
- وابستگی‌های مفقود، پیام‌های اصلاحی ویژهٔ Nix نمایش می‌دهند
- UI یک بنر حالت Nix فقط‌خواندنی نمایش می‌دهد

### مسیرهای پیکربندی و وضعیت

OpenClaw پیکربندی JSON5 را از `OPENCLAW_CONFIG_PATH` می‌خواند و داده‌های قابل‌تغییر را در `OPENCLAW_STATE_DIR` ذخیره می‌کند. هنگام اجرا زیر Nix، این‌ها را صراحتاً روی مکان‌های مدیریت‌شده توسط Nix تنظیم کنید تا وضعیت زمان اجرا و پیکربندی بیرون از ذخیره‌گاه تغییرناپذیر بمانند.

| متغیر                  | پیش‌فرض                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### کشف PATH سرویس

سرویس Gateway در launchd/systemd باینری‌های پروفایل Nix را به‌صورت خودکار کشف می‌کند تا
Pluginها و ابزارهایی که برای اجرایی‌های نصب‌شده با `nix` به shell متکی هستند، بدون
تنظیم دستی PATH کار کنند:

- وقتی `NIX_PROFILES` تنظیم شده باشد، هر ورودی با اولویت راست‌به‌چپ به PATH سرویس اضافه می‌شود
  (مطابق با اولویت shell در Nix — راست‌ترین مورد برنده است).
- وقتی `NIX_PROFILES` تنظیم نشده باشد، `~/.nix-profile/bin` به‌عنوان پشتیبان اضافه می‌شود.

این مورد هم برای محیط‌های سرویس launchd در macOS و هم systemd در Linux اعمال می‌شود.

## مرتبط

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- راهنمای کامل راه‌اندازی
- [Wizard](/fa/start/wizard) -- راه‌اندازی CLI غیر Nix
- [Docker](/fa/install/docker) -- راه‌اندازی کانتینری
