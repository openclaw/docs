---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-28T01:19:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: df15d8967bd22e46336522aed44a32151f015f481c5aad24b66c7e0f10232e2f
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Порогові значення становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати кожен файл вихідного коду з розділених lanes непокритим.
- `pnpm test:coverage:changed`: запускає покриття unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змінених файлів. Він запускає точні цілі на основі прямих змін у тестах, сусідніх файлів `*.test.ts`, явних відповідностей вихідного коду та локального графа імпортів. Широкі зміни в config/package пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змінених файлів. Використовуйте його, коли редагування test harness/config/package має повертатися до ширшої поведінки Vitest для changed-тестів.
- `pnpm changed:lanes`: показує архітектурні lanes, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Він виконує typecheck, lint і guard-команди для заторкнутих архітектурних lanes, але не запускає тести Vitest. Для підтвердження тестами використовуйте `pnpm test:changed` або явний `pnpm test <target>`.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без цілей використовують фіксовані групи shard і розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard для кожного extension окремо, а не в один великий root-project process.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Повні запуски, shard-запуски extension і include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски whole-config використовують ці таймінги, щоб балансувати повільні та швидкі shards. Include-pattern CI shards додають ім’я shard до ключа таймінгів, що зберігає видимість таймінгів відфільтрованих shard без заміни даних таймінгів whole-config. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lanes, які зберігають лише `test/setup.ts`, залишаючи важкі з погляду runtime сценарії на їхніх наявних lanes.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед тим, як переходити до ширших glob шаблонів каталогів. Зміни helper у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів для запуску тестів, що імпортують їх, замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розділяється на три окремі config (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими тестами верхнього рівня для status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, із увімкненим у спільних config репозиторію спільним неізольованим runner.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shards extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту та import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmarking для routed changed-mode path проти нативного запуску root-project для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmarking для поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config Vitest із повного набору та записує згруповані дані тривалості разом із JSON/log-артефактами для кожного config. Агент продуктивності тестів використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, зосереджених на продуктивності.
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає gateway end-to-end smoke-тести (парування кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API-ключі та `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: збирає спільний образ для live-тестів, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує базовий образ runner із Node/Git і функціональний образ, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lanes installer/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lanes функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — це єдиний пакувальник package для локального середовища та CI, і він перевіряє tarball разом із `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lanes розміщено в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким керує планувальник, для вибраних lanes, типів образів, потреб package/live-image і перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до provider, і типово також дорівнює 10. Обмеження для важких lanes типово становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження provider типово становлять один важкий lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для потужніших хостів. Якщо один lane перевищує ефективне обмеження ваги або ресурсів на хості з низьким рівнем паралелізму, він усе одно може стартувати з порожнього пулу і виконуватиметься самостійно, доки не звільнить ресурси. Запуски lanes типово затримуються на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; змініть це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lanes кожні 30 секунд, ділиться кешами CLI-інструментів provider між сумісними lanes, типово один раз повторює тимчасові збої live-provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lanes у `.artifacts/docker-tests/lane-timings.json` для порядку запуску від найдовших до найкоротших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести manifest lanes без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування інтервалу виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні та tail live lanes в один пул із порядком від найдовших до найкоротших, щоб provider buckets могли спільно пакувати завдання Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження для окремих lanes. Команди Docker setup для CLI backend мають власний тайм-аут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи для кожного lane, `summary.json`, `failures.json` і таймінги фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві команди для точкового повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: збирає Chromium-backed source E2E container, запускає raw CDP разом з ізольованим Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять URL посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як точкові lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається таким, що має бути стабільним у CI, на відміну від звичайних наборів unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded Gateway container і другий client container, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані attachment, поведінку live event queue, маршрутизацію outbound send і сповіщення про channel + permissions у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що міст насправді надсилає.

## Локальна PR gate

Для локальних перевірок land/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний результат на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без пунктуації чи зайвого тексту.”

Останній запуск (2025-12-31, 20 запусків):

- median для minimax 1279ms (min 1114, max 2431)
- median для opus 2454ms (min 1224, max 3170)

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

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу та зняття профілів використовують той самий harness.

Угоди для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний QR runtime helper завантажується у підтримуваних Docker Node runtime (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
