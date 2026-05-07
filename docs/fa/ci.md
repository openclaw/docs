---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن یک اجرای اعتبارسنجی انتشار یا اجرای دوبارهٔ آن هستید.
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف وظایف CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان محلی
title: پایپ‌لاین CI
x-i18n:
    generated_at: "2026-05-07T13:13:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job به نام `preflight` diff را دسته‌بندی می‌کند و وقتی فقط نواحی نامرتبط تغییر کرده‌اند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً scoping هوشمند را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده، کل graph را گسترش می‌دهند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از [`اعتبارسنجی کامل انتشار`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط‌docs، scopeهای تغییرکرده، extensions تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیردraft |
| `security-scm-fast`              | تشخیص private key و audit کردن workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیردraft |
| `security-dependency-audit`      | audit کردن lockfile تولیدی بدون dependency در برابر advisories مربوط به npm                                          | همیشه روی pushها و PRهای غیردraft |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیردraft |
| `check-dependencies`             | اجرای production Knip فقط برای dependencyها به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، checkهای artifact ساخته‌شده، و artifactهای reusable پایین‌دستی                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای correctness سریع Linux مانند checkهای bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | checkهای contract مربوط به channel به‌صورت sharded با نتیجه check aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای test مربوط به Core Node، به‌استثنای laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی sharded: types تولیدی، lint، guardها، test types، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، drift مرزی/prompt به‌صورت sharded، guardهای extension، مرز package، و gateway watch        | تغییرات مرتبط با Node              |
| `build-smoke`                    | smoke testهای built-CLI و smoke مربوط به حافظه startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای testهای channel مربوط به artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری با Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی docs، lint، و checkهای لینک شکسته                                                             | docs تغییر کرده است                       |
| `skills-python`                  | Ruff + pytest برای skills مبتنی بر Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | testهای مخصوص Windows برای process/path به‌همراه regressions مربوط به specifierهای import مشترک runtime                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane test مربوط به TypeScript روی macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و testها برای app مربوط به macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | unit testهای Android برای هر دو flavor به‌همراه یک build از APK debug                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه testهای کند Codex پس از فعالیت trusted                                                 | موفقیت CI روی main یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های performance روزانه/درخواستی runtime مربوط به Kova با laneهای mock-provider، deep-profile، و GPT 5.4 live | dispatch زمان‌بندی‌شده و دستی      |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اساساً کدام laneها وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و ماتریس platform سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک شروع شوند.
4. laneهای سنگین‌تر platform و runtime بعد از آن گسترش پیدا می‌کنند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` انجام می‌شود، jobهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید مگر اینکه جدیدترین run برای همان ref نیز fail شده باشد. checkهای aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما پس از آنکه کل workflow قبلاً superseded شده است در queue قرار نگیرند. کلید concurrency خودکار CI versioned است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند runهای جدیدتر main را برای مدت نامحدود block کند. runهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای درحال‌اجرا را cancel نمی‌کنند.

job به نام `ci-timings-summary` برای هر run غیردraft CI یک artifact فشرده `ci-timings-summary` upload می‌کند. این artifact زمان wall، زمان queue، کندترین jobها، و jobهای failed مربوط به run فعلی را ثبت می‌کند، تا health checkهای CI لازم نباشد کل payload مربوط به Actions را مکرراً scrape کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI را به‌همراه lint کردن workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source همان platform محدود می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های fixture ارزان منتخب برای core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از یک مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task تکی `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper محدود باشد که task سریع مستقیماً exercise می‌کند، آن مسیر artifactهای build، سازگاری Node 22، contractهای channel، shardهای کامل core، shardهای bundled-plugin، و ماتریس‌های guard اضافی را رد می‌کند.
- **checkهای Windows Node** به wrapperهای مخصوص Windows برای process/path، helperهای runner مربوط به npm/pnpm/UI، config مدیر package، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند محدود شده‌اند؛ تغییرات نامرتبط source، plugin، install-smoke، و فقط-test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های test مربوط به Node split یا balance شده‌اند تا هر job بدون رزرو بیش‌ازحد runner کوچک بماند: contractهای channel به‌صورت سه shard وزن‌دار با پشتیبانی Blacksmith و fallback runner استاندارد GitHub اجرا می‌شوند، laneهای core unit fast/support جداگانه اجرا می‌شوند، infra مربوط به core runtime بین shardهای state، process/config، cron، و shared تقسیم شده است، auto-reply به‌صورت workerهای balanced اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، بین laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. testهای گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin، از configهای اختصاصی Vitest خودشان استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard در CI ثبت می‌کنند، تا `.artifacts/vitest-shard-timings.json` بتواند یک config کامل را از یک shard فیلترشده تفکیک کند. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری runtime topology را از پوشش gateway watch جدا می‌کند؛ فهرست guardهای boundary روی چهار matrix shard stripe شده است، که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و timing هر check را چاپ می‌کنند. check پرهزینه drift مربوط به Codex happy-path prompt snapshot به‌عنوان job اضافی جداگانه فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد prompt snapshot منتظر نمی‌مانند و shardهای boundary balanced باقی می‌مانند، در حالی که prompt drift همچنان به PRی که باعث آن شده pinned است؛ همان flag تولید Vitest مربوط به prompt snapshot را داخل shard core support-boundary مربوط به artifact ساخته‌شده رد می‌کند. Gateway watch، testهای channel، و shard core support-boundary به‌صورت هم‌زمان داخل `build-artifacts` اجرا می‌شوند، بعد از آنکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane مربوط به unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job تکراری packaging برای APK debug در هر push مرتبط با Android جلوگیری می‌کند.

shard به نام `check-dependencies` دستور `pnpm deadcode:dependencies` (یک pass production Knip فقط برای dependencyها که به آخرین version Knip pinned شده است، با minimum release age مربوط به pnpm که برای install با `dlx` غیرفعال شده) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دومی یافته‌های production مربوط به فایل‌های استفاده‌نشده در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard مربوط به unused-file زمانی fail می‌شود که یک PR فایل استفاده‌نشده جدید و reviewنشده اضافه کند یا یک entry کهنه در allowlist باقی بگذارد، در حالی که سطح‌های intentional مربوط به pluginهای dynamic، generated، build، live-test، و package bridge را که Knip نمی‌تواند statically resolve کند حفظ می‌کند.

## forward کردن فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت target از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد untrusted مربوط به pull request را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token برای GitHub App می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane به نام `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این کار عمداً از forward کردن کل body مربوط به webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` همان `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای agent مربوط به ClawSweeper به hook در OpenClaw Gateway post می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper target مربوط به Discord را در prompt خود دریافت می‌کند و فقط وقتی event غافلگیرکننده، actionable، risky، یا از نظر عملیاتی useful باشد باید در `#clawsweeper` post کند. openهای routine، editها، bot churn، نویز duplicate webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

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
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `check-additional` shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitive enough that 8 vCPU cost more than they saved); install-smoke Docker builds (32-vCPU queue time cost more than it saved)                                                                                                                                                                                                                                                                                                          |
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

`Full Release Validation` is the manual umbrella workflow for "run everything before release." It accepts a branch, tag, or full commit SHA, dispatches the manual `CI` workflow with that target, dispatches `Plugin Prerelease` for release-only plugin/package/static/Docker proof, and dispatches `OpenClaw Release Checks` for install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix, and Telegram lanes. Stable/default runs keep exhaustive live/E2E and Docker release-path coverage behind `run_release_soak=true`; `release_profile=full` forces that soak coverage on so broad advisory validation remains broad. With `rerun_group=all` and `release_profile=full`, it also runs `NPM Telegram Beta E2E` against the `release-package-under-test` artifact from release checks. After publishing, pass `npm_telegram_package_spec` to rerun the same Telegram package lane against the published npm package.

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

برای اثبات commit سنجاق‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای
`gh workflow run ... --ref main -f ref=<sha>` از راهنمای کمکی استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

ارجاع‌های dispatch گردش‌کار GitHub باید شاخه یا تگ باشند، نه SHA خام commit. این راهنمای کمکی یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از همان ارجاع سنجاق‌شده dispatch می‌کند، بررسی می‌کند که `headSha` هر گردش‌کار فرزند با هدف تطابق داشته باشد، و پس از کامل‌شدن اجرا شاخه موقت را حذف می‌کند. اعتبارسنج چتری همچنین اگر هر گردش‌کار فرزندی روی SHA متفاوتی اجرا شده باشد، شکست می‌خورد.

`release_profile` گستره live/provider را که به بررسی‌های انتشار داده می‌شود کنترل می‌کند. گردش‌کارهای انتشار دستی به‌صورت پیش‌فرض `stable` هستند؛ فقط وقتی از `full` استفاده کنید که عمداً ماتریس گسترده مشورتی provider/media را می‌خواهید. `run_release_soak` کنترل می‌کند که آیا بررسی‌های انتشار stable/default مسیر جامع live/E2E و Docker release-path soak را اجرا کنند یا نه؛ `full` اجرای soak را اجباری می‌کند.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند ضمیمه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job اعتبارسنج والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک مسیر شکست‌خورده cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. مسیرهای QA release-check مشورتی هستند، بنابراین شکست‌های فقط QA هشدار می‌دهند اما اعتبارسنج release-check را مسدود نمی‌کنند.

`OpenClaw Release Checks` از ارجاع گردش‌کار مورداعتماد استفاده می‌کند تا ارجاع انتخاب‌شده را یک‌بار به یک tarball به‌نام `release-package-under-test` تبدیل کند، سپس همان artifact را به بررسی‌های cross-OS و Package Acceptance، به‌همراه گردش‌کار Docker مسیر انتشار live/E2E هنگام اجرای پوشش soak، می‌دهد. این کار byteهای بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را supersede می‌کنند. مانیتور والد هر گردش‌کار فرزندی را که قبلاً dispatch کرده است هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدید main پشت یک اجرای release-check دو ساعته قدیمی منتظر نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار و گروه‌های rerun متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای Live و E2E

فرزند live/E2E انتشار، پوشش گسترده native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریالی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- شاردهای جداشده audio/video رسانه و شاردهای music فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال rerun و عیب‌یابی شکست‌های کند provider در live را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای rerunهای دستی یک‌باره معتبر می‌مانند.

شاردهای native live media در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image از پیش `ffmpeg` و `ffprobe` را نصب دارد؛ jobهای media فقط پیش از setup وجود binaryها را بررسی می‌کنند. مجموعه‌های live پشتیبانی‌شده با Docker را روی runnerهای معمولی Blacksmith نگه دارید؛ jobهای container جای درستی برای اجرای آزمون‌های Docker تودرتو نیستند.

شاردهای model/backend زنده پشتیبانی‌شده با Docker از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. گردش‌کار انتشار live آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای Docker live model، Gateway شاردشده بر اساس provider، CLI backend، ACP bind، و Codex harness با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker در Gateway سقف‌های `timeout` صریح در سطح script پایین‌تر از timeout job گردش‌کار دارند تا یک container گیرکرده یا مسیر cleanup سریع شکست بخورد، به‌جای اینکه کل بودجه release-check را مصرف کند. اگر این شاردها target کامل source Docker را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده است و زمان واقعی را برای buildهای تکراری image هدر می‌دهد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل‌نصب OpenClaw به‌عنوان محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت source را اعتبارسنجی می‌کند، در حالی‌که پذیرش بسته یک tarball واحد را از طریق همان Docker E2E harness که کاربران پس از نصب یا به‌روزرسانی استفاده می‌کنند اعتبارسنجی می‌کند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact `package-under-test` upload می‌کند، و source، ارجاع گردش‌کار، ارجاع بسته، نسخه، SHA-256، و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار reusable آن artifact را download می‌کند، inventory tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با package-digest را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، روی همان بسته اجرا می‌کند. وقتی یک profile چندین `docker_lanes` هدفمند را انتخاب کند، گردش‌کار reusable بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر Package Acceptance یک مورد را resolve کرده باشد، همان artifact `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک مشخصه منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را شکست می‌دهد.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل commit در `package_ref` مورداعتماد را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه شاخه repository یا یک تگ انتشار قابل‌دسترسی باشد، وابستگی‌ها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS download می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما باید برای artifactهای مشترک‌شده بیرونی ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورداعتماد گردش‌کار/harness است که آزمون را اجرا می‌کند. `package_ref` همان source commit است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد test harness فعلی، source commitهای مورداعتماد قدیمی‌تر را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### Profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌همراه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — قطعه‌های کامل Docker release-path با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

Profile `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دردسترس‌بودن live ClawHub وابسته نباشد. مسیر اختیاری Telegram از artifact `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر مشخصه npm منتشرشده برای dispatchهای مستقل نگه داشته می‌شود.

برای سیاست اختصاصی آزمون به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
مسیرهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و triage شکست،
[آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، Package Acceptance را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، به‌روزرسانی، پاکسازی وابستگی stale-plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball بسته resolve‌شده نگه می‌دارد. برای اجرای همان ماتریس روی یک بسته npm منتشرشده به‌جای artifact ساخته‌شده از SHA، مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار platform مخصوص OS را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید از Package Acceptance شروع شود. مسیر Docker `published-upgrade-survivor` در مسیر مسدودکننده انتشار، در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolve‌شده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که به‌صورت پیش‌فرض `openclaw@latest` است؛ فرمان‌های rerun مسیر شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا روی چهار انتشار پایدار جدید npm به‌علاوه انتشارهای مرزی سنجاق‌شده برای سازگاری Plugin و fixtureهای مسئله‌محور برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin legacy stale گسترش یابد. انتخاب‌های published-upgrade survivor چند-baseline بر اساس baseline به jobهای جداگانه runner Docker هدفمند شارد می‌شوند. گردش‌کار جداگانه `Update Migration` از مسیر Docker `update-migration` با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، زمانی که پرسش پاکسازی جامع به‌روزرسانی منتشرشده است، نه گستره CI معمول Full Release. اجراهای aggregate محلی می‌توانند مشخصه‌های دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` بدهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای ماتریس سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. مسیر منتشرشده baseline را با یک دستورالعمل baked `openclaw config set` پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، مسیرهای `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. مسیرهای Windows packaged و installer fresh همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام مطلق Windows import کند. آزمون smoke نوبت عامل OpenAI در cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌صورت پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 بماند و از پیش‌فرض‌های GPT-4.x جلوگیری شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌هایی که پیش‌تر منتشر شده‌اند، پنجره‌های محدود سازگاری با نسخه‌های قدیمی دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرحالت پایداری `gateway install --wrapper` را وقتی بسته آن flag را ارائه نمی‌کند نادیده بگیرد؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گمشده را از fixture جعلی git مشتق‌شده از tarball هرس کند و ممکن است `update.channel` پایدارشده گمشده را log کند؛
- دودسنجی‌های plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود پایداری install-record مربوط به marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فراداده پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار بدون نصب دوباره بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` همچنین ممکن است برای فایل‌های stamp فراداده ساخت محلی که پیش‌تر ارسال شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا نادیده‌گرفتن، شکست می‌خورند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifacts مربوط به Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی‌های phase و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، اجرای دوباره پروفایل بسته ناموفق یا laneهای دقیق Docker را ترجیح دهید.

## دودسنجی نصب

workflow جداگانه `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این workflow پوشش دودسنجی را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطوح Docker/package، تغییرات بسته/manifest مربوط به pluginهای همراه، یا سطوح هسته‌ای plugin/channel/gateway/Plugin SDK را لمس می‌کنند که jobهای دودسنجی Docker آن‌ها را تمرین می‌کنند. تغییرات فقط منبع در pluginهای همراه، ویرایش‌های فقط test و ویرایش‌های فقط docs کارگرهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، دودسنجی CLI مربوط به agents delete shared-workspace را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، یک build arg برای افزونه همراه را تأیید می‌کند و پروفایل Docker محدود مربوط به bundled-plugin را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای command اجرا می‌کند (Docker run هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** نصب بسته QR و پوشش Docker/update مربوط به installer را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call و pull requestهایی نگه می‌دارد که واقعاً سطوح installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر دودسنجی GHCR از Dockerfile ریشه برای target-SHA آماده می‌کند یا دوباره استفاده می‌کند، سپس نصب بسته QR، دودسنجی‌های Dockerfile/gateway ریشه، دودسنجی‌های installer/update و Docker E2E سریع مربوط به bundled-plugin را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار installer پشت دودسنجی‌های تصویر ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق changed-scope در یک push پوشش کامل را درخواست کند، workflow دودسنجی سریع Docker را نگه می‌دارد و دودسنجی نصب کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دودسنجی کند image-provider برای نصب سراسری Bun جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این مورد در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. testهای Docker مربوط به QR و installer، Dockerfileهای install-focused خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner ساده Node/Git برای laneهای installer/update/plugin-dependency؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکردی عادی در `/app` نصب می‌کند.

تعریف‌های lane مربوط به Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler تصویر را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل‌تنظیم‌ها

| متغیر                                 | پیش‌فرض | هدف                                                                                          |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای pool اصلی برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع laneها برای جلوگیری از طوفان create در Docker daemon؛ برای نبود stagger مقدار `0` را تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با کاما؛ دودسنجی cleanup را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر باشد همچنان می‌تواند از pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflightهای تجمیعی محلی Docker را بررسی می‌کنند، کانتینرهای قدیمی OpenClaw E2E را حذف می‌کنند، وضعیت active-lane را منتشر می‌کنند، زمان‌بندی‌های lane را برای ترتیب‌دهی longest-first پایدار می‌کنند، و به‌صورت پیش‌فرض پس از نخستین شکست، زمان‌بندی laneهای pooled جدید را متوقف می‌کنند.

### workflow زنده/E2E قابل‌استفاده‌مجدد

workflow زنده/E2E قابل‌استفاده‌مجدد از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع تصویر، تصویر live، lane و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact بسته مربوط به اجرای فعلی را دانلود می‌کند، یا artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای دارای بسته نصب‌شده نیاز دارد، تصاویر bare/functional مربوط به GHCR Docker E2E با tag مبتنی بر digest بسته را از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، از ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصاویر موجود مبتنی بر digest بسته دوباره استفاده می‌کند. pullهای تصویر Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا stream گیرکرده registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI سریعاً دوباره تلاش شود.

### بخش‌های مسیر انتشار

پوشش Docker انتشار، jobهای کوچک‌تر و chunk شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را که لازم دارد pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services` و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` به‌عنوان aliasهای تجمیعی plugin/runtime باقی می‌مانند. alias lane به نام `install-e2e` به‌عنوان alias تجمیعی اجرای دوباره دستی برای هر دو lane installer مربوط به provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط OpenWebUI نگه می‌دارد. laneهای update مربوط به bundled-channel برای شکست‌های گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را با logهای lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON مربوط به plan scheduler، جدول‌های slow-lane و فرمان‌های اجرای دوباره برای هر lane upload می‌کند. ورودی `docker_lanes` مربوط به workflow، به‌جای jobهای chunk، laneهای انتخاب‌شده را در برابر تصاویر آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک lane live Docker باشد، job هدفمند تصویر live-test را برای آن اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های اجرای دوباره GitHub تولیدشده برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name` و ورودی‌های تصویر آماده‌شده هستند، بنابراین یک lane ناموفق می‌تواند همان بسته و تصاویر دقیق اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زنده/E2E زمان‌بندی‌شده، مجموعه کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این workflow testهای plugin همراه را بین هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه تا دو گروه پیکربندی plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای plugin با import سنگین، jobهای اضافی CI ایجاد نکنند. مسیر prerelease مربوط به Docker که فقط برای انتشار است، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند.

## آزمایشگاه QA

آزمایشگاه QA دارای laneهای اختصاصی CI خارج از workflow اصلی smart-scoped است. هم‌ارزی agentic زیر harnessهای گسترده QA و انتشار تو در تو قرار دارد، نه یک workflow مستقل PR. وقتی parity باید همراه با یک اجرای اعتبارسنجی گسترده باشد، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این workflow، lane mock parity، lane live Matrix و laneهای live Telegram و Discord را به‌عنوان jobهای موازی گسترش می‌دهد. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، مسیرهای انتقال زنده Matrix و Telegram را با ارائه‌دهنده ساختگی قطعی و مدل‌های واجد شرایط ساختگی (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تاخیر مدل زنده و راه‌اندازی معمول provider-plugin جدا بماند. Gateway انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کند چون برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال‌پذیری ارائه‌دهنده توسط مجموعه‌های جداگانه مدل زنده، ارائه‌دهنده بومی، و ارائه‌دهنده Docker پوشش داده می‌شود.

Matrix برای گیت‌های زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و `--fail-fast` را فقط وقتی اضافه می‌کند که CLI بررسی‌شده از آن پشتیبانی کند. مقدار پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` است؛ ارسال دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` شارد می‌کند.

`OpenClaw Release Checks` همچنین پیش از تایید انتشار، مسیرهای حیاتی انتشار QA Lab را اجرا می‌کند؛ گیت برابری QA آن بسته‌های نامزد و مبنا را به‌صورت jobهای مسیر موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک دانلود می‌کند تا مقایسه نهایی برابری انجام شود.

برای PRهای معمولی، به‌جای تلقی برابری به‌عنوان وضعیت الزامی، از شواهد CI/بررسی محدوده‌مند پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمدا یک اسکنر امنیتی باریکِ گذر اول است، نه جاروب کامل مخزن. اجراهای نگهبان روزانه، دستی، و pull requestهای غیر draft، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با پرس‌وجوهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

نگهبان pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود و همان ماتریس امنیتی با اطمینان بالا را مانند گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS در پیش‌فرض‌های PR قرار نمی‌گیرد.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، سندباکس، Cron، و خط مبنای Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌علاوه زمان‌اجرای Plugin کانال، Gateway، Plugin SDK، اسرار، نقاط تماس ممیزی                    |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF هسته، پردازش IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و گیت‌های اجرای ابزار agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و قرارداد بسته Plugin SDK                |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که توسط workflow sanity پذیرفته می‌شود می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد هفتگی/دستی امنیت macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج build وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده چون build macOS حتی وقتی پاک است بر زمان اجرا غالب می‌شود.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. این شارد فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح باریک و باارزش، روی runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. نگهبان pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیر draft فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای دستور/مدل/ابزار agent و ارسال پاسخ، کد schema/مهاجرت/IO پیکربندی، کد احراز هویت/اسرار/سندباکس/امنیت، کانال هسته و زمان‌اجرای Plugin کانال bundled، روش Gateway protocol/server، چسب حافظه runtime/SDK، تحویل MCP/process/outbound، کاتالوگ ارائه‌دهنده runtime/model، صف‌های تشخیص/تحویل نشست، loader مربوط به plugin، قرارداد Plugin SDK/package-contract، یا زمان‌اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

ارسال دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت ایزوله هستند.

| دسته                                                   | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | احراز هویت، اسرار، سندباکس، Cron، و کد مرز امنیتی Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | schema پیکربندی، مهاجرت، نرمال‌سازی، و قراردادهای IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای Gateway protocol و قراردادهای روش سرور                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال bundled                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای دستور، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های auto-reply، و قراردادهای runtime صفحه کنترل ACP                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورها و پل‌های ابزار MCP، کمک‌کننده‌های نظارت فرایند، و قراردادهای تحویل خروجی                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای زمان‌اجرای حافظه، نام‌های مستعار Plugin SDK حافظه، چسب فعال‌سازی زمان‌اجرای حافظه، و دستورهای doctor حافظه                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطوح بسته رویداد/گزارش تشخیصی، و قراردادهای CLI مربوط به doctor نشست          |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان‌اجرای ارائه‌دهنده، defaults/catalogs ارائه‌دهنده، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، پایداری محلی، جریان‌های کنترل Gateway، و قراردادهای runtime صفحه کنترل وظیفه                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | fetch/search وب هسته، IO رسانه، درک رسانه، تولید تصویر، و قراردادهای runtime تولید رسانه                                                                       |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypoint مربوط به Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | کد منبع Plugin SDK در سمت بسته منتشرشده و کمک‌کننده‌های قرارداد بسته plugin                                                                                    |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و pluginهای bundled فقط باید پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های باریک، به‌عنوان کار پیگیری محدوده‌مند یا شاردشده دوباره اضافه شود.

## گردش‌کارهای نگه‌داری

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگه‌داری Codex مبتنی بر رویداد برای همسو نگه داشتن مستندات موجود با تغییرات تازه land شده است. هیچ زمان‌بندی خالصی ندارد: یک اجرای CI push موفق غیر bot روی `main` می‌تواند آن را trigger کند، و ارسال دستی می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی یک اجرای غیر skipped دیگر Docs Agent در ساعت گذشته ایجاد شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع Docs Agent غیر skipped قبلی تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگه‌داری Codex مبتنی بر رویداد برای تست‌های کند است. هیچ زمان‌بندی خالصی ندارد: یک اجرای CI push موفق غیر bot روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده یا در حال اجرا باشد، skip می‌شود. ارسال دستی از آن گیت فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده از مجموعه کامل می‌سازد، به Codex اجازه می‌دهد به‌جای refactorهای گسترده فقط اصلاحات کوچک عملکرد تست با حفظ پوشش انجام دهد، سپس گزارش مجموعه کامل را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های پاس‌شده خط مبنا را کاهش دهند رد می‌کند. اگر خط مبنا تست‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های آشکار را اصلاح کند و گزارش مجموعه کامل پس از agent باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از land شدن push بات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict، skip می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo را مانند docs agent حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگه‌دارنده برای پاک‌سازی تکراری‌های پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای فهرست‌شده صریح را می‌بندد. پیش از تغییر GitHub، تایید می‌کند که PR land شده merge شده و هر تکراری یا یک issue ارجاع‌شده مشترک دارد یا hunkهای تغییر‌یافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق مسیر changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از محدوده گسترده پلتفرم CI است:

- تغییرات تولیدی هسته، typecheck تولید هسته و typecheck تست هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط‌تست هسته، فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات تولیدی extension، typecheck تولید extension و typecheck تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات فقط‌تست extension، typecheck تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck مربوط به extension گسترش پیدا می‌کنند، چون extensionها به آن قراردادهای هسته وابسته‌اند (جاروب‌های extension در Vitest همچنان کار تست صریح باقی می‌مانند)؛
- افزایش‌های نسخه که فقط metadata انتشار هستند، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته در ریشه/پیکربندی، برای اطمینان به همه laneهای بررسی fail safe می‌شوند.

مسیریابی محلی تست‌های تغییرکرده در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های هم‌سطح و وابستگان گراف import را. پیکربندی تحویل اتاق‌گروهی مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده برای گروه، حالت تحویل پاسخ منبع، یا مسیر prompt سیستمی ابزار پیام، از طریق تست‌های پاسخ هسته به‌همراه رگرسیون‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین pushِ PR شکست بخورد. فقط زمانی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر آن‌قدر در سطح harness گسترده باشد که مجموعه نگاشت‌شده ارزان، proxy قابل‌اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشه repo اجرا کنید و برای اثبات گسترده، یک box گرم‌شده تازه را ترجیح دهید. پیش از صرف کردن یک gate کند روی boxای که دوباره استفاده شده، منقضی شده، یا به‌تازگی sync غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل box اجرا کنید.

بررسی sanity وقتی فایل‌های ضروری ریشه مثل `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف tracked نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت sync راه دور کپی قابل‌اعتمادی از PR نیست؛ به‌جای اشکال‌زدایی شکست تست محصول، آن box را متوقف کنید و یک box تازه گرم کنید. برای PRهای عمدی با حذف‌های بزرگ، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در فاز sync باقی بماند، خاتمه می‌دهد. برای غیرفعال کردن آن guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرعادی بزرگ، مقدار میلی‌ثانیه‌ای بزرگ‌تری به‌کار ببرید.

Crabbox پوشش remote-box متعلق به repo برای اثبات Linux نگه‌دارنده است. وقتی یک بررسی برای چرخه ویرایش محلی بیش از حد گسترده است، وقتی همترازی با CI مهم است، یا وقتی اثبات به secretها، Docker، laneهای package، boxهای قابل‌استفاده مجدد، یا logهای راه دور نیاز دارد، از آن استفاده کنید. backend معمول OpenClaw مقدار `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner متعلق به پروژه، fallback برای قطعی‌های Blacksmith، مشکلات quota، یا تست صریح ظرفیت متعلق به پروژه است.

پیش از اجرای اول، wrapper را از ریشه repo بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper repo، binary کهنه Crabbox را که `blacksmith-testbox` را advertise نمی‌کند رد می‌کند. provider را صریح پاس بدهید، حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد.

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

خلاصه نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs`، و `totalMs` هستند. اجراهای یک‌باره Crabbox مبتنی بر Blacksmith باید Testbox را خودکار متوقف کنند؛ اگر اجرا قطع شد یا پاک‌سازی روشن نبود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی از reuse استفاده کنید که عمدا به چند فرمان روی همان box آماده‌شده نیاز دارید:

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

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه با وضعیت `queued` بدون IP یا URL اجرای Actions باقی می‌مانند، آن را فشار provider، queue، billing، یا محدودیت org در Blacksmith در نظر بگیرید. idهای queuedای را که ساخته‌اید متوقف کنید، Testboxهای بیشتری شروع نکنید، و درحالی‌که کسی داشبورد Blacksmith، billing، و محدودیت‌های org را بررسی می‌کند، اثبات را به مسیر ظرفیت Crabbox متعلق به پروژه در پایین منتقل کنید.

فقط وقتی به ظرفیت Crabbox متعلق به پروژه escalate کنید که Blacksmith down باشد، quota-limited باشد، محیط لازم را نداشته باشد، یا ظرفیت متعلق به پروژه صراحتا هدف باشد:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` اجتناب کنید مگر اینکه task واقعا به CPU در کلاس 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با quota منطقه‌ای EC2 Spot یا On-Demand Standard است. پیش‌فرض‌های `.crabbox.yaml` متعلق به repo روی `standard`، چندین منطقه ظرفیت، و `capacity.hints: true` قرار دارند تا leaseهای brokered AWS منطقه/market انتخاب‌شده، فشار quota، fallback به Spot، و هشدارهای class پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط پس از اینکه standard/fast کافی نبودند از `large` استفاده کنید، و `beast` را فقط برای laneهای استثنایی CPU-bound مثل full-suite یا matrixهای Docker همه Pluginها، اعتبارسنجی صریح release/blocker، یا profiling کارایی high-core به‌کار ببرید. از `beast` برای `pnpm check:changed`، تست‌های متمرکز، کارهای فقط‌docs، lint/typecheck معمولی، بازتولیدهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا آشفتگی بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` پیش‌فرض‌های provider، sync، و hydration در GitHub Actions را برای laneهای owned-cloud در اختیار دارد. این فایل `.git` محلی را exclude می‌کند تا checkout آماده‌شده Actions به‌جای sync کردن remoteها و object storeهای محلی نگه‌دارنده، metadata راه دور Git خودش را نگه دارد، و artifactهای محلی runtime/build را که هرگز نباید منتقل شوند exclude می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و تحویل محیط غیرsecret برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [مرور نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
