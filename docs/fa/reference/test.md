---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوه اجرای محلی آزمون‌ها (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمون‌ها
x-i18n:
    generated_at: "2026-05-06T09:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- کیت کامل آزمون (مجموعه‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بسته Plugin: [آزمون به‌روزرسانی‌ها و Plugin](/fa/help/testing-updates-plugins)

- `pnpm test:force`: هر فرایند Gateway باقی‌مانده‌ای را که پورت کنترل پیش‌فرض را نگه داشته باشد می‌کشد، سپس مجموعهٔ کامل Vitest را با یک پورت Gateway ایزوله اجرا می‌کند تا تست‌های سرور با نمونهٔ در حال اجرا تداخل نداشته باشند. وقتی اجرای قبلی Gateway پورت 18789 را اشغال کرده است از این استفاده کنید.
- `pnpm test:coverage`: مجموعهٔ واحد را با پوشش V8 اجرا می‌کند (از طریق `vitest.unit.config.ts`). این یک گیت پوشش مسیر پیش‌فرض واحد است، نه پوشش همهٔ فایل‌های کل مخزن. آستانه‌ها برای خط‌ها/تابع‌ها/دستورها 70% و برای شاخه‌ها 55% هستند. چون `coverage.all` برابر false است و مسیر پیش‌فرض، پوشش را به تست‌های واحد غیرسریع با فایل‌های منبع هم‌نشین محدود می‌کند، گیت به‌جای هر import گذرایی که اتفاقا بارگذاری می‌شود، منبع متعلق به این مسیر را اندازه‌گیری می‌کند.
- `pnpm test:coverage:changed`: پوشش واحد را فقط برای فایل‌هایی اجرا می‌کند که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:changed`: اجرای ارزان تست تغییرات هوشمند. هدف‌های دقیق را از ویرایش مستقیم تست‌ها، فایل‌های هم‌نشین `*.test.ts`، نگاشت‌های صریح منبع و گراف import محلی اجرا می‌کند. تغییرات گسترده/پیکربندی/بسته نادیده گرفته می‌شوند مگر اینکه به تست‌های دقیق نگاشت شوند.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: اجرای صریح و گستردهٔ تست تغییرات. وقتی ویرایش چارچوب تست/پیکربندی/بسته باید به رفتار گسترده‌تر تست تغییرات Vitest برگردد از این استفاده کنید.
- `pnpm changed:lanes`: مسیرهای معماری فعال‌شده توسط diff نسبت به `origin/main` را نشان می‌دهد.
- `pnpm check:changed`: گیت بررسی تغییرات هوشمند را برای diff نسبت به `origin/main` اجرا می‌کند. برای مسیرهای معماری تحت تأثیر، typecheck، lint و فرمان‌های نگهبان را اجرا می‌کند، اما تست‌های Vitest را اجرا نمی‌کند. برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید.
- `pnpm test`: هدف‌های صریح فایل/دایرکتوری را از مسیرهای محدوده‌دار Vitest عبور می‌دهد. اجراهای بدون هدف از گروه‌های شارد ثابت استفاده می‌کنند و برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند؛ گروه extension همیشه به‌جای یک فرایند عظیم پروژهٔ ریشه، به پیکربندی‌های شارد هر extension گسترش می‌یابد.
- اجراهای پوشش تست با خلاصهٔ کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابند. خط مدت‌زمان خود Vitest به‌عنوان جزئیات هر شارد باقی می‌ماند.
- وضعیت تست مشترک OpenClaw: وقتی یک تست به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، fixture پیکربندی، workspace، دایرکتوری agent یا فروشگاه auth-profile ایزوله نیاز دارد، از Vitest از `src/test-utils/openclaw-test-state.ts` استفاده کنید.
- کمک‌کننده‌های E2E فرایند: وقتی یک تست E2E در سطح فرایند Vitest به یک Gateway در حال اجرا، محیط CLI، ضبط log و پاک‌سازی در یک جا نیاز دارد، از `test/helpers/openclaw-test-instance.ts` استفاده کنید.
- کمک‌کننده‌های E2E Docker/Bash: مسیرهایی که `scripts/lib/docker-e2e-image.sh` را source می‌کنند می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به کانتینر بدهند و آن را با `scripts/lib/openclaw-e2e-instance.sh` decode کنند؛ اسکریپت‌های چندخانه‌ای می‌توانند `docker_e2e_test_state_function_b64` را بدهند و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. فراخوان‌های سطح پایین‌تر می‌توانند برای یک snippet پوستهٔ داخل کانتینر از `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>`، یا برای یک فایل محیط host قابل source از `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` استفاده کنند. `--` پیش از `create` باعث می‌شود runtimeهای جدیدتر Node، `--env-file` را به‌عنوان flag Node در نظر نگیرند. مسیرهای Docker/Bash که Gateway راه‌اندازی می‌کنند می‌توانند داخل کانتینر `scripts/lib/openclaw-e2e-instance.sh` را source کنند تا resolution نقطهٔ ورود، راه‌اندازی mock OpenAI، اجرای پیش‌زمینه/پس‌زمینه Gateway، probeهای آمادگی، export محیط وضعیت، dumpهای log و پاک‌سازی فرایند انجام شود.
- اجراهای شارد کامل، extension و include-pattern داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی کل پیکربندی از این زمان‌بندی‌ها برای متعادل‌کردن شاردهای کند و سریع استفاده می‌کنند. شاردهای CI مربوط به include-pattern نام شارد را به کلید زمان‌بندی اضافه می‌کنند، که باعث می‌شود زمان‌بندی شاردهای فیلترشده بدون جایگزین‌کردن داده‌های زمان‌بندی کل پیکربندی قابل مشاهده بماند. برای نادیده‌گرفتن artifact زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.
- فایل‌های تست منتخب `plugin-sdk` و `commands` اکنون از مسیرهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موارد سنگین runtime را روی مسیرهای موجودشان باقی می‌گذارند.
- فایل‌های منبع دارای تست هم‌نشین، پیش از بازگشت به globهای دایرکتوری گسترده‌تر، به همان هم‌نشین نگاشت می‌شوند. ویرایش‌های helper زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers` و `src/plugins/contracts` از گراف import محلی برای اجرای تست‌های importکننده استفاده می‌کنند، به‌جای اینکه وقتی مسیر وابستگی دقیق است همهٔ شاردها را گسترده اجرا کنند.
- `auto-reply` اکنون به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) هم تقسیم می‌شود تا چارچوب reply بر تست‌های سبک‌تر وضعیت/توکن/helper سطح بالا غالب نشود.
- پیکربندی پایهٔ Vitest اکنون به‌صورت پیش‌فرض `pool: "threads"` و `isolate: false` دارد، و runner غیرایزولهٔ مشترک در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels` فایل `vitest.channels.config.ts` را اجرا می‌کند.
- `pnpm test:extensions` و `pnpm test extensions` همهٔ شاردهای extension/Plugin را اجرا می‌کنند. Pluginهای کانال سنگین، Plugin مرورگر و OpenAI به‌عنوان شاردهای اختصاصی اجرا می‌شوند؛ گروه‌های دیگر Plugin به‌صورت دسته‌ای باقی می‌مانند. برای یک مسیر Plugin باندل‌شده از `pnpm test extensions/<id>` استفاده کنید.
- `pnpm test:perf:imports`: گزارش‌دهی مدت‌زمان import و breakdown import در Vitest را فعال می‌کند، درحالی‌که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی محدوده‌دار استفاده می‌کند.
- `pnpm test:perf:imports:changed`: همان profiling مربوط به import است، اما فقط برای فایل‌هایی که از زمان `origin/main` تغییر کرده‌اند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر حالت تغییرات مسیریابی‌شده را در برابر اجرای native پروژهٔ ریشه برای همان diff کامیت‌شدهٔ git benchmark می‌کند.
- `pnpm test:perf:changed:bench -- --worktree` مجموعهٔ تغییرات worktree فعلی را بدون اینکه ابتدا commit شود benchmark می‌کند.
- `pnpm test:perf:profile:main`: یک profile CPU برای thread اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: profileهای CPU + heap برای runner واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی برگ Vitest مربوط به مجموعهٔ کامل را به‌صورت سری اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده به‌همراه artifactهای JSON/log برای هر پیکربندی را می‌نویسد. Test Performance Agent پیش از تلاش برای اصلاح تست‌های کند از این به‌عنوان baseline خود استفاده می‌کند.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: گزارش‌های گروه‌بندی‌شده را پس از یک تغییر متمرکز بر کارایی مقایسه می‌کند.
- یکپارچه‌سازی Gateway: از طریق `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway` به‌صورت opt-in فعال می‌شود.
- `pnpm test:e2e`: تست‌های smoke انتهابه‌انتهای Gateway را اجرا می‌کند (جفت‌سازی چندنمونه‌ای WS/HTTP/node). به‌صورت پیش‌فرض از `threads` + `isolate: false` با workerهای adaptive در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای logهای verbose مقدار `OPENCLAW_E2E_VERBOSE=1` را بگذارید.
- `pnpm test:live`: تست‌های live provider را اجرا می‌کند (minimax/zai). برای خارج‌شدن از حالت skip به کلیدهای API و `LIVE=1` (یا `*_LIVE_TEST=1` مخصوص provider) نیاز دارد.
- `pnpm test:docker:all`: تصویر live-test مشترک را می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند، یک تصویر runner خام Node/Git به‌همراه یک تصویر functional که آن tarball را در `/app` نصب می‌کند می‌سازد/بازاستفاده می‌کند، سپس مسیرهای smoke Docker را با `OPENCLAW_SKIP_DOCKER_BUILD=1` از طریق یک scheduler وزن‌دار اجرا می‌کند. تصویر خام (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) برای مسیرهای installer/update/plugin-dependency استفاده می‌شود؛ آن مسیرها به‌جای استفاده از منبع‌های کپی‌شدهٔ مخزن، tarball ازپیش‌ساخته‌شده را mount می‌کنند. تصویر functional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) برای مسیرهای عملکرد معمول برنامهٔ ساخته‌شده استفاده می‌شود. `scripts/package-openclaw-for-docker.mjs` تنها packer بستهٔ محلی/CI است و پیش از مصرف توسط Docker، tarball به‌همراه `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامهٔ انتخاب‌شده را اجرا می‌کند. `node scripts/test-docker-all.mjs --plan-json` برنامهٔ CI متعلق به scheduler را برای مسیرهای منتخب، نوع‌های تصویر، نیازهای package/live-image، سناریوهای وضعیت و بررسی‌های credential بدون ساختن یا اجرای Docker منتشر می‌کند. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` slotهای فرایند را کنترل می‌کند و مقدار پیش‌فرض آن 10 است؛ `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` pool انتهایی حساس به provider را کنترل می‌کند و مقدار پیش‌فرض آن 10 است. سقف‌های مسیر سنگین به‌صورت پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ سقف‌های provider به‌صورت پیش‌فرض از طریق `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`، `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` به یک مسیر سنگین برای هر provider محدود می‌شوند. برای hostهای بزرگ‌تر از `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` استفاده کنید. اگر یک مسیر روی host با موازی‌سازی پایین از سقف مؤثر وزن یا منبع عبور کند، همچنان می‌تواند از یک pool خالی شروع شود و تا زمانی که ظرفیت را آزاد کند تنها اجرا خواهد شد. شروع مسیرها به‌صورت پیش‌فرض با فاصلهٔ 2 ثانیه انجام می‌شود تا از هجوم create در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` بازنویسی کنید. runner به‌صورت پیش‌فرض Docker را preflight می‌کند، کانتینرهای کهنهٔ OpenClaw E2E را پاک می‌کند، هر 30 ثانیه وضعیت مسیرهای فعال را منتشر می‌کند، cacheهای ابزار CLI provider را بین مسیرهای سازگار به‌اشتراک می‌گذارد، شکست‌های گذرای live-provider را به‌صورت پیش‌فرض یک‌بار retry می‌کند (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، و زمان‌بندی مسیرها را برای مرتب‌سازی طولانی‌تر-اول در اجراهای بعدی در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند. برای چاپ manifest مسیر بدون اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1`، برای تنظیم خروجی وضعیت از `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`، یا برای غیرفعال‌کردن بازاستفادهٔ زمان‌بندی از `OPENCLAW_DOCKER_ALL_TIMINGS=0` استفاده کنید. برای فقط مسیرهای قطعی/محلی از `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` یا برای فقط مسیرهای live-provider از `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` استفاده کنید؛ aliasهای package عبارت‌اند از `pnpm test:docker:local:all` و `pnpm test:docker:live:all`. حالت live-only مسیرهای live اصلی و انتهایی را در یک pool طولانی‌تر-اول ادغام می‌کند تا bucketهای provider بتوانند کارهای Claude، Codex و Gemini را با هم بسته‌بندی کنند. runner پس از نخستین شکست، زمان‌بندی مسیرهای pooled جدید را متوقف می‌کند مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد، و هر مسیر یک timeout fallback 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل بازنویسی است؛ مسیرهای live/tail منتخب سقف‌های سخت‌گیرانه‌تر برای هر مسیر دارند. فرمان‌های راه‌اندازی Docker مربوط به backend CLI، timeout مخصوص خود را از طریق `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` دارند (پیش‌فرض 180). logهای هر مسیر، `summary.json`، `failures.json` و زمان‌بندی‌های phase زیر `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی مسیرهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های rerun هدفمند ارزان از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.
- `pnpm test:docker:browser-cdp-snapshot`: یک کانتینر E2E منبع مبتنی بر Chromium می‌سازد، CDP خام به‌همراه یک Gateway ایزوله را شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند snapshotهای نقش CDP شامل URLهای link، clickables ارتقایافته با cursor، refs iframe و metadata فریم باشند.
- probeهای Docker زندهٔ backend CLI را می‌توان به‌عنوان مسیرهای متمرکز اجرا کرد، برای مثال `pnpm test:docker:live-cli-backend:codex`، `pnpm test:docker:live-cli-backend:codex:resume` یا `pnpm test:docker:live-cli-backend:codex:mcp`. Claude و Gemini aliasهای متناظر `:resume` و `:mcp` دارند.
- `pnpm test:docker:openwebui`: OpenClaw + Open WebUI را در Docker شروع می‌کند، از طریق Open WebUI وارد می‌شود، `/api/models` را بررسی می‌کند، سپس یک chat واقعی proxied را از طریق `/api/chat/completions` اجرا می‌کند. به یک کلید مدل live قابل استفاده نیاز دارد (برای مثال OpenAI در `~/.profile`)، یک تصویر خارجی Open WebUI را pull می‌کند، و انتظار نمی‌رود مانند مجموعه‌های معمول unit/e2e در CI پایدار باشد.
- `pnpm test:docker:mcp-channels`: یک کانتینر Gateway با داده‌های اولیه و یک کانتینر کلاینت دوم را راه‌اندازی می‌کند که `openclaw mcp serve` را اجرا می‌کند، سپس کشف گفت‌وگوی مسیریابی‌شده، خواندن رونوشت‌ها، فرادادهٔ پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و اعلان‌های کانال و مجوز به سبک Claude را از طریق پل واقعی stdio بررسی می‌کند. ادعای اعلان Claude فریم‌های خام MCP در stdio را مستقیماً می‌خواند تا دودآزمایی بازتاب دهد که پل واقعاً چه چیزی منتشر می‌کند.
- `pnpm test:docker:upgrade-survivor`: آرشیو tarball بسته‌بندی‌شدهٔ OpenClaw را روی یک fixture کاربر قدیمی آلوده نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون کلیدهای زندهٔ ارائه‌دهنده یا کانال اجرا می‌کند، سپس یک Gateway حلقه‌بازگشت را راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، فایل‌های workspace/session، وضعیت وابستگی Plugin قدیمی و منسوخ، راه‌اندازی، و وضعیت RPC باقی بمانند.
- `pnpm test:docker:published-upgrade-survivor`: به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را بدون کلیدهای زندهٔ ارائه‌دهنده یا کانال مقداردهی اولیه می‌کند، آن خط مبنا را با یک دستورالعمل آمادهٔ فرمان `openclaw config set` پیکربندی می‌کند، آن نصب منتشرشده را به آرشیو tarball بسته‌بندی‌شدهٔ OpenClaw به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway حلقه‌بازگشت را راه‌اندازی می‌کند و بررسی می‌کند که intentهای پیکربندی‌شده، فایل‌های workspace/session، پیکربندی کهنهٔ Plugin و وضعیت وابستگی قدیمی، راه‌اندازی، `/healthz`، `/readyz`، و وضعیت RPC باقی بمانند یا تمیز ترمیم شوند. یک خط مبنا را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، یک ماتریس محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهید، یا fixtureهای سناریو را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` اضافه کنید؛ مجموعهٔ reported-issues شامل `configured-plugin-installs` است تا بررسی کند Pluginهای خارجی پیکربندی‌شدهٔ OpenClaw هنگام ارتقا به‌صورت خودکار نصب می‌شوند و شامل `stale-source-plugin-shadow` است تا سایه‌های Plugin فقط-منبع باعث خرابی راه‌اندازی نشوند. پذیرش بسته این موارد را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند و توکن‌های خط مبنای متا مانند `last-stable-4` یا `all-since-2026.4.23` را پیش از تحویل مشخصات دقیق بسته به مسیرهای Docker حل می‌کند.
- `pnpm test:docker:update-migration`: harness بازماندهٔ ارتقای منتشرشده را در سناریوی پرپاک‌سازی `plugin-deps-cleanup` اجرا می‌کند و به‌صورت پیش‌فرض از `openclaw@2026.4.23` شروع می‌کند. workflow جداگانهٔ مهاجرت به‌روزرسانی این مسیر را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا هر بستهٔ پایدار منتشرشده از `.23` به بعد به نامزد به‌روزرسانی شود و پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از CI انتشار کامل اثبات کند.
- `pnpm test:docker:plugins`: دودآزمایی نصب/به‌روزرسانی را برای مسیر محلی، `file:`، بسته‌های رجیستری npm با وابستگی‌های hoistشده، ارجاع‌های متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/بازبینی بستهٔ Claude اجرا می‌کند.

## گیت PR محلی

برای بررسی‌های محلی land/gate مربوط به PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار دچار ناپایداری شد، پیش از اینکه آن را یک پسرفت در نظر بگیرید یک بار دیگر اجرا کنید، سپس با `pnpm test <path/to/test>` آن را ایزوله کنید. برای میزبان‌هایی با محدودیت حافظه، استفاده کنید از:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## بنچ تأخیر مدل (کلیدهای محلی)

اسکریپت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

نحوه استفاده:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- پرامپت پیش‌فرض: "با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی."

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

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: هر دو پیش‌تنظیم

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع exit-code/signal، و خلاصه‌های بیشینه RSS برای هر فرمان است. گزینه‌های اختیاری `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند تا زمان‌سنجی و ثبت پروفایل از همان harness استفاده کنند.

قراردادهای خروجی ذخیره‌شده:

- `pnpm test:startup:bench:smoke` آرتیفکت smoke هدف‌گذاری‌شده را در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد
- `pnpm test:startup:bench:save` آرتیفکت مجموعه کامل را در `.artifacts/cli-startup-bench-all.json` با استفاده از `runs=5` و `warmup=1` می‌نویسد
- `pnpm test:startup:bench:update` fixture مبنای ثبت‌شده در مخزن را در `test/fixtures/cli-startup-bench.json` با استفاده از `runs=5` و `warmup=1` تازه‌سازی می‌کند

fixture ثبت‌شده در مخزن:

- `test/fixtures/cli-startup-bench.json`
- تازه‌سازی با `pnpm test:startup:bench:update`
- مقایسه نتایج فعلی با fixture با `pnpm test:startup:bench:check`

## E2E راه‌اندازی اولیه (Docker)

Docker اختیاری است؛ این فقط برای تست‌های smoke راه‌اندازی اولیه کانتینری لازم است.

جریان cold-start کامل در یک کانتینر Linux تمیز:

```bash
scripts/e2e/onboard-docker.sh
```

این اسکریپت wizard تعاملی را از طریق یک pseudo-tty هدایت می‌کند، فایل‌های config/workspace/session را تأیید می‌کند، سپس Gateway را شروع می‌کند و `openclaw health` را اجرا می‌کند.

## smoke واردکردن QR (Docker)

اطمینان می‌دهد helper نگهداری‌شده runtime QR زیر runtimeهای Docker Node پشتیبانی‌شده بارگذاری می‌شود (پیش‌فرض Node 24، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [تست](/fa/help/testing)
- [تست زنده](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
