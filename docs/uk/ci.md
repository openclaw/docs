---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується з помилкою
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте dispatch ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти областей, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T22:45:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі напрями, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для кандидатів на випуск і широкої перевірки. Напрями Android залишаються опційними через `include_android`. Покриття Plugin лише для випусків міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                               | Коли запускається                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і збирає manifest CI                              | Завжди для non-draft push і PR            |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                                | Завжди для non-draft push і PR            |
| `security-dependency-audit`      | Аудит production lockfile без встановлення залежностей проти npm advisories                                               | Завжди для non-draft push і PR            |
| `security-fast`                  | Обов’язкова агрегація для швидких завдань безпеки                                                                          | Завжди для non-draft push і PR            |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                                    | Зміни, релевантні Node                    |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream artifacts                           | Зміни, релевантні Node                    |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от перевірки bundled/plugin-contract/protocol                                        | Зміни, релевантні Node                    |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                                      | Зміни, релевантні Node                    |
| `checks-node-core-test`          | Shard-и core Node тестів, окрім напрямів channel, bundled, contract і extension                                           | Зміни, релевантні Node                    |
| `check`                          | Sharded-еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke                         | Зміни, релевантні Node                    |
| `check-additional`               | Architecture, boundary, drift prompt snapshot, guards extension-surface, package-boundary і shard-и gateway-watch         | Зміни, релевантні Node                    |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                                                          | Зміни, релевантні Node                    |
| `checks`                         | Verifier для built-artifact тестів каналів                                                                                | Зміни, релевантні Node                    |
| `checks-node-compat-node22`      | Напрям збирання й smoke для сумісності Node 22                                                                            | Ручний CI dispatch для випусків           |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                                | Змінено документацію                      |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                                   | Зміни, релевантні Python-skill            |
| `checks-windows`                 | Windows-специфічні тести process/path плюс regressions спільних runtime import specifier                                  | Зміни, релевантні Windows                 |
| `macos-node`                     | Напрям тестів TypeScript для macOS з використанням спільних зібраних артефактів                                           | Зміни, релевантні macOS                   |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                                            | Зміни, релевантні macOS                   |
| `android`                        | Unit-тести Android для обох flavors плюс одне збирання debug APK                                                          | Зміни, релевантні Android                 |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                                     | Успіх Main CI або ручний dispatch         |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і live-напрямами GPT 5.4                | Запланований і ручний dispatch            |

## Порядок fail-fast

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи важчих artifact і platform matrix завдань.
3. `build-artifacts` перекривається зі швидкими Linux-напрямами, щоб downstream consumers могли стартувати, щойно спільне збирання готове.
4. Після цього розгортаються важчі platform і runtime напрями: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard-ів використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було витіснено. Автоматичний concurrency key CI має версію (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixtures і вузькі редагування helper/test-routing для plugin contract** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства Node тестів розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування runner-ів: channel contracts виконуються як три weighted shards, малі core unit lanes об’єднуються парами, auto-reply виконується як чотири збалансовані workers (із reply subtree, розділеним на shard-и agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job, включно з `pnpm prompt:snapshots:check`, щоб drift prompt для Codex runtime happy-path був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий неперевірений unused file або залишає застарілий allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності репозиторію OpenClaw до ClawSweeper. Він не checkout-ить і не виконує недовірений код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch-ить компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири напрями:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів commit-level review на push-ах у `main`;
- `github_activity` для загальної активності GitHub, яку може переглядати агент ClawSweeper.

Напрям `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, якщо вони є. Він навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають давати результат `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як недовірені дані в усьому цьому path. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android lane з обмеженою областю: Linux Node shards, bundled-plugin shards, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Автономні ручні запуски CI виконують лише Android з `include_android=true`; повна парасолька релізу вмикає Android, передаючи `include_android=true`. Статичні перевірки попереднього випуску плагінів, релізний shard `agentic-plugins`, повний пакетний sweep extension і Docker lanes попереднього випуску плагінів виключені з CI. Docker-набір попереднього випуску запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded перевірки контрактів каналів, `check` shards, крім lint, `check-additional` shards і aggregates, aggregate verifiers для Node tests, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощадили); install-smoke Docker builds (час очікування в черзі для 32-vCPU коштував більше, ніж заощадив)                                                                                                                                                                                                                                                                                    |
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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із зафіксованого релізу та Kova із зафіксованого input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фіктивною auth, сумісною з OpenAI.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і agent-turn hotspots.
- `live-gpt54`: реальний turn агента OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: час завантаження gateway і пам’ять у випадках startup default, hook і 50-plugin; повторювані mock-OpenAI hello loops `channel-chat-baseline`; і команди запуску CLI проти завантаженого gateway. Markdown-підсумок source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для “запустити все перед релізом”. Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізних proof для plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей профілів, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для proof за зафіксованим commit на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper
пушить тимчасову branch `release-ci/<sha>-...` на цільовий SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з ціллю, і видаляє тимчасову branch, коли run
завершується. Umbrella verifier також завершується з помилкою, якщо будь-який child workflow запускався на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` залишає найшвидші OpenAI/core release-critical lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальний job `Verify full validation` повторно перевіряє поточні conclusions child runs і додає таблиці найповільніших jobs для кожного child run. Якщо child workflow запущено повторно і він став green, повторно запустіть лише parent verifier job, щоб оновити umbrella result і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього попереднього релізу plugin, `release-checks` для кожного дочірнього релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на umbrella. Це обмежує повторний запуск невдалого release box після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз перетворити вибране посилання на tarball `release-package-under-test`, а потім передає цей артефакт і workflow Docker для live/E2E release-path, і shard прийняття пакета. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже запустив, коли батьківський скасовано, тож новіша валідація main
не чекає за застарілим двогодинним запуском release-check. Валідація release branch/tag
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles`, відфільтровані за provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені audio/video shards для медіа та music shards, відфільтровані за provider

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed shards для live model/backend використовують окремий спільний image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow збирає та публікує цей image один раз, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і shards Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout workflow job, щоб завислий container або шлях cleanup швидко падав, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повну source Docker target, release run налаштований неправильно й марнуватиме wall clock на дублікати image builds.

## Прийняття пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей installable пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє source tree, тоді як прийняття пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після install або update.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 та profile у summary кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, перевіряє inventory tarball, за потреби готує package-digest Docker images і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні images один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними artifacts.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий artifact `package-under-test`, якщо `Package Acceptance` визначив один; окремий dispatch Telegram усе ще може встановити опублікований npm spec.
4. `summary` провалює workflow, якщо resolution пакета, Docker acceptance або опційна Telegram lane зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну release version OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих prerelease/stable.
- `source=ref` пакує довірену branch, tag або повний commit SHA `package_ref`. Resolver отримує branches/tags OpenClaw, перевіряє, що вибраний commit досяжний з історії repository branch або release tag, встановлює deps в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його слід указувати для artifacts, поширених зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені source commits без запуску старої workflow logic.

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні chunks Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Profile `package` використовує offline plugin coverage, щоб валідація published-package не залежала від доступності live ClawHub. Опційна Telegram lane повторно використовує artifact `package-under-test` у `NPM Telegram Beta E2E`, а шлях published npm spec збережено для окремих dispatches.

Щодо спеціальної політики тестування update і plugin, включно з локальними командами,
Docker lanes, inputs Package Acceptance, release defaults і triage збоїв,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає proof міграції пакета, update, cleanup застарілих залежностей plugin, repair встановлення налаштованого plugin, offline plugin, plugin-update і Telegram на тому самому визначеному package tarball. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму matrix проти відвантаженого npm package замість artifact, зібраного з SHA. Cross-OS release checks усе ще покривають специфічні для OS onboarding, installer і platform behavior; валідацію package/update product слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє одну baseline опублікованого пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожний stable npm release від `2026.4.23` до `latest`; `release-history` залишається доступним для ручного ширшого sampling зі старішим pre-date anchor. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на fixtures у формі issues для config Feishu, збережених bootstrap/persona files, configured installs OpenClaw plugin, tilde log paths і застарілих roots залежностей legacy plugin. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному cleanup опублікованого update, а не у звичайній ширині Full Release CI. Локальні агреговані runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, тримати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого recipe команди `openclaw config set`, записує кроки recipe в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з необробленого абсолютного Windows path. Cross-OS agent-turn smoke OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4`, тож install і gateway proof залишаються на тестовій GPT-5 model, уникаючи defaults GPT-4.x.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, включно з `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на files, пропущені в tarball;
- `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли пакет не expose-ить цей flag;
- `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може log-увати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволити migration config metadata, водночас усе ще вимагаючи, щоб install record і behavior no-reinstall залишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були відвантажені. Пізніші packages мають відповідати modern contracts; ті самі умови дають failure замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета почніть зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали смуг, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних смуг Docker замість повторного запуску повної валідації релізу.

## Smoke-тест встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення обсягу через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що зачіпають поверхні Docker/пакетів, зміни пакетів/маніфестів вбудованих plugin, або поверхні ядра plugin/channel/gateway/Plugin SDK, які перевіряють smoke-завдання Docker. Зміни лише у вихідному коді вбудованих plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents у спільному робочому просторі, запускає контейнерний gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованих plugin із сукупним тайм-аутом команди 240 секунд (кожен Docker-запуск сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/оновлювальне покриття інсталятора для нічних запланованих запусків, ручних dispatch, release-перевірок через workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, потім запускає встановлення QR-пакета, smoke-перевірки кореневого Dockerfile/gateway, smoke-перевірки інсталятора/оновлення та швидкий Docker E2E для вбудованих plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push у `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації.

Повільний smoke image-provider для глобального встановлення Bun окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push у `main` не запускають його. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий runner Node/Git для смуг installer/update/plugin-dependency;
- функціональний образ, який установлює той самий tarball у `/app` для смуг звичайної функціональності.

Визначення смуг Docker розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної смуги через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає смуги з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                 | Типове значення | Призначення                                                                                       |
| -------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних смуг.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт одночасних live-смуг, щоб провайдери не throttling.                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт одночасних смуг npm install.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт одночасних смуг із кількома сервісами.                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами смуг, щоб уникнути сплесків створення в Docker daemon; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут для кожної смуги (120 хвилин); вибрані live/tail-смуги використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план scheduler без запуску смуг.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Розділений комами точний список смуг; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу смугу. |

Смуга, важча за її ефективне обмеження, все одно може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить capacity. Локальні сукупні preflight перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних смуг, зберігають таймінги смуг для порядку longest-first і за замовчуванням зупиняють планування нових pooled-смуг після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, виду образу, live-образу, смуги та credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на outputs і summaries GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; валідує інвентар tarball; збирає й публікує bare/functional Docker E2E-образи GHCR із тегом digest пакета через кеш Docker layer Blacksmith, коли план потребує смуг із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторився замість споживання більшої частини критичного шляху CI.

### Частини release-path

Release Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний вид образу й виконував кілька смуг через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias смуги `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI згортається в `plugins-runtime-services`, коли повне release-path покриття запитує його, і зберігає окремий chunk `openwebui` лише для dispatch, призначених тільки для OpenWebUI. Смуги оновлення bundled-channel один раз повторюються для тимчасових мережевих збоїв npm.

Кожен chunk завантажує `.artifacts/docker-tests/` із журналами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану scheduler, таблицями повільних смуг і командами повторного запуску для кожної смуги. Input workflow `docker_lanes` запускає вибрані смуги на підготовлених образах замість chunk-завдань, що обмежує налагодження невдалої смуги одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker lane, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної смуги включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin передвипуск

`Plugin Prerelease` — дорожче product/package-покриття, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні CI dispatch тримають цей suite вимкненим. Він балансує тести вбудованих plugin між вісьмома extension workers; ці extension shard-завдання запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy batches plugin не створювали додаткових CI-завдань. Docker prerelease path лише для релізу групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має спеціальні CI lanes поза основним smart-scoped workflow. Agentic parity вкладена в широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають live transport lanes Matrix і Telegram із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract було ізольовано від затримки live model і звичайного startup provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку пам’яті; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI його підтримує. Типове значення CLI та manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди sharding full Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity required status.

## CodeQL

`CodeQL` — це навмисно вузький сканер безпеки першого проходу, а не повне сканування репозиторію. Щоденні, ручні та guard-запуски для нечернеткових pull request сканують код Actions workflow, а також JavaScript/TypeScript-поверхні з найвищим ризиком, використовуючи високодостовірні запити безпеки, відфільтровані до високого/критичного `security-severity`.

Guard для pull request лишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високодостовірну матрицю безпеки, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Автентифікація, секрети, sandbox, Cron і базова лінія Gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації базового каналу плюс runtime Plugin каналу, Gateway, Plugin SDK, секрети, точки дотику аудиту                 |
| `/codeql-security-high/network-ssrf-boundary`     | Базові SSRF, розбір IP, мережевий guard, web-fetch і поверхні політики SSRF у Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                          |
| `/codeql-security-high/plugin-trust-boundary`     | Встановлення Plugin, loader, manifest, registry, встановлення package-manager, source-loading і довірчі поверхні контракту пакета Plugin SDK |

### Платформоспецифічні шарди безпеки

- `CodeQL Android Critical Security` — запланований Android-шард безпеки. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux runner, який приймає workflow sanity. Вивантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS-шард безпеки. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і вивантажує в `/codeql-critical-security/macos`. Утримується поза щоденними стандартними запускми, бо збірка macOS домінує над runtime навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний небезпековий шард. Він запускає лише запити якості JavaScript/TypeScript з error-severity і без категорії безпеки для вузьких високовартісних поверхонь на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента й диспетчеризації відповідей, схемі/міграції/IO конфігурації, коді автентифікації/секретів/sandbox/безпеки, runtime базового каналу й вбудованого Plugin каналу, протоколі Gateway/методі сервера, runtime пам’яті/зв’язці SDK, MCP/процесах/вихідній доставці, runtime provider/каталозі моделей, діагностиці сесій/чергах доставки, loader Plugin, Plugin SDK/контракті пакета або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять PR-шардів якості.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні hooks для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, sandbox, Cron і Gateway                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації базового каналу та вбудованого Plugin каналу                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/provider, диспетчеризація та черги автовідповідей, а також runtime-контракти control-plane ACP                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, aliases пам’яті Plugin SDK, зв’язка активації runtime пам’яті та команди doctor для пам’яті                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язки/доставки вихідних сесій, поверхні bundle діагностичних подій/логів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язки сесій/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення provider, реєстрація runtime provider, стандартні налаштування/каталоги provider і registry для web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальна персистентність, потоки керування Gateway і runtime-контракти task control-plane                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Базові web fetch/search, media IO, розуміння медіа, генерація зображень і runtime-контракти генерації медіа                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, публічної поверхні та entrypoint Plugin SDK                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код Plugin SDK на боці пакета та допоміжні засоби контракту пакета Plugin                                                                  |

Якість лишається окремою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад лише як scoped або sharded подальшу роботу після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована maintenance lane Codex для підтримання наявної документації в узгодженому стані з нещодавно злитими змінами. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована maintenance lane Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, але він пропускається, якщо інший workflow-run виклик уже запускався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний gate активності. Lane будує grouped Vitest performance report для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких refactor, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline кількість тестів, які проходять. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push буде злитий, lane робить rebase валідованого patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний workflow maintainer для очищення дублікатів після злиття. Він стандартно працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація changed

Локальна changed-lane логіка живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core test запускають тільки typecheck core test плюс core lint;
- зміни extension production запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension test запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною тестовою роботою);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі правки тестів запускають самі себе, правки source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або system prompt message-tool проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впав до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореневого каталогу репозиторію та віддавайте перевагу новому прогрітому боксу для широкої перевірки. Перш ніж витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` усередині бокса.

Перевірка справності швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте новий замість того, щоб налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, належний репозиторію шлях віддаленого бокса для підтвердження в Linux, коли Blacksmith недоступний або коли бажано використати власну хмарну місткість. Прогрійте бокс, гідратуйте його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові значення для провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних maintainer remotes і сховищ об’єктів, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` підхоплюють як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
