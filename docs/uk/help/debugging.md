---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-04T22:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Помічники налагодження для потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` за замовчуванням вимкнено; увімкніть за допомогою `commands.debug: true`.
Це зручно, коли потрібно перемкнути маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертається до конфігурації на диску.

## Вивід трасування сесії

Використовуйте `/trace`, коли хочете бачити рядки трасування/налагодження, що належать Plugin, в одній сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного статусу/виводу інструментів, а також
`/debug` для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібен вбудований розбір фаз для метаданих Plugin, виявлення, реєстру,
runtime-дзеркала, зміни конфігурації та оновлення. Трасування вмикається явно й пише
в stderr, тому JSON-вивід команди залишається придатним для розбору.

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

Використовуйте це для дослідження життєвого циклу Plugin перед тим, як звертатися до CPU-профайлера.
Якщо команда запускається з вихідного checkout, краще вимірювати зібраний
runtime за допомогою `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати source-runner.

## Профілювання запуску CLI та команд

Використовуйте доданий до репозиторію бенчмарк запуску, коли команда здається повільною:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Для одноразового профілювання через звичайний source runner установіть
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner додає прапорці CPU-профілю Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасової інструментації до коду команди.

Для зависань запуску, схожих на синхронну роботу файлової системи або module-loader,
додайте прапорець трасування sync I/O Node через source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` вмикає цей прапорець за замовчуванням для відстежуваного дочірнього процесу Gateway.
Установіть `OPENCLAW_TRACE_SYNC_IO=0`, щоб приглушити вивід трасування sync I/O Node у watch
mode.

## Watch mode Gateway

Для швидкої ітерації запускайте gateway під файловим watcher:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає сесію tmux з назвою
`openclaw-gateway-watch-main` (або варіант, специфічний для профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично приєднується з інтерактивних терміналів.
Неінтерактивні shell, CI та виклики agent exec залишаються від’єднаними й натомість друкують
інструкції для приєднання. За потреби приєднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає сирий watcher:

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

Профілюйте CPU-час відстежуваного Gateway під час налагодження проблем запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Watch wrapper споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть відстежуваний gateway, щоб
скинути поточний профіль, потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.
Використовуйте `--benchmark-no-force`, коли хочете, щоб benchmarked child пропустив
типове очищення порту `--force` і швидко завершувався з помилкою, якщо порт Gateway уже
використовується.
Benchmark mode за замовчуванням приглушує надмірний вивід трасування sync-I/O. Установіть
`OPENCLAW_TRACE_SYNC_IO=1` з `--benchmark`, коли явно потрібні і CPU
профілі, і stack traces sync-I/O Node. У benchmark mode ці блоки трасування
записуються до `gateway-watch-output.log` у каталозі benchmark і
фільтруються з панелі термінала; звичайні журнали Gateway залишаються видимими.

Tmux wrapper переносить у панель поширені несекретні runtime selectors, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані провайдера у звичайному профілі/конфігурації або використовуйте raw foreground mode
для одноразових ефемерних секретів.
Якщо відстежуваний Gateway завершується під час запуску, watcher один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли хочете отримати початкову
помилку запуску без dev-only repair pass.
Керована панель tmux також за замовчуванням використовує кольорові журнали Gateway для читабельності;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається на файлах, релевантних для збірки, у `src/`, файлах вихідного коду extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового `tsdown` rebuild; зміни вихідного коду та конфігурації все ще
спершу перебудовують `dist`.

Додавайте будь-які прапорці CLI gateway після `gateway:watch`, і вони передаватимуться далі під час
кожного перезапуску. Повторний запуск тієї самої watch-команди повторно створює названу панель tmux, а
raw watcher усе ще зберігає блокування єдиного watcher, щоб дублікати батьківських watcher
замінювалися, а не накопичувалися.

## Dev-профіль + dev gateway (`--dev`)

Використовуйте dev-профіль, щоб ізолювати стан і запустити безпечне, одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  за замовчуванням установлює порт gateway на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: повідомляє Gateway автоматично створити типову конфігурацію +
  workspace** за відсутності (і пропустити BOOTSTRAP.md).

Рекомендований потік (dev-профіль + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо у вас ще немає глобального встановлення, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція профілю** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зміщуються відповідно)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, bind loopback).
   - Установлює `agent.workspace` на dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Заповнює файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3‑PO** (protocol droid).
   - Пропускає провайдерів каналів у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runner його поглинають. Якщо потрібно вказати явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` очищає конфігурацію, облікові дані, сесії та dev workspace (за допомогою
`trash`, не `rm`), а потім повторно створює типове dev-середовище.

<Tip>
Якщо non-dev gateway уже запущений (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Журналювання сирого потоку (OpenClaw)

OpenClaw може журналювати **сирий assistant stream** перед будь-якою фільтрацією/форматуванням.
Це найкращий спосіб побачити, чи reasoning надходить як plain text deltas
(або як окремі thinking blocks).

Увімкніть через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов’язкове перевизначення шляху:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Типовий файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Журналювання сирих chunk (pi-mono)

Щоб захопити **сирі OpenAI-сумісні chunks** перед тим, як їх буде розібрано на блоки,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Типовий файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, що використовують провайдер pi-mono
> `openai-completions`.

## Нотатки з безпеки

- Журнали raw stream можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально й видаляйте їх після налагодження.
- Якщо ділитеся журналами, спершу очистьте секрети та PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
