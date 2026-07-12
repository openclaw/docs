---
read_when:
    - ساخت یا اجرای کنترل کیفیت بصری زنده برای اشکال‌های OpenClaw
    - افزودن تأیید پیش و پس از یک درخواست کشش
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا سایر سرویس‌ها
    - اجرای اثبات متمرکز مرورگری رابط کاربری کنترل برای یک ارجاع کاندیدا
    - اشکال‌زدایی اجرای آزمون‌های تضمین کیفیت که به اسکرین‌شات، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis شواهد بصری سرتاسری را برای مقایسه‌های انتقال زنده و اثبات‌های متمرکز مرورگر که فقط به گزینهٔ موردنظر مربوط‌اند ثبت می‌کند و سپس مصنوعات را به PRها پیوست می‌کند.
title: مانتیس
x-i18n:
    generated_at: "2026-07-12T09:50:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis شواهد بصری CI و یک نظر در PR برای رفتار OpenClaw منتشر می‌کند.
سناریوهای انتقال زنده، یک خط مبنای معیوبِ شناخته‌شده را با یک ref نامزد مقایسه می‌کنند؛
مسیرهای متمرکز مرورگر ممکن است در عوض، یک نامزد را در برابر یک انتقال شبیه‌سازی‌شده و
قطعی اثبات کنند. Discord نخستین انتقالی بود که با احراز هویت واقعی ربات، کانال‌های guild،
واکنش‌ها، رشته‌ها و یک شاهد مرورگری ارائه شد. مسیرهای Slack، Telegram و گفت‌وگوی متمرکز
Control UI نیز وجود دارند؛ WhatsApp و Matrix پیاده‌سازی نشده‌اند.

## مالکیت

- OpenClaw (`extensions/qa-lab/src/mantis/*`): زمان‌اجرای سناریو، CLI مربوط به `pnpm openclaw qa mantis <command>`، شِمای شواهد.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): چارچوب انتقال زنده، ربات‌های راه‌انداز/SUT، تولیدکننده‌های گزارش/شواهد.
- Crabbox (`openclaw/crabbox`): ماشین‌های Linux آماده، اجاره‌ها، VNC، `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): نقاط ورود راه‌دور، نگه‌داری مصنوعات.
- ClawSweeper: فرمان‌های نگه‌دارندگان در PR را تجزیه می‌کند، گردش‌کارها را اجرا می‌کند و نظر نهایی PR را ارسال می‌کند.

## فرمان‌های CLI

همه فرمان‌ها به‌شکل `pnpm openclaw qa mantis <command>` هستند و در
`extensions/qa-lab/src/mantis/cli.ts` تعریف شده‌اند. در زمان ساخت/اجرا به
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` نیاز دارند (گردش‌کارهای همراه پیش از ساخت،
`OPENCLAW_BUILD_PRIVATE_QA=1` و `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` را تنظیم می‌کنند).

| فرمان                           | هدف                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | تأیید می‌کند که ربات Mantis در Discord می‌تواند guild/کانال را ببیند، پیام ارسال کند و واکنش نشان دهد.                                                        |
| `run`                           | یک سناریوی قبل/بعد را در برابر refهای خط مبنا و نامزد اجرا می‌کند (فقط Discord).                                                                               |
| `desktop-browser-smoke`         | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، مرورگری قابل‌مشاهده باز می‌کند و نماگرفت + ویدئو ضبط می‌کند.                                        |
| `slack-desktop-smoke`           | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، QA مربوط به Slack را درون آن اجرا می‌کند، Slack Web را باز می‌کند و شواهد را ثبت می‌کند.           |
| `telegram-desktop-builder`      | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، Telegram Desktop را نصب می‌کند و در صورت نیاز یک Gateway مربوط به OpenClaw را پیکربندی می‌کند.      |
| `visual-task` / `visual-driver` | ثبت عمومی دسکتاپ Crabbox با گزاره‌های اختیاری درک تصویر؛ `visual-driver` نیمه راه‌انداز است که زیر `crabbox record --while` اجرا می‌شود.                      |

هر فرمان `--repo-root <path>` و `--output-dir <path>` را می‌پذیرد؛ فرمان‌های Crabbox
همچنین `--crabbox-bin`، `--provider`، `--machine-class`/`--class`،
`--lease-id`، `--idle-timeout`، `--ttl` و `--keep-lease` را می‌پذیرند. پیش‌فرض‌های
CLI محلی برای ارائه‌دهنده/کلاس، مگر آنکه خلافش ذکر شود، `hetzner`/`beast` هستند؛
گردش‌کارهای CI معمولاً هر دو را بازنویسی می‌کنند.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

API مربوط به Discord REST (`https://discord.com/api/v10`) را فراخوانی می‌کند تا کاربر
ربات، guild، کانال‌های guild و کانال هدف را دریافت کند، تأیید می‌کند که کانال به
guild تعلق دارد و سپس (مگر با `--skip-post`) پیامی ارسال می‌کند و واکنش `👀` را
می‌افزاید. فایل‌های `mantis-discord-smoke-summary.json` و
`mantis-discord-smoke-report.md` را می‌نویسد.

ترتیب یافتن توکن: مقدار `--token-file`، سپس `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(قابل بازنویسی با `--token-env`) و پس از آن فایلی که
`OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` نام می‌برد
(قابل بازنویسی با `--token-file-env`). شناسه‌های guild/کانال از
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` می‌آیند
(قابل بازنویسی با `--guild-id` / `--channel-id`) و باید snowflakeهای ۱۷ تا ۲۰ رقمی
Discord باشند. برای جایگزینی شناسه‌ها و نام‌های ربات/guild/کانال/پیام با
`<redacted>` در خلاصه و گزارش منتشرشده، `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
را تنظیم کنید.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` در حال حاضر فقط `discord` را می‌پذیرد. `--scenario` یکی از دو شناسه
داخلی است که هرکدام ref پیش‌فرض خط مبنا و برچسب‌های مورد انتظار قبل/بعد خود را دارند
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| سناریو                                     | خط مبنای پیش‌فرض                           | انتظار از خط مبنا                         | انتظار از نامزد                |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ------------------------------ |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                             | `queued -> thinking -> done`   |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | پاسخ رشته پیوست `filePath` را حذف می‌کند | پاسخ رشته آن را شامل می‌شود   |

مقدار پیش‌فرض `--candidate` برابر `HEAD` است. پرچم‌های دیگر: `--credential-source`
(پیش‌فرض `convex`)، `--credential-role` (پیش‌فرض `ci`)، `--provider-mode`
(پیش‌فرض `live-frontier`)، `--fast` (به‌طور پیش‌فرض فعال)، `--skip-install` و
`--skip-build`.

اجراکننده، checkoutهای جداشده `git worktree` را برای خط مبنا و نامزد زیر
`<output-dir>/worktrees/` ایجاد می‌کند، در هرکدام `pnpm install`/`pnpm build` را
اجرا می‌کند (مگر آنکه رد شده باشند) و سپس فرمان
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
را در برابر هر worktree اجرا می‌کند. هر مسیر، `discord-qa-reaction-timelines.json`
را همراه با یک جفت `<scenario-id>-timeline.html`/`.png` می‌نویسد؛ اجراکننده این
شواهد را زیر `baseline/`/`candidate/` کپی می‌کند، فایل‌های `comparison.json`،
`mantis-report.md` و `mantis-evidence.json` را در پوشه خروجی می‌نویسد و اگر مقایسه
موفق نباشد (خط مبنا `fail` و نامزد `pass`)، با وضعیت غیرصفر خارج می‌شود.

سناریوی دوم Discord (`discord-thread-reply-filepath-attachment`) با ربات راه‌انداز
یک پیام والد ارسال می‌کند، یک رشته واقعی می‌سازد، کنش `message.thread-reply` مربوط
به SUT را با یک `filePath` محلی مخزن فراخوانی می‌کند و سپس رشته را برای یافتن پاسخ
و نام فایل پیوست‌شده پایش می‌کند. انتظار دارد پیوستی با نام
`mantis-thread-report.md` وجود داشته باشد.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، درون نشست VNC مرورگری
را اجرا می‌کند که به `--browser-url` (پیش‌فرض `https://openclaw.ai`) یا یک
`--html-file` رندرشده اشاره دارد، منتظر می‌ماند، با `scrot` نماگرفت می‌گیرد، در
صورت نیاز با `ffmpeg` یک MP4 ضبط می‌کند و فایل‌های
`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json` را با rsync به
`--output-dir` بازمی‌گرداند.

پرچم‌ها:

- `--lease-id <cbx_...>` به‌جای ساخت دسکتاپ جدید، یک دسکتاپ آماده را دوباره به‌کار می‌گیرد.
- `--browser-profile-dir <remote-path>` یک پوشه داده کاربر راه‌دور Chrome را دوباره به‌کار می‌گیرد تا دسکتاپ پایدار میان اجراها وارد حساب باقی بماند (برای نمایه بلندمدت نمایشگر Discord Web استفاده می‌شود).
- `--browser-profile-archive-env <name>` پیش از اجرا، یک بایگانی نمایه Chrome با قالب base64 `.tgz` را از آن متغیر محیطی بازیابی می‌کند (پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`)؛ برای شاهدان واردشده به حساب مانند Discord Web استفاده می‌شود.
- `--video-duration <seconds>` طول ضبط MP4 را کنترل می‌کند (پیش‌فرض ۱۰ ثانیه).
- `--keep-lease` (یا `OPENCLAW_MANTIS_KEEP_VM=1`) اجاره‌ای را که این اجرا ساخته است برای بازرسی VNC باز نگه می‌دارد؛ اجراهای ناموفقی که اجاره ساخته‌اند نیز به‌طور پیش‌فرض آن را نگه می‌دارند.

برای شواهد Discord Web، ‏Mantis از یک حساب اختصاصی نمایشگر استفاده می‌کند، نه توکن
ربات. مرجع Discord REST (از طریق `qa discord`) همچنان معتبر است؛ هنگامی که
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شود، سناریو یک مصنوع URL مربوط
به Discord Web نیز می‌نویسد و `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` رشته را آن‌قدر
باز نگه می‌دارد که مرورگر بتواند آن را باز کند.

گردش‌کار GitHub یک نمایه پایدار نمایشگر را از طریق
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ترجیح می‌دهد (بایگانی‌های کامل نمایه
ممکن است از محدودیت اندازه secret در GitHub فراتر بروند)؛ برای نمایه‌های کوچک/راه‌انداز
می‌تواند در عوض یک فایل base64 با قالب `.tgz` را از
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` بازیابی کند. اگر هیچ‌یک از این
منابع پیکربندی نشده باشد، گردش‌کار همچنان نماگرفت‌های قطعی خط مبنا/نامزد را منتشر
می‌کند و ثبت می‌کند که شاهد واردشده به حساب رد شده است.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، checkout را در VM
همگام‌سازی می‌کند، `pnpm openclaw qa slack` را درون آن اجرا می‌کند، Slack Web را
در مرورگر VNC باز می‌کند، دسکتاپ را ثبت می‌کند و هم مصنوعات QA مربوط به Slack
(`slack-qa/`) و هم نماگرفت/ویدئوی VNC را به محیط محلی بازمی‌گرداند. این تنها شکل
Mantis است که در آن Gateway مربوط به SUT و مرورگر، هر دو در یک VM اجرا می‌شوند.

با `--gateway-setup`، فرمان یک خانه پایدار و یک‌بارمصرف OpenClaw در مسیر
`$HOME/.openclaw-mantis/slack-openclaw` داخل VM ایجاد می‌کند، پیکربندی Slack
Socket Mode را برای کانال هدف اصلاح می‌کند،
`openclaw gateway run --dev --allow-unconfigured --port 38973` را آغاز می‌کند و
Chrome را در نشست VNC در حال اجرا باقی می‌گذارد؛ حذف `--gateway-setup` در عوض
مسیر عادی QA ربات‌به‌ربات Slack را اجرا می‌کند.

متغیرهای محیطی لازم برای `--credential-source env` (پیش‌فرض محلی `env` است؛ نقش
پیش‌فرض `maintainer` است):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه‌دور (اگر در محیط محلی فقط `OPENAI_API_KEY`
  تنظیم شده باشد، Mantis پیش از فراخوانی Crabbox آن را در
  `OPENCLAW_LIVE_OPENAI_KEY` کپی می‌کند)

با `--credential-source convex`، ‏Mantis پیش از ایجاد VM، اعتبارنامه SUT مربوط به
Slack را از مخزن مشترک اجاره می‌کند و شناسه کانال، توکن برنامه و توکن ربات را
به‌صورت متغیرهای محیطی `OPENCLAW_MANTIS_SLACK_*` به VM می‌فرستد؛ بنابراین
گردش‌کارهای GitHub فقط به secret کارگزار Convex نیاز دارند، نه توکن‌های خام Slack.

پرچم‌های دیگر: `--slack-url <url>` یک URL مشخص را باز می‌کند (در غیر این صورت
Mantis مقدار `https://app.slack.com/client/<team>/<channel>` را از `auth.test`
استخراج می‌کند)؛ `--slack-channel-id <id>` کانال فهرست مجاز Gateway را تنظیم
می‌کند؛ `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` نمایه پایدار Chrome داخل VM
را کنترل می‌کند (پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile`)؛
`--approval-checkpoints` سناریوهای بومی تأیید Slack
(`slack-approval-exec-native`، `slack-approval-plugin-native`) را اجرا می‌کند و
به‌جای راه‌اندازی Gateway، نماگرفت‌های نقاط بازرسی در انتظار/حل‌شده را رندر می‌کند
(با `--gateway-setup` ناسازگار است)؛ `--hydrate-mode source|prehydrated`،
`--provider-mode`، `--model`، `--alt-model` و `--fast` مستقیماً به مسیر زنده
Slack منتقل می‌شوند.

نماگرفت‌های نقاط بازرسی تأیید از پیام API مربوط به Slack که سناریو مشاهده کرده
است رندر می‌شوند، نه از رابط زنده Slack؛ `slack-desktop-smoke.png` فقط زمانی
شاهد خود Slack Web است که نمایه مرورگر اجاره از قبل وارد حساب شده باشد.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، Telegram Desktop بومی لینوکس را نصب می‌کند،
در صورت نیاز بایگانی نشست کاربر را بازیابی می‌کند، OpenClaw را با توکن بات SUT تلگرامِ
اجاره‌شده پیکربندی می‌کند، دستور
`openclaw gateway run --dev --allow-unconfigured --port 38974` را اجرا می‌کند، یک
پیام آمادگی بات راه‌انداز را در گروه خصوصی اجاره‌شده ارسال می‌کند و سپس یک
نماگرفت و فایل MP4 ثبت می‌کند. توکن بات فقط OpenClaw را پیکربندی می‌کند و هرگز
Telegram Desktop را وارد حساب نمی‌کند. نمایشگر دسکتاپ یک نشست کاربری جداگانه Telegram است
که از `--telegram-profile-archive-env <name>` بازیابی می‌شود یا به‌صورت دستی
از طریق VNC وارد حساب می‌شود و با `--keep-lease` فعال نگه داشته می‌شود.

پرچم‌ها: `--lease-id <cbx_...>` اجرا را روی یک ماشین مجازی که از قبل در
Telegram Desktop وارد حساب شده است تکرار می‌کند؛ `--telegram-profile-archive-env <name>` یک بایگانی نمایه
`.tgz` با کدگذاری base64 را پیش از راه‌اندازی بازیابی می‌کند؛ `--telegram-profile-dir <remote-path>`
دایرکتوری نمایه راه‌دور را تعیین می‌کند (پیش‌فرض `$HOME/.local/share/TelegramDesktop`)؛
`--no-gateway-setup` فقط Telegram Desktop را نصب و باز می‌کند؛
مقادیر پیش‌فرض `--credential-source`/`--credential-role` به‌ترتیب `convex`/`maintainer` هستند.

## مانیفست شواهد

هر سناریویی که در یک PR منتشر می‌شود، فایل `mantis-evidence.json` را در کنار
گزارش خود می‌نویسد:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

`path` مصنوع نسبت به دایرکتوری مانیفست است؛ `targetPath` نسبت به
پیشوند پیکربندی‌شده مصنوعات R2/S3 است. `scripts/mantis/publish-pr-evidence.mjs`
پیمایش مسیر را رد می‌کند و وقتی فایل وجود ندارد، ورودی‌های دارای `"required": false` را
نادیده می‌گیرد.

انواع مصنوعات: `timeline` (نماگرفت قطعی پیش/پس)،
`desktopScreenshot` (نماگرفت VNC/مرورگر)، `motionPreview` (فایل GIF متحرک درون‌خطی
از ضبط)، `motionClip` (فایل MP4 کوتاه‌شده بر اساس حرکت)، `fullVideo` (ضبط کامل)،
`metadata` (فایل جانبی JSON/گزارش)، `report` (گزارش Markdown).

چیدمان مصنوعات روی دیسک برای یک اجرا:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

نماگرفت‌ها شواهد هستند، نه اسرار، اما همچنان باید با دقت حذف اطلاعات حساس انجام شود:
ممکن است نام کانال‌های خصوصی، نام‌های کاربری یا محتوای پیام‌ها نمایش داده شوند. برای
بارگذاری عمومی مصنوعات، `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را تنظیم کنید؛ این گزینه
در گردش‌کارهای GitHub مربوط به Discord/Slack/Telegram به‌طور پیش‌فرض فعال است.

## خودکارسازی GitHub

`scripts/mantis/publish-pr-evidence.mjs` منتشرکننده قابل استفاده مجدد است. گردش‌کارها
آن را با مانیفست، PR هدف، ریشه مقصد مصنوعات، نشانگر دیدگاه،
نشانی وب مصنوعات، نشانی وب اجرا و منبع درخواست فراخوانی می‌کنند. این اسکریپت مصنوعات اعلام‌شده را در
سطل R2 متعلق به Mantis بارگذاری می‌کند، یک دیدگاه PR با اولویت نمایش خلاصه، شامل
تصاویر/پیش‌نمایش‌های درون‌خطی و ویدئوهای پیوندشده می‌سازد و سپس دیدگاه نشانگردار موجود را
به‌روزرسانی می‌کند یا دیدگاهی جدید می‌سازد. متغیرهای محیطی الزامی:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (گردش‌کارها مقدار `openclaw-crabbox-artifacts` را تنظیم می‌کنند)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (گردش‌کارها مقدار `auto` را تنظیم می‌کنند)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (گردش‌کارها مقدار `https://artifacts.openclaw.ai` را تنظیم می‌کنند)

دیدگاه‌ها از طریق برنامه GitHub متعلق به Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) ارسال می‌شوند، نه `github-actions[bot]`، و از یک
دیدگاه نشانگر پنهان به‌عنوان کلید درج یا به‌روزرسانی استفاده می‌کنند.

| گردش‌کار                          | محرک                                                                                    | کاری که انجام می‌دهد                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | اجرای دستی                                                                            | `discord-smoke` را روی مرجع انتخاب‌شده اجرا می‌کند.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | دیدگاه PR یا اجرای دستی                                                              | درخت‌های کاری جداگانه مبنا/نامزد را می‌سازد، `discord-status-reactions-tool-only` را روی هرکدام اجرا می‌کند، خط زمانی هر مسیر را در مرورگر دسکتاپ Crabbox رندر می‌کند، پیش‌نمایش‌های GIF/MP4 کوتاه‌شده بر اساس حرکت را با `crabbox media preview` تولید می‌کند، مصنوعات را بارگذاری می‌کند و شواهد درون‌خطی را در PR ارسال می‌کند.                                 |
| `Mantis Scenario`                 | اجرای دستی                                                                            | توزیع‌کننده عمومی: `scenario_id` (`discord-status-reactions-tool-only`، `discord-thread-reply-filepath-attachment`، `slack-desktop-smoke`، `telegram-live`، `telegram-desktop-proof`، `web-ui-chat-proof`)، `baseline_ref`، `candidate_ref` و `pr_number` را می‌گیرد و به گردش‌کار سناریوی متناظر ارسال می‌کند. |
| `Mantis Slack Desktop Smoke`      | اجرای دستی                                                                            | یک دسکتاپ لینوکس Crabbox را اجاره می‌کند (پیش‌فرض `aws`، با امکان انتخاب `hetzner`)، دستور `slack-desktop-smoke --gateway-setup` را روی نامزد اجرا می‌کند، دسکتاپ را ضبط می‌کند، پیش‌نمایش حرکت را تولید و مصنوعات را بارگذاری می‌کند و در صورت ارائه شماره PR، شواهد را در PR ارسال می‌کند.                                                      |
| `Mantis Telegram Live`            | دیدگاه PR یا اجرای دستی                                                              | مسیر QA زنده Telegram مبتنی بر API بات (`openclaw qa telegram`) را اجرا می‌کند، `mantis-evidence.json` را از خلاصه QA می‌نویسد، HTML شواهد ویرایش‌شده را از طریق مرورگر دسکتاپ Crabbox رندر می‌کند، یک GIF حرکتی می‌سازد و شواهد را در PR ارسال می‌کند. ورود به Telegram Web برای این مسیر لازم نیست.                               |
| `Mantis Telegram Desktop Proof`   | برچسب PR نگه‌دارنده (`mantis: telegram-visible-proof`) به‌همراه دیدگاه PR، یا اجرای دستی | اثبات عامل‌محور پیش/پس در Telegram Desktop بومی. PR، مراجع مبنا/نامزد و دستورالعمل‌های نگه‌دارنده را به Codex می‌دهد؛ Codex مسیر اثبات Telegram Desktop کاربر واقعی در Crabbox را برای هر دو مرجع اجرا می‌کند و یک جدول شواهد دو ستونی در PR می‌فرستد.                                                              |
| `Mantis Web UI Chat Proof`        | دیدگاه PR یا اجرای دستی                                                              | اثبات متمرکز گفت‌وگوی Playwright در رابط کنترل OpenClaw را روی نامزد اجرا می‌کند، تأیید می‌کند مرورگر از طریق Gateway شبیه‌سازی‌شده ارسال می‌کند، مصنوعات نماگرفت/ویدئو را ثبت می‌کند و شواهد را در PR می‌فرستد. این مسیر فقط برای اثبات گفت‌وگوی وب است، نه WinUI/برنامه بومی یا هرگونه اثبات بصری دلخواه.                           |

هر دو گردش‌کار `Mantis Discord Status Reactions` و `Mantis Telegram Live`
مقادیر `baseline_ref`/`candidate_ref` (یا `baseline=`/`candidate=` در دیدگاه PR) را می‌پذیرند
و پیش از اجرا با اطلاعات محرمانه تأیید می‌کنند که SHA حل‌شده یا نیای `origin/main` است،
یا یک برچسب انتشار (`v*`) است، یا سرشاخه یک PR باز است.

محرک‌های دیدگاه از یک PR با دسترسی نوشتن/نگه‌داری/مدیریت:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

محرک‌های دیدگاه Telegram به‌طور پیش‌فرض از SHA سرشاخه PR به‌عنوان نامزد و
`telegram-status-command` به‌عنوان سناریو استفاده می‌کنند؛ آن‌ها `provider=aws|hetzner` و
`lease=<cbx_...>` را می‌پذیرند تا یک ارائه‌دهنده مشخص Crabbox یا دسکتاپ
از پیش آماده‌شده را هدف بگیرند. `Mantis Telegram Desktop Proof` فقط زمانی به دیدگاه PR پاسخ می‌دهد
که PR از قبل برچسب `mantis: telegram-visible-proof` را داشته باشد.

محرک‌های دیدگاه گفت‌وگوی رابط وب به‌طور پیش‌فرض SHA سرشاخه PR را نامزد قرار می‌دهند. آن‌ها
اثبات گفت‌وگوی رابط کنترل با Gateway شبیه‌سازی‌شده را اجرا و مصنوعات مرورگر را منتشر می‌کنند؛ برای
سایر صفحه‌های وب و سطوح برنامه بومی، از اثبات عادی Playwright/مرورگر، نماگرفت‌های
نگه‌دارنده، Crabbox یا مصنوعات محلی استفاده کنید.

ClawSweeper همچنین می‌تواند یک سناریو را مستقیماً اجرا کند:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## ماشین‌ها و اسرار

مقادیر پیش‌فرض Crabbox در CLI محلی عبارت‌اند از `--provider hetzner --class beast`؛ با
`--provider`، `--class`/`--machine-class` یا
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` آن‌ها را تغییر دهید. گردش‌کارهای
GitHub معمولاً هر دو را تغییر می‌دهند (برای نمونه `--class standard` و ورودی انتخاب
ارائه‌دهنده `aws`/`hetzner` در گردش‌کار Slack). اگر یک ارائه‌دهنده بیش‌ازحد کند یا
دردسترس‌نبود، به‌جای کدنویسی مستقیم یک مسیر جایگزین، آن را پشت همان رابط Crabbox اضافه کنید.

خط مبنای ماشین مجازی: لینوکس با Chrome/Chromium دارای قابلیت دسکتاپ، دسترسی CDP، VNC/
noVNC، نسخه Node 22+ و pnpm، یک نسخه کاری OpenClaw و دسترسی خروجی به
سامانه انتقال هدف، GitHub، ارائه‌دهندگان مدل و کارگزار اطلاعات محرمانه.

نام اسرار استفاده‌شده در گردش‌کارهای Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری عمومی مصنوعات
- `OPENCLAW_QA_CONVEX_SITE_URL`، `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (گردش‌کارها همچنین
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` را به‌عنوان مسیر جایگزین می‌پذیرند و
  پیش از فراخوانی Crabbox آن‌ها را به نام‌های ساده نگاشت می‌کنند)
- `MANTIS_GITHUB_APP_ID`، `MANTIS_GITHUB_APP_PRIVATE_KEY`

اجراکننده Mantis هرگز نباید توکن‌های بات Discord/Slack/Telegram،
کلیدهای API ارائه‌دهنده، کوکی‌های مرورگر، محتوای نمایه احراز هویت، گذرواژه‌های VNC یا
داده خام اطلاعات محرمانه را چاپ کند. اگر توکنی در یک مسئله، PR، گفت‌وگو یا گزارش فاش شد،
پس از ذخیره راز جایگزین، آن را تعویض کنید.

## نتایج اجرا

سناریوهای پیش/پس سامانه انتقال این نتایج را از هم متمایز می‌کنند تا یک
محیط ناپایدار به‌عنوان پس‌رفت محصول برداشت نشود:

- **بازتولید اشکال**: خط مبنا به همان روشی که سناریو انتظار دارد شکست خورد.
- **شکست چارچوب آزمایش**: راه‌اندازی محیط، اطلاعات محرمانه، API سامانه انتقال، مرورگر
  یا ارائه‌دهنده پیش از معنادار شدن معیار ارزیابی شکست خورد.

اثبات مرورگر فقط برای نامزد گزارش می‌دهد که آیا نامزد از آزمون‌های Gateway شبیه‌سازی‌شده
و رابط کاربری قابل مشاهده عبور کرده است؛ ادعایی درباره بازتولید در خط مبنا ندارد.

## افزودن سناریو

سناریوهای زنده سامانه انتقال برای هر سامانه با TypeScript تعریف می‌شوند (برای
ساختار پیش/پس Discord به `MANTIS_SCENARIO_CONFIGS` در `extensions/qa-lab/src/mantis/run.runtime.ts`
مراجعه کنید)، نه با یک قالب فایل اعلانی مستقل.
هر سناریو به این موارد نیاز دارد: شناسه و عنوان، سامانه انتقال، اطلاعات محرمانه لازم، سیاست مرجع
خط مبنا، سیاست مرجع نامزد، وصله پیکربندی OpenClaw، مراحل راه‌اندازی/تحریک،
معیار مورد انتظار خط مبنا و نامزد، اهداف ثبت بصری، بودجه
مهلت زمانی و مراحل پاک‌سازی.

اثبات مرورگری متمرکز و مختص کاندیدا می‌تواند از یک آزمون E2E قطعی و گردش‌کار اختصاصی استفاده کند. دامنهٔ آن را صریح نگه دارید، ارجاع کاندیدا را پیش از اجرا اعتبارسنجی کنید، انتشار متکی به رازها را ایزوله کنید و همان قرارداد مانیفست شواهد را تولید کنید.

اوراکل‌های کوچک و نوع‌دار را به بررسی‌های بصری ترجیح دهید: وضعیت واکنش Discord یا ارجاعات پیام، وضعیت API واکنش/`ts` رشتهٔ Slack، و شناسه‌ها و سرآیندهای پیام ایمیل. هنگامی از تصاویر صفحهٔ مرورگر استفاده کنید که رابط کاربری تنها مشاهده‌پذیر قابل‌اعتماد است، و هرجا اوراکل API پلتفرم وجود دارد، بررسی‌های بصری را به‌صورت افزوده در کنار آن نگه دارید.

پس از Discord، Slack و Telegram، همین ساختار اجراگر به WhatsApp (ورود با QR، شناسایی مجدد، تحویل، رسانه و واکنش‌ها) و Matrix (اتاق‌های رمزگذاری‌شده، روابط رشته/پاسخ و ازسرگیری پس از راه‌اندازی مجدد) نیز گسترش می‌یابد؛ هنوز هیچ‌یک پیاده‌سازی نشده‌اند.

## پرسش‌های باز

- هنگامی که ربات فعلی Mantis دوباره استفاده می‌شود، کدام ربات Discord باید راه‌انداز باشد و کدام‌یک سامانهٔ تحت آزمون؟
- GitHub باید مصنوعات Mantis مربوط به PRها را چه مدت نگه دارد؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای فرمان نگه‌دارنده، یک سناریوی Mantis را به‌طور خودکار توصیه کند؟
- آیا تصاویر صفحه باید پیش از بارگذاری برای PRهای عمومی محو یا برش داده شوند؟
