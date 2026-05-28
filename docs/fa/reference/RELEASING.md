---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، کادرهای اعتبارسنجی، نام‌گذاری نسخه، و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-12T08:47:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای تگ‌گذاری‌شده‌ای که به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند، یا زمانی که صراحتا درخواست شود در npm `latest` منتشر می‌شوند
- beta: تگ‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سرِ در حال حرکت `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - تگ Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - تگ Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - تگ Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پر نکنید
- `latest` یعنی انتشار پایدار فعلی npm که ارتقا یافته است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بازبینی‌شده را ارتقا دهند
- هر انتشار پایدار OpenClaw، بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه Mac برای انتشار پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` که از
  `main` فعلی ساخته شده می‌برند، تا اعتبارسنجی انتشار و اصلاحات جلوی
  توسعه جدید روی `main` را نگیرد
- اگر یک تگ بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازساخت تگ بتای قدیمی، تگ بعدی `-beta.N` را می‌برند
- رویه تفصیلی انتشار، تأییدیه‌ها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag و جزئیات rollback اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی برای ساخت شاخه از آن سبز است.
2. بخش بالایی `CHANGELOG.md` را با
   `/changelog` از تاریخچه واقعی commitها بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و
   پیش از ساخت شاخه یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را فقط زمانی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمدا نگه داشته می‌شود.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیم روی `main` انجام ندهید.
5. همه محل‌های نسخه لازم را برای تگ موردنظر افزایش دهید، سپس
   `pnpm release:prep` را اجرا کنید. این کار نسخه‌های Plugin، فهرست Plugin، شِمای پیکربندی،
   فراداده پیکربندی کانال‌های بسته‌بندی‌شده، مبنای مستندات پیکربندی، خروجی‌های SDK Plugin
   و مبنای API SDK Plugin را به‌ترتیب درست به‌روزرسانی می‌کند. هر drift تولیدشده را پیش از تگ‌گذاری commit کنید. سپس preflight قطعی محلی را اجرا کنید:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود تگ،
   یک SHA کامل ۴۰ کاراکتری شاخه انتشار برای preflight فقط-اعتبارسنجی مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش‌انتشار را با `Full Release Validation` برای
   شاخه انتشار، تگ، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، profile بسته، provider، یا allowlist مدل شکست‌خورده‌ای را دوباره اجرا کنید که
   اصلاح را ثابت می‌کند. فقط زمانی کل umbrella را دوباره اجرا کنید که سطح تغییریافته
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را تگ کنید، سپس `OpenClaw Release Publish` را از
   شاخه متناظر `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را
   به‌صورت موازی به ClawHub dispatch می‌کند، و سپس artifact آماده preflight npm مربوط به OpenClaw را
   به‌محض موفقیت انتشار npm مربوط به Pluginها با dist-tag متناظر ارتقا می‌دهد.
   پس از موفقیت فرزند انتشار npm مربوط به OpenClaw، صفحه انتشار/پیش‌انتشار
   متناظر GitHub را از بخش کامل متناظر
   `CHANGELOG.md` می‌سازد یا به‌روزرسانی می‌کند. انتشارهای پایدار منتشرشده در npm `latest` به
   آخرین انتشار GitHub تبدیل می‌شوند؛ انتشارهای نگه‌داری پایدار که روی npm `beta` نگه داشته می‌شوند
   با GitHub `latest=false` ساخته می‌شوند.
   انتشار ClawHub ممکن است هم‌زمان با انتشار npm مربوط به OpenClaw همچنان در حال اجرا باشد، اما
   گردش‌کار انتشار، شناسه‌های اجرای فرزند را بلافاصله چاپ می‌کند. به‌طور پیش‌فرض
   پس از dispatch کردن ClawHub منتظر آن نمی‌ماند، بنابراین دسترس‌پذیری npm مربوط به OpenClaw
   توسط تأییدهای کندتر ClawHub یا کارهای registry مسدود نمی‌شود؛ وقتی
   ClawHub باید تکمیل گردش‌کار را مسدود کند `wait_for_clawhub=true` را تنظیم کنید. مسیر
   ClawHub شکست‌های گذرای نصب وابستگی CLI را retry می‌کند، Pluginهای دارای preview موفق را حتی وقتی یک سلول preview ناپایدار می‌شود منتشر می‌کند، و با
   اعتبارسنجی registry برای هر نسخه موردانتظار Plugin پایان می‌یابد تا انتشارهای جزئی
   قابل مشاهده و قابل retry باقی بمانند. پس از انتشار، اجرا کنید:
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   تا پیش‌انتشار GitHub، dist-tagهای npm `beta`، یکپارچگی npm،
   مسیر نصب منتشرشده، نسخه‌های دقیق ClawHub، artifactهای ClawHub، و نتیجه‌های
   گردش‌کار فرزند را با یک فرمان تأیید کنید. وقتی sidecar
   ClawHub فقط در jobهای قابل retry شکست خورده و باید درجا دوباره اجرا شود، `--rerun-failed-clawhub` را اضافه کنید.
   سپس پذیرش بسته پس از انتشار را در برابر بسته منتشرشده
   `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار متناظر بعدی را ببرید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتا یا نامزد انتشار بازبینی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار npm پایدار نیز از مسیر
    `OpenClaw Release Publish` می‌گذرد و artifact موفق preflight را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار macOS پایدار همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزرسانی‌شده روی `main` نیاز دارد.
    گردش‌کار خصوصی انتشار macOS پس از تأیید assetهای انتشار، appcast امضاشده را به‌طور خودکار روی
    `main` عمومی منتشر می‌کند؛ اگر محافظت شاخه جلوی push مستقیم را بگیرد،
    یک PR مربوط به appcast باز می‌کند یا به‌روزرسانی می‌کند.
11. پس از انتشار، verifier پس از انتشار npm، E2E مستقل اختیاری Telegram منتشرشده در npm را وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ارتقای dist-tag در صورت نیاز، تأیید صفحه انتشار GitHub تولیدشده،
    و مراحل اعلام انتشار را اجرا کنید.

## Release preflight

- `pnpm check:test-types` را پیش از پیش‌پرواز انتشار اجرا کنید تا TypeScript آزمون‌ها خارج از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- `pnpm check:architecture` را پیش از پیش‌پرواز انتشار اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری خارج از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از تگ‌گذاری، `pnpm release:prep` را اجرا کنید. این دستور همه تولیدکننده‌های قطعی انتشار را اجرا می‌کند که معمولا پس از تغییر نسخه/پیکربندی/API دچار انحراف می‌شوند: نسخه‌های Plugin، موجودی Plugin، شمای پیکربندی پایه، فراداده پیکربندی کانال‌های بسته‌بندی‌شده، مبنای مستندات پیکربندی، exportهای SDK مربوط به Plugin، و مبنای API SDK مربوط به Plugin. `pnpm release:check` این نگهبان‌ها را در حالت بررسی دوباره اجرا می‌کند و پیش از اجرای بررسی‌های انتشار package، همه خطاهای انحراف تولیدشده‌ای را که پیدا می‌کند در یک گذر گزارش می‌دهد.
- پیش از تایید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش‌انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch، tag یا SHA کامل commit می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی‌عامل، هم‌ترازی QA Lab، Matrix و laneهای Telegram dispatch می‌کند. اجراهای پایدار/پیش‌فرض، soak جامع live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجبارا soak را فعال می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E مربوط به package را در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار beta، `release_package_spec` را ارائه کنید تا package منتشرشده npm در release checks، Package Acceptance و Telegram E2E مربوط به package بدون بازسازی release tarball دوباره استفاده شود. فقط وقتی `npm_telegram_package_spec` را ارائه کنید که Telegram باید package منتشرشده‌ای متفاوت از بقیه اعتبارسنجی انتشار استفاده کند. وقتی Package Acceptance باید package منتشرشده‌ای متفاوت از مشخصات package انتشار استفاده کند، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش خصوصی شواهد باید ثابت کند اعتبارسنجی با یک package منتشرشده npm مطابقت دارد بدون اینکه Telegram E2E را اجبار کند، `evidence_package_spec` را ارائه کنید.
  نمونه:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید هم‌زمان با ادامه کار انتشار، اثبات side-channel برای یک نامزد package داشته باشید، workflow دستی `Package Acceptance` را اجرا کنید. از `source=npm` برای `openclaw@beta`، `openclaw@latest` یا یک نسخه دقیق انتشار استفاده کنید؛ از `source=ref` برای pack کردن branch/tag/SHA مورد اعتماد `package_ref` با harness فعلی `workflow_ref` استفاده کنید؛ از `source=url` برای tarball HTTPS با SHA-256 الزامی استفاده کنید؛ یا از `source=artifact` برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، آرتیفکت package همان نامزد است و `published_upgrade_survivor_baseline` مبنای منتشرشده را انتخاب می‌کند. `update-restart-auth` از package نامزد هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده دستور update نامزد را تمرین کند.
  نمونه: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و بارگذاری دوباره config
  - `package`: laneهای package/update/restart/Plugin بومی آرتیفکت بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent،
    جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای دوباره متمرکز
- وقتی فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از محدوده‌بندی تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  نمونه: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌دهد و نام spanهای trace صادرشده، attributeهای محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse یا collector خارجی دیگر تایید می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود داشتن tag، برای توالی publish تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را پاس دهید، و دامنه پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمدا یک repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را پشت سر هم اجرا می‌کند تا package هسته پیش از Pluginهای خارجی‌شده‌اش منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، lane هم‌ترازی mock مربوط به QA Lab به‌علاوه پروفایل سریع Matrix زنده و lane QA مربوط به Telegram را اجرا می‌کند. laneهای زنده از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره‌های credential مربوط به Convex CI استفاده می‌کند. وقتی موجودی کامل transport، media و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای میان‌سیستمی‌عامل بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی و متمرکز بر آرتیفکت نگه دارید، در حالی که بررسی‌های زنده کندتر در lane خودشان باقی می‌مانند تا publish را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از ref workflow مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- پیش‌پرواز صرفا اعتبارسنجی `OpenClaw NPM Release` همچنین SHA کامل ۴۰کاراکتری فعلی commit مربوط به branch workflow را بدون نیاز به tag push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به publish واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده package، `v<package.json version>` را می‌سازد؛ publish واقعی همچنان به tag واقعی انتشار نیاز دارد
- هر دو workflow مسیر واقعی publish و promotion را روی runnerهای میزبانی‌شده GitHub نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون تغییر می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از tag کردن محلی یک نامزد انتشار، دستور
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` را اجرا کنید. این helper guardrailهای سریع انتشار، بررسی‌های انتشار npm/ClawHub مربوط به Plugin، build، build UI، و `release:openclaw:npm:check` را به ترتیبی اجرا می‌کند که خطاهای رایج مسدودکننده تایید را پیش از شروع workflow انتشار GitHub پیدا کند.
- پیش از تایید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  را اجرا کنید (یا tag متناظر beta/correction)
- پس از publish در npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  را اجرا کنید (یا نسخه متناظر beta/correction) تا مسیر نصب registry منتشرشده در یک temp prefix تازه تایید شود
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding package نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر package منتشرشده npm با استفاده از مجموعه credential اجاره‌ای مشترک Telegram تایید شود. اجراهای موردی محلی maintainer می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس دهند.
- برای اجرای smoke کامل beta پس از publish از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی update/fresh-target مربوط به Parallels npm را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، آرتیفکت را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- maintainerها می‌توانند همین بررسی پس از publish را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمدا فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - publish واقعی npm باید یک `preflight_run_id` موفق npm داشته باشد
  - publish واقعی npm باید از همان branch یعنی `main` یا
    `release/YYYY.M.D` که اجرای موفق preflight از آن بوده dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` هستند
  - publish پایدار npm می‌تواند از طریق ورودی workflow صراحتا `latest` را هدف بگیرد
  - تغییر token-based مربوط به dist-tag در npm اکنون در
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    برای امنیت قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی publish فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط اعتبارسنجی است؛ وقتی tag فقط روی یک branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - publish واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac داشته باشد
  - مسیرهای واقعی publish آرتیفکت‌های آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، تاییدکننده پس از publish همان مسیر upgrade با temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را نیز بررسی می‌کند تا correctionهای انتشار نتوانند بی‌سروصدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم شامل `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` باشد تا دوباره dashboard مرورگر خالی منتشر نکنیم
- اعتبارسنجی پس از publish همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از publish را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball نامزد update enforce می‌کند، تا installer e2e پیش از مسیر publish انتشار، بزرگ شدن تصادفی pack را بگیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا ماتریس‌های آزمون extension دست زده است، پیش از تایید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و review کنید تا release notes layout قدیمی CI را توصیف نکند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های updater است:
  - release در GitHub باید در نهایت شامل `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از publish به zip پایدار جدید اشاره کند؛ workflow publish خصوصی macOS آن را خودکار commit می‌کند، یا وقتی push مستقیم مسدود است یک PR مربوط به appcast باز می‌کند
  - app بسته‌بندی‌شده باید یک bundle id غیر debug، یک URL غیرخالی feed مربوط به Sparkle، و یک `CFBundleVersion` برابر یا بالاتر از کف canonical build مربوط به Sparkle برای آن نسخه انتشار نگه دارد

## جعبه‌های آزمون انتشار

`Full Release Validation` روشی است که اپراتورها همه آزمون‌های پیش از انتشار را از
یک نقطه ورود اجرا می‌کنند. برای اثبات یک commit سنجاق‌شده روی شاخه‌ای با تغییرات سریع، از
helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper شاخه `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از آن شاخه با `ref=<sha>` dispatch می‌کند، بررسی می‌کند `headSha` همه workflowهای فرزند
با هدف یکی باشد، سپس شاخه موقت را حذف می‌کند. این کار جلوی اثبات تصادفی اجرای فرزندِ
`main` جدیدتر را می‌گیرد.

برای اعتبارسنجی شاخه یا tag انتشار، آن را از ref قابل‌اعتماد workflow روی `main`
اجرا کنید و شاخه یا tag انتشار را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک artifact
والد `release-package-under-test` برای بررسی‌های مرتبط با package آماده می‌کند، و
وقتی `release_profile=full` با `rerun_group=all` باشد یا وقتی `release_package_spec` یا
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل package Telegram را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker
مسیر انتشار وقتی soak فعال است، Package Acceptance با QA package Telegram،
همسانی QA Lab، Matrix زنده، و Telegram زنده را پخش می‌کند. یک اجرای کامل فقط وقتی قابل قبول است که
خلاصه `Full Release Validation`
موفقیت `normal_ci` و `release_checks` را نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all رد می‌شود
مگر اینکه `release_package_spec` یا `npm_telegram_package_spec` منتشرشده‌ای
ارائه شده باشد. خلاصه نهایی verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای workflow، تفاوت‌های profile پایدار در برابر کامل،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
workflowهای فرزند از ref قابل‌اعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای workflow-ref در Full Release Validation
وجود ندارد؛ harness قابل‌اعتماد را با انتخاب ref اجرای workflow انتخاب کنید.
برای اثبات دقیق commit روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت سنجاق‌شده استفاده کنید.

برای انتخاب گستره live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه پوشش پایدار provider/backend برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده provider/media مشورتی

وقتی laneهای مسدودکننده انتشار سبز هستند و پیش از promotion می‌خواهید sweep کامل live/E2E،
مسیر انتشار Docker، و upgrade-survivor منتشرشده محدود را داشته باشید، از
`run_release_soak=true` همراه با `stable` استفاده کنید. آن sweep آخرین چهار package پایدار به‌علاوه baselineهای
سنجاق‌شده `2026.4.23` و `2026.5.2` و همچنین پوشش قدیمی‌تر `2026.4.15` را
پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و هر baseline را در job runner
Docker جداگانه‌ای shard می‌کند. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ref قابل‌اعتماد workflow برای resolve کردن ref هدف
یک بار به‌عنوان `release-package-under-test` استفاده می‌کند و وقتی soak اجرا شود، همان artifact را در بررسی‌های cross-OS،
Package Acceptance، و Docker مسیر انتشار بازاستفاده می‌کند. این کار همه جعبه‌های مرتبط با package را روی همان bytes نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
پس از اینکه beta از قبل روی npm باشد، `release_package_spec=openclaw@YYYY.M.D-beta.N` را تنظیم کنید
تا بررسی‌های انتشار package ارسال‌شده را یک بار دانلود کنند، SHA منبع build آن را از
`dist/build-info.json` استخراج کنند، و همان artifact را برای laneهای cross-OS،
Package Acceptance، Docker مسیر انتشار، و package Telegram بازاستفاده کنند.
install smoke مربوط به cross-OS OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه `openai/gpt-5.4`، چون این lane
در حال اثبات نصب package، onboarding، راه‌اندازی Gateway، و یک turn عامل زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان محل
پوشش مختص مدل است.

بسته به مرحله انتشار، از این variantها استفاده کنید:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

پس از یک fix متمرکز، از umbrella کامل به‌عنوان اولین rerun استفاده نکنید. اگر یک جعبه
fail شد، برای اثبات بعدی از workflow فرزند، job، lane Docker، profile package، provider مدل،
یا lane QA ناموفق استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
fix، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه جعبه‌ها را
کهنه کرده باشد. verifier نهایی umbrella دوباره شناسه‌های ثبت‌شده اجرای workflow فرزند را بررسی می‌کند،
پس پس از اینکه workflow فرزند با موفقیت rerun شد، فقط job والد ناموفق
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به umbrella بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه جعبه‌های انتشار
را اجرا می‌کند، و گروه‌های انتشار باریک‌تر عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `release_package_spec` یا
`npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all با `release_profile=full` از
artifact package مربوط به release-checks استفاده می‌کنند. rerunهای متمرکز
cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
یک فیلتر OS/suite دیگر اضافه کنند. failureهای QA release-check مشورتی هستند؛ failure فقط-QA
اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

جعبه Vitest همان workflow فرزند `CI` دستی است. CI دستی عمدا
changed scoping را دور می‌زند و گراف آزمون عادی را برای release candidate اجبار می‌کند:
shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows،
macOS، Android، و i18n مربوط به Control UI.

از این جعبه برای پاسخ به «آیا درخت منبع suite کامل آزمون عادی را پاس کرد؟» استفاده کنید.
این با اعتبارسنجی محصول مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- اجرای سبز `CI` روی SHA دقیق هدف
- نام shardهای failشده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل عملکرد نیاز دارد

CI دستی را مستقیما فقط وقتی اجرا کنید که انتشار به CI عادی deterministic نیاز دارد اما
به جعبه‌های Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

جعبه Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت انتشار قرار دارد. این جعبه release candidate را از طریق محیط‌های Docker
packaged اعتبارسنجی می‌کند، نه فقط آزمون‌های سطح منبع.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با slow Bun global install smoke فعال
- آماده‌سازی/بازاستفاده image smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، همراه با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌صورت shardهای install-smoke جداگانه اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای split نصب/حذف bundled plugin
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای live/E2E provider و پوشش مدل live Docker وقتی بررسی‌های انتشار
  suiteهای live را شامل شوند

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار،
`.artifacts/docker-tests/` را همراه با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON plan scheduler، و commandهای rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow
live/E2E قابل‌بازاستفاده استفاده کنید. commandهای rerun تولیدشده وقتی در دسترس باشند شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده Docker هستند، بنابراین یک
lane ناموفق می‌تواند همان tarball و imageهای GHCR را بازاستفاده کند.

### QA Lab

جعبه QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار مربوط به
رفتار عامل‌محور و سطح channel است، جدا از Vitest و مکانیک package در Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane همسانی mock که lane کاندید OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- profile سریع Matrix QA زنده با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این جعبه برای پاسخ به «آیا انتشار در سناریوهای QA و flowهای channel زنده
درست رفتار می‌کند؟» استفاده کنید. هنگام تایید انتشار، URLهای artifact مربوط به laneهای parity، Matrix، و Telegram
را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی shardشده QA-Lab در دسترس است،
نه lane پیش‌فرض حیاتی برای انتشار.

### Package

جعبه Package، gate محصول نصب‌شدنی است. این جعبه با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
کاندید را به tarball `package-under-test` مصرف‌شده توسط Docker E2E نرمال می‌کند، inventory
package را اعتبارسنجی می‌کند، version package و SHA-256 را ثبت می‌کند، و ref مربوط به
harness workflow را از ref منبع package جدا نگه می‌دارد.

منابع کاندید پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک version دقیق انتشار OpenClaw
- `source=ref`: pack کردن یک شاخه، tag، یا SHA کامل commit مربوط به `package_ref` قابل‌اعتماد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS همراه با `package_sha256` الزامی
- `source=artifact`: بازاستفاده از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، آرتیفکت بسته انتشار آماده‌شده، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance مهاجرت، به‌روزرسانی،
راه‌اندازی مجدد به‌روزرسانی احراز هویت پیکربندی‌شده، نصب زنده Skill از ClawHub، پاک‌سازی وابستگی قدیمی Plugin، fixtureهای آفلاین Plugin، به‌روزرسانی Plugin و QA بسته Telegram را در برابر همان tarball حل‌شده نگه می‌دارد. بررسی‌های مسدودکننده انتشار از مبنای پیش‌فرض آخرین بسته منتشرشده استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` آن را به همه مبناهای پایدار منتشرشده در npm از
`2026.4.23` تا `latest` به‌همراه fixtureهای مسئله گزارش‌شده گسترش می‌دهد. برای یک نامزد از پیش منتشرشده از Package Acceptance با `source=npm` استفاده کنید، یا پیش از انتشار برای یک tarball محلی npm متکی به SHA از
`source=ref`/`source=artifact` استفاده کنید. این جایگزین بومی GitHub برای بیشتر پوشش بسته/به‌روزرسانی است که قبلا به Parallels نیاز داشت. بررسی‌های انتشار میان‌سیستم‌عاملی هنوز برای رفتارهای اختصاصی سیستم‌عامل در راه‌اندازی اولیه، نصب‌کننده و پلتفرم مهم‌اند، اما اعتبارسنجی محصول برای بسته/به‌روزرسانی باید Package Acceptance را ترجیح دهد.

چک‌لیست مرجع برای اعتبارسنجی به‌روزرسانی و Plugin در
[آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام مسیر محلی، Docker، Package Acceptance یا release-check تغییر نصب/به‌روزرسانی Plugin، پاک‌سازی doctor، یا مهاجرت بسته منتشرشده را اثبات می‌کند از آن استفاده کنید. مهاجرت به‌روزرسانی منتشرشده به‌صورت کامل از هر بسته پایدار `2026.4.23+` یک workflow دستی جداگانه با نام `Update Migration` است و بخشی از Full Release CI نیست.

نرم‌گیری قدیمی package-acceptance عمدا زمان‌دار است. بسته‌های تا
`2026.4.25` می‌توانند برای شکاف‌های فراداده‌ای که قبلا در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند: ورودی‌های موجودی QA خصوصی که از tarball جا افتاده‌اند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های قدیمی رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp فراداده build محلی که قبلا منتشر شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن بسته را رعایت کنند؛ همان شکاف‌ها در اعتبارسنجی انتشار شکست می‌خورند.

وقتی پرسش انتشار درباره یک بسته واقعا قابل‌نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

پروفایل‌های رایج بسته:

- `smoke`: مسیرهای سریع نصب بسته/کانال/agent، شبکه Gateway و بارگذاری مجدد پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی مجدد/بسته Plugin به‌همراه اثبات نصب زنده Skill از ClawHub؛ این پیش‌فرض release-check است
- `product`: `package` به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را روی Package Acceptance فعال کنید. این workflow، tarball حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ workflow مستقل Telegram همچنان برای بررسی‌های پس از انتشار یک spec منتشرشده npm را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` نقطه ورود معمول انتشار تغییردهنده است. این workflowهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. تگ انتشار را checkout می‌کند و SHA کامیت آن را حل می‌کند.
2. تأیید می‌کند که تگ از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا می‌کند.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch می‌کند.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch می‌کند.
6. `OpenClaw NPM Release` را با تگ انتشار، dist-tag npm و
   `preflight_run_id` ذخیره‌شده dispatch می‌کند.

نمونه انتشار بتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

انتشار پایدار به dist-tag پیش‌فرض beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ترفیع پایدار مستقیم به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release` را فقط برای تعمیر متمرکز یا انتشار دوباره استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود، workflow فرزند را مستقیما dispatch کنید.

## ورودی‌های workflow NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1` یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط اعتبارسنجی می‌تواند SHA کامل ۴۰ نویسه‌ای کامیت شاخه workflow فعلی نیز باشد
- `preflight_only`: `true` فقط برای اعتبارسنجی/build/بسته، `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ پیش‌فرض آن `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛ وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده تعمیر فقط Plugin استفاده می‌کنید آن را `false` بگذارید
- `wait_for_clawhub`: پیش‌فرض `false` است تا در دسترس بودن npm توسط sidecar مربوط به ClawHub مسدود نشود؛ فقط وقتی تکمیل workflow باید شامل تکمیل ClawHub باشد آن را `true` بگذارید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد.
- `run_release_soak`: انتخاب اجرای soak کامل live/E2E، مسیر انتشار Docker و upgrade-survivor از همه نسخه‌ها در بررسی‌های انتشار پایدار/پیش‌فرض. با `release_profile=full` اجباری روشن می‌شود.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- تگ‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛ workflow پیش از ادامه انتشار آن فراداده را تأیید می‌کند

## توالی انتشار پایدار npm

هنگام بریدن یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل کامیت شاخه workflow فعلی برای اجرای آزمایشی فقط اعتبارسنجی workflow preflight استفاده کنید
2. برای جریان عادی ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی عمدا انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی پوشش CI عادی به‌همراه prompt cache زنده، Docker، QA Lab،
   Matrix و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را روی شاخه انتشار، تگ انتشار یا SHA کامل کامیت اجرا کنید
4. اگر عمدا فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن workflow دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag` و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای externalized را پیش از ترفیع بسته npm OpenClaw در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` فرود آمد، از workflow خصوصی
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ترفیع آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیم به `latest` منتشر شد و `beta` باید بلافاصله همان build پایدار را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو dist-tag را به نسخه پایدار اشاره دهید، یا بگذارید همگام‌سازی خودترمیمی زمان‌بندی‌شده آن بعدا `beta` را جابه‌جا کند

جهش dist-tag به دلیل امنیت در repo خصوصی قرار دارد، چون هنوز به
`NPM_TOKEN` نیاز دارد، درحالی‌که repo عمومی انتشار فقط OIDC را نگه می‌دارد.

این کار هر دو مسیر انتشار مستقیم و مسیر ترفیع ابتدا-بتا را مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک maintainer مجبور شود به احراز هویت محلی npm fallback کند، هر فرمان 1Password CLI (`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را مستقیما از shell اصلی agent فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها، هشدارها و رسیدگی OTP قابل مشاهده باشند و از هشدارهای تکراری host جلوگیری می‌کند.

## مراجع عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

maintainerها برای runbook واقعی از مستندات انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
