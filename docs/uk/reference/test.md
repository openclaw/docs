---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-25T00:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91009b51cee872f542a9aed0f882359c763cfb88722860eb8ef7deae434a89e7
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (с’юти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який gateway process, що залишився і тримає стандартний control port, а потім запускає повний набір Vitest з ізольованим port gateway, щоб server-тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим port 18789.
- `pnpm test:coverage`: Запускає unit-набір із V8 coverage (через `vitest.unit.config.ts`). Це gate unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен source file із розділених lane-ів непокритим.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git paths у scoped Vitest lanes, коли diff зачіпає лише routable source/test files. Зміни config/setup і далі переходять до нативного запуску root projects, щоб зміни wiring за потреби повторно запускали ширший набір перевірок.
- `pnpm changed:lanes`: показує архітектурні lanes, що спрацьовують для diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний changed gate для diff відносно `origin/main`. Він запускає роботу core разом із core test lanes, роботу extension — з extension test lanes, зміни лише в тестах — лише з test typecheck/tests, розширює зміни в публічному Plugin SDK або plugin-contract до одного проходу валідації extension і залишає підвищення версії лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явно вказані цілі file/directory через scoped Vitest lanes. Запуски без цілей використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для окремих extension, а не до одного гігантського процесу root-project.
- Повні запуски і запуски shard-ів extension оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги, щоб балансувати повільні й швидкі shard-и. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані test files `plugin-sdk` і `commands` тепер маршрутизуються через спеціальні легкі lanes, які залишають лише `test/setup.ts`, а випадки з важчим runtime залишаються у своїх наявних lanes.
- Вибрані helper source files `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми tests у цих легких lanes, щоб невеликі зміни helper-ів не спричиняли повторний запуск важких наборів, що залежать від runtime.
- `auto-reply` тепер також розділяється на три окремі configs (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими tests верхнього рівня для status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усьому наборі configs репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel plugins, plugin browser і OpenAI запускаються як окремі shard-и; інші групи plugin-ів залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпортів і import-breakdown, при цьому й надалі використовує scoped lane routing для явно вказаних цілей file/directory.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює у режимі benchmark маршрутизований шлях changed-mode з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює у режимі benchmark поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config Vitest для повного набору і записує згруповані дані тривалості плюс JSON/log-артефакти для кожного config. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke-тести (pairing multi-instance WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести provider-ів (minimax/zai). Потрібні API keys і `LIVE=1` (або специфічне для provider `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: Один раз збирає спільний live-test image і Docker E2E image, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений scheduler. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами process і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до provider, і також за замовчуванням дорівнює 10. Обмеження для важких lanes за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Запуски lanes за замовчуванням зсуваються на 2 секунди, щоб уникнути локальних сплесків create-операцій Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight для Docker, очищає застарілі OpenClaw E2E containers, виводить status активних lanes кожні 30 секунд і зберігає таймінги lanes у `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест lanes без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу status, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Runner припиняє планування нових pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші обмеження для кожного lane. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній image Open WebUI і не вважається настільки стабільним для CI, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, metadata вкладень, поведінку live event queue, маршрутизацію вихідного надсилання та сповіщення про channel + permissions у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke відображав те, що міст реально надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям PR/gate запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flake на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженнями пам’яті використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt за замовчуванням: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- median для minimax: 1279ms (мін. 1114, макс. 2431)
- median для opus: 2454ms (мін. 1224, макс. 3170)

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, щоб вимірювання часу й збирання profile використовували той самий harness.

Домовленості щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з параметрами `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з параметрами `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## E2E онбордингу (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів онбордингу.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проводить інтерактивний wizard через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний helper QR runtime завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
