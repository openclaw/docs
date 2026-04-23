---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T13:33:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2897f6a58720b43c749dc7ea410369a529bb8f72c50f8d9e55f114bf39ccb1a9
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка unit-покриття для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-покриття, замість того щоб вважати кожен файл вихідного коду в розбитих lane непокритим.
- `pnpm test:coverage:changed`: запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped lane Vitest, коли diff торкається лише routable файлів коду/тестів. Зміни конфігурації/налаштування, як і раніше, повертаються до нативного запуску root projects, щоб за потреби зміни у зв’язуванні перезапускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи разом із lane core-тестів, роботи extensions — разом із lane extension-тестів, зміни лише в тестах — лише з typecheck/tests для тестів, розширює зміни публічного Plugin SDK або plugin-contract до перевірки extensions, а також залишає підвищення версій лише в release metadata на таргетованих перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явно вказані цілі файлів/каталогів через scoped lane Vitest. Нетаргетовані запуски використовують фіксовані групи shard і розгортаються до leaf config для локального паралельного виконання; група extensions завжди розгортається до конфігурацій shard для кожного extension/plugin окремо, а не в один гігантський процес root-project.
- Повні запуски та запуски shard для extensions оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші запуски використовують ці таймінги для балансування повільних і швидких shard. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які зберігають лише `test/setup.ts`, залишаючи runtime-важкі кейси на наявних lane.
- Вибрані допоміжні вихідні файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами у цих легких lane, тож невеликі зміни в helper не змушують повторно запускати важкі набори з runtime.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` та `isolate: false`, а спільний non-isolated runner увімкнено в конфігураціях по всьому репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel extensions і OpenAI виконуються як окремі shard; інші групи extensions залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звіти Vitest про тривалість імпорту та розбивку імпортів, водночас зберігаючи маршрутизацію через scoped lane для явно вказаних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого шляху в changed-режимі проти нативного запуску root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (парування multi-instance WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і образ Docker E2E, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` із паралелізмом 4 за замовчуванням. Налаштовується через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Lane, чутливі до старту або провайдера, запускаються ексклюзивно після паралельного пулу. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потрібен придатний ключ live-моделі (наприклад, OpenAI у `~/.profile`), підтягується зовнішній образ Open WebUI, і цей сценарій не очікується стабільним у CI так, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із наповненими даними та другий клієнтський контейнер, який піднімає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідних надсилань і сповіщення про channel + permissions у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-фрейми безпосередньо, щоб smoke відображав те, що міст справді надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно проходить на навантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте проблему через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- median для minimax: 1279 мс (min 1114, max 2431)
- median для opus: 2454 мс (min 1224, max 3170)

## Benchmark запуску CLI

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу та збирання профілів використовують один і той самий harness.

Домовленості щодо збережених результатів:

- `pnpm test:startup:bench:smoke` записує таргетований smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити можна через `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture можна через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проходить інтерактивний майстер через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke для QR-імпорту (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker-рантаймах Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```
