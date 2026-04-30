---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن تست‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت تست: مجموعه‌های تست واحد/e2e/زنده، اجراکننده‌های Docker، و اینکه هر تست چه چیزی را پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-04-30T18:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و چه چیزهایی را عمدا پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را برمی‌گزینند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح فرمان، نگارش سناریو.
- [Matrix QA](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده با مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های اختصاصی QA در پایین ([اجراکننده‌های اختصاصی QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

بیشتر روزها:

- دروازه کامل (پیش از push انتظار می‌رود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعه به‌صورت محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- چرخه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست منفرد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA مبتنی بر Docker: `pnpm qa:lab:up`
- مسیر QA مبتنی بر VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- دروازه پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (به اعتبارنامه‌های واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + وارسی‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- پیمایش مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌همراه یک وارسی کوچک شبیه خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک نیز اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، وارسی‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار قابل استفاده مجدد زنده/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند؛ این شامل کارهای جداگانه ماتریس مدل زنده Docker
    است که بر اساس ارائه‌دهنده شارد شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` اجرا کنید.
  - رازهای جدید و پرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌همراه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشاری آن اضافه کنید.
- آزمون smoke گفت‌وگوی محدودشده بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویری
    به‌جای ACP از مسیر اتصال بومی Plugin عبور می‌کنند.
- آزمون smoke هارنس app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق هارنس app-server مربوط به Codex که مالک آن Plugin است اجرا می‌کند،
    `/codex status` و `/codex models` را تأیید می‌کند، و به‌صورت پیش‌فرض وارسی‌های تصویر،
    cron MCP، زیرعامل و Guardian را تمرین می‌دهد. هنگام جداسازی دیگر شکست‌های app-server مربوط به Codex،
    وارسی زیرعامل را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید.
    برای بررسی متمرکز زیرعامل، دیگر وارسی‌ها را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این اجرا پس از وارسی زیرعامل خارج می‌شود، مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- آزمون smoke فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و مضاعف برای سطح فرمان نجات کانال پیام.
    این اجرا `/crestodian status` را تمرین می‌دهد، یک تغییر مدل پایدار را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن ممیزی/پیکربندی را تأیید می‌کند.
- آزمون smoke برنامه‌ریز Crestodian در Docker: `pnpm test:docker:crestodian-planner`
  - Crestodian را در کانتینری بدون پیکربندی با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و تأیید می‌کند که بازگشت برنامه‌ریز fuzzy به یک نوشتن پیکربندی تایپ‌شده و ممیزی‌شده
    ترجمه می‌شود.
- آزمون smoke اجرای نخست Crestodian در Docker: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Plugin مربوط به Discord + SecretRef را اعمال می‌کند،
    پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های ممیزی را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- آزمون smoke هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید JSON، Moonshot/K2.6 را گزارش می‌کند و
  رونوشت دستیار `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، ترجیح دهید آزمون‌های زنده را از طریق متغیرهای محیطی allowlist که در پایین توضیح داده شده‌اند محدود کنید.
</Tip>

## اجراکننده‌های اختصاصی QA

این فرمان‌ها وقتی به واقع‌گرایی QA-lab نیاز دارید، کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. `Parity gate` روی PRهای مطابق و
از اجرای دستی با ارائه‌دهنده‌های ساختگی اجرا می‌شود. `QA-Lab - All Lanes` هر شب روی
`main` و از اجرای دستی با دروازه برابری ساختگی، مسیر زنده Matrix،
مسیر زنده Telegram مدیریت‌شده با Convex، و مسیر زنده Discord مدیریت‌شده با Convex به‌عنوان
کارهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix `--profile fast`
را صراحتا پاس می‌دهند، درحالی‌که مقدار پیش‌فرض Matrix CLI و ورودی گردش‌کار دستی
`all` باقی می‌ماند؛ اجرای دستی می‌تواند `all` را به کارهای `transport`، `media`، `e2ee-smoke`،
`e2ee-deep`، و `e2ee-cli` شارد کند. `OpenClaw Release Checks` پیش از تأیید انتشار،
برابری به‌همراه مسیرهای سریع Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از
`mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند و از راه‌اندازی عادی provider-plugin
دوری کنند. این Gatewayهای انتقال زنده جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان
توسط مجموعه‌های برابری QA پوشش داده می‌شود.

شاردهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` را دارد. شاردهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده
ساخته می‌شود، سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` می‌کشند، نه اینکه داخل هر شارد
دوباره بسازند.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتیبانی‌شده با مخزن را مستقیما روی میزبان اجرا می‌کند.
  - به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند.
    `qa-channel` به‌صورت پیش‌فرض هم‌زمانی 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده).
    برای تنظیم تعداد workerها از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر
    `--concurrency 1` را به‌کار ببرید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده
    می‌خواهید، از `--allow-failures` استفاده کنید.
  - حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai`، و `aimock` را پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture و mock پروتکل
    بدون جایگزین‌کردن مسیر آگاه از سناریوی `mock-openai` راه‌اندازی می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway به‌همراه یک بسته کوچک سناریوی ساختگی QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه مشاهده CPU ترکیبی
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهده‌های CPU داغ پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn`
    به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان متریک ثبت می‌شوند
    بدون اینکه شبیه رگرسیون peg چنددقیقه‌ای Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد،
    ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکس یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - از همان پرچم‌های انتخاب ارائه‌دهنده/مدل مانند `qa suite` استفاده می‌کند.
  - اجراهای زنده ورودی‌های auth پشتیبانی‌شده QA را که برای مهمان عملی هستند منتقل می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و `CODEX_HOME`
    وقتی موجود باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق فضای کاری mount‌شده
    دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌همراه لاگ‌های Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت سراسری در
    Docker نصب می‌کند، onboarding غیرتعاملی کلید OpenAI API را اجرا می‌کند، به‌صورت پیش‌فرض Telegram
    را پیکربندی می‌کند، تأیید می‌کند فعال‌سازی Plugin وابستگی‌های runtime را در زمان نیاز نصب می‌کند،
    doctor را اجرا می‌کند، و یک نوبت عامل محلی را در برابر endpoint ساختگی OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌ای با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک آزمون smoke قطعی Docker برای برنامه ساخته‌شده و رونوشت‌های زمینه runtime توکار اجرا می‌کند.
    تأیید می‌کند زمینه runtime پنهان OpenClaw به‌جای نشت به نوبت کاربر قابل مشاهده، به‌عنوان یک پیام سفارشی
    غیرنمایشی پایدار می‌شود، سپس یک جلسه JSONL خراب و متأثر را seed می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را با یک پشتیبان به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک نامزد بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر زنده QA مربوط به Telegram را
    با همان بسته نصب‌شده به‌عنوان Gateway سیستم تحت آزمون دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید تا به‌جای نصب از registry، یک tarball محلی حل‌شده
    را آزمون کنید.
  - از همان اعتبارنامه‌های env مربوط به Telegram یا منبع اعتبارنامه Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای خودکارسازی CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه
    `OPENCLAW_QA_CONVEX_SITE_URL` و راز نقش تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و راز نقش Convex در CI موجود باشند،
    wrapper Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`، مقدار مشترک
    `OPENCLAW_QA_CREDENTIAL_ROLE` را فقط برای این مسیر override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی نگه‌دارنده
    `NPM Telegram Beta E2E` در دسترس قرار می‌دهد. روی merge اجرا نمی‌شود. این گردش‌کار از محیط
    `qa-live-shared` و اجاره‌های اعتبارنامه Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول به‌صورت اجرای جانبی
  در برابر یک بسته نامزد در دسترس قرار می‌دهد. یک ref مورد اعتماد، spec منتشرشده npm،
  URL tarball مبتنی بر HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` بارگذاری می‌کند، سپس
  زمان‌بند Docker E2E موجود را با پروفایل‌های مسیر smoke، package، product، full، یا custom اجرا می‌کند.
  برای اجرای گردش‌کار QA مربوط به Telegram در برابر همان artifact `package-under-test`،
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

- اثبات آرتیفکت، یک آرتیفکت tarball را از یک اجرای دیگر Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - بیلد فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را با پیکربندی OpenAI راه‌اندازی می‌کند، سپس کانال‌ها/Pluginهای همراه را از طریق ویرایش‌های پیکربندی فعال می‌کند.
  - تأیید می‌کند که کشف راه‌اندازی، وابستگی‌های زمان اجرای Pluginهای پیکربندی‌نشده را غایب نگه می‌دارد، نخستین اجرای Gateway یا doctor پیکربندی‌شده وابستگی‌های زمان اجرای هر Plugin همراه را در صورت نیاز نصب می‌کند، و راه‌اندازی مجدد دوم وابستگی‌هایی را که قبلاً فعال شده‌اند دوباره نصب نمی‌کند.
  - همچنین یک مبنای npm قدیمی شناخته‌شده را نصب می‌کند، Telegram را پیش از اجرای `openclaw update --tag <candidate>` فعال می‌کند، و تأیید می‌کند که doctor پس از به‌روزرسانی نامزد، وابستگی‌های زمان اجرای کانال همراه را بدون تعمیر postinstall در سمت harness اصلاح می‌کند.
- `pnpm test:parallels:npm-update`
  - اسموک به‌روزرسانی نصب بسته‌بندی‌شده بومی را در میان مهمان‌های Parallels اجرا می‌کند. هر پلتفرم انتخاب‌شده ابتدا بسته مبنای درخواستی را نصب می‌کند، سپس فرمان نصب‌شده `openclaw update` را در همان مهمان اجرا می‌کند و نسخه نصب‌شده، وضعیت به‌روزرسانی، آمادگی Gateway، و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام تکرار روی یک مهمان، از `--platform macos`،‏ `--platform windows`، یا `--platform linux` استفاده کنید. برای مسیر آرتیفکت خلاصه و وضعیت هر lane از `--json` استفاده کنید.
  - lane مربوط به OpenAI به‌صورت پیش‌فرض از `openai/gpt-5.5` برای اثبات نوبت agent زنده استفاده می‌کند. هنگام اعتبارسنجی آگاهانه یک مدل OpenAI دیگر، `--model <provider/model>` را ارسال کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان بپیچید تا توقف‌های انتقال Parallels نتوانند باقی پنجره تست را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت لاگ‌های lane تودرتو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از فرض اینکه wrapper بیرونی گیر کرده است، `windows-update.log`،‏ `macos-update.log`، یا `linux-update.log` را بررسی کنید.
  - به‌روزرسانی Windows می‌تواند روی یک مهمان سرد، ۱۰ تا ۱۵ دقیقه را در تعمیر وابستگی‌های doctor/زمان اجرا پس از به‌روزرسانی صرف کند؛ وقتی لاگ debug تودرتوی npm در حال پیشروی است، این وضعیت همچنان سالم است.
  - این wrapper تجمیعی را به‌صورت موازی با laneهای اسموک منفرد macOS،‏ Windows، یا Linux در Parallels اجرا نکنید. آن‌ها وضعیت VM را به اشتراک می‌گذارند و می‌توانند روی بازیابی snapshot، سرو package، یا وضعیت Gateway مهمان با هم برخورد کنند.
  - اثبات پس از به‌روزرسانی سطح عادی Pluginهای همراه را اجرا می‌کند، زیرا facadeهای قابلیت مانند گفتار، تولید تصویر، و درک رسانه از طریق APIهای زمان اجرای همراه بارگذاری می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور provider محلی AIMock را برای تست اسموک مستقیم پروتکل راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - lane زنده QA مربوط به Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط source-checkout؛ نصب‌های بسته‌بندی‌شده `qa-lab` را ارسال نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، متغیرهای محیطی، و چیدمان آرتیفکت: [QA ماتریکس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - lane زنده QA مربوط به Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای bot مربوط به driver و SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`،‏ `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. id گروه باید id عددی چت Telegram باشد.
  - برای اعتبارنامه‌های pooled مشترک از `--credential-source convex` پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت env استفاده کنید، یا برای انتخاب leaseهای pooled،‏ `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریو شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، به‌طوری که bot مربوط به SUT یک نام کاربری Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید bot مربوط به driver می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA مربوط به Telegram، خلاصه، و آرتیفکت پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

laneهای انتقال زنده یک قرارداد استاندارد مشترک را به اشتراک می‌گذارند تا انتقال‌های جدید دچار انحراف نشوند؛ ماتریس پوشش هر lane در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری را از یک pool با پشتوانه Convex دریافت می‌کند، در زمان اجرای lane برای آن lease Heartbeat می‌فرستد، و در زمان shutdown lease را آزاد می‌کند.

اسکفولد پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای env موردنیاز:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض Env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci`، در غیر این صورت `maintainer`)

متغیرهای env اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id ردیابی اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با `http://` روی loopback برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

فرمان‌های admin نگه‌دارنده (افزودن/حذف/فهرست کردن pool) به‌طور مشخص به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex،‏ secretهای broker،
پیشوند endpoint، timeout مربوط به HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر secret بررسی کند. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل تلاش مجدد: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشته id عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های helper سناریو برای adapterهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارد. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest مربوط به Plugin اعلان کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های تست (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی فزاینده» در نظر بگیرید (و flakiness/هزینه فزاینده):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای هدف‌گذاری‌نشده از مجموعه shard مربوط به `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: موجودی‌های core/unit زیر `src/**/*.test.ts`،‏ `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ تست‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - تست‌های واحد خالص
  - تست‌های یکپارچه‌سازی درون‌فرایندی (auth مربوط به Gateway، مسیریابی، ابزارها، parsing، config)
  - رگرسیون‌های قطعی برای باگ‌های شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلید واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - تست‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه با
    APIهای منبع Pluginهای واقعی همراه. بارگذاری‌های API مربوط به Plugin واقعی در
    مجموعه‌های قرارداد/یکپارچه‌سازی متعلق به Plugin قرار می‌گیرند.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - اجرای بی‌هدف `pnpm test` به‌جای یک فرایند عظیم native برای root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و جلوی گرسنه‌ماندن مجموعه‌های نامرتبط توسط کارهای auto-reply/افزونه را می‌گیرد.
    - `pnpm test --watch` همچنان از گراف پروژه native ریشه `vitest.config.ts` استفاده می‌کند، چون حلقه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch` و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه شروع کامل پروژه ریشه را نمی‌پردازد.
    - `pnpm test:changed` مسیرهای git تغییریافته را به‌طور پیش‌فرض به laneهای scoped ارزان گسترش می‌دهد: ویرایش مستقیم تست‌ها، فایل‌های هم‌سطح `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های گراف import محلی. ویرایش‌های config/setup/package تست‌ها را به اجرای گسترده نمی‌برند مگر اینکه صریحا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه عادی بررسی هوشمند محلی برای کارهای محدود است. diff را به core، تست‌های core، افزونه‌ها، تست‌های افزونه، apps، docs، فراداده release، ابزارسازی live Docker، و tooling طبقه‌بندی می‌کند، سپس فرمان‌های typecheck، lint و guard متناظر را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فراداده release را تغییر می‌دهند بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardی که تغییرهای package بیرون از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های live Docker ACP harness بررسی‌های متمرکز اجرا می‌کنند: syntax شل برای اسکریپت‌های احراز هویت live Docker و dry-run زمان‌بند live Docker. تغییرهای `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version و دیگر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های unit سبک از نظر import در agents، commands، plugins، helperهای auto-reply، `plugin-sdk` و ناحیه‌های utility خالص مشابه، از lane `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/سنگین از نظر runtime روی laneهای موجود می‌مانند.
    - برخی فایل‌های source کمکی `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های هم‌سطح صریح در همان laneهای سبک نگاشت می‌کنند، تا ویرایش helperها از اجرای دوباره کل مجموعه سنگین برای آن دایرکتوری پرهیز کند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*` و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای افزونه و shard فقط مخصوص release یعنی `agentic-plugins` را رد می‌کند. Full Release Validation برای آن مجموعه‌های سنگین از نظر Plugin/افزونه روی نامزدهای release، workflow فرزند جداگانه `Plugin Prerelease` را dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner تعبیه‌شده">

    - وقتی inputهای کشف message-tool یا context runtime مربوط به compaction را تغییر می‌دهید، هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای routing و normalization خالص، regressionهای helper متمرکز اضافه کنید.
    - مجموعه‌های integration runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها بررسی می‌کنند که scoped idها و رفتار compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض روی `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner غیر-isolated در پروژه‌های ریشه، e2e و پیکربندی‌های live استفاده می‌کند.
    - lane مربوط به UI ریشه setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی runner مشترک غیر-isolated اجرا می‌شود.
    - هر shard در `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرایندهای فرزند Node در Vitest اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ محلی کاهش یابد. برای مقایسه با رفتار stock V8 مقدار `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook مربوط به pre-commit فقط formatting انجام می‌دهد. فایل‌های format‌شده را دوباره stage می‌کند و lint، typecheck یا تست‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی هوشمند محلی نیاز دارید، قبل از handoff یا push صریحا `pnpm check:changed` را اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیر laneهای scoped ارزان عبور می‌کند. فقط وقتی agent تشخیص دهد یک ویرایش harness، config، package یا contract واقعا به پوشش Vitest گسترده‌تر نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند، فقط با سقف worker بالاتر.
    - مقیاس‌دهی خودکار worker محلی عمدا محافظه‌کار است و وقتی load average میزبان از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا اجرای دوباره در changed-mode هنگام تغییر wiring تست‌ها درست بماند.
    - این config مقدار `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی performance">

    - `pnpm test:perf:imports` گزارش‌گیری مدت import در Vitest به‌همراه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از `origin/main` محدود می‌کند.
    - داده timing مربوط به shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای whole-config از مسیر config به‌عنوان key استفاده می‌کنند؛ shardهای CI با include-pattern نام shard را اضافه می‌کنند تا shardهای filtered جداگانه قابل ردیابی باشند.
    - وقتی یک تست داغ هنوز بیشتر زمانش را صرف importهای startup می‌کند، dependencyهای سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و به‌جای deep-import کردن helperهای runtime فقط برای عبور دادنشان از `vi.mock(...)`، همان seam را مستقیم mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر route‌شده `test:changed` را با مسیر native ریشه-project برای آن diff commit‌شده مقایسه می‌کند و زمان wall به‌همراه حداکثر RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن فهرست فایل‌های تغییریافته از `scripts/test-projects.mjs` و پیکربندی ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` برای overhead شروع Vitest/Vite و transform یک پروفایل CPU مربوط به main-thread می‌نویسد.
    - `pnpm test:perf:profile:runner` برای مجموعه unit، در حالی که parallelism فایل غیرفعال است، پروفایل‌های CPU+heap مربوط به runner را می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارشده به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn مصنوعی پیام Gateway، memory و large-payload را از مسیر diagnostic event هدایت می‌کند
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به diagnostic stability bundle را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه pressure می‌مانند، و عمق queue برای هر session دوباره به صفر drain می‌شود
- انتظارها:
  - مناسب CI و بدون نیاز به key
  - lane محدود برای پیگیری regression پایداری، نه جایگزین مجموعه کامل Gateway

### E2E (gateway smoke)

- فرمان: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts` و تست‌های E2E مربوط به Pluginهای همراه زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: تا 2، محلی: به‌طور پیش‌فرض 1).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا overhead مربوط به console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (سقف 16).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose در console.
- دامنه:
  - رفتار end-to-end چند-instance مربوط به Gateway
  - سطح‌های WebSocket/HTTP، pairing node، و networking سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به key واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (می‌تواند کندتر باشد)

### E2E: OpenShell backend smoke

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله OpenShell را روی میزبان از طریق Docker شروع می‌کند
  - یک sandbox از Dockerfile محلی موقت ایجاد می‌کند
  - backend مربوط به OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical راه‌دور را از طریق sandbox fs bridge بررسی می‌کند
- انتظارها:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس test gateway و sandbox را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال کردن تست هنگام اجرای دستی مجموعه گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به یک binary یا wrapper script غیرپیش‌فرض CLI

### Live (providerهای واقعی + modelهای واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts` و تست‌های live مربوط به Pluginهای همراه زیر `extensions/`
- پیش‌فرض: توسط `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعا _امروز_ با credentialهای واقعی کار می‌کند؟»
  - گرفتن تغییرهای format provider، رفتارهای خاص tool-calling، مشکل‌های auth و رفتار rate limit
- انتظارها:
  - عمدا پایدار برای CI نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، quotaها، outageها)
  - هزینه دارد / از rate limit استفاده می‌کند
  - اجرای subsetهای محدود را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای live برای گرفتن API keyهای گمشده، `~/.profile` را source می‌کنند.
- به‌طور پیش‌فرض، اجراهای live همچنان `HOME` را ایزوله می‌کنند و مواد config/auth را به یک test home موقت کپی می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را mutate کنند.
- فقط وقتی عمدا نیاز دارید تست‌های live از home directory واقعی شما استفاده کنند، `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید.
- `pnpm test:live` اکنون به‌طور پیش‌فرض حالت کم‌صداتری دارد: خروجی progress با قالب `[live] ...` را نگه می‌دارد، اما notice اضافی `~/.profile` را suppress می‌کند و logهای bootstrap مربوط به gateway/Bonjour chatter را mute می‌کند. اگر می‌خواهید logهای کامل startup برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش API key (مختص provider): مقدار `*_API_KEYS` را با format comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای نمونه `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override مخصوص live را از طریق `OPENCLAW_LIVE_*_KEY` بدهید؛ تست‌ها روی پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی progress/heartbeat:
  - مجموعه‌های live اکنون خط‌های progress را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest کم‌صداست، آشکارا فعال دیده شوند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های progress مربوط به provider/gateway هنگام اجراهای live فورا stream شوند.
  - heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/تست‌ها: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید `pnpm test:coverage` را هم اجرا کنید)
- تغییر در شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من قطع است» / خرابی‌های ویژهٔ ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## تست‌های زنده (دارای تماس با شبکه)

برای ماتریس مدل زنده، اسموک‌های backend در CLI، اسموک‌های ACP، هارنس app-server در Codex، و همهٔ تست‌های زندهٔ ارائه‌دهنده‌های رسانه (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، هارنس رسانه) — به‌علاوهٔ مدیریت اعتبارنامه‌ها برای اجراهای زنده — به [تست‌کردن — مجموعه‌های زنده](/fa/help/testing-live) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زندهٔ profile-key متناظر خود را داخل تصویر Docker ریپو اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و workspace شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زندهٔ Docker به‌صورت پیش‌فرض سقف اسموک کوچک‌تری دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً اسکن جامع بزرگ‌تر را می‌خواهید، این env varها را override کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌عنوان tarball در npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکنندهٔ Node/Git برای laneهای نصب/به‌روزرسانی/وابستگی Plugin است؛ این laneها tarball ازپیش‌ساخته‌شده را mount می‌کنند. تصویر functional همان tarball را در `/app` برای laneهای عملکرد built-app نصب می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` پلن انتخاب‌شده را اجرا می‌کند. تجمیع از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای پردازش را کنترل می‌کند، درحالی‌که سقف‌های منابع مانع می‌شوند laneهای سنگین زنده، npm-install، و چندسرویسی هم‌زمان شروع شوند. اگر یک lane منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا وقتی ظرفیت دوباره در دسترس شود آن را به‌تنهایی در حال اجرا نگه می‌دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط وقتی تنظیم کنید که میزبان Docker ظرفیت بیشتری دارد. اجراکننده به‌صورت پیش‌فرض یک preflight برای Docker انجام می‌دهد، containerهای قدیمی OpenClaw E2E را حذف می‌کند، هر 30 ثانیه وضعیت را چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع laneهای طولانی‌تر در ابتدا استفاده می‌کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest وزن‌دار lane بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ پلن CI برای laneهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها استفاده کنید.
- `Package Acceptance` گیت package بومی GitHub برای این پرسش است: «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» این workflow یک package کاندیدا را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` upload می‌کند، سپس laneهای reusable Docker E2E را به‌جای repack کردن ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. `workflow_ref` اسکریپت‌های workflow/harness مورد اعتماد را انتخاب می‌کند، درحالی‌که `package_ref` commit/branch/tag مبدا را برای بسته‌بندی هنگام `source=ref` انتخاب می‌کند؛ این اجازه می‌دهد منطق پذیرش فعلی commitهای مورد اعتماد قدیمی‌تر را validate کند. Profileها بر اساس گستره مرتب شده‌اند: `smoke` نصب/کانال/agent سریع به‌علاوهٔ gateway/config است، `package` قرارداد package/update/plugin به‌علاوهٔ fixture keyless upgrade-survivor و جایگزین native پیش‌فرض برای بیشتر پوشش Parallels package/update است، `product` کانال‌های MCP، cleanup مربوط به cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI را اضافه می‌کند، و `full` chunkهای Docker مسیر انتشار را با OpenWebUI اجرا می‌کند. اعتبارسنجی انتشار یک delta سفارشی package (`bundled-channel-deps-compat plugins-offline`) به‌علاوهٔ QA package مربوط به Telegram را اجرا می‌کند، چون chunkهای Docker مسیر انتشار از قبل laneهای هم‌پوشان package/update/plugin را پوشش می‌دهند. دستورهای rerun هدفمند Docker در GitHub که از artifactها تولید می‌شوند، در صورت موجود بودن، ورودی‌های artifact package قبلی و تصویر آماده‌شده را شامل می‌شوند تا laneهای ناموفق بتوانند از ساخت دوبارهٔ package و تصویرها پرهیز کنند.
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این guard گراف static ساخته‌شده را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر startup پیش از dispatch، وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از dispatch فرمان import کند fail می‌شود؛ همچنین chunk اجرای Gateway bundle‌شده را زیر budget نگه می‌دارد و importهای static از مسیرهای cold شناخته‌شدهٔ Gateway را رد می‌کند. اسموک CLI بسته‌بندی‌شده همچنین help ریشه، help مربوط به onboard، help مربوط به doctor، status، schema پیکربندی، و یک فرمان model-list را پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata مربوط به package منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شدهٔ private QA inventory، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و migration metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، این مسیرها خرابی strict هستند.
- اجراکننده‌های اسموک container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح‌بالا را verify می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط auth homeهای CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همهٔ موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را داخل home کانتینر کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند بدون تغییر دادن auth store میزبان، tokenها را refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- آزمون دود bind در ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- آزمون دود بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- آزمون دود هارنس app-server در Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- آزمون دود مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی QA برای بررسی source-checkout است. این مسیر عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون تاربال npm شامل QA Lab نمی‌شود.
- آزمون دود زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- ویزارد راه‌اندازی اولیه (TTY، داربست کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- آزمون دود راه‌اندازی اولیه/کانال/عامل تاربال npm: `pnpm test:docker:npm-onboard-channel-agent` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه env-ref به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، تأیید می‌کند که doctor وابستگی‌های runtime مربوط به Plugin فعال‌شده را ترمیم کرده است، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک تاربال از پیش ساخته‌شده دوباره استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` بازساخت میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` کانال را تغییر دهید.
- آزمون دود تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کانال ماندگارشده و کارکرد پس از به‌روزرسانی Plugin را تأیید می‌کند، سپس به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون دود بازمانده ارتقا: `pnpm test:docker:upgrade-survivor` تاربال بسته‌بندی‌شده OpenClaw را روی یک fixture کثیفِ کاربر قدیمی با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت قدیمی وابستگی‌های runtime مربوط به Plugin، و فایل‌های workspace/session موجود نصب می‌کند. این آزمون به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده زنده یا کانال اجرا می‌کند، سپس یک Gateway loopback راه‌اندازی می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های راه‌اندازی/وضعیت را بررسی می‌کند.
- آزمون دود زمینه runtime نشست: `pnpm test:docker:session-runtime-context` ماندگاری transcript زمینه runtime پنهان، به‌همراه ترمیم doctor برای شاخه‌های تکراری آسیب‌دیده prompt-rewrite را تأیید می‌کند.
- آزمون دود نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، ارائه‌دهندگان تصویر bundled را برمی‌گرداند. با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک تاربال از پیش ساخته‌شده دوباره استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ساخت میزبان را رد کنید، یا با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`، `dist/` را از یک image ساخته‌شده Docker کپی کنید.
- آزمون دود Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را میان کانتینرهای root، update و direct-npm خود به‌اشتراک می‌گذارد. آزمون دود به‌روزرسانی به‌طور پیش‌فرض از npm `latest` به‌عنوان خط مبنای پایدار پیش از ارتقا به تاربال نامزد استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` در workflow مربوط به Install Smoke override کنید. بررسی‌های نصب‌کننده غیر-root یک cache ایزوله npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache مربوط به root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` به‌روزرسانی تکراری direct-npm سراسری را رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون دود CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض image Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در یک home کانتینری ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` از image مربوط به install-smoke دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- آزمون دود snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) image منبع E2E به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند که snapshotهای نقش CDP، URLهای پیوند، clickableهای ارتقایافته با cursor، refs iframe و metadata فریم را پوشش می‌دهند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور شبیه‌سازی‌شده OpenAI را از طریق Gateway اجرا می‌کند، تأیید می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد شدن schema ارائه‌دهنده را اجبار می‌کند و بررسی می‌کند که جزئیات خام در logهای Gateway ظاهر شود.
- پل کانال MCP (Gateway seedشده + پل stdio + آزمون دود frame اعلان خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور MCP واقعی stdio + آزمون دود allow/deny پروفایل Pi جاسازی‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند MCP در stdio پس از اجرای cron ایزوله و اجرای یک‌باره subagent): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون دود نصب، نصب/حذف نصب kitchen-sink از ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض package/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` override کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون دود بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون دود metadata بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- وابستگی‌های runtime مربوط به Plugin bundled: `pnpm test:docker:bundled-channel-deps` به‌طور پیش‌فرض یک image کوچک runner در Docker می‌سازد، OpenClaw را یک‌بار روی میزبان می‌سازد و بسته‌بندی می‌کند، سپس آن تاربال را در هر سناریوی نصب Linux mount می‌کند. با `OPENCLAW_SKIP_DOCKER_BUILD=1` از image دوباره استفاده کنید، پس از یک ساخت محلی تازه با `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` بازساخت میزبان را رد کنید، یا با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` به یک تاربال موجود اشاره کنید. aggregate کامل Docker و chunkهای bundled-channel در release-path این تاربال را یک‌بار از پیش بسته‌بندی می‌کنند، سپس بررسی‌های کانال bundled را به مسیرهای مستقل shard می‌کنند، از جمله مسیرهای به‌روزرسانی جداگانه برای Telegram، Discord، Slack، Feishu، memory-lancedb و ACPX. chunkهای release آزمون‌های دود کانال، هدف‌های به‌روزرسانی، و قراردادهای setup/runtime را به `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-b` و `bundled-channels-contracts` تقسیم می‌کنند؛ chunk تجمیعی `bundled-channels` همچنان برای اجرای مجدد دستی در دسترس می‌ماند. workflow انتشار همچنین chunkهای نصب‌کننده ارائه‌دهنده و chunkهای نصب/حذف نصب Plugin bundled را تقسیم می‌کند؛ chunkهای قدیمی `package-update`، `plugins-runtime` و `plugins-integrations` به‌عنوان aliasهای تجمیعی برای اجرای مجدد دستی باقی می‌مانند. هنگام اجرای مستقیم مسیر bundled، برای محدود کردن ماتریس کانال از `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` استفاده کنید، یا برای محدود کردن سناریوی به‌روزرسانی از `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` استفاده کنید. اجراهای Docker برای هر سناریو به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` هستند؛ سناریوی به‌روزرسانی چندهدفه به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` است. این مسیر همچنین تأیید می‌کند که `channels.<id>.enabled=false` و `plugins.entries.<id>.enabled=false` ترمیم doctor/وابستگی runtime را suppress می‌کنند.
- هنگام تکرار و توسعه، وابستگی‌های runtime مربوط به Plugin bundled را با غیرفعال کردن سناریوهای نامرتبط محدود کنید، برای مثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

برای ساخت از پیش و استفاده دوباره دستی از image عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

overrideهای image ویژه suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان هنگام تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک image مشترک remote اشاره می‌کند، اگر آن image از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای خودشان را نگه می‌دارند چون به‌جای runtime برنامه ساخته‌شده مشترک، رفتار بسته/نصب را اعتبارسنجی می‌کنند.

رانرهای Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را داخل container در یک workdir موقت stage می‌کنند. این کار image runtime را
کم‌حجم نگه می‌دارد، در حالی که همچنان Vitest را روی همان source/config محلی دقیق شما اجرا می‌کند.
مرحله staging از cacheهای بزرگ فقط‌محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle صرف‌نظر می‌کند تا اجرای زنده Docker چند دقیقه را صرف کپی کردن
artifactهای مختص ماشین نکند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده gateway،
workerهای واقعی کانال Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است
پوشش زنده gateway را در آن lane Docker محدود یا مستثنا کنید، `OPENCLAW_LIVE_GATEWAY_*`
را نیز pass through کنید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container Gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container پین‌شده Open WebUI را مقابل آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models`، `openclaw/default` را expose کند، سپس یک
درخواست chat واقعی را از طریق proxy `/api/chat/completions` متعلق به Open WebUI ارسال می‌کند.
اجرای نخست می‌تواند به‌شکل محسوسی کندتر باشد، چون Docker ممکن است لازم داشته باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم داشته باشد cold-start setup خودش را تمام کند.
این lane به یک key مدل زنده قابل‌استفاده نیاز دارد، و `OPENCLAW_PROFILE_FILE`
(به‌صورت پیش‌فرض `~/.profile`) راه اصلی ارائه آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمدا deterministic است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک container Gateway
seedشده را boot می‌کند، container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف conversationهای routed، خواندن transcriptها، metadata attachment،
رفتار queue رویداد زنده، routing ارسال outbound، و اعلان‌های channel +
permission به سبک Claude را از طریق bridge واقعی stdio MCP بررسی می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیما inspect می‌کند تا smoke همان چیزی را اعتبارسنجی کند که
bridge واقعا emit می‌کند، نه فقط آنچه یک client SDK خاص اتفاقا surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به key مدل زنده نیاز ندارد.
image Docker repo را build می‌کند، یک server واقعی probe stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime تعبیه‌شده MCP bundle
Pi materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging`
toolهای `bundle-mcp` را نگه دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به key مدل زنده نیاز ندارد.
یک Gateway seedشده را با یک server واقعی probe stdio MCP شروع می‌کند، یک turn
cron ایزوله و یک turn child یک‌باره `/subagents spawn` را اجرا می‌کند، سپس بررسی می‌کند که
process فرزند MCP پس از هر اجرا خارج شود.

Smoke دستی thread زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing thread ACP لازم شود، بنابراین آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای testها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از config/workspace dirهای موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای installهای cached CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- dir/fileهای auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها داخل `/home/node/...` کپی می‌شوند
  - dirهای پیش‌فرض: `.minimax`
  - fileهای پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط dir/fileهای لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` inferred شده‌اند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده مجدد از image موجود `openclaw:local-live` در rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آید (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای smoke Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt nonce-check استفاده‌شده توسط smoke Open WebUI
- `OPENWEBUI_IMAGE=...` برای override کردن tag image پین‌شده Open WebUI

## بررسی سلامت docs

پس از editهای docs، checkهای docs را اجرا کنید: `pnpm check:docs`.
وقتی به checkهای heading داخل صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## Regression آفلاین (CI-safe)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool در Gateway (OpenAI mock، gateway واقعی + loop عامل): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + auth enforce شده): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت اتکای عامل (skills)

ما از قبل چند test CI-safe داریم که مثل «evalهای قابلیت اتکای عامل» رفتار می‌کنند:

- فراخوانی tool mock از طریق gateway واقعی + loop عامل (`src/gateway/gateway.test.ts`).
- جریان‌های wizard end-to-end که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

آنچه هنوز برای skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست می‌شوند، آیا عامل skill درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **انطباق:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و step/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** scenarioهای multi-turn که ترتیب tool، انتقال history session، و مرزهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن tool callها + ترتیب، خواندن fileهای skill، و wiring session.
- یک suite کوچک از scenarioهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- evalهای زنده اختیاری (opt-in، env-gated) فقط پس از اینکه suite CI-safe آماده شد.

## testهای قرارداد (شکل plugin و channel)

testهای قرارداد بررسی می‌کنند که هر plugin و channel ثبت‌شده با
قرارداد interface خود منطبق باشد. آن‌ها روی همه pluginهای discoverشده iterate می‌کنند و یک suite از
assertionهای shape و behavior را اجرا می‌کنند. lane unit پیش‌فرض `pnpm test` عمدا
این fileهای smoke و seam مشترک را skip می‌کند؛ وقتی surfaceهای channel یا provider مشترک را touch می‌کنید،
commandهای قرارداد را صریح اجرا کنید.

### commandها

- همه قراردادها: `pnpm test:contracts`
- فقط قراردادهای channel: `pnpm test:contracts:channels`
- فقط قراردادهای provider: `pnpm test:contracts:plugins`

### قراردادهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه plugin (id، name، capabilities)
- **setup** - قرارداد setup wizard
- **session-binding** - رفتار binding session
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام inbound
- **actions** - handlerهای action کانال
- **threading** - handling شناسه thread
- **directory** - API دایرکتوری/roster
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
- **discovery** - discovery plugin
- **loader** - loading plugin
- **runtime** - runtime provider
- **shape** - شکل/interface plugin
- **wizard** - setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا اصلاح یک channel یا provider plugin
- پس از refactor کردن registration یا discovery plugin

testهای قرارداد در CI اجرا می‌شوند و به keyهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- اگر ممکن است یک regression CI-safe اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق request-shape)
- اگر ذاتا فقط live است (rate limitها، policyهای auth)، test زنده را محدود نگه دارید و با env varها opt-in کنید
- ترجیح دهید کوچک‌ترین layerی را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/replay درخواست provider → test مستقیم models
  - bug pipeline gateway session/history/tool → smoke زنده gateway یا test mock gateway CI-safe
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر class هدف SecretRef یک target sampled استخراج می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر خانواده target جدید `includeInPlan` SecretRef را در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. test عمدا روی target idهای دسته‌بندی‌نشده fail می‌شود تا classهای جدید بی‌صدا skip نشوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [CI](/fa/ci)
