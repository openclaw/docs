---
read_when:
    - باید بدانید چرا یک کار یکپارچه‌سازی پیوسته اجرا شده یا نشده است
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما یک اجرای اعتبارسنجی انتشار یا اجرای مجدد آن را هماهنگ می‌کنید
    - در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: نمودار کارهای یکپارچه‌سازی مداوم، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-02T22:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` diff را دسته‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا از scoping هوشمند عبور می‌کنند و کل graph را برای release candidateها و اعتبارسنجی گسترده پخش می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مختص release در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| کار                              | هدف                                                                                                             | زمان اجرا                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                             | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                                               | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit فایل lock تولیدی بدون dependency در برابر advisoryهای npm                                                    | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | aggregate الزامی برای کارهای امنیتی سریع                                                                       | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | پاس فقط dependency تولیدی Knip به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                           | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های built-artifact، و artifactهای downstream قابل استفاده‌مجدد                                 | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                                        | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded قرارداد channel با یک نتیجه aggregate پایدار                                                | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                                    | تغییرات مرتبط با Node              |
| `check`                          | معادل local gate اصلی به‌صورت sharded: prod types، lint، guards، test types، و strict smoke                          | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، boundary، drift در prompt snapshot، guardهای سطح extension، package-boundary، و shardهای gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke مربوط به startup-memory                                                                      | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به built-artifact                                                                           | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری Node 22                                                                          | dispatch دستی CI برای releaseها    |
| `check-docs`                     | format، lint، و بررسی لینک‌های شکسته در docs                                                                       | تغییر docs                       |
| `skills-python`                  | Ruff + pytest برای skillهای پشتیبانی‌شده با Python                                                                              | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | تست‌های مخصوص process/path در Windows به‌همراه regressionهای shared runtime import specifier                                | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript روی macOS با استفاده از artifactهای ساخته‌شده shared                                                         | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای app macOS                                                                      | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های واحد Android برای هر دو flavor به‌همراه یک ساخت APK debug                                                        | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                                           | موفقیت CI روی main یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد روزانه/درخواستی runtime Kova با laneهای mock-provider، deep-profile، و live مربوط به GPT 5.4           | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اساسا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` مرحله‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کننده‌های downstream به‌محض آماده شدن build مشترک بتوانند شروع کنند.
4. سپس laneهای سنگین‌تر platform و runtime پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` می‌آید، کارهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref هم در حال fail شدن باشد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما پس از آنکه کل workflow از قبل supersede شده است در صف نمانند. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را برای مدت نامحدود block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی از تشخیص changed-scope عبور می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که گویی هر بخش scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI را به‌همراه workflow linting اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای پلتفرم همچنان به تغییرات source همان پلتفرم scoped می‌مانند.
- **ویرایش‌های فقط routing در CI، ویرایش‌های منتخب fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper محدود باشد که task سریع مستقیما آن‌ها را exercise می‌کند، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را skip می‌کند.
- **بررسی‌های Windows Node** به wrapperهای مخصوص process/path در Windows، helperهای runner مربوط به npm/pnpm/UI، config مربوط به package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، plugin، install-smoke، و فقط test روی laneهای Linux Node می‌مانند.

کندترین خانواده‌های تست Node split یا balance شده‌اند تا هر کار بدون over-reserve کردن runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای کوچک unit مربوط به core جفت شده‌اند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing split شده است)، و configهای agentic gateway/plugin به‌جای انتظار برای artifactهای ساخته‌شده، میان کارهای agentic Node موجود و فقط source پخش شده‌اند. تست‌های گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard مربوط به CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری runtime topology را از پوشش gateway watch جدا می‌کند؛ shard مربوط به boundary guard، guardهای کوچک مستقل خود را به‌صورت concurrent داخل یک job اجرا می‌کند، از جمله `pnpm prompt:snapshots:check` تا drift مربوط به prompt مسیر happy-path در Codex به همان PR که باعث آن شده pin شود. Gateway watch، تست‌های channel، و shard مربوط به core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، به‌صورت concurrent داخل `build-artifacts` اجرا می‌شوند.

Android CI هر دو `testPlayDebugUnitTest` و `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ lane تست واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از یک کار تکراری packaging برای APK debug در هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies` دستور `pnpm deadcode:dependencies` (یک پاس فقط dependency تولیدی Knip که به آخرین نسخه Knip pin شده و minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های production unused-file مربوط به Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard مربوط به unused-file وقتی fail می‌شود که یک PR فایل استفاده‌نشده جدید و reviewنشده اضافه کند یا یک entry stale در allowlist باقی بگذارد، در حالی که سطح‌های intentional dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیر trusted را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token برای GitHub App ایجاد می‌کند، سپس payloadهای compact مربوط به `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمدا از forward کردن بدنه کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper post می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و باید فقط وقتی event غیرمنتظره، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید است به `#clawsweeper` post کند. باز شدن‌های routine، ویرایش‌ها، churn مربوط به bot، نویز webhook تکراری، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را در سراسر این مسیر به‌عنوان داده غیر trusted در نظر بگیرید. آن‌ها input برای summarization و triage هستند، نه دستور برای workflow یا runtime مربوط به agent.

## dispatchهای دستی

اجرای دستی CI همان گراف job معمول CI را اجرا می‌کند، اما هر lane محدوده‌دار غیر Android را فعال می‌کند: شاردهای Linux Node، شاردهای Plugin همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، و i18n رابط کاربری کنترل. اجرای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر کامل انتشار با پاس‌دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، شارد فقط-انتشار `agentic-plugins`، sweep کامل دسته‌ای افزونه‌ها، و laneهای Docker پیش‌انتشار Plugin از CI حذف شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش‌کار جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجراهای دستی از یک گروه هم‌زمانی یکتا استفاده می‌کنند تا مجموعه کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک فراخواننده معتمد اجازه می‌دهد آن گراف را روی یک شاخه، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                           | Jobها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و تجمیع‌کننده‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/همراه، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و تجمیع‌کننده‌های `check-additional`، تأییدکننده‌های تجمیعی تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند صف شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر افزونه، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای تست Linux Node، شاردهای تست Plugin همراه، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به‌اندازه‌ای حساس به CPU است که 8 vCPU بیشتر از صرفه‌جویی‌اش هزینه داشت)؛ ساخت‌های Docker مربوط به install-smoke (زمان صف 32-vCPU بیشتر از صرفه‌جویی‌اش هزینه داشت)                                                                                                                                                                                                                                                                                                                     |
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

## عملکرد OpenClaw

`OpenClaw Performance` workflow عملکرد محصول/runtime است. این workflow هر روز روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

این workflow، OCM را از یک انتشار pinشده و Kova را از ورودی pinشده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic Kova در برابر runtime ساخت محلی با احراز هویت جعلی قطعی و سازگار با OpenAI.
- `mock-deep-profile`: profileگیری CPU/heap/trace برای نقاط داغ startup، Gateway، و agent-turn.
- `live-gpt54`: یک turn واقعی عامل OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider پس از گذر Kova، probeهای منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook، و 50-Plugin؛ حلقه‌های تکرارشونده hello با mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های startup مربوط به CLI در برابر Gateway bootشده. خلاصه Markdown probe منبع در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را زیر `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` در `openclaw/clawgrit-reports` commit می‌کند. اشاره‌گر شاخه فعلی به‌صورت `openclaw-performance/<ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` workflow چتری دستی برای «اجرای همه‌چیز قبل از انتشار» است. این workflow یک شاخه، tag، یا SHA کامل commit را می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای اثبات فقط-انتشار مربوط به Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، suiteهای مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ترازی QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact به نام `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را پاس دهید تا همان lane بسته Telegram را در برابر بسته npm منتشرشده دوباره اجرا کند.

برای ماتریس stage، نام دقیق jobهای workflow، تفاوت profileها، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` workflow انتشار دستی و تغییردهنده است. پس از وجود داشتن tag انتشار و پس از موفقیت preflight مربوط به npm OpenClaw، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را تأیید می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit pinشده روی شاخه‌ای که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch refهای workflow در GitHub باید شاخه یا tag باشند، نه SHA خام commit. helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از همان ref pinشده dispatch می‌کند، تأیید می‌کند که `headSha` هر workflow فرزند با target مطابقت دارد، و پس از کامل‌شدن اجرا شاخه موقت را حذف می‌کند. verifier چتری همچنین اگر هر workflow فرزند با SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره live/provider پاس‌داده‌شده به release checks را کنترل می‌کند. workflowهای دستی انتشار به‌صورت پیش‌فرض `stable` هستند؛ فقط زمانی از `full` استفاده کنید که عمدا ماتریس advisory گسترده provider/media را می‌خواهید.

- `minimum` سریع‌ترین laneهای OpenAI/core حیاتی برای انتشار را نگه می‌دارد.
- `stable` مجموعه پایدار provider/backend را اضافه می‌کند.
- `full` ماتریس advisory گسترده provider/media را اجرا می‌کند.

چتر، run idهای فرزند dispatchشده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی run فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر run فرزند اضافه می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را rerun کنید تا نتیجه چتری و خلاصه زمان‌بندی refresh شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل عادی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای همه فرزندان انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این باعث می‌شود اجرای دوباره یک جعبه انتشار شکست‌خورده پس از یک اصلاح متمرکز، محدود بماند.

`OpenClaw Release Checks` از ref گردش‌کار قابل اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball به نام `release-package-under-test` تبدیل کند، سپس آن artifact را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به شارد پذیرش بسته می‌دهد. این کار بایت‌های بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چند job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را supersede می‌کنند. مانیتور والد هر گردش‌کار فرزندی را که
قبلا dispatch کرده باشد هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main
پشت یک اجرای کهنه دو ساعته release-check نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار
و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای live و E2E

فرزند release live/E2E پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریالی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای `native-live-src-gateway-profiles` فیلترشده بر اساس provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شاردهای جداگانه صوت/ویدئوی media و شاردهای music فیلترشده بر اساس provider

این همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند providerهای live را آسان‌تر می‌کند. نام شاردهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` همچنان برای اجرای دوباره دستی یک‌باره معتبر می‌مانند.

شاردهای media بومی live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image، `ffmpeg` و `ffprobe` را از قبل نصب می‌کند؛ jobهای media فقط پیش از راه‌اندازی، وجود binaryها را بررسی می‌کنند. مجموعه‌های live متکی بر Docker را روی runnerهای عادی Blacksmith نگه دارید — jobهای container جای مناسبی برای اجرای تست‌های Docker تودرتو نیستند.

شاردهای live مدل/backend متکی بر Docker از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار release live آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل live Docker، Gateway شاردشده بر اساس provider، backend CLI، اتصال ACP، و harness کدکس با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های `timeout` صریح در سطح script دارند که پایین‌تر از timeout job گردش‌کار است، تا یک container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع شکست بخورد. اگر آن شاردها هدف Docker کامل source را مستقل دوباره بسازند، اجرای release نادرست پیکربندی شده است و زمان wall clock را برای buildهای image تکراری هدر می‌دهد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی فرق دارد: CI عادی source tree را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact `package-under-test` آپلود می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256، و پروفایل را در خلاصه step گیت‌هاب چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار reusable آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر همان بسته اجرا می‌کند. وقتی یک پروفایل چند `docker_lanes` هدفمند را انتخاب کند، گردش‌کار reusable بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر پذیرش بسته یک مورد را resolve کرده باشد، همان artifact `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@alpha`، `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب، یا SHA کامل commit قابل اعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/برچسب‌های OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از history شاخه repository یا یک برچسب انتشار قابل دسترسی باشد، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` با HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده خارجی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد گردش‌کار/harness قابل اعتمادی است که تست را اجرا می‌کند. `package_ref` همان commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی commitهای منبع قدیمی‌تر و قابل اعتماد را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته منتشرشده وابسته به دردسترس‌بودن live ClawHub نباشد. lane اختیاری Telegram در `NPM Telegram Beta E2E` از artifact `package-under-test` دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل commandهای محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های release، و triage شکست،
به [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

release checkها پذیرش بسته را با `source=artifact`، artifact بسته release آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=all-since-2026.4.23`، `published_upgrade_survivor_scenarios=reported-issues` و `telegram_mode=mock-openai` فراخوانی می‌کنند. این باعث می‌شود اثبات مهاجرت بسته، به‌روزرسانی، پاکسازی dependencyهای stale Plugin، ترمیم نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و Telegram روی همان tarball بسته resolveشده انجام شود. برای اجرای همان matrix در برابر یک بسته npm ارسال‌شده، به‌جای artifact ساخته‌شده از SHA، مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. release checkهای Cross-OS همچنان onboarding، نصب‌کننده، و رفتار پلتفرمی ویژه OS را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با پذیرش بسته آغاز شود. lane Docker با نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند، که به‌طور پیش‌فرض `openclaw@latest` است؛ commandهای اجرای دوباره lane شکست‌خورده همان baseline را حفظ می‌کنند. برای گسترش Full Release CI روی همه releaseهای پایدار npm از `2026.4.23` تا `latest` مقدار `published_upgrade_survivor_baselines=all-since-2026.4.23` را تنظیم کنید؛ `release-history` برای نمونه‌گیری دستی گسترده‌تر با anchor قدیمی‌تر قبل از تاریخ همچنان دردسترس است. برای گسترش همان baselineها روی fixtureهای شبیه issue برای config فیشو، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های stale dependency Plugin قدیمی، مقدار `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید. گردش‌کار جداگانه `Update Migration` وقتی پرسش، پاکسازی کامل به‌روزرسانی‌های منتشرشده است و نه گستره عادی Full Release CI، از lane Docker `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای matrix سناریو مقدار `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با یک recipe از command آماده `openclaw config set` پیکربندی می‌کند، stepهای recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند. laneهای fresh بسته‌بندی‌شده و نصب‌کننده Windows همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند یک override کنترل مرورگر را از یک مسیر absolute خام Windows import کند. smoke نوبت agent Cross-OS OpenAI در صورت تنظیم بودن به‌طور پیش‌فرض از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 بماند و از پیش‌فرض‌های GPT-4.x اجتناب شود.

### پنجره‌های سازگاری قدیمی

پذیرش بسته برای بسته‌هایی که از قبل منتشر شده‌اند پنجره‌های bounded سازگاری قدیمی دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- ورودی‌های private QA شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرمورد persistence مربوط به `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند skip کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture git جعلی مشتق‌شده از tarball prune کند و ممکن است `update.channel` persisted گم‌شده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا persistence گم‌شده install-record مربوط به marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata مربوط به config را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp metadata build محلی که قبلا ارسال شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، fail می‌شوند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تایید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی فازها و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، اجرای دوباره پروفایل بسته ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## دودآزمایی نصب

گردش‌کار جداگانه `Install Smoke` همان اسکریپت دامنه را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این گردش‌کار پوشش دودآزمایی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Plugin همراه، یا سطح‌های هسته‌ای Plugin/کانال/Gateway/Plugin SDK را لمس می‌کنند که jobهای دودآزمایی Docker آن‌ها را تمرین می‌دهند. تغییرات فقط‌منبع در Pluginهای همراه، ویرایش‌های فقط‌آزمون، و ویرایش‌های فقط‌مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودآزمایی CLI حذف agents در workspace مشترک را اجرا می‌کند، e2e مربوط به Gateway-network کانتینر را اجرا می‌کند، یک آرگومان ساخت اکستنشن همراه را تایید می‌کند و پروفایل Docker محدود Plugin همراه را با مهلت زمانی تجمیعی ۲۴۰ ثانیه‌ای برای فرمان اجرا می‌کند؛ اجرای Docker هر سناریو جداگانه محدود می‌شود.
- **مسیر کامل** پوشش نصب بسته QR و Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call و pull requestهایی نگه می‌دارد که واقعا سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر دودآزمایی GHCR از Dockerfile ریشه برای SHA هدف آماده می‌کند یا دوباره استفاده می‌کند، سپس نصب بسته QR، دودآزمایی‌های Dockerfile/Gateway ریشه، دودآزمایی‌های نصب‌کننده/update و E2E سریع Docker مربوط به Plugin همراه را به‌صورت jobهای جدا اجرا می‌کند تا کار نصب‌کننده پشت دودآزمایی‌های تصویر ریشه منتظر نماند.

pushهای `main`، شامل merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق دامنه تغییرات روی یک push پوشش کامل را درخواست کند، گردش‌کار دودآزمایی سریع Docker را نگه می‌دارد و دودآزمایی کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودآزمایی کند نصب سراسری Bun برای image-provider جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این مورد در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای متمرکز بر نصب خود را حفظ می‌کنند.

## E2E محلی Docker

`pnpm test:docker:all` یک تصویر live-test مشترک را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک اجراکننده خام Node/Git برای laneهای نصب‌کننده/update/وابستگی Plugin؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و اجراکننده فقط plan انتخاب‌شده را اجرا می‌کند. زمان‌بند تصویر هر lane را با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                 | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای pool اصلی برای laneهای عادی.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای pool انتهایی حساس به provider.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttling نکنند.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از طوفان ساخت در daemon Docker؛ برای بدون فاصله‌گذاری، `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت زمانی fallback برای هر lane، ۱۲۰ دقیقه؛ laneهای منتخب live/tail سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` plan زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست دقیق laneها با جداکننده کاما؛ دودآزمایی پاک‌سازی را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف موثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا آزاد کردن ظرفیت به‌تنهایی اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای E2E قدیمی OpenClaw را حذف می‌کنند، وضعیت laneهای فعال را منتشر می‌کنند، زمان‌بندی laneها را برای ترتیب طولانی‌ترین-اول ماندگار می‌کنند، و به‌طور پیش‌فرض پس از نخستین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### گردش‌کار reusable live/E2E

گردش‌کار reusable live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع تصویر، تصویر live، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک آرتیفکت بسته از اجرای جاری دانلود می‌کند، یا یک آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای بسته نصب‌شده نیاز داشته باشد، تصاویر E2E خام/کاربردی Docker در GHCR با tag مبتنی بر digest بسته را از طریق cache لایه Docker مربوط به Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصاویر موجود مبتنی بر digest بسته را دوباره استفاده می‌کند. pullهای تصویر Docker با مهلت زمانی محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا جریان گیرکرده registry/cache، به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره تلاش شود.

### chunkهای مسیر انتشار

پوشش Docker انتشار jobهای chunkشده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را که لازم دارد pull کند و چند lane را از طریق همان زمان‌بند weighted اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime هستند. alias lane `install-e2e` همچنان alias تجمیعی اجرای دوباره دستی برای هر دو lane نصب‌کننده provider باقی می‌ماند.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط OpenWebUI نگه می‌دارد. laneهای update کانال‌های همراه برای failureهای گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON مربوط به plan زمان‌بند، جدول‌های slow-lane، و فرمان‌های اجرای دوباره برای هر lane آپلود می‌کند. ورودی `docker_lanes` گردش‌کار laneهای انتخاب‌شده را به‌جای jobهای chunk روی تصاویر آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود یا دوباره استفاده می‌کند؛ اگر یک lane انتخاب‌شده live Docker lane باشد، job هدفمند تصویر live-test را به‌صورت محلی برای آن اجرای دوباره می‌سازد. فرمان‌های تولیدشده GitHub برای اجرای دوباره هر lane، وقتی این مقادیر وجود داشته باشند، `package_artifact_run_id`، `package_artifact_name` و ورودی‌های تصویر آماده‌شده را شامل می‌شوند تا یک lane ناموفق بتواند همان بسته و تصاویر دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده live/E2E مجموعه کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته گران‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این گردش‌کار آزمون‌های Pluginهای همراه را بین هشت worker اکستنشن متوازن می‌کند؛ آن jobهای shard اکستنشن هم‌زمان تا دو گروه پیکربندی Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import jobهای CI اضافی ایجاد نکنند. مسیر Docker پیش‌انتشار مخصوص انتشار، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری کند.

## آزمایشگاه QA

QA Lab laneهای اختصاصی CI خارج از گردش‌کار اصلی smart-scoped دارد. برابری agentic زیر harnessهای گسترده QA و انتشار تو در تو است، نه یک گردش‌کار مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده باشد، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این گردش‌کار lane برابری mock، lane live Matrix و laneهای live Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای transport زنده Matrix و Telegram را با provider mock قطعی و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از latency مدل زنده و startup عادی provider-plugin جدا شود. Gateway transport زنده جست‌وجوی حافظه را غیرفعال می‌کند، زیرا parity QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه مدل زنده، provider بومی و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند، و فقط زمانی `--fail-fast` را اضافه می‌کند که CLI checkoutشده از آن پشتیبانی کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` باقی می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از تایید انتشار اجرا می‌کند؛ gate برابری QA آن بسته‌های candidate و baseline را به‌عنوان jobهای موازی lane اجرا می‌کند، سپس هر دو آرتیفکت را در یک job کوچک گزارش دانلود می‌کند تا مقایسه نهایی parity انجام شود.

برای PRهای عادی، به‌جای تلقی parity به‌عنوان status الزامی، از شواهد scoped CI/check پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی گذر اول و محدود است، نه جاروب کامل مخزن. اجراهای نگهبان روزانه، دستی، و درخواست کشش غیرپیش‌نویس، کد گردش‌کار Actions به‌همراه پرریسک‌ترین سطوح JavaScript/TypeScript را با کوئری‌های امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

نگهبان درخواست کشش سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را اجرا می‌کند که گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS از پیش‌فرض‌های PR بیرون می‌مانند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، Cron، و خط پایه Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه زمان اجرای Plugin کانال، Gateway، Plugin SDK، اسرار، نقاط تماس audit              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF هسته، تجزیه IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای فرایند، تحویل خروجی، و gateهای اجرای ابزار agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و سطوح اعتماد قرارداد بسته Plugin SDK |

### shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که workflow sanity می‌پذیرد می‌سازد. زیر `/codeql-critical-security/android` آپلود می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج build وابستگی را از SARIF آپلودشده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` آپلود می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده چون build macOS حتی در حالت clean هم بر زمان اجرا غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. این shard فقط کوئری‌های کیفیت JavaScript/TypeScript با شدت خطا و غیرامنیتی را روی سطوح محدود و پرارزش روی runner کوچک‌تر لینوکسی Blacksmith اجرا می‌کند. نگهبان درخواست کشش آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای command/model/tool agent و dispatch پاسخ، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، زمان اجرای کانال هسته و Plugin کانال همراه، Gateway protocol/server-method، چسب runtime/SDK حافظه، MCP/process/outbound delivery، کاتالوگ provider runtime/model، session diagnostics/delivery queues، Plugin loader، Plugin SDK/package-contract، یا Plugin SDK reply runtime اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، hookهای آموزش/تکرار برای اجرای یک shard کیفیت به‌صورت ایزوله هستند.

| دسته                                                   | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، Cron، و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema پیکربندی، migration، normalization، و IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای method سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال همراه                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای command، dispatch مدل/provider، dispatch و صف‌های auto-reply، و قراردادهای runtime سطح کنترل ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، helperهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای حافظه در Plugin SDK، چسب فعال‌سازی runtime حافظه، و commandهای doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals صف پاسخ، صف‌های تحویل session، helperهای اتصال/تحویل session خروجی، سطوح diagnostic event/log bundle، و قراردادهای CLI مربوط به session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، helperهای reply payload/chunking/runtime، گزینه‌های پاسخ کانال، صف‌های تحویل، و helperهای اتصال session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، auth و discovery مربوط به provider، ثبت provider runtime، defaults/catalogs مربوط به provider، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، persistence محلی، جریان‌های کنترل Gateway، و قراردادهای runtime سطح کنترل task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | fetch/search وب هسته، media IO، درک رسانه، image-generation، و قراردادهای runtime مربوط به media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface، و entrypointهای Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | سورس منتشرشده Plugin SDK در سمت بسته و helperهای قرارداد بسته Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند بدون آنکه سیگنال امنیتی را مبهم کنند. گسترش CodeQL برای Swift، Python، و Pluginهای همراه باید فقط بعد از پایدار شدن runtime و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری scoped یا sharded اضافه شود.

## گردش‌کارهای نگهداری

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداری event-driven در Codex برای همسو نگه داشتن مستندات موجود با تغییرات تازه land شده است. schedule خالص ندارد: یک اجرای CI موفق push غیرbot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیماً اجرا کند. invocationهای workflow-run وقتی `main` جلو رفته باشد یا وقتی یک اجرای non-skipped دیگر Docs Agent در یک ساعت گذشته ساخته شده باشد skip می‌شوند. وقتی اجرا می‌شود، بازه commit از SHA منبع Docs Agent غیر skip شده قبلی تا `main` فعلی را review می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل کارایی تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداری event-driven در Codex برای تست‌های کند است. schedule خالص ندارد: یک اجرای CI موفق push غیرbot روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد skip می‌شود. dispatch دستی از آن gate فعالیت روزانه عبور می‌کند. این مسیر یک گزارش کارایی Vitest گروه‌بندی‌شده برای full-suite می‌سازد، به Codex اجازه می‌دهد فقط fixهای کوچک و coverage-preserving برای کارایی تست انجام دهد نه refactorهای گسترده، سپس گزارش full-suite را دوباره اجرا می‌کند و تغییراتی را که شمار تست‌های baseline پاس‌شده را کاهش دهند reject می‌کند. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای obvious را fix کند و گزارش full-suite بعد از agent باید pass شود پیش از آنکه چیزی commit شود. وقتی `main` قبل از land شدن push bot جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale متضاد skip می‌شوند. از Ubuntu میزبانی‌شده GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مانند docs agent حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط زمانی PRهای صراحتاً فهرست‌شده را می‌بندد که `apply=true` باشد. پیش از mutation در GitHub، بررسی می‌کند که PR land شده merge شده باشد و هر duplicate یا یک issue referenced مشترک داشته باشد یا hunkهای changed همپوشان.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gateهای بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن gate بررسی محلی نسبت به محدوده گسترده پلتفرم CI درباره مرزهای architecture سخت‌گیرتر است:

- تغییرات production هسته، typecheck مربوط به core prod و core test به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck مربوط به core test به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات production در extension، typecheck مربوط به extension prod و extension test به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck مربوط به extension test به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات public Plugin SDK یا plugin-contract به typecheck extension گسترش می‌یابند چون extensionها به آن قراردادهای هسته وابسته‌اند (sweepهای Vitest extension کار تست explicit باقی می‌مانند)؛
- version bumpهای فقط release metadata، checkهای targeted مربوط به version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config به‌صورت fail-safe به همه check laneها می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً از `check:changed` ارزان‌تر است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source mappingهای explicit را ترجیح می‌دهند، سپس تست‌های sibling و dependentهای import-graph. پیکربندی shared group-room delivery یکی از mappingهای explicit است: تغییرات در پیکربندی visible-reply گروه، حالت source reply delivery، یا system prompt ابزار پیام از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا یک تغییر پیش‌فرض shared پیش از اولین push PR fail شود. از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط وقتی استفاده کنید که تغییر به اندازه‌ای harness-wide باشد که مجموعه mapped ارزان proxy قابل اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشه‌ی مخزن اجرا کنید و برای راستی‌آزمایی گسترده، یک باکس گرم‌شده‌ی تازه را ترجیح دهید. پیش از صرف کردن یک گیت زمان‌بر روی باکسی که دوباره استفاده شده، منقضی شده، یا همین حالا همگام‌سازی غیرمنتظره‌ای بزرگ را گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل باکس اجرا کنید.

بررسی سلامت وقتی فایل‌های ریشه‌ی لازم مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف ردیابی‌شده را نشان دهد، سریع شکست می‌خورد. این معمولاً یعنی وضعیت همگام‌سازی ریموت نسخه‌ی قابل‌اعتمادی از درخواست کشش نیست؛ به‌جای عیب‌یابی شکست تست محصول، آن باکس را متوقف کنید و یک باکس تازه را گرم کنید. برای درخواست‌های کشش با حذف‌های بزرگ و عمدی، برای آن اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین اجرای محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحله‌ی همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای اختلاف‌های محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

Crabbox مسیر دوم باکس ریموتِ متعلق به مخزن برای راستی‌آزمایی Linux است، وقتی Blacksmith در دسترس نیست یا وقتی ظرفیت ابری تحت مالکیت ترجیح دارد. یک باکس را گرم کنید، آن را از طریق گردش‌کار پروژه آب‌رسانی کنید، سپس فرمان‌ها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی، و آب‌رسانی GitHub Actions است. این فایل `.git` محلی را مستثنا می‌کند تا checkout آب‌رسانی‌شده‌ی Actions به‌جای همگام‌سازی ریموت‌ها و انبارهای آبجکتِ محلیِ نگه‌دارنده، فراداده‌ی Git ریموت خودش را نگه دارد، و آرتیفکت‌های محلی زمان اجرا/ساخت را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه‌ای است که فرمان‌های بعدی `crabbox run --id <cbx_id>` از آن source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
