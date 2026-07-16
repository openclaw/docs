---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوه اجرای محلی آزمون‌ها (vitest) و زمان استفاده از حالت‌های force/coverage
title: آزمایش‌ها
x-i18n:
    generated_at: "2026-07-16T17:45:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- مجموعهٔ کامل آزمون (مجموعه‌آزمون‌ها، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بستهٔ Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

## پیش‌فرض عامل

نشست‌های عامل فقط برای منبع مورداعتماد و هنگامی‌که نصب وابستگی‌های موجود
آماده است، یک یا چند آزمون متمرکز و بررسی‌های ایستای کم‌هزینه را به‌صورت محلی
اجرا می‌کنند. هرگز ابزارهای مخزن نامطمئن را به‌صورت محلی اجرا نکنید. مجموعه‌آزمون‌های
بزرگ‌تر، گیت‌های تغییرکرده با توزیع گستردهٔ بررسی نوع/لینت، ساخت‌ها، Docker،
مسیرهای بسته، E2E، اثبات زنده و اعتبارسنجی چندسکویی از راه دور و از طریق
Crabbox اجرا می‌شوند. اثبات سنگین نگه‌دارندگان مورداعتماد به‌طور پیش‌فرض از
Blacksmith Testbox استفاده می‌کند. گردش‌کار پیکربندی‌شدهٔ Testbox اعتبارنامه‌ها
را بارگذاری می‌کند؛ بنابراین کد مشارکت‌کنندگان نامطمئن یا فورک‌ها باید به‌جای آن
از CI فورک بدون اسرار یا AWS Crabbox مستقیم و پاک‌سازی‌شده استفاده کند.

برای کارهای پیش‌بینی‌شده از قبل گرم‌سازی نکنید. هنگامی‌که نخستین فرمان سنگین
آماده شد، بک‌اند را به‌صورت تنبل دریافت کنید، شناسهٔ `tbx_...` بازگردانده‌شده را برای فرمان‌های
سنگین بعدی دوباره به‌کار ببرید، در هر اجرا وارسی فعلی را همگام‌سازی کنید و پیش
از تحویل آن را متوقف کنید.

پس از نخستین استفادهٔ مجدد موفق، پوشش‌دهنده اثرانگشت مبنا، وابستگی و گردش‌کار
Testbox اجاره را در `.crabbox/testbox-leases/` ثبت می‌کند.
ویرایش‌های صرفاً منبعی همچنان از جعبهٔ گرم‌شده استفاده می‌کنند. تغییر در مبنای ادغام،
فایل قفل، ورودی مدیر بسته، پوشش‌دهنده یا گردش‌کار Testbox به‌صورت بسته شکست
می‌خورد و به اجاره‌ای تازه نیاز دارد. هر اجرا همچنان وارسی فعلی را همگام‌سازی می‌کند.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` فقط برای عیب‌یابی عمدی است، نه
اثبات انتشار.

فرمان‌های آزمون محلی زیر برای گردش‌کارهای انسانی و اثبات محدود عامل هستند.
در دسترس نبودن ارائه‌دهندهٔ راه دور باید گزارش شود؛ این وضعیت مجوز اجرای
بی‌سروصدای یک گیت محلی گسترده نیست.

برای اثبات سنگین نامطمئن، با `--provider aws` به‌صورت تنبل گرم‌سازی کنید. هر اجرا باید
`CRABBOX_ENV_ALLOW=CI` را تنظیم کند، `--provider aws --no-hydrate` را ارسال کند و پیش از
نصب وابستگی‌ها یا اجرای آزمون‌ها از یک `HOME` موقت و تازهٔ راه دور استفاده کند.
از اجاره‌ای تازه‌گرم‌شده و اختصاص‌یافته به همان منبع نامطمئن استفاده کنید؛ هرگز
اجارهٔ مورداعتماد یا قبلاً بارگذاری‌شده با اعتبارنامه را دوباره به‌کار نبرید. یک
باینری Crabbox نصب‌شده و مورداعتماد را از وارسی پاک و مورداعتماد `main` اجرا کنید و
فقط PR راه دور را با `--fresh-pr` دریافت کنید؛ هرگز پوشش‌دهنده یا پیکربندی
وارسی نامطمئن را به‌صورت محلی اجرا نکنید.
`CRABBOX_AWS_INSTANCE_PROFILE` را لغو تنظیم کنید و مگر آنکه
`aws.instanceProfile` حل‌شده خالی باشد، به‌صورت بسته شکست بخورید. پیش از هر
نصب/آزمون، با ابزارهای مورداعتماد دارای مسیر مطلق، وجود توکن IMDSv2 را الزامی
کنید، ثابت کنید نقطهٔ پایانی اعتبارنامه‌های IAM مقدار 404 را بازمی‌گرداند و تأیید
کنید `git rev-parse HEAD` راه دور برابر با SHA کامل سر PR بررسی‌شده است.
اجاره را به آن SHA مقید کنید و با تغییر سر، آن را متوقف و دوباره گرم کنید.
`scripts/crabbox-untrusted-bootstrap.sh` مورداعتماد را از
`main` پاک، همراه با `--fresh-pr` بارگذاری کنید؛ این اسکریپت Node/pnpm سنجاق‌شده را نصب می‌کند،
SHA و سنجاق مدیر بسته را تأیید می‌کند، `HOME` را ایزوله می‌کند، وابستگی‌ها را نصب
می‌کند و سپس آزمون درخواستی را اجرا می‌کند. اگر کارگزار نتواند نبود نقش یا وجود
نداشتن PR راه دور را ثابت کند، از CI فورک بدون اسرار استفاده کنید. از
`hydrate-github`، `--no-sync` یا گردش‌کار Testbox بارگذاری‌شده با
اعتبارنامه استفاده نکنید.
همهٔ بازنویسی‌های `CRABBOX_TAILSCALE*` را لغو تنظیم کنید، `--network public
--tailscale=false` را اجباری کنید، پرچم‌های گرهٔ خروجی/LAN را پاک کنید و پیش از بارگذاری هر اسکریپت، از `crabbox inspect` بخواهید
شبکه‌سازی عمومی بدون وضعیت Tailscale را گزارش کند.

## ترتیب معمول محلی

1. `pnpm test:changed` برای اثبات Vitest با دامنهٔ تغییرکرده.
2. `pnpm test <path-or-filter>` برای یک فایل، دایرکتوری یا هدف صریح.
3. `pnpm test` فقط هنگامی‌که عمداً به مجموعهٔ کامل محلی Vitest نیاز دارید.

در یک درخت‌کاری Codex یا وارسی پیوندی/تنک، عامل‌ها از اجرای مستقیم محلی
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` پرهیز می‌کنند:

- اثبات متمرکز محدود با وابستگی‌های آماده:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- بررسی تغییرکرده با طبقه‌بندی مقدم: `node scripts/check-changed.mjs`؛ برنامه‌های صرفاً مستندات،
  بدون تغییر و فرادادهٔ کوچک، هنگامی‌که وابستگی‌ها آماده باشند محلی می‌مانند،
  درحالی‌که برنامه‌های سنگین یا فاقد وابستگی به Testbox واگذار می‌شوند.
- اثبات گستردهٔ صریح با اجارهٔ نگه‌داشته‌شده: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` تا pnpm درون Testbox اجرا شود.
- `exitCode` نهایی پوشش‌دهنده و JSON زمان‌بندی، نتیجهٔ فرمان هستند. اجرای واگذارشدهٔ Blacksmith GitHub Actions ممکن است پس از یک فرمان موفق SSH مقدار `cancelled` را نشان دهد، زیرا Testbox از بیرون کنش زنده‌نگه‌دارنده متوقف می‌شود؛ پیش از تلقی آن به‌عنوان شکست، خلاصهٔ پوشش‌دهنده و خروجی فرمان را بررسی کنید.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: سریال‌سازی بررسی سنگین را برای فرمان‌هایی مانند `pnpm check:changed` و `pnpm test ...` هدف‌گذاری‌شده، به‌جای دایرکتوری مشترک Git در درخت‌کاری فعلی نگه می‌دارد. فقط زمانی از آن در میزبان‌های محلی پرظرفیت استفاده کنید که عمداً بررسی‌های مستقلی را در چند درخت‌کاری پیوندی اجرا می‌کنید.

## فرمان‌های اصلی

اجرای پوشش‌دهندهٔ آزمون با خلاصهٔ کوتاه `[test] passed|failed|skipped ... in ...` پایان می‌یابد؛ خط مدت‌زمان خود Vitest جزئیات هر شارد باقی می‌ماند.

| فرمان                                             | کاری که انجام می‌دهد                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | هدف‌های صریح فایل/دایرکتوری از مسیرهای محدوده‌بندی‌شدهٔ Vitest عبور می‌کنند. اجراهای بدون هدف، اثبات مجموعهٔ کامل هستند: گروه‌های شارد ثابت برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند و توزیع گستردهٔ موردانتظار شارد پیش از شروع چاپ می‌شود. گروه افزونه همیشه به‌جای یک فرایند عظیم پروژهٔ ریشه، به پیکربندی‌های شارد جداگانه برای هر افزونه گسترش می‌یابد. |
| `pnpm test:changed`                               | اجرای هوشمند و کم‌هزینهٔ آزمون‌های تغییرکرده: هدف‌های دقیق از ویرایش مستقیم آزمون، فایل‌های همتای `*.test.ts`، نگاشت‌های صریح منبع و گراف واردسازی محلی. تغییرات گسترده/پیکربندی/بسته، مگر اینکه به آزمون‌های دقیقی نگاشت شوند، نادیده گرفته می‌شوند.                                                                                                                  |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | اجرای گسترده و صریح آزمون‌های تغییرکرده؛ هنگامی استفاده کنید که ویرایش مهار آزمون/پیکربندی/بسته باید به رفتار گسترده‌تر آزمون تغییرکردهٔ Vitest بازگردد.                                                                                                                                                                                                           |
| `pnpm test:force`                                 | درگاه پیکربندی‌شدهٔ Gateway متعلق به OpenClaw را آزاد می‌کند (پیش‌فرض `18789`)، سپس مجموعهٔ کامل را با درگاه Gateway ایزوله اجرا می‌کند تا آزمون‌های سرور با نمونهٔ درحال‌اجرا تداخل نکنند.                                                                                                                                                                  |
| `pnpm test:coverage`                              | گزارش پوشش اطلاعاتی V8 را برای مسیر واحد پیش‌فرض (`vitest.unit.config.ts`) تولید می‌کند؛ هیچ آستانهٔ پوششی اعمال نمی‌شود.                                                                                                                                                                                                                                        |
| `pnpm test:coverage:changed`                      | پوشش واحد فقط برای فایل‌هایی که از `origin/main` به بعد تغییر کرده‌اند.                                                                                                                                                                                                                                                                                          |
| `pnpm changed:lanes`                              | مسیرهای معماری فعال‌شده با تفاوت نسبت به `origin/main` را نشان می‌دهد.                                                                                                                                                                                                                                                                                           |
| `pnpm check:changed`                              | پیش از انتخاب اجرا، مسیرهای تغییرکرده را طبقه‌بندی می‌کند. برنامه‌های صرفاً مستندات، بدون تغییر و فرادادهٔ کوچک هنگامی‌که وابستگی‌ها آماده باشند محلی می‌مانند؛ برنامه‌های دارای توزیع گستردهٔ بررسی نوع/لینت، سایر مسیرهای سنگین یا وابستگی‌های محلی مفقود، بیرون از CI به Crabbox/Testbox واگذار می‌شوند. Vitest را اجرا نمی‌کند؛ برای اثبات آزمون از `pnpm test:changed` یا `pnpm test <target>` استفاده کنید. |

## وضعیت مشترک آزمون و یاریگرهای فرایند

- `src/test-utils/openclaw-test-state.ts`: هنگامی از Vitest استفاده کنید که آزمونی به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، فیکسچر پیکربندی، فضای کاری، دایرکتوری عامل یا مخزن پروفایل احراز هویت ایزوله نیاز دارد.
- `pnpm test:env-mutations:report`: گزارش غیرمسدودکنندهٔ آزمون‌ها/مهارهایی که `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_WORKSPACE_DIR` یا کلیدهای محیطی مرتبط را مستقیماً تغییر می‌دهند. از آن برای یافتن نامزدهای مهاجرت به یاریگر وضعیت مشترک آزمون استفاده کنید.
- `test/helpers/openclaw-test-instance.ts`: آزمون‌های E2E سطح فرایند که به Gateway درحال‌اجرا، محیط CLI، ثبت گزارش و پاک‌سازی در یک مکان نیاز دارند.
- مسیرهای E2E مربوط به Docker/Bash که `scripts/lib/docker-e2e-image.sh` را منبع‌گذاری می‌کنند، می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به کانتینر ارسال و با `scripts/lib/openclaw-e2e-instance.sh` رمزگشایی کنند؛ اسکریپت‌های چندخانه‌ای می‌توانند `docker_e2e_test_state_function_b64` را ارسال و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` یک فایل محیط میزبان قابل منبع‌گذاری می‌نویسد (وجود `--` پیش از `create` مانع می‌شود زمان‌اجرای جدیدتر Node، `--env-file` را پرچم Node تلقی کند). مسیرهایی که Gateway راه‌اندازی می‌کنند می‌توانند `scripts/lib/openclaw-e2e-instance.sh` را برای تفکیک نقطهٔ ورود، راه‌اندازی آزمایشی OpenAI، اجرای پیش‌زمینه/پس‌زمینه، کاوش‌های آمادگی، برون‌بری محیط وضعیت، تخلیهٔ گزارش‌ها و پاک‌سازی فرایند منبع‌گذاری کنند.

## مسیرهای رابط کنترل، TUI و افزونه

- **E2E شبیه‌سازی‌شدهٔ رابط کنترل:** `pnpm test:ui:e2e` مسیر Vitest + Playwright را اجرا می‌کند که رابط کنترل Vite را راه‌اندازی می‌کند و یک صفحهٔ واقعی Chromium را در برابر WebSocket شبیه‌سازی‌شدهٔ Gateway هدایت می‌کند. آزمون‌ها در `ui/src/**/*.e2e.test.ts` قرار دارند؛ شبیه‌سازی‌ها/کنترل‌های مشترک در `ui/src/test-helpers/control-ui-e2e.ts` قرار دارند. `pnpm test:e2e` این مسیر را شامل می‌شود. اجرای عامل‌ها، از جمله اثبات هدفمند، به‌طور پیش‌فرض از Testbox/Crabbox استفاده می‌کند؛ از `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` فقط برای بازگشت صریح به اجرای محلی استفاده کنید.
- **آزمون‌های PTY در TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` مسیر سریع PTY با بک‌اند جعلی را اجرا می‌کند. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` یا `pnpm tui:pty:test:watch --mode local` آزمون دود کندتر `tui --local` را اجرا می‌کند که فقط نقطهٔ پایانی مدل خارجی را شبیه‌سازی می‌کند. متن قابل‌مشاهدهٔ پایدار یا فراخوانی‌های فیکسچر را بررسی کنید، نه اسنپ‌شات‌های خام ANSI.
- `pnpm test:extensions` و `pnpm test extensions` همهٔ شاردهای افزونه/Plugin را اجرا می‌کنند. Pluginهای سنگین کانال، Plugin مرورگر و OpenAI به‌صورت شاردهای اختصاصی اجرا می‌شوند؛ سایر گروه‌های Plugin به‌صورت دسته‌ای باقی می‌مانند. `pnpm test extensions/<id>` یک مسیر Plugin همراه را اجرا می‌کند.
- فایل‌های منبعی که آزمون هم‌جوار دارند، پیش از بازگشت به گلوب‌های گسترده‌تر پوشه، به همان آزمون هم‌جوار نگاشت می‌شوند. ویرایش‌های ابزارهای کمکی در `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers` و `src/plugins/contracts` از یک گراف واردسازی محلی برای اجرای آزمون‌های واردکننده استفاده می‌کنند، به‌جای اینکه وقتی مسیر وابستگی دقیق است، همهٔ شاردها را به‌طور گسترده اجرا کنند.
- هدف‌های پوشهٔ قرارداد به مسیرهای قراردادی خود منشعب می‌شوند: `pnpm test src/channels/plugins/contracts` چهار پیکربندی قرارداد کانال را اجرا می‌کند و `pnpm test src/plugins/contracts` پیکربندی قراردادهای Plugin را اجرا می‌کند، زیرا پروژه‌های عمومی `channels`/`plugins`، `contracts/**` را مستثنا می‌کنند.
- `auto-reply` به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا هارنس پاسخ بر آزمون‌های سبک‌تر سطح‌بالای وضعیت/توکن/ابزار کمکی غلبه نکند.
- فایل‌های آزمون منتخب `plugin-sdk` و `commands` از مسیرهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موارد سنگین از نظر زمان اجرا را در مسیرهای موجودشان باقی می‌گذارند.
- پیکربندی پایهٔ Vitest به‌طور پیش‌فرض از `pool: "threads"` و `isolate: false` استفاده می‌کند و اجراکنندهٔ مشترکِ غیرایزوله در سراسر پیکربندی‌های مخزن فعال است.
- `pnpm test:channels`، `vitest.channels.config.ts` را اجرا می‌کند.

## Gateway و E2E

- یکپارچه‌سازی Gateway انتخابی است: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: مجموعهٔ E2E مخزن = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: آزمون‌های دود سرتاسری Gateway (جفت‌سازی چندنمونه‌ای WS/HTTP/Node). به‌طور پیش‌فرض از `threads` + `isolate: false` با workerهای تطبیقی در `vitest.e2e.config.ts` استفاده می‌کند؛ تنظیم با `OPENCLAW_E2E_WORKERS=<n>` و گزارش‌های مفصل با `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: آزمون‌های زندهٔ ارائه‌دهنده (Claude/Minimax/DeepSeek/z.ai/و غیره، با کنترل `*.live.test.ts`). برای لغو پرش، به کلیدهای API و `LIVE=1` (یا `OPENCLAW_LIVE_TEST=1`) نیاز دارد؛ خروجی مفصل با `OPENCLAW_LIVE_TEST_QUIET=0`.

## مجموعهٔ کامل Docker (`pnpm test:docker:all`)

تصویر مشترک آزمون زنده را می‌سازد، OpenClaw را یک‌بار به‌صورت tarball در npm بسته‌بندی می‌کند، یک تصویر اجراکنندهٔ سادهٔ Node/Git و یک تصویر عملیاتی را که آن tarball را در `/app` نصب می‌کند می‌سازد/دوباره استفاده می‌کند، سپس مسیرهای دود Docker را از طریق یک زمان‌بند وزن‌دار اجرا می‌کند. `scripts/package-openclaw-for-docker.mjs` تنها بسته‌بند محلی/CI است و پیش از مصرف توسط Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند.

- تصویر ساده (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): مسیرهای نصب‌کننده/به‌روزرسانی/وابستگی Plugin؛ به‌جای منابع کپی‌شدهٔ مخزن، tarball ازپیش‌ساخته‌شده را mount می‌کند.
- تصویر عملیاتی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): مسیرهای عادی عملکرد برنامهٔ ساخته‌شده.
- تعریف مسیرها: `scripts/lib/docker-e2e-scenarios.mjs`. برنامه‌ریز: `scripts/lib/docker-e2e-plan.mjs`. اجراکننده: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` برنامهٔ CI تحت مالکیت زمان‌بند (مسیرها، انواع تصویر، نیازهای بسته/تصویر زنده، سناریوهای وضعیت، بررسی اعتبارنامه‌ها) را بدون ساخت یا اجرای Docker تولید می‌کند.

گزینه‌های تنظیم زمان‌بندی (متغیرهای محیطی، مقادیر پیش‌فرض داخل پرانتز):

| متغیر محیطی                                                                                                     | پیش‌فرض            | هدف                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | جایگاه‌های پردازش.                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | مخزن انتهایی حساس به ارائه‌دهنده.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | سقف مسیر سنگین ارائه‌دهندهٔ زنده.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | سقف مسیر منابع npm.                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | سقف مسیر منابع سرویس.                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | سقف مسیرهای سنگین برای هر ارائه‌دهنده.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | سقف‌های محدودتر برای هر ارائه‌دهنده.                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | بازنویسی برای میزبان‌های بزرگ‌تر.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | تأخیر میان شروع مسیرها؛ از هجوم ایجاد در دیمن محلی Docker جلوگیری می‌کند.                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 دقیقه) | مهلت بازگشتی هر مسیر؛ مسیرهای زنده/انتهایی منتخب از سقف‌های سخت‌گیرانه‌تری استفاده می‌کنند.                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | تلاش‌های مجدد برای خطاهای گذرای ارائه‌دهندهٔ زنده.                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | خاموش               | مانیفست مسیر را بدون اجرای Docker چاپ می‌کند.                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | فاصلهٔ چاپ وضعیت مسیر فعال.                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | روشن                | برای ترتیب‌دهی از طولانی‌ترین به کوتاه‌ترین، از `.artifacts/docker-tests/lane-timings.json` دوباره استفاده می‌کند؛ برای غیرفعال‌سازی روی `0` تنظیم کنید.                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` فقط برای مسیرهای قطعی/محلی، `only` فقط برای مسیرهای ارائه‌دهندهٔ زنده. نام‌های مستعار: `pnpm test:docker:local:all`، `pnpm test:docker:live:all`. حالت فقط زنده، مسیرهای زندهٔ اصلی و انتهایی را در یک مخزن با ترتیب طولانی‌ترین به کوتاه‌ترین ادغام می‌کند تا سطل‌های ارائه‌دهنده کارهای Claude/Codex/Gemini را با هم بسته‌بندی کنند. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | مهلت راه‌اندازی Docker برای بک‌اند CLI.                                                                                                                                                                                                                                                    |

الگوی متغیر محیطی برای سقف منابع `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` است (نام منبع با حروف بزرگ و نویسه‌های غیرالفبایی‌عددی که به `_` تبدیل شده‌اند).

سایر رفتارها: اجراکننده به‌طور پیش‌فرض Docker را پیش‌بررسی می‌کند، کانتینرهای قدیمی E2E مربوط به OpenClaw را پاک‌سازی می‌کند، حافظه‌های نهان ابزار CLI ارائه‌دهنده را میان مسیرهای سازگار به اشتراک می‌گذارد و پس از نخستین شکست، زمان‌بندی مسیرهای تجمیع‌شده جدید را متوقف می‌کند، مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد. اگر یک مسیر در میزبانی با موازی‌سازی کم از سقف مؤثر وزن/منبع فراتر رود، همچنان می‌تواند از یک مخزن خالی شروع شود و تا زمان آزادسازی ظرفیت به‌تنهایی اجرا شود. گزارش‌های هر مسیر، `summary.json`، `failures.json` و زمان‌بندی مراحل در `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی مسیرهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های کم‌هزینه اجرای مجدد هدفمند از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.

### مسیرهای شاخص Docker

| فرمان                                                                     | موارد بررسی‌شده                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | کانتینر E2E مبدأ مبتنی بر Chromium با CDP خام و Gateway ایزوله؛ نماهای لحظه‌ای نقش CDP در `browser doctor --deep` شامل URL پیوندها، عناصر قابل‌کلیکی که نشانگر ماوس روی آن‌ها قرار گرفته است، ارجاع‌های iframe و فراداده فریم هستند.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | بسته tar فشرده‌شده را با `skills.install.allowUploadedArchives: false` در یک اجراکننده Docker خالی نصب می‌کند، یک نامک مهارت فعلی را از جست‌وجوی زنده ClawHub پیدا می‌کند، آن را از طریق `openclaw skills install` نصب می‌کند و `SKILL.md`، `.clawhub/origin.json`، `.clawhub/lock.json` و `skills info --json` را بررسی می‌کند.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | کاوش‌های زنده و متمرکز پشتیبان CLI؛ Gemini دارای نام‌های مستعار متناظر `:resume` و `:mcp` است.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw و Open WebUI کانتینری‌شده: ورود به سیستم، بررسی `/api/models` و اجرای یک گفت‌وگوی واقعی پروکسی‌شده از طریق `/api/chat/completions`. به یک کلید مدل زنده قابل‌استفاده نیاز دارد و یک تصویر خارجی را دریافت می‌کند؛ برخلاف مجموعه‌های واحد/e2e، انتظار نمی‌رود در CI پایدار باشد.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | کانتینر Gateway با داده اولیه به‌همراه یک کانتینر کارخواه که `openclaw mcp serve` را ایجاد می‌کند: کشف هدایت‌شده مکالمه، خواندن رونوشت‌ها، فراداده پیوست‌ها، رفتار صف رویداد زنده، مسیریابی ارسال خروجی و اعلان‌های کانال و مجوز به‌سبک Claude از طریق پل واقعی stdio (ادعاها فریم‌های خام stdio مربوط به MCP را مستقیماً می‌خوانند).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | بسته tar فشرده‌شده را روی یک نمونه قدیمی و دست‌کاری‌شده کاربر نصب می‌کند، به‌روزرسانی بسته و سپس doctor غیرتعاملی را بدون کلیدهای زنده ارائه‌دهنده/کانال اجرا می‌کند، یک Gateway بازگشتی راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها/پیکربندی کانال/فهرست‌های مجاز Plugin/فضای کاری/فایل‌های نشست/وضعیت قدیمی وابستگی Plugin منسوخ/راه‌اندازی/وضعیت RPC حفظ شوند.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را مقداردهی اولیه می‌کند، از طریق دستورالعمل تعبیه‌شده `openclaw config set` پیکربندی می‌کند، به بسته tar فشرده‌شده به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد و `/healthz`، `/readyz` و وضعیت RPC را بررسی می‌کند. با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` یک ماتریس را گسترش دهید یا با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` نمونه‌های سناریو را اضافه کنید (شامل `configured-plugin-installs` و `stale-source-plugin-shadow`). پذیرش بسته این موارد را به‌صورت `published_upgrade_survivor_baseline(s)` / `_scenarios` ارائه می‌دهد و توکن‌های فرا مانند `last-stable-4` یا `all-since-2026.4.23` را تفکیک می‌کند. |
| `pnpm test:docker:update-migration`                                         | چارچوب آزمایشی حفظ وضعیت پس از ارتقای منتشرشده در سناریوی `plugin-deps-cleanup` که به‌طور پیش‌فرض از `openclaw@2026.4.23` آغاز می‌شود. گردش‌کار `Update Migration` این مورد را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از CI انتشار کامل اثبات کند.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، بسته‌های رجیستری npm با وابستگی‌های بالاکشیده‌شده، ارجاع‌های متحرک git، نمونه‌های ClawHub، به‌روزرسانی‌های بازارگاه و فعال‌سازی/بازرسی بسته Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## دروازه محلی PR

برای بررسی‌های محلی فرود/دروازه PR، اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی یک میزبان پربار دچار شکست ناپایدار شد، پیش از درنظرگرفتن آن به‌عنوان پس‌رفت، یک‌بار دیگر اجرا کنید و سپس با `pnpm test <path/to/test>` آن را ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## ابزارهای کارایی آزمون

- `pnpm test:perf:imports`: گزارش مدت واردسازی و تفکیک واردسازی Vitest را فعال می‌کند، درحالی‌که همچنان برای هدف‌های صریح فایل/دایرکتوری از مسیریابی محدودشده مسیر استفاده می‌کند. `pnpm test:perf:imports:changed` همین پروفایل‌سازی را به فایل‌های تغییرکرده از زمان `origin/main` محدود می‌کند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر حالت تغییرکرده هدایت‌شده را در برابر اجرای بومی پروژه ریشه برای همان تفاوت ثبت‌شده git بنچمارک می‌کند؛ `pnpm test:perf:changed:bench -- --worktree` مجموعه تغییرات فعلی درخت کاری را بدون ثبت قبلی بنچمارک می‌کند.
- `pnpm test:perf:profile:main` یک پروفایل CPU برای رشته اصلی Vitest می‌نویسد (`.artifacts/vitest-main-profile`)؛ `pnpm test:perf:profile:runner` پروفایل‌های CPU و heap را برای اجراکننده آزمون واحد می‌نویسد (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: هر پیکربندی نهایی Vitest در مجموعه کامل را به‌صورت ترتیبی اجرا می‌کند و داده‌های مدت گروه‌بندی‌شده را همراه با مصنوعات JSON/گزارش هر پیکربندی می‌نویسد. گزارش‌های مجموعه کامل به‌طور پیش‌فرض فایل‌ها را ایزوله می‌کنند تا گراف‌های ماژول نگه‌داری‌شده و توقف‌های GC از فایل‌های قبلی به ادعاهای بعدی منظور نشوند؛ فقط هنگامی که عمداً انباشت کارگر مشترک را پروفایل می‌کنید، `-- --no-isolate` را ارسال کنید. عامل کارایی آزمون پیش از تلاش برای رفع آزمون‌های کند، از این مورد به‌عنوان خط مبنا استفاده می‌کند. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` گزارش‌های گروه‌بندی‌شده پس از یک تغییر متمرکز بر کارایی را مقایسه می‌کند.
- اجراهای شارد مجموعه کامل، افزونه و الگوی شامل، داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدی کل پیکربندی از این زمان‌بندی‌ها برای متعادل‌سازی شاردهای کند و سریع استفاده می‌کنند. شاردهای CI با الگوی شامل، نام شارد را به کلید زمان‌بندی می‌افزایند؛ بنابراین زمان‌بندی شاردهای فیلترشده بدون جایگزینی داده‌های زمان‌بندی کل پیکربندی قابل‌مشاهده باقی می‌ماند. برای نادیده‌گرفتن مصنوع زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.

## بنچمارک‌ها

<Accordion title="تأخیر مدل (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`. پرامپت پیش‌فرض: «با یک واژه پاسخ دهید: ok. بدون نشانه‌گذاری یا متن اضافی.»

</Accordion>

<Accordion title="راه‌اندازی CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

پیش‌تنظیم‌ها:

- `startup`: `--version`، `--help`، `health`، `health --json`، `status --json`، `status`
- `real`: `health`، `status`، `status --json`، `sessions`، `sessions --json`، `tasks --json`، `tasks list --json`، `tasks audit --json`، `agents list --json`، `gateway status`، `gateway status --json`، `gateway health --json`، `config get gateway.port`
- `all`: ترکیب هر دو پیش‌تنظیم

خروجی شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال و بیشینه RSS برای هر فرمان است. `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند.

خروجی ذخیره‌شده: `pnpm test:startup:bench:smoke` فایل `.artifacts/cli-startup-bench-smoke.json` را می‌نویسد؛ `pnpm test:startup:bench:save` فایل `.artifacts/cli-startup-bench-all.json` را می‌نویسد (`runs=5 warmup=1`). فیکسچر ثبت‌شده در مخزن: `test/fixtures/cli-startup-bench.json`، که با `pnpm test:startup:bench:update` تازه‌سازی و با `pnpm test:startup:bench:check` مقایسه می‌شود.

</Accordion>

<Accordion title="راه‌اندازی Gateway (scripts/bench-gateway-startup.ts)">

به‌طور پیش‌فرض از ورودی CLI ساخته‌شده در `dist/entry.js` استفاده می‌کند؛ ابتدا `pnpm build` را اجرا کنید. برای اندازه‌گیری اجراکنندهٔ منبع، به‌جای آن `--entry scripts/run-node.mjs` را ارسال کنید و نتایجش را از خط‌مبناهای ورودی ساخته‌شده جدا نگه دارید.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

شناسه‌های حالت: `default`، `skipChannels` (راه‌اندازی کانال نادیده گرفته می‌شود)، `oneInternalHook`، `allInternalHooks`، `fiftyPlugins` (50 Plugin مانیفست)، `fiftyStartupLazyPlugins` (50 Plugin مانیفست با بارگذاری تنبل هنگام راه‌اندازی).

خروجی شامل نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان ثبت گوش‌دادن HTTP، زمان ثبت آماده‌شدن Gateway، زمان CPU، نسبت هستهٔ CPU، بیشینه RSS، heap، معیارهای ردگیری راه‌اندازی، تأخیر حلقهٔ رویداد و معیارهای جزئی جدول جست‌وجوی Plugin است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را در محیط Gateway فرزند تنظیم می‌کند.

`/healthz` نشان‌دهندهٔ زنده‌بودن است (سرور HTTP می‌تواند پاسخ دهد). `/readyz` نشان‌دهندهٔ آمادگی قابل‌استفاده است (sidecarهای Plugin راه‌اندازی، کانال‌ها و کارهای پس از اتصال که برای آمادگی حیاتی‌اند، پایدار شده‌اند). هوک‌های راه‌اندازی به‌صورت ناهمگام اعزام می‌شوند و بخشی از تضمین آمادگی نیستند. زمان ثبت آمادگی، مُهر زمانی داخلی Gateway است که برای انتساب در سمت فرایند مفید است، اما جایگزین کاوش خارجی `/readyz` نیست.

هنگام مقایسهٔ تغییرات، از خروجی JSON یا `--output` استفاده کنید. تنها زمانی از `--cpu-prof-dir` استفاده کنید که خروجی ردگیری به کارهای import، کامپایل یا پردازش‌های وابسته به CPU اشاره کند که زمان‌بندی مراحل به‌تنهایی قادر به توضیح آن‌ها نیست.

</Accordion>

<Accordion title="راه‌اندازی مجدد Gateway (scripts/bench-gateway-restart.ts)">

فقط macOS و Linux (برای راه‌اندازی مجدد درون‌فرایندی از SIGUSR1 استفاده می‌کند؛ در Windows بلافاصله شکست می‌خورد). همان ورودی ساخته‌شدهٔ پیش‌فرض و بازنویسی `--entry scripts/run-node.mjs` مربوط به راه‌اندازی Gateway در بالا را دارد.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

شناسه‌های حالت: `skipChannels`، `skipChannelsAcpxProbe` (کاوش راه‌اندازی ACPX روشن)، `skipChannelsNoAcpxProbe` (کاوش خاموش)، `default`، `fiftyPlugins`.

خروجی شامل `/healthz` بعدی، `/readyz` بعدی، زمان ازکارافتادگی، زمان‌بندی آمادگی راه‌اندازی مجدد، CPU، RSS، معیارهای ردگیری راه‌اندازی برای فرایند جایگزین و معیارهای ردگیری راه‌اندازی مجدد برای مدیریت سیگنال، تخلیهٔ کار فعال، مراحل بستن، آغاز بعدی، زمان‌بندی آمادگی و نماهای فوری حافظه است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` و `OPENCLAW_GATEWAY_RESTART_TRACE=1` را تنظیم می‌کند.

وقتی تغییری بر سیگنال‌دهی راه‌اندازی مجدد، مدیریت‌کننده‌های بستن، راه‌اندازی پس از راه‌اندازی مجدد، خاموش‌کردن sidecar، تحویل سرویس یا آمادگی پس از راه‌اندازی مجدد اثر می‌گذارد، از این بنچمارک استفاده کنید. برای جداسازی سازوکارهای Gateway از راه‌اندازی کانال، با `skipChannels` شروع کنید؛ تنها پس از آنکه حالت محدود مسیر راه‌اندازی مجدد را توضیح داد، از `default` یا حالت‌های سنگین از نظر Plugin استفاده کنید. معیارهای ردگیری سرنخ‌هایی برای انتساب‌اند، نه حکم قطعی — یک تغییر راه‌اندازی مجدد را بر پایهٔ چندین نمونه، بازهٔ مالک متناظر، رفتار `/healthz`/`/readyz` و قرارداد راه‌اندازی مجدد قابل‌مشاهده برای کاربر ارزیابی کنید.

</Accordion>

## E2E ورود اولیه (Docker)

اختیاری؛ فقط برای آزمون‌های دودِ ورود اولیه در محیط کانتینری لازم است. جریان کامل شروع سرد در یک کانتینر تمیز Linux:

```bash
scripts/e2e/onboard-docker.sh
```

ویزارد تعاملی را از طریق یک شبه‌TTY هدایت می‌کند، فایل‌های پیکربندی/فضای کاری/نشست را اعتبارسنجی می‌کند، سپس Gateway را راه‌اندازی و `openclaw health` را اجرا می‌کند.

## آزمون دودِ درون‌ریزی QR (Docker)

اطمینان می‌دهد که راهنمای زمان اجرای QR نگه‌داری‌شده تحت زمان‌های اجرای پشتیبانی‌شدهٔ Node در Docker بارگذاری می‌شود (Node 24 پیش‌فرض، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمون](/fa/help/testing)
- [آزمون زنده](/fa/help/testing-live)
- [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
