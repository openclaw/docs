---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-28T23:57:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2159520dd308440fce5d82ba251e1f3a37bd37a152b7c5542e92f5cbf924a34
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який залишковий процес gateway, що утримує типовий контрольний порт, потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає модульний набір із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття завантажених файлів модульними тестами, а не покриття всіх файлів у всьому репозиторії. Пороги: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені набором модульного покриття, замість того щоб вважати кожен source-файл зі split-lane непокритим.
- `pnpm test:coverage:changed`: Запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змін. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних відповідностей source-файлів і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не зіставляються з точними тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змін. Використовуйте його, коли зміна test harness/config/package має повернутися до ширшої поведінки Vitest для змінених тестів.
- `pnpm changed:lanes`: показує архітектурні lane, які спрацьовують через diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний check gate для змін відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lane, але не запускає тести Vitest. Для доказу тестами використовуйте `pnpm test:changed` або явний `pnpm test <target>`.
- `pnpm test`: спрямовує явні цілі файлів/директорій через scoped Vitest lanes. Запуски без цілей використовують фіксовані shard-групи й розгортаються до leaf-конфігів для локального паралельного виконання; група extension завжди розгортається до per-extension shard-конфігів замість одного великого root-project процесу.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або auth-profile store. Для process-level E2E тестів, яким потрібен запущений Gateway, використовуйте `test/helpers/openclaw-test-instance.ts`, щоб стан, конфіг, CLI env, запуск gateway, захоплення логів і cleanup залишалися разом. Docker/Bash E2E lanes, які source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і виконувати `eval` декодованого фрагмента там; multi-home scripts можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі викликачі можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим Node runtime трактувати `--env-file` як Node flag.
- Запуски full, extension і include-pattern shard оновлюють локальні timing-дані в `.artifacts/vitest-shard-timings.json`; пізніші whole-config запуски використовують ці timings, щоб збалансувати повільні та швидкі shards. Include-pattern CI shards додають назву shard до timing key, що зберігає filtered shard timings видимими без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані test-файли `plugin-sdk` і `commands` тепер спрямовуються через dedicated light lanes, які залишають лише `test/setup.ts`, залишаючи runtime-heavy cases на їхніх наявних lanes.
- Source-файли із сусідніми тестами зіставляються з цим сусіднім тестом перед fallback до ширших directory globs. Зміни helper у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати importing tests замість широкого запуску кожного shard, коли dependency path точний.
- `auto-reply` тепер також розділено на три dedicated configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper тестами.
- Базовий Vitest config тепер типово використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у configs репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Heavy channel plugins, browser plugin і OpenAI запускаються як dedicated shards; інші plugin groups залишаються batched. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest import-duration + import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/директорій.
- `pnpm test:perf:imports:changed`: те саме import profiling, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточний worktree change set без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожен full-suite Vitest leaf config послідовно й записує grouped duration data плюс per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після performance-focused change.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: Збирає спільний live-test image, пакує OpenClaw один раз як npm tarball, збирає/перевикористовує bare Node/Git runner image плюс functional image, який інсталює цей tarball у `/app`, потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують prebuilt tarball замість використання скопійованих repo sources. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для normal built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json`, перш ніж Docker його споживає. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без build або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і типово дорівнює 10. Heavy lane caps типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps типово дорівнюють одному heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо один lane перевищує effective weight або resource cap на low-parallelism host, він все одно може стартувати з empty pool і працюватиме сам, доки не звільнить capacity. Старти lane типово рознесені на 2 секунди, щоб уникнути локальних Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує preflight Docker, очищає stale OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між compatible lanes, повторює transient live-provider failures один раз типово (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у пізніших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування status output або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути timing reuse. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати Claude, Codex і Gemini work разом. Runner припиняє планувати нові pooled lanes після першого failure, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має 120-minute fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, потім запускає real proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls external Open WebUI image і не очікується як CI-stable на рівні звичайних unit/e2e suites.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який spawns `openclaw mcp serve`, потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Claude notification assertion читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.

## Локальний PR gate

Для локальних PR land/gate checks запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно падає на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте проблему за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкове env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий промпт: “Відповідай одним словом: ок. Без розділових знаків або додаткового тексту.”

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл кодів виходу/сигналів і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та збирання профілів використовували той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` із `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії baseline-фікстуру в `test/fixtures/cli-startup-bench.json` із `runs=5` і `warmup=1`

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

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли конфігурації/робочого простору/сесії, потім запускає Gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний QR runtime helper завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
