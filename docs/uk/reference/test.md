---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-27T12:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e7fa9987f47d4953a32c3d9e29ca23d90a7ef459e36386a90e0cd0f90c99c96
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Це coverage gate для unit-тестів завантажених файлів, а не all-file coverage для всього репозиторію. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором unit coverage, замість того щоб вважати всі вихідні файли split-lane непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск змінених тестів. Він запускає точні цілі на основі прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідних файлів і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск змінених тестів. Використовуйте його, коли редагування test harness/config/package має повертатися до ширшої поведінки змінених тестів Vitest.
- `pnpm changed:lanes`: показує архітектурні lanes, які запускаються через diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний gate перевірки змін для diff відносно `origin/main`. Він виконує typecheck, lint і guard-команди для порушених архітектурних lanes, але не запускає тести Vitest. Для доказу тестів використовуйте `pnpm test:changed` або явний `pnpm test <target>`.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped lanes Vitest. Запуски без цілей використовують фіксовані shard-групи й розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard-конфігів для кожного extension замість одного гігантського root-project процесу.
- Запуски обгортки тестів завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Повні, extension і shard-запуски за шаблоном include оновлюють локальні дані таймінгу в `.artifacts/vitest-shard-timings.json`; подальші запуски всіх конфігурацій використовують ці таймінги для балансування повільних і швидких shard. Include-pattern CI shards додають ім’я shard до ключа таймінгу, що зберігає видимість відфільтрованих таймінгів shard без заміни даних таймінгу всієї конфігурації. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lanes, які зберігають лише `test/setup.ts`, залишаючи ресурсоємні runtime-випадки у наявних lanes.
- Вихідні файли із сусідніми тестами спочатку зіставляються з цим сусіднім тестом, а вже потім переходять до ширших glob-шаблонів каталогу. Редагування допоміжних файлів у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів для запуску тестів-імпортерів замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розбито на три окремі конфіги (`core`, `top-level`, `reply`), тож harness відповідей більше не домінує над легшими тестами верхнього рівня для status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігах по всьому репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard для extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші групи плагінів залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого плагіна.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту й розбивку імпортів, водночас і далі використовує scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований шлях changed-mode із нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config Vitest із повного набору та записує згруповані дані тривалості разом з JSON/log-артефактами для кожної конфігурації. Агент Test Performance використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: увімкнення за запитом через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести gateway end-to-end (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, який установлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lanes встановлення/оновлення/залежностей плагінів; ці lanes монтують попередньо зібраний tarball замість використання скопійованих вихідних кодів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lanes функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — єдиний локальний/CI пакувальник пакетів, який перевіряє tarball і `dist/postinstall-inventory.json`, перш ніж Docker почне їх використовувати. Визначення Docker lanes живуть у `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, що належить планувальнику, для вибраних lanes, типів образів, потреб package/live-image і перевірок облікових даних без побудови чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до провайдерів, і за замовчуванням також дорівнює 10. Обмеження важких lanes за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням — один важкий lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для потужніших хостів. Якщо один lane перевищує ефективне обмеження ваги чи ресурсів на хості з низьким паралелізмом, він усе одно може стартувати з порожнього pool і працюватиме самостійно, доки не звільнить ресурси. Запуски lanes за замовчуванням розводяться на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lanes кожні 30 секунд, ділить кеші CLI tool провайдерів між сумісними lanes, за замовчуванням один раз повторює тимчасові збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lanes у `.artifacts/docker-tests/lane-timings.json` для впорядкування «найдовші спочатку» у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lanes без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` для лише детермінованих/локальних lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` для лише lanes live-провайдерів; псевдоніми пакетів: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні й tail live lanes в один pool з порядком «найдовші спочатку», щоб кошики провайдерів могли спільно пакувати завдання Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes мають жорсткіші обмеження на рівні lane. Команди налаштування Docker для CLI backend мають власний тайм-аут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи для кожного lane, `summary.json`, `failures.json` і таймінги фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві цільові команди повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: збирає E2E-контейнер джерела на базі Chromium, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять URL посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як цільові lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує справжній проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується, що він буде таким стабільним у CI, як звичайні unit/e2e набори.
- `pnpm test:docker:mcp-channels`: запускає seeded контейнер Gateway і другий контейнер клієнта, який стартує `openclaw mcp serve`, а потім перевіряє routed discovery розмов, читання transcript, metadata вкладень, поведінку черги live events, маршрутизацію outbound send і сповіщення про канал + дозволи в стилі Claude через справжній міст stdio. Перевірка сповіщень Claude читає raw stdio MCP frames безпосередньо, щоб smoke відображав те, що міст реально виводить.

## Локальний PR gate

Для локальних перевірок land/gate PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно працює на завантаженому хості, повторіть запуск один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Бенч запуску CLI

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

Набори:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують один і той самий harness.

Умовні позначення збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлюйте через `pnpm test:startup:bench:update`
- Порівнюйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проводить інтерактивний wizard через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний допоміжний засіб runtime QR завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язано

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
