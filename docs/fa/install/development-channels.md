---
read_when:
    - می‌خواهید بین پایدار/بتا/توسعه جابه‌جا شوید
    - می‌خواهید یک نسخه، تگ یا SHA مشخص را ثابت کنید
    - شما در حال برچسب‌گذاری یا انتشار پیش‌انتشارها هستید
sidebarTitle: Release Channels
summary: 'کانال‌های پایدار، بتا و توسعه: معناشناسی، جابه‌جایی، ثابت‌کردن و برچسب‌گذاری'
title: کانال‌های انتشار
x-i18n:
    generated_at: "2026-05-06T09:25:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw سه کانال به‌روزرسانی ارائه می‌کند:

- **stable**: npm dist-tag `latest`. برای بیشتر کاربران توصیه می‌شود.
- **beta**: npm dist-tag `beta` وقتی به‌روز باشد؛ اگر beta موجود نباشد یا از
  آخرین انتشار پایدار قدیمی‌تر باشد، جریان به‌روزرسانی به `latest` برمی‌گردد.
- **dev**: سر متحرک `main` (git). npm dist-tag: `dev` (وقتی منتشر شده باشد).
  شاخه `main` برای آزمایش و توسعه فعال است. ممکن است شامل قابلیت‌های
  ناقص یا تغییرات ناسازگار باشد. از آن برای Gatewayهای تولیدی استفاده نکنید.

ما معمولا ساخت‌های پایدار را ابتدا به **beta** منتشر می‌کنیم، آن‌ها را آنجا آزمایش می‌کنیم، سپس یک
مرحله ارتقای صریح اجرا می‌کنیم که ساخت بررسی‌شده را بدون
تغییر شماره نسخه به `latest` منتقل می‌کند. نگه‌دارندگان همچنین می‌توانند در صورت نیاز یک انتشار پایدار را
مستقیما به `latest` منتشر کنند. Dist-tagها منبع حقیقت برای نصب‌های npm هستند.

## تغییر کانال‌ها

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` انتخاب شما را در پیکربندی (`update.channel`) ماندگار می‌کند و
روش نصب را هم‌راستا می‌کند:

- **`stable`** (نصب‌های بسته): از طریق npm dist-tag `latest` به‌روزرسانی می‌شود.
- **`beta`** (نصب‌های بسته): npm dist-tag `beta` را ترجیح می‌دهد، اما وقتی `beta` موجود نباشد یا از برچسب پایدار فعلی قدیمی‌تر باشد، به
  `latest` برمی‌گردد.
- **`stable`** (نصب‌های git): آخرین برچسب پایدار git را checkout می‌کند.
- **`beta`** (نصب‌های git): آخرین برچسب beta در git را ترجیح می‌دهد، اما وقتی beta موجود نباشد یا قدیمی‌تر باشد، به
  آخرین برچسب پایدار git برمی‌گردد.
- **`dev`**: یک checkout از git را تضمین می‌کند (پیش‌فرض `~/openclaw`، قابل بازنویسی با
  `OPENCLAW_GIT_DIR`)، به `main` سوییچ می‌کند، روی upstream rebase می‌کند، build می‌گیرد و
  CLI سراسری را از همان checkout نصب می‌کند.

<Tip>
اگر می‌خواهید stable و dev را به‌صورت موازی داشته باشید، دو clone نگه دارید و Gateway خود را به نسخه stable اشاره دهید.
</Tip>

## هدف‌گیری نسخه یا برچسب یک‌باره

از `--tag` برای هدف‌گیری یک dist-tag، نسخه، یا مشخصات بسته خاص برای یک
به‌روزرسانی تکی **بدون** تغییر کانال ماندگارشده خود استفاده کنید:

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

- `--tag` فقط برای **نصب‌های بسته (npm)** اعمال می‌شود. نصب‌های git آن را نادیده می‌گیرند.
- برچسب ماندگار نمی‌شود. اجرای بعدی `openclaw update` طبق معمول از کانال پیکربندی‌شده شما استفاده می‌کند.
- محافظت در برابر downgrade: اگر نسخه هدف از نسخه فعلی شما قدیمی‌تر باشد،
  OpenClaw درخواست تایید می‌کند (با `--yes` رد کنید).
- `--channel beta` با `--tag beta` متفاوت است: جریان کانال وقتی beta موجود نباشد یا قدیمی‌تر باشد می‌تواند به
  stable/latest برگردد، در حالی که `--tag beta` در همان اجرای تکی، dist-tag خام `beta` را هدف می‌گیرد.

## اجرای آزمایشی

پیش‌نمایش بگیرید که `openclaw update` بدون اعمال تغییرات چه کاری انجام می‌دهد:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

اجرای آزمایشی کانال موثر، نسخه هدف، اقدامات برنامه‌ریزی‌شده، و
اینکه آیا تایید downgrade لازم خواهد بود یا نه را نشان می‌دهد.

## Pluginها و کانال‌ها

وقتی با `openclaw update` کانال‌ها را تغییر می‌دهید، OpenClaw همچنین منبع‌های Plugin را همگام‌سازی می‌کند:

- `dev`، Pluginهای همراه از checkout گیت را ترجیح می‌دهد.
- `stable` و `beta` بسته‌های Plugin نصب‌شده با npm را بازمی‌گردانند.
- Pluginهای نصب‌شده با npm پس از تکمیل به‌روزرسانی هسته به‌روزرسانی می‌شوند.

## بررسی وضعیت فعلی

```bash
openclaw update status
```

کانال فعال، نوع نصب (git یا بسته)، نسخه فعلی، و
منبع (پیکربندی، برچسب git، شاخه git، یا پیش‌فرض) را نشان می‌دهد.

## بهترین رویه‌های برچسب‌گذاری

- انتشارهایی را که می‌خواهید checkoutهای git روی آن‌ها قرار بگیرند برچسب‌گذاری کنید (`vYYYY.M.D` برای stable،
  `vYYYY.M.D-beta.N` برای beta).
- `vYYYY.M.D.beta.N` نیز برای سازگاری شناسایی می‌شود، اما `-beta.N` را ترجیح دهید.
- برچسب‌های قدیمی `vYYYY.M.D-<patch>` همچنان به‌عنوان stable (غیر beta) شناسایی می‌شوند.
- برچسب‌ها را تغییرناپذیر نگه دارید: هرگز یک برچسب را جابه‌جا یا دوباره استفاده نکنید.
- npm dist-tagها منبع حقیقت برای نصب‌های npm باقی می‌مانند:
  - `latest` -> stable
  - `beta` -> ساخت نامزد یا ساخت پایدارِ ابتدا در beta
  - `dev` -> snapshot شاخه main (اختیاری)

## دسترس‌پذیری برنامه macOS

ساخت‌های beta و dev ممکن است انتشار برنامه macOS را شامل **نشوند**. این ایرادی ندارد:

- برچسب git و npm dist-tag همچنان می‌توانند منتشر شوند.
- در یادداشت‌های انتشار یا changelog ذکر کنید «برای این beta ساخت macOS وجود ندارد».

## مرتبط

- [به‌روزرسانی](/fa/install/updating)
- [جزئیات داخلی نصب‌کننده](/fa/install/installer)
