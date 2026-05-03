---
read_when:
    - Потрібно перевірити необроблений вивід моделі на предмет витоку міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної розробки
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-03T12:10:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05a02f74b2b5d95ba87b0b344dc1bc44131cf9d2d0efaec14aad5d04c596babc
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть за допомогою `commands.debug: true`.
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

Використовуйте `/trace`, коли потрібно бачити рядки трасування/налагодження, що належать Plugin, в одному сеансі
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних підсумків Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а `/debug` — для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібен вбудований розбір фаз для метаданих Plugin, виявлення, реєстру,
дзеркала runtime, зміни конфігурації та оновлення. Трасування вмикається явно та пише
у stderr, тож JSON-вивід команд залишається придатним для парсингу.

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
Якщо команда запускається з checkout вихідного коду, краще вимірювати зібраний
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
команди. Використовуйте це перед додаванням тимчасового інструментування в код команд.

## Режим спостереження Gateway

Для швидких ітерацій запускайте Gateway під file watcher:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сеанс із назвою
`openclaw-gateway-watch-main` (або варіант для конкретного профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично під’єднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та виклики agent exec залишаються від’єднаними й натомість друкують
інструкції для під’єднання. За потреби під’єднайтеся вручну:

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

Вимкніть автоматичне під’єднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час Gateway у режимі спостереження під час налагодження вузьких місць запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Watch wrapper споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного завершення дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть Gateway у режимі спостереження, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.
Використовуйте `--benchmark-no-force`, коли хочете, щоб бенчмаркований дочірній процес пропустив
стандартне очищення порту `--force` і швидко завершився з помилкою, якщо порт Gateway уже
використовується.

Tmux wrapper переносить у панель поширені несекретні селектори runtime, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Помістіть
облікові дані провайдерів у звичайний профіль/конфігурацію або використовуйте raw foreground mode
для одноразових ефемерних секретів.
Керована tmux-панель також за замовчуванням використовує кольорові журнали Gateway для зручності читання;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Watcher перезапускається при змінах файлів, релевантних для збірки, у `src/`, вихідних файлів extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
Gateway без примусового перезбирання `tsdown`; зміни вихідного коду та конфігурації все ще
спершу перезбирають `dist`.

Додайте будь-які прапорці CLI Gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження повторно створює названу tmux-панель, а
raw watcher все ще зберігає своє блокування одного watcher, тож дубльовані батьківські watcher
замінюються замість накопичення.

## Dev-профіль + dev Gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і запустити безпечне, одноразове середовище для
налагодження. Існує **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  встановлює порт Gateway за замовчуванням на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: вказує Gateway автоматично створити стандартну конфігурацію +
  workspace** за відсутності (і пропустити BOOTSTRAP.md).

Рекомендований процес (dev-профіль + dev bootstrap):

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
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, прив’язка до loopback).
   - Установлює `agent.workspace` на dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Створює початкові файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Стандартна ідентичність: **C3‑PO** (protocol droid).
   - Пропускає channel providers у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Процес скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runners його перехоплюють. Якщо потрібно вказати його явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, облікові дані, сеанси та dev workspace (за допомогою
`trash`, не `rm`), а потім повторно створює стандартне dev-середовище.

<Tip>
Якщо non-dev Gateway уже запущено (launchd або systemd), спершу зупиніть його:

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

## Логування raw chunk (pi-mono)

Щоб захопити **raw OpenAI-compat chunks** до того, як вони будуть розібрані на блоки,
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

> Примітка: це генерується лише процесами, які використовують провайдер
> `openai-completions` pi-mono.

## Нотатки щодо безпеки

- Журнали raw stream можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально та видаляйте їх після налагодження.
- Якщо ви ділитеся журналами, спершу видаліть секрети та PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
