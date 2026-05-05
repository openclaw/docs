---
read_when:
    - درک نحوهٔ هماهنگی اجزای پشتهٔ QA
    - گسترش qa-lab، qa-channel، یا یک آداپتور انتقال
    - افزودن سناریوهای QA مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت واقع‌گرایانه‌تر پیرامون داشبورد Gateway
summary: 'نمای کلی پشته QA: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-05T01:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشتهٔ خصوصی QA برای اجرای OpenClaw به شکلی واقعی‌تر و
کانال‌محورتر از آنچه یک آزمون واحد می‌تواند پوشش دهد طراحی شده است.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام‌رسانی مصنوعی با سطوح پیام مستقیم، کانال، رشته،
  واکنش، ویرایش و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهدهٔ رونوشت،
  تزریق پیام‌های ورودی و صادر کردن گزارش Markdown.
- `extensions/qa-matrix` و Pluginهای اجرایی آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های اولیهٔ مبتنی بر مخزن برای وظیفهٔ آغازین و سناریوهای
  پایهٔ QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زندهٔ قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، نماگرفت‌های مرورگر، وضعیت VM و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو فرم پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA داخلی؛ یک گزارش Markdown می‌نویسد.                                                                                                                                                      |
| `qa suite`                                          | سناریوهای مبتنی بر مخزن را روی مسیر QA Gateway اجرا می‌کند. نام مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف.                                                  |
| `qa coverage`                                       | موجودی پوشش سناریو را در قالب markdown چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                     |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری عاملی را می‌نویسد.                                                                                                                   |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                            |
| `qa manual`                                         | یک prompt تک‌مرحله‌ای را روی مسیر provider/model انتخاب‌شده اجرا می‌کند.                                                                                                                            |
| `qa ui`                                             | رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                          |
| `qa docker-build-image`                             | ایمیج Docker از پیش آماده‌شدهٔ QA را می‌سازد.                                                                                                                                                       |
| `qa docker-scaffold`                                | یک داربست docker-compose برای داشبورد QA و مسیر Gateway می‌نویسد.                                                                                                                                    |
| `qa up`                                             | سایت QA را می‌سازد، پشتهٔ مبتنی بر Docker را شروع می‌کند و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونهٔ `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند). |
| `qa aimock`                                         | فقط سرور provider مربوط به AIMock را شروع می‌کند.                                                                                                                                                   |
| `qa mock-openai`                                    | فقط سرور provider سناریوآگاه `mock-openai` را شروع می‌کند.                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن مشترک اعتبارنامه‌های Convex را مدیریت می‌کند.                                                                                                                                                  |
| `qa matrix`                                         | مسیر انتقال زنده روی یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریکس](/fa/concepts/qa-matrix) را ببینید.                                                                                                |
| `qa telegram`                                       | مسیر انتقال زنده روی یک گروه خصوصی واقعی Telegram.                                                                                                                                                 |
| `qa discord`                                        | مسیر انتقال زنده روی یک کانال صنف خصوصی واقعی Discord.                                                                                                                                             |
| `qa slack`                                          | مسیر انتقال زنده روی یک کانال خصوصی واقعی Slack.                                                                                                                                                   |
| `qa mantis`                                         | اجراکنندهٔ راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox و smoke مربوط به Slack در VNC. [Mantis](/fa/concepts/mantis) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (رابط کاربری کنترل) همراه با عامل.
- راست: QA Lab، که رونوشت شبیه Slack و طرح سناریو را نشان می‌دهد.

آن را با این دستور اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، مسیر Gateway مبتنی بر Docker را شروع می‌کند و صفحهٔ
QA Lab را در دسترس قرار می‌دهد؛ جایی که اپراتور یا حلقهٔ خودکارسازی می‌تواند به عامل یک مأموریت QA بدهد،
رفتار واقعی کانال را مشاهده کند و ثبت کند چه چیزی کار کرد، شکست خورد یا
مسدود ماند.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون ساخت دوبارهٔ ایمیج Docker در هر بار،
پشته را با یک بستهٔ QA Lab متصل‌شده با bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک ایمیج از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را با bind mount داخل کانتینر `qa-lab` متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی هش دارایی QA Lab
تغییر کند به‌طور خودکار بازبارگذاری می‌شود.

برای یک smoke محلی ردگیری OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک گیرندهٔ محلی ردگیری OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس
spanهای protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را بررسی می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled` و `openclaw.message.delivery` باید وجود داشته باشند؛
فراخوانی‌های مدل نباید در نوبت‌های موفق `StreamAbandoned` صادر کنند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید بیرون از ردگیری بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار دارایی‌های مجموعهٔ QA می‌نویسد.

QA مشاهده‌پذیری فقط برای checkout کد منبع می‌ماند. بستهٔ npm tarball عمداً
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر ابزارگذاری تشخیصی،
از یک checkout ساخته‌شدهٔ کد منبع، `pnpm qa:otel:smoke` را اجرا کنید.

برای یک مسیر smoke ماتریکس با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، متغیرهای محیطی و چیدمان artifact برای این مسیر در [QA ماتریکس](/fa/concepts/qa-matrix) آمده است. در یک نگاه: این مسیر یک homeserver یک‌بارمصرف Tuwunel را در Docker provision می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA که به همان انتقال محدود شده است اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصهٔ JSON، artifact رویدادهای مشاهده‌شده و گزارش خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای مسیرهای smoke انتقال واقعی Telegram، Discord و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

آن‌ها یک کانال واقعی از پیش موجود را با دو ربات (driver + SUT) هدف می‌گیرند. متغیرهای محیطی لازم، فهرست سناریوها، artifactهای خروجی و مخزن اعتبارنامهٔ Convex در [مرجع QA برای Telegram، Discord و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای اجرای کامل VM دسکتاپ Slack همراه با نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ/مرورگر Crabbox را اجاره می‌کند، مسیر زندهٔ Slack را
داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، از دسکتاپ تصویر می‌گیرد و
`slack-qa/` به‌همراه `slack-desktop-smoke.png` را به دایرکتوری artifact مربوط به Mantis
کپی می‌کند. پس از ورود دستی به Slack Web از طریق VNC، از `--lease-id <cbx_...>` دوباره استفاده کنید.
با `--gateway-setup`، Mantis یک Gateway پایدار OpenClaw برای Slack را
داخل VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان مسیر معمول QA ربات‌به‌ربات Slack را اجرا می‌کند و پس از گرفتن artifact خارج می‌شود.

پیش از استفاده از اعتبارنامه‌های زندهٔ تجمیع‌شده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند و وقتی secret نگه‌دارنده حاضر باشد دسترس‌پذیری admin/list را تأیید می‌کند. برای secretها فقط وضعیت تنظیم‌شده/غایب را گزارش می‌دهد.

## پوشش انتقال زنده

مسیرهای انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعهٔ گستردهٔ رفتار محصول به‌صورت مصنوعی است و بخشی از ماتریس پوشش انتقال زنده نیست.

| مسیر     | قناری | دروازه‌بانی منشن | ربات‌به‌ربات | مسدودسازی فهرست مجاز | پاسخ سطح بالا | ازسرگیری پس از راه‌اندازی مجدد | پیگیری رشته | جداسازی رشته | مشاهدهٔ واکنش | فرمان راهنما | ثبت فرمان بومی |
| -------- | ------ | ---------------- | ------------ | --------------------- | -------------- | ------------------------------- | ------------ | ------------- | -------------- | ------------ | ------------- |
| Matrix   | x      | x                | x            | x                     | x              | x                               | x            | x             | x              |              |               |
| Telegram | x      | x                | x            |                       |                |                                 |              |               |                | x            |               |
| Discord  | x      | x                | x            |                       |                |                                 |              |               |                |              | x             |
| Slack    | x      | x                | x            |                       |                |                                 |              |               |                |              |               |

این کار `qa-channel` را به‌عنوان مجموعهٔ گستردهٔ رفتار محصول نگه می‌دارد، در حالی که Matrix،
Telegram و انتقال‌های زندهٔ آینده یک چک‌لیست صریح قرارداد انتقال مشترک دارند.

برای یک مسیر VM لینوکسی یک‌بارمصرف بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این فرمان یک مهمان تازه‌ی Multipass را بوت می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و
خلاصه‌ی معمول QA را به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این فرمان همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد دوباره استفاده می‌کند.
اجرای مجموعه روی میزبان و Multipass به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی
با کارگرهای Gateway ایزوله اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض هم‌زمانی
4 دارد، که با تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای تنظیم تعداد
کارگرها از `--concurrency <count>` استفاده کنید، یا برای اجرای ترتیبی از `--concurrency 1` استفاده کنید.
وقتی هر سناریویی شکست بخورد، فرمان با کد غیرصفر خارج می‌شود. وقتی
مصنوعات را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای
مهمان عملی هستند ارسال می‌کنند: کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و
`CODEX_HOME` در صورت وجود. `--output-dir` را زیر ریشه‌ی repo نگه دارید تا مهمان
بتواند از طریق فضای کاری mount‌شده دوباره بنویسد.

## مرجع QA برای Telegram، Discord و Slack

Matrix به‌دلیل تعداد سناریوهایش و آماده‌سازی homeserver مبتنی بر Docker یک [صفحه‌ی اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord و Slack کوچک‌تر هستند — هرکدام چند سناریو، بدون سیستم پروفایل، در برابر کانال‌های واقعی از قبل موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                 | پیش‌فرض                                                        | توضیح                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                              | فقط همین سناریو را اجرا می‌کند. قابل تکرار است.                                                                        |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | جایی که گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی نوشته می‌شوند. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`                 | `process.cwd()`                                                | ریشه‌ی مخزن هنگام فراخوانی از یک cwd خنثی.                                                                             |
| `--sut-account <id>`                 | `sut`                                                          | شناسه‌ی حساب موقت داخل پیکربندی Gateway QA.                                                                            |
| `--provider-mode <mode>`             | `live-frontier`                                                | `mock-openai` یا `live-frontier` (`live-openai` قدیمی همچنان کار می‌کند).                                              |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                           | ارجاع‌های مدل اصلی/جایگزین.                                                                                            |
| `--fast`                             | خاموش                                                          | حالت سریع ارائه‌دهنده، در صورت پشتیبانی.                                                                               |
| `--credential-source <env\|convex>`  | `env`                                                          | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                         |
| `--credential-role <maintainer\|ci>` | در CI مقدار `ci`، در غیر این صورت `maintainer`                 | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                            |

هر مسیر در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` مصنوعات را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو ربات متمایز هدف می‌گیرد (driver + SUT). ربات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده‌ی ربات به ربات وقتی هر دو ربات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند بهترین عملکرد را دارد.

env ضروری هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه‌ی عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه‌ی پیام‌ها را در مصنوعات پیام‌های مشاهده‌شده نگه می‌دارد (پیش‌فرض آن‌ها را redact می‌کند).

سناریوها (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

مصنوعات خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — شامل RTT هر پاسخ (ارسال driver → پاسخ مشاهده‌شده‌ی SUT) از canary به بعد.
- `telegram-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو ربات هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده‌ی Discord شروع می‌شود. مدیریت mention کانال، اینکه ربات SUT فرمان بومی `/help` را در Discord ثبت کرده باشد، و سناریوهای شواهد Mantis مبتنی بر opt-in را بررسی می‌کند.

env ضروری هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با شناسه‌ی کاربر ربات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت مسیر سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه‌ی پیام‌ها را در مصنوعات پیام‌های مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سناریوی Mantis مبتنی بر opt-in. به‌تنهایی اجرا می‌شود چون SUT را به پاسخ‌های guild همیشه‌روشن و فقط ابزار با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک timeline واکنش REST به‌همراه یک مصنوع دیداری HTML/PNG را ضبط می‌کند.

سناریوی واکنش وضعیت Mantis را صریح اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

مصنوعات خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی واکنش وضعیت اجرا شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو ربات متمایز هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده‌ی Slack شروع می‌شود.

env ضروری هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه‌ی پیام‌ها را در مصنوعات پیام‌های مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

مصنوعات خروجی:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

#### راه‌اندازی فضای کاری Slack

این مسیر به دو برنامه‌ی Slack متمایز در یک فضای کاری نیاز دارد، به‌علاوه‌ی کانالی که هر دو ربات عضو آن باشند:

- `channelId` — شناسه‌ی `Cxxxxxxxxxx` کانالی که هر دو ربات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این مسیر در هر اجرا پیام ارسال می‌کند.
- `driverBotToken` — توکن ربات (`xoxb-...`) برنامه‌ی **Driver**.
- `sutBotToken` — توکن ربات (`xoxb-...`) برنامه‌ی **SUT**، که باید یک برنامه‌ی Slack جدا از driver باشد تا شناسه‌ی کاربر ربات آن متمایز باشد.
- `sutAppToken` — توکن سطح برنامه (`xapp-...`) برنامه‌ی SUT با `connections:write`، که توسط Socket Mode استفاده می‌شود تا برنامه‌ی SUT بتواند رویدادها را دریافت کند.

یک فضای کاری Slack اختصاصی برای QA را به استفاده‌ی دوباره از یک فضای کاری production ترجیح دهید.

manifest زیر برای SUT نصب production مربوط به Plugin بسته‌بندی‌شده‌ی Slack را منعکس می‌کند (`extensions/slack/src/setup-shared.ts:10`). برای راه‌اندازی کانال production همان‌طور که کاربران آن را می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت Driver/SUT مربوط به QA عمداً جداست چون این مسیر به دو شناسه‌ی کاربر ربات متمایز در یک فضای کاری نیاز دارد.

**1. برنامه‌ی Driver را ایجاد کنید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _Create New App_ → _From a manifest_ → فضای کاری QA را انتخاب کنید، manifest زیر را بچسبانید، سپس _Install to Workspace_ را بزنید:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید — این مقدار `driverBotToken` می‌شود. driver فقط باید پیام ارسال کند و خودش را شناسایی کند؛ بدون رویداد و بدون Socket Mode.

**2. برنامه‌ی SUT را ایجاد کنید**

_Create New App → From a manifest_ را در همان فضای کاری تکرار کنید. مجموعه‌ی scope نصب production مربوط به Plugin بسته‌بندی‌شده‌ی Slack را منعکس می‌کند (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

بعد از اینکه Slack برنامه را ایجاد کرد، دو کار را در صفحه‌ی تنظیمات آن انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این مقدار `sutBotToken` می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope‏ `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار `sutAppToken` می‌شود.

با فراخوانی `auth.test` روی هر توکن، بررسی کنید که دو بات شناسه‌های کاربری متمایز داشته باشند. runtime درایور و SUT را با شناسهٔ کاربری از هم تشخیص می‌دهد؛ استفادهٔ دوباره از یک app برای هر دو، gating منشن را بلافاصله با شکست مواجه می‌کند.

**3. کانال را ایجاد کنید**

در فضای کاری QA، یک کانال ایجاد کنید (مثلاً `#openclaw-qa`) و هر دو بات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسهٔ `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید؛ این مقدار به `channelId` تبدیل می‌شود. کانال عمومی کار می‌کند؛ اگر از کانال خصوصی استفاده کنید، هر دو app از قبل `groups:history` دارند، پس خواندن‌های history در harness همچنان موفق خواهند بود.

**4. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای اشکال‌زدایی روی یک ماشین از env varها استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس دهید)، یا مخزن مشترک Convex را seed کنید تا CI و سایر نگه‌دارندگان بتوانند آن‌ها را lease کنند.

برای مخزن Convex، چهار فیلد را در یک فایل JSON بنویسید:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

در حالی که `OPENCLAW_QA_CONVEX_SITE_URL` و `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` در shell شما export شده‌اند، ثبت و بررسی کنید:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

انتظار داشته باشید `count: 1`، `status: "active"` و بدون فیلد `lease` باشد.

**5. انتها به انتها بررسی کنید**

lane را به‌صورت محلی اجرا کنید تا تأیید شود هر دو بات می‌توانند از طریق broker با هم صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` هر دو `slack-canary` و `slack-mention-gating` را با وضعیت `pass` نشان می‌دهد. اگر lane حدود ۹۰ ثانیه متوقف بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا مخزن خالی است یا هر ردیف lease شده است؛ `qa credentials list --kind slack --status all --json` به شما می‌گوید کدام مورد است.

### مخزن اعتبارنامهٔ Convex

laneهای Telegram، Discord و Slack می‌توانند به‌جای خواندن env varهای بالا، اعتبارنامه‌ها را از یک مخزن مشترک Convex lease کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease اختصاصی می‌گیرد، در طول اجرا برای آن heartbeat می‌فرستد، و هنگام shutdown آن را آزاد می‌کند. kindهای مخزن `"telegram"`، `"discord"` و `"slack"` هستند.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک رشتهٔ chat-id عددی باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` باید با `^[A-Z][A-Z0-9]+$` مطابقت داشته باشد (یک شناسهٔ Slack مانند `Cxxxxxxxxxx`). برای provision کردن app و scopeها، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

env varهای عملیاتی و قرارداد endpoint broker در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش مربوط به قبل از پشتیبانی Discord است؛ معناشناسی broker برای هر دو kind یکسان است).

## seedهای پشتیبانی‌شده با repo

assetهای seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمداً در git هستند تا طرح QA هم برای انسان‌ها و هم برای agent قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی markdown باقی بماند. هر فایل markdown سناریو منبع حقیقت برای یک اجرای test است و باید این موارد را تعریف کند:

- metadata سناریو
- metadata اختیاری category، capability، lane و risk
- ارجاع‌های docs و code
- نیازمندی‌های اختیاری Plugin
- patch اختیاری config Gateway
- `qa-flow` قابل اجرا

سطح runtime قابل استفادهٔ مجدد که از `qa-flow` پشتیبانی می‌کند، مجاز است عمومی و cross-cutting باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را با helperهای سمت browser ترکیب کنند که Control UI توکار را از طریق seam ‏`browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner ویژه اضافه شود.

فایل‌های سناریو باید به‌جای پوشهٔ source tree بر اساس قابلیت محصول گروه‌بندی شوند. وقتی فایل‌ها جابه‌جا می‌شوند، شناسه‌های سناریو را پایدار نگه دارید؛ برای قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید به‌اندازه‌ای گسترده بماند که این موارد را پوشش دهد:

- گفت‌وگوی DM و کانال
- رفتار thread
- چرخهٔ حیات action پیام
- callbackهای cron
- یادآوری memory
- تعویض model
- تحویل به subagent
- خواندن repo و خواندن docs
- یک task کوچک build مانند Lobster Invaders

## laneهای mock provider

`qa suite` دو lane محلی mock provider دارد:

- `mock-openai`، mock سناریوآگاه OpenClaw است. این lane همچنان lane پیش‌فرض mock قطعی برای QA پشتیبانی‌شده با repo و gateهای parity است.
- `aimock` یک server provider پشتیبانی‌شده با AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos شروع می‌کند. این مورد افزایشی است و dispatcher سناریوی `mock-openai` را جایگزین نمی‌کند.

پیاده‌سازی provider-lane زیر `extensions/qa-lab/src/providers/` قرار دارد. هر provider مالک defaultهای خود، startup سرور محلی، config مدل Gateway، نیازهای staging مربوط به auth-profile و flagهای capability زنده/mock است. کد مشترک suite و gateway باید به‌جای branch زدن بر اساس نام provider، از طریق registry provider مسیریابی کند.

## adapterهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای QA markdown است. `qa-channel` اولین adapter روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا synthetic آینده باید به‌جای افزودن runner مخصوص QA برای transport، به همان runner suite متصل شوند.

در سطح معماری، تقسیم‌بندی چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌روندی worker، نوشتن artifact و گزارش‌دهی است.
- adapter transport مالک config Gateway، readiness، مشاهدهٔ inbound و outbound، actionهای transport و state نرمال‌شدهٔ transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای test را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفادهٔ مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سیستم QA markdown دقیقاً به دو چیز نیاز دارد:

1. یک adapter transport برای کانال.
2. یک بستهٔ سناریو که قرارداد کانال را exercise کند.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، root command سطح‌بالای جدید QA اضافه نکنید.

`qa-lab` مالک مکانیک‌های host مشترک است:

- root command ‏`openclaw qa`
- startup و teardown مجموعه
- هم‌روندی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Runner Pluginها مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه Gateway چگونه برای آن transport پیکربندی می‌شود
- اینکه readiness چگونه بررسی می‌شود
- اینکه eventهای inbound چگونه تزریق می‌شوند
- اینکه پیام‌های outbound چگونه مشاهده می‌شوند
- اینکه transcriptها و state نرمال‌شدهٔ transport چگونه expose می‌شوند
- اینکه actionهای پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص transport چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک root مشترک `qa` نگه دارید.
2. runner transport را روی seam host مشترک `qa-lab` پیاده‌سازی کنید.
3. مکانیک‌های مخصوص transport را داخل runner Plugin یا harness کانال نگه دارید.
4. runner را به‌عنوان `openclaw qa <runner>` mount کنید، نه با ثبت یک root command رقیب. Runner Pluginها باید `qaRunners` را در `openclaw.plugin.json` declare کنند و array متناظر `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy CLI و runner باید پشت entrypointهای جدا بماند.
5. سناریوهای markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک migration عمدی باشد.

قاعدهٔ تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک transport کانال وابسته است، آن را در runner Plugin یا harness Plugin همان نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای branch مخصوص کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک transport معنادار است، سناریو را مخصوص همان transport نگه دارید و این را در قرارداد سناریو صریح کنید.

### نام‌های helper سناریو

helperهای عمومی ترجیحی برای سناریوهای جدید:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نگارش سناریوهای جدید باید از نام‌های عمومی استفاده کند. aliasها برای اجتناب از migration یک‌باره وجود دارند، نه به‌عنوان الگوی آینده.

## گزارش‌دهی

`qa-lab` یک گزارش protocol به Markdown از timeline مشاهده‌شدهٔ bus export می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی همچنان blocked ماند
- چه سناریوهای follow-up ارزش افزودن دارند

برای موجودی سناریوهای در دسترس — که هنگام اندازه‌گیری کار follow-up یا اتصال یک transport جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی machine-readable، `--json` را اضافه کنید).

برای بررسی‌های character و style، همان سناریو را روی چندین ref مدل زنده اجرا کنید و یک گزارش Markdown داوری‌شده بنویسید:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

این فرمان فرایندهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی کاراکتر باید پرسونا را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های عادی کاربر مانند چت، کمک درباره فضای کاری، و کارهای کوچک روی فایل‌ها را اجرا کنند. به مدل نامزد نباید گفته شود که در حال ارزیابی شدن است. این فرمان هر رونوشت کامل را حفظ می‌کند، آمار پایه اجرای آن را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع و با استدلال `xhigh` در مواردی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی بودن، حس‌وحال، و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسه ارائه‌دهندگان از `--blind-judge-models` استفاده کنید: پرامپت داور همچنان هر رونوشت و وضعیت اجرا را دریافت می‌کند، اما ارجاع‌های نامزد با برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از تجزیه، رتبه‌بندی‌ها را دوباره به ارجاع‌های واقعی نگاشت می‌کند.
اجراهای نامزد به‌طور پیش‌فرض از تفکر `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh` برای ارجاع‌های ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. برای بازنویسی یک نامزد مشخص به‌صورت درون‌خطی از `--model provider/model,thinking=<level>` استفاده کنید. `--thinking <level>` همچنان یک fallback سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای سازگاری حفظ شده است.
ارجاع‌های نامزد OpenAI به‌طور پیش‌فرض روی حالت سریع هستند تا در مواردی که ارائه‌دهنده پشتیبانی می‌کند از پردازش اولویتی استفاده شود. وقتی یک نامزد یا داور منفرد به بازنویسی نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط زمانی `--fast` را ارسال کنید که می‌خواهید حالت سریع را برای هر مدل نامزد اجباراً فعال کنید. مدت‌زمان‌های نامزد و داور در گزارش برای تحلیل معیار ثبت می‌شوند، اما پرامپت‌های داور صراحتاً می‌گویند که بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل نامزد و داور هر دو به‌طور پیش‌فرض از هم‌روندی 16 استفاده می‌کنند. وقتی محدودیت‌های ارائه‌دهنده یا فشار Gateway محلی باعث می‌شود یک اجرا بیش از حد پرنویز شود، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` نامزدی ارسال نشود، ارزیابی کاراکتر به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` ارسال نشده باشد.
وقتی هیچ `--judge-model` ارسال نشود، داورها به‌طور پیش‌فرض از
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` استفاده می‌کنند.

## مستندات مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
