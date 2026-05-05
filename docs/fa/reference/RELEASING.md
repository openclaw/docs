---
read_when:
    - در حال جست‌وجوی تعاریف کانال‌های انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - به‌دنبال نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، باکس‌های اعتبارسنجی، نام‌گذاری نسخه‌ها، و ریتم انتشار
title: خط‌مشی انتشار
x-i18n:
    generated_at: "2026-05-05T01:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌گذاری‌شده‌ای که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest` منتشر می‌شوند
- beta: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار npm که اکنون ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` که از
  `main` فعلی ساخته شده است برش می‌دهند، تا اعتبارسنجی و اصلاحات انتشار مانع
  توسعه جدید روی `main` نشود
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا ساخت دوباره برچسب بتای قدیمی، برچسب بعدی `-beta.N` را برش می‌دهند
- روند انتشار تفصیلی، تأییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag و جزئیات بازگردانی اضطراری در
دفترچه اجرای انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین نسخه را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را با تاریخچه واقعی commit و با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   پیش از شاخه‌سازی یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری
   منقضی‌شده را فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا
   عمدا حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید
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
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، ارائه‌دهنده، یا allowlist مدل شکست‌خورده‌ای را
   دوباره اجرا کنید که اصلاح را اثبات می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه متناظر `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تأیید می‌کند،
   ابتدا همه بسته‌های Plugin قابل انتشار را در npm منتشر می‌کند، همان
   مجموعه را در مرحله دوم به‌عنوان tarballهای ClawPack npm-pack در ClawHub منتشر می‌کند، و سپس
   آرتیفکت پیش‌پرواز npm آماده‌شده OpenClaw را با dist-tag متناظر ترویج می‌کند. پس از
   انتشار، پذیرش بسته پس از انتشار را در برابر بسته منتشرشده
   `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار متناظر بعدی را برش دهید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتای بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm نیز از طریق
    `OpenClaw Release Publish` انجام می‌شود و با استفاده از
    `preflight_run_id` آرتیفکت پیش‌پرواز موفق را دوباره به کار می‌گیرد؛ آمادگی انتشار پایدار macOS نیز به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدکننده پس از انتشار npm، E2E اختیاری Telegram
    مستقل منتشرشده در npm را وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و متناظر `CHANGELOG.md`، و مراحل اعلام انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- `pnpm check:test-types` را پیش از پیش‌پرواز انتشار اجرا کنید تا TypeScript آزمون‌ها بیرون از دروازه سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- `pnpm check:architecture` را پیش از پیش‌پرواز انتشار اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از دروازه سریع‌تر محلی سبز باشند
- `pnpm build && pnpm ui:build` را پیش از `pnpm release:check` اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و بسته Control UI برای گام اعتبارسنجی pack وجود داشته باشند
- `pnpm plugins:sync` را پس از افزایش نسخه ریشه و پیش از tagگذاری اجرا کنید. این دستور نسخه‌های بسته‌های plugin قابل انتشار، فراداده سازگاری peer/API با OpenClaw، فراداده build و stubهای changelog مربوط به plugin را برای تطبیق با نسخه انتشار هسته به‌روزرسانی می‌کند. `pnpm plugins:sync:check` نگهبان انتشار بدون تغییر است؛ اگر این گام فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- workflow دستی `Full Release Validation` را پیش از تأیید انتشار اجرا کنید تا همه test boxهای پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch، tag یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های بسته میان‌سیستمی، برابری QA Lab، Matrix و مسیرهای Telegram dispatch می‌کند. اجراهای stable/default، soak کامل live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، E2E بسته Telegram را نیز در برابر آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، زمانی `npm_telegram_package_spec` را ارائه کنید که همان Telegram E2E باید بسته منتشرشده npm را هم اثبات کند. پس از انتشار، زمانی `package_acceptance_package_spec` را ارائه کنید که Package Acceptance باید ماتریس package/update خود را به‌جای آرتیفکت ساخته‌شده از SHA، در برابر بسته npm ارسال‌شده اجرا کند. زمانی `evidence_package_spec` را ارائه کنید که گزارش خصوصی evidence باید اثبات کند اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه Telegram E2E اجباری شود. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- workflow دستی `Package Acceptance` را زمانی اجرا کنید که می‌خواهید هم‌زمان با ادامه کار انتشار، اثبات side-channel برای یک نامزد بسته داشته باشید. از `source=npm` برای `openclaw@beta`، `openclaw@latest` یا یک نسخه انتشار دقیق استفاده کنید؛ از `source=ref` برای pack کردن یک branch/tag/SHA مطمئن `package_ref` با harness فعلی `workflow_ref`؛ از `source=url` برای یک tarball HTTPS با SHA-256 الزامی؛ یا از `source=artifact` برای tarball بارگذاری‌شده توسط اجرای دیگری از GitHub Actions. این workflow نامزد را به `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان tarball بازاستفاده می‌کند، و می‌تواند QA مربوط به Telegram را روی همان tarball با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` اجرا کند. وقتی laneهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای نصب/channel/agent، شبکه Gateway و بارگذاری دوباره config
  - `package`: laneهای package/update/plugin بومی آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌همراه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- workflow دستی `CI` را زمانی مستقیم اجرا کنید که فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید. dispatchهای دستی CI از scoping بر اساس تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، Android و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace خروجی، attributeهای bounded و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار tagگذاری‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، `OpenClaw Release Publish` را برای توالی انتشار تغییردهنده اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا وقتی tag قابل دسترسی از `main` را منتشر می‌کنید، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و scope پیش‌فرض انتشار plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً یک repair متمرکز اجرا می‌کنید. این workflow انتشار npm مربوط به plugin، انتشار ClawHub مربوط به plugin و انتشار npm مربوط به OpenClaw را سریالی می‌کند تا بسته هسته پیش از pluginهای بیرونی‌شده‌اش منتشر نشود.
- بررسی‌های انتشار اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane برابری mock مربوط به QA Lab به‌همراه پروفایل سریع live Matrix و lane QA مربوط به Telegram را اجرا می‌کند. laneهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره credentialهای Convex CI استفاده می‌کند. وقتی inventory کامل transport، media و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است، که workflow قابل بازاستفاده `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی و متمرکز بر آرتیفکت نگه دارید، در حالی که بررسی‌های live کندتر در lane خود می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از ref workflow مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag یا SHA کامل commit را می‌پذیرد، تا زمانی که commit resolveشده از یک branch یا tag انتشار OpenClaw قابل دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` نیز SHA کامل ۴۰کاراکتری commit مربوط به branch فعلی workflow را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی promoted شود
- در حالت SHA، workflow فقط برای بررسی فراداده بسته، `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به tag انتشار واقعی نیاز دارد
- هر دو workflow مسیر واقعی publish و promotion را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون تغییر می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow این دستور را اجرا می‌کند
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY`
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  را اجرا کنید (یا tag متناظر beta/correction)
- پس از انتشار npm، برای بررسی مسیر نصب registry منتشرشده در یک prefix موقت تازه، این دستور را اجرا کنید
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه متناظر beta/correction)
- پس از انتشار beta، برای بررسی onboarding بسته نصب‌شده، راه‌اندازی Telegram و E2E واقعی Telegram در برابر بسته npm منتشرشده با استفاده از pool مشترک credential اجاره‌ای Telegram، `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` را اجرا کنید. اجرای موردی محلی توسط maintainer می‌تواند متغیرهای Convex را حذف کند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم بدهد.
- برای اجرای smoke کامل beta پس از انتشار از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی npm update/fresh-target مربوط به Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، آرتیفکت را دانلود می‌کند و گزارش Telegram را چاپ می‌کند.
- maintainerها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از الگوی preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - انتشار واقعی npm باید از همان branch یعنی `main` یا `release/YYYY.M.D` dispatch شود که اجرای preflight موفق از آن بوده است
  - انتشارهای stable npm به‌صورت پیش‌فرض به `beta` می‌روند
  - انتشار stable npm می‌تواند به‌طور صریح از طریق ورودی workflow، `latest` را هدف بگیرد
  - تغییر token-based مربوط به npm dist-tag اکنون برای امنیت در `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار OIDC-only را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک tag فقط روی branch انتشار وجود دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac را گذرانده باشد
  - مسیرهای انتشار واقعی آرتیفکت‌های آماده‌شده را promote می‌کنند، به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای correction stable مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایه stable باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را داشته باشد، تا دوباره dashboard مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای plugin منتشرشده و فراداده package در چیدمان registry نصب‌شده وجود داشته باشند. انتشاری که payloadهای runtime مربوط به plugin را ناقص ارسال کند، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promoted شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball نامزد update enforce می‌کند، بنابراین installer e2e پیش از مسیر انتشار release، افزایش ناخواسته حجم pack را می‌گیرد
- اگر کار انتشار به planning مربوط به CI، manifestهای timing افزونه، یا ماتریس‌های آزمون افزونه دست زده باشد، پیش از تأیید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` متعلق به planner را از `.github/workflows/plugin-prerelease.yml` بازتولید و بازبینی کنید تا release notes چیدمان کهنه CI را توصیف نکنند
- آمادگی انتشار stable macOS همچنین شامل سطح‌های updater است:
  - GitHub release باید در پایان `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - `appcast.xml` روی `main` پس از انتشار باید به zip جدید stable اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL غیرخالی Sparkle feed، و `CFBundleVersion` برابر یا بالاتر از کف canonical Sparkle build برای آن نسخه انتشار را نگه دارد

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها با آن همه آزمون‌های پیش از انتشار را از یک نقطه ورود آغاز می‌کنند. برای اثبات commit پین‌شده روی branch پرتحرک، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند با هدف مطابقت داشته باشد، سپس branch موقت را حذف می‌کند. این کار جلوی اثبات تصادفی اجرای فرزند جدیدتر `main` را می‌گیرد.

برای اعتبارسنجی branch یا tag انتشار، آن را از ref workflow مطمئن `main` اجرا کنید و branch یا tag انتشار را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

گردش‌کار ارجاع هدف را حل می‌کند، `CI` دستی را با
`target_ref=<release-ref>` راه‌اندازی می‌کند، `OpenClaw Release Checks` را راه‌اندازی می‌کند، یک آرتیفکت والد `release-package-under-test` برای بررسی‌های مرتبط با بسته آماده می‌کند، و E2E مستقل Telegram برای بسته را وقتی `release_profile=full` همراه با
`rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد راه‌اندازی می‌کند. سپس `OpenClaw Release
Checks` تست اولیه نصب، بررسی‌های چندسیستم‌عاملی انتشار، پوشش Docker زنده/E2E در مسیر انتشار وقتی آزمون ماندگاری فعال باشد، پذیرش بسته با QA بسته Telegram، برابری QA Lab، Matrix زنده، و Telegram زنده را منشعب می‌کند. یک اجرای کامل فقط زمانی قابل‌قبول است که خلاصه‌ی
`Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، مگر اینکه `npm_telegram_package_spec` منتشرشده‌ای ارائه شده باشد، رد می‌شود. خلاصه راستی‌آزمای نهایی شامل جدول‌های کندترین کار برای هر اجرای فرزند است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را بدون دانلود لاگ‌ها ببیند.
برای ماتریس کامل مراحل، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل پایدار و کامل، آرتیفکت‌ها، و دستگیره‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ارجاع مورد اعتمادی راه‌اندازی می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولاً `--ref main`، حتی وقتی `ref` هدف به شاخه یا تگ انتشار قدیمی‌تری اشاره کند. هیچ ورودی جداگانه‌ای برای workflow-ref اعتبارسنجی کامل انتشار وجود ندارد؛ هارنس مورد اعتماد را با انتخاب ارجاع اجرای گردش‌کار انتخاب کنید.
برای اثبات کامیت دقیق روی `main` متحرک، از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام کامیت نمی‌توانند ارجاع dispatch گردش‌کار باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت پین‌شده استفاده کنید.

از `release_profile` برای انتخاب گستره زنده/ارائه‌دهنده استفاده کنید:

- `minimum`: سریع‌ترین مسیر زنده OpenAI/هسته و Docker که برای انتشار حیاتی است
- `stable`: حداقل به‌همراه پوشش پایدار ارائه‌دهنده/بک‌اند برای تأیید انتشار
- `full`: پایدار به‌همراه پوشش گسترده مشورتی ارائه‌دهنده/رسانه

از `run_release_soak=true` همراه با `stable` زمانی استفاده کنید که مسیرهای مسدودکننده انتشار
موفق‌اند و می‌خواهید پیش از ارتقا، جاروب کامل زنده/E2E، مسیر انتشار Docker، و بازماندن از ارتقا برای همه نسخه‌ها از 2026.4.23 به بعد اجرا شود. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ارجاع گردش‌کار مورد اعتماد استفاده می‌کند تا ارجاع هدف را یک بار به‌عنوان
`release-package-under-test` حل کند و وقتی آزمون ماندگاری اجرا می‌شود، همان آرتیفکت را در بررسی‌های چندسیستم‌عاملی، پذیرش بسته، و بررسی‌های Docker مسیر انتشار دوباره به‌کار می‌برد. این کار همه محیط‌های مرتبط با بسته را روی بایت‌های یکسان نگه می‌دارد و از ساخت‌های تکراری بسته جلوگیری می‌کند.
تست اولیه نصب OpenAI در چند سیستم‌عامل وقتی متغیر مخزن/سازمان تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این مسیر نصب بسته، آغازبه‌کار، راه‌اندازی Gateway، و یک نوبت زنده عامل را اثبات می‌کند، نه محک‌زدن کندترین مدل پیش‌فرض را. ماتریس گسترده‌تر ارائه‌دهنده زنده همچنان محل پوشش مختص مدل است.

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

از چتر کامل به‌عنوان نخستین اجرای دوباره پس از یک اصلاح متمرکز استفاده نکنید. اگر یک محیط
ناموفق شد، برای اثبات بعدی از گردش‌کار فرزند، کار، مسیر Docker، پروفایل بسته، ارائه‌دهنده مدل، یا مسیر QA ناموفق استفاده کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که
اصلاح، هماهنگ‌سازی مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه محیط‌ها را کهنه کرده باشد. راستی‌آزمای نهایی چتر، شناسه‌های ثبت‌شده اجرای گردش‌کارهای فرزند را دوباره بررسی می‌کند، بنابراین پس از اینکه یک گردش‌کار فرزند با موفقیت دوباره اجرا شد، فقط کار والد ناموفق
`Verify full validation` را دوباره اجرا کنید.

برای بازیابی محدود، `rerun_group` را به چتر بدهید. `all` اجرای واقعی
نامزد انتشار است، `ci` فقط فرزند CI معمول را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` همه محیط‌های انتشار را اجرا می‌کند، و گروه‌های انتشار باریک‌تر عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
اجرای دوباره متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارد؛ اجراهای full/all
با `release_profile=full` از آرتیفکت بسته بررسی‌های انتشار استفاده می‌کنند. اجرای دوباره متمرکز چندسیستم‌عاملی می‌تواند `cross_os_suite_filter=windows/packaged-upgrade` یا
فیلتر OS/مجموعه دیگری اضافه کند. خرابی‌های QA در بررسی‌های انتشار مشورتی هستند؛ خرابی فقط QA
اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

محیط Vitest همان گردش‌کار فرزند `CI` دستی است. CI دستی عمداً
دامنه‌بندی تغییرات را دور می‌زند و گراف تست معمول را برای نامزد انتشار اجباری می‌کند:
شاردهای Linux Node، شاردهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22،
`check`، `check-additional`، تست اولیه ساخت، بررسی‌های مستندات، Skills پایتون، Windows، macOS، Android، و Control UI i18n.

از این محیط برای پاسخ به «آیا درخت منبع کل مجموعه تست معمول را با موفقیت گذراند؟» استفاده کنید.
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه‌ی `Full Release Validation` که URL اجرای `CI` راه‌اندازی‌شده را نشان می‌دهد
- موفق بودن اجرای `CI` روی SHA هدف دقیق
- نام شاردهای ناموفق یا کند از jobهای CI هنگام بررسی رگرسیون‌ها
- آرتیفکت‌های زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل کارایی نیاز دارد

CI دستی را فقط زمانی مستقیم اجرا کنید که انتشار به CI معمول قطعی نیاز دارد اما
به محیط‌های Docker، QA Lab، زنده، چندسیستم‌عاملی، یا بسته نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

محیط Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌همراه گردش‌کار حالت انتشار
`install-smoke` قرار دارد. این محیط نامزد انتشار را از طریق محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط با تست‌های سطح منبع.

پوشش Docker انتشار شامل این موارد است:

- تست اولیه کامل نصب با تست اولیه کند نصب سراسری Bun فعال
- آماده‌سازی/استفاده‌مجدد تصویر تست اولیه Dockerfile ریشه بر اساس SHA هدف، با کارهای تست اولیه QR،
  root/gateway، و installer/Bun که به‌عنوان شاردهای جداگانه install-smoke اجرا می‌شوند
- مسیرهای E2E مخزن
- قطعه‌های Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI درون قطعه‌ی `plugins-runtime-services` هنگام درخواست
- مسیرهای جداشده نصب/حذف Plugin بسته‌بندی‌شده
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- مجموعه‌های زنده/E2E ارائه‌دهنده و پوشش مدل زنده Docker وقتی بررسی‌های انتشار
  مجموعه‌های زنده را شامل شوند

پیش از اجرای دوباره، از آرتیفکت‌های Docker استفاده کنید. زمان‌بند مسیر انتشار
`.artifacts/docker-tests/` را با لاگ‌های مسیر، `summary.json`، `failures.json`،
زمان‌بندی فازها، JSON طرح زمان‌بند، و فرمان‌های اجرای دوباره بارگذاری می‌کند. برای بازیابی متمرکز،
به‌جای اجرای دوباره همه قطعه‌های انتشار، از `docker_lanes=<lane[,lane]>` روی گردش‌کار زنده/E2E قابل‌استفاده‌مجدد استفاده کنید. فرمان‌های تولیدشده اجرای دوباره، `package_artifact_run_id` قبلی و ورودی‌های تصویر Docker آماده‌شده را، در صورت وجود، شامل می‌شوند؛ بنابراین یک
مسیر ناموفق می‌تواند از همان آرشیو tar و تصاویر GHCR استفاده مجدد کند.

### QA Lab

محیط QA Lab نیز بخشی از `OpenClaw Release Checks` است. این دروازه انتشار برای
رفتار عامل‌محور و سطح کانال است و از Vitest و سازوکارهای بسته Docker جداست.

پوشش QA Lab انتشار شامل این موارد است:

- مسیر برابری شبیه‌سازی‌شده که مسیر نامزد OpenAI را با خط مبنای Opus 4.6
  با استفاده از بسته برابری عامل‌محور مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- مسیر QA زنده Telegram با استفاده از اجاره‌های اعتبارنامه Convex CI
- `pnpm qa:otel:smoke` وقتی تله‌متری انتشار به اثبات محلی صریح نیاز دارد

از این محیط برای پاسخ به «آیا انتشار در سناریوهای QA و جریان‌های زنده کانال درست رفتار می‌کند؟» استفاده کنید. هنگام تأیید انتشار، URLهای آرتیفکت را برای مسیرهای برابری، Matrix، و Telegram نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی شاردشده QA-Lab در دسترس است، نه مسیر پیش‌فرض حیاتی برای انتشار.

### بسته

محیط بسته دروازه محصول قابل نصب است. پشتوانه آن
`Package Acceptance` و حل‌کننده
`scripts/resolve-openclaw-package-candidate.mjs` است. حل‌کننده یک نامزد را به آرشیو tar `package-under-test` مصرف‌شده توسط Docker E2E نرمال می‌کند، موجودی بسته را اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند، و ارجاع هارنس گردش‌کار را از ارجاع منبع بسته جدا نگه می‌دارد.

منابع نامزد پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: یک شاخه، تگ، یا SHA کامل کامیتِ مورد اعتماد `package_ref` را
  با هارنس منتخب `workflow_ref` بسته‌بندی کنید
- `source=url`: یک `.tgz` از HTTPS با `package_sha256` الزامی دانلود کنید
- `source=artifact`: از یک `.tgz` بارگذاری‌شده توسط اجرای دیگری از GitHub Actions دوباره استفاده کنید

`OpenClaw Release Checks` پذیرش بسته را با `source=artifact`، آرتیفکت آماده بسته انتشار،
`suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`،
`telegram_mode=mock-openai` اجرا می‌کند. پذیرش بسته، مهاجرت، به‌روزرسانی، پاک‌سازی وابستگی‌های کهنه Plugin، فیکسچرهای آفلاین Plugin، به‌روزرسانی Plugin، و QA بسته Telegram را روی همان آرشیو tar حل‌شده نگه می‌دارد. بررسی‌های مسدودکننده انتشار از خط مبنای پیش‌فرضِ آخرین بسته منتشرشده استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` این را به هر خط مبنای پایدار منتشرشده در npm از
`2026.4.23` تا `latest` به‌همراه فیکسچرهای issueهای گزارش‌شده گسترش می‌دهد. برای نامزدی که قبلاً منتشر شده است از پذیرش بسته با `source=npm` استفاده کنید، یا
پیش از انتشار، برای آرشیو tar محلی npm با پشتوانه SHA از `source=ref`/`source=artifact` استفاده کنید. این، جایگزین بومی GitHub برای بیشتر پوشش بسته/به‌روزرسانی است که پیش‌تر به
Parallels نیاز داشت. بررسی‌های چندسیستم‌عاملی انتشار همچنان برای آغازبه‌کار، نصب‌کننده، و رفتار پلتفرمی مختص OS مهم‌اند، اما اعتبارسنجی محصول بسته/به‌روزرسانی باید پذیرش بسته را ترجیح دهد.

چک‌لیست مرجع برای اعتبارسنجی به‌روزرسانی و Plugin،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) است. از آن هنگام
تصمیم‌گیری درباره اینکه کدام مسیر محلی، Docker، پذیرش بسته، یا بررسی انتشار، تغییر نصب/به‌روزرسانی Plugin، پاک‌سازی doctor، یا مهاجرت بسته منتشرشده را اثبات می‌کند، استفاده کنید.
مهاجرت کامل به‌روزرسانی منتشرشده از هر بسته پایدار `2026.4.23+`
یک گردش‌کار دستی جداگانه `Update Migration` است، نه بخشی از CI کامل انتشار.

سهل‌گیری قدیمی پذیرش بسته عمداً محدود به بازه زمانی است. بسته‌ها تا
`2026.4.25` ممکن است از مسیر سازگاری برای شکاف‌های فراداده‌ای که قبلاً
در npm منتشر شده‌اند استفاده کنند: مدخل‌های خصوصی موجودی QA که در آرشیو tar نیستند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture git مشتق‌شده از آرشیو tar، مکان‌های قدیمی رکورد نصب Plugin، نبود ماندگاری رکورد نصب بازارچه، و مهاجرت فراداده پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های مهر فراداده ساخت محلی که قبلاً منتشر شده بودند هشدار دهد. بسته‌های بعدی
باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها اعتبارسنجی انتشار را ناموفق می‌کنند.

وقتی پرسش انتشار درباره یک بسته قابل نصب واقعی است، از پروفایل‌های گسترده‌تر پذیرش بسته استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/عامل، شبکه Gateway، و بارگذاری مجدد
  پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/بسته Plugin بدون ClawHub زنده؛ این پیش‌فرض
  بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی Cron/زیرعامل، جست‌وجوی وب
  OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. گردش‌کار،
tarball حل‌شده `package-under-test` را به مسیر Telegram پاس می‌دهد؛ گردش‌کار مستقل
Telegram همچنان یک مشخصه npm منتشرشده را برای بررسی‌های پس از انتشار می‌پذیرد.

## خودکارسازی انتشار

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

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای تعمیر متمرکز یا انتشار دوباره استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
گردش‌کار فرزند را مستقیم dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، می‌تواند SHA کامل
  ۴۰ نویسه‌ای کامیت شاخه گردش‌کار فعلی برای preflight فقط اعتبارسنجی نیز باشد
- `preflight_only`: مقدار `true` برای فقط اعتبارسنجی/ساخت/بسته، و `false` برای
  مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار از tarball
  آماده‌شده در اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ مقدار پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: تگ انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر
  متمرکز از `selected` استفاده کنید
- `plugins`: نام بسته‌های `@openclaw/*` که با کاما جدا شده‌اند، وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی گردش‌کار را به‌عنوان
  هماهنگ‌کننده تعمیر فقط Plugin استفاده می‌کنید، آن را روی `false` بگذارید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد.
- `run_release_soak`: در بررسی‌های انتشار پایدار/پیش‌فرض، soak کامل زنده/E2E،
  مسیر انتشار Docker، و upgrade-survivor همه نسخه‌ها را فعال می‌کند. با
  `release_profile=full` اجباری فعال می‌شود.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- تگ‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight
  استفاده شده است؛ گردش‌کار پیش از ادامه انتشار، آن فراداده را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام ساخت یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل کامیت شاخه گردش‌کار فعلی برای یک
     اجرای آزمایشی فقط اعتبارسنجی از گردش‌کار preflight استفاده کنید
2. برای جریان عادی ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمدا انتشار پایدار مستقیم می‌خواهید، `latest` را انتخاب کنید
3. وقتی CI عادی به‌علاوه پوشش کش prompt زنده، Docker، QA Lab، Matrix، و Telegram
   را از یک گردش‌کار دستی می‌خواهید، `Full Release Validation` را روی شاخه انتشار،
   تگ انتشار، یا SHA کامل کامیت اجرا کنید
4. اگر عمدا فقط به گراف تست عادی قطعی نیاز دارید، به‌جای آن گردش‌کار دستی `CI`
   را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`، و
   `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای externalized را
   پیش از ارتقای بسته npm OpenClaw به npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیم به `latest` منتشر شد و `beta` باید بلافاصله همان ساخت
   پایدار را دنبال کند، از همان گردش‌کار خصوصی استفاده کنید تا هر دو dist-tag
   به نسخه پایدار اشاره کنند، یا بگذارید همگام‌سازی self-healing زمان‌بندی‌شده
   آن بعدا `beta` را جابه‌جا کند

تغییر dist-tag به دلایل امنیتی در مخزن خصوصی قرار دارد، چون هنوز به
`NPM_TOKEN` نیاز دارد، در حالی که مخزن عمومی انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار مسیر انتشار مستقیم و مسیر ارتقای ابتدا-بتا را هر دو مستند و برای اپراتور
قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm fallback کند، هر دستور CLI
مربوط به 1Password (`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را
مستقیم از shell عامل اصلی فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود
promptها، هشدارها، و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان
جلوگیری می‌کند.

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

نگه‌دارنده‌ها برای runbook واقعی از اسناد انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
