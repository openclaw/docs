---
read_when:
    - نصب‌های تکرارپذیر و قابل بازگردانی می‌خواهید
    - شما در حال حاضر از Nix/NixOS/Home Manager استفاده می‌کنید
    - می‌خواهید همه‌چیز به نسخه‌های مشخص تثبیت شود و به‌صورت اعلانی مدیریت گردد
summary: OpenClaw را به‌صورت اعلانی با Nix نصب کنید
title: Nix
x-i18n:
    generated_at: "2026-07-12T10:16:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

OpenClaw را به‌صورت اعلانی با **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**، ماژول رسمی و کامل Home Manager، نصب کنید.

<Info>
مخزن [nix-openclaw](https://github.com/openclaw/nix-openclaw) مرجع اصلی نصب با Nix است. این صفحه یک مرور سریع ارائه می‌دهد.
</Info>

## آنچه دریافت می‌کنید

- Gateway + برنامه macOS + ابزارها (whisper، spotify، دوربین‌ها)، همگی با نسخه‌های تثبیت‌شده
- سرویس launchd که پس از راه‌اندازی مجدد نیز فعال می‌ماند
- سامانه Plugin با پیکربندی اعلانی
- بازگردانی فوری: `home-manager switch --rollback`

## شروع سریع

<Steps>
  <Step title="نصب Determinate Nix">
    اگر Nix از قبل نصب نشده است، دستورالعمل‌های [نصب‌کننده Determinate Nix](https://github.com/DeterminateSystems/nix-installer) را دنبال کنید.
  </Step>
  <Step title="ایجاد یک flake محلی">
    از الگوی عامل‌محور مخزن nix-openclaw استفاده کنید:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="پیکربندی اسرار">
    توکن ربات پیام‌رسان و کلید API ارائه‌دهنده مدل را تنظیم کنید. فایل‌های ساده در `~/.secrets/` کاملاً مناسب‌اند.
  </Step>
  <Step title="تکمیل جای‌نگهدارهای الگو و اعمال پیکربندی">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="تأیید">
    اطمینان حاصل کنید که سرویس launchd در حال اجرا است و ربات شما به پیام‌ها پاسخ می‌دهد.
  </Step>
</Steps>

برای مشاهده همه گزینه‌ها و مثال‌های ماژول، به [README مربوط به nix-openclaw](https://github.com/openclaw/nix-openclaw) مراجعه کنید.

## رفتار زمان اجرا در حالت Nix

وقتی `OPENCLAW_NIX_MODE=1` تنظیم شده باشد (که با nix-openclaw به‌طور خودکار انجام می‌شود)، OpenClaw برای نصب‌های مدیریت‌شده با Nix وارد حالتی قطعی می‌شود. سایر بسته‌های Nix نیز می‌توانند همین حالت را تنظیم کنند؛ nix-openclaw مرجع رسمی است.

همچنین می‌توانید آن را به‌صورت دستی تنظیم کنید:

```bash
export OPENCLAW_NIX_MODE=1
```

در macOS، برنامه رابط گرافیکی متغیرهای محیطی پوسته را به ارث نمی‌برد. در عوض، حالت Nix را از طریق `defaults` فعال کنید:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### تغییرات در حالت Nix

- فرایندهای نصب خودکار و تغییر خودکار غیرفعال می‌شوند.
- با `openclaw.json` به‌عنوان فایلی تغییرناپذیر رفتار می‌شود. مقادیر پیش‌فرض استنتاج‌شده هنگام راه‌اندازی فقط در زمان اجرا باقی می‌مانند و ابزارهای نگارش پیکربندی (راه‌اندازی، فرایند آغازین، `openclaw update` تغییردهنده، نصب/به‌روزرسانی/حذف/فعال‌سازی Plugin، `doctor --fix`، `doctor --generate-gateway-token`، `openclaw config set`) از ویرایش فایل خودداری می‌کنند.
- به‌جای آن، منبع Nix را ویرایش کنید. برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید و پیکربندی را در `programs.openclaw.config` یا `instances.<name>.config` تنظیم کنید.
- وابستگی‌های مفقود، پیام‌های رفع مشکل ویژه Nix را نمایش می‌دهند.
- رابط کاربری یک نوار حالت فقط‌خواندنی Nix نشان می‌دهد.

### مسیرهای پیکربندی و وضعیت

OpenClaw پیکربندی JSON5 را از `OPENCLAW_CONFIG_PATH` می‌خواند و داده‌های تغییرپذیر را در `OPENCLAW_STATE_DIR` ذخیره می‌کند. در Nix، این مسیرها را صراحتاً روی مکان‌های مدیریت‌شده با Nix تنظیم کنید تا وضعیت زمان اجرا و پیکربندی خارج از مخزن تغییرناپذیر باقی بمانند.

| متغیر                   | پیش‌فرض                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### کشف PATH سرویس

سرویس Gateway مربوط به launchd/systemd، فایل‌های اجرایی نمایه Nix را به‌طور خودکار کشف می‌کند تا Pluginها و ابزارهایی که فایل‌های اجرایی نصب‌شده با `nix` را از طریق پوسته اجرا می‌کنند، بدون تنظیم دستی PATH کار کنند:

- وقتی `NIX_PROFILES` تنظیم شده باشد، هر ورودی با اولویت از راست به چپ به PATH سرویس افزوده می‌شود (مطابق اولویت پوسته Nix: راست‌ترین مورد برنده است).
- وقتی `NIX_PROFILES` تنظیم نشده باشد، `~/.nix-profile/bin` به‌عنوان مسیر جایگزین افزوده می‌شود.

این رفتار هم برای محیط‌های سرویس launchd در macOS و هم systemd در Linux اعمال می‌شود.

## مرتبط

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    ماژول مرجع Home Manager و راهنمای کامل راه‌اندازی.
  </Card>
  <Card title="دستیار راه‌اندازی" href="/fa/start/wizard" icon="wand-magic-sparkles">
    راهنمای گام‌به‌گام راه‌اندازی CLI بدون Nix.
  </Card>
  <Card title="Docker" href="/fa/install/docker" icon="docker">
    راه‌اندازی کانتینری به‌عنوان جایگزینی بدون Nix.
  </Card>
  <Card title="به‌روزرسانی" href="/fa/install/updating" icon="arrow-up-right-from-square">
    به‌روزرسانی نصب‌های مدیریت‌شده با Home Manager در کنار بسته.
  </Card>
</CardGroup>
