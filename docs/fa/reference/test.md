---
read_when:
    - اجرای آزمون‌ها یا رفع مشکل آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-05T01:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته‌های Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته است می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا آزمون‌های سرور با نمونه در حال اجرا تداخل نداشته باشند. وقتی یک اجرای قبلی Gateway پورت 18789 را اشغال‌شده باقی گذاشته است از این استفاده کنید.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش واحد برای فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70٪ برای خطوط/توابع/دستورها و 55٪ برای شاخه‌ها هستند. چون `coverage.all` برابر false است، گیت فایل‌های بارگذاری‌شده توسط مجموعه پوشش واحد را اندازه می‌گیرد، به‌جای اینکه هر فایل منبع split-lane را پوشش‌داده‌نشده حساب کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان و هوشمند آزمون‌های تغییرکرده. هدف‌های دقیق را از ویرایش‌های مستقیم آزمون، فایل‌های خواهر `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/config/package رد می‌شوند مگر اینکه به آزمون‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده آزمون‌های تغییرکرده. وقتی یک ویرایش test harness/config/package باید به رفتار گسترده‌تر آزمون‌های تغییرکرده Vitest برگردد، از آن استفاده کنید.
- `pnpm changed:lanes`: laneهای معماری فعال‌شده توسط diff در برابر `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت بررسی هوشمند تغییرات را برای diff در برابر `origin/main` اجرا می‌کند. typecheck، lint، و فرمان‌های guard را برای laneهای معماری متاثر اجرا می‌کند، اما آزمون‌های Vitest را اجرا نمی‌کند. برای اثبات آزمون از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از طریق laneهای Vitest محدودشده مسیریابی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به configهای برگ گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند عظیم root-project به configهای shard هر extension گسترش می‌یابد.
- اجراهای wrapper آزمون با یک خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابند. خط مدت‌زمان خود Vitest جزئیات هر shard باقی می‌ماند.
- وضعیت آزمون مشترک OpenClaw: وقتی یک آزمون از Vitest به یک `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا auth-profile store ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- helperهای E2E فرایند: وقتی یک آزمون E2E در سطح فرایند Vitest به Gateway در حال اجرا، env مربوط به CLI، ضبط log، و cleanup در یک جا نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- helperهای E2E مربوط به Docker/Bash: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های چند-home می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخواننده‌های سطح پایین‌تر می‌توانند برای یک snippet shell داخل container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`، یا برای یک فایل env میزبان قابل source شدن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، مقدار `--env-file` را به‌عنوان flag مربوط به Node تفسیر کنند. laneهای Docker/Bash که یک Gateway را اجرا می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای resolve کردن entrypoint، راه‌اندازی mock OpenAI، اجرای foreground/background برای Gateway، probeهای آمادگی، export کردن state env، dump کردن logها، و cleanup فرایندها source کنند.
- اجراهای shard کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از آن زمان‌بندی‌ها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI نوع include-pattern نام shard را به کلید زمان‌بندی اضافه می‌کنند، که باعث می‌شود زمان‌بندی‌های shardهای فیلترشده بدون جایگزین کردن داده زمان‌بندی whole-config قابل مشاهده بمانند. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های آزمون منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موارد runtime-heavy را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای آزمون‌های خواهر قبل از برگشت به globهای گسترده‌تر دایرکتوری، به همان خواهر نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کنند تا آزمون‌های importing را اجرا کنند، نه اینکه وقتی مسیر dependency دقیق است، هر shard را به‌صورت گسترده اجرا کنند.
- `auto-reply` اکنون همچنین به سه config اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا harness مربوط به reply بر آزمون‌های سبک‌تر وضعیت/token/helper سطح بالا غالب نشود.
- config پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner مشترک غیرایزوله در configهای سراسر مخزن فعال است.
- `pnpm test:channels` فایل `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای extension/Plugin را اجرا می‌کنند. Pluginهای channel سنگین، Plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت batched باقی می‌مانند. برای یک lane مربوط به یک Plugin bundled از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌دهی مدت‌زمان import و breakdown مربوط به import در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی lane محدودشده استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import، اما فقط برای فایل‌هایی که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed در حالت changed-mode را در برابر اجرای native مربوط به root-project برای همان diff کامیت‌شده git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون نیاز به commit اولیه benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: CPU profile و heap profile را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر config برگ Vitest مربوط به full-suite را به‌صورت سریالی اجرا می‌کند و داده مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log برای هر config می‌نویسد. Test Performance Agent قبل از تلاش برای رفع آزمون‌های کند از این به‌عنوان baseline استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر کارایی مقایسه می‌کند.
- یکپارچه‌سازی Gateway: opt-in از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: آزمون‌های smoke سرتاسری Gateway را اجرا می‌کند (multi-instance WS/HTTP/node pairing). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای تطبیقی در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای مفصل `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: آزمون‌های live مربوط به providerها را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` ویژه provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر live-test مشترک را می‌سازد، OpenClaw را یک بار به‌عنوان npm tarball بسته‌بندی می‌کند، یک تصویر runner ساده Node/Git به‌همراه یک تصویر functional که آن tarball را در `/app` نصب می‌کند می‌سازد/بازاستفاده می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق scheduler وزن‌دار اجرا می‌کند. تصویر ساده (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به‌جای استفاده از sourceهای کپی‌شده مخزن، tarball از پیش ساخته‌شده را mount می‌کنند. تصویر functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای معمول built-app functionality استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها package packer محلی/CI است و tarball به‌همراه `dist/postinstall-inventory.json` را پیش از مصرف Docker اعتبارسنجی می‌کند. تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` plan متعلق به scheduler برای CI را برای laneهای انتخاب‌شده، نوع‌های image، نیازهای package/live-image، سناریوهای state، و بررسی‌های credential بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و مقدار پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و مقدار پیش‌فرض آن 10 است. capهای laneهای سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ capهای provider به‌صورت پیش‌فرض یک lane سنگین برای هر provider از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` هستند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی میزبان کم‌موازی از cap موثر وزن یا منبع فراتر رود، همچنان می‌تواند از یک pool خالی شروع شود و تا آزاد کردن ظرفیت، تنها اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض با فاصله 2 ثانیه انجام می‌شود تا از create storm در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، containerهای stale مربوط به OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت laneهای فعال را منتشر می‌کند، cacheهای ابزار CLI مربوط به provider را بین laneهای سازگار به‌اشتراک می‌گذارد، شکست‌های گذرای live-provider را به‌صورت پیش‌فرض یک بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی laneها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی ordering از طولانی‌ترین به کوتاه‌ترین انجام شود. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1`، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن بازاستفاده از زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط laneهای deterministic/local از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط laneهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package برابر `pnpm test:docker:local:all` و `pnpm test:docker:live:all` هستند. حالت live-only laneهای live اصلی و انتهایی را در یک pool از طولانی‌ترین به کوتاه‌ترین ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را با هم بسته‌بندی کنند. runner پس از نخستین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک fallback timeout 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ laneهای live/tail منتخب capهای سخت‌گیرانه‌تر برای هر lane دارند. فرمان‌های setup مربوط به Docker برای CLI backend از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` timeout مخصوص خود را دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و زمان‌بندی‌های phase زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container منبع E2E پشتیبانی‌شده با Chromium را می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای link، عناصر clickable ارتقایافته با cursor، refهای iframe، و metadata فریم هستند.
- probeهای Docker مربوط به live بودن CLI backend می‌توانند به‌عنوان laneهای متمرکز اجرا شوند، برای نمونه `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw و Open WebUI را به‌صورت Dockerized شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container Gateway seeded و یک container دوم client را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه routed، خواندن transcript، metadata پیوست، رفتار صف رویداد live، مسیریابی ارسال outbound، و اعلان‌های channel و permission به سبک Claude را روی پل واقعی stdio تأیید می‌کند. assertion مربوط به اعلان Claude فریم‌های خام stdio MCP را مستقیم می‌خواند تا smoke همان چیزی را بازتاب دهد که پل واقعا منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمیِ کثیف نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای provider یا channel زنده اجرا می‌کند، سپس یک Gateway لوپ‌بک را راه‌اندازی می‌کند و بررسی می‌کند که agentها، پیکربندی channel، allowlistهای Plugin، فایل‌های workspace/session، وضعیت کهنه وابستگی Plugin قدیمی، راه‌اندازی و وضعیت RPC حفظ می‌شوند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را بدون کلیدهای provider یا channel زنده آماده می‌کند، آن baseline را با یک دستور پخته‌شده `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شده OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway لوپ‌بک را راه‌اندازی می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنه Plugin و وضعیت وابستگی قدیمی، راه‌اندازی، `/healthz`، `/readyz` و وضعیت RPC حفظ می‌شوند یا تمیز ترمیم می‌شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، یک ماتریس دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `all-since-2026.4.23` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعه reported-issues شامل `configured-plugin-installs` است تا تأیید کند Pluginهای خارجی پیکربندی‌شده OpenClaw هنگام ارتقا به‌طور خودکار نصب می‌شوند و شامل `stale-source-plugin-shadow` است تا سایه‌های Plugin فقط-منبع باعث خرابی راه‌اندازی نشوند. Package Acceptance این‌ها را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` در دسترس می‌گذارد.
- `pnpm test:docker:update-migration`: harness حفظ‌شدن ارتقای منتشرشده را در سناریوی پرپاک‌سازی `plugin-deps-cleanup` اجرا می‌کند و به‌طور پیش‌فرض از `openclaw@2026.4.23` شروع می‌کند. گردش‌کار جداگانه `Update Migration` این مسیر را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بسته پایدار منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از Full Release CI اثبات کند.
- `pnpm test:docker:plugins`: smoke نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های npm registry با وابستگی‌های hoist‌شده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace و فعال‌سازی/بازرسی بسته Claude اجرا می‌کند.

## دروازه PR محلی

برای بررسی‌های land/gate محلی PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پرترافیک دچار flake شد، پیش از در نظر گرفتن آن به‌عنوان regression یک‌بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچمارک تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

کاربرد:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- env اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافه.»

آخرین اجرا (2025-12-31، 20 اجرا):

- minimax میانه 1279ms (کمینه 1114، بیشینه 2431)
- opus میانه 2454ms (کمینه 1224، بیشینه 3170)

## بنچمارک راه‌اندازی CLI

اسکریپت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

کاربرد:

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

Presetها:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: هر دو preset

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع exit-code/signal، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ضبط پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدف‌گذاری‌شده را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت full-suite را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` fixture مبنای ثبت‌شده در repo را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

fixture ثبت‌شده در repo:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با fixture مقایسه کنید

## E2E آماده‌سازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke آماده‌سازی اولیه کانتینری‌شده لازم است.

جریان کامل شروع سرد در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت wizard تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## تست smoke واردسازی QR (Docker)

اطمینان می‌دهد helper زمان اجرای QR نگه‌داری‌شده، تحت runtimeهای پشتیبانی‌شده Docker Node بارگذاری می‌شود (پیش‌فرض Node 24، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمایش](/fa/help/testing)
- [آزمایش زنده](/fa/help/testing-live)
- [آزمایش به‌روزرسانی‌ها و plugins](/fa/help/testing-updates-plugins)
