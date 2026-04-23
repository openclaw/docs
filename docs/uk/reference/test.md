---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T21:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6b9c765c8a6a3ad668626e0787a9a94bcb250d2627594ef960ab024f229e8ca
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували з уже запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає unit-сьют з покриттям V8 (через `vitest.unit.config.ts`). Це поріг покриття завантажених unit-файлів, а не покриття всіх файлів у всьому репозиторії. Пороги: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, поріг вимірює файли, завантажені unit-сьютом покриття, замість того щоб вважати всі файли split-lane source непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lanes, коли diff торкається лише routable source/test-файлів. Зміни config/setup, як і раніше, використовують запасний варіант — native root projects run — щоб зміни wiring, де потрібно, повторно запускалися ширше.
- `pnpm changed:lanes`: показує архітектурні lanes, які запускає diff відносно `origin/main`.
- `pnpm check:changed`: запускає smart changed gate для diff відносно `origin/main`. Він запускає core-роботу з core test lanes, extension-роботу з extension test lanes, роботу лише з тестами — лише з test typecheck/tests, розширює зміни в public Plugin SDK або plugin-contract до перевірки extension і залишає зміни лише в release metadata та version bump на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі file/directory через scoped Vitest lanes. Запуски без конкретної цілі використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard-конфігурацій для кожного extension окремо, а не до одного гігантського root-project процесу.
- Повні та shard-запуски extension оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; подальші запуски використовують ці таймінги, щоб балансувати повільні та швидкі shards. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані test-файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які залишають лише `test/setup.ts`, тоді як важкі runtime-кейси залишаються на своїх наявних lanes.
- Вибрані source helper-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling-тестами в цих легких lanes, тож малі зміни helper не змушують повторно запускати важкі runtime-backed сьюти.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний runner без ізоляції увімкнено по всіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shards extension/plugin. Важкі channel extensions і OpenAI працюють як окремі shards; інші групи extension залишаються об’єднаними. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого Plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту та import-breakdown, при цьому зберігаючи scoped lane routing для явних цілей file/directory.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed changed-mode path з native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf-конфігурацію Vitest для повного набору і записує згруповані дані тривалості плюс JSON/log-артефакти для кожної конфігурації. Агент продуктивності тестів використовує це як базову лінію перед спробами виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає end-to-end smoke-тести gateway (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивними worker у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API keys і `LIVE=1` (або специфічних для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ live-test і образ Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`, типово з паралелізмом 4. Налаштовуйте через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lanes, чутливі до старту або провайдера, запускаються ексклюзивно після паралельного пулу. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), витягує зовнішній образ Open WebUI і не очікується, що буде настільки ж стабільним для CI, як звичайні unit/e2e сьюти.
- `pnpm test:docker:mcp-channels`: запускає seeded Gateway container і другий client container, який стартує `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані вкладень, поведінку live event queue, outbound send routing і сповіщення у стилі Claude про channel + permission через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, тож smoke відображає те, що bridge фактично передає.

## Локальний PR gate

Для локальних перевірок land/gate PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-збої на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Набори пресетів:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва пресети

Вивід включає `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, тож захоплення таймінгів і профілів використовує той самий harness.

Домовленості щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline-fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити: `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized onboarding smoke-тестів.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Переконується, що підтримуваний helper QR runtime завантажується в підтримуваних Docker Node runtime (типово Node 24, сумісність із Node 22):

```bash
pnpm test:docker:qr
```
