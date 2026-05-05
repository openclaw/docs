---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه‌ها و آهنگ انتشار هستید
summary: مسیرهای انتشار، فهرست بررسی اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-05T06:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده که به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm `latest`
- beta: برچسب‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پیشوند نکنید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` جدا می‌کنند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی انتشار و اصلاحات مانع توسعه
  جدید روی `main` نشود
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب بتای قدیمی، برچسب بعدی `-beta.N` را جدا می‌کنند
- رویه تفصیلی انتشار، تاییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات بازگردانی اضطراری در
کتابچه اجرایی انتشار مخصوص نگه‌دارندگان باقی می‌مانند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه گرفت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commitها با
   `/changelog` بازنویسی کنید، مدخل‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و
   یک بار دیگر پیش از شاخه‌گیری rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شود، یا ثبت کنید چرا
   عمدا حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌بررسی محلی قطعی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری شاخه انتشار برای پیش‌بررسی فقط جهت اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه بزرگ آزمون انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده را که
   اصلاح را اثبات می‌کند دوباره اجرا کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تایید می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان
   مجموعه را در گام دوم به‌صورت tarballهای ClawPack npm-pack در ClawHub منتشر می‌کند، و سپس
   artifact پیش‌بررسی npm آماده OpenClaw را با dist-tag مطابق ترویج می‌کند. پس از
   انتشار، پذیرش بسته پس از انتشار را در برابر بسته منتشرشده
   `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار مطابق بعدی را جدا کنید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتای بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` عبور می‌کند و artifact پیش‌بررسی موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تاییدکننده پس از انتشار npm، آزمون اختیاری E2E مستقل
    Telegram از npm منتشرشده را وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و مطابق `CHANGELOG.md`، و گام‌های اعلان انتشار را اجرا کنید.

## پیش‌بررسی انتشار

- اجرای `pnpm check:test-types` را پیش از پیش‌پرواز انتشار انجام دهید تا TypeScript تست‌ها بیرون از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- اجرای `pnpm check:architecture` را پیش از پیش‌پرواز انتشار انجام دهید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از گیت سریع‌تر محلی سبز باشند
- اجرای `pnpm build && pnpm ui:build` را پیش از `pnpm release:check` انجام دهید تا مصنوعات انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی بسته‌بندی وجود داشته باشند
- اجرای `pnpm plugins:sync` را پس از افزایش نسخه ریشه و پیش از تگ‌گذاری انجام دهید. این کار نسخه‌های بسته Plugin قابل انتشار، فراداده سازگاری همتای/API OpenClaw، فراداده build، و پیش‌نویس‌های changelog Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار هسته هماهنگ شوند. `pnpm plugins:sync:check` محافظ انتشار غیرتغییردهنده است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر registry شکست می‌خورد.
- workflow دستی `Full Release Validation` را پیش از تأیید انتشار اجرا کنید تا همه جعبه‌های تست پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک شاخه، تگ، یا SHA کامل commit می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های بسته میان‌سیستمی، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای stable/default، soak کامل live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین package Telegram E2E را در برابر مصنوع `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند، `npm_telegram_package_spec` را ارائه دهید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را در برابر بسته npm ارسال‌شده اجرا کند نه مصنوع ساخته‌شده از SHA، `package_acceptance_package_spec` را ارائه دهید. وقتی گزارش خصوصی شواهد باید ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده منطبق است بدون اینکه Telegram E2E اجباری شود، `evidence_package_spec` را ارائه دهید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- workflow دستی `Package Acceptance` را وقتی اجرا کنید که هم‌زمان با ادامه کار انتشار، به اثبات جانبی برای یک نامزد بسته نیاز دارید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای بسته‌بندی یک شاخه/تگ/SHA مورد اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. workflow نامزد را به `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند Telegram QA را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، مصنوع بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از بسته نامزد هم به‌عنوان CLI نصب‌شده و هم package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده فرمان update نامزد را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای نصب/channel/agent، شبکه Gateway، و بارگذاری دوباره config
  - `package`: laneهای package/update/restart/plugin بومیِ مصنوع، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای دوباره متمرکز
- workflow دستی `CI` را مستقیماً وقتی اجرا کنید که فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید. dispatchهای دستی CI از scoping مبتنی بر تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک دریافت‌کننده محلی OTLP/HTTP تمرین می‌دهد و نام‌های span مربوط به trace صادرشده، ویژگی‌های محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا گردآورنده خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از موجود شدن تگ، `OpenClaw Release Publish` را برای توالی انتشار تغییردهنده اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا وقتی یک تگ قابل‌دسترسی از main منتشر می‌شود، از `main`)، تگ انتشار و `preflight_run_id` موفق npm OpenClaw را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً در حال اجرای یک تعمیر متمرکز باشید. این workflow انتشار npm Plugin، انتشار ClawHub Plugin، و انتشار npm OpenClaw را سریالی می‌کند تا بسته هسته پیش از Pluginهای خارجی‌شده‌اش منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین lane برابری mock مربوط به QA Lab به‌علاوه پروفایل سریع Matrix زنده و lane Telegram QA را پیش از تأیید انتشار اجرا می‌کند. laneهای زنده از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره‌نامه‌های credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، رسانه، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل‌استفاده‌مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیماً فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر artifact نگه دارید، در حالی که بررسی‌های زنده کندتر در lane خودشان باقی می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک شاخه OpenClaw یا تگ انتشار قابل‌دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` نیز SHA کامل ۴۰کاراکتری commit شاخه workflow فعلی را بدون نیاز به تگ pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده بسته `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به یک تگ انتشار واقعی نیاز دارد
- هر دو workflow مسیر واقعی publish و promotion را روی runnerهای میزبانی‌شده GitHub نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا تگ beta/correction منطبق) را اجرا کنید
- پس از انتشار npm، برای بررسی مسیر نصب registry منتشرشده در یک prefix موقت تازه، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه beta/correction منطبق) را اجرا کنید
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool مشترک credential اجاره‌شده Telegram بررسی شود. اجراهای موردی محلی maintainer می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیماً پاس دهند.
- برای اجرای smoke کامل beta پس از انتشار از یک ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی Parallels npm update/fresh-target را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، artifact را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- maintainers می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک npm `preflight_run_id` موفق را پاس کرده باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا `release/YYYY.M.D` مانند اجرای preflight موفق dispatch شود
  - انتشارهای stable npm به‌طور پیش‌فرض به `beta` می‌روند
  - انتشار stable npm می‌تواند با input مربوط به workflow صراحتاً `latest` را هدف بگیرد
  - تغییر مبتنی بر token برای npm dist-tag اکنون به دلایل امنیتی در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی publish فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک تگ فقط روی شاخه release وجود دارد اما workflow از `main` dispatch شده است، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق مربوط به private mac را پاس کرده باشد
  - مسیرهای انتشار واقعی artifactهای آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را rebuild کنند
- برای انتشارهای correction stable مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با prefix موقت از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا اصلاحات انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload stable پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت بسته شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` داشته باشد تا دوباره یک داشبورد مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده بسته در layout نصب‌شده registry حاضر باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را شکست می‌دهد و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین budget مربوط به npm pack `unpackedSize` را روی tarball update نامزد اعمال می‌کند، بنابراین installer e2e پیش از مسیر publish انتشار، bloat تصادفی بسته را می‌گیرد
- اگر کار انتشار به planning مربوط به CI، manifestهای زمان‌بندی extension، یا ماتریس‌های تست extension دست زده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و بازبینی کنید تا release notes یک layout قدیمی CI را توصیف نکند
- آمادگی انتشار stable macOS همچنین شامل سطح‌های updater است:
  - GitHub release باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip جدید stable اشاره کند
  - برنامه بسته‌بندی‌شده باید یک bundle id غیر-debug، یک URL غیرخالی feed مربوط به Sparkle، و یک `CFBundleVersion` در حد یا بالاتر از کف canonical build مربوط به Sparkle برای آن نسخه انتشار را حفظ کند

## جعبه‌های تست انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از یک نقطه ورود آغاز می‌کنند. برای اثبات commit پین‌شده روی شاخه‌ای که سریع حرکت می‌کند، از helper استفاده کنید تا هر workflow فرزند از یک شاخه موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن شاخه با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند با هدف منطبق باشد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه انتشار یا تگ، آن را از workflow ref مورد اعتماد `main` اجرا کنید و شاخه انتشار یا تگ را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این workflow، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک
artifact والد `release-package-under-test` برای بررسی‌های مربوط به بسته آماده می‌کند، و
وقتی `release_profile=full` همراه با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را dispatch می‌کند.
سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E مسیر انتشار Docker
هنگام فعال بودن soak، Package Acceptance همراه با QA بسته Telegram، برابری QA Lab،
Matrix زنده و Telegram زنده را fan out می‌کند. یک اجرای کامل فقط زمانی قابل قبول است که
خلاصه `Full Release Validation`
نشان دهد `normal_ci` و `release_checks` موفق بوده‌اند. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، نادیده گرفته می‌شود
مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام دقیق jobهای workflow، تفاوت‌های پروفایل stable و full،
artifactها و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
workflowهای فرزند از ref معتمدی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی ref هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای workflow-ref مربوط به Full Release Validation
وجود ندارد؛ harness معتمد را با انتخاب ref اجرای workflow انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت pinned استفاده کنید.

برای انتخاب گستره live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر release-critical برای OpenAI/core live و Docker
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش advisory گسترده provider/media

وقتی laneهای مسدودکننده انتشار سبز هستند و می‌خواهید پیش از promotion، sweep جامع
live/E2E، مسیر انتشار Docker و upgrade-survivor منتشرشده bounded را اجرا کنید، از
`run_release_soak=true` همراه با `stable` استفاده کنید. آن sweep چهار بسته stable
آخر را به‌علاوه baselineهای pinned `2026.4.23` و `2026.5.2`
و همچنین پوشش قدیمی‌تر `2026.4.15` دربر می‌گیرد، baselineهای تکراری حذف می‌شوند و
هر baseline در job runner مستقل Docker خودش shard می‌شود. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ref معتمد workflow استفاده می‌کند تا ref هدف را
یک‌بار به‌صورت `release-package-under-test` resolve کند و هنگام اجرای soak، همان artifact را در بررسی‌های cross-OS،
Package Acceptance و Docker مسیر انتشار reuse کند. این کار همه boxهای مربوط به بسته را
روی همان bytes نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
install smoke cross-OS OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، زیرا این lane
در حال اثبات نصب بسته، onboarding، startup Gateway و یک turn زنده agent است
نه benchmark گرفتن از کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده
همچنان محل پوشش model-specific باقی می‌ماند.

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

از umbrella کامل به‌عنوان اولین rerun پس از یک fix متمرکز استفاده نکنید. اگر یک box
fail شد، برای اثبات بعدی از workflow فرزند fail شده، job، lane Docker، پروفایل بسته،
model provider یا lane QA استفاده کنید. umbrella کامل را فقط زمانی دوباره اجرا کنید
که fix، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی all-box را
stale کرده باشد. verifier نهایی umbrella، idهای ثبت‌شده اجرای workflow فرزند را
دوباره بررسی می‌کند، بنابراین پس از rerun موفق یک workflow فرزند، فقط job والد fail شده
`Verify full validation` را rerun کنید.

برای بازیابی bounded، `rerun_group` را به umbrella پاس دهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI معمولی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند release-only Plugin را اجرا می‌کند، `release-checks` همه boxهای انتشار
را اجرا می‌کند، و گروه‌های باریک‌تر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live` و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بسته release-checks استفاده می‌کنند. rerunهای متمرکز
cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
فیلتر OS/suite دیگری اضافه کنند. failureهای QA release-check advisory هستند؛ failure فقط QA
اعتبارسنجی انتشار را block نمی‌کند.

### Vitest

box مربوط به Vitest، workflow فرزند `CI` دستی است. CI دستی عمدا
changed scoping را دور می‌زند و test graph معمول را برای release candidate
اجباری می‌کند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Python
skills، Windows، macOS، Android و i18n مربوط به Control UI.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree مجموعه کامل تست معمول را پاس کرد؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch شده را نشان می‌دهد
- اجرای `CI` سبز روی SHA دقیق هدف
- نام shardهای fail شده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط زمانی مستقیما اجرا کنید که انتشار به CI معمول deterministic نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت release قرار دارد. این box release candidate را از طریق محیط‌های Docker
بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل همراه با فعال بودن slow Bun global install smoke
- آماده‌سازی/reuse ایمیج smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، همراه با jobهای smoke مربوط به QR،
  root/gateway و installer/Bun که به‌صورت shardهای install-smoke جداگانه اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g` و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- laneهای جداشده نصب/حذف bundled Plugin
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده live/E2E و پوشش مدل زنده Docker وقتی release checks
  suiteهای live را شامل شوند

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler و commandهای rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow قابل reuse live/E2E
استفاده کنید. commandهای rerun تولیدشده، وقتی موجود باشد، شامل
`package_artifact_run_id` قبلی و ورودی‌های prepared Docker image هستند، بنابراین یک
lane fail شده می‌تواند از همان tarball و imageهای GHCR reuse کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار
رفتار agentic و سطح channel است، جدا از Vitest و mechanics بسته Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane برابری mock که lane کاندید OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential در Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact مربوط به laneهای parity،
Matrix و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی sharded QA-Lab
در دسترس است، نه lane پیش‌فرض release-critical.

### بسته

box مربوط به بسته، gate محصول قابل نصب است. این box توسط
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند، inventory بسته را
اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند و ref مربوط به workflow harness را از ref منبع بسته
جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: pack کردن یک شاخه، tag، یا SHA کامل commit مربوط به `package_ref` معتمد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS همراه با `package_sha256` الزامی
- `source=artifact`: reuse یک `.tgz` که توسط اجرای GitHub Actions دیگری upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته انتشار آماده‌شده،
`suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update،
restart پس از configured-auth update، cleanup وابستگی stale Plugin، fixtureهای Plugin آفلاین،
update Plugin و QA بسته Telegram را روی همان tarball resolve شده نگه می‌دارد. release checkهای blocking
از baseline پیش‌فرض آخرین بسته منتشرشده استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` آن را به همه baselineهای stable منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوه fixtureهای reported-issue گسترش می‌دهد. برای candidateای که قبلا shipped شده است از
Package Acceptance با `source=npm` استفاده کنید، یا پیش از publish برای یک tarball محلی npm با پشتوانه SHA از
`source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native
برای بیشتر پوشش package/update است که قبلا به Parallels نیاز داشت.
بررسی‌های انتشار cross-OS همچنان برای onboarding، installer و رفتار platform-specific
مهم هستند، اما اعتبارسنجی محصول package/update باید Package Acceptance را
ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin در
[تست کردن updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام
تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance یا release-check یک
نصب/update Plugin، cleanup در doctor، یا تغییر migration بسته منتشرشده را ثابت می‌کند، از آن استفاده کنید.
migration جامع update منتشرشده از هر بسته stable `2026.4.23+`
یک workflow دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

سهل‌گیری قدیمی package-acceptance عمداً در یک بازه زمانی محدود نگه داشته شده است. بسته‌ها تا
`2026.4.25` ممکن است برای شکاف‌های فراداده‌ای که از پیش در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند:
ورودی‌های خصوصی موجودی QA که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، محل‌های قدیمی رکورد نصب plugin،
نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی
هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp فراداده ساخت محلی که قبلاً ارسال شده‌اند هشدار دهد. بسته‌های بعدی
باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها در اعتبارسنجی انتشار شکست می‌خورند.

وقتی پرسش انتشار درباره یک بسته واقعاً قابل نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/عامل، شبکه Gateway، و بارگذاری دوباره پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی دوباره/بسته plugin بدون ClawHub زنده؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. workflow،
tarball حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ workflow مستقل
Telegram همچنان برای بررسی‌های پس از انتشار یک مشخصه npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` نقطه ورود عادی انتشار تغییردهنده است. این workflowهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout می‌کند و SHA کامیت آن را حل می‌کند.
2. تأیید می‌کند که tag از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا می‌کند.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch می‌کند.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch می‌کند.
6. `OpenClaw NPM Release` را با tag انتشار، dist-tag npm، و
   `preflight_run_id` ذخیره‌شده dispatch می‌کند.

نمونه انتشار beta:

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

ارتقای پایدار مستقیم به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کار تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک plugin منتخب،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
workflow فرزند را مستقیماً dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، همچنین می‌تواند SHA کامیت کامل ۴۰ کاراکتری شاخه workflow فعلی برای preflight صرفاً اعتبارسنجی باشد
- `preflight_only`: مقدار `true` برای فقط اعتبارسنجی/ساخت/بسته، مقدار `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده در اجرای موفق preflight دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ پیش‌فرض آن `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای موفق preflight مربوط به `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: tag هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده تعمیر فقط-plugin استفاده می‌کنید آن را `false` بگذارید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا tag انتشار قابل دسترسی باشد.
- `run_release_soak`: در بررسی‌های انتشار پایدار/پیش‌فرض، soak جامع live/E2E، مسیر انتشار Docker، و all-since upgrade-survivor را فعال می‌کند. با `release_profile=full` اجباری می‌شود.

قواعد:

- tagهای پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- tagهای prerelease بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛
  workflow پیش از ادامه انتشار آن فراداده را تأیید می‌کند

## توالی انتشار پایدار npm

هنگام ساخت یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل کامیت شاخه workflow فعلی برای یک اجرای خشک صرفاً اعتبارسنجی workflow preflight استفاده کنید
2. برای جریان عادی beta-first مقدار `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی عمداً انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی پوشش CI عادی به‌علاوه live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را روی شاخه انتشار، tag انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن workflow دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار pluginهای externalized را پیش از ارتقای بسته npm OpenClaw به npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` نشست، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   استفاده کنید تا آن نسخه پایدار را از `beta` به `latest` ارتقا دهید
8. اگر انتشار عمداً مستقیماً به `latest` منتشر شد و `beta`
   باید فوراً همان ساخت پایدار را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو dist-tag به نسخه پایدار اشاره کنند، یا اجازه دهید همگام‌سازی خودترمیم زمان‌بندی‌شده آن بعداً `beta` را منتقل کند

تغییر dist-tag به‌دلایل امنیتی در repo خصوصی قرار دارد، زیرا هنوز به
`NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط با OIDC را حفظ می‌کند.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای beta-first را مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm برگردد، هر فرمان 1Password
CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را مستقیماً از shell عامل اصلی فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان جلوگیری می‌کند.

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

نگه‌دارندگان برای runbook واقعی از مستندات انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
