---
read_when:
    - درک نحوهٔ کنار هم قرار گرفتن پشتهٔ QA
    - گسترش qa-lab، qa-channel، یا یک آداپتور ترابری
    - افزودن سناریوهای QA مبتنی بر مخزن
    - ساخت اتوماسیون تضمین کیفیت واقع‌گرایانه‌تر برای داشبورد Gateway
summary: 'نمای کلی پشتهٔ QA: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال و گزارش‌دهی.'
title: نمای کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-10T19:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

استک QA خصوصی برای اجرای OpenClaw به شکلی واقعی‌تر و
شبیه‌تر به کانال طراحی شده است؛ چیزی فراتر از آنچه یک تست واحد می‌تواند پوشش دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: UI اشکال‌زدا و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و خروجی گرفتن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed متکی به مخزن برای کار شروع و سناریوهای پایه QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها نام‌های مستعار اسکریپتی `pnpm qa:*`
دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                                | هدف                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودآزمایی QA بسته‌بندی‌شده؛ یک گزارش Markdown می‌نویسد.                                                                                                                                                                                                                  |
| `qa suite`                                          | سناریوهای متکی به مخزن را در برابر مسیر Gateway مربوط به QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف.                                                                                                  |
| `qa coverage`                                       | فهرست پوشش سناریوی markdown را چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                                                                                                  |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش برابری عامل‌محور را می‌نویسد.                                                                                                                                                                                    |
| `qa character-eval`                                 | سناریوی QA شخصیت را روی چند مدل زنده با یک گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                              |
| `qa manual`                                         | یک prompt تک‌باره را در برابر مسیر provider/model انتخاب‌شده اجرا می‌کند.                                                                                                                                                                                                |
| `qa ui`                                             | UI اشکال‌زدای QA و گذرگاه QA محلی را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                        |
| `qa docker-build-image`                             | تصویر Docker ازپیش‌پخته QA را می‌سازد.                                                                                                                                                                                                                                   |
| `qa docker-scaffold`                                | یک scaffold مربوط به docker-compose برای داشبورد QA + مسیر Gateway می‌نویسد.                                                                                                                                                                                             |
| `qa up`                                             | سایت QA را می‌سازد، استک متکی به Docker را شروع می‌کند، و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                              |
| `qa aimock`                                         | فقط سرور provider مربوط به AIMock را شروع می‌کند.                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | فقط سرور provider سناریوآگاه `mock-openai` را شروع می‌کند.                                                                                                                                                                                                               |
| `qa credentials doctor` / `add` / `list` / `remove` | مخزن مشترک اعتبارنامه Convex را مدیریت می‌کند.                                                                                                                                                                                                                          |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریس](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                                 |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                                 |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                           |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                                   |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox، و smoke Slack-in-VNC. [Mantis](/fa/concepts/mantis) و [Runbook دسکتاپ Slack برای Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه با عامل.
- راست: QA Lab، با نمایش رونوشت شبیه Slack و برنامه سناریو.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این فرمان سایت QA را می‌سازد، مسیر Gateway متکی به Docker را شروع می‌کند، و صفحه
QA Lab را در دسترس قرار می‌دهد؛ جایی که اپراتور یا حلقه خودکارسازی می‌تواند به عامل یک
ماموریت QA بدهد، رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود ماند.

برای تکرار سریع‌تر روی UI مربوط به QA Lab بدون بازسازی تصویر Docker در هر بار،
استک را با یک بسته QA Lab متصل‌شده به صورت bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر ازپیش‌ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` به صورت bind-mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی هش دارایی QA Lab
تغییر کند به صورت خودکار بارگذاری مجدد می‌شود.

برای یک smoke محلی trace مربوط به OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

آن اسکریپت یک گیرنده trace محلی OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس
spanهای protobuf خروجی‌گرفته‌شده را decode می‌کند و شکل حیاتی برای انتشار را assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled`، و `openclaw.message.delivery` باید وجود داشته باشند؛
فراخوانی‌های مدل نباید در turnهای موفق `StreamAbandoned` را خروجی بگیرند؛ شناسه‌های خام diagnostic و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای مجموعه QA می‌نویسد.

QA مربوط به مشاهده‌پذیری فقط در checkout کد منبع باقی می‌ماند. بسته npm عمدا
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته، فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر instrumentation مربوط به diagnostics،
از یک checkout کد منبع ساخته‌شده `pnpm qa:otel:smoke` را استفاده کنید.

برای یک مسیر smoke ماتریس با انتقال واقعی، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، env varها، و چیدمان artifact برای این مسیر در [QA ماتریس](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver یک‌بارمصرف Tuwunel را در Docker provision می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار انتقالی را پوشش می‌دهند که تست‌های واحد نمی‌توانند آن را end to end اثبات کنند: دروازه‌بانی mention، سیاست‌های allow-bot، allowlistها، پاسخ‌های سطح بالا و رشته‌ای، مسیریابی DM، مدیریت واکنش، سرکوب ویرایش ورودی، dedupe مربوط به replay پس از restart، بازیابی از وقفه homeserver، تحویل metadata تایید، مدیریت رسانه، و جریان‌های bootstrap/recovery/verification مربوط به Matrix E2EE. profile مربوط به E2EE در CLI همچنین `openclaw matrix encryption setup` و فرمان‌های verification را از طریق همان homeserver یک‌بارمصرف هدایت می‌کند، پیش از آنکه پاسخ‌های Gateway را بررسی کند.

Discord همچنین سناریوهای opt-in فقط برای Mantis جهت بازتولید باگ دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح واکنش وضعیت
استفاده کنید، یا از `--scenario discord-thread-reply-filepath-attachment` برای ایجاد یک
رشته واقعی Discord و راستی‌آزمایی اینکه `message.thread-reply` یک پیوست
`filePath` را حفظ می‌کند. این سناریوها خارج از مسیر زنده پیش‌فرض Discord می‌مانند
چون probeهای بازتولید قبل/بعد هستند، نه پوشش smoke گسترده.
workflow مربوط به Mantis برای پیوست رشته همچنین می‌تواند وقتی
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد،
یک ویدیوی witness از Discord Web واردشده اضافه کند. آن profile مشاهده‌گر فقط برای ضبط تصویری است؛ تصمیم
قبولی/رد همچنان از oracle مربوط به Discord REST می‌آید.

CI از همان سطح فرمان در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند. اجراهای زمان‌بندی‌شده و دستی پیش‌فرض، profile سریع Matrix را با اعتبارنامه‌های زنده frontier، `--fast`، و `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. مقدار دستی `matrix_profile=all` به پنج shard مربوط به profile منشعب می‌شود تا کاتالوگ کامل بتواند به صورت موازی اجرا شود، در حالی که برای هر shard یک دایرکتوری artifact جدا نگه داشته می‌شود.

برای مسیرهای smoke با انتقال واقعی Telegram، Discord، و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

این مسیرها یک کانال واقعی ازپیش‌موجود با دو bot (driver + SUT) را هدف می‌گیرند. env varهای لازم، فهرست سناریوها، artifactهای خروجی، و مخزن اعتبارنامه Convex در [مرجع QA برای Telegram، Discord، و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای اجرای کامل Slack desktop VM همراه با بازیابی VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این دستور یک ماشین Crabbox desktop/browser اجاره می‌کند، lane زنده Slack را
داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، از desktop تصویر
می‌گیرد، و وقتی ضبط ویدئو در دسترس باشد، `slack-qa/`، `slack-desktop-smoke.png`، و
`slack-desktop-smoke.mp4` را به دایرکتوری artifact مربوط به Mantis کپی
می‌کند. اجاره‌های Crabbox desktop/browser ابزارهای capture و بسته‌های کمکی
browser/native-build را از ابتدا فراهم می‌کنند، بنابراین سناریو فقط باید روی
اجاره‌های قدیمی‌تر fallbackها را نصب کند. Mantis زمان‌بندی کلی و هر فاز را در
`mantis-slack-desktop-smoke-report.md` گزارش می‌کند تا در اجراهای کند مشخص شود
زمان صرف warmup اجاره، دریافت credential، راه‌اندازی remote، یا کپی artifact
شده است. پس از ورود دستی به Slack Web از طریق VNC، از `--lease-id <cbx_...>`
دوباره استفاده کنید؛ اجاره‌های استفاده‌شدهٔ دوباره cache فروشگاه pnpm مربوط به
Crabbox را هم گرم نگه می‌دارند. حالت پیش‌فرض `--hydrate-mode source` از روی یک
source checkout اعتبارسنجی می‌کند و install/build را داخل VM اجرا می‌کند. فقط
وقتی از `--hydrate-mode prehydrated` استفاده کنید که workspace remote
استفاده‌شدهٔ دوباره از قبل `node_modules` و یک `dist/` ساخته‌شده داشته باشد؛
این حالت مرحلهٔ پرهزینهٔ install/build را رد می‌کند و وقتی workspace آماده
نباشد به‌صورت بسته شکست می‌خورد. با `--gateway-setup`، Mantis یک OpenClaw Slack
gateway پایدار را داخل VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن،
دستور lane عادی Slack QA بات-به-بات را اجرا می‌کند و پس از capture کردن artifact
خارج می‌شود.

چک‌لیست operator، دستور dispatch گردش‌کار GitHub، قرارداد evidence-comment،
جدول تصمیم‌گیری hydrate-mode، تفسیر timing، و مراحل مدیریت failure در
[Mantis Slack Desktop Runbook](/fa/concepts/mantis-slack-desktop-runbook) قرار
دارند.

برای یک task سبک agent/CV روی desktop، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` یک ماشین Crabbox desktop/browser را اجاره می‌کند یا دوباره به کار
می‌گیرد، `crabbox record --while` را شروع می‌کند، مرورگر قابل مشاهده را از طریق
یک `visual-driver` تودرتو هدایت می‌کند، `visual-task.png` را capture می‌کند،
وقتی `--vision-mode image-describe` انتخاب شده باشد `openclaw infer image describe`
را روی screenshot اجرا می‌کند، و `visual-task.mp4`،
`mantis-visual-task-summary.json`، `mantis-visual-task-driver-result.json`، و
`mantis-visual-task-report.md` را می‌نویسد. وقتی `--expect-text` تنظیم شده باشد،
vision prompt یک verdict ساخت‌یافتهٔ JSON درخواست می‌کند و فقط وقتی pass می‌شود
که مدل evidence قابل مشاهدهٔ مثبت گزارش کند؛ پاسخ منفی‌ای که صرفا target text را
نقل کند assertion را fail می‌کند. برای یک smoke بدون مدل که desktop، browser،
screenshot، و لوله‌کشی video را بدون فراخوانی provider درک تصویر اثبات می‌کند،
از `--vision-mode metadata` استفاده کنید. Recording برای `visual-task` یک
artifact الزامی است؛ اگر Crabbox هیچ `visual-task.mp4` غیرخالی ضبط نکند، task
حتی وقتی visual driver pass شده باشد fail می‌شود. در صورت failure، Mantis اجاره
را برای VNC نگه می‌دارد، مگر اینکه task از قبل pass شده باشد و `--keep-lease`
تنظیم نشده باشد.

پیش از استفاده از credentialهای زندهٔ pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگهدارنده وجود داشته باشد دسترس‌پذیری admin/list را تایید می‌کند. برای secretها فقط وضعیت set/missing را گزارش می‌کند.

## پوشش live transport

Laneهای live transport به‌جای اینکه هرکدام شکل فهرست سناریوی خودشان را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعهٔ گستردهٔ رفتار synthetic product است و بخشی از ماتریس پوشش live transport نیست.

| Lane     | Canary | دروازه‌گذاری mention | بات-به-بات | مسدودسازی allowlist | پاسخ سطح بالا | ادامه پس از restart | پیگیری thread | ایزوله‌سازی thread | مشاهدهٔ reaction | دستور help | ثبت native command |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعهٔ گستردهٔ رفتار product نگه می‌دارد، در حالی که Matrix،
Telegram، و live transportهای آینده یک چک‌لیست صریح transport-contract مشترک
خواهند داشت.

برای یک lane یک‌بارمصرف Linux VM بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این دستور یک guest تازهٔ Multipass بالا می‌آورد، dependencyها را نصب می‌کند،
OpenClaw را داخل guest می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و
summary عادی QA را به `.artifacts/qa-e2e/...` روی host کپی می‌کند.
این دستور همان رفتار انتخاب سناریو را که `qa suite` روی host دارد دوباره به کار
می‌گیرد. اجراهای suite روی Host و Multipass به‌صورت پیش‌فرض چند سناریوی
انتخاب‌شده را به‌شکل موازی با workerهای gateway ایزوله اجرا می‌کنند.
`qa-channel` به‌صورت پیش‌فرض concurrency 4 دارد، با سقف تعداد سناریوهای
انتخاب‌شده. برای تنظیم تعداد worker از `--concurrency <count>`، یا برای اجرای
سریال از `--concurrency 1` استفاده کنید.
وقتی هر سناریویی fail شود، دستور با وضعیت غیرصفر خارج می‌شود. وقتی artifactها را
بدون exit code شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
اجراهای Live ورودی‌های پشتیبانی‌شدهٔ QA auth را که برای guest عملی هستند forward
می‌کنند: کلیدهای provider مبتنی بر env، مسیر config مربوط به QA live provider، و
`CODEX_HOME` وقتی وجود داشته باشد. `--output-dir` را زیر repo root نگه دارید تا
guest بتواند از طریق workspace mount‌شده به host بنویسد.

## مرجع QA مربوط به Telegram، Discord، و Slack

Matrix به‌دلیل تعداد سناریوها و provision کردن homeserver مبتنی بر Docker یک [صفحهٔ اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، و Slack کوچک‌تر هستند - هرکدام چند سناریو، بدون profile system، روی channelهای واقعی از پیش موجود - بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های CLI مشترک

این laneها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | فقط این سناریو را اجرا کنید. تکرارپذیر است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | جایی که reports/summary/observed messages و output log نوشته می‌شوند. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ریشهٔ repository هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | شناسهٔ account موقت داخل config مربوط به QA gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier`؛ `live-openai` legacy هنوز کار می‌کند.                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                                | refهای مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | خاموش                                                             | حالت fast مربوط به provider در جاهایی که پشتیبانی می‌شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex credential pool](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، وگرنه `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر lane در صورت fail شدن هر سناریو با وضعیت غیرصفر خارج می‌شود. `--allow-failures` artifactها را بدون تنظیم exit code شکست‌خورده می‌نویسد.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز هدف می‌گیرد (driver + SUT). بات SUT باید username در Telegram داشته باشد؛ مشاهدهٔ بات-به-بات وقتی هر دو بات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند بهترین عملکرد را دارد.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - شناسهٔ عددی chat (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنهٔ پیام‌ها را در artifactهای observed-message نگه می‌دارد (پیش‌فرض redact می‌کند).

سناریوها (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

مجموعهٔ پیش‌فرض ضمنی همیشه canary، دروازه‌گذاری mention، پاسخ‌های native command، آدرس‌دهی command، و پاسخ‌های گروهی بات-به-بات را پوشش می‌دهد. پیش‌فرض‌های `mock-openai` همچنین شامل بررسی‌های deterministic reply-chain و streaming مربوط به final-message هستند. `telegram-current-session-status-tool` همچنان opt-in می‌ماند، چون فقط وقتی مستقیم پس از canary در thread بیاید پایدار است، نه پس از پاسخ‌های native command دلخواه. برای چاپ split فعلی default/optional همراه با regression refها از `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` استفاده کنید.

Artifactهای خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - شامل RTT هر reply (driver send → observed SUT reply) از canary به بعد.
- `telegram-qa-observed-messages.json` - بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### Discord QA

```bash
pnpm openclaw qa discord
```

یک channel واقعی private Discord guild را با دو بات هدف می‌گیرد: یک driver bot که harness کنترل می‌کند و یک SUT bot که child OpenClaw gateway از طریق bundled Discord Plugin راه‌اندازی می‌کند. مدیریت mention در channel، اینکه SUT bot دستور native `/help` را در Discord ثبت کرده باشد، و سناریوهای opt-in شواهد Mantis را verify می‌کند.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با شناسه کاربر ربات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت lane سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` کانال صوتی/استیج را برای `discord-voice-autojoin` انتخاب می‌کند؛ بدون آن، سناریو نخستین کانال صوتی/استیج قابل مشاهده را برای ربات SUT انتخاب می‌کند.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سناریوی صوتی اختیاری. به‌تنهایی اجرا می‌شود، `channels.discord.voice.autoJoin` را فعال می‌کند، و بررسی می‌کند که وضعیت صوتی فعلی ربات SUT در Discord همان کانال صوتی/استیج هدف باشد. اعتبارنامه‌های Convex Discord می‌توانند `voiceChannelId` اختیاری داشته باشند؛ در غیر این صورت runner نخستین کانال صوتی/استیج قابل مشاهده در guild را پیدا می‌کند.
- `discord-status-reactions-tool-only` - سناریوی اختیاری Mantis. به‌تنهایی اجرا می‌شود، چون SUT را به پاسخ‌های guild همیشه‌روشن و فقط‌ابزار با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک تایم‌لاین واکنش REST به‌همراه آرتیفکت‌های بصری HTML/PNG ثبت می‌کند. گزارش‌های قبل/بعد Mantis همچنین آرتیفکت‌های MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی پیوستن خودکار صوتی Discord را صراحتا اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` هنگامی که سناریوی واکنش وضعیت اجرا می‌شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو ربات مجزا هدف می‌گیرد: یک ربات driver که harness کنترلش می‌کند و یک ربات SUT که Gateway فرزند OpenClaw از طریق Plugin همراه Slack راه‌اندازی می‌کند.

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
- `slack-qa-observed-messages.json` - بدنه‌ها ویرایش می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

#### راه‌اندازی فضای کاری Slack

این lane به دو برنامه Slack مجزا در یک workspace، به‌همراه کانالی که هر دو ربات عضو آن هستند نیاز دارد:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو ربات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ lane در هر اجرا در آن پست می‌گذارد.
- `driverBotToken` - توکن ربات (`xoxb-...`) برنامه **Driver**.
- `sutBotToken` - توکن ربات (`xoxb-...`) برنامه **SUT**، که باید برنامه Slack جداگانه‌ای از driver باشد تا شناسه کاربر ربات آن متفاوت باشد.
- `sutAppToken` - توکن سطح برنامه (`xapp-...`) برنامه SUT با `connections:write`، که Socket Mode از آن استفاده می‌کند تا برنامه SUT بتواند رویدادها را دریافت کند.

ترجیحا به‌جای استفاده دوباره از یک workspace تولیدی، از یک workspace Slack اختصاصی برای QA استفاده کنید.

manifest مربوط به SUT در پایین، نصب تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) را عمدا به مجوزها و رویدادهایی محدود می‌کند که suite زنده QA برای Slack پوشش می‌دهد. برای راه‌اندازی کانال تولیدی همان‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمدا جداست، چون lane به دو شناسه کاربر ربات مجزا در یک workspace نیاز دارد.

**1. برنامه Driver را بسازید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _Create New App_ → _From a manifest_ → workspace مربوط به QA را انتخاب کنید، manifest زیر را جای‌گذاری کنید، سپس _Install to Workspace_ را بزنید:

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید - این همان `driverBotToken` می‌شود. driver فقط باید پیام ارسال کند و خودش را شناسایی کند؛ بدون رویداد و بدون Socket Mode.

**2. برنامه SUT را بسازید**

_Create New App → From a manifest_ را در همان workspace تکرار کنید. این برنامه QA عمدا از نسخه محدودتری از manifest تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeها و رویدادهای واکنش حذف شده‌اند، چون suite زنده QA برای Slack هنوز رسیدگی به واکنش‌ها را پوشش نمی‌دهد.

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

پس از اینکه Slack برنامه را ساخت، در صفحه تنظیمات آن دو کار انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این همان `sutBotToken` می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این همان `sutAppToken` می‌شود.

با فراخوانی `auth.test` روی هر توکن، بررسی کنید که دو ربات شناسه کاربر متفاوت داشته باشند. runtime، driver و SUT را با شناسه کاربر از هم تشخیص می‌دهد؛ استفاده دوباره از یک برنامه برای هر دو باعث می‌شود mention-gating بلافاصله شکست بخورد.

**3. کانال را بسازید**

در workspace مربوط به QA، یک کانال بسازید (مثلا `#openclaw-qa`) و هر دو ربات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید - این همان `channelId` می‌شود. کانال عمومی هم کار می‌کند؛ اگر از کانال خصوصی استفاده کنید، هر دو برنامه از قبل `groups:history` دارند، بنابراین خواندن‌های history در harness همچنان موفق می‌شوند.

**4. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای اشکال‌زدایی روی یک ماشین از متغیرهای env استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را بفرستید)، یا pool مشترک Convex را seed کنید تا CI و نگهدارنده‌های دیگر بتوانند آن‌ها را lease کنند.

برای pool مربوط به Convex، چهار فیلد را در یک فایل JSON بنویسید:

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

انتظار `count: 1`، `status: "active"`، و نبود فیلد `lease` را داشته باشید.

**5. پایان تا پایان را بررسی کنید**

lane را به‌صورت محلی اجرا کنید تا تایید شود هر دو ربات می‌توانند از طریق broker با هم صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` نشان می‌دهد هر دو `slack-canary` و `slack-mention-gating` وضعیت `pass` دارند. اگر lane حدود ۹۰ ثانیه معلق بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا pool خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` مشخص می‌کند کدام مورد است.

### pool اعتبارنامه Convex

laneهای Telegram، Discord، Slack و WhatsApp می‌توانند به‌جای خواندن متغیرهای env بالا، اعتبارنامه‌ها را از یک pool مشترک Convex lease کنند. `--credential-source convex` را بفرستید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری می‌گیرد، آن را در طول اجرا heartbeat می‌کند، و هنگام خاموشی آزادش می‌کند. نوع‌های pool عبارت‌اند از `"telegram"`، `"discord"`، `"slack"`، و `"whatsapp"`.

شکل‌های payload که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` باید رشته شناسه چت عددی باشد.
- کاربر واقعی Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - یک lease انحصاری حساب burner که هم driver مربوط به TDLib CLI و هم شاهد بصری Telegram Desktop از آن استفاده می‌کنند.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - شماره تلفن‌ها باید رشته‌های E.164 متمایز باشند.

برای proof بصری کاربر واقعی Telegram، یک نشست نگه‌داشته‌شده Crabbox را ترجیح دهید:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` یک lease انحصاری Convex `telegram-user` را برای هر دو مورد، یعنی driver مربوط به TDLib CLI و شاهد Telegram Desktop، نگه می‌دارد، ضبط دسکتاپ را شروع می‌کند، و Crabbox را برای گام‌های repro دلخواه که agentها هدایت می‌کنند زنده نگه می‌دارد. agentها می‌توانند از `send`، `run`، `screenshot`، و `status` استفاده کنند تا راضی شوند، سپس `finish` تصویر، ویدئو، ویدئو/GIF trim‌شده بر اساس حرکت، خروجی‌های probe مربوط به TDLib، و لاگ‌ها را پیش از آزاد کردن اعتبارنامه جمع‌آوری می‌کند. `publish --session <file> --pr <number>` به‌صورت پیش‌فرض فقط motion GIF را کامنت می‌کند؛ `--full-artifacts` opt-in صریح برای لاگ‌ها و خروجی JSON است. دستور پیش‌فرض `probe` همچنان میان‌بر تک‌دستوری برای smoke checkهای سریع `/status` باقی می‌ماند.

از `--mock-response-file <path>` زمانی استفاده کنید که یک PR به یک diff بصری قطعی نیاز دارد:
همان پاسخ مدل mock را می‌توان روی `main` و روی head همان PR اجرا کرد، در حالی که
قالب‌بند Telegram یا لایه تحویل تغییر می‌کند. پیش‌فرض‌های ضبط برای کامنت‌های PR
تنظیم شده‌اند: کلاس استاندارد Crabbox، ضبط دسکتاپ با 24fps، GIF حرکتی با 24fps، و
عرض پیش‌نمایش 1920px. کامنت‌های قبل/بعد باید یک بسته تمیز منتشر کنند که
فقط شامل GIFهای موردنظر باشد.

مسیرهای Slack نیز می‌توانند از pool استفاده کنند. بررسی‌های شکل payload در Slack در حال حاضر در اجراکننده QA مربوط به Slack قرار دارند نه در broker؛ از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید، همراه با شناسه کانال Slack مانند `Cxxxxxxxxxx`. برای فراهم‌سازی app و scope به [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) مراجعه کنید.

متغیرهای محیطی عملیاتی و قرارداد endpoint مربوط به broker در Convex در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام این بخش قدیمی‌تر از pool چندکاناله است؛ معناشناسی lease میان گونه‌ها مشترک است).

## seedهای پشتیبانی‌شده توسط repo

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این موارد عمدا در git هستند تا برنامه QA هم برای انسان‌ها و هم برای
عامل قابل مشاهده باشد.

`qa-lab` باید یک اجراکننده عمومی markdown باقی بماند. هر فایل markdown سناریو
منبع حقیقت برای یک اجرای آزمایش است و باید موارد زیر را تعریف کند:

- فراداده سناریو
- فراداده اختیاری دسته، قابلیت، مسیر، و ریسک
- ارجاع‌های docs و code
- نیازمندی‌های اختیاری Plugin
- patch اختیاری پیکربندی gateway
- `qa-flow` قابل اجرا

سطح runtime قابل استفاده مجدد که پشتوانه `qa-flow` است مجاز است عمومی
و میان‌بُرشی باقی بماند. برای نمونه، سناریوهای markdown می‌توانند helperهای سمت transport
را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق
درز Gateway `browser.request` هدایت می‌کنند، بدون افزودن اجراکننده ویژه.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند نه پوشه source tree.
شناسه‌های سناریو را هنگام جابه‌جایی فایل‌ها پایدار نگه دارید؛ برای رهگیری پیاده‌سازی از `docsRefs` و `codeRefs`
استفاده کنید.

فهرست baseline باید آن‌قدر گسترده بماند که موارد زیر را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر action پیام
- callbackهای cron
- بازیابی memory
- تعویض مدل
- تحویل به subagent
- خواندن repo و خواندن docs
- یک وظیفه build کوچک مانند Lobster Invaders

## مسیرهای mock ارائه‌دهنده

`qa suite` دو مسیر mock ارائه‌دهنده محلی دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این مورد مسیر mock قطعی پیش‌فرض
  برای QA پشتیبانی‌شده توسط repo و gateهای parity باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده مبتنی بر AIMock را برای پوشش آزمایشی protocol،
  fixture، record/replay، و chaos راه‌اندازی می‌کند. این مورد افزایشی است و
  dispatcher سناریوی `mock-openai` را جایگزین نمی‌کند.

پیاده‌سازی مسیر ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل gateway،
نیازهای آماده‌سازی auth-profile، و flagهای قابلیت live/mock است. کد مشترک suite و
gateway باید به‌جای branch زدن روی نام ارائه‌دهنده‌ها، از طریق registry ارائه‌دهنده مسیر‌دهی کند.

## آداپتورهای transport

`qa-lab` مالک یک درز transport عمومی برای سناریوهای QA در markdown است. `qa-channel` نخستین آداپتور روی آن درز است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به همان اجراکننده suite متصل شوند، به‌جای افزودن یک اجراکننده QA مخصوص transport.

در سطح معماری، این تقسیم‌بندی چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌روندی worker، نوشتن artifact، و گزارش‌دهی است.
- آداپتور transport مالک پیکربندی gateway، آمادگی، مشاهده ورودی و خروجی، actionهای transport، و وضعیت نرمال‌شده transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای آزمایش را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سیستم QA مبتنی بر markdown دقیقا به دو چیز نیاز دارد:

1. یک آداپتور transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین دهد.

وقتی میزبان مشترک `qa-lab` می‌تواند مالک flow باشد، root دستور QA سطح‌بالای جدیدی اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- root دستور `openclaw qa`
- راه‌اندازی و teardown suite
- هم‌روندی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Runner plugins مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه gateway چگونه برای آن transport پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شده transport چگونه در دسترس قرار می‌گیرند
- اینکه actionهای پشتیبانی‌شده توسط transport چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص transport چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک root مشترک `qa` نگه دارید.
2. اجراکننده transport را روی درز میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای مخصوص transport را داخل runner plugin یا harness کانال نگه دارید.
4. اجراکننده را به‌صورت `openclaw qa <runner>` mount کنید، نه اینکه یک root command رقیب ثبت کنید. Runner plugins باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایه `qaRunnerCliRegistrations` مطابق را از `runtime-api.ts` صادر کنند. `runtime-api.ts` را سبک نگه دارید؛ CLI lazy و اجرای runner باید پشت entrypointهای جداگانه باقی بمانند.
5. سناریوهای markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام migration عمدی باشد.

قاعده تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتاری را بتوان یک بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتاری به یک transport کانال وابسته است، آن را در runner plugin یا harness همان Plugin نگه دارید.
- اگر یک سناریو به قابلیتی جدید نیاز دارد که بیش از یک کانال بتواند از آن استفاده کند، به‌جای branch مخصوص کانال در `suite.ts`، یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک transport معنادار است، سناریو را مخصوص transport نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند - `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` - اما نوشتن سناریوی جدید باید از نام‌های عمومی استفاده کند. این aliasها برای جلوگیری از یک migration ناگهانی وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش protocol در قالب Markdown از timeline مشاهده‌شده bus صادر می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی همچنان مسدود ماند
- چه سناریوهای پیگیری ارزش افزودن دارند

برای فهرست سناریوهای موجود - که هنگام اندازه‌گیری کارهای پیگیری یا سیم‌کشی یک transport جدید مفید است - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).

برای بررسی‌های کاراکتر و سبک، همان سناریو را روی چند ref مدل live اجرا کنید
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

این دستور processهای فرزند gateway مربوط به QA محلی را اجرا می‌کند، نه Docker. سناریوهای character eval
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر مانند
چت، کمک workspace، و وظایف کوچک فایل را اجرا کنند. به مدل candidate نباید گفته شود
که در حال ارزیابی است. این دستور هر transcript کامل را حفظ می‌کند،
آمارهای پایه اجرا را ثبت می‌کند، سپس از مدل‌های judge در fast mode با
reasoning سطح `xhigh` در صورت پشتیبانی می‌خواهد اجراها را بر اساس طبیعی بودن، vibe، و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسه ارائه‌دهنده‌ها از `--blind-judge-models` استفاده کنید: prompt مربوط به judge همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با
برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از
parsing رتبه‌بندی‌ها را دوباره به refهای واقعی نگاشت می‌کند.
اجرای candidateها به‌صورت پیش‌فرض از thinking سطح `high` استفاده می‌کند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای eval قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک candidate مشخص را inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و فرم قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
refهای candidate مربوط به OpenAI به‌صورت پیش‌فرض روی fast mode هستند تا priority processing در جاهایی که
ارائه‌دهنده از آن پشتیبانی می‌کند استفاده شود. وقتی یک candidate یا judge
به override نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را inline اضافه کنید. `--fast` را فقط زمانی پاس دهید که بخواهید
fast mode را برای هر مدل candidate اجباری کنید. مدت‌زمان‌های candidate و judge در گزارش برای تحلیل benchmark
ثبت می‌شوند، اما promptهای judge صراحتا می‌گویند که بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های candidate و judge هر دو به‌صورت پیش‌فرض هم‌روندی 16 دارند. وقتی محدودیت‌های ارائه‌دهنده یا فشار gateway محلی
یک اجرا را بیش از حد noisy می‌کند، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ `--model` candidate پاس داده نشود، character eval به‌صورت پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند.
وقتی هیچ `--judge-model` پاس داده نشود، judgeها به‌صورت پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## docs مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [Dashboard](/fa/web/dashboard)
