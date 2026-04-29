---
read_when:
    - در حال جست‌وجوی تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه و آهنگ انتشار
summary: مسیرهای انتشار، چک‌لیست اپراتور، جعبه‌های اعتبارسنجی، نام‌گذاری نسخه، و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-04-29T23:31:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- پایدار: انتشارهای برچسب‌خورده‌ای که به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند، یا وقتی صراحتاً درخواست شود در npm با `latest` منتشر می‌شوند
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
- `latest` یعنی انتشار پایدار فعلی npm که ارتقا داده شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm با `beta` منتشر می‌شوند؛ متصدیان انتشار می‌توانند صراحتاً `latest` را هدف بگیرند، یا یک ساخت بتای بررسی‌شده را بعداً ارتقا دهند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولاً ابتدا مسیر npm/بسته را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضرسازی برنامه mac برای پایدار نگه داشته می‌شود، مگر اینکه صراحتاً درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخه `release/YYYY.M.D` می‌برند که
  از `main` فعلی ساخته شده است، تا اعتبارسنجی انتشار و اصلاحات مانع توسعه
  جدید روی `main` نشوند
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازسازی برچسب بتای قدیمی، برچسب بعدی `-beta.N` را می‌برند
- روند تفصیلی انتشار، تأییدها، اعتبارنامه‌ها، و یادداشت‌های بازیابی
  فقط ویژه نگه‌دارندگان است

## چک‌لیست متصدی انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضرسازی، بازیابی dist-tag، و جزئیات بازگردانی اضطراری در
دفترچه اجرای انتشار ویژه نگه‌دارندگان می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   پیش از شاخه‌سازی یک بار دیگر rebase/pull کنید.
3. رکوردهای سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بازبینی کنید. سازگاری منقضی‌شده را
   فقط وقتی حذف کنید که مسیر ارتقا همچنان پوشش داشته باشد، یا ثبت کنید چرا عمداً
   حفظ شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار عادی انتشار را
   مستقیماً روی `main` انجام ندهید.
5. هر محل نسخه لازم را برای برچسب موردنظر افزایش دهید، سپس پیش‌پرواز
   قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   برای پیش‌پرواز فقط جهت اعتبارسنجی، SHA کامل ۴۰کاراکتری شاخه انتشار مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه آزمون بزرگ انتشار است: Vitest، Docker، QA Lab، و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، کار workflow، پروفایل بسته، provider، یا allowlist مدل شکست‌خورده‌ای را دوباره اجرا کنید که
   اصلاح را اثبات می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییرکرده
   شواهد قبلی را کهنه کند.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، با dist-tag npm برابر `beta` منتشر کنید، سپس
   پذیرش بسته پس از انتشار را در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N`
   یا `openclaw@beta` اجرا کنید. اگر بتای push یا منتشرشده به اصلاح نیاز داشت،
   `-beta.N` بعدی را ببرید؛ بتای قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از آن ادامه دهید که بتای بررسی‌شده یا نامزد انتشار
    شواهد اعتبارسنجی لازم را داشته باشد. انتشار پایدار npm از آرتیفکت
    پیش‌پرواز موفق از طریق `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS
    همچنین به `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده، و
    `appcast.xml` به‌روزشده روی `main` نیاز دارد.
11. پس از انتشار، تأییدگر پس از انتشار npm، E2E اختیاری Telegram
    برای npm منتشرشده مستقل وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ارتقای dist-tag در صورت نیاز، یادداشت‌های انتشار/پیش‌انتشار GitHub از
    بخش کامل و منطبق `CHANGELOG.md`، و گام‌های اعلام انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از preflight انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها بیرون از gate سریع‌تر محلی `pnpm check` نیز
  پوشش داده شود
- پیش از preflight انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import
  و مرزهای معماری بیرون از gate سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، `pnpm build && pnpm ui:build` را اجرا کنید تا artifactهای انتشار مورد انتظار
  `dist/*` و bundle مربوط به Control UI برای مرحله اعتبارسنجی pack
  وجود داشته باشند
- پیش از تأیید انتشار، workflow دستی `Full Release Validation` را اجرا کنید تا
  همه test boxهای پیش از انتشار از یک entrypoint آغاز شوند. این workflow یک branch،
  tag، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و
  `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، suiteهای مسیر انتشار Docker،
  live/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix، و laneهای Telegram
  dispatch می‌کند. `npm_telegram_package_spec` را فقط پس از انتشار یک package
  ارائه کنید و زمانی که E2E پس از انتشار Telegram نیز باید اجرا شود. وقتی private evidence report باید ثابت کند که
  اعتبارسنجی با یک package منتشرشده npm مطابقت دارد، بدون اینکه Telegram E2E را اجباری کند،
  `evidence_package_spec` را ارائه کنید.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- workflow دستی `Package Acceptance` را زمانی اجرا کنید که می‌خواهید در حین ادامه کار انتشار،
  برای یک package candidate proof از side-channel داشته باشید. برای
  `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ از `source=ref`
  برای pack کردن یک branch/tag/SHA معتبر `package_ref` با harness فعلی
  `workflow_ref` استفاده کنید؛ از `source=url` برای یک tarball HTTPS با SHA-256 الزامی
  استفاده کنید؛ یا از `source=artifact` برای tarball بارگذاری‌شده توسط یک run دیگر GitHub
  Actions استفاده کنید. این workflow candidate را به
  `package-under-test` resolve می‌کند، release scheduler مربوط به Docker E2E را در برابر همان
  tarball بازاستفاده می‌کند، و می‌تواند QA مربوط به Telegram را در برابر همان tarball با
  `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` اجرا کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  profileهای رایج:
  - `smoke`: laneهای install/channel/agent، شبکه Gateway، و reload پیکربندی
  - `package`: laneهای package/update/plugin بومی artifact، بدون OpenWebUI یا ClawHub زنده
  - `product`: profile مربوط به package به‌علاوه channelهای MCP، پاک‌سازی cron/subagent،
    جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: chunkهای مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای rerun متمرکز
- workflow دستی `CI` را مستقیماً زمانی اجرا کنید که فقط به پوشش کامل CI معمولی
  برای release candidate نیاز دارید. dispatchهای CI دستی، changed scoping را دور می‌زنند
  و shardهای Linux Node، shardهای Pluginهای بسته‌بندی‌شده، قراردادهای channel،
  سازگاری Node 22، `check`، `check-additional`، build smoke،
  بررسی‌های docs، Skills پایتون، Windows، macOS، Android، و laneهای i18n مربوط به Control UI را
  اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی telemetry انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور
  QA-lab را از طریق یک receiver محلی OTLP/HTTP exercise می‌کند و نام spanهای trace صادرشده،
  attributeهای محدود، و redaction محتوا/شناسه را بدون
  نیاز به Opik، Langfuse، یا collector خارجی دیگر تأیید می‌کند.
- پیش از هر انتشار tagشده، `pnpm release:check` را اجرا کنید
- بررسی‌های انتشار اکنون در یک workflow دستی جداگانه اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین gate هم‌ارزی mock مربوط به QA Lab به‌علاوه profile سریع
  Matrix زنده و lane QA مربوط به Telegram را پیش از تأیید انتشار اجرا می‌کند. laneهای زنده
  از environment `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI
  استفاده می‌کند. وقتی موجودی کامل transport، media، و E2EE مربوط به Matrix را
  به‌صورت موازی می‌خواهید، workflow دستی `QA-Lab - All Lanes` را با
  `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی runtime نصب و ارتقای Cross-OS بخشی از
  `OpenClaw Release Checks` و `Full Release Validation` عمومی است، که workflow قابل‌بازاستفاده
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیماً
  فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm را کوتاه،
  deterministic، و متمرکز بر artifact نگه می‌دارد، در حالی که بررسی‌های زنده کندتر در lane خودشان می‌مانند تا
  انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از workflow ref مربوط به `main`/release dispatch شوند تا منطق workflow و
  secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک branch، tag، یا SHA کامل commit را می‌پذیرد، به شرطی
  که commit resolveشده از یک branch یا release tag مربوط به OpenClaw قابل دسترسی باشد
- preflight فقط-اعتبارسنجی `OpenClaw NPM Release` همچنین SHA کامل ۴۰کاراکتری commit مربوط به workflow-branch فعلی
  را بدون نیاز به tag pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به publish واقعی ارتقا داده شود
- در حالت SHA، workflow فقط برای بررسی metadata بسته، `v<package.json version>` را
  synthesize می‌کند؛ publish واقعی همچنان به release tag واقعی نیاز دارد
- هر دو workflow مسیر publish و promotion واقعی را روی runnerهای GitHub-hosted
  نگه می‌دارند، در حالی که مسیر اعتبارسنجی غیرتغییردهنده می‌تواند از runnerهای بزرگ‌تر
  Blacksmith Linux استفاده کند
- آن workflow دستور
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از هر دو secret workflow یعنی `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- preflight انتشار npm دیگر منتظر lane جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از تأیید، دستور `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (یا tag متناظر beta/correction) را اجرا کنید
- پس از publish در npm، دستور
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (یا نسخه متناظر beta/correction) را اجرا کنید تا مسیر install registry منتشرشده را
  در یک temp prefix تازه تأیید کند
- پس از publish بتا، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، setup مربوط به Telegram، و E2E واقعی Telegram
  را در برابر package منتشرشده npm با استفاده از pool مشترک credentialهای leased مربوط به Telegram
  تأیید کنید. اجرای one-off محلی maintainerها می‌تواند متغیرهای Convex را حذف کند و سه
  credential env با نام `OPENCLAW_QA_TELEGRAM_*` را مستقیماً pass کند.
- Maintainerها می‌توانند همان بررسی post-publish را از GitHub Actions از طریق
  workflow دستی `NPM Telegram Beta E2E` اجرا کنند. این workflow عمداً فقط دستی است و
  در هر merge اجرا نمی‌شود.
- automation انتشار maintainer اکنون از preflight-then-promote استفاده می‌کند:
  - publish واقعی npm باید یک `preflight_run_id` موفق npm را pass کرده باشد
  - publish واقعی npm باید از همان branch `main` یا
    `release/YYYY.M.D` که run موفق preflight از آن بوده dispatch شود
  - انتشارهای stable npm به‌صورت پیش‌فرض روی `beta` قرار می‌گیرند
  - publish stable npm می‌تواند به‌صورت صریح از طریق ورودی workflow، `latest` را هدف بگیرد
  - mutation مبتنی بر token مربوط به npm dist-tag اکنون در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد تا امنیت حفظ شود، چون `npm dist-tag add` هنوز به `NPM_TOKEN` نیاز دارد در حالی که
    repo عمومی publish فقط با OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط-اعتبارسنجی است
  - publish واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را
    pass کرده باشد
  - مسیرهای publish واقعی artifactهای آماده‌شده را promote می‌کنند، به‌جای اینکه
    دوباره آن‌ها را rebuild کنند
- برای انتشارهای correction stable مانند `YYYY.M.D-N`، verifier پس از publish
  همان مسیر ارتقای temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را نیز بررسی می‌کند
  تا correctionهای انتشار نتوانند به‌صورت خاموش installهای global قدیمی‌تر را روی
  payload stable پایه باقی بگذارند
- preflight انتشار npm fail-closed است مگر اینکه tarball هم
  `dist/control-ui/index.html` و هم یک payload غیرخالی `dist/control-ui/assets/` داشته باشد
  تا دوباره یک dashboard مرورگر خالی ship نکنیم
- verification پس از publish همچنین بررسی می‌کند که install registry منتشرشده
  شامل dependencyهای runtime غیرخالی Pluginهای بسته‌بندی‌شده زیر layout ریشه `dist/*`
  باشد. انتشاری که با payloadهای dependency مفقود یا خالی مربوط به Pluginهای بسته‌بندی‌شده
  ship شود، verifier پس از publish را fail می‌کند و نمی‌تواند به
  `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی
  tarball candidate update enforce می‌کند، تا installer e2e bloat تصادفی pack را
  پیش از مسیر publish انتشار catch کند
- اگر کار انتشار CI planning، manifestهای timing مربوط به Plugin، یا
  matrixهای تست Plugin را لمس کرده است، پیش از تأیید، خروجی‌های matrix متعلق به planner با نام
  `plugin-prerelease-extension-shard` را از
  `.github/workflows/plugin-prerelease.yml` دوباره generate و review کنید تا release noteها
  layout قدیمی CI را توصیف نکنند
- آمادگی انتشار stable macOS همچنین شامل سطح‌های updater است:
  - release مربوط به GitHub باید در نهایت `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده را داشته باشد
  - پس از publish، `appcast.xml` روی `main` باید به zip stable جدید اشاره کند
  - app بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle،
    و `CFBundleVersion` برابر یا بالاتر از کف canonical build مربوط به Sparkle
    برای آن نسخه انتشار را نگه دارد

## test boxهای انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از
یک entrypoint آغاز می‌کنند. آن را از workflow ref معتبر `main` اجرا کنید و branch
انتشار، tag، یا SHA کامل commit را به‌عنوان `ref` pass کنید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

این workflow target ref را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، و
در صورت set بودن `npm_telegram_package_spec`، به‌صورت اختیاری E2E مستقل Telegram پس از publish را
dispatch می‌کند. سپس `OpenClaw Release Checks`، install smoke،
بررسی‌های انتشار cross-OS، پوشش live/E2E مربوط به مسیر انتشار Docker،
Package Acceptance با QA بسته Telegram، هم‌ارزی QA Lab، Matrix زنده، و
Telegram زنده را fan out می‌کند. یک run کامل فقط زمانی قابل قبول است که summary مربوط به `Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد، و هر child اختیاری
`npm_telegram` یا موفق باشد یا عمداً skip شده باشد. summary نهایی
verifier شامل جدول‌های slowest-job برای هر child run است، تا release
manager بتواند critical path فعلی را بدون دانلود logها ببیند.
workflowهای child از ref معتبر اجراکننده `Full Release
Validation` dispatch می‌شوند، معمولاً `--ref main`، حتی زمانی که target `ref` به یک
branch یا tag انتشار قدیمی‌تر اشاره می‌کند. ورودی جداگانه workflow-ref برای Full Release Validation
وجود ندارد؛ harness معتبر را با انتخاب ref مربوط به workflow run انتخاب کنید.

برای انتخاب breadth مربوط به live/provider از `release_profile` استفاده کنید:

- `minimum`: سریع‌ترین مسیر release-critical OpenAI/core live و Docker
- `stable`: minimum به‌علاوه پوشش stable provider/backend برای تأیید انتشار
- `full`: stable به‌علاوه پوشش advisory گسترده provider/media

`OpenClaw Release Checks` از workflow ref معتبر استفاده می‌کند تا target
ref را یک‌بار به‌عنوان `release-package-under-test` resolve کند و همان artifact را در هر دو
بررسی Docker مربوط به release-path و Package Acceptance بازاستفاده کند. این کار همه
boxهای مواجه با package را روی همان byteها نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
smoke نصب cross-OS OpenAI وقتی متغیر repo/org set باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند،
و در غیر این صورت از `openai/gpt-5.4-mini`، چون این lane دارد
install بسته، onboarding، startup مربوط به Gateway، و یک turn زنده agent را ثابت می‌کند
نه اینکه کندترین مدل پیش‌فرض را benchmark کند. matrix گسترده‌تر live provider
همچنان محل پوشش model-specific باقی می‌ماند.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

از چتر کامل به‌عنوان اولین اجرای دوباره پس از یک اصلاح متمرکز استفاده نکنید. اگر یک جعبه
ناموفق شد، برای اثبات بعدی از گردش‌کار فرزند ناموفق، کار، مسیر Docker، پروفایل بسته، ارائه‌دهنده
مدل، یا مسیر QA استفاده کنید. چتر کامل را فقط زمانی دوباره اجرا کنید که
اصلاح، هماهنگ‌سازی انتشار مشترک را تغییر داده باشد یا شواهد قبلی همه جعبه‌ها را
کهنه کرده باشد. تأییدکننده نهایی چتر، شناسه‌های اجرای گردش‌کار فرزند ثبت‌شده را
دوباره بررسی می‌کند، بنابراین پس از اینکه یک گردش‌کار فرزند با موفقیت دوباره اجرا شد، فقط کار والد
`Verify full validation` ناموفق را دوباره اجرا کنید.

برای بازیابی محدود، `rerun_group` را به چتر بدهید. `all` اجرای واقعی
نامزد انتشار است، `ci` فقط فرزند CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط فرزند Plugin ویژه انتشار را اجرا می‌کند، `release-checks` همه جعبه‌های انتشار را
اجرا می‌کند، و گروه‌های انتشار محدودتر `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram` هستند، زمانی که
مسیر مستقل بسته Telegram ارائه شده باشد.

### Vitest

جعبه Vitest همان گردش‌کار فرزند دستی `CI` است. CI دستی عمداً
محدوده‌بندی تغییرات را دور می‌زند و گراف آزمون عادی را برای نامزد انتشار
اجباری می‌کند: شاردهای Linux Node، شاردهای Pluginهای همراه، قراردادهای کانال، سازگاری Node 22،
`check`، `check-additional`، دودسنجی ساخت، بررسی‌های مستندات، Python
skills، Windows، macOS، Android، و Control UI i18n.

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا درخت منبع، مجموعه آزمون عادی کامل را گذراند؟»
این با اعتبارسنجی محصول در مسیر انتشار یکسان نیست. شواهدی که باید نگه دارید:

- خلاصه `Full Release Validation` که URL اجرای `CI` ارسال‌شده را نشان می‌دهد
- اجرای `CI` سبز روی SHA هدف دقیق
- نام شاردهای ناموفق یا کند از کارهای CI هنگام بررسی رگرسیون‌ها
- آرتیفکت‌های زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` زمانی که
  یک اجرا به تحلیل کارایی نیاز دارد

CI دستی را مستقیماً فقط زمانی اجرا کنید که انتشار به CI عادی قطعی نیاز دارد اما
به جعبه‌های Docker، QA Lab، زنده، میان‌سیستمی، یا بسته نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

جعبه Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه گردش‌کار
`install-smoke` در حالت انتشار قرار دارد. این جعبه نامزد انتشار را از طریق محیط‌های
Docker بسته‌بندی‌شده اعتبارسنجی می‌کند، نه فقط آزمون‌های سطح منبع.

پوشش Docker انتشار شامل موارد زیر است:

- دودسنجی نصب کامل با دودسنجی نصب سراسری Bun کند فعال
- آماده‌سازی/استفاده مجدد از تصویر دودسنجی Dockerfile ریشه بر اساس SHA هدف، با کارهای QR،
  ریشه/Gateway، و دودسنجی نصب‌کننده/Bun که به‌عنوان شاردهای جداگانه install-smoke اجرا می‌شوند
- مسیرهای E2E مخزن
- تکه‌های Docker مسیر انتشار: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، `plugins-runtime-install-h`،
  `bundled-channels-core`، `bundled-channels-update-a`،
  `bundled-channels-update-discord`، `bundled-channels-update-b`، و
  `bundled-channels-contracts`
- پوشش OpenWebUI داخل تکه `plugins-runtime-services` در صورت درخواست
- مسیرهای وابستگی کانال‌های همراه که بین تکه‌های channel-smoke، update-target،
  و قرارداد setup/runtime تقسیم شده‌اند، به‌جای یک کار بزرگ bundled-channel
- مسیرهای نصب/حذف نصب Plugin همراه که از
  `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23` تقسیم شده‌اند
- مجموعه‌های ارائه‌دهنده live/E2E و پوشش مدل زنده Docker زمانی که بررسی‌های انتشار
  شامل مجموعه‌های زنده باشند

پیش از اجرای دوباره، از آرتیفکت‌های Docker استفاده کنید. زمان‌بند مسیر انتشار
`.artifacts/docker-tests/` را همراه با لاگ‌های مسیر، `summary.json`، `failures.json`،
زمان‌بندی فازها، JSON برنامه زمان‌بند، و فرمان‌های اجرای دوباره بارگذاری می‌کند. برای بازیابی متمرکز،
به‌جای اجرای دوباره همه تکه‌های انتشار، از `docker_lanes=<lane[,lane]>` روی گردش‌کار live/E2E قابل استفاده مجدد
استفاده کنید. فرمان‌های اجرای دوباره تولیدشده، در صورت وجود، شامل
`package_artifact_run_id` قبلی و ورودی‌های تصویر Docker آماده‌شده هستند، تا یک
مسیر ناموفق بتواند از همان tarball و تصاویر GHCR دوباره استفاده کند.

### QA Lab

جعبه QA Lab نیز بخشی از `OpenClaw Release Checks` است. این جعبه دروازه انتشار
رفتار عامل‌محور و سطح کانال است، جدا از سازوکارهای بسته Vitest و Docker.

پوشش QA Lab انتشار شامل موارد زیر است:

- دروازه هم‌ارزی ساختگی که مسیر نامزد OpenAI را با مبنای Opus 4.6
  با استفاده از بسته هم‌ارزی عامل‌محور مقایسه می‌کند
- پروفایل QA سریع و زنده Matrix با استفاده از محیط `qa-live-shared`
- مسیر QA زنده Telegram با استفاده از اجاره‌های اعتبارنامه Convex CI
- `pnpm qa:otel:smoke` زمانی که تله‌متری انتشار به اثبات محلی صریح نیاز دارد

از این جعبه برای پاسخ به این پرسش استفاده کنید: «آیا انتشار در سناریوهای QA و
جریان‌های کانال زنده درست رفتار می‌کند؟» هنگام تأیید انتشار، URL آرتیفکت‌های مسیرهای هم‌ارزی، Matrix، و Telegram
را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی شاردشده QA-Lab
در دسترس است، نه مسیر پیش‌فرض حیاتی برای انتشار.

### بسته

جعبه Package دروازه محصول قابل نصب است. پشتوانه آن
`Package Acceptance` و حل‌کننده
`scripts/resolve-openclaw-package-candidate.mjs` است. حل‌کننده یک نامزد را به
tarball `package-under-test` مصرف‌شده توسط Docker E2E نرمال می‌کند، موجودی
بسته را اعتبارسنجی می‌کند، نسخه بسته و SHA-256 را ثبت می‌کند، و ref هارنس
گردش‌کار را از ref منبع بسته جدا نگه می‌دارد.

منابع نامزد پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw
- `source=ref`: بسته‌بندی یک شاخه، برچسب، یا SHA کامل کامیتِ مورد اعتماد `package_ref`
  با هارنس `workflow_ref` انتخاب‌شده
- `source=url`: دانلود یک `.tgz` HTTPS با `package_sha256` الزامی
- `source=artifact`: استفاده مجدد از یک `.tgz` بارگذاری‌شده توسط اجرای دیگری از GitHub Actions

`OpenClaw Release Checks`، Package Acceptance را با `source=ref`،
`package_ref=<release-ref>`، `suite_profile=custom`،
`docker_lanes=bundled-channel-deps-compat plugins-offline`، و
`telegram_mode=mock-openai` اجرا می‌کند. تکه‌های Docker مسیر انتشار، مسیرهای
همپوشان نصب، به‌روزرسانی، و به‌روزرسانی Plugin را پوشش می‌دهند؛ Package Acceptance
سازگاری کانال‌های همراه آرتیفکت‌محور، فیکسچرهای Plugin آفلاین، و QA بسته Telegram
را در برابر همان tarball حل‌شده نگه می‌دارد. این جایگزین بومی GitHub برای بیشتر
پوشش بسته/به‌روزرسانی است که قبلاً به Parallels نیاز داشت. بررسی‌های انتشار میان‌سیستمی
هنوز برای onboarding، نصب‌کننده، و رفتار پلتفرمی ویژه سیستم‌عامل اهمیت دارند، اما
اعتبارسنجی محصول بسته/به‌روزرسانی باید Package Acceptance را ترجیح دهد.

سهل‌گیری قدیمی package-acceptance عمداً زمان‌دار است. بسته‌ها تا
`2026.4.25` می‌توانند برای شکاف‌های فراداده‌ای که قبلاً در npm منتشر شده‌اند از مسیر سازگاری استفاده کنند:
ورودی‌های موجودی QA خصوصی که در tarball وجود ندارند، نبود
`gateway install --wrapper`، نبود فایل‌های وصله در فیکسچر git مشتق‌شده از tarball،
نبود `update.channel` پایدارشده، محل‌های قدیمی رکورد نصب Plugin،
نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی
هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های مهر فراداده ساخت محلی
که قبلاً ارسال شده‌اند هشدار دهد. بسته‌های بعدی باید قراردادهای مدرن بسته را
برآورده کنند؛ همان شکاف‌ها در اعتبارسنجی انتشار ناموفق می‌شوند.

وقتی پرسش انتشار درباره یک بسته قابل نصب واقعی است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

پروفایل‌های رایج بسته:

- `smoke`: مسیرهای سریع نصب بسته/کانال/عامل، شبکه Gateway، و بارگذاری دوباره پیکربندی
- `package`: قراردادهای بسته نصب/به‌روزرسانی/Plugin بدون ClawHub زنده؛ این پیش‌فرض release-check
  است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI،
  و OpenWebUI
- `full`: تکه‌های Docker مسیر انتشار با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را روی Package Acceptance فعال کنید. گردش‌کار،
tarball حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ گردش‌کار مستقل
Telegram همچنان یک مشخصه npm منتشرشده را برای بررسی‌های پس از انتشار می‌پذیرد.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `tag`: برچسب انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، همچنین می‌تواند SHA کامل
  ۴۰نویسه‌ای فعلی کامیت شاخه گردش‌کار برای پیش‌پرواز فقط-اعتبارسنجی باشد
- `preflight_only`: `true` برای فقط اعتبارسنجی/ساخت/بسته، `false` برای
  مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار از
  tarball آماده‌شده از اجرای پیش‌پرواز موفق دوباره استفاده کند
- `npm_dist_tag`: برچسب هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Checks` این ورودی‌های تحت کنترل اپراتور را می‌پذیرد:

- `ref`: شاخه، برچسب، یا SHA کامل کامیت برای اعتبارسنجی. بررسی‌های دارای راز
  نیاز دارند کامیت حل‌شده از یک شاخه OpenClaw یا برچسب انتشار قابل دسترسی باشد.

قواعد:

- برچسب‌های پایدار و اصلاحی می‌توانند یا به `beta` یا به `latest` منتشر شوند
- برچسب‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل کامیت فقط زمانی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه
  فقط-اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده‌شده در پیش‌پرواز استفاده کند؛
  گردش‌کار بررسی می‌کند که فراداده پیش از انتشار همچنان ادامه داشته باشد

## توالی انتشار npm پایدار

هنگام بریدن یک انتشار npm پایدار:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از اینکه برچسبی وجود داشته باشد، می‌توانید از SHA کامل کامیت فعلی شاخه گردش‌کار
     برای اجرای خشک فقط-اعتبارسنجی گردش‌کار پیش‌پرواز استفاده کنید
2. برای جریان عادی ابتدا-بتا، `npm_dist_tag=beta` را انتخاب کنید، یا فقط زمانی `latest`
   را انتخاب کنید که عمداً انتشار پایدار مستقیم می‌خواهید
3. وقتی می‌خواهید CI عادی به‌علاوه پوشش کش پرامپت زنده، Docker، QA Lab،
   Matrix، و Telegram را از یک گردش‌کار دستی داشته باشید، `Full Release Validation` را روی شاخه انتشار، برچسب انتشار، یا SHA کامل
   کامیت اجرا کنید
4. اگر عمداً فقط به گراف آزمون عادی قطعی نیاز دارید، در عوض گردش‌کار
   دستی `CI` را روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw NPM Release` را دوباره با `preflight_only=false`، همان
   `tag`، همان `npm_dist_tag`، و `preflight_run_id` ذخیره‌شده اجرا کنید
7. اگر انتشار روی `beta` نشست، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمداً مستقیماً به `latest` منتشر شد و `beta`
   باید فوراً همان ساخت پایدار را دنبال کند، از همان گردش‌کار خصوصی
   استفاده کنید تا هر دو dist-tag به نسخه پایدار اشاره کنند، یا بگذارید همگام‌سازی
   خودترمیمی زمان‌بندی‌شده آن، `beta` را بعداً جابه‌جا کند

جهش dist-tag به دلایل امنیتی در مخزن خصوصی قرار دارد، زیرا همچنان
به `NPM_TOKEN` نیاز دارد، در حالی که مخزن عمومی انتشار فقط-OIDC را نگه می‌دارد.

این کار هم مسیر انتشار مستقیم و هم مسیر ارتقای ابتدا-بتا را
مستند و برای اپراتور قابل مشاهده نگه می‌دارد.

اگر یک نگه‌دارنده ناچار شد به احراز هویت محلی npm برگردد، هر فرمان CLI مربوط به 1Password
(`op`) را فقط داخل یک نشست اختصاصی tmux اجرا کنید. `op` را
مستقیماً از پوستهٔ اصلی عامل فراخوانی نکنید؛ نگه داشتن آن داخل tmux باعث می‌شود اعلان‌ها،
هشدارها و مدیریت OTP قابل مشاهده باشند و از هشدارهای تکراری میزبان جلوگیری می‌کند.

## ارجاعات عمومی

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

نگه‌دارندگان برای دستورالعمل اجرای واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
