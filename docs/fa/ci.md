---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شده یا نشده است
    - شما در حال عیب‌یابی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای یکپارچه‌سازی مداوم، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-05T06:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. Job `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط نواحی نامرتبط تغییر کرده‌اند، مسیرهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند و کل گراف را برای نامزدهای انتشار و اعتبارسنجی گسترده پخش می‌کنند. مسیرهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی خط لوله

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit lockfile تولیدی بدون dependency در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | تجمیع لازم برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | گذر production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای downstream قابل استفاده مجدد                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | مسیرهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های contract مربوط به channel به‌صورت sharded با نتیجه aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز مسیرهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت sharded: typeهای prod، lint، guardها، typeهای تست، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مربوط به boundary/prompt به‌صورت sharded، guardهای extension، package boundary، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke مربوط به CLI ساخته‌شده و smoke حافظه شروع به کار                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | مسیر build و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | بررسی‌های formatting، lint، و لینک خراب در مستندات                                                             | مستندات تغییر کرده‌اند                       |
| `skills-python`                  | Ruff + pytest برای skillهای متکی به Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های خاص Windows برای process/path به‌همراه regressionهای مشترک specifier import runtime                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | مسیر تست TypeScript روی macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و تست‌های Swift برای برنامه macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit مربوط به Android برای هر دو flavor به‌همراه یک build APK debug                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI روی main یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با مسیرهای mock-provider، deep-profile، و live مربوط به GPT 5.4 | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام مسیرها وجود داشته باشند. منطق `docs-scope` و `changed-scope` مرحله‌هایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
3. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده‌شدن build مشترک بتوانند شروع کنند.
4. مسیرهای سنگین‌تر پلتفرم و runtime بعد از آن پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` می‌نشیند، jobهای superseded را با وضعیت `cancelled` علامت‌گذاری کند. این را noise مربوط به CI در نظر بگیرید، مگر اینکه جدیدترین run برای همان ref نیز fail شده باشد. بررسی‌های shard aggregate از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما بعد از اینکه کل workflow از قبل superseded شده است queue نشوند. کلید concurrency خودکار CI versioned است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه queue قدیمی نتواند runهای جدیدتر main را به‌طور نامحدود block کند. runهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای درحال‌اجرا را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای موجود در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** گراف CI مربوط به Node را به‌همراه linting workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجباری نمی‌کنند؛ آن مسیرهای پلتفرم به تغییرات source پلتفرم scoped می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های منتخب fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر manifest سریع و فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیما تمرین می‌کند محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، contractهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافه را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای خاص Windows برای process/path، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطح‌های workflow مربوط به CI که آن مسیر را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-test روی مسیرهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balanced شده‌اند تا هر job کوچک بماند، بدون اینکه runnerها بیش از حد reserve شوند: contractهای channel به‌صورت سه shard weighted اجرا می‌شوند، مسیرهای core unit fast/support جداگانه اجرا می‌شوند، infra مربوط به core runtime بین shardهای state و process/config split شده است، auto-reply به‌صورت workerهای balanced اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing split شده است)، و configهای agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، بین مسیرهای chat/auth/model/http-plugin/runtime/startup split شده‌اند. تست‌های گسترده browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern با استفاده از نام shard در CI، timing entry ثبت می‌کنند تا `.artifacts/vitest-shard-timings.json` بتواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار package-boundary compile/canary را کنار هم نگه می‌دارد و معماری runtime topology را از پوشش gateway watch جدا می‌کند؛ فهرست boundary guard بین چهار shard ماتریسی striped شده است، به‌طوری‌که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و timing هر check را چاپ می‌کنند، شامل `pnpm prompt:snapshots:check` تا drift مربوط به prompt در مسیر happy-path runtime مربوط به Codex به همان PR که باعث آن شده pinned شود. Gateway watch، تست‌های channel، و shard مربوط به core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، داخل `build-artifacts` هم‌زمان اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ مسیر unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، درحالی‌که از یک job بسته‌بندی APK debug تکراری روی هر push مرتبط با Android اجتناب می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک گذر production Knip فقط برای dependencyها که به آخرین نسخه Knip pinned شده است، با minimum release age مربوط به pnpm که برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دستور دوم یافته‌های production مربوط به فایل‌های استفاده‌نشده در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard مربوط به فایل‌های استفاده‌نشده وقتی fail می‌شود که یک PR فایل استفاده‌نشده جدیدی اضافه کند که review نشده است یا یک allowlist entry stale باقی بگذارد، درحالی‌که سطح‌های dynamic Plugin، generated، build، live-test، و package bridge که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌شوند.

## Forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیر trusted را check out یا execute نمی‌کند. workflow یک token مربوط به GitHub App از `CLAWSWEEPER_APP_PRIVATE_KEY` ایجاد می‌کند، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

workflow چهار مسیر دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

مسیر `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این مسیر عمدا از forward کردن کل body مربوط به Webhook اجتناب می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper`، `.github/workflows/github-activity.yml` است که event نرمال‌شده را برای agent مربوط به ClawSweeper به hook مربوط به OpenClaw Gateway post می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper target مربوط به Discord را در prompt خود دریافت می‌کند و فقط وقتی باید به `#clawsweeper` post کند که event غافلگیرکننده، اقدام‌پذیر، پرریسک، یا از نظر عملیاتی مفید باشد. openها، editها، churn مربوط به bot، noise تکراری Webhook، و traffic عادی review باید به `NO_REPLY` منجر شوند.

titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit مربوط به GitHub را در سراسر این مسیر به‌عنوان داده untrusted در نظر بگیرید. آن‌ها ورودی summarization و triage هستند، نه instruction برای workflow یا runtime مربوط به agent.

## dispatchهای دستی

اجرای دستی CI همان گراف کاری CI معمولی را اجرا می‌کند، اما هر lane دارای محدوده غیر Android را اجباری فعال می‌کند: شاردهای Linux Node، شاردهای Pluginهای باندل‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، اسموک build، بررسی‌های مستندات، Python skills، Windows، macOS و Control UI i18n. اجرای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر انتشار کامل، Android را با پاس‌دادن `include_android=true` فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، شارد مخصوص انتشار `agentic-plugins`، جاروب کامل دسته‌ای افزونه‌ها، و laneهای Docker پیش‌انتشار Plugin از CI حذف شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال اجرا کند.

اجراهای دستی از یک گروه هم‌زمانی یکتا استفاده می‌کنند تا مجموعه کامل release-candidate توسط اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک فراخواننده معتمد اجازه می‌دهد آن گراف را در برابر یک branch، tag، یا commit SHA کامل اجرا کند، در حالی که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                        | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و تجمیع‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/باندل‌شده، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و تجمیع‌های `check-additional`، تأییدکننده‌های تجمیعی تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند در صف قرار گیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر افزونه‌ها، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای تست Linux Node، شاردهای تست Plugin باندل‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیشتر از صرفه‌جویی‌شان هزینه داشتند)؛ buildهای Docker مربوط به install-smoke (زمان صف 32-vCPU بیشتر از صرفه‌جویی‌اش هزینه داشت)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` workflow کارایی محصول/زمان اجرا است. این workflow روزانه روی `main` اجرا می‌شود و می‌تواند دستی dispatch شود:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولاً ref خود workflow را benchmark می‌کند. برای benchmark کردن یک release tag یا branch دیگر با پیاده‌سازی فعلی workflow، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref تست‌شده کلیدگذاری می‌شوند، و هر `index.md` ref/SHA تست‌شده، ref/SHA workflow، ref مربوط به Kova، profile، حالت احراز هویت lane، model، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این workflow، OCM را از یک انتشار pin‌شده و Kova را از `openclaw/Kova` در ورودی pin‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر یک runtime با build محلی، همراه با احراز هویت جعلی و قطعی سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای hotspotهای startup، Gateway، و agent-turn.
- `live-gpt54`: یک agent turn واقعی OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider پس از گذر Kova، probeهای منبع native OpenClaw را هم اجرا می‌کند: زمان‌بندی boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook، و 50-Plugin؛ حلقه‌های hello تکراری mock-OpenAI `channel-chat-baseline`؛ و دستورهای startup CLI در برابر Gateway بوت‌شده. خلاصه Markdown مربوط به source probe در bundle گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر ref تست‌شده فعلی به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` workflow چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. این workflow یک branch، tag، یا commit SHA کامل می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای proof مخصوص انتشار مربوط به Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، بررسی‌های cross-OS package، QA Lab parity، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای پایدار/پیش‌فرض پوشش کامل live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` آن پوشش soak را اجباری فعال می‌کند تا اعتبارسنجی advisory گسترده همچنان گسترده بماند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را پاس دهید تا همان lane بسته Telegram را در برابر بسته npm منتشرشده دوباره اجرا کند.

برای ماتریس مرحله، نام دقیق کارهای workflow، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` workflow انتشار تغییردهنده دستی است. پس از آن‌که release tag وجود داشت و پس از موفقیت پیش‌پرواز npm مربوط به OpenClaw، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow `pnpm plugins:sync:check` را تأیید می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان release SHA dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای proof مربوط به commit pin‌شده روی branchی که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch refهای GitHub workflow باید branch یا tag باشند، نه commit SHA خام. helper یک branch موقت `release-ci/<sha>-...` را در target SHA push می‌کند، `Full Release Validation` را از آن ref pin‌شده dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با target مطابقت دارد، و پس از کامل شدن اجرا، branch موقت را حذف می‌کند. verifier چتری همچنین اگر هر workflow فرزند با SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره‌ی زنده/ارائه‌دهنده‌ای را که به بررسی‌های انتشار پاس داده می‌شود کنترل می‌کند. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض از `stable` استفاده می‌کنند؛ فقط زمانی از `full` استفاده کنید که عمدا ماتریس گسترده‌ی ارائه‌دهنده/رسانه‌ی advisory را می‌خواهید. `run_release_soak` کنترل می‌کند که آیا بررسی‌های انتشار پایدار/پیش‌فرض، آزمون soak جامع زنده/E2E و مسیر انتشار Docker را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه‌ی پایدار ارائه‌دهنده/بک‌اند را اضافه می‌کند.
- `full` ماتریس گسترده‌ی ارائه‌دهنده/رسانه‌ی advisory را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزندِ dispatch‌شده را ثبت می‌کند و کار نهایی `Verify full validation` نتیجه‌گیری‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کار را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار تأییدکننده‌ی والد را دوباره اجرا کنید تا نتیجه‌ی چتر و خلاصه‌ی زمان‌بندی تازه شود.

برای بازیابی، هم `Full Release Validation` و هم `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره‌ی یک جعبه‌ی انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک مسیر cross-OS ناموفق، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. مسیرهای QA در release-check حالت advisory دارند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما تأییدکننده‌ی release-check را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` تبدیل کند، سپس آن artifact را به بررسی‌های cross-OS و پذیرش بسته، به‌همراه گردش‌کار Docker مسیر انتشار زنده/E2E وقتی پوشش soak اجرا می‌شود، پاس می‌دهد. این کار بایت‌های بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره‌ی همان نامزد در چند کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را جایگزین می‌کنند. ناظر والد هر گردش‌کار فرزندی را که قبلا dispatch کرده باشد، هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای release-check دو ساعته‌ی کهنه نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره‌ی متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## shardهای زنده و E2E

فرزند زنده/E2E انتشار، پوشش گسترده‌ی بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریال، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- کارهای `native-live-src-gateway-profiles` فیلترشده بر اساس ارائه‌دهنده
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداشده‌ی رسانه‌ی صوتی/ویدیویی و shardهای موسیقی فیلترشده بر اساس ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند ارائه‌دهنده‌ی زنده را آسان‌تر می‌کند. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` برای اجرای دوباره‌ی دستی یک‌باره همچنان معتبر می‌مانند.

shardهای رسانه‌ی زنده‌ی بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ کارهای رسانه فقط پیش از راه‌اندازی، وجود binaryها را بررسی می‌کنند. مجموعه‌های زنده‌ی مبتنی بر Docker را روی runnerهای معمولی Blacksmith نگه دارید؛ کارهای container جای مناسبی برای اجرای آزمون‌های Docker تو در تو نیستند.

shardهای مدل/بک‌اند زنده‌ی مبتنی بر Docker از یک image مشترک جداگانه‌ی `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار انتشار زنده آن image را یک‌بار می‌سازد و push می‌کند، سپس shardهای مدل زنده‌ی Docker، Gateway بخش‌بندی‌شده بر اساس ارائه‌دهنده، بک‌اند CLI، اتصال ACP و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Gateway Docker سقف‌های `timeout` صریح در سطح script دارند که کمتر از timeout کار گردش‌کار است تا یک container گیرکرده یا مسیر پاک‌سازی، به‌جای مصرف کل بودجه‌ی release-check، سریع شکست بخورد. اگر آن shardها هدف Docker کامل source را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده و زمان دیواری را صرف ساخت‌های تکراری image خواهد کرد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته‌ی نصب‌پذیر OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت source را اعتبارسنجی می‌کند، در حالی که پذیرش بسته، یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند، اعتبارسنجی می‌کند.

### کارها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و source، ref گردش‌کار، ref بسته، نسخه، SHA-256 و profile را در خلاصه‌ی گام GitHub چاپ می‌کند.
2. `docker_acceptance` گردش‌کار `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار reusable آن artifact را دانلود می‌کند، فهرست tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest بسته را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار reusable بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و وقتی پذیرش بسته یکی را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده‌ی npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب، یا SHA کامل commit مورد اعتماد در `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/برچسب‌های OpenClaw را fetch می‌کند، بررسی می‌کند که commit انتخاب‌شده از تاریخچه‌ی شاخه‌ی repository یا یک برچسب انتشار قابل دسترسی باشد، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` لازم است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای اشتراک‌گذاری‌شده‌ی بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورد اعتماد گردش‌کار/harness است که آزمون را اجرا می‌کند. `package_ref` همان source commit است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این امکان را می‌دهد که harness آزمون فعلی، source commitهای قدیمی‌ترِ مورد اعتماد را بدون اجرای منطق قدیمی گردش‌کار اعتبارسنجی کند.

### profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌همراه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد لازم است

profile مربوط به `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته‌ی منتشرشده به دسترسی زنده به ClawHub وابسته نباشد. مسیر اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند و مسیر spec منتشرشده‌ی npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی آزمون به‌روزرسانی و Plugin، شامل فرمان‌های محلی، مسیرهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار و triage شکست، [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact آماده‌شده‌ی بسته‌ی انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، به‌روزرسانی، پاک‌سازی dependency کهنه‌ی Plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin و Telegram را روی همان tarball resolve‌شده‌ی بسته نگه می‌دارد. برای اجرای همان ماتریس در برابر یک بسته‌ی npm منتشرشده به‌جای artifact ساخته‌شده از SHA، `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار cross-OS همچنان onboarding، installer و رفتار ویژه‌ی OS را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید از پذیرش بسته شروع شود. مسیر Docker با نام `published-upgrade-survivor` در مسیر مسدودکننده‌ی انتشار، در هر اجرا یک baseline بسته‌ی منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolve‌شده‌ی `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده‌ی fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره‌ی مسیر ناموفق آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقادیر `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا روی چهار انتشار پایدار آخر npm به‌همراه انتشارهای مرزی سنجاق‌شده‌ی سازگاری Plugin و fixtureهای شبیه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده‌ی OpenClaw، مسیرهای log با tilde و ریشه‌های dependency Plugin قدیمیِ کهنه گسترش یابد. انتخاب‌های published-upgrade survivor چند-baseline، بر اساس baseline به کارهای runner هدفمند جداگانه‌ی Docker shard می‌شوند. گردش‌کار جداگانه‌ی `Update Migration` وقتی استفاده می‌شود که پرسش، پاک‌سازی جامع به‌روزرسانی منتشرشده است، نه گستره‌ی معمول Full Release CI؛ این گردش‌کار از مسیر Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای ماتریس سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. مسیر منتشرشده baseline را با یک دستورالعمل baked از فرمان `openclaw config set` پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند. مسیرهای fresh مربوط به packaged و installer در Windows همچنین بررسی می‌کنند که یک بسته‌ی نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام مطلق Windows import کند. smoke مربوط به گردش agent در cross-OS با OpenAI، وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، در غیر این صورت از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های قبلا منتشرشده پنجره‌های سازگاری legacy محدودی دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- مدخل‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- وقتی بسته آن flag را در معرض استفاده نمی‌گذارد، `doctor-switch` ممکن است زیرحالت persistence مربوط به `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball حذف کند و ممکن است `update.channel` persisted گم‌شده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا نبود persistence برای marketplace install-record را بپذیرند؛
- `plugin-update` ممکن است migration فراداده‌ی config را مجاز بداند، در حالی که همچنان لازم است install record و رفتار no-reinstall بدون تغییر بمانند.

بسته‌ی منتشرشده‌ی `2026.4.26` ممکن است برای فایل‌های مُهر فراداده‌ی ساخت محلی که پیش‌تر منتشر شده‌اند نیز هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار دادن یا نادیده گرفتن، شکست می‌خورند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، گزارش‌های lane، زمان‌بندی‌های phase و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## دودسنجی نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای بسته‌بندی‌شده، یا سطح‌های Plugin/channel/gateway/Plugin SDK هسته را لمس می‌کنند که jobهای smoke Docker آن‌ها را تمرین می‌دهند. تغییرات فقط-منبع در Pluginهای بسته‌بندی‌شده، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agentها در workspace مشترک را اجرا می‌کند، e2e شبکه‌ی Gateway کانتینر را اجرا می‌کند، یک build arg مربوط به extension بسته‌بندی‌شده را راستی‌آزمایی می‌کند، و پروفایل Docker محدودشده‌ی Plugin بسته‌بندی‌شده را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه سقف‌گذاری می‌شود).
- **مسیر کامل** پوشش نصب بسته‌ی QR و Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار با workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image smoke مربوط به Dockerfile ریشه‌ی GHCR با target-SHA را آماده یا دوباره استفاده می‌کند، سپس نصب بسته‌ی QR، smokeهای Dockerfile/Gateway ریشه، smokeهای installer/update، و Docker E2E سریع Plugin بسته‌بندی‌شده را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای image ریشه منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، گردش‌کار smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند image-provider برای نصب سراسری Bun جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای متمرکز بر نصب خود را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان یک tarball npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner ساده‌ی Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image عملکردی که همان tarball را برای laneهای عملکردی عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` image را برای هر lane انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل تنظیم‌ها

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای زنده‌ی هم‌زمان تا providerها throttle نکنند.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای پرهیز از طوفان create در Docker daemon؛ برای بدون فاصله‌گذاری `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای زنده/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` plan زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست laneهای دقیق جداشده با کاما؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا آزاد کردن ظرفیت به‌تنهایی اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای E2E کهنه‌ی OpenClaw را حذف می‌کنند، وضعیت lane فعال را منتشر می‌کنند، زمان‌بندی laneها را برای ترتیب طولانی‌ترین-اول ماندگار می‌کنند، و به‌صورت پیش‌فرض پس از نخستین شکست زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### گردش‌کار live/E2E قابل استفاده‌ی دوباره

گردش‌کار live/E2E قابل استفاده‌ی دوباره از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع image، image زنده، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته‌ی current-run را دانلود می‌کند، یا آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای بسته‌ی نصب‌شده نیاز دارد، imageهای Docker E2E ساده/عملکردی GHCR با tag مبتنی بر digest بسته را از طریق cache لایه‌ی Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، ورودی‌های ارائه‌شده‌ی `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود با digest بسته را دوباره استفاده می‌کند. pullهای imageهای Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا جریان گیرکرده‌ی registry/cache به‌جای مصرف بیشتر مسیر حیاتی CI، سریع دوباره تلاش شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار jobهای کوچک‌ترِ تکه‌بندی‌شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر تکه فقط نوع image موردنیاز خود را pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

تکه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime باقی می‌مانند. alias lane با نام `install-e2e` همچنان alias تجمیعی اجرای دوباره‌ی دستی برای هر دو lane نصب‌کننده‌ی provider است.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI یک تکه‌ی مستقل `openwebui` نگه می‌دارد. laneهای update channel بسته‌بندی‌شده برای شکست‌های گذرای شبکه‌ی npm یک‌بار دوباره تلاش می‌کنند.

هر تکه `.artifacts/docker-tests/` را با گزارش‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON plan زمان‌بند، جدول‌های laneهای کند، و فرمان‌های اجرای دوباره برای هر lane آپلود می‌کند. ورودی `docker_lanes` گردش‌کار، laneهای انتخاب‌شده را در برابر imageهای آماده‌شده اجرا می‌کند نه jobهای تکه‌ای؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر یک lane انتخاب‌شده lane زنده‌ی Docker باشد، job هدفمند image مربوط به live-test را برای آن اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های GitHub تولیدشده برای اجرای دوباره‌ی هر lane وقتی این مقدارها وجود داشته باشند شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های image آماده‌شده هستند، تا یک lane ناموفق بتواند همان بسته و imageهای دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار live/E2E زمان‌بندی‌شده، مجموعه‌ی کامل Docker مربوط به release-path را هر روز اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا توسط یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI این مجموعه را خاموش نگه می‌دارند. این workflow تست‌های Plugin بسته‌بندی‌شده را میان هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه تا دو گروه پیکربندی Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker مختص انتشار، laneهای Docker هدفمند را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند.

## آزمایشگاه QA

آزمایشگاه QA laneهای CI اختصاصی بیرون از گردش‌کار اصلی smart-scoped دارد. agentic parity زیر harnessهای گسترده‌ی QA و انتشار تو در تو است، نه یک گردش‌کار PR مستقل. وقتی parity باید همراه با یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane زنده‌ی Matrix، و laneهای زنده‌ی Telegram و Discord را به‌عنوان jobهای موازی پخش می‌کند. jobهای زنده از environment `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار laneهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از latency مدل زنده و راه‌اندازی معمول Plugin provider جدا شود. Gateway مربوط به transport زنده memory search را غیرفعال می‌کند چون QA parity رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه‌ی مدل زنده، provider بومی، و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی workflow دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای آزمایشگاه QA حیاتی برای انتشار را پیش از تأیید انتشار اجرا می‌کند؛ gate مربوط به QA parity آن بسته‌های candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک job کوچک گزارش دانلود می‌کند تا مقایسه‌ی نهایی parity انجام شود.

برای PRهای معمولی، به‌جای اینکه parity را وضعیت الزامی بدانید، از شواهد CI/بررسی scoped پیروی کنید.

## CodeQL

workflow مربوط به `CodeQL` عمدا یک اسکنر امنیتی محدود برای گذر نخست است، نه جاروب کامل repository. اجراهای محافظ روزانه، دستی، و pull requestهای غیر draft، کد workflowهای Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

محافظ pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را مانند workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌بندی‌های امنیتی

| دسته‌بندی                                         | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، cron، و خط پایه gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌علاوه runtime مربوط به Plugin کانال، Gateway، Plugin SDK، اسرار، نقاط تماس audit              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح core مربوط به SSRF، تحلیل IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای process، تحویل outbound، و gateهای اجرای tool برای agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد مربوط به نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری source، و قرارداد package در Plugin SDK |

### shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکس Blacksmith که sanity مربوط به workflow می‌پذیرد، به‌صورت دستی build می‌کند. زیر `/codeql-critical-security/android` آپلود می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی build می‌کند، نتایج build وابستگی‌ها را از SARIF آپلودشده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` آپلود می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است چون build macOS حتی وقتی تمیز باشد، runtime را غالب می‌کند.

### دسته‌بندی‌های Critical Quality

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت error را روی سطوح محدود و پربازده، روی runner کوچک‌تر لینوکس Blacksmith اجرا می‌کند. محافظ pull request آن عمدا کوچک‌تر از profile زمان‌بندی‌شده است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای command/model/tool در agent و dispatch پاسخ، کد schema/migration/IO مربوط به config، کد auth/secrets/sandbox/security، runtime کانال core و Plugin کانال bundled، پروتکل Gateway/server-method، glue مربوط به memory runtime/SDK، MCP/process/outbound delivery، runtime ارائه‌دهنده/model catalog، session diagnostics/delivery queues، plugin loader، Plugin SDK/package-contract، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات config مربوط به CodeQL و workflow کیفیت، هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profileهای محدود، hookهای آموزش/تکرار برای اجرای یک shard کیفیت به‌صورت مجزا هستند.

| دسته‌بندی                                               | سطح                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، cron، و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization، و IO مربوط به config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای method سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال core و Plugin کانال bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای command، dispatch مدل/ارائه‌دهنده، dispatch و queueهای auto-reply، و قراردادهای runtime صفحه کنترل ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و bridgeهای tool، helperهای نظارت process، و قراردادهای outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، facadeهای memory runtime، aliasهای memory در Plugin SDK، glue فعال‌سازی memory runtime، و commandهای memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals مربوط به queue پاسخ، queueهای تحویل session، helperهای binding/تحویل outbound session، سطوح diagnostic event/log bundle، و قراردادهای CLI مربوط به session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ inbound در Plugin SDK، helperهای payload/chunking/runtime پاسخ، optionهای پاسخ کانال، queueهای تحویل، و helperهای binding مربوط به session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization مربوط به model catalog، auth و discovery ارائه‌دهنده، ثبت runtime ارائه‌دهنده، defaults/catalogs ارائه‌دهنده، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap مربوط به Control UI، persistence محلی، جریان‌های control در Gateway، و قراردادهای runtime صفحه کنترل task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به core web fetch/search، media IO، media understanding، image-generation، و media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface، و entrypointهای Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source مربوط به Plugin SDK در سمت package منتشرشده و helperهای قرارداد plugin package                                                                                      |

کیفیت از امنیت جدا می‌ماند تا findings کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای bundled فقط پس از پایدار شدن runtime و سیگنال profileهای محدود، باید به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## workflowهای نگه‌داری

### Docs Agent

workflow مربوط به `Docs Agent` یک lane نگه‌داری Codex رویدادمحور برای هم‌راستا نگه‌داشتن docs موجود با تغییرات اخیرا landed شده است. schedule خالص ندارد: یک اجرای موفق CI برای push غیر bot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلوتر رفته باشد یا وقتی اجرای غیر skipped دیگری از Docs Agent در ساعت گذشته ایجاد شده باشد skip می‌شوند. وقتی اجرا می‌شود، range مربوط به commit را از SHA منبع Docs Agent غیر skipped قبلی تا `main` فعلی review می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main را که از آخرین گذر docs انباشته شده‌اند پوشش دهد.

### Test Performance Agent

workflow مربوط به `Test Performance Agent` یک lane نگه‌داری Codex رویدادمحور برای testهای کند است. schedule خالص ندارد: یک اجرای موفق CI برای push غیر bot روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی از آن gate فعالیت روزانه عبور می‌کند. این lane یک گزارش عملکرد Vitest گروه‌بندی‌شده full-suite می‌سازد، به Codex اجازه می‌دهد فقط fixهای کوچک عملکرد test که coverage را حفظ می‌کنند انجام دهد نه refactorهای گسترده، سپس گزارش full-suite را دوباره اجرا می‌کند و تغییراتی را که تعداد testهای passing baseline را کاهش دهند رد می‌کند. اگر baseline testهای failing داشته باشد، Codex فقط می‌تواند failureهای obvious را fix کند و گزارش full-suite پس از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از landed شدن push مربوط به bot جلو می‌رود، این lane patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مانند docs agent حفظ کند.

### PRهای تکراری پس از Merge

workflow مربوط به `Duplicate PRs After Merge` یک workflow دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای فهرست‌شده صریح را می‌بندد. پیش از تغییر GitHub، بررسی می‌کند که PR landed شده merge شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییرکرده overlapping داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gateهای بررسی محلی و routing تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن gate بررسی محلی درباره مرزهای معماری از scope گسترده platform در CI سخت‌گیرتر است:

- تغییرات production در core، typecheck مربوط به core prod و core test به‌علاوه lint/guardهای core را اجرا می‌کنند؛
- تغییرات فقط test در core، فقط typecheck مربوط به core test به‌علاوه lint core را اجرا می‌کنند؛
- تغییرات production در extension، typecheck مربوط به extension prod و extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط test در extension، typecheck مربوط به extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا plugin-contract به typecheck extension گسترش می‌یابند چون extensionها به آن قراردادهای core وابسته‌اند (جاروب‌های Vitest مربوط به extension همچنان کار test صریح می‌مانند)؛
- bumpهای version فقط metadata مربوط به release، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای ایمنی به همه laneهای بررسی fail safe می‌شوند.

routing محلی changed-test در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: editهای مستقیم test خودشان را اجرا می‌کنند، editهای source mappingهای صریح را ترجیح می‌دهند، سپس testهای sibling و dependents مربوط به import-graph. config تحویل shared group-room یکی از mappingهای صریح است: تغییرات در config پاسخ visible گروه، mode تحویل پاسخ source، یا prompt سیستم message-tool از مسیر testهای core reply به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر default مشترک پیش از نخستین push PR fail شود. فقط وقتی تغییر به‌اندازه‌ای در سطح harness گسترده است که مجموعه mapped ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اثبات گسترده، یک box تازه و گرم‌شده را ترجیح دهید. پیش از صرف زمان برای یک gate کند روی boxای که دوباره استفاده شده، منقضی شده، یا به‌تازگی یک همگام‌سازی غیرمنتظره بزرگ گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل همان box اجرا کنید.

بررسی sanity وقتی فایل‌های الزامی ریشه مثل `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف tracked نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت همگام‌سازی راه‌دور، کپی قابل اعتمادی از PR نیست؛ آن box را متوقف کنید و به‌جای اشکال‌زدایی شکست تست محصول، یک box تازه را گرم کنید. برای PRهایی که حذف‌های بزرگ عمدی دارند، برای همان اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین اجرای محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

Crabbox wrapper راه‌دور متعلق به مخزن برای اثبات Linux نگه‌دارندگان است. وقتی یک بررسی برای چرخهٔ ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی با CI اهمیت دارد، یا وقتی اثبات به secretها، Docker، laneهای بسته، boxهای قابل استفادهٔ مجدد، یا لاگ‌های راه‌دور نیاز دارد، از آن استفاده کنید. backend معمول OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner متعلق به پروژه، fallback برای قطعی‌های Blacksmith، مشکلات quota، یا تست صریح ظرفیت متعلق به پروژه است.

پیش از اولین اجرا، wrapper را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper مخزن، باینری Crabbox قدیمی را که `blacksmith-testbox` را تبلیغ نمی‌کند رد می‌کند. provider را صریحا پاس دهید، هرچند `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد.

gate تغییرات:

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

اجرای دوبارهٔ تست متمرکز:

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

مجموعهٔ کامل:

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

خلاصهٔ نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs`، و `totalMs` هستند. اجراهای یک‌بارهٔ Crabbox متکی بر Blacksmith باید Testbox را به‌صورت خودکار متوقف کنند؛ اگر اجرا قطع شد یا وضعیت پاک‌سازی روشن نبود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی reuse را استفاده کنید که عمدا به چند فرمان روی همان box آماده‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایهٔ خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم به‌عنوان fallback محدود استفاده کنید:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی به ظرفیت Crabbox متعلق به پروژه ارتقا دهید که Blacksmith از دسترس خارج است، quota محدود شده، محیط موردنیاز را ندارد، یا ظرفیت متعلق به پروژه صریحا هدف است:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration مربوط به GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را مستثنی می‌کند تا checkout آماده‌شدهٔ Actions، به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، metadata راه‌دور Git خودش را نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و تحویل محیط غیرsecret برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
