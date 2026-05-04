---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими примусового запуску/покриття
title: Тести
x-i18n:
    generated_at: "2026-05-04T20:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який залишковий процес Gateway, що утримує типовий керівний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття завантажених файлів модульними тестами, а не покриття всіх файлів усього репозиторію. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен файл джерела зі split-lane непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів за змінами. Він запускає точні цілі з безпосередніх змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень джерел і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів за змінами. Використовуйте його, коли зміна тестового harness/конфігурації/пакета має повернутися до ширшої поведінки Vitest для тестів за змінами.
- `pnpm changed:lanes`: показує архітектурні lanes, спричинені diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний gate перевірки змін для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lanes Vitest. Запуски без цілей використовують фіксовані групи shards і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для кожного extension замість одного великого процесу root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest лишається деталлю для кожного shard.
- Спільний стан тестів OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture конфігурації, workspace, каталог agent або сховище auth-profile.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли E2E-тест рівня процесу Vitest потребує запущеного Gateway, середовища CLI, захоплення журналів і cleanup в одному місці.
- Docker/Bash E2E helpers: lanes, що source `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell snippet у контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим runtime Node трактувати `--env-file` як прапорець Node. Docker/Bash lanes, що запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для entrypoint resolution, mock startup OpenAI, запуску Gateway у foreground/background, readiness probes, експорту state env, дампів журналів і cleanup процесів.
- Запуски shards для full, extension та include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші whole-config запуски використовують ці таймінги, щоб збалансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до ключа таймінгу, що зберігає видимість відфільтрованих таймінгів shard без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через dedicated light lanes, які залишають лише `test/setup.ts`, залишаючи runtime-heavy випадки на їхніх наявних lanes.
- Файли джерела із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших directory globs. Зміни helpers у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати імпортуючі тести замість broad-running кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділяється на три dedicated configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими тестами top-level status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням має `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як dedicated shards; інші групи plugin лишаються batched. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас усе ще використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarks routed changed-mode path проти native root-project run для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarks поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожну full-suite Vitest leaf config послідовно й записує згруповані дані тривалості плюс JSON/log артефакти для кожної config. Test Performance Agent використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, спрямованої на продуктивність.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: Запускає live tests провайдерів (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб не пропускатися.
- `pnpm test:docker:all`: Збирає спільний образ live-test, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, який установлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball замість використання скопійованих repo sources. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic розміщена в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без збирання чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps за замовчуванням обмежують до одного heavy lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо один lane перевищує effective weight або resource cap на host із низьким parallelism, він усе одно може стартувати з empty pool і працюватиме сам, доки не звільнить capacity. Старт lanes за замовчуванням рознесено на 2 секунди, щоб уникати local Docker daemon create storms; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням preflights Docker, очищає stale OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділиться provider CLI tool caches між сумісними lanes, один раз за замовчуванням повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як сфокусовані lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls зовнішній Open WebUI image і не очікується таким CI-stable, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який spawns `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, поведінку live event queue, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Перевірка Claude notification читає raw stdio MCP frames безпосередньо, щоб smoke відображав те, що bridge справді emits.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета та неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає Gateway через loopback і перевіряє, що агенти, конфігурація каналу, списки дозволених Plugin, файли робочого простору/сесії, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням установлює `openclaw@latest`, додає реалістичні файли наявного користувача без живих ключів провайдера чи каналу, налаштовує цей базовий стан за допомогою вбудованого рецепта команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway через loopback і перевіряє, що налаштовані наміри, файли робочого простору/сесії, застаріла конфігурація Plugin і legacy-стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно відновлюються. Перевизначте один базовий стан через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні Plugin OpenClaw автоматично встановлюються під час оновлення, і `stale-source-plugin-shadow`, щоб source-only тіні Plugin не ламали запуск. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup`, який активно виконує очищення, за замовчуванням починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цю лінію з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та підтверджував очищення залежностей налаштованих Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає smoke-тест установлення/оновлення для локального шляху, `file:`, пакетів npm registry з піднятими залежностями, рухомих посилань git, фікстур ClawHub, оновлень marketplace і ввімкнення/інспектування Claude-бандла.

## Локальний PR gate

Для локальних перевірок PR land/gate виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає флейк на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний prompt: “Відповідай одним словом: ok. Без пунктуації чи додаткового тексту.”

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

Вивід містить `sampleCount`, середнє, p50, p95, min/max, розподіл exit-code/signal і підсумки максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу й захоплення профілю використовували один і той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксована в репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Переконується, що підтримуваний QR runtime helper завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
