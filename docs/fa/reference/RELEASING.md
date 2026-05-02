---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و تناوب انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه، و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-02T20:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw چهار مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتاً درخواست شود در npm با `latest`
- alpha: برچسب‌های پیش‌انتشار که در npm با `alpha` منتشر می‌شوند
- beta: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار Alpha: `YYYY.M.D-alpha.N`
  - برچسب Git: `vYYYY.M.D-alpha.N`
- نسخه پیش‌انتشار Beta: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پر نکنید
- `latest` یعنی انتشار پایدار npm که در حال حاضر ترویج شده است
- `alpha` یعنی هدف نصب alpha فعلی
- `beta` یعنی هدف نصب beta فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتاً `latest` را هدف بگیرند، یا بعداً یک ساخت beta بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای beta معمولاً ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند و
  ساخت/امضا/محضرسازی برنامه mac برای stable نگه داشته می‌شود مگر اینکه صراحتاً درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از beta عبور می‌کنند
- stable فقط پس از اعتبارسنجی آخرین beta دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخه `release/YYYY.M.D` که
  از `main` فعلی ساخته شده است برش می‌زنند، تا اعتبارسنجی و اصلاحات انتشار جلوی
  توسعه جدید روی `main` را نگیرد
- اگر یک برچسب beta پوش یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب beta قدیمی، برچسب بعدی `-beta.N` را برش می‌زنند
- روند تفصیلی انتشار، تأییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag و جزئیات بازگشت اضطراری در
دفترچه اجرای انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین نسخه را pull کنید، تأیید کنید commit هدف پوش شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است تا بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   پیش از شاخه‌سازی یک‌بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط زمانی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمداً نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار انتشار عادی را
   مستقیماً روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب موردنظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخه انتشار و فراداده سازگاری مشترک داشته باشند، سپس پیش‌بررسی قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check` و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری شاخه انتشار برای پیش‌بررسی فقط-اعتبارسنجی مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش‌انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، کار workflow، پروفایل package، ارائه‌دهنده، یا فهرست مجاز مدل شکست‌خورده را دوباره اجرا کنید که
   اصلاح را اثبات می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای alpha یا beta، `vYYYY.M.D-alpha.N` یا `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان
   مجموعه را در مرحله دوم در ClawHub منتشر می‌کند، و سپس artifact پیش‌بررسی npm آماده‌شده OpenClaw را با dist-tag مطابق ترویج می‌کند. پس از انتشار، پذیرش package پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-alpha.N`، `openclaw@alpha`،
   `openclaw@YYYY.M.D-beta.N`، یا `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار پوش‌شده یا
   منتشرشده به اصلاح نیاز داشت، شماره پیش‌انتشار مطابق بعدی را برش بزنید؛
   پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای stable، فقط پس از آن ادامه دهید که beta بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار npm پایدار نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و artifact پیش‌بررسی موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار macOS پایدار همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدکننده پس از انتشار npm، E2E مستقل اختیاری Telegram منتشرشده در npm را هنگامی که به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag هنگام نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و مطابق `CHANGELOG.md`، و گام‌های اعلان انتشار را اجرا کنید.

## پیش‌بررسی انتشار

- پیش از preflight انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها بیرون از gate سریع‌تر محلی `pnpm check` نیز پوشش داده شود
- پیش از preflight انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از gate سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار مورد انتظار `dist/*` و bundle رابط کاربری Control برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه root و پیش از tag زدن، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های packageهای Plugin قابل انتشار، metadata سازگاری peer/API مربوط به OpenClaw، metadata ساخت، و stubهای changelog Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار core همخوان شوند. `pnpm plugins:sync:check` نگهبان انتشار غیرتغییردهنده است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تایید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه جعبه‌های تست پیش‌انتشار از یک entrypoint آغاز شوند. این workflow یک branch، tag، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E مربوط به package را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید package منتشرشده npm را نیز اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را به‌جای artifact ساخته‌شده از SHA در برابر package ارسال‌شده npm اجرا کند، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش خصوصی evidence باید بدون اجبار Telegram E2E ثابت کند که اعتبارسنجی با یک package منتشرشده npm مطابقت دارد، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید هم‌زمان با ادامه کار انتشار، proof جانبی برای یک candidate package داشته باشید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@alpha`، `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA قابل اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow candidate را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، artifact package همان candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و بارگذاری دوباره config
  - `package`: laneهای package/update/plugin بومی artifact بدون OpenWebUI یا ClawHub زنده
  - `product`: profile package به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- وقتی فقط به پوشش کامل CI عادی برای release candidate نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n رابط کاربری Control را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک receiver محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace صادرشده، attributeهای محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر راستی‌آزمایی می‌کند.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، برای توالی انتشار تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمدا یک repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را serialize می‌کند تا package core پیش از Pluginهای externalized خود منتشر نشود.
- Release checkها اکنون در یک workflow دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، lane برابری mock مربوط به QA Lab به‌همراه profile سریع Matrix زنده و lane QA مربوط به Telegram را اجرا می‌کند. laneهای زنده از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی موجودی کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime مربوط به install و upgrade میان‌سیستم‌عاملی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm را کوتاه، deterministic، و متمرکز بر artifact نگه دارید، درحالی‌که checkهای زنده کندتر در lane خودشان باقی می‌مانند تا انتشار را متوقف یا مسدود نکنند
- Release checkهای دارای secret باید از طریق `Full Release Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- preflight فقط-اعتبارسنجی `OpenClaw NPM Release` نیز SHA کامل ۴۰ کاراکتری commit مربوط به workflow-branch فعلی را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی promote شود
- در حالت SHA، workflow فقط برای بررسی metadata package مقدار `v<package.json version>` را synthesize می‌کند؛ انتشار واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، درحالی‌که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- preflight انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تایید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا tag beta/correction متناظر) را اجرا کنید
- پس از انتشار npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه beta/correction متناظر) را اجرا کنید تا مسیر install مربوط به registry منتشرشده را در یک temp prefix تازه راستی‌آزمایی کنید
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding package نصب‌شده، setup مربوط به Telegram، و Telegram E2E واقعی در برابر package منتشرشده npm با استفاده از pool مشترک credential اجاره‌شده Telegram را راستی‌آزمایی کنید. maintainerها برای اجرای local one-off می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس دهند.
- maintainerها می‌توانند همان check پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمدا فقط دستی است و روی هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را پاس کرده باشد
  - انتشار واقعی npm باید از همان branch `main` یا `release/YYYY.M.D` که اجرای preflight موفق از آن بوده dispatch شود
  - انتشارهای stable npm به‌طور پیش‌فرض `beta` هستند
  - انتشار stable npm می‌تواند از طریق ورودی workflow صراحتا `latest` را هدف بگیرد
  - mutation مبتنی بر token مربوط به npm dist-tag اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد درحالی‌که repo عمومی انتشار فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک tag فقط روی یک branch انتشار قرار دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار خصوصی واقعی mac باید `preflight_run_id` و `validate_run_id` خصوصی mac موفق را پاس کرده باشد
  - مسیرهای انتشار واقعی به‌جای rebuild دوباره، artifactهای آماده‌شده را promote می‌کنند
- برای انتشارهای correction stable مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا installهای global قدیمی‌تر را روی payload stable پایه باقی بگذارند
- preflight انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود تا دوباره داشبورد مرورگر خالی منتشر نکنیم
- verification پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و metadata package در layout نصب‌شده registry حاضر باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball candidate update enforce می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، pack bloat تصادفی را می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای timing مربوط به extension، یا ماتریس‌های تست extension دست زده است، پیش از تایید خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره generate و review کنید تا release noteها layout منسوخ CI را توصیف نکنند
- آمادگی انتشار stable macOS همچنین شامل سطح‌های updater است:
  - GitHub release باید در نهایت `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip stable جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف build رسمی Sparkle برای آن نسخه انتشار را حفظ کند

## جعبه‌های تست انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش‌انتشار را از یک entrypoint آغاز می‌کنند. برای proof مربوط به commit pinned روی branch سریع‌تغییر، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper مقدار `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، راستی‌آزمایی می‌کند که `headSha` هر workflow فرزند با هدف مطابقت دارد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref قابل اعتماد `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس دهید:

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
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، و زمانی که `release_profile=full` با
`rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker
release-path، Package Acceptance با QA بسته Telegram، هم‌ارزی QA Lab،
Matrix زنده، و Telegram زنده را fan out می‌کند. اجرای کامل فقط وقتی قابل‌قبول است که
خلاصهٔ `Full Release Validation`
نشان دهد `normal_ci` و `release_checks` موفق بوده‌اند. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all نادیده گرفته می‌شود،
مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصهٔ نهایی
verifier برای هر اجرای فرزند جدول‌های کندترین job را شامل می‌شود، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود کردن logها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل stable و full،
artifactها، و handleهای بازاجرای متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref مورداعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولاً `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. هیچ ورودی workflow-ref جداگانه‌ای برای Full Release Validation
وجود ندارد؛ harness مورداعتماد را با انتخاب ref اجرای گردش‌کار انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای dispatch گردش‌کار باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخهٔ موقت pin شده استفاده کنید.

برای انتخاب گسترهٔ live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار در OpenAI/core
- `stable`: minimum به‌علاوهٔ پوشش provider/backend پایدار برای تأیید انتشار
- `full`: stable به‌علاوهٔ پوشش گستردهٔ provider/media مشورتی

`OpenClaw Release Checks` از ref گردش‌کار مورداعتماد استفاده می‌کند تا ref هدف را
یک‌بار به‌عنوان `release-package-under-test` resolve کند و همان artifact را هم در
بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره استفاده کند. این کار همهٔ
boxهای رو به بسته را روی همان byteها نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
install smoke مربوط به OpenAI روی cross-OS زمانی که متغیر repo/org تنظیم باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane
در حال اثبات نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان محل
پوشش مخصوص مدل است.

بسته به مرحلهٔ انتشار از این گونه‌ها استفاده کنید:

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

از چتر کامل به‌عنوان اولین بازاجرا پس از یک fix متمرکز استفاده نکنید. اگر یک box
fail شد، برای اثبات بعدی از گردش‌کار فرزند، job، lane مربوط به Docker، پروفایل بسته، provider مدل،
یا lane مربوط به QA که fail شده استفاده کنید. چتر کامل را فقط وقتی دوباره اجرا کنید
که fix، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همهٔ boxها را
کهنه کرده باشد. verifier نهایی چتر، idهای ثبت‌شدهٔ اجرای گردش‌کار فرزند را دوباره بررسی می‌کند،
پس پس از اینکه یک گردش‌کار فرزند با موفقیت دوباره اجرا شد، فقط job والد fail شدهٔ
`Verify full validation` را دوباره اجرا کنید.

برای بازیابی محدود، `rerun_group` را به چتر پاس دهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI معمولی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همهٔ boxهای انتشار
را اجرا می‌کند، و گروه‌های انتشار محدودتر عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
بازاجراهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بستهٔ release-checks استفاده می‌کنند.

### Vitest

box مربوط به Vitest همان گردش‌کار فرزند دستی `CI` است. CI دستی عمداً
scoping تغییرات را دور می‌زند و graph تست عادی را برای release candidate اجباری می‌کند:
shardهای Linux Node، shardهای Pluginهای bundled، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS،
Android، و i18n مربوط به Control UI.

از این box برای پاسخ به «آیا source tree کل test suite عادی را pass کرد؟» استفاده کنید.
این همان اعتبارسنجی محصول در مسیر انتشار نیست. شواهدی که باید نگه دارید:

- خلاصهٔ `Full Release Validation` که URL اجرای dispatch شدهٔ `CI` را نشان می‌دهد
- سبز بودن اجرای `CI` روی SHA دقیق هدف
- نام shardهای fail شده یا کند در jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل کارایی نیاز دارد

CI دستی را مستقیماً فقط وقتی اجرا کنید که انتشار به CI عادی deterministic نیاز دارد
اما نه به boxهای Docker، QA Lab، live، cross-OS، یا package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml` به‌علاوهٔ گردش‌کار
`install-smoke` در حالت انتشار قرار دارد. این box، release candidate را از طریق
محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن slow Bun global install smoke
- آماده‌سازی/استفادهٔ مجدد image smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانهٔ install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`,
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای تفکیک‌شدهٔ install/uninstall مربوط به Pluginهای bundled
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زندهٔ Docker وقتی release checks
  suiteهای live را شامل شوند

پیش از بازاجرا از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامهٔ scheduler، و commandهای بازاجرا upload می‌کند. برای بازیابی متمرکز،
به‌جای بازاجرای همهٔ chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی گردش‌کار قابل‌استفادهٔ مجدد live/E2E استفاده کنید.
commandهای بازاجرای تولیدشده، `package_artifact_run_id` قبلی و ورودی‌های image آماده‌شدهٔ Docker
را وقتی موجود باشند شامل می‌شوند، پس یک lane fail شده می‌تواند همان tarball و imageهای GHCR را دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic
و release در سطح channel است، جدا از Vitest و سازوکارهای package مربوط به Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane هم‌ارزی mock که lane نامزد OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل سریع QA مربوط به Matrix زنده با استفاده از محیط `qa-live-shared`
- lane QA مربوط به Telegram زنده با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به «آیا انتشار در سناریوهای QA و جریان‌های channel زنده درست رفتار می‌کند؟»
استفاده کنید. هنگام تأیید انتشار، URLهای artifact برای laneهای parity، Matrix، و Telegram را نگه دارید.
پوشش کامل Matrix همچنان به‌عنوان اجرای دستی sharded QA-Lab در دسترس است،
نه lane حیاتی پیش‌فرض انتشار.

### Package

box مربوط به Package، gate محصول قابل‌نصب است. این box با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` که Docker E2E مصرف می‌کند normalize می‌کند،
inventory بسته را اعتبارسنجی می‌کند، نسخهٔ بسته و SHA-256 را ثبت می‌کند، و ref
harness گردش‌کار را از ref منبع بسته جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخهٔ دقیق انتشار OpenClaw
- `source=ref`: بسته‌بندی یک شاخه، tag، یا SHA کامل commit مربوط به `package_ref` مورداعتماد
  با harness انتخاب‌شدهٔ `workflow_ref`
- `source=url`: دانلود یک `.tgz` با HTTPS همراه با `package_sha256` الزامی
- `source=artifact`: استفادهٔ مجدد از یک `.tgz` که اجرای دیگری از GitHub Actions upload کرده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`،
artifact آماده‌شدهٔ بستهٔ انتشار، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update،
پاکسازی dependency کهنهٔ Plugin، fixtureهای Plugin آفلاین، update Plugin، و QA بستهٔ Telegram
را روی همان tarball resolve شده نگه می‌دارد. ماتریس upgrade هر baseline پایدار منتشرشده در npm را از `2026.4.23` تا `latest` پوشش می‌دهد؛ برای candidate ازپیش ship شده از
Package Acceptance با `source=npm` استفاده کنید، یا برای tarball محلی npm مبتنی بر SHA پیش از انتشار،
از `source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native برای بیشتر
پوشش package/update است که قبلاً به Parallels نیاز داشت. بررسی‌های انتشار cross-OS همچنان
برای onboarding، installer، و رفتار platform مخصوص OS مهم‌اند، اما اعتبارسنجی محصول
package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin،
[تست کردن updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری دربارهٔ اینکه کدام
lane محلی، Docker، Package Acceptance، یا release-check یک install/update Plugin،
پاکسازی doctor، یا تغییر migration بستهٔ منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration جامع update منتشرشده از هر بستهٔ پایدار `2026.4.23+` یک گردش‌کار دستی جداگانهٔ
`Update Migration` است، نه بخشی از Full Release CI.

leniency قدیمی package-acceptance عمداً time boxed است. بسته‌ها تا
`2026.4.25` ممکن است از مسیر سازگاری برای gapهای metadata که قبلاً
در npm منتشر شده‌اند استفاده کنند: entryهای private QA inventory که در tarball نیستند،
نبود `gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، مکان‌های قدیمی install-record مربوط به Plugin،
نبود persistence برای marketplace install-record، و migration metadata config
هنگام `plugins update`. بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای stamp fileهای metadata مربوط به build محلی
که قبلاً ship شده‌اند warn بدهد. بسته‌های بعدی باید قراردادهای مدرن package را رعایت کنند؛
همان gapها باعث fail شدن اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار دربارهٔ یک بستهٔ واقعاً قابل‌نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

پروفایل‌های رایج package:

- `smoke`: laneهای سریع install/channel/agent بسته، شبکهٔ gateway، و reload config
- `package`: قراردادهای install/update/Plugin package بدون ClawHub زنده؛ این پیش‌فرض release-check
  است
- `product`: `package` به‌علاوهٔ channelهای MCP، پاکسازی cron/subagent، جست‌وجوی وب OpenAI،
  و OpenWebUI
- `full`: chunkهای Docker مسیر انتشار با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای بازاجراهای متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این workflow فایل tarball
حل‌شده‌ی `package-under-test` را به مسیر Telegram می‌فرستد؛ workflow مستقل
Telegram همچنان برای بررسی‌های پس از انتشار، مشخصات npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار Release

`OpenClaw Release Publish` نقطه‌ی ورود معمول برای انتشار تغییردهنده است. این مورد
workflowهای منتشرکننده‌ی مورد اعتماد را به ترتیبی که Release نیاز دارد هماهنگ می‌کند:

1. تگ Release را checkout کنید و SHA کامیت آن را حل کنید.
2. تأیید کنید که تگ از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با تگ Release، dist-tag مربوط به npm، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

نمونه‌ی انتشار بتا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

نمونه‌ی انتشار آلفا:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای تعمیر متمرکز یا بازانتشار استفاده کنید. برای تعمیر Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته‌ی OpenClaw نباید منتشر شود،
workflow فرزند را مستقیماً dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ Release الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-alpha.1` یا `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، می‌تواند SHA کامل ۴۰کاراکتری کامیت شاخه‌ی فعلی workflow نیز برای preflight فقط اعتبارسنجی باشد
- `preflight_only`: `true` فقط برای اعتبارسنجی/ساخت/بسته، `false` برای مسیر
  انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball
  آماده‌شده در اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ Release الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه‌ی اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته‌ی OpenClaw
- `plugin_publish_scope`: مقدار پیش‌فرض `all-publishable` است؛ از `selected` فقط
  برای تعمیر متمرکز استفاده کنید
- `plugins`: نام‌های بسته‌ی `@openclaw/*` که با کاما جدا شده‌اند، وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: مقدار پیش‌فرض `true` است؛ فقط وقتی از workflow به‌عنوان
  هماهنگ‌کننده‌ی تعمیر فقط Plugin استفاده می‌کنید آن را `false` قرار دهید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه‌ی OpenClaw یا
  تگ Release قابل دسترسی باشد.

قوانین:

- تگ‌های پایدار و اصلاحی می‌توانند روی `beta` یا `latest` منتشر شوند
- تگ‌های prerelease آلفا فقط می‌توانند روی `alpha` منتشر شوند
- تگ‌های prerelease بتا فقط می‌توانند روی `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه
  فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛
  workflow پیش از ادامه‌ی انتشار آن metadata را تأیید می‌کند

## توالی Release پایدار npm

هنگام آماده‌سازی یک Release پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید برای اجرای آزمایشی فقط اعتبارسنجی workflow preflight از SHA کامل کامیت شاخه‌ی فعلی workflow استفاده کنید
2. برای جریان معمول بتا-اول `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمداً انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی CI معمولی به‌همراه پوشش live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را روی شاخه‌ی Release، تگ Release، یا SHA کامل کامیت اجرا کنید
4. اگر عمداً فقط گراف تست عادی قطعی را نیاز دارید، به‌جای آن workflow دستی
   `CI` را روی ref مربوط به Release اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار پیش از ارتقای بسته‌ی npm مربوط به OpenClaw، Pluginهای خارجی‌شده را در npm
   و ClawHub منتشر می‌کند
7. اگر Release روی `beta` فرود آمد، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه‌ی پایدار از `beta` به `latest` استفاده کنید
8. اگر Release عمداً مستقیماً روی `latest` منتشر شد و `beta`
   باید فوراً همان ساخت پایدار را دنبال کند، از همان workflow خصوصی
   برای اشاره دادن هر دو dist-tag به نسخه‌ی پایدار استفاده کنید، یا اجازه دهید همگام‌سازی خودترمیم زمان‌بندی‌شده‌ی آن بعداً `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در مخزن خصوصی قرار دارد، چون همچنان
به `NPM_TOKEN` نیاز دارد، در حالی که مخزن عمومی انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار هر دو مسیر انتشار مستقیم و مسیر ارتقای بتا-اول را
مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm برگردد، هر دستور 1Password
CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کند. `op` را
مستقیماً از shell اصلی agent فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها و مدیریت OTP قابل مشاهده باشند و از هشدارهای مکرر میزبان جلوگیری شود.

## منابع عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

نگه‌دارندگان برای runbook واقعی از مستندات خصوصی Release در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های Release](/fa/install/development-channels)
