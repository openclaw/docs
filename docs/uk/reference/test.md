---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-02T02:01:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакета Plugin: [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, що утримує типовий контрольний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття модулів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для рядків/функцій/операторів і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен вихідний файл із розділених смуг непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий інтелектуальний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень вихідних файлів і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна тестового каркаса/конфігурації/пакета має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні смуги, активовані diff проти `origin/main`.
- `pnpm check:changed`: запускає інтелектуальну перевірку змін для diff проти `origin/main`. Вона запускає typecheck, lint і захисні команди для зачеплених архітектурних смуг, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped-смуги Vitest. Запуски без цілей використовують фіксовані групи шардів і розгортаються до leaf-конфігів для локального паралельного виконання; група розширень завжди розгортається до per-extension shard configs замість одного величезного root-project процесу.
- Запуски тестового wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного шарда.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store.
- Допоміжні засоби Process E2E: використовуйте `test/helpers/openclaw-test-instance.ts`, коли процесному E2E-тесту Vitest потрібні запущений Gateway, CLI env, захоплення логів і cleanup в одному місці.
- Допоміжні засоби Docker/Bash E2E: смуги, що source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Нижчерівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента в контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Смуги Docker/Bash, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для визначення entrypoint, запуску mock OpenAI, запуску Gateway у foreground/background, readiness probes, експорту state env, dumps логів і cleanup процесів.
- Запуски повного набору, розширень і include-pattern шардів оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; подальші whole-config запуски використовують ці timings, щоб балансувати повільні й швидкі шарди. Include-pattern CI shards додають назву шарда до timing key, що зберігає видимість відфільтрованих shard timings без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через dedicated light lanes, які залишають тільки `test/setup.ts`, залишаючи runtime-heavy cases на їхніх наявних смугах.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших glob каталогів. Зміни helpers у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість broad-running кожного шарда, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три dedicated configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами статусу/токенів/helpers.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі шарди розширень/Plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як dedicated shards; інші групи plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для однієї bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас зберігаючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для основного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite Vitest leaf config послідовно й записує grouped duration data разом із per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для verbose logs.
- `pnpm test:live`: Запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для unskip.
- `pnpm test:docker:all`: Збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, що встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці смуги монтують prebuilt tarball замість використання copied repo sources. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для normal built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball разом із `dist/postinstall-inventory.json` перед тим, як Docker його споживає. Визначення Docker lanes розташовані в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic розташована в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Heavy lane caps за замовчуванням дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps за замовчуванням становлять одну heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо одна lane перевищує effective weight або resource cap на low-parallelism host, вона все одно може стартувати з empty pool і працюватиме сама, доки не звільнить capacity. Старти lanes за замовчуванням рознесені на 2 секунди, щоб уникати local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням preflights Docker, очищає stale OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між сумісними lanes, повторює transient live-provider failures один раз за замовчуванням (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути timing reuse. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першого failure, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна lane має 120-minute fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. Команди CLI backend Docker setup мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути slow lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати cheap targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls зовнішній Open WebUI image і не очікується як CI-stable подібно до звичайних unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який spawns `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Твердження Claude notification читає raw stdio MCP frames напряму, тому smoke відображає те, що bridge фактично emits.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх забрудненого фікстурного середовища старого користувача, запускає оновлення пакета та неінтерактивний doctor без живих ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналу, списки дозволених plugin, файли робочого простору/сеансу, застарілий стан залежностей legacy plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням установлює `openclaw@latest`, додає реалістичні файли наявного користувача без живих ключів провайдера або каналу, налаштовує цей базовий стан за допомогою вбудованого рецепта команди `openclaw config set`, оновлює цю опубліковану інсталяцію до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані наміри, файли робочого простору/сеансу, застаріла конфігурація plugin і legacy-стан залежностей, запуск, `/healthz`, `/readyz` та статус RPC зберігаються або коректно відновлюються. Перевизначте один базовий стан за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` або додайте фікстури сценаріїв за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Приймання пакета надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Запускає тестовий стенд published-upgrade survivor у сценарії `plugin-deps-cleanup`, що активно виконує очищення, починаючи за замовчуванням з `openclaw@2026.4.23`. Окремий workflow Міграція оновлення розгортає цю лінію з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та підтверджував очищення залежностей налаштованих plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає smoke-тест установлення/оновлення для локального шляху, пакетів `file:`, пакетів npm registry з піднятими залежностями, рухомих git-посилань, фікстур ClawHub, оновлень marketplace і ввімкнення/інспекції Claude-bundle.

## Локальна перевірка PR

Для локальних перевірок land/gate PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-збій на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без пунктуації чи додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279ms (мін. 1114, макс. 2431)
- opus медіана 2454ms (мін. 1224, макс. 3170)

## Бенчмарк старту CLI

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

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу й захоплення профілю використовували той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює checked-in baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Checked-in fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити за допомогою `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Переконується, що підтримуваний runtime helper для QR завантажується в підтримуваних Docker Node runtimes (Node 24 типовий, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
