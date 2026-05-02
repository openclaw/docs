---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوه اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-02T12:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمایش (مجموعه‌ها، زنده، Docker): [آزمایش](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی‌ها و بسته‌های Plugin: [آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته است می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با یک نمونه در حال اجرا تداخل نداشته باشند. زمانی از این استفاده کنید که اجرای قبلی Gateway پورت 18789 را اشغال کرده باشد.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش واحد برای فایل‌های بارگذاری‌شده است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70% برای خط‌ها/تابع‌ها/گزاره‌ها و 55% برای شاخه‌ها هستند. چون `coverage.all` برابر false است، این گیت به‌جای اینکه هر فایل منبع split-lane را پوشش‌داده‌نشده فرض کند، فایل‌هایی را اندازه می‌گیرد که توسط مجموعه پوشش واحد بارگذاری شده‌اند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از `origin/main` به بعد تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان و هوشمند تست‌های تغییریافته. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های sibling `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده تست‌های تغییریافته. زمانی از آن استفاده کنید که ویرایش test harness/پیکربندی/بسته باید به رفتار گسترده‌تر changed-test در Vitest برگردد.
- `pnpm changed:lanes`: laneهای معماری‌ای را نشان می‌دهد که diff در برابر `origin/main` فعال کرده است.
- `pnpm check:changed`: گیت بررسی هوشمند تغییرات را برای diff در برابر `origin/main` اجرا می‌کند. typecheck، lint، و دستورهای guard را برای laneهای معماری اثرپذیرفته اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از طریق laneهای scoped Vitest مسیریابی می‌کند. اجراهای بدون هدف از گروه‌های shard ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند؛ گروه افزونه همیشه به‌جای یک فرایند عظیم root-project، به پیکربندی‌های shard جداگانه هر افزونه گسترش می‌یابد.
- اجراهای wrapper تست با یک خلاصه کوتاه ` [test] passed|failed|skipped ... in ...` پایان می‌یابند. خط مدت‌زمان خود Vitest همچنان جزئیات هر shard است.
- وضعیت تست مشترک OpenClaw: وقتی یک تست در Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، agent dir، یا auth-profile store ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- helperهای Process E2E: وقتی یک تست E2E در سطح فرایند Vitest به یک Gateway در حال اجرا، محیط CLI، ثبت log، و پاک‌سازی در یک مکان نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- helperهای Docker/Bash E2E: laneهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به کانتینر بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های multi-home می‌توانند `docker_e2e_test_state_function_b64` را بدهند و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک snippet shell داخل کانتینر از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`، یا برای یک فایل env میزبان قابل source از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` قبل از `create` مانع می‌شود runtimeهای جدیدتر Node، `--env-file` را به‌عنوان flag مربوط به Node در نظر بگیرند. laneهای Docker/Bash که یک Gateway را اجرا می‌کنند می‌توانند داخل کانتینر `scripts/lib/openclaw-e2e-instance.sh` را برای resolution نقطه ورود، راه‌اندازی mock OpenAI، اجرای Gateway در foreground/background، readiness probeها، export کردن env وضعیت، dump کردن logها، و پاک‌سازی فرایندها source کنند.
- اجراهای shard کامل، افزونه، و include-pattern داده‌های timing محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی whole-config از این timingها برای متوازن کردن shardهای کند و سریع استفاده می‌کنند. shardهای include-pattern در CI نام shard را به کلید timing اضافه می‌کنند، که timingهای shard فیلترشده را بدون جایگزین کردن داده‌های timing whole-config قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact timing محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از laneهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موارد runtime-heavy را روی laneهای موجودشان باقی می‌گذارند.
- فایل‌های منبعی که تست sibling دارند، قبل از fallback به globهای دایرکتوری گسترده‌تر، به همان sibling نگاشت می‌شوند. ویرایش helperها زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی استفاده می‌کند تا به‌جای اجرای گسترده هر shard وقتی مسیر وابستگی دقیق است، تست‌های importکننده اجرا شوند.
- `auto-reply` اکنون همچنین به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا reply harness بر تست‌های سبک‌تر وضعیت/token/helper در top-level غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، همراه با runner مشترک non-isolated که در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه shardهای افزونه/Plugin را اجرا می‌کنند. Pluginهای کانال سنگین، Plugin مرورگر، و OpenAI به‌عنوان shardهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت batched باقی می‌مانند. برای یک lane مربوط به یک Plugin bundled، از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌دهی import-duration و import-breakdown در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی lane scoped استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import است، اما فقط برای فایل‌هایی که از `origin/main` به بعد تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر changed-mode مسیریابی‌شده را در برابر اجرای native root-project برای همان diff ثبت‌شده در git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون اینکه ابتدا commit شود benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: پروفایل‌های CPU و heap را برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی برگ Vitest در full-suite را به‌صورت serial اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log برای هر پیکربندی را می‌نویسد. Test Performance Agent از این به‌عنوان baseline خود پیش از تلاش برای رفع تست‌های کند استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر کارایی مقایسه می‌کند.
- یکپارچه‌سازی Gateway: با `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: تست‌های smoke سرتاسری Gateway را اجرا می‌کند (multi-instance WS/HTTP/node pairing). به‌صورت پیش‌فرض در `vitest.e2e.config.ts` از `threads` + `isolate: false` با workerهای adaptive استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose مقدار `OPENCLAW_E2E_VERBOSE=1` را بگذارید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: image مشترک live-test را build می‌کند، OpenClaw را یک‌بار به‌عنوان tarball npm pack می‌کند، یک image runner bare Node/Git به‌همراه یک image functional که آن tarball را در `/app` نصب می‌کند build/بازاستفاده می‌کند، سپس laneهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. image bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای laneهای installer/update/plugin-dependency استفاده می‌شود؛ آن laneها به‌جای استفاده از sourceهای کپی‌شده مخزن، tarball از پیش ساخته‌شده را mount می‌کنند. image functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای laneهای معمول عملکرد برنامه build‌شده استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer بسته محلی/CI است و پیش از مصرف Docker، tarball به‌همراه `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` plan انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` plan تحت مالکیت scheduler در CI را برای laneهای انتخاب‌شده، گونه‌های image، نیازهای package/live-image، scenarioهای وضعیت، و بررسی‌های credential بدون build یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و پیش‌فرض آن 10 است. سقف laneهای سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است؛ سقف providerها به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` یک lane سنگین برای هر provider است. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک lane روی میزبانی با parallelism پایین از سقف مؤثر وزن یا منبع فراتر برود، همچنان می‌تواند از یک pool خالی شروع شود و تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا خواهد شد. شروع laneها به‌صورت پیش‌فرض با 2 ثانیه فاصله انجام می‌شود تا از create storm در Docker daemon محلی جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` آن را override کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، کانتینرهای کهنه OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت laneهای فعال را منتشر می‌کند، cacheهای ابزار CLI مربوط به provider را بین laneهای سازگار به‌اشتراک می‌گذارد، شکست‌های transient live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و timingهای lane را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی ترتیب longest-first اعمال شود. برای چاپ manifest lane بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1`، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال کردن بازاستفاده از timing از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط laneهای deterministic/local از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط laneهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای بسته `pnpm test:docker:local:all` و `pnpm test:docker:live:all` هستند. حالت live-only، laneهای live اصلی و tail را در یک pool longest-first ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex، و Gemini را کنار هم pack کنند. runner پس از اولین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر lane یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ laneهای live/tail منتخب سقف‌های سخت‌گیرانه‌تر مخصوص lane دارند. دستورهای setup Docker برای backendهای CLI timeout جداگانه خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر lane، `summary.json`، `failures.json`، و timingهای phase زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی laneهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ دستورهای rerun هدفمند و ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک کانتینر E2E مبتنی بر source و پشتیبانی‌شده با Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای لینک، clickables ارتقایافته با cursor، iframe refها، و metadata فریم هستند.
- probeهای Docker live مربوط به backendهای CLI را می‌توان به‌صورت laneهای متمرکز اجرا کرد، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume`، یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI کانتینری‌شده را شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک image خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک کانتینر Gateway دارای seed و یک کانتینر client دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس discovery گفت‌وگوی مسیریابی‌شده، خواندن transcript، metadata پیوست، رفتار صف رویداد live، مسیریابی ارسال outbound، و notificationهای channel + permission به سبک Claude را روی bridge واقعی stdio تأیید می‌کند. assertion مربوط به notification در Claude، فریم‌های خام stdio MCP را مستقیماً می‌خواند تا smoke بازتاب‌دهنده چیزی باشد که bridge واقعاً منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شده‌ی OpenClaw را روی یک fixture قدیمی کاربر با وضعیت dirty نصب می‌کند، به‌روزرسانی بسته را همراه با doctor غیرتعاملی بدون کلیدهای provider یا channel زنده اجرا می‌کند، سپس یک Gateway روی loopback راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی channel، فهرست‌های مجاز Plugin، فایل‌های workspace/session، وضعیت کهنه‌ی وابستگی Plugin قدیمی، راه‌اندازی، و وضعیت RPC حفظ شوند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه‌ی کاربر موجود را بدون کلیدهای provider یا channel زنده seed می‌کند، آن baseline را با یک دستورالعمل آماده‌ی فرمان `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به tarball بسته‌بندی‌شده‌ی OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway روی loopback راه‌اندازی می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنه‌ی Plugin و وضعیت وابستگی قدیمی، راه‌اندازی، `/healthz`، `/readyz`، و وضعیت RPC حفظ شوند یا تمیز تعمیر شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، یک ماتریس دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ پذیرش بسته این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` در دسترس قرار می‌دهد.
- `pnpm test:docker:update-migration`: harness بازماندنِ ارتقای منتشرشده را در سناریوی cleanup-heavy به نام `plugin-deps-cleanup` اجرا می‌کند و به‌طور پیش‌فرض از `openclaw@2026.4.23` شروع می‌کند. workflow جداگانه‌ی `Update Migration` این lane را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بسته‌ی پایدار منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از CI انتشار کامل اثبات کند.
- `pnpm test:docker:plugins`: smoke نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های npm registry با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی بسته‌ی Claude اجرا می‌کند.

## گیت PR محلی

برای بررسی‌های land/gate در PR محلی، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار flake شد، پیش از اینکه آن را regression در نظر بگیرید یک‌بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

روش استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: “با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافه.”

آخرین اجرا (2025-12-31، 20 اجرا):

- میانه minimax برابر 1279ms (کمینه 1114، بیشینه 2431)
- میانه opus برابر 2454ms (کمینه 1224، بیشینه 3170)

## بنچ راه‌اندازی CLI

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

پریست‌ها:

- `startup`: `--version`، `--help`، `health`، `health --json`، `status --json`، `status`
- `real`: `health`، `status`، `status --json`، `sessions`، `sessions --json`، `tasks --json`، `tasks list --json`، `tasks audit --json`، `agents list --json`، `gateway status`، `gateway status --json`، `gateway health --json`، `config get gateway.port`
- `all`: هر دو پریست

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع exit-code/signal، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدفمند را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت full-suite را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` فیکسچر baseline ثبت‌شده در مخزن را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

فیکسچر ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با فیکسچر مقایسه کنید

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke راه‌اندازی اولیه کانتینری‌شده لازم است.

جریان cold-start کامل در یک کانتینر Linux پاک:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت wizard تعاملی را از طریق pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## smoke ایمپورت QR (Docker)

اطمینان می‌دهد helper نگهداری‌شده runtime مربوط به QR تحت runtimeهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (پیش‌فرض Node 24، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست زنده](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و plugins](/fa/help/testing-updates-plugins)
