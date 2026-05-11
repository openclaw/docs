---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі відстеження змін під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-11T20:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть за допомогою `commands.debug: true`.
Це зручно, коли потрібно перемкнути маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертає конфігурацію з диска.

## Вивід трасування сеансу

Використовуйте `/trace`, коли хочете бачити належні плагіну рядки трасування/налагодження в одному сеансі
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики плагінів, наприклад налагоджувальних зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а `/debug` —
для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу плагінів здаються повільними
і вам потрібен вбудований розподіл за фазами для метаданих плагінів, виявлення, registry,
runtime mirror, зміни конфігурації та оновлення. Трасування вмикається явно й пише
до stderr, тому JSON-вивід команди лишається придатним для парсингу.

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

Використовуйте це для дослідження життєвого циклу плагінів перед тим, як переходити до CPU-профайлера.
Якщо команда запускається з робочої копії джерел, краще вимірювати зібране
середовище виконання за допомогою `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати source-runner.

## Запуск CLI і профілювання команд

Використовуйте включений у репозиторій бенчмарк запуску, коли команда здається повільною:

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

Source runner додає прапори CPU-профілю Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасової інструментації до коду команди.

Для затримок запуску, схожих на синхронну роботу файлової системи або завантажувача модулів,
додайте прапор трасування sync I/O Node через source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` лишає цей прапор вимкненим за замовчуванням для дочірнього
Gateway під спостереженням. Установіть `OPENCLAW_TRACE_SYNC_IO=1`, коли явно хочете отримати
вивід трасування sync I/O Node у режимі спостереження.

## Режим спостереження Gateway

Для швидкої ітерації запускайте Gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сеанс із назвою
`openclaw-gateway-watch-main` (або варіант, специфічний для профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично приєднується з інтерактивних терміналів.
Неінтерактивні shell, CI та виклики agent exec лишаються від’єднаними й натомість друкують
інструкції для приєднання. За потреби приєднайтеся вручну:

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

Вимкніть автоматичне приєднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час Gateway під спостереженням під час налагодження гарячих точок запуску/середовища виконання:

```bash
pnpm gateway:watch --benchmark
```

Обгортка watch споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть Gateway під спостереженням, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі деінде.
Використовуйте `--benchmark-no-force`, коли хочете, щоб дочірній процес під бенчмарком пропустив
типове очищення порту `--force` і швидко завершився з помилкою, якщо порт Gateway уже
використовується.
Режим бенчмарку за замовчуванням приглушує шум трасування sync-I/O. Установіть
`OPENCLAW_TRACE_SYNC_IO=1` з `--benchmark`, коли явно хочете одночасно CPU-профілі
та стектрейси sync-I/O Node. У режимі бенчмарку ці блоки трасування
записуються до `gateway-watch-output.log` у каталозі бенчмарку й
фільтруються з панелі термінала; звичайні журнали Gateway лишаються видимими.

Обгортка tmux переносить у панель поширені несекретні селектори середовища виконання, такі як
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Зберігайте
облікові дані провайдерів у звичайному профілі/конфігурації або використовуйте сирий режим переднього плану
для одноразових ефемерних секретів.
Якщо Gateway під спостереженням завершується під час запуску, watcher один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли хочете побачити початкову помилку запуску
без dev-only проходу відновлення.
Керована панель tmux також за замовчуванням використовує кольорові журнали Gateway для зручності читання;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається при зміні файлів, релевантних для збірки, у `src/`, вихідних файлів розширень,
`package.json` розширень і метаданих `openclaw.plugin.json`, `tsconfig.json`,
`package.json` та `tsdown.config.ts`. Зміни метаданих розширень перезапускають
gateway без примусової перебудови `tsdown`; зміни джерел і конфігурації все ще
спершу перебудовують `dist`.

Додайте будь-які прапори CLI gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди watch перестворює названу панель tmux, а
сирий watcher все ще зберігає свій single-watcher lock, тому дублікати батьківських watcher
замінюються, а не накопичуються.

## Dev-профіль + dev Gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і розгорнути безпечне, одноразове налаштування для
налагодження. Існує **два** прапори `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  встановлює типовий порт gateway на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: каже Gateway автоматично створити типову конфігурацію +
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
   - Додає початкові файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3-PO** (protocol droid).
   - Пропускає провайдери каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапор профілю, і деякі runners його поглинають. Якщо потрібно вказати його явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` очищає конфігурацію, облікові дані, сеанси та dev workspace (за допомогою
`trash`, а не `rm`), потім повторно створює типове dev-налаштування.

<Tip>
Якщо вже запущено не-dev gateway (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Журналювання сирого потоку (OpenClaw)

OpenClaw може журналювати **сирий потік асистента** до будь-якої фільтрації/форматування.
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

## Журналювання сирих фрагментів (pi-mono)

Щоб захопити **сирі OpenAI-compat chunks** до їхнього парсингу в блоки,
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

> Примітка: це виводиться лише процесами, що використовують провайдер
> `openai-completions` pi-mono.

## Нотатки з безпеки

- Журнали сирого потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально й видаляйте їх після налагодження.
- Якщо ділитеся журналами, спершу вилучіть секрети та PII.

## Налагодження у VSCode

Source maps потрібні, щоб увімкнути налагодження в IDE на базі VSCode, оскільки багато згенерованих файлів отримують хешовані назви в межах процесу збірки. Включені конфігурації `launch.json` націлені на сервіс Gateway, але їх можна швидко адаптувати для інших потреб:

1. **Перезібрати й налагодити Gateway** - Налагоджує сервіс Gateway після створення нової збірки
2. **Налагодити Gateway** - Налагоджує сервіс Gateway попередньо наявної збірки

### Налаштування

Типова конфігурація **Перезібрати й налагодити Gateway** має все необхідне: вона автоматично видалить папку `/dist` і перезбере проєкт із увімкненим налагодженням:

1. Відкрийте панель **Run and Debug** з Activity Bar або натисніть `Ctrl`+`Shift`+`D`
2. В IDE переконайтеся, що в dropdown конфігурації вибрано **Rebuild and Debug Gateway**, а потім натисніть кнопку **Start Debugging**

Альтернативно - якщо ви віддаєте перевагу ручному керуванню процесами збірки й налагодження:

1. Відкрийте термінал і ввімкніть source maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. У тому самому терміналі перезберіть проєкт: `pnpm clean:dist && pnpm build`
3. В IDE виберіть опцію **Debug Gateway** у dropdown конфігурації **Run and Debug**, а потім натисніть кнопку **Start Debugging**

Тепер ви можете встановлювати breakpoints у вихідних файлах TypeScript (каталог `src/`), і debugger правильно зіставлятиме breakpoints зі скомпільованим JavaScript через source maps. Ви зможете переглядати змінні, виконувати код покроково й досліджувати call stacks очікуваним чином.

### Нотатки

- Якщо використовується опція **"Rebuild and Debug Gateway"** - кожного разу під час запуску debugger вона повністю видалятиме папку `/dist` і виконуватиме повний `pnpm build` з увімкненими source maps перед запуском Gateway
- Якщо використовується опція **"Debug Gateway"** - debug sessions можна запускати й зупиняти будь-коли без впливу на папку `/dist`, але потрібно використовувати окремий процес термінала, щоб і ввімкнути налагодження, і керувати циклом збірки
- Змініть налаштування `launch.json` для `args`, щоб налагоджувати інші частини проєкту
- Якщо потрібно використовувати зібраний OpenClaw CLI для інших завдань (тобто `dashboard --no-open`, якщо ваш debug session створює новий auth token), ви можете виконати його в іншому терміналі як `node ./openclaw.mjs` або створити shell alias на кшталт `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
