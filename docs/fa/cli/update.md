---
read_when:
    - می‌خواهید نسخهٔ کاریِ منبع را به‌صورت ایمن به‌روزرسانی کنید
    - باید رفتار خلاصه‌نویسی `--update` را درک کنید
summary: مرجع CLI برای `openclaw update` (به‌روزرسانی نسبتاً ایمن منبع + راه‌اندازی مجدد خودکار Gateway)
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-04-29T22:40:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw را به‌صورت ایمن به‌روزرسانی کنید و بین کانال‌های پایدار/بتا/dev جابه‌جا شوید.

اگر از طریق **npm/pnpm/bun** نصب کرده‌اید (نصب سراسری، بدون فرادادهٔ git)،
به‌روزرسانی‌ها از طریق جریان package-manager در [به‌روزرسانی](/fa/install/updating) انجام می‌شوند.

## کاربرد

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## گزینه‌ها

- `--no-restart`: پس از به‌روزرسانی موفق، راه‌اندازی دوبارهٔ سرویس Gateway را رد می‌کند. به‌روزرسانی‌های package-manager که Gateway را دوباره راه‌اندازی می‌کنند، پیش از موفق شدن فرمان بررسی می‌کنند که سرویسِ دوباره راه‌اندازی‌شده نسخهٔ به‌روزرسانی‌شدهٔ مورد انتظار را گزارش دهد.
- `--channel <stable|beta|dev>`: کانال به‌روزرسانی را تنظیم می‌کند (git + npm؛ در پیکربندی پایدار می‌شود).
- `--tag <dist-tag|version|spec>`: هدف بسته را فقط برای همین به‌روزرسانی بازنویسی می‌کند. برای نصب‌های بسته‌ای، `main` به `github:openclaw/openclaw#main` نگاشت می‌شود.
- `--dry-run`: اقدامات برنامه‌ریزی‌شدهٔ به‌روزرسانی (کانال/تگ/هدف/جریان راه‌اندازی دوباره) را بدون نوشتن پیکربندی، نصب، همگام‌سازی plugins یا راه‌اندازی دوباره پیش‌نمایش می‌دهد.
- `--json`: JSON قابل‌خواندن برای ماشینِ `UpdateRunResult` را چاپ می‌کند، از جمله
  `postUpdate.plugins.integrityDrifts` وقتی در همگام‌سازی Plugin پس از به‌روزرسانی، drift در artifact مربوط به npm plugin
  شناسایی شود.
- `--timeout <seconds>`: زمان‌سنج هر مرحله (پیش‌فرض 1800s است).
- `--yes`: اعلان‌های تأیید را رد می‌کند (برای مثال تأیید downgrade).

<Warning>
Downgradeها به تأیید نیاز دارند، چون نسخه‌های قدیمی‌تر می‌توانند پیکربندی را خراب کنند.
</Warning>

## `update status`

کانال فعال به‌روزرسانی + تگ/شاخه/SHA در git (برای checkoutهای منبع)، به‌علاوهٔ در دسترس بودن به‌روزرسانی را نشان می‌دهد.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

گزینه‌ها:

- `--json`: JSON وضعیت قابل‌خواندن برای ماشین را چاپ می‌کند.
- `--timeout <seconds>`: زمان‌سنج بررسی‌ها (پیش‌فرض 3s است).

## `update wizard`

جریان تعاملی برای انتخاب کانال به‌روزرسانی و تأیید اینکه آیا پس از به‌روزرسانی Gateway
دوباره راه‌اندازی شود یا نه (پیش‌فرض، راه‌اندازی دوباره است). اگر `dev` را بدون checkout از git انتخاب کنید،
پیشنهاد می‌کند یکی بسازد.

گزینه‌ها:

- `--timeout <seconds>`: زمان‌سنج هر مرحلهٔ به‌روزرسانی (پیش‌فرض `1800`)

## چه کاری انجام می‌دهد

وقتی کانال‌ها را به‌صورت صریح جابه‌جا می‌کنید (`--channel ...`)، OpenClaw روش
نصب را نیز هم‌راستا نگه می‌دارد:

- `dev` → وجود یک checkout از git را تضمین می‌کند (پیش‌فرض: `~/openclaw`، قابل بازنویسی با `OPENCLAW_GIT_DIR`)،
  آن را به‌روزرسانی می‌کند و CLI سراسری را از همان checkout نصب می‌کند.
- `stable` → از npm با استفاده از `latest` نصب می‌کند.
- `beta` → dist-tag‏ `beta` در npm را ترجیح می‌دهد، اما وقتی بتا
  وجود نداشته باشد یا از انتشار پایدار فعلی قدیمی‌تر باشد، به `latest` برمی‌گردد.

به‌روزرسان خودکار هستهٔ Gateway (وقتی از طریق پیکربندی فعال باشد) از همین مسیر به‌روزرسانی دوباره استفاده می‌کند.

برای نصب‌های package-manager، `openclaw update` نسخهٔ بستهٔ هدف را
پیش از فراخوانی package manager حل می‌کند. نصب‌های سراسری npm از نصب مرحله‌بندی‌شده
استفاده می‌کنند: OpenClaw بستهٔ جدید را در یک پیشوند موقت npm نصب می‌کند، موجودی
`dist` بسته‌بندی‌شده را در آنجا بررسی می‌کند، سپس آن درخت بستهٔ پاک را با
پیشوند سراسری واقعی جابه‌جا می‌کند. اگر بررسی شکست بخورد، doctor پس از به‌روزرسانی، همگام‌سازی Plugin و
کار راه‌اندازی دوباره از درخت مشکوک اجرا نمی‌شوند. حتی وقتی نسخهٔ نصب‌شده
از قبل با هدف برابر باشد، فرمان نصب بستهٔ سراسری را تازه‌سازی می‌کند،
سپس همگام‌سازی Plugin، تازه‌سازی تکمیل فرمان هسته، و کار راه‌اندازی دوباره را اجرا می‌کند. این کار
sidecarهای بسته‌بندی‌شده و رکوردهای Plugin متعلق به کانال را با build نصب‌شدهٔ
OpenClaw هم‌راستا نگه می‌دارد و بازسازی کامل تکمیل فرمان‌های Plugin را به
اجرای صریح `openclaw completion --write-state` واگذار می‌کند.

وقتی یک سرویس Gateway مدیریت‌شدهٔ محلی نصب شده و راه‌اندازی دوباره فعال است،
به‌روزرسانی‌های package-manager پیش از جایگزینی درخت بسته،
سرویس در حال اجرا را متوقف می‌کنند، سپس فرادادهٔ سرویس را از نصب به‌روزرسانی‌شده تازه‌سازی می‌کنند، سرویس را دوباره راه‌اندازی می‌کنند
و بررسی می‌کنند که Gateway دوباره راه‌اندازی‌شده نسخهٔ مورد انتظار را گزارش دهد. با
`--no-restart`، جایگزینی بسته همچنان اجرا می‌شود اما سرویس مدیریت‌شده
متوقف یا دوباره راه‌اندازی نمی‌شود، بنابراین Gateway در حال اجرا ممکن است تا زمانی که آن را دستی
دوباره راه‌اندازی کنید، کد قدیمی را نگه دارد.

## جریان checkout از git

### انتخاب کانال

- `stable`: آخرین تگ غیر بتا را checkout می‌کند، سپس build و doctor را اجرا می‌کند.
- `beta`: آخرین تگ `-beta` را ترجیح می‌دهد، اما وقتی بتا وجود نداشته باشد یا قدیمی‌تر باشد، به آخرین تگ پایدار برمی‌گردد.
- `dev`: `main` را checkout می‌کند، سپس fetch و rebase را انجام می‌دهد.

### مراحل به‌روزرسانی

<Steps>
  <Step title="Verify clean worktree">
    نیازمند نبودن تغییرات commitنشده است.
  </Step>
  <Step title="Switch channel">
    به کانال انتخاب‌شده (تگ یا شاخه) جابه‌جا می‌شود.
  </Step>
  <Step title="Fetch upstream">
    فقط dev.
  </Step>
  <Step title="Preflight build (dev only)">
    lint و build TypeScript را در یک worktree موقت اجرا می‌کند. اگر tip شکست بخورد، تا 10 commit به عقب می‌رود تا جدیدترین build سالم را پیدا کند.
  </Step>
  <Step title="Rebase">
    روی commit انتخاب‌شده rebase می‌کند (فقط dev).
  </Step>
  <Step title="Install dependencies">
    از package manager مخزن استفاده می‌کند. برای checkoutهای pnpm، به‌روزرسان `pnpm` را در صورت نیاز bootstrap می‌کند (ابتدا از طریق `corepack`، سپس fallback موقت `npm install pnpm@10`) به‌جای اینکه `npm run build` را داخل workspace مربوط به pnpm اجرا کند.
  </Step>
  <Step title="Build Control UI">
    Gateway و Control UI را build می‌کند.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` به‌عنوان بررسی نهایی به‌روزرسانی ایمن اجرا می‌شود.
  </Step>
  <Step title="Sync plugins">
    plugins را با کانال فعال همگام می‌کند. dev از plugins همراه استفاده می‌کند؛ stable و beta از npm استفاده می‌کنند. plugins نصب‌شده با npm را به‌روزرسانی می‌کند.
  </Step>
</Steps>

<Warning>
اگر یک به‌روزرسانی دقیقاً pinشدهٔ npm plugin به artifactی حل شود که integrity آن با رکورد نصب ذخیره‌شده متفاوت است، `openclaw update` آن به‌روزرسانی artifact مربوط به Plugin را به‌جای نصب کردنش abort می‌کند. فقط پس از اینکه مطمئن شدید به artifact جدید اعتماد دارید، Plugin را صریحاً دوباره نصب یا به‌روزرسانی کنید.
</Warning>

<Note>
شکست‌های همگام‌سازی Plugin پس از به‌روزرسانی باعث شکست نتیجهٔ به‌روزرسانی می‌شوند و کار پیگیری راه‌اندازی دوباره را متوقف می‌کنند. خطای نصب یا به‌روزرسانی Plugin را رفع کنید، سپس `openclaw update` را دوباره اجرا کنید.

وقتی Gateway به‌روزرسانی‌شده شروع به کار می‌کند، وابستگی‌های runtime مربوط به plugins همراهِ فعال، پیش از فعال‌سازی Plugin مرحله‌بندی می‌شوند. راه‌اندازی‌های دوبارهٔ ناشی از به‌روزرسانی، هرگونه مرحله‌بندی فعال وابستگی runtime را پیش از بستن Gateway تخلیه می‌کنند، بنابراین راه‌اندازی دوباره توسط service-manager یک نصب npm در حال اجرا را قطع نمی‌کند.

اگر bootstrap مربوط به pnpm همچنان شکست بخورد، به‌روزرسان به‌جای تلاش برای `npm run build` داخل checkout، زودتر با خطای مخصوص package-manager متوقف می‌شود.
</Note>

## میان‌بر `--update`

`openclaw --update` به `openclaw update` بازنویسی می‌شود (برای shellها و اسکریپت‌های launcher مفید است).

## مرتبط

- `openclaw doctor` (پیشنهاد می‌کند روی checkoutهای git ابتدا به‌روزرسانی اجرا شود)
- [کانال‌های توسعه](/fa/install/development-channels)
- [به‌روزرسانی](/fa/install/updating)
- [مرجع CLI](/fa/cli)
