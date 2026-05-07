---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، باکس‌های اعتبارسنجی، نام‌گذاری نسخه و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-07T15:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای تگ‌شده که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتا درخواست شود در npm با `latest`
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
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتا `latest` را هدف بگیرند، یا بعدا یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw، بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولا ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه Mac برای انتشار پایدار نگه داشته می‌شود مگر اینکه صراحتا درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از مسیر بتا پیش می‌روند
- پایدار فقط پس از اعتبارسنجی آخرین بتا انجام می‌شود
- نگه‌دارندگان معمولا انتشارها را از شاخه `release/YYYY.M.D` می‌برند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی و اصلاحات انتشار، توسعه جدید
  روی `main` را مسدود نکند
- اگر یک تگ بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی تگ بتای قدیمی، تگ بعدی `-beta.N` را می‌برند
- رویه دقیق انتشار، تاییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات بازگردانی اضطراری در
runbook انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تایید کنید commit هدف push شده است،
   و تایید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بالاترین بخش `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، مدخل‌ها را کاربرمحور نگه دارید، آن را commit کنید، push کنید، و
   یک بار دیگر پیش از شاخه‌سازی rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمدا
   حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیما روی `main` انجام ندهید.
5. همه مکان‌های نسخه لازم را برای تگ موردنظر افزایش دهید، سپس
   `pnpm release:prep` را اجرا کنید. این دستور نسخه‌های Plugin، موجودی Plugin، شمای
   پیکربندی، فراداده پیکربندی کانال‌های همراه، baseline مستندات پیکربندی، exportهای Plugin SDK،
   و baseline API مربوط به Plugin SDK را به ترتیب درست تازه‌سازی می‌کند. هر drift تولیدشده را
   پیش از تگ‌گذاری commit کنید. سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود داشتن تگ،
   یک SHA کامل ۴۰ کاراکتری از شاخه انتشار برای پیش‌پرواز فقط-اعتبارسنجی
   مجاز است. `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، تگ، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل بسته، ارائه‌دهنده، یا allowlist مدل شکست‌خورده را
   که اصلاح را ثابت می‌کند دوباره اجرا کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را تگ کنید، سپس `OpenClaw Release Publish` را از
   شاخه مطابق `release/YYYY.M.D` اجرا کنید. این کار `pnpm plugins:sync:check` را تایید می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را
   به ClawHub به‌صورت موازی dispatch می‌کند، و سپس artifact پیش‌پرواز آماده‌شده npm مربوط به OpenClaw را
   به‌محض موفقیت انتشار Plugin در npm با dist-tag مطابق ترویج می‌کند.
   انتشار ClawHub ممکن است همچنان هنگام انتشار npm مربوط به OpenClaw در حال اجرا باشد، اما
   گردش‌کار انتشار، شناسه‌های run فرزند را فورا چاپ می‌کند. به‌طور پیش‌فرض
   پس از dispatch کردن ClawHub منتظر آن نمی‌ماند، بنابراین در دسترس بودن npm مربوط به OpenClaw
   توسط تاییدهای کندتر ClawHub یا کارهای registry مسدود نمی‌شود؛ وقتی
   ClawHub باید تکمیل گردش‌کار را مسدود کند، `wait_for_clawhub=true` را تنظیم کنید. مسیر
   ClawHub شکست‌های گذرای نصب وابستگی CLI را دوباره امتحان می‌کند، Pluginهای
   گذرانده پیش‌نمایش را حتی وقتی یک خانه پیش‌نمایش ناپایدار شود منتشر می‌کند، و با
   تایید registry برای هر نسخه Plugin مورد انتظار پایان می‌یابد تا انتشارهای ناقص
   همچنان قابل مشاهده و قابل تلاش مجدد بمانند. پس از انتشار، پذیرش بسته
   پس از انتشار را در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار مطابق بعدی را ببرید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتا یا نامزد انتشار بررسی‌شده
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` عبور می‌کند و artifact پیش‌پرواز موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تاییدکننده پس از انتشار npm، آزمون E2E اختیاری Telegram روی npm منتشرشده مستقل
    وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و مطابق `CHANGELOG.md`، و مراحل اعلان انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌بررسی انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript آزمون‌ها خارج از gate سریع‌تر محلی `pnpm check` نیز
  پوشش داده شود
- پیش از پیش‌بررسی انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import
  و مرزهای معماری خارج از gate سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا مصنوعات انتشار مورد انتظار
  `dist/*` و بسته Control UI برای مرحله اعتبارسنجی pack
  وجود داشته باشند
- پس از افزایش نسخه root و پیش از tagگذاری، `pnpm release:prep` را اجرا کنید. این دستور
  همه مولدهای قطعی انتشار را اجرا می‌کند که معمولا پس از تغییر
  نسخه/پیکربندی/API دچار drift می‌شوند: نسخه‌های plugin، موجودی plugin، طرح‌واره پیکربندی پایه،
  فراداده پیکربندی channelهای همراه، baseline مستندات پیکربندی، خروجی‌های plugin SDK
  و baseline API plugin SDK. `pnpm release:check` این
  guardها را دوباره در حالت check اجرا می‌کند و هر شکست drift تولیدشده‌ای را که پیدا کند، در یک
  گذر و پیش از اجرای بررسی‌های انتشار بسته گزارش می‌دهد.
- پیش از تایید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا
  همه test boxهای پیش از انتشار از یک نقطه ورود آغاز شوند. این workflow یک branch،
  tag یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند و
  `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی،
  برابری QA Lab، Matrix و laneهای Telegram dispatch می‌کند. اجراهای stable/default
  soak کامل live/E2E و مسیر انتشار Docker را پشت
  `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با
  `release_profile=full` و `rerun_group=all`، همچنین package Telegram
  E2E را در برابر artifact به نام `release-package-under-test` از release checks اجرا می‌کند.
  پس از انتشار، وقتی همان Telegram E2E باید بسته npm منتشرشده را نیز اثبات کند،
  `npm_telegram_package_spec` را ارائه کنید. پس از انتشار، وقتی Package Acceptance
  باید matrix بسته/به‌روزرسانی خود را به‌جای artifact ساخته‌شده از SHA، در برابر بسته npm ارسال‌شده اجرا کند،
  `package_acceptance_package_spec` را ارائه کنید.
  وقتی گزارش evidence خصوصی باید ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه Telegram E2E را اجباری کند،
  `evidence_package_spec` را ارائه کنید.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید در حالی که کار انتشار ادامه دارد، proof جانبی برای یک candidate بسته داشته باشید،
  workflow دستی `Package Acceptance` را اجرا کنید. برای
  `openclaw@beta`، `openclaw@latest` یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای
  pack کردن یک branch/tag/SHA معتبر `package_ref` با harness فعلی
  `workflow_ref` از `source=ref` استفاده کنید؛ برای یک tarball HTTPS با
  SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub
  Actions از `source=artifact` استفاده کنید. این workflow candidate را به
  `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان
  tarball بازاستفاده می‌کند و می‌تواند QA Telegram را با
  `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` در برابر همان tarball اجرا کند. وقتی
  laneهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، artifact بسته همان candidate است و
  `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  `update-restart-auth` از بسته candidate هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده فرمان update
  candidate را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای install/channel/agent، شبکه gateway و reload پیکربندی
  - `package`: laneهای بومی artifact برای package/update/restart/plugin بدون OpenWebUI یا ClawHub زنده
  - `product`: profile بسته به‌علاوه channelهای MCP، پاک‌سازی cron/subagent،
    جستجوی وب OpenAI و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای مجدد متمرکز
- وقتی فقط به پوشش کامل CI معمولی برای candidate انتشار نیاز دارید، workflow دستی `CI` را مستقیما
  اجرا کنید. dispatchهای دستی CI، scoping مبتنی بر تغییرات را دور می‌زنند
  و shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel،
  سازگاری Node 22، `check`، `check-additional`، build smoke،
  بررسی‌های مستندات، Python skills، Windows، macOS، Android و laneهای Control UI i18n
  را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور
  QA-lab را از طریق یک گیرنده OTLP/HTTP محلی اجرا می‌کند و نام spanهای trace
  صادرشده، attributeهای محدود و redaction محتوا/شناسه را بدون
  نیاز به Opik، Langfuse یا collector خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- پس از وجود tag، برای توالی mutating publish، `OpenClaw Release Publish` را اجرا کنید.
  آن را از `release/YYYY.M.D` dispatch کنید (یا هنگام انتشار tag قابل‌دسترسی از main، از `main`)،
  tag انتشار و `preflight_run_id` موفق OpenClaw npm را پاس دهید
  و scope پیش‌فرض publish plugin یعنی
  `all-publishable` را نگه دارید، مگر اینکه عمدا repair متمرکز اجرا می‌کنید. این
  workflow انتشار plugin در npm، انتشار plugin در ClawHub و انتشار OpenClaw
  در npm را سریالی می‌کند تا بسته core پیش از pluginهای externalized
  آن منتشر نشود.
- اکنون release checks در یک workflow دستی جداگانه اجرا می‌شود:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، lane برابری mock در QA Lab به‌همراه profile سریع
  Matrix زنده و lane QA Telegram را اجرا می‌کند. laneهای زنده
  از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI
  استفاده می‌کند. وقتی موجودی کامل transport، media و E2EE مربوط به Matrix را
  به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با
  `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و upgrade میان‌سیستمی بخشی از
  `OpenClaw Release Checks` و `Full Release Validation` عمومی است که
  workflow قابل‌بازاستفاده
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیما فراخوانی می‌کنند
- این تفکیک عمدی است: مسیر واقعی انتشار npm را کوتاه،
  قطعی و artifactمحور نگه دارید، در حالی که بررسی‌های زنده کندتر در lane خودشان می‌مانند تا
  publish را متوقف یا مسدود نکنند
- release checks دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و
  secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag یا SHA کامل commit را تا زمانی می‌پذیرد
  که commit resolveشده از یک branch یا release tag در OpenClaw قابل‌دسترسی باشد
- پیش‌بررسی validation-only برای `OpenClaw NPM Release` نیز SHA کامل ۴۰ کاراکتری فعلی commit مربوط به workflow-branch را
  بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای validation است و نمی‌تواند به publish واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی فراداده بسته، `v<package.json version>` را
  synthesize می‌کند؛ publish واقعی همچنان به release tag واقعی نیاز دارد
- هر دو workflow مسیر واقعی publish و promotion را روی runnerهای GitHub-hosted
  نگه می‌دارند، در حالی که مسیر validation غیرmutating می‌تواند از runnerهای Linux بزرگ‌تر
  Blacksmith استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌بررسی انتشار npm دیگر منتظر lane جداگانه release checks نمی‌ماند
- پیش از تایید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  را اجرا کنید
  (یا tag متناظر beta/correction)
- پس از publish در npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  را اجرا کنید
  (یا نسخه متناظر beta/correction) تا مسیر install از registry منتشرشده را در یک temp prefix تازه
  بررسی کند
- پس از publish یک beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram و Telegram E2E واقعی
  را در برابر بسته npm منتشرشده با استفاده از credential pool مشترک leaseشده Telegram
  بررسی کند. اجراهای موردی محلی maintainer می‌توانند متغیرهای Convex را حذف کنند و سه
  credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیما پاس دهند.
- برای اجرای smoke کامل پس از publish beta از ماشین maintainer، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی npm update/fresh-target در Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای workflow دقیق را poll می‌کند، artifact را download می‌کند و گزارش Telegram را چاپ می‌کند.
- Maintainerها می‌توانند همان بررسی پس از publish را از GitHub Actions از طریق
  workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمدا فقط دستی است و
  در هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - publish واقعی npm باید یک `preflight_run_id` موفق npm را pass کرده باشد
  - publish واقعی npm باید از همان branch `main` یا
    `release/YYYY.M.D` مثل اجرای preflight موفق dispatch شود
  - انتشارهای stable npm به‌صورت پیش‌فرض روی `beta` هستند
  - publish stable npm می‌تواند از طریق input workflow صراحتا `latest` را هدف بگیرد
  - تغییر tokenمحور dist-tag در npm اکنون در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، به‌دلایل امنیتی، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که
    repo عمومی publish فقط با OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای validation است؛ وقتی یک tag فقط روی
    release branch وجود دارد اما workflow از `main` dispatch می‌شود،
    `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - publish واقعی mac خصوصی باید `preflight_run_id` و `validate_run_id` موفق private mac را
    pass کرده باشد
  - مسیرهای publish واقعی، artifactهای آماده‌شده را promote می‌کنند به‌جای اینکه
    دوباره آن‌ها را rebuild کنند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از publish
  همان مسیر upgrade با temp-prefix را نیز از `YYYY.M.D` به `YYYY.M.D-N`
  بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی
  payload پایه stable باقی بگذارند
- پیش‌بررسی انتشار npm به‌صورت fail closed شکست می‌خورد مگر اینکه tarball هم
  `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود
  تا دوباره داشبورد مرورگر خالی منتشر نکنیم
- verification پس از publish همچنین بررسی می‌کند که entrypointهای plugin منتشرشده و
  فراداده بسته در layout registry نصب‌شده وجود داشته باشند. انتشاری که
  payloadهای runtime مربوط به plugin را جا بیندازد، verifier پس از publish را fail می‌کند و
  نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی
  tarball candidate update enforce می‌کند، بنابراین installer e2e پیش از مسیر publish انتشار، pack bloat تصادفی
  را شناسایی می‌کند
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension یا
  matrixهای آزمون extension دست زده است، خروجی‌های matrix متعلق به planner با نام
  `plugin-prerelease-extension-shard` را از
  `.github/workflows/plugin-prerelease.yml` پیش از تایید regenerate و review کنید تا release notes
  layout قدیمی CI را توصیف نکند
- آمادگی انتشار stable در macOS شامل surfaceهای updater نیز هست:
  - GitHub release باید در نهایت شامل `.zip`، `.dmg` و `.dSYM.zip` بسته‌بندی‌شده باشد
  - `appcast.xml` روی `main` باید پس از publish به zip stable جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیرdebug، URL غیرخالی feed مربوط به Sparkle
    و `CFBundleVersion` برابر یا بالاتر از کف canonical build در Sparkle
    برای آن نسخه انتشار را حفظ کند

## Release test boxes

`Full Release Validation` روشی است که operatorها از طریق آن همه آزمون‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. برای اثبات commit پین‌شده روی branch سریع‌تغییر، از
helper استفاده کنید تا هر workflow فرزند از یک branch موقت ثابت‌شده روی SHA هدف
اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

این helper، `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از آن branch با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند
با هدف مطابقت داشته باشد، سپس branch موقت را حذف می‌کند. این کار از اثبات تصادفی اجرای فرزند
جدیدتر روی `main` جلوگیری می‌کند.

برای اعتبارسنجی شاخه یا برچسب انتشار، آن را از ref گردش‌کار قابل اعتماد `main` اجرا کنید و شاخه یا برچسب انتشار را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این گردش‌کار ref هدف را resolve می‌کند، `CI` دستی را با `target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک artifact والد `release-package-under-test` برای بررسی‌های روبه‌روی بسته آماده می‌کند، و وقتی `release_profile=full` همراه با `rerun_group=all` باشد یا وقتی `npm_telegram_package_spec` تنظیم شده باشد، Telegram E2E بسته مستقل را dispatch می‌کند. سپس `OpenClaw Release Checks` install smoke، بررسی‌های انتشار میان‌سیستمی، پوشش زنده/E2E مسیر انتشار Docker وقتی soak فعال است، Package Acceptance با QA بسته Telegram، parity آزمایشگاه QA، Matrix زنده، و Telegram زنده را به‌صورت fan out اجرا می‌کند. اجرای کامل فقط زمانی قابل قبول است که خلاصه `Full Release Validation`، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all، فرزند `npm_telegram` نیز باید موفق باشد؛ خارج از full/all رد می‌شود مگر اینکه یک `npm_telegram_package_spec` منتشرشده ارائه شده باشد. خلاصه verifier نهایی شامل جدول‌های کندترین job برای هر اجرای فرزند است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند. برای ماتریس کامل مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل stable در برابر full، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای فرزند از ref قابل اعتمادی dispatch می‌شوند که `Full Release Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی `ref` هدف به شاخه یا برچسب انتشار قدیمی‌تر اشاره کند. ورودی workflow-ref جداگانه‌ای برای Full Release Validation وجود ندارد؛ harness قابل اعتماد را با انتخاب ref اجرای گردش‌کار انتخاب کنید. برای proof دقیق commit روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛ SHAهای خام commit نمی‌توانند refهای workflow dispatch باشند، پس از `pnpm ci:full-release --sha <sha>` برای ساخت شاخه موقت pin شده استفاده کنید.

برای انتخاب گستره زنده/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر زنده و Docker حیاتی برای انتشار OpenAI/core
- `stable`: حداقل به‌علاوه پوشش provider/backend پایدار برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده provider/media مشورتی

وقتی laneهای مسدودکننده انتشار سبز هستند و پیش از promotion، جاروب کامل زنده/E2E، مسیر انتشار Docker، و upgrade-survivor محدودِ منتشرشده را می‌خواهید، از `run_release_soak=true` همراه با `stable` استفاده کنید. آن جاروب چهار بسته stable آخر به‌علاوه baselineهای pin شده `2026.4.23` و `2026.5.2` به‌علاوه پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و هر baseline را در job runner جداگانه Docker خودش shard می‌کند. `full` به‌طور ضمنی `run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ref گردش‌کار قابل اعتماد استفاده می‌کند تا ref هدف را یک‌بار به‌صورت `release-package-under-test` resolve کند و وقتی soak اجرا می‌شود، آن artifact را در بررسی‌های میان‌سیستمی، Package Acceptance، و Docker مسیر انتشار دوباره استفاده می‌کند. این کار همه boxهای روبه‌روی بسته را روی همان byteها نگه می‌دارد و از buildهای تکراری بسته جلوگیری می‌کند. Install smoke میان‌سیستمی OpenAI وقتی متغیر repo/org تنظیم باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این lane نصب بسته، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده را اثبات می‌کند نه benchmark کردن کندترین مدل پیش‌فرض را. ماتریس provider زنده گسترده‌تر، همچنان محل پوشش مدل‌محور است.

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

پس از یک اصلاح متمرکز، از چتر کامل به‌عنوان اولین rerun استفاده نکنید. اگر یک box شکست خورد، برای proof بعدی از گردش‌کار فرزند، job، lane Docker، پروفایل بسته، provider مدل، یا lane QA شکست‌خورده استفاده کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که اصلاح، orchestration انتشار مشترک را تغییر داده باشد یا evidence قبلی همه boxها را stale کرده باشد. verifier نهایی چتر، شناسه‌های ثبت‌شده اجرای گردش‌کار فرزند را دوباره بررسی می‌کند، پس پس از اینکه یک گردش‌کار فرزند با موفقیت rerun شد، فقط job والد شکست‌خورده `Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به چتر پاس دهید. `all` اجرای واقعی release-candidate است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease` فقط فرزند Plugin ویژه انتشار را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند، و گروه‌های انتشار محدودتر عبارت‌اند از `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`. Rerunهای متمرکز `npm-telegram` به `npm_telegram_package_spec` نیاز دارند؛ اجرای full/all با `release_profile=full` از artifact بسته release-checks استفاده می‌کند. Rerunهای متمرکز میان‌سیستمی می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا فیلتر OS/suite دیگری اضافه کنند. شکست‌های QA در release-check مشورتی هستند؛ شکست فقط-QA اعتبارسنجی انتشار را مسدود نمی‌کند.

### Vitest

Box Vitest، گردش‌کار فرزند `CI` دستی است. CI دستی عمدا scoping تغییرات را دور می‌زند و گراف تست عادی را برای release candidate اجباری می‌کند: shardهای Linux Node، shardهای Pluginهای bundled، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، Android، و Control UI i18n.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا درخت source مجموعه کامل تست عادی را گذراند؟» این همان اعتبارسنجی محصول مسیر انتشار نیست. Evidenceهایی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatch شده را نشان می‌دهد
- اجرای `CI` سبز روی SHA هدف دقیق
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی اجرای تست به تحلیل performance نیاز دارد

CI دستی را مستقیم فقط وقتی اجرا کنید که انتشار به CI عادی deterministic نیاز دارد اما به boxهای Docker، QA Lab، زنده، میان‌سیستمی، یا بسته نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker در `OpenClaw Release Checks` از طریق `openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه گردش‌کار `install-smoke` در حالت انتشار قرار دارد. این box، release candidate را از طریق محیط‌های Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل موارد زیر است:

- install smoke کامل با فعال بودن install smoke global کند Bun
- آماده‌سازی/استفاده دوباره از image smoke ریشه Dockerfile بر اساس SHA هدف، با jobهای QR، root/gateway، و installer/Bun smoke که به‌صورت shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a`، `plugins-runtime-install-b`، `plugins-runtime-install-c`، `plugins-runtime-install-d`، `plugins-runtime-install-e`، `plugins-runtime-install-f`، `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` وقتی درخواست شود
- laneهای جداشده نصب/حذف Pluginهای bundled از `bundled-plugin-install-uninstall-0` تا `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زنده Docker وقتی release checks شامل suiteهای زنده باشد

پیش از rerun کردن از artifactهای Docker استفاده کنید. scheduler مسیر انتشار، `.artifacts/docker-tests/` را همراه با logهای lane، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON طرح scheduler، و فرمان‌های rerun upload می‌کند. برای بازیابی متمرکز، به‌جای rerun همه chunkهای انتشار، در گردش‌کار reusable زنده/E2E از `docker_lanes=<lane[,lane]>` استفاده کنید. فرمان‌های rerun تولیدشده وقتی در دسترس باشند، `package_artifact_run_id` قبلی و ورودی‌های image آماده‌شده Docker را شامل می‌شوند، تا lane شکست‌خورده بتواند همان tarball و imageهای GHCR را دوباره استفاده کند.

### QA Lab

Box QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate انتشار رفتار agentic و سطح channel است، جدا از مکانیک‌های بسته Vitest و Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- lane mock parity که lane candidate OpenAI را با baseline Opus 4.6 با استفاده از agentic parity pack مقایسه می‌کند
- پروفایل سریع QA زنده Matrix با استفاده از محیط `qa-live-shared`
- lane QA زنده Telegram با استفاده از leaseهای credential در Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به proof محلی صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و flowهای channel زنده درست رفتار می‌کند؟» هنگام تایید انتشار، URLهای artifact را برای laneهای parity، Matrix، و Telegram نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی shard شده QA-Lab در دسترس است، نه lane پیش‌فرض حیاتی برای انتشار.

### بسته

Box بسته، gate محصول قابل نصب است. این box با `Package Acceptance` و resolver `scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. Resolver یک candidate را به tarball `package-under-test` مصرف‌شده توسط Docker E2E normalize می‌کند، inventory بسته را اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند، و ref harness گردش‌کار را از ref source بسته جدا نگه می‌دارد.

Sourceهای پشتیبانی‌شده candidate:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا نسخه دقیق انتشار OpenClaw
- `source=ref`: یک شاخه، برچسب، یا SHA کامل commit در `package_ref` قابل اعتماد را با harness انتخاب‌شده `workflow_ref` بسته‌بندی کنید
- `source=url`: یک `.tgz` در HTTPS را با `package_sha256` الزامی دانلود کنید
- `source=artifact`: از یک `.tgz` upload شده توسط اجرای دیگر GitHub Actions دوباره استفاده کنید

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`، و `telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update، restart update با auth پیکربندی‌شده، cleanup وابستگی stale Plugin، fixtureهای Plugin offline، update Plugin، و QA بسته Telegram را در برابر همان tarball resolve شده نگه می‌دارد. Release checkهای مسدودکننده از baseline پیش‌فرض آخرین بسته منتشرشده latest استفاده می‌کنند؛ `run_release_soak=true` یا `release_profile=full` آن را به همه baselineهای stable منتشرشده در npm از `2026.4.23` تا `latest` به‌علاوه fixtureهای issue گزارش‌شده گسترش می‌دهد. برای candidate از پیش shipped شده از Package Acceptance با `source=npm` استفاده کنید، یا پیش از publish برای tarball محلی npm متکی به SHA از `source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native برای بیشتر پوشش بسته/update است که قبلا به Parallels نیاز داشت. Release checkهای میان‌سیستمی همچنان برای onboarding، installer، و رفتار platform وابسته به OS مهم هستند، اما اعتبارسنجی محصول بسته/update باید Package Acceptance را ترجیح دهد.

Checklist canonical برای اعتبارسنجی update و Plugin، [تست updateها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام تصمیم‌گیری درباره اینکه کدام lane محلی، Docker، Package Acceptance، یا release-check یک تغییر نصب/update Plugin، cleanup doctor، یا migration بسته منتشرشده را اثبات می‌کند، از آن استفاده کنید. Migration update منتشرشده کامل از هر بسته stable `2026.4.23+` یک گردش‌کار دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

نرمش قدیمی package-acceptance عمدا به یک بازه زمانی محدود شده است. بسته‌های تا
`2026.4.25` می‌توانند برای شکاف‌های فراداده‌ای که از قبل در npm منتشر شده‌اند
از مسیر سازگاری استفاده کنند: ورودی‌های موجودی QA خصوصی که از tarball جا افتاده‌اند، نبود
`gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود
`update.channel` پایدارشده، مکان‌های قدیمی install-record مربوط به Plugin، نبود پایداری install-record بازارچه، و مهاجرت فراداده پیکربندی هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است
برای فایل‌های stamp فراداده build محلی که از قبل ارسال شده‌اند هشدار بدهد. بسته‌های بعدی
باید قراردادهای مدرن بسته را برآورده کنند؛ همان شکاف‌ها در اعتبارسنجی انتشار شکست می‌خورند.

وقتی پرسش انتشار درباره یک بسته واقعا قابل‌نصب است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/agent، شبکه Gateway، و بارگذاری دوباره پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی دوباره/بسته Plugin بدون ClawHub زنده؛ این پیش‌فرض release-check است
- `product`: `package` به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: قطعه‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram در package-candidate، در Package Acceptance مقدار `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را فعال کنید. workflow مقدار
`package-under-test` tarball حل‌شده را به مسیر Telegram می‌دهد؛ workflow مستقل
Telegram همچنان برای بررسی‌های پس از انتشار یک مشخصه npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` نقطه ورود عادی انتشار تغییردهنده است. این workflowهای trusted-publisher را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. tag انتشار را checkout می‌کند و SHA commit آن را حل می‌کند.
2. بررسی می‌کند tag از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا می‌کند.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch می‌کند.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch می‌کند.
6. `OpenClaw NPM Release` را با tag انتشار، npm dist-tag، و
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

از workflowهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کارهای تعمیر یا انتشار دوباره متمرکز استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
workflow فرزند را مستقیم dispatch کنید.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار اجباری مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط‌اعتبارسنجی
  می‌تواند SHA کامل ۴۰ کاراکتری commit شاخه workflow فعلی هم باشد
- `preflight_only`: مقدار `true` فقط برای اعتبارسنجی/build/package، مقدار `false` برای
  مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی اجباری است تا workflow از
  tarball آماده‌شده از اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: tag مقصد npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `tag`: tag انتشار اجباری؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد اجباری است
- `npm_dist_tag`: tag مقصد npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ فقط برای کار تعمیر متمرکز
  از `selected` استفاده کنید
- `plugins`: نام بسته‌های `@openclaw/*` جداشده با کاما وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی workflow را به‌عنوان هماهنگ‌کننده تعمیر فقط-Plugin استفاده می‌کنید، آن را `false` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط اپراتور را می‌پذیرد:

- `ref`: شاخه، tag، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند commit حل‌شده از یک شاخه OpenClaw یا tag انتشار قابل دسترسی باشد.
- `run_release_soak`: فعال‌سازی soak کامل live/E2E، مسیر انتشار Docker، و
  upgrade-survivor برای همه نسخه‌های از آن زمان در بررسی‌های انتشار پایدار/پیش‌فرض. با
  `release_profile=full` اجباری می‌شود.

قواعد:

- tagهای پایدار و اصلاحی می‌توانند روی `beta` یا `latest` منتشر شوند
- tagهای prerelease بتا فقط می‌توانند روی `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛
  workflow پیش از ادامه انتشار، آن فراداده را بررسی می‌کند

## توالی انتشار npm پایدار

هنگام ساخت یک انتشار npm پایدار:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود tag، می‌توانید از SHA کامل commit شاخه workflow فعلی
     برای dry run فقط‌اعتبارسنجی workflow preflight استفاده کنید
2. برای جریان عادی اول-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط وقتی عمدا
   انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی می‌خواهید CI عادی به‌همراه پوشش cache prompt زنده، Docker، QA Lab،
   Matrix، و Telegram از یک workflow دستی اجرا شود، `Full Release Validation` را روی شاخه انتشار، tag انتشار، یا SHA کامل commit اجرا کنید
4. اگر عمدا فقط به گراف آزمون عادی قطعی نیاز دارید، workflow دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این workflow پیش از ارتقای بسته npm OpenClaw،
   Pluginهای خارجی‌شده را در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` قرار گرفت، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   استفاده کنید تا آن نسخه پایدار را از `beta` به `latest` ارتقا دهید
8. اگر انتشار عمدا مستقیم روی `latest` منتشر شد و `beta`
   باید بی‌درنگ همان build پایدار را دنبال کند، از همان workflow خصوصی
   استفاده کنید تا هر دو dist-tag را به نسخه پایدار اشاره دهید، یا اجازه دهید sync خودترمیم‌گر زمان‌بندی‌شده آن بعدا `beta` را جابه‌جا کند

تغییر dist-tag به‌دلایل امنیتی در repo خصوصی قرار دارد، چون همچنان به
`NPM_TOKEN` نیاز دارد، درحالی‌که repo عمومی انتشار فقط-OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای اول-بتا را مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر maintainer مجبور شود به احراز هویت محلی npm برگردد، هر فرمان 1Password
CLI (`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را
مستقیما از shell اصلی agent فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و مدیریت OTP قابل مشاهده بمانند و از هشدارهای مکرر میزبان جلوگیری شود.

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

maintainerها از docs خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
برای runbook واقعی استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
