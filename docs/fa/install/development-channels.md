---
read_when:
    - می‌خواهید بین پایدار/بتا/توسعه جابه‌جا شوید
    - می‌خواهید نسخه، تگ یا SHA مشخصی را ثابت کنید
    - در حال برچسب‌گذاری یا انتشار پیش‌انتشارها هستید
sidebarTitle: Release Channels
summary: 'کانال‌های پایدار، بتا و توسعه: معناشناسی، جابه‌جایی، پین‌کردن و برچسب‌گذاری'
title: کانال‌های انتشار
x-i18n:
    generated_at: "2026-05-07T13:24:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw سه کانال به‌روزرسانی ارائه می‌کند:

- **stable**: npm dist-tag `latest`. برای بیشتر کاربران توصیه می‌شود.
- **beta**: npm dist-tag `beta` وقتی به‌روز باشد؛ اگر beta وجود نداشته باشد یا از
  آخرین انتشار stable قدیمی‌تر باشد، جریان به‌روزرسانی به `latest` برمی‌گردد.
- **dev**: سرِ در حال حرکت `main` (git). npm dist-tag: `dev` (وقتی منتشر شده باشد).
  شاخه `main` برای آزمایش و توسعه فعال است. ممکن است شامل
  قابلیت‌های ناتمام یا تغییرات ناسازگار باشد. از آن برای Gatewayهای تولیدی استفاده نکنید.

ما معمولا ساخت‌های stable را ابتدا به **beta** منتشر می‌کنیم، آن‌ها را آنجا آزمایش می‌کنیم، سپس یک
گام ارتقای صریح اجرا می‌کنیم که ساخت بررسی‌شده را بدون
تغییر شماره نسخه به `latest` منتقل می‌کند. نگهدارندگان همچنین می‌توانند در صورت نیاز یک انتشار stable را
مستقیما به `latest` منتشر کنند. Dist-tagها منبع حقیقت برای نصب‌های npm هستند.

## تغییر کانال‌ها

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` انتخاب شما را در پیکربندی (`update.channel`) ذخیره می‌کند و
روش نصب را هم‌راستا می‌کند:

- **`stable`** (نصب‌های بسته): از طریق npm dist-tag `latest` به‌روزرسانی می‌شود.
- **`beta`** (نصب‌های بسته): npm dist-tag `beta` را ترجیح می‌دهد، اما وقتی `beta` وجود ندارد یا از برچسب stable فعلی قدیمی‌تر است،
  به `latest` برمی‌گردد.
- **`stable`** (نصب‌های git): آخرین برچسب git مربوط به stable را checkout می‌کند.
- **`beta`** (نصب‌های git): آخرین برچسب git مربوط به beta را ترجیح می‌دهد، اما وقتی beta وجود ندارد یا قدیمی‌تر است،
  به آخرین برچسب git مربوط به stable برمی‌گردد.
- **`dev`**: یک checkout از git را تضمین می‌کند (پیش‌فرض `~/openclaw`، قابل بازنویسی با
  `OPENCLAW_GIT_DIR`)، به `main` تغییر می‌دهد، روی upstream rebase می‌کند، می‌سازد، و
  CLI سراسری را از همان checkout نصب می‌کند.

<Tip>
اگر stable و dev را به‌صورت موازی می‌خواهید، دو clone نگه دارید و Gateway خود را به نسخه stable اشاره دهید.
</Tip>

## هدف‌گذاری نسخه یا برچسب یک‌باره

از `--tag` برای هدف‌گذاری یک dist-tag، نسخه، یا مشخصات بسته خاص در یک
به‌روزرسانی **بدون** تغییر کانال ذخیره‌شده خود استفاده کنید:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

نکته‌ها:

- `--tag` فقط برای **نصب‌های بسته (npm)** اعمال می‌شود. نصب‌های Git آن را نادیده می‌گیرند.
- برچسب ذخیره نمی‌شود. اجرای بعدی `openclaw update` طبق معمول از کانال پیکربندی‌شده شما استفاده می‌کند.
- محافظت در برابر downgrade: اگر نسخه هدف از نسخه فعلی شما قدیمی‌تر باشد،
  OpenClaw برای تایید از شما می‌پرسد (با `--yes` رد کنید).
- `--channel beta` با `--tag beta` متفاوت است: جریان کانال می‌تواند وقتی beta وجود ندارد یا قدیمی‌تر است
  به stable/latest برگردد، در حالی که `--tag beta` برای همان یک اجرا
  dist-tag خام `beta` را هدف می‌گیرد.

## Dry run

پیش‌نمایش کنید که `openclaw update` بدون اعمال تغییرات چه کاری انجام می‌دهد:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run کانال موثر، نسخه هدف، اقدام‌های برنامه‌ریزی‌شده، و
اینکه آیا تایید downgrade لازم است یا نه را نشان می‌دهد.

## Pluginها و کانال‌ها

وقتی با `openclaw update` کانال را تغییر می‌دهید، OpenClaw منبع‌های Plugin را هم همگام‌سازی می‌کند:

- `dev`، Pluginهای همراه از checkout git را ترجیح می‌دهد.
- `stable` و `beta` بسته‌های Plugin نصب‌شده با npm را بازیابی می‌کنند.
- Pluginهای نصب‌شده با npm پس از تکمیل به‌روزرسانی core به‌روزرسانی می‌شوند.

## بررسی وضعیت فعلی

```bash
openclaw update status
```

کانال فعال، نوع نصب (git یا بسته)، نسخه فعلی، و
منبع (پیکربندی، برچسب git، شاخه git، یا پیش‌فرض) را نشان می‌دهد.

## بهترین روش‌های برچسب‌گذاری

- انتشارهایی را که می‌خواهید checkoutهای git روی آن‌ها قرار بگیرند برچسب بزنید (`vYYYY.M.D` برای stable،
  `vYYYY.M.D-beta.N` برای beta).
- `vYYYY.M.D.beta.N` نیز برای سازگاری تشخیص داده می‌شود، اما `-beta.N` را ترجیح دهید.
- برچسب‌های قدیمی `vYYYY.M.D-<patch>` همچنان به‌عنوان stable (غیر beta) تشخیص داده می‌شوند.
- برچسب‌ها را تغییرناپذیر نگه دارید: هرگز برچسبی را جابه‌جا یا دوباره استفاده نکنید.
- npm dist-tagها همچنان منبع حقیقت برای نصب‌های npm هستند:
  - `latest` -> stable
  - `beta` -> ساخت کاندید یا ساخت stable با انتشار اولیه در beta
  - `dev` -> snapshot شاخه main (اختیاری)

## در دسترس بودن برنامه macOS

ساخت‌های beta و dev ممکن است شامل انتشار برنامه macOS **نباشند**. این مشکلی ندارد:

- برچسب git و npm dist-tag همچنان می‌توانند منتشر شوند.
- در یادداشت‌های انتشار یا changelog ذکر کنید «برای این beta ساخت macOS وجود ندارد».

## مرتبط

- [به‌روزرسانی](/fa/install/updating)
- [جزئیات داخلی نصب‌کننده](/fa/install/installer)
