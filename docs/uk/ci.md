---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки області дії, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-06-27T17:15:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Канонічні
push до `main` спершу проходять 90-секундне вікно допуску hosted-runner.
Наявна concurrency group `CI` скасовує цей запуск, що очікує, коли з'являється новіший
commit, тож послідовні merge не реєструють кожен повну матрицю Blacksmith.
Pull request і ручні dispatch пропускають очікування. Job `preflight`
потім класифікує diff і вимикає дорогі lanes, коли змінено лише непов'язані
області. Ручні запуски `workflow_dispatch` навмисно обходять розумне
звуження scope і розгортають повний graph для release candidates і широкої
validation. Android lanes залишаються opt-in через `include_android`. Покриття
Plugin лише для release живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease)
і запускається лише з [`Full Release Validation`](#full-release-validation)
або явного ручного dispatch.

## Огляд pipeline

| Job                                | Призначення                                                                                                   | Коли запускається                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest                   | Завжди для не чернеткових push і PR                  |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push до `main` перед реєстрацією роботи Blacksmith                | Кожен CI run; sleep лише для канонічних push до `main` |
| `security-fast`                    | Виявлення private key, аудит змінених workflow через `zizmor` і аудит production lockfile                 | Завжди для не чернеткових push і PR                  |
| `check-dependencies`               | Production-прохід Knip лише для dependencies плюс guard allowlist невикористаних файлів                                 | Зміни, релевантні для Node                               |
| `build-artifacts`                  | Збірка `dist/`, Control UI, smoke checks зібраного CLI, перевірки вбудованих build artifact і reusable artifacts | Зміни, релевантні для Node                               |
| `checks-fast-core`                 | Швидкі Linux lanes коректності, як-от bundled, protocol, QA Smoke CI і перевірки CI-routing                | Зміни, релевантні для Node                               |
| `checks-fast-contracts-plugins-*`  | Дві sharded перевірки контрактів Plugin                                                                        | Зміни, релевантні для Node                               |
| `checks-fast-contracts-channels-*` | Дві sharded перевірки контрактів channel                                                                       | Зміни, релевантні для Node                               |
| `checks-node-core-*`               | Shards тестів core Node, крім channel, bundled, contract і extension lanes                          | Зміни, релевантні для Node                               |
| `check-*`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke                | Зміни, релевантні для Node                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і runtime topology     | Зміни, релевантні для Node                               |
| `checks-node-compat-node22`        | Збірка сумісності Node 22 і smoke lane                                                                | Ручний CI dispatch для release                     |
| `check-docs`                       | Форматування docs, lint і перевірки broken links                                                             | Docs змінено                                        |
| `skills-python`                    | Ruff + pytest для Skills на базі Python                                                                    | Зміни, релевантні для Python Skills                       |
| `checks-windows`                   | Специфічні для Windows тести process/path плюс спільні регресії specifier import у runtime                      | Зміни, релевантні для Windows                            |
| `macos-node`                       | macOS TypeScript test lane зі спільними зібраними artifacts                                               | Зміни, релевантні для macOS                              |
| `macos-swift`                      | Swift lint, build і tests для macOS app                                                            | Зміни, релевантні для macOS                              |
| `ios-build`                        | Генерація Xcode project плюс simulator build iOS app                                                 | iOS app, shared app kit або зміни Swabble         |
| `android`                          | Android unit tests для обох flavors плюс одна debug APK build                                              | Зміни, релевантні для Android                            |
| `test-performance-agent`           | Щоденна оптимізація повільних тестів Codex після trusted activity                                                 | Успіх Main CI або ручний dispatch                  |
| `openclaw-performance`             | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.5 live lanes | Scheduled і ручний dispatch                       |

## Порядок fail-fast

1. `runner-admission` чекає лише на канонічні push до `main`; новіший push скасовує run перед реєстрацією Blacksmith.
2. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко падають без очікування важчих jobs матриці artifacts і platform.
4. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно спільна build буде готова.
5. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Matrix jobs використовують `fail-fast: false`, а `build-artifacts` повідомляє про failures embedded channel, core-support-boundary і gateway-watch напряму замість додавання tiny verifier jobs у чергу. Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші jobs, failures і fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий run summary як artifact `ci-timings-summary`. Для build timing перевірте step `Build dist` у job `build-artifacts`: `pnpm build:ci-artifacts` друкує `[build-all] phase timings:` і включає `ui:build`; job також завантажує artifact `startup-memory`.

Для pull request runs термінальний job timing-summary запускає helper з trusted base revision перед передаванням `GH_TOKEN` до `gh run view`. Це тримає tokened query поза code, контрольованим branch, але все одно підсумовує поточний CI run pull request.

## PR context і evidence

PR зовнішніх contributor запускають gate PR context і evidence з
`.github/workflows/real-behavior-proof.yml`. Workflow check out trusted
base commit і оцінює лише PR body; він не виконує code з
contributor branch.

Gate застосовується до авторів PR, які не є repository owners, members,
collaborators або bots. Він проходить, коли PR body містить авторські
sections `What Problem This Solves` і `Evidence`. Evidence може бути focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Body надає intent і корисну validation;
reviewers перевіряють code, tests і CI, щоб оцінити correctness.

Коли check падає, оновіть PR body замість push ще одного code commit.

## Scope і routing

Scope logic живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідуюють Node CI graph плюс workflow linting, але самі по собі не примушують Windows, iOS, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML files, composite-action interpolation guard і conflict-marker guard. PR-scoped job `security-fast` також запускає `zizmor` для змінених workflow files, щоб workflow security findings падали рано в main CI graph.
- **Docs у push до `main`** перевіряються standalone workflow `Docs` з тим самим docs mirror ClawHub, який використовує CI, тож змішані code+docs push не додають у чергу також shard CI `check-docs`. Pull requests і manual CI все ще запускають `check-docs` з CI, коли docs змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тож покриває як deterministic fixture lane `TuiBackend`, так і повільніший smoke `tui --local`, який mocks лише external model endpoint.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли change обмежена routing або helper surfaces, які fast task вправляє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов'язаний source, plugin, install-smoke і зміни лише в tests залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування ранерів: контракти Plugin і контракти каналів виконуються як два зважені шарди з підтримкою Blacksmith кожен зі стандартним резервним варіантом на ранерах GitHub, швидкі/допоміжні доріжки модульних тестів ядра виконуються окремо, інфраструктуру runtime ядра розділено між state, process/config, shared і трьома доменними шардами cron, auto-reply виконується як збалансовані воркери (з піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing), а конфігурації агентного gateway/server розподілено між доріжками chat/auth/model/http-plugin/runtime/startup замість очікування зібраних артефактів. Звичайний CI потім пакує лише ізольовані інфраструктурні шарди include-pattern у детерміновані пакети щонайбільше по 64 тестові файли, зменшуючи матрицю Node без об’єднання неізольованих наборів command/cron, stateful agents-core або gateway/server; важкі фіксовані набори залишаються на 8 vCPU, а пакетовані та легші доріжки використовують 4 vCPU. Pull request-и в канонічному репозиторії використовують додатковий компактний план допуску: ті самі групи per-config виконуються в ізольованих підпроцесах у межах поточного Linux Node-плану на 34 завдання, тому один PR не реєструє повну матрицю Node на понад 70 завдань. Пуші в `main`, ручні dispatch-и та release gate-и зберігають повну матрицю. Широкі браузерні, QA, медійні та різні тести Plugin використовують свої виділені конфігурації Vitest замість спільного catch-all для Plugin. Шарди include-pattern записують записи таймінгів із назвою CI-шарда, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого шарда. `check-additional-*` тримає разом compile/canary-роботу на межах пакетів і відокремлює архітектуру runtime-топології від покриття Gateway watch; список boundary guard розмічено на один shard із великим навантаженням промптів і один комбінований shard для решти смуг guard, кожен із яких паралельно запускає вибрані незалежні guard-и та друкує таймінги для кожної перевірки. Дорога перевірка дрейфу знімка промпта Codex happy-path виконується як окреме додаткове завдання лише для ручного CI та змін, що впливають на промпти, тому звичайні непов’язані зміни Node не чекають за холодною генерацією знімків промптів, а boundary-шарди залишаються збалансованими, водночас дрейф промптів усе ще прив’язаний до PR, який його спричинив; той самий прапорець пропускає генерацію знімків промптів Vitest усередині шарда core support-boundary із зібраними артефактами. Gateway watch, тести каналів і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Після допуску канонічний Linux CI дозволяє до 24 одночасних тестових завдань Node і
12 для менших швидких/check-доріжок; Windows і Android залишаються на двох, бо
ці пули ранерів вужчі.

Компактний PR-план створює 18 завдань Node для поточного набору: групи whole-config
пакетуються в ізольованих підпроцесах із 120-хвилинним таймаутом пакета,
а групи include-pattern ділять той самий обмежений бюджет завдань.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його доріжка unit-test усе одно компілює flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK під час кожного Android-релевантного пушу.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, закріплений на найновішій версії Knip, із вимкненим minimum release age pnpm для встановлення через `dlx`) і `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Guard невикористаних файлів падає, коли PR додає новий неперевірений невикористаний файл або залишає застарілий запис allowlist, зберігаючи водночас навмисні динамічні поверхні Plugin, generated, build, live-test і package bridge, які Knip не може статично розв’язати.

## Перенаправлення активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є цільовим мостом від активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request-ів. Workflow створює токен GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири доріжки:

- `clawsweeper_item` для точних запитів перевірки issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів перевірки на рівні commit під час пушів у `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може переглядати.

Доріжка `github_activity` пересилає лише нормалізовані метадані: тип події, дію, актора, репозиторій, номер елемента, URL, заголовок, стан і короткі уривки коментарів або review, якщо вони є. Вона навмисно уникає пересилання повного тіла webhook. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує ціль Discord у своєму промпті й має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, потребує дії, ризикована або операційно корисна. Звичайні відкриття, редагування, активність ботів, дублікати шуму webhook і нормальний review-трафік мають давати `NO_REPLY`.

Розглядайте заголовки GitHub, коментарі, тіла, текст review, назви гілок і повідомлення commit як недовірені дані на всьому цьому шляху. Це вхідні дані для підсумовування й triage, а не інструкції для workflow або runtime агента.

## Ручні dispatch-и

Ручні CI-dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped-доріжку: Linux Node-шарди, bundled-plugin-шарди, шарди контрактів Plugin і каналів, сумісність Node 22, `check-*`, `check-additional-*`, smoke-перевірки зібраних артефактів, перевірки документації, Python Skills, Windows, macOS, iOS build і Control UI i18n. Окремі ручні CI-dispatch-и запускають Android лише з `include_android=true`; повна release-парасоля вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin, release-only shard `agentic-plugins`, повний batch sweep розширень і Docker-доріжки prerelease для Plugin виключено з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному виклику запустити цей граф для гілки, тега або повного commit SHA, використовуючи workflow-файл із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ручний CI dispatch і резервні варіанти для неканонічних репозиторіїв, сканування якості CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow-и документації поза CI та preflight install-smoke, щоб матриця Blacksmith могла стати в чергу раніше           |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, легші шарди extension, `checks-fast-core`, шарди контрактів Plugin/каналів, більшість bundled/легших Linux Node-шардів, `check-guards`, `check-prod-types`, `check-test-types`, вибрані шарди `check-additional-*` і `check-dependencies`              |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі Linux Node-набори, boundary/extension-heavy шарди `check-additional-*` і `android`                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достатньо CPU-чутливий, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час у черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                       |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; форки повертаються до `macos-26`                                                                                                                                                                                                 |

## Бюджет реєстрації ранерів

Поточний bucket реєстрації GitHub-ранерів OpenClaw дозволяє 3 000 реєстрацій
self-hosted ранерів за 5 хвилин. Ліміт спільний для всіх реєстрацій ранерів Blacksmith
в організації `openclaw`, тому додавання ще однієї інсталяції Blacksmith
не додає нового bucket.

Вважайте labels Blacksmith дефіцитним ресурсом для контролю burst. Завдання, які
лише маршрутизують, сповіщають, підсумовують, вибирають шарди або запускають короткі сканування CodeQL, мають
залишатися на GitHub-hosted ранерах, якщо для них не виміряно специфічних
потреб Blacksmith. Будь-яка нова матриця Blacksmith, більший `max-parallel` або високочастотний
workflow має показати свою worst-case кількість реєстрацій і тримати ціль на рівні організації
нижче 2 000 реєстрацій за 5 хвилин, залишаючи запас для одночасних
репозиторіїв і повторно запущених завдань.

CI канонічного репозиторію залишає Blacksmith стандартним шляхом ранерів для звичайних push і pull-request запусків. `workflow_dispatch` і запуски неканонічних репозиторіїв використовують GitHub-hosted ранери, але звичайні канонічні запуски наразі не перевіряють стан черги Blacksmith і не переходять автоматично на GitHub-hosted labels, коли Blacksmith недоступний.

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

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності продукту/середовища виконання. Він запускається щодня на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний запуск зазвичай виконує бенчмарк для ref workflow. Установіть `target_ref`, щоб виконати бенчмарк для тегу релізу або іншої гілки з поточною реалізацією workflow. Шляхи опублікованих звітів і вказівники на найновіші звіти прив’язуються до протестованого ref, а кожен `index.md` записує протестований ref/SHA, ref/SHA workflow, ref Kova, профіль, режим автентифікації lane, модель, кількість повторів і фільтри сценаріїв.

Workflow встановлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` на зафіксованому input `kova_ref`, а потім запускає три lane:

- `mock-provider`: діагностичні сценарії Kova проти локально зібраного runtime з детермінованою фейковою автентифікацією, сумісною з OpenAI.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок запуску, Gateway та agent-turn.
- `live-openai-candidate`: реальний agent turn OpenAI `openai/gpt-5.5`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає нативні для OpenClaw source probe після проходу Kova: час завантаження Gateway і пам’ять для стандартного запуску, запуску з hook і запуску з 50 Plugin; RSS імпорту bundled Plugin, повторювані цикли hello для mock-OpenAI `channel-chat-baseline`, команди запуску CLI проти завантаженого Gateway і smoke performance probe стану SQLite. Коли для протестованого ref доступний попередній опублікований source report mock-provider, source summary порівнює поточні значення RSS і heap з цим baseline і позначає великі збільшення RSS як `watch`. Markdown-зведення source probe розташоване в `source/index.md` у bundle звіту, а поруч із ним лежить raw JSON.

Кожен lane завантажує artifacts GitHub. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і artifacts source-probe до `openclaw/clawgrit-reports` у `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний вказівник tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для release-only доказів Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, рендерингу maturity scorecard з evidence профілю QA, QA Lab parity, Matrix і lane Telegram. Профілі stable і full завжди включають вичерпне покриття live/E2E та Docker release-path soak; beta profile може увімкнути його через `run_release_soak=true`. Канонічний package Telegram E2E запускається всередині Package Acceptance, тому повний candidate не запускає дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати випущений npm package у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторного складання. Використовуйте `npm_telegram_package_spec` лише для сфокусованого повторного запуску Telegram з опублікованим package. Live package lane Codex Plugin типово використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а SHA/artifact runs пакують `extensions/codex` із вибраного ref. Установіть `codex_plugin_spec` явно для кастомних джерел Plugin, як-от специфікацій `npm:`, `npm-pack:` або `git:`.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) щодо
матриці етапів, точних назв job workflow, відмінностей профілів, artifacts і
handles для сфокусованого повторного запуску.

`OpenClaw Release Publish` — це ручний mutating workflow релізу. Запускайте його
з `release/YYYY.M.PATCH` або `main` після створення тегу релізу та після
успішного preflight OpenClaw npm. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публікованих package Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише після цього запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Stable publish також
вимагає точний `windows_node_tag`; workflow перевіряє Windows source
release і порівнює його інсталятори x64/ARM64 з candidate-approved input
`windows_node_installer_digests` перед будь-яким publish child, а потім просуває
та перевіряє ті самі зафіксовані digests інсталятора, а також точний companion asset
і контракт checksum перед публікацією draft релізу GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для доказу pinned commit на швидкозмінній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуску workflow GitHub мають бути гілками або тегами, а не raw commit SHA.
Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
run. Umbrella verifier також падає, якщо будь-який child workflow виконувався на
іншому SHA.

`release_profile` керує шириною live/provider, яка передається в release checks. Ручні release workflows типово використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку advisory матрицю provider/media. Release checks stable і full завжди запускають вичерпний live/E2E та Docker release-path soak; beta profile може увімкнути це через `run_release_soak=true`.

- `minimum` залишає найшвидші критичні для релізу lane OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory матрицю provider/media.

Umbrella записує ids запущених child run, а фінальний job `Verify full validation` повторно перевіряє поточні висновки child run і додає таблиці найповільніших job для кожного child run. Якщо child workflow перезапущено і він стає green, перезапустіть лише parent verifier job, щоб оновити umbrella result і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного full CI child, `plugin-prerelease` лише для plugin prerelease child, `release-checks` для кожного release child або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на umbrella. Це утримує повторний запуск failed release box обмеженим після сфокусованого виправлення. Для одного failed cross-OS lane поєднайте `rerun_group=cross-os` з `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а зведення packaged-upgrade включають timings для кожної фази. Lane QA release-check є advisory, окрім стандартного gate покриття runtime tools, який блокує, коли потрібні динамічні tools OpenClaw drift або зникають зі standard tier summary.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей artifact до cross-OS checks і Package Acceptance, а також до live/E2E release-path Docker workflow, коли запускається soak coverage. Це зберігає package bytes узгодженими між release boxes і уникає повторного пакування того самого candidate у кількох child jobs. Для live lane Codex npm-plugin release checks або передають відповідну опубліковану специфікацію Plugin, виведену з `release_package_spec`, або передають наданий оператором `codex_plugin_spec`, або залишають input порожнім, щоб Docker script пакував Codex Plugin з вибраного checkout.

Дубльовані runs `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Parent monitor скасовує будь-який child workflow, який
він уже запустив, коли parent скасовано, тому новіша main validation
не стоїть за застарілим двогодинним release-check run. Validation для release branch/tag
і сфокусовані rerun groups зберігають `cancel-in-progress: false`.

## Live- та E2E-шарди

Release live/E2E child зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного serial job:

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
- split media audio/video shards and provider-filtered music shards

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних live provider failures. Aggregate назви shard `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних one-shot reruns.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте live suites на базі Docker на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску nested Docker tests.

Docker-підтримувані шарди live-моделі/бекенда використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow live-релізу збирає й публікує цей образ один раз, після чого Docker-шарди live-моделі, розділеного за провайдерами Gateway, CLI-бекенда, прив’язки ACP і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет перевірки релізу. Якщо ці шарди незалежно перебудовують повну Docker-ціль із джерел, запуск релізу налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерел, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` отримує `workflow_ref`, визначає один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з digest пакета й запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; окремий Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker-приймання або опціональний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тегу релізу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` є обов’язковим. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення hostnames або resolved IPs, а також redirect за межі тієї самої публічної політики безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики довіреного джерела в `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` є обов’язковими. Використовуйте це лише для enterprise-дзеркал, якими володіють maintainers, або приватних репозиторіїв пакетів, яким потрібні налаштовані hosts, ports, path prefixes, redirect hosts або private-network resolution. Якщо політика оголошує bearer auth, workflow використовує фіксований secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; вбудовані в URL облікові дані все одно відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опціональним, але його варто надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це джерельний коміт, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старі довірені source commits без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні chunks Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опціональний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для окремих dispatch-запусків.

Для спеціальної політики тестування оновлень і plugin, включно з локальними командами,
Docker lanes, вхідними даними Package Acceptance, release defaults і triage помилок,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Перевірки релізу викликають Package Acceptance із `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це утримує міграцію пакета, оновлення, live-встановлення Skills із ClawHub, очищення застарілих plugin dependencies, ремонт встановлення налаштованого plugin, offline plugin, plugin-update і Telegram proof на тому самому визначеному package tarball. Установіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю проти випущеного npm-пакета без перебудови; установлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта release validation. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один published package baseline за запуск у blocking release path. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди rerun для failed lanes зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири найновіші stable npm releases плюс зафіксовані releases межі plugin compatibility і issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, установлених налаштованих OpenClaw plugins, tilde log paths і застарілих legacy plugin dependency roots. Вибори multi-baseline published-upgrade survivor шардяться за baseline в окремі targeted Docker runner jobs. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні published update, а не у звичайній ширині Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою вбудованого command recipe `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.5`, тож install і gateway proof залишаються на тестовій моделі GPT-5, уникаючи defaults GPT-4.x.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити subcase persistence `gateway install --wrapper`, коли пакет не expose цей flag;
- `update-channel-switch` може prune відсутні pnpm `patchedDependencies` з tarball-derived fake git fixture і може log відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволити config metadata migration, усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були випущені. Пізніші пакети мають відповідати сучасним contracts; ті самі умови завершуються помилкою замість warning або skip.

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

Під час debugging невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Віддавайте перевагу повторному запуску failed package profile або точних Docker lanes замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що зачіпають поверхні Docker/пакетів, зміни пакетів/маніфестів вбудованих Plugin або поверхні основного Plugin/каналу/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованих Plugin, редагування лише тестів і редагування лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення агентів зі спільного робочого простору, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає покриття встановлення QR-пакета та Docker/update інсталятора для нічних запланованих запусків, ручних запусків, release-перевірок workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакетів/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, потім запускає встановлення QR-пакета, smoke-перевірки кореневого Dockerfile/Gateway, smoke-перевірки інсталятора/update і швидкий Docker E2E для вбудованих Plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push у `main` (включно з merge-комітами) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні запускання `Install Smoke` можуть увімкнути його, але pull request і push у `main` не запускають його. Звичайний PR CI все ще запускає швидку Bun launcher regression-лінію для змін, релевантних Node. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test-образ, один раз пакує OpenClaw як npm-тарбол і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний Node/Git runner для ліній інсталятора/update/plugin-dependency;
- функціональний образ, який встановлює той самий тарбол у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ліній, щоб провайдери не throttling.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Обмеження одночасних ліній npm install.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних багатосервісних ліній.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути штормів створення Docker daemon; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail-лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Точний список ліній, розділений комами; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за своє ефективне обмеження, все одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ємність. Локальні сукупні preflight-перевірки перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних ліній, зберігають timings ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняють планування нових pooled-ліній після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory тарбола; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E-образи через кеш Docker-шарів Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest-образи замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшість критичного шляху CI.

### Фрагменти release-шляху

Release Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker chunks для release — це `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `package-update-openai` містить live-лінію пакета Codex Plugin, яка встановлює кандидатний пакет OpenClaw, встановлює Codex Plugin з `codex_plugin_spec` або same-ref тарбола з явним дозволом на встановлення Codex CLI, запускає preflight Codex CLI, а потім запускає кілька OpenClaw agent turns у тій самій сесії проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate-аліасами plugin/runtime. Аліас лінії `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path-покриття запитує його, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Bundled-channel update lanes повторюють запуск один раз у разі тимчасових мережевих збоїв npm.

Кожен chunk завантажує `.artifacts/docker-tests/` із логами ліній, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input `docker_lanes` у workflow запускає вибрані лінії проти підготовлених образів замість chunk jobs, що тримає debugging failed-lane в межах одного цільового Docker-завдання та готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test-образ для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker artifacts і надрукувати об'єднані/per-lane цільові rerun commands
pnpm test:docker:timings <summary>   # slow-lane і phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — це дорожче покриття продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і окремі ручні CI dispatches тримають цей suite вимкненим. Він балансує тести вбудованих Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу й більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для завдань на одну-три хвилини. Workflow також завантажує інформаційний artifact `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; findings інспектора є triage input і не змінюють blocking Plugin Prerelease gate.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладено в широкі QA та release harnesses, а не в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від latency live model і звичайного startup provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку пам'яті; provider connectivity покривається окремими suites для live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов'язковим status.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code і поверхні JavaScript/TypeScript з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базовий рівень Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel, а також середовище виконання channel plugin, Gateway, Plugin SDK, secrets, точки дотику audit    |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політик core SSRF, розбору IP, network guard, web-fetch і Plugin SDK SSRF                                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, допоміжні засоби виконання процесів, outbound delivery і шлюзи виконання інструментів агента                           |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, встановлення package-manager, source-loading і контракту пакета Plugin SDK |

### Платформозалежні security-шарди

- `CodeQL Android Critical Security` — запланований Android security-шард. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому sanity-перевіркою workflow. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security-шард. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусканнями, бо macOS build домінує час виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security шард. Він виконує лише JavaScript/TypeScript quality-запити з error-severity і без security над вузькими цінними поверхнями на GitHub-hosted Linux runners, щоб quality-сканування не витрачали бюджет реєстрації Blacksmith runners. Його pull request guard навмисно менший за запланований профіль: non-draft PR запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та dispatch відповідей, schema/migration/IO коді config, коді auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality-шардів.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні hooks для запуску одного quality-шарда ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Код межі безпеки Auth, secrets, sandbox, Cron і Gateway                                                                                                          |
| `/codeql-critical-quality/config-boundary`             | Контракти config schema, migration, normalization і IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`    | Контракти реалізації core channel і bundled channel plugin                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`      | Контракти runtime для command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, допоміжні засоби process supervision та контракти outbound delivery                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`     | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers               |
| `/codeql-critical-quality/provider-runtime-boundary`   | Model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs, а також web/search/fetch/embedding registries |
| `/codeql-critical-quality/ui-control-plane`            | Control UI bootstrap, local persistence, Gateway control flows і task control-plane runtime contracts                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                       |
| `/codeql-critical-quality/plugin-boundary`             | Контракти loader, registry, public-surface і Plugin SDK entrypoint                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опубліковані package-side джерела Plugin SDK і допоміжні засоби контракту plugin package                                                                         |

Quality лишається окремою від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run був створений за останню годину. Коли він виконується, то переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може покрити всі main-зміни, накопичені від останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інша workflow-run invocation уже виконувалася або виконується в цей UTC day. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex вносити лише малі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline count passing tests. Grouped report записує per-config wall time і max RSS на Linux і macOS, тому before/after comparison показує test memory deltas поряд із duration deltas. Якщо baseline має failing tests, Codex може виправити лише obvious failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push потрапить у репозиторій, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR змерджений і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широка CI platform scope:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- public Plugin SDK або plugin-contract changes розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються explicit test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: direct test edits запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним з explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change падав до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Testbox validation

Crabbox — це repo-owned remote-box wrapper для maintainer Linux proof. Використовуйте його з repo root, коли check занадто широкий для local edit loop, коли важлива CI parity або коли proof потребує secrets, Docker, package lanes, reusable boxes чи remote logs. Звичайний OpenClaw backend — `blacksmith-testbox`; owned AWS/Hetzner capacity є fallback для Blacksmith outages, quota issues або explicit owned-capacity testing.

Підтримувані Crabbox запуски Blacksmith прогрівають, резервують, синхронізують, запускають, звітують і очищають
одноразові Testbox. Вбудована перевірка коректності синхронізації швидко завершується помилкою, коли потрібні
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для навмисних PR із великими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик Blacksmith CLI, який лишається у фазі
синхронізації понад п'ять хвилин без виводу після синхронізації. Установіть
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте wrapper з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper репозиторію відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передавайте провайдера явно, навіть якщо `.crabbox.yaml` має типові значення owned-cloud. У worktree Codex або пов'язаних/розріджених checkout уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до запуску Crabbox; натомість викликайте node wrapper напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Підтримувані Blacksmith запуски потребують Crabbox 0.22.0 або новішої версії, щоб wrapper отримував поточну поведінку синхронізації, черги та очищення Testbox. Під час використання сусіднього checkout перебудуйте ігнорований локальний бінарний файл перед вимірюванням часу або роботою з доказами:

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

Цільовий повторний запуск тестів:

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

Прочитайте підсумковий JSON-звіт. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові підтримувані Blacksmith запуски Crabbox мають автоматично зупиняти Testbox; якщо запуск перервано або очищення незрозуміле, перегляньте активні бокси й зупиніть лише ті бокси, які створили ви:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібно кілька команд на тому самому гідратованому боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є зламаним шаром, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і очищення. Виправте
шлях Crabbox, перш ніж розглядати прямий запуск Blacksmith як доказ maintainer.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmup лишаються `queued` без IP або URL запуску Actions через кілька хвилин,
вважайте це тиском провайдера Blacksmith, черги, білінгу або лімітів організації. Зупиніть
створені вами id у черзі, уникайте запуску додаткових Testbox і перенесіть доказ до
шляху власної місткості Crabbox нижче, поки хтось перевіряє dashboard Blacksmith,
білінг і ліміти організації.

Переходьте до власної місткості Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власна місткість явно є метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завдання справді не потребує CPU класу 48xlarge. Запит `beast` починається зі 192 vCPU і є найпростішим способом зачепити регіональну квоту EC2 Spot або On-Demand Standard. Належний репозиторію `.crabbox.yaml` за замовчуванням використовує `standard`, кілька регіонів місткості та `capacity.hints: true`, щоб брокеровані lease AWS виводили вибраний регіон/ринок, тиск квоти, fallback Spot і попередження класу високого тиску. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от повний набір або Docker-матриці всіх Plugin, явна release/blocker validation або високоядерне профілювання продуктивності. Не використовуйте `beast` для `pnpm check:changed`, цільових тестів, роботи лише з документацією, звичайного lint/typecheck, малих E2E-відтворень або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики місткості, щоб нестабільність ринку Spot не змішувалася із сигналом.

`.crabbox.yaml` володіє типовими значеннями провайдера, синхронізації та гідратації GitHub Actions для owned-cloud lanes. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git metadata замість синхронізації локальних для maintainer remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передаванням несекретного середовища для команд owned-cloud `crabbox run --id <cbx_id>`.

## Пов'язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
