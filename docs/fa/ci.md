---
read_when:
    - باید بدانید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازفرستی فعالیت GitHub هستید
summary: گراف وظایف CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-02T23:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job مربوط به `preflight`، diff را طبقه‌بندی می‌کند و وقتی فقط نواحی نامرتبط تغییر کرده باشند، laneهای پرهزینه را غیرفعال می‌کند. اجراهای دستی `workflow_dispatch` عمدا smart scoping را دور می‌زنند و کل graph را برای release candidateها و اعتبارسنجی گسترده پخش می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مخصوص release فقط در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                             | زمان اجرا                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت CI manifest                             | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                                               | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit بدون dependency برای production lockfile در برابر advisoryهای npm                                                    | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                                       | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | پاس production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                           | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی built-artifactها، و artifactهای قابل‌استفاده مجدد برای downstream                                 | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای سریع صحت‌سنجی Linux مانند بررسی‌های bundled/plugin-contract/protocol                                        | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded برای channel contractها با نتیجه aggregate check پایدار                                                | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                                    | تغییرات مرتبط با Node              |
| `check`                          | معادل sharded برای gate محلی اصلی: production types، lint، guardها، test types، و smoke سخت‌گیرانه                          | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای architecture، boundary، drift در prompt snapshot، guardهای extension-surface، package-boundary، و gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای built-CLI و smoke حافظه startup                                                                      | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به built-artifact                                                                           | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke برای سازگاری Node 22                                                                          | dispatch دستی CI برای releaseها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های شکسته                                                                       | مستندات تغییر کرده باشد                       |
| `skills-python`                  | Ruff + pytest برای skillهای مبتنی بر Python                                                                              | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | تست‌های مخصوص process/path در Windows به‌همراه رگرسیون‌های مشترک runtime import specifier                                | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript در macOS با استفاده از built artifactهای مشترک                                                         | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای اپ macOS                                                                      | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit در Android برای هر دو flavor به‌همراه ساخت یک debug APK                                                        | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه slow-test توسط Codex پس از فعالیت trusted                                                           | موفقیت CI اصلی یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های روزانه/درخواستی عملکرد runtime مربوط به Kova با laneهای mock-provider، deep-profile، و live مربوط به GPT 5.4           | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اساسا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به محض آماده شدن build مشترک شروع شوند.
4. پس از آن laneهای سنگین‌تر platform و runtime پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

وقتی یک push جدیدتر روی همان PR یا ref مربوط به `main` قرار می‌گیرد، GitHub ممکن است jobهای superseded را با وضعیت `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین run برای همان ref هم failing باشد، آن را noise مربوط به CI در نظر بگیرید. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failهای عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل superseded شده است در صف نمانند. کلید automatic CI concurrency نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند runهای جدیدتر main را برای مدت نامحدود block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای in-progress را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی، تشخیص changed-scope را رد می‌کند و باعث می‌شود preflight manifest طوری رفتار کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های CI workflow**، graph مربوط به Node CI را به‌همراه workflow linting اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجباری نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source مربوط به platform scoped می‌مانند.
- **ویرایش‌های فقط CI routing، ویرایش‌های منتخب fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر fast Node-only manifest استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به surfaceهای routing یا helper محدود باشد که task سریع مستقیما آنها را exercise می‌کند، آن مسیر build artifactها، سازگاری Node 22، channel contractها، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای npm/pnpm/UI runner، پیکربندی package manager، و surfaceهای CI workflow که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر job بدون رزرو بیش‌ازحد runner کوچک بماند: channel contractها به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای unit کوچک core جفت شده‌اند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic مربوط به Gateway/Plugin به‌جای انتظار برای built artifactها، در میان jobهای موجود source-only agentic Node پخش شده‌اند. تست‌های گسترده browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از configهای اختصاصی Vitest خودشان استفاده می‌کنند. shardهای include-pattern، entryهای timing را با نام CI shard ثبت می‌کنند، تا `.artifacts/vitest-shard-timings.json` بتواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و runtime topology architecture را از پوشش gateway watch جدا می‌کند؛ shard مربوط به boundary guard، guardهای کوچک مستقل خود را به‌صورت همزمان داخل یک job اجرا می‌کند، از جمله `pnpm prompt:snapshots:check` تا drift مربوط به prompt در مسیر happy-path runtime مربوط به Codex به همان PR که باعث آن شده pin شود. Gateway watch، تست‌های channel، و shard مربوط به core support-boundary داخل `build-artifacts` پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، همزمان اجرا می‌شوند.

Android CI هر دو `testPlayDebugUnitTest` و `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor مربوط به third-party هیچ source set یا manifest جداگانه‌ای ندارد؛ lane مربوط به unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، در حالی که از یک job تکراری برای packaging مربوط به debug APK روی هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک پاس production Knip فقط برای dependencyها که به آخرین نسخه Knip pin شده است و minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ مورد دوم یافته‌های Knip درباره فایل‌های استفاده‌نشده production را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard مربوط به unused-file وقتی fail می‌شود که یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک entry stale در allowlist باقی بگذارد، در حالی که surfaceهای عمدی مربوط به dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## فوروارد کردن فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد untrusted مربوط به pull request را check out یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک GitHub App token می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را فوروارد می‌کند: event type، action، actor، repository، item number، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمدا از فوروارد کردن کل webhook body پرهیز می‌کند. workflow گیرنده در `openclaw/clawsweeper` برابر با `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای agent مربوط به ClawSweeper به OpenClaw Gateway hook ارسال می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط وقتی باید به `#clawsweeper` پست کند که event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید باشد. openها و editهای routine، churn مربوط به bot، noise ناشی از webhook تکراری، و traffic عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و commit messageهای GitHub را داده untrusted تلقی کنید. آنها ورودی summarization و triage هستند، نه instruction برای workflow یا runtime مربوط به agent.

## dispatchهای دستی

اجرای دستی CI همان گراف کارِ CI معمولی را اجرا می‌کند، اما همهٔ laneهای scoped غیر Android را روشن می‌کند: شاردهای Linux Node، شاردهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Python skills، Windows، macOS، و i18n در Control UI. اجرای دستی مستقل CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر کامل انتشار با ارسال `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، شارد فقط-انتشارِ `agentic-plugins`، sweep کامل batch برای extensionها، و laneهای Docker پیش‌انتشار Plugin از CI کنار گذاشته شده‌اند. مجموعهٔ پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` گردش‌کار جداگانهٔ `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجرای دستی از یک گروه concurrency یکتا استفاده می‌کند تا مجموعهٔ کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوانندهٔ مورد اعتماد اجازه می‌دهد آن گراف را روی یک branch، tag، یا SHA کامل commit اجرا کند، در حالی که فایل workflow از ref انتخاب‌شدهٔ dispatch استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                       | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/بسته‌بندی‌شده، بررسی‌های sharded قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و aggregateهای `check-additional`، اعتبارسنج‌های aggregate تست Node، بررسی‌های مستندات، Python skills، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند در صف قرار بگیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای extension سبک‌تر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای تست Linux Node، شاردهای تست Plugin بسته‌بندی‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیش از آنچه صرفه‌جویی کند هزینه داشت)؛ ساخت‌های Docker برای install-smoke (زمان صف 32-vCPU بیش از آنچه صرفه‌جویی کند هزینه داشت)                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                        |

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

`OpenClaw Performance` گردش‌کار عملکرد محصول/زمان اجرا است. این workflow هر روز روی `main` اجرا می‌شود و می‌تواند به‌صورت دستی dispatch شود:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

این workflow، OCM را از یک release پین‌شده و Kova را از ورودی پین‌شدهٔ `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic Kova در برابر runtime ساخت محلی با احراز هویت جعلی قطعی و سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ startup، gateway، و agent-turn.
- `live-gpt54`: یک agent turn واقعی OpenAI `openai/gpt-5.4` که وقتی `OPENAI_API_KEY` در دسترس نباشد skipped می‌شود.

lane مربوط به mock-provider همچنین پس از گذر Kova، probeهای سورس بومی OpenClaw را اجرا می‌کند: زمان boot و حافظهٔ Gateway در حالت‌های startup پیش‌فرض، hook، و 50-Plugin؛ loopهای hello تکرارشوندهٔ mock-OpenAI `channel-chat-baseline`؛ و فرمان‌های startup در CLI در برابر Gateway راه‌اندازی‌شده. خلاصهٔ Markdown مربوط به source probe در bundle گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر branch فعلی به‌صورت `openclaw-performance/<ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` workflow چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک branch، tag، یا SHA کامل commit را می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای اثبات فقط-انتشارِ Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش package، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر artifact مربوط به `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را ارسال کنید تا همان lane پکیج Telegram را در برابر پکیج npm منتشرشده دوباره اجرا کند.

برای ماتریس stage، نام دقیق jobهای workflow، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` workflow دستی تغییردهندهٔ انتشار است. آن را پس از وجود داشتن tag انتشار و پس از موفقیت preflight مربوط به npm در OpenClaw، از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همهٔ پکیج‌های Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی branch پرتحرک، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

refهای dispatch در workflowهای GitHub باید branch یا tag باشند، نه SHA خام commit. این helper یک branch موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن ref پین‌شده dispatch می‌کند، verify می‌کند که `headSha` هر workflow فرزند با target مطابقت دارد، و وقتی run کامل شد branch موقت را حذف می‌کند. verifier چتری همچنین اگر هر workflow فرزند در SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گسترهٔ live/provider ارسال‌شده به release checks را کنترل می‌کند. workflowهای دستی release به‌صورت پیش‌فرض روی `stable` هستند؛ فقط وقتی عمداً ماتریس advisory provider/media گسترده را می‌خواهید از `full` استفاده کنید.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعهٔ provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس advisory provider/media گسترده را اجرا می‌کند.

چتر، idهای run فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی runهای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر run فرزند ضمیمه می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را rerun کنید تا نتیجهٔ چتر و خلاصهٔ زمان‌بندی refresh شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز، محدود نگه می‌دارد.

`OpenClaw Release Checks` از مرجع گردش‌کار قابل اعتماد استفاده می‌کند تا مرجع انتخاب‌شده را یک‌بار به یک tarball به نام `release-package-under-test` تبدیل کند، سپس آن artifact را هم به گردش‌کار Docker مسیر انتشار زنده/E2E و هم به shard پذیرش بسته می‌دهد. این کار بایت‌های بسته را در جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را جایگزین می‌کنند. پایشگر والد، هر گردش‌کار فرزندی را که
قبلا ارسال کرده است هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main
پشت یک اجرای دو ساعته قدیمی release-check منتظر نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار
و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را حفظ می‌کنند.

## Shardهای زنده و E2E

فرزند زنده/E2E انتشار، پوشش گسترده native `pnpm test:live` را حفظ می‌کند، اما آن را به جای یک job سریالی، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- shardهای جداشده صوت/ویدئوی رسانه و shardهای موسیقی فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و تشخیص خرابی‌های کند provider زنده را آسان‌تر می‌سازد. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای اجرای دوباره دستی یک‌باره معتبر می‌مانند.

Shardهای رسانه زنده native در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ jobهای رسانه فقط پیش از راه‌اندازی، باینری‌ها را تأیید می‌کنند. مجموعه‌های زنده متکی به Docker را روی runnerهای معمول Blacksmith نگه دارید — jobهای container جای درستی برای اجرای تست‌های Docker تو در تو نیستند.

Shardهای زنده model/backend متکی به Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده، آن image را یک‌بار می‌سازد و push می‌کند، سپس shardهای مدل زنده Docker، Gateway تقسیم‌شده بر اساس provider، backend CLI، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. Shardهای Docker مربوط به Gateway سقف‌های `timeout` صریح در سطح اسکریپت دارند که پایین‌تر از timeout job گردش‌کار است، تا یک container گیرکرده یا مسیر پاک‌سازی، به جای مصرف کل بودجه release-check، سریع fail شود. اگر آن shardها target کامل Docker منبع را مستقل بازسازی کنند، اجرای انتشار بدپیکربندی شده و زمان واقعی را صرف ساخت‌های تکراری image خواهد کرد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که پرسش این است: «آیا این بسته نصب‌شدنی OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI معمولی متفاوت است: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` آپلود می‌کند، و منبع، مرجع گردش‌کار، مرجع بسته، نسخه، SHA-256، و profile را در خلاصه step گیت‌هاب چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده مجدد آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به جای بسته‌بندی checkout گردش‌کار، روی همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند انتخاب کند، گردش‌کار قابل استفاده مجدد بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا منشعب می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر Package Acceptance یک بسته را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ ارسال مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram ناموفق شده باشد، گردش‌کار را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/انتشار پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل commit مربوط به `package_ref` قابل اعتماد را بسته‌بندی می‌کند. Resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، تأیید می‌کند commit انتخاب‌شده از تاریخچه شاخه repository یا یک تگ انتشار قابل دسترسی است، وابستگی‌ها را در یک worktree جدا نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد گردش‌کار/harness قابل اعتمادی است که تست را اجرا می‌کند. `package_ref` commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی، commitهای منبع قابل اعتماد قدیمی‌تر را بدون اجرای منطق قدیمی گردش‌کار اعتبارسنجی کند.

### Profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ زمانی که `suite_profile=custom` باشد الزامی است

Profile مربوط به `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دسترس‌پذیری زنده ClawHub وابسته نباشد. Lane اختیاری Telegram در `NPM Telegram Beta E2E` همان artifact با نام `package-under-test` را دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای ارسال‌های مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و triage خرابی،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، Package Acceptance را با `source=artifact`، artifact آماده‌شده بسته انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=all-since-2026.4.23`، `published_upgrade_survivor_scenarios=reported-issues`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، به‌روزرسانی، پاک‌سازی وابستگی‌های کهنه Plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و Telegram را روی همان tarball بسته resolveشده نگه می‌دارد. برای اجرای همان ماتریس روی یک بسته npm ارسال‌شده به جای artifact ساخته‌شده از SHA، مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار میان‌سیستمی هنوز onboarding، نصب‌کننده، و رفتار platform خاص سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید از Package Acceptance شروع شود. Lane مربوط به Docker با نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline`، baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره lane ناموفق آن baseline را حفظ می‌کنند. برای گسترش Full Release CI روی هر انتشار پایدار npm از `2026.4.23` تا `latest`، مقدار `published_upgrade_survivor_baselines=all-since-2026.4.23` را تنظیم کنید؛ `release-history` همچنان برای نمونه‌برداری دستی گسترده‌تر با anchor قدیمی‌تر پیش از تاریخ در دسترس می‌ماند. برای گسترش همان baselineها روی fixtureهای شبیه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin میراثی کهنه، مقدار `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید. گردش‌کار جداگانه `Update Migration` زمانی از lane Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند که پرسش، پاک‌سازی کامل به‌روزرسانی‌های منتشرشده باشد، نه گستره معمول Full Release CI. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، یک lane منفرد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس scenario تنظیم کنند. Lane منتشرشده، baseline را با یک دستور پخته‌شده `openclaw config set` پیکربندی می‌کند، گام‌های دستور را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. Laneهای بسته‌بندی‌شده Windows و نصب‌کننده fresh نیز تأیید می‌کنند که یک بسته نصب‌شده می‌تواند override مربوط به browser-control را از یک مسیر خام absolute در Windows import کند. Smoke مربوط به agent-turn میان‌سیستمی OpenAI وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد، به‌صورت پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4` استفاده می‌کند، بنابراین اثبات نصب و Gateway روی یک مدل تست GPT-5 باقی می‌ماند و از پیش‌فرض‌های GPT-4.x پرهیز می‌کند.

### پنجره‌های سازگاری میراثی

Package Acceptance برای بسته‌هایی که از قبل منتشر شده‌اند پنجره‌های سازگاری میراثی محدود دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است وقتی بسته آن flag را در معرض قرار نمی‌دهد، زیرمورد persistence مربوط به `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball حذف کند و ممکن است `update.channel` persistشده گم‌شده را log کند؛
- smokeهای Plugin ممکن است locationهای میراثی install-record را بخوانند یا persistence گم‌شده install-record marketplace را بپذیرند؛
- `plugin-update` ممکن است migration metadata پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp metadata ساخت محلی که قبلا ارسال شده‌اند هشدار دهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به جای هشدار یا skip، fail می‌شوند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، گزارش‌های lane، زمان‌بندی‌های phase و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، اجرای دوباره‌ی profile بسته‌ی ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## دودسنجی نصب

workflow جداگانه‌ی `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود بازاستفاده می‌کند. این workflow پوشش دودسنجی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Plugin همراه، یا سطح‌های Plugin/channel/gateway/Plugin SDK هسته را لمس می‌کنند که jobهای دودسنجی Docker آن‌ها را تمرین می‌دهند. تغییرات فقط-منبع در Pluginهای همراه، ویرایش‌های فقط-تست و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image ریشه‌ی Dockerfile را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودسنجی CLI مربوط به حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، build arg مربوط به یک extension همراه را تأیید می‌کند، و profile محدود Docker برای Plugin همراه را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته‌ی QR و پوشش Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image دودسنجی GHCR از root Dockerfile با target-SHA را آماده یا بازاستفاده می‌کند، سپس نصب بسته‌ی QR، دودسنجی‌های root Dockerfile/gateway، دودسنجی‌های installer/update و E2E سریع Docker برای Plugin همراه را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت دودسنجی‌های image ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، workflow دودسنجی سریع Docker را نگه می‌دارد و دودسنجی کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودسنجی کند نصب سراسری Bun برای image-provider جداگانه با `run_bun_global_install_smoke` gate می‌شود. این دودسنجی در برنامه‌ی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## E2E محلی Docker

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` برای هر lane image را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیمات قابل‌تغییر

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از هجوم create در Docker daemon؛ برای نبود فاصله‌گذاری `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane، ۱۲۰ دقیقه؛ laneهای live/tail منتخب سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده‌ی ویرگول؛ دودسنجی cleanup را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمان آزاد کردن ظرفیت تنها اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای قدیمی OpenClaw E2E را حذف می‌کنند، وضعیت laneهای فعال را منتشر می‌کنند، زمان‌بندی‌های lane را برای ترتیب طولانی‌ترین-اول ماندگار می‌کنند، و به‌صورت پیش‌فرض پس از نخستین شکست زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### workflow بازاستفاده‌پذیر live/E2E

workflow بازاستفاده‌پذیر live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع image، image live، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته‌ی اجرای جاری را دانلود می‌کند، یا آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای بسته‌ی نصب‌شده نیاز دارد، imageهای bare/functional Docker E2E در GHCR را با tag مبتنی بر digest بسته از طریق cache لایه‌ی Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای بازسازی، ورودی‌های ارائه‌شده‌ی `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود مبتنی بر digest بسته را بازاستفاده می‌کند. pullهای image Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره‌امتحان می‌شوند تا stream گیرکرده‌ی registry/cache به‌جای مصرف بیشتر مسیر حیاتی CI، سریع دوباره‌امتحان شود.

### chunkهای مسیر انتشار

پوشش Docker انتشار jobهای chunkشده‌ی کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image موردنیازش را pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime باقی می‌مانند. alias lane `install-e2e` همچنان alias تجمیعی اجرای دوباره‌ی دستی برای هر دو lane نصب‌کننده‌ی provider است.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود و فقط برای dispatchهای مخصوص OpenWebUI یک chunk مستقل `openwebui` نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای خطاهای گذرای شبکه‌ی npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را با گزارش‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON plan زمان‌بند، جدول‌های laneهای کند و فرمان‌های اجرای دوباره‌ی هر lane آپلود می‌کند. ورودی `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای chunk در برابر imageهای آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و آرتیفکت بسته را برای آن اجرا آماده، دانلود یا بازاستفاده می‌کند؛ اگر یک lane انتخاب‌شده lane live Docker باشد، job هدفمند image live-test را به‌صورت محلی برای آن اجرای دوباره می‌سازد. فرمان‌های اجرای دوباره‌ی GitHub تولیدشده برای هر lane وقتی این مقدارها وجود داشته باشند شامل `package_artifact_run_id`، `package_artifact_name` و ورودی‌های image آماده‌شده هستند، تا یک lane ناموفق بتواند دقیقاً همان بسته و imageهای اجرای ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زمان‌بندی‌شده‌ی live/E2E هر روز suite کامل Docker مربوط به release-path را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این workflow تست‌های Plugin همراه را میان هشت worker مربوط به extension متعادل می‌کند؛ آن jobهای shard مربوط به extension هم‌زمان تا دو گروه config مربوط به Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای CI اضافی ایجاد نکنند. مسیر prerelease فقط-انتشار Docker، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند.

## آزمایشگاه QA

آزمایشگاه QA laneهای اختصاصی CI خارج از workflow اصلی smart-scoped دارد. parity عاملی زیر harnessهای گسترده‌ی QA و انتشار تو‌در‌تو است، نه یک workflow مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane live Matrix و laneهای live Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای live از environment `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های واجد mock، یعنی `mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`، اجرا می‌کنند تا قرارداد channel از تأخیر مدل live و راه‌اندازی عادی Plugin provider جدا شود. Gateway مربوط به transport live جست‌وجوی memory را غیرفعال می‌کند، چون برابری QA رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه‌ی مدل live، provider بومی و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط زمانی `--fail-fast` را اضافه می‌کند که CLI checkout‌شده از آن پشتیبانی کند. پیش‌فرض CLI و ورودی workflow دستی همچنان `all` می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای حیاتی انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن packهای candidate و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک job گزارش کوچک دانلود می‌کند تا مقایسه‌ی نهایی برابری انجام شود.

برای PRهای عادی، به‌جای تلقی کردن parity به‌عنوان یک status الزامی، شواهد scoped CI/check را دنبال کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی محدود برای گذر اول است، نه جاروب کامل مخزن. اجراهای نگهبان روزانه، دستی، و درخواست‌های pull غیرپیش‌نویس، کد گردش‌کار Actions به‌همراه پرریسک‌ترین سطوح JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که به `security-severity` با high/critical محدود شده‌اند اسکن می‌کنند.

نگهبان درخواست pull سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مانند گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS از پیش‌فرض‌های PR بیرون می‌ماند.

### دسته‌بندی‌های امنیتی

| دسته‌بندی                                          | سطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط مبنای احراز هویت، اسرار، sandbox، cron، و gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌علاوه زمان‌اجرای Plugin کانال، gateway، Plugin SDK، اسرار، و نقاط تماس ممیزی              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح خط‌مشی SSRF هسته، تجزیه IP، نگهبان شبکه، web-fetch، و SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌گرهای اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و قرارداد بسته Plugin SDK |

### قطعه‌های امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — قطعه امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که workflow sanity می‌پذیرد می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — قطعه امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. چون ساخت macOS حتی در حالت پاک هم زمان‌اجرا را غالب می‌کند، خارج از پیش‌فرض‌های روزانه نگه داشته شده است.

### دسته‌بندی‌های کیفیت بحرانی

`CodeQL Critical Quality` قطعه غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح محدود و باارزش بالا در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. نگهبان درخواست pull آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط قطعه‌های متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای دستور/مدل/ابزار agent و dispatch پاسخ، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، زمان‌اجرای کانال هسته و Plugin کانال bundled، پروتکل Gateway/server-method، زمان‌اجرای memory/چسب SDK، MCP/process/outbound delivery، زمان‌اجرای provider/کاتالوگ مدل، تشخیص نشست/صف‌های تحویل، loader Plugin، قرارداد Plugin SDK/package-contract، یا زمان‌اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده قطعه کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک قطعه کیفیت به‌صورت ایزوله هستند.

| دسته‌بندی                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، cron، و gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization، و IO پیکربندی                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای متد سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای دستور، dispatch مدل/provider، dispatch و صف‌های auto-reply، و قراردادهای زمان‌اجرای صفحه کنترل ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌گرهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان memory، نماهای زمان‌اجرای memory، aliasهای Plugin SDK مربوط به memory، چسب فعال‌سازی زمان‌اجرای memory، و دستورهای doctor مربوط به memory                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌گرهای اتصال/تحویل نشست خروجی، سطوح بسته رویداد/لاگ تشخیصی، و قراردادهای CLI مربوط به session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌گرهای payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌گرهای اتصال نشست/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، احراز هویت و discovery provider، ثبت زمان‌اجرای provider، پیش‌فرض‌ها/کاتالوگ‌های provider، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، ماندگاری محلی، جریان‌های کنترل gateway، و قراردادهای زمان‌اجرای صفحه کنترل task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | fetch/search وب هسته، IO رسانه، درک رسانه، تولید تصویر، و قراردادهای زمان‌اجرای تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و نقطه ورود Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK در سمت بسته منتشرشده و کمک‌گرهای قرارداد بسته Plugin                                                                                      |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای bundled باید فقط پس از پایدار شدن زمان‌اجرا و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگه‌داری

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگه‌داری Codex رویدادمحور برای همسو نگه داشتن مستندات موجود با تغییرات تازه land شده است. schedule خالص ندارد: اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را تحریک کند، و dispatch دستی می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی در یک ساعت گذشته اجرای غیر skipped دیگری از Docs Agent ساخته شده باشد، skip می‌شوند. هنگام اجرا، بازه commit از SHA منبع قبلی غیر skipped Docs Agent تا `main` فعلی را بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل کارایی تست

گردش‌کار `Test Performance Agent` یک مسیر نگه‌داری Codex رویدادمحور برای تست‌های کند است. schedule خالص ندارد: اجرای موفق CI مربوط به push غیررباتی روی `main` می‌تواند آن را تحریک کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلاً اجرا شده یا در حال اجرا باشد، skip می‌شود. dispatch دستی آن دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش کارایی Vitest گروه‌بندی‌شده برای مجموعه کامل می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک کارایی تست را که پوشش را حفظ می‌کنند انجام دهد نه refactorهای گسترده، سپس گزارش مجموعه کامل را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های پاس‌شده baseline را کاهش دهند رد می‌کند. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای آشکار را اصلاح کند و گزارش مجموعه کامل پس از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale متعارض skip می‌شوند. از Ubuntu میزبانی‌شده GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مانند عامل مستندات حفظ کند.

### درخواست‌های PR تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتاً فهرست‌شده را می‌بندد. پیش از تغییر GitHub، بررسی می‌کند که PR land شده merge شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییر یافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی نسبت به دامنه گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات تولیدی هسته، typecheck تولید و تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات تولیدی extension، typecheck تولید و تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا plugin-contract به typecheck extension گسترش می‌یابند، چون extensions به آن قراردادهای هسته وابسته‌اند (جاروب‌های Vitest مربوط به extension همچنان کار تست صریح می‌مانند)؛
- افزایش نسخه‌های فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای fail safe به همه مسیرهای بررسی می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً از `check:changed` ارزان‌تر است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph را اجرا می‌کنند. پیکربندی shared group-room delivery یکی از نگاشت‌های صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ هسته به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR شکست بخورد. فقط وقتی تغییر آن‌قدر در سطح harness گسترده است که مجموعه نگاشت‌شده ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشه مخزن اجرا کنید و برای اعتبارسنجی گسترده، یک باکس گرم‌شده تازه را ترجیح دهید. پیش از صرف یک گیت کند روی باکسی که دوباره استفاده شده، منقضی شده، یا همین حالا همگام‌سازی غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل باکس اجرا کنید.

بررسی سلامت وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف ردیابی‌شده نشان دهد، سریع شکست می‌خورد. این معمولاً یعنی وضعیت همگام‌سازی راه‌دور کپی قابل اعتمادی از درخواست کشش نیست؛ به‌جای اشکال‌زدایی شکست تست محصول، آن باکس را متوقف کنید و یک باکس تازه را گرم کنید. برای درخواست‌های کشش با حذف‌های بزرگ عمدی، برای آن اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحله همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن آن محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای تغییرات محلی غیرعادی بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

Crabbox مسیر دوم باکس راه‌دور متعلق به مخزن برای اعتبارسنجی Linux است، وقتی Blacksmith در دسترس نیست یا ظرفیت ابری مالکیت‌شده ترجیح دارد. یک باکس را گرم کنید، آن را از طریق گردش‌کار پروژه هیدراته کنید، سپس فرمان‌ها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی و هیدراته‌سازی GitHub Actions است. این فایل `.git` محلی را مستثنی می‌کند تا checkout هیدراته‌شده Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، فراداده Git راه‌دور خودش را نگه دارد، و آرتیفکت‌های runtime/build محلی را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه‌ای است که فرمان‌های بعدی `crabbox run --id <cbx_id>` از آن source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
