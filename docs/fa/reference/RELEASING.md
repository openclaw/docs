---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جستجوی نام‌گذاری نسخه‌ها و ریتم انتشار
    - برنامه‌ریزی شاخه‌های انتشار پشتیبانی ماهانه یا LTS
summary: مسیرهای انتشار، فهرست بررسی اپراتور، باکس‌های اعتبارسنجی، نام‌گذاری نسخه، خطوط پشتیبانی ماهانه برنامه‌ریزی‌شده، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-07T01:55:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای برچسب‌خورده که به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest` منتشر می‌شوند
- بتا: برچسب‌های پیش‌انتشار که در npm با `beta` منتشر می‌شوند
- توسعه: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار قدیمی: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر پیشوند نکنید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی قدیمی به‌صورت پیش‌فرض در npm با `beta` منتشر می‌شوند؛ گردانندگان انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

### نسخه‌گذاری پشتیبانی ماهانه برنامه‌ریزی‌شده

OpenClaw هنوز کانال LTS یا پشتیبانی ماهانه ندارد. نگه‌دارندگان در حال
حرکت به‌سوی خطوط پشتیبانی ماهانه سازگار با SemVer هستند، اما کانال‌های
به‌روزرسانی عرضه‌شده امروز همچنان `stable`، `beta` و `dev` هستند.

شکل نسخه برنامه‌ریزی‌شده `YYYY.M.PATCH` است:

- `YYYY` سال است.
- `M` خط انتشار ماهانه است، بدون صفر آغازین.
- `PATCH` در همان خط ماهانه افزایش می‌یابد و می‌تواند تا هر مقدار لازم رشد کند.

برای مثال، `2026.6.0`، `2026.6.1` و `2026.6.2` همگی روی خط ژوئن
۲۰۲۶ خواهند بود. یک dist-tag پشتیبانی ماهانه آینده مانند `stable-2026-6` یا
`lts-2026-6` ممکن است به آن خط اشاره کند، در حالی که `latest` همچنان سریع حرکت می‌کند.

این مدل آینده نیاز به انتشارهای اصلاحی جدید `YYYY.M.D-N` را جایگزین می‌کند.
نسخه‌های اصلاحی قدیمی موجود همچنان شناخته می‌شوند تا بسته‌های قدیمی‌تر و
مسیرهای ارتقا به کار خود ادامه دهند.

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` که
  از `main` فعلی ساخته شده است انجام می‌دهند، تا اعتبارسنجی انتشار و اصلاحات
  توسعه جدید روی `main` را مسدود نکند
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی برچسب بتای قدیمی، برچسب `-beta.N` بعدی را ایجاد می‌کنند
- رویه دقیق انتشار، تاییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست گرداننده انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag و جزئیات بازگردانی اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌مانند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` به‌اندازه کافی برای ساخت شاخه از آن سبز است.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و پیش از ساخت شاخه
   یک بار دیگر rebase/pull کنید.
3. سوابق سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` مرور کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر ارتقا همچنان پوشش داده می‌شود، یا ثبت کنید چرا عمدا نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب مورد نظر افزایش دهید، `pnpm plugins:sync` را اجرا کنید تا بسته‌های Plugin قابل انتشار
   نسخه انتشار و فراداده سازگاری مشترک داشته باشند، سپس preflight قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، `pnpm plugins:sync:check` و
   `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   SHA کامل ۴۰ کاراکتری شاخه انتشار برای preflight فقط-اعتبارسنجی مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش‌انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، provider یا allowlist مدل شکست‌خورده‌ای را که
   اصلاح را اثبات می‌کند دوباره اجرا کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که سطح تغییریافته
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این workflow، `pnpm plugins:sync:check` را اعتبارسنجی می‌کند،
   همه بسته‌های Plugin قابل انتشار را همزمان به npm و همان مجموعه را به
   ClawHub dispatch می‌کند، و سپس به‌محض موفق شدن انتشار npm Plugin،
   artifact آماده‌شده preflight مربوط به OpenClaw npm را با dist-tag مطابق ترویج می‌کند.
   انتشار ClawHub ممکن است همچنان هنگام انتشار OpenClaw npm در حال اجرا باشد، اما workflow
   انتشار تا زمانی که هر دو مسیر انتشار Plugin و
   مسیر انتشار OpenClaw npm با موفقیت کامل نشده باشند تمام نمی‌شود. پس از انتشار، پذیرش بسته پس از انتشار را
   روی بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار مطابق بعدی را ایجاد کنید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتای بررسی‌شده یا کاندید انتشار
    شواهد اعتبارسنجی لازم را داشت ادامه دهید. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` انجام می‌شود و با استفاده از
    `preflight_run_id` از artifact موفق preflight دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تاییدکننده پس از انتشار npm، آزمون E2E اختیاری standalone
    Telegram برای npm منتشرشده هنگامی که به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و مطابق `CHANGELOG.md`، و گام‌های اعلام انتشار را اجرا کنید.

## preflight انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها بیرون از گیت سریع‌تر محلی `pnpm check` هم پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و باندل Control UI برای مرحله اعتبارسنجی بسته وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از تگ‌گذاری، `pnpm plugins:sync` را اجرا کنید. این دستور نسخه‌های بسته‌های Plugin قابل انتشار، فراداده سازگاری peer/API در OpenClaw، فراداده ساخت، و stubهای changelog مربوط به Plugin را به‌روزرسانی می‌کند تا با نسخه انتشار هسته هماهنگ شوند. `pnpm plugins:sync:check` نگهبان غیرتغییردهنده انتشار است؛ اگر این مرحله فراموش شده باشد، workflow انتشار پیش از هرگونه تغییر در registry شکست می‌خورد.
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا همه test boxهای پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch، tag یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی، همترازی QA Lab، Matrix و laneهای Telegram dispatch می‌کند. اجراهای stable/default، soak کامل live/E2E و Docker release-path را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین package Telegram E2E را روی آرتیفکت `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، اگر همان Telegram E2E باید بسته منتشرشده npm را هم اثبات کند، `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، اگر Package Acceptance باید ماتریس package/update خود را به‌جای آرتیفکت ساخته‌شده از SHA روی بسته npm ارسال‌شده اجرا کند، `package_acceptance_package_spec` را ارائه کنید. وقتی گزارش private evidence باید ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده همخوان است بدون اینکه Telegram E2E اجباری شود، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید در حالی که کار انتشار ادامه دارد، برای یک نامزد بسته از مسیر جانبی proof بگیرید، workflow دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest` یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای بسته‌بندی یک branch/tag/SHA قابل اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. این workflow نامزد را به `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را روی همان tarball دوباره استفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، آرتیفکت package همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند. `update-restart-auth` از بسته نامزد هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر managed restart دستور update نامزد را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و reload پیکربندی
  - `package`: laneهای بومی آرتیفکت برای package/update/restart/Plugin بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل package به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: chunkهای Docker release-path همراه با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- وقتی فقط به پوشش کامل CI عادی برای نامزد انتشار نیاز دارید، workflow دستی `CI` را مستقیم اجرا کنید. dispatchهای CI دستی از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android و laneهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌کند و نام spanهای trace صادرشده، ویژگی‌های محدود، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse یا collector خارجی دیگر تأیید می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از اینکه tag وجود داشت، برای توالی انتشار تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل دسترسی از main، از `main`)، tag انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و scope پیش‌فرض انتشار Plugin یعنی `all-publishable` را نگه دارید مگر اینکه عمداً در حال اجرای یک تعمیر متمرکز باشید. این workflow انتشار npm مربوط به Plugin، انتشار ClawHub مربوط به Plugin، و انتشار npm مربوط به OpenClaw را serial می‌کند تا بسته هسته پیش از Pluginهای externalized خود منتشر نشود.
- اکنون release checks در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تأیید انتشار، lane همترازی mock مربوط به QA Lab به‌همراه پروفایل live سریع Matrix و lane QA مربوط به Telegram را اجرا می‌کند. laneهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی موجودی کامل transport، media و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` عمومی و `Full Release Validation` است که workflow قابل استفاده مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر انتشار واقعی npm را کوتاه، قطعی و آرتیفکت‌محور نگه دارید، در حالی که بررسی‌های کندتر live در lane خودشان باقی می‌مانند تا انتشار را متوقف یا مسدود نکنند
- release checkهای دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و secretها کنترل‌شده باقی بمانند
- `OpenClaw Release Checks` یک branch، tag یا SHA کامل commit را می‌پذیرد، تا زمانی که commit resolveشده از یک branch یا release tag متعلق به OpenClaw قابل دسترسی باشد
- پیش‌پرواز validation-only مربوط به `OpenClaw NPM Release` نیز SHA کامل ۴۰ کاراکتری commit در workflow-branch فعلی را بدون نیاز به tag push‌شده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده package مقدار `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به یک release tag واقعی نیاز دارد
- هر دو workflow مسیر انتشار و promotion واقعی را روی runnerهای GitHub-hosted نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تأیید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  را اجرا کنید (یا tag متناظر beta/correction را)
- پس از انتشار npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  را اجرا کنید (یا نسخه متناظر beta/correction را) تا مسیر نصب registry منتشرشده را در یک prefix موقت تازه تأیید کند
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram و Telegram E2E واقعی را در برابر بسته npm منتشرشده با استفاده از pool مشترک credentialهای lease‌شده Telegram تأیید کند. اجرای موردی محلی maintainer می‌تواند متغیرهای Convex را حذف کند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم بدهد.
- برای اجرای smoke کامل beta پس از انتشار از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. helper اعتبارسنجی npm update/fresh-target در Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق workflow را poll می‌کند، آرتیفکت را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- maintainerها می‌توانند همان بررسی پس از انتشار را از GitHub Actions از طریق workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و روی هر merge اجرا نمی‌شود.
- اتوماسیون انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm داشته باشد
  - انتشار واقعی npm باید از همان branch یعنی `main` یا `release/YYYY.M.D` که اجرای پیش‌پرواز موفق از آن بوده، dispatch شود
  - انتشارهای stable npm به‌صورت پیش‌فرض روی `beta` قرار می‌گیرند
  - انتشار stable npm می‌تواند از طریق ورودی workflow صراحتاً `latest` را هدف بگیرد
  - mutation مبتنی بر token برای npm dist-tag اکنون برای امنیت در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، زیرا `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که repo عمومی فقط انتشار OIDC-only را نگه می‌دارد
  - `macOS Release` عمومی فقط اعتبارسنجی است؛ وقتی tag فقط روی یک release branch قرار دارد اما workflow از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی private mac باید `preflight_run_id` و `validate_run_id` موفق private mac را داشته باشد
  - مسیرهای انتشار واقعی، آرتیفکت‌های آماده‌شده را promote می‌کنند به‌جای اینکه دوباره آن‌ها را build کنند
- برای انتشارهای correction قدیمی stable مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با prefix موقت را از `YYYY.M.D` به `YYYY.M.D-N` بررسی می‌کند تا correctionهای انتشار نتوانند بی‌سروصدا نصب‌های global قدیمی‌تر را روی payload پایه stable باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود تا دوباره داشبورد مرورگر خالی ارسال نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده package در layout نصب‌شده registry وجود داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را ناقص ارسال کند، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball نامزد update enforce می‌کند، بنابراین installer e2e پیش از مسیر release publish، بزرگ‌شدن تصادفی pack را می‌گیرد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای timing افزونه، یا ماتریس‌های آزمون افزونه دست زده است، پیش از تأیید، خروجی‌های ماتریس planner-owned مربوط به `plugin-prerelease-extension-shard` را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و review کنید تا یادداشت‌های انتشار یک layout قدیمی CI را توصیف نکنند
- آمادگی انتشار stable macOS شامل سطوح updater نیز می‌شود:
  - release مربوط به GitHub باید در نهایت شامل `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از انتشار به zip جدید stable اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف canonical build مربوط به Sparkle برای آن نسخه انتشار را حفظ کند

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه آزمون‌های پیش از انتشار را از یک نقطه ورود آغاز می‌کنند. برای proof مربوط به commit پین‌شده روی branch پرتحرک، از helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper مقدار `release-ci/<sha>-...` را push می‌کند، `Full Release Validation` را از آن branch با `ref=<sha>` dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با هدف مطابقت دارد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند جدیدتر `main` جلوگیری می‌کند.

برای اعتبارسنجی release branch یا tag، آن را از workflow ref قابل اعتماد `main` اجرا کنید و release branch یا tag را به‌عنوان `ref` بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این گردش‌کار مرجع هدف را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک
artifact والد `release-package-under-test` را برای بررسی‌های بسته‌محور آماده می‌کند، و
وقتی `release_profile=full` همراه با `rerun_group=all` باشد یا وقتی
`npm_telegram_package_spec` تنظیم شده باشد، E2E مستقل بسته Telegram را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های انتشار بین سیستم‌عاملی، پوشش live/E2E Docker
در مسیر انتشار هنگام فعال بودن soak، Package Acceptance همراه با QA بسته Telegram،
هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده را منشعب می‌کند. اجرای کامل فقط وقتی قابل قبول است که
خلاصه‌ی `Full Release Validation`
`normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، مگر اینکه
`npm_telegram_package_spec` منتشرشده ارائه شده باشد، رد می‌شود. خلاصه‌ی نهایی
verifier جدول‌های کندترین job را برای هر اجرای فرزند شامل می‌شود، تا مدیر انتشار
بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های profile پایدار در برابر کامل،
artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از مرجع قابل اعتماد اجراکننده‌ی `Full Release
Validation` dispatch می‌شوند، معمولاً `--ref main`، حتی وقتی `ref` هدف به یک
branch یا tag انتشار قدیمی‌تر اشاره کند. ورودی workflow-ref جداگانه‌ای برای Full Release Validation
وجود ندارد؛ harness قابل اعتماد را با انتخاب مرجع اجرای گردش‌کار انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند مرجع workflow dispatch باشند، پس از
`pnpm ci:full-release --sha <sha>` برای ایجاد branch موقت pinشده استفاده کنید.

از `release_profile` برای انتخاب گستره‌ی live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر Docker و live حیاتی انتشار برای OpenAI/core
- `stable`: minimum به‌علاوه‌ی پوشش provider/backend پایدار برای تأیید انتشار
- `full`: stable به‌علاوه‌ی پوشش گسترده‌ی provider/media مشورتی

وقتی laneهای مسدودکننده‌ی انتشار سبز هستند و پیش از promotion می‌خواهید جاروی جامع live/E2E، مسیر انتشار Docker، و
upgrade-survivor منتشرشده‌ی محدود را اجرا کنید، از `run_release_soak=true` همراه با `stable` استفاده کنید. آن sweep
چهار بسته‌ی پایدار جدید به‌علاوه‌ی baselineهای pinشده‌ی `2026.4.23` و `2026.5.2`
و پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری حذف می‌شوند و
هر baseline در job runner Docker خودش shard می‌شود. `full` به‌طور ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از مرجع گردش‌کار قابل اعتماد استفاده می‌کند تا مرجع هدف را
یک‌بار به‌عنوان `release-package-under-test` resolve کند و همان artifact را در بررسی‌های بین سیستم‌عاملی،
Package Acceptance، و Docker مسیر انتشار هنگام اجرای soak بازاستفاده کند. این کار
همه‌ی باکس‌های بسته‌محور را روی byteهای یکسان نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند.
install smoke بین سیستم‌عاملی OpenAI وقتی متغیر repo/org تنظیم شده باشد از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه `openai/gpt-5.4`، چون این lane
نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت عامل زنده را اثبات می‌کند
نه benchmark کندترین مدل پیش‌فرض را. ماتریس گسترده‌تر provider زنده
جای پوشش مدل‌محور باقی می‌ماند.

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

پس از یک fix متمرکز، از umbrella کامل به‌عنوان اولین rerun استفاده نکنید. اگر یک باکس
fail شد، برای proof بعدی از گردش‌کار فرزند failشده، job، lane Docker، profile بسته، provider مدل،
یا lane QA استفاده کنید. umbrella کامل را فقط وقتی دوباره اجرا کنید که
fix orchestration مشترک انتشار را تغییر داده باشد یا شواهد all-box قبلی را
کهنه کرده باشد. verifier نهایی umbrella شناسه‌های ثبت‌شده‌ی اجرای گردش‌کار فرزند را دوباره بررسی می‌کند،
پس پس از rerun موفق یک گردش‌کار فرزند، فقط job والد failشده‌ی
`Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به umbrella بدهید. `all` اجرای واقعی
نامزد انتشار است، `ci` فقط فرزند CI معمول را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin مخصوص انتشار را اجرا می‌کند، `release-checks` هر باکس انتشار را اجرا می‌کند،
و گروه‌های انتشار محدودتر عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all
با `release_profile=full` از artifact بسته‌ی release-checks استفاده می‌کنند. rerunهای متمرکز
بین سیستم‌عاملی می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا
filter سیستم‌عامل/suite دیگری اضافه کنند. failureهای QA release-check مشورتی هستند؛ failure فقط QA
اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

باکس Vitest همان گردش‌کار فرزند `CI` دستی است. CI دستی عمداً
scoping تغییرات را دور می‌زند و گراف تست معمول را برای نامزد انتشار
اجبار می‌کند: shardهای Linux Node، shardهای Pluginهای bundled، قراردادهای channel، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows،
macOS، Android، و i18n Control UI.

از این باکس برای پاسخ به این پرسش استفاده کنید: «آیا درخت source، suite کامل تست معمول را پاس کرد؟»
این همان اعتبارسنجی محصول در مسیر انتشار نیست. شواهدی که باید نگه دارید:

- خلاصه‌ی `Full Release Validation` که URL اجرای `CI` dispatchشده را نشان می‌دهد
- اجرای `CI` سبز روی SHA هدف دقیق
- نام shardهای failشده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که انتشار به CI معمول deterministic نیاز دارد، اما
نه به باکس‌های Docker، QA Lab، live، بین سیستم‌عاملی، یا بسته:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

باکس Docker از طریق
`openclaw-live-and-e2e-checks-reusable.yml` در `OpenClaw Release Checks` قرار دارد،
به‌علاوه‌ی گردش‌کار `install-smoke` در حالت انتشار. این باکس نامزد انتشار را از طریق محیط‌های Docker بسته‌بندی‌شده
اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن install smoke کند Bun global
- آماده‌سازی/بازاستفاده‌ی image smoke ریشه‌ی Dockerfile بر اساس SHA هدف، با jobهای smoke مربوط به QR،
  root/gateway، و installer/Bun که به‌عنوان shardهای install-smoke جدا اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`,
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`، `plugins-runtime-install-b`,
  `plugins-runtime-install-c`، `plugins-runtime-install-d`,
  `plugins-runtime-install-e`، `plugins-runtime-install-f`,
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- laneهای split install/uninstall برای Plugin bundled
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زنده‌ی Docker وقتی release checks
  suiteهای زنده را شامل شود

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر انتشار
`.artifacts/docker-tests/` را همراه با logهای lane، `summary.json`، `failures.json`,
زمان‌بندی phaseها، JSON برنامه‌ی scheduler، و commandهای rerun upload می‌کند. برای بازیابی متمرکز،
به‌جای rerun همه‌ی chunkهای انتشار از `docker_lanes=<lane[,lane]>` روی گردش‌کار reusable live/E2E استفاده کنید.
commandهای rerun تولیدشده، وقتی در دسترس باشند، `package_artifact_run_id` قبلی و inputهای image Docker آماده‌شده را شامل می‌شوند،
تا یک lane failشده بتواند همان tarball و imageهای GHCR را بازاستفاده کند.

### QA Lab

باکس QA Lab نیز بخشی از `OpenClaw Release Checks` است. این باکس gate انتشار
رفتار عامل‌محور و سطح channel است، جدا از مکانیک بسته‌ی Vitest و Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane هم‌ارزی mock که lane نامزد OpenAI را با baseline Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- profile سریع QA زنده‌ی Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده‌ی Telegram با استفاده از leaseهای credential Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به proof محلی صریح نیاز دارد

از این باکس برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
flowهای channel زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URLهای artifact را برای laneهای parity،
Matrix، و Telegram نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای QA-Lab دستی shardشده
در دسترس است، نه lane پیش‌فرض حیاتی انتشار.

### بسته

باکس بسته، gate محصول قابل نصب است. این باکس توسط
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک
candidate را به tarball `package-under-test` مصرف‌شده توسط Docker E2E normalize می‌کند، inventory بسته را اعتبارسنجی می‌کند،
نسخه‌ی بسته و SHA-256 را ثبت می‌کند، و مرجع harness گردش‌کار را از مرجع source بسته جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw
- `source=ref`: یک branch، tag، یا SHA کامل commit در `package_ref` قابل اعتماد را
  با harness انتخاب‌شده‌ی `workflow_ref` pack کنید
- `source=url`: یک `.tgz` با HTTPS و `package_sha256` الزامی download کنید
- `source=artifact`: از یک `.tgz` uploadشده توسط اجرای GitHub Actions دیگر بازاستفاده کنید

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته‌ی انتشار آماده‌شده،
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update،
restart update با auth پیکربندی‌شده، cleanup وابستگی Plugin stale، fixtureهای Plugin offline،
update Plugin، و QA بسته Telegram را در برابر همان tarball resolveشده نگه می‌دارد.
release checks مسدودکننده از baseline پیش‌فرض آخرین بسته‌ی منتشرشده استفاده می‌کنند؛
`run_release_soak=true` یا
`release_profile=full` به هر baseline پایدار منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوه‌ی fixtureهای issue گزارش‌شده گسترش می‌یابد. برای یک candidate که قبلاً منتشر شده است،
از Package Acceptance با `source=npm` استفاده کنید، یا پیش از publish برای tarball npm محلی متکی به SHA
از `source=ref`/`source=artifact` استفاده کنید. این جایگزین native GitHub
برای بیشتر پوشش package/update است که قبلاً به Parallels نیاز داشت.
بررسی‌های انتشار بین سیستم‌عاملی همچنان برای onboarding، installer، و رفتار platform ویژه‌ی OS مهم هستند،
اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست canonical برای اعتبارسنجی update و Plugin
[تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری اینکه کدام lane محلی، Docker، Package Acceptance،
یا release-check یک install/update Plugin، cleanup doctor، یا تغییر migration بسته‌ی منتشرشده را اثبات می‌کند،
از آن استفاده کنید.
migration جامع update منتشرشده از هر بسته‌ی پایدار `2026.4.23+`
یک گردش‌کار دستی جداگانه‌ی `Update Migration` است، نه بخشی از Full Release CI.

مدارای قدیمی پذیرش بسته عمدا زمان‌بندی محدود دارد. بسته‌ها تا
`2026.4.25` می‌توانند برای شکاف‌های فراداده‌ای که از قبل در npm منتشر شده‌اند
از مسیر سازگاری استفاده کنند: ورودی‌های موجودی QA خصوصی که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود
`update.channel` پایدارشده، مکان‌های قدیمی رکورد نصب plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است
برای فایل‌های stamp فراداده ساخت محلی که از قبل منتشر شده بودند هشدار دهد. بسته‌های بعدی
باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها اعتبارسنجی انتشار را ناموفق می‌کنند.

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/عامل، شبکه Gateway، و بارگذاری مجدد پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی مجدد/بسته plugin بدون ClawHub زنده؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: قطعه‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. workflow،
tarball حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ workflow مستقل
Telegram همچنان برای بررسی‌های پس از انتشار یک مشخصات npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` نقطه ورود معمول انتشار تغییردهنده است. این workflowهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout کرده و commit SHA آن را حل کنید.
2. بررسی کنید tag از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با tag انتشار، dist-tag در npm، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

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

ارتقای پایدار مستقیما به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کار تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
workflow فرزند را مستقیم dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط جهت اعتبارسنجی
  می‌تواند SHA کامل ۴۰ کاراکتری commit فعلی شاخه workflow نیز باشد
- `preflight_only`: `true` برای فقط اعتبارسنجی/ساخت/بسته، `false` برای مسیر
  انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا workflow از tarball آماده‌شده
  از اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: tag هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر متمرکز
  از `selected` استفاده کنید
- `plugins`: نام بسته‌های `@openclaw/*` جداشده با ویرگول، وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده
  تعمیر فقط plugin به کار می‌برید، آن را `false` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند commit حل‌شده از یک شاخه OpenClaw یا tag انتشار قابل دسترسی باشد.
- `run_release_soak`: فعال‌سازی soak کامل live/E2E، مسیر انتشار Docker، و
  upgrade-survivor از ابتدای تاریخچه در بررسی‌های انتشار پایدار/پیش‌فرض. با
  `release_profile=full` اجباری فعال می‌شود.

قواعد:

- tagهای پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- tagهای prerelease بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که هنگام preflight استفاده شده است؛
  workflow پیش از ادامه انتشار، آن فراداده را بررسی می‌کند

## توالی انتشار پایدار npm

هنگام آماده‌سازی یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید برای اجرای آزمایشی بدون انتشار و فقط جهت اعتبارسنجی
     workflow preflight، از SHA کامل commit فعلی شاخه workflow استفاده کنید
2. برای جریان معمول بتا-اول، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی
   عمدا انتشار مستقیم پایدار می‌خواهید `latest` را انتخاب کنید
3. وقتی از یک workflow دستی پوشش عادی CI به‌همراه live prompt cache، Docker، QA Lab،
   Matrix، و Telegram می‌خواهید، `Full Release Validation` را روی شاخه انتشار، tag انتشار،
   یا SHA کامل commit اجرا کنید
4. اگر عمدا فقط به گراف آزمون عادی قطعی نیاز دارید، به‌جای آن workflow دستی
   `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار pluginهای externalized را پیش از
   ارتقای بسته npm OpenClaw به npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیم به `latest` منتشر شد و `beta` باید فورا همان ساخت پایدار
   را دنبال کند، از همان workflow خصوصی استفاده کنید تا هر دو dist-tag را به نسخه پایدار
   اشاره دهد، یا اجازه دهید همگام‌سازی خودترمیمی زمان‌بندی‌شده آن بعدا `beta` را جابه‌جا کند

تغییر dist-tag به‌دلیل امنیت در مخزن خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، درحالی‌که مخزن عمومی انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار باعث می‌شود مسیر انتشار مستقیم و مسیر ارتقای بتا-اول، هر دو مستند و برای اپراتور قابل مشاهده باشند.

اگر maintainer ناچار شود به احراز هویت محلی npm برگردد، هر فرمان 1Password
CLI (`op`) را فقط داخل یک جلسه اختصاصی tmux اجرا کنید. `op` را مستقیم از shell اصلی agent
فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود promptها، هشدارها، و رسیدگی به OTP
قابل مشاهده باشند و از هشدارهای مکرر میزبان جلوگیری می‌کند.

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

Maintainerها برای runbook واقعی از مستندات انتشار خصوصی در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
