---
read_when:
    - در حال جست‌وجوی تعاریف کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در حال جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، فهرست بررسی اپراتور، محیط‌های اعتبارسنجی، نام‌گذاری نسخه، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-04T07:07:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده‌ای که به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صریحاً درخواست شود در npm با `latest` منتشر می‌شوند
- beta: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- dev: سرِ در حال حرکتِ `main`

## نام‌گذاری نسخه

- نسخهٔ انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخهٔ انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخهٔ پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پر نکنید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند؛ متصدیان انتشار می‌توانند صریحاً `latest` را هدف بگیرند، یا بعداً یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بستهٔ npm و برنامهٔ macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولاً ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامهٔ mac برای نسخهٔ پایدار نگه داشته می‌شود مگر آنکه صریحاً درخواست شود

## چرخهٔ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخهٔ `release/YYYY.M.D` که از
  `main` فعلی ساخته شده است جدا می‌کنند، تا اعتبارسنجی انتشار و رفع اشکال‌ها
  توسعهٔ جدید روی `main` را مسدود نکند
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی برچسب بتای قدیمی، برچسب `-beta.N` بعدی را جدا می‌کنند
- رویهٔ تفصیلی انتشار، تأییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌داران است

## چک‌لیست متصدی انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag، و جزئیات rollback اضطراری در
دستورالعمل اجرایی انتشارِ فقط مخصوص نگه‌داران باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازهٔ کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچهٔ واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   پیش از ساخت شاخه یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمداً حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیماً روی `main` انجام ندهید.
5. همهٔ محل‌های نسخهٔ لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخهٔ انتشار
   و فرادادهٔ سازگاری مشترک داشته باشند، سپس پیش‌بررسی قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ نویسه‌ای از شاخهٔ انتشار برای پیش‌بررسی صرفاً اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همهٔ آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخهٔ انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطهٔ ورود دستی
   برای چهار جعبهٔ آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخهٔ انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده‌ای را که
   اصلاح را اثبات می‌کند دوباره اجرا کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخهٔ منطبق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   ابتدا همهٔ بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، سپس همان
   مجموعه را به‌عنوان tarballهای ClawPack npm-pack در ClawHub منتشر می‌کند، و بعد
   مصنوع پیش‌بررسی npm آمادهٔ OpenClaw را با dist-tag منطبق ترویج می‌کند. پس از
   انتشار، پذیرش بستهٔ پس از انتشار را در برابر بستهٔ منتشرشدهٔ
   `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شمارهٔ پیش‌انتشار منطبق بعدی را جدا کنید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتا یا نامزد انتشار بررسی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود، با استفادهٔ دوباره از مصنوع پیش‌بررسی موفق از طریق
    `preflight_run_id`؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدگر پس از انتشار npm، E2E اختیاری Telegram برای
    npm منتشرشدهٔ مستقل وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و منطبق `CHANGELOG.md`، و گام‌های اعلام انتشار را اجرا کنید.

## پیش‌بررسی انتشار

- پیش از بررسی مقدماتی انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها خارج از gate سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از بررسی مقدماتی انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه‌های import و مرزهای معماری خارج از gate سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار مورد انتظار `dist/*` و bundle رابط کاربری کنترل برای مرحله اعتبارسنجی pack موجود باشند
- پس از افزایش نسخه ریشه و پیش از tag زدن، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های packageهای Plugin قابل انتشار، فراداده سازگاری peer/API مربوط به OpenClaw، فراداده build، و stubهای changelog Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار core هم‌خوان شوند. `pnpm plugins:sync:check` نگهبان غیرتغییردهنده انتشار است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک entrypoint آغاز شوند. این workflow یک branch، tag، یا commit SHA کامل می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، suiteهای مسیر انتشار Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E package را روی artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید package منتشرشده npm را هم اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance باید matrix package/update خود را به‌جای artifact ساخته‌شده از SHA روی package ارسال‌شده npm اجرا کند، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش evidence خصوصی باید بدون اجبار Telegram E2E اثبات کند که اعتبارسنجی با یک package منتشرشده npm مطابقت دارد، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید در حالی که کار انتشار ادامه دارد برای یک candidate package اثبات جانبی بگیرید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA قابل اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط اجرای دیگری از GitHub Actions از `source=artifact` استفاده کنید. این workflow candidate را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را روی آن tarball بازاستفاده می‌کند، و می‌تواند QA Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، artifact package همان candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و reload پیکربندی
  - `package`: laneهای package/update/plugin بومی artifact بدون OpenWebUI یا ClawHub زنده
  - `product`: profile package به‌علاوه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- وقتی فقط به پوشش کامل CI عادی برای candidate انتشار نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای CI دستی scoping بر اساس تغییرات را دور می‌زنند و shardهای Linux Node، shardهای bundled-plugin، contractهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n رابط کاربری کنترل را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک receiver محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace صادرشده، attributeهای محدود، و redact شدن content/identifier را بدون نیاز به Opik، Langfuse، یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، برای دنباله انتشار تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق OpenClaw npm را پاس بدهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً تعمیر متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار Plugin در ClawHub، و انتشار OpenClaw در npm را سریالی می‌کند تا package core پیش از Pluginهای externalized خود منتشر نشود.
- اکنون release checks در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane برابری mock در QA Lab به‌علاوه profile سریع Matrix زنده و lane QA Telegram را اجرا می‌کند. laneهای زنده از environment `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان سیستم‌عامل‌ها بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است، که workflow قابل بازاستفاده `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر artifact نگه دارید، در حالی که بررسی‌های زنده کندتر در lane خودشان باقی می‌مانند تا انتشار را متوقف یا block نکنند
- release checkهایی که secret دارند باید از طریق `Full Release Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا logic workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا commit SHA کامل را می‌پذیرد تا زمانی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- بررسی مقدماتی فقط-اعتبارسنجی `OpenClaw NPM Release` نیز commit SHA کامل ۴۰ کاراکتری branch workflow فعلی را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به یک انتشار واقعی promote شود
- در حالت SHA، workflow فقط برای بررسی فراداده package مقدار `v<package.json version>` را synthesize می‌کند؛ انتشار واقعی همچنان به tag واقعی انتشار نیاز دارد
- هر دو workflow مسیر واقعی انتشار و promotion را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` را با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- بررسی مقدماتی انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` را اجرا کنید (یا tag متناظر beta/correction)
- پس از انتشار npm، برای بررسی مسیر نصب registry منتشرشده در یک temp prefix تازه، `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` را اجرا کنید (یا نسخه متناظر beta/correction)
- پس از انتشار beta، برای بررسی onboarding package نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی روی package منتشرشده npm با استفاده از pool مشترک credentialهای اجاره‌ای Telegram، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید. اجرای موردی محلی توسط maintainer می‌تواند vars مربوط به Convex را حذف کند و سه credential env یعنی `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس بدهد.
- برای اجرای smoke کامل beta پس از انتشار از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. helper اعتبارسنجی Parallels برای npm update/fresh-target را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، artifact را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- maintainers می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید از یک `preflight_run_id` موفق npm عبور کند
  - انتشار واقعی npm باید از همان branch `main` یا `release/YYYY.M.D` اجرا شود که preflight موفق از آن اجرا شده است
  - انتشارهای stable npm به‌طور پیش‌فرض روی `beta` قرار می‌گیرند
  - انتشار stable npm می‌تواند از طریق ورودی workflow صراحتاً `latest` را هدف بگیرد
  - تغییر token-based در dist-tagهای npm اکنون برای امنیت در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی انتشار فقط با OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط اعتبارسنجی است؛ وقتی یک tag فقط روی branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید از `preflight_run_id` و `validate_run_id` موفق private mac عبور کند
  - مسیرهای واقعی انتشار artifactهای آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را rebuild کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌سروصدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- بررسی مقدماتی انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود تا دوباره dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین budget مربوط به `unpackedSize` در npm pack را روی tarball candidate update اعمال می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، افزایش ناخواسته حجم pack را می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا matrixهای تست extension دست زده است، پیش از تأیید، outputهای matrix مربوط به `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره generate و review کنید تا release notes layout کهنه CI را توصیف نکند
- آمادگی انتشار stable macOS همچنین شامل سطوح updater است:
  - GitHub release باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` packageشده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip پایدار جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` در حداقل کف build canonical Sparkle یا بالاتر برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها با آن همه تست‌های پیش از انتشار را از یک entrypoint آغاز می‌کنند. برای اثبات commit pinشده روی branch پرتحرک، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper مقدار `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند با هدف مطابقت داشته باشد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی یک اجرای فرزند جدیدتر روی `main` جلوگیری می‌کند.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref قابل اعتماد `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش‌کار، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک
artifact والد `release-package-under-test` را برای بررسی‌های مرتبط با بسته آماده می‌کند، و
وقتی `release_profile=full` با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را dispatch می‌کند. سپس `OpenClaw Release
Checks` بررسی‌های install smoke، بررسی‌های انتشار cross-OS، پوشش مسیر انتشار live/E2E Docker،
Package Acceptance با QA بسته Telegram، برابری QA Lab،
Matrix زنده، و Telegram زنده را fan out می‌کند. یک اجرای کامل فقط زمانی قابل قبول است که
خلاصه‌ی `Full Release Validation`
`normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، مگر اینکه
یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد، skip می‌شود. خلاصه‌ی نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار بتواند
مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای matrix کامل مرحله‌ها، نام دقیق jobهای workflow، تفاوت‌های پروفایل stable در برابر full،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
workflowهای فرزند از ref مورد اعتماد که `Full Release
Validation` را اجرا می‌کند dispatch می‌شوند، معمولاً `--ref main`، حتی وقتی target `ref` به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای workflow-ref در Full Release Validation
وجود ندارد؛ harness مورد اعتماد را با انتخاب ref اجرای workflow انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه‌ی موقت pinned استفاده کنید.

برای انتخاب گستره‌ی live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر live و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه‌ی پوشش provider/backend پایدار برای تأیید انتشار
- `full`: stable به‌علاوه‌ی پوشش گسترده‌ی advisory provider/media

`OpenClaw Release Checks` از ref مورد اعتماد workflow استفاده می‌کند تا ref هدف را
یک‌بار به‌عنوان `release-package-under-test` resolve کند و همان artifact را هم در
بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره به کار ببرد. این کار همه‌ی
boxهای مرتبط با بسته را روی byteهای یکسان نگه می‌دارد و از ساخت‌های تکراری بسته جلوگیری می‌کند.
install smoke مربوط به cross-OS OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane در حال
اثبات نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. matrix گسترده‌تر provider زنده همچنان محل
پوشش اختصاصی مدل‌ها باقی می‌ماند.

بسته به مرحله‌ی انتشار از این variantها استفاده کنید:

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
fail شود، برای اثبات بعدی از workflow فرزند fail‌شده، job، Docker lane، پروفایل بسته، provider مدل،
یا QA lane استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
fix، orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه‌ی boxها را
کهنه کرده باشد. verifier نهایی umbrella دوباره idهای ثبت‌شده‌ی اجرای workflow فرزند
را بررسی می‌کند، پس بعد از اینکه یک workflow فرزند با موفقیت rerun شد، فقط job والد fail‌شده‌ی
`Verify full validation` را rerun کنید.

برای بازیابی bounded، `rerun_group` را به umbrella پاس دهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI معمولی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند مخصوص انتشار Plugin را اجرا می‌کند، `release-checks` همه‌ی boxهای انتشار
را اجرا می‌کند، و گروه‌های محدودتر انتشار عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بسته‌ی release-checks استفاده می‌کنند.

### Vitest

box مربوط به Vitest همان workflow فرزند `CI` دستی است. CI دستی عمداً
scoping تغییرات را دور می‌زند و graph معمول test را برای release candidate اجبار می‌کند:
shardهای Linux Node، shardهای Pluginهای bundled، contractهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows،
macOS، Android، و Control UI i18n.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree کل test suite معمول را پاس کرده است؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه‌ی `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- اجرای `CI` سبز روی SHA دقیق هدف
- نام shardهای fail‌شده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای timing Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل کارایی نیاز دارد

CI دستی را مستقیماً فقط وقتی اجرا کنید که انتشار به CI معمول deterministic نیاز داشته باشد اما
به boxهای Docker، QA Lab، live، cross-OS، یا package نیاز نداشته باشد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker درون `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه‌ی workflow
`install-smoke` در حالت release قرار دارد. این box، release candidate را از طریق محیط‌های
Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط testهای سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن smoke نصب global کند Bun
- آماده‌سازی/استفاده‌ی دوباره از image smoke ریشه‌ی Dockerfile براساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانه‌ی install-smoke اجرا می‌شوند
- laneهای E2E repository
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای جداشده‌ی نصب/حذف Plugin bundled
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زنده‌ی Docker وقتی release checks
  شامل suiteهای live باشند

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`,
timingهای phase، JSON طرح scheduler، و دستورهای rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه‌ی chunkهای انتشار، روی workflow live/E2E قابل استفاده‌مجدد از
`docker_lanes=<lane[,lane]>` استفاده کنید. دستورهای rerun تولیدشده وقتی موجود باشند شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده‌شده‌ی Docker هستند، تا یک
lane fail‌شده بتواند از همان tarball و imageهای GHCR دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار مربوط به
رفتار agentic و سطح channel است، جدا از Vitest و سازوکارهای package Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane برابری mock که lane candidate OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل سریع QA زنده‌ی Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده‌ی Telegram با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز داشته باشد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URLهای artifact برای laneهای برابری،
Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی sharded QA-Lab
در دسترس است، نه lane حیاتی پیش‌فرض برای انتشار.

### Package

box مربوط به Package همان gate محصول قابل‌نصب است. این box با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` مصرف‌شده توسط Docker E2E normalize می‌کند،
inventory بسته را اعتبارسنجی می‌کند، نسخه‌ی بسته و SHA-256 را ثبت می‌کند، و ref
harness workflow را از ref source بسته جدا نگه می‌دارد.

sourceهای candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw
- `source=ref`: بسته‌بندی یک شاخه، tag، یا SHA کامل commit مربوط به `package_ref` مورد اعتماد
  با harness انتخاب‌شده‌ی `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده‌ی دوباره از یک `.tgz` uploadشده توسط اجرای دیگری از GitHub Actions

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact
بسته‌ی آماده‌شده‌ی انتشار، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
`published_upgrade_survivor_baselines=all-since-2026.4.23`،
`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update، پاک‌سازی
وابستگی stale Plugin، fixtureهای Plugin offline، update Plugin، و QA بسته Telegram
را در برابر همان tarball resolve‌شده نگه می‌دارد. matrix upgrade هر baseline پایدار منتشرشده در npm را از `2026.4.23` تا `latest` پوشش می‌دهد؛ برای یک candidate که قبلاً منتشر شده است از
Package Acceptance با `source=npm` استفاده کنید، یا برای یک tarball محلی npm مبتنی بر SHA پیش از
publish از `source=ref`/`source=artifact` استفاده کنید. این جایگزین native در GitHub
برای بیشتر پوشش package/update است که قبلاً به Parallels نیاز داشت.
بررسی‌های انتشار cross-OS همچنان برای onboarding، installer، و رفتار platform خاص OS مهم‌اند،
اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

checklist canonical برای اعتبارسنجی update و Plugin این است:
[آزمایش updateها و Pluginها](/fa/help/testing-updates-plugins). هنگام تصمیم‌گیری درباره‌ی اینکه
کدام lane محلی، Docker، Package Acceptance، یا release-check یک تغییر نصب/update Plugin،
پاک‌سازی doctor، یا migration بسته‌ی منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration کامل update منتشرشده از هر بسته‌ی پایدار `2026.4.23+`
یک workflow دستی جداگانه‌ی `Update Migration` است، نه بخشی از Full Release CI.

leniency قدیمی package-acceptance عمداً time boxed است. بسته‌ها تا
`2026.4.25` می‌توانند برای gapهای metadata که قبلاً در npm منتشر شده‌اند
از مسیر compatibility استفاده کنند: entryهای private QA inventory که در tarball وجود ندارند،
نبود `gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball،
نبود `update.channel` persisted، محل‌های قدیمی install-record مربوط به Plugin،
نبود persistence برای install-record marketplace، و migration metadata config
در طول `plugins update`. بسته‌ی منتشرشده‌ی `2026.4.26` ممکن است برای فایل‌های stamp
metadata ساخت محلی که قبلاً ship شده‌اند warning بدهد. بسته‌های بعدی باید
contractهای مدرن package را برآورده کنند؛ همان gapها باعث fail شدن اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار درباره‌ی یک بسته‌ی واقعاً قابل‌نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب package/channel/agent، شبکه Gateway، و بارگذاری دوباره config
- `package`: قراردادهای نصب/به‌روزرسانی/Plugin package بدون ClawHub زنده؛ این پیش‌فرض release-check است
- `product`: `package` به‌همراه channelهای MCP، پاک‌سازی Cron/زیرعامل، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد package، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. workflow، فایل tarball حل‌شده
`package-under-test` را به مسیر Telegram می‌دهد؛ workflow مستقل
Telegram همچنان یک مشخصه منتشرشده npm را برای بررسی‌های پس از انتشار می‌پذیرد.

## خودکارسازی انتشار release

`OpenClaw Release Publish` نقطه ورود معمول انتشار تغییردهنده است. این workflowهای trusted-publisher را به ترتیبی که release نیاز دارد هماهنگ می‌کند:

1. تگ release را check out می‌کند و commit SHA آن را حل می‌کند.
2. بررسی می‌کند که تگ از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا می‌کند.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch می‌کند.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch می‌کند.
6. `OpenClaw NPM Release` را با تگ release، dist-tag مربوط به npm، و
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

ارتقای پایدار مستقیما به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release` فقط برای کار تعمیر یا بازنشر متمرکز استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی package مربوط به OpenClaw نباید منتشر شود، workflow فرزند را مستقیما dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `tag`: تگ release الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط اعتبارسنجی می‌تواند SHA کامل ۴۰ کاراکتری commit فعلی شاخه workflow هم باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/ساخت/package، و `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ پیش‌فرض آن `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `tag`: تگ release الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای package مربوط به OpenClaw
- `plugin_publish_scope`: پیش‌فرض آن `all-publishable` است؛ فقط برای کار تعمیر متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های package با جداکننده ویرگول از نوع `@openclaw/*` وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض آن `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده تعمیر صرفا Plugin استفاده می‌کنید، آن را `false` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند commit حل‌شده از یک شاخه OpenClaw یا تگ release قابل دسترسی باشد.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند در `beta` یا `latest` منتشر شوند
- تگ‌های پیش‌انتشار beta فقط می‌توانند در `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛ workflow پیش از ادامه انتشار، آن metadata را بررسی می‌کند

## توالی release پایدار npm

هنگام ایجاد یک release پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل commit فعلی شاخه workflow برای اجرای آزمایشی فقط اعتبارسنجی workflow مربوط به preflight استفاده کنید
2. برای جریان عادی beta-first، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی عمدا انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی می‌خواهید CI عادی به‌همراه پوشش live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک workflow دستی داشته باشید، `Full Release Validation` را روی شاخه release، تگ release، یا SHA کامل commit اجرا کنید
4. اگر عمدا فقط به گراف تست عادی قطعی نیاز دارید، به‌جای آن workflow دستی `CI` را روی ref مربوط به release اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای externalized را پیش از ارتقای package npm مربوط به OpenClaw در npm و ClawHub منتشر می‌کند
7. اگر release روی `beta` فرود آمد، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر release عمدا مستقیما روی `latest` منتشر شد و `beta` باید بلافاصله همان build پایدار را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو dist-tag را به نسخه پایدار اشاره دهد، یا اجازه دهید همگام‌سازی خودترمیم زمان‌بندی‌شده آن بعدا `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در repo خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط با OIDC را حفظ می‌کند.

این کار هر دو مسیر انتشار مستقیم و مسیر ارتقای beta-first را مستند و برای operator قابل مشاهده نگه می‌دارد.

اگر یک maintainer ناچار شود به احراز هویت محلی npm برگردد، هر دستور CLI مربوط به 1Password (`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را مستقیما از shell اصلی agent فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود promptها، هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان جلوگیری می‌کند.

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

maintainerها برای runbook واقعی از مستندات خصوصی release در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های release](/fa/install/development-channels)
