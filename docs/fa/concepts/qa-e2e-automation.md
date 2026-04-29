---
read_when:
    - درک چگونگی کنار هم قرار گرفتن اجزای پشتهٔ QA
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای QA مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت با واقع‌گرایی بالاتر برای داشبورد Gateway
summary: 'نمای کلی پشته QA: qa-lab، qa-channel، سناریوهای متکی به مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-04-29T22:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشته‌ی خصوصی QA برای این است که OpenClaw را به‌شکلی واقع‌گرایانه‌تر و
شبیه‌تر به کانال، بیشتر از آنچه یک تست واحد می‌تواند، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهده‌ی رونوشت،
  تزریق پیام‌های ورودی و خروجی گرفتن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده‌ی آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های بذر مبتنی بر مخزن برای وظیفه‌ی آغازین و سناریوهای پایه‌ی
  QA.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                             | هدف                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                       |
| `qa suite`                                          | اجرای سناریوهای مبتنی بر مخزن در برابر مسیر Gateway QA. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM یک‌بارمصرف Linux.                                 |
| `qa coverage`                                       | چاپ موجودی پوشش سناریو در قالب markdown (`--json` برای خروجی ماشینی).                                                                                          |
| `qa parity-report`                                  | مقایسه‌ی دو فایل `qa-suite-summary.json` و نوشتن گزارش agentic parity-gate.                                                                                    |
| `qa character-eval`                                 | اجرای سناریوی QA شخصیت روی چند مدل زنده با گزارشی داوری‌شده. [گزارش‌دهی](#reporting) را ببینید.                                                           |
| `qa manual`                                         | اجرای یک اعلان تک‌مرحله‌ای در برابر مسیر provider/model انتخاب‌شده.                                                                                                         |
| `qa ui`                                             | راه‌اندازی رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA (نام مستعار: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | ساخت تصویر Docker از پیش آماده‌شده‌ی QA.                                                                                                                                    |
| `qa docker-scaffold`                                | نوشتن اسکفلد docker-compose برای داشبورد QA + مسیر Gateway.                                                                                                   |
| `qa up`                                             | ساخت سایت QA، راه‌اندازی پشته‌ی پشتیبانی‌شده با Docker و چاپ URL (نام مستعار: `pnpm qa:lab:up`؛ گونه‌ی `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند). |
| `qa aimock`                                         | فقط سرور provider مربوط به AIMock را راه‌اندازی می‌کند.                                                                                                                                 |
| `qa mock-openai`                                    | فقط سرور provider سناریوآگاه `mock-openai` را راه‌اندازی می‌کند.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | مدیریت استخر اعتبارنامه‌ی مشترک Convex.                                                                                                                              |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریس](/fa/concepts/qa-matrix) را ببینید.                                                                     |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                             |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                      |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (رابط کاربری کنترل) با عامل.
- راست: QA Lab، نمایش‌دهنده‌ی رونوشت شبیه Slack و برنامه‌ی سناریو.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، مسیر Gateway پشتیبانی‌شده با Docker را راه‌اندازی
می‌کند و صفحه‌ی QA Lab را در دسترس قرار می‌دهد؛ جایی که اپراتور یا حلقه‌ی
اتوماسیون می‌تواند به عامل یک مأموریت QA بدهد، رفتار واقعی کانال را مشاهده
کند و ثبت کند چه چیزی کار کرد، شکست خورد یا مسدود ماند.

برای تکرار سریع‌تر رابط کاربری QA Lab بدون بازسازی تصویر Docker در هر بار،
پشته را با یک بسته‌ی QA Lab متصل‌شده با bind mount راه‌اندازی کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را با bind mount داخل کانتینر `qa-lab` قرار می‌دهد.
`qa:lab:watch` آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی hash دارایی
QA Lab تغییر کند به‌صورت خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی ردیابی OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک دریافت‌کننده‌ی محلی ردیابی OTLP/HTTP را راه‌اندازی می‌کند،
سناریوی QA مربوط به `otel-trace-smoke` را با Plugin `diagnostics-otel` فعال
اجرا می‌کند، سپس spanهای protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای
انتشار را بررسی می‌کند: `openclaw.run`، `openclaw.harness.run`،
`openclaw.model.call`، `openclaw.context.assembled` و
`openclaw.message.delivery` باید وجود داشته باشند؛ فراخوانی‌های مدل نباید در
نوبت‌های موفق `StreamAbandoned` صادر کنند؛ شناسه‌های خام تشخیصی و ویژگی‌های
`openclaw.content.*` باید بیرون از trace بمانند. این فایل
`otel-smoke-summary.json` را کنار artifactهای مجموعه‌ی QA می‌نویسد.

QA مشاهده‌پذیری فقط در checkout سورس باقی می‌ماند. بسته‌ی tarball مربوط به npm
عمداً QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته فرمان‌های `qa`
را اجرا نمی‌کنند. هنگام تغییر ابزارگذاری تشخیصی، از یک checkout سورس ساخته‌شده
`pnpm qa:otel:smoke` را اجرا کنید.

برای یک مسیر smoke ماتریس با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، متغیرهای محیطی و چیدمان artifact برای این مسیر در [QA ماتریس](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver یک‌بارمصرف Tuwunel را در Docker فراهم‌سازی می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه‌ی JSON، artifact رویدادهای مشاهده‌شده و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای مسیرهای smoke انتقال واقعی Telegram و Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

هر دو یک کانال واقعی از پیش موجود را با دو bot هدف می‌گیرند (driver + SUT).
متغیرهای محیطی لازم، فهرست‌های سناریو، artifactهای خروجی و استخر اعتبارنامه‌ی
Convex در [مرجع QA برای Telegram و Discord](#telegram-and-discord-qa-reference)
در ادامه مستند شده‌اند.

پیش از استفاده از اعتبارنامه‌های زنده‌ی استخرشده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی
می‌کند و وقتی secret نگه‌دارنده موجود باشد، دسترسی‌پذیری admin/list را تأیید
می‌کند. برای secretها فقط وضعیت تنظیم‌شده/ناموجود را گزارش می‌کند.

## پوشش انتقال زنده

مسیرهای انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را بسازند، یک
قرارداد مشترک دارند. `qa-channel` مجموعه‌ی مصنوعی گسترده‌ی رفتار محصول است و
بخشی از ماتریس پوشش انتقال زنده نیست.

| مسیر     | Canary | گیتینگ mention | bot به bot | مسدودسازی allowlist | پاسخ سطح بالا | ادامه پس از restart | پیگیری رشته | جداسازی رشته | مشاهده‌ی واکنش | فرمان راهنما | ثبت فرمان بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

این کار `qa-channel` را به‌عنوان مجموعه‌ی گسترده‌ی رفتار محصول نگه می‌دارد، در
حالی که Matrix، Telegram و انتقال‌های زنده‌ی آینده یک چک‌لیست صریح مشترک برای
قرارداد انتقال دارند.

برای یک مسیر VM یک‌بارمصرف Linux بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این یک مهمان تازه‌ی Multipass را boot می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw
را داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و خلاصه‌ی معمول QA
را به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد دوباره استفاده
می‌کند.
اجرای مجموعه روی میزبان و Multipass به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را
هم‌زمان با workerهای Gateway ایزوله اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض
concurrency برابر با 4 دارد که با تعداد سناریوهای انتخاب‌شده محدود می‌شود. از
`--concurrency <count>` برای تنظیم تعداد worker استفاده کنید، یا برای اجرای
سریالی از `--concurrency 1` استفاده کنید.
وقتی هر سناریویی شکست بخورد، فرمان با کد غیرصفر خارج می‌شود. وقتی artifactها را
بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های پشتیبانی‌شده‌ی احراز هویت QA را که برای مهمان عملی
هستند منتقل می‌کنند: کلیدهای provider مبتنی بر env، مسیر پیکربندی provider
زنده‌ی QA و `CODEX_HOME` وقتی موجود باشد. `--output-dir` را زیر ریشه‌ی مخزن نگه
دارید تا مهمان بتواند از طریق workspace متصل‌شده دوباره بنویسد.

## مرجع QA برای Telegram و Discord

Matrix به‌دلیل تعداد سناریوها و فراهم‌سازی homeserver پشتیبانی‌شده با Docker یک
[صفحه‌ی اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram و Discord کوچک‌تر هستند —
چند سناریو برای هرکدام، بدون سیستم profile، در برابر کانال‌های واقعی از پیش
موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### flagهای مشترک CLI

هر دو مسیر از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان flagها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                   | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | فقط این سناریو را اجرا کن. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | محل نوشتن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                           | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | شناسه حساب موقت داخل پیکربندی Gateway تضمین کیفیت.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` یا `live-frontier` (`live-openai` قدیمی هنوز کار می‌کند).                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                          | ارجاع‌های مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                       | حالت سریع ارائه‌دهنده، در صورت پشتیبانی.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                        | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر دو در صورت شکست هر سناریو با کد غیرصفر خارج می‌شوند. `--allow-failures` آرتیفکت‌ها را بدون تنظیم کد خروجی شکست‌خورده می‌نویسد.

### تضمین کیفیت Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو ربات متمایز هدف می‌گیرد (راه‌انداز + SUT). ربات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده ربات به ربات زمانی بهترین کارکرد را دارد که هر دو ربات **حالت ارتباط ربات به ربات** را در `@BotFather` فعال کرده باشند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض ویرایش می‌کند).

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
- `telegram-qa-summary.json` — شامل RTT هر پاسخ (ارسال راه‌انداز → پاسخ مشاهده‌شده SUT) که با canary شروع می‌شود.
- `telegram-qa-observed-messages.json` — بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### تضمین کیفیت Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو ربات هدف می‌گیرد: یک ربات راه‌انداز که توسط چارچوب آزمون کنترل می‌شود و یک ربات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin همراه Discord شروع می‌شود. مدیریت mention کانال و اینکه ربات SUT فرمان بومی `/help` را در Discord ثبت کرده است، بررسی می‌کند.

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

آرتیفکت‌های خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.

### استخر اعتبارنامه Convex

هر دو lane مربوط به Telegram و Discord می‌توانند به جای خواندن env varهای بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex اجاره کنند. `--credential-source convex` را پاس بدهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک اجاره انحصاری می‌گیرد، در طول اجرای آن را Heartbeat می‌کند، و هنگام خاموش شدن آزاد می‌کند. نوع‌های استخر `"telegram"` و `"discord"` هستند.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید رشته شناسه عددی چت باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

env varهای عملیاتی و قرارداد endpoint مربوط به broker در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش پیش از پشتیبانی Discord انتخاب شده است؛ معنای broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده با مخزن

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمداً در git هستند تا برنامه تضمین کیفیت برای انسان‌ها و
عامل قابل مشاهده باشد.

`qa-lab` باید یک اجراکننده عمومی markdown باقی بماند. هر فایل markdown سناریو
منبع حقیقت برای یک اجرای آزمون است و باید این موارد را تعریف کند:

- فراداده سناریو
- فراداده اختیاری دسته‌بندی، قابلیت، lane و ریسک
- ارجاع‌های مستندات و کد
- نیازمندی‌های اختیاری Plugin
- patch اختیاری پیکربندی Gateway
- `qa-flow` قابل اجرا

سطح runtime قابل استفاده مجدد که پشتوانه `qa-flow` است، مجاز است عمومی
و میان‌بخشی باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport
را با helperهای سمت مرورگر ترکیب کنند که Control UI توکار را از طریق
seam مربوط به Gateway `browser.request` هدایت می‌کنند، بدون اینکه runner ویژه اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشه
درخت منبع. شناسه‌های سناریو را هنگام جابه‌جایی فایل‌ها پایدار نگه دارید؛ برای قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs`
استفاده کنید.

فهرست baseline باید آن‌قدر گسترده بماند که این موارد را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر کنش پیام
- callbackهای cron
- یادآوری حافظه
- تعویض مدل
- تحویل به subagent
- خواندن مخزن و خواندن مستندات
- یک کار build کوچک مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane محلی mock ارائه‌دهنده دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این مورد lane mock قطعی پیش‌فرض
  برای تضمین کیفیت پشتیبانی‌شده با مخزن و دروازه‌های parity باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده مبتنی بر AIMock را برای پوشش آزمایشی protocol،
  fixture، ضبط/بازپخش و chaos شروع می‌کند. این مورد افزایشی است و
  dispatcher سناریوی `mock-openai` را جایگزین نمی‌کند.

پیاده‌سازی lane ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌ها، شروع سرور محلی، پیکربندی مدل Gateway،
نیازهای آماده‌سازی auth-profile، و پرچم‌های قابلیت live/mock خودش است. کد suite و
Gateway مشترک باید به جای شاخه‌زنی بر اساس نام ارائه‌دهنده‌ها، از طریق registry ارائه‌دهنده مسیر‌دهی کند.

## adapterهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای تضمین کیفیت markdown است. `qa-channel` نخستین adapter روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به جای افزودن runner تضمین کیفیت ویژه transport، به همان runner مجموعه متصل شوند.

در سطح معماری، تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، همزمانی worker، نوشتن آرتیفکت و گزارش‌دهی است.
- adapter مربوط به transport مالک پیکربندی Gateway، readiness، مشاهده ورودی و خروجی، کنش‌های transport، و وضعیت نرمال‌سازی‌شده transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای آزمون را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن کانال

افزودن یک کانال به سامانه تضمین کیفیت markdown دقیقاً دو چیز لازم دارد:

1. یک adapter مربوط به transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین می‌دهد.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، ریشه فرمان تضمین کیفیت سطح‌بالای جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای host مشترک است:

- ریشه فرمان `openclaw qa`
- شروع و teardown مجموعه
- همزمانی worker
- نوشتن آرتیفکت
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشه مشترک `qa` نصب می‌شود
- اینکه Gateway برای آن transport چگونه پیکربندی می‌شود
- اینکه readiness چگونه بررسی می‌شود
- اینکه رخدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌سازی‌شده transport چگونه در معرض استفاده قرار می‌گیرند
- اینکه کنش‌های پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup ویژه transport چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به عنوان مالک ریشه مشترک `qa` نگه دارید.
2. runner مربوط به transport را روی seam مربوط به host مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای ویژه transport را داخل runner plugin یا harness کانال نگه دارید.
4. runner را به صورت `openclaw qa <runner>` نصب کنید، نه با ثبت یک فرمان ریشه رقیب. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلان کنند و آرایه مطابق `qaRunnerCliRegistrations` را از `runtime-api.ts` صادر کنند. `runtime-api.ts` را سبک نگه دارید؛ CLI تنبل و اجرای runner باید پشت entrypointهای جداگانه بمانند.
5. سناریوهای markdown را زیر دایرکتوری‌های themed `qa/scenarios/` بنویسید یا سازگار کنید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه مخزن در حال انجام یک migration عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک transport کانال وابسته است، آن را در همان runner plugin یا harness plugin نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند استفاده کند، به جای شاخه ویژه کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک transport معنا دارد، سناریو را ویژه transport نگه دارید و این را در قرارداد سناریو صریح کنید.

### نام helperهای سناریو

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس‌اند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما سناریونویسی جدید باید از نام‌های عمومی استفاده کند. این aliasها برای جلوگیری از migration یک‌باره وجود دارند، نه به عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش protocol در قالب Markdown از timeline گذرگاه مشاهده‌شده صادر می‌کند.
گزارش باید پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- چه سناریوهای پیگیری ارزش افزودن دارند

برای فهرست سناریوهای موجود — که هنگام برآورد حجم کارهای پیگیری یا سیم‌کشی یک ترابرد جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).

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

این دستور فرایندهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker را. سناریوهای ارزیابی شخصیت
باید پرسونا را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های عادی کاربر
مانند گفت‌وگو، کمک درباره فضای کاری، و کارهای کوچک فایل را اجرا کنند. نباید به مدل نامزد
گفته شود که در حال ارزیابی است. این دستور هر رونوشت کامل را حفظ می‌کند،
آمارهای پایه اجرا را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع با
استدلال `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال، و طنز رتبه‌بندی کنند.
هنگام مقایسه ارائه‌دهندگان از `--blind-judge-models` استفاده کنید: اعلان داور همچنان
همه رونوشت‌ها و وضعیت اجرا را دریافت می‌کند، اما ارجاع‌های نامزد با
برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از
تجزیه، رتبه‌بندی‌ها را دوباره به ارجاع‌های واقعی نگاشت می‌کند.
اجراهای نامزد به‌طور پیش‌فرض از thinking برابر با `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای ارجاع‌های ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک نامزد مشخص را به‌صورت درون‌خطی با
`--model provider/model,thinking=<level>` بازنویسی کنید. `--thinking <level>` همچنان یک
پس‌افت سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری حفظ شده است.
ارجاع‌های نامزد OpenAI به‌طور پیش‌فرض از حالت سریع استفاده می‌کنند تا در جاهایی که
ارائه‌دهنده پشتیبانی می‌کند، پردازش اولویت‌دار به‌کار رود. وقتی یک
نامزد یا داور منفرد به بازنویسی نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط زمانی `--fast` را ارسال کنید که می‌خواهید
حالت سریع را برای همه مدل‌های نامزد اجباری کنید. مدت‌زمان‌های نامزد و داور
برای تحلیل بنچمارک در گزارش ثبت می‌شوند، اما اعلان‌های داور صراحتا می‌گویند
که بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل نامزد و داور هر دو به‌طور پیش‌فرض از هم‌زمانی 16 استفاده می‌کنند. وقتی
محدودیت‌های ارائه‌دهنده یا فشار Gateway محلی باعث می‌شود یک اجرا بیش از حد پرنویز شود،
`--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` نامزدی ارسال نشود، ارزیابی شخصیت به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` ارسال نشده باشد.
وقتی هیچ `--judge-model` ارسال نشود، داورها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
