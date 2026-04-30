---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس کل مجموعه Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با یک نمونه در حال اجرا تداخل پیدا نکنند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال کرده است از این استفاده کنید.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش واحدِ فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70% برای خطوط/تابع‌ها/دستورها و 55% برای شاخه‌ها هستند. چون `coverage.all` برابر false است، این گیت به‌جای اینکه هر فایل منبع split-lane را بدون پوشش در نظر بگیرد، فایل‌هایی را اندازه‌گیری می‌کند که توسط مجموعه پوشش واحد بارگذاری شده‌اند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان و هوشمند تست‌های تغییریافته. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرهای گسترده/پیکربندی/پکیج نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده تست‌های تغییریافته. وقتی ویرایش test harness/پیکربندی/پکیج باید به رفتار گسترده‌تر changed-test در Vitest برگردد، از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت بررسی هوشمند تغییرات را برای diff نسبت به `origin/main` اجرا می‌کند. typecheck، lint، و فرمان‌های guard را برای laneهای معماری تحت تأثیر اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از مسیر laneهای scoped Vitest عبور می‌دهد. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های leaf گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند عظیم root-project به پیکربندی‌های shard هر extension گسترش می‌یابد.
- اجرای wrapper تست با یک خلاصه کوتاه `[test] passed|failed|skipped ... in ...` تمام می‌شود. خط زمان خود Vitest به‌عنوان جزئیات هر shard باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست در Vitest به `HOME` ایزوله، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا auth-profile store نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- کمک‌کننده‌های Process E2E: وقتی یک تست E2E در سطح فرایند Vitest به یک Gateway در حال اجرا، env مربوط به CLI، ضبط log، و پاک‌سازی در یک مکان نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- کمک‌کننده‌های Docker/Bash E2E: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های multi-home می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک shell snippet داخل container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` استفاده کنند، یا برای یک فایل env میزبان قابل source از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` پیش از `create` مانع می‌شود runtimeهای جدیدتر Node، گزینه `--env-file` را به‌عنوان flag مربوط به Node تفسیر کنند. laneهای Docker/Bash که یک Gateway را راه‌اندازی می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای resolution نقطه ورود، راه‌اندازی mock OpenAI، اجرای foreground/background مربوط به Gateway، readiness probeها، export وضعیت env، dump کردن logها، و پاک‌سازی فرایند source کنند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای include-pattern در CI نام shard را به کلید زمان‌بندی اضافه می‌کنند، که باعث می‌شود زمان‌بندی‌های shard فیلترشده بدون جایگزین کردن داده‌های زمان‌بندی whole-config قابل مشاهده بمانند. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و caseهای runtime-heavy را روی laneهای موجود خود باقی می‌گذارند.
- فایل‌های منبع دارای تست خواهر پیش از fallback به globهای دایرکتوری گسترده‌تر، به آن تست خواهر نگاشت می‌شوند. ویرایش helperها زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کند تا به‌جای اجرای گسترده هر shard وقتی مسیر وابستگی دقیق است، تست‌های importکننده را اجرا کند.
- `auto-reply` اکنون همچنین به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا harness مربوط به reply بر تست‌های سبک‌تر status/token/helper در سطح بالا غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک non-isolated در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels` فایل `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/Plugin را اجرا می‌کنند. Pluginهای channel سنگین، Plugin مرورگر، و OpenAI به‌صورت shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت batched باقی می‌مانند. برای یک lane مربوط به Plugin bundled، از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌دهی مدت‌زمان import و breakdown مربوط به import را در Vitest فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از lane routing scoped استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import، اما فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed changed-mode را در برابر اجرای native root-project برای همان git diff کامیت‌شده benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرهای worktree فعلی را بدون نیاز به commit قبلی benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: CPU profile و heap profile را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی leaf مربوط به full-suite Vitest را به‌صورت serial اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده به‌علاوه artifactهای JSON/log هر پیکربندی را می‌نویسد. Test Performance Agent پیش از تلاش برای اصلاح تست‌های کند، از این به‌عنوان baseline خود استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر عملکرد مقایسه می‌کند.
- یکپارچه‌سازی Gateway: opt-in از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: smoke testهای end-to-end مربوط به Gateway را اجرا می‌کند (multi-instance WS/HTTP/node pairing). پیش‌فرض آن `threads` + `isolate: false` با workerهای adaptive در `vitest.e2e.config.ts` است؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose، `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: image مشترک live-test را می‌سازد، OpenClaw را یک‌بار به‌عنوان npm tarball بسته‌بندی می‌کند، یک image runner خام Node/Git به‌علاوه یک image عملکردی می‌سازد/بازاستفاده می‌کند که آن tarball را در `/app` نصب می‌کند، سپس laneهای smoke در Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. image خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به‌جای استفاده از sourceهای کپی‌شده مخزن، tarball از پیش ساخته‌شده را mount می‌کنند. image عملکردی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای عملکرد معمول built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer پکیج محلی/CI است و پیش از مصرف Docker، tarball به‌علاوه `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های lane مربوط به Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` بدون ساختن یا اجرای Docker، plan متعلق به scheduler در CI را برای laneهای انتخاب‌شده، نوع imageها، نیازهای package/live-image، سناریوهای وضعیت، و بررسی credentialها منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. سقف laneهای سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است؛ سقف providerها به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` برابر یک lane سنگین برای هر provider است. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی یک میزبان با parallelism پایین از سقف وزن یا منبع مؤثر فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا وقتی ظرفیت را آزاد کند تنها اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض 2 ثانیه با فاصله انجام می‌شود تا از create storm در Docker daemon محلی جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` override کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، containerهای stale مربوط به OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت active-lane را منتشر می‌کند، cacheهای ابزار CLI مربوط به provider را بین laneهای سازگار به اشتراک می‌گذارد، failureهای گذرای live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی laneها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی longest-first ordering انجام شود. برای چاپ manifest مربوط به lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن reuse زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای laneهای فقط deterministic/local از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای laneهای فقط live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only، laneهای live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را کنار هم بسته‌بندی کنند. runner پس از نخستین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ laneهای live/tail انتخاب‌شده از سقف‌های per-lane سخت‌گیرانه‌تری استفاده می‌کنند. فرمان‌های راه‌اندازی Docker مربوط به CLI backend timeout مخصوص خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و زمان‌بندی phaseها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند و ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container منبع E2E مبتنی بر Chromium می‌سازد، CDP خام به‌علاوه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickables ارتقایافته با cursor، refهای iframe، و metadata frame باشند.
- probeهای live Docker مربوط به CLI backend می‌توانند به‌عنوان laneهای متمرکز اجرا شوند، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را به‌صورت Dockerized شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک image خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های unit/e2e معمول در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container Gateway seedشده و یک container client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف conversation routeشده، خواندن transcript، metadata مربوط به attachment، رفتار queue رویداد live، routing ارسال outbound، و notificationهای channel + permission به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion مربوط به notification در Claude مستقیماً frameهای خام stdio MCP را می‌خواند تا smoke منعکس کند bridge واقعاً چه چیزی emit می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شدهٔ OpenClaw را روی یک فیکسچر کثیفِ کاربر قدیمی نصب می‌کند، به‌روزرسانی بسته به‌همراه `doctor` غیرتعاملی را بدون کلیدهای زندهٔ ارائه‌دهنده یا کانال اجرا می‌کند، سپس یک Gateway حلقهٔ بازگشت را راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، فایل‌های فضای کاری/نشست، وضعیت قدیمی وابستگی‌های زمان اجرای Plugin، راه‌اندازی و وضعیت RPC حفظ شده باشند.

## گیت محلی PR

برای بررسی‌های محلی فرود/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی میزبانی با بار زیاد ناپایدار شد، پیش از در نظر گرفتن آن به‌عنوان رگرسیون، یک بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` آن را ایزوله کنید. برای میزبان‌های با محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نقطه‌گذاری یا متن اضافه.»

آخرین اجرا (2025-12-31، 20 اجرا):

- میانه minimax برابر 1279ms (کمینه 1114، بیشینه 2431)
- میانه opus برابر 2454ms (کمینه 1224، بیشینه 3170)

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

- `startup`: `--version`، `--help`، `health`، `health --json`، `status --json`، `status`
- `real`: `health`، `status`، `status --json`، `sessions`، `sessions --json`، `tasks --json`، `tasks list --json`، `tasks audit --json`، `agents list --json`، `gateway status`، `gateway status --json`، `gateway health --json`، `config get gateway.port`
- `all`: هر دو پیش‌تنظیم

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` پروفایل‌های V8 را برای هر اجرا می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` فیکسچر مبنای ثبت‌شده در مخزن را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

فیکسچر ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با فیکسچر مقایسه کنید

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke راه‌اندازی اولیه کانتینری لازم است.

جریان کامل شروع سرد در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت ویزارد تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را راستی‌آزمایی می‌کند، سپس Gateway را راه‌اندازی می‌کند و `openclaw health` را اجرا می‌کند.

## smoke واردسازی QR (Docker)

اطمینان می‌دهد helper زمان اجرای QR نگهداری‌شده، زیر runtimeهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست زنده](/fa/help/testing-live)
