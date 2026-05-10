---
read_when:
    - اجرای آزمون‌ها یا اصلاح آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-10T20:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمایش (مجموعه‌ها، زنده، Docker): [آزمایش](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته Plugin: [آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که درگاه کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعه کامل Vitest را با یک درگاه Gateway ایزوله اجرا می‌کند تا آزمایش‌های سرور با یک نمونه در حال اجرا تداخل پیدا نکنند. وقتی اجرای قبلی Gateway درگاه 18789 را اشغال‌شده باقی گذاشته است، از این استفاده کنید.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک gate پوشش برای lane واحد پیش‌فرض است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70٪ برای خطوط/توابع/دستورها و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است و lane پیش‌فرض محدوده includeهای پوشش را به آزمایش‌های واحد غیرسریع دارای فایل‌های source هم‌جوار محدود می‌کند، این gate به‌جای هر import گذرایی که اتفاقا بارگذاری می‌کند، source متعلق به این lane را اندازه‌گیری می‌کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان و هوشمند آزمایش‌های تغییریافته. این دستور هدف‌های دقیق را از ویرایش مستقیم آزمایش‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح source، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته نادیده گرفته می‌شوند مگر اینکه به آزمایش‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده آزمایش‌های تغییریافته. وقتی ویرایش harness/پیکربندی/بسته آزمایش باید به رفتار گسترده‌تر آزمایش‌های تغییریافته Vitest برگردد، از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: gate بررسی هوشمند تغییرات را برای diff نسبت به `origin/main` اجرا می‌کند. این دستور typecheck، lint، و فرمان‌های guard را برای laneهای معماری متاثر اجرا می‌کند، اما آزمایش‌های Vitest را اجرا نمی‌کند. برای اثبات آزمایشی از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از طریق laneهای محدوده‌دار Vitest مسیریابی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های leaf گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند عظیم root-project، به پیکربندی‌های shard هر extension گسترش می‌یابد.
- اجرای wrapper آزمایش با خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد. خط مدت‌زمان خود Vitest به‌عنوان جزئیات هر shard باقی می‌ماند.
- وضعیت آزمایش مشترک OpenClaw: وقتی یک آزمایش در Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا مخزن auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- helperهای E2E فرایند: وقتی یک آزمایش E2E در سطح فرایند Vitest به یک Gateway در حال اجرا، env برای CLI، ثبت log، و cleanup در یک محل نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- helperهای E2E برای Docker/Bash: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس بدهند و با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ scriptهای چند-home می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` برای یک قطعه shell داخل container، یا از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` برای یک فایل env میزبان قابل source استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، گزینه `--env-file` را به‌عنوان flag مربوط به Node تفسیر کنند. laneهای Docker/Bash که یک Gateway راه‌اندازی می‌کنند می‌توانند `scripts/lib/openclaw-e2e-instance.sh` را داخل container source کنند تا حل entrypoint، راه‌اندازی mock OpenAI، اجرای Gateway در foreground/background، probeهای readiness، export کردن env وضعیت، dumpهای log، و cleanup فرایند را انجام دهند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن‌کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی shardهای فیلترشده را بدون جایگزین‌کردن داده زمان‌بندی whole-config قابل مشاهده نگه می‌دارد. برای نادیده‌گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های آزمایش منتخب `plugin-sdk` و `commands` اکنون از طریق laneهای سبک اختصاصی مسیریابی می‌شوند که فقط `test/setup.ts` را نگه می‌دارند و موردهای runtime-heavy را روی laneهای فعلی‌شان باقی می‌گذارند.
- فایل‌های source دارای آزمایش هم‌جوار پیش از برگشت به globهای دایرکتوری گسترده‌تر، به همان هم‌جوار نگاشت می‌شوند. ویرایش helperها زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی برای اجرای آزمایش‌های importکننده استفاده می‌کند، به‌جای اجرای گسترده هر shard وقتی مسیر dependency دقیق است.
- `auto-reply` اکنون به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) هم تقسیم می‌شود تا harness پاسخ بر آزمایش‌های سبک‌تر وضعیت/token/helper سطح بالا غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض از `pool: "threads"` و `isolate: false` استفاده می‌کند، و runner غیرایزوله مشترک در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/plugin را اجرا می‌کنند. pluginهای کانال سنگین، plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های plugin دیگر batch شده باقی می‌مانند. برای lane یک plugin بسته‌بندی‌شده، از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، درحالی‌که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی lane محدوده‌دار استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import، اما فقط برای فایل‌هایی که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed changed-mode را در برابر اجرای بومی root-project برای همان diff ثبت‌شده git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون commit کردن قبلی benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: CPU profile و heap profile را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی leaf از مجموعه کامل Vitest را به‌صورت سری اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log برای هر پیکربندی می‌نویسد. Test Performance Agent از این به‌عنوان baseline پیش از تلاش برای اصلاح آزمایش‌های کند استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر عملکرد مقایسه می‌کند.
- یکپارچه‌سازی Gateway: با `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: آزمایش‌های smoke سرتاسری Gateway را اجرا می‌کند (جفت‌سازی چندنمونه‌ای WS/HTTP/node). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای تطبیقی در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose، `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: آزمایش‌های live provider را اجرا می‌کند (minimax/zai). برای unskip به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: image مشترک live-test را می‌سازد، OpenClaw را یک‌بار به‌عنوان یک tarball npm بسته‌بندی می‌کند، یک image runner خام Node/Git به‌همراه یک image عملکردی که آن tarball را در `/app` نصب می‌کند می‌سازد/بازاستفاده می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. image خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ این laneها به‌جای استفاده از sourceهای کپی‌شده مخزن، tarball ازپیش‌ساخته را mount می‌کنند. image عملکردی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای عادی عملکرد built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer بسته محلی/CI است و پیش از مصرف Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` برنامه CI تحت مالکیت scheduler را برای laneهای انتخاب‌شده، نوع‌های image، نیازهای package/live-image، سناریوهای وضعیت، و بررسی‌های credential بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و مقدار پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و مقدار پیش‌فرض آن 10 است. سقف laneهای سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است؛ سقف providerها به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` روی یک lane سنگین برای هر provider تنظیم می‌شود. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی یک میزبان با parallelism پایین از سقف موثر وزن یا resource بیشتر شود، همچنان می‌تواند از یک pool خالی شروع شود و تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض با فاصله 2 ثانیه stagger می‌شود تا از موج‌های ایجاد محلی Docker daemon جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` override کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، containerهای stale OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت lane فعال را منتشر می‌کند، cacheهای ابزار CLI provider را میان laneهای سازگار به‌اشتراک می‌گذارد، شکست‌های گذرای live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی laneها را در `.artifacts/docker-tests/lane-timings.json` برای مرتب‌سازی longest-first در اجراهای بعدی ذخیره می‌کند. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1`، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال‌کردن بازاستفاده از زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط laneهای قطعی/محلی از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط laneهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only، laneهای live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را کنار هم جا بدهند. runner پس از اولین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک fallback timeout 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ laneهای live/tail منتخب از سقف‌های سخت‌گیرانه‌تر هر lane استفاده می‌کنند. فرمان‌های راه‌اندازی Docker برای backend CLI timeout خودشان را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و زمان‌بندی فازها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container E2E source مبتنی بر Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickableهای ارتقایافته با cursor، refهای iframe، و metadata فریم باشند.
- `pnpm test:docker:skill-install`: tarball بسته‌بندی‌شده OpenClaw را در یک runner خام Docker نصب می‌کند، `skills.install.allowUploadedArchives` را غیرفعال می‌کند، یک slug فعلی skill را از جست‌وجوی live ClawHub resolve می‌کند، آن را از طریق `openclaw skills install` نصب می‌کند، و `SKILL.md`، `.clawhub/origin.json`، `.clawhub/lock.json`، و `skills info --json` را اعتبارسنجی می‌کند.
- probeهای live Docker برای backend CLI را می‌توان به‌عنوان laneهای متمرکز اجرا کرد، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini نیز aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را در Docker شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید live model قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک image خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های عادی unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک کانتینر Gateway با داده‌های اولیه و یک کانتینر کلاینت دوم را شروع می‌کند که `openclaw mcp serve` را اجرا می‌کند، سپس کشف گفت‌وگوی مسیریابی‌شده، خواندن رونوشت‌ها، فرادادهٔ پیوست‌ها، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude را از طریق پل واقعی stdio بررسی می‌کند. ادعای اعلان Claude فریم‌های خام stdio MCP را مستقیماً می‌خواند تا smoke همان چیزی را بازتاب دهد که پل واقعاً منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: تاربال بسته‌بندی‌شدهٔ OpenClaw را روی یک fixture کثیفِ کاربر قدیمی نصب می‌کند، به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای زندهٔ provider یا کانال اجرا می‌کند، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی کانال، allowlistهای plugin، فایل‌های workspace/session، وضعیت stale وابستگی plugin قدیمی، راه‌اندازی، و وضعیت RPC باقی بمانند.
- `pnpm test:docker:published-upgrade-survivor`: به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را بدون کلیدهای زندهٔ provider یا کانال seed می‌کند، آن baseline را با یک دستورالعمل آمادهٔ فرمان `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به تاربال بسته‌بندی‌شدهٔ OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشتی را شروع می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی stale plugin و وضعیت وابستگی قدیمی، راه‌اندازی، `/healthz`، `/readyz`، و وضعیت RPC باقی بمانند یا تمیز repair شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، یک ماتریس محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعهٔ reported-issues شامل `configured-plugin-installs` است تا بررسی کند pluginهای خارجی پیکربندی‌شدهٔ OpenClaw هنگام ارتقا به‌صورت خودکار نصب می‌شوند و شامل `stale-source-plugin-shadow` است تا سایه‌های plugin فقط-منبع باعث خرابی راه‌اندازی نشوند. Package Acceptance این موارد را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند و توکن‌های meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را پیش از تحویل package specهای دقیق به laneهای Docker resolve می‌کند.
- `pnpm test:docker:update-migration`: harness published-upgrade survivor را در سناریوی cleanup-heavy یعنی `plugin-deps-cleanup` اجرا می‌کند و به‌صورت پیش‌فرض از `openclaw@2026.4.23` شروع می‌کند. workflow جداگانهٔ `Update Migration` این lane را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بستهٔ stable منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی configured-plugin را خارج از Full Release CI اثبات کند.
- `pnpm test:docker:plugins`: smoke نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های npm registry با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی بستهٔ Claude اجرا می‌کند.

## گیت محلی PR

برای بررسی‌های محلی فرود/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی میزبان پربار ناپایدار شد، پیش از در نظر گرفتن آن به‌عنوان پس‌رفت، یک‌بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه، از این موارد استفاده کنید:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچمارک تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: "با یک واژه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی."

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

پیش‌تنظیم‌ها:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: هر دو پیش‌تنظیم

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` پروفایل‌های V8 را برای هر اجرا می‌نویسند تا زمان‌سنجی و ضبط پروفایل از همان ابزار آزمون استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت دود هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` با استفاده از `runs=5` و `warmup=1` آرتیفکت مجموعه کامل را در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` با استفاده از `runs=5` و `warmup=1` فیکسچر مبنای ثبت‌شده در مخزن را در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

فیکسچر ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با فیکسچر مقایسه کنید

## آزمون سرتاسری راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای آزمون‌های دود راه‌اندازی اولیه کانتینری لازم است.

جریان کامل شروع سرد در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت جادوگر تعاملی را از طریق یک شبه-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## آزمون دود ورود QR (Docker)

اطمینان می‌دهد که ابزار کمکی نگهداری‌شده زمان اجرای QR زیر زمان‌های اجرای پشتیبانی‌شده Docker Node بارگذاری می‌شود (پیش‌فرض Node 24، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمایش](/fa/help/testing)
- [آزمایش زنده](/fa/help/testing-live)
- [آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
