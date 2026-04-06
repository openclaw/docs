---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-06T15:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f47eef441b9dc700b0f7182ebf1b494303cd1dab85aefdea414a0fae12f51963
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує стандартний control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб server-тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає unit-набір із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для lines/branches/functions/statements. Із покриття виключено integration-heavy entrypoint-и (CLI wiring, мости gateway/telegram, статичний сервер webchat), щоб ціль залишалася сфокусованою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lanes, коли diff торкається лише routable source/test файлів. Зміни config/setup усе ще повертаються до нативного запуску root projects, щоб за потреби зміни wiring перевиконувалися широко.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes, але все одно повертається до нативного запуску root projects, коли ви робите повний нетаргетований прогін.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lanes, які зберігають лише `test/setup.ts`, залишаючи runtime-heavy випадки на наявних lanes.
- Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lanes, щоб невеликі зміни helper-файлів не спричиняли повторний запуск важких наборів, прив’язаних до runtime.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, зі спільним non-isolated runner, увімкненим у всіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` запускає `vitest.extensions.config.ts`.
- `pnpm test:extensions`: запускає набори extension/plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про import-duration + import-breakdown, при цьому все ще використовує маршрутизацію scoped lanes для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю worker-ів у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксований чат через `/api/chat/completions`. Потребує придатного live-ключа моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні unit/e2e-набори.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих conversation, читання transcript, metadata attachment-ів, поведінку черги live events, маршрутизацію вихідного надсилання та сповіщення каналу + дозволів у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frame-и безпосередньо, тож smoke відображає те, що міст фактично видає.

## Локальний PR gate

Для локальних перевірок PR перед land/gate запустіть:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає флейки на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env-змінні: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt за замовчуванням: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Бенч старту CLI

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

Набори preset-ів:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу і збирання профілів використовували один і той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює baseline fixture, закомічений у `test/fixtures/cli-startup-bench.json`, з `runs=5` і `warmup=1`

Fixture, закомічений у репозиторій:

- `test/fixtures/cli-startup-bench.json`
- Оновлення через `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker не є обов’язковим; це потрібно лише для containerized smoke-тестів онбордингу.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що `qrcode-terminal` завантажується у підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```
