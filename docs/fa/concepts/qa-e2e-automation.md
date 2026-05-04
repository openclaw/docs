---
read_when:
    - درک نحوهٔ قرارگیری اجزای پشتهٔ QA در کنار هم
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ساخت اتوماسیون تضمین کیفیت واقع‌گرایانه‌تر برای داشبورد Gateway
summary: 'نمای کلی پشتهٔ تضمین کیفیت: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-04T07:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

استک خصوصی QA برای آن است که OpenClaw را به شکلی واقعی‌تر و
کانال‌محورتر از آنچه یک آزمون واحد می‌تواند انجام دهد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدا و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed پشتیبانی‌شده با مخزن برای وظیفه آغازین و سناریوهای
  پایه QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                             | هدف                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودآزمایی QA همراه بسته؛ یک گزارش Markdown می‌نویسد.                                                                                                                                             |
| `qa suite`                                          | سناریوهای پشتیبانی‌شده با مخزن را در برابر مسیر Gateway QA اجرا می‌کند. نام مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM یک‌بارمصرف Linux.                                                       |
| `qa coverage`                                       | موجودی پوشش سناریو به صورت markdown را چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری عامل‌محور را می‌نویسد.                                                                                                               |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با گزارشی داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                 |
| `qa manual`                                         | یک اعلان یک‌باره را در برابر مسیر provider/model انتخاب‌شده اجرا می‌کند.                                                                                                                               |
| `qa ui`                                             | رابط کاربری اشکال‌زدای QA و گذرگاه محلی QA را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | تصویر ازپیش‌آماده Docker QA را می‌سازد.                                                                                                                                                          |
| `qa docker-scaffold`                                | یک اسکفولد docker-compose برای داشبورد QA + مسیر Gateway می‌نویسد.                                                                                                                         |
| `qa up`                                             | سایت QA را می‌سازد، استک پشتیبانی‌شده با Docker را شروع می‌کند، URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                       |
| `qa aimock`                                         | فقط سرور provider مربوط به AIMock را شروع می‌کند.                                                                                                                                                       |
| `qa mock-openai`                                    | فقط سرور provider سناریوآگاه `mock-openai` را شروع می‌کند.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن اعتبارنامه مشترک Convex را مدیریت می‌کند.                                                                                                                                                    |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                                           |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                   |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                            |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                    |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox، و smoke مربوط به Slack در VNC. [Mantis](/fa/concepts/mantis) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه عامل.
- راست: QA Lab، که رونوشت شبیه Slack و برنامه سناریو را نشان می‌دهد.

آن را با این اجرا کنید:

```bash
pnpm qa:lab:up
```

این فرمان سایت QA را می‌سازد، مسیر Gateway پشتیبانی‌شده با Docker را شروع می‌کند، و صفحه
QA Lab را در دسترس قرار می‌دهد؛ جایی که یک اپراتور یا حلقه خودکار می‌تواند به عامل یک مأموریت QA
بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود ماند.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون ساخت دوباره تصویر Docker در هر بار،
استک را با یک بسته QA Lab متصل‌شده با bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر ازپیش‌ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` با bind mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی hash دارایی QA Lab
تغییر کند به‌صورت خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی OpenTelemetry trace، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک گیرنده trace محلی OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin فعال `diagnostics-otel` اجرا می‌کند، سپس
spanهای protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید حاضر باشند؛
فراخوانی‌های مدل نباید در نوبت‌های موفق `StreamAbandoned` صادر کنند؛ شناسه‌های خام diagnostic و
attributeهای `openclaw.content.*` باید بیرون از trace بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای مجموعه QA می‌نویسد.

QA مشاهده‌پذیری فقط مخصوص checkout منبع باقی می‌ماند. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر instrumentation تشخیصی،
از `pnpm qa:otel:smoke` در یک checkout منبع ساخته‌شده استفاده کنید.

برای یک مسیر smoke مربوط به Matrix با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، env varها، و چیدمان artifact برای این مسیر در [Matrix QA](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: این مسیر یک homeserver یک‌بارمصرف Tuwunel را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و log خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای مسیرهای smoke با انتقال واقعی Telegram، Discord، و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

این مسیرها یک کانال واقعی ازپیش‌موجود با دو bot (driver + SUT) را هدف می‌گیرند. env varهای لازم، فهرست‌های سناریو، artifactهای خروجی، و مخزن اعتبارنامه Convex در [مرجع QA مربوط به Telegram، Discord، و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای یک اجرای کامل Slack desktop VM همراه نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ/مرورگر Crabbox را lease می‌کند، مسیر زنده Slack را
داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، از دسکتاپ تصویر می‌گیرد، و
`slack-qa/` به‌همراه `slack-desktop-smoke.png` را به دایرکتوری artifact
Mantis برمی‌گرداند. پس از ورود دستی به Slack Web از طریق VNC،
`--lease-id <cbx_...>` را دوباره استفاده کنید. با `--gateway-setup`، Mantis یک Gateway پایدار OpenClaw Slack را
داخل VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان مسیر QA معمولی
bot-to-bot مربوط به Slack را اجرا می‌کند و پس از ضبط artifact خارج می‌شود.

پیش از استفاده از اعتبارنامه‌های زنده pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگه‌دارنده حاضر باشد دسترسی admin/list را تأیید می‌کند. برای secretها فقط وضعیت set/missing را گزارش می‌دهد.

## پوشش انتقال زنده

مسیرهای انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خودشان را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعه گسترده رفتار محصول به‌صورت مصنوعی است و بخشی از ماتریس پوشش انتقال زنده نیست.

| مسیر     | Canary | دروازه‌گذاری mention | Bot-to-bot | مسدودسازی allowlist | پاسخ سطح بالا | ازسرگیری پس از restart | پیگیری رشته | جداسازی رشته | مشاهده واکنش | فرمان help | ثبت فرمان بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، درحالی‌که Matrix،
Telegram، و انتقال‌های زنده آینده یک چک‌لیست صریح قرارداد انتقال مشترک دارند.

برای یک مسیر Linux VM یک‌بارمصرف بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این کار یک مهمان تازه Multipass را بوت می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش عادی QA و
خلاصه را به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد، دوباره استفاده می‌کند.
اجرای مجموعه روی میزبان و Multipass به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را به‌طور موازی
با workerهای Gateway ایزوله اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض هم‌روندی
4 دارد که به تعداد سناریوهای انتخاب‌شده محدود می‌شود. از `--concurrency <count>` برای تنظیم
تعداد workerها، یا از `--concurrency 1` برای اجرای سریالی استفاده کنید.
وقتی هر سناریویی شکست بخورد، فرمان با کد غیرصفر خارج می‌شود. وقتی
artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجرای زنده ورودی‌های پشتیبانی‌شده احراز هویت QA را که برای مهمان عملی هستند
forward می‌کند: کلیدهای provider مبتنی بر env، مسیر پیکربندی provider زنده QA، و
`CODEX_HOME` در صورت وجود. `--output-dir` را زیر ریشه repo نگه دارید تا مهمان
بتواند از طریق workspace mountشده بنویسد.

## مرجع QA برای Telegram، Discord، و Slack

Matrix به‌دلیل تعداد سناریوها و آماده‌سازی homeserver مبتنی بر Docker یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، و Slack کوچک‌تر هستند — هرکدام چند سناریو، بدون سیستم profile، در برابر کانال‌های واقعی از پیش موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

این laneها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | محل نوشتن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ریشه repository هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | id حساب موقت داخل پیکربندی Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier`؛ مقدار قدیمی `live-openai` همچنان کار می‌کند.                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                                | refهای model اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                             | حالت سریع provider در جاهایی که پشتیبانی می‌شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر lane در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` artifactها را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو bot متمایز (driver + SUT) هدف می‌گیرد. bot مربوط به SUT باید username در Telegram داشته باشد؛ مشاهده bot-to-bot وقتی بهتر کار می‌کند که هر دو bot **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — chat id عددی (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در artifactهای پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض redact می‌کند).

سناریوها (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

artifactهای خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — شامل RTT برای هر reply (ارسال driver → reply مشاهده‌شده SUT) از canary به بعد.
- `telegram-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو bot هدف می‌گیرد: یک bot driver که توسط harness کنترل می‌شود و یک bot SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده Discord راه‌اندازی می‌شود. مدیریت mention کانال، اینکه bot مربوط به SUT فرمان native `/help` را در Discord ثبت کرده باشد، و سناریوهای شواهد Mantis به‌صورت opt-in را بررسی می‌کند.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با id کاربر bot مربوط به SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت lane زود شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در artifactهای پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سناریوی opt-in Mantis. به‌تنهایی اجرا می‌شود چون SUT را به replyهای guild همیشه‌فعال و فقط ابزاری با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک timeline واکنش REST به‌همراه یک artifact بصری HTML/PNG ثبت می‌کند.

سناریوی واکنش وضعیت Mantis را صراحتا اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

artifactهای خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی واکنش وضعیت اجرا شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو bot متمایز هدف می‌گیرد: یک bot driver که توسط harness کنترل می‌شود و یک bot SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده Slack راه‌اندازی می‌شود.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در artifactهای پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

artifactهای خروجی:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

### استخر اعتبارنامه Convex

laneهای Telegram، Discord، و Slack می‌توانند به‌جای خواندن env varهای بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex اجاره کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری دریافت می‌کند، در طول اجرا برای آن heartbeat می‌فرستد، و هنگام shutdown آن را آزاد می‌کند. انواع استخر `"telegram"`، `"discord"`، و `"slack"` هستند.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک string عددی chat-id باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

env varهای عملیاتی و قرارداد endpoint مربوط به broker در Convex در [Testing → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش پیش از پشتیبانی Discord انتخاب شده است؛ معناشناسی broker برای هر دو نوع یکسان است).

## seedهای مبتنی بر repo

assetهای seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمدا در git هستند تا برنامه QA هم برای انسان‌ها و هم برای
agent قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی markdown باقی بماند. هر فایل markdown سناریو
source of truth برای یک اجرای test است و باید موارد زیر را تعریف کند:

- metadata سناریو
- metadata اختیاری category، capability، lane، و risk
- refهای docs و code
- نیازمندی‌های اختیاری Plugin
- patch اختیاری پیکربندی Gateway
- `qa-flow` قابل اجرا

سطح runtime قابل استفاده مجدد که پشتوانه `qa-flow` است اجازه دارد عمومی
و cross-cutting باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را
با helperهای سمت browser ترکیب کنند که Control UI جاسازی‌شده را از طریق
درز `browser.request` در Gateway پیش می‌برند، بدون اینکه runner ویژه اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه بر اساس پوشه
source tree. وقتی فایل‌ها جابه‌جا می‌شوند، IDهای سناریو را پایدار نگه دارید؛ از `docsRefs` و `codeRefs`
برای traceability پیاده‌سازی استفاده کنید.

فهرست baseline باید به‌اندازه کافی گسترده بماند تا موارد زیر را پوشش دهد:

- chat در DM و کانال
- رفتار thread
- چرخه عمر action پیام
- callbackهای cron
- recall حافظه
- تغییر model
- تحویل به subagent
- خواندن repo و خواندن docs
- یک task کوچک build مانند Lobster Invaders

## laneهای mock provider

`qa suite` دو lane محلی mock provider دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این lane همچنان lane پیش‌فرض
  mock قطعی برای QA مبتنی بر repo و parity gateها باقی می‌ماند.
- `aimock` یک server provider مبتنی بر AIMock را برای پوشش آزمایشی protocol،
  fixture، record/replay، و chaos شروع می‌کند. این مورد افزایشی است و
  dispatcher سناریوی `mock-openai` را جایگزین نمی‌کند.

پیاده‌سازی provider-lane زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر provider مالک پیش‌فرض‌ها، startup server محلی، پیکربندی model در Gateway،
نیازهای staging مربوط به auth-profile، و پرچم‌های capability زنده/mock خودش است. کد suite و
Gateway مشترک باید به‌جای branching بر اساس نام providerها، از registry provider عبور کند.

## adapterهای transport

`qa-lab` مالک یک درز عمومی transport برای سناریوهای markdown QA است. `qa-channel` اولین adapter روی آن درز است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا synthetic آینده باید به‌جای افزودن runner مخصوص transport برای QA، به همان runner مجموعه وصل شوند.

در سطح معماری، تقسیم به این صورت است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌روندی worker، نوشتن artifact، و reporting است.
- adapter transport مالک پیکربندی Gateway، readiness، مشاهده inbound و outbound، actionهای transport، و وضعیت normalized transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای test را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن کانال

افزودن یک کانال به سیستم QA مبتنی بر markdown دقیقا به دو چیز نیاز دارد:

1. یک adapter transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین دهد.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، ریشه فرمان QA سطح‌بالای جدید اضافه نکنید.

`qa-lab` مکانیک‌های میزبان مشترک را در اختیار دارد:

- ریشه فرمان `openclaw qa`
- راه‌اندازی و پاک‌سازی مجموعه
- هم‌روندی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای اجراکننده قرارداد انتقال را در اختیار دارند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشه مشترک `qa` mount می‌شود
- اینکه Gateway برای آن انتقال چگونه پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌سازی‌شده انتقال چگونه عرضه می‌شوند
- اینکه اقدام‌های پشتوانه‌دار با انتقال چگونه اجرا می‌شوند
- اینکه بازنشانی یا پاک‌سازی ویژه انتقال چگونه انجام می‌شود

حداقل سطح پذیرش برای یک کانال جدید:

1. `qa-lab` را مالک ریشه مشترک `qa` نگه دارید.
2. اجراکننده انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. مکانیک‌های ویژه انتقال را داخل Plugin اجراکننده یا harness کانال نگه دارید.
4. اجراکننده را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک فرمان ریشه رقیب. Pluginهای اجراکننده باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و آرایه مطابق `qaRunnerCliRegistrations` را از `runtime-api.ts` صادر کنند. `runtime-api.ts` را سبک نگه دارید؛ CLI تنبل و اجرای runner باید پشت entrypointهای جداگانه بمانند.
5. سناریوهای Markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا سازگار کنید.
6. برای سناریوهای جدید از helperهای سناریوی عمومی استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک مهاجرت عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتاری را می‌توان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتاری به انتقال یک کانال وابسته است، آن را در همان Plugin اجراکننده یا harness Plugin نگه دارید.
- اگر سناریویی به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای شاخه ویژه کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک انتقال معنی‌دار است، سناریو را ویژه همان انتقال نگه دارید و این را در قرارداد سناریو صریح کنید.

### نام‌های helper سناریو

helperهای عمومی پیشنهادی برای سناریوهای جدید:

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس‌اند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نگارش سناریوهای جدید باید از نام‌های عمومی استفاده کند. این aliasها برای جلوگیری از یک مهاجرت یک‌باره وجود دارند، نه به‌عنوان الگوی آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از timeline مشاهده‌شده bus صادر می‌کند.
گزارش باید پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- چه سناریوهای پیگیری ارزش اضافه‌شدن دارند

برای inventory سناریوهای موجود — که هنگام اندازه‌گیری کار پیگیری یا وصل‌کردن یک انتقال جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (`--json` را برای خروجی قابل‌خواندن برای ماشین اضافه کنید).

برای بررسی‌های کاراکتر و سبک، همان سناریو را روی چندین ref مدل زنده اجرا کنید
و یک گزارش Markdown داوری‌شده بنویسید:

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

این فرمان فرایندهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی کاراکتر
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های عادی کاربر
مانند chat، کمک workspace و کارهای کوچک فایل را اجرا کنند. به مدل candidate نباید
گفته شود که در حال ارزیابی است. این فرمان هر transcript کامل را حفظ می‌کند،
آمار پایه اجرا را ثبت می‌کند، سپس از مدل‌های judge در حالت سریع با
استدلال `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسه providerها از `--blind-judge-models` استفاده کنید: prompt داور همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با
برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از
parsing رتبه‌بندی‌ها را دوباره به refهای واقعی نگاشت می‌کند.
اجراهای candidate به‌صورت پیش‌فرض از thinking برابر `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک candidate مشخص را به‌صورت inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و فرم قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
refهای candidate مربوط به OpenAI به‌صورت پیش‌فرض در حالت fast هستند تا در جاهایی که
provider پشتیبانی می‌کند از پردازش priority استفاده شود. وقتی یک
candidate یا judge تکی به override نیاز دارد، `,fast`، `,no-fast` یا `,fast=false` را inline اضافه کنید. فقط وقتی `--fast` را پاس بدهید که می‌خواهید
حالت fast را برای همه مدل‌های candidate اجباری کنید. مدت‌زمان‌های candidate و judge
برای تحلیل benchmark در گزارش ثبت می‌شوند، اما promptهای judge صراحتا می‌گویند
بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های candidate و judge هر دو به‌صورت پیش‌فرض هم‌روندی 16 دارند. وقتی
محدودیت‌های provider یا فشار Gateway محلی باعث می‌شود یک اجرا بیش از حد noisy شود،
`--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ candidateای با `--model` پاس داده نشود، character eval به‌صورت پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند.
وقتی هیچ `--judge-model` پاس داده نشود، داورها به‌صورت پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
