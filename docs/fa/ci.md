---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - در حال هماهنگ‌کردن اجرا یا اجرای مجدد اعتبارسنجی انتشار هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: نمودار کارهای CI، گیت‌های دامنه، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: پایپ‌لاین CI
x-i18n:
    generated_at: "2026-05-07T01:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job مربوط به `preflight`، diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجرای دستی `workflow_dispatch` عمدا scoping هوشمند را دور می‌زند و کل graph را برای release candidateها و اعتبارسنجی گسترده fan out می‌کند. laneهای Android از طریق `include_android` اختیاری می‌مانند. پوشش Plugin فقط مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص private key و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit فایل lock تولیدی بدون dependency در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | اجرای production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، checkهای artifactهای ساخته‌شده، و artifactهای downstream قابل استفاده مجدد                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای correctness سریع Linux مانند checkهای bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | checkهای sharded مربوط به channel contract با یک نتیجه aggregate check پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای test مربوط به Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت sharded: typeهای prod، lint، guardها، typeهای test، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | Architecture، drift مربوط به boundary/prompt به‌صورت sharded، guardهای extension، package boundary، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | testهای smoke برای CLI ساخته‌شده و smoke مربوط به startup-memory                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای testهای channel مربوط به artifactهای ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane مربوط به build و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | formatting docs، lint، و checkهای broken-link                                                             | تغییر docs                       |
| `skills-python`                  | Ruff + pytest برای skillهای مبتنی بر Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | testهای خاص Windows برای process/path به‌همراه regressionهای مشترک import specifier مربوط به runtime                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane مربوط به test TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و testهای Swift برای app مربوط به macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | testهای unit مربوط به Android برای هر دو flavor به‌همراه یک build از debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه testهای کند Codex پس از activity مورد اعتماد                                                 | موفقیت Main CI یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های performance روزانه/درخواستی runtime مربوط به Kova با laneهای mock-provider، deep-profile، و GPT 5.4 live | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل این job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده‌شدن build مشترک بتوانند شروع کنند.
4. پس از آن laneهای سنگین‌تر platform و runtime fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` قرار می‌گیرد، jobهای superseded را `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید مگر اینکه جدیدترین run برای همان ref نیز failing باشد. checkهای shard aggregate از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل superseded شده است در queue قرار نگیرند. کلید concurrency خودکار CI versioned است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند runهای جدیدتر main را به‌طور نامحدود block کند. runهای full-suite دستی از `CI-manual-v1-*` استفاده می‌کنند و runهای در حال اجرا را cancel نمی‌کنند.

job مربوط به `ci-timings-summary` برای هر run غیر draft CI یک artifact فشرده `ci-timings-summary` upload می‌کند. این artifact زمان wall، زمان queue، کندترین jobها، و jobهای failed را برای run فعلی ثبت می‌کند، بنابراین health checkهای CI لازم نیست بارها payload کامل Actions را scrape کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با testهای unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI به‌همراه workflow linting را validate می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای platform در scope تغییرات source همان platform می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های منتخب fixture مربوط به core-test ارزان، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، آن مسیر build artifactها، سازگاری Node 22، channel contractها، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **checkهای Windows Node** به wrapperهای process/path خاص Windows، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ source نامرتبط، plugin، install-smoke، و تغییرات فقط test روی laneهای Linux Node می‌مانند.

کندترین خانواده‌های test مربوط به Node split یا balanced شده‌اند تا هر job بدون رزرو بیش‌ازحد runnerها کوچک بماند: channel contractها به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای core unit fast/support جدا اجرا می‌شوند، infra مربوط به core runtime بین shardهای state، process/config، cron، و shared تقسیم شده است، auto-reply به‌صورت workerهای balanced اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، میان laneهای chat/auth/model/http-plugin/runtime/startup تقسیم می‌شوند. testهای گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern با استفاده از نام shard مربوط به CI، entryهای timing را ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و architecture مربوط به runtime topology را از پوشش gateway watch جدا می‌کند؛ فهرست boundary guard روی چهار shard matrix striped شده است، هرکدام guardهای مستقل منتخب را همزمان اجرا می‌کنند و timing هر check را چاپ می‌کنند. check پرهزینه drift مربوط به Codex happy-path prompt snapshot فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد prompt snapshot منتظر نمی‌مانند، در حالی که prompt drift همچنان به PR عامل آن pinned می‌شود؛ همان flag تولید prompt snapshot Vitest را داخل shard مربوط به built-artifact core support-boundary نیز رد می‌کند. Gateway watch، testهای channel، و shard مربوط به core support-boundary داخل `build-artifacts` پس از ساخته‌شدن `dist/` و `dist-runtime/` به‌صورت همزمان اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را build می‌کند. flavor مربوط به third-party، source set یا manifest جداگانه ندارد؛ lane مربوط به unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job تکراری packaging مربوط به debug APK روی هر push مرتبط با Android پرهیز می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک pass تولیدی Knip فقط برای dependencyها که به آخرین نسخه Knip pinned شده است، با minimum release age مربوط به pnpm که برای install از طریق `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل‌های تولیدی استفاده‌نشده Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. وقتی PR یک فایل استفاده‌نشده جدید و reviewنشده اضافه کند یا یک entry stale در allowlist باقی بگذارد، guard فایل استفاده‌نشده fail می‌شود، در حالی که سطح‌های intentional dynamic plugin، generated، build، live-test، و package bridge که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌شوند.

## ارسال activity مربوط به ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت target از activity repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیرقابل اعتماد را checkout یا execute نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک GitHub App token می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای requestهای دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای requestهای review در سطح commit روی pushهای `main`؛
- `github_activity` برای activity عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها وقتی موجود باشند. این lane عمدا از forward کردن body کامل Webhook خودداری می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper`، `.github/workflows/github-activity.yml` است که event نرمال‌شده را به hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper post می‌کند.

activity عمومی مشاهده است، نه delivery-by-default. agent مربوط به ClawSweeper target مربوط به Discord را در prompt خود دریافت می‌کند و فقط وقتی event غافلگیرکننده، actionable، risky، یا از نظر عملیاتی مفید باشد باید به `#clawsweeper` post کند. openها، editها، churn مربوط به bot، نویز duplicate Webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

با عنوان‌ها، دیدگاه‌ها، متن‌ها، متن بازبینی، نام شاخه‌ها و پیام‌های commit در GitHub در سراسر این مسیر به‌عنوان داده‌های نامطمئن رفتار کنید. آن‌ها ورودی‌هایی برای خلاصه‌سازی و triage هستند، نه دستورالعمل‌هایی برای گردش کار یا زمان اجرای agent.

## dispatchهای دستی

dispatchهای دستی CI همان گراف job را مانند CI معمولی اجرا می‌کنند، اما هر lane دارای محدوده غیر Android را فعال می‌کنند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، و Control UI i18n. dispatchهای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کنند؛ umbrella کامل release با پاس‌دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، shard فقط release با نام `agentic-plugins`، sweep کامل batch مربوط به extension، و laneهای Docker پیش‌انتشار Plugin از CI کنار گذاشته می‌شوند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش کار جداگانه `Plugin Prerelease` را با gate اعتبارسنجی release فعال dispatch کند.

اجرای دستی از یک concurrency group یکتا استفاده می‌کند تا مجموعه کامل release-candidate با push یا اجرای PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوان مورد اعتماد اجازه می‌دهد آن گراف را روی یک شاخه، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل workflow از dispatch ref انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                           | Jobها                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع protocol/contract/bundled، بررسی‌های sharded channel contract، shardهای `check` به‌جز lint، aggregateهای `check-additional`، verifierهای aggregate تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا matrix مربوط به Blacksmith بتواند زودتر در صف قرار بگیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای سبک‌تر extension، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، shardهای تست Linux Node، shardهای تست bundled plugin، shardهای `check-additional`، `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به‌اندازه‌ای به CPU حساس است که 8 vCPU بیش از صرفه‌جویی‌اش هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان صف 32-vCPU بیش از صرفه‌جویی‌اش هزینه داشت)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                      |

CI در canonical-repo مسیر پیش‌فرض runner را Blacksmith نگه می‌دارد. در طول `preflight`، `scripts/ci-runner-labels.mjs` اجراهای اخیر Actions در صف و در حال اجرا را برای jobهای Blacksmith در صف بررسی می‌کند. اگر یک label مشخص Blacksmith از قبل jobهای در صف داشته باشد، jobهای پایین‌دستی که از همان label دقیق استفاده می‌کنند فقط برای همان اجرا به runner متناظر میزبانی‌شده توسط GitHub (`ubuntu-24.04`، `windows-2025`، یا `macos-latest`) fallback می‌کنند. اندازه‌های دیگر Blacksmith در همان خانواده OS روی labelهای اصلی خود می‌مانند. اگر API probe شکست بخورد، هیچ fallback اعمال نمی‌شود.

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

## کارایی OpenClaw

`OpenClaw Performance` گردش کار کارایی product/runtime است. این گردش کار روزانه روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولاً workflow ref را benchmark می‌کند. برای benchmark کردن یک release tag یا شاخه‌ای دیگر با پیاده‌سازی فعلی workflow، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref تست‌شده key می‌شوند، و هر `index.md`، ref/SHA تست‌شده، workflow ref/SHA، Kova ref، profile، حالت auth مربوط به lane، model، تعداد repeat، و filterهای scenario را ثبت می‌کند.

این workflow، OCM را از یک release pin‌شده و Kova را از `openclaw/Kova` در ورودی pin‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: scenarioهای diagnostic مربوط به Kova در برابر runtime ساخت محلی با auth جعلی deterministic سازگار با OpenAI.
- `mock-deep-profile`: profiling مربوط به CPU/heap/trace برای hotspotهای startup، Gateway، و agent-turn.
- `live-gpt54`: یک turn واقعی agent با OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد skip می‌شود.

lane مربوط به mock-provider پس از pass مربوط به Kova، probeهای source بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook، و 50-plugin؛ loopهای hello تکراری mock-OpenAI با `channel-chat-baseline`؛ و دستورهای startup مربوط به CLI در برابر Gateway بوت‌شده. خلاصه Markdown مربوط به source probe در bundle گزارش در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر فعلی tested-ref به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل Release

`Full Release Validation` گردش کار umbrella دستی برای «اجرای همه‌چیز پیش از release» است. این workflow یک شاخه، tag، یا SHA کامل commit را می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای اثبات‌های فقط release مربوط به plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش package، بررسی‌های package بین‌OS، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای stable/default پوشش کامل live/E2E و مسیر release مربوط به Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` آن پوشش soak را اجباری فعال می‌کند تا اعتبارسنجی گسترده advisory همچنان گسترده بماند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact مربوط به `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را پاس دهید تا همان lane package مربوط به Telegram را در برابر package منتشرشده npm دوباره اجرا کند.

برای matrix مرحله‌ها، نام‌های دقیق jobهای workflow، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل release](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش کار دستی و mutating برای release است. آن را پس از وجود release tag و پس از موفقیت preflight مربوط به npm در OpenClaw، از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همه packageهای plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان release SHA dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit سنجاق‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای
`gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

رف‌های dispatch در workflowهای GitHub باید شاخه یا تگ باشند، نه SHA خام commit. این
helper یک شاخه موقت `release-ci/<sha>-...` را روی SHA هدف push می‌کند،
`Full Release Validation` را از همان ref سنجاق‌شده dispatch می‌کند، بررسی می‌کند که
`headSha` هر workflow فرزند با هدف مطابقت داشته باشد، و پس از تکمیل اجرا
شاخه موقت را حذف می‌کند. verifier چتری همچنین اگر هر workflow فرزند روی SHA
دیگری اجرا شده باشد شکست می‌خورد.

`release_profile` گستره live/ارائه‌دهنده‌ای را که به release checks پاس داده می‌شود کنترل می‌کند. workflowهای انتشار دستی به‌صورت پیش‌فرض `stable` هستند؛ فقط زمانی از `full` استفاده کنید که
عمداً ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را می‌خواهید. `run_release_soak`
کنترل می‌کند که آیا release checks پایدار/پیش‌فرض soak جامع live/E2E و
مسیر انتشار Docker را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه پایدار ارائه‌دهنده/backend را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را اجرا می‌کند.

چتر، شناسه‌های اجراهای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای release candidate از `all`، فقط برای فرزند CI کامل معمول از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از گروهی محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار rerun یک جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک مسیر cross-OS شکست‌خورده، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade زمان‌بندی هر فاز را شامل می‌شوند. مسیرهای release-check مربوط به QA مشورتی هستند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما verifier مربوط به release-check را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref workflow مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball با نام `release-package-under-test` resolve کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance، به‌علاوه workflow live/E2E مسیر انتشار Docker هنگام اجرای پوشش soak پاس می‌دهد. این کار بایت‌های package را در همه جعبه‌های انتشار ثابت نگه می‌دارد و از بسته‌بندی دوباره همان candidate در چندین job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را supersede می‌کنند. monitor والد هر workflow فرزندی را که
قبلاً dispatch کرده است هنگام cancel شدن والد cancel می‌کند، بنابراین validation
جدیدتر main پشت یک اجرای کهنه دو ساعته release-check نمی‌ماند. validation شاخه/تگ
انتشار و گروه‌های rerun متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای live و E2E

فرزند release live/E2E پوشش گسترده native `pnpm test:live` را حفظ می‌کند، اما آن را به‌جای یک job سریال، به‌صورت shardهای نام‌دار از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای provider-filtered با نام `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شاردهای جداشده رسانه audio/video و شاردهای music فیلترشده بر اساس ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند و در عین حال rerun و تشخیص شکست‌های کند ارائه‌دهنده live را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای rerunهای دستی یک‌باره معتبر می‌مانند.

شاردهای رسانه native live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط workflow `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از قبل نصب می‌کند؛ jobهای رسانه فقط پیش از setup وجود binaryها را بررسی می‌کنند. suiteهای live مبتنی بر Docker را روی runnerهای عادی Blacksmith نگه دارید — jobهای container جای درستی برای اجرای تست‌های Docker تو‌در‌تو نیستند.

شاردهای مدل/backend زنده مبتنی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. workflow انتشار live آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل live Docker، Gateway شاردشده بر اساس ارائه‌دهنده، backend CLI، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway دارای سقف‌های `timeout` صریح در سطح script و پایین‌تر از timeout job workflow هستند تا container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع شکست بخورد. اگر این شاردها target کامل Docker منبع را جداگانه rebuild کنند، اجرای انتشار پیکربندی اشتباه دارد و زمان واقعی را صرف buildهای image تکراری خواهد کرد.

## Package Acceptance

وقتی پرسش این است که «آیا این package قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی متفاوت است: CI عادی درخت منبع را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از install یا update اجرا می‌کنند اعتبارسنجی می‌کند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک candidate package را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و source، workflow ref، package ref، version، SHA-256، و profile را در summary گام GitHub چاپ می‌کند.
2. `docker_acceptance` مقدار `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow قابل‌استفاده مجدد آن artifact را download می‌کند، inventory tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest مربوط به package را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout workflow، در برابر همان package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند انتخاب کند، workflow قابل‌استفاده مجدد package و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و همان artifact `package-under-test` را وقتی Package Acceptance یکی را resolve کرده نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر package resolution، Docker acceptance، یا مسیر اختیاری Telegram شکست بخورد، workflow را fail می‌کند.

### منبع‌های candidate

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای acceptance پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل commit مورد اعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند که commit انتخاب‌شده از تاریخچه شاخه repository یا یک تگ انتشار reachable باشد، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS download می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/harness مورد اعتمادی است که تست را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی، commitهای منبع مورد اعتماد قدیمی‌تر را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### profileهای suite

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

profile مربوط به `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی package منتشرشده به دردسترس‌بودن live ClawHub وابسته نباشد. مسیر اختیاری Telegram در `NPM Telegram Beta E2E` همان artifact `package-under-test` را دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای dispatchهای مستقل نگه داشته می‌شود.

برای policy اختصاصی update و تست Plugin، شامل فرمان‌های local،
مسیرهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و تریاژ شکست،
به [Testing updates and plugins](/fa/help/testing-updates-plugins) مراجعه کنید.

release checks، Package Acceptance را با `source=artifact`، artifact آماده‌شده package انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration package، update، پاک‌سازی dependency کهنه Plugin، repair نصب Plugin پیکربندی‌شده، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball package resolve‌شده نگه می‌دارد. مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix را به‌جای artifact ساخته‌شده از SHA، در برابر یک package npm منتشرشده اجرا کند. release checks مربوط به cross-OS همچنان onboarding، installer، و رفتار platform مخصوص OS را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با Package Acceptance شروع شود. مسیر Docker با نام `published-upgrade-survivor` در مسیر انتشار blocking، در هر اجرا یک baseline package منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolve‌شده `package-under-test` همیشه candidate است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که به‌صورت پیش‌فرض `openclaw@latest` است؛ فرمان‌های rerun مسیر شکست‌خورده همان baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در چهار انتشار پایدار npm اخیر به‌علاوه انتشارهای مرزی plugin-compatibility سنجاق‌شده و fixtureهای issue-shaped برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های dependency کهنه Plugin قدیمی گسترش یابد. انتخاب‌های published-upgrade survivor با چند baseline بر اساس baseline به jobهای runner هدفمند Docker جداگانه shard می‌شوند. workflow جداگانه `Update Migration` از مسیر Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند وقتی پرسش، پاک‌سازی جامع update منتشرشده باشد، نه گستره CI عادی Full Release. اجراهای aggregate محلی می‌توانند specهای دقیق package را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای matrix سناریو مقدار `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. مسیر منتشرشده baseline را با recipe فرمان baked `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از start شدن Gateway، `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. مسیرهای packaged و installer fresh مربوط به Windows همچنین بررسی می‌کنند که یک package نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام absolute Windows import کند. smoke مربوط به agent-turn در cross-OS برای OpenAI به‌صورت پیش‌فرض وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد از آن استفاده می‌کند، وگرنه `openai/gpt-5.4`، تا اثبات install و Gateway روی یک مدل تست GPT-5 بماند و در عین حال از پیش‌فرض‌های GPT-4.x اجتناب شود.

### پنجره‌های سازگاری قدیمی

پذیرش بسته برای بسته‌های ازپیش‌منتشرشده، پنجره‌های محدود سازگاری با نسخه‌های قدیمی دارد. بسته‌های تا `2026.4.25`، از جمله `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرحالت پایداری `gateway install --wrapper` را وقتی بسته آن پرچم را ارائه نمی‌کند نادیده بگیرد؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از فیکسچر git جعلی مشتق‌شده از tarball حذف کند و ممکن است `update.channel` پایدارشده گم‌شده را لاگ کند؛
- اسموک‌های Plugin ممکن است مکان‌های قدیمی رکورد نصب را بخوانند یا پایداری رکورد نصب marketplace گم‌شده را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فراداده پیکربندی را مجاز بداند، در حالی که همچنان لازم است رکورد نصب و رفتار بدون نصب مجدد بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های مهر فراداده ساخت محلی که از قبل منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا نادیده‌گیری، باعث شکست می‌شوند.

### نمونه‌ها

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی‌های phase، و فرمان‌های اجرای مجدد. به‌جای اجرای مجدد اعتبارسنجی کامل انتشار، اجرای مجدد پروفایل بسته ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## اسموک نصب

گردش‌کار جداگانه `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای bundled، یا سطح‌های core plugin/channel/gateway/Plugin SDK را که jobهای Docker smoke تمرین می‌کنند لمس می‌کنند. تغییرات فقط منبع در Pluginهای bundled، ویرایش‌های فقط تست، و ویرایش‌های فقط مستندات، workerهای Docker را رزرو نمی‌کنند. مسیر سریع image ریشه Dockerfile را یک‌بار می‌سازد، CLI را بررسی می‌کند، اسموک CLI حذف agentها در workspace مشترک را اجرا می‌کند، e2e شبکه Gateway کانتینر را اجرا می‌کند، یک آرگومان ساخت extension bundled را تأیید می‌کند، و پروفایل Docker محدود Plugin bundled را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب بسته QR و Docker/update نصاب را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی که واقعاً سطح‌های installer/package/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک image اسموک GHCR ریشه Dockerfile با target-SHA آماده یا دوباره استفاده می‌کند، سپس نصب بسته QR، اسموک‌های ریشه Dockerfile/Gateway، اسموک‌های installer/update، و Docker E2E سریع Pluginهای bundled را به‌صورت jobهای جدا اجرا می‌کند تا کار installer پشت اسموک‌های image ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی push پوشش کامل را درخواست کند، گردش‌کار اسموک سریع Docker را نگه می‌دارد و اسموک کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

اسموک image-provider نصب سراسری کند Bun جداگانه با `run_bun_global_install_smoke` gate می‌شود. این اسموک در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های QR و installer Docker، Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از قبل می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. زمان‌بند image را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                  | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع laneها برای جلوگیری از هجوم create در Docker daemon؛ برای بدون فاصله `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده ویرگول؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

یک lane سنگین‌تر از سقف مؤثر خود همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند تنها اجرا می‌شود. پیش‌پرواز تجمیعی محلی Docker را بررسی می‌کند، کانتینرهای stale OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی‌های lane را برای ترتیب longest-first پایدار می‌کند، و به‌صورت پیش‌فرض پس از نخستین failure، زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### گردش‌کار زنده/E2E قابل استفاده مجدد

گردش‌کار live/E2E قابل استفاده مجدد از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع image، image live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته اجرای فعلی را دانلود می‌کند، یا آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای نصب‌شده از بسته نیاز دارد، imageهای bare/functional GHCR Docker E2E با tag مبتنی بر digest بسته را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، inputهای `docker_e2e_bare_image`/`docker_e2e_functional_image` ارائه‌شده یا imageهای موجود مبتنی بر digest بسته را دوباره استفاده می‌کند. pullهای image Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا stream گیرکرده registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریعاً دوباره تلاش شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار، jobهای chunked کوچک‌تر را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیازش را pull کند و چند lane را از طریق همان زمان‌بند weighted اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی plugin/runtime باقی می‌مانند. alias lane با نام `install-e2e` همچنان alias تجمیعی اجرای مجدد دستی برای هر دو lane نصاب provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط OpenWebUI نگه می‌دارد. laneهای update کانال‌های bundled برای failureهای گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON plan زمان‌بند، جدول‌های laneهای کند، و فرمان‌های اجرای مجدد برای هر lane آپلود می‌کند. ورودی `docker_lanes` گردش‌کار، laneهای انتخاب‌شده را به‌جای jobهای chunk در برابر imageهای آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک lane live Docker باشد، job هدفمند image live-test را برای آن اجرای مجدد به‌صورت محلی می‌سازد. فرمان‌های اجرای مجدد GitHub تولیدشده برای هر lane، وقتی آن مقدارها وجود داشته باشند، `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های image آماده‌شده را شامل می‌شوند، تا یک lane ناموفق بتواند همان بسته و imageهای دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار live/E2E زمان‌بندی‌شده، مجموعه کامل Docker در release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک گردش‌کار جداست که توسط `Full Release Validation` یا یک اپراتور صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI این مجموعه را خاموش نگه می‌دارند. این گردش‌کار تست‌های Pluginهای bundled را بین هشت worker متعلق به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension تا دو گروه پیکربندی Plugin را هم‌زمان، با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker فقط انتشار، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند.

## آزمایشگاه QA

آزمایشگاه QA laneهای CI اختصاصی خارج از گردش‌کار اصلی smart-scoped دارد. parity عامل‌محور زیر harnessهای گسترده QA و انتشار تو در تو قرار دارد، نه یک گردش‌کار مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` شبانه روی `main` و با dispatch دستی اجرا می‌شود؛ این گردش‌کار lane parity mock، lane live Matrix، و laneهای live Telegram و Discord را به‌صورت jobهای موازی fan out می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، مسیرهای انتقال زنده Matrix و Telegram را با ارائه‌دهنده ساختگی قطعی و مدل‌های واجد شرایط ساختگی (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده و راه‌اندازی عادی Plugin ارائه‌دهنده جدا بماند. Gateway انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کند چون برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال ارائه‌دهنده توسط مجموعه‌های جداگانه مدل زنده، ارائه‌دهنده بومی و ارائه‌دهنده Docker پوشش داده می‌شود.

Matrix برای گیت‌های زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط زمانی `--fail-fast` را اضافه می‌کند که CLI checkout شده از آن پشتیبانی کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به کارهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین مسیرهای مهم انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ گیت برابری QA آن بسته‌های کاندید و مبنا را به‌عنوان کارهای مسیر موازی اجرا می‌کند، سپس هر دو artifact را در یک کار گزارش کوچک دانلود می‌کند تا مقایسه نهایی برابری انجام شود.

برای PRهای عادی، به‌جای اینکه برابری را یک وضعیت الزامی بدانید، از شواهد CI/بررسی scoped پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی محدودِ مرحله اول است، نه پیمایش کامل مخزن. اجراهای روزانه، دستی، و محافظ pull request غیر draft، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

محافظ pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages` یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را مثل گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS از پیش‌فرض‌های PR بیرون می‌مانند.

### دسته‌های امنیتی

| دسته                                              | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، cron و مبنای gateway                                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌علاوه runtime مربوط به Plugin کانال، gateway، Plugin SDK، secrets و نقاط تماس audit           |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح policy مربوط به SSRF هسته، تحلیل IP، محافظ شبکه، web-fetch و SSRF در Plugin SDK                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای process، تحویل خروجی و گیت‌های اجرای tool توسط agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح trust مربوط به نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading و قرارداد package در Plugin SDK     |

### Shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که توسط sanity گردش‌کار پذیرفته می‌شود، دستی build می‌کند. زیر `/codeql-critical-security/android` upload می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS دستی build می‌کند، نتایج build وابستگی‌ها را از SARIF آپلودشده فیلتر می‌کند و زیر `/codeql-critical-security/macos` upload می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده چون build macOS حتی وقتی clean باشد بر runtime غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript با شدت خطا و غیرامنیتی را روی سطوح محدود و ارزشمند، روی runner کوچک‌تر لینوکسی Blacksmith اجرا می‌کند. محافظ pull request آن عمداً از profile زمان‌بندی‌شده کوچک‌تر است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/tool و dispatch پاسخ agent، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، runtime کانال هسته و Plugin کانال bundled، protocol/server-method مربوط به Gateway، runtime حافظه/glue مربوط به SDK، تحویل MCP/process/outbound، کاتالوگ runtime/model ارائه‌دهنده، diagnostics/delivery queues نشست، loader مربوط به plugin، قرارداد Plugin SDK/package-contract، یا تغییرات runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده shard کیفیت PR را اجرا می‌کنند.

Dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Profileهای محدود، hookهای آموزش/iteration برای اجرای یک shard کیفیت در isolation هستند.

| دسته                                                   | سطح                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی Auth، secrets، sandbox، cron و gateway                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization و IO پیکربندی                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای protocol مربوط به Gateway و قراردادهای server method                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال bundled                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، dispatch مدل/ارائه‌دهنده، dispatch و queueهای auto-reply، و قراردادهای runtime مربوط به control-plane در ACP                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های tool، helperهای نظارت process، و قراردادهای تحویل outbound                                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، glue فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals مربوط به reply queue، queueهای تحویل نشست، helperهای binding/delivery نشست outbound، سطوح diagnostic event/log bundle، و قراردادهای CLI مربوط به doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، helperهای payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، queueهای تحویل، و helperهای binding نشست/thread                    |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، auth و discovery ارائه‌دهنده، ثبت runtime ارائه‌دهنده، defaults/catalogs ارائه‌دهنده، و registryهای web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap مربوط به Control UI، persistence محلی، جریان‌های کنترل gateway، و قراردادهای runtime مربوط به control-plane وظیفه                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب هسته، media IO، درک رسانه، image-generation و media-generation                                                          |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface و entrypointهای Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | سورس منتشرشده سمت package مربوط به Plugin SDK و helperهای قرارداد package مربوط به plugin                                                                           |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بدون پنهان‌کردن سیگنال امنیتی، قابل زمان‌بندی، اندازه‌گیری، غیرفعال‌سازی یا گسترش باشند. گسترش CodeQL برای Swift، Python و Pluginهای bundled فقط پس از پایدار شدن runtime و سیگنال profileهای محدود، باید به‌عنوان کار scoped یا sharded بعدی دوباره اضافه شود.

## گردش‌کارهای نگهداشت

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداشت event-driven در Codex برای هم‌راستا نگه‌داشتن docs موجود با تغییرات تازه landed شده است. زمان‌بندی pure ندارد: یک اجرای موفق CI برای push غیر bot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیم اجرا کند. invocationهای workflow-run وقتی `main` جلوتر رفته باشد یا وقتی اجرای Docs Agent غیر skipped دیگری در ساعت گذشته ساخته شده باشد skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع اجرای Docs Agent غیر skipped قبلی تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین pass docs را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت event-driven در Codex برای testهای کند است. زمان‌بندی pure ندارد: یک اجرای موفق CI برای push غیر bot روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run در همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. Dispatch دستی این گیت فعالیت روزانه را bypass می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده full-suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد test با حفظ coverage انجام دهد، نه refactorهای گسترده، سپس گزارش full-suite را دوباره اجرا می‌کند و تغییراتی را که شمار testهای passing baseline را کاهش دهند reject می‌کند. اگر baseline دارای testهای failing باشد، Codex فقط می‌تواند failureهای واضح را اصلاح کند و گزارش full-suite پس از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از landed شدن push bot جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل docs agent حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صریحاً فهرست‌شده را close می‌کند. پیش از تغییر GitHub، بررسی می‌کند که PR landed شده merge شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییرکرده هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی نسبت به scope گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات تولیدی هسته، بررسی نوع تولید هسته و تست هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط مربوط به تست هسته، فقط بررسی نوع تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات تولیدی افزونه، بررسی نوع تولید افزونه و تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط مربوط به تست افزونه، بررسی نوع تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به بررسی نوع افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (جاروب‌های افزونه Vitest همچنان کار تست صریح باقی می‌مانند)؛
- افزایش نسخه‌های فقط مربوط به فراداده انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته ریشه/پیکربندی برای ایمنی، به همه مسیرهای بررسی می‌افتند.

مسیردهی تست‌های تغییرکرده محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کند، ویرایش منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهد و سپس تست‌های هم‌جوار و وابسته‌های گراف import را. پیکربندی تحویل اتاق گروهی مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا اعلان سیستمی ابزار پیام، از مسیر تست‌های پاسخ هسته به‌همراه رگرسیون‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push روابط عمومی شکست بخورد. فقط وقتی تغییر به‌اندازه کافی در سطح harness گسترده است که مجموعه نگاشت‌شده ارزان نماینده قابل‌اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشه مخزن اجرا کنید و برای اثبات گسترده، یک جعبه گرم‌شده تازه را ترجیح دهید. پیش از صرف یک gate کند روی جعبه‌ای که دوباره استفاده شده، منقضی شده، یا تازه یک همگام‌سازی غیرمنتظره بزرگ گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل جعبه اجرا کنید.

بررسی sanity وقتی فایل‌های ریشه ضروری مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم 200 حذف ردیابی‌شده نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت همگام‌سازی ریموت نسخه قابل‌اعتمادی از روابط عمومی نیست؛ آن جعبه را متوقف کنید و به‌جای اشکال‌زدایی شکست تست محصول، یک جعبه تازه گرم کنید. برای روابط عمومی‌هایی که عمدا حذف‌های بزرگ دارند، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحله همگام‌سازی می‌ماند، پایان می‌دهد. برای غیرفعال کردن آن guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار میلی‌ثانیه بزرگ‌تری استفاده کنید.

Crabbox wrapper جعبه ریموت متعلق به مخزن برای اثبات Linux نگه‌دارنده است. وقتی یک بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی همسانی CI مهم است، یا وقتی اثبات به رازها، Docker، مسیرهای بسته، جعبه‌های قابل‌استفاده‌مجدد یا گزارش‌های ریموت نیاز دارد، از آن استفاده کنید. backend عادی OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner متعلق به پروژه، fallback برای قطعی‌های Blacksmith، مشکل سهمیه، یا تست صریح ظرفیت متعلق به پروژه است.

پیش از نخستین اجرا، wrapper را از ریشه مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper مخزن یک باینری Crabbox کهنه را که `blacksmith-testbox` را advertise نمی‌کند رد می‌کند. provider را صریح پاس بدهید، حتی اگر `.crabbox.yaml` پیش‌فرض‌های owned-cloud داشته باشد.

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

اجرای دوباره تست متمرکز:

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

خلاصه JSON نهایی را بخوانید. فیلدهای مفید عبارت‌اند از `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs`. اجراهای یک‌باره Crabbox با پشتیبانی Blacksmith باید Testbox را به‌صورت خودکار متوقف کنند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، جعبه‌های زنده را بررسی کنید و فقط جعبه‌هایی را که خودتان ایجاد کرده‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

استفاده مجدد را فقط وقتی به‌کار ببرید که عمدا به چند فرمان روی همان جعبه آماده‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox لایه خراب است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم به‌عنوان fallback محدود استفاده کنید:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه در وضعیت `queued` بدون IP یا URL اجرای Actions می‌مانند، آن را فشار provider، صف، صورت‌حساب یا محدودیت سازمان Blacksmith تلقی کنید. idهای صف‌شده‌ای را که ایجاد کرده‌اید متوقف کنید، از شروع Testboxهای بیشتر خودداری کنید، و اثبات را به مسیر ظرفیت Crabbox متعلق به پروژه در پایین منتقل کنید، درحالی‌که کسی dashboard، صورت‌حساب و محدودیت‌های سازمان Blacksmith را بررسی می‌کند.

فقط وقتی Blacksmith از کار افتاده، محدودیت سهمیه دارد، محیط لازم را ندارد، یا ظرفیت متعلق به پروژه صراحتا هدف است، به ظرفیت Crabbox متعلق به پروژه ارتقا دهید:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

تحت فشار AWS، از `class=beast` خودداری کنید مگر اینکه کار واقعا به CPU در کلاس 48xlarge نیاز داشته باشد. درخواست `beast` از 192 vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با سهمیه منطقه‌ای EC2 Spot یا On-Demand Standard است. پیش‌فرض‌های `.crabbox.yaml` متعلق به مخزن روی `standard`، چند منطقه ظرفیت، و `capacity.hints: true` تنظیم شده‌اند تا leaseهای واسطه‌شده AWS منطقه/market انتخاب‌شده، فشار سهمیه، fallback به Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط بعد از کافی نبودن standard/fast از `large` استفاده کنید، و `beast` را فقط برای مسیرهای CPU-bound استثنایی مانند مجموعه کامل یا ماتریس‌های Docker همه Pluginها، اعتبارسنجی صریح انتشار/مسدودکننده، یا پروفایلینگ کارایی با هسته زیاد به‌کار ببرید. از `beast` برای `pnpm check:changed`، تست‌های متمرکز، کار فقط docs، lint/typecheck معمولی، بازتولیدهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان market Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration مربوط به GitHub Actions برای مسیرهای owned-cloud است. این فایل `.git` محلی را exclude می‌کند تا checkout آماده‌شده Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، فراداده Git ریموت خودش را حفظ کند، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند exclude می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، واکشی `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
