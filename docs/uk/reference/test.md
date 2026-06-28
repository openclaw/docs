---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-06-28T00:13:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- Звичайний порядок локального тестування:
  1. `pnpm test:changed` для Vitest-доказу в межах зміненої області.
  2. `pnpm test <path-or-filter>` для одного файлу, каталогу або явної цілі.
  3. `pnpm test` лише коли навмисно потрібен повний локальний набір Vitest.
- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий контрольний порт, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це coverage gate для типової модульної смуги, а не покриття всіх файлів усього репозиторію. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, а типова смуга обмежує включення покриття нешвидкими модульними тестами із сусідніми вихідними файлами, gate вимірює вихідний код, що належить цій смузі, замість кожного транзитивного імпорту, який випадково завантажується.
- `pnpm test:coverage:changed`: запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск змінених тестів. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск змінених тестів. Використовуйте його, коли зміна тестового harness/конфігурації/пакета має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні смуги, спрацьовані diff відносно `origin/main`.
- `pnpm check:changed`: поза CI типово делегує до Crabbox/Testbox, а потім запускає розумний changed check gate для diff відносно `origin/main` всередині віддаленої дочірньої задачі. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних смуг, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу.
- Робочі дерева Codex і linked/sparse checkouts: уникайте прямих локальних `pnpm test*`, `pnpm check*` і `pnpm crabbox:run`, якщо ви не перевірили, що pnpm не виконуватиме reconciliation залежностей. Для крихітного доказу з явним файлом використовуйте `node scripts/run-vitest.mjs <path-or-filter>`; для changed gates або широкого доказу використовуйте `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, щоб pnpm виконувався всередині Testbox.
- Доказ Testbox через Crabbox: використовуйте фінальні `exitCode` і timing JSON з wrapper як результат команди. Делегований запуск Blacksmith GitHub Actions може показати `cancelled` після успішної SSH-команди, бо Testbox зупинено ззовні keepalive action; перевірте підсумок wrapper і вивід команди, перш ніж вважати це помилкою тесту.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: утримує серіалізацію heavy-check всередині поточного робочого дерева замість спільного каталогу Git для команд на кшталт `pnpm check:changed` і таргетованого `pnpm test ...`. Використовуйте це лише на локальних хостах високої потужності, коли навмисно запускаєте незалежні перевірки в linked worktrees.
- `pnpm test`: маршрутизує явні файлові/каталожні цілі через scoped Vitest lanes. Нецільові запуски є доказом повного набору: вони використовують фіксовані shard-групи, розгортаються до leaf configs для локального паралельного виконання та друкують очікуваний локальний shard fanout перед стартом. Група розширень завжди розгортається до shard configs для кожного розширення замість одного величезного процесу root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталлю для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store.
- `pnpm test:env-mutations:report`: неблокувальний звіт про тести й harnesses, які напряму змінюють `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` або пов’язані env keys OpenClaw. Використовуйте його, щоб знаходити кандидатів для міграції на спільний helper test-state.
- Мокований E2E Control UI: використовуйте `pnpm test:ui:e2e` для смуги Vitest + Playwright, яка запускає Vite Control UI і керує реальною сторінкою Chromium проти мокованого Gateway WebSocket. Тести розташовані в `ui/src/**/*.e2e.test.ts`; спільні mocks і controls розташовані в `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` включає цю смугу. У робочих деревах Codex віддавайте перевагу `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` для крихітного таргетованого доказу після встановлення залежностей або Testbox/Crabbox для ширшого GUI-доказу.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E тесту Vitest потрібні запущений Gateway, CLI env, захоплення логів і cleanup в одному місці.
- TUI PTY тести: використовуйте `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` для швидкої PTY-смуги з fake-backend. Використовуйте `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` або `pnpm tui:pty:test:watch --mode local` для повільнішого smoke `tui --local`, який мокує лише зовнішній model endpoint. Перевіряйте стабільний видимий текст або виклики fixture, а не сирі ANSI snapshots.
- Docker/Bash E2E helpers: смуги, що source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі callers можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell snippet всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим Node runtimes трактувати `--env-file` як Node flag. Docker/Bash lanes, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для entrypoint resolution, мокованого запуску OpenAI, foreground/background запуску Gateway, readiness probes, state env export, log dumps і process cleanup.
- Повні запуски, запуски розширень і include-pattern shard runs оновлюють локальні timing data в `.artifacts/vitest-shard-timings.json`; подальші whole-config runs використовують ці timings для балансування повільних і швидких shards. Include-pattern CI shards додають shard name до timing key, що зберігає видимість filtered shard timings без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані test files `plugin-sdk` і `commands` тепер маршрутизуються через dedicated light lanes, які залишають лише `test/setup.ts`, залишаючи runtime-heavy cases на їхніх наявних смугах.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших directory globs. Зміни helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів для запуску importing tests замість broad-running кожного shard, коли dependency path точний.
- `auto-reply` тепер також розділяється на три dedicated configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper tests.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у configs репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як dedicated shards; інші plugin groups залишаються batched. Використовуйте `pnpm test extensions/<id>` для однієї смуги bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest import-duration + import-breakdown, водночас продовжуючи використовувати scoped lane routing для явних file/directory targets.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточний набір змін робочого дерева без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite Vitest leaf config послідовно та записує grouped duration data плюс JSON/log artifacts для кожної config. Test Performance Agent використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після зміни, сфокусованої на продуктивності.
- `pnpm test:docker:timings <summary.json>` перевіряє повільні Docker lanes після Docker all run; використовуйте `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві таргетовані rerun commands з тих самих artifacts.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає репозиторний E2E aggregate: gateway end-to-end smoke tests плюс моковану browser E2E lane Control UI.
- `pnpm test:e2e:gateway`: запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для verbose logs.
- `pnpm test:live`: запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб прибрати skip.
- `pnpm test:docker:all`: Збирає спільний образ live-test, один раз пакує OpenClaw як npm-тарбол, збирає/повторно використовує мінімальний образ раннера Node/Git і функціональний образ, який встановлює цей тарбол у `/app`, а потім запускає Docker smoke-лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Мінімальний образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для ліній інсталятора/оновлення/залежностей Plugin; ці лінії монтують попередньо зібраний тарбол замість використання скопійованих вихідних файлів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних ліній функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI пакувальником пакета й перевіряє тарбол і `dist/postinstall-inventory.json` перед тим, як Docker їх використає. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким володіє планувальник, для вибраних ліній, типів образів, потреб у пакеті/live-образі, сценаріїв стану та перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдера хвостовим пулом і за замовчуванням дорівнює 10. Обмеження важких ліній за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням дають одну важку лінію на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для більших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Якщо одна лінія перевищує ефективне обмеження ваги або ресурсів на хості з низьким паралелізмом, вона все одно може стартувати з порожнього пулу й виконуватиметься сама, доки не звільнить ємність. Запуски ліній за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в демоні Docker; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Раннер за замовчуванням виконує попередні перевірки Docker, очищає застарілі контейнери OpenClaw E2E, виводить стан активних ліній кожні 30 секунд, спільно використовує кеші CLI-інструментів провайдерів між сумісними лініями, за замовчуванням один раз повторює тимчасові збої live-провайдера (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає час виконання ліній у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших до найкоротших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест ліній без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати вивід стану, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних ліній або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для ліній live-провайдера; псевдоніми пакетів: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні й хвостові live-лінії в один пул, упорядкований від найдовших до найкоротших, щоб кошики провайдерів могли разом пакувати роботу Claude, Codex і Gemini. Раннер припиняє планувати нові pooled-лінії після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожна лінія має резервний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/хвостові лінії використовують суворіші обмеження для окремих ліній. Команди налаштування Docker для бекенду CLI мають власний таймаут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Журнали окремих ліній, `summary.json`, `failures.json` і таймінги фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні лінії, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві цільові команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає вихідний E2E-контейнер на базі Chromium, запускає сирий CDP разом з ізольованим Gateway, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP містять URL-адреси посилань, клікабельні елементи, підвищені курсором, посилання на iframe і метадані фреймів.
- `pnpm test:docker:skill-install`: Встановлює запакований тарбол OpenClaw у мінімальний Docker-раннер, вимикає `skills.install.allowUploadedArchives`, визначає поточний slug навички з live-пошуку ClawHub, встановлює її через `openclaw skills install` і перевіряє `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` і `skills info --json`.
- Live-проби бекенду CLI в Docker можна запускати як сфокусовані лінії, наприклад `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` або `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini має відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає контейнеризовані OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає справжній проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі, завантажує зовнішній образ Open WebUI і не очікується як CI-стабільний на рівні звичайних unit/e2e-наборів.
- `pnpm test:docker:mcp-channels`: Запускає попередньо заповнений контейнер Gateway і другий клієнтський контейнер, який породжує `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання стенограм, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення каналу й дозволів у стилі Claude через справжній stdio-міст. Перевірка сповіщення Claude читає сирі stdio MCP-фрейми напряму, щоб smoke відображав те, що міст фактично видає.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований тарбол OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета й неінтерактивний doctor без ключів live-провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналу, списки дозволів Plugin, файли workspace/session, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без ключів live-провайдера або каналу, налаштовує цю базову версію вбудованим рецептом команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого тарбола OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані наміри, файли workspace/session, застаріла конфігурація Plugin і legacy-стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно ремонтуються. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розширте точну локальну матрицю через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні OpenClaw plugins автоматично встановлюються під час оновлення, і `stale-source-plugin-shadow`, щоб тіні Plugin лише з вихідного коду не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, а також розв’язує мета-токени базових версій, як-от `last-stable-4` або `all-since-2026.4.23`, перед передаванням точних специфікацій пакетів Docker-лініям.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup` з інтенсивним очищенням, за замовчуванням починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розширює цю лінію з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет, починаючи з `.23`, оновлювався до кандидата й доводив очищення залежностей налаштованих Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає install/update smoke для локального шляху, `file:`, пакетів npm registry з hoisted-залежностями, рухомих git-посилань, фікстур ClawHub, оновлень marketplace і ввімкнення/перегляду Claude-bundle.

## Локальний гейт PR

Для локальних перевірок перед злиттям/гейтом PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою памʼяттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Необовʼязкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий промпт: "Відповідай одним словом: ok. Без пунктуації або додаткового тексту."

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і підсумки максимального RSS для кожної команди. Необовʼязкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілю використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксована в репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити за допомогою `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Бенчмарк запуску Gateway

Скрипт: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Бенчмарк типово використовує зібрану точку входу CLI в `dist/entry.js`; виконайте
`pnpm build` перед використанням команд package-script. Щоб натомість виміряти source
runner, передайте `--entry scripts/run-node.mjs` і тримайте ці результати
окремо від базових показників зібраної точки входу.

Використання:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Ідентифікатори сценаріїв:

- `default`: звичайний запуск Gateway.
- `skipChannels`: запуск Gateway із пропущеним запуском каналів.
- `oneInternalHook`: один налаштований внутрішній hook.
- `allInternalHooks`: усі внутрішні hooks.
- `fiftyPlugins`: 50 плагінів маніфестів.
- `fiftyStartupLazyPlugins`: 50 startup-lazy плагінів маніфестів.

Вивід містить перший вивід процесу, `/healthz`, `/readyz`, час журналу прослуховування HTTP,
час журналу готовності Gateway, час CPU, співвідношення ядра CPU, максимальний RSS, heap, метрики трасування запуску,
затримку event-loop і детальні метрики таблиці пошуку плагінів. Скрипт
увімкнює `OPENCLAW_GATEWAY_STARTUP_TRACE=1` у середовищі дочірнього Gateway.

Читайте `/healthz` як ознаку життєздатності: HTTP-сервер може відповідати. Читайте `/readyz` як
придатну готовність: sidecar-процеси startup-плагінів, канали й ready-critical
робота після приєднання завершилися. Startup hooks Gateway диспетчеризуються
асинхронно й не є частиною гарантії готовності. Час журналу готовності — це
внутрішня позначка часу журналу готовності Gateway; вона корисна для атрибуції
з боку процесу, але не замінює зовнішній probe `/readyz`.

Використовуйте JSON-вивід або `--output` під час порівняння змін. Використовуйте `--cpu-prof-dir` лише
після того, як вивід трасування вказує на імпорт, компіляцію або CPU-bound роботу, яку неможливо
пояснити лише фазовими таймінгами. Не порівнюйте результати source-runner із
результатами зібраного `dist/entry.js` як одну й ту саму базову лінію.

## Бенчмарк перезапуску Gateway

Скрипт: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Бенчмарк перезапуску підтримується лише на macOS і Linux. Він використовує SIGUSR1 для
перезапусків усередині процесу й одразу завершується помилкою на Windows.

Бенчмарк типово використовує зібрану точку входу CLI в `dist/entry.js`; виконайте
`pnpm build` перед використанням команд package-script. Щоб натомість виміряти source
runner, передайте `--entry scripts/run-node.mjs` і тримайте ці результати
окремо від базових показників зібраної точки входу.

Використання:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Ідентифікатори сценаріїв:

- `skipChannels`: перезапуск із пропущеними каналами.
- `skipChannelsAcpxProbe`: перезапуск із пропущеними каналами та ввімкненим startup probe ACPX.
- `skipChannelsNoAcpxProbe`: перезапуск із пропущеними каналами та вимкненим startup probe ACPX.
- `default`: звичайний перезапуск.
- `fiftyPlugins`: перезапуск із 50 плагінами маніфестів.

Вивід містить наступний `/healthz`, наступний `/readyz`, downtime, таймінг готовності після перезапуску,
CPU, RSS, метрики трасування запуску для процесу-заміни та метрики трасування перезапуску
для обробки сигналу, drain активної роботи, фаз закриття, наступного старту, таймінгу
готовності й знімків памʼяті. Скрипт увімкнює
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` і `OPENCLAW_GATEWAY_RESTART_TRACE=1` у
середовищі дочірнього Gateway.

Використовуйте цей бенчмарк, коли зміна торкається сигналізації перезапуску, close handlers,
startup-after-restart, завершення sidecar-процесів, передавання сервісу або готовності після
перезапуску. Починайте зі `skipChannels`, коли ізолюєте механіку Gateway від запуску каналів.
Використовуйте `default` або сценарії з великою кількістю плагінів лише після того, як вузький сценарій пояснює
шлях перезапуску.

Метрики трасування — це підказки для атрибуції, а не вердикти. Зміну перезапуску слід
оцінювати за кількома зразками, відповідним owner span, поведінкою `/healthz` і `/readyz`
та користувацьким контрактом перезапуску.

## Onboarding E2E (Docker)

Docker необовʼязковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Перевіряє, що підтримуваний runtime helper QR завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Повʼязане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins)
