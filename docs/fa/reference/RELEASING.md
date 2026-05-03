---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، باکس‌های اعتبارسنجی، نام‌گذاری نسخه‌ها، و چرخه انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-03T11:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: edfd7d6a17da68c76d7196856702c59d1e3c2749907f591fe18b4f9df2eb097d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای تگ‌شده‌ای که به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest` منتشر می‌شوند
- بتا: تگ‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- توسعه: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - تگ Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - تگ Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - تگ Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند؛ گردانندگان انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای انتشار پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` می‌برند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی انتشار و اصلاحات، توسعه
  جدید روی `main` را مسدود نکند
- اگر یک تگ بتا پوش یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی تگ بتای قدیمی، تگ بعدی `-beta.N` را می‌برند
- رویه تفصیلی انتشار، تأییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست گرداننده انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag و جزئیات بازگردانی اضطراری در
دفترچه اجرای انتشار مخصوص نگه‌دارندگان باقی می‌مانند.

1. از `main` فعلی شروع کنید: آخرین نسخه را pull کنید، تأیید کنید که کامیت هدف پوش شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه گرفت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی کامیت‌ها با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را کامیت و پوش کنید، و پیش از شاخه‌گیری
   یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمدا نگه داشته می‌شود.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای تگ مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار نسخه انتشار
   و فراداده سازگاری مشترک داشته باشند، سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check`، و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود تگ،
   یک SHA کامل ۴۰نویسه‌ای شاخه انتشار برای پیش‌پرواز فقط اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، تگ، یا SHA کامل کامیت آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، کار workflow، نمایه بسته، ارائه‌دهنده، یا فهرست مجاز مدل شکست‌خورده‌ای را دوباره اجرا کنید که
   اصلاح را اثبات می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را تگ کنید، سپس `OpenClaw Release Publish` را از
   شاخه منطبق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان
   مجموعه را در مرحله دوم به ClawHub منتشر می‌کند، و سپس مصنوع پیش‌پرواز npm آماده‌شده OpenClaw را با dist-tag منطبق
   ترویج می‌کند. پس از انتشار، پذیرش بسته پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار پوش‌شده یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار منطبق بعدی را ببرید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتا یا نامزد انتشار بررسی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد ادامه دهید. انتشار npm پایدار نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و مصنوع پیش‌پرواز موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار macOS پایدار همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدکننده پس از انتشار npm، E2E اختیاری Telegram مستقل
    npm منتشرشده وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و منطبق `CHANGELOG.md`، و گام‌های اعلام انتشار
    را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها خارج از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری خارج از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از tag کردن، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری OpenClaw peer/API، فراداده build و stubهای changelog مربوط به Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار هسته همخوان شوند. `pnpm plugins:sync:check` گارد انتشار غیرتغییردهنده است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک نقطه ورود شروع شوند. این workflow یک branch، tag یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، همترازی QA Lab، Matrix و laneهای Telegram dispatch می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، زمانی `npm_telegram_package_spec` را ارائه کنید که همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند. پس از انتشار، زمانی `package_acceptance_package_spec` را ارائه کنید که Package Acceptance باید ماتریس package/update خود را در برابر بسته npm ارسال‌شده اجرا کند، نه آرتیفکت ساخته‌شده از SHA. زمانی `evidence_package_spec` را ارائه کنید که گزارش private evidence باید ثابت کند اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه Telegram E2E اجباری شود. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- زمانی workflow دستی `Package Acceptance` را اجرا کنید که برای یک نامزد بسته، هم‌زمان با ادامه کار انتشار، proof کانال جانبی می‌خواهید. برای `openclaw@beta`، `openclaw@latest` یا یک نسخه دقیق انتشار از `source=npm` استفاده کنید؛ برای pack کردن یک branch/tag/SHA مطمئن `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball آپلودشده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، scheduler انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier`، Telegram QA را در برابر همان tarball اجرا کند. وقتی laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway و بارگذاری دوباره config
  - `package`: laneهای package/update/plugin بومی آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای یک rerun متمرکز
- زمانی workflow دستی `CI` را مستقیم اجرا کنید که فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید. Dispatchهای دستی CI از scoping مبتنی بر تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، Android و laneهای i18n مربوط به Control UI را اجبار می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک receiver محلی OTLP/HTTP تمرین می‌دهد و نام spanهای trace صادرشده، attributeهای محدودشده و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار tag‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، برای توالی انتشار تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا وقتی tag قابل دسترسی از main را منتشر می‌کنید از `main`)، tag انتشار و `preflight_run_id` موفق OpenClaw npm را پاس دهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک تعمیر متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin و انتشار npm مربوط به OpenClaw را serialize می‌کند تا بسته هسته پیش از Pluginهای externalized آن منتشر نشود.
- Release checks اکنون در یک workflow دستی جدا اجرا می‌شود:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane همترازی mock مربوط به QA Lab به‌همراه پروفایل زنده سریع Matrix و lane Telegram QA را اجرا می‌کند. laneهای زنده از environment `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی موجودی کامل transport، media و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای Cross-OS بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm را کوتاه، deterministic و متمرکز بر آرتیفکت نگه می‌دارد، در حالی که بررسی‌های زنده کندتر در lane خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- release checkهای دارای secret باید از طریق `Full Release Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolve‌شده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` نیز SHA کامل ۴۰ کاراکتری commit شاخه workflow فعلی را بدون نیاز به tag push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی promoted شود
- در حالت SHA، workflow فقط برای بررسی فراداده بسته `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` را اجرا کنید (یا tag متناظر beta/correction را)
- پس از انتشار npm، `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` را اجرا کنید (یا نسخه متناظر beta/correction را) تا مسیر نصب registry منتشرشده در یک prefix موقت تازه بررسی شود
- پس از انتشار beta، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید تا onboarding بسته نصب‌شده، setup مربوط به Telegram و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از pool مشترک credential اجاره‌ای Telegram بررسی شود. اجراهای موردی محلی maintainerها می‌توانند varهای Convex را حذف کنند و سه credential env مربوط به `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس دهند.
- Maintainerها می‌توانند همین بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - انتشار واقعی npm باید از همان branch یعنی `main` یا `release/YYYY.M.D` که اجرای پیش‌پرواز موفق از آن بوده dispatch شود
  - انتشارهای stable npm به‌صورت پیش‌فرض `beta` هستند
  - انتشار stable npm می‌تواند از طریق ورودی workflow صراحتاً `latest` را هدف بگیرد
  - تغییر npm dist-tag مبتنی بر token اکنون برای امنیت در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا `npm dist-tag add` هنوز به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار OIDC-only را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی tag فقط روی یک branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac را گذرانده باشد
  - مسیرهای انتشار واقعی به‌جای build دوباره، آرتیفکت‌های آماده‌شده را promote می‌کنند
- برای انتشارهای اصلاحی stable مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا اصلاحات انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایه stable رها کنند
- پیش‌پرواز انتشار npm به‌صورت fail closed عمل می‌کند مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود، تا دوباره داشبورد مرورگر خالی ship نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده بسته در layout نصب‌شده registry حاضر باشند. انتشاری که payloadهای runtime مربوط به Plugin را کم داشته باشد، verifier پس از انتشار را شکست می‌دهد و نمی‌تواند به `latest` promoted شود.
- `pnpm test:install:smoke` همچنین بودجه npm pack `unpackedSize` را روی tarball update نامزد enforce می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، bloat تصادفی pack را می‌گیرد
- اگر کار انتشار به planning مربوط به CI، manifestهای timing مربوط به extension یا ماتریس‌های تست extension دست زده است، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و review کنید تا release notes یک layout قدیمی CI را توصیف نکند
- آمادگی انتشار stable macOS همچنین شامل سطوح updater است:
  - GitHub release باید در نهایت `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip جدید stable اشاره کند
  - اپ بسته‌بندی‌شده باید bundle id غیر-debug، URL غیرخالی Sparkle feed، و `CFBundleVersion` در حد یا بالاتر از کف build canonical Sparkle برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از یک نقطه ورود شروع می‌کنند. برای proof یک commit pinned روی branchی که سریع حرکت می‌کند، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند با هدف مطابقت داشته باشد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند مربوط به `main` جدیدتر جلوگیری می‌کند.

برای اعتبارسنجی branch یا tag انتشار، آن را از workflow ref مطمئن `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش‌کار، `ref` هدف را حل می‌کند، `CI` دستی را با
`target_ref=<release-ref>` اجرا می‌کند، `OpenClaw Release Checks` را اجرا می‌کند، یک
artifact والد `release-package-under-test` را برای بررسی‌های مربوط به بسته آماده می‌کند، و
زمانی که `release_profile=full` با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را اجرا می‌کند. سپس `OpenClaw Release
Checks` به install smoke، بررسی‌های انتشار میان‌سیستم‌عاملی، پوشش مسیر انتشار Docker
زنده/E2E، Package Acceptance با QA بسته Telegram، همتایی QA Lab،
Matrix زنده و Telegram زنده منشعب می‌شود. اجرای کامل فقط وقتی قابل قبول است که
خلاصه `Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all رد می‌شود
مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه نهایی
اعتبارسنج، جدول‌های کندترین کار را برای هر اجرای فرزند شامل می‌شود، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود کردن لاگ‌ها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل stable و full،
artifactها و دسته‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref معتمدی اجرا می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به یک
شاخه یا تگ انتشار قدیمی‌تر اشاره می‌کند. ورودی جداگانه‌ای برای ref گردش‌کار Full Release Validation
وجود ندارد؛ harness معتمد را با انتخاب ref اجرای گردش‌کار انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ایجاد شاخه موقت پین‌شده استفاده کنید.

از `release_profile` برای انتخاب گستره زنده/ارائه‌دهنده استفاده کنید:

- `minimum`: سریع‌ترین مسیر زنده و Docker حیاتی برای انتشار OpenAI/هسته
- `stable`: minimum به‌علاوه پوشش ارائه‌دهنده/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده ارائه‌دهنده/رسانه مشورتی

`OpenClaw Release Checks` از ref گردش‌کار معتمد استفاده می‌کند تا ref هدف را یک‌بار به‌عنوان
`release-package-under-test` حل کند و همان artifact را هم در بررسی‌های Docker مسیر انتشار
و هم در Package Acceptance دوباره استفاده می‌کند. این کار همه boxهای مربوط به بسته را
روی همان byteها نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
install smoke میان‌سیستم‌عاملی OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane
به‌جای benchmark کردن کندترین مدل پیش‌فرض، نصب بسته، onboarding، راه‌اندازی gateway و یک turn زنده agent را
اثبات می‌کند. ماتریس گسترده‌تر ارائه‌دهنده زنده همچنان محل پوشش مختص مدل است.

بسته به مرحله انتشار از این گونه‌ها استفاده کنید:

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

پس از یک اصلاح متمرکز، از umbrella کامل به‌عنوان نخستین اجرای دوباره استفاده نکنید. اگر یک box
شکست خورد، برای اثبات بعدی از گردش‌کار فرزند شکست‌خورده، job، lane Docker، پروفایل بسته،
ارائه‌دهنده مدل یا lane QA استفاده کنید. فقط وقتی fix ارکستراسیون مشترک انتشار را تغییر داده
یا شواهد قبلی همه boxها را کهنه کرده است، umbrella کامل را دوباره اجرا کنید. اعتبارسنج نهایی umbrella
شناسه‌های ثبت‌شده اجرای گردش‌کار فرزند را دوباره بررسی می‌کند، بنابراین پس از اینکه یک گردش‌کار فرزند
با موفقیت دوباره اجرا شد، فقط job والد شکست‌خورده `Verify full validation` را دوباره اجرا کنید.

برای بازیابی محدود، `rerun_group` را به umbrella پاس دهید. `all` اجرای واقعی
کاندید انتشار است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مختص انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند،
و گروه‌های محدودتر انتشار `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live` و `npm-telegram` هستند.
اجرای دوباره متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارد؛ اجراهای full/all
با `release_profile=full` از artifact بسته release-checks استفاده می‌کنند.

### Vitest

box مربوط به Vitest همان گردش‌کار فرزند `CI` دستی است. CI دستی عمدا
scoping مبتنی بر تغییرات را دور می‌زند و گراف تست عادی را برای کاندید انتشار اجباری می‌کند:
shardهای Linux Node، shardهای Pluginهای همراه، قراردادهای کانال، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows،
macOS، Android و i18n مربوط به Control UI.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا درخت source از مجموعه کامل تست عادی گذشت؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` اجراشده را نشان می‌دهد
- سبز بودن اجرای `CI` روی SHA دقیق هدف
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مثل `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیما اجرا کنید که انتشار به CI عادی قطعی نیاز دارد اما
نه به boxهای Docker، QA Lab، زنده، میان‌سیستم‌عاملی یا بسته:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه گردش‌کار
`install-smoke` در حالت انتشار قرار دارد. این box کاندید انتشار را از طریق محیط‌های Docker
بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- install smoke کامل با فعال بودن smoke نصب global کند Bun
- آماده‌سازی/استفاده دوباره از تصویر smoke مربوط به Dockerfile ریشه بر اساس SHA هدف، همراه با jobهای QR،
  root/gateway و smoke نصب‌کننده/Bun که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk مربوط به `plugins-runtime-services` وقتی درخواست شده باشد
- laneهای جداشده نصب/حذف Plugin همراه
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- مجموعه‌های ارائه‌دهنده زنده/E2E و پوشش مدل زنده Docker وقتی بررسی‌های انتشار
  شامل suiteهای زنده باشند

پیش از اجرای دوباره، از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را همراه با لاگ‌های lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON برنامه scheduler و دستورهای اجرای دوباره upload می‌کند. برای بازیابی متمرکز،
به‌جای اجرای دوباره همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی گردش‌کار reusable زنده/E2E استفاده کنید.
دستورهای اجرای دوباره تولیدشده، وقتی در دسترس باشند، `package_artifact_run_id` قبلی
و ورودی‌های تصویر Docker آماده‌شده را شامل می‌شوند، بنابراین یک lane شکست‌خورده می‌تواند از همان tarball و تصویرهای GHCR دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار رفتار agentic
و سطح کانال است، جدا از مکانیک‌های بسته Vitest و Docker.

پوشش QA Lab انتشار شامل این موارد است:

- lane همتایی mock که lane کاندید OpenAI را با baseline مربوط به Opus 4.6
  با استفاده از بسته همتایی agentic مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential مربوط به Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات local صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و جریان‌های کانال زنده
درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact را برای laneهای parity، Matrix و Telegram
نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی sharded در QA-Lab در دسترس است،
نه lane پیش‌فرض حیاتی برای انتشار.

### Package

box مربوط به Package همان gate محصول قابل نصب است. این box به
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` متکی است. resolver یک کاندید را به
tarball به‌صورت `package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند،
inventory بسته را اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند و ref harness گردش‌کار را
از ref source بسته جدا نگه می‌دارد.

sourceهای کاندید پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: بسته‌بندی یک شاخه، تگ یا SHA کامل commit مربوط به `package_ref` معتمد
  با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` با HTTPS و `package_sha256` الزامی
- `source=artifact`: استفاده دوباره از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته انتشار
آماده‌شده، `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` و
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update، پاک‌سازی وابستگی کهنه Plugin،
fixtureهای Plugin آفلاین، update Plugin و QA بسته Telegram را روی همان tarball حل‌شده نگه می‌دارد. ماتریس upgrade
هر baseline پایدار منتشرشده در npm از `2026.4.23` تا `latest` را پوشش می‌دهد؛ برای کاندیدی که قبلا shipped شده است از
Package Acceptance با `source=npm` استفاده کنید، یا برای tarball محلی npm با پشتوانه SHA پیش از
publish از `source=ref`/`source=artifact` استفاده کنید. این جایگزین بومی GitHub
برای بیشتر پوشش package/update است که قبلا به Parallels نیاز داشت.
بررسی‌های انتشار میان‌سیستم‌عاملی همچنان برای onboarding، نصب‌کننده و رفتار مختص پلتفرم مهم هستند،
اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin،
[تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه
کدام lane محلی، Docker، Package Acceptance یا release-check یک تغییر نصب/update Plugin،
پاک‌سازی doctor یا migration بسته منتشرشده را اثبات می‌کند، از آن استفاده کنید.
migration کامل update منتشرشده از هر بسته پایدار `2026.4.23+`
یک گردش‌کار دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

آسان‌گیری legacy در package-acceptance عمدا محدود به زمان است. بسته‌ها تا
`2026.4.25` می‌توانند از مسیر سازگاری برای شکاف‌های metadata که قبلا
در npm منتشر شده‌اند استفاده کنند: ورودی‌های private QA inventory که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، مکان‌های legacy مربوط به رکورد نصب Plugin،
نبود پایداری رکورد نصب marketplace، و migration مربوط به metadata config
هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای
فایل‌های stamp metadata build محلی که قبلا shipped شده‌اند هشدار بدهد. بسته‌های بعدی
باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها باعث شکست اعتبارسنجی انتشار می‌شوند.

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

- `smoke`: مسیرهای نصب سریع بسته/کانال/عامل، شبکه Gateway، و بارگذاری دوباره پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/بسته Plugin بدون ClawHub زنده؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/زیرعامل، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این workflow،
tarball حل‌شده `package-under-test` را به مسیر Telegram پاس می‌دهد؛ workflow
مستقل Telegram همچنان برای بررسی‌های پس از انتشار، یک مشخصه npm منتشرشده را می‌پذیرد.

## اتوماسیون انتشار نسخه

`OpenClaw Release Publish` نقطه ورود معمول انتشار جهش‌دهنده است. این مورد
workflowهای ناشر مورد اعتماد را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout کنید و commit SHA آن را حل کنید.
2. تأیید کنید که tag از `main` یا `release/*` قابل دسترسی است.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با tag انتشار، npm dist-tag، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

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
فقط برای تعمیر متمرکز یا انتشار دوباره استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` پاس دهید، یا وقتی بسته OpenClaw نباید منتشر شود،
workflow فرزند را مستقیماً dispatch کنید.

## ورودی‌های workflow NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط-اعتبارسنجی
  می‌تواند SHA کامل ۴۰ کاراکتری commit شاخه workflow فعلی نیز باشد
- `preflight_only`: `true` فقط برای اعتبارسنجی/ساخت/بسته، `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده
  از اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: tag هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ از `selected` فقط
  برای کار تعمیر متمرکز استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با ویرگول وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان
  هماهنگ‌کننده تعمیر فقط-Plugin استفاده می‌کنید روی `false` بگذارید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند commit حل‌شده از یک شاخه OpenClaw یا tag انتشار قابل دسترسی باشد.

قوانین:

- tagهای پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- tagهای پیش‌انتشار beta فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط-اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight استفاده شده است؛
  workflow پیش از ادامه انتشار، آن metadata را تأیید می‌کند

## توالی انتشار پایدار npm

هنگام ایجاد یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل commit شاخه workflow فعلی برای اجرای آزمایشی
     فقط-اعتبارسنجی workflow preflight استفاده کنید
2. برای جریان معمول ابتدا-beta، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمداً انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی پوشش CI معمول به‌علاوه prompt cache زنده، Docker، QA Lab،
   Matrix، و Telegram را از یک workflow دستی می‌خواهید، `Full Release Validation` را
   روی شاخه انتشار، tag انتشار، یا SHA کامل commit اجرا کنید
4. اگر عمداً فقط گراف آزمون معمول قطعی را نیاز دارید، به‌جای آن workflow دستی `CI`
   را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای خارجی‌شده را پیش از
   ارتقای بسته npm OpenClaw به npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` فرود آمد، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمداً مستقیم به `latest` منتشر شد و `beta` باید فوراً همان ساخت پایدار
   را دنبال کند، از همان workflow خصوصی برای اشاره هر دو dist-tag به نسخه پایدار استفاده کنید،
   یا بگذارید همگام‌سازی خودترمیمی زمان‌بندی‌شده آن بعداً `beta` را جابه‌جا کند

جهش dist-tag به‌دلیل امنیت در repo خصوصی قرار دارد، چون همچنان به `NPM_TOKEN`
نیاز دارد، در حالی که repo عمومی انتشار فقط-OIDC را نگه می‌دارد.

این کار مسیر انتشار مستقیم و مسیر ارتقای ابتدا-beta را هم مستند و هم برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده مجبور شود به احراز هویت محلی npm برگردد، هر دستور CLI مربوط به 1Password
(`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را مستقیماً از shell عامل اصلی
فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود promptها، هشدارها، و مدیریت OTP
قابل مشاهده باشد و از هشدارهای تکراری میزبان جلوگیری کند.

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

نگه‌دارندگان برای runbook واقعی از اسناد خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
