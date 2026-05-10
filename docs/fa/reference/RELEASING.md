---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، کادرهای اعتبارسنجی، نام‌گذاری نسخه، و زمان‌بندی
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-10T20:05:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای برچسب‌خورده‌ای که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest` منتشر می‌شوند
- بتا: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- توسعه: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترفیع داده شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ متصدیان انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای ارزیابی‌شده را ترفیع دهند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه Mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا انجام می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` جدا می‌کنند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی انتشار و اصلاحات، توسعه جدید
  روی `main` را مسدود نکند
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب بتای قدیمی، برچسب بعدی `-beta.N` را جدا می‌کنند
- رویه تفصیلی انتشار، تأییدیه‌ها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست متصدی انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag، و جزئیات rollback اضطراری در
راهنمای اجرای انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و
   پیش از ساخت شاخه یک بار دیگر rebase/pull کنید.
3. سوابق سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمدا
   نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب مورد نظر افزایش دهید، سپس
   `pnpm release:prep` را اجرا کنید. این دستور نسخه‌های Plugin، موجودی Plugin، طرح‌واره پیکربندی،
   فراداده پیکربندی کانال‌های همراه، مبنای مستندات پیکربندی، خروجی‌های Plugin SDK،
   و مبنای API Plugin SDK را به‌ترتیب درست تازه‌سازی می‌کند. هر drift تولیدشده را
   پیش از برچسب‌گذاری commit کنید. سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰نویسه‌ای شاخه انتشار برای پیش‌پرواز فقط-اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش‌انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل package، provider، یا allowlist مدل شکست‌خورده‌ای را
   دوباره اجرا کنید که اصلاح را اثبات می‌کند. umbrella کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این دستور `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را به‌صورت موازی به
   ClawHub dispatch می‌کند، و سپس artifact پیش‌پرواز آماده OpenClaw npm را
   به‌محض موفقیت انتشار npm مربوط به Plugin با dist-tag مطابق ترفیع می‌دهد.
   پس از موفقیت فرزند انتشار OpenClaw npm، صفحه انتشار/پیش‌انتشار GitHub مطابق را
   از بخش کامل و مطابق `CHANGELOG.md` می‌سازد یا به‌روزرسانی می‌کند. انتشارهای پایدار منتشرشده در npm با `latest`
   به آخرین انتشار GitHub تبدیل می‌شوند؛ انتشارهای نگه‌داری پایدار که روی npm `beta` نگه داشته می‌شوند
   با GitHub `latest=false` ساخته می‌شوند.
   انتشار ClawHub ممکن است هنگام انتشار OpenClaw npm همچنان در حال اجرا باشد، اما گردش‌کار انتشار
   شناسه‌های اجرای فرزند را بلافاصله چاپ می‌کند. به‌طور پیش‌فرض پس از dispatch کردن ClawHub
   منتظر آن نمی‌ماند، بنابراین دسترس‌پذیری OpenClaw npm با تأییدیه‌های کندتر ClawHub
   یا کارهای رجیستری مسدود نمی‌شود؛ وقتی ClawHub باید تکمیل گردش‌کار را مسدود کند
   `wait_for_clawhub=true` را تنظیم کنید. مسیر
   ClawHub شکست‌های گذرای نصب وابستگی CLI را retry می‌کند، Pluginهای دارای preview موفق را
   حتی وقتی یک سلول preview flaky باشد منتشر می‌کند، و با
   راستی‌آزمایی رجیستری برای هر نسخه Plugin مورد انتظار پایان می‌یابد تا انتشارهای جزئی
   قابل مشاهده و قابل retry بمانند. پس از انتشار،
   پذیرش package پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار مطابق بعدی را جدا کنید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتا یا release candidate ارزیابی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد ادامه دهید. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` عبور می‌کند و با استفاده از
    `preflight_run_id` از artifact پیش‌پرواز موفق دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
    گردش‌کار خصوصی انتشار macOS پس از راستی‌آزمایی assetهای انتشار، appcast امضاشده را
    به‌طور خودکار روی `main` عمومی منتشر می‌کند؛ اگر حفاظت شاخه push مستقیم را مسدود کند،
    یک PR برای appcast باز می‌کند یا به‌روزرسانی می‌کند.
11. پس از انتشار، راستی‌آزمای npm پس از انتشار، E2E اختیاری مستقل Telegram برای npm منتشرشده
    وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترفیع dist-tag در صورت نیاز، راستی‌آزمایی صفحه انتشار GitHub تولیدشده،
    و گام‌های اعلام انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها بیرون از دروازه سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از دروازه سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از tag کردن، `pnpm release:prep` را اجرا کنید. این دستور همه generatorهای قطعی انتشار را اجرا می‌کند که معمولا پس از تغییر نسخه/config/API دچار drift می‌شوند: نسخه‌های Plugin، inventory مربوط به Plugin، schema پیکربندی پایه، metadata پیکربندی کانال‌های bundled، baseline مستندات config، خروجی‌های Plugin SDK، و baseline مربوط به API در Plugin SDK. `pnpm release:check` این guardها را دوباره در حالت check اجرا می‌کند و پیش از اجرای بررسی‌های انتشار package، همه شکست‌های drift تولیدشده‌ای را که پیدا کند در یک گذر گزارش می‌دهد.
- پیش از تایید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک entrypoint آغاز شوند. این workflow یک branch، tag، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی، برابری QA Lab، مسیرهای Matrix، و Telegram dispatch می‌کند. اجراهای پایدار/پیش‌فرض، soak کامل live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E مربوط به package را در برابر artifact به نام `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید package منتشرشده npm را هم اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را به‌جای artifact ساخته‌شده از SHA در برابر package ارسال‌شده npm اجرا کند، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش private evidence باید بدون اجبار Telegram E2E ثابت کند که اعتبارسنجی با یک package منتشرشده npm تطابق دارد، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید هم‌زمان با ادامه کار انتشار، برای یک نامزد package اثبات side-channel داشته باشید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA معتبر `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball HTTPS همراه با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط اجرای دیگری از GitHub Actions از `source=artifact` استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را در برابر همان tarball دوباره به‌کار می‌گیرد، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی مسیرهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، artifact package همان نامزد است و `published_upgrade_survivor_baseline`، baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از package نامزد هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر managed restart دستور update نامزد را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: مسیرهای install/channel/agent، شبکه Gateway، و reload کردن config
  - `package`: مسیرهای package/update/restart/plugin که به‌صورت بومی با artifact کار می‌کنند، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: قطعه‌های مسیر انتشار Docker همراه با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- وقتی فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از scoping بر اساس تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Pluginهای bundled، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، Android، و مسیرهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace صادرشده، attributeهای محدود، و حذف/پوشاندن محتوا و شناسه‌ها را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار tag شده، `pnpm release:check` را اجرا کنید
- پس از وجود داشتن tag، برای توالی publish تغییردهنده، `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید، یا وقتی یک tag قابل‌دسترسی از `main` را منتشر می‌کنید از `main` dispatch کنید، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمدا یک repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را serialized می‌کند تا package اصلی پیش از Pluginهای externalized خود منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، مسیر برابری mock در QA Lab به‌علاوه پروفایل سریع live Matrix و مسیر QA مربوط به Telegram را اجرا می‌کند. مسیرهای live از environment به نام `qa-live-shared` استفاده می‌کنند؛ Telegram نیز از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime برای install و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل‌استفاده‌مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و artifactمحور نگه دارید، در حالی که بررسی‌های live کندتر در مسیر خودشان می‌مانند تا publish را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release Validation` یا از ref مربوط به workflow `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا SHA کامل commit را می‌پذیرد، تا وقتی commit resolve شده از یک branch یا tag انتشار OpenClaw قابل‌دسترسی باشد
- پیش‌پرواز فقط-اعتبارسنجی `OpenClaw NPM Release` نیز SHA کامل 40 کاراکتری commit مربوط به workflow-branch فعلی را بدون نیاز به tag push شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به publish واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی metadata مربوط به package مقدار `v<package.json version>` را می‌سازد؛ publish واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر publish و promotion واقعی را روی runnerهای میزبانی‌شده GitHub نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور زیر را با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند:
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
- پیش‌پرواز انتشار npm دیگر منتظر مسیر جداگانه release checks نمی‌ماند
- پیش از تایید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` را اجرا کنید
  یا tag متناظر beta/correction را اجرا کنید
- پس از publish در npm، دستور زیر را اجرا کنید:
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  یا نسخه متناظر beta/correction را اجرا کنید تا مسیر نصب registry منتشرشده را در یک prefix موقت تازه بررسی کند
- پس از publish یک beta، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید تا onboarding مربوط به package نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر package منتشرشده npm با استفاده از pool مشترک credentialهای lease شده Telegram بررسی شود. اجرای موردی محلی توسط maintainer می‌تواند متغیرهای Convex را حذف کند و سه credential env مربوط به `OPENCLAW_QA_TELEGRAM_*` را مستقیم بدهد.
- برای اجرای smoke کامل beta پس از publish از دستگاه maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی npm update/fresh-target مربوط به Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، artifact را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- Maintainerها می‌توانند همین بررسی پس از publish را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمدا فقط دستی است و در هر merge اجرا نمی‌شود.
- automation انتشار برای maintainerها اکنون از الگوی preflight-then-promote استفاده می‌کند:
  - publish واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - publish واقعی npm باید از همان branch به نام `main` یا `release/YYYY.M.D` dispatch شود که اجرای preflight موفق از آن بوده است
  - انتشارهای پایدار npm به‌صورت پیش‌فرض `beta` هستند
  - publish پایدار npm می‌تواند از طریق ورودی workflow، صریحا `latest` را هدف بگیرد
  - تغییر npm dist-tag مبتنی بر token اکنون برای امنیت در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی publish فقط-OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط-اعتبارسنجی است؛ وقتی یک tag فقط روی branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - publish واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac را گذرانده باشد
  - مسیرهای publish واقعی، artifactهای آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از publish همچنین همان مسیر upgrade با temp-prefix را از `YYYY.M.D` به `YYYY.M.D-N` بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را داشته باشد، تا دوباره یک dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از publish همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و metadata مربوط به package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند در verifier پس از publish شکست می‌خورد و نمی‌تواند به `latest` ارتقا داده شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball به‌روزرسانی نامزد enforce می‌کند، بنابراین installer e2e پیش از مسیر publish انتشار، pack bloat تصادفی را می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای timing مربوط به extension، یا ماتریس‌های آزمون extension دست زده است، پیش از تایید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره generate و بازبینی کنید تا release notes یک layout قدیمی CI را توصیف نکند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های updater است:
  - release مربوط به GitHub باید در نهایت `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - پس از publish، `appcast.xml` روی `main` باید به zip پایدار جدید اشاره کند؛ workflow publish خصوصی macOS آن را به‌صورت خودکار commit می‌کند، یا وقتی push مستقیم مسدود است یک PR برای appcast باز می‌کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL غیرخالی feed مربوط به Sparkle، و `CFBundleVersion` برابر یا بالاتر از floor canonical build مربوط به Sparkle برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها با آن همه آزمون‌های پیش از انتشار را از یک entrypoint آغاز می‌کنند. برای اثبات commit پین‌شده روی branchی که سریع حرکت می‌کند، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

راهنما `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از همان شاخه با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha`
هر child workflow با هدف برابر باشد، سپس شاخه موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای child جدیدترِ `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه یا tag انتشار، آن را از workflow ref معتمد `main` اجرا کنید
و شاخه یا tag انتشار را به‌عنوان `ref` پاس بدهید:

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
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک artifact والد `release-package-under-test` برای بررسی‌های روبه‌روی package آماده می‌کند، و وقتی `release_profile=full` با `rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد، package Telegram E2E مستقل را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker
release-path وقتی soak فعال است، Package Acceptance با Telegram
package QA، هم‌ارزی QA Lab، Matrix زنده و Telegram زنده را به‌صورت fan out اجرا می‌کند. اجرای کامل فقط وقتی پذیرفتنی است که خلاصه
`Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
child مربوط به `npm_telegram` هم باید موفق باشد؛ بیرون از full/all، نادیده گرفته می‌شود
مگر اینکه `npm_telegram_package_spec` منتشرشده‌ای ارائه شده باشد. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای child است، تا release
manager بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام دقیق jobهای workflow، تفاوت‌های پروفایل stable و full،
artifactها و دستگیره‌های rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
Child workflowها از ref معتمدی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای workflow-ref مربوط به Full Release Validation وجود ندارد؛ harness معتمد را با انتخاب ref اجرای workflow انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند workflow dispatch ref باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت pinned استفاده کنید.

از `release_profile` برای انتخاب گستره live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر release-critical برای OpenAI/core live و Docker
- `stable`: حداقل به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده advisory provider/media

وقتی laneهای release-blocking سبز هستند و قبل از promotion اجرای live/E2E کامل، Docker release-path، و sweep محدود upgrade-survivor منتشرشده را می‌خواهید، از `run_release_soak=true` همراه با `stable` استفاده کنید. آن sweep چهار package پایدار آخر به‌علاوه baselineهای pinned `2026.4.23` و `2026.5.2`
و پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و
هر baseline را در job جداگانه Docker runner shard می‌کند. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از workflow ref معتمد استفاده می‌کند تا ref هدف را یک‌بار به‌عنوان `release-package-under-test` resolve کند و وقتی soak اجرا می‌شود، همان artifact را در بررسی‌های cross-OS، Package Acceptance و release-path Docker بازاستفاده می‌کند. این کار همه ماشین‌های روبه‌روی package را روی همان byteها نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
install smoke مربوط به cross-OS OpenAI وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane در حال اثبات نصب package، onboarding، راه‌اندازی Gateway و یک نوبت agent زنده است، نه benchmark گرفتن از کندترین مدل پیش‌فرض. ماتریس live provider گسترده‌تر همچنان محل پوشش model-specific است.

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

از umbrella کامل به‌عنوان اولین rerun بعد از یک fix متمرکز استفاده نکنید. اگر یک box
ناموفق شد، برای اثبات بعدی از child workflow، job، lane Docker، پروفایل package، model
provider یا lane QA ناموفق استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
fix، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه boxها را
کهنه کرده باشد. verifier نهایی umbrella، شناسه‌های ثبت‌شده اجرای child workflow را دوباره بررسی می‌کند، پس بعد از rerun موفق یک child workflow، فقط job والد ناموفق
`Verify full validation` را دوباره اجرا کنید.

برای بازیابی محدود، `rerun_group` را به umbrella پاس بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط child مربوط به CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط child مربوط به Plugin فقط-انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند، و گروه‌های محدودتر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact package مربوط به release-checks استفاده می‌کنند. rerunهای متمرکز cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
فیلتر OS/suite دیگری اضافه کنند. شکست‌های QA در release-checks مشورتی هستند؛ شکست فقط-QA
اعتبارسنجی انتشار را block نمی‌کند.

### Vitest

box مربوط به Vitest همان child workflow دستی `CI` است. CI دستی عمدا
scoping تغییرات را دور می‌زند و گراف تست عادی را برای release candidate اجباری می‌کند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android و Control UI i18n.

از این box برای پاسخ به «آیا source tree کل مجموعه تست عادی را پاس کرد؟» استفاده کنید.
این همان اعتبارسنجی محصول در release-path نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- اجرای سبز `CI` روی SHA هدف دقیق
- نام shardهای ناموفق یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل عملکرد نیاز دارد

CI دستی را مستقیم فقط وقتی اجرا کنید که انتشار به CI عادی قطعی نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه workflow
`install-smoke` در حالت انتشار، قرار دارد. این box، release candidate را از طریق محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- install smoke کامل با slow Bun global install smoke فعال
- آماده‌سازی/بازاستفاده image مربوط به root Dockerfile smoke بر اساس SHA هدف، با jobهای QR،
  root/gateway و installer/Bun smoke که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای repository E2E
- chunkهای release-path Docker: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk مربوط به `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای split برای install/uninstall مربوط به bundled Plugin
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای live/E2E provider و پوشش Docker live model وقتی release checks
  شامل suiteهای live باشد

قبل از rerun از artifactهای Docker استفاده کنید. scheduler مربوط به release-path
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`,
زمان‌بندی‌های phase، JSON برنامه scheduler و دستورهای rerun آپلود می‌کند. برای بازیابی متمرکز،
روی workflow قابل‌بازاستفاده live/E2E به‌جای rerun همه chunkهای انتشار از
`docker_lanes=<lane[,lane]>` استفاده کنید. دستورهای rerun تولیدشده، وقتی موجود باشند، ورودی‌های قبلی
`package_artifact_run_id` و imageهای Docker آماده‌شده را شامل می‌شوند، تا یک
lane ناموفق بتواند از همان tarball و imageهای GHCR بازاستفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این box دروازه انتشار
برای رفتار agentic و سطح channel است، جدا از مکانیک‌های package مربوط به Vitest و Docker.

پوشش QA Lab انتشار شامل این موارد است:

- lane هم‌ارزی mock که lane کاندید OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل fast live Matrix QA با استفاده از محیط `qa-live-shared`
- lane زنده Telegram QA با استفاده از اجاره‌های credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به «آیا انتشار در سناریوهای QA و جریان‌های channel زنده درست رفتار می‌کند؟» استفاده کنید. هنگام تایید انتشار، URLهای artifact مربوط به laneهای parity، Matrix و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی shardشده QA-Lab در دسترس است، نه lane پیش‌فرض release-critical.

### Package

box مربوط به Package دروازه محصول قابل‌نصب است. این box با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball مربوط به `package-under-test` که توسط Docker E2E مصرف می‌شود نرمال‌سازی می‌کند، موجودی package را اعتبارسنجی می‌کند، نسخه package و SHA-256 را ثبت می‌کند، و workflow harness ref را از package source ref جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw
- `source=ref`: یک شاخه، tag یا full commit SHA معتمدِ `package_ref` را
  با harness انتخاب‌شده `workflow_ref` pack می‌کند
- `source=url`: یک `.tgz` HTTPS را با `package_sha256` الزامی دانلود می‌کند
- `source=artifact`: از یک `.tgz` آپلودشده توسط اجرای GitHub Actions دیگر بازاستفاده می‌کند

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact آماده‌شده package انتشار، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update،
configured-auth update restart، نصب زنده Skills از ClawHub، پاک‌سازی وابستگی Plugin کهنه، fixtureهای Plugin آفلاین، update مربوط به Plugin و Telegram package QA را در برابر همان tarball resolve‌شده نگه می‌دارد. release checkهای blockکننده از baseline package منتشرشده latest پیش‌فرض استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` آن را به همه baselineهای stable منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوه fixtureهای issue گزارش‌شده گسترش می‌دهد. از
Package Acceptance با `source=npm` برای candidateای که قبلا shipped شده، یا
`source=ref`/`source=artifact` برای tarball محلی npm مبتنی بر SHA پیش از
publish استفاده کنید. این جایگزین GitHub-native برای بیشتر پوشش package/update است که قبلا به Parallels نیاز داشت. release checkهای cross-OS همچنان برای onboarding، installer و رفتار platform خاص OS مهم هستند، اما اعتبارسنجی محصول package/update باید
Package Acceptance را ترجیح دهد.

چک‌لیست مرجع برای اعتبارسنجی به‌روزرسانی و Plugin، [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام مسیر محلی، Docker، Package Acceptance یا release-check یک نصب/به‌روزرسانی Plugin، پاک‌سازی doctor، یا تغییر مهاجرت بسته منتشرشده را اثبات می‌کند، از آن استفاده کنید. مهاجرت جامع به‌روزرسانی منتشرشده از هر بسته پایدار `2026.4.23+` یک گردش‌کار دستی جداگانه با نام `Update Migration` است و بخشی از Full Release CI نیست.

انعطاف‌پذیری قدیمی package-acceptance عمدا محدود به بازه زمانی مشخص است. بسته‌ها تا `2026.4.25` ممکن است برای شکاف‌های فراداده‌ای که پیش‌تر در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند: ورودی‌های موجودی QA خصوصی که در tarball وجود ندارند، نبودن `gateway install --wrapper`، نبودن فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبودن `update.channel` پایدارشده، مکان‌های قدیمی رکورد نصب Plugin، نبودن پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp فراداده build محلی که قبلا منتشر شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها در اعتبارسنجی انتشار شکست می‌خورند.

وقتی پرسش انتشار درباره یک بسته واقعا قابل نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی دوباره/بسته Plugin به‌همراه اثبات نصب Skills زنده ClawHub؛ این پیش‌فرض release-check است
- `product`: `package` به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این گردش‌کار tarball حل‌شده `package-under-test` را به مسیر Telegram می‌فرستد؛ گردش‌کار مستقل Telegram همچنان برای بررسی‌های پس از انتشار یک مشخصه npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار Release

`OpenClaw Release Publish` نقطه ورود عادی انتشار تغییردهنده است. این گردش‌کار، گردش‌کارهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. تگ انتشار را check out کنید و SHA کامیت آن را حل کنید.
2. بررسی کنید که تگ از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با تگ انتشار، dist-tag مربوط به npm، و `preflight_run_id` ذخیره‌شده dispatch کنید.

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

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release` فقط برای تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به `OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود، گردش‌کار فرزند را مستقیم dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی، مانند `v2026.4.2`، `v2026.4.2-1`، یا `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، می‌تواند SHA کامل ۴۰ کاراکتری کامیت شاخه گردش‌کار فعلی برای preflight فقط-اعتبارسنجی هم باشد
- `preflight_only`: `true` فقط برای اعتبارسنجی/build/package، و `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار از tarball آماده‌شده از اجرای موفق preflight دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛ وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با ویرگول، وقتی `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی از گردش‌کار به‌عنوان هماهنگ‌کننده تعمیر فقط-Plugin استفاده می‌کنید، آن را روی `false` بگذارید

`OpenClaw Release Checks` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد.
- `run_release_soak`: soak جامع live/E2E، مسیر انتشار Docker، و upgrade-survivor از همه نسخه‌های گذشته را در بررسی‌های انتشار پایدار/پیش‌فرض فعال می‌کند. با `release_profile=full` به‌اجبار روشن می‌شود.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند در `beta` یا `latest` منتشر شوند
- تگ‌های prerelease بتا فقط می‌توانند در `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط-اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight استفاده شده است؛ گردش‌کار پیش از ادامه انتشار، آن فراداده را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام آماده‌سازی یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از اینکه تگی وجود داشته باشد، می‌توانید از SHA کامل کامیت شاخه گردش‌کار فعلی برای اجرای آزمایشی فقط-اعتبارسنجی گردش‌کار preflight استفاده کنید
2. برای جریان عادی beta-first، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی عمدا انتشار پایدار مستقیم می‌خواهید، `latest` را انتخاب کنید
3. وقتی پوشش CI عادی به‌همراه prompt cache زنده، Docker، QA Lab، Matrix، و Telegram را از یک گردش‌کار دستی می‌خواهید، `Full Release Validation` را روی شاخه انتشار، تگ انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمدا فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن گردش‌کار دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای externalized را پیش از ارتقای بسته npm مربوط به OpenClaw در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` نشست، از گردش‌کار خصوصی `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` استفاده کنید تا آن نسخه پایدار را از `beta` به `latest` ارتقا دهید
8. اگر انتشار عمدا مستقیم در `latest` منتشر شد و `beta` باید فورا همان build پایدار را دنبال کند، از همان گردش‌کار خصوصی استفاده کنید تا هر دو dist-tag را به نسخه پایدار اشاره دهد، یا بگذارید sync خودترمیم زمان‌بندی‌شده آن بعدا `beta` را جابه‌جا کند

جهش dist-tag به دلایل امنیتی در مخزن خصوصی قرار دارد، چون هنوز به `NPM_TOKEN` نیاز دارد، درحالی‌که مخزن عمومی انتشار فقط-OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای beta-first را مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر نگه‌دارنده‌ای ناچار شود به احراز هویت npm محلی برگردد، هر فرمان 1Password CLI (`op`) را فقط داخل یک جلسه tmux اختصاصی اجرا کنید. `op` را مستقیم از shell اصلی عامل فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها، هشدارها، و مدیریت OTP قابل مشاهده باشد و از هشدارهای تکراری میزبان جلوگیری کند.

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

نگه‌دارندگان برای runbook واقعی از مستندات انتشار خصوصی در [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
