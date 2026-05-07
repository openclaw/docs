---
read_when:
    - در جستجوی تعاریف کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه‌ها و چرخهٔ انتشار هستید
summary: مسیرهای انتشار، چک‌لیست اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه‌ها و ریتم زمانی
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-07T13:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده‌ای که به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صریحا درخواست شود با `latest` منتشر می‌شوند
- beta: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار stable: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی stable: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار beta: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر آغازین ننویسید
- `latest` یعنی انتشار stable فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب beta فعلی
- انتشارهای stable و اصلاحی stable به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صریحا `latest` را هدف بگیرند، یا بعدا یک ساخت beta بررسی‌شده را ترویج کنند
- هر انتشار stable از OpenClaw، بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای beta معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه mac برای stable نگه داشته می‌شود مگر اینکه صریحا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از beta پیش می‌روند
- stable فقط پس از اعتبارسنجی آخرین beta دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` که
  از `main` فعلی ساخته شده می‌سازند، تا اعتبارسنجی انتشار و اصلاح‌ها توسعه
  جدید روی `main` را مسدود نکند
- اگر یک برچسب beta push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی برچسب beta قدیمی، برچسب بعدی `-beta.N` را می‌سازند
- رویه انتشار تفصیلی، تاییدیه‌ها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag و جزئیات بازگشت اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید که commit هدف push شده است،
   و تایید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commitها با
   `/changelog` بازنویسی کنید، مدخل‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   پیش از ساخت شاخه یک بار دیگر rebase/pull کنید.
3. سوابق سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` مرور کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمدا
   نگه داشته می‌شود.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار معمول انتشار را
   مستقیما روی `main` انجام ندهید.
5. همه مکان‌های نسخه لازم را برای برچسب مورد نظر افزایش دهید، سپس
   `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار، نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری شاخه انتشار برای پیش‌پرواز فقط-اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش‌انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit شروع کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، کار workflow، پروفایل بسته، ارائه‌دهنده، یا allowlist مدل شکست‌خورده را دوباره اجرا کنید که
   اصلاح را ثابت می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را کهنه کند.
9. برای beta، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این workflow، `pnpm plugins:sync:check` را تایید می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را به
   ClawHub به‌صورت موازی dispatch می‌کند، و سپس artifact پیش‌پرواز آماده OpenClaw npm را
   با dist-tag مطابق به‌محض موفقیت انتشار Plugin در npm ترویج می‌کند.
   انتشار ClawHub ممکن است همچنان هنگام انتشار OpenClaw npm در حال اجرا باشد، اما
   workflow انتشار تا زمانی که هر دو مسیر انتشار Plugin و
   مسیر انتشار OpenClaw npm با موفقیت کامل نشده باشند تمام نمی‌شود. پس از انتشار،
   پذیرش بسته پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشته باشد،
   شماره پیش‌انتشار مطابق بعدی را بسازید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای stable، فقط پس از آن ادامه دهید که beta بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار stable در npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود، با استفاده دوباره از artifact پیش‌پرواز موفق از طریق
    `preflight_run_id`؛ آمادگی انتشار stable macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، اعتبارسنج پس از انتشار npm، E2E اختیاری Telegram منتشرشده-در-npm مستقل
    وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های release/prerelease در GitHub از
    بخش کامل و مطابق `CHANGELOG.md`، و مراحل اعلان انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها بیرون از gate سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از gate سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه root و پیش از تگ‌گذاری، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری peer/API با OpenClaw، فراداده build، و stubهای changelog مربوط به Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار core مطابقت داشته باشند. `pnpm plugins:sync:check` نگهبان انتشار بدون تغییر است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش‌انتشار از یک نقطه ورود آغاز شوند. این workflow یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های بسته cross-OS، همسانی QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. اجراهای stable/default، live/E2E جامع و soak مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین package Telegram E2E را روی artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند، `npm_telegram_package_spec` را ارائه دهید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را به‌جای artifact ساخته‌شده از SHA روی بسته npm ارسال‌شده اجرا کند، `package_acceptance_package_spec` را ارائه دهید. وقتی گزارش شواهد خصوصی باید بدون اجبار Telegram E2E ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، `evidence_package_spec` را ارائه دهید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید در حالی که کار انتشار ادامه دارد، proof جانبی برای یک package candidate داشته باشید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای pack کردن یک شاخه/تگ/SHA معتبر `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball HTTPS با SHA-256 اجباری از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow candidate را به `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان tarball بازاستفاده می‌کند، و می‌تواند Telegram QA را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، artifact بسته همان candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از بسته candidate هم به‌عنوان CLI نصب‌شده و هم package-under-test استفاده می‌کند تا مسیر managed restart فرمان update مربوط به candidate را تمرین دهد.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای نصب/channel/agent، شبکه Gateway، و بارگذاری مجدد config
  - `package`: laneهای package/update/restart/Plugin بومی artifact بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- وقتی فقط به پوشش CI عادی کامل برای release candidate نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای CI دستی از scoping مبتنی بر تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Plugin باندل‌شده، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace صادرشده، attributeهای کران‌دار، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر تأیید می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود داشتن تگ، `OpenClaw Release Publish` را برای توالی انتشار تغییردهنده اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا وقتی تگی را منتشر می‌کنید که از `main` قابل دسترسی است، از `main`)، تگ انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک تعمیر متمرکز اجرا می‌کنید. این workflow انتشار npm برای Plugin، انتشار ClawHub برای Plugin، و انتشار npm برای OpenClaw را به‌صورت serial اجرا می‌کند تا بسته core پیش از Pluginهای externalized خود منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane همسانی mock مربوط به QA Lab به‌علاوه پروفایل سریع Matrix زنده و lane مربوط به Telegram QA را اجرا می‌کند. laneهای زنده از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره credentialهای Convex CI استفاده می‌کند. وقتی موجودی کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime برای نصب و ارتقای cross-OS بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است، که workflow قابل بازاستفاده `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر artifact نگه دارید، در حالی که بررسی‌های زنده کندتر در lane خودشان باقی می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از ref workflow مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده باقی بمانند
- `OpenClaw Release Checks` یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolve‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` همچنین SHA کامل ۴۰ کاراکتری commit شاخه workflow فعلی را بدون نیاز به تگ push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده package مقدار `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به یک تگ انتشار واقعی نیاز دارد
- هر دو workflow مسیر واقعی انتشار و promotion را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون تغییر می‌تواند از runnerهای Linux بزرگ‌تر Blacksmith استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا تگ beta/correction متناظر) را اجرا کنید
- پس از انتشار npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه beta/correction متناظر) را اجرا کنید تا مسیر نصب registry منتشرشده در یک prefix موقت تازه تأیید شود
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool اشتراکی credential اجاره‌ای Telegram تأیید شود. اجراهای موردی maintainer محلی می‌توانند متغیرهای Convex را حذف کنند و سه credential env مربوط به `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس دهند.
- برای اجرای smoke کامل beta پس از انتشار از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. helper اعتبارسنجی Parallels npm update/fresh-target را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، artifact را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- maintainerها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک npm `preflight_run_id` موفق را گذرانده باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا `release/YYYY.M.D` که اجرای موفق preflight از آن dispatch شده بود dispatch شود
  - انتشارهای npm پایدار به‌طور پیش‌فرض روی `beta` هستند
  - انتشار npm پایدار می‌تواند از طریق input workflow صریحاً `latest` را هدف بگیرد
  - تغییر npm dist-tag مبتنی بر token اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی انتشار فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک تگ فقط روی شاخه release قرار دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac را گذرانده باشد
  - مسیرهای انتشار واقعی به‌جای build دوباره، artifactهای آماده‌شده را promote می‌کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌سروصدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` داشته باشد تا دوباره dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را کم داشته باشد، verifier پس از انتشار را شکست می‌دهد و نمی‌تواند به `latest` ارتقا داده شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball candidate update اعمال می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، pack bloat تصادفی را تشخیص می‌دهد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا ماتریس‌های تست extension دست زده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` بازتولید و بازبینی کنید تا release notes یک layout قدیمی CI را توصیف نکند
- آمادگی انتشار macOS پایدار همچنین شامل سطح‌های updater است:
  - GitHub release باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - پس از انتشار، `appcast.xml` روی `main` باید به zip پایدار جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL غیرخالی feed مربوط به Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف build رسمی Sparkle برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش‌انتشار را از یک نقطه ورود آغاز می‌کنند. برای proof مربوط به commit پین‌شده روی شاخه‌ای که سریع حرکت می‌کند، از helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper شاخه `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن شاخه با `ref=<sha>` dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با هدف مطابقت دارد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه انتشار یا تگ، آن را از ref workflow معتبر `main` اجرا کنید و شاخه انتشار یا تگ را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این workflow ارجاع هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک
artifact والد `release-package-under-test` را برای بررسی‌های package-facing آماده می‌کند، و
وقتی `release_profile=full` با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، package Telegram E2E مستقل را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker
release-path هنگام فعال بودن soak، Package Acceptance همراه با Telegram
package QA، همسانی QA Lab، Matrix زنده و Telegram زنده را گسترش می‌دهد. اجرای کامل فقط وقتی قابل قبول است که
خلاصه `Full Release Validation`
موفقیت `normal_ci` و `release_checks` را نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ بیرون از full/all، این مورد رد می‌شود
مگر اینکه `npm_telegram_package_spec` منتشرشده‌ای ارائه شده باشد. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام دقیق jobهای workflow، تفاوت‌های پروفایل stable و full،
artifactها، و handleهای rerun متمرکز، به [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) مراجعه کنید.
workflowهای فرزند از ارجاع trusted که `Full Release
Validation` را اجرا می‌کند dispatch می‌شوند، معمولاً `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره می‌کند. ورودی جداگانه‌ای برای Full Release Validation
workflow-ref وجود ندارد؛ harness trusted را با انتخاب ارجاع اجرای workflow انتخاب کنید.
برای proof دقیق commit روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند ارجاع dispatch workflow باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ایجاد شاخه موقت pinned استفاده کنید.

برای انتخاب گستره live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار در OpenAI/core
- `stable`: minimum به‌علاوه پوشش stable provider/backend برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده provider/media advisory

وقتی laneهای مسدودکننده انتشار سبز هستند و پیش از promotion، sweep جامع live/E2E، Docker release-path، و
upgrade-survivor منتشرشده محدود را می‌خواهید، از `run_release_soak=true` همراه با `stable` استفاده کنید. آن sweep
چهار package stable جدید به‌علاوه baselineهای pinned `2026.4.23` و `2026.5.2`
و پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری حذف می‌شوند و
هر baseline در job جداگانه Docker runner خودش sharding می‌شود. `full` به‌طور ضمنی
`run_release_soak=true` است.

`OpenClaw Release Checks` از ارجاع workflow trusted برای resolve کردن یک‌باره ارجاع هدف
به‌صورت `release-package-under-test` استفاده می‌کند و هنگام اجرای soak همان artifact را در بررسی‌های cross-OS،
Package Acceptance، و release-path Docker بازاستفاده می‌کند. این کار همه
boxهای package-facing را روی همان bytes نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
install smoke مربوط به OpenAI در cross-OS وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند،
در غیر این صورت از `openai/gpt-5.4`، چون این lane
در حال اثبات نصب package، onboarding، راه‌اندازی gateway، و یک turn agent زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده
محل پوشش model-specific باقی می‌ماند.

بسته به مرحله انتشار از این variantها استفاده کنید:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

پس از یک fix متمرکز، از umbrella کامل به‌عنوان اولین rerun استفاده نکنید. اگر یک box
fail شد، برای proof بعدی از workflow فرزند failشده، job، lane Docker، پروفایل package، model
provider، یا lane QA استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
fix ارکستراسیون مشترک انتشار را تغییر داده باشد یا evidence قبلی همه boxها را
stale کرده باشد. verifier نهایی umbrella شناسه‌های ثبت‌شده اجرای workflow فرزند را دوباره بررسی می‌کند،
بنابراین پس از rerun موفق یک workflow فرزند، فقط job والد failشده
`Verify full validation` را rerun کنید.

برای recovery محدود، `rerun_group` را به umbrella بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند normal CI را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند، و گروه‌های انتشار
محدودتر `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram` هستند.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact package مربوط به release-checks استفاده می‌کنند. rerunهای متمرکز
cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
filter دیگری برای OS/suite اضافه کنند. failureهای QA در release-check advisory هستند؛ failure فقط در QA
اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

box مربوط به Vitest همان workflow فرزند `CI` دستی است. CI دستی عمداً
changed scoping را دور می‌زند و گراف test معمول را برای release
candidate اجباری می‌کند: shardهای Linux Node، shardهای bundled-Plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Python
skills، Windows، macOS، Android، و Control UI i18n.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree از full normal test suite عبور کرد؟»
این با اعتبارسنجی product در release-path یکی نیست. Evidenceهایی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatchشده را نشان می‌دهد
- اجرای `CI` سبز روی SHA دقیق هدف
- نام shardهای failشده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیماً اجرا کنید که انتشار به normal CI قطعی نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت release قرار دارد. این box release candidate را از طریق محیط‌های Docker
packaged اعتبارسنجی می‌کند، نه فقط testهای سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن slow Bun global install smoke
- آماده‌سازی/بازاستفاده image smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E repository
- chunkهای release-path Docker: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- laneهای split bundled Plugin install/uninstall
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش model زنده Docker وقتی release checks
  شامل suiteهای live باشد

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مربوط به release-path،
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler، و دستورهای rerun upload می‌کند. برای recovery متمرکز،
به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow قابل‌بازاستفاده live/E2E استفاده کنید.
دستورهای rerun تولیدشده، وقتی موجود باشند، شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده Docker هستند، تا یک
lane failشده بتواند همان tarball و imageهای GHCR را بازاستفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار
برای رفتار agentic و سطح channel است، جدا از mechanics مربوط به Vitest و Docker
package.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane همسانی mock که lane کاندید OpenAI را با baseline Opus 4.6
  با استفاده از بسته همسانی agentic مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به proof محلی explicit نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در scenarioهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact برای laneهای parity، Matrix، و Telegram
را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی sharded QA-Lab
در دسترس است، نه lane پیش‌فرض release-critical.

### Package

box مربوط به Package همان gate محصول قابل نصب است. پشتوانه آن
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` است. resolver یک
candidate را به tarball `package-under-test` مصرف‌شده توسط Docker E2E نرمال‌سازی می‌کند، inventory
package را اعتبارسنجی می‌کند، version و SHA-256 package را ثبت می‌کند، و
ارجاع harness workflow را از ارجاع source package جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا version دقیق انتشار OpenClaw
- `source=ref`: pack کردن شاخه، tag، یا SHA کامل commit مربوط به `package_ref` trusted
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS با `package_sha256` الزامی
- `source=artifact`: بازاستفاده از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact
package انتشار آماده‌شده، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance migration، update،
restart مربوط به configured-auth update، پاکسازی dependency stale Plugin، fixtureهای Plugin آفلاین،
update Plugin، و QA package Telegram را در برابر همان tarball resolveشده نگه می‌دارد. release checkهای مسدودکننده از baseline
پیش‌فرض آخرین package منتشرشده استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` به هر baseline stable منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوه fixtureهای issue گزارش‌شده گسترش می‌یابد. برای candidateای که قبلاً shipped شده است از
Package Acceptance با `source=npm` استفاده کنید، یا پیش از
publish، برای tarball محلی npm با پشتوانه SHA از `source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native
برای بیشتر پوشش package/update است که قبلاً به
Parallels نیاز داشت. بررسی‌های انتشار cross-OS همچنان برای onboarding، installer،
و رفتار platform مخصوص OS مهم هستند، اما اعتبارسنجی محصول package/update باید
Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin،
[آزمون updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری اینکه کدام
lane محلی، Docker، Package Acceptance، یا release-check یک
install/update مربوط به Plugin، پاکسازی doctor، یا تغییر migration در package منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration کامل update منتشرشده از هر package stable `2026.4.23+`
یک workflow دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

انعطاف‌پذیری قدیمی پذیرش بسته عمداً زمان‌دار شده است. بسته‌ها تا نسخه
`2026.4.25` ممکن است برای شکاف‌های فراداده‌ای که از قبل در npm منتشر شده‌اند
از مسیر سازگاری استفاده کنند: ورودی‌های خصوصی موجودی QA که در tarball نیستند،
نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده
از tarball، نبود `update.channel` پایدارشده، مکان‌های قدیمی رکورد نصب plugin،
نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی هنگام
`plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp
فراداده build محلی که از قبل منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید
قراردادهای مدرن بسته را رعایت کنند؛ همان شکاف‌ها باعث شکست اعتبارسنجی انتشار
می‌شوند.

وقتی پرسش انتشار درباره یک بسته واقعاً قابل نصب است، از پروفایل‌های گسترده‌تر
Package Acceptance استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/عامل، شبکه Gateway، و بارگذاری دوباره
  پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی دوباره/بسته plugin بدون
  ClawHub زنده؛ این مقدار پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی
  وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram در نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این
گردش‌کار tarball حل‌شده `package-under-test` را به مسیر Telegram پاس می‌دهد؛
گردش‌کار مستقل Telegram همچنان یک مشخصه npm منتشرشده را برای بررسی‌های پس از
انتشار می‌پذیرد.

## خودکارسازی انتشار نسخه

`OpenClaw Release Publish` نقطه ورود عادی انتشار تغییردهنده است. این مورد
گردش‌کارهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. تگ انتشار را checkout می‌کند و SHA کامیت آن را حل می‌کند.
2. بررسی می‌کند که تگ از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا می‌کند.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch می‌کند.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch می‌کند.
6. `OpenClaw NPM Release` را با تگ انتشار، dist-tag مربوط به npm، و
   `preflight_run_id` ذخیره‌شده dispatch می‌کند.

نمونه انتشار بتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

انتشار پایدار به dist-tag پیش‌فرض بتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ارتقای پایدار مستقیماً به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک plugin
انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
گردش‌کار فرزند را مستقیماً dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط جهت
  اعتبارسنجی می‌تواند SHA کامل ۴۰کاراکتری کامیت شاخه گردش‌کار فعلی نیز باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/build/بسته، و مقدار
  `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار از tarball
  آماده‌شده از اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛ وقتی
  `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: مقدار پیش‌فرض `all-publishable` است؛ فقط برای کار
  تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام بسته‌های `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: مقدار پیش‌فرض `true` است؛ فقط وقتی از گردش‌کار به
  عنوان هماهنگ‌کننده تعمیر فقط برای plugin استفاده می‌کنید مقدار `false` را
  تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  مستلزم آن هستند که کامیت حل‌شده از یک شاخه OpenClaw یا تگ انتشار قابل
  دسترسی باشد.
- `run_release_soak`: در بررسی‌های پایدار/پیش‌فرض انتشار، پوشش کامل live/E2E،
  مسیر انتشار Docker، و soak بازمانده ارتقا برای همه نسخه‌ها از ابتدا را فعال
  می‌کند. با `release_profile=full` اجباراً فعال می‌شود.

قوانین:

- تگ‌های پایدار و اصلاحی می‌توانند یا به `beta` یا به `latest` منتشر شوند
- تگ‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط برای
  اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight
  استفاده شده است؛ گردش‌کار پیش از ادامه انتشار آن فراداده را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام ساخت یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل کامیت شاخه گردش‌کار فعلی برای یک
     اجرای آزمایشی فقط اعتبارسنجی از گردش‌کار preflight استفاده کنید
2. برای جریان عادی ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمداً انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی می‌خواهید CI عادی به‌علاوه پوشش live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک گردش‌کار دستی داشته باشید، `Full Release
   Validation` را روی شاخه انتشار، تگ انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن گردش‌کار دستی
   `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار pluginهای externalized را
   پیش از ارتقای بسته npm OpenClaw به npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمداً مستقیماً به `latest` منتشر شد و `beta` باید فوراً همان
   build پایدار را دنبال کند، از همان گردش‌کار خصوصی استفاده کنید تا هر دو
   dist-tag را به نسخه پایدار اشاره دهد، یا اجازه دهید همگام‌سازی خودترمیمی
   زمان‌بندی‌شده آن بعداً `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در مخزن خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، در حالی که مخزن عمومی انتشار فقط با OIDC را حفظ می‌کند.

این کار هر دو مسیر انتشار مستقیم و مسیر ارتقای ابتدا-بتا را مستند و برای
اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm برگردد، هر فرمان
1Password CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را
مستقیماً از shell عامل اصلی فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود
promptها، هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان
جلوگیری می‌کند.

## ارجاع‌های عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

نگه‌دارندگان برای runbook واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
