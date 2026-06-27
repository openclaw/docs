---
read_when:
    - Ви під’єднуєте інтерфейси використання/квот провайдера
    - Вам потрібно пояснити поведінку відстеження використання або вимоги до автентифікації
summary: Поверхні відстеження використання та вимоги до облікових даних
title: Відстеження використання
x-i18n:
    generated_at: "2026-06-27T17:29:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Що це таке

- Отримує використання/квоту провайдера безпосередньо з його endpoint-ів використання.
- Без оцінених витрат; лише вікна квот або зведення стану акаунта, повідомлені
  провайдером.
- Людинозрозумілий вивід стану вікна квоти нормалізується до `X% left`, навіть
  коли upstream API повідомляє спожиту квоту, залишкову квоту або лише сирі
  лічильники. Провайдери без вікон квот зі скиданням можуть натомість показувати
  текстове зведення провайдера, наприклад баланс.
- `/status` на рівні сесії та `session_status` можуть відступати до останнього
  запису використання з транскрипту, коли живий знімок сесії розріджений. Цей
  fallback заповнює відсутні лічильники токенів/кешу, може відновити мітку
  активної runtime-моделі та віддає перевагу більшому prompt-орієнтованому
  підсумку, коли метадані сесії відсутні або менші. Наявні ненульові живі
  значення все одно мають пріоритет.

## Де це з’являється

- `/status` у чатах: статусна картка з багатьма емодзі з токенами сесії + оціненою вартістю (лише API-ключ). Використання провайдера показується для **провайдера поточної моделі**, коли доступне, як нормалізоване вікно `X% left` або текстове зведення провайдера.
- `/usage off|tokens|full` у чатах: футер використання для кожної відповіді (OAuth показує лише токени).
- `/usage cost` у чатах: локальне зведення вартості, агреговане з журналів сесій OpenClaw.
- CLI: `openclaw status --usage` друкує повну розбивку за провайдерами.
- CLI: `openclaw channels list` друкує той самий знімок використання поруч із конфігурацією провайдера (використовуйте `--no-usage`, щоб пропустити).
- Рядок меню macOS: розділ "Використання" в Context (лише якщо доступно).

## Стандартний режим футера використання

`/usage off|tokens|full` задає футер для сесії та запам’ятовується для цієї
сесії. `messages.responseUsage` ініціалізує цей режим для сесій, які ще не
вибрали його, тож футер може бути ввімкнений за замовчуванням без введення
`/usage` щоразу.

Задайте один режим для кожного каналу або мапу для кожного каналу з fallback
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

Поле `responseUsage` сесії має три представні стани, кожен з різною
семантикою:

| Стан                 | Збережене значення             | Ефективний режим                                                    |
| -------------------- | ------------------------------ | ------------------------------------------------------------------- |
| **Не задано / успадкувати** | `undefined` (відсутнє)          | Переходить до стандарту конфігурації `messages.responseUsage`, потім `off`. |
| **Явно вимкнено**    | `"off"` (збережено)             | Завжди вимкнено — стандарт конфігурації не `off` не може знову ввімкнути футер. |
| **Явно ввімкнено**   | `"tokens"` або `"full"` (збережено) | Цей режим, незалежно від стандарту конфігурації.                    |

### Пріоритет

Ефективний режим = перевизначення сесії → запис конфігурації каналу → `default` → `off`.

Явне `/usage off` **зберігається** як буквальне значення `"off"` у
сесії, а не те саме, що "не задано." Це означає, що стандарт
`messages.responseUsage` не `off` не може знову ввімкнути футер після того, як
користувач явно вимкнув його.

### Скидання проти вимкнення

- `/usage off` — примусово вимикає футер і зберігає цей вибір. Налаштований
  стандарт не `off` не може перевизначити це.
- `/usage reset` (аліаси: `inherit`, `clear`, `default`) — очищує
  перевизначення сесії. Після цього сесія **успадковує** ефективний стандарт
  конфігурації (`messages.responseUsage`). Якщо стандарт не налаштований, футер
  вимкнений (без змін порівняно з раніше). Використовуйте це, щоб "повернутися
  до стандарту" без явного ввімкнення футера.
- Повне скидання сесії (`/reset` або `/new`) або rollover сесії **зберігає**
  явну перевагу режиму використання, щоб вибір відображення користувача
  переживав rollover-и сесії. Лише `/usage reset` (і його аліаси) фактично
  очищує перевизначення.

### Поведінка перемикача

`/usage` без аргументів циклічно перемикає: off → tokens → full → off. Початкова
точка циклу — **ефективний** поточний режим (перевизначення сесії переходить до
стандарту конфігурації, коли не задане), тож цикл завжди узгоджений із тим, що
користувач бачить у футері.

### Конфігурація

Без конфігурації попередня поведінка зберігається (футер вимкнений до `/usage`).
Використовуйте `/usage reset`, щоб очистити перевизначення сесії та знову
успадкувати налаштований стандарт.

## Користувацький футер `/usage full`

`/usage full` показує вбудований компактний футер із моделлю, reasoning,
fast/slow, контекстним вікном, токенами ходу, кешем і вартістю, коли ці поля
доступні. Файл шаблону не потрібен.

`messages.usageTemplate` призначений лише для просунутих користувацьких макетів.
Значенням є шлях до JSON-файлу (підтримує `~`) або inline-об’єкт, і воно замінює
вбудований футер, коли валідне:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Відсутні або порожні шаблони тихо відступають до вбудованого футера. Нечитабельні
або невалідні налаштовані шаблони також відступають до вбудованого футера та
видають попередження оператору.

Починайте користувацькі шаблони з вбудованої форми, потім редагуйте частини, які
хочете змінити:

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
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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
відкидає порожні та з’єднує ті, що лишилися, за допомогою `sep`. Поверхня без
запису використовує `output.default`.

### Контрактні шляхи

Частина читає значення з контракту для кожного ходу за dot-path. Відсутні
значення порожні (тому guard `when` або `|fallback` зберігає частину чистою).

| Шлях                                                                                | Значення                               |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id каналу (`discord`/`telegram`/тощо)  |
| `model.provider` / `model.display_name`                                             | id провайдера / id моделі              |
| `model.reasoning`                                                                   | зусилля (від `off` до `xhigh`)         |
| `model.is_fallback` / `model.is_override`                                           | bool: використано fallback / модель закріплена |
| `state.fast_mode`                                                                   | bool: fast проти slow                  |
| `context.max_tokens` / `context.pct_used`                                           | бюджет вікна / 0-100 використано       |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | агрегат ходу                           |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guard-и відображення токенів і відсоток кешу |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | лише останній виклик моделі            |
| `cost.turn_usd`                                                                     | оцінена вартість ходу                  |
| `identity.name` / `identity.emoji`                                                  | ім’я агента / вибраний емодзі          |

(Вікна rate-limit провайдера **не** входять до цього контракту.)

### Дієслова

Пропускайте значення через дієслова зліва направо; сегмент, який не є дієсловом,
є fallback.

| Дієслово       | Ефект                                 | Приклад                           |
| -------------- | ------------------------------------- | --------------------------------- |
| `num`          | компактний лічильник                  | `272000 -> 272k`                  |
| `fixed:N`      | N десяткових знаків (стандарт 2)      | `0.0377`                          |
| `dur`          | секунди в тривалість                  | `14820 -> 4h07m`                  |
| `pct`          | додати `%`                            | `96 -> 96%`                       |
| `inv`          | `100 - x`                             | для використаного до залишкового  |
| `alias:TABLE`  | пошук в `aliases`, відлуння, якщо немає в списку | `medium -> 🌗`                    |
| `meter:W:SCALE` | W-клітинкова смуга гліфів для значення 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = один гліф) |

### Форми частин

- `{ "text": "📚 {context.max_tokens|num}" }`: літерал + інтерполяція.
- `{ "when": "<path>", "text": "..." }`: рендерити лише якщо шлях truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: значення в гліф.
- `{ "each": "limits.windows", "item": "{label}" }`: ітерувати масив.

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

відтворює, наприклад, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Провайдери + облікові дані

- **Anthropic (Claude)**: токени OAuth у профілях автентифікації.
- **GitHub Copilot**: токени OAuth у профілях автентифікації.
- **Gemini CLI**: токени OAuth у профілях автентифікації.
  - Використання JSON повертається до `stats`; `stats.cached` нормалізується в
    `cacheRead`.
- **OpenAI Codex**: токени OAuth у профілях автентифікації (`accountId` використовується, коли наявний).
- **MiniMax**: ключ API або профіль автентифікації MiniMax OAuth. OpenClaw трактує
  `minimax`, `minimax-cn` і `minimax-portal` як ту саму поверхню квоти MiniMax,
  надає перевагу збереженому MiniMax OAuth, коли він наявний, а інакше повертається
  до `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` або `MINIMAX_API_KEY`.
  Опитування використання виводить хост Coding Plan із `models.providers.minimax-portal.baseUrl`
  або `models.providers.minimax.baseUrl`, коли налаштовано, а інакше використовує
  хост MiniMax CN.
  Необроблені поля MiniMax `usage_percent` / `usagePercent` означають **залишкову**
  квоту, тому OpenClaw інвертує їх перед показом; поля на основі лічильників мають пріоритет,
  коли наявні.
  - Мітки вікна coding-plan беруться з полів годин/хвилин провайдера, коли
    наявні, а потім повертаються до проміжку `start_time` / `end_time`.
  - Якщо кінцева точка coding-plan повертає `model_remains`, OpenClaw надає перевагу
    запису моделі чату, виводить мітку вікна з часових позначок, коли явні
    поля `window_hours` / `window_minutes` відсутні, і включає назву моделі
    в мітку плану.
- **Xiaomi MiMo**: ключ API через сховище env/config/auth (`XIAOMI_API_KEY`).
- **z.ai**: ключ API через сховище env/config/auth.
- **DeepSeek**: ключ API через сховище env/config/auth (`DEEPSEEK_API_KEY`).
  OpenClaw викликає кінцеву точку балансу DeepSeek і показує повідомлений провайдером
  баланс як текст замість вікна квоти з відсотком залишку.

Використання приховується, коли не вдається визначити придатну автентифікацію використання провайдера. Провайдери
можуть надавати логіку автентифікації використання, специфічну для Plugin; інакше OpenClaw повертається до
відповідних облікових даних OAuth/ключа API з профілів автентифікації, змінних середовища
або конфігурації.

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Використання API і витрати](/uk/reference/api-usage-costs)
- [Кешування промптів](/uk/reference/prompt-caching)
