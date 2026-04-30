---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-30T18:11:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який залишковий процес Gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття модульних тестів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Пороги: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, ця перевірка вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен файл вихідного коду з розділених lane непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів за змінами. Він запускає точні цілі з прямих редагувань тестів, сусідніх файлів `*.test.ts`, явних відповідностей вихідного коду та локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не відповідають точним тестам.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів за змінами. Використовуйте його, коли редагування тестового harness/конфігурації/пакета має повернутися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні lane, спричинені diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку змін для diff відносно `origin/main`. Вона запускає typecheck, lint і guard-команди для зачеплених архітектурних lane, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілі використовують фіксовані групи shard і розгортаються до leaf-конфігів для локального паралельного виконання; група extension завжди розгортається до shard-конфігів для кожного extension замість одного величезного процесу root-project.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталлю для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, фікстура конфігурації, робоча область, каталог агента або сховище auth-profile.
- Помічники E2E для процесів: використовуйте `test/helpers/openclaw-test-instance.ts`, коли процесному E2E-тесту Vitest потрібні запущений Gateway, середовище CLI, захоплення логів і очищення в одному місці.
- Помічники E2E для Docker/Bash: lane, що підключають `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це за допомогою `scripts/lib/openclaw-e2e-instance.sh`; скрипти з кількома home можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному потоці. Нижчерівневі викликачі можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable env-файла хоста. `--` перед `create` не дає новішим середовищам виконання Node трактувати `--env-file` як прапорець Node. Lane Docker/Bash, що запускають Gateway, можуть підключати `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для визначення entrypoint, запуску mock OpenAI, запуску Gateway у foreground/background, readiness-проб, експорту env стану, дампів логів і очищення процесів.
- Запуски shard для повного набору, extension і include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші запуски всієї конфігурації використовують ці таймінги, щоб балансувати повільні й швидкі shard. Shard CI з include-pattern додають назву shard до ключа таймінгу, що зберігає таймінги відфільтрованих shard видимими без заміни даних таймінгів усієї конфігурації. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через спеціальні легкі lane, які залишають лише `test/setup.ts`, а runtime-важкі випадки залишаються на своїх наявних lane.
- Вихідні файли із сусідніми тестами спершу зіставляються із цим сусіднім тестом, перш ніж відступити до ширших glob каталогу. Редагування помічників у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три спеціальні конфіги (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими тестами верхнього рівня для status/token/helper.
- Базовий конфіг Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним неізольованим runner, увімкненим у конфігах репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/Plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як спеціальні shard; інші групи plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для однієї lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів і розбивку імпортів, усе ще використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточний набір змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен leaf config Vitest з повного набору послідовно й записує згруповані дані тривалості плюс JSON/log артефакти для кожного config. Test Performance Agent використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає end-to-end smoke-тести Gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивними workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: Збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane installer/update/plugin-dependency; ці lane монтують попередньо зібраний tarball замість використання скопійованих вихідних файлів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lane функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` є єдиним локальним/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його споживає. Визначення lane Docker живуть у `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner живе в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lane, типів image, потреб package/live-image, state scenarios і перевірок credentials без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням дорівнює 10. Обмеження heavy lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps за замовчуванням становлять одну heavy lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Якщо одна lane перевищує effective weight або resource cap на хості з низьким parallelism, вона все одно може стартувати з порожнього pool і виконуватиметься сама, доки не звільнить capacity. Старти lane за замовчуванням рознесені на 2 секунди, щоб уникати create storms локального Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищує застарілі контейнери OpenClaw E2E, виводить статус active-lane кожні 30 секунд, спільно використовує provider CLI tool caches між сумісними lane, за замовчуванням один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lane у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lane; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lane в один longest-first pool, щоб provider buckets могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові pooled lane після першого failure, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожна lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші per-lane caps. Команди налаштування Docker для CLI backend мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються під `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lane, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- Live Docker probes для CLI backend можна запускати як focused lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні alias `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає справжній proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), завантажує зовнішній Open WebUI image і не очікується як CI-stable на рівні звичайних unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який породжує `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, поведінку live event queue, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Твердження Claude notification читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично випромінює.
- `pnpm test:docker:upgrade-survivor`: Встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача, запускає оновлення пакета й неінтерактивний doctor без ключів реального провайдера або каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналу, allowlist-и plugin, файли workspace/session, застарілий стан runtime-deps plugin, запуск і статус RPC зберігаються.

## Локальна перевірка запиту на злиття

Для локальних перевірок перед злиттям запиту та контрольних перевірок виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам'яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Тест затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов'язкове середовище: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Дайте відповідь одним словом: ok. Без пунктуації або додаткового тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax медіана 1279 мс (мін. 1114, макс. 2431)
- opus медіана 2454 мс (мін. 1224, макс. 3170)

## Тест запуску CLI

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

Набори:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл exit-code/signal і зведення максимального RSS для кожної команди. Необов'язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілів використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксована в репозиторії фікстура:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з фікстурою за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов'язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний потік холодного запуску в чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли конфігурації/робочого простору/сеансу, потім запускає Gateway і виконує `openclaw health`.

## Smoke-перевірка імпорту QR (Docker)

Гарантує, що підтримуваний допоміжний засіб виконання QR завантажується в підтримуваних Docker-середовищах Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов'язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
