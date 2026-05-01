---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-01T22:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3dddc0a772a422264f52096a43c601897fa0109c600f26d45274409fe26c5184
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugins](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, що утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття модульних тестів для завантажених файлів, а не покриття всіх файлів усього репозиторію. Пороги становлять 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен вихідний файл із розділених lane непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень із вихідним кодом і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового harness/конфігурації/пакета має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні lane, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний check gate для змін у diff відносно `origin/main`. Він виконує typecheck, lint і guard-команди для зачеплених архітектурних lane, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lane. Запуски без цілей використовують фіксовані групи shard і розгортаються в leaf configs для локального паралельного виконання; група extension завжди розгортається в shard-конфіги для кожного extension замість одного величезного процесу кореневого проєкту.
- Запуски тестового wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, фікстура конфігурації, робочий простір, каталог агента або сховище auth-profile.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E-тест Vitest потребує запущеного Gateway, середовища CLI, захоплення логів і очищення в одному місці.
- Docker/Bash E2E helpers: lane, які підключають `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його через `scripts/lib/openclaw-e2e-instance.sh`; multi-home скрипти можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Нижчерівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим runtime Node трактувати `--env-file` як прапорець Node. Docker/Bash lane, які запускають Gateway, можуть підключати `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для визначення entrypoint, запуску mock OpenAI, foreground/background запуску Gateway, readiness probes, експорту state env, дампів логів і очищення процесів.
- Запуски shard для повного набору, extension і include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; подальші whole-config запуски використовують ці таймінги, щоб балансувати повільні й швидкі shard. Include-pattern CI shards додають назву shard до ключа таймінгу, що залишає таймінги відфільтрованих shard видимими без заміни whole-config даних таймінгів. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через спеціальні легкі lane, які залишають лише `test/setup.ts`, а runtime-heavy випадки лишаються на своїх наявних lane.
- Вихідні файли із сусідніми тестами спершу зіставляються з цим сусіднім тестом, а вже потім переходять до ширших glob для каталогу. Зміни helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділяється на три спеціальні конфіги (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами status/token/helper.
- Базовий конфіг Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігах по всьому репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як спеціальні shard; інші групи plugin лишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для lane одного bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів і розбивку імпортів, водночас далі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркить routed changed-mode path проти native root-project run для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite leaf config Vitest послідовно й записує згруповані дані тривалості разом із JSON/log артефактами для кожного конфіга. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести provider (minimax/zai). Потребує API keys і `LIVE=1` (або специфічного для provider `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: Збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image і functional image, що встановлює цей tarball у `/app`, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane installer/update/plugin-dependency; ці lane монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lane функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lane розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner розміщена в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lane, типів image, потреб package/live-image, state scenarios і credential checks без збирання чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Caps для важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; caps для provider за замовчуванням дають по одному heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо один lane перевищує ефективний weight або resource cap на хості з низьким паралелізмом, він усе одно може стартувати з порожнього pool і працюватиме сам, доки не звільнить capacity. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникати локальних Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищає застарілі OpenClaw E2E контейнери, виводить active-lane status кожні 30 секунд, спільно використовує кеші provider CLI tool між сумісними lane, за замовчуванням один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lane; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lane в один longest-first pool, щоб provider buckets могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lane, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає source E2E container на базі Chromium, запускає raw CDP разом з ізольованим Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), тягне зовнішній Open WebUI image і не очікується як CI-stable на рівні звичайних unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який породжує `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, поведінку live event queue, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Claude notification assertion читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований tarball OpenClaw поверх «брудної» фікстури старого користувача, запускає оновлення пакета разом із неінтерактивним doctor без live-ключів провайдера або каналу, потім запускає Gateway зі зворотним зв’язком і перевіряє, що агенти, конфігурація каналу, списки дозволених Plugin, файли робочого простору/сесії, застарілий стан залежностей Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: Типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без live-ключів провайдера або каналу, налаштовує цю базову версію за допомогою вбудованого рецепта команди `openclaw config set`, оновлює це опубліковане встановлення до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway зі зворотним зв’язком і перевіряє, що налаштовані наміри, файли робочого простору/сесії, застаріла конфігурація Plugin і застарілий стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно відновлюються. Перевизначте одну базову версію за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` або додайте фікстури сценаріїв за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.

## Локальна перевірка PR

Для локальних перевірок перед злиттям/пропусканням PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкове середовище: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний промпт: “Відповідай одним словом: ok. Без пунктуації чи додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279 мс (мін. 1114, макс. 2431)
- opus медіана 2454 мс (мін. 1224, макс. 3170)

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

Вивід містить `sampleCount`, середнє значення, p50, p95, мін./макс., розподіл кодів виходу/сигналів і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілів використовували один і той самий harness.

Умовні правила збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через псевдо-TTY, перевіряє файли конфігурації/робочого простору/сесії, а потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Перевіряє, що підтримуваний runtime-помічник QR завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
