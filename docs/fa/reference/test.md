---
read_when:
    - اجرای تست‌ها یا رفع اشکال آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-01T11:53:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با یک نمونه در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال باقی گذاشته است از این استفاده کنید.
- `pnpm test:coverage`: مجموعه unit را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش unit برای فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70% برای خطوط/توابع/عبارات و 55% برای شاخه‌ها هستند. چون `coverage.all` برابر false است، این گیت به‌جای اینکه هر فایل منبع split-lane را پوشش‌نداده در نظر بگیرد، فایل‌هایی را اندازه‌گیری می‌کند که توسط مجموعه پوشش unit بارگذاری شده‌اند.
- `pnpm test:coverage:changed`: پوشش unit را فقط برای فایل‌هایی اجرا می‌کند که از `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان تست changed هوشمند. این دستور هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های sibling `*.test.ts`، نگاشت‌های صریح source، و گراف import محلی اجرا می‌کند. تغییرات گسترده/config/package نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده changed test. وقتی یک ویرایش test harness/config/package باید به رفتار گسترده‌تر changed-test در Vitest برگردد از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت smart changed check را برای diff نسبت به `origin/main` اجرا می‌کند. typecheck، lint، و دستورهای guard را برای laneهای معماری متاثر اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح file/directory را از طریق laneهای scoped Vitest مسیریابی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به configهای leaf گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند بزرگ root-project، به configهای shard هر extension گسترش می‌یابد.
- اجرای wrapper تست با یک خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد. خط duration خود Vitest همان جزئیات هر shard باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست در Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا فروشگاه auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- کمک‌کننده‌های Process E2E: وقتی یک تست E2E در سطح فرایند Vitest به Gateway در حال اجرا، env برای CLI، ضبط log، و cleanup در یک مکان نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- کمک‌کننده‌های Docker/Bash E2E: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس دهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های multi-home می‌توانند `docker_e2e_test_state_function_b64` را پاس دهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک snippet پوسته داخل container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` استفاده کنند، یا برای یک فایل env میزبان قابل source کردن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، گزینه `--env-file` را به‌عنوان flag مربوط به Node در نظر بگیرند. laneهای Docker/Bash که یک Gateway را راه‌اندازی می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای resolve کردن entrypoint، راه‌اندازی mock OpenAI، اجرای foreground/background برای Gateway، readiness probeها، export کردن state env، dumpهای log، و cleanup فرایند source کنند.
- اجراهای shard کامل، extension، و include-pattern داده‌های timing محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای whole-config بعدی از این timingها برای متعادل کردن shardهای کند و سریع استفاده می‌کنند. shardهای include-pattern در CI نام shard را به کلید timing اضافه می‌کنند، که timingهای shard فیلترشده را بدون جایگزین کردن داده timing whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact timing محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند، و caseهای runtime-heavy را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های source دارای تست sibling پیش از fallback به globهای گسترده‌تر directory، به همان sibling نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کنند تا تست‌های importer را اجرا کنند، به‌جای اینکه وقتی مسیر dependency دقیق است هر shard را به‌صورت گسترده اجرا کنند.
- `auto-reply` اکنون همچنین به سه config اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا harness مربوط به reply بر تست‌های سبک‌تر status/token/helper در سطح بالا غالب نشود.
- config پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک non-isolated در سراسر configهای مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/plugin را اجرا می‌کنند. pluginهای سنگین channel، plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر plugin به‌صورت batched باقی می‌مانند. برای یک lane مربوط به یک plugin bundled از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌گیری import-duration و import-breakdown در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح file/directory از مسیریابی scoped lane استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling import، اما فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed changed-mode را در برابر اجرای native root-project برای همان git diff کامیت‌شده benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون نیاز به commit کردن از قبل benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: پروفایل‌های CPU و heap را برای runner مربوط به unit می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر config leaf مربوط به full-suite Vitest را به‌صورت serial اجرا می‌کند و داده‌های duration گروه‌بندی‌شده به‌همراه artifactهای JSON/log برای هر config را می‌نویسد. Test Performance Agent پیش از تلاش برای اصلاح تست‌های کند، از این به‌عنوان baseline استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر performance مقایسه می‌کند.
- یکپارچه‌سازی Gateway: به‌صورت opt-in از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: تست‌های smoke end-to-end مربوط به gateway را اجرا می‌کند (جفت‌سازی multi-instance WS/HTTP/node). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای adaptive در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose مقدار `OPENCLAW_E2E_VERBOSE=1` را قرار دهید.
- `pnpm test:live`: تست‌های live مربوط به provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: image مشترک live-test را build می‌کند، OpenClaw را یک‌بار به‌صورت tarball npm pack می‌کند، یک image runner پایه Node/Git به‌همراه یک image functional را build/بازاستفاده می‌کند که آن tarball را در `/app` نصب می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. image پایه (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به‌جای استفاده از sourceهای کپی‌شده repo، tarball از پیش buildشده را mount می‌کنند. image functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای معمول عملکرد built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer package برای local/CI است و پیش از مصرف توسط Docker، tarball به‌همراه `dist/postinstall-inventory.json` را validate می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` plan متعلق به scheduler برای CI را درباره laneهای انتخاب‌شده، نوع imageها، نیازهای package/live-image، سناریوهای state، و بررسی‌های credential بدون build کردن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool پایانی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. سقف laneهای سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است؛ سقف providerها به‌صورت پیش‌فرض با `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` برابر یک lane سنگین برای هر provider است. برای hostهای بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی host با parallelism پایین از سقف موثر weight یا resource فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض با فاصله 2 ثانیه stagger می‌شود تا از create storm در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، containerهای کهنه OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت active-lane را منتشر می‌کند، cacheهای ابزار CLI مربوط به provider را بین laneهای سازگار share می‌کند، failureهای transient مربوط به live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و timingهای lane را برای ترتیب longest-first در اجراهای بعدی در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، برای تنظیم خروجی status از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` استفاده کنید، یا برای غیرفعال کردن reuse کردن timing، `OPENCLAW_DOCKER_ALL_TIMINGS=0` را قرار دهید. برای laneهای deterministic/local فقط از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` استفاده کنید یا برای laneهای live-provider فقط از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only، laneهای live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را کنار هم pack کنند. runner پس از اولین failure، زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک timeout fallback برابر 120 دقیقه دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ laneهای live/tail منتخب از سقف‌های دقیق‌تر مخصوص هر lane استفاده می‌کنند. دستورهای راه‌اندازی Docker برای backend CLI timeout خودشان را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و timingهای phase زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` استفاده کنید و برای چاپ دستورهای targeted rerun ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container منبع E2E مبتنی بر Chromium را build می‌کند، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای role در CDP شامل URLهای لینک، clickables ارتقایافته با cursor، refهای iframe، و metadata مربوط به frame هستند.
- probeهای live Docker برای backend CLI را می‌توان به‌صورت laneهای متمرکز اجرا کرد، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را به‌صورت Dockerized شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید live model قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک image خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند suiteهای معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container Gateway seedشده و یک container client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس discovery مکالمه routed، خواندن transcript، metadata پیوست، رفتار live event queue، مسیریابی outbound send، و notificationهای channel + permission به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion مربوط به notification در Claude فریم‌های خام stdio MCP را مستقیما می‌خواند تا smoke منعکس کند bridge واقعا چه چیزی منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شده‌ی OpenClaw را روی یک fixture کثیفِ کاربر قدیمی نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای زنده‌ی provider یا کانال اجرا می‌کند، سپس یک Gateway حلقه‌بازگشت را شروع می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، فایل‌های فضای کاری/نشست، وضعیت کهنه‌ی runtime-deps مربوط به Plugin، راه‌اندازی و وضعیت RPC حفظ شوند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه‌ی کاربر موجود را بدون کلیدهای زنده‌ی provider یا کانال مقداردهی اولیه می‌کند، آن مبنا را با یک دستور آماده‌ی `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شده‌ی OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشت را شروع می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های فضای کاری/نشست، وضعیت کهنه‌ی پیکربندی/runtime-deps مربوط به Plugin، راه‌اندازی، `/healthz`، `/readyz` و وضعیت RPC حفظ شوند یا تمیز ترمیم شوند. یک مبنا را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، یک ماتریس دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ پذیرش بسته این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` در دسترس قرار می‌دهد.

## گیت محلی PR

برای بررسی‌های محلی لند/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پرترافیک ناپایدار شد، پیش از اینکه آن را رگرسیون در نظر بگیرید یک بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌هایی با محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچمارک تاخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی.»

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

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را در `.artifacts/cli-startup-bench-all.json` با استفاده از `runs=5` و `warmup=1` می‌نویسد
- `pnpm test:startup:bench:update` fixture مبنای ثبت‌شده در repo را در `test/fixtures/cli-startup-bench.json` با استفاده از `runs=5` و `warmup=1` تازه‌سازی می‌کند

fixture ثبت‌شده در repo:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با fixture مقایسه کنید

## E2E آنبوردینگ (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke آنبوردینگ کانتینری لازم است.

جریان کامل شروع سرد در یک کانتینر Linux پاک:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت ویزارد تعاملی را از طریق یک شبه-tty هدایت می‌کند، فایل‌های config/workspace/session را راستی‌آزمایی می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## smoke واردسازی QR (Docker)

اطمینان می‌دهد helper نگه‌داری‌شده runtime برای QR زیر runtimeهای پشتیبانی‌شده Docker Node بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست live](/fa/help/testing-live)
