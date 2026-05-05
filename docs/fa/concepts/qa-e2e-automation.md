---
read_when:
    - درک اینکه پشتهٔ تضمین کیفیت چگونه در کنار هم قرار می‌گیرد
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت واقع‌گرایانه‌تر برای داشبورد Gateway
summary: 'نمای کلی پشته QA: qa-lab، qa-channel، سناریوهای پشتیبانی‌شده توسط مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-05-05T06:17:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

استک خصوصی QA برای این است که OpenClaw را به شکلی واقعی‌تر و
شبیه‌تر به کانال، نسبت به آنچه یک تست واحد می‌تواند انجام دهد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطح‌های DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: UI اشکال‌زدا و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را درون یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed پشتیبانی‌شده با repo برای وظیفه آغازین و سناریوهای
  پایه QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده پیش و پس از رفع برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                             | هدف                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                                             |
| `qa suite`                                          | سناریوهای پشتیبانی‌شده با repo را در برابر مسیر Gatewayِ QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک Linux VM یک‌بارمصرف.                                                       |
| `qa coverage`                                       | فهرست پوشش سناریو را به صورت markdown چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری agentic را می‌نویسد.                                                                                                               |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با گزارشی داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                 |
| `qa manual`                                         | یک prompt تک‌باره را در برابر مسیر provider/model انتخاب‌شده اجرا می‌کند.                                                                                                                               |
| `qa ui`                                             | UI اشکال‌زدای QA و گذرگاه محلی QA را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | تصویر Docker از پیش آماده QA را می‌سازد.                                                                                                                                                          |
| `qa docker-scaffold`                                | یک scaffold از docker-compose برای داشبورد QA + مسیر Gateway می‌نویسد.                                                                                                                         |
| `qa up`                                             | سایت QA را می‌سازد، استک پشتیبانی‌شده با Docker را شروع می‌کند، و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                       |
| `qa aimock`                                         | فقط سرور providerِ AIMock را شروع می‌کند.                                                                                                                                                       |
| `qa mock-openai`                                    | فقط سرور providerِ سناریوآگاه `mock-openai` را شروع می‌کند.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن مشترک credentialهای Convex را مدیریت می‌کند.                                                                                                                                                    |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریس](/fa/concepts/qa-matrix) را ببینید.                                                                                           |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                   |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                            |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                    |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی پیش و پس از رفع برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox، و smoke مربوط به Slack در VNC. [Mantis](/fa/concepts/mantis) را ببینید. |

## جریان عملگر

جریان فعلی عملگر QA یک سایت QA دو پنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) با agent.
- راست: QA Lab، که رونوشت شبیه Slack و طرح سناریو را نشان می‌دهد.

آن را با این اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، مسیر Gateway پشتیبانی‌شده با Docker را شروع می‌کند، و صفحه
QA Lab را در دسترس قرار می‌دهد؛ جایی که یک عملگر یا حلقه خودکارسازی می‌تواند به agent یک مأموریت QA
بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود ماند.

برای تکرار سریع‌تر روی UIِ QA Lab بدون بازسازی تصویر Docker در هر بار،
استک را با بسته QA Lab متصل‌شده با bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را درون containerِ `qa-lab` با bind mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر بازسازی می‌کند، و مرورگر وقتی hash دارایی QA Lab
تغییر کند، خودکار reload می‌شود.

برای یک smoke محلی trace در OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک دریافت‌کننده trace محلی OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Pluginِ `diagnostics-otel` فعال اجرا می‌کند، سپس
spanهای protobuf صادرشده را decode می‌کند و شکل حیاتی برای release را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید حاضر باشند؛
فراخوانی‌های مدل نباید در نوبت‌های موفق `StreamAbandoned` صادر کنند؛ IDهای خام diagnostic و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای suiteِ QA می‌نویسد.

QA مشاهده‌پذیری فقط برای source checkout باقی می‌ماند. بسته npm عمدا
QA Lab را حذف می‌کند، بنابراین مسیرهای release مربوط به Docker package فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر instrumentation مربوط به diagnostics،
از یک source checkout ساخته‌شده، `pnpm qa:otel:smoke` را استفاده کنید.

برای یک مسیر smoke ماتریس با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، env varها، و چیدمان artifact برای این مسیر در [QA ماتریس](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver یک‌بارمصرف Tuwunel را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را درون یک Gateway فرزند QA محدود به آن انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

برای مسیرهای smoke با انتقال واقعی Telegram، Discord، و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

آن‌ها یک کانال واقعی از پیش موجود با دو bot (driver + SUT) را هدف می‌گیرند. env varهای لازم، فهرست‌های سناریو، artifactهای خروجی، و مخزن credentialهای Convex در [مرجع QA تلگرام، دیسکورد، و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای اجرای کامل Slack desktop VM با نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این فرمان یک ماشین دسکتاپ/مرورگر Crabbox اجاره می‌کند، مسیر زنده Slack را
درون VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را capture می‌کند، و
وقتی capture ویدئو در دسترس باشد، `slack-qa/`، `slack-desktop-smoke.png`، و `slack-desktop-smoke.mp4`
را به دایرکتوری artifactهای Mantis کپی می‌کند. پس از ورود دستی به Slack Web
از طریق VNC، از `--lease-id <cbx_...>` دوباره استفاده کنید. با `--gateway-setup`، Mantis یک Gateway پایدار Slack مربوط به OpenClaw
را درون VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان مسیر عادی QA
bot-to-bot مربوط به Slack را اجرا می‌کند و پس از capture کردن artifact خارج می‌شود.

برای یک وظیفه دسکتاپ به سبک agent/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` یک ماشین دسکتاپ/مرورگر Crabbox را اجاره می‌کند یا دوباره به‌کار می‌گیرد، سپس
`crabbox record --while` را شروع می‌کند، مرورگر قابل مشاهده را از طریق یک
`visual-driver` تودرتو هدایت می‌کند، `visual-task.png` را capture می‌کند، وقتی `--vision-mode image-describe` انتخاب شده باشد
`openclaw infer image describe` را روی اسکرین‌شات اجرا می‌کند، و
`visual-task.mp4`، `mantis-visual-task-summary.json`،
`mantis-visual-task-driver-result.json`، و `mantis-visual-task-report.md` را می‌نویسد.
وقتی `--expect-text` تنظیم شده باشد، prompt بینایی یک حکم JSON ساخت‌یافته می‌خواهد
و فقط وقتی عبور می‌کند که مدل شواهد قابل مشاهده مثبت گزارش دهد؛ یک پاسخ
منفی که صرفا متن هدف را نقل می‌کند، assertion را fail می‌کند.
از `--vision-mode metadata` برای یک smoke بدون مدل استفاده کنید که دسکتاپ،
مرورگر، اسکرین‌شات، و مسیر ویدئو را بدون فراخوانی providerِ درک تصویر
اثبات می‌کند. ضبط یک artifact الزامی برای `visual-task` است؛ اگر Crabbox
هیچ `visual-task.mp4` غیرخالی ضبط نکند، وظیفه fail می‌شود حتی اگر visual driver
pass شده باشد. در صورت شکست، Mantis اجاره را برای VNC نگه می‌دارد مگر اینکه وظیفه از قبل
pass شده باشد و `--keep-lease` تنظیم نشده باشد.

پیش از استفاده از credentialهای زنده pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret مربوط به maintainer حاضر باشد دسترسی admin/list را راستی‌آزمایی می‌کند. فقط وضعیت set/missing را برای secretها گزارش می‌دهد.

## پوشش انتقال زنده

مسیرهای انتقال زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را اختراع کنند، یک قرارداد مشترک دارند. `qa-channel` مجموعه وسیع مصنوعی رفتار محصول است و بخشی از ماتریس پوشش انتقال زنده نیست.

| خط      | Canary | دروازه‌گذاری ذکر | Bot-to-bot | مسدودسازی Allowlist | پاسخ سطح بالا | ازسرگیری پس از راه‌اندازی مجدد | پیگیری Thread | جداسازی Thread | مشاهده واکنش | فرمان راهنما | ثبت فرمان بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، درحالی‌که Matrix،
Telegram و انتقال‌های زنده آینده یک چک‌لیست صریح قرارداد انتقال را
به‌اشتراک می‌گذارند.

برای یک خط ماشین مجازی Linux دورریختنی بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این فرمان یک مهمان تازه Multipass را راه‌اندازی می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را
داخل مهمان می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و
خلاصه عادی QA را به `.artifacts/qa-e2e/...` روی میزبان کپی می‌کند.
این همان رفتار انتخاب سناریوی `qa suite` روی میزبان را دوباره استفاده می‌کند.
اجرای مجموعه روی میزبان و Multipass، به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را به‌طور موازی
با کارگرهای Gateway ایزوله اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض همزمانی
4 دارد که به تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای تنظیم تعداد
کارگرها از `--concurrency <count>` استفاده کنید، یا برای اجرای ترتیبی `--concurrency 1` را به‌کار ببرید.
وقتی هر سناریویی شکست بخورد، فرمان با کد غیرصفر خارج می‌شود. وقتی
مصنوعه‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای
مهمان عملی هستند ارسال می‌کنند: کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و
`CODEX_HOME` در صورت وجود. `--output-dir` را زیر ریشه مخزن نگه دارید تا مهمان
بتواند از طریق فضای کاری mount‌شده بنویسد.

## مرجع QA برای Telegram، Discord و Slack

Matrix به‌دلیل تعداد سناریوها و آماده‌سازی homeserver مبتنی بر Docker، یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord و Slack کوچک‌تر هستند — هرکدام چند سناریو، بدون سیستم پروفایل، در برابر کانال‌های واقعی از پیش موجود — بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های CLI مشترک

این خط‌ها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | محل نوشتن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | شناسه حساب موقت داخل پیکربندی Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier` (`live-openai` قدیمی هنوز کار می‌کند).                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                                | ارجاع‌های مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                             | حالت سریع ارائه‌دهنده، هرجا پشتیبانی شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [مخزن اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر خط در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` مصنوعه‌ها را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو ربات متمایز هدف می‌گیرد (driver + SUT). ربات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده bot-to-bot وقتی هر دو ربات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند، بهترین عملکرد را دارد.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعه‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض بازنویسی محرمانه می‌کند).

سناریوها (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

مصنوعه‌های خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — شامل RTT هر پاسخ (ارسال driver → مشاهده پاسخ SUT) از canary به بعد.
- `telegram-qa-observed-messages.json` — بدنه‌ها بازنویسی محرمانه می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو ربات هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin همراه Discord شروع می‌شود. مدیریت ذکر کانال، ثبت فرمان بومی `/help` توسط ربات SUT در Discord، و سناریوهای شواهد Mantis که با انتخاب صریح فعال می‌شوند را تأیید می‌کند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — باید با شناسه کاربر ربات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت خط سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعه‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — سناریوی Mantis با انتخاب صریح. به‌تنهایی اجرا می‌شود چون SUT را به پاسخ‌های guild همیشه‌فعال و فقط‌ابزار با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک خط زمانی واکنش REST به‌همراه مصنوعه‌های بصری HTML/PNG ثبت می‌کند. گزارش‌های قبل/بعد Mantis همچنین مصنوعه‌های MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی واکنش وضعیت Mantis را صریح اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

مصنوعه‌های خروجی:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — بدنه‌ها بازنویسی محرمانه می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی واکنش وضعیت اجرا می‌شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو ربات متمایز هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin همراه Slack شروع می‌شود.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعه‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

مصنوعه‌های خروجی:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — بدنه‌ها بازنویسی محرمانه می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

#### راه‌اندازی فضای کاری Slack

این خط به دو برنامه Slack متمایز در یک فضای کاری، به‌علاوه کانالی که هر دو ربات عضو آن باشند نیاز دارد:

- `channelId` — شناسه `Cxxxxxxxxxx` کانالی که هر دو ربات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این خط در هر اجرا پست می‌گذارد.
- `driverBotToken` — توکن ربات (`xoxb-...`) برنامه **Driver**.
- `sutBotToken` — توکن ربات (`xoxb-...`) برنامه **SUT** که باید یک برنامه Slack جدا از driver باشد تا شناسه کاربر ربات آن متمایز باشد.
- `sutAppToken` — توکن سطح برنامه (`xapp-...`) برنامه SUT با `connections:write`، که توسط Socket Mode استفاده می‌شود تا برنامه SUT بتواند رویدادها را دریافت کند.

استفاده از یک فضای کاری Slack اختصاصی برای QA را به استفاده مجدد از فضای کاری تولید ترجیح دهید.

manifest زیر برای SUT نصب تولید Plugin همراه Slack را بازتاب می‌دهد (`extensions/slack/src/setup-shared.ts:10`). برای راه‌اندازی کانال تولید آن‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمداً جداست چون خط به دو شناسه کاربر ربات متمایز در یک فضای کاری نیاز دارد.

**1. برنامه Driver را ایجاد کنید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _Create New App_ → _From a manifest_ → فضای کاری QA را انتخاب کنید، manifest زیر را جای‌گذاری کنید، سپس _Install to Workspace_:

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید — این همان `driverBotToken` می‌شود. driver فقط باید پیام پست کند و خودش را شناسایی کند؛ نه رویداد، نه Socket Mode.

**2. برنامه SUT را ایجاد کنید**

_Create New App → From a manifest_ را در همان فضای کاری تکرار کنید. مجموعه scope نصب تولید Plugin همراه Slack را بازتاب می‌دهد (`extensions/slack/src/setup-shared.ts:10`):

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

پس از اینکه Slack برنامه را ایجاد کرد، در صفحه تنظیمات آن دو کار انجام دهید:

- _نصب در فضای کاری_ → _Bot User OAuth Token_ را کپی کنید → این مقدار به `sutBotToken` تبدیل می‌شود.
- _اطلاعات پایه → توکن‌های سطح برنامه → تولید توکن و دامنه‌ها_ → دامنه `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار به `sutAppToken` تبدیل می‌شود.

با فراخوانی `auth.test` روی هر توکن، بررسی کنید که دو ربات شناسه‌های کاربری متمایز دارند. زمان اجرا درایور و SUT را با شناسه کاربری تشخیص می‌دهد؛ استفاده دوباره از یک برنامه برای هر دو، کنترل دروازه‌ای mention را بلافاصله شکست می‌دهد.

**۳. کانال را ایجاد کنید**

در فضای کاری QA، یک کانال ایجاد کنید (مثلاً `#openclaw-qa`) و هر دو ربات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _اطلاعات کانال → درباره → شناسه کانال_ کپی کنید؛ این مقدار به `channelId` تبدیل می‌شود. یک کانال عمومی کافی است؛ اگر از کانال خصوصی استفاده کنید، هر دو برنامه از قبل `groups:history` دارند، بنابراین خواندن تاریخچه توسط هارنس همچنان موفق خواهد شد.

**۴. اعتبارنامه‌ها را ثبت کنید**

دو گزینه دارید. برای اشکال‌زدایی روی یک ماشین، از متغیرهای محیطی استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس بدهید)، یا مخزن مشترک Convex را seed کنید تا CI و نگه‌دارندگان دیگر بتوانند آن‌ها را lease کنند.

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

**۵. انتها به انتها بررسی کنید**

مسیر را به‌صورت محلی اجرا کنید تا تأیید شود هر دو ربات می‌توانند از طریق کارگزار با یکدیگر صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` نشان می‌دهد هر دو `slack-canary` و `slack-mention-gating` در وضعیت `pass` هستند. اگر مسیر حدود ۹۰ ثانیه متوقف بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا مخزن خالی است یا همه ردیف‌ها lease شده‌اند؛ `qa credentials list --kind slack --status all --json` مشخص می‌کند کدام مورد است.

### مخزن اعتبارنامه Convex

مسیرهای Telegram، Discord و Slack می‌توانند به‌جای خواندن متغیرهای محیطی بالا، اعتبارنامه‌ها را از یک مخزن مشترک Convex lease کنند. `--credential-source convex` را پاس بدهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease اختصاصی می‌گیرد، برای مدت اجرای آن Heartbeat می‌فرستد، و هنگام خاموشی آن را آزاد می‌کند. نوع‌های مخزن `"telegram"`، `"discord"` و `"slack"` هستند.

شکل payloadهایی که کارگزار در `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` باید یک رشته عددی chat-id باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` باید با `^[A-Z][A-Z0-9]+$` مطابقت داشته باشد (یک شناسه Slack مانند `Cxxxxxxxxxx`). برای فراهم‌سازی برنامه و دامنه‌ها، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

متغیرهای محیطی عملیاتی و قرارداد endpoint کارگزار Convex در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش مربوط به پیش از پشتیبانی Discord است؛ معناشناسی کارگزار برای هر دو نوع یکسان است).

## Seedهای پشتیبانی‌شده با repo

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمداً در git هستند تا برنامه QA برای انسان‌ها و agent قابل مشاهده باشد.

`qa-lab` باید یک اجراکننده عمومی markdown باقی بماند. هر فایل markdown سناریو منبع حقیقت برای یک اجرای آزمایش است و باید این موارد را تعریف کند:

- فراداده سناریو
- فراداده اختیاری دسته، قابلیت، مسیر و ریسک
- ارجاع‌های مستندات و کد
- نیازمندی‌های اختیاری Plugin
- وصله اختیاری پیکربندی Gateway
- `qa-flow` قابل اجرا

سطح زمان اجرای قابل استفاده مجدد که از `qa-flow` پشتیبانی می‌کند، مجاز است عمومی و cross-cutting باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق seam ‏`browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner ویژه‌ای اضافه شود.

فایل‌های سناریو باید به‌جای پوشه source tree، بر اساس قابلیت محصول گروه‌بندی شوند. هنگام جابه‌جایی فایل‌ها شناسه‌های سناریو را پایدار نگه دارید؛ برای قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید به‌اندازه کافی گسترده بماند تا این موارد را پوشش دهد:

- گفت‌وگوی DM و کانال
- رفتار thread
- چرخه عمر action پیام
- callbackهای cron
- یادآوری حافظه
- تعویض مدل
- handoff زیر-agent
- خواندن repo و خواندن مستندات
- یک کار build کوچک مانند Lobster Invaders

## مسیرهای mock ارائه‌دهنده

`qa suite` دو مسیر mock ارائه‌دهنده محلی دارد:

- `mock-openai` همان mock آگاه از سناریوی OpenClaw است. این مسیر همچنان مسیر mock قطعی پیش‌فرض برای QA پشتیبانی‌شده با repo و parity gateها باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده پشتیبانی‌شده با AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos راه‌اندازی می‌کند. این افزایشی است و جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی مسیر ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد. هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل Gateway، نیازهای staging پروفایل auth و پرچم‌های قابلیت live/mock است. کد مشترک suite و gateway باید به‌جای branch زدن روی نام ارائه‌دهنده‌ها، از طریق رجیستری ارائه‌دهنده route شود.

## آداپتورهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای QA مبتنی بر markdown است. `qa-channel` نخستین آداپتور روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا synthetic آینده باید به‌جای افزودن runner QA مخصوص transport، به همان suite runner وصل شوند.

در سطح معماری، این تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی worker، نوشتن artifact و گزارش‌دهی است.
- آداپتور transport مالک پیکربندی gateway، آمادگی، مشاهده inbound و outbound، actionهای transport و وضعیت normalizeشده transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای آزمایش را تعریف می‌کنند؛ `qa-lab` سطح زمان اجرای قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن کانال

افزودن کانال به سیستم QA مبتنی بر markdown دقیقاً به دو چیز نیاز دارد:

1. یک آداپتور transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین کند.

وقتی میزبان مشترک `qa-lab` می‌تواند مالک جریان باشد، root command سطح بالای QA جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- root دستور `openclaw qa`
- راه‌اندازی و teardown مجموعه
- هم‌زمانی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه gateway چگونه برای آن transport پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای inbound چگونه inject می‌شوند
- اینکه پیام‌های outbound چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت normalizeشده transport چگونه در دسترس قرار می‌گیرند
- اینکه actionهای پشتیبانی‌شده با transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص transport چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک root مشترک `qa` نگه دارید.
2. runner مربوط به transport را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای مخصوص transport را داخل Plugin runner یا هارنس کانال نگه دارید.
4. runner را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک root command رقیب. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایه مطابق `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy CLI و runner باید پشت entrypointهای جداگانه بماند.
5. سناریوهای markdown را زیر دایرکتوری‌های themeشده `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک مهاجرت عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک transport کانال وابسته است، آن را در همان Plugin runner یا هارنس Plugin نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای branch مخصوص کانال در `suite.ts`، یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک transport معنا دارد، سناریو را مخصوص transport نگه دارید و آن را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند — `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` — اما نگارش سناریوهای جدید باید از نام‌های عمومی استفاده کند. این aliasها برای اجتناب از مهاجرت flag-day وجود دارند، نه به‌عنوان الگوی آینده.

## گزارش‌دهی

`qa-lab` یک گزارش protocol به‌صورت Markdown را از timeline مشاهده‌شده bus export می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- کدام سناریوهای پیگیری ارزش اضافه شدن دارند

برای فهرست سناریوهای موجود — که هنگام برآورد کار پیگیری یا سیم‌کشی یک transport جدید مفید است — `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).

برای بررسی‌های کاراکتر و سبک، همان سناریو را روی چندین ref مدل live اجرا کنید و یک گزارش Markdown داوری‌شده بنویسید:

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

این فرمان فرایندهای فرزند Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی کاراکتر باید شخصیت را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های معمول کاربر مانند گفتگو، کمک درباره فضای کاری، و کارهای کوچک روی فایل را اجرا کنند. به مدل نامزد نباید گفته شود که در حال ارزیابی است. این فرمان هر رونوشت کامل را حفظ می‌کند، آمارهای پایه اجرای آن را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع با استدلال `xhigh`، در مواردی که پشتیبانی می‌شود، می‌خواهد اجراها را بر اساس طبیعی‌بودن، حال‌وهوا و طنز رتبه‌بندی کنند. هنگام مقایسه ارائه‌دهندگان از `--blind-judge-models` استفاده کنید: درخواست داور همچنان هر رونوشت و وضعیت اجرا را دریافت می‌کند، اما ارجاع‌های نامزد با برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از تجزیه، رتبه‌بندی‌ها را دوباره به ارجاع‌های واقعی نگاشت می‌کند.
اجراهای نامزد به‌صورت پیش‌فرض از thinking با مقدار `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh` برای ارجاع‌های ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک نامزد خاص را به‌صورت درون‌خطی با `--model provider/model,thinking=<level>` بازنویسی کنید. `--thinking <level>` همچنان یک fallback سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای سازگاری حفظ شده است.
ارجاع‌های نامزد OpenAI به‌صورت پیش‌فرض از حالت سریع استفاده می‌کنند تا در جاهایی که ارائه‌دهنده پشتیبانی می‌کند، پردازش اولویت‌دار به کار رود. وقتی یک نامزد یا داور خاص به بازنویسی نیاز دارد، `,fast`، `,no-fast` یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط زمانی `--fast` را پاس دهید که می‌خواهید حالت سریع را برای هر مدل نامزد اجباری کنید. مدت‌زمان‌های نامزد و داور برای تحلیل benchmark در گزارش ثبت می‌شوند، اما درخواست‌های داور صراحتا می‌گویند که بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل نامزد و داور هر دو به‌صورت پیش‌فرض از همزمانی 16 استفاده می‌کنند. وقتی محدودیت‌های ارائه‌دهنده یا فشار Gateway محلی باعث می‌شود یک اجرا بیش از حد پرنویز شود، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` نامزدی پاس داده نشود، ارزیابی کاراکتر به‌صورت پیش‌فرض از `openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`، `anthropic/claude-sonnet-4-6`، `zai/glm-5.1`، `moonshot/kimi-k2.5` و `google/gemini-3.1-pro-preview` استفاده می‌کند.
وقتی هیچ `--judge-model` پاس داده نشود، داورها به‌صورت پیش‌فرض `openai/gpt-5.5,thinking=xhigh,fast` و `anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
