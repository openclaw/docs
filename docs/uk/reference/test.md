---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-11T20:57:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, що утримує типовий контрольний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття типової модульної лінії, а не покриття всього репозиторію для всіх файлів. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, а область покриття типової лінії охоплює не швидкі модульні тести із сусідніми вихідними файлами, перевірка вимірює вихідний код, що належить цій лінії, замість кожного транзитивного імпорту, який вона випадково завантажує.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідні файли `*.test.ts`, явні відповідності вихідного коду та локальний граф імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не відповідають точним тестам.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового каркаса/конфігурації/пакета має повернутися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні лінії, активовані різницею відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку змін для різниці відносно `origin/main`. Вона запускає typecheck, lint і захисні команди для зачеплених архітектурних ліній, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для підтвердження тестами.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через обмежені лінії Vitest. Запуски без цілей використовують фіксовані групи шардів і розгортаються до листових конфігурацій для локального паралельного виконання; група розширень завжди розгортається до конфігурацій шардів для кожного розширення замість одного великого процесу кореневого проєкту.
- Запуски тестової обгортки завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного шарда.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольований `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, фікстура конфігурації, робоча область, каталог агента або сховище профілів автентифікації.
- Помічники процесних E2E: використовуйте `test/helpers/openclaw-test-instance.ts`, коли процесному E2E-тесту Vitest потрібні запущений Gateway, середовище CLI, захоплення журналів і очищення в одному місці.
- Помічники Docker/Bash E2E: лінії, які підключають `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; сценарії з кількома домівками можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Нижчорівневі викликачі можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для фрагмента shell у контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для вихідного env-файла хоста. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Лінії Docker/Bash, які запускають Gateway, можуть підключати `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для визначення entrypoint, запуску mock OpenAI, запуску Gateway на передньому/задньому плані, перевірок готовності, експорту середовища стану, дампів журналів і очищення процесів.
- Повні, розширювальні та include-pattern запуски шардів оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні запуски всієї конфігурації використовують ці виміри, щоб балансувати повільні та швидкі шарди. Include-pattern CI-шарди додають назву шарда до ключа часу, що зберігає видимість вимірів відфільтрованих шардів без заміни даних часу всієї конфігурації. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі лінії, які залишають лише `test/setup.ts`, залишаючи runtime-важкі випадки на їхніх наявних лініях.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед поверненням до ширших glob-виразів каталогів. Зміни помічників у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів для запуску тестів, що імпортують їх, замість широкого запуску кожного шарда, коли шлях залежності точний.
- `auto-reply` тепер також розділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб каркас відповіді не домінував над легшими top-level тестами статусу/токенів/помічників.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, зі спільним неізольованим runner, увімкненим у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі шарди розширень/плагінів. Важкі плагіни каналів, браузерний плагін і OpenAI запускаються як окремі шарди; інші групи плагінів залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для однієї лінії вбудованого плагіна.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів і розбивку імпортів, водночас використовуючи маршрутизацію обмежених ліній для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює routed changed-mode шлях порівняно з нативним запуском кореневого проєкту для тієї самої закоміченої різниці git.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточний набір змін робочого дерева без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для модульного runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну листову конфігурацію Vitest повного набору та записує згруповані дані тривалості разом із JSON/лог-артефактами для кожної конфігурації. Test Performance Agent використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, спрямованої на продуктивність.
- Інтеграція Gateway: увімкнення за вибором через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести gateway (зв’язування кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивними воркерами у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`), щоб не пропускатися.
- `pnpm test:docker:all`: Збирає спільний live-test образ, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує чистий runner-образ Node/Git, а також функціональний образ, що встановлює цей tarball у `/app`, а потім запускає Docker smoke-лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Чистий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для ліній installer/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball замість використання скопійованого вихідного коду репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних ліній функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI пакувальником пакета та перевіряє tarball разом із `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким володіє планувальник, для вибраних ліній, типів образів, потреб package/live-image, сценаріїв стану та перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдерів tail-пулом і типово дорівнює 10. Ліміти важких ліній типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ліміти провайдерів типово дорівнюють одній важкій лінії на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо одна лінія перевищує ефективний ліміт ваги або ресурсу на хості з низькою паралельністю, вона все одно може стартувати з порожнього пулу й працюватиме одна, доки не звільнить місткість. Старти ліній типово рознесені на 2 секунди, щоб уникнути локальних сплесків створення в Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі E2E-контейнери OpenClaw, виводить статус активних ліній кожні 30 секунд, ділиться кешами інструментів CLI провайдерів між сумісними лініями, один раз типово повторює транзитні збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає часи ліній у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест ліній без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання часів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних ліній або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для ліній live-провайдерів; псевдоніми пакетів: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим live-only об’єднує основні й tail live-лінії в один пул від найдовших, щоб provider buckets могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled-лінії після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна лінія має резервний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail лінії використовують жорсткіші ліміти для кожної лінії. Команди налаштування Docker для CLI backend мають власний таймаут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Журнали кожної лінії, `summary.json`, `failures.json` і часи фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні лінії, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві цільові команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає вихідний E2E-контейнер на базі Chromium, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що знімки ролей CDP містять URL-адреси посилань, підвищені курсором клікабельні елементи, посилання iframe і метадані frame.
- `pnpm test:docker:skill-install`: Встановлює упакований tarball OpenClaw у чистий Docker runner, вимикає `skills.install.allowUploadedArchives`, визначає поточний skill slug із live-пошуку ClawHub, встановлює його через `openclaw skills install` і перевіряє `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` і `skills info --json`.
- Live Docker-проби CLI backend можна запускати як сфокусовані лінії, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає справжній проксійований чат через `/api/chat/completions`. Потребує придатного live model key (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як CI-стабільний на рівні звичайних unit/e2e наборів.
- `pnpm test:docker:mcp-channels`: Запускає заповнений початковими даними контейнер Gateway і другий клієнтський контейнер, який породжує `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги живих подій, маршрутизацію вихідного надсилання та сповіщення каналів і дозволів у стилі Claude через справжній міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-фрейми напряму, тож smoke-тест відображає те, що міст фактично видає.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета плюс неінтерактивний doctor без живих ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналів, allowlist Plugin, файли робочого простору/сеансу, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням установлює `openclaw@latest`, засіває реалістичні файли наявного користувача без живих ключів провайдера або каналу, налаштовує цю базову версію вбудованим рецептом команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані наміри, файли робочого простору/сеансу, застаріла конфігурація Plugin і стан legacy-залежностей, запуск, `/healthz`, `/readyz` та статус RPC зберігаються або коректно відновлюються. Перевизначте одну базову версію за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну локальну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні Plugin OpenClaw автоматично встановлюються під час оновлення, і `stale-source-plugin-shadow`, щоб тіні Plugin лише з вихідного коду не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, а також розв’язує метатокени базових версій, як-от `last-stable-4` або `all-since-2026.4.23`, перш ніж передати точні специфікації пакетів у Docker-лінії.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup` з інтенсивним очищенням, за замовчуванням починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цю лінію з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та підтверджував очищення залежностей налаштованих Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає smoke-тест установлення/оновлення для локального шляху, `file:`, пакетів npm-реєстру з hoisted-залежностями, рухомих git-посилань, фікстур ClawHub, оновлень marketplace і ввімкнення/інспекції Claude-бандла.

## Локальна PR gate

Для локальних перевірок злиття/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкове середовище: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: "Відповідай одним словом: ok. Без пунктуації чи додаткового тексту."

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279ms (мін. 1114, макс. 2431)
- opus медіана 2454ms (мін. 1224, макс. 3170)

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

Вивід містить `sampleCount`, середнє, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілю використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксована в репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start потік у чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Забезпечує завантаження підтримуваного runtime-помічника QR у підтримуваних Docker-середовищах Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
