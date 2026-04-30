---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی یک اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
summary: گراف کارهای CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های دستورات محلی
title: خط لوله یکپارچه‌سازی مداوم
x-i18n:
    generated_at: "2026-04-30T18:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` تفاوت‌ها را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، مسیرهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند و کل گراف را برای نامزدهای انتشار و اعتبارسنجی گسترده منشعب می‌کنند. مسیرهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin ویژه انتشار در workflow جداگانه [`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از [`اعتبارسنجی کامل انتشار`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی خط لوله

| کار                              | هدف                                                                                      | زمان اجرا                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-مستندات، محدوده‌های تغییرکرده، extensionهای تغییرکرده، و ساخت مانیفست CI      | همیشه روی pushها و pull requestهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و حسابرسی workflow از طریق `zizmor`                                        | همیشه روی pushها و pull requestهای غیر draft |
| `security-dependency-audit`      | حسابرسی lockfile تولید بدون وابستگی در برابر هشدارهای npm                             | همیشه روی pushها و pull requestهای غیر draft |
| `security-fast`                  | تجمیع الزامی برای کارهای امنیتی سریع                                                | همیشه روی pushها و pull requestهای غیر draft |
| `check-dependencies`             | اجرای فقط-وابستگی Knip تولید به‌همراه نگهبان allowlist فایل‌های استفاده‌نشده                    | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifactهای ساخته‌شده، و artifactهای پایین‌دستی قابل استفاده مجدد          | تغییرات مرتبط با Node              |
| `checks-fast-core`               | مسیرهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                 | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded قرارداد کانال با نتیجه بررسی تجمیعی پایدار                         | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست هسته Node، به‌جز مسیرهای کانال، bundled، قرارداد، و extension             | تغییرات مرتبط با Node              |
| `check`                          | معادل sharded دروازه اصلی محلی: نوع‌های تولید، lint، نگهبان‌ها، نوع‌های تست، و smoke سخت‌گیرانه   | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای معماری، مرزبندی، نگهبان‌های سطح extension، مرز package، و gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke حافظه شروع به کار                                               | تغییرات مرتبط با Node              |
| `checks`                         | تاییدکننده تست‌های کانال artifact ساخته‌شده                                                    | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | مسیر ساخت و smoke سازگاری Node 22                                                   | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                | مستندات تغییر کرده‌اند                       |
| `skills-python`                  | Ruff + pytest برای skills مبتنی بر Python                                                       | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های ویژه Windows برای process/path به‌همراه regressionهای shared runtime import specifier         | تغییرات مرتبط با Windows           |
| `macos-node`                     | مسیر تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                  | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای برنامه macOS                                               | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌همراه یک ساخت debug APK                                 | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت مورد اعتماد                                    | موفقیت CI اصلی یا dispatch دستی |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام مسیرها وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` گام‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و matrix پلتفرم، سریع شکست می‌خورند.
3. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک شروع کنند.
4. مسیرهای سنگین‌تر پلتفرم و runtime پس از آن منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` انجام می‌شود، کارهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین اجرا برای همان ref نیز در حال شکست باشد، آن را نویز CI در نظر بگیرید. بررسی‌های تجمیعی shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان شکست‌های عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل superseded شده است در صف نمانند. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را برای مدت نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در جریان را cancel نمی‌کنند.

## محدوده و مسیریابی

منطق محدوده در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود مانیفست preflight طوری عمل کند که انگار همه بخش‌های scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** گراف CI مربوط به Node را به‌همراه lint کردن workflow اعتبارسنجی می‌کنند، اما به‌تنهایی ساخت‌های native مربوط به Windows، Android، یا macOS را اجبار نمی‌کنند؛ آن مسیرهای پلتفرمی همچنان به تغییرات source پلتفرم محدود می‌مانند.
- **ویرایش‌های فقط-مسیریابی CI، ویرایش‌های منتخب fixtureهای ارزان core-test، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از یک مسیر مانیفست سریع فقط-Node استفاده می‌کنند: `preflight`، امنیت، و یک task واحد `checks-fast-core`. وقتی تغییر محدود به سطح‌های مسیریابی یا helper باشد که task سریع مستقیما آن‌ها را اجرا می‌کند، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای کانال، shardهای کامل هسته، shardهای bundled-plugin، و matrixهای نگهبان اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path ویژه Windows، helperهای npm/pnpm/UI runner، پیکربندی package manager، و سطح‌های workflow CI که آن مسیر را اجرا می‌کنند محدود شده‌اند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-تست روی مسیرهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر کار بدون رزرو بیش‌ازحد runnerها کوچک بماند: قراردادهای کانال به‌صورت سه shard وزن‌دار اجرا می‌شوند، مسیرهای کوچک unit هسته جفت می‌شوند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود (با subtree پاسخ که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و پیکربندی‌های agentic gateway/plugin به‌جای انتظار برای artifactهای ساخته‌شده، بین کارهای agentic Node فقط-source موجود پخش می‌شوند. تست‌های گسترده browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های زمان‌بندی را با نام shard CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مرز package را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ shard نگهبان مرزی، نگهبان‌های کوچک مستقل خود را هم‌زمان داخل یک کار اجرا می‌کند. Gateway watch، تست‌های کانال، و shard support-boundary هسته پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند، به‌صورت هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

Android CI هر دو `testPlayDebugUnitTest` و `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ مسیر unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، درحالی‌که از یک کار تکراری بسته‌بندی debug APK روی هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies` دستور `pnpm deadcode:dependencies` (یک اجرای فقط-وابستگی Knip برای production که به آخرین نسخه Knip pin شده و minimum release age مربوط به pnpm برای نصب `dlx` در آن غیرفعال است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دستور دوم یافته‌های production unused-file در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. نگهبان unused-file زمانی شکست می‌خورد که یک PR یک فایل استفاده‌نشده جدید و بازبینی‌نشده اضافه کند یا یک ورودی stale در allowlist باقی بگذارد، درحالی‌که سطح‌های Plugin پویا، generated، build، live-test، و package bridge عمدی را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## dispatchهای دستی

dispatchهای دستی CI همان گراف کار CI عادی را اجرا می‌کنند اما هر مسیر scoped غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط با `include_android=true` مسیر Android را اجرا می‌کنند؛ umbrella کامل انتشار با ارسال `include_android=true`، Android را فعال می‌کند. بررسی‌های static پیش‌انتشار Plugin، shard ویژه انتشار `agentic-plugins`، sweep کامل batch مربوط به extension، و مسیرهای Docker پیش‌انتشار Plugin از CI مستثنا هستند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با دروازه release-validation فعال dispatch کند.

اجراهای دستی از یک گروه concurrency یکتا استفاده می‌کنند تا یک full suite برای نامزد انتشار با push یا اجرای PR دیگری روی همان ref cancel نشود. ورودی اختیاری `target_ref` به یک فراخوان مورد اعتماد اجازه می‌دهد آن گراف را در برابر یک branch، tag، یا SHA کامل commit اجرا کند، درحالی‌که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| اجراکننده                       | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و تجمیع‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/بسته‌شده، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و تجمیع‌های `check-additional`، راستی‌آزماهای تجمیعی آزمون Node، بررسی‌های مستندات، Skills پایتون، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke هم از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر در صف قرار بگیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر Plugin، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types` و `check-test-types`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای آزمون Node در Linux، شاردهای آزمون Pluginهای بسته‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به‌اندازه‌ای به CPU حساس است که 8 vCPU بیش از مقداری که صرفه‌جویی می‌کرد هزینه داشت)؛ buildهای Docker برای install-smoke (زمان صف 32-vCPU بیش از مقداری که صرفه‌جویی می‌کرد هزینه داشت)                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                    |

## معادل‌های محلی

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک شاخه، تگ، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف dispatch می‌کند، `Plugin Prerelease` را برای اثبات‌های فقط‌انتشارِ Plugin/بسته/ایستا/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix و مسیرهای Telegram dispatch می‌کند. همچنین وقتی مشخصات بسته منتشرشده ارائه شود، می‌تواند گردش‌کار پس از انتشار `NPM Telegram Beta E2E` را اجرا کند.

`release_profile` گستره live/provider ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند:

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده advisory provider/media را اجرا می‌کند.

این چتر شناسه‌های اجرای فرزند dispatchشده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را برای هر اجرای فرزند پیوست می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتری و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هم `Full Release Validation` و هم `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند full CI معمولی از `ci`، برای همه فرزندان انتشار از `release-checks`، یا از گروهی محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref مورداعتماد گردش‌کار استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball `release-package-under-test` تبدیل کند، سپس آن artifact را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به شارد package acceptance می‌دهد. این کار بایت‌های بسته را در جعبه‌های انتشار سازگار نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین کار فرزند جلوگیری می‌کند.

## شاردهای Live و E2E

فرزند live/E2E انتشار پوشش گسترده native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریالی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- کارهای provider-filtered `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شاردهای جداشده صوت/ویدئوی رسانه و شاردهای موسیقی provider-filtered

این کار همان پوشش فایل را نگه می‌دارد و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند providerهای live را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` همچنان برای اجرای دوباره دستی یک‌باره معتبر می‌مانند.

شاردهای رسانه native live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image از پیش `ffmpeg` و `ffprobe` را نصب می‌کند؛ کارهای رسانه فقط پیش از راه‌اندازی، باینری‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های live پشتیبانی‌شده با Docker را روی اجراکننده‌های معمولی Blacksmith نگه دارید؛ کارهای کانتینری جای مناسبی برای راه‌اندازی آزمون‌های Docker تودرتو نیستند.

شاردهای live مدل/backend پشتیبانی‌شده با Docker برای هر کامیت انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار live آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل live Docker، Gateway، backend CLI، bind کردن ACP، و harness Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. اگر آن شاردها هدف کامل Docker منبع را مستقل دوباره بسازند، اجرای انتشار پیکربندی نادرست دارد و زمان دیواری را برای ساخت‌های تکراری image هدر می‌دهد.

## Package Acceptance

وقتی پرسش این است که «آیا این بسته قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### کارها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact `package-under-test` بارگذاری می‌کند، و منبع، workflow ref، package ref، نسخه، SHA-256 و profile را در خلاصه گام GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده‌مجدد آن artifact را دانلود می‌کند، فهرست tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با package-digest را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، روی همان بسته اجرا می‌کند. وقتی یک profile چندین `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل‌استفاده‌مجدد بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` مقدار `none` نباشد اجرا می‌شود و اگر Package Acceptance یک بسته را resolve کرده باشد، همان artifact `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک مشخصات npm منتشرشده را نصب کند.
4. `summary` اگر resolve بسته، Docker acceptance، یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را ناموفق می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest` یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش بتا/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب یا SHA کامل commit مورد اعتماد در `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/برچسب‌های OpenClaw را واکشی می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه شاخه مخزن یا یک برچسب انتشار قابل دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما باید برای artifactهایی که بیرون از پروژه به اشتراک گذاشته می‌شوند ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/harness مورد اعتمادی است که تست را اجرا می‌کند. `package_ref` همان commit مبدأیی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این باعث می‌شود harness تست فعلی بتواند commitهای مبدأ قدیمی‌تر و مورد اعتماد را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه تست

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش آفلاین plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دردسترس‌بودن زنده ClawHub وابسته نباشد. مسیر اختیاری Telegram از artifact به نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، در حالی که مسیر مشخصات npm منتشرشده برای dispatchهای مستقل نگه داشته می‌شود.

بررسی‌های انتشار Package Acceptance را با `source=ref`، `package_ref=<release-ref>`، `workflow_ref=<release workflow ref>`، `suite_profile=custom`، `docker_lanes='bundled-channel-deps-compat plugins-offline'` و `telegram_mode=mock-openai` فراخوانی می‌کنند. قطعه‌های Docker مسیر انتشار مسیرهای هم‌پوشان package/update/plugin را پوشش می‌دهند؛ Package Acceptance سازگاری bundled-channel مبتنی بر artifact، plugin آفلاین، و اثبات Telegram را روی همان tarball بسته حل‌شده نگه می‌دارد. بررسی‌های انتشار Cross-OS همچنان onboarding، installer و رفتار platform وابسته به سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید از Package Acceptance شروع شود. مسیرهای تازه بسته‌بندی‌شده و installer در Windows همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام و مطلق Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4-mini` استفاده می‌کند، تا اثبات نصب و Gateway سریع و قطعی بماند.

### بازه‌های سازگاری قدیمی

Package Acceptance برای بسته‌های از قبل منتشرشده بازه‌های محدود سازگاری قدیمی دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است زیرحالت ماندگاری `gateway install --wrapper` را وقتی بسته آن flag را ارائه نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball حذف کند و ممکن است نبود `update.channel` ماندگارشده را log کند؛
- smokeهای plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود ماندگاری install-record مربوط به marketplace را بپذیرند؛
- `plugin-update` ممکن است migration فراداده config را مجاز بداند، در حالی که همچنان لازم است install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` همچنین ممکن است برای فایل‌های stamp فراداده build محلی که از قبل منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا ردشدن باعث شکست می‌شوند.

### مثال‌ها

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

هنگام اشکال‌زدایی یک اجرای ناموفق package acceptance، از خلاصه `resolve_package` شروع کنید تا مبدأ بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی‌های phase، و فرمان‌های اجرای دوباره. اجرای دوباره پروفایل بسته ناموفق یا laneهای دقیق Docker را به اجرای دوباره اعتبارسنجی کامل انتشار ترجیح دهید.

## Smoke نصب

workflow جداگانه `Install Smoke` از همان اسکریپت scope از طریق job خودش به نام `preflight` دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/package، تغییرات package/manifest مربوط به pluginهای bundled، یا سطح‌های core plugin/channel/gateway/Plugin SDK را که jobهای Docker smoke اجرا می‌کنند لمس می‌کنند. تغییرات فقط مبدأ در pluginهای bundled، ویرایش‌های فقط تست، و ویرایش‌های فقط مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image ریشه Dockerfile را یک بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به agents delete shared-workspace در CLI را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg مربوط به extension bundled را تأیید می‌کند، و پروفایل Docker محدود bundled-plugin را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته QR و پوشش Docker/update مربوط به installer را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی که واقعاً سطح‌های installer/package/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک image smoke هدفمند root Dockerfile در GHCR برای target-SHA را آماده یا دوباره استفاده می‌کند، سپس نصب بسته QR، smokeهای root Dockerfile/gateway، smokeهای installer/update، و Docker E2E سریع bundled-plugin را به‌عنوان jobهای جدا اجرا می‌کند تا کار installer پشت smokeهای image ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل بخواهد، workflow smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند image-provider مربوط به نصب سراسری Bun جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این smoke در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های Docker مربوط به QR و installer، Dockerfileهای نصب‌محور خودشان را حفظ می‌کنند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک بار به‌عنوان tarball npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner ساده Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image عملکردی که همان tarball را برای laneهای عملکردی عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` image هر lane را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع laneها برای جلوگیری از طوفان create در Docker daemon؛ برای نبود فاصله روی `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout جایگزین برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست دقیق laneها به‌صورت جداشده با ویرگول؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

Lane سنگین‌تر از سقف مؤثر خودش همچنان می‌تواند از یک pool خالی شروع شود، سپس تا وقتی ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflight تجمیعی محلی Docker را بررسی می‌کند، containerهای قدیمی OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب‌دهی longest-first ماندگار می‌کند، و به‌طور پیش‌فرض پس از اولین شکست زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### Workflow قابل استفاده دوباره live/E2E

workflow قابل استفاده دوباره live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد چه بسته، نوع image، image live، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک artifact بسته مربوط به اجرای فعلی را دانلود می‌کند، یا یک artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای بسته نصب‌شده نیاز داشته باشد، imageهای Docker E2E bare/functional در GHCR با برچسب package-digest را از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای build دوباره، از inputهای ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود package-digest استفاده می‌کند. pullهای image در Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره انجام می‌شوند تا جریان گیرکرده registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره تلاش شود.

### قطعه‌های مسیر انتشار

پوشش Docker انتشار jobهای کوچک‌تر و قطعه‌بندی‌شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر قطعه فقط همان نوع image مورد نیازش را pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

بخش‌های Docker نسخهٔ فعلی عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a` تا `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b` و `bundled-channels-contracts`. بخش تجمیعی `bundled-channels` همچنان برای اجرای مجدد دستی یک‌باره در دسترس است، و `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` همچنان نام‌های مستعار تجمیعی Plugin/زمان اجرا هستند. نام مستعار lane به نام `install-e2e` همچنان نام مستعار تجمیعی اجرای مجدد دستی برای هر دو lane نصب‌کنندهٔ ارائه‌دهنده است. بخش `bundled-channels` به‌جای lane ترتیبی همه‌چیزدر-یک `bundled-channel-deps`، laneهای جداشدهٔ `bundled-channel-*` و `bundled-channel-update-*` را اجرا می‌کند.

OpenWebUI وقتی پوشش کامل مسیر انتشار آن را درخواست کند، در `plugins-runtime-services` ادغام می‌شود و فقط برای dispatchهای مختص OpenWebUI یک بخش مستقل `openwebui` را نگه می‌دارد. laneهای به‌روزرسانی کانال‌های باندل‌شده برای خطاهای گذرای شبکهٔ npm یک بار دوباره تلاش می‌کنند.

هر بخش، `.artifacts/docker-tests/` را با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های فاز، JSON برنامهٔ زمان‌بند، جدول‌های laneهای کند، و دستورهای اجرای مجدد مخصوص هر lane بارگذاری می‌کند. ورودی `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای بخش‌ها روی imageهای آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک lane زندهٔ Docker باشد، job هدفمند image تست زنده را برای آن اجرای مجدد به‌صورت محلی می‌سازد. دستورهای تولیدشدهٔ اجرای مجدد GitHub برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name` و ورودی‌های image آماده‌شده هستند، تا یک lane ناموفق بتواند همان بسته و imageهای دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # artifactهای Docker را دانلود می‌کند و دستورهای اجرای مجدد هدفمند ترکیبی/مخصوص هر lane را چاپ می‌کند
pnpm test:docker:timings <summary>   # خلاصه‌های مسیر بحرانی laneهای کند و فازها
```

workflow زمان‌بندی‌شدهٔ زنده/E2E مجموعهٔ کامل Docker مسیر انتشار را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بستهٔ پرهزینه‌تری است، بنابراین یک workflow جداگانه است که توسط `Full Release Validation` یا یک اپراتور صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI این مجموعه را غیرفعال نگه می‌دارند. این مجموعه تست‌های Plugin باندل‌شده را میان هشت worker افزونه متعادل می‌کند؛ آن jobهای shard افزونه تا دو گروه پیکربندی Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import jobهای اضافی CI ایجاد نکنند.

## آزمایشگاه QA

QA Lab laneهای اختصاصی CI خارج از workflow اصلی با scope هوشمند دارد.

- workflow `Parity gate` روی تغییرات مطابق PR و dispatch دستی اجرا می‌شود؛ runtime خصوصی QA را می‌سازد و بسته‌های agentic ساختگی GPT-5.5 و Opus 4.6 را مقایسه می‌کند.
- workflow `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ gate برابری ساختگی، lane زندهٔ Matrix، و laneهای زندهٔ Telegram و Discord را به‌صورت jobهای موازی منشعب می‌کند. jobهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار laneهای انتقال زندهٔ Matrix و Telegram را با ارائه‌دهندهٔ ساختگی قطعی و مدل‌های واجد شرایط ساختگی (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده و راه‌اندازی عادی Plugin ارائه‌دهنده جدا شود. Gateway انتقال زنده جست‌وجوی حافظه را غیرفعال می‌کند زیرا برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال ارائه‌دهنده توسط مجموعه‌های جداگانهٔ مدل زنده، ارائه‌دهندهٔ بومی، و ارائه‌دهندهٔ Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. مقدار پیش‌فرض CLI و ورودی workflow دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای حیاتی انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن بسته‌های candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job کوچک گزارش دانلود می‌کند تا مقایسهٔ نهایی برابری انجام شود.

مسیر landing PR را پشت `Parity gate` قرار ندهید مگر اینکه تغییر واقعاً runtime QA، برابری model-pack، یا سطحی را لمس کند که workflow برابری مالک آن است. برای اصلاحات عادی کانال، پیکربندی، مستندات یا تست واحد، آن را به‌عنوان یک سیگنال اختیاری در نظر بگیرید و به‌جای آن از شواهد CI/بررسی scope‌شده پیروی کنید.

## CodeQL

workflow `CodeQL` عمداً یک اسکنر امنیتی محدودِ گذر اول است، نه sweep کامل مخزن. اجراهای روزانه، دستی، و guard مربوط به pull requestهای غیر draft، کد workflowهای Actions به‌علاوهٔ پرریسک‌ترین سطح‌های JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی محدود شده‌اند اسکن می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages` یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را مانند workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS از پیش‌فرض‌های PR خارج می‌ماند.

### دسته‌های امنیتی

| دسته                                              | سطح                                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، Cron، و baseline مربوط به Gateway                                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌علاوهٔ runtime Plugin کانال، Gateway، Plugin SDK، secrets، نقاط تماس audit                     |
| `/codeql-security-high/network-ssrf-boundary`     | سطح‌های core SSRF، parsing آدرس IP، guard شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای process، تحویل خروجی، و gateهای اجرای ابزار agent                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | سطح‌های اعتماد نصب Plugin، loader، manifest، registry، staging وابستگی runtime، بارگذاری source، و قرارداد بستهٔ Plugin SDK          |

### shardهای امنیتی ویژهٔ پلتفرم

- `CodeQL Android Critical Security` — shard زمان‌بندی‌شدهٔ امنیت Android. برنامهٔ Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که sanity workflow می‌پذیرد می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — shard هفتگی/دستی امنیت macOS. برنامهٔ macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج build وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است چون build مربوط به macOS حتی در حالت پاک، زمان اجرا را غالب می‌کند.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. این فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطح‌های محدود و پرارزش، روی runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. guard مربوط به pull request آن عمداً کوچک‌تر از profile زمان‌بندی‌شده است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار agent و dispatch پاسخ، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، runtime کانال core و Plugin کانال باندل‌شده، protocol/server-method در Gateway، glue مربوط به runtime حافظه/SDK، MCP/process/تحویل خروجی، runtime ارائه‌دهنده/کاتالوگ مدل، diagnostics نشست/صف‌های تحویل، loader Plugin، قرارداد Plugin SDK/package-contract، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و workflow کیفیت، هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profileهای محدود، hookهای آموزشی/تکرار برای اجرای یک shard کیفیت به‌صورت جداگانه هستند.

| دسته‌بندی                                             | سطح                                                                                                                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | احراز هویت، اسرار، sandbox، Cron، و کد مرز امنیتی Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | طرح‌واره پیکربندی، مهاجرت، نرمال‌سازی، و قراردادهای IO                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | طرح‌واره‌های پروتکل Gateway و قراردادهای متد سرور                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال‌های همراه                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های پاسخ خودکار، و قراردادهای runtime صفحه کنترل ACP                                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، نام‌های مستعار SDK مربوط به Plugin حافظه، چسب اتصال فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | بخش‌های داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطح‌های بسته رویداد/لاگ تشخیصی، و قراردادهای CLI مربوط به doctor نشست           |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی SDK مربوط به Plugin، کمک‌کننده‌های payload/قطعه‌بندی/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته          |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت runtime ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی اولیه UI کنترل، پایداری محلی، جریان‌های کنترل Gateway، و قراردادهای runtime صفحه کنترل task                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/جست‌وجوی وب هسته، IO رسانه، درک رسانه، تولید تصویر، و تولید رسانه                                                               |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypointهای SDK مربوط به Plugin                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع SDK منتشرشده در سمت بسته برای Plugin و کمک‌کننده‌های قرارداد بسته Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون پنهان کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای همراه فقط باید پس از پایدار شدن runtime و سیگنال پروفایل‌های باریک، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگهداری

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداری رویدادمحور Codex برای همسو نگه داشتن مستندات موجود با تغییرات تازه land شده است. زمان‌بندی خالص ندارد: یک اجرای موفق CI ناشی از push غیرربات روی `main` می‌تواند آن را تحریک کند، و dispatch دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای Docs Agent غیر-skipped دیگری در یک ساعت گذشته ساخته شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع اجرای Docs Agent غیر-skipped قبلی تا `main` فعلی بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل کارایی تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداری رویدادمحور Codex برای تست‌های کند است. زمان‌بندی خالص ندارد: یک اجرای موفق CI ناشی از push غیرربات روی `main` می‌تواند آن را تحریک کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی این دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش کارایی Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک کارایی تست را که پوشش را حفظ می‌کنند انجام دهد، نه refactorهای گسترده، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که تعداد baseline تست‌های پاس‌شده را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند خرابی‌های بدیهی را اصلاح کند و گزارش کل مجموعه پس از agent باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره امتحان می‌کند؛ patchهای stale دارای conflict skip می‌شوند. این مسیر از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگهدارنده برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر دادن GitHub، بررسی می‌کند که PR land شده merge شده باشد و هر تکراری یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییر‌یافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق محلی changed-lane در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی درباره مرزهای معماری از دامنه گسترده پلتفرم CI سخت‌گیرتر است:

- تغییرات production هسته، typecheck تولید هسته و تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-تست هسته، فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات production افزونه، typecheck تولید افزونه و تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط-تست افزونه، typecheck تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات عمومی SDK مربوط به Plugin یا قرارداد plugin به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (sweepهای Vitest برای افزونه همچنان کار تست صریح می‌مانند)؛
- افزایش نسخه فقط-فراداده release، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کند؛
- تغییرات root/config ناشناخته به‌صورت fail-safe به همه مسیرهای بررسی می‌روند.

مسیریابی تست تغییر‌یافته محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا از `check:changed` ارزان‌تر است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کند، ویرایش‌های source نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph را اجرا می‌کنند. پیکربندی تحویل group-room مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی message-tool از طریق تست‌های پاسخ هسته به‌علاوه regressionهای تحویل Discord و Slack مسیریابی می‌شوند تا یک تغییر پیش‌فرض مشترک پیش از نخستین push PR شکست بخورد. فقط وقتی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر سراسر harness باشد که مجموعه نگاشت‌شده ارزان proxy قابل‌اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از root مخزن اجرا کنید و برای proof گسترده یک box تازه warm شده را ترجیح دهید. پیش از صرف کردن یک دروازه کند روی boxای که دوباره استفاده شده، منقضی شده، یا همین حالا sync غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل box اجرا کنید.

بررسی sanity وقتی فایل‌های لازم root مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` حداقل ۲۰۰ حذف tracked نشان دهد، سریع fail می‌شود. این معمولا یعنی وضعیت sync راه‌دور نسخه قابل‌اعتمادی از PR نیست؛ به‌جای debug کردن خرابی تست محصول، آن box را متوقف کنید و یک box تازه warm کنید. برای PRهای عمدی با حذف‌های بزرگ، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین یک فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync می‌ماند، خاتمه می‌دهد. برای غیرفعال کردن آن guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار میلی‌ثانیه‌ای بزرگ‌تر استفاده کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
