---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується помилкою
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, парасольки релізів і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-06-28T00:11:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Канонічні
push до `main` спершу проходять через 90-секундне вікно допуску hosted-runner.
Наявна група concurrency `CI` скасовує цей запуск, що очікує, коли надходить новіший
commit, тож послідовні merge не реєструють кожен повну матрицю Blacksmith.
Pull request і ручні dispatch пропускають очікування. Потім job `preflight`
класифікує diff і вимикає дорогі lane, коли змінено лише непов’язані
області. Ручні запуски `workflow_dispatch` навмисно обходять розумне
обмеження scope і розгортають повний graph для release candidate та широкої
валідації. Android lane залишаються opt-in через `include_android`. Покриття
Plugin лише для релізів живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease)
і запускається лише з [`Full Release Validation`](#full-release-validation)
або явного ручного dispatch.

## Огляд pipeline

| Job                                | Призначення                                                                                                   | Коли запускається                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в docs, змінені scope, змінені extensions і будує manifest CI                   | Завжди для non-draft push і PR                  |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push до `main` перед реєстрацією роботи Blacksmith                | Кожен запуск CI; sleep лише для канонічних push до `main` |
| `security-fast`                    | Виявлення приватних ключів, audit змінених workflow через `zizmor` і audit production lockfile                 | Завжди для non-draft push і PR                  |
| `check-dependencies`               | Production Knip dependency-only pass плюс guard allowlist для невикористаних файлів                                 | Зміни, релевантні для Node                               |
| `build-artifacts`                  | Збирає `dist/`, Control UI, smoke-перевірки built-CLI, embedded built-artifact checks і reusable artifacts | Зміни, релевантні для Node                               |
| `checks-fast-core`                 | Швидкі Linux lane коректності, як-от bundled, protocol, QA Smoke CI і перевірки CI-routing                | Зміни, релевантні для Node                               |
| `checks-fast-contracts-plugins-*`  | Дві sharded перевірки контрактів Plugin                                                                        | Зміни, релевантні для Node                               |
| `checks-fast-contracts-channels-*` | Дві sharded перевірки контрактів channel                                                                       | Зміни, релевантні для Node                               |
| `checks-node-core-*`               | Shard тестів core Node, за винятком channel, bundled, contract і extension lane                          | Зміни, релевантні для Node                               |
| `check-*`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke                | Зміни, релевантні для Node                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і runtime topology     | Зміни, релевантні для Node                               |
| `checks-node-compat-node22`        | Збірка сумісності з Node 22 і smoke lane                                                                | Ручний CI dispatch для релізів                     |
| `check-docs`                       | Форматування docs, lint і перевірки broken-link                                                             | Docs змінено                                        |
| `skills-python`                    | Ruff + pytest для Skills на Python                                                                    | Зміни, релевантні для Python-skill                       |
| `checks-windows`                   | Специфічні для Windows тести process/path плюс спільні регресії runtime import specifier                      | Зміни, релевантні для Windows                            |
| `macos-node`                       | macOS TypeScript test lane з використанням спільних built artifacts                                               | Зміни, релевантні для macOS                              |
| `macos-swift`                      | Swift lint, build і tests для macOS app                                                            | Зміни, релевантні для macOS                              |
| `ios-build`                        | Генерація Xcode project плюс simulator build iOS app                                                 | iOS app, shared app kit або Swabble changes         |
| `android`                          | Android unit tests для обох flavors плюс одна debug APK build                                              | Зміни, релевантні для Android                            |
| `test-performance-agent`           | Щоденна оптимізація повільних Codex test після trusted activity                                                 | Успіх Main CI або manual dispatch                  |
| `openclaw-performance`             | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.5 live lane | Scheduled і manual dispatch                       |

## Порядок fail-fast

1. `runner-admission` очікує лише для канонічних push до `main`; новіший push скасовує запуск до реєстрації Blacksmith.
2. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього job, а не окремими job.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix job.
4. `build-artifacts` перекривається зі швидкими Linux lane, щоб downstream consumers могли стартувати щойно спільна build буде готова.
5. Важчі platform і runtime lane розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати superseded job як `cancelled`, коли новіший push надходить до того самого PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Matrix job використовують `fail-fast: false`, а `build-artifacts` повідомляє про failures embedded channel, core-support-boundary і gateway-watch напряму замість постановки в чергу крихітних verifier job. Автоматичний concurrency key CI версійований (`CI-v7-*`), щоб zombie на боці GitHub у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші job, failures і fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий run summary як artifact `ci-timings-summary`. Для build timing перевірте крок `Build dist` job `build-artifacts`: `pnpm build:ci-artifacts` друкує `[build-all] phase timings:` і містить `ui:build`; job також завантажує artifact `startup-memory`.

Для запусків pull request terminal job timing-summary запускає helper з trusted base revision перед передаванням `GH_TOKEN` до `gh run view`. Це тримає tokened query поза branch-controlled code, водночас підсумовуючи поточний CI run pull request.

## Контекст PR і докази

PR зовнішніх contributor запускають gate контексту PR і доказів із
`.github/workflows/real-behavior-proof.yml`. Workflow виконує checkout trusted
base commit і оцінює лише тіло PR; він не виконує code з contributor branch.

Gate застосовується до авторів PR, які не є owners, members,
collaborators або bots репозиторію. Він проходить, коли тіло PR містить authored
sections `What Problem This Solves` і `Evidence`. Evidence може бути focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Тіло надає intent і корисну validation;
reviewers перевіряють code, tests і CI, щоб оцінити correctness.

Коли check падає, оновіть тіло PR замість push ще одного code commit.

## Scope і routing

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідуть graph Node CI плюс workflow linting, але самі по собі не примушують запускати Windows, iOS, Android або macOS native builds; ці platform lane залишаються scoped до змін platform source.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML files, composite-action interpolation guard і conflict-marker guard. PR-scoped job `security-fast` також запускає `zizmor` для змінених workflow files, щоб findings безпеки workflow падали рано в main CI graph.
- **Docs на push до `main`** перевіряються standalone workflow `Docs` з тим самим ClawHub docs mirror, який використовує CI, тож mixed code+docs pushes не ставлять додатково в чергу shard CI `check-docs`. Pull request і manual CI все ще запускають `check-docs` з CI, коли docs змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тому він покриває і deterministic fixture lane `TuiBackend`, і повільніший smoke `tui --local`, який mock лише external model endpoint.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і одну task `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування runner-ів: контракти plugin і контракти каналів запускаються як два зважені шарди з підтримкою Blacksmith кожен, зі стандартним запасним runner-ом GitHub; швидкі/допоміжні лінії core unit запускаються окремо; core runtime infra розділено між state, process/config, shared і трьома доменними шардами cron; auto-reply запускається як збалансовані workers (із піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing); а agentic gateway/server configs розділено між лініями chat/auth/model/http-plugin/runtime/startup замість очікування на зібрані артефакти. Далі звичайний CI пакує лише ізольовані шарди include-pattern infra у детерміновані пакети щонайбільше з 64 тестових файлів, зменшуючи матрицю Node без об’єднання неізольованих наборів command/cron, stateful agents-core або gateway/server; важкі фіксовані набори залишаються на 8 vCPU, а пакетовані та менш навантажені лінії використовують 4 vCPU. Pull request-и в канонічному репозиторії використовують додатковий компактний план допуску: ті самі групи per-config запускаються в ізольованих subprocess-ах усередині поточного плану Linux Node на 34 завдання, тому один PR не реєструє повну матрицю Node на понад 70 завдань. Push-и в `main`, ручні dispatch-и та release gates зберігають повну матрицю. Широкі browser, QA, media та різні тести plugin використовують власні виділені конфігурації Vitest замість спільного catch-all для plugin. Шарди include-pattern записують timing entries з використанням імені CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого шарда. `check-additional-*` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; список boundary guard розподілено смугами на один prompt-heavy shard і один combined shard для решти guard stripes, кожен із яких паралельно запускає вибрані незалежні guards і друкує timings для кожної перевірки. Дорога перевірка drift для Codex happy-path prompt snapshot запускається як окреме додаткове завдання лише для ручного CI та змін, що впливають на prompts, тому звичайні не пов’язані зміни Node не чекають за холодною генерацією prompt snapshot, а boundary shards залишаються збалансованими, поки prompt drift усе ще прив’язаний до PR, який його спричинив; той самий прапорець пропускає генерацію prompt snapshot Vitest усередині шарда built-artifact core support-boundary. Gateway watch, тести каналів і шард core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Після допуску канонічний Linux CI дозволяє до 24 одночасних тестових завдань Node і
12 для менших fast/check ліній; Windows і Android залишаються на двох, бо
ці пули runner-ів вужчі.

Компактний PR-план створює 18 завдань Node для поточного набору: групи
whole-config пакетуються в ізольованих subprocess-ах із 120-хвилинним batch timeout,
а групи include-pattern використовують той самий обмежений бюджет завдань.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test лінія все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дублювання завдання пакування debug APK під час кожного Android-релевантного push.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, прив’язаний до найновішої версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard завершується помилкою, коли PR додає новий неперевірений невикористаний файл або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — це міст на стороні цілі від активності репозиторію OpenClaw до ClawSweeper. Він не checkout-ить і не виконує недовірений код pull request-ів. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit під час push-ів у `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Лінія `github_activity` пересилає лише нормалізовані metadata: тип події, action, actor, repository, номер item, URL, title, state і короткі уривки для comments або reviews, коли вони наявні. Вона навмисно уникає пересилання повного webhook body. Приймальний workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність — це спостереження, а не доставка за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія неочікувана, actionable, ризикована або операційно корисна. Рутинні opens, edits, bot churn, duplicate webhook noise і звичайний review traffic мають давати `NO_REPLY`.

Протягом усього цього шляху вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними. Це input для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні dispatch-и

Ручні CI dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну non-Android scoped line: Linux Node shards, bundled-plugin shards, plugin і channel contract shards, Node 22 compatibility, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build і Control UI i18n. Окремі ручні CI dispatch-и запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only шард `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` викликає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запускати цей граф проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner-и

| Runner                          | Завдання                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ручний CI dispatch і fallbacks для неканонічних репозиторіїв, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, docs workflows поза CI та install-smoke preflight, щоб матриця Blacksmith могла стати в чергу раніше                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менш навантажені extension shards, `checks-fast-core`, plugin/channel contract shards, більшість bundled/менш навантажених Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, вибрані шарди `check-additional-*` і `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі Linux Node suites, boundary/extension-heavy шарди `check-additional-*` і `android`                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощадили); install-smoke Docker builds (час очікування 32-vCPU queue коштував більше, ніж заощадив)                                                                                       |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; forks повертаються до `macos-26`                                                                                                                                                                                                 |

## Бюджет реєстрації runner-ів

Поточний GitHub runner-registration bucket OpenClaw дозволяє 3 000 self-hosted
runner registrations за 5 хвилин. Ліміт спільний для всіх Blacksmith runner
registrations в організації `openclaw`, тому додавання ще однієї Blacksmith
installation не додає нового bucket.

Вважайте Blacksmith labels дефіцитним ресурсом для burst control. Завдання, які
лише route, notify, summarize, select shards або запускають короткі CodeQL scans, мають
залишатися на GitHub-hosted runners, якщо вони не мають виміряних Blacksmith-specific
потреб. Будь-яка нова Blacksmith matrix, більший `max-parallel` або high-frequency
workflow має показати свій worst-case registration count і тримати org-level
target нижче 2 000 registrations за 5 хвилин, залишаючи headroom для одночасних
repositories і повторно запущених jobs.

Canonical-repo CI зберігає Blacksmith як default runner path для звичайних push і pull-request runs. `workflow_dispatch` і запуски неканонічних репозиторіїв використовують GitHub-hosted runners, але звичайні canonical runs наразі не перевіряють Blacksmith queue health і не переходять автоматично на GitHub-hosted labels, коли Blacksmith недоступний.

## Локальні еквіваленти

```bash
pnpm changed:lanes                            # перевірити локальний класифікатор змінених lane для origin/main...HEAD
pnpm check:changed                            # розумний локальний check gate: змінені typecheck/lint/guards за boundary lane
pnpm check                                    # швидкий локальний gate: prod tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed                              # той самий gate із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # тести vitest
pnpm test:changed                             # дешеві розумні змінені цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # форматування docs + lint + биті посилання
pnpm build                                    # зібрати dist, коли важливі артефакти CI або smoke-перевірки
pnpm ios:build                                # згенерувати й зібрати проєкт застосунку iOS
pnpm ci:timings                               # підсумувати найновіший CI-запуск push для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні CI-запуски main
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші jobs
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати CI для push origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні CI-запуски main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main`, а також може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark-ить workflow ref. Установіть `target_ref`, щоб benchmark-ити тег релізу або іншу гілку з поточною реалізацією workflow. Опубліковані шляхи звітів і latest-вказівники ключуються за протестованим ref, а кожен `index.md` записує протестований ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` на зафіксованому input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фейковою OpenAI-сумісною авторизацією.
- `mock-deep-profile`: CPU/heap/trace profiling для гарячих точок startup, gateway і agent-turn.
- `live-openai-candidate`: реальний agent turn OpenAI `openai/gpt-5.5`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: таймінг і пам’ять запуску gateway для default, hook і 50-plugin startup cases; RSS імпорту bundled plugin, повторювані mock-OpenAI hello loops `channel-chat-baseline`, CLI startup commands проти запущеного gateway і SQLite state smoke performance probe. Коли попередній опублікований source report mock-provider доступний для протестованого ref, source summary порівнює поточні значення RSS і heap з цим baseline і позначає великі збільшення RSS як `watch`. Markdown-зведення source probe розміщується в `source/index.md` у report bundle, а поруч із ним лежить raw JSON.

Кожен lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний tested-ref pointer записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед релізом". Він приймає гілку, тег або повний commit SHA, dispatch-ить ручний workflow `CI` з цією ціллю, dispatch-ить `Plugin Prerelease` для release-only plugin/package/static/Docker proof і dispatch-ить `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, рендерингу maturity scorecard з QA profile evidence, QA Lab parity, Matrix і Telegram lanes. Профілі stable і full завжди включають вичерпне покриття live/E2E та Docker release-path soak; профіль beta може ввімкнути його через `run_release_soak=true`. Канонічний package Telegram E2E запускається всередині Package Acceptance, тому повний кандидат не запускає дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати shipped npm package у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторної збірки. Використовуйте `npm_telegram_package_spec` лише для сфокусованого Telegram rerun опублікованого package. Live package lane Plugin Codex за замовчуванням використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, тоді як SHA/artifact runs пакують `extensions/codex` з вибраного ref. Установіть `codex_plugin_spec` явно для кастомних plugin sources, таких як specs `npm:`, `npm-pack:` або `git:`.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profile, artifacts і
handles сфокусованого rerun.

`OpenClaw Release Publish` — це ручний mutating release workflow. Dispatch-те його
з `release/YYYY.M.PATCH` або `main` після того, як release tag існує і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
dispatch-ить `Plugin NPM Release` для всіх publishable plugin packages, dispatch-ить
`Plugin ClawHub Release` для того самого release SHA і лише потім dispatch-ить
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Stable publish також
вимагає точний `windows_node_tag`; workflow перевіряє Windows source
release і порівнює його x64/ARM64 installers із candidate-approved
input `windows_node_installer_digests` перед будь-яким publish child, а потім просуває
і перевіряє ті самі зафіксовані installer digests плюс точний companion asset
і checksum contract перед публікацією чернетки GitHub release.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на гілці, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути гілками або тегами, а не raw commit SHAs. Цей
helper пушить тимчасову гілку `release-ci/<sha>-...` на target SHA,
dispatch-ить `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасову гілку, коли
run завершується. Umbrella verifier також падає, якщо будь-який child workflow запускався на
іншому SHA.

`release_profile` керує шириною live/provider, переданою в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка advisory provider/media matrix. Stable і full
release checks завжди запускають вичерпний live/E2E і Docker release-path soak;
профіль beta може ввімкнути його через `run_release_soak=true`.

- `minimum` залишає найшвидші OpenAI/core release-critical lanes.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує dispatched child run ids, а фінальний job `Verify full validation` повторно перевіряє поточні child run conclusions і додає таблиці найповільніших jobs для кожного child run. Якщо child workflow перезапущено і він стає green, перезапустіть лише parent verifier job, щоб оновити umbrella result і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для normal full CI child, `plugin-prerelease` лише для plugin prerelease child, `release-checks` для кожного release child або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` на umbrella. Це утримує rerun failed release box обмеженим після сфокусованого fix. Для одного failed cross-OS lane поєднайте `rerun_group=cross-os` з `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS commands виводять рядки Heartbeat, а packaged-upgrade summaries містять per-phase timings. QA release-check lanes є advisory, окрім standard runtime tool coverage gate, який блокує, коли required OpenClaw dynamic tools зміщуються або зникають зі standard tier summary.

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати selected ref у tarball `release-package-under-test`, а потім передає цей artifact у cross-OS checks і Package Acceptance, плюс live/E2E release-path Docker workflow, коли запускається soak coverage. Це зберігає package bytes узгодженими між release boxes і уникає повторного пакування того самого candidate у кількох child jobs. Для Codex npm-plugin live lane release checks або передають відповідний published plugin spec, виведений із `release_package_spec`, або передають наданий оператором `codex_plugin_spec`, або залишають input порожнім, щоб Docker script пакував Codex plugin вибраного checkout.

Дубльовані runs `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Parent monitor скасовує будь-який child workflow, який
він уже dispatch-нув, коли parent скасовано, тож новіша main validation
не стоїть за застарілим двогодинним release-check run. Release branch/tag
validation і focused rerun groups залишають `cancel-in-progress: false`.

## Реальні та E2E-шарди

Release live/E2E child зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного serial job:

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
- split media audio/video shards і provider-filtered music shards

Це зберігає те саме file coverage, водночас роблячи повільні failures live provider простішими для rerun і діагностики. Aggregate shard names `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних one-shot reruns.

Native live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску nested Docker tests.

Live-модель і шарди бекенду на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live-релізний workflow збирає й публікує цей образ один раз, після чого Docker-шарди live-моделі, Gateway із шардованими провайдерами, CLI-бекенд, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не витрачав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну Docker-ціль із вихідного коду, релізний запуск налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи з package digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив такий; автономний dispatch Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо визначення пакета, Docker-приймання або опційний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованого prerelease/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` є обов’язковим. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення імена хостів або resolved IPs, а також перенаправлення за межі тієї самої публічної політики безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики trusted-source у `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` є обов’язковими. Використовуйте це лише для enterprise-дзеркал, якими володіють maintainers, або приватних репозиторіїв пакетів, яким потрібні налаштовані хости, порти, префікси шляхів, хости перенаправлення або private-network resolution. Якщо політика оголошує bearer auth, workflow використовує фіксований секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; облікові дані, вбудовані в URL, усе одно відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його варто надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні chunks Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує покриття offline plugin, щоб перевірка опублікованого пакета не залежала від live-доступності ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних dispatches.

Щодо спеціальної політики тестування оновлень і plugins, включно з локальними командами,
Docker lanes, вхідними параметрами Package Acceptance, релізними defaults і triage помилок,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це утримує міграцію пакета, оновлення, live-встановлення Skills із ClawHub, очищення застарілих залежностей plugin, відновлення встановлення налаштованого plugin, offline plugin, plugin-update і доказ Telegram на тому самому визначеному tarball пакета. Встановіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю проти відвантаженого npm-пакета без перебудови; встановлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта релізної перевірки. Cross-OS release checks усе ще покривають OS-специфічний onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один опублікований baseline пакета за запуск у блокувальному release path. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири останні stable npm-релізи плюс зафіксовані boundary-релізи сумісності plugins і fixtures у формі issues для конфігурації Feishu, збережених bootstrap/persona files, встановлень налаштованого OpenClaw plugin, tilde log paths і застарілих коренів залежностей legacy plugin. Вибори multi-baseline published-upgrade survivor шардовано за baseline в окремі цільові Docker runner jobs. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні aggregate-запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікований lane налаштовує baseline за допомогою baked recipe команди `openclaw config set`, записує кроки recipe у `summary.json` і після старту Gateway перевіряє `/healthz`, `/readyz`, а також RPC status. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.5`, щоб proof встановлення й Gateway залишався на тестовій моделі GPT-5, уникаючи defaults GPT-4.x.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях compatibility:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропускати subcase persistence `gateway install --wrapper`, коли пакет не exposes цей flag;
- `update-channel-switch` може prune відсутні pnpm `patchedDependencies` із fake git fixture, утвореного з tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy locations install-record або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти migration config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про stamp files локальних build metadata, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і команди повторного запуску. Надавайте перевагу повторному запуску невдалого package profile або точних Docker lanes замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/пакетів, змін пакетів/маніфестів вбудованих плагінів або поверхонь core-плагінів/каналів/Gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише у вихідному коді вбудованих плагінів, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg для вбудованого розширення та запускає обмежений Docker-профіль вбудованого плагіна з агрегованим тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає покриття встановлення QR-пакета та Docker/update інсталятора для нічних запланованих запусків, ручних dispatch, release checks через workflow-call і pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один smoke-образ GHCR root Dockerfile для цільового SHA, а потім запускає встановлення QR-пакета, smoke-перевірки root Dockerfile/Gateway, smoke-перевірки інсталятора/update і швидкий Docker E2E вбудованого плагіна як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push у `main` (включно з merge commit) не примушують до повного шляху; коли логіка changed-scope запитала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push у `main` — ні. Звичайний PR CI все одно запускає швидку regression lane Bun launcher для змін, релевантних Node. QR і Docker-тести інсталятора зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальне Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типове значення | Призначення                                                                                   |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10              | Кількість слотів основного пулу для звичайних lanes.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Кількість слотів tail-пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9               | Ліміт одночасних live lanes, щоб провайдери не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5               | Ліміт одночасних lanes встановлення npm.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7               | Ліміт одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Інтервал між стартами lanes, щоб уникнути сплесків create у Docker daemon; задайте `0`, щоб вимкнути інтервал. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000         | Резервний тайм-аут на lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset           | `1` друкує план планувальника без запуску lanes.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset           | Розділений комами точний список lanes; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Локальні агреговані preflights перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних lanes, зберігають timings lanes для впорядкування longest-first і типово припиняють планувати нові pooled lanes після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує bare/functional GHCR Docker E2E образи з package-digest tags через Docker layer cache Blacksmith, коли план потребує lanes із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pull Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Частини release path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `package-update-openai` включає live Codex plugin package lane, яка встановлює кандидатний пакет OpenClaw, встановлює Codex plugin з `codex_plugin_spec` або same-ref tarball з явним схваленням встановлення Codex CLI, запускає Codex CLI preflight, а потім виконує кілька same-session OpenClaw agent turns проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими aliases plugin/runtime. Alias lane `install-e2e` залишається агрегованим ручним rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage цього вимагає, і зберігає standalone chunk `openwebui` лише для dispatches тільки OpenWebUI. Bundled-channel update lanes повторюють запуск один раз у разі тимчасових мережевих збоїв npm.

Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує debugging невдалої lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове job локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала lane могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти й надрукувати об’єднані/цільові per-lane команди rerun
pnpm test:docker:timings <summary>   # зведення slow-lane і phase critical-path
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — дорожче покриття product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і standalone manual CI dispatches тримають цей suite вимкненим. Він балансує тести вбудованих плагінів між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації плагінів одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy batches плагінів не створювали додаткові CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у малі групи, щоб не резервувати десятки runners для завдань на одну-три хвилини. Workflow також завантажує інформаційний артефакт `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; findings inspector є triage input і не змінюють blocking gate Plugin Prerelease.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладено в широкі QA та release harnesses, а не в standalone PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із broad validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за manual dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб contract каналу був ізольований від live model latency і звичайного startup provider-plugin. Live transport Gateway вимикає memory search, бо QA parity окремо покриває поведінку пам’яті; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI його підтримує. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди shard-ить full Matrix coverage у jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як parallel lane jobs, потім завантажує обидва артефакти в невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity required status.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Daily, manual і non-draft pull request guard runs сканують Actions workflow code та найризиковіші поверхні JavaScript/TypeScript з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять у PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Автентифікація, секрети, пісочниця, Cron і базовий рівень Gateway                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації каналів ядра, а також середовище виконання Plugin каналу, Gateway, Plugin SDK, секрети, точки аудиту          |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політики SSRF ядра, розбору IP, мережевого захисту, web-fetch і SSRF у Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Сервери MCP, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                          |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення менеджером пакетів, завантаження джерел і контракту пакета Plugin SDK |

### Специфічні для платформ шарди безпеки

- `CodeQL Android Critical Security` — запланований шард безпеки Android. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux раннері, який приймає перевірка коректності робочого процесу. Завантажує результати в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний шард безпеки macOS. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збирання залежностей із завантаженого SARIF і завантажує результати в `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусками, бо збирання macOS домінує за часом виконання навіть коли все чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний шард не для безпеки. Він виконує лише JavaScript/TypeScript-запити якості із серйозністю error і безпеки не стосуються, на вузьких високовартісних поверхнях на раннерах Linux, розміщених на GitHub, щоб сканування якості не витрачали бюджет реєстрації раннерів Blacksmith. Його захист pull request навмисно менший за запланований профіль: лише PR не в чернетці запускають відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та диспетчеризації відповідей, схемі конфігурації/міграціях/IO, автентифікації/секретах/пісочниці/безпеці, середовищі виконання каналів ядра та вбудованих Plugin каналів, протоколі Gateway/методах сервера, середовищі виконання пам’яті/зв’язуванні SDK, MCP/процесах/вихідній доставці, середовищі виконання провайдера/каталозі моделей, діагностиці сесій/чергах доставки, завантажувачі Plugin, Plugin SDK/контракті пакета або середовищі виконання відповідей Plugin SDK. Зміни конфігурації CodeQL і робочого процесу якості запускають усі дванадцять PR-шардів якості.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це навчальні/ітераційні гачки для запуску одного шарда якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Контракти схеми конфігурації, міграції, нормалізації та IO                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації каналів ядра та вбудованих Plugin каналів                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракти виконання команд, диспетчеризації моделей/провайдерів, диспетчеризації й черг автовідповідей та середовища виконання площини керування ACP             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади середовища виконання пам’яті, псевдоніми пам’яті Plugin SDK, зв’язування активації середовища виконання пам’яті та команди doctor для пам’яті |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/фрагментації/середовища виконання відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив’язування сесій/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація середовища виконання провайдерів, типові значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальне збереження, потоки керування Gateway і контракти середовища виконання площини керування завданнями                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти середовища виконання fetch/search у web ядра, media IO, розуміння медіа, image-generation і media-generation                                            |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точки входу Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та допоміжні засоби контракту пакета Plugin                                                                        |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід повертати лише як scoped або шардовану подальшу роботу після того, як вузькі профілі матимуть стабільний час виконання та сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації в узгодженості з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний запуск може виконати його напряму. Виклики через workflow-run пропускаються, коли `main` уже зсунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик через workflow-run уже виконувався або виконується цього UTC-дня. Ручний запуск обходить цей щоденний шлюз активності. Лінія формує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість успішних тестів. Згрупований звіт записує wall time для кожної конфігурації та max RSS на Linux і macOS, тож порівняння до/після показує дельти пам’яті тестів поруч із дельтами тривалості. Якщо базовий рівень має невдалі тести, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапляє в репозиторій, лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує Ubuntu, розміщену на GitHub, щоб дія Codex могла зберегти таку саму позицію безпеки drop-sudo, як і docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після land. Типово він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що PR, який потрапив у репозиторій, змаржено, і що кожен дублікат має або спільну згадану issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні шлюзи перевірок і маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіший щодо архітектурних меж, ніж широкий платформний обсяг CI:

- зміни production-коду ядра запускають typecheck для core prod і core test, а також lint/guards ядра;
- зміни лише в тестах ядра запускають тільки typecheck для core test і lint ядра;
- зміни production-коду розширень запускають typecheck для extension prod і extension test, а також lint розширень;
- зміни лише в тестах розширень запускають typecheck для extension test і lint розширень;
- зміни публічного Plugin SDK або контракту Plugin розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра (огляди розширень Vitest залишаються явною тестовою роботою);
- version bumps лише в метаданих релізу запускають цільові перевірки версій/конфігурації/кореневих залежностей;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел надають перевагу явним мапінгам, потім sibling-тестам і залежним за import graph. Конфігурація доставки shared group-room є одним із явних мапінгів: зміни конфігурації видимої групової відповіді, режиму доставки відповідей джерела або системного prompt інструмента повідомлень проходять через основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна спільного типового значення падала до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для всього harness, і дешевий маплений набір не є надійним proxy.

## Валідація Testbox

Crabbox — це repo-owned remote-box wrapper для maintainer Linux proof. Використовуйте його з кореня репозиторію, коли перевірка занадто широка для локального edit loop, коли важлива паритетність із CI або коли proof потребує secrets, Docker, package lanes, reusable boxes чи remote logs. Звичайний backend OpenClaw —
`blacksmith-testbox`; власні потужності AWS/Hetzner є fallback для збоїв Blacksmith, проблем із квотами або явного тестування на owned-capacity.

Підтримувані Crabbox запуски Blacksmith прогрівають, резервують, синхронізують, запускають, звітують і очищають
одноразові Testbox. Вбудована перевірка коректності синхронізації швидко завершується з помилкою, коли потрібні
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для PR з навмисними масовими видаленнями задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик Blacksmith CLI, який лишається у фазі
синхронізації понад п'ять хвилин без виводу після синхронізації. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте wrapper з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper репозиторію відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передавайте provider явно, навіть якщо `.crabbox.yaml` має стандартні значення owned-cloud. У робочих деревах Codex або пов'язаних/розріджених checkout уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до старту Crabbox; натомість викликайте node wrapper напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Підтримувані Blacksmith запуски потребують Crabbox 0.22.0 або новішого, щоб wrapper отримував поточну поведінку синхронізації, черги та очищення Testbox. Під час використання сусіднього checkout перебудуйте ігнорований локальний бінарний файл перед вимірюванням часу або доказовою роботою:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Gate змін:

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

Сфокусований повторний запуск тестів:

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

Прочитайте фінальний підсумок JSON. Корисні поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Для делегованих
запусків Blacksmith Testbox код виходу wrapper Crabbox і підсумок JSON є
результатом команди. Пов'язаний запуск GitHub Actions відповідає за hydration і keepalive; він
може завершитися як `cancelled`, коли Testbox зупинено ззовні після того, як SSH
команда вже повернулася. Розглядайте це як артефакт очищення/статусу, якщо тільки
wrapper `exitCode` не є ненульовим або вивід команди не показує невдалий тест.
Одноразові підтримувані Blacksmith запуски Crabbox мають зупиняти Testbox автоматично;
якщо запуск перервано або очищення неясне, перевірте активні boxes і зупиняйте лише
ті boxes, які створили ви:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте reuse лише тоді, коли навмисно потрібно виконати кілька команд на тому самому hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо Crabbox є зламаним шаром, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і очищення. Виправте
шлях Crabbox, перш ніж вважати прямий запуск Blacksmith доказом maintainer.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups лишаються `queued` без IP або URL запуску Actions через кілька хвилин,
вважайте це тиском з боку provider Blacksmith, черги, billing або лімітів org. Зупиніть
створені вами queued ids, не запускайте більше Testboxes і перенесіть proof на
шлях власної місткості Crabbox нижче, поки хтось перевіряє dashboard Blacksmith,
billing і ліміти org.

Переходьте на власну місткість Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власна місткість є явно заявленою метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завдання справді не потребує CPU класу 48xlarge. Запит `beast` стартує зі 192 vCPU і є найпростішим способом зачепити регіональну квоту EC2 Spot або On-Demand Standard. Належний репозиторію `.crabbox.yaml` за замовчуванням використовує `standard`, кілька регіонів місткості та `capacity.hints: true`, тож brokered AWS leases виводять вибраний регіон/ринок, тиск квоти, fallback Spot і попередження про класи високого тиску. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от full-suite або all-plugin Docker matrices, явна release/blocker validation чи high-core performance profiling. Не використовуйте `beast` для `pnpm check:changed`, сфокусованих тестів, роботи лише з docs, звичайних lint/typecheck, малих E2E repro або triage перебоїв Blacksmith. Використовуйте `--market on-demand` для діагностики місткості, щоб нестабільність ринку Spot не змішувалася із сигналом.

`.crabbox.yaml` відповідає за provider, синхронізацію та стандартні значення hydration GitHub Actions для owned-cloud lanes. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні віддалені метадані Git замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` відповідає за checkout, налаштування Node/pnpm, fetch `origin/main` і передавання несекретного середовища для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов'язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
