---
read_when:
    - درک نحوهٔ کنار هم قرار گرفتن پشتهٔ QA
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت با واقع‌گرایی بیشتر پیرامون داشبورد Gateway
summary: 'نمای کلی پشتهٔ تضمین کیفیت: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-03T21:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشتهٔ QA خصوصی برای این است که OpenClaw را به شکلی واقعی‌تر و
کانال‌محورتر از آنچه یک آزمون واحد می‌تواند انجام دهد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح پیام مستقیم، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهدهٔ رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکنندهٔ آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های آغازین پشتیبانی‌شده توسط مخزن برای وظیفهٔ شروع و سناریوهای
  پایهٔ QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زندهٔ قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                             | هدف                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                       |
| `qa suite`                                          | اجرای سناریوهای پشتیبانی‌شده توسط مخزن روی مسیر Gateway QA. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف.                                 |
| `qa coverage`                                       | چاپ فهرست پوشش سناریو به صورت markdown (`--json` برای خروجی ماشینی).                                                                                          |
| `qa parity-report`                                  | مقایسهٔ دو فایل `qa-suite-summary.json` و نوشتن گزارش برابری عامل‌محور.                                                                                         |
| `qa character-eval`                                 | اجرای سناریوی QA شخصیت روی چند مدل زنده با گزارش داوری‌شده. [گزارش‌دهی](#reporting) را ببینید.                                                           |
| `qa manual`                                         | اجرای یک prompt تک‌باره روی مسیر ارائه‌دهنده/مدل انتخاب‌شده.                                                                                                         |
| `qa ui`                                             | شروع رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA (نام مستعار: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | ساخت ایمیج Docker ازپیش‌آمادهٔ QA.                                                                                                                                    |
| `qa docker-scaffold`                                | نوشتن داربست docker-compose برای داشبورد QA + مسیر Gateway.                                                                                                   |
| `qa up`                                             | ساخت سایت QA، شروع پشتهٔ پشتیبانی‌شده با Docker، چاپ URL (نام مستعار: `pnpm qa:lab:up`؛ گونهٔ `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند). |
| `qa aimock`                                         | فقط سرور ارائه‌دهندهٔ AIMock را شروع می‌کند.                                                                                                                                 |
| `qa mock-openai`                                    | فقط سرور ارائه‌دهندهٔ سناریوآگاه `mock-openai` را شروع می‌کند.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | مدیریت مخزن مشترک اعتبارنامه‌های Convex.                                                                                                                              |
| `qa matrix`                                         | مسیر انتقال زنده روی یک Tuwunel homeserver یک‌بارمصرف. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                     |
| `qa telegram`                                       | مسیر انتقال زنده روی یک گروه خصوصی واقعی Telegram.                                                                                                             |
| `qa discord`                                        | مسیر انتقال زنده روی یک کانال guild خصوصی واقعی Discord.                                                                                                      |
| `qa mantis`                                         | اجراکنندهٔ راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با نخستین سناریوی واکنش‌های وضعیت Discord. [Mantis](/fa/concepts/mantis) را ببینید.                        |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (رابط کاربری کنترل) همراه با عامل.
- راست: QA Lab، که رونوشت شبیه Slack و طرح سناریو را نشان می‌دهد.

آن را با این اجرا کنید:

```bash
pnpm qa:lab:up
```

این سایت QA را می‌سازد، مسیر Gateway پشتیبانی‌شده با Docker را شروع می‌کند، و صفحهٔ
QA Lab را در دسترس قرار می‌دهد؛ جایی که یک اپراتور یا حلقهٔ خودکارسازی می‌تواند به عامل یک مأموریت QA
بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود باقی ماند.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون ساخت دوبارهٔ ایمیج Docker در هر بار،
پشته را با یک بستهٔ QA Lab متصل‌شده با bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک ایمیج ازپیش‌ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` به صورت bind mount وصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی هش دارایی QA Lab
تغییر کند خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی ردیابی OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

آن اسکریپت یک دریافت‌کنندهٔ محلی ردیابی OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس
spanهای protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید حاضر باشند؛
فراخوانی‌های مدل نباید در turnهای موفق `StreamAbandoned` صادر کنند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. این فایل
`otel-smoke-summary.json` را کنار مصنوع‌های مجموعهٔ QA می‌نویسد.

QA مشاهده‌پذیری فقط مخصوص checkout سورس باقی می‌ماند. tarball npm عمداً
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر ابزارگذاری diagnostics،
از یک checkout سورس ساخته‌شده `pnpm qa:otel:smoke` را اجرا کنید.

برای یک مسیر smoke واقعیِ انتقال Matrix، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، فهرست پروفایل/سناریو، متغیرهای env، و چیدمان مصنوع‌ها برای این مسیر در [Matrix QA](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک Tuwunel homeserver یک‌بارمصرف را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصهٔ JSON، مصنوع رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای مسیرهای smoke واقعیِ انتقال Telegram و Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

هر دو یک کانال واقعی ازپیش‌موجود با دو بات (driver + SUT) را هدف می‌گیرند. متغیرهای env لازم، فهرست‌های سناریو، مصنوع‌های خروجی، و مخزن اعتبارنامهٔ Convex در [مرجع QA مربوط به Telegram و Discord](#telegram-and-discord-qa-reference) در پایین مستند شده‌اند.

پیش از استفاده از اعتبارنامه‌های زندهٔ pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگه‌دارنده حاضر باشد دسترسی‌پذیری admin/list را راستی‌آزمایی می‌کند. فقط وضعیت set/missing را برای secretها گزارش می‌کند.

## پوشش انتقال زنده

مسیرهای انتقال زنده به جای اینکه هرکدام شکل فهرست سناریوی خود را اختراع کنند، یک قرارداد مشترک دارند. `qa-channel` مجموعهٔ مصنوعی گستردهٔ رفتار محصول است و بخشی از ماتریس پوشش انتقال زنده نیست.

| مسیر     | Canary | دروازه‌گذاری mention | بات به بات | انسداد allowlist | پاسخ سطح بالا | ادامه پس از راه‌اندازی مجدد | پیگیری رشته | جداسازی رشته | مشاهدهٔ واکنش | فرمان کمک | ثبت فرمان بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

این کار `qa-channel` را به عنوان مجموعهٔ گستردهٔ رفتار محصول نگه می‌دارد، در حالی که Matrix،
Telegram، و انتقال‌های زندهٔ آینده یک چک‌لیست صریح قرارداد انتقال مشترک دارند.

برای یک مسیر VM لینوکسی یک‌بارمصرف بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این یک مهمان Multipass تازه را boot می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و خلاصهٔ عادی QA را
به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این از همان رفتار انتخاب سناریو مانند `qa suite` روی میزبان استفاده می‌کند.
اجرای مجموعه روی میزبان و Multipass به طور پیش‌فرض چند سناریوی انتخاب‌شده را به صورت موازی
با workerهای Gateway ایزوله اجرا می‌کنند. `qa-channel` به طور پیش‌فرض همزمانی
4 دارد که با تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید، یا برای اجرای سریالی `--concurrency 1`.
وقتی هر سناریویی شکست بخورد، فرمان با کد غیرصفر خارج می‌شود. وقتی
مصنوع‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجرای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای مهمان عملی هستند
forward می‌کند: کلیدهای ارائه‌دهندهٔ مبتنی بر env، مسیر پیکربندی ارائه‌دهندهٔ زندهٔ QA، و
`CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر ریشهٔ مخزن نگه دارید تا مهمان
بتواند از طریق workspace mount‌شده دوباره بنویسد.

## مرجع QA مربوط به Telegram و Discord

Matrix به دلیل تعداد سناریوها و فراهم‌سازی homeserver پشتیبانی‌شده با Docker یک [صفحهٔ اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram و Discord کوچک‌تر هستند — هرکدام چند سناریو، بدون سیستم پروفایل، روی کانال‌های واقعی ازپیش‌موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### فلگ‌های مشترک CLI

هر دو مسیر از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان فلگ‌ها را می‌پذیرند:

| پرچم                                 | پیش‌فرض                                                  | توضیح                                                                                                             |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | جایی که گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی نوشته می‌شوند. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                           | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                         |
| `--sut-account <id>`                  | `sut`                                                     | شناسه حساب موقت داخل پیکربندی Gateway کنترل کیفیت.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` یا `live-frontier` (`live-openai` قدیمی همچنان کار می‌کند).                                         |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                      | ارجاع‌های مدل اصلی/جایگزین.                                                                                      |
| `--fast`                              | خاموش                                                    | حالت سریع ارائه‌دهنده در جاهایی که پشتیبانی شود.                                                                |
| `--credential-source <env\|convex>`   | `env`                                                     | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                  | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                       |

هر دو در صورت شکست هر سناریو با کد غیرصفر خارج می‌شوند. `--allow-failures` آرتیفکت‌ها را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### کنترل کیفیت Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز هدف می‌گیرد (راننده + SUT). بات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده بات‌به‌بات زمانی بهترین کارکرد را دارد که هر دو بات **حالت ارتباط بات‌به‌بات** را در `@BotFather` فعال کرده باشند.

متغیرهای محیطی لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض آن‌ها را پنهان می‌کند).

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
- `telegram-qa-summary.json` — از canary به بعد، RTT هر پاسخ را شامل می‌شود (ارسال راننده → مشاهده پاسخ SUT).
- `telegram-qa-observed-messages.json` — بدنه‌ها پنهان می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### کنترل کیفیت Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات راننده که توسط هارنس کنترل می‌شود و یک بات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده Discord شروع می‌شود. رسیدگی به mention کانال، ثبت شدن فرمان بومی `/help` توسط بات SUT در Discord، و سناریوهای شواهد Mantis با شرکت اختیاری را تأیید می‌کند.

متغیرهای محیطی لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با شناسه کاربر بات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت lane سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سناریوی Mantis با شرکت اختیاری. به‌تنهایی اجرا می‌شود، چون SUT را به پاسخ‌های guild همیشه‌فعال و فقط‌ابزار با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک خط زمانی واکنش REST به‌همراه یک آرتیفکت بصری HTML/PNG ثبت می‌کند.

سناریوی واکنش وضعیت Mantis را صریح اجرا کنید:

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
- `discord-qa-observed-messages.json` — بدنه‌ها پنهان می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` هنگامی که سناریوی واکنش وضعیت اجرا شود.

### استخر اعتبارنامه Convex

هر دو lane مربوط به Telegram و Discord می‌توانند به‌جای خواندن متغیرهای محیطی بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex اجاره کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک اجاره انحصاری می‌گیرد، در طول اجرای آن Heartbeat می‌فرستد، و هنگام خاموشی آن را آزاد می‌کند. انواع استخر `"telegram"` و `"discord"` هستند.

شکل‌های payload که broker در `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک رشته chat-id عددی باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

متغیرهای محیطی عملیاتی و قرارداد endpoint مربوط به broker در [آزمون → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش مربوط به قبل از پشتیبانی Discord است؛ معناشناسی broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده با مخزن

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمداً در git هستند تا طرح کنترل کیفیت هم برای انسان‌ها و هم برای عامل قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی Markdown باقی بماند. هر فایل Markdown سناریو منبع حقیقت برای یک اجرای آزمون است و باید این موارد را تعریف کند:

- metadata سناریو
- metadata اختیاری برای دسته، قابلیت، lane و ریسک
- ارجاع‌های docs و کد
- الزامات Plugin اختیاری
- patch اختیاری پیکربندی Gateway
- `qa-flow` قابل اجرا

سطح runtime قابل استفاده مجدد که پشت `qa-flow` است مجاز است عمومی و cross-cutting باقی بماند. برای مثال، سناریوهای Markdown می‌توانند helperهای سمت transport را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق seam مربوط به `browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner مورد خاص اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشه درخت منبع. هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای ردیابی پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید آن‌قدر گسترده بماند که این موارد را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر کنش پیام
- callbackهای Cron
- یادآوری حافظه
- تغییر مدل
- تحویل به subagent
- خواندن مخزن و خواندن docs
- یک وظیفه ساخت کوچک مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane محلی mock ارائه‌دهنده دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این همچنان lane پیش‌فرض mock قطعی برای کنترل کیفیت پشتیبانی‌شده با مخزن و gateهای parity باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده پشتیبانی‌شده با AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos شروع می‌کند. این افزایشی است و جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی lane ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد. هر ارائه‌دهنده مالک پیش‌فرض‌ها، راه‌اندازی سرور محلی، پیکربندی مدل Gateway، نیازهای staging برای auth-profile، و پرچم‌های قابلیت live/mock خودش است. کد مشترک suite و Gateway باید به‌جای branch زدن روی نام‌های ارائه‌دهنده، از طریق registry ارائه‌دهنده مسیریابی کند.

## آداپتورهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای کنترل کیفیت Markdown است. `qa-channel` نخستین آداپتور روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به‌جای افزودن یک runner کنترل کیفیت مخصوص transport، به همان runner مجموعه وصل شوند.

در سطح معماری، تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، همزمانی worker، نوشتن آرتیفکت و گزارش‌دهی است.
- آداپتور transport مالک پیکربندی Gateway، آمادگی، مشاهده ورودی و خروجی، کنش‌های transport و وضعیت نرمال‌شده transport است.
- فایل‌های سناریوی Markdown زیر `qa/scenarios/` اجرای آزمون را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجددی را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن کانال

افزودن یک کانال به سیستم کنترل کیفیت Markdown دقیقاً به دو چیز نیاز دارد:

1. یک آداپتور transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین دهد.

وقتی میزبان مشترک `qa-lab` می‌تواند flow را مالک شود، ریشه فرمان کنترل کیفیت سطح‌بالای جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- ریشه فرمان `openclaw qa`
- راه‌اندازی و teardown مجموعه
- همزمانی worker
- نوشتن آرتیفکت
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشه مشترک `qa` mount می‌شود
- اینکه Gateway برای آن transport چگونه پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شده transport چگونه نمایان می‌شوند
- اینکه کنش‌های پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص transport چگونه رسیدگی می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک ریشه مشترک `qa` نگه دارید.
2. runner transport را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای مخصوص transport را داخل Plugin runner یا هارنس کانال نگه دارید.
4. runner را به‌صورت `openclaw qa <runner>` mount کنید، نه اینکه یک فرمان ریشه رقیب ثبت کنید. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و آرایه `qaRunnerCliRegistrations` متناظر را از `runtime-api.ts` صادر کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای تنبل CLI و runner باید پشت entrypointهای جداگانه بماند.
5. سناریوهای Markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا سازگار کنید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه مخزن در حال انجام یک مهاجرت عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را می‌توان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک transport کانال وابسته است، آن را در Plugin runner یا هارنس Plugin نگه دارید.
- اگر سناریویی به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای branch مخصوص کانال در `suite.ts`، یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک transport معنا دارد، سناریو را مخصوص transport نگه دارید و این را در قرارداد سناریو صریح کنید.

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

نام‌های مستعار سازگاری برای سناریوهای موجود همچنان در دسترس می‌مانند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نگارش سناریوهای جدید باید از نام‌های عمومی استفاده کند. این نام‌های مستعار برای جلوگیری از مهاجرت یک‌باره وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از خط زمانی bus مشاهده‌شده صادر می‌کند.
گزارش باید به این موارد پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- چه سناریوهای پیگیری ارزش افزودن دارند

برای فهرست سناریوهای موجود — مفید هنگام برآورد اندازه کارهای پیگیری یا سیم‌کشی یک انتقال جدید — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل‌خواندن توسط ماشین `--json` را اضافه کنید).

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

این دستور فرایندهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی شخصیت
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های معمول کاربر
مانند چت، کمک در workspace، و کارهای کوچک فایل را اجرا کنند. به مدل نامزد نباید
گفته شود که در حال ارزیابی است. این دستور هر transcript کامل را حفظ می‌کند،
آمارهای پایه اجرا را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع با
استدلال `xhigh`، در صورت پشتیبانی، می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسه ارائه‌دهندگان از `--blind-judge-models` استفاده کنید: prompt داور همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای نامزد با برچسب‌های خنثی
مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از parsing، رتبه‌بندی‌ها را به refهای واقعی
نگاشت می‌کند.
اجراهای نامزد به‌طور پیش‌فرض از تفکر `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک نامزد مشخص را به‌صورت درون‌خطی با
`--model provider/model,thinking=<level>` بازنویسی کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و قالب قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
refهای نامزد OpenAI به‌طور پیش‌فرض از حالت سریع استفاده می‌کنند تا در صورت پشتیبانی
ارائه‌دهنده، پردازش اولویت‌دار استفاده شود. وقتی یک نامزد یا داور منفرد به بازنویسی نیاز دارد،
`,fast`، `,no-fast`، یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط زمانی `--fast` را پاس دهید که می‌خواهید
حالت سریع را برای هر مدل نامزد اجباری کنید. مدت‌زمان‌های نامزد و داور
برای تحلیل benchmark در گزارش ثبت می‌شوند، اما promptهای داور صراحتا می‌گویند
بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های نامزد و داور هر دو به‌طور پیش‌فرض از هم‌روندی 16 استفاده می‌کنند. وقتی محدودیت‌های ارائه‌دهنده یا فشار Gateway محلی
باعث نویزی‌شدن بیش از حد اجرا می‌شود، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` نامزدی پاس داده نشود، ارزیابی شخصیت به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` پاس داده نشده باشد.
وقتی هیچ `--judge-model` پاس داده نشود، داورها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
