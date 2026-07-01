---
read_when:
    - Ви підключаєте інтерфейси використання/квот провайдера
    - Потрібно пояснити поведінку відстеження використання або вимоги до автентифікації
summary: Поверхні відстеження використання та вимоги до облікових даних
title: Відстеження використання
x-i18n:
    generated_at: "2026-07-01T18:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Що це таке

- Отримує дані про використання/квоту постачальника безпосередньо з його кінцевих точок використання.
- Без оцінок вартості; лише вікна квот, повідомлені постачальником, або зведення
  стану облікового запису.
- Людинозрозумілий вивід стану вікна квоти нормалізується до `X% left`, навіть
  коли upstream API повідомляє спожиту квоту, залишок квоти або лише сирі
  лічильники. Постачальники без скидних вікон квоти можуть натомість показувати
  текст зведення постачальника, наприклад баланс.
- `/status` і `session_status` на рівні сесії можуть повертатися до останнього
  запису використання з транскрипту, коли живий знімок сесії розріджений. Цей
  fallback заповнює відсутні лічильники токенів/кешу, може відновити мітку
  активної runtime-моделі та віддає перевагу більшому prompt-орієнтованому
  підсумку, коли метадані сесії відсутні або менші. Наявні ненульові живі
  значення все одно мають пріоритет.

## Де це відображається

- `/status` у чатах: статусна картка з багатьма emoji, токенами сесії та орієнтовною вартістю (лише API key). Використання постачальника показується для **поточного постачальника моделі**, коли доступне, як нормалізоване вікно `X% left` або текст зведення постачальника.
- `/usage off|tokens|full` у чатах: футер використання для кожної відповіді.
- `/usage cost` у чатах: локальне зведення вартості, агреговане з журналів сесій OpenClaw.
- CLI: `openclaw status --usage` друкує повну деталізацію за постачальниками.
- CLI: `openclaw channels list` друкує той самий знімок використання поруч із конфігурацією постачальника (використайте `--no-usage`, щоб пропустити).
- Рядок меню macOS: розділ «Використання» під «Контекст» (лише якщо доступно).

## Стандартний режим футера використання

`/usage off|tokens|full` задає футер для сесії та запам’ятовується для цієї
сесії. `messages.responseUsage` задає початковий режим для сесій, які ще не
вибрали його, тож футер може бути ввімкнений за замовчуванням без введення
`/usage` щоразу.

Задайте один режим для кожного каналу або мапу для окремих каналів із fallback
`default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Три окремі стани сесії

Поле `responseUsage` сесії має три представні стани, кожен із різною
семантикою:

| Стан                         | Збережене значення              | Ефективний режим                                                     |
| ---------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| **Не задано / успадкувати**  | `undefined` (відсутнє)          | Переходить до стандарту конфігурації `messages.responseUsage`, потім `off`. |
| **Явно вимкнено**            | `"off"` (збережено)             | Завжди вимкнено — не-`off` стандарт конфігурації не може знову ввімкнути футер. |
| **Явно ввімкнено**           | `"tokens"` або `"full"` (збережено) | Цей режим незалежно від стандарту конфігурації.                      |

### Пріоритет

Ефективний режим = перевизначення сесії → запис конфігурації каналу → `default` → `off`.

Явний `/usage off` **зберігається** як буквальне значення `"off"` у
сесії, а не як «не задано». Це означає, що не-`off` стандарт
`messages.responseUsage` не може знову ввімкнути футер після того, як користувач
явно вимкнув його.

### Скидання проти вимкнення

- `/usage off` — примусово вимикає футер і зберігає цей вибір. Налаштований
  не-`off` стандарт не може перевизначити це.
- `/usage reset` (псевдоніми: `inherit`, `clear`, `default`) — очищає
  перевизначення сесії. Після цього сесія **успадковує** ефективний стандарт
  конфігурації (`messages.responseUsage`). Якщо стандарт не налаштовано, футер
  вимкнений (без змін від попереднього стану). Використовуйте це, щоб
  «повернутися до стандарту» без явного ввімкнення футера.
- Повне скидання сесії (`/reset` або `/new`) чи rollover сесії **зберігає**
  явну перевагу режиму використання, щоб вибір відображення користувача переживав
  rollover сесій. Лише `/usage reset` (та його псевдоніми) фактично очищає
  перевизначення.

### Поведінка перемикача

`/usage` без аргументів циклічно перемикає: off → tokens → full → off. Початкова
точка циклу — **ефективний** поточний режим (перевизначення сесії переходить до
стандарту конфігурації, коли не задане), тож цикл завжди узгоджений із тим, що
користувач бачить у футері.

### Конфігурація

Без конфігурації попередня поведінка зберігається (футер вимкнений до `/usage`).
Використайте `/usage reset`, щоб очистити перевизначення сесії та знову
успадкувати налаштований стандарт.

## Власний футер `/usage full`

`/usage full` показує вбудований компактний футер із моделлю, reasoning,
fast/slow, context window і вартістю, коли ці поля доступні. Поля токенів і кешу
залишаються доступними для власних шаблонів. Файл шаблону не потрібен.

`messages.usageTemplate` призначений лише для розширених власних макетів.
Значенням є шлях до JSON-файлу (підтримує `~`) або inline-об’єкт, і воно
замінює вбудований футер, коли є валідним:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Відсутні або порожні шаблони тихо повертаються до вбудованого футера. Нечитабельні
або невалідні налаштовані шаблони також повертаються до вбудованого футера та
виводять попередження оператору.

Почніть власні шаблони з вбудованої форми, а потім змініть частини, які хочете
налаштувати:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Форма

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Кожна поверхня є впорядкованим списком **частин**; рушій рендерить кожну,
відкидає порожні та з’єднує ті, що залишилися, через `sep`. Поверхня без запису
використовує `output.default`.

### Шляхи контракту

Частина читає значення з покрокового контракту через dot-path. Відсутні значення
є порожніми (тож guard `when` або `|fallback` зберігає частину чистою).

| Шлях                                                                                | Значення                               |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id каналу (`discord`/`telegram`/тощо) |
| `model.provider` / `model.display_name`                                             | id постачальника / id моделі           |
| `model.reasoning`                                                                   | зусилля (від `off` до `xhigh`)         |
| `model.is_fallback` / `model.is_override`                                           | bool: використано fallback / модель закріплено |
| `state.fast_mode`                                                                   | bool: fast проти slow                  |
| `context.max_tokens` / `context.pct_used`                                           | бюджет вікна / використано 0-100       |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | агрегат кроку                          |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guards відображення токенів і відсоток кешу |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | лише фінальний виклик моделі           |
| `cost.turn_usd`                                                                     | орієнтовна вартість кроку              |
| `identity.name` / `identity.emoji`                                                  | ім’я агента / вибраний emoji           |

(Вікна rate-limit постачальника **не** входять до цього контракту.)

### Дієслова

Передавайте значення через дієслова зліва направо; сегмент, що не є дієсловом,
є fallback.

| Дієслово       | Ефект                                  | Приклад                           |
| -------------- | -------------------------------------- | --------------------------------- |
| `num`          | компактний лічильник                   | `272000 -> 272k`                  |
| `fixed:N`      | N десяткових знаків (стандартно 2)     | `0.0377`                          |
| `dur`          | секунди в тривалість                   | `14820 -> 4h07m`                  |
| `pct`          | додати `%`                             | `96 -> 96%`                       |
| `inv`          | `100 - x`                              | для використаного до залишку      |
| `alias:TABLE`  | пошук в `aliases`, echo якщо немає в списку | `medium -> 🌗`                    |
| `meter:W:SCALE` | W-коміркова glyph-смуга для значення 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = один glyph) |

### Форми частин

- `{ "text": "📚 {context.max_tokens|num}" }`: literal + interpolation.
- `{ "when": "<path>", "text": "..." }`: render only if the path is truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: value to glyph.
- `{ "each": "limits.windows", "item": "{label}" }`: iterate an array.

### Приклад

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

рендерить, наприклад, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Постачальники + облікові дані

- **Anthropic (Claude)**: токени OAuth у профілях автентифікації.
- **GitHub Copilot**: токени OAuth у профілях автентифікації.
- **Gemini CLI**: токени OAuth у профілях автентифікації.
  - Використання JSON повертається до `stats`; `stats.cached` нормалізується в
    `cacheRead`.
- **OpenAI Codex**: токени OAuth у профілях автентифікації (accountId використовується, коли наявний).
- **MiniMax**: ключ API або профіль автентифікації MiniMax OAuth. OpenClaw розглядає
  `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти
  MiniMax, надає перевагу збереженому MiniMax OAuth, коли він наявний, а інакше повертається
  до `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` або `MINIMAX_API_KEY`.
  Опитування використання виводить хост Coding Plan з `models.providers.minimax-portal.baseUrl`
  або `models.providers.minimax.baseUrl`, коли налаштовано, а інакше використовує
  хост MiniMax CN.
  Сирі поля MiniMax `usage_percent` / `usagePercent` означають **залишкову**
  квоту, тому OpenClaw інвертує їх перед показом; поля на основі лічильника мають пріоритет, коли
  наявні.
  - Мітки вікна coding-plan беруться з полів годин/хвилин провайдера, коли
    наявні, а потім повертаються до проміжку `start_time` / `end_time`.
  - Якщо кінцева точка coding-plan повертає `model_remains`, OpenClaw надає перевагу
    запису моделі чату, виводить мітку вікна з часових позначок, коли явні
    поля `window_hours` / `window_minutes` відсутні, і включає назву моделі
    в мітку плану.
- **Xiaomi MiMo**: ключ API через env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: ключ API через env/config/auth store.
- **DeepSeek**: ключ API через env/config/auth store (`DEEPSEEK_API_KEY`).
  OpenClaw викликає кінцеву точку балансу DeepSeek і показує повідомлений провайдером
  баланс як текст замість вікна квоти з відсотком залишку.

Використання приховано, коли неможливо визначити придатну автентифікацію використання провайдера. Провайдери
можуть надавати специфічну для plugin логіку автентифікації використання; інакше OpenClaw повертається до
відповідних облікових даних OAuth/ключа API з профілів автентифікації, змінних середовища
або конфігурації.

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Використання API і витрати](/uk/reference/api-usage-costs)
- [Кешування prompt](/uk/reference/prompt-caching)
