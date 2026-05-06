---
read_when:
    - شما نصب‌هایی قابل بازتولید و قابل بازگردانی می‌خواهید
    - شما از قبل از Nix/NixOS/Home Manager استفاده می‌کنید
    - می‌خواهید همه‌چیز ثابت و به‌صورت اعلانی مدیریت شود
summary: OpenClaw را به‌صورت اعلانی با Nix نصب کنید
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
---

OpenClaw را به‌صورت اعلانی با **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** نصب کنید - ماژول Home Manager رسمی، کامل و آماده‌به‌کار.

<Info>
مخزن [nix-openclaw](https://github.com/openclaw/nix-openclaw) منبع حقیقت برای نصب Nix است. این صفحه یک نمای کلی سریع است.
</Info>

## چه چیزهایی دریافت می‌کنید

- Gateway + برنامه macOS + ابزارها (whisper، spotify، cameras) -- همگی پین‌شده
- سرویس launchd که پس از راه‌اندازی مجدد هم پایدار می‌ماند
- سیستم Plugin با پیکربندی اعلانی
- بازگشت فوری: `home-manager switch --rollback`

## شروع سریع

<Steps>
  <Step title="نصب Determinate Nix">
    اگر Nix از قبل نصب نیست، دستورالعمل‌های [نصاب Determinate Nix](https://github.com/DeterminateSystems/nix-installer) را دنبال کنید.
  </Step>
  <Step title="ایجاد یک flake محلی">
    از قالب agent-first در مخزن nix-openclaw استفاده کنید:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="پیکربندی secrets">
    توکن ربات پیام‌رسان و کلید API ارائه‌دهنده مدل خود را تنظیم کنید. فایل‌های ساده در `~/.secrets/` کاملا مناسب هستند.
  </Step>
  <Step title="پر کردن placeholderهای قالب و switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="تأیید">
    تأیید کنید که سرویس launchd در حال اجراست و ربات شما به پیام‌ها پاسخ می‌دهد.
  </Step>
</Steps>

برای گزینه‌های کامل ماژول و مثال‌ها، [README مربوط به nix-openclaw](https://github.com/openclaw/nix-openclaw) را ببینید.

## رفتار زمان اجرا در حالت Nix

وقتی `OPENCLAW_NIX_MODE=1` تنظیم شده باشد (با nix-openclaw به‌صورت خودکار)، OpenClaw برای نصب‌های مدیریت‌شده با Nix وارد حالتی قطعی می‌شود. بسته‌های Nix دیگر هم می‌توانند همین حالت را تنظیم کنند؛ nix-openclaw مرجع رسمی است.

همچنین می‌توانید آن را دستی تنظیم کنید:

```bash
export OPENCLAW_NIX_MODE=1
```

در macOS، برنامه GUI به‌طور خودکار متغیرهای محیطی shell را به ارث نمی‌برد. در عوض، حالت Nix را از طریق defaults فعال کنید:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### چه چیزهایی در حالت Nix تغییر می‌کند

- جریان‌های نصب خودکار و خود-تغییری غیرفعال می‌شوند
- `openclaw.json` تغییرناپذیر در نظر گرفته می‌شود. پیش‌فرض‌های مشتق‌شده هنگام راه‌اندازی فقط در زمان اجرا باقی می‌مانند، و نویسنده‌های پیکربندی مانند setup، onboarding، دستور تغییر‌دهنده `openclaw update`، نصب/به‌روزرسانی/حذف/فعال‌سازی Plugin، `doctor --fix`، `doctor --generate-gateway-token` و `openclaw config set` از ویرایش فایل خودداری می‌کنند.
- Agentها باید به‌جای آن منبع Nix را ویرایش کنند. برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) نوع agent-first استفاده کنید و پیکربندی را زیر `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
- وابستگی‌های مفقود پیام‌های رفع مشکل ویژه Nix نمایش می‌دهند
- UI یک بنر فقط‌خواندنی حالت Nix نمایش می‌دهد

### مسیرهای پیکربندی و وضعیت

OpenClaw پیکربندی JSON5 را از `OPENCLAW_CONFIG_PATH` می‌خواند و داده‌های قابل تغییر را در `OPENCLAW_STATE_DIR` ذخیره می‌کند. هنگام اجرا زیر Nix، این‌ها را صریحا روی مکان‌های مدیریت‌شده با Nix تنظیم کنید تا وضعیت زمان اجرا و پیکربندی بیرون از store تغییرناپذیر بمانند.

| متغیر                  | پیش‌فرض                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### کشف PATH سرویس

سرویس gateway مربوط به launchd/systemd به‌صورت خودکار باینری‌های Nix-profile را کشف می‌کند تا
Pluginها و ابزارهایی که برای اجرای فایل‌های اجرایی نصب‌شده با `nix` به shell متکی هستند، بدون
تنظیم دستی PATH کار کنند:

- وقتی `NIX_PROFILES` تنظیم شده باشد، هر ورودی با اولویت راست‌به‌چپ به PATH سرویس اضافه می‌شود
  (با اولویت shell در Nix منطبق است - راست‌ترین مورد برنده است).
- وقتی `NIX_PROFILES` تنظیم نشده باشد، `~/.nix-profile/bin` به‌عنوان جایگزین اضافه می‌شود.

این مورد هم برای محیط‌های سرویس launchd در macOS و هم systemd در Linux اعمال می‌شود.

## مرتبط

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    ماژول Home Manager منبع حقیقت و راهنمای کامل راه‌اندازی.
  </Card>
  <Card title="جادوگر راه‌اندازی" href="/fa/start/wizard" icon="wand-magic-sparkles">
    راهنمای گام‌به‌گام راه‌اندازی CLI غیر Nix.
  </Card>
  <Card title="Docker" href="/fa/install/docker" icon="docker">
    راه‌اندازی کانتینری به‌عنوان جایگزین غیر Nix.
  </Card>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="arrow-up-right-from-square">
    به‌روزرسانی نصب‌های مدیریت‌شده با Home Manager همراه با بسته.
  </Card>
</CardGroup>
