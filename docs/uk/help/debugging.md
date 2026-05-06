---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-06T05:39:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб задавати перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення та повертає конфігурацію з диска.

## Вивід трасування сеансу

Використовуйте `/trace`, коли хочете бачити належні Plugin рядки трасування/налагодження в одному сеансі
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних підсумків Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/інструментів, а
`/debug` — для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібен вбудований розбір фаз для метаданих Plugin, виявлення, реєстру,
дзеркала runtime, мутації конфігурації та оновлення. Трасування вмикається явно та пише
у stderr, тому JSON-вивід команди лишається придатним для парсингу.

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
Якщо команда виконується з checkout вихідного коду, бажано вимірювати зібраний
runtime за допомогою `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати source-runner.

## Профілювання запуску CLI та команд

Використовуйте внесений у репозиторій бенчмарк запуску, коли команда здається повільною:

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

Source runner додає прапорці CPU-профілю Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасового інструментування в код команди.

Для зависань запуску, схожих на синхронну роботу з файловою системою або завантажувачем модулів,
додайте прапорець трасування синхронного I/O Node через source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` вмикає цей прапорець за замовчуванням для спостережуваного дочірнього процесу Gateway.
Задайте `OPENCLAW_TRACE_SYNC_IO=0`, щоб придушити вивід трасування синхронного I/O Node у режимі watch.

## Режим watch для Gateway

Для швидких ітерацій запускайте gateway під файловим watcher:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає сесію tmux з назвою
`openclaw-gateway-watch-main` (або варіант для профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та виклики agent exec лишаються від’єднаними й натомість друкують
інструкції для під’єднання. За потреби під’єднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає raw watcher:

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

Профілюйте CPU-час спостережуваного Gateway під час налагодження вузьких місць запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Обгортка watch споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного виходу дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть спостережуваний gateway, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.
Використовуйте `--benchmark-no-force`, коли хочете, щоб дочірній процес бенчмарку пропустив
типове очищення порту `--force` і швидко завершився з помилкою, якщо порт Gateway вже
використовується.
Режим бенчмарку за замовчуванням придушує шум трасування sync-I/O. Задайте
`OPENCLAW_TRACE_SYNC_IO=1` разом із `--benchmark`, коли явно потрібні і CPU-профілі,
і стек-трейси sync-I/O Node. У режимі бенчмарку ці блоки трасування
записуються до `gateway-watch-output.log` у каталозі бенчмарку та
фільтруються з панелі термінала; звичайні журнали Gateway лишаються видимими.

Обгортка tmux переносить у панель поширені несекретні runtime-селектори, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані провайдера у звичайному профілі/конфігурації або використовуйте raw-режим переднього плану
для одноразових тимчасових секретів.
Якщо спостережуваний Gateway завершується під час запуску, watcher один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній процес Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли хочете побачити початкову
помилку запуску без dev-only repair pass.
Керована панель tmux також за замовчуванням використовує кольорові журнали Gateway для читабельності;
задайте `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається при змінах релевантних для збірки файлів у `src/`, вихідних файлів розширень,
метаданих `package.json` і `openclaw.plugin.json` розширень, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих розширень перезапускають
gateway без примусового перезбирання `tsdown`; зміни вихідного коду та конфігурації все одно
спочатку перезбирають `dist`.

Додайте будь-які прапорці CLI gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди watch повторно створює іменовану панель tmux, а
raw watcher усе ще утримує своє блокування single-watcher, тому дублікати батьківських watcher
замінюються, а не накопичуються.

## Dev-профіль + dev gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  задає порт gateway за замовчуванням `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: каже Gateway автоматично створити типову конфігурацію +
  workspace** за відсутності (і пропустити BOOTSTRAP.md).

Рекомендований потік (dev-профіль + dev-bootstrap):

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

2. **Dev-bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, bind loopback).
   - Задає `agent.workspace` як dev workspace.
   - Задає `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Створює початкові файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3-PO** (protocol droid).
   - Пропускає провайдери каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (новий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runners його споживають. Якщо потрібно прописати його явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, облікові дані, сеанси та dev workspace (за допомогою
`trash`, не `rm`), а потім відтворює типове dev-середовище.

<Tip>
Якщо non-dev gateway вже запущений (launchd або systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування raw-потоку (OpenClaw)

OpenClaw може логувати **raw assistant stream** до будь-якої фільтрації/форматування.
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

## Логування raw chunk (pi-mono)

Щоб захоплювати **raw OpenAI-compat chunks** до того, як їх буде розпарсено в блоки,
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

> Примітка: це емітується лише процесами, що використовують провайдер
> `openai-completions` pi-mono.

## Нотатки щодо безпеки

- Журнали raw stream можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально та видаляйте їх після налагодження.
- Якщо ділитеся журналами, спочатку очистьте секрети та PII.

## Налагодження у VSCode

Source maps потрібні для налагодження в IDE на основі VSCode, оскільки багато згенерованих файлів у процесі збірки отримують хешовані назви. Включені конфігурації `launch.json` націлені на сервіс Gateway, але їх можна швидко адаптувати для інших цілей:

1. **Перезібрати й налагодити Gateway** - Налагоджує сервіс Gateway після створення нової збірки
2. **Налагодити Gateway** - Налагоджує сервіс Gateway попередньо наявної збірки

### Налаштування

Типова конфігурація **Перезібрати й налагодити Gateway** містить усе необхідне: вона автоматично видалить папку `/dist` і перезбере проєкт із увімкненим налагодженням:

1. Відкрийте панель **Run and Debug** з Activity Bar або натисніть `Ctrl`+`Shift`+`D`
2. В IDE переконайтеся, що **Перезібрати й налагодити Gateway** вибрано у випадаючому списку конфігурації, а потім натисніть кнопку **Start Debugging**

Альтернативно - якщо ви бажаєте керувати процесами збірки та налагодження вручну:

1. Відкрийте термінал і ввімкніть source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. У тому самому терміналі перезберіть проєкт: `pnpm clean:dist && pnpm build`
3. В IDE виберіть опцію **Налагодити Gateway** у випадаючому списку конфігурації **Run and Debug**, а потім натисніть кнопку **Start Debugging**

Тепер ви можете встановлювати точки зупину у вихідних TypeScript-файлах (каталог `src/`), і debugger коректно зіставлятиме точки зупину зі скомпільованим JavaScript через source maps. Ви зможете переглядати змінні, покроково проходити код і досліджувати call stacks, як очікується.

### Нотатки

- Якщо використовується опція **"Перезібрати й налагодити Gateway"** - кожного разу під час запуску debugger вона повністю видалятиме папку `/dist` і запускатиме повний `pnpm build` з увімкненими source maps перед стартом Gateway
- Якщо використовується опція **"Налагодити Gateway"** - debug sessions можна запускати й зупиняти будь-коли без впливу на папку `/dist`, але потрібно використовувати окремий процес термінала, щоб і ввімкнути налагодження, і керувати циклом збірки
- Змініть налаштування `launch.json` для `args`, щоб налагоджувати інші частини проєкту
- Якщо вам потрібно використовувати зібраний OpenClaw CLI для інших завдань (тобто `dashboard --no-open`, якщо ваша debug session створює новий auth token), ви можете виконати його в іншому терміналі як `node ./openclaw.mjs` або створити shell alias на кшталт `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
