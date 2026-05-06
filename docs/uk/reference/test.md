---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-06T05:09:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття типової модульної lane, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, а типова lane обмежує включення покриття нешвидкими модульними тестами із сусідніми вихідними файлами, gate вимірює вихідний код, який належить цій lane, замість кожного транзитивного імпорту, який вона випадково завантажує.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих редагувань тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли редагування тестового harness/конфігурації/пакета має повертатися до ширшої поведінки Vitest для тестів за змінами.
- `pnpm changed:lanes`: показує архітектурні lanes, викликані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний changed check gate для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для доказу тестами.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lanes Vitest. Запуски без цілей використовують фіксовані групи shard і розгортаються до leaf-конфігів для локального паралельного виконання; група розширень завжди розгортається до per-extension shard configs замість одного гігантського процесу root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest лишається деталізацією для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, фікстура конфігурації, workspace, каталог агента або сховище auth-profile.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E-тест Vitest потребує запущеного Gateway, CLI env, захоплення логів і cleanup в одному місці.
- Docker/Bash E2E helpers: lanes, які source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell snippet у контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим runtime Node трактувати `--env-file` як прапорець Node. Docker/Bash lanes, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для entrypoint resolution, mock OpenAI startup, запуску Gateway на передньому плані/у фоні, readiness probes, експорту state env, дампів логів і cleanup процесів.
- Повні, extension і include-pattern shard-запуски оновлюють локальні timing data у `.artifacts/vitest-shard-timings.json`; подальші whole-config запуски використовують ці timings, щоб збалансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до timing key, що зберігає видимість filtered shard timings без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які залишають лише `test/setup.ts`, лишаючи runtime-heavy випадки на їхніх наявних lanes.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших directory globs. Редагування helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які імпортують ці helper, замість широкого запуску кожного shard, коли dependency path є точним.
- `auto-reply` тепер також розділено на три окремі конфіги (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper tests.
- Базовий конфіг Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігах репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші групи plugin залишаються batched. Використовуйте `pnpm test extensions/<id>` для однієї bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме import profiling, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark-ить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен full-suite Vitest leaf config і записує grouped duration data, а також JSON/log artifacts для кожного конфіга. Test Performance Agent використовує це як baseline перед спробою виправлень повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke tests Gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивними workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live tests провайдера (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для unskip.
- `pnpm test:docker:all`: Будує спільний live-test image, один раз пакує OpenClaw як npm tarball, будує/повторно використовує bare Node/Git runner image плюс functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball замість використання скопійованих джерел репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його споживає. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить CI plan, яким володіє scheduler, для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без побудови або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps за замовчуванням дорівнюють одній heavy lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо одна lane перевищує effective weight або resource cap на low-parallelism host, вона все одно може стартувати з empty pool і виконуватиметься сама, доки не звільнить capacity. Старти lanes за замовчуванням staggered на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням preflight-ить Docker, очищує stale OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між сумісними lanes, один раз за замовчуванням повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати status output, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути timing reuse. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lanes після першого failure, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Будує Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls зовнішній Open WebUI image і не очікується таким CI-stable, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає контейнер Gateway із початковими даними та другий клієнтський контейнер, який породжує `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги живих подій, маршрутизацію вихідного надсилання та сповіщення каналу в стилі Claude + сповіщення про дозволи через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-фрейми напряму, щоб smoke-тест відображав те, що міст фактично випускає.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета плюс неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає Gateway loopback і перевіряє, що агенти, конфігурація каналу, allowlist-и Plugin, файли workspace/session, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням установлює `openclaw@latest`, засіває реалістичні файли наявного користувача без живих ключів провайдера чи каналу, налаштовує цей baseline вбудованим рецептом команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway loopback і перевіряє, що налаштовані наміри, файли workspace/session, застаріла конфігурація Plugin і legacy-стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно відновлюються. Перевизначте один baseline за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну локальну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні OpenClaw plugins автоматично встановлюються під час оновлення, і `stale-source-plugin-shadow`, щоб тіні Plugin лише з вихідного коду не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, а також розв’язує meta-токени baseline, як-от `last-stable-4` або `all-since-2026.4.23`, перед передаванням точних специфікацій пакетів у Docker-доріжки.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup` з інтенсивним очищенням, за замовчуванням починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цю доріжку з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та підтверджував очищення залежностей налаштованого Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає smoke-тест установлення/оновлення для локального шляху, `file:`, пакетів npm registry з hoisted-залежностями, рухомих git refs, фікстур ClawHub, оновлень marketplace і ввімкнення/інспекції Claude-bundle.

## Локальний gate для PR

Для локальних перевірок перед злиттям/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкове середовище: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний prompt: "Відповідай одним словом: ok. Без розділових знаків або додаткового тексту."

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілів використовували той самий harness.

Домовленості щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний runtime helper для QR завантажується в підтримуваних Docker runtime Node (стандартний Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)
