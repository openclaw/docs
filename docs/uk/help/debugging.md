---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі відстеження під час ітераційної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-04T22:41:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2b48aab9e3d8be36a78e797fdd723e3af4b35dd28ed3a95e63bb422422bccc6
    source_path: help/debugging.md
    workflow: 16
---

Помічники для налагодження потокового виводу, особливо коли provider домішує reasoning у звичайний текст.

## Перевизначення runtime debug

Використовуйте `/debug` у чаті, щоб установити **лише runtime** перевизначення config (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертає config на диску.

## Вивід трасування сесії

Використовуйте `/trace`, коли хочете бачити trace/debug рядки, що належать Plugin, в одній сесії
без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад debug-зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/tool, і продовжуйте використовувати
`/debug` для лише runtime перевизначень config.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і потрібна вбудована розбивка фаз для metadata, discovery, registry Plugin,
runtime mirror, мутації config і refresh-робіт. Трасування є opt-in і пише
в stderr, тож JSON-вивід команд залишається придатним до парсингу.

Приклад:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Приклад виводу:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Використовуйте це для дослідження життєвого циклу Plugin перед тим, як переходити до CPU profiler.
Якщо команда запускається з source checkout, надавайте перевагу вимірюванню зібраного
runtime через `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює overhead source-runner.

## Профілювання запуску CLI і команд

Використовуйте доданий startup benchmark, коли команда здається повільною:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Для одноразового профілювання через звичайний source runner задайте
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner додає прапорці Node CPU profile і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасового інструментування в код команди.

Для зависань під час запуску, які схожі на синхронну роботу filesystem або module-loader,
додайте прапорець Node для трасування sync I/O через source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` вмикає цей прапорець за замовчуванням для відстежуваного дочірнього Gateway.
Установіть `OPENCLAW_TRACE_SYNC_IO=0`, щоб придушити вивід Node sync I/O trace у watch
mode.

## Watch mode Gateway

Для швидкої ітерації запускайте gateway під file watcher:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сесію з назвою
`openclaw-gateway-watch-main` (або profile/port-specific варіант, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні shell, CI та agent exec calls залишаються від’єднаними й натомість друкують
інструкції для під’єднання. Під’єднуйтеся вручну за потреби:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає raw watcher:

```bash
node scripts/watch-node.mjs gateway --force
```

Використовуйте foreground mode, коли tmux не потрібен:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Вимкніть auto-attach, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час відстежуваного Gateway під час налагодження hotspot запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Watch wrapper споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть відстежуваний gateway, щоб
скинути поточний profile, потім відкрийте його через Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати profiles в іншому місці.
Використовуйте `--benchmark-no-force`, коли хочете, щоб benchmarked child пропускав
стандартне очищення порту `--force` і швидко завершувався помилкою, якщо порт Gateway уже
використовується.
Benchmark mode за замовчуванням пригнічує спам sync-I/O trace. Установіть
`OPENCLAW_TRACE_SYNC_IO=1` з `--benchmark`, коли явно хочете і CPU
profiles, і stack traces Node sync-I/O.

Tmux wrapper переносить у панель поширені несекретні runtime selectors, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані provider у своєму звичайному profile/config або використовуйте raw foreground mode
для одноразових ephemeral secrets.
Якщо відстежуваний Gateway завершується під час запуску, watcher один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли хочете бачити початкову помилку запуску
без dev-only repair pass.
Керована tmux-панель також за замовчуванням використовує кольорові логи Gateway для читабельності;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається на build-relevant файлах у `src/`, source-файлах extension,
metadata `package.json` і `openclaw.plugin.json` extension, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни metadata extension перезапускають
gateway без примусового `tsdown` rebuild; source і config зміни все ще
спершу перебудовують `dist`.

Додавайте будь-які прапорці gateway CLI після `gateway:watch`, і їх буде передано далі під час
кожного перезапуску. Повторний запуск тієї самої watch-команди respawn-ить названу tmux-панель, а
raw watcher усе ще зберігає свій single-watcher lock, щоб дублікати watcher parents
замінювалися, а не накопичувалися.

## Dev profile + dev gateway (--dev)

Використовуйте dev profile, щоб ізолювати state і підняти безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Global `--dev` (profile):** ізолює state у `~/.openclaw-dev` і
  задає стандартний порт gateway `19001` (derived ports зміщуються разом із ним).
- **`gateway --dev`: каже Gateway автоматично створити default config +
  workspace**, якщо їх немає (і пропустити BOOTSTRAP.md).

Рекомендований flow (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо глобального install ще немає, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція profile** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зміщуються відповідно)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальний config, якщо його немає (`gateway.mode=local`, bind loopback).
   - Установлює `agent.workspace` у dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Seed-ить файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Default identity: **C3‑PO** (protocol droid).
   - Пропускає channel providers у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Reset flow (fresh start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **global** profile flag, і деякі runners його поглинають. Якщо потрібно прописати це явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає config, credentials, sessions і dev workspace (через
`trash`, а не `rm`), потім повторно створює default dev setup.

<Tip>
Якщо non-dev gateway уже запущено (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування raw stream (OpenClaw)

OpenClaw може логувати **raw assistant stream** перед будь-якою фільтрацією/форматуванням.
Це найкращий спосіб побачити, чи reasoning надходить як plain text deltas
(або як окремі thinking blocks).

Увімкніть через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optional path override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Default file:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування raw chunk (pi-mono)

Щоб захопити **raw OpenAI-compat chunks** до того, як вони будуть розпарсені на blocks,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Optional path:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Default file:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Note: це випускається лише процесами, що використовують provider pi-mono
> `openai-completions`.

## Нотатки з безпеки

- Raw stream logs можуть містити повні prompts, tool output і user data.
- Зберігайте logs локально й видаляйте їх після налагодження.
- Якщо ділитеся logs, спершу очистьте secrets і PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
