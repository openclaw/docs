---
read_when:
    - باید بفهمید چرا یک کار یکپارچه‌سازی مداوم اجرا شد یا نشد
    - در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای CI، گیت‌های دامنه، چترهای انتشار و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-02T20:41:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند و کل graph را برای نامزدهای انتشار و اعتبارسنجی گسترده منشعب می‌کنند. laneهای Android از طریق `include_android` اختیاری باقی می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا dispatch دستی صریح اجرا می‌شود.

## نمای کلی Pipeline

| کار                              | هدف                                                                                                   | زمان اجرا                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و ممیزی workflow از طریق `zizmor`                                                     | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | ممیزی lockfile تولید، بدون وابستگی، در برابر advisoryهای npm                                          | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | aggregate الزامی برای کارهای امنیتی سریع                                                             | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | گذر فقط وابستگی production Knip به‌علاوه guard فهرست مجاز فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای downstream قابل استفاده مجدد                       | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای سریع صحت‌سنجی Linux مانند بررسی‌های bundled/plugin-contract/protocol                              | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های contract کانال به‌صورت shardشده با نتیجه aggregate پایدار                                      | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی shardشده: types تولید، lint، guardها، types تست، و smoke سختگیرانه                | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای architecture، boundary، guardهای extension-surface، package-boundary، و gateway-watch              | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke مربوط به CLI ساخته‌شده و smoke حافظه startup                                                            | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel مربوط به artifact ساخته‌شده                                                                 | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی‌های لینک خراب                                                             | مستندات تغییر کرده‌اند                       |
| `skills-python`                  | Ruff + pytest برای skillهای پشتیبانی‌شده با Python                                                                    | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های process/path مخصوص Windows به‌علاوه regressionهای shared runtime import specifier                      | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript روی macOS با استفاده از artifactهای ساخته‌شده shared                                               | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای app مربوط به macOS                                                            | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌علاوه یک ساخت debug APK                                              | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI اصلی یا dispatch دستی |
| `openclaw-performance`           | گزارش‌های روزانه/درخواستی عملکرد runtime Kova با mock-provider، deep-profile، و laneهای زنده GPT 5.4 | زمان‌بندی‌شده و dispatch دستی      |

## ترتیب Fail-fast

1. `preflight` تصمیم می‌گیرد اساسا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهای داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده‌شدن build مشترک شروع شوند.
4. پس از آن laneهای سنگین‌تر پلتفرم و runtime منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود، کارهای superseded را با وضعیت `cancelled` علامت بزند. این را نویز CI تلقی کنید، مگر اینکه جدیدترین اجرا برای همان ref نیز در حال fail باشد. بررسی‌های shard aggregate از `!cancelled() && always()` استفاده می‌کنند تا همچنان failهای عادی shard را گزارش کنند اما پس از superseded شدن کل workflow دیگر در صف قرار نگیرند. کلید concurrency خودکار CI versioned است (`CI-v7-*`) تا zombie سمت GitHub در یک queue group قدیمی نتواند اجراهای جدیدتر main را به‌طور نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر area دارای scope تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI به‌علاوه workflow linting را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجباری نمی‌کنند؛ آن laneهای پلتفرم scoped به تغییرات سورس پلتفرم باقی می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های انتخاب‌شده fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing مربوط به plugin contract** از مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، این مسیر build artifactها، سازگاری Node 22، channel contractها، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config مربوط به package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط سورس، Plugin، install-smoke، و فقط تست روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balanced شده‌اند تا هر کار بدون over-reserve کردن runnerها کوچک بماند: channel contractها به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای کوچک unit core جفت می‌شوند، auto-reply به‌صورت چهار worker متعادل اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic gateway/plugin به‌جای انتظار برای artifactهای ساخته‌شده، در jobهای agentic Node فقط source موجود پخش می‌شوند. تست‌های گسترده browser، QA، media، و Plugin متفرقه به‌جای catch-all مشترک Plugin، از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و architecture توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ shard مربوط به boundary guard، guardهای مستقل کوچک خود را هم‌زمان داخل یک job اجرا می‌کند. Gateway watch، تست‌های channel، و shard مربوط به support-boundary core بعد از اینکه `dist/` و `dist-runtime/` ساخته شدند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK مربوط به Play debug را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane تست unit آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job تکراری packaging مربوط به debug APK در هر push مرتبط با Android پرهیز می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک pass فقط وابستگی production Knip که به آخرین نسخه Knip pin شده، با حداقل سن انتشار pnpm برای نصب `dlx` غیرفعال) و `pnpm deadcode:unused-files` را اجرا می‌کند که یافته‌های فایل استفاده‌نشده production Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده اضافه کند یا یک ورودی stale در allowlist باقی بگذارد fail می‌شود، در حالی که سطح‌های intentional dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## ارسال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` bridge سمت مقصد از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request غیرقابل اعتماد را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک GitHub App token می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review مربوط به issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در کامنت‌های issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است inspect کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این کار عمدا از forward کردن body کامل Webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper`، `.github/workflows/github-activity.yml` است که event نرمال‌شده را برای agent مربوط به ClawSweeper به hook مربوط به OpenClaw Gateway ارسال می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط وقتی event غافلگیرکننده، actionable، پرریسک، یا از نظر عملیاتی مفید است باید در `#clawsweeper` پست کند. openها، editها، bot churn، نویز تکراری Webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit مربوط به GitHub را داده غیرقابل اعتماد تلقی کنید. آن‌ها ورودی برای خلاصه‌سازی و triage هستند، نه دستورالعمل برای workflow یا runtime agent.

## Dispatchهای دستی

Manual CI dispatches run the same job graph as normal CI but force every non-Android scoped lane on: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, and Control UI i18n. Standalone manual CI dispatches run Android only with `include_android=true`; the full release umbrella enables Android by passing `include_android=true`. Plugin prerelease static checks, the release-only `agentic-plugins` shard, the full extension batch sweep, and plugin prerelease Docker lanes are excluded from CI. The Docker prerelease suite runs only when `Full Release Validation` dispatches the separate `Plugin Prerelease` workflow with the release-validation gate enabled.

Manual runs use a unique concurrency group so a release-candidate full suite is not cancelled by another push or PR run on the same ref. The optional `target_ref` input lets a trusted caller run that graph against a branch, tag, or full commit SHA while using the workflow file from the selected dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, fast security jobs and aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), fast protocol/contract/bundled checks, sharded channel contract checks, `check` shards except lint, `check-additional` shards and aggregates, Node test aggregate verifiers, docs checks, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight also uses GitHub-hosted Ubuntu so the Blacksmith matrix can queue earlier |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lower-weight extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, and `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitive enough that 8 vCPU cost more than they saved); install-smoke Docker builds (32-vCPU queue time cost more than it saved)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` on `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` on `openclaw/openclaw`; forks fall back to `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
```

The workflow installs OCM from a pinned release and Kova from the pinned `kova_ref` input, then runs three lanes:

- `mock-provider`: Kova diagnostic scenarios against a local-build runtime with deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling for startup, gateway, and agent-turn hotspots.
- `live-gpt54`: a real OpenAI `openai/gpt-5.4` agent turn, skipped when `OPENAI_API_KEY` is unavailable.

The mock-provider lane also runs OpenClaw-native source probes after the Kova pass: gateway boot timing and memory across default, hook, and 50-plugin startup cases; repeated mock-OpenAI `channel-chat-baseline` hello loops; and CLI startup commands against the booted gateway. The source probe Markdown summary lives at `source/index.md` in the report bundle, with raw JSON beside it.

Every lane uploads GitHub artifacts. When `CLAWGRIT_REPORTS_TOKEN` is configured, the workflow also commits `report.json`, `report.md`, bundles, `index.md`, and source-probe artifacts into `openclaw/clawgrit-reports` under `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. The current branch pointer is written as `openclaw-performance/<ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is the manual umbrella workflow for "run everything before release." It accepts a branch, tag, or full commit SHA, dispatches the manual `CI` workflow with that target, dispatches `Plugin Prerelease` for release-only plugin/package/static/Docker proof, and dispatches `OpenClaw Release Checks` for install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix, and Telegram lanes. With `rerun_group=all` and `release_profile=full`, it also runs `NPM Telegram Beta E2E` against the `release-package-under-test` artifact from release checks. After publishing, pass `npm_telegram_package_spec` to rerun the same Telegram package lane against the published npm package.

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

For pinned commit proof on a fast-moving branch, use the helper instead of
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs must be branches or tags, not raw commit SHAs. The
helper pushes a temporary `release-ci/<sha>-...` branch at the target SHA,
dispatches `Full Release Validation` from that pinned ref, verifies every child
workflow `headSha` matches the target, and deletes the temporary branch when the
run completes. The umbrella verifier also fails if any child workflow ran at a
different SHA.

`release_profile` controls live/provider breadth passed into release checks. The
manual release workflows default to `stable`; use `full` only when you
intentionally want the broad advisory provider/media matrix.

- `minimum` keeps the fastest OpenAI/core release-critical lanes.
- `stable` adds the stable provider/backend set.
- `full` runs the broad advisory provider/media matrix.

The umbrella records the dispatched child run ids, and the final `Verify full validation` job re-checks current child run conclusions and appends slowest-job tables for each child run. If a child workflow is rerun and turns green, rerun only the parent verifier job to refresh the umbrella result and timing summary.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. از `all` برای نامزد انتشار، از `ci` فقط برای فرزند CI کامل عادی، از `plugin-prerelease` فقط برای فرزند پیش‌انتشار Plugin، از `release-checks` برای هر فرزند انتشار، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر اصلی. این کار بازاجرای یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref جریان کاری مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` تبدیل کند، سپس آن artifact را هم به جریان کاری Docker مسیر انتشار زنده/E2E و هم به شارد پذیرش بسته می‌فرستد. این کار بایت‌های بسته را در جعبه‌های انتشار سازگار نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چند job فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را supersede می‌کنند. مانیتور والد هر جریان کاری فرزندی را که
قبلا dispatch کرده باشد هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main
پشت یک اجرای کهنه دو ساعته release-check منتظر نمی‌ماند. اعتبارسنجی شاخه/تگ
انتشار و گروه‌های بازاجرای متمرکز مقدار `cancel-in-progress: false` را حفظ می‌کنند.

## شاردهای زنده و E2E

فرزند زنده/E2E انتشار پوشش گسترده بومی `pnpm test:live` را حفظ می‌کند، اما آن را به‌جای یک job ترتیبی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- شاردهای صوت/ویدیوی رسانه‌ای تقسیم‌شده و شاردهای موسیقی فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال بازاجرا و تشخیص خرابی‌های کند provider زنده را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای بازاجراهای دستی یک‌مرحله‌ای همچنان معتبر می‌مانند.

شاردهای رسانه زنده بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط جریان کاری `Live Media Runner Image` ساخته شده است. این image از قبل `ffmpeg` و `ffprobe` را نصب می‌کند؛ jobهای رسانه فقط پیش از راه‌اندازی باینری‌ها را بررسی می‌کنند. مجموعه‌های زنده مبتنی بر Docker را روی runnerهای عادی Blacksmith نگه دارید — jobهای container جای درستی برای اجرای تست‌های Docker تو در تو نیستند.

شاردهای مدل/backend زنده مبتنی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. جریان کاری انتشار زنده آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس provider، backend CLI، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Gateway Docker سقف‌های `timeout` صریح در سطح script دارند که پایین‌تر از timeout job جریان کاری است، تا یک container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع شکست بخورد. اگر آن شاردها target کامل Docker سورس را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده است و زمان دیواری را برای ساخت‌های تکراری image هدر می‌دهد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی متفاوت است: CI عادی درخت سورس را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### Jobها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` بارگذاری می‌کند، و source، workflow ref، package ref، نسخه، SHA-256، و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. جریان کاری reusable آن artifact را دانلود می‌کند، inventory مربوط به tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout جریان کاری، علیه همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، جریان کاری reusable بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نیست اجرا می‌شود و وقتی پذیرش بسته یک مورد را resolve کرده باشد همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، جریان کاری را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@alpha`، `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل commit مورد اعتماد در `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند که commit انتخاب‌شده از تاریخچه شاخه repository یا یک تگ انتشار قابل دسترسی باشد، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از طریق HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد جریان کاری/harness مورد اعتمادی است که تست را اجرا می‌کند. `package_ref` commit سورسی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این امکان را می‌دهد که harness تست فعلی commitهای سورس قدیمی‌تر و مورد اعتماد را بدون اجرای منطق جریان کاری قدیمی اعتبارسنجی کند.

### Profileهای مجموعه

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

Profile مربوط به `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دردسترس‌بودن زنده ClawHub وابسته نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند و مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل commandهای محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و triage خرابی،
به [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

Release checkها پذیرش بسته را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=all-since-2026.4.23`، `published_upgrade_survivor_scenarios=reported-issues`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، به‌روزرسانی، cleanup مربوط به dependency کهنه Plugin، repair نصب Plugin پیکربندی‌شده، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball بسته resolveشده نگه می‌دارد. برای اجرای همان matrix علیه یک بسته npm منتشرشده به‌جای artifact ساخته‌شده از SHA، مقدار `package_acceptance_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید. Release checkهای Cross-OS همچنان onboarding، installer، و رفتار platform خاص OS را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید از پذیرش بسته شروع شود. lane مربوط به Docker با نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ commandهای بازاجرای lane ناموفق آن baseline را حفظ می‌کنند. برای گسترش CI انتشار کامل در همه انتشارهای پایدار npm از `2026.4.23` تا `latest`، مقدار `published_upgrade_survivor_baselines=all-since-2026.4.23` را تنظیم کنید؛ `release-history` همچنان برای نمونه‌گیری گسترده‌تر دستی با anchor قدیمی‌تر قبل از تاریخ در دسترس است. برای گسترش همان baselineها در fixtureهای شبیه issue برای config مربوط به Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های dependency Plugin legacy کهنه، مقدار `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید. جریان کاری جداگانه `Update Migration` وقتی پرسش cleanup کامل به‌روزرسانی منتشرشده باشد، نه گستره عادی CI انتشار کامل، از lane مربوط به Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای matrix سناریو مقدار `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با یک recipe command آماده `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. laneهای fresh مربوط به بسته‌بندی و installer در Windows همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام مطلق Windows import کند. Smoke مربوط به agent-turn در Cross-OS برای OpenAI وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌صورت پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4` استفاده می‌کند، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 باقی بماند و هم‌زمان از پیش‌فرض‌های GPT-4.x دوری شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌هایی که قبلا منتشر شده‌اند پنجره‌های سازگاری legacy محدود دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- entryهای QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است وقتی بسته آن flag را expose نمی‌کند subcase پایداری `gateway install --wrapper` را skip کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گمشده را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persisted گمشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا نبود پایداری install-record در marketplace را بپذیرند؛
- `plugin-update` ممکن است migration metadata config را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که قبلا منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip باعث شکست می‌شوند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های مسیر، زمان‌بندی فازها، و فرمان‌های اجرای دوباره. اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا مسیرهای دقیق Docker را به اجرای دوباره‌ی اعتبارسنجی کامل انتشار ترجیح دهید.

## آزمون دود نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت محدوده را از طریق job اختصاصی `preflight` خودش بازاستفاده می‌کند. این پوشش دود را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/بسته، تغییرات بسته/manifest مربوط به Pluginهای همراه، یا سطح‌های هسته‌ی Plugin/کانال/Gateway/Plugin SDK را لمس می‌کنند که jobهای دود Docker آن‌ها را تمرین می‌دهند. تغییرات فقط‌منبع در Pluginهای همراه، ویرایش‌های فقط‌آزمون، و ویرایش‌های فقط‌مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image ریشه‌ی Dockerfile را یک‌بار می‌سازد، CLI را بررسی می‌کند، دود CLI حذف agentها در shared-workspace را اجرا می‌کند، e2e مربوط به gateway-network کانتینر را اجرا می‌کند، build arg مربوط به extension همراه را تأیید می‌کند، و پروفایل Docker محدودشده‌ی Plugin همراه را تحت یک مهلت زمانی تجمیعی 240 ثانیه‌ای برای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه سقف‌گذاری می‌شود).
- **مسیر کامل** نصب بسته‌ی QR و پوشش Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های نصب‌کننده/بسته/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image دود GHCR ریشه‌ی Dockerfile برای target-SHA را آماده یا بازاستفاده می‌کند، سپس نصب بسته‌ی QR، دودهای Dockerfile/Gateway ریشه، دودهای نصب‌کننده/update، و Docker E2E سریع Plugin همراه را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت دودهای image ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، گردش‌کار دود سریع Docker را نگه می‌دارد و دود نصب کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

دود image-provider نصب global کند Bun جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این دود در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را انتخاب کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های QR و Docker نصب‌کننده Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خالی Node/Git برای مسیرهای نصب‌کننده/update/plugin-dependency؛
- یک image عملکردی که همان tarball را برای مسیرهای عملکردی عادی در `/app` نصب می‌کند.

تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. زمان‌بند image را برای هر مسیر با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس مسیرها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                 | پیش‌فرض | هدف                                                                                           |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای مسیرهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف مسیرهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف مسیرهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف مسیرهای چندسرویسی هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع مسیرها برای جلوگیری از هجوم create در daemon Docker؛ برای بدون فاصله‌گذاری روی `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت fallback برای هر مسیر (120 دقیقه)؛ مسیرهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan زمان‌بند را بدون اجرای مسیرها چاپ می‌کند.                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست مسیرهای دقیق جداشده با ویرگول؛ دود cleanup را رد می‌کند تا agentها بتوانند یک مسیر ناموفق را بازتولید کنند. |

مسیری که از سقف مؤثر خودش سنگین‌تر است هنوز می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflight تجمیعی محلی Docker را بررسی می‌کند، کانتینرهای E2E مانده‌ی OpenClaw را حذف می‌کند، وضعیت مسیرهای فعال را منتشر می‌کند، زمان‌بندی مسیرها را برای ترتیب‌دهی longest-first پایدار می‌کند، و به‌صورت پیش‌فرض پس از اولین شکست زمان‌بندی مسیرهای pooled جدید را متوقف می‌کند.

### گردش‌کار live/E2E قابل‌بازاستفاده

گردش‌کار live/E2E قابل‌بازاستفاده از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع image، image زنده، مسیر، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا آرتیفکت بسته‌ی اجرای فعلی را دانلود می‌کند، یا آرتیفکت بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory مربوط به tarball را اعتبارسنجی می‌کند؛ وقتی plan به مسیرهای دارای بسته‌ی نصب‌شده نیاز دارد، imageهای Docker E2E خالی/عملکردی GHCR با tag مبتنی بر digest بسته را از طریق cache لایه‌ی Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، ورودی‌های ارائه‌شده‌ی `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود مبتنی بر digest بسته را بازاستفاده می‌کند. pullهای image Docker با مهلت زمانی محدود 180 ثانیه برای هر تلاش دوباره انجام می‌شوند تا stream گیرکرده‌ی registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع retry شود.

### قطعه‌های مسیر انتشار

پوشش Docker انتشار jobهای کوچک‌تر و قطعه‌شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر قطعه فقط نوع image مورد نیاز خودش را pull کند و چند مسیر را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

قطعه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` به‌عنوان aliasهای تجمیعی Plugin/runtime باقی می‌مانند. alias مسیر `install-e2e` به‌عنوان alias اجرای دوباره‌ی دستی تجمیعی برای هر دو مسیر نصب‌کننده‌ی provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI یک قطعه‌ی مستقل `openwebui` نگه می‌دارد. مسیرهای update کانال همراه برای خطاهای گذرای شبکه‌ی npm یک‌بار retry می‌کنند.

هر قطعه `.artifacts/docker-tests/` را همراه با لاگ‌های مسیر، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON plan زمان‌بند، جدول‌های مسیر کند، و فرمان‌های اجرای دوباره برای هر مسیر upload می‌کند. ورودی `docker_lanes` گردش‌کار مسیرهای انتخاب‌شده را در برابر imageهای آماده اجرا می‌کند، نه jobهای قطعه‌ای؛ این باعث می‌شود اشکال‌زدایی مسیر ناموفق به یک job هدفمند Docker محدود بماند و آرتیفکت بسته را برای همان اجرا آماده، دانلود، یا بازاستفاده کند؛ اگر یک مسیر انتخاب‌شده مسیر live Docker باشد، job هدفمند image زنده‌ی آزمون را برای آن اجرای دوباره به‌صورت محلی می‌سازد. فرمان‌های اجرای دوباره‌ی GitHub تولیدشده برای هر مسیر، وقتی آن مقدارها وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های image آماده هستند، تا یک مسیر ناموفق بتواند همان بسته و imageهای دقیق اجرای ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده‌ی live/E2E مجموعه‌ی کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته‌ی پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این گردش‌کار آزمون‌های Plugin همراه را بین هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension هم‌زمان تا دو گروه پیکربندی Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker مخصوص انتشار، مسیرهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند.

## آزمایشگاه QA

QA Lab مسیرهای CI اختصاصی خارج از گردش‌کار اصلی smart-scoped دارد. parity عامل‌محور زیر harnessهای گسترده‌ی QA و انتشار قرار دارد، نه یک گردش‌کار مستقل PR. وقتی parity باید همراه با یک اجرای اعتبارسنجی گسترده انجام شود، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ این گردش‌کار مسیر mock parity، مسیر live Matrix، و مسیرهای live Telegram و Discord را به‌عنوان jobهای موازی پخش می‌کند. jobهای live از environment `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار مسیرهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از latency مدل live و راه‌اندازی عادی provider-plugin جدا شود. Gateway مربوط به transport زنده جست‌وجوی memory را غیرفعال می‌کند زیرا QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه‌ی مدل live، provider native، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند، و `--fail-fast` را فقط وقتی اضافه می‌کند که CLI checkout‌شده از آن پشتیبانی کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` باقی می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین مسیرهای release-critical آزمایشگاه QA را پیش از تأیید انتشار اجرا می‌کند؛ gate مربوط به QA parity بسته‌های candidate و baseline را به‌عنوان jobهای مسیر موازی اجرا می‌کند، سپس هر دو آرتیفکت را در یک job گزارش کوچک دانلود می‌کند تا مقایسه‌ی parity نهایی انجام شود.

برای PRهای عادی، به‌جای برخورد با parity به‌عنوان یک status الزامی، از شواهد CI/check محدوده‌دار پیروی کنید.

## CodeQL

جریان کاری `CodeQL` عمدا یک اسکنر امنیتی محدود برای گذر نخست است، نه پیمایش کامل مخزن. اجراهای نگهبان روزانه، دستی، و pull requestهای غیرپیش‌نویس، کد جریان کاری Actions به‌علاوه پرخطرترین سطوح JavaScript/TypeScript را با کوئری‌های امنیتی با اطمینان بالا که بر اساس `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

نگهبان pull request سبک باقی می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را اجرا می‌کند که جریان کاری زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، cron، و خط مبنای gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه runtime پلاگین کانال، gateway، Plugin SDK، اسرار، نقاط تماس حسابرسی              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح SSRF هسته، تجزیه IP، نگهبان شبکه، web-fetch، و سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار عامل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و قرارداد package در Plugin SDK |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد امنیتی زمان‌بندی‌شده Android. برنامه Android را به‌صورت دستی برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که sanity جریان کاری می‌پذیرد build می‌کند. خروجی را زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامه macOS را به‌صورت دستی برای CodeQL روی Blacksmith macOS build می‌کند، نتایج build وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و خروجی را زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، چون build مربوط به macOS حتی وقتی پاک باشد بر runtime غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد متناظر غیرامنیتی است. فقط کوئری‌های کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح محدود و پرارزش در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. نگهبان pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و dispatch پاسخ، کد schema/migration/IO پیکربندی، کد احراز هویت/اسرار/sandbox/امنیت، runtime کانال هسته و پلاگین کانال بسته‌بندی‌شده، protocol/server-method مربوط به gateway، runtime حافظه/چسب SDK، MCP/process/outbound delivery، runtime ارائه‌دهنده/کاتالوگ مدل، تشخیص نشست/صف‌های تحویل، loader پلاگین، Plugin SDK/package-contract، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و جریان کاری کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی این موارد را می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، hookهای آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت ایزوله هستند.

| دسته                                                  | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، cron، و gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، migration، normalizer، و IO پیکربندی                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای protocol مربوط به gateway و قراردادهای server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و پلاگین کانال بسته‌بندی‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، dispatch مدل/ارائه‌دهنده، dispatch و صف‌های پاسخ خودکار، و قراردادهای runtime کنترل‌پلین ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، چسب فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطوح بسته رویداد/لاگ تشخیصی، و قراردادهای CLI مربوط به doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و discovery ارائه‌دهنده، ثبت runtime ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap واسط کنترل، ماندگاری محلی، جریان‌های کنترل gateway، و قراردادهای runtime کنترل‌پلین task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب هسته، IO رسانه، درک رسانه، image-generation، و media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypointهای Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت package منتشرشده و کمک‌کننده‌های قرارداد package پلاگین                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و پلاگین‌های بسته‌بندی‌شده باید فقط پس از پایدار شدن runtime و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## جریان‌های کاری نگهداری

### Docs Agent

جریان کاری `Docs Agent` یک مسیر نگهداری Codex مبتنی بر رویداد برای هم‌راستا نگه‌داشتن مستندات موجود با تغییراتی است که اخیرا land شده‌اند. هیچ زمان‌بندی خالصی ندارد: یک اجرای CI موفق push غیرربات روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی رد می‌شوند که `main` جلوتر رفته باشد یا وقتی در یک ساعت گذشته اجرای Docs Agent دیگری که skip نشده ایجاد شده باشد. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلی Docs Agent که skip نشده تا `main` فعلی بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

جریان کاری `Test Performance Agent` یک مسیر نگهداری Codex مبتنی بر رویداد برای تست‌های کند است. هیچ زمان‌بندی خالصی ندارد: یک اجرای CI موفق push غیرربات روی `main` می‌تواند آن را trigger کند، اما اگر یک فراخوانی workflow-run دیگر در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، رد می‌شود. dispatch دستی این دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک و حفظ‌کننده coverage برای عملکرد تست انجام دهد نه refactorهای گسترده، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های پاس‌شده خط مبنا را کاهش دهند رد می‌کند. اگر خط مبنا تست‌های ناموفق داشته باشد، Codex فقط می‌تواند خطاهای واضح را رفع کند و گزارش کل suite پس از عامل باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ patchهای قدیمی ناسازگار skip می‌شوند. این مسیر از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

جریان کاری `Duplicate PRs After Merge` یک جریان کاری دستی maintainer برای پاک‌سازی تکراری‌ها پس از land شدن است. به‌طور پیش‌فرض dry-run است و فقط زمانی PRهای صراحتا فهرست‌شده را می‌بندد که `apply=true` باشد. پیش از تغییر GitHub، بررسی می‌کند که PR land‌شده merge شده باشد و هر مورد تکراری یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییرکرده هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی درباره مرزهای معماری سخت‌گیرتر از دامنه گسترده پلتفرم CI است:

- تغییرات production هسته، typecheck مربوط به core prod و core test به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-تست هسته، فقط typecheck مربوط به core test به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات production افزونه، typecheck مربوط به extension prod و extension test به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط-تست افزونه، typecheck مربوط به extension test به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات public Plugin SDK یا plugin-contract به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (پیمایش‌های افزونه Vitest کار تست صریح باقی می‌مانند)؛
- افزایش‌های نسخه فقط-فراداده release، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی root را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای ایمنی به همه مسیرهای بررسی fail می‌شوند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph را. پیکربندی تحویل group-room مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ هسته به‌علاوه رگرسیون‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR fail شود. فقط زمانی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر به‌اندازه‌ای harness-wide باشد که مجموعه نگاشت‌شده ارزان، proxy قابل اعتمادی نباشد.

## اعتبارسنجی Testbox

Testbox را از ریشهٔ مخزن اجرا کنید و برای اعتبارسنجی گسترده، یک باکس گرم‌شدهٔ تازه را ترجیح دهید. پیش از صرف کردن یک گیت کند روی باکسی که دوباره استفاده شده، منقضی شده، یا همین حالا همگام‌سازی غیرمنتظره بزرگی را گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل باکس اجرا کنید.

بررسی سلامت وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` حداقل ۲۰۰ حذفِ ردیابی‌شده را نشان دهد، سریع شکست می‌خورد. این معمولاً یعنی وضعیت همگام‌سازی راه دور نسخهٔ قابل اعتمادی از درخواست Pull نیست؛ به‌جای اشکال‌زدایی شکست تست محصول، آن باکس را متوقف کنید و یک باکس تازه را گرم کنید. برای درخواست‌های Pull با حذف‌های بزرگِ عمدی، برای آن اجرای سلامت `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای تفاوت‌های محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

Crabbox مسیر دومِ باکس راه دورِ متعلق به مخزن برای اثبات روی Linux است، زمانی که Blacksmith در دسترس نیست یا وقتی ظرفیت ابریِ متعلق به پروژه ترجیح داده می‌شود. یک باکس را گرم کنید، آن را از طریق گردش‌کار پروژه هیدراته کنید، سپس دستورها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` مالک پیش‌فرض‌های ارائه‌دهنده، همگام‌سازی، و هیدراته‌سازی GitHub Actions است. این فایل `.git` محلی را مستثنا می‌کند تا checkout هیدراته‌شدهٔ Actions به‌جای همگام‌سازی remoteها و object storeهای محلیِ نگه‌دارنده، فرادادهٔ Git راه دور خودش را نگه دارد، و مصنوعات runtime/build محلی را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، دریافت `origin/main`، و تحویل محیط غیرمحرمانه‌ای است که دستورهای بعدی `crabbox run --id <cbx_id>` از آن source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)
