---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای اشکال‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمایش: مجموعه‌های واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمایش پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-05-02T20:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (unit/integration، e2e، live) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «ما چگونه تست می‌کنیم» است:

- هر مجموعه چه مواردی را پوشش می‌دهد (و عمدا چه مواردی را _پوشش نمی‌دهد_).
- برای جریان‌های کاری رایج کدام دستورها را اجرا کنید (local، pre-push، debugging).
- تست‌های live چگونه credentials را کشف می‌کنند و مدل‌ها/providers را انتخاب می‌کنند.
- چگونه regressionهایی برای مشکلات واقعی مدل/provider اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، live transport lanes)** جداگانه مستند شده است:

- [مرور کلی QA](/fa/concepts/qa-e2e-automation) — معماری، سطح دستور، نگارش سناریو.
- [Matrix QA](/fa/concepts/qa-matrix) — مرجع برای `pnpm openclaw qa matrix`.
- [کانال QA](/fa/channels/qa-channel) — Plugin انتقال مصنوعی که توسط سناریوهای مبتنی بر repo استفاده می‌شود.

این صفحه اجرای مجموعه‌های تست عادی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مختص QA در پایین ([اجراکننده‌های مختص QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

بیشتر روزها:

- گیت کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعه تست local روی ماشینی با منابع کافی: `pnpm test:max`
- حلقه مستقیم watch برای Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم route می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک failure واحد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA مبتنی بر Docker: `pnpm qa:lab:up`
- lane QA مبتنی بر VM لینوکسی: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی tests را تغییر می‌دهید یا اطمینان بیشتری می‌خواهید:

- گیت coverage: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

وقتی providers/models واقعی را debug می‌کنید (نیازمند creds واقعی):

- مجموعه live (مدل‌ها + probes ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری آرام یک فایل live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد runtime: `OpenClaw Performance` را با
  `live_gpt54=true` برای یک turn واقعی agent با `openai/gpt-5.4` یا
  `deep_profile=true` برای artifactهای CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  artifactهای lane مربوط به mock-provider، deep-profile، و GPT 5.4 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند، وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد. گزارش
  mock-provider همچنین شامل عددهای gateway boot در سطح source، memory،
  plugin-pressure، fake-model hello-loop تکرارشونده، و startup مربوط به CLI است.
- sweep مدل live با Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک turn متنی به‌علاوه یک probe کوچک شبیه file-read اجرا می‌کند.
    مدل‌هایی که metadata آن‌ها ورودی `image` را اعلام می‌کند، یک turn تصویر کوچک هم اجرا می‌کنند.
    هنگام ایزوله‌کردن failureهای provider، probeهای اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو workflow قابل استفاده مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای matrix مدل live جداگانه Docker
    است که بر اساس provider shard شده‌اند.
  - برای rerunهای متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)`
    را با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - secrets جدید provider با سیگنال بالا را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و callerهای
    scheduled/release آن اضافه کنید.
- smoke مربوط به bound-chat بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک lane live Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک
    Slack DM مصنوعی را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را اجرا می‌کند، سپس بررسی می‌کند که یک پاسخ ساده و یک attachment تصویر
    از مسیر binding بومی Plugin عبور می‌کنند، نه ACP.
- smoke مربوط به harness app-server در Codex: `pnpm test:docker:live-codex-harness`
  - turnهای agent مربوط به Gateway را از طریق harness app-server متعلق به Plugin مربوط به Codex اجرا می‌کند،
    `/codex status` و `/codex models` را بررسی می‌کند، و به‌صورت پیش‌فرض probes مربوط به تصویر،
    cron MCP، sub-agent، و Guardian را اجرا می‌کند. هنگام ایزوله‌کردن سایر failureهای
    app-server مربوط به Codex، probe مربوط به sub-agent را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای یک بررسی متمرکز sub-agent، سایر probeها را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از probe مربوط به sub-agent خارج می‌شود، مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- smoke مربوط به دستور نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری belt-and-suspenders برای سطح دستور نجات message-channel.
    این دستور `/crestodian status` را اجرا می‌کند، یک تغییر پایدار مدل را در صف می‌گذارد،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را بررسی می‌کند.
- smoke مربوط به planner در Docker برای Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک container بدون config با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و بررسی می‌کند که fallback مربوط به fuzzy planner به یک نوشتن typed
    config ممیزی‌شده ترجمه می‌شود.
- smoke مربوط به first-run در Docker برای Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری state خالی OpenClaw شروع می‌کند، `openclaw` خام را به
    Crestodian route می‌کند، setup/model/agent/Discord Plugin + نوشتن‌های SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند، و entryهای audit را بررسی می‌کند. همان مسیر setup Ring 0
    در QA Lab هم توسط
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- smoke مربوط به هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، ابتدا
  `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. بررسی کنید JSON، Moonshot/K2.6 را گزارش می‌کند و
  transcript دستیار مقدار نرمال‌شده `usage.cost` را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد failing نیاز دارید، محدودکردن تست‌های live از طریق env vars مربوط به allowlist را که پایین‌تر توضیح داده شده‌اند ترجیح دهید.
</Tip>

## اجراکننده‌های مختص QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این دستورها کنار مجموعه‌های تست اصلی قرار می‌گیرند:

CI، QA Lab را در workflowهای اختصاصی اجرا می‌کند. هم‌ارزی agentic زیر
`QA-Lab - All Lanes` و release validation قرار دارد، نه یک workflow مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با lane هم‌ارزی mock، lane live
Matrix، lane live Telegram مدیریت‌شده با Convex، و lane live Discord
مدیریت‌شده با Convex به‌صورت jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و release checks مقدار Matrix
`--profile fast` را صراحتا پاس می‌دهند، در حالی که مقدار پیش‌فرض Matrix CLI و ورودی workflow دستی
همچنان `all` است؛ dispatch دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از approval انتشار، هم‌ارزی به‌علاوه laneهای fast Matrix و Telegram را اجرا می‌کند،
و برای بررسی‌های transport مربوط به release از `mock-openai/gpt-5.5` استفاده می‌کند تا deterministic بمانند
و از startup معمول provider-plugin پرهیز کنند. این Gatewayهای live transport
جست‌وجوی memory را غیرفعال می‌کنند؛ رفتار memory همچنان توسط مجموعه‌های QA parity
پوشش داده می‌شود.

shardهای live media مربوط به انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` دارد. shardهای مدل/backend live در Docker از image مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار به‌ازای commit انتخاب‌شده build شده است،
سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند، به‌جای اینکه داخل هر shard دوباره build کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را با کارگرهای Gateway ایزوله به‌صورت موازی اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض هم‌روندی 4 دارد (محدود به تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد کارگرها از `--concurrency <count>` استفاده کنید، یا برای مسیر سریال قدیمی‌تر از `--concurrency 1` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند. `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی fixture و protocol-mock شروع می‌کند، بدون اینکه مسیر آگاه از سناریوی `mock-openai` را جایگزین کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ شروع Gateway را به‌همراه یک بسته کوچک سناریوی شبیه‌سازی‌شده QA Lab (`channel-chat-baseline`، `memory-failure-fallback`، `gateway-restart-inflight-run`) اجرا می‌کند و خلاصه ترکیبی مشاهده CPU را در `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغِ پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn` به‌همراه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه هنگام شروع به‌عنوان معیار ثبت می‌شوند، بدون اینکه شبیه رگرسیون چنددقیقه‌ای گیرکردن Gateway به نظر برسند.
  - از آرتیفکت‌های ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را داخل یک VM لینوکسی Multipass یک‌بارمصرف اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مثل `qa suite` روی میزبان حفظ می‌کند.
  - همان flagهای انتخاب ارائه‌دهنده/مدل را مثل `qa suite` دوباره استفاده می‌کند.
  - اجراهای live ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای guest عملی هستند forward می‌کنند: کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده live QA، و `CODEX_HOME` وقتی وجود داشته باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا guest بتواند از طریق workspace mount‌شده دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌علاوه logهای Multipass را زیر `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور شروع می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت global در Docker نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند، به‌طور پیش‌فرض Telegram را پیکربندی می‌کند، تأیید می‌کند runtime مربوط به Plugin بسته‌بندی‌شده بدون تعمیر وابستگی هنگام شروع بارگذاری می‌شود، doctor را اجرا می‌کند، و یک نوبت agent محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر packaged-install با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای برنامه ساخته‌شده جهت transcriptهای context تعبیه‌شده runtime اجرا می‌کند. تأیید می‌کند context پنهان runtime OpenClaw به‌عنوان یک پیام سفارشی غیرنمایشی پایدار می‌شود، نه اینکه به نوبت قابل‌مشاهده کاربر نشت کند، سپس یک session JSONL خرابِ تحت تأثیر را seed می‌کند و تأیید می‌کند `openclaw doctor --fix` آن را با یک backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک کاندیدای بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر live Telegram QA را با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry، `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به Convex مثل `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/release، `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه `OPENCLAW_QA_CONVEX_SITE_URL` و secret نقش تنظیم کنید. اگر `OPENCLAW_QA_CONVEX_SITE_URL` و یک secret نقش Convex در CI حاضر باشند، wrapper Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر، مقدار مشترک `OPENCLAW_QA_CREDENTIAL_ROLE` را override می‌کند.
  - GitHub Actions این مسیر را به‌عنوان workflow دستی maintainer با نام `NPM Telegram Beta E2E` ارائه می‌کند. هنگام merge اجرا نمی‌شود. این workflow از محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای proof محصول side-run در برابر یک بسته کاندیدا ارائه می‌کند. یک ref قابل‌اعتماد، spec منتشرشده npm، URL tarball با HTTPS به‌همراه SHA-256، یا آرتیفکت tarball از اجرای دیگر را می‌پذیرد، `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` آپلود می‌کند، سپس scheduler موجود Docker E2E را با profileهای مسیر smoke، package، product، full یا custom اجرا می‌کند. برای اجرای workflow مربوط به Telegram QA در برابر همان آرتیفکت `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - proof محصول آخرین beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof URL دقیق tarball به digest نیاز دارد:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- proof آرتیفکت، یک آرتیفکت tarball را از اجرای دیگر Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را با OpenAI پیکربندی‌شده شروع می‌کند، سپس channel/pluginهای bundled را از طریق ویرایش‌های config فعال می‌کند.
  - تأیید می‌کند discovery مربوط به setup، Pluginهای قابل‌دانلود پیکربندی‌نشده را غایب باقی می‌گذارد، اولین تعمیر doctor پیکربندی‌شده هر Plugin قابل‌دانلودِ گمشده را به‌طور صریح نصب می‌کند، و restart دوم تعمیر پنهان وابستگی را اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر شناخته‌شده npm را نصب می‌کند، Telegram را پیش از اجرای `openclaw update --tag <candidate>` فعال می‌کند، و تأیید می‌کند doctor پس از update در کاندیدا، باقی‌مانده‌های وابستگی Plugin قدیمی را بدون تعمیر postinstall سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی packaged-install native را در guestهای Parallels اجرا می‌کند. هر پلتفرم انتخاب‌شده ابتدا بسته baseline درخواستی را نصب می‌کند، سپس دستور نصب‌شده `openclaw update` را در همان guest اجرا می‌کند و نسخه نصب‌شده، وضعیت update، آماده‌بودن Gateway، و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام کار تکراری روی یک guest از `--platform macos`، `--platform windows` یا `--platform linux` استفاده کنید. برای مسیر آرتیفکت خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض برای proof نوبت agent live از `openai/gpt-5.5` استفاده می‌کند. وقتی عمداً مدل دیگری از OpenAI را اعتبارسنجی می‌کنید، `--model <provider/model>` را پاس دهید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان بپیچید تا توقف‌های transport مربوط به Parallels نتوانند باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت logهای تودرتوی مسیر را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از اینکه فرض کنید wrapper بیرونی گیر کرده است، `windows-update.log`، `macos-update.log` یا `linux-update.log` را بررسی کنید.
  - update در Windows می‌تواند روی یک guest سرد 10 تا 15 دقیقه را صرف کار doctor پس از update و به‌روزرسانی package کند؛ وقتی debug log تودرتوی npm پیش می‌رود، این وضعیت همچنان سالم است.
  - این wrapper تجمیعی را هم‌زمان با مسیرهای smoke جداگانه Parallels برای macOS، Windows یا Linux اجرا نکنید. آن‌ها وضعیت VM را مشترک دارند و ممکن است در restore snapshot، سرو package، یا وضعیت Gateway در guest با هم برخورد کنند.
  - proof پس از update سطح Plugin bundled معمول را اجرا می‌کند، چون facadeهای capability مانند speech، image generation و media understanding از طریق APIهای runtime bundled بارگذاری می‌شوند، حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون smoke مستقیم protocol شروع می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر live Matrix QA را در برابر یک homeserver یک‌بارمصرف Tuwunel مبتنی بر Docker اجرا می‌کند. فقط source-checkout — نصب‌های بسته‌بندی‌شده `qa-lab` را ship نمی‌کنند.
  - CLI کامل، کاتالوگ profile/scenario، env varها و چیدمان آرتیفکت: [Matrix QA](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر live Telegram QA را در برابر یک گروه خصوصی واقعی با استفاده از tokenهای driver و SUT bot از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. group id باید chat id عددی Telegram باشد.
  - از `--credential-source convex` برای credentialهای pooled مشترک پشتیبانی می‌کند. به‌طور پیش‌فرض از حالت env استفاده کنید، یا برای opt in به leaseهای pooled مقدار `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، به‌طوری‌که SUT bot یک username در Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید driver bot می‌تواند ترافیک bot گروه را مشاهده کند.
  - گزارش Telegram QA، خلاصه، و آرتیفکت observed-messages را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال driver تا پاسخ مشاهده‌شده SUT هستند.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید دچار drift نشوند؛ ماتریس پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن ماتریس نیست.

### credentialهای مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای `openclaw qa telegram` فعال باشد، QA lab یک lease انحصاری از pool مبتنی بر Convex می‌گیرد، هنگام اجرای مسیر برای آن lease Heartbeat می‌فرستد، و هنگام خاموش‌شدن lease را آزاد می‌کند.

اسکفولد مرجع پروژه Convex:

- `qa/convex-credential-broker/`

env varهای لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش credential:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci` و در غیر این صورت `maintainer` است)

env varهای اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با `http://` loopback برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

دستورهای admin مربوط به maintainer (pool add/remove/list) مشخصاً به `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای maintainerها:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای live از `doctor` استفاده کنید تا URL سایت Convex، secretهای broker، endpoint prefix، timeout مربوط به HTTP، و دسترسی‌پذیری admin/list را بدون چاپ مقادیر secret بررسی کنید. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI از `--json` استفاده کنید.

قرارداد پیش‌فرض نقطهٔ پایانی (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط راز نگه‌دارنده)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ اجارهٔ فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

ساختار محموله برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید یک رشتهٔ شناسهٔ عددی چت Telegram باشد.
- `admin/add` این ساختار را برای `kind: "telegram"` اعتبارسنجی می‌کند و محموله‌های بدشکل را رد می‌کند.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کنندهٔ سناریو برای آداپتورهای کانال جدید در [نمای کلی QA ← افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: اجراکنندهٔ انتقال را روی درز میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در مانیفست Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` متصل کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی فزاینده» (و افزایش ناپایداری/هزینه) در نظر بگیرید:

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعهٔ شارد `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است شاردهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: موجودی‌های هسته/واحد زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در شارد اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرآیندی (احراز هویت Gateway، مسیریابی، ابزارها، تجزیه، پیکربندی)
  - بازگشت‌های قطعی برای باگ‌های شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های حل‌گر و بارگذار سطح عمومی باید رفتار fallback گستردهٔ `api.js` و
    `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه
    APIهای منبع Plugin واقعیِ بسته‌بندی‌شده. بارگذاری‌های API واقعی Plugin به
    مجموعه‌های قرارداد/یکپارچه‌سازی تحت مالکیت Plugin تعلق دارند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، شاردها، و مسیرهای دامنه‌دار">

    - `pnpm test` بدون هدف، دوازده پیکربندی شارد کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را به‌جای یک فرآیند عظیم پروژهٔ ریشهٔ بومی اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پرترافیک کاهش می‌دهد و مانع می‌شود کارهای auto-reply/extension مجموعه‌های نامرتبط را گرسنه کنند.
    - `pnpm test --watch` همچنان از گراف پروژهٔ ریشهٔ بومی `vitest.config.ts` استفاده می‌کند، چون یک حلقهٔ watch چندشاردی عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` ابتدا هدف‌های صریح فایل/دایرکتوری را از مسیرهای دامنه‌دار عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` از پرداخت هزینهٔ راه‌اندازی کامل پروژهٔ ریشه جلوگیری می‌کند.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای git تغییریافته را به مسیرهای دامنه‌دار ارزان گسترش می‌دهد: ویرایش‌های مستقیم آزمون، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح منبع، و وابستگان گراف import محلی. ویرایش‌های پیکربندی/راه‌اندازی/بسته، آزمون‌ها را به‌صورت گسترده اجرا نمی‌کنند مگر اینکه صریحاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازهٔ بررسی هوشمند محلی عادی برای کارهای محدود است. diff را به هسته، آزمون‌های هسته، extensions، آزمون‌های extension، برنامه‌ها، مستندات، فرادادهٔ انتشار، ابزارهای Docker زنده، و ابزارسازی دسته‌بندی می‌کند، سپس فرمان‌های typecheck، lint، و نگهبان متناظر را اجرا می‌کند. آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فرادادهٔ انتشار هستند، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند، همراه با نگهبانی که تغییرات بسته بیرون از فیلد نسخهٔ سطح‌بالا را رد می‌کند.
    - ویرایش‌های harness زندهٔ Docker ACP بررسی‌های متمرکز اجرا می‌کنند: نحو shell برای اسکریپت‌های احراز هویت Docker زنده و اجرای خشک زمان‌بند Docker زنده. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های وابستگی، export، نسخه، و سایر سطح‌های بسته همچنان از نگهبان‌های گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد سبک از agents، فرمان‌ها، plugins، کمک‌کننده‌های auto-reply، `plugin-sdk`، و نواحی ابزار خالص مشابه از مسیر `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/سنگین از نظر runtime روی مسیرهای موجود می‌مانند.
    - فایل‌های منبع کمک‌کنندهٔ منتخب `plugin-sdk` و `commands` نیز اجراهای حالت تغییریافته را به آزمون‌های خواهر صریح در همان مسیرهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های کمک‌کننده از اجرای دوبارهٔ کل مجموعهٔ سنگین برای آن دایرکتوری جلوگیری می‌کنند.
    - `auto-reply` سطل‌های اختصاصی برای کمک‌کننده‌های هستهٔ سطح‌بالا، آزمون‌های یکپارچه‌سازی سطح‌بالای `reply.*`، و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به شاردهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک سطل سنگین از نظر import کل دنبالهٔ Node را در اختیار نگیرد.
    - CI عادی PR/main عمداً جاروب دسته‌ای extension و شارد فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation گردش کار فرزند جداگانهٔ `Plugin Prerelease` را برای آن مجموعه‌های سنگین Plugin/extension روی نامزدهای انتشار dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش اجراکنندهٔ تعبیه‌شده">

    - وقتی ورودی‌های کشف ابزار پیام یا context زمان اجرای compaction را تغییر می‌دهید،
      هر دو سطح پوشش را حفظ کنید.
    - بازگشت‌های کمک‌کنندهٔ متمرکز را برای مرزهای مسیریابی و نرمال‌سازی
      خالص اضافه کنید.
    - مجموعه‌های یکپارچه‌سازی اجراکنندهٔ تعبیه‌شده را سالم نگه دارید:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها تأیید می‌کنند که شناسه‌های دامنه‌دار و رفتار compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های فقط-کمک‌کننده
      جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایهٔ Vitest به‌طور پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از اجراکنندهٔ
      غیرایزوله در پروژه‌های ریشه، e2e، و پیکربندی‌های زنده استفاده می‌کند.
    - مسیر UI ریشه راه‌اندازی و بهینه‌ساز `jsdom` خود را حفظ می‌کند، اما روی
      همان اجراکنندهٔ غیرایزولهٔ مشترک نیز اجرا می‌شود.
    - هر شارد `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false`
      را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرآیندهای
      فرزند Node مربوط به Vitest اضافه می‌کند تا churn کامپایل V8 در اجراهای بزرگ محلی کاهش یابد.
      برای مقایسه با رفتار استاندارد V8، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام مسیرهای معماری را فعال می‌کند.
    - hook پیش از commit فقط قالب‌بندی انجام می‌دهد. فایل‌های قالب‌بندی‌شده را دوباره stage می‌کند و
      lint، typecheck، یا آزمون‌ها را اجرا نمی‌کند.
    - وقتی به دروازهٔ بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push
      `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیرهای دامنه‌دار ارزان عبور می‌کند. فقط وقتی agent
      تصمیم می‌گیرد یک ویرایش harness، پیکربندی، بسته، یا قرارداد واقعاً به پوشش گسترده‌تر
      Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را حفظ می‌کنند،
      فقط با سقف worker بالاتر.
    - مقیاس‌بندی خودکار worker محلی عمداً محافظه‌کارانه است و وقتی میانگین بار میزبان
      از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای همزمان Vitest به‌طور پیش‌فرض
      آسیب کمتری وارد می‌کنند.
    - پیکربندی پایهٔ Vitest پروژه‌ها/فایل‌های پیکربندی را به‌عنوان
      `forceRerunTriggers` علامت می‌زند تا اجرای دوبارهٔ حالت تغییریافته هنگام تغییر
      سیم‌کشی آزمون درست بماند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده فعال نگه می‌دارد؛
      اگر برای پروفایل‌گیری مستقیم یک محل cache صریح می‌خواهید،
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی کارایی">

    - `pnpm test:perf:imports` گزارش مدت import در Vitest به‌علاوهٔ خروجی
      تفکیک import را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای پروفایل‌گیری را به
      فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - دادهٔ زمان‌بندی شارد در `.artifacts/vitest-shard-timings.json` نوشته می‌شود.
      اجراهای کل پیکربندی از مسیر پیکربندی به‌عنوان کلید استفاده می‌کنند؛ شاردهای CI با الگوی include
      نام شارد را اضافه می‌کنند تا شاردهای فیلترشده جداگانه ردیابی شوند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را در importهای راه‌اندازی صرف می‌کند،
      وابستگی‌های سنگین را پشت یک درز محلی محدود `*.runtime.ts` نگه دارید و
      آن درز را مستقیماً mock کنید، به‌جای اینکه کمک‌کننده‌های runtime را فقط
      برای عبور دادن از `vi.mock(...)` به‌صورت عمیق import کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر
      `test:changed` را با مسیر بومی پروژهٔ ریشه برای آن diff ثبت‌شده مقایسه می‌کند
      و زمان دیواری به‌علاوهٔ حداکثر RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با مسیریابی
      فهرست فایل‌های تغییریافته از طریق
      `scripts/test-projects.mjs` و پیکربندی ریشهٔ Vitest بنچمارک می‌کند.
    - `pnpm test:perf:profile:main` یک پروفایل CPU نخ اصلی برای
      سربار راه‌اندازی و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` پروفایل‌های CPU+heap اجراکننده را برای مجموعهٔ
      واحد با موازی‌سازی فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجباراً با یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌طور پیش‌فرض شروع می‌کند
  - churn پیام Gateway مصنوعی، حافظه، و محمولهٔ بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC پرس‌وجو می‌کند
  - کمک‌کننده‌های ماندگاری بستهٔ پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجهٔ فشار می‌مانند، و عمق صف هر session دوباره به صفر تخلیه می‌شود
- انتظارها:
  - مناسب CI و بدون نیاز به کلید
  - مسیر محدود برای پیگیری بازگشت پایداری، نه جایگزینی برای مجموعهٔ کامل Gateway

### E2E (smoke مربوط به Gateway)

- فرمان: `pnpm test:e2e`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و آزمون‌های E2E Pluginهای بسته‌بندی‌شده زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیهٔ repo.
  - از workerهای تطبیقی استفاده می‌کند (CI: حداکثر ۲، محلی: پیش‌فرض ۱).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا سربار I/O کنسول کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد worker (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوبارهٔ خروجی verbose کنسول.
- دامنه:
  - رفتار سرتاسری Gateway چندنمونه‌ای
  - سطح‌های WebSocket/HTTP، جفت‌سازی node، و شبکه‌سازی سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلیدهای واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به آزمون‌های واحد دارد (ممکن است کندتر باشد)

### E2E: smoke بک‌اند OpenShell

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - یک Gateway ایزوله‌ی OpenShell را روی میزبان از طریق Docker شروع می‌کند
  - یک sandbox از یک Dockerfile محلی موقت ایجاد می‌کند
  - backend مربوط به OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌کند
  - رفتار فایل‌سیستم canonical از راه دور را از طریق پل fs مربوط به sandbox راستی‌آزمایی می‌کند
- انتظارات:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` به‌همراه یک daemon فعال Docker نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس Gateway و sandbox آزمایشی را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن آزمون هنگام اجرای دستی مجموعه‌ی e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI

### زنده (providerهای واقعی + مدل‌های واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده‌ی Pluginهای بسته‌بندی‌شده زیر `extensions/`
- پیش‌فرض: **فعال** توسط `pnpm test:live` (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این provider/model واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - گرفتن تغییرات قالب provider، رفتارهای خاص tool-calling، مشکلات auth، و رفتار rate limit
- انتظارات:
  - طبق طراحی برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی provider، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از rate limitها استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده `~/.profile` را source می‌کنند تا کلیدهای API گمشده را بردارند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و config/auth material را در یک home آزمایشی موقت کپی می‌کنند تا fixtureهای unit نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` را فقط زمانی تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از دایرکتوری home واقعی شما استفاده کنند.
- `pnpm test:live` اکنون به‌طور پیش‌فرض به حالت کم‌صداتری می‌رود: خروجی پیشرفت `[live] ...` را نگه می‌دارد، اما اعلان اضافی `~/.profile` را سرکوب می‌کند و logهای bootstrap مربوط به Gateway/گفت‌وگوی Bonjour را mute می‌کند. اگر می‌خواهید logهای کامل startup برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (ویژه‌ی provider): `*_API_KEYS` را با قالب comma/semicolon یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا override ویژه‌ی live را از طریق `OPENCLAW_LIVE_*_KEY` بدهید؛ آزمون‌ها روی پاسخ‌های rate limit دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr منتشر می‌کنند تا فراخوانی‌های طولانی provider حتی وقتی capture کنسول Vitest کم‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` interception کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت provider/Gateway فوراً هنگام اجراهای زنده stream شوند.
  - Heartbeatهای direct-model را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- ویرایش logic/tests: `pnpm test` را اجرا کنید (و اگر زیاد تغییر داده‌اید `pnpm test:coverage`)
- دست‌زدن به networking مربوط به Gateway / پروتکل WS / pairing: `pnpm test:e2e` را اضافه کنید
- debug کردن «bot من down است» / failureهای ویژه‌ی provider / tool calling: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (دارای تماس شبکه)

برای ماتریس مدل زنده، smokeهای backend مربوط به CLI، smokeهای ACP، harness مربوط به app-server در Codex، و همه‌ی آزمون‌های زنده‌ی media-provider (Deepgram، BytePlus، ComfyUI، image، music، video، media harness) — به‌علاوه‌ی مدیریت credential برای اجراهای زنده — ببینید
[آزمون مجموعه‌های زنده](/fa/help/testing-live). برای checklist اختصاصی update و اعتبارسنجی
Plugin، ببینید
[آزمون updateها و Pluginها](/fa/help/testing-updates-plugins).

## runnerهای Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این runnerهای Docker به دو دسته تقسیم می‌شوند:

- runnerهای live-model: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل live متناظر profile-key خود را داخل image مربوط به Docker repo اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، در حالی که دایرکتوری config و workspace محلی شما را mount می‌کنند (و اگر mount شده باشد `~/.profile` را source می‌کنند). entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- runnerهای زنده‌ی Docker به‌طور پیش‌فرض cap کوچک‌تری برای smoke دارند تا sweep کامل Docker عملی بماند:
  `test:docker:live-models` به‌طور پیش‌فرض `OPENCLAW_LIVE_MAX_MODELS=12` است، و
  `test:docker:live-gateway` به‌طور پیش‌فرض `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` است. وقتی صراحتاً اسکن exhaustive بزرگ‌تر را می‌خواهید، آن env varها را override کنید.
- `test:docker:all` image زنده‌ی Docker را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌عنوان npm tarball بسته‌بندی می‌کند، سپس دو image مربوط به `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. image خام فقط runner مربوط به Node/Git برای laneهای install/update/plugin-dependency است؛ آن laneها tarball ازپیش‌ساخته‌شده را mount می‌کنند. image کارکردی همان tarball را برای laneهای کارکرد built-app در `/app` نصب می‌کند. تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ logic مربوط به planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. aggregate از یک scheduler محلی weighted استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای process را کنترل می‌کند، در حالی که capهای resource نمی‌گذارند laneهای سنگین live، npm-install، و multi-service همگی هم‌زمان شروع شوند. اگر یک lane تنها از capهای فعال سنگین‌تر باشد، scheduler همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که capacity دوباره در دسترس شود، آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط زمانی تنظیم کنید که میزبان Docker headroom بیشتری دارد. runner به‌طور پیش‌فرض preflight مربوط به Docker را انجام می‌دهد، containerهای stale مربوط به OpenClaw E2E را حذف می‌کند، هر 30 ثانیه status چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها استفاده می‌کند تا در اجراهای بعدی laneهای طولانی‌تر را زودتر شروع کند. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest وزن‌دار laneها بدون ساختن یا اجرای Docker استفاده کنید، یا از `node scripts/test-docker-all.mjs --plan-json` برای چاپ plan مربوط به CI برای laneهای انتخاب‌شده، نیازهای package/image، و credentialها استفاده کنید.
- `Package Acceptance` gate بومی GitHub برای package است: «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» یک package کاندید را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را به‌عنوان `package-under-test` upload می‌کند، سپس laneهای قابل استفاده‌ی مجدد Docker E2E را در برابر همان tarball دقیق اجرا می‌کند، نه با repack کردن ref انتخاب‌شده. profileها بر اساس breadth مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای contract مربوط به package/update/Plugin، ماتریس survivor مربوط به published-upgrade، پیش‌فرض‌های release، و triage شکست، ببینید [آزمون updateها و Pluginها](/fa/help/testing-updates-plugins).
- بررسی‌های build و release پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف built ایستای `dist/entry.js` و `dist/cli/run-main.js` را walk می‌کند و اگر startup پیش از dispatch، وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را پیش از command dispatch import کند fail می‌شود؛ همچنین chunk مربوط به اجرای Gateway بسته‌بندی‌شده را زیر budget نگه می‌دارد و importهای ایستای مسیرهای شناخته‌شده‌ی cold gateway را reject می‌کند. smoke مربوط به CLI بسته‌بندی‌شده root help، onboard help، doctor help، status، config schema، و یک فرمان model-list را نیز پوشش می‌دهد.
- سازگاری legacy در Package Acceptance تا `2026.4.25` محدود شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata مربوط به packageهای shipped را تحمل می‌کند: ورودی‌های حذف‌شده‌ی private QA inventory، نبود `gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball، نبود `update.channel` persisted، locationهای legacy مربوط به install-record در Plugin، نبود persistence مربوط به install-record در marketplace، و migration مربوط به config metadata هنگام `plugins update`. برای packageهای پس از `2026.4.25`، آن مسیرها failure سخت هستند.
- runnerهای container smoke: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:pi-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای integration سطح بالاتر را راستی‌آزمایی می‌کنند.

runnerهای Docker مربوط به live-model همچنین فقط homeهای auth موردنیاز CLI را bind-mount می‌کنند (یا وقتی run محدود نشده باشد، همه‌ی موارد پشتیبانی‌شده را)، سپس پیش از run آن‌ها را در home container کپی می‌کنند تا OAuth مربوط به external-CLI بتواند tokenها را refresh کند، بدون اینکه auth store میزبان را تغییر دهد:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- دودآزمون اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌صورت پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- دودآزمون بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- دودآزمون مهار app-server برای Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- دودآزمون مشاهده‌پذیری: `pnpm qa:otel:smoke` یک مسیر خصوصی بررسی منبع در checkout مربوط به QA است. عمداً بخشی از مسیرهای انتشار Docker بسته نیست، چون npm tarball شامل QA Lab نمی‌شود.
- دودآزمون زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- دودآزمون راه‌اندازی اولیه/کانال/عامل npm tarball: `pnpm test:docker:npm-onboard-channel-agent`، OpenClaw tarball بسته‌بندی‌شده را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه env-ref به‌همراه Telegram به‌صورت پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک tarball ازپیش‌ساخته استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` بازسازی میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` کانال را تغییر دهید.
- دودآزمون تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch`، OpenClaw tarball بسته‌بندی‌شده را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کارکرد کانال ماندگارشده و Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دودآزمون بازمانده ارتقا: `pnpm test:docker:upgrade-survivor`، OpenClaw tarball بسته‌بندی‌شده را روی یک fixture کاربر قدیمی آلوده با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای provider زنده یا کانال اجرا می‌کند، سپس یک Gateway با loopback راه‌اندازی می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های راه‌اندازی/وضعیت را بررسی می‌کند.
- دودآزمون بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستور پخته‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway با loopback راه‌اندازی می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، راه‌اندازی، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهد، و fixtureهای issue-شکل را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند.
- دودآزمون context زمان اجرای session: `pnpm test:docker:session-runtime-context`، ماندگاری transcript context پنهان زمان اجرا به‌همراه تعمیر doctor برای شاخه‌های prompt-rewrite تکراری آسیب‌دیده را تأیید می‌کند.
- دودآزمون نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند `openclaw infer image providers --json` به‌جای گیر کردن، providerهای تصویر bundled را برمی‌گرداند. با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک tarball ازپیش‌ساخته استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ساخت میزبان را رد کنید، یا `dist/` را از یک image ساخته‌شده Docker با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دودآزمون Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache مشترک npm را بین کانتینرهای root، update و direct-npm خود به اشتراک می‌گذارد. دودآزمون به‌روزرسانی پیش از ارتقا به tarball نامزد، به‌صورت پیش‌فرض از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` یا در GitHub با ورودی `update_baseline_version` در workflow مربوط به Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده غیر-root یک cache ایزوله npm نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده مجدد از cache ریشه/update/direct-npm در اجرای دوباره محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI به‌روزرسانی سراسری direct-npm تکراری را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دودآزمون CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌صورت پیش‌فرض image ریشه Dockerfile را می‌سازد، دو عامل را با یک workspace در home کانتینر ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. از image install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دودآزمون snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) image منبع E2E به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای لینک، موارد قابل‌کلیک ارتقاداده‌شده با cursor، refهای iframe و metadata قاب هستند.
- رگرسیون استدلال حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema توسط provider را اجباری می‌کند و بررسی می‌کند جزئیات خام در logهای Gateway ظاهر شود.
- پل کانال MCP (Gateway seedشده + پل stdio + دودآزمون خام notification-frame برای Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته Pi (سرور واقعی stdio MCP + دودآزمون allow/deny پروفایل Pi تعبیه‌شده): `pnpm test:docker:pi-bundle-mcp-tools` (اسکریپت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- پاک‌سازی Cron/subagent MCP (Gateway واقعی + برچیدن فرزند stdio MCP پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoistشده، refهای متحرک git، kitchen-sink در ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض بسته/زمان اجرای kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، تست از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- دودآزمون بدون تغییر به‌روزرسانی Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دودآزمون metadata بارگذاری دوباره پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` دودآزمون نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry مربوط به npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی Claude-bundle را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد.

برای پیش‌ساخت و استفاده مجدد دستی از image عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های image ویژه suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هنگام تنظیم شدن همچنان اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک image مشترک remote اشاره کند، اگر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. تست‌های QR و Docker نصب‌کننده Dockerfileهای خود را نگه می‌دارند، چون رفتار بسته/نصب را اعتبارسنجی می‌کنند، نه runtime برنامه ساخته‌شده مشترک.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت read-only bind-mount می‌کنند و
آن را درون کانتینر در یک workdir موقت stage می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد، در حالی که Vitest همچنان روی همان منبع/پیکربندی دقیق محلی شما اجرا می‌شود.
مرحله staging از cacheهای بزرگ فقط-محلی و خروجی‌های ساخت برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle عبور می‌کند تا اجراهای زنده Docker چند دقیقه صرف کپی کردن artifactهای
مختص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده Gateway
workerهای کانال واقعی Telegram/Discord/و غیره را داخل کانتینر شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زنده
Gateway را در آن مسیر Docker محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز عبور دهید.
`test:docker:openwebui` یک دودآزمون سازگاری سطح بالاتر است: یک کانتینر gateway
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال راه‌اندازی می‌کند،
یک کانتینر Open WebUI pinشده را در برابر آن gateway راه‌اندازی می‌کند، از طریق
Open WebUI وارد می‌شود، تأیید می‌کند `/api/models` مقدار `openclaw/default` را ارائه می‌کند، سپس یک
درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI می‌فرستد.
اجرای نخست می‌تواند به‌طور محسوسی کندتر باشد، چون Docker شاید نیاز داشته باشد image مربوط به
Open WebUI را pull کند و Open WebUI شاید نیاز داشته باشد راه‌اندازی cold-start خودش را تمام کند.
این مسیر انتظار یک کلید مدل زنده قابل‌استفاده را دارد، و `OPENCLAW_PROFILE_FILE`
(به‌صورت پیش‌فرض `~/.profile`) راه اصلی ارائه آن در اجراهای Dockerized است.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord یا iMessage نیاز ندارد. یک کانتینر Gateway
seedشده را boot می‌کند، کانتینر دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف گفت‌وگوی routed، خواندن transcript، metadata پیوست،
رفتار صف رویداد زنده، routing ارسال outbound، و اعلان‌های کانال +
مجوز به سبک Claude را روی پل واقعی stdio MCP تأیید می‌کند. بررسی اعلان
قاب‌های خام stdio MCP را مستقیم inspect می‌کند تا دودآزمون همان چیزی را اعتبارسنجی کند که
پل واقعاً emit می‌کند، نه فقط چیزی که یک SDK کلاینت خاص اتفاقاً surface می‌کند.
`test:docker:pi-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
image Docker مخزن را می‌سازد، یک سرور probe واقعی stdio MCP را داخل کانتینر
راه‌اندازی می‌کند، آن سرور را از طریق runtime بسته Pi تعبیه‌شده
MCP materialize می‌کند، ابزار را اجرا می‌کند، سپس تأیید می‌کند `coding` و `messaging`
ابزارهای `bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را فیلتر می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده
نیاز ندارد. یک Gateway seedشده را با یک سرور probe واقعی stdio MCP شروع می‌کند، یک
نوبت cron ایزوله و یک نوبت فرزند یک‌باره `/subagents spawn` را اجرا می‌کند، سپس تأیید می‌کند
فرایند فرزند MCP پس از هر اجرا خارج می‌شود.

دودآزمون دستی thread زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این اسکریپت را برای workflowهای رگرسیون/اشکال‌زدایی نگه دارید. ممکن است دوباره برای اعتبارسنجی routing مربوط به thread در ACP لازم شود، پس آن را حذف نکنید.

متغیرهای env مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` (پیش‌فرض: `~/.profile`) که روی `/home/node/.profile` mount می‌شود و پیش از اجرای تست‌ها source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای تأیید فقط متغیرهای محیطی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای احراز هویت CLI خارجی
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که روی `/home/node/.npm-global` برای نصب‌های CLI کش‌شده داخل Docker mount می‌شود
- دایرکتوری‌ها/فایل‌های احراز هویت CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع تست‌ها در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - اجراهای محدودشده به ارائه‌دهنده، فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست جداشده با ویرگول مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` بازنویسی کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای فیلتر کردن ارائه‌دهنده‌ها درون کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفادهٔ دوباره از یک image موجود `openclaw:local-live` در اجراهای مجددی که به build دوباره نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه اعتبارنامه‌ها از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke مربوط به Open WebUI ارائه می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای بازنویسی prompt بررسی nonce که smoke مربوط به Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای بازنویسی tag ثابت‌شدهٔ image مربوط به Open WebUI

## بررسی سلامت مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## رگرسیون آفلاین (ایمن برای CI)

این‌ها رگرسیون‌های «pipeline واقعی» بدون ارائه‌دهنده‌های واقعی هستند:

- فراخوانی ابزار Gateway (OpenAI شبیه‌سازی‌شده، gateway واقعی + حلقهٔ agent): `src/gateway/gateway.test.ts` (مورد: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- ویزارد Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اعمال auth): `src/gateway/gateway.test.ts` (مورد: "runs wizard over ws and writes auth token config")

## ارزیابی‌های قابلیت اطمینان agent (Skills)

از قبل چند تست ایمن برای CI داریم که مانند «ارزیابی‌های قابلیت اطمینان agent» رفتار می‌کنند:

- فراخوانی ابزار mock از طریق Gateway واقعی + حلقهٔ agent (`src/gateway/gateway.test.ts`).
- جریان‌های end-to-end ویزارد که اتصال session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (نگاه کنید به [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست شده‌اند، آیا agent skill درست را انتخاب می‌کند (یا از موارد نامرتبط اجتناب می‌کند)؟
- **انطباق:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و گام‌ها/آرگومان‌های لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چندمرحله‌ای که ترتیب ابزارها، انتقال تاریخچهٔ session، و مرزهای sandbox را assert می‌کنند.

ارزیابی‌های آینده ابتدا باید deterministic بمانند:

- یک scenario runner با استفاده از ارائه‌دهنده‌های mock برای assert کردن فراخوانی‌های ابزار + ترتیب، خواندن فایل skill، و اتصال session.
- یک مجموعهٔ کوچک از سناریوهای متمرکز بر skill (استفاده در برابر اجتناب، gating، prompt injection).
- ارزیابی‌های live اختیاری (opt-in و env-gated) فقط پس از آماده شدن مجموعهٔ ایمن برای CI.

## تست‌های قرارداد (شکل Plugin و کانال)

تست‌های قرارداد تأیید می‌کنند که هر Plugin و کانال ثبت‌شده با
قرارداد interface خود منطبق است. آن‌ها همهٔ Pluginهای کشف‌شده را پیمایش می‌کنند و مجموعه‌ای از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های seam مشترک و smoke را رد می‌کند؛ وقتی سطح‌های کانال مشترک یا ارائه‌دهنده را تغییر می‌دهید،
دستورهای قرارداد را صراحتاً اجرا کنید.

### دستورها

- همهٔ قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای ارائه‌دهنده: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایهٔ Plugin (id، name، capabilities)
- **setup** - قرارداد ویزارد راه‌اندازی
- **session-binding** - رفتار اتصال session
- **outbound-payload** - ساختار payload پیام
- **inbound** - رسیدگی به پیام ورودی
- **actions** - handlerهای action کانال
- **threading** - رسیدگی به Thread ID
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال policy گروه

### قراردادهای وضعیت ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت کانال
- **registry** - شکل رجیستری Plugin

### قراردادهای ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - قرارداد جریان auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime ارائه‌دهنده
- **shape** - شکل/interface Plugin
- **wizard** - ویزارد راه‌اندازی

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر دادن یک کانال یا Plugin ارائه‌دهنده
- پس از refactor کردن ثبت یا کشف Plugin

تست‌های قرارداد در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن رگرسیون‌ها (راهنما)

وقتی یک مشکل ارائه‌دهنده/مدل را که در live کشف شده است اصلاح می‌کنید:

- در صورت امکان یک رگرسیون ایمن برای CI اضافه کنید (mock/stub ارائه‌دهنده، یا ثبت دقیق تبدیل شکل درخواست)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، تست live را محدود و opt-in از طریق متغیرهای env نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که باگ را می‌گیرد:
  - باگ تبدیل/بازپخش درخواست ارائه‌دهنده → تست مستقیم مدل‌ها
  - باگ pipeline مربوط به session/history/tool در gateway → smoke زندهٔ gateway یا تست mock gateway ایمن برای CI
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata رجیستری (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک هدف نمونه مشتق می‌کند، سپس assert می‌کند که exec idهای دارای traversal-segment رد می‌شوند.
  - اگر یک خانوادهٔ هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن تست به‌روزرسانی کنید. تست عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا کلاس‌های جدید بی‌صدا نادیده گرفته نشوند.

## مرتبط

- [تست live](/fa/help/testing-live)
- [تست updateها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
