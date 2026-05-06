---
read_when:
    - می‌خواهید نصب‌هایی تکرارپذیر و بازگشت‌پذیر داشته باشید
    - شما از قبل از Nix/NixOS/Home Manager استفاده می‌کنید
    - می‌خواهید همه‌چیز قفل‌شده و به‌صورت اعلانی مدیریت شود
summary: OpenClaw را به‌صورت اعلانی با Nix نصب کنید
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

OpenClaw را به‌صورت اعلانی با **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** نصب کنید - یک ماژول Home Manager کامل و آماده.

<Info>
مخزن [nix-openclaw](https://github.com/openclaw/nix-openclaw) منبع حقیقت برای نصب Nix است. این صفحه یک مرور سریع است.
</Info>

## چه چیزی دریافت می‌کنید

- Gateway + برنامه macOS + ابزارها (whisper، spotify، cameras) -- همه پین‌شده
- سرویس launchd که پس از راه‌اندازی مجدد هم باقی می‌ماند
- سیستم Plugin با پیکربندی اعلانی
- بازگشت فوری: `home-manager switch --rollback`

## شروع سریع

<Steps>
  <Step title="نصب Determinate Nix">
    اگر Nix از قبل نصب نشده است، دستورالعمل‌های [نصاب Determinate Nix](https://github.com/DeterminateSystems/nix-installer) را دنبال کنید.
  </Step>
  <Step title="ایجاد یک flake محلی">
    از قالب agent-first در مخزن nix-openclaw استفاده کنید:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="پیکربندی رازها">
    توکن ربات پیام‌رسانی و کلید API ارائه‌دهنده مدل خود را تنظیم کنید. فایل‌های ساده در `~/.secrets/` به‌خوبی کار می‌کنند.
  </Step>
  <Step title="پر کردن جای‌نگهدارهای قالب و تغییر وضعیت">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="راستی‌آزمایی">
    تأیید کنید که سرویس launchd در حال اجرا است و ربات شما به پیام‌ها پاسخ می‌دهد.
  </Step>
</Steps>

برای گزینه‌های کامل ماژول و نمونه‌ها، [README nix-openclaw](https://github.com/openclaw/nix-openclaw) را ببینید.

## رفتار زمان اجرای حالت Nix

وقتی `OPENCLAW_NIX_MODE=1` تنظیم باشد (به‌صورت خودکار با nix-openclaw)، OpenClaw وارد حالتی قطعی می‌شود که جریان‌های نصب خودکار را غیرفعال می‌کند.

همچنین می‌توانید آن را دستی تنظیم کنید:

```bash
export OPENCLAW_NIX_MODE=1
```

در macOS، برنامه GUI به‌طور خودکار متغیرهای محیطی shell را به ارث نمی‌برد. به‌جای آن، حالت Nix را از طریق defaults فعال کنید:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### چه چیزهایی در حالت Nix تغییر می‌کند

- جریان‌های نصب خودکار و خودتغییری غیرفعال می‌شوند
- وابستگی‌های مفقود پیام‌های اصلاحی مخصوص Nix را نمایش می‌دهند
- UI یک بنر فقط‌خواندنی حالت Nix را نمایش می‌دهد

### مسیرهای پیکربندی و وضعیت

OpenClaw پیکربندی JSON5 را از `OPENCLAW_CONFIG_PATH` می‌خواند و داده‌های قابل‌تغییر را در `OPENCLAW_STATE_DIR` ذخیره می‌کند. هنگام اجرا تحت Nix، این موارد را صراحتاً روی مکان‌های مدیریت‌شده توسط Nix تنظیم کنید تا وضعیت زمان اجرا و پیکربندی بیرون از store تغییرناپذیر باقی بمانند.

| متغیر                  | پیش‌فرض                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### کشف PATH سرویس

سرویس launchd/systemd مربوط به gateway باینری‌های Nix-profile را به‌صورت خودکار کشف می‌کند تا
plugins و ابزارهایی که برای اجرا به فایل‌های اجرایی نصب‌شده با `nix` shell می‌زنند، بدون
تنظیم دستی PATH کار کنند:

- وقتی `NIX_PROFILES` تنظیم شده باشد، هر ورودی با تقدم راست‌به‌چپ به PATH سرویس اضافه می‌شود
  (مطابق تقدم Nix shell - راست‌ترین مورد برنده است).
- وقتی `NIX_PROFILES` تنظیم نشده باشد، `~/.nix-profile/bin` به‌عنوان fallback اضافه می‌شود.

این مورد هم برای محیط‌های سرویس launchd در macOS و هم systemd در Linux اعمال می‌شود.

## مرتبط

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    ماژول Home Manager منبع حقیقت و راهنمای کامل راه‌اندازی.
  </Card>
  <Card title="جادوگر راه‌اندازی" href="/fa/start/wizard" icon="wand-magic-sparkles">
    راهنمای مرحله‌به‌مرحله راه‌اندازی CLI غیر Nix.
  </Card>
  <Card title="Docker" href="/fa/install/docker" icon="docker">
    راه‌اندازی کانتینری به‌عنوان جایگزین غیر Nix.
  </Card>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="arrow-up-right-from-square">
    به‌روزرسانی نصب‌های مدیریت‌شده توسط Home Manager در کنار بسته.
  </Card>
</CardGroup>
