---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими примусового запуску/покриття
title: Тести
x-i18n:
    generated_at: "2026-05-01T23:38:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2bf9cf1024d78747d97b5f4fb41ae42fe6cba547db023b78f3d0dcd4ba5128d
    source_path: reference/test.md
    workflow: 16
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)
- Перевірка оновлень і пакетів Plugin: [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins)

- `pnpm test:force`: Завершує будь-який залишковий процес gateway, що утримує типовий контрольний порт, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає unit-набір із покриттям V8 (через `vitest.unit.config.ts`). Це gate покриття завантажених unit-файлів, а не покриття всіх файлів усього репозиторію. Пороги: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, gate вимірює файли, завантажені unit-набором покриття, замість того щоб вважати кожен split-lane вихідний файл непокритим.
- `pnpm test:coverage:changed`: Запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів за змінами. Він запускає точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних мапінгів вихідних файлів і локального графа імпортів. Широкі зміни конфігурації/пакетів пропускаються, якщо вони не мапляться на точні тести.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів за змінами. Використовуйте його, коли зміна тестового harness/config/package має повертатися до ширшої поведінки Vitest для changed-test.
- `pnpm changed:lanes`: показує архітектурні lanes, які запускає diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний gate перевірки змін для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для тестового підтвердження.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без цілі використовують фіксовані групи shards і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до per-extension shard configs замість одного гігантського root-project процесу.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталлю per-shard.
- Спільний тестовий стан OpenClaw: використовуйте `src/test-utils/openclaw-test-state.ts` з Vitest, коли тесту потрібні ізольовані `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir або сховище auth-profile.
- Process E2E helpers: використовуйте `test/helpers/openclaw-test-instance.ts`, коли Vitest process-level E2E тесту потрібні запущений Gateway, CLI env, захоплення логів і cleanup в одному місці.
- Docker/Bash E2E helpers: lanes, які source `scripts/lib/docker-e2e-image.sh`, можуть передавати `docker_e2e_test_state_shell_b64 <label> <scenario>` у контейнер і декодувати це через `scripts/lib/openclaw-e2e-instance.sh`; multi-home скрипти можуть передавати `docker_e2e_test_state_function_b64` і викликати `openclaw_test_state_create <label> <scenario>` у кожному flow. Нижчорівневі виклики можуть використовувати `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента всередині контейнера або `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable host env file. `--` перед `create` не дає новішим Node runtimes трактувати `--env-file` як Node flag. Docker/Bash lanes, які запускають Gateway, можуть source `scripts/lib/openclaw-e2e-instance.sh` всередині контейнера для entrypoint resolution, запуску mock OpenAI, foreground/background запуску Gateway, readiness probes, експорту state env, дампів логів і cleanup процесів.
- Full, extension та include-pattern shard runs оновлюють локальні timing data в `.artifacts/vitest-shard-timings.json`; подальші whole-config запуски використовують ці timings, щоб балансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до timing key, що зберігає видимість filtered shard timings без заміни whole-config timing data. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний timing artifact.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lanes, які залишають тільки `test/setup.ts`, залишаючи runtime-heavy випадки на їхніх наявних lanes.
- Вихідні файли із сусідніми тестами мапляться на цей сусідній тест перед fallback до ширших directory globs. Зміни helpers у `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` і `src/plugins/contracts` використовують локальний граф імпортів, щоб запускати тести, які імпортують ці файли, замість broad-running кожного shard, коли dependency path точний.
- `auto-reply` тепер також розділено на три окремі configs (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level status/token/helper тестами.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші групи plugin залишаються batched. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітування Vitest import-duration + import-breakdown, при цьому все ще використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: той самий import profiling, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark-ить routed changed-mode path проти native root-project run для того самого committed git diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточний набір змін worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для main thread Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: запускає кожну full-suite Vitest leaf config послідовно й записує grouped duration data плюс per-config JSON/log artifacts. Test Performance Agent використовує це як baseline перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює grouped reports після зміни, сфокусованої на продуктивності.
- Gateway integration: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke tests (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає provider live tests (minimax/zai). Потребує API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: Збирає shared live-test image, один раз пакує OpenClaw як npm tarball, збирає/перевикористовує bare Node/Git runner image плюс functional image, який установлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для installer/update/plugin-dependency lanes; ці lanes монтують prebuilt tarball замість використання скопійованих вихідних файлів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних built-app functionality lanes. `scripts/package-openclaw-for-docker.mjs` є єдиним local/CI package packer і перевіряє tarball плюс `dist/postinstall-inventory.json` перед тим, як Docker його використає. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить scheduler-owned CI plan для вибраних lanes, image kinds, package/live-image needs, state scenarios і credential checks без збирання чи запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує process slots і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і типово дорівнює 10. Heavy lane caps типово дорівнюють `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; provider caps типово дозволяють один heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших hosts. Якщо один lane перевищує effective weight або resource cap на low-parallelism host, він усе одно може стартувати з порожнього pool і працюватиме сам, доки не звільнить capacity. Старт lanes типово рознесено на 2 секунди, щоб уникати local Docker daemon create storms; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує preflight Docker, прибирає застарілі OpenClaw E2E containers, виводить active-lane status кожні 30 секунд, ділить provider CLI tool caches між сумісними lanes, типово один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає lane timings у `.artifacts/docker-tests/lane-timings.json` для longest-first ordering у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати lane manifest без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, щоб налаштувати status output, або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути timing reuse. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для deterministic/local lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для live-provider lanes; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Live-only mode об’єднує main і tail live lanes в один longest-first pool, щоб provider buckets могли пакувати Claude, Codex і Gemini work разом. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має 120-хвилинний fallback timeout, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші per-lane caps. CLI backend Docker setup commands мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Per-lane logs, `summary.json`, `failures.json` і phase timings записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб надрукувати дешеві targeted rerun commands.
- `pnpm test:docker:browser-cdp-snapshot`: Збирає Chromium-backed source E2E container, запускає raw CDP плюс ізольований Gateway, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots містять link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- CLI backend live Docker probes можна запускати як focused lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний proxied chat через `/api/chat/completions`. Потребує придатного live model key (наприклад OpenAI у `~/.profile`), pulls зовнішній Open WebUI image і не очікується CI-stable, як звичайні unit/e2e набори.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, transcript reads, attachment metadata, live event queue behavior, outbound send routing і Claude-style channel + permission notifications через реальний stdio bridge. Claude notification assertion читає raw stdio MCP frames напряму, щоб smoke відображав те, що bridge фактично emits.
- `pnpm test:docker:upgrade-survivor`: Установлює запакований tarball OpenClaw поверх зміненого fixture старого користувача, запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє, що агенти, конфігурація каналу, списки дозволених Plugin, файли робочої області/сесії, застарілий стан залежностей legacy Plugin, запуск і статус RPC зберігаються.
- `pnpm test:docker:published-upgrade-survivor`: Типово встановлює `openclaw@latest`, наповнює реалістичні файли наявного користувача без live-ключів провайдера чи каналу, налаштовує цей базовий стан за допомогою вбудованого рецепта команди `openclaw config set`, оновлює це опубліковане встановлення до запакованого tarball OpenClaw, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє, що налаштовані intents, файли робочої області/сесії, застаріла конфігурація Plugin і стан legacy-залежностей, запуск, `/healthz`, `/readyz` і статус RPC зберігаються або коректно відновлюються. Перевизначте один базовий стан за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, розгорніть точну матрицю за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` або додайте scenario-fixtures за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; приймання пакета надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Запускає harness виживання після published-upgrade у сценарії `plugin-deps-cleanup` з інтенсивним очищенням, типово починаючи з `openclaw@2026.4.23`. Окремий workflow міграції оновлення розгортає цю lane з `baselines=all-since-2026.4.23`, щоб кожен стабільний опублікований пакет від `.23` і далі оновлювався до кандидата та доводив очищення залежностей налаштованого Plugin поза повним релізним CI.

## Локальний гейт PR

Для локальних перевірок посадки/гейту PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте за допомогою `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

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

Вивід містить `sampleCount`, середнє, p50, p95, мін./макс., розподіл exit-кодів/сигналів і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу й захоплення профілю використовували той самий стенд.

Умовні правила для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий артефакт smoke у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксовану в репозиторії базову фікстуру в `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

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

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Перевіряє, що підтримуваний допоміжний модуль QR runtime завантажується в підтримуваних Docker Node runtime (Node 24 типовий, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
