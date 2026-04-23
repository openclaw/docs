---
read_when:
    - Вам потрібно перевірити сирий вивід моделі на предмет витоку reasoning
    - Ви хочете запускати Gateway у режимі watch під час ітерацій
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим watch, сирі потоки моделі та трасування витоку reasoning'
title: Налагодження
x-i18n:
    generated_at: "2026-04-23T20:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1a389f149703de9ebd9937772041572d086e77c0d760cb7718a8d42025f5b2c
    source_path: help/debugging.md
    workflow: 15
---

Ця сторінка описує допоміжні засоби налагодження для streaming-виводу, особливо коли
provider змішує reasoning у звичайний текст.

## Runtime debug overrides

Використовуйте `/debug` у чаті, щоб задавати перевизначення config **лише на час runtime** (у пам’яті, не на диску).
`/debug` типово вимкнено; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі параметри без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищує всі перевизначення й повертається до config на диску.

## Trace-вивід session

Використовуйте `/trace`, коли хочете бачити рядки trace/debug, якими володіє Plugin, в одній session
без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin-ів, наприклад debug-summary для Active Memory.
Продовжуйте використовувати `/verbose` для звичайного verbose-виводу стану/інструментів, а `/debug` —
для перевизначень config лише на час runtime.

## Тимчасове налагодження часу в CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий помічник для локального
дослідження. Він навмисно не підключений до запуску CLI, маршрутизації команд
або жодної команди типово. Використовуйте його лише під час налагодження повільної команди, а потім
видаляйте імпорт і spans перед внесенням зміни поведінки.

Використовуйте це, коли команда повільна і вам потрібен швидкий розбір по фазах перед
рішенням, чи застосовувати CPU profiler, чи виправляти конкретну підсистему.

### Додайте тимчасові spans

Додайте helper поруч із кодом, який ви досліджуєте. Наприклад, під час налагодження
`openclaw models list` тимчасовий patch у
`src/commands/models/list.list-command.ts` може виглядати так:

```ts
// Лише для тимчасового налагодження. Видалити перед внесенням.
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

Рекомендації:

- Починайте назви тимчасових фаз із `debug:`.
- Додавайте лише кілька spans навколо підозріло повільних ділянок.
- Надавайте перевагу широким фазам на кшталт `registry`, `auth_store` або `rows`, а не
  назвам helper-ів.
- Використовуйте `time()` для синхронної роботи й `timeAsync()` для promise.
- Тримайте stdout чистим. Helper пише в stderr, тож JSON-вивід команди залишається придатним до парсингу.
- Видаляйте тимчасові імпорти й spans перед відкриттям фінального PR із виправленням.
- Додавайте timing-вивід або коротке зведення в issue чи PR, який пояснює
  оптимізацію.

### Запуск із читабельним виводом

Режим із читабельним виводом найкращий для живого налагодження:

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

| Фаза                                     |       Час | Що це означає                                                                                           |
| ---------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |     20.3s | Завантаження сховища профілів автентифікації є найбільшою вартістю, і його слід дослідити першим.      |
| `debug:models:list:ensure_models_json`   |      5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.             |
| `debug:models:list:load_model_registry`  |      5.9s | Побудова реєстру й перевірка доступності provider-ів також мають відчутну вартість.                     |
| `debug:models:list:read_registry_models` |      2.4s | Читання всіх моделей реєстру не безкоштовне і може бути важливим для `--all`.                           |
| фази додавання рядків                    | 3.2s total| Побудова п’яти відображуваних рядків усе ще займає кілька секунд, тож шлях фільтрації варто перевірити глибше. |
| `debug:models:list:print_model_table`    |       0ms | Рендеринг не є вузьким місцем.                                                                          |

Цих висновків достатньо, щоб скерувати наступний patch без збереження timing-коду в
production-шляхах.

### Запуск із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти timing-дані:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Кожен рядок stderr — це один JSON-об’єкт:

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

Команда не повинна повертати жодних тимчасових викликів instrumentation, якщо PR
явно не додає постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку примітку з timing-доказами.

Для глибших CPU hotspot-ів використовуйте profiling Node (`--cpu-prof`) або зовнішній
profiler замість додавання більшої кількості timing-wrapper-ів.

## Режим watch Gateway

Для швидких ітерацій запускайте gateway під file watcher:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher перезапускається при build-релевантних змінах у `src/`, source-файлах extension-ів,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension-ів перезапускають
gateway без примусового `tsdown`-rebuild; зміни source і config, як і раніше,
спочатку перебудовують `dist`.

Додавайте будь-які прапорці CLI gateway після `gateway:watch`, і вони будуть передаватися на
кожному перезапуску. Повторний запуск тієї самої команди watch для того самого repo/набору прапорців тепер
замінює старіший watcher замість того, щоб залишати дублікати батьківських watcher-процесів.

## Dev profile + dev gateway (`--dev`)

Використовуйте dev profile, щоб ізолювати стан і розгорнути безпечну, тимчасову конфігурацію для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (profile):** ізолює стан у `~/.openclaw-dev` і
  типово задає порт gateway як `19001` (похідні порти також зсуваються).
- **`gateway --dev`: каже Gateway автоматично створити типову config +
  workspace**, якщо їх немає (і пропустити `BOOTSTRAP.md`).

Рекомендований потік (dev profile + dev bootstrap):

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
   - Записує мінімальну config, якщо її немає (`gateway.mode=local`, bind loopback).
   - Встановлює `agent.workspace` на dev-workspace.
   - Встановлює `agent.skipBootstrap=true` (без `BOOTSTRAP.md`).
   - Якщо файлів workspace бракує, заповнює їх:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова identity: **C3‑PO** (protocol droid).
   - Пропускає channel provider-и у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

Примітка: `--dev` — це **глобальний** прапорець profile, і деякі runners його поглинають.
Якщо потрібно вказати його явно, використовуйте env-форму:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` стирає config, credentials, sessions і dev-workspace (через
`trash`, а не `rm`), а потім відтворює типову dev-конфігурацію.

Порада: якщо non-dev gateway уже працює (launchd/systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік асистента** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи reasoning надходить як звичайні текстові delta
(або як окремі thinking-блоки).

Увімкнення через CLI:

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

Типовий файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування сирих chunk-ів (pi-mono)

Щоб захоплювати **сирі OpenAI-сумісні chunk-и** до того, як їх буде розібрано на блоки,
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

> Примітка: це виводиться лише процесами, які використовують provider `openai-completions`
> із pi-mono.

## Примітки щодо безпеки

- Логи сирого потоку можуть містити повні prompt-и, вивід інструментів і дані користувача.
- Зберігайте логи локально й видаляйте їх після налагодження.
- Якщо ви ділитеся логами, спочатку очищайте секрети та PII.
