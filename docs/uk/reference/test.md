---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-05-02T15:57:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1e4aec3c056619467bbf51549699cd0387ebb16576e88f91587aab3f382c6c1
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, живі тести, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який завислий процес Gateway, що утримує стандартний контрольний порт, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка модульного покриття завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для рядків/функцій/операторів і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен вихідний файл із розділених доріжок непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених після `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск змінених тестів. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень джерел і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск змінених тестів. Використовуйте його, коли зміна тестового обв'язування/конфігурації/пакета має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні доріжки, спричинені diff щодо `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку змін для diff щодо `origin/main`. Вона запускає typecheck, lint і guard-команди для зачеплених архітектурних доріжок, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped-доріжки Vitest. Запуски без цілі використовують фіксовані групи shard і розгортаються до leaf-конфігів для локального паралельного виконання; група extension завжди розгортається до per-extension shard-конфігів замість одного величезного процесу root-проєкту.
- Запуски тестової обгортки завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, робоча область, каталог агента або сховище auth-profile.
- Допоміжні засоби Process E2E: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E-тесту Vitest потрібні запущений Gateway, CLI-середовище, захоплення логів і очищення в одному місці.
- Допоміжні засоби Docker/Bash E2E: доріжки, що source-ять `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати його за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home скрипти можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Виклики нижчого рівня можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента в контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env-файла. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Доріжки Docker/Bash, які запускають Gateway, можуть source-ити `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для розв'язання entrypoint, запуску mock OpenAI, запуску Gateway у foreground/background, readiness probes, експорту state env, дампів логів і очищення процесів.
- Повні, extension і include-pattern shard-запуски оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні whole-config запуски використовують ці timings, щоб збалансувати повільні й швидкі shard. Include-pattern CI shard-и додають назву shard до timing key, що зберігає видимість відфільтрованих shard timings без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через спеціальні легкі доріжки, які залишають лише `test/setup.ts`, а runtime-heavy випадки лишаються на їхніх наявних доріжках.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім файлом перед поверненням до ширших glob для каталогу. Зміни helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати імпортуючі тести замість широкого запуску кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три спеціальні конфіги (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами статусу/токенів/helper.
- Базовий конфіг Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в конфігах усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shard-и. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard-и; інші групи plugin лишаються батчованими. Використовуйте `pnpm test extensions/<id>` для однієї доріжки bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про import-duration + import-breakdown, водночас усе ще використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених після `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність routed changed-mode шляху порівняно з нативним root-project запуском для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap профілі для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite leaf config Vitest послідовно та записує згруповані дані тривалості разом із per-config JSON/log артефактами. Test Performance Agent використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потрібні API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: Збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image разом із functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для доріжок installer/update/plugin-dependency; ці доріжки монтують попередньо зібраний tarball замість використання скопійованих джерел репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних доріжок функціональності built-app. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball разом із `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lane, image kinds, package/live-image needs, state scenarios і credential checks без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Обмеження heavy lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження provider за замовчуванням становлять одну heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо одна lane перевищує ефективну weight або resource cap на host із низьким parallelism, вона все одно може стартувати з порожнього pool і працюватиме сама, доки не звільнить capacity. Запуски lane за замовчуванням рознесені на 2 секунди, щоб уникнути локальних create storm у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищає застарілі OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, розділяє provider CLI tool caches між сумісними lane, за замовчуванням один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання timings. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об'єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна lane має fallback timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. Команди налаштування CLI backend Docker мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає source E2E container на базі Chromium, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як сфокусовані lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потрібен придатний live model key (наприклад OpenAI у `~/.profile`), завантажується зовнішній image Open WebUI, і очікувати CI-stable поведінку, як у звичайних unit/e2e наборах, не слід.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який створює `openclaw mcp serve`, потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Claude notification assertion читає raw stdio MCP frames безпосередньо, щоб smoke відображав те, що bridge фактично випромінює.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований tarball OpenClaw поверх брудної фікстури старого користувача, запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналу, списки дозволених плагінів, файли робочого простору/сеансу, застарілий стан залежностей legacy-плагінів, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: Типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без live-ключів провайдера або каналу, налаштовує цю базову версію за допомогою вбудованого рецепта команди `openclaw config set`, оновлює це опубліковане встановлення до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані intents, файли робочого простору/сеансу, застаріла конфігурація плагінів і legacy-стан залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або чисто відновлюються. Перевизначте одну базову версію за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` або додайте фікстури сценаріїв за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues містить `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні плагіни OpenClaw встановлюються автоматично під час оновлення. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Запускає harness published-upgrade survivor у сценарії `plugin-deps-cleanup`, що інтенсивно виконує очищення, типово починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розгортає цю лінію з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата й підтверджував очищення залежностей налаштованих плагінів поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає install/update smoke для локального шляху, пакетів `file:`, пакетів npm registry з hoisted залежностями, git moving refs, фікстур ClawHub, оновлень marketplace і Claude-bundle enable/inspect.

## Локальний гейт PR

Для локальних перевірок перед злиттям/гейтом PR запустіть:

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

Вивід містить `sampleCount`, середнє значення, p50, p95, мін./макс., розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілю використовували один і той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний процес холодного старту в чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний runtime-помічник QR завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Живе тестування](/uk/help/testing-live)
- [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)
