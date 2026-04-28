---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-28T00:35:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b32904204717ae35dda88d74eba225c173fecbe6230209b066795419857cdee
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Testing](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає набір unit-тестів з V8 coverage (через `vitest.unit.config.ts`). Це перевірка unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того, щоб вважати всі файли вихідного коду в розділених lanes непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешева розумна перевірка changed test run. Вона запускає точні цілі на основі прямих змін у тестах, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального import graph. Широкі зміни config/package пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий changed test run. Використовуйте його, коли зміна test harness/config/package має повернутися до ширшої поведінки changed-test у Vitest.
- `pnpm changed:lanes`: показує архітектурні lanes, запущені diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed check gate для diff відносно `origin/main`. Вона запускає typecheck, lint і guard-команди для заторкнутих архітектурних lanes, але не запускає тести Vitest. Для доказу тестами використовуйте `pnpm test:changed` або явний `pnpm test <target>`.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes. Нетаргетовані запуски використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для кожного extension, а не в один гігантський процес root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Повні, extension і include-pattern shard-запуски оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; пізніші whole-config запуски використовують ці дані часу для балансування повільних і швидких shards. Include-pattern CI shards додають ім’я shard до ключа часу, що зберігає видимість timings відфільтрованих shards без заміни даних часу whole-config. Задайте `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт timings.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які зберігають лише `test/setup.ts`, залишаючи важкі runtime-випадки на наявних lanes.
- Вихідні файли із сусідніми тестами зіставляються із цим сусіднім тестом перед переходом до ширших glob-шаблонів каталогу. Зміни helper у `test/helpers/channels`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний import graph, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розділено на три окремі configs (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами top-level status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, із ввімкненим спільним non-isolated runner у всіх configs репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shards extension/plugin. Важкі channel plugins, browser plugin і OpenAI працюють як окремі shards; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас використовуючи маршрутизацію scoped lanes для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: той самий профайлінг import, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого changed-mode шляху проти нативного запуску root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config повного набору Vitest і записує згруповані дані тривалості плюс JSON/log-артефакти для кожного config. Агент продуктивності тестів використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, орієнтованої на продуктивність.
- Інтеграція gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести end-to-end для gateway (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивними workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і задайте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести постачальників (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для постачальника `*_LIVE_TEST=1`), щоб прибрати пропуск.
- `pnpm test:docker:all`: збирає спільний образ live-test, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує базовий образ runner на Node/Git плюс функціональний образ, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lanes installer/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball замість використання скопійованих вихідних кодів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lanes функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — це єдиний локальний/CI packer пакета, який перевіряє tarball і `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким володіє scheduler, для вибраних lanes, типів образів, потреб package/live-image і перевірок облікових даних без збирання чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує pool для чутливого до постачальників tail і типово також дорівнює 10. Обмеження для важких lanes типово: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження постачальників типово — один важкий lane на постачальника через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для більших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Якщо один lane перевищує ефективне обмеження ваги або ресурсів на хості з низьким паралелізмом, він усе одно може стартувати з порожнього pool і працюватиме самостійно, доки не звільнить ресурси. Старт lanes типово розноситься на 2 секунди, щоб уникнути локальних штормів створення Docker daemon; перевизначте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує preflight Docker, очищає застарілі контейнери OpenClaw E2E, кожні 30 секунд виводить статус активних lanes, спільно використовує кеші CLI-інструментів постачальників між сумісними lanes, один раз за замовчуванням повторює транзитні збої live-постачальників (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає timings lanes у `.artifacts/docker-tests/lane-timings.json` для порядку longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест lanes без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання timings. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` для лише детермінованих/локальних lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lanes live-постачальників; package-аліаси: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує main і tail live lanes в один pool longest-first, щоб кошики постачальників могли разом упаковувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не задано `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші обмеження для кожного lane. Команди налаштування Docker для CLI backend мають окремий timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи для кожного lane, `summary.json`, `failures.json` і timings фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві таргетовані команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: збирає вихідний E2E-контейнер із Chromium, запускає сирий CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що role snapshots CDP містять URL-адреси посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як сфокусовані lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні аліаси `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім виконує справжній проксований chat через `/api/chat/completions`. Потребує придатного live-ключа моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як CI-stable на відміну від звичайних unit/e2e наборів.
- `pnpm test:docker:mcp-channels`: запускає ініціалізований контейнер Gateway і другий контейнер клієнта, який стартує `openclaw mcp serve`, а потім перевіряє виявлення маршрутованих розмов, читання transcript, метадані вкладень, поведінку live event queue, маршрутизацію вихідного надсилання та сповіщення про channel + permissions у стилі Claude через справжній міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke відображав те, що міст реально надсилає.

## Локальний PR gate

Для локальних перевірок перед land/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` флейкиться на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model latency bench (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI startup bench

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

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує таргетований smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення через `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів онбордингу.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний helper середовища виконання QR завантажується в підтримуваних середовищах виконання Docker Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Testing](/uk/help/testing)
- [Testing live](/uk/help/testing-live)
