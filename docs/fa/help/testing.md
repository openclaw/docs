---
read_when:
    - اجرای تست‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمون: مجموعه‌های unit/e2e/live، اجراکننده‌های Docker، و اینکه هر آزمون چه چیزی را پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-11T20:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعهٔ Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعهٔ کوچکی
از اجراکننده‌های Docker. این سند راهنمای «ما چگونه تست می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمداً چه چیزهایی را پوشش _نمی‌دهد_).
- برای جریان‌های کاری رایج (محلی، پیش از ارسال، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- تست‌های زنده چگونه اعتبارنامه‌ها را پیدا می‌کنند و مدل‌ها/ارائه‌دهندگان را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشتهٔ تضمین کیفیت (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی تضمین کیفیت](/fa/concepts/qa-e2e-automation) - معماری، سطح فرمان، نگارش سناریو.
- [تضمین کیفیت ماتریسی](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کانال تضمین کیفیت](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که سناریوهای متکی بر مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های تست معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مخصوص تضمین کیفیت در پایین ([اجراکننده‌های مخصوص تضمین کیفیت](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (پیش از ارسال انتظار می‌رود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعهٔ کامل محلی روی ماشینی با منابع کافی: `pnpm test:max`
- چرخهٔ watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک خرابی واحد در حال تکرار هستید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت تضمین کیفیت متکی بر Docker: `pnpm qa:lab:up`
- مسیر تضمین کیفیت متکی بر ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی تست‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعهٔ E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهندگان/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعهٔ زنده (مدل‌ها + کاوش‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌سروصدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های کارایی زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای آرتیفکت‌های CPU/heap/trace مربوط به Kova اجرا کنید. اجراهای زمان‌بندی‌شدهٔ روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، آرتیفکت‌های مسیر mock-provider، deep-profile و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش mock-provider همچنین شامل اعداد راه‌اندازی Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقهٔ سلام تکراری fake-model و شروع CLI است.
- جاروب مدل زندهٔ Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوهٔ یک کاوش کوچک به سبک خواندن فایل را اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام ایزوله‌کردن خرابی‌های ارائه‌دهنده، کاوش‌های اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش یکپارچه‌سازی پیوسته: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار قابل‌استفادهٔ مجدد زنده/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند که شامل jobهای ماتریس مدل زندهٔ Docker جداگانه است که بر اساس ارائه‌دهنده شارد شده‌اند.
  - برای اجرای دوبارهٔ متمرکز در یکپارچه‌سازی پیوسته، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` اجرا کنید.
  - رازهای ارائه‌دهندهٔ جدید و پُرسیگنال را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوهٔ `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- دودسنجی گفت‌وگوی متصل بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زندهٔ Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک پیام مستقیم مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    به‌جای ACP از مسیر اتصال Plugin بومی عبور می‌کنند.
- دودسنجی هارنس app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از هارنس app-server مربوط به Codex که مالکیتش با Plugin است عبور می‌دهد،
    `/codex status` و `/codex models` را تأیید می‌کند و به‌صورت پیش‌فرض تصویر،
    cron MCP، زیرعامل و کاوش‌های Guardian را تمرین می‌دهد. هنگام ایزوله‌کردن سایر خرابی‌های app-server مربوط به Codex،
    کاوش زیرعامل را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز زیرعامل، کاوش‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از کاوش زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- دودسنجی نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - tarball بسته‌بندی‌شدهٔ OpenClaw را در Docker نصب می‌کند، راه‌اندازی با کلید API مربوط به OpenAI را اجرا می‌کند،
    و تأیید می‌کند که Plugin مربوط به Codex به‌علاوهٔ وابستگی `@openai/codex`
    برحسب تقاضا در ریشهٔ npm مدیریت‌شده دانلود شده‌اند.
- دودسنجی وابستگی ابزار Plugin زنده: `pnpm test:docker:live-plugin-tool`
  - یک Plugin fixture با وابستگی واقعی `slugify` را بسته‌بندی می‌کند، آن را از طریق
    `npm-pack:` نصب می‌کند، وابستگی را زیر ریشهٔ npm مدیریت‌شده تأیید می‌کند، سپس از یک
    مدل زندهٔ OpenAI می‌خواهد ابزار Plugin را فراخوانی کند و slug پنهان را برگرداند.
- دودسنجی فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی انتخابی و چندلایه برای سطح فرمان نجات کانال پیام.
    `/crestodian status` را تمرین می‌دهد، یک تغییر ماندگار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تأیید می‌کند.
- دودسنجی Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک CLI جعلی Claude روی `PATH`
    اجرا می‌کند و تأیید می‌کند که fallback برنامه‌ریز فازی به یک نوشتن پیکربندی تایپ‌شده و auditشده تبدیل می‌شود.
- دودسنجی Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Plugin مربوط به Discord + SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند و ورودی‌های audit را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0 در QA Lab هم با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- دودسنجی هزینهٔ Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید که JSON گزارش Moonshot/K2.6 را نشان می‌دهد و
  رونوشت دستیار، `usage.cost` نرمال‌سازی‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد خراب نیاز دارید، محدودکردن تست‌های زنده از طریق متغیرهای محیطی allowlist که در پایین توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های مخصوص تضمین کیفیت

وقتی به واقع‌گرایی QA-lab نیاز دارید، این فرمان‌ها کنار مجموعه‌های تست اصلی قرار می‌گیرند:

یکپارچه‌سازی پیوسته QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری عامل‌محور زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه یک گردش‌کار مستقل برای PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه تضمین کیفیت release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض
soak کامل زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛
پروفایل `full` soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر برابری mock، مسیر Matrix زنده، مسیر Telegram زندهٔ مدیریت‌شده با Convex، و مسیر Discord زندهٔ مدیریت‌شده با Convex
به‌عنوان jobهای موازی اجرا می‌شود. تضمین کیفیت زمان‌بندی‌شده و بررسی‌های انتشار Matrix
`--profile fast` را صریحاً پاس می‌دهند، در حالی که CLI مربوط به Matrix و ورودی گردش‌کار دستی
همچنان پیش‌فرض `all` دارند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` شارد کند. `OpenClaw Release
Checks` پیش از تأیید انتشار، برابری به‌علاوهٔ مسیرهای سریع Matrix و Telegram را اجرا می‌کند،
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی معمول Plugin ارائه‌دهنده پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های برابری تضمین کیفیت
پوشش داده می‌شود.

شاردهای رسانهٔ زندهٔ انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` دارد. شاردهای مدل/Backend زندهٔ Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که برای هر commit انتخاب‌شده یک‌بار ساخته می‌شود،
سپس به‌جای ساخت دوباره در هر شارد، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` دریافت می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA متکی به مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - چند سناریوی انتخاب‌شده را به‌طور پیش‌فرض به‌صورت موازی با workerهای Gateway
    ایزوله اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض هم‌روندی 4 دارد (محدود به
    تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از `--concurrency <count>`
    استفاده کنید، یا برای مسیر سریال قدیمی‌تر از `--concurrency 1` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون
    کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های فراهم‌کننده `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور فراهم‌کننده محلی مبتنی بر AIMock را برای پوشش آزمایشی
    fixture و mock پروتکل راه‌اندازی می‌کند، بدون اینکه مسیر آگاه از سناریوی
    `mock-openai` را جایگزین کند.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون سنگین Plugin زنده OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. این
    بسته خارجی Kitchen Sink را نصب می‌کند، موجودی سطح plugin SDK را تأیید می‌کند،
    `/healthz` و `/readyz` را probe می‌کند، شواهد CPU/RSS مربوط به Gateway را
    ثبت می‌کند، یک نوبت زنده OpenAI را اجرا می‌کند، و عیب‌یابی‌های adversarial را
    بررسی می‌کند. به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در
    نشست‌های Testbox آماده‌سازی‌شده، وقتی helper مربوط به `openclaw-testbox-env`
    حاضر باشد، پروفایل احراز هویت زنده Testbox را به‌طور خودکار source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - benchmark راه‌اندازی Gateway به‌همراه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه ترکیبی از مشاهده CPU
    را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغ و پایدار را flag می‌کند (`--cpu-core-warn`
    به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه زمان راه‌اندازی به‌عنوان
    metric ثبت می‌شوند بدون اینکه شبیه رگرسیون peg چنددقیقه‌ای Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی
    runtime تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکسی یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان نگه می‌دارد.
  - همان flagهای انتخاب فراهم‌کننده/مدل را مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای guest عملی هستند forward می‌کنند:
    کلیدهای فراهم‌کننده مبتنی بر env، مسیر config فراهم‌کننده زنده QA، و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا guest بتواند از طریق
    workspace mount‌شده به عقب بنویسد.
  - گزارش و خلاصه معمول QA به‌همراه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - یک tarball npm از checkout فعلی می‌سازد، آن را به‌صورت global در Docker نصب
    می‌کند، onboarding غیرتعاملی با کلید API OpenAI را اجرا می‌کند، به‌طور پیش‌فرض
    Telegram را پیکربندی می‌کند، تأیید می‌کند runtime مربوط به Plugin بسته‌بندی‌شده
    بدون repair وابستگی در زمان راه‌اندازی load می‌شود، doctor را اجرا می‌کند، و
    یک نوبت agent محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای app ساخته‌شده و transcriptهای context runtime
    embedded اجرا می‌کند. تأیید می‌کند context runtime پنهان OpenClaw به‌جای نشت
    به نوبت قابل‌مشاهده کاربر، به‌عنوان یک پیام سفارشی غیرنمایشی persist می‌شود؛
    سپس یک JSONL نشست خراب متأثر را seed می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را با backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک candidate بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را
    اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA
    زنده Telegram را با آن بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - wrapper فقط source مربوط به harness `qa-lab` را از checkout mount می‌کند؛ بسته
    نصب‌شده مالک `dist`، `openclaw/plugin-sdk` و runtime مربوط به Pluginهای
    bundled است تا مسیر، Pluginهای checkout فعلی را با بسته در حال آزمون مخلوط نکند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای
    آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به Convex
    مانند `pnpm openclaw qa telegram` استفاده می‌کند. برای automation مربوط به
    CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند،
    wrapper مربوط به Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env مربوط به credentialهای Telegram
    یا Convex را روی میزبان اعتبارسنجی می‌کند. فقط وقتی عمداً در حال debug کردن
    setup پیش از credential هستید، `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این workflow از
    محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run در برابر
  یک بسته candidate ارائه می‌کند. یک ref مورداعتماد، spec منتشرشده npm،
  URL tarball HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌سازی‌شده را به‌عنوان `package-under-test` upload می‌کند،
  سپس scheduler موجود Docker E2E را با پروفایل‌های مسیر smoke، package، product، full
  یا custom اجرا می‌کند. برای اجرای workflow مربوط به Telegram QA در برابر همان
  artifact مربوط به `package-under-test`، `telegram_mode=mock-openai` یا
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

- اثبات artifact یک artifact از نوع tarball را از اجرای دیگر Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و install می‌کند، Gateway را با OpenAI
    پیکربندی‌شده راه‌اندازی می‌کند، سپس channel/Pluginهای bundled را از طریق ویرایش
    config فعال می‌کند.
  - تأیید می‌کند discovery مربوط به setup، Pluginهای قابل دانلود پیکربندی‌نشده را
    غایب نگه می‌دارد، اولین repair پیکربندی‌شده doctor هر Plugin قابل دانلود گمشده
    را به‌طور صریح نصب می‌کند، و restart دوم repair پنهان وابستگی را اجرا نمی‌کند.
  - همچنین یک baseline npm قدیمی شناخته‌شده را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>`، Telegram را فعال می‌کند، و تأیید می‌کند
    doctor پس از update مربوط به candidate، debris قدیمی وابستگی Plugin را بدون
    repair postinstall سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke مربوط به update نصب بسته native را در guestهای Parallels اجرا می‌کند. هر
    platform انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس دستور
    نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و نسخه نصب‌شده، وضعیت
    update، آمادگی Gateway و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام iterate روی یک guest، از `--platform macos`، `--platform windows` یا
    `--platform linux` استفاده کنید. برای مسیر artifact خلاصه و وضعیت هر مسیر از
    `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض از `openai/gpt-5.5` برای اثبات نوبت agent زنده
    استفاده می‌کند. وقتی عمداً مدل OpenAI دیگری را اعتبارسنجی می‌کنید،
    `--model <provider/model>` را pass کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL`
    را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان wrap کنید تا stallهای transport مربوط
    به Parallels نتوانند باقی پنجره testing را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script، logهای nested هر مسیر را زیر `/tmp/openclaw-parallels-npm-update.*`
    می‌نویسد. پیش از فرض کردن hung بودن wrapper بیرونی، `windows-update.log`،
    `macos-update.log` یا `linux-update.log` را بررسی کنید.
  - update ویندوز روی یک guest سرد می‌تواند 10 تا 15 دقیقه را در doctor پس از
    update و کار update بسته صرف کند؛ وقتی log debug nested مربوط به npm در حال
    پیشروی است، این وضعیت همچنان سالم است.
  - این wrapper تجمیعی را به‌صورت موازی با مسیرهای smoke جداگانه Parallels مربوط
    به macOS، Windows یا Linux اجرا نکنید. آن‌ها state مربوط به VM را به اشتراک
    می‌گذارند و می‌توانند در restore کردن snapshot، سرو کردن بسته، یا state مربوط
    به Gateway در guest با هم برخورد کنند.
  - اثبات پس از update سطح معمول Pluginهای bundled را اجرا می‌کند، چون facadeهای
    capability مانند گفتار، تولید تصویر، و درک رسانه از طریق APIهای runtime bundled
    load می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور فراهم‌کننده محلی AIMock را برای smoke testing مستقیم پروتکل راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel مبتنی بر Docker اجرا می‌کند. فقط source-checkout - نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، env varها و layout مربوط به artifact: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای driver و bot مربوط به SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی chat در Telegram باشد.
  - از `--credential-source convex` برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - پیش‌فرض‌ها canary، mention gating، command addressing، `/status`، پاسخ‌های mention‌شده bot-to-bot و پاسخ‌های فرمان native هسته را پوشش می‌دهند. پیش‌فرض‌های `mock-openai` همچنین رگرسیون‌های قطعی reply-chain و streaming پیام نهایی Telegram را پوشش می‌دهند. برای probeهای اختیاری مانند `session_status` از `--list-scenarios` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، و bot مربوط به SUT باید یک username در Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید bot مربوط به driver می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و artifact پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

`Mantis Telegram Live` wrapper شواهد PR پیرامون این مسیر است. ref مربوط به
candidate را با credentialهای Telegram lease‌شده از Convex اجرا می‌کند، transcript
پیام مشاهده‌شده redact‌شده را در یک مرورگر دسکتاپ Crabbox render می‌کند، شواهد MP4
را ضبط می‌کند، یک GIF motion-trimmed تولید می‌کند، bundle مربوط به artifact را
upload می‌کند، و وقتی `pr_number` تنظیم شده باشد، شواهد inline PR را از طریق GitHub App
مربوط به Mantis post می‌کند. maintainerها می‌توانند آن را از UI مربوط به Actions از
طریق `Mantis Scenario` (`scenario_id:
telegram-live`) یا مستقیماً از یک comment روی pull request شروع کنند:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` wrapper agentic native Telegram Desktop برای
اثبات بصری پیش/پس از PR است. آن را از UI مربوط به Actions با `instructions` آزاد،
از طریق `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) یا از یک comment روی PR شروع کنید:

```text
@Mantis telegram desktop proof
```

عامل Mantis، PR را می‌خواند، تصمیم می‌گیرد چه رفتار قابل‌مشاهده‌ای در Telegram تغییر را اثبات می‌کند، مسیر اثبات Crabbox Telegram Desktop با کاربر واقعی را روی ارجاع‌های baseline و candidate اجرا می‌کند، تا زمانی که GIFهای بومی مفید شوند تکرار می‌کند، یک مانیفست جفت‌شدهٔ `motionPreview` می‌نویسد، و وقتی `pr_number` تنظیم شده باشد، همان جدول GIF دو ستونه را از طریق Mantis GitHub App ارسال می‌کند.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ لینوکسی Crabbox را اجاره می‌کند یا دوباره به کار می‌برد، Telegram Desktop بومی را نصب می‌کند، OpenClaw را با توکن بات SUT اجاره‌شدهٔ Telegram پیکربندی می‌کند، Gateway را راه‌اندازی می‌کند، و شواهد اسکرین‌شات/MP4 را از دسکتاپ VNC قابل‌مشاهده ضبط می‌کند.
  - مقدار پیش‌فرض `--credential-source convex` است تا workflowها فقط به راز broker متعلق به Convex نیاز داشته باشند. از `--credential-source env` با همان متغیرهای `OPENCLAW_QA_TELEGRAM_*` که در `pnpm openclaw qa telegram` استفاده می‌شوند استفاده کنید.
  - Telegram Desktop همچنان به ورود/پروفایل کاربر نیاز دارد. توکن بات فقط OpenClaw را پیکربندی می‌کند. برای یک آرشیو پروفایل `.tgz` با base64 از `--telegram-profile-archive-env <name>` استفاده کنید، یا از `--keep-lease` استفاده کنید و یک‌بار از طریق VNC به‌صورت دستی وارد شوید.
  - فایل‌های `mantis-telegram-desktop-builder-report.md`، `mantis-telegram-desktop-builder-summary.json`، `telegram-desktop-builder.png`، و `telegram-desktop-builder.mp4` را زیر پوشهٔ خروجی می‌نویسد.

مسیرهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید دچار انحراف نشوند؛ ماتریس پوشش هر مسیر در [نمای کلی QA ← پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعهٔ ترکیبی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای QA انتقال زنده فعال باشد، QA lab یک lease انحصاری از یک pool پشتیبانی‌شده با Convex دریافت می‌کند، تا وقتی مسیر در حال اجراست برای آن lease Heartbeat می‌فرستد، و هنگام خاموشی lease را آزاد می‌کند. نام این بخش قدیمی‌تر از پشتیبانی Discord، Slack و WhatsApp است؛ قرارداد lease میان kindها مشترک است.

اسکلت پروژهٔ مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای env ضروری:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک راز برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - مقدار پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci` است، و در غیر این صورت `maintainer`)

متغیرهای env اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسهٔ trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` اجازه می‌دهد برای توسعهٔ فقط محلی از URLهای Convex با loopback `http://` استفاده شود.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات عادی باید از `https://` استفاده کند.

دستورهای مدیریتی maintainer (افزودن/حذف/فهرست کردن pool) مشخصا به `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

ابزارهای کمکی CLI برای maintainerها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، رازهای broker، prefix endpoint، timeout HTTP، و دسترسی‌پذیری admin/list را بدون چاپ مقادیر راز بررسی کنید. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل‌تلاش دوباره: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - موفقیت: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /release`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /admin/add` (فقط راز maintainer)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط راز maintainer)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ lease فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط راز maintainer)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشتهٔ عددی برای شناسهٔ چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

شکل payload برای kind مربوط به کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId`، و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های hex مربوط به SHA-256 باشند.
- `kind: "telegram-user"` نمایندهٔ یک حساب burner در Telegram است. lease را در سطح کل حساب در نظر بگیرید: درایور CLI متعلق به TDLib و شاهد تصویری Telegram Desktop از همان payload بازیابی می‌شوند، و در هر لحظه فقط یک job باید lease را نگه دارد.

بازیابی lease کاربر واقعی Telegram:

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

وقتی ضبط تصویری لازم است، از پروفایل Desktop بازیابی‌شده با `Telegram -workdir "$tmp/desktop"` استفاده کنید. در محیط‌های operator محلی، اگر متغیرهای env مربوط به process وجود نداشته باشند، `scripts/e2e/telegram-user-credential.ts` به‌صورت پیش‌فرض `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` را می‌خواند.

جلسهٔ Crabbox هدایت‌شده توسط عامل:

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

`start` اعتبارنامهٔ `telegram-user` را lease می‌کند، همان حساب را در TDLib و Telegram Desktop روی یک دسکتاپ لینوکسی Crabbox بازیابی می‌کند، یک Gateway محلی mock SUT را از checkout فعلی راه‌اندازی می‌کند، چت Telegram قابل‌مشاهده را باز می‌کند، ضبط دسکتاپ را شروع می‌کند، و یک `session.json` خصوصی می‌نویسد. تا وقتی جلسه زنده است، یک عامل می‌تواند تا زمان رضایت کامل به آزمایش ادامه دهد:

- `send --session <file> --text <message>` از طریق کاربر واقعی TDLib ارسال می‌کند و منتظر پاسخ SUT می‌ماند.
- `run --session <file> -- <remote command>` یک فرمان دلخواه را روی Crabbox اجرا می‌کند و خروجی آن را ذخیره می‌کند، برای مثال `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` دسکتاپ قابل‌مشاهدهٔ فعلی را capture می‌کند.
- `status --session <file>` فرمان lease و WebVNC را چاپ می‌کند.
- `finish --session <file>` ضبط‌کننده را متوقف می‌کند، اسکرین‌شات/ویدیو/آرتیفکت‌های motion-trim را capture می‌کند، اعتبارنامهٔ Convex را آزاد می‌کند، پردازه‌های SUT محلی را متوقف می‌کند، و lease مربوط به Crabbox را متوقف می‌کند مگر اینکه `--keep-box` داده شده باشد.
- `publish --session <file> --pr <number>` به‌صورت پیش‌فرض یک نظر PR فقط شامل GIF منتشر می‌کند. `--full-artifacts` را فقط وقتی ارسال کنید که logها یا آرتیفکت‌های JSON عمدا لازم باشند.

برای بازتولیدهای تصویری deterministic، `--mock-response-file <path>` را به `start` یا به shorthand تک‌فرمانی `probe` بدهید. runner به‌صورت پیش‌فرض از کلاس استاندارد Crabbox، ضبط 24fps، پیش‌نمایش‌های GIF حرکتی 24fps، و عرض GIF برابر 1920px استفاده می‌کند. فقط وقتی اثبات به تنظیمات capture متفاوت نیاز دارد، با `--class`، `--record-fps`، `--preview-fps`، و `--preview-width` بازنویسی کنید.

اثبات Crabbox تک‌فرمانی:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

فرمان پیش‌فرض `probe` خلاصه‌ای برای یک چرخهٔ start/send/finish است. از آن برای یک smoke سریع `/status` استفاده کنید. برای بازبینی PR، کار بازتولید باگ، یا هر موردی که عامل پیش از تصمیم‌گیری دربارهٔ کامل بودن اثبات به چند دقیقه آزمایش دلخواه نیاز دارد، از فرمان‌های جلسه استفاده کنید. برای استفادهٔ دوباره از یک lease دسکتاپ گرم از `--id <cbx_...>` استفاده کنید، برای باز نگه داشتن VNC پس از finish از `--keep-box`، برای انتخاب چت قابل‌مشاهده از `--desktop-chat-title <name>`، و وقتی به‌جای ساخت TDLib روی یک box تازه از آرشیو لینوکسی از پیش آماده‌شدهٔ `libtdjson.so` استفاده می‌کنید از `--tdlib-url <tgz>` استفاده کنید. runner مقدار `--tdlib-url` را با `--tdlib-sha256 <hex>` یا، به‌صورت پیش‌فرض، با فایل هم‌خانوادهٔ `<url>.sha256` بررسی می‌کند.

payloadهای چندکانالهٔ اعتبارسنجی‌شده توسط broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از pool اجاره کنند، اما اعتبارسنجی payload در حال حاضر به‌جای broker در runner مربوط به QA برای Slack قرار دارد. برای ردیف‌های Slack از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید.

### افزودن یک کانال به QA

نام‌های معماری و scenario-helper برای adapterهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در مانیفست Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و scenarioها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

suiteها را به‌عنوان «واقع‌گرایی افزایشی» در نظر بگیرید (و همچنین flakiness/هزینهٔ افزایشی):

### Unit / integration (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعهٔ shard با `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های unit مربوط به UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های unit خالص
  - آزمون‌های integration درون‌پردازه‌ای (احراز هویت Gateway، مسیریابی، ابزارها، parsing، config)
  - regressionهای deterministic برای باگ‌های شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گستردهٔ `api.js` و
    `runtime-api.js` را با fixtureهای کوچک تولیدشدهٔ Plugin ثابت کنند، نه با
    APIهای منبع Pluginهای واقعی bundled. بارگذاری API مربوط به Plugin واقعی به
    suiteهای contract/integration تحت مالکیت Plugin تعلق دارد.

سیاست dependency بومی:

- نصب‌های آزمون پیش‌فرض، ساخت‌های native اختیاری Discord opus را رد می‌کنند. دریافت صدای Discord از رمزگشای pure-JS `opusscript` استفاده می‌کند، و `@discordjs/opus` در `allowBuilds` غیرفعال می‌ماند تا آزمون‌های محلی و مسیرهای Testbox افزونه native را کامپایل نکنند.
- اگر عمداً لازم است یک ساخت native opus را مقایسه کنید، از یک مسیر اختصاصی عملکرد صدای Discord یا مسیر live استفاده کنید. `@discordjs/opus` را در `allowBuilds` پیش‌فرض روی `true` تنظیم نکنید؛ این کار باعث می‌شود چرخه‌های نصب/آزمون نامرتبط، کد native را کامپایل کنند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و مسیرهای scoped">

    - `pnpm test` بدون هدف‌گذاری، به‌جای یک فرایند عظیم native برای پروژه ریشه، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و از اینکه کارهای auto-reply/extension مجموعه‌های نامرتبط را گرسنه کنند جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژه native ریشه `vitest.config.ts` استفاده می‌کند، چون یک چرخه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیرهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه شروع کامل پروژه ریشه را نمی‌پردازد.
    - `pnpm test:changed` مسیرهای git تغییرکرده را به‌طور پیش‌فرض به مسیرهای scoped ارزان گسترش می‌دهد: ویرایش‌های مستقیم آزمون، فایل‌های هم‌خانواده `*.test.ts`، نگاشت‌های صریح منبع، و وابسته‌های محلی گراف import. ویرایش‌های config/setup/package آزمون‌ها را به‌صورت گسترده اجرا نمی‌کنند، مگر اینکه صریحاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه معمول بررسی محلی هوشمند برای کارهای محدود است. این دستور diff را به core، آزمون‌های core، extensions، آزمون‌های extension، apps، docs، فراداده انتشار، ابزار live Docker، و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فراداده انتشار را تغییر می‌دهند، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardای که تغییرات package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness مربوط به live Docker ACP بررسی‌های متمرکز اجرا می‌کنند: syntax پوسته برای اسکریپت‌های auth مربوط به live Docker و یک dry-run زمان‌بند live Docker. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و دیگر سطوح package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد سبک از نظر import از agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و نواحی utility خالص مشابه، از مسیر `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی مسیرهای موجود باقی می‌مانند.
    - فایل‌های منبع helper منتخب در `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمون‌های هم‌خانواده صریح در همان مسیرهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، آزمون‌های integration سطح بالای `reply.*`، و زیرشاخه `src/auto-reply/reply/**` دارد. CI زیرشاخه reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمداً sweep دسته‌ای extension و shard فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation گردش‌کار فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین plugin/extension روی نامزدهای انتشار dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner جاسازی‌شده">

    - وقتی ورودی‌های کشف message-tool یا context زمان اجرای compaction را تغییر می‌دهید،
      هر دو سطح پوشش را نگه دارید.
    - regressionهای متمرکز helper را برای مرزهای routing و normalization خالص اضافه کنید.
    - مجموعه‌های integration مربوط به runner جاسازی‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها تأیید می‌کنند که شناسه‌های scoped و رفتار compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های فقط-helper
      جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض از `threads` استفاده می‌کند.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner
      non-isolated در پروژه‌های ریشه، e2e، و پیکربندی‌های live استفاده می‌کند.
    - مسیر UI ریشه، setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner مشترک non-isolated اجرا می‌شود.
    - هر shard از `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرایندهای فرزند Node
      مربوط به Vitest اضافه می‌کند تا churn کامپایل V8 در اجراهای محلی بزرگ کاهش یابد.
      برای مقایسه با رفتار استاندارد V8، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام مسیرهای معماری را فعال می‌کند.
    - hook مربوط به pre-commit فقط قالب‌بندی انجام می‌دهد. فایل‌های قالب‌بندی‌شده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون اجرا نمی‌کند.
    - وقتی پیش از handoff یا push به دروازه بررسی محلی هوشمند نیاز دارید،
      `pnpm check:changed` را صریحاً اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیرهای scoped ارزان عبور می‌کند. فقط وقتی agent
      تصمیم می‌گیرد یک ویرایش harness، config، package، یا contract واقعاً به پوشش گسترده‌تر
      Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را نگه می‌دارند،
      فقط با سقف worker بالاتر.
    - auto-scaling محلی worker عمداً محافظه‌کارانه است و وقتی میانگین بار host
      از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض
      آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest، پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر wiring آزمون
      درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر یک مکان cache صریح برای profiling مستقیم می‌خواهید،
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی عملکرد">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌همراه
      خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به
      فایل‌های تغییرکرده از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای whole-config از مسیر config به‌عنوان key استفاده می‌کنند؛ shardهای CI مبتنی بر include-pattern
      نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل ردیابی باشند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را در importهای startup صرف می‌کند،
      وابستگی‌های سنگین را پشت یک seam محلی باریک `*.runtime.ts` نگه دارید و
      همان seam را مستقیماً mock کنید، به‌جای اینکه helperهای runtime را فقط برای عبور دادن
      از `vi.mock(...)` به‌صورت deep-import وارد کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر
      `test:changed` routed را با مسیر native root-project برای آن diff commit‌شده
      مقایسه می‌کند و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با routing فهرست فایل‌های
      تغییرکرده از طریق `scripts/test-projects.mjs` و پیکربندی ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU از main-thread برای
      سربار startup و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap مربوط به runner را برای
      مجموعه unit با file parallelism غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجباراً با یک worker
- محدوده:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn مربوط به پیام gateway مصنوعی، memory، و payloadهای بزرگ را از مسیر diagnostic event عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به diagnostic stability bundle را پوشش می‌دهد
  - assert می‌کند recorder محدود باقی می‌ماند، نمونه‌های RSS مصنوعی زیر budget فشار می‌مانند، و عمق صف‌های per-session به صفر برمی‌گردند
- انتظارات:
  - برای CI امن است و به key نیاز ندارد
  - مسیر محدود برای پیگیری regression پایداری است، نه جایگزین مجموعه کامل Gateway

### E2E (smoke مربوط به gateway)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: تا 2، محلی: پیش‌فرض 1).
  - به‌طور پیش‌فرض در silent mode اجرا می‌شود تا سربار console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose console.
- محدوده:
  - رفتار end-to-end مربوط به multi-instance gateway
  - سطوح WebSocket/HTTP، pairing گره‌ها، و شبکه‌سازی سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به key واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های unit دارد (می‌تواند کندتر باشد)

### E2E: smoke مربوط به backend OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- محدوده:
  - یک OpenShell gateway ایزوله را از طریق Docker روی host شروع می‌کند
  - یک sandbox از یک Dockerfile محلی موقت می‌سازد
  - backend OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical remote را از طریق sandbox fs bridge تأیید می‌کند
- انتظارات:
  - فقط opt-in است؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` و یک Docker daemon فعال نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس test gateway و sandbox را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی آزمون هنگام اجرای دستی مجموعه گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### Live (ارائه‌دهندگان واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده‌ی Pluginهای همراه زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تشخیص تغییرات قالب ارائه‌دهنده، ریزه‌کاری‌های فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ
- انتظارات:
  - عمداً پایدار برای CI نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهندگان، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به «همه‌چیز» ترجیح دهید
- اجراهای زنده برای برداشتن کلیدهای API جاافتاده، `~/.profile` را source می‌کنند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک خانه‌ی آزمون موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط زمانی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از دایرکتوری خانه‌ی واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌صورت پیش‌فرض در حالت کم‌صداتری اجرا می‌شود: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را پنهان می‌کند و لاگ‌های bootstrap Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید لاگ‌های کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (ویژه‌ی ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override مخصوص زنده را از طریق `OPENCLAW_LIVE_*_KEY` بدهید؛ آزمون‌ها در پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - suiteهای زنده اکنون خط‌های پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی capture کنسول Vitest کم‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت ارائه‌دهنده/Gateway هنگام اجراهای زنده بی‌درنگ stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام suite را اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید `pnpm test:coverage`)
- دست‌زدن به شبکه‌ی Gateway / پروتکل WS / pairing: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده» / خطاهای ویژه‌ی ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، smokeهای بک‌اند CLI، smokeهای ACP، harness سرور برنامه‌ی Codex، و همه‌ی آزمون‌های زنده‌ی ارائه‌دهنده‌ی رسانه (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، harness رسانه) - به‌علاوه‌ی مدیریت اعتبارنامه برای اجراهای زنده - به [آزمودن suiteهای زنده](/fa/help/testing-live) مراجعه کنید. برای checklist اختصاصی به‌روزرسانی و اعتبارسنجی Plugin، به [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده‌ی کلید پروفایل متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده‌ی Docker به‌طور پیش‌فرض cap کوچک‌تری برای smoke دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً scan جامع‌تر و بزرگ‌تر را می‌خواهید، آن متغیرهای env را override کنید.
- `test:docker:all` تصویر Docker زنده را یک بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک بار به‌عنوان tarball npm از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکننده‌ی Node/Git برای laneهای install/update/plugin-dependency است؛ آن laneها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را برای laneهای عملکرد برنامه‌ی ساخته‌شده در `/app` نصب می‌کند. تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه‌ی انتخاب‌شده را اجرا می‌کند. aggregate از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای پردازش را کنترل می‌کند، درحالی‌که capهای منابع مانع می‌شوند laneهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک lane منفرد از capهای فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی ظرفیت دوباره در دسترس شود، آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker ظرفیت بیشتری دارد، `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌طور پیش‌فرض یک preflight Docker انجام می‌دهد، containerهای E2E قدیمی OpenClaw را حذف می‌کند، هر 30 ثانیه وضعیت را چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع laneهای طولانی‌تر در ابتدا استفاده می‌کند. برای چاپ manifest lane وزن‌دار بدون ساختن یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ برنامه‌ی CI برای laneهای انتخاب‌شده، نیازهای بسته/تصویر، و اعتبارنامه‌ها از `node scripts/test-docker-all.mjs --plan-json` استفاده کنید.
- `Package Acceptance` گیت package بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» است. یک بسته‌ی نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` upload می‌کند، سپس laneهای Docker E2E قابل استفاده‌ی مجدد را به‌جای بسته‌بندی دوباره‌ی ref انتخاب‌شده، علیه همان tarball دقیق اجرا می‌کند. پروفایل‌ها به‌ترتیب گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/update/plugin، ماتریس survivor ارتقای منتشرشده، پیش‌فرض‌های release، و triage خطا به [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده‌ی static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch وابستگی‌های package مانند Commander، UI prompt، undici، یا logging را قبل از dispatch فرمان import کند، شکست می‌خورد؛ همچنین chunk اجرای Gateway همراه را زیر budget نگه می‌دارد و importهای static مسیرهای Gateway سرد شناخته‌شده را رد می‌کند. smoke بسته‌بندی‌شده‌ی CLI نیز help ریشه، help onboard، help doctor، status، schema پیکربندی، و یک فرمان model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود است (`2026.4.25-beta.*` نیز شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata بسته‌ی shipped را تحمل می‌کند: ورودی‌های inventory خصوصی QA حذف‌شده، نبود `gateway install --wrapper`، نبود patch fileها در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای بسته‌های بعد از `2026.4.25`، آن مسیرها شکست‌های strict هستند.
- اجراکننده‌های smoke container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:skill-install`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح‌بالاتر را verify می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه‌ی موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در خانه‌ی container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن auth store میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- آزمون دود اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex، و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- آزمون دود backend در CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- آزمون دود هارنس app-server کدکس: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- آزمون دود مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA از checkout منبع است. این مورد عمداً بخشی از مسیرهای انتشار Docker بسته نیست، زیرا tarball npm شامل QA Lab نمی‌شود.
- آزمون دود زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوی راه‌اندازی اولیه (TTY، داربست‌سازی کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- آزمون دود tarball راه‌اندازی اولیه/کانال/عامل در Npm: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع env به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.
- آزمون دود نصب Skill: `pnpm test:docker:skill-install` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب‌های آرشیو آپلودشده را در پیکربندی غیرفعال می‌کند، slug فعلی Skill زنده ClawHub را از جست‌وجو resolve می‌کند، آن را با `openclaw skills install` نصب می‌کند، و Skill نصب‌شده به‌همراه فراداده origin/lock مربوط به `.clawhub` را راستی‌آزمایی می‌کند.
- آزمون دود تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` جابه‌جا می‌شود، کانال ماندگارشده و کار پس از به‌روزرسانی Plugin را راستی‌آزمایی می‌کند، سپس به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون دود بازمانده ارتقا: `pnpm test:docker:upgrade-survivor` tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمی کثیف با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. این آزمون به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده زنده یا کانال اجرا می‌کند، سپس یک Gateway با loopback راه‌اندازی می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- آزمون دود بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های کاربر موجود واقع‌گرایانه را seed می‌کند، آن baseline را با یک دستورالعمل فرمان پخته پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway با loopback راه‌اندازی می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، از زمان‌بند تجمیعی بخواهید baselineهای محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای مسئله‌محور را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این موارد را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند، توکن‌های baseline متا مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌همراه `reported-issues` گسترش می‌دهد.
- آزمون دود زمینه runtime نشست: `pnpm test:docker:session-runtime-context` ماندگاری transcript زمینه runtime پنهان به‌همراه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite آسیب‌دیده را راستی‌آزمایی می‌کند.
- آزمون دود نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و راستی‌آزمایی می‌کند که `openclaw infer image providers --json` به‌جای هنگ کردن، ارائه‌دهندگان تصویر بسته‌بندی‌شده را برمی‌گرداند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- آزمون دود Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک کش npm را میان کانتینرهای root، update، و direct-npm خود به‌اشتراک می‌گذارد. آزمون دود update پیش از ارتقا به tarball کاندید، به‌طور پیش‌فرض از `latest` در npm به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` override کنید، یا در GitHub با ورودی `update_baseline_version` مربوط به workflow آزمون دود نصب. بررسی‌های نصب‌کننده غیر root یک کش npm ایزوله نگه می‌دارند تا ورودی‌های کش با مالکیت root رفتار نصب محلی کاربر را پنهان نکنند. `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید تا کش root/update/direct-npm را در اجرای دوباره محلی reuse کنید.
- CI آزمون دود نصب، به‌روزرسانی سراسری تکراری direct-npm را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون دود CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزوله کانتینر seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را راستی‌آزمایی می‌کند. تصویر install-smoke را با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- آزمون دود snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و راستی‌آزمایی می‌کند snapshotهای نقش CDP شامل URLهای لینک، عناصر کلیک‌پذیر ارتقایافته با cursor، ارجاع‌های iframe، و فراداده frame باشند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، راستی‌آزمایی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema ارائه‌دهنده را اجباری می‌کند و بررسی می‌کند جزئیات خام در لاگ‌های Gateway ظاهر شود.
- پل کانال MCP (Gateway seedشده + پل stdio + آزمون دود raw notification-frame در Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور stdio MCP واقعی + آزمون دود allow/deny نمایه Pi توکار): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند stdio MCP پس از اجرای cron ایزوله و اجرای subagent تک‌مرحله‌ای): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، kitchen-sink در ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` override کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون دود بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون دود ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix` tarball بسته‌بندی‌شده OpenClaw را در یک کانتینر bare نصب می‌کند، یک Plugin npm نصب می‌کند، enable/disable را toggle می‌کند، آن را از طریق یک رجیستری npm محلی ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس راستی‌آزمایی می‌کند uninstall همچنان وضعیت کهنه را حذف کند، در حالی که معیارهای RSS/CPU را برای هر فاز چرخه عمر log می‌کند.
- آزمون دود فراداده reload پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب Plugin npm با ردیابی منابع، enable، disable، upgrade، downgrade، و uninstall در حالت کد مفقود را پوشش می‌دهد.

برای پیش‌ساخت و استفاده دوباره دستی از تصویر عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

overrideهای تصویر ویژه هر suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` در صورت تنظیم همچنان اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره می‌کند، اگر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خود را نگه می‌دارند، زیرا به‌جای runtime برنامه ساخته‌شده مشترک، رفتار package/install را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را داخل container در یک workdir موقت stage می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد و در عین حال Vitest را روی دقیقاً همان source/config محلی شما اجرا می‌کند.
مرحله staging cacheهای بزرگِ فقط‌محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلیِ برنامه یا
Gradle را رد می‌کند تا اجراهای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای وابسته به ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده Gateway
workerهای channel واقعی Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است
پوشش زنده Gateway را در آن lane Docker محدود یا مستثنا کنید، `OPENCLAW_LIVE_GATEWAY_*`
را هم عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container Gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container پین‌شده Open WebUI را در برابر آن Gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، تأیید می‌کند `/api/models` مقدار `openclaw/default` را expose می‌کند، سپس یک
درخواست chat واقعی را از طریق proxyِ `/api/chat/completions` مربوط به Open WebUI ارسال می‌کند.
برای checkهای CI مسیر release که باید پس از ورود Open WebUI و کشف مدل متوقف شوند،
بدون انتظار برای completion مدل زنده، `OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید.
اجرای نخست می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد راه‌اندازی سرد خودش را کامل کند.
این lane به یک key قابل‌استفاده مدل زنده نیاز دارد، و `OPENCLAW_PROFILE_FILE`
(به‌طور پیش‌فرض `~/.profile`) راه اصلی فراهم کردن آن در اجراهای Dockerized است.
اجرای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک container Gateway seedشده را boot می‌کند،
container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف مکالمه routed، خواندن transcript، metadata پیوست،
رفتار queue رویداد زنده، routing ارسال outbound، و اعلان‌های channel +
permission به سبک Claude را روی bridge واقعی stdio MCP تأیید می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را validate کند که
bridge واقعاً emit می‌کند، نه فقط چیزی که یک SDK client خاص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به key مدل زنده نیاز ندارد.
image Docker repo را build می‌کند، یک server probe واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime MCP بسته Pi embedded materialize می‌کند،
tool را اجرا می‌کند، سپس تأیید می‌کند `coding` و `messaging` ابزارهای
`bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به key مدل زنده نیاز ندارد.
یک Gateway seedشده را با یک server probe واقعی stdio MCP شروع می‌کند، یک
turn ایزوله cron و یک turn فرزند one-shot با `/subagents spawn` اجرا می‌کند، سپس تأیید می‌کند
process فرزند MCP پس از هر اجرا exit می‌کند.

smoke دستی thread زبان طبیعی ACP (CI نیست):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است برای validation مسیردهی threadهای ACP دوباره لازم شود، بنابراین آن را حذف نکنید.

متغیرهای env مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که به `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که به `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که به `/home/node/.profile` mount می‌شود و پیش از اجرای testها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای verify کردن فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های config/workspace موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای installهای cacheشده CLI داخل Docker به `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها به `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` infer شده‌اند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای reuse کردن یک image موجود `openclaw:local-live` برای rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentials از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smokeِ Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که smokeِ Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای override کردن tag image پین‌شده Open WebUI

## sanity مستندات

پس از ویرایش مستندات، checkهای docs را اجرا کنید: `pnpm check:docs`.
وقتی به checkهای heading درون صفحه هم نیاز دارید، validation کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (امن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- tool calling در Gateway (OpenAI mock، Gateway واقعی + loop agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizardِ Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اعمال auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای reliability agent (skills)

ما از قبل چند test امن برای CI داریم که مانند «evalهای reliability agent» رفتار می‌کنند:

- tool-calling mock از طریق Gateway واقعی + loop agent (`src/gateway/gateway.test.ts`).
- جریان‌های wizard انتهابه‌انتها که wiring session و اثرهای config را validate می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **Decisioning:** وقتی skillها در prompt فهرست شده‌اند، آیا agent skill درست را انتخاب می‌کند (یا از موارد نامرتبط اجتناب می‌کند)؟
- **Compliance:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و steps/args لازم را دنبال می‌کند؟
- **Workflow contracts:** سناریوهای چند turn که ترتیب toolها، carryover تاریخچه session، و boundaryهای sandbox را assert می‌کنند.

evalهای آینده ابتدا باید deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن tool callها + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- evalهای live اختیاری (opt-in، env-gated) فقط پس از آماده شدن suite امن برای CI.

## Contract tests (شکل Plugin و channel)

Contract testها تأیید می‌کنند که هر Plugin و channel ثبت‌شده با
contract interface خودش سازگار است. آن‌ها روی همه Pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای shape و behavior اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های seam و smoke مشترک را رد می‌کند؛ وقتی surfaceهای shared channel یا provider را لمس می‌کنید،
commandهای contract را صراحتاً اجرا کنید.

### Commands

- همه contractها: `pnpm test:contracts`
- فقط contractهای channel: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **Plugin** - شکل پایه Plugin (id، name، capabilities)
- **setup** - contract ویزارد setup
- **session-binding** - رفتار binding session
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام inbound
- **actions** - handlerهای actionِ channel
- **threading** - handling شناسه thread
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال policy گروه

### contractهای status provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای status channel
- **registry** - شکل registry Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract جریان auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API catalog مدل
- **discovery** - کشف Plugin
- **loader** - loading Plugin
- **runtime** - runtime provider
- **shape** - شکل/interfaceِ Plugin
- **wizard** - ویزارد setup

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک Pluginِ channel یا provider
- پس از refactor کردن registration یا discovery Plugin

Contract testها در CI اجرا می‌شوند و به keyهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- در صورت امکان یک regression امن برای CI اضافه کنید (providerِ mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را narrow و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین layerی را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/replay درخواست provider → test مستقیم models
  - bug pipelineِ session/history/tool در Gateway → smoke زنده Gateway یا test mock Gateway امن برای CI
- guardrail traversal برای SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` یک target نمونه برای هر classِ SecretRef را از metadata registry (`listSecretTargetRegistryEntries()`) derive می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک خانواده target جدید SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. این test عمداً روی target idهای unclassified fail می‌شود تا classهای جدید بی‌صدا skip نشوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
