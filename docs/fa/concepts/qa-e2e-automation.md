---
read_when:
    - درک اینکه پشتهٔ QA چگونه در کنار هم قرار می‌گیرد
    - گسترش qa-lab، qa-channel یا یک آداپتور انتقال
    - افزودن سناریوهای QA پشتیبانی‌شده با مخزن
    - ساخت خودکارسازی QA با واقع‌گرایی بالاتر پیرامون داشبورد Gateway
summary: 'نمای کلی پشتهٔ QA: qa-lab، qa-channel، سناریوهای پشتیبانی‌شده توسط مخزن، مسیرهای انتقال زنده، آداپتورهای انتقال، و گزارش‌دهی.'
title: نمای کلی QA
x-i18n:
    generated_at: "2026-07-01T08:21:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

پشته خصوصی QA برای اجرای OpenClaw به شکلی واقع‌گرایانه‌تر و
مشابه کانال طراحی شده است؛ فراتر از چیزی که یک آزمون واحد می‌تواند پوشش دهد.

اجزای فعلی:

- `extensions/qa-channel`: کانال پیام مصنوعی با سطوح DM، کانال، رشته،
  واکنش، ویرایش و حذف.
- `extensions/qa-lab`: رابط کاربری اشکال‌زدایی و گذرگاه QA برای مشاهده رونوشت،
  تزریق پیام‌های ورودی، و خروجی گرفتن گزارش Markdown.
- `extensions/qa-matrix`، Pluginهای اجراکننده آینده: آداپترهای انتقال زنده که
  یک کانال واقعی را داخل یک Gateway فرزند QA هدایت می‌کنند.
- `qa/`: دارایی‌های seed پشتیبانی‌شده توسط مخزن برای وظیفه آغازین و سناریوهای
  پایه QA.
- [Mantis](/fa/concepts/mantis): راستی‌آزمایی زنده پیش و پس از رفع باگ‌هایی که
  به انتقال‌های واقعی، نماگرفت‌های مرورگر، وضعیت VM، و شواهد PR نیاز دارند.

## سطح فرمان

هر جریان QA زیر `pnpm openclaw qa <subcommand>` اجرا می‌شود. بسیاری از آن‌ها
نام‌های مستعار اسکریپتی `pnpm qa:*` دارند؛ هر دو شکل پشتیبانی می‌شوند.

| فرمان                                             | هدف                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | خودبررسی QA بسته‌بندی‌شده بدون `--qa-profile`؛ اجراکننده پروفایل بلوغ مبتنی بر taxonomy با `--qa-profile smoke-ci`، `--qa-profile release`، یا `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | اجرای سناریوهای پشتیبانی‌شده توسط مخزن روی مسیر QA gateway. نام‌های مستعار: `pnpm openclaw qa suite --runner multipass` برای یک VM یک‌بارمصرف Linux.                                                                                                                                  |
| `qa coverage`                                       | چاپ موجودی پوشش سناریوی YAML (`--json` برای خروجی ماشینی).                                                                                                                                                                                               |
| `qa parity-report`                                  | مقایسه دو فایل `qa-suite-summary.json` و نوشتن گزارش برابری agentic، یا استفاده از `--runtime-axis --token-efficiency` برای نوشتن گزارش‌های برابری runtime و بهره‌وری توکن Codex-vs-OpenClaw از یک خلاصه جفت runtime.                                         |
| `qa character-eval`                                 | اجرای سناریوی QA شخصیت روی چند مدل زنده با گزارش داوری‌شده. [گزارش‌دهی](#reporting) را ببینید.                                                                                                                                                            |
| `qa manual`                                         | اجرای یک prompt تک‌موردی روی مسیر provider/model انتخاب‌شده.                                                                                                                                                                                                          |
| `qa ui`                                             | راه‌اندازی رابط کاربری اشکال‌زدایی QA و گذرگاه محلی QA (نام مستعار: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | ساخت image از پیش آماده Docker برای QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | نوشتن اسکفلد docker-compose برای داشبورد QA + مسیر gateway.                                                                                                                                                                                                    |
| `qa up`                                             | ساخت سایت QA، راه‌اندازی پشته پشتیبانی‌شده با Docker، چاپ URL (نام مستعار: `pnpm qa:lab:up`؛ گونه `:fast`، `--use-prebuilt-image --bind-ui-dist --skip-ui-build` را اضافه می‌کند).                                                                                                  |
| `qa aimock`                                         | فقط سرور provider مربوط به AIMock را راه‌اندازی می‌کند.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | فقط سرور provider سناریوآگاه `mock-openai` را راه‌اندازی می‌کند.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | مدیریت مخزن مشترک اعتبارنامه‌های Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | مسیر انتقال زنده در برابر یک homeserver یک‌بارمصرف Tuwunel. [Matrix QA](/fa/concepts/qa-matrix) را ببینید.                                                                                                                                                                      |
| `qa telegram`                                       | مسیر انتقال زنده در برابر یک گروه خصوصی واقعی Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | مسیر انتقال زنده در برابر یک کانال guild خصوصی واقعی Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | مسیر انتقال زنده در برابر یک کانال خصوصی واقعی Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | مسیر انتقال زنده در برابر حساب‌های واقعی WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | اجراکننده راستی‌آزمایی پیش و پس از رفع برای باگ‌های انتقال زنده، همراه با شواهد واکنش‌های وضعیت Discord، دودسنجی دسکتاپ/مرورگر Crabbox، و دودسنجی Slack-in-VNC. [Mantis](/fa/concepts/mantis) و [راهنمای اجرای دسکتاپ Slack در Mantis](/fa/concepts/mantis-slack-desktop-runbook) را ببینید. |

`qa run` مبتنی بر پروفایل، عضویت را از `taxonomy.yaml` می‌خواند و سپس سناریوهای
حل‌شده را از طریق `qa suite` dispatch می‌کند. `--surface` و
`--category` به‌جای تعریف مسیرهای جداگانه، پروفایل انتخاب‌شده را فیلتر می‌کنند.
فایل حاصل `qa-evidence.json` یک خلاصه scorecard پروفایل با
شمارش دسته‌های انتخاب‌شده و IDهای پوشش مفقود دارد؛ ورودی‌های شواهد جداگانه
همچنان منبع حقیقت برای آزمون‌ها، نقش‌های پوشش، و نتایج هستند.
IDهای پوشش قابلیت taxonomy اهداف اثبات دقیق هستند، نه نام مستعار. پوشش
سناریوی اصلی IDهای منطبق را برآورده می‌کند؛ پوشش ثانویه مشورتی باقی می‌ماند.
IDهای پوشش از فرم نقطه‌گذاری‌شده `namespace.behavior` با بخش‌های حروف‌عددی/خط‌تیره
کوچک استفاده می‌کنند؛ IDهای پروفایل، سطح، و دسته همچنان ممکن است از IDهای
taxonomy خط‌تیره‌دار یا نقطه‌گذاری‌شده موجود استفاده کنند.
شواهد سبک، `execution` هر ورودی را حذف می‌کند و `evidenceMode: "slim"` را تنظیم می‌کند؛
`smoke-ci` به‌صورت پیش‌فرض سبک است، و `--evidence-mode full` ورودی‌های کامل را بازمی‌گرداند:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

از `smoke-ci` برای اثبات پروفایل قطعی با providerهای مدل mock و
سرورهای provider محلی Crabline استفاده کنید. از `release` برای اثبات پایدار/LTS در برابر
کانال‌های زنده استفاده کنید. از `all` فقط برای اجرای صریح شواهد کامل taxonomy استفاده کنید؛ این گزینه
هر دسته بلوغ فعال را انتخاب می‌کند و می‌تواند از طریق workflow
`QA Profile Evidence` با `qa_profile=all` dispatch شود. وقتی یک فرمان به پروفایل root
OpenClaw هم نیاز دارد، پروفایل root را پیش از فرمان QA قرار دهید:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## جریان اپراتور

جریان فعلی اپراتور QA یک سایت QA دوپنجره‌ای است:

- چپ: داشبورد Gateway (Control UI) با agent.
- راست: QA Lab، نمایش‌دهنده رونوشت مشابه Slack و برنامه سناریو.

آن را با این فرمان اجرا کنید:

```bash
pnpm qa:lab:up
```

این فرمان سایت QA را می‌سازد، مسیر gateway پشتیبانی‌شده با Docker را راه‌اندازی می‌کند، و صفحه
QA Lab را در دسترس قرار می‌دهد تا یک اپراتور یا حلقه خودکار بتواند به agent یک ماموریت QA بدهد،
رفتار واقعی کانال را مشاهده کند، و ثبت کند چه چیزی کار کرد، شکست خورد، یا
مسدود باقی ماند.

برای تکرار سریع‌تر رابط کاربری QA Lab بدون بازسازی image Docker در هر بار،
پشته را با یک بسته QA Lab نصب‌شده به‌صورت bind-mount راه‌اندازی کنید:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` سرویس‌های Docker را روی یک image از پیش ساخته نگه می‌دارد و
`extensions/qa-lab/web/dist` را داخل کانتینر `qa-lab` به‌صورت bind-mount متصل می‌کند. `qa:lab:watch`
آن بسته را هنگام تغییر بازسازی می‌کند، و وقتی hash دارایی QA Lab تغییر کند
مرورگر خودکار بازبارگذاری می‌شود.

برای یک دودسنجی سیگنال محلی OpenTelemetry، اجرا کنید:

```bash
pnpm qa:otel:smoke
```

این اسکریپت یک دریافت‌کننده محلی OTLP/HTTP را راه‌اندازی می‌کند، سناریوی QA
`otel-trace-smoke` را با Plugin `diagnostics-otel` فعال اجرا می‌کند، سپس بررسی می‌کند که traceها،
metricها، و logها صادر شده باشند. spanهای trace protobuf صادرشده را decode می‌کند
و شکل بحرانی برای release را بررسی می‌کند:
`openclaw.run`، `openclaw.harness.run`، یک span فراخوانی مدل با semantic-convention
جدید GenAI، `openclaw.context.assembled`، و `openclaw.message.delivery`
باید حاضر باشند. دودسنجی مقدار
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` را اجبار می‌کند، بنابراین span فراخوانی مدل
باید از نام `{gen_ai.operation.name} {gen_ai.request.model}` استفاده کند؛
فراخوانی‌های مدل در turnهای موفق نباید `StreamAbandoned` صادر کنند؛ IDهای خام diagnostic و
ویژگی‌های `openclaw.content.*` باید بیرون از trace بمانند. payloadهای خام OTLP
نباید sentinel مربوط به prompt، sentinel مربوط به response، یا کلید session
QA را داشته باشند. این اسکریپت `otel-smoke-summary.json` را کنار artifactهای مجموعه QA می‌نویسد.

برای یک دودسنجی OpenTelemetry پشتیبانی‌شده با collector، اجرا کنید:

```bash
pnpm qa:otel:collector-smoke
```

این مسیر یک کانتینر Docker واقعی OpenTelemetry Collector را جلوی همان
دریافت‌کننده محلی قرار می‌دهد. هنگام تغییر سیم‌کشی endpoint، سازگاری collector،
یا رفتار صدور OTLP که دریافت‌کننده درون‌فرآیندی ممکن است پنهان کند، از آن استفاده کنید.

برای دودسنجی scrape محافظت‌شده Prometheus، اجرا کنید:

```bash
pnpm qa:prometheus:smoke
```

آن نام مستعار سناریوی QA به نام `docker-prometheus-smoke` را با فعال بودن
`diagnostics-prometheus` اجرا می‌کند، تأیید می‌کند که scrapeهای بدون احراز هویت
رد می‌شوند، سپس بررسی می‌کند که scrape احراز هویت‌شده شامل خانواده‌های معیار
حیاتی برای انتشار باشد، بدون محتوای prompt، محتوای پاسخ، شناسه‌های خام
تشخیصی، توکن‌های احراز هویت، یا مسیرهای محلی.

برای اجرای پشت‌سرهم هر دو smoke مشاهده‌پذیری، استفاده کنید از:

```bash
pnpm qa:observability:smoke
```

برای مسیر OpenTelemetry پشتیبانی‌شده با collector به‌همراه smoke مربوط به scrape
محافظت‌شده Prometheus، استفاده کنید از:

```bash
pnpm qa:observability:collector-smoke
```

QA مشاهده‌پذیری فقط برای source-checkout باقی می‌ماند. tarball مربوط به npm
عمداً QA Lab را حذف می‌کند، بنابراین مسیرهای انتشار Docker بسته، فرمان‌های `qa`
را اجرا نمی‌کنند. هنگام تغییر instrumention تشخیصی، از `pnpm qa:otel:smoke`،
`pnpm qa:prometheus:smoke`، یا `pnpm qa:observability:smoke` از یک source checkout
ساخته‌شده استفاده کنید.

برای یک مسیر smoke واقعی از نظر transport برای Matrix که به credentials ارائه‌دهنده
مدل نیاز ندارد، پروفایل سریع را با ارائه‌دهنده قطعی mock OpenAI اجرا کنید:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

برای مسیر ارائه‌دهنده live-frontier، credentials سازگار با OpenAI را به‌صورت
صریح ارائه کنید:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

مرجع کامل CLI، کاتالوگ پروفایل/سناریو، env vars، و چیدمان artifact برای این مسیر در [QA Matrix](/fa/concepts/qa-matrix) قرار دارد. در یک نگاه: یک homeserver دورریختنی Tuwunel را در Docker provision می‌کند، کاربران موقت driver/SUT/observer را ثبت می‌کند، Plugin واقعی Matrix را داخل یک Gateway فرزند QA محدود به همان transport اجرا می‌کند (بدون `qa-channel`)، سپس یک گزارش Markdown، خلاصه JSON، artifact رویدادهای مشاهده‌شده، و لاگ خروجی ترکیبی را زیر `.artifacts/qa-e2e/matrix-<timestamp>/` می‌نویسد.

سناریوها رفتار transport را پوشش می‌دهند که تست‌های واحد نمی‌توانند از ابتدا تا انتها اثبات کنند: gating بر اساس mention، سیاست‌های allow-bot، allowlistها، پاسخ‌های سطح بالا و threadشده، مسیریابی DM، مدیریت reaction، سرکوب ویرایش ورودی، حذف تکرار replay پس از restart، بازیابی از وقفه homeserver، تحویل metadata تأیید، مدیریت media، و جریان‌های bootstrap/recovery/verification مربوط به Matrix E2EE. پروفایل CLI مربوط به E2EE همچنین `openclaw matrix encryption setup` و فرمان‌های verification را پیش از بررسی پاسخ‌های Gateway، از طریق همان homeserver دورریختنی اجرا می‌کند.

Discord همچنین سناریوهای opt-in فقط برای Mantis برای بازتولید باگ دارد. از
`--scenario discord-status-reactions-tool-only` برای timeline صریح reaction
وضعیت استفاده کنید، یا از `--scenario discord-thread-reply-filepath-attachment`
برای ایجاد یک thread واقعی Discord و تأیید اینکه `message.thread-reply` یک پیوست
`filePath` را حفظ می‌کند. این سناریوها در مسیر پیش‌فرض live Discord قرار
نمی‌گیرند، زیرا به‌جای پوشش smoke گسترده، probeهای بازتولید قبل/بعد هستند.
workflow مربوط به thread-attachment در Mantis همچنین می‌تواند وقتی
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` یا
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` در محیط QA پیکربندی شده باشد،
یک ویدیوی شاهد Discord Web با کاربر واردشده اضافه کند. آن پروفایل viewer فقط
برای capture بصری است؛ تصمیم pass/fail همچنان از oracle مربوط به Discord REST
می‌آید.

CI از همان سطح فرمان در `.github/workflows/qa-live-transports-convex.yml` استفاده می‌کند.
اجراهای زمان‌بندی‌شده و دستی پیش‌فرض، پروفایل سریع Matrix را با credentials
live-frontier ارائه‌شده توسط QA، `--fast`، و
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` اجرا می‌کنند. اجرای دستی
`matrix_profile=all` به پنج shard پروفایل fan out می‌شود.

برای مسیرهای smoke واقعی از نظر transport برای Telegram، Discord، Slack، و WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

آن‌ها یک کانال واقعی از پیش موجود را با دو ربات یا حساب هدف می‌گیرند (driver + SUT). env vars لازم، فهرست سناریوها، artifactهای خروجی، و pool credential مربوط به Convex در [مرجع QA برای Telegram، Discord، Slack، و WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) در پایین مستند شده‌اند.

برای اجرای کامل VM دسکتاپ Slack با نجات VNC، اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

آن فرمان یک ماشین دسکتاپ/مرورگر Crabbox را lease می‌کند، مسیر live Slack را
داخل VM اجرا می‌کند، Slack Web را در مرورگر VNC باز می‌کند، دسکتاپ را capture
می‌کند، و وقتی video capture در دسترس باشد، `slack-qa/`،
`slack-desktop-smoke.png`، و `slack-desktop-smoke.mp4` را به دایرکتوری artifact
مربوط به Mantis کپی می‌کند. leaseهای دسکتاپ/مرورگر Crabbox ابزارهای capture و
بسته‌های helper مربوط به browser/native-build را از ابتدا فراهم می‌کنند، بنابراین
سناریو فقط باید روی leaseهای قدیمی‌تر fallbackها را نصب کند. Mantis زمان‌بندی
کلی و به‌ازای هر فاز را در `mantis-slack-desktop-smoke-report.md` گزارش می‌کند
تا اجراهای کند نشان دهند زمان صرف warmup lease، دریافت credential، setup remote،
یا کپی artifact شده است. پس از ورود دستی به Slack Web از طریق VNC، از
`--lease-id <cbx_...>` دوباره استفاده کنید؛ leaseهای استفاده‌مجددشده همچنین cache
فروشگاه pnpm مربوط به Crabbox را گرم نگه می‌دارند. مقدار پیش‌فرض
`--hydrate-mode source` از یک source checkout تأیید می‌کند و install/build را
داخل VM اجرا می‌کند. از `--hydrate-mode prehydrated` فقط وقتی استفاده کنید که
workspace remote استفاده‌مجددشده از قبل `node_modules` و `dist/` ساخته‌شده دارد؛
آن حالت گام پرهزینه install/build را رد می‌کند و وقتی workspace آماده نباشد
fail closed می‌شود. با `--gateway-setup`، Mantis یک Gateway پایدار OpenClaw Slack
را داخل VM روی پورت `38973` در حال اجرا باقی می‌گذارد؛ بدون آن، فرمان مسیر عادی
QA Slack ربات-به-ربات را اجرا می‌کند و پس از capture کردن artifact خارج می‌شود.

برای اثبات UI تأیید native Slack با شواهد دسکتاپ، حالت checkpoint تأیید Mantis
را اجرا کنید:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

این حالت با `--gateway-setup` ناسازگار است. سناریوهای تأیید Slack را اجرا می‌کند،
شناسه‌های سناریوی غیرتأیید را رد می‌کند، در هر وضعیت تأیید pending و resolved
منتظر می‌ماند، پیام مشاهده‌شده Slack API را در
`approval-checkpoints/<scenario>-pending.png` و
`approval-checkpoints/<scenario>-resolved.png` render می‌کند، سپس اگر هر checkpoint،
شاهد پیام، acknowledgement، یا screenshot رندرشده گم‌شده یا خالی باشد شکست
می‌خورد. leaseهای سرد CI ممکن است همچنان sign-in Slack را در
`slack-desktop-smoke.png` نشان دهند؛ تصویرهای checkpoint تأیید، اثبات بصری این
مسیر هستند.

چک‌لیست operator، فرمان dispatch مربوط به GitHub workflow، قرارداد
evidence-comment، جدول تصمیم hydrate-mode، تفسیر timing، و گام‌های مدیریت failure
در [Runbook دسکتاپ Slack برای Mantis](/fa/concepts/mantis-slack-desktop-runbook)
قرار دارند.

برای یک task دسکتاپ به سبک agent/CV، اجرا کنید:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` یک ماشین دسکتاپ/مرورگر Crabbox را lease یا دوباره استفاده می‌کند،
`crabbox record --while` را شروع می‌کند، مرورگر قابل مشاهده را از طریق یک
`visual-driver` تودرتو هدایت می‌کند، `visual-task.png` را capture می‌کند، وقتی
`--vision-mode image-describe` انتخاب شده باشد `openclaw infer image describe`
را روی screenshot اجرا می‌کند، و `visual-task.mp4`،
`mantis-visual-task-summary.json`، `mantis-visual-task-driver-result.json`، و
`mantis-visual-task-report.md` را می‌نویسد. وقتی `--expect-text` تنظیم شده باشد،
prompt بینایی یک verdict ساخت‌یافته JSON می‌خواهد و فقط وقتی pass می‌شود که مدل
شواهد قابل مشاهده مثبت گزارش کند؛ پاسخ منفی‌ای که صرفاً متن هدف را نقل می‌کند
assertion را fail می‌کند. از `--vision-mode metadata` برای smoke بدون مدل استفاده
کنید که بدون فراخوانی یک ارائه‌دهنده فهم تصویر، plumbing دسکتاپ، مرورگر،
screenshot، و ویدیو را اثبات می‌کند. Recording یک artifact الزامی برای
`visual-task` است؛ اگر Crabbox هیچ `visual-task.mp4` غیرخالی ضبط نکند، task حتی
وقتی visual driver pass شده باشد fail می‌شود. هنگام failure، Mantis lease را
برای VNC نگه می‌دارد مگر اینکه task قبلاً pass شده باشد و `--keep-lease` تنظیم
نشده باشد.

پیش از استفاده از credentials زنده pooled، اجرا کنید:

```bash
pnpm openclaw qa credentials doctor
```

doctor محیط broker مربوط به Convex را بررسی می‌کند، تنظیمات endpoint را اعتبارسنجی
می‌کند، و وقتی secret maintainer حاضر باشد، دسترسی‌پذیری admin/list را تأیید
می‌کند. برای secrets فقط وضعیت set/missing را گزارش می‌کند.

## پوشش transport زنده

مسیرهای transport زنده به‌جای اینکه هرکدام شکل فهرست سناریوی خود را اختراع کنند،
یک قرارداد مشترک دارند. `qa-channel` مجموعه synthetic گسترده رفتار محصول است و
بخشی از ماتریس پوشش transport زنده نیست.

runnerهای transport زنده باید شناسه‌های سناریوی مشترک، helperهای پوشش baseline،
و helper انتخاب سناریو را از `openclaw/plugin-sdk/qa-live-transport-scenarios`
import کنند.

| مسیر     | Canary | gating بر اساس mention | ربات-به-ربات | بلوک allowlist | پاسخ سطح بالا | پاسخ quote | ادامه پس از restart | follow-up در thread | جداسازی thread | مشاهده reaction | فرمان help | ثبت فرمان native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

این کار `qa-channel` را به‌عنوان مجموعه گسترده رفتار محصول نگه می‌دارد، درحالی‌که
Matrix، Telegram، و دیگر transportهای زنده یک چک‌لیست صریح مشترک برای قرارداد
transport دارند.

برای یک مسیر VM دورریختنی Linux بدون آوردن Docker به مسیر QA، اجرا کنید:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

این فرمان یک guest تازه Multipass را boot می‌کند، وابستگی‌ها را نصب می‌کند،
OpenClaw را داخل guest می‌سازد، `qa suite` را اجرا می‌کند، سپس گزارش و خلاصه
عادی QA را به `.artifacts/qa-e2e/...` روی host برمی‌گرداند.
این همان رفتار انتخاب سناریو را که `qa suite` روی host دارد دوباره استفاده می‌کند.
اجراهای suite روی host و Multipass به‌صورت پیش‌فرض چندین سناریوی انتخاب‌شده را با
workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کنند. `qa-channel` به‌صورت پیش‌فرض
concurrency برابر 4 دارد که با تعداد سناریوهای انتخاب‌شده محدود می‌شود. برای
تنظیم تعداد worker از `--concurrency <count>` استفاده کنید، یا برای اجرای serial
از `--concurrency 1` استفاده کنید.
برای اجرای pack benchmark دستیار شخصی از `--pack personal-agent` استفاده کنید.
selector مربوط به pack با flagهای تکرارشده `--scenario` افزایشی است: ابتدا
سناریوهای صریح اجرا می‌شوند، سپس سناریوهای pack به ترتیب pack با حذف موارد
تکراری اجرا می‌شوند.
وقتی یک runner سفارشی QA از قبل setup مربوط به OpenTelemetry collector را فراهم
می‌کند و می‌خواهد سناریوهای smoke تشخیصی OpenTelemetry و Prometheus باهم انتخاب
شوند، از `--pack observability` استفاده کنید.
وقتی هر سناریویی fail شود، فرمان با non-zero خارج می‌شود. وقتی artifactها را
بدون exit code شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
اجراهای live ورودی‌های پشتیبانی‌شده auth مربوط به QA را که برای guest عملی
هستند forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر پیکربندی provider
زنده QA، و وقتی حاضر باشد `CODEX_HOME`. `--output-dir` را زیر ریشه repo نگه دارید
تا guest بتواند از طریق workspace mountشده به host بنویسد.

## مرجع QA برای Telegram، Discord، Slack و WhatsApp

Matrix به‌دلیل تعداد سناریوها و آماده‌سازی homeserver مبتنی بر Docker، یک [صفحه اختصاصی](/fa/concepts/qa-matrix) دارد. Telegram، Discord، Slack و WhatsApp در برابر ترابری‌های واقعیِ از پیش موجود اجرا می‌شوند، بنابراین مرجع آن‌ها اینجا قرار دارد.

### پرچم‌های مشترک CLI

این مسیرها از طریق `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` ثبت می‌شوند و همان پرچم‌ها را می‌پذیرند:

| پرچم                                  | پیش‌فرض                                            | توضیح                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | فقط این سناریو را اجرا می‌کند. قابل تکرار است.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | محل نوشتن گزارش‌ها، خلاصه‌ها، شواهد، مصنوعات ویژه ترابری، و لاگ خروجی. مسیرهای نسبی نسبت به `--repo-root` حل می‌شوند. |
| `--repo-root <path>`                  | `process.cwd()`                                    | ریشه مخزن هنگام فراخوانی از یک cwd خنثی.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | شناسه حساب موقت داخل پیکربندی QA gateway.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` یا `live-frontier` (`live-openai` قدیمی همچنان کار می‌کند).                                                                            |
| `--model <ref>` / `--alt-model <ref>` | پیش‌فرض provider                                   | ارجاع‌های مدل اصلی/جایگزین.                                                                                                                   |
| `--fast`                              | خاموش                                                | حالت سریع provider در جاهایی که پشتیبانی می‌شود.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [استخر اعتبارنامه Convex](#convex-credential-pool) را ببینید.                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` در CI، در غیر این صورت `maintainer`                 | نقشی که هنگام `--credential-source convex` استفاده می‌شود.                                                                                                    |

هر مسیر در صورت شکست هر سناریو با کد غیرصفر خارج می‌شود. `--allow-failures` مصنوعات را بدون تنظیم کد خروجی ناموفق می‌نویسد.

### QA برای Telegram

```bash
pnpm openclaw qa telegram
```

یک گروه خصوصی واقعی Telegram را با دو بات متمایز (driver + SUT) هدف می‌گیرد. بات SUT باید نام کاربری Telegram داشته باشد؛ مشاهده بات‌به‌بات زمانی بهترین عملکرد را دارد که هر دو بات **Bot-to-Bot Communication Mode** را در `@BotFather` فعال کرده باشند.

env لازم هنگام `--credential-source env`:

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

مجموعه پیش‌فرض ضمنی همیشه canary، گیتینگ mention، پاسخ‌های فرمان native، آدرس‌دهی فرمان، و پاسخ‌های گروهی بات‌به‌بات را پوشش می‌دهد. پیش‌فرض‌های `mock-openai` همچنین بررسی‌های قطعی زنجیره پاسخ و جریان‌دهی پیام نهایی را شامل می‌شوند. `telegram-current-session-status-tool` همچنان opt-in می‌ماند، چون فقط وقتی مستقیماً پس از canary رشته‌بندی شود پایدار است، نه پس از پاسخ‌های دلخواه فرمان native. برای چاپ تفکیک پیش‌فرض/اختیاری فعلی همراه با ارجاع‌های رگرسیون از `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` استفاده کنید.

مصنوعات خروجی:

- `telegram-qa-report.md`
- `qa-evidence.json` - مدخل‌های شواهد برای بررسی‌های ترابری زنده، شامل فیلدهای پروفایل، پوشش، provider، کانال، مصنوعات، نتیجه، و RTT.

اجراهای بسته Telegram از همان قرارداد اعتبارنامه Telegram استفاده می‌کنند. اندازه‌گیری تکرارشونده RTT بخشی از مسیر زنده عادی بسته Telegram است؛ توزیع RTT برای بررسی RTT انتخاب‌شده در `qa-evidence.json` زیر `result.timing` ادغام می‌شود.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

وقتی `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` تنظیم شده باشد، wrapper زنده بسته یک اعتبارنامه `kind: "telegram"` را lease می‌کند، env مربوط به گروه/driver/SUT bot اجاره‌شده را به اجرای بسته نصب‌شده صادر می‌کند، lease را Heartbeat می‌کند، و هنگام خاموشی آن را آزاد می‌کند. wrapper بسته به‌طور پیش‌فرض، خارج از CI و هنگام انتخاب Convex، ۲۰ بررسی RTT از `telegram-mentioned-message-reply`، مهلت RTT برابر ۳۰ ثانیه، و نقش Convex برابر `maintainer` دارد. برای تنظیم اندازه‌گیری RTT بدون ایجاد فرمان RTT جداگانه یا قالب خلاصه ویژه Telegram، `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`، `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`، یا `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.

### QA برای Discord

```bash
pnpm openclaw qa discord
```

یک کانال guild خصوصی واقعی Discord را با دو بات هدف می‌گیرد: یک بات driver که توسط harness کنترل می‌شود و یک بات SUT که توسط gateway فرزند OpenClaw از طریق Plugin همراه Discord راه‌اندازی می‌شود. مدیریت mention کانال، ثبت فرمان native `/help` توسط بات SUT در Discord، و سناریوهای شواهد Mantis به‌صورت opt-in را تأیید می‌کند.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - باید با شناسه کاربر بات SUT که Discord برمی‌گرداند مطابقت داشته باشد (در غیر این صورت مسیر سریعاً شکست می‌خورد).

اختیاری:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعات پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` کانال voice/stage را برای `discord-voice-autojoin` انتخاب می‌کند؛ بدون آن، سناریو اولین کانال voice/stage قابل‌مشاهده برای بات SUT را انتخاب می‌کند.

سناریوها (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - سناریوی voice به‌صورت opt-in. به‌تنهایی اجرا می‌شود، `channels.discord.voice.autoJoin` را فعال می‌کند، و تأیید می‌کند که وضعیت voice فعلی بات SUT در Discord همان کانال voice/stage هدف است. اعتبارنامه‌های Discord در Convex ممکن است `voiceChannelId` اختیاری داشته باشند؛ در غیر این صورت runner اولین کانال voice/stage قابل‌مشاهده در guild را کشف می‌کند.
- `discord-status-reactions-tool-only` - سناریوی Mantis به‌صورت opt-in. به‌تنهایی اجرا می‌شود چون SUT را با `messages.statusReactions.enabled=true` به پاسخ‌های guild همیشه‌روشن و فقط‌ابزار تغییر می‌دهد، سپس یک خط زمانی reaction از REST به‌همراه مصنوعات بصری HTML/PNG را ضبط می‌کند. گزارش‌های قبل/بعد Mantis همچنین مصنوعات MP4 ارائه‌شده توسط سناریو را به‌صورت `baseline.mp4` و `candidate.mp4` حفظ می‌کنند.

سناریوی اتصال خودکار voice در Discord را صریحاً اجرا کنید:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

سناریوی status-reaction در Mantis را صریحاً اجرا کنید:

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
- `qa-evidence.json` - مدخل‌های شواهد برای بررسی‌های ترابری زنده.
- `discord-qa-observed-messages.json` - بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` باشد.
- `discord-qa-reaction-timelines.json` و `discord-status-reactions-tool-only-timeline.png` وقتی سناریوی status-reaction اجرا می‌شود.

### QA برای Slack

```bash
pnpm openclaw qa slack
```

یک کانال خصوصی واقعی Slack را با دو بات متمایز هدف می‌گیرد: یک بات driver که توسط harness کنترل می‌شود و یک بات SUT که توسط gateway فرزند OpenClaw از طریق Plugin همراه Slack راه‌اندازی می‌شود.

env لازم هنگام `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

اختیاری:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` بدنه پیام‌ها را در مصنوعات پیام مشاهده‌شده نگه می‌دارد.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` checkpointهای تأیید بصری را برای Mantis فعال می‌کند. runner فایل‌های `<scenario>.pending.json` و `<scenario>.resolved.json` را می‌نویسد، سپس منتظر فایل‌های `.ack.json` مطابق می‌ماند.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` مهلت acknowledgment برای checkpoint را override می‌کند. پیش‌فرض `120000` است.

سناریوها (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - سناریوی opt-in برای تأیید exec بومی Slack. یک تأیید exec را از طریق gateway درخواست می‌کند، تأیید می‌کند پیام Slack دکمه‌های تأیید native دارد، آن را resolve می‌کند، و به‌روزرسانی Slack resolveشده را تأیید می‌کند.
- `slack-approval-plugin-native` - سناریوی opt-in برای تأیید Plugin بومی Slack. ارسال تأیید exec و Plugin را با هم فعال می‌کند تا رویدادهای Plugin توسط مسیریابی تأیید exec سرکوب نشوند، سپس همان مسیر UI بومی Slack در حالت pending/resolved را تأیید می‌کند.

مصنوعات خروجی:

- `slack-qa-report.md`
- `qa-evidence.json` - مدخل‌های شواهد برای بررسی‌های ترابری زنده.
- `slack-qa-observed-messages.json` - بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` باشد.
- `approval-checkpoints/` - فقط وقتی Mantis مقدار `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` را تنظیم کند؛ شامل JSON مربوط به checkpoint، JSON مربوط به acknowledgment، و نماگرفت‌های pending/resolved است.

#### راه‌اندازی فضای کاری Slack

این مسیر به دو اپ Slack متمایز در یک workspace نیاز دارد، به‌همراه کانالی که هر دو بات عضو آن باشند:

- `channelId` - شناسه `Cxxxxxxxxxx` کانالی که هر دو بات به آن دعوت شده‌اند. از یک کانال اختصاصی استفاده کنید؛ این مسیر در هر اجرا در آن پست می‌گذارد.
- `driverBotToken` - توکن بات (`xoxb-...`) برای اپ **Driver**.
- `sutBotToken` - توکن بات (`xoxb-...`) برای اپ **SUT**، که باید از اپ Slack مربوط به driver جدا باشد تا شناسه کاربر بات آن متمایز باشد.
- `sutAppToken` - توکن سطح اپ (`xapp-...`) برای اپ SUT با `connections:write`، که توسط Socket Mode استفاده می‌شود تا اپ SUT بتواند رویدادها را دریافت کند.

یک workspace اختصاصی Slack برای QA را به استفاده مجدد از workspace تولید ترجیح دهید.

manifest مربوط به SUT در زیر عمداً نصب تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) را به مجوزها و رویدادهایی که مجموعه QA زنده Slack پوشش می‌دهد محدود می‌کند. برای راه‌اندازی کانال تولید همان‌طور که کاربران می‌بینند، [راه‌اندازی سریع کانال Slack](/fa/channels/slack#quick-setup) را ببینید؛ جفت QA Driver/SUT عمداً جداست چون این مسیر به دو شناسه کاربر بات متمایز در یک workspace نیاز دارد.

**۱. اپ Driver را ایجاد کنید**

به [api.slack.com/apps](https://api.slack.com/apps) بروید → _ایجاد برنامه جدید_ → _از یک manifest_ → فضای کاری QA را انتخاب کنید، manifest زیر را بچسبانید، سپس _نصب در فضای کاری_ را بزنید:

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

_Bot User OAuth Token_ (`xoxb-...`) را کپی کنید - این مقدار به `driverBotToken` تبدیل می‌شود. درایور فقط باید پیام‌ها را ارسال کند و خودش را شناسایی کند؛ بدون رویدادها، بدون Socket Mode.

**۲. برنامه SUT را ایجاد کنید**

در همان فضای کاری، _ایجاد برنامه جدید → از یک manifest_ را تکرار کنید. این برنامه QA عمدا از نسخه محدودتری از manifest تولیدی Plugin همراه Slack (`extensions/slack/src/setup-shared.ts:10`) استفاده می‌کند: scopeها و رویدادهای واکنش حذف شده‌اند، چون مجموعه QA زنده Slack هنوز مدیریت واکنش را پوشش نمی‌دهد.

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

بعد از اینکه Slack برنامه را ایجاد کرد، در صفحه تنظیمات آن دو کار انجام دهید:

- _نصب در فضای کاری_ → _Bot User OAuth Token_ را کپی کنید → این مقدار به `sutBotToken` تبدیل می‌شود.
- _اطلاعات پایه → توکن‌های سطح برنامه → تولید توکن و scopeها_ → scope `connections:write` را اضافه کنید → ذخیره کنید → مقدار `xapp-...` را کپی کنید → این مقدار به `sutAppToken` تبدیل می‌شود.

با فراخوانی `auth.test` روی هر توکن، تأیید کنید که دو بات شناسه‌های کاربری متمایز دارند. runtime درایور و SUT را با شناسه کاربر تشخیص می‌دهد؛ استفاده مجدد از یک برنامه برای هر دو، mention-gating را بلافاصله ناموفق می‌کند.

**۳. کانال را ایجاد کنید**

در فضای کاری QA، یک کانال بسازید (مثلا `#openclaw-qa`) و هر دو بات را از داخل کانال دعوت کنید:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

شناسه `Cxxxxxxxxxx` را از _اطلاعات کانال → درباره → Channel ID_ کپی کنید - این مقدار به `channelId` تبدیل می‌شود. یک کانال عمومی کافی است؛ اگر از کانال خصوصی استفاده کنید، هر دو برنامه از قبل `groups:history` دارند، بنابراین خواندن‌های تاریخچه harness همچنان موفق می‌شوند.

**۴. اعتبارنامه‌ها را ثبت کنید**

دو گزینه وجود دارد. برای اشکال‌زدایی روی یک ماشین از env varها استفاده کنید (چهار متغیر `OPENCLAW_QA_SLACK_*` را تنظیم کنید و `--credential-source env` را پاس دهید)، یا pool مشترک Convex را seed کنید تا CI و سایر نگه‌دارندگان بتوانند آن‌ها را lease کنند.

برای pool Convex، چهار فیلد را در یک فایل JSON بنویسید:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

با export شدن `OPENCLAW_QA_CONVEX_SITE_URL` و `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` در shell خود، ثبت و تأیید کنید:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

انتظار `count: 1`، `status: "active"`، و نبود فیلد `lease` را داشته باشید.

**۵. انتها به انتها تأیید کنید**

lane را به‌صورت محلی اجرا کنید تا تأیید شود هر دو بات می‌توانند از طریق broker با یکدیگر صحبت کنند:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

یک اجرای سبز در بسیار کمتر از ۳۰ ثانیه کامل می‌شود و `slack-qa-report.md` هر دو `slack-canary` و `slack-mention-gating` را با وضعیت `pass` نشان می‌دهد. اگر lane حدود ۹۰ ثانیه گیر کند و با `Convex credential pool exhausted for kind "slack"` خارج شود، یا pool خالی است یا همه ردیف‌ها lease شده‌اند - `qa credentials list --kind slack --status all --json` به شما می‌گوید کدام‌یک است.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

دو حساب اختصاصی WhatsApp Web را هدف می‌گیرد: یک حساب درایور که توسط
harness کنترل می‌شود و یک حساب SUT که توسط Gateway فرزند OpenClaw از طریق
Plugin همراه WhatsApp شروع می‌شود.

env موردنیاز هنگام `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

اختیاری:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` سناریوهای گروهی مانند
  `whatsapp-mention-gating`، `whatsapp-group-pending-history-context`،
  `whatsapp-broadcast-group-fanout`، `whatsapp-group-activation-always`،
  `whatsapp-group-reply-to-bot-triggers`، سناریوهای کنش/رسانه/نظرسنجی گروه، و
  `whatsapp-group-allowlist-block` را فعال می‌کند.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` بدنه پیام‌ها را در
  artifactهای observed-message نگه می‌دارد.

کاتالوگ سناریو (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- baseline و gating گروه: `whatsapp-canary`، `whatsapp-pairing-block`،
  `whatsapp-mention-gating`، `whatsapp-group-pending-history-context`،
  `whatsapp-group-activation-always`،
  `whatsapp-group-reply-to-bot-triggers`،
  `whatsapp-top-level-reply-shape`، `whatsapp-restart-resume`،
  `whatsapp-group-allowlist-block`.
- فرمان‌های native: `whatsapp-help-command`، `whatsapp-status-command`،
  `whatsapp-commands-command`، `whatsapp-tools-compact-command`،
  `whatsapp-whoami-command`، `whatsapp-context-command`،
  `whatsapp-native-new-command`.
- رفتار پاسخ و خروجی نهایی: `whatsapp-tool-only-usage-footer`،
  `whatsapp-reply-to-message`، `whatsapp-group-reply-to-message`،
  `whatsapp-reply-to-mode-batched`، `whatsapp-reply-context-isolation`،
  `whatsapp-reply-delivery-shape`، `whatsapp-stream-final-message-accounting`.
- کنش‌های پیام در مسیر کاربر: `whatsapp-agent-message-action-react` از
  یک DM واقعی درایور شروع می‌شود، اجازه می‌دهد مدل ابزار `message` را فراخوانی کند، و
  واکنش native WhatsApp را مشاهده می‌کند. `whatsapp-agent-message-action-upload-file` از
  همان posture برای `message(action=upload-file)` استفاده می‌کند و رسانه native
  WhatsApp را مشاهده می‌کند. `whatsapp-group-agent-message-action-react` و
  `whatsapp-group-agent-message-action-upload-file` همان کنش‌های قابل مشاهده برای کاربر را
  در یک گروه واقعی WhatsApp اثبات می‌کنند.
- fanout گروه: `whatsapp-broadcast-group-fanout` از یک پیام گروه WhatsApp که mention شده
  شروع می‌شود و پاسخ‌های قابل مشاهده متمایز از `main` و
  `qa-second` را تأیید می‌کند.
- فعال‌سازی گروه: `whatsapp-group-activation-always` یک session گروه واقعی را به
  `/activation always` تغییر می‌دهد، اثبات می‌کند که یک پیام گروهی بدون mention
  agent را بیدار می‌کند، سپس `/activation mention` را بازمی‌گرداند. `whatsapp-group-reply-to-bot-triggers`
  یک پاسخ بات را seed می‌کند، یک پاسخ native نقل‌قول‌شده به آن را بدون mention صریح
  می‌فرستد، و تأیید می‌کند که agent از آن context پاسخ بیدار می‌شود.
- رسانه ورودی و پیام‌های ساخت‌یافته: `whatsapp-inbound-image-caption`،
  `whatsapp-audio-preflight`، `whatsapp-inbound-structured-messages`،
  `whatsapp-group-audio-gating`، `whatsapp-inbound-reaction-no-trigger`.
  این‌ها رویدادهای واقعی تصویر، صوت، سند، مکان، مخاطب، استیکر،
  و واکنش WhatsApp را از طریق درایور ارسال می‌کنند.
- probeهای مستقیم قرارداد Gateway:
  `whatsapp-outbound-media-matrix`،
  `whatsapp-outbound-document-preserves-filename`، `whatsapp-outbound-poll`،
  `whatsapp-group-outbound-media`، `whatsapp-group-outbound-poll`،
  `whatsapp-message-actions`، `whatsapp-reply-context-isolation`،
  `whatsapp-reply-delivery-shape`. این‌ها عمدا model prompting را دور می‌زنند و
  قراردادهای قطعی Gateway/channel برای `send`، `poll`، و `message.action`
  را اثبات می‌کنند.
- پوشش کنترل دسترسی: `whatsapp-access-control-dm-open`،
  `whatsapp-access-control-dm-disabled`، `whatsapp-access-control-group-open`،
  `whatsapp-access-control-group-disabled`، `whatsapp-group-allowlist-block`.
- تأییدیه‌های native: `whatsapp-approval-exec-deny-native`،
  `whatsapp-approval-exec-native`، `whatsapp-approval-exec-reaction-native`،
  `whatsapp-approval-exec-group-reaction-native`،
  `whatsapp-approval-plugin-native`.
- واکنش‌های وضعیت: `whatsapp-status-reactions`،
  `whatsapp-status-reaction-lifecycle`.

کاتالوگ در حال حاضر شامل ۵۰ سناریو است. lane پیش‌فرض `live-frontier` برای
پوشش smoke سریع، با ۱۰ سناریو کوچک نگه داشته شده است. lane پیش‌فرض `mock-openai`
۴۴ سناریوی قطعی را از طریق transport واقعی WhatsApp اجرا می‌کند و
فقط خروجی مدل را mock می‌کند. سناریوهای تأییدیه و چند بررسی سنگین‌تر/مسدودکننده
همچنان با شناسه سناریو صریح باقی می‌مانند.

درایور QA WhatsApp رویدادهای زنده ساخت‌یافته (`text`، `media`،
`location`، `reaction`، و `poll`) را مشاهده می‌کند و می‌تواند به‌صورت فعال رسانه، نظرسنجی،
مخاطب، مکان، و استیکر ارسال کند. QA Lab آن درایور را از طریق
سطح پکیج `@openclaw/whatsapp/api.js` وارد می‌کند، نه با دسترسی به فایل‌های خصوصی
runtime WhatsApp. برای مشاهده‌های گروهی، `fromJid` همان JID گروه است، در حالی که
`participantJid` و `fromPhoneE164` فرستنده شرکت‌کننده را شناسایی می‌کنند. محتوای پیام
به‌صورت پیش‌فرض redact می‌شود. probeهای مستقیم Gateway برای
نظرسنجی، upload-file، رسانه، نظرسنجی گروه، رسانه گروه، و reply-shape بررسی‌های قرارداد transport/API
هستند؛ آن‌ها به‌عنوان اثباتی در نظر گرفته نمی‌شوند که یک prompt کاربر باعث شده agent
همان کنش را انتخاب کند. اثبات کنش در مسیر کاربر از سناریوهایی مانند
`whatsapp-agent-message-action-react` و
`whatsapp-group-agent-message-action-react` می‌آید، جایی که درایور یک پیام عادی
WhatsApp می‌فرستد و QA Lab artifact native WhatsApp حاصل را مشاهده می‌کند.
گزارش‌های WhatsApp شامل posture هر سناریو (`user-path`، `direct-gateway`،
یا `native-approval`) هستند تا شواهد با قراردادی قوی‌تر از آنچه واقعا اثبات می‌کنند
اشتباه گرفته نشوند.

artifactهای خروجی:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - مدخل‌های شواهد برای بررسی‌های transport زنده.
- `whatsapp-qa-observed-messages.json` - بدنه‌ها redact می‌شوند مگر اینکه `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` باشد.

### pool اعتبارنامه Convex

laneهای Telegram، Discord، Slack، و WhatsApp می‌توانند به‌جای خواندن env varهای بالا، اعتبارنامه‌ها را از یک pool مشترک Convex lease کنند. `--credential-source convex` را پاس دهید (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید)؛ QA Lab یک lease انحصاری می‌گیرد، در طول اجرا برای آن Heartbeat می‌زند، و هنگام shutdown آن را آزاد می‌کند. kindهای pool عبارت‌اند از `"telegram"`، `"discord"`، `"slack"`، و `"whatsapp"`.

شکل payloadهایی که broker روی `admin/add` اعتبارسنجی می‌کند:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` باید یک رشتهٔ عددی chat-id باشد.
- کاربر واقعی Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - فقط برای اثبات Mantis Telegram Desktop. مسیرهای عمومی QA Lab نباید این نوع را دریافت کنند.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - شماره‌تلفن‌ها باید رشته‌های E.164 متمایز باشند.

گردش‌کار اثبات Mantis Telegram Desktop یک اجارهٔ انحصاری Convex
`telegram-user` را هم برای درایور CLI مربوط به TDLib و هم برای شاهد
Telegram Desktop نگه می‌دارد، سپس پس از انتشار اثبات آن را آزاد می‌کند.

وقتی یک PR به diff بصری قطعی نیاز دارد، Mantis می‌تواند از همان پاسخ مدل
ساختگی روی `main` و روی سرشاخهٔ PR استفاده کند، در حالی که قالب‌بند Telegram یا
لایهٔ تحویل تغییر می‌کند. پیش‌فرض‌های ضبط برای کامنت‌های PR تنظیم شده‌اند: کلاس
استاندارد Crabbox، ضبط دسکتاپ با 24fps، GIF حرکتی با 24fps، و عرض پیش‌نمایش
1920px. کامنت‌های قبل/بعد باید یک بستهٔ تمیز منتشر کنند که فقط GIFهای موردنظر
را شامل می‌شود.

مسیرهای Slack نیز می‌توانند از مخزن استفاده کنند. بررسی‌های شکل payload در Slack در حال حاضر به‌جای broker در اجراگر QA مربوط به Slack قرار دارند؛ از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید، با یک شناسهٔ کانال Slack مانند `Cxxxxxxxxxx`. برای تأمین app و scope، [راه‌اندازی فضای کاری Slack](#setting-up-the-slack-workspace) را ببینید.

متغیرهای محیطی عملیاتی و قرارداد endpoint مربوط به broker در Convex در [آزمایش → اعتبارنامه‌های مشترک Telegram از طریق Convex](/fa/help/testing#shared-telegram-credentials-via-convex-v1) قرار دارند (نام بخش پیش از مخزن چندکاناله است؛ معنای اجاره در همهٔ نوع‌ها مشترک است).

## seedهای متکی به مخزن

دارایی‌های seed در `qa/` قرار دارند:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

این‌ها عمداً در git هستند تا طرح QA هم برای انسان‌ها و هم برای
agent قابل مشاهده باشد.

`qa-lab` باید یک اجراگر عمومی سناریوهای YAML باقی بماند. هر فایل YAML سناریو
منبع حقیقت برای یک اجرای آزمون است و باید این موارد را تعریف کند:

- `title` در سطح بالا
- metadata مربوط به `scenario`
- metadata اختیاری category، capability، lane، و risk در `scenario`
- ارجاع‌های docs و code در `scenario`
- نیازمندی‌های اختیاری Plugin در `scenario`
- patch اختیاری پیکربندی Gateway در `scenario`
- `flow` اجرایی در سطح بالا برای سناریوهای flow، یا `scenario.execution.kind` /
  `scenario.execution.path` برای سناریوهای Vitest و Playwright

سطح runtime قابل استفادهٔ مجدد که پشتوانهٔ `flow` است مجاز است عمومی
و cross-cutting باقی بماند. برای مثال، سناریوهای YAML می‌توانند helperهای سمت
انتقال را با helperهای سمت مرورگر ترکیب کنند که Control UI جاسازی‌شده را از طریق
درز `browser.request` در Gateway هدایت می‌کنند، بدون اینکه اجراگر حالت خاص اضافه شود.

فایل‌های سناریو باید بر اساس قابلیت محصول گروه‌بندی شوند، نه پوشهٔ درخت
source. هنگام جابه‌جایی فایل‌ها، شناسه‌های سناریو را پایدار نگه دارید؛ برای
قابلیت ردیابی پیاده‌سازی از `docsRefs` و `codeRefs` استفاده کنید.

فهرست baseline باید به‌اندازه‌ای گسترده بماند که این موارد را پوشش دهد:

- گفت‌وگوی DM و کانال
- رفتار thread
- چرخهٔ عمر action پیام
- callbackهای Cron
- یادآوری memory
- تعویض مدل
- تحویل به subagent
- خواندن مخزن و خواندن docs
- یک task کوچک build مانند Lobster Invaders

## مسیرهای mock ارائه‌دهنده

`qa suite` دو مسیر mock محلی برای ارائه‌دهنده دارد:

- `mock-openai` mock سناریوآگاه OpenClaw است. این مسیر، مسیر mock قطعی پیش‌فرض
  برای QA متکی به مخزن و gateهای parity باقی می‌ماند.
- `aimock` یک سرور ارائه‌دهندهٔ مبتنی بر AIMock را برای پوشش آزمایشی protocol،
  fixture، record/replay، و chaos راه‌اندازی می‌کند. این مسیر افزایشی است و
  جایگزین dispatcher سناریوی `mock-openai` نمی‌شود.

پیاده‌سازی مسیرهای ارائه‌دهنده زیر `extensions/qa-lab/src/providers/` قرار دارد.
هر ارائه‌دهنده مالک پیش‌فرض‌ها، راه‌اندازی سرور محلی، پیکربندی مدل Gateway،
نیازهای staging مربوط به auth-profile، و flagهای قابلیت live/mock خودش است. کد
مشترک suite و Gateway باید به‌جای شاخه‌زدن بر اساس نام ارائه‌دهنده‌ها، از طریق
رجیستری ارائه‌دهنده مسیریابی کند.

## adapterهای انتقال

`qa-lab` مالک یک درز انتقال عمومی برای سناریوهای QA در YAML است. `qa-channel`
پیش‌فرض synthetic است. `crabline` سرورهای محلی با شکل ارائه‌دهنده را راه‌اندازی
می‌کند و Pluginهای کانال معمول OpenClaw را در برابر آن‌ها اجرا می‌کند. `live`
برای اعتبارنامه‌های واقعی ارائه‌دهنده و کانال‌های خارجی رزرو شده است.

در سطح معماری، این تفکیک چنین است:

- `qa-lab` مالک اجرای عمومی سناریو، هم‌زمانی worker، نوشتن artifact، و گزارش‌دهی است.
- adapter انتقال مالک پیکربندی Gateway، آمادگی، مشاهدهٔ ورودی و خروجی، actionهای انتقال، و وضعیت نرمال‌شدهٔ انتقال است.
- فایل‌های سناریوی YAML زیر `qa/scenarios/` اجرای آزمون را تعریف می‌کنند؛ `qa-lab` سطح runtime قابل استفادهٔ مجددی را فراهم می‌کند که آن‌ها را اجرا می‌کند.

### افزودن کانال

افزودن یک کانال به سیستم QA مبتنی بر YAML به پیاده‌سازی کانال به‌علاوهٔ
یک بستهٔ سناریو نیاز دارد که قرارداد کانال را تمرین کند. برای پوشش smoke در CI،
سرور ارائه‌دهندهٔ محلی Crabline متناظر را اضافه کنید و آن را از طریق درایور
`crabline` در دسترس قرار دهید.

وقتی میزبان مشترک `qa-lab` می‌تواند مالک flow باشد، یک ریشهٔ فرمان QA جدید در سطح بالا اضافه نکنید.

`qa-lab` مالک سازوکارهای میزبان مشترک است:

- ریشهٔ فرمان `openclaw qa`
- راه‌اندازی و teardown مجموعه
- هم‌زمانی worker
- نوشتن artifact
- تولید گزارش
- اجرای سناریو
- aliasهای سازگاری برای سناریوهای قدیمی‌تر `qa-channel`

Pluginهای runner مالک قرارداد انتقال هستند:

- اینکه `openclaw qa <runner>` چگونه زیر ریشهٔ مشترک `qa` mount می‌شود
- اینکه Gateway چگونه برای آن انتقال پیکربندی می‌شود
- اینکه آمادگی چگونه بررسی می‌شود
- اینکه رویدادهای ورودی چگونه تزریق می‌شوند
- اینکه پیام‌های خروجی چگونه مشاهده می‌شوند
- اینکه transcriptها و وضعیت نرمال‌شدهٔ انتقال چگونه در معرض استفاده قرار می‌گیرند
- اینکه actionهای متکی بر انتقال چگونه اجرا می‌شوند
- اینکه reset یا cleanup اختصاصی انتقال چگونه مدیریت می‌شود

حداقل معیار پذیرش برای یک کانال جدید:

1. `qa-lab` را به‌عنوان مالک ریشهٔ مشترک `qa` نگه دارید.
2. transport runner را روی درز میزبان مشترک `qa-lab` پیاده‌سازی کنید.
3. سازوکارهای اختصاصی انتقال را داخل runner Plugin یا harness کانال نگه دارید.
4. runner را به‌صورت `openclaw qa <runner>` mount کنید، نه با ثبت یک root command رقیب. Pluginهای runner باید `qaRunners` را در `openclaw.plugin.json` اعلام کنند و آرایهٔ متناظر `qaRunnerCliRegistrations` را از `runtime-api.ts` export کنند. `runtime-api.ts` را سبک نگه دارید؛ اجرای lazy مربوط به CLI و runner باید پشت entrypointهای جداگانه بماند.
5. سناریوهای YAML را زیر دایرکتوری‌های موضوعی `qa/scenarios/` بنویسید یا تطبیق دهید.
6. برای سناریوهای جدید از helperهای عمومی سناریو استفاده کنید.
7. aliasهای سازگاری موجود را فعال نگه دارید مگر اینکه مخزن در حال انجام یک migration عمدی باشد.

قاعدهٔ تصمیم‌گیری سخت‌گیرانه است:

- اگر رفتار را می‌توان یک‌بار در `qa-lab` بیان کرد، آن را در `qa-lab` بگذارید.
- اگر رفتار به یک انتقال کانال وابسته است، آن را در همان runner Plugin یا harness Plugin نگه دارید.
- اگر سناریویی به قابلیت جدیدی نیاز دارد که بیش از یک کانال می‌تواند از آن استفاده کند، به‌جای شاخهٔ اختصاصی کانال در `suite.ts` یک helper عمومی اضافه کنید.
- اگر رفتاری فقط برای یک انتقال معنا دارد، سناریو را اختصاصی انتقال نگه دارید و این را در قرارداد سناریو صریح کنید.

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

aliasهای سازگاری برای سناریوهای موجود همچنان در دسترس هستند - `waitForQaChannelReady`، `waitForOutboundMessage`، `waitForNoOutbound`، `formatConversationTranscript`، `resetBus` - اما نوشتن سناریوهای جدید باید از نام‌های عمومی استفاده کند. aliasها برای جلوگیری از migration یک‌باره وجود دارند، نه به‌عنوان الگوی آینده.

## گزارش‌دهی

`qa-lab` یک گزارش protocol در Markdown را از خط زمانی bus مشاهده‌شده export می‌کند.
گزارش باید به این موارد پاسخ دهد:

- چه چیزی کار کرد
- چه چیزی شکست خورد
- چه چیزی همچنان مسدود ماند
- چه سناریوهای follow-up ارزش افزودن دارند

برای inventory سناریوهای موجود - که هنگام اندازه‌گیری کار follow-up یا اتصال یک انتقال جدید مفید است - `pnpm openclaw qa coverage` را اجرا کنید (برای خروجی قابل خواندن توسط ماشین، `--json` را اضافه کنید).
هنگام انتخاب اثبات متمرکز برای یک رفتار یا مسیر فایل لمس‌شده، `pnpm openclaw qa coverage --match <query>` را اجرا کنید.
گزارش match در metadata سناریو، ارجاع‌های docs، ارجاع‌های code، شناسه‌های coverage، Pluginها، و نیازمندی‌های ارائه‌دهنده جست‌وجو می‌کند، سپس targetهای متناظر `qa suite --scenario ...` را چاپ می‌کند.
هر اجرای `qa suite` برای مجموعهٔ سناریوی انتخاب‌شده artifactهای سطح بالای
`qa-evidence.json`، `qa-suite-summary.json`، و `qa-suite-report.md` را می‌نویسد.
سناریوهایی که `execution.kind: vitest` یا `execution.kind: playwright` را اعلام
می‌کنند مسیر آزمون متناظر را اجرا می‌کنند و logهای جداگانه برای هر سناریو نیز
می‌نویسند. سناریوهایی که `execution.kind: script` را اعلام می‌کنند، تولیدکنندهٔ
evidence در `execution.path` را از طریق `node --import tsx` اجرا می‌کنند (با
گسترش `${outputDir}` و `${scenarioId}` در `execution.args`)؛ تولیدکننده
`qa-evidence.json` خودش را می‌نویسد، entryهای آن به خروجی suite وارد می‌شوند و
مسیرهای artifact آن نسبت به همان `qa-evidence.json` تولیدکننده resolve می‌شوند.
وقتی `qa suite` از طریق `qa run --qa-profile` فراخوانی شود، همان
`qa-evidence.json` خلاصهٔ scorecard مربوط به profile را نیز برای دسته‌های
taxonomy انتخاب‌شده شامل می‌شود.
با آن به‌عنوان کمک کشف برخورد کنید، نه جایگزین gate؛ سناریوی انتخاب‌شده همچنان به حالت ارائه‌دهندهٔ مناسب، انتقال live، Multipass، Testbox، یا مسیر release برای رفتار تحت آزمون نیاز دارد.
برای زمینهٔ scorecard، [scorecard بلوغ](/fa/maturity/scorecard) را ببینید.

برای بررسی‌های کاراکتر و سبک، همان سناریو را روی چند ref مدل live اجرا کنید
و یک گزارش Markdown قضاوت‌شده بنویسید:

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

این فرمان فرایندهای فرزند Gateway برای QA محلی را اجرا می‌کند، نه Docker. سناریوهای ارزیابی شخصیت باید پرسونا را از طریق `SOUL.md` تنظیم کنند، سپس نوبت‌های معمول کاربر مانند گفت‌وگو، کمک درباره فضای کاری، و کارهای کوچک روی فایل را اجرا کنند. به مدل نامزد نباید گفته شود که در حال ارزیابی است. این فرمان هر رونوشت کامل را حفظ می‌کند، آمار پایه اجرای کار را ثبت می‌کند، سپس از مدل‌های داور در حالت سریع و با استدلال `xhigh` در جاهایی که پشتیبانی می‌شود می‌خواهد اجراها را بر اساس طبیعی‌بودن، حس‌وحال، و طنز رتبه‌بندی کنند.
هنگام مقایسه ارائه‌دهندگان، از `--blind-judge-models` استفاده کنید: اعلان داور همچنان همه رونوشت‌ها و وضعیت اجرای کار را دریافت می‌کند، اما ارجاع‌های نامزد با برچسب‌های خنثی مانند `candidate-01` جایگزین می‌شوند؛ گزارش پس از تجزیه، رتبه‌بندی‌ها را دوباره به ارجاع‌های واقعی نگاشت می‌کند.
اجرای نامزدها به‌طور پیش‌فرض از تفکر `high` استفاده می‌کند، با `medium` برای GPT-5.5 و `xhigh` برای ارجاع‌های قدیمی‌تر ارزیابی OpenAI که از آن پشتیبانی می‌کنند. یک نامزد مشخص را به‌صورت درون‌خطی با `--model provider/model,thinking=<level>` بازنویسی کنید. `--thinking <level>` همچنان یک مقدار جایگزین سراسری تنظیم می‌کند، و شکل قدیمی‌تر `--model-thinking <provider/model=level>` برای سازگاری نگه داشته شده است.
ارجاع‌های نامزد OpenAI به‌طور پیش‌فرض از حالت سریع استفاده می‌کنند تا در جاهایی که ارائه‌دهنده پشتیبانی می‌کند پردازش اولویت‌دار به‌کار رود. وقتی یک نامزد یا داور منفرد به بازنویسی نیاز دارد، `,fast`، `,no-fast`، یا `,fast=false` را به‌صورت درون‌خطی اضافه کنید. فقط وقتی `--fast` را پاس دهید که می‌خواهید حالت سریع را برای همه مدل‌های نامزد اجباری کنید. مدت‌زمان‌های نامزد و داور برای تحلیل بنچمارک در گزارش ثبت می‌شوند، اما اعلان‌های داور به‌صراحت می‌گویند که رتبه‌بندی بر اساس سرعت انجام نشود.
اجرای مدل‌های نامزد و داور هر دو به‌طور پیش‌فرض از هم‌روندی 16 استفاده می‌کنند. وقتی محدودیت‌های ارائه‌دهنده یا فشار Gateway محلی اجرای کار را بیش از حد پرنویز می‌کند، `--concurrency` یا `--judge-concurrency` را کاهش دهید.
وقتی هیچ نامزد `--model` پاس داده نشود، ارزیابی شخصیت به‌طور پیش‌فرض از
`openai/gpt-5.5`، `openai/gpt-5.2`، `openai/gpt-5`، `anthropic/claude-opus-4-8`،
`anthropic/claude-sonnet-4-6`، `zai/glm-5.1`،
`moonshot/kimi-k2.5`، و
`google/gemini-3.1-pro-preview` استفاده می‌کند، وقتی هیچ `--model` پاس داده نشود.
وقتی هیچ `--judge-model` پاس داده نشود، داورها به‌طور پیش‌فرض از
`openai/gpt-5.5,thinking=xhigh,fast` و
`anthropic/claude-opus-4-8,thinking=high` استفاده می‌کنند.

## مستندات مرتبط

- [Matrix QA](/fa/concepts/qa-matrix)
- [کارت امتیاز بلوغ](/fa/maturity/scorecard)
- [بسته بنچمارک عامل شخصی](/fa/concepts/personal-agent-benchmark-pack)
- [کانال QA](/fa/channels/qa-channel)
- [آزمایش](/fa/help/testing)
- [داشبورد](/fa/web/dashboard)
