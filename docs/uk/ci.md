---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується помилкою
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або переспрямування активності GitHub
summary: Граф завдань CI, обмеження за областю, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-07-04T18:18:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Канонічні push до `main` спершу проходять 90-секундне вікно допуску hosted-runner.
Наявна група конкурентності `CI` скасовує цей запуск, що очікує, коли надходить новіший commit, тому послідовні merge не реєструють кожен повну матрицю Blacksmith. Pull request і ручні dispatch пропускають очікування. Потім завдання `preflight` класифікує diff і вимикає дорогі напрями, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidate та широкої перевірки. Android-напрями залишаються opt-in через `include_android`. Покриття Plugin лише для релізів розміщене в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної релізної перевірки`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                           | Призначення                                                                                               | Коли запускається                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в документації, змінені scopes, змінені extensions і будує CI manifest                 | Завжди для non-draft push і PR                     |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push до `main` перед реєстрацією роботи Blacksmith            | Кожен CI-запуск; sleep лише для канонічних push до `main` |
| `security-fast`                    | Виявлення приватних ключів, аудит змінених workflow через `zizmor` і аудит production lockfile            | Завжди для non-draft push і PR                     |
| `check-dependencies`               | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                    | Зміни, релевантні для Node                         |
| `build-artifacts`                  | Збирання `dist/`, Control UI, smoke checks зібраного CLI, перевірки вбудованих build-artifact і reusable artifacts | Зміни, релевантні для Node                         |
| `checks-fast-core`                 | Швидкі Linux-напрями коректності, як-от bundled, protocol, QA Smoke CI і перевірки CI-routing             | Зміни, релевантні для Node                         |
| `checks-fast-contracts-plugins-*`  | Дві shard-перевірки контрактів Plugin                                                                     | Зміни, релевантні для Node                         |
| `checks-fast-contracts-channels-*` | Дві shard-перевірки контрактів каналів                                                                    | Зміни, релевантні для Node                         |
| `checks-node-core-*`               | Shards тестів Core Node, без напрямів channel, bundled, contract і extension                              | Зміни, релевантні для Node                         |
| `check-*`                          | Sharded еквівалент основного локального gate: production types, lint, guards, test types і strict smoke   | Зміни, релевантні для Node                         |
| `check-additional-*`               | Архітектура, sharded boundary/prompt drift, extension guards, package boundary і runtime topology         | Зміни, релевантні для Node                         |
| `checks-node-compat-node22`        | Збірка сумісності з Node 22 і smoke-напрям                                                                | Ручний CI dispatch для релізів                     |
| `check-docs`                       | Форматування документації, lint і перевірки битих посилань                                                | Змінено документацію                               |
| `skills-python`                    | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python-skills                |
| `checks-windows`                   | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier                  | Зміни, релевантні для Windows                      |
| `macos-node`                       | macOS TypeScript test lane зі спільними зібраними artifacts                                               | Зміни, релевантні для macOS                        |
| `macos-swift`                      | Swift lint, build і тести для застосунку macOS                                                            | Зміни, релевантні для macOS                        |
| `ios-build`                        | Генерація Xcode project плюс simulator build застосунку iOS                                               | Застосунок iOS, shared app kit або зміни Swabble   |
| `android`                          | Unit-тести Android для обох flavors плюс один debug APK build                                             | Зміни, релевантні для Android                      |
| `test-performance-agent`           | Щоденна оптимізація повільних тестів Codex після довіреної активності                                     | Успіх Main CI або ручний dispatch                  |
| `openclaw-performance`             | Щоденні/on-demand Kova runtime performance reports із mock-provider, deep-profile і live-напрямами GPT 5.5 | Заплановано та ручний dispatch                     |

## Порядок fail-fast

1. `runner-admission` очікує лише для канонічних push до `main`; новіший push скасовує запуск до реєстрації Blacksmith.
2. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
4. `build-artifacts` перекривається зі швидкими Linux-напрямами, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
5. Важчі platform і runtime напрями розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push надходить до того самого PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Matrix jobs використовують `fail-fast: false`, а `build-artifacts` звітує про збої embedded channel, core-support-boundary і gateway-watch напряму замість постановки в чергу малих verifier jobs. Автоматичний ключ конкурентності CI має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші запуски main. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші завдання, failures і fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий run summary як artifact `ci-timings-summary`. Для build timing перевіряйте крок `Build dist` у завданні `build-artifacts`: `pnpm build:ci-artifacts` друкує `[build-all] phase timings:` і включає `ui:build`; завдання також завантажує artifact `startup-memory`.

Для запусків pull request кінцеве завдання timing-summary запускає helper із довіреної базової revision перед передаванням `GH_TOKEN` до `gh run view`. Це утримує tokened query поза кодом, контрольованим branch, але все одно підсумовує поточний CI-запуск pull request.

## PR context і evidence

PR зовнішніх contributor запускають gate PR context і evidence з
`.github/workflows/real-behavior-proof.yml`. Workflow checkout довірений
base commit і оцінює лише тіло PR; він не виконує код із
branch contributor.

Gate застосовується до авторів PR, які не є власниками repository, members,
collaborators або bots. Він проходить, коли тіло PR містить авторські розділи
`What Problem This Solves` і `Evidence`. Evidence може бути сфокусованим
тестом, результатом CI, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Тіло надає intent і корисну validation;
reviewers перевіряють код, тести й CI, щоб оцінити correctness.

Коли check падає, оновіть тіло PR замість push ще одного code commit.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують Windows, iOS, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML files, composite-action interpolation guard і conflict-marker guard. PR-scoped завдання `security-fast` також запускає `zizmor` для змінених workflow files, щоб workflow security findings падали рано в основному графі CI.
- **Документація на push до `main`** перевіряється standalone workflow `Docs` з тим самим дзеркалом документації ClawHub, яке використовує CI, тому змішані push code+docs не ставлять додатково в чергу shard CI `check-docs`. Pull requests і manual CI все ще запускають `check-docs` із CI, коли документацію змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тому він покриває і deterministic fixture lane `TuiBackend`, і повільніший smoke `tui --local`, який mock лише external model endpoint.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування helper/test-routing контрактів Plugin** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання напряму перевіряє.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, Plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти plugin і контракти каналів виконуються як два зважені shard-и з підтримкою Blacksmith кожен зі стандартним fallback на GitHub runner, швидкі/support lane-и core unit виконуються окремо, core runtime infra розділено між state, process/config, shared і трьома cron domain shard-ами, auto-reply виконується як збалансовані workers (із розділенням reply-піддерева на shard-и agent-runner, dispatch і commands/state-routing), а agentic gateway/server конфігурації розділено між lane-ами chat/auth/model/http-plugin/runtime/startup замість очікування на зібрані артефакти. Звичайний CI потім пакує лише ізольовані infra include-pattern shard-и в детерміновані bundle-и щонайбільше по 64 тестові файли, зменшуючи матрицю Node без об’єднання неізольованих command/cron, stateful agents-core або gateway/server suite-ів; важкі фіксовані suite-и залишаються на 8 vCPU, тоді як bundle-овані та менш навантажені lane-и використовують 4 vCPU. Pull request-и в канонічному репозиторії використовують додатковий компактний admission plan: ті самі групи для кожної конфігурації виконуються в ізольованих subprocess-ах у межах поточного Linux Node плану з 34 завдань, тож один PR не реєструє повну матрицю Node із понад 70 завдань. Push-и в `main`, ручні dispatch-и та release gate-и зберігають повну матрицю. Широкі browser, QA, media і різні plugin-тести використовують свої виділені конфігурації Vitest замість спільного plugin catch-all. Include-pattern shard-и записують записи таймінгів із назвою CI shard-а, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого shard-а. `check-additional-*` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; список boundary guard-ів розподілено смугами на один prompt-heavy shard і один комбінований shard для решти guard stripes, кожен із яких паралельно запускає вибрані незалежні guard-и та друкує таймінги для кожної перевірки. Дорога перевірка drift-у Codex happy-path prompt snapshot виконується як окреме додаткове завдання лише для ручного CI та змін, що впливають на prompt-и, тож звичайні непов’язані зміни Node не чекають за холодною генерацією prompt snapshot, а boundary shard-и залишаються збалансованими, поки prompt drift усе ще прив’язаний до PR, який його спричинив; той самий прапорець пропускає генерацію prompt snapshot Vitest усередині built-artifact core support-boundary shard-а. Gateway watch, тести каналів і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Після допуску канонічний Linux CI дозволяє до 24 одночасних завдань тестів Node і
12 для менших fast/check lane-ів; Windows і Android залишаються на двох, бо
ці пули runner-ів вужчі.

Компактний PR-план створює 18 завдань Node для поточного suite-а: групи
цілих конфігурацій пакетуються в ізольовані subprocess-и з batch timeout 120 хвилин,
тоді як include-pattern групи спільно використовують той самий обмежений бюджет завдань.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig прапорцями SMS/call-log, уникаючи дублювання завдання пакування debug APK на кожен push, релевантний для Android.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, зафіксований на найновішій версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file знахідки Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий allowlist entry, водночас зберігаючи навмисні динамічні plugin, generated, build, live-test і package bridge поверхні, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є цільовим bridge-ем з активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request-а. Workflow створює token GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch-ить компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири lane-и:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit-а під час push-ів у `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Lane `github_activity` пересилає лише нормалізовані метадані: тип події, дію, actor, репозиторій, номер item-а, URL, заголовок, стан і короткі уривки для коментарів або review, коли вони є. Він навмисно не пересилає повне webhook body. Workflow-отримувач у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до hook-а OpenClaw Gateway для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt-і й має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, ризикована або операційно корисна. Рутинні відкриття, редагування, bot churn, дубльований webhook noise і звичайний review traffic мають давати `NO_REPLY`.

Упродовж усього цього шляху розглядайте заголовки GitHub, коментарі, body, review text, назви branch-ів і commit messages як недовірені дані. Це вхідні дані для узагальнення й triage, а не інструкції для workflow або agent runtime.

## Ручні dispatch-и

Ручні CI dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожен scoped lane, крім Android: Linux Node shard-и, bundled-plugin shard-и, plugin і channel contract shard-и, сумісність Node 22, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build і Control UI i18n. Окремі ручні CI dispatch-и запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lane-и виключено з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch-ить окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запускі використовують унікальну concurrency group, щоб повний suite release-candidate не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному caller-у запустити цей граф проти branch-а, tag-а або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Щомісячний шлях extended-stable лише для npm є винятком: dispatch-те і preflight `OpenClaw NPM
Release`, і `Full Release Validation` з точної
branch `extended-stable/YYYY.M.33`, збережіть їхні run ID і передайте обидва ID до
прямого npm publish run. Див. [Щомісячна extended-stable
публікація лише для npm](/uk/reference/RELEASING#monthly-npm-only-extended-stable-publication), щоб отримати
команди, точні вимоги до ідентичності, registry readback і процедуру
repair selector-а. Цей шлях не dispatch-ить plugin, macOS, Windows, GitHub
Release, private dist-tag або іншу platform publication.

## Runner-и

| Runner                          | Завдання                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ручний CI dispatch і fallback-и для неканонічного репозиторію, сканування якості CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, docs workflow-и поза CI та install-smoke preflight, щоб матриця Blacksmith могла ставати в чергу раніше                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менш навантажені extension shard-и, `checks-fast-core` крім QA Smoke CI, plugin/channel contract shard-и, більшість bundled/менш навантажених Linux Node shard-ів, `check-guards`, `check-prod-types`, `check-test-types`, вибрані shard-и `check-additional-*` і `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі Linux Node suite-и, boundary/extension-heavy shard-и `check-additional-*` і `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` у CI та Testbox, `check-lint` (достатньо CPU-чутливий, що 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування черги на 32 vCPU коштував більше, ніж заощаджував)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks fallback-ять на `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; forks fallback-ять на `macos-26`                                                                                                                                                                                                                     |

## Бюджет реєстрації runner-ів

Поточний bucket OpenClaw для реєстрації GitHub runner-ів повідомляє 10 000 self-hosted
runner registrations за 5 хвилин у `ghx api rate_limit`. Повторно перевіряйте
`actions_runner_registration` перед кожним проходом tuning, бо GitHub може змінити
цей bucket. Ліміт спільний для всіх реєстрацій Blacksmith runner-ів в організації
`openclaw`, тож додавання ще однієї інсталяції Blacksmith не додає
нового bucket-а.

Розглядайте labels Blacksmith як дефіцитний ресурс для burst control. Завдання, які
лише route-ять, notify-ять, summarize-ять, select shard-и або запускають короткі CodeQL scans, мають
залишатися на GitHub-hosted runner-ах, якщо вони не мають виміряних специфічних для Blacksmith
потреб. Будь-яка нова матриця Blacksmith, більший `max-parallel` або high-frequency
workflow має показати свій worst-case registration count і тримати org-level
target нижче приблизно 60% live bucket-а. З поточним bucket-ом у 10 000 реєстрацій
це означає operating target у 6 000 реєстрацій, залишаючи запас для
паралельних репозиторіїв, retry-ів і burst overlap.

CI канонічного репозиторію залишає Blacksmith як default runner path для звичайних запусків push і pull-request. `workflow_dispatch` і запуски неканонічного репозиторію використовують GitHub-hosted runner-и, але звичайні канонічні запуски наразі не перевіряють стан черги Blacksmith і автоматично не fallback-ять на GitHub-hosted labels, коли Blacksmith недоступний.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` — це робочий процес продуктивності продукту/runtime. Він запускається щодня на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний запуск зазвичай вимірює продуктивність ref робочого процесу. Задайте `target_ref`, щоб виміряти продуктивність тега релізу або іншої гілки з поточною реалізацією робочого процесу. Шляхи опублікованих звітів і вказівники на останні версії ключуються протестованим ref, а кожен `index.md` фіксує протестовані ref/SHA, ref/SHA робочого процесу, ref Kova, профіль, режим auth для lane, модель, кількість повторів і фільтри сценаріїв.

Робочий процес установлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` за зафіксованим вхідним значенням `kova_ref`, а потім запускає три lane:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фіктивною OpenAI-сумісною auth.
- `mock-deep-profile`: профілювання CPU/heap/trace для startup, gateway і гарячих точок agent-turn.
- `live-openai-candidate`: реальний agent turn OpenAI `openai/gpt-5.5`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає нативні для OpenClaw проби source після проходу Kova: вимірювання часу запуску Gateway і пам’яті для стандартного запуску, запуску з hook і запуску з 50 Plugin; RSS імпорту вбудованих Plugin, повторювані цикли hello mock-OpenAI `channel-chat-baseline`, команди запуску CLI проти запущеного Gateway і smoke-пробу продуктивності стану SQLite. Коли попередній опублікований звіт source mock-provider доступний для протестованого ref, підсумок source порівнює поточні значення RSS і heap із цим baseline і позначає великі збільшення RSS як `watch`. Markdown-підсумок проби source розміщується в `source/index.md` у пакеті звіту, поруч із сирим JSON.

Кожен lane завантажує артефакти GitHub. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, робочий процес також комітить `report.json`, `report.md`, пакети, `index.md` і артефакти source-probe в `openclaw/clawgrit-reports` у `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний вказівник tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний робочий процес `CI` із цією ціллю, запускає `Plugin Prerelease` для proof лише для релізних Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, перевірок пакетів між ОС, рендерингу maturity scorecard з доказів QA profile, QA Lab parity, Matrix і lane Telegram. Профілі stable і full завжди включають вичерпне live/E2E та Docker release-path soak покриття; beta-профіль може ввімкнути його через `run_release_soak=true`. Канонічний package Telegram E2E запускається всередині Package Acceptance, тому повний кандидат не стартує дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати опублікований npm-пакет у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторної збірки. Використовуйте `npm_telegram_package_spec` лише для сфокусованого повторного запуску Telegram на опублікованому пакеті. Live package lane Plugin Codex за замовчуванням використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, тоді як SHA/artifact-запуски пакують `extensions/codex` з вибраного ref. Задайте `codex_plugin_spec` явно для кастомних джерел Plugin, таких як специфікації `npm:`, `npm-pack:` або `git:`.

Див. [Повну перевірку релізу](/uk/reference/full-release-validation), щоб переглянути
матрицю етапів, точні назви jobs робочого процесу, відмінності профілів, артефакти та
handles для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний мутаційний робочий процес релізу. Запускайте його
з `release/YYYY.M.PATCH` або `main` після створення тега релізу та після успішного
preflight OpenClaw npm. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публіковних пакетів Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Stable publish також
вимагає точний `windows_node_tag`; робочий процес перевіряє Windows source
release і порівнює його інсталятори x64/ARM64 із підтвердженим кандидатом
вхідним значенням `windows_node_installer_digests` перед будь-яким дочірнім publish, а потім просуває
й перевіряє ті самі зафіксовані digests інсталяторів, а також точний companion asset
і контракт checksum перед публікацією чернетки релізу GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для proof зафіксованого коміту на швидкозмінній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs dispatch у робочих процесах GitHub мають бути гілками або тегами, а не сирими SHA комітів.
Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` із цього зафіксованого ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
запуску. Парасольковий verifier також падає, якщо будь-який дочірній робочий процес запускався на
іншому SHA.

`release_profile` керує широтою live/provider, яку передають у release checks. Ручні
робочі процеси релізу за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка advisory provider/media matrix. Stable і full
release checks завжди запускають вичерпний live/E2E і Docker release-path soak;
beta-профіль може ввімкнути це через `run_release_soak=true`.

- `minimum` залишає найшвидші критичні для релізу lane OpenAI/core.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Парасолька записує ids запущених дочірніх run, а фінальний job `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших jobs для кожного дочірнього run. Якщо дочірній робочий процес перезапущено і він стає green, перезапустіть лише parent verifier job, щоб оновити результат парасольки й підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` на парасольці. Це утримує повторний запуск невдалого release box обмеженим після сфокусованого виправлення. Для одного невдалого cross-OS lane поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а підсумки packaged-upgrade включають таймінги за фазами. QA release-check lanes є advisory, крім стандартного runtime tool coverage gate, який блокує, коли потрібні динамічні інструменти OpenClaw drift або зникають зі standard tier summary.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт у cross-OS checks і Package Acceptance, а також у live/E2E release-path Docker workflow, коли запускається soak coverage. Це забезпечує однакові bytes пакета в release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх jobs. Для Codex npm-plugin live lane release checks або передають відповідну опубліковану специфікацію Plugin, виведену з `release_package_spec`, або передають наданий оператором `codex_plugin_spec`, або залишають вхідне значення порожнім, щоб Docker-скрипт пакував Codex plugin з вибраного checkout.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Parent monitor скасовує будь-який дочірній робочий процес, який
він уже запустив, коли parent скасовано, тому новіша main validation
не стоїть за застарілим двогодинним release-check run. Перевірка release branch/tag
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного job:

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
- розділені media audio/video shards і music shards, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному робочим процесом `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Залишайте Docker-backed live suites на звичайних Blacksmith runners — container jobs не підходять для запуску вкладених Docker tests.

Live-шарди моделі/backend на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live-процес релізу збирає й публікує цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди самостійно перебудовують повну Docker-ціль вихідного коду, запуск релізу налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальовний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після інсталяції або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумок кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest, коли потрібно, і запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; самостійний dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker-приймання або опційна лінія Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` обов’язковий. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення імена хостів або розв’язані IP-адреси, а також перенаправлення за межі тієї самої публічної політики безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики trusted-source у `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` обов’язкові. Використовуйте це лише для корпоративних дзеркал або приватних репозиторіїв пакетів, якими володіють мейнтейнери, і яким потрібні налаштовані хости, порти, префікси шляхів, хости перенаправлення або розв’язання в приватній мережі. Якщо політика оголошує bearer auth, workflow використовує фіксований secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; облікові дані, вбудовані в URL, усе одно відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його слід надавати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття плагінів, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Опційна лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для самостійних dispatch.

Для спеціальної політики тестування оновлень і плагінів, зокрема локальних команд,
Docker-ліній, вхідних даних Package Acceptance, релізних значень за замовчуванням і triage збоїв,
див. [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це утримує перевірку міграції пакета, оновлення, live-інсталяції Skills з ClawHub, очищення застарілих залежностей плагінів, відновлення інсталяції налаштованого плагіна, offline-плагіна, plugin-update і Telegram на тому самому визначеному tarball пакета. Встановіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю проти відвантаженого npm-пакета без перебудови; встановлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта релізної валідації. Cross-OS release checks усе ще покривають специфічні для ОС onboarding, installer і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Docker-лінія `published-upgrade-survivor` перевіряє одну опубліковану базову версію пакета на запуск у блокувальному release path. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback-опубліковану базу, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цю базу. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири найновіші stable npm-релізи плюс закріплені релізи межі сумісності плагінів і issue-shaped fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, інсталяцій налаштованого OpenClaw-плагіна, шляхів журналів з тильдою і застарілих коренів залежностей legacy-плагінів. Вибірки multi-baseline published-upgrade survivor шардуються за baseline в окремі цільові Docker runner jobs. Окремий workflow `Update Migration` використовує Docker-лінію `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованого оновлення, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Windows-лінії fresh для packaged і installer також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.5`, тож proof інсталяції та Gateway лишається на тестовій моделі GPT-5, уникаючи значень за замовчуванням GPT-4.x.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна legacy compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не експонує цей прапорець;
- `update-channel-switch` може відсікати відсутні pnpm `patchedDependencies` з fake git fixture, виведеного з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування install-record або приймати відсутню persistence install-record marketplace;
- `plugin-update` може дозволяти міграцію конфігураційних metadata, водночас усе ще вимагаючи, щоб install record і поведінка no-reinstall лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні stamp-файли build metadata, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної релізної валідації.

## Інсталяційний smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються поверхонь Docker/пакетів, змін пакета/маніфесту bundled Plugin або поверхонь core Plugin/каналу/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає покриття QR package install і installer Docker/update для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді торкаються installer/package/Docker поверхонь. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі jobs, щоб робота installer не чекала за smoke-перевірками кореневого образу.

Push до `main` (включно з merge commit) не примушує повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-верифікації.

Повільний Bun global install image-provider smoke окремо обмежений `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push до `main` не запускають його. Звичайний PR CI все ще запускає швидку регресійну lane Bun launcher для змін, релевантних Node. Тести QR і installer Docker зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                         |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливих до провайдера.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lanes, щоб провайдери не throttling.                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Ліміт одночасних npm install lanes.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lanes.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути Docker daemon create storms; встановіть `0`, щоб вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної lane (120 хвилин); вибрані live/tail lanes використовують суворіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Список точних lanes через кому; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, все ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальний сукупний запуск виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить статус активних lanes, зберігає timings lanes для впорядкування longest-first і типово припиняє планувати нові pooled lanes після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета з поточного run, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує lanes з установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker image повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшість критичного шляху CI.

### Chunks release-шляху

Release Docker coverage запускає менші jobs chunks з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` до `plugins-runtime-install-h`. `package-update-openai` включає live Codex Plugin package lane, яка встановлює candidate package OpenClaw, встановлює Codex Plugin з `codex_plugin_spec` або same-ref tarball з явним схваленням встановлення Codex CLI, запускає Codex CLI preflight, а потім запускає кілька turns OpenClaw agent в одній сесії проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases plugin/runtime. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли це запитує повне release-path coverage, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюють запуск один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, таблицями slow-lane і командами rerun для кожної lane. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує debugging невдалої lane одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибрана lane є live Docker lane, targeted job збирає live-test image локально для цього rerun. Згенеровані команди GitHub rerun для кожної lane включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала lane могла повторно використати точний package і images з невдалого run.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker suite release-path.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і standalone manual CI dispatch тримають цей suite вимкненим. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу й більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у малі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин. Workflow також завантажує інформаційний artifact `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; findings inspector є input для triage і не змінюють blocking gate Plugin Prerelease.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладена в широкі QA і release harnesses, а не є standalone PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при manual dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, оскільки QA parity покриває memory behavior окремо; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. CLI default і input manual workflow залишаються `all`; manual dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у малий report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence, а не трактуйте parity як обов’язковий status.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code плюс найризикованіші JavaScript/TypeScript поверхні за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` або process-owning bundled Plugin runtime paths, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL залишаються поза PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Автентифікація, секрети, пісочниця, cron і базовий рівень gateway                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основних каналів, а також runtime Plugin каналів, gateway, Plugin SDK, секрети, точки аудиту                  |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF у Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Сервери MCP, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агентів                         |
| `/codeql-security-high/process-exec-boundary`     | Локальна оболонка, допоміжні засоби запуску процесів, runtime bundled plugin, що володіють підпроцесами, і зв’язувальний код workflow-скриптів |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, встановлення через package-manager, source-loading і контракту пакетів Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою коректності workflow. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусканнями, бо macOS-збірка домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний shard безпеки, що не належить до security. Він запускає лише JavaScript/TypeScript quality-запити з error severity, не пов’язані з security, для вузьких високовартісних поверхонь на GitHub-hosted Linux runners, щоб quality-сканування не витрачали бюджет runner-registration Blacksmith. Його guard для pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та диспетчеризації відповідей, schema/migration/IO конфігурації, auth/secrets/sandbox/security, runtime основних каналів і bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код security boundary для автентифікації, секретів, пісочниці, cron і gateway                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація model/provider, диспетчеризація auto-reply і черги, а також runtime-контракти control plane ACP                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і tool bridges, допоміжні засоби process supervision та контракти outbound delivery                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, псевдоніми memory Plugin SDK, зв’язувальний код активації memory runtime і команди memory doctor                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки outbound session, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація inbound reply у Plugin SDK, допоміжні засоби reply payload/chunking/runtime, параметри channel reply, черги доставки та допоміжні засоби session/thread binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, автентифікація та discovery provider, реєстрація provider runtime, provider defaults/catalogs і реєстри web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальна сталість, керівні потоки gateway і runtime-контракти task control-plane                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основних web fetch/search, media IO, media understanding, image-generation і media-generation                                                   |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side source Plugin SDK і допоміжні засоби контракту пакетів plugin                                                                          |

Quality тримається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Workflow обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації в узгодженому стані з нещодавно внесеними змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені після останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Лінія будує згрупований Vitest performance report для full-suite, дозволяє Codex вносити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline count тестів, які проходять. Згрупований звіт записує wall time за конфігурацією і max RSS на Linux та macOS, тож порівняння before/after показує дельти пам’яті тестів поруч із дельтами тривалості. Якщо baseline має failing tests, Codex може виправляти лише очевидні збої, а after-agent full-suite report має проходити перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти таку саму drop-sudo safety posture, як docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для прибирання дублікатів після land. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змерджено і що кожен duplicate має або спільну referenced issue, або перекриття changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо architecture boundaries, ніж широкий CI platform scope:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають тільки core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають цільові перевірки version/config/root-dependency;
- невідомі root/config changes fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, source edits віддають перевагу explicit mappings, а потім sibling tests і import-graph dependents. Shared group-room delivery config — одне з explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Testbox validation

Crabbox — це віддалена обгортка для віддалених машин, якою володіє репозиторій, для maintainer-перевірок у Linux. Використовуйте її
з кореня репозиторію, коли перевірка надто широка для локального циклу редагування, коли важлива
паритетність із CI або коли proof потребує секретів, Docker, package lanes,
повторно використовуваних машин чи віддалених логів. Звичайний backend OpenClaw —
`blacksmith-testbox`; власні потужності AWS/Hetzner є fallback для збоїв Blacksmith,
проблем із квотами або явного тестування на власних потужностях.

Запуски Crabbox-backed Blacksmith прогрівають, резервують, синхронізують, запускають, звітують і прибирають
одноразові Testboxes. Вбудована sanity-перевірка синхронізації швидко завершується з помилкою, коли обов’язкові
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для навмисних PR із великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик Blacksmith CLI, який залишається у
фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передавайте provider явно, навіть якщо `.crabbox.yaml` має owned-cloud defaults. У Codex worktrees або linked/sparse checkouts уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до старту Crabbox; натомість викликайте node-обгортку напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-backed запуски потребують Crabbox 0.22.0 або новішої версії, щоб обгортка отримувала поточну поведінку синхронізації, черги та очищення Testbox. Під час використання sibling checkout перебудуйте ігнорований локальний бінарний файл перед timing або proof роботою:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed gate:

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Прочитайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Для delegated
Blacksmith Testbox запусків код виходу обгортки Crabbox і JSON-підсумок є
результатом команди. Пов’язаний GitHub Actions run відповідає за hydration і keepalive; він
може завершитися як `cancelled`, коли Testbox зупинено зовні після того, як SSH
команда вже повернулася. Вважайте це артефактом очищення/статусу, якщо тільки
`exitCode` обгортки не є ненульовим або вивід команди не показує невдалий тест.
Одноразові Blacksmith-backed Crabbox запуски мають зупиняти Testbox автоматично;
якщо запуск перервано або очищення незрозуміле, перегляньте live machines і зупиніть лише
ті машини, які створили ви:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте reuse лише тоді, коли вам навмисно потрібні кілька команд на тій самій hydrated machine:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є зламаним шаром, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і cleanup. Виправте
шлях Crabbox, перш ніж вважати прямий запуск Blacksmith maintainer proof.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups залишаються `queued` без IP або Actions run URL через кілька хвилин,
вважайте це навантаженням Blacksmith provider, queue, billing або org-limit. Зупиніть
queued ids, які створили ви, не запускайте більше Testboxes і перенесіть proof на
шлях власних потужностей Crabbox нижче, доки хтось перевіряє Blacksmith dashboard,
billing і org limits.

Переходьте на власні потужності Crabbox лише коли Blacksmith не працює, обмежений квотою, не має потрібного середовища або коли власні потужності є явною метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

За навантаження AWS уникайте `class=beast`, якщо завдання справді не потребує CPU класу 48xlarge. Запит `beast` починається зі 192 vCPU і є найпростішим способом перевищити регіональну квоту EC2 Spot або On-Demand Standard. Репозиторний `.crabbox.yaml` за замовчуванням використовує `standard`, кілька capacity regions і `capacity.hints: true`, тож brokered AWS leases виводять вибраний region/market, quota pressure, Spot fallback і попередження про high-pressure class. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от full-suite або all-plugin Docker matrices, явна release/blocker validation чи high-core performance profiling. Не використовуйте `beast` для `pnpm check:changed`, цільових тестів, docs-only роботи, звичайного lint/typecheck, малих E2E repros або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики потужностей, щоб коливання Spot market не змішувалося із сигналом.

`.crabbox.yaml` визначає provider, sync і GitHub Actions hydration defaults для owned-cloud lanes. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` відповідає за checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
