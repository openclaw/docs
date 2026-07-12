---
read_when:
    - اجرای آزمون‌ها یا رفع اشکال آن‌ها
summary: نحوه اجرای محلی آزمون‌ها (vitest) و زمان استفاده از حالت‌های اجباری/پوشش آزمون
title: آزمون‌ها
x-i18n:
    generated_at: "2026-07-12T10:50:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- مجموعهٔ کامل آزمون (مجموعه‌های آزمون، زنده، Docker): [آزمون](/fa/help/testing)
- اعتبارسنجی به‌روزرسانی و بستهٔ Plugin: [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)

## پیش‌فرض عامل

نشست‌های عامل، آزمون‌ها و اعتبارسنجی‌های محاسباتی سنگین را از راه دور
از طریق Crabbox اجرا می‌کنند. کد مورداعتماد نگه‌دارندگان به‌طور پیش‌فرض از Blacksmith Testbox استفاده می‌کند. گردش‌کار
پیکربندی‌شدهٔ Testbox اطلاعات احراز هویت را آماده‌سازی می‌کند؛ بنابراین کد نامطمئن مشارکت‌کنندگان یا
انشعاب‌ها باید به‌جای آن از CI انشعاب بدون اطلاعات محرمانه یا AWS Crabbox مستقیم و پاک‌سازی‌شده استفاده کند.

وقتی احتمال دارد یک وظیفهٔ کدنویسی مورداعتماد به آزمون یا اثبات سنگین نیاز داشته باشد، فوراً
در یک نشست فرمان پس‌زمینه آن را پیش‌گرم کنید، هنگام آماده‌سازی به کار ادامه دهید،
شناسهٔ بازگردانده‌شدهٔ `tbx_...` را دوباره استفاده کنید، در هر اجرا نسخهٔ کاری فعلی را همگام‌سازی کنید و
پیش از تحویل آن را متوقف کنید:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

پس از نخستین استفادهٔ مجدد موفق، پوشش‌دهنده اثرانگشت مبنا،
وابستگی و گردش‌کار Testbox اجاره را در `.crabbox/testbox-leases/` ثبت می‌کند.
ویرایش‌های صرفاً منبعی همچنان از محیط پیش‌گرم‌شده استفاده می‌کنند. تغییر در مبنای ادغام، فایل قفل،
ورودی مدیر بسته، پوشش‌دهنده یا گردش‌کار Testbox به‌صورت بسته شکست می‌خورد و به
اجاره‌ای تازه نیاز دارد. هر اجرا همچنان نسخهٔ کاری فعلی را همگام‌سازی می‌کند.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` فقط برای عیب‌یابی عمدی است، نه
اثبات انتشار.

فرمان‌های آزمون محلی زیر برای گردش‌کارهای انسانی یا حالت جایگزین صریح عامل هستند
که کاربر درخواست کرده باشد. دردسترس‌نبودن ارائه‌دهندهٔ راه دور باید گزارش شود؛ این وضعیت
اجازهٔ اجرای بی‌سروصدای یک دروازهٔ محلی گسترده را نمی‌دهد.

برای کد نامطمئن، با `--provider aws` پیش‌گرم کنید. هر اجرا باید
`CRABBOX_ENV_ALLOW=CI` را تنظیم کند، `--provider aws --no-hydrate` را ارسال کند و پیش از
نصب وابستگی‌ها یا اجرای آزمون‌ها از یک `HOME` موقت و تازه در محیط راه دور استفاده کند.
از اجاره‌ای تازه و اختصاصی برای همان منبع نامطمئن استفاده کنید؛ هرگز اجارهٔ مورداعتماد یا
ازپیش‌آماده‌شده را دوباره استفاده نکنید. یک فایل اجرایی Crabbox نصب‌شده و مورداعتماد را
از نسخهٔ کاری پاک و مورداعتماد `main` اجرا کنید و فقط PR راه دور را با
`--fresh-pr` دریافت کنید؛ هرگز پوشش‌دهنده یا پیکربندی نسخهٔ کاری نامطمئن را به‌صورت محلی اجرا نکنید.
`CRABBOX_AWS_INSTANCE_PROFILE` را لغو تنظیم کنید و مگر اینکه مقدار نهایی
`aws.instanceProfile` خالی باشد، به‌صورت بسته شکست دهید. پیش از هر نصب یا آزمون، با ابزارهای
مورداعتماد دارای مسیر مطلق، وجود توکن IMDSv2 را الزامی کنید، ثابت کنید نقطهٔ پایانی اطلاعات احراز هویت
IAM پاسخ 404 می‌دهد و تأیید کنید `git rev-parse HEAD` راه دور با SHA کامل
سرِ PR بررسی‌شده برابر است. اجاره را به آن SHA مقید کنید و هنگام تغییر سر،
آن را متوقف و دوباره پیش‌گرم کنید. فایل مورداعتماد `scripts/crabbox-untrusted-bootstrap.sh` را از
`main` پاک همراه با `--fresh-pr` بارگذاری کنید؛ این فایل Node/pnpm سنجاق‌شده را نصب می‌کند، SHA
و سنجاق مدیر بسته را تأیید می‌کند، `HOME` را ایزوله می‌کند، وابستگی‌ها را نصب می‌کند و سپس
آزمون درخواستی را اجرا می‌کند. اگر کارگزار نتواند نبود نقش یا وجودنداشتن PR راه دور را اثبات کند،
از CI انشعاب بدون اطلاعات محرمانه استفاده کنید. از `hydrate-github`، `--no-sync` یا
گردش‌کار Testbox آماده‌سازی‌شده با اطلاعات احراز هویت استفاده نکنید.
همهٔ بازنویسی‌های `CRABBOX_TAILSCALE*` را لغو تنظیم کنید، `--network public
--tailscale=false` را اجباری کنید، پرچم‌های گرهٔ خروجی/LAN را پاک کنید و پیش از بارگذاری هر اسکریپت،
الزام کنید `crabbox inspect` شبکهٔ عمومی بدون وضعیت Tailscale را گزارش دهد.

## ترتیب معمول محلی

1. `pnpm test:changed` برای اثبات Vitest در محدودهٔ تغییرات.
2. `pnpm test <path-or-filter>` برای یک فایل، پوشه یا هدف صریح.
3. `pnpm test` فقط وقتی عمداً به مجموعهٔ کامل محلی Vitest نیاز دارید.

در نسخهٔ کاری Codex یا نسخهٔ کاری پیوندی/تنک، عامل‌ها از اجرای مستقیم محلی
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` پرهیز می‌کنند:

- حالت جایگزین محلی که کاربر صراحتاً برای یک فایل کوچک درخواست کرده است:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- دروازه‌های تغییرات یا اثبات گسترده: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` تا pnpm درون Testbox اجرا شود.
- `exitCode` نهایی پوشش‌دهنده و JSON زمان‌بندی، نتیجهٔ فرمان هستند. اجرای واگذارشدهٔ Blacksmith GitHub Actions ممکن است پس از فرمان موفق SSH وضعیت `cancelled` نشان دهد، زیرا Testbox از بیرون کنش زنده‌نگه‌دار متوقف می‌شود؛ پیش از تلقی آن به‌عنوان شکست، خلاصهٔ پوشش‌دهنده و خروجی فرمان را بررسی کنید.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: برای فرمان‌هایی مانند `pnpm check:changed` و `pnpm test ...` هدفمند، سریال‌سازی بررسی‌های سنگین را به‌جای پوشهٔ مشترک Git در نسخهٔ کاری فعلی نگه می‌دارد. فقط وقتی عمداً بررسی‌های مستقل را در نسخه‌های کاری پیوندی روی میزبان‌های محلی پرظرفیت اجرا می‌کنید، از آن استفاده کنید.

## فرمان‌های اصلی

اجرای پوشش‌دهندهٔ آزمون با خلاصه‌ای کوتاه به‌شکل `[test] passed|failed|skipped ... in ...` پایان می‌یابد؛ خط مدت‌زمان خود Vitest به‌عنوان جزئیات هر شارد باقی می‌ماند.

| فرمان                                           | کاری که انجام می‌دهد                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | اهداف صریح فایل/پوشه از مسیرهای محدود Vitest عبور می‌کنند. اجراهای بدون هدف، اثبات مجموعهٔ کامل هستند: گروه‌های ثابت شارد برای اجرای موازی محلی به پیکربندی‌های برگ گسترش می‌یابند و پراکندگی موردانتظار شارد پیش از شروع نمایش داده می‌شود. گروه افزونه همیشه به‌جای یک فرایند عظیم پروژهٔ ریشه، به پیکربندی‌های شارد جداگانه برای هر افزونه گسترش می‌یابد. |
| `pnpm test:changed`                               | اجرای هوشمند و کم‌هزینهٔ آزمون تغییرات: اهداف دقیق از ویرایش مستقیم آزمون‌ها، فایل‌های هم‌ردهٔ `*.test.ts`، نگاشت‌های صریح منبع و گراف واردسازی محلی. تغییرات گسترده/پیکربندی/بسته رد می‌شوند، مگر اینکه به آزمون‌های دقیقی نگاشت شوند.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | اجرای صریح و گستردهٔ آزمون تغییرات؛ وقتی ویرایش ابزار آزمون/پیکربندی/بسته باید به رفتار گسترده‌تر آزمون تغییرات Vitest بازگردد، از آن استفاده کنید.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | درگاه پیکربندی‌شدهٔ Gateway مربوط به OpenClaw را آزاد می‌کند (پیش‌فرض `18789`) و سپس مجموعهٔ کامل را با درگاه Gateway ایزوله اجرا می‌کند تا آزمون‌های سرور با نمونهٔ درحال‌اجرا تداخل نداشته باشند.                                                                                                                                                                          |
| `pnpm test:coverage`                              | گزارش اطلاعاتی پوشش V8 را برای مسیر پیش‌فرض واحد (`vitest.unit.config.ts`) تولید می‌کند؛ هیچ آستانهٔ پوششی اعمال نمی‌شود.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | پوشش واحد فقط برای فایل‌هایی که از `origin/main` تغییر کرده‌اند.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | مسیرهای معماری فعال‌شده توسط تفاوت با `origin/main` را نشان می‌دهد.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | بیرون از CI به‌طور پیش‌فرض اجرا را به Crabbox/Testbox واگذار می‌کند، سپس دروازهٔ هوشمند بررسی تغییرات را در فرزند راه دور اجرا می‌کند: قالب‌بندی به‌همراه بررسی نوع، وارسی و فرمان‌های محافظ برای مسیرهای تحت‌تأثیر. Vitest را اجرا نمی‌کند؛ برای اثبات آزمون از `pnpm test:changed` یا `pnpm test <target>` استفاده کنید.                                                                      |

## وضعیت مشترک آزمون و ابزارهای کمکی فرایند

- `src/test-utils/openclaw-test-state.ts`: وقتی یک آزمون Vitest به `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، نمونهٔ پیکربندی، فضای کاری، پوشهٔ عامل یا مخزن نمایهٔ احراز هویت ایزوله نیاز دارد، از آن استفاده کنید.
- `pnpm test:env-mutations:report`: گزارش غیرمسدودکنندهٔ آزمون‌ها/ابزارهایی که مستقیماً `HOME`، `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_WORKSPACE_DIR` یا کلیدهای محیطی مرتبط را تغییر می‌دهند. از آن برای یافتن نامزدهای مهاجرت به ابزار مشترک وضعیت آزمون استفاده کنید.
- `test/helpers/openclaw-test-instance.ts`: برای آزمون‌های E2E سطح فرایند که به Gateway درحال‌اجرا، محیط CLI، ثبت گزارش و پاک‌سازی یکپارچه نیاز دارند.
- مسیرهای E2E مربوط به Docker/Bash که `scripts/lib/docker-e2e-image.sh` را منبع‌گذاری می‌کنند، می‌توانند `docker_e2e_test_state_shell_b64 <label> <scenario>` را به کانتینر ارسال و با `scripts/lib/openclaw-e2e-instance.sh` رمزگشایی کنند؛ اسکریپت‌های چندخانه‌ای می‌توانند `docker_e2e_test_state_function_b64` را ارسال کنند و در هر جریان `openclaw_test_state_create <label> <scenario>` را فراخوانی کنند. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` یک فایل محیطی قابل منبع‌گذاری میزبان می‌نویسد (`--` پیش از `create` مانع می‌شود زمان‌اجرای جدیدتر Node، گزینهٔ `--env-file` را پرچم Node تلقی کند). مسیرهایی که Gateway راه‌اندازی می‌کنند می‌توانند `scripts/lib/openclaw-e2e-instance.sh` را برای تفکیک نقطهٔ ورود، راه‌اندازی OpenAI شبیه‌سازی‌شده، اجرای پیش‌زمینه/پس‌زمینه، کاوش‌های آمادگی، برون‌بری محیط وضعیت، تخلیهٔ گزارش‌ها و پاک‌سازی فرایند منبع‌گذاری کنند.

## مسیرهای رابط کاربری کنترل، TUI و افزونه

- **آزمون E2E شبیه‌سازی‌شدهٔ رابط کنترل:** `pnpm test:ui:e2e` مسیر Vitest + Playwright را اجرا می‌کند که رابط کنترل Vite را راه‌اندازی می‌کند و یک صفحهٔ واقعی Chromium را در برابر WebSocket شبیه‌سازی‌شدهٔ Gateway هدایت می‌کند. آزمون‌ها در `ui/src/**/*.e2e.test.ts` قرار دارند؛ شبیه‌سازها/کنترل‌های مشترک در `ui/src/test-helpers/control-ui-e2e.ts` قرار دارند. `pnpm test:e2e` شامل این مسیر است. اجرای عامل‌ها، از جمله اثبات هدفمند، به‌طور پیش‌فرض در Testbox/Crabbox انجام می‌شود؛ فقط برای یک مسیر جایگزین محلیِ صریح از `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` استفاده کنید.
- **آزمون‌های PTY در TUI:** فرمان `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` مسیر سریع PTY با بک‌اند جعلی را اجرا می‌کند. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` یا `pnpm tui:pty:test:watch --mode local` آزمون دودِ کندتر `tui --local` را اجرا می‌کند که فقط نقطهٔ پایانی مدل خارجی را شبیه‌سازی می‌کند. متن قابل‌مشاهدهٔ پایدار یا فراخوانی‌های فیکسچر را بررسی کنید، نه اسنپ‌شات‌های خام ANSI را.
- `pnpm test:extensions` و `pnpm test extensions` همهٔ شاردهای افزونه/Plugin را اجرا می‌کنند. Pluginهای سنگین کانال، Plugin مرورگر و OpenAI به‌صورت شاردهای اختصاصی اجرا می‌شوند؛ سایر گروه‌های Plugin به‌صورت دسته‌بندی‌شده باقی می‌مانند. `pnpm test extensions/<id>` مسیر یک Plugin همراه را اجرا می‌کند.
- فایل‌های منبعی که آزمون هم‌جوار دارند، پیش از بازگشت به الگوهای گسترده‌تر دایرکتوری، به همان آزمون هم‌جوار نگاشت می‌شوند. ویرایش ابزارهای کمکی زیر `src/channels/plugins/contracts/test-helpers`، `src/plugin-sdk/test-helpers` و `src/plugins/contracts` از گراف واردسازی محلی استفاده می‌کند تا وقتی مسیر وابستگی دقیق است، به‌جای اجرای گستردهٔ همهٔ شاردها، آزمون‌های واردکننده اجرا شوند.
- هدف‌های دایرکتوری قرارداد به مسیرهای قرارداد خود منشعب می‌شوند: `pnpm test src/channels/plugins/contracts` چهار پیکربندی قرارداد کانال را اجرا می‌کند و `pnpm test src/plugins/contracts` پیکربندی قراردادهای Plugin را اجرا می‌کند، زیرا پروژه‌های عمومی `channels`/`plugins` مسیر `contracts/**` را مستثنا می‌کنند.
- `auto-reply` به سه پیکربندی اختصاصی (`core`، `top-level`، `reply`) تقسیم می‌شود تا چارچوب آزمون پاسخ بر آزمون‌های سبک‌تر وضعیت/توکن/ابزار کمکی در سطح بالا غالب نشود.
- فایل‌های آزمون منتخب `plugin-sdk` و `commands` از مسیرهای سبک اختصاصی عبور می‌کنند که فقط `test/setup.ts` را نگه می‌دارند و موارد سنگین از نظر زمان اجرا را در مسیرهای موجودشان باقی می‌گذارند.
- پیکربندی پایهٔ Vitest به‌طور پیش‌فرض از `pool: "threads"` و `isolate: false` استفاده می‌کند و اجراکنندهٔ مشترکِ بدون جداسازی در پیکربندی‌های مخزن فعال است.
- `pnpm test:channels` فایل `vitest.channels.config.ts` را اجرا می‌کند.

## Gateway و E2E

- یکپارچه‌سازی Gateway انتخابی است: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` یا `pnpm test:gateway`.
- `pnpm test:e2e`: مجموعهٔ E2E مخزن = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: آزمون‌های دود سرتاسری Gateway (جفت‌سازی چندنمونه‌ای WS/HTTP/Node). به‌طور پیش‌فرض از `threads` + `isolate: false` با workerهای تطبیقی در `vitest.e2e.config.ts` استفاده می‌کند؛ با `OPENCLAW_E2E_WORKERS=<n>` تنظیم کنید و برای گزارش‌های مفصل از `OPENCLAW_E2E_VERBOSE=1` استفاده کنید.
- `pnpm test:live`: آزمون‌های زندهٔ ارائه‌دهندگان (Claude/Minimax/DeepSeek/z.ai/و غیره، محدودشده با `*.live.test.ts`). برای خارج‌شدن از حالت ردشدن به کلیدهای API و `LIVE=1` (یا `OPENCLAW_LIVE_TEST=1`) نیاز دارد؛ برای خروجی مفصل از `OPENCLAW_LIVE_TEST_QUIET=0` استفاده کنید.

## مجموعهٔ کامل Docker (`pnpm test:docker:all`)

تصویر مشترک آزمون زنده را می‌سازد، OpenClaw را یک‌بار به‌صورت tarball مربوط به npm بسته‌بندی می‌کند، یک تصویر اجرای پایهٔ Node/Git و یک تصویر عملیاتی را که آن tarball را در `/app` نصب می‌کند می‌سازد/دوباره استفاده می‌کند، سپس مسیرهای آزمون دود Docker را از طریق یک زمان‌بند وزن‌دار اجرا می‌کند. `scripts/package-openclaw-for-docker.mjs` تنها بسته‌بند محلی/CI است و پیش از استفادهٔ Docker، tarball و `dist/postinstall-inventory.json` را اعتبارسنجی می‌کند.

- تصویر پایه (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): مسیرهای نصب‌کننده/به‌روزرسانی/وابستگی Plugin؛ به‌جای منابع کپی‌شدهٔ مخزن، tarball ازپیش‌ساخته‌شده را متصل می‌کند.
- تصویر عملیاتی (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): مسیرهای عادی قابلیت‌های برنامهٔ ساخته‌شده.
- تعریف مسیرها: `scripts/lib/docker-e2e-scenarios.mjs`. برنامه‌ریز: `scripts/lib/docker-e2e-plan.mjs`. اجراکننده: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` برنامهٔ CI متعلق به زمان‌بند (مسیرها، انواع تصویر، نیازهای بسته/تصویر زنده، سناریوهای وضعیت، بررسی‌های اعتبارنامه) را بدون ساختن یا اجرای Docker تولید می‌کند.

گزینه‌های زمان‌بندی (متغیرهای محیطی، مقادیر پیش‌فرض درون پرانتز):

| متغیر محیطی                                                                                                    | پیش‌فرض            | هدف                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | جایگاه‌های پردازش.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | مخزن انتهایی حساس به ارائه‌دهنده.                                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | سقف مسیرهای سنگین ارائه‌دهندهٔ زنده.                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | سقف مسیرهای وابسته به منابع npm.                                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | سقف مسیرهای وابسته به منابع سرویس.                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | سقف مسیرهای سنگین به‌ازای هر ارائه‌دهنده.                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | سقف‌های محدودتر به‌ازای هر ارائه‌دهنده.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | بازنویسی برای میزبان‌های بزرگ‌تر.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | تأخیر میان شروع مسیرها؛ از هجوم ایجاد به سرویس Docker محلی جلوگیری می‌کند.                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 دقیقه) | مهلت زمانی جایگزین به‌ازای هر مسیر؛ مسیرهای زنده/انتهایی منتخب از سقف‌های سخت‌گیرانه‌تری استفاده می‌کنند.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | تعداد تلاش‌های مجدد برای خطاهای گذرای ارائه‌دهندهٔ زنده.                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | خاموش               | مانیفست مسیرها را بدون اجرای Docker چاپ می‌کند.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | فاصلهٔ زمانی چاپ وضعیت مسیرهای فعال.                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | روشن                | از `.artifacts/docker-tests/lane-timings.json` برای ترتیب طولانی‌ترین‌ها در ابتدا دوباره استفاده می‌کند؛ برای غیرفعال‌کردن روی `0` تنظیم کنید.                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` فقط برای مسیرهای قطعی/محلی و `only` فقط برای مسیرهای ارائه‌دهندهٔ زنده. نام‌های مستعار: `pnpm test:docker:local:all`، `pnpm test:docker:live:all`. حالت فقط زنده، مسیرهای زندهٔ اصلی و انتهایی را در یک مخزن با ترتیب طولانی‌ترین‌ها در ابتدا ادغام می‌کند تا باکت‌های ارائه‌دهنده، کار Claude/Codex/Gemini را کنار هم بسته‌بندی کنند. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | مهلت زمانی راه‌اندازی بک‌اند CLI در Docker.                                                                                                                                                                                                                                                                                                                  |

الگوی متغیر محیطی برای سقف منابع `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` است (نام منبع با حروف بزرگ و نویسه‌های غیرالفبایی‌عددی که به `_` تبدیل شده‌اند).

رفتارهای دیگر: اجراکننده به‌طور پیش‌فرض Docker را پیش‌بررسی می‌کند، کانتینرهای قدیمی E2E مربوط به OpenClaw را پاک‌سازی می‌کند، حافظه‌های نهان ابزارهای CLI ارائه‌دهندگان را میان مسیرهای سازگار به اشتراک می‌گذارد و پس از نخستین شکست، زمان‌بندی مسیرهای تجمیعی جدید را متوقف می‌کند؛ مگر اینکه `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` تنظیم شده باشد. اگر وزن یا منابع مؤثر یک مسیر از سقف میزبان کم‌هم‌زمانی فراتر رود، همچنان می‌تواند از یک مجموعه خالی آغاز شود و تا زمان آزادکردن ظرفیت، به‌تنهایی اجرا شود. گزارش‌های هر مسیر، `summary.json`،‏ `failures.json` و زمان‌بندی مرحله‌ها در `.artifacts/docker-tests/<run-id>/` نوشته می‌شوند؛ برای بررسی مسیرهای کند از `pnpm test:docker:timings <summary.json>` و برای چاپ فرمان‌های کم‌هزینه و هدفمند اجرای مجدد از `pnpm test:docker:rerun <run-id|summary.json|failures.json>` استفاده کنید.

### مسیرهای شاخص Docker

| فرمان                                                                     | موارد بررسی‌شده                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | کانتینر E2E مبدأ مبتنی بر Chromium با CDP خام و Gateway ایزوله؛ تصویرهای فوری نقش CDP در `browser doctor --deep` شامل نشانی‌های پیوند، عناصر قابل‌کلیکی که با نشانگر شناسایی شده‌اند، ارجاع‌های iframe و فراداده فریم هستند.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | بسته tarball را در یک اجراکننده Docker خالی با `skills.install.allowUploadedArchives: false` نصب می‌کند، شناسه کوتاه یک skill فعلی را از جست‌وجوی زنده ClawHub استخراج می‌کند، آن را از طریق `openclaw skills install` نصب می‌کند و `SKILL.md`،‏ `.clawhub/origin.json`،‏ `.clawhub/lock.json` و `skills info --json` را بررسی می‌کند.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | کاوش‌های زنده و متمرکز پشتیبان CLI؛ Gemini نام‌های مستعار متناظر `:resume` و `:mcp` را دارد.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw و Open WebUI کانتینری‌شده: ورود به سامانه، بررسی `/api/models` و اجرای یک گفت‌وگوی واقعیِ عبور‌داده‌شده از پراکسی از طریق `/api/chat/completions`. به یک کلید قابل‌استفاده برای مدل زنده نیاز دارد و یک تصویر خارجی را دریافت می‌کند؛ انتظار نمی‌رود مانند مجموعه‌های واحد/E2E در CI پایدار باشد.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | کانتینر Gateway دارای داده اولیه، به‌همراه کانتینر کلاینتی که `openclaw mcp serve` را اجرا می‌کند: کشف مکالمه مسیریابی‌شده، خواندن رونوشت‌ها، فراداده پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی و اعلان‌های کانال و مجوز به سبک Claude روی پل واقعی stdio (اعتبارسنجی، فریم‌های خام stdio مربوط به MCP را مستقیماً می‌خواند).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | بسته tarball را روی نمونه‌ای نامرتب از کاربر قدیمی نصب می‌کند، به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای زنده ارائه‌دهنده/کانال اجرا می‌کند، یک Gateway روی local loopback راه‌اندازی می‌کند و بررسی می‌کند که عامل‌ها، پیکربندی کانال، فهرست‌های مجاز Plugin، فضای کاری، فایل‌های نشست، وضعیت قدیمی و منسوخ وابستگی Plugin، راه‌اندازی و وضعیت RPC حفظ شوند.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را مقداردهی اولیه می‌کند، با دستورالعمل ازپیش‌آماده `openclaw config set` پیکربندی می‌کند، به بسته tarball به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد و `/healthz`،‏ `/readyz` و وضعیت RPC را بررسی می‌کند. با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` یک ماتریس را گسترش دهید یا با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` نمونه‌های سناریو را اضافه کنید (شامل `configured-plugin-installs` و `stale-source-plugin-shadow`). پذیرش بسته این موارد را به‌صورت `published_upgrade_survivor_baseline(s)` / `_scenarios` ارائه می‌کند و توکن‌های فراداده‌ای مانند `last-stable-4` یا `all-since-2026.4.23` را تفکیک می‌کند. |
| `pnpm test:docker:update-migration`                                         | چارچوب آزمون بقای ارتقای نسخه منتشرشده در سناریوی `plugin-deps-cleanup` که به‌طور پیش‌فرض از `openclaw@2026.4.23` آغاز می‌شود. گردش‌کار `Update Migration` این مورد را با `baselines=all-since-2026.4.23` گسترش می‌دهد تا پاک‌سازی وابستگی Plugin پیکربندی‌شده را خارج از CI انتشار کامل اثبات کند.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، بسته‌های رجیستری npm با وابستگی‌های بالاکشیده‌شده، ارجاع‌های متغیر git، نمونه‌های ClawHub، به‌روزرسانی‌های بازارچه و فعال‌سازی/بازرسی بسته Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## دروازه محلی PR

برای بررسی‌های محلی فرود/دروازه PR، فرمان‌های زیر را اجرا کنید:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

اگر `pnpm test` روی میزبانی تحت بار دچار شکست ناپایدار شد، پیش از درنظرگرفتن آن به‌عنوان پسرفت، یک بار دیگر اجرا کنید؛ سپس با `pnpm test <path/to/test>` آن را ایزوله کنید. برای میزبان‌های دارای محدودیت حافظه:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## ابزارهای عملکرد آزمون

- `pnpm test:perf:imports`: گزارش مدت‌زمان import و تفکیک import در Vitest را فعال می‌کند، درحالی‌که برای هدف‌های صریح فایل/دایرکتوری همچنان از مسیریابی lane محدودشده استفاده می‌کند. `pnpm test:perf:imports:changed` همان پروفایل‌گیری را به فایل‌های تغییرکرده از زمان `origin/main` محدود می‌کند.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر مسیریابی‌شدهٔ حالت تغییرات را برای همان diff ثبت‌شدهٔ git با اجرای بومی پروژهٔ ریشه بنچمارک می‌کند؛ `pnpm test:perf:changed:bench -- --worktree` مجموعه‌تغییرات worktree فعلی را بدون نیاز به commit اولیه بنچمارک می‌کند.
- `pnpm test:perf:profile:main` یک پروفایل CPU برای رشتهٔ اصلی Vitest در `.artifacts/vitest-main-profile` می‌نویسد؛ `pnpm test:perf:profile:runner` پروفایل‌های CPU و heap را برای اجراکنندهٔ تست‌های واحد در `.artifacts/vitest-runner-profile` می‌نویسد.
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: همهٔ پیکربندی‌های برگِ Vitest در مجموعه‌آزمون کامل را به‌صورت ترتیبی اجرا می‌کند و داده‌های مدت‌زمان گروه‌بندی‌شده را همراه با مصنوعات JSON/گزارش هر پیکربندی می‌نویسد. گزارش‌های مجموعه‌آزمون کامل به‌طور پیش‌فرض فایل‌ها را ایزوله می‌کنند تا گراف‌های ماژولِ باقی‌مانده و مکث‌های GC ناشی از فایل‌های قبلی به assertionهای بعدی منظور نشوند؛ `-- --no-isolate` را فقط هنگام پروفایل‌گیری عمدی از انباشت worker مشترک ارسال کنید. عامل عملکرد آزمون پیش از تلاش برای رفع تست‌های کند، از این مورد به‌عنوان خط مبنا استفاده می‌کند. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` گزارش‌های گروه‌بندی‌شده را پس از تغییری با تمرکز بر عملکرد مقایسه می‌کند.
- اجراهای shard کامل، افزونه و الگوی include، داده‌های زمان‌بندی محلی را در `.artifacts/vitest-shard-timings.json` به‌روزرسانی می‌کنند؛ اجراهای بعدیِ کل پیکربندی از این زمان‌بندی‌ها برای متعادل‌کردن shardهای کند و سریع استفاده می‌کنند. shardهای CI با الگوی include نام shard را به کلید زمان‌بندی می‌افزایند تا زمان‌بندی shardهای فیلترشده بدون جایگزین‌کردن داده‌های زمان‌بندی کل پیکربندی قابل‌مشاهده بماند. برای نادیده‌گرفتن مصنوع زمان‌بندی محلی، `OPENCLAW_TEST_PROJECTS_TIMINGS=0` را تنظیم کنید.

## بنچمارک‌ها

<Accordion title="تأخیر مدل (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

متغیرهای محیطی اختیاری: `MINIMAX_API_KEY`، `MINIMAX_BASE_URL`، `MINIMAX_MODEL`، `ANTHROPIC_API_KEY`. پرامپت پیش‌فرض: «با یک کلمه پاسخ بده: ok. بدون نشانه‌گذاری یا متن اضافی.»

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

خروجی برای هر فرمان شامل `sampleCount`، میانگین، p50، p95، کمینه/بیشینه، توزیع کد خروج/سیگنال و حداکثر RSS است. `--cpu-prof-dir` / `--heap-prof-dir` برای هر اجرا پروفایل‌های V8 می‌نویسند.

خروجی ذخیره‌شده: `pnpm test:startup:bench:smoke` در `.artifacts/cli-startup-bench-smoke.json` می‌نویسد؛ `pnpm test:startup:bench:save` در `.artifacts/cli-startup-bench-all.json` می‌نویسد (`runs=5 warmup=1`). fixture ثبت‌شده در مخزن: `test/fixtures/cli-startup-bench.json` که با `pnpm test:startup:bench:update` تازه‌سازی و با `pnpm test:startup:bench:check` مقایسه می‌شود.

</Accordion>

<Accordion title="راه‌اندازی Gateway (scripts/bench-gateway-startup.ts)">

به‌طور پیش‌فرض از ورودی CLI ساخته‌شده در `dist/entry.js` استفاده می‌کند؛ ابتدا `pnpm build` را اجرا کنید. برای اندازه‌گیری اجراکنندهٔ کد منبع، به‌جای آن `--entry scripts/run-node.mjs` را ارسال کنید و نتایجش را از خطوط مبنای ورودی ساخته‌شده جدا نگه دارید.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

شناسه‌های حالت: `default`، `skipChannels` (راه‌اندازی کانال رد می‌شود)، `oneInternalHook`، `allInternalHooks`، `fiftyPlugins` (۵۰ Plugin مانیفست)، `fiftyStartupLazyPlugins` (۵۰ Plugin مانیفست با بارگذاری تنبل هنگام راه‌اندازی).

خروجی شامل نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان گزارش آغاز گوش‌دادن HTTP، زمان گزارش آماده‌شدن Gateway، زمان CPU، نسبت هستهٔ CPU، حداکثر RSS، heap، معیارهای ردگیری راه‌اندازی، تأخیر حلقهٔ رویداد و معیارهای جزئیات جدول جست‌وجوی Plugin است. اسکریپت در محیط Gateway فرزند، `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم می‌کند.

`/healthz` نشان‌دهندهٔ زنده‌بودن است (سرور HTTP می‌تواند پاسخ دهد). `/readyz` نشان‌دهندهٔ آمادگی قابل‌استفاده است (sidecarهای Plugin راه‌اندازی، کانال‌ها و کارهای پس از اتصال که برای آمادگی حیاتی‌اند، پایدار شده‌اند). hookهای راه‌اندازی به‌صورت ناهمگام dispatch می‌شوند و بخشی از تضمین آمادگی نیستند. زمان گزارش آمادگی، timestamp داخلی Gateway است که برای انتساب در سمت فرایند مفید است، اما جایگزین probe خارجی `/readyz` نیست.

هنگام مقایسهٔ تغییرات، از خروجی JSON یا `--output` استفاده کنید. از `--cpu-prof-dir` فقط زمانی استفاده کنید که خروجی ردگیری به import، کامپایل یا کاری محدودشده به CPU اشاره می‌کند که زمان‌بندی مراحل به‌تنهایی قادر به توضیح آن نیست.

</Accordion>

<Accordion title="راه‌اندازی مجدد Gateway (scripts/bench-gateway-restart.ts)">

فقط macOS و Linux (برای راه‌اندازی مجدد درون‌فرایندی از SIGUSR1 استفاده می‌کند؛ در Windows فوراً با شکست مواجه می‌شود). همان ورودی ساخته‌شدهٔ پیش‌فرض و بازنویسی `--entry scripts/run-node.mjs` که در راه‌اندازی Gateway در بالا آمده است.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

شناسه‌های حالت: `skipChannels`، `skipChannelsAcpxProbe` (probe راه‌اندازی ACPX روشن)، `skipChannelsNoAcpxProbe` (probe خاموش)، `default`، `fiftyPlugins`.

خروجی شامل `/healthz` بعدی، `/readyz` بعدی، زمان ازکارافتادگی، زمان‌بندی آمادگی راه‌اندازی مجدد، CPU، RSS، معیارهای ردگیری راه‌اندازی برای فرایند جایگزین و معیارهای ردگیری راه‌اندازی مجدد برای مدیریت سیگنال، تخلیهٔ کار فعال، مراحل بستن، شروع بعدی، زمان‌بندی آمادگی و snapshotهای حافظه است. اسکریپت `OPENCLAW_GATEWAY_STARTUP_TRACE=1` و `OPENCLAW_GATEWAY_RESTART_TRACE=1` را تنظیم می‌کند.

از این بنچمارک زمانی استفاده کنید که تغییری سیگنال‌دهی راه‌اندازی مجدد، مدیریت‌کننده‌های بستن، راه‌اندازی پس از راه‌اندازی مجدد، خاموش‌سازی sidecar، تحویل سرویس یا آمادگی پس از راه‌اندازی مجدد را تحت‌تأثیر قرار می‌دهد. برای جداسازی سازوکارهای Gateway از راه‌اندازی کانال، با `skipChannels` شروع کنید؛ فقط پس از آنکه حالت محدود مسیر راه‌اندازی مجدد را توضیح داد، از `default` یا حالت‌های سنگین از نظر Plugin استفاده کنید. معیارهای ردگیری سرنخ‌های انتساب‌اند، نه حکم نهایی — تغییر راه‌اندازی مجدد را بر اساس چندین نمونه، بازهٔ مالک متناظر، رفتار `/healthz`/`/readyz` و قرارداد راه‌اندازی مجدد قابل‌مشاهده برای کاربر ارزیابی کنید.

</Accordion>

## E2E راه‌اندازی اولیه (Docker)

اختیاری؛ فقط برای تست‌های دودِ راه‌اندازی اولیه در کانتینر لازم است. جریان کامل شروع سرد در یک کانتینر پاک Linux:

```bash
scripts/e2e/onboard-docker.sh
```

wizard تعاملی را از طریق pseudo-tty هدایت می‌کند، فایل‌های پیکربندی/workspace/session را تأیید می‌کند، سپس Gateway را راه‌اندازی کرده و `openclaw health` را اجرا می‌کند.

## تست دودِ import کردن QR (Docker)

اطمینان می‌دهد helper نگه‌داری‌شدهٔ runtime مربوط به QR در runtimeهای پشتیبانی‌شدهٔ Docker Node بارگذاری می‌شود (Node 24 پیش‌فرض، سازگار با Node 22):

```bash
pnpm test:docker:qr
```

## مرتبط

- [آزمون](/fa/help/testing)
- [آزمون زنده](/fa/help/testing-live)
- [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
