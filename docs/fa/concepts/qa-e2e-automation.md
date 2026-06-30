---
read_when:
    - درک اینکه استک QA چگونه در کنار هم قرار می‌گیرد
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای QA مبتنی بر مخزن
    - ساخت خودکارسازی QA با واقع‌گرایی بالاتر پیرامون داشبورد Gateway
summary: 'نمای کلی پشته QA: `qa-lab`، `qa-channel`، سناریوهای مبتنی بر مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-06-30T14:14:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشتهٔ خصوصی QA برای این است که OpenClaw را به‌شکلی واقعی‌تر و
شبیه به کانال، فراتر از توان یک آزمون واحد، اجرا و بررسی کند.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش، و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهدهٔ رونوشت،
  تزریق پیام‌های ورودی، و صادر کردن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجرایی آینده: آداپتورهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های اولیهٔ پشتیبانی‌شده توسط مخزن برای وظیفهٔ آغازین و سناریوهای
  پایهٔ QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زندهٔ قبل و بعد برای باگ‌هایی که
  به انتقال‌های واقعی، اسکرین‌شات‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح دستور

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| دستور                                                | هدف                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده بدون `--qa-profile`؛ اجراکنندهٔ پروفایل بلوغ مبتنی بر طبقه‌بندی با `--qa-profile smoke-ci`، `--qa-profile release`، یا `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | اجرای سناریوهای پشتیبانی‌شده توسط مخزن در برابر مسیر QA gateway. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM لینوکسی یک‌بارمصرف.                                                                                                            |
| `qa coverage`                                       | چاپ فهرست پوشش سناریوی YAML (`--json` برای خروجی ماشینی).                                                                                                                                                                                                              |
| `qa parity-report`                                  | مقایسهٔ دو فایل `qa-suite-summary.json` و نوشتن گزارش برابری عاملی، یا استفاده از `--runtime-axis --token-efficiency` برای نوشتن گزارش‌های برابری زمان اجرا و کارایی توکن Codex در برابر OpenClaw از یک خلاصهٔ جفت زمان اجرا.                                      |
| `qa character-eval`                                 | اجرای سناریوی QA شخصیت در چند مدل زنده همراه با گزارش داوری‌شده. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                                  |
| `qa manual`                                         | اجرای یک پرامپت یک‌باره در برابر مسیر provider/model انتخاب‌شده.                                                                                                                                                                                                       |
| `qa ui`                                             | راه‌اندازی رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                               |
| `qa docker-build-image`                             | ساخت تصویر Docker از پیش آماده‌شدهٔ QA.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | نوشتن داربست docker-compose برای داشبورد QA و مسیر gateway.                                                                                                                                                                                                            |
| `qa up`                                             | ساخت سایت QA، راه‌اندازی پشتهٔ پشتیبانی‌شده با Docker، چاپ URL (نام مستعار: `pnpm qa:lab:up`؛ گونهٔ `:fast` گزینه‌های `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                                         |
| `qa aimock`                                         | راه‌اندازی فقط سرور provider به نام AIMock.                                                                                                                                                                                                                            |
| `qa mock-openai`                                    | راه‌اندازی فقط سرور provider سناریوآگاه `mock-openai`.                                                                                                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | مدیریت مخزن مشترک اعتبارنامه‌های Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [QA ماتریس](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                              |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                                |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                          |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                                  |
| `qa whatsapp`                                       | مسیر انتقال زنده در برابر حساب‌های واقعی WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | اجراکنندهٔ راستی‌آزمایی قبل و بعد برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، دودسنجی دسکتاپ/مرورگر Crabbox، و دودسنجی Slack در VNC. [Mantis](/fa/concepts/mantis) و [راهنمای اجرای دسکتاپ Slack در Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

`qa run` مبتنی بر پروفایل، عضویت را از `taxonomy.yaml` می‌خواند، سپس
سناریوهای حل‌شده را از طریق `qa suite` اجرا می‌کند. `--surface` و
`--category` پروفایل انتخاب‌شده را فیلتر می‌کنند، نه اینکه مسیرهای جداگانه تعریف کنند.
فایل حاصل `qa-evidence.json` شامل خلاصهٔ کارت امتیاز پروفایل با
شمارش دسته‌های انتخاب‌شده و شناسه‌های پوششِ مفقود است؛ ورودی‌های شواهد
تکی همچنان منبع حقیقت برای آزمون‌ها، نقش‌های پوشش، و نتایج می‌مانند.
شناسه‌های پوشش ویژگی طبقه‌بندی، هدف‌های دقیق اثبات هستند، نه نام‌های مستعار.
پوشش سناریوی اصلی شناسه‌های منطبق را برآورده می‌کند؛ پوشش ثانویه صرفاً جنبهٔ راهنما دارد.
شناسه‌های پوشش از شکل نقطه‌دار `namespace.behavior` با بخش‌های حروف‌عددی/خط‌تیرهٔ
کوچک استفاده می‌کنند؛ شناسه‌های پروفایل، سطح، و دسته همچنان می‌توانند از
شناسه‌های خط‌تیره‌دار یا نقطه‌دار موجود طبقه‌بندی استفاده کنند.
شواهد کم‌حجم، `execution` هر ورودی را حذف می‌کند و `evidenceMode: "slim"` را تنظیم می‌کند؛
`smoke-ci` به‌صورت پیش‌فرض کم‌حجم است، و `--evidence-mode full` ورودی‌های کامل را برمی‌گرداند:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

از `smoke-ci` برای اثبات پروفایل قطعی با providerهای مدل mock و
سرورهای provider محلی Crabline استفاده کنید. از `release` برای اثبات Stable/LTS در برابر کانال‌های زنده
استفاده کنید. از `all` فقط برای اجرای شواهد صریحِ کل طبقه‌بندی استفاده کنید؛ این گزینه
همهٔ دسته‌های بلوغ فعال را انتخاب می‌کند و می‌تواند از طریق گردش‌کار `QA Profile
Evidence` با `qa_profile=all` اجرا شود. وقتی یک دستور به پروفایل ریشهٔ OpenClaw
هم نیاز دارد، پروفایل ریشه را پیش از دستور QA بگذارید:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) همراه با عامل.
- راست: QA Lab، که رونوشت شبیه Slack و طرح سناریو را نشان می‌دهد.

آن را با این دستور اجرا کنید:

```bash
pnpm qa:lab:up
```

این دستور سایت QA را می‌سازد، مسیر gateway پشتیبانی‌شده با Docker را راه‌اندازی می‌کند، و صفحهٔ
QA Lab را در دسترس قرار می‌دهد تا یک اپراتور یا حلقهٔ خودکارسازی بتواند به عامل یک مأموریت QA
بدهد، رفتار کانال واقعی را مشاهده کند، و ثبت کند چه چیزی کار کرد، چه چیزی شکست خورد، یا
چه چیزی مسدود ماند.

برای تکرار سریع‌تر روی رابط کاربری QA Lab بدون بازسازی تصویر Docker در هر بار،
پشته را با یک بستهٔ QA Lab متصل‌شده با bind mount راه‌اندازی کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک تصویر از پیش ساخته‌شده نگه می‌دارد و
`extensions/qa-lab/web/dist` را در کانتینر `qa-lab` به‌صورت bind mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر دوباره می‌سازد، و مرورگر وقتی هش دارایی QA Lab
تغییر کند به‌صورت خودکار دوباره بارگذاری می‌شود.

برای یک دودسنجی سیگنال محلی OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک دریافت‌کنندهٔ محلی OTLP/HTTP را راه‌اندازی می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس تأیید می‌کند که traceها،
metricها، و logها صادر شده‌اند. این اسکریپت spanهای trace protobuf صادرشده را رمزگشایی می‌کند
و شکل حیاتی برای release را بررسی می‌کند:
`openclaw.run`، `openclaw.harness.run`، یک span فراخوانی مدل مطابق با آخرین قرارداد معنایی GenAI،
`openclaw.context.assembled`، و `openclaw.message.delivery`
باید وجود داشته باشند. این دودسنجی
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` را اجباری می‌کند، بنابراین span فراخوانی مدل
باید از نام `{gen_ai.operation.name} {gen_ai.request.model}` استفاده کند؛
فراخوانی‌های مدل نباید در turnهای موفق `StreamAbandoned` را صادر کنند؛ شناسه‌های خام تشخیصی و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. payloadهای خام OTLP
نباید sentinel پرامپت، sentinel پاسخ، یا کلید نشست QA را داشته باشند.
این اسکریپت `otel-smoke-summary.json` را کنار artifacts مجموعهٔ QA می‌نویسد.

برای یک دودسنجی OpenTelemetry پشتیبانی‌شده با collector، اجرا کنید:

```bash
pnpm qa:otel:collector-smoke
```

این مسیر یک کانتینر Docker واقعی OpenTelemetry Collector را جلوی همان
دریافت‌کنندهٔ محلی قرار می‌دهد. هنگام تغییر سیم‌کشی endpoint، سازگاری collector،
یا رفتار صدور OTLP که دریافت‌کنندهٔ درون‌فرآیندی می‌تواند پنهان کند، از آن استفاده کنید.

برای دودسنجی محافظت‌شدهٔ scrape در Prometheus، اجرا کنید:

```bash
pnpm qa:prometheus:smoke
```

آن alias سناریوی QA به نام `docker-prometheus-smoke` را با فعال بودن
`diagnostics-prometheus` اجرا می‌کند، تأیید می‌کند که scrapeهای بدون احراز هویت رد می‌شوند،
سپس بررسی می‌کند که scrape احراز هویت‌شده شامل خانواده‌های metric حیاتی برای release باشد
بدون محتوای prompt، محتوای response، شناسه‌های خام diagnostic، tokenهای auth،
یا مسیرهای محلی.

برای اجرای پشت‌سرهم هر دو smoke مربوط به observability، استفاده کنید از:

```bash
pnpm qa:observability:smoke
```

برای lane مربوط به OpenTelemetry با پشتوانه collector به‌همراه smoke مربوط به scrape محافظت‌شده Prometheus، استفاده کنید از:

```bash
pnpm qa:observability:collector-smoke
```

QA مربوط به observability فقط در source checkout باقی می‌ماند. tarball مربوط به npm عمداً
QA Lab را حذف می‌کند، بنابراین laneهای release مربوط به package Docker فرمان‌های `qa` را اجرا نمی‌کنند. هنگام تغییر
instrumentation مربوط به diagnostics، از یک source checkout ساخته‌شده
`pnpm qa:otel:smoke`، `pnpm qa:prometheus:smoke`، یا
`pnpm qa:observability:smoke` را اجرا کنید.

برای یک lane smoke واقعی از نظر transport برای Matrix که به credentialهای model-provider
نیاز ندارد، profile سریع را با provider قطعی و mock برای OpenAI اجرا کنید:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

برای lane مربوط به provider زنده frontier، credentialهای سازگار با OpenAI را
صریحاً ارائه کنید:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ profile/scenario، env varها، و چیدمان artifact برای این lane در [Matrix QA](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver یک‌بارمصرف Tuwunel را در Docker provision می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک child QA gateway محدود به همان transport اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار transport را پوشش می‌دهند که unit testها نمی‌توانند آن را end to end اثبات کنند: mention gating، سیاست‌های allow-bot، allowlistها، replyهای سطح بالا و threadشده، مسیریابی DM، مدیریت reaction، سرکوب edit ورودی، dedupe بازپخش پس از restart، بازیابی از interruption در homeserver، تحویل metadata مربوط به approval، مدیریت media، و جریان‌های bootstrap/recovery/verification مربوط به Matrix E2EE. profile مربوط به E2EE CLI همچنین فرمان‌های `openclaw matrix encryption setup` و verification را از طریق همان homeserver یک‌بارمصرف اجرا می‌کند، پیش از آنکه replyهای gateway را بررسی کند.

Discord همچنین سناریوهای opt-in فقط برای Mantis جهت بازتولید bug دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح reactionهای status
استفاده کنید، یا از `--scenario discord-thread-reply-filepath-attachment` برای ساخت یک
thread واقعی Discord و تأیید اینکه `message.thread-reply` یک attachment از نوع
`filePath` را حفظ می‌کند. این سناریوها خارج از lane زنده پیش‌فرض Discord باقی می‌مانند
زیرا probeهای before/after برای بازتولید هستند، نه پوشش smoke گسترده.
workflow مربوط به thread-attachment در Mantis همچنین وقتی `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد، می‌تواند یک ویدیوی witness از Discord Web
با کاربر واردشده اضافه کند. آن profile viewer فقط برای capture بصری است؛ تصمیم pass/fail
همچنان از oracle مربوط به Discord REST می‌آید.

CI از همان سطح فرمان در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند.
اجراهای زمان‌بندی‌شده و دستی پیش‌فرض، profile سریع Matrix را با
credentialهای live-frontier ارائه‌شده توسط QA، `--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. اجرای دستی با `matrix_profile=all` به
پنج shard مربوط به profile fan out می‌شود.

برای laneهای smoke واقعی از نظر transport برای Telegram، Discord، Slack، و WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

آن‌ها یک channel واقعی از پیش موجود را با دو bot یا account هدف می‌گیرند (driver + SUT). env varهای لازم، فهرست سناریوها، artifactهای خروجی، و credential pool مربوط به Convex در [مرجع QA برای Telegram، Discord، Slack، و WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) در پایین مستند شده‌اند.

برای اجرای کامل VM دسکتاپ Slack با نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

آن فرمان یک ماشین Crabbox دسکتاپ/browser را lease می‌کند، lane زنده Slack را
داخل VM اجرا می‌کند، Slack Web را در browser مربوط به VNC باز می‌کند، دسکتاپ را capture می‌کند، و
`slack-qa/`، `slack-desktop-smoke.png`، و `slack-desktop-smoke.mp4` را
وقتی capture ویدیو در دسترس باشد به دایرکتوری artifact مربوط به Mantis کپی می‌کند. leaseهای
دسکتاپ/browser در Crabbox ابزارهای capture و packageهای کمکی browser/native-build را
از ابتدا فراهم می‌کنند، بنابراین سناریو باید فقط روی leaseهای قدیمی‌تر fallback نصب کند.
Mantis زمان‌بندی‌های کلی و هر phase را در
`mantis-slack-desktop-smoke-report.md` گزارش می‌کند تا اجراهای کند نشان دهند زمان صرف
warmup lease، دریافت credential، setup remote، یا کپی artifact شده است. پس از ورود دستی به Slack Web از طریق VNC،
از `--lease-id <cbx_...>` دوباره استفاده کنید؛ leaseهای استفاده‌مجددشده همچنین cache مربوط به pnpm store در Crabbox را گرم نگه می‌دارند. مقدار پیش‌فرض
`--hydrate-mode source` از یک source checkout تأیید می‌کند و install/build را
داخل VM اجرا می‌کند. فقط وقتی workspace remote استفاده‌مجددشده از قبل
`node_modules` و یک `dist/` ساخته‌شده دارد، از `--hydrate-mode prehydrated` استفاده کنید؛ آن mode
مرحله پرهزینه install/build را رد می‌کند و وقتی workspace آماده نباشد fail closed می‌شود.
با `--gateway-setup`، Mantis یک Gateway پایدار Slack برای OpenClaw را
داخل VM روی port `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان lane عادی
QA Slack از bot به bot را اجرا می‌کند و پس از capture artifact خارج می‌شود.

برای اثبات UI تأیید native Slack با شواهد دسکتاپ، mode مربوط به checkpoint تأیید Mantis را اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

این mode با `--gateway-setup` ناسازگار است. سناریوهای تأیید Slack را اجرا می‌کند،
شناسه‌های سناریوی غیرتأییدی را رد می‌کند، در هر وضعیت approval معلق و
resolved منتظر می‌ماند، پیام مشاهده‌شده Slack API را در
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png` render می‌کند، سپس اگر هر checkpoint،
شاهد پیام، acknowledgement، یا screenshot renderشده گم‌شده یا خالی باشد fail می‌شود.
leaseهای سرد CI ممکن است همچنان sign-in مربوط به Slack را در `slack-desktop-smoke.png` نشان دهند؛
تصاویر checkpoint تأیید، اثبات بصری این lane هستند.

چک‌لیست operator، فرمان dispatch مربوط به GitHub workflow، قرارداد evidence-comment،
جدول تصمیم hydrate-mode، تفسیر timing، و گام‌های مدیریت failure در [Runbook دسکتاپ Mantis Slack](/fa/concepts/mantis-slack-desktop-runbook) قرار دارند.

برای یک task دسکتاپ به سبک agent/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` یک ماشین Crabbox دسکتاپ/browser را lease یا استفاده‌مجدد می‌کند، 
`crabbox record --while` را شروع می‌کند، browser قابل‌مشاهده را از طریق یک
`visual-driver` تو در تو هدایت می‌کند، `visual-task.png` را capture می‌کند، وقتی `--vision-mode image-describe` انتخاب شده باشد
`openclaw infer image describe` را روی screenshot اجرا می‌کند، و
`visual-task.mp4`، `mantis-visual-task-summary.json`،
`mantis-visual-task-driver-result.json`، و `mantis-visual-task-report.md` را می‌نویسد.
وقتی `--expect-text` تنظیم شده باشد، prompt مربوط به vision یک verdict ساختاریافته JSON
درخواست می‌کند و فقط وقتی pass می‌شود که model شواهد قابل‌مشاهده مثبت گزارش کند؛ یک
response منفی که صرفاً متن هدف را quote می‌کند assertion را fail می‌کند.
برای یک smoke بدون model که plumbing مربوط به دسکتاپ،
browser، screenshot، و ویدیو را بدون فراخوانی provider فهم تصویر اثبات می‌کند، از `--vision-mode metadata` استفاده کنید. Recording یک artifact لازم برای `visual-task` است؛ اگر Crabbox هیچ
`visual-task.mp4` غیرخالی ضبط نکند، task حتی وقتی visual driver
pass شده باشد fail می‌شود. در صورت failure، Mantis lease را برای VNC نگه می‌دارد مگر اینکه task از قبل
pass شده باشد و `--keep-lease` تنظیم نشده باشد.

پیش از استفاده از credentialهای زنده poolشده، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی می‌کند، و وقتی maintainer secret حاضر باشد reachability مربوط به admin/list را تأیید می‌کند. برای secretها فقط وضعیت set/missing را گزارش می‌کند.

## پوشش transport زنده

laneهای transport زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را بسازند، یک قرارداد مشترک دارند. `qa-channel` مجموعه گسترده synthetic مربوط به رفتار محصول است و بخشی از ماتریس پوشش transport زنده نیست.

runnerهای transport زنده باید شناسه‌های سناریوی مشترک، helperهای پوشش baseline،
و helper انتخاب سناریو را از
`openclaw/plugin-sdk/qa-live-transport-scenarios` import کنند.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، در حالی که Matrix،
Telegram، و transportهای زنده دیگر یک چک‌لیست صریح مشترک برای قرارداد transport دارند.

برای یک lane یک‌بارمصرف VM Linux بدون وارد کردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این کار یک guest تازه Multipass را boot می‌کند، dependencyها را نصب می‌کند، OpenClaw را
داخل guest build می‌کند، `qa suite` را اجرا می‌کند، سپس گزارش و
خلاصه عادی QA را روی host در `.artifacts/qa-e2e/...` کپی می‌کند.
این همان رفتار انتخاب سناریو را مثل `qa suite` روی host استفاده‌مجدد می‌کند.
اجراهای suite روی host و Multipass به‌طور پیش‌فرض چندین سناریوی انتخاب‌شده را به‌صورت parallel
با gateway workerهای isolated اجرا می‌کنند. مقدار پیش‌فرض concurrency برای `qa-channel`
برابر 4 است، محدود به تعداد سناریوهای انتخاب‌شده. برای تنظیم
تعداد worker از `--concurrency <count>` استفاده کنید، یا برای اجرای serial از `--concurrency 1`.
برای اجرای pack بنچمارک personal assistant از `--pack personal-agent` استفاده کنید. selector مربوط به
pack با flagهای تکراری `--scenario` افزایشی است: سناریوهای صریح
ابتدا اجرا می‌شوند، سپس سناریوهای pack به ترتیب pack و با حذف duplicateها اجرا می‌شوند.
وقتی یک runner سفارشی QA از قبل setup مربوط به OpenTelemetry collector را فراهم می‌کند
و می‌خواهد سناریوهای smoke مربوط به OpenTelemetry و Prometheus
diagnostics با هم انتخاب شوند، از `--pack observability` استفاده کنید.
وقتی هر سناریویی fail شود، فرمان با non-zero خارج می‌شود. وقتی
artifactها را بدون exit code شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای زنده inputهای پشتیبانی‌شده QA auth را که برای
guest عملی هستند forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر config مربوط به QA live provider، و
`CODEX_HOME` وقتی حاضر باشد. `--output-dir` را زیر repo root نگه دارید تا guest
بتواند از طریق workspace mountشده به host بنویسد.

## مرجع QA برای Telegram، Discord، Slack و WhatsApp

Matrix به‌دلیل تعداد سناریوها و آماده‌سازی homeserver مبتنی بر Docker، یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، Slack و WhatsApp روی ترابری‌های واقعی ازپیش‌موجود اجرا می‌شوند، بنابراین مرجع آن‌ها اینجا قرار دارد.

### فلگ‌های مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان فلگ‌ها را می‌پذیرند:

| فلگ                                  | پیش‌فرض                                            | توضیح                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | محل نوشتن گزارش‌ها، خلاصه‌ها، شواهد، artifactهای ویژه ترابری، و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` تفسیر می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                    | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | شناسه حساب موقت داخل پیکربندی Gateway مربوط به QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` یا `live-frontier`؛ مقدار قدیمی `live-openai` همچنان کار می‌کند.                                                                            |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض ارائه‌دهنده                                   | refهای مدل اصلی/جایگزین.                                                                                                                   |
| `--fast`                              | خاموش                                                | حالت سریع ارائه‌دهنده، در صورت پشتیبانی.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [مخزن اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                                          |
| `--credential-role <maintainer\|ci>`  | در CI مقدار `ci`، در غیر این صورت `maintainer`                 | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                                                    |

هر مسیر در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` بدون تنظیم کد خروجی شکست‌خورده، artifactها را می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز هدف می‌گیرد: driver + SUT. بات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده بات‌به‌بات وقتی هر دو بات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند بهترین نتیجه را می‌دهد.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - شناسه عددی چت به‌صورت رشته.
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

مجموعه پیش‌فرض ضمنی همیشه canary، کنترل mention، پاسخ‌های command بومی، نشانی‌دهی command، و پاسخ‌های گروهی بات‌به‌بات را پوشش می‌دهد. پیش‌فرض‌های `mock-openai` همچنین بررسی‌های قطعی reply-chain و streaming پیام نهایی را شامل می‌شوند. `telegram-current-session-status-tool` همچنان opt-in می‌ماند، چون فقط وقتی پایدار است که مستقیما بعد از canary thread شود، نه بعد از پاسخ‌های command بومی دلخواه. برای چاپ تفکیک فعلی پیش‌فرض/اختیاری همراه با refهای regression از `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` استفاده کنید.

artifactهای خروجی:

- `telegram-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابری زنده، شامل فیلدهای profile، coverage، provider، channel، artifacts، result و RTT.

اجرای بسته‌ای Telegram از همان قرارداد اعتبارنامه Telegram استفاده می‌کند. اندازه‌گیری تکراری RTT
بخشی از مسیر زنده عادی Telegram در بسته است؛ توزیع RTT
برای بررسی RTT انتخاب‌شده زیر `result.timing` در `qa-evidence.json` ادغام می‌شود.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

وقتی `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` تنظیم شده باشد، wrapper زنده بسته
یک اعتبارنامه `kind: "telegram"` اجاره می‌کند، env گروه/driver/بات SUT اجاره‌شده
را به اجرای بسته نصب‌شده صادر می‌کند، lease را Heartbeat می‌کند و هنگام
خاموشی آن را آزاد می‌کند. wrapper بسته به‌صورت پیش‌فرض خارج از CI و وقتی Convex انتخاب شده باشد، 20 بررسی RTT از
`telegram-mentioned-message-reply`، timeout سی‌ثانیه‌ای RTT، و نقش Convex
`maintainer` را استفاده می‌کند. برای تنظیم اندازه‌گیری RTT بدون
ساختن command جداگانه RTT یا قالب خلاصه مخصوص Telegram، مقدارهای
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`، `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
یا `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات driver که harness کنترلش می‌کند و یک بات SUT که Gateway فرزند OpenClaw از طریق Plugin همراه Discord راه‌اندازی می‌کند. رسیدگی به mention در کانال، ثبت شدن command بومی `/help` برای بات SUT در Discord، و سناریوهای شواهد opt-in مربوط به Mantis را راستی‌آزمایی می‌کند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با شناسه کاربر بات SUT که Discord برمی‌گرداند مطابقت داشته باشد؛ در غیر این صورت مسیر زود شکست می‌خورد.

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` متن پیام‌ها را در artifactهای پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` کانال voice/stage را برای `discord-voice-autojoin` انتخاب می‌کند؛ بدون آن، سناریو اولین کانال voice/stage قابل‌مشاهده برای بات SUT را انتخاب می‌کند.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سناریوی voice به‌صورت opt-in. به‌تنهایی اجرا می‌شود، `channels.discord.voice.autoJoin` را فعال می‌کند، و راستی‌آزمایی می‌کند که وضعیت voice فعلی بات SUT در Discord همان کانال voice/stage هدف است. اعتبارنامه‌های Convex برای Discord ممکن است `voiceChannelId` اختیاری داشته باشند؛ در غیر این صورت runner اولین کانال voice/stage قابل‌مشاهده در guild را کشف می‌کند.
- `discord-status-reactions-tool-only` - سناریوی Mantis به‌صورت opt-in. به‌تنهایی اجرا می‌شود، چون SUT را با `messages.statusReactions.enabled=true` به پاسخ‌های همیشه‌فعال و فقط‌ابزار guild تغییر می‌دهد، سپس یک timeline واکنش REST همراه با artifactهای بصری HTML/PNG ضبط می‌کند. گزارش‌های قبل/بعد Mantis همچنین artifactهای MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی پیوستن خودکار به voice در Discord را صریح اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

سناریوی واکنش status مربوط به Mantis را صریح اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

artifactهای خروجی:

- `discord-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابری زنده.
- `discord-qa-observed-messages.json` - متن‌ها redacted هستند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی واکنش status اجرا شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو بات متمایز هدف می‌گیرد: یک بات driver که harness کنترلش می‌کند و یک بات SUT که Gateway فرزند OpenClaw از طریق Plugin همراه Slack راه‌اندازی می‌کند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` متن پیام‌ها را در artifactهای پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` checkpointهای تایید بصری
  را برای Mantis فعال می‌کند. runner فایل‌های `<scenario>.pending.json` و
  `<scenario>.resolved.json` را می‌نویسد، سپس منتظر فایل‌های مطابق `.ack.json` می‌ماند.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` timeout تایید checkpoint
  را override می‌کند. پیش‌فرض `120000` است.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سناریوی opt-in برای تایید exec بومی Slack.
  یک تایید exec را از طریق Gateway درخواست می‌کند، راستی‌آزمایی می‌کند که پیام Slack
  دکمه‌های تایید بومی دارد، آن را resolve می‌کند، و update حل‌شده Slack را راستی‌آزمایی می‌کند.
- `slack-approval-plugin-native` - سناریوی opt-in برای تایید Plugin بومی Slack.
  forwarding تایید exec و Plugin را با هم فعال می‌کند تا eventهای Plugin توسط
  مسیریابی تایید exec سرکوب نشوند، سپس همان مسیر UI بومی Slack در حالت pending/resolved
  را راستی‌آزمایی می‌کند.

artifactهای خروجی:

- `slack-qa-report.md`
- `qa-evidence.json` - ورودی‌های شواهد برای بررسی‌های ترابری زنده.
- `slack-qa-observed-messages.json` - متن‌ها redacted هستند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.
- `approval-checkpoints/` - فقط وقتی Mantis مقدار
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` را تنظیم کند؛ شامل JSON مربوط به checkpoint،
  JSON تایید، و screenshotهای pending/resolved است.

#### راه‌اندازی workspace در Slack

این مسیر به دو app متمایز Slack در یک workspace نیاز دارد، به‌علاوه کانالی که هر دو بات عضو آن باشند:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو بات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این مسیر در هر اجرا در آن پست می‌گذارد.
- `driverBotToken` - توکن بات (`xoxb-...`) مربوط به app **Driver**.
- `sutBotToken` - توکن بات (`xoxb-...`) مربوط به app **SUT**، که باید app جداگانه‌ای از driver در Slack باشد تا شناسه کاربر بات آن متمایز باشد.
- `sutAppToken` - توکن سطح app (`xapp-...`) مربوط به app SUT با `connections:write`، که Socket Mode از آن استفاده می‌کند تا app SUT بتواند eventها را دریافت کند.

بهتر است به‌جای استفاده دوباره از workspace تولید، یک workspace Slack اختصاصی برای QA داشته باشید.

manifest مربوط به SUT در پایین، نصب تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) را عمدا به مجوزها و eventهایی محدود می‌کند که مجموعه زنده QA برای Slack پوشش می‌دهد. برای راه‌اندازی کانال تولیدی همان‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمدا جداست، چون این مسیر به دو شناسه کاربر بات متمایز در یک workspace نیاز دارد.

**1. app مربوط به Driver را بسازید**

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

_Bot User OAuth Token_ را کپی کنید (`xoxb-...`) - این مقدار به `driverBotToken` تبدیل می‌شود. درایور فقط باید پیام‌ها را ارسال کند و خودش را شناسایی کند؛ نه رویدادی لازم است، نه Socket Mode.

**۲. برنامه SUT را بسازید**

در همان فضای کاری، _Create New App → From a manifest_ را تکرار کنید. این برنامه QA عمدا از نسخه محدودتری از مانیفست تولیدی Plugin داخلی Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeهای واکنش و رویدادها حذف شده‌اند، چون مجموعه QA زنده Slack هنوز مدیریت واکنش‌ها را پوشش نمی‌دهد.

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

بعد از اینکه Slack برنامه را ساخت، در صفحه تنظیمات آن دو کار انجام دهید:

- _Install to Workspace_ → _Bot User OAuth Token_ را کپی کنید → این مقدار به `sutBotToken` تبدیل می‌شود.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → scope با نام `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار به `sutAppToken` تبدیل می‌شود.

با فراخوانی `auth.test` روی هر توکن، بررسی کنید که دو ربات شناسه‌های کاربری متفاوتی دارند. runtime درایور و SUT را با شناسه کاربری از هم تشخیص می‌دهد؛ استفاده دوباره از یک برنامه برای هر دو، gating اشاره را بلافاصله با شکست روبه‌رو می‌کند.

**۳. کانال را بسازید**

در فضای کاری QA، یک کانال بسازید (مثلا `#openclaw-qa`) و هر دو ربات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _channel info → About → Channel ID_ کپی کنید - این مقدار به `channelId` تبدیل می‌شود. کانال عمومی کافی است؛ اگر از کانال خصوصی استفاده کنید، هر دو برنامه از قبل `groups:history` دارند، بنابراین خواندن‌های history در harness همچنان موفق می‌شوند.

**۴. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای عیب‌یابی روی یک ماشین از env varها استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس بدهید)، یا pool مشترک Convex را seed کنید تا CI و نگه‌دارندگان دیگر بتوانند آن‌ها را lease کنند.

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

انتظار داشته باشید `count: 1`، `status: "active"`، و بدون فیلد `lease` باشد.

**۵. سرتاسری بررسی کنید**

lane را محلی اجرا کنید تا تایید شود هر دو ربات می‌توانند از طریق broker با هم حرف بزنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در خیلی کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` نشان می‌دهد که هر دو `slack-canary` و `slack-mention-gating` وضعیت `pass` دارند. اگر lane حدود ۹۰ ثانیه معلق بماند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا pool خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` مشخص می‌کند کدام حالت است.

### QA برای WhatsApp

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
  artifactهای observed-message نگه می‌دارد.

کاتالوگ سناریو (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- baseline و gating گروه: `whatsapp-canary`، `whatsapp-pairing-block`،
  `whatsapp-mention-gating`، `whatsapp-top-level-reply-shape`،
  `whatsapp-restart-resume`، `whatsapp-group-allowlist-block`.
- فرمان‌های native: `whatsapp-help-command`، `whatsapp-status-command`،
  `whatsapp-commands-command`، `whatsapp-tools-compact-command`،
  `whatsapp-whoami-command`، `whatsapp-context-command`،
  `whatsapp-native-new-command`.
- رفتار reply و خروجی نهایی: `whatsapp-tool-only-usage-footer`،
  `whatsapp-reply-to-message`، `whatsapp-group-reply-to-message`،
  `whatsapp-reply-context-isolation`، `whatsapp-reply-delivery-shape`،
  `whatsapp-stream-final-message-accounting`.
- رسانه ورودی و پیام‌های ساختاریافته: `whatsapp-inbound-image-caption`،
  `whatsapp-audio-preflight`، `whatsapp-inbound-structured-messages`،
  `whatsapp-group-audio-gating`. این‌ها رویدادهای واقعی تصویر، صدا،
  سند، مکان، مخاطب، و استیکر WhatsApp را از طریق درایور ارسال می‌کنند.
- پوشش Gateway خروجی و actionهای پیام:
  `whatsapp-outbound-media-matrix`،
  `whatsapp-outbound-document-preserves-filename`، `whatsapp-outbound-poll`،
  `whatsapp-message-actions`.
- پوشش کنترل دسترسی: `whatsapp-access-control-dm-open`،
  `whatsapp-access-control-dm-disabled`، `whatsapp-access-control-group-open`،
  `whatsapp-access-control-group-disabled`، `whatsapp-group-allowlist-block`.
- تاییدهای native: `whatsapp-approval-exec-deny-native`،
  `whatsapp-approval-exec-native`، `whatsapp-approval-exec-reaction-native`،
  `whatsapp-approval-plugin-native`.
- واکنش‌های وضعیت: `whatsapp-status-reactions`.

کاتالوگ در حال حاضر ۳۶ سناریو دارد. lane پیش‌فرض `live-frontier` برای
پوشش smoke سریع، کوچک و شامل ۱۰ سناریو نگه داشته شده است. lane پیش‌فرض
`mock-openai` در حالی که فقط خروجی مدل را mock می‌کند، ۳۱ سناریوی قطعی را
از طریق transport واقعی WhatsApp اجرا می‌کند. سناریوهای تایید و چند بررسی
سنگین‌تر/مسدودکننده همچنان باید به‌صراحت با شناسه سناریو اجرا شوند.

درایور QA برای WhatsApp رویدادهای زنده ساختاریافته (`text`، `media`،
`location`، `reaction` و `poll`) را مشاهده می‌کند و می‌تواند فعالانه رسانه،
poll، مخاطب، مکان و استیکر ارسال کند. QA Lab آن درایور را از طریق سطح پکیج
`@openclaw/whatsapp/api.js` import می‌کند، نه با دسترسی به فایل‌های خصوصی
runtime مربوط به WhatsApp. محتوای پیام به‌صورت پیش‌فرض redacted می‌شود.
پوشش poll خروجی و upload-file از طریق فراخوانی‌های قطعی Gateway با `poll` و
`message.action` اجرا می‌شود، نه صرفا با فراخوانی ابزار مبتنی بر prompt مدل.

artifactهای خروجی:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ورودی‌های evidence برای بررسی‌های transport زنده.
- `whatsapp-qa-observed-messages.json` - بدنه‌ها redacted هستند مگر اینکه `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` باشد.

### pool اعتبارنامه Convex

laneهای Telegram، Discord، Slack و WhatsApp می‌توانند به جای خواندن env varهای بالا، اعتبارنامه‌ها را از یک pool مشترک Convex lease کنند. `--credential-source convex` را پاس بدهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری دریافت می‌کند، در طول اجرای آن Heartbeat می‌فرستد، و هنگام shutdown آزادش می‌کند. نوع‌های pool عبارت‌اند از `"telegram"`، `"discord"`، `"slack"` و `"whatsapp"`.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` باید یک رشته عددی chat-id باشد.
- کاربر واقعی Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - فقط برای اثبات Mantis Telegram Desktop. laneهای عمومی QA Lab نباید این نوع را دریافت کنند.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - شماره تلفن‌ها باید رشته‌های متمایز E.164 باشند.

workflow اثبات Mantis Telegram Desktop یک lease انحصاری Convex از نوع
`telegram-user` را هم برای درایور CLI مربوط به TDLib و هم برای شاهد
Telegram Desktop نگه می‌دارد، سپس بعد از انتشار proof آن را آزاد می‌کند.

وقتی یک PR به diff بصری قطعی نیاز دارد، Mantis می‌تواند همان پاسخ مدل mock
را روی `main` و روی head مربوط به PR استفاده کند، در حالی که formatter یا لایه
تحویل Telegram تغییر می‌کند. پیش‌فرض‌های capture برای کامنت‌های PR تنظیم
شده‌اند: کلاس استاندارد Crabbox، ضبط دسکتاپ ۲۴fps، GIF متحرک ۲۴fps، و عرض
preview برابر ۱۹۲۰px. کامنت‌های before/after باید یک بسته تمیز منتشر کنند که
فقط GIFهای موردنظر را شامل شود.

laneهای Slack هم می‌توانند از pool استفاده کنند. بررسی‌های شکل payload برای Slack در حال حاضر به جای broker، در runner مربوط به QA برای Slack قرار دارند؛ از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید، با یک شناسه کانال Slack مانند `Cxxxxxxxxxx`. برای provisioning برنامه و scope، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

env varهای عملیاتی و قرارداد endpoint مربوط به broker در Convex در [Testing → Shared Telegram credentials via Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش قدیمی‌تر از pool چندکاناله است؛ semantics مربوط به lease بین نوع‌ها مشترک است).

## seedهای پشتیبانی‌شده با repo

assetهای seed در `qa/` قرار دارند:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

این‌ها عمدا در git هستند تا طرح QA هم برای انسان‌ها و هم برای
agent قابل مشاهده باشد.

`qa-lab` باید یک runner عمومی سناریوهای YAML باقی بماند. هر فایل YAML سناریو
منبع حقیقت برای یک اجرای تست است و باید موارد زیر را تعریف کند:

- `title` سطح بالا
- metadata سناریو در `scenario`
- metadata اختیاری category، capability، lane و risk در `scenario`
- ارجاع‌های docs و code در `scenario`
- نیازمندی‌های اختیاری Plugin در `scenario`
- patch اختیاری config مربوط به Gateway در `scenario`
- `flow` اجرایی سطح بالا برای سناریوهای flow، یا `scenario.execution.kind` /
  `scenario.execution.path` برای سناریوهای Vitest و Playwright

سطح زمان‌اجرای قابل استفاده‌مجدد که پشتوانه‌ی `flow` است مجاز است عمومی
و میان‌بُر باقی بماند. برای مثال، سناریوهای YAML می‌توانند helperهای سمت انتقال
را با helperهای سمت مرورگر ترکیب کنند که Control UI توکار را از طریق مرز
`browser.request` در Gateway هدایت می‌کنند، بدون اینکه runner موردی اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشه‌ی درخت منبع.
هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs`
استفاده کنید.

فهرست مبنا باید آن‌قدر گسترده بماند که این موارد را پوشش دهد:

- چت DM و کانال
- رفتار thread
- چرخه‌ی عمر action پیام
- callbackهای cron
- یادآوری حافظه
- تغییر مدل
- واگذاری به subagent
- خواندن repo و خواندن docs
- یک وظیفه‌ی build کوچک مثل Lobster Invaders

## مسیرهای mock ارائه‌دهنده

`qa suite` دو مسیر mock ارائه‌دهنده‌ی محلی دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این مسیر همچنان مسیر mock
  قطعی پیش‌فرض برای QA متکی به repo و gateهای هم‌ارزی باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهنده‌ی مبتنی بر AIMock را برای پوشش آزمایشی protocol،
  fixture، record/replay، و chaos راه‌اندازی می‌کند. این مسیر افزایشی است و
  جایگزین dispatch‌کننده‌ی سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی مسیر ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌ها، راه‌اندازی سرور محلی، پیکربندی مدل gateway،
نیازهای staging پروفایل auth، و flagهای قابلیت live/mock خودش است. کد مشترک suite و
gateway باید به‌جای branch زدن بر اساس نام ارائه‌دهنده‌ها، از طریق registry ارائه‌دهنده route شود.

## adapterهای انتقال

`qa-lab` مالک یک مرز انتقال عمومی برای سناریوهای QA در YAML است. `qa-channel`
پیش‌فرض synthetic است. `crabline` سرورهای محلی هم‌شکل با ارائه‌دهنده را راه‌اندازی می‌کند و
Pluginهای کانال معمول OpenClaw را در برابر آن‌ها اجرا می‌کند. `live` برای
credentialهای واقعی ارائه‌دهنده و کانال‌های خارجی رزرو شده است.

در سطح معماری، این جداسازی چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی workerها، نوشتن artifact، و گزارش‌دهی است.
- adapter انتقال مالک پیکربندی gateway، readiness، مشاهده‌ی inbound و outbound، actionهای انتقال، و وضعیت نرمال‌شده‌ی انتقال است.
- فایل‌های سناریوی YAML زیر `qa/scenarios/` اجرای تست را تعریف می‌کنند؛ `qa-lab` سطح زمان‌اجرای قابل استفاده‌مجدد را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن یک کانال

افزودن یک کانال به سیستم QA در YAML به پیاده‌سازی کانال به‌همراه
یک بسته‌ی سناریو نیاز دارد که contract کانال را تمرین کند. برای پوشش smoke در CI،
سرور ارائه‌دهنده‌ی محلی Crabline متناظر را اضافه کنید و آن را از طریق driver `crabline`
در دسترس قرار دهید.

وقتی host مشترک `qa-lab` می‌تواند مالک flow باشد، root جدید سطح‌بالای دستور QA اضافه نکنید.

`qa-lab` مالک سازوکارهای host مشترک است:

- root دستور `openclaw qa`
- راه‌اندازی و teardown suite
- هم‌زمانی workerها
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک contract انتقال هستند:

- اینکه `openclaw qa <runner>` چگونه زیر root مشترک `qa` mount می‌شود
- اینکه gateway چگونه برای آن انتقال پیکربندی می‌شود
- اینکه readiness چگونه بررسی می‌شود
- اینکه eventهای inbound چگونه inject می‌شوند
- اینکه پیام‌های outbound چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شده‌ی انتقال چگونه expose می‌شوند
- اینکه actionهای مبتنی بر انتقال چگونه اجرا می‌شوند
- اینکه reset یا cleanup مخصوص انتقال چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را مالک root مشترک `qa` نگه دارید.
2. runner انتقال را روی مرز host مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای مخصوص انتقال را داخل Plugin runner یا harness کانال نگه دارید.
4. runner را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک دستور root رقیب. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و یک آرایه‌ی متناظر `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy CLI و runner باید پشت entrypointهای جداگانه بماند.
5. سناریوهای YAML را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید، مگر اینکه repo عمدا در حال migration باشد.

قاعده‌ی تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را می‌توان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` بگذارید.
- اگر رفتار به یک انتقال کانال وابسته است، آن را در همان Plugin runner یا harness Plugin نگه دارید.
- اگر یک سناریو به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند استفاده کند، به‌جای branch مخصوص کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر یک رفتار فقط برای یک انتقال معنا دارد، سناریو را مخصوص انتقال نگه دارید و این را در contract سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس‌اند - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - اما نوشتن سناریوی جدید باید از نام‌های عمومی استفاده کند. این aliasها برای پرهیز از migration یک‌روزه وجود دارند، نه به‌عنوان مدل آینده.

## گزارش‌دهی

`qa-lab` از timeline مشاهده‌شده‌ی bus یک گزارش protocol در Markdown export می‌کند.
گزارش باید به این پرسش‌ها پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی همچنان مسدود ماند
- چه سناریوهای پیگیری ارزش اضافه شدن دارند

برای inventory سناریوهای موجود - که هنگام اندازه‌گیری کار پیگیری یا اتصال یک انتقال جدید مفید است - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل‌خواندن توسط ماشین `--json` را اضافه کنید).
هنگام انتخاب proof متمرکز برای یک رفتار یا مسیر فایل لمس‌شده، `pnpm openclaw qa coverage --match <query>` را اجرا کنید.
گزارش match در metadata سناریو، docs refs، code refs، شناسه‌های coverage، Pluginها، و نیازمندی‌های ارائه‌دهنده جست‌وجو می‌کند، سپس targetهای متناظر `qa suite --scenario ...` را چاپ می‌کند.
هر اجرای `qa suite` برای مجموعه سناریوی انتخاب‌شده artifactهای سطح‌بالای `qa-evidence.json`,
`qa-suite-summary.json`, و `qa-suite-report.md` را می‌نویسد. سناریوهایی که
`execution.kind: vitest` یا `execution.kind: playwright` را اعلام می‌کنند مسیر تست متناظر را اجرا می‌کنند و همچنین logهای مخصوص هر سناریو را می‌نویسند. سناریوهایی که `execution.kind: script` را اعلام می‌کنند تولیدکننده‌ی evidence را در `execution.path` از طریق `node --import tsx` اجرا می‌کنند (با گسترش `${outputDir}` و `${scenarioId}` در `execution.args`)؛ تولیدکننده
`qa-evidence.json` خودش را می‌نویسد، که entryهای آن به خروجی suite import می‌شوند و مسیرهای artifact آن نسبت به همان `qa-evidence.json` تولیدکننده resolve می‌شوند. وقتی `qa suite` از طریق
`qa run --qa-profile` رسیده باشد، همان `qa-evidence.json` خلاصه‌ی scorecard پروفایل را نیز برای دسته‌های taxonomy انتخاب‌شده شامل می‌شود.
با آن مثل یک کمک برای کشف رفتار کنید، نه جایگزین gate؛ سناریوی انتخاب‌شده همچنان برای رفتار تحت تست به provider mode، انتقال live، Multipass، Testbox، یا release lane درست نیاز دارد.
برای زمینه‌ی scorecard، [Maturity scorecard](/fa/maturity/scorecard) را ببینید.

برای بررسی‌های کاراکتر و سبک، همان سناریو را روی چند ref مدل live اجرا کنید
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

این دستور processهای child محلی QA gateway را اجرا می‌کند، نه Docker. سناریوهای character eval
باید persona را از طریق `SOUL.md` تنظیم کنند، سپس turnهای معمول کاربر
مثل chat، کمک workspace، و وظایف کوچک فایل را اجرا کنند. به مدل candidate نباید گفته شود که در حال ارزیابی است. این دستور هر transcript کامل را نگه می‌دارد، آمار پایه‌ی اجرا را ثبت می‌کند، سپس از مدل‌های judge در حالت fast با
reasoning سطح `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی بودن، vibe، و شوخ‌طبعی رتبه‌بندی کنند.
هنگام مقایسه‌ی ارائه‌دهنده‌ها از `--blind-judge-models` استفاده کنید: prompt داور همچنان
هر transcript و وضعیت اجرا را دریافت می‌کند، اما refهای candidate با labelهای خنثی
مثل `candidate-01` جایگزین می‌شوند؛ گزارش پس از parse، رتبه‌بندی‌ها را به refهای واقعی نگاشت می‌کند.
اجراهای candidate به‌طور پیش‌فرض از thinking سطح `high` استفاده می‌کنند، با `medium` برای GPT-5.5 و `xhigh`
برای refهای eval قدیمی‌تر OpenAI که از آن پشتیبانی می‌کنند. یک candidate مشخص را inline با
`--model provider/model,thinking=<level>` override کنید. `--thinking <level>` همچنان یک
fallback سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای
سازگاری نگه داشته شده است.
refهای candidate مربوط به OpenAI به‌طور پیش‌فرض در حالت fast هستند تا در جایی که
ارائه‌دهنده پشتیبانی می‌کند از پردازش priority استفاده شود. وقتی یک candidate یا judge
به override نیاز دارد، `,fast`, `,no-fast`, یا `,fast=false` را inline اضافه کنید. فقط وقتی `--fast` را pass کنید که می‌خواهید
حالت fast را برای همه‌ی مدل‌های candidate اجباری کنید. مدت‌زمان‌های candidate و judge
برای تحلیل benchmark در گزارش ثبت می‌شوند، اما promptهای judge صراحتا می‌گویند
بر اساس سرعت رتبه‌بندی نکنند.
اجراهای مدل candidate و judge هر دو به‌طور پیش‌فرض concurrency 16 دارند. وقتی محدودیت‌های ارائه‌دهنده یا فشار gateway محلی
یک اجرا را بیش از حد noisy می‌کند، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ candidate `--model` پاس داده نشود، character eval به‌طور پیش‌فرض از
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, و
`google/gemini-3.1-pro-preview` استفاده می‌کند وقتی هیچ `--model` پاس داده نشود.
وقتی هیچ `--judge-model` پاس داده نشود، judgeها به‌طور پیش‌فرض
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high` هستند.

## docs مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [Maturity scorecard](/fa/maturity/scorecard)
- [Personal agent benchmark pack](/fa/concepts/personal-agent-benchmark-pack)
- [QA Channel](/fa/channels/qa-channel)
- [Testing](/fa/help/testing)
- [Dashboard](/fa/web/dashboard)
