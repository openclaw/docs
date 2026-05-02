---
read_when:
    - Вам потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-05-02T06:09:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер змішує reasoning зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб установити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` типово вимкнено; увімкніть за допомогою `commands.debug: true`.
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

Використовуйте `/trace`, коли хочете бачити рядки трасування/налагодження, що належать Plugin, в одному сеансі
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, як-от налагоджувальні підсумки Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу статусу/інструментів, а також
`/debug` для перевизначень конфігурації лише під час виконання.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і вам потрібна вбудована розбивка за фазами для метаданих Plugin, виявлення, реєстру,
дзеркала середовища виконання, мутації конфігурації та оновлення. Трасування вмикається явно й пише
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

Використовуйте це для дослідження життєвого циклу Plugin перед переходом до CPU-профайлера.
Якщо команда запускається з checkout вихідного коду, краще вимірювати зібране
середовище виконання за допомогою `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати запуску з вихідного коду.

## Тимчасове вимірювання часу налагодження CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий допоміжний засіб для локального
дослідження. Його навмисно типово не під’єднано до запуску CLI, маршрутизації команд
чи будь-якої команди. Використовуйте його лише під час налагодження повільної команди, а потім
видаліть імпорт і проміжки перед внесенням зміни поведінки.

Використовуйте це, коли команда повільна й вам потрібна швидка розбивка за фазами перед
рішенням, чи використовувати CPU-профайлер, чи виправити конкретну підсистему.

### Додайте тимчасові проміжки

Додайте допоміжний засіб біля коду, який досліджуєте. Наприклад, під час налагодження
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

Рекомендації:

- Починайте назви тимчасових фаз із `debug:`.
- Додавайте лише кілька проміжків навколо підозріло повільних ділянок.
- Надавайте перевагу широким фазам, як-от `registry`, `auth_store` або `rows`, замість назв
  допоміжних функцій.
- Використовуйте `time()` для синхронної роботи й `timeAsync()` для промісів.
- Тримайте stdout чистим. Допоміжний засіб пише у stderr, тож JSON-вивід команди залишається
  придатним для парсингу.
- Видаліть тимчасові імпорти й проміжки перед відкриттям фінального PR з виправленням.
- Додайте вивід вимірювання часу або короткий підсумок до issue чи PR, який пояснює
  оптимізацію.

### Запуск із читабельним виводом

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

| Фаза                                     |          Час | Що це означає                                                                                           |
| ---------------------------------------- | -----------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |        20.3s | Завантаження сховища auth-profile має найбільшу вартість, і його слід дослідити першим.                 |
| `debug:models:list:ensure_models_json`   |         5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.              |
| `debug:models:list:load_model_registry`  |         5.9s | Побудова реєстру та робота з доступністю провайдера також мають відчутну вартість.                      |
| `debug:models:list:read_registry_models` |         2.4s | Читання всіх моделей реєстру не безкоштовне й може мати значення для `--all`.                           |
| фази додавання рядків                    | 3.2s загалом | Побудова п’яти показаних рядків усе ще займає кілька секунд, тож шлях фільтрації потребує ближчого огляду. |
| `debug:models:list:print_model_table`    |          0ms | Рендеринг не є вузьким місцем.                                                                          |

Цих висновків достатньо, щоб спрямувати наступний патч без збереження коду вимірювання часу в
production-шляхах.

### Запуск із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти дані вимірювання часу:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Кожен рядок stderr є одним JSON-об’єктом:

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

Команда не повинна повернути жодних місць виклику тимчасової інструментації, якщо PR
явно не додає постійну діагностичну поверхню. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку нотатку з доказами вимірювання часу.

Для глибших CPU-гарячих точок використовуйте профілювання Node (`--cpu-prof`) або зовнішній
профайлер замість додавання нових обгорток вимірювання часу.

## Режим спостереження Gateway

Для швидких ітерацій запускайте gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

Типово це запускає або перезапускає tmux-сеанс із назвою
`openclaw-gateway-watch-main` (або варіант для профілю/порту, як-от
`openclaw-gateway-watch-dev-19001`) і автоматично приєднується з інтерактивних терміналів.
Неінтерактивні оболонки, CI та exec-виклики агентів залишаються від’єднаними й натомість друкують
інструкції для приєднання. За потреби приєднайтеся вручну:

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

Вимкніть автоматичне приєднання, зберігаючи керування tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Обгортка tmux переносить у панель поширені несекретні селектори середовища виконання, як-от
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` і `OPENCLAW_SKIP_CHANNELS`. Розміщуйте
облікові дані провайдера у своєму звичайному профілі/конфігурації або використовуйте сирий режим переднього плану
для одноразових тимчасових секретів.
Керована панель tmux також типово використовує кольорові журнали Gateway для читабельності;
установіть `FORCE_COLOR=0` під час запуску `pnpm gateway:watch`, щоб вимкнути ANSI-вивід.

Спостерігач перезапускається на релевантних для збірки файлах у `src/`, вихідних файлах розширень,
метаданих `package.json` і `openclaw.plugin.json` розширень, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих розширень перезапускають
gateway без примусового перескладання `tsdown`; зміни вихідного коду й конфігурації все ще
спочатку перебудовують `dist`.

Додавайте будь-які CLI-прапорці gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження повторно створює названу панель tmux, а
сирий спостерігач усе ще зберігає свій lock одного спостерігача, тож дублікати батьківських процесів спостерігача
замінюються, а не накопичуються.

## Dev-профіль + dev Gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  типово встановлює порт gateway на `19001` (похідні порти зсуваються разом із ним).
- **`gateway --dev`: наказує Gateway автоматично створити типову конфігурацію +
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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зсуваються відповідно)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, bind loopback).
   - Встановлює `agent.workspace` на dev workspace.
   - Встановлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Засіває файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдерів каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (свіжий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` є **глобальним** прапорцем профілю, і деякі runners його поглинають. Якщо потрібно вказати його явно, використовуйте форму env-змінної:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` очищає конфігурацію, облікові дані, сеанси та dev workspace (за допомогою
`trash`, а не `rm`), а потім повторно створює типове dev-середовище.

<Tip>
Якщо non-dev gateway уже запущено (launchd або systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Сире журналювання потоку (OpenClaw)

OpenClaw може записувати **необроблений потік асистента** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи reasoning надходить як дельти простого тексту
(або як окремі блоки thinking).

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

## Журналювання необроблених фрагментів (pi-mono)

Щоб захопити **необроблені OpenAI-сумісні фрагменти** до того, як їх буде розібрано на блоки,
pi-mono надає окремий журналювальник:

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

- Журнали необробленого потоку можуть містити повні промпти, вивід інструментів і дані користувача.
- Зберігайте журнали локально та видаляйте їх після налагодження.
- Якщо ви ділитеся журналами, спершу вилучіть секрети та PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
