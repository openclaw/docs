---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, шлюзи області дії, парасольки релізу та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-07-02T14:09:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Канонічні
push до `main` спершу проходять 90-секундне вікно допуску на hosted-runner.
Наявна група конкурентності `CI` скасовує цей запуск в очікуванні, коли надходить новіший
commit, тому послідовні merge не реєструють кожен повну матрицю Blacksmith.
Pull request і ручні dispatch пропускають очікування. Завдання `preflight`
потім класифікує diff і вимикає дорогі доріжки, коли змінилися лише непов’язані
області. Ручні запуски `workflow_dispatch` навмисно обходять розумне
обмеження scope і розгортають повний граф для release candidate та широкої
валідації. Android-доріжки залишаються opt-in через `include_android`. Покриття
Plugin лише для релізів живе в окремому workflow [`Передреліз Plugin`](#plugin-prerelease)
і запускається лише з [`Повної валідації релізу`](#full-release-validation)
або явного ручного dispatch.

## Огляд pipeline

| Завдання                           | Призначення                                                                                               | Коли запускається                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в документації, змінені scope, змінені extensions і збирає маніфест CI                | Завжди для non-draft push і PR                      |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push до `main` перед реєстрацією роботи Blacksmith           | Кожен запуск CI; sleep лише для канонічних push до `main` |
| `security-fast`                    | Виявлення приватних ключів, аудит змінених workflow через `zizmor` і аудит production lockfile           | Завжди для non-draft push і PR                      |
| `check-dependencies`               | Production Knip прохід лише для залежностей плюс guard allowlist невикористаних файлів                   | Зміни, релевантні для Node                          |
| `build-artifacts`                  | Збірка `dist/`, Control UI, smoke-перевірки built-CLI, перевірки вбудованих build-artifact і reusable artifacts | Зміни, релевантні для Node                          |
| `checks-fast-core`                 | Швидкі Linux-доріжки коректності, як-от bundled, protocol, QA Smoke CI і перевірки маршрутизації CI      | Зміни, релевантні для Node                          |
| `checks-fast-contracts-plugins-*`  | Дві шардовані перевірки контрактів Plugin                                                                 | Зміни, релевантні для Node                          |
| `checks-fast-contracts-channels-*` | Дві шардовані перевірки контрактів каналів                                                                | Зміни, релевантні для Node                          |
| `checks-node-core-*`               | Шарди тестів core Node, за винятком доріжок channel, bundled, contract і extension                       | Зміни, релевантні для Node                          |
| `check-*`                          | Шардований еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke     | Зміни, релевантні для Node                          |
| `check-additional-*`               | Архітектура, шардований boundary/prompt drift, extension guards, package boundary і runtime topology     | Зміни, релевантні для Node                          |
| `checks-node-compat-node22`        | Збірка сумісності з Node 22 і smoke-доріжка                                                               | Ручний CI dispatch для релізів                      |
| `check-docs`                       | Форматування документації, lint і перевірки broken links                                                  | Змінено документацію                                |
| `skills-python`                    | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python Skills                 |
| `checks-windows`                   | Специфічні для Windows тести процесів/шляхів плюс регресії shared runtime import specifier               | Зміни, релевантні для Windows                       |
| `macos-node`                       | Доріжка тестів TypeScript для macOS з використанням спільних built artifacts                             | Зміни, релевантні для macOS                         |
| `macos-swift`                      | Swift lint, збірка і тести для застосунку macOS                                                          | Зміни, релевантні для macOS                         |
| `ios-build`                        | Генерація проєкту Xcode плюс simulator build застосунку iOS                                              | Зміни в застосунку iOS, shared app kit або Swabble  |
| `android`                          | Android unit tests для обох flavor плюс одна debug APK build                                             | Зміни, релевантні для Android                       |
| `test-performance-agent`           | Щоденна оптимізація повільних тестів Codex після довіреної активності                                    | Успіх main CI або ручний dispatch                   |
| `openclaw-performance`             | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.5 live lanes   | Запланований і ручний dispatch                      |

## Порядок швидкого завершення при збоях

1. `runner-admission` очікує лише для канонічних push до `main`; новіший push скасовує запуск до реєстрації Blacksmith.
2. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих artifact і platform matrix jobs.
4. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream consumers могли стартувати, щойно спільна збірка готова.
5. Після цього розгортаються важчі platform і runtime lanes: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Matrix jobs використовують `fail-fast: false`, а `build-artifacts` повідомляє про збої embedded channel, core-support-boundary і gateway-watch напряму, замість постановки в чергу малих verifier jobs. Автоматичний concurrency key CI має версію (`CI-v7-*`), щоб GitHub-side zombie у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні запуски full-suite використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші завдання, збої та fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий підсумок запуску як artifact `ci-timings-summary`. Для timing збірки перевірте крок `Build dist` у завданні `build-artifacts`: `pnpm build:ci-artifacts` виводить `[build-all] phase timings:` і містить `ui:build`; завдання також завантажує artifact `startup-memory`.

Для запусків pull request термінальне завдання timing-summary запускає helper з довіреної base revision перед передаванням `GH_TOKEN` до `gh run view`. Це тримає tokened query поза кодом, контрольованим гілкою, водночас підсумовуючи поточний CI-запуск pull request.

## Контекст PR і докази

PR зовнішніх contributor запускають gate контексту PR і доказів з
`.github/workflows/real-behavior-proof.yml`. Workflow checkout довірений
base commit і оцінює лише тіло PR; він не виконує код із гілки
contributor.

Gate застосовується до авторів PR, які не є власниками репозиторію, members,
collaborators або bots. Він проходить, коли тіло PR містить авторські
розділи `What Problem This Solves` і `Evidence`. Доказом може бути сфокусований
тест, результат CI, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Тіло надає намір і корисну валідацію;
reviewers перевіряють код, тести та CI, щоб оцінити коректність.

Коли перевірка падає, оновіть тіло PR замість того, щоб push ще один code commit.

## Scope і маршрутизація

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **Редагування workflow CI** валідовують граф Node CI плюс workflow linting, але самі по собі не примушують Windows, iOS, Android або macOS native builds; ці platform lanes залишаються обмеженими scope змін platform source.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML files, composite-action interpolation guard і conflict-marker guard. PR-scoped завдання `security-fast` також запускає `zizmor` для змінених workflow files, щоб findings безпеки workflow падали рано в головному графі CI.
- **Документація на push до `main`** перевіряється standalone workflow `Docs` з тим самим дзеркалом документації ClawHub, яке використовує CI, тому змішані code+docs push не ставлять також у чергу shard CI `check-docs`. Pull request і ручний CI все ще запускають `check-docs` з CI, коли документацію змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тому він покриває як deterministic fixture lane `TuiBackend`, так і повільніший smoke `tui --local`, який mock лише external model endpoint.
- **Редагування лише маршрутизації CI, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий шлях manifest лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Windows Node checks** обмежені scope специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config і surfaces workflow CI, які виконують цю доріжку; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання лишалося малим без надмірного резервування раннерів: контракти плагінів і контракти каналів виконуються як два зважені шарди з підтримкою Blacksmith кожен зі стандартним резервним варіантом GitHub runner, швидкі/допоміжні доріжки core unit виконуються окремо, інфраструктуру core runtime розділено між станом, процесом/конфігурацією, shared і трьома доменними шардами cron, auto-reply виконується як збалансовані воркери (із піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing), а агентні конфігурації gateway/server розділено між доріжками chat/auth/model/http-plugin/runtime/startup замість очікування на зібрані артефакти. Потім звичайний CI пакує лише ізольовані інфраструктурні шарди include-pattern у детерміновані пакети щонайбільше з 64 тестових файлів, зменшуючи матрицю Node без об’єднання неізольованих наборів command/cron, stateful agents-core або gateway/server; важкі фіксовані набори лишаються на 8 vCPU, тоді як пакетовані й менш вагомі доріжки використовують 4 vCPU. Pull request у канонічному репозиторії використовують додатковий компактний план допуску: ті самі групи для кожної конфігурації виконуються в ізольованих підпроцесах усередині поточного Linux Node-плану з 34 завдань, тож один PR не реєструє повну матрицю Node із понад 70 завдань. Пуші в `main`, ручні запуски й release gates зберігають повну матрицю. Широкі browser-, QA-, media- і різні тести плагінів використовують власні конфігурації Vitest замість спільного plugin catch-all. Шарди include-pattern записують записи таймінгів із назвою CI-шарда, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілу конфігурацію від відфільтрованого шарда. `check-additional-*` тримає compile/canary-роботу меж пакетів разом і відокремлює архітектуру runtime topology від покриття gateway watch; список boundary guard розподілено на один prompt-heavy шард і один комбінований шард для решти guard-смуг, кожен із яких паралельно запускає вибрані незалежні guards і друкує таймінги для кожної перевірки. Дорога перевірка дрейфу prompt snapshot для щасливого шляху Codex виконується як окреме додаткове завдання лише для ручного CI та змін, що впливають на prompts, тож звичайні непов’язані зміни Node не чекають за холодною генерацією prompt snapshot, а boundary-шарди лишаються збалансованими, тоді як prompt drift усе ще прив’язано до PR, що його спричинив; той самий прапорець пропускає генерацію prompt snapshot Vitest усередині built-artifact core support-boundary shard. Gateway watch, тести каналів і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Після допуску канонічний Linux CI дозволяє до 24 паралельних тестових завдань Node і
12 для менших fast/check-доріжок; Windows і Android лишаються на двох, бо
ці пули раннерів вужчі.

Компактний PR-план створює 18 завдань Node для поточного набору: групи
цілих конфігурацій пакетуються в ізольованих підпроцесах із 120-хвилинним таймаутом пакета,
тоді як групи include-pattern ділять той самий обмежений бюджет завдань.

Android CI виконує і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test-доріжка все одно компілює flavor із BuildConfig-прапорцями SMS/call-log, уникаючи дублювання завдання пакування debug APK під час кожного Android-релевантного пушу.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, прив’язаний до найновішої версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення через `dlx`) і `pnpm deadcode:unused-files`, який порівнює production-знахідки Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. unused-file guard падає, коли PR додає новий непереглянутий невикористаний файл або лишає застарілий запис allowlist, водночас зберігаючи навмисні поверхні dynamic plugin, generated, build, live-test і package bridge, які Knip не може розв’язати статично.

## Переспрямування активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є мостом на цільовому боці від активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає ненадійний код pull request. Workflow створює токен GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири доріжки:

- `clawsweeper_item` для точних запитів на review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit під час пушів у `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Доріжка `github_activity` переспрямовує лише нормалізовані метадані: тип події, дію, актора, репозиторій, номер елемента, URL, заголовок, стан і короткі уривки для коментарів або review, якщо вони наявні. Вона навмисно не переспрямовує повне тіло webhook. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує ціль Discord у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, потребує дії, ризикована або операційно корисна. Рутинні відкриття, редагування, ботський шум, дубльований webhook-шум і звичайний review-трафік мають давати `NO_REPLY`.

Упродовж усього цього шляху вважайте заголовки GitHub, коментарі, тіла, текст review, назви гілок і повідомлення commit ненадійними даними. Це вхідні дані для підсумовування й triage, а не інструкції для workflow або runtime агента.

## Ручні запуски

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped-доріжку, крім Android: Linux Node shards, bundled-plugin shards, plugin і channel contract shards, сумісність Node 22, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build і Control UI i18n. Окремі ручні запуски CI запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only шард `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключено з CI. Docker prerelease suite виконується лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному викликачеві запускати цей граф для гілки, тегу або повного SHA commit, використовуючи workflow-файл із вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ручний CI dispatch і резервні варіанти для неканонічних репозиторіїв, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, docs workflows поза CI, а також install-smoke preflight, щоб матриця Blacksmith могла ставати в чергу раніше               |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, легші extension shards, `checks-fast-core`, plugin/channel contract shards, більшість bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, вибрані `check-additional-*` shards і `check-dependencies`      |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі набори Linux Node, boundary/extension-heavy `check-additional-*` shards і `android`                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                            |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks переходять на `macos-15`                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; forks переходять на `macos-26`                                                                                                                                                                                                   |

## Бюджет реєстрації раннерів

Поточний bucket реєстрації GitHub runner для OpenClaw повідомляє про 10 000 реєстрацій self-hosted
runner за 5 хвилин у `ghx api rate_limit`. Повторно перевіряйте
`actions_runner_registration` перед кожним проходом налаштування, бо GitHub може змінити
цей bucket. Ліміт спільний для всіх реєстрацій Blacksmith runner в організації
`openclaw`, тому додавання ще однієї інсталяції Blacksmith не додає
новий bucket.

Вважайте labels Blacksmith дефіцитним ресурсом для burst control. Завдання, які
лише маршрутизують, сповіщають, підсумовують, вибирають шарди або запускають короткі CodeQL scans, мають
лишатися на GitHub-hosted runners, якщо в них немає виміряних Blacksmith-specific
потреб. Будь-яка нова матриця Blacksmith, більший `max-parallel` або high-frequency
workflow має показати свою worst-case кількість реєстрацій і тримати org-level
ціль нижче приблизно 60% від live bucket. З поточним bucket на 10 000 реєстрацій
це означає operational target у 6 000 реєстрацій, залишаючи запас для
паралельних репозиторіїв, retries і burst overlap.

CI канонічного репозиторію зберігає Blacksmith як стандартний шлях раннерів для звичайних push і pull-request runs. `workflow_dispatch` і runs у неканонічному репозиторії використовують GitHub-hosted runners, але звичайні canonical runs наразі не перевіряють стан черги Blacksmith і не перемикаються автоматично на GitHub-hosted labels, коли Blacksmith недоступний.

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

`OpenClaw Performance` — це робочий процес продуктивності продукту/середовища виконання. Він щодня запускається на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний запуск зазвичай вимірює продуктивність ref робочого процесу. Установіть `target_ref`, щоб виміряти продуктивність тегу релізу або іншої гілки з поточною реалізацією робочого процесу. Опубліковані шляхи звітів і вказівники на найновіші результати прив’язуються до протестованого ref, а кожен `index.md` записує протестований ref/SHA, ref/SHA робочого процесу, ref Kova, профіль, режим автентифікації lane, модель, кількість повторів і фільтри сценаріїв.

Робочий процес установлює OCM із зафіксованого релізу та Kova з `openclaw/Kova` на зафіксованому вхідному `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти середовища виконання локальної збірки з детермінованою фіктивною автентифікацією, сумісною з OpenAI.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок запуску, gateway та agent-turn.
- `live-openai-candidate`: реальний agent turn OpenAI `openai/gpt-5.5`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає нативні для OpenClaw зонди джерел після проходу Kova: вимірювання часу завантаження gateway і пам’яті для стандартного запуску, запуску з hook і запуску з 50 plugins; RSS імпорту bundled plugin, повторювані цикли привітання mock-OpenAI `channel-chat-baseline`, CLI-команди запуску проти запущеного gateway і smoke-зонд продуктивності стану SQLite. Коли попередній опублікований звіт джерела mock-provider доступний для протестованого ref, зведення джерела порівнює поточні значення RSS і heap з цим базовим рівнем і позначає великі збільшення RSS як `watch`. Markdown-зведення зонда джерела розташоване в `source/index.md` у пакеті звіту, поруч із сирим JSON.

Кожен lane завантажує артефакти GitHub. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, робочий процес також комітить `report.json`, `report.md`, пакети, `index.md` і артефакти source-probe в `openclaw/clawgrit-reports` у `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний вказівник tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все перед релізом». Він приймає гілку, тег або повний commit SHA, запускає ручний робочий процес `CI` із цією ціллю, запускає `Plugin Prerelease` для релізних proof для plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, крос-OS перевірок пакета, рендерингу maturity scorecard з evidence профілю QA, QA Lab parity, Matrix і Telegram lanes. Профілі stable і full завжди включають вичерпне покриття live/E2E та soak Docker release-path; beta-профіль може ввімкнути це через `run_release_soak=true`. Канонічний package Telegram E2E виконується всередині Package Acceptance, тому повний кандидат не запускає дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати опублікований npm-пакет у release checks, Package Acceptance, Docker, cross-OS і Telegram без повторної збірки. Використовуйте `npm_telegram_package_spec` лише для сфокусованого повторного запуску Telegram з опублікованим пакетом. Live package lane Codex plugin за замовчуванням використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, тоді як SHA/artifact-запуски пакують `extensions/codex` із вибраного ref. Установіть `codex_plugin_spec` явно для користувацьких джерел plugin, як-от специфікацій `npm:`, `npm-pack:` або `git:`.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв job робочого процесу, відмінностей профілів, артефактів і
handles для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний змінювальний робочий процес релізу. Запускайте його
з `release/YYYY.M.PATCH` або `main` після появи тегу релізу та після успішного
OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публікованих пакетів plugin, запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Stable-публікація також
вимагає точного `windows_node_tag`; робочий процес перевіряє вихідний Windows
реліз і порівнює його x64/ARM64 інсталятори з попередньо схваленим кандидатом
у вхідному `windows_node_installer_digests` перед будь-яким дочірнім publish,
потім просуває та перевіряє ті самі зафіксовані digest інсталяторів плюс точний
супровідний asset і контракт checksum перед публікацією чернетки GitHub release.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для proof зафіксованого commit у швидкозмінній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуску робочого процесу GitHub мають бути гілками або тегами, а не сирими commit SHA.
Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього зафіксованого ref, перевіряє, що кожен дочірній
workflow `headSha` відповідає цілі, і видаляє тимчасову гілку після завершення
запуску. Парасольковий verifier також завершується помилкою, якщо будь-який дочірній робочий процес виконувався на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
робочі процеси релізу за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка advisory-матриця provider/media. Stable і full
release checks завжди запускають вичерпні live/E2E та Docker release-path soak;
beta-профіль може ввімкнути це через `run_release_soak=true`.

- `minimum` залишає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає stable-набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасолька записує ids запущених дочірніх run, а фінальна job `Verify full validation` повторно перевіряє поточні conclusions дочірніх run і додає таблиці найповільніших jobs для кожного дочірнього run. Якщо дочірній робочий процес перезапущено і він став зеленим, перезапустіть лише parent verifier job, щоб оновити результат парасольки та зведення часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск failed release box обмеженим після сфокусованого виправлення. Для одного failed cross-OS lane поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а зведення packaged-upgrade включають timings для кожної фази. QA release-check lanes є advisory, крім стандартного gate покриття runtime tools, який блокує, коли потрібні динамічні tools OpenClaw дрейфують або зникають зі зведення standard tier.

`OpenClaw Release Checks` використовує довірений ref робочого процесу, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт до cross-OS checks і Package Acceptance, а також до live/E2E release-path Docker workflow, коли запускається soak-покриття. Це зберігає bytes пакета узгодженими між release boxes і уникає перепакування того самого кандидата в кількох дочірніх jobs. Для live lane Codex npm-plugin release checks або передають відповідну опубліковану специфікацію plugin, виведену з `release_package_spec`, або передають наданий оператором `codex_plugin_spec`, або залишають input порожнім, щоб Docker script упакував Codex plugin з вибраного checkout.

Дубльовані запуски `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Parent monitor скасовує будь-який дочірній робочий процес, який він
уже запустив, коли parent скасовано, тому новіша перевірка main
не стоїть у черзі за застарілим двогодинним release-check run. Перевірка release branch/tag
і сфокусовані rerun groups зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість однієї послідовної job:

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

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних live provider failures. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному робочим процесом `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску nested Docker tests.

Docker-підкріплені шарди живих моделей/бекендів використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow живого релізу будує й публікує цей образ один раз, після чого шарди Docker для живої моделі, розбитого за провайдерами gateway, CLI-бекенда, ACP-прив’язки та Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за таймаут job у workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди самостійно перебудовують повну Docker-ціль із вихідного коду, релізний запуск налаштовано неправильно, і він марнуватиме час на дублювання збірок образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Jobs

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 та профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-смуги проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці смуги як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; автономний dispatch Telegram усе ще може встановлювати опублікований npm spec.
4. `summary` завершує workflow помилкою, якщо визначення пакета, Docker-приймання або необов’язкова Telegram-смуга завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` є обов’язковим. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціальні hostnames або resolved IPs, а також redirects поза тією самою публічною політикою безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики trusted-source у `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` є обов’язковими. Використовуйте це лише для enterprise-дзеркал або приватних репозиторіїв пакетів, якими володіють maintainers і яким потрібні налаштовані hosts, ports, path prefixes, redirect hosts або private-network resolution. Якщо політика оголошує bearer auth, workflow використовує фіксований secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credentials, вбудовані в URL, усе ще відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття Plugin, щоб перевірка опублікованого пакета не залежала від живої доступності ClawHub. Необов’язкова Telegram-смуга повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec зберігається для автономних dispatches.

Для спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker-смугами, входами Package Acceptance, релізними defaults і triage збоїв,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це тримає proof для міграції пакета, оновлення, встановлення живого ClawHub skill, очищення stale-plugin-dependency, repair встановлення configured-plugin, offline Plugin, plugin-update і Telegram на одному й тому самому визначеному tarball пакета. Встановіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю проти доставленого npm-пакета без перебудови; встановлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потребує іншого пакета, ніж решта release validation. Cross-OS release checks усе ще покривають специфічні для ОС onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker-смуга `published-upgrade-survivor` перевіряє один опублікований baseline пакета за запуск у блокувальному релізному шляху. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди rerun для failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити покриття на чотири найновіші stable npm releases плюс pinned plugin-compatibility boundary releases і issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, встановлень configured OpenClaw Plugin, tilde log paths і stale legacy plugin dependency roots. Вибори multi-baseline published-upgrade survivor шардуються за baseline в окремі цільові Docker runner jobs. Окремий workflow `Update Migration` використовує Docker-смугу `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну смугу з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікована смуга налаштовує baseline через вбудований recipe команди `openclaw config set`, записує кроки recipe у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.5`, тож proof для install і gateway залишається на тестовій моделі GPT-5, уникаючи defaults GPT-4.x.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може prune missing pnpm `patchedDependencies` з tarball-derived fake git fixture і може логувати missing persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати missing marketplace install-record persistence;
- `plugin-update` може дозволяти migration config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були доставлені. Пізніші пакети мають відповідати сучасним contracts; ті самі умови призводять до failure замість warn або skip.

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

Під час debug failed package acceptance run починайте з підсумку `resolve_package`, щоб підтвердити package source, version і SHA-256. Потім перегляньте child run `docker_acceptance` і його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Надавайте перевагу повторному запуску failed package profile або точних Docker lanes замість повторного запуску full release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що зачіпають поверхні Docker/пакетів, зміни пакетів/маніфестів bundled Plugin або поверхні core Plugin/каналів/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled Plugin, редагування лише тестів і редагування лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і покриття installer Docker/update для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Пуші в `main` (включно з merge-комітами) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow залишає швидкий Docker smoke і віддає повний install smoke нічній або релізній валідації.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` не запускають його. Звичайний PR CI все ще запускає швидку регресійну лінію Bun launcher для змін, релевантних Node. QR і installer Docker tests зберігають власні Dockerfile, зосереджені на інсталяції.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency ліній;
- функціональний образ, який інсталює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                         |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10              | Кількість слотів основного пулу для звичайних ліній.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Кількість слотів хвостового пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9               | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5               | Обмеження одночасних ліній npm install.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7               | Обмеження одночасних багатосервісних ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Затримка між стартами ліній, щоб уникнути штормів створення в Docker daemon; задайте `0`, щоб її вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000         | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset           | `1` друкує план планувальника без запуску ліній.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset           | Точний список ліній через кому; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за її ефективне обмеження, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальний сукупний запуск попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає тривалості ліній для впорядкування від найдовших і за замовчуванням припиняє планувати нові pooled-лінії після першого збою.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє інвентар tarball; збирає і пушить bare/functional GHCR Docker E2E образи з тегом package digest через Docker layer cache Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість повторної збірки. Pull Docker-образів повторюється з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий потік registry/cache швидко повторився, а не споживав більшість критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `package-update-openai` включає live Codex Plugin package lane, яка інсталює candidate OpenClaw package, інсталює Codex Plugin з `codex_plugin_spec` або same-ref tarball із явним схваленням інсталяції Codex CLI, запускає Codex CLI preflight, а потім запускає кілька turns OpenClaw agent у тій самій сесії проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними plugin/runtime aliases. Alias лінії `install-e2e` залишається сукупним manual rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage запитує його, і зберігає окремий chunk `openwebui` лише для dispatches тільки OpenWebUI. Bundled-channel update lanes повторюють спробу один раз для тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із логами ліній, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і командами rerun для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk-завдань, що обмежує debugging невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана лінія є live Docker lane, targeted job локально збирає live-test образ для цього rerun. Згенеровані GitHub rerun commands для кожної лінії включають `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker artifacts і надрукувати комбіновані/цільові rerun commands для кожної лінії
pnpm test:docker:timings <summary>   # slow-lane і phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається через `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і standalone manual CI dispatches тримають цей suite вимкненим. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу і більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у малі групи, щоб не резервувати десятки runners для завдань тривалістю від однієї до трьох хвилин. Workflow також завантажує інформаційний artifact `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; findings інспектора є triage input і не змінюють blocking Plugin Prerelease gate.

## QA Lab

QA Lab має окремі CI lanes поза основним smart-scoped workflow. Agentic parity вкладено під широкі QA і release harnesses, а не винесено в standalone PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із broad validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract було ізольовано від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, оскільки QA parity окремо покриває memory behavior; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity required status.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним repository sweep. Щоденні, ручні та non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript поверхні найвищого ризику з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` або process-owning bundled plugin runtime paths, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, пісочниця, cron і базовий рівень gateway                                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу, а також runtime Plugin каналу, gateway, Plugin SDK, secrets, точки дотику аудиту            |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні основного SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Сервери MCP, помічники виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                                  |
| `/codeql-security-high/process-exec-boundary`     | Локальна shell, помічники запуску процесів, runtime пакетних plugin, що володіють subprocess, і зв’язувальний код workflow-скриптів |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, встановлення package-manager, source-loading і контракту пакета Plugin SDK |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, який приймає перевірка коректності workflow. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишено поза щоденними defaults, бо збірка macOS домінує runtime навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries над вузькими високовартісними поверхнями на GitHub-hosted Linux runners, щоб quality scans не витрачали бюджет runner-registration Blacksmith. Його захист pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для коду виконання команд/моделей/інструментів агента й dispatch відповідей, коду схеми config/міграції/IO, коду auth/secrets/пісочниці/security, runtime основного каналу та пакетного channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або змін runtime відповідей Plugin SDK. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є hooks для навчання/ітерацій, щоб запускати один quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Код межі безпеки Auth, secrets, пісочниці, cron і gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`            | Контракти config schema, migration, normalization та IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти реалізації основного каналу та пакетного channel plugin                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`     | Контракти runtime виконання команд, model/provider dispatch, auto-reply dispatch і queues, та ACP control-plane                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP та tool bridges, помічники process supervision і контракти outbound delivery                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`    | Memory host SDK, memory runtime facades, aliases memory Plugin SDK, glue активації memory runtime і команди memory doctor                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні reply queue, session delivery queues, помічники outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Inbound reply dispatch Plugin SDK, помічники reply payload/chunking/runtime, channel reply options, delivery queues і помічники session/thread binding           |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація model catalog, provider auth і discovery, реєстрація provider runtime, provider defaults/catalogs і registries web/search/fetch/embedding            |
| `/codeql-critical-quality/ui-control-plane`           | Bootstrap Control UI, локальна persistence, gateway control flows і контракти runtime task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary` | Контракти runtime основного web fetch/search, media IO, media understanding, image-generation і media-generation                                                  |
| `/codeql-critical-quality/plugin-boundary`            | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований package-side source Plugin SDK і помічники контракту plugin package                                                                                |

Quality залишається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявних docs узгодженими з нещодавно landed changes. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тому один погодинний run може покрити всі main changes, накопичені з останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних тестів. Він не має чистого schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC дня. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість broad refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують passing baseline test count. Grouped report записує per-config wall time і max RSS на Linux і macOS, тому before/after comparison показує test memory deltas поруч із duration deltas. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде committed. Коли `main` просувається до того, як bot push landed, lane rebase’ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти таку саму drop-sudo safety posture, як docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це manual maintainer workflow для post-land duplicate cleanup. За замовчуванням він dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж broad CI platform scope:

- core production changes запускають core prod і core test typecheck, а також core lint/guards;
- core test-only changes запускають лише core test typecheck і core lint;
- extension production changes запускають extension prod і extension test typecheck, а також extension lint;
- extension test-only changes запускають extension test typecheck і extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: direct test edits запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним з explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що cheap mapped set не є надійним proxy.

## Testbox validation

Crabbox — це репозиторний wrapper для віддаленої машини, призначений для maintainer Linux proof. Використовуйте його
з кореня репозиторію, коли перевірка надто широка для локального циклу редагування, коли важлива
паритетність із CI, або коли proof потребує secrets, Docker, package lanes,
багаторазових машин чи віддалених логів. Звичайний бекенд OpenClaw —
`blacksmith-testbox`; власна ємність AWS/Hetzner є fallback для збоїв Blacksmith,
проблем із квотами або явного тестування на власній ємності.

Запуски Blacksmith через Crabbox прогрівають, claim, sync, run, report і прибирають
одноразові Testboxes. Вбудована sanity-перевірка синхронізації швидко завершується з помилкою, коли потрібні
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для PR із навмисними масовими видаленнями встановіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик Blacksmith CLI, який залишається у фазі
синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте wrapper з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Репозиторний wrapper відмовляється працювати із застарілим binary Crabbox, який не оголошує `blacksmith-testbox`. Передавайте provider явно, навіть якщо `.crabbox.yaml` має defaults для owned-cloud. У worktree Codex або linked/sparse checkout уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до старту Crabbox; натомість викликайте node wrapper напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith потребують Crabbox 0.22.0 або новішого, щоб wrapper отримував поточну поведінку sync, queue і cleanup для Testbox. Коли використовуєте сусідній checkout, перебудуйте ігнорований локальний binary перед timing або proof роботою:

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

Повторний запуск сфокусованого тесту:

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

Читайте фінальний JSON summary. Корисні поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Для делегованих
запусків Blacksmith Testbox exit code wrapper Crabbox і JSON summary є
результатом команди. Пов’язаний запуск GitHub Actions відповідає за hydration і keepalive; він
може завершитися як `cancelled`, коли Testbox зупинено зовні після того, як SSH
команда вже повернулася. Вважайте це артефактом cleanup/status, якщо тільки
`exitCode` wrapper не є ненульовим або вивід команди не показує failed test.
Одноразові запуски Crabbox через Blacksmith мають зупиняти Testbox автоматично;
якщо запуск перервано або cleanup неясний, перевірте live boxes і зупиняйте лише
ті boxes, які створили ви:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте reuse лише тоді, коли вам навмисно потрібні кілька команд на тій самій hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і cleanup. Виправте шлях
Crabbox, перш ніж трактувати прямий запуск Blacksmith як maintainer proof.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmups залишаються `queued` без IP або URL запуску Actions через кілька хвилин,
трактуйте це як тиск Blacksmith provider, queue, billing або org-limit. Зупиніть
queued ids, які створили ви, не запускайте більше Testboxes і перенесіть proof на
шлях власної ємності Crabbox нижче, поки хтось перевіряє Blacksmith dashboard,
billing і org limits.

Переходьте на власну ємність Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власна ємність є явною метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завдання справді не потребує CPU класу 48xlarge. Запит `beast` стартує зі 192 vCPU і є найпростішим способом зачепити регіональну квоту EC2 Spot або On-Demand Standard. Репозиторний `.crabbox.yaml` за замовчуванням використовує `standard`, кілька capacity regions і `capacity.hints: true`, тож brokered AWS leases виводять вибрані region/market, quota pressure, Spot fallback і high-pressure class warnings. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, і `beast` лише для виняткових CPU-bound lanes, як-от full-suite або all-plugin Docker matrices, явна release/blocker validation чи high-core performance profiling. Не використовуйте `beast` для `pnpm check:changed`, сфокусованих тестів, docs-only роботи, звичайного lint/typecheck, малих E2E repros або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики ємності, щоб churn Spot market не змішувався із сигналом.

`.crabbox.yaml` володіє defaults для provider, sync і GitHub Actions hydration для owned-cloud lanes. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передачею non-secret environment для команд owned-cloud `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
