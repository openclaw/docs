---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується помилкою
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні шлюзи області дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T15:53:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cf280f1f46d49462656de86001b7f2bef7c63f133dbb8d208a7497c48fa3497
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі напрями, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для реліз-кандидатів і широкої валідації. Android-напрями залишаються opt-in через `include_android`. Релізне покриття Plugin живе в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної релізної валідації`](#full-release-validation) або явного ручного dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує маніфест CI                | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                             | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                                         | Завжди для нечернеткових push і PR |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                    | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от bundled/plugin-contract/protocol перевірки                        | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди тестів Core Node, без напрямів channel, bundled, contract і extension                               | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke         | Зміни, релевантні для Node         |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch                  | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                                          | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                        | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Напрям сумісності Node 22 зі збіркою і smoke                                                              | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії спільних runtime import specifier              | Зміни, релевантні для Windows      |
| `macos-node`                     | Напрям TypeScript-тестів macOS із використанням спільних зібраних артефактів                              | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                                           | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK збірка                                             | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                     | Успішний Main CI або ручний dispatch |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності runtime Kova з mock-provider, deep-profile і GPT 5.4 live напрямами | Запланований і ручний dispatch     |

## Порядок fail-fast

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перетинається зі швидкими Linux-напрямами, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime напрями: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний ключ concurrency CI версіонований (`CI-v7-*`), тому zombie на боці GitHub у старій групі черги не може нескінченно блокувати новіші main-запуски. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що виконуються.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає виявлення changed-scope і змушує маніфест preflight поводитися так, ніби змінилася кожна scoped-область.

- **Редагування CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не змушують виконувати Windows, Android або macOS native builds; ці platform-напрями залишаються обмеженими змінами platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі plugin contract helper/test-routing редагування** використовують швидкий шлях маніфесту лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання напряму вправляє.
- **Windows Node checks** обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цей напрям; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node напрямах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit напрями об’єднані парами, auto-reply запускається як чотири збалансовані workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node завданнями замість очікування на built artifacts. Широкі browser, QA, media і miscellaneous plugin тести використовують власні виділені конфіги Vitest замість спільного plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test напрям усе одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, закріплений на найновішій версії Knip, з вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production findings Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Guard невикористаних файлів падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist, зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Перенаправлення активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є bridge на боці target із активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує недовірений код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, потім dispatch компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири напрями:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може інспектувати.

Напрям `github_activity` пересилає лише нормалізовані метадані: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони присутні. Він навмисно уникає пересилання повного webhook body. Приймальний workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише коли подія є несподіваною, actionable, ризикованою або операційно корисною. Рутинні відкриття, редагування, bot churn, duplicate webhook noise і звичайний review traffic мають завершуватися `NO_REPLY`.

Сприймайте titles, comments, bodies, review text, branch names і commit messages GitHub як недовірені дані на всьому цьому шляху. Це вхідні дані для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають усі scoped-доріжки, окрім Android: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS та інтернаціоналізацію Control UI. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна release-парасолька вмикає Android, передаючи `include_android=true`. Статичні перевірки попереднього випуску Plugin, release-only шард `agentic-plugins`, повний batch sweep Plugin та Docker-доріжки попереднього випуску Plugin виключено з CI. Docker-набір попереднього випуску запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тому повний набір для release-candidate не скасовується іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному викликачеві запустити цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, верифікатори агрегатів Node-тестів, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує Ubuntu, розміщений у GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо CPU-чутливий, щоб 8 vCPU коштували дорожче, ніж заощаджували); install-smoke Docker-збірки (час очікування в черзі 32-vCPU коштував дорожче, ніж заощаджував)                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він щодня запускається на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із закріпленого release і Kova із закріпленого input `kova_ref`, а потім запускає три доріжки:

- `mock-provider`: діагностичні сценарії Kova проти local-build runtime з детермінованою фейковою OpenAI-сумісною автентифікацією.
- `mock-deep-profile`: CPU/heap/trace профілювання для startup, Gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Кожна доріжка завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles та `index.md` у `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна release-валідація

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед release». Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для release-only proof Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram доріжок. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму доріжку Telegram package проти опублікованого npm package.

Див. [Повна release-валідація](/uk/reference/full-release-validation) для
матриці етапів, точних назв workflow jobs, відмінностей профілів, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запустіть його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того,
як OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable Plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім запускає
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
Helper пушить тимчасовий branch `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` із цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з ціллю, і видаляє тимчасовий branch після завершення
запуску. Umbrella verifier також падає, якщо будь-який child workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` зберігає найшвидші OpenAI/core release-critical доріжки.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні conclusions child runs і додає таблиці найповільніших jobs для кожного child run. Якщо child workflow повторно запущено і він став green, повторно запустіть лише parent verifier job, щоб оновити результат umbrella і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього передрелізу Plugin, `release-checks` для кожного дочірнього релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на парасольковому workflow. Це тримає повторний запуск невдалого релізного середовища обмеженим після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow live/E2E для релізного шляху, і до шарда приймання пакета. Це зберігає байти пакета узгодженими між релізними середовищами та уникає повторного пакування того самого кандидата в кількох дочірніх job.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський workflow скасовано, тож новіша валідація main
не стоїть у черзі за застарілим двогодинним запуском release-check. Валідація релізної гілки/тега
та сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за провайдерами job `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені медіашарди audio/video та відфільтровані за провайдерами музичні шарди

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live-медіашарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа job лише перевіряють двійкові файли перед налаштуванням. Тримайте live-набори з Docker на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Live-шарди моделей/backend на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Release live workflow збирає та публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів нижче за timeout job workflow, щоб завислий контейнер або шлях очищення швидко падав, а не витрачав увесь бюджет release-check. Якщо ці шарди самостійно перебудовують повну source Docker target, релізний запуск налаштований неправильно й марнуватиме час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 та профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest за потреби та запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язало його; самостійний Telegram dispatch усе ще може встановити опублікований npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker-приймання або опційний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний commit SHA `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або релізного тега, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його варто вказувати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені source commits без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec зберігається для самостійних dispatch.

Щодо спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker lanes, вхідними параметрами Package Acceptance, релізними типовими значеннями та triage збоїв,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірку міграції пакета, оновлення, очищення застарілих залежностей Plugin, офлайн Plugin, plugin-update і Telegram на тому самому розв’язаному tarball пакета. Cross-OS release checks все ще покривають специфічні для ОС onboarding, installer і platform behavior; product-валідація пакета/оновлення має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє одну опубліковану baseline пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опубліковану baseline, типово `openclaw@latest`; команди повторного запуску failed-lane зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розгорнути lane на дедупліковану історичну матрицю: останні шість stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі baselines на fixtures у формі issue для конфігурації Feishu, збережених bootstrap/persona files, шляхів журналів із тильдою та застарілих коренів залежностей legacy Plugin. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного очищення опублікованого оновлення, а не звичайної широти Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікований lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. Cross-OS agent-turn smoke OpenAI типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4`, тож перевірка встановлення та Gateway лишається на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна сумісності legacy

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може прибирати відсутні `pnpm.patchedDependencies` із fake git fixture, похідної від tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy locations install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata config, але все ще вимагати, щоб install record і поведінка no-reinstall залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли stamp метаданих збірки, які вже були shipped. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються failure замість warning або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, часові показники фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних ліній Docker замість повторного запуску повної валідації релізу.

## Димова перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє покриття димової перевірки на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/пакетів, змін пакета/маніфесту bundled Plugin або поверхонь основного Plugin/каналу/Gateway/Plugin SDK, які перевіряють завдання димової перевірки Docker. Зміни лише у вихідному коді bundled Plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI-димову перевірку agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled розширення та запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, workflow-call перевірок релізу та pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR образ димової перевірки кореневого Dockerfile, а потім запускає встановлення QR-пакета, димові перевірки кореневого Dockerfile/Gateway, димові перевірки інсталятора/update і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала після димових перевірок кореневого образу.

Пуші в `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидку димову перевірку Docker і залишає повну димову перевірку встановлення для нічного запуску або валідації релізу.

Повільна димова перевірка Bun global install image-provider окремо обмежується через `run_bun_global_install_smoke`. Вона запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `Install Smoke` можуть увімкнути її, але pull request і пуші в `main` цього не роблять. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення ліній Docker містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типове значення | Призначення                                                                                                      |
| ------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів main-pool для звичайних ліній.                                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-pool, чутливих до провайдерів.                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт одночасних live ліній, щоб провайдери не throttled.                                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт одночасних ліній npm install.                                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт одночасних multi-service ліній.                                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами ліній, щоб уникати бур створення Docker daemon; установіть `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано       | `1` виводить план планувальника без запуску ліній.                                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано       | Список точних ліній, розділених комами; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить capacity. Локальні сукупні preflight перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних ліній, зберігають часові показники ліній для впорядкування longest-first і типово припиняють планувати нові pooled лінії після першої невдачі.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує package-digest-tagged bare/functional GHCR Docker E2E образи через кеш Docker layer Blacksmith, коли плану потрібні лінії з установленим пакетом; і повторно використовує надані input `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Завантаження Docker image повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторився замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Docker-покриття релізу запускає менші chunked завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker chunks релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias лінії `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли повне release-path покриття запитує його, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Лінії оновлення bundled-channel повторюють спробу один раз у разі transient npm network failures.

Кожен chunk вивантажує `.artifacts/docker-tests/` із журналами ліній, часовими показниками, `summary.json`, `failures.json`, часовими показниками фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання збирає live-test образ локально для цього rerun. Згенеровані GitHub команди повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і standalone ручні CI dispatches тримають цей suite вимкненим. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI lanes поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається за відповідних змін PR і ручного dispatch; він збирає private QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від затримки live model і звичайного startup provider-plugin. Live transport gateway вимикає memory search, тому що QA parity окремо покриває поведінку пам’яті; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. Типове значення CLI і input ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test розглядайте це як optional signal і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним repository sweep. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code плюс найризиковіші JavaScript/TypeScript surfaces із high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до типових PR перевірок.

### Категорії безпеки

| Категорія                                       | Поверхня                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базовий рівень gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу, а також runtime plugin каналу, gateway, Plugin SDK, secrets, точки дотику аудиту              |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики SSRF для core SSRF, розбору IP, network guard, web-fetch і Plugin SDK                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, вихідна доставка й шлюзи виконання інструментів агента                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, loader, manifest, registry, package-manager install, source-loading і контракту пакета Plugin SDK |

### Shard-и безпеки для окремих платформ

- `CodeQL Android Critical Security` — запланований shard безпеки Android. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний shard безпеки macOS. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними типовими запуском, бо збірка macOS домінує за часом виконання навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний shard не пов’язаний із безпекою. Він запускає лише error-severity, non-security JavaScript/TypeScript quality-запити для вузьких цінних поверхонь на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shard-и `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та dispatch відповіді, схемі config/міграції/IO, auth/secrets/sandbox/security, основному каналі та runtime bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shard-ів.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки Auth, secrets, sandbox, cron і gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Контракти config schema, migration, normalization і IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Runtime-контракти command execution, model/provider dispatch, auto-reply dispatch and queues і ACP control-plane                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та tool bridges, помічники process supervision і контракти outbound delivery                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, glue активації memory runtime і команди memory doctor                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка reply queue, session delivery queues, помічники outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers                |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, provider auth and discovery, provider runtime registration, provider defaults/catalogs і registry web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і runtime-контракти task control-plane                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти core web fetch/search, media IO, media understanding, image-generation і media-generation                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракти entrypoint для loader, registry, public-surface і Plugin SDK                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і помічники контрактів plugin package                                                                          |

Quality лишається окремою від security, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Workflows обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієва maintenance lane Codex для підтримання наявної документації у відповідності з нещодавно злитими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже зрушив далі або коли інший non-skipped Docs Agent run було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може охопити всі зміни main, накопичені з останнього проходу docs.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієва maintenance lane Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується в цей UTC-день. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex вносити лише невеликі performance fixes тестів зі збереженням coverage замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline test count, що проходить. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push буде злитий, lane rebases validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action могла зберегти таку саму drop-sudo safety posture, як docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. Типово це dry-run, і він закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged, і що кожен duplicate має або спільний referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates і changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope платформи CI:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- public Plugin SDK або plugin-contract changes розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі test edits запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config — одне з explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня repo і віддавайте перевагу свіжому warmed box для широкого proof. Перед витратою повільного gate на box, який повторно використали, термін дії якого минув або який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли обов’язкові root files, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження product test failure. Для навмисних PR із великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних змін.

Crabbox — це другий, належний репозиторію, шлях віддаленої машини для підтвердження в Linux, коли Blacksmith недоступний або коли бажаніше використовувати власну хмарну ємність. Прогрійте машину, гідруйте її через робочий процес проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові параметри провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідрований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації локальних для мейнтейнера remote і сховищ об’єктів, а також виключає локальні runtime/build-артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як джерело.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
