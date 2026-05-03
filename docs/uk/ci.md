---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запускалося чи ні
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте виконання або повторне виконання валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-03T12:02:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc5d6822809e173f4fc8efc65281d6a4639be6af939bc37dd29cc7502aa99f4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається на кожному push до `main` і кожному pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin, призначене лише для релізів, міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається тільки з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                                         | Коли запускається                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені scopes, змінені extensions і будує CI manifest                           | Завжди для не-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                          | Завжди для не-draft push і PR      |
| `security-dependency-audit`      | Production-аудит lockfile без залежностей щодо npm advisories                                                       | Завжди для не-draft push і PR      |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                                                 | Завжди для не-draft push і PR      |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                              | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts                | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от перевірки bundled/plugin-contract/protocol                                    | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                                             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shards тестів Core Node, крім channel, bundled, contract і extension lanes                                          | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke                   | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, prompt snapshot drift, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                        | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact channel tests                                                                        | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke lane                                                                            | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                                             | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                             | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс shared runtime import specifier regressions                          | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                                                   | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                             | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                                      | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                               | Успіх main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.4 live lanes              | Запланований і ручний dispatch     |

## Порядок швидкого завершення при збоях

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже витіснено. Автоматичний CI concurrency key версіонований (`CI-v7-*`), щоб zombie з боку GitHub у старій queue group не міг безкінечно блокувати новіші запуски main. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідовують Node CI graph плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі helper/test-routing редагування plugin contract** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання напряму вправляє.
- **Windows Node checks** обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднані попарно, auto-reply запускається як чотири збалансовані workers (з reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно в одному job, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, зафіксований на найновішій версії Knip, з вимкненим мінімальним release age pnpm для install через `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує недовірений код pull request. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає compact `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, якщо вони є. Він навмисно не пересилає повне webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, ризикована або операційно корисна. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Ставтеся до GitHub titles, comments, bodies, review text, branch names і commit messages як до недовірених даних у всьому цьому path. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane не для Android: Linux Node shards, shards пакетних Plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, smoke-перевірку збірки, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна release-парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin, release-only shard `agentic-plugins`, повний batch sweep розширень і Docker lanes prerelease для Plugin вилучені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не скасовувався іншим запуском push або PR на тому самому ref. Необов’язковий ввід `target_ref` дає trusted caller змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs та aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, `check` shards, крім lint, `check-additional` shards та aggregates, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, менш ресурсомісткі extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, що 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## Локальні відповідники

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

`OpenClaw Performance` — це workflow продуктивності product/runtime. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти local-build runtime з deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для hotspots startup, gateway і agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для стандартного запуску, запуску з hook та запуску з 50 Plugin; повторювані mock-OpenAI `channel-chat-baseline` hello loops; і CLI startup commands проти запущеного gateway. Markdown-зведення source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts до `openclaw/clawgrit-reports` у `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед release». Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для release-only доказів plugin/package/static/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Full release validation](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profiles, artifacts і
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

Для доказу pinned commit на швидкозмінній branch використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper пушить тимчасову branch `release-ci/<sha>-...` на target SHA, запускає `Full Release Validation` з цього pinned ref, перевіряє, що `headSha` кожного child workflow збігається з target, і видаляє тимчасову branch після завершення запуску. Umbrella verifier також завершується помилкою, якщо будь-який child workflow виконувався на іншому SHA.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка advisory provider/media matrix.

- `minimum` залишає найшвидші OpenAI/core release-critical lanes.
- `stable` додає стабільний provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні conclusions child runs і додає tables найповільніших jobs для кожного child run. Якщо child workflow перезапущено і він став green, перезапустіть лише parent verifier job, щоб оновити результат umbrella і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього попереднього випуску plugin, `release-checks` для кожного дочірнього релізного завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на парасольковому запуску. Це обмежує повторний запуск збійного релізного боксу після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і workflow Docker для релізного шляху live/E2E, і shard приймання пакета. Це зберігає байти пакета узгодженими між релізними боксами й уникає перепакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий запуск. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже відправив, коли батьківський запуск скасовано, тому новіша валідація main
не стоїть у черзі за застарілим двогодинним запуском release-check. Валідація релізних гілок/тегів
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles`, відфільтровані за провайдером
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди audio/video для медіа й музичні шарди, відфільтровані за провайдером

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють наявність бінарних файлів перед налаштуванням. Залишайте live-набори, що спираються на Docker, на звичайних Blacksmith runner’ах — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Live model/backend шарди, що спираються на Docker, використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout workflow job, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, релізний запуск налаштовано неправильно й він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує дерево вихідного коду, тоді як приймання пакета валідує один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 та profile у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, валідує inventory tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли profile вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав його; окремий Telegram dispatch усе ще може встановити опублікований npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опційний Telegram lane завершилися збоєм.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable версій.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний commit SHA. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності в detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness валідовувати старіші довірені source commits без запуску старої workflow-логіки.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker release-path chunks з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin-покриття, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec збережено для окремих dispatch-запусків.

Щодо спеціальної політики тестування оновлень і plugin, зокрема локальних команд,
Docker lanes, inputs Package Acceptance, релізних значень за замовчуванням і тріажу збоїв,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликає Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає докази міграції пакета, оновлення, очищення застарілих plugin dependency, ремонту встановлення налаштованого plugin, offline plugin, plugin-update і Telegram на тому самому розв’язаному package tarball. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти відвантаженого npm-пакета замість артефакта, зібраного за SHA. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` валідує одну опубліковану baseline пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` залишається доступним для ручного ширшого семплінгу зі старішим pre-date anchor. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на fixtures у формі issue для Feishu config, збережених bootstrap/persona файлів, налаштованих установлень OpenClaw plugin, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного очищення опублікованого оновлення, а не нормальної ширини Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.4`, тому докази встановлення й Gateway залишаються на тестовій моделі GPT-5, уникаючи значень за замовчуванням GPT-4.x.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропустити підвипадок persistence для `gateway install --wrapper`, коли пакет не експонує цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, похідного від tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволити міграцію config metadata, водночас і далі вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були відвантажені. Пізніші пакети мають задовольняти сучасні contracts; ті самі умови призводять до failure, а не warning чи skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають Docker/package-поверхні, зміни пакетів/маніфестів вбудованих плагінів або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише в джерельному коді вбудованих плагінів, зміни лише тестів і зміни лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збирання вбудованого розширення та запускає обмежений Docker-профіль вбудованих плагінів із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch-запусків, release checks через workflow-call і pull request, які справді зачіпають installer/package/Docker-поверхні. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, а потім запускає встановлення QR-пакета, root Dockerfile/gateway smoke, installer/update smoke і швидкий Docker E2E для вбудованих плагінів як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push-запуски в `main` (зокрема merge-коміти) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch-запуски `Install Smoke` можуть явно ввімкнути його, але pull request і push-запуски в `main` цього не роблять. QR і Docker-тести інсталятора зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний Node/Git runner для installer/update/plugin-dependency ліній;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                         |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10      | Кількість слотів основного пулу для звичайних ліній.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9       | Ліміт одночасних live-ліній, щоб провайдери не throttling.                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10      | Ліміт одночасних ліній npm install.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7       | Ліміт одночасних багатосервісних ліній.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути штормів створення в Docker daemon; задайте `0` без затримки. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset   | `1` друкує план планувальника без запуску ліній.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за її ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні сукупні preflight-перевірки перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних ліній, зберігають таймінги ліній для впорядкування від найдовших і за замовчуванням припиняють планувати нові pooled-лінії після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; валідує інвентар tarball; збирає та публікує bare/functional GHCR Docker E2E образи з тегом digest пакета через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість перебудови. Завантаження Docker-образів повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Фрагменти релізного шляху

Релізне Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні релізні Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається сукупним ручним псевдонімом повторного запуску для обох provider installer ліній.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path покриття запитує його, і зберігає окремий chunk `openwebui` лише для dispatch-запусків тільки OpenWebUI. Лінії оновлення bundled-channel повторюються один раз для тимчасових мережевих збоїв npm.

Кожен chunk вивантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід workflow `docker_lanes` запускає вибрані лінії на підготовлених образах замість chunk-завдань, що утримує налагодження невдалої лінії в межах одного цільового Docker-завдання й готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані для кожної лінії команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим product/package-покриттям, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push-запуски в `main` і автономні ручні CI dispatch-запуски тримають цей suite вимкненим. Він балансує тести вбудованих плагінів між вісьмома extension workers; ці extension shard-завдання запускають до двох груп конфігурації плагінів одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети плагінів не створювали додаткові CI-завдання. Релізний Docker prerelease path групує цільові Docker-лінії в малі групи, щоб не резервувати десятки runner для завдань на одну-три хвилини.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Agentic parity вкладена в широкі QA та release harnesses, а не є автономним PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким запуском валідації.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, тому що QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. Стандартне значення CLI та ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне Matrix-покриття на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед затвердженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим статусом.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним переглядом репозиторію. Щоденні, ручні та захисні запуски для pull request, що не є чернетками, сканують код workflow Actions, а також найризикованіші поверхні JavaScript/TypeScript із високонадійними запитами безпеки, відфільтрованими до високого/критичного `security-severity`.

Захист pull request лишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високонадійну матрицю безпеки, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основних каналів плюс runtime Plugin каналу, gateway, Plugin SDK, secrets, точки дотику audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні основного SSRF, парсингу IP, захисту мережі, web-fetch і політики SSRF у Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, outbound delivery і шлюзи виконання інструментів агентом                         |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, package-manager install, source-loading і контракту пакета Plugin SDK |

### Платформозалежні шарди безпеки

- `CodeQL Android Critical Security` — запланований шард безпеки Android. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний шард безпеки macOS. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними запусками, бо збірка macOS домінує в часі виконання навіть коли чиста.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний небезпековий шард. Він виконує лише JavaScript/TypeScript-запити якості з severity error і без категорії security на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: PR, що не є чернетками, запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для коду виконання команд/моделей/інструментів агента та dispatch відповідей, коду config schema/migration/IO, коду auth/secrets/sandbox/security, runtime основних каналів і вбудованих Plugin каналів, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або змін у runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять PR-шардів якості.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними hooks для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки auth, secrets, sandbox, cron і gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Контракти config schema, migration, normalization і IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основних каналів і вбудованих Plugin каналів                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Runtime-контракти command execution, model/provider dispatch, auto-reply dispatch і queues та ACP control-plane                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та tool bridges, допоміжні засоби supervision процесів і контракти outbound delivery                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, glue активації memory runtime і команди memory doctor                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини reply queue, session delivery queues, допоміжні засоби outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound reply dispatch у Plugin SDK, допоміжні засоби reply payload/chunking/runtime, channel reply options, delivery queues і session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальне збереження, керівні потоки gateway і runtime-контракти task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, media IO, media understanding, image-generation і media-generation                                                   |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та допоміжні засоби контракту пакета plugin                                                                        |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво керована лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний не-bot запуск CI після push на `main` може його ініціювати, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent був створений протягом останньої години. Коли він виконується, він переглядає діапазон commit від попереднього source SHA непропущеного Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний не-bot запуск CI після push на `main` може його ініціювати, але він пропускається, якщо інший виклик workflow-run уже запускався або виконується цього UTC-дня. Ручний dispatch обходить цей щоденний activity gate. Лінія створює grouped Vitest performance report для повного suite, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням coverage замість широких refactor, потім повторно запускає звіт повного suite і відхиляє зміни, що зменшують базову кількість passing tests. Якщо базова лінія має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія rebase валідований patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму safety posture drop-sudo, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land очищення дублікатів. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged, і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область платформи CI:

- зміни core production запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core test запускають лише typecheck core test плюс core lint;
- зміни extension production запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension test запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core contracts (sweeps Vitest extension лишаються явною test work);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі root/config зміни fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі edits тестів запускають самі себе, edits source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Testbox validation

Запускайте Testbox з кореня репозиторію й надавайте перевагу свіжому прогрітому середовищу для широкої перевірки. Перш ніж витрачати повільний gate на середовище, яке було повторно використане, протерміноване або щойно повідомило про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині цього середовища.

Перевірка sanity швидко завершується з помилкою, коли зникають потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть це середовище й прогрійте свіже, замість налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних відмінностей.

Crabbox — це другий, керований репозиторієм, шлях до віддаленого середовища для перевірки Linux, коли Blacksmith недоступний або коли бажаніше використати власні хмарні ресурси. Прогрійте середовище, гідруйте його через робочий процес проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові налаштування провайдера, синхронізації та гідрації GitHub Actions. Він виключає локальний `.git`, щоб гідрований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних maintainer-remote та сховищ об’єктів, а також виключає локальні артефакти runtime/build, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` підвантажують як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
