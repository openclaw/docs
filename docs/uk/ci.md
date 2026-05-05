---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, перевірки за областю охоплення, релізні парасолькові набори та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-05T01:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для кандидатів на реліз і широкої валідації. Android-лінії залишаються opt-in через `include_android`. Покриття Plugin лише для релізу розміщене в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                     | Коли запускається                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scopes, змінені extensions і формує CI manifest                      | Завжди для не-draft pushes і PRs          |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                      | Завжди для не-draft pushes і PRs          |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти npm advisories                                                  | Завжди для не-draft pushes і PRs          |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                                | Завжди для не-draft pushes і PRs          |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused-file                                       | Зміни, релевантні Node                    |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts                            | Зміни, релевантні Node                    |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                                   | Зміни, релевантні Node                    |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                                            | Зміни, релевантні Node                    |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                                        | Зміни, релевантні Node                    |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke                         | Зміни, релевантні Node                    |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch                 | Зміни, релевантні Node                    |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                    | Зміни, релевантні Node                    |
| `checks`                         | Verifier для built-artifact channel tests                                                                       | Зміни, релевантні Node                    |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                        | Manual CI dispatch для releases           |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                                         | Документацію змінено                      |
| `skills-python`                  | Ruff + pytest для skills на базі Python                                                                         | Зміни, релевантні Python-skill            |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions                            | Зміни, релевантні Windows                 |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                              | Зміни, релевантні macOS                   |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                                  | Зміни, релевантні macOS                   |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                                   | Зміни, релевантні Android                 |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                                               | Main CI success або manual dispatch       |
| `openclaw-performance`           | Щоденні/on-demand Kova runtime performance reports з mock-provider, deep-profile і GPT 5.4 live lanes           | Scheduled і manual dispatch               |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream consumers могли стартувати щойно shared build буде готовий.
4. Важчі platform і runtime lanes після цього розгалужуються: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як весь workflow уже був superseded. Автоматичний CI concurrency key версійований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і маршрутизація

Логіка scope розміщена в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не змушують запускатися Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, core unit fast/support lanes запускаються окремо, core runtime infra розділено між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділено між chat/auth/model/http-plugin/runtime/startup lanes замість очікування на built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено на чотири matrix shards, кожен із яких паралельно запускає вибрані independent guards і друкує per-check timings, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, з вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий неперевірений unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує untrusted pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для commit-level review requests на pushes у `main`;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може інспектувати.

Лінія `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони є. Вона навмисно не пересилає повне webhook body. Receiving workflow у `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна activity є спостереженням, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають давати результат `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як untrusted data в усьому цьому path. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайна CI, але примусово вмикають кожну не-Android lane з обмеженою областю: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна release-парасоля вмикає Android через передавання `include_android=true`. Статичні перевірки prerelease Plugin, release-only shard `agentic-plugins`, повний пакетний sweep extensions і Docker lanes prerelease Plugin виключені з CI. Набір Docker prerelease запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release validation.

Ручні запуски використовують унікальну групу concurrency, тому повний набір release candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded channel contract checks, shards `check`, окрім lint, shards і aggregates `check-additional`, aggregate verifiers для Node tests, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled Plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (настільки чутливий до CPU, що 8 vCPU коштували більше, ніж економили); install-smoke Docker builds (час очікування в черзі на 32-vCPU коштував більше, ніж економив)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

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

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності product/runtime. Він запускається щодня на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark workflow ref. Установіть `target_ref`, щоб benchmark release tag або іншу branch з поточною реалізацією workflow. Опубліковані report paths і latest pointers keyed за tested ref, а кожен `index.md` записує tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: diagnostic scenarios Kova проти local-build runtime з deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для hotspots startup, gateway і agent-turn.
- `live-gpt54`: справжній turn агента OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для default, hook і 50-plugin startup cases; repeated mock-OpenAI `channel-chat-baseline` hello loops; і CLI startup commands проти запущеного gateway. Markdown summary source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний pointer tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом." Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цією target, запускає `Plugin Prerelease` для release-only plugin/package/static/Docker proof і запускає `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs тримають exhaustive live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб широка advisory validation лишалася широкою. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того,
як OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable Plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для proof pinned commit на швидкозмінній branch використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper
pushes тимчасову branch `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасову branch, коли
run завершується. Umbrella verifier також fails, якщо будь-який child workflow ran на
іншому SHA.

`release_profile` керує широтою live/provider, що передається до перевірок релізу. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку advisory provider/media матрицю. `run_release_soak` керує тим, чи stable/default перевірки релізу запускають вичерпний live/E2E та Docker release-path soak; `full` примусово вмикає soak.

- `minimum` залишає найшвидші критичні для релізу OpenAI/core лінії.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media матрицю.

Umbrella записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат umbrella і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного повного CI child, `plugin-prerelease` лише для plugin prerelease child, `release-checks` для кожного release child або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на umbrella. Це утримує перезапуск невдалого release box обмеженим після сфокусованого виправлення. Для однієї невдалої cross-OS лінії поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки heartbeat, а підсумки packaged-upgrade містять часи для кожної фази. QA release-check лінії є advisory, тому QA-only збої попереджають, але не блокують release-check verifier.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв'язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт до cross-OS перевірок і Package Acceptance, а також до live/E2E release-path Docker workflow, коли запускається soak coverage. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all` замінюють старіший umbrella. Батьківський monitor скасовує будь-який дочірній workflow, який він уже запустив, коли батьківський workflow скасовано, тож новіша валідація main не стоїть за застарілим двогодинним release-check прогоном. Валідація release branch/tag і сфокусовані rerun groups зберігають `cancel-in-progress: false`.

## Live та E2E shards

Release live/E2E child зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media audio/video shards і provider-filtered music shards

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних live provider збоїв. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Native live media shards працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Залишайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є невідповідним місцем для запуску nested Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає і публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout`, нижчі за workflow job timeout, щоб завислий контейнер або шлях cleanup швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повну source Docker target, release run налаштований неправильно і марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв'язує один package candidate, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 та profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє tarball inventory, за потреби готує package-digest Docker images і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow один раз готує пакет і спільні образи, а потім розгалужує ці lanes у паралельні targeted Docker jobs з унікальними артефактами.
3. `package_telegram` за бажанням викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв'язав його; standalone Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або необов'язкова Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованого prerelease/stable.
- `source=ref` пакує trusted `package_ref` branch, tag або full commit SHA. Resolver завантажує OpenClaw branches/tags, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або release tag, встановлює deps у detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов'язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є необов'язковим, але його варто вказувати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це trusted workflow/harness code, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти старіші trusted source commits без запуску старої workflow logic.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов'язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб валідація published-package не залежала від live доступності ClawHub. Необов'язкова Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а published npm spec path збережено для standalone dispatches.

Щодо спеціальної політики тестування оновлень і plugins, включно з локальними командами, Docker lanes, inputs Package Acceptance, release defaults і triage збоїв, див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це утримує package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update і Telegram proof на тому самому розв'язаному package tarball. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти shipped npm package замість SHA-built artifact. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один published package baseline за прогін у blocking release path. У Package Acceptance розв'язаний tarball `package-under-test` завжди є candidate, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди перезапуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines=all-since-2026.4.23` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на всі stable npm releases від `2026.4.23` до `latest` і issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, налаштованих встановлень OpenClaw plugin, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному published update cleanup, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4`, тож install і gateway proof залишаються на GPT-5 test model, уникаючи GPT-4.x defaults.

### Вікна legacy compatibility

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли package не надає цей flag;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були shipped. Пізніші packages мають відповідати сучасним contracts; ті самі умови завершуються помилкою замість попередження або пропуску.

### Приклади

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

Під час налагодження невдалого запуску приймання пакета починайте із зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

## Інсталяційний smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення scope через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що зачіпають Docker/package поверхні, зміни пакета або маніфесту bundled Plugin, або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled Plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents для спільного workspace, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді зачіпають installer/package/Docker поверхні. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала за root image smokes.

Пуші в `main` (включно з merge commit) не примушують повний шлях; коли логіка changed-scope просила б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` - ні. QR і installer Docker tests зберігають власні Dockerfile, сфокусовані на інсталяції.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для lanes installer/update/plugin-dependency;
- функціональний образ, який інсталює той самий tarball у `/app` для lanes звичайної функціональності.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливих до provider.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lanes, щоб providers не throttling.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних lanes інсталяції npm.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути create storms демона Docker; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут на lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план scheduler без запуску lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальні сукупні preflights перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних lanes, зберігають таймінги lanes для впорядкування longest-first і за замовчуванням припиняють планування нових pooled lanes після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, який пакет, тип образу, live image, lane і покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує позначені package-digest bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли плану потрібні lanes з інстальованим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pull образів Docker повторюється з обмеженим таймаутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти релізного шляху

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI включено до `plugins-runtime-services`, коли повне release-path coverage цього вимагає, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Bundled-channel update lanes повторюють запуск один раз у разі тимчасових мережевих збоїв npm.

Кожен chunk завантажує `.artifacts/docker-tests/` з журналами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, scheduler plan JSON, таблицями slow-lane і командами повторного запуску для кожної lane. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове job збирає live-test image локально для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної lane включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала lane могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` - це дорожче product/package coverage, тому це окремий workflow, який dispatch виконує `Full Release Validation` або явний оператор. Звичайні pull request, пуші в `main` і автономні ручні CI dispatches не запускають цей suite. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy Plugin batches не створювали додаткові CI jobs. Релізний Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладено під широкі QA та release harnesses, а не в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб contract каналу було ізольовано від затримки live model і звичайного запуску provider-plugin. Live transport Gateway вимикає memory search, тому що QA parity покриває поведінку memory окремо; provider connectivity покривають окремі live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед approval релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального порівняння parity.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов'язковим status.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним переглядом репозиторію. Щоденні, ручні та захисні запуски для нечернеткових pull request сканують код робочих процесів Actions, а також поверхні JavaScript/TypeScript із найвищим ризиком за допомогою високодостовірних запитів безпеки, відфільтрованих до високої/критичної `security-severity`.

Захист pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високодостовірну матрицю безпеки, що й запланований робочий процес. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Автентифікація, секрети, sandbox, cron і базовий рівень gateway                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основних каналів плюс runtime channel plugin, gateway, Plugin SDK, секрети, точки дотику аудиту              |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF у Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, вихідна доставка та шлюзи виконання інструментів агентом                              |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, завантажувача, маніфесту, registry, встановлення package-manager, завантаження джерел і контракту пакетів Plugin SDK |

### Платформозалежні шарди безпеки

- `CodeQL Android Critical Security` — запланований шард безпеки Android. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою коректності робочого процесу. Завантажує результати під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний шард безпеки macOS. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантажуваного SARIF і завантажує результати під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними запусками, бо збірка macOS домінує за часом виконання навіть коли проходить чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний небезпечносторонній шард. Він запускає лише JavaScript/TypeScript-запити якості з рівнем помилки, не пов’язані з безпекою, на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агентом і диспетчеризації відповідей, схемі/міграції/IO конфігурації, коді автентифікації/секретів/sandbox/безпеки, runtime основного каналу та вбудованого channel plugin, протоколі Gateway/server-method, runtime пам’яті/SDK-зв’язці, MCP/process/вихідній доставці, runtime провайдера/каталозі моделей, діагностиці сесій/чергах доставки, завантажувачі Plugin, Plugin SDK/контракті пакетів або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і робочого процесу якості запускають усі дванадцять PR-шардів якості.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними хуками для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Автентифікація, секрети, sandbox, cron і код межі безпеки gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого channel plugin                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація автоматичних відповідей і черги, а також runtime-контракти контрольної площини ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, помічники нагляду за процесами й контракти вихідної доставки                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми пам’яті Plugin SDK, зв’язка активації runtime пам’яті та команди doctor пам’яті                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сесій, помічники прив’язки/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, payload відповідей/чанкінг/runtime-помічники, параметри відповіді каналу, черги доставки та помічники прив’язки сесій/потоків             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдера, реєстрація runtime провайдера, стандартні значення/каталоги провайдера та registry для web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Завантаження Control UI, локальна персистентність, потоки керування Gateway і runtime-контракти контрольної площини задач                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, registry, публічної поверхні та entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на стороні пакета та помічники контракту пакета plugin                                                                                      |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія супроводу Codex для підтримання наявної документації узгодженою з нещодавно доданими змінами. Він не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики від workflow-run пропускаються, коли `main` уже посунувся далі або коли інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний шлюз активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість прохідних тестів. Якщо в базовій лінії є тести, що падають, Codex може виправляти лише очевидні помилки, а звіт повного набору після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму drop-sudo safety posture, що й агент документації.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для maintainer після land, призначений для очищення дублікатів. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR змержено і що кожен дублікат має або спільне referenced issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація changed

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий обсяг CI-платформи:

- зміни production-коду core запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише тестів core запускають лише typecheck core test плюс core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише тестів extension запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (Vitest sweeps для extension залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним мапінгам, а потім sibling tests і залежним від import graph. Спільна конфігурація доставки group-room є одним із явних мапінгів: зміни до конфігурації visible-reply для групи, режиму доставки source reply або system prompt message-tool проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо широка для harness, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та надавайте перевагу свіжому прогрітому боксу для широкого підтвердження. Перш ніж витрачати повільний гейт на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про несподівано велику синхронізацію, спочатку виконайте `pnpm testbox:sanity` всередині боксу.

Перевірка справності швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий замість налагодження помилки продуктового тесту. Для PR з навмисними масовими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається на етапі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це обгортка віддаленого боксу, що належить репозиторію, для Linux-підтверджень супровідників. Використовуйте її, коли перевірка занадто широка для локального циклу редагування, коли важлива паритетність із CI або коли підтвердження потребує секретів, Docker, package-ланів, повторно використовуваних боксів чи віддалених логів. Звичайний бекенд OpenClaw — `blacksmith-testbox`; власні потужності AWS/Hetzner є запасним варіантом для збоїв Blacksmith, проблем із квотою або явного тестування на власних потужностях.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передавайте провайдера явно, навіть якщо `.crabbox.yaml` має типові налаштування власної хмари.

Гейт змін:

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

Цільовий повторний запуск тесту:

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

Повний набір:

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

Прочитайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox на базі Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або очищення незрозуміле, перегляньте активні бокси й зупиняйте лише ті бокси, які створили ви:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібно кілька команд на тому самому гідратованому боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використайте прямий Blacksmith як вузький запасний варіант:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Переходьте на власні потужності Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власні потужності явно є метою:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` володіє типовими налаштуваннями провайдера, синхронізації та гідратації GitHub Actions для ланів власної хмари. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації локальних віддалених репозиторіїв і сховищ об’єктів супровідника, а також виключає локальні артефакти виконання/збірки, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, отриманням `origin/main` і передаванням несекретного середовища для команд власної хмари `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
