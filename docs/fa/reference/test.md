---
read_when:
    - اجرای آزمون‌ها یا رفع ایرادهای آن‌ها
summary: نحوه اجرای تست‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-06-28T00:14:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- ترتیب معمول تست محلی:
  1. `pnpm test:changed` برای اثبات Vitest در محدوده تغییرکرده.
  2. `pnpm test <path-or-filter>` برای یک فایل، دایرکتوری، یا هدف صریح.
  3. `pnpm test` فقط وقتی عمدا به مجموعه کامل محلی Vitest نیاز دارید.
- `pnpm test:force`: هر فرایند gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعه کامل Vitest را با یک پورت gateway ایزوله اجرا می‌کند تا تست‌های سرور با نمونه در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی gateway پورت 18789 را اشغال کرده است، از این استفاده کنید.
- `pnpm test:coverage`: مجموعه unit را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک gate پوشش برای lane واحد پیش‌فرض است، نه پوشش کل فایل‌های سراسر مخزن. آستانه‌ها 70٪ برای خط‌ها/تابع‌ها/دستورها و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است و lane پیش‌فرض محدوده include پوشش را به تست‌های unit غیرسریع با فایل‌های منبع sibling محدود می‌کند، این gate به‌جای هر import گذرایی که اتفاقا بارگذاری می‌شود، منبع تحت مالکیت همین lane را اندازه می‌گیرد.
- `pnpm test:coverage:changed`: پوشش unit را فقط برای فایل‌های تغییرکرده از زمان `origin/main` اجرا می‌کند.
- `pnpm test:changed`: اجرای ارزان و هوشمند تست‌های تغییرکرده. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های sibling `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرهای گسترده/config/package نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای گسترده و صریح تست‌های تغییرکرده. وقتی ویرایش test harness/config/package باید به رفتار گسترده‌تر changed-test در Vitest برگردد، از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: خارج از CI به‌طور پیش‌فرض به Crabbox/Testbox واگذار می‌کند، سپس gate بررسی هوشمند تغییرکرده را برای diff نسبت به `origin/main` داخل child راه‌دور اجرا می‌کند. برای laneهای معماری اثرپذیرفته typecheck، lint و فرمان‌های guard را اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- worktreeهای Codex و checkoutهای لینک‌شده/sparse: از اجرای مستقیم محلی `pnpm test*`، `pnpm check*`، و `pnpm crabbox:run` پرهیز کنید مگر اینکه مطمئن شده باشید pnpm وابستگی‌ها را reconcile نمی‌کند. برای اثبات کوچک و صریحِ یک فایل از `node scripts/run-vitest.mjs <path-or-filter>` استفاده کنید؛ برای gateهای تغییرکرده یا اثبات گسترده از `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` استفاده کنید تا pnpm داخل Testbox اجرا شود.
- اثبات Testbox-through-Crabbox: `exitCode` نهایی wrapper و JSON زمان‌بندی را نتیجه فرمان در نظر بگیرید. اجرای واگذارشده Blacksmith GitHub Actions ممکن است پس از یک فرمان SSH موفق، `cancelled` نشان دهد، چون Testbox از بیرون action نگه‌دارنده متوقف می‌شود؛ پیش از اینکه آن را شکست تست حساب کنید، خلاصه wrapper و خروجی فرمان را بررسی کنید.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: سری‌سازی heavy-check را برای فرمان‌هایی مثل `pnpm check:changed` و `pnpm test ...` هدفمند، به‌جای Git common dir، داخل worktree فعلی نگه می‌دارد. فقط روی میزبان‌های محلی با ظرفیت بالا و وقتی عمدا بررسی‌های مستقل را در چند worktree لینک‌شده اجرا می‌کنید، از آن استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از مسیر laneهای محدوده‌دار Vitest عبور می‌دهد. اجراهای بدون هدف، اثبات full-suite هستند: از گروه‌های shard ثابت استفاده می‌کنند، برای اجرای موازی محلی به configهای leaf گسترش می‌یابند، و پیش از شروع fanout مورد انتظار shardهای محلی را چاپ می‌کنند. گروه extension همیشه به‌جای یک فرایند بزرگ root-project، به configهای shard به‌ازای هر extension گسترش می‌یابد.
- اجراهای test wrapper با یک خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابند. خط مدت‌زمان خود Vitest همچنان جزئیات به‌ازای هر shard می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا auth-profile store ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` در Vitest استفاده کنید.
- `pnpm test:env-mutations:report`: گزارش غیرمسدودکننده از تست‌ها و harnessهایی که `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_WORKSPACE_DIR`، یا کلیدهای env مرتبط OpenClaw را مستقیما تغییر می‌دهند. از آن برای یافتن نامزدهای مهاجرت به helper مشترک test-state استفاده کنید.
- E2E mocked برای Control UI: از `pnpm test:ui:e2e` برای lane Vitest + Playwright استفاده کنید که Vite Control UI را شروع می‌کند و یک صفحه واقعی Chromium را در برابر Gateway WebSocket mocked هدایت می‌کند. تست‌ها در `ui/src/**/*.e2e.test.ts` قرار دارند؛ mockها و کنترل‌های مشترک در `ui/src/test-helpers/control-ui-e2e.ts` هستند. `pnpm test:e2e` این lane را شامل می‌شود. در worktreeهای Codex، برای اثبات کوچک و هدفمند پس از نصب وابستگی‌ها، `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` را ترجیح دهید، یا برای اثبات گسترده‌تر GUI از Testbox/Crabbox استفاده کنید.
- helperهای Process E2E: وقتی یک تست E2E در سطح فرایند Vitest به Gateway در حال اجرا، env مربوط به CLI، capture لاگ، و cleanup در یک جا نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- تست‌های TUI PTY: برای lane سریع PTY با fake-backend از `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` استفاده کنید. برای smoke کندتر `tui --local`، که فقط endpoint مدل خارجی را mock می‌کند، از `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` یا `pnpm tui:pty:test:watch --mode local` استفاده کنید. متن مرئی پایدار یا فراخوانی‌های fixture را assert کنید، نه snapshotهای خام ANSI.
- helperهای Docker/Bash E2E: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های multi-home می‌توانند `docker_e2e_test_state_function_b64` را بدهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. callerهای سطح پایین‌تر می‌توانند برای snippet شل داخل container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` استفاده کنند، یا برای یک فایل env میزبان قابل source شدن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` پیش از `create` مانع می‌شود runtimeهای جدیدتر Node، مقدار `--env-file` را flag مربوط به Node در نظر بگیرند. laneهای Docker/Bash که Gateway راه‌اندازی می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای resolve کردن entrypoint، startup mock مربوط به OpenAI، اجرای foreground/background برای Gateway، readiness probeها، export کردن env وضعیت، dump لاگ‌ها، و cleanup فرایند source کنند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی shardهای فیلترشده را بدون جایگزین کردن داده زمان‌بندی whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و caseهای runtime-heavy را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست sibling پیش از بازگشت به globهای گسترده‌تر دایرکتوری، به همان sibling نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کنند تا به‌جای اجرای گسترده هر shard وقتی مسیر وابستگی دقیق است، تست‌های importکننده را اجرا کنند.
- `auto-reply` اکنون به سه config اختصاصی (`core`، `top-level`، `reply`) نیز تقسیم می‌شود تا harness مربوط به reply بر تست‌های سبک‌تر top-level status/token/helper غالب نشود.
- config پایه Vitest اکنون به‌طور پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک non-isolated در سراسر configهای مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/Plugin را اجرا می‌کنند. Pluginهای channel سنگین، Plugin مرورگر، و OpenAI به‌صورت shardهای اختصاصی اجرا می‌شوند؛ گروه‌های Plugin دیگر همچنان batched می‌مانند. برای lane یک Plugin bundled، از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش import-duration + import-breakdown مربوط به Vitest را فعال می‌کند، درحالی‌که همچنان برای هدف‌های صریح فایل/دایرکتوری از routing محدوده‌دار lane استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import، اما فقط برای فایل‌های تغییرکرده از زمان `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed changed-mode را در برابر اجرای native root-project برای همان diff commit‌شده git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییر فعلی worktree را بدون commit کردن اولیه benchmark می‌کند.
- `pnpm test:perf:profile:main`: برای thread اصلی Vitest یک profile مربوط به CPU می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: برای unit runner، profileهای CPU + heap می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر config leaf مربوط به full-suite Vitest را به‌صورت سری اجرا می‌کند و داده مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log به‌ازای هر config می‌نویسد. Test Performance Agent پیش از تلاش برای اصلاح تست‌های کند، از این به‌عنوان baseline خود استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر کارایی مقایسه می‌کند.
- `pnpm test:docker:timings <summary.json>` پس از یک اجرای Docker all، laneهای کند Docker را بررسی می‌کند؛ برای چاپ فرمان‌های cheap targeted rerun از همان artifactها، از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- یکپارچه‌سازی Gateway: opt-in از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: aggregate E2E مخزن را اجرا می‌کند: تست‌های smoke end-to-end مربوط به gateway به‌علاوه lane E2E مرورگر mocked مربوط به Control UI.
- `pnpm test:e2e:gateway`: تست‌های smoke end-to-end مربوط به gateway را اجرا می‌کند (جفت‌سازی multi-instance WS/HTTP/node). با workerهای تطبیقی در `vitest.e2e.config.ts` به‌طور پیش‌فرض از `threads` + `isolate: false` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای لاگ‌های verbose، `OPENCLAW_E2E_VERBOSE=1` را set کنید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مختص provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر مشترک آزمون زنده را می‌سازد، OpenClaw را یک‌بار به‌صورت tarball مربوط به npm بسته‌بندی می‌کند، یک تصویر runner خام Node/Git به‌همراه یک تصویر عملکردی که آن tarball را در `/app` نصب می‌کند می‌سازد/بازاستفاده می‌کند، سپس مسیرهای اسموک Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک زمان‌بند وزن‌دار اجرا می‌کند. تصویر خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای مسیرهای نصب‌کننده/به‌روزرسانی/وابستگی Plugin استفاده می‌شود؛ این مسیرها به‌جای استفاده از سورس‌های کپی‌شده مخزن، tarball ازپیش‌ساخته‌شده را mount می‌کنند. تصویر عملکردی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای مسیرهای معمول عملکرد برنامه ساخته‌شده استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها بسته‌بند پکیج محلی/CI است و پیش از مصرف شدن توسط Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` برنامه CI تحت مالکیت زمان‌بند را برای مسیرهای انتخاب‌شده، گونه‌های تصویر، نیازهای package/live-image، سناریوهای وضعیت، و بررسی‌های credential بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` اسلات‌های پردازشی را کنترل می‌کند و مقدار پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` مجموعه tail حساس به provider را کنترل می‌کند و مقدار پیش‌فرض آن 10 است. سقف‌های مسیر سنگین به‌طور پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ سقف‌های provider به‌طور پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` روی یک مسیر سنگین برای هر provider تنظیم می‌شوند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک مسیر روی میزبان با هم‌روندی پایین از سقف وزن یا منبع مؤثر عبور کند، همچنان می‌تواند از یک مجموعه خالی شروع شود و تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا خواهد شد. شروع مسیرها به‌طور پیش‌فرض با فاصله 2 ثانیه‌ای انجام می‌شود تا از هجوم ایجاد در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌طور پیش‌فرض Docker را preflight می‌کند، کانتینرهای کهنه E2E مربوط به OpenClaw را پاک می‌کند، هر 30 ثانیه وضعیت مسیرهای فعال را منتشر می‌کند، کش‌های ابزار CLI مربوط به provider را بین مسیرهای سازگار به‌اشتراک می‌گذارد، خرابی‌های گذرای provider زنده را به‌طور پیش‌فرض یک‌بار دوباره تلاش می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی مسیرها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی ترتیب طولانی‌ترین-اول به‌کار رود. برای چاپ manifest مسیر بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن بازاستفاده از زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط مسیرهای قطعی/محلی از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط مسیرهای provider زنده از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت فقط-زنده، مسیرهای زنده main و tail را در یک مجموعه طولانی‌ترین-اول ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را با هم بسته‌بندی کنند. runner پس از نخستین خرابی، زمان‌بندی مسیرهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر مسیر یک timeout پشتیبان 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ مسیرهای زنده/tail انتخاب‌شده از سقف‌های سخت‌گیرانه‌تر مخصوص هر مسیر استفاده می‌کنند. دستورهای راه‌اندازی Docker برای backend CLI، timeout مخصوص خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). لاگ‌های هر مسیر، `summary.json`، `failures.json`، و زمان‌بندی فازها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی مسیرهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ دستورهای rerun هدفمند و ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک کانتینر E2E مبتنی بر سورس و پشتیبانی‌شده با Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickables ارتقایافته توسط cursor، ارجاع‌های iframe، و metadata فریم باشند.
- `pnpm test:docker:skill-install`: tarball بسته‌بندی‌شده OpenClaw را در یک runner خام Docker نصب می‌کند، `skills.install.allowUploadedArchives` را غیرفعال می‌کند، یک slug فعلی skill را از جست‌وجوی زنده ClawHub resolve می‌کند، آن را از طریق `openclaw skills install` نصب می‌کند، و `SKILL.md`، `.clawhub/origin.json`، `.clawhub/lock.json`، و `skills info --json` را بررسی می‌کند.
- probeهای زنده Docker برای backend CLI را می‌توان به‌صورت مسیرهای متمرکز اجرا کرد، برای نمونه `pnpm test:docker:live-cli-backend:claude`، `pnpm test:docker:live-cli-backend:claude:resume`، یا `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini نیز aliasهای متناظر `:resume` و `:mcp` دارد.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI کانتینری‌شده را شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک چت واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل زنده قابل‌استفاده نیاز دارد، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند suiteهای معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک کانتینر Gateway seedشده و یک کانتینر client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه routed، خواندن transcript، metadata پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و اعلان‌های channel + permission به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion اعلان Claude فریم‌های MCP خام stdio را مستقیم می‌خواند تا smoke بازتاب دهد bridge واقعاً چه چیزی منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شده OpenClaw را روی fixture کثیف کاربر قدیمی نصب می‌کند، به‌روزرسانی package به‌همراه doctor غیرتعاملی را بدون کلیدهای provider یا channel زنده اجرا می‌کند، سپس یک Gateway از نوع loopback را شروع می‌کند و بررسی می‌کند که agentها، پیکربندی channel، allowlistهای Plugin، فایل‌های workspace/session، وضعیت کهنه وابستگی Plugin قدیمی، startup، و وضعیت RPC دوام بیاورند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را بدون کلیدهای provider یا channel زنده seed می‌کند، آن baseline را با یک recipe آماده دستور `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شده OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway از نوع loopback را شروع می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنه Plugin و وضعیت وابستگی قدیمی، startup، `/healthz`، `/readyz`، و وضعیت RPC دوام بیاورند یا تمیز repair شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، یک ماتریس محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعه reported-issues شامل `configured-plugin-installs` است تا بررسی کند Pluginهای خارجی پیکربندی‌شده OpenClaw هنگام upgrade به‌طور خودکار نصب می‌شوند، و شامل `stale-source-plugin-shadow` است تا سایه‌های Plugin فقط-سورس باعث شکستن startup نشوند. Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند، و tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را پیش از تحویل دادن مشخصات دقیق package به مسیرهای Docker resolve می‌کند.
- `pnpm test:docker:update-migration`: harness مربوط به published-upgrade survivor را در سناریوی cleanup-heavy به نام `plugin-deps-cleanup` اجرا می‌کند و به‌طور پیش‌فرض از `openclaw@2026.4.23` شروع می‌کند. workflow جداگانه `Update Migration` این مسیر را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر package پایدار منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از CI انتشار کامل اثبات کند.
- `pnpm test:docker:plugins`: اسموک نصب/به‌روزرسانی را برای مسیر محلی، `file:`، packageهای registry مربوط به npm با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude اجرا می‌کند.

## کنترل محلی PR

برای بررسی‌های محلی فرود/کنترل PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار ناپایدار شد، پیش از اینکه آن را رگرسیون در نظر بگیرید یک‌بار دوباره اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌هایی با محدودیت حافظه، از این‌ها استفاده کنید:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- محیط اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. نشانه‌گذاری یا متن اضافی نیاور.»

آخرین اجرا (2025-12-31، 20 اجرا):

- minimax میانه 1279ms (کمینه 1114، بیشینه 2431)
- opus میانه 2454ms (کمینه 1224، بیشینه 3170)

## بنچ راه‌اندازی CLI

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

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر دستور است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` fixture خط مبنای ثبت‌شده در مخزن را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

fixture ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با fixture مقایسه کنید

## بنچ راه‌اندازی Gateway

اسکریپت: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

بنچمارک به‌صورت پیش‌فرض از ورودی CLI ساخته‌شده در `dist/entry.js` استفاده می‌کند؛ پیش از استفاده از دستورهای package-script، `pnpm build` را اجرا کنید. برای اندازه‌گیری runner منبع به‌جای آن، `--entry scripts/run-node.mjs` را پاس بدهید و آن نتایج را از خط مبناهای ورودی ساخته‌شده جدا نگه دارید.

نحوه استفاده:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

شناسه‌های case:

- `default`: راه‌اندازی عادی Gateway.
- `skipChannels`: راه‌اندازی Gateway با رد شدن راه‌اندازی کانال.
- `oneInternalHook`: یک hook داخلی پیکربندی‌شده.
- `allInternalHooks`: همه hookهای داخلی.
- `fiftyPlugins`: 50 Plugin مبتنی بر manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin مبتنی بر manifest با راه‌اندازی lazy.

خروجی شامل نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان لاگ گوش‌دادن HTTP، زمان لاگ آماده بودن Gateway، زمان CPU، نسبت هسته CPU، بیشینه RSS، heap، سنجه‌های trace راه‌اندازی، تأخیر event-loop، و سنجه‌های جزئیات جدول lookup Plugin است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را در محیط Gateway فرزند فعال می‌کند.

`/healthz` را به‌عنوان زنده‌بودن بخوانید: سرور HTTP می‌تواند پاسخ بدهد. `/readyz` را به‌عنوان آمادگی قابل استفاده بخوانید: sidecarهای Plugin راه‌اندازی، کانال‌ها، و کارهای post-attach حیاتی برای آمادگی پایدار شده‌اند. hookهای راه‌اندازی Gateway به‌صورت ناهمگام dispatch می‌شوند و بخشی از تضمین آمادگی نیستند. زمان لاگ آماده بودن، timestamp داخلی لاگ آماده بودن Gateway است؛ برای انتساب سمت فرایند مفید است اما جایگزین probe خارجی `/readyz` نیست.

هنگام مقایسه تغییرات از خروجی JSON یا `--output` استفاده کنید. فقط وقتی از `--cpu-prof-dir` استفاده کنید که خروجی trace به import، compile، یا کار محدود به CPU اشاره کند که تنها با زمان‌بندی فازها توضیح‌پذیر نیست. نتایج source-runner را با نتایج `dist/entry.js` ساخته‌شده به‌عنوان خط مبنای یکسان مقایسه نکنید.

## بنچ راه‌اندازی مجدد Gateway

اسکریپت: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

بنچمارک راه‌اندازی مجدد فقط روی macOS و Linux پشتیبانی می‌شود. برای راه‌اندازی‌های مجدد درون‌فرایندی از SIGUSR1 استفاده می‌کند و روی Windows بلافاصله شکست می‌خورد.

بنچمارک به‌صورت پیش‌فرض از ورودی CLI ساخته‌شده در `dist/entry.js` استفاده می‌کند؛ پیش از استفاده از دستورهای package-script، `pnpm build` را اجرا کنید. برای اندازه‌گیری runner منبع به‌جای آن، `--entry scripts/run-node.mjs` را پاس بدهید و آن نتایج را از خط مبناهای ورودی ساخته‌شده جدا نگه دارید.

نحوه استفاده:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

شناسه‌های case:

- `skipChannels`: راه‌اندازی مجدد با کانال‌های ردشده.
- `skipChannelsAcpxProbe`: راه‌اندازی مجدد با کانال‌های ردشده و probe راه‌اندازی ACPX روشن.
- `skipChannelsNoAcpxProbe`: راه‌اندازی مجدد با کانال‌های ردشده و probe راه‌اندازی ACPX خاموش.
- `default`: راه‌اندازی مجدد عادی.
- `fiftyPlugins`: راه‌اندازی مجدد با 50 Plugin مبتنی بر manifest.

خروجی شامل `/healthz` بعدی، `/readyz` بعدی، زمان ازکارافتادگی، زمان‌بندی آماده شدن پس از راه‌اندازی مجدد، CPU، RSS، سنجه‌های trace راه‌اندازی برای فرایند جایگزین، و سنجه‌های trace راه‌اندازی مجدد برای مدیریت سیگنال، تخلیه active-work، فازهای بستن، شروع بعدی، زمان‌بندی آمادگی، و snapshotهای حافظه است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` و `OPENCLAW_GATEWAY_RESTART_TRACE=1` را در محیط Gateway فرزند فعال می‌کند.

وقتی تغییری راه‌دهی سیگنال راه‌اندازی مجدد، close handlerها، startup-after-restart، خاموش‌کردن sidecar، handoff سرویس، یا آمادگی پس از راه‌اندازی مجدد را لمس می‌کند، از این بنچمارک استفاده کنید. هنگام ایزوله کردن مکانیک Gateway از راه‌اندازی کانال، با `skipChannels` شروع کنید. فقط پس از اینکه case محدود مسیر راه‌اندازی مجدد را توضیح داد، از `default` یا caseهای سنگین از نظر Plugin استفاده کنید.

سنجه‌های trace سرنخ‌های انتساب هستند، نه verdict. یک تغییر راه‌اندازی مجدد باید بر اساس چندین نمونه، span مالک متناظر، رفتار `/healthz` و `/readyz`، و قرارداد راه‌اندازی مجدد قابل مشاهده برای کاربر قضاوت شود.

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای آزمون‌های smoke راه‌اندازی اولیه کانتینری لازم است.

جریان cold-start کامل در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت wizard تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## Smoke وارد کردن QR (Docker)

اطمینان می‌دهد helper نگهداری‌شده runtime QR زیر runtimeهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمون‌گیری](/fa/help/testing)
- [آزمون‌گیری live](/fa/help/testing-live)
- [آزمون‌گیری به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
