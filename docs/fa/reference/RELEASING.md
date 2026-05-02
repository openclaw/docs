---
read_when:
    - در حال جست‌وجوی تعاریف کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، باکس‌های اعتبارسنجی، نام‌گذاری نسخه، و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-02T23:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: نسخه‌های برچسب‌خورده‌ای که به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm `latest`
- beta: برچسب‌های پیش‌انتشار که در npm `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه اصلاحی انتشار پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار Beta: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب فعلی beta
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت beta بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای beta معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای stable نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از beta عبور می‌کنند
- stable فقط پس از اعتبارسنجی آخرین beta دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` ایجاد می‌کنند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی و اصلاحات انتشار توسعه جدید
  روی `main` را مسدود نکند
- اگر یک برچسب beta ارسال یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازآفرینی برچسب قدیمی beta، برچسب بعدی `-beta.N` را ایجاد می‌کنند
- رویه دقیق انتشار، تأییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات بازگشت اضطراری در
راهنمای اجرای انتشار مخصوص نگه‌داران باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین نسخه را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   یک بار دیگر پیش از شاخه‌سازی rebase/pull کنید.
3. سوابق سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری‌های منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داشته باشد، یا ثبت کنید چرا
   عمدا حفظ شده‌اند.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار معمول انتشار را
   مستقیما روی `main` انجام ندهید.
5. همه محل‌های نسخه لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید
   تا بسته‌های Plugin قابل انتشار نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری شاخه انتشار برای پیش‌پرواز فقط اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین فایل،
   مسیر، job گردش‌کار، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده‌ای را دوباره اجرا کنید که
   اصلاح را اثبات می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر کرده
   شواهد قبلی را کهنه کند.
9. برای beta، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه متناظر `release/YYYY.M.D` اجرا کنید. این فرمان `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، مجموعه مشابه را
   در مرحله دوم در ClawHub منتشر می‌کند، و سپس آرتیفکت پیش‌پرواز آماده‌شده OpenClaw در npm را
   با dist-tag متناظر ترویج می‌دهد. پس از انتشار، پذیرش بسته پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار متناظر بعدی را ایجاد کنید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای stable، فقط پس از آن ادامه دهید که beta بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار stable در npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و از آرتیفکت پیش‌پرواز موفق با
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار stable macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، راستی‌آزمای پس از انتشار npm، E2E اختیاری Telegram برای npm منتشرشده مستقل
    وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و متناظر `CHANGELOG.md`، و مراحل اعلام انتشار
    را اجرا کنید.

## پیش‌پرواز انتشار

- اجرای `pnpm check:test-types` پیش از پیش‌بررسی انتشار تا TypeScript آزمون‌ها بیرون از دروازه سریع‌تر محلی `pnpm check` پوشش داده بماند
- اجرای `pnpm check:architecture` پیش از پیش‌بررسی انتشار تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از دروازه سریع‌تر محلی سبز باشند
- اجرای `pnpm build && pnpm ui:build` پیش از `pnpm release:check` تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- اجرای `pnpm plugins:sync` پس از افزایش نسخه ریشه و پیش از tag کردن. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری peer/API OpenClaw، فراداده build و stubهای changelog Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار core هماهنگ شوند. `pnpm plugins:sync:check` نگهبان غیرتغییردهنده انتشار است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هر تغییر در registry شکست می‌خورد.
- اجرای workflow دستی `Full Release Validation` پیش از تأیید انتشار برای آغاز همه test boxهای پیش از انتشار از یک entrypoint. این workflow یک branch، tag یا commit SHA کامل می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، وقتی همان Telegram E2E باید بسته npm منتشرشده را هم اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance باید ماتریس package/update خود را در برابر بسته npm ارسال‌شده اجرا کند، نه آرتیفکت ساخته‌شده از SHA، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش evidence خصوصی باید اثبات کند که اعتبارسنجی با یک بسته npm منتشرشده مطابق است بدون اینکه Telegram E2E را اجباری کند، `evidence_package_spec` را ارائه کنید. مثال: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- اجرای workflow دستی `Package Acceptance` وقتی برای نامزد بسته، همزمان با ادامه کار انتشار، proof جانبی می‌خواهید. از `source=npm` برای `openclaw@beta`، `openclaw@latest` یا نسخه دقیق انتشار استفاده کنید؛ از `source=ref` برای pack کردن branch/tag/SHA مورد اعتماد `package_ref` با harness فعلی `workflow_ref`؛ از `source=url` برای tarball HTTPS با SHA-256 الزامی؛ یا از `source=artifact` برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions. این workflow نامزد را به `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند Telegram QA را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway و reload پیکربندی
  - `package`: laneهای package/update/plugin بومی آرتیفکت بدون OpenWebUI یا ClawHub زنده
  - `product`: profile بسته به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- اجرای مستقیم workflow دستی `CI` وقتی فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید. dispatchهای دستی CI از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، Android و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- اجرای `pnpm qa:otel:smoke` هنگام اعتبارسنجی telemetry انتشار. این دستور QA-lab را از طریق گیرنده محلی OTLP/HTTP تمرین می‌دهد و نام spanهای trace صادرشده، attributeهای محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse یا جمع‌آورنده خارجی دیگر تأیید می‌کند.
- اجرای `pnpm release:check` پیش از هر انتشار tag‌شده
- اجرای `OpenClaw Release Publish` برای توالی انتشار تغییردهنده پس از وجود tag. آن را از `release/YYYY.M.D` dispatch کنید (یا از `main` هنگام انتشار tag قابل دسترسی از main)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin و انتشار npm مربوط به OpenClaw را serialize می‌کند تا بسته core پیش از Pluginهای externalized خودش منتشر نشود.
- release checks اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane هم‌ارزی mock مربوط به QA Lab به‌علاوه profile سریع live Matrix و lane مربوط به Telegram QA را اجرا می‌کند. laneهای live از environment `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی inventory کامل transport، media و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade بین سیستم‌عامل‌ها بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm کوتاه، deterministic و متمرکز بر آرتیفکت بماند، در حالی‌که بررسی‌های live کندتر در lane خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- release checkهای دارای secret باید از طریق `Full Release Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag یا commit SHA کامل را می‌پذیرد، تا زمانی که commit resolve‌شده از یک branch یا release tag متعلق به OpenClaw قابل دسترسی باشد
- پیش‌بررسی validation-only مربوط به `OpenClaw NPM Release` همچنین commit SHA کامل ۴۰ کاراکتری فعلی workflow-branch را بدون نیاز به tag push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا یابد
- در حالت SHA، workflow فقط برای بررسی فراداده بسته `v<package.json version>` را synthesize می‌کند؛ انتشار واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی‌که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` را با هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌بررسی انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- اجرای `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (یا tag متناظر beta/correction) پیش از تأیید
- پس از انتشار npm، اجرای `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (یا نسخه متناظر beta/correction) برای تأیید مسیر نصب registry منتشرشده در یک prefix موقت تازه
- پس از انتشار beta، اجرای `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` برای تأیید onboarding بسته نصب‌شده، راه‌اندازی Telegram و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool اشتراکی credentialهای Telegram اجاره‌شده. one-offهای محلی maintainer می‌توانند varهای Convex را حذف کنند و سه credential env مربوط به `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس بدهند.
- Maintainerها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از الگوی preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm داشته باشد
  - انتشار واقعی npm باید از همان branch یعنی `main` یا `release/YYYY.M.D` که اجرای preflight موفق از آن بوده dispatch شود
  - انتشارهای stable npm به‌صورت پیش‌فرض روی `beta` هستند
  - انتشار stable npm می‌تواند از طریق ورودی workflow صراحتاً `latest` را هدف بگیرد
  - تغییر token-based مربوط به dist-tag در npm اکنون برای امنیت در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی‌که repo عمومی انتشار OIDC-only را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک tag فقط روی branch انتشار وجود دارد اما workflow از `main` dispatch شده است، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac داشته باشد
  - مسیرهای انتشار واقعی، آرتیفکت‌های آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را rebuild کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با prefix موقت از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload stable پایه باقی بگذارند
- پیش‌بررسی انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم شامل `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` باشد تا دوباره dashboard مرورگر خالی منتشر نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده بسته در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را شکست می‌دهد و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball به‌روزرسانی نامزد enforce می‌کند، تا installer e2e پیش از مسیر انتشار release، bloat تصادفی pack را تشخیص دهد
- اگر کار انتشار به CI planning، manifestهای timing مربوط به extension، یا ماتریس‌های آزمون extension دست زده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` بازتولید و بازبینی کنید تا release notes یک layout قدیمی CI را توصیف نکنند
- آمادگی انتشار stable macOS همچنین شامل سطح‌های updater است:
  - release در GitHub باید در نهایت `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - `appcast.xml` روی `main` پس از انتشار باید به zip stable جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف build canonical Sparkle برای آن نسخه انتشار را نگه دارد

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه آزمون‌های پیش از انتشار را از یک entrypoint آغاز می‌کنند. برای proof مربوط به commit pin‌شده روی branch پرتحرک، از helper استفاده کنید تا هر workflow فرزند از branch موقتی ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با هدف مطابق است، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref مورد اعتماد `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش کار، ref هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، و
E2E مستقل بسته Telegram را زمانی dispatch می‌کند که `release_profile=full` با
`rerun_group=all` باشد یا زمانی که `npm_telegram_package_spec` تنظیم شده باشد. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker
release-path، Package Acceptance با QA بسته Telegram، هم‌ارزی QA Lab،
Matrix زنده، و Telegram زنده را fan out می‌کند. اجرای کامل فقط زمانی پذیرفتنی است که
خلاصه `Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، نادیده گرفته می‌شود
مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه نهایی
verifier شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود کردن logها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش کار، تفاوت‌های پروفایل stable و full،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref مورداعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولاً `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا tag انتشار قدیمی‌تر اشاره کند. ورودی جداگانه‌ای برای Full Release Validation
workflow-ref وجود ندارد؛ harness مورداعتماد را با انتخاب ref اجرای گردش کار انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ایجاد شاخه موقت pinشده استفاده کنید.

از `release_profile` برای انتخاب گستره live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر release-critical OpenAI/core live و Docker
- `stable`: minimum به‌علاوه پوشش provider/backend پایدار برای تأیید انتشار
- `full`: stable به‌علاوه پوشش گسترده provider/media مشورتی

`OpenClaw Release Checks` از ref گردش کار مورداعتماد برای resolve کردن ref هدف
یک‌بار به‌صورت `release-package-under-test` استفاده می‌کند و همان artifact را هم در
بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره استفاده می‌کند. این کار همه
boxهای مواجه با بسته را روی همان bytes نگه می‌دارد و از ساخت‌های تکراری بسته جلوگیری می‌کند.
install smoke مربوط به cross-OS OpenAI از `OPENCLAW_CROSS_OS_OPENAI_MODEL` زمانی استفاده می‌کند که
متغیر repo/org تنظیم شده باشد، وگرنه از `openai/gpt-5.4`، چون این lane در حال
اثبات نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر live provider همچنان
جای پوشش اختصاصی مدل است.

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

از چتر full به‌عنوان اولین rerun پس از یک fix متمرکز استفاده نکنید. اگر یک box
fail شد، برای اثبات بعدی از گردش کار فرزند، job، lane مربوط به Docker، پروفایل بسته، provider
مدل، یا lane مربوط به QA که fail شده است استفاده کنید. چتر full را فقط زمانی دوباره اجرا کنید که
fix، orchestration مشترک انتشار را تغییر داده یا شواهد قبلی همه boxها را
stale کرده باشد. verifier نهایی چتر، idهای ثبت‌شده اجرای گردش‌کارهای فرزند را دوباره بررسی می‌کند؛
بنابراین پس از اینکه یک گردش کار فرزند با موفقیت rerun شد، فقط job والد failشده
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به چتر پاس دهید. `all` اجرای واقعی
release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار
را اجرا می‌کند، و گروه‌های محدودتر انتشار `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram` هستند.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بسته release-checks استفاده می‌کنند.

### Vitest

box مربوط به Vitest همان گردش کار فرزند `CI` دستی است. CI دستی عمداً
scoping تغییرات را دور می‌زند و گراف تست عادی را برای release candidate اجباری می‌کند:
شاردهای Linux Node، شاردهای bundled-plugin، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Python
skills، Windows، macOS، Android، و Control UI i18n.

از این box برای پاسخ به این سؤال استفاده کنید: «آیا درخت source از کل مجموعه تست عادی عبور کرد؟»
این با اعتبارسنجی product مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatchشده را نشان می‌دهد
- اجرای `CI` روی SHA دقیق هدف green باشد
- نام شاردهای failشده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط زمانی مستقیماً اجرا کنید که انتشار به CI عادی deterministic نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه گردش کار release-mode
`install-smoke` قرار دارد. این box، release candidate را از طریق محیط‌های Docker بسته‌بندی‌شده
اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- install smoke کامل با فعال بودن slow Bun global install smoke
- آماده‌سازی/استفاده مجدد از تصویر smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌صورت شاردهای install-smoke جداگانه اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk مربوط به `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای جداشده install/uninstall برای bundled plugin
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- مجموعه‌های live/E2E provider و پوشش مدل live در Docker وقتی release checks
  شامل مجموعه‌های live باشد

قبل از rerun کردن از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler، و فرمان‌های rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی گردش کار reusable live/E2E استفاده کنید.
فرمان‌های rerun تولیدشده در صورت موجود بودن شامل `package_artifact_run_id` قبلی
و ورودی‌های تصویر Docker آماده‌شده هستند، بنابراین یک lane failشده می‌تواند همان tarball و
تصویرهای GHCR را دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار
برای رفتار agentic و سطح channel است و از Vitest و مکانیک بسته Docker جداست.

پوشش QA Lab انتشار شامل این موارد است:

- lane هم‌ارزی mock که lane کاندید OpenAI را با baseline مربوط به Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل fast live Matrix QA با استفاده از محیط `qa-live-shared`
- lane live Telegram QA با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به این سؤال استفاده کنید: «آیا انتشار در سناریوهای QA و
جریان‌های channel زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URLهای artifact مربوط به laneهای parity، Matrix، و Telegram
را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی sharded QA-Lab در دسترس است،
نه lane پیش‌فرض release-critical.

### Package

box مربوط به Package، gate محصول قابل نصب است. این box توسط
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball مربوط به `package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند،
inventory بسته را اعتبارسنجی می‌کند، version بسته و SHA-256 را ثبت می‌کند، و ref
harness گردش کار را جدا از ref source بسته نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک version دقیق انتشار OpenClaw
- `source=ref`: pack کردن شاخه، tag، یا SHA کامل commit مربوط به `package_ref` مورداعتماد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده مجدد از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact
بسته انتشار آماده‌شده، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
`published_upgrade_survivor_baselines=all-since-2026.4.23`،
`published_upgrade_survivor_scenarios=reported-issues`، و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update، پاکسازی dependency مربوط به stale
plugin، fixtureهای offline plugin، update مربوط به Plugin، و QA بسته Telegram
را در برابر همان tarball resolveشده نگه می‌دارد. ماتریس upgrade، هر baseline پایدار منتشرشده در npm از `2026.4.23` تا `latest` را پوشش می‌دهد؛ برای candidate‌ای که قبلاً shipped شده است از
Package Acceptance با `source=npm` استفاده کنید، یا برای یک tarball محلی npm با پشتوانه SHA قبل از
publish از `source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native
برای بیشتر پوشش package/update است که قبلاً به Parallels نیاز داشت.
بررسی‌های انتشار cross-OS همچنان برای onboarding، installer، و رفتار platform مختص OS مهم‌اند،
اما اعتبارسنجی product مربوط به package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin،
[تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام
lane محلی، Docker، Package Acceptance، یا release-check یک تغییر در install/update مربوط به Plugin،
پاکسازی doctor، یا migration بسته منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration کامل update منتشرشده از هر بسته پایدار `2026.4.23+` یک گردش کار دستی
`Update Migration` جداگانه است، نه بخشی از Full Release CI.

نرم‌گیری legacy package-acceptance عمداً بازه زمانی محدود دارد. بسته‌ها تا
`2026.4.25` ممکن است برای gapهای metadata که قبلاً به npm منتشر شده‌اند از مسیر compatibility استفاده کنند:
ورودی‌های private QA inventory که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball،
نبود `update.channel` persisted، مکان‌های legacy install-record مربوط به Plugin،
نبود پایداری install-record مربوط به marketplace، و migration metadata config
هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp مربوط به local build metadata
که قبلاً shipped شده‌اند warn بدهد. بسته‌های بعدی
باید قراردادهای modern package را رعایت کنند؛ همان gapها باعث fail شدن validation انتشار می‌شوند.

وقتی سؤال انتشار درباره یک بسته واقعاً قابل نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: laneهای سریع install/channel/agent بسته، شبکه Gateway، و reload کردن config
- `package`: قراردادهای install/update/plugin package بدون live ClawHub؛ این پیش‌فرض release-check
  است
- `product`: `package` به‌علاوه channelهای MCP، پاکسازی cron/subagent، جست‌وجوی وب OpenAI،
  و OpenWebUI
- `full`: chunkهای Docker مسیر انتشار همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای rerunهای متمرکز

برای اثبات Telegram کاندیدای بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. گردش‌کار،
tarball حل‌شده‌ی `package-under-test` را به مسیر Telegram می‌فرستد؛ گردش‌کار
مستقل Telegram همچنان یک مشخصات npm منتشرشده را برای بررسی‌های پس از انتشار می‌پذیرد.

## خودکارسازی انتشار Release

`OpenClaw Release Publish` نقطه‌ی ورود معمول انتشار تغییردهنده است. این مورد
گردش‌کارهای trusted-publisher را به ترتیبی که release نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout کنید و SHA کامیت آن را حل کنید.
2. بررسی کنید tag از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با tag انتشار، dist-tag مربوط به npm، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

نمونه‌ی انتشار Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

انتشار stable به dist-tag پیش‌فرض beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ارتقای stable مستقیم به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کارهای repair یا انتشار مجدد متمرکز استفاده کنید. برای repair یک plugin
انتخاب‌شده، `plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته‌ی OpenClaw نباید منتشر شود،
گردش‌کار فرزند را مستقیم dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط
  اعتبارسنجی می‌تواند SHA کامل ۴۰ کاراکتری کامیت شاخه‌ی گردش‌کار فعلی نیز باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/build/package، مقدار `false` برای
  مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار tarball آماده‌شده
  از اجرای preflight موفق را دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه‌ی اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: tag هدف npm برای بسته‌ی OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار repair
  متمرکز از `selected` استفاده کنید
- `plugins`: نام‌های بسته‌ی `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی از گردش‌کار به‌عنوان
  هماهنگ‌کننده‌ی repair فقط مخصوص plugin استفاده می‌کنید، آن را `false` بگذارید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه‌ی OpenClaw یا tag انتشار قابل دسترسی باشد.

قواعد:

- tagهای stable و correction می‌توانند روی `beta` یا `latest` منتشر شوند
- tagهای prerelease مربوط به Beta فقط می‌توانند روی `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛
  گردش‌کار پیش از ادامه‌ی انتشار، آن metadata را بررسی می‌کند

## توالی انتشار stable در npm

هنگام بریدن یک انتشار stable در npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل کامیت شاخه‌ی گردش‌کار فعلی برای یک
     dry run فقط اعتبارسنجی از گردش‌کار preflight استفاده کنید
2. برای جریان معمول beta-first، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمدا انتشار stable مستقیم می‌خواهید، `latest` را انتخاب کنید
3. وقتی می‌خواهید CI معمول به‌همراه پوشش live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را از یک گردش‌کار دستی داشته باشید، `Full Release Validation`
   را روی شاخه‌ی انتشار، tag انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمدا فقط به گراف تست معمول deterministic نیاز دارید، به‌جای آن گردش‌کار
   دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار پیش از ارتقای بسته‌ی npm
   مربوط به OpenClaw، pluginهای externalized را در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` نشست، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه‌ی stable از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیم روی `latest` منتشر شد و `beta` باید بلافاصله همان build
   stable را دنبال کند، از همان گردش‌کار خصوصی استفاده کنید تا هر دو dist-tag به نسخه‌ی
   stable اشاره کنند، یا اجازه دهید همگام‌سازی self-healing زمان‌بندی‌شده‌ی آن بعدا
   `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در repo خصوصی قرار دارد، چون هنوز به
`NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای beta-first را مستندسازی‌شده و
برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک maintainer مجبور شود به احراز هویت محلی npm fallback کند، هر دستور
1Password CLI (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را
مستقیما از پوسته‌ی اصلی agent فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود
promptها، alertها، و مدیریت OTP قابل مشاهده باشند و از alertهای تکراری میزبان جلوگیری می‌کند.

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

Maintainerها از docs خصوصی release در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
برای runbook واقعی استفاده می‌کنند.

## مرتبط

- [کانال‌های release](/fa/install/development-channels)
