---
read_when:
    - اجرای تست‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمون: مجموعه‌های unit/e2e/live، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-03T11:38:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچه‌سازی، سرتاسری، زنده) و یک مجموعه کوچک
از اجراکننده‌های Docker. این سند راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح فرمان، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با repo از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمولی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مخصوص QA در پایین ([اجراکننده‌های مخصوص QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا اشاره می‌کند.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (انتظار می‌رود پیش از push اجرا شود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعه آزمون محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد در حال تکرار هستید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA پشتیبانی‌شده با Docker: `pnpm qa:lab:up`
- مسیر QA پشتیبانی‌شده با ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه سرتاسری: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (به اعتبارنامه‌های واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + کاوش‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌سروصدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های کارایی زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای آرتیفکت‌های CPU/heap/trace مربوط به Kova ارسال کنید. اجراهای زمان‌بندی‌شده روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، آرتیفکت‌های مسیر mock-provider، deep-profile، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند.
  گزارش mock-provider همچنین شامل اعداد بوت Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقه تکراری hello برای fake-model، و شروع CLI است.
- جاروب مدل زنده با Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک کاوش کوچک به سبک خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، کاوش‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: اجرای روزانه `OpenClaw Scheduled Live And E2E Checks` و اجرای دستی
    `OpenClaw Release Checks` هر دو گردش‌کار قابل استفاده مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی جداگانه مدل زنده Docker است
    که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` ارسال کنید.
  - secretهای جدید و پربازده ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- اسموک گفت‌وگوی متصل Native Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس بررسی می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از طریق اتصال native Plugin به‌جای ACP مسیریابی شوند.
- اسموک harness مربوط به app-server در Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق harness مربوط به app-server در Codex که مالکیتش با Plugin است اجرا می‌کند،
    `/codex status` و `/codex models` را بررسی می‌کند، و به‌صورت پیش‌فرض کاوش‌های تصویر،
    cron MCP، زیرعامل، و Guardian را تمرین می‌دهد. هنگام جداسازی دیگر شکست‌های app-server در Codex،
    کاوش زیرعامل را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید.
    برای یک بررسی متمرکز زیرعامل، کاوش‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این اجرا پس از کاوش زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- اسموک فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و کمربند-و-بند شلواری برای سطح فرمان نجات کانال پیام.
    `/crestodian status` را تمرین می‌دهد، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را بررسی می‌کند.
- اسموک Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک Claude CLI جعلی روی `PATH` اجرا می‌کند
    و بررسی می‌کند fallback برنامه‌ریز fuzzy به یک نوشتن پیکربندی تایپ‌شده و audit‌شده ترجمه شود.
- اسموک Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری state خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Discord plugin + SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های audit را بررسی می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- اسموک هزینه Moonshot/Kimi: با تنظیم بودن `MOONSHOT_API_KEY`،
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را در برابر `moonshot/kimi-k2.6` اجرا کنید. بررسی کنید که JSON، Moonshot/K2.6 را گزارش کند و
  transcript دستیار، `usage.cost` نرمال‌شده را ذخیره کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق env varهای allowlist که در پایین توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های مخصوص QA

این فرمان‌ها وقتی به واقع‌گرایی QA-lab نیاز دارید، کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری agentic زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار تو در تو است، نه یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. `QA-Lab - All Lanes`
هر شب روی `main` و از طریق ارسال دستی، با مسیر برابری mock، مسیر زنده
Matrix، مسیر زنده Telegram مدیریت‌شده با Convex، و مسیر زنده Discord
مدیریت‌شده با Convex به‌عنوان jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار،
Matrix را صراحتا با `--profile fast` ارسال می‌کنند، در حالی که مقدار پیش‌فرض CLI مربوط به Matrix و ورودی گردش‌کار دستی
همچنان `all` است؛ ارسال دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تایید انتشار، برابری به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از شروع عادی Plugin ارائه‌دهنده پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های برابری QA
پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده ساخته می‌شود،
سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند، به‌جای اینکه داخل هر shard
دوباره build کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - چندین سناریوی انتخاب‌شده را به‌صورت پیش‌فرض با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض از همزمانی 4 استفاده می‌کند (محدود به تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر از `--concurrency 1`.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های provider با نام‌های `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند. `aimock` یک سرور provider محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture و mock پروتکل راه‌اندازی می‌کند، بدون اینکه مسیر آگاه از سناریوی `mock-openai` را جایگزین کند.
- `pnpm test:gateway:cpu-scenarios`
  - bench راه‌اندازی Gateway را به‌همراه یک بسته کوچک سناریوی mock QA Lab (`channel-chat-baseline`، `memory-failure-fallback`، `gateway-restart-inflight-run`) اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهده‌های CPU داغ و پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn` به‌علاوه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان metric ثبت می‌شوند، بدون اینکه شبیه رگرسیون چنددقیقه‌ای درگیری Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout هنوز خروجی runtime تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM یک‌بارمصرف Linux با Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - از همان flagهای انتخاب provider/model مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای live ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای guest عملی هستند forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر config مربوط به provider زنده QA، و `CODEX_HOME` در صورت وجود.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا guest بتواند از طریق workspace mount‌شده دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌علاوه logهای Multipass را زیر `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت global در Docker نصب می‌کند، onboarding غیرتعاملی با کلید API مربوط به OpenAI را اجرا می‌کند، به‌صورت پیش‌فرض Telegram را config می‌کند، تأیید می‌کند runtime مربوط به Plugin بسته‌بندی‌شده بدون تعمیر dependency هنگام راه‌اندازی load می‌شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر یک endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord، از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای app ساخته‌شده، جهت transcriptهای context مربوط به runtime تعبیه‌شده اجرا می‌کند. تأیید می‌کند context مخفی runtime مربوط به OpenClaw به‌عنوان یک پیام سفارشی غیرنمایشی persist می‌شود و به نوبت کاربر قابل‌مشاهده leak نمی‌کند، سپس یک session JSONL خرابِ affected را seed می‌کند و تأیید می‌کند `openclaw doctor --fix` آن را با backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک candidate مربوط به package OpenClaw را در Docker نصب می‌کند، onboarding مربوط به package نصب‌شده را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده config می‌کند، سپس مسیر live Telegram QA را با همان package نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای test کردن یک tarball محلی resolve‌شده به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentials مربوط به env در Telegram یا منبع credential مربوط به Convex مانند `pnpm openclaw qa telegram` استفاده می‌کند. برای automation در CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند، wrapper مربوط به Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر، `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام `NPM Telegram Beta E2E` ارائه می‌کند. هنگام merge اجرا نمی‌شود. این workflow از environment با نام `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول در اجرای جانبی در برابر یک package candidate ارائه می‌کند. این workflow یک ref مورداعتماد، spec منتشرشده npm، URL مربوط به tarball با HTTPS به‌همراه SHA-256، یا artifact مربوط به tarball از اجرای دیگری را می‌پذیرد، `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس scheduler موجود Docker E2E را با profileهای مسیر smoke، package، product، full یا custom اجرا می‌کند. برای اجرای workflow مربوط به Telegram QA در برابر همان artifact با نام `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - تازه‌ترین اثبات محصول beta:

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

- اثبات artifact یک artifact مربوط به tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و install می‌کند، Gateway را با OpenAI config‌شده راه‌اندازی می‌کند، سپس channel/plugins بسته‌بندی‌شده را از طریق ویرایش config فعال می‌کند.
  - تأیید می‌کند discovery راه‌اندازی، plugins قابل‌دانلودِ configنشده را غایب نگه می‌دارد، اولین تعمیر doctor پیکربندی‌شده هر Plugin قابل‌دانلودِ گمشده را صراحتاً نصب می‌کند، و restart دوم تعمیر dependency پنهان اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر و شناخته‌شده از npm را نصب می‌کند، Telegram را قبل از اجرای `openclaw update --tag <candidate>` فعال می‌کند، و تأیید می‌کند doctor پس از update مربوط به candidate، بقایای legacy dependency مربوط به Plugin را بدون تعمیر postinstall در سمت harness پاک‌سازی می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke مربوط به update نصب بسته‌بندی‌شده native را در سراسر guestهای Parallels اجرا می‌کند. هر platform انتخاب‌شده ابتدا package baseline درخواست‌شده را نصب می‌کند، سپس command نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و نسخه نصب‌شده، وضعیت update، آمادگی Gateway و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام تکرار روی یک guest، از `--platform macos`، `--platform windows` یا `--platform linux` استفاده کنید. برای مسیر artifact خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌صورت پیش‌فرض از `openai/gpt-5.5` برای اثبات live نوبت agent استفاده می‌کند. وقتی عمداً model دیگری از OpenAI را validate می‌کنید، `--model <provider/model>` را pass کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان wrap کنید تا stallهای transport مربوط به Parallels نتوانند باقی پنجره test را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script، logهای nested lane را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از اینکه فرض کنید wrapper بیرونی hang کرده است، `windows-update.log`، `macos-update.log` یا `linux-update.log` را بررسی کنید.
  - update در Windows روی guest سرد می‌تواند 10 تا 15 دقیقه را در کارهای doctor پس از update و update package صرف کند؛ تا وقتی log debug داخلی npm در حال پیشرفت است، این هنوز سالم است.
  - این wrapper تجمیعی را هم‌زمان با مسیرهای smoke جداگانه macOS، Windows یا Linux در Parallels اجرا نکنید. آن‌ها وضعیت VM مشترک دارند و ممکن است در restore snapshot، سرو package یا وضعیت Gateway در guest با هم collide کنند.
  - اثبات پس از update سطح معمول Pluginهای bundled را اجرا می‌کند، چون facadeهای capability مانند speech، image generation و media understanding از طریق APIهای runtime مربوط به bundled load می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور provider محلی AIMock را برای smoke testing مستقیم protocol راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر live QA مربوط به Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel مبتنی بر Docker اجرا می‌کند. فقط source-checkout — نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، catalog مربوط به profile/scenario، env vars و layout مربوط به artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر live QA مربوط به Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای driver و SUT bot از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای credentials pooled مشترک پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، به‌طوری‌که SUT bot یک username در Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک botهای گروه را مشاهده کند.
  - یک گزارش Telegram QA، خلاصه، و artifact مربوط به پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

مسیرهای live transport یک قرارداد استاندارد مشترک دارند تا transportهای جدید دچار drift نشوند؛ ماتریس پوشش هر مسیر در [مرور کلی QA → پوشش live transport](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن matrix نیست.

### credentials مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای `openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری از pool مبتنی بر Convex دریافت می‌کند، هنگام اجرای مسیر برای آن lease Heartbeat می‌فرستد، و هنگام shutdown lease را آزاد می‌کند.

scaffold مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env vars لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش credential:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci`، در غیر این صورت `maintainer`)

env vars اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` اجازه URLهای Convex با `http://` روی local loopback را برای توسعه فقط محلی می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در operation عادی از `https://` استفاده کند.

commandهای admin مربوط به maintainer (pool add/remove/list) مشخصاً به `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای maintainerها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای live از `doctor` استفاده کنید تا URL سایت Convex، broker secrets، endpoint prefix، HTTP timeout و دسترسی‌پذیری admin/list را بدون چاپ مقدارهای secret بررسی کنید. برای خروجی machine-readable در scriptها و ابزارهای CI از `--json` استفاده کنید.

قرارداد نقطه پایانی پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل‌تلاش مجدد: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /release`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /admin/add` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط راز نگه‌دارنده)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ اجاره فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشته عددی شناسه گفت‌وگوی Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده سناریو برای آداپتورهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: پیاده‌سازی runner حمل‌ونقل روی درز میزبان مشترک `qa-lab`، اعلام `qaRunners` در manifest مربوط به Plugin، نصب به‌صورت `openclaw qa <runner>`، و نوشتن سناریوها زیر `qa/scenarios/`.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی افزایشی» در نظر بگیرید (و همراه با افزایش ناپایداری/هزینه):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های جداگانه هر پروژه گسترش دهند
- فایل‌ها: فهرست‌های core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرآیندی (احراز هویت Gateway، مسیریابی، ابزارها، تجزیه، پیکربندی)
  - رگرسیون‌های قطعی برای خطاهای شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلید واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای کوچک تولیدشده Plugin اثبات کنند، نه
    APIهای سورس Pluginهای bundled واقعی. بارگذاری‌های API واقعی Plugin به
    مجموعه‌های قرارداد/یکپارچه‌سازی متعلق به Plugin تعلق دارند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای دامنه‌دار">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرآیند عظیم پروژه ریشه native، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و مانع می‌شود کار auto-reply/extension مجموعه‌های نامرتبط را محروم کند.
    - `pnpm test --watch` همچنان از گراف پروژه native ریشه `vitest.config.ts` استفاده می‌کند، چون یک حلقه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از laneهای دامنه‌دار عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه راه‌اندازی کامل پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` مسیرهای git تغییریافته را به‌طور پیش‌فرض به laneهای ارزان دامنه‌دار گسترش می‌دهد: ویرایش مستقیم آزمون‌ها، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح سورس، و وابستگان گراف import محلی. ویرایش‌های config/setup/package آزمون‌ها را به‌صورت گسترده اجرا نمی‌کنند مگر اینکه صراحتا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` گیت بررسی هوشمند محلی معمول برای کارهای محدود است. diff را به core، آزمون‌های core، extensions، آزمون‌های extension، apps، docs، فراداده release، ابزارهای Docker زنده، و tooling طبقه‌بندی می‌کند، سپس فرمان‌های typecheck، lint، و guard متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه فقط با فراداده release بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کند، با محافظی که تغییرات package بیرون از فیلد نسخه سطح بالا را رد می‌کند.
    - ویرایش‌های harness زنده Docker ACP بررسی‌های متمرکز اجرا می‌کنند: نحو shell برای اسکریپت‌های احراز هویت زنده Docker و dry-run زمان‌بند زنده Docker. تغییرات `package.json` فقط زمانی شامل می‌شوند که diff محدود به `scripts["test:docker:live-*"]` باشد؛ ویرایش‌های dependency، export، version، و سایر سطوح package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد سبک از نظر import از agents، commands، plugins، کمک‌کننده‌های auto-reply، `plugin-sdk`، و نواحی ابزار خالص مشابه از lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود می‌مانند.
    - فایل‌های سورس کمک‌کننده منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمون‌های خواهر صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های کمک‌کننده از اجرای دوباره مجموعه کامل سنگین برای آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای کمک‌کننده‌های core سطح بالا، آزمون‌های یکپارچه‌سازی سطح بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import کل دنباله Node را در اختیار نگیرد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط مخصوص release به نام `agentic-plugins` را رد می‌کند. Full Release Validation گردش‌کار فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین از نظر Plugin/extension روی نامزدهای release dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner تعبیه‌شده">

    - وقتی ورودی‌های کشف message-tool یا زمینه runtime مربوط به compaction را تغییر می‌دهید،
      هر دو سطح پوشش را نگه دارید.
    - رگرسیون‌های کمک‌کننده متمرکز برای مرزهای مسیریابی و نرمال‌سازی خالص اضافه کنید.
    - مجموعه‌های یکپارچه‌سازی runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها تأیید می‌کنند که شناسه‌های دامنه‌دار و رفتار compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های فقط کمک‌کننده
      جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner
      غیرایزوله در پروژه‌های ریشه، e2e، و پیکربندی‌های live استفاده می‌کند.
    - lane ریشه UI راه‌اندازی و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner مشترک غیرایزوله اجرا می‌شود.
    - هر shard مربوط به `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرآیندهای فرزند Node
      در Vitest اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ محلی کاهش یابد.
      برای مقایسه با رفتار استاندارد V8، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط قالب‌بندی انجام می‌دهد. فایل‌های قالب‌بندی‌شده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون‌ها را اجرا نمی‌کند.
    - وقتی به گیت بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push، `pnpm check:changed`
      را صراحتا اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای ارزان دامنه‌دار عبور می‌کند. فقط وقتی agent
      تصمیم می‌گیرد یک ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر
      Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را نگه می‌دارند،
      فقط با سقف worker بالاتر.
    - مقیاس‌گذاری خودکار worker محلی عمدا محافظه‌کارانه است و وقتی میانگین بار میزبان
      از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای همزمان Vitest به‌طور پیش‌فرض
      آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode وقتی wiring آزمون
      تغییر می‌کند درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی performance">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌همراه
      خروجی breakdown مربوط به import را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از
      `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شوند.
      اجراهای کل config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ shardهای CI با include-pattern
      نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل رهگیری باشند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را در importهای راه‌اندازی صرف می‌کند،
      وابستگی‌های سنگین را پشت یک درز محلی محدود `*.runtime.ts` نگه دارید و
      آن درز را مستقیما mock کنید، به‌جای اینکه کمک‌کننده‌های runtime را فقط برای
      عبور دادن از `vi.mock(...)` به‌صورت deep-import وارد کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر‌دهی‌شده
      `test:changed` را با مسیر native پروژه ریشه برای آن diff commitشده مقایسه می‌کند
      و زمان wall به‌همراه حداکثر RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با مسیریابی
      فهرست فایل‌های تغییریافته از طریق `scripts/test-projects.mjs` و پیکربندی ریشه Vitest
      benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک پروفایل CPU برای thread اصلی جهت
      سربار راه‌اندازی و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` پروفایل‌های CPU+heap مربوط به runner را برای
      مجموعه واحد با موازی‌سازی فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبار به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌صورت پیش‌فرض راه‌اندازی می‌کند
  - churn پیام gateway مصنوعی، memory، و payload بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC پرس‌وجو می‌کند
  - کمک‌کننده‌های persistence بسته پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه فشار می‌مانند، و عمق صف‌های هر نشست دوباره به صفر تخلیه می‌شود
- انتظارات:
  - برای CI امن و بدون نیاز به کلید
  - lane محدود برای پیگیری رگرسیون پایداری، نه جایگزینی برای مجموعه کامل Gateway

### E2E (smoke Gateway)

- فرمان: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های E2E مربوط به Pluginهای bundled زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: تا 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا سربار I/O کنسول کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose کنسول.
- دامنه:
  - رفتار end-to-end چندنمونه‌ای gateway
  - سطوح WebSocket/HTTP، pairing نود، و networking سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلید واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های واحد دارد (می‌تواند کندتر باشد)

### E2E: smoke بک‌اند OpenShell

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله‌شده OpenShell را از طریق Docker روی میزبان راه‌اندازی می‌کند
  - یک sandbox از یک Dockerfile محلی موقت ایجاد می‌کند
  - backend مربوط به OpenShell در OpenClaw را از مسیر واقعی `sandbox ssh-config` + اجرای SSH آزمایش می‌کند
  - رفتار فایل‌سیستم remote-canonical را از طریق پل fs در sandbox تأیید می‌کند
- انتظارات:
  - فقط با انتخاب صریح فعال می‌شود؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` به‌همراه daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس Gateway آزمایشی و sandbox را حذف می‌کند
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن آزمون هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### زنده (ارائه‌دهندگان واقعی + مدل‌های واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده Plugin‌های بسته‌بندی‌شده زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تغییرات قالب ارائه‌دهنده، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ را پیدا می‌کند
- انتظارات:
  - بنا به طراحی برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده `~/.profile` را source می‌کنند تا کلیدهای API جاافتاده را بردارند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد config/auth را در یک خانه آزمایشی موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` را فقط زمانی تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از دایرکتوری خانه واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌طور پیش‌فرض روی حالت کم‌صداتری قرار دارد: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را سرکوب می‌کند و logهای راه‌اندازی Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید logهای کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (مختص ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی مخصوص live را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ آزمون‌ها در پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی گرفتن خروجی کنسول Vitest کم‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت ارائه‌دهنده/Gateway فوراً هنگام اجراهای زنده stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییر زیادی داده‌اید `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / pairing: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «bot من از کار افتاده» / خطاهای مختص ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (تماس‌گیرنده با شبکه)

برای ماتریس مدل زنده، smokeهای backend در CLI، smokeهای ACP، harness مربوط به app-server در Codex، و همه آزمون‌های زنده ارائه‌دهنده رسانه (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، media harness) — به‌همراه مدیریت اعتبارنامه برای اجراهای زنده — به
[آزمودن مجموعه‌های زنده](/fa/help/testing-live) مراجعه کنید. برای checklist اختصاصی به‌روزرسانی و اعتبارسنجی
Plugin، به
[آزمودن به‌روزرسانی‌ها و Plugin‌ها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده profile-key متناظر خود را داخل تصویر Docker ریپو اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری config محلی و workspace شما را mount می‌کنند (و اگر mount شده باشد `~/.profile` را source می‌کنند). entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌طور پیش‌فرض یک سقف smoke کوچک‌تر دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً scan بزرگ‌تر و کامل‌تر می‌خواهید، آن env varها را بازنویسی کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکننده Node/Git برای laneهای نصب/به‌روزرسانی/وابستگی-Plugin است؛ آن laneها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای laneهای قابلیت built-app در `/app` نصب می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. aggregate از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای process را کنترل می‌کند، درحالی‌که سقف‌های resource مانع می‌شوند laneهای سنگین زنده، npm-install، و چندسرویسی همگی با هم شروع شوند. اگر یک lane منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی ظرفیت دوباره در دسترس شود آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط وقتی تنظیم کنید که میزبان Docker ظرفیت بیشتری دارد. اجراکننده به‌طور پیش‌فرض یک preflight مربوط به Docker انجام می‌دهد، containerهای قدیمی OpenClaw E2E را حذف می‌کند، هر 30 ثانیه status چاپ می‌کند، زمان‌بندی‌های lane موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها استفاده می‌کند تا در اجراهای بعدی laneهای طولانی‌تر را زودتر شروع کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest وزن‌دار lane بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ plan مربوط به CI برای laneهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` gate بومی GitHub برای package است که می‌پرسد «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` آپلود می‌کند، سپس laneهای Docker E2E قابل استفاده مجدد را در برابر همان tarball دقیق اجرا می‌کند، نه اینکه ref انتخاب‌شده را دوباره بسته‌بندی کند. Profileها بر اساس گستره مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/update/Plugin، ماتریس survivor مربوط به published-upgrade، پیش‌فرض‌های release، و triage خطا به [آزمودن به‌روزرسانی‌ها و Plugin‌ها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از command dispatch import کند، fail می‌شود؛ همچنین chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و importهای static مسیرهای cold شناخته‌شده Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین root help، onboard help، doctor help، status، config schema، و یک فرمان model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` سقف دارد (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط شکاف‌های metadata مربوط به packageهای منتشرشده را تحمل می‌کند: entryهای خصوصی QA inventory حذف‌شده، `gateway install --wrapper` جاافتاده، فایل‌های patch جاافتاده در git fixture مشتق‌شده از tarball، `update.channel` پایدارسازی‌نشده، مکان‌های legacy رکورد نصب Plugin، پایدارسازی جاافتاده رکورد نصب marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای packageهای بعد از `2026.4.25`، آن مسیرها خطاهای strict هستند.
- اجراکننده‌های smoke در container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای integration سطح‌بالاتر را تأیید می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های auth مورد نیاز CLI را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در خانه container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودآزمون اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌صورت پیش‌فرض Claude، Codex، و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودآزمون backend CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودآزمون harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودآزمون مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی بررسی سورس در QA است. عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- دودآزمون زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- ویزارد راه‌اندازی اولیه (TTY، قالب‌بندی کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودآزمون راه‌اندازی اولیه/کانال/عامل tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه env-ref به‌همراه Telegram به‌صورت پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` تغییر دهید.
- دودآزمون تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کارکرد کانال ماندگارشده و Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودآزمون بقا پس از ارتقا: `pnpm test:docker:upgrade-survivor` tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمی و کثیف با عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌علاوه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده زنده یا کانال اجرا می‌کند، سپس یک Gateway از نوع loopback را شروع می‌کند و حفظ config/state به‌علاوه بودجه‌های راه‌اندازی/وضعیت را بررسی می‌کند.
- دودآزمون منتشرشده بقا پس از ارتقا: `pnpm test:docker:published-upgrade-survivor` به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستورالعمل پخته‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway از نوع loopback را شروع می‌کند و intentهای پیکربندی‌شده، حفظ state، راه‌اندازی، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهد، و fixtureهای شبیه issue را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این موارد را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند.
- دودآزمون زمینه runtime نشست: `pnpm test:docker:session-runtime-context` ماندگاری transcript زمینه runtime پنهان به‌علاوه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite آسیب‌دیده را تأیید می‌کند.
- دودآزمون نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، ارائه‌دهندگان تصویر همراه بسته را برمی‌گرداند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، ساخت میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دودآزمون Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را میان containerهای root، update، و direct-npm خود به‌اشتراک می‌گذارد. دودآزمون به‌روزرسانی به‌صورت پیش‌فرض پیش از ارتقا به tarball نامزد، از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` یا در GitHub با ورودی `update_baseline_version` مربوط به workflow Install Smoke، آن را override کنید. بررسی‌های نصب‌کننده non-root یک cache ایزوله npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI مربوط به Install Smoke به‌روزرسانی سراسری تکراری direct-npm را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودآزمون CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌صورت پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در یک home ایزوله container seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌علاوه رفتار workspace حفظ‌شده را تأیید می‌کند. تصویر install-smoke را با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودآزمون snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E سورس به‌علاوه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای لینک، موارد قابل کلیک ارتقایافته با cursor، refs مربوط به iframe، و metadata فریم هستند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` بالا می‌برد، سپس رد schema ارائه‌دهنده را اجبار می‌کند و بررسی می‌کند جزئیات خام در لاگ‌های Gateway ظاهر شود.
- پل کانال MCP (Gateway seed‌شده + پل stdio + دودآزمون notification-frame خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور MCP واقعی stdio + دودآزمون allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist‌شده، refs متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub مقدار `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` override کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، تست از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- دودآزمون به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودآزمون ماتریس lifecycle مربوط به Plugin: `pnpm test:docker:plugin-lifecycle-matrix` tarball بسته‌بندی‌شده OpenClaw را در یک container خالی نصب می‌کند، یک Plugin از npm نصب می‌کند، enable/disable را تغییر می‌دهد، آن را از طریق یک registry محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس تأیید می‌کند uninstall همچنان state کهنه را حذف می‌کند، در حالی که برای هر فاز lifecycle متریک‌های RSS/CPU را لاگ می‌کند.
- دودآزمون metadata بازبارگذاری config: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist‌شده، refs متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی بسته Claude را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای plugins نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب Plugin از npm با ردیابی منابع، enable، disable، upgrade، downgrade، و uninstall در نبود کد را پوشش می‌دهد.

برای پیش‌ساخت و استفاده دوباره دستی از تصویر عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

overrideهای مخصوص suite برای تصویر، مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`، در صورت تنظیم همچنان اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره می‌کند، اگر تصویر از قبل local نباشد، اسکریپت‌ها آن را pull می‌کنند. تست‌های QR و Docker نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار بسته/نصب را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را در یک پوشهٔ کاری موقت داخل کانتینر آماده‌سازی می‌کنند. این کار باعث می‌شود ایمیج زمان اجرا
کم‌حجم بماند، در حالی که Vitest همچنان روی همان منبع/پیکربندی محلی دقیق شما اجرا می‌شود.
گام آماده‌سازی، cacheهای بزرگ فقط‌محلی و خروجی‌های ساخت برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و پوشه‌های خروجی `.build` محلی برنامه یا
Gradle را رد می‌کند تا اجراهای زندهٔ Docker چند دقیقه صرف کپی کردن
آرتیفکت‌های وابسته به ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا کاوشگرهای زندهٔ Gateway،
پردازش‌گرهای کانال واقعی Telegram/Discord و غیره را داخل کانتینر شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش
زندهٔ Gateway را از آن مسیر Docker محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز
منتقل کنید.
`test:docker:openwebui` یک تست دود سازگاری سطح بالاتر است: یک کانتینر Gateway متعلق به
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال می‌کند، یک کانتینر Open WebUI
پین‌شده را در برابر آن Gateway شروع می‌کند، از طریق Open WebUI وارد می‌شود،
بررسی می‌کند `/api/models` مدل `openclaw/default` را در معرض می‌گذارد، سپس یک درخواست
گفت‌وگوی واقعی را از طریق پروکسی `/api/chat/completions` در Open WebUI می‌فرستد.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد ایمیج
Open WebUI را دریافت کند و Open WebUI ممکن است لازم باشد راه‌اندازی شروع سرد خودش را کامل کند.
این مسیر انتظار یک کلید مدل زندهٔ قابل استفاده را دارد، و `OPENCLAW_PROFILE_FILE`
(`~/.profile` به‌صورت پیش‌فرض) راه اصلی برای فراهم کردن آن در اجراهای Docker شده است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً قطعی است و به حساب واقعی Telegram، Discord یا iMessage نیاز ندارد.
این مسیر یک کانتینر Gateway seeded را بوت می‌کند، کانتینر دومی را شروع می‌کند که
`openclaw mcp serve` را راه‌اندازی می‌کند، سپس کشف گفت‌وگوی مسیریابی‌شده، خواندن رونوشت‌ها،
فرادادهٔ پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و اعلان‌های کانال + مجوز
به سبک Claude را روی پل واقعی stdio MCP بررسی می‌کند. بررسی اعلان، فریم‌های خام stdio MCP
را مستقیماً بررسی می‌کند تا تست دود همان چیزی را اعتبارسنجی کند که پل واقعاً منتشر می‌کند،
نه فقط آنچه یک SDK کلاینت مشخص ممکن است نمایش دهد.
`test:docker:pi-bundle-mcp-tools` قطعی است و به کلید مدل زنده نیاز ندارد. این مسیر ایمیج
Docker مخزن را می‌سازد، یک سرور کاوش واقعی stdio MCP را داخل کانتینر شروع می‌کند، آن سرور
را از طریق زمان اجرای MCP باندل‌شدهٔ Pi در دسترس قرار می‌دهد، ابزار را اجرا می‌کند، سپس بررسی
می‌کند `coding` و `messaging` ابزارهای `bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و
`tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند.
`test:docker:cron-mcp-cleanup` قطعی است و به کلید مدل زنده نیاز ندارد. این مسیر یک Gateway
seeded را با یک سرور کاوش واقعی stdio MCP شروع می‌کند، یک نوبت Cron ایزوله و یک نوبت فرزند
یک‌بارهٔ `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند فرایند فرزند MCP پس از هر اجرا
خارج می‌شود.

تست دود دستی رشتهٔ گفت‌وگوی زبان طبیعی ACP (غیر CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این اسکریپت را برای گردش‌کارهای رگرسیون/اشکال‌زدایی نگه دارید. ممکن است دوباره برای اعتبارسنجی مسیریابی رشتهٔ گفت‌وگوی ACP لازم شود، پس آن را حذف نکنید.

متغیرهای محیطی مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) روی `/home/node/.openclaw` متصل می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) روی `/home/node/.openclaw/workspace` متصل می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) روی `/home/node/.profile` متصل می‌شود و پیش از اجرای تست‌ها بارگذاری می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای اعتبارسنجی فقط متغیرهای محیطی بارگذاری‌شده از `OPENCLAW_PROFILE_FILE`، با استفاده از پوشه‌های موقت پیکربندی/فضای کاری و بدون اتصال‌های احراز هویت CLI خارجی
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) روی `/home/node/.npm-global` برای نصب‌های cache‌شدهٔ CLI داخل Docker متصل می‌شود
- پوشه‌ها/فایل‌های احراز هویت CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` متصل می‌شوند، سپس پیش از شروع تست‌ها در `/home/node/...` کپی می‌شوند
  - پوشه‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای محدودشدهٔ ارائه‌دهنده فقط پوشه‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنتاج شده‌اند متصل می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست جداشده با ویرگول مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` بازنویسی کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلتر کردن ارائه‌دهندگان داخل کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفادهٔ دوباره از ایمیج موجود `openclaw:local-live` در اجرای مجددهایی که به ساخت دوباره نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه اعتبارنامه‌ها از مخزن پروفایل می‌آیند (نه از محیط)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای تست دود Open WebUI در معرض می‌گذارد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای بازنویسی پرامپت بررسی nonce که تست دود Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای بازنویسی تگ ایمیج پین‌شدهٔ Open WebUI

## سلامت‌سنجی مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای داخل صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## رگرسیون آفلاین (ایمن برای CI)

این‌ها رگرسیون‌های «خط لولهٔ واقعی» بدون ارائه‌دهندگان واقعی هستند:

- فراخوانی ابزار Gateway (OpenAI شبیه‌سازی‌شده، Gateway واقعی + حلقهٔ عامل): `src/gateway/gateway.test.ts` (مورد: "یک فراخوانی ابزار OpenAI شبیه‌سازی‌شده را به‌صورت سرتاسری از طریق حلقهٔ عامل Gateway اجرا می‌کند")
- راهنمای Gateway (WS `wizard.start`/`wizard.next`، پیکربندی را می‌نویسد + احراز هویت اعمال می‌شود): `src/gateway/gateway.test.ts` (مورد: "راهنما را روی ws اجرا می‌کند و پیکربندی توکن احراز هویت را می‌نویسد")

## ارزیابی‌های قابلیت اتکای عامل (Skills)

ما از قبل چند تست ایمن برای CI داریم که مانند «ارزیابی‌های قابلیت اتکای عامل» رفتار می‌کنند:

- فراخوانی ابزار شبیه‌سازی‌شده از طریق Gateway واقعی + حلقهٔ عامل (`src/gateway/gateway.test.ts`).
- جریان‌های سرتاسری راهنما که اتصال نشست و اثرات پیکربندی را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

مواردی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی Skills در پرامپت فهرست شده‌اند، آیا عامل مورد درست را انتخاب می‌کند (یا از موارد نامرتبط دوری می‌کند)؟
- **انطباق:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و گام‌ها/آرگومان‌های لازم را دنبال می‌کند؟
- **قراردادهای گردش‌کار:** سناریوهای چندنوبتی که ترتیب ابزارها، انتقال تاریخچهٔ نشست، و مرزهای محیط محصور را راستی‌آزمایی می‌کنند.

ارزیابی‌های آینده باید ابتدا قطعی بمانند:

- یک اجراکنندهٔ سناریو با ارائه‌دهندگان شبیه‌سازی‌شده برای راستی‌آزمایی فراخوانی‌های ابزار + ترتیب، خواندن فایل‌های Skills، و اتصال نشست.
- یک مجموعهٔ کوچک از سناریوهای متمرکز بر Skills (استفاده در برابر پرهیز، دروازه‌گذاری، تزریق پرامپت).
- ارزیابی‌های زندهٔ اختیاری (با فعال‌سازی صریح و محدودشده با متغیرهای محیطی) فقط پس از آماده شدن مجموعهٔ ایمن برای CI.

## تست‌های قرارداد (شکل Plugin و کانال)

تست‌های قرارداد بررسی می‌کنند که هر Plugin و کانال ثبت‌شده با قرارداد
رابط خودش سازگار باشد. آن‌ها روی همهٔ Pluginهای کشف‌شده پیمایش می‌کنند و مجموعه‌ای از
راستی‌آزمایی‌های شکل و رفتار را اجرا می‌کنند. مسیر واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های نقاط اتصال مشترک و تست دود را رد می‌کند؛ وقتی سطوح مشترک کانال یا ارائه‌دهنده
را لمس می‌کنید، دستورهای قرارداد را صریح اجرا کنید.

### دستورها

- همهٔ قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای ارائه‌دهنده: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **Plugin** - شکل پایهٔ Plugin (id، name، capabilities)
- **راه‌اندازی** - قرارداد راهنمای راه‌اندازی
- **اتصال نشست** - رفتار اتصال نشست
- **باردادهٔ خروجی** - ساختار باردادهٔ پیام
- **ورودی** - مدیریت پیام ورودی
- **اقدام‌ها** - رسیدگی‌کننده‌های اقدام کانال
- **مدیریت رشتهٔ گفت‌وگو** - مدیریت شناسهٔ رشتهٔ گفت‌وگو
- **دایرکتوری** - API دایرکتوری/فهرست اعضا
- **سیاست گروه** - اعمال سیاست گروه

### قراردادهای وضعیت ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **وضعیت** - کاوشگرهای وضعیت کانال
- **رجیستری** - شکل رجیستری Plugin

### قراردادهای ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **احراز هویت** - قرارداد جریان احراز هویت
- **انتخاب احراز هویت** - انتخاب/گزینش احراز هویت
- **کاتالوگ** - API کاتالوگ مدل
- **کشف** - کشف Plugin
- **بارگذار** - بارگذاری Plugin
- **زمان اجرا** - زمان اجرای ارائه‌دهنده
- **شکل** - شکل/رابط Plugin
- **راهنما** - راهنمای راه‌اندازی

### چه زمانی اجرا شود

- پس از تغییر خروجی‌های plugin-sdk یا زیرمسیرهای آن
- پس از افزودن یا تغییر یک کانال یا Plugin ارائه‌دهنده
- پس از بازآرایی ثبت یا کشف Plugin

تست‌های قرارداد در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن رگرسیون‌ها (راهنما)

وقتی یک مشکل ارائه‌دهنده/مدل کشف‌شده در اجرای زنده را رفع می‌کنید:

- در صورت امکان یک رگرسیون ایمن برای CI اضافه کنید (ارائه‌دهندهٔ شبیه‌سازی‌شده/جایگزین ساده، یا ثبت تبدیل دقیق شکل درخواست)
- اگر ذاتاً فقط زنده است (محدودیت‌های نرخ، سیاست‌های احراز هویت)، تست زنده را محدود و با فعال‌سازی صریح از طریق متغیرهای محیطی نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که خطا را می‌گیرد:
  - خطای تبدیل/بازپخش درخواست ارائه‌دهنده → تست مستقیم مدل‌ها
  - خطای خط لولهٔ نشست/تاریخچه/ابزار Gateway → تست دود زندهٔ Gateway یا تست شبیه‌سازی‌شدهٔ Gateway ایمن برای CI
- محافظ پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از فرادادهٔ رجیستری (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک هدف نمونه استخراج می‌کند، سپس راستی‌آزمایی می‌کند که شناسه‌های اجرای دارای بخش پیمایش رد می‌شوند.
  - اگر یک خانوادهٔ هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن تست به‌روزرسانی کنید. تست عمداً روی شناسه‌های هدف طبقه‌بندی‌نشده شکست می‌خورد تا کلاس‌های جدید نتوانند بی‌صدا نادیده گرفته شوند.

## مرتبط

- [تست زنده](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
