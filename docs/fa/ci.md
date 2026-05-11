---
read_when:
    - باید بدانید چرا یک کار CI اجرا شد یا نشد
    - در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ کردن اجرای اعتبارسنجی انتشار یا اجرای دوبارهٔ آن هستید
    - شما ارسال ClawSweeper یا بازارسال فعالیت GitHub را تغییر می‌دهید
summary: گراف کار CI، گیت‌های دامنه، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لولهٔ CI
x-i18n:
    generated_at: "2026-05-11T20:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

CI مربوط به OpenClaw روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` تفاوت‌ها را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، مسیرهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً دامنه‌بندی هوشمند را دور می‌زنند و کل گراف را برای نامزدهای انتشار و اعتبارسنجی گسترده منشعب می‌کنند. مسیرهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی Pipeline

| کار                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-مستندات، دامنه‌های تغییرکرده، افزونه‌های تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیرپیش‌نویس |
| `security-scm-fast`              | تشخیص کلید خصوصی و ممیزی workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیرپیش‌نویس |
| `security-dependency-audit`      | ممیزی lockfile تولید بدون وابستگی در برابر هشدارهای npm                                          | همیشه روی pushها و PRهای غیرپیش‌نویس |
| `security-fast`                  | تجمیع الزامی برای کارهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیرپیش‌نویس |
| `check-dependencies`             | گذر فقط-وابستگی Knip برای تولید به‌همراه محافظ allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، رابط کاربری Control، بررسی‌های artifact ساخته‌شده، و artifactهای پایین‌دستی قابل استفاده مجدد                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | مسیرهای سریع درستی‌سنجی Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های contract کانال به‌صورت shard شده با نتیجه بررسی تجمیعی پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای آزمون Core Node، به‌جز مسیرهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت shard شده: نوع‌های prod، lint، guardها، نوع‌های آزمون، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، boundary/prompt drift به‌صورت shard شده، guardهای extension، boundary بسته، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | آزمون‌های smoke برای CLI ساخته‌شده و smoke حافظه آغازین                                                            | تغییرات مرتبط با Node              |
| `checks`                         | اعتبارسنج برای آزمون‌های کانال artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | مسیر ساخت و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های شکسته                                                             | تغییر مستندات                       |
| `skills-python`                  | Ruff + pytest برای skills پشتیبانی‌شده با Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | آزمون‌های مخصوص پردازه/مسیر در Windows به‌همراه رگرسیون‌های مشترک مشخص‌کننده import در runtime                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | مسیر آزمون TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و tests برای برنامه macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | آزمون‌های واحد Android برای هر دو flavor به‌همراه یک ساخت debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه آزمون‌های کند Codex پس از فعالیت مورداعتماد                                                 | موفقیت CI اصلی یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با مسیرهای mock-provider، deep-profile، و GPT 5.4 live | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد کدام مسیرها اصلاً وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` مرحله‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و matrix پلتفرم، سریع شکست می‌خورند.
3. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن ساخت مشترک بتوانند شروع کنند.
4. مسیرهای سنگین‌تر پلتفرم و runtime پس از آن منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

وقتی یک push جدید روی همان ref مربوط به PR یا `main` انجام شود، GitHub ممکن است کارهای جایگزین‌شده را با وضعیت `cancelled` علامت بزند. این را نویز CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز در حال شکست باشد. بررسی‌های تجمیعی shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان شکست‌های عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل جایگزین شده است، در صف قرار نگیرند. کلید concurrency خودکار CI نسخه‌دار است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجرای جدیدتر main را برای همیشه مسدود کند. اجراهای دستی کل suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

کار `ci-timings-summary` برای هر اجرای CI غیرپیش‌نویس یک artifact فشرده `ci-timings-summary` بارگذاری می‌کند. این artifact زمان دیواری، زمان صف، کندترین کارها، و کارهای شکست‌خورده برای اجرای جاری را ثبت می‌کند، تا بررسی‌های سلامت CI مجبور نباشند بارها payload کامل Actions را scrape کنند.

## دامنه و مسیریابی

منطق دامنه در `scripts/ci-changed-scope.mjs` قرار دارد و با آزمون‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری رفتار کند که انگار همه بخش‌های scoped تغییر کرده‌اند.

- **ویرایش‌های workflow مربوط به CI** گراف CI مربوط به Node به‌همراه linting workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجبار نمی‌کنند؛ آن مسیرهای پلتفرم به تغییرات source پلتفرم محدود می‌مانند.
- **ویرایش‌های فقط-مسیریابی CI، ویرایش‌های منتخب و ارزان fixture آزمون core، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر سریع manifest فقط-Node استفاده می‌کنند: `preflight`، security، و یک کار `checks-fast-core`. وقتی تغییر به سطوح routing یا helper که کار سریع مستقیماً تمرین می‌کند محدود باشد، این مسیر build artifactها، سازگاری Node 22، contractهای کانال، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای مخصوص پردازه/مسیر در Windows، helperهای runner مربوط به npm/pnpm/UI، پیکربندی package manager، و سطوح workflow مربوط به CI که آن مسیر را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط source، plugin، install-smoke، و فقط-آزمون روی مسیرهای Linux Node باقی می‌مانند.

کندترین خانواده‌های آزمون Node تقسیم یا متوازن شده‌اند تا هر کار بدون رزرو بیش‌ازحد runner کوچک بماند: contractهای کانال به‌صورت سه shard وزن‌دار مبتنی بر Blacksmith با fallback استاندارد runner GitHub اجرا می‌شوند، مسیرهای سریع/پشتیبان unit core جداگانه اجرا می‌شوند، زیرساخت runtime core بین shardهای state، process/config، cron، و shared تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با زیرشاخه reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و پیکربندی‌های agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، میان مسیرهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. آزمون‌های گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard مربوط به CI ثبت می‌کنند، تا `.artifacts/vitest-shard-timings.json` بتواند یک پیکربندی کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کارهای compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guardهای boundary میان چهار shard ماتریسی stripe شده است، هر کدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و timingهای جداگانه هر بررسی را چاپ می‌کنند. بررسی پرهزینه drift مربوط به Codex happy-path prompt snapshot به‌عنوان کار اضافی خودش فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، تا تغییرات عادی و نامرتبط Node پشت تولید سرد prompt snapshot منتظر نمانند و shardهای boundary متوازن بمانند، درحالی‌که prompt drift همچنان به همان PR که باعث آن شده pin می‌شود؛ همین flag تولید Vitest مربوط به prompt snapshot را داخل shard core support-boundary مربوط به built-artifact رد می‌کند. Gateway watch، آزمون‌های کانال، و shard core support-boundary پس از اینکه `dist/` و `dist-runtime/` ساخته شدند، به‌صورت هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

CI مربوط به Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor مربوط به third-party هیچ source set یا manifest جداگانه‌ای ندارد؛ مسیر آزمون واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، درحالی‌که از یک کار تکراری packaging برای debug APK روی هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies` فرمان‌های `pnpm deadcode:dependencies` (یک گذر فقط-وابستگی Knip برای تولید که به آخرین نسخه Knip pin شده است، با حداقل سن انتشار pnpm غیرفعال‌شده برای نصب `dlx`) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ فرمان دوم یافته‌های فایل استفاده‌نشده تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک ورودی stale در allowlist باقی بگذارد شکست می‌خورد، درحالی‌که سطوح intentional dynamic plugin، generated، build، live-test، و package bridge که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌شوند.

## ارسال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow یک توکن GitHub App از `CLAWSWEEPER_APP_PRIVATE_KEY` می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار مسیر دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بازبینی issue و pull request؛
- `clawsweeper_comment` برای فرمان‌های صریح ClawSweeper در نظرهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بازبینی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

مسیر `github_activity` فقط metadata نرمال‌سازی‌شده را ارسال می‌کند: نوع رویداد، action، actor، repository، شماره item، URL، عنوان، وضعیت، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این مسیر عمداً از ارسال بدنه کامل webhook خودداری می‌کند. workflow گیرنده در `openclaw/clawsweeper` برابر است با `.github/workflows/github-activity.yml`، که رویداد نرمال‌سازی‌شده را برای agent مربوط به ClawSweeper به hook مربوط به OpenClaw Gateway ارسال می‌کند.

فعالیت عمومی مشاهده است، نه تحویل به‌صورت پیش‌فرض. agent مربوط به ClawSweeper مقصد Discord را در prompt خود دریافت می‌کند و فقط وقتی رویداد غافلگیرکننده، اقدام‌پذیر، پرریسک، یا از نظر عملیاتی مفید است باید در `#clawsweeper` پست کند. باز شدن‌ها، ویرایش‌ها، churn مربوط به bot، نویز duplicate webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

Treat GitHub titles, comments, bodies, review text, branch names, and commit messages as untrusted data throughout this path. They are input for summarization and triage, not instructions for the workflow or agent runtime.

## Manual dispatches

Manual CI dispatches run the same job graph as normal CI but force every non-Android scoped lane on: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, and Control UI i18n. Standalone manual CI dispatches run Android only with `include_android=true`; the full release umbrella enables Android by passing `include_android=true`. Plugin prerelease static checks, the release-only `agentic-plugins` shard, the full extension batch sweep, and plugin prerelease Docker lanes are excluded from CI. The Docker prerelease suite runs only when `Full Release Validation` dispatches the separate `Plugin Prerelease` workflow with the release-validation gate enabled.

Manual runs use a unique concurrency group so a release-candidate full suite is not cancelled by another push or PR run on the same ref. The optional `target_ref` input lets a trusted caller run that graph against a branch, tag, or full commit SHA while using the workflow file from the selected dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, fast security jobs and aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards except lint, `check-additional` aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight also uses GitHub-hosted Ubuntu so the Blacksmith matrix can queue earlier |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, and `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node test shards, bundled plugin test shards, `check-additional` shards, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU-sensitive enough that 8 vCPU cost more than they saved); install-smoke Docker builds (32-vCPU queue time cost more than it saved)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` on `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` on `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

Canonical-repo CI keeps Blacksmith as the default runner path. During `preflight`, `scripts/ci-runner-labels.mjs` checks recent queued and in-progress Actions runs for queued Blacksmith jobs. If a specific Blacksmith label already has queued jobs, downstream jobs that would use that exact label fall back to the matching GitHub-hosted runner (`ubuntu-24.04`, `windows-2025`, or `macos-latest`) for that run only. Other Blacksmith sizes in the same OS family stay on their primary labels. If the API probe fails, no fallback is applied.

## Local equivalents

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

## OpenClaw Performance

`OpenClaw Performance` is the product/runtime performance workflow. It runs daily on `main` and can be dispatched manually:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manual dispatch normally benchmarks the workflow ref. Set `target_ref` to benchmark a release tag or another branch with the current workflow implementation. Published report paths and latest pointers are keyed by the tested ref, and each `index.md` records the tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count, and scenario filters.

The workflow installs OCM from a pinned release and Kova from `openclaw/Kova` at the pinned `kova_ref` input, then runs three lanes:

- `mock-provider`: Kova diagnostic scenarios against a local-build runtime with deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling for startup, gateway, and agent-turn hotspots.
- `live-gpt54`: a real OpenAI `openai/gpt-5.4` agent turn, skipped when `OPENAI_API_KEY` is unavailable.

The mock-provider lane also runs OpenClaw-native source probes after the Kova pass: gateway boot timing and memory across default, hook, and 50-plugin startup cases; repeated mock-OpenAI `channel-chat-baseline` hello loops; and CLI startup commands against the booted gateway. The source probe Markdown summary lives at `source/index.md` in the report bundle, with raw JSON beside it.

Every lane uploads GitHub artifacts. When `CLAWGRIT_REPORTS_TOKEN` is configured, the workflow also commits `report.json`, `report.md`, bundles, `index.md`, and source-probe artifacts into `openclaw/clawgrit-reports` under `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. The current tested-ref pointer is written as `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is the manual umbrella workflow for "run everything before release." It accepts a branch, tag, or full commit SHA, dispatches the manual `CI` workflow with that target, dispatches `Plugin Prerelease` for release-only plugin/package/static/Docker proof, and dispatches `OpenClaw Release Checks` for install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix, and Telegram lanes. Stable/default runs keep exhaustive live/E2E and Docker release-path coverage behind `run_release_soak=true`; `release_profile=full` forces that soak coverage on so broad advisory validation remains broad. With `rerun_group=all` and `release_profile=full`, it also runs `NPM Telegram Beta E2E` against the `release-package-under-test` artifact from release checks. After publishing, pass `release_package_spec` to reuse the shipped npm package across release checks, Package Acceptance, Docker, cross-OS, and Telegram without rebuilding. Use `npm_telegram_package_spec` only when Telegram must prove a different package.

See [Full release validation](/fa/reference/full-release-validation) for the
stage matrix, exact workflow job names, profile differences, artifacts, and
focused rerun handles.

`OpenClaw Release Publish` is the manual mutating release workflow. Dispatch it
from `release/YYYY.M.D` or `main` after the release tag exists and after the
OpenClaw npm preflight has succeeded. It verifies `pnpm plugins:sync:check`,
dispatches `Plugin NPM Release` for all publishable plugin packages, dispatches
`Plugin ClawHub Release` for the same release SHA, and only then dispatches
`OpenClaw NPM Release` with the saved `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی یک شاخه با تغییرات سریع، به‌جای
`gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

رفرنس‌های dispatch در workflowهای GitHub باید شاخه یا tag باشند، نه SHA خام commit. این
helper یک شاخه موقت `release-ci/<sha>-...` در SHA هدف push می‌کند،
`Full Release Validation` را از همان ref پین‌شده dispatch می‌کند، بررسی می‌کند که
`headSha` هر workflow فرزند با هدف یکی باشد، و پس از تکمیل اجرا شاخه موقت را حذف می‌کند.
راستی‌آزمای umbrella همچنین اگر هر workflow فرزند روی SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره live/provider پاس‌داده‌شده به release checkها را کنترل می‌کند. workflowهای
release دستی به‌صورت پیش‌فرض `stable` هستند؛ فقط وقتی از `full` استفاده کنید که
عمدا ماتریس گسترده advisory provider/media را می‌خواهید. `run_release_soak`
کنترل می‌کند آیا release checkهای stable/default، soak کامل live/E2E و
Docker مسیر release را اجرا کنند یا نه؛ `full` soak را اجباری فعال می‌کند.

- `minimum` سریع‌ترین laneهای حیاتی release مربوط به OpenAI/core را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده advisory provider/media را اجرا می‌کند.

umbrella شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه umbrella و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک release candidate از `all`، فقط برای فرزند full CI معمولی از `ci`، فقط برای فرزند prerelease مربوط به Plugin از `plugin-prerelease`، برای همه فرزندان release از `release-checks`، یا روی umbrella از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram`. این کار اجرای دوباره یک release box ناموفق را پس از یک fix متمرکز محدود نگه می‌دارد. برای یک lane ناموفق cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ دستورهای طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. laneهای QA release-check advisory هستند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما راستی‌آزمای release-check را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ref workflow مورداعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball با نام `release-package-under-test` resolve کند، سپس آن artifact را به checkهای cross-OS و پذیرش بسته، به‌علاوه workflow زنده/E2E مسیر release در Docker هنگام اجرای پوشش soak، پاس می‌دهد. این کار byteهای بسته را در همه release boxها یکسان نگه می‌دارد و از بسته‌بندی دوباره همان candidate در چند job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
umbrella قدیمی‌تر را supersede می‌کنند. monitor والد هر workflow فرزندی را که
قبلا dispatch کرده باشد، هنگام cancel شدن والد cancel می‌کند؛ بنابراین validation جدید main
پشت یک اجرای release-check دو ساعته قدیمی نمی‌ماند. validation شاخه/tagهای release
و گروه‌های rerun متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## shardهای Live و E2E

فرزند live/E2E مربوط به release همچنان پوشش گسترده native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریال، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- shardهای جداشده audio/video رسانه و shardهای music فیلترشده بر اساس provider

این کار همان پوشش فایل را نگه می‌دارد و در عین حال rerun و تشخیص شکست‌های کند providerهای live را آسان‌تر می‌کند. نام shardهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای rerunهای دستی یک‌مرحله‌ای همچنان معتبر می‌مانند.

shardهای رسانه native live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط workflow `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ jobهای رسانه فقط پیش از setup وجود binaryها را بررسی می‌کنند. suiteهای live مبتنی بر Docker را روی runnerهای معمول Blacksmith نگه دارید؛ jobهای container جای نامناسبی برای اجرای تست‌های Docker تو‌در‌تو هستند.

shardهای live model/backend مبتنی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. workflow live release آن image را یک‌بار می‌سازد و push می‌کند، سپس shardهای Docker live model، Gateway شاردشده بر اساس provider، CLI backend، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. shardهای Docker مربوط به Gateway سقف‌های explicit `timeout` در سطح script دارند که پایین‌تر از timeout job workflow است، تا container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع fail شود. اگر آن shardها هدف Docker کامل source را مستقل دوباره بسازند، اجرای release اشتباه پیکربندی شده و زمان واقعی را برای ساخت‌های تکراری image هدر می‌دهد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل نصب OpenClaw به‌عنوان محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت source را validate می‌کند، اما پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از install یا update اجرا می‌کنند validate می‌کند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک candidate بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و source، ref workflow، ref بسته، version، SHA-256، و profile را در خلاصه step GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow قابل استفاده مجدد آن artifact را download می‌کند، inventory مربوط به tarball را validate می‌کند، در صورت نیاز imageهای Docker مبتنی بر package-digest را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout workflow روی همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، workflow قابل استفاده مجدد بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر پذیرش بسته یکی را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram fail شده باشد workflow را fail می‌کند.

### Sourceهای candidate

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک version دقیق release مربوط به OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک شاخه، tag، یا SHA کامل commit مربوط به `package_ref` مورداعتماد را pack می‌کند. resolver شاخه‌ها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه شاخه repository یا یک release tag قابل‌دسترسی باشد، dependencyها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url` یک `.tgz` مبتنی بر HTTPS را download می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما برای artifactهایی که به‌صورت خارجی share شده‌اند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/harness مورداعتماد است که تست را اجرا می‌کند. `package_ref` همان commit source است که هنگام `source=ref` بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی commitهای source مورداعتماد قدیمی‌تر را بدون اجرای logic قدیمی workflow validate کند.

### Profileهای suite

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `skill-install`، `update-corrupt-plugin`، `upgrade-survivor`، `published-upgrade-survivor`، `update-restart-auth`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل Docker مسیر release همراه با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ هنگام `suite_profile=custom` الزامی است

profile با نام `package` از پوشش Plugin آفلاین استفاده می‌کند تا validation بسته منتشرشده به دسترس‌بودن live ClawHub وابسته نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، در حالی که مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای policy اختصاصی مربوط به تست update و Plugin، شامل دستورهای محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های release، و triage شکست،
[تست updateها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بستهٔ انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار مهاجرت بسته، به‌روزرسانی، نصب زندهٔ Skills از ClawHub، پاک‌سازی وابستگی Plugin قدیمی، ترمیم نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و اثبات Telegram را روی همان tarball بستهٔ resolveشده نگه می‌دارد. پس از انتشار یک بتا، `release_package_spec` را در اعتبارسنجی کامل انتشار یا بررسی‌های انتشار OpenClaw تنظیم کنید تا همان ماتریس روی بستهٔ npm منتشرشده بدون ساخت دوباره اجرا شود؛ `package_acceptance_package_spec` را فقط وقتی تنظیم کنید که پذیرش بسته به بسته‌ای متفاوت از بقیهٔ اعتبارسنجی انتشار نیاز دارد. بررسی‌های انتشار میان‌سیستم‌عاملی همچنان onboarding، نصب‌کننده، و رفتار پلتفرمی مختص سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. مسیر Docker با نام `published-upgrade-survivor` در مسیر مسدودکنندهٔ انتشار، در هر اجرا یک خط پایهٔ بستهٔ منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشدهٔ `package-under-test` همیشه کاندید است و `published_upgrade_survivor_baseline` خط پایهٔ منتشرشدهٔ fallback را انتخاب می‌کند، که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوبارهٔ مسیرهای ناموفق همان خط پایه را حفظ می‌کنند. اعتبارسنجی کامل انتشار با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا پوشش را روی چهار انتشار پایدار اخیر npm، به‌علاوهٔ انتشارهای مرزی سنجاق‌شده برای سازگاری Plugin و fixtureهای شکل‌گرفته از issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شدهٔ OpenClaw، مسیرهای log با tilde، و ریشه‌های قدیمی وابستگی Plugin گسترش دهد. انتخاب‌های چندخط‌پایه‌ای published-upgrade survivor بر اساس خط پایه به jobهای runner هدفمند Docker جداگانه shard می‌شوند. گردش‌کار جداگانهٔ مهاجرت به‌روزرسانی، وقتی پرسش دربارهٔ پاک‌سازی جامع به‌روزرسانی‌های منتشرشده است و نه گسترهٔ معمول CI اعتبارسنجی کامل انتشار، از مسیر Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای aggregate محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک مسیر واحد مانند `openclaw@2026.4.15` را نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس سناریو تنظیم کنند. مسیر منتشرشده خط پایه را با یک دستور پخته‌شدهٔ `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوهٔ وضعیت RPC را probe می‌کند. مسیرهای تازهٔ بسته‌بندی‌شده و نصب‌کنندهٔ Windows نیز بررسی می‌کنند که یک بستهٔ نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام مطلق Windows import کند. smoke چرخش agent میان‌سیستم‌عاملی OpenAI وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌صورت پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 باقی بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری قدیمی

پذیرش بسته برای بسته‌هایی که قبلا منتشر شده‌اند پنجره‌های محدود سازگاری قدیمی دارد. بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های خصوصی شناخته‌شدهٔ QA در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است زیرحالت پایداری `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `patchedDependencies`های pnpm گم‌شده را از fixture جعلی git مشتق‌شده از tarball حذف کند و ممکن است `update.channel` پایدارشدهٔ گم‌شده را log کند؛
- smokeهای Plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود پایداری install-record در marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فرادادهٔ پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار بدون نصب دوباره بدون تغییر بمانند.

بستهٔ منتشرشدهٔ `2026.4.26` نیز ممکن است برای فایل‌های stamp فرادادهٔ ساخت محلی که از پیش منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا رد شدن، شکست می‌خورند.

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

هنگام debug کردن یک اجرای ناموفق پذیرش بسته، از خلاصهٔ `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای مسیر، زمان‌بندی‌های phase، و فرمان‌های اجرای دوباره. به‌جای اجرای دوبارهٔ اعتبارسنجی کامل انتشار، اجرای دوبارهٔ profile بستهٔ ناموفق یا مسیرهای دقیق Docker را ترجیح دهید.

## Smoke نصب

گردش‌کار جداگانهٔ `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطوح Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای bundleشده، یا سطوح Plugin/channel/gateway/Plugin SDK هسته را که jobهای smoke Docker تمرین می‌کنند لمس می‌کنند. تغییرات فقط source در Pluginهای bundleشده، ویرایش‌های فقط تست، و ویرایش‌های فقط مستندات workerهای Docker را reserve نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e شبکهٔ Gateway کانتینر را اجرا می‌کند، build arg مربوط به extension bundleشده را تأیید می‌کند، و profile محدود Docker مربوط به Pluginهای bundleشده را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب بستهٔ QR و Docker/به‌روزرسانی نصب‌کننده را برای اجراهای زمان‌بندی‌شدهٔ شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی که واقعا سطوح نصب‌کننده/بسته/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک image smoke مربوط به Dockerfile ریشهٔ GHCR با target-SHA را آماده یا دوباره استفاده می‌کند، سپس نصب بستهٔ QR، smokeهای Dockerfile/Gateway ریشه، smokeهای نصب‌کننده/به‌روزرسانی، و Docker E2E سریع Pluginهای bundleشده را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای image ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق scope تغییرات روی یک push پوشش کامل را درخواست کند، گردش‌کار smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

تست smoke کندِ نصب سراسری Bun برای image-provider جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این تست طبق زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## E2E محلی Docker

`pnpm test:docker:all` یک تصویر مشترک live-test را از پیش می‌سازد، OpenClaw را یک بار به‌صورت tarball مربوط به npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` را می‌سازد:

- یک runner خام Node/Git برای laneهای نصب‌کننده/به‌روزرسانی/plugin-dependency؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکردی معمول در `/app` نصب می‌کند.

تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler تصویر را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                 | پیش‌فرض | هدف                                                                                         |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای معمول.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از create storm در daemon Docker؛ برای حذف فاصله‌گذاری `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست دقیق laneها با جداکننده ویرگول؛ smoke پاک‌سازی را رد می‌کند تا agentها بتوانند یک lane شکست‌خورده را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. aggregate محلی، Docker را preflight می‌کند، containerهای قدیمی E2E OpenClaw را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب longest-first پایدار می‌کند، و به‌طور پیش‌فرض پس از اولین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل استفاده مجدد live/E2E

workflow قابل استفاده مجدد live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام package، نوع تصویر، تصویر live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact مربوط به package از اجرای فعلی را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای package نصب‌شده نیاز دارد، تصویرهای bare/functional مربوط به GHCR Docker E2E با tag digest package را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای build مجدد، از ورودی‌های فراهم‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصویرهای digest package موجود استفاده می‌کند. pull کردن تصویرهای Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شود تا stream گیرکرده registry/cache به‌جای مصرف بیشتر critical path مربوط به CI، سریع retry شود.

### chunkهای مسیر انتشار

پوشش Docker انتشار، jobهای chunkشده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را که نیاز دارد pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

بخش‌های Docker انتشار فعلی `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و از `plugins-runtime-install-a` تا `plugins-runtime-install-h` هستند. `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` همچنان نام‌های مستعار تجمیعی Plugin/زمان‌اجرای Plugin باقی می‌مانند. نام مستعار lane به نام `install-e2e` همچنان نام مستعار تجمیعی بازاجرای دستی برای هر دو lane نصب‌کننده provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل مسیر انتشار آن را درخواست کند، در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI یک بخش مستقل `openwebui` نگه می‌دارد. laneهای به‌روزرسانی کانال‌های همراه، برای خطاهای گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر بخش، `.artifacts/docker-tests/` را همراه با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های فاز، JSON طرح زمان‌بند، جدول‌های laneهای کند و فرمان‌های بازاجرای هر lane بارگذاری می‌کند. ورودی `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای بخش‌ها روی imageهای آماده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود یا دوباره استفاده می‌کند؛ اگر یک lane انتخاب‌شده، lane زنده Docker باشد، job هدفمند image تست زنده را به‌صورت محلی برای آن بازاجرا می‌سازد. فرمان‌های بازاجرای GitHub تولیدشده برای هر lane، وقتی این مقدارها وجود داشته باشند، `package_artifact_run_id`، `package_artifact_name` و ورودی‌های image آماده را شامل می‌شوند، بنابراین یک lane ناموفق می‌تواند همان بسته و imageهای دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زمان‌بندی‌شده زنده/E2E هر روز مجموعه کامل Docker مسیر انتشار را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک workflow جداگانه است که توسط `Full Release Validation` یا یک اپراتور صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این workflow تست‌های Plugin همراه را میان هشت worker اکستنشن متوازن می‌کند؛ آن jobهای shard اکستنشن تا دو گروه پیکربندی Plugin را هم‌زمان، با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا دسته‌های Plugin با import سنگین، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker مخصوص انتشار، laneهای هدفمند Docker را در گروه‌های کوچک دسته‌بندی می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری شود. این workflow همچنین یک artifact اطلاع‌رسانی `plugin-inspector-advisory` از `@openclaw/plugin-inspector` بارگذاری می‌کند؛ یافته‌های inspector ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab laneهای CI اختصاصی بیرون از workflow اصلی با scope هوشمند دارد. برابری agentic زیر harnessهای گسترده QA و انتشار تو در تو قرار دارد، نه به‌عنوان یک workflow مستقل PR. وقتی برابری باید همراه یک اجرای اعتبارسنجی گسترده اجرا شود، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane زنده Matrix و laneهای زنده Telegram و Discord را به‌عنوان jobهای موازی پخش می‌کند. jobهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای انتقال زنده Matrix و Telegram را با provider mock قطعی و مدل‌های واجد mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده و راه‌اندازی عادی provider-Plugin جدا شود. Gateway انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کند، زیرا برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه مدل زنده، provider بومی و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkoutشده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. مقدار پیش‌فرض CLI و ورودی workflow دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای حیاتی انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن، بسته‌های candidate و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک دانلود می‌کند تا مقایسه نهایی برابری انجام شود.

برای PRهای عادی، به‌جای اینکه برابری را وضعیت الزامی بدانید، از شواهد CI/بررسی با scope محدود پیروی کنید.

## CodeQL

workflow `CodeQL` عمداً یک اسکنر امنیتی گذر اول و محدود است، نه sweep کامل مخزن. اجراهای روزانه، دستی و guard pull requestهای غیردرفت، کد workflowهای Actions به‌همراه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/critical فیلتر شده‌اند، اسکن می‌کنند.

guard pull request سبک باقی می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages` یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مثل workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL اندروید و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌های امنیتی

| دسته                                              | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | auth، secrets، sandbox، Cron و baseline Gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌همراه زمان‌اجرای Plugin کانال، Gateway، Plugin SDK، secrets و نقاط تماس audit               |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح core SSRF، parsing IP، guard شبکه، web-fetch و سیاست SSRF در Plugin SDK                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای process، تحویل outbound و gateهای اجرای ابزار agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading و قرارداد بسته Plugin SDK               |

### shardهای امنیتی مخصوص پلتفرم

- `CodeQL Android Critical Security` — shard زمان‌بندی‌شده امنیتی اندروید. برنامه اندروید را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که sanity workflow می‌پذیرد، می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج build وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، زیرا build macOS حتی وقتی پاک باشد، زمان اجرا را غالب می‌کند.

### دسته‌های کیفیت Critical

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. این shard فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت error را روی سطوح محدود و پرارزش در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. guard pull request آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیردرفت فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای command/model/tool و dispatch پاسخ agent، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، زمان‌اجرای کانال core و Plugin کانال همراه، protocol/server-method Gateway، glue زمان‌اجرای حافظه/SDK، MCP/process/outbound delivery، runtime/catalog مدل provider، diagnostics session/صف‌های delivery، loader Plugin، قرارداد Plugin SDK/package، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و workflow کیفیت، همه دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، hookهای آموزش/تکرار برای اجرای یک shard کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کدهای Auth، اسرار، sandbox، Cron و مرز امنیتی Gateway                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | شِمای پیکربندی، مهاجرت، نرمال‌سازی، و قراردادهای IO                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | شِماهای پروتکل Gateway و قراردادهای متد سرور                                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال همراه                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های پاسخ خودکار، و قراردادهای زمان اجرای صفحه کنترل ACP                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، نماهای زمان اجرای حافظه، نام‌های مستعار SDK حافظه برای Plugin، اتصال فعال‌سازی زمان اجرای حافظه، و فرمان‌های doctor حافظه                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطح‌های بسته رویداد/گزارش تشخیصی، و قراردادهای CLI برای doctor نشست               |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی SDK مربوط به Plugin، کمک‌کننده‌های محموله پاسخ/تکه‌بندی/زمان اجرا، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته           |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان اجرای ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/واکشی/تعبیه‌سازی |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی UI کنترل، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای صفحه کنترل وظیفه                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان اجرای واکشی/جست‌وجوی وب هسته، IO رسانه، درک رسانه، تولید تصویر، و تولید رسانه                                                                      |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای لودر، رجیستری، سطح عمومی، و نقطه ورود SDK مربوط به Plugin                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع SDK منتشرشده سمت بسته برای Plugin و کمک‌کننده‌های قرارداد بسته Plugin                                                                                          |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python و Pluginهای همراه باید تنها پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های محدود، دوباره به‌صورت کار پیگیری scoped یا sharded اضافه شود.

## گردش‌کارهای نگهداشت

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداشت Codex مبتنی بر رویداد برای همگام نگه‌داشتن مستندات موجود با تغییرات تازه landed شده است. این گردش‌کار زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیرربات روی `main` می‌تواند آن را فعال کند، و اجرای دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلوتر رفته باشد یا وقتی اجرای Docs Agent غیر skipped دیگری در یک ساعت گذشته ساخته شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلیِ Docs Agent غیر skipped تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین عبور مستندات را پوشش دهد.

### عامل کارایی تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت Codex مبتنی بر رویداد برای تست‌های کند است. این گردش‌کار زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیرربات روی `main` می‌تواند آن را فعال کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده یا در حال اجرا باشد، skip می‌شود. اجرای دستی از این دروازه فعالیت روزانه عبور می‌کند. این مسیر یک گزارش کارایی Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد به‌جای refactorهای گسترده فقط اصلاحات کوچک کارایی تست را که پوشش را حفظ می‌کنند انجام دهد، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که شمار baseline تست‌های passing را کاهش دهند رد می‌کند. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای واضح را اصلاح کند و گزارش کل suite بعد از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از landed شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند و push را retry می‌کند؛ patchهای قدیمی conflictدار skip می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land شدن است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر دادن GitHub، تأیید می‌کند که PR landed شده merge شده و هر مورد تکراری یا issue ارجاع‌شده مشترک دارد یا hunkهای تغییر یافته همپوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی درباره مرزهای معماری سخت‌گیرتر از scope گسترده پلتفرم CI است:

- تغییرات تولیدی هسته typecheck تولید و تست هسته را به‌همراه lint/guardهای هسته اجرا می‌کنند؛
- تغییرات فقط تست هسته فقط typecheck تست هسته را به‌همراه lint هسته اجرا می‌کنند؛
- تغییرات تولیدی extension، typecheck تولید و تست extension را به‌همراه lint extension اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck تست extension را به‌همراه lint extension اجرا می‌کنند؛
- تغییرات عمومی SDK مربوط به Plugin یا قرارداد plugin به typecheck extension گسترش می‌یابند، چون extensionها به آن قراردادهای هسته وابسته‌اند (sweepهای extension در Vitest همچنان کار تست explicit باقی می‌مانند)؛
- bumpهای نسخه فقط metadata انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته ریشه/پیکربندی برای fail safe به همه laneهای بررسی می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کند، ویرایش‌های source ابتدا mappingهای explicit را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph را. پیکربندی shared group-room delivery یکی از mappingهای explicit است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push به PR fail شود. فقط وقتی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر در سطح harness گسترده باشد که مجموعه mapped ارزان، proxy قابل اعتماد نباشد.

## اعتبارسنجی Testbox

Crabbox wrapper جعبه ریموت متعلق به repo برای اثبات Linux توسط maintainer است. وقتی یک بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی CI مهم است، یا وقتی اثبات به secretها، Docker، laneهای package، جعبه‌های قابل استفاده مجدد، یا logهای ریموت نیاز دارد، آن را از ریشه repo استفاده کنید. backend عادی OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner مالکیتی fallback برای قطعی‌های Blacksmith، مشکلات quota، یا تست explicit ظرفیت مالکیتی است.

اجراهای Blacksmith پشتیبانی‌شده با Crabbox، Testboxهای یک‌باره را warm، claim، sync، run، report و clean up می‌کنند. بررسی sanity داخلی sync وقتی فایل‌های ضروری ریشه مثل `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف tracked را نشان دهد، سریع fail می‌شود. برای PRهای عمدی با حذف بزرگ، `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را برای فرمان ریموت تنظیم کنید.

Crabbox همچنین یک فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync بماند terminate می‌کند. برای غیرفعال‌کردن این guard، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ مقدار میلی‌ثانیه بزرگ‌تری استفاده کنید.

پیش از نخستین اجرا، wrapper را از ریشه repo بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper repo یک binary قدیمی Crabbox را که `blacksmith-testbox` را advertise نکند رد می‌کند. provider را explicit پاس دهید، حتی اگر `.crabbox.yaml` پیش‌فرض‌های owned-cloud داشته باشد.

دروازه تغییرات:

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

کل suite:

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

خلاصه JSON نهایی را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. اجراهای Crabbox یک‌باره پشتیبانی‌شده با Blacksmith باید Testbox را به‌طور خودکار متوقف کنند؛ اگر اجرایی interrupt شد یا cleanup نامشخص بود، جعبه‌های زنده را بررسی کنید و فقط جعبه‌هایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی reuse را استفاده کنید که عمدا به چند فرمان روی همان جعبه hydrated نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایه خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم فقط برای تشخیص‌هایی مثل `list`، `status` و cleanup استفاده کنید. پیش از اینکه یک اجرای مستقیم Blacksmith را به‌عنوان اثبات maintainer بپذیرید، مسیر Crabbox را اصلاح کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه بدون IP یا URL اجرای Actions در حالت `queued` می‌مانند، آن را فشار provider، queue، billing یا org-limit در Blacksmith در نظر بگیرید. idهای queued را که ساخته‌اید متوقف کنید، Testbox بیشتری شروع نکنید، و اثبات را به مسیر ظرفیت owned Crabbox در پایین منتقل کنید، در حالی که کسی dashboard، billing و محدودیت‌های org در Blacksmith را بررسی می‌کند.

فقط وقتی به ظرفیت owned Crabbox escalate کنید که Blacksmith down باشد، quota-limited باشد، محیط لازم را نداشته باشد، یا ظرفیت owned صراحتا هدف باشد:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

هنگام فشار ظرفیت AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعاً به CPU در سطح 48xlarge نیاز داشته باشد. درخواست `beast` از 192 vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با سهمیهٔ منطقه‌ای EC2 Spot یا On-Demand Standard است. فایل `.crabbox.yaml` متعلق به مخزن به‌طور پیش‌فرض از `standard`، چندین منطقهٔ ظرفیت، و `capacity.hints: true` استفاده می‌کند تا leaseهای AWS واسطه‌شده، منطقه/بازار انتخاب‌شده، فشار سهمیه، fallback به Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گستردهٔ سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast سراغ `large` بروید، و `beast` را فقط برای laneهای استثنایی و CPUمحور مانند ماتریس‌های Docker مربوط به مجموعهٔ کامل یا همهٔ Pluginها، اعتبارسنجی صریح انتشار/مسدودکننده، یا پروفایل‌گیری عملکرد با هسته‌های زیاد به کار ببرید. از `beast` برای `pnpm check:changed`، تست‌های متمرکز، کارهای فقط مستندات، lint/typecheck معمولی، بازتولیدهای کوچک E2E، یا تریاژ قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` پیش‌فرض‌های provider، همگام‌سازی، و hydration در GitHub Actions را برای laneهای ابرِ تحت مالکیت مدیریت می‌کند. این فایل `.git` محلی را مستثنی می‌کند تا checkout هیدرات‌شدهٔ Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، فرادادهٔ Git راه‌دور خودش را حفظ کند؛ همچنین artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مسئول checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه برای دستورهای `crabbox run --id <cbx_id>` در ابرِ تحت مالکیت است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
