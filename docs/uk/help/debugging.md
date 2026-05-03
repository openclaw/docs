---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі відстеження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-03T16:16:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише на час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть його за допомогою `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищує всі перевизначення й повертає конфігурацію з диска.

## Вивід трасування сесії

Використовуйте `/trace`, коли хочете бачити рядки трасування/налагодження, якими володіє Plugin, в одній сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а
`/debug` — для перевизначень конфігурації лише на час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібна вбудована розбивка за фазами для метаданих Plugin, виявлення, registry,
runtime mirror, зміни конфігурації та оновлення. Трасування вмикається явно та записує
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

Використовуйте це для розслідування життєвого циклу Plugin перед тим, як переходити до CPU-профайлера.
Якщо команда запускається з робочої копії вихідного коду, краще вимірювати зібране
runtime за допомогою `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати source-runner.

## Профілювання запуску CLI та команд

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

Source runner додає прапорці профілю CPU Node і записує `.cpuprofile` для
команди. Використовуйте це перед додаванням тимчасової інструментації до коду команди.

## Режим спостереження Gateway

Для швидкої ітерації запускайте Gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає сесію tmux із назвою
`openclaw-gateway-watch-main` (або варіант для профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та виклики agent exec залишаються від’єднаними й натомість друкують
інструкції для під’єднання. За потреби під’єднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає сирий спостерігач:

```bash
node scripts/watch-node.mjs gateway --force
```

Використовуйте foreground mode, коли tmux не потрібен:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Вимкніть автоматичне під’єднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час Gateway під спостереженням під час налагодження вузьких місць запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Обгортка спостерігача споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть gateway під спостереженням, щоб
скинути поточний профіль, потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.
Використовуйте `--benchmark-no-force`, коли хочете, щоб профільований дочірній процес пропустив
типове очищення порту `--force` і швидко завершився з помилкою, якщо порт Gateway уже
використовується.

Обгортка tmux переносить у панель поширені несекретні runtime-селектори, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані провайдерів у звичайному профілі/конфігурації або використовуйте сирий foreground mode
для одноразових ефемерних секретів.
Якщо Gateway під спостереженням завершується під час запуску, спостерігач один раз запускає
`openclaw doctor --fix --non-interactive` і перезапускає дочірній процес Gateway.
Використовуйте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, коли потрібна початкова помилка запуску
без dev-only проходу відновлення.
Керована панель tmux також за замовчуванням використовує кольорові журнали Gateway для читабельності;
задайте `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Спостерігач перезапускається при зміні build-relevant файлів у `src/`, вихідних файлів extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового перебудовування `tsdown`; зміни вихідного коду та конфігурації все ще
спочатку перебудовують `dist`.

Додайте будь-які прапорці CLI gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження пересоздає названу панель tmux, а
сирий спостерігач усе ще зберігає блокування єдиного спостерігача, тому дублікати батьківських процесів спостерігача
замінюються, а не накопичуються.

## Dev-профіль + dev-gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  задає типовий порт gateway `19001` (похідні порти зсуваються разом із ним).
- **`gateway --dev`: повідомляє Gateway автоматично створити типову конфігурацію +
  workspace** за їх відсутності (і пропустити BOOTSTRAP.md).

Рекомендований процес (dev-профіль + dev-bootstrap):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas відповідно зсуваються)

2. **Dev-bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, прив’язка до loopback).
   - Установлює `agent.workspace` у dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Засіває файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдери каналів у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Процес скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runner його поглинають. Якщо потрібно вказати його явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, облікові дані, сесії та dev workspace (за допомогою
`trash`, а не `rm`), потім повторно створює типове dev-середовище.

<Tip>
Якщо non-dev gateway уже запущено (launchd або systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік асистента** перед будь-якою фільтрацією/форматуванням.
Це найкращий спосіб побачити, чи reasoning надходить як прості текстові дельти
(або як окремі блоки thinking).

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

## Логування сирих фрагментів (pi-mono)

Щоб захопити **сирі OpenAI-сумісні фрагменти** до того, як їх буде розібрано на блоки,
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

## Примітки щодо безпеки

- Журнали сирого потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально й видаляйте їх після налагодження.
- Якщо ділитеся журналами, спочатку очистьте секрети та PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [Поширені запитання](/uk/help/faq)
