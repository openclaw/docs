---
read_when:
    - در حال جست‌وجوی تعاریف کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و تناوب انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه، و آهنگ انتشار
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-01T11:51:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌گذاری‌شده که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صریحاً درخواست شود در npm با `latest`
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
- `latest` یعنی انتشار پایدار فعلی npm که ترفیع داده شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صریحاً `latest` را هدف بگیرند، یا بعداً یک ساخت بتای ارزیابی‌شده را ترفیع دهند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم ارائه می‌کند؛
  انتشارهای بتا معمولاً ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/notarize برنامه mac برای انتشار پایدار نگه داشته می‌شود مگر اینکه صریحاً درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخه `release/YYYY.M.D` که از
  `main` فعلی ساخته شده است انجام می‌دهند، تا اعتبارسنجی و اصلاحات انتشار
  توسعه جدید روی `main` را مسدود نکند
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازساختن برچسب بتای قدیمی، برچسب بعدی `-beta.N` را ایجاد می‌کنند
- رویه دقیق انتشار، تأییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، notarization، بازیابی dist-tag، و جزئیات بازگردانی اضطراری در
راهنمای اجرای انتشار مخصوص نگه‌دارندگان باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین نسخه را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه گرفت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، مدخل‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و پیش از شاخه‌گیری
   یک‌بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را فقط زمانی حذف کنید
   که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمداً حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیماً روی `main` انجام ندهید.
5. همه مکان‌های نسخه لازم را برای برچسب موردنظر افزایش دهید، سپس
   پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری از شاخه انتشار برای پیش‌پرواز فقط-اعتبارسنجی مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این همان نقطه ورود دستی واحد
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، job گردش‌کار، پروفایل package، provider، یا فهرست مجاز مدل شکست‌خورده را که
   اصلاح را ثابت می‌کند دوباره اجرا کنید. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، با dist-tag npm به نام `beta` منتشر کنید، سپس
   پذیرش package پس از انتشار را روی package منتشرشده `openclaw@YYYY.M.D-beta.N`
   یا `openclaw@beta` اجرا کنید. اگر یک بتای push یا منتشرشده به اصلاح نیاز داشت،
   `-beta.N` بعدی را بسازید؛ بتای قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتای ارزیابی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشت ادامه دهید. انتشار پایدار npm از آرتیفکت موفق
    پیش‌پرواز از طریق `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS
    همچنین به `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و
    `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدگر پس از انتشار npm، E2E اختیاری Telegram با npm منتشرشده standalone
    هنگامی که به شواهد کانال پس از انتشار نیاز دارید،
    ترفیع dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و منطبق `CHANGELOG.md`، و مراحل اعلان انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها بیرون از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری بیرون از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های مورد انتظار انتشار در `dist/*` و بسته Control UI برای مرحله اعتبارسنجی بسته وجود داشته باشند
- پیش از تایید انتشار، گردش‌کار دستی `Full Release Validation` را اجرا کنید تا همه جعبه‌های تست پیش از انتشار از یک نقطه ورود آغاز شوند. این گردش‌کار یک شاخه، تگ، یا SHA کامل commit می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. `npm_telegram_package_spec` را فقط پس از انتشار یک بسته ارائه کنید و زمانی که E2E پس از انتشار Telegram نیز باید اجرا شود. وقتی گزارش خصوصی شواهد باید ثابت کند که اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون اینکه Telegram E2E را اجباری کند، `evidence_package_spec` را ارائه کنید. مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- وقتی می‌خواهید برای یک نامزد بسته در حالی که کار انتشار ادامه دارد، گواهی side-channel داشته باشید، گردش‌کار دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار از `source=npm` استفاده کنید؛ برای بسته‌بندی یک شاخه/تگ/SHA قابل اعتماد `package_ref` با هارنس فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball مبتنی بر HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط یک اجرای دیگر GitHub Actions از `source=artifact` استفاده کنید. گردش‌کار، نامزد را به `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند QA مربوط به Telegram را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی مسیرهای Docker انتخاب‌شده شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده را انتخاب می‌کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: مسیرهای نصب/کانال/عامل، شبکه Gateway، و بارگذاری مجدد پیکربندی
  - `package`: مسیرهای بسته/به‌روزرسانی/Plugin مبتنی بر آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل بسته به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker همراه با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای دوباره متمرکز
- وقتی فقط به پوشش کامل CI معمولی برای نامزد انتشار نیاز دارید، گردش‌کار دستی `CI` را مستقیما اجرا کنید. dispatchهای دستی CI از scoping تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Pluginهای بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، Android، و مسیرهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP اجرا می‌کند و نام spanهای trace صادرشده، attributeهای محدودشده، و redact شدن محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا گردآورنده خارجی دیگر بررسی می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- بررسی‌های انتشار اکنون در یک گردش‌کار دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، گیت هم‌ارزی mock مربوط به QA Lab را به‌همراه پروفایل سریع Matrix زنده و مسیر QA مربوط به Telegram اجرا می‌کند. مسیرهای زنده از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از اجاره‌های credential مربوط به Convex CI استفاده می‌کند. وقتی می‌خواهید موجودی کامل انتقال Matrix، رسانه، و E2EE به‌صورت موازی اجرا شود، گردش‌کار دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای cross-OS بخشی از `OpenClaw Release Checks` و `Full Release Validation` عمومی است که گردش‌کار قابل استفاده مجدد `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیما فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه، قطعی، و متمرکز بر آرتیفکت نگه دارید، در حالی که بررسی‌های زنده کندتر در مسیر خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق گردش‌کار و secretها تحت کنترل بمانند
- `OpenClaw Release Checks` یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolveشده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد
- پیش‌پرواز فقط-اعتبارسنجی `OpenClaw NPM Release` همچنین SHA کامل ۴۰ کاراکتری commit شاخه گردش‌کار فعلی را بدون نیاز به تگ pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا داده شود
- در حالت SHA، گردش‌کار فقط برای بررسی metadata بسته، `v<package.json version>` را به‌صورت مصنوعی می‌سازد؛ انتشار واقعی همچنان به یک تگ انتشار واقعی نیاز دارد
- هر دو گردش‌کار مسیر واقعی انتشار و ترفیع را روی runnerهای میزبانی‌شده GitHub نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون mutation می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن گردش‌کار
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای گردش‌کار `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر مسیر جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از تایید، `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا تگ beta/correction متناظر) را اجرا کنید
- پس از انتشار npm،
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه beta/correction متناظر) را اجرا کنید تا مسیر نصب registry منتشرشده در یک prefix موقت تازه تایید شود
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و E2E واقعی Telegram در برابر بسته npm منتشرشده با استفاده از pool اشتراکی credentialهای اجاره‌ای Telegram تایید شود. اجراهای موردی محلی نگهدارندگان می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیما پاس دهند.
- نگهدارندگان می‌توانند همین بررسی پس از انتشار را از GitHub Actions از طریق گردش‌کار دستی `NPM Telegram Beta E2E` اجرا کنند. این گردش‌کار عمدا فقط دستی است و در هر merge اجرا نمی‌شود.
- خودکارسازی انتشار نگهدارندگان اکنون از الگوی پیش‌پرواز-سپس-ترفیع استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm را گذرانده باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا `release/YYYY.M.D` که اجرای پیش‌پرواز موفق از آن بوده dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` هستند
  - انتشار پایدار npm می‌تواند از طریق ورودی گردش‌کار صراحتا `latest` را هدف بگیرد
  - mutation مبتنی بر token برای npm dist-tag اکنون در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد، در حالی که repo عمومی انتشار فقط-OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط-اعتبارسنجی است؛ وقتی یک تگ فقط روی شاخه انتشار وجود دارد اما گردش‌کار از `main` dispatch می‌شود، `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را گذرانده باشد
  - مسیرهای انتشار واقعی، آرتیفکت‌های آماده‌شده را ترفیع می‌دهند، نه اینکه دوباره آن‌ها را بسازند
- برای انتشارهای اصلاحی پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا اصلاحات انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail-closed شکست می‌خورد مگر اینکه tarball هم `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` را شامل شود، تا دوباره dashboard مرورگر خالی منتشر نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که نصب registry منتشرشده شامل dependencyهای runtime غیرخالی Pluginهای بسته‌بندی‌شده زیر layout ریشه `dist/*` باشد. انتشاری که با payloadهای dependency مفقود یا خالی برای Pluginهای بسته‌بندی‌شده منتشر شود، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` ترفیع داده شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` بسته npm را روی tarball به‌روزرسانی نامزد enforce می‌کند، تا installer e2e تورم ناخواسته بسته را پیش از مسیر انتشار release تشخیص دهد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا ماتریس‌های تست extension دست زده باشد، پیش از تایید، خروجی‌های ماتریس `plugin-prerelease-extension-shard` مالک برنامه‌ریز را از `.github/workflows/plugin-prerelease.yml` دوباره تولید و بازبینی کنید تا یادداشت‌های انتشار layout قدیمی CI را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطوح updater است:
  - release مربوط به GitHub باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - پس از انتشار، `appcast.xml` روی `main` باید به zip پایدار جدید اشاره کند
  - اپ بسته‌بندی‌شده باید یک bundle id غیر-debug، یک URL غیرخالی Sparkle feed، و یک `CFBundleVersion` برابر یا بالاتر از کف canonical build مربوط به Sparkle برای آن نسخه انتشار را نگه دارد

## جعبه‌های تست انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. آن را از workflow ref قابل اعتماد `main` اجرا کنید و شاخه
انتشار، تگ، یا SHA کامل commit را به‌عنوان `ref` پاس دهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این گردش‌کار target ref را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، و
در صورت تنظیم بودن `npm_telegram_package_spec`، E2E مستقل پس از انتشار Telegram را به‌صورت اختیاری dispatch می‌کند. سپس `OpenClaw Release Checks`، install smoke، بررسی‌های انتشار cross-OS، پوشش live/E2E Docker release-path، Package Acceptance همراه با QA بسته Telegram، هم‌ارزی QA Lab، Matrix زنده، و Telegram زنده را fan out می‌کند. یک اجرای کامل فقط زمانی قابل قبول است که خلاصه `Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد، و هر child اختیاری
`npm_telegram` یا موفق باشد یا عمدا skip شده باشد. خلاصه نهایی verifier شامل جدول‌های کندترین job برای هر اجرای child است، تا مدیر انتشار بتواند مسیر بحرانی فعلی را بدون دانلود logها ببیند.
برای ماتریس کامل stage، نام‌های دقیق jobهای گردش‌کار، تفاوت‌های پروفایل stable در برابر full، آرتیفکت‌ها، و handleهای اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.
گردش‌کارهای child از ref قابل اعتمادی dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی زمانی که target `ref` به یک شاخه انتشار یا تگ قدیمی‌تر اشاره می‌کند. ورودی workflow-ref جداگانه‌ای برای Full Release Validation وجود ندارد؛ هارنس قابل اعتماد را با انتخاب ref اجرای گردش‌کار انتخاب کنید.

برای انتخاب گستره live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر زنده و Docker حیاتی برای انتشار OpenAI/core
- `stable`: minimum به‌علاوه پوشش پایدار provider/backend برای تایید انتشار
- `full`: stable به‌علاوه پوشش گسترده advisory provider/media

`OpenClaw Release Checks` از ref گردش‌کار قابل‌اعتماد استفاده می‌کند تا ref هدف را یک‌بار به‌عنوان `release-package-under-test` resolve کند و همان artifact را هم در بررسی‌های Docker مسیر انتشار و هم در Package Acceptance دوباره به‌کار ببرد. این کار همه boxهای مرتبط با package را روی همان bytes نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
smoke نصب OpenAI میان‌سیستمی وقتی متغیر repo/org تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4-mini`، چون این lane نصب package، onboarding، راه‌اندازی Gateway، و یک نوبت agent زنده را اثبات می‌کند، نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر providerهای زنده همچنان محل پوشش ویژه مدل‌هاست.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

پس از یک fix متمرکز، از چتر کامل به‌عنوان نخستین rerun استفاده نکنید. اگر یک box شکست بخورد، برای اثبات بعدی از child workflow، job، lane مربوط به Docker، profile مربوط به package، provider مدل، یا lane مربوط به QA که شکست خورده استفاده کنید. چتر کامل را فقط زمانی دوباره اجرا کنید که fix orchestration مشترک انتشار را تغییر داده باشد یا شواهد قبلی همه boxها را کهنه کرده باشد. verifier نهایی چتر، شناسه‌های ثبت‌شده اجرای child workflow را دوباره بررسی می‌کند؛ بنابراین پس از اینکه یک child workflow با موفقیت rerun شد، فقط job والد شکست‌خورده `Verify full validation` را rerun کنید.

برای بازیابی محدود، `rerun_group` را به چتر پاس بدهید. `all` اجرای واقعی release-candidate است، `ci` فقط child معمول CI را اجرا می‌کند، `plugin-prerelease` فقط child ویژه انتشار Plugin را اجرا می‌کند، `release-checks` همه boxهای انتشار را اجرا می‌کند، و گروه‌های محدودتر انتشار عبارت‌اند از `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram` وقتی lane مستقل package Telegram ارائه شده باشد.

### Vitest

box مربوط به Vitest همان child workflow دستی `CI` است. CI دستی عمدا scoped کردن تغییرات را دور می‌زند و گراف تست معمول را برای release candidate اجباری می‌کند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و i18n مربوط به Control UI.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree کل test suite عادی را گذراند؟» این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` dispatchشده را نشان می‌دهد
- اجرای سبز `CI` روی SHA دقیق هدف
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی یک اجرا به تحلیل عملکرد نیاز دارد

CI دستی را فقط زمانی مستقیم اجرا کنید که انتشار به CI عادی قطعی نیاز دارد اما نه boxهای Docker، QA Lab، زنده، میان‌سیستمی، یا package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق `openclaw-live-and-e2e-checks-reusable.yml` قرار دارد، به‌علاوه workflow `install-smoke` در حالت انتشار. این box release candidate را از طریق محیط‌های Docker packageشده اعتبارسنجی می‌کند، نه فقط تست‌های سطح source.

پوشش Docker انتشار شامل این موارد است:

- smoke نصب کامل با smoke نصب global کند Bun فعال‌شده
- آماده‌سازی/استفاده دوباره از image مربوط به smoke در Dockerfile ریشه بر اساس SHA هدف، با jobهای QR، root/gateway، و installer/Bun smoke که به‌عنوان shardهای جداگانه install-smoke اجرا می‌شوند
- laneهای E2E مخزن
- chunkهای Docker مسیر انتشار: `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a`، `plugins-runtime-install-b`، `plugins-runtime-install-c`، `plugins-runtime-install-d`، `plugins-runtime-install-e`، `plugins-runtime-install-f`، `plugins-runtime-install-g`، `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b`، و `bundled-channels-contracts`
- پوشش OpenWebUI داخل chunk `plugins-runtime-services` هنگام درخواست
- تقسیم laneهای وابستگی bundled-channel در chunkهای channel-smoke، update-target، و قرارداد setup/runtime به‌جای یک job بزرگ bundled-channel
- تقسیم laneهای نصب/حذف نصب Plugin همراه از `bundled-plugin-install-uninstall-0` تا `bundled-plugin-install-uninstall-23`
- suiteهای provider زنده/E2E و پوشش مدل زنده Docker وقتی release checks شامل suiteهای زنده باشد

پیش از rerun کردن از artifactهای Docker استفاده کنید. scheduler مسیر انتشار `.artifacts/docker-tests/` را با logهای lane، `summary.json`، `failures.json`، زمان‌بندی phaseها، JSON برنامه scheduler، و دستورهای rerun upload می‌کند. برای بازیابی متمرکز، به‌جای rerun کردن همه chunkهای انتشار، از `docker_lanes=<lane[,lane]>` روی workflow زنده/E2E قابل‌استفاده مجدد استفاده کنید. دستورهای rerun تولیدشده، وقتی موجود باشند، `package_artifact_run_id` قبلی و ورودی‌های image آماده Docker را شامل می‌شوند، بنابراین یک lane شکست‌خورده می‌تواند همان tarball و imageهای GHCR را دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic و سطح channel برای انتشار است و از مکانیک‌های package در Vitest و Docker جداست.

پوشش QA Lab انتشار شامل این موارد است:

- gate برابری mock که lane کاندید OpenAI را با baseline مربوط به Opus 4.6 با استفاده از بسته برابری agentic مقایسه می‌کند
- profile سریع Matrix QA زنده با استفاده از محیط `qa-live-shared`
- lane زنده Telegram QA با استفاده از اجاره credentialهای Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry انتشار به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و جریان‌های channel زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URLهای artifact مربوط به laneهای parity، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌صورت اجرای دستی sharded QA-Lab در دسترس است، نه به‌عنوان lane پیش‌فرض حیاتی برای انتشار.

### Package

box مربوط به Package همان gate محصول قابل‌نصب است. این box با `Package Acceptance` و resolver یعنی `scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک کاندید را به tarball `package-under-test` مصرف‌شده توسط Docker E2E normalize می‌کند، inventory package را اعتبارسنجی می‌کند، نسخه package و SHA-256 را ثبت می‌کند، و ref مربوط به harness workflow را از ref مربوط به source package جدا نگه می‌دارد.

منابع کاندید پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: pack کردن یک branch، tag، یا SHA کامل commit از `package_ref` قابل‌اعتماد با harness انتخاب‌شده `workflow_ref`
- `source=url`: دانلود یک `.tgz` از HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده دوباره از یک `.tgz` که توسط اجرای دیگری از GitHub Actions upload شده است

`OpenClaw Release Checks`، Package Acceptance را با `source=ref`، `package_ref=<release-ref>`، `suite_profile=custom`، `docker_lanes=bundled-channel-deps-compat plugins-offline`، و `telegram_mode=mock-openai` اجرا می‌کند. chunkهای Docker مسیر انتشار laneهای همپوشان install، update، و plugin-update را پوشش می‌دهند؛ Package Acceptance سازگاری bundled-channel مبتنی بر artifact، fixtureهای Plugin آفلاین، و Telegram package QA را در برابر همان tarball resolveشده نگه می‌دارد. این جایگزین GitHub-native برای بیشتر پوشش package/update است که قبلا به Parallels نیاز داشت. بررسی‌های انتشار میان‌سیستمی همچنان برای onboarding ویژه OS، installer، و رفتار platform مهم‌اند، اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

مدارا در package-acceptance legacy عمدا محدود به بازه زمانی مشخص است. packageها تا `2026.4.25` می‌توانند برای gapهای metadata که از قبل در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند: entryهای inventory خصوصی QA که در tarball وجود ندارند، نبود `gateway install --wrapper`، نبود patch fileها در fixture git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و migration metadata پیکربندی هنگام `plugins update`. package منتشرشده `2026.4.26` ممکن است برای fileهای stamp مربوط به metadata build محلی که از قبل shipped شده‌اند هشدار بدهد. packageهای بعدی باید قراردادهای مدرن package را برآورده کنند؛ همان gapها باعث شکست اعتبارسنجی انتشار می‌شوند.

وقتی پرسش انتشار درباره یک package واقعا قابل‌نصب است، از profileهای گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

profileهای رایج package:

- `smoke`: laneهای سریع نصب package/channel/agent، شبکه Gateway، و reload پیکربندی
- `package`: قراردادهای install/update/plugin package بدون ClawHub زنده؛ این پیش‌فرض release-check است
- `product`: `package` به‌علاوه channelهای MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: chunkهای مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای rerunهای متمرکز

برای اثبات Telegram مربوط به package-candidate، `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` را روی Package Acceptance فعال کنید. workflow، tarball resolveشده `package-under-test` را به lane مربوط به Telegram پاس می‌دهد؛ workflow مستقل Telegram همچنان برای بررسی‌های پس از انتشار، یک spec منتشرشده npm را می‌پذیرد.

## ورودی‌های workflow مربوط به NPM

`OpenClaw NPM Release` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `tag`: tag انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط اعتبارسنجی، می‌تواند SHA کامل 40 کاراکتری commit فعلی branch workflow نیز باشد
- `preflight_only`: `true` فقط برای validation/build/package، `false` برای مسیر publish واقعی
- `preflight_run_id`: در مسیر publish واقعی الزامی است تا workflow از tarball آماده‌شده در اجرای preflight موفق دوباره استفاده کند
- `npm_dist_tag`: tag هدف npm برای مسیر publish؛ پیش‌فرض آن `beta` است

`OpenClaw Release Checks` این ورودی‌های کنترل‌شده توسط operator را می‌پذیرد:

- `ref`: branch، tag، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret نیاز دارند commit resolveشده از یک branch یا tag انتشار OpenClaw قابل‌دسترسی باشد.

قواعد:

- tagهای stable و correction می‌توانند یا به `beta` یا به `latest` publish شوند
- tagهای prerelease بتا فقط می‌توانند به `beta` publish شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط برای اعتبارسنجی هستند
- مسیر publish واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛ workflow پیش از ادامه publish، آن metadata را verify می‌کند

## توالی انتشار stable npm

هنگام ساختن یک انتشار stable npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از آن‌که برچسبی وجود داشته باشد، می‌توانید از SHA کامل commit فعلی شاخهٔ workflow
     برای یک اجرای آزمایشیِ فقط اعتبارسنجی از workflow پیش‌پرواز استفاده کنید
2. برای جریان عادیِ ابتدا بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط زمانی `latest` را انتخاب کنید
   که عمداً انتشار پایدار مستقیم می‌خواهید
3. وقتی می‌خواهید CI عادی به‌همراه پوشش live prompt cache، Docker، QA Lab،
   Matrix و Telegram را از یک workflow دستی داشته باشید، `Full Release Validation` را روی شاخهٔ انتشار، برچسب انتشار، یا SHA کامل
   commit اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادیِ قطعی نیاز دارید، به‌جای آن workflow دستی `CI` را روی مرجع انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw NPM Release` را دوباره با `preflight_only=false`، همان
   `tag`، همان `npm_dist_tag`، و `preflight_run_id` ذخیره‌شده اجرا کنید
7. اگر انتشار روی `beta` نشست، از workflow خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   استفاده کنید تا آن نسخهٔ پایدار را از `beta` به `latest` ارتقا دهید
8. اگر انتشار عمداً مستقیماً روی `latest` منتشر شده و `beta`
   باید بلافاصله همان build پایدار را دنبال کند، از همان workflow خصوصی
   استفاده کنید تا هر دو dist-tag به نسخهٔ پایدار اشاره کنند، یا بگذارید همگام‌سازی زمان‌بندی‌شدهٔ خودترمیم‌گر آن، `beta` را بعداً جابه‌جا کند

جهش dist-tag به‌دلایل امنیتی در مخزن خصوصی قرار دارد، چون هنوز
به `NPM_TOKEN` نیاز دارد، درحالی‌که مخزن عمومی انتشار فقط مبتنی بر OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای ابتدا بتا را
مستندسازی‌شده و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شود به احراز هویت محلی npm برگردد، هر فرمان CLI مربوط به 1Password
(`op`) را فقط داخل یک نشست tmux اختصاصی اجرا کنید. `op` را
مستقیماً از shell عامل اصلی فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود اعلان‌ها،
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

نگه‌دارندگان برای runbook واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
