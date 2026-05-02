---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-02T16:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Помічники налагодження для потокового виводу, особливо коли провайдер змішує міркування зі звичайним текстом.

## Runtime-перевизначення для налагодження

Використовуйте `/debug` у чаті, щоб задати перевизначення конфігурації **лише для runtime** (у памʼяті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть за допомогою `commands.debug: true`.
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

Використовуйте `/trace`, коли хочете бачити належні Plugin рядки трасування/налагодження в одній сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад зведень налагодження Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/інструментів, а
`/debug` — для перевизначень конфігурації лише для runtime.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібен вбудований розподіл за фазами для метаданих Plugin, виявлення, реєстру,
runtime-дзеркала, зміни конфігурації та оновлення. Трасування вмикається явно й пише
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

Використовуйте це для дослідження життєвого циклу Plugin, перш ніж звертатися до CPU-профайлера.
Якщо команда запускається з вихідного checkout, віддавайте перевагу вимірюванню зібраного
runtime через `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати source-runner.

## Тимчасове вимірювання часу налагодження CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий помічник для локального
дослідження. Його навмисно не підключено до запуску CLI, маршрутизації команд
або будь-якої команди за замовчуванням. Використовуйте його лише під час налагодження повільної команди, а потім
видаліть імпорт і діапазони перед внесенням зміни поведінки.

Використовуйте це, коли команда повільна і вам потрібен швидкий розподіл за фазами, перш ніж
вирішувати, чи використовувати CPU-профайлер, чи виправляти конкретну підсистему.

### Додайте тимчасові діапазони

Додайте помічник поруч із кодом, який досліджуєте. Наприклад, під час налагодження
`openclaw models list` тимчасовий патч у
`src/commands/models/list.list-command.ts` може виглядати так:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Настанови:

- Починайте тимчасові назви фаз із `debug:`.
- Додайте лише кілька діапазонів навколо підозрюваних повільних секцій.
- Надавайте перевагу широким фазам, як-от `registry`, `auth_store` або `rows`, а не назвам
  помічників.
- Використовуйте `time()` для синхронної роботи й `timeAsync()` для promise.
- Тримайте stdout чистим. Помічник пише в stderr, тому JSON-вивід команди залишається
  придатним для парсингу.
- Видаліть тимчасові імпорти й діапазони перед відкриттям фінального PR з виправленням.
- Додайте вивід вимірювання часу або коротке зведення в issue чи PR, яке пояснює
  оптимізацію.

### Запустіть із читабельним виводом

Читабельний режим найкраще підходить для живого налагодження:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Приклад виводу з тимчасового дослідження `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Висновки з цього виводу:

| Фаза                                     |        Час | Що це означає                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Завантаження сховища auth-профілів має найбільшу вартість, і його слід дослідити першим.                |
| `debug:models:list:ensure_models_json`   |       5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.              |
| `debug:models:list:load_model_registry`  |       5.9s | Побудова реєстру й робота з доступністю провайдера також мають помітну вартість.                        |
| `debug:models:list:read_registry_models` |       2.4s | Читання всіх моделей реєстру не безкоштовне й може мати значення для `--all`.                           |
| фази додавання рядків                    | 3.2s total | Побудова пʼяти відображених рядків усе ще займає кілька секунд, тож шлях фільтрації варто розглянути уважніше. |
| `debug:models:list:print_model_table`    |        0ms | Рендеринг не є вузьким місцем.                                                                          |

Цих висновків достатньо, щоб спрямувати наступний патч без збереження коду вимірювання часу в
production-шляхах.

### Запустіть із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти дані вимірювання часу:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Кожен рядок stderr — це один JSON-обʼєкт:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Приберіть перед внесенням

Перед відкриттям фінального PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Команда не має повернути жодних тимчасових місць виклику інструментування, якщо PR
явно не додає постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку примітку з доказами вимірювання часу.

Для глибших CPU-hotspot використовуйте профілювання Node (`--cpu-prof`) або зовнішній
профайлер замість додавання додаткових обгорток вимірювання часу.

## Режим спостереження Gateway

Для швидкої ітерації запускайте Gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

За замовчуванням це запускає або перезапускає tmux-сесію з назвою
`openclaw-gateway-watch-main` (або варіант для певного профілю/порту, наприклад
`openclaw-gateway-watch-dev-19001`) і автоматично підʼєднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та виклики agent exec залишаються відʼєднаними й натомість друкують
інструкції для підʼєднання. За потреби підʼєднайтеся вручну:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Панель tmux запускає сирий спостерігач:

```bash
node scripts/watch-node.mjs gateway --force
```

Використовуйте foreground-режим, коли tmux не потрібен:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Вимкніть автоматичне підʼєднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Профілюйте CPU-час спостережуваного Gateway під час налагодження hotspot запуску/runtime:

```bash
pnpm gateway:watch --benchmark
```

Обгортка спостереження споживає `--benchmark` перед викликом Gateway і записує
один V8 `.cpuprofile` для кожного виходу дочірнього процесу Gateway у
`.artifacts/gateway-watch-profiles/`. Зупиніть або перезапустіть спостережуваний Gateway, щоб
скинути поточний профіль, а потім відкрийте його в Chrome DevTools або Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Використовуйте `--benchmark-dir <path>`, коли хочете зберігати профілі в іншому місці.

Обгортка tmux переносить у панель поширені несекретні runtime-селектори, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Зберігайте
облікові дані провайдера у звичайному профілі/конфігурації або використовуйте сирий foreground-режим
для одноразових ефемерних секретів.
Керована панель tmux також за замовчуванням використовує кольорові журнали Gateway для читабельності;
задайте `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Спостерігач перезапускається на файлах, релевантних для збірки, у `src/`, вихідних файлах extension,
метаданих `package.json` і `openclaw.plugin.json` extension, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового перезбирання `tsdown`; зміни джерел і конфігурації все ще
спершу перезбирають `dist`.

Додайте будь-які CLI-прапорці gateway після `gateway:watch`, і їх буде передано під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження пересоздає названу панель tmux, а
сирий спостерігач усе ще зберігає своє блокування single-watcher, тож дублікати батьківських процесів спостерігача
замінюються, а не накопичуються.

## Dev-профіль + dev gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне, одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  встановлює порт gateway за замовчуванням на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: наказує Gateway автоматично створити стандартну конфігурацію +
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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas відповідно зміщуються)

2. **Dev-bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, привʼязка до loopback).
   - Встановлює `agent.workspace` на dev workspace.
   - Встановлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Засіває файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Стандартна ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдери каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` є **глобальним** прапорцем профілю, і деякі засоби запуску його перехоплюють. Якщо потрібно вказати це явно, використовуйте форму зі змінною середовища:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` очищає конфігурацію, облікові дані, сеанси та dev-робочу область (за допомогою
`trash`, а не `rm`), а потім заново створює типове dev-налаштування.

<Tip>
Якщо не-dev gateway уже запущено (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування необробленого потоку (OpenClaw)

OpenClaw може логувати **необроблений потік асистента** до будь-якого фільтрування/форматування.
Це найкращий спосіб побачити, чи reasoning надходить як прості текстові дельти
(або як окремі блоки мислення).

Увімкніть це через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов’язкове перевизначення шляху:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні змінні середовища:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Типовий файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування необроблених фрагментів (pi-mono)

Щоб захоплювати **необроблені OpenAI-сумісні фрагменти** до того, як їх розбирають на блоки,
pi-mono надає окремий логер:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Типовий файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це створюють лише процеси, які використовують провайдер
> `openai-completions` у pi-mono.

## Примітки щодо безпеки

- Логи необробленого потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте логи локально та видаляйте їх після налагодження.
- Якщо ви ділитеся логами, спершу вилучіть секрети та персональні дані.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [Поширені запитання](/uk/help/faq)
