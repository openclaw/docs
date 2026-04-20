---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-20T22:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, який утримує стандартний control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, якщо попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не загальнорепозиторне покриття всіх файлів. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати всі вихідні файли розділених lane непокритими.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped lane Vitest, коли diff торкається лише routable source/test файлів. Зміни конфігурації/налаштування все одно повертаються до native root projects run, щоб за потреби зміни wiring запускали ширший повторний прогін.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає smart changed gate для diff відносно `origin/main`. Він запускає core-роботу з core test lane, роботу extensions — з extension test lane, зміни лише в тестах — тільки з test typecheck/tests, а також розширює зміни в публічному Plugin SDK або plugin-contract до валідації extensions.
- `pnpm test`: маршрутизує явні цілі файлів/директорій через scoped lane Vitest. Запуски без цілі використовують фіксовані shard groups і розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до per-extension shard config, а не до одного великого root-project process.
- Повні запуски та запуски extension shard оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги для балансування повільних і швидких shard. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані файли тестів `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які зберігають лише `test/setup.ts`, залишаючи resource-heavy випадки на їхніх наявних lane.
- Вибрані вихідні helper-файли `plugin-sdk` і `commands` також маплять `pnpm test:changed` на явні sibling-тести в цих легких lane, щоб дрібні зміни helper не перезапускали важкі набори, що спираються на runtime.
- `auto-reply` тепер також розділено на три окремі config (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extensions/plugins. Важкі channel extensions і OpenAI працюють як окремі shard; інші групи extensions залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого Plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про import-duration та import-breakdown, при цьому все ще використовує маршрутизацію scoped lane для явних цілей файлів/директорій.
- `pnpm test:perf:imports:changed`: те саме профілювання import, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює продуктивність маршрутизованого режиму changed із native root-project run для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (парування multi-instance WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з adaptive workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для зняття skip.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного live model key (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні unit/e2e набори.
- `pnpm test:docker:mcp-channels`: запускає seeded контейнер Gateway і другий контейнер клієнта, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, metadata вкладень, поведінку live event queue, маршрутизацію outbound send і сповіщення про channel + permissions у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що bridge реально надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям/проходження gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на навантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Бенч запуску CLI

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

Пресети:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва пресети

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, тож збір таймінгів і profiles використовує той самий harness.

Правила збереження виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker є необов’язковим; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним wizard через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```
