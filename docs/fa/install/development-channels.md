---
read_when:
    - می‌خواهید بین stable/beta/dev جابه‌جا شوید
    - می‌خواهید یک نسخه، تگ یا SHA مشخص را ثابت نگه دارید.
    - شما در حال برچسب‌گذاری یا انتشار نسخه‌های پیش‌انتشار هستید
sidebarTitle: Release Channels
summary: 'کانال‌های پایدار، بتا و توسعه: معناشناسی، تغییر، تثبیت و برچسب‌گذاری'
title: کانال‌های انتشار
x-i18n:
    generated_at: "2026-06-27T17:57:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw سه کانال به‌روزرسانی ارائه می‌کند:

- **stable**: dist-tag در npm با نام `latest`. برای بیشتر کاربران توصیه می‌شود.
- **beta**: dist-tag در npm با نام `beta` وقتی جاری باشد؛ اگر beta موجود نباشد یا قدیمی‌تر از
  آخرین انتشار پایدار باشد، جریان به‌روزرسانی به `latest` برمی‌گردد.
- **dev**: سر متحرک `main` (git). dist-tag در npm: `dev` (وقتی منتشر شده باشد).
  شاخه‌ی `main` برای آزمایش و توسعه‌ی فعال است. ممکن است شامل قابلیت‌های
  ناتمام یا تغییرات ناسازگار باشد. از آن برای gatewayهای تولیدی استفاده نکنید.

ما معمولاً بیلدهای پایدار را ابتدا به **beta** منتشر می‌کنیم، آن‌ها را آنجا آزمایش می‌کنیم، سپس یک
گام ارتقای صریح اجرا می‌کنیم که بیلد بررسی‌شده را بدون
تغییر شماره نسخه به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند در صورت نیاز یک انتشار پایدار را
مستقیماً به `latest` منتشر کنند. dist-tagها منبع حقیقت برای نصب‌های npm هستند.

## تغییر کانال‌ها

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` انتخاب شما را در پیکربندی (`update.channel`) پایدار می‌کند و
روش نصب را هم‌راستا می‌سازد:

- **`stable`** (نصب‌های بسته‌ای): از طریق dist-tag در npm با نام `latest` به‌روزرسانی می‌شود.
- **`beta`** (نصب‌های بسته‌ای): dist-tag در npm با نام `beta` را ترجیح می‌دهد، اما وقتی `beta` موجود نباشد یا قدیمی‌تر از برچسب پایدار فعلی باشد، به
  `latest` برمی‌گردد.
- **`stable`** (نصب‌های git): آخرین برچسب پایدار git را checkout می‌کند و
  برچسب‌های پیش‌انتشار semver مانند `-alpha.N`، `-beta.N`، `-rc.N`، `-dev.N`،
  `-next.N`، `-preview.N`، `-canary.N`، `-nightly.N` و پسوندهای دیگر پیش‌انتشار را
  کنار می‌گذارد.
- **`beta`** (نصب‌های git): آخرین برچسب beta در git را ترجیح می‌دهد، اما وقتی beta موجود نباشد یا قدیمی‌تر باشد به
  آخرین برچسب پایدار git برمی‌گردد.
- **`dev`**: یک checkout از git را تضمین می‌کند (پیش‌فرض `~/openclaw`، یا
  `$OPENCLAW_HOME/openclaw` وقتی `OPENCLAW_HOME` تنظیم شده باشد؛ با
  `OPENCLAW_GIT_DIR` بازنویسی کنید)، به `main` تغییر می‌دهد، روی upstream rebase می‌کند، build می‌سازد، و
  CLI سراسری را از همان checkout نصب می‌کند.

<Tip>
اگر stable و dev را به‌صورت موازی می‌خواهید، دو clone نگه دارید و gateway خود را به نسخه‌ی stable اشاره دهید.
</Tip>

## هدف‌گیری یک‌باره‌ی نسخه یا برچسب

از `--tag` برای هدف‌گیری یک dist-tag، نسخه، یا مشخصات بسته‌ی خاص برای یک
به‌روزرسانی منفرد **بدون** تغییر کانال پایدارشده‌ی خود استفاده کنید:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

نکته‌ها:

- `--tag` فقط روی **نصب‌های بسته‌ای (npm)** اعمال می‌شود. نصب‌های git آن را نادیده می‌گیرند.
- برچسب پایدار نمی‌شود. اجرای بعدی `openclaw update` طبق معمول از
  کانال پیکربندی‌شده‌ی شما استفاده می‌کند.
- برای نصب‌های بسته‌ای، OpenClaw مشخصات منبع GitHub/git را پیش از نصب مرحله‌ای npm در یک
  tarball موقت pre-pack می‌کند. وقتی checkout متحرک `main`
  را به‌عنوان نصب پایدار خود می‌خواهید، از `--channel dev` یا
  `--install-method git --version main` استفاده کنید.
- محافظت در برابر downgrade: اگر نسخه‌ی هدف قدیمی‌تر از نسخه‌ی فعلی شما باشد،
  OpenClaw درخواست تأیید می‌کند (با `--yes` رد کنید).
- `--channel beta` با `--tag beta` متفاوت است: جریان کانال می‌تواند وقتی beta موجود نباشد یا قدیمی‌تر باشد به
  stable/latest برگردد، در حالی که `--tag beta` برای همان یک اجرا
  dist-tag خام `beta` را هدف می‌گیرد.

## اجرای آزمایشی

پیش‌نمایش کنید که `openclaw update` بدون اعمال تغییرات چه خواهد کرد:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

اجرای آزمایشی کانال مؤثر، نسخه‌ی هدف، اقدام‌های برنامه‌ریزی‌شده، و
اینکه آیا تأیید downgrade لازم خواهد بود یا نه را نشان می‌دهد.

## Pluginها و کانال‌ها

وقتی با `openclaw update` کانال‌ها را تغییر می‌دهید، OpenClaw منبع‌های plugin را نیز همگام‌سازی می‌کند:

- `dev` Pluginهای همراه‌شده از checkout مربوط به git را ترجیح می‌دهد.
- `stable` و `beta` بسته‌های Plugin نصب‌شده با npm را بازیابی می‌کنند.
- Pluginهای نصب‌شده با npm پس از تکمیل به‌روزرسانی هسته به‌روزرسانی می‌شوند.

## بررسی وضعیت فعلی

```bash
openclaw update status
```

کانال فعال، نوع نصب (git یا بسته)، نسخه‌ی فعلی، و
منبع (پیکربندی، برچسب git، شاخه‌ی git، یا پیش‌فرض) را نشان می‌دهد.

## بهترین شیوه‌های برچسب‌گذاری

- انتشارهایی را برچسب بزنید که می‌خواهید checkoutهای git روی آن‌ها قرار بگیرند (`vYYYY.M.PATCH` برای stable،
  `vYYYY.M.PATCH-beta.N` برای beta؛ پسوندهای پیش‌انتشار نام‌دار semver مانند
  `-alpha.N`، `-rc.N` و `-next.N` هدف‌های پایدار نیستند).
- برچسب‌های پایدار عددی قدیمی مانند `vYYYY.M.PATCH-1` و `v1.0.1-1` همچنان
  برای سازگاری به‌عنوان برچسب‌های پایدار git شناخته می‌شوند.
- `vYYYY.M.PATCH.beta.N` نیز برای سازگاری شناخته می‌شود، اما `-beta.N` را ترجیح دهید.
- برچسب‌ها را تغییرناپذیر نگه دارید: هرگز یک برچسب را جابه‌جا یا دوباره استفاده نکنید.
- dist-tagهای npm منبع حقیقت برای نصب‌های npm باقی می‌مانند:
  - `latest` -> stable
  - `beta` -> بیلد نامزد یا بیلد پایدارِ ابتدا در beta
  - `dev` -> snapshot از main (اختیاری)

## در دسترس بودن برنامه‌ی macOS

بیلدهای beta و dev ممکن است انتشار برنامه‌ی macOS را **شامل نشوند**. اشکالی ندارد:

- برچسب git و dist-tag در npm همچنان می‌توانند منتشر شوند.
- در یادداشت‌های انتشار یا changelog ذکر کنید «برای این beta بیلد macOS وجود ندارد».

## مرتبط

- [به‌روزرسانی](/fa/install/updating)
- [جزئیات داخلی نصب‌کننده](/fa/install/installer)
