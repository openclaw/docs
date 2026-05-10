---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - در حال هماهنگی اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: نمودار وظایف CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: پایپ‌لاین CI
x-i18n:
    generated_at: "2026-05-10T19:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` diff را دسته‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً محدوده‌بندی هوشمند را دور می‌زنند و کل گراف را برای نامزدهای انتشار و اعتبارسنجی گسترده منشعب می‌کنند. laneهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin ویژهٔ انتشار در workflow جداگانهٔ [`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از [`اعتبارسنجی کامل انتشار`](#full-release-validation) یا dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| کار                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-مستندات، محدوده‌های تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و ممیزی workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | ممیزی lockfile تولید بدون وابستگی در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | تجمیع الزامی برای کارهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | گذر فقط-وابستگی Knip برای تولید، به‌همراه guard فهرست مجاز فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifactهای ساخته‌شده، و artifactهای قابل‌استفادهٔ مجدد برای پایین‌دست                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های contract کانال به‌صورت shardشده با نتیجهٔ بررسی aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست هستهٔ Node، به‌جز laneهای کانال، bundled، contract و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت shardشده: typeهای prod، lint، guardها، typeهای تست، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مربوط به boundary/prompt به‌صورت shardشده، guardهای extension، boundary پکیج، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای built-CLI و smoke حافظهٔ startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های کانال built-artifact                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های شکسته                                                             | تغییر مستندات                       |
| `skills-python`                  | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | تست‌های process/path ویژهٔ Windows به‌همراه regressionهای specifier import runtime مشترک                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شدهٔ مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، ساخت، و تست‌ها برای app macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های واحد Android برای هر دو flavor به‌همراه ساخت یک APK debug                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانهٔ تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI اصلی یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با laneهای mock-provider، deep-profile، و GPT 5.4 زنده | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اساساً کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` گام‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و matrix پلتفرم سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دست به‌محض آماده‌شدن ساخت مشترک بتوانند شروع کنند.
4. پس از آن laneهای سنگین‌تر پلتفرم و runtime منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` قرار می‌گیرد، کارهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز fail شده باشد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما بعد از اینکه کل workflow از قبل superseded شده است در صف قرار نگیرند. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را به‌طور نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را cancel نمی‌کنند.

کار `ci-timings-summary` برای هر اجرای CI غیر draft یک artifact فشردهٔ `ci-timings-summary` بارگذاری می‌کند. این artifact زمان wall، زمان صف، کندترین کارها، و کارهای failشده برای اجرای فعلی را ثبت می‌کند، بنابراین بررسی‌های سلامت CI نیازی ندارند payload کامل Actions را مکرراً scrape کنند.

## محدوده و routing

منطق محدوده در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار همهٔ بخش‌های scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** گراف CI مربوط به Node و linting workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android یا macOS را اجبار نمی‌کنند؛ آن laneهای پلتفرم همچنان به تغییرات source پلتفرم scoped می‌مانند.
- **ویرایش‌های فقط-routing مربوط به CI، ویرایش‌های منتخب و ارزان fixture برای core-test، و ویرایش‌های محدود helper/test-routing مربوط به contract Plugin** از مسیر manifest سریع فقط-Node استفاده می‌کنند: `preflight`، امنیت، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیماً تمرین می‌کند محدود باشد، آن مسیر build artifactها، سازگاری Node 22، contractهای کانال، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Node در Windows** به wrapperهای process/path ویژهٔ Windows، helperهای runner مربوط به npm/pnpm/UI، config مدیر پکیج، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-تست روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر کار بدون over-reserve کردن runnerها کوچک بماند: contractهای کانال به‌صورت سه shard وزن‌دار و پشتیبانی‌شده با Blacksmith و fallback استاندارد runner GitHub اجرا می‌شوند، laneهای fast/support مربوط به واحد core جداگانه اجرا می‌شوند، زیرساخت runtime مربوط به core بین shardهای state، process/config، cron، و shared تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای gateway/server عامل‌محور به‌جای انتظار برای built artifactها بین laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. تست‌های گستردهٔ مرورگر، QA، media، و Pluginهای متفرقه از configهای اختصاصی Vitest خود استفاده می‌کنند، نه catch-all مشترک Plugin. shardهای include-pattern ورودی‌های زمان‌بندی را با نام shard مربوط به CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از shard فیلترشده تمایز دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guard مربوط به boundary در چهار shard matrix نواری شده است، که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و زمان‌بندی هر بررسی را چاپ می‌کنند. بررسی پرهزینهٔ drift مربوط به snapshot prompt مسیر خوش Codex به‌عنوان کار additional خودش فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و shardهای boundary متوازن باقی می‌مانند، در حالی که prompt drift همچنان به PR ایجادکنندهٔ آن pin می‌شود؛ همان flag تولید Vitest مربوط به snapshot prompt را داخل shard core support-boundary مربوط به built-artifact رد می‌کند. Gateway watch، تست‌های کانال، و shard core support-boundary هم‌زمان داخل `build-artifacts` پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص‌ثالث source set یا manifest جداگانه ندارد؛ lane تست واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، در حالی که از یک کار بسته‌بندی APK debug تکراری روی هر push مرتبط با Android پرهیز می‌کند.

shard مربوط به `check-dependencies` فرمان `pnpm deadcode:dependencies` (یک گذر فقط-وابستگی Knip برای تولید که به آخرین نسخهٔ Knip pin شده و minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشدهٔ تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده زمانی fail می‌شود که یک PR فایل استفاده‌نشدهٔ جدید و بررسی‌نشده اضافه کند یا یک ورودی stale در allowlist باقی بگذارد، در حالی که سطح‌های intentional مربوط به Plugin پویا، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت هدف از فعالیت repository OpenClaw به ClawSweeper است. این workflow کد untrusted مربوط به pull request را checkout یا اجرا نمی‌کند. workflow یک token مربوط به GitHub App را از `CLAWSWEEPER_APP_PRIVATE_KEY` می‌سازد، سپس payloadهای فشردهٔ `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review issue و pull request؛
- `clawsweeper_comment` برای فرمان‌های صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

lane مربوط به `github_activity` فقط metadata نرمال‌سازی‌شده را forward می‌کند: نوع event، action، actor، repository، شمارهٔ item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها وقتی وجود داشته باشند. این lane عمداً از forward کردن کل بدنهٔ Webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر با `.github/workflows/github-activity.yml` است، که event نرمال‌سازی‌شده را به hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper ارسال می‌کند.

فعالیت عمومی observation است، نه تحویل به‌صورت پیش‌فرض. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و باید فقط وقتی event غافلگیرکننده، actionable، risky، یا از نظر عملیاتی مفید است در `#clawsweeper` پست کند. بازکردن‌ها، ویرایش‌ها، churn مربوط به bot، نویز Webhook تکراری، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

عنوان‌ها، دیدگاه‌ها، بدنه‌ها، متن‌های بازبینی، نام شاخه‌ها و پیام‌های commit در GitHub را در سراسر این مسیر داده‌های نامطمئن در نظر بگیرید. آن‌ها ورودی‌هایی برای خلاصه‌سازی و triage هستند، نه دستورهایی برای گردش‌کار یا runtime عامل.

## dispatchهای دستی

dispatchهای دستی CI همان گراف job را مانند CI عادی اجرا می‌کنند، اما همه laneهای scope‌شده غیر Android را اجباری فعال می‌کنند: shardهای Linux Node، shardهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط وقتی Android را اجرا می‌کنند که `include_android=true` باشد؛ چتر انتشار کامل با ارسال `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای prerelease مربوط به Plugin، shard فقط-انتشار `agentic-plugins`، sweep کامل دسته‌ای extensionها، و laneهای Docker مربوط به prerelease Plugin از CI مستثنا هستند. مجموعه prerelease مربوط به Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش‌کار جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجرای دستی از یک گروه concurrency یکتا استفاده می‌کند تا مجموعه کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوان مورد اعتماد اجازه می‌دهد آن گراف را روی یک شاخه، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل گردش‌کار ref انتخاب‌شده برای dispatch استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                         | Jobها                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/بسته‌بندی‌شده، بررسی‌های sharded قرارداد کانال، shardهای `check` به‌جز lint، aggregateهای `check-additional`، verifierهای aggregate تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا matrix مربوط به Blacksmith زودتر وارد queue شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای کم‌وزن‌تر extension، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke، shardهای تست Linux Node، shardهای تست Plugin بسته‌بندی‌شده، shardهای `check-additional`، `android`                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`، `check-lint` (به‌اندازه‌ای به CPU حساس است که 8 vCPU بیش از صرفه‌جویی، هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان queue برای 32-vCPU بیش از صرفه‌جویی، هزینه داشت)                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                            |

CI مخزن canonical مسیر Blacksmith را به‌عنوان مسیر پیش‌فرض اجراکننده نگه می‌دارد. در طول `preflight`، `scripts/ci-runner-labels.mjs` اجرای‌های اخیر queued و in-progress در Actions را برای jobهای queued مربوط به Blacksmith بررسی می‌کند. اگر یک label مشخص Blacksmith از قبل jobهای queued داشته باشد، jobهای downstream که از همان label دقیق استفاده می‌کردند، فقط برای همان اجرا به اجراکننده میزبانی‌شده متناظر در GitHub (`ubuntu-24.04`، `windows-2025`، یا `macos-latest`) fallback می‌کنند. اندازه‌های دیگر Blacksmith در همان خانواده OS روی labelهای اصلی خود باقی می‌مانند. اگر probe مربوط به API شکست بخورد، هیچ fallbackی اعمال نمی‌شود.

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## عملکرد OpenClaw

`OpenClaw Performance` گردش‌کار عملکرد محصول/runtime است. این گردش‌کار هر روز روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولا ref گردش‌کار را benchmark می‌کند. برای benchmark کردن یک tag انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای report منتشرشده و pointerهای latest بر اساس ref تست‌شده کلیدگذاری می‌شوند، و هر `index.md` ref/SHA تست‌شده، ref/SHA گردش‌کار، ref مربوط به Kova، profile، حالت احراز هویت lane، مدل، شمار تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار pin‌شده و Kova را از `openclaw/Kova` در ورودی pin‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic مربوط به Kova در برابر یک runtime ساخت محلی با احراز هویت جعلی سازگار با OpenAI و deterministic.
- `mock-deep-profile`: profileگیری CPU/heap/trace برای hotspotهای startup، gateway، و agent-turn.
- `live-gpt54`: یک agent turn واقعی OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد skip می‌شود.

lane مربوط به mock-provider پس از گذر Kova، probeهای native منبع OpenClaw را نیز اجرا می‌کند: زمان boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook، و 50-Plugin؛ حلقه‌های hello تکراری mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های startup مربوط به CLI در برابر gateway bootشده. خلاصه Markdown مربوط به source probe در bundle گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، گردش‌کار همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. pointer فعلی ref تست‌شده به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتر دستی برای «اجرای همه‌چیز پیش از انتشار» است. این گردش‌کار یک شاخه، tag، یا SHA کامل commit می‌پذیرد، گردش‌کار دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای proof مخصوص انتشار در زمینه Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های package میان‌سیستمی، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجرای‌های stable/default پوشش جامع live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` آن پوشش soak را اجباری فعال می‌کند تا اعتبارسنجی advisory گسترده همچنان گسترده بماند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، برای اجرای دوباره همان lane package مربوط به Telegram در برابر package منتشرشده npm، `npm_telegram_package_spec` را ارسال کنید.

برای matrix مرحله‌ها، نام‌های دقیق job گردش‌کار، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار انتشار دستی و تغییردهنده است. آن را پس از وجود tag انتشار و پس از موفقیت preflight مربوط به npm در OpenClaw، از `release/YYYY.M.D` یا `main` dispatch کنید. این گردش‌کار `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همه packageهای قابل انتشار Plugin dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای
`gh workflow run ... --ref main -f ref=<sha>` از کمک‌کننده استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

رفرنس‌های dispatch در workflowهای GitHub باید شاخه یا tag باشند، نه SHAهای خام commit. این کمک‌کننده یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از همان ref پین‌شده dispatch می‌کند، بررسی می‌کند که `headSha` هر workflow فرزند با هدف یکی باشد، و پس از تکمیل اجرا شاخه موقت را حذف می‌کند. تأییدکننده چتری نیز اگر هر workflow فرزند روی SHA متفاوتی اجرا شده باشد، شکست می‌خورد.

`release_profile` گستره live/provider را که به بررسی‌های انتشار داده می‌شود کنترل می‌کند. workflowهای انتشار دستی به‌طور پیش‌فرض `stable` هستند؛ فقط وقتی از `full` استفاده کنید که عمداً matrix گسترده provider/media مشورتی را می‌خواهید. `run_release_soak` کنترل می‌کند که آیا بررسی‌های انتشار stable/default، soak کامل live/E2E و مسیر انتشار Docker را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه stable provider/backend را اضافه می‌کند.
- `full` matrix گسترده provider/media مشورتی را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job تأییدکننده والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای release candidate از `all`، فقط برای فرزند CI کامل معمولی از `ci`، فقط برای فرزند پیش‌انتشار plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک lane ناموفق cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر phase هستند. laneهای بررسی انتشار QA مشورتی هستند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما تأییدکننده بررسی انتشار را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref معتبر workflow استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball با نام `release-package-under-test` تبدیل کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance، به‌همراه workflow زنده/E2E مسیر انتشار Docker هنگام اجرای پوشش soak، می‌دهد. این کار بایت‌های package را در همه جعبه‌های انتشار یکسان نگه می‌دارد و از pack دوباره همان candidate در چندین job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را supersede می‌کنند. مانیتور والد هر workflow فرزندی را که قبلاً dispatch کرده باشد هنگام لغو والد لغو می‌کند، بنابراین validation جدید main پشت یک اجرای کهنه دو ساعته release-check منتظر نمی‌ماند. validation شاخه/tag انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای Live و E2E

فرزند release live/E2E پوشش گسترده native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریال، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای provider-filtered `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداشده audio/video رسانه و shardهای music فیلترشده بر اساس provider

این کار همان پوشش فایل را نگه می‌دارد و در عین حال اجرای دوباره و تشخیص شکست‌های کند provider زنده را آسان‌تر می‌کند. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای اجرای دوباره دستی یک‌باره معتبر می‌مانند.

shardهای native live media در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط workflow `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از قبل نصب می‌کند؛ jobهای رسانه فقط پیش از setup، binaryها را بررسی می‌کنند. suiteهای live مبتنی بر Docker را روی runnerهای معمولی Blacksmith نگه دارید — jobهای container جای درستی برای اجرای تست‌های Docker تودرتو نیستند.

shardهای live model/backend مبتنی بر Docker از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. workflow live release آن image را یک‌بار build و push می‌کند، سپس shardهای Docker live model، gateway فیلترشده بر اساس provider، CLI backend، bind در ACP، و Codex harness با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Gateway Docker سقف‌های صریح `timeout` در سطح script را پایین‌تر از timeout job workflow دارند تا container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check، سریع شکست بخورد. اگر آن shardها هدف Docker منبع کامل را مستقل دوباره build کنند، اجرای انتشار بد پیکربندی شده و زمان واقعی را روی buildهای تکراری image هدر می‌دهد.

## Package Acceptance

وقتی سؤال این است که «آیا این package قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی متفاوت است: CI معمولی source tree را validate می‌کند، درحالی‌که package acceptance یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند validate می‌کند.

### Jobها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک package candidate را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و source، workflow ref، package ref، version، SHA-256، و profile را در خلاصه step در GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow قابل‌استفاده‌مجدد آن artifact را download می‌کند، inventory tarball را validate می‌کند، در صورت نیاز imageهای Docker با package-digest آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای pack کردن workflow checkout، روی همان package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، workflow قابل‌استفاده‌مجدد package و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و همان artifact `package-under-test` را وقتی Package Acceptance یکی را resolve کرده باشد نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر package resolution، Docker acceptance، یا lane اختیاری Telegram شکست خورده باشد workflow را fail می‌کند.

### منابع candidate

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای acceptance پیش‌انتشار/stable منتشرشده استفاده کنید.
- `source=ref` یک شاخه، tag، یا SHA کامل commit از `package_ref` معتبر را pack می‌کند. resolver شاخه‌ها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از history شاخه repository یا یک tag انتشار قابل‌دسترسی باشد، deps را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url` یک `.tgz` از HTTPS download می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد معتبر workflow/harness است که تست را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد pack می‌شود. این امکان را می‌دهد که harness تست فعلی، commitهای منبع معتبر قدیمی‌تر را بدون اجرای منطق قدیمی workflow validate کند.

### Profileهای suite

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `skill-install`، `update-corrupt-plugin`، `upgrade-survivor`، `published-upgrade-survivor`، `update-restart-auth`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

profile `package` از پوشش offline plugin استفاده می‌کند تا validation package منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. lane اختیاری Telegram از artifact `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، درحالی‌که مسیر spec منتشرشده npm برای dispatchهای مستقل نگه داشته می‌شود.

برای سیاست اختصاصی تست update و plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و تریاژ شکست،
[تست updateها و pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، Package Acceptance را با `source=artifact`، artifact آماده package انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار migration package، update، نصب skill زنده ClawHub، cleanup وابستگی stale-plugin، repair نصب configured-plugin، offline plugin، plugin-update، و اثبات Telegram را روی همان tarball package resolve‌شده نگه می‌دارد. `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix را به‌جای artifact ساخته‌شده از SHA، روی یک package npm منتشرشده اجرا کند. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار platform مخصوص OS را پوشش می‌دهند؛ validation محصول package/update باید با Package Acceptance شروع شود. lane Docker با نام `published-upgrade-survivor` در مسیر انتشار blocking، در هر اجرا یک baseline package منتشرشده را validate می‌کند. در Package Acceptance، tarball resolve‌شده `package-under-test` همیشه candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره lane ناموفق آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در چهار انتشار stable اخیر npm به‌علاوه انتشارهای مرزی پین‌شده سازگاری plugin و fixtureهای issue-shaped برای config مربوط به Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های پیکربندی‌شده plugin OpenClaw، مسیرهای log با tilde، و rootهای قدیمی stale legacy plugin dependency گسترش یابد. انتخاب‌های published-upgrade survivor با چند baseline، بر اساس baseline به jobهای runner Docker هدفمند جداگانه shard می‌شوند. workflow جداگانه `Update Migration` وقتی استفاده می‌شود که سؤال، cleanup کامل update منتشرشده باشد، نه گستره معمول Full Release CI؛ این workflow از lane Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند specهای دقیق package را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک lane واحد مانند `openclaw@2026.4.15` را نگه دارند، یا برای matrix سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با یک recipe آماده از فرمان `openclaw config set` پیکربندی می‌کند، stepهای recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌همراه وضعیت RPC را probe می‌کند. laneهای fresh نصب و packaged ویندوز همچنین بررسی می‌کنند که یک package نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام مطلق ویندوز import کند. smoke مربوط به agent-turn در OpenAI cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی مدل تست GPT-5 بماند و در عین حال از پیش‌فرض‌های GPT-4.x جلوگیری شود.

### پنجره‌های سازگاری با نسخه‌های قدیمی

پذیرش بسته برای بسته‌هایی که قبلاً منتشر شده‌اند، پنجره‌های محدود سازگاری با نسخه‌های قدیمی دارد. بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است وقتی بسته آن پرچم را ارائه نمی‌کند، زیرمورد ماندگاری `gateway install --wrapper` را نادیده بگیرد؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball هرس کند و ممکن است `update.channel` ماندگارشده‌ی گم‌شده را گزارش کند؛
- دودآزمایی‌های plugin ممکن است مکان‌های قدیمی رکورد نصب را بخوانند یا نبود ماندگاری رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فراداده پیکربندی را مجاز کند، در حالی که همچنان الزام می‌کند رکورد نصب و رفتار بدون نصب دوباره بدون تغییر بمانند.

بسته منتشرشده‌ی `2026.4.26` نیز ممکن است برای فایل‌های مُهر فراداده ساخت محلی که از قبل منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا نادیده‌گرفتن، شکست می‌خورند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی‌های phase، و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، اجرای دوباره پروفایل بسته ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## دودآزمایی نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود بازاستفاده می‌کند. این گردش‌کار پوشش دودآزمایی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطوح Docker/بسته، تغییرات بسته/manifest مربوط به pluginهای bundled، یا سطوح Plugin SDK هسته‌ای plugin/channel/gateway را لمس می‌کنند که jobهای دودآزمایی Docker آن‌ها را تمرین می‌دهند. تغییرات فقط-منبع در pluginهای bundled، ویرایش‌های فقط-آزمون، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودآزمایی CLI مربوط به agents delete shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg برای extension bundled را راستی‌آزمایی می‌کند، و پروفایل bounded bundled-plugin Docker را تحت timeout تجمعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته QR و پوشش Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطوح نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image دودآزمایی GHCR برای Dockerfile ریشه با target-SHA واحد را آماده یا بازاستفاده می‌کند، سپس نصب بسته QR، دودآزمایی‌های Dockerfile ریشه/gateway، دودآزمایی‌های installer/update، و E2E سریع Docker برای bundled-plugin را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت دودآزمایی‌های image ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق changed-scope در یک push پوشش کامل درخواست کند، گردش‌کار دودآزمایی سریع Docker را نگه می‌دارد و دودآزمایی کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودآزمایی کند Bun global install image-provider جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این مورد در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عملکرد معمول در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط برنامه انتخاب‌شده را اجرا می‌کند. زمان‌بند image را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل‌تنظیم‌ها

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای استخر اصلی برای laneهای معمول.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای استخر tail حساس به provider.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای هم‌زمان نصب npm.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع laneها برای جلوگیری از هجوم create در Docker daemon؛ برای بدون فاصله روی `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout جایگزین برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` برنامه زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده ویرگول؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

laneیی که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک استخر خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند تنها اجرا می‌شود. preflightهای تجمعی محلی Docker را بررسی می‌کنند، containerهای قدیمی OpenClaw E2E را حذف می‌کنند، وضعیت lane فعال را منتشر می‌کنند، زمان‌بندی‌های lane را برای ترتیب‌دهی طولانی‌ترین-اول ماندگار می‌کنند، و به‌طور پیش‌فرض پس از نخستین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### گردش‌کار live/E2E قابل‌بازاستفاده

گردش‌کار live/E2E قابل‌بازاستفاده از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که چه بسته، نوع image، image live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن برنامه را به outputها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک artifact بسته از اجرای جاری را دانلود می‌کند، یا یک artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی برنامه به laneهای دارای بسته نصب‌شده نیاز دارد، imageهای GHCR Docker E2E از نوع bare/functional با tag digest بسته را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، inputهای `docker_e2e_bare_image`/`docker_e2e_functional_image` ارائه‌شده یا imageهای موجود با digest بسته را بازاستفاده می‌کند. pullهای image در Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا stream گیرکرده‌ی registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره امتحان شود.

### chunkهای مسیر انتشار

پوشش Docker انتشار، jobهای chunkشده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیاز خود را pull کند و چند lane را از طریق همان زمان‌بند weighted اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` به‌عنوان aliasهای تجمعی plugin/runtime باقی می‌مانند. alias lane مربوط به `install-e2e` همچنان alias اجرای دوباره دستی تجمعی برای هر دو lane نصب‌کننده provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مخصوص OpenWebUI یک chunk مستقل `openwebui` را نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای شکست‌های گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON برنامه زمان‌بند، جدول‌های slow-lane، و فرمان‌های اجرای دوباره برای هر lane آپلود می‌کند. input مربوط به `docker_lanes` در گردش‌کار، laneهای انتخاب‌شده را به‌جای jobهای chunk روی imageهای آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر یک lane انتخاب‌شده، lane live Docker باشد، job هدفمند برای آن اجرای دوباره image مربوط به live-test را به‌صورت محلی می‌سازد. فرمان‌های GitHub تولیدشده برای اجرای دوباره هر lane شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده‌شده هستند، وقتی این مقادیر وجود داشته باشند، تا یک lane ناموفق بتواند دقیقاً همان بسته و imageهای اجرای ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده live/E2E هر روز مجموعه کامل Docker مربوط به release-path را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای معمول، pushهای `main`، و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این گردش‌کار آزمون‌های pluginهای bundled را بین هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension هم‌زمان تا دو گروه پیکربندی plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای plugin پرimport، jobهای اضافی CI نسازند. مسیر prerelease فقط-انتشار Docker، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری کند.

## آزمایشگاه QA

آزمایشگاه QA laneهای اختصاصی CI خارج از گردش‌کار اصلی smart-scoped دارد. برابری agentic زیر harnessهای گسترده QA و انتشار قرار می‌گیرد، نه یک گردش‌کار مستقل PR. وقتی برابری باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این گردش‌کار lane برابری mock، lane live Matrix، و laneهای live Telegram و Discord را به‌عنوان jobهای موازی منشعب می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از اجاره‌های Convex استفاده می‌کنند.

بررسی‌های انتشار، مسیرهای انتقال زنده Matrix و Telegram را با ارائه‌دهنده ساختگی قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تاخیر مدل زنده و راه‌اندازی معمول Plugin ارائه‌دهنده جدا بماند. Gateway انتقال زنده جست‌وجوی حافظه را غیرفعال می‌کند، چون هم‌ارزی QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال‌پذیری ارائه‌دهنده توسط مجموعه‌های جداگانه مدل زنده، ارائه‌دهنده بومی، و ارائه‌دهنده Docker پوشش داده می‌شود.

Matrix برای دروازه‌های زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkoutشده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` است؛ اجرای دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` تقسیم می‌کند.

`OpenClaw Release Checks` همچنین پیش از تایید انتشار، مسیرهای حیاتی انتشار QA Lab را اجرا می‌کند؛ دروازه هم‌ارزی QA آن بسته‌های نامزد و مبنا را به‌صورت jobهای مسیر موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک دانلود می‌کند تا مقایسه نهایی هم‌ارزی انجام شود.

برای PRهای معمول، به‌جای ضروری دانستن هم‌ارزی به‌عنوان وضعیت لازم، از شواهد CI/بررسی محدوده‌دار پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمدا یک اسکنر امنیتی گذر اول و محدود است، نه پیمایش کامل مخزن. اجراهای نگهبان روزانه، دستی، و درخواست pull غیردرفت، کد گردش‌کار Actions به‌علاوه پرخطرترین سطوح JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

نگهبان درخواست pull سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را که گردش‌کار زمان‌بندی‌شده اجرا می‌کند، اجرا می‌کند. CodeQLهای Android و macOS در پیش‌فرض‌های PR قرار نمی‌گیرند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، cron، و مبنای gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه runtime Plugin کانال، gateway، Plugin SDK، اسرار، و نقاط تماس audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF هسته، تجزیه IP، محافظ شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری منبع، و قرارداد بسته Plugin SDK                |

### shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که sanity گردش‌کار می‌پذیرد، به‌صورت دستی build می‌کند. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی build می‌کند، نتایج build وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده است چون build macOS حتی وقتی پاک باشد بر زمان اجرا غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح محدود و پرارزش در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. نگهبان درخواست pull آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیردرفت فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای کد اجرای فرمان/مدل/ابزار agent و ارسال پاسخ، کد schema/migration/IO پیکربندی، کد احراز هویت/اسرار/sandbox/امنیت، runtime کانال هسته و Plugin کانال همراه، protocol/server-method مربوط به gateway، چسب runtime/SDK حافظه، MCP/فرایند/تحویل خروجی، runtime ارائه‌دهنده/کاتالوگ مدل، صف‌های تشخیص/تحویل session، loader Plugin، قرارداد Plugin SDK/package، یا تغییرات runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت هر دوازده shard کیفیت PR را اجرا می‌کنند.

اجرای دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، hookهای آموزش/تکرار برای اجرای یک shard کیفیت به‌صورت جداگانه هستند.

| دسته                                                  | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، cron، و gateway                                                                                                       |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization، و IO پیکربندی                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای protocol مربوط به Gateway و قراردادهای روش سرور                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال همراه                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای runtime اجرای فرمان، dispatch مدل/ارائه‌دهنده، dispatch و صف‌های پاسخ خودکار، و control-plane مربوط به ACP                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و bridgeهای ابزار، helperهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، چسب فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل session، helperهای binding/تحویل session خروجی، سطوح bundle رویداد/گزارش تشخیصی، و قراردادهای CLI مربوط به doctor session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، helperهای payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و helperهای binding session/thread               |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، احراز هویت و discovery ارائه‌دهنده، ثبت runtime ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و registryهای web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، پایداری محلی، جریان‌های کنترل gateway، و قراردادهای runtime مربوط به control-plane وظیفه                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب هسته، media IO، درک رسانه، image-generation، و media-generation                                                     |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypointهای Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK در سمت بسته منتشرشده و helperهای قرارداد بسته Plugin                                                                                            |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند، بدون اینکه سیگنال امنیتی را مبهم کنند. گسترش CodeQL برای Swift، Python، و Pluginهای همراه باید فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری محدوده‌دار یا shardشده دوباره اضافه شود.

## گردش‌کارهای نگهداری

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداری Codex رویدادمحور برای همسو نگه داشتن مستندات موجود با تغییرات تازه landشده است. برنامه‌زمان‌بندی خالص ندارد: اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را trigger کند، و اجرای دستی می‌تواند آن را مستقیما اجرا کند. invocationهای workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای Docs Agent غیراسکیپ‌شده دیگری در یک ساعت گذشته ساخته شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع Docs Agent غیراسکیپ‌شده قبلی تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main را که از آخرین گذر مستندات جمع شده‌اند پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداری Codex رویدادمحور برای تست‌های کند است. برنامه‌زمان‌بندی خالص ندارد: اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. اجرای دستی این دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای مجموعه کامل می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست با حفظ پوشش را به‌جای refactorهای گسترده انجام دهد، سپس گزارش مجموعه کامل را دوباره اجرا می‌کند و تغییراتی را که تعداد baseline تست‌های پاس‌شده را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند failureهای واضح را اصلاح کند و گزارش مجموعه کامل پس از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل docs agent حفظ کند.

### PRهای تکراری پس از merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر GitHub، بررسی می‌کند که PR landشده merge شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییریافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی درباره مرزهای معماری از محدوده گسترده پلتفرم CI سخت‌گیرتر است:

- تغییرات تولیدی هسته، بررسی نوع تولید و آزمون هسته، به‌همراه لینت/نگهبان‌های هسته را اجرا می‌کنند؛
- تغییرات فقط‌آزمون هسته، فقط بررسی نوع آزمون هسته، به‌همراه لینت هسته را اجرا می‌کنند؛
- تغییرات تولیدی افزونه، بررسی نوع تولید و آزمون افزونه، به‌همراه لینت افزونه را اجرا می‌کنند؛
- تغییرات فقط‌آزمون افزونه، بررسی نوع آزمون افزونه، به‌همراه لینت افزونه را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به بررسی نوع افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (جاروب‌های افزونه Vitest همچنان کار آزمون صریح باقی می‌مانند)؛
- افزایش نسخه‌های فقط‌فراداده انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته ریشه/پیکربندی برای ایمنی به همه مسیرهای بررسی می‌افتند.

مسیریابی محلی آزمون‌های تغییرکرده در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم آزمون، خودشان را اجرا می‌کنند؛ ویرایش‌های منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهند، سپس آزمون‌های هم‌سطح و وابستگان گراف import را. پیکربندی تحویل اتاق گروهی مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا اعلان سیستمی ابزار پیام از مسیر آزمون‌های پاسخ هسته به‌همراه پسرفت‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push در PR شکست بخورد. فقط زمانی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر در کل harness گسترده باشد که مجموعه نگاشت‌شده ارزان، نماینده قابل اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشه مخزن اجرا کنید و برای اثبات گسترده، یک باکس گرم‌شده تازه را ترجیح دهید. پیش از صرف زمان روی یک gate کند برای باکسی که دوباره استفاده شده، منقضی شده، یا به‌تازگی sync غیرمنتظره بزرگی گزارش کرده است، ابتدا داخل باکس `pnpm testbox:sanity` را اجرا کنید.

بررسی sanity وقتی فایل‌های ریشه لازم مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف رهگیری‌شده نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت sync راه‌دور کپی قابل اعتمادی از PR نیست؛ آن باکس را متوقف کنید و به‌جای اشکال‌زدایی شکست آزمون محصول، یک باکس تازه گرم کنید. برای PRهای عمدی با حذف‌های زیاد، برای همان اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync بماند، خاتمه می‌دهد. برای غیرفعال‌کردن این نگهبان، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه به‌کار ببرید.

Crabbox پوشش راه‌دور متعلق به مخزن برای اثبات Linux نگه‌دارنده است. وقتی یک بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی با CI مهم است، یا وقتی اثبات به secrets، Docker، مسیرهای بسته، باکس‌های قابل استفاده مجدد، یا گزارش‌های راه‌دور نیاز دارد، از آن استفاده کنید. backend عادی OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، fallback برای قطعی‌های Blacksmith، مشکلات quota، یا آزمون صریح ظرفیت تحت مالکیت است.

پیش از نخستین اجرا، wrapper را از ریشه مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper مخزن یک binary قدیمی Crabbox را که `blacksmith-testbox` را اعلام نمی‌کند، رد می‌کند. provider را صریح بدهید، هرچند `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد.

gate تغییرکرده:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

اجرای دوباره آزمون متمرکز:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

مجموعه کامل:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

خلاصه JSON نهایی را بخوانید. فیلدهای مفید عبارت‌اند از `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs`. اجراهای Crabbox یک‌باره با پشتوانه Blacksmith باید Testbox را خودکار متوقف کنند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، باکس‌های زنده را بررسی کنید و فقط باکس‌هایی را متوقف کنید که خودتان ساخته‌اید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی از reuse استفاده کنید که عمدا به چند فرمان روی همان باکس hydrateشده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox لایه خراب است ولی خود Blacksmith کار می‌کند، از Blacksmith مستقیم به‌عنوان fallback محدود استفاده کنید:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند، اما warmupهای جدید پس از چند دقیقه بدون IP یا URL اجرای Actions در وضعیت `queued` می‌مانند، آن را فشار provider، صف، billing یا محدودیت سازمانی Blacksmith در نظر بگیرید. شناسه‌های queued را که ساخته‌اید متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و اثبات را به مسیر ظرفیت Crabbox تحت مالکیت در پایین منتقل کنید، در حالی که کسی dashboard، billing و محدودیت‌های سازمانی Blacksmith را بررسی می‌کند.

فقط وقتی به ظرفیت Crabbox تحت مالکیت ارتقا دهید که Blacksmith از کار افتاده، با محدودیت quota روبه‌رو است، محیط لازم را ندارد، یا ظرفیت تحت مالکیت صراحتا هدف است:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعا به CPU در حد 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با quota منطقه‌ای EC2 Spot یا On-Demand Standard است. پیش‌فرض‌های `.crabbox.yaml` متعلق به مخزن روی `standard`، چندین منطقه ظرفیت، و `capacity.hints: true` تنظیم شده‌اند تا leaseهای brokerشده AWS، منطقه/بازار انتخاب‌شده، فشار quota، fallback به Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی‌نبودن standard/fast سراغ `large` بروید، و `beast` را فقط برای مسیرهای استثنایی CPU-محور مانند مجموعه کامل یا ماتریس‌های Docker همه Pluginها، اعتبارسنجی صریح انتشار/blocker، یا پروفایلینگ عملکرد با هسته‌های زیاد به‌کار ببرید. از `beast` برای `pnpm check:changed`، آزمون‌های متمرکز، کار فقط‌مستندات، lint/typecheck معمول، بازتولیدهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` پیش‌فرض‌های provider، sync و hydration مربوط به GitHub Actions را برای مسیرهای owned-cloud نگه می‌دارد. این فایل `.git` محلی را مستثنا می‌کند تا checkout مربوط به Actions که hydrate شده است، به‌جای sync کردن remoteها و object storeهای محلی نگه‌دارنده، فراداده Git راه‌دور خودش را حفظ کند؛ همچنین artifactهای محلی زمان اجرا/ساخت را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و handoff محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
