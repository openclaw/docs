---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شده یا نشده است
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - در حال تغییر dispatch مربوط به ClawSweeper یا بازفرستادن فعالیت GitHub هستید
summary: گراف کارهای CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-06T09:05:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job مربوط به `preflight`، diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجرای دستی `workflow_dispatch` عمدا smart scoping را دور می‌زند و کل graph را برای release candidateها و validation گسترده fan out می‌کند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مخصوص release در workflow جداگانه‌ی [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت CI manifest                   | همیشه روی pushها و PRهای non-draft |
| `security-scm-fast`              | تشخیص private key و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای non-draft |
| `security-dependency-audit`      | audit بدون dependency برای production lockfile در برابر npm advisories                                          | همیشه روی pushها و PRهای non-draft |
| `security-fast`                  | aggregate الزامی برای jobهای fast security                                                             | همیشه روی pushها و PRهای non-draft |
| `check-dependencies`             | اجرای production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های built-artifact، و artifactهای reusable پایین‌دستی                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای سریع درستی‌سنجی Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded برای channel contractها با یک نتیجه aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل sharded gate اصلی local: production types، lint، guardها، test types، و strict smoke                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مرزی/prompt به‌صورت sharded، extension guardها، package boundary، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | smoke testهای built-CLI و smoke مربوط به startup-memory                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به built-artifact                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane مربوط به build و smoke برای سازگاری Node 22                                                                | dispatch دستی CI برای releaseها    |
| `check-docs`                     | قالب‌بندی docs، lint، و بررسی broken-link                                                             | وقتی docs تغییر کرده باشد                       |
| `skills-python`                  | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | تست‌های مخصوص Windows برای process/path به‌همراه regressionهای shared runtime import specifier                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript روی macOS با استفاده از artifactهای built مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای اپ macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌همراه یک build از debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه‌ی تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت Main CI یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد روزانه/درخواستی Kova runtime با laneهای mock-provider، deep-profile، و GPT 5.4 live | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای standalone.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کننده‌های پایین‌دستی بتوانند به‌محض آماده شدن build مشترک شروع شوند.
4. laneهای سنگین‌تر platform و runtime بعد از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` می‌نشیند، jobهای جایگزین‌شده را به‌صورت `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین run برای همان ref هم failing باشد، این را نویز CI در نظر بگیرید. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند اما پس از اینکه کل workflow از قبل supersede شده است queue نشوند. concurrency key خودکار CI نسخه‌دار است (`CI-v7-*`) تا یک zombie سمت GitHub در queue group قدیمی نتواند runهای جدیدتر main را برای مدت نامحدود block کند. runهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای در حال اجرا را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود. dispatch دستی، تشخیص changed-scope را skip می‌کند و باعث می‌شود preflight manifest طوری رفتار کند که انگار همه‌ی areaهای scoped تغییر کرده‌اند.

- **ویرایش‌های CI workflow** graph مربوط به Node CI به‌همراه workflow linting را validate می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source مخصوص platform scoped می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، برخی ویرایش‌های ارزان fixture مربوط به core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر fast Node-only manifest استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، آن مسیر build artifactها، سازگاری Node 22، channel contractها، shardهای کامل core، shardهای bundled-plugin، و additional guard matrixها را skip می‌کند.
- **بررسی‌های Windows Node** به wrapperهای مخصوص Windows برای process/path، helperهای npm/pnpm/UI runner، پیکربندی package manager، و سطح‌های CI workflow که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، plugin، install-smoke، و test-only روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balanced شده‌اند تا هر job بدون reserve بیش از حد runner کوچک بماند: channel contractها به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای core unit fast/support جداگانه اجرا می‌شوند، زیرساخت core runtime بین shardهای state و process/config split می‌شود، auto-reply به‌صورت workerهای balanced اجرا می‌شود (با split شدن زیرشاخه‌ی reply به shardهای agent-runner، dispatch، و commands/state-routing)، و configهای agentic gateway/server به‌جای انتظار برای built artifactها بین laneهای chat/auth/model/http-plugin/runtime/startup split می‌شوند. تست‌های گسترده‌ی browser، QA، media، و Pluginهای miscellaneous به‌جای catch-all مشترک Plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern با استفاده از نام CI shard، timing entryها را ثبت می‌کنند تا `.artifacts/vitest-shard-timings.json` بتواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و runtime topology architecture را از پوشش gateway watch جدا می‌کند؛ لیست boundary guard در چهار matrix shard stripe شده است، که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و timing هر check را چاپ می‌کنند، از جمله `pnpm prompt:snapshots:check` تا drift مربوط به prompt مسیر happy-path در Codex runtime به PRی که باعث آن شده pin شود. Gateway watch، channel testها، و shard مربوط به core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل build شده‌اند، داخل `build-artifacts` هم‌زمان اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را build می‌کند. flavor مربوط به third-party هیچ source set یا manifest جداگانه‌ای ندارد؛ lane unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job تکراری packaging debug APK روی هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک pass production Knip فقط برای dependencyها که به آخرین نسخه‌ی Knip pin شده، با minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دومی یافته‌های production unused-file در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده‌ی جدید و reviewنشده‌ای اضافه کند یا یک entry stale در allowlist باقی بگذارد fail می‌شود، در حالی که سطح‌های dynamic plugin، generated، build، live-test، و package bridge که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌شوند.

## forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد untrusted مربوط به pull request را checkout یا execute نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token مربوط به GitHub App می‌سازد، سپس payloadهای compact مربوط به `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره‌ی item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمدا از forward کردن full webhook body اجتناب می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است که event نرمال‌شده را برای agent مربوط به ClawSweeper به OpenClaw Gateway hook post می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و باید فقط وقتی event غافلگیرکننده، actionable، پرریسک، یا از نظر عملیاتی مفید است در `#clawsweeper` post کند. باز شدن‌ها، ویرایش‌ها، churn مربوط به bot، نویز duplicate webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و commit messageهای GitHub را داده‌ی untrusted در نظر بگیرید. آن‌ها input برای summarization و triage هستند، نه instruction برای workflow یا agent runtime.

## dispatchهای دستی

ارسال‌های دستی CI همان گراف کارهای CI عادی را اجرا می‌کنند، اما همهٔ مسیرهای محدودشدهٔ غیر Android را اجباری فعال می‌کنند: شاردهای Linux Node، شاردهای Pluginهای باندل‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، دودسنجی ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، و بومی‌سازی Control UI. ارسال‌های دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کنند؛ چتر کامل انتشار با پاس‌دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، شارد فقط-انتشار `agentic-plugins`، جاروب دسته‌ای کامل افزونه‌ها، و مسیرهای Docker پیش‌انتشار Plugin از CI مستثنا هستند. مجموعهٔ پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش‌کار جداگانهٔ `Plugin Prerelease` را با گیت اعتبارسنجی انتشار فعال ارسال کند.

اجراهای دستی از یک گروه هم‌زمانی یکتا استفاده می‌کنند تا مجموعهٔ کامل کاندید انتشار توسط اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک فراخوانندهٔ مورد اعتماد اجازه می‌دهد آن گراف را روی یک شاخه، تگ، یا SHA کامل کامیت اجرا کند، در حالی که از فایل گردش‌کار مربوط به ref ارسال انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                           | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و تجمیع‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/باندل‌شده، بررسی‌های شاردشدهٔ قرارداد کانال، شاردهای `check` به‌جز lint، تجمیع‌های `check-additional`، راستی‌آزماهای تجمیعی آزمون Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke نیز از Ubuntu میزبانی‌شدهٔ GitHub استفاده می‌کند تا ماتریس Blacksmith بتواند زودتر در صف قرار بگیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر افزونه، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای آزمون Linux Node، شاردهای آزمون Plugin باندل‌شده، شاردهای `check-additional`، `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیش از صرفه‌جویی، هزینه ایجاد کرد)؛ ساخت‌های Docker مربوط به install-smoke (هزینهٔ زمان صف 32-vCPU بیش از صرفه‌جویی آن بود)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` بازمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` بازمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                      |

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

`OpenClaw Performance` گردش‌کار کارایی محصول/زمان اجرا است. این گردش‌کار روزانه روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی ارسال کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

ارسال دستی معمولاً ref گردش‌کار را بنچمارک می‌کند. برای بنچمارک‌کردن یک تگ انتشار یا شاخهٔ دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref آزموده‌شده کلیدگذاری می‌شوند، و هر `index.md`، ref/SHA آزموده‌شده، ref/SHA گردش‌کار، ref مربوط به Kova، پروفایل، حالت احراز هویت مسیر، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شدهٔ `kova_ref` نصب می‌کند، سپس سه مسیر را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر یک زمان اجرای ساخت محلی با احراز هویت جعلی و قطعیِ سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و نوبت عامل.
- `live-gpt54`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.4` که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

مسیر mock-provider پس از گذر Kova، probeهای منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی بوت Gateway و حافظه در حالت‌های پیش‌فرض، hook، و راه‌اندازی با 50 Plugin؛ حلقه‌های hello تکراری mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های راه‌اندازی CLI در برابر Gateway بوت‌شده. خلاصهٔ Markdown مربوط به probe منبع در بستهٔ گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر مسیر artifactهای GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` کامیت می‌کند. اشاره‌گر فعلی tested-ref با نام `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک شاخه، تگ، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف ارسال می‌کند، `Plugin Prerelease` را برای اثبات‌های فقط-انتشار مربوط به Plugin/بسته/ایستا/Docker ارسال می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش بسته، بررسی‌های بسته در چند OS، هم‌ترازی QA Lab، Matrix، و مسیرهای Telegram ارسال می‌کند. اجراهای پایدار/پیش‌فرض، پوشش زنده/E2E جامع و مسیر انتشار Docker را پشت `run_release_soak=true` نگه می‌دارند؛ `release_profile=full` آن پوشش soak را اجباری فعال می‌کند تا اعتبارسنجی گستردهٔ توصیه‌نامه‌ها همچنان گسترده بماند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact `release-package-under-test` از بررسی‌های انتشار اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را پاس بدهید تا همان مسیر بستهٔ Telegram در برابر بستهٔ منتشرشدهٔ npm دوباره اجرا شود.

برای ماتریس مرحله‌ها، نام دقیق کارهای گردش‌کار، تفاوت‌های پروفایل، artifactها، و دسته‌های اجرای دوبارهٔ متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار دستیِ تغییردهندهٔ انتشار است. پس از وجودداشتن تگ انتشار و پس از موفقیت پیش‌پرواز npm مربوط به OpenClaw، آن را از `release/YYYY.M.D` یا `main` ارسال کنید. این گردش‌کار `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند، `Plugin NPM Release` را برای همهٔ بسته‌های Plugin قابل انتشار ارسال می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار ارسال می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده ارسال می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات کامیت پین‌شده روی شاخه‌ای که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

refهای ارسال گردش‌کار GitHub باید شاخه یا تگ باشند، نه SHA خام کامیت. این helper یک شاخهٔ موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن ref پین‌شده ارسال می‌کند، راستی‌آزمایی می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت دارد، و پس از تکمیل اجرا شاخهٔ موقت را حذف می‌کند. راستی‌آزمای چتری همچنین اگر هر گردش‌کار فرزند در SHA متفاوتی اجرا شده باشد شکست می‌خورد.

`release_profile` گسترهٔ زنده/ارائه‌دهنده‌ای را کنترل می‌کند که به بررسی‌های انتشار داده می‌شود. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض از `stable` استفاده می‌کنند؛ فقط وقتی از `full` استفاده کنید که عمداً ماتریس گستردهٔ مشورتی ارائه‌دهنده/رسانه را می‌خواهید. `run_release_soak` کنترل می‌کند که آیا بررسی‌های انتشار پایدار/پیش‌فرض، آزمون فرسایشی کامل مسیر انتشار زنده/E2E و Docker را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعهٔ پایدار ارائه‌دهنده/پشت‌اند را اضافه می‌کند.
- `full` ماتریس گستردهٔ مشورتی ارائه‌دهنده/رسانه را اجرا می‌کند.

گردش‌کار چتری شناسه‌های اجرای فرزند dispatchشده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کار را برای هر اجرای فرزند پیوست می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار راستی‌آزمای والد را دوباره اجرا کنید تا نتیجهٔ چتری و خلاصهٔ زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل عادی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی گردش‌کار چتری. این کار اجرای دوبارهٔ یک جعبهٔ انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک مسیر cross-OS ناموفق، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی‌های هر فاز هستند. مسیرهای QA بررسی انتشار مشورتی هستند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما راستی‌آزمای بررسی انتشار را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک بار به یک tarball به نام `release-package-under-test` تبدیل کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance، به‌علاوهٔ گردش‌کار Docker مسیر انتشار زنده/E2E وقتی پوشش soak اجرا می‌شود، می‌دهد. این کار بایت‌های package را در جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوبارهٔ همان نامزد در چند کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
گردش‌کار چتری قدیمی‌تر را supersede می‌کنند. ناظر والد هر گردش‌کار فرزندی را که
قبلاً dispatch کرده است، هنگام لغو والد لغو می‌کند؛ بنابراین اعتبارسنجی جدیدتر main
پشت یک اجرای کهنهٔ دو ساعتهٔ بررسی انتشار نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار
و گروه‌های اجرای دوبارهٔ متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## shardهای زنده و E2E

فرزند زنده/E2E انتشار، پوشش گستردهٔ native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریال، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- کارهای `native-live-src-gateway-profiles` فیلترشده بر پایهٔ ارائه‌دهنده
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداشدهٔ رسانهٔ صوت/ویدئو و shardهای موسیقی فیلترشده بر پایهٔ ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند ارائه‌دهندهٔ زنده را آسان‌تر می‌کند. نام shardهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای اجرای دوبارهٔ دستی یک‌مرحله‌ای معتبر می‌مانند.

shardهای رسانهٔ زندهٔ native در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که با گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image از قبل `ffmpeg` و `ffprobe` را نصب می‌کند؛ کارهای رسانه فقط پیش از setup وجود binaryها را بررسی می‌کنند. مجموعه‌های زندهٔ متکی بر Docker را روی runnerهای عادی Blacksmith نگه دارید — کارهای container جای مناسبی برای اجرای آزمون‌های Docker تودرتو نیستند.

shardهای مدل/پشت‌اند زندهٔ متکی بر Docker از یک image مشترک جداگانهٔ `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار انتشار زنده آن image را یک بار می‌سازد و push می‌کند، سپس shardهای مدل زندهٔ Docker، Gateway فیلترشده بر پایهٔ ارائه‌دهنده، پشت‌اند CLI، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Docker مربوط به Gateway سقف‌های صریح `timeout` در سطح script دارند که کمتر از timeout کار گردش‌کار است، تا یک container گیرکرده یا مسیر cleanup، به‌جای مصرف کل بودجهٔ بررسی انتشار، سریع شکست بخورد. اگر آن shardها هدف Docker کامل source را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده است و زمان دیواری را برای ساخت‌های تکراری image هدر می‌دهد.

## Package Acceptance

وقتی پرسش این است که «آیا این package قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی فرق دارد: CI عادی درخت source را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند، اعتبارسنجی می‌کند.

### کارها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد package را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact به نام `package-under-test` upload می‌کند، و منبع، ref گردش‌کار، ref package، نسخه، SHA-256، و profile را در خلاصهٔ گام GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار reusable آن artifact را download می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest package را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، روی همان package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند انتخاب می‌کند، گردش‌کار reusable، package و imageهای مشترک را یک بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر Package Acceptance یکی را resolve کرده باشد، همان artifact به نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشدهٔ npm را نصب کند.
4. `summary` اگر resolve کردن package، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را شکست‌خورده می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخهٔ دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. برای پذیرش پیش‌انتشار/پایدار منتشرشده از این استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل commit مورد اعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند که commit انتخاب‌شده از تاریخچهٔ شاخهٔ repository یا یک تگ انتشار قابل دسترسی باشد، dependencyها را در یک worktree جدا نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از طریق HTTPS download می‌کند؛ `package_sha256` لازم است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما باید برای artifactهای اشتراک‌گذاری‌شدهٔ خارجی ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورد اعتماد گردش‌کار/harness است که آزمون را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness آزمون فعلی، commitهای منبع قدیمی‌تر اما مورد اعتماد را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### profileهای suite

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوهٔ `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد لازم است

profile مربوط به `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی package منتشرشده به دسترس‌بودن زندهٔ ClawHub وابسته نباشد. مسیر اختیاری Telegram، artifact به نام `package-under-test` را در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec منتشرشدهٔ npm برای dispatchهای مستقل نگه داشته می‌شود.

برای سیاست اختصاصی آزمون به‌روزرسانی و Plugin، از جمله فرمان‌های محلی،
مسیرهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و تریاژ شکست،
به [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

بررسی‌های انتشار، Package Acceptance را با `source=artifact`، artifact آماده‌شدهٔ package انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات مهاجرت package، به‌روزرسانی، cleanup وابستگی stale مربوط به Plugin، ترمیم نصب Plugin پیکربندی‌شده، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball resolveشدهٔ package نگه می‌دارد. برای اجرای همان ماتریس روی یک package ارسال‌شدهٔ npm به‌جای artifact ساخته‌شده از SHA، `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار platform خاص هر OS را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با Package Acceptance شروع شود. مسیر Docker به نام `published-upgrade-survivor` در مسیر مسدودکنندهٔ انتشار، در هر اجرا یک baseline package منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolveشدهٔ `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشدهٔ fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوبارهٔ مسیر شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا روی چهار انتشار پایدار npm اخیر به‌علاوهٔ انتشارهای مرزی pinشدهٔ سازگاری Plugin و fixtureهای شبیه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شدهٔ OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin legacy که stale شده‌اند گسترش یابد. انتخاب‌های published-upgrade survivor چند-baseline بر پایهٔ baseline به کارهای runner هدفمند Docker جداگانه shard می‌شوند. گردش‌کار جداگانهٔ `Update Migration` وقتی پرسش cleanup کامل به‌روزرسانی منتشرشده است، نه گسترهٔ عادی Full Release CI، از مسیر Docker به نام `update-migration` با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند specهای دقیق package را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای ماتریس scenario مقدار `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. مسیر منتشرشده baseline را با یک recipe فرمان baked از نوع `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوهٔ وضعیت RPC را probe می‌کند. مسیرهای تازهٔ packaged و installer در Windows همچنین بررسی می‌کنند که یک package نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام مطلق Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

Package Acceptance پنجره‌های سازگاری legacy محدود برای packageهای قبلاً منتشرشده دارد. packageها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است زیرمورد persistence مربوط به `gateway install --wrapper` را وقتی package آن flag را expose نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گمشده را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persistشدهٔ گمشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy رکورد نصب را بخوانند یا نبود persistence رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata پیکربندی را مجاز کند، در حالی که همچنان الزام می‌کند رکورد نصب و رفتار no-reinstall بدون تغییر بمانند.

بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های مهر فرادادهٔ ساخت محلی که از قبل منتشر شده بودند نیز هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار دادن یا رد شدن، شکست می‌خورند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصهٔ `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، گزارش‌های lane، زمان‌بندی‌های phase، و فرمان‌های اجرای دوباره. به‌جای اجرای دوبارهٔ اعتبارسنجی کامل انتشار، اجرای دوبارهٔ پروفایل بستهٔ ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## آزمون دود نصب

گردش‌کار جداگانهٔ `Install Smoke` از همان اسکریپت دامنه از طریق کار `preflight` خودش دوباره استفاده می‌کند. پوشش دود را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای همراه، یا سطح‌های Plugin اصلی/channel/Gateway/Plugin SDK را لمس می‌کنند که کارهای دود Docker آن‌ها را اجرا می‌کنند. تغییرات فقط منبع در Pluginهای همراه، ویرایش‌های فقط آزمون، و ویرایش‌های فقط مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دود CLI حذف agents در workspace مشترک را اجرا می‌کند، e2e شبکهٔ Gateway کانتینر را اجرا می‌کند، یک آرگومان ساخت extension همراه را راستی‌آزمایی می‌کند، و پروفایل Docker محدودِ Plugin همراه را زیر مهلت زمانی تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بستهٔ QR و پوشش Docker/به‌روزرسانی installer را برای اجراهای زمان‌بندی‌شدهٔ شبانه، dispatchهای دستی، بررسی‌های انتشار با workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های installer/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر دود Dockerfile ریشهٔ GHCR با SHA هدف را آماده می‌کند یا دوباره استفاده می‌کند، سپس نصب بستهٔ QR، دودهای Dockerfile ریشه/Gateway، دودهای installer/به‌روزرسانی، و E2E سریع Docker مربوط به Plugin همراه را به‌عنوان کارهای جداگانه اجرا می‌کند تا کار installer پشت دودهای تصویر ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق دامنهٔ تغییرات روی یک push پوشش کامل را درخواست کند، گردش‌کار دود سریع Docker را نگه می‌دارد و دود نصب کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دود image-provider مربوط به نصب سراسری کند Bun جداگانه با `run_bun_global_install_smoke` gate می‌شود. این دود در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های QR و installer Docker، Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از قبل می‌سازد، OpenClaw را یک‌بار به‌صورت tarball npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` را می‌سازد:

- یک اجراکنندهٔ خام Node/Git برای laneهای installer/به‌روزرسانی/وابستگی Plugin؛
- یک تصویر کاربردی که همان tarball را برای laneهای کارکرد معمولی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler تصویر هر lane را با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیمات قابل تغییر

| متغیر                                 | پیش‌فرض | هدف                                                                                             |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای معمولی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای زندهٔ هم‌زمان تا providerها throttle نکنند.                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از طوفان ایجاد Docker daemon؛ برای نبود فاصله‌گذاری، `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت زمانی fallback برای هر lane (۱۲۰ دقیقه)؛ laneهای زنده/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکنندهٔ ویرگول؛ دود cleanup را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

یک lane سنگین‌تر از سقف مؤثر خودش همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند تنها اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای stale مربوط به OpenClaw E2E را حذف می‌کنند، وضعیت lane فعال را منتشر می‌کنند، زمان‌بندی laneها را برای مرتب‌سازی longest-first پایدار می‌کنند، و به‌صورت پیش‌فرض پس از اولین شکست زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### گردش‌کار زنده/E2E قابل استفادهٔ مجدد

گردش‌کار زنده/E2E قابل استفادهٔ مجدد از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع تصویر، تصویر زنده، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این اسکریپت یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک آرتیفکت بستهٔ current-run را دانلود می‌کند، یا یک آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز داشته باشد، تصویرهای bare/functional مربوط به GHCR Docker E2E با tag بر پایهٔ digest بسته را از طریق cache لایهٔ Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، از ورودی‌های ارائه‌شدهٔ `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصویرهای موجود بر پایهٔ digest بسته دوباره استفاده می‌کند. pullهای تصویر Docker با مهلت زمانی محدود ۱۸۰ ثانیه برای هر تلاش دوباره امتحان می‌شوند تا جریان گیرکردهٔ registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره امتحان شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار کارهای chunked کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را که نیاز دارد pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime می‌مانند. alias lane به نام `install-e2e` همچنان alias تجمیعی اجرای دوبارهٔ دستی برای هر دو lane نصب‌کنندهٔ provider است.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مخصوص OpenWebUI یک chunk مستقل `openwebui` نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای شکست‌های گذرای شبکهٔ npm یک‌بار دوباره امتحان می‌شوند.

هر chunk، `.artifacts/docker-tests/` را همراه با گزارش‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON مربوط به plan زمان‌بند، جدول‌های laneهای کند، و فرمان‌های اجرای دوبارهٔ هر lane آپلود می‌کند. ورودی `docker_lanes` گردش‌کار، laneهای انتخاب‌شده را به‌جای کارهای chunk در برابر تصویرهای آماده‌شده اجرا می‌کند، که اشکال‌زدایی lane ناموفق را به یک کار Docker هدفمند محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر یک lane انتخاب‌شده lane زندهٔ Docker باشد، کار هدفمند تصویر live-test را برای آن اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های اجرای دوبارهٔ GitHub تولیدشده برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده‌شده هستند، بنابراین یک lane ناموفق می‌تواند دقیقاً همان بسته و تصویرهای اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زنده/E2E زمان‌بندی‌شده، مجموعهٔ کامل Docker مربوط به release-path را هر روز اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بستهٔ پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا یک اپراتور صریح dispatch می‌شود. pull requestهای معمولی، pushهای `main`، و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این گردش‌کار آزمون‌های Plugin همراه را بین هشت worker extension متوازن می‌کند؛ آن کارهای shard مربوط به extension تا دو گروه پیکربندی Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا دسته‌های Plugin با import سنگین، کارهای اضافی CI ایجاد نکنند. مسیر پیش‌انتشار Docker مخصوص انتشار، laneهای هدفمند Docker را در گروه‌های کوچک دسته‌بندی می‌کند تا از رزرو ده‌ها runner برای کارهای یک تا سه دقیقه‌ای جلوگیری کند.

## آزمایشگاه QA

آزمایشگاه QA laneهای اختصاصی CI خارج از گردش‌کار اصلی با دامنه‌بندی هوشمند دارد. parity عامل‌محور زیر harnessهای گستردهٔ QA و انتشار قرار می‌گیرد، نه به‌عنوان یک گردش‌کار مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این گردش‌کار lane parity mock، lane زندهٔ Matrix، و laneهای زندهٔ Telegram و Discord را به‌صورت کارهای موازی پخش می‌کند. کارهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار laneهای انتقال زندهٔ Matrix و Telegram را با provider mock قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از تأخیر مدل زنده و راه‌اندازی معمول Plugin provider جدا شود. Gateway انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کند زیرا parity QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانهٔ مدل زنده، provider native، و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI check out شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی دستی گردش‌کار همچنان `all` باقی می‌مانند؛ dispatch دستی با `matrix_profile=all` همیشه پوشش کامل Matrix را به کارهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای آزمایشگاه QA حیاتی برای انتشار را پیش از تأیید انتشار اجرا می‌کند؛ gate مربوط به parity QA آن، بسته‌های candidate و baseline را به‌عنوان کارهای lane موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک کار گزارش کوچک دانلود می‌کند تا مقایسهٔ نهایی parity انجام شود.

برای PRهای عادی، به‌جای اینکه برابری را یک وضعیت الزامی بدانید، از شواهد CI/بررسی محدوده‌دار پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی محدودِ مرحله‌ی اول است، نه جاروب کامل مخزن. اجراهای نگهبان روزانه، دستی، و درخواست کشش غیرپیش‌نویس، کد گردش‌کارهای Actions به‌همراه پرریسک‌ترین سطح‌های JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی محدود شده‌اند اسکن می‌کنند.

نگهبان درخواست کشش سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مثل گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، cron، و خط مبنای Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه زمان اجرای Plugin کانال، Gateway، Plugin SDK، اسرار، نقاط تماس ممیزی                   |
| `/codeql-security-high/network-ssrf-boundary`     | سطح‌های SSRF هسته، تجزیه IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و گیت‌های اجرای ابزار عامل                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطح‌های اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری منبع، و قرارداد بسته Plugin SDK             |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیت Android. برنامه Android را به‌صورت دستی برای CodeQL روی کوچک‌ترین runner لینوکس Blacksmith که توسط sanity گردش‌کار پذیرفته می‌شود می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد هفتگی/دستی امنیت macOS. برنامه macOS را به‌صورت دستی برای CodeQL روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، چون ساخت macOS حتی وقتی پاک است بر زمان اجرا غالب می‌شود.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. این شارد فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطح‌های محدود و پرارزش، روی runner کوچک‌تر لینوکس Blacksmith اجرا می‌کند. نگهبان درخواست کشش آن عمداً از پروفایل زمان‌بندی‌شده کوچک‌تر است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و ارسال پاسخ، کد schema/migration/IO پیکربندی، کد احراز هویت/اسرار/sandbox/امنیت، زمان اجرای کانال هسته و Plugin کانال بسته‌بندی‌شده، قراردادهای پروتکل/متد سرور Gateway، چسب زمان اجرای حافظه/SDK، تحویل MCP/فرایند/خروجی، کاتالوگ مدل/زمان اجرای provider، صف‌های عیب‌یابی/تحویل نشست، loader مربوط به Plugin، قرارداد Plugin SDK/package، یا زمان اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، همه دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، cron، و Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، نرمال‌سازی، و IO پیکربندی                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای متد سرور                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال بسته‌بندی‌شده                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای اجرای فرمان، dispatch مدل/provider، dispatch و صف‌های پاسخ خودکار، و زمان اجرای control-plane مربوط به ACP                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، نماهای زمان اجرای حافظه، aliasهای حافظه در Plugin SDK، چسب فعال‌سازی زمان اجرای حافظه، و فرمان‌های doctor حافظه                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطح‌های بسته رویداد/لاگ عیب‌یابی، و قراردادهای CLI مربوط به doctor نشست       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/thread              |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف provider، ثبت زمان اجرای provider، پیش‌فرض‌ها/کاتالوگ‌های provider، و registryهای web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، پایداری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای control-plane وظیفه                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان اجرای fetch/search وب هسته، media IO، درک رسانه، image-generation، و media-generation                                                            |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypointهای Plugin SDK                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و کمک‌کننده‌های قرارداد بسته Plugin                                                                                            |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون پنهان کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای بسته‌بندی‌شده باید فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری محدوده‌دار یا شاردشده دوباره اضافه شود.

## گردش‌کارهای نگهداشت

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداشت رویدادمحور Codex برای هم‌راستا نگه‌داشتن مستندات موجود با تغییرات تازه landed شده است. برنامه زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیرربات روی `main` می‌تواند آن را فعال کند، و dispatch دستی می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی یک اجرای Docs Agent غیر ردشده دیگر در یک ساعت گذشته ایجاد شده باشد، رد می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلیِ Docs Agent غیر ردشده تا `main` فعلی بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت رویدادمحور Codex برای آزمون‌های کند است. برنامه زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیرربات روی `main` می‌تواند آن را فعال کند، اما اگر یک فراخوانی workflow-run دیگر در همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد، رد می‌شود. dispatch دستی از آن گیت فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد آزمون با حفظ پوشش انجام دهد، نه بازآرایی‌های گسترده، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که تعداد آزمون‌های پاس‌شده خط مبنا را کاهش می‌دهند رد می‌کند. اگر خط مبنا آزمون‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های بدیهی را اصلاح کند و گزارش کل مجموعه پس از عامل باید قبل از هر commit پاس شود. وقتی `main` قبل از landed شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ patchهای کهنه دارای conflict رد می‌شوند. از GitHub-hosted Ubuntu استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل agent مستندات حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگه‌دارنده برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صریحاً فهرست‌شده را می‌بندد. پیش از تغییر دادن GitHub، تأیید می‌کند که PR landed شده merge شده است و هر مورد تکراری یا یک issue ارجاع‌شده مشترک دارد یا hunkهای تغییر هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از دامنه گسترده پلتفرم CI است:

- تغییرات تولیدی هسته، typecheck تولید هسته و typecheck آزمون هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط آزمون هسته، فقط typecheck آزمون هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات تولیدی extension، typecheck تولید extension و typecheck آزمون extension به‌همراه lint مربوط به extension را اجرا می‌کنند؛
- تغییرات فقط آزمون extension، typecheck آزمون extension به‌همراه lint مربوط به extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck مربوط به extension گسترش می‌یابند، چون extensionها به آن قراردادهای هسته وابسته‌اند (جاروب‌های extension در Vitest کار آزمون صریح باقی می‌مانند)؛
- bumpهای نسخه فقط متادیتای release، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته ریشه/پیکربندی با حالت امن به همه مسیرهای بررسی fail می‌شوند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم آزمون خودشان را اجرا می‌کنند، ویرایش‌های منبع mappingهای صریح را ترجیح می‌دهند، سپس آزمون‌های هم‌خانواده و وابستگان import-graph را. پیکربندی تحویل اتاق گروه مشترک یکی از mappingهای صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی message-tool از مسیر آزمون‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push یک PR fail شود. فقط وقتی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر در سطح harness گسترده باشد که مجموعه mapped ارزان proxy قابل اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اثبات‌های گسترده، یک باکس گرم‌شدهٔ تازه را ترجیح دهید. پیش از صرف کردن یک گیت کند روی باکسی که دوباره استفاده شده، منقضی شده، یا تازه یک همگام‌سازی غیرمنتظره بزرگ گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل باکس اجرا کنید.

بررسی sanity وقتی فایل‌های ریشهٔ الزامی مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` حداقل ۲۰۰ حذف رهگیری‌شده نشان دهد، سریع شکست می‌خورد. این معمولاً یعنی وضعیت همگام‌سازی راه‌دور نسخهٔ قابل اعتمادی از PR نیست؛ به‌جای اشکال‌زدایی شکست تست محصول، آن باکس را متوقف کنید و یک باکس تازه گرم کنید. برای PRهای عمدی با حذف‌های بزرگ، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار میلی‌ثانیه‌ای بزرگ‌تری استفاده کنید.

Crabbox پوشش راه‌دور متعلق به مخزن برای اثبات Linux نگه‌دارندگان است. وقتی یک بررسی برای چرخهٔ ویرایش محلی بیش از حد گسترده است، وقتی همسانی با CI اهمیت دارد، یا وقتی اثبات به رازها، Docker، مسیرهای بسته، باکس‌های قابل استفادهٔ مجدد، یا لاگ‌های راه‌دور نیاز دارد، از آن استفاده کنید. بک‌اند معمول OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner متعلق به پروژه، گزینهٔ پشتیبان برای قطعی‌های Blacksmith، مشکلات سهمیه، یا تست صریح ظرفیت متعلق به پروژه است.

پیش از اولین اجرا، پوشش را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

پوشش مخزن، باینری کهنهٔ Crabbox را که `blacksmith-testbox` را تبلیغ نمی‌کند رد می‌کند. با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد، ارائه‌دهنده را صریح وارد کنید.

گیت تغییرات:

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

خلاصهٔ نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. اجراهای یک‌بارهٔ Crabbox با پشتوانهٔ Blacksmith باید Testbox را به‌صورت خودکار متوقف کنند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، باکس‌های زنده را بررسی کنید و فقط باکس‌هایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

از استفادهٔ مجدد فقط وقتی استفاده کنید که عمداً به چند فرمان روی همان باکس آماده‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایهٔ خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم به‌عنوان پشتیبان محدود استفاده کنید:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی به ظرفیت Crabbox متعلق به پروژه ارتقا دهید که Blacksmith از دسترس خارج است، سهمیه محدود شده، محیط لازم را ندارد، یا ظرفیت متعلق به پروژه صریحاً هدف است:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی و آماده‌سازی GitHub Actions برای مسیرهای owned-cloud است. این فایل `.git` محلی را مستثنی می‌کند تا checkout آماده‌شدهٔ Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، فرادادهٔ Git راه‌دور خودش را نگه دارد، و artifactهای محلی runtime/build را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، واکشی `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
