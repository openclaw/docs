---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-05T20:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a87abe86ab28f14b1ea96846ee221eb504fb1bc9e6c17b4b2f348867cde855d
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, який утримує типовий керівний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це шлюз покриття для типової модульної доріжки, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, а типова доріжка обмежує включення покриття нешвидкими модульними тестами із сусідніми вихідними файлами, шлюз вимірює вихідний код, що належить цій доріжці, а не кожен транзитивний імпорт, який він випадково завантажує.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду та локальний граф імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестової обв’язки/конфігурації/пакета має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні доріжки, спричинені різницею відносно `origin/main`.
- `pnpm check:changed`: запускає розумний шлюз перевірки змін для різниці відносно `origin/main`. Він запускає перевірку типів, lint і захисні команди для зачеплених архітектурних доріжок, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` як доказ тестами.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через обмежені доріжки Vitest. Запуски без цілі використовують фіксовані групи шардів і розгортаються до листових конфігурацій для локального паралельного виконання; група розширень завжди розгортається до конфігурацій шардів для кожного розширення замість одного величезного процесу кореневого проєкту.
- Запуски тестової обгортки завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного шарда.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібен ізольований `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, конфігураційна фікстура, робочий простір, каталог агента або сховище профілів автентифікації.
- Допоміжні засоби E2E для процесів: використовуйте `test/helpers/openclaw-test-instance.ts`, коли процесному E2E-тесту Vitest потрібні запущений Gateway, середовище CLI, захоплення журналів і очищення в одному місці.
- Допоміжні засоби E2E для Docker/Bash: доріжки, які підключають `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це через `scripts/lib/openclaw-e2e-instance.sh`; скрипти з кількома домашніми каталогами можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Низькорівневі викликачі можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для придатного до підключення файла середовища на хості. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Доріжки Docker/Bash, які запускають Gateway, можуть підключати `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для визначення entrypoint, імітаційного запуску OpenAI, запуску Gateway на передньому плані/у фоні, перевірок готовності, експорту середовища стану, дампів журналів і очищення процесів.
- Повні, розширювальні та include-pattern запуски шардів оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; пізніші запуски всієї конфігурації використовують ці часи для балансування повільних і швидких шардів. Include-pattern шарди CI додають назву шарда до ключа часу, що зберігає часи відфільтрованих шардів видимими без заміни даних часу всієї конфігурації. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі доріжки, які залишають лише `test/setup.ts`, лишаючи важкі для середовища виконання випадки на їхніх наявних доріжках.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед поверненням до ширших glob-шаблонів каталогу. Зміни допоміжних засобів у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів для запуску тестів, що їх імпортують, замість широкого запуску кожного шарда, коли шлях залежності є точним.
- `auto-reply` тепер також розділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб обв’язка відповідей не домінувала над легшими тестами стану/токенів/допоміжних засобів верхнього рівня.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, зі спільним неізольованим runner, увімкненим у конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі шарди розширень/Plugin. Важкі канальні plugins, браузерний Plugin і OpenAI запускаються як окремі шарди; інші групи Plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для доріжки одного вбудованого Plugin.
- `pnpm test:perf:imports`: вмикає звітування про тривалість імпортів і деталізацію імпортів Vitest, водночас і далі використовуючи маршрутизацію обмежених доріжок для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність маршрутизованого шляху режиму змін порівняно з нативним запуском кореневого проєкту для тієї самої зафіксованої git-різниці.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін робочого дерева без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- та heap-профілі для модульного runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожну листову конфігурацію Vitest повного набору послідовно й записує згруповані дані тривалості, а також JSON-/лог-артефакти для кожної конфігурації. Test Performance Agent використовує це як базову лінію перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: підключається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести Gateway (створення пар між кількома екземплярами WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивними workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і задайте `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: Збирає спільний образ live-тестів, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує базовий образ runner з Node/Git, а також функціональний образ, який установлює цей tarball у `/app`, а потім запускає smoke-доріжки Docker з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для доріжок установника/оновлення/залежностей Plugin; ці доріжки монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних доріжок функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI пакувальником пакетів і перевіряє tarball плюс `dist/postinstall-inventory.json` перед використанням Docker. Визначення доріжок Docker містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить керований планувальником план CI для вибраних доріжок, типів образів, потреб пакета/live-образу, сценаріїв стану та перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдерів хвостовим пулом і типово дорівнює 10. Обмеження важких доріжок типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів типово становлять одну важку доріжку на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо одна доріжка перевищує ефективну вагу або ресурсне обмеження на хості з низьким паралелізмом, вона все одно може стартувати з порожнього пулу й виконуватиметься сама, доки не звільнить місткість. Запуски доріжок типово рознесені на 2 секунди, щоб уникнути локальних сплесків створення в daemon Docker; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери E2E OpenClaw, виводить статус активних доріжок кожні 30 секунд, ділить кеші інструментів CLI провайдерів між сумісними доріжками, типово один раз повторює транзитні збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає часи доріжок у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших під час наступних запусків. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест доріжок без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати виведення статусу, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання часів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних доріжок або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для доріжок live-провайдерів; псевдоніми пакетів: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні та хвостові live-доріжки в один пул від найдовших, щоб кошики провайдерів могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові об’єднані в пул доріжки після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожна доріжка має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/хвостові доріжки використовують жорсткіші обмеження для кожної доріжки. Команди налаштування Docker для backend CLI мають власний тайм-аут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Журнали для кожної доріжки, `summary.json`, `failures.json` і часи фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб перевірити повільні доріжки, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві цільові команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed вихідний контейнер E2E, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що snapshots ролей CDP містять URL посилань, clickables, підвищені курсором, iframe-посилання та метадані кадрів.
- Live-проби Docker для backend CLI можна запускати як сфокусовані доріжки, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає контейнеризовані OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає справжній проксований чат через `/api/chat/completions`. Потребує придатного live-ключа моделі (наприклад OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як стабільний для CI на рівні звичайних модульних/e2e наборів.
- `pnpm test:docker:mcp-channels`: Запускає контейнер Gateway із початковими даними та другий клієнтський контейнер, який породжує `openclaw mcp serve`, потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідного надсилання, а також сповіщення каналу й дозволів у стилі Claude через справжній stdio-міст. Твердження для сповіщень Claude читає необроблені stdio MCP-фрейми напряму, щоб smoke-тест відображав те, що міст фактично емітує.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета й неінтерактивний doctor без live-ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналів, allowlist-и plugin, файли workspace/session, застарілий стан залежностей legacy plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: Типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без live-ключів провайдера або каналу, налаштовує цей baseline за допомогою вбудованого рецепта команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані intents, файли workspace/session, застаріла конфігурація plugin і стан legacy-залежностей, запуск, `/healthz`, `/readyz` та статус RPC зберігаються або коректно відновлюються. Перевизначте один baseline за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну локальну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues включає `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні plugin OpenClaw установлюються автоматично під час оновлення, і `stale-source-plugin-shadow`, щоб source-only plugin-тіні не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, а також розв’язує метатокени baseline, як-от `last-stable-4` або `all-since-2026.4.23`, перед передаванням точних специфікацій пакетів у Docker lanes.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup` з інтенсивним очищенням, типово починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цей lane із `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет, починаючи з `.23`, оновлювався до кандидата й доводив очищення залежностей configured-plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає smoke-тести встановлення/оновлення для локального шляху, `file:`, пакетів npm registry з hoisted-залежностями, рухомих git refs, фікстур ClawHub, оновлень marketplace і ввімкнення/інспекції Claude-bundle.

## Локальна контрольна перевірка PR

Для локальних перевірок перед злиттям/контрольних перевірок PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без пунктуації чи додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279 мс (мін. 1114, макс. 2431)
- opus медіана 2454 мс (мін. 1224, макс. 3170)

## Бенчмарк запуску CLI

Скрипт: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Використання:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Пресети:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва пресети

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і підсумки максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілю використовували той самий harness.

Угоди для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли конфігурації/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-перевірка імпорту QR (Docker)

Переконується, що підтримуваний допоміжний QR runtime завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)
