---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-02T20:59:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمایش (مجموعه‌ها، زنده، Docker): [آزمایش](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته Plugin: [آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با یک نمونه در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال‌شده باقی گذاشته است از این استفاده کنید.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک دروازه پوشش واحد برای فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70٪ برای خطوط/توابع/دستورات و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است، این دروازه فایل‌هایی را اندازه‌گیری می‌کند که توسط مجموعه پوشش واحد بارگذاری شده‌اند، نه اینکه هر فایل منبعِ خط‌های جداشده را پوشش‌داده‌نشده در نظر بگیرد.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای تست تغییرات هوشمند و ارزان. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته رد می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح تست تغییرات گسترده. وقتی ویرایش test harness/پیکربندی/بسته باید به رفتار گسترده‌تر تست‌های تغییریافته Vitest برگردد از آن استفاده کنید.
- `pnpm changed:lanes`: خط‌های معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: دروازه بررسی تغییرات هوشمند را برای diff نسبت به `origin/main` اجرا می‌کند. typecheck، lint، و فرمان‌های نگهبان را برای خط‌های معماریِ تحت تأثیر اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از مسیر خط‌های Vitest محدوده‌دار عبور می‌دهد. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند بزرگ root-project، به پیکربندی‌های shard به‌ازای هر extension گسترش می‌یابد.
- اجراهای test wrapper با خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابند. خط مدت‌زمان خود Vitest به‌عنوان جزئیات به‌ازای هر shard باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا ذخیره auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` در Vitest استفاده کنید.
- کمک‌کننده‌های E2E فرایند: وقتی یک تست E2E در سطح فرایند Vitest به یک Gateway در حال اجرا، محیط CLI، ضبط لاگ، و پاک‌سازی در یک جا نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- کمک‌کننده‌های E2E Docker/Bash: خط‌هایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به کانتینر بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های چند-home می‌توانند `docker_e2e_test_state_function_b64` را بدهند و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخواننده‌های سطح پایین‌تر می‌توانند برای یک snippet شل داخل کانتینر از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` استفاده کنند، یا برای یک فایل env میزبان قابل source شدن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، گزینه `--env-file` را به‌عنوان flag مربوط به Node تلقی کنند. خط‌های Docker/Bash که یک Gateway راه‌اندازی می‌کنند می‌توانند داخل کانتینر `scripts/lib/openclaw-e2e-instance.sh` را source کنند برای resolve کردن entrypoint، راه‌اندازی mock OpenAI، اجرای foreground/background برای Gateway، probeهای آمادگی، export محیط وضعیت، dump لاگ‌ها، و پاک‌سازی فرایند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی‌های shard فیلترشده را بدون جایگزین کردن داده زمان‌بندی whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست انتخاب‌شده `plugin-sdk` و `commands` اکنون از مسیر خط‌های سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موردهای سنگین از نظر runtime را روی خط‌های موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست‌های خواهر پیش از fallback به globهای گسترده‌تر دایرکتوری، به آن تست خواهر نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کنند تا به‌جای اجرای گسترده هر shard وقتی مسیر وابستگی دقیق است، تست‌های importکننده را اجرا کنند.
- `auto-reply` اکنون به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) نیز تقسیم می‌شود تا harness پاسخ بر تست‌های سبک‌تر وضعیت/token/helper سطح بالا غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک غیرایزوله در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels` فایل `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/Plugin را اجرا می‌کنند. Pluginهای کانال سنگین، Plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت دسته‌ای باقی می‌مانند. برای یک خط Plugin بسته‌بندی‌شده، از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌گیری مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی خط محدوده‌دار استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان پروفایل‌گیری import، اما فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر حالت تغییریافته مسیریابی‌شده را در برابر اجرای native root-project برای همان diff کامیت‌شده git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییر فعلی worktree را بدون کامیت کردن اولیه benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک پروفایل CPU برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: پروفایل‌های CPU و heap را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی برگ Vitest مربوط به full-suite را به‌صورت سری اجرا می‌کند و داده مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log به‌ازای هر پیکربندی می‌نویسد. Test Performance Agent از این به‌عنوان baseline خود پیش از تلاش برای اصلاح تست‌های کند استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر کارایی مقایسه می‌کند.
- یکپارچه‌سازی Gateway: با `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: تست‌های smoke انتهابه‌انتهای Gateway را اجرا می‌کند (pairing چندنمونه‌ای WS/HTTP/node). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای adaptive در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای لاگ‌های پرجزئیات `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` ویژه provider) نیاز دارد.
- `pnpm test:docker:all`: image مشترک live-test را build می‌کند، OpenClaw را یک‌بار به‌عنوان یک tarball npm بسته‌بندی می‌کند، یک image runner خام Node/Git به‌همراه یک image عملکردی که آن tarball را در `/app` نصب می‌کند build/بازاستفاده می‌کند، سپس خط‌های smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. image خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای خط‌های installer/update/plugin-dependency استفاده می‌شود؛ آن خط‌ها به‌جای استفاده از sourceهای کپی‌شده repo، tarball از پیش build شده را mount می‌کنند. image عملکردی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای خط‌های عملکرد عادی built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها package packer محلی/CI است و پیش از مصرف Docker، tarball به‌همراه `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های خط Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` plan تحت مالکیت scheduler در CI را برای خط‌های انتخاب‌شده، گونه‌های image، نیازهای package/live-image، سناریوهای وضعیت، و بررسی‌های credential بدون build یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. سقف‌های خط سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ سقف‌های provider به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` برابر یک خط سنگین برای هر provider هستند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک خط روی میزبان با موازی‌سازی پایین از سقف وزن یا منبع مؤثر فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا آزاد کردن ظرفیت به‌تنهایی اجرا خواهد شد. شروع خط‌ها به‌صورت پیش‌فرض با فاصله 2 ثانیه انجام می‌شود تا از توفان create در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، کانتینرهای E2E کهنه OpenClaw را پاک می‌کند، هر 30 ثانیه وضعیت active-lane را منتشر می‌کند، cacheهای ابزار CLI provider را میان خط‌های سازگار به اشتراک می‌گذارد، شکست‌های transient مربوط به live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی خط‌ها را در `.artifacts/docker-tests/lane-timings.json` برای ترتیب‌دهی longest-first در اجراهای بعدی ذخیره می‌کند. برای چاپ manifest خط بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` استفاده کنید، یا برای غیرفعال کردن بازاستفاده از زمان‌بندی `OPENCLAW_DOCKER_ALL_TIMINGS=0` را به‌کار ببرید. برای فقط خط‌های قطعی/محلی از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط خط‌های live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only خط‌های live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را با هم بسته‌بندی کنند. runner پس از اولین شکست، زمان‌بندی خط‌های pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر خط یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ خط‌های live/tail انتخاب‌شده از سقف‌های سخت‌گیرانه‌تر به‌ازای هر خط استفاده می‌کنند. فرمان‌های راه‌اندازی Docker برای backend CLI timeout خودشان را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). لاگ‌های به‌ازای هر خط، `summary.json`، `failures.json`، و زمان‌بندی فازها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی خط‌های کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک کانتینر E2E مبتنی بر source با پشتوانه Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickableهای ارتقایافته با cursor، refهای iframe، و metadata فریم باشند.
- probeهای live Docker برای backend CLI می‌توانند به‌عنوان خط‌های متمرکز اجرا شوند، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini نیز aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw و Open WebUI را به‌صورت Dockerized شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از مسیر `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک image خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مثل مجموعه‌های عادی unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک کانتینر Gateway seed شده و یک کانتینر client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه مسیریابی‌شده، خواندن transcript، metadata پیوست، رفتار صف رویداد live، مسیریابی ارسال outbound، و اعلان‌های کانال و مجوز به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion اعلان Claude فریم‌های خام stdio MCP را مستقیم می‌خواند تا smoke آنچه واقعاً bridge منتشر می‌کند را بازتاب دهد.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شدهٔ OpenClaw را روی یک fixture کاربر قدیمیِ آلوده نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای provider یا channel زنده اجرا می‌کند، سپس یک Gateway حلقه‌بازگشتی را راه‌اندازی می‌کند و بررسی می‌کند که agentها، پیکربندی channel، فهرست‌های مجاز Plugin، فایل‌های workspace/session، وضعیت قدیمی و منسوخ وابستگی Plugin، راه‌اندازی، و وضعیت RPC حفظ شوند.
- `pnpm test:docker:published-upgrade-survivor`: به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را بدون کلیدهای provider یا channel زنده seed می‌کند، آن baseline را با یک recipe آمادهٔ فرمان `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شدهٔ OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشتی را راه‌اندازی می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنهٔ Plugin و وضعیت قدیمی وابستگی، راه‌اندازی، `/healthz`، `/readyz`، و وضعیت RPC حفظ شوند یا پاکیزه repair شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، یک matrix دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهید، یا fixtureهای scenario را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعهٔ reported-issues شامل `configured-plugin-installs` است تا بررسی کند Pluginهای خارجی پیکربندی‌شدهٔ OpenClaw هنگام upgrade به‌صورت خودکار نصب می‌شوند. Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` در دسترس می‌گذارد.
- `pnpm test:docker:update-migration`: harness منتشرشدهٔ upgrade-survivor را در scenario پاک‌سازی‌محور `plugin-deps-cleanup` اجرا می‌کند و به‌صورت پیش‌فرض از `openclaw@2026.4.23` شروع می‌شود. workflow جداگانهٔ `Update Migration` این lane را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بستهٔ پایدار منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را بیرون از Full Release CI اثبات کند.
- `pnpm test:docker:plugins`: smoke نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های npm registry با وابستگی‌های hoist‌شده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/inspect بستهٔ Claude اجرا می‌کند.

## گیت PR محلی

برای بررسی‌های land/gate محلی PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار ناپایدار شد، پیش از تلقی آن به‌عنوان رگرسیون، یک بار دوباره اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های با محدودیت حافظه، از این‌ها استفاده کنید:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچمارک تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک واژه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی.»

آخرین اجرا (2025-12-31، 20 اجرا):

- minimax میانه 1279ms (کمینه 1114، بیشینه 2431)
- opus میانه 2454ms (کمینه 1224، بیشینه 3170)

## بنچمارک راه‌اندازی CLI

اسکریپت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

نحوه استفاده:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

presetها:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: هر دو preset

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` artifact دود تست هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` artifact مجموعه کامل را در `.artifacts/cli-startup-bench-all.json` با استفاده از `runs=5` و `warmup=1` می‌نویسد
- `pnpm test:startup:bench:update` baseline fixture ثبت‌شده را در `test/fixtures/cli-startup-bench.json` با استفاده از `runs=5` و `warmup=1` تازه‌سازی می‌کند

fixture ثبت‌شده:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با fixture مقایسه کنید

## E2E آنبوردینگ (Docker)

Docker اختیاری است؛ این فقط برای دود تست‌های آنبوردینگ کانتینری لازم است.

جریان cold-start کامل در یک کانتینر تمیز Linux:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت ویزارد تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را بررسی می‌کند، سپس Gateway را راه‌اندازی می‌کند و `openclaw health` را اجرا می‌کند.

## دود تست وارد کردن QR (Docker)

اطمینان می‌دهد helper نگهداری‌شده runtime برای QR زیر runtimeهای پشتیبانی‌شده Docker Node بارگذاری می‌شود (پیش‌فرض Node 24، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمون](/fa/help/testing)
- [آزمون زنده](/fa/help/testing-live)
- [آزمون به‌روزرسانی‌ها و plugins](/fa/help/testing-updates-plugins)
