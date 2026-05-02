---
read_when:
    - درک نحوهٔ هماهنگی اجزای پشتهٔ تضمین کیفیت
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت متکی به مخزن
    - ساخت خودکارسازی تضمین کیفیت واقع‌گرایانه‌تر برای داشبورد Gateway
summary: 'مروری بر پشته QA: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-02T20:43:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

استک QA خصوصی برای این است که OpenClaw را به شکلی واقعی‌تر و
شبیه کانال، فراتر از آنچه یک تست واحد می‌تواند انجام دهد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدا و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و خروجی گرفتن از گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای runner آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed پشتیبانی‌شده با repo برای وظیفه آغازین و سناریوهای
  پایه QA.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA همراه‌سازی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                              |
| `qa suite`                                          | سناریوهای پشتیبانی‌شده با repo را در برابر lane مربوط به Gateway QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف. |
| `qa coverage`                                       | موجودی پوشش سناریوی markdown را چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                             |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری agentic را می‌نویسد.                                                                                  |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با یک گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                           |
| `qa manual`                                         | یک prompt تک‌باره را در برابر lane ارائه‌دهنده/مدل انتخاب‌شده اجرا می‌کند.                                                                                            |
| `qa ui`                                             | رابط کاربری اشکال‌زدای QA و گذرگاه QA محلی را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                            |
| `qa docker-build-image`                             | تصویر Docker از پیش آماده QA را می‌سازد.                                                                                                                             |
| `qa docker-scaffold`                                | یک scaffold برای docker-compose جهت داشبورد QA + lane مربوط به Gateway می‌نویسد.                                                                                     |
| `qa up`                                             | سایت QA را می‌سازد، استک پشتیبانی‌شده با Docker را شروع می‌کند، و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند). |
| `qa aimock`                                         | فقط سرور ارائه‌دهنده AIMock را شروع می‌کند.                                                                                                                          |
| `qa mock-openai`                                    | فقط سرور ارائه‌دهنده `mock-openai` آگاه از سناریو را شروع می‌کند.                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن مشترک اعتبارنامه‌های Convex را مدیریت می‌کند.                                                                                                                   |
| `qa matrix`                                         | lane انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریکس](/fa/concepts/qa-matrix) را ببینید.                                                            |
| `qa telegram`                                       | lane انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                              |
| `qa discord`                                        | lane انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                        |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه عامل.
- راست: QA Lab، که رونوشت شبیه Slack و برنامه سناریو را نشان می‌دهد.

آن را با این اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، lane مربوط به Gateway پشتیبانی‌شده با Docker را شروع می‌کند، و صفحه
QA Lab را در دسترس می‌گذارد؛ جایی که اپراتور یا حلقه اتوماسیون می‌تواند به عامل یک مأموریت QA
بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود ماند.

برای تکرار سریع‌تر رابط کاربری QA Lab بدون بازسازی تصویر Docker در هر بار،
استک را با bundle متصل‌شده با bind مربوط به QA Lab شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را به‌صورت bind-mount داخل کانتینر `qa-lab` متصل می‌کند. `qa:lab:watch`
آن bundle را هنگام تغییر بازسازی می‌کند، و مرورگر وقتی hash دارایی QA Lab
تغییر کند به‌طور خودکار بارگذاری مجدد می‌شود.

برای یک smoke ردگیری OpenTelemetry محلی، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

آن اسکریپت یک دریافت‌کننده ردگیری OTLP/HTTP محلی را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس spanهای protobuf خروجی‌گرفته‌شده را
decode می‌کند و شکل بحرانی برای انتشار را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`,
`openclaw.context.assembled`، و `openclaw.message.delivery` باید وجود داشته باشند؛
فراخوانی‌های مدل نباید در turnهای موفق `StreamAbandoned` را خروجی بدهند؛ شناسه‌های خام diagnostic و
attributeهای `openclaw.content.*` باید بیرون از trace بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای مجموعه QA می‌نویسد.

QA مشاهده‌پذیری فقط برای checkout منبع باقی می‌ماند. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین laneهای انتشار Docker بسته، فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر instrumentation
تشخیص، از یک checkout منبع ساخته‌شده از `pnpm qa:otel:smoke` استفاده کنید.

برای یک lane smoke ماتریکس با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/سناریو، env varها، و چیدمان artifact برای این lane در [QA ماتریکس](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: این فرمان یک homeserver یک‌بارمصرف Tuwunel را در Docker provision می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی ماتریکس را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای laneهای smoke با انتقال واقعی Telegram و Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

هر دو یک کانال واقعی از پیش موجود با دو bot (driver + SUT) را هدف می‌گیرند. env varهای لازم، فهرست سناریوها، artifactهای خروجی، و مخزن اعتبارنامه Convex در [مرجع QA مربوط به Telegram و Discord](#telegram-and-discord-qa-reference) در پایین مستند شده‌اند.

پیش از استفاده از اعتبارنامه‌های زنده poolشده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگه‌دارنده موجود باشد دسترسی admin/list را تأیید می‌کند. برای secretها فقط وضعیت set/missing را گزارش می‌دهد.

## پوشش انتقال زنده

laneهای انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را اختراع کنند، یک قرارداد مشترک دارند. `qa-channel` مجموعه گسترده رفتار محصول مصنوعی است و بخشی از ماتریس پوشش انتقال زنده نیست.

| Lane     | Canary | gating با mention | bot-to-bot | مسدودسازی allowlist | پاسخ سطح بالا | ادامه پس از restart | پیگیری رشته | جداسازی رشته | مشاهده واکنش | فرمان Help | ثبت فرمان بومی |
| -------- | ------ | ----------------- | ---------- | ------------------- | -------------- | ------------------- | ------------ | -------------- | ------------ | ---------- | -------------- |
| Matrix   | x      | x                 | x          | x                   | x              | x                   | x            | x              | x            |            |                |
| Telegram | x      | x                 | x          |                     |                |                     |              |                |              | x          |                |
| Discord  | x      | x                 | x          |                     |                |                     |              |                |              |            | x              |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، در حالی که Matrix،
Telegram، و انتقال‌های زنده آینده یک چک‌لیست صریح مشترک برای قرارداد انتقال دارند.

برای یک lane VM لینوکسی یک‌بارمصرف بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این فرمان یک مهمان Multipass تازه را boot می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و خلاصه معمول QA را
به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد دوباره استفاده می‌کند.
اجرای suite روی میزبان و Multipass به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی
با workerهای جداگانه Gateway اجرا می‌کند. مقدار پیش‌فرض concurrency برای `qa-channel`
برابر 4 است و به تعداد سناریوهای انتخاب‌شده محدود می‌شود. از `--concurrency <count>` برای تنظیم
تعداد workerها استفاده کنید، یا از `--concurrency 1` برای اجرای سریالی.
وقتی هر سناریویی شکست بخورد، فرمان با non-zero خارج می‌شود. وقتی
artifactها را بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
اجرای زنده ورودی‌های auth پشتیبانی‌شده QA را که برای مهمان عملی هستند forward می‌کند:
کلیدهای ارائه‌دهنده مبتنی بر env، مسیر config ارائه‌دهنده زنده QA، و
`CODEX_HOME` در صورت وجود. `--output-dir` را زیر ریشه repo نگه دارید تا مهمان
بتواند از طریق workspace mountشده به عقب بنویسد.

## مرجع QA مربوط به Telegram و Discord

Matrix به‌دلیل تعداد سناریوها و provision کردن homeserver پشتیبانی‌شده با Docker یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram و Discord کوچک‌ترند — چند سناریو برای هرکدام، بدون سیستم profile، در برابر کانال‌های واقعی از پیش موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

هر دو lane از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                   | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | محل نوشتن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                           | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | شناسه حساب موقت داخل پیکربندی Gateway مربوط به QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` یا `live-frontier` (`live-openai` قدیمی همچنان کار می‌کند).                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                          | ارجاع‌های مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                       | حالت سریع ارائه‌دهنده، در جاهایی که پشتیبانی می‌شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                        | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر دو در صورت شکست هر سناریو با کد غیرصفر خارج می‌شوند. `--allow-failures` آرتیفکت‌ها را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز (درایور + SUT) هدف می‌گیرد. بات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده بات-به-بات وقتی هر دو بات در `@BotFather` دارای **Bot-to-Bot Communication Mode** فعال باشند بهترین نتیجه را دارد.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض ویرایش و مخفی‌سازی است).

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
- `telegram-qa-summary.json` — شامل RTT هر پاسخ (ارسال درایور → پاسخ مشاهده‌شده SUT) که از canary شروع می‌شود.
- `telegram-qa-observed-messages.json` — بدنه‌ها مخفی می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات درایور که harness آن را کنترل می‌کند و یک بات SUT که Gateway فرزند OpenClaw آن را از طریق Plugin همراه Discord شروع می‌کند. مدیریت mention کانال و اینکه بات SUT فرمان بومی `/help` را در Discord ثبت کرده است بررسی می‌کند.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با شناسه کاربر بات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت این lane سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

آرتیفکت‌های خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها مخفی می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.

### استخر اعتبارنامه Convex

هر دو lane مربوط به Telegram و Discord می‌توانند به جای خواندن متغیرهای env بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex اجاره کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک اجاره انحصاری دریافت می‌کند، در طول اجرا برای آن Heartbeat می‌فرستد و هنگام خاموش‌سازی آن را آزاد می‌کند. نوع‌های استخر `"telegram"` و `"discord"` هستند.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک رشته chat-id عددی باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

متغیرهای env عملیاتی و قرارداد endpoint مربوط به broker در Convex در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش به قبل از پشتیبانی Discord برمی‌گردد؛ معنای broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده با مخزن

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمدا در git هستند تا طرح QA هم برای انسان‌ها و هم برای agent قابل مشاهده باشد.

`qa-lab` باید یک اجراکننده markdown عمومی بماند. هر فایل markdown سناریو منبع حقیقت برای یک اجرای آزمایش است و باید موارد زیر را تعریف کند:

- فراداده سناریو
- فراداده اختیاری category، capability، lane و risk
- ارجاع‌های docs و کد
- الزامات اختیاری Plugin
- patch اختیاری پیکربندی Gateway
- `qa-flow` اجرایی

سطح runtime قابل استفاده مجدد که پشتوانه `qa-flow` است می‌تواند عمومی و cross-cutting بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق seam مربوط به Gateway `browser.request` هدایت می‌کنند، بدون اینکه runner ویژه اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشه source tree. هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید آن‌قدر گسترده بماند که موارد زیر را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر اقدام پیام
- callbackهای cron
- یادآوری memory
- تغییر مدل
- handoff به subagent
- خواندن مخزن و خواندن docs
- یک کار کوچک build مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane محلی mock ارائه‌دهنده دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این مورد lane پیش‌فرض deterministic mock برای QA پشتیبانی‌شده با مخزن و parity gateها باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده مبتنی بر AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos شروع می‌کند. این مورد افزایشی است و جای dispatcher سناریوی `mock-openai` را نمی‌گیرد.

پیاده‌سازی provider-lane زیر `extensions/qa-lab/src/providers/` قرار دارد. هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل Gateway، نیازهای stage کردن auth-profile و پرچم‌های قابلیت live/mock است. کد مشترک suite و gateway باید به جای branch زدن بر اساس نام ارائه‌دهنده، از طریق رجیستری ارائه‌دهنده route شود.

## adapterهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای markdown QA است. `qa-channel` نخستین adapter روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به همان suite runner وصل شوند، نه اینکه runner اختصاصی QA برای transport اضافه کنند.

در سطح معماری، این تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، همزمانی workerها، نوشتن آرتیفکت و گزارش‌دهی است.
- adapter مربوط به transport مالک پیکربندی Gateway، readiness، مشاهده ورودی و خروجی، اقدام‌های transport و وضعیت normalize‌شده transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای آزمایش را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سامانه markdown QA دقیقا به دو چیز نیاز دارد:

1. یک adapter transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین کند.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، root فرمان QA سطح بالای جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای host مشترک است:

- root فرمان `openclaw qa`
- راه‌اندازی و teardown suite
- همزمانی workerها
- نوشتن آرتیفکت
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه Gateway برای آن transport چگونه پیکربندی می‌شود
- اینکه readiness چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت normalize‌شده transport چگونه expose می‌شوند
- اینکه اقدام‌های پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup اختصاصی transport چگونه انجام می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به عنوان مالک root مشترک `qa` نگه دارید.
2. runner مربوط به transport را روی seam host مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای اختصاصی transport را داخل runner plugin یا channel harness نگه دارید.
4. runner را به صورت `openclaw qa <runner>` mount کنید، نه اینکه یک فرمان root رقیب ثبت کنید. runner pluginها باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و آرایه مطابق `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy مربوط به CLI و runner باید پشت entrypointهای جداگانه بماند.
5. سناریوهای markdown را زیر دایرکتوری‌های themed `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید مگر اینکه مخزن در حال انجام مهاجرت عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک channel transport وابسته است، آن را در همان runner plugin یا plugin harness نگه دارید.
- اگر سناریویی به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند استفاده کند، به جای branch اختصاصی کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک transport معنادار است، سناریو را اختصاصی transport نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نوشتن سناریوهای جدید باید از نام‌های عمومی استفاده کند. aliasها برای پرهیز از مهاجرت flag-day وجود دارند، نه به عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` از timeline مربوط به bus مشاهده‌شده یک گزارش protocol در Markdown export می‌کند.
گزارش باید پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- چه سناریوهای follow-up ارزش افزودن دارند

برای موجودی سناریوهای موجود — که هنگام برآورد اندازهٔ کارهای بعدی یا سیم‌کشی یک ترابری جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل‌خواندن توسط ماشین، `--json` را اضافه کنید).

برای بررسی‌های شخصیت و سبک، همان سناریو را روی چندین ارجاع مدل زنده اجرا کنید
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

این فرمان فرایندهای فرزند Gateway تضمین کیفیت محلی را اجرا می‌کند، نه Docker. سناریوهای ارزیابی شخصیت
باید شخصیت را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های معمول کاربر
مانند گفت‌وگو، کمک دربارهٔ فضای کاری، و وظایف کوچک فایل را اجرا کنند. به مدل نامزد نباید
گفته شود که در حال ارزیابی است. این فرمان هر رونوشت کامل را حفظ می‌کند،
آمار پایهٔ اجرا را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع با
استدلال `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال، و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسهٔ ارائه‌دهندگان از `--blind-judge-models` استفاده کنید: درخواست داور همچنان
هر رونوشت و وضعیت اجرا را دریافت می‌کند، اما ارجاع‌های نامزد با برچسب‌های خنثی
مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از تجزیه،
رتبه‌بندی‌ها را دوباره به ارجاع‌های واقعی نگاشت می‌کند.
اجراهای نامزد به‌طور پیش‌فرض از تفکر `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای ارجاع‌های ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک نامزد مشخص را به‌صورت درون‌خطی با
`--model provider/model,thinking=<level>` بازنویسی کنید. `--thinking <level>` همچنان یک
جایگزین سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
ارجاع‌های نامزد OpenAI به‌طور پیش‌فرض روی حالت سریع هستند تا در جاهایی که
ارائه‌دهنده پشتیبانی می‌کند، پردازش اولویتی استفاده شود. وقتی یک
نامزد یا داور منفرد به بازنویسی نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط وقتی `--fast` را ارسال کنید که می‌خواهید
حالت سریع را برای همهٔ مدل‌های نامزد اجباراً فعال کنید. مدت‌زمان‌های نامزد و داور
برای تحلیل بنچمارک در گزارش ثبت می‌شوند، اما درخواست‌های داور صراحتاً می‌گویند
بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل نامزد و داور هر دو به‌طور پیش‌فرض از هم‌روندی ۱۶ استفاده می‌کنند. وقتی محدودیت‌های
ارائه‌دهنده یا فشار Gateway محلی یک اجرا را بیش از حد پرنویز می‌کند،
`--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` نامزدی ارسال نشود، ارزیابی شخصیت به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` ارسال نشده باشد.
وقتی هیچ `--judge-model` ارسال نشود، داورها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## اسناد مرتبط

- [تضمین کیفیت ماتریسی](/fa/concepts/qa-matrix)
- [کانال تضمین کیفیت](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
