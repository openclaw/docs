---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, обмеження області, релізні парасолі та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-07-04T06:48:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Канонічні
push у `main` спершу проходять 90-секундне вікно допуску hosted-runner.
Наявна група конкурентності `CI` скасовує цей очікуваний запуск, коли надходить новіший
commit, тому послідовні merge не реєструють кожен повну матрицю Blacksmith.
Pull requests і ручні dispatch пропускають очікування. Потім завдання `preflight`
класифікує diff і вимикає дорогі доріжки, коли змінено лише непов’язані
ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне
звуження області та розгортають повний граф для release candidates і широкої
валідації. Доріжки Android залишаються opt-in через `include_android`. Покриття
Plugin лише для release живе в окремому workflow [`Plugin передрелізу`](#plugin-prerelease)
і запускається лише з [`Повної release-валідації`](#full-release-validation)
або явного ручного dispatch.

## Огляд pipeline

| Завдання                           | Призначення                                                                                               | Коли запускається                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в docs, змінені області, змінені extensions і збирає маніфест CI                       | Завжди для non-draft push і PR                      |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push у `main` перед реєстрацією роботи Blacksmith            | Кожен запуск CI; sleep лише для канонічних push у `main` |
| `security-fast`                    | Виявлення приватних ключів, аудит змінених workflow через `zizmor` і аудит production lockfile            | Завжди для non-draft push і PR                      |
| `check-dependencies`               | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                   | Node-релевантні зміни                               |
| `build-artifacts`                  | Збірка `dist/`, Control UI, built-CLI smoke checks, перевірки вбудованих build-артефактів і reusable artifacts | Node-релевантні зміни                               |
| `checks-fast-core`                 | Швидкі Linux-доріжки коректності, як-от bundled, protocol, QA Smoke CI і перевірки CI-routing             | Node-релевантні зміни                               |
| `checks-fast-contracts-plugins-*`  | Дві shard-перевірки контрактів Plugin                                                                     | Node-релевантні зміни                               |
| `checks-fast-contracts-channels-*` | Дві shard-перевірки контрактів каналів                                                                    | Node-релевантні зміни                               |
| `checks-node-core-*`               | Shards тестів core Node, без доріжок channel, bundled, contract і extension                               | Node-релевантні зміни                               |
| `check-*`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Node-релевантні зміни                               |
| `check-additional-*`               | Архітектура, sharded boundary/prompt drift, extension guards, package boundary і runtime topology         | Node-релевантні зміни                               |
| `checks-node-compat-node22`        | Збірка сумісності з Node 22 і smoke-доріжка                                                               | Ручний CI dispatch для releases                     |
| `check-docs`                       | Форматування docs, lint і перевірки broken links                                                          | Змінено docs                                        |
| `skills-python`                    | Ruff + pytest для Skills на Python                                                                        | Зміни, релевантні Python Skills                     |
| `checks-windows`                   | Специфічні для Windows тести process/path плюс спільні регресії import specifier runtime                  | Windows-релевантні зміни                            |
| `macos-node`                       | Доріжка тестів TypeScript на macOS із використанням спільних build-артефактів                             | macOS-релевантні зміни                              |
| `macos-swift`                      | Swift lint, build і тести для застосунку macOS                                                            | macOS-релевантні зміни                              |
| `ios-build`                        | Генерація проєкту Xcode плюс збірка застосунку iOS для simulator                                          | iOS app, shared app kit або зміни Swabble           |
| `android`                          | Unit-тести Android для обох flavors плюс одна збірка debug APK                                            | Android-релевантні зміни                            |
| `test-performance-agent`           | Щоденна оптимізація повільних тестів Codex після trusted activity                                         | Успіх Main CI або ручний dispatch                   |
| `openclaw-performance`             | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і live-доріжками GPT 5.5 | Scheduled і manual dispatch                         |

## Порядок fail-fast

1. `runner-admission` чекає лише для канонічних push у `main`; новіший push скасовує запуск перед реєстрацією Blacksmith.
2. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
4. `build-artifacts` перекривається зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати щойно спільна збірка готова.
5. Важчі доріжки platform і runtime розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Matrix-завдання використовують `fail-fast: false`, а `build-artifacts` повідомляє про failures embedded channel, core-support-boundary і gateway-watch напряму, замість ставити в чергу крихітні verifier jobs. Автоматичний concurrency key CI має версію (`CI-v7-*`), тому zombie на боці GitHub у старій queue group не може нескінченно блокувати новіші main-запуски. Ручні full-suite запуски використовують `CI-manual-v1-*` і не скасовують in-progress запуски.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші завдання, failures і fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий підсумок запуску як артефакт `ci-timings-summary`. Для timing збірки перевірте крок `Build dist` у завданні `build-artifacts`: `pnpm build:ci-artifacts` друкує `[build-all] phase timings:` і містить `ui:build`; завдання також завантажує артефакт `startup-memory`.

Для запусків pull request terminal timing-summary job запускає helper з trusted base revision перед передаванням `GH_TOKEN` до `gh run view`. Це тримає tokened query поза кодом, контрольованим гілкою, і водночас підсумовує поточний CI-запуск pull request.

## PR-контекст і докази

PR зовнішніх contributors запускають gate PR-контексту й доказів із
`.github/workflows/real-behavior-proof.yml`. Workflow checkout trusted
base commit і оцінює лише тіло PR; він не виконує код із
contributor branch.

Gate застосовується до авторів PR, які не є owners репозиторію, members,
collaborators або bots. Він проходить, коли тіло PR містить авторські
розділи `What Problem This Solves` і `Evidence`. Доказом може бути focused
test, результат CI, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Тіло надає намір і корисну валідацію;
reviewers перевіряють код, тести й CI, щоб оцінити коректність.

Коли check падає, оновіть тіло PR замість push ще одного code commit.

## Область і маршрутизація

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Зміни CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не примушують Windows, iOS, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML-файлів, composite-action interpolation guard і conflict-marker guard. PR-scoped завдання `security-fast` також запускає `zizmor` для змінених workflow files, щоб findings безпеки workflow падали рано в main CI graph.
- **Docs на push у `main`** перевіряються standalone workflow `Docs` з тим самим docs mirror ClawHub, який використовує CI, тому змішані code+docs push також не ставлять у чергу shard CI `check-docs`. Pull requests і manual CI все ще запускають `check-docs` із CI, коли docs змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тому він покриває і детерміновану fixture lane `TuiBackend`, і повільніший smoke `tui --local`, який mock лише external model endpoint.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixtures і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task безпосередньо вправляє.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхонь CI workflow, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування раннерів: контракти plugin і контракти каналів виконуються як два зважені шарди з підтримкою Blacksmith кожен зі стандартним fallback на раннер GitHub, швидкі/допоміжні лінії core unit виконуються окремо, інфраструктуру core runtime розділено між state, process/config, shared і трьома доменними шардами cron, auto-reply виконується як збалансовані воркери (із піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing), а конфігурації agentic gateway/server розділено між лініями chat/auth/model/http-plugin/runtime/startup замість очікування на зібрані артефакти. Потім звичайний CI пакує лише ізольовані шарди include-pattern інфраструктури в детерміновані пакети щонайбільше з 64 тестових файлів, зменшуючи матрицю Node без об’єднання неізольованих наборів command/cron, stateful agents-core або gateway/server; важкі фіксовані набори залишаються на 8 vCPU, тоді як пакетовані й менш вагомі лінії використовують 4 vCPU. Pull request у канонічному репозиторії використовують додатковий компактний admission plan: ті самі групи per-config виконуються в ізольованих subprocesses у межах поточного Linux Node plan із 34 завдань, тож один PR не реєструє повну матрицю Node із понад 70 завдань. Пуші в `main`, ручні dispatches і release gates зберігають повну матрицю. Широкі browser, QA, media та різні тести plugin використовують свої виділені конфігурації Vitest замість спільного plugin catch-all. Шарди include-pattern записують записи timing із використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого shard. `check-additional-*` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; список boundary guard розподілено смугами в один prompt-heavy shard і один combined shard для решти guard stripes, кожен із яких паралельно виконує вибрані незалежні guards і друкує timings для кожної перевірки. Дорога перевірка drift для Codex happy-path prompt snapshot виконується як окреме additional job лише для manual CI і лише для змін, що впливають на prompt, тому звичайні непов’язані зміни Node не чекають за холодною генерацією prompt snapshot, а boundary shards залишаються збалансованими, водночас prompt drift усе ще прив’язаний до PR, який його спричинив; той самий прапорець пропускає генерацію prompt snapshot Vitest усередині built-artifact core support-boundary shard. Gateway watch, тести каналів і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Після допуску канонічний Linux CI дозволяє до 24 одночасних тестових завдань Node і
12 для менших ліній fast/check; Windows і Android залишаються на двох, бо
ці пули раннерів вужчі.

Компактний PR plan створює 18 завдань Node для поточного набору: групи
whole-config пакетуються в ізольованих subprocesses із 120-хвилинним timeout для batch,
тоді як групи include-pattern ділять той самий обмежений бюджет завдань.

Android CI виконує і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його unit-test lane все одно компілює flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` виконує `pnpm deadcode:dependencies` (production Knip dependency-only pass, прив’язаний до найновішої версії Knip, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file завершується помилкою, коли PR додає новий неперевірений unused file або залишає застарілий allowlist entry, зберігаючи при цьому навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Передавання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є цільовим мостом із активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review для issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Лінія `github_activity` передає лише нормалізовані метадані: тип події, дію, актора, репозиторій, номер item, URL, заголовок, стан і короткі уривки для коментарів або reviews, якщо вони присутні. Вона навмисно уникає передавання повного тіла webhook. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має писати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, ризикована або операційно корисна. Рутинні opens, edits, bot churn, шум duplicate webhook і звичайний review traffic мають давати `NO_REPLY`.

Розглядайте GitHub titles, comments, bodies, review text, branch names і commit messages як недовірені дані протягом усього цього шляху. Це input для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні dispatches

Ручні CI dispatches виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane, крім Android: Linux Node shards, bundled-plugin shards, plugin і channel contract shards, сумісність Node 22, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build і Control UI i18n. Окремі ручні CI dispatches запускають Android лише з `include_android=true`; повний release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite виконується лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не був скасований іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу виконати цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннери

| Раннер                          | Завдання                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch і non-canonical repository fallbacks, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, docs workflows outside CI і install-smoke preflight, щоб Blacksmith matrix могла ставати в чергу раніше                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lower-weight extension shards, `checks-fast-core`, крім QA Smoke CI, plugin/channel contract shards, більшість bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, вибрані shards `check-additional-*` і `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі Linux Node suites, boundary/extension-heavy shards `check-additional-*` і `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` у CI і Testbox, `check-lint` (достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; forks повертаються до `macos-26`                                                                                                                                                                                                                     |

## Бюджет реєстрації раннерів

Поточний bucket GitHub runner-registration для OpenClaw повідомляє про 10 000 self-hosted
runner registrations за 5 хвилин у `ghx api rate_limit`. Повторно перевіряйте
`actions_runner_registration` перед кожним tuning pass, бо GitHub може змінити
цей bucket. Ліміт спільний для всіх реєстрацій раннерів Blacksmith в
організації `openclaw`, тому додавання ще однієї інсталяції Blacksmith не додає
новий bucket.

Сприймайте labels Blacksmith як дефіцитний ресурс для burst control. Завдання, які
лише маршрутизують, сповіщають, summarise, select shards або виконують короткі CodeQL scans, мають
залишатися на GitHub-hosted runners, якщо вони не мають виміряних Blacksmith-specific
потреб. Будь-яка нова Blacksmith matrix, більший `max-parallel` або high-frequency
workflow має показати свій worst-case registration count і тримати org-level
target нижче приблизно 60% live bucket. З поточним bucket у 10 000 registrations
це означає operating target у 6 000 registrations, залишаючи headroom для
одночасних репозиторіїв, retries і burst overlap.

Canonical-repo CI зберігає Blacksmith як типовий runner path для звичайних push і pull-request runs. `workflow_dispatch` і non-canonical repository runs використовують GitHub-hosted runners, але звичайні canonical runs наразі не перевіряють Blacksmith queue health і не fallback автоматично до GitHub-hosted labels, коли Blacksmith недоступний.

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

Ручний запуск зазвичай вимірює продуктивність ref workflow. Установіть `target_ref`, щоб виміряти продуктивність тегу релізу або іншої гілки з поточною реалізацією workflow. Опубліковані шляхи звітів і вказівники на останні результати ключуються за протестованим ref, а кожен `index.md` записує протестований ref/SHA, ref/SHA workflow, ref Kova, профіль, режим авторизації доріжки, модель, кількість повторів і фільтри сценаріїв.

Workflow встановлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` на зафіксованому вхідному `kova_ref`, а потім запускає три доріжки:

- `mock-provider`: діагностичні сценарії Kova проти середовища виконання локальної збірки з детермінованою фальшивою OpenAI-сумісною авторизацією.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок запуску, Gateway і agent-turn.
- `live-openai-candidate`: реальний agent turn OpenAI `openai/gpt-5.5`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Доріжка mock-provider також запускає нативні для OpenClaw проби джерел після проходу Kova: час і пам’ять запуску Gateway для типових випадків запуску, запуску з hook і запуску з 50 Plugin; RSS імпорту bundled Plugin, повторювані цикли hello для mock-OpenAI `channel-chat-baseline`, команди запуску CLI проти запущеного Gateway і smoke-пробу продуктивності стану SQLite. Коли попередній опублікований звіт джерел mock-provider доступний для протестованого ref, підсумок джерел порівнює поточні значення RSS і heap з цим baseline і позначає великі збільшення RSS як `watch`. Markdown-підсумок проб джерел розташований у `source/index.md` у пакеті звіту, а поруч із ним лежить сирий JSON.

Кожна доріжка завантажує артефакти GitHub. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, пакети, `index.md` і артефакти source-probe у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний вказівник tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізного proof Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, приймання пакета, cross-OS перевірок пакетів, рендерингу maturity scorecard з evidence QA-профілю, паритету QA Lab, Matrix і доріжок Telegram. Профілі stable і full завжди включають вичерпне live/E2E та Docker-покриття тривалого прогону release-path; профіль beta може увімкнути це через `run_release_soak=true`. Канонічний пакетний Telegram E2E запускається всередині Package Acceptance, тому повний кандидат не запускає дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати доставлений npm-пакет у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторної збірки. Використовуйте `npm_telegram_package_spec` лише для сфокусованого повторного запуску Telegram з опублікованим пакетом. Live-доріжка пакета Plugin Codex типово використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, тоді як запуски SHA/артефактів пакують `extensions/codex` з вибраного ref. Установіть `codex_plugin_spec` явно для користувацьких джерел Plugin, таких як специфікації `npm:`, `npm-pack:` або `git:`.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) щодо
матриці етапів, точних назв job workflow, відмінностей профілів, артефактів і
handle для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний мутувальний workflow релізу. Запускайте його
з `release/YYYY.M.PATCH` або `main` після появи тегу релізу та після успішного
preflight OpenClaw npm. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публіковних пакетів Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Публікація stable також
вимагає точний `windows_node_tag`; workflow перевіряє вихідний реліз Windows
і порівнює його x64/ARM64 інсталятори з затвердженим кандидатом input
`windows_node_installer_digests` перед будь-яким дочірнім publish, а потім просуває
та перевіряє ті самі зафіксовані digest інсталяторів разом із точним супровідним asset
і контрактом checksum перед публікацією чернетки GitHub-релізу.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для proof зафіксованого коміту на гілці, що швидко рухається, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуску GitHub workflow мають бути гілками або тегами, а не сирими SHA комітів. Helper
пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього зафіксованого ref, перевіряє, що кожен дочірній
workflow `headSha` відповідає цілі, і видаляє тимчасову гілку після завершення
запуску. Парасольковий verifier також падає, якщо будь-який дочірній workflow запускався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні
релізні workflow типово використовують `stable`; використовуйте `full` лише коли ви
навмисно хочете широку advisory-матрицю provider/media. Перевірки релізу stable і full
завжди запускають вичерпний live/E2E та Docker-тривалий прогін release-path;
профіль beta може увімкнути це через `run_release_soak=true`.

- `minimum` залишає найшвидші критичні для релізу доріжки OpenAI/core.
- `stable` додає stable-набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасольковий workflow записує ідентифікатори запущених дочірніх runs, а фінальна job `Verify full validation` повторно перевіряє поточні висновки дочірніх runs і додає таблиці найповільніших jobs для кожного дочірнього run. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківську job verifier, щоб оновити парасольковий результат і підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього релізного workflow або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` на парасольковому workflow. Це утримує повторний запуск невдалого release box обмеженим після сфокусованого виправлення. Для однієї невдалої cross-OS доріжки поєднайте `rerun_group=cross-os` з `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а підсумки packaged-upgrade включають таймінги за фазами. Доріжки QA release-check є advisory, окрім стандартного gate покриття runtime tool, який блокує, коли необхідні динамічні інструменти OpenClaw відхиляються або зникають зі standard tier summary.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей artifact у cross-OS перевірки та Package Acceptance, плюс live/E2E release-path Docker workflow, коли запускається soak-покриття. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх jobs. Для live-доріжки Codex npm-plugin release checks або передає відповідну опубліковану специфікацію Plugin, виведену з `release_package_spec`, або передає наданий оператором `codex_plugin_spec`, або залишає input порожнім, щоб Docker-скрипт запакував Plugin Codex з вибраного checkout.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий workflow. Батьківський monitor скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський workflow скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним release-check run. Валідація release branch/tag
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного job:

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
- розділені медіа-шарди audio/video та музичні шарди, відфільтровані за provider

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Сукупні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед налаштуванням. Тримайте live suites на основі Docker на звичайних Blacksmith runners — container jobs не підходять для запуску вкладених Docker tests.

Docker-підкріплені живі сегменти моделей/бекендів використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Живий релізний workflow збирає й публікує цей образ один раз, після чого Docker-сегменти живої моделі, сегментованого за провайдерами gateway, CLI-бекенду, ACP-прив’язки та Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-сегменти Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за таймаут job у workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці сегменти незалежно перебудовують повну Docker-ціль із вихідного коду, релізний запуск налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Jobs

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 та профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest за потреби й запускає вибрані Docker-смуги для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці смуги як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; автономний dispatch Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо визначення пакета, Docker-приймання або необов’язкова смуга Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable версій.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт доступний з історії гілки репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` обов’язковий. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення hostnames або resolved IPs, а також redirects поза тією самою публічною політикою безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики trusted-source у `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` обов’язкові. Використовуйте це лише для maintainer-owned enterprise mirrors або приватних package repositories, яким потрібні налаштовані hosts, ports, path prefixes, redirect hosts або private-network resolution. Якщо політика оголошує bearer auth, workflow використовує фіксований секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; облікові дані, вбудовані в URL, усе одно відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному test harness змогу перевіряти старі довірені коміти джерела без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб перевірка опублікованого пакета не залежала від живої доступності ClawHub. Необов’язкова смуга Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для автономних dispatches.

Спеціальну політику тестування оновлень і plugins, включно з локальними командами,
Docker-смугами, вхідними даними Package Acceptance, релізними типовими значеннями та triage збоїв,
див. у [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Релізні перевірки викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це утримує міграцію пакета, оновлення, живе встановлення ClawHub skill, очищення stale-plugin-dependency, repair встановлення configured-plugin, offline plugin, plugin-update і доказ Telegram на тому самому визначеному tarball пакета. Задайте `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю для відвантаженого npm-пакета без перебудови; задавайте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта релізної перевірки. Cross-OS релізні перевірки все ще покривають специфічні для ОС onboarding, installer і platform behavior; перевірку package/update product слід починати з Package Acceptance. Docker-смуга `published-upgrade-survivor` перевіряє один опублікований package baseline за запуск у blocking release path. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, типовим є `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` задає `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири найновіші stable npm releases плюс зафіксовані plugin-compatibility boundary releases і issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona files, встановлень configured OpenClaw plugin, tilde log paths і stale legacy plugin dependency roots. Multi-baseline вибори published-upgrade survivor сегментуються за baseline в окремі цільові Docker runner jobs. Окремий workflow `Update Migration` використовує Docker-смугу `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні published update, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну смугу через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікована смуга налаштовує baseline за допомогою baked recipe команди `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.5`, тож install і gateway proof залишаються на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може прибрати відсутні pnpm `patchedDependencies` з fake git fixture, похідного від tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти міграцію config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були відвантажені. Пізніші пакети мають відповідати сучасним contracts; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час debugging невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Надавайте перевагу повторному запуску failed package profile або точних Docker lanes замість повторного запуску full release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** виконується для pull request, які зачіпають Docker/package-поверхні, зміни пакетів/маніфестів вбудованих plugin або основні поверхні plugin/каналу/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованих plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg для вбудованого розширення та запускає обмежений Docker-профіль вбудованого plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді зачіпають installer/package/Docker-поверхні. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke-образ для цільового SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала за root image smokes.

`main` pushes (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і `main` pushes не запускають його. Звичайний PR CI все ще запускає швидкий Bun launcher regression lane для змін, релевантних Node. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner розміщена в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожного lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливого до provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live lanes, щоб providers не throttled.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Обмеження одночасних npm install lanes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних multi-service lanes.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути create storms у Docker daemon; встановіть `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожного lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує scheduler plan без запуску lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити один невдалий lane. |

Lane, важчий за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює сам, доки не звільнить capacity. Локальні сукупні preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус active-lane, зберігають timings lanes для longest-first ordering і за замовчуванням припиняють планувати нові pooled lanes після першого failure.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і credential coverage потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного run, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає і публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним таймаутом на кожну спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI.

### Частини release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `package-update-openai` містить live Codex plugin package lane, який встановлює candidate OpenClaw package, встановлює Codex plugin з `codex_plugin_spec` або same-ref tarball з явним схваленням встановлення Codex CLI, запускає Codex CLI preflight, а потім запускає кілька turns OpenClaw agent в одній сесії проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI включено до `plugins-runtime-services`, коли цього вимагає повне release-path coverage, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Bundled-channel update lanes повторюються один раз у разі transient npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і командами per-lane rerun. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених images замість chunk jobs, що обмежує debugging failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього run; якщо вибраний lane є live Docker lane, цільове job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб failed lane міг повторно використати точні package і images з failed run.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий workflow, який запускається `Full Release Validation` або явним operator. Звичайні pull request, `main` pushes і standalone manual CI dispatches не вмикають цей suite. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин. Workflow також завантажує інформаційний artifact `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; inspector findings є triage input і не змінюють blocking gate Plugin Prerelease.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладена в broad QA і release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із broad validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як parallel jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity окремо покриває memory behavior; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди шардує повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як parallel lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим status.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code і найризикованіші JavaScript/TypeScript surfaces з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` або process-owning bundled plugin runtime paths і виконує ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                          | Поверхня                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, секрети, пісочниця, cron і базовий рівень gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime Plugin каналу, gateway, Plugin SDK, секрети, точки дотику аудиту              |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агентом                                           |
| `/codeql-security-high/process-exec-boundary`     | Локальна оболонка, допоміжні засоби запуску процесів, runtime-и bundled plugin, що володіють підпроцесами, і зв’язувальний код workflow-скриптів                             |
| `/codeql-security-high/plugin-trust-boundary`     | Встановлення Plugin, loader, manifest, registry, встановлення package-manager, завантаження source і поверхні довіри контракту пакета Plugin SDK |

### Специфічні для платформ безпекові шарди

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою workflow sanity. Завантажує до `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує до `/codeql-critical-security/macos`. Тримається поза щоденними default-профілями, бо macOS-збірка домінує runtime навіть коли все чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний небезпековий shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких поверхнях високої цінності на GitHub-hosted Linux runners, щоб quality scans не витрачали бюджет реєстрації Blacksmith runner. Його захист pull request навмисно менший за запланований профіль: недрафтові PR запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і dispatch reply, schema/migration/IO config, auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                                | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, секрети, пісочниця, cron і код межі безпеки gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Контракти schema, migration, normalization і IO config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel і bundled channel plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання command, dispatch model/provider, dispatch і queues auto-reply, а також runtime-контракти control plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та tool bridges, допоміжні засоби нагляду за процесами й контракти outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, glue активації memory runtime і команди memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка reply queue, session delivery queues, допоміжні засоби outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch inbound reply у Plugin SDK, допоміжні засоби reply payload/chunking/runtime, channel reply options, delivery queues і допоміжні засоби session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, provider auth і discovery, реєстрація provider runtime, provider defaults/catalogs і registries web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальне збереження, control flows gateway і runtime-контракти task control plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні контракти runtime web fetch/search, media IO, media understanding, image-generation і media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side source Plugin SDK і допоміжні засоби контракту пакета plugin                                                                                      |

Quality тримається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це подієво-керована maintenance lane Codex для підтримання наявної документації в синхроні з нещодавно внесеними змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший непропущений запуск Docs Agent. Коли він працює, він переглядає діапазон commit від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована maintenance lane Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже працював або працює цього дня UTC. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують базову кількість passing tests. Grouped report записує per-config wall time і max RSS на Linux та macOS, тож порівняння before/after показує дельти пам’яті тестів поруч із дельтами тривалості. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається до того, як bot push потрапить у репозиторій, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для cleanup дублікатів після land. За замовчуванням це dry-run, і він закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR має merge, і що кожен duplicate має або спільне referenced issue, або перекривні changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий platform scope CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування tests запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним з explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change падала ще до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Testbox validation

Crabbox — це належна репозиторію обгортка віддаленої машини для maintainer-підтверджень у Linux. Використовуйте її
з кореня репозиторію, коли перевірка надто широка для локального циклу редагування, коли важлива
паритетність із CI, або коли підтвердженню потрібні секрети, Docker, package lanes,
багаторазові машини чи віддалені логи. Звичайний бекенд OpenClaw —
`blacksmith-testbox`; власні потужності AWS/Hetzner є fallback для збоїв Blacksmith,
проблем із квотою або явного тестування на власних потужностях.

Запуски Blacksmith через Crabbox прогрівають, резервують, синхронізують, запускають, звітують і очищають
одноразові Testboxes. Вбудована sanity-перевірка синхронізації швидко завершується помилкою, коли потрібні
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для PR з навмисним великим видаленням встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик CLI Blacksmith, який лишається у фазі
синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відхиляє застарілий бінарний файл Crabbox, який не рекламує `blacksmith-testbox`. Передавайте провайдера явно, навіть попри те, що `.crabbox.yaml` має стандартні налаштування власної хмари. У worktree Codex або linked/sparse checkout уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до старту Crabbox; натомість викликайте node-обгортку напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith потребують Crabbox 0.22.0 або новішої версії, щоб обгортка отримала поточну поведінку синхронізації, черги та очищення Testbox. Коли використовуєте сусідній checkout, перебудуйте ігнорований локальний бінарний файл перед роботою з вимірюванням часу або підтвердженням:

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

Читайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Для делегованих
запусків Blacksmith Testbox код завершення обгортки Crabbox і JSON-підсумок є
результатом команди. Пов’язаний запуск GitHub Actions відповідає за гідратацію та keepalive; він
може завершитися як `cancelled`, коли Testbox зупинено ззовні після того, як SSH-команда
вже повернулася. Вважайте це артефактом очищення/статусу, якщо тільки
`exitCode` обгортки не є ненульовим або вивід команди не показує невдалий тест.
Одноразові запуски Crabbox через Blacksmith мають автоматично зупиняти Testbox;
якщо запуск перервано або очищення незрозуміле, перевірте активні машини й зупиняйте лише
ті машини, які створили ви:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібні кілька команд на одній і тій самій гідратованій машині:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є зламаним шаром, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і очищення. Виправте
шлях Crabbox, перш ніж вважати прямий запуск Blacksmith maintainer-підтвердженням.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups сидять у стані `queued` без IP або URL запуску Actions після кількох хвилин,
вважайте це тиском провайдера Blacksmith, черги, білінгу або лімітів організації. Зупиніть
queued ids, які ви створили, уникайте запуску нових Testboxes і перенесіть підтвердження на
шлях власних потужностей Crabbox нижче, поки хтось перевіряє dashboard Blacksmith,
білінг і ліміти організації.

Переходьте на власні потужності Crabbox лише коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власні потужності є явною метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завданню справді не потрібен CPU класу 48xlarge. Запит `beast` стартує зі 192 vCPU і є найпростішим способом зачепити регіональну квоту EC2 Spot або On-Demand Standard. Належний репозиторію `.crabbox.yaml` за замовчуванням використовує `standard`, кілька регіонів потужностей і `capacity.hints: true`, тож брокерські AWS-оренди друкують вибраний регіон/ринок, тиск квоти, Spot fallback і попередження про класи з високим тиском. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от повний набір або Docker-матриці всіх Plugin, явна release/blocker validation або профілювання продуктивності з великою кількістю ядер. Не використовуйте `beast` для `pnpm check:changed`, сфокусованих тестів, роботи лише з документацією, звичайного lint/typecheck, малих E2E repros або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики потужностей, щоб коливання Spot-ринку не змішувалися із сигналом.

`.crabbox.yaml` володіє стандартними налаштуваннями провайдера, синхронізації та гідратації GitHub Actions для lanes власної хмари. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації maintainer-локальних remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передаванням несекретного середовища для команд власної хмари `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
