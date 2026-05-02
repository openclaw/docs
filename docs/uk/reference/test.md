---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими примусового запуску/покриття
title: Тести
x-i18n:
    generated_at: "2026-05-02T18:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins)

- `pnpm test:force`: завершує будь-який залишковий процес gateway, що утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття модульних тестів для завантажених файлів, а не покриття всіх файлів усього репозиторію. Пороги: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен split-lane вихідний файл непокритим.
- `pnpm test:coverage:changed`: запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий інтелектуальний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних зіставлень джерел і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна test harness/config/package має повертатися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні доріжки, спричинені diff відносно `origin/main`.
- `pnpm check:changed`: запускає інтелектуальний check gate для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних доріжок, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest-доріжки. Запуски без цілей використовують фіксовані групи шардів і розгортаються до листових конфігурацій для локального паралельного виконання; група розширень завжди розгортається до per-extension shard-конфігурацій замість одного великого процесу root-project.
- Запуски тестового wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталлю для кожного шарда.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли process-level E2E тесту Vitest потрібні запущений Gateway, CLI env, захоплення логів і очищення в одному місці.
- Docker/Bash E2E helpers: доріжки, що source `scripts/lib/docker-e2e-image.sh`, можуть передати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це за допомогою `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts можуть передати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Нижчорівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента в контейнері або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Docker/Bash-доріжки, що запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` усередині контейнера для визначення entrypoint, mock OpenAI startup, foreground/background запуску Gateway, readiness probes, експорту state env, дампів логів і очищення процесів.
- Full, extension та include-pattern shard-запуски оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші whole-config запуски використовують ці таймінги, щоб балансувати повільні й швидкі шарди. Include-pattern CI-шарди додають назву шарда до ключа таймінгу, що зберігає видимість таймінгів відфільтрованих шардів без заміни whole-config даних таймінгів. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер проходять через спеціальні легкі доріжки, які залишають лише `test/setup.ts`, залишаючи runtime-heavy випадки на їхніх наявних доріжках.
- Вихідні файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших glob каталогів. Зміни helper під `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які імпортують ці файли, замість широкого запуску кожного шарда, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три спеціальні конфігурації (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами статусу/токенів/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі шарди розширень/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як спеціальні шарди; інші групи plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для однієї доріжки bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту та import-breakdown, і водночас усе ще використовує scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` проводить benchmark routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` проводить benchmark поточного набору змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну full-suite Vitest leaf config і записує згруповані дані тривалості плюс per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести Gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: збирає shared live-test image, пакує OpenClaw один раз як npm tarball, збирає/перевикористовує bare Node/Git runner image плюс functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke-доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency доріжок; ці доріжки монтують попередньо зібраний tarball замість використання скопійованих джерел репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних доріжок функціональності built-app. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker-доріжок містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить план CI, яким керує scheduler, для вибраних доріжок, image kinds, package/live-image needs, state scenarios і credential checks без збирання чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Ліміти важких доріжок за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ліміти провайдерів за замовчуванням становлять одну важку доріжку на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо одна доріжка перевищує ефективний weight або resource cap на хості з низьким parallelism, вона все одно може стартувати з порожнього pool і працюватиме сама, доки не звільнить capacity. Запуски доріжок за замовчуванням рознесені на 2 секунди, щоб уникнути локальних Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищає застарілі OpenClaw E2E контейнери, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між сумісними доріжками, за замовчуванням один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги доріжок у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у пізніших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local доріжок або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider доріжок; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна доріжка має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail доріжки використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні доріжки, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots включають link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні `:resume` і `:mcp` aliases.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), завантажує зовнішній Open WebUI image і не очікується таким самим CI-stable, як звичайні unit/e2e suites.
- `pnpm test:docker:mcp-channels`: запускає seeded Gateway container і другий client container, який створює `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через справжній stdio bridge. Claude notification assertion читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, виконує оновлення пакета плюс неінтерактивний doctor без ключів живого провайдера або каналу, потім запускає Gateway на loopback і перевіряє, що агенти, конфігурація каналу, allowlist-и Plugin, файли робочого простору/сесії, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: За замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача без ключів живого провайдера або каналу, налаштовує цю базову лінію вбудованим рецептом команди `openclaw config set`, оновлює це опубліковане встановлення до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway на loopback і перевіряє, що налаштовані наміри, файли робочого простору/сесії, застаріла конфігурація Plugin і стан legacy-залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно ремонтуються. Перевизначте одну базову лінію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, або додайте фікстури сценаріїв через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набір reported-issues включає `configured-plugin-installs`, щоб перевірити, що налаштовані зовнішні plugins OpenClaw автоматично встановлюються під час оновлення. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Запускає published-upgrade survivor harness у сценарії `plugin-deps-cleanup`, який інтенсивно виконує очищення, за замовчуванням починаючи з `openclaw@2026.4.23`. Окремий workflow `Update Migration` розширює цю лінію за допомогою `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та підтверджував очищення залежностей налаштованих Plugin поза Full Release CI.
- `pnpm test:docker:plugins`: Запускає install/update smoke для локального шляху, `file:`, пакетів npm registry з hoisted-залежностями, рухомих git ref-ів, фікстур ClawHub, оновлень marketplace і ввімкнення/інспектування Claude-bundle.

## Локальна перевірка PR

Для локальних перевірок злиття/гейту PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Сценарій: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий промпт: “Відповідай одним словом: ok. Без пунктуації чи додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279 мс (мін. 1114, макс. 2431)
- opus медіана 2454 мс (мін. 1224, макс. 3170)

## Бенчмарк запуску CLI

Сценарій: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і підсумки максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й збирання профілів використовували один і той самий стенд.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий артефакт швидкої перевірки в `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## E2E-онбординг (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих швидких тестів онбордингу.

Повний потік холодного запуску в чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей сценарій керує інтерактивним майстром через псевдо-tty, перевіряє файли конфігурації/робочого простору/сесії, потім запускає Gateway і виконує `openclaw health`.

## Швидка перевірка імпорту QR (Docker)

Переконується, що підтримуваний runtime-помічник QR завантажується в підтримуваних runtime Docker Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Живе тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
