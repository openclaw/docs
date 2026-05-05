---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال عیب‌یابی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی برای اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا انتقال فعالیت GitHub هستید
summary: نمودار کارهای CI، گیت‌های دامنه، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-05T01:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job مربوط به `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا scopeبندی هوشمند را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده، کل graph را پخش می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مختص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر-draft |
| `security-scm-fast`              | تشخیص private key و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر-draft |
| `security-dependency-audit`      | audit lockfile تولیدیِ بدون dependency در برابر advisories مربوط به npm                                          | همیشه روی pushها و PRهای غیر-draft |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر-draft |
| `check-dependencies`             | گذر production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای قابل استفاده مجدد برای پایین‌دست                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded مربوط به قرارداد channel با نتیجه aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلیِ sharded: types تولیدی، lint، guardها، test types، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مربوط به boundary/prompt به‌صورت sharded، guardهای extension، package boundary، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke حافظه startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke برای سازگاری با Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | بررسی‌های قالب‌بندی docs، lint، و لینک‌های خراب                                                             | وقتی docs تغییر کرده باشد                       |
| `skills-python`                  | Ruff + pytest برای skills متکی بر Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های اختصاصی Windows برای process/path به‌همراه regressionهای مشترک runtime import specifier                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای اپلیکیشن macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit مربوط به Android برای هر دو flavor به‌همراه یک build از debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت مورداعتماد                                                 | موفقیت Main CI یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های روزانه/درخواستی عملکرد runtime مربوط به Kova با laneهای mock-provider، deep-profile، و GPT 5.4 live | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون منتظر ماندن برای jobهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دست به‌محض آماده شدن build مشترک شروع شوند.
4. laneهای سنگین‌تر پلتفرم و runtime بعد از آن پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

وقتی push جدیدتری روی همان PR یا ref مربوط به `main` وارد شود، GitHub ممکن است jobهای superseded را با وضعیت `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین run برای همان ref هم در حال fail شدن باشد، این را نویز CI در نظر بگیرید. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failهای عادی shard را گزارش کنند، اما پس از superseded شدن کل workflow در صف قرار نگیرند. concurrency key خودکار CI versioned است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند runهای جدیدتر main را نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای درحال اجرا را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار همه areaهای scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI و linting workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجبار نمی‌کنند؛ این laneهای پلتفرم همچنان به تغییرات source همان پلتفرم scope می‌شوند.
- **ویرایش‌های فقط routing در CI، ویرایش‌های انتخاب‌شده fixture تست core ارزان، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، امنیت، و یک task از `checks-fast-core`. وقتی تغییر به سطوح routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای Pluginهای bundled، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path اختصاصی Windows، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطوح workflow مربوط به CI که آن lane را اجرا می‌کنند scope می‌شوند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balance شده‌اند تا هر job بدون over-reserve کردن runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای fast/support مربوط به core unit جداگانه اجرا می‌شوند، infra مربوط به core runtime بین shardهای state و process/config تقسیم می‌شود، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده)، و configهای agentic gateway/server به laneهای chat/auth/model/http-plugin/runtime/startup تقسیم می‌شوند، به‌جای اینکه منتظر artifactهای ساخته‌شده بمانند. تست‌های broad browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از configهای Vitest اختصاصی خودشان استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری topology مربوط به runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guardهای boundary بین چهار shard در matrix stripe شده است، که هرکدام guardهای مستقل انتخاب‌شده را همزمان اجرا می‌کنند و timing هر check را چاپ می‌کنند، از جمله `pnpm prompt:snapshots:check` تا drift مربوط به prompt مسیر خوشحال runtime در Codex به همان PRی pin شود که باعث آن شده است. Gateway watch، تست‌های channel، و shard مربوط به core support-boundary داخل `build-artifacts` و پس از ساخته شدن `dist/` و `dist-runtime/` به‌صورت همزمان اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor مربوط به third-party source set یا manifest جداگانه‌ای ندارد؛ lane مربوط به unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job تکراری package کردن debug APK روی هر push مرتبط با Android اجتناب می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک گذر production Knip فقط برای dependencyها که به آخرین نسخه Knip pin شده و minimum release age مربوط به pnpm برای install با `dlx` غیرفعال است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های production Knip برای فایل‌های استفاده‌نشده را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک ورودی stale در allowlist باقی بگذارد، guard فایل استفاده‌نشده fail می‌شود، درحالی‌که سطوح intentional مربوط به Plugin پویا، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## Forward کردن فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token مربوط به GitHub App می‌سازد، سپس payloadهای compact از نوع `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها وقتی وجود داشته باشند. این مسیر عمدا از forward کردن بدنه کامل Webhook اجتناب می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌شده را به hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper post می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper مقصد Discord را در prompt خود دریافت می‌کند و فقط وقتی باید به `#clawsweeper` post کند که event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید باشد. openها، editها، bot churn، نویز تکراری Webhook، و ترافیک review عادی باید به `NO_REPLY` منتهی شوند.

titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را در سراسر این مسیر داده نامطمئن در نظر بگیرید. آن‌ها ورودی summarization و triage هستند، نه instruction برای workflow یا runtime مربوط به agent.

## Dispatchهای دستی

اجرای دستی CI همان گراف کار عادی CI را اجرا می‌کند، اما همه laneهای محدوده‌بندی‌شده غیر Android را اجباری فعال می‌کند: shardهای Linux Node، shardهای Pluginهای همراه، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS و بومی‌سازی Control UI. اجرای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر کامل انتشار، Android را با ارسال `include_android=true` فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، shard مخصوص انتشار `agentic-plugins`، sweep کامل دسته‌ای extension، و laneهای Docker پیش‌انتشار Plugin از CI حذف شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش‌کار جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجراهای دستی از یک گروه هم‌روندی یکتا استفاده می‌کنند تا مجموعه کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوان مورد اعتماد اجازه می‌دهد آن گراف را روی یک branch، tag، یا commit SHA کامل اجرا کند، در حالی که از فایل workflow موجود در dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                           | Jobها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و تجمیع‌کننده‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/همراه، بررسی‌های shardشده قرارداد کانال، shardهای `check` به‌جز lint، shardها و تجمیع‌کننده‌های `check-additional`، verifierهای تجمیعی تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ preflight install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا matrix Blacksmith زودتر بتواند در صف قرار گیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای extension سبک‌تر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، shardهای تست Linux Node، shardهای تست Plugin همراه، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به‌اندازه‌ای حساس به CPU است که 8 vCPU بیش از صرفه‌جویی، هزینه ایجاد کرد)؛ ساخت‌های Docker مربوط به install-smoke (زمان صف 32-vCPU بیش از صرفه‌جویی، هزینه ایجاد کرد)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` گردش‌کار کارایی محصول/runtime است. روزانه روی `main` اجرا می‌شود و می‌توان آن را دستی dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولاً workflow ref را benchmark می‌کند. برای benchmark کردن یک tag انتشار یا branch دیگر با پیاده‌سازی فعلی workflow، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref تست‌شده کلیدگذاری می‌شوند، و هر `index.md`، ref/SHA تست‌شده، workflow ref/SHA، Kova ref، profile، حالت احراز هویت lane، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

workflow، OCM را از یک انتشار pinned و Kova را از `openclaw/Kova` در ورودی pinned `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic Kova در برابر runtime ساخت محلی با احراز هویت fake سازگار با OpenAI و قطعی.
- `mock-deep-profile`: profiling مربوط به CPU/heap/trace برای hotspotهای startup، Gateway و agent-turn.
- `live-gpt54`: یک agent turn واقعی OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد skip می‌شود.

lane مربوط به mock-provider پس از عبور Kova، probeهای منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی راه‌اندازی Gateway و حافظه در حالت‌های startup پیش‌فرض، hook و 50-Plugin؛ loopهای hello تکراری mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های startup مربوط به CLI در برابر Gateway راه‌اندازی‌شده. خلاصه Markdown مربوط به source probe در bundle گزارش در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر فعلی tested-ref به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک branch، tag، یا commit SHA کامل را می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای اثبات مخصوص انتشار مربوط به Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش package، بررسی‌های package میان‌سیستمی، برابری QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. اجراهای stable/default پوشش جامع live/E2E و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` آن پوشش soak را اجباری فعال می‌کند تا اعتبارسنجی advisory گسترده، همچنان گسترده بماند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، برای اجرای دوباره همان lane package Telegram در برابر package منتشرشده npm، `npm_telegram_package_spec` را ارسال کنید.

برای matrix مرحله‌ها، نام دقیق jobهای workflow، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار دستی تغییردهنده انتشار است. پس از وجود داشتن tag انتشار و پس از موفقیت preflight مربوط به npm در OpenClaw، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همه packageهای قابل انتشار Plugin dispatch می‌کند، `Plugin ClawHub Release` را برای همان release SHA dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit pinned روی یک branch سریع‌تغییر، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch refهای workflow در GitHub باید branch یا tag باشند، نه commit SHA خام. helper یک branch موقت `release-ci/<sha>-...` را در target SHA push می‌کند، `Full Release Validation` را از آن ref pinned dispatch می‌کند، verify می‌کند که `headSha` هر workflow فرزند با target مطابق است، و پس از تکمیل run، branch موقت را حذف می‌کند. verifier چتری همچنین اگر هر workflow فرزند با SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گسترهٔ زنده/ارائه‌دهنده‌ای را کنترل می‌کند که به بررسی‌های انتشار داده می‌شود. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض از `stable` استفاده می‌کنند؛ فقط وقتی از `full` استفاده کنید که عمداً ماتریس گستردهٔ ارائه‌دهنده/رسانهٔ advisory را می‌خواهید. `run_release_soak` کنترل می‌کند که آیا بررسی‌های انتشار پایدار/پیش‌فرض، soak کامل مسیر انتشار زنده/E2E و Docker را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعهٔ پایدار ارائه‌دهنده/بک‌اند را اضافه می‌کند.
- `full` ماتریس گستردهٔ ارائه‌دهنده/رسانهٔ advisory را اجرا می‌کند.

umbrella شناسه‌های اجرای فرزند dispatchشده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job تأییدکنندهٔ والد را دوباره اجرا کنید تا نتیجهٔ umbrella و خلاصهٔ زمان‌بندی تازه‌سازی شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا یک گروه محدودتر: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی umbrella. این کار rerun جعبهٔ انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک lane شکست‌خوردهٔ cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. laneهای QA release-check advisory هستند، بنابراین شکست‌های فقط-QA هشدار می‌دهند اما تأییدکنندهٔ release-check را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` resolve کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance می‌دهد، به‌علاوهٔ گردش‌کار Docker مسیر انتشار زنده/E2E وقتی پوشش soak اجرا می‌شود. این کار byteهای package را در همهٔ جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوبارهٔ همان نامزد در چند job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
umbrella قدیمی‌تر را supersede می‌کنند. مانیتور والد هر گردش‌کار فرزندی را که
قبلاً dispatch کرده، وقتی والد لغو می‌شود لغو می‌کند؛ بنابراین اعتبارسنجی جدیدتر main
پشت یک اجرای stale دوساعتهٔ release-check نمی‌ماند. اعتبارسنجی branch/tag
انتشار و گروه‌های rerun متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## shardهای زنده و E2E

فرزند زنده/E2E انتشار، پوشش گستردهٔ native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریالی، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای `native-live-src-gateway-profiles` فیلترشده بر اساس ارائه‌دهنده
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداشدهٔ رسانهٔ صوت/ویدئو و shardهای موسیقی فیلترشده بر اساس ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند و در عین حال rerun و عیب‌یابی شکست‌های کند ارائه‌دهندهٔ زنده را آسان‌تر می‌کند. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای rerunهای دستی یک‌باره معتبر می‌مانند.

shardهای رسانهٔ زندهٔ native در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند، که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image از قبل `ffmpeg` و `ffprobe` را نصب می‌کند؛ jobهای رسانه فقط قبل از setup، binaryها را تأیید می‌کنند. suiteهای زندهٔ متکی به Docker را روی runnerهای عادی Blacksmith نگه دارید — jobهای container جای نامناسبی برای راه‌اندازی تست‌های Docker تو در تو هستند.

shardهای مدل/بک‌اند زندهٔ متکی به Docker از یک image مشترک جداگانهٔ `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار انتشار زنده آن image را یک‌بار می‌سازد و push می‌کند، سپس shardهای مدل زندهٔ Docker، Gateway sharded بر اساس ارائه‌دهنده، بک‌اند CLI، bind ACP، و harness Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Docker مربوط به Gateway سقف‌های `timeout` صریح در سطح script دارند که زیر timeout job گردش‌کار هستند، تا یک container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجهٔ release-check سریع شکست بخورد. اگر آن shardها target کامل Docker منبع را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده و زمان wall clock را صرف buildهای تکراری image خواهد کرد.

## پذیرش package

از `Package Acceptance` وقتی استفاده کنید که پرسش این است: «آیا این package قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI معمولی متفاوت است: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد package را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و source، workflow ref، package ref، version، SHA-256، و profile را در خلاصهٔ step گیت‌هاب چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار reusable آن artifact را download می‌کند، inventory tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest package را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، علیه همان package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، گردش‌کار reusable package و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` مقدار `none` نباشد اجرا می‌شود و وقتی Package Acceptance یکی را resolve کرده باشد همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشدهٔ npm را نصب کند.
4. `summary` اگر resolution package، Docker acceptance، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منبع‌های نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخهٔ دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک branch، tag، یا SHA کامل commit مورد اعتماد `package_ref` را بسته‌بندی می‌کند. resolver branchها/tagهای OpenClaw را fetch می‌کند، تأیید می‌کند commit انتخاب‌شده از تاریخچهٔ branch مخزن یا یک tag انتشار قابل‌دسترسی است، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS download می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شدهٔ خارجی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد گردش‌کار/harness مورد اعتمادی است که تست را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این باعث می‌شود harness تست فعلی بتواند commitهای منبع مورد اعتماد قدیمی‌تر را بدون اجرای منطق قدیمی گردش‌کار اعتبارسنجی کند.

### profileهای suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوهٔ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunkهای کامل Docker مسیر انتشار با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

profile با نام `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی package منتشرشده به دسترس‌بودن زندهٔ ClawHub وابسته نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec منتشرشدهٔ npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و triage شکست،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار Package Acceptance را با `source=artifact`، artifact آماده‌شدهٔ package انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار proof مربوط به migration package، به‌روزرسانی، cleanup وابستگی Plugin stale، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball package resolveشده نگه می‌دارد. `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix را به‌جای artifact ساخته‌شده از SHA، علیه یک package npm منتشرشده اجرا کند. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار platform مختص OS را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با Package Acceptance شروع شود. lane Docker با نام `published-upgrade-survivor` در مسیر انتشار blocking، در هر run یک baseline package منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolveشدهٔ `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشدهٔ fallback را انتخاب می‌کند، با مقدار پیش‌فرض `openclaw@latest`؛ فرمان‌های rerun مربوط به lane شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقادیر `published_upgrade_survivor_baselines=all-since-2026.4.23` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در همهٔ انتشارهای پایدار npm از `2026.4.23` تا `latest` و fixtureهای شبیه issue برای config مربوط به Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شدهٔ OpenClaw، مسیرهای log با tilde، و ریشه‌های dependency قدیمی stale Plugin گسترش یابد. گردش‌کار جداگانهٔ `Update Migration` وقتی استفاده می‌شود که پرسش cleanup کامل به‌روزرسانی منتشرشده باشد، نه گسترهٔ معمول Full Release CI؛ این گردش‌کار lane Docker با نام `update-migration` را با `all-since-2026.4.23` و `plugin-deps-cleanup` به کار می‌گیرد. runهای aggregate محلی می‌توانند specهای دقیق package را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک lane واحد را نگه دارند، مانند `openclaw@2026.4.15`، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای matrix سناریو تنظیم کنند. lane منتشرشده baseline را با یک دستورالعمل command پخته‌شدهٔ `openclaw config set` پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوهٔ وضعیت RPC را probe می‌کند. laneهای نصب تازهٔ Windows packaged و installer همچنین تأیید می‌کنند که یک package نصب‌شده می‌تواند override کنترل browser را از یک مسیر raw مطلق Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا proof نصب و Gateway روی یک مدل تست GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

Package Acceptance برای packageهای از قبل منتشرشده پنجره‌های سازگاری legacy محدود دارد. packageها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- entryهای خصوصی QA شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- وقتی package آن flag را expose نکند، `doctor-switch` ممکن است زیرمورد پایداری `gateway install --wrapper` را skip کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies`های گمشده را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persistشدهٔ گمشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا persistence گمشدهٔ marketplace install-record را بپذیرند؛
- `plugin-update` ممکن است migration metadata config را مجاز کند، در حالی که همچنان الزام دارد install record و رفتار no-reinstall بدون تغییر بمانند.

package منتشرشدهٔ `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata build محلی که قبلاً منتشر شده‌اند هشدار دهد. packageهای بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، fail می‌شوند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های مسیر، زمان‌بندی فازها و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا مسیرهای دقیق Docker را ترجیح دهید.

## دودآزمایی نصب

Workflow جداگانه‌ی `Install Smoke` همان اسکریپت دامنه را از طریق job خودش با نام `preflight` دوباره استفاده می‌کند. این Workflow پوشش دودآزمایی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/مانیفست Pluginهای همراه، یا سطح‌های Plugin/کانال/Gateway/Plugin SDK هسته را لمس می‌کنند که jobهای دودآزمایی Docker آن‌ها را تمرین می‌دهند. تغییرات فقط-منبع در Pluginهای همراه، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودآزمایی CLI حذف agentها از فضای‌کار مشترک را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، یک آرگومان build برای extension همراه را تأیید می‌کند، و پروفایل Docker محدودشده‌ی Plugin همراه را تحت timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته‌ی QR و پوشش Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار با workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر دودآزمایی Dockerfile ریشه‌ی GHCR با target-SHA آماده یا دوباره استفاده می‌کند، سپس نصب بسته‌ی QR، دودآزمایی‌های Dockerfile/Gateway ریشه، دودآزمایی‌های نصب‌کننده/update، و E2E سریع Docker برای Plugin همراه را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت دودآزمایی‌های تصویر ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق دامنه‌ی تغییرات روی یک push درخواست پوشش کامل کند، Workflow دودآزمایی سریع Docker را نگه می‌دارد و دودآزمایی کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودآزمایی کند نصب سراسری Bun برای image-provider جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این دودآزمایی در زمان‌بندی شبانه و از Workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای نصب‌محور خودشان را نگه می‌دارند.

## E2E محلی Docker

`pnpm test:docker:all` یک تصویر live-test مشترک را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک اجراکننده‌ی ساده‌ی Node/Git برای مسیرهای نصب‌کننده/update/وابستگی-Plugin؛
- یک تصویر کاربردی که همان tarball را برای مسیرهای عملکردی عادی در `/app` نصب می‌کند.

تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و اجراکننده فقط برنامه‌ی انتخاب‌شده را اجرا می‌کند. زمان‌بند تصویر هر مسیر را با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس مسیرها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                  | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد اسلات‌های pool اصلی برای مسیرهای عادی.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد اسلات‌های pool انتهایی حساس به provider.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف مسیرهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف مسیرهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف مسیرهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع مسیرها برای جلوگیری از طوفان create در daemon Docker؛ برای حذف فاصله `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان هر مسیر (۱۲۰ دقیقه)؛ مسیرهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` برنامه‌ی زمان‌بند را بدون اجرای مسیرها چاپ می‌کند.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق مسیرها با جداکننده‌ی کاما؛ دودآزمایی پاک‌سازی را رد می‌کند تا agentها بتوانند یک مسیر ناموفق را بازتولید کنند. |

مسیری که از سقف مؤثر خودش سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس به‌تنهایی اجرا می‌شود تا ظرفیت را آزاد کند. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای stale مربوط به E2E OpenClaw را حذف می‌کنند، وضعیت مسیر فعال را منتشر می‌کنند، زمان‌بندی مسیرها را برای ترتیب‌دهی طولانی‌ترین-اول ذخیره می‌کنند، و به‌طور پیش‌فرض پس از نخستین شکست زمان‌بندی مسیرهای pooled جدید را متوقف می‌کنند.

### Workflow قابل‌استفاده‌ی دوباره‌ی live/E2E

Workflow قابل‌استفاده‌ی دوباره‌ی live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع تصویر، تصویر live، مسیر، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن برنامه را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این Workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته‌ی current-run را دانلود می‌کند، یا آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی برنامه به مسیرهای نصب‌شده-از-بسته نیاز دارد، تصویرهای bare/functional مربوط به GHCR Docker E2E با tag شامل digest بسته را از طریق cache لایه‌ی Docker مربوط به Blacksmith می‌سازد و push می‌کند؛ و به‌جای بازسازی، ورودی‌های `docker_e2e_bare_image`/`docker_e2e_functional_image` فراهم‌شده یا تصویرهای موجود با digest بسته را دوباره استفاده می‌کند. pullهای تصویر Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا stream گیرکرده‌ی registry/cache به‌جای مصرف بخش بزرگی از مسیر بحرانی CI، سریع دوباره تلاش شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار jobهای تکه‌ای کوچک‌تر را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر تکه فقط نوع تصویری را pull کند که لازم دارد و چند مسیر را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

تکه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime می‌مانند. alias مسیر `install-e2e` همچنان alias تجمیعی اجرای دوباره‌ی دستی برای هر دو مسیر نصب‌کننده‌ی provider است.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI یک تکه‌ی مستقل `openwebui` نگه می‌دارد. مسیرهای update کانال همراه برای شکست‌های گذرای شبکه‌ی npm یک‌بار دوباره تلاش می‌کنند.

هر تکه `.artifacts/docker-tests/` را با لاگ‌های مسیر، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON برنامه‌ی زمان‌بند، جدول‌های مسیرهای کند، و فرمان‌های اجرای دوباره برای هر مسیر upload می‌کند. ورودی `docker_lanes` در Workflow مسیرهای انتخاب‌شده را به‌جای jobهای تکه‌ای روی تصویرهای آماده‌شده اجرا می‌کند، که اشکال‌زدایی مسیر ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر یک مسیر انتخاب‌شده مسیر live Docker باشد، job هدفمند تصویر live-test را به‌صورت محلی برای آن اجرای دوباره می‌سازد. فرمان‌های GitHub تولیدشده برای اجرای دوباره‌ی هر مسیر، وقتی این مقدارها وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده‌شده هستند، تا یک مسیر ناموفق بتواند دقیقاً همان بسته و تصویرهای اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow زمان‌بندی‌شده‌ی live/E2E مجموعه‌ی کامل Docker مربوط به release-path را هر روز اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین یک Workflow جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این Workflow تست‌های Plugin همراه را بین هشت worker extension متوازن می‌کند؛ آن jobهای shard مربوط به extension هر بار تا دو گروه پیکربندی Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker فقط-انتشار، مسیرهای Docker هدفمند را در گروه‌های کوچک batch می‌کند تا برای jobهای یک تا سه دقیقه‌ای ده‌ها runner رزرو نشود.

## آزمایشگاه QA

QA Lab مسیرهای CI اختصاصی بیرون از Workflow اصلی با دامنه‌ی هوشمند دارد. برابری agentic زیر harnessهای گسترده‌ی QA و انتشار قرار گرفته است، نه به‌عنوان یک Workflow مستقل PR. وقتی برابری باید همراه یک اجرای اعتبارسنجی گسترده بیاید، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- Workflow `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این Workflow مسیر mock parity، مسیر live Matrix، و مسیرهای live Telegram و Discord را به‌صورت jobهای موازی پخش می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار مسیرهای live transport مربوط به Matrix و Telegram را با provider mock قطعی و مدل‌های واجد mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از latency مدل live و startup عادی provider-plugin جدا بماند. Gateway مربوط به live transport جست‌وجوی حافظه را غیرفعال می‌کند چون QA parity رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه‌ی مدل live، provider بومی، و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. مقدار پیش‌فرض CLI و ورودی Workflow دستی همچنان `all` می‌ماند؛ dispatch دستی با `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین مسیرهای QA Lab حیاتی برای انتشار را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن بسته‌های candidate و baseline را به‌عنوان jobهای مسیر موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک job گزارش کوچک دانلود می‌کند تا مقایسه‌ی نهایی برابری انجام شود.

برای PRهای عادی، به‌جای در نظر گرفتن برابری به‌عنوان یک وضعیت ضروری، شواهد scoped CI/check را دنبال کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی اولیه و محدود است، نه جاروب کامل مخزن. اجراهای روزانه، دستی، و محافظ pull requestهای غیرپیش‌نویس، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که بر اساس `security-severity` بالا/بحرانی فیلتر شده‌اند، اسکن می‌کنند.

محافظ pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را که گردش‌کار زمان‌بندی‌شده اجرا می‌کند، اجرا می‌کند. Android و macOS CodeQL در پیش‌فرض‌های PR وارد نمی‌شوند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، cron، و خط پایه gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال اصلی به‌علاوه runtime کانال Plugin، gateway، Plugin SDK، secrets، و نقاط تماس audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF اصلی، پردازش IP، محافظ شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌گیرنده‌های اجرای پردازه، تحویل خروجی، و گیت‌های اجرای ابزار agent                                                |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و قرارداد package در Plugin SDK          |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیتی Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکس Blacksmith که workflow sanity می‌پذیرد، می‌سازد. خروجی را زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج build وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است چون build macOS حتی در حالت پاک هم runtime را غالب می‌کند.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با severity خطا را روی سطوح محدود و باارزش بالا روی runner کوچک‌تر لینوکس Blacksmith اجرا می‌کند. محافظ pull request آن عمداً کوچک‌تر از نمایه زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار agent و ارسال پاسخ، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، runtime کانال اصلی و کانال Plugin همراه، protocol/server-method در gateway، glue مربوط به memory runtime/SDK، MCP/process/outbound delivery، runtime/provider model catalog، diagnostics/delivery queues نشست، loader مربوط به Plugin، قرارداد Plugin SDK/package، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

نمایه‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی Auth، secrets، sandbox، cron، و gateway                                                                                                            |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization، و IO پیکربندی                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای server method                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال اصلی و کانال Plugin همراه                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، dispatch مدل/provider، dispatch و queueهای پاسخ خودکار، و قراردادهای runtime کنترل‌پلین ACP                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌گیرنده‌های نظارت پردازه، و قراردادهای تحویل خروجی                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، facadeهای memory runtime، aliasهای memory Plugin SDK، glue فعال‌سازی memory runtime، و فرمان‌های memory doctor                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی reply queue، queueهای تحویل نشست، کمک‌گیرنده‌های اتصال/تحویل نشست خروجی، سطوح diagnostic event/log bundle، و قراردادهای session doctor CLI         |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، payload/chunking/runtime helperهای پاسخ، گزینه‌های پاسخ کانال، queueهای تحویل، و کمک‌گیرنده‌های اتصال session/thread           |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، auth و discovery مربوط به provider، ثبت runtime مربوط به provider، defaults/catalogs مربوط به provider، و registryهای web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap کنترل UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای runtime کنترل‌پلین task                                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب اصلی، media IO، media understanding، image-generation، و media-generation                                           |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface، و entrypoint در Plugin SDK                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت package منتشرشده و کمک‌گیرنده‌های قرارداد package مربوط به Plugin                                                                           |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون پنهان‌کردن سیگنال امنیتی، زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Plugin همراه باید فقط پس از پایدار شدن runtime و سیگنال نمایه‌های محدود، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگهداشت

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداشت Codex مبتنی بر رویداد برای هم‌راستا نگه‌داشتن مستندات موجود با تغییرات تازه land شده است. زمان‌بندی خالص ندارد: اجرای موفق CI برای push غیرربات روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند مستقیماً آن را اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی یک اجرای غیر skipped دیگر از Docs Agent در ساعت گذشته ساخته شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit از SHA منبع قبلی Docs Agent غیر skipped تا `main` فعلی را بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت Codex مبتنی بر رویداد برای تست‌های کند است. زمان‌بندی خالص ندارد: اجرای موفق CI برای push غیرربات روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی از این گیت فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست با حفظ پوشش انجام دهد نه refactorهای گسترده، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که تعداد baseline تست‌های پاس‌شده را کاهش دهند رد می‌کند. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند شکست‌های واضح را اصلاح کند و گزارش کل suite پس از agent باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای قدیمی دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل docs agent حفظ کند.

### PRهای تکراری پس از merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتاً فهرست‌شده را می‌بندد. پیش از تغییر GitHub، تأیید می‌کند که PR land شده merge شده است و هر مورد تکراری یا issue ارجاعی مشترک دارد یا hunkهای تغییر یافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و routing تغییرات

منطق local changed-lane در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی نسبت به scope گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات production در core، typecheck مربوط به core prod و core test به‌علاوه lint/guardهای core را اجرا می‌کنند؛
- تغییرات فقط تست در core، فقط typecheck مربوط به core test به‌علاوه lint core را اجرا می‌کنند؛
- تغییرات production در extension، typecheck مربوط به extension prod و extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست در extension، typecheck مربوط به extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا plugin-contract به typecheck مربوط به extension گسترش پیدا می‌کنند چون extensionها به آن قراردادهای core وابسته‌اند (جاروب‌های Vitest برای extension همچنان کار تست صریح می‌مانند)؛
- version bumpهای فقط metadata مربوط به release، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای fail safe به همه check laneها می‌روند.

routing محلی changed-test در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source mappingهای صریح را ترجیح می‌دهند، سپس تست‌های sibling و dependentهای import-graph را. پیکربندی تحویل shared group-room یکی از mappingهای صریح است: تغییرات در پیکربندی پاسخ visible برای گروه، حالت تحویل پاسخ source، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ core به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض shared پیش از اولین push به PR شکست بخورد. فقط وقتی تغییر آن‌قدر در سطح harness گسترده است که مجموعه mapped ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اثبات گسترده، یک box تازه گرم‌شده را ترجیح دهید. پیش از صرف کردن یک gate کند روی boxای که دوباره استفاده شده، منقضی شده، یا همین حالا یک همگام‌سازی غیرمنتظره بزرگ گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل همان box اجرا کنید.

بررسی سلامت وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذفِ رهگیری‌شده نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت همگام‌سازی remote یک کپی قابل اعتماد از PR نیست؛ به‌جای اشکال‌زدایی شکست تست محصول، آن box را متوقف کنید و یک box تازه گرم کنید. برای PRهایی که عمدا حذف‌های بزرگ دارند، برای آن اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین اجرای محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در فاز sync می‌ماند، خاتمه می‌دهد. برای غیرفعال کردن این guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار میلی‌ثانیه‌ای بزرگ‌تر استفاده کنید.

Crabbox پوشش remote-box متعلق به مخزن برای اثبات Linux نگه‌دارندگان است. وقتی یک بررسی برای local edit loop بیش از حد گسترده است، وقتی هم‌ارزی با CI مهم است، یا وقتی اثبات به رازها، Docker، laneهای بسته، boxهای قابل استفاده‌مجدد، یا لاگ‌های remote نیاز دارد، از آن استفاده کنید. backend معمول OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner متعلق به پروژه fallbackای برای قطعی‌های Blacksmith، مشکلات سهمیه، یا تست صریح ظرفیت متعلق به پروژه است.

پیش از اولین اجرا، wrapper را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper مخزن یک باینری Crabbox کهنه را که `blacksmith-testbox` را advertise نمی‌کند رد می‌کند. provider را صریح پاس بدهید، حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد.

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

خلاصهٔ JSON نهایی را بخوانید. فیلدهای مفید عبارت‌اند از `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs`، و `totalMs`. اجرای یک‌مرحله‌ای Crabbox مبتنی بر Blacksmith باید Testbox را به‌صورت خودکار متوقف کند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی از استفادهٔ دوباره استفاده کنید که عمدا به چند فرمان روی همان box آماده‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox لایهٔ خراب است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم به‌عنوان fallback محدود استفاده کنید:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی به ظرفیت Crabbox متعلق به پروژه escalate کنید که Blacksmith قطع است، با محدودیت سهمیه روبه‌روست، محیط لازم را ندارد، یا ظرفیت متعلق به پروژه صراحتا هدف است:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration در GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را مستثنا می‌کند تا checkout آماده‌شدهٔ Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، metadata ریموت Git خودش را نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
