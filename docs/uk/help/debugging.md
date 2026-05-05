---
read_when:
    - Потрібно перевірити сирий вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної розробки
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-05T19:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 286a2857f94b76501059dcb9b446678c5bcf45586b87c98344a58fdeb5b3cbae
    source_path: help/debugging.md
    workflow: 16
---

Помічники налагодження для потокового виводу, особливо коли провайдер змішує міркування зі звичайним текстом.

## Перевизначення під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемкнути малопомітні налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертає конфігурацію з диска.

## Вивід трасування сесії

Використовуйте `/trace`, коли потрібно побачити рядки трасування/налагодження, що належать Plugin, в одній сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад зведень налагодження Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/інструментів, а
`/debug` — для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і потрібна вбудована розбивка фаз для метаданих Plugin, виявлення, реєстру,
дзеркала runtime, зміни конфігурації та оновлення. Трасування вмикається явно й пише
в stderr, тому JSON-вивід команди залишається придатним для парсингу.

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

Використовуйте це для дослідження життєвого циклу Plugin перед тим, як переходити до CPU-профайлера.
Якщо команда запускається з вихідного checkout, надавайте перевагу вимірюванню зібраного
runtime через `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати запуску з джерел.

## Запуск CLI і профілювання команд

Використовуйте доданий у репозиторій бенчмарк запуску, коли команда здається повільною:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Для разового профілювання через звичайний runner джерел установіть
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner джерел додає прапорці CPU-профілю Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасової інструментації в код команди.

Для зависань під час запуску, схожих на синхронну роботу файлової системи або завантажувача модулів,
додайте прапорець трасування синхронного I/O Node через runner джерел:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` вмикає цей прапорець за замовчуванням для дочірнього процесу Gateway під наглядом.
Установіть `OPENCLAW_TRACE_SYNC_IO=0`, щоб приглушити вивід трасування синхронного I/O Node у режимі watch.

## Режим watch для Gateway

Для швидкої ітерації запускайте gateway під файловим watcher:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сесію з назвою
`openclaw-gateway-watch-main` (або варіант для профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні shell, CI та виклики agent exec залишаються від’єднаними й натомість друкують
інструкції для під’єднання. За потреби під’єднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає сирий watcher:

```bash
node scripts/watch-node.mjs gateway --force
```

Використовуйте режим переднього плану, коли tmux не потрібен:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Вимкніть автоматичне під’єднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час Gateway під наглядом під час налагодження гарячих точок запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Обгортка watch споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного виходу дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть gateway під наглядом, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли потрібне інше місце для профілів.
Використовуйте `--benchmark-no-force`, коли потрібно, щоб дочірній процес у бенчмарку пропустив
типове очищення порту `--force` і швидко завершився з помилкою, якщо порт Gateway уже
використовується.
Режим бенчмарку за замовчуванням приглушує шум трасування sync-I/O. Установіть
`OPENCLAW_TRACE_SYNC_IO=1` разом із `--benchmark`, коли явно потрібні і CPU-профілі,
і стек-трасування sync-I/O Node. У режимі бенчмарку ці блоки трасування
записуються в `gateway-watch-output.log` у директорії бенчмарку та
фільтруються з термінальної панелі; звичайні логи Gateway залишаються видимими.

Обгортка tmux переносить у панель поширені несекретні селектори runtime, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані провайдерів у звичайному профілі/конфігурації або використовуйте сирий режим переднього плану
для разових ефемерних секретів.
Якщо Gateway під наглядом завершується під час запуску, watcher один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній процес Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли потрібна оригінальна помилка запуску
без dev-only проходу ремонту.
Керована панель tmux також за замовчуванням використовує кольорові логи Gateway для зручності читання;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається при змінах релевантних для збірки файлів у `src/`, вихідних файлів розширень,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового `tsdown` rebuild; зміни джерел і конфігурації все ще
спершу перебудовують `dist`.

Додавайте будь-які CLI-прапорці gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої watch-команди перезапускає названу панель tmux, а
сирий watcher усе ще зберігає свій lock єдиного watcher, тому дубльовані батьківські watcher
замінюються, а не накопичуються.

## Dev-профіль + dev gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне одноразове середовище для
налагодження. Існує **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  задає порт gateway за замовчуванням `19001` (похідні порти зсуваються разом із ним).
- **`gateway --dev`: повідомляє Gateway автоматично створити стандартну конфігурацію +
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
   - Установлює `agent.workspace` у dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Засіває файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдери каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runners його поглинають. Якщо потрібно вказати явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, облікові дані, сесії та dev workspace (використовуючи
`trash`, а не `rm`), потім заново створює стандартне dev-середовище.

<Tip>
Якщо non-dev gateway уже запущено (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік assistant** до будь-якої фільтрації/форматування.
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

Стандартний файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування сирих chunk (pi-mono)

Щоб захопити **сирі OpenAI-compat chunks** до того, як вони будуть розпарсені в блоки,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Стандартний файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, що використовують провайдер
> `openai-completions` pi-mono.

## Примітки щодо безпеки

- Логи сирого потоку можуть містити повні prompts, tool output і дані користувача.
- Зберігайте логи локально й видаляйте їх після налагодження.
- Якщо ви ділитеся логами, спершу очистіть секрети та PII.

## Налагодження у VSCode

Source maps потрібні, щоб увімкнути налагодження в IDE на основі VSCode, оскільки багато згенерованих файлів у процесі збірки отримують хешовані назви. Додані конфігурації `launch.json` націлені на сервіс Gateway, але їх можна швидко адаптувати для інших цілей:

1. **Перебудувати й налагодити Gateway** - налагоджує сервіс Gateway після створення нової збірки
2. **Налагодити Gateway** - налагоджує сервіс Gateway з уже наявної збірки

### Налаштування

Стандартна конфігурація **Перебудувати й налагодити Gateway** містить усе необхідне: вона автоматично видалить папку `/dist` і перебудує проєкт із увімкненим налагодженням:

1. Відкрийте панель **Run and Debug** з Activity Bar або натисніть `Ctrl`+`Shift`+`D`
2. В IDE переконайтеся, що в dropdown конфігурації вибрано **Перебудувати й налагодити Gateway**, а потім натисніть кнопку **Start Debugging**

Альтернативно - якщо ви віддаєте перевагу ручному керуванню процесами збірки та налагодження:

1. Відкрийте термінал і ввімкніть source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. У тому самому терміналі перебудуйте проєкт: `pnpm clean:dist && pnpm build`
3. В IDE виберіть опцію **Налагодити Gateway** у dropdown конфігурації **Run and Debug**, а потім натисніть кнопку **Start Debugging**

Тепер ви можете встановлювати breakpoints у вихідних файлах TypeScript (директорія `src/`), і debugger коректно зіставлятиме breakpoints зі скомпільованим JavaScript через source maps. Ви зможете переглядати змінні, покроково виконувати код і досліджувати call stacks, як очікується.

### Примітки

- Якщо використовується опція **"Перебудувати й налагодити Gateway"** - щоразу під час запуску debugger вона повністю видалятиме папку `/dist` і виконуватиме повний `pnpm build` з увімкненими source maps перед запуском Gateway
- Якщо використовується опція **"Налагодити Gateway"** - debug sessions можна запускати й зупиняти будь-коли без впливу на папку `/dist`, але потрібно використовувати окремий термінальний процес і для ввімкнення налагодження, і для керування циклом збірки
- Змініть налаштування `launch.json` для `args`, щоб налагоджувати інші частини проєкту
- Якщо потрібно використовувати зібраний OpenClaw CLI для інших задач (тобто `dashboard --no-open`, якщо ваша debug session створює новий auth token), ви можете виконати його в іншому терміналі як `node ./openclaw.mjs` або створити shell alias на кшталт `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
