---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти за областю змін, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-05T04:27:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний graph для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для release живе в окремому workflow [`Plugin передреліз`](#plugin-prerelease) і запускається лише з [`Повної release-валідації`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                              | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest                        | Завжди на non-draft pushes і PRs   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                               | Завжди на non-draft pushes і PRs   |
| `security-dependency-audit`      | Аудит production lockfile без встановлення dependencies щодо npm advisories                              | Завжди на non-draft pushes і PRs   |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                                      | Завжди на non-draft pushes і PRs   |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused files                               | Node-релевантні зміни              |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts                     | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol перевірки                         | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                                     | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes                          | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke             | Node-релевантні зміни              |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch          | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                             | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                                | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                 | Ручний CI dispatch для releases    |
| `check-docs`                     | Перевірки форматування docs, lint і broken links                                                         | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                                       | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-специфічні process/path tests плюс shared runtime import specifier regressions                   | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                                        | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                  | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                            | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна оптимізація повільних Codex tests після довіреної активності                                     | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand Kova runtime performance reports з mock-provider, deep-profile і GPT 5.4 live lanes    | Scheduled і manual dispatch        |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно shared build готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref не падає також. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють нормальні shard failures, але не стають у queue після того, як увесь workflow уже superseded. Автоматичний CI concurrency key має версію (`CI-v7-*`), тому zombie з боку GitHub у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Правки CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, selected cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-специфічних process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділені або збалансовані, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, core unit fast/support lanes запускаються окремо, core runtime infra розділена між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділені між chat/auth/model/http-plugin/runtime/startup lanes замість очікування на built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено смугами між чотирма matrix shards, кожен із яких запускає selected independent guards concurrently і друкує per-check timings, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим мінімальним віком release pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує недовірений pull request code. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper в issue comments;
- `clawsweeper_commit_review` для commit-level review requests на `main` pushes;
- `github_activity` для загальної GitHub activity, яку agent ClawSweeper може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони присутні. Вона навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який posts normalized event до OpenClaw Gateway hook для agent ClawSweeper.

Загальна активність є спостереженням, а не delivery-by-default. Agent ClawSweeper отримує Discord target у своєму prompt і має post до `#clawsweeper` лише коли подія surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними на всьому цьому path. Вони є input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні dispatch CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped lane, крім Android: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні dispatch CI запускають лише Android з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, release-only шард `agentic-plugins`, повний пакетний sweep extension і Docker lane передрелізу Plugin виключені з CI. Набір Docker prerelease запускається лише тоді, коли `Full Release Validation` dispatch окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну групу concurrency, тому повний набір release-candidate не скасовується іншим push або PR run на тому самому ref. Необов'язковий input `target_ref` дає довіреному caller змогу запускати цей graph для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, шардовані channel contract checks, шарди `check`, крім lint, шарди й aggregates `check-additional`, верифікатори Node test aggregate, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node test, шарди bundled plugin test, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker builds install-smoke (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

Ручний dispatch зазвичай проводить benchmark workflow ref. Установіть `target_ref`, щоб провести benchmark release tag або іншої branch з поточною реалізацією workflow. Опубліковані шляхи звітів і latest pointers keyed за tested ref, а кожен `index.md` записує tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM з pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lane:

- `mock-provider`: діагностичні сценарії Kova проти local-build runtime з детермінованою fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і agent-turn hotspots.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після Kova pass: gateway boot timing і memory для default, hook і startup випадків із 50-plugin; повторювані mock-OpenAI hello loops `channel-chat-baseline`; і CLI startup commands проти booted gateway. Markdown summary source probe розміщується в `source/index.md` у report bundle, поруч із raw JSON.

Кожен lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також commit `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний tested-ref pointer записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом". Він приймає branch, tag або повний commit SHA, dispatch ручний workflow `CI` із цією target, dispatch `Plugin Prerelease` для release-only plugin/package/static/Docker proof і dispatch `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs тримають вичерпне live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб широка advisory validation залишалася широкою. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Full release validation](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow job, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Dispatch його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` для всіх publishable plugin packages, dispatch
`Plugin ClawHub Release` для того самого release SHA, і лише потім dispatch
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs.
Helper pushes тимчасову branch `release-ci/<sha>-...` на target SHA,
dispatch `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` відповідає target, і видаляє тимчасову branch, коли
run завершується. Umbrella verifier також завершується з помилкою, якщо будь-який child workflow запустився на
іншому SHA.

`release_profile` керує широтою live/provider, що передається у release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку матрицю advisory provider/media. `run_release_soak` керує тим, чи stable/default release checks запускають вичерпний live/E2E і Docker release-path soak; `full` примусово вмикає soak.

- `minimum` зберігає найшвидші критичні для випуску OpenAI/core лінії.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку матрицю advisory provider/media.

Umbrella записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське verifier-завдання, щоб оновити результат umbrella і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це утримує перезапуск невдалого release box у межах після сфокусованого виправлення. Для однієї невдалої cross-OS лінії поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а підсумки packaged-upgrade містять часи за фазами. QA release-check лінії є advisory, тому лише QA-збої попереджають, але не блокують release-check verifier.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, потім передає цей артефакт у cross-OS checks і Package Acceptance, а також у live/E2E release-path Docker workflow, коли запускається soak-покриття. Це зберігає однакові байти пакета між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані виконання `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли скасовано батьківський, тому новіша main-валідація
не чекає за застарілим двогодинним release-check виконанням. Валідація release branch/tag
і сфокусовані групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке native `pnpm test:live` покриття, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за provider завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media audio/video shards і відфільтровані за provider music shards

Це зберігає те саме покриття файлів, водночас спрощуючи перезапуск і діагностику повільних live provider збоїв. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних одноразових перезапусків.

Native live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає та надсилає цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні caps `timeout` на рівні скрипта, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повну source Docker target, release run налаштований неправильно і марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw як продукт?" Він відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, готує package-digest Docker images за потреби і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав один; автономний Telegram dispatch все ще може встановити опубліковану npm spec.
4. `summary` завершує workflow з помилкою, якщо package resolution, Docker acceptance або опційна Telegram lane зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію випуску OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для published prerelease/stable acceptance.
- `source=ref` пакує довірену `package_ref` branch, tag або повний commit SHA. Resolver отримує branches/tags OpenClaw, перевіряє, що вибраний коміт досяжний з історії repository branch або release tag, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремими. `workflow_ref` — це довірений workflow/harness code, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дозволяє поточному test harness перевіряти старіші довірені source commits без запуску старої workflow logic.

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Profile `package` використовує offline plugin coverage, щоб валідація published-package не залежала від доступності live ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, при цьому шлях published npm spec зберігається для standalone dispatches.

Для спеціальної політики тестування update і plugin, включно з local commands,
Docker lanes, Package Acceptance inputs, release defaults і failure triage,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це зберігає package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update і Telegram proof на одному розв’язаному package tarball. Задайте `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти вже доставленого npm package замість SHA-built artifact. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один published package baseline за виконання у blocking release path. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; failed-lane rerun commands зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` задає `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири останні стабільні npm releases плюс зафіксовані plugin-compatibility boundary releases і issue-shaped fixtures для Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths і stale legacy plugin dependency roots. Multi-baseline published-upgrade survivor selections шардяться за baseline в окремі targeted Docker runner jobs. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питанням є вичерпне очищення published update, а не звичайна широта Full Release CI. Local aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою baked recipe команди `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано, інакше `openai/gpt-5.4`, щоб install і gateway proof залишалися на GPT-5 test model, уникаючи GPT-4.x defaults.

### Вікна застарілої сумісності

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, omitted from tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не exposes цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів метаданих збірки, які вже були випущені. Пізніші пакети повинні відповідати сучасним контрактам; за тих самих умов вони завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску приймальних перевірок пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Інсталяційний smoke-тест

Окремий робочий процес `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє покриття smoke-тестів на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають Docker/package-поверхні, зміни пакета/маніфесту вбудованого Plugin або поверхні ядра Plugin/каналу/Gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише у вихідному коді вбудованого Plugin, зміни лише в тестах і зміни лише в документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI-smoke для agents delete shared-workspace, запускає контейнерний gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR-встановлення пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch-запусків, release-перевірок через workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ smoke для кореневого Dockerfile з цільовим SHA, потім запускає QR-встановлення пакета, smoke-тести кореневого Dockerfile/Gateway, smoke-тести інсталятора/update і швидкий Docker E2E для вбудованого Plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-тестами кореневого образу.

Push у `main` (включно з merge-комітами) не примушує повний шлях; коли логіка області змін запитала б повне покриття для push, робочий процес залишає швидкий Docker smoke і передає повний інсталяційний smoke-тест нічній або release-валідації.

Повільний smoke-тест Bun global install image-provider окремо обмежується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з робочого процесу release-перевірок, а ручні dispatch-запуски `Install Smoke` можуть увімкнути його, але pull request і push у `main` цього не роблять. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний runner Node/Git для ліній інсталятора/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                           |
| ------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних ліній.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження одночасних live-ліній, щоб провайдери не throttling.                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження одночасних ліній встановлення npm.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження одночасних багатосервісних ліній.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами ліній, щоб уникнути штормів створення Docker daemon; встановіть `0` без затримки. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/tail-лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не встановлено  | `1` друкує план планувальника без запуску ліній.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | не встановлено  | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за її ефективне обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить ємність. Локальна сукупна перевірка попередньо перевіряє Docker, видаляє застарілі E2E-контейнери OpenClaw, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові pooled-лінії після першої помилки.

### Багаторазовий live/E2E-робочий процес

Повторно використовуваний процес live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, lane та облікових даних потрібне. `scripts/docker-e2e.mjs` потім перетворює цей план на вихідні дані та зведення GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує позначені digest пакета bare/functional образи GHCR Docker E2E через кеш шарів Docker від Blacksmith, коли плану потрібні lane з установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/кешу швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти шляху випуску

Покриття Docker для випуску запускає менші фрагментовані jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, тож кожен фрагмент завантажує лише потрібний йому тип образу й виконує кілька lane через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker-фрагменти випуску: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, а також від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами Plugin/runtime. Псевдонім lane `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох lane інсталяторів провайдерів.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття release-path його запитує, і зберігає окремий фрагмент `openwebui` лише для dispatch, призначених тільки для OpenWebUI. Lane оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних lane і командами повторного запуску для кожної lane. Вхід workflow `docker_lanes` запускає вибрані lane з підготовленими образами замість фрагментованих jobs, що обмежує налагодження failed-lane одним цільовим Docker-job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільовий job збирає образ live-тесту локально для цього повторного запуску. Згенеровані команди GitHub для повторного запуску по lane містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, тож failed lane може повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти та надрукувати об'єднані/по-lane цільові команди повторного запуску
pnpm test:docker:timings <summary>   # зведення повільних lane і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push до `main` і самостійні ручні CI-dispatch не вмикають цей набір. Він балансує тести bundled Plugin між вісьмома працівниками extensions; ці shard-jobs extensions запускають до двох груп конфігурації Plugin одночасно з одним працівником Vitest на групу та більшим heap Node, щоб import-heavy пакети Plugin не створювали додаткових CI-jobs. Шлях Docker prerelease, призначений лише для випуску, групує цільові Docker-lane невеликими наборами, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має спеціальні CI-lane поза основним workflow зі smart scope. Agentic parity вкладена в широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким запуском валідації.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують leases Convex.

Release checks запускають live transport lane Matrix і Telegram з детермінованим mock provider і mock-qualified моделями (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук у пам'яті, бо QA parity окремо покриває поведінку пам'яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Стандарт CLI та вхід ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для випуску QA Lab lane перед затвердженням випуску; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, потім завантажує обидва артефакти в невеликий report job для фінального порівняння parity.

Для звичайних PR дотримуйтеся обмежених за областю доказів CI/перевірок, замість того щоб вважати parity обов’язковим статусом.

## CodeQL

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним sweep усього репозиторію. Щоденні, ручні та guard-запуски для non-draft pull request сканують код Actions workflow плюс найризиковіші поверхні JavaScript/TypeScript за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базовий рівень Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel Plugin, Gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики core SSRF, парсингу IP, network guard, web-fetch і SSRF у Plugin SDK                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helpers виконання процесів, outbound delivery та gates виконання agent tool                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри Plugin install, loader, manifest, registry, package-manager install, source-loading і package contract у Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними стандартними запускми, бо macOS build домінує runtime навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він виконує лише error-severity, non-security JavaScript/TypeScript quality queries для вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO, auth/secrets/sandbox/security, core channel і runtime bundled channel Plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є hooks для навчання/ітерацій, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки auth, secrets, sandbox, Cron і Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Контракти config schema, migration, normalization та IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel і bundled channel Plugin                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime contracts ACP control-plane                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, process supervision helpers та outbound delivery contracts                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні reply queue, session delivery queues, helpers outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI    |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і helpers session/thread binding                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries       |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, local persistence, gateway control flows і runtime contracts task control-plane                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side source Plugin SDK і helpers plugin package contract                                                                                        |

Quality залишається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільний runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації узгодженою з нещодавно landed changes. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший non-skipped Docs Agent run. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний run може покрити всі main changes, накопичені з часу останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних tests. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC day. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише small coverage-preserving test performance fixes замість broad refactors, потім повторно запускає full-suite report і відхиляє changes, які зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправити лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде committed. Коли `main` просувається до того, як bot push landed, lane rebases validated patch, повторно запускає `pnpm check:changed` і retry push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати таку саму drop-sudo safety posture, як docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. За замовчуванням він є dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates і changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope платформи CI:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- public Plugin SDK або plugin-contract changes розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі test edits запускають самих себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change failed до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли change достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й для широкого підтвердження надавайте перевагу свіжому прогрітому боксу. Перш ніж витрачати повільний гейт на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині бокса.

Перевірка sanity швидко завершується з помилкою, коли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий замість налагодження помилки продуктового тесту. Для навмисних PR із великою кількістю видалень задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це належна репозиторію обгортка віддаленого бокса для maintainer-підтверджень у Linux. Використовуйте її, коли перевірка занадто широка для локального циклу редагування, коли важлива відповідність CI або коли підтвердження потребує секретів, Docker, пакетних ліній, багаторазових боксів чи віддалених логів. Звичайний бекенд OpenClaw — `blacksmith-testbox`; власні потужності AWS/Hetzner є fallback для збоїв Blacksmith, проблем із квотами або явного тестування на власних потужностях.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відмовляється від застарілого бінарника Crabbox, який не оголошує `blacksmith-testbox`. Передавайте провайдера явно, навіть якщо `.crabbox.yaml` має типові значення owned-cloud.

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

Сфокусований повторний запуск тесту:

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

Прочитайте підсумковий JSON-звіт. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox на базі Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або очищення незрозуміле, перевірте активні бокси й зупиніть лише ті бокси, які створили ви:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібно кілька команд на тому самому гідратованому боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є зламаним шаром, але сам Blacksmith працює, використовуйте прямий Blacksmith як вузький fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Ескалуйте до власних потужностей Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власні потужності явно є метою:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` визначає типові значення провайдера, синхронізації та гідратації GitHub Actions для owned-cloud ліній. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації maintainer-локальних remote і сховищ об’єктів, а також виключає локальні артефакти виконання/збірки, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і передавання несекретного середовища для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
