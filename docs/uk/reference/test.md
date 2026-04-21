---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими `force`/`coverage`
title: Тести
x-i18n:
    generated_at: "2026-04-21T21:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати всі файли вихідного коду у розбитих lane непокритими.
- `pnpm test:coverage:changed`: Запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped lane Vitest, коли diff зачіпає лише routable файли вихідного коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root projects, щоб за потреби зміни у зв’язуванні запускали ширший прогін.
- `pnpm changed:lanes`: показує архітектурні lane, що запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботу разом із core test lanes, роботу extension — разом із extension test lanes, зміни лише в тестах — лише з test typecheck/tests, розширює зміни публічного Plugin SDK або plugin-contract до перевірки extension, а також залишає version bump лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілі використовують фіксовані shard-групи й розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до per-extension shard configs, а не до одного великого процесу root-project.
- Повні запуски та запуски extension shard оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці значення часу для балансування повільних і швидких shard. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які зберігають лише `test/setup.ts`, залишаючи важкі з погляду runtime кейси в їхніх наявних lane.
- Вибрані допоміжні файли вихідного коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling tests у цих легких lane, щоб невеликі зміни helper не перезапускали важкі набори, прив’язані до runtime.
- `auto-reply` тепер також розбивається на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel extensions і OpenAI запускаються як окремі shard; інші групи extension залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого plugin.
- `pnpm test:perf:imports`: вмикає звіти Vitest про тривалість імпорту та деталізацію імпортів, при цьому все ще використовує маршрутизацію scoped lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого changed-режиму проти нативного запуску root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести gateway end-to-end (парування multi-instance WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потребує API-ключів і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається настільки стабільним для CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded контейнер Gateway і другий контейнер-клієнт, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані вкладень, поведінку черги live events, outbound send routing і сповіщення про channel + permissions у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke-тест відображав те, що міст справді надсилає.

## Локальний PR gate

Для локальних перевірок перед приземленням PR/gate запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає флейк на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

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

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу та збирання профілів використовували один і той самий harness.

Умовності для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення через `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проходить інтерактивний майстер через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних runtime Node у Docker (типово Node 24, сумісність із Node 22):

```bash
pnpm test:docker:qr
```
