---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте Plugin рушія контексту
summary: 'Рушій контексту: підключуване збирання контексту, Compaction і життєвий цикл субагентів'
title: Рушій контексту
x-i18n:
    generated_at: "2026-04-23T20:49:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 279def334ff5d719b0d7af878573fa37f2c81083805098bd5ccfa7e459875d17
    source_path: concepts/context-engine.md
    workflow: 15
---

**Рушій контексту** визначає, як OpenClaw будує контекст моделі для кожного запуску.
Він вирішує, які повідомлення включати, як стискати старішу історію та як
керувати контекстом через межі субагентів.

OpenClaw постачається з вбудованим рушієм `legacy`. Plugins можуть реєструвати
альтернативні рушії, які замінюють активний життєвий цикл рушія контексту.

## Швидкий старт

Перевірте, який рушій активний:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Встановлення Plugin рушія контексту

Plugins рушія контексту встановлюються так само, як і будь-який інший Plugin OpenClaw. Спочатку встановіть
його, а потім виберіть рушій у slot:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Потім увімкніть Plugin і виберіть його як активний рушій у вашій конфігурації:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

Перезапустіть gateway після встановлення та налаштування.

Щоб повернутися до вбудованого рушія, установіть `contextEngine` у `"legacy"` (або
повністю видаліть ключ — `"legacy"` є значенням за замовчуванням).

## Як це працює

Щоразу, коли OpenClaw запускає запит моделі, рушій контексту бере участь у
чотирьох точках життєвого циклу:

1. **Ingest** — викликається, коли до сесії додається нове повідомлення. Рушій
   може зберігати або індексувати повідомлення у власному сховищі даних.
2. **Assemble** — викликається перед кожним запуском моделі. Рушій повертає впорядкований
   набір повідомлень (і необов’язковий `systemPromptAddition`), які вміщуються
   в межі бюджету токенів.
3. **Compact** — викликається, коли контекстне вікно заповнене або коли користувач запускає
   `/compact`. Рушій підсумовує старішу історію, щоб звільнити місце.
4. **After turn** — викликається після завершення запуску. Рушій може зберегти стан,
   запустити фоновий Compaction або оновити індекси.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

- **prepareSubagentSpawn** — підготувати спільний стан контексту до початку
  дочірнього запуску. Хук отримує ключі сесій батьківського/дочірнього процесу, `contextMode`
  (`isolated` або `fork`), доступні id/файли transcript і необов’язковий TTL.
  Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли створення
  завершується невдачею після успішної підготовки.
- **onSubagentEnded** — очищення, коли сесію субагента завершено або прибрано.

### Додавання до системного запиту

Метод `assemble` може повертати рядок `systemPromptAddition`. OpenClaw
додає його на початок системного запиту для запуску. Це дає змогу рушіям вставляти
динамічні вказівки для recall, інструкції для retrieval або контекстно-залежні підказки
без потреби у статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає оригінальну поведінку OpenClaw:

- **Ingest**: no-op (менеджер сесії сам безпосередньо обробляє збереження повідомлень).
- **Assemble**: pass-through (наявний конвеєр sanitize → validate → limit
  у runtime обробляє збирання контексту).
- **Compact**: делегує вбудованому підсумковому Compaction, який створює
  єдине резюме старіших повідомлень і зберігає недоторканими нещодавні повідомлення.
- **After turn**: no-op.

Рушій legacy не реєструє інструменти і не надає `systemPromptAddition`.

Якщо `plugins.slots.contextEngine` не встановлено (або встановлено в `"legacy"`), цей
рушій використовується автоматично.

## Рушії Plugin

Plugin може зареєструвати рушій контексту за допомогою API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Потім увімкніть його в конфігурації:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Інтерфейс ContextEngine

Обов’язкові елементи:

| Елемент            | Тип      | Призначення                                                |
| ------------------ | -------- | ---------------------------------------------------------- |
| `info`             | Property | ID рушія, назва, версія та чи керує він Compaction         |
| `ingest(params)`   | Method   | Зберегти одне повідомлення                                 |
| `assemble(params)` | Method   | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Method   | Підсумувати/зменшити контекст                              |

`assemble` повертає `AssembleResult` із:

- `messages` — впорядковані повідомлення для надсилання моделі.
- `estimatedTokens` (обов’язково, `number`) — оцінка рушієм загальної
  кількості токенів у зібраному контексті. OpenClaw використовує це для рішень
  щодо порога Compaction і для діагностичної звітності.
- `systemPromptAddition` (необов’язково, `string`) — додається на початок системного запиту.

Необов’язкові елементи:

| Елемент                        | Тип    | Призначення                                                                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Method | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, під час імпорту історії). |
| `ingestBatch(params)`         | Method | Поглинути завершений хід як пакет. Викликається після завершення запуску з усіма повідомленнями цього ходу одразу. |
| `afterTurn(params)`           | Method | Робота життєвого циклу після запуску (зберегти стан, запустити фоновий Compaction).                                 |
| `prepareSubagentSpawn(params)`| Method | Налаштувати спільний стан для дочірньої сесії до її початку.                                                        |
| `onSubagentEnded(params)`     | Method | Очистити ресурси після завершення субагента.                                                                        |
| `dispose()`                   | Method | Звільнити ресурси. Викликається під час вимкнення gateway або перезавантаження Plugin — не для кожної сесії.       |

### ownsCompaction

`ownsCompaction` визначає, чи залишається вбудований автоматичний Compaction Pi
увімкненим для запуску:

- `true` — рушій керує поведінкою Compaction. OpenClaw вимикає вбудований
  автоматичний Compaction Pi для цього запуску, а реалізація `compact()` рушія
  відповідає за `/compact`, відновлювальний Compaction після переповнення і будь-який проактивний
  Compaction, який він хоче виконувати в `afterTurn()`.
- `false` або не встановлено — вбудований автоматичний Compaction Pi усе ще може виконуватися під час
  виконання запиту, але метод `compact()` активного рушія все одно викликається для
  `/compact` і відновлення після переповнення.

`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до
шляху Compaction рушія legacy.

Це означає, що є два коректні шаблони Plugin:

- **Режим керування** — реалізуйте власний алгоритм Compaction і встановіть
  `ownsCompaction: true`.
- **Режим делегування** — установіть `ownsCompaction: false` і нехай `compact()` викликає
  `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати
  вбудовану поведінку Compaction OpenClaw.

No-op `compact()` є небезпечним для активного рушія без власного керування, оскільки він
вимикає звичайний шлях `/compact` і відновлення після переповнення для цього slot рушія.

## Довідник із конфігурації

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

Slot є ексклюзивним під час виконання — лише один зареєстрований рушій контексту
визначається для конкретного запуску або операції Compaction. Інші увімкнені
Plugins `kind: "context-engine"` усе ще можуть завантажуватися та виконувати свій код
реєстрації; `plugins.slots.contextEngine` лише вибирає, який зареєстрований id рушія
OpenClaw визначає, коли йому потрібен рушій контексту.

## Зв’язок із Compaction і пам’яттю

- **Compaction** — це одна з відповідальностей рушія контексту. Рушій legacy
  делегує вбудованому підсумковому механізму OpenClaw. Plugins рушії можуть реалізувати
  будь-яку стратегію Compaction (DAG-резюме, vector retrieval тощо).
- **Plugins пам’яті** (`plugins.slots.memory`) відокремлені від рушіїв контексту.
  Plugins пам’яті надають пошук/retrieval; рушії контексту визначають, що
  бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані
  Plugin пам’яті під час збирання. Plugins рушії, яким потрібен активний шлях
  запиту пам’яті, мають віддавати перевагу `buildMemorySystemPromptAddition(...)` з
  `openclaw/plugin-sdk/core`, який перетворює активні секції запиту пам’яті
  на готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчий рівень
  керування, він усе ще може отримати сирі рядки з
  `openclaw/plugin-sdk/memory-host-core` через
  `buildActiveMemoryPromptSection(...)`.
- **Обрізання сесії** (усікання старих результатів інструментів у пам’яті) усе ще виконується
  незалежно від того, який рушій контексту активний.

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, чи правильно завантажується ваш рушій.
- Якщо ви перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією.
  Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія логуються й відображаються в діагностиці. Якщо рушій Plugin
  не вдається зареєструвати або вибраний id рушія не вдається визначити, OpenClaw
  не виконує автоматичного запасного переходу; запуски завершуються помилкою, доки ви не виправите Plugin або
  не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб підключити
  локальний каталог Plugin без копіювання.

Див. також: [Compaction](/uk/concepts/compaction), [Контекст](/uk/concepts/context),
[Plugins](/uk/tools/plugin), [Маніфест Plugin](/uk/plugins/manifest).

## Пов’язане

- [Контекст](/uk/concepts/context) — як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація Plugins рушія контексту
- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
