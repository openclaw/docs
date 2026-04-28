---
read_when:
    - Потрібно перевірити необроблений вивід моделі на витік міркувань
    - Ви хочете запускати Gateway у режимі спостереження під час ітеративної роботи
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, необроблені потоки моделі та відстеження витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-04-28T17:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13a49773e39041c77d4562aadcf03669bb5e66801be9908954e971a27f924cd4
    source_path: help/debugging.md
    workflow: 16
---

Допоміжні засоби налагодження для потокового виводу, особливо коли провайдер домішує reasoning до звичайного тексту.

## Перевизначення runtime-налаштувань

Використовуйте `/debug` у чаті, щоб задавати перевизначення конфігурації **лише для runtime** (у пам'яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть через `commands.debug: true`.
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

Використовуйте `/trace` для діагностики Plugin, наприклад налагоджувальних зведень Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а
`/debug` — для перевизначень конфігурації лише для runtime.

## Трасування життєвого циклу Plugin

Використовуйте `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, коли команди життєвого циклу Plugin здаються повільними
і потрібна вбудована розбивка за фазами для метаданих Plugin, виявлення, реєстру,
runtime-дзеркала, зміни конфігурації та оновлення. Трасування вмикається явно й пише
у stderr, тому JSON-вивід команди залишається придатним до розбору.

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
Якщо команда виконується з checkout вихідного коду, краще вимірювати зібраний
runtime через `node dist/entry.js ...` після `pnpm build`; `pnpm openclaw ...`
також вимірює накладні витрати запуску з вихідного коду.

## Тимчасовий таймінг налагодження CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий допоміжний інструмент для локального
дослідження. Його навмисно не підключено за замовчуванням до запуску CLI, маршрутизації команд
або будь-якої команди. Використовуйте його лише під час налагодження повільної команди, а потім
видаліть імпорт і spans перед внесенням зміни поведінки.

Використовуйте це, коли команда повільна й потрібна швидка розбивка за фазами, перш ніж
вирішувати, чи застосовувати CPU-профайлер, чи виправляти конкретну підсистему.

### Додайте тимчасові spans

Додайте допоміжний інструмент поруч із кодом, який досліджуєте. Наприклад, під час налагодження
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

- Починайте тимчасові назви фаз із `debug:`.
- Додавайте лише кілька spans навколо підозріло повільних ділянок.
- Надавайте перевагу широким фазам, таким як `registry`, `auth_store` або `rows`, а не назвам допоміжних функцій.
- Використовуйте `time()` для синхронної роботи та `timeAsync()` для promise.
- Тримайте stdout чистим. Допоміжний інструмент пише у stderr, тому JSON-вивід команди залишається придатним до розбору.
- Видаліть тимчасові імпорти й spans перед відкриттям фінального PR із виправленням.
- Додайте вивід таймінгу або коротке зведення в issue чи PR, що пояснює оптимізацію.

### Запуск із читабельним виводом

Читабельний режим найкращий для live-налагодження:

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

| Фаза                                     |         Час | Що це означає                                                                                                  |
| ---------------------------------------- | ----------: | -------------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | Завантаження сховища auth-profile має найбільшу вартість, і його слід дослідити першим.                        |
| `debug:models:list:ensure_models_json`   |        5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.                     |
| `debug:models:list:load_model_registry`  |        5.9s | Побудова реєстру та робота з доступністю провайдера також мають помітну вартість.                              |
| `debug:models:list:read_registry_models` |        2.4s | Читання всіх моделей реєстру не безкоштовне й може мати значення для `--all`.                                  |
| фази додавання рядків                    | 3.2s разом  | Побудова п'яти відображених рядків усе ще займає кілька секунд, тому шлях фільтрації вартий ближчого розгляду. |
| `debug:models:list:print_model_table`    |         0ms | Рендеринг не є вузьким місцем.                                                                                 |

Цих висновків достатньо, щоб спрямувати наступний patch без збереження коду таймінгу в
production-шляхах.

### Запуск із JSON-виводом

Використовуйте JSON-режим, коли хочете зберегти або порівняти дані таймінгу:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Кожен рядок stderr є одним JSON-об'єктом:

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

Команда не має повертати жодних тимчасових місць виклику інструментації, якщо PR
не додає явно постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку нотатку з доказами таймінгу.

Для глибших CPU-hotspots використовуйте профілювання Node (`--cpu-prof`) або зовнішній
профайлер замість додавання більшої кількості обгорток таймінгу.

## Режим спостереження Gateway

Для швидких ітерацій запускайте Gateway під file watcher:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher перезапускається при змінах у build-релевантних файлах у `src/`, файлах вихідного коду розширень,
метаданих `package.json` і `openclaw.plugin.json` розширень, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих розширень перезапускають
Gateway без примусового rebuild `tsdown`; зміни вихідного коду й конфігурації все ще
спочатку перебудовують `dist`.

Додавайте будь-які прапорці CLI для Gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої watch-команди для того самого repo/набору прапорців тепер
замінює старіший watcher замість того, щоб залишати дублікати батьківських watcher-процесів.

## Dev-профіль + dev Gateway (--dev)

Використовуйте dev-профіль, щоб ізолювати стан і запустити безпечне одноразове середовище для
налагодження. Є **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  встановлює стандартний порт Gateway на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`: повідомляє Gateway автоматично створити стандартну конфігурацію +
  workspace** за відсутності (і пропустити BOOTSTRAP.md).

Рекомендований потік (dev-профіль + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо глобальне встановлення ще відсутнє, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція профілю** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зміщуються відповідно)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, прив'язка до loopback).
   - Встановлює `agent.workspace` на dev workspace.
   - Встановлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Створює початкові файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Стандартна ідентичність: **C3‑PO** (протокольний дроїд).
   - Пропускає провайдерів каналів у dev-режимі (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (новий старт):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` — це **глобальний** прапорець профілю, і деякі runner-и його поглинають. Якщо потрібно вказати його явно, використовуйте форму env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` стирає конфігурацію, credentials, сеанси та dev workspace (через
`trash`, а не `rm`), потім повторно створює стандартне dev-середовище.

<Tip>
Якщо non-dev Gateway уже запущений (launchd або systemd), спершу зупиніть його:

```bash
openclaw gateway stop
```

</Tip>

## Журналювання сирого потоку (OpenClaw)

OpenClaw може журналювати **сирий assistant stream** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи reasoning надходить як plain text deltas
(або як окремі thinking blocks).

Увімкніть через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов'язкове перевизначення шляху:

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

## Журналювання сирих chunks (pi-mono)

Щоб захоплювати **сирі OpenAI-сумісні chunks** до того, як вони розбираються на блоки,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Необов'язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Стандартний файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, що використовують провайдер
> `openai-completions` pi-mono.

## Нотатки з безпеки

- Журнали сирого потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Тримайте журнали локально й видаляйте їх після налагодження.
- Якщо ділитеся журналами, спершу видаліть secrets і PII.

## Пов'язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
