---
read_when:
    - Вам потрібно перевірити сирий вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітераційної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, сирі потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-04-27T06:25:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374af10312e07d4c4e45d07416fa2d0920dd300e739ebb7a3b72b1e327f21cc1
    source_path: help/debugging.md
    workflow: 15
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер змішує міркування зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб задавати **перевизначення конфігурації лише під час виконання** (у пам’яті, не на диску).
`/debug` типово вимкнено; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемкнути маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення й повертає конфігурацію зі стану на диску.

## Вивід trace сесії

Використовуйте `/trace`, коли хочете бачити рядки trace/debug, що належать Plugin, в одній сесії
без увімкнення повного verbose mode.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад debug summary Active Memory.
Продовжуйте використовувати `/verbose` для звичайного verbose-виводу статусу/інструментів, а
`/debug` — для перевизначень конфігурації лише під час виконання.

## Тимчасовий CLI debug timing

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий допоміжний засіб для локального
дослідження. Він навмисно не підключений до запуску CLI, маршрутизації команд
або будь-якої команди типово. Використовуйте його лише під час налагодження повільної команди, а потім
видаляйте імпорт і spans перед внесенням зміни поведінки.

Використовуйте це, коли команда працює повільно і вам потрібен швидкий розбір за фазами перед
тим, як вирішити, чи використовувати CPU profiler, чи виправляти конкретну підсистему.

### Додайте тимчасові spans

Додайте helper поруч із кодом, який ви досліджуєте. Наприклад, під час налагодження
`openclaw models list` тимчасовий patch у
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

Рекомендації:

- Додавайте префікс `debug:` до назв тимчасових фаз.
- Додавайте лише кілька spans навколо ймовірно повільних ділянок.
- Віддавайте перевагу широким фазам, таким як `registry`, `auth_store` або `rows`, а не
  назвам helper.
- Використовуйте `time()` для синхронної роботи й `timeAsync()` для promises.
- Не засмічуйте stdout. Helper пише в stderr, тому JSON-вивід команди залишається придатним для розбору.
- Видаляйте тимчасові імпорти й spans перед відкриттям фінального PR із виправленням.
- Додайте вивід timing або короткий підсумок до issue або PR, який пояснює
  оптимізацію.

### Запуск із читабельним виводом

Режим читабельного виводу найкращий для live-налагодження:

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
| `debug:models:list:auth_store`           |      20.3s | Завантаження сховища auth-profile — найбільша витрата, і її слід досліджувати першою.                  |
| `debug:models:list:ensure_models_json`   |       5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.             |
| `debug:models:list:load_model_registry`  |       5.9s | Побудова registry і перевірка доступності провайдерів також мають помітну вартість.                     |
| `debug:models:list:read_registry_models` |       2.4s | Читання всіх моделей registry не є безкоштовним і може бути важливим для `--all`.                      |
| фази додавання рядків                    | 3.2s загалом | Побудова п’яти показаних рядків усе ще займає кілька секунд, тож шлях фільтрації заслуговує на увагу. |
| `debug:models:list:print_model_table`    |        0ms | Рендеринг не є вузьким місцем.                                                                          |

Цих висновків достатньо, щоб спрямувати наступний patch без збереження timing-коду
у production-шляхах.

### Запуск із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти дані timing:

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

### Очистьте перед внесенням

Перед відкриттям фінального PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Команда не повинна повертати жодних тимчасових викликів інструментування, якщо лише PR
не додає постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку примітку з доказами timing.

Для глибших CPU-вузьких місць використовуйте профілювання Node (`--cpu-prof`) або зовнішній
profiler замість додавання більшої кількості timing-wrapper-ів.

## Режим спостереження Gateway

Для швидких ітерацій запускайте Gateway під file watcher:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher перезапускає процес при змінах у файлах, що впливають на збирання, в `src/`, вихідному коді розширень,
метаданих `package.json` і `openclaw.plugin.json` розширень, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих розширень перезапускають
gateway без примусового `tsdown` rebuild; зміни у вихідному коді й конфігурації, як і раніше,
спочатку перебудовують `dist`.

Додавайте будь-які прапорці CLI Gateway після `gateway:watch`, і вони передаватимуться при
кожному перезапуску. Повторний запуск тієї самої команди watch для того самого
репозиторію/набору прапорців тепер замінює старіший watcher замість того, щоб залишати дублікати батьківських watcher-процесів.

## Dev profile + dev Gateway (`--dev`)

Використовуйте dev profile, щоб ізолювати стан і підняти безпечне тимчасове середовище для
налагодження. Існує **два** прапорці `--dev`:

- **Глобальний `--dev` (profile):** ізолює стан у `~/.openclaw-dev` і
  типово задає порт Gateway як `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`:** наказує Gateway автоматично створити типову конфігурацію +
  workspace, якщо їх немає (і пропустити BOOTSTRAP.md).

Рекомендований процес (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо у вас ще немає глобального встановлення, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція profile** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas відповідно зміщуються)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, bind loopback).
   - Встановлює `agent.workspace` на dev workspace.
   - Встановлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Заповнює workspace файлами, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова identity: **C3‑PO** (protocol droid).
   - Пропускає channel providers у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Процес скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець profile, і деякі runner-и його перехоплюють. Якщо потрібно вказати його явно, використовуйте форму з env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` очищає конфігурацію, credentials, sessions і dev workspace (використовуючи
`trash`, а не `rm`), а потім заново створює типове dev-середовище.

<Tip>
Якщо вже запущено не-dev Gateway (launchd або systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік помічника** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи надходять міркування як звичайні текстові deltas
(або як окремі thinking blocks).

Увімкнення через CLI:

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

## Логування сирих chunk-ів (pi-mono)

Щоб захопити **сирі chunk-и OpenAI-compat** до того, як вони будуть розібрані на blocks,
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
> `openai-completions` у pi-mono.

## Примітки щодо безпеки

- Логи сирого потоку можуть містити повні промпти, вивід інструментів і дані користувачів.
- Зберігайте логи локально й видаляйте їх після налагодження.
- Якщо ділитеся логами, спочатку приберіть secrets і PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
