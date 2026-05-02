---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або переспрямування активності GitHub
summary: Граф завдань CI, гейти області дії, релізні парасольки та локальні відповідники команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T16:50:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43af330938cc44b642678e2e76c9cbffbf507fe3ef7db1f95ce5ca2a08f08da
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли зміни стосуються лише непов’язаних областей. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження scope і розгортають повний граф для release candidates та широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається тільки з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                      | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, changed scopes, changed extensions і будує CI manifest                         | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                       | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                                       | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                                 | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused-file                                        | Зміни, релевантні для Node         |
| `build-artifacts`                | Збирає `dist/`, Control UI, built-artifact checks і reusable downstream artifacts                                | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                                    | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                                             | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes                                  | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke                | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards                        | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                      | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                                         | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                          | Ручний CI dispatch для релізів     |
| `check-docs`                     | Перевірки форматування документації, lint і broken-link                                                           | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                           | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Windows-specific process/path tests плюс регресії shared runtime import specifier                                | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                           | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                                    | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація slow-test у Codex після trusted activity                                                      | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти Kova runtime performance із mock-provider, deep-profile і GPT 5.4 live lanes             | Scheduled і manual dispatch        |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI noise, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно звітують про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і маршрутизація

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожну scoped area було змінено.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не примушують виконувати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, Plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts виконуються як три weighted shards, small core unit lanes паруються, auto-reply запускається як чотири balanced workers (із розбиттям reply subtree на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі independent guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із BuildConfig flags для SMS/call-log, уникаючи duplicate debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим pnpm minimum release age для встановлення через `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності repository OpenClaw до ClawSweeper. Він не виконує checkout і не запускає ненадійний код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на pushes до `main`;
- `github_activity` для загальної активності GitHub, яку agent ClawSweeper може inspect.

Lane `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, якщо вони є. Вона навмисно не пересилає full webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для agent ClawSweeper.

General activity — це observation, а не delivery-by-default. Agent ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли event є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають давати `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як untrusted data в усьому цьому path. Вони є input для summarization і triage, а не instructions для workflow або agent runtime.

## Manual dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайна CI, але примусово вмикають кожну не-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Автономні ручні запуски CI виконують лише Android із `include_android=true`; повний релізний umbrella вмикає Android, передаючи `include_android=true`. Статичні передрелізні перевірки Plugin, релізний shard `agentic-plugins`, повний пакетний sweep extension і передрелізні Docker lanes Plugin виключено з CI. Передрелізний Docker suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну групу concurrency, щоб повний suite release-candidate не було скасовано іншим запуском push або PR на тому самому ref. Необов’язковий вхідний параметр `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, shards `check`, окрім lint, shards і агрегати `check-additional`, Node test aggregate verifiers, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

Workflow встановлює OCM із pinned release і Kova з pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фейковою OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і agent-turn hotspots.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і пам’ять для випадків запуску default, hook і 50-plugin; повторювані mock-OpenAI loops `channel-chat-baseline` hello; і команди CLI startup проти запущеного gateway. Markdown-зведення source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts до `openclaw/clawgrit-reports` у `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом". Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей профілів, artifacts і
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
публікує тимчасовий branch `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з ціллю, і видаляє тимчасовий branch, коли
запуск завершується. Umbrella verifier також завершується з помилкою, якщо будь-який child workflow працював на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` залишає найшвидші OpenAI/core release-critical lanes.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки child run і додає таблиці slowest-job для кожного child run. Якщо child workflow повторно запущено і він став зеленим, повторно запустіть лише parent verifier job, щоб оновити результат umbrella і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього завдання повного CI, `plugin-prerelease` лише для дочірнього завдання попереднього релізу Plugin, `release-checks` для кожного дочірнього релізного завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` на парасольковому workflow. Це утримує повторний запуск невдалого релізного бокса в обмежених межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow релізного шляху для live/E2E, і до шарду приймання пакета. Це зберігає байти пакета узгодженими між релізними боксами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже відправив, коли батьківський скасовано, тому новіша валідація main
не очікує за застарілим двогодинним запуском release-check. Валідація релізних гілок/тегів
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке покриття нативних `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за провайдером завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди media audio/video та відфільтровані за провайдером music шарди

Це зберігає те саме файлове покриття, водночас роблячи повільні збої live-провайдерів простішими для повторного запуску й діагностики. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з Docker-підтримкою на звичайних раннерах Blacksmith — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Live model/backend шарди з Docker-підтримкою використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає й публікує цей образ, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди виконуються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скрипта нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, релізний запуск налаштовано неправильно, і він витрачатиме час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` витягує `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує package-digest Docker-образи й запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; автономний dispatch Telegram усе ще може встановити опублікований npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опційний Telegram lane зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірені `package_ref` branch, tag або full commit SHA. Resolver витягує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює deps у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його слід надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec збережено для автономних dispatch.

Для спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker lanes, вхідними даними Package Acceptance, релізними типовими налаштуваннями та triage збоїв,
див. [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликає Package Acceptance з `source=artifact`, підготовленим release package artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це утримує докази міграції пакета, оновлення, очищення залежностей застарілих plugin, ремонту встановлення налаштованих plugin, offline plugin, plugin-update і Telegram на тому самому розв’язаному package tarball. Cross-OS release checks і далі покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один опублікований package baseline за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, типово `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Встановіть `published_upgrade_survivor_baselines=release-history`, щоб розгорнути lane на дедупліковану history matrix: останні шість stable releases, `2026.4.23` і останній stable release до `2026-03-15`. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona files, налаштованих встановлень OpenClaw plugin, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується exhaustive published update cleanup, а не звичайної широти Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого recipe команди `openclaw config set`, записує recipe steps у `summary.json` і перевіряє `/healthz`, `/readyz` та RPC status після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4`, тому докази install і gateway залишаються на GPT-5 test model, уникаючи GPT-4.x defaults.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропустити subcase persistence для `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може прибрати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може залогувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти migration config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були доставлені. Пізніші пакети мають відповідати modern contracts; ті самі умови завершуються failure замість warn або skip.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної release validation.

## Перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє покриття smoke-перевірок на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються поверхонь Docker/package, змін пакетів/маніфестів вбудованих Plugin, або поверхонь core Plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді вбудованих Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg вбудованого extension і запускає обмежений Docker-профіль вбудованих Plugin із 240-секундним агрегованим таймаутом команди (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** залишає встановлення QR package і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull requests, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі jobs, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічного запуску або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` цього не роблять. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для lanes інсталятора/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для lanes звичайної функціональності.

Визначення Docker lanes розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10      | Кількість слотів main-pool для звичайних lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Кількість слотів tail-pool, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9       | Ліміт одночасних live lanes, щоб провайдери не throttling.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10      | Ліміт одночасних npm install lanes.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7       | Ліміт одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Затримка між стартами lanes, щоб уникнути create storms у Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | Резервний таймаут для кожної lane (120 хвилин); вибрані live/tail lanes мають жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset   | `1` друкує scheduler plan без запуску lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset   | Список точних lanes, розділених комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний cap, усе одно може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Локальний aggregate preflights Docker, видаляє застарілі OpenClaw E2E containers, виводить active-lane status, зберігає таймінги lanes для сортування longest-first і за замовчуванням припиняє планування нових pooled lanes після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact із поточного запуску, або завантажує package artifact із `package_artifact_run_id`; перевіряє inventory tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість перебудови. Docker image pulls повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторився, а не споживав більшість критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли повне release-path coverage запитує його, і зберігає окремий chunk `openwebui` лише для dispatches тільки OpenWebUI. Bundled-channel update lanes повторюють запуск один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує налагодження failed-lane одним targeted Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, targeted job локально збирає live-test image для цього повторного запуску. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane могла повторно використати точні package та images з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається через `Full Release Validation` або явно оператором. Звичайні pull requests, пуші в `main` і автономні ручні CI dispatches тримають цей suite вимкненим. Він балансує тести вбудованих Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у невеликі groups, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручному dispatch; він збирає private QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгалужує mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, тому що QA parity окремо покриває memory behavior; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test сприймайте це як optional signal і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним repository sweep. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript surfaces із найвищим ризиком, використовуючи high-confidence security queries, відфільтровані до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базова перевірка автентифікації, секретів, пісочниці, cron і gateway                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу, а також runtime Plugin каналу, gateway, Plugin SDK, секрети й точки дотику аудиту            |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики SSRF для ядра SSRF, розбору IP, мережевого захисту, web-fetch і Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                           |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення менеджером пакетів, завантаження джерел і контракту пакета Plugin SDK |

### Безпекові шарди, специфічні для платформ

- `CodeQL Android Critical Security` — запланований Android-шард безпеки. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, який приймає workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS-шард безпеки. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишений поза щоденними типовими перевірками, бо збірка macOS домінує в часі виконання навіть коли чиста.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний небезпековий шард. Він запускає лише JavaScript/TypeScript-запити якості з рівнем серйозності error і без безпекового фокуса на вузьких поверхнях високої цінності на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та диспетчеризації відповідей, коді схеми/міграції/IO конфігурації, коді автентифікації/секретів/пісочниці/безпеки, основному каналі й runtime bundled channel Plugin, протоколі Gateway/server-method, memory runtime/SDK glue, MCP/процесах/вихідній доставці, runtime провайдера/каталозі моделей, діагностиці сеансів/чергах доставки, завантажувачі Plugin, контракті Plugin SDK/пакета або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять PR-шардів якості.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні hooks для запуску одного шарда якості ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, cron і Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel Plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти ACP control-plane                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери й мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасади memory runtime, псевдоніми memory Plugin SDK, зв’язка активації memory runtime і команди memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і CLI-контракти session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime відповідей, параметри відповідей каналу, черги доставки й допоміжні засоби прив’язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдера, типові значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальна сталість, потоки керування Gateway і runtime-контракти task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, media IO, media understanding, генерації зображень і генерації медіа                                                 |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане package-side джерело Plugin SDK і допоміжні засоби контракту пакета Plugin                                                                            |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення безпекового сигналу. Розширення CodeQL для Swift, Python і bundled Plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована lane обслуговування Codex для підтримання наявної документації узгодженою з нещодавно landed changes. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже посунувся далі або коли інший непропущений запуск Docs Agent був створений за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені від останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push від небота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже запускався або виконується того UTC-дня. Manual dispatch обходить цей щоденний gate активності. Lane створює згрупований звіт продуктивності Vitest для всього suite, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для всього suite і відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні збої, а after-agent звіт для всього suite має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде landed, lane rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати таку саму drop-sudo safety posture, як docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний workflow maintainer для очищення дублікатів після land. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільне referenced issue, або перекривні changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Логіка локальних changed-lane міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел надають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із явних mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через основні reply tests плюс Discord і Slack delivery regressions, щоб спільна зміна типового значення падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня repo й надавайте перевагу свіжій прогрітій box для широкого доказу. Перш ніж витрачати повільний gate на box, яку було повторно використано, термін дії якої минув або яка щойно повідомила про несподівано великий sync, спочатку запустіть `pnpm testbox:sanity` усередині box.

Sanity check швидко падає, коли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість того, щоб налагоджувати product test failure. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий шлях віддаленого box-середовища, що належить репозиторію, для перевірки в Linux, коли Blacksmith недоступний або коли бажано використати власні хмарні ресурси. Прогрійте box, гідруйте його через проєктний workflow, а потім виконуйте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає стандартні значення для провайдера, синхронізації та гідрації GitHub Actions. Він виключає локальний `.git`, щоб гідрований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних для мейнтейнера віддалених репозиторіїв і сховищ об’єктів, а також виключає локальні артефакти runtime/build, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
