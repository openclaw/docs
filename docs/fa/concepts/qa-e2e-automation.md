---
read_when:
    - درک نحوهٔ کنار هم قرار گرفتن اجزای پشتهٔ QA
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای تضمین کیفیت مبتنی بر مخزن
    - ایجاد خودکارسازی تضمین کیفیت واقع‌گرایانه‌تر پیرامون داشبورد Gateway
summary: 'مرور کلی پشتهٔ QA: qa-lab، qa-channel، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: مرور کلی تضمین کیفیت
x-i18n:
    generated_at: "2026-05-06T09:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشته خصوصی QA قرار است OpenClaw را به شکلی واقعی‌تر و شبیه‌تر به
کانال نسبت به یک تست واحد تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی و خروجی گرفتن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed پشتیبانی‌شده توسط مخزن برای وظیفه شروع و سناریوهای
  پایه QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودآزمایی QA همراه بسته؛ یک گزارش Markdown می‌نویسد.                                                                                                                                                                                                                   |
| `qa suite`                                          | سناریوهای پشتیبانی‌شده توسط مخزن را روی مسیر Gateway مربوط به QA اجرا می‌کند. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکس دورریختنی.                                                                                                |
| `qa coverage`                                       | موجودی پوشش سناریو را به صورت markdown چاپ می‌کند (`--json` برای خروجی ماشینی).                                                                                                                                                                                        |
| `qa parity-report`                                  | دو فایل `qa-suite-summary.json` را مقایسه می‌کند و گزارش همترازی عاملی را می‌نویسد.                                                                                                                                                                                     |
| `qa character-eval`                                 | سناریوی QA شخصیت را در چند مدل زنده همراه با گزارش داوری‌شده اجرا می‌کند. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                         |
| `qa manual`                                         | یک prompt تک‌باره را روی مسیر ارائه‌دهنده/مدل انتخاب‌شده اجرا می‌کند.                                                                                                                                                                                                  |
| `qa ui`                                             | رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA را شروع می‌کند (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                             |
| `qa docker-build-image`                             | تصویر Docker از پیش پخته‌شده QA را می‌سازد.                                                                                                                                                                                                                            |
| `qa docker-scaffold`                                | یک scaffold مربوط به docker-compose برای داشبورد QA + مسیر Gateway می‌نویسد.                                                                                                                                                                                           |
| `qa up`                                             | سایت QA را می‌سازد، پشته پشتیبانی‌شده با Docker را شروع می‌کند و URL را چاپ می‌کند (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                       |
| `qa aimock`                                         | فقط سرور ارائه‌دهنده AIMock را شروع می‌کند.                                                                                                                                                                                                                            |
| `qa mock-openai`                                    | فقط سرور ارائه‌دهنده آگاه از سناریوی `mock-openai` را شروع می‌کند.                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | استخر اعتبارنامه مشترک Convex را مدیریت می‌کند.                                                                                                                                                                                                                        |
| `qa matrix`                                         | مسیر انتقال زنده روی یک homeserver دورریختنی Tuwunel. [QA Matrix](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                                     |
| `qa telegram`                                       | مسیر انتقال زنده روی یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                                     |
| `qa discord`                                        | مسیر انتقال زنده روی یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                               |
| `qa slack`                                          | مسیر انتقال زنده روی یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                                       |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد status-reactions در Discord، smoke دسکتاپ/مرورگر Crabbox و smoke Slack در VNC. [Mantis](/fa/concepts/mantis) و [Runbook دسکتاپ Slack برای Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه عامل.
- راست: QA Lab، که رونوشت شبیه Slack و برنامه سناریو را نشان می‌دهد.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این کار سایت QA را می‌سازد، مسیر Gateway پشتیبانی‌شده با Docker را شروع می‌کند
و صفحه QA Lab را در دسترس قرار می‌دهد؛ جایی که یک اپراتور یا حلقه خودکارسازی
می‌تواند به عامل یک مأموریت QA بدهد، رفتار واقعی کانال را مشاهده کند و ثبت
کند چه چیزهایی کار کرده، شکست خورده یا همچنان مسدود مانده است.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون ساختن دوباره تصویر Docker در هر بار،
پشته را با یک بسته QA Lab متصل‌شده به صورت bind mount شروع کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` به صورت bind-mount وصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد و وقتی هش دارایی QA Lab تغییر کند،
مرورگر به طور خودکار دوباره بارگذاری می‌شود.

برای یک smoke محلی trace در OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک گیرنده محلی trace از نوع OTLP/HTTP را شروع می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin فعال `diagnostics-otel` اجرا می‌کند، سپس
spanهای protobuf خروجی‌گرفته‌شده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را
assert می‌کند:
`openclaw.run`، `openclaw.harness.run`، `openclaw.model.call`،
`openclaw.context.assembled` و `openclaw.message.delivery` باید وجود داشته باشند؛
فراخوانی‌های مدل نباید در turnهای موفق `StreamAbandoned` را خروجی بگیرند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. این کار
`otel-smoke-summary.json` را کنار artifactهای مجموعه QA می‌نویسد.

QA مشاهده‌پذیری فقط در checkout منبع می‌ماند. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته، فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر instrumentation تشخیصی،
از یک checkout منبع ساخته‌شده، `pnpm qa:otel:smoke` را استفاده کنید.

برای یک مسیر smoke واقعی از نظر انتقال در Matrix، اجرا کنید:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/سناریو، متغیرهای env و چیدمان artifact برای این مسیر در [QA Matrix](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: این کار یک homeserver دورریختنی Tuwunel را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان انتقال اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار انتقالی را پوشش می‌دهند که تست‌های واحد نمی‌توانند از ابتدا تا انتها اثبات کنند: gating بر اساس mention، سیاست‌های allow-bot، allowlistها، پاسخ‌های سطح بالا و رشته‌ای، مسیریابی DM، مدیریت واکنش، سرکوب ویرایش ورودی، حذف تکرار replay پس از restart، بازیابی از وقفه homeserver، تحویل فراداده تأیید، مدیریت رسانه و جریان‌های bootstrap/recovery/verification مربوط به Matrix E2EE. profile CLI مربوط به E2EE همچنین `openclaw matrix encryption setup` و فرمان‌های verification را از طریق همان homeserver دورریختنی اجرا می‌کند، پیش از آنکه پاسخ‌های Gateway را بررسی کند.

Discord همچنین سناریوهای opt-in فقط مخصوص Mantis برای بازتولید باگ دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح status reaction
یا از `--scenario discord-thread-reply-filepath-attachment` برای ایجاد یک
رشته واقعی Discord و راستی‌آزمایی اینکه `message.thread-reply` یک پیوست
`filePath` را حفظ می‌کند استفاده کنید. این سناریوها بیرون از مسیر پیش‌فرض زنده Discord می‌مانند
چون probeهای بازتولید قبل/بعد هستند، نه پوشش smoke گسترده.
workflow رشته-پیوست Mantis همچنین وقتی `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد، می‌تواند یک ویدیوی شاهد Web
واردشده به Discord اضافه کند. آن profile بیننده فقط برای capture بصری است؛ تصمیم pass/fail
همچنان از oracle مربوط به REST در Discord می‌آید.

CI همان سطح فرمان را در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند. اجراهای زمان‌بندی‌شده و دستی پیش‌فرض، profile سریع Matrix را با اعتبارنامه‌های frontier زنده، `--fast` و `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. اجرای دستی با `matrix_profile=all` به پنج shard مربوط به profile منشعب می‌شود تا کاتالوگ کامل بتواند به صورت موازی اجرا شود و در عین حال برای هر shard یک دایرکتوری artifact جدا نگه دارد.

برای مسیرهای smoke واقعی از نظر انتقال در Telegram، Discord و Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

آن‌ها یک کانال واقعی از پیش موجود با دو bot (driver + SUT) را هدف می‌گیرند. متغیرهای env لازم، فهرست سناریوها، artifactهای خروجی و استخر اعتبارنامه Convex در [مرجع QA برای Telegram، Discord و Slack](#telegram-discord-and-slack-qa-reference) در ادامه مستند شده‌اند.

برای اجرای کامل VM دسکتاپ Slack با بازیابی VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

این دستور یک ماشین دسکتاپ/مرورگر Crabbox اجاره می‌کند، مسیر زنده Slack را
داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، از دسکتاپ تصویر
می‌گیرد، و در صورت در دسترس بودن ضبط ویدیو، `slack-qa/`، `slack-desktop-smoke.png`،
و `slack-desktop-smoke.mp4` را به دایرکتوری آرتیفکت Mantis برمی‌گرداند. اجاره‌های
دسکتاپ/مرورگر Crabbox ابزارهای ضبط و بسته‌های کمکی مرورگر/بیلد بومی را از ابتدا
فراهم می‌کنند، بنابراین سناریو فقط باید روی اجاره‌های قدیمی‌تر fallbackها را نصب
کند. Mantis زمان‌بندی کل و هر فاز را در
`mantis-slack-desktop-smoke-report.md` گزارش می‌کند تا اجراهای کند نشان دهند زمان
صرف گرم‌سازی اجاره، دریافت اعتبارنامه، راه‌اندازی ریموت، یا کپی آرتیفکت شده است.
پس از ورود دستی به Slack Web از طریق VNC، از `--lease-id <cbx_...>` دوباره استفاده
کنید؛ اجاره‌های استفاده‌شدهٔ مجدد، کش فروشگاه pnpm مربوط به Crabbox را نیز گرم
نگه می‌دارند. مقدار پیش‌فرض `--hydrate-mode source` از یک checkout منبع راستی‌آزمایی
می‌کند و نصب/بیلد را داخل VM اجرا می‌کند. فقط زمانی از `--hydrate-mode prehydrated`
استفاده کنید که workspace ریموت استفاده‌شدهٔ مجدد از قبل `node_modules` و یک
`dist/` بیلدشده داشته باشد؛ این حالت مرحلهٔ پرهزینهٔ نصب/بیلد را رد می‌کند و وقتی
workspace آماده نباشد به‌صورت بسته شکست می‌خورد. با `--gateway-setup`، Mantis یک
Gateway پایدار OpenClaw Slack را داخل VM روی پورت `38973` در حال اجرا باقی
می‌گذارد؛ بدون آن، دستور مسیر عادی QA ربات‌به‌ربات Slack را اجرا می‌کند و پس از
ضبط آرتیفکت خارج می‌شود.

چک‌لیست اپراتور، دستور dispatch گردش‌کار GitHub، قرارداد کامنت شواهد، جدول تصمیم
hydrate-mode، تفسیر زمان‌بندی، و مراحل مدیریت شکست در [راهنمای اجرای Mantis دسکتاپ Slack](/fa/concepts/mantis-slack-desktop-runbook) قرار دارند.

برای یک تسک دسکتاپ به سبک عامل/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` یک ماشین دسکتاپ/مرورگر Crabbox را اجاره یا دوباره استفاده می‌کند،
`crabbox record --while` را شروع می‌کند، مرورگر قابل مشاهده را از طریق یک
`visual-driver` تودرتو هدایت می‌کند، `visual-task.png` را ضبط می‌کند، وقتی
`--vision-mode image-describe` انتخاب شده باشد `openclaw infer image describe` را
روی اسکرین‌شات اجرا می‌کند، و `visual-task.mp4`،
`mantis-visual-task-summary.json`، `mantis-visual-task-driver-result.json`، و
`mantis-visual-task-report.md` را می‌نویسد. وقتی `--expect-text` تنظیم شده باشد،
پرامپت بینایی یک verdict ساختاریافتهٔ JSON درخواست می‌کند و فقط وقتی عبور می‌کند
که مدل شواهد دیداری مثبت گزارش دهد؛ پاسخ منفی‌ای که صرفا متن هدف را نقل می‌کند
در assertion شکست می‌خورد. برای یک smoke بدون مدل که دسکتاپ، مرورگر، اسکرین‌شات،
و لوله‌کشی ویدیو را بدون فراخوانی provider فهم تصویر اثبات می‌کند، از
`--vision-mode metadata` استفاده کنید. ضبط، یک آرتیفکت الزامی برای `visual-task`
است؛ اگر Crabbox هیچ `visual-task.mp4` غیرخالی ضبط نکند، تسک حتی وقتی visual driver
عبور کرده باشد شکست می‌خورد. در صورت شکست، Mantis اجاره را برای VNC نگه می‌دارد،
مگر اینکه تسک از قبل عبور کرده باشد و `--keep-lease` تنظیم نشده باشد.

پیش از استفاده از اعتبارنامه‌های زندهٔ pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی secret نگه‌دارنده حاضر باشد دسترسی‌پذیری admin/list را راستی‌آزمایی می‌کند. برای secretها فقط وضعیت تنظیم‌شده/ناموجود را گزارش می‌دهد.

## پوشش انتقال زنده

مسیرهای انتقال زنده به‌جای اینکه هر کدام شکل فهرست سناریوی خودشان را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعهٔ گستردهٔ رفتار محصول به‌صورت synthetic است و بخشی از ماتریس پوشش انتقال زنده نیست.

| مسیر     | کانری | گیتینگ منشن | ربات‌به‌ربات | مسدودسازی فهرست مجاز | پاسخ سطح بالا | ازسرگیری پس از راه‌اندازی مجدد | پیگیری رشته | ایزوله‌سازی رشته | مشاهده واکنش | دستور راهنما | ثبت دستور بومی |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

این کار `qa-channel` را به‌عنوان مجموعهٔ گستردهٔ رفتار محصول نگه می‌دارد، در حالی
که Matrix، Telegram، و انتقال‌های زندهٔ آینده یک چک‌لیست صریح قرارداد انتقال مشترک
دارند.

برای یک مسیر VM یک‌بارمصرف Linux بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این دستور یک guest تازهٔ Multipass بوت می‌کند، وابستگی‌ها را نصب می‌کند، OpenClaw
را داخل guest بیلد می‌کند، `qa suite` را اجرا می‌کند، سپس گزارش و خلاصهٔ عادی QA
را به `.artifacts/qa-e2e/...` روی میزبان برمی‌گرداند.
این دستور همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد دوباره استفاده
می‌کند. اجراهای مجموعه روی میزبان و Multipass به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده
را به‌طور موازی با workerهای Gateway ایزوله اجرا می‌کنند. `qa-channel` به‌صورت
پیش‌فرض concurrency برابر 4 دارد و با تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای
تنظیم تعداد workerها از `--concurrency <count>`، یا برای اجرای سریالی از
`--concurrency 1` استفاده کنید.
وقتی هر سناریویی شکست بخورد، دستور با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را
بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
اجراهای زنده ورودی‌های پشتیبانی‌شدهٔ auth مربوط به QA را که برای guest عملی هستند
forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر پیکربندی provider زندهٔ QA، و
`CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر ریشهٔ repo نگه دارید تا guest
بتواند از طریق workspace mountشده برگرداند و بنویسد.

## مرجع QA برای Telegram، Discord، و Slack

Matrix به‌دلیل تعداد سناریوها و تامین homeserver مبتنی بر Docker یک [صفحهٔ اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، و Slack کوچک‌تر هستند - هر کدام چند سناریو، بدون سیستم profile، در برابر کانال‌های واقعی از پیش موجود - بنابراین مرجع آن‌ها اینجا قرار دارد.

### فلگ‌های مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان فلگ‌ها را می‌پذیرند:

| فلگ                                  | پیش‌فرض                                                         | توضیح                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | فقط این سناریو را اجرا کن. قابل تکرار است.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | محل نوشتن گزارش‌ها/خلاصه/پیام‌های مشاهده‌شده و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` resolve می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ریشهٔ repository هنگام فراخوانی از یک cwd خنثی.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | شناسهٔ حساب موقت داخل پیکربندی Gateway مربوط به QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` یا `live-frontier` (مقدار legacy `live-openai` هنوز کار می‌کند).                                                  |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                                | ارجاع‌های مدل اصلی/جایگزین.                                                                                         |
| `--fast`                              | off                                                             | حالت سریع provider در جاهایی که پشتیبانی می‌شود.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                |
| `--credential-role <maintainer\|ci>`  | در CI برابر `ci`، در غیر این صورت `maintainer`                              | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                          |

هر مسیر در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` آرتیفکت‌ها را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو ربات متمایز هدف می‌گیرد (driver + SUT). ربات SUT باید یک نام کاربری Telegram داشته باشد؛ مشاهدهٔ ربات‌به‌ربات وقتی هر دو ربات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند بهترین عملکرد را دارد.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - شناسهٔ عددی chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

اختیاری:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` بدنهٔ پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد (پیش‌فرض redacts می‌کند).

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

آرتیفکت‌های خروجی:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - شامل RTT هر پاسخ (ارسال driver → پاسخ مشاهده‌شدهٔ SUT) از کانری به بعد.
- `telegram-qa-observed-messages.json` - بدنه‌ها redacted هستند مگر اینکه `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` باشد.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو ربات هدف می‌گیرد: یک ربات driver که توسط harness کنترل می‌شود و یک ربات SUT که توسط OpenClaw Gateway فرزند از طریق Plugin همراه Discord شروع می‌شود. مدیریت منشن کانال، اینکه ربات SUT دستور بومی `/help` را در Discord ثبت کرده است، و سناریوهای شواهد Mantis opt-in را راستی‌آزمایی می‌کند.

env الزامی هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با شناسهٔ کاربر ربات SUT که Discord برمی‌گرداند مطابق باشد (در غیر این صورت مسیر سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنهٔ پیام‌ها را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - سناریوی Mantis به‌صورت opt-in. به‌تنهایی اجرا می‌شود چون SUT را به پاسخ‌های همیشه‌روشن و فقط‌ابزار در guild با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک timeline واکنش REST به‌همراه آرتیفکت‌های دیداری HTML/PNG ضبط می‌کند. گزارش‌های قبل/بعد Mantis همچنین آرتیفکت‌های MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

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
- `discord-qa-observed-messages.json` - بدنه‌ها حذف می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` هنگامی که سناریوی status-reaction اجرا شود.

### QA Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو بات متمایز هدف می‌گیرد: یک بات راه‌انداز که توسط harness کنترل می‌شود و یک بات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin بسته‌بندی‌شده Slack شروع می‌شود.

متغیرهای محیطی لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه‌های پیام را در آرتیفکت‌های پیام مشاهده‌شده نگه می‌دارد.

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
- `slack-qa-observed-messages.json` - بدنه‌ها حذف می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.

#### راه‌اندازی فضای کاری Slack

این lane به دو برنامه متمایز Slack در یک فضای کاری، به‌علاوه کانالی که هر دو بات عضو آن باشند نیاز دارد:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو بات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این lane در هر اجرا پیام ارسال می‌کند.
- `driverBotToken` - توکن بات (`xoxb-...`) برنامه **Driver**.
- `sutBotToken` - توکن بات (`xoxb-...`) برنامه **SUT** که باید از برنامه Slack راه‌انداز جدا باشد تا شناسه کاربر بات آن متمایز باشد.
- `sutAppToken` - توکن سطح برنامه (`xapp-...`) برنامه SUT با `connections:write` که توسط Socket Mode استفاده می‌شود تا برنامه SUT بتواند رویدادها را دریافت کند.

یک فضای کاری Slack اختصاصی برای QA را به استفاده مجدد از فضای کاری تولیدی ترجیح دهید.

مانیفست SUT زیر عمدا نصب تولیدی Plugin بسته‌بندی‌شده Slack (`extensions/slack/src/setup-shared.ts:10`) را به مجوزها و رویدادهایی محدود می‌کند که مجموعه QA زنده Slack پوشش می‌دهد. برای راه‌اندازی کانال تولیدی همان‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمدا جداست، چون این lane به دو شناسه کاربر بات متمایز در یک فضای کاری نیاز دارد.

**1. برنامه Driver را بسازید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _Create New App_ → _From a manifest_ → فضای کاری QA را انتخاب کنید، مانیفست زیر را جای‌گذاری کنید، سپس _Install to Workspace_:

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید - این همان `driverBotToken` می‌شود. راه‌انداز فقط باید پیام ارسال کند و خودش را شناسایی کند؛ بدون رویداد و بدون Socket Mode.

**2. برنامه SUT را بسازید**

_Create New App → From a manifest_ را در همان فضای کاری تکرار کنید. این برنامه QA عمدا از نسخه محدودتری از مانیفست تولیدی Plugin بسته‌بندی‌شده Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeها و رویدادهای واکنش حذف شده‌اند، چون مجموعه QA زنده Slack هنوز مدیریت واکنش را پوشش نمی‌دهد.

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

پس از اینکه Slack برنامه را ایجاد کرد، در صفحه تنظیمات آن دو کار انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این همان `sutBotToken` می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope‏ `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این همان `sutAppToken` می‌شود.

با فراخوانی `auth.test` روی هر توکن تأیید کنید که دو بات شناسه‌های کاربری متمایز دارند. runtime راه‌انداز و SUT را با شناسه کاربر از هم تشخیص می‌دهد؛ استفاده مجدد از یک برنامه برای هر دو، mention-gating را بلافاصله با شکست مواجه می‌کند.

**3. کانال را بسازید**

در فضای کاری QA، یک کانال بسازید (مثلا `#openclaw-qa`) و هر دو بات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید - این همان `channelId` می‌شود. کانال عمومی کار می‌کند؛ اگر از کانال خصوصی استفاده کنید، هر دو برنامه از قبل `groups:history` دارند، بنابراین خواندن‌های تاریخچه harness همچنان موفق می‌شوند.

**4. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای اشکال‌زدایی روی یک ماشین از متغیرهای محیطی استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس دهید)، یا pool مشترک Convex را seed کنید تا CI و سایر نگه‌دارندگان بتوانند آن‌ها را lease کنند.

برای pool‏ Convex، چهار فیلد را در یک فایل JSON بنویسید:

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

انتظار `count: 1`، ‏`status: "active"` و نبودن فیلد `lease` را داشته باشید.

**5. سرتاسری تأیید کنید**

lane را به‌صورت محلی اجرا کنید تا تأیید شود هر دو بات می‌توانند از طریق broker با هم صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` هر دو `slack-canary` و `slack-mention-gating` را با وضعیت `pass` نشان می‌دهد. اگر lane حدود ۹۰ ثانیه گیر کند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا pool خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` به شما می‌گوید کدام مورد است.

### pool اعتبارنامه Convex

laneهای Telegram، Discord و Slack می‌توانند به‌جای خواندن متغیرهای محیطی بالا، اعتبارنامه‌ها را از یک pool مشترک Convex lease کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری می‌گیرد، در طول اجرا برای آن Heartbeat می‌فرستد و هنگام shutdown آن را آزاد می‌کند. نوع‌های pool عبارت‌اند از `"telegram"`، ‏`"discord"` و `"slack"`.

شکل‌های payload که broker در `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): ‏`{ groupId: string, driverToken: string, sutToken: string }` - ‏`groupId` باید یک رشته chat-id عددی باشد.
- Discord (`kind: "discord"`): ‏`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): ‏`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - ‏`channelId` باید با `^[A-Z][A-Z0-9]+$` مطابق باشد (یک شناسه Slack مانند `Cxxxxxxxxxx`). برای فراهم‌سازی برنامه و scope، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

متغیرهای محیطی عملیاتی و قرارداد endpoint‏ broker‏ Convex در [Testing → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام این بخش پیش از پشتیبانی Discord بوده است؛ معناشناسی broker برای هر دو نوع یکسان است).

## seedهای پشتیبانی‌شده با repo

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

این‌ها عمدا در git هستند تا برنامه QA هم برای انسان‌ها و هم برای agent قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی markdown باقی بماند. هر فایل markdown سناریو منبع حقیقت برای یک اجرای تست است و باید این موارد را تعریف کند:

- فراداده سناریو
- فراداده اختیاری دسته، قابلیت، lane و ریسک
- ارجاع‌های مستندات و کد
- نیازمندی‌های اختیاری Plugin
- وصله اختیاری پیکربندی Gateway
- ‏`qa-flow` اجرایی

سطح runtime قابل استفاده مجدد که پشتوانه `qa-flow` است مجاز است عمومی و cross-cutting باقی بماند. برای مثال، سناریوهای markdown می‌توانند helperهای سمت transport را با helperهای سمت مرورگر ترکیب کنند که Control UI جاسازی‌شده را از طریق seam‏ `browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner مورد خاص اضافه شود.

فایل‌های سناریو باید به‌جای پوشه درخت منبع، بر اساس قابلیت محصول گروه‌بندی شوند. هنگام جابه‌جایی فایل‌ها شناسه‌های سناریو را پایدار نگه دارید؛ برای traceability پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست پایه باید آن‌قدر گسترده بماند که این موارد را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه عمر کنش پیام
- callbackهای Cron
- یادآوری حافظه
- تعویض مدل
- handoff زیرعامل
- خواندن repo و خواندن مستندات
- یک وظیفه ساخت کوچک مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane محلی mock ارائه‌دهنده دارد:

- `mock-openai`، mock سناریوآگاه OpenClaw است. این lane به‌عنوان lane پیش‌فرض mock قطعی برای QA پشتیبانی‌شده با repo و gateهای parity باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده مبتنی بر AIMock را برای پوشش آزمایشی protocol، fixture، record/replay و chaos شروع می‌کند. این lane افزایشی است و جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی lane ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد. هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل Gateway، نیازهای stage کردن auth-profile و پرچم‌های قابلیت live/mock است. کد مشترک suite و Gateway باید به‌جای شاخه‌زدن بر اساس نام ارائه‌دهنده‌ها، از طریق registry ارائه‌دهنده مسیریابی کند.

## adapterهای transport

`qa-lab` مالک یک seam عمومی transport برای سناریوهای QA در markdown است. `qa-channel` اولین adapter روی آن seam است، اما هدف طراحی گسترده‌تر است: کانال‌های واقعی یا مصنوعی آینده باید به‌جای افزودن یک runner‏ QA مخصوص transport، به همان runner مجموعه وصل شوند.

در سطح معماری، تفکیک این‌گونه است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی worker، نوشتن آرتیفکت و گزارش‌دهی است.
- adapter‏ transport مالک پیکربندی Gateway، آمادگی، مشاهده ورودی و خروجی، کنش‌های transport و وضعیت نرمال‌شده transport است.
- فایل‌های سناریوی markdown زیر `qa/scenarios/` اجرای تست را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفاده مجدد را که آن‌ها را اجرا می‌کند فراهم می‌کند.

### افزودن یک کانال

افزودن یک کانال به سیستم QA‏ markdown دقیقا به دو چیز نیاز دارد:

1. یک adapter‏ transport برای کانال.
2. یک بسته سناریو که قرارداد کانال را تمرین کند.

وقتی میزبان مشترک `qa-lab` می‌تواند جریان را مالک شود، ریشه فرمان QA سطح‌بالای جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- ریشهٔ دستور `openclaw qa`
- راه‌اندازی و برچیدن مجموعه آزمون
- هم‌زمانی worker
- نوشتن artifact
- تولید گزارش
- اجرای scenario
- aliasهای سازگاری برای scenarioهای قدیمی‌تر `qa-channel`

Pluginهای اجراکننده مالک قرارداد transport هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشهٔ مشترک `qa` نصب می‌شود
- اینکه gateway برای آن transport چگونه پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه eventهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شدهٔ transport چگونه در دسترس قرار می‌گیرند
- اینکه actionهای متکی به transport چگونه اجرا می‌شوند
- اینکه reset یا پاک‌سازی ویژهٔ transport چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک ریشهٔ مشترک `qa` نگه دارید.
2. اجراکنندهٔ transport را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای ویژهٔ transport را داخل Plugin اجراکننده یا harness کانال نگه دارید.
4. اجراکننده را به‌صورت `openclaw qa <runner>` نصب کنید، نه با ثبت یک دستور ریشهٔ رقیب. Pluginهای اجراکننده باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایهٔ مطابق با نام `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy CLI و اجراکننده باید پشت entrypointهای جداگانه بماند.
5. scenarioهای markdown را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای scenarioهای جدید از helperهای generic scenario استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک مهاجرت عمدی باشد.

قاعدهٔ تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار می‌تواند یک‌بار در `qa-lab` بیان شود، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک transport کانال وابسته است، آن را در همان Plugin اجراکننده یا harness Plugin نگه دارید.
- اگر یک scenario به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای یک شاخهٔ ویژهٔ کانال در `suite.ts`، یک helper generic اضافه کنید.
- اگر یک رفتار فقط برای یک transport معنا دارد، scenario را ویژهٔ transport نگه دارید و این را در قرارداد scenario صریح کنید.

### نام‌های helper سناریو

helperهای generic ترجیحی برای scenarioهای جدید:

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

aliasهای سازگاری برای scenarioهای موجود همچنان در دسترس‌اند - `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` - اما نگارش scenarioهای جدید باید از نام‌های generic استفاده کند. این aliasها برای جلوگیری از یک مهاجرت یک‌باره وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از timeline مشاهده‌شدهٔ bus export می‌کند.
گزارش باید پاسخ دهد:

- چه چیزهایی کار کردند
- چه چیزهایی شکست خوردند
- چه چیزهایی همچنان مسدود ماندند
- چه scenarioهای پیگیری ارزش اضافه‌شدن دارند

برای inventory سناریوهای موجود - که هنگام برآورد کار پیگیری یا اتصال یک transport جدید مفید است - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).

برای بررسی‌های شخصیت و سبک، همان scenario را روی چندین ref مدل زنده اجرا کنید
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

این دستور پردازش‌های فرزند gateway محلی QA را اجرا می‌کند، نه Docker. scenarioهای ارزیابی شخصیت
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر مانند chat، کمک workspace، و taskهای کوچک فایل را اجرا کنند. به مدل candidate نباید گفته شود که در حال ارزیابی است. این دستور هر transcript کامل را حفظ می‌کند، آمار پایهٔ اجرا را ثبت می‌کند، سپس از مدل‌های داور در حالت fast با
reasoning سطح `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسهٔ providerها از `--blind-judge-models` استفاده کنید: prompt داور همچنان هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با labelهای خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از parsing، رتبه‌بندی‌ها را دوباره به refهای واقعی نگاشت می‌کند.
اجرای candidateها به‌صورت پیش‌فرض از thinking سطح `high` استفاده می‌کند؛ برای GPT-5.5 از `medium` و برای refهای ارزیابی قدیمی‌تر OpenAI که پشتیبانی می‌کنند از `xhigh` استفاده می‌شود. یک candidate مشخص را به‌صورت inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک fallback سراسری تنظیم می‌کند، و فرم قدیمی‌تر `--model-thinking <provider/model=level>` برای سازگاری نگه داشته شده است.
refهای candidate OpenAI به‌صورت پیش‌فرض از حالت fast استفاده می‌کنند تا در جاهایی که provider پشتیبانی می‌کند، پردازش اولویت‌دار استفاده شود. وقتی یک candidate یا داور به override نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را inline اضافه کنید. فقط وقتی `--fast` را pass کنید که می‌خواهید حالت fast را برای همهٔ مدل‌های candidate اجباری کنید. مدت‌زمان‌های candidate و داور برای تحلیل benchmark در گزارش ثبت می‌شوند، اما promptهای داور صریحاً می‌گویند که بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های candidate و داور هر دو به‌صورت پیش‌فرض با concurrency برابر 16 انجام می‌شود. وقتی محدودیت‌های provider یا فشار gateway محلی باعث نویزی‌شدن بیش از حد اجرا می‌شود، مقدار
`--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ candidate `--model` داده نشود، ارزیابی شخصیت به‌صورت پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-6`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، زمانی که هیچ `--model` داده نشده باشد.
وقتی هیچ `--judge-model` داده نشود، داورها به‌صورت پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-6,thinking=high` هستند.

## مستندات مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [QA Channel](/fa/channels/qa-channel)
- [آزمون‌گیری](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
