---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای اشکال‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمون: مجموعه‌های آزمون واحد/سرتاسری/زنده، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمون
x-i18n:
    generated_at: "2026-05-10T19:48:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعهٔ Vitest دارد (واحد/یکپارچه‌سازی، e2e، live) و مجموعهٔ کوچکی
از اجراکننده‌های Docker. این سند راهنمای «چگونه تست می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و چه چیزهایی را عمداً پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج چه دستورهایی را اجرا کنید (محلی، پیش از پوش، اشکال‌زدایی).
- تست‌های live چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهندگان را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده رگرسیون اضافه کنید.

<Note>
**پشتهٔ QA‏ (qa-lab، qa-channel، مسیرهای حمل‌ونقل live)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - معماری، سطح دستورها، نوشتن سناریو.
- [Matrix QA](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) - Plugin حمل‌ونقل مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های تست معمولی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژهٔ QA در پایین ([اجراکننده‌های ویژهٔ QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (مورد انتظار پیش از پوش): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعهٔ تست روی یک ماشین جادار: `pnpm test:max`
- حلقهٔ مستقیم Vitest watch: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA با پشتوانهٔ Docker: `pnpm qa:lab:up`
- مسیر QA با پشتوانهٔ ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی تست‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعهٔ E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهندگان/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعهٔ live (مدل‌ها + کاوشگرهای ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری آرام یک فایل live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace مربوط به Kova ارسال کنید. اجراهای زمان‌بندی‌شدهٔ روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، مصنوعات مسیرهای ارائه‌دهندهٔ ساختگی، پروفایل عمیق، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش ارائه‌دهندهٔ ساختگی همچنین شامل اعداد سطح منبع برای راه‌اندازی Gateway، حافظه،
  فشار Plugin، حلقهٔ سلام مدل ساختگی تکرارشونده، و شروع CLI است.
- پیمایش مدل live در Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوهٔ یک کاوشگر کوچک به سبک خواندن فایل را اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، کاوشگرهای اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار قابل استفادهٔ مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل کارهای ماتریسی جداگانهٔ مدل live در Docker
    است که بر اساس ارائه‌دهنده شارد شده‌اند.
  - برای اجرای دوبارهٔ متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)` را با
    `include_live_suites: true` و `live_models_only: true` ارسال کنید.
  - رازهای جدید و پرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوهٔ `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- دودتست چت متصل بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر live در Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    به‌جای ACP از مسیر اتصال بومی Plugin عبور می‌کنند.
- دودتست مهار app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق مهار app-server مربوط به Codex که مالکیت آن با Plugin است اجرا می‌کند،
    `/codex status` و `/codex models` را تأیید می‌کند، و به‌صورت پیش‌فرض کاوشگرهای تصویر،
    Cron MCP، زیرعامل، و Guardian را تمرین می‌دهد. هنگام جداسازی شکست‌های دیگر app-server مربوط به Codex،
    کاوشگر زیرعامل را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز زیرعامل، کاوشگرهای دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این دستور پس از کاوشگر زیرعامل خارج می‌شود، مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- دودتست نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - تاربال بسته‌بندی‌شدهٔ OpenClaw را در Docker نصب می‌کند، فرایند راه‌اندازی کلید API مربوط به OpenAI را اجرا می‌کند،
    و تأیید می‌کند که Plugin مربوط به Codex به‌علاوهٔ وابستگی `@openai/codex`
    بنا بر درخواست در ریشهٔ npm مدیریت‌شده دانلود شده‌اند.
- دودتست وابستگی ابزار Plugin live: `pnpm test:docker:live-plugin-tool`
  - یک Plugin فیکسچر با وابستگی واقعی `slugify` بسته‌بندی می‌کند، آن را از طریق
    `npm-pack:` نصب می‌کند، وابستگی را زیر ریشهٔ npm مدیریت‌شده تأیید می‌کند، سپس از یک
    مدل OpenAI live می‌خواهد ابزار Plugin را فراخوانی کند و slug پنهان را برگرداند.
- دودتست دستور نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و چندلایه برای سطح دستور نجات کانال پیام.
    این تست `/crestodian status` را تمرین می‌دهد، یک تغییر پایدار مدل را صف می‌کند،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تأیید می‌کند.
- دودتست برنامه‌ریز Crestodian در Docker: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک CLI ساختگی Claude روی `PATH`
    اجرا می‌کند و تأیید می‌کند که عقب‌گرد برنامه‌ریز فازی به یک نوشتن پیکربندی تایپ‌شده و حسابرسی‌شده
    ترجمه می‌شود.
- دودتست اولین اجرای Crestodian در Docker: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خالی را به
    Crestodian مسیریابی می‌کند، setup/model/agent/Plugin مربوط به Discord + نوشتن‌های SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های حسابرسی را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- دودتست هزینهٔ Moonshot/Kimi: با تنظیم بودن `MOONSHOT_API_KEY`، دستور
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید که JSON، Moonshot/K2.6 را گزارش می‌کند و
  رونوشت دستیار، `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، ترجیح دهید تست‌های live را از طریق متغیرهای محیطی allowlist که پایین‌تر توضیح داده شده‌اند محدود کنید.
</Tip>

## اجراکننده‌های ویژهٔ QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این دستورها کنار مجموعه‌های تست اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری عاملی زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه در یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض،
soak کامل live/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ نمایهٔ
`full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از ارسال دستی با مسیر برابری ساختگی، مسیر Matrix live،
مسیر Telegram live مدیریت‌شده با Convex، و مسیر Discord live مدیریت‌شده با Convex
به‌عنوان کارهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صراحتاً پاس می‌دهند، درحالی‌که مقدار پیش‌فرض CLI مربوط به Matrix و ورودی گردش‌کار دستی
همچنان `all` است؛ ارسال دستی می‌تواند `all` را به کارهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` شارد کند. `OpenClaw Release
Checks` پیش از تأیید انتشار، برابری به‌علاوهٔ مسیرهای سریع Matrix و Telegram را اجرا می‌کند
و برای بررسی‌های حمل‌ونقل انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی معمول Plugin ارائه‌دهنده اجتناب کنند. این Gatewayهای حمل‌ونقل live،
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های برابری QA
پوشش داده می‌شود.

شاردهای رسانهٔ live مربوط به انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. شاردهای مدل/بک‌اند live در Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که برای هر کامیت انتخاب‌شده
یک‌بار ساخته می‌شود، سپس به‌جای ساخت دوباره داخل هر شارد، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` دریافت می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتیبانی‌شده توسط repo را مستقیما روی میزبان اجرا می‌کند.
  - به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی با workerهای
    Gateway ایزوله اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض هم‌روندی 4 دارد
    (محدود به تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از
    `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر از
    `--concurrency 1` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی artifactها را
    بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های provider یعنی `live-frontier`، `mock-openai` و `aimock`
    پشتیبانی می‌کند. `aimock` یک سرور provider محلی پشتیبانی‌شده با AIMock را
    برای پوشش آزمایشی fixture و protocol-mock راه‌اندازی می‌کند، بدون اینکه
    مسیر آگاه از سناریوی `mock-openai` را جایگزین کند.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون سخت زنده Plugin Kitchen Sink مربوط به OpenAI را از طریق QA Lab اجرا
    می‌کند. بسته خارجی Kitchen Sink را نصب می‌کند، فهرست سطح plugin SDK را
    بررسی می‌کند، `/healthz` و `/readyz` را probe می‌کند، شواهد CPU/RSS مربوط
    به Gateway را ثبت می‌کند، یک نوبت زنده OpenAI را اجرا می‌کند، و diagnostics
    خصمانه را بررسی می‌کند. به احراز هویت زنده OpenAI مثل `OPENAI_API_KEY`
    نیاز دارد. در نشست‌های Testbox آماده‌شده، وقتی helper
    `openclaw-testbox-env` حاضر باشد، profile احراز هویت زنده Testbox را
    خودکار source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - bench راه‌اندازی Gateway به‌علاوه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU
    را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهده‌های CPU داغ پایدار را flag می‌کند
    (`--cpu-core-warn` به‌علاوه `--hot-wall-warn-ms`)، بنابراین burstهای کوتاه
    راه‌اندازی به‌عنوان metric ثبت می‌شوند، بدون اینکه شبیه regression چنددقیقه‌ای
    قفل‌شدن Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout خروجی runtime
    تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکس یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را که `qa suite` روی میزبان دارد حفظ می‌کند.
  - همان flagهای انتخاب provider/model را که `qa suite` دارد دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های پشتیبانی‌شده احراز هویت QA را که برای guest عملی هستند
    forward می‌کنند: کلیدهای provider مبتنی بر env، مسیر config provider زنده QA،
    و `CODEX_HOME` وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه repo بمانند تا guest بتواند از طریق workspace
    mount‌شده بنویسد.
  - گزارش و خلاصه عادی QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA پشتیبانی‌شده با Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی با API key مربوط به OpenAI را اجرا
    می‌کند، به‌صورت پیش‌فرض Telegram را پیکربندی می‌کند، بررسی می‌کند runtime
    بسته‌بندی‌شده plugin بدون repair وابستگی در زمان راه‌اندازی بارگذاری می‌شود،
    doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر endpoint mock‌شده
    OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker با اپ ساخته‌شده را برای transcriptهای context runtime
    تعبیه‌شده اجرا می‌کند. بررسی می‌کند context پنهان runtime مربوط به OpenClaw
    به‌عنوان یک پیام custom غیرنمایشی persist می‌شود، به‌جای اینکه به نوبت قابل
    مشاهده کاربر leak کند، سپس یک JSONL نشست خراب متاثر را seed می‌کند و بررسی
    می‌کند `openclaw doctor --fix` آن را با یک backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک candidate بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده
    را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر
    QA زنده Telegram را با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده
    می‌کند.
  - wrapper فقط منبع harness مربوط به `qa-lab` را از checkout mount می‌کند؛ بسته
    نصب‌شده مالک `dist`، `openclaw/plugin-sdk` و runtime بسته‌بندی‌شده plugin
    است تا این مسیر pluginهای checkout فعلی را با بسته تحت آزمون مخلوط نکند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای
    آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به
    Convex مانند `pnpm openclaw qa telegram` استفاده می‌کند. برای automation
    مربوط به CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` به‌علاوه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند، wrapper
    Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install با Docker، env credential مربوط به Telegram
    یا Convex را روی میزبان validate می‌کند. فقط وقتی عمدا در حال debug کردن
    setup پیش از credential هستید، `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` مقدار مشترک
    `OPENCLAW_QA_CREDENTIAL_ROLE` را فقط برای این مسیر override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این workflow
    از محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول به‌صورت side-run
  در برابر یک بسته candidate ارائه می‌کند. یک ref قابل اعتماد، spec منتشرشده npm،
  URL tarball HTTPS به‌علاوه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند،
  سپس scheduler موجود Docker E2E را با profileهای مسیر smoke، package، product،
  full یا custom اجرا می‌کند. برای اجرای workflow مربوط به Telegram QA در برابر
  همان artifact با نام `package-under-test`، `telegram_mode=mock-openai` یا
  `live-frontier` را تنظیم کنید.
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

- اثبات artifact یک artifact tarball را از اجرای Actions دیگر دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و install می‌کند، Gateway را با OpenAI
    پیکربندی‌شده راه‌اندازی می‌کند، سپس channel/pluginهای bundled را از طریق
    ویرایش config فعال می‌کند.
  - بررسی می‌کند discovery setup، pluginهای دانلودشدنی پیکربندی‌نشده را غایب
    باقی می‌گذارد، نخستین repair پیکربندی‌شده doctor هر plugin دانلودشدنی
    غایب را صراحتا نصب می‌کند، و restart دوم repair وابستگی پنهان را اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر شناخته‌شده npm را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>`، Telegram را فعال می‌کند، و بررسی می‌کند
    doctor پس از update مربوط به candidate بقایای وابستگی legacy plugin را بدون
    repair postinstall از سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی نصب بسته‌بندی‌شده native را در guestهای Parallels اجرا
    می‌کند. هر platform انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند،
    سپس دستور نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و نسخه
    نصب‌شده، وضعیت update، آماده‌بودن Gateway، و یک نوبت agent محلی را بررسی می‌کند.
  - هنگام iteration روی یک guest، از `--platform macos`، `--platform windows` یا
    `--platform linux` استفاده کنید. برای مسیر artifact خلاصه و وضعیت هر مسیر
    از `--json` استفاده کنید.
  - مسیر OpenAI به‌صورت پیش‌فرض برای اثبات نوبت agent زنده از `openai/gpt-5.5`
    استفاده می‌کند. وقتی عمدا مدل OpenAI دیگری را validate می‌کنید،
    `--model <provider/model>` را پاس دهید یا `OPENCLAW_PARALLELS_OPENAI_MODEL`
    را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان wrap کنید تا توقف‌های transport
    مربوط به Parallels نتوانند باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت logهای مسیر nested را زیر `/tmp/openclaw-parallels-npm-update.*`
    می‌نویسد. پیش از فرض کردن hang شدن wrapper بیرونی، `windows-update.log`،
    `macos-update.log` یا `linux-update.log` را inspect کنید.
  - update در Windows می‌تواند روی guest سرد 10 تا 15 دقیقه را در doctor پس از
    update و کار update بسته صرف کند؛ وقتی log debug nested مربوط به npm جلو
    می‌رود، این هنوز سالم است.
  - این wrapper تجمیعی را هم‌زمان با مسیرهای smoke منفرد macOS، Windows یا Linux
    مربوط به Parallels اجرا نکنید. آن‌ها وضعیت VM را share می‌کنند و ممکن است
    در restore کردن snapshot، سرو کردن package، یا وضعیت Gateway در guest با هم
    collide کنند.
  - اثبات پس از update، سطح عادی plugin bundled را اجرا می‌کند، چون facadeهای
    capability مانند speech، image generation و media understanding از طریق
    APIهای runtime bundled بارگذاری می‌شوند، حتی وقتی خود نوبت agent فقط یک
    پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور provider محلی AIMock را برای آزمون smoke مستقیم protocol راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel پشتیبانی‌شده با Docker اجرا می‌کند. فقط checkout منبع - نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، catalog مربوط به profile/scenario، env varها، و چیدمان artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای driver و SUT bot از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - پیش‌فرض‌ها canary، mention gating، command addressing، `/status`، پاسخ‌های bot-to-bot با mention، و پاسخ‌های command native core را پوشش می‌دهند. پیش‌فرض‌های `mock-openai` همچنین regressionهای deterministic reply-chain و streaming پیام نهایی Telegram را پوشش می‌دهند. برای probeهای اختیاری مانند `session_status` از `--list-scenarios` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی artifactها را
    بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، در حالی که SUT bot یک username مربوط به Telegram را ارائه می‌کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک bot گروه را observe کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

`Mantis Telegram Live` wrapper اثبات PR پیرامون این مسیر است. ref مربوط به
candidate را با credentialهای Telegram lease‌شده از Convex اجرا می‌کند، transcript
پیام‌های مشاهده‌شده redacted را در مرورگر desktop مربوط به Crabbox render می‌کند،
شواهد MP4 را ضبط می‌کند، یک GIF motion-trimmed تولید می‌کند، بسته artifact را
upload می‌کند، و وقتی `pr_number` تنظیم شده باشد، از طریق Mantis GitHub App
شواهد inline PR را post می‌کند. Maintainerها می‌توانند آن را از UI مربوط به
Actions از طریق `Mantis Scenario` (`scenario_id:
telegram-live`) یا مستقیما از comment یک pull request شروع کنند:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ Linux در Crabbox را اجاره می‌کند یا دوباره استفاده می‌کند، Telegram Desktop بومی را نصب می‌کند، OpenClaw را با توکن ربات SUT اجاره‌شده Telegram پیکربندی می‌کند، Gateway را شروع می‌کند، و شواهد اسکرین‌شات/MP4 را از دسکتاپ VNC قابل مشاهده ضبط می‌کند.
  - مقدار پیش‌فرض `--credential-source convex` است، بنابراین گردش‌کارها فقط به راز broker در Convex نیاز دارند. از `--credential-source env` با همان متغیرهای `OPENCLAW_QA_TELEGRAM_*` مانند `pnpm openclaw qa telegram` استفاده کنید.
  - Telegram Desktop همچنان به ورود/پروفایل کاربر نیاز دارد. توکن ربات فقط OpenClaw را پیکربندی می‌کند. برای آرشیو پروفایل `.tgz` با base64 از `--telegram-profile-archive-env <name>` استفاده کنید، یا از `--keep-lease` استفاده کنید و یک بار به‌صورت دستی از طریق VNC وارد شوید.
  - `mantis-telegram-desktop-builder-report.md`، `mantis-telegram-desktop-builder-summary.json`، `telegram-desktop-builder.png`، و `telegram-desktop-builder.mp4` را در دایرکتوری خروجی می‌نویسد.

مسیرهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید از مسیر منحرف نشوند؛ ماتریس پوشش هر مسیر در [نمای کلی QA ← پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
QA انتقال زنده فعال باشد، آزمایشگاه QA یک اجاره انحصاری از یک pool مبتنی بر Convex دریافت می‌کند، تا زمانی که مسیر در حال اجراست برای آن اجاره Heartbeat می‌فرستد، و هنگام خاموشی اجاره را آزاد می‌کند. نام این بخش پیش از
پشتیبانی Discord، Slack، و WhatsApp ایجاد شده است؛ قرارداد اجاره بین انواع مختلف مشترک است.

اسکلت پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای محیطی لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک راز برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci` است، در غیر این صورت `maintainer`)

متغیرهای محیطی اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه رهگیری اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با `http://` روی loopback برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات عادی باید از `https://` استفاده کند.

فرمان‌های مدیریتی نگه‌دارنده‌ها (افزودن/حذف/فهرست کردن pool) مشخصا به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، رازهای broker،
پیشوند endpoint، timeout HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر راز بررسی کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و
ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل تلاش دوباره: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - موفقیت: `{ status: "ok", index, data }`
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

شکل payload برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشته عددی شناسه چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای نادرست را رد می‌کند.

شکل payload برای نوع کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId`، و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های hex از SHA-256 باشند.
- `kind: "telegram-user"` نماینده یک حساب burner در Telegram است. با اجاره به‌صورت سراسری برای حساب برخورد کنید: درایور CLI مبتنی بر TDLib و شاهد بصری Telegram Desktop از همان payload بازیابی می‌شوند، و فقط یک job باید در هر زمان اجاره را نگه دارد.

بازیابی اجاره کاربر واقعی Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

وقتی به ضبط بصری نیاز است، از پروفایل Desktop بازیابی‌شده با `Telegram -workdir "$tmp/desktop"` استفاده کنید. در محیط‌های اپراتور محلی، اگر متغیرهای محیطی پردازش وجود نداشته باشند، `scripts/e2e/telegram-user-credential.ts` به‌صورت پیش‌فرض `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` را می‌خواند.

نشست Crabbox هدایت‌شده توسط agent:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` اعتبارنامه `telegram-user` را اجاره می‌کند، همان حساب را در
TDLib و Telegram Desktop روی یک دسکتاپ Linux در Crabbox بازیابی می‌کند، یک Gateway
SUT mock محلی را از checkout فعلی شروع می‌کند، چت قابل مشاهده Telegram را باز می‌کند، ضبط
دسکتاپ را شروع می‌کند، و یک `session.json` خصوصی می‌نویسد. تا وقتی نشست
زنده است، یک agent می‌تواند تا زمان رضایت به آزمایش ادامه دهد:

- `send --session <file> --text <message>` از طریق کاربر واقعی TDLib ارسال می‌کند و منتظر پاسخ SUT می‌ماند.
- `run --session <file> -- <remote command>` یک فرمان دلخواه را روی Crabbox اجرا می‌کند و خروجی آن را ذخیره می‌کند، برای مثال `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` دسکتاپ قابل مشاهده فعلی را ثبت می‌کند.
- `status --session <file>` اجاره و فرمان WebVNC را چاپ می‌کند.
- `finish --session <file>` ضبط‌کننده را متوقف می‌کند، اسکرین‌شات/ویدئو/مصنوعات motion-trim را ثبت می‌کند، اعتبارنامه Convex را آزاد می‌کند، فرایندهای SUT محلی را متوقف می‌کند، و اجاره Crabbox را متوقف می‌کند مگر اینکه `--keep-box` پاس داده شده باشد.
- `publish --session <file> --pr <number>` به‌صورت پیش‌فرض یک کامنت PR فقط شامل GIF منتشر می‌کند. فقط وقتی logها یا مصنوعات JSON عمدا لازم هستند، `--full-artifacts` را پاس دهید.

برای بازتولیدهای بصری قطعی، `--mock-response-file <path>` را به `start`
یا به خلاصه یک‌فرمانی `probe` پاس دهید. runner به‌صورت پیش‌فرض از کلاس استاندارد
Crabbox، ضبط 24fps، پیش‌نمایش‌های GIF حرکتی 24fps، و عرض GIF
برابر با 1920px استفاده می‌کند. فقط وقتی proof به تنظیمات ضبط متفاوت نیاز دارد، با `--class`، `--record-fps`، `--preview-fps`، و
`--preview-width` بازنویسی کنید.

proof یک‌فرمانی Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

فرمان پیش‌فرض `probe` خلاصه‌ای برای یک چرخه start/send/finish است. از
آن برای smoke سریع `/status` استفاده کنید. برای بررسی PR،
کار بازتولید bug، یا هر موردی که agent پیش از تصمیم‌گیری درباره کامل بودن proof به چند دقیقه
آزمایش دلخواه نیاز دارد، از فرمان‌های نشست استفاده کنید. برای
استفاده دوباره از یک اجاره دسکتاپ گرم، `--id <cbx_...>` را به کار ببرید، برای باز نگه داشتن VNC پس از finish از `--keep-box` استفاده کنید،
برای انتخاب چت قابل مشاهده `--desktop-chat-title <name>` را استفاده کنید، و وقتی به جای build کردن TDLib روی
یک box تازه از آرشیو Linux از پیش آماده‌شده `libtdjson.so` استفاده می‌کنید، `--tdlib-url <tgz>`
را به کار ببرید. runner، `--tdlib-url` را با `--tdlib-sha256 <hex>` یا،
به‌صورت پیش‌فرض، با فایل هم‌سطح `<url>.sha256` اعتبارسنجی می‌کند.

payloadهای چندکاناله اعتبارسنجی‌شده توسط broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از pool اجاره بگیرند، اما اعتبارسنجی payload برای Slack در حال حاضر
به‌جای broker در runner QA مربوط به Slack قرار دارد. برای ردیف‌های Slack از
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
استفاده کنید.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده سناریو برای adapterهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam مشترک میزبان `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest مربوط به Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

به مجموعه‌ها به‌عنوان «واقع‌گرایی فزاینده» فکر کنید (و flaky بودن/هزینه فزاینده):

### Unit / integration (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های unit مربوط به UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های unit خالص
  - آزمون‌های integration درون‌فرایندی (auth در Gateway، routing، tooling، parsing، config)
  - رگرسیون‌های قطعی برای bugهای شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده ثابت کنند، نه با
    APIهای source واقعی Pluginهای bundle شده. loadهای API مربوط به Plugin واقعی به
    مجموعه‌های contract/integration تحت مالکیت Plugin تعلق دارند.

سیاست dependency بومی:

- نصب‌های آزمون پیش‌فرض buildهای اختیاری native opus برای Discord را نادیده می‌گیرند. دریافت voice در Discord از decoder خالص JS یعنی `opusscript` استفاده می‌کند، و `@discordjs/opus` در `ignoredBuiltDependencies` می‌ماند تا آزمون‌های محلی و مسیرهای Testbox افزونه native را compile نکنند.
- اگر عمدا لازم است یک build native opus را مقایسه کنید، از یک مسیر اختصاصی performance یا live برای voice در Discord استفاده کنید. `@discordjs/opus` را دوباره به `onlyBuiltDependencies` پیش‌فرض اضافه نکنید؛ این کار باعث می‌شود حلقه‌های install/test نامرتبط کد native را compile کنند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و مسیرهای scoped">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند عظیم بومی پروژه ریشه، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و مانع می‌شود کارهای auto-reply/extension مجموعه‌های نامرتبط را از منابع محروم کنند.
    - `pnpm test --watch` همچنان از گراف پروژه بومی ریشه `vitest.config.ts` استفاده می‌کند، چون یک چرخه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch` و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل راه‌اندازی پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای git تغییریافته را به laneهای scoped کم‌هزینه گسترش می‌دهد: ویرایش مستقیم تست‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح source و وابسته‌های محلی گراف import. ویرایش‌های config/setup/package باعث اجرای گسترده تست‌ها نمی‌شوند مگر اینکه صریحا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه هوشمند عادی بررسی محلی برای کارهای محدود است. این دستور diff را به core، تست‌های core، extensions، تست‌های extension، appها، docs، فراداده release، ابزارهای live Docker و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint و guard متناظر را اجرا می‌کند. این دستور تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌های فقط مربوط به فراداده release، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardی که تغییرات package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness مربوط به Live Docker ACP بررسی‌های متمرکز اجرا می‌کنند: syntax shell برای اسکریپت‌های auth مربوط به live Docker و dry-run زمان‌بند live Docker. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version و سایر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد import-light از agents، commands، plugins، helperهای auto-reply، `plugin-sdk` و نواحی مشابه utility خالص از مسیر lane `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود باقی می‌مانند.
    - فایل‌های source منتخب helper در `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های صریح هم‌جوار در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*` و زیردرخت `src/auto-reply/reply/**` bucketهای اختصاصی دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import، مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط release به نام `agentic-plugins` را رد می‌کند. Full Release Validation برای آن مجموعه‌های سنگین plugin/extension روی release candidateها، workflow فرزند جداگانه `Plugin Prerelease` را dispatch می‌کند.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - وقتی inputهای discovery ابزار پیام یا context runtime مربوط به Compaction را تغییر می‌دهید، هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای خالص routing و normalization، regressionهای متمرکز helper اضافه کنید.
    - مجموعه‌های integration مربوط به runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها بررسی می‌کنند که شناسه‌های scoped و رفتار Compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض از `threads` استفاده می‌کند.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و در پروژه‌های ریشه، e2e و پیکربندی‌های live از runner غیرایزوله استفاده می‌کند.
    - lane ریشه UI تنظیمات `jsdom` و optimizer خودش را حفظ می‌کند، اما آن هم روی runner مشترک غیرایزوله اجرا می‌شود.
    - هر shard مربوط به `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest گزینه `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 هنگام اجراهای محلی بزرگ کاهش یابد.
      برای مقایسه با رفتار V8 استاندارد، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook مربوط به pre-commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck یا تست‌ها را اجرا نمی‌کند.
    - وقتی پیش از handoff یا push به دروازه هوشمند بررسی محلی نیاز دارید، `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیر laneهای scoped کم‌هزینه عبور می‌کند. فقط وقتی agent تصمیم می‌گیرد ویرایش harness، config، package یا contract واقعا به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند، فقط با سقف worker بالاتر.
    - auto-scaling محلی worker عمدا محافظه‌کار است و وقتی میانگین بار host از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر سیم‌کشی تست‌ها درست باقی بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌علاوه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای کل config از مسیر config به‌عنوان key استفاده می‌کنند؛ shardهای CI با include-pattern نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل پیگیری باشند.
    - وقتی یک تست داغ هنوز بیشتر زمانش را در importهای راه‌اندازی صرف می‌کند، dependencyهای سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و به‌جای deep-import کردن helperهای runtime فقط برای عبور دادن آن‌ها از `vi.mock(...)`، همان seam را مستقیم mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed مربوط به `test:changed` را با مسیر بومی پروژه ریشه برای آن diff commitشده مقایسه می‌کند و wall time به‌علاوه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن فهرست فایل‌های تغییر‌یافته از `scripts/test-projects.mjs` و پیکربندی ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` برای overhead راه‌اندازی و transform مربوط به Vitest/Vite یک پروفایل CPU از main-thread می‌نویسد.
    - `pnpm test:perf:profile:runner` برای مجموعه unit، با غیرفعال بودن file parallelism، پروفایل‌های CPU+heap مربوط به runner را می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارا با یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض راه‌اندازی می‌کند
  - churn مصنوعی پیام gateway، memory و payload بزرگ را از مسیر event تشخیصی عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به بسته diagnostic stability را پوشش می‌دهد
  - assert می‌کند recorder محدود باقی می‌ماند، نمونه‌های مصنوعی RSS زیر بودجه فشار می‌مانند، و عمق queue به‌ازای هر session دوباره به صفر تخلیه می‌شود
- انتظارات:
  - مناسب CI و بدون نیاز به key
  - lane محدود برای پیگیری regression پایداری، نه جایگزین مجموعه کامل Gateway

### E2E (smoke Gateway)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با باقی repo.
  - از workerهای تطبیقی استفاده می‌کند (CI: تا 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا overhead مربوط به console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose کنسول.
- دامنه:
  - رفتار end-to-end چند-instance Gateway
  - سطح‌های WebSocket/HTTP، جفت‌سازی node و networking سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به key واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (می‌تواند کندتر باشد)

### E2E: smoke backend OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله OpenShell را روی host از طریق Docker راه‌اندازی می‌کند
  - از یک Dockerfile محلی موقت sandbox می‌سازد
  - backend OpenShell مربوط به OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌کند
  - رفتار filesystem با canonical راه دور را از طریق bridge مربوط به sandbox fs بررسی می‌کند
- انتظارات:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌علاوه daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس test gateway و sandbox را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال کردن تست هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به باینری CLI یا اسکریپت wrapper غیرپیش‌فرض

### Live (providerهای واقعی + modelهای واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های live مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعا _امروز_ با credهای واقعی کار می‌کند؟»
  - گرفتن تغییرات format provider، رفتارهای خاص tool-calling، مشکلات auth و رفتار rate limit
- انتظارات:
  - عمدا CI-stable نیست (networkهای واقعی، policyهای provider واقعی، quotaها، outageها)
  - هزینه دارد / از rate limitها استفاده می‌کند
  - اجرای subsetهای محدود را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای Live از `~/.profile` source می‌کنند تا keyهای API جاافتاده را بردارند.
- به‌طور پیش‌فرض، اجراهای live همچنان `HOME` را ایزوله می‌کنند و material مربوط به config/auth را در یک test home موقت copy می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را mutate کنند.
- فقط وقتی عمدا نیاز دارید تست‌های live از دایرکتوری home واقعی شما استفاده کنند، `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت کم‌صداتری دارد: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما notice اضافی `~/.profile` را suppress می‌کند و logهای bootstrap مربوط به gateway/گفت‌وگوی Bonjour را mute می‌کند. اگر logهای کامل startup را می‌خواهید، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش API key (مختص provider): `*_API_KEYS` را با format comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override مختص live را از طریق `OPENCLAW_LIVE_*_KEY` بدهید؛ تست‌ها روی پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی progress/Heartbeat:
  - مجموعه‌های live اکنون خط‌های progress را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest ساکت است، به‌طور قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های progress مربوط به provider/gateway هنگام اجراهای live فورا stream شوند.
  - Heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- منطق/تست‌های ویرایش: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده» / خرابی‌های خاص provider / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## تست‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، smokeهای بک‌اند CLI، smokeهای ACP، harness
app-server کدکس، و همه تست‌های زنده providerهای رسانه‌ای (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، harness رسانه) - به‌علاوه مدیریت اعتبارنامه برای اجراهای زنده - به
[تست مجموعه‌های زنده](/fa/help/testing-live) مراجعه کنید. برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی Plugin، به
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌صورت پیش‌فرض سقف smoke کوچک‌تری دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` دارد، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` دارد. وقتی صراحتا اسکن جامع بزرگ‌تر را
  می‌خواهید، آن متغیرهای env را override کنید.
- `test:docker:all` تصویر زنده Docker را یک بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت tarball npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکننده Node/Git برای مسیرهای نصب/به‌روزرسانی/وابستگی Plugin است؛ آن مسیرها tarball ازپیش‌ساخته را mount می‌کنند. تصویر عملکردی همان tarball را در `/app` برای مسیرهای عملکرد built-app نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. تجمیع از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای فرایند را کنترل می‌کند، درحالی‌که سقف‌های منابع مانع می‌شوند مسیرهای سنگین زنده، npm-install و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی دوباره ظرفیت فراهم شود، آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ slot،‏ `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`،‏ `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker فضای بیشتری دارد `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌صورت پیش‌فرض یک preflight Docker انجام می‌دهد، containerهای E2E کهنه OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع مسیرهای طولانی‌تر در ابتدا استفاده می‌کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest مسیرهای وزن‌دار بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ برنامه CI مربوط به مسیرهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` gate بومی GitHub برای package است با این پرسش که «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» این gate یک package نامزد را از `source=npm`،‏ `source=ref`،‏ `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` upload می‌کند، سپس مسیرهای قابل استفاده مجدد Docker E2E را در برابر همان tarball دقیق اجرا می‌کند، نه اینکه ref انتخاب‌شده را دوباره بسته‌بندی کند. profileها بر اساس گستردگی مرتب شده‌اند: `smoke`،‏ `package`،‏ `product`، و `full`. برای قرارداد package/به‌روزرسانی/Plugin، ماتریس survivor ارتقای منتشرشده، پیش‌فرض‌های انتشار، و triage خرابی به [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های build و release پس از tsdown،‏ `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این guard گراف static ساخته‌شده را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch فرمان import کند، fail می‌شود؛ همچنین chunk اجرای bundled Gateway را زیر بودجه نگه می‌دارد و importهای static مسیرهای cold شناخته‌شده Gateway را رد می‌کند. smoke بسته‌بندی‌شده CLI همچنین root help، onboard help، doctor help، status، schema پیکربندی، و فرمان model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata مربوط به packageهای shipped را تحمل می‌کند: ورودی‌های حذف‌شده private QA inventory، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و migration metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، آن مسیرها خرابی strict هستند.
- اجراکننده‌های smoke کانتینری: `test:docker:openwebui`،‏ `test:docker:onboard`،‏ `test:docker:npm-onboard-channel-agent`،‏ `test:docker:skill-install`،‏ `test:docker:update-channel-switch`،‏ `test:docker:upgrade-survivor`،‏ `test:docker:published-upgrade-survivor`،‏ `test:docker:session-runtime-context`،‏ `test:docker:agents-delete-shared-workspace`،‏ `test:docker:gateway-network`،‏ `test:docker:browser-cdp-snapshot`،‏ `test:docker:mcp-channels`،‏ `test:docker:pi-bundle-mcp-tools`،‏ `test:docker:cron-mcp-cleanup`،‏ `test:docker:plugins`،‏ `test:docker:plugin-update`،‏ `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را راستی‌آزمایی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط homeهای احراز هویت CLI لازم را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home کانتینر copy می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودآزمایی اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودآزمایی بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودآزمایی هارنس سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودآزمایی مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA برای checkout منبع است. این عمدا بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- دودآزمایی زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودآزمایی راه‌اندازی اولیه/channel/عامل با tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع env به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. از یک tarball از پیش ساخته‌شده با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا channel را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.
- دودآزمایی نصب Skills: `pnpm test:docker:skill-install`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب‌های آرشیو آپلودشده را در پیکربندی غیرفعال می‌کند، slug فعلی Skill زنده ClawHub را از جست‌وجو resolve می‌کند، آن را با `openclaw skills install` نصب می‌کند، و Skill نصب‌شده به‌همراه فراداده مبدا/قفل `.clawhub` را اعتبارسنجی می‌کند.
- دودآزمایی تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کانال پایدارشده و کارکرد پس از به‌روزرسانی Plugin را اعتبارسنجی می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودآزمایی بقای ارتقا: `pnpm test:docker:upgrade-survivor`، tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کثیف کاربر قدیمی با عامل‌ها، پیکربندی channel، allowlistهای Plugin، وضعیت قدیمی وابستگی‌های Plugin، و فایل‌های workspace/session موجود نصب می‌کند. سپس به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده یا channel زنده اجرا می‌کند، سپس یک Gateway از نوع loopback را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- دودآزمایی بقای ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک recipe فرمان baked پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway از نوع loopback را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای issue-شکل را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای repair خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند، tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌همراه `reported-issues` گسترش می‌دهد.
- دودآزمایی زمینه runtime جلسه: `pnpm test:docker:session-runtime-context` پایداری transcript پنهان زمینه runtime به‌همراه repair شاخه‌های تکراری prompt-rewrite آسیب‌دیده توسط doctor را اعتبارسنجی می‌کند.
- دودآزمایی نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و اعتبارسنجی می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، ارائه‌دهنده‌های تصویر bundled را برمی‌گرداند. از یک tarball از پیش ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دودآزمایی Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک کش npm را بین کانتینرهای root، update و direct-npm خود به‌اشتراک می‌گذارد. دودآزمایی update پیش از ارتقا به tarball کاندید، به‌طور پیش‌فرض از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` مربوط به workflow Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده غیر root یک کش npm ایزوله نگه می‌دارند تا ورودی‌های کش متعلق به root، رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از کش root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI به‌روزرسانی سراسری direct-npm تکراری را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودآزمایی CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در یک home کانتینر ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را اعتبارسنجی می‌کند. از تصویر install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودآزمایی snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و اعتبارسنجی می‌کند snapshotهای نقش CDP شامل URLهای link، clickables ارتقایافته با cursor، ارجاع‌های iframe و فراداده frame باشند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، اعتبارسنجی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد شدن schema ارائه‌دهنده را force می‌کند و بررسی می‌کند که جزئیات خام در لاگ‌های Gateway ظاهر شود.
- پل channel مربوط به MCP (Gateway seedشده + پل stdio + دودآزمایی frame اعلان خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور MCP واقعی stdio + دودآزمایی allow/deny پروفایل Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجراهای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودآزمایی نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoisted، refs متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace، و enable/inspect بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا pair پیش‌فرض package/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، تست از یک سرور fixture محلی و hermetic مربوط به ClawHub استفاده می‌کند.
- دودآزمایی به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودآزمایی ماتریس lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix`، tarball بسته‌بندی‌شده OpenClaw را در یک کانتینر خام نصب می‌کند، یک Plugin از npm نصب می‌کند، enable/disable را تغییر می‌دهد، آن را از طریق یک رجیستری npm محلی ارتقا و کاهش نسخه می‌دهد، کد نصب‌شده را حذف می‌کند، سپس اعتبارسنجی می‌کند که uninstall همچنان وضعیت قدیمی را حذف کند و هم‌زمان معیارهای RSS/CPU را برای هر فاز lifecycle ثبت کند.
- دودآزمایی فراداده reload پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` دودآزمایی نصب/به‌روزرسانی را برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoisted، refs متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace و enable/inspect بسته Claude پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر را برای Pluginهای نصب‌شده پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، enable، disable، ارتقا، downgrade و uninstall با کدِ مفقودِ Plugin از npm را همراه با ردیابی منابع پوشش می‌دهد.

برای پیش‌ساخت و استفاده دوباره دستی از تصویر functional مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر ویژه هر suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم، اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره می‌کند، اگر از قبل محلی نباشد اسکریپت‌ها آن را pull می‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون رفتار بسته/نصب را اعتبارسنجی می‌کنند نه runtime برنامه ساخته‌شده مشترک.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را درون container در یک workdir موقت آماده‌سازی می‌کنند. این کار تصویر runtime را
کم‌حجم نگه می‌دارد، درحالی‌که همچنان Vitest را روی دقیقاً همان source/config محلی شما اجرا می‌کند.
مرحله آماده‌سازی، cacheهای بزرگِ فقط محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلیِ برنامه یا
Gradle را رد می‌کند تا اجرای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای وابسته به ماشین نکند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده gateway، workerهای واقعی channel مربوط به
Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است coverage زنده Gateway را از آن lane Docker
محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را هم عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container مربوط به OpenClaw gateway را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container پین‌شده Open WebUI را در برابر آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models`، `openclaw/default` را ارائه می‌دهد، سپس یک
درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI ارسال می‌کند.
برای checkهای CI مسیر release که باید بعد از ورود به Open WebUI و کشف model متوقف شوند،
بدون منتظر ماندن برای تکمیل مدل زنده،
`OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم داشته باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم داشته باشد setup شروع سرد خودش را کامل کند.
این lane به یک کلید مدل زنده قابل استفاده نیاز دارد، و `OPENCLAW_PROFILE_FILE`
(به‌صورت پیش‌فرض `~/.profile`) روش اصلی برای ارائه آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به یک حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. این دستور یک container Gateway بذرگذاری‌شده را boot می‌کند،
container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف گفت‌وگوی route‌شده، خواندن transcript، metadata مربوط به attachment،
رفتار queue رویداد زنده، routing ارسال outbound، و notificationهای channel + permission به سبک Claude را
روی bridge واقعی stdio MCP بررسی می‌کند. check مربوط به notification
frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را validate کند که
bridge واقعاً emit می‌کند، نه فقط چیزی که یک client SDK مشخص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
این دستور image Docker repo را build می‌کند، یک server probe واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime تعبیه‌شده MCP bundle مربوط به Pi
materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging`
toolهای `bundle-mcp` را نگه می‌دارند، درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد.
این دستور یک Gateway بذرگذاری‌شده را با یک server probe واقعی stdio MCP شروع می‌کند، یک
turn جداشده Cron و یک turn فرزند one-shot مربوط به `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند
فرایند فرزند MCP بعد از هر اجرا خارج می‌شود.

Smoke دستی thread زبان ساده ACP (CI نیست):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای validation مربوط به routing thread در ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای testها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های config/workspace موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای installهای cacheشده CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth مربوط به CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها داخل `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند mount می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده دوباره از یک image موجود `openclaw:local-live` برای rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آید (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای smoke مربوط به Open WebUI ارائه می‌دهد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt مربوط به nonce-check که توسط smoke مربوط به Open WebUI استفاده می‌شود
- `OPENWEBUI_IMAGE=...` برای override کردن tag مربوط به image پین‌شده Open WebUI

## sanity مستندات

بعد از ویرایش مستندات، checkهای مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به checkهای heading داخل صفحه هم نیاز دارید، validation کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (امن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- tool calling در Gateway (OpenAI mock، gateway واقعی + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard مربوط به Gateway ‏(WS `wizard.start`/`wizard.next`، config را می‌نویسد + auth enforce می‌شود): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت اطمینان agent (skills)

ما از قبل چند test امن برای CI داریم که مانند «evalهای قابلیت اطمینان agent» رفتار می‌کنند:

- tool-calling با mock از طریق Gateway واقعی + agent loop (`src/gateway/gateway.test.ts`).
- flowهای end-to-end wizard که wiring مربوط به session و effectهای config را validate می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست شده‌اند، آیا agent مهارت درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **پایبندی:** آیا agent پیش از استفاده، `SKILL.md` را می‌خواند و step/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای multi-turn که ترتیب toolها، انتقال تاریخچه session، و مرزهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با استفاده از providerهای mock برای assert کردن tool callها + ترتیب، خواندن فایل skill، و session wiring.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- evalهای زنده اختیاری (opt-in، env-gated) فقط بعد از اینکه suite امن برای CI آماده شد.

## testهای contract (شکل Plugin و channel)

testهای contract بررسی می‌کنند که هر Plugin و channel ثبت‌شده با
interface contract خودش مطابقت دارد. آن‌ها روی همه Pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های smoke و seam مشترک را رد می‌کند؛ وقتی surfaceهای مشترک channel یا provider را تغییر می‌دهید،
commandهای contract را صراحتاً اجرا کنید.

### Commandها

- همه contractها: `pnpm test:contracts`
- فقط contractهای channel: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه Plugin (id، name، capabilities)
- **setup** - contract مربوط به setup wizard
- **session-binding** - رفتار session binding
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام inbound
- **actions** - handlerهای action مربوط به channel
- **threading** - handling شناسه thread
- **directory** - API مربوط به directory/roster
- **group-policy** - enforcement مربوط به group policy

### contractهای وضعیت provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت channel
- **registry** - شکل registry مربوط به Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract مربوط به auth flow
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API مربوط به catalog مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime مربوط به provider
- **shape** - شکل/interface مربوط به Plugin
- **wizard** - setup wizard

### زمان اجرا

- بعد از تغییر exportها یا subpathهای plugin-sdk
- بعد از افزودن یا تغییر یک channel یا provider Plugin
- بعد از refactor کردن registration یا discovery مربوط به Plugin

testهای contract در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- در صورت امکان یک regression امن برای CI اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیحاً کوچک‌ترین layerی را هدف بگیرید که bug را می‌گیرد:
  - bug مربوط به تبدیل/replay درخواست provider → test مستقیم models
  - bug مربوط به session/history/tool pipeline در gateway → smoke زنده gateway یا test mock gateway امن برای CI
- guardrail مربوط به traversal در SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata مربوط به registry (`listSecretTargetRegistryEntries()`) برای هر class از SecretRef یک target نمونه استخراج می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک خانواده target جدید از SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. این test عمداً روی target idهای classifyنشده fail می‌شود تا classهای جدید بی‌صدا skip نشوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
