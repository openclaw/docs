---
read_when:
    - در جست‌وجوی تعریف‌های کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، محیط‌های اعتبارسنجی، نام‌گذاری نسخه و چرخه زمانی
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-02T12:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده‌ای که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest` منتشر می‌شوند
- beta: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- dev: سرشاخه‌ی متحرک `main`

## نام‌گذاری نسخه

- نسخه‌ی انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه‌ی انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه‌ی پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر آغازین ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته‌ی npm و برنامه‌ی macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه‌ی Mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از یک شاخه‌ی `release/YYYY.M.D` که
  از `main` فعلی ساخته شده است جدا می‌کنند، تا اعتبارسنجی و اصلاحات انتشار مانع توسعه‌ی جدید روی `main` نشود
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب بتای قدیمی، برچسب بعدی `-beta.N` را جدا می‌کنند
- رویه‌ی دقیق انتشار، تاییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## فهرست بررسی اپراتور انتشار

این فهرست بررسی، شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات rollback اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌مانند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` به اندازه‌ی کافی سبز است که بتوان از آن شاخه ساخت.
2. بالاترین بخش `CHANGELOG.md` را از تاریخچه‌ی واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   یک بار دیگر پیش از ساخت شاخه rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط زمانی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمدا
   حفظ می‌شود.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه‌ی لازم را برای برچسب موردنظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید
   تا بسته‌های Plugin قابل انتشار نسخه‌ی انتشار و فراداده‌ی سازگاری مشترک داشته باشند،
   سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ نویسه‌ای شاخه‌ی انتشار برای پیش‌پرواز فقط-اعتبارسنجی مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه‌ی آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه‌ی انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه‌ی ورود دستی
   برای چهار جعبه‌ی بزرگ آزمون انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه‌ی انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، provider، یا فهرست مجاز model شکست‌خورده را دوباره اجرا کنید
   که اصلاح را اثبات می‌کند. چتر کامل را فقط زمانی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه‌ی منطبق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تایید می‌کند،
   ابتدا همه‌ی بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان مجموعه را
   در مرحله‌ی دوم در ClawHub منتشر می‌کند، و سپس artifact آماده‌ی پیش‌پرواز npm مربوط به OpenClaw را
   با dist-tag برابر `beta` ترویج می‌کند. پس از انتشار، پذیرش بسته‌ی پس از انتشار را
   در برابر بسته‌ی منتشرشده‌ی `openclaw@YYYY.M.D-beta.N` یا `openclaw@beta`
   اجرا کنید. اگر یک بتای push یا منتشرشده به اصلاح نیاز داشت، `-beta.N` بعدی را جدا کنید؛
   بتای قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتای بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` عبور می‌کند و artifact موفق پیش‌پرواز را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تاییدکننده‌ی پس از انتشار npm، E2E مستقل اختیاری
    Telegram از npm منتشرشده را هنگامی که به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و منطبق `CHANGELOG.md`، و مراحل اعلام انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از preflight انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها بیرون از gate محلی سریع‌تر `pnpm check` نیز پوشش داده شود
- پیش از preflight انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از gate محلی سریع‌تر سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار موردانتظار `dist/*` و bundle مربوط به Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه root و پیش از tag زدن، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته Plugin قابل انتشار، metadata سازگاری peer/API مربوط به OpenClaw، metadata ساخت، و stubهای changelog مربوط به Plugin را برای همخوانی با نسخه انتشار core به‌روزرسانی می‌کند. `pnpm plugins:sync:check` نگهبان انتشار غیرتغییردهنده است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک entrypoint آغاز شوند. این workflow یک branch، tag، یا commit SHA کامل می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، مجموعه‌های release-path مربوط به Docker، live/E2E، OpenWebUI، parity مربوط به QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، زمانی که همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند، `npm_telegram_package_spec` را ارائه کنید. زمانی که گزارش evidence خصوصی باید ثابت کند اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه Telegram E2E را اجباری کند، `evidence_package_spec` را ارائه کنید.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- هنگامی که هم‌زمان با ادامه کار انتشار، proof جانبی برای یک candidate بسته می‌خواهید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA مورداعتماد در `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball با HTTPS و SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow candidate را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را در برابر همان tarball بازاستفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. هنگامی که laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، artifact بسته همان candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای نصب/channel/agent، شبکه Gateway، و reload پیکربندی
  - `package`: laneهای package/update/Plugin مبتنی بر artifact، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: chunkهای release-path مربوط به Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای یک اجرای دوباره متمرکز
- وقتی فقط به پوشش کامل CI عادی برای candidate انتشار نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از scoping مبتنی بر تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های docs، Skills مربوط به Python، Windows، macOS، Android، و laneهای Control UI i18n را اجبار می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌دهد و نام‌های span مربوط به trace صادرشده، attributeهای محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر تأیید می‌کند.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، برای توالی انتشار تغییردهنده، `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل‌دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک تعمیر متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را serial می‌کند تا بسته core پیش از Pluginهای externalized خود منتشر نشود.
- release checks اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، gate parity mock مربوط به QA Lab به‌علاوه پروفایل live سریع Matrix و lane مربوط به QA در Telegram را اجرا می‌کند. laneهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای Cross-OS بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است، که workflow قابل‌بازاستفاده `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر انتشار واقعی npm را کوتاه، deterministic، و متمرکز بر artifact نگه دارید، در حالی که بررسی‌های live کندتر در lane خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- release checks دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا commit SHA کامل را می‌پذیرد، به شرطی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل‌دسترسی باشد
- preflight فقط-اعتبارسنجی مربوط به `OpenClaw NPM Release` همچنین commit SHA کامل ۴۰ کاراکتری فعلی branch workflow را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی promote شود
- در حالت SHA، workflow فقط برای بررسی metadata بسته، `v<package.json version>` را synthesize می‌کند؛ انتشار واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- preflight انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید،
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا tag متناظر beta/correction) را اجرا کنید
- پس از انتشار npm،
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه متناظر beta/correction) را اجرا کنید تا مسیر نصب registry منتشرشده را در یک prefix موقت تازه تأیید کنید
- پس از انتشار beta، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی را در برابر بسته npm منتشرشده با استفاده از pool مشترک credential leaseشده Telegram تأیید کنید. اجرای موردی نگه‌دارندگان محلی می‌تواند متغیرهای Convex را حذف کند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس دهد.
- نگه‌دارندگان می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار نگه‌دارندگان اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - انتشار واقعی npm باید از همان branch `main` یا `release/YYYY.M.D` مربوط به اجرای موفق preflight dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` هستند
  - انتشار پایدار npm می‌تواند به‌طور صریح از طریق input workflow، `latest` را هدف بگیرد
  - mutation مبتنی بر token مربوط به npm dist-tag اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط-اعتبارسنجی است؛ وقتی یک tag فقط روی branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار خصوصی واقعی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را گذرانده باشد
  - مسیرهای انتشار واقعی به‌جای ساخت دوباره، artifactهای آماده‌شده را promote می‌کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- preflight انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود تا دوباره dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و metadata بسته در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را گم‌شده ارسال کند، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball candidate update اعمال می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، بزرگ‌شدن تصادفی pack را می‌گیرد
- اگر کار انتشار CI planning، manifestهای زمان‌بندی extension، یا ماتریس‌های آزمون extension را لمس کرده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و بازبینی کنید تا یادداشت‌های انتشار یک layout قدیمی CI را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطح‌های updater است:
  - انتشار GitHub باید در نهایت `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip پایدار جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف ساخت canonical مربوط به Sparkle برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها با آن همه آزمون‌های پیش از انتشار را از یک entrypoint آغاز می‌کنند. برای proof مربوط به commit پین‌شده روی branch با تغییرات سریع، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از همان branch با `ref=<sha>` dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با هدف مطابقت دارد، و سپس branch موقت را حذف می‌کند. این کار مانع از آن می‌شود که به‌اشتباه اجرای فرزند جدیدتری از `main` اثبات شود.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref مورداعتماد `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش‌کار ref هدف را حل می‌کند، `CI` دستی را با
`target_ref=<release-ref>` اجرا می‌کند، `OpenClaw Release Checks` را اجرا می‌کند، و
وقتی `release_profile=full` همراه با `rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را اجرا می‌کند. سپس `OpenClaw Release
Checks` اسموک نصب، بررسی‌های انتشار بین‌سیستم‌عاملی، پوشش مسیر انتشار Docker زنده/E2E، Package Acceptance با QA بسته Telegram، هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده را منشعب می‌کند. اجرای کامل فقط زمانی پذیرفتنی است که
خلاصه‌ی `Full Release Validation`
موفقیت `normal_ci` و `release_checks` را نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ بیرون از full/all رد می‌شود
مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه‌ی نهایی
تاییدکننده شامل جدول‌های کندترین کار برای هر اجرای فرزند است، بنابراین مدیر انتشار می‌تواند مسیر بحرانی فعلی را بدون دانلود کردن لاگ‌ها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل stable و full، مصنوعات، و دسته‌های rerun متمرکز،
[اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref مورداعتمادی اجرا می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولاً `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا تگ انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای ref گردش‌کار Full Release Validation
وجود ندارد؛ هارنس مورداعتماد را با انتخاب ref اجرای گردش‌کار انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند ref dispatch گردش‌کار باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ایجاد شاخه‌ی موقت پین‌شده استفاده کنید.

برای انتخاب گستره‌ی live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر OpenAI/core زنده و Docker که برای انتشار حیاتی است
- `stable`: minimum به‌علاوه‌ی پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه‌ی پوشش گسترده‌ی provider/media مشورتی

`OpenClaw Release Checks` از ref گردش‌کار مورداعتماد استفاده می‌کند تا ref هدف را
یک بار به‌صورت `release-package-under-test` حل کند و همان artifact را هم در
بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره استفاده کند. این کار همه‌ی
محیط‌های مربوط به بسته را روی همان بایت‌ها نگه می‌دارد و از ساخت‌های تکراری بسته جلوگیری می‌کند.
اسموک نصب OpenAI بین‌سیستم‌عاملی وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند،
وگرنه از `openai/gpt-5.5`، چون این lane در حال اثبات نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده است
نه بنچمارک کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر provider زنده همچنان جای پوشش مدل‌محور است.

بسته به مرحله‌ی انتشار از این گونه‌ها استفاده کنید:

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

از چتر کامل به‌عنوان اولین rerun پس از یک اصلاح متمرکز استفاده نکنید. اگر یک محیط
شکست خورد، برای اثبات بعدی از گردش‌کار فرزند شکست‌خورده، job، lane Docker، پروفایل بسته، provider مدل،
یا lane QA استفاده کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که
اصلاح، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه‌ی محیط‌ها را
کهنه کرده باشد. تاییدکننده‌ی نهایی چتر، شناسه‌های ثبت‌شده‌ی اجرای گردش‌کارهای فرزند را دوباره بررسی می‌کند،
پس بعد از اینکه یک گردش‌کار فرزند با موفقیت rerun شد، فقط job والد شکست‌خورده‌ی
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به چتر بدهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه‌ی محیط‌های انتشار
را اجرا می‌کند، و گروه‌های محدودتر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بسته‌ی release-checks استفاده می‌کنند.

### Vitest

محیط Vitest همان گردش‌کار فرزند `CI` دستی است. CI دستی عمداً
scoping تغییرات را دور می‌زند و گراف تست عادی را برای کاندیدای انتشار اجباری می‌کند:
shardهای Linux Node، shardهای bundled-plugin، قراردادهای کانال، سازگاری Node 22،
`check`، `check-additional`، اسموک build، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و i18n Control UI.

از این محیط برای پاسخ به این پرسش استفاده کنید: «آیا درخت source کل مجموعه تست عادی را پاس کرد؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه‌ی `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- اجرای سبز `CI` روی SHA دقیق هدف
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل عملکرد نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که انتشار به CI عادی قطعی نیاز دارد
اما به محیط‌های Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

محیط Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه‌ی گردش‌کار
`install-smoke` در حالت انتشار، قرار دارد. این محیط کاندیدای انتشار را از طریق
محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- اسموک کامل نصب با اسموک نصب global کند Bun فعال
- آماده‌سازی/استفاده‌ی دوباره از image اسموک Dockerfile ریشه بر اساس SHA هدف، با jobهای اسموک QR،
  root/gateway، و installer/Bun که به‌عنوان shardهای جداگانه‌ی install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` در صورت درخواست
- laneهای جداشده‌ی install/uninstall برای bundled plugin
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- مجموعه‌های provider زنده/E2E و پوشش مدل زنده Docker وقتی release checks
  شامل مجموعه‌های زنده باشد

پیش از rerun از artifactهای Docker استفاده کنید. زمان‌بند مسیر انتشار
`.artifacts/docker-tests/` را با لاگ‌های lane، `summary.json`، `failures.json`،
زمان‌بندی مرحله‌ها، JSON برنامه‌ی زمان‌بند، و دستورهای rerun آپلود می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه‌ی chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی گردش‌کار زنده/E2E reusable استفاده کنید.
دستورهای rerun تولیدشده، وقتی در دسترس باشند، `package_artifact_run_id` قبلی
و ورودی‌های image آماده‌شده‌ی Docker را شامل می‌شوند، بنابراین یک lane شکست‌خورده می‌تواند از همان tarball و imageهای GHCR دوباره استفاده کند.

### QA Lab

محیط QA Lab نیز بخشی از `OpenClaw Release Checks` است. این محیط gate انتشار
رفتار agentic و سطح کانال است، جدا از Vitest و مکانیک بسته‌ی Docker.

پوشش QA Lab انتشار شامل این موارد است:

- gate هم‌ارزی mock که lane کاندیدای OpenAI را با baseline Opus 4.6
  با استفاده از بسته‌ی هم‌ارزی agentic مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این محیط برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
جریان‌های کانال زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact برای laneهای هم‌ارزی، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌صورت
اجرای دستی sharded QA-Lab در دسترس است، نه lane پیش‌فرض حیاتی برای انتشار.

### بسته

محیط بسته، gate محصول نصب‌پذیر است. پشتوانه‌ی آن
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` است. resolver یک کاندیدا را به
tarball `package-under-test` مصرف‌شده توسط Docker E2E نرمال می‌کند، موجودی بسته را اعتبارسنجی می‌کند،
نسخه‌ی بسته و SHA-256 را ثبت می‌کند، و ref هارنس گردش‌کار را از ref source بسته جدا نگه می‌دارد.

منابع کاندیدای پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw
- `source=ref`: بسته‌بندی یک شاخه، تگ، یا SHA کامل commit مورداعتماد `package_ref`
  با هارنس انتخاب‌شده‌ی `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده‌ی دوباره از یک `.tgz` آپلودشده توسط اجرای دیگر GitHub Actions

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته‌ی انتشار آماده‌شده،
`suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update، پاک‌سازی dependencyهای stale Plugin، fixtureهای Plugin آفلاین، update Plugin، و QA بسته Telegram را در برابر همان tarball حل‌شده نگه می‌دارد. این جایگزین بومی GitHub برای بیشتر پوشش package/update است که قبلاً به Parallels نیاز داشت. بررسی‌های انتشار cross-OS همچنان برای onboarding، installer، و رفتار platform خاص سیستم‌عامل مهم‌اند، اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست مرجع برای اعتبارسنجی update و Plugin این است:
[تست updateها و Pluginها](/fa/help/testing-updates-plugins). هنگام تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance، یا release-check
نصب/update یک Plugin، پاک‌سازی doctor، یا تغییر migration بسته‌ی منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration کامل update منتشرشده از هر بسته‌ی stable `2026.4.23+` یک گردش‌کار دستی جداگانه‌ی `Update Migration` است، نه بخشی از Full Release CI.

سهل‌گیری قدیمی package-acceptance عمداً زمان‌دار است. بسته‌های تا
`2026.4.25` ممکن است برای gapهای metadata که پیش‌تر روی npm منتشر شده‌اند از مسیر سازگاری استفاده کنند:
ورودی‌های private QA inventory که در tarball نیستند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، مکان‌های قدیمی install-record برای Plugin،
نبود پایداری install-record marketplace، و migration metadata config هنگام `plugins update`.
بسته‌ی منتشرشده‌ی `2026.4.26` ممکن است برای فایل‌های stamp metadata ساخت محلی که قبلاً ship شده‌اند هشدار دهد.
بسته‌های بعدی باید قراردادهای مدرن بسته را رعایت کنند؛ همان gapها باعث شکست
اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار درباره‌ی یک بسته‌ی واقعاً نصب‌پذیر است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: laneهای سریع نصب بسته/channel/agent، شبکه‌ی Gateway، و reload config
- `package`: قراردادهای نصب/update/بسته‌ی Plugin بدون ClawHub زنده؛ این پیش‌فرض release-check است
- `product`: `package` به‌علاوه‌ی کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: chunkهای مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای rerunهای متمرکز

برای اثبات بسته‌ی نامزد Telegram، در Package Acceptance گزینه‌ی `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را فعال کنید. این workflow فایل tarball
حل‌شده‌ی `package-under-test` را به مسیر Telegram می‌فرستد؛ workflow مستقل
Telegram همچنان برای بررسی‌های پس از انتشار، یک مشخصه‌ی npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار Release

`OpenClaw Release Publish` نقطه‌ی ورود عادی انتشار تغییردهنده است. این فرایند
workflowهای ناشر معتمد را به ترتیبی که Release نیاز دارد هماهنگ می‌کند:

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

انتشار پایدار به dist-tag بتای پیش‌فرض:

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
فقط برای کارهای ترمیم یا بازانتشار متمرکز استفاده کنید. برای ترمیم یک plugin
انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته‌ی OpenClaw نباید منتشر شود،
workflow فرزند را مستقیماً dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ Release الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط جهت
  اعتبارسنجی، می‌تواند SHA کامل ۴۰ کاراکتری کامیت شاخه‌ی workflow فعلی نیز باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/ساخت/بسته، و مقدار `false`
  برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball
  آماده‌شده از اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: تگ Release الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه‌ی اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته‌ی OpenClaw
- `plugin_publish_scope`: مقدار پیش‌فرض `all-publishable` است؛ فقط برای کار
  ترمیم متمرکز از `selected` استفاده کنید
- `plugins`: نام بسته‌های `@openclaw/*` جداشده با ویرگول وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: مقدار پیش‌فرض `true` است؛ فقط وقتی workflow را به
  عنوان هماهنگ‌کننده‌ی ترمیم مخصوص plugin استفاده می‌کنید، آن را `false` کنید

`OpenClaw Release Checks` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه‌ی OpenClaw یا تگ Release قابل دسترسی باشد.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- تگ‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight
  استفاده شده است؛ workflow پیش از ادامه‌ی انتشار، آن metadata را تأیید می‌کند

## توالی Release پایدار npm

هنگام آماده‌سازی یک Release پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل کامیت شاخه‌ی workflow فعلی برای یک
     اجرای آزمایشی خشکِ فقط اعتبارسنجی از workflow preflight استفاده کنید
2. برای جریان عادی اول-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمداً انتشار پایدار مستقیم می‌خواهید، `latest` را انتخاب کنید
3. وقتی پوشش عادی CI به‌همراه prompt cache زنده، Docker، QA Lab، Matrix، و
   Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را روی
   شاخه‌ی Release، تگ Release، یا SHA کامل کامیت اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادی و deterministic نیاز دارید، به‌جای آن
   workflow دستی `CI` را روی ref مربوط به Release اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار pluginهای externalized را
   پیش از ارتقای بسته‌ی npm مربوط به OpenClaw، در npm و ClawHub منتشر می‌کند
7. اگر Release روی `beta` فرود آمد، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه‌ی پایدار از `beta` به `latest` استفاده کنید
8. اگر Release عمداً مستقیماً در `latest` منتشر شد و `beta` باید فوراً همان
   ساخت پایدار را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو
   dist-tag به نسخه‌ی پایدار اشاره کنند، یا اجازه دهید همگام‌سازی خودترمیمی
   زمان‌بندی‌شده‌ی آن بعداً `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در repo خصوصی قرار دارد، چون هنوز به
`NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط مبتنی بر OIDC را حفظ
می‌کند.

این کار باعث می‌شود هم مسیر انتشار مستقیم و هم مسیر ارتقای اول-بتا مستند و
برای اپراتور قابل مشاهده باشند.

اگر یک maintainer ناچار شود به احراز هویت محلی npm برگردد، هر فرمان CLI مربوط
به 1Password (`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را
مستقیماً از shell اصلی agent فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود
promptها، هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری host
جلوگیری شود.

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

maintainerها برای runbook واقعی از اسناد خصوصی Release در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های Release](/fa/install/development-channels)
