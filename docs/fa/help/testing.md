---
read_when:
    - اجرای تست‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای اشکال‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمون: مجموعه‌های آزمون واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-01T11:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچگی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «چگونه آزمایش می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمداً چه چیزهایی را _پوشش نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام دستورها را اجرا کنید.
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** به‌صورت جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح دستور، تألیف سناریو.
- [Matrix QA](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که سناریوهای مبتنی بر مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در پایین ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- دروازه کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی ماشینی با منابع کافی: `pnpm test:max`
- چرخه مستقیم watch برای Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست واحد در حال تکرار هستید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA مبتنی بر Docker: `pnpm qa:lab:up`
- مسیر QA مبتنی بر VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- دروازه پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (به اعتبارنامه‌های واقعی نیاز دارد):

- مجموعه زنده (مدل‌ها + کاوشگرهای ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- پیمایش مدل زنده در Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک کاوشگر کوچک شبیه خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، کاوشگرهای اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو گردش‌کار قابل‌استفاده‌مجدد زنده/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند که شامل jobهای جداگانه ماتریس مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای مجدد متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` اجرا کنید.
  - secretهای ارائه‌دهنده با سیگنال بالا را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- دودآزمون گفت‌وگوی bound بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک
    DM مصنوعی Slack را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌دهد، سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویر
    از طریق binding بومی Plugin به‌جای ACP مسیریابی می‌شوند.
- دودآزمون harness مربوط به app-server در Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق harness app-server متعلق به Plugin در Codex اجرا می‌کند،
    `/codex status` و `/codex models` را تأیید می‌کند، و به‌طور پیش‌فرض کاوشگرهای تصویر،
    cron MCP، زیرعامل، و Guardian را تمرین می‌دهد. هنگام جداسازی سایر شکست‌های
    app-server در Codex، کاوشگر زیرعامل را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز زیرعامل، سایر کاوشگرها را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این کار پس از کاوشگر زیرعامل خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- دودآزمون دستور rescue در Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و مضاعف برای سطح دستور rescue کانال پیام.
    این آزمون `/crestodian status` را تمرین می‌دهد، یک تغییر مدل پایدار را صف می‌کند،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را تأیید می‌کند.
- دودآزمون Docker برای planner در Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون config با یک CLI جعلی Claude روی `PATH`
    اجرا می‌کند و تأیید می‌کند fallback برنامه‌ریز fuzzy به یک نوشتن config تایپ‌شده و auditشده
    ترجمه می‌شود.
- دودآزمون Docker برای اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian مسیریابی می‌کند، نوشتن‌های setup/model/agent/Discord Plugin + SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند، و ورودی‌های audit را تأیید می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- دودآزمون هزینه Moonshot/Kimi: با تنظیم بودن `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید JSON گزارش Moonshot/K2.6 را نشان می‌دهد و
  transcript دستیار، `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که پایین‌تر توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

این دستورها وقتی به واقع‌گرایی QA-lab نیاز دارید کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. `Parity gate` روی PRهای منطبق و
از dispatch دستی با ارائه‌دهنده‌های mock اجرا می‌شود. `QA-Lab - All Lanes` هر شب روی
`main` و از dispatch دستی با mock parity gate، مسیر زنده Matrix،
مسیر زنده Telegram مدیریت‌شده توسط Convex، و مسیر زنده Discord مدیریت‌شده توسط Convex به‌عنوان
jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix `--profile fast`
را صراحتاً ارسال می‌کنند، درحالی‌که ورودی پیش‌فرض Matrix CLI و گردش‌کار دستی همچنان
`all` باقی می‌ماند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`، `media`، `e2ee-smoke`،
`e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release Checks` پیش از تأیید انتشار،
parity به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از
`mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند و از راه‌اندازی عادی provider-plugin
اجتناب شود. این Gatewayهای انتقال زنده جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان
توسط مجموعه‌های parity مربوط به QA پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/backend زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که برای هر commit انتخاب‌شده
یک‌بار ساخته می‌شود، سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` می‌کشند به‌جای اینکه
داخل هر shard دوباره بسازند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - چند سناریوی انتخاب‌شده را به‌طور پیش‌فرض با workerهای Gateway ایزوله به‌صورت موازی اجرا می‌کند.
    `qa-channel` به‌طور پیش‌فرض concurrency 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده).
    برای تنظیم تعداد worker از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر
    `--concurrency 1` را به‌کار ببرید.
  - اگر هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون کد خروج شکست‌خورده
    می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai`، و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture
    و protocol-mock بدون جایگزین کردن مسیر سناریوآگاه `mock-openai` راه‌اندازی می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - bench راه‌اندازی Gateway به‌علاوه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه ترکیبی مشاهده CPU
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهدات CPU داغ پایدار را flag می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان metric ثبت می‌شوند
    بدون اینکه شبیه رگرسیون چنددقیقه‌ای peg شدن Gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout خروجی runtime تازه ندارد،
    ابتدا build اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکس موقت Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان نگه می‌دارد.
  - همان flagهای انتخاب ارائه‌دهنده/مدل را مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های auth پشتیبانی‌شده QA را که برای مهمان عملی هستند forward می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر config ارائه‌دهنده زنده QA، و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق workspace mounted
    خروجی را برگرداند.
  - گزارش + خلاصه معمول QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را در Docker به‌صورت global نصب می‌کند،
    onboarding غیرتعاملی کلید OpenAI API را اجرا می‌کند، به‌طور پیش‌فرض Telegram را پیکربندی می‌کند،
    تأیید می‌کند فعال‌سازی Plugin وابستگی‌های runtime را به‌صورت درخواستی نصب می‌کند،
    doctor را اجرا می‌کند، و یک نوبت عامل محلی را در برابر endpoint mockشده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌شده با Discord، از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک دودآزمون Docker قطعی برای transcriptهای context runtime جاسازی‌شده در اپ ساخته‌شده اجرا می‌کند.
    تأیید می‌کند context runtime پنهان OpenClaw به‌عنوان یک پیام سفارشی غیرنمایشی persisted می‌شود
    به‌جای اینکه به نوبت کاربر قابل‌مشاهده نشت کند، سپس یک session JSONL خراب متأثر را seed می‌کند
    و تأیید می‌کند `openclaw doctor --fix` آن را با یک backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک کاندید بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر زنده Telegram QA را با همان
    بسته نصب‌شده به‌عنوان Gateway SUT دوباره استفاده می‌کند.
  - پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن یک tarball محلی resolveشده به‌جای
    نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان اعتبارنامه‌های env مربوط به Telegram یا منبع اعتبارنامه Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` به‌علاوه
    `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند،
    wrapper Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer`، مقدار مشترک
    `OPENCLAW_QA_CREDENTIAL_ROLE` را فقط برای این مسیر override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی maintainer
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این گردش‌کار از محیط
    `qa-live-shared` و leaseهای اعتبارنامه CI مربوط به Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run
  در برابر یک بسته کاندید ارائه می‌کند. یک ref قابل‌اعتماد، spec منتشرشده npm،
  URL tarball با HTTPS به‌همراه SHA-256، یا artifact tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` آپلود می‌کند، سپس
  زمان‌بند Docker E2E موجود را با profileهای مسیر smoke، package، product، full، یا custom اجرا می‌کند.
  برای اجرای گردش‌کار Telegram QA در برابر همان artifact `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - اثبات محصول برای آخرین beta:

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

- اثبات مصنوع، یک مصنوع tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - بیلد فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را
    با پیکربندی OpenAI راه‌اندازی می‌کند، سپس کانال/Pluginهای همراه را از طریق ویرایش‌های پیکربندی
    فعال می‌کند.
  - بررسی می‌کند که کشف راه‌اندازی، وابستگی‌های زمان اجرای Plugin پیکربندی‌نشده را
    غایب باقی می‌گذارد، نخستین اجرای Gateway پیکربندی‌شده یا doctor، وابستگی‌های زمان اجرای هر Plugin
    همراه را در زمان نیاز نصب می‌کند، و راه‌اندازی مجدد دوم، وابستگی‌هایی را که از قبل فعال شده‌اند
    دوباره نصب نمی‌کند.
  - همچنین یک خط پایه قدیمی‌تر شناخته‌شده از npm را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>` Telegram را فعال می‌کند، و بررسی می‌کند که doctor پس از به‌روزرسانی
    نامزد، وابستگی‌های زمان اجرای کانال همراه را بدون تعمیر postinstall در سمت harness
    ترمیم می‌کند.
- `pnpm test:parallels:npm-update`
  - دودآزمایی به‌روزرسانی نصب بسته‌بندی‌شده بومی را در مهمان‌های Parallels اجرا می‌کند. هر
    سکوی انتخاب‌شده ابتدا بسته خط پایه درخواستی را نصب می‌کند، سپس دستور
    `openclaw update` نصب‌شده را در همان مهمان اجرا می‌کند و نسخه نصب‌شده، وضعیت به‌روزرسانی،
    آمادگی Gateway، و یک نوبت عامل محلی را بررسی می‌کند.
  - هنگام تکرار روی یک مهمان از `--platform macos`، `--platform windows`، یا `--platform linux` استفاده کنید. برای مسیر مصنوع خلاصه و
    وضعیت هر lane از `--json` استفاده کنید.
  - lane مربوط به OpenAI به‌طور پیش‌فرض برای اثبات زنده نوبت عامل از
    `openai/gpt-5.5` استفاده می‌کند. هنگام اعتبارسنجی عمدی یک
    مدل OpenAI دیگر، `--model <provider/model>` را پاس بدهید یا
    `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان قرار دهید تا توقف‌های انتقال Parallels نتوانند
    باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت logهای lane تودرتو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از فرض کردن اینکه wrapper بیرونی هنگ کرده است، `windows-update.log`، `macos-update.log`، یا `linux-update.log`
    را بررسی کنید.
  - به‌روزرسانی Windows روی یک مهمان سرد می‌تواند ۱۰ تا ۱۵ دقیقه را در تعمیر doctor/وابستگی زمان اجرای
    پس از به‌روزرسانی صرف کند؛ تا وقتی log اشکال‌زدایی npm تودرتو در حال پیشروی است،
    این وضعیت همچنان سالم است.
  - این wrapper تجمیعی را به‌صورت موازی با laneهای دودآزمایی منفرد Parallels
    برای macOS، Windows، یا Linux اجرا نکنید. آن‌ها وضعیت VM را به اشتراک می‌گذارند و ممکن است در
    بازیابی snapshot، سرو package، یا وضعیت Gateway مهمان با هم برخورد کنند.
  - اثبات پس از به‌روزرسانی سطح عادی Plugin همراه را اجرا می‌کند، زیرا
    facadeهای قابلیت مانند گفتار، تولید تصویر، و درک رسانه
    از طریق APIهای زمان اجرای همراه بارگذاری می‌شوند، حتی وقتی خود نوبت عامل
    فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده AIMock محلی را برای دودآزمایی مستقیم پروتکل
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - lane زنده QA برای Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط checkout منبع — نصب‌های بسته‌بندی‌شده `qa-lab` را ارسال نمی‌کنند.
  - CLI کامل، کاتالوگ profile/scenario، متغیرهای env، و چیدمان مصنوع: [QA ماتریس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - lane زنده QA برای Telegram را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای ربات driver و SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی chat در Telegram باشد.
  - برای اعتبارنامه‌های اشتراکی pooled از `--credential-source convex` پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای انتخاب leaseهای pooled مقدار `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریو شکست بخورد با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
  - به دو ربات متمایز در همان گروه خصوصی نیاز دارد، در حالی که ربات SUT یک نام کاربری Telegram ارائه می‌کند.
  - برای مشاهده پایدار ربات-به-ربات، حالت ارتباط ربات-به-ربات را در `@BotFather` برای هر دو ربات فعال کنید و مطمئن شوید ربات driver می‌تواند ترافیک ربات‌های گروه را مشاهده کند.
  - یک گزارش QA برای Telegram، خلاصه، و مصنوع پیام‌های مشاهده‌شده را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

laneهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید دچار واگرایی نشوند؛ ماتریس پوشش هر lane در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
`openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری از یک pool با پشتوانه Convex دریافت می‌کند، در زمان اجرای lane برای
آن lease Heartbeat می‌فرستد، و هنگام خاموشی lease را آزاد می‌کند.

scaffold مرجع پروژه Convex:

- `qa/convex-credential-broker/`

متغیرهای env لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci`، در غیر این صورت `maintainer`)

متغیرهای env اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` نشانی‌های Convex از نوع loopback `http://` را برای توسعه فقط محلی مجاز می‌کند.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

دستورهای admin نگه‌دارنده (افزودن/حذف/فهرست pool) مشخصا به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارنده‌ها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، secretهای broker،
پیشوند endpoint، timeout HTTP، و دسترسی‌پذیری admin/list را بدون چاپ
مقادیر secret بررسی کند. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI
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
  - guard مربوط به lease فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته شناسه عددی chat در Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده سناریو برای adapterهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «افزایش واقع‌گرایی» (و افزایش flakiness/هزینه) در نظر بگیرید:

### واحد / یکپارچه‌سازی (پیش‌فرض)

- دستور: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shard مربوط به `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرآیندی (احراز هویت Gateway، routing، tooling، parsing، config)
  - regressionهای قطعی برای bugهای شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای کوچک Plugin تولیدشده اثبات کنند، نه با
    APIهای منبع Pluginهای همراه واقعی. بارگذاری‌های API واقعی Plugin به
    مجموعه‌های contract/integration متعلق به Plugin تعلق دارند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و laneهای scoped">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند غول‌آسای بومیِ root-project، دوازده پیکربندی شارد کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه‌ماندن مجموعه‌های نامرتبط به‌خاطر کار auto-reply/extension جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژه بومی ریشه `vitest.config.ts` استفاده می‌کند، چون حلقه watch چند-شاردی عملی نیست.
    - `pnpm test`، `pnpm test:watch` و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل راه‌اندازی پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` مسیرهای git تغییریافته را به‌صورت پیش‌فرض به laneهای scoped ارزان گسترش می‌دهد: ویرایش‌های مستقیم تست، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های محلی import-graph. ویرایش‌های config/setup/package تست‌ها را broad-run نمی‌کنند مگر اینکه صراحتا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` گیت معمول smart local check برای کارهای محدود است. diff را به core، تست‌های core، extensions، تست‌های extension، apps، docs، release metadata، live Docker tooling و tooling دسته‌بندی می‌کند، سپس فرمان‌های typecheck، lint و guard منطبق را اجرا می‌کند. این فرمان تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌های فقط release metadata بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کند، همراه با guardی که تغییرات package خارج از فیلد version سطح بالا را رد می‌کند.
    - ویرایش‌های harness زنده Docker ACP بررسی‌های متمرکز اجرا می‌کنند: نحو shell برای اسکریپت‌های احراز هویت Docker زنده و dry-run زمان‌بند Docker زنده. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version و دیگر package-surfaceها همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد import-light از agents، commands، plugins، helperهای auto-reply، `plugin-sdk` و نواحی pure utility مشابه از lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود باقی می‌مانند.
    - فایل‌های source کمکی منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های خواهر صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین برای آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*` و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به شاردهای agent-runner، dispatch و commands/state-routing تقسیم می‌کند تا یک bucket import-heavy مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمدا sweep دسته‌ای extension و شارد فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation، workflow فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگینِ plugin/extension روی release candidateها dispatch می‌کند.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - وقتی inputهای کشف message-tool یا context runtime مربوط به Compaction را تغییر می‌دهید، هر دو سطح coverage را حفظ کنید.
    - regressionهای کمکی متمرکز برای مرزهای pure routing و normalization اضافه کنید.
    - مجموعه‌های integration مربوط به embedded runner را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها بررسی می‌کنند که شناسه‌های scoped و رفتار Compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - پیکربندی پایه Vitest به‌صورت پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner غیرایزوله در پروژه‌های ریشه، e2e و پیکربندی‌های live استفاده می‌کند.
    - lane مربوط به UI ریشه setup و optimizer مربوط به `jsdom` خودش را نگه می‌دارد، اما آن هم روی runner مشترک غیرایزوله اجرا می‌شود.
    - هر شارد `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌صورت پیش‌فرض `--no-maglev` را برای فرایندهای فرزند Node مربوط به Vitest اضافه می‌کند تا churn کامپایل V8 را هنگام اجراهای محلی بزرگ کاهش دهد. برای مقایسه با رفتار V8 پیش‌فرض، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck یا تست اجرا نمی‌کند.
    - وقتی به smart local check gate نیاز دارید، پیش از handoff یا push، `pnpm check:changed` را صراحتا اجرا کنید.
    - `pnpm test:changed` به‌صورت پیش‌فرض از laneهای scoped ارزان عبور می‌کند. فقط وقتی agent تشخیص می‌دهد یک ویرایش harness، config، package یا contract واقعا به coverage گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند، فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمدا محافظه‌کارانه است و وقتی load average میزبان از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌صورت پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode وقتی wiring تست تغییر می‌کند درست بمانند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` گزارش‌دهی import-duration در Vitest به‌همراه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی شارد در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ شاردهای CI با include-pattern نام شارد را اضافه می‌کنند تا شاردهای فیلترشده جداگانه ردیابی شوند.
    - وقتی یک تست داغ هنوز بیشتر زمانش را در importهای startup می‌گذراند، dependencyهای سنگین را پشت یک seam محلی و محدود `*.runtime.ts` نگه دارید و به‌جای deep-import کردن helperهای runtime فقط برای عبوردادنشان از `vi.mock(...)`، همان seam را مستقیما mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر `test:changed` routeشده را با مسیر بومی root-project برای آن diff commitشده مقایسه می‌کند و wall time به‌همراه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبوردادن فهرست فایل‌های تغییریافته از `scripts/test-projects.mjs` و پیکربندی ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU مربوط به main-thread برای سربار startup و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` برای مجموعه unit، با غیرفعال‌بودن parallelism فایل، profileهای CPU+heap مربوط به runner را می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارشده به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌صورت پیش‌فرض راه‌اندازی می‌کند
  - churn پیام gateway مصنوعی، memory و large-payload را از مسیر diagnostic event عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence مربوط به diagnostic stability bundle را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر pressure budget باقی می‌مانند، و عمق صف‌های هر session دوباره به صفر تخلیه می‌شوند
- انتظارها:
  - برای CI امن و بدون key
  - lane محدود برای پیگیری stability-regression، نه جایگزینی برای مجموعه کامل Gateway

### E2E (smoke مربوط به Gateway)

- فرمان: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، همسو با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: تا ۲، محلی: به‌صورت پیش‌فرض ۱).
  - به‌صورت پیش‌فرض در silent mode اجرا می‌شود تا سربار console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose console.
- دامنه:
  - رفتار end-to-end مربوط به gateway چندنمونه‌ای
  - سطح‌های WebSocket/HTTP، جفت‌سازی node، و networking سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به key واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (می‌تواند کندتر باشد)

### E2E: smoke مربوط به backend OpenShell

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک gateway ایزوله OpenShell را روی میزبان از طریق Docker راه‌اندازی می‌کند
  - از یک Dockerfile محلی موقت یک sandbox می‌سازد
  - backend OpenShell متعلق به OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical راه‌دور را از طریق پل sandbox fs بررسی می‌کند
- انتظارها:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس gateway و sandbox تست را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی تست هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### Live (providerهای واقعی + modelهای واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های live مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعا _امروز_ با credentialهای واقعی کار می‌کند؟»
  - تغییرات format provider، ریزه‌کاری‌های tool-calling، مشکلات auth و رفتار rate limit را می‌گیرد
- انتظارها:
  - عمدا از نظر CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، quotaها، outageها)
  - هزینه مالی دارد / از rate limit استفاده می‌کند
  - اجرای subsetهای محدود را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای live از `~/.profile` source می‌گیرند تا API keyهای گمشده را دریافت کنند.
- به‌صورت پیش‌فرض، اجراهای live همچنان `HOME` را ایزوله می‌کنند و material مربوط به config/auth را در یک home موقت تست کپی می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را mutate کنند.
- فقط وقتی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمدا لازم دارید تست‌های live از دایرکتوری home واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌صورت پیش‌فرض حالت کم‌صداتری دارد: خروجی progress با `[live] ...` را نگه می‌دارد، اما notice اضافی `~/.profile` را suppress می‌کند و logهای bootstrap مربوط به gateway/چتر Bonjour را mute می‌کند. اگر می‌خواهید logهای کامل startup برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش API key (ویژه provider): `*_API_KEYS` را با قالب comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override مخصوص live از طریق `OPENCLAW_LIVE_*_KEY` تنظیم کنید؛ تست‌ها در پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی progress/Heartbeat:
  - مجموعه‌های live اکنون خط‌های progress را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest ساکت است، به‌وضوح فعال باشند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های progress مربوط به provider/gateway بلافاصله هنگام اجراهای live stream شوند.
  - Heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- منطق/آزمون‌های ویرایش: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید، `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده» / شکست‌های مخصوص ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (با دسترسی شبکه)

برای ماتریس مدل زنده، smokeهای بک‌اند CLI، smokeهای ACP، چارچوب آزمون app-server Codex، و همه آزمون‌های زنده ارائه‌دهندگان رسانه (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، چارچوب آزمون رسانه) — به‌همراه مدیریت اعتبارنامه برای اجراهای زنده — [آزمون‌گیری — مجموعه‌های زنده](/fa/help/testing-live) را ببینید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده کلید-پروفایل متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی و فضای کاری شما را mount می‌کنند (و اگر `~/.profile` mount شده باشد، آن را source می‌کنند). نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker به‌صورت پیش‌فرض سقف smoke کوچک‌تری دارند تا یک پیمایش کامل Docker عملی بماند:
  `test:docker:live-models` به‌صورت پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` دارد، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` دارد. وقتی صراحتا اسکن جامع بزرگ‌تر را می‌خواهید، این متغیرهای env را بازنویسی کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت یک tarball npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. تصویر bare فقط اجراکننده Node/Git برای مسیرهای install/update/plugin-dependency است؛ این مسیرها tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional همان tarball را در `/app` برای مسیرهای کارکرد برنامه ساخته‌شده نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` اسلات‌های پردازش را کنترل می‌کند، درحالی‌که سقف‌های منبع مانع می‌شوند مسیرهای سنگین زنده، npm-install، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود، آن را به‌تنهایی در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ اسلات، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط وقتی تنظیم کنید که میزبان Docker ظرفیت بیشتری دارد. اجراکننده به‌صورت پیش‌فرض یک preflight Docker انجام می‌دهد، containerهای قدیمی E2E مربوط به OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع‌کردن مسیرهای طولانی‌تر در ابتدا استفاده می‌کند. برای چاپ manifest مسیرهای وزن‌دار بدون ساخت یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ برنامه CI مربوط به مسیرهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها از `node scripts/test-docker-all.mjs --plan-json` استفاده کنید.
- `Package Acceptance` gate بسته بومی GitHub برای این پرسش است: «آیا این tarball قابل‌نصب به‌عنوان محصول کار می‌کند؟» این کار یک بسته نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` upload می‌کند، سپس مسیرهای E2E قابل‌بازاستفاده Docker را به‌جای بسته‌بندی دوباره ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. `workflow_ref` اسکریپت‌های workflow/چارچوب آزمون مورداعتماد را انتخاب می‌کند، درحالی‌که `package_ref` کامیت/شاخه/tag مبدأ را برای بسته‌بندی هنگام `source=ref` انتخاب می‌کند؛ این اجازه می‌دهد منطق پذیرش فعلی کامیت‌های قدیمی‌تر مورداعتماد را اعتبارسنجی کند. پروفایل‌ها بر اساس گستره مرتب شده‌اند: `smoke` نصب/channel/agent سریع به‌همراه gateway/config است، `package` قرارداد package/update/plugin به‌همراه fixture بازمانده ارتقای بدون کلید، مسیر بازمانده ارتقای baseline منتشرشده، و جایگزین native پیش‌فرض برای بیشتر پوشش package/update مربوط به Parallels است، `product` کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI را اضافه می‌کند، و `full` بخش‌های Docker مسیر انتشار را با OpenWebUI اجرا می‌کند. برای `published-upgrade-survivor`، Package Acceptance همیشه از `package-under-test` به‌عنوان نامزد و از `published_upgrade_survivor_baseline` به‌عنوان baseline منتشرشده جایگزین استفاده می‌کند، که پیش‌فرض آن `openclaw@latest` است؛ `published_upgrade_survivor_baselines=release-history` را تنظیم کنید تا مسیر در یک ماتریس dedupe‌شده شامل شش انتشار پایدار آخر، `2026.4.23`، و آخرین انتشار پایدار پیش از `2026-03-15` shard شود. مسیر منتشرشده baseline خود را با یک دستور recipe آماده `openclaw config set` پیکربندی می‌کند، سپس گام‌های recipe را در خلاصه مسیر ثبت می‌کند. اعتبارسنجی انتشار یک package delta سفارشی (`bundled-channel-deps-compat plugins-offline`) به‌علاوه QA بسته Telegram را اجرا می‌کند، چون بخش‌های Docker مسیر انتشار از قبل مسیرهای هم‌پوشان package/update/plugin را پوشش می‌دهند. فرمان‌های اجرای دوباره هدفمند GitHub Docker که از artifactها تولید می‌شوند شامل artifact بسته قبلی، ورودی‌های تصویر آماده‌شده، و فهرست baseline بازمانده ارتقای منتشرشده در صورت موجودبودن هستند، بنابراین مسیرهای شکست‌خورده می‌توانند از ساخت دوباره بسته و تصاویر اجتناب کنند.
- بررسی‌های ساخت و انتشار پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر واردسازی‌های startup پیش از dispatch، وابستگی‌های بسته مانند Commander، رابط کاربری prompt، undici، یا logging را قبل از dispatch فرمان وارد کنند، شکست می‌خورد؛ همچنین chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و واردسازی‌های static مسیرهای Gateway سرد شناخته‌شده را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین help ریشه، help onboarding، help doctor، status، schema پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری legacy مربوط به Package Acceptance تا `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا این cutoff، چارچوب آزمون فقط gapهای metadata بسته‌های منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شده inventory خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy مربوط به رکورد نصب plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای بسته‌های پس از `2026.4.25`، این مسیرها شکست‌های strict هستند.
- اجراکننده‌های smoke container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای ادغام سطح بالاتر را verify می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین فقط homeهای احراز هویت CLI لازم را bind-mount می‌کنند (یا وقتی اجرا محدود نشده است، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در home داخل container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن store احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- آزمون دود bind مربوط به ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانهٔ Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- آزمون دود بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- آزمون دود harness سرور برنامهٔ Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- آزمون دود مشاهده‌پذیری: `pnpm qa:otel:smoke` یک lane خصوصی برای بررسی checkout منبع QA است. عمداً بخشی از laneهای انتشار Docker بسته نیست، چون tarball مربوط به npm، QA Lab را حذف می‌کند.
- آزمون دود زندهٔ Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، scaffolding کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- آزمون دود راه‌اندازی اولیه/کانال/عامل برای tarball npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شدهٔ OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیهٔ مبتنی بر ارجاع env به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، بررسی می‌کند که doctor وابستگی‌های runtime مربوط به Pluginهای فعال‌شده را تعمیر کرده باشد، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. برای استفادهٔ دوباره از یک tarball ازپیش‌ساخته از `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ساخت مجدد میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` کانال را تغییر دهید.
- آزمون دود تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، tarball بسته‌بندی‌شدهٔ OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بستهٔ `stable` به git `dev` تغییر می‌دهد، کارکرد کانال ذخیره‌شده و Plugin پس از به‌روزرسانی را بررسی می‌کند، سپس به بستهٔ `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون دود بازماندگی ارتقا: `pnpm test:docker:upgrade-survivor`، tarball بسته‌بندی‌شدهٔ OpenClaw را روی یک fixture کثیف از کاربر قدیمی با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت کهنهٔ وابستگی‌های runtime مربوط به Plugin، و فایل‌های workspace/session موجود نصب می‌کند. این آزمون، به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای provider زنده یا کانال اجرا می‌کند، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- آزمون دود بازماندگی ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را seed می‌کند، آن baseline را با یک دستورالعمل دستوری پخته‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` گسترش دهد، و fixtureهای شبیه issue را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ Package Acceptance این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` در دسترس قرار می‌دهد.
- آزمون دود زمینهٔ runtime نشست: `pnpm test:docker:session-runtime-context`، ماندگاری transcript زمینهٔ runtime مخفی به‌همراه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite متأثر را بررسی می‌کند.
- آزمون دود نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک خانهٔ ایزوله نصب می‌کند، و بررسی می‌کند که `openclaw infer image providers --json` به‌جای گیر کردن، providerهای تصویر bundleشده را برگرداند. برای استفادهٔ دوباره از یک tarball ازپیش‌ساخته از `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ساخت میزبان را رد کنید، یا با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`، `dist/` را از یک تصویر Docker ساخته‌شده کپی کنید.
- آزمون دود Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را میان کانتینرهای root، update و direct-npm خود به اشتراک می‌گذارد. آزمون دود update پیش از ارتقا به tarball نامزد، به‌طور پیش‌فرض npm `latest` را به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` مربوط به workflow Install Smoke، override کنید. بررسی‌های نصب‌کنندهٔ غیر-root یک cache ایزولهٔ npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب محلی کاربر را پنهان نکنند. برای استفادهٔ دوباره از cache root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` به‌روزرسانی سراسری direct-npm تکراری را رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون دود CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در خانهٔ کانتینر ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار نگه‌داشتن workspace را بررسی می‌کند. با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` از تصویر install-smoke دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- آزمون دود snapshot مربوط به Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایهٔ Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند که snapshotهای نقش CDP شامل URLهای لینک، clickables ارتقایافته با cursor، ارجاع‌های iframe و metadata فریم باشند.
- رگرسیون reasoning حداقلی web_search در OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، بررسی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش دهد، سپس رد schema توسط provider را اجبار می‌کند و بررسی می‌کند که جزئیات خام در logهای Gateway ظاهر شود.
- پل کانال MCP (Gateway seedشده + پل stdio + آزمون دود raw Claude notification-frame): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بستهٔ Pi (سرور MCP واقعی روی stdio + آزمون دود allow/deny برای پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + teardown فرزند MCP روی stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون دود نصب، نصب/حذف kitchen-sink از ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض package/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` override کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون دود بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون دود metadata بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- وابستگی‌های runtime مربوط به Pluginهای bundleشده: `pnpm test:docker:bundled-channel-deps` به‌طور پیش‌فرض یک تصویر کوچک Docker runner می‌سازد، OpenClaw را یک‌بار روی میزبان می‌سازد و بسته‌بندی می‌کند، سپس آن tarball را در هر سناریوی نصب Linux mount می‌کند. با `OPENCLAW_SKIP_DOCKER_BUILD=1` از تصویر دوباره استفاده کنید، پس از یک ساخت محلی تازه با `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ساخت مجدد میزبان را رد کنید، یا با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` به یک tarball موجود اشاره کنید. تجمیع کامل Docker و chunkهای bundled-channel مربوط به مسیر انتشار، این tarball را یک‌بار از پیش بسته‌بندی می‌کنند، سپس بررسی‌های کانال bundleشده را به laneهای مستقل shard می‌کنند، از جمله laneهای به‌روزرسانی جداگانه برای Telegram، Discord، Slack، Feishu، memory-lancedb و ACPX. chunkهای انتشار، آزمون‌های دود کانال، هدف‌های به‌روزرسانی و قراردادهای setup/runtime را به `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-b` و `bundled-channels-contracts` تقسیم می‌کنند؛ chunk تجمیعی `bundled-channels` برای اجرای مجدد دستی همچنان در دسترس است. workflow انتشار همچنین chunkهای نصب‌کنندهٔ provider و chunkهای نصب/حذف Plugin bundleشده را تقسیم می‌کند؛ chunkهای قدیمی `package-update`، `plugins-runtime` و `plugins-integrations` به‌عنوان aliasهای تجمیعی برای اجرای مجدد دستی باقی می‌مانند. برای محدود کردن matrix کانال هنگام اجرای مستقیم lane bundleشده، از `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` استفاده کنید، یا برای محدود کردن سناریوی به‌روزرسانی از `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` استفاده کنید. اجرای Docker برای هر سناریو به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` است؛ سناریوی به‌روزرسانی چندهدفه به‌طور پیش‌فرض `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` است. این lane همچنین بررسی می‌کند که `channels.<id>.enabled=false` و `plugins.entries.<id>.enabled=false` تعمیر doctor/وابستگی runtime را سرکوب کنند.
- هنگام iteration، با غیرفعال کردن سناریوهای نامرتبط، وابستگی‌های runtime مربوط به Plugin bundleشده را محدود کنید، برای مثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

برای پیش‌ساخت و استفادهٔ مجدد دستی از تصویر عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

overrideهای تصویر مخصوص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم، اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره کند، اگر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime برنامهٔ ساخته‌شدهٔ مشترک، رفتار بسته/نصب را اعتبارسنجی می‌کنند.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را در یک workdir موقت داخل container مرحله‌بندی می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد، در حالی که Vitest همچنان روی دقیقاً همان سورس/پیکربندی محلی شما اجرا می‌شود.
مرحلهٔ مرحله‌بندی، cacheهای بزرگ فقط‌محلی و خروجی‌های ساخت برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلیِ برنامه یا
Gradle را رد می‌کند تا اجرای‌های زندهٔ Docker چند دقیقه را صرف کپی‌کردن
artifactهای وابسته به ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زندهٔ gateway، workerهای کانال
واقعی Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زندهٔ gateway
را در آن lane Docker محدود یا مستثنا کنید، `OPENCLAW_LIVE_GATEWAY_*` را هم عبور دهید.
`test:docker:openwebui` یک آزمون دود سازگاری سطح‌بالاتر است: یک container Gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک container پین‌شدهٔ Open WebUI را در برابر آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، تأیید می‌کند `/api/models` مقدار `openclaw/default` را نشان می‌دهد، سپس یک
درخواست چت واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI می‌فرستد.
اجرای نخست می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد راه‌اندازی سرد خودش را کامل کند.
این lane به یک کلید مدل زندهٔ قابل‌استفاده نیاز دارد، و `OPENCLAW_PROFILE_FILE`
(به‌طور پیش‌فرض `~/.profile`) راه اصلی برای فراهم‌کردن آن در اجراهای Dockerized است.
اجرای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کند.
`test:docker:mcp-channels` عمداً قطعی است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک container Gateway seed‌شده را boot می‌کند،
container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف گفت‌وگوی route‌شده، خواندن transcript، metadata پیوست‌ها،
رفتار queue رویداد زنده، routing ارسال خروجی، و notificationهای کانال + permission به سبک Claude
را روی bridge واقعی stdio MCP تأیید می‌کند. بررسی notification
frameهای خام stdio MCP را مستقیماً بررسی می‌کند تا آزمون دود همان چیزی را اعتبارسنجی کند که
bridge واقعاً منتشر می‌کند، نه فقط آنچه یک SDK کلاینت خاص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` قطعی است و به کلید مدل زنده نیاز ندارد.
image Docker ریپو را می‌سازد، یک server probe واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق runtime بستهٔ تعبیه‌شدهٔ Pi
MCP materialize می‌کند، tool را اجرا می‌کند، سپس تأیید می‌کند `coding` و `messaging` ابزارهای
`bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند.
`test:docker:cron-mcp-cleanup` قطعی است و به کلید مدل زنده نیاز ندارد.
یک Gateway seed‌شده با یک server probe واقعی stdio MCP را شروع می‌کند، یک turn کرون
ایزوله و یک turn فرزند تک‌اجرایی `/subagents spawn` را اجرا می‌کند، سپس تأیید می‌کند
process فرزند MCP بعد از هر اجرا خارج می‌شود.

آزمون دود دستی ACP برای thread با زبان ساده (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing thread در ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) روی `/home/node/.profile` mount می‌شود و پیش از اجرای tests source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای تأیید فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) روی `/home/node/.npm-global` برای نصب‌های CLI cache‌شده داخل Docker mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع tests در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنتاج شده‌اند mount می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدودکردن run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلترکردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفادهٔ دوباره از image موجود `openclaw:local-live` برای rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentialها از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای آزمون دود Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که آزمون دود Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای override کردن tag image پین‌شدهٔ Open WebUI

## sanity مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای داخل صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (ایمن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool در Gateway (OpenAI mock، gateway واقعی + loop عامل): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + auth enforce‌شده): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## ارزیابی‌های reliability عامل (skills)

ما از قبل چند test ایمن برای CI داریم که مانند «ارزیابی‌های reliability عامل» رفتار می‌کنند:

- فراخوانی tool به‌صورت mock از طریق gateway واقعی + loop عامل (`src/gateway/gateway.test.ts`).
- flowهای end-to-end wizard که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (نگاه کنید به [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skillها در prompt فهرست شده‌اند، آیا عامل skill درست را انتخاب می‌کند (یا از موارد نامرتبط دوری می‌کند)؟
- **پایبندی:** آیا عامل پیش از استفاده `SKILL.md` را می‌خواند و step/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای multi-turn که ترتیب toolها، انتقال history session، و مرزهای sandbox را assert می‌کنند.

ارزیابی‌های آینده باید ابتدا قطعی بمانند:

- یک runner سناریو با providerهای mock برای assert کردن callها + ترتیب tool، خواندن فایل skill، و wiring session.
- یک مجموعهٔ کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- ارزیابی‌های زندهٔ اختیاری (opt-in، env-gated) فقط پس از آماده‌شدن مجموعهٔ ایمن برای CI.

## تست‌های contract (شکل Plugin و کانال)

تست‌های contract تأیید می‌کنند که هر Plugin و کانال ثبت‌شده با
interface contract خودش سازگار است. آن‌ها روی همهٔ Pluginهای کشف‌شده iterate می‌کنند و مجموعه‌ای از
assertionهای شکل و رفتار را اجرا می‌کنند. lane unit پیش‌فرض `pnpm test` عمداً
این فایل‌های shared seam و smoke را رد می‌کند؛ وقتی surfaceهای shared channel یا provider را لمس می‌کنید،
commandهای contract را صریح اجرا کنید.

### commandها

- همهٔ contractها: `pnpm test:contracts`
- فقط contractهای کانال: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایهٔ Plugin (id، name، capabilities)
- **setup** - contract مربوط به setup wizard
- **session-binding** - رفتار binding session
- **outbound-payload** - ساختار payload پیام
- **inbound** - رسیدگی به پیام inbound
- **actions** - handlerهای action کانال
- **threading** - رسیدگی به thread ID
- **directory** - API دایرکتوری/roster
- **group-policy** - enforce کردن policy گروه

### contractهای وضعیت provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت کانال
- **registry** - شکل registry Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract مربوط به flow auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime provider
- **shape** - شکل/interface Plugin
- **wizard** - setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک کانال یا Plugin provider
- پس از refactor کردن ثبت یا کشف Plugin

تست‌های contract در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک مشکل provider/model کشف‌شده در live را رفع می‌کنید:

- اگر ممکن است یک regression ایمن برای CI اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق شکل درخواست)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/replay درخواست provider → test مستقیم مدل‌ها
  - bug pipeline مربوط به session/history/tool در gateway → آزمون دود زندهٔ gateway یا test mock gateway ایمن برای CI
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک target نمونه استخراج می‌کند، سپس assert می‌کند exec idهای traversal-segment رد می‌شوند.
  - اگر یک خانوادهٔ target جدید SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. test عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا کلاس‌های جدید بی‌صدا رد نشوند.

## مرتبط

- [تست زنده](/fa/help/testing-live)
- [CI](/fa/ci)
