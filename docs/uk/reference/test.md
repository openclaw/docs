---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими примусового запуску/покриття
title: Тести
x-i18n:
    generated_at: "2026-04-30T23:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: de18ac7d822055ee34885e5e897eff0fe7dde57c945a6b7f2c4bb2a29445c859
    source_path: reference/test.md
    workflow: 16
---

- Повний комплект для тестування (набори, тести з живими сервісами, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який залишковий процес Gateway, що утримує стандартний контрольний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає модульний набір з покриттям V8 (через `vitest.unit.config.ts`). Це гейт модульного покриття завантажених файлів, а не покриття всіх файлів усього репозиторію. Пороги становлять 70% для рядків/функцій/операторів і 55% для гілок. Оскільки `coverage.all` має значення false, гейт вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен файл вихідного коду split-lane непокритим.
- `pnpm test:coverage:changed`: запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий інтелектуальний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідного коду та локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового каркаса/конфігурації/пакета має повернутися до ширшої поведінки Vitest для changed-test.
- `pnpm changed:lanes`: показує архітектурні lanes, спричинені diff відносно `origin/main`.
- `pnpm check:changed`: запускає інтелектуальний гейт перевірки змін для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes. Ненацілені запуски використовують фіксовані shard-групи та розгортаються до leaf-конфігів для локального паралельного виконання; група розширень завжди розгортається до per-extension shard-конфігів замість одного великого процесу root-project.
- Запуски тестового wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією по shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібен ізольований `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture конфігурації, workspace, каталог агента або сховище auth-profile.
- Допоміжні засоби Process E2E: використовуйте `test/helpers/openclaw-test-instance.ts`, коли процесному E2E-тесту Vitest потрібні запущений Gateway, CLI env, захоплення логів і cleanup в одному місці.
- Допоміжні засоби Docker/Bash E2E: lanes, що підключають `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable env-файла хоста. `--` перед `create` не дає новішим runtime Node трактувати `--env-file` як прапорець Node. Docker/Bash lanes, що запускають Gateway, можуть підключити `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для визначення entrypoint, запуску mock OpenAI, foreground/background запуску Gateway, readiness probes, експорту state env, дампів логів і cleanup процесів.
- Повні, extension та include-pattern shard-запуски оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші whole-config запуски використовують ці таймінги для балансування повільних і швидких shards. Include-pattern CI shards додають назву shard до ключа таймінгу, що зберігає видимість таймінгів filtered shard без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через виділені легкі lanes, які залишають тільки `test/setup.ts`, залишаючи runtime-heavy випадки на їхніх наявних lanes.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших glob каталогів. Зміни helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів для запуску тестів-імпортерів замість broad-running кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три виділені конфіги (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами статусу/токенів/helper.
- Базовий конфіг Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігах репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як виділені shards; інші групи plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite Vitest leaf config послідовно й записує згруповані дані тривалості плюс per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправлень повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає end-to-end smoke-тести gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live tests provider (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб прибрати skip.
- `pnpm test:docker:all`: збирає спільний образ live-test, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, що встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lanes функціональності built-app. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його споживає. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner розміщена в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Ліміти heavy lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ліміти provider за замовчуванням дозволяють один heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо один lane перевищує effective weight або resource cap на low-parallelism host, він усе одно може стартувати з порожнього pool і виконуватиметься сам, доки не звільнить capacity. Запуски lanes за замовчуванням рознесені на 2 секунди, щоб уникнути local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищає застарілі OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між сумісними lanes, один раз за замовчуванням повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у пізніших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати status output, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. Команди CLI backend Docker setup мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб перевірити slow lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: збирає source E2E container на Chromium, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як сфокусовані lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується, що буде CI-stable, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: запускає seeded Gateway container і другий client container, який породжує `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Assertion сповіщення Claude читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований tarball OpenClaw поверх забрудненого фікстура старого користувача, запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера чи каналів, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналів, списки дозволених плагінів, файли робочого простору/сесії, застарілий стан runtime-deps плагінів, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням встановлює `openclaw@latest` поверх забрудненого фікстура старого користувача, оновлює це опубліковане встановлення до запакованого tarball OpenClaw, а потім запускає ті самі перевірки doctor, запуску Gateway і збереження RPC. Перевизначте базову версію за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`.

## Локальний PR-гейт

Для локальних перевірок land/gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий промпт: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та захоплення профілю використовували однаковий стенд.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` із `runs=5` та `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json` із `runs=5` та `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів онбордингу.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли конфігурації/робочого простору/сесії, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест QR-імпорту (Docker)

Гарантує, що підтримуваний допоміжний модуль QR runtime завантажується в підтримуваних Docker-середовищах виконання Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
