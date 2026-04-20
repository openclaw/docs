---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-20T16:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d12f555db4121430fa37b35d00966dd73f3a9f7d310fd4d3f2cb1c6cd5ea016
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, який утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для lines/branches/functions/statements. Із покриття виключено entrypoint-и з важкою інтеграцією (CLI wiring, gateway/telegram bridges, webchat static server), щоб ціль залишалася зосередженою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: Запускає покриття unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped Vitest lanes, коли diff зачіпає лише routable source/test файли. Зміни в config/setup, як і раніше, повертаються до нативного запуску root projects, щоб зміни wiring за потреби повторно запускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lanes, які спрацьовують для diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний changed gate для diff відносно `origin/main`. Він запускає core-роботи разом із core test lanes, extension-роботи разом із extension test lanes, test-only роботу лише з test typecheck/tests, а також розгортає зміни публічного Plugin SDK або plugin-contract до валідації extension.
- `pnpm test`: маршрутизує явні цілі файлів/директорій через scoped Vitest lanes. Запуски без вказаних цілей використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для кожного extension/plugin, а не в один гігантський процес root-project.
- Повні запуски та запуски shard-ів extension оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; подальші запуски використовують ці таймінги для балансування повільних і швидких shard-ів. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через виділені легкі lanes, які зберігають лише `test/setup.ts`, залишаючи runtime-heavy кейси на їхніх поточних lanes.
- Вибрані файли helper-джерел `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling tests у цих легких lanes, щоб дрібні зміни helper-ів не спричиняли повторний запуск важких runtime-backed наборів.
- `auto-reply` тепер також розділено на три окремі config-и (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel extension-и й OpenAI запускаються як окремі shard-и; інші групи extension залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту й import-breakdown, при цьому все ще використовуючи scoped lane routing для явних цілей файлів/директорій.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark routed changed-mode шляху проти нативного запуску root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає gateway end-to-end smoke-тести (багатоекземплярний WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Запускає live-тести provider-ів (minimax/zai). Потребує API-ключів і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для зняття `skip`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного live-ключа моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як CI-stable, на відміну від звичайних unit/e2e наборів.
- `pnpm test:docker:mcp-channels`: Запускає seeded контейнер Gateway і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, attachment metadata, поведінку live event queue, outbound send routing, а також сповіщення про channel + permission у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що bridge реально надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям/проходженням gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно спрацьовує на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Benchmark запуску CLI

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, тож вимірювання часу й зняття profile використовують той самий harness.

Умовності для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для smoke-тестів onboarding у контейнерах.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```
