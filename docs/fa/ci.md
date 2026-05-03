---
read_when:
    - لازم است بدانید چرا یک وظیفهٔ CI اجرا شده یا نشده است
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما اجرای اعتبارسنجی انتشار یا اجرای مجدد آن را هماهنگ می‌کنید
    - شما در حال تغییر فراخوانی ClawSweeper یا بازارسال فعالیت‌های GitHub هستید
summary: گراف کارهای CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های دستورهای محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-03T21:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job `preflight`، diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجرای دستی `workflow_dispatch` عمدا scoped هوشمند را دور می‌زند و کل graph را برای release candidateها و اعتبارسنجی گسترده پخش می‌کند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مخصوص release در workflow جداگانه [`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از [`اعتبارسنجی کامل release`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای non-draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای non-draft |
| `security-dependency-audit`      | audit lockfile production بدون dependency در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای non-draft |
| `security-fast`                  | aggregate لازم برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای non-draft |
| `check-dependencies`             | pass فقط-dependency مربوط به Knip در production به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های built-artifact، و artifactهای قابل‌استفاده مجدد برای downstream                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded مربوط به contractهای channel با یک نتیجه aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای آزمون Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت sharded: typeهای prod، lint، guardها، typeهای test، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | architecture، boundary/prompt drift به‌صورت sharded، guardهای extension، package boundary، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | آزمون‌های smoke برای CLI ساخته‌شده و smoke حافظه startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای آزمون‌های channel مربوط به built-artifact                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke برای سازگاری Node 22                                                                | dispatch دستی CI برای releaseها    |
| `check-docs`                     | قالب‌بندی docs، lint، و بررسی لینک‌های خراب                                                             | docs تغییر کرده باشد                       |
| `skills-python`                  | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Python-skill      |
| `checks-windows`                 | آزمون‌های process/path مخصوص Windows به‌همراه regressionهای مشترک runtime import specifier                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane آزمون TypeScript روی macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و آزمون‌های Swift برای app macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | آزمون‌های واحد Android برای هر دو flavor به‌همراه یک build از debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه آزمون‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI اصلی یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با laneهای mock-provider، deep-profile، و GPT 5.4 live | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده‌شدن build مشترک بتوانند شروع کنند.
4. پس از آن، laneهای سنگین‌تر platform و runtime پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` می‌نشیند، jobهای superseded را با وضعیت `cancelled` علامت‌گذاری کند. این را noise مربوط به CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز در حال fail شدن باشد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند، بنابراین همچنان failureهای عادی shard را گزارش می‌دهند اما پس از اینکه کل workflow از قبل superseded شده باشد در صف قرار نمی‌گیرند. concurrency key خودکار CI نسخه‌دار است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند اجرای جدیدتر main را برای مدت نامحدود block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای درحال‌انجام را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با آزمون‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی از تشخیص changed-scope عبور می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار همه بخش‌های scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI و workflow linting را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source مربوط به platform محدود می‌مانند.
- **ویرایش‌های فقط-routing مربوط به CI، ویرایش‌های منتخب و ارزان fixture آزمون core، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از مسیر manifest سریع و فقط-Node استفاده می‌کنند: `preflight`، امنیت، و یک task واحد `checks-fast-core`. وقتی تغییر فقط به surfaceهای routing یا helper محدود باشد که task سریع مستقیما exercise می‌کند، آن مسیر از build artifactها، سازگاری Node 22، channel contractها، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی عبور می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config مدیر package، و surfaceهای workflow مربوط به CI که آن lane را اجرا می‌کنند محدود است؛ تغییرات نامرتبط در source، plugin، install-smoke، و فقط-test روی laneهای Linux Node می‌مانند.

کندترین خانواده‌های آزمون Node split یا balanced شده‌اند تا هر job بدون رزرو بیش‌ازحد runner کوچک بماند: channel contractها به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای core unit fast/support جداگانه اجرا می‌شوند، core runtime infra بین shardهای state و process/config تقسیم شده است، auto-reply به‌صورت workerهای balanced اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic gateway/server به‌جای انتظار برای built artifactها بین laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. آزمون‌های گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin از configهای اختصاصی Vitest خودشان استفاده می‌کنند. shardهای include-pattern، entryهای timing را با نام shard مربوط به CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و architecture مربوط به runtime topology را از پوشش gateway watch جدا می‌کند؛ فهرست guardهای boundary بین چهار shard matrix نواری تقسیم شده است، که هرکدام guardهای مستقل منتخب را همزمان اجرا می‌کنند و timing هر check را چاپ می‌کنند، از جمله `pnpm prompt:snapshots:check` تا drift مربوط به prompt مسیر موفق runtime در Codex به همان PR که باعث آن شده pin شود. Gateway watch، آزمون‌های channel، و shard مربوط به core support-boundary داخل `build-artifacts` پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، همزمان اجرا می‌شوند.

Android CI هر دو `testPlayDebugUnitTest` و `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane آزمون واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job تکراری package کردن debug APK روی هر push مرتبط با Android جلوگیری می‌کند.

shard `check-dependencies` دستور `pnpm deadcode:dependencies` (یک pass فقط-dependency مربوط به Knip در production که به آخرین نسخه Knip pin شده، با minimum release age مربوط به pnpm که برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دومی findingهای production unused-file در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. وقتی یک PR فایل استفاده‌نشده جدید و بررسی‌نشده‌ای اضافه کند یا entry کهنه‌ای در allowlist باقی بگذارد، guard مربوط به unused-file fail می‌شود، درحالی‌که surfaceهای عمدی dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت statically resolve کند حفظ می‌کند.

## forwarding فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت هدف از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیرtrusted را checkout یا اجرا نمی‌کند. workflow یک token برای GitHub App از `CLAWSWEEPER_APP_PRIVATE_KEY` می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این کار عمدا از forward کردن body کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` فایل `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای agent مربوط به ClawSweeper به OpenClaw Gateway hook ارسال می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و باید فقط وقتی event غافلگیرکننده، actionable، پرریسک، یا از نظر عملیاتی مفید است در `#clawsweeper` پست کند. بازکردن‌ها، ویرایش‌ها، churn ربات‌ها، noise تکراری webhook، و traffic عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را داده غیرtrusted بدانید. آن‌ها ورودی summarization و triage هستند، نه دستورهایی برای workflow یا runtime مربوط به agent.

## dispatchهای دستی

اجرای دستی CI همان گراف کار معمول CI را اجرا می‌کند، اما هر مسیر محدوده‌دار غیر Android را اجباری فعال می‌کند: شاردهای Linux Node، شاردهای Pluginهای بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Skills پایتون، Windows، macOS و i18n مربوط به Control UI. اجرای مستقل دستی CI فقط Android را با `include_android=true` اجرا می‌کند؛ چتر کامل انتشار، Android را با ارسال `include_android=true` فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، شارد فقط-انتشار `agentic-plugins`، پیمایش دسته‌ای کامل extension، و مسیرهای Docker پیش‌انتشار Plugin از CI کنار گذاشته شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجرای دستی از یک گروه concurrency یکتا استفاده می‌کند تا مجموعه کامل release-candidate توسط اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک فراخوان trusted اجازه می‌دهد آن گراف را در برابر یک branch، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                           | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع protocol/contract/bundled، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و aggregateهای `check-additional`، verifierهای aggregate تست Node، بررسی‌های مستندات، Skills پایتون، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا matrix مربوط به Blacksmith زودتر بتواند queue شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای extension سبک‌تر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types` و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای تست Linux Node، شاردهای تست Plugin بسته‌بندی‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (به‌اندازه‌ای به CPU حساس است که 8 vCPU بیش از صرفه‌جویی‌اش هزینه داشت)؛ ساخت‌های Docker مربوط به install-smoke (هزینه زمان queue برای 32-vCPU بیش از صرفه‌جویی‌اش بود)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` workflow عملکرد product/runtime است. این workflow روزانه روی `main` اجرا می‌شود و می‌توان آن را دستی هم dispatch کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch دستی معمولا benchmark را روی workflow ref انجام می‌دهد. برای benchmark کردن یک tag انتشار یا branch دیگر با پیاده‌سازی فعلی workflow، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و pointerهای latest بر اساس ref تست‌شده کلیدگذاری می‌شوند، و هر `index.md` ref/SHA تست‌شده، workflow ref/SHA، Kova ref، profile، حالت auth مسیر، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این workflow، OCM را از یک انتشار pin‌شده و Kova را از `openclaw/Kova` در ورودی pin‌شده `kova_ref` نصب می‌کند، سپس سه مسیر را اجرا می‌کند:

- `mock-provider`: سناریوهای diagnostic مربوط به Kova در برابر runtime ساخت محلی با auth جعلی deterministic سازگار با OpenAI.
- `mock-deep-profile`: profiling مربوط به CPU/heap/trace برای نقاط داغ startup، Gateway، و agent-turn.
- `live-gpt54`: یک نوبت agent واقعی OpenAI `openai/gpt-5.4` که وقتی `OPENAI_API_KEY` در دسترس نباشد skip می‌شود.

مسیر mock-provider پس از عبور Kova، probeهای source بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی boot و حافظه Gateway در حالت‌های startup پیش‌فرض، hook، و 50-Plugin؛ loopهای hello تکراری `channel-chat-baseline` با mock-OpenAI؛ و فرمان‌های startup مربوط به CLI در برابر Gateway بوت‌شده. خلاصه Markdown مربوط به source probe در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر مسیر artifactهای GitHub را upload می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، workflow همچنین `report.json`، `report.md`، bundleها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. pointer فعلی tested-ref به‌شکل `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` workflow چتر دستی برای «اجرای همه‌چیز پیش از انتشار» است. این workflow یک branch، tag، یا SHA کامل commit می‌پذیرد، workflow دستی `CI` را با آن target dispatch می‌کند، `Plugin Prerelease` را برای proof فقط-انتشار مربوط به Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های Docker release-path، live/E2E، OpenWebUI، parity مربوط به QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. با `rerun_group=all` و `release_profile=full`، این workflow همچنین `NPM Telegram Beta E2E` را در برابر artifact مربوط به `release-package-under-test` از release checks اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را ارسال کنید تا همان مسیر package مربوط به Telegram در برابر package منتشرشده npm دوباره اجرا شود.

برای matrix مرحله، نام دقیق jobهای workflow، تفاوت‌های profile، artifactها، و handleهای rerun متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` workflow دستی mutating انتشار است. پس از وجود داشتن tag انتشار و پس از موفقیت preflight مربوط به npm در OpenClaw، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این workflow، `pnpm plugins:sync:check` را verify می‌کند، `Plugin NPM Release` را برای همه packageهای قابل انتشار Plugin dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط سپس `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای proof مربوط به commit pin‌شده روی یک branch با حرکت سریع، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch refهای workflow در GitHub باید branch یا tag باشند، نه SHA خام commit. helper یک branch موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن ref pin‌شده dispatch می‌کند، verify می‌کند که `headSha` هر workflow فرزند با target مطابقت دارد، و پس از تکمیل run، branch موقت را حذف می‌کند. verifier چتر همچنین اگر هر workflow فرزند روی SHA متفاوتی اجرا شده باشد، fail می‌شود.

`release_profile` گستره‌ی live/provider را که به بررسی‌های انتشار داده می‌شود کنترل می‌کند. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض از `stable` استفاده می‌کنند؛ فقط زمانی از `full` استفاده کنید که عمدا ماتریس گسترده‌ی مشورتی provider/media را می‌خواهید.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه‌ی پایدار provider/backend را اضافه می‌کند.
- `full` ماتریس گسترده‌ی مشورتی provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزندِ dispatchشده را ثبت می‌کند و کار نهایی `Verify full validation` دوباره نتیجه‌گیری‌های فعلی اجرای فرزند را بررسی می‌کند و جدول‌های کندترین کارها را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شد و سبز شد، فقط کار تأییدکننده‌ی والد را دوباره اجرا کنید تا نتیجه‌ی چتر و خلاصه‌ی زمان‌بندی تازه‌سازی شود.

برای بازیابی، هم `Full Release Validation` و هم `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل عادی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر روی چتر: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram`. این کار اجرای دوباره‌ی یک جعبه‌ی انتشار ناموفق را پس از یک رفع متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref گردش‌کار معتمد استفاده می‌کند تا ref انتخاب‌شده را یک بار به tarball با نام `release-package-under-test` تبدیل کند، سپس آن artifact را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به shard پذیرش بسته می‌دهد. این کار بایت‌های بسته را در جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره‌ی همان نامزد در چند کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را جایگزین می‌کنند. ناظر والد هر گردش‌کار فرزندی را که
قبلا dispatch کرده است، هنگام لغو شدن والد لغو می‌کند، بنابراین اعتبارسنجی
جدیدتر main پشت یک اجرای قدیمی دو ساعته‌ی بررسی انتشار منتظر نمی‌ماند.
اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره‌ی متمرکز
`cancel-in-progress: false` را نگه می‌دارند.

## Shardهای live و E2E

فرزند live/E2E انتشار، پوشش گسترده‌ی native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار ترتیبی، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- کارهای provider-filtered با نام `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداشده‌ی صدای/ویدئوی media و shardهای موسیقی provider-filtered

این کار همان پوشش فایل را حفظ می‌کند، درحالی‌که اجرای دوباره و عیب‌یابی خرابی‌های کند provider در live را آسان‌تر می‌کند. نام shardهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای اجرای دوباره‌ی دستی یک‌باره معتبر می‌مانند.

Shardهای media native live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن تصویر `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ کارهای media فقط پیش از آماده‌سازی، باینری‌ها را بررسی می‌کنند. مجموعه‌های live متکی بر Docker را روی runnerهای عادی Blacksmith نگه دارید — کارهای container جای مناسبی برای اجرای تست‌های Docker تودرتو نیستند.

Shardهای live model/backend متکی بر Docker از یک تصویر مشترک جداگانه‌ی `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار live انتشار آن تصویر را یک بار می‌سازد و push می‌کند، سپس shardهای Docker live model، Gateway با shardبندی provider، CLI backend، اتصال ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. Shardهای Gateway Docker سقف‌های explicit در سطح script با `timeout` دارند که پایین‌تر از timeout کار گردش‌کار است، تا یک container گیرکرده یا مسیر پاک‌سازی به‌جای مصرف کل بودجه‌ی بررسی انتشار سریع شکست بخورد. اگر آن shardها هدف Docker کامل source را مستقل بازسازی کنند، اجرای انتشار پیکربندی نادرستی دارد و زمان دیواری را برای ساخت‌های تکراری تصویر هدر خواهد داد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته‌ی قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی فرق دارد: CI عادی درخت source را اعتبارسنجی می‌کند، درحالی‌که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی به کار می‌گیرند اعتبارسنجی می‌کند.

### کارها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` آپلود می‌کند، و source، ref گردش‌کار، ref بسته، نسخه، SHA-256، و profile را در خلاصه‌ی مرحله‌ی GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده‌ی مجدد آن artifact را دانلود می‌کند، inventory مربوط به tarball را اعتبارسنجی می‌کند، هنگام نیاز تصویرهای Docker با digest بسته را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر آن بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل استفاده‌ی مجدد بسته و تصویرهای مشترک را یک بار آماده می‌کند، سپس آن مسیرها را به‌عنوان کارهای Docker هدفمند موازی با artifactهای یکتا پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نیست اجرا می‌شود و زمانی که پذیرش بسته یک مورد را resolve کرده باشد همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده‌ی npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد گردش‌کار را ناموفق می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب، یا SHA کامل commit از `package_ref` معتمد را بسته‌بندی می‌کند. Resolver شاخه‌ها/برچسب‌های OpenClaw را fetch می‌کند، بررسی می‌کند که commit انتخاب‌شده از تاریخچه‌ی شاخه‌ی repository یا یک برچسب انتشار قابل دسترسی باشد، deps را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` مبتنی بر HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده‌ی بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد معتمد گردش‌کار/harness است که تست را اجرا می‌کند. `package_ref` همان commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی commitهای منبع معتمد قدیمی‌تر را بدون اجرای منطق قدیمی گردش‌کار اعتبارسنجی کند.

### Profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه‌ی `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

Profile مربوط به `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته‌ی منتشرشده به دسترس‌بودن live ClawHub وابسته نباشد. مسیر اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec منتشرشده‌ی npm برای dispatchهای مستقل نگه داشته می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
مسیرهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و triage شکست،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته‌ی انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=all-since-2026.4.23`، `published_upgrade_survivor_scenarios=reported-issues`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات مهاجرت بسته، به‌روزرسانی، پاک‌سازی وابستگی Plugin کهنه، ترمیم نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و Telegram را روی همان tarball بسته‌ی resolveشده نگه می‌دارد. برای اجرای همان ماتریس در برابر یک بسته‌ی npm ارسال‌شده به‌جای artifact ساخته‌شده از SHA، مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار platform وابسته به سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. مسیر Docker با نام `published-upgrade-survivor` در هر اجرا یک baseline بسته‌ی منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده‌ی `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده‌ی fallback را انتخاب می‌کند، که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره‌ی مسیر ناموفق آن baseline را حفظ می‌کنند. برای گسترش Full Release CI در همه‌ی انتشارهای پایدار npm از `2026.4.23` تا `latest`، مقدار `published_upgrade_survivor_baselines=all-since-2026.4.23` را تنظیم کنید؛ `release-history` همچنان برای نمونه‌گیری دستی گسترده‌تر با anchor قدیمی‌تر پیش از تاریخ در دسترس است. برای گسترش همان baselineها در fixtureهای شبیه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های OpenClaw Plugin پیکربندی‌شده، مسیرهای log با tilde، و rootهای وابستگی legacy Plugin کهنه، مقدار `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید. گردش‌کار جداگانه‌ی `Update Migration` زمانی از مسیر Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند که پرسش درباره‌ی پاک‌سازی کامل به‌روزرسانی منتشرشده باشد، نه گستره‌ی عادی Full Release CI. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس scenario تنظیم کنند. مسیر منتشرشده baseline را با یک دستورالعمل آماده‌ی فرمان `openclaw config set` پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه‌ی وضعیت RPC را probe می‌کند. مسیرهای تازه‌ی بسته‌بندی‌شده و installer در Windows همچنین بررسی می‌کنند که یک بسته‌ی نصب‌شده بتواند override مربوط به browser-control را از یک مسیر مطلق خام Windows import کند. Smoke مربوط به agent-turn cross-OS با OpenAI در صورت تنظیم‌شدن `OPENCLAW_CROSS_OS_OPENAI_MODEL` به‌طور پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی مدل تست GPT-5 بماند و از پیش‌فرض‌های GPT-4.x دوری شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های از قبل منتشرشده پنجره‌های سازگاری legacy محدود دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- وقتی بسته آن flag را expose نمی‌کند، `doctor-switch` ممکن است زیرمورد persistence مربوط به `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` مفقود را از fixture ساختگی git مشتق‌شده از tarball حذف کند و ممکن است مقدار persisted مفقود `update.channel` را log کند؛
- smokeهای Plugin ممکن است محل‌های legacy رکورد نصب را بخوانند یا persistence مفقود رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata پیکربندی را مجاز بداند، درحالی‌که همچنان لازم می‌داند رکورد نصب و رفتار بدون نصب دوباره بدون تغییر بمانند.

بسته‌ی منتشرشده‌ی `2026.4.26` همچنین ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که از قبل ارسال شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا رد شدن، شکست می‌خورند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و مصنوعات Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، گزارش‌های lane، زمان‌بندی فازها، و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## آزمون smoke نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت دامنه را از طریق کار `preflight` خودش دوباره استفاده می‌کند. این پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای همراه، یا سطح‌های اصلی Plugin/channel/Gateway/Plugin SDK را لمس می‌کنند که کارهای smoke Docker آن‌ها را اجرا می‌کنند. تغییرات فقط-منبع در Pluginهای همراه، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات، workerهای Docker را رزرو نمی‌کنند. مسیر سریع، تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke حذف agents از فضای کاری مشترک در CLI را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، یک آرگومان ساخت extension همراه را تأیید می‌کند، و پروفایل Docker محدود Plugin همراه را زیر مهلت زمانی تجمیعی ۲۴۰ ثانیه‌ای برای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته QR و پوشش Docker/به‌روزرسانی نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر smoke هدف-SHA از Dockerfile ریشه در GHCR را آماده یا دوباره استفاده می‌کند، سپس نصب بسته QR، smokeهای Dockerfile/Gateway ریشه، smokeهای نصب‌کننده/به‌روزرسانی، و E2E سریع Docker مربوط به Plugin همراه را به‌عنوان کارهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای تصویر ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق دامنه‌ی تغییرات روی یک push پوشش کامل را درخواست کند، گردش‌کار smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند provider تصویر در نصب سراسری Bun به‌طور جداگانه با `run_bun_global_install_smoke` دروازه‌بانی می‌شود. این smoke روی زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. تست‌های QR و Docker نصب‌کننده، Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## E2E محلی Docker

`pnpm test:docker:all` یک تصویر مشترک live-test را از پیش می‌سازد، OpenClaw را یک‌بار به‌صورت tarball npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک اجراکننده‌ی خام Node/Git برای laneهای نصب‌کننده/به‌روزرسانی/وابستگی-Plugin؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و اجراکننده فقط طرح انتخاب‌شده را اجرا می‌کند. زمان‌بند تصویر را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل تنظیم‌ها

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای استخر اصلی برای laneهای عادی.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای استخر انتهایی حساس به provider.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از هجوم ایجاد در daemon Docker؛ برای بدون فاصله‌گذاری `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت زمانی پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های فشرده‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` طرح زمان‌بند را بدون اجرای laneها چاپ می‌کند.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده‌ی ویرگول؛ smoke پاک‌سازی را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثرش سنگین‌تر باشد همچنان می‌تواند از یک استخر خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای کهنه‌ی E2E مربوط به OpenClaw را حذف می‌کنند، وضعیت lane فعال را منتشر می‌کنند، زمان‌بندی laneها را برای ترتیب‌دهی longest-first ماندگار می‌کنند، و به‌طور پیش‌فرض پس از نخستین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### گردش‌کار live/E2E قابل استفاده‌ی دوباره

گردش‌کار live/E2E قابل استفاده‌ی دوباره از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع تصویر، تصویر live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن طرح را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا مصنوع بسته‌ی اجرای جاری را دانلود می‌کند، یا یک مصنوع بسته را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی طرح به laneهای با بسته نصب‌شده نیاز دارد، تصویرهای E2E خام/کاربردی Docker در GHCR با tag مبتنی بر digest بسته را از طریق کش لایه‌ی Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، ورودی‌های `docker_e2e_bare_image`/`docker_e2e_functional_image` ارائه‌شده یا تصویرهای موجود مبتنی بر digest بسته را دوباره استفاده می‌کند. pullهای تصویر Docker با یک مهلت زمانی محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا جریان گیرکرده‌ی registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره تلاش شود.

### تکه‌های مسیر انتشار

پوشش Docker انتشار، کارهای کوچک‌تر و تکه‌شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر تکه فقط نوع تصویری را که نیاز دارد pull کند و چندین lane را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

تکه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی Plugin/runtime باقی می‌مانند. alias مربوط به lane `install-e2e` همچنان alias تجمیعی اجرای دوباره‌ی دستی برای هر دو lane نصب‌کننده‌ی provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و تکه‌ی مستقل `openwebui` را فقط برای dispatchهای فقط-OpenWebUI نگه می‌دارد. laneهای به‌روزرسانی کانال همراه، برای شکست‌های گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر تکه `.artifacts/docker-tests/` را همراه با گزارش‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON طرح زمان‌بند، جدول‌های laneهای کند، و فرمان‌های اجرای دوباره برای هر lane بارگذاری می‌کند. ورودی `docker_lanes` گردش‌کار، laneهای انتخاب‌شده را به‌جای کارهای تکه‌ای علیه تصویرهای آماده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک کار Docker هدفمند محدود می‌کند و مصنوع بسته را برای همان اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر یک lane انتخاب‌شده lane زنده‌ی Docker باشد، کار هدفمند تصویر live-test را برای همان اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های اجرای دوباره‌ی GitHub تولیدشده برای هر lane، وقتی آن مقدارها وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده هستند، تا یک lane ناموفق بتواند همان بسته و تصویرهای دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده‌ی live/E2E هر روز مجموعه‌ی کامل Docker مربوط به release-path را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین گردش‌کاری جداگانه است که توسط `Full Release Validation` یا توسط یک اپراتور صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI این مجموعه را خاموش نگه می‌دارند. این گردش‌کار تست‌های Plugin همراه را میان هشت worker extension متوازن می‌کند؛ آن کارهای shard مربوط به extension هم‌زمان تا دو گروه پیکربندی Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا دسته‌های Plugin با import سنگین، کارهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker فقط-انتشار، laneهای هدفمند Docker را در گروه‌های کوچک دسته‌بندی می‌کند تا از رزرو ده‌ها runner برای کارهای یک تا سه دقیقه‌ای جلوگیری شود.

## آزمایشگاه QA

آزمایشگاه QA laneهای اختصاصی CI خارج از گردش‌کار اصلی smart-scoped دارد. همسانی agentic زیر harnessهای گسترده‌ی QA و انتشار تو در تو قرار دارد، نه یک گردش‌کار مستقل PR. وقتی همسانی باید همراه یک اجرای اعتبارسنجی گسترده اجرا شود، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این گردش‌کار lane همسانی mock، lane زنده‌ی Matrix، و laneهای زنده‌ی Telegram و Discord را به‌عنوان کارهای موازی منشعب می‌کند. کارهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از تأخیر مدل زنده و راه‌اندازی عادی provider-plugin جدا شود. Gateway مربوط به transport زنده، جست‌وجوی حافظه را غیرفعال می‌کند زیرا همسانی QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه‌ی مدل زنده، provider بومی، و provider در Docker پوشش داده می‌شود.

Matrix از `--profile fast` برای gateهای زمان‌بندی‌شده و انتشار استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` می‌مانند؛ dispatch دستی با `matrix_profile=all` همیشه پوشش کامل Matrix را به کارهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای حیاتی انتشار آزمایشگاه QA را پیش از تأیید انتشار اجرا می‌کند؛ gate همسانی QA آن بسته‌های نامزد و baseline را به‌عنوان کارهای lane موازی اجرا می‌کند، سپس هر دو مصنوع را در یک کار گزارش کوچک برای مقایسه‌ی نهایی همسانی دانلود می‌کند.

برای PRهای عادی، به‌جای تلقی همسانی به‌عنوان یک وضعیت الزامی، از شواهد CI/check دامنه‌مند پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی مرحلهٔ اول و محدود است، نه پیمایش کامل مخزن. اجراهای محافظ روزانه، دستی و pull requestهای غیرپیش‌نویس، کد گردش‌کارهای Actions به‌همراه پرریسک‌ترین سطوح JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی محدود شده‌اند اسکن می‌کنند.

محافظ pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را مثل گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، cron، و خط مبنای gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌علاوه runtime مربوط به Plugin کانال، Gateway، Plugin SDK، secrets، نقاط تماس audit            |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح سیاست SSRF در core، تحلیل IP، محافظ شبکه، web-fetch، و Plugin SDK                                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار agent                                             |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری منبع، و قرارداد بستهٔ Plugin SDK               |

### شاردهای امنیتی ویژهٔ پلتفرم

- `CodeQL Android Critical Security` — شارد امنیتی زمان‌بندی‌شدهٔ Android. برنامهٔ Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین رانر Blacksmith Linux پذیرفته‌شده توسط workflow sanity می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامهٔ macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده چون ساخت macOS حتی وقتی پاک است، runtime را غالب می‌کند.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript با شدت خطا و غیرامنیتی را روی سطوح محدود و باارزش بالا روی رانر کوچک‌تر Blacksmith Linux اجرا می‌کند. محافظ pull request آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای command/model/tool و dispatch پاسخ agent، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، runtime کانال core و Plugin کانال بسته‌بندی‌شده، protocol/server-method مربوط به Gateway، runtime/SDK glue مربوط به memory، MCP/process/outbound delivery، runtime/catalog مدل provider، session diagnostics/delivery queues، loader مربوط به Plugin، قرارداد Plugin SDK/package، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی Auth، secrets، sandbox، cron، و gateway                                                                                                            |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalization، و IO پیکربندی                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای protocol مربوط به Gateway و قراردادهای server method                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال core و Plugin کانال بسته‌بندی‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای command، dispatch مربوط به model/provider، dispatch و queueهای auto-reply، و قراردادهای runtime صفحهٔ کنترل ACP                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، glue فعال‌سازی runtime حافظه، و commandهای doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی reply queue، queueهای تحویل session، کمک‌کننده‌های binding/delivery نشست خروجی، سطوح diagnostic event/log bundle، و قراردادهای CLI مربوط به session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌کننده‌های reply payload/chunking/runtime، گزینه‌های پاسخ کانال، queueهای تحویل، و کمک‌کننده‌های binding نشست/thread         |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization کاتالوگ مدل، auth و discovery مربوط به provider، ثبت runtime مربوط به provider، defaults/catalogs مربوط به provider، و registryهای web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، persistence محلی، جریان‌های کنترل Gateway، و قراردادهای runtime صفحهٔ کنترل task                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب core، IO رسانه، فهم رسانه، تولید تصویر، و تولید رسانه                                                              |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface، و entrypointهای Plugin SDK                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع منتشرشدهٔ Plugin SDK در سمت بسته و کمک‌کننده‌های قرارداد بستهٔ Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای بسته‌بندی‌شده فقط پس از پایدار شدن runtime و سیگنال پروفایل‌های محدود باید دوباره به‌عنوان کار پیگیری scoped یا sharded اضافه شود.

## گردش‌کارهای نگهداشت

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداشت Codex رویدادمحور برای همسو نگه‌داشتن اسناد موجود با تغییرات اخیراً land شده است. زمان‌بندی خالص ندارد: یک اجرای CI موفق از push غیرربات روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند مستقیماً آن را اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای Docs Agent غیر skip شدهٔ دیگری در یک ساعت گذشته ساخته شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازهٔ commit را از SHA منبع قبلیِ Docs Agent غیر skip شده تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همهٔ تغییرات main انباشته‌شده از آخرین گذر اسناد را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت Codex رویدادمحور برای تست‌های کند است. زمان‌بندی خالص ندارد: یک اجرای CI موفق از push غیرربات روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلاً اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی این دروازهٔ فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شدهٔ مجموعهٔ کامل می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست که coverage را حفظ می‌کنند انجام دهد، نه refactorهای گسترده، سپس گزارش مجموعهٔ کامل را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های پاس‌شدهٔ baseline را کاهش دهند رد می‌کند. اگر baseline تست‌های شکست‌خورده داشته باشد، Codex فقط می‌تواند شکست‌های آشکار را اصلاح کند و گزارش مجموعهٔ کامل پس از agent باید قبل از commit شدن هر چیزی پاس شود. وقتی `main` پیش از land شدن bot push جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای کهنهٔ دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo را مثل docs agent حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتاً فهرست‌شده را می‌بندد. پیش از تغییر GitHub، بررسی می‌کند که PR land شده merge شده باشد و هر تکراری یا issue ارجاع‌شدهٔ مشترک داشته باشد یا hunkهای تغییر یافتهٔ همپوشان.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازهٔ بررسی محلی نسبت به دامنهٔ پلتفرم CI گسترده، دربارهٔ مرزهای معماری سخت‌گیرتر است:

- تغییرات production مربوط به core، typecheck تولید core و تست core به‌علاوه lint/guardهای core را اجرا می‌کنند؛
- تغییرات فقط تست مربوط به core، فقط typecheck تست core به‌علاوه lint core را اجرا می‌کنند؛
- تغییرات production مربوط به extension، typecheck تولید extension و تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست مربوط به extension، typecheck تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات public Plugin SDK یا plugin-contract به typecheck مربوط به extension گسترش می‌یابند چون extensionها به آن قراردادهای core وابسته‌اند (پیمایش‌های extension با Vitest کار تست صریح می‌مانند)؛
- افزایش نسخه‌های فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناختهٔ root/config برای fail-safe به همهٔ مسیرهای بررسی می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های منبع ابتدا mappingهای صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابستگان import-graph را. پیکربندی تحویل shared group-room یکی از mappingهای صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهدهٔ گروه، حالت تحویل پاسخ منبع، یا مسیر message-tool system prompt از تست‌های پاسخ core به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از اولین push مربوط به PR شکست بخورد. فقط وقتی تغییر آن‌قدر harness-wide است که مجموعهٔ mapped ارزان proxy قابل‌اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اثبات گسترده، یک باکس تازه و از پیش گرم‌شده را ترجیح دهید. پیش از صرف کردن یک گیت کند روی باکسی که دوباره استفاده شده، منقضی شده، یا همین حالا همگام‌سازی غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل باکس اجرا کنید.

بررسی سلامت وقتی فایل‌های ریشهٔ لازم مانند `pnpm-lock.yaml` ناپدید شده باشند، یا وقتی `git status --short` دست‌کم ۲۰۰ حذفِ رهگیری‌شده را نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت همگام‌سازی ریموت یک کپی قابل اعتماد از PR نیست؛ آن باکس را متوقف کنید و به‌جای اشکال‌زدایی شکست تست محصول، یک باکس تازه را گرم کنید. برای PRهایی که حذف‌های بزرگ عمدی دارند، برای آن اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین یک فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی بماند، پایان می‌دهد. برای غیرفعال کردن این محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از یک مقدار بزرگ‌تر بر حسب میلی‌ثانیه استفاده کنید.

Crabbox مسیر دومِ باکس ریموتِ متعلق به مخزن برای اثبات Linux است، وقتی Blacksmith در دسترس نیست یا وقتی ظرفیت ابریِ تحت مالکیت ترجیح داده می‌شود. یک باکس را گرم کنید، آن را از طریق گردش‌کار پروژه آماده کنید، سپس دستورها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی، و آماده‌سازی GitHub Actions است. این فایل `.git` محلی را مستثنا می‌کند تا checkout آماده‌شدهٔ Actions به‌جای همگام‌سازی ریموت‌ها و انبارهای آبجکت محلیِ نگه‌دارنده، فرادادهٔ Git ریموت خودش را حفظ کند، و آرتیفکت‌های محلی runtime/build را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه‌ای است که دستورهای بعدی `crabbox run --id <cbx_id>` از آن source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
