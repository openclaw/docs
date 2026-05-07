---
read_when:
    - درک نحوهٔ کنار هم قرار گرفتن پشتهٔ تضمین کیفیت
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ایجاد خودکارسازی QA واقع‌گرایانه‌تر پیرامون داشبورد Gateway
summary: 'نمای کلی پشته تضمین کیفیت: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-07T13:16:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشتهٔ QA خصوصی برای آن است که OpenClaw را به روشی واقعی‌تر و
شبیه‌تر به کانال نسبت به یک آزمون واحد اجرا کند.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدا و گذرگاه QA برای مشاهدهٔ رونوشت،
  تزریق پیام‌های ورودی، و برون‌بری گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراگر آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed مبتنی بر repo برای وظیفهٔ آغازین و سناریوهای
  پایهٔ QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زندهٔ پیش و پس از اشکال‌هایی که
  به انتقال‌های واقعی، نماگرفت‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودآزمایی QA بسته‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                                                                                                                        |
| `qa suite`                                          | سناریوهای مبتنی بر repo را در برابر مسیر Gateway مربوط به QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی موقتی.                                                                                                                                  |
| `qa coverage`                                       | فهرست پوشش سناریو به صورت markdown را چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                                                                                           |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری agentic را می‌نویسد.                                                                                                                                                                                          |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با یک گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                            |
| `qa manual`                                         | یک پرامپت یک‌باره را در برابر مسیر ارائه‌دهنده/مدل انتخاب‌شده اجرا می‌کند.                                                                                                                                                                                                          |
| `qa ui`                                             | رابط کاربری اشکال‌زدای QA و گذرگاه QA محلی را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | تصویر Docker ازپیش‌ساختهٔ QA را می‌سازد.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | یک داربست docker-compose برای داشبورد QA + مسیر Gateway می‌نویسد.                                                                                                                                                                                                    |
| `qa up`                                             | سایت QA را می‌سازد، پشتهٔ مبتنی بر Docker را شروع می‌کند، و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونهٔ `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                                                                  |
| `qa aimock`                                         | فقط سرور ارائه‌دهندهٔ AIMock را شروع می‌کند.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | فقط سرور ارائه‌دهندهٔ آگاه از سناریوی `mock-openai` را شروع می‌کند.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | مجموعهٔ مشترک اعتبارنامه‌های Convex را مدیریت می‌کند.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver موقتی Tuwunel. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                                      |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | اجراگر راستی‌آزمایی پیش و پس از اشکال‌های انتقال زنده، با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox، و smoke مربوط به Slack در VNC. [Mantis](/fa/concepts/mantis) و [راهنمای اجرای دسکتاپ Slack در Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه با عامل.
- راست: QA Lab، که رونوشت شبیه Slack و برنامهٔ سناریو را نشان می‌دهد.

آن را با این دستور اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، مسیر Gateway مبتنی بر Docker را شروع می‌کند، و صفحهٔ
QA Lab را در دسترس می‌گذارد؛ جایی که اپراتور یا حلقهٔ خودکارسازی می‌تواند به عامل
یک مأموریت QA بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد،
شکست خورد، یا همچنان مسدود ماند.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون بازسازی تصویر Docker در هر بار،
پشته را با یک بستهٔ QA Lab که به صورت bind mount متصل شده شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر ازپیش‌ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` به صورت bind-mount متصل
می‌کند. `qa:lab:watch` آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی hash
دارایی QA Lab تغییر کند، خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی ردگیری OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک دریافت‌کنندهٔ ردگیری OTLP/HTTP محلی را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin فعال `diagnostics-otel` اجرا می‌کند، سپس spanهای
protobuf برون‌بری‌شده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید حاضر باشند؛
فراخوانی‌های مدل نباید در گردش‌های موفق `StreamAbandoned` را برون‌بری کنند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید بیرون از ردگیری بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای مجموعهٔ QA می‌نویسد.

QA مشاهده‌پذیری فقط برای checkout کد منبع است. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته دستورهای `qa` را اجرا
نمی‌کنند. هنگام تغییر instrumention تشخیصی، از یک checkout ساخته‌شدهٔ منبع
`pnpm qa:otel:smoke` را اجرا کنید.

برای یک مسیر smoke واقعی از نظر انتقال برای Matrix، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/سناریو، env varها، و چیدمان artifact برای این مسیر در [Matrix QA](/fa/concepts/qa-matrix) قرار دارد. خلاصه: این مسیر یک homeserver موقتی Tuwunel را در Docker آماده می‌کند، کاربرهای موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصهٔ JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار انتقالی را پوشش می‌دهند که آزمون‌های واحد نمی‌توانند به صورت end to end اثبات کنند: mention gating، سیاست‌های allow-bot، allowlistها، پاسخ‌های سطح بالا و رشته‌ای، مسیریابی DM، مدیریت واکنش، سرکوب ویرایش ورودی، dedupe بازپخش پس از راه‌اندازی مجدد، بازیابی از وقفهٔ homeserver، تحویل فرادادهٔ تأیید، مدیریت رسانه، و جریان‌های bootstrap/recovery/verification مربوط به Matrix E2EE. profile مربوط به E2EE در CLI همچنین `openclaw matrix encryption setup` و دستورهای verification را از طریق همان homeserver موقتی پیش از بررسی پاسخ‌های Gateway اجرا می‌کند.

Discord همچنین سناریوهای opt-in فقط مخصوص Mantis برای بازتولید اشکال دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح واکنش وضعیت
استفاده کنید، یا از `--scenario discord-thread-reply-filepath-attachment` برای
ساخت یک رشتهٔ واقعی Discord و راستی‌آزمایی اینکه `message.thread-reply` یک
پیوست `filePath` را حفظ می‌کند. این سناریوها بیرون از مسیر پیش‌فرض زندهٔ Discord
می‌مانند، چون probeهای بازتولید پیش/پس هستند نه پوشش smoke گسترده.
گردش کار Mantis مربوط به پیوست رشته می‌تواند وقتی
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد، یک
ویدیوی شاهد Discord Web با نشست واردشده نیز اضافه کند. آن profile بیننده فقط
برای ضبط بصری است؛ تصمیم pass/fail همچنان از oracle مربوط به Discord REST می‌آید.

CI از همان سطح فرمان در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند. اجراهای زمان‌بندی‌شده و دستی پیش‌فرض، profile سریع Matrix را با اعتبارنامه‌های frontier زنده، `--fast`، و `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. اجرای دستی `matrix_profile=all` به پنج shard مربوط به profileها منشعب می‌شود تا کاتالوگ جامع بتواند به‌صورت موازی اجرا شود و در عین حال برای هر shard یک دایرکتوری artifact جدا نگه دارد.

برای مسیرهای smoke واقعی از نظر انتقال برای Telegram، Discord، و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

آن‌ها یک کانال واقعی از پیش موجود را با دو bot هدف می‌گیرند (driver + SUT). env varهای لازم، فهرست سناریوها، artifactهای خروجی، و مجموعهٔ اعتبارنامهٔ Convex در [مرجع QA برای Telegram، Discord، و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای اجرای کامل VM دسکتاپ Slack با نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این دستور یک ماشین دسکتاپ/مرورگر Crabbox اجاره می‌کند، مسیر زنده Slack را داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، از دسکتاپ تصویر می‌گیرد و وقتی ضبط ویدئو در دسترس باشد `slack-qa/`، `slack-desktop-smoke.png` و `slack-desktop-smoke.mp4` را به دایرکتوری artifact مربوط به Mantis برمی‌گرداند. اجاره‌های دسکتاپ/مرورگر Crabbox ابزارهای capture و بسته‌های کمکی مرورگر/native-build را از قبل فراهم می‌کنند، بنابراین سناریو فقط باید روی اجاره‌های قدیمی‌تر fallbackها را نصب کند. Mantis زمان‌بندی‌های کلی و هر فاز را در `mantis-slack-desktop-smoke-report.md` گزارش می‌کند تا اجراهای کند نشان دهند زمان صرف warmup اجاره، دریافت اعتبارنامه، راه‌اندازی remote یا کپی artifact شده است. پس از ورود دستی به Slack Web از طریق VNC، از `--lease-id <cbx_...>` دوباره استفاده کنید؛ اجاره‌های استفاده‌شده دوباره cache فروشگاه pnpm مربوط به Crabbox را هم گرم نگه می‌دارند. مقدار پیش‌فرض `--hydrate-mode source` از checkout سورس صحت‌سنجی می‌کند و install/build را داخل VM اجرا می‌کند. فقط وقتی از `--hydrate-mode prehydrated` استفاده کنید که workspace remote استفاده‌شده دوباره از قبل `node_modules` و `dist/` ساخته‌شده داشته باشد؛ آن حالت مرحله پرهزینه install/build را رد می‌کند و وقتی workspace آماده نباشد به‌صورت بسته fail می‌شود. با `--gateway-setup`، Mantis یک OpenClaw Slack gateway پایدار را داخل VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، دستور مسیر معمول QA Slack بات‌به‌بات را اجرا می‌کند و پس از capture artifact خارج می‌شود.

چک‌لیست اپراتور، دستور dispatch گردش‌کار GitHub، قرارداد evidence-comment، جدول تصمیم hydrate-mode، تفسیر زمان‌بندی و گام‌های مدیریت شکست در [Runbook دسکتاپ Mantis Slack](/fa/concepts/mantis-slack-desktop-runbook) قرار دارند.

برای یک وظیفه دسکتاپ به سبک عامل/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` یک ماشین دسکتاپ/مرورگر Crabbox را اجاره می‌کند یا دوباره استفاده می‌کند، `crabbox record --while` را شروع می‌کند، مرورگر قابل‌مشاهده را از طریق یک `visual-driver` تو در تو هدایت می‌کند، `visual-task.png` را capture می‌کند، وقتی `--vision-mode image-describe` انتخاب شده باشد `openclaw infer image describe` را روی screenshot اجرا می‌کند و `visual-task.mp4`، `mantis-visual-task-summary.json`، `mantis-visual-task-driver-result.json` و `mantis-visual-task-report.md` را می‌نویسد. وقتی `--expect-text` تنظیم شده باشد، prompt بینایی یک verdict ساخت‌یافته JSON درخواست می‌کند و فقط وقتی pass می‌شود که مدل شواهد قابل‌مشاهده مثبت گزارش کند؛ پاسخ منفی که صرفا متن هدف را نقل‌قول کند assertion را fail می‌کند. برای یک smoke بدون مدل که دسکتاپ، مرورگر، screenshot و لوله‌کشی ویدئو را بدون فراخوانی provider فهم تصویر اثبات می‌کند، از `--vision-mode metadata` استفاده کنید. Recording یک artifact الزامی برای `visual-task` است؛ اگر Crabbox هیچ `visual-task.mp4` غیرخالی‌ای ضبط نکند، حتی اگر visual driver pass شده باشد، وظیفه fail می‌شود. هنگام شکست، Mantis اجاره را برای VNC نگه می‌دارد مگر اینکه وظیفه قبلا pass شده باشد و `--keep-lease` تنظیم نشده باشد.

پیش از استفاده از اعتبارنامه‌های زنده pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند و وقتی secret نگه‌دارنده حاضر باشد دسترسی admin/list را صحت‌سنجی می‌کند. برای secretها فقط وضعیت تنظیم‌شده/مفقود را گزارش می‌کند.

## پوشش transport زنده

مسیرهای transport زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعه گسترده رفتار محصول synthetic است و بخشی از ماتریس پوشش transport زنده نیست.

| مسیر     | Canary | gating اشاره | بات‌به‌بات | مسدودسازی allowlist | پاسخ سطح بالا | ادامه پس از restart | پیگیری thread | جداسازی thread | مشاهده reaction | دستور help | ثبت دستور native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، در حالی که Matrix، Telegram و transportهای زنده آینده یک چک‌لیست صریح قرارداد transport مشترک دارند.

برای یک مسیر VM یک‌بارمصرف Linux بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این دستور یک مهمان تازه Multipass بوت می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw را داخل مهمان build می‌کند، `qa suite` را اجرا می‌کند، سپس گزارش و summary معمول QA را به `.artifacts/qa-e2e/...` روی host برمی‌گرداند.
این همان رفتار انتخاب سناریوی `qa suite` روی host را دوباره استفاده می‌کند.
اجراهای مجموعه روی host و Multipass به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی با gateway workerهای جداشده اجرا می‌کنند. `qa-channel` به‌طور پیش‌فرض concurrency 4 دارد که با تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای تنظیم تعداد workerها از `--concurrency <count>`، یا برای اجرای سریالی از `--concurrency 1` استفاده کنید.
وقتی هر سناریویی fail شود، دستور با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون exit code شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های auth پشتیبانی‌شده QA را که برای مهمان عملی هستند forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر config provider زنده QA و `CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر root مخزن نگه دارید تا مهمان بتواند از طریق workspace mount‌شده بنویسد.

## مرجع QA برای Telegram، Discord و Slack

Matrix به‌دلیل تعداد سناریوها و آماده‌سازی homeserver مبتنی بر Docker یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord و Slack کوچک‌ترند - هرکدام چند سناریو، بدون سیستم profile، در برابر کانال‌های واقعی از پیش موجود - بنابراین مرجع آن‌ها اینجا قرار دارد.

### flagهای مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و flagهای یکسانی را می‌پذیرند:

| Flag                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | فقط این سناریو را اجرا کنید. قابل تکرار.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | محل نوشتن reports/summary/پیام‌های مشاهده‌شده و output log. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | root مخزن هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | شناسه موقت account داخل config مربوط به QA gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier`؛ مقدار legacy `live-openai` هنوز کار می‌کند.                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                                | refهای مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                             | حالت سریع provider در موارد پشتیبانی‌شده.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [pool اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر مسیر در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` artifactها را بدون تنظیم exit code شکست‌خورده می‌نویسد.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز هدف می‌گیرد: driver + SUT. بات SUT باید username در Telegram داشته باشد؛ مشاهده بات‌به‌بات زمانی بهترین نتیجه را دارد که هر دو بات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - شناسه عددی chat (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنه پیام‌ها را در artifactهای observed-message نگه می‌دارد؛ پیش‌فرض redacts است.

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

artifactهای خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - شامل RTT هر reply (ارسال driver → reply مشاهده‌شده SUT) از canary به بعد.
- `telegram-qa-observed-messages.json` - بدنه‌ها redacted هستند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات driver که توسط harness کنترل می‌شود و یک بات SUT که توسط OpenClaw gateway فرزند از طریق Plugin bundled Discord شروع می‌شود. مدیریت اشاره کانال، اینکه بات SUT دستور native `/help` را در Discord ثبت کرده است، و سناریوهای opt-in شواهد Mantis را صحت‌سنجی می‌کند.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با user id بات SUT که Discord برمی‌گرداند مطابقت داشته باشد؛ در غیر این صورت مسیر سریع fail می‌شود.

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در artifactهای observed-message نگه می‌دارد.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` کانال voice/stage را برای `discord-voice-autojoin` انتخاب می‌کند؛ بدون آن، سناریو نخستین کانال voice/stage قابل‌مشاهده برای بات SUT را انتخاب می‌کند.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سناریوی صوتی اختیاری. به‌تنهایی اجرا می‌شود، `channels.discord.voice.autoJoin` را فعال می‌کند، و تأیید می‌کند که وضعیت صوتی فعلی بات SUT در Discord همان کانال صوتی/استیج هدف است. اعتبارنامه‌های Convex برای Discord می‌توانند شامل `voiceChannelId` اختیاری باشند؛ در غیر این صورت اجراکننده نخستین کانال صوتی/استیج قابل‌مشاهده را در guild کشف می‌کند.
- `discord-status-reactions-tool-only` - سناریوی Mantis اختیاری. به‌تنهایی اجرا می‌شود، زیرا SUT را به پاسخ‌های همیشه‌فعال و فقط‌ابزاری guild با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک خط زمانی واکنش REST به‌همراه آرتیفکت‌های بصری HTML/PNG ضبط می‌کند. گزارش‌های قبل/بعد Mantis همچنین آرتیفکت‌های MP4 ارائه‌شده توسط سناریو را به‌ترتیب به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی پیوستن خودکار صوتی Discord را صراحتاً اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

سناریوی واکنش وضعیت Mantis را صراحتاً اجرا کنید:

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
- `discord-qa-observed-messages.json` - بدنه‌ها بازنویسی محرمانه می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` هنگامی که سناریوی واکنش وضعیت اجرا شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو بات متمایز هدف می‌گیرد: یک بات راه‌انداز که توسط سازوکار آزمون کنترل می‌شود و یک بات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده Slack شروع می‌شود.

env لازم هنگام استفاده از `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

آرتیفکت‌های خروجی:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - بدنه‌ها بازنویسی محرمانه می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

#### راه‌اندازی فضای کاری Slack

این lane به دو اپ Slack متمایز در یک فضای کاری، به‌علاوه کانالی که هر دو بات عضو آن باشند نیاز دارد:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو بات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این lane در هر اجرا پیام ارسال می‌کند.
- `driverBotToken` - توکن بات (`xoxb-...`) اپ **Driver**.
- `sutBotToken` - توکن بات (`xoxb-...`) اپ **SUT** که باید اپ Slack جداگانه‌ای از driver باشد تا شناسه کاربر بات آن متمایز باشد.
- `sutAppToken` - توکن سطح اپ (`xapp-...`) اپ SUT با `connections:write` که توسط Socket Mode استفاده می‌شود تا اپ SUT بتواند رویدادها را دریافت کند.

یک فضای کاری Slack اختصاصی برای QA را به استفاده دوباره از فضای کاری تولید ترجیح دهید.

مانیفست SUT زیر عمداً نصب تولید Plugin بسته‌بندی‌شده Slack (`extensions/slack/src/setup-shared.ts:10`) را به مجوزها و رویدادهایی محدود می‌کند که مجموعه QA زنده Slack پوشش می‌دهد. برای راه‌اندازی کانال تولید همان‌طور که کاربران آن را می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمداً جداست، زیرا این lane به دو شناسه کاربر بات متمایز در یک فضای کاری نیاز دارد.

**1. اپ Driver را ایجاد کنید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _Create New App_ → _From a manifest_ → فضای کاری QA را انتخاب کنید، مانیفست زیر را جای‌گذاری کنید، سپس _Install to Workspace_ را بزنید:

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید - این مقدار به `driverBotToken` تبدیل می‌شود. driver فقط باید پیام ارسال کند و خودش را شناسایی کند؛ بدون رویداد، بدون Socket Mode.

**2. اپ SUT را ایجاد کنید**

_Create New App → From a manifest_ را در همان فضای کاری تکرار کنید. این اپ QA عمداً از نسخه محدودتری از مانیفست تولید Plugin بسته‌بندی‌شده Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeها و رویدادهای واکنش حذف شده‌اند، زیرا مجموعه QA زنده Slack هنوز مدیریت واکنش را پوشش نمی‌دهد.

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
        "pin_removed"
      ]
    }
  }
}
```

پس از اینکه Slack اپ را ایجاد کرد، در صفحه تنظیمات آن دو کار انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این مقدار به `sutBotToken` تبدیل می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار به `sutAppToken` تبدیل می‌شود.

با فراخوانی `auth.test` روی هر توکن تأیید کنید که دو بات شناسه کاربری متمایز دارند. runtime بین driver و SUT براساس شناسه کاربر تمایز می‌گذارد؛ استفاده دوباره از یک اپ برای هر دو، mention-gating را فوراً با شکست مواجه می‌کند.

**3. کانال را ایجاد کنید**

در فضای کاری QA، یک کانال ایجاد کنید (برای مثال `#openclaw-qa`) و هر دو بات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید - این مقدار به `channelId` تبدیل می‌شود. کانال عمومی هم کار می‌کند؛ اگر از کانال خصوصی استفاده کنید، هر دو اپ از قبل `groups:history` دارند، بنابراین خواندن تاریخچه توسط سازوکار آزمون همچنان موفق خواهد بود.

**4. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای اشکال‌زدایی روی یک دستگاه از متغیرهای env استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس دهید)، یا pool مشترک Convex را seed کنید تا CI و سایر maintainers بتوانند آن‌ها را lease کنند.

برای pool Convex، چهار فیلد را در یک فایل JSON بنویسید:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

در حالی که `OPENCLAW_QA_CONVEX_SITE_URL` و `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` در shell شما export شده‌اند، ثبت و تأیید کنید:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

انتظار `count: 1`، `status: "active"`، و نبود فیلد `lease` را داشته باشید.

**5. انتها به انتها تأیید کنید**

این lane را به‌صورت محلی اجرا کنید تا تأیید شود هر دو بات می‌توانند از طریق broker با یکدیگر گفتگو کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` نشان می‌دهد که هر دو `slack-canary` و `slack-mention-gating` در وضعیت `pass` هستند. اگر lane حدود ۹۰ ثانیه معلق بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا pool خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` به شما می‌گوید کدام مورد است.

### pool اعتبارنامه Convex

laneهای Telegram، Discord، و Slack می‌توانند به‌جای خواندن متغیرهای env بالا، اعتبارنامه‌ها را از یک pool مشترک Convex lease کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری می‌گیرد، در طول اجرا برای آن Heartbeat می‌فرستد، و هنگام خاموشی آن را آزاد می‌کند. انواع pool عبارت‌اند از `"telegram"`، `"discord"`، و `"slack"`.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` باید یک رشته عددی chat-id باشد.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` باید با `^[A-Z][A-Z0-9]+$` مطابقت داشته باشد (یک شناسه Slack مانند `Cxxxxxxxxxx`). برای آماده‌سازی اپ و scope، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

متغیرهای env عملیاتی و قرارداد endpoint مربوط به broker Convex در [Testing → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام این بخش به قبل از پشتیبانی Discord برمی‌گردد؛ معنای broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده با repo

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمداً در git هستند تا طرح QA هم برای انسان‌ها و هم برای agent قابل‌مشاهده باشد.

`qa-lab` باید یک اجراکننده markdown عمومی باقی بماند. هر فایل markdown سناریو منبع حقیقت برای یک اجرای آزمون است و باید موارد زیر را تعریف کند:

- فراداده سناریو
- فراداده اختیاری category، capability، lane، و risk
- ارجاع‌های docs و code
- نیازمندی‌های اختیاری Plugin
- patch اختیاری پیکربندی Gateway
- `qa-flow` اجرایی

سطح runtime قابل‌استفاده مجدد که پشتوانه `qa-flow` است مجاز است عمومی و cross-cutting بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق seam `browser.request` مربوط به Gateway هدایت می‌کنند، بدون اینکه اجراکننده special-case اضافه شود.

فایل‌های سناریو باید براساس قابلیت محصول گروه‌بندی شوند، نه پوشه source tree. هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای قابلیت ردگیری پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید به اندازه کافی گسترده بماند تا موارد زیر را پوشش دهد:

- گفتگوی DM و کانال
- رفتار thread
- چرخه عمر action پیام
- callbackهای cron
- بازیابی memory
- تغییر model
- تحویل به subagent
- خواندن repo و خواندن docs
- یک وظیفه کوچک build مانند Lobster Invaders

## laneهای mock provider

`qa suite` دو lane محلی mock provider دارد:

- `mock-openai` همان mock سناریوآگاه OpenClaw است. این lane همچنان lane mock قطعی پیش‌فرض برای QA پشتیبانی‌شده با repo و gateهای parity باقی می‌ماند.
- `aimock` یک provider server مبتنی بر AIMock را برای پوشش آزمایشی protocol، fixture، record/replay، و chaos شروع می‌کند. این افزایشی است و جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی provider-lane زیر `extensions/qa-lab/src/providers/` قرار دارد. هر provider مالک defaults، شروع server محلی، پیکربندی model در Gateway، نیازهای آماده‌سازی auth-profile، و پرچم‌های قابلیت live/mock خودش است. کد مشترک suite و Gateway باید به‌جای branching روی نام providerها، از طریق registry مربوط به provider مسیریابی کند.

## آداپتورهای transport

`qa-lab` مالک یک درز انتقال عمومی برای سناریوهای QA در Markdown است. `qa-channel` نخستین آداپتر روی آن درز است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به همان اجراکننده مجموعه متصل شوند، نه اینکه یک اجراکننده QA مخصوص انتقال اضافه کنند.

در سطح معماری، این تفکیک چنین است:

- `qa-lab` مالک اجرای سناریوی عمومی، هم‌زمانی worker، نوشتن artifact، و گزارش‌دهی است.
- آداپتر انتقال مالک پیکربندی Gateway، آمادگی، مشاهده ورودی و خروجی، کنش‌های انتقال، و وضعیت انتقال نرمال‌سازی‌شده است.
- فایل‌های سناریوی Markdown زیر `qa/scenarios/` اجرای آزمون را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سامانه QA مبتنی بر Markdown دقیقاً به دو چیز نیاز دارد:

1. یک آداپتر انتقال برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین کند.

وقتی میزبان مشترک `qa-lab` می‌تواند مالک جریان باشد، یک ریشه دستور QA سطح‌بالای جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- ریشه دستور `openclaw qa`
- راه‌اندازی و teardown مجموعه
- هم‌زمانی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای اجراکننده مالک قرارداد انتقال هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشه مشترک `qa` mount می‌شود
- اینکه Gateway برای آن انتقال چگونه پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه inject می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه رونوشت‌ها و وضعیت انتقال نرمال‌سازی‌شده چگونه در دسترس قرار می‌گیرند
- اینکه کنش‌های مبتنی بر انتقال چگونه اجرا می‌شوند
- اینکه reset یا پاک‌سازی مخصوص انتقال چگونه انجام می‌شود

حداقل سطح پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک ریشه مشترک `qa` نگه دارید.
2. اجراکننده انتقال را روی درز میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای مخصوص انتقال را داخل Plugin اجراکننده یا harness کانال نگه دارید.
4. اجراکننده را به‌صورت `openclaw qa <runner>` mount کنید، به‌جای ثبت یک دستور ریشه رقیب. Pluginهای اجراکننده باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایه مطابق `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy CLI و اجراکننده باید پشت entrypointهای جداگانه بماند.
5. سناریوهای Markdown را زیر دایرکتوری‌های تم‌دار `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای سناریوی عمومی استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک مهاجرت عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتاری را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` بگذارید.
- اگر رفتار به یک انتقال کانال وابسته است، آن را در Plugin اجراکننده یا harness Plugin نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای شاخه مخصوص کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک انتقال معنا دارد، سناریو را مخصوص همان انتقال نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس‌اند - `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` - اما در نگارش سناریوهای جدید باید از نام‌های عمومی استفاده شود. aliasها برای جلوگیری از یک مهاجرت یک‌باره وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از timeline مشاهده‌شده bus صادر می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی همچنان مسدود ماند
- افزودن کدام سناریوهای پیگیری ارزشمند است

برای فهرست سناریوهای موجود - که هنگام برآورد کارهای پیگیری یا اتصال یک انتقال جدید مفید است - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین `--json` را اضافه کنید).

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

این دستور child processهای Gateway محلی QA را اجرا می‌کند، نه Docker. سناریوهای ارزیابی شخصیت
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر
مانند chat، کمک در workspace، و taskهای کوچک فایل را اجرا کنند. به مدل candidate نباید
گفته شود که در حال ارزیابی است. دستور هر transcript کامل را حفظ می‌کند،
آمار پایه اجرا را ثبت می‌کند، سپس از مدل‌های judge در fast mode با
reasoning سطح `xhigh`، در صورت پشتیبانی، می‌خواهد اجراها را بر اساس طبیعی‌بودن، vibe، و طنز رتبه‌بندی کنند.
هنگام مقایسه providerها از `--blind-judge-models` استفاده کنید: prompt داور همچنان
همه transcriptها و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با labelهای خنثی
مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از parsing رتبه‌بندی‌ها را به refهای واقعی برمی‌گرداند.
اجرای candidateها به‌طور پیش‌فرض از thinking سطح `high` استفاده می‌کند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای ارزیابی قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک candidate مشخص را inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
refهای candidate OpenAI به‌طور پیش‌فرض از fast mode استفاده می‌کنند تا در جایی که
provider پشتیبانی می‌کند، priority processing استفاده شود. وقتی یک candidate یا judge
تکی به override نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را inline اضافه کنید. فقط وقتی `--fast` را پاس دهید که می‌خواهید
fast mode را برای همه مدل‌های candidate اجباراً روشن کنید. مدت‌زمان‌های candidate و judge برای
تحلیل benchmark در گزارش ثبت می‌شوند، اما promptهای judge صریحاً می‌گویند
بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های candidate و judge هر دو به‌طور پیش‌فرض از هم‌زمانی 16 استفاده می‌کنند. وقتی محدودیت‌های
provider یا فشار Gateway محلی اجرای بیش‌ازحد پرنویز ایجاد می‌کند، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ candidate `--model` پاس داده نشود، character eval به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند.
وقتی هیچ `--judge-model` پاس داده نشود، judgeها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمون‌گیری](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
