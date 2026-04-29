---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای خطاهای مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'مجموعه ابزار آزمون: مجموعه‌های واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-04-29T23:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest دارد (واحد/یکپارچه‌سازی، سرتاسری، زنده) و یک مجموعه کوچک
از اجراکننده‌های Docker. این سند راهنمای «چگونه تست می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج کدام فرمان‌ها را اجرا کنید (محلی، پیش از push، اشکال‌زدایی).
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مسائل واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (`qa-lab`، `qa-channel`، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح فرمان، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای متکی به repo از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در پایین ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا اشاره می‌کند.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (انتظار می‌رود پیش از push اجرا شود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی ماشینی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد تکرار می‌کنید، ابتدا اجرای هدفمند را ترجیح دهید.
- سایت QA متکی به Docker: `pnpm qa:lab:up`
- مسیر QA متکی به ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه سرتاسری: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + پروب‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- جاروب مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک پروب کوچک شبیه خواندن فایل اجرا می‌کند.
    مدل‌هایی که metadata آن‌ها ورودی `image` را اعلام می‌کند، یک نوبت تصویری کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، پروب‌های اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار زنده/سرتاسری قابل استفاده مجدد را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی مدل زنده Docker جداگانه
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - secretهای ارائه‌دهنده با سیگنال بالا و جدید را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- smoke گفت‌وگوی bindشده بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را روی مسیر app-server Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را اجرا می‌کند، سپس تایید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از مسیر binding بومی Plugin عبور می‌کنند نه ACP.
- smoke هارنس app-server Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق هارنس app-server Codex متعلق به Plugin اجرا می‌کند،
    `/codex status` و `/codex models` را تایید می‌کند، و به‌صورت پیش‌فرض پروب‌های تصویر،
    MCP کران، زیرعامل، و Guardian را اجرا می‌کند. هنگام جداسازی شکست‌های دیگر app-server
    Codex، پروب زیرعامل را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای یک بررسی متمرکز زیرعامل، پروب‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از پروب زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- smoke فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی opt-in کمربند-و-بند برای سطح فرمان نجات کانال پیام.
    `/crestodian status` را اجرا می‌کند، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تایید می‌کند.
- smoke Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون config با یک CLI جعلی Claude روی `PATH`
    اجرا می‌کند و تایید می‌کند fallback برنامه‌ریز fuzzy به نوشتن config تایپ‌شده و auditشده
    ترجمه می‌شود.
- smoke Docker اجرای اول Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری state خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Plugin Discord + SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند، و ورودی‌های audit را تایید می‌کند. همین مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- smoke هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`،
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  جداگانه را در برابر `moonshot/kimi-k2.6` اجرا کنید. تایید کنید JSON، Moonshot/K2.6 را گزارش می‌کند و
  transcript دستیار، `usage.cost` نرمال‌سازی‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای env allowlist که پایین‌تر توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

این فرمان‌ها وقتی به واقع‌گرایی QA-lab نیاز دارید، کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. `Parity gate` روی PRهای منطبق و
از dispatch دستی با ارائه‌دهنده‌های mock اجرا می‌شود. `QA-Lab - All Lanes` هر شب روی
`main` و از dispatch دستی با mock parity gate، مسیر زنده Matrix،
مسیر زنده Telegram مدیریت‌شده با Convex، و مسیر زنده Discord مدیریت‌شده با Convex به‌صورت
jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix `--profile fast`
را صراحتا پاس می‌دهند، در حالی که مقدار پیش‌فرض CLI ماتریس و ورودی گردش‌کار دستی
همچنان `all` باقی می‌ماند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`، `media`، `e2ee-smoke`،
`e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release Checks` پیش از تایید انتشار،
parity به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از
`mock-openai/gpt-5.5` استفاده می‌کند تا deterministic بمانند
و از راه‌اندازی معمول Plugin ارائه‌دهنده پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های parity QA پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/backend زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک بار برای commit انتخاب‌شده
ساخته می‌شود، سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند به‌جای اینکه
در هر shard دوباره بسازند.

- `pnpm openclaw qa suite`
  - سناریوهای QA متکی به repo را مستقیما روی میزبان اجرا می‌کند.
  - چند سناریوی انتخاب‌شده را به‌صورت پیش‌فرض با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند.
    مقدار پیش‌فرض concurrency برای `qa-channel` برابر 4 است (محدود به تعداد سناریوهای انتخاب‌شده).
    از `--concurrency <count>` برای تنظیم تعداد worker استفاده کنید، یا از `--concurrency 1`
    برای مسیر سریال قدیمی‌تر.
  - وقتی هر سناریویی شکست بخورد، با مقدار غیرصفر خارج می‌شود. وقتی artifactها را
    بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai`، و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی متکی به AIMock را برای پوشش آزمایشی
    fixture و protocol-mock، بدون جایگزین کردن مسیر سناریوآگاه
    `mock-openai`، راه‌اندازی می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway به‌علاوه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه مشاهده CPU ترکیبی
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهدات CPU داغ پایدار را flag می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین burstهای کوتاه راه‌اندازی به‌عنوان metric
    ثبت می‌شوند بدون اینکه شبیه رگرسیون چنددقیقه‌ای peg شدن Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد،
    ابتدا build اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک ماشین مجازی Linux یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مثل `qa suite` روی میزبان حفظ می‌کند.
  - از همان flagهای انتخاب ارائه‌دهنده/مدل مثل `qa suite` استفاده می‌کند.
  - اجراهای زنده ورودی‌های auth پشتیبانی‌شده QA را که برای guest عملی هستند forward می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر config ارائه‌دهنده زنده QA، و `CODEX_HOME`
    وقتی موجود باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه repo بمانند تا guest بتواند از طریق workspace mountشده
    به عقب بنویسد.
  - گزارش + خلاصه معمول QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA متکی به Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند، به‌صورت پیش‌فرض Telegram
    را پیکربندی می‌کند، تایید می‌کند فعال‌سازی Plugin وابستگی‌های runtime را هنگام نیاز نصب می‌کند،
    doctor را اجرا می‌کند، و یک نوبت عامل محلی را در برابر endpoint mockشده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord، از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
    استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای اپ ساخته‌شده درباره transcriptهای runtime context تعبیه‌شده اجرا می‌کند.
    تایید می‌کند runtime context پنهان OpenClaw به‌عنوان یک پیام سفارشی غیرقابل‌نمایش persist می‌شود
    به‌جای اینکه به نوبت کاربر قابل مشاهده leak کند، سپس یک session JSONL خراب متاثر را seed می‌کند و تایید می‌کند
    `openclaw doctor --fix` آن را همراه با backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک کاندیدای بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA زنده Telegram
    را با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید تا به‌جای نصب از registry، یک tarball محلی resolveشده را تست کنید.
  - از همان اعتبارنامه‌های env تلگرام یا منبع اعتبارنامه Convex مثل
    `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` به‌علاوه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI موجود باشند،
    wrapper Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`، مقدار مشترک
    `OPENCLAW_QA_CREDENTIAL_ROLE` را فقط برای این مسیر override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی maintainer
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. گردش‌کار از محیط
    `qa-live-shared` و leaseهای اعتبارنامه CI Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run
  در برابر یک بسته کاندیدا ارائه می‌کند. یک ref قابل اعتماد، spec منتشرشده npm،
  URL tarball HTTPS به‌علاوه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌سازی‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس
  زمان‌بند Docker E2E موجود را با پروفایل‌های مسیر smoke، package، product، full، یا custom
  اجرا می‌کند. `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید تا
  گردش‌کار QA Telegram را در برابر همان artifact `package-under-test` اجرا کند.
  - آخرین اثبات محصول beta:

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

- اثبات Artifact یک مصنوع tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - بیلد فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را
    با پیکربندی OpenAI راه‌اندازی می‌کند، سپس کانال/Pluginهای همراه را از طریق
    ویرایش‌های پیکربندی فعال می‌کند.
  - بررسی می‌کند که کشف راه‌اندازی، وابستگی‌های زمان اجرای Plugin پیکربندی‌نشده را
    غایب باقی می‌گذارد، نخستین اجرای Gateway یا doctor پیکربندی‌شده هر یک از
    وابستگی‌های زمان اجرای Pluginهای همراه را در صورت نیاز نصب می‌کند، و راه‌اندازی مجدد دوم
    وابستگی‌هایی را که قبلا فعال شده‌اند دوباره نصب نمی‌کند.
  - همچنین یک مبنای npm قدیمی شناخته‌شده را نصب می‌کند، Telegram را پیش از اجرای
    `openclaw update --tag <candidate>` فعال می‌کند، و بررسی می‌کند که
    doctor پس از به‌روزرسانیِ کاندید، وابستگی‌های زمان اجرای کانال همراه را بدون
    تعمیر postinstall در سمت harness ترمیم می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی نصب بسته‌بندی‌شده بومی را در مهمان‌های Parallels اجرا می‌کند. هر
    پلتفرم انتخاب‌شده ابتدا بسته مبنای درخواستی را نصب می‌کند، سپس
    دستور نصب‌شده `openclaw update` را در همان مهمان اجرا می‌کند و
    نسخه نصب‌شده، وضعیت به‌روزرسانی، آمادگی Gateway، و یک نوبت عامل محلی را بررسی می‌کند.
  - هنگام تکرار روی یک مهمان از `--platform macos`، `--platform windows` یا `--platform linux` استفاده کنید. برای مسیر Artifact خلاصه و
    وضعیت هر lane از `--json` استفاده کنید.
  - lane مربوط به OpenAI به‌طور پیش‌فرض از `openai/gpt-5.5` برای اثبات زنده
    نوبت عامل استفاده می‌کند. هنگام اعتبارسنجی عمدی یک مدل دیگر
    OpenAI، `--model <provider/model>` را پاس دهید یا
    `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان بپیچید تا توقف‌های انتقال Parallels نتوانند
    باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت لاگ‌های lane تودرتو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از فرض گرفتن گیر کردن wrapper بیرونی، `windows-update.log`، `macos-update.log` یا `linux-update.log`
    را بررسی کنید.
  - به‌روزرسانی Windows روی مهمان سرد می‌تواند ۱۰ تا ۱۵ دقیقه را در تعمیر
    doctor/وابستگی زمان اجرای پس از به‌روزرسانی صرف کند؛ تا زمانی که لاگ debug
    تودرتوی npm در حال پیشروی است، این وضعیت هنوز سالم است.
  - این wrapper تجمیعی را هم‌زمان با laneهای smoke جداگانه Parallels
    برای macOS، Windows یا Linux اجرا نکنید. آن‌ها وضعیت VM مشترک دارند و ممکن است در
    بازگردانی snapshot، سرو کردن package، یا وضعیت Gateway مهمان با هم تداخل کنند.
  - اثبات پس از به‌روزرسانی سطح Plugin همراه معمول را اجرا می‌کند زیرا
    facadeهای قابلیت مانند speech، تولید تصویر، و درک رسانه
    از طریق APIهای runtime همراه بارگذاری می‌شوند، حتی زمانی که خود نوبت عامل
    فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای smoke testing مستقیم protocol راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - lane زنده QA مربوط به Matrix را روی یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط source-checkout — نصب‌های بسته‌بندی‌شده `qa-lab` را ارسال نمی‌کنند.
  - CLI کامل، کاتالوگ profile/scenario، متغیرهای env، و چیدمان Artifact: [QA Matrix](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - lane زنده QA مربوط به Telegram را در برابر یک گروه خصوصی واقعی با استفاده از توکن‌های bot مربوط به driver و SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای ورود به leaseهای pooled مقدار `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر scenario شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    Artifactها را بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در یک گروه خصوصی نیاز دارد، به‌طوری که bot مربوط به SUT یک نام کاربری Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و Artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. scenarioهای پاسخ شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

laneهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید منحرف نشوند؛ ماتریس پوشش هر lane در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری از یک pool مبتنی بر Convex دریافت می‌کند، هنگام اجرای lane برای
آن lease Heartbeat می‌فرستد، و هنگام shutdown آن lease را آزاد می‌کند.

اسکلت پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای env الزامی:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - مقدار پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci`، در غیر این صورت `maintainer`)

متغیرهای env اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` URLهای `http://` Convex روی loopback را برای توسعه فقط محلی مجاز می‌کند.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملکرد عادی از `https://` استفاده کند.

دستورات admin نگه‌دارنده (افزودن/حذف/فهرست‌کردن pool) مشخصا به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای نگه‌دارندگان:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، secretهای broker،
پیشوند endpoint، timeout HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر secret بررسی کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI
از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - اتمام ظرفیت/قابل تلاش دوباره: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - guard مربوط به lease فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته chat id عددی Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدفرم را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های helper مربوط به scenario برای adapterهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: پیاده‌سازی transport runner روی seam میزبان مشترک `qa-lab`، اعلان `qaRunners` در manifest مربوط به Plugin، mount به‌صورت `openclaw qa <runner>`، و نوشتن scenarioها زیر `qa/scenarios/`.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را «واقع‌گرایی افزایشی» در نظر بگیرید (و flakiness/هزینه افزایشی):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shard مربوط به `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، routing، tooling، parsing، config)
  - رگرسیون‌های deterministic برای bugهای شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه
    APIهای source مربوط به Plugin همراه واقعی. بارگذاری API مربوط به Plugin واقعی به
    مجموعه‌های contract/integration متعلق به Plugin تعلق دارد.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای scoped">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند عظیم پروژهٔ ریشهٔ native، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه ماندن مجموعه‌های نامرتبط به‌خاطر کار auto-reply/extension جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژهٔ ریشهٔ native در `vitest.config.ts` استفاده می‌کند، چون یک حلقهٔ watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، پس `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینهٔ کامل راه‌اندازی پروژهٔ ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای git تغییرکرده را به laneهای scoped ارزان گسترش می‌دهد: ویرایش مستقیم تست، فایل‌های sibling `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های local import-graph. ویرایش‌های config/setup/package باعث اجرای گستردهٔ تست‌ها نمی‌شوند مگر اینکه صریحا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` گیت معمول smart local check برای کارهای محدود است. diff را به core، تست‌های core، extensions، تست‌های extension، apps، docs، release metadata، live Docker tooling، و tooling دسته‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌های فقط release metadata، چک‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardای که تغییرات package بیرون از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های live Docker ACP harness چک‌های متمرکز اجرا می‌کنند: shell syntax برای اسکریپت‌های live Docker auth و dry-run برای live Docker scheduler. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و دیگر سطوح package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد import-light از agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و ناحیه‌های مشابه utility خالص از lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود باقی می‌مانند.
    - فایل‌های source کمکی منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های sibling صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش helperها از اجرای دوبارهٔ کل مجموعهٔ سنگین برای آن دایرکتوری پرهیز می‌کند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل دنبالهٔ Node نشود.
    - CI معمول PR/main عمدا batch sweep مربوط به extension و shard فقط-release `agentic-plugins` را رد می‌کند. Full Release Validation، workflow فرزند جداگانهٔ `Plugin Prerelease` را برای آن مجموعه‌های سنگین plugin/extension روی release candidateها dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner تعبیه‌شده">

    - وقتی ورودی‌های discovery ابزار پیام یا context runtime مربوط به Compaction را تغییر می‌دهید، هر دو سطح پوشش را نگه دارید.
    - برای مرزهای pure routing و normalization، regressionهای helper متمرکز اضافه کنید.
    - مجموعه‌های integration مربوط به runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها تأیید می‌کنند که شناسه‌های scoped و رفتار Compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایهٔ Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و در پروژه‌های ریشه، e2e، و پیکربندی‌های live از runner غیر-isolated استفاده می‌کند.
    - lane ریشهٔ UI setup و optimizer مربوط به `jsdom` خودش را نگه می‌دارد، اما آن هم روی runner مشترک غیر-isolated اجرا می‌شود.
    - هر shard از `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest، `--no-maglev` اضافه می‌کند تا churn کامپایل V8 در اجراهای محلی بزرگ کاهش یابد. برای مقایسه با رفتار V8 معمول، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های format‌شده را دوباره stage می‌کند و lint، typecheck، یا تست اجرا نمی‌کند.
    - وقتی به smart local check gate نیاز دارید، پیش از handoff یا push صریحا `pnpm check:changed` را اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای scoped ارزان عبور می‌کند. فقط وقتی agent تصمیم می‌گیرد ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را نگه می‌دارند، فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمدا محافظه‌کار است و وقتی load average میزبان از قبل بالا باشد عقب‌نشینی می‌کند، پس چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایهٔ Vitest، پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر wiring تست درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی performance">

    - `pnpm test:perf:imports` گزارش‌گیری مدت import در Vitest به‌همراه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییرکرده از `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ shardهای CI مبتنی بر include-pattern نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه پیگیری شوند.
    - وقتی یک تست hot هنوز بیشتر زمانش را در importهای راه‌اندازی می‌گذراند، وابستگی‌های سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و به‌جای deep-import کردن runtime helperها صرفا برای عبور دادنشان از `vi.mock(...)`، همان seam را مستقیم mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر route‌شدهٔ `test:changed` را با مسیر native root-project برای آن diff commit‌شده مقایسه می‌کند و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با route کردن فهرست فایل‌های تغییرکرده از طریق `scripts/test-projects.mjs` و پیکربندی ریشهٔ Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک CPU profile مربوط به main-thread برای overhead راه‌اندازی و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` پروفایل‌های CPU+heap مربوط به runner را برای مجموعهٔ unit با parallelism فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارشده به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn پیام gateway، memory، و large-payload مصنوعی را از مسیر event مربوط به diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به diagnostic stability bundle را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجهٔ pressure می‌مانند، و عمق queue هر session دوباره به صفر drain می‌شود
- انتظارات:
  - مناسب CI و بدون نیاز به کلید
  - lane محدود برای پیگیری regression پایداری، نه جایگزین مجموعهٔ کامل Gateway

### E2E (smoke مربوط به gateway)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیهٔ repo.
  - از workerهای adaptive استفاده می‌کند (CI: حداکثر 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا overhead ورودی/خروجی console کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوبارهٔ خروجی verbose console.
- دامنه:
  - رفتار end-to-end مربوط به gateway چند-instance
  - سطوح WebSocket/HTTP، pairing مربوط به node، و networking سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلید واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (ممکن است کندتر باشد)

### E2E: smoke مربوط به backend در OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک gateway ایزولهٔ OpenShell را از طریق Docker روی میزبان شروع می‌کند
  - از یک Dockerfile محلی موقت، sandbox می‌سازد
  - backend مربوط به OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH exercise می‌کند
  - رفتار filesystem با canonical از راه دور را از طریق bridge مربوط به sandbox fs تأیید می‌کند
- انتظارات:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه Docker daemon فعال نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس gateway و sandbox تست را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی تست هنگام اجرای دستی مجموعهٔ گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### Live (providerهای واقعی + modelهای واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های live مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض: توسط `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعا _امروز_ با credentials واقعی کار می‌کند؟»
  - گرفتن تغییرات format provider، ویژگی‌های خاص tool-calling، مشکلات auth، و رفتار rate limit
- انتظارات:
  - عمدا برای CI پایدار نیست (networkهای واقعی، policyهای واقعی provider، quotaها، outageها)
  - هزینه دارد / از rate limitها استفاده می‌کند
  - اجرای subsetهای محدود را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای live برای برداشتن API keyهای گمشده، `~/.profile` را source می‌کنند.
- به‌طور پیش‌فرض، اجراهای live همچنان `HOME` را isolate می‌کنند و material مربوط به config/auth را در یک home موقت تست کپی می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط وقتی عمدا لازم دارید تست‌های live از دایرکتوری home واقعی شما استفاده کنند، `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت آرام‌تری دارد: خروجی progress با قالب `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را suppress می‌کند و logهای gateway bootstrap/Bonjour chatter را mute می‌کند. اگر logهای کامل startup را دوباره می‌خواهید، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش API key (مختص provider): `*_API_KEYS` را با قالب comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override هر live از طریق `OPENCLAW_LIVE_*_KEY`؛ تست‌ها در پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی progress/Heartbeat:
  - مجموعه‌های live اکنون خط‌های progress را به stderr emit می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest ساکت است، آشکارا فعال باشند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های progress مربوط به provider/gateway در طول اجراهای live بلافاصله stream شوند.
  - Heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده» / خرابی‌های مختص provider / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (با تماس شبکه‌ای)

برای ماتریس مدل زنده، smokeهای backend در CLI، smokeهای ACP، harness سرور برنامه Codex، و همه آزمون‌های زنده providerهای رسانه (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدیو، harness رسانه) — به‌علاوه مدیریت credentialها برای اجراهای زنده — [آزمون‌کردن — مجموعه‌های زنده](/fa/help/testing-live) را ببینید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌صورت پیش‌فرض سقف smoke کوچک‌تری دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتا اسکن جامع‌تر و بزرگ‌تر را می‌خواهید، این env varها را override کنید.
- `test:docker:all` تصویر زنده Docker را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار به‌صورت npm tarball از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکننده Node/Git برای laneهای نصب/به‌روزرسانی/وابستگی Plugin است؛ این laneها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای laneهای کارکرد برنامه ساخته‌شده در `/app` نصب می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. aggregate از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` اسلات‌های فرایند را کنترل می‌کند، درحالی‌که سقف‌های منبع مانع می‌شوند laneهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک lane منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی ظرفیت دوباره در دسترس شود آن را به‌تنهایی در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ اسلات، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker ظرفیت بیشتری دارد `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌صورت پیش‌فرض preflight مربوط به Docker را انجام می‌دهد، containerهای قدیمی OpenClaw E2E را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع laneهای طولانی‌تر در ابتدا استفاده می‌کند. برای چاپ manifest وزن‌دار laneها بدون ساختن یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ طرح CI مربوط به laneهای انتخاب‌شده، نیازهای package/image، و credentialها از `node scripts/test-docker-all.mjs --plan-json` استفاده کنید.
- `Package Acceptance` gate بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان محصول کار می‌کند؟» است. این gate یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` upload می‌کند، سپس laneهای Docker E2E قابل‌استفاده‌مجدد را به‌جای بسته‌بندی دوباره ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. `workflow_ref` اسکریپت‌های workflow/harness مورد اعتماد را انتخاب می‌کند، درحالی‌که `package_ref` commit/branch/tag منبع را برای بسته‌بندی هنگام `source=ref` انتخاب می‌کند؛ این اجازه می‌دهد منطق acceptance فعلی commitهای مورد اعتماد قدیمی‌تر را اعتبارسنجی کند. profileها بر اساس گستردگی مرتب شده‌اند: `smoke` نصب/channel/agent سریع به‌همراه gateway/config است، `package` قرارداد package/update/plugin و جایگزین بومی پیش‌فرض برای بیشتر پوشش package/update مربوط به Parallels است، `product` کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI را اضافه می‌کند، و `full` chunkهای Docker مسیر انتشار را با OpenWebUI اجرا می‌کند. اعتبارسنجی انتشار یک package delta سفارشی (`bundled-channel-deps-compat plugins-offline`) به‌علاوه QA package مربوط به Telegram را اجرا می‌کند، چون chunkهای Docker مسیر انتشار از قبل laneهای هم‌پوشان package/update/plugin را پوشش می‌دهند. دستورهای rerun هدفمند Docker در GitHub که از artifactها تولید می‌شوند، در صورت موجود بودن، ورودی‌های artifact بسته قبلی و تصویرهای آماده‌شده را هم شامل می‌شوند تا laneهای ناموفق بتوانند از ساخت دوباره package و imageها پرهیز کنند.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch فرمان import کند fail می‌شود؛ همچنین chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و importهای static مسیرهای Gateway سرد شناخته‌شده را reject می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین root help، onboard help، doctor help، status، config schema، و یک فرمان فهرست مدل‌ها را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط شکاف‌های metadata مربوط به packageهای ship‌شده را تحمل می‌کند: ورودی‌های حذف‌شده inventory خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball، نبود `update.channel` persist‌شده، محل‌های legacy برای install-record مربوط به Plugin، نبود persistence مربوط به install-record در marketplace، و migration مربوط به metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، این مسیرها failureهای strict هستند.
- اجراکننده‌های smoke مربوط به container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای integration سطح بالاتر را verify می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط homeهای احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را به home داخل container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون mutate کردن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودسنجی اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودسنجی پشتانه CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودسنجی هارنس کارساز برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودسنجی مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر بررسی سورس خصوصی QA است. عمداً بخشی از مسیرهای انتشار Docker بسته نیست، زیرا tarball مربوط به npm، QA Lab را حذف می‌کند.
- دودسنجی زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست‌سازی کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودسنجی راه‌اندازی اولیه/کانال/عامل tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع env به‌علاوه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، تأیید می‌کند که doctor وابستگی‌های runtime مربوط به Pluginهای فعال‌شده را ترمیم کرده است، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک tarball ازپیش‌ساخته دوباره استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` بازسازی میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` کانال را عوض کنید.
- دودسنجی تعویض کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` جابه‌جا می‌شود، ماندگاری کانال و کارکرد پس از به‌روزرسانی Plugin را تأیید می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودسنجی زمینه runtime نشست: `pnpm test:docker:session-runtime-context`، ماندگاری transcript زمینه runtime پنهان به‌علاوه ترمیم doctor برای شاخه‌های تکراری بازنویسی prompt آسیب‌دیده را تأیید می‌کند.
- دودسنجی نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh`، درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، ارائه‌دهندگان تصویر بسته‌بندی‌شده را برمی‌گرداند. با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک tarball ازپیش‌ساخته دوباره استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ساخت میزبان را رد کنید، یا با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`، `dist/` را از یک تصویر Docker ساخته‌شده کپی کنید.
- دودسنجی Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh`، یک کش npm را میان کانتینرهای root، update و direct-npm خود به اشتراک می‌گذارد. دودسنجی به‌روزرسانی به‌طور پیش‌فرض از npm `latest` به‌عنوان خط مبنای stable پیش از ارتقا به tarball نامزد استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` در workflow مربوط به Install Smoke آن را بازنویسی کنید. بررسی‌های نصب‌کننده غیر root یک کش npm ایزوله نگه می‌دارند تا ورودی‌های کش متعلق به root رفتار نصب محلی کاربر را پنهان نکنند. برای استفاده دوباره از کش root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI مربوط به Install Smoke با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` به‌روزرسانی سراسری direct-npm تکراری را رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودسنجی CLI حذف فضای کاری مشترک توسط عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک فضای کاری در یک home کانتینری ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌علاوه رفتار نگه‌داشتن فضای کاری را تأیید می‌کند. با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` از تصویر install-smoke دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودسنجی snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E سورس به‌علاوه یک لایه Chromium را می‌سازد، Chromium را با CDP خام آغاز می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند که snapshotهای نقش CDP، URLهای پیوند، عناصر قابل‌کلیک ارتقایافته با cursor، ارجاع‌های iframe و فراداده frame را پوشش می‌دهند.
- رگرسیون reasoning حداقلی web_search مربوط به OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک کارساز OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` بالا می‌برد، سپس رد schema ارائه‌دهنده را اجباری می‌کند و بررسی می‌کند که جزئیات خام در لاگ‌های Gateway ظاهر می‌شود.
- پل کانال MCP (Gateway seed‌شده + پل stdio + دودسنجی frame اعلان خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (کارساز MCP واقعی stdio + دودسنجی allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + جمع‌کردن child مربوط به MCP stdio پس از اجرای cron ایزوله و اجرای one-shot زیرعامل): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودسنجی نصب، نصب/حذف نصب kitchen-sink از ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض package/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک کارساز fixture محلی و hermetic برای ClawHub استفاده می‌کند.
- دودسنجی بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودسنجی فراداده بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- وابستگی‌های runtime مربوط به Plugin بسته‌بندی‌شده: `pnpm test:docker:bundled-channel-deps` به‌طور پیش‌فرض یک تصویر runner کوچک Docker می‌سازد، OpenClaw را یک بار روی میزبان می‌سازد و بسته‌بندی می‌کند، سپس آن tarball را در هر سناریوی نصب Linux mount می‌کند. با `OPENCLAW_SKIP_DOCKER_BUILD=1` از تصویر دوباره استفاده کنید، پس از یک ساخت محلی تازه با `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` بازسازی میزبان را رد کنید، یا با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` به یک tarball موجود اشاره کنید. aggregate کامل Docker و chunkهای bundled-channel مسیر انتشار این tarball را یک بار از پیش بسته‌بندی می‌کنند، سپس بررسی‌های کانال‌های بسته‌بندی‌شده را به مسیرهای مستقل shard می‌کنند، شامل مسیرهای به‌روزرسانی جداگانه برای Telegram، Discord، Slack، Feishu، memory-lancedb و ACPX. chunkهای انتشار، دودسنجی‌های کانال، اهداف به‌روزرسانی، و قراردادهای setup/runtime را به `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-b` و `bundled-channels-contracts` تقسیم می‌کنند؛ chunk تجمیعی `bundled-channels` برای اجرای مجدد دستی همچنان در دسترس است. workflow انتشار همچنین chunkهای نصب‌کننده ارائه‌دهنده و chunkهای نصب/حذف نصب Plugin بسته‌بندی‌شده را تقسیم می‌کند؛ chunkهای قدیمی `package-update`، `plugins-runtime` و `plugins-integrations` به‌عنوان aliasهای تجمیعی برای اجرای مجدد دستی باقی می‌مانند. برای محدود کردن ماتریس کانال هنگام اجرای مستقیم مسیر بسته‌بندی‌شده، از `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` استفاده کنید، یا برای محدود کردن سناریوی به‌روزرسانی از `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` استفاده کنید. اجرای Docker به‌ازای هر سناریو به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` دارد؛ سناریوی به‌روزرسانی چندهدفه به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` دارد. این مسیر همچنین تأیید می‌کند که `channels.<id>.enabled=false` و `plugins.entries.<id>.enabled=false`، ترمیم وابستگی runtime/doctor را سرکوب می‌کنند.
- هنگام تکرار، وابستگی‌های runtime مربوط به Plugin بسته‌بندی‌شده را با غیرفعال کردن سناریوهای نامرتبط محدود کنید، برای مثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

برای ساخت از پیش و استفاده دوباره دستی از تصویر عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر مخصوص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` در صورت تنظیم همچنان اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره می‌کند، اگر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار package/install را اعتبارسنجی می‌کنند.

runnerهای Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را درون کانتینر به یک workdir موقت stage می‌کنند. این کار تصویر runtime را
کم‌حجم نگه می‌دارد، درحالی‌که همچنان Vitest را روی دقیقاً همان source/config محلی شما اجرا می‌کند.
مرحله staging، کش‌های بزرگ فقط‌محلی و خروجی‌های ساخت برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle را رد می‌کند تا اجراهای زنده Docker چند دقیقه صرف کپی کردن
artifactهای مخصوص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده gateway،
workerهای کانال واقعی Telegram/Discord/غیره را داخل کانتینر آغاز نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است
پوشش زنده gateway را از آن مسیر Docker محدود یا حذف کنید، `OPENCLAW_LIVE_GATEWAY_*`
را نیز عبور دهید.
`test:docker:openwebui` یک دودسنجی سازگاری سطح‌بالاتر است: یک
کانتینر gateway مربوط به OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال آغاز می‌کند،
یک کانتینر Open WebUI پین‌شده را در برابر آن gateway آغاز می‌کند، از طریق
Open WebUI وارد می‌شود، تأیید می‌کند که `/api/models` مقدار `openclaw/default` را آشکار می‌کند، سپس یک
درخواست گفت‌وگوی واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI می‌فرستد.
اجرای نخست می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است نیاز داشته باشد تصویر
Open WebUI را pull کند و Open WebUI ممکن است نیاز داشته باشد setup cold-start خودش را تمام کند.
این مسیر یک کلید مدل زنده قابل‌استفاده انتظار دارد، و `OPENCLAW_PROFILE_FILE`
(`~/.profile` به‌طور پیش‌فرض) روش اصلی برای فراهم کردن آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord یا iMessage نیاز ندارد. یک کانتینر Gateway seed‌شده را boot می‌کند،
کانتینر دومی را آغاز می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف گفت‌وگوی route‌شده، خواندن transcript، فراداده attachment،
رفتار صف رویداد زنده، routing ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude
را روی پل واقعی stdio MCP تأیید می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیماً بازرسی می‌کند تا دودسنجی چیزی را اعتبارسنجی کند که
پل واقعاً منتشر می‌کند، نه فقط چیزی که یک SDK مشتری خاص اتفاقاً نمایش می‌دهد.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
تصویر Docker repo را می‌سازد، یک کارساز probe واقعی stdio MCP را
داخل کانتینر آغاز می‌کند، آن کارساز را از طریق runtime بسته MCP تعبیه‌شده Pi
materialize می‌کند، ابزار را اجرا می‌کند، سپس تأیید می‌کند که `coding` و `messaging`
ابزارهای `bundle-mcp` را نگه می‌دارند، درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده
نیاز ندارد. یک Gateway seed‌شده را با یک کارساز probe واقعی stdio MCP آغاز می‌کند، یک
نوبت cron ایزوله و یک نوبت child one-shot مربوط به `/subagents spawn` را اجرا می‌کند، سپس تأیید می‌کند
که فرایند child مربوط به MCP پس از هر اجرا خارج می‌شود.

دودسنجی دستی thread با زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این اسکریپت را برای گردش‌کارهای رگرسیون/اشکال‌زدایی نگه دارید. ممکن است دوباره برای اعتبارسنجی مسیریابی رشته‌های ACP لازم شود، بنابراین آن را حذف نکنید.

متغیرهای محیطی مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` سوار می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` سوار می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` سوار می‌شود و پیش از اجرای آزمون‌ها منبع‌دهی می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای اعتبارسنجی فقط متغیرهای محیطی منبع‌دهی‌شده از `OPENCLAW_PROFILE_FILE`، با استفاده از دایرکتوری‌های پیکربندی/فضای‌کار موقت و بدون سوارسازی احراز هویت CLI خارجی
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های CLI کش‌شده داخل Docker روی `/home/node/.npm-global` سوار می‌شود
- دایرکتوری‌ها/فایل‌های احراز هویت CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` سوار می‌شوند، سپس پیش از شروع آزمون‌ها در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - اجراهای محدودشده به ارائه‌دهنده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند سوار می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست جداشده با ویرگول مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی بازنویسی کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلتر کردن ارائه‌دهندگان داخل کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفادهٔ دوباره از تصویر موجود `openclaw:local-live` در اجراهای مجددی که به بازسازی نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه اعتبارنامه‌ها از انبار پروفایل می‌آیند (نه محیط)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای اسموک Open WebUI در معرض قرار می‌دهد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای بازنویسی پرامپت بررسی nonce که اسموک Open WebUI از آن استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای بازنویسی برچسب تصویر پین‌شدهٔ Open WebUI

## سنجش سلامت مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی‌های سرفصل‌های درون‌صفحه‌ای هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## رگرسیون آفلاین (امن برای CI)

این‌ها رگرسیون‌های «پایپ‌لاین واقعی» بدون ارائه‌دهندگان واقعی هستند:

- فراخوانی ابزار Gateway (OpenAI شبیه‌سازی‌شده، Gateway واقعی + حلقهٔ عامل): `src/gateway/gateway.test.ts` (مورد: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- ویزارد Gateway (WS `wizard.start`/`wizard.next`، نوشتن پیکربندی + اعمال احراز هویت): `src/gateway/gateway.test.ts` (مورد: "runs wizard over ws and writes auth token config")

## ارزیابی‌های قابلیت اعتماد عامل (Skills)

از قبل چند آزمون امن برای CI داریم که مانند «ارزیابی‌های قابلیت اعتماد عامل» رفتار می‌کنند:

- فراخوانی ابزار شبیه‌سازی‌شده از مسیر Gateway واقعی + حلقهٔ عامل (`src/gateway/gateway.test.ts`).
- جریان‌های ویزارد سرتاسری که سیم‌کشی نشست و اثرات پیکربندی را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

آنچه هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی مهارت‌ها در پرامپت فهرست می‌شوند، آیا عامل مهارت درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **انطباق:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و مراحل/آرگومان‌های لازم را دنبال می‌کند؟
- **قراردادهای گردش‌کار:** سناریوهای چندمرحله‌ای که ترتیب ابزارها، انتقال تاریخچهٔ نشست، و مرزهای سندباکس را بررسی می‌کنند.

ارزیابی‌های آینده باید ابتدا قطعی بمانند:

- یک اجراکنندهٔ سناریو با ارائه‌دهندگان شبیه‌سازی‌شده برای بررسی فراخوانی‌های ابزار + ترتیب، خواندن فایل‌های مهارت، و سیم‌کشی نشست.
- یک مجموعهٔ کوچک از سناریوهای متمرکز بر مهارت (استفاده در برابر پرهیز، گیتینگ، تزریق پرامپت).
- ارزیابی‌های زندهٔ اختیاری (با انتخاب صریح، گیت‌شده با متغیرهای محیطی) فقط پس از آماده شدن مجموعهٔ امن برای CI.

## آزمون‌های قراردادی (شکل Plugin و کانال)

آزمون‌های قراردادی اعتبارسنجی می‌کنند که هر Plugin و کانال ثبت‌شده با قرارداد رابط خود سازگار باشد. آن‌ها روی همهٔ Pluginهای کشف‌شده پیمایش می‌کنند و مجموعه‌ای از ادعاهای شکل و رفتار را اجرا می‌کنند. مسیر واحد پیش‌فرض `pnpm test` عمداً این فایل‌های اسموک و درز مشترک را نادیده می‌گیرد؛ وقتی سطوح مشترک کانال یا ارائه‌دهنده را لمس می‌کنید، فرمان‌های قراردادی را صراحتاً اجرا کنید.

### فرمان‌ها

- همهٔ قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای ارائه‌دهنده: `pnpm test:contracts:plugins`

### قراردادهای کانال

واقع در `src/channels/plugins/contracts/*.contract.test.ts`:

- **Plugin** - شکل پایهٔ Plugin (شناسه، نام، قابلیت‌ها)
- **setup** - قرارداد ویزارد راه‌اندازی
- **session-binding** - رفتار اتصال نشست
- **outbound-payload** - ساختار payload پیام
- **inbound** - مدیریت پیام ورودی
- **actions** - هندلرهای کنش کانال
- **threading** - مدیریت شناسهٔ رشته
- **directory** - API دایرکتوری/فهرست اعضا
- **group-policy** - اعمال سیاست گروه

### قراردادهای وضعیت ارائه‌دهنده

واقع در `src/plugins/contracts/*.contract.test.ts`.

- **status** - پروب‌های وضعیت کانال
- **registry** - شکل رجیستری Plugin

### قراردادهای ارائه‌دهنده

واقع در `src/plugins/contracts/*.contract.test.ts`:

- **auth** - قرارداد جریان احراز هویت
- **auth-choice** - انتخاب/گزینش احراز هویت
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - زمان اجرای ارائه‌دهنده
- **shape** - شکل/رابط Plugin
- **wizard** - ویزارد راه‌اندازی

### زمان اجرا

- پس از تغییر exportها یا زیرمسیرهای plugin-sdk
- پس از افزودن یا تغییر یک Plugin کانال یا ارائه‌دهنده
- پس از بازآرایی ثبت یا کشف Plugin

آزمون‌های قراردادی در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن رگرسیون‌ها (راهنما)

وقتی مشکل ارائه‌دهنده/مدلی را که در اجراهای زنده کشف شده اصلاح می‌کنید:

- در صورت امکان یک رگرسیون امن برای CI اضافه کنید (ارائه‌دهندهٔ mock/stub، یا ثبت دقیق تبدیل شکل درخواست)
- اگر ذاتاً فقط زنده است (محدودیت نرخ، سیاست‌های احراز هویت)، آزمون زنده را محدود نگه دارید و با متغیرهای محیطی اختیاری کنید
- کوچک‌ترین لایه‌ای را هدف بگیرید که باگ را می‌گیرد:
  - باگ تبدیل/بازپخش درخواست ارائه‌دهنده → آزمون مستقیم مدل‌ها
  - باگ پایپ‌لاین نشست/تاریخچه/ابزار Gateway → اسموک زندهٔ Gateway یا آزمون mock امن برای CI در Gateway
- گاردریل پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` بر اساس فرادادهٔ رجیستری (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک هدف نمونه استخراج می‌کند، سپس بررسی می‌کند شناسه‌های اجرایی دارای قطعهٔ پیمایشی رد می‌شوند.
  - اگر یک خانوادهٔ هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن آزمون به‌روزرسانی کنید. این آزمون عمداً روی شناسه‌های هدف دسته‌بندی‌نشده شکست می‌خورد تا کلاس‌های جدید بی‌صدا نادیده گرفته نشوند.

## مرتبط

- [آزمون زنده](/fa/help/testing-live)
- [CI](/fa/ci)
