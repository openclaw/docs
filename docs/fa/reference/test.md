---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوهٔ اجرای آزمون‌ها به‌صورت محلی (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمایش‌ها
x-i18n:
    generated_at: "2026-06-27T18:51:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بستهٔ Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

- ترتیب معمول تست محلی:
  1. `pnpm test:changed` برای اثبات Vitest در محدوده تغییرات.
  2. `pnpm test <path-or-filter>` برای یک فایل، دایرکتوری، یا هدف صریح.
  3. `pnpm test` فقط وقتی عمدا به مجموعه کامل محلی Vitest نیاز دارید.
- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعه کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با یک نمونه در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال کرده است از این استفاده کنید.
- `pnpm test:coverage`: مجموعه واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش مسیر پیش‌فرض واحد است، نه پوشش همه فایل‌های کل مخزن. آستانه‌ها 70% برای خط‌ها/تابع‌ها/دستورها و 55% برای شاخه‌ها هستند. چون `coverage.all` برابر false است و مسیر پیش‌فرض دامنه شمول پوشش را به تست‌های واحد غیرسریع با فایل‌های منبع هم‌جوار محدود می‌کند، این گیت منبع تحت مالکیت همین مسیر را اندازه می‌گیرد، نه هر import گذرایی را که اتفاقا بارگذاری می‌کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند اجرا می‌کند.
- `pnpm test:changed`: اجرای ارزان و هوشمند تست‌های تغییریافته. هدف‌های دقیق را از ویرایش‌های مستقیم تست، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح منبع، و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گسترده تست‌های تغییریافته. وقتی ویرایش harness تست/پیکربندی/بسته باید به رفتار گسترده‌تر تست‌های تغییریافته Vitest برگردد از آن استفاده کنید.
- `pnpm changed:lanes`: مسیرهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: خارج از CI به‌صورت پیش‌فرض به Crabbox/Testbox واگذار می‌کند، سپس گیت هوشمند بررسی تغییرات را برای diff نسبت به `origin/main` داخل فرزند راه‌دور اجرا می‌کند. برای مسیرهای معماری متاثر، typecheck، lint، و فرمان‌های guard را اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- worktreeهای Codex و checkoutهای پیوندی/پراکنده: از اجرای مستقیم محلی `pnpm test*`، `pnpm check*`، و `pnpm crabbox:run` خودداری کنید مگر اینکه تایید کرده باشید pnpm وابستگی‌ها را آشتی نمی‌دهد. برای اثبات خیلی کوچک روی فایل صریح از `node scripts/run-vitest.mjs <path-or-filter>` استفاده کنید؛ برای گیت‌های تغییریافته یا اثبات گسترده از `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` استفاده کنید تا pnpm داخل Testbox اجرا شود.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: سری‌سازی بررسی سنگین را برای فرمان‌هایی مانند `pnpm check:changed` و `pnpm test ...` هدفمند، به‌جای دایرکتوری مشترک Git، داخل worktree فعلی نگه می‌دارد. فقط روی میزبان‌های محلی پرظرفیت و وقتی عمدا بررسی‌های مستقل را روی worktreeهای پیوندی اجرا می‌کنید از آن استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از مسیرهای محدود Vitest عبور می‌دهد. اجراهای بدون هدف اثبات مجموعه کامل هستند: از گروه‌های شارد ثابت استفاده می‌کنند، برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند، و پیش از شروع، fanout شارد محلی مورد انتظار را چاپ می‌کنند. گروه extension همیشه به‌جای یک فرایند بزرگ پروژه ریشه، به پیکربندی‌های شارد هر extension گسترش می‌یابد.
- اجرای wrapper تست با یک خلاصه کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد. خط مدت‌زمان خود Vitest به‌عنوان جزئیات هر شارد باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent، یا فروشگاه auth-profile ایزوله نیاز دارد، از `src/test-utils/openclaw-test-state.ts` از Vitest استفاده کنید.
- `pnpm test:env-mutations:report`: گزارش غیرمسدودکننده‌ای از تست‌ها و harnessهایی که `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_WORKSPACE_DIR`، یا کلیدهای env مرتبط OpenClaw را مستقیما تغییر می‌دهند. از آن برای یافتن نامزدهای مهاجرت به helper وضعیت تست مشترک استفاده کنید.
- E2E mockشده Control UI: برای مسیر Vitest + Playwright که Vite Control UI را شروع می‌کند و یک صفحه واقعی Chromium را در برابر Gateway WebSocket mockشده هدایت می‌کند، از `pnpm test:ui:e2e` استفاده کنید. تست‌ها در `ui/src/**/*.e2e.test.ts` قرار دارند؛ mockها و کنترل‌های مشترک در `ui/src/test-helpers/control-ui-e2e.ts` قرار دارند. `pnpm test:e2e` این مسیر را شامل می‌شود. در worktreeهای Codex، پس از نصب وابستگی‌ها، برای اثبات خیلی کوچک و هدفمند از `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`، یا برای اثبات گسترده‌تر GUI از Testbox/Crabbox استفاده کنید.
- helperهای E2E فرایند: وقتی یک تست E2E سطح فرایند Vitest به Gateway در حال اجرا، env CLI، ضبط log، و پاکسازی در یک جا نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- تست‌های PTY مربوط به TUI: برای مسیر سریع PTY با backend جعلی از `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` استفاده کنید. برای smoke کندتر `tui --local` که فقط endpoint مدل خارجی را mock می‌کند، از `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` یا `pnpm tui:pty:test:watch --mode local` استفاده کنید. روی متن قابل‌مشاهده پایدار یا فراخوانی‌های fixture assertion بگذارید، نه snapshotهای خام ANSI.
- helperهای E2E مربوط به Docker/Bash: مسیرهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به container پاس بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` رمزگشایی کنند؛ اسکریپت‌های چندخانه‌ای می‌توانند `docker_e2e_test_state_function_b64` را پاس بدهند و در هر flow، `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک snippet شل درون container از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`، یا برای یک فایل env میزبان قابل source شدن از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` پیش از `create` مانع می‌شود runtimeهای جدیدتر Node، `--env-file` را به‌عنوان flag مربوط به Node تفسیر کنند. مسیرهای Docker/Bash که یک Gateway را راه‌اندازی می‌کنند می‌توانند داخل container، `scripts/lib/openclaw-e2e-instance.sh` را برای حل entrypoint، راه‌اندازی mock OpenAI، اجرای foreground/background مربوط به Gateway، probeهای آمادگی، export وضعیت env، dumpهای log، و پاکسازی فرایند source کنند.
- اجراهای شارد کامل، extension، و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی کل پیکربندی از آن زمان‌بندی‌ها برای متعادل کردن شاردهای کند و سریع استفاده می‌کنند. شاردهای CI مربوط به include-pattern نام شارد را به کلید زمان‌بندی اضافه می‌کنند، که زمان‌بندی‌های شارد فیلترشده را بدون جایگزین کردن داده‌های زمان‌بندی کل پیکربندی قابل مشاهده نگه می‌دارد. برای نادیده گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست انتخاب‌شده `plugin-sdk` و `commands` اکنون از مسیرهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موردهای سنگین runtime را روی مسیرهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست هم‌جوار پیش از fallback به globهای دایرکتوری گسترده‌تر به همان هم‌جوار نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers`، و `src/plugins/contracts` از یک گراف import محلی برای اجرای تست‌های importکننده استفاده می‌کنند، به‌جای اینکه وقتی مسیر وابستگی دقیق است هر شارد را به‌صورت گسترده اجرا کنند.
- `auto-reply` اکنون همچنین به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا harness پاسخ بر تست‌های سبک‌تر وضعیت/توکن/helper سطح بالا غالب نشود.
- پیکربندی پایه Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد و runner غیرایزوله مشترک در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همه شاردهای extension/plugin را اجرا می‌کنند. pluginهای سنگین channel، plugin مرورگر، و OpenAI به‌عنوان شاردهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر plugin به‌صورت batch باقی می‌مانند. برای یک مسیر plugin بسته‌بندی‌شده از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌دهی مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، در حالی که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی محدود مسیر استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profile کردن import است، اما فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر حالت تغییریافته مسیریابی‌شده را برای همان diff ثبت‌شده در git در برابر اجرای بومی پروژه ریشه benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات worktree فعلی را بدون commit کردن از قبل benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک CPU profile برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: CPU profile و heap profile برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی برگ Vitest مربوط به مجموعه کامل را به‌صورت سری اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده را همراه با artifactهای JSON/log برای هر پیکربندی می‌نویسد. Test Performance Agent پیش از تلاش برای رفع تست‌های کند، از این به‌عنوان baseline استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر performance مقایسه می‌کند.
- `pnpm test:docker:timings <summary.json>` پس از یک اجرای کامل Docker، مسیرهای کند Docker را بررسی می‌کند؛ برای چاپ فرمان‌های rerun ارزان و هدفمند از همان artifactها، از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- یکپارچه‌سازی Gateway: از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: تجمیع E2E مخزن را اجرا می‌کند: تست‌های smoke سرتاسری Gateway به‌علاوه مسیر E2E مرورگر mockشده Control UI.
- `pnpm test:e2e:gateway`: تست‌های smoke سرتاسری Gateway را اجرا می‌کند (جفت‌سازی چندنمونه‌ای WS/HTTP/node). به‌صورت پیش‌فرض با workerهای تطبیقی در `vitest.e2e.config.ts` از `threads` + `isolate: false` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose، `OPENCLAW_E2E_VERBOSE=1` را تنظیم کنید.
- `pnpm test:live`: تست‌های زنده provider را اجرا می‌کند (minimax/zai). برای unskip شدن به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` ویژه provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر مشترک آزمون زنده را می‌سازد، OpenClaw را یک‌بار به‌صورت tarball مربوط به npm بسته‌بندی می‌کند، یک تصویر اجرای خام Node/Git به‌همراه یک تصویر کاربردی می‌سازد/بازاستفاده می‌کند که آن tarball را در `/app` نصب می‌کند، سپس مسیرهای دودآزمایی Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق زمان‌بند وزن‌دار اجرا می‌کند. تصویر خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای مسیرهای نصب‌کننده/به‌روزرسانی/وابستگی Plugin استفاده می‌شود؛ آن مسیرها به‌جای استفاده از منابع کپی‌شدهٔ مخزن، tarball ازپیش‌ساخته را mount می‌کنند. تصویر کاربردی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای مسیرهای عادی قابلیت‌های برنامهٔ ساخته‌شده استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها بسته‌بند محلی/CI است و پیش از مصرف آن توسط Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف‌های مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامهٔ انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` برنامهٔ CI تحت مالکیت زمان‌بند را برای مسیرهای انتخاب‌شده، گونه‌های تصویر، نیازهای بسته/تصویر زنده، سناریوهای وضعیت، و بررسی‌های اعتبارنامه، بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` اسلات‌های فرایند را کنترل می‌کند و پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` مخزن انتهایی حساس به ارائه‌دهنده را کنترل می‌کند و پیش‌فرض آن 10 است. سقف مسیرهای سنگین به‌طور پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است؛ سقف‌های ارائه‌دهنده به‌طور پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`، و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` به یک مسیر سنگین برای هر ارائه‌دهنده محدود می‌شوند. برای میزبان‌های بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک مسیر روی میزبانی با موازی‌سازی کم از سقف وزن مؤثر یا منبع فراتر برود، همچنان می‌تواند از یک مخزن خالی شروع شود و تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا خواهد شد. شروع مسیرها به‌طور پیش‌فرض با فاصلهٔ 2 ثانیه انجام می‌شود تا از هجوم ساخت در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. اجراکننده به‌طور پیش‌فرض Docker را پیش‌پرواز می‌کند، containerهای کهنهٔ E2E مربوط به OpenClaw را پاک می‌کند، هر 30 ثانیه وضعیت مسیرهای فعال را منتشر می‌کند، cacheهای ابزار CLI ارائه‌دهنده را بین مسیرهای سازگار به‌اشتراک می‌گذارد، شکست‌های گذرای ارائه‌دهندهٔ زنده را به‌طور پیش‌فرض یک‌بار دوباره تلاش می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی مسیرها را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند تا در اجراهای بعدی ترتیب طولانی‌ترین-ابتدا استفاده شود. از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای چاپ manifest مسیرها بدون اجرای Docker، از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` برای تنظیم خروجی وضعیت، یا از `OPENCLAW_DOCKER_ALL_TIMINGS=0` برای غیرفعال‌کردن بازاستفاده از زمان‌بندی استفاده کنید. از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` فقط برای مسیرهای قطعی/محلی یا از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` فقط برای مسیرهای ارائه‌دهندهٔ زنده استفاده کنید؛ aliasهای بسته `pnpm test:docker:local:all` و `pnpm test:docker:live:all` هستند. حالت فقط-زنده مسیرهای زندهٔ اصلی و انتهایی را در یک مخزن طولانی‌ترین-ابتدا ادغام می‌کند تا bucketهای ارائه‌دهنده بتوانند کارهای Claude، Codex، و Gemini را کنار هم فشرده کنند. اجراکننده پس از نخستین شکست، زمان‌بندی مسیرهای تجمیع‌شدهٔ جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر مسیر یک timeout پشتیبان 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ مسیرهای زنده/انتهایی انتخاب‌شده سقف‌های سخت‌گیرانه‌تر مخصوص هر مسیر دارند. فرمان‌های راه‌اندازی Docker برای backend مربوط به CLI، timeout خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). گزارش‌های هر مسیر، `summary.json`، `failures.json`، و زمان‌بندی فازها زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ از `pnpm test:docker:timings <summary.json>` برای بررسی مسیرهای کند و از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` برای چاپ فرمان‌های بازاجرای هدفمند و کم‌هزینه استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک container منبع E2E متکی بر Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای پیوند، عناصر قابل‌کلیک ارتقایافته با cursor، ارجاع‌های iframe، و فرادادهٔ frame باشند.
- `pnpm test:docker:skill-install`: tarball بسته‌بندی‌شدهٔ OpenClaw را در یک اجراکنندهٔ خام Docker نصب می‌کند، `skills.install.allowUploadedArchives` را غیرفعال می‌کند، یک slug فعلی skill را از جست‌وجوی زندهٔ ClawHub resolve می‌کند، آن را از طریق `openclaw skills install` نصب می‌کند، و `SKILL.md`، `.clawhub/origin.json`، `.clawhub/lock.json`، و `skills info --json` را بررسی می‌کند.
- probeهای زندهٔ Docker برای backend مربوط به CLI را می‌توان به‌عنوان مسیرهای متمرکز اجرا کرد، برای نمونه `pnpm test:docker:live-cli-backend:claude`، `pnpm test:docker:live-cli-backend:claude:resume`، یا `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini aliasهای متناظر `:resume` و `:mcp` را دارد.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را در Docker شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک گفت‌وگوی واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل زندهٔ قابل‌استفاده نیاز دارد، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های عادی unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک container دارای seed برای Gateway و یک container دوم client را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف گفت‌وگوی routeشده، خواندن transcript، فرادادهٔ پیوست، رفتار صف رویداد زنده، route کردن ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude را روی پل stdio واقعی بررسی می‌کند. assertion اعلان Claude فریم‌های خام stdio مربوط به MCP را مستقیم می‌خواند تا دودآزمایی بازتاب‌دهندهٔ چیزی باشد که پل واقعاً منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: tarball بسته‌بندی‌شدهٔ OpenClaw را روی fixture کاربر قدیمی آلوده نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده یا کانال زنده اجرا می‌کند، سپس یک Gateway با loopback را شروع می‌کند و بررسی می‌کند agentها، پیکربندی کانال، allowlistهای Plugin، فایل‌های workspace/session، وضعیت کهنهٔ وابستگی Plugin میراثی، startup، و وضعیت RPC باقی بمانند.
- `pnpm test:docker:published-upgrade-survivor`: به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را بدون کلیدهای ارائه‌دهنده یا کانال زنده seed می‌کند، آن baseline را با یک دستور recipe پخته‌شدهٔ `openclaw config set` پیکربندی می‌کند، نصب منتشرشده را به tarball بسته‌بندی‌شدهٔ OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway با loopback را شروع می‌کند و بررسی می‌کند intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنهٔ Plugin و وضعیت وابستگی میراثی، startup، `/healthz`، `/readyz`، و وضعیت RPC باقی بمانند یا تمیز repair شوند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، یک ماتریس محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعهٔ reported-issues شامل `configured-plugin-installs` برای بررسی نصب خودکار Pluginهای خارجی پیکربندی‌شدهٔ OpenClaw هنگام upgrade و `stale-source-plugin-shadow` برای جلوگیری از خراب‌کردن startup توسط سایه‌های Plugin فقط-منبع است. پذیرش بسته این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند و پیش از تحویل specهای دقیق بسته به مسیرهای Docker، tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند.
- `pnpm test:docker:update-migration`: harness بازماندهٔ upgrade منتشرشده را در سناریوی سنگین از نظر cleanup به نام `plugin-deps-cleanup` اجرا می‌کند و به‌طور پیش‌فرض از `openclaw@2026.4.23` شروع می‌شود. گردش‌کار جداگانهٔ مهاجرت به‌روزرسانی این مسیر را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بستهٔ پایدار منتشرشده از `.23` به بعد به candidate به‌روزرسانی شود و cleanup وابستگی Plugin پیکربندی‌شده را بیرون از CI انتشار کامل اثبات کند.
- `pnpm test:docker:plugins`: دودآزمایی نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های registry مربوط به npm با وابستگی‌های hoistشده، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude اجرا می‌کند.

## گیت محلی PR

برای بررسی‌های محلی فرود/گیت PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پرمشغله ناپایدار شد، پیش از در نظر گرفتن آن به‌عنوان رگرسیون، یک بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` ایزوله کنید. برای میزبان‌هایی با محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- env اختیاری: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافه.»

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

پریست‌ها:

- `startup`: `--version`، `--help`، `health`، `health --json`، `status --json`، `status`
- `real`: `health`، `status`، `status --json`، `sessions`، `sessions --json`، `tasks --json`، `tasks list --json`، `tasks audit --json`، `agents list --json`، `gateway status`، `gateway status --json`، `gateway health --json`، `config get gateway.port`
- `all`: هر دو پریست

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال، و خلاصه‌های بیشینه RSS برای هر فرمان است. `--cpu-prof-dir` / `--heap-prof-dir` اختیاری، پروفایل‌های V8 را برای هر اجرا می‌نویسد تا زمان‌سنجی و ثبت پروفایل از همان هارنس استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدف‌گذاری‌شده را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را با استفاده از `runs=5` و `warmup=1` در `.artifacts/cli-startup-bench-all.json` می‌نویسد
- `pnpm test:startup:bench:update` fixture مبنای ثبت‌شده در مخزن را با استفاده از `runs=5` و `warmup=1` در `test/fixtures/cli-startup-bench.json` تازه‌سازی می‌کند

fixture ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- با `pnpm test:startup:bench:update` تازه‌سازی کنید
- نتایج فعلی را با `pnpm test:startup:bench:check` با fixture مقایسه کنید

## بنچ راه‌اندازی Gateway

اسکریپت: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

بنچمارک به‌صورت پیش‌فرض از ورودی ساخته‌شده CLI در `dist/entry.js` استفاده می‌کند؛ پیش از استفاده از فرمان‌های package-script، `pnpm build` را اجرا کنید. برای اندازه‌گیری اجراکننده سورس به‌جای آن، `--entry scripts/run-node.mjs` را پاس دهید و آن نتایج را جدا از مبناهای ورودی ساخته‌شده نگه دارید.

نحوه استفاده:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

شناسه‌های case:

- `default`: راه‌اندازی عادی Gateway.
- `skipChannels`: راه‌اندازی Gateway با رد کردن راه‌اندازی کانال.
- `oneInternalHook`: یک هوک داخلی پیکربندی‌شده.
- `allInternalHooks`: همه هوک‌های داخلی.
- `fiftyPlugins`: 50 Plugin مانیفست.
- `fiftyStartupLazyPlugins`: 50 Plugin مانیفست startup-lazy.

خروجی شامل نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان لاگ listen HTTP، زمان لاگ آماده بودن Gateway، زمان CPU، نسبت هسته CPU، بیشینه RSS، heap، متریک‌های ردیابی راه‌اندازی، تأخیر event-loop، و متریک‌های جزئیات جدول جست‌وجوی Plugin است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را در محیط Gateway فرزند فعال می‌کند.

`/healthz` را به‌عنوان زنده‌بودن بخوانید: سرور HTTP می‌تواند پاسخ دهد. `/readyz` را به‌عنوان آمادگی قابل استفاده بخوانید: سایدکارهای Plugin راه‌اندازی، کانال‌ها، و کارهای ready-critical پس از attach پایدار شده‌اند. هوک‌های راه‌اندازی Gateway به‌صورت ناهمگام dispatch می‌شوند و بخشی از تضمین آمادگی نیستند. زمان لاگ آماده بودن، timestamp لاگ آماده بودن داخلی Gateway است؛ برای نسبت‌دهی سمت فرایند مفید است اما جایگزین probe خارجی `/readyz` نیست.

هنگام مقایسه تغییرات از خروجی JSON یا `--output` استفاده کنید. فقط زمانی از `--cpu-prof-dir` استفاده کنید که خروجی ردیابی به import، compile، یا کار محدود به CPU اشاره کند که فقط با زمان‌بندی فازها قابل توضیح نیست. نتایج اجراکننده سورس را با نتایج `dist/entry.js` ساخته‌شده به‌عنوان یک مبنای واحد مقایسه نکنید.

## بنچ restart Gateway

اسکریپت: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

بنچمارک restart فقط روی macOS و Linux پشتیبانی می‌شود. برای restartهای درون‌فرایندی از SIGUSR1 استفاده می‌کند و روی Windows بلافاصله شکست می‌خورد.

بنچمارک به‌صورت پیش‌فرض از ورودی ساخته‌شده CLI در `dist/entry.js` استفاده می‌کند؛ پیش از استفاده از فرمان‌های package-script، `pnpm build` را اجرا کنید. برای اندازه‌گیری اجراکننده سورس به‌جای آن، `--entry scripts/run-node.mjs` را پاس دهید و آن نتایج را جدا از مبناهای ورودی ساخته‌شده نگه دارید.

نحوه استفاده:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

شناسه‌های case:

- `skipChannels`: restart با کانال‌های ردشده.
- `skipChannelsAcpxProbe`: restart با کانال‌های ردشده و probe راه‌اندازی ACPX روشن.
- `skipChannelsNoAcpxProbe`: restart با کانال‌های ردشده و probe راه‌اندازی ACPX خاموش.
- `default`: restart عادی.
- `fiftyPlugins`: restart با 50 Plugin مانیفست.

خروجی شامل `/healthz` بعدی، `/readyz` بعدی، downtime، زمان‌بندی آماده بودن restart، CPU، RSS، متریک‌های ردیابی راه‌اندازی برای فرایند جایگزین، و متریک‌های ردیابی restart برای مدیریت سیگنال، تخلیه کار فعال، فازهای بستن، شروع بعدی، زمان‌بندی آماده بودن، و snapshotهای حافظه است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` و `OPENCLAW_GATEWAY_RESTART_TRACE=1` را در محیط Gateway فرزند فعال می‌کند.

از این بنچمارک زمانی استفاده کنید که تغییری به سیگنال‌دهی restart، close handlerها، startup-after-restart، خاموش‌کردن سایدکار، handoff سرویس، یا آمادگی پس از restart دست می‌زند. هنگام ایزوله کردن مکانیک‌های Gateway از راه‌اندازی کانال، با `skipChannels` شروع کنید. فقط پس از آن‌که case محدود مسیر restart را توضیح داد، از `default` یا caseهای سنگین از نظر Plugin استفاده کنید.

متریک‌های ردیابی سرنخ‌های نسبت‌دهی هستند، نه حکم نهایی. یک تغییر restart باید بر اساس چند نمونه، بازه مالک متناظر، رفتار `/healthz` و `/readyz`، و قرارداد restart قابل مشاهده برای کاربر قضاوت شود.

## Onboarding E2E (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke کانتینری onboarding لازم است.

جریان کامل cold-start در یک کانتینر تمیز Linux:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت wizard تعاملی را از طریق pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## QR import smoke (Docker)

اطمینان می‌دهد helper runtime نگهداری‌شده QR زیر runtimeهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (Node 24 پیش‌فرض، Node 22 سازگار):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست زنده](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
