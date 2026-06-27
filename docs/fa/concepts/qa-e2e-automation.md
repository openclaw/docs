---
read_when:
    - درک اینکه پشتهٔ QA چگونه در کنار هم قرار می‌گیرد
    - گسترش qa-lab، qa-channel، یا یک آداپتور انتقال
    - افزودن سناریوهای QA مبتنی بر مخزن
    - ساخت خودکارسازی تضمین کیفیت با واقع‌گرایی بالاتر پیرامون داشبورد Gateway
summary: 'نمای کلی پشته QA: qa-lab، qa-channel، سناریوهای پشتیبانی‌شده توسط مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-06-27T17:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشتهٔ QA خصوصی برای این طراحی شده است که OpenClaw را به‌شکلی واقع‌گرایانه‌تر و
شبیه به کانال، فراتر از توان یک آزمون واحد، تمرین دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدا و گذرگاه QA برای مشاهدهٔ رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Plugin‌های اجراکنندهٔ آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed متکی به مخزن برای کار آغازین و سناریوهای پایهٔ QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زندهٔ قبل و بعد برای باگ‌هایی که به
  انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                               | هدف                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده بدون `--qa-profile`؛ اجراکنندهٔ پروفایل بلوغ متکی به طبقه‌بندی با `--qa-profile smoke-ci`، `--qa-profile release`، یا `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | اجرای سناریوهای متکی به مخزن روی مسیر Gateway مربوط به QA. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکس یک‌بارمصرف.                                                                                                                     |
| `qa coverage`                                       | چاپ موجودی پوشش سناریوهای YAML (`--json` برای خروجی ماشینی).                                                                                                                                                                                                            |
| `qa parity-report`                                  | مقایسهٔ دو فایل `qa-suite-summary.json` و نوشتن گزارش برابری عامل‌محور، یا استفاده از `--runtime-axis --token-efficiency` برای نوشتن گزارش‌های برابری runtime و بهره‌وری توکن Codex در برابر OpenClaw از یک خلاصهٔ جفت runtime.                                      |
| `qa character-eval`                                 | اجرای سناریوی QA شخصیت روی چند مدل زنده همراه با گزارش داوری‌شده. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                                    |
| `qa manual`                                         | اجرای یک prompt موردی روی مسیر provider/model انتخاب‌شده.                                                                                                                                                                                                               |
| `qa ui`                                             | راه‌اندازی رابط کاربری اشکال‌زدای QA و گذرگاه محلی QA (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                   |
| `qa docker-build-image`                             | ساخت تصویر Docker ازپیش‌پختهٔ QA.                                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | نوشتن یک اسکفولد docker-compose برای داشبورد QA + مسیر Gateway.                                                                                                                                                                                                         |
| `qa up`                                             | ساخت سایت QA، راه‌اندازی پشتهٔ متکی به Docker، چاپ URL (نام مستعار: `pnpm qa:lab:up`؛ گونهٔ `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                                                  |
| `qa aimock`                                         | راه‌اندازی فقط سرور provider مربوط به AIMock.                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | راه‌اندازی فقط سرور provider سناریوآگاه `mock-openai`.                                                                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | مدیریت مخزن مشترک اعتبارنامه‌های Convex.                                                                                                                                                                                                                                |
| `qa matrix`                                         | مسیر انتقال زنده روی یک homeserver یک‌بارمصرف Tuwunel. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                                      |
| `qa telegram`                                       | مسیر انتقال زنده روی یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                                     |
| `qa discord`                                        | مسیر انتقال زنده روی یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                               |
| `qa slack`                                          | مسیر انتقال زنده روی یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                                       |
| `qa whatsapp`                                       | مسیر انتقال زنده روی حساب‌های واقعی WhatsApp Web.                                                                                                                                                                                                                      |
| `qa mantis`                                         | اجراکنندهٔ راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، smoke دسکتاپ/مرورگر Crabbox، و smoke مربوط به Slack در VNC. [Mantis](/fa/concepts/mantis) و [Runbook دسکتاپ Slack برای Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

`qa run` متکی به پروفایل، عضویت را از `taxonomy.yaml` می‌خواند، سپس
سناریوهای حل‌شده را از طریق `qa suite` توزیع می‌کند. `--surface` و
`--category` به‌جای تعریف مسیرهای جداگانه، پروفایل انتخاب‌شده را فیلتر می‌کنند.
`qa-evidence.json` حاصل، خلاصهٔ scorecard پروفایل را همراه با
تعدادهای دسته‌های انتخاب‌شده و شناسه‌های پوشش مفقود دربر می‌گیرد؛ ورودی‌های
تکی شواهد همچنان منبع حقیقت برای آزمون‌ها، نقش‌های پوشش و نتایج باقی می‌مانند.
شناسه‌های پوشش ویژگی طبقه‌بندی، هدف‌های دقیق اثبات هستند، نه نام مستعار. پوشش
سناریوی اصلی شناسه‌های منطبق را برآورده می‌کند؛ پوشش ثانویه مشورتی می‌ماند.
شناسه‌های پوشش از شکل نقطه‌دار `namespace.behavior` با بخش‌های
حروف‌عددی/خط‌تیرهٔ کوچک استفاده می‌کنند؛ شناسه‌های پروفایل، سطح و دسته همچنان
می‌توانند از شناسه‌های خط‌تیره‌دار یا نقطه‌دار موجود در طبقه‌بندی استفاده کنند.
شواهد slim، `execution` را برای هر ورودی حذف می‌کند و
`evidenceMode: "slim"` را تنظیم می‌کند؛ `smoke-ci` به‌طور پیش‌فرض slim است و
`--evidence-mode full` ورودی‌های کامل را بازمی‌گرداند:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

از `smoke-ci` برای اثبات قطعی پروفایل با providerهای مدل mock و
سرورهای provider جعلی Crabline استفاده کنید. از `release` برای اثبات Stable/LTS
روی کانال‌های زنده استفاده کنید. از `all` فقط برای اجراهای صریح شواهد کل
طبقه‌بندی استفاده کنید؛ این گزینه هر دستهٔ بلوغ فعال را انتخاب می‌کند و می‌تواند
از طریق گردش‌کار `QA Profile Evidence` با `qa_profile=all` توزیع شود. وقتی یک
فرمان به پروفایل ریشهٔ OpenClaw هم نیاز دارد، پروفایل ریشه را پیش از فرمان QA
قرار دهید:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دو پنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه با عامل.
- راست: QA Lab، نمایش‌دهندهٔ رونوشت شبیه Slack و طرح سناریو.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این فرمان سایت QA را می‌سازد، مسیر Gateway متکی به Docker را راه‌اندازی می‌کند،
و صفحهٔ QA Lab را در دسترس قرار می‌دهد؛ جایی که اپراتور یا حلقهٔ خودکارسازی
می‌تواند به عامل یک مأموریت QA بدهد، رفتار کانال واقعی را مشاهده کند، و ثبت کند
چه چیزهایی کار کردند، شکست خوردند، یا مسدود ماندند.

برای تکرار سریع‌تر رابط کاربری QA Lab محلی بدون بازسازی تصویر Docker در هر بار،
پشته را با bundle متصل‌شدهٔ QA Lab راه‌اندازی کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر ازپیش‌ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را در کانتینر `qa-lab` به‌صورت bind-mount متصل
می‌کند. `qa:lab:watch` آن bundle را هنگام تغییر بازسازی می‌کند، و مرورگر وقتی
هش دارایی QA Lab تغییر کند به‌طور خودکار بازبارگذاری می‌شود.

برای یک smoke محلی سیگنال OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک گیرندهٔ محلی OTLP/HTTP را راه‌اندازی می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس
صادر شدن traceها، metricها و logها را assert می‌کند. این اسکریپت spanهای trace
protobuf صادرشده را رمزگشایی می‌کند و شکل حیاتی برای انتشار را بررسی می‌کند:
`openclaw.run`، `openclaw.harness.run`، یک span فراخوانی مدل با
semantic-convention تازهٔ GenAI، `openclaw.context.assembled`، و
`openclaw.message.delivery` باید حاضر باشند. این smoke مقدار
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` را اجباری می‌کند،
پس span فراخوانی مدل باید از نام `{gen_ai.operation.name} {gen_ai.request.model}`
استفاده کند؛ فراخوانی‌های مدل در نوبت‌های موفق نباید `StreamAbandoned` را صادر
کنند؛ شناسه‌های خام diagnostic و ویژگی‌های `openclaw.content.*` باید بیرون از
trace بمانند. payloadهای خام OTLP نباید sentinel مربوط به prompt، sentinel
مربوط به پاسخ، یا کلید نشست QA را دربر داشته باشند. این اسکریپت
`otel-smoke-summary.json` را کنار artifactهای مجموعهٔ QA می‌نویسد.

برای یک smoke OpenTelemetry متکی به collector، اجرا کنید:

```bash
pnpm qa:otel:collector-smoke
```

این مسیر یک کانتینر Docker واقعی OpenTelemetry Collector را جلوی همان گیرندهٔ
محلی قرار می‌دهد. هنگام تغییر سیم‌کشی endpoint، سازگاری collector، یا رفتار
صدور OTLP که گیرندهٔ درون‌فرایندی می‌تواند پنهان کند، از آن استفاده کنید.

برای smoke محافظت‌شدهٔ scrape مربوط به Prometheus، اجرا کنید:

```bash
pnpm qa:prometheus:smoke
```

آن alias سناریوی QA با نام `docker-prometheus-smoke` را با فعال بودن
`diagnostics-prometheus` اجرا می‌کند، رد شدن scrapeهای احراز هویت‌نشده را تأیید می‌کند،
سپس بررسی می‌کند که scrape احراز هویت‌شده شامل خانواده‌های metric حیاتی برای انتشار
باشد، بدون محتوای prompt، محتوای پاسخ، شناسه‌های خام diagnostic، tokenهای auth،
یا مسیرهای محلی.

برای اجرای هر دو smoke مربوط به observability پشت سر هم، استفاده کنید از:

```bash
pnpm qa:observability:smoke
```

برای lane مربوط به OpenTelemetry با پشتوانه collector به‌همراه smoke مربوط به scrape
محافظت‌شده Prometheus، استفاده کنید از:

```bash
pnpm qa:observability:collector-smoke
```

QA مربوط به observability فقط در source-checkout باقی می‌ماند. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین laneهای انتشار Docker package فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر
ابزارگذاری diagnostics، از `pnpm qa:otel:smoke`، `pnpm qa:prometheus:smoke`، یا
`pnpm qa:observability:smoke` در یک source checkout ساخته‌شده استفاده کنید.

برای یک lane دود Matrix با transport واقعی که به credentials مربوط به model-provider
نیاز ندارد، پروفایل سریع را با provider قطعی و mock OpenAI اجرا کنید:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

برای lane مربوط به provider زنده live-frontier، credentials سازگار با OpenAI را
صریحاً فراهم کنید:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، env varها، و چیدمان artifact برای این lane در [QA Matrix](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver مصرف‌شدنی Tuwunel را در Docker فراهم می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان transport اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact مربوط به observed-events، و log خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار transport را پوشش می‌دهند که testهای unit نمی‌توانند end-to-end ثابت کنند: mention gating، سیاست‌های allow-bot، allowlistها، پاسخ‌های top-level و threaded، routing مربوط به DM، مدیریت reaction، سرکوب edit ورودی، dedupe مربوط به replay پس از restart، recovery پس از وقفه homeserver، تحویل metadata مربوط به approval، مدیریت media، و flowهای bootstrap/recovery/verification مربوط به Matrix E2EE. پروفایل CLI مربوط به E2EE همچنین `openclaw matrix encryption setup` و فرمان‌های verification را از طریق همان homeserver مصرف‌شدنی اجرا می‌کند، پیش از آنکه پاسخ‌های Gateway را بررسی کند.

Discord همچنین سناریوهای opt-in مخصوص Mantis برای بازتولید bug دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح status reaction
استفاده کنید، یا از `--scenario discord-thread-reply-filepath-attachment` برای ایجاد یک
thread واقعی Discord و تأیید اینکه `message.thread-reply` یک attachment با
`filePath` را حفظ می‌کند. این سناریوها خارج از lane پیش‌فرض Discord زنده باقی می‌مانند،
زیرا probeهای before/after repro هستند نه پوشش smoke گسترده.
workflow مربوط به Mantis برای thread-attachment همچنین می‌تواند یک ویدیوی witness از Discord Web
با کاربر واردشده اضافه کند، وقتی `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد.
آن viewer profile فقط برای capture بصری است؛ تصمیم pass/fail همچنان از oracle مربوط به Discord REST می‌آید.

CI از همان سطح فرمان در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند.
اجرای زمان‌بندی‌شده و اجرای دستی پیش‌فرض، پروفایل سریع Matrix را با
credentials مربوط به live-frontier فراهم‌شده توسط QA، `--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. اجرای دستی با `matrix_profile=all` به
پنج shard مربوط به profile fan out می‌شود.

برای laneهای smoke با transport واقعی Telegram، Discord، Slack، و WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

آن‌ها یک channel واقعی از پیش موجود را با دو bot یا account هدف می‌گیرند (driver + SUT). env varهای لازم، فهرست سناریوها، artifactهای خروجی، و credential pool مربوط به Convex در [مرجع QA برای Telegram، Discord، Slack، و WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) در پایین مستند شده‌اند.

برای اجرای کامل Slack desktop VM با VNC rescue، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

آن فرمان یک machine desktop/browser از Crabbox اجاره می‌کند، lane زنده Slack را
داخل VM اجرا می‌کند، Slack Web را در browser مربوط به VNC باز می‌کند، desktop را capture می‌کند، و
وقتی capture ویدیو در دسترس باشد، `slack-qa/`، `slack-desktop-smoke.png`، و `slack-desktop-smoke.mp4`
را به دایرکتوری artifact مربوط به Mantis کپی می‌کند. leaseهای desktop/browser در Crabbox
ابزارهای capture و packageهای helper مربوط به browser/native-build را از ابتدا فراهم می‌کنند،
بنابراین سناریو فقط باید fallbackها را روی leaseهای قدیمی‌تر نصب کند.
Mantis زمان‌بندی کلی و per-phase را در
`mantis-slack-desktop-smoke-report.md` گزارش می‌کند تا اجرای کند نشان دهد زمان صرف
warmup اجاره، دریافت credential، setup راه دور، یا کپی artifact شده است. پس از login دستی به Slack Web از طریق VNC،
از `--lease-id <cbx_...>` دوباره استفاده کنید؛ leaseهای بازاستفاده‌شده همچنین cache مربوط به pnpm store در Crabbox را گرم نگه می‌دارند. مقدار پیش‌فرض
`--hydrate-mode source` از یک source checkout تأیید می‌کند و install/build را
داخل VM اجرا می‌کند. فقط وقتی remote workspace بازاستفاده‌شده از قبل
`node_modules` و یک `dist/` ساخته‌شده دارد از `--hydrate-mode prehydrated` استفاده کنید؛ آن mode
گام پرهزینه install/build را رد می‌کند و وقتی workspace آماده نباشد fail-closed می‌شود.
با `--gateway-setup`، Mantis یک Gateway پایدار OpenClaw Slack را
داخل VM روی port `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان lane معمول
QA Slack bot-to-bot را اجرا می‌کند و پس از capture artifact خارج می‌شود.

برای اثبات UI approval بومی Slack با evidence دسکتاپ، mode مربوط به Mantis approval
checkpoint را اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

این mode با `--gateway-setup` ناسازگار است. سناریوهای approval مربوط به Slack را اجرا می‌کند،
scenario idهای غیر approval را رد می‌کند، در هر state مربوط به approval pending و resolved منتظر می‌ماند،
پیام مشاهده‌شده Slack API را در
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png` render می‌کند، سپس اگر هر checkpoint،
message evidence، acknowledgement، یا screenshot render شده‌ای missing یا empty باشد fail می‌کند.
leaseهای سرد CI ممکن است همچنان sign-in مربوط به Slack را در `slack-desktop-smoke.png` نشان دهند؛
تصاویر approval checkpoint مدرک بصری این lane هستند.

چک‌لیست operator، فرمان dispatch برای GitHub workflow، قرارداد evidence-comment،
جدول تصمیم hydrate-mode، تفسیر timing، و گام‌های handling failure در [Runbook دسکتاپ Slack برای Mantis](/fa/concepts/mantis-slack-desktop-runbook) قرار دارند.

برای یک task دسکتاپ به سبک agent/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` یک machine desktop/browser از Crabbox اجاره یا بازاستفاده می‌کند، شروع می‌کند
`crabbox record --while`، browser قابل مشاهده را از طریق یک
`visual-driver` تو در تو هدایت می‌کند، `visual-task.png` را capture می‌کند، وقتی `--vision-mode image-describe` انتخاب شده باشد
`openclaw infer image describe` را روی screenshot اجرا می‌کند، و
`visual-task.mp4`، `mantis-visual-task-summary.json`،
`mantis-visual-task-driver-result.json`، و `mantis-visual-task-report.md` را می‌نویسد.
وقتی `--expect-text` تنظیم شده باشد، prompt بینایی یک verdict ساختاریافته JSON می‌خواهد
و فقط زمانی pass می‌شود که model evidence قابل‌مشاهده مثبت گزارش کند؛
پاسخ منفی‌ای که فقط target text را quote کند assertion را fail می‌کند.
برای یک smoke بدون model که desktop،
browser، screenshot، و لوله‌کشی ویدیو را بدون فراخوانی provider فهم تصویر ثابت می‌کند، از `--vision-mode metadata` استفاده کنید.
Recording یک artifact لازم برای `visual-task` است؛ اگر Crabbox هیچ
`visual-task.mp4` غیرخالی‌ای record نکند، task حتی اگر visual driver
pass شده باشد fail می‌شود. در صورت failure، Mantis lease را برای VNC نگه می‌دارد، مگر اینکه task از قبل
pass شده باشد و `--keep-lease` تنظیم نشده باشد.

پیش از استفاده از live credentials تجمیع‌شده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را validate می‌کند، و وقتی secret مربوط به maintainer حاضر باشد، reachability مربوط به admin/list را تأیید می‌کند. برای secretها فقط status مربوط به set/missing را گزارش می‌کند.

## پوشش transport زنده

laneهای transport زنده به‌جای اینکه هرکدام شکل scenario list خود را اختراع کنند، یک قرارداد مشترک دارند. `qa-channel` مجموعه گسترده رفتار محصول به‌صورت synthetic است و بخشی از ماتریس پوشش transport زنده نیست.

runnerهای transport زنده باید scenario idهای مشترک، helperهای baseline
coverage، و helper مربوط به scenario-selection را از
`openclaw/plugin-sdk/qa-live-transport-scenarios` import کنند.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، درحالی‌که Matrix،
Telegram، و transportهای زنده دیگر یک checklist صریح و مشترک برای قرارداد transport دارند.

برای یک lane مصرف‌شدنی Linux VM بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این یک guest تازه Multipass را boot می‌کند، dependencies را نصب می‌کند، OpenClaw را
داخل guest می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و
summary معمول QA را به `.artifacts/qa-e2e/...` روی host کپی می‌کند.
همان رفتار scenario-selection مربوط به `qa suite` روی host را بازاستفاده می‌کند.
اجرای suite روی host و Multipass به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را
به‌صورت parallel با workerهای Gateway ایزوله اجرا می‌کند. مقدار پیش‌فرض concurrency برای `qa-channel`
۴ است، با سقف تعداد سناریوهای انتخاب‌شده. برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید،
یا برای اجرای serial از `--concurrency 1` استفاده کنید.
برای اجرای benchmark pack مربوط به personal assistant از `--pack personal-agent` استفاده کنید. selector مربوط به
pack با flagهای تکرارشده `--scenario` additive است: ابتدا سناریوهای صریح اجرا می‌شوند،
سپس سناریوهای pack به ترتیب pack با حذف duplicateها اجرا می‌شوند.
وقتی یک runner سفارشی QA از قبل setup مربوط به OpenTelemetry collector را فراهم می‌کند و می‌خواهد سناریوهای smoke مربوط به diagnostics برای OpenTelemetry و Prometheus را با هم انتخاب کند،
از `--pack observability` استفاده کنید.
اگر هر سناریو fail شود، فرمان با مقدار غیر صفر خارج می‌شود. وقتی
artifactها را بدون exit code ناموفق می‌خواهید، از `--allow-failures` استفاده کنید.
اجرای زنده inputهای auth پشتیبانی‌شده QA را که برای
guest عملی هستند forward می‌کند: کلیدهای provider مبتنی بر env، مسیر config مربوط به live provider در QA، و
`CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر root repo نگه دارید تا guest
بتواند از طریق workspace mount شده بازنویسی کند.

## مرجع QA برای Telegram، Discord، Slack و WhatsApp

Matrix به‌دلیل تعداد سناریوهایش و فراهم‌سازی homeserver مبتنی بر Docker، یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، Slack و WhatsApp در برابر ترابردهای واقعی ازپیش‌موجود اجرا می‌شوند، بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                            | توضیح                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | محل نوشتن گزارش‌ها، خلاصه‌ها، شواهد، مصنوعات ویژه ترابرد، و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                    | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | شناسه حساب موقت درون پیکربندی Gateway مربوط به QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` یا `live-frontier` (`live-openai` قدیمی همچنان کار می‌کند).                                                                            |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                   | ارجاع‌های مدل اصلی/جایگزین.                                                                                                                   |
| `--fast`                              | خاموش                                                | حالت سریع provider در صورت پشتیبانی.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                 | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                                                    |

هر مسیر در صورت شکست هر سناریو با مقدار غیرصفر خارج می‌شود. `--allow-failures` مصنوعات را بدون تنظیم کد خروج شکست‌خورده می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز (driver + SUT) هدف می‌گیرد. بات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده بات-به-بات وقتی هر دو بات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند بهترین کارکرد را دارد.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - شناسه عددی چت (رشته).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

مجموعه پیش‌فرض ضمنی همیشه canary، دروازه‌گذاری mention، پاسخ‌های فرمان بومی، آدرس‌دهی فرمان، و پاسخ‌های گروهی بات-به-بات را پوشش می‌دهد. پیش‌فرض‌های `mock-openai` همچنین بررسی‌های قطعی زنجیره پاسخ و استریم پیام نهایی را شامل می‌شوند. `telegram-current-session-status-tool` همچنان opt-in می‌ماند، زیرا فقط وقتی مستقیما پس از canary نخ‌بندی شود پایدار است، نه پس از پاسخ‌های فرمان بومی دلخواه. برای چاپ تقسیم‌بندی فعلی پیش‌فرض/اختیاری همراه با ارجاع‌های رگرسیون از `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` استفاده کنید.

مصنوعات خروجی:

- `telegram-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابرد زنده، شامل فیلدهای profile، پوشش، provider، channel، مصنوعات، نتیجه، و RTT.

اجراهای بسته Telegram از همان قرارداد اعتبارنامه Telegram استفاده می‌کنند. اندازه‌گیری تکراری RTT
بخشی از مسیر زنده معمول بسته Telegram است؛ توزیع RTT
برای بررسی RTT انتخاب‌شده، زیر `result.timing` در `qa-evidence.json` ادغام می‌شود.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

وقتی `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` تنظیم شده باشد، پوشش‌دهنده زنده بسته
یک اعتبارنامه `kind: "telegram"` اجاره می‌کند، env گروه/driver/بات SUT اجاره‌شده
را به اجرای بسته نصب‌شده صادر می‌کند، Heartbeat اجاره را انجام می‌دهد، و هنگام
خاموشی آن را آزاد می‌کند. پوشش‌دهنده بسته، خارج از CI و وقتی Convex انتخاب شده باشد،
به‌طور پیش‌فرض ۲۰ بررسی RTT از
`telegram-mentioned-message-reply`، مهلت RTT برابر ۳۰ ثانیه، و نقش Convex
`maintainer` را استفاده می‌کند. برای تنظیم اندازه‌گیری RTT بدون
ایجاد فرمان RTT جداگانه یا قالب خلاصه ویژه Telegram،
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`، `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`،
یا `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات driver که توسط harness کنترل می‌شود و یک بات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin همراه Discord شروع می‌شود. مدیریت mention در کانال، این‌که بات SUT فرمان بومی `/help` را در Discord ثبت کرده است، و سناریوهای شواهد opt-in مربوط به Mantis را راستی‌آزمایی می‌کند.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با شناسه کاربر بات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت مسیر سریع شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعات پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` کانال صوتی/استیج را برای `discord-voice-autojoin` انتخاب می‌کند؛ بدون آن، سناریو نخستین کانال صوتی/استیج قابل مشاهده برای بات SUT را انتخاب می‌کند.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سناریوی صوتی opt-in. به‌تنهایی اجرا می‌شود، `channels.discord.voice.autoJoin` را فعال می‌کند، و راستی‌آزمایی می‌کند که وضعیت صوتی فعلی Discord برای بات SUT همان کانال صوتی/استیج هدف است. اعتبارنامه‌های Convex Discord ممکن است شامل `voiceChannelId` اختیاری باشند؛ در غیر این صورت اجراکننده نخستین کانال صوتی/استیج قابل مشاهده در guild را کشف می‌کند.
- `discord-status-reactions-tool-only` - سناریوی opt-in مربوط به Mantis. به‌تنهایی اجرا می‌شود، زیرا SUT را به پاسخ‌های guild همیشه‌روشن و فقط‌ابزار با `messages.statusReactions.enabled=true` تغییر می‌دهد، سپس یک timeline واکنش REST به‌همراه مصنوعات بصری HTML/PNG ثبت می‌کند. گزارش‌های قبل/بعد Mantis همچنین مصنوعات MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی پیوستن خودکار صوتی Discord را صریحا اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

سناریوی واکنش وضعیت Mantis را صریحا اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

مصنوعات خروجی:

- `discord-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابرد زنده.
- `discord-qa-observed-messages.json` - بدنه‌ها redacted می‌شوند مگر این‌که `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی واکنش وضعیت اجرا شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو بات متمایز هدف می‌گیرد: یک بات driver که توسط harness کنترل می‌شود و یک بات SUT که توسط Gateway فرزند OpenClaw از طریق Plugin همراه Slack شروع می‌شود.

envهای لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعات پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` checkpointهای تایید بصری
  را برای Mantis فعال می‌کند. اجراکننده `<scenario>.pending.json` و
  `<scenario>.resolved.json` را می‌نویسد، سپس منتظر فایل‌های `.ack.json` منطبق می‌ماند.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` مهلت تایید checkpoint
  را override می‌کند. پیش‌فرض `120000` است.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سناریوی opt-in تایید exec بومی Slack.
  از طریق Gateway درخواست تایید exec می‌دهد، راستی‌آزمایی می‌کند پیام Slack
  دکمه‌های تایید بومی دارد، آن را resolve می‌کند، و به‌روزرسانی resolve‌شده Slack را راستی‌آزمایی می‌کند.
- `slack-approval-plugin-native` - سناریوی opt-in تایید Plugin بومی Slack.
  forwarding تایید exec و Plugin را با هم فعال می‌کند تا رویدادهای Plugin
  توسط مسیریابی تایید exec سرکوب نشوند، سپس همان مسیر UI بومی Slack در حالت pending/resolved
  را راستی‌آزمایی می‌کند.

مصنوعات خروجی:

- `slack-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابرد زنده.
- `slack-qa-observed-messages.json` - بدنه‌ها redacted می‌شوند مگر این‌که `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.
- `approval-checkpoints/` - فقط وقتی Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` را تنظیم کند؛ شامل JSON checkpoint،
  JSON تایید، و اسکرین‌شات‌های pending/resolved است.

#### راه‌اندازی فضای کاری Slack

این مسیر به دو اپ Slack متمایز در یک workspace، به‌علاوه کانالی که هر دو بات عضو آن باشند نیاز دارد:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو بات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ مسیر در هر اجرا پست می‌گذارد.
- `driverBotToken` - توکن بات (`xoxb-...`) اپ **Driver**.
- `sutBotToken` - توکن بات (`xoxb-...`) اپ **SUT**، که باید اپ Slack جداگانه‌ای از driver باشد تا شناسه کاربر بات آن متمایز باشد.
- `sutAppToken` - توکن سطح اپ (`xapp-...`) اپ SUT با `connections:write`، که توسط Socket Mode استفاده می‌شود تا اپ SUT بتواند رویدادها را دریافت کند.

یک workspace اختصاصی Slack برای QA را به استفاده دوباره از workspace تولید ترجیح دهید.

manifest زیر برای SUT عمدا نصب تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) را به مجوزها و رویدادهایی که توسط مجموعه QA زنده Slack پوشش داده می‌شوند محدود می‌کند. برای راه‌اندازی کانال تولید همان‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمدا جدا است، زیرا این مسیر به دو شناسه کاربر بات متمایز در یک workspace نیاز دارد.

**۱. اپ Driver را بسازید**

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید - این مقدار به `driverBotToken` تبدیل می‌شود. درایور فقط باید پیام ارسال کند و خودش را شناسایی کند؛ بدون event و بدون Socket Mode.

**۲. اپلیکیشن SUT را بسازید**

_Create New App → From a manifest_ را در همان فضای کاری تکرار کنید. این اپلیکیشن QA عمداً از نسخه محدودتری از مانیفست تولیدی Plugin داخلی Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeها و eventهای مربوط به واکنش‌ها حذف شده‌اند، چون مجموعه QA زنده Slack هنوز مدیریت واکنش را پوشش نمی‌دهد.

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

بعد از اینکه Slack اپلیکیشن را ساخت، در صفحه تنظیمات آن دو کار انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این مقدار به `sutBotToken` تبدیل می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope به نام `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار به `sutAppToken` تبدیل می‌شود.

با فراخوانی `auth.test` روی هر token، بررسی کنید که دو bot شناسه‌های کاربری متمایز دارند. runtime درایور و SUT را با شناسه کاربری تشخیص می‌دهد؛ استفاده دوباره از یک اپلیکیشن برای هر دو، mention-gating را فوراً شکست می‌دهد.

**۳. کانال را بسازید**

در فضای کاری QA، یک کانال بسازید (برای مثال `#openclaw-qa`) و هر دو bot را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید - این مقدار به `channelId` تبدیل می‌شود. کانال عمومی کافی است؛ اگر از کانال خصوصی استفاده کنید، هر دو اپلیکیشن از قبل `groups:history` دارند، بنابراین خواندن‌های history در harness همچنان موفق می‌شود.

**۴. اعتبارنامه‌ها را ثبت کنید**

دو گزینه دارید. برای اشکال‌زدایی روی یک ماشین از env vars استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس بدهید)، یا استخر مشترک Convex را seed کنید تا CI و نگه‌دارندگان دیگر بتوانند آن‌ها را lease کنند.

برای استخر Convex، چهار فیلد را در یک فایل JSON بنویسید:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

وقتی `OPENCLAW_QA_CONVEX_SITE_URL` و `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` در shell شما export شده‌اند، ثبت و بررسی کنید:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

انتظار `count: 1`، `status: "active"`، و نبود فیلد `lease` را داشته باشید.

**۵. انتها تا انتها بررسی کنید**

lane را به‌صورت محلی اجرا کنید تا تأیید شود هر دو bot می‌توانند از طریق broker با هم صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` هم `slack-canary` و هم `slack-mention-gating` را با وضعیت `pass` نشان می‌دهد. اگر lane حدود ۹۰ ثانیه معطل بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا استخر خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` به شما می‌گوید کدام مورد است.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

دو حساب اختصاصی WhatsApp Web را هدف می‌گیرد: یک حساب درایور که توسط
harness کنترل می‌شود و یک حساب SUT که توسط Gateway فرزند OpenClaw از طریق
Plugin داخلی WhatsApp شروع می‌شود.

env لازم هنگام استفاده از `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختیاری:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` سناریوهای گروهی مانند
  `whatsapp-mention-gating` و `whatsapp-group-allowlist-block` را فعال می‌کند.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` بدنه پیام‌ها را در
  artifactهای پیام مشاهده‌شده نگه می‌دارد.

کاتالوگ سناریو (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- خط پایه و gating گروهی: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- فرمان‌های native: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- رفتار پاسخ و خروجی نهایی: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- رسانه ورودی و پیام‌های ساخت‌یافته: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. این‌ها eventهای واقعی تصویر، صدا،
  سند، مکان، مخاطب و استیکر WhatsApp را از طریق درایور ارسال می‌کنند.
- پوشش Gateway خروجی و actionهای پیام:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- پوشش کنترل دسترسی: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- تأییدیه‌های native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- واکنش‌های وضعیت: `whatsapp-status-reactions`.

این کاتالوگ در حال حاضر ۳۶ سناریو دارد. lane پیش‌فرض `live-frontier` برای پوشش smoke سریع
روی ۱۰ سناریو کوچک نگه داشته شده است. lane پیش‌فرض `mock-openai`
۳۱ سناریوی قطعی را از طریق transport واقعی WhatsApp اجرا می‌کند و فقط
خروجی مدل را mock می‌کند. سناریوهای تأییدیه و چند بررسی سنگین‌تر/مسدودکننده
همچنان با شناسه سناریو به‌صورت صریح اجرا می‌شوند.

درایور QA WhatsApp رویدادهای زنده ساخت‌یافته (`text`, `media`,
`location`, `reaction` و `poll`) را مشاهده می‌کند و می‌تواند فعالانه رسانه، poll،
مخاطب، مکان و استیکر ارسال کند. QA Lab آن درایور را از طریق سطح package
`@openclaw/whatsapp/api.js` وارد می‌کند، نه با دسترسی به فایل‌های خصوصی
runtime WhatsApp. محتوای پیام به‌صورت پیش‌فرض redacted می‌شود. پوشش poll
خروجی و upload-file از طریق فراخوانی‌های قطعی Gateway با `poll` و
`message.action` اجرا می‌شود، نه فقط از طریق فراخوانی tool مبتنی بر prompt مدل.

artifactهای خروجی:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ورودی‌های evidence برای بررسی‌های transport زنده.
- `whatsapp-qa-observed-messages.json` - بدنه‌ها redacted هستند مگر اینکه `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` باشد.

### استخر اعتبارنامه Convex

laneهای Telegram، Discord، Slack و WhatsApp می‌توانند به‌جای خواندن env vars بالا، اعتبارنامه‌ها را از یک استخر مشترک Convex lease کنند. `--credential-source convex` را پاس بدهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری می‌گیرد، در مدت اجرا برای آن Heartbeat می‌فرستد و هنگام shutdown آزادش می‌کند. kindهای استخر `"telegram"`، `"discord"`، `"slack"` و `"whatsapp"` هستند.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` باید یک رشته عددی chat-id باشد.
- کاربر واقعی Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - فقط برای proof مربوط به Mantis Telegram Desktop. laneهای عمومی QA Lab نباید این kind را acquire کنند.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - شماره‌های تلفن باید رشته‌های E.164 متمایز باشند.

گردش‌کار proof مربوط به Mantis Telegram Desktop یک lease انحصاری Convex
از نوع `telegram-user` را هم برای درایور CLI مبتنی بر TDLib و هم برای شاهد Telegram Desktop
نگه می‌دارد، سپس بعد از انتشار proof آن را آزاد می‌کند.

وقتی یک PR به diff بصری قطعی نیاز دارد، Mantis می‌تواند همان پاسخ مدل mock را
روی `main` و روی head همان PR استفاده کند، در حالی که formatter یا لایه تحویل Telegram
تغییر می‌کند. پیش‌فرض‌های capture برای نظرهای PR تنظیم شده‌اند: کلاس استاندارد Crabbox،
ضبط desktop با ۲۴fps، GIF حرکتی با ۲۴fps و عرض preview برابر ۱۹۲۰px.
نظرهای قبل/بعد باید یک bundle تمیز منتشر کنند که فقط GIFهای
مورد نظر را در بر داشته باشد.

laneهای Slack هم می‌توانند از استخر استفاده کنند. بررسی‌های شکل payload Slack فعلاً در runner QA Slack قرار دارند، نه در broker؛ از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید، همراه با یک شناسه کانال Slack مانند `Cxxxxxxxxxx`. برای provisioning اپلیکیشن و scopeها، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

env vars عملیاتی و قرارداد endpoint مربوط به broker در [Testing → Shared Telegram credentials via Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام این بخش به قبل از استخر چندکاناله برمی‌گردد؛ semantics مربوط به lease بین kindها مشترک است).

## seedهای مبتنی بر repo

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

این‌ها عمداً در git هستند تا برنامه QA هم برای انسان‌ها و هم برای
agent قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی سناریوی YAML باقی بماند. هر فایل YAML سناریو
منبع حقیقت برای یک اجرای تست است و باید این‌ها را تعریف کند:

- `title` در سطح بالا
- metadata مربوط به `scenario`
- metadata اختیاری category، capability، lane و risk در `scenario`
- ارجاع‌های docs و code در `scenario`
- نیازمندی‌های اختیاری Plugin در `scenario`
- patch اختیاری config مربوط به Gateway در `scenario`
- `flow` اجرایی در سطح بالا برای سناریوهای flow، یا `scenario.execution.kind` /
  `scenario.execution.path` برای سناریوهای Vitest و Playwright

سطح زمان‌اجرای قابل استفادهٔ مجدد که پشتوانهٔ `flow` است مجاز است عمومی
و میان‌برشی بماند. برای نمونه، سناریوهای YAML می‌توانند helperهای سمت ترنسپورت
را با helperهای سمت مرورگر ترکیب کنند که Control UI تعبیه‌شده را از طریق درز
`browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner ویژه‌ای اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشهٔ درخت منبع.
هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای ردیابی پیاده‌سازی
از `docsRefs` و `codeRefs` استفاده کنید.

فهرست پایه باید آن‌قدر گسترده بماند که این موارد را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخهٔ عمر اکشن پیام
- کال‌بک‌های Cron
- یادآوری حافظه
- تغییر مدل
- واگذاری به زیرعامل
- خواندن repo و خواندن مستندات
- یک کار build کوچک مانند Lobster Invaders

## laneهای mock ارائه‌دهنده

`qa suite` دو lane محلی mock ارائه‌دهنده دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این lane به‌عنوان lane پیش‌فرض
  mock قطعی برای QA مبتنی بر repo و gateهای هم‌ارزی باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهندهٔ مبتنی بر AIMock را برای پوشش آزمایشی پروتکل،
  fixture، record/replay، و chaos راه‌اندازی می‌کند. این مورد افزوده است و
  جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی lane ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌های خود، راه‌اندازی سرور محلی، پیکربندی مدل gateway،
نیازهای آماده‌سازی profile احراز هویت، و flagهای قابلیت live/mock است. کد مشترک suite و
gateway باید به‌جای شاخه‌زدن بر اساس نام ارائه‌دهنده‌ها، از طریق registry ارائه‌دهنده مسیر‌دهی کند.

## آداپتورهای ترنسپورت

`qa-lab` مالک یک درز ترنسپورت عمومی برای سناریوهای QA در YAML است. `qa-channel`
پیش‌فرض synthetic است. `crabline` سرورهای محلی هم‌شکل ارائه‌دهنده را راه‌اندازی می‌کند و
Pluginهای کانال معمول OpenClaw را در برابر آن‌ها اجرا می‌کند. `live` برای
اعتبارنامه‌های واقعی ارائه‌دهنده و کانال‌های خارجی رزرو شده است.

در سطح معماری، این تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی worker، نوشتن artifact، و گزارش‌دهی است.
- آداپتور ترنسپورت مالک پیکربندی gateway، readiness، مشاهدهٔ ورودی و خروجی، اکشن‌های ترنسپورت، و وضعیت نرمال‌شدهٔ ترنسپورت است.
- فایل‌های سناریوی YAML زیر `qa/scenarios/` اجرای تست را تعریف می‌کنند؛ `qa-lab` سطح زمان‌اجرای قابل استفادهٔ مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سیستم QA در YAML به پیاده‌سازی کانال به‌همراه
یک بستهٔ سناریو نیاز دارد که قرارداد کانال را تمرین کند. برای پوشش smoke در CI، سرور
ارائه‌دهندهٔ fake متناظر Crabline را اضافه کنید و آن را از طریق driver `crabline`
در دسترس بگذارید.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، ریشهٔ command سطح‌بالای QA جدید اضافه نکنید.

`qa-lab` مالک سازوکارهای host مشترک است:

- ریشهٔ command `openclaw qa`
- راه‌اندازی و teardown suite
- هم‌زمانی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد ترنسپورت هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشهٔ مشترک `qa` mount می‌شود
- اینکه gateway چگونه برای آن ترنسپورت پیکربندی می‌شود
- اینکه readiness چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شدهٔ ترنسپورت چگونه در دسترس قرار می‌گیرند
- اینکه اکشن‌های متکی بر ترنسپورت چگونه اجرا می‌شوند
- اینکه reset یا cleanup اختصاصی ترنسپورت چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را مالک ریشهٔ مشترک `qa` نگه دارید.
2. runner ترنسپورت را روی درز host مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای اختصاصی ترنسپورت را داخل Plugin runner یا harness کانال نگه دارید.
4. runner را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک command ریشهٔ رقیب. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایهٔ متناظر `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ CLI lazy و اجرای runner باید پشت entrypointهای جداگانه بمانند.
5. سناریوهای YAML را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo در حال انجام یک migration عمدی باشد.

قاعدهٔ تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را بتوان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` قرار دهید.
- اگر رفتار به یک ترنسپورت کانال وابسته است، آن را در همان Plugin runner یا harness Plugin نگه دارید.
- اگر سناریویی به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند استفاده کند، به‌جای شاخهٔ اختصاصی کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک ترنسپورت معنا دارد، سناریو را اختصاصی ترنسپورت نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند - `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` - اما نگارش سناریوهای جدید باید از نام‌های عمومی استفاده کند. این aliasها برای جلوگیری از migration یک‌باره وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` یک گزارش پروتکل Markdown را از timeline مشاهده‌شدهٔ bus export می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی مسدود ماند
- چه سناریوهای follow-up ارزش افزودن دارند

برای inventory سناریوهای موجود - مفید هنگام اندازه‌گیری کار follow-up یا اتصال یک ترنسپورت جدید - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).
هنگام انتخاب proof متمرکز برای یک رفتار یا مسیر فایل لمس‌شده، `pnpm openclaw qa coverage --match <query>` را اجرا کنید.
گزارش match در metadata سناریو، refs مستندات، refs کد، شناسه‌های پوشش، Pluginها، و نیازمندی‌های ارائه‌دهنده جست‌وجو می‌کند، سپس targetهای متناظر `qa suite --scenario ...` را چاپ می‌کند.
هر اجرای `qa suite` برای مجموعه سناریوی انتخاب‌شده artifactهای سطح‌بالای
`qa-evidence.json`، `qa-suite-summary.json`، و `qa-suite-report.md` را می‌نویسد.
سناریوهایی که `execution.kind: vitest` یا `execution.kind: playwright` را اعلام می‌کنند،
مسیر تست متناظر را اجرا می‌کنند و logهای هر سناریو را نیز می‌نویسند.
سناریوهایی که `execution.kind: script` را اعلام می‌کنند، تولیدکنندهٔ evidence را در
`execution.path` از طریق `node --import tsx` اجرا می‌کنند (با گسترش
`${outputDir}` و `${scenarioId}` در `execution.args`)؛ تولیدکننده
`qa-evidence.json` خودش را می‌نویسد، که entryهای آن به خروجی suite import می‌شوند
و مسیرهای artifact آن نسبت به همان `qa-evidence.json` تولیدکننده resolve می‌شوند.
وقتی `qa suite` از طریق `qa run --qa-profile` رسیده شود، همان `qa-evidence.json`
خلاصهٔ scorecard profile را نیز برای دسته‌های taxonomy انتخاب‌شده شامل می‌شود.
با آن مثل کمک‌ابزار discovery رفتار کنید، نه جایگزین gate؛ سناریوی انتخاب‌شده همچنان برای رفتار تحت تست به حالت ارائه‌دهنده، ترنسپورت live، Multipass، Testbox، یا release lane درست نیاز دارد.
برای زمینهٔ scorecard، [کارت امتیاز بلوغ](/fa/maturity/scorecard) را ببینید.

برای بررسی‌های شخصیت و سبک، همان سناریو را روی چند ref مدل live اجرا کنید
و یک گزارش Markdown داوری‌شده بنویسید:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

این command فرایندهای child محلی QA gateway را اجرا می‌کند، نه Docker. سناریوهای character eval
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر مانند
چت، کمک workspace، و taskهای فایل کوچک را اجرا کنند. به مدل candidate نباید
گفته شود که در حال ارزیابی است. این command هر transcript کامل را حفظ می‌کند،
آمار پایهٔ اجرا را ثبت می‌کند، سپس از مدل‌های judge در fast mode با reasoning
`xhigh`، در جاهایی که پشتیبانی می‌شود، می‌خواهد اجراها را بر اساس طبیعی‌بودن، حال‌وهوا، و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسهٔ ارائه‌دهنده‌ها از `--blind-judge-models` استفاده کنید: prompt داور همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با labelهای خنثی
مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از parse کردن، رتبه‌بندی‌ها را به
refهای واقعی برمی‌گرداند.
اجراهای candidate به‌صورت پیش‌فرض از thinking در سطح `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای eval قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک candidate مشخص را inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و فرم قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری حفظ شده است.
refهای candidate مربوط به OpenAI به‌صورت پیش‌فرض fast mode دارند تا در جایی که
ارائه‌دهنده پشتیبانی می‌کند، priority processing استفاده شود. وقتی یک candidate یا judge
به override نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را inline اضافه کنید.
`--fast` را فقط وقتی pass کنید که می‌خواهید fast mode را برای همهٔ مدل‌های candidate اجباری کنید.
مدت‌زمان candidate و judge برای تحلیل benchmark در گزارش ثبت می‌شود، اما promptهای judge صریحاً می‌گویند
که بر اساس سرعت رتبه‌بندی نکنند.
اجرای مدل‌های candidate و judge هر دو به‌صورت پیش‌فرض هم‌زمانی 16 دارند. وقتی limitهای
ارائه‌دهنده یا فشار gateway محلی یک اجرا را بیش از حد پرنویز می‌کند، `--concurrency`
یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ candidate `--model` پاس داده نشده باشد، character eval به‌صورت پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-8`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` پاس داده نشده باشد.
وقتی هیچ `--judge-model` پاس داده نشده باشد، judgeها به‌صورت پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high` هستند.

## مستندات مرتبط

- [QA ماتریسی](/fa/concepts/qa-matrix)
- [کارت امتیاز بلوغ](/fa/maturity/scorecard)
- [بستهٔ benchmark عامل شخصی](/fa/concepts/personal-agent-benchmark-pack)
- [کانال QA](/fa/channels/qa-channel)
- [تست‌کردن](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
