---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمون: مجموعه‌های unit/e2e/live، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-06T09:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker دارد. این سند راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را پیدا می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - معماری، سطح فرمان، نوشتن سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمولی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در پایین ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا اشاره می‌کند.
</Note>

## شروع سریع

در بیشتر روزها:

- دروازه کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی ماشینی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست تکرار می‌کنید، ابتدا اجرای هدفمند را ترجیح دهید.
- سایت QA پشتیبانی‌شده با Docker: `pnpm qa:lab:up`
- مسیر QA پشتیبانی‌شده با VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- دروازه پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + کاوشگرهای ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های کارایی زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت agent واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace در Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه،
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، مصنوعات مسیر mock-provider، deep-profile و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش
  mock-provider همچنین شامل اعداد بوت Gateway در سطح منبع، حافظه،
  plugin-pressure، حلقه hello تکرارشونده fake-model و startup CLI است.
- پیمایش مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌همراه یک کاوشگر کوچک شبیه خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک نیز اجرا می‌کنند.
    هنگام جدا کردن شکست‌های ارائه‌دهنده، کاوشگرهای اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: هر دو اجرای روزانه `OpenClaw Scheduled Live And E2E Checks` و دستی
    `OpenClaw Release Checks` گردش‌کار قابل‌استفاده‌مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی جداگانه مدل زنده Docker است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - secretهای ارائه‌دهنده جدید و پرسیگنال را به `scripts/ci-hydrate-live-auth.sh`
    به‌همراه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشاری آن اضافه کنید.
- smoke گفت‌وگوی bind بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را روی مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس بررسی می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از مسیر binding بومی Plugin عبور کنند، نه ACP.
- smoke harness مربوط به app-server در Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های agent در Gateway را از طریق harness متعلق به Plugin برای app-server در Codex اجرا می‌کند،
    `/codex status` و `/codex models` را بررسی می‌کند، و به‌صورت پیش‌فرض کاوشگرهای تصویر،
    Cron MCP، sub-agent و Guardian را تمرین می‌کند. هنگام جدا کردن دیگر شکست‌های
    app-server در Codex، کاوشگر sub-agent را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز sub-agent، کاوشگرهای دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این مورد پس از کاوشگر sub-agent خارج می‌شود، مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- smoke فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و چندلایه برای سطح فرمان نجات message-channel.
    `/crestodian status` را تمرین می‌کند، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد و مسیر نوشتن audit/config را بررسی می‌کند.
- smoke Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک container بدون پیکربندی با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و بررسی می‌کند که fallback برنامه‌ریز fuzzy به یک نوشتن config تایپ‌شده و حسابرسی‌شده تبدیل شود.
- smoke Docker نخستین اجرای Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک پوشه وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Discord plugin + SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند و ورودی‌های audit را بررسی می‌کند. همین مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- smoke هزینه Moonshot/Kimi: با تنظیم بودن `MOONSHOT_API_KEY`،
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  جداگانه را در برابر `moonshot/kimi-k2.6` اجرا کنید. بررسی کنید که JSON، Moonshot/K2.6 را گزارش کند و transcript دستیار، `usage.cost` نرمال‌شده را ذخیره کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده با متغیرهای محیطی allowlist که در ادامه توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این فرمان‌ها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. parity عامل‌محور زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه به‌عنوان یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض،
soak کامل live/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ پروفایل
`full`، soak را اجباری فعال می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر mock parity، مسیر live
Matrix، مسیر live Telegram مدیریت‌شده با Convex و مسیر live Discord
مدیریت‌شده با Convex به‌عنوان jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صریحا پاس می‌دهند، در حالی که ورودی پیش‌فرض Matrix CLI و گردش‌کار دستی
همچنان `all` است؛ dispatch دستی می‌تواند `all` را به jobهای `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تایید انتشار، parity به‌همراه مسیرهای fast Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا deterministic بمانند و از startup معمول Plugin ارائه‌دهنده دوری کنند. این Gatewayهای انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های QA parity پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/Backend زنده Docker از image مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که برای هر commit انتخاب‌شده یک‌بار ساخته می‌شود،
سپس به‌جای بازسازی داخل هر shard، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتیبانی‌شده توسط مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض هم‌روندی 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر از `--concurrency 1` استفاده کنید.
  - اگر هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai` و `aimock` را پشتیبانی می‌کند. `aimock` یک سرور ارائه‌دهنده محلی پشتیبانی‌شده توسط AIMock را برای پوشش آزمایشی fixture و protocol-mock راه‌اندازی می‌کند، بدون اینکه مسیر آگاه از سناریوی `mock-openai` را جایگزین کند.
- `pnpm test:plugins:kitchen-sink-live`
  - مجموعه آزمون زنده Plugin OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. بسته خارجی Kitchen Sink را نصب می‌کند، فهرست سطح Plugin SDK را اعتبارسنجی می‌کند، `/healthz` و `/readyz` را بررسی می‌کند، شواهد CPU/RSS مربوط به Gateway را ثبت می‌کند، یک نوبت زنده OpenAI را اجرا می‌کند، و diagnostics خصمانه را بررسی می‌کند. به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های Testbox آماده‌شده، وقتی helper `openclaw-testbox-env` حاضر باشد، نمایه احراز هویت زنده Testbox را به‌طور خودکار source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway به‌همراه یک بسته کوچک سناریوی QA Lab شبیه‌سازی‌شده (`channel-chat-baseline`، `memory-failure-fallback`، `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغ پایدار را flag می‌کند (`--cpu-core-warn` به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان metric ثبت می‌شوند، بدون اینکه شبیه regression چنددقیقه‌ای اشباع Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکسی Multipass دورریختنی اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - همان flagهای انتخاب ارائه‌دهنده/مدل را مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای guest عملی هستند forward می‌کنند: کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و `CODEX_HOME` وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا guest بتواند از طریق workspace mount‌شده دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌همراه logهای Multipass را زیر `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA پشتیبانی‌شده توسط Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت global در Docker نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند، به‌طور پیش‌فرض Telegram را پیکربندی می‌کند، اعتبارسنجی می‌کند که runtime بسته‌بندی‌شده Plugin بدون repair وابستگی هنگام راه‌اندازی بارگذاری می‌شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای برنامه ساخته‌شده، ویژه transcriptهای context runtime تعبیه‌شده اجرا می‌کند. اعتبارسنجی می‌کند که context runtime مخفی OpenClaw به‌جای نشت به نوبت کاربر قابل‌مشاهده، به‌عنوان یک پیام سفارشی غیرنمایشی پایدار می‌شود، سپس یک نشست JSONL خرابِ متاثر را seed می‌کند و اعتبارسنجی می‌کند که `openclaw doctor --fix` آن را با یک backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک candidate بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA زنده Telegram را با همان بسته نصب‌شده به‌عنوان Gateway سامانه تحت آزمون دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به Convex مانند `pnpm openclaw qa telegram` استفاده می‌کند. برای automation مربوط به CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند، wrapper مربوط به Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env credential مربوط به Telegram یا Convex را روی میزبان اعتبارسنجی می‌کند. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` را فقط وقتی تنظیم کنید که عمداً در حال debug تنظیمات پیش از credential هستید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای همین مسیر، مقدار مشترک `OPENCLAW_QA_CREDENTIAL_ROLE` را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. workflow از محیط `qa-live-shared` و leaseهای credential مربوط به CI در Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای proof محصول به‌صورت side-run در برابر یک بسته candidate ارائه می‌کند. یک ref قابل‌اعتماد، spec منتشرشده npm، URL tarball مبتنی بر HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگری را می‌پذیرد، `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` آپلود می‌کند، سپس scheduler موجود Docker E2E را با نمایه‌های مسیر smoke، package، product، full یا custom اجرا می‌کند. برای اجرای workflow QA مربوط به Telegram در برابر همان artifact با نام `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - proof محصول برای آخرین beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof مبتنی بر URL دقیق tarball به digest نیاز دارد:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof مبتنی بر artifact یک artifact tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را با پیکربندی OpenAI راه‌اندازی می‌کند، سپس channelها/Pluginهای bundled را از طریق ویرایش‌های config فعال می‌کند.
  - اعتبارسنجی می‌کند که discovery مربوط به setup، Pluginهای قابل‌دانلود پیکربندی‌نشده را غایب می‌گذارد، نخستین repair پیکربندی‌شده doctor هر Plugin قابل‌دانلودِ مفقود را صریحاً نصب می‌کند، و restart دوم repair وابستگی مخفی اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر و شناخته‌شده npm را نصب می‌کند، پیش از اجرای `openclaw update --tag <candidate>` Telegram را فعال می‌کند، و اعتبارسنجی می‌کند که doctor پس از update مربوط به candidate، debris وابستگی Plugin legacy را بدون repair postinstall سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke بومی update نصب بسته‌بندی‌شده را در میان guestهای Parallels اجرا می‌کند. هر platform انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس دستور نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و نسخه نصب‌شده، وضعیت update، آمادگی Gateway، و یک نوبت agent محلی را اعتبارسنجی می‌کند.
  - هنگام iteration روی یک guest از `--platform macos`، `--platform windows` یا `--platform linux` استفاده کنید. برای مسیر artifact خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض برای proof نوبت agent زنده از `openai/gpt-5.5` استفاده می‌کند. وقتی عمداً مدل دیگری از OpenAI را اعتبارسنجی می‌کنید، `--model <provider/model>` را pass کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان wrap کنید تا توقف‌های transport مربوط به Parallels نتوانند بقیه پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت logهای مسیر nested را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از اینکه فرض کنید wrapper بیرونی hung شده است، `windows-update.log`، `macos-update.log` یا `linux-update.log` را بررسی کنید.
  - update در Windows می‌تواند روی یک guest سرد 10 تا 15 دقیقه را در doctor پس از update و کار update بسته صرف کند؛ تا وقتی log debug مربوط به npm در حال پیشروی است، این وضعیت همچنان سالم است.
  - این wrapper aggregate را هم‌زمان با مسیرهای smoke تکی Parallels برای macOS، Windows یا Linux اجرا نکنید. آن‌ها state مربوط به VM را به‌اشتراک می‌گذارند و ممکن است روی snapshot restore، package serving یا state مربوط به Gateway در guest با هم برخورد کنند.
  - proof پس از update سطح معمول Plugin bundled را اجرا می‌کند، زیرا facadeهای capability مانند speech، image generation و media understanding از طریق APIهای runtime bundled بارگذاری می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون smoke مستقیم protocol راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver دورریختنی Tuwunel پشتیبانی‌شده توسط Docker اجرا می‌کند. فقط source-checkout - نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، catalog مربوط به profile/scenario، env varها، و layout artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای bot مربوط به driver و SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید chat id عددی Telegram باشد.
  - `--credential-source convex` را برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - اگر هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، در حالی که bot مربوط به SUT یک username مربوط به Telegram را expose کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید bot مربوط به driver می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

مسیرهای transport زنده یک contract استاندارد مشترک دارند تا transportهای جدید drift نکنند؛ matrix پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن matrix نیست.

### credentialهای مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease اختصاصی از pool پشتیبانی‌شده توسط Convex دریافت می‌کند، هنگام اجرای مسیر برای
آن lease Heartbeat می‌فرستد، و هنگام shutdown، lease را آزاد می‌کند.

scaffold مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env varهای الزامی:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش credential:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci` و در غیر این صورت `maintainer`)

env varهای اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای loopback مبتنی بر `http://` برای توسعه فقط محلی Convex اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات معمول باید از `https://` استفاده کند.

دستورهای مدیریتی نگه‌دارنده‌ها (افزودن/حذف/فهرست کردن pool) به‌طور مشخص به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجرای زنده از `doctor` استفاده کنید تا URL سایت Convex، اسرار broker،
پیشوند endpoint، timeout HTTP، و دسترس‌پذیری admin/list را بدون چاپ
مقادیر محرمانه بررسی کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و
ابزارهای CI از `--json` استفاده کنید.

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
- `groupId` باید یک رشته عددی شناسه چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

نام‌های معماری و scenario-helper برای adapterهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی فزاینده» (و افزایش flakiness/هزینه) در نظر بگیرید:

### Unit / integration (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های unit رابط کاربری در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های unit خالص
  - آزمون‌های integration درون‌فرایندی (احراز هویت Gateway، مسیریابی، tooling، parsing، config)
  - regressionهای قطعی برای باگ‌های شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و public-surface loader باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای کوچک Plugin تولیدشده ثابت کنند، نه با
    APIهای source Plugin بسته‌بندی‌شده واقعی. بارگذاری API واقعی Plugin به
    مجموعه‌های contract/integration تحت مالکیت Plugin تعلق دارد.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای scoped">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند بزرگ native root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) را اجرا می‌کند. این کار peak RSS را روی ماشین‌های درگیر کاهش می‌دهد و مانع می‌شود کارهای auto-reply/extension مجموعه‌های نامرتبط را گرسنه کنند.
    - `pnpm test --watch` همچنان از گراف پروژه native root در `vitest.config.ts` استفاده می‌کند، چون حلقه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل راه‌اندازی پروژه root را نمی‌پردازد.
    - `pnpm test:changed` مسیرهای git تغییرکرده را به‌طور پیش‌فرض به laneهای scoped ارزان گسترش می‌دهد: ویرایش‌های مستقیم آزمون، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های گراف import محلی. ویرایش‌های config/setup/package آزمون‌ها را به‌صورت گسترده اجرا نمی‌کنند مگر اینکه صراحتا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` گیت check هوشمند محلی عادی برای کارهای محدود است. diff را به core، آزمون‌های core، extensions، آزمون‌های extension، apps، docs، release metadata، ابزار Docker زنده، و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌های فقط release metadata، checkهای هدفمند version/config/root-dependency را اجرا می‌کند، همراه با guardی که تغییرهای package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness زنده Docker ACP، checkهای متمرکز اجرا می‌کنند: syntax shell برای اسکریپت‌های auth زنده Docker و dry-run scheduler زنده Docker. تغییرهای `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و دیگر سطوح package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمون‌های unit سبک از نظر import از agents، commands، plugins، کمک‌کننده‌های auto-reply، `plugin-sdk`، و نواحی مشابه utility خالص از lane `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود می‌مانند.
    - فایل‌های source کمک‌کننده منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمون‌های خواهر صریح در آن laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین برای آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، آزمون‌های integration سطح بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل tail Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط انتشار `agentic-plugins` را رد می‌کند. Full Release Validation گردش‌کار فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین از نظر plugin/extension روی candidateهای release dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner تعبیه‌شده">

    - وقتی ورودی‌های کشف message-tool یا context زمان اجرای compaction را تغییر می‌دهید،
      هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای مسیریابی و normalization خالص، regressionهای helper متمرکز اضافه کنید.
    - مجموعه‌های integration runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها بررسی می‌کنند که scoped idها و رفتار compaction همچنان از مسیرهای واقعی
      `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های فقط helper
      جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از
      runner غیر isolated در سراسر پروژه‌های root، e2e، و پیکربندی‌های live استفاده می‌کند.
    - lane رابط کاربری root setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner غیر isolated مشترک اجرا می‌شود.
    - هر shard در `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest
      مقدار `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 هنگام اجراهای محلی بزرگ کاهش یابد.
      برای مقایسه با رفتار V8 پیش‌فرض، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون اجرا نمی‌کند.
    - وقتی به گیت check هوشمند محلی نیاز دارید، پیش از handoff یا push صراحتا
      `pnpm check:changed` را اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای scoped ارزان عبور می‌کند. فقط وقتی agent
      تصمیم می‌گیرد ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر
      Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند،
      فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمدا محافظه‌کار است و وقتی load average میزبان از قبل بالا باشد
      عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا اجرای دوباره changed-mode وقتی wiring آزمون
      تغییر می‌کند صحیح بماند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر یک مکان cache صریح برای profiling مستقیم می‌خواهید،
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی کارایی">

    - `pnpm test:perf:imports` گزارش مدت import در Vitest به‌همراه
      خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به
      فایل‌های تغییرکرده از `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ shardهای CI با include-pattern
      نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل پیگیری باشند.
    - وقتی یک آزمون hot هنوز بیشتر زمانش را در importهای startup صرف می‌کند،
      وابستگی‌های سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و
      به‌جای deep-import کردن helperهای runtime فقط برای عبور دادن آن‌ها از
      `vi.mock(...)`، همان seam را مستقیما mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed
      `test:changed` را با مسیر native root-project برای آن diff ثبت‌شده مقایسه می‌کند
      و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با routing
      فهرست فایل‌های تغییرکرده از طریق
      `scripts/test-projects.mjs` و پیکربندی root Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU نخ اصلی برای
      سربار startup و transform مربوط به Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap runner را برای مجموعه
      unit با file parallelism غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارشده به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال‌شده به‌طور پیش‌فرض راه‌اندازی می‌کند
  - churn مصنوعی پیام Gateway، memory، و payload بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC پرس‌وجو می‌کند
  - helperهای persistence bundle پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه فشار می‌مانند، و عمق queue هر session دوباره به صفر تخلیه می‌شود
- انتظارات:
  - برای CI امن و بدون نیاز به کلید
  - lane محدود برای پیگیری stability-regression، نه جایگزینی برای مجموعه کامل Gateway

### E2E (smoke Gateway)

- فرمان: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های سرتاسری Pluginهای همراه زیر `extensions/`
- پیش‌فرض‌های زمان اجرا:
  - از Vitest `threads` با `isolate: false` استفاده می‌کند، همسو با بقیه مخزن.
  - از workerهای تطبیقی استفاده می‌کند (CI: حداکثر ۲، محلی: به‌صورت پیش‌فرض ۱).
  - به‌صورت پیش‌فرض در حالت بی‌صدا اجرا می‌شود تا سربار ورودی/خروجی کنسول کاهش یابد.
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی مفصل کنسول.
- دامنه:
  - رفتار سرتاسری Gateway چندنمونه‌ای
  - سطوح WebSocket/HTTP، جفت‌سازی node، و شبکه‌سازی سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در خط لوله فعال باشد)
  - به کلیدهای واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های واحد دارد (می‌تواند کندتر باشد)

### سرتاسری: اسموک بک‌اند OpenShell

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک OpenShell gateway ایزوله را از طریق Docker روی میزبان شروع می‌کند
  - از یک Dockerfile محلی موقت، یک sandbox می‌سازد
  - بک‌اند OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌کند
  - رفتار فایل‌سیستم canonical راه‌دور را از طریق پل fs در sandbox راستی‌آزمایی می‌کند
- انتظارها:
  - فقط با انتخاب صریح؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` و یک daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس test gateway و sandbox را نابود می‌کند
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی آزمون هنگام اجرای دستی مجموعه گسترده‌تر سرتاسری
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به یک باینری CLI یا اسکریپت wrapper غیرپیش‌فرض

### زنده (providerهای واقعی + مدل‌های واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده Pluginهای همراه زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - گرفتن تغییرات قالب provider، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ
- انتظارها:
  - طبق طراحی در CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده برای برداشتن کلیدهای API جاافتاده، `~/.profile` را source می‌کنند.
- به‌صورت پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد config/auth را در یک home آزمون موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط وقتی عمداً لازم دارید آزمون‌های زنده از پوشه home واقعی شما استفاده کنند، `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید.
- `pnpm test:live` اکنون به‌صورت پیش‌فرض به حالت کم‌صداتری می‌رود: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را سرکوب می‌کند و لاگ‌های bootstrap gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر لاگ‌های کامل راه‌اندازی را می‌خواهید، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (مختص provider): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا از بازنویسی مخصوص زنده از طریق `OPENCLAW_LIVE_*_KEY` استفاده کنید؛ آزمون‌ها در پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی provider حتی وقتی ضبط کنسول Vitest بی‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت provider/gateway هنگام اجراهای زنده بلافاصله جریان پیدا کنند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید، `pnpm test:coverage`)
- دست‌زدن به شبکه‌سازی gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده» / خرابی‌های مختص provider / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، اسموک‌های بک‌اند CLI، اسموک‌های ACP، harness سرور برنامه Codex، و همه آزمون‌های زنده providerهای رسانه‌ای (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، harness رسانه) - به‌همراه مدیریت اعتبارنامه برای اجراهای زنده - [آزمون مجموعه‌های زنده](/fa/help/testing-live) را ببینید. برای چک‌لیست اختصاصی به‌روزرسانی و اعتبارسنجی Plugin، [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، در حالی که پوشه config محلی و workspace شما را mount می‌کنند (و اگر mount شده باشد، `~/.profile` را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌صورت پیش‌فرض سقف اسموک کوچک‌تری دارند تا یک پیمایش کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً پیمایش فراگیر بزرگ‌تر را می‌خواهید، این env varها را بازنویسی کنید.
- `test:docker:all` تصویر زنده Docker را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. تصویر bare فقط اجراکننده Node/Git برای مسیرهای install/update/plugin-dependency است؛ آن مسیرها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای مسیرهای عملکرد برنامه ساخته‌شده در `/app` نصب می‌کند. تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` اسلات‌های فرایند را کنترل می‌کند، در حالی که سقف‌های منابع جلوی شروع هم‌زمان همه مسیرهای سنگین زنده، نصب npm، و چندسرویسی را می‌گیرند. اگر یک مسیر واحد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی ظرفیت دوباره در دسترس شود، آن را به‌تنهایی در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ اسلات، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker ظرفیت بیشتری دارد، `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌صورت پیش‌فرض preflight مربوط به Docker را انجام می‌دهد، containerهای سرتاسری قدیمی OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع زودتر مسیرهای طولانی‌تر استفاده می‌کند. برای چاپ manifest مسیر وزن‌دار بدون ساخت یا اجرای Docker، از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ plan مربوط به CI برای مسیرهای انتخاب‌شده، نیازهای بسته/تصویر، و اعتبارنامه‌ها، `node scripts/test-docker-all.mjs --plan-json` را اجرا کنید.
- `Package Acceptance` دروازه بسته بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» است. یک بسته نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` بارگذاری می‌کند، سپس مسیرهای سرتاسری Docker قابل استفاده مجدد را به‌جای بسته‌بندی دوباره ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. profileها به ترتیب گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد بسته/به‌روزرسانی/Plugin، ماتریس بازماندگان ارتقای منتشرشده، پیش‌فرض‌های انتشار، و triage خرابی، [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.
- بررسی‌های ساخت و انتشار پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. نگهبان، گراف ساخته‌شده ایستای `dist/entry.js` و `dist/cli/run-main.js` را پیمایش می‌کند و اگر importهای راه‌اندازی پیش از dispatch، وابستگی‌های package مانند Commander، رابط prompt، undici، یا logging را پیش از dispatch فرمان وارد کنند، شکست می‌خورد؛ همچنین chunk اجرای gateway همراه را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای سرد شناخته‌شده gateway را رد می‌کند. اسموک CLI بسته‌بندی‌شده همچنین help ریشه، help onboard، help doctor، status، schema پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` سقف دارد (`2026.4.25-beta.*` هم شامل می‌شود). تا آن نقطه برش، harness فقط شکاف‌های metadata بسته ارسال‌شده را تحمل می‌کند: ورودی‌های خصوصی حذف‌شده موجودی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و migration metadata پیکربندی هنگام `plugins update`. برای بسته‌های پس از `2026.4.25`، آن مسیرها خرابی سخت هستند.
- اجراکننده‌های اسموک container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را راستی‌آزمایی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط homeهای احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home داخل container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن مخزن احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودآزمون اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، همراه با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودآزمون بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودآزمون مهار app-server برای Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودآزمون مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA برای checkout منبع است. عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm شامل QA Lab نمی‌شود.
- دودآزمون زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست‌سازی کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودآزمون راه‌اندازی اولیه/کانال/عامل tarball در Npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع env و نیز به‌طور پیش‌فرض Telegram پیکربندی می‌کند، doctor را اجرا می‌کند و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. یک tarball ازپیش‌ساخته را با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.
- دودآزمون تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` جابه‌جا می‌شود، کانال ماندگارشده و کارکرد Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودآزمون بقا پس از ارتقا: `pnpm test:docker:upgrade-survivor`، tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کثیف از کاربر قدیمی با عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، وضعیت کهنه وابستگی Plugin و فایل‌های موجود workspace/session نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای provider یا کانال زنده اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- دودآزمون بقا پس از ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor`، به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستور پخت فرمان ازپیش‌تعبیه‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway loopback را شروع می‌کند و intents پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای هم‌شکل issue را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance آن‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` در دسترس می‌گذارد، توکن‌های meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌علاوه `reported-issues` گسترش می‌دهد.
- دودآزمون زمینه runtime جلسه: `pnpm test:docker:session-runtime-context`، ماندگاری رونوشت زمینه runtime پنهان به‌همراه تعمیر doctor برای شاخه‌های prompt-rewrite تکراری آسیب‌دیده را تأیید می‌کند.
- دودآزمون نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh`، درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند و تأیید می‌کند `openclaw infer image providers --json` به‌جای هنگ کردن، providerهای تصویر bundled را برمی‌گرداند. یک tarball ازپیش‌ساخته را با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، ساخت میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دودآزمون Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh`، یک کش npm را میان containerهای root، update و direct-npm خود مشترک می‌کند. دودآزمون update پیش از ارتقا به tarball کاندید، به‌طور پیش‌فرض از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. آن را به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` workflow مربوط به Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده non-root یک کش npm ایزوله نگه می‌دارند تا ورودی‌های کش با مالکیت root، رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از کش root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI، به‌روزرسانی تکراری direct-npm global را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودآزمون CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزوله container seed می‌کند، `agents delete --json` را اجرا می‌کند و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. تصویر install-smoke را با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودآزمون snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند و تأیید می‌کند snapshotهای نقش CDP، URLهای link، clickableهای ارتقایافته با cursor، refهای iframe و metadata فریم را پوشش می‌دهند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema از سوی provider را اجباری می‌کند و بررسی می‌کند جزئیات خام در لاگ‌های Gateway ظاهر شده باشد.
- پل کانال MCP (Gateway seedشده + پل stdio + دودآزمون notification-frame خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP bundle مربوط به Pi (سرور MCP واقعی stdio + دودآزمون allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoistشده، refهای متحرک git، ClawHub kitchen-sink، به‌روزرسانی‌های marketplace و فعال‌سازی/بازرسی Claude-bundle): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی و hermetic برای ClawHub استفاده می‌کند.
- دودآزمون بدون‌تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودآزمون ماتریس چرخه‌عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix`، tarball بسته‌بندی‌شده OpenClaw را در یک container خالی نصب می‌کند، یک Plugin مربوط به npm را نصب می‌کند، enable/disable را تغییر می‌دهد، آن را از طریق یک registry محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس تأیید می‌کند uninstall همچنان وضعیت کهنه را حذف می‌کند و در همین حال metricهای RSS/CPU را برای هر مرحله چرخه‌عمر ثبت می‌کند.
- دودآزمون metadata بازبارگذاری پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins`، دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace و فعال‌سازی/بازرسی Claude-bundle را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون‌تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب Plugin مربوط به npm با ردیابی منابع، enable، disable، upgrade، downgrade و uninstall در حالت نبود کد را پوشش می‌دهد.

برای پیش‌ساختن و استفاده دوباره دستی از تصویر functional مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر مخصوص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم‌شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره کند، اگر آن تصویر از قبل local نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار package/install را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را داخل کانتینر در یک workdir موقت آماده می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد، در حالی که همچنان Vitest را روی همان سورس/پیکربندی محلی دقیق شما اجرا می‌کند.
مرحله آماده‌سازی، cacheهای بزرگِ فقط‌محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های `.build` محلی برنامه یا
خروجی Gradle را رد می‌کند تا اجراهای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای وابسته به ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده gateway،
workerهای کانال واقعی Telegram/Discord/غیره را داخل کانتینر شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است
پوشش زنده gateway را از آن lane Docker محدود یا حذف کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز
عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک کانتینر gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک کانتینر Open WebUI پین‌شده را در برابر آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models`، `openclaw/default` را نمایش می‌دهد، سپس یک
درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI ارسال می‌کند.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد راه‌اندازی سرد خودش را کامل کند.
این lane انتظار یک کلید مدل زنده قابل‌استفاده را دارد، و `OPENCLAW_PROFILE_FILE`
(به‌طور پیش‌فرض `~/.profile`) روش اصلی برای فراهم کردن آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. این دستور یک کانتینر Gateway
seed‌شده را boot می‌کند، کانتینر دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف گفت‌وگوی route‌شده، خواندن transcript، metadata پیوست،
رفتار queue رویداد زنده، routing ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude را
از روی bridge واقعی stdio MCP بررسی می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را اعتبارسنجی کند که
bridge واقعاً emit می‌کند، نه فقط چیزی را که یک SDK client خاص اتفاقاً نمایش می‌دهد.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
این دستور image Docker ریپو را build می‌کند، یک سرور probe واقعی stdio MCP را
داخل کانتینر شروع می‌کند، آن سرور را از طریق runtime MCP بسته Pi embedded
materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging`
toolهای `bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد.
این دستور یک Gateway seed‌شده را با یک سرور probe واقعی stdio MCP شروع می‌کند، یک
turn cron ایزوله و یک turn فرزند one-shot مربوط به `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند
فرایند فرزند MCP بعد از هر اجرا خارج می‌شود.

smoke دستی thread زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing thread در ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای تست‌ها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای auth بیرونی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای installهای cache‌شده CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth مربوط به CLI بیرونی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع تست‌ها داخل `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند mount می‌کنند
  - override دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده دوباره از یک image موجود `openclaw:local-live` در rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentialها از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای smoke Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt nonce-check که smoke Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای override کردن tag image پین‌شده Open WebUI

## sanity مستندات

بعد از ویرایش‌های مستندات، checkهای مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (ایمن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool در Gateway (OpenAI mock، gateway واقعی + loop عامل): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اعمال auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت‌اعتماد عامل (Skills)

ما از قبل چند تست ایمن برای CI داریم که مانند «evalهای قابلیت‌اعتماد عامل» رفتار می‌کنند:

- فراخوانی tool mock از طریق gateway واقعی + loop عامل (`src/gateway/gateway.test.ts`).
- flowهای end-to-end wizard که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزهایی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skillها در prompt فهرست شده‌اند، آیا عامل skill درست را انتخاب می‌کند (یا از موارد نامربوط اجتناب می‌کند)؟
- **انطباق:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و stepها/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چندturnی که ترتیب tool، انتقال تاریخچه session، و boundaryهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن فراخوانی‌های tool + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- evalهای زنده اختیاری (opt-in، env-gated) فقط بعد از آماده شدن suite ایمن برای CI.

## تست‌های contract (شکل Plugin و کانال)

تست‌های contract بررسی می‌کنند که هر Plugin و کانال ثبت‌شده با
قرارداد interface خودش مطابقت دارد. آن‌ها روی همه Pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای شکل و رفتار را اجرا می‌کنند. lane unit پیش‌فرض `pnpm test` عمداً
این فایل‌های seam مشترک و smoke را رد می‌کند؛ وقتی surfaceهای مشترک کانال یا provider را touch می‌کنید،
دستورهای contract را صراحتاً اجرا کنید.

### دستورها

- همه contractها: `pnpm test:contracts`
- فقط contractهای کانال: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای کانال

واقع در `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شکل پایه Plugin (id، name، capabilities)
- **setup** - قرارداد setup wizard
- **session-binding** - رفتار binding session
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام inbound
- **actions** - handlerهای action کانال
- **threading** - handling شناسه thread
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال سیاست گروه

### contractهای وضعیت provider

واقع در `src/plugins/contracts/*.contract.test.ts`.

- **status** - probeهای وضعیت کانال
- **registry** - شکل registry Plugin

### contractهای provider

واقع در `src/plugins/contracts/*.contract.test.ts`:

- **auth** - قرارداد flow auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime provider
- **shape** - شکل/interface Plugin
- **wizard** - setup wizard

### زمان اجرا

- بعد از تغییر exportها یا subpathهای plugin-sdk
- بعد از افزودن یا تغییر یک Plugin کانال یا provider
- بعد از refactor کردن registration یا discovery در Plugin

تست‌های contract در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک مشکل provider/model را که در live کشف شده fix می‌کنید:

- اگر ممکن است یک regression ایمن برای CI اضافه کنید (provider mock/stub، یا capture کردن شکل دقیق transformation request)
- اگر ذاتاً فقط live است (rate limitها، سیاست‌های auth)، تست live را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug مربوط به conversion/replay درخواست provider → تست مستقیم مدل‌ها
  - bug مربوط به pipeline session/history/tool در gateway → smoke زنده gateway یا تست mock gateway ایمن برای CI
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک target نمونه derive می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک خانواده target جدید `includeInPlan` برای SecretRef در `src/secrets/target-registry-data.ts` اضافه کردید، `classifyTargetClass` را در آن تست update کنید. تست عمداً روی target idهای دسته‌بندی‌نشده fail می‌شود تا کلاس‌های جدید بی‌صدا skip نشوند.

## مرتبط

- [تست live](/fa/help/testing-live)
- [تست updateها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
