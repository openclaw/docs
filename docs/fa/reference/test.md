---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوه اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-05T06:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند باقی‌مانده‌ی Gateway را که پورت کنترل پیش‌فرض را در اختیار دارد می‌کشد، سپس مجموعه‌ی کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با نمونه‌ی در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال‌شده باقی گذاشته است، از این استفاده کنید.
- `pnpm test:coverage`: مجموعه‌ی واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش واحد برای فایل‌های بارگذاری‌شده است، نه پوشش همه‌ی فایل‌های کل مخزن. آستانه‌ها 70٪ برای خطوط/توابع/دستورها و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است، این گیت فایل‌های بارگذاری‌شده توسط مجموعه‌ی پوشش واحد را اندازه‌گیری می‌کند، نه اینکه هر فایل منبع lane تفکیک‌شده را پوشش‌نیافته تلقی کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از `origin/main` به بعد تغییر کرده‌اند.
- `pnpm test:changed`: اجرای تست تغییرات هوشمند و ارزان. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته رد می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح تست تغییرات گسترده. وقتی ویرایش harness/پیکربندی/بسته‌ی تست باید به رفتار گسترده‌تر changed-test در Vitest برگردد، از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت بررسی تغییرات هوشمند را برای diff نسبت به `origin/main` اجرا می‌کند. typecheck، lint و فرمان‌های guard را برای laneهای معماری تحت تأثیر اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از طریق laneهای scoped Vitest مسیر‌دهی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های leaf گسترش می‌یابند؛ گروه extension همیشه به جای یک فرایند بزرگ root-project، به پیکربندی‌های shard به‌ازای هر extension گسترش می‌یابد.
- اجرای wrapper تست با خلاصه‌ی کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد. خط مدت‌زمان خود Vitest به‌عنوان جزئیات به‌ازای هر shard باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست در Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا مخزن auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- helperهای E2E فرایند: وقتی یک تست E2E در سطح فرایند Vitest به Gateway در حال اجرا، محیط CLI، ضبط log، و پاک‌سازی در یک محل نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- helperهای E2E Docker/Bash: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های multi-home می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` برای snippet پوسته‌ی داخل container استفاده کنند، یا از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` برای یک فایل env میزبان قابل source شدن. `--` پیش از `create` مانع می‌شود runtimeهای جدیدتر Node با `--env-file` مثل یک flag Node رفتار کنند. laneهای Docker/Bash که Gateway را اجرا می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای تشخیص entrypoint، راه‌اندازی mock OpenAI، اجرای foreground/background Gateway، probeهای آمادگی، export محیط وضعیت، dumpهای log، و پاک‌سازی فرایند source کنند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی shardهای فیلترشده را بدون جایگزین کردن داده‌های زمان‌بندی whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و caseهای سنگین runtime را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست‌های خواهر، پیش از برگشت به globهای دایرکتوری گسترده‌تر، به همان تست خواهر نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کنند تا به جای اجرای گسترده‌ی هر shard وقتی مسیر وابستگی دقیق است، تست‌های importکننده را اجرا کنند.
- `auto-reply` اکنون همچنین به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا harness پاسخ بر تست‌های سبک‌تر وضعیت/token/helper در سطح بالا غالب نشود.
- پیکربندی پایه‌ی Vitest اکنون به‌طور پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک non-isolated در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه‌ی shardهای extension/Plugin را اجرا می‌کنند. Pluginهای سنگین channel، Plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت batched باقی می‌مانند. برای یک lane Plugin باندل‌شده از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌گیری مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیر‌دهی lane scoped استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling import، اما فقط برای فایل‌هایی که از `origin/main` به بعد تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر changed-mode مسیر‌دهی‌شده را در برابر اجرای بومی root-project برای همان git diff commitشده benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه‌ی تغییرات worktree فعلی را بدون نیاز به commit کردن قبلی benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: CPU profile و heap profile برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی leaf مجموعه‌ی کامل Vitest را به‌صورت سریالی اجرا می‌کند و داده‌ی مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log به‌ازای هر پیکربندی را می‌نویسد. Test Performance Agent پیش از تلاش برای رفع تست‌های کند، از این به‌عنوان baseline استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر عملکرد مقایسه می‌کند.
- یکپارچه‌سازی Gateway: با `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: تست‌های smoke سرتاسری Gateway را اجرا می‌کند (جفت‌سازی multi-instance WS/HTTP/node). به‌طور پیش‌فرض از `threads` + `isolate: false` با workerهای تطبیقی در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose، `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` ویژه‌ی provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر مشترک live-test را build می‌کند، OpenClaw را یک‌بار به‌عنوان npm tarball pack می‌کند، تصویر runner بدون وابستگی Node/Git و یک تصویر functional را build/بازاستفاده می‌کند که آن tarball را در `/app` نصب می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. تصویر bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به جای استفاده از منابع کپی‌شده‌ی مخزن، tarball از پیش buildشده را mount می‌کنند. تصویر functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای معمول قابلیت‌های built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer بسته‌ی محلی/CI است و پیش از مصرف Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه‌ی انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` برنامه‌ی CI تحت مالکیت scheduler را برای laneهای انتخاب‌شده، گونه‌های image، نیازهای package/live-image، scenarioهای وضعیت، و بررسی‌های credential بدون build کردن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. سقف‌های lane سنگین به‌طور پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ سقف‌های provider به‌طور پیش‌فرض با `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` یک lane سنگین به‌ازای هر provider هستند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی میزبان با موازی‌سازی پایین از سقف وزن یا منبع مؤثر فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا آزاد کردن ظرفیت، تنها اجرا خواهد شد. شروع laneها به‌طور پیش‌فرض با 2 ثانیه فاصله انجام می‌شود تا از توفان create در Docker daemon محلی جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌طور پیش‌فرض Docker را preflight می‌کند، containerهای کهنه‌ی E2E OpenClaw را پاک می‌کند، هر 30 ثانیه وضعیت laneهای فعال را منتشر می‌کند، cacheهای ابزار CLI provider را بین laneهای سازگار به اشتراک می‌گذارد، failureهای گذرای live-provider را به‌طور پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی laneها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی longest-first ordering انجام شود. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن بازاستفاده از زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای laneهای فقط deterministic/local از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` استفاده کنید یا برای فقط laneهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only، laneهای live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کار Claude، Codex، و Gemini را با هم pack کنند. runner پس از اولین failure، برنامه‌ریزی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تر به‌ازای هر lane دارند. فرمان‌های راه‌اندازی Docker برای backendهای CLI، timeout مخصوص خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای به‌ازای هر lane، `summary.json`، `failures.json`، و زمان‌بندی phaseها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container E2E منبع پشتیبانی‌شده با Chromium را build می‌کند، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickableهای ارتقایافته با cursor، ارجاع‌های iframe، و metadata فریم باشند.
- probeهای live Docker برای backendهای CLI را می‌توان به‌عنوان laneهای متمرکز اجرا کرد، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini هم aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI dockerized را شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک چت واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید live model قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های عادی unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container Gateway seeded و یک container client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه‌ی routeشده، خواندن transcript، metadata پیوست، رفتار صف رویداد live، route کردن ارسال outbound، و اعلان‌های channel + permission به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion اعلان Claude فریم‌های خام stdio MCP را مستقیم می‌خواند تا smoke بازتاب‌دهنده‌ی چیزی باشد که bridge واقعاً منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شدهٔ OpenClaw را روی یک fixture کاربر قدیمیِ تغییرکرده نصب می‌کند، به‌روزرسانی بسته را به‌همراه doctor غیرتعاملی بدون کلیدهای provider یا channel زنده اجرا می‌کند، سپس یک Gateway از نوع loopback راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی channel، فهرست‌های مجاز Plugin، فایل‌های workspace/session، وضعیت stale وابستگی‌های Plugin legacy، راه‌اندازی، و وضعیت RPC پابرجا بمانند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را بدون کلیدهای provider یا channel زنده آماده می‌کند، آن baseline را با یک دستور پخته‌شدهٔ `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شدهٔ OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway از نوع loopback راه‌اندازی می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی stale مربوط به Plugin و وضعیت legacy وابستگی‌ها، راه‌اندازی، `/healthz`، `/readyz`، و وضعیت RPC پابرجا بمانند یا به‌طور تمیز repair شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، یک matrix محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعهٔ reported-issues شامل `configured-plugin-installs` است تا تأیید کند Pluginهای خارجی پیکربندی‌شدهٔ OpenClaw هنگام upgrade به‌طور خودکار نصب می‌شوند و شامل `stale-source-plugin-shadow` است تا shadowهای Plugin فقط-منبع، startup را خراب نکنند. Package Acceptance این موارد را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` در دسترس قرار می‌دهد، و tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را پیش از سپردن specهای دقیق package به laneهای Docker resolve می‌کند.
- `pnpm test:docker:update-migration`: harness published-upgrade survivor را در سناریوی پرپاک‌سازیِ `plugin-deps-cleanup` اجرا می‌کند، که به‌طور پیش‌فرض از `openclaw@2026.4.23` شروع می‌شود. workflow جداگانهٔ `Update Migration` این lane را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بستهٔ منتشرشدهٔ stable از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را بیرون از Full Release CI اثبات کند.
- `pnpm test:docker:plugins`: smoke نصب/به‌روزرسانی را برای path محلی، `file:`، بسته‌های npm registry با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و enable/inspect بستهٔ Claude اجرا می‌کند.

## گیت PR محلی

برای بررسی‌های محلی ادغام/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار ناپایدار شد، پیش از در نظر گرفتن آن به‌عنوان رگرسیون، یک‌بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های با محدودیت حافظه، از این‌ها استفاده کنید:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی.»

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

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` پروفایل‌های V8 را برای هر اجرا می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان هارنس استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت دود هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را در `.artifacts/cli-startup-bench-all.json` با `runs=5` و `warmup=1` می‌نویسد
- `pnpm test:startup:bench:update` فیکسچر خط مبنای ثبت‌شده در مخزن را در `test/fixtures/cli-startup-bench.json` با `runs=5` و `warmup=1` تازه‌سازی می‌کند

فیکسچر ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با فیکسچر مقایسه کنید

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای آزمون‌های دود راه‌اندازی اولیه کانتینری لازم است.

جریان کامل شروع سرد در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت ویزارد تعاملی را از طریق یک شبه-tty هدایت می‌کند، فایل‌های پیکربندی/فضای کاری/نشست را راستی‌آزمایی می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## دود واردسازی QR (Docker)

اطمینان می‌دهد که کمک‌کننده زمان‌اجرای QR نگهداری‌شده در زمان‌اجراهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمون](/fa/help/testing)
- [آزمون زنده](/fa/help/testing-live)
- [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
