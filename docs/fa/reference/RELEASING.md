---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و چرخه انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، محیط‌های اعتبارسنجی، نام‌گذاری نسخه‌ها و چرخه زمانی
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-03T21:38:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده‌ای که به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند، یا وقتی صریحا درخواست شود در npm `latest`
- beta: برچسب‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سرِ متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند؛ گردانندگان انتشار می‌توانند صریحا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه Mac برای پایدار نگه داشته می‌شود مگر اینکه صریحا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` که
  از `main` فعلی ساخته شده است انجام می‌دهند، تا اعتبارسنجی انتشار و اصلاحات مانع
  توسعه جدید روی `main` نشود
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب بتای قدیمی، برچسب `-beta.N` بعدی را می‌سازند
- رویه تفصیلی انتشار، تاییدیه‌ها، گواهی‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست گرداننده انتشار

این چک‌لیست شکل عمومی جریان انتشار است. گواهی‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag، و جزئیات بازگردانی اضطراری در
راهنمای اجرای انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commitها با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و پیش از شاخه‌سازی
   یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمدا نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. همه محل‌های نسخه لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰کاراکتری شاخه انتشار برای پیش‌پرواز صرفا اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، ارائه‌دهنده، یا allowlist مدل شکست‌خورده را
   که اصلاح را اثبات می‌کند دوباره اجرا کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییریافته
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه منطبق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تایید می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان
   مجموعه را در مرحله دوم به‌صورت tarballهای npm-pack مربوط به ClawPack در ClawHub منتشر می‌کند، و سپس
   artifact آماده پیش‌پرواز npm مربوط به OpenClaw را با dist-tag منطبق ترویج می‌کند. پس از
   انتشار، پذیرش بسته پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار منطبق بعدی را بسازید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتا یا کاندیدای انتشار بررسی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار npm پایدار نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و با استفاده از
    `preflight_run_id` از artifact موفق پیش‌پرواز دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تاییدکننده پس از انتشار npm، آزمون اختیاری E2E مستقل
    Telegram منتشرشده از npm وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از بخش
    کامل و منطبق `CHANGELOG.md`، و گام‌های اعلام انتشار
    را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها بیرون از دروازه سریع‌تر محلی `pnpm check` نیز پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از دروازه سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی بسته‌بندی وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از برچسب‌گذاری، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری peer/API مربوط به OpenClaw، فراداده ساخت، و stubهای changelog مربوط به Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار هسته هماهنگ شوند. `pnpm plugins:sync:check` نگهبان انتشار غیرتغییردهنده است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک entrypoint آغاز شوند. این workflow یک شاخه، برچسب، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، زمانی `npm_telegram_package_spec` را ارائه کنید که همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند. پس از انتشار، زمانی `package_acceptance_package_spec` را ارائه کنید که Package Acceptance باید ماتریس package/update خود را به‌جای آرتیفکت ساخته‌شده از SHA، در برابر بسته npm ارسال‌شده اجرا کند. زمانی `evidence_package_spec` را ارائه کنید که گزارش private evidence باید بدون اجبار Telegram E2E اثبات کند که اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- workflow دستی `Package Acceptance` را زمانی اجرا کنید که می‌خواهید در حین ادامه کار انتشار، اثبات side-channel برای یک نامزد بسته داشته باشید. از `source=npm` برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار استفاده کنید؛ از `source=ref` برای بسته‌بندی یک شاخه/برچسب/SHA مطمئن `package_ref` با harness فعلی `workflow_ref` استفاده کنید؛ از `source=url` برای یک tarball HTTPS با SHA-256 الزامی استفاده کنید؛ یا از `source=artifact` برای tarballی که توسط اجرای دیگری از GitHub Actions آپلود شده است استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای نصب/channel/agent، شبکه Gateway، و بارگذاری مجدد config
  - `package`: laneهای package/update/plugin بومی آرتیفکت بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌همراه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای یک اجرای مجدد متمرکز
- زمانی workflow دستی `CI` را مستقیم اجرا کنید که فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید. dispatchهای دستی CI از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را اجباری اجرا می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌دهد و نام‌های span مربوط به trace خروجی، attributeهای محدودشده، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار برچسب‌دار، `pnpm release:check` را اجرا کنید
- پس از وجود داشتن برچسب، `OpenClaw Release Publish` را برای توالی انتشار تغییردهنده اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید، یا زمانی که یک برچسب قابل دسترسی از main را منتشر می‌کنید از `main` dispatch کنید، برچسب انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک ترمیم متمرکز را اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار Plugin در ClawHub، و انتشار npm مربوط به OpenClaw را به‌صورت ترتیبی انجام می‌دهد تا بسته هسته پیش از Pluginهای externalized خود منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane برابری mock مربوط به QA Lab به‌همراه پروفایل live سریع Matrix و lane QA مربوط به Telegram را اجرا می‌کند. laneهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره credential مربوط به Convex CI استفاده می‌کند. زمانی workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید که می‌خواهید موجودی کامل transport، media، و E2EE مربوط به Matrix به‌صورت موازی اجرا شود.
- اعتبارسنجی runtime نصب و ارتقا در سیستم‌عامل‌های مختلف بخشی از workflow عمومی `OpenClaw Release Checks` و `Full Release Validation` است که workflow reusable زیر را مستقیم فراخوانی می‌کنند:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر آرتیفکت نگه می‌دارد، در حالی که بررسی‌های live کندتر در lane خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release Validation` یا از ref workflow مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک شاخه، برچسب، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک شاخه OpenClaw یا برچسب انتشار قابل دسترسی باشد
- پیش‌پرواز فقط‌اعتبارسنجی `OpenClaw NPM Release` نیز SHA کامل ۴۰ کاراکتری commit شاخه workflow فعلی را بدون نیاز به برچسب pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده بسته `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به یک برچسب انتشار واقعی نیاز دارد
- هر دو workflow مسیر واقعی انتشار و promotion را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` را اجرا کنید
  (یا برچسب beta/correction متناظر را)
- پس از انتشار npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  را اجرا کنید
  (یا نسخه beta/correction متناظر را) تا مسیر نصب registry منتشرشده در یک prefix موقت تازه بررسی شود
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool مشترک credential اجاره‌ای Telegram بررسی شود. maintainerها برای اجراهای موردی محلی می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم بدهند.
- maintainerها می‌توانند همین بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm داشته باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا `release/YYYY.M.D` dispatch شود که اجرای پیش‌پرواز موفق از آن بوده است
  - انتشارهای پایدار npm به‌طور پیش‌فرض روی `beta` هستند
  - انتشار پایدار npm می‌تواند از طریق ورودی workflow به‌صورت صریح `latest` را هدف بگیرد
  - تغییر npm dist-tag مبتنی بر token اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی انتشار فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط‌اعتبارسنجی است؛ وقتی یک برچسب فقط روی شاخه release وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را داشته باشد
  - مسیرهای واقعی انتشار، آرتیفکت‌های آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار مسیر ارتقای temp-prefix یکسان را از `YYYY.M.D` به `YYYY.M.D-N` نیز بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball شامل هر دو payload یعنی `dist/control-ui/index.html` و `dist/control-ui/assets/` غیرخالی باشد، تا دوباره یک dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند در verifier پس از انتشار شکست می‌خورد و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball به‌روزرسانی نامزد enforce می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، pack bloat تصادفی را می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا ماتریس‌های آزمون extension دست زده است، پیش از تأیید خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و بازبینی کنید تا release notes یک layout قدیمی CI را توصیف نکند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های updater است:
  - انتشار GitHub باید در نهایت `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - پس از انتشار، `appcast.xml` روی `main` باید به zip پایدار جدید اشاره کند
  - اپ بسته‌بندی‌شده باید bundle id غیرdebug، URL غیرخالی Sparkle feed، و `CFBundleVersion` برابر یا بالاتر از کف canonical build مربوط به Sparkle برای آن نسخه انتشار را حفظ کند

## جعبه‌های آزمون انتشار

`Full Release Validation` روشی است که operatorها با آن همه آزمون‌های پیش از انتشار را از
یک entrypoint آغاز می‌کنند. برای اثبات commit پین‌شده روی شاخه‌ای که سریع تغییر می‌کند، از
helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper شاخه `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از آن شاخه با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha`
هر workflow فرزند با هدف مطابقت داشته باشد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی
اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه یا برچسب انتشار، آن را از ref workflow مطمئن `main` اجرا کنید
و شاخه یا برچسب انتشار را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش‌کار ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، artifact والد
`release-package-under-test` را برای بررسی‌های ناظر به package آماده می‌کند، و
E2E مستقل Telegram برای package را وقتی `release_profile=full` با
`rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد dispatch می‌کند. سپس `OpenClaw Release
Checks` به install smoke، بررسی‌های انتشار میان‌سیستم‌عاملی، پوشش live/E2E Docker
در مسیر انتشار، Package Acceptance با QA برای package Telegram، هم‌ارزی QA Lab،
Matrix زنده، و Telegram زنده fan out می‌شود. اجرای کامل فقط وقتی قابل قبول است که
خلاصه `Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، مگر اینکه
`npm_telegram_package_spec` منتشرشده ارائه شده باشد، skip می‌شود. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا release manager
بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام دقیق jobهای workflow، تفاوت‌های profile پایدار در برابر کامل،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref مورد اعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی ref هدف به branch یا tag
انتشار قدیمی‌تری اشاره کند. ورودی جداگانه‌ای برای workflow-ref مربوط به Full Release Validation
وجود ندارد؛ harness مورد اعتماد را با انتخاب ref اجرای workflow انتخاب کنید.
برای proof دقیق commit روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند workflow dispatch ref باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ایجاد branch موقت pinned استفاده کنید.

برای انتخاب گستره live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار، مربوط به OpenAI/core
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تأیید انتشار
- `full`: stable به‌علاوه پوشش گسترده advisory provider/media

`OpenClaw Release Checks` از workflow ref مورد اعتماد استفاده می‌کند تا ref هدف را
یک‌بار به‌صورت `release-package-under-test` resolve کند و از همان artifact هم در
بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره استفاده می‌کند. این کار همه boxهای ناظر به package را روی همان byteها نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
install smoke میان‌سیستم‌عاملی OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، زیرا این lane
در حال اثبات نصب package، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده است
نه benchmark کردن کندترین model پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان محل پوشش model-specific است.

بسته به stage انتشار از این variantها استفاده کنید:

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

از umbrella کامل به‌عنوان نخستین rerun پس از یک اصلاح متمرکز استفاده نکنید. اگر یک box
fail شد، برای proof بعدی از workflow فرزند fail‌شده، job، lane Docker، profile package، provider model، یا lane QA استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
اصلاح، orchestration مشترک انتشار را تغییر داده باشد یا شواهد all-box قبلی را stale کرده باشد.
verifier نهایی umbrella شناسه‌های ضبط‌شده اجرای workflow فرزند را دوباره بررسی می‌کند، بنابراین پس از rerun موفق یک workflow فرزند، فقط job والد fail‌شده
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به umbrella پاس بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند،
و گروه‌های انتشار باریک‌تر عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact package مربوط به release-checks استفاده می‌کنند.

### Vitest

box مربوط به Vitest همان workflow فرزند `CI` دستی است. CI دستی عمدا
scoping مبتنی بر changed را دور می‌زند و graph تست عادی را برای release candidate اجباری می‌کند:
shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows،
macOS، Android، و i18n مربوط به Control UI.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree کل test suite عادی را پاس کرده است؟»
این همان اعتبارسنجی product در مسیر انتشار نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای dispatch‌شده `CI` را نشان می‌دهد
- اجرای سبز `CI` روی SHA دقیق هدف
- نام shardهای fail‌شده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای timing مربوط به Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که انتشار به CI عادی deterministic نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت release قرار دارد. این box release candidate را از طریق محیط‌های packaged
Docker اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن smoke نصب global کند Bun
- آماده‌سازی/استفاده مجدد از image smoke برای Dockerfile ریشه بر اساس SHA هدف، با jobهای smoke مربوط به QR،
  root/gateway، و installer/Bun که به‌صورت shardهای install-smoke جداگانه اجرا می‌شوند
- laneهای E2E repository
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` در صورت درخواست
- laneهای split نصب/حذف نصب bundled Plugin
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider live/E2E و پوشش model زنده Docker وقتی release checks
  شامل suiteهای live باشد

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار،
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`,
timingهای phase، JSON طرح scheduler، و دستورهای rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow قابل استفاده مجدد live/E2E استفاده کنید. دستورهای rerun تولیدشده در صورت موجود بودن شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده‌شده Docker هستند، تا یک
lane fail‌شده بتواند از همان tarball و imageهای GHCR دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic
و سطح channel برای انتشار است، جدا از Vitest و مکانیک package در Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane هم‌ارزی mock که lane کاندیدای OpenAI را با baseline مربوط به Opus 4.6
  با استفاده از pack هم‌ارزی agentic مقایسه می‌کند
- profile سریع QA برای Matrix زنده با استفاده از محیط `qa-live-shared`
- lane QA برای Telegram زنده با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به proof محلی صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URLهای artifact مربوط به laneهای parity، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی sharded QA-Lab در دسترس است، نه lane پیش‌فرض حیاتی برای انتشار.

### Package

box مربوط به Package، gate محصول قابل نصب است. پشتوانه آن
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` است. resolver یک candidate را به tarball
`package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند، inventory package را اعتبارسنجی می‌کند،
نسخه package و SHA-256 را ثبت می‌کند، و ref مربوط به workflow harness را از ref منبع package جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: pack کردن branch، tag، یا SHA کامل commit مربوط به `package_ref` مورد اعتماد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` مبتنی بر HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده مجدد از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`،
artifact آماده‌شده package انتشار، `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance مهاجرت، update، پاک‌سازی dependencyهای stale Plugin، fixtureهای offline Plugin، update Plugin، و QA برای package Telegram را در برابر همان tarball resolve‌شده نگه می‌دارد. ماتریس upgrade هر baseline پایدار منتشرشده در npm از `2026.4.23` تا `latest` را پوشش می‌دهد؛ برای candidateای که قبلا shipped شده است از Package Acceptance با `source=npm` استفاده کنید، یا
برای tarball محلی npm با پشتوانه SHA پیش از publish از `source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native
برای بیشتر پوشش package/update است که قبلا به Parallels نیاز داشت.
بررسی‌های انتشار cross-OS همچنان برای رفتارهای onboarding، installer، و platform خاص OS مهم هستند، اما اعتبارسنجی product مربوط به package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin، [تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance، یا release-check یک تغییر نصب/update Plugin، پاک‌سازی doctor، یا مهاجرت package منتشرشده را اثبات می‌کند، از آن استفاده کنید.
مهاجرت exhaustive published update از هر package پایدار `2026.4.23+` یک workflow دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

leniency قدیمی package-acceptance عمدا زمان‌بندی محدود دارد. packageها تا
`2026.4.25` می‌توانند برای gapهای metadata که قبلا در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند:
entryهای خصوصی inventory مربوط به QA که در tarball نیستند، نبود
`gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball،
نبود `update.channel` persisted، محل‌های legacy برای install-record مربوط به Plugin،
نبود persistence برای marketplace install-record، و مهاجرت metadata پیکربندی طی `plugins update`. package منتشرشده `2026.4.26` ممکن است
برای فایل‌های stamp مربوط به metadata build محلی که قبلا shipped شده‌اند warning بدهد. packageهای بعدی
باید قراردادهای package مدرن را برآورده کنند؛ همان gapها در اعتبارسنجی انتشار fail می‌شوند.

وقتی پرسش انتشار درباره یک package واقعا قابل نصب است، از profileهای گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

profileهای رایج package:

- `smoke`: مسیرهای سریع نصب بسته/کانال/agent، شبکهٔ Gateway، و بارگذاری دوبارهٔ پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/بستهٔ Plugin بدون ClawHub زنده؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوبارهٔ متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این گردش‌کار فایل tarball حل‌شدهٔ
`package-under-test` را به مسیر Telegram می‌دهد؛ گردش‌کار مستقل
Telegram همچنان برای بررسی‌های پس از انتشار، یک مشخصات npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار نسخه

`OpenClaw Release Publish` نقطهٔ ورود عادی انتشار تغییردهنده است. این گردش‌کار،
گردش‌کارهای ناشر معتمد را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را check out کنید و SHA کامیت آن را حل کنید.
2. تأیید کنید که tag از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان دامنه و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با tag انتشار، dist-tag در npm، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

نمونهٔ انتشار Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

انتشار Stable به dist-tag پیش‌فرض beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ارتقای Stable مستقیماً به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کارهای تعمیر یا انتشار دوبارهٔ متمرکز استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا هنگامی که بستهٔ
OpenClaw نباید منتشر شود، گردش‌کار فرزند را مستقیماً dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ هنگامی که `preflight_only=true` است، می‌تواند SHA کامل ۴۰نویسه‌ای کامیت شاخهٔ گردش‌کار فعلی برای preflight فقط اعتبارسنجی نیز باشد
- `preflight_only`: `true` برای فقط اعتبارسنجی/ساخت/بسته، `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار از tarball آماده‌شدهٔ اجرای موفق preflight دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسهٔ اجرای موفق preflight از `OpenClaw NPM Release`؛
  هنگامی که `publish_openclaw_npm=true` است الزامی است
- `npm_dist_tag`: tag هدف npm برای بستهٔ OpenClaw
- `plugin_publish_scope`: مقدار پیش‌فرض `all-publishable` است؛ فقط
  برای کار تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بستهٔ `@openclaw/*` جداشده با کاما هنگامی که
  `plugin_publish_scope=selected` است
- `publish_openclaw_npm`: مقدار پیش‌فرض `true` است؛ فقط هنگامی آن را `false` تنظیم کنید که از گردش‌کار به‌عنوان هماهنگ‌کنندهٔ تعمیر فقط Plugin استفاده می‌کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند کامیت حل‌شده از یک شاخهٔ OpenClaw یا tag انتشار قابل دسترسی باشد.

قواعد:

- tagهای Stable و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- tagهای پیش‌انتشار Beta فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط هنگامی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight استفاده شده است؛
  گردش‌کار پیش از ادامهٔ انتشار آن metadata را تأیید می‌کند

## توالی انتشار Stable در npm

هنگام ساخت یک انتشار Stable در npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل کامیت شاخهٔ گردش‌کار فعلی برای اجرای آزمایشی فقط اعتبارسنجی گردش‌کار preflight استفاده کنید
2. برای جریان عادی beta-first، `npm_dist_tag=beta` را انتخاب کنید، یا فقط هنگامی `latest` را انتخاب کنید که عمداً انتشار مستقیم Stable می‌خواهید
3. هنگامی که پوشش عادی CI به‌همراه prompt cache زنده، Docker، QA Lab،
   Matrix، و Telegram را از یک گردش‌کار دستی می‌خواهید، `Full Release Validation` را روی شاخهٔ انتشار، tag انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن گردش‌کار دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای externalized را پیش از ارتقای بستهٔ npm مربوط به OpenClaw در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخهٔ Stable از `beta` به `latest` استفاده کنید
8. اگر انتشار عمداً مستقیماً روی `latest` منتشر شد و `beta`
   باید فوراً همان ساخت Stable را دنبال کند، از همان گردش‌کار خصوصی استفاده کنید تا هر دو dist-tag را به نسخهٔ Stable اشاره دهید، یا اجازه دهید همگام‌سازی خودترمیمی زمان‌بندی‌شدهٔ آن بعداً `beta` را جابه‌جا کند

جهش dist-tag به‌دلایل امنیتی در مخزن خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، در حالی که مخزن عمومی انتشار فقط OIDC را نگه می‌دارد.

این کار هر دو مسیر انتشار مستقیم و مسیر ارتقای beta-first را مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک maintainer ناچار است به احراز هویت محلی npm برگردد، هر فرمان 1Password
CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کند. `op` را
مستقیماً از پوستهٔ اصلی agent فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان جلوگیری شود.

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

maintainerها برای runbook واقعی از مستندات انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
