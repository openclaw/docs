---
read_when:
    - در جست‌وجوی تعریف‌های کانال انتشار عمومی
    - اجرای اعتبارسنجی انتشار یا پذیرش بسته
    - در جست‌وجوی نام‌گذاری نسخه‌ها و چرخه انتشار
summary: مسیرهای انتشار، فهرست بررسی اپراتور، کادرهای اعتبارسنجی، نام‌گذاری نسخه، و تناوب
title: سیاست انتشار
x-i18n:
    generated_at: "2026-05-11T20:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw سه مسیر انتشار عمومی دارد:

- stable: انتشارهای برچسب‌خورده‌ای که به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند، یا وقتی صراحتاً درخواست شود در npm `latest`
- beta: برچسب‌های پیش‌انتشاری که در npm `beta` منتشر می‌شوند
- dev: سر متحرک `main`

## نام‌گذاری نسخه

- نسخه انتشار پایدار: `YYYY.M.D`
  - برچسب Git: `vYYYY.M.D`
- نسخه انتشار اصلاحی پایدار: `YYYY.M.D-N`
  - برچسب Git: `vYYYY.M.D-N`
- نسخه پیش‌انتشار بتا: `YYYY.M.D-beta.N`
  - برچسب Git: `vYYYY.M.D-beta.N`
- ماه یا روز را با صفر ابتدایی ننویسید
- `latest` یعنی انتشار پایدار فعلی npm که ترویج شده است
- `beta` یعنی هدف نصب بتای فعلی
- انتشارهای پایدار و اصلاحی پایدار به‌طور پیش‌فرض در npm `beta` منتشر می‌شوند؛ اپراتورهای انتشار می‌توانند صراحتاً `latest` را هدف بگیرند، یا بعداً یک ساخت بتای بررسی‌شده را ترویج کنند
- هر انتشار پایدار OpenClaw بسته npm و برنامه macOS را با هم عرضه می‌کند؛
  انتشارهای بتا معمولاً ابتدا مسیر npm/package را اعتبارسنجی و منتشر می‌کنند، و
  ساخت/امضا/محضری‌سازی برنامه mac برای انتشار پایدار نگه داشته می‌شود مگر اینکه صراحتاً درخواست شود

## آهنگ انتشار

- انتشارها ابتدا از بتا عبور می‌کنند
- پایدار فقط پس از اعتبارسنجی آخرین بتا دنبال می‌شود
- نگه‌دارندگان معمولاً انتشارها را از شاخه `release/YYYY.M.D` که
  از `main` فعلی ساخته شده است انجام می‌دهند، تا اعتبارسنجی انتشار و اصلاحات مانع
  توسعه جدید روی `main` نشود
- اگر یک برچسب بتا push یا منتشر شده باشد و به اصلاح نیاز داشته باشد، نگه‌دارندگان
  به‌جای حذف یا بازساخت برچسب بتای قدیمی، برچسب `-beta.N` بعدی را می‌سازند
- رویه دقیق انتشار، تأییدها، اعتبارنامه‌ها و یادداشت‌های بازیابی
  فقط مخصوص نگه‌دارندگان است

## چک‌لیست اپراتور انتشار

این چک‌لیست شکل عمومی جریان انتشار است. اعتبارنامه‌های خصوصی،
امضا، محضری‌سازی، بازیابی dist-tag و جزئیات بازگردانی اضطراری در
راهنمای اجرای انتشار مخصوص نگه‌داران باقی می‌ماند.

1. از `main` فعلی شروع کنید: آخرین تغییرات را pull کنید، تأیید کنید commit هدف push شده است،
   و تأیید کنید CI فعلی `main` به‌اندازه کافی سبز است که بتوان از آن شاخه ساخت.
2. بخش بالایی `CHANGELOG.md` را از تاریخچه واقعی commit با
   `/changelog` بازنویسی کنید، ورودی‌ها را کاربرمحور نگه دارید، آن را commit و push کنید، و
   یک بار دیگر پیش از ساخت شاخه rebase/pull کنید.
3. سوابق سازگاری انتشار را در
   `src/plugins/compat/registry.ts` و
   `src/commands/doctor/shared/deprecation-compat.ts` بررسی کنید. سازگاری منقضی‌شده را فقط وقتی حذف کنید
   که مسیر ارتقا همچنان پوشش داده شده باشد، یا ثبت کنید چرا عمداً
   نگه داشته شده است.
4. `release/YYYY.M.D` را از `main` فعلی بسازید؛ کار معمول انتشار را
   مستقیماً روی `main` انجام ندهید.
5. همه محل‌های نسخه لازم را برای برچسب موردنظر افزایش دهید، سپس
   `pnpm release:prep` را اجرا کنید. این دستور نسخه‌های Plugin، فهرست Plugin، شمای پیکربندی،
   فراداده پیکربندی کانال‌های بسته‌بندی‌شده، مبنای مستندات پیکربندی، خروجی‌های Plugin SDK
   و مبنای API مربوط به Plugin SDK را به‌ترتیب درست تازه‌سازی می‌کند. هر drift تولیدشده را
   پیش از برچسب‌گذاری commit کنید. سپس پیش‌پرواز قطعی محلی را اجرا کنید:
   `pnpm check:test-types`، `pnpm check:architecture`،
   `pnpm build && pnpm ui:build`، و `pnpm release:check`.
6. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید. پیش از وجود برچسب،
   یک SHA کامل ۴۰ کاراکتری از شاخه انتشار برای پیش‌پرواز فقط-اعتبارسنجی مجاز است.
   `preflight_run_id` موفق را ذخیره کنید.
7. همه آزمون‌های پیش از انتشار را با `Full Release Validation` برای
   شاخه انتشار، برچسب، یا SHA کامل commit آغاز کنید. این تنها نقطه ورود دستی
   برای چهار جعبه بزرگ آزمون انتشار است: Vitest، Docker، QA Lab و Package.
8. اگر اعتبارسنجی شکست خورد، روی شاخه انتشار اصلاح کنید و کوچک‌ترین
   فایل، مسیر، workflow job، پروفایل بسته، provider یا allowlist مدل شکست‌خورده‌ای را دوباره اجرا کنید
   که اصلاح را ثابت می‌کند. چتر کامل را فقط وقتی دوباره اجرا کنید که سطح تغییر
   شواهد قبلی را کهنه کرده باشد.
9. برای بتا، `vYYYY.M.D-beta.N` را برچسب بزنید، سپس `OpenClaw Release Publish` را از
   شاخه متناظر `release/YYYY.M.D` اجرا کنید. این دستور `pnpm plugins:sync:check` را تأیید می‌کند،
   همه بسته‌های Plugin قابل انتشار را به npm و همان مجموعه را به‌صورت موازی به
   ClawHub dispatch می‌کند، و سپس به‌محض موفقیت انتشار npm مربوط به Plugin،
   artifact پیش‌پرواز آماده‌شده OpenClaw npm را با dist-tag متناظر ترویج می‌کند.
   پس از موفقیت فرزند انتشار OpenClaw npm، صفحه انتشار/پیش‌انتشار
   متناظر GitHub را از بخش کامل متناظر
   `CHANGELOG.md` ایجاد یا به‌روزرسانی می‌کند. انتشارهای پایدار منتشرشده در npm `latest` به
   آخرین انتشار GitHub تبدیل می‌شوند؛ انتشارهای نگه‌داری پایدار که روی npm `beta` نگه داشته شده‌اند
   با `latest=false` در GitHub ایجاد می‌شوند.
   انتشار ClawHub ممکن است همچنان در حال اجرا باشد در حالی که OpenClaw npm منتشر می‌شود، اما
   workflow انتشار، شناسه‌های اجرای فرزند را فوراً چاپ می‌کند. به‌طور پیش‌فرض، پس از dispatch کردن ClawHub
   منتظر آن نمی‌ماند، بنابراین در دسترس بودن OpenClaw npm
   با تأییدهای کندتر ClawHub یا کار رجیستری مسدود نمی‌شود؛ وقتی ClawHub باید تکمیل workflow را مسدود کند
   `wait_for_clawhub=true` را تنظیم کنید. مسیر
   ClawHub خطاهای گذرای نصب وابستگی CLI را دوباره تلاش می‌کند، Pluginهایی را که preview را گذرانده‌اند
   حتی وقتی یک سلول preview دچار flake شود منتشر می‌کند، و با
   تأیید رجیستری برای هر نسخه Plugin موردانتظار پایان می‌یابد تا انتشارهای جزئی
   قابل مشاهده و قابل تلاش مجدد باقی بمانند. پس از انتشار،
   پذیرش بسته پس از انتشار را
   در برابر بسته منتشرشده `openclaw@YYYY.M.D-beta.N` یا
   `openclaw@beta` اجرا کنید. اگر یک پیش‌انتشار push یا منتشرشده به اصلاح نیاز داشت،
   شماره پیش‌انتشار متناظر بعدی را بسازید؛ پیش‌انتشار قدیمی را حذف یا بازنویسی نکنید.
10. برای پایدار، فقط پس از اینکه بتا یا نامزد انتشار بررسی‌شده
    شواهد اعتبارسنجی لازم را داشت ادامه دهید. انتشار پایدار npm نیز از مسیر
    `OpenClaw Release Publish` عبور می‌کند و artifact پیش‌پرواز موفق را از طریق
    `preflight_run_id` دوباره استفاده می‌کند؛ آمادگی انتشار پایدار macOS همچنین به
    `.zip`، `.dmg`، `.dSYM.zip` بسته‌بندی‌شده و `appcast.xml` به‌روزشده روی `main` نیاز دارد.
    workflow خصوصی انتشار macOS پس از تأیید assetهای انتشار، appcast امضاشده را به‌طور خودکار روی
    `main` عمومی منتشر می‌کند؛ اگر محافظت شاخه push مستقیم را مسدود کند،
    یک PR برای appcast باز یا به‌روزرسانی می‌کند.
11. پس از انتشار، تأییدکننده پس از انتشار npm، E2E اختیاری Telegram مستقلِ npm منتشرشده
    وقتی به اثبات کانال پس از انتشار نیاز دارید،
    ترویج dist-tag در صورت نیاز، تأیید صفحه انتشار GitHub تولیدشده،
    و مراحل اعلان انتشار را اجرا کنید.

## پیش‌پرواز انتشار

- پیش از پیش‌پرواز انتشار، `pnpm check:test-types` را اجرا کنید تا TypeScript تست‌ها خارج از گیت سریع‌تر محلی `pnpm check` همچنان پوشش داده شود
- پیش از پیش‌پرواز انتشار، `pnpm check:architecture` را اجرا کنید تا بررسی‌های گسترده‌تر چرخه import و مرزهای معماری خارج از گیت سریع‌تر محلی سبز باشند
- پیش از `pnpm release:check`، دستور `pnpm build && pnpm ui:build` را اجرا کنید تا آرتیفکت‌های انتشار مورد انتظار `dist/*` و باندل Control UI برای مرحله اعتبارسنجی pack وجود داشته باشند
- پس از افزایش نسخه ریشه و پیش از تگ‌گذاری، `pnpm release:prep` را اجرا کنید. این دستور همه مولدهای قطعی انتشار را که معمولا پس از تغییر نسخه/پیکربندی/API دچار اختلاف می‌شوند اجرا می‌کند: نسخه‌های Plugin، فهرست Plugin، اسکیمای پیکربندی پایه، فراداده پیکربندی کانال‌های باندل‌شده، مبنای مستندات پیکربندی، خروجی‌های Plugin SDK، و مبنای API مربوط به Plugin SDK. `pnpm release:check` این نگهبان‌ها را دوباره در حالت بررسی اجرا می‌کند و پیش از اجرای بررسی‌های انتشار بسته، همه خطاهای اختلاف خروجی تولیدشده را که پیدا کند در یک گذر گزارش می‌دهد.
- پیش از تایید انتشار، گردش‌کار دستی `Full Release Validation` را اجرا کنید تا همه جعبه‌های تست پیش از انتشار از یک نقطه ورود آغاز شوند. این گردش‌کار یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، `CI` دستی را dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش بسته، بررسی‌های بسته میان‌سیستمی، برابری QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. اجراهای پایدار/پیش‌فرض، live/E2E جامع و soak مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` اجرای soak را اجباری می‌کند. با `release_profile=full` و `rerun_group=all`، همچنین Telegram E2E بسته را در برابر آرتیفکت `release-package-under-test` از بررسی‌های انتشار اجرا می‌کند. پس از انتشار beta، مقدار `release_package_spec` را ارائه کنید تا بسته npm منتشرشده در بررسی‌های انتشار، Package Acceptance، و Telegram E2E بسته، بدون بازسازی tarball انتشار، دوباره استفاده شود. فقط زمانی `npm_telegram_package_spec` را ارائه کنید که Telegram باید از بسته منتشرشده متفاوتی نسبت به بقیه اعتبارسنجی انتشار استفاده کند. زمانی `package_acceptance_package_spec` را ارائه کنید که Package Acceptance باید از بسته منتشرشده متفاوتی نسبت به مشخصات بسته انتشار استفاده کند. زمانی `evidence_package_spec` را ارائه کنید که گزارش شواهد خصوصی باید ثابت کند اعتبارسنجی با یک بسته npm منتشرشده مطابقت دارد، بدون آنکه Telegram E2E اجباری شود.
  مثال:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- زمانی که می‌خواهید هم‌زمان با ادامه کار انتشار، برای یک کاندیدای بسته اثبات کانال جانبی داشته باشید، گردش‌کار دستی `Package Acceptance` را اجرا کنید. برای `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق از `source=npm` استفاده کنید؛ برای pack کردن یک شاخه/تگ/SHA قابل اعتماد `package_ref` با harness فعلی `workflow_ref` از `source=ref` استفاده کنید؛ برای tarball از نوع HTTPS با SHA-256 الزامی از `source=url` استفاده کنید؛ یا برای tarball بارگذاری‌شده توسط اجرای دیگری از GitHub Actions از `source=artifact` استفاده کنید. این گردش‌کار کاندیدا را به `package-under-test` resolve می‌کند، زمان‌بند انتشار Docker E2E را در برابر همان tarball دوباره استفاده می‌کند، و می‌تواند Telegram QA را با `telegram_mode=mock-openai` یا `telegram_mode=live-frontier` روی همان tarball اجرا کند. وقتی مسیرهای انتخاب‌شده Docker شامل `published-upgrade-survivor` باشند، آرتیفکت بسته همان کاندیدا است و `published_upgrade_survivor_baseline` مبنای منتشرشده را انتخاب می‌کند. `update-restart-auth` از بسته کاندیدا هم به‌عنوان CLI نصب‌شده و هم به‌عنوان package-under-test استفاده می‌کند تا مسیر restart مدیریت‌شده فرمان update کاندیدا را تمرین کند.
  مثال: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  پروفایل‌های رایج:
  - `smoke`: مسیرهای install/channel/agent، شبکه Gateway، و بارگذاری دوباره پیکربندی
  - `package`: مسیرهای بسته/update/restart/Plugin بومی آرتیفکت، بدون OpenWebUI یا ClawHub زنده
  - `product`: پروفایل بسته به‌همراه کانال‌های MCP، پاک‌سازی cron/subagent،
    جست‌وجوی وب OpenAI، و OpenWebUI
  - `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
  - `custom`: انتخاب دقیق `docker_lanes` برای اجرای دوباره متمرکز
- زمانی که فقط به پوشش کامل CI عادی برای کاندیدای انتشار نیاز دارید، گردش‌کار دستی `CI` را مستقیم اجرا کنید. dispatchهای دستی CI از scope مبتنی بر تغییرات عبور می‌کنند و shardهای Linux Node، shardهای Plugin باندل‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، Android، و مسیرهای i18n مربوط به Control UI را اجباری می‌کنند.
  مثال: `gh workflow run ci.yml --ref release/YYYY.M.D`
- هنگام اعتبارسنجی تله‌متری انتشار، `pnpm qa:otel:smoke` را اجرا کنید. این دستور QA-lab را از طریق یک گیرنده محلی OTLP/HTTP تمرین می‌دهد و نام spanهای trace صادرشده، ویژگی‌های محدودشده، و redaction محتوا/شناسه را بدون نیاز به Opik، Langfuse، یا گردآورنده خارجی دیگر تایید می‌کند.
- پیش از هر انتشار تگ‌شده، `pnpm release:check` را اجرا کنید
- پس از وجود تگ، برای توالی انتشار تغییردهنده `OpenClaw Release Publish` را اجرا کنید. آن را از `release/YYYY.M.D` یا، هنگام انتشار تگی که از `main` قابل دسترسی است، از `main` dispatch کنید، تگ انتشار و `preflight_run_id` موفق npm مربوط به OpenClaw را بدهید، و دامنه پیش‌فرض انتشار Plugin یعنی `all-publishable` را حفظ کنید مگر اینکه عمدا یک تعمیر متمرکز اجرا می‌کنید. این گردش‌کار انتشار npm مربوط به Plugin، انتشار Plugin در ClawHub، و انتشار npm مربوط به OpenClaw را به‌صورت ترتیبی انجام می‌دهد تا بسته هسته پیش از Pluginهای externalized خودش منتشر نشود.
- بررسی‌های انتشار اکنون در یک گردش‌کار دستی جدا اجرا می‌شوند:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` همچنین پیش از تایید انتشار، مسیر برابری mock مربوط به QA Lab به‌همراه پروفایل سریع live Matrix و مسیر Telegram QA را اجرا می‌کند. مسیرهای live از محیط `qa-live-shared` استفاده می‌کنند؛ Telegram همچنین از leaseهای credential مربوط به Convex CI استفاده می‌کند. وقتی فهرست کامل transport، media، و E2EE مربوط به Matrix را به‌صورت موازی می‌خواهید، گردش‌کار دستی `QA-Lab - All Lanes` را با `matrix_profile=all` و `matrix_shards=true` اجرا کنید.
- اعتبارسنجی زمان اجرا برای نصب و upgrade میان‌سیستمی بخشی از `OpenClaw Release Checks` و `Full Release Validation` عمومی است که گردش‌کار قابل‌استفاده مجدد
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` را مستقیم فراخوانی می‌کنند
- این جداسازی عمدی است: مسیر واقعی انتشار npm کوتاه، قطعی، و متمرکز بر آرتیفکت می‌ماند، در حالی که بررسی‌های live کندتر در مسیر خودشان می‌مانند تا انتشار را متوقف یا مسدود نکنند
- بررسی‌های انتشار دارای secret باید از طریق `Full Release
Validation` یا از ref گردش‌کار `main`/release dispatch شوند تا منطق گردش‌کار و secretها کنترل‌شده بمانند
- `OpenClaw Release Checks` یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، به شرطی که commit resolve‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد
- پیش‌پرواز فقط‌اعتبارسنجی `OpenClaw NPM Release` نیز SHA کامل ۴۰کاراکتری commit شاخه گردش‌کار فعلی را بدون نیاز به تگ pushشده می‌پذیرد
- آن مسیر SHA فقط برای اعتبارسنجی است و نمی‌تواند به انتشار واقعی ارتقا یابد
- در حالت SHA، گردش‌کار فقط برای بررسی فراداده بسته `v<package.json version>` را می‌سازد؛ انتشار واقعی همچنان به تگ انتشار واقعی نیاز دارد
- هر دو گردش‌کار مسیر انتشار و promotion واقعی را روی runnerهای میزبانی‌شده GitHub نگه می‌دارند، در حالی که مسیر اعتبارسنجی بدون تغییر می‌تواند از runnerهای بزرگ‌تر Blacksmith Linux استفاده کند
- آن گردش‌کار
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  را با استفاده از secretهای گردش‌کار `OPENAI_API_KEY` و `ANTHROPIC_API_KEY` اجرا می‌کند
- پیش‌پرواز انتشار npm دیگر منتظر مسیر جداگانه بررسی‌های انتشار نمی‌ماند
- پیش از تایید،
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  یا تگ beta/correction مطابق را اجرا کنید
- پس از انتشار npm،
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  یا نسخه beta/correction مطابق را اجرا کنید تا مسیر نصب registry منتشرشده در یک prefix موقت تازه تایید شود
- پس از انتشار beta، دستور `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  را اجرا کنید تا onboarding بسته نصب‌شده، راه‌اندازی Telegram، و Telegram E2E واقعی در برابر بسته npm منتشرشده با استفاده از مخزن مشترک credentialهای leased مربوط به Telegram تایید شود. اجراهای موردی محلی نگه‌دارنده می‌توانند متغیرهای Convex را حذف کنند و سه credential محیطی `OPENCLAW_QA_TELEGRAM_*` را مستقیم پاس بدهند.
- برای اجرای smoke کامل beta پس از انتشار از ماشین نگه‌دارنده، از `pnpm release:beta-smoke -- --beta betaN` استفاده کنید. این helper اعتبارسنجی npm update/fresh-target مربوط به Parallels را اجرا می‌کند، `NPM Telegram Beta E2E` را dispatch می‌کند، اجرای دقیق گردش‌کار را poll می‌کند، آرتیفکت را دانلود می‌کند، و گزارش Telegram را چاپ می‌کند.
- نگه‌دارنده‌ها می‌توانند همین بررسی پس از انتشار را از GitHub Actions از طریق گردش‌کار دستی `NPM Telegram Beta E2E` اجرا کنند. این گردش‌کار عمدا فقط دستی است و روی هر merge اجرا نمی‌شود.
- خودکارسازی انتشار نگه‌دارنده اکنون از الگوی preflight-then-promote استفاده می‌کند:
  - انتشار واقعی npm باید یک `preflight_run_id` موفق npm داشته باشد
  - انتشار واقعی npm باید از همان شاخه `main` یا
    `release/YYYY.M.D` که اجرای پیش‌پرواز موفق از آن بوده dispatch شود
  - انتشارهای پایدار npm به‌صورت پیش‌فرض روی `beta` هستند
  - انتشار پایدار npm می‌تواند از طریق ورودی گردش‌کار به‌طور صریح `latest` را هدف بگیرد
  - تغییر tokenمحور dist-tag در npm اکنون در
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    قرار دارد، به دلیل امنیت، چون `npm dist-tag add` همچنان به `NPM_TOKEN` نیاز دارد در حالی که مخزن عمومی فقط انتشار OIDC را نگه می‌دارد
  - `macOS Release` عمومی فقط برای اعتبارسنجی است؛ وقتی یک تگ فقط روی شاخه انتشار وجود دارد اما گردش‌کار از `main` dispatch می‌شود،
    `public_release_branch=release/YYYY.M.D` را تنظیم کنید
  - انتشار واقعی خصوصی mac باید `preflight_run_id` و `validate_run_id` موفق خصوصی mac را داشته باشد
  - مسیرهای انتشار واقعی آرتیفکت‌های آماده‌شده را promote می‌کنند، نه اینکه دوباره آنها را بسازند
- برای انتشارهای correction پایدار مانند `YYYY.M.D-N`، verifier پس از انتشار همچنین همان مسیر upgrade با temp-prefix از `YYYY.M.D` به `YYYY.M.D-N` را بررسی می‌کند تا correctionهای انتشار نتوانند بی‌صدا نصب‌های global قدیمی‌تر را روی payload پایدار پایه باقی بگذارند
- پیش‌پرواز انتشار npm به‌صورت fail closed عمل می‌کند مگر اینکه tarball هم شامل `dist/control-ui/index.html` و هم payload غیرخالی `dist/control-ui/assets/` باشد، تا دوباره داشبورد مرورگر خالی منتشر نکنیم
- اعتبارسنجی پس از انتشار همچنین بررسی می‌کند که entrypointهای Plugin منتشرشده و فراداده بسته در layout نصب‌شده registry حضور داشته باشند. انتشاری که payloadهای runtime مربوط به Plugin را جا انداخته باشد، verifier پس از انتشار را fail می‌کند و نمی‌تواند به `latest` promote شود.
- `pnpm test:install:smoke` همچنین بودجه `unpackedSize` مربوط به npm pack را روی tarball update کاندیدا enforce می‌کند، بنابراین installer e2e تورم تصادفی pack را پیش از مسیر انتشار release تشخیص می‌دهد
- اگر کار انتشار به برنامه‌ریزی CI، manifestهای زمان‌بندی extension، یا matrixهای تست extension دست زده است، پیش از تایید، خروجی‌های matrix مربوط به `plugin-prerelease-extension-shard` را که مالک آن planner است از
  `.github/workflows/plugin-prerelease.yml` دوباره تولید و بازبینی کنید تا یادداشت‌های انتشار layout کهنه CI را توصیف نکنند
- آمادگی انتشار پایدار macOS همچنین شامل سطوح updater است:
  - انتشار GitHub باید در نهایت شامل `.zip`، `.dmg`، و `.dSYM.zip` بسته‌بندی‌شده باشد
  - پس از انتشار، `appcast.xml` روی `main` باید به zip پایدار جدید اشاره کند؛ گردش‌کار انتشار خصوصی macOS آن را خودکار commit می‌کند، یا وقتی push مستقیم مسدود باشد یک PR مربوط به appcast باز می‌کند
  - برنامه بسته‌بندی‌شده باید bundle id غیر-debug، URL feed غیرخالی Sparkle، و `CFBundleVersion` برابر یا بالاتر از کف canonical ساخت Sparkle برای آن نسخه انتشار را حفظ کند

## جعبه‌های تست انتشار

`Full Release Validation` روشی است که operatorها همه تست‌های پیش از انتشار را از
یک نقطه ورود آغاز می‌کنند. برای اثبات commit پین‌شده روی شاخه‌ای با تغییرات سریع، از
helper استفاده کنید تا هر گردش‌کار فرزند از یک شاخه موقت ثابت‌شده روی SHA هدف اجرا شود:

```bash
pnpm ci:full-release --sha <full-sha>
```

کمک‌کننده `release-ci/<sha>-...` را push می‌کند، `Full Release Validation`
را از همان branch با `ref=<sha>` dispatch می‌کند، بررسی می‌کند که `headSha`
هر child workflow با هدف مطابق باشد، و سپس branch موقت را حذف می‌کند. این کار مانع از آن می‌شود که به‌اشتباه اجرای child مربوط به `main`
جدیدتر اثبات شود.

برای اعتبارسنجی release branch یا tag، آن را از ref مربوط به workflow معتبر `main`
اجرا کنید و release branch یا tag را به‌عنوان `ref` پاس بدهید:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow، target ref را resolve می‌کند، `CI` دستی را با
`target_ref=<release-ref>` dispatch می‌کند، `OpenClaw Release Checks` را dispatch می‌کند، یک artifact والد `release-package-under-test` را برای بررسی‌های package-facing آماده می‌کند، و وقتی `release_profile=full` با
`rerun_group=all` باشد یا وقتی `release_package_spec` یا
`npm_telegram_package_spec` تنظیم شده باشد، Package Telegram E2E مستقل را dispatch می‌کند. سپس `OpenClaw Release
Checks` install smoke، بررسی‌های release بین‌سیستم‌عاملی، پوشش live/E2E Docker
مسیر release هنگام فعال بودن soak، Package Acceptance با Telegram
package QA، برابری QA Lab، Matrix زنده، و Telegram زنده را fan out می‌کند. یک اجرای کامل فقط وقتی قابل قبول است که خلاصه‌ی
`Full Release Validation`
، `normal_ci` و `release_checks` را موفق نشان دهد. در حالت full/all،
child مربوط به `npm_telegram` نیز باید موفق باشد؛ خارج از full/all، مگر اینکه
`release_package_spec` یا `npm_telegram_package_spec` منتشرشده‌ای ارائه شده باشد، skip می‌شود. خلاصه‌ی verifier نهایی شامل جدول‌های کندترین job برای هر child run است، تا release manager بتواند مسیر بحرانی فعلی را بدون دانلود کردن logها ببیند.
برای ماتریس کامل stageها، نام دقیق jobهای workflow، تفاوت‌های profileهای stable و full، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل release](/fa/reference/full-release-validation) را ببینید.
Child workflowها از ref معتبری dispatch می‌شوند که `Full Release
Validation` را اجرا می‌کند، معمولا `--ref main`، حتی وقتی target `ref` به release branch یا tag قدیمی‌تری اشاره کند. ورودی workflow-ref جداگانه‌ای برای Full Release Validation وجود ندارد؛ harness معتبر را با انتخاب ref اجرای workflow انتخاب کنید.
برای اثبات commit دقیق روی `main` متحرک از `--ref main -f ref=<sha>` استفاده نکنید؛
SHAهای خام commit نمی‌توانند workflow dispatch ref باشند، بنابراین از
`pnpm ci:full-release --sha <sha>` برای ساخت branch موقت pinned استفاده کنید.

از `release_profile` برای انتخاب گستره‌ی live/provider استفاده کنید:

- `minimum`: سریع‌ترین مسیر release-critical برای OpenAI/core live و Docker
- `stable`: minimum به‌علاوه‌ی پوشش provider/backend پایدار برای تایید release
- `full`: stable به‌علاوه‌ی پوشش گسترده‌ی advisory provider/media

وقتی مسیرهای release-blocking سبز هستند و می‌خواهید پیش از promotion، sweep جامع live/E2E، مسیر release در Docker، و upgrade-survivor منتشرشده‌ی محدودشده را اجرا کنید، با `stable` از `run_release_soak=true` استفاده کنید. آن sweep چهار package پایدار آخر به‌علاوه‌ی baselineهای pinned `2026.4.23` و `2026.5.2`
به‌علاوه‌ی پوشش قدیمی‌تر `2026.4.15` را پوشش می‌دهد، baselineهای تکراری را حذف می‌کند و هر baseline را در job Docker runner جداگانه‌ی خودش shard می‌کند. `full` به‌صورت ضمنی
`run_release_soak=true` را فعال می‌کند.

`OpenClaw Release Checks` از ref معتبر workflow استفاده می‌کند تا target
ref را یک‌بار به‌صورت `release-package-under-test` resolve کند و هنگام اجرای soak همان artifact را در بررسی‌های cross-OS،
Package Acceptance، و release-path Docker دوباره استفاده کند. این کار همه‌ی boxهای package-facing را روی همان byteها نگه می‌دارد و از buildهای تکراری package جلوگیری می‌کند.
بعد از اینکه یک beta از قبل روی npm قرار گرفت، `release_package_spec=openclaw@YYYY.M.D-beta.N` را تنظیم کنید تا بررسی‌های release، package ارسال‌شده را یک‌بار دانلود کنند، SHA مربوط به build source آن را از `dist/build-info.json` استخراج کنند، و همان artifact را برای مسیرهای cross-OS،
Package Acceptance، release-path Docker، و package Telegram دوباره استفاده کنند.
Install smoke بین‌سیستم‌عاملی OpenAI وقتی repo/org variable تنظیم شده باشد از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، چون این مسیر در حال اثبات نصب package، onboarding، startup گیت‌وی، و یک turn agent زنده است
نه benchmark کردن کندترین مدل پیش‌فرض. ماتریس گسترده‌تر providerهای live همچنان جای پوشش model-specific است.

بسته به مرحله‌ی release از این variantها استفاده کنید:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

از umbrella کامل به‌عنوان اولین rerun پس از یک fix متمرکز استفاده نکنید. اگر یک box
fail شد، برای اثبات بعدی از child workflow، job، مسیر Docker، profile package، provider مدل، یا مسیر QA شکست‌خورده استفاده کنید. فقط وقتی fix، orchestration مشترک release را تغییر داده یا شواهد قبلی all-box را کهنه کرده است، umbrella کامل را دوباره اجرا کنید. verifier نهایی umbrella، شناسه‌های ثبت‌شده‌ی child workflow run را دوباره بررسی می‌کند، بنابراین پس از اینکه یک child workflow با موفقیت rerun شد، فقط job والد
`Verify full validation` شکست‌خورده را rerun کنید.

برای recovery محدود، `rerun_group` را به umbrella پاس بدهید. `all` اجرای واقعی release-candidate است، `ci` فقط child مربوط به CI عادی را اجرا می‌کند، `plugin-prerelease`
فقط child مخصوص release برای Plugin را اجرا می‌کند، `release-checks` همه‌ی boxهای release را اجرا می‌کند، و گروه‌های محدودتر release عبارت‌اند از `install-smoke`، `cross-os`،
`live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، و `npm-telegram`.
rerunهای متمرکز `npm-telegram` به `release_package_spec` یا
`npm_telegram_package_spec` نیاز دارند؛ اجراهای full/all با `release_profile=full` از artifact package مربوط به release-checks استفاده می‌کنند. rerunهای متمرکز cross-OS می‌توانند `cross_os_suite_filter=windows/packaged-upgrade` یا فیلتر OS/suite دیگری اضافه کنند. شکست‌های QA release-check جنبه‌ی advisory دارند؛ شکست فقط-QA اعتبارسنجی release را block نمی‌کند.

### Vitest

box مربوط به Vitest همان child workflow دستی `CI` است. CI دستی عمدا scoping مبتنی بر تغییرات را دور می‌زند و graph عادی test را برای release candidate اجباری می‌کند: shardهای Linux Node، shardهای bundled-plugin، channel contractها، سازگاری Node 22،
`check`، `check-additional`، build smoke، بررسی‌های docs، Python
skills، Windows، macOS، Android، و i18n مربوط به Control UI.

از این box برای پاسخ به این پرسش استفاده کنید: «آیا source tree کل normal test suite را پاس کرد؟»
این با اعتبارسنجی محصول در مسیر release یکی نیست. شواهدی که باید نگه دارید:

- خلاصه‌ی `Full Release Validation` که URL اجرای `CI` dispatch‌شده را نشان می‌دهد
- اجرای `CI` سبز روی target SHA دقیق
- نام shardهای شکست‌خورده یا کند از jobهای CI هنگام بررسی regressionها
- artifactهای زمان‌بندی Vitest مانند `.artifacts/vitest-shard-timings.json` وقتی
  یک اجرا به تحلیل performance نیاز دارد

CI دستی را فقط وقتی مستقیم اجرا کنید که release به CI عادی deterministic نیاز دارد اما
به boxهای Docker، QA Lab، live، cross-OS، یا package نیاز ندارد:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box مربوط به Docker در `OpenClaw Release Checks` از طریق
`openclaw-live-and-e2e-checks-reusable.yml`، به‌علاوه‌ی workflow
`install-smoke` در حالت release قرار دارد. این box، release candidate را از طریق environmentهای Docker packaged اعتبارسنجی می‌کند، نه فقط testهای سطح source.

پوشش Docker در release شامل موارد زیر است:

- install smoke کامل با Bun global install smoke کند فعال‌شده
- آماده‌سازی/استفاده‌ی مجدد از image smoke مربوط به Dockerfile ریشه بر اساس target SHA، با jobهای QR،
  root/gateway، و installer/Bun smoke که به‌صورت shardهای جداگانه‌ی install-smoke اجرا می‌شوند
- مسیرهای E2E repository
- chunkهای Docker مسیر release: `core`، `package-update-openai`،
  `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`،
  `plugins-runtime-services`،
  `plugins-runtime-install-a`، `plugins-runtime-install-b`،
  `plugins-runtime-install-c`، `plugins-runtime-install-d`،
  `plugins-runtime-install-e`، `plugins-runtime-install-f`،
  `plugins-runtime-install-g`، و `plugins-runtime-install-h`
- پوشش OpenWebUI داخل chunk مربوط به `plugins-runtime-services` هنگام درخواست
- مسیرهای split برای install/uninstall bundled plugin
  از `bundled-plugin-install-uninstall-0` تا
  `bundled-plugin-install-uninstall-23`
- suiteهای live/E2E provider و پوشش model زنده‌ی Docker وقتی بررسی‌های release
  شامل suiteهای live باشند

پیش از rerun از artifactهای Docker استفاده کنید. scheduler مسیر release،
`.artifacts/docker-tests/` را همراه با logهای lane، `summary.json`، `failures.json`،
زمان‌بندی phaseها، JSON مربوط به plan scheduler، و commandهای rerun آپلود می‌کند. برای recovery متمرکز،
روی workflow قابل‌استفاده‌مجدد live/E2E از `docker_lanes=<lane[,lane]>` استفاده کنید، نه rerun کردن همه‌ی chunkهای release. commandهای rerun تولیدشده وقتی امکان‌پذیر باشد شامل
`package_artifact_run_id` قبلی و ورودی‌های image آماده‌شده‌ی Docker هستند، بنابراین یک lane شکست‌خورده می‌تواند همان tarball و imageهای GHCR را دوباره استفاده کند.

### QA Lab

box مربوط به QA Lab نیز بخشی از `OpenClaw Release Checks` است. این gate رفتار agentic و release در سطح channel است، جدا از Vitest و مکانیک package در Docker.

پوشش QA Lab در release شامل موارد زیر است:

- مسیر mock parity که lane کاندید OpenAI را با baseline مربوط به Opus 4.6
  با استفاده از agentic parity pack مقایسه می‌کند
- profile سریع QA زنده‌ی Matrix با استفاده از environment `qa-live-shared`
- مسیر QA زنده‌ی Telegram با استفاده از leaseهای credential در Convex CI
- `pnpm qa:otel:smoke` وقتی telemetry مربوط به release به اثبات محلی صریح نیاز دارد

از این box برای پاسخ به این پرسش استفاده کنید: «آیا release در سناریوهای QA و جریان‌های channel زنده درست رفتار می‌کند؟»
هنگام تایید release، URLهای artifact مربوط به مسیرهای parity، Matrix، و Telegram را نگه دارید. پوشش کامل Matrix همچنان به‌عنوان اجرای دستی sharded QA-Lab در دسترس است، نه lane پیش‌فرض release-critical.

### Package

box مربوط به Package همان gate محصول قابل‌نصب است. این box با
`Package Acceptance` و resolver
`scripts/resolve-openclaw-package-candidate.mjs` پشتیبانی می‌شود. resolver یک candidate را به tarball
`package-under-test` که توسط Docker E2E مصرف می‌شود normalize می‌کند، inventory package را اعتبارسنجی می‌کند، version package و SHA-256 را ثبت می‌کند، و ref مربوط به workflow harness را از ref مربوط به source package جدا نگه می‌دارد.

منابع candidate پشتیبانی‌شده:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک version دقیق از OpenClaw release
- `source=ref`: یک branch، tag، یا full commit SHA معتبر `package_ref` را
  با harness انتخاب‌شده‌ی `workflow_ref` pack کنید
- `source=url`: یک `.tgz` در HTTPS را با `package_sha256` الزامی دانلود کنید
- `source=artifact`: یک `.tgz` آپلودشده توسط اجرای دیگری از GitHub Actions را دوباره استفاده کنید

`OpenClaw Release Checks`، Package Acceptance را با `source=artifact`، artifact package آماده‌شده‌ی release، `suite_profile=custom`،
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`،
`telegram_mode=mock-openai` اجرا می‌کند. Package Acceptance، migration، update،
restart مربوط به update با auth پیکربندی‌شده، نصب live ClawHub skill، پاک‌سازی dependency کهنه‌ی plugin، fixtureهای offline plugin،
plugin update، و Telegram package QA را روی همان tarball resolve‌شده نگه می‌دارد. بررسی‌های release مسدودکننده از baseline پیش‌فرض latest published package استفاده می‌کنند؛ `run_release_soak=true` یا
`release_profile=full` به همه‌ی baselineهای پایدار منتشرشده در npm از
`2026.4.23` تا `latest` به‌علاوه‌ی fixtureهای reported-issue گسترش پیدا می‌کند. برای candidateای که از قبل ارسال شده است، از
Package Acceptance با `source=npm` استفاده کنید، یا برای tarball محلی npm که پشتوانه‌ی SHA دارد و هنوز publish نشده، از
`source=ref`/`source=artifact` استفاده کنید. این جایگزین GitHub-native برای بیشتر پوشش package/update است که قبلا به
Parallels نیاز داشت. بررسی‌های release بین‌سیستم‌عاملی همچنان برای onboarding، installer، و رفتار platform خاص هر OS مهم‌اند، اما اعتبارسنجی محصول package/update باید Package Acceptance را ترجیح دهد.

چک‌لیست مرجع برای اعتبارسنجی به‌روزرسانی و Plugin
[آزمایش به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) است. هنگام
تصمیم‌گیری درباره اینکه کدام مسیر محلی، Docker، Package Acceptance، یا بررسی انتشار می‌تواند یک
نصب/به‌روزرسانی Plugin، پاک‌سازی doctor، یا تغییر مهاجرت بسته منتشرشده را اثبات کند، از آن استفاده کنید.
مهاجرت کامل به‌روزرسانی منتشرشده از هر بسته پایدار `2026.4.23+`
یک گردش‌کار دستی جداگانه `Update Migration` است، نه بخشی از Full Release CI.

سهل‌گیری قدیمی Package Acceptance عمدا زمان‌بندی محدود دارد. بسته‌ها تا
`2026.4.25` ممکن است برای شکاف‌های فراداده‌ای که قبلا در npm منتشر شده‌اند
از مسیر سازگاری استفاده کنند: ورودی‌های خصوصی موجودی QA که از tarball جا افتاده‌اند، نبود
`gateway install --wrapper`، نبود فایل‌های وصله در fixture گیت مشتق‌شده از tarball، نبود
`update.channel` پایدارشده، مکان‌های قدیمی رکورد نصب Plugin،
نبود پایداری رکورد نصب marketplace، و مهاجرت فراداده پیکربندی
هنگام `plugins update`. بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های مهر فراداده build محلی
که قبلا ارسال شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن بسته را
رعایت کنند؛ همان شکاف‌ها اعتبارسنجی انتشار را ناموفق می‌کنند.

وقتی پرسش انتشار درباره یک بسته قابل نصب واقعی است، از پروفایل‌های گسترده‌تر Package Acceptance استفاده کنید:

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

- `smoke`: مسیرهای سریع نصب بسته/کانال/agent، شبکه Gateway، و بارگذاری مجدد پیکربندی
- `package`: قراردادهای نصب/به‌روزرسانی/راه‌اندازی مجدد/بسته Plugin به‌همراه اثبات زنده نصب skill از ClawHub؛ این پیش‌فرض بررسی انتشار است
- `product`: `package` به‌علاوه کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، و OpenWebUI
- `full`: بخش‌های مسیر انتشار Docker با OpenWebUI
- `custom`: فهرست دقیق `docker_lanes` برای اجرای دوباره متمرکز

برای اثبات Telegram نامزد بسته، `telegram_mode=mock-openai` یا
`telegram_mode=live-frontier` را در Package Acceptance فعال کنید. این گردش‌کار
tarball حل‌شده `package-under-test` را به مسیر Telegram می‌دهد؛ گردش‌کار مستقل
Telegram همچنان برای بررسی‌های پس از انتشار یک مشخصه npm منتشرشده را می‌پذیرد.

## خودکارسازی انتشار

`OpenClaw Release Publish` ورودی معمول انتشار تغییردهنده است. این گردش‌کار
گردش‌کارهای ناشر معتمد را به ترتیبی که انتشار نیاز دارد هماهنگ می‌کند:

1. تگ انتشار را checkout کنید و commit SHA آن را حل کنید.
2. بررسی کنید تگ از `main` یا `release/*` قابل دسترسی باشد.
3. `pnpm plugins:sync:check` را اجرا کنید.
4. `Plugin NPM Release` را با `publish_scope=all-publishable` و
   `ref=<release-sha>` dispatch کنید.
5. `Plugin ClawHub Release` را با همان scope و SHA dispatch کنید.
6. `OpenClaw NPM Release` را با تگ انتشار، dist-tag مربوط به npm، و
   `preflight_run_id` ذخیره‌شده dispatch کنید.

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

ارتقای پایدار مستقیما به `latest` صریح است:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

از گردش‌کارهای سطح پایین‌تر `Plugin NPM Release` و `Plugin ClawHub Release`
فقط برای کار تعمیر یا انتشار مجدد متمرکز استفاده کنید. برای تعمیر یک Plugin انتخاب‌شده،
`plugin_publish_scope=selected` و `plugins=@openclaw/name` را به
`OpenClaw Release Publish` بدهید، یا وقتی بسته OpenClaw نباید منتشر شود،
گردش‌کار فرزند را مستقیم dispatch کنید.

## ورودی‌های گردش‌کار NPM

`OpenClaw NPM Release` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `tag`: تگ انتشار الزامی مانند `v2026.4.2`، `v2026.4.2-1`، یا
  `v2026.4.2-beta.1`؛ وقتی `preflight_only=true` باشد، برای preflight فقط-اعتبارسنجی
  می‌تواند SHA کامل ۴۰ کاراکتری commit شاخه گردش‌کار فعلی نیز باشد
- `preflight_only`: `true` برای فقط اعتبارسنجی/build/بسته، `false` برای مسیر انتشار واقعی
- `preflight_run_id`: در مسیر انتشار واقعی الزامی است تا گردش‌کار tarball آماده‌شده از اجرای preflight موفق را دوباره استفاده کند
- `npm_dist_tag`: تگ هدف npm برای مسیر انتشار؛ پیش‌فرض `beta` است

`OpenClaw Release Publish` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `tag`: تگ انتشار الزامی؛ باید از قبل وجود داشته باشد
- `preflight_run_id`: شناسه اجرای preflight موفق `OpenClaw NPM Release`؛
  وقتی `publish_openclaw_npm=true` باشد الزامی است
- `npm_dist_tag`: تگ هدف npm برای بسته OpenClaw
- `plugin_publish_scope`: پیش‌فرض `all-publishable` است؛ از `selected` فقط
  برای کار تعمیر متمرکز استفاده کنید
- `plugins`: نام‌های بسته `@openclaw/*` جداشده با ویرگول وقتی
  `plugin_publish_scope=selected` باشد
- `publish_openclaw_npm`: پیش‌فرض `true` است؛ فقط وقتی گردش‌کار را به‌عنوان هماهنگ‌کننده تعمیر فقط-Plugin استفاده می‌کنید، آن را `false` تنظیم کنید

`OpenClaw Release Checks` این ورودی‌های تحت کنترل operator را می‌پذیرد:

- `ref`: شاخه، تگ، یا SHA کامل commit برای اعتبارسنجی. بررسی‌های دارای secret
  نیاز دارند commit حل‌شده از یک شاخه OpenClaw یا تگ انتشار قابل دسترسی باشد.
- `run_release_soak`: اجرای کامل زنده/E2E، مسیر انتشار Docker، و
  soak بازمانده ارتقای all-since را در بررسی‌های انتشار پایدار/پیش‌فرض فعال کنید. با
  `release_profile=full` اجباری می‌شود.

قواعد:

- تگ‌های پایدار و اصلاحی می‌توانند به `beta` یا `latest` منتشر شوند
- تگ‌های پیش‌انتشار بتا فقط می‌توانند به `beta` منتشر شوند
- برای `OpenClaw NPM Release`، ورودی SHA کامل commit فقط وقتی مجاز است که
  `preflight_only=true` باشد
- `OpenClaw Release Checks` و `Full Release Validation` همیشه فقط-اعتبارسنجی هستند
- مسیر انتشار واقعی باید از همان `npm_dist_tag` استفاده کند که در preflight استفاده شده است؛
  گردش‌کار پیش از ادامه انتشار آن فراداده را بررسی می‌کند

## دنباله انتشار پایدار npm

هنگام آماده‌سازی یک انتشار پایدار npm:

1. `OpenClaw NPM Release` را با `preflight_only=true` اجرا کنید
   - پیش از وجود تگ، می‌توانید از SHA کامل commit شاخه گردش‌کار فعلی
     برای اجرای آزمایشی فقط-اعتبارسنجی گردش‌کار preflight استفاده کنید
2. برای جریان معمول ابتدا-بتا `npm_dist_tag=beta` را انتخاب کنید، یا فقط
   وقتی عمدا انتشار پایدار مستقیم می‌خواهید `latest` را انتخاب کنید
3. وقتی از یک گردش‌کار دستی، CI معمول به‌همراه پوشش live prompt cache، Docker، QA Lab،
   Matrix، و Telegram را می‌خواهید، `Full Release Validation` را روی شاخه انتشار، تگ انتشار، یا SHA کامل commit اجرا کنید
4. اگر عمدا فقط گراف آزمون عادی قطعی را نیاز دارید، به‌جای آن گردش‌کار دستی `CI` را
   روی ref انتشار اجرا کنید
5. `preflight_run_id` موفق را ذخیره کنید
6. `OpenClaw Release Publish` را با همان `tag`، همان `npm_dist_tag`،
   و `preflight_run_id` ذخیره‌شده اجرا کنید؛ این کار Pluginهای بیرونی‌شده را پیش از ارتقای بسته npm OpenClaw
   در npm و ClawHub منتشر می‌کند
7. اگر انتشار روی `beta` فرود آمد، از گردش‌کار خصوصی
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   برای ارتقای آن نسخه پایدار از `beta` به `latest` استفاده کنید
8. اگر انتشار عمدا مستقیما به `latest` منتشر شد و `beta`
   باید بلافاصله همان build پایدار را دنبال کند، از همان گردش‌کار خصوصی
   برای اشاره دادن هر دو dist-tag به نسخه پایدار استفاده کنید، یا بگذارید همگام‌سازی خودترمیم زمان‌بندی‌شده آن
   بعدا `beta` را جابه‌جا کند

تغییر dist-tag به‌دلایل امنیتی در repo خصوصی قرار دارد، چون همچنان
به `NPM_TOKEN` نیاز دارد، در حالی‌که repo عمومی انتشار فقط-OIDC را نگه می‌دارد.

این کار مسیر انتشار مستقیم و مسیر ارتقای ابتدا-بتا را هر دو
مستند و برای operator قابل مشاهده نگه می‌دارد.

اگر maintainer ناچار است به احراز هویت محلی npm برگردد، هر دستور 1Password
CLI (`op`) را فقط داخل یک جلسه tmux اختصاصی اجرا کنید. `op` را
مستقیما از shell اصلی agent فراخوانی نکنید؛ نگه‌داشتن آن داخل tmux باعث می‌شود promptها،
هشدارها، و رسیدگی OTP قابل مشاهده باشند و از هشدارهای تکراری host جلوگیری می‌کند.

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

maintainerها برای runbook واقعی از مستندات خصوصی انتشار در
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
استفاده می‌کنند.

## مرتبط

- [کانال‌های انتشار](/fa/install/development-channels)
