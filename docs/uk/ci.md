---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка завершується помилкою
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-03T13:15:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для release candidate і широкої валідації. Лінії Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Попередній випуск Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або явного ручного dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує маніфест CI               | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                            | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                                         | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                    | Зміни, релевантні для Node         |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і багаторазових downstream-артефактів         | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol                          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним aggregate check result                                 | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, крім ліній channel, bundled, contract і extension                                 | Зміни, релевантні для Node         |
| `check`                          | Sharded-еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Зміни, релевантні для Node         |
| `check-additional`               | Архітектура, sharded boundary/prompt drift, extension guards, package boundary і gateway watch            | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та startup-memory smoke                                                         | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                        | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збирання й smoke для сумісності з Node 22                                                           | Ручний dispatch CI для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тести процесів/шляхів плюс регресії shared runtime import specifier                    | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів                           | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                            | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavor плюс одне збирання debug APK                                           | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                     | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.4 live lanes    | Запланований і ручний dispatch     |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільний build готовий.
4. Важчі platform і runtime лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний ключ concurrency CI версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безстроково блокувати новіші main-запуски. Ручні full-suite-запуски використовують `CI-manual-v1-*` і не скасовують поточні запуски.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які fast task вправляє напряму.
- **Windows Node checks** обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхнями CI workflow, які виконують цю лінію; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, core unit fast/support lanes запускаються окремо, core runtime infra розділено між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділені між chat/auth/model/http-plugin/runtime/startup lanes замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено по чотирьох matrix shards, кожен запускає вибрані незалежні guards паралельно й друкує per-check timings, зокрема `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift було прив’язано до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, із вимкненим мінімальним release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Лінія `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони наявні. Вона навмисно уникає пересилання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, ризиковою або операційно корисною. Рутинні opens, edits, bot churn, duplicate webhook noise і звичайний review traffic мають давати `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними на всьому цьому шляху. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane, крім Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна release-парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, release-only shard `agentic-plugins`, повний пакетний sweep extension і передрелізні Docker lanes Plugin вилучено з CI. Передрелізний набір Docker виконується лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, тому повний набір release-candidate не скасовується іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає довіреному виклику змогу виконати цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, шардовані channel contract checks, `check` shards, крім lint, `check-additional` shards і aggregates, верифікатори Node test aggregate, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він виконується щодня на `main`, і його можна запустити вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай бенчмаркить workflow ref. Установіть `target_ref`, щоб бенчмаркити release tag або іншу branch з поточною реалізацією workflow. Опубліковані шляхи звітів і latest pointers ключуються за протестованим ref, а кожен `index.md` записує протестований ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` за pinned input `kova_ref`, а потім виконує три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фіктивною OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також виконує OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для default, hook і 50-plugin startup cases; повторювані mock-OpenAI loops `channel-chat-baseline` hello; а також CLI startup commands проти запущеного gateway. Markdown summary source probe розміщено в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний tested-ref pointer записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для release-only proof Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
матриці stage, точних назв workflow jobs, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після створення release tag і після успішного
OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для доказу pinned commit на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper
пушить тимчасову branch `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що `headSha` кожного child
workflow збігається з target, і видаляє тимчасову branch після завершення
запуску. Umbrella verifier також завершується помилкою, якщо будь-який child workflow виконувався на
іншому SHA.

`release_profile` керує широтою реальних перевірок і провайдерів, що передається до release-перевірок. Ручні release-workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку консультативну матрицю провайдерів і медіа.

- `minimum` зберігає найшвидші критичні для release смуги OpenAI/core.
- `stable` додає стабільний набір провайдерів/backend.
- `full` запускає широку консультативну матрицю провайдерів і медіа.

Парасольковий workflow записує ідентифікатори запущених дочірніх run, а фінальна job `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших job для кожного дочірнього run. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківську verifier job, щоб оновити результат парасолькового workflow і підсумок часу виконання.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це утримує перезапуск невдалого release-бокса обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання у tarball `release-package-under-test`, а потім передає цей артефакт і workflow Docker для release-path реальних/E2E перевірок, і shard package acceptance. Це зберігає байти пакета однаковими між release-боксами й уникає повторного пакування того самого кандидата в кількох дочірніх job.

Дублікати run `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський монітор скасовує будь-який дочірній workflow, який
уже запустив, коли батьківський workflow скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним release-check run. Валідація release branch/tag
і цільові rerun groups зберігають `cancel-in-progress: false`.

## Реальні та E2E-шарди

Дочірній release workflow для реальних/E2E перевірок зберігає широке покриття нативних `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість однієї послідовної job:

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
- розділені шарди audio/video для медіа й provider-filtered шарди music

Це зберігає те саме файлове покриття, водночас полегшуючи перезапуск і діагностику повільних збоїв реальних провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` лишаються дійсними для ручних одноразових перезапусків.

Нативні шарди реальних media запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed реальні набори тестів на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed шарди реальних model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Release workflow для реальних перевірок один раз збирає й публікує цей образ, потім Docker-шарди реальної model, provider-sharded Gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні script-level обмеження `timeout`, нижчі за timeout workflow job, щоб завислий контейнер або шлях cleanup швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерел, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє inventory tarball, готує package-digest Docker-образи за потреби й запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав його; автономний Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опційна Telegram lane завершилися з помилкою.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну release-версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих prerelease/stable.
- `source=ref` пакує довірену `package_ref` branch, tag або повний commit SHA. Resolver fetch-ить branches/tags OpenClaw, перевіряє, що вибраний commit досяжний з історії branch репозиторію або release tag, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені source commits без запуску старої workflow-логіки.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язковий, коли `suite_profile=custom`

Профіль `package` використовує offline Plugin coverage, щоб валідація опублікованого пакета не залежала від доступності реального ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm spec збережено для автономних dispatch.

Для спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker lanes, Package Acceptance inputs, release defaults і failure triage,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає докази package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline Plugin, plugin-update і Telegram на тому самому розв’язаному package tarball. Встановіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти вже випущеного npm package замість artifact, зібраного за SHA. Cross-OS release checks усе ще покривають специфічні для OS onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за run. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди перезапуску failed-lane зберігають цей baseline. Встановіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` лишається доступним для ручного ширшого sampling зі старішим pre-date anchor. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona files, configured OpenClaw Plugin installs, tilde log paths і stale legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному cleanup для опублікованих оновлень, а не у звичайній широті Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4`, тож install і Gateway proof лишаються на тестовій моделі GPT-5, уникаючи GPT-4.x defaults.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих package. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence для `gateway install --wrapper`, коли package не експонує цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і може логувати відсутній persisted `update.channel`;
- Plugin smokes можуть читати legacy install-record locations або приймати відсутню persistence для marketplace install-record;
- `plugin-update` може дозволяти config metadata migration, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior лишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були випущені. Пізніші package мають задовольняти сучасні contracts; ті самі умови призводять до failure, а не warn чи skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних ліній Docker замість повторного запуску повної валідації релізу.

## Перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє покриття перевірки на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються поверхонь Docker/пакетів, змін пакета/маніфесту вбудованого plugin, або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише в джерельному коді вбудованого plugin, редагування лише тестів і редагування лише документації не резервують воркери Docker. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI-перевірку видалення agents зі спільного робочого простору, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованого plugin із сукупним тайм-аутом команди 240 секунд (кожен Docker-запуск сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та покриття Docker/update інсталятора для нічних запланованих запусків, ручних dispatch, перевірок релізу через workflow-call і pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ перевірки кореневого Dockerfile для цільового SHA, а потім запускає встановлення QR-пакета, перевірки кореневого Dockerfile/gateway, перевірки інсталятора/update і швидкий Docker E2E для вбудованого plugin як окремі завдання, щоб робота інсталятора не чекала за перевірками кореневого образу.

Пуші в `main` (включно з merge commit) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидку Docker-перевірку та залишає повну перевірку встановлення для нічної або релізної валідації.

Повільна перевірка image-provider для глобального встановлення Bun окремо контролюється `run_bun_global_install_smoke`. Вона запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `Install Smoke` можуть явно її ввімкнути, але pull request і пуші в `main` цього не роблять. Тести QR і Docker інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий раннер Node/Git для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для ліній звичайної функціональності.

Визначення ліній Docker містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а раннер виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                  |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10      | Кількість слотів основного пулу для звичайних ліній.                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9       | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10      | Обмеження одночасних ліній встановлення npm.                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7       | Обмеження одночасних багатосервісних ліній.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути шквалу створень у daemon Docker; задайте `0`, щоб її вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші межі. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset   | `1` друкує план планувальника без запуску ліній.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset   | Список точних ліній, розділених комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні сукупні preflight перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних ліній, зберігають таймінги ліній для впорядкування за принципом longest-first і типово припиняють планувати нові pooled лінії після першої помилки.

### Перевикористовуваний workflow live/E2E

Перевикористовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, тип образу, live-образ, лінія та покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на outputs і зведення GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та пушить bare/functional Docker E2E образи GHCR із тегами digest пакета через кеш Docker layer Blacksmith, коли плану потрібні лінії з установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи за digest пакета замість повторної збірки. Pull образів Docker повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Частини шляху релізу

Покриття Release Docker запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожна частина завантажувала лише потрібний тип образу та виконувала кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні частини Release Docker: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається сукупним ручним псевдонімом повторного запуску для обох ліній інсталятора провайдера.

OpenWebUI включається до `plugins-runtime-services`, коли цього вимагає повне покриття release-path, і зберігає окрему частину `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюються один раз у разі тимчасових мережевих збоїв npm.

Кожна частина завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що утримує налагодження невдалої лінії в межах одного цільового Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований workflow live/E2E щодня запускає повний Docker-набір release-path.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і окремі ручні CI dispatch не вмикають цей набір. Він балансує тести вбудованих plugin між вісьмома воркерами розширень; ці shard jobs розширень запускають до двох груп конфігурації plugin одночасно з одним воркером Vitest на групу та більшим heap Node, щоб import-heavy пакети plugin не створювали додаткові CI jobs. Релізний шлях Docker prerelease групує цільові Docker lanes невеликими групами, щоб не резервувати десятки раннерів для завдань на одну-три хвилини.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Agentic parity вкладено в широкі QA та release harnesses, а не в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким валідаційним запуском.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну через dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують lease Convex.

Перевірки релізу запускають live transport lanes Matrix і Telegram з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам'яті, бо QA parity окремо покриває поведінку пам'яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручний input workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу лінії QA Lab перед затвердженням релізу; його gate QA parity запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального порівняння parity.

Для звичайних PR дотримуйтеся доказів scoped CI/check замість того, щоб вважати parity обов'язковим статусом.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним оглядом репозиторію. Щоденні, ручні та захисні запуски для pull request, що не є чернетками, сканують код робочих процесів Actions разом із поверхнями JavaScript/TypeScript найвищого ризику, використовуючи високонадійні запити безпеки, відфільтровані до high/critical `security-severity`.

Захист pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму високонадійну матрицю безпеки, що й запланований робочий процес. Android і macOS CodeQL не входять до стандартних PR-перевірок.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовий рівень auth, secrets, sandbox, cron і gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс середовище виконання плагіна каналу, gateway, Plugin SDK, secrets, контрольні точки аудиту |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні політики SSRF, розбору IP, мережевого захисту, web-fetch і SSRF у Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агентом                         |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення плагінів, завантажувача, manifest, registry, встановлення через package-manager, завантаження джерел і контракту пакета Plugin SDK |

### Платформоспецифічні шардовані перевірки безпеки

- `CodeQL Android Critical Security` — запланована шардована перевірка безпеки Android. Вручну збирає Android-додаток для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижнева/ручна шардована перевірка безпеки macOS. Вручну збирає macOS-додаток для CodeQL на Blacksmith macOS, відфільтровує результати збирання залежностей із вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними перевірками, бо збирання macOS домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідна шардована перевірка, не пов’язана з безпекою. Вона виконує лише error-severity, не безпекові запити якості JavaScript/TypeScript над вузькими високовартісними поверхнями на меншому Blacksmith Linux runner. Її захист pull request навмисно менший за запланований профіль: PR, що не є чернетками, запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для коду виконання команд/моделей/інструментів агентом і диспетчеризації відповідей, коду схеми/міграції/IO конфігурації, коду auth/secrets/sandbox/security, основного каналу й середовища виконання вбудованого плагіна каналу, протоколу Gateway/server-method, runtime пам’яті/SDK-зв’язки, MCP/process/outbound delivery, runtime провайдера/каталогу моделей, session diagnostics/черг доставки, завантажувача плагінів, Plugin SDK/package-contract або змін runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і робочого процесу якості запускають усі дванадцять PR-шардів якості.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні гачки для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки auth, secrets, sandbox, cron і gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Контракти схеми конфігурації, міграції, нормалізації та IO                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого плагіна каналу                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація auto-reply і черги, а також runtime-контракти контрольної площини ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, runtime-фасади пам’яті, псевдоніми пам’яті в Plugin SDK, зв’язка активації runtime пам’яті та команди memory doctor                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, auth і discovery провайдера, реєстрація runtime провайдера, defaults/catalogs провайдера та web/search/fetch/embedding registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальна сталість, потоки керування Gateway і runtime-контракти контрольної площини завдань                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для основних web fetch/search, media IO, media understanding, image-generation і media-generation                                               |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, registry, публічної поверхні та entrypoint Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на стороні пакета та допоміжні засоби контракту пакета плагіна                                                                    |

Якість відокремлена від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих плагінів слід повертати лише як подальшу роботу зі scoped або sharded підходом після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована смуга обслуговування Codex для підтримання наявної документації у відповідності з нещодавно внесеними змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а ручний запуск може виконати його безпосередньо. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent був створений за останню годину. Коли він виконується, він переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тому один погодинний запуск може покрити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована смуга обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується в цей UTC-день. Ручний запуск обходить цей щоденний шлюз активності. Смуга створює повний згрупований звіт продуктивності Vitest, дозволяє Codex робити лише невеликі, coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite звіт і відхиляє зміни, які зменшують базову кількість успішних тестів. Якщо в базовій лінії є тести з помилками, Codex може виправляти лише очевидні збої, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапляє в репозиторій, смуга ребейзить перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти таку саму drop-sudo safety posture, як і docs agent.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів, призначений для очищення дублікатів після landing. За замовчуванням він виконується як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що landed PR злитий і що кожен дублікат має або спільну referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо розширення залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі правки тестів запускають самих себе, правки джерел віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Спільна group-room delivery config є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt маршрутизуються через основні reply tests плюс Discord і Slack delivery regressions, щоб зміна спільного default зазнала помилки ще до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжому підготовленому боксу для широкої перевірки. Перш ніж витрачати повільну перевірку на бокс, який було повторно використано, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині боксу.

Перевірка справності швидко завершується помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і підготуйте свіжий замість налагодження помилки продуктового тесту. Для PR з навмисними масовими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається на етапі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — другий шлях віддаленого боксу, який належить репозиторію, для Linux-перевірки, коли Blacksmith недоступний або коли бажаніше використати власні хмарні ресурси. Підготуйте бокс, наповніть його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові параметри провайдера, синхронізації та наповнення GitHub Actions. Він виключає локальний `.git`, щоб наповнений checkout Actions зберігав власні віддалені Git-метадані замість синхронізації локальних maintainer remotes і сховищ об’єктів, а також виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
