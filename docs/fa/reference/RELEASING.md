---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، فهرست بررسی اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه‌ها و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-06T11:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده که به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند، یا وقتی صراحتاً درخواست شود در npm `latest`
- beta: برچسب‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار Beta: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پر نکنید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب beta فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتاً `latest` را هدف بگیرند، یا بعداً یک ساخت beta بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای beta معمولاً ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتاً درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از beta عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین beta دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخه `release/YYYY.M.D` که از
  `main` فعلی ساخته شده است انجام می‌دهند، تا اعتبارسنجی و اصلاحات انتشار
  توسعه جدید روی `main` را مسدود نکند
- اگر یک برچسب beta push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب beta قدیمی، برچسب بعدی `-beta.N` را می‌زنند
- رویه تفصیلی انتشار، تأییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag و جزئیات rollback اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه گرفت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و
   یک بار دیگر پیش از شاخه گرفتن rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داشته باشد، یا ثبت کنید چرا
   عمداً نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیماً روی `main` انجام ندهید.
5. همه محل‌های نسخه لازم را برای برچسب موردنظر افزایش دهید، سپس
   `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ نویسه‌ای شاخه انتشار برای پیش‌پرواز فقط اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده را
   که اصلاح را اثبات می‌کند دوباره اجرا کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای beta، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه متناظر `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را به
   ClawHub به‌صورت موازی dispatch می‌کند، و سپس مصنوع پیش‌پرواز آماده OpenClaw npm را
   به‌محض موفقیت انتشار Plugin در npm با dist-tag متناظر ترویج می‌کند.
   انتشار ClawHub ممکن است همچنان هنگام انتشار OpenClaw npm در حال اجرا باشد، اما
   گردش‌کار انتشار تا زمانی که هر دو مسیر انتشار Plugin و
   مسیر انتشار OpenClaw npm با موفقیت کامل نشده باشند پایان نمی‌یابد. پس از انتشار،
   پذیرش بسته پس از انتشار را در برابر بسته منتشرشده
   `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار متناظر بعدی را بسازید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه beta بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشت ادامه دهید. انتشار پایدار npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و مصنوع پیش‌پرواز موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدکننده پس از انتشار npm، E2E اختیاری Telegram مستقل
    برای published-npm وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل متناظر `CHANGELOG.md`، و گام‌های اعلام انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها خارج از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری خارج از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و باندل Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از تگ‌گذاری، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری همتای OpenClaw/API، فراداده build، و stubهای changelog مربوط به Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار هسته مطابق شوند. `pnpm plugins:sync:check` گارد انتشار بدون تغییر است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch، tag، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی، parity مربوط به QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای پایدار/پیش‌فرض، soak جامع live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید بسته npm منتشرشده را هم اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را در برابر بسته npm ارسال‌شده اجرا کند نه آرتیفکت ساخته‌شده از SHA، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش evidence خصوصی باید بدون اجبار Telegram E2E ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید هم‌زمان با ادامه کار انتشار، اثبات side-channel برای یک نامزد package داشته باشید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA مورد اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را در برابر همان tarball بازاستفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، آرتیفکت package همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از package نامزد هم به‌عنوان CLI نصب‌شده و هم package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده دستور update نامزد را اجرا کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و reload پیکربندی
  - `package`: laneهای package/update/restart/Plugin بومیِ آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: قطعه‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای یک rerun متمرکز
- وقتی فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید، workflow دستی `CI` را مستقیماً اجرا کنید. dispatchهای دستی CI از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP اجرا می‌کند و نام‌های span مربوط به trace صادرشده، attributeهای محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر تأیید می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود داشتن tag، برای توالی انتشار تغییردهنده، `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل‌دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را سریال می‌کند تا بسته هسته پیش از Pluginهای externalized خود منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane برابری mock مربوط به QA Lab به‌علاوه پروفایل سریع live Matrix و lane مربوط به QA تلگرام را اجرا می‌کند. laneهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره‌های credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل‌بازاستفاده `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیماً فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm کوتاه، قطعی، و متمرکز بر آرتیفکت می‌ماند، در حالی که بررسی‌های live کندتر در lane خودشان می‌مانند تا انتشار را معطل یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا SHA کامل commit را می‌پذیرد، مشروط بر اینکه commit resolve‌شده از یک branch یا tag انتشار OpenClaw قابل‌دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` همچنین SHA کامل ۴۰ کاراکتری commit فعلی workflow-branch را بدون نیاز به tag push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی promotion شود
- در حالت SHA، workflow فقط برای بررسی فراداده package، `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به یک tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون تغییر می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از هر دو secret مربوط به workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا tag متناظر beta/correction) را اجرا کنید
- پس از انتشار npm،
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه متناظر beta/correction) را اجرا کنید تا مسیر نصب registry منتشرشده در یک prefix موقت تازه تأیید شود
- پس از انتشار beta، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool اشتراکی credential تلگرام اجاره‌شده تأیید شود. اجراهای موردی محلی maintainerها می‌توانند varهای Convex را حذف کنند و سه credential env مربوط به `OPENCLAW_QA_TELEGRAM_*` را مستقیماً پاس دهند.
- برای اجرای full post-publish beta smoke از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. helper اعتبارسنجی Parallels npm update/fresh-target را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، آرتیفکت را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- Maintainerها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را پاس کرده باشد
  - انتشار واقعی npm باید از همان branch یعنی `main` یا `release/YYYY.M.D` که اجرای پیش‌پرواز موفق از آن انجام شده، dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` قرار می‌گیرند
  - انتشار پایدار npm می‌تواند از طریق ورودی workflow صراحتاً `latest` را هدف بگیرد
  - تغییر npm dist-tag مبتنی بر token اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی انتشار OIDC-only را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی tag فقط روی یک branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را پاس کرده باشد
  - مسیرهای انتشار واقعی آرتیفکت‌های آماده‌شده را promote می‌کنند، به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای stable correction مانند `YYYY.M.D-N`، verifier پس از انتشار همان مسیر upgrade با prefix موقت از `YYYY.M.D` به `YYYY.M.D-N` را هم بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` را شامل باشد، تا دوباره داشبورد مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را شکست می‌دهد و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball به‌روزرسانی نامزد اعمال می‌کند، تا installer e2e پیش از مسیر انتشار release، افزایش ناخواسته حجم pack را بگیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای timing مربوط به extension، یا ماتریس‌های تست extension دست زده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و بررسی کنید تا release notes یک چیدمان CI قدیمی را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های updater است:
  - release در GitHub باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip پایدار جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL غیرخالی feed مربوط به Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف build رسمی Sparkle برای آن نسخه انتشار را نگه دارد

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. برای اثبات commit پین‌شده روی branch سریعاً در حال تغییر، از
helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف
اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از آن branch با `ref=<sha>` dispatch می‌کند، تأیید می‌کند که `headSha`
هر workflow فرزند با هدف مطابقت دارد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref مورد اعتماد `main`
اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این گردش‌کار ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک
artifact والد `release-package-under-test` را برای بررسی‌های روبه‌روی بسته آماده می‌کند، و
وقتی `release_profile=full` با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را dispatch می‌کند. سپس
`OpenClaw Release Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش مسیر انتشار
زنده/E2E Docker وقتی soak فعال است، Package Acceptance با QA بسته Telegram، هم‌ترازی QA Lab،
Matrix زنده، و Telegram زنده را fan out می‌کند. اجرای کامل فقط وقتی قابل‌قبول است که خلاصه
`Full Release Validation`
موفقیت `normal_ci` و `release_checks` را نشان دهد. در حالت full/all، فرزند
`npm_telegram` هم باید موفق باشد؛ بیرون از full/all نادیده گرفته می‌شود، مگر اینکه یک
`npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه نهایی verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را بدون دانلود کردن logها ببیند.
برای ماتریس کامل stage، نام‌های دقیق job گردش‌کار، تفاوت‌های پروفایل stable در برابر full،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref مورداعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک branch یا tag انتشار قدیمی‌تر اشاره می‌کند. ورودی جداگانه‌ای برای workflow-ref مربوط به Full Release Validation وجود ندارد؛ با انتخاب ref اجرای گردش‌کار، harness مورداعتماد را انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک، از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، پس از
`pnpm ci:full-release --sha <sha>` استفاده کنید تا branch موقت پین‌شده ساخته شود.

از `release_profile` برای انتخاب گستره زنده/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر زنده و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده provider/media مشورتی

وقتی laneهای مسدودکننده انتشار سبز هستند و پیش از ارتقا، sweep جامع زنده/E2E، مسیر انتشار Docker، و upgrade-survivor منتشرشده کران‌دار را می‌خواهید، از `run_release_soak=true` همراه `stable` استفاده کنید. آن sweep چهار بسته stable اخیر به‌علاوه baselineهای پین‌شده `2026.4.23` و `2026.5.2` و پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و هر baseline را در job runner Docker جداگانه‌ای shard می‌کند. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ref مورداعتماد گردش‌کار استفاده می‌کند تا ref هدف را یک‌بار به‌عنوان `release-package-under-test` resolve کند و هنگام اجرای soak همان artifact را در بررسی‌های cross-OS، Package Acceptance، و Docker مسیر انتشار دوباره به کار ببرد. این کار همه boxهای روبه‌روی بسته را روی همان byteها نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
Install smoke مربوط به OpenAI در cross-OS وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane نصب بسته، onboarding، startup مربوط به Gateway، و یک نوبت agent زنده را اثبات می‌کند، نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان محل پوشش مدل‌محور است.

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

پس از یک fix متمرکز، از چتر کامل به‌عنوان اولین rerun استفاده نکنید. اگر یک box شکست خورد، برای اثبات بعدی از گردش‌کار فرزند شکست‌خورده، job، lane مربوط به Docker، پروفایل بسته، provider مدل، یا lane مربوط به QA استفاده کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که fix orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه boxها را کهنه کرده باشد. verifier نهایی چتر، شناسه‌های ثبت‌شده اجرای گردش‌کار فرزند را دوباره بررسی می‌کند، بنابراین پس از اینکه یک گردش‌کار فرزند با موفقیت rerun شد، فقط job والد شکست‌خورده
`Verify full validation` را rerun کنید.

برای بازیابی کران‌دار، `rerun_group` را به چتر پاس بدهید. `all` اجرای واقعی release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند، و گروه‌های محدودتر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
Rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all با `release_profile=full` از artifact بسته release-checks استفاده می‌کنند. Rerunهای متمرکز cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا یک فیلتر OS/suite دیگر اضافه کنند. شکست‌های QA release-check مشورتی هستند؛ شکست فقط-QA اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

Box مربوط به Vitest گردش‌کار فرزند `CI` دستی است. CI دستی عمدا scoping بر اساس تغییرات را دور می‌زند و graph تست عادی را برای release candidate اجباری می‌کند: shardهای Linux Node، shardهای Pluginهای bundled، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Skills پایتون، Windows، macOS، Android، و Control UI i18n.

از این box برای پاسخ به «آیا source tree کل test suite عادی را پاس کرد؟» استفاده کنید.
این همان اعتبارسنجی محصول در مسیر انتشار نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatchشده را نشان می‌دهد
- اجرای سبز `CI` روی SHA دقیق هدف
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که انتشار به CI عادی deterministic نیاز دارد، اما به boxهای Docker، QA Lab، زنده، cross-OS، یا بسته نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه گردش‌کار
`install-smoke` در حالت release قرار دارد. این box release candidate را از طریق محیط‌های Docker بسته‌بندی‌شده validate می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- install smoke کامل با smoke نصب global کند Bun فعال
- آماده‌سازی/استفاده مجدد image smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E repository
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk مربوط به `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای جداشده نصب/uninstall مربوط به Pluginهای bundled
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زنده Docker وقتی release checks شامل suiteهای زنده باشد

پیش از rerun کردن از artifactهای Docker استفاده کنید. Scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler، و commandهای rerun upload می‌کند. برای بازیابی متمرکز، روی گردش‌کار reusable زنده/E2E به‌جای rerun کردن همه chunkهای انتشار، از
`docker_lanes=<lane[,lane]>` استفاده کنید. Commandهای rerun تولیدشده وقتی موجود باشند، ورودی‌های قبلی `package_artifact_run_id` و imageهای Docker آماده‌شده را شامل می‌شوند، تا یک lane شکست‌خورده بتواند همان tarball و imageهای GHCR را دوباره به کار ببرد.

### QA Lab

Box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic و سطح channel برای انتشار است، جدا از Vitest و مکانیک بسته Docker.

پوشش QA Lab انتشار شامل این موارد است:

- lane هم‌ترازی mock که lane کاندید OpenAI را با baseline مربوط به Opus 4.6 با استفاده از بسته هم‌ترازی agentic مقایسه می‌کند
- پروفایل QA سریع Matrix زنده با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به «آیا انتشار در سناریوهای QA و جریان‌های channel زنده درست رفتار می‌کند؟» استفاده کنید. هنگام تایید انتشار، URLهای artifact مربوط به laneهای parity، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای manual sharded QA-Lab در دسترس است، نه lane پیش‌فرض حیاتی برای انتشار.

### بسته

Box مربوط به بسته gate محصول قابل‌نصب است. پشتوانه آن
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` است. Resolver یک کاندید را به tarball
`package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند، inventory بسته را validate می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند، و ref harness گردش‌کار را از ref source بسته جدا نگه می‌دارد.

Sourceهای کاندید پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا نسخه دقیق انتشار OpenClaw
- `source=ref`: pack کردن یک branch، tag، یا SHA کامل commit مربوط به `package_ref` مورداعتماد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده مجدد از یک `.tgz` uploadشده توسط اجرای دیگر GitHub Actions

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
و `telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance مهاجرت، update،
restart مربوط به update با auth پیکربندی‌شده، پاک‌سازی dependency کهنه Plugin، fixtureهای Plugin آفلاین، update Plugin، و QA بسته Telegram را در برابر همان tarball resolveشده نگه می‌دارد. Release checkهای مسدودکننده از baseline پیش‌فرض آخرین بسته منتشرشده استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` این را به همه baselineهای stable منتشرشده npm از
`2026.4.23` تا `latest` به‌علاوه fixtureهای issue گزارش‌شده گسترش می‌دهد. برای کاندیدی که قبلا shipped شده است از Package Acceptance با `source=npm` استفاده کنید، یا برای tarball محلی npm با پشتوانه SHA پیش از publish، از
`source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native برای بیشتر پوشش بسته/update است که قبلا به Parallels نیاز داشت. Release checkهای cross-OS همچنان برای onboarding، installer، و رفتار platform مخصوص OS اهمیت دارند، اما اعتبارسنجی محصول بسته/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin، [تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance، یا release-check نصب/update یک Plugin، پاک‌سازی doctor، یا تغییر مهاجرت بسته منتشرشده را اثبات می‌کند، از آن استفاده کنید.
مهاجرت جامع update منتشرشده از هر بسته stable `2026.4.23+` یک گردش‌کار manual جداگانه به نام `Update Migration` است، و بخشی از Full Release CI نیست.

نرمش پذیرش بسته‌های قدیمی عمدا دارای بازه زمانی محدود است. بسته‌ها تا
`2026.4.25` می‌توانند برای شکاف‌های فراداده‌ای که از پیش در npm منتشر شده‌اند
از مسیر سازگاری استفاده کنند: ورودی‌های خصوصی موجودی QA که در tarball نیستند،
نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از
tarball، نبود `update.channel` پایدارشده، مکان‌های قدیمی install-record مربوط به
plugin، نبود پایداری install-record مربوط به marketplace، و مهاجرت فراداده
پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای
فایل‌های stamp فراداده ساخت محلی که از پیش ارسال شده‌اند هشدار بدهد. بسته‌های
بعدی باید قراردادهای مدرن بسته را رعایت کنند؛ همان شکاف‌ها باعث شکست اعتبارسنجی
انتشار می‌شوند.

وقتی پرسش انتشار درباره یک بسته قابل‌نصب واقعی است، از پروفایل‌های گسترده‌تر
پذیرش بسته استفاده کنید:

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
  ClawHub زنده؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی
  وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram مربوط به نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در پذیرش بسته فعال کنید. workflow، tarball
حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ workflow مستقل Telegram
همچنان برای بررسی‌های پس از انتشار، یک مشخصات منتشرشده npm را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` ورودی عادی انتشار تغییردهنده است. این workflow‌های
ناشر مورداعتماد را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout و SHA کامیت آن را حل کنید.
2. بررسی کنید tag از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` اجرا کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA اجرا کنید.
6. `OpenClaw NPM Release` را با tag انتشار، dist-tag مربوط به npm، و
   `preflight_run_id` ذخیره‌شده اجرا کنید.

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

ارتقای پایدار مستقیم به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک plugin
انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا زمانی که بسته OpenClaw نباید منتشر شود،
workflow فرزند را مستقیما اجرا کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، می‌تواند برای preflight
  صرفا اعتبارسنجی، SHA کامل ۴۰ نویسه‌ای کامیت شاخه workflow فعلی نیز باشد
- `preflight_only`: مقدار `true` برای فقط اعتبارسنجی/ساخت/بسته، مقدار `false`
  برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball
  آماده‌شده در اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: tag هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر
  متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با ویرگول، وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط زمانی `false` تنظیم کنید که
  از workflow به‌عنوان هماهنگ‌کننده تعمیر فقط plugin استفاده می‌کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا tag انتشار قابل دسترسی باشد.
- `run_release_soak`: برای بررسی‌های پایدار/پیش‌فرض انتشار، soak جامع
  زنده/E2E، مسیر انتشار Docker، و بازمانده ارتقای all-since را فعال می‌کند.
  با `release_profile=full` اجباری می‌شود.

قواعد:

- tagهای پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- tagهای پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی
  هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight
  استفاده شده بود؛ workflow پیش از ادامه انتشار، آن فراداده را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام آماده‌سازی یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل کامیت شاخه workflow فعلی برای یک
     اجرای خشک صرفا اعتبارسنجی از workflow مربوط به preflight استفاده کنید
2. برای جریان عادی ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمدا انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی می‌خواهید CI عادی به‌علاوه پوشش زنده prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک workflow دستی داشته باشید، `Full Release Validation`
   را روی شاخه انتشار، tag انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمدا فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن workflow دستی
   `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار پیش از ارتقای بسته npm
   مربوط به OpenClaw، pluginهای خارجی‌شده را در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیما به `latest` منتشر شد و `beta` باید فورا همان ساخت
   پایدار را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو dist-tag
   به نسخه پایدار اشاره کنند، یا اجازه دهید همگام‌سازی خودترمیم زمان‌بندی‌شده آن
   بعدا `beta` را جابه‌جا کند

تغییر dist-tag به‌دلایل امنیتی در repo خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط با OIDC را نگه می‌دارد.

این کار هر دو مسیر انتشار مستقیم و مسیر ارتقای ابتدا-بتا را مستند و برای
اپراتور قابل مشاهده نگه می‌دارد.

اگر یک maintainer ناچار شود به احراز هویت محلی npm برگردد، هر دستور CLI مربوط
به 1Password (`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را مستقیما
از shell عامل اصلی فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان جلوگیری
می‌کند.

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

maintainerها برای runbook واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
