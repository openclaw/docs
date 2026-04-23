---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T19:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 078ba2d49ffc117b5069304113ab4b08d734ced76f8e0ac491e79375d6f3fde4
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує всі завислі процеси gateway, які утримують стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Це поріг unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка оцінює файли, завантажені набором unit coverage, замість того щоб вважати всі файли вихідного коду в розділених lane непокритими.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lanes, коли diff зачіпає лише routable файли вихідного коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root projects, щоб за потреби зміни wiring перезапускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lanes, які запускаються для diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботу разом із core test lanes, роботу extensions — разом із extension test lanes, зміни лише в тестах — тільки з перевіркою типів тестів/самими тестами, розширює зміни публічного Plugin SDK або plugin-contract до валідації extensions і залишає підвищення версій лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без явної цілі використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extensions завжди розгортається до per-extension shard configs, а не до одного великого процесу root-project.
- Повні запуски та запуски extension shard оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги, щоб балансувати повільні й швидкі shards. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які залишають лише `test/setup.ts`, а ресурсоємні runtime-випадки — у їхніх наявних lanes.
- Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lanes, тож невеликі зміни helper-файлів не змушують повторно запускати важкі набори з runtime.
- `auto-reply` тепер також розділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими тестами top-level для status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shards extensions/plugins. Важкі channel extensions і OpenAI виконуються як окремі shards; інші групи extensions залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звіти Vitest про тривалість імпорту та деталізацію імпорту, водночас зберігаючи маршрутизацію через scoped lanes для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює продуктивність маршрутизованого шляху changed-mode з нативним запуском root-project для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf-конфігурацію Vitest для повного набору й записує згруповані дані про тривалість разом з JSON/лог-артефактами для кожної конфігурації. Агент Test Performance використовує це як базову лінію перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (парування кількох екземплярів WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або провайдер-специфічний `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: один раз збирає спільний образ live-test і образ Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` і типовим рівнем паралелізму 4. Налаштовується через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові lanes у пулі після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має тайм-аут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lanes, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із підготовленими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень, поведінку черги live events, маршрутизацію вихідного надсилання, а також channel- і permission-сповіщення в стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke-тест відображав те, що міст насправді надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` флейкає на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 прогонів):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва presets

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного прогону, тож вимірювання часу та збирання профілів використовують один і той самий harness.

Узгоджені правила для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований fixture у репозиторії:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## Наскрізне тестування онбордингу (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів онбордингу.

Повний cold-start сценарій у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проходить інтерактивний майстер через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних середовищах виконання Docker Node (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```
