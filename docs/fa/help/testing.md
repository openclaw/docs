---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای اشکال‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمون: مجموعه‌های آزمون واحد/سرتاسری/زنده، اجراکننده‌های Docker، و اینکه هر آزمون چه چیزی را پوشش می‌دهد'
title: آزمون
x-i18n:
    generated_at: "2026-05-05T01:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه‌ای کوچک
از اجراکننده‌های Docker. این سند راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای جریان‌های کاری رایج (محلی، پیش از push، اشکال‌زدایی) کدام دستورها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده آزمون‌های رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح دستورها، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مخصوص QA در پایین ([اجراکننده‌های مخصوص QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعه محلی روی ماشینی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد کار می‌کنید، ابتدا اجرای هدفمند را ترجیح دهید.
- سایت QA با پشتوانه Docker: `pnpm qa:lab:up`
- مسیر QA با پشتوانه ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + پروب‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌سروصدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد زمان اجرا: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک نوبت عامل واقعی `openai/gpt-5.4` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace مربوط به Kova اجرا کنید. اجراهای زمان‌بندی‌شده روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، مصنوعات مسیر ارائه‌دهنده ساختگی، پروفایل عمیق، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش ارائه‌دهنده ساختگی همچنین شامل اعداد راه‌اندازی Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقه سلام مدل ساختگی تکرارشونده، و شروع CLI است.
- جاروب مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک پروب کوچک شبیه خواندن فایل را اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را تبلیغ می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، پروب‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: هر دو اجرای روزانه `OpenClaw Scheduled Live And E2E Checks` و دستی
    `OpenClaw Release Checks` گردش‌کار زنده/E2E قابل استفاده مجدد را با
    `include_live_suites: true` فراخوانی می‌کنند؛ این شامل jobهای جداگانه ماتریس مدل زنده Docker است
    که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` اجرا کنید.
  - رازهای جدید و پرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشاری آن اضافه کنید.
- اسموک چت متصل بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از مسیر اتصال بومی Plugin به‌جای ACP عبور می‌کنند.
- اسموک هارنس app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق هارنس app-server متعلق به Plugin مربوط به Codex اجرا می‌کند،
    `/codex status` و `/codex models` را تأیید می‌کند، و به‌طور پیش‌فرض پروب‌های تصویر،
    cron MCP، عامل فرعی، و Guardian را تمرین می‌دهد. هنگام جداسازی شکست‌های دیگر app-server مربوط به Codex،
    پروب عامل فرعی را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای یک بررسی متمرکز عامل فرعی، پروب‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از پروب عامل فرعی خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- اسموک دستور نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و چندلایه برای سطح دستور نجات کانال پیام.
    `/crestodian status` را تمرین می‌دهد، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تأیید می‌کند.
- اسموک Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک Claude CLI ساختگی روی `PATH` اجرا می‌کند
    و تأیید می‌کند که fallback برنامه‌ریز fuzzy به یک نوشتن پیکربندی typed و audit‌شده تبدیل می‌شود.
- اسموک Docker اولین اجرای Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های راه‌اندازی/مدل/عامل/Plugin مربوط به Discord + SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های audit را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- اسموک هزینه Moonshot/Kimi: با تنظیم بودن `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید که JSON، Moonshot/K2.6 را گزارش می‌کند و
  رونوشت دستیار، `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که پایین‌تر توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های مخصوص QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این دستورها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری عامل‌محور زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار قرار دارد، نه در یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض،
soak کامل زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ پروفایل
`full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر برابری ساختگی، مسیر زنده Matrix،
مسیر زنده Telegram مدیریت‌شده با Convex، و مسیر زنده Discord مدیریت‌شده با Convex
به‌صورت jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صریحا پاس می‌دهند، در حالی که مقدار پیش‌فرض ورودی CLI ماتریس و گردش‌کار دستی
همچنان `all` است؛ dispatch دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تأیید انتشار، برابری به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند،
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی عادی Plugin ارائه‌دهنده پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های برابری QA
پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده ساخته می‌شود،
سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند، به‌جای اینکه داخل هر shard دوباره بسازند.

- `pnpm openclaw qa suite`
  - سناریوهای QA متکی به مخزن را مستقیما روی میزبان اجرا می‌کند.
  - چند سناریوی انتخاب‌شده را به‌طور پیش‌فرض، با کارگرهای Gateway ایزوله، به‌صورت موازی اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض هم‌زمانی 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده). از `--concurrency <count>` برای تنظیم تعداد کارگرها، یا از `--concurrency 1` برای مسیر سریال قدیمی‌تر استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های تامین‌کننده `live-frontier`، `mock-openai`، و `aimock` پشتیبانی می‌کند. `aimock` یک سرور تامین‌کننده محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture و mock پروتکل شروع می‌کند، بدون اینکه مسیر سناریوآگاه `mock-openai` را جایگزین کند.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون چالشی زنده Plugin OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. بسته خارجی Kitchen Sink را نصب می‌کند، موجودی سطح plugin SDK را بررسی می‌کند، `/healthz` و `/readyz` را می‌آزماید، شواهد CPU/RSS Gateway را ثبت می‌کند، یک نوبت زنده OpenAI را اجرا می‌کند، و تشخیص‌های خصمانه را بررسی می‌کند. به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های Testbox آماده‌شده، وقتی helper با نام `openclaw-testbox-env` حاضر باشد، به‌طور خودکار پروفایل live-auth مربوط به Testbox را بارگذاری می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ شروع Gateway را همراه با یک بسته کوچک سناریوی QA Lab mock (`channel-chat-baseline`، `memory-failure-fallback`، `gateway-restart-inflight-run`) اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU را زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغ پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn` همراه با `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه شروع به‌عنوان متریک ثبت می‌شوند بدون اینکه شبیه رگرسیون درگیری چنددقیقه‌ای Gateway به نظر برسند.
  - از آرتیفکت‌های ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM یک‌بارمصرف Linux Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو در `qa suite` روی میزبان را حفظ می‌کند.
  - همان فلگ‌های انتخاب تامین‌کننده/مدل در `qa suite` را دوباره استفاده می‌کند.
  - اجراهای زنده، ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای مهمان عملی هستند forward می‌کنند: کلیدهای تامین‌کننده مبتنی بر env، مسیر پیکربندی تامین‌کننده زنده QA، و `CODEX_HOME` وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق workspace mount‌شده دوباره بنویسد.
  - گزارش + خلاصه عادی QA و همچنین لاگ‌های Multipass را زیر `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور شروع می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را در Docker به‌صورت سراسری نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند، به‌طور پیش‌فرض Telegram را پیکربندی می‌کند، بررسی می‌کند runtime بسته‌بندی‌شده Plugin بدون تعمیر وابستگی در شروع بارگذاری شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر یک endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای transcriptهای embedded runtime context در برنامه ساخته‌شده اجرا می‌کند. بررسی می‌کند hidden OpenClaw runtime context به‌عنوان یک پیام سفارشی غیرنمایشی پایدار شده باشد، نه اینکه به نوبت کاربر قابل مشاهده نشت کند؛ سپس یک JSONL نشست خراب متاثر را seed می‌کند و بررسی می‌کند `openclaw doctor --fix` آن را همراه با backup به شاخه فعال بازنویسی کند.
- `pnpm test:docker:npm-telegram-live`
  - یک نامزد بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر QA زنده Telegram را با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - به‌طور پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان اعتبارنامه‌های env مربوط به Telegram یا منبع اعتبارنامه Convex مانند `pnpm openclaw qa telegram` استفاده می‌کند. برای خودکارسازی CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را همراه با `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند، wrapper Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env اعتبارنامه Telegram یا Convex را روی میزبان اعتبارسنجی می‌کند. فقط وقتی عمدا در حال اشکال‌زدایی راه‌اندازی پیش از اعتبارنامه هستید، `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر، `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. workflow از محیط `qa-live-shared` و اجاره‌های اعتبارنامه CI در Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول به‌صورت اجرای جانبی در برابر یک بسته نامزد ارائه می‌کند. یک ref مورد اعتماد، spec منتشرشده npm، URL tarball با HTTPS همراه با SHA-256، یا آرتیفکت tarball از اجرای دیگر را می‌پذیرد، `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس زمان‌بند Docker E2E موجود را با پروفایل‌های مسیر smoke، package، product، full، یا custom اجرا می‌کند. برای اجرای workflow QA مربوط به Telegram در برابر همان آرتیفکت `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
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

- اثبات آرتیفکت یک آرتیفکت tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را با OpenAI پیکربندی‌شده شروع می‌کند، سپس channel/Pluginهای bundle‌شده را از طریق ویرایش‌های config فعال می‌کند.
  - بررسی می‌کند discovery راه‌اندازی، Pluginهای downloadable پیکربندی‌نشده را غایب بگذارد، اولین تعمیر doctor پیکربندی‌شده هر Plugin downloadable گم‌شده را صریحا نصب کند، و restart دوم تعمیر وابستگی پنهان را اجرا نکند.
  - همچنین یک baseline قدیمی‌تر شناخته‌شده npm را نصب می‌کند، Telegram را پیش از اجرای `openclaw update --tag <candidate>` فعال می‌کند، و بررسی می‌کند doctor پس از update نامزد، باقی‌مانده‌های وابستگی Plugin قدیمی را بدون تعمیر postinstall سمت harness پاک کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی نصب بسته بومی را در مهمان‌های Parallels اجرا می‌کند. هر پلتفرم انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس فرمان نصب‌شده `openclaw update` را در همان مهمان اجرا می‌کند و نسخه نصب‌شده، وضعیت update، آمادگی Gateway، و یک نوبت agent محلی را بررسی می‌کند.
  - هنگام تکرار روی یک مهمان، از `--platform macos`، `--platform windows`، یا `--platform linux` استفاده کنید. برای مسیر آرتیفکت خلاصه و وضعیت هر مسیر، از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض برای اثبات نوبت agent زنده از `openai/gpt-5.5` استفاده می‌کند. وقتی عمدا مدل OpenAI دیگری را اعتبارسنجی می‌کنید، `--model <provider/model>` را پاس دهید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان بپیچید تا توقف‌های transport در Parallels نتوانند باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script لاگ‌های تودرتوی مسیر را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از فرض گرفتن اینکه wrapper بیرونی گیر کرده است، `windows-update.log`، `macos-update.log`، یا `linux-update.log` را بررسی کنید.
  - update ویندوز روی یک مهمان سرد می‌تواند 10 تا 15 دقیقه در doctor پس از update و کار update بسته زمان صرف کند؛ وقتی لاگ debug تودرتوی npm در حال پیشروی است، این هنوز سالم است.
  - این wrapper تجمیعی را هم‌زمان با مسیرهای smoke جداگانه Parallels برای macOS، Windows، یا Linux اجرا نکنید. آن‌ها وضعیت VM را مشترک استفاده می‌کنند و ممکن است در restore کردن snapshot، ارائه بسته، یا وضعیت Gateway مهمان تداخل کنند.
  - اثبات پس از update سطح عادی Plugin bundle‌شده را اجرا می‌کند، چون facadeهای capability مانند speech، image generation، و media understanding از طریق APIهای runtime bundle‌شده بارگذاری می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور تامین‌کننده محلی AIMock را برای smoke testing مستقیم پروتکل شروع می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel مبتنی بر Docker اجرا می‌کند. فقط source-checkout — نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، کاتالوگ profile/scenario، env vars، و layout آرتیفکت: [QA Matrix](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را با استفاده از driver و tokenهای bot مربوط به SUT از env، در برابر یک گروه خصوصی واقعی اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای ورود به اجاره‌های pooled، `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، و bot مربوط به SUT باید یک username در Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و آرتیفکت observed-messages را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید دچار drift نشوند؛ ماتریس پوشش هر مسیر در [مرور کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای `openclaw qa telegram` فعال باشد، QA lab یک اجاره انحصاری از یک pool مبتنی بر Convex دریافت می‌کند، تا زمانی که مسیر در حال اجراست برای آن اجاره Heartbeat می‌فرستد، و هنگام shutdown اجاره را آزاد می‌کند.

اسکلت مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env vars الزامی:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci`، و در غیر این صورت `maintainer`)

env vars اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با `http://` روی loopback برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات عادی باید از `https://` استفاده کند.

دستورهای مدیریتی نگه‌دارنده‌ها (افزودن/حذف/فهرست‌کردن pool) به‌طور مشخص به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، اسرار broker،
پیشوند endpoint، مهلت HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر secret بررسی کند. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI
از `--json` استفاده کنید.

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
- `groupId` باید یک رشتهٔ عددی شناسهٔ چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کنندهٔ سناریو برای adapterهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: transport runner را روی درز میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمایش (چه چیزی کجا اجرا می‌شود)

به مجموعه‌ها به‌عنوان «واقع‌گرایی فزاینده» فکر کنید (و همچنین ناپایداری/هزینهٔ فزاینده):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعهٔ shardهای `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های جداگانهٔ هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمایش‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمایش‌های واحد خالص
  - آزمایش‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، مسیریابی، ابزارها، parsing، config)
  - regressionهای قطعی برای bugهای شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمایش‌های resolver و loader سطح عمومی باید رفتار fallback گستردهٔ `api.js` و
    `runtime-api.js` را با fixtureهای کوچک تولیدشدهٔ Plugin ثابت کنند، نه با
    APIهای منبع Pluginهای bundled واقعی. بارگذاری API واقعی Pluginها به
    مجموعه‌های contract/integration تحت مالکیت Plugin تعلق دارد.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای scoped">

    - `pnpm test` بدون هدف، به‌جای یک فرایند عظیم native root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) را اجرا می‌کند. این کار RSS اوج را روی ماشین‌های تحت بار کاهش می‌دهد و مانع می‌شود کار auto-reply/extension مجموعه‌های نامرتبط را بی‌منبع بگذارد.
    - `pnpm test --watch` همچنان از گراف پروژهٔ native root `vitest.config.ts` استفاده می‌کند، چون حلقهٔ watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینهٔ startup کامل پروژهٔ root را نمی‌پردازد.
    - `pnpm test:changed` مسیرهای git تغییریافته را به‌طور پیش‌فرض به laneهای scoped ارزان گسترش می‌دهد: ویرایش‌های مستقیم test، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های local import-graph. ویرایش‌های config/setup/package باعث اجرای گستردهٔ tests نمی‌شوند مگر اینکه صریحا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` گیت smart local check عادی برای کار محدود است. diff را به core، آزمایش‌های core، extensions، آزمایش‌های extension، apps، docs، release metadata، ابزارهای Docker زنده، و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. آزمایش‌های Vitest را اجرا نمی‌کند؛ برای proof آزمایشی، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط release metadata را تغییر می‌دهند، checkهای هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardی که تغییرات package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness زندهٔ Docker ACP checkهای متمرکز اجرا می‌کنند: syntax shell برای اسکریپت‌های احراز هویت Docker زنده و dry-run زمان‌بند Docker زنده. تغییرات `package.json` فقط زمانی لحاظ می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و دیگر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - آزمایش‌های واحد سبک از نظر import از agents، commands، plugins، کمک‌کننده‌های auto-reply، `plugin-sdk`، و نواحی utility خالص مشابه، از lane `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود می‌مانند.
    - برخی فایل‌های source کمک‌کنندهٔ `plugin-sdk` و `commands` نیز اجراهای changed-mode را به آزمایش‌های هم‌جوار صریح در آن laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوبارهٔ کل suite سنگین آن دایرکتوری اجتناب می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای کمک‌کننده‌های core سطح بالا، آزمایش‌های integration سطح بالای `reply.*`، و زیرشاخهٔ `src/auto-reply/reply/**` دارد. CI زیرشاخهٔ reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import کل دنبالهٔ Node را مالک نشود.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و shard فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation workflow فرزند جداگانهٔ `Plugin Prerelease` را برای آن suiteهای سنگین از نظر plugin/extension روی release candidateها dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner توکار">

    - وقتی ورودی‌های کشف message-tool یا context runtime مربوط به Compaction را تغییر می‌دهید،
      هر دو سطح پوشش را نگه دارید.
    - regressionهای helper متمرکز برای مرزهای مسیریابی و نرمال‌سازی خالص اضافه کنید.
    - مجموعه‌های integration runner توکار را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن suiteها تأیید می‌کنند که شناسه‌های scoped و رفتار Compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمایش‌های فقط-helper
      جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایهٔ Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner
      غیر-isolated در سراسر پروژه‌های root، e2e، و پیکربندی‌های live استفاده می‌کند.
    - lane مربوط به UI ریشه setup و optimizer مخصوص `jsdom` خود را نگه می‌دارد، اما آن هم روی
      runner مشترک غیر-isolated اجرا می‌شود.
    - هر shard مربوط به `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرایندهای فرزند Node
      مربوط به Vitest اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ local کاهش یابد.
      برای مقایسه با رفتار V8 stock مقدار `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع local">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook مربوط به pre-commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و
      lint، typecheck، یا tests را اجرا نمی‌کند.
    - زمانی که به گیت smart local check نیاز دارید، پیش از handoff یا push،
      `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از laneهای scoped ارزان عبور می‌کند. فقط زمانی از
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که agent
      تصمیم بگیرد ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر
      Vitest نیاز دارد.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را نگه می‌دارند،
      فقط با سقف worker بالاتر.
    - auto-scaling مربوط به workerهای local عمدا محافظه‌کارانه است و وقتی load average میزبان
      از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای همزمان Vitest به‌طور پیش‌فرض
      آسیب کمتری وارد می‌کنند.
    - پیکربندی پایهٔ Vitest پروژه‌ها/فایل‌های config را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر
      سیم‌کشی test درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید،
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی عملکرد">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌همراه
      خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به
      فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شوند.
      اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ shardهای CI مبتنی بر
      include-pattern نام shard را اضافه می‌کنند تا shardهای filtered جداگانه قابل ردیابی باشند.
    - وقتی یک test داغ همچنان بیشتر زمان خود را در importهای startup صرف می‌کند،
      dependencyهای سنگین را پشت یک درز local محدود `*.runtime.ts` نگه دارید و
      به‌جای deep-import کردن helperهای runtime فقط برای عبور دادنشان از `vi.mock(...)`،
      همان درز را مستقیما mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر route‌شدهٔ
      `test:changed` را با مسیر native root-project برای آن diff commit‌شده مقایسه می‌کند
      و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن
      فهرست فایل‌های تغییریافته از
      `scripts/test-projects.mjs` و پیکربندی root Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU مربوط به main-thread برای
      overheadهای startup و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap مربوط به runner را برای
      suite واحد با parallelism فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارا با یک worker
- دامنه:
  - یک Gateway واقعی روی local loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn پیام مصنوعی Gateway، memory، و payload بزرگ را از مسیر event تشخیصی عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به bundle پایداری تشخیصی را پوشش می‌دهد
  - assert می‌کند که recorder محدود می‌ماند، نمونه‌های مصنوعی RSS زیر بودجهٔ فشار می‌مانند، و عمق queue هر session دوباره به صفر تخلیه می‌شود
- انتظارات:
  - برای CI امن و بدون کلید است
  - lane محدود برای پیگیری regression پایداری است، نه جایگزینی برای کل suite مربوط به Gateway

### E2E (smoke مربوط به Gateway)

- دستور: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های E2E پلاگین‌های همراه در `extensions/`
- پیش‌فرض‌های زمان اجرا:
  - از Vitest `threads` با `isolate: false` استفاده می‌کند که با بقیه مخزن هم‌خوان است.
  - از workerهای تطبیقی استفاده می‌کند (CI: حداکثر 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت بی‌صدا اجرا می‌شود تا سربار ورودی/خروجی کنسول کاهش یابد.
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی مفصل کنسول.
- دامنه:
  - رفتار سرتاسری Gateway چندنمونه‌ای
  - سطوح WebSocket/HTTP، جفت‌سازی Node، و شبکه‌سازی سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلیدهای واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های واحد دارد (می‌تواند کندتر باشد)

### E2E: دودآزمایی بک‌اند OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله OpenShell را روی میزبان از طریق Docker شروع می‌کند
  - یک sandbox را از یک Dockerfile محلی موقت ایجاد می‌کند
  - بک‌اند OpenShell در OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار فایل‌سیستم remote-canonical را از طریق پل sandbox fs راستی‌آزمایی می‌کند
- انتظارها:
  - فقط opt-in است؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` به‌همراه daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس Gateway و sandbox آزمون را نابود می‌کند
- بازنویسی‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی آزمون هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به یک باینری CLI یا اسکریپت wrapper غیرپیش‌فرض

### زنده (providerهای واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده پلاگین‌های همراه در `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - گرفتن تغییرات قالب provider، ریزه‌کاری‌های tool-calling، مشکلات احراز هویت، و رفتار rate limit
- انتظارها:
  - بنا بر طراحی در CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از rate limitها استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده `~/.profile` را source می‌کنند تا کلیدهای API گم‌شده را بردارند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد config/auth را به یک خانه آزمون موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` را فقط وقتی تنظیم کنید که عمداً لازم دارید آزمون‌های زنده از دایرکتوری خانه واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت کم‌صداتری دارد: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را پنهان می‌کند و لاگ‌های bootstrap Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید لاگ‌های کامل startup برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (مختص provider): `*_API_KEYS` را با قالب comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی per-live را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ آزمون‌ها در پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest ساکت است، به‌صورت دیداری فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت provider/Gateway در طول اجراهای زنده فوراً stream شوند.
  - Heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر زیاد تغییر داده‌اید، `pnpm test:coverage`)
- دست‌کاری شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «رباتم down است» / شکست‌های مختص provider / tool calling: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (دست‌زننده به شبکه)

برای ماتریس مدل زنده، دودآزمایی‌های بک‌اند CLI، دودآزمایی‌های ACP، harness
app-server کدکس، و همه آزمون‌های زنده media-provider (Deepgram، BytePlus، ComfyUI، image،
music، video، media harness) — به‌علاوه مدیریت اعتبارنامه برای اجراهای زنده — ببینید
[آزمون مجموعه‌های زنده](/fa/help/testing-live). برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی پلاگین، ببینید
[آزمون به‌روزرسانی‌ها و پلاگین‌ها](/fa/help/testing-updates-plugins).

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های live-model: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده profile-key متناظر خود را داخل image Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری config محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌طور پیش‌فرض سقف smoke کوچک‌تری دارند تا یک sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صریحاً اسکن جامع بزرگ‌تر را می‌خواهید، آن متغیرهای محیطی را بازنویسی کنید.
- `test:docker:all` یک‌بار image زنده Docker را از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت tarball npm بسته‌بندی می‌کند، سپس دو image مبتنی بر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. image bare فقط اجراکننده Node/Git برای laneهای install/update/plugin-dependency است؛ آن laneها tarball ازپیش‌ساخته را mount می‌کنند. image functional همان tarball را برای laneهای عملکرد built-app در `/app` نصب می‌کند. تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` است؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` است؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. aggregate از یک scheduler محلی weighted استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای process را کنترل می‌کند، در حالی که سقف‌های منبع مانع می‌شوند laneهای سنگین live، npm-install، و multi-service همگی هم‌زمان شروع شوند. اگر یک lane منفرد از سقف‌های فعال سنگین‌تر باشد، scheduler همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس آن را تنها در حال اجرا نگه می‌دارد تا ظرفیت دوباره در دسترس شود. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker فضای بیشتری دارد، `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌طور پیش‌فرض یک preflight Docker انجام می‌دهد، containerهای E2E قدیمی OpenClaw را حذف می‌کند، هر 30 ثانیه وضعیت را چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها استفاده می‌کند تا در اجراهای بعدی laneهای طولانی‌تر را زودتر شروع کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest laneهای weighted بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ طرح CI برای laneهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` gate بومی GitHub برای package است: «آیا این tarball قابل نصب به‌عنوان محصول کار می‌کند؟» یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` آپلود می‌کند، سپس laneهای reusable Docker E2E را در برابر همان tarball دقیق اجرا می‌کند به‌جای اینکه ref انتخاب‌شده را دوباره بسته‌بندی کند. profileها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/update/plugin، ماتریس survivor ارتقای منتشرشده، پیش‌فرض‌های انتشار، و triage شکست، [آزمون به‌روزرسانی‌ها و پلاگین‌ها](/fa/help/testing-updates-plugins) را ببینید.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده ایستای `dist/entry.js` و `dist/cli/run-main.js` را پیمایش می‌کند و اگر importهای startup پیش از dispatch، وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch فرمان وارد کنند، شکست می‌خورد؛ همچنین chunk اجرای Gateway همراه را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای cold شناخته‌شده Gateway را رد می‌کند. دودآزمایی CLI بسته‌بندی‌شده همچنین root help، onboard help، doctor help، status، config schema، و یک فرمان model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance در `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط شکاف‌های metadata مربوط به packageهای shipped را تحمل می‌کند: ورودی‌های private QA inventory حذف‌شده، `gateway install --wrapper` گم‌شده، فایل‌های patch گم‌شده در fixture git مشتق‌شده از tarball، `update.channel` persisted گم‌شده، محل‌های legacy برای plugin install-record، persistence گم‌شده install-record marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، آن مسیرها شکست‌های سخت‌گیرانه هستند.
- اجراکننده‌های container smoke: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح‌بالاتر را راستی‌آزمایی می‌کنند.

اجراکننده‌های Docker مربوط به live-model همچنین فقط homeهای auth موردنیاز CLI را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه homeهای پشتیبانی‌شده را)، سپس آن‌ها را پیش از اجرا در home کانتینر کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن store احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودسنجی اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودسنجی backend مربوط به CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودسنجی harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودسنجی مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی بررسی سورس QA است. عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- دودسنجی زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر onboarding (TTY، scaffold کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودسنجی onboarding/کانال/عامل با tarball مربوط به npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت global در Docker نصب می‌کند، OpenAI را از طریق onboarding مبتنی بر ارجاع env به‌همراه Telegram به‌صورت پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، بازسازی میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.
- دودسنجی تعویض کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت global در Docker نصب می‌کند، از package `stable` به git `dev` تغییر می‌دهد، کانال پایدارشده و کارکرد Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به package `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودسنجی survivor ارتقا: `pnpm test:docker:upgrade-survivor`، tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمیِ کثیف با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده زنده یا کانال اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- دودسنجی survivor ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستور پخته‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway loopback را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهد، و fixtureهای شبیه issue را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند؛ Full Release Validation از baseline پیش‌فرض latest در مسیر مسدودکننده استفاده می‌کند و فقط برای `run_release_soak=true` یا `release_profile=full` به all-since/reported-issues گسترش می‌دهد.
- دودسنجی context زمان اجرای session: `pnpm test:docker:session-runtime-context` پایداری رونوشت context زمان اجرای پنهان به‌همراه تعمیر doctor برای شاخه‌های تکراریِ prompt-rewrite تحت تأثیر را تأیید می‌کند.
- دودسنجی نصب global با Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، ارائه‌دهندگان تصویر bundled را برمی‌گرداند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک image ساخته‌شده Docker با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دودسنجی Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را بین containerهای root، update و direct-npm خود به‌اشتراک می‌گذارد. دودسنجی update به‌طور پیش‌فرض قبل از ارتقا به tarball نامزد، npm `latest` را به‌عنوان baseline stable استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` یا در GitHub با ورودی `update_baseline_version` در workflow نصب Smoke بازنویسی کنید. بررسی‌های نصب‌کننده غیر root یک cache ایزوله npm نگه می‌دارند تا entryهای cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache مربوط به root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI نصب Smoke، به‌روزرسانی global تکراری direct-npm را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودسنجی CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض image Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در home ایزوله container seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار workspace حفظ‌شده را تأیید می‌کند. image install-smoke را با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودسنجی snapshot مربوط به Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) image سورس E2E به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند که snapshotهای نقش CDP، URLهای لینک، clickables ارتقایافته توسط cursor، ارجاع‌های iframe، و metadata فریم را پوشش می‌دهند.
- رگرسیون استدلال حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema ارائه‌دهنده را اجبار می‌کند و بررسی می‌کند جزئیات خام در logهای Gateway ظاهر می‌شود.
- bridge کانال MCP (Gateway seed شده + bridge stdio + دودسنجی frame اعلان خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP مربوط به bundle در Pi (سرور MCP واقعی stdio + دودسنجی allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودسنجی نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist شده، refهای متحرک git، ClawHub kitchen-sink، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا زوج package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- دودسنجی بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودسنجی ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix`، tarball بسته‌بندی‌شده OpenClaw را در یک container خالی نصب می‌کند، یک Plugin مربوط به npm را نصب می‌کند، enable/disable را toggle می‌کند، آن را از طریق یک registry محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس تأیید می‌کند uninstall همچنان وضعیت stale را حذف می‌کند و در همان حال metricهای RSS/CPU را برای هر فاز چرخه عمر log می‌کند.
- دودسنجی metadata بازبارگذاری پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` دودسنجی نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoist شده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، enable، disable، upgrade، downgrade و uninstall در صورت نبود کد را برای Plugin مربوط به npm با ردیابی منابع پوشش می‌دهد.

برای پیش‌ساخت و استفاده دوباره از image عملکردی مشترک به‌صورت دستی:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های image ویژه suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک image مشترک remote اشاره کند، اگر از قبل local نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار package/install را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را در یک workdir موقت داخل container آماده‌سازی می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد و در عین حال Vitest را روی همان source/config محلی دقیق شما اجرا می‌کند.
مرحله آماده‌سازی cacheهای بزرگِ فقط محلی و خروجی‌های build برنامه، مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__` و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle را رد می‌کند تا اجراهای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای مخصوص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده Gateway،
workerهای کانال واقعی Telegram/Discord/غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است
پوشش زنده Gateway را از آن lane Docker محدود یا مستثنا کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز
عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container Gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container Open WebUI pin‌شده را در برابر آن Gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models`، `openclaw/default` را expose می‌کند، سپس یک
درخواست chat واقعی را از طریق proxy `/api/chat/completions` متعلق به Open WebUI ارسال می‌کند.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم داشته باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم داشته باشد راه‌اندازی سرد خودش را کامل کند.
این lane انتظار یک کلید مدل زنده قابل استفاده را دارد، و `OPENCLAW_PROFILE_FILE`
(به‌طور پیش‌فرض `~/.profile`) راه اصلی فراهم کردن آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به یک حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک container Gateway با داده seeded را boot می‌کند،
container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف مکالمه routed، خواندن transcriptها، metadata پیوست‌ها،
رفتار صف رویداد زنده، مسیریابی ارسال outbound، و اعلان‌های کانال + permission به سبک Claude را روی bridge واقعی stdio MCP بررسی می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را validate کند که
bridge واقعاً emit می‌کند، نه فقط چیزی را که یک client SDK مشخص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
image Docker repo را build می‌کند، یک server probe واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime داخلی Pi bundle
MCP materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging`،
toolهای `bundle-mcp` را نگه می‌دارند در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد.
یک Gateway seeded با یک server probe واقعی stdio MCP را شروع می‌کند، یک
turn ایزوله cron و یک turn child یک‌باره `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند
process child متعلق به MCP پس از هر اجرا خارج می‌شود.

smoke دستی رشته ACP با زبان ساده (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing رشته ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای testها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های config/workspace موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای installهای cache‌شده CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها داخل `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنتاج شده‌اند mount می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلتر کردن providerها درون container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده مجدد از image موجود `openclaw:local-live` در اجرای دوباره‌ای که به rebuild نیاز ندارد
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentialها از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که توسط smoke Open WebUI استفاده می‌شود
- `OPENWEBUI_IMAGE=...` برای override کردن tag image pin‌شده Open WebUI

## صحت‌سنجی مستندات

پس از ویرایش مستندات، checkهای docs را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون‌صفحه‌ای هم نیاز دارید، validation کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (CI-safe)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- tool calling مربوط به Gateway (OpenAI mock، Gateway واقعی + loop عامل): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard مربوط به Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## ارزیابی‌های قابلیت اعتماد عامل (Skills)

ما از قبل چند test CI-safe داریم که مثل «ارزیابی‌های قابلیت اعتماد عامل» رفتار می‌کنند:

- tool-calling mock از طریق Gateway واقعی + loop عامل (`src/gateway/gateway.test.ts`).
- flowهای wizard انتهابه‌انتها که wiring session و اثرهای config را validate می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست شده‌اند، آیا عامل skill درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **تطابق:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و steps/args لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چند-turn که ترتیب tool، carryover تاریخچه session، و boundaryهای sandbox را assert می‌کنند.

ارزیابی‌های آینده باید اول deterministic بمانند:

- یک scenario runner با استفاده از providerهای mock برای assert کردن tool callها + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- ارزیابی‌های زنده اختیاری (opt-in، env-gated) فقط پس از آماده شدن suite CI-safe.

## آزمون‌های قرارداد (شکل Plugin و کانال)

آزمون‌های قرارداد بررسی می‌کنند که هر Plugin و کانال ثبت‌شده با
قرارداد interface خودش منطبق است. آن‌ها روی همه Pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های seam مشترک و smoke را رد می‌کند؛ وقتی سطح‌های مشترک کانال یا provider را لمس می‌کنید،
دستورهای contract را صریح اجرا کنید.

### دستورها

- همه قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای provider: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **Plugin** - شکل پایه Plugin (id، name، capabilities)
- **setup** - قرارداد wizard راه‌اندازی
- **session-binding** - رفتار binding session
- **outbound-payload** - ساختار payload پیام
- **inbound** - مدیریت پیام inbound
- **actions** - handlerهای action کانال
- **threading** - مدیریت thread ID
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال policy گروه

### قراردادهای status provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای status کانال
- **registry** - شکل registry Plugin

### قراردادهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - قرارداد flow احراز هویت
- **auth-choice** - انتخاب/گزینش احراز هویت
- **catalog** - API catalog مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime provider
- **shape** - شکل/interface Plugin
- **wizard** - wizard راه‌اندازی

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک کانال یا provider Plugin
- پس از refactor کردن registration یا discovery مربوط به Plugin

آزمون‌های قرارداد در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- اگر ممکن است یک regression CI-safe اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را محدود و از طریق env varها opt-in نگه دارید
- کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/بازپخش request provider → test مستقیم models
  - bug مربوط به pipeline Gateway session/history/tool → smoke زنده Gateway یا test mock CI-safe برای Gateway
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر class از SecretRef یک target نمونه derive می‌کند، سپس assert می‌کند که exec idهای دارای traversal-segment رد می‌شوند.
  - اگر یک خانواده target جدید `includeInPlan` برای SecretRef در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. این test عمداً روی target idهای class‌بندی‌نشده fail می‌شود تا classهای جدید بی‌صدا skip نشوند.

## مرتبط

- [آزمون زنده](/fa/help/testing-live)
- [آزمون updateها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
