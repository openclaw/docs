---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمون: مجموعه‌های واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-05T06:19:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest دارد (واحد/یکپارچه، e2e، زنده) و یک مجموعه کوچک
از اجراکننده‌های Docker. این سند یک راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را پیدا می‌کنند و مدل‌ها/ارائه‌دهندگان را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح فرمان، نوشتن سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مخصوص QA در پایین ([اجراکننده‌های مخصوص QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

بیشتر روزها:

- گیت کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- چرخه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم هدایت می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک خطای واحد کار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA با پشتوانه Docker: `pnpm qa:lab:up`
- مسیر QA با پشتوانه ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

وقتی ارائه‌دهندگان/مدل‌های واقعی را اشکال‌زدایی می‌کنید (به اعتبارنامه‌های واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + بررسی‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، مصنوعات مسیر mock-provider، deep-profile، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش
  mock-provider همچنین شامل عددهای راه‌اندازی Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقه hello-loop تکرارشونده با مدل جعلی، و شروع CLI است.
- جاروی مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌همراه یک بررسی کوچک به سبک خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام ایزوله‌کردن خطاهای ارائه‌دهنده، بررسی‌های اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار قابل‌استفاده مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند؛ این شامل jobهای ماتریسی جداگانه مدل زنده Docker است
    که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)`
    را با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - اسرار جدید و پُرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌همراه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- اسموک گفت‌وگوی متصل بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server متعلق به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تایید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    به‌جای ACP از مسیر اتصال بومی Plugin عبور می‌کنند.
- اسموک هارنس app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق هارنس app-server متعلق به Plugin مربوط به Codex اجرا می‌کند،
    `/codex status` و `/codex models` را تایید می‌کند، و به‌طور پیش‌فرض بررسی‌های تصویر،
    cron MCP، عامل فرعی، و Guardian را تمرین می‌دهد. هنگام ایزوله‌کردن سایر خطاهای app-server مربوط به Codex،
    بررسی عامل فرعی را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید.
    برای یک بررسی متمرکز عامل فرعی، بررسی‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    مگر اینکه `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد، این پس از بررسی عامل فرعی خارج می‌شود.
- اسموک فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و مضاعف برای سطح فرمان نجات کانال پیام.
    این مسیر `/crestodian status` را تمرین می‌دهد، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تایید می‌کند.
- اسموک Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و تایید می‌کند که fallback برنامه‌ریز فازی به نوشتن پیکربندی تایپ‌شده و audit‌شده تبدیل می‌شود.
- اسموک Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian هدایت می‌کند، setup/model/agent/Discord plugin + SecretRef writes را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های audit را تایید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab هم توسط
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- اسموک هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`،
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تایید کنید JSON گزارش Moonshot/K2.6 می‌دهد و
  رونوشت دستیار `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدودکردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که در پایین توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های مخصوص QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این فرمان‌ها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. هم‌ارزی عاملی زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض
soak جامع زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ پروفایل
`full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر هم‌ارزی mock، مسیر live
Matrix، مسیر live Telegram مدیریت‌شده با Convex، و مسیر live Discord مدیریت‌شده با Convex
به‌صورت jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صراحتا پاس می‌دهند، در حالی که مقدار پیش‌فرض CLI ماتریس و ورودی گردش‌کار دستی
`all` باقی می‌ماند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تایید انتشار، هم‌ارزی به‌همراه مسیرهای سریع Matrix و Telegram را اجرا می‌کند
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی معمول provider-plugin اجتناب شود. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های هم‌ارزی QA
پوشش داده می‌شود.

شاردهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` دارد. شاردهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای هر commit انتخاب‌شده ساخته می‌شود،
سپس به‌جای بازسازی درون هر shard، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر مخزن را مستقیما روی میزبان اجرا می‌کند.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی با workerهای
    جداافتاده Gateway اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض همزمانی 4 دارد (محدود به
    تعداد سناریوهای انتخاب‌شده). از `--concurrency <count>` برای تنظیم تعداد workerها
    استفاده کنید، یا از `--concurrency 1` برای مسیر سریال قدیمی‌تر.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai`، و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی
    fixture و protocol-mock بدون جایگزین کردن مسیر آگاه از سناریوی
    `mock-openai` راه‌اندازی می‌کند.
- `pnpm test:plugins:kitchen-sink-live`
  - گانتلت زنده OpenAI Kitchen Sink Plugin را از طریق QA Lab اجرا می‌کند. این مسیر
    بسته خارجی Kitchen Sink را نصب می‌کند، موجودی سطح plugin SDK را تایید می‌کند،
    `/healthz` و `/readyz` را بررسی می‌کند، شواهد CPU/RSS Gateway را ثبت می‌کند،
    یک نوبت زنده OpenAI را اجرا می‌کند، و عیب‌یابی‌های خصمانه را بررسی می‌کند.
    به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های Testbox
    آماده‌شده، وقتی helper `openclaw-testbox-env` حاضر باشد، به‌طور خودکار پروفایل
    live-auth Testbox را source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ شروع Gateway را همراه با یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU
    را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغ و پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn`
    به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه شروع به‌عنوان metric ثبت می‌شوند
    بدون اینکه شبیه رگرسیون چنددقیقه‌ای درگیری کامل Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime
    تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکسی یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - همان flagهای انتخاب ارائه‌دهنده/مدل را مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت پشتیبانی‌شده QA را که برای مهمان عملی هستند forward می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق
    workspace mount شده به عقب بنویسد.
  - گزارش و خلاصه معمول QA به‌همراه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی با کلید API OpenAI را اجرا می‌کند، Telegram
    را به‌طور پیش‌فرض پیکربندی می‌کند، تایید می‌کند runtime بسته‌بندی‌شده Plugin بدون تعمیر
    وابستگی هنگام شروع بارگذاری می‌شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر یک
    endpoint mock شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر packaged-install با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای transcriptهای context runtime تعبیه‌شده در برنامه ساخته‌شده اجرا می‌کند.
    تایید می‌کند context runtime پنهان OpenClaw به‌جای نشت کردن به نوبت قابل‌مشاهده کاربر،
    به‌صورت یک پیام سفارشی غیرنمایشی پایدار شده است، سپس یک session JSONL خراب متاثر را seed می‌کند و تایید می‌کند
    `openclaw doctor --fix` آن را با یک backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک کاندید بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر زنده Telegram QA را با همان بسته نصب‌شده
    به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن یک tarball محلی resolved
    به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentialهای env مربوط به Telegram یا منبع credential Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای خودکارسازی CI/release، علاوه بر
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش، مقدار
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند،
    wrapper Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env credential مربوط به Telegram یا Convex را روی میزبان اعتبارسنجی می‌کند.
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` را فقط وقتی تنظیم کنید که عمدا در حال اشکال‌زدایی
    setup پیش از credential هستید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام
    `NPM Telegram Beta E2E` در معرض قرار می‌دهد. روی merge اجرا نمی‌شود. این workflow از
    environment `qa-live-shared` و leaseهای credential CI مربوط به Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول در side-run
  در برابر یک بسته کاندید در معرض قرار می‌دهد. این مسیر یک ref قابل‌اعتماد، spec منتشرشده npm،
  URL tarball مبتنی بر HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس
  scheduler موجود Docker E2E را با پروفایل‌های مسیر smoke، package، product، full، یا custom
  اجرا می‌کند. برای اجرای workflow Telegram QA در برابر همان artifact
  `package-under-test`، مقدار `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - اثبات محصول آخرین beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- اثبات URL دقیق tarball به digest نیاز دارد:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- اثبات artifact یک artifact tarball را از اجرای دیگر Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را
    با OpenAI پیکربندی‌شده راه‌اندازی می‌کند، سپس channel/plugins همراه را از طریق ویرایش‌های config
    فعال می‌کند.
  - تایید می‌کند discovery راه‌اندازی، Pluginهای downloadable پیکربندی‌نشده را غایب نگه می‌دارد،
    نخستین تعمیر doctor پیکربندی‌شده هر Plugin downloadable گم‌شده را صراحتا نصب می‌کند،
    و restart دوم تعمیر پنهان وابستگی را اجرا نمی‌کند.
  - همچنین یک baseline npm قدیمی شناخته‌شده را نصب می‌کند، Telegram را پیش از اجرای
    `openclaw update --tag <candidate>` فعال می‌کند، و تایید می‌کند doctor پس از update کاندید
    بقایای وابستگی Plugin قدیمی را بدون تعمیر postinstall در سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی packaged-install بومی را در میان مهمان‌های Parallels اجرا می‌کند. هر
    پلتفرم انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس دستور نصب‌شده
    `openclaw update` را در همان مهمان اجرا می‌کند و نسخه نصب‌شده، وضعیت update،
    آمادگی Gateway، و یک نوبت agent محلی را تایید می‌کند.
  - هنگام iteration روی یک مهمان از `--platform macos`، `--platform windows`، یا `--platform linux` استفاده کنید.
    برای مسیر artifact خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض از `openai/gpt-5.5` برای اثبات نوبت agent زنده استفاده می‌کند.
    وقتی عمدا مدل OpenAI دیگری را اعتبارسنجی می‌کنید، `--model <provider/model>` را pass کنید یا
    `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای طولانی محلی را در timeout میزبان بپیچید تا stallهای transport مربوط به Parallels نتوانند
    باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script logهای مسیر تو در تو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از فرض کردن hung بودن wrapper بیرونی، `windows-update.log`، `macos-update.log`، یا `linux-update.log`
    را بررسی کنید.
  - update ویندوز می‌تواند روی مهمان سرد 10 تا 15 دقیقه را در doctor پس از update و کار
    به‌روزرسانی package صرف کند؛ وقتی log debug تو در توی npm در حال پیشروی است،
    این وضعیت همچنان سالم است.
  - این wrapper تجمیعی را موازی با مسیرهای smoke منفرد Parallels
    macOS، Windows، یا Linux اجرا نکنید. آن‌ها state VM را به اشتراک می‌گذارند و ممکن است روی
    restore snapshot، package serving، یا state مهمان Gateway تداخل کنند.
  - اثبات پس از update سطح Plugin همراه معمول را اجرا می‌کند، چون
    facadeهای capability مانند گفتار، تولید تصویر، و درک رسانه
    از طریق APIهای runtime همراه بارگذاری می‌شوند حتی وقتی خود نوبت agent
    فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون smoke مستقیم protocol
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر زنده Matrix QA را در برابر یک homeserver یک‌بارمصرف Tuwunel مبتنی بر Docker اجرا می‌کند. فقط source-checkout — نصب‌های packaged شامل `qa-lab` نیستند.
  - CLI کامل، catalog پروفایل/سناریو، env varها، و layout artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر زنده Telegram QA را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای driver و SUT bot از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید id عددی chat در Telegram باشد.
  - از `--credential-source convex` برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای انتخاب leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، که bot مربوط به SUT یک username در Telegram expose کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک bot گروه را مشاهده کند.
  - گزارش Telegram QA، خلاصه، و artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید دچار drift نشوند؛ ماتریس پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن ماتریس نیست.

### credentialهای مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease اختصاصی از pool مبتنی بر Convex می‌گیرد، تا وقتی مسیر در حال اجراست
برای آن lease Heartbeat می‌فرستد، و هنگام خاموشی lease را آزاد می‌کند.

scaffold مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env varهای موردنیاز:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش credential:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci`، در غیر این صورت `maintainer`)

env varهای اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای loopback `http://` مربوط به Convex برای توسعه local-only اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

دستورهای مدیریتی نگه‌دارنده‌ها (pool add/remove/list) مشخصا به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، اسرار broker،
پیشوند endpoint، مهلت زمانی HTTP، و دسترس‌پذیری admin/list را بدون چاپ
مقادیر محرمانه بررسی کند. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و
ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل‌تلاش‌مجدد: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /release`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /admin/add` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط secret نگه‌دارنده)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ lease فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشته شناسه عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای نادرست را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده سناریو برای آداپتورهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: transport runner را روی درز مشترک میزبان `qa-lab` پیاده‌سازی کنید، `qaRunners` را در مانیفست Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی رو به افزایش» (و شکنندگی/هزینه رو به افزایش) در نظر بگیرید:

### واحد / یکپارچه‌سازی (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های جداگانه هر پروژه گسترش دهند
- فایل‌ها: فهرست‌های core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts` و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، مسیریابی، ابزارها، parsing، پیکربندی)
  - رگرسیون‌های قطعی برای باگ‌های شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلید واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای کوچک تولیدشده Plugin اثبات کنند، نه
    APIهای منبع Plugin واقعیِ bundled. بارگذاری‌های API واقعی Plugin به
    مجموعه‌های قرارداد/یکپارچه‌سازی متعلق به Plugin تعلق دارند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای محدود">

    - `pnpm test` بدون هدف، به‌جای یک فرایند عظیم native root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار peak RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه ماندن مجموعه‌های نامرتبط به‌دلیل کار auto-reply/extension جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژه native root در `vitest.config.ts` استفاده می‌کند، چون loop تماشای چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای محدود عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل startup پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای تغییرکرده git را به laneهای محدود ارزان گسترش می‌دهد: ویرایش‌های مستقیم آزمون، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های محلی import-graph. ویرایش‌های config/setup/package آزمون‌ها را broad-run نمی‌کنند، مگر اینکه صراحتا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه عادی بررسی هوشمند محلی برای کارهای محدود است. diff را به core، آزمون‌های core، extensions، آزمون‌های extension، apps، docs، فراداده release، ابزارهای Docker زنده، و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فراداده release هستند، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardی که تغییرهای package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness زنده Docker ACP بررسی‌های متمرکز اجرا می‌کنند: syntax shell برای اسکریپت‌های احراز هویت Docker زنده و یک اجرای خشک scheduler Docker زنده. تغییرهای `package.json` فقط وقتی گنجانده می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و دیگر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد import-light از agents، commands، plugins، کمک‌کننده‌های auto-reply، `plugin-sdk`، و نواحی utility خالص مشابه از lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود می‌مانند.
    - فایل‌های source کمک‌کننده منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمون‌های خواهر صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های کمک‌کننده از اجرای دوباره کل مجموعه سنگین برای آن دایرکتوری اجتناب می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای کمک‌کننده‌های core سطح بالا، آزمون‌های یکپارچه‌سازی `reply.*` سطح بالا، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket با import سنگین مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط-release با نام `agentic-plugins` را رد می‌کند. Full Release Validation workflow فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین plugin/extension روی نامزدهای release dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش embedded runner">

    - وقتی ورودی‌های کشف message-tool یا زمینه runtime مربوط به Compaction را تغییر می‌دهید،
      هر دو سطح پوشش را نگه دارید.
    - رگرسیون‌های کمک‌کننده متمرکز برای مرزهای مسیریابی و نرمال‌سازی خالص اضافه کنید.
    - مجموعه‌های یکپارچه‌سازی embedded runner را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها تأیید می‌کنند که شناسه‌های محدود و رفتار Compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های فقط کمک‌کننده
      جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="pool و پیش‌فرض‌های isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض روی `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner
      غیرایزوله در سراسر پروژه‌های ریشه، e2e، و پیکربندی‌های زنده استفاده می‌کند.
    - lane مربوط به root UI، setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner غیرایزوله مشترک اجرا می‌شود.
    - هر shard در `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest
      `--no-maglev` اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ محلی کاهش یابد.
      برای مقایسه با رفتار V8 stock مقدار `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push
      `pnpm check:changed` را صریحا اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای محدود ارزان عبور می‌کند. فقط وقتی
      agent تصمیم می‌گیرد ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر
      Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را نگه می‌دارند،
      فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمدا محافظه‌کار است و وقتی میانگین بار host از قبل بالا باشد
      عقب‌نشینی می‌کند، بنابراین چند اجرای همزمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر wiring آزمون‌ها
      درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر یک مکان cache صریح برای profiling مستقیم می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی عملکرد">

    - `pnpm test:perf:imports` گزارش‌دهی مدت import در Vitest را همراه با
      خروجی import-breakdown فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به
      فایل‌های تغییرکرده از `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ shardهای CI با include-pattern
      نام shard را اضافه می‌کنند تا shardهای filterشده جداگانه قابل‌ردیابی باشند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را در importهای startup صرف می‌کند،
      dependencyهای سنگین را پشت یک درز محلی محدود `*.runtime.ts` نگه دارید و
      به‌جای deep-import کردن کمک‌کننده‌های runtime صرفا برای عبور دادنشان از `vi.mock(...)`،
      همان درز را مستقیما mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر‌دهی‌شده
      `test:changed` را با مسیر native root-project برای آن diff commitشده مقایسه می‌کند
      و زمان wall به‌علاوه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با route کردن
      فهرست فایل‌های تغییرکرده از طریق
      `scripts/test-projects.mjs` و پیکربندی ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU ترد اصلی برای
      startup و سربار transform مربوط به Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap runner را برای
      مجموعه واحد با parallelism فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارا با یک worker
- دامنه:
  - یک Gateway واقعی روی loopback را با diagnostics فعال به‌طور پیش‌فرض راه‌اندازی می‌کند
  - churn مصنوعی پیام gateway، memory، و payload بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC پرس‌وجو می‌کند
  - کمک‌کننده‌های persistence برای بسته diagnostic stability را پوشش می‌دهد
  - assert می‌کند که recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه فشار باقی می‌مانند، و عمق صف‌های هر session دوباره به صفر تخلیه می‌شود
- انتظارها:
  - برای CI امن و بدون کلید
  - lane محدود برای پیگیری رگرسیون پایداری، نه جایگزینی برای مجموعه کامل Gateway

### E2E (smoke مربوط به gateway)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به Plugin‌های همراه زیر `extensions/`
- پیش‌فرض‌های زمان اجرا:
  - از Vitest `threads` با `isolate: false` استفاده می‌کند و با بقیهٔ مخزن همخوان است.
  - از worker‌های تطبیقی استفاده می‌کند (CI: حداکثر ۲، محلی: پیش‌فرض ۱).
  - برای کاهش سربار I/O کنسول، به‌طور پیش‌فرض در حالت بی‌صدا اجرا می‌شود.
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد worker‌ها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوبارهٔ خروجی مفصل کنسول.
- دامنه:
  - رفتار انتهابه‌انتهای Gateway چندنمونه‌ای
  - سطوح WebSocket/HTTP، جفت‌سازی node، و شبکه‌سازی سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال شده باشد)
  - به کلیدهای واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های واحد دارد (می‌تواند کندتر باشد)

### E2E: تست سلامت بک‌اند OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک OpenShell gateway ایزوله را روی میزبان از طریق Docker شروع می‌کند
  - یک sandbox از یک Dockerfile محلی موقت می‌سازد
  - بک‌اند OpenShell در OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار سیستم فایل remote-canonical را از طریق پل sandbox fs راستی‌آزمایی می‌کند
- انتظارات:
  - فقط با انتخاب صریح؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` به‌همراه یک Docker daemon فعال نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس Gateway و sandbox تست را نابود می‌کند
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی تست هنگام اجرای دستی مجموعهٔ گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به یک باینری CLI یا اسکریپت wrapper غیرپیش‌فرض

### زنده (ارائه‌دهندگان واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های زندهٔ Plugin‌های همراه زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - گرفتن تغییرات قالب ارائه‌دهنده، نکته‌های خاص tool-calling، مشکلات احراز هویت، و رفتار محدودیت نرخ
- انتظارات:
  - ذاتاً برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودتر را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده `~/.profile` را source می‌کنند تا کلیدهای API گمشده را بردارند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک home تست موقت کپی می‌کنند تا fixture‌های واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط زمانی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمداً نیاز دارید تست‌های زنده از دایرکتوری home واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت آرام‌تری دارد: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را suppress می‌کند و لاگ‌های bootstrap مربوط به Gateway/همهمهٔ Bonjour را بی‌صدا می‌کند. اگر لاگ‌های کامل شروع را می‌خواهید، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (ویژهٔ ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override هر اجرای زنده را از طریق `OPENCLAW_LIVE_*_KEY` بدهید؛ تست‌ها روی پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی گرفتن خروجی کنسول Vitest آرام است، به‌وضوح فعال دیده شوند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت ارائه‌دهنده/Gateway در طول اجراهای زنده فوراً stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/تست‌ها: `pnpm test` را اجرا کنید (و اگر تغییر زیادی داده‌اید `pnpm test:coverage` را هم)
- دست زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده است» / خرابی‌های ویژهٔ ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## تست‌های زنده (با تماس شبکه)

برای ماتریس مدل زنده، تست‌های سلامت بک‌اند CLI، تست‌های سلامت ACP، harness برنامه-سرور Codex، و همهٔ تست‌های زندهٔ media-provider (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، media harness) — به‌همراه مدیریت اعتبارنامه برای اجراهای زنده — [Testing live suites](/fa/help/testing-live) را ببینید. برای چک‌لیست اختصاصی به‌روزرسانی و اعتبارسنجی Plugin، [Testing updates and plugins](/fa/help/testing-updates-plugins) را ببینید.

## runnerهای Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این runnerهای Docker به دو گروه تقسیم می‌شوند:

- runnerهای مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زندهٔ profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر mount شده باشد `~/.profile` را source می‌کنند). نقطه‌ورود‌های محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- runnerهای زندهٔ Docker به‌طور پیش‌فرض سقف smoke کوچک‌تری دارند تا یک sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً scan جامع بزرگ‌تر را می‌خواهید، آن env varها را override کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت tarball مربوط به npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط runner مربوط به Node/Git برای مسیرهای install/update/plugin-dependency است؛ آن مسیرها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای مسیرهای عملکرد برنامهٔ ساخته‌شده در `/app` نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامهٔ انتخاب‌شده را اجرا می‌کند. aggregate از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای فرایند را کنترل می‌کند، درحالی‌که سقف‌های منبع مانع می‌شوند مسیرهای سنگین live، npm-install، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس آن را تنها در حال اجرا نگه دارد تا ظرفیت دوباره در دسترس شود. پیش‌فرض‌ها ۱۰ slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط وقتی تنظیم کنید که میزبان Docker headroom بیشتری دارد. runner به‌طور پیش‌فرض یک preflight مربوط به Docker انجام می‌دهد، containerهای E2E کهنهٔ OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع زودتر مسیرهای طولانی‌تر استفاده می‌کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest وزن‌دار مسیرها بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ برنامهٔ CI برای مسیرهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` گیت package بومی GitHub برای «آیا این tarball قابل‌نصب به‌عنوان محصول کار می‌کند؟» است. یک candidate package را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` upload می‌کند، سپس مسیرهای reusable Docker E2E را روی همان tarball دقیق به‌جای بسته‌بندی دوبارهٔ ref انتخاب‌شده اجرا می‌کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای contract package/update/plugin، ماتریس survivor ارتقای منتشرشده، پیش‌فرض‌های release، و triage خرابی، [Testing updates and plugins](/fa/help/testing-updates-plugins) را ببینید.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف built ایستا را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر importهای شروع قبل از dispatch، dependencyهای package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch دستور وارد کنند fail می‌شود؛ همچنین chunk اجرای Gateway همراه را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای cold شناخته‌شدهٔ Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین help ریشه، onboard help، doctor help، status، config schema، و یک دستور model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` سقف دارد (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata مربوط به shipped-package را تحمل می‌کند: ورودی‌های خصوصی QA inventory حذف‌شده، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت metadata پیکربندی در طول `plugins update`. برای packageهای پس از `2026.4.25`، آن مسیرها خرابی سخت هستند.
- runnerهای smoke مربوط به container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای integration سطح بالاتر را راستی‌آزمایی می‌کنند.

runnerهای Docker مربوط به مدل زنده همچنین فقط homeهای احراز هویت CLI لازم را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همهٔ موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home مربوط به container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- آزمون smoke اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌صورت پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- آزمون smoke بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- آزمون smoke مهار app-server متعلق به Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- آزمون smoke مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA برای source-checkout است. این مسیر عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- آزمون smoke زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- آزمون smoke راه‌اندازی اولیه/کانال/عامل tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه env-ref به‌همراه Telegram به‌صورت پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. از tarball ازپیش‌ساخته‌شده با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` عوض کنید.
- آزمون smoke تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کانال ماندگارشده و کارکرد Plugin پس از به‌روزرسانی را بررسی می‌کند، سپس به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون smoke بقای ارتقا: `pnpm test:docker:upgrade-survivor` tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمیِ کثیف با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت کهنه وابستگی Plugin و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای live provider یا کانال اجرا می‌کند، سپس یک Gateway حلقه‌برگشتی راه‌اندازی می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های راه‌اندازی/وضعیت را بررسی می‌کند.
- آزمون smoke بقای ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستورعمل فرمان baked پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، نصب منتشرشده را به tarball کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌برگشتی راه‌اندازی می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، راه‌اندازی، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق محلی را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای شبیه مسئله را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این موارد را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند، tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌همراه `reported-issues` گسترش می‌دهد.
- آزمون smoke زمینه runtime نشست: `pnpm test:docker:session-runtime-context` ماندگاری transcript زمینه runtime پنهان به‌همراه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite آسیب‌دیده را بررسی می‌کند.
- آزمون smoke نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند و بررسی می‌کند که `openclaw infer image providers --json` به‌جای هنگ کردن، providerهای تصویر bundled را برمی‌گرداند. از tarball ازپیش‌ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- آزمون smoke نصب‌کننده Docker: `bash scripts/test-install-sh-docker.sh` یک cache مربوط به npm را بین کانتینرهای root، update و direct-npm خود مشترک می‌کند. آزمون smoke به‌روزرسانی، پیش از ارتقا به tarball کاندید، به‌صورت پیش‌فرض از `latest` متعلق به npm به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` یا در GitHub با ورودی `update_baseline_version` متعلق به workflow Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده non-root یک cache ایزوله npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache مربوط به root/update/direct-npm در اجراهای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI مربوط به Install Smoke، به‌روزرسانی تکراری direct-npm global را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون smoke CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌صورت پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزوله کانتینر seed می‌کند، `agents delete --json` را اجرا می‌کند و JSON معتبر به‌همراه رفتار حفظ workspace را بررسی می‌کند. از تصویر install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- آزمون smoke snapshot مربوط به CDP مرورگر: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند و بررسی می‌کند که snapshotهای نقش CDP، URLهای لینک، عناصر clickable ارتقایافته با cursor، refهای iframe و metadata فریم را پوشش می‌دهند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، بررسی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema توسط provider را اجبار می‌کند و بررسی می‌کند که جزئیات خام در لاگ‌های Gateway ظاهر می‌شود.
- پل کانال MCP (Gateway seedشده + پل stdio + آزمون smoke فریم notification خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور MCP واقعی stdio + آزمون smoke allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون smoke نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace و فعال‌سازی/بازرسی بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض بسته/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی و hermetic متعلق به ClawHub استفاده می‌کند.
- آزمون smoke بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون smoke ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix` tarball بسته‌بندی‌شده OpenClaw را در یک کانتینر خام نصب می‌کند، یک Plugin مربوط به npm را نصب می‌کند، فعال/غیرفعال بودن را toggle می‌کند، آن را از طریق یک رجیستری محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس بررسی می‌کند که uninstall همچنان وضعیت stale را حذف می‌کند و هم‌زمان metricهای RSS/CPU را برای هر مرحله چرخه عمر ثبت می‌کند.
- آزمون smoke metadata بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` آزمون smoke نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace و فعال‌سازی/بازرسی بسته Claude را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب Plugin مربوط به npm با ردیابی منابع، فعال‌سازی، غیرفعال‌سازی، ارتقا، تنزل و uninstall در حالت نبود کد را پوشش می‌دهد.

برای ساخت از پیش و استفاده دوباره دستی از تصویر functional مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر مختص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم، اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره کند، اسکریپت‌ها اگر آن تصویر از قبل محلی نباشد آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای خود را نگه می‌دارند چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار بسته/نصب را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker برای مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و آن را در یک workdir موقت داخل container آماده‌سازی می‌کنند. این کار runtime image را سبک نگه می‌دارد، درحالی‌که Vitest همچنان دقیقاً روی source/config محلی شما اجرا می‌شود.
مرحلهٔ آماده‌سازی، cacheهای بزرگِ فقط‌محلی و خروجی‌های build برنامه مانند `.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و directoryهای خروجی `.build` محلیِ برنامه یا Gradle را رد می‌کند تا اجرای زندهٔ Docker چند دقیقه را صرف کپی کردن artifactهای خاص هر ماشین نکند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زندهٔ Gateway، workerهای channel واقعی Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زندهٔ Gateway را از آن lane در Docker محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز pass-through کنید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container Gateway از OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند، یک container ثابت‌شدهٔ Open WebUI را مقابل آن Gateway اجرا می‌کند، از طریق Open WebUI وارد می‌شود، بررسی می‌کند `/api/models` مقدار `openclaw/default` را expose می‌کند، سپس یک درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI ارسال می‌کند.
اجرای اول ممکن است به‌طور محسوسی کندتر باشد، چون Docker شاید لازم باشد image مربوط به Open WebUI را pull کند و Open WebUI شاید لازم باشد setup آغاز سرد خودش را تمام کند.
این lane به یک کلید مدل زندهٔ قابل‌استفاده نیاز دارد، و `OPENCLAW_PROFILE_FILE` (`~/.profile` به‌صورت پیش‌فرض) راه اصلی برای فراهم کردن آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی Telegram، Discord، یا iMessage نیاز ندارد. یک container seeded از Gateway را boot می‌کند، container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس discovery مکالمهٔ routeشده، خواندن transcript، metadata پیوست، رفتار queue رویداد زنده، routing ارسال outbound، و notificationهای channel + permission به سبک Claude را روی bridge واقعی stdio MCP بررسی می‌کند. بررسی notification، frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را validate کند که bridge واقعاً emit می‌کند، نه فقط چیزی که یک client SDK خاص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد. image مربوط به Docker repo را build می‌کند، یک server واقعی stdio MCP probe را داخل container شروع می‌کند، آن server را از طریق runtime تعبیه‌شدهٔ MCP bundle مربوط به Pi materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند `coding` و `messaging` ابزارهای `bundle-mcp` را نگه می‌دارند، درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد. یک Gateway seeded را با یک server واقعی stdio MCP probe شروع می‌کند، یک turn ایزولهٔ Cron و یک turn فرزند one-shot با `/subagents spawn` اجرا می‌کند، سپس بررسی می‌کند process فرزند MCP پس از هر اجرا خارج می‌شود.

smoke دستی thread زبان سادهٔ ACP (نه برای CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای validation مربوط به routing thread در ACP لازم شود، بنابراین آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای tests source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از directoryهای config/workspace موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های cached CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- directoryها/files مربوط به auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع tests داخل `/home/node/...` کپی می‌شوند
  - directoryهای پیش‌فرض: `.minimax`
  - fileهای پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط directoryها/files لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` inferred می‌شوند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک comma list مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای reuse کردن image موجود `openclaw:local-live` در rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke مربوط به Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt مربوط به nonce-check که smoke مربوط به Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای override کردن tag ثابت‌شدهٔ image مربوط به Open WebUI

## sanity مستندات

پس از ویرایش مستندات، checkهای docs را اجرا کنید: `pnpm check:docs`.
وقتی به checkهای heading داخل صفحه هم نیاز دارید، validation کامل anchor در Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (CI-safe)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- tool calling در Gateway (OpenAI mock، Gateway واقعی + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اعمال auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت اتکای agentها (skills)

ما از قبل چند test CI-safe داریم که مانند «evalهای قابلیت اتکای agent» رفتار می‌کنند:

- tool-calling به‌صورت mock از طریق Gateway واقعی + agent loop (`src/gateway/gateway.test.ts`).
- flowهای wizard end-to-end که wiring مربوط به session و اثرات config را validate می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی Skills در prompt فهرست می‌شوند، آیا agent، skill درست را انتخاب می‌کند (یا از موارد نامرتبط اجتناب می‌کند)؟
- **انطباق:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و step/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چند-turn که ترتیب tool، انتقال history مربوط به session، و مرزهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن tool callها + ترتیب، خواندن file مربوط به skill، و wiring مربوط به session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- evalهای زندهٔ optional (opt-in، env-gated) فقط پس از آماده شدن suite مربوط به CI-safe.

## testهای contract (شکل Plugin و channel)

testهای contract بررسی می‌کنند که هر Plugin و channel ثبت‌شده با contract مربوط به interface خودش conform است. آن‌ها روی همهٔ Pluginهای کشف‌شده iterate می‌کنند و مجموعه‌ای از assertionهای شکل و رفتار را اجرا می‌کنند. lane پیش‌فرض unit در `pnpm test` عمداً این fileهای smoke و seam مشترک را skip می‌کند؛ وقتی surfaceهای مشترک channel یا provider را لمس می‌کنید، commandهای contract را صریحاً اجرا کنید.

### Commands

- همهٔ contractها: `pnpm test:contracts`
- فقط contractهای channel: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایهٔ Plugin (id، name، capabilities)
- **setup** - contract مربوط به setup wizard
- **session-binding** - رفتار session binding
- **outbound-payload** - ساختار payload پیام
- **inbound** - مدیریت پیام inbound
- **actions** - handlerهای action مربوط به channel
- **threading** - مدیریت thread ID
- **directory** - API مربوط به directory/roster
- **group-policy** - enforcement مربوط به group policy

### contractهای status مربوط به provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای status مربوط به channel
- **registry** - شکل registry مربوط به Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract مربوط به flow احراز هویت
- **auth-choice** - انتخاب/selection احراز هویت
- **catalog** - API مربوط به catalog مدل
- **discovery** - discovery مربوط به Plugin
- **loader** - loading مربوط به Plugin
- **runtime** - runtime مربوط به provider
- **shape** - شکل/interface مربوط به Plugin
- **wizard** - setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک channel یا provider plugin
- پس از refactor کردن registration یا discovery مربوط به Plugin

testهای contract در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک مشکل provider/model کشف‌شده در live را fix می‌کنید:

- در صورت امکان یک regression CI-safe اضافه کنید (provider به‌صورت mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتاً فقط-live است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین layerی را هدف بگیرید که bug را می‌گیرد:
  - bug در تبدیل/replay درخواست provider → test مستقیم models
  - bug در pipeline مربوط به session/history/tool در Gateway → smoke زندهٔ Gateway یا test mock مربوط به Gateway به‌صورت CI-safe
- guardrail مربوط به traversal در SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر class از SecretRef یک target نمونه derive می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک خانوادهٔ target جدید از SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. test عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا classهای جدید بی‌صدا skip نشوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
