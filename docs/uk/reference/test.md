---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-06-27T18:20:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- Звичний порядок локального тестування:
  1. `pnpm test:changed` для підтвердження Vitest у межах зміненого обсягу.
  2. `pnpm test <path-or-filter>` для одного файлу, каталогу або явної цілі.
  3. `pnpm test` лише тоді, коли вам навмисно потрібен повний локальний набір Vitest.
- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це coverage gate стандартної модульної лінії, а не покриття всіх файлів усього репозиторію. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, а стандартна лінія обмежує включення покриття нефастовими модульними тестами із сусідніми вихідними файлами, gate вимірює вихідний код, що належить цій лінії, а не кожен транзитивний імпорт, який вона випадково завантажує.
- `pnpm test:coverage:changed`: запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового harness/конфігурації/пакета має перейти до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні лінії, які запускає diff відносно `origin/main`.
- `pnpm check:changed`: поза CI стандартно делегує до Crabbox/Testbox, а потім запускає розумний changed check gate для diff відносно `origin/main` всередині віддаленого дочірнього процесу. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних ліній, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- Робочі дерева Codex і linked/sparse checkouts: уникайте прямого локального `pnpm test*`, `pnpm check*` і `pnpm crabbox:run`, якщо ви не перевірили, що pnpm не узгоджуватиме залежності. Для дуже малого підтвердження за явним файлом використовуйте `node scripts/run-vitest.mjs <path-or-filter>`; для changed gates або широкого підтвердження використовуйте `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, щоб pnpm запускався всередині Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: утримує серіалізацію heavy-check всередині поточного робочого дерева замість спільного Git-каталогу для команд на кшталт `pnpm check:changed` і цільового `pnpm test ...`. Використовуйте це лише на локальних хостах із високою пропускною здатністю, коли навмисно запускаєте незалежні перевірки в linked worktrees.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без цілей є підтвердженням повного набору: вони використовують фіксовані shard-групи, розгортаються до leaf configs для локального паралельного виконання та перед стартом друкують очікуваний локальний fanout shard. Група розширень завжди розгортається до per-extension shard configs замість одного великого процесу root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest лишається деталлю для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібен ізольований `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store.
- `pnpm test:env-mutations:report`: неблокувальний звіт про тести й harnesses, які напряму змінюють `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` або пов’язані env keys OpenClaw. Використовуйте його, щоб знайти кандидатів для міграції на спільний test-state helper.
- Моковані E2E Control UI: використовуйте `pnpm test:ui:e2e` для лінії Vitest + Playwright, яка запускає Vite Control UI і керує реальною сторінкою Chromium проти мокованого Gateway WebSocket. Тести розміщені в `ui/src/**/*.e2e.test.ts`; спільні mocks і controls розміщені в `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` включає цю лінію. У робочих деревах Codex надавайте перевагу `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` для малого цільового підтвердження після встановлення залежностей або Testbox/Crabbox для ширшого GUI-підтвердження.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E тест Vitest потребує запущений Gateway, CLI env, захоплення логів і cleanup в одному місці.
- TUI PTY tests: використовуйте `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` для швидкої fake-backend PTY lane. Використовуйте `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` або `pnpm tui:pty:test:watch --mode local` для повільнішого smoke `tui --local`, який мокує лише зовнішній model endpoint. Перевіряйте стабільний видимий текст або fixture calls, а не сирі ANSI snapshots.
- Docker/Bash E2E helpers: lanes, які source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його через `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі callers можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для in-container shell snippet або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим Node runtimes трактувати `--env-file` як Node flag. Docker/Bash lanes, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для entrypoint resolution, mock OpenAI startup, foreground/background launch Gateway, readiness probes, state env export, log dumps і process cleanup.
- Повні, extension та include-pattern shard runs оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші whole-config runs використовують ці таймінги, щоб балансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до timing key, що зберігає видимість таймінгів filtered shard без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які залишають лише `test/setup.ts`, а runtime-heavy cases лишаються на своїх наявних lanes.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших directory globs. Helper edits у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати importing tests замість broad-running кожного shard, коли dependency path точний.
- `auto-reply` тепер також розділяється на три окремі configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper tests.
- Базова конфігурація Vitest тепер стандартно використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у configs репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші plugin groups лишаються batched. Використовуйте `pnpm test extensions/<id>` для однієї bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest import-duration + import-breakdown, водночас усе ще використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність routed changed-mode path відносно native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для Vitest main thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite Vitest leaf config послідовно й записує grouped duration data плюс per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після зміни, сфокусованої на продуктивності.
- `pnpm test:docker:timings <summary.json>` перевіряє повільні Docker lanes після Docker all run; використовуйте `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві цільові rerun commands з тих самих artifacts.
- Інтеграція Gateway: увімкнення за бажанням через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає aggregate E2E репозиторію: gateway end-to-end smoke tests плюс mocked browser E2E lane Control UI.
- `pnpm test:e2e:gateway`: запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). Стандартно використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: Збирає спільний образ для live-тестів, один раз пакує OpenClaw як npm-тарбол, збирає або повторно використовує мінімальний образ запуску Node/Git і функціональний образ, який встановлює цей тарбол у `/app`, а потім запускає напрями швидкої перевірки Docker з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Мінімальний образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для напрямів інсталятора, оновлення та залежностей Plugin; ці напрями монтують попередньо зібраний тарбол замість використання скопійованих джерел репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних напрямів функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI пакувальником пакетів і перевіряє тарбол разом із `dist/postinstall-inventory.json`, перш ніж Docker його використає. Визначення напрямів Docker містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким володіє планувальник, для вибраних напрямів, типів образів, потреб пакета/live-образу, сценаріїв стану та перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдера хвостовим пулом і за замовчуванням дорівнює 10. Обмеження важких напрямів за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням дозволяють один важкий напрям на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо один напрям перевищує ефективну вагу або ресурсне обмеження на хості з низьким паралелізмом, він все одно може стартувати з порожнього пулу й виконуватиметься сам, доки не звільнить місткість. Запуски напрямів за замовчуванням рознесені на 2 секунди, щоб уникнути локальних сплесків створення в демоні Docker; перевизначайте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Засіб запуску за замовчуванням попередньо перевіряє Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних напрямів кожні 30 секунд, спільно використовує кеші CLI-інструментів провайдера між сумісними напрямами, повторює тимчасові збої реальних провайдерів один раз за замовчуванням (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги напрямів у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших до найкоротших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест напрямів без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати виведення статусу, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних напрямів або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для напрямів реальних провайдерів; псевдоніми пакетів: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише для реальних провайдерів об'єднує основні й хвостові реальні напрями в один пул із пріоритетом найдовших, щоб групи провайдерів могли разом пакувати роботу Claude, Codex і Gemini. Засіб запуску припиняє планувати нові напрями в пулі після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен напрям має резервний таймаут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані реальні/хвостові напрями використовують жорсткіші обмеження для окремого напряму. Команди налаштування Docker для бекенду CLI мають власний таймаут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Журнали окремих напрямів, `summary.json`, `failures.json` і фазові таймінги записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні напрями, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві цільові команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає вихідний E2E-контейнер на базі Chromium, запускає сирий CDP разом з ізольованим Gateway, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP містять URL посилань, клікабельні елементи, підвищені з курсора, посилання на iframe і метадані фреймів.
- `pnpm test:docker:skill-install`: Встановлює запакований тарбол OpenClaw у мінімальному засобі запуску Docker, вимикає `skills.install.allowUploadedArchives`, визначає поточний slug skill через живий пошук ClawHub, встановлює його через `openclaw skills install` і перевіряє `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` і `skills info --json`.
- Реальні Docker-зонди бекенду CLI можна запускати як цільові напрями, наприклад `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` або `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini має відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає контейнеризовані OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує справжній проксійований чат через `/api/chat/completions`. Потребує придатного ключа реальної моделі, завантажує зовнішній образ Open WebUI і не очікується як стабільний для CI на рівні звичайних модульних/E2E-наборів.
- `pnpm test:docker:mcp-channels`: Запускає попередньо наповнений контейнер Gateway і другий клієнтський контейнер, який породжує `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги реальних подій, маршрутизацію вихідного надсилання та сповіщення каналу й дозволів у стилі Claude через справжній stdio-міст. Твердження щодо сповіщення Claude читає сирі stdio MCP-фрейми напряму, тому швидка перевірка відображає те, що міст фактично видає.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований тарбол OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета й неінтерактивний doctor без ключів реального провайдера або каналу, потім запускає Gateway через local loopback і перевіряє, що агенти, конфігурація каналу, списки дозволених Plugin, файли робочого простору/сеансу, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без ключів реального провайдера або каналу, налаштовує цю базову версію за допомогою вбудованого рецепта команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого тарбола OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway через local loopback і перевіряє, що налаштовані наміри, файли робочого простору/сеансу, застаріла конфігурація Plugin і legacy-стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно виправляються. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну локальну матрицю через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, або додайте сценарні фікстури через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні OpenClaw plugins автоматично встановлюються під час оновлення, і `stale-source-plugin-shadow`, щоб тіні Plugin лише з джерел не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, а також перетворює метатокени базових версій, як-от `last-stable-4` або `all-since-2026.4.23`, перш ніж передати точні специфікації пакетів у напрями Docker.
- `pnpm test:docker:update-migration`: Запускає опублікований harness перевірки збереження після оновлення у сценарії `plugin-deps-cleanup`, насиченому очищенням, починаючи за замовчуванням з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цей напрям із `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата й доводив очищення залежностей налаштованих Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає швидкі перевірки встановлення/оновлення для локального шляху, `file:`, пакетів npm-реєстру з hoisted-залежностями, рухомих git-посилань, фікстур ClawHub, оновлень marketplace і ввімкнення/інспектування Claude-bundle.

## Локальний PR gate

Для локальних перевірок перед злиттям/gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

Набори параметрів:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори параметрів

Вивід містить `sampleCount`, середнє, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та захоплення профілю використовували той самий harness.

Правила збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` із `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову fixture у `test/fixtures/cli-startup-bench.json` із `runs=5` і `warmup=1`

Зафіксована в репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Бенчмарк запуску Gateway

Скрипт: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Бенчмарк за замовчуванням використовує зібрану точку входу CLI в `dist/entry.js`; запустіть
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
- `fiftyPlugins`: 50 маніфестних плагінів.
- `fiftyStartupLazyPlugins`: 50 startup-lazy маніфестних плагінів.

Вивід містить перший вивід процесу, `/healthz`, `/readyz`, час логування HTTP listen,
час логування готовності Gateway, CPU time, CPU core ratio, max RSS, heap, метрики startup trace,
затримку event-loop і детальні метрики таблиці пошуку плагінів. Скрипт
увімкнює `OPENCLAW_GATEWAY_STARTUP_TRACE=1` у середовищі дочірнього Gateway.

Читайте `/healthz` як liveness: HTTP-сервер може відповідати. Читайте `/readyz` як
придатну до використання готовність: startup sidecars плагінів, канали та ready-critical
post-attach робота завершилися. Startup hooks Gateway надсилаються
асинхронно й не входять до гарантії готовності. Час логу готовності — це
внутрішня мітка часу логу готовності Gateway; вона корисна для атрибуції
на боці процесу, але не замінює зовнішній probe `/readyz`.

Використовуйте JSON-вивід або `--output` під час порівняння змін. Використовуйте `--cpu-prof-dir` лише
після того, як trace-вивід вказує на import, compile або CPU-bound роботу, яку неможливо
пояснити лише phase timings. Не порівнюйте результати source-runner із
результатами зібраного `dist/entry.js` як одну й ту саму базову лінію.

## Бенчмарк перезапуску Gateway

Скрипт: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Бенчмарк перезапуску підтримується лише на macOS і Linux. Він використовує SIGUSR1 для
перезапусків усередині процесу й негайно завершується з помилкою на Windows.

Бенчмарк за замовчуванням використовує зібрану точку входу CLI в `dist/entry.js`; запустіть
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
- `fiftyPlugins`: перезапуск із 50 маніфестними плагінами.

Вивід містить наступний `/healthz`, наступний `/readyz`, downtime, таймінг restart ready,
CPU, RSS, метрики startup trace для процесу заміни та метрики restart trace
для обробки сигналу, draining active-work, фаз close, наступного запуску, таймінгу ready
і знімків пам’яті. Скрипт увімкнює
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` і `OPENCLAW_GATEWAY_RESTART_TRACE=1` у
середовищі дочірнього Gateway.

Використовуйте цей бенчмарк, коли зміна торкається сигналізації перезапуску, close handlers,
startup-after-restart, завершення sidecar, service handoff або готовності після
перезапуску. Починайте з `skipChannels`, коли ізолюєте механіку Gateway від запуску
каналів. Використовуйте `default` або сценарії з великою кількістю плагінів лише після того, як вузький сценарій пояснить
шлях перезапуску.

Trace-метрики — це підказки для атрибуції, а не вердикти. Зміну перезапуску слід
оцінювати за кількома зразками, відповідним owner span, поведінкою `/healthz` і `/readyz`
та користувацьким контрактом перезапуску.

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє config/workspace/session файли, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Переконується, що підтримуваний QR runtime helper завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins)
