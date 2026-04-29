---
read_when:
    - اجرای آزمون‌ها یا رفع مشکلات آن‌ها
summary: نحوه اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-04-29T23:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با نمونه در حال اجرا تداخل نداشته باشند. زمانی از این استفاده کنید که اجرای قبلی Gateway پورت 18789 را اشغال کرده باشد.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش واحدِ فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70٪ برای خط‌ها/تابع‌ها/دستورها و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است، گیت فایل‌هایی را اندازه‌گیری می‌کند که توسط مجموعه پوشش واحد بارگذاری شده‌اند، به‌جای اینکه هر فایل منبع split-lane را پوشش‌داده‌نشده حساب کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌های تغییرکرده از زمان `origin/main` اجرا می‌کند.
- `pnpm test:changed`: اجرای ارزان و هوشمند تست‌های تغییرکرده. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده تست‌های تغییرکرده. زمانی از آن استفاده کنید که ویرایش در test harness/پیکربندی/بسته باید به رفتار گسترده‌تر changed-test خود Vitest برگردد.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff در برابر `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت بررسی هوشمند تغییرکرده را برای diff در برابر `origin/main` اجرا می‌کند. typecheck، lint و فرمان‌های نگهبان را برای laneهای معماری تحت تأثیر اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از طریق laneهای محدوده‌بندی‌شده Vitest مسیریابی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند عظیم root-project، به پیکربندی‌های shard برای هر extension گسترش می‌یابد.
- اجرای wrapper تست با خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد. خط مدت‌زمان خود Vitest جزئیات هر shard باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست در Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا مخزن auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- helperهای E2E فرایند: وقتی یک تست E2E سطح فرایند Vitest به Gateway در حال اجرا، env برای CLI، ثبت log، و پاک‌سازی در یک محل نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- helperهای Docker/Bash E2E: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های چند-home می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر جریان `openclaw_test_state_create <label> <scenario>` را صدا بزنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک قطعه shell داخل container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`، یا برای فایل env میزبان قابل source شدن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، `--env-file` را به‌عنوان flag Node تفسیر کنند. laneهای Docker/Bash که Gateway راه‌اندازی می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای حل entrypoint، startup شبیه‌سازی‌شده OpenAI، اجرای foreground/background Gateway، probeهای آمادگی، export وضعیت env، dumpهای log، و پاک‌سازی فرایند source کنند.
- اجراهای shard کامل، extension، و include-pattern داده زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متعادل کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی shardهای فیلترشده را بدون جایگزین کردن داده زمان‌بندی whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند، و موردهای runtime-heavy را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست هم‌جوار قبل از برگشت به globهای دایرکتوری گسترده‌تر، به همان هم‌جوار نگاشت می‌شوند. ویرایش helperها زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از گراف import محلی برای اجرای تست‌های importکننده استفاده می‌کند، به‌جای اینکه وقتی مسیر dependency دقیق است هر shard را گسترده اجرا کند.
- `auto-reply` اکنون به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) نیز تقسیم می‌شود تا harness پاسخ بر تست‌های سبک‌تر وضعیت/توکن/helper سطح بالا غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک غیرایزوله در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/Plugin را اجرا می‌کنند. Pluginهای کانال سنگین، Plugin مرورگر، و OpenAI به‌صورت shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت batched باقی می‌مانند. برای یک lane مربوط به یک Plugin bundled از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌گیری مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی lane محدوده‌بندی‌شده استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling import، اما فقط برای فایل‌های تغییرکرده از زمان `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر changed-mode مسیریابی‌شده را در برابر اجرای native root-project برای همان diff کامیت‌شده git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون کامیت کردن اولیه benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک profile CPU برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: profileهای CPU و heap را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی برگ full-suite Vitest را به‌صورت serial اجرا می‌کند و داده مدت‌زمان گروه‌بندی‌شده به‌علاوه artifactهای JSON/log برای هر پیکربندی می‌نویسد. Test Performance Agent از این به‌عنوان baseline خود قبل از تلاش برای اصلاح تست‌های کند استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر performance مقایسه می‌کند.
- یکپارچه‌سازی Gateway: opt-in از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: تست‌های smoke پایان‌به‌پایان Gateway را اجرا می‌کند (جفت‌سازی چندنمونه‌ای WS/HTTP/node). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای adaptive در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose، `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر live-test مشترک را می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند، یک تصویر runner ساده Node/Git به‌علاوه یک تصویر functional را می‌سازد/بازاستفاده می‌کند که آن tarball را در `/app` نصب می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق scheduler وزن‌دار اجرا می‌کند. تصویر ساده (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به‌جای استفاده از sourceهای کپی‌شده مخزن، tarball ازپیش‌ساخته را mount می‌کنند. تصویر functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای معمول عملکرد built-app استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer بسته محلی/CI است و tarball به‌همراه `dist/postinstall-inventory.json` را پیش از مصرف Docker اعتبارسنجی می‌کند. تعریف‌های lane Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` طرح CI تحت مالکیت scheduler را برای laneهای انتخاب‌شده، نوع‌های تصویر، نیازهای package/live-image، سناریوهای state، و بررسی‌های credential بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. capهای lane سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ capهای provider به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` برابر یک lane سنگین برای هر provider هستند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی میزبان کم‌موازی‌سازی از weight یا resource cap مؤثر فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا زمانی که ظرفیت را آزاد کند تنها اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض با فاصله 2 ثانیه stagger می‌شود تا از طوفان‌های create در Docker daemon محلی جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` override کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، containerهای کهنه OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت active-lane را منتشر می‌کند، cacheهای ابزار CLI provider را بین laneهای سازگار به اشتراک می‌گذارد، failureهای transient live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی laneها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی از ترتیب longest-first استفاده شود. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1`، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن بازاستفاده از زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط laneهای deterministic/محلی از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط laneهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only، laneهای live اصلی و انتهایی را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را کنار هم بسته‌بندی کنند. runner پس از نخستین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ laneهای live/tail منتخب از capهای سخت‌گیرانه‌تر برای هر lane استفاده می‌کنند. فرمان‌های setup Docker برای backendهای CLI، timeout خودشان را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و زمان‌بندی phaseها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند و ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container E2E منبع با پشتوانه Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickableهای ارتقایافته با cursor، refهای iframe، و metadata فریم باشند.
- probeهای live Docker برای backendهای CLI می‌توانند به‌صورت laneهای متمرکز اجرا شوند، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را در Docker شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container Gateway seedشده و یک container client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه مسیریابی‌شده، خواندن transcript، metadata attachment، رفتار queue رویداد live، مسیریابی ارسال outbound، و اعلان‌های channel + permission به سبک Claude را روی bridge واقعی stdio بررسی می‌کند. assertion اعلان Claude فریم‌های خام stdio MCP را مستقیماً می‌خواند تا smoke همان چیزی را بازتاب دهد که bridge واقعاً منتشر می‌کند.

## گیت PR محلی

برای بررسی‌های محلی فرود/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی میزبانی با بار زیاد دچار ناپایداری شد، پیش از اینکه آن را رگرسیون در نظر بگیرید یک‌بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچمارک تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

روش استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک واژه پاسخ بده: باشه. هیچ نشانه‌گذاری یا متن اضافه‌ای ننویس.»

آخرین اجرا (2025-12-31، 20 اجرا):

- میانه minimax برابر 1279ms (کمینه 1114، بیشینه 2431)
- میانه opus برابر 2454ms (کمینه 1224، بیشینه 3170)

## بنچمارک راه‌اندازی CLI

اسکریپت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

روش استفاده:

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

خروجی برای هر فرمان شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان هارنس استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت دود هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` فیکسچر مبنای ثبت‌شده در مخزن را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

فیکسچر ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با فیکسچر مقایسه کنید

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای تست‌های دود راه‌اندازی اولیه کانتینری لازم است.

جریان کامل شروع سرد در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت ویزارد تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## تست دود وارد کردن QR (Docker)

اطمینان می‌دهد که helper نگهداری‌شده زمان اجرای QR زیر runtimeهای پشتیبانی‌شده Docker Node بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست زنده](/fa/help/testing-live)
