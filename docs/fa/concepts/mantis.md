---
read_when:
    - ساخت یا اجرای کنترل کیفیت بصری زنده برای باگ‌های OpenClaw
    - افزودن اعتبارسنجی پیش و پس از یک درخواست ادغام
    - افزودن سناریوهای انتقال زنده برای Discord، Slack، WhatsApp یا سایر سرویس‌ها
    - اجرای اثبات متمرکز مرورگری رابط کاربری کنترل برای یک مرجع کاندیدا
    - اشکال‌زدایی اجرای آزمون‌های تضمین کیفیت که به نماگرفت، خودکارسازی مرورگر یا دسترسی VNC نیاز دارند
summary: Mantis شواهد بصری سرتاسری را برای مقایسه‌های زندهٔ انتقال و اثبات‌های متمرکز مرورگر که فقط مختص گزینهٔ کاندید هستند ثبت می‌کند، سپس مصنوعات را به PRها پیوست می‌کند.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T15:55:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis شواهد بصری CI و یک نظر PR برای رفتار OpenClaw منتشر می‌کند.
سناریوهای انتقال زنده، یک خط مبنای شناخته‌شده و معیوب را با یک ref نامزد مقایسه می‌کنند؛
مسیرهای متمرکز مرورگر ممکن است در عوض یک نامزد را در برابر یک انتقال شبیه‌سازی‌شده
قطعی اثبات کنند. Discord نخست با احراز هویت واقعی ربات، کانال‌های guild،
واکنش‌ها، رشته‌ها و یک شاهد مرورگر عرضه شد. مسیرهای Slack، Telegram و چت متمرکز Control
UI نیز وجود دارند؛ WhatsApp و Matrix پیاده‌سازی نشده‌اند.

## مالکیت

- OpenClaw (`extensions/qa-lab/src/mantis/*`): زمان اجرای سناریو، `pnpm openclaw qa mantis <command>` CLI، شِمای شواهد.
- آزمایشگاه QA (`extensions/qa-lab/src/live-transports/*`): زیرساخت انتقال زنده، ربات‌های راه‌انداز/SUT، نویسنده‌های گزارش/شواهد.
- Crabbox (`openclaw/crabbox`): ماشین‌های Linux آماده، اجاره‌ها، VNC، `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): نقاط ورود راه‌دور، نگه‌داری مصنوعات.
- ClawSweeper: فرمان‌های PR نگه‌دارنده را تجزیه می‌کند، گردش‌کارها را به‌راه می‌اندازد و نظر نهایی PR را ارسال می‌کند.

## فرمان‌های CLI

همه فرمان‌ها `pnpm openclaw qa mantis <command>` هستند و در
`extensions/qa-lab/src/mantis/cli.ts` تعریف شده‌اند. در زمان ساخت/اجرا به `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
نیاز دارد (گردش‌کارهای همراه پیش از ساخت، `OPENCLAW_BUILD_PRIVATE_QA=1` و
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` را تنظیم می‌کنند).

| فرمان                           | هدف                                                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | بررسی می‌کند که ربات Discord متعلق به Mantis بتواند guild/کانال را ببیند، پیام ارسال کند و واکنش نشان دهد.                                               |
| `run`                           | یک سناریوی قبل/بعد را در برابر refهای خط مبنا و نامزد اجرا می‌کند (فقط Discord).                                                                          |
| `desktop-browser-smoke`         | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، مرورگری قابل‌مشاهده باز می‌کند و نماگرفت + ویدئو ثبت می‌کند.                                     |
| `slack-desktop-smoke`           | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، QA مربوط به Slack را در آن اجرا می‌کند، Slack Web را باز می‌کند و شواهد ثبت می‌کند.              |
| `telegram-desktop-builder`      | یک دسکتاپ Crabbox را اجاره می‌کند/دوباره به‌کار می‌گیرد، Telegram Desktop را نصب می‌کند و در صورت نیاز یک Gateway متعلق به OpenClaw را پیکربندی می‌کند. |
| `visual-task` / `visual-driver` | ثبت عمومی دسکتاپ Crabbox با ادعاهای اختیاری درک تصویر؛ `visual-driver` نیمه راه‌انداز است که زیر `crabbox record --while` اجرا می‌شود. |

همه فرمان‌ها `--repo-root <path>` و `--output-dir <path>` را می‌پذیرند؛ فرمان‌های Crabbox
همچنین `--crabbox-bin`، `--provider`، `--machine-class`/`--class`،
`--lease-id`، `--idle-timeout`، `--ttl` و `--keep-lease` را می‌پذیرند. پیش‌فرض‌های CLI محلی
برای ارائه‌دهنده/کلاس، مگر آنکه خلافش ذکر شود، `hetzner`/`beast` هستند؛ گردش‌کارهای CI
معمولاً هر دو را بازنویسی می‌کنند.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

برای دریافت کاربر ربات، guild، کانال‌های guild و کانال هدف،
Discord REST API (`https://discord.com/api/v10`) را فراخوانی می‌کند، بررسی می‌کند که
کانال متعلق به guild باشد، سپس (مگر با `--skip-post`) پیامی ارسال می‌کند و
یک واکنش `👀` می‌افزاید. `mantis-discord-smoke-summary.json` و
`mantis-discord-smoke-report.md` را می‌نویسد.

ترتیب یافتن توکن: مقدار `--token-file`، سپس `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(بازنویسی با `--token-env`)، سپس فایلی که `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` نام‌گذاری می‌کند
(بازنویسی با `--token-file-env`). شناسه‌های guild/کانال از
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` می‌آیند (بازنویسی با
`--guild-id` / `--channel-id`) و باید Discord snowflakeهای 17-20 رقمی باشند. برای
جایگزینی شناسه‌ها و نام‌های ربات/guild/کانال/پیام با `<redacted>`
در خلاصه و گزارش منتشرشده، `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را تنظیم کنید.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` در حال حاضر فقط `discord` را می‌پذیرد. `--scenario` یکی از دو
شناسه داخلی است که هرکدام ref خط مبنای پیش‌فرض و برچسب‌های مورد انتظار قبل/بعد
خاص خود را دارند (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| سناریو                                     | خط مبنای پیش‌فرض                           | انتظار خط مبنا                           | انتظار نامزد                   |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | پاسخ رشته پیوست `filePath` را حذف می‌کند | پاسخ رشته آن را شامل می‌شود     |

پیش‌فرض `--candidate` برابر `HEAD` است. پرچم‌های دیگر: `--credential-source`
(پیش‌فرض `convex`)، `--credential-role` (پیش‌فرض `ci`)، `--provider-mode`
(پیش‌فرض `live-frontier`)، `--fast` (به‌طور پیش‌فرض روشن)، `--skip-install`، `--skip-build`.

اجراکننده، checkoutهای جداشده `git worktree` را برای خط مبنا و
نامزد زیر `<output-dir>/worktrees/` ایجاد می‌کند، در هرکدام
`pnpm install`/`pnpm build` را اجرا می‌کند (مگر آنکه رد شوند)، سپس
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
را در برابر هر worktree اجرا می‌کند. هر مسیر `discord-qa-reaction-timelines.json`
را همراه با یک جفت `<scenario-id>-timeline.html`/`.png` می‌نویسد؛ اجراکننده این
شواهد را زیر `baseline/`/`candidate/` کپی می‌کند، `comparison.json`،
`mantis-report.md` و `mantis-evidence.json` را در پوشه خروجی می‌نویسد و
اگر مقایسه موفق نباشد با کد غیرصفر خارج می‌شود (خط مبنا `fail` و نامزد
`pass`).

سناریوی دوم Discord (`discord-thread-reply-filepath-attachment`) با ربات راه‌انداز
یک پیام والد ارسال می‌کند، یک رشته واقعی می‌سازد، کنش `message.thread-reply`
متعلق به SUT را با یک `filePath` محلی مخزن فراخوانی می‌کند، سپس رشته را
برای یافتن پاسخ و نام فایل پیوست بررسی دوره‌ای می‌کند. انتظار دارد پیوستی
با نام `mantis-thread-report.md` وجود داشته باشد.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، داخل نشست VNC
مرورگری را اجرا می‌کند که به `--browser-url` (پیش‌فرض `https://openclaw.ai`) یا یک
`--html-file` رندرشده هدایت می‌شود، منتظر می‌ماند، با `scrot` نماگرفت می‌گیرد، در صورت نیاز با
`ffmpeg` یک MP4 ضبط می‌کند و `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
را با rsync به `--output-dir` بازمی‌گرداند.

پرچم‌ها:

- `--lease-id <cbx_...>` به‌جای ایجاد دسکتاپ جدید، یک دسکتاپ آماده را دوباره به‌کار می‌گیرد.
- `--browser-profile-dir <remote-path>` یک user-data-dir راه‌دور Chrome را دوباره به‌کار می‌گیرد تا یک دسکتاپ پایدار بین اجراها واردشده باقی بماند (برای پروفایل مشاهده‌گر بلندمدت Discord Web استفاده می‌شود).
- `--browser-profile-archive-env <name>` پیش از اجرا، آرشیو پروفایل Chrome با فرمت base64 و نام `.tgz` را از آن متغیر محیطی بازیابی می‌کند (پیش‌فرض `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`)؛ برای شاهدان واردشده مانند Discord Web استفاده می‌شود.
- `--video-duration <seconds>` طول ثبت MP4 را کنترل می‌کند (پیش‌فرض 10s).
- `--keep-lease` (یا `OPENCLAW_MANTIS_KEEP_VM=1`) اجاره‌ای را که این اجرا ایجاد کرده برای بازرسی VNC باز نگه می‌دارد؛ اجراهای ناموفقی که اجاره ایجاد کرده‌اند نیز به‌طور پیش‌فرض آن را نگه می‌دارند.

برای شواهد Discord Web، Mantis از یک حساب مشاهده‌گر اختصاصی استفاده می‌کند، نه
توکن ربات. مرجع Discord REST (از طریق `qa discord`) همچنان معتبر است؛ وقتی
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` تنظیم شده باشد، سناریو یک
مصنوع URL متعلق به Discord Web نیز می‌نویسد و `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
رشته را آن‌قدر باز نگه می‌دارد که مرورگر بتواند آن را باز کند.

گردش‌کار GitHub یک پروفایل مشاهده‌گر پایدار را از طریق
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ترجیح می‌دهد (آرشیوهای کامل پروفایل ممکن است از
محدودیت اندازه secret در GitHub بزرگ‌تر شوند)؛ برای پروفایل‌های کوچک/راه‌اندازی اولیه، در عوض می‌تواند یک
`.tgz` با فرمت base64 را از `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` بازیابی کند. اگر
هیچ‌یک از منابع پیکربندی نشده باشند، گردش‌کار همچنان نماگرفت‌های قطعی
خط مبنا/نامزد را منتشر می‌کند و در گزارش می‌نویسد که شاهد واردشده
رد شده است.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، checkout را با VM همگام می‌کند،
`pnpm openclaw qa slack` را داخل آن اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند،
دسکتاپ را ثبت می‌کند و هم مصنوعات QA مربوط به Slack (`slack-qa/`) و هم
نماگرفت/ویدئوی VNC را به محیط محلی کپی می‌کند. این تنها شکل Mantis است که در آن
Gateway متعلق به SUT و مرورگر هر دو داخل یک VM اجرا می‌شوند.

با `--gateway-setup`، فرمان یک home یک‌بارمصرف و پایدار OpenClaw
در `$HOME/.openclaw-mantis/slack-openclaw` داخل VM ایجاد می‌کند، پیکربندی Slack
Socket Mode را برای کانال هدف اصلاح می‌کند،
`openclaw gateway run --dev --allow-unconfigured --port 38973` را آغاز می‌کند و
Chrome را در نشست VNC در حال اجرا باقی می‌گذارد؛ حذف `--gateway-setup` در عوض مسیر عادی
QA ربات‌به‌ربات Slack را اجرا می‌کند.

متغیرهای محیطی لازم برای `--credential-source env` (پیش‌فرض محلی `env` است؛ پیش‌فرض نقش
`maintainer` است):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` برای مسیر مدل راه‌دور (اگر فقط `OPENAI_API_KEY`
  به‌صورت محلی تنظیم شده باشد، Mantis پیش از
  فراخوانی Crabbox آن را در `OPENCLAW_LIVE_OPENAI_KEY` کپی می‌کند)

با `--credential-source convex`، Mantis پیش از ایجاد VM، اعتبارنامه SUT متعلق به Slack را از
مخزن اشتراکی اجاره می‌کند و شناسه کانال، توکن برنامه و
توکن ربات را به‌صورت متغیرهای محیطی `OPENCLAW_MANTIS_SLACK_*` به VM منتقل می‌کند؛ بنابراین گردش‌کارهای GitHub
فقط به secret کارگزار Convex نیاز دارند، نه توکن‌های خام Slack.

پرچم‌های دیگر: `--slack-url <url>` یک URL مشخص را باز می‌کند (در غیر این صورت Mantis
`https://app.slack.com/client/<team>/<channel>` را از `auth.test` استخراج می‌کند)؛
`--slack-channel-id <id>` کانال فهرست مجاز Gateway را تنظیم می‌کند؛
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` پروفایل پایدار Chrome
داخل VM را کنترل می‌کند (پیش‌فرض `$HOME/.config/openclaw-mantis/slack-chrome-profile`)؛
`--approval-checkpoints` سناریوهای بومی تأیید Slack
(`slack-approval-exec-native`، `slack-approval-plugin-native`) را اجرا می‌کند و
به‌جای راه‌اندازی Gateway، نماگرفت‌های نقاط بازرسی در انتظار/حل‌شده را رندر می‌کند (با
`--gateway-setup` ناسازگار است)؛ `--hydrate-mode source|prehydrated`،
`--provider-mode`، `--model`، `--alt-model` و `--fast` به مسیر زنده
Slack منتقل می‌شوند.

نماگرفت‌های نقاط بازرسی تأیید از پیام Slack API که
سناریو مشاهده کرده رندر می‌شوند، نه رابط کاربری زنده Slack؛ `slack-desktop-smoke.png` فقط زمانی
مدرک Slack Web است که پروفایل مرورگر اجاره از قبل وارد شده باشد.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

یک دسکتاپ Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، Telegram Desktop بومی Linux را نصب می‌کند،
در صورت نیاز آرشیو نشست کاربر را بازیابی می‌کند، OpenClaw را با
توکن اجاره‌شده ربات SUT متعلق به Telegram پیکربندی می‌کند،
`openclaw gateway run --dev --allow-unconfigured --port 38974` را آغاز می‌کند، یک
پیام آمادگی ربات راه‌انداز به گروه خصوصی اجاره‌شده ارسال می‌کند، سپس
یک نماگرفت و MP4 ثبت می‌کند. توکن ربات فقط OpenClaw را پیکربندی می‌کند؛ هرگز
Telegram Desktop را وارد حساب نمی‌کند. مشاهده‌گر دسکتاپ یک نشست کاربری جداگانه Telegram است
که از `--telegram-profile-archive-env <name>` بازیابی می‌شود یا به‌صورت دستی
از طریق VNC وارد می‌شود و با `--keep-lease` زنده نگه داشته می‌شود.

پرچم‌ها: `--lease-id <cbx_...>` اجرا را در برابر VMای که از قبل به
Telegram Desktop وارد شده تکرار می‌کند؛ `--telegram-profile-archive-env <name>` پیش از اجرا یک آرشیو پروفایل
`.tgz` با فرمت base64 را بازیابی می‌کند؛ `--telegram-profile-dir <remote-path>`
پوشه پروفایل راه‌دور را تنظیم می‌کند (پیش‌فرض `$HOME/.local/share/TelegramDesktop`)؛
`--no-gateway-setup` فقط Telegram Desktop را نصب و باز می‌کند؛
`--credential-source`/`--credential-role` به‌طور پیش‌فرض `convex`/`maintainer` هستند.

## مانیفست شواهد

هر سناریویی که در یک PR منتشر می‌شود، `mantis-evidence.json` را در کنار
گزارش خود می‌نویسد:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "کنترل کیفیت واکنش‌های وضعیت Discord در Mantis",
  "summary": "خلاصهٔ ابتدایی خوانا برای انسان جهت درج در نظر PR.",
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
      "label": "خط مبنای فقط در صف",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "خط زمانی خط مبنای Discord",
      "width": 420
    }
  ]
}
```

مصنوع `path` نسبت به پوشهٔ مانیفست است؛ `targetPath`
نسبت به پیشوند پیکربندی‌شدهٔ مصنوعات R2/S3 است. `scripts/mantis/publish-pr-evidence.mjs`
پیمایش مسیر را رد می‌کند و هنگامی‌که فایل موجود نباشد، ورودی‌های دارای
`"required": false` را نادیده می‌گیرد.

انواع مصنوعات: `timeline` (نماگرفت قطعی قبل/بعد)،
`desktopScreenshot` (نماگرفت VNC/مرورگر)، `motionPreview` (GIF متحرک درون‌خطی
از ضبط)، `motionClip` (MP4 برش‌خورده بر اساس حرکت)، `fullVideo` (ضبط
کامل)، `metadata` (فایل جانبی JSON/گزارش)، `report` (گزارش Markdown).

چیدمان مصنوعات یک اجرا روی دیسک:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

نماگرفت‌ها مدرک هستند، نه راز، اما همچنان به اصول پوشاندن اطلاعات حساس نیاز دارند:
ممکن است نام کانال‌های خصوصی، نام‌های کاربری یا محتوای پیام‌ها ظاهر شوند. برای
بارگذاری عمومی مصنوعات، `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` را تنظیم کنید؛ این گزینه
به‌طور پیش‌فرض در گردش‌کارهای GitHub مربوط به Discord/Slack/Telegram فعال است.

## خودکارسازی GitHub

`scripts/mantis/publish-pr-evidence.mjs` ناشر قابل‌استفادهٔ مجدد است. گردش‌کارها
آن را با مانیفست، PR هدف، ریشهٔ هدف مصنوعات، نشانگر نظر،
نشانی اینترنتی مصنوعات، نشانی اینترنتی اجرا و منبع درخواست فراخوانی می‌کنند. این ناشر مصنوعات اعلام‌شده را در
سطل R2 مربوط به Mantis بارگذاری می‌کند، یک نظر PR با تقدم خلاصه و شامل
تصاویر/پیش‌نمایش‌های درون‌خطی و ویدئوهای پیوندشده می‌سازد، سپس نظر نشانگردار موجود را به‌روزرسانی
می‌کند یا نظر جدیدی می‌سازد. متغیرهای محیطی الزامی:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (گردش‌کارها `openclaw-crabbox-artifacts` را تنظیم می‌کنند)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (گردش‌کارها `auto` را تنظیم می‌کنند)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (گردش‌کارها `https://artifacts.openclaw.ai` را تنظیم می‌کنند)

نظرها از طریق برنامهٔ GitHub مربوط به Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) ارسال می‌شوند، نه `github-actions[bot]`، و یک
نظر نشانگر پنهان به‌عنوان کلید درج یا به‌روزرسانی استفاده می‌شود.

| گردش‌کار                          | محرک                                                                                    | کاری که انجام می‌دهد                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | اجرای دستی                                                                            | `discord-smoke` را روی یک مرجع انتخابی اجرا می‌کند.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | نظر PR یا اجرای دستی                                                              | درخت‌های کاری جداگانه برای خط مبنا/نامزد می‌سازد، `discord-status-reactions-tool-only` را روی هرکدام اجرا می‌کند، خط زمانی هر مسیر را در مرورگر دسکتاپ Crabbox رندر می‌کند، با `crabbox media preview` پیش‌نمایش‌های GIF/MP4 برش‌خورده بر اساس حرکت تولید می‌کند، مصنوعات را بارگذاری می‌کند و مدارک درون‌خطی را در PR درج می‌کند.                                 |
| `Mantis Scenario`                 | اجرای دستی                                                                            | توزیع‌کنندهٔ عمومی: `scenario_id` (`discord-status-reactions-tool-only`، `discord-thread-reply-filepath-attachment`، `slack-desktop-smoke`، `telegram-live`، `telegram-desktop-proof`، `web-ui-chat-proof`)، `baseline_ref`، `candidate_ref` و `pr_number` را می‌گیرد و به گردش‌کار سناریوی متناظر می‌فرستد. |
| `Mantis Slack Desktop Smoke`      | اجرای دستی                                                                            | یک دسکتاپ لینوکس Crabbox اجاره می‌کند (پیش‌فرض `aws`، با امکان انتخاب `hetzner`)، `slack-desktop-smoke --gateway-setup` را روی نامزد اجرا می‌کند، دسکتاپ را ضبط می‌کند، یک پیش‌نمایش حرکتی می‌سازد، مصنوعات را بارگذاری می‌کند و اگر شمارهٔ PR داده شده باشد، مدارک PR را درج می‌کند.                                                      |
| `Mantis Telegram Live`            | نظر PR یا اجرای دستی                                                              | مسیر کنترل کیفیت زندهٔ Telegram مبتنی بر API ربات (`openclaw qa telegram`) را اجرا می‌کند، `mantis-evidence.json` را از خلاصهٔ کنترل کیفیت می‌نویسد، HTML مدارک پوشانده‌شده را از طریق مرورگر دسکتاپ Crabbox رندر می‌کند، یک GIF حرکتی می‌سازد و مدارک را در PR درج می‌کند. ورود به Telegram Web برای این مسیر لازم نیست.                               |
| `Mantis Telegram Desktop Proof`   | برچسب PR نگه‌دارنده (`mantis: telegram-visible-proof`) به‌همراه نظر PR، یا اجرای دستی | اثبات عامل‌محور و بومی قبل/بعد در Telegram Desktop. PR، مراجع خط مبنا/نامزد و دستورالعمل‌های نگه‌دارنده را به Codex می‌دهد؛ Codex مسیر اثبات کاربر واقعی Telegram Desktop در Crabbox را برای هر دو مرجع اجرا می‌کند و یک جدول مدارک دوستونه در PR درج می‌کند.                                                              |
| `Mantis Web UI Chat Proof`        | نظر PR یا اجرای دستی                                                              | اثبات متمرکز چت در رابط کنترل OpenClaw با Playwright را روی نامزد اجرا می‌کند، تأیید می‌کند که مرورگر از طریق Gateway شبیه‌سازی‌شده ارسال را انجام می‌دهد، مصنوعات نماگرفت/ویدئو را ثبت می‌کند و مدارک را در PR درج می‌کند. این مسیر فقط اثبات چت وب است، نه WinUI/برنامهٔ بومی یا اثبات بصری دلخواه.                           |

`Mantis Discord Status Reactions` و `Mantis Telegram Live` هر دو
`baseline_ref`/`candidate_ref` (یا `baseline=`/`candidate=` در نظر PR)
را می‌پذیرند و پیش از اجرا با اعتبارنامه‌های حاوی اطلاعات محرمانه، اعتبارسنجی می‌کنند که SHA حل‌شده یا نیای `origin/main` است، یا یک
برچسب انتشار (`v*`) است، یا سر شاخهٔ یک PR باز است.

محرک‌های نظر از یک PR با دسترسی نوشتن/نگه‌داری/مدیریت:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

محرک‌های نظر Telegram به‌طور پیش‌فرض از SHA سر PR به‌عنوان نامزد و
`telegram-status-command` به‌عنوان سناریو استفاده می‌کنند؛ آن‌ها `provider=aws|hetzner` و
`lease=<cbx_...>` را برای هدف‌گیری یک ارائه‌دهندهٔ مشخص Crabbox یا یک
دسکتاپ ازپیش‌گرم‌شده می‌پذیرند. `Mantis Telegram Desktop Proof` فقط زمانی به نظر PR پاسخ می‌دهد که
PR از قبل دارای برچسب `mantis: telegram-visible-proof` باشد.

محرک‌های نظر چت رابط وب به‌طور پیش‌فرض SHA سر PR را به‌عنوان نامزد در نظر می‌گیرند. آن‌ها
اثبات چت رابط کنترل با Gateway شبیه‌سازی‌شده را اجرا و مصنوعات مرورگر را منتشر می‌کنند؛ برای
دیگر صفحه‌های وب و سطوح برنامهٔ بومی، از اثبات معمول Playwright/مرورگر، نماگرفت‌های
نگه‌دارنده، Crabbox یا مصنوعات محلی استفاده کنید.

ClawSweeper نیز می‌تواند یک سناریو را مستقیماً اجرا کند:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## ماشین‌ها و رازها

پیش‌فرض‌های محلی CLI مربوط به Crabbox عبارت‌اند از `--provider hetzner --class beast`؛ با
`--provider`، `--class`/`--machine-class` یا
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` آن‌ها را بازنویسی کنید. گردش‌کارهای
GitHub معمولاً هر دو را بازنویسی می‌کنند (برای مثال `--class standard` و ورودی انتخاب ارائه‌دهندهٔ
`aws`/`hetzner` در گردش‌کار Slack). اگر ارائه‌دهنده‌ای بیش‌ازحد
کند یا دردسترس‌نباشد، آن را پشت همان رابط Crabbox اضافه کنید، نه اینکه یک
راه بازگشت را به‌صورت ثابت در کد بنویسید.

خط مبنای ماشین مجازی: لینوکس با Chrome/Chromium دارای قابلیت دسکتاپ، دسترسی CDP، VNC/
noVNC، نسخهٔ 22.22.3+، 24.15+ یا 25.9+ از Node و pnpm، یک نسخهٔ بررسی‌شده از OpenClaw و
دسترسی خروجی به بستر انتقال هدف، GitHub، ارائه‌دهندگان مدل و
کارگزار اعتبارنامه.

نام‌های اعتبارنامه و محیط که در فرمان‌ها و گردش‌کارهای Mantis استفاده می‌شوند:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `qa mantis run --credential-source env` محلی همچنین به
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`، `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  و `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` نیاز دارد. گردش‌کارهای GitHub معمولاً به‌جای توکن‌های خام
  ربات Discord از `--credential-source convex` و اعتبارنامه‌های کارگزار زیر استفاده می‌کنند.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` برای بارگذاری عمومی مصنوعات
- `OPENCLAW_QA_CONVEX_SITE_URL`، `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (یا `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY` ویژهٔ
  اثبات Telegram Desktop)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (گردش‌کارها همچنین
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` را به‌عنوان راه بازگشت می‌پذیرند و
  پیش از فراخوانی Crabbox آن‌ها را به نام‌های ساده نگاشت می‌کنند)
- `CRABBOX_ACCESS_CLIENT_ID`، `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`، `MANTIS_GITHUB_APP_PRIVATE_KEY`

اجراکنندهٔ Mantis هرگز نباید توکن‌های ربات Discord/Slack/Telegram،
کلیدهای API ارائه‌دهنده، کوکی‌های مرورگر، محتوای نمایهٔ احراز هویت، گذرواژه‌های VNC یا
بارهای خام اعتبارنامه را چاپ کند. اگر توکنی در یک مسئله، PR، چت یا گزارش فاش شد،
پس از ذخیره‌شدن راز جایگزین، آن را تعویض کنید.

## نتایج اجرا

سناریوهای انتقال قبل/بعد این نتایج را از هم متمایز می‌کنند تا یک محیط
ناپایدار به‌عنوان پس‌رفت محصول تلقی نشود:

- **بازتولید اشکال**: خط مبنا به همان شکلی که سناریو انتظار دارد شکست خورد.
- **شکست چارچوب آزمون**: راه‌اندازی محیط، اعتبارنامه‌ها، API انتقال، مرورگر
  یا ارائه‌دهنده پیش از معنادارشدن ملاک ارزیابی شکست خورد.

اثبات مرورگر فقط برای نامزد گزارش می‌کند که آیا نامزد از بررسی‌های Gateway شبیه‌سازی‌شده
و رابط کاربری قابل‌مشاهده عبور کرده است؛ ادعایی دربارهٔ بازتولید خط مبنا ندارد.

## افزودن یک سناریو

سناریوهای انتقال زنده برای هر انتقال با TypeScript تعریف می‌شوند (برای
شکل قبل/بعد Discord، `MANTIS_SCENARIO_CONFIGS` در `extensions/qa-lab/src/mantis/run.runtime.ts` را ببینید)،
نه با یک قالب فایل اعلانی مستقل.
هر سناریو به این موارد نیاز دارد: شناسه و عنوان، انتقال، اعتبارنامه‌های لازم، سیاست
مرجع خط مبنا، سیاست مرجع نامزد، وصلهٔ پیکربندی OpenClaw، گام‌های راه‌اندازی/تحریک،
ملاک مورد انتظار خط مبنا و نامزد، هدف‌های ثبت بصری، بودجهٔ
زمان‌سنجی و گام‌های پاک‌سازی.

اثبات متمرکز مرورگر فقط برای نامزد می‌تواند از یک آزمون E2E قطعی و اختصاصی
و یک گردش‌کار استفاده کند. دامنهٔ آن را صریح نگه دارید، مرجع نامزد را پیش از
اجرا اعتبارسنجی کنید، انتشار متکی بر راز را ایزوله کنید و همان قرارداد
مانیفست مدارک را تولید کنید.

ملاک‌های ارزیابی کوچک و نوع‌دار را به بررسی‌های بینایی ترجیح دهید: وضعیت واکنش Discord یا
ارجاع‌های پیام، وضعیت API مربوط به `ts`/واکنش رشتهٔ Slack، شناسه‌های پیام ایمیل
و سرآیندها. زمانی از نماگرفت‌های مرورگر استفاده کنید که رابط کاربری تنها مشاهده‌پذیر قابل‌اعتماد باشد،
و هرجا ملاک مبتنی بر API پلتفرم وجود دارد، بررسی‌های بینایی را به‌صورت مکمل آن نگه دارید.

پس از Discord، Slack و Telegram، همین ساختار اجراکننده به WhatsApp
(ورود با QR، شناسایی مجدد، تحویل، رسانه، واکنش‌ها) و Matrix
(اتاق‌های رمزگذاری‌شده، ارتباط‌های رشته/پاسخ، ازسرگیری پس از راه‌اندازی مجدد) گسترش می‌یابد؛ هیچ‌کدام
هنوز پیاده‌سازی نشده‌اند.

## پرسش‌های باز

- هنگام استفادهٔ مجدد از ربات موجود Mantis، کدام ربات Discord باید راه‌انداز باشد و کدام‌یک سامانهٔ تحت آزمون؟
- GitHub باید مصنوعات Mantis مربوط به PRها را چه مدت نگه‌داری کند؟
- ClawSweeper چه زمانی باید به‌جای انتظار برای فرمان نگه‌دارنده، به‌طور خودکار یک سناریوی Mantis را توصیه کند؟
- آیا پیش از بارگذاری اسکرین‌شات‌ها برای PRهای عمومی، باید اطلاعات حساس آن‌ها پوشانده یا تصویر برش داده شود؟
