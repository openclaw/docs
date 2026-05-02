---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمون: مجموعه‌آزمون‌های واحد/e2e/live، رانرهای Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-02T11:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «چگونه تست می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج چه دستورهایی اجرا شوند (محلی، پیش از push، اشکال‌زدایی).
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مسائل واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح دستورها، نوشتن سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای مبتنی بر repo از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در پایین ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا اشاره می‌کند.
</Note>

## شروع سریع

بیشتر روزها:

- گیت کامل (انتظار می‌رود پیش از push اجرا شود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی ماشینی با فضای کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA مبتنی بر Docker: `pnpm qa:lab:up`
- مسیر QA مبتنی بر VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اعتماد بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (به اعتبارنامه‌های واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + پروب‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- پیمایش مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک پروب کوچک شبیه خواندن فایل را اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام ایزوله‌کردن شکست‌های ارائه‌دهنده، پروب‌های اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی، هر دو گردش‌کار قابل استفاده مجدد زنده/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند که شامل jobهای ماتریسی جداگانه مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای مجدد متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - Secretهای ارائه‌دهنده جدید و پرسیگنال را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- اسموک گفت‌وگوی native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را روی مسیر app-server Codex اجرا می‌کند، یک
    Slack DM مصنوعی را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس تایید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از مسیر binding بومی Plugin عبور می‌کنند، نه از ACP.
- اسموک harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق harness سرور برنامه Codex متعلق به Plugin اجرا می‌کند،
    `/codex status` و `/codex models` را تایید می‌کند، و به‌صورت پیش‌فرض پروب‌های تصویر،
    cron MCP، زیرعامل، و Guardian را تمرین می‌کند. هنگام ایزوله‌کردن شکست‌های دیگر سرور برنامه Codex،
    پروب زیرعامل را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید.
    برای بررسی متمرکز زیرعامل، پروب‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از پروب زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- اسموک دستور نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و محکم‌کارانه برای سطح دستور نجات کانال پیام.
    این `/crestodian status` را تمرین می‌کند، یک تغییر مدل پایدار را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تایید می‌کند.
- اسموک Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون config با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و تایید می‌کند که fallback برنامه‌ریز fuzzy به یک نوشتن config تایپ‌شده و audited
    ترجمه می‌شود.
- اسموک Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک پوشه وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Discord plugin + SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند، و ورودی‌های audit را تایید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- اسموک هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`،
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را روی `moonshot/kimi-k2.6` اجرا کنید. تایید کنید JSON، Moonshot/K2.6 را گزارش می‌کند و
  transcript دستیار، `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدودکردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که پایین‌تر توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این دستورها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. `Parity gate` روی PRهای منطبق و
از dispatch دستی با ارائه‌دهنده‌های mock اجرا می‌شود. `QA-Lab - All Lanes` هر شب روی
`main` و از dispatch دستی با parity gate mock، مسیر Matrix زنده،
مسیر Telegram زنده مدیریت‌شده با Convex، و مسیر Discord زنده مدیریت‌شده با Convex به‌صورت
jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix `--profile fast` را
صراحتا پاس می‌دهند، در حالی که CLI ماتریس و ورودی گردش‌کار دستی همچنان به‌صورت پیش‌فرض
`all` هستند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`، `media`، `e2ee-smoke`،
`e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release Checks` پیش از تایید انتشار،
parity به‌علاوه مسیرهای fast Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از
`mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند و از راه‌اندازی معمول Plugin ارائه‌دهنده
اجتناب کنند. این Gatewayهای انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان
توسط مجموعه‌های QA parity پوشش داده می‌شود.

Shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` را دارد. Shardهای مدل/backend زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده
ساخته می‌شود، سپس به‌جای ساخت دوباره داخل هر shard، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر repo را مستقیم روی میزبان اجرا می‌کند.
  - چند سناریوی انتخاب‌شده را به‌صورت پیش‌فرض با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند.
    `qa-channel` به‌صورت پیش‌فرض concurrency 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده).
    برای تنظیم تعداد worker از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر
    `--concurrency 1` را به‌کار ببرید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده
    می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai`، و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture و protocol-mock
    بدون جایگزین‌کردن مسیر آگاه از سناریوی `mock-openai` راه‌اندازی می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway به‌علاوه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`,
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه مشاهده CPU ترکیبی
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهده‌های CPU داغِ پایدار را flag می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان metric ثبت می‌شوند
    بدون اینکه شبیه رگرسیون چنددقیقه‌ای peg شدن Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout هنوز خروجی runtime تازه ندارد،
    ابتدا build اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکس Multipass یک‌بارمصرف اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مثل `qa suite` روی میزبان حفظ می‌کند.
  - همان flagهای انتخاب ارائه‌دهنده/مدل را مثل `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را forward می‌کنند که برای guest عملی هستند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر config ارائه‌دهنده زنده QA، و `CODEX_HOME`
    در صورت وجود.
  - پوشه‌های خروجی باید زیر ریشه repo بمانند تا guest بتواند از طریق workspace mount‌شده
    دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند، به‌صورت پیش‌فرض Telegram
    را پیکربندی می‌کند، تایید می‌کند runtime Plugin بسته‌بندی‌شده بدون repair وابستگی راه‌اندازی
    load می‌شود، doctor را اجرا می‌کند، و یک نوبت عامل محلی را در برابر یک endpoint
    mock‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord، از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک اسموک Docker قطعی برای transcriptهای runtime context تعبیه‌شده در برنامه ساخته‌شده اجرا می‌کند.
    تایید می‌کند که runtime context پنهان OpenClaw به‌صورت یک پیام سفارشی غیرقابل‌نمایش persist می‌شود
    نه اینکه در نوبت قابل‌مشاهده کاربر نشت کند، سپس یک session JSONL خراب متاثر را seed می‌کند و تایید می‌کند
    `openclaw doctor --fix` آن را همراه با backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک نامزد بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA زنده Telegram را
    با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛
    برای آزمون یک tarball محلی resolve‌شده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان اعتبارنامه‌های env تلگرام یا منبع اعتبارنامه Convex مثل
    `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` به‌علاوه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI وجود داشته باشند،
    wrapper Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی maintainer
    `NPM Telegram Beta E2E` ارائه می‌کند. این مسیر هنگام merge اجرا نمی‌شود. گردش‌کار از
    محیط `qa-live-shared` و leaseهای اعتبارنامه CI Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول به‌صورت side-run
  در برابر یک بسته نامزد ارائه می‌کند. این یک ref مورداعتماد، spec منتشرشده npm،
  URL tarball با HTTPS به‌علاوه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` بارگذاری می‌کند، سپس
  زمان‌بند موجود Docker E2E را با پروفایل‌های مسیر smoke، package، product، full، یا custom
  اجرا می‌کند. برای اجرای گردش‌کار QA تلگرام در برابر همان artifact `package-under-test`،
  `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
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

- اثبات آرتیفکت، یک آرتیفکت tarball را از اجرای دیگری از Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - بیلد فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را
    با پیکربندی OpenAI راه‌اندازی می‌کند، سپس کانال‌ها/Pluginهای باندل‌شده را از طریق ویرایش‌های پیکربندی
    فعال می‌کند.
  - تأیید می‌کند که کشف راه‌اندازی، Pluginهای دانلودشدنی پیکربندی‌نشده را غایب می‌گذارد،
    نخستین تعمیر پیکربندی‌شده‌ی doctor هر Plugin دانلودشدنیِ مفقود را
    به‌صورت صریح نصب می‌کند، و راه‌اندازی دوباره‌ی دوم، تعمیر وابستگی پنهان را اجرا نمی‌کند.
  - همچنین یک مبنای npm قدیمیِ شناخته‌شده را نصب می‌کند، Telegram را پیش از اجرای
    `openclaw update --tag <candidate>` فعال می‌کند، و تأیید می‌کند doctor پس از به‌روزرسانیِ
    کاندید، پسماند وابستگی Pluginهای قدیمی را بدون تعمیر postinstall در سمت
    harness پاک‌سازی می‌کند.
- `pnpm test:parallels:npm-update`
  - دودسنجی به‌روزرسانی نصبِ بسته‌بندی‌شده‌ی بومی را روی مهمان‌های Parallels اجرا می‌کند. هر
    پلتفرم انتخاب‌شده ابتدا بسته‌ی مبنای درخواست‌شده را نصب می‌کند، سپس
    دستور نصب‌شده‌ی `openclaw update` را در همان مهمان اجرا می‌کند و
    نسخه‌ی نصب‌شده، وضعیت به‌روزرسانی، آمادگی Gateway، و یک نوبت عامل محلی را
    تأیید می‌کند.
  - هنگام تکرار روی یک مهمان، از `--platform macos`، `--platform windows`، یا `--platform linux` استفاده کنید. برای مسیر آرتیفکت خلاصه و
    وضعیت هر lane از `--json` استفاده کنید.
  - lane مربوط به OpenAI به‌صورت پیش‌فرض برای اثبات زنده‌ی نوبت عامل از
    `openai/gpt-5.5` استفاده می‌کند. هنگام اعتبارسنجی عمدیِ یک مدل دیگر
    OpenAI، `--model <provider/model>` را پاس دهید یا
    `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای طولانی محلی را در یک timeout میزبان بپیچید تا توقف‌های انتقال Parallels نتوانند
    باقی پنجره‌ی آزمایش را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت، لاگ‌های lane تو در تو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از اینکه فرض کنید wrapper بیرونی هنگ کرده است، `windows-update.log`، `macos-update.log`، یا `linux-update.log`
    را بررسی کنید.
  - به‌روزرسانی Windows روی یک مهمان سرد می‌تواند ۱۰ تا ۱۵ دقیقه را در doctor پس از به‌روزرسانی و کارهای
    به‌روزرسانی بسته صرف کند؛ وقتی لاگ debug تو در توی npm در حال پیشروی است، این هنوز سالم است.
  - این wrapper تجمیعی را هم‌زمان با laneهای دودسنجی مجزای Parallels برای
    macOS، Windows، یا Linux اجرا نکنید. آن‌ها وضعیت VM را مشترک دارند و می‌توانند روی
    بازگردانی snapshot، سرو کردن بسته، یا وضعیت Gateway مهمان با هم برخورد کنند.
  - اثبات پس از به‌روزرسانی، سطح معمول Pluginهای باندل‌شده را اجرا می‌کند، زیرا
    facadeهای قابلیت مانند گفتار، تولید تصویر، و درک رسانه
    حتی وقتی خود نوبت عامل فقط یک پاسخ متنی ساده را بررسی می‌کند، از طریق APIهای runtime باندل‌شده بارگذاری می‌شوند.

- `pnpm openclaw qa aimock`
  - فقط سرور محلی ارائه‌دهنده‌ی AIMock را برای دودسنجی مستقیم پروتکل
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - lane زنده‌ی QA مربوط به Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه‌ی Docker اجرا می‌کند. فقط source-checkout — نصب‌های بسته‌بندی‌شده `qa-lab` را ارسال نمی‌کنند.
  - CLI کامل، کاتالوگ profile/scenario، متغیرهای محیطی، و چیدمان آرتیفکت: [QA ماتریس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - lane زنده‌ی QA مربوط به Telegram را در برابر یک گروه خصوصی واقعی با استفاده از توکن‌های بات driver و SUT از محیط اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه‌ی گروه باید شناسه‌ی عددی چت Telegram باشد.
  - برای اعتبارنامه‌های pooled مشترک از `--credential-source convex` پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت env استفاده کنید، یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید تا از اجاره‌های pooled استفاده شود.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو بات متمایز در همان گروه خصوصی نیاز دارد، به‌طوری‌که بات SUT یک نام کاربری Telegram ارائه کند.
  - برای مشاهده‌ی پایدار بات به بات، حالت Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو بات فعال کنید و مطمئن شوید بات driver می‌تواند ترافیک بات‌های گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و آرتیفکت پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده‌ی SUT هستند.

laneهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید دچار واگرایی نشوند؛ ماتریس پوشش هر lane در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه‌ی مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، آزمایشگاه QA یک اجاره‌ی انحصاری را از یک pool با پشتوانه‌ی Convex دریافت می‌کند، در حالی که lane در حال اجراست
برای آن اجاره heartbeat می‌فرستد، و در زمان خاموشی اجاره را آزاد می‌کند.

scaffold مرجع پروژه‌ی Convex:

- `qa/convex-credential-broker/`

متغیرهای محیطی لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض محیط: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci`، و در غیر این صورت `maintainer`)

متغیرهای محیطی اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه‌ی trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` اجازه می‌دهد URLهای Convex با `http://` روی loopback فقط برای توسعه‌ی local-only استفاده شوند.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات معمول باید از `https://` استفاده کند.

دستورهای ادمین maintainer (افزودن/حذف/فهرست کردن pool) مشخصاً به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای maintainerها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده، از `doctor` برای بررسی URL سایت Convex، secretهای broker،
پیشوند endpoint، timeout مربوط به HTTP، و دسترسی admin/list بدون چاپ کردن
مقادیر secret استفاده کنید. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و ابزارهای
CI از `--json` استفاده کنید.

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
- `POST /admin/add` (فقط secret مربوط به maintainer)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط secret مربوط به maintainer)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ اجاره‌ی فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret مربوط به maintainer)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته‌ی شناسه‌ی عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده‌ی سناریو برای آداپترهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest مربوط به Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمایش (چه چیزی کجا اجرا می‌شود)

به مجموعه‌ها به‌عنوان «واقع‌گرایی فزاینده» (و flakiness/هزینه‌ی فزاینده) فکر کنید:

### واحد / یکپارچه‌سازی (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای هدف‌گذاری‌نشده از مجموعه shard مربوط به `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمایش‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمایش‌های واحد خالص
  - آزمایش‌های یکپارچه‌سازی درون‌فرایندی (auth مربوط به Gateway، مسیریابی، ابزارها، parsing، پیکربندی)
  - رگرسیون‌های قطعی برای باگ‌های شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمایش‌های resolver و loader سطح عمومی باید رفتار fallback گسترده‌ی `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه
    APIهای منبع واقعی Pluginهای باندل‌شده. بارگذاری‌های API واقعی Pluginها متعلق به
    مجموعه‌های contract/integration تحت مالکیت Plugin هستند.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند عظیم پروژهٔ ریشهٔ بومی، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه‌ماندن مجموعه‌های نامرتبط به‌خاطر کارهای auto-reply/extension جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژهٔ ریشهٔ بومی `vitest.config.ts` استفاده می‌کند، چون یک حلقهٔ watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` ابتدا هدف‌های صریح فایل/دایرکتوری را از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینهٔ کامل راه‌اندازی پروژهٔ ریشه را نمی‌پردازد.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای git تغییریافته را به laneهای scoped ارزان گسترش می‌دهد: ویرایش مستقیم تست‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح منبع، و وابسته‌های محلی گراف import. ویرایش‌های config/setup/package تست‌ها را به‌صورت گسترده اجرا نمی‌کنند، مگر این‌که صریحا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` gate عادی بررسی هوشمند محلی برای کارهای محدود است. این دستور diff را به core، تست‌های core، extensions، تست‌های extension، apps، docs، فرادادهٔ release، ابزار live Docker، و tooling دسته‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌های فقط فرادادهٔ release، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کند، همراه با guardی که تغییرات package خارج از فیلد سطح‌بالای version را رد می‌کند.
    - ویرایش‌های live Docker ACP harness بررسی‌های متمرکز اجرا می‌کنند: نحو shell برای اسکریپت‌های احراز هویت live Docker و یک dry-run زمان‌بند live Docker. تغییرات `package.json` فقط وقتی وارد می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و سایر سطوح package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد سبک از نظر import از agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و ناحیه‌های مشابه utility خالص، از lane `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های دارای state یا runtime سنگین روی laneهای موجود می‌مانند.
    - فایل‌های منبع helper منتخب در `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های هم‌جوار صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوبارهٔ مجموعهٔ سنگین کامل برای آن دایرکتوری جلوگیری می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح‌بالا، تست‌های integration سطح‌بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را باز هم به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل tail مربوط به Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط-release مربوط به `agentic-plugins` را رد می‌کند. Full Release Validation برای آن مجموعه‌های سنگین از نظر plugin/extension روی release candidateها، child workflow جداگانهٔ `Plugin Prerelease` را dispatch می‌کند.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - وقتی ورودی‌های کشف message-tool یا زمینهٔ runtime مربوط به compaction را تغییر می‌دهید، هر دو سطح پوشش را نگه دارید.
    - برای مرزهای routing و normalization خالص، regressionهای helper متمرکز اضافه کنید.
    - مجموعه‌های integration مربوط به embedded runner را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها تأیید می‌کنند که شناسه‌های scoped و رفتار compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - پیکربندی پایهٔ Vitest به‌طور پیش‌فرض روی `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner غیرایزوله در پروژه‌های ریشه، e2e، و پیکربندی‌های live استفاده می‌کند.
    - lane ریشهٔ UI، setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی runner مشترک غیرایزوله اجرا می‌شود.
    - هر shard مربوط به `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای child Node مربوط به Vitest، `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ محلی کاهش یابد. برای مقایسه با رفتار خام V8، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck، یا تست اجرا نمی‌کند.
    - وقتی به gate بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push، `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای scoped ارزان عبور می‌کند. فقط وقتی agent تصمیم می‌گیرد یک ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند، فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمدا محافظه‌کارانه است و وقتی میانگین بار host از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین اجرای چند Vitest هم‌زمان به‌طور پیش‌فرض آسیب کمتری می‌زند.
    - پیکربندی پایهٔ Vitest، پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت می‌زند تا اجرای دوباره در changed-mode هنگام تغییر wiring تست‌ها درست بماند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌همراه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای کل config مسیر config را به‌عنوان کلید استفاده می‌کنند؛ shardهای CI با include-pattern نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل ردیابی باشند.
    - وقتی یک تست داغ هنوز بیشتر زمانش را صرف importهای راه‌اندازی می‌کند، dependencyهای سنگین را پشت یک مرز محلی باریک `*.runtime.ts` نگه دارید و به‌جای deep-import کردن helperهای runtime فقط برای عبور دادنشان از `vi.mock(...)`، همان مرز را مستقیما mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed مربوط به `test:changed` را با مسیر پروژهٔ ریشهٔ بومی برای آن diff commitشده مقایسه می‌کند و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن فهرست فایل‌های تغییریافته از `scripts/test-projects.mjs` و پیکربندی ریشهٔ Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU از main-thread برای سربار راه‌اندازی و transform مربوط به Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap مربوط به runner را برای مجموعهٔ unit با parallelism فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبار به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn مصنوعی پیام gateway، حافظه، و payloadهای بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به bundle پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند که recorder محدود می‌ماند، نمونه‌های مصنوعی RSS زیر بودجهٔ فشار باقی می‌مانند، و عمق صف‌های هر session دوباره به صفر تخلیه می‌شود
- انتظارها:
  - مناسب CI و بدون نیاز به کلید
  - lane محدود برای پیگیری regression پایداری، نه جایگزین مجموعهٔ کامل Gateway

### E2E (gateway smoke)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با باقی repo.
  - از workerهای adaptive استفاده می‌کند (CI: حداکثر 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا سربار console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌کردن دوبارهٔ خروجی verbose console.
- دامنه:
  - رفتار end-to-end مربوط به gateway چند-instance
  - سطح‌های WebSocket/HTTP، جفت‌سازی node، و networking سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلید واقعی نیاز ندارد
  - نسبت به تست‌های unit قطعات متحرک بیشتری دارد (ممکن است کندتر باشد)

### E2E: OpenShell backend smoke

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک OpenShell gateway ایزوله را روی host از طریق Docker شروع می‌کند
  - از یک Dockerfile محلی موقت یک sandbox می‌سازد
  - backend مربوط به OpenShell در OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical از راه دور را از طریق sandbox fs bridge تأیید می‌کند
- انتظارها:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه Docker daemon فعال نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس test gateway و sandbox را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن تست هنگام اجرای دستی مجموعهٔ گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### Live (providerهای واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های live مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعا _امروز_ با credentialهای واقعی کار می‌کند؟»
  - گرفتن تغییرات قالب provider، quirks مربوط به tool-calling، مشکلات احراز هویت، و رفتار rate limit
- انتظارها:
  - طبق طراحی در CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، quotaها، قطعی‌ها)
  - هزینهٔ پولی دارد / از rate limitها استفاده می‌کند
  - اجرای subsetهای محدود را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای live، `~/.profile` را source می‌کنند تا API keyهای گمشده را بگیرند.
- به‌طور پیش‌فرض، اجراهای live همچنان `HOME` را ایزوله می‌کنند و material مربوط به config/auth را در یک test home موقت کپی می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط وقتی عمدا لازم دارید تست‌های live از home directory واقعی شما استفاده کنند، `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت کم‌صداتری دارد: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را suppress می‌کند و logهای bootstrap مربوط به gateway/همهمهٔ Bonjour را mute می‌کند. اگر logهای کامل راه‌اندازی را دوباره می‌خواهید، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش API key (مختص provider): `*_API_KEYS` را با قالب comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override مربوط به هر live را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ تست‌ها روی پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی progress/heartbeat:
  - مجموعه‌های live اکنون خط‌های progress را به stderr emit می‌کنند تا callهای طولانی provider حتی وقتی capture کنسول Vitest بی‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های progress مربوط به provider/gateway بلافاصله در طول اجراهای live stream شوند.
  - heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- منطق/آزمون‌های ویرایش: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید، `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده است» / خطاهای ویژهٔ ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، smokeهای پشتوانهٔ CLI، smokeهای ACP، چارچوب app-server
Codex، و همهٔ آزمون‌های زندهٔ ارائه‌دهنده‌های رسانه (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، چارچوب رسانه) — به‌علاوهٔ مدیریت اعتبارنامه‌ها برای اجراهای زنده — به
[مجموعه‌های آزمون زنده](/fa/help/testing-live) مراجعه کنید. برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی Plugin، به
[آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زندهٔ profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، در حالی که پوشهٔ پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زندهٔ Docker به‌صورت پیش‌فرض از سقف smoke کوچک‌تری استفاده می‌کنند تا یک جاروب کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً اسکن جامع‌تر و بزرگ‌تر را می‌خواهید،
  این متغیرهای env را override کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. تصویر bare فقط اجراکنندهٔ Node/Git برای مسیرهای install/update/plugin-dependency است؛ این مسیرها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای مسیرهای عملکرد برنامهٔ ساخته‌شده در `/app` نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامهٔ انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` اسلات‌های پردازش را کنترل می‌کند، در حالی که سقف‌های منبع مانع از شروع هم‌زمان همهٔ مسیرهای سنگین زنده، نصب npm، و چندسرویسی می‌شوند. اگر یک مسیر منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود، آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ اسلات، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker ظرفیت بیشتری دارد، `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌صورت پیش‌فرض preflight مربوط به Docker را انجام می‌دهد، کانتینرهای کهنهٔ OpenClaw E2E را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع زودتر مسیرهای طولانی‌تر استفاده می‌کند. برای چاپ manifest وزن‌دار مسیرها بدون ساختن یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ برنامهٔ CI برای مسیرهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها، `node scripts/test-docker-all.mjs --plan-json` را اجرا کنید.
- `Package Acceptance` دروازهٔ package بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» است. این دروازه یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` بارگذاری می‌کند، سپس مسیرهای قابل‌استفادهٔ مجدد Docker E2E را به‌جای بسته‌بندی دوبارهٔ ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. پروفایل‌ها بر اساس گستره مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/update/Plugin، ماتریس بازماندهٔ published-upgrade، پیش‌فرض‌های انتشار، و تریاژ خطا، به [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این نگهبان گراف ساخته‌شدهٔ static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch، وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch فرمان import کند، شکست می‌خورد؛ همچنین اندازهٔ chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و importهای static مسیرهای شناخته‌شدهٔ cold Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین help ریشه، help مربوط به onboard، help مربوط به doctor، status، schema پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cut-off، چارچوب فقط شکاف‌های metadata مربوط به packageهای منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شدهٔ inventory خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy برای install-record مربوط به Plugin، نبود پایداری install-record مربوط به marketplace، و migration metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، این مسیرها خطاهای سخت‌گیرانه هستند.
- اجراکننده‌های smoke کانتینر: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، و `test:docker:config-reload` یک یا چند کانتینر واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را تأیید می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط homeهای احراز هویت CLI لازم را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همهٔ موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home کانتینر کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- آزمون دود bind برای ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- آزمون دود بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- آزمون دود harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- آزمون دود مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی بررسی سورس QA است. این مسیر عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm شامل QA Lab نمی‌شود.
- آزمون دود زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، scaffold کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- آزمون دود tarball مربوط به Npm برای راه‌اندازی اولیه/کانال/عامل: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع env و به‌طور پیش‌فرض Telegram پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. برای استفادهٔ دوباره از tarball ازپیش‌ساخته، `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` را به‌کار ببرید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` تغییر دهید.
- آزمون دود تعویض کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بستهٔ `stable` به git `dev` تغییر می‌دهد، کارکرد کانال پایدارشده و Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به بستهٔ `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون دود بازماندهٔ ارتقا: `pnpm test:docker:upgrade-survivor` tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمیِ آلوده شامل عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، وضعیت کهنهٔ وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. این مسیر به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای provider یا کانال زنده اجرا می‌کند، سپس یک Gateway با loopback راه می‌اندازد و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- آزمون دود بازماندهٔ ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را seed می‌کند، آن baseline را با یک دستورالعمل آماده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway با loopback راه می‌اندازد و intents پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` گسترش دهد، و fixtureهای شبیه issue را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند.
- آزمون دود زمینهٔ runtime نشست: `pnpm test:docker:session-runtime-context` پایداری transcript زمینهٔ runtime پنهان و نیز ترمیم doctor برای شاخه‌های duplicated prompt-rewrite آسیب‌دیده را تأیید می‌کند.
- آزمون دود نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند `openclaw infer image providers --json` به‌جای گیر کردن، providerهای تصویر بسته‌بندی‌شده را برمی‌گرداند. برای استفادهٔ دوباره از tarball ازپیش‌ساخته، `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` را به‌کار ببرید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- آزمون دود Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را بین containerهای root، update و direct-npm خود به‌اشتراک می‌گذارد. آزمون دود update پیش از ارتقا به tarball کاندید، به‌طور پیش‌فرض از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` در workflow مربوط به Install Smoke بازنویسی کنید. بررسی‌های نصب‌کنندهٔ غیر-root یک cache ایزولهٔ npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب محلی کاربر را پنهان نکنند. برای استفادهٔ دوباره از cache مربوط به root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI به‌روزرسانی تکراری direct-npm سراسری را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون دود CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزولهٔ container seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. از تصویر install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- آزمون دود snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E سورس به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای پیوند، عناصر قابل کلیک ارتقایافته با cursor، ارجاع‌های iframe و metadata فریم هستند.
- regression حداقل reasoning برای OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema مربوط به provider را اجبار می‌کند و بررسی می‌کند جزئیات خام در logهای Gateway ظاهر شود.
- پل کانال MCP (Gateway seedشده + پل stdio + آزمون دود فریم notification خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بستهٔ Pi (سرور stdio MCP واقعی + آزمون دود allow/deny برای پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند stdio MCP پس از اجراهای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض بسته/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون دود به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون دود metadata بارگذاری مجدد config: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد.

برای پیش‌ساختن و استفادهٔ دوبارهٔ دستی از تصویر functional مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر مخصوص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان هنگام تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره کند، اگر آن تصویر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامهٔ ساخته‌شدهٔ مشترک، رفتار بسته/نصب را اعتبارسنجی می‌کنند.

runnerهای Docker مدل زنده همچنین checkout فعلی را به‌صورت read-only bind-mount می‌کنند و آن را در یک workdir موقت داخل container stage می‌کنند. این کار تصویر runtime را کم‌حجم نگه می‌دارد، درحالی‌که Vitest همچنان روی سورس/config دقیق محلی شما اجرا می‌شود. مرحلهٔ staging از cacheهای بزرگِ فقط محلی و خروجی‌های build برنامه مانند `.pnpm-store`، `.worktrees`، `__openclaw_vitest__` و دایرکتوری‌های خروجی `.build` محلی برنامه یا Gradle عبور می‌کند تا اجراهای live در Docker چند دقیقه صرف کپی artifactهای وابسته به ماشین نکنند. آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زندهٔ gateway، workerهای واقعی کانال Telegram/Discord/و غیره را داخل container شروع نکنند. `test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زندهٔ gateway را در آن مسیر Docker محدود یا حذف کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز عبور دهید. `test:docker:openwebui` یک آزمون دود سازگاری سطح بالاتر است: یک container gateway متعلق به OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال راه‌اندازی می‌کند، یک container سنجاق‌شدهٔ Open WebUI را در برابر آن gateway شروع می‌کند، از طریق Open WebUI وارد می‌شود، تأیید می‌کند `/api/models`، `openclaw/default` را ارائه می‌کند، سپس یک درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI می‌فرستد. اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم داشته باشد تصویر Open WebUI را pull کند و Open WebUI نیز ممکن است لازم داشته باشد راه‌اندازی cold-start خودش را کامل کند. این مسیر انتظار یک کلید مدل زندهٔ قابل استفاده دارد، و `OPENCLAW_PROFILE_FILE` (`~/.profile` به‌طور پیش‌فرض) راه اصلی فراهم کردن آن در اجراهای Dockerized است. اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model": "openclaw/default", ... }` چاپ می‌کنند. `test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی Telegram، Discord یا iMessage نیاز ندارد. این مسیر یک container Gateway seedشده را boot می‌کند، container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمهٔ routed، خواندن transcript، metadata پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و notificationهای کانال + مجوز به سبک Claude را از طریق پل واقعی stdio MCP تأیید می‌کند. بررسی notification فریم‌های خام stdio MCP را مستقیماً بازرسی می‌کند تا آزمون دود آنچه را که bridge واقعاً منتشر می‌کند اعتبارسنجی کند، نه فقط آنچه یک SDK کلاینت خاص به‌طور اتفاقی ارائه می‌دهد. `test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد. این مسیر تصویر Docker repo را می‌سازد، یک سرور probe واقعی stdio MCP را داخل container راه‌اندازی می‌کند، آن سرور را از طریق runtime بستهٔ MCP تعبیه‌شدهٔ Pi materialize می‌کند، ابزار را اجرا می‌کند، سپس تأیید می‌کند `coding` و `messaging` ابزارهای `bundle-mcp` را نگه می‌دارند، درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند. `test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد. این مسیر یک Gateway seedشده را با یک سرور probe واقعی stdio MCP شروع می‌کند، یک نوبت cron ایزوله و یک نوبت فرزند یک‌بارهٔ `/subagents spawn` را اجرا می‌کند، سپس تأیید می‌کند فرایند فرزند MCP پس از هر اجرا خارج می‌شود.

آزمون دود دستی thread زبان سادهٔ ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این اسکریپت را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی مسیریابی thread در ACP لازم شود، بنابراین آن را حذف نکنید.

متغیرهای env مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount شده است
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount شده است
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount شده و پیش از اجرای تست‌ها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای راستی‌آزمایی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای احراز هویت CLI خارجی
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های CLI کش‌شده داخل Docker روی `/home/node/.npm-global` mount شده است
- دایرکتوری‌ها/فایل‌های احراز هویت CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع تست‌ها در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - اجراهای محدودشده‌ی ارائه‌دهنده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنتاج شده‌اند mount می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست جداشده با کاما مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدودکردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلترکردن ارائه‌دهنده‌ها درون کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده‌ی مجدد از یک image موجود `openclaw:local-live` برای اجراهای دوباره‌ای که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke مربوط به Open WebUI در معرض استفاده قرار می‌دهد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که توسط smoke مربوط به Open WebUI استفاده می‌شود
- `OPENWEBUI_IMAGE=...` برای override کردن تگ image پین‌شده‌ی Open WebUI

## بررسی سلامت مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## رگرسیون آفلاین (ایمن برای CI)

این‌ها رگرسیون‌های «pipeline واقعی» بدون ارائه‌دهنده‌های واقعی هستند:

- فراخوانی ابزار Gateway (OpenAI mock، Gateway واقعی + حلقه‌ی agent): `src/gateway/gateway.test.ts` (مورد: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- ویزارد Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اعمال احراز هویت): `src/gateway/gateway.test.ts` (مورد: "runs wizard over ws and writes auth token config")

## ارزیابی‌های قابلیت اطمینان agentها (Skills)

ما از قبل چند تست ایمن برای CI داریم که مانند «ارزیابی‌های قابلیت اطمینان agent» رفتار می‌کنند:

- فراخوانی ابزار mock از طریق Gateway واقعی + حلقه‌ی agent (`src/gateway/gateway.test.ts`).
- جریان‌های ویزارد end-to-end که اتصال session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

آنچه هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skillها در prompt فهرست شده‌اند، آیا agent skill درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **انطباق:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و گام‌ها/آرگومان‌های لازم را دنبال می‌کند؟
- **قراردادهای گردش‌کار:** سناریوهای چندمرحله‌ای که ترتیب ابزارها، انتقال تاریخچه‌ی session، و مرزهای sandbox را assert می‌کنند.

ارزیابی‌های آینده باید ابتدا deterministic بمانند:

- یک scenario runner با استفاده از ارائه‌دهنده‌های mock برای assert کردن فراخوانی ابزارها + ترتیب، خواندن فایل skill، و اتصال session.
- یک مجموعه‌ی کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- ارزیابی‌های live اختیاری (opt-in، env-gated) فقط پس از آماده‌شدن مجموعه‌ی ایمن برای CI.

## تست‌های قرارداد (شکل Plugin و کانال)

تست‌های قرارداد راستی‌آزمایی می‌کنند که هر Plugin و کانال ثبت‌شده با
قرارداد interface خود سازگار است. آن‌ها روی همه‌ی Pluginهای کشف‌شده پیمایش می‌کنند و مجموعه‌ای از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های seam مشترک و smoke را رد می‌کند؛ وقتی سطح‌های مشترک کانال یا ارائه‌دهنده را تغییر می‌دهید، دستورهای قرارداد را صریحاً
اجرا کنید.

### دستورها

- همه‌ی قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای ارائه‌دهنده: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه‌ی Plugin (id، name، capabilities)
- **setup** - قرارداد ویزارد setup
- **session-binding** - رفتار اتصال session
- **outbound-payload** - ساختار payload پیام
- **inbound** - رسیدگی به پیام inbound
- **actions** - handlerهای action کانال
- **threading** - رسیدگی به thread ID
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال سیاست گروه

### قراردادهای وضعیت ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت کانال
- **registry** - شکل registry Plugin

### قراردادهای ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - قرارداد جریان احراز هویت
- **auth-choice** - انتخاب/گزینش احراز هویت
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime ارائه‌دهنده
- **shape** - شکل/interface Plugin
- **wizard** - ویزارد setup

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک کانال یا Plugin ارائه‌دهنده
- پس از refactor کردن ثبت یا کشف Plugin

تست‌های قرارداد در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن رگرسیون‌ها (راهنما)

وقتی مسئله‌ای مربوط به ارائه‌دهنده/مدل را که در live کشف شده رفع می‌کنید:

- در صورت امکان یک رگرسیون ایمن برای CI اضافه کنید (ارائه‌دهنده‌ی mock/stub، یا capture کردن transformation دقیق شکل request)
- اگر ذاتاً فقط live است (rate limitها، سیاست‌های احراز هویت)، تست live را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/بازپخش request ارائه‌دهنده → تست مستقیم مدل‌ها
  - bug مربوط به pipeline session/history/tool در Gateway → smoke live Gateway یا تست mock Gateway ایمن برای CI
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` برای هر کلاس SecretRef از metadata رجیستری (`listSecretTargetRegistryEntries()`) یک target نمونه استخراج می‌کند، سپس assert می‌کند exec idهای دارای traversal segment رد می‌شوند.
  - اگر یک خانواده‌ی target جدید `includeInPlan` برای SecretRef در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن تست به‌روزرسانی کنید. این تست عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا کلاس‌های جدید بی‌صدا نادیده گرفته نشوند.

## مرتبط

- [تست live](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
