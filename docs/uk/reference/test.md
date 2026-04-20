---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-20T15:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f1e2b7bbeb21f4e49af9240e77667f449d6dc02d89bf70f9e3db721326e1824
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір тестування (с’юти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для рядків/гілок/функцій/інструкцій. Із покриття виключено entrypoint-и з великою часткою інтеграції (обв’язка CLI, мости gateway/telegram, статичний сервер webchat), щоб ціль залишалася зосередженою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: Запускає покриття unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped lane-и Vitest, коли diff торкається лише routable файлів source/test. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root project-ів, тож зміни в обв’язці за потреби спричиняють ширший повторний запуск.
- `pnpm changed:lanes`: показує архітектурні lane-и, які спрацьовують для diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи разом із lane-ами core-тестів, extension-роботи разом із lane-ами extension-тестів, зміни лише в тестах — тільки з typecheck/тестами для тестів, а зміни в публічному Plugin SDK або plugin-contract додатково розгортає до валідації extension.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane-и Vitest. Запуски без цілей використовують фіксовані shard-групи й розгортаються до leaf config-ів для локального паралельного виконання; група extension завжди розгортається до per-extension shard config-ів замість одного великого root-project процесу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane-и, які залишають лише `test/setup.ts`, а важчі runtime-кейси — на наявних lane-ах.
- Вибрані допоміжні source-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling-тестами в цих легких lane-ах, тож невеликі зміни в helper-ах не спричиняють повторний запуск важких suite-ів, прив’язаних до runtime.
- `auto-reply` тепер також розділено на три окремі config-и (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel extension-и та OpenAI працюють як окремі shard-и; інші групи extension залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпортів і структуру імпортів, водночас зберігаючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність маршрутизованого шляху changed mode порівняно з нативним запуском root project-ів для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести gateway (парування кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю worker-ів у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів встановіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається таким, що має бути стабільним у CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: Запускає контейнер Gateway з попередньо заповненими даними і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідних відправлень і сповіщення про channel + permission у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, тож smoke відображає те, що міст насправді надсилає.

## Локальний PR gate

Для локальних перевірок перед land/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно спрацьовує на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують один і той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним wizard через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Переконується, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (Node 24 типово, Node 22 сумісний):

```bash
pnpm test:docker:qr
```
