---
read_when:
    - باید بفهمید چرا یک وظیفهٔ CI اجرا شد یا نشد
    - شما در حال عیب‌یابی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی یک اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای CI، گیت‌های دامنه، چترهای انتشار و معادل‌های فرمان‌های محلی
title: خط لولهٔ CI
x-i18n:
    generated_at: "2026-05-04T07:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job `preflight`، diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً از محدوده‌بندی هوشمند عبور می‌کنند و برای release candidateها و اعتبارسنجی گسترده، کل گراف را منشعب می‌کنند. laneهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit بدون وابستگی lockfile تولید در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | گذر فقط وابستگی Knip تولید به‌علاوه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای پایین‌دستی قابل استفاده مجدد                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded قرارداد channel با نتیجه بررسی aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی sharded: typeهای تولید، lint، guardها، typeهای تست، و smoke سختگیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مرزی/prompt به‌صورت sharded، guardهای extension، مرز package، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke مربوط به CLI ساخته‌شده و smoke حافظه startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                             | مستندات تغییر کرده باشند                       |
| `skills-python`                  | Ruff + pytest برای skills مبتنی بر Python                                                                    | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | تست‌های process/path مخصوص Windows به‌علاوه regressionهای مشترک runtime import specifier                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و تست‌های Swift برای app macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌علاوه یک build APK debug                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت مورد اعتماد                                                 | موفقیت Main CI یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با laneهای mock-provider، deep-profile، و live GPT 5.4 | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلاً کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` مرحله‌هایی داخل این job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک شروع شوند.
4. پس از آن، laneهای سنگین‌تر پلتفرم و runtime منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` قرار می‌گیرد، jobهای جایگزین‌شده را به‌صورت `cancelled` علامت‌گذاری کند. این را noise مربوط به CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز fail شده باشد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند، بنابراین همچنان failureهای عادی shard را گزارش می‌کنند اما پس از اینکه کل workflow از قبل جایگزین شده باشد، در queue قرار نمی‌گیرند. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند اجراهای جدیدتر main را برای مدت نامحدود block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی، تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار همه بخش‌های scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** گراف Node CI به‌علاوه linting workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native Windows، Android، یا macOS را اجبار نمی‌کنند؛ آن laneهای پلتفرم همچنان به تغییرات source پلتفرم scoped می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های منتخب و کم‌هزینه fixture تست core، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از مسیر سریع manifest فقط Node استفاده می‌کنند: `preflight`، امنیت، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper محدود باشد که task سریع مستقیماً آن‌ها را اجرا می‌کند، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config مدیر package، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط تست روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متعادل شده‌اند تا هر job بدون رزرو بیش‌ازحد runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای core unit fast/support جداگانه اجرا می‌شوند، زیرساخت runtime core بین shardهای state و process/config تقسیم شده است، auto-reply به‌صورت workerهای متعادل اجرا می‌شود (با تقسیم subtree مربوط به reply به shardهای agent-runner، dispatch، و commands/state-routing)، و configهای agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، میان laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. تست‌های گسترده browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin، از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern، entryهای timing را با نام shard مربوط به CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کارهای compile/canary مرز package را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guard مرزی روی چهار shard matrix stripe شده است، که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و timing هر بررسی را چاپ می‌کنند، از جمله `pnpm prompt:snapshots:check` تا drift prompt مسیر موفق runtime مربوط به Codex به PRی که باعث آن شده pin شود. Gateway watch، تست‌های channel، و shard مرز support مربوط به core پس از اینکه `dist/` و `dist-runtime/` ساخته شدند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث هیچ source set یا manifest جداگانه‌ای ندارد؛ lane تست unit آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، در حالی که از یک job تکراری package کردن APK debug در هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک گذر فقط وابستگی Knip تولید که به آخرین نسخه Knip pin شده و minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشده تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده زمانی fail می‌شود که یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک entry قدیمی در allowlist باقی بگذارد، در حالی که سطح‌های intentional dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت هدف از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیرقابل اعتماد را checkout یا اجرا نمی‌کند. workflow یک token مربوط به GitHub App از `CLAWSWEEPER_APP_PRIVATE_KEY` ایجاد می‌کند، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها وقتی وجود داشته باشند. این lane عمداً از forward کردن کل body مربوط به webhook اجتناب می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper`، `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای agent مربوط به ClawSweeper به hook مربوط به OpenClaw Gateway ارسال می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper مقصد Discord را در prompt خود دریافت می‌کند و فقط وقتی event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید باشد باید در `#clawsweeper` پست کند. openهای routine، editها، bot churn، noise تکراری Webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و messageهای commit مربوط به GitHub را داده غیرقابل اعتماد در نظر بگیرید. آن‌ها input برای summarization و triage هستند، نه دستورالعمل برای workflow یا runtime agent.

## dispatchهای دستی

اجرای دستی CI همان گراف کارهای CI عادی را اجرا می‌کند، اما همه مسیرهای scoped غیر Android را اجباری فعال می‌کند: shardهای Linux Node، shardهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS و Control UI i18n. اجرای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر کامل انتشار، Android را با ارسال `include_android=true` فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، shard فقط مخصوص انتشار `agentic-plugins`، sweep کامل دسته extension و مسیرهای Docker پیش‌انتشار Plugin از CI مستثنا هستند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجراهای دستی از یک گروه concurrency یکتا استفاده می‌کنند تا مجموعه کامل release-candidate با یک اجرای push یا PR دیگر روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوان مورد اعتماد اجازه می‌دهد آن گراف را روی یک branch، tag یا commit SHA کامل اجرا کند، در حالی که از فایل workflow متعلق به dispatch ref انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                           | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع protocol/contract/bundled، بررسی‌های sharded قرارداد کانال، shardهای `check` به‌جز lint، shardها و aggregateهای `check-additional`، verifierهای aggregate آزمون Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ install-smoke preflight نیز از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا matrix Blacksmith زودتر بتواند queue شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای extension سبک‌تر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types` و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، shardهای آزمون Linux Node، shardهای آزمون Plugin بسته‌بندی‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به اندازه‌ای حساس به CPU که 8 vCPU بیش از آنکه صرفه‌جویی کند هزینه داشت)؛ buildهای Docker برای install-smoke (هزینه زمان queue برای 32-vCPU بیش از صرفه‌جویی آن بود)                                                                                                                                                                                                                                                                                                                     |
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

## عملکرد OpenClaw

`OpenClaw Performance` workflow عملکرد محصول/runtime است. این workflow هر روز روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولاً benchmark را روی workflow ref اجرا می‌کند. برای benchmark گرفتن از یک tag انتشار یا branch دیگر با پیاده‌سازی فعلی workflow، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و pointerهای latest بر اساس ref آزموده‌شده کلیدگذاری می‌شوند و هر `index.md`، ref/SHA آزموده‌شده، workflow ref/SHA، Kova ref، profile، حالت احراز هویت lane، model، تعداد تکرار و فیلترهای سناریو را ثبت می‌کند.

این workflow، OCM را از یک انتشار pinشده و Kova را از `openclaw/Kova` در ورودی pinشده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic Kova در برابر runtime با local-build و احراز هویت fake سازگار با OpenAI به‌صورت deterministic.
- `mock-deep-profile`: profiling CPU/heap/trace برای hotspotهای startup، Gateway و agent-turn.
- `live-gpt54`: یک agent turn واقعی OpenAI `openai/gpt-5.4`، که وقتی `OPENAI_API_KEY` در دسترس نباشد skip می‌شود.

lane مربوط به mock-provider پس از عبور Kova، probeهای source بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook و 50-Plugin؛ loopهای تکراری hello برای mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های startup CLI در برابر Gateway بوت‌شده. خلاصه Markdown مربوط به source probe در bundle گزارش در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md` و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. pointer فعلی ref آزموده‌شده به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` workflow دستی چتری برای «اجرای همه چیز پیش از انتشار» است. این workflow یک branch، tag یا commit SHA کامل را می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای اثبات فقط مخصوص انتشار در حوزه Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های Docker release-path، live/E2E، OpenWebUI، QA Lab parity، Matrix و laneهای Telegram dispatch می‌کند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را ارسال کنید تا همان lane package مربوط به Telegram در برابر package منتشرشده npm دوباره اجرا شود.

برای matrix مرحله، نام دقیق jobهای workflow، تفاوت‌های profile، artifactها و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` workflow دستی mutating انتشار است. پس از اینکه tag انتشار وجود داشت و preflight مربوط به npm برای OpenClaw موفق شد، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همه packageهای Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان release SHA dispatch می‌کند، و فقط بعد از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit pinشده روی یک branch که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch refهای GitHub workflow باید branch یا tag باشند، نه commit SHA خام. helper یک branch موقت `release-ci/<sha>-...` را در target SHA push می‌کند، `Full Release Validation` را از همان ref pinشده dispatch می‌کند، verify می‌کند که `headSha` هر child workflow با target مطابقت داشته باشد، و پس از کامل شدن run، branch موقت را حذف می‌کند. verifier چتری همچنین اگر هر child workflow در SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره live/ارائه‌دهنده‌ای را کنترل می‌کند که به بررسی‌های انتشار پاس داده می‌شود. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض از `stable` استفاده می‌کنند؛ فقط زمانی از `full` استفاده کنید که عمداً ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را می‌خواهید.

- `minimum` سریع‌ترین مسیرهای OpenAI/هسته‌ای حیاتی برای انتشار را نگه می‌دارد.
- `stable` مجموعه پایدار ارائه‌دهنده/پس‌زمینه را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند ارسال‌شده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کار را برای هر اجرای فرزند پیوست می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` ورودی `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل عادی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز، محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref گردش‌کار مورداعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball به نام `release-package-under-test` تبدیل کند، سپس آن artifact را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به shard پذیرش بسته پاس می‌دهد. این کار بایت‌های بسته را در سراسر جعبه‌های انتشار ثابت نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را منسوخ می‌کنند. پایشگر والد هر گردش‌کار فرزندی را که قبلاً ارسال کرده باشد هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای قدیمی دوساعته بررسی انتشار منتظر نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را حفظ می‌کنند.

## shardهای live و E2E

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریالی، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- shardهای جداشده صوت/ویدئوی رسانه و shardهای موسیقی فیلترشده بر اساس ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند، در حالی که اجرای دوباره و تشخیص خرابی‌های کند ارائه‌دهنده live را آسان‌تر می‌کند. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` همچنان برای اجرای دوباره دستی یک‌مرحله‌ای معتبر می‌مانند.

shardهای رسانه live بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ کارهای رسانه فقط پیش از راه‌اندازی دودویی‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های live متکی بر Docker را روی runnerهای معمول Blacksmith نگه دارید — کارهای کانتینری جای درستی برای راه‌اندازی آزمون‌های Docker تو‌در‌تو نیستند.

shardهای live مدل/پس‌زمینه متکی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار live آن image را یک‌بار می‌سازد و push می‌کند، سپس shardهای مدل live Docker، Gateway شاردشده بر اساس ارائه‌دهنده، پس‌زمینه CLI، اتصال ACP و harness Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Docker مربوط به Gateway سقف‌های `timeout` صریح در سطح اسکریپت دارند که پایین‌تر از timeout کار گردش‌کار است، تا یک کانتینر گیرکرده یا مسیر پاک‌سازی، به‌جای مصرف کل بودجه بررسی انتشار، سریع شکست بخورد. اگر آن shardها target کامل Docker منبع را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده است و زمان دیواری را روی ساخت‌های تکراری image هدر خواهد داد.

## پذیرش بسته

از `Package Acceptance` وقتی استفاده کنید که پرسش این است: «آیا این بسته قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI عادی متفاوت است: CI عادی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی تجربه می‌کنند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact به نام `package-under-test` بارگذاری می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256 و profile را در خلاصه گام GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده مجدد آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest بسته را آماده می‌کند، و مسیرهای انتخاب‌شده Docker را به‌جای بسته‌بندی checkout گردش‌کار، علیه همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل استفاده مجدد بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. این کار وقتی اجرا می‌شود که `telegram_mode` برابر `none` نباشد و همان artifact به نام `package-under-test` را زمانی نصب می‌کند که پذیرش بسته یکی را resolve کرده باشد؛ ارسال مستقل Telegram همچنان می‌تواند یک مشخصه منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را ناموفق می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب، یا SHA کامل commit مورداعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/برچسب‌های OpenClaw را fetch می‌کند، راستی‌آزمایی می‌کند که commit انتخاب‌شده از تاریخچه شاخه مخزن یا یک برچسب انتشار قابل دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است، اما برای artifactهای اشتراک‌گذاری‌شده خارجی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورداعتماد گردش‌کار/harness است که آزمون را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness آزمون فعلی، commitهای منبع مورداعتماد قدیمی‌تر را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل Docker مسیر انتشار همراه با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

profile به نام `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده وابسته به دسترس‌پذیری live ClawHub نباشد. مسیر اختیاری Telegram در `NPM Telegram Beta E2E` از artifact به نام `package-under-test` دوباره استفاده می‌کند، در حالی که مسیر مشخصه npm منتشرشده برای ارسال‌های مستقل نگه داشته می‌شود.

برای سیاست اختصاصی آزمون به‌روزرسانی و Plugin، شامل فرمان‌های محلی، مسیرهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و تریاژ خرابی، [Testing updates and plugins](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=all-since-2026.4.23`، `published_upgrade_survivor_scenarios=reported-issues` و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات مهاجرت بسته، به‌روزرسانی، پاک‌سازی وابستگی Plugin کهنه، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin و Telegram را روی همان tarball بسته resolveشده نگه می‌دارد. برای اجرای همان ماتریس علیه یک بسته npm ارسال‌شده به‌جای artifact ساخته‌شده از SHA، `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار چندسیستمی همچنان onboarding، نصب‌کننده، و رفتار پلتفرمی خاص OS را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید از پذیرش بسته شروع شود. مسیر Docker به نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline`، baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره مسیر ناموفق آن baseline را حفظ می‌کنند. برای گسترش CI انتشار کامل روی هر انتشار پایدار npm از `2026.4.23` تا `latest`، `published_upgrade_survivor_baselines=all-since-2026.4.23` را تنظیم کنید؛ `release-history` برای نمونه‌برداری دستی گسترده‌تر با لنگر پیشاتاریخ قدیمی‌تر همچنان در دسترس است. برای گسترش همان baselineها در fixtureهای مشابه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin قدیمی و کهنه، `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید. گردش‌کار جداگانه `Update Migration` وقتی پرسش، پاک‌سازی جامع به‌روزرسانی منتشرشده است و نه گستره عادی CI انتشار کامل، از مسیر Docker به نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند مشخصه‌های دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس دهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس سناریو تنظیم کنند. مسیر منتشرشده baseline را با یک دستور پخته‌شده `openclaw config set` پیکربندی می‌کند، گام‌های دستور را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند. مسیرهای تازه بسته‌بندی‌شده و نصب‌کننده Windows همچنین راستی‌آزمایی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر مطلق خام Windows import کند. smoke چرخش agent چندسیستمی OpenAI وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

پذیرش بسته پنجره‌های سازگاری legacy محدود برای بسته‌هایی دارد که از قبل منتشر شده‌اند. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- ورودی‌های خصوصی شناخته‌شده QA در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرمورد ماندگاری `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گمشده را از fixture جعلی git مشتق‌شده از tarball هرس کند و ممکن است `update.channel` ماندگار گمشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy رکورد نصب را بخوانند یا نبود ماندگاری رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند رکورد نصب و رفتار عدم نصب مجدد بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp metadata ساخت محلی که از قبل ارسال شده بودند هشدار دهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا رد شدن، شکست می‌خورند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی فازها و فرمان‌های اجرای دوباره. اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا laneهای دقیق Docker را به اجرای دوباره‌ی اعتبارسنجی کامل انتشار ترجیح دهید.

## دودآزمایی نصب

Workflow جداگانه‌ی `Install Smoke` همان اسکریپت دامنه را از طریق job مخصوص خود به نام `preflight` دوباره استفاده می‌کند. این workflow پوشش دودآزمایی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای همراه، یا سطح‌های Plugin/کانال/Gateway/Plugin SDK هسته را که jobهای دودآزمایی Docker اجرا می‌کنند، لمس کرده باشند. تغییرات فقط‌منبع در Pluginهای همراه، ویرایش‌های فقط‌تست، و ویرایش‌های فقط‌مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودآزمایی CLI حذف agentهای workspace مشترک را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، یک build arg برای extension همراه را تأیید می‌کند، و پروفایل Docker محدودِ Plugin همراه را با timeout تجمعی ۲۴۰ ثانیه‌ای برای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب بسته‌ی QR و Docker/update مربوط به نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار با workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر دودآزمایی GHCR از Dockerfile ریشه برای target-SHA آماده می‌کند یا دوباره استفاده می‌کند، سپس نصب بسته‌ی QR، دودآزمایی‌های Dockerfile/Gateway ریشه، دودآزمایی‌های نصب‌کننده/update، و Docker E2E سریعِ Plugin همراه را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت دودآزمایی‌های تصویر ریشه منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق دامنه‌ی تغییرات روی یک push پوشش کامل را درخواست کند، workflow دودآزمایی سریع Docker را نگه می‌دارد و دودآزمایی کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودآزمایی کندِ ارائه‌دهنده‌ی تصویر با نصب global در Bun به‌طور جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این دودآزمایی در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای نصب‌محور خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از قبل می‌سازد، OpenClaw را یک‌بار به‌صورت tarball npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` را می‌سازد:

- یک runner خام Node/Git برای laneهای نصب‌کننده/update/وابستگی Plugin؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط طرح انتخاب‌شده را اجرا می‌کند. زمان‌بند تصویر هر lane را با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای pool اصلی برای laneهای عادی.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای pool انتهایی حساس به provider.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌ی زمانی بین شروع laneها برای جلوگیری از هجوم create در daemon Docker؛ برای نبود فاصله `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` طرح زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده‌ی کاما؛ دودآزمایی پاک‌سازی را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflight تجمعی محلی Docker را بررسی می‌کند، کانتینرهای کهنه‌ی OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای مرتب‌سازی طولانی‌ترین‌ها در ابتدا نگه می‌دارد، و به‌طور پیش‌فرض پس از نخستین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### Workflow قابل‌استفاده‌ی دوباره‌ی live/E2E

Workflow قابل‌استفاده‌ی دوباره‌ی live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع تصویر، تصویر live، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن طرح را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته‌ی اجرای فعلی را دانلود می‌کند، یا یک آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی طرح به laneهای package-installed نیاز داشته باشد، تصاویر Docker E2E خام/کاربردی GHCR با tag مبتنی بر digest بسته را از طریق cache لایه‌ی Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، از ورودی‌های ارائه‌شده‌ی `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصاویر موجود مبتنی بر digest بسته دوباره استفاده می‌کند. pullهای تصویر Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا جریان گیرکرده‌ی registry/cache به‌جای مصرف بخش بزرگی از مسیر بحرانی CI، سریع دوباره امتحان شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار jobهای تکه‌تکه‌ی کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر تکه فقط نوع تصویر موردنیاز خود را pull کند و چندین lane را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

تکه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` همچنان aliasهای تجمعی Plugin/runtime هستند. alias مربوط به lane به نام `install-e2e` همچنان alias تجمعی اجرای دوباره‌ی دستی برای هر دو lane نصب‌کننده‌ی provider است.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI، یک تکه‌ی مستقل `openwebui` را نگه می‌دارد. laneهای update کانال‌های همراه برای شکست‌های گذرای شبکه‌ی npm یک‌بار دوباره تلاش می‌کنند.

هر تکه `.artifacts/docker-tests/` را همراه با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON طرح زمان‌بند، جدول‌های laneهای کند، و فرمان‌های اجرای دوباره برای هر lane آپلود می‌کند. ورودی `docker_lanes` در workflow به‌جای jobهای تکه‌ای، laneهای انتخاب‌شده را روی تصاویر آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک lane زنده‌ی Docker باشد، job هدفمند تصویر live-test را برای آن اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های اجرای دوباره‌ی GitHub تولیدشده برای هر lane، وقتی آن مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name` و ورودی‌های تصویر آماده هستند، تا یک lane ناموفق بتواند از همان بسته و تصاویر دقیق اجرای ناموفق دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow زمان‌بندی‌شده‌ی live/E2E مجموعه‌ی کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI این مجموعه را خاموش نگه می‌دارند. این workflow تست‌های Plugin همراه را میان هشت worker مربوط به extension متعادل می‌کند؛ آن jobهای shard مربوط به extension تا دو گروه config Plugin را هم‌زمان با یک worker از Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای CI اضافی ایجاد نکنند. مسیر prerelease مخصوص انتشار در Docker، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا برای jobهای یک تا سه دقیقه‌ای ده‌ها runner رزرو نشود.

## آزمایشگاه QA

آزمایشگاه QA laneهای CI اختصاصی بیرون از workflow اصلی با دامنه‌ی هوشمند دارد. برابری agentic زیر harnessهای گسترده‌ی QA و انتشار قرار دارد، نه یک workflow مستقل PR. وقتی برابری باید همراه یک اجرای اعتبارسنجی گسترده باشد، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- Workflow `QA-Lab - All Lanes` هر شب روی `main` و هنگام dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane زنده‌ی Matrix، و laneهای زنده‌ی Telegram و Discord را به‌صورت jobهای موازی fan out می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های دارای صلاحیت mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از latency مدل live و راه‌اندازی عادی provider-plugin جدا شود. Gateway مربوط به transport زنده، جست‌وجوی memory را غیرفعال می‌کند، زیرا برابری QA رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه‌ی مدل live، provider بومی، و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkoutشده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی workflow دستی همچنان `all` است؛ dispatch دستی با `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای حیاتی انتشارِ آزمایشگاه QA را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن، بسته‌های candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک job گزارش کوچک برای مقایسه‌ی نهایی برابری دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه برابری را یک status الزامی بدانید، از شواهد CI/check دامنه‌دار پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی باریک برای گذر اول است، نه پایش کامل مخزن. اجراهای روزانه، دستی، و محافظ pull requestهای غیرپیش‌نویس، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

محافظ pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مثل گردش‌کار زمان‌بندی‌شده اجرا می‌کند. Android و macOS CodeQL خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، Cron، و خط مبنای Gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه runtime مربوط به channel plugin، Gateway، Plugin SDK، secrets، و نقاط تماس audit        |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF هسته، تجزیه IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای فرایند، تحویل خروجی، و gateهای اجرای ابزار agent                                                       |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری منبع، و قرارداد package در Plugin SDK          |

### shardهای امنیتی مختص پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که sanity گردش‌کار می‌پذیرد به‌صورت دستی build می‌کند. خروجی را زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی build می‌کند، نتایج build وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و خروجی را زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده، چون build macOS حتی در حالت تمیز هم بر زمان اجرا غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح باریک و باارزش بالا، روی runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. محافظ pull request آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای کد اجرای فرمان/مدل/ابزار agent و dispatch پاسخ، schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، هسته کانال و runtime مربوط به channel plugin بسته‌بندی‌شده، پروتکل Gateway/server-method، چسب runtime/SDK حافظه، MCP/process/تحویل خروجی، runtime/provider catalog مدل، diagnostics جلسه/صف‌های تحویل، loader Plugin، قرارداد Plugin SDK/package، یا تغییرات runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات CodeQL config و گردش‌کار کیفیت هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک hookهای آموزش/تکرار برای اجرای یک shard کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی Auth، secrets، sandbox، Cron، و Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema پیکربندی، migration، نرمال‌سازی، و IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای server method                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و channel pluginهای بسته‌بندی‌شده                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، dispatch مدل/provider، dispatch و صف‌های auto-reply، و قراردادهای runtime صفحه کنترل ACP                                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، helperهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، چسب فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | بخش‌های داخلی صف پاسخ، صف‌های تحویل جلسه، helperهای اتصال/تحویل جلسه خروجی، سطوح diagnostic event/log bundle، و قراردادهای CLI مربوط به session doctor        |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، helperهای payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و helperهای اتصال session/thread                  |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی catalog مدل، auth و discovery provider، ثبت runtime provider، پیش‌فرض‌ها/catalogهای provider، و registryهای web/search/fetch/embedding              |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، persistence محلی، جریان‌های کنترل Gateway، و قراردادهای runtime صفحه کنترل task                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب هسته، media IO، درک رسانه، تولید تصویر، و تولید رسانه                                                               |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface، و entrypointهای Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت package منتشرشده و helperهای قرارداد package مربوط به plugin                                                                                |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون پنهان‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و pluginهای بسته‌بندی‌شده باید فقط پس از پایدار شدن runtime و سیگنال پروفایل‌های باریک، به‌صورت کار پیگیری scopeشده یا shardشده دوباره اضافه شود.

## گردش‌کارهای نگهداری

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداری event-driven با Codex برای هم‌راستا نگه‌داشتن مستندات موجود با تغییراتی است که اخیراً landing شده‌اند. برنامه زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند مستقیماً آن را اجرا کند. invocationهای workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای غیر skipشده دیگری از Docs Agent در ساعت گذشته ایجاد شده باشد skip می‌شوند. وقتی اجرا می‌شود، بازه commit از source SHA مربوط به Docs Agent غیر skipشده قبلی تا `main` فعلی را review می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل عملکرد تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداری event-driven با Codex برای تست‌های کند است. برنامه زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run در همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی آن gate فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست با حفظ پوشش انجام دهد نه refactorهای گسترده، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که تعداد baseline تست‌های موفق را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند failureهای بدیهی را اصلاح کند و گزارش کل suite پس از agent باید پیش از هر commit موفق شود. وقتی `main` پیش از landing شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از GitHub-hosted Ubuntu استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل عامل مستندات حفظ کند.

### PRهای تکراری پس از ادغام

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی duplicate پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتاً فهرست‌شده را می‌بندد. پیش از تغییر دادن GitHub، تأیید می‌کند که PR landشده merge شده و هر duplicate یا issue ارجاع‌شده مشترک دارد یا hunkهای تغییر یافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gateهای check محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن gate check محلی نسبت به scope گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات production هسته، typecheck مربوط به core prod و core test به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-test هسته، فقط typecheck مربوط به core test به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات production extension، typecheck مربوط به extension prod و extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط-test extension، typecheck مربوط به extension test به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات Plugin SDK عمومی یا قرارداد plugin به typecheck extension گسترش می‌یابند، چون extensionها به آن قراردادهای هسته وابسته‌اند (پایش‌های Vitest extension همچنان کار تست صریح می‌مانند)؛
- افزایش نسخه‌های فقط metadata انتشار، checkهای هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای fail-safe به همه check laneها می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کنند، ویرایش‌های source ابتدا mappingهای صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابستگان import-graph را. پیکربندی تحویل shared group-room یکی از mappingهای صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا system prompt ابزار پیام، از طریق تست‌های پاسخ هسته به‌علاوه regressionهای تحویل Discord و Slack مسیر داده می‌شوند تا تغییر پیش‌فرض مشترک پیش از اولین push PR شکست بخورد. فقط وقتی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر harness-wide باشد که مجموعه mapped ارزان نماینده قابل اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اثبات‌های گسترده، یک جعبهٔ تازه گرم‌شده را ترجیح دهید. پیش از صرف‌کردن یک گیت کند روی جعبه‌ای که دوباره استفاده شده، منقضی شده، یا همین حالا همگام‌سازیِ غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل جعبه اجرا کنید.

بررسی سلامت وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذفِ ردیابی‌شده نشان دهد، سریع شکست می‌خورد. این معمولاً یعنی وضعیت همگام‌سازی راه‌دور، کپی قابل اعتمادی از PR نیست؛ به‌جای اشکال‌زدایی شکست آزمون محصول، آن جعبه را متوقف کنید و یک جعبهٔ تازه گرم کنید. برای PRهای بزرگ‌حذفِ عمدی، برای همان اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی می‌ماند، پایان می‌دهد. برای غیرفعال‌کردن آن محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمولاً بزرگ، مقدار میلی‌ثانیه‌ای بزرگ‌تری به کار ببرید.

Crabbox پوشش جعبهٔ راه‌دورِ متعلق به مخزن برای اثبات لینوکس نگه‌دارندگان است. وقتی یک بررسی برای حلقهٔ ویرایش محلی بیش از حد گسترده است، وقتی هم‌ارزی CI مهم است، یا وقتی اثبات به secrets، Docker، مسیرهای بسته، جعبه‌های قابل استفادهٔ مجدد، یا گزارش‌های راه‌دور نیاز دارد، از آن استفاده کنید. backend عادی OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، پشتیبانِ قطعی‌های Blacksmith، مشکلات سهمیه، یا آزمون صریح ظرفیت تحت مالکیت است.

پیش از نخستین اجرا، پوشش را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

پوشش مخزن، دودویی Crabbox کهنه‌ای را که `blacksmith-testbox` را اعلام نمی‌کند رد می‌کند. با اینکه `.crabbox.yaml` پیش‌فرض‌های ابرِ تحت مالکیت دارد، ارائه‌دهنده را صریحاً پاس دهید.

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

اجرای دوبارهٔ آزمون متمرکز:

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

خلاصهٔ نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. اجراهای یک‌بارهٔ Crabbox با پشتوانهٔ Blacksmith باید Testbox را به‌طور خودکار متوقف کنند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، جعبه‌های زنده را بررسی کنید و فقط جعبه‌هایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی استفادهٔ مجدد را به کار ببرید که عمداً به چند فرمان روی همان جعبهٔ آماده‌شده نیاز دارید:

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

فقط وقتی به ظرفیت Crabbox تحت مالکیت ارتقا دهید که Blacksmith از کار افتاده، با محدودیت سهمیه روبه‌رو است، محیط لازم را ندارد، یا ظرفیت تحت مالکیت صراحتاً هدف است:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی، و آماده‌سازی GitHub Actions برای مسیرهای ابرِ تحت مالکیت است. این فایل `.git` محلی را مستثنی می‌کند تا checkout آماده‌شدهٔ Actions فرادادهٔ Git راه‌دور خودش را نگه دارد، نه اینکه remoteهای محلی نگه‌دارنده و انباره‌های object را همگام کند؛ همچنین artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های ابرِ تحت مالکیت `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
