---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T22:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57a5eff6e46662960a9b06a1f6883bb22b3fd8598de6338b4e7da3fa1b90b492
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Порогові значення: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати кожен файл вихідного коду з розділених lane без покриття.
- `pnpm test:coverage:changed`: запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у відповідні lane Vitest, коли diff зачіпає лише маршрутизовані файли коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску кореневих проєктів, щоб зміни в обв’язці перезапускалися ширше, коли це потрібно.
- `pnpm test:changed:focused`: запуск змінених тестів для внутрішнього циклу розробки. Він запускає лише точні цілі з прямих змін у тестах, сусідніх файлів `*.test.ts`, явних відповідностей вихідного коду та локального графа імпортів. Широкі зміни, зміни конфігурації або пакетів пропускаються замість розгортання до повного резервного запуску changed-test.
- `pnpm changed:lanes`: показує архітектурні lane, які активуються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи з core test lanes, роботу extensions з extension test lanes, зміни лише в тестах — лише з перевіркою типів тестів/тестами, розгортає зміни публічного Plugin SDK або plugin-contract до одного проходу перевірки extension і залишає підвищення версій лише в метаданих релізу на цільових перевірках версій/конфігурації/кореневих залежностей.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через відповідні lane Vitest. Запуски без цілей використовують фіксовані shard-групи та розгортаються до leaf-конфігурацій для локального паралельного виконання; група extensions завжди розгортається до конфігурацій shard для кожного extension окремо, а не в один гігантський процес root-project.
- Повні запуски, запуски shards extensions і include-pattern оновлюють локальні дані часу виконання в `.artifacts/vitest-shard-timings.json`; пізніші запуски всієї конфігурації використовують ці дані, щоб збалансувати повільні й швидкі shards. CI-shards з include-pattern додають ім’я shard до ключа часу, що дозволяє зберігати видимість часу відфільтрованих shards без заміни даних часу для всієї конфігурації. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lane, які зберігають лише `test/setup.ts`, залишаючи ресурсоємні runtime-випадки у їхніх наявних lane.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед переходом до ширших glob шаблонів каталогу. Зміни helper-файлів у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також поділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнений у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shards extension/plugin. Важкі channel plugins, browser plugin та OpenAI запускаються як окремі shards; інші групи plugins залишаються пакетними. Використовуйте `pnpm test extensions/<id>` для одного lane конкретного bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту та деталізацію імпорту, водночас і далі використовуючи маршрутизацію lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: той самий профайлінг імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує бенчмарк маршрутизованого шляху в режимі changed проти нативного запуску root-project для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує бенчмарк поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf-конфігурацію Vitest повного набору тестів і записує згруповані дані тривалості разом з JSON/log-артефактами для кожної конфігурації. Агент продуктивності тестів використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести Gateway (парування WS/HTTP/node з кількома екземплярами). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: збирає спільний образ live-тестів, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує базовий образ runner з Node/Git і функціональний образ, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane встановлення/оновлення/залежностей plugin; ці lane монтують попередньо зібраний tarball замість використання скопійованих вихідних кодів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lane функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — єдиний локальний/CI пакувальник пакета. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким керує планувальник, для вибраних lane, типів образів, потреб пакета/live-image та перевірок облікових даних без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до провайдерів, і за замовчуванням теж дорівнює 10. Обмеження важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням — один важкий lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Запуски lane за замовчуванням розподіляються з інтервалом 2 секунди, щоб уникнути штормів створення на локальному Docker daemon; змініть через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд, спільно використовує кеші CLI-інструментів провайдерів між сумісними lane, за замовчуванням один раз повторює тимчасові збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає час lane в `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом “найдовші спочатку” в наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування частоти статусів, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання даних часу. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-провайдерів; пакетні псевдоніми — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні та tail live-lanes в один pool з порядком “найдовші спочатку”, щоб кошики провайдерів могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші обмеження часу на lane. Команди налаштування Docker для бекенда CLI мають власний тайм-аут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Логи для кожного lane та `summary.json` з часом етапів записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: збирає контейнер source E2E на базі Chromium, запускає сирий CDP і ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP містять URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Live Docker probes для бекенда CLI можна запускати як сфокусовані lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із підготовленими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідного надсилання, а також сповіщення про channel і permissions у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke-тест відображав те, що bridge реально надсилає.

## Локальна перевірка PR

Для локальних перевірок перед злиттям/проходженням gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно працює на навантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий запит: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax: медіана 1279 мс (мін. 1114, макс. 2431)
- opus: медіана 2454 мс (мін. 1224, макс. 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл кодів виходу/сигналів і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу та захоплення профілю використовують одну й ту саму harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору тестів у `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює baseline fixture, що зберігається в репозиторії, у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Fixture, що зберігається в репозиторії:

- `test/fixtures/cli-startup-bench.json`
- Оновити за допомогою `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker не є обов’язковим; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний потік холодного старту в чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний helper runtime для QR завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
