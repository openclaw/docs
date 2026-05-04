---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت تست: مجموعه‌های unit/e2e/live، اجراکننده‌های Docker، و اینکه هر تست چه مواردی را پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-04T07:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «ما چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمداً چه چیزهایی را پوشش _نمی‌دهد_).
- برای جریان‌های کاری رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهندگان را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** به‌صورت جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح فرمان، نوشتن سناریو.
- [Matrix QA](/fa/concepts/qa-matrix) — مرجع `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون عادی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در ادامه ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- دروازه کامل (پیش از push انتظار می‌رود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA پشتیبانی‌شده با Docker: `pnpm qa:lab:up`
- مسیر QA پشتیبانی‌شده با ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- دروازه پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهندگان/مدل‌های واقعی (به اعتبارنامه واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + بررسی‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، مصنوعات مسیر mock-provider، deep-profile، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش
  mock-provider همچنین شامل اعداد بوت Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقه تکراری hello-loop مدل ساختگی، و راه‌اندازی CLI است.
- پیمایش مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک بررسی کوچک به سبک خواندن فایل را اجرا می‌کند.
    مدل‌هایی که فراداده آن‌ها ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، بررسی‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش کار قابل استفاده مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل کارهای ماتریسی جداگانه مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - رازهای ارائه‌دهنده جدید و با سیگنال بالا را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- smoke گفت‌وگوی متصل بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک پیام مستقیم مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    به‌جای ACP از طریق اتصال بومی Plugin عبور می‌کنند.
- smoke ابزار app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق ابزار app-server مالکیت‌شده توسط Plugin مربوط به Codex اجرا می‌کند،
    `/codex status` و `/codex models` را تأیید می‌کند، و به‌طور پیش‌فرض بررسی‌های تصویر،
    MCP متعلق به cron، زیرعامل، و Guardian را تمرین می‌کند. هنگام جداسازی شکست‌های دیگر
    app-server مربوط به Codex، بررسی زیرعامل را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز زیرعامل، بررسی‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از بررسی زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- smoke فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و دو‌لایه برای سطح فرمان نجات کانال پیام.
    `/crestodian status` را تمرین می‌کند، یک تغییر مدل پایدار را صف می‌کند،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تأیید می‌کند.
- smoke برنامه‌ریز Crestodian در Docker: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک Claude CLI ساختگی روی `PATH`
    اجرا می‌کند و تأیید می‌کند که fallback برنامه‌ریز fuzzy به یک نوشتن پیکربندی typed و auditشده
    ترجمه می‌شود.
- smoke اجرای نخست Crestodian در Docker: `pnpm test:docker:crestodian-first-run`
  - از یک پوشه وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Plugin متعلق به Discord + SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های audit را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- smoke هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، فرمان
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید که JSON، Moonshot/K2.6 را گزارش می‌کند و
  رونوشت assistant مقدار نرمال‌شده `usage.cost` را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که در ادامه توصیف شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این فرمان‌ها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری عاملی زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر mock parity، مسیر زنده
Matrix، مسیر زنده Telegram مدیریت‌شده با Convex، و مسیر زنده Discord
مدیریت‌شده با Convex به‌عنوان کارهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صراحتاً پاس می‌دهند، در حالی که مقدار پیش‌فرض Matrix CLI و ورودی گردش‌کار دستی
همچنان `all` می‌ماند؛ dispatch دستی می‌تواند `all` را به کارهای `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تأیید انتشار، parity به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی عادی Plugin ارائه‌دهنده پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های QA parity
پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده ساخته می‌شود،
سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند، به‌جای اینکه داخل هر shard دوباره build شود.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتوانه‌دار با مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی با workerهای
    Gateway ایزوله اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض هم‌زمانی ۴ دارد (محدود به
    تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید،
    یا برای مسیر سریال قدیمی‌تر از `--concurrency 1` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های provider به نام‌های `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور provider محلی با پشتوانه AIMock برای پوشش آزمایشی
    fixture و protocol-mock راه‌اندازی می‌کند، بدون اینکه مسیر آگاه از سناریوی
    `mock-openai` را جایگزین کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway را همراه با یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) اجرا می‌کند و یک خلاصه ترکیبی از مشاهده CPU
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های پایدار CPU داغ را علامت‌گذاری می‌کند (`--cpu-core-warn`
    به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه زمان راه‌اندازی به‌عنوان metrics
    ثبت می‌شوند بدون اینکه شبیه رگرسیون چنددقیقه‌ای قفل‌شدن Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد،
    ابتدا یک build اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکسی disposable در Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو مثل `qa suite` روی میزبان را نگه می‌دارد.
  - همان flagهای انتخاب provider/model مثل `qa suite` را دوباره استفاده می‌کند.
  - اجراهای live ورودی‌های پشتیبانی‌شده auth برای QA را که برای guest عملی هستند forward می‌کنند:
    کلیدهای provider مبتنی بر env، مسیر پیکربندی provider زنده QA، و `CODEX_HOME`
    وقتی حاضر باشد.
  - مسیرهای خروجی باید زیر ریشه مخزن بمانند تا guest بتواند از طریق
    workspace mount‌شده دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA با پشتوانه Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی کلید OpenAI API را اجرا می‌کند، به‌طور پیش‌فرض Telegram
    را پیکربندی می‌کند، تأیید می‌کند runtime مربوط به Plugin بسته‌بندی‌شده بدون تعمیر وابستگی
    در زمان راه‌اندازی load می‌شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر یک
    endpoint mock‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker از برنامه ساخته‌شده برای transcriptهای context runtime توکار
    اجرا می‌کند. تأیید می‌کند context runtime پنهان OpenClaw به‌عنوان یک پیام سفارشی
    غیرنمایشی persisted می‌شود، به‌جای اینکه به نوبت قابل‌مشاهده کاربر نشت کند،
    سپس یک session JSONL خراب تحت‌تأثیر را seed می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را با یک backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک کاندید package از OpenClaw را در Docker نصب می‌کند، onboarding package نصب‌شده را
    اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA زنده Telegram
    را با همان package نصب‌شده به‌عنوان Gateway تحت آزمون دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمون یک tarball
    محلی resolve‌شده به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz`
    یا `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentials محیطی Telegram یا منبع credential Convex مثل
    `pnpm openclaw qa telegram` استفاده می‌کند. برای automation در CI/release،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند،
    wrapper Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env مربوط به credentialهای Telegram یا Convex
    را روی میزبان validate می‌کند. فقط وقتی عمداً در حال debug تنظیمات پیش از credential هستید،
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر، مقدار مشترک
    `OPENCLAW_QA_CREDENTIAL_ROLE` را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این workflow از
    محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run
  در برابر یک package کاندید ارائه می‌کند. یک ref قابل‌اعتماد، spec منتشرشده npm،
  URL tarball از نوع HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگری را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس
  scheduler موجود Docker E2E را با profileهای مسیر smoke، package، product، full، یا custom
  اجرا می‌کند. برای اجرای workflow QA مربوط به Telegram در برابر همان artifact
  `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
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

- اثبات artifact یک artifact مربوط به tarball را از اجرای Actions دیگری download می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و install می‌کند، Gateway را
    با OpenAI پیکربندی‌شده راه‌اندازی می‌کند، سپس channel/pluginsهای bundled را از طریق ویرایش‌های config
    فعال می‌کند.
  - تأیید می‌کند discovery مربوط به setup، Pluginهای downloadable پیکربندی‌نشده را absent می‌گذارد،
    نخستین repair پیکربندی‌شده doctor هر Plugin دانلودشدنی missing را صریحاً install می‌کند،
    و restart دوم repair پنهان وابستگی را اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر شناخته‌شده npm را install می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>`، Telegram را فعال می‌کند، و تأیید می‌کند doctor پس از update
    کاندید، بقایای legacy وابستگی Plugin را بدون repair مربوط به postinstall در سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke بومی update برای نصب package‌شده را روی guestهای Parallels اجرا می‌کند. هر
    platform انتخاب‌شده ابتدا package baseline درخواست‌شده را install می‌کند، سپس
    دستور نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و version نصب‌شده،
    status update، آمادگی Gateway، و یک نوبت agent محلی را verify می‌کند.
  - هنگام iteration روی یک guest، از `--platform macos`، `--platform windows`، یا `--platform linux` استفاده کنید.
    برای مسیر artifact خلاصه و وضعیت هر مسیر، از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض از `openai/gpt-5.5` برای اثبات نوبت agent live استفاده می‌کند.
    وقتی عمداً یک model دیگر OpenAI را validate می‌کنید، `--model <provider/model>` را pass کنید
    یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان wrap کنید تا stallهای transport در Parallels نتوانند
    باقی پنجره testing را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - این script logهای تو در توی هر مسیر را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از اینکه فرض کنید wrapper بیرونی hang شده، `windows-update.log`، `macos-update.log`، یا `linux-update.log`
    را inspect کنید.
  - update ویندوز می‌تواند در guest سرد ۱۰ تا ۱۵ دقیقه در کار doctor پس از update و package
    update زمان بگذارد؛ تا وقتی log debug تو در توی npm در حال پیشروی است، این وضعیت هنوز سالم است.
  - این wrapper aggregate را به‌صورت موازی با مسیرهای smoke تکی Parallels
    macOS، Windows، یا Linux اجرا نکنید. آن‌ها state مربوط به VM را share می‌کنند و می‌توانند در
    restore snapshot، serving package، یا state مربوط به Gateway در guest تداخل کنند.
  - اثبات پس از update سطح معمول Plugin bundled را اجرا می‌کند، زیرا
    facadeهای capability مانند گفتار، تولید تصویر، و فهم رسانه
    از طریق APIهای runtime bundled load می‌شوند، حتی وقتی خود نوبت agent
    فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور provider محلی AIMock را برای smoke testing مستقیم protocol
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط source-checkout — نصب‌های package‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، catalog مربوط به profile/scenario، env varها، و layout مربوط به artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه private واقعی با استفاده از tokenهای driver و SUT bot از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه private نیاز دارد، در حالی که bot مربوط به SUT یک username مربوط به Telegram را expose می‌کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند traffic botهای گروه را observe کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای reply شامل RTT از درخواست ارسال driver تا reply مشاهده‌شده SUT هستند.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید drift نکنند؛ matrix پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن matrix نیست.

### credentialهای مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری از pool با پشتوانه Convex می‌گیرد، هنگام اجرای مسیر
برای آن lease Heartbeat می‌فرستد، و هنگام shutdown آن lease را release می‌کند.

scaffold مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env varهای لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش credential:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci`، در غیر این صورت `maintainer`)

env varهای اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` اجازه URLهای Convex از نوع loopback `http://` را فقط برای توسعه محلی می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

دستورهای admin مربوط به maintainer (pool add/remove/list) مشخصاً به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای maintainerها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

از `doctor` پیش از اجراهای زنده استفاده کنید تا URL سایت Convex، اسرار broker،
پیشوند endpoint، مهلت زمانی HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر محرمانه بررسی کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI
از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل تلاش دوباره: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - محافظ lease فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشته عددی شناسه چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های helper سناریو برای adapterهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

این مجموعه‌ها را به‌عنوان «افزایش واقع‌گرایی» (و افزایش ناپایداری/هزینه) در نظر بگیرید:

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های per-project گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، مسیریابی، tooling، parsing، config)
  - رگرسیون‌های قطعی برای باگ‌های شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه
    APIهای منبع Plugin بسته‌بندی‌شده واقعی. بارگذاری API واقعی Plugin به
    مجموعه‌های contract/integration متعلق به Plugin مربوط است.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` بدون هدف، به‌جای یک فرایند عظیم native root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار peak RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه ماندن مجموعه‌های نامرتبط توسط کار auto-reply/extension جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژه native root در `vitest.config.ts` استفاده می‌کند، چون loop watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر scoped laneها عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه راه‌اندازی کامل root project را نمی‌پردازد.
    - `pnpm test:changed` مسیرهای تغییرکرده git را به‌طور پیش‌فرض به laneهای scoped ارزان گسترش می‌دهد: ویرایش‌های مستقیم آزمون، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های محلی import-graph. ویرایش‌های config/setup/package آزمون‌ها را به‌صورت گسترده اجرا نمی‌کنند مگر اینکه صریحاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه عادی بررسی هوشمند محلی برای کارهای محدود است. این دستور diff را به core، آزمون‌های core، extensions، آزمون‌های extension، apps، docs، metadata انتشار، ابزارهای live Docker، و tooling طبقه‌بندی می‌کند، سپس فرمان‌های typecheck، lint، و guard متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. bumpهای نسخه فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را با guardی اجرا می‌کنند که تغییرات package خارج از فیلد نسخه سطح بالا را رد می‌کند.
    - ویرایش‌های harness زنده Docker ACP بررسی‌های متمرکز اجرا می‌کنند: syntax shell برای اسکریپت‌های احراز هویت live Docker و dry-run scheduler زنده Docker. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و سایر package-surface همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد import-light از agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و نواحی utility خالص مشابه از مسیر lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود باقی می‌مانند.
    - برخی فایل‌های source helper در `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمون‌های هم‌جوار صریح در همان laneهای سبک نگاشت می‌کنند، تا ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین برای آن دایرکتوری پرهیز کنند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، آزمون‌های یکپارچه‌سازی سطح بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket با import سنگین مالک کل tail مربوط به Node نشود.
    - CI عادی PR/main عمداً sweep دسته‌ای extension و shard فقط‌انتشار `agentic-plugins` را رد می‌کند. Full Release Validation workflow فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین plugin/extension روی release candidateها dispatch می‌کند.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - وقتی ورودی‌های کشف message-tool یا context runtime مربوط به Compaction را تغییر می‌دهید،
      هر دو سطح پوشش را نگه دارید.
    - برای مرزهای routing و normalization خالص، رگرسیون‌های helper متمرکز اضافه کنید.
    - مجموعه‌های یکپارچه‌سازی embedded runner را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها بررسی می‌کنند که شناسه‌های scoped و رفتار Compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های
      فقط-helper جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner
      غیرایزوله در پروژه‌های root، e2e، و configهای live استفاده می‌کند.
    - lane ریشه UI setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner مشترک غیرایزوله اجرا می‌شود.
    - هر shard مربوط به `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest
      مقدار `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 در اجراهای محلی بزرگ کاهش یابد.
      برای مقایسه با رفتار stock V8 مقدار `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push،
      `pnpm check:changed` را صریحاً اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیر laneهای scoped ارزان عبور می‌کند. فقط وقتی از
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که agent
      تصمیم بگیرد ویرایش harness، config، package، یا contract واقعاً به پوشش گسترده‌تر
      Vitest نیاز دارد.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را نگه می‌دارند،
      فقط با سقف worker بالاتر.
    - auto-scaling محلی worker عمداً محافظه‌کار است و وقتی میانگین load میزبان از قبل بالا باشد
      عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode وقتی wiring آزمون
      تغییر می‌کند صحیح بمانند.
    - config مقدار `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر یک محل cache صریح برای profiling مستقیم می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` گزارش duration مربوط به import در Vitest به‌همراه
      خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییرکرده
      از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای whole-config از مسیر config به‌عنوان key استفاده می‌کنند؛ shardهای CI مبتنی بر include-pattern
      نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل ردیابی باشند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را در importهای startup می‌گذراند،
      dependencyهای سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و
      همان seam را مستقیماً mock کنید، به‌جای اینکه runtime helperها را فقط برای عبور دادن به
      `vi.mock(...)` به‌صورت deep import وارد کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed
      `test:changed` را با مسیر native root-project برای آن diff commitشده مقایسه می‌کند
      و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن
      فهرست فایل‌های تغییرکرده از مسیر `scripts/test-projects.mjs` و پیکربندی ریشه Vitest
      benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU مربوط به main-thread برای
      سربار startup و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap مربوط به runner را برای
      مجموعه واحد با file parallelism غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبار به یک worker
- دامنه:
  - یک Gateway واقعی روی local loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn مصنوعی پیام، حافظه، و payload بزرگ Gateway را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به bundle پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند که recorder محدود می‌ماند، نمونه‌های مصنوعی RSS زیر بودجه فشار باقی می‌مانند، و عمق صف‌های per-session دوباره به صفر تخلیه می‌شود
- انتظارات:
  - برای CI امن و بدون نیاز به کلید است
  - lane محدود برای پیگیری رگرسیون پایداری، نه جایگزینی برای مجموعه کامل Gateway

### E2E (gateway smoke)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های E2E مربوط به Pluginهای همراه در `extensions/`
- پیش‌فرض‌های زمان اجرا:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیه مخزن.
  - از کارگرهای تطبیقی استفاده می‌کند (CI: حداکثر ۲، محلی: به‌طور پیش‌فرض ۱).
  - به‌طور پیش‌فرض در حالت بی‌صدا اجرا می‌شود تا سربار I/O کنسول کاهش یابد.
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد کارگرها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی مفصل کنسول.
- دامنه:
  - رفتار سرتاسری Gateway چندنمونه‌ای
  - سطوح WebSocket/HTTP، جفت‌سازی Node، و شبکه‌سازی سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در خط لوله فعال باشد)
  - به کلیدهای واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های واحد دارد (می‌تواند کندتر باشد)

### E2E: اسموک بک‌اند OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله OpenShell را از طریق Docker روی میزبان راه‌اندازی می‌کند
  - از یک Dockerfile محلی موقت یک sandbox می‌سازد
  - بک‌اند OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار سیستم فایلِ canonical راه‌دور را از طریق پل sandbox fs بررسی می‌کند
- انتظارات:
  - فقط با انتخاب صریح؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه یک Docker daemon فعال نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس Gateway و sandbox آزمون را نابود می‌کند
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن آزمون هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به باینری CLI یا اسکریپت wrapper غیرپیش‌فرض

### زنده (ارائه‌دهندگان واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده Pluginهای همراه در `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تغییرات قالب ارائه‌دهنده، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ را می‌گیرد
- انتظارات:
  - بنا به طراحی برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده `~/.profile` را source می‌کنند تا کلیدهای API جاافتاده را بردارند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک خانه آزمون موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط وقتی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از دایرکتوری home واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌طور پیش‌فرض از حالت کم‌سروصداتر استفاده می‌کند: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را سرکوب می‌کند و لاگ‌های bootstrap مربوط به Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید لاگ‌های کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (ویژه هر ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی مختص زنده را از طریق `OPENCLAW_LIVE_*_KEY` تنظیم کنید؛ آزمون‌ها هنگام پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خطوط پیشرفت را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی capture کنسول Vitest کم‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خطوط پیشرفت ارائه‌دهنده/Gateway بلافاصله در طول اجراهای زنده stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر چیزهای زیادی تغییر داده‌اید، `pnpm test:coverage`)
- لمس شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده است» / خرابی‌های ویژه ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده را اجرا کنید

## آزمون‌های زنده (دارای تماس شبکه)

برای ماتریس مدل زنده، اسموک‌های بک‌اند CLI، اسموک‌های ACP، harness سرور برنامه Codex،
و همه آزمون‌های زنده ارائه‌دهنده رسانه (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، harness رسانه) — به‌علاوه مدیریت اعتبارنامه برای اجراهای زنده — ببینید
[آزمون مجموعه‌های زنده](/fa/help/testing-live). برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی Plugin، ببینید
[آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins).

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده منطبق با کلید پروفایل خود را داخل image Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی منطبق `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌طور پیش‌فرض از سقف اسموک کوچک‌تری استفاده می‌کنند تا یک sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً اسکن جامع بزرگ‌تر را می‌خواهید، آن متغیرهای env را بازنویسی کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت npm tarball بسته‌بندی می‌کند، سپس دو image مبتنی بر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. image ساده فقط اجراکننده Node/Git برای مسیرهای install/update/plugin-dependency است؛ آن مسیرها tarball از پیش ساخته‌شده را mount می‌کنند. image عملکردی همان tarball را برای مسیرهای عملکرد برنامه ساخته‌شده در `/app` نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` جایگاه‌های پردازه را کنترل می‌کند، در حالی که سقف‌های منبع مانع می‌شوند مسیرهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر واحد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس آن را تنها در حال اجرا نگه می‌دارد تا ظرفیت دوباره در دسترس شود. پیش‌فرض‌ها ۱۰ جایگاه، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker فضای بیشتری دارد، `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌طور پیش‌فرض preflight Docker را انجام می‌دهد، کانتینرهای E2E کهنه OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی‌های مسیر موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها برای شروع مسیرهای طولانی‌تر در اجراهای بعدی استفاده می‌کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest مسیر وزن‌دار بدون ساخت یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ طرح CI برای مسیرهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` دروازه بومی GitHub برای package است: «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` بارگذاری می‌کند، سپس مسیرهای Docker E2E قابل استفاده مجدد را در برابر همان tarball دقیق اجرا می‌کند، به‌جای اینکه ref انتخاب‌شده را دوباره بسته‌بندی کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/update/plugin، ماتریس بازمانده ارتقای منتشرشده، پیش‌فرض‌های انتشار، و triage خرابی، ببینید [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins).
- بررسی‌های build و انتشار بعد از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این guard گراف ساخته‌شده ایستا را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر importهای راه‌اندازی پیش از dispatch وابستگی‌های package مانند Commander، UI پرامپت، undici، یا logging را قبل از dispatch فرمان وارد کنند، شکست می‌خورد؛ همچنین chunk اجرای Gateway همراه را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای سرد شناخته‌شده Gateway را رد می‌کند. اسموک CLI بسته‌بندی‌شده همچنین help ریشه، help onboarding، help doctor، status، schema پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance در `2026.4.25` سقف دارد (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط شکاف‌های metadata مربوط به packageهای shipped را تحمل می‌کند: ورودی‌های private QA inventory حذف‌شده، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای packageهای بعد از `2026.4.25`، آن مسیرها خرابی سخت‌گیرانه هستند.
- اجراکننده‌های اسموک کانتینر: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند کانتینر واقعی را بوت می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را بررسی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه خانه‌های پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home کانتینر کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن مخزن احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودآزمون اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودآزمون بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودآزمون هارنس کارساز برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودآزمون مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA برای checkout منبع است. این مورد عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- دودآزمون زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر آغازبه‌کار (TTY، داربست‌سازی کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودآزمون آغازبه‌کار/کانال/عامل tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق آغازبه‌کار env-ref به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از tarball ازپیش‌ساخته استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` بازسازی میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` کانال را تغییر دهید.
- دودآزمون تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کانال پایدارشده و عملکرد Plugin پس از به‌روزرسانی را راستی‌آزمایی می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودآزمون بازمانده ارتقا: `pnpm test:docker:upgrade-survivor`، tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کثیف کاربر قدیمی با عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های موجود workspace/session نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای provider یا کانال زنده اجرا می‌کند، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- دودآزمون بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن مبنا را با یک recipe فرمان baked پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک مبنا را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید مبناهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهد، و fixtureهای مسئله‌محور را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای ترمیم خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این موارد را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند.
- دودآزمون زمینه runtime نشست: `pnpm test:docker:session-runtime-context`، پایداری transcript زمینه runtime پنهان به‌همراه ترمیم doctor برای شاخه‌های تکراری متاثر prompt-rewrite را راستی‌آزمایی می‌کند.
- دودآزمون نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و راستی‌آزمایی می‌کند که `openclaw infer image providers --json` به‌جای hang شدن، providerهای تصویر bundled را برمی‌گرداند. با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از tarball ازپیش‌ساخته استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` build میزبان را رد کنید، یا با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`، `dist/` را از یک تصویر Docker ساخته‌شده کپی کنید.
- دودآزمون Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را میان containerهای root، update، و direct-npm خود به‌اشتراک می‌گذارد. دودآزمون update پیش از ارتقا به tarball نامزد، به‌طور پیش‌فرض npm `latest` را به‌عنوان مبنای stable استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` گردش‌کار Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده غیر root، یک cache ایزوله npm نگه می‌دارند تا entryهای cache متعلق به root، رفتار نصب کاربر-محلی را پنهان نکنند. برای استفاده دوباره از cache مربوط به root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI مربوط به Install Smoke با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` به‌روزرسانی تکراری direct-npm سراسری را رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودآزمون CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزوله container seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را راستی‌آزمایی می‌کند. با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` از تصویر install-smoke استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + health): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودآزمون snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و راستی‌آزمایی می‌کند که snapshotهای نقش CDP شامل URLهای لینک، clickableهای ارتقایافته با cursor، ارجاع‌های iframe، و metadata فریم هستند.
- رگرسیون استدلال حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک کارساز OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، راستی‌آزمایی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema توسط provider را اجباری می‌کند و بررسی می‌کند که جزئیات خام در لاگ‌های Gateway ظاهر شده باشد.
- پل کانال MCP (Gateway seedشده + پل stdio + دودآزمون خام notification-frame مربوط به Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (کارساز واقعی stdio MCP + دودآزمون allow/deny پروفایل Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + teardown فرزند stdio MCP پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودآزمون install/update برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist‌شده، refs متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/inspect بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک کارساز fixture محلی hermetic مربوط به ClawHub استفاده می‌کند.
- دودآزمون بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودآزمون ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix`، tarball بسته‌بندی‌شده OpenClaw را در یک container bare نصب می‌کند، یک Plugin مربوط به npm را نصب می‌کند، enable/disable را تغییر می‌دهد، آن را از طریق یک registry محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس راستی‌آزمایی می‌کند که uninstall همچنان وضعیت کهنه را حذف می‌کند و هم‌زمان معیارهای RSS/CPU را برای هر فاز چرخه عمر ثبت می‌کند.
- دودآزمون metadata بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` دودآزمون install/update را برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist‌شده، refs متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/inspect بسته Claude پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار update بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، enable، disable، upgrade، downgrade، و uninstall در حالت نبود کد برای Plugin مربوط به npm با ردیابی منابع را پوشش می‌دهد.

برای پیش‌ساخت و استفاده دوباره دستی از تصویر کارکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر ویژه suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم، اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره می‌کند، اگر از قبل local نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای خودشان را نگه می‌دارند، چون رفتار package/install را اعتبارسنجی می‌کنند نه runtime برنامه ساخته‌شده مشترک.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت read-only bind-mount می‌کنند و
آن را در یک workdir موقت داخل container stage می‌کنند. این کار runtime
image را سبک نگه می‌دارد، درحالی‌که همچنان Vitest را روی دقیقاً همان منبع/پیکربندی محلی شما اجرا می‌کند.
مرحله staging cacheهای بزرگ و فقط‌محلی و خروجی‌های build اپ مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی اپ یا
Gradle را رد می‌کند تا اجراهای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای مخصوص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده gateway
workerهای کانال واقعی Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، پس وقتی لازم است coverage زنده
gateway را از آن lane Docker محدود یا مستثنا کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز
pass through کنید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container
gateway OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container پین‌شده Open WebUI را در برابر آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند `/api/models` مدل `openclaw/default` را expose می‌کند، سپس یک
درخواست chat واقعی را از طریق proxy `/api/chat/completions` متعلق به Open WebUI ارسال می‌کند.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد setup شروع سرد خودش را تمام کند.
این lane انتظار یک key مدل زنده قابل‌استفاده دارد، و `OPENCLAW_PROFILE_FILE`
(به‌صورت پیش‌فرض `~/.profile`) روش اصلی برای فراهم کردن آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. این lane یک container Gateway seed‌شده را boot می‌کند،
یک container دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف مکالمه routed، خواندن transcript، metadata پیوست،
رفتار live event queue، routing ارسال outbound، و اعلان‌های کانال + permission به سبک Claude را از طریق پل MCP واقعی stdio
بررسی می‌کند. بررسی اعلان، frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke اعتبارسنجی کند که
bridge واقعاً چه چیزی emit می‌کند، نه فقط چیزی که یک SDK client خاص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به key مدل زنده نیاز ندارد.
این lane image Docker repo را build می‌کند، یک probe server واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime MCP bundle تعبیه‌شده Pi
materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند `coding` و `messaging`
toolهای `bundle-mcp` را نگه می‌دارند درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به key مدل زنده نیاز ندارد.
این lane یک Gateway seed‌شده را با یک probe server واقعی stdio MCP شروع می‌کند، یک
turn ایزوله cron و یک turn فرزند one-shot `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند
process فرزند MCP پس از هر اجرا exit می‌کند.

smoke دستی thread زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing thread ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای testها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های CLI cache‌شده داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت read-only زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم استنباط‌شده از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` را mount می‌کنند
  - override دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک comma list مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای reuse کردن image موجود `openclaw:local-live` برای rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای smoke Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt nonce-check استفاده‌شده توسط smoke Open WebUI
- `OPENWEBUI_IMAGE=...` برای override کردن tag image پین‌شده Open WebUI

## sanity اسناد

پس از ویرایش اسناد، checkهای اسناد را اجرا کنید: `pnpm check:docs`.
وقتی به checkهای heading درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchor در Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (CI-safe)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool در Gateway (mock OpenAI، gateway واقعی + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت‌اعتماد agent (skills)

ما از قبل چند test CI-safe داریم که مانند «evalهای قابلیت‌اعتماد agent» رفتار می‌کنند:

- فراخوانی mock tool از طریق gateway واقعی + agent loop (`src/gateway/gateway.test.ts`).
- جریان‌های wizard end-to-end که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skillها در prompt فهرست شده‌اند، آیا agent skill درست را انتخاب می‌کند (یا از موارد نامرتبط اجتناب می‌کند)؟
- **انطباق:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و stepها/argهای الزامی را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای multi-turn که ترتیب tool، carryover تاریخچه session، و boundaryهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با استفاده از providerهای mock برای assert کردن tool callها + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- evalهای زنده اختیاری (opt-in، env-gated) فقط پس از آماده شدن suite CI-safe.

## testهای قرارداد (شکل plugin و channel)

testهای قرارداد بررسی می‌کنند که هر plugin و channel ثبت‌شده با
قرارداد interface خودش مطابقت دارد. آن‌ها روی همه pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های seam و smoke مشترک را skip می‌کند؛ وقتی سطح‌های channel یا provider مشترک را touch می‌کنید،
commandهای قرارداد را صراحتاً اجرا کنید.

### Commandها

- همه قراردادها: `pnpm test:contracts`
- فقط قراردادهای channel: `pnpm test:contracts:channels`
- فقط قراردادهای provider: `pnpm test:contracts:plugins`

### قراردادهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه plugin (id، name، capabilities)
- **setup** - قرارداد setup wizard
- **session-binding** - رفتار session binding
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام inbound
- **actions** - handlerهای action کانال
- **threading** - handling Thread ID
- **directory** - API directory/roster
- **group-policy** - enforcement سیاست group

### قراردادهای status provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای status channel
- **registry** - شکل registry plugin

### قراردادهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - قرارداد جریان auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API catalog مدل
- **discovery** - کشف Plugin
- **loader** - loading Plugin
- **runtime** - runtime provider
- **shape** - شکل/interface Plugin
- **wizard** - Setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک channel یا provider plugin
- پس از refactor کردن registration یا discovery plugin

testهای قرارداد در CI اجرا می‌شوند و به keyهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- در صورت امکان یک regression CI-safe اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین layer را هدف بگیرید که bug را catch می‌کند:
  - bug تبدیل/replay درخواست provider → test مستقیم models
  - bug pipeline session/history/tool gateway → smoke زنده gateway یا test mock gateway CI-safe
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` یک target نمونه برای هر class از SecretRef را از metadata registry (`listSecretTargetRegistryEntries()`) derive می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک target family جدید SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test update کنید. این test عمداً روی target idهای unclassified fail می‌شود تا classهای جدید نتوانند بی‌صدا skip شوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
