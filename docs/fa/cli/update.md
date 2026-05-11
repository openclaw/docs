---
read_when:
    - می‌خواهید یک نسخهٔ کاری کد منبع را به‌صورت ایمن به‌روزرسانی کنید
    - شما در حال اشکال‌زدایی خروجی یا گزینه‌های `openclaw update` هستید
    - باید رفتار خلاصه‌نویسی `--update` را درک کنید
summary: مرجع CLI برای `openclaw update` (به‌روزرسانی نسبتاً ایمن منبع + راه‌اندازی مجدد خودکار Gateway)
title: به‌روزرسانی
x-i18n:
    generated_at: "2026-05-11T20:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw را به‌صورت ایمن به‌روزرسانی کنید و بین کانال‌های پایدار/بتا/dev جابه‌جا شوید.

اگر از طریق **npm/pnpm/bun** نصب کرده‌اید (نصب سراسری، بدون فراداده git)،
به‌روزرسانی‌ها از طریق جریان مدیر بسته در [به‌روزرسانی](/fa/install/updating) انجام می‌شوند.

## استفاده

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

- `--no-restart`: پس از به‌روزرسانی موفق، راه‌اندازی دوباره سرویس Gateway را رد می‌کند. به‌روزرسانی‌های مدیر بسته که Gateway را راه‌اندازی دوباره می‌کنند، پیش از موفق شدن فرمان بررسی می‌کنند که سرویس راه‌اندازی‌شدهٔ دوباره نسخهٔ به‌روزرسانی‌شدهٔ مورد انتظار را گزارش دهد.
- `--channel <stable|beta|dev>`: کانال به‌روزرسانی را تنظیم می‌کند (git + npm؛ در پیکربندی ماندگار می‌شود).
- `--tag <dist-tag|version|spec>`: هدف بسته را فقط برای این به‌روزرسانی بازنویسی می‌کند. برای نصب‌های بسته، `main` به `github:openclaw/openclaw#main` نگاشت می‌شود.
- `--dry-run`: اقدامات به‌روزرسانی برنامه‌ریزی‌شده (جریان کانال/تگ/هدف/راه‌اندازی دوباره) را بدون نوشتن پیکربندی، نصب، همگام‌سازی plugins، یا راه‌اندازی دوباره پیش‌نمایش می‌کند.
- `--json`: JSON قابل‌خواندن توسط ماشین `UpdateRunResult` را چاپ می‌کند، از جمله
  `postUpdate.plugins.warnings` وقتی plugins مدیریت‌شدهٔ خراب یا غیرقابل‌بارگذاری پس از
  موفق شدن به‌روزرسانی هسته به تعمیر نیاز دارند، جزئیات fallback مربوط به plugin کانال بتا
  وقتی یک plugin انتشار بتا ندارد، و `postUpdate.plugins.integrityDrifts`
  وقتی drift آرتیفکت plugin مربوط به npm هنگام همگام‌سازی plugin پس از به‌روزرسانی شناسایی می‌شود.
- `--timeout <seconds>`: timeout برای هر گام (پیش‌فرض 1800s است).
- `--yes`: اعلان‌های تأیید را رد می‌کند (برای نمونه تأیید downgrade).

`openclaw update` پرچم `--verbose` ندارد. برای پیش‌نمایش
اقدامات برنامه‌ریزی‌شدهٔ کانال/تگ/نصب/راه‌اندازی دوباره از `--dry-run`، برای نتایج
قابل‌خواندن توسط ماشین از `--json`، و وقتی فقط به جزئیات کانال و
دسترس‌پذیری نیاز دارید از `openclaw update status --json` استفاده کنید. اگر در حال debug کردن logهای Gateway پیرامون یک به‌روزرسانی هستید،
verbosity کنسول و سطح log فایل جدا هستند: `--verbose` مربوط به Gateway روی
خروجی terminal/WebSocket اثر می‌گذارد، در حالی که logهای فایل به `logging.level: "debug"` یا
`"trace"` در پیکربندی نیاز دارند. [Gateway logging](/fa/gateway/logging) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، اجرای تغییردهندهٔ `openclaw update` غیرفعال است. به‌جای آن source یا flake input مربوط به Nix را برای این نصب به‌روزرسانی کنید؛ برای nix-openclaw، از [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید. `openclaw update status` و `openclaw update --dry-run` فقط‌خواندنی باقی می‌مانند.
</Note>

<Warning>
Downgradeها به تأیید نیاز دارند چون نسخه‌های قدیمی‌تر می‌توانند پیکربندی را خراب کنند.
</Warning>

## `update status`

کانال به‌روزرسانی فعال + تگ/شاخه/SHA مربوط به git (برای checkoutهای source)، به‌همراه دسترس‌پذیری به‌روزرسانی را نشان می‌دهد.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

گزینه‌ها:

- `--json`: JSON وضعیت قابل‌خواندن توسط ماشین را چاپ می‌کند.
- `--timeout <seconds>`: timeout برای بررسی‌ها (پیش‌فرض 3s است).

## `update wizard`

جریان تعاملی برای انتخاب یک کانال به‌روزرسانی و تأیید اینکه آیا Gateway
پس از به‌روزرسانی راه‌اندازی دوباره شود یا نه (پیش‌فرض راه‌اندازی دوباره است). اگر `dev` را بدون checkout از git انتخاب کنید، پیشنهاد می‌کند یکی بسازد.

گزینه‌ها:

- `--timeout <seconds>`: timeout برای هر گام به‌روزرسانی (پیش‌فرض `1800`)

## چه کاری انجام می‌دهد

وقتی کانال‌ها را به‌صورت صریح جابه‌جا می‌کنید (`--channel ...`)، OpenClaw همچنین
روش نصب را هم‌راستا نگه می‌دارد:

- `dev` → وجود یک checkout از git را تضمین می‌کند (پیش‌فرض: `~/openclaw`، قابل بازنویسی با `OPENCLAW_GIT_DIR`)،
  آن را به‌روزرسانی می‌کند، و CLI سراسری را از همان checkout نصب می‌کند.
- `stable` → از npm با `latest` نصب می‌کند.
- `beta` → npm dist-tag به نام `beta` را ترجیح می‌دهد، اما وقتی بتا
  موجود نیست یا از انتشار پایدار فعلی قدیمی‌تر است به `latest` fallback می‌کند.

به‌روزرسان خودکار هستهٔ Gateway (وقتی از طریق پیکربندی فعال شده باشد) مسیر به‌روزرسانی CLI را
خارج از request handler زندهٔ Gateway اجرا می‌کند. به‌روزرسانی‌های مدیر بستهٔ
control-plane `update.run` پس از جابه‌جایی بسته، یک راه‌اندازی دوبارهٔ به‌روزرسانی غیرمعوق و بدون cooldown را اجبار می‌کنند،
چون فرایند قدیمی Gateway ممکن است هنوز chunkهای درون‌حافظه‌ای داشته باشد که به
فایل‌های حذف‌شده توسط بستهٔ جدید اشاره می‌کنند.

برای نصب‌های مدیر بسته، `openclaw update` پیش از فراخوانی مدیر بسته
نسخهٔ بستهٔ هدف را resolve می‌کند. نصب‌های سراسری npm از نصب staged استفاده می‌کنند:
OpenClaw بستهٔ جدید را در یک prefix موقت npm نصب می‌کند، inventory مربوط به
`dist` بسته‌بندی‌شده را آنجا بررسی می‌کند، سپس آن درخت بستهٔ پاک را به
prefix سراسری واقعی جابه‌جا می‌کند. اگر بررسی شکست بخورد، doctor پس از به‌روزرسانی، همگام‌سازی plugin، و
کار راه‌اندازی دوباره از درخت مشکوک اجرا نمی‌شوند. حتی وقتی نسخهٔ نصب‌شده
از قبل با هدف همخوان است، فرمان نصب بستهٔ سراسری را refresh می‌کند،
سپس همگام‌سازی plugin، refresh تکمیل فرمان هسته، و کار راه‌اندازی دوباره را اجرا می‌کند. این
کار sidecarهای بسته‌بندی‌شده و رکوردهای plugin تحت مالکیت کانال را با
build نصب‌شدهٔ OpenClaw هم‌راستا نگه می‌دارد، در حالی که بازسازی‌های کامل تکمیل فرمان plugin را به
اجرای صریح `openclaw completion --write-state` واگذار می‌کند.

وقتی یک سرویس Gateway مدیریت‌شدهٔ محلی نصب شده و راه‌اندازی دوباره فعال باشد،
به‌روزرسانی‌های مدیر بسته پیش از جایگزینی درخت بسته
سرویس در حال اجرا را متوقف می‌کنند، سپس فرادادهٔ سرویس را از نصب به‌روزرسانی‌شده refresh می‌کنند، سرویس را
راه‌اندازی دوباره می‌کنند، و پیش از گزارش موفقیت بررسی می‌کنند که Gateway راه‌اندازی‌شدهٔ دوباره
نسخهٔ مورد انتظار را گزارش دهد. روی macOS، بررسی پس از به‌روزرسانی همچنین بررسی می‌کند که LaunchAgent
برای profile فعال loaded/running باشد و port پیکربندی‌شدهٔ loopback سالم باشد. اگر plist نصب شده باشد اما launchd بر آن نظارت نکند، OpenClaw
LaunchAgent را به‌صورت خودکار دوباره bootstrap می‌کند، سپس بررسی‌های
سلامت/نسخه/آمادگی کانال را دوباره اجرا می‌کند. یک bootstrap تازه job مربوط به RunAtLoad را
مستقیماً load می‌کند، بنابراین recovery به‌روزرسانی بلافاصله Gateway تازه
spawn‌شده را `kickstart -k` نمی‌کند. اگر Gateway همچنان سالم نشود، فرمان
با کد غیرصفر خارج می‌شود و مسیر log راه‌اندازی دوباره به‌همراه دستورهای صریح راه‌اندازی دوباره، نصب دوباره، و
rollback بسته را چاپ می‌کند. با `--no-restart`،
جایگزینی بسته همچنان اجرا می‌شود اما سرویس مدیریت‌شده متوقف یا
راه‌اندازی دوباره نمی‌شود، بنابراین Gateway در حال اجرا ممکن است تا وقتی دستی راه‌اندازی دوباره‌اش کنید
کد قدیمی را نگه دارد.

## جریان checkout از git

### انتخاب کانال

- `stable`: آخرین تگ غیر بتا را checkout می‌کند، سپس build و doctor را اجرا می‌کند.
- `beta`: آخرین تگ `-beta` را ترجیح می‌دهد، اما وقتی بتا موجود نیست یا قدیمی‌تر است به آخرین تگ پایدار fallback می‌کند.
- `dev`: `main` را checkout می‌کند، سپس fetch و rebase می‌کند.

### گام‌های به‌روزرسانی

<Steps>
  <Step title="Verify clean worktree">
    نیاز دارد هیچ تغییر commitنشده‌ای وجود نداشته باشد.
  </Step>
  <Step title="Switch channel">
    به کانال انتخاب‌شده جابه‌جا می‌شود (تگ یا شاخه).
  </Step>
  <Step title="Fetch upstream">
    فقط dev.
  </Step>
  <Step title="Preflight build (dev only)">
    build مربوط به TypeScript را در یک worktree موقت اجرا می‌کند. اگر tip شکست بخورد، تا 10 commit به عقب می‌رود تا جدیدترین commit قابل build را پیدا کند. `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` را تنظیم کنید تا lint نیز در این preflight اجرا شود؛ lint در حالت serial محدود اجرا می‌شود چون hostهای به‌روزرسانی کاربر اغلب از runnerهای CI کوچک‌تر هستند.
  </Step>
  <Step title="Rebase">
    روی commit انتخاب‌شده rebase می‌کند (فقط dev).
  </Step>
  <Step title="Install dependencies">
    از مدیر بستهٔ repo استفاده می‌کند. برای checkoutهای pnpm، updater به‌جای اجرای `npm run build` داخل یک workspace pnpm، `pnpm` را در صورت نیاز bootstrap می‌کند (ابتدا از طریق `corepack`، سپس fallback موقت `npm install pnpm@11`).
  </Step>
  <Step title="Build Control UI">
    gateway و Control UI را build می‌کند.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` به‌عنوان بررسی نهایی safe-update اجرا می‌شود.
  </Step>
  <Step title="Sync plugins">
    plugins را با کانال فعال همگام‌سازی می‌کند. Dev از plugins همراه استفاده می‌کند؛ stable و beta از npm استفاده می‌کنند. نصب‌های plugin ردیابی‌شده را به‌روزرسانی می‌کند.
  </Step>
</Steps>

روی کانال به‌روزرسانی بتا، نصب‌های plugin مربوط به npm و ClawHub که ردیابی می‌شوند و
خط پیش‌فرض/latest را دنبال می‌کنند، ابتدا یک انتشار plugin با `@beta` را امتحان می‌کنند. اگر plugin هیچ
انتشار بتا نداشته باشد، OpenClaw به spec پیش‌فرض/latest ثبت‌شده fallback می‌کند و
آن را به‌عنوان هشدار گزارش می‌دهد. برای plugins مربوط به npm، OpenClaw همچنین وقتی بستهٔ بتا
وجود دارد اما در اعتبارسنجی نصب شکست می‌خورد fallback می‌کند. این هشدارهای fallback مربوط به plugin باعث
شکست به‌روزرسانی هسته نمی‌شوند. نسخه‌های دقیق و تگ‌های صریح
بازنویسی نمی‌شوند.

<Warning>
اگر یک به‌روزرسانی plugin مربوط به npm با pin دقیق به آرتیفکتی resolve شود که integrity آن با رکورد نصب ذخیره‌شده متفاوت است، `openclaw update` به‌جای نصب آن، به‌روزرسانی آرتیفکت plugin را abort می‌کند. فقط پس از بررسی اینکه به آرتیفکت جدید اعتماد دارید، plugin را صریحاً دوباره نصب یا به‌روزرسانی کنید.
</Warning>

<Note>
شکست‌های همگام‌سازی plugin پس از به‌روزرسانی که به یک plugin مدیریت‌شده محدود هستند، پس از موفق شدن به‌روزرسانی هسته به‌عنوان هشدار گزارش می‌شوند. نتیجهٔ JSON مقدار سطح بالای `status: "ok"` را نگه می‌دارد و `postUpdate.plugins.status: "warning"` را با راهنمایی `openclaw doctor --fix` و `openclaw plugins inspect <id> --runtime --json` گزارش می‌کند. exceptionهای غیرمنتظرهٔ updater یا sync همچنان باعث شکست نتیجهٔ به‌روزرسانی می‌شوند. نصب plugin یا خطای به‌روزرسانی را رفع کنید، سپس `openclaw doctor --fix` یا `openclaw update` را دوباره اجرا کنید.

وقتی Gateway به‌روزرسانی‌شده شروع به کار می‌کند، بارگذاری plugin فقط verify-only است: startup مدیران بسته را اجرا نمی‌کند یا درخت‌های dependency را تغییر نمی‌دهد. راه‌اندازی دوباره‌های مدیر بستهٔ `update.run` پس از جابه‌جایی درخت بسته، deferral عادی idle و cooldown راه‌اندازی دوباره را دور می‌زنند، بنابراین فرایند قدیمی نمی‌تواند به lazy-load کردن chunkهای حذف‌شده ادامه دهد.

اگر bootstrap مربوط به pnpm همچنان شکست بخورد، updater به‌جای تلاش برای `npm run build` داخل checkout، زودتر با یک خطای خاص مدیر بسته متوقف می‌شود.
</Note>

## شکل کوتاه `--update`

`openclaw --update` به `openclaw update` بازنویسی می‌شود (برای shellها و scriptهای launcher مفید است).

## مرتبط

- `openclaw doctor` (در checkoutهای git پیشنهاد می‌کند ابتدا update اجرا شود)
- [کانال‌های توسعه](/fa/install/development-channels)
- [به‌روزرسانی](/fa/install/updating)
- [مرجع CLI](/fa/cli)
