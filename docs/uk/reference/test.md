---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T23:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1224c2c0fc4b96a6631ba238e4e9b13ed61e918282db393df7a9db93b3fbf8cf
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, який утримує типовий порт керування, а потім запускає повну сьюту Vitest з ізольованим портом Gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає unit-сьюту з покриттям V8 (через `vitest.unit.config.ts`). Це перевірка unit-покриття для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Порогові значення становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені unit-сьютою покриття, замість того щоб вважати кожен файл вихідного коду з розділених lane-ів непокритим.
- `pnpm test:coverage:changed`: запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped lane-и Vitest, коли diff торкається лише routable-файлів коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root-проєктів, щоб за потреби зміни wiring перевиконувалися ширше.
- `pnpm changed:lanes`: показує архітектурні lane-и, запущені diff-ом відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку зміненого diff-а відносно `origin/main`. Вона запускає core-роботу разом із core test lane-ами, роботу extension — разом із extension test lane-ами, test-only зміни — лише з test typecheck/tests, розширює зміни в публічному Plugin SDK або plugin-contract до одного проходу перевірки extension, а для version bump-ів лише в release metadata зберігає цільові перевірки version/config/root-dependency.
- `pnpm test`: спрямовує явні цілі файлів/директорій через scoped lane-и Vitest. Запуски без цілі використовують фіксовані групи shard-ів і розгортаються до leaf-конфігів для локального паралельного виконання; група extension завжди розгортається до shard-конфігів для кожного extension окремо, а не до одного великого root-project процесу.
- Повні запуски та запуски shard-ів extension оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги для балансування повільних і швидких shard-ів. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через спеціальні легкі lane-и, які зберігають лише `test/setup.ts`, залишаючи runtime-важкі кейси на їхніх наявних lane-ах.
- Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane-ах, щоб невеликі зміни helper-ів не перезапускали важкі сьюти, які залежать від runtime.
- `auto-reply` тепер також поділяється на три спеціальні конфіги (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігах усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard-и; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane-а bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/директорій.
- `pnpm test:perf:imports:changed`: той самий профайлінг імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркує routed changed-mode шлях проти нативного запуску root-project для того самого зафіксованого git diff-а.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркує поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf-конфіг Vitest із повної suite і записує згруповані дані тривалості разом із JSON/log-артефактами для кожного конфіга. Агент продуктивності тестів використовує це як базову точку перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести Gateway (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або провайдер-специфічного `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і Docker E2E-образ, а потім запускає Docker smoke lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1` із concurrency 4 за замовчуванням. Налаштовуйте через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові pooled lane-и після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Чутливі до запуску або провайдера lane-и запускаються ексклюзивно після паралельного пулу. Логи для кожного lane-а записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не розрахований на CI-стабільність, як звичайні unit/e2e-сьюти.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із попереднім наповненням і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення routed conversations, читання transcript-ів, metadata вкладень, поведінку черги live-подій, outbound send routing і сповіщення про channel + permissions у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke відображав те, що міст реально надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям/гейтом PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` флейкиться на навантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженнями пам’яті використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без пунктуації або додаткового тексту.”

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

Пресети:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва пресети

Вивід включає `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу й захоплення профілів використовували один і той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повної suite у `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline-фікстур у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Фікстур, зафіксований у репозиторії:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстуром через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний helper QR runtime завантажується у підтримуваних Docker runtime Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```
