---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими примусового запуску/покриття
title: Тести
x-i18n:
    generated_at: "2026-04-29T02:19:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори, живе тестування, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який залишковий процес Gateway, що утримує стандартний контрольний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття unit-тестів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати кожен файл джерел із розділених lanes непокритим.
- `pnpm test:coverage:changed`: Запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень джерел і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового harness/конфігурації/пакета має fallback до ширшої поведінки changed-test у Vitest.
- `pnpm changed:lanes`: показує архітектурні lanes, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний gate перевірки змін для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: маршрутизує явні цілі файлів/директорій через scoped lanes Vitest. Запуски без цілей використовують фіксовані групи shard і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для кожного extension замість одного величезного процесу root-project.
- Запуски тестового wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли E2E-тест рівня процесу Vitest потребує запущеного Gateway, CLI env, захоплення логів і очищення в одному місці.
- Docker/Bash E2E helpers: lanes, що source `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчерівневі callers можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell snippet у контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим рантаймам Node трактувати `--env-file` як прапорець Node. Docker/Bash lanes, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для entrypoint resolution, mock OpenAI startup, запуску Gateway у foreground/background, readiness probes, state env export, log dumps і process cleanup.
- Full, extension і include-pattern shard runs оновлюють локальні timing data в `.artifacts/vitest-shard-timings.json`; подальші whole-config runs використовують ці timings, щоб балансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до timing key, що зберігає filtered shard timings видимими без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через dedicated light lanes, які залишають лише `test/setup.ts`, а runtime-heavy cases лишаються на своїх наявних lanes.
- Source files із sibling tests зіставляються з цим sibling перед fallback до ширших directory globs. Helper edits у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний import graph, щоб запускати importing tests замість широкого запуску кожного shard, коли dependency path є точним.
- `auto-reply` тепер також розділяється на три dedicated configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper tests.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Heavy channel plugins, browser plugin і OpenAI запускаються як dedicated shards; інші plugin groups лишаються batched. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає Vitest import-duration + import-breakdown reporting, водночас і далі використовуючи scoped lane routing для явних file/directory targets.
- `pnpm test:perf:imports:changed`: той самий import profiling, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark-ить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожну full-suite Vitest leaf config послідовно й записує grouped duration data плюс JSON/log artifacts для кожної конфігурації. Test Performance Agent використовує це як baseline перед спробою виправити slow-test.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після performance-focused change.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: Збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують prebuilt tarball замість використання скопійованих repo sources. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і валідує tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його споживає. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без build або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps за замовчуванням становлять один heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо один lane перевищує effective weight або resource cap на low-parallelism host, він усе одно може стартувати з empty pool і працюватиме сам, доки не звільнить capacity. Lane starts за замовчуванням staggered на 2 секунди, щоб уникати local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує Docker preflight, очищає stale OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділиться provider CLI tool caches між compatible lanes, за замовчуванням один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати status output, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути timing reuse. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об'єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lanes після першого failure, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має 120-minute fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують tight per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути slow lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати cheap targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls зовнішній Open WebUI image і не очікується CI-stable, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який spawns `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Claude notification assertion читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.

## Локальний PR gate

Для локальних перевірок перед злиттям PR/гейтів виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` періодично падає на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий запит: “Відповідай одним словом: ok. Без пунктуації або додаткового тексту.”

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та збирання профілю використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний процес холодного запуску в чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли конфігурації/робочого простору/сесії, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний runtime-помічник QR завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
