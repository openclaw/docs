---
read_when:
    - درک اینکه پشتهٔ QA چگونه کنار هم قرار می‌گیرد
    - گسترش qa-lab، qa-channel یا یک آداپتور ترابری
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت واقع‌گرایانه‌تر برای داشبورد Gateway
summary: 'نمای کلی پشته QA: qa-lab، qa-channel، سناریوهای متکی به مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-05-04T02:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشته QA خصوصی قرار است OpenClaw را به شکلی واقعی‌تر و
کانال‌محورتر از چیزی که یک آزمون واحد می‌تواند پوشش دهد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط اشکال‌زدایی و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپترهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های اولیه متکی به مخزن برای وظیفه آغازین و سناریوهای پایه
  QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام مستعار اسکریپت `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودآزمایی QA بسته‌بندی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                  |
| `qa suite`                                          | سناریوهای متکی به مخزن را در برابر خط Gateway QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف.             |
| `qa coverage`                                       | فهرست پوشش سناریوی markdown را چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                  |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری عاملی را می‌نویسد.                                                                                       |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با یک گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                             |
| `qa manual`                                         | یک درخواست یک‌باره را در برابر خط provider/model انتخاب‌شده اجرا می‌کند.                                                                                                |
| `qa ui`                                             | رابط اشکال‌زدایی QA و گذرگاه محلی QA را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                     |
| `qa docker-build-image`                             | تصویر Docker از پیش پخته‌شده QA را می‌سازد.                                                                                                                              |
| `qa docker-scaffold`                                | یک داربست docker-compose برای داشبورد QA + خط Gateway می‌نویسد.                                                                                                          |
| `qa up`                                             | سایت QA را می‌سازد، پشته متکی به Docker را شروع می‌کند، و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند). |
| `qa aimock`                                         | فقط سرور provider AIMock را شروع می‌کند.                                                                                                                                 |
| `qa mock-openai`                                    | فقط سرور provider آگاه از سناریوی `mock-openai` را شروع می‌کند.                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن مشترک اعتبارنامه Convex را مدیریت می‌کند.                                                                                                                          |
| `qa matrix`                                         | خط انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                  |
| `qa telegram`                                       | خط انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                   |
| `qa discord`                                        | خط انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                             |
| `qa slack`                                          | خط انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                     |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord و یک smoke دسکتاپ/مرورگر Crabbox. [Mantis](/fa/concepts/mantis) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دو صفحه‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه با عامل.
- راست: QA Lab، که رونوشت شبیه Slack و برنامه سناریو را نشان می‌دهد.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، خط Gateway متکی به Docker را شروع می‌کند، و صفحه
QA Lab را در دسترس قرار می‌دهد؛ جایی که یک اپراتور یا حلقه خودکارسازی می‌تواند به عامل یک مأموریت QA
بدهد، رفتار کانال واقعی را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود ماند.

برای تکرار سریع‌تر روی رابط QA Lab بدون بازسازی تصویر Docker در هر بار،
پشته را با یک بسته QA Lab متصل‌شده از طریق bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را در کانتینر `qa-lab` به‌صورت bind-mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر بازسازی می‌کند، و مرورگر وقتی هش دارایی QA Lab
تغییر کند به‌صورت خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی ردیابی OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

آن اسکریپت یک گیرنده محلی ردیابی OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس
spanهای protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را بررسی می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید وجود داشته باشند؛
فراخوانی‌های مدل نباید در نوبت‌های موفق `StreamAbandoned` صادر کنند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید خارج از ردیابی بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار مصنوعات مجموعه QA می‌نویسد.

QA مشاهده‌پذیری فقط مخصوص checkout منبع می‌ماند. tarball npm عمداً
QA Lab را حذف می‌کند، بنابراین خط‌های انتشار Docker بسته فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر ابزارگذاری تشخیصی،
از `pnpm qa:otel:smoke` در یک checkout ساخته‌شده از منبع استفاده کنید.

برای یک خط smoke واقعی از نظر انتقال برای Matrix، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ پروفایل/سناریو، متغیرهای env، و چیدمان مصنوعات برای این خط در [Matrix QA](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: این فرمان یک homeserver یک‌بارمصرف Tuwunel را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، مصنوع observed-events، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای خط‌های smoke واقعی از نظر انتقال برای Telegram، Discord، و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

آن‌ها یک کانال واقعی از پیش موجود با دو ربات (driver + SUT) را هدف می‌گیرند. متغیرهای env لازم، فهرست سناریوها، مصنوعات خروجی، و مخزن اعتبارنامه Convex در [مرجع QA برای Telegram، Discord، و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

قبل از استفاده از اعتبارنامه‌های زنده تجمیع‌شده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor متغیرهای env کارگزار Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگهدارنده حاضر باشد دسترسی‌پذیری admin/list را راستی‌آزمایی می‌کند. برای secretها فقط وضعیت تنظیم‌شده/مفقود را گزارش می‌دهد.

## پوشش انتقال زنده

خط‌های انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خودشان را اختراع کنند، یک قرارداد مشترک دارند. `qa-channel` مجموعه مصنوعی گسترده رفتار محصول است و بخشی از ماتریس پوشش انتقال زنده نیست.

| خط      | Canary | دروازه‌بانی mention | ربات-به-ربات | مسدودسازی allowlist | پاسخ سطح بالا | ازسرگیری پس از restart | پیگیری رشته | جداسازی رشته | مشاهده واکنش | فرمان help | ثبت فرمان بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، در حالی که Matrix،
Telegram، و انتقال‌های زنده آینده یک چک‌لیست صریح قرارداد انتقال را
به اشتراک می‌گذارند.

برای یک خط VM لینوکسی یک‌بارمصرف بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این فرمان یک مهمان تازه Multipass را بوت می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش QA معمول و
خلاصه را به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد دوباره استفاده می‌کند.
اجراهای مجموعه روی میزبان و Multipass به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی
با workerهای Gateway ایزوله اجرا می‌کنند. مقدار پیش‌فرض هم‌روندی `qa-channel`
4 است و به تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای تنظیم
تعداد workerها از `--concurrency <count>` استفاده کنید، یا برای اجرای سریالی
`--concurrency 1` را به کار ببرید.
وقتی هر سناریویی شکست بخورد، فرمان با مقدار غیرصفر خارج می‌شود. وقتی
مصنوعات را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های پشتیبانی‌شده احراز هویت QA را که برای
مهمان عملی هستند ارسال می‌کنند: کلیدهای provider مبتنی بر env، مسیر پیکربندی provider زنده QA، و
`CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر ریشه مخزن نگه دارید تا مهمان
بتواند از طریق workspace متصل‌شده دوباره بنویسد.

## مرجع QA برای Telegram، Discord، و Slack

Matrix به‌دلیل تعداد سناریوها و فراهم‌سازی homeserver متکی به Docker، یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، و Slack کوچک‌تر هستند - هرکدام چند سناریو، بدون سیستم پروفایل، در برابر کانال‌های واقعی از پیش موجود - بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

این خط‌ها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | محل نوشته شدن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` تفسیر می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | شناسه حساب موقت داخل پیکربندی QA Gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier`؛ مقدار قدیمی `live-openai` همچنان کار می‌کند.                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                                | ارجاع‌های مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                             | حالت سریع ارائه‌دهنده در جاهایی که پشتیبانی شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر lane در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` آرتیفکت‌ها را بدون تنظیم کد خروجی شکست‌خورده می‌نویسد.

### QA در Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو ربات متمایز هدف می‌گیرد (driver + SUT). ربات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده ربات‌به‌ربات زمانی بهتر کار می‌کند که هر دو ربات **حالت ارتباط ربات‌به‌ربات** را در `@BotFather` فعال کرده باشند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض آن‌ها را ویرایش می‌کند).

سناریوها (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

آرتیفکت‌های خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — شامل RTT هر پاسخ (ارسال driver → پاسخ مشاهده‌شده SUT) که از canary شروع می‌شود.
- `telegram-qa-observed-messages.json` — بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA در Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو ربات هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط OpenClaw Gateway فرزند از طریق Plugin داخلی Discord شروع می‌شود. مدیریت mention کانال، اینکه ربات SUT دستور بومی `/help` را در Discord ثبت کرده باشد، و سناریوهای شواهد opt-in مربوط به Mantis را بررسی می‌کند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با شناسه کاربر ربات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت lane سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سناریوی opt-in مربوط به Mantis. به‌تنهایی اجرا می‌شود، چون SUT را به پاسخ‌های guild همیشه‌فعال و فقط‌ابزاری با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک خط زمانی واکنش REST به‌همراه یک آرتیفکت بصری HTML/PNG ثبت می‌کند.

سناریوی واکنش وضعیت Mantis را صراحتا اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

آرتیفکت‌های خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` هنگام اجرای سناریوی واکنش وضعیت.

### QA در Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو ربات متمایز هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط OpenClaw Gateway فرزند از طریق Plugin داخلی Slack شروع می‌شود.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

آرتیفکت‌های خروجی:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

### استخر اعتبارنامه Convex

laneهای Telegram، Discord و Slack می‌توانند به‌جای خواندن env vars بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex اجاره کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک اجاره انحصاری می‌گیرد، در طول اجرا برای آن Heartbeat می‌فرستد، و هنگام خاموش شدن آن را آزاد می‌کند. انواع استخر `"telegram"`، `"discord"` و `"slack"` هستند.

شکل payloadهایی که broker در `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک رشته chat-id عددی باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

env vars عملیاتی و قرارداد endpoint مربوط به broker در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش به پیش از پشتیبانی Discord برمی‌گردد؛ معناشناسی broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده توسط مخزن

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمدا در git هستند تا طرح QA هم برای انسان‌ها و هم برای
agent قابل مشاهده باشد.

`qa-lab` باید یک اجراکننده markdown عمومی باقی بماند. هر فایل markdown سناریو
منبع حقیقت برای یک اجرای آزمایش است و باید موارد زیر را تعریف کند:

- فراداده سناریو
- فراداده اختیاری category، capability، lane و risk
- ارجاع‌های مستندات و کد
- الزامات اختیاری Plugin
- patch اختیاری پیکربندی Gateway
- `qa-flow` اجرایی

سطح runtime قابل استفاده مجددی که پشتوانه `qa-flow` است مجاز است عمومی
و cross-cutting باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport
را با helperهای سمت مرورگر ترکیب کنند که Control UI توکار را از طریق seam
`browser.request` مربوط به Gateway هدایت می‌کنند، بدون اینکه runner مورد خاص اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشه
درخت منبع. هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای traceability پیاده‌سازی از `docsRefs` و `codeRefs`
استفاده کنید.

فهرست baseline باید به‌اندازه‌ای گسترده بماند که موارد زیر را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر action پیام
- callbackهای cron
- recall حافظه
- تغییر مدل
- handoff زیرagent
- خواندن مخزن و خواندن مستندات
- یک وظیفه کوچک build مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane mock ارائه‌دهنده محلی دارد:

- `mock-openai` همان mock سناریوآگاه OpenClaw است. این lane به‌عنوان lane mock قطعی پیش‌فرض برای QA پشتیبانی‌شده توسط مخزن و parity gateها باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده پشتیبانی‌شده با AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos شروع می‌کند. این مورد افزایشی است و جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی lane ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل Gateway،
نیازهای staging مربوط به auth-profile، و پرچم‌های قابلیت live/mock است. کد suite و
Gateway مشترک باید به‌جای branch زدن بر اساس نام‌های ارائه‌دهنده، از طریق registry ارائه‌دهنده route شود.

## adapterهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای QA در markdown است. `qa-channel` نخستین adapter روی این seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به‌جای افزودن یک QA runner مخصوص transport، به همان suite runner متصل شوند.

در سطح معماری، این تقسیم چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی worker، نوشتن آرتیفکت، و گزارش‌دهی است.
- adapter transport مالک پیکربندی Gateway، آمادگی، مشاهده ورودی و خروجی، actionهای transport، و وضعیت normalized transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای آزمایش را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجددی را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سامانه QA در markdown دقیقا به دو چیز نیاز دارد:

1. یک adapter transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین کند.

وقتی میزبان مشترک `qa-lab` می‌تواند مالک flow باشد، root جدیدی برای فرمان QA در سطح بالا اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- root فرمان `openclaw qa`
- راه‌اندازی و teardown مربوط به suite
- هم‌زمانی worker
- نوشتن آرتیفکت
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه Gateway چگونه برای آن transport پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه eventهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت normalized transport چگونه در دسترس قرار می‌گیرند
- اینکه actionهای پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص transport چگونه مدیریت می‌شود

حداقل سطح پذیرش برای یک کانال جدید:

1. `qa-lab` را مالک ریشهٔ مشترک `qa` نگه دارید.
2. اجراکنندهٔ انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای ویژهٔ انتقال را داخل Plugin اجراکننده یا harness کانال نگه دارید.
4. اجراکننده را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک فرمان ریشهٔ رقیب. Pluginهای اجراکننده باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و آرایهٔ متناظر `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ CLI تنبل و اجرای runner باید پشت entrypointهای جداگانه بمانند.
5. سناریوهای markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک مهاجرت عمدی باشد.

قاعدهٔ تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را می‌توان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به انتقال یک کانال وابسته است، آن را در همان Plugin اجراکننده یا harness Plugin نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای شاخهٔ ویژهٔ کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک انتقال معنادار است، سناریو را ویژهٔ همان انتقال نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نوشتن سناریوهای جدید باید از نام‌های عمومی استفاده کند. این aliasها برای جلوگیری از یک مهاجرت flag-day وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از timeline مشاهده‌شدهٔ bus export می‌کند.
گزارش باید به این موارد پاسخ دهد:

- چه چیزهایی کار کرد
- چه چیزهایی شکست خورد
- چه چیزهایی همچنان مسدود ماند
- چه سناریوهای پیگیری‌ای ارزش اضافه شدن دارند

برای فهرست سناریوهای موجود — که هنگام برآورد کارهای پیگیری یا سیم‌کشی یک انتقال جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل‌خواندن توسط ماشین، `--json` را اضافه کنید).

برای بررسی‌های شخصیت و سبک، همان سناریو را روی چندین ref مدل زنده اجرا کنید
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

این فرمان processهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی شخصیت
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر
مانند chat، کمک workspace، و taskهای کوچک فایل را اجرا کنند. به مدل کاندیدا نباید
گفته شود که در حال ارزیابی شدن است. این فرمان هر transcript کامل را حفظ می‌کند،
آمار پایهٔ اجرا را ثبت می‌کند، سپس از مدل‌های داور در حالت fast با reasoning
`xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی بودن، vibe، و طنز رتبه‌بندی کنند.
هنگام مقایسهٔ providerها از `--blind-judge-models` استفاده کنید: prompt داور همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای کاندیدا با labelهای خنثی
مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از parsing رتبه‌بندی‌ها را دوباره به refهای واقعی map می‌کند.
اجراهای کاندیدا به‌طور پیش‌فرض از thinking سطح `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای قدیمی‌تر ارزیابی OpenAI که از آن پشتیبانی می‌کنند. یک کاندیدای مشخص را به‌صورت inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و فرم قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری حفظ شده است.
refهای کاندیدای OpenAI به‌طور پیش‌فرض در حالت fast هستند تا در جاهایی که
provider پشتیبانی می‌کند از پردازش اولویت‌دار استفاده شود. وقتی یک
کاندیدا یا داور منفرد به override نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را inline اضافه کنید. فقط زمانی `--fast` را pass کنید که می‌خواهید
حالت fast را برای همهٔ مدل‌های کاندیدا force کنید. مدت‌زمان کاندیدا و داور
برای تحلیل benchmark در گزارش ثبت می‌شود، اما promptهای داور صراحتا می‌گویند
که بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل کاندیدا و داور هر دو به‌طور پیش‌فرض concurrency 16 دارند. وقتی محدودیت‌های
provider یا فشار Gateway محلی یک اجرا را بیش از حد noisy می‌کند، `--concurrency`
یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` کاندیدایی pass نشود، character eval به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند.
وقتی هیچ `--judge-model`ی pass نشود، داورها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
