---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-02T21:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Помічники налагодження для потокового виводу, особливо коли провайдер домішує міркування до звичайного тексту.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб задавати перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть за допомогою `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертає конфігурацію з диска.

## Вивід трасування сеансу

Використовуйте `/trace`, коли хочете бачити рядки трасування/налагодження, що належать Plugin, в одному сеансі
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/інструментів, а
`/debug` — для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і потрібна вбудована розбивка фаз для метаданих Plugin, виявлення, реєстру,
дзеркала середовища виконання, зміни конфігурації та оновлення. Трасування вмикається явно й пише
у stderr, тому JSON-вивід команд залишається придатним для парсингу.

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

Використовуйте це для дослідження життєвого циклу Plugin перед тим, як братися за CPU-профайлер.
Якщо команда запускається з вихідного checkout, краще вимірювати зібране
середовище виконання через `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати запуску з вихідного коду.

## Запуск CLI і профілювання команд

Використовуйте доданий до репозиторію бенчмарк запуску, коли команда здається повільною:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Для одноразового профілювання через звичайний запуск із вихідного коду задайте
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Запуск із вихідного коду додає прапорці CPU-профілю Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасової інструментації в код команди.

## Режим спостереження Gateway

Для швидкої ітерації запускайте Gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сеанс із назвою
`openclaw-gateway-watch-main` (або варіант для профілю/порту, як-от
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та виклики agent exec лишаються від’єднаними й натомість друкують
інструкції для під’єднання. За потреби під’єднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає сирий спостерігач:

```bash
node scripts/watch-node.mjs gateway --force
```

Використовуйте режим переднього плану, коли tmux не потрібен:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Вимкніть автопід’єднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час Gateway під спостереженням під час налагодження гарячих точок запуску/середовища виконання:

```bash
pnpm gateway:watch --benchmark
```

Обгортка спостереження споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть gateway під спостереженням, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.

Обгортка tmux переносить у панель типові несекретні селектори середовища виконання, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Зберігайте
облікові дані провайдерів у звичайному профілі/конфігурації або використовуйте сирий режим переднього плану
для одноразових тимчасових секретів.
Керована панель tmux також за замовчуванням використовує кольорові логи Gateway для читабельності;
задайте `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Спостерігач перезапускається при змінах релевантних для збірки файлів у `src/`, вихідних файлів розширень,
`package.json` розширень і метаданих `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих розширень перезапускають
gateway без примусової перебудови `tsdown`; зміни вихідного коду й конфігурації все ще
спершу перебудовують `dist`.

Додавайте будь-які CLI-прапорці gateway після `gateway:watch`, і вони передаватимуться далі під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження заново створює названу панель tmux, а
сирий спостерігач усе одно зберігає своє блокування єдиного спостерігача, тому дубльовані батьківські процеси спостереження
замінюються, а не накопичуються.

## Dev-профіль + dev Gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  задає порт gateway за замовчуванням як `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: повідомляє Gateway автоматично створити стандартну конфігурацію +
  робочий простір** за їх відсутності (і пропустити BOOTSTRAP.md).

Рекомендований потік (dev-профіль + dev-bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо глобального встановлення ще немає, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція профілю** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зміщуються відповідно)

2. **Dev-bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, прив’язка до loopback).
   - Задає `agent.workspace` як dev-робочий простір.
   - Задає `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Засіває файли робочого простору, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Стандартна ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдери каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі запускові обгортки його поглинають. Якщо потрібно вказати його явно, використовуйте форму env-змінної:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, облікові дані, сеанси й dev-робочий простір (через
`trash`, не `rm`), а потім відтворює стандартне dev-середовище.

<Tip>
Якщо вже працює не-dev gateway (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік асистента** перед будь-якою фільтрацією/форматуванням.
Це найкращий спосіб побачити, чи міркування надходить як прості текстові дельти
(або як окремі блоки мислення).

Увімкніть через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов’язкове перевизначення шляху:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні env-змінні:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Файл за замовчуванням:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування сирих фрагментів (pi-mono)

Щоб захопити **сирі OpenAI-сумісні фрагменти** до їх парсингу в блоки,
pi-mono надає окремий логер:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Файл за замовчуванням:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це випускається лише процесами, які використовують провайдер
> `openai-completions` pi-mono.

## Нотатки з безпеки

- Логи сирого потоку можуть містити повні промпти, вивід інструментів і дані користувача.
- Зберігайте логи локально й видаляйте їх після налагодження.
- Якщо поширюєте логи, спершу видаліть секрети й персональні дані.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [Поширені запитання](/uk/help/faq)
