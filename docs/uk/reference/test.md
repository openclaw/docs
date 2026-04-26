---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T22:14:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 676abe8e753d49719f3bc333680e50e0a0ec9f82c5c85b5ef7c1ec55452f10ed
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це поріг unit-покриття для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Порогові значення: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати кожен файл вихідного коду в розбитих lane непокритим.
- `pnpm test:coverage:changed`: запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені шляхи git у scoped lane Vitest, коли diff зачіпає лише маршрутизовані файли коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску кореневих проєктів, щоб зміни в підключенні повторно широко запускали перевірки, коли це потрібно.
- `pnpm test:changed:focused`: запуск змінених тестів для внутрішнього циклу. Запускає лише точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального графа імпортів. Широкі зміни/config/package пропускаються замість розгортання до повного fallback-запуску changed-test.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff-ом відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи з lane тестів core, роботу extensions з lane тестів extensions, зміни лише в тестах — тільки з typecheck/tests тестів, розгортає зміни в публічному Plugin SDK або plugin-contract до одного проходу валідації extension і залишає підвищення версій лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілей використовують фіксовані групи shard і розгортаються до leaf config для локального паралельного виконання; група extensions завжди розгортається до shard config окремих extension/plugin замість одного великого процесу root-project.
- Запуски shard для повного набору, extensions і include-pattern оновлюють локальні дані часу виконання в `.artifacts/vitest-shard-timings.json`; подальші запуски всієї конфігурації використовують ці дані для балансування повільних і швидких shard. Shard CI з include-pattern додають назву shard до ключа часу, що зберігає видимість часів відфільтрованих shard без заміни даних часу повної конфігурації. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які залишають лише `test/setup.ts`, а важкі випадки runtime залишаються у своїх наявних lane.
- Вихідні файли із сусідніми тестами зіставляються із цим сусіднім тестом перед fallback до ширших directory glob. Зміни helper у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів, щоб запускати тести, які імпортують ці файли, замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розділяється на три окремі config (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, із увімкненим спільним неізольованим runner у всіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extensions/plugin. Важкі channel plugin, browser plugin та OpenAI запускаються як окремі shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного bundled lane plugin.
- `pnpm test:perf:imports`: вмикає звіти Vitest про тривалість імпорту та import-breakdown, при цьому все ще використовуючи маршрутизацію scoped lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: порівнює шлях routed changed-mode з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree`: порівнює поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest повного набору і записує згруповані дані тривалості разом з JSON/log-артефактами для кожної config. Агент Test Performance використовує це як базову лінію перед спробами виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести Gateway (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів встановіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: збирає спільний образ live-тестів, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує базовий образ runner на Node/Git та функціональний образ, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane installer/update/plugin-dependency; ці lane монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lane функціональності зібраного застосунку. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує пулом tail, чутливим до провайдерів, і типово дорівнює 10. Обмеження важких lane типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів типово задають один важкий lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для потужніших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуски lane типово розтягуються на 2 секунди, щоб уникнути шторму створення в локальному Docker daemon; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить стан активних lane кожні 30 секунд, ділиться кешами CLI-інструментів провайдерів між сумісними lane, один раз повторює тимчасові збої live-провайдерів за замовчуванням (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає часи lane в `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виведення стану або `OPENCLAW_DOCKER_ALL_TIMINGS=0` для вимкнення повторного використання часових даних. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-провайдерів; псевдоніми пакетів — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує main і tail live lane в один пул longest-first, щоб кошики провайдерів могли спільно пакувати роботу Claude, Codex і Gemini. Runner припиняє планування нових pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші обмеження на рівні lane. Команди налаштування Docker для бекенду CLI мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи кожного lane та фазові часи `summary.json` записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: збирає контейнер source E2E на основі Chromium, запускає raw CDP та ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP містять URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Live Docker probes бекенду CLI можна запускати як цільові lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потребує придатний ключ live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як стабільний для CI, на відміну від звичайних наборів unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із підготовленими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідних відправлень і сповіщення про channel + дозволи в стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke-тест відображав те, що міст фактично надсилає.

## Локальний PR gate

Для локальних перевірок land/gate PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний результат на завантаженому хості, перезапустіть один раз перед тим, як вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279ms (мін. 1114, макс. 2431)
- opus медіана 2454ms (мін. 1224, макс. 3170)

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

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та збір профілів використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити через `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start потік у чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний допоміжний runtime-компонент QR завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
