---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте плагін рушія контексту
sidebarTitle: Context engine
summary: 'Рушій контексту: підключуване збирання контексту, Compaction і життєвий цикл субагентів'
title: Рушій контексту
x-i18n:
    generated_at: "2026-04-27T00:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 932ec0ee67c4dd2768cde9136f51bfaa10c94fe90c3deab9b37838b1113226bb
    source_path: concepts/context-engine.md
    workflow: 15
---

**Рушій контексту** керує тим, як OpenClaw будує контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати давнішу історію та як керувати контекстом через межі субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його за замовчуванням — більшості користувачів ніколи не потрібно це змінювати. Встановлюйте й обирайте рушій Plugin лише тоді, коли вам потрібна інша поведінка збирання, Compaction або пригадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Перевірте, який рушій активний">
    ```bash
    openclaw doctor
    # або перевірте конфігурацію напряму:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Встановіть рушій Plugin">
    Плагіни рушія контексту встановлюються так само, як і будь-який інший плагін OpenClaw.

    <Tabs>
      <Tab title="З npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="З локального шляху">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Увімкніть і виберіть рушій">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // має збігатися із зареєстрованим id рушія плагіна
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Специфічна для Plugin конфігурація додається тут (див. документацію плагіна)
          },
        },
      },
    }
    ```

    Перезапустіть Gateway після встановлення та налаштування.

  </Step>
  <Step title="Поверніться до legacy (необов’язково)">
    Встановіть `contextEngine` у значення `"legacy"` (або повністю видаліть ключ — `"legacy"` використовується за замовчуванням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає запит моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Поглинання">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Збирання">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), що вміщується в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compaction">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій підсумовує старішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберегти стан, запустити фоновий Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP каркаса Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і поточний запит ходу. Codex, як і раніше, сам керує своєю нативною історією потоку та нативним засобом Compaction.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту до запуску дочірнього виконання. Хук отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли транскриптів і необов’язковий TTL. Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли запуск не вдається після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистіть стан, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання до системного запиту

Метод `assemble` може повертати рядок `systemPromptAddition`. OpenClaw додає його на початок системного запиту для запуску. Це дає змогу рушіям впроваджувати динамічні вказівки для пригадування, інструкції з отримання даних або підказки з урахуванням контексту без потреби в статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Поглинання**: no-op (менеджер сесії сам обробляє збереження повідомлень).
- **Збирання**: pass-through (наявний конвеєр sanitize → validate → limit у runtime обробляє збирання контексту).
- **Compaction**: делегує вбудованому підсумковому Compaction, який створює єдиний підсумок старіших повідомлень і зберігає недавні повідомлення без змін.
- **Після ходу**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Якщо `plugins.slots.contextEngine` не встановлено (або встановлено в `"legacy"`), цей рушій використовується автоматично.

## Рушії Plugin

Плагін може зареєструвати рушій контексту через API плагіна:

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
      // Збережіть повідомлення у своєму сховищі даних
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Поверніть повідомлення, що вміщаються в бюджет
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
      // Підсумуйте старіший контекст
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

Обов’язкові члени:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Ідентифікатор, назва, версія рушія та чи він керує Compaction |
| `ingest(params)`   | Method   | Зберегти одне повідомлення                                   |
| `assemble(params)` | Method   | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Method   | Підсумувати/скоротити контекст                                 |

`assemble` повертає `AssembleResult` із такими полями:

<ParamField path="messages" type="Message[]" required>
  Упорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушієм загальної кількості токенів у зібраному контексті. OpenClaw використовує це для рішень щодо порогу Compaction і діагностичної звітності.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного запиту.
</ParamField>

`compact` повертає `CompactResult`. Коли Compaction обертає активний
транскрипт, `result.sessionId` і `result.sessionFile` вказують на сесію-наступника,
яку має використовувати наступна повторна спроба або хід.

Необов’язкові члени:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпорт історії). |
| `ingestBatch(params)`          | Method | Поглинути завершений хід пакетом. Викликається після завершення запуску з усіма повідомленнями цього ходу одразу.     |
| `afterTurn(params)`            | Method | Робота життєвого циклу після запуску (зберегти стан, запустити фоновий Compaction).                                         |
| `prepareSubagentSpawn(params)` | Method | Налаштувати спільний стан для дочірньої сесії до її запуску.                                                       |
| `onSubagentEnded(params)`      | Method | Очистити стан після завершення субагента.                                                                                 |
| `dispose()`                    | Method | Звільнити ресурси. Викликається під час вимкнення Gateway або перезавантаження плагіна — не для кожної сесії.                           |

### ownsCompaction

`ownsCompaction` керує тим, чи залишається увімкненим вбудований автоматичний Compaction Pi під час спроби запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій сам керує поведінкою Compaction. OpenClaw вимикає вбудований автоматичний Compaction Pi для цього запуску, а реалізація `compact()` рушія відповідає за `/compact`, Compaction відновлення після переповнення та будь-який проактивний Compaction, який він хоче виконувати в `afterTurn()`. OpenClaw усе ще може запускати запобіжник переповнення перед запитом; коли він прогнозує, що повний транскрипт спричинить переповнення, шлях відновлення викликає `compact()` активного рушія перед надсиланням іншого запиту.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Вбудований автоматичний Compaction Pi усе ще може виконуватися під час виконання запиту, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху Compaction рушія legacy.
</Warning>

Це означає, що існують два коректні шаблони Plugin:

<Tabs>
  <Tab title="Режим володіння">
    Реалізуйте власний алгоритм Compaction і встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Встановіть `ownsCompaction: false` і нехай `compact()` викликає `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати вбудовану поведінку Compaction OpenClaw.
  </Tab>
</Tabs>

No-op `compact()` є небезпечним для активного рушія без володіння, оскільки вимикає звичайний шлях `/compact` і Compaction відновлення після переповнення для цього слота рушія.

## Довідник із конфігурації

```json5
{
  plugins: {
    slots: {
      // Виберіть активний рушій контексту. За замовчуванням: "legacy".
      // Установіть id плагіна, щоб використовувати рушій Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Слот є ексклюзивним під час виконання — для конкретного запуску або операції Compaction визначається лише один зареєстрований рушій контексту. Інші ввімкнені плагіни `kind: "context-engine"` усе ще можуть завантажуватися й виконувати свій код реєстрації; `plugins.slots.contextEngine` лише вибирає, який зареєстрований id рушія OpenClaw визначає, коли йому потрібен рушій контексту.
</Note>

<Note>
**Видалення плагіна:** коли ви видаляєте плагін, який зараз вибраний як `plugins.slots.contextEngine`, OpenClaw скидає слот до значення за замовчуванням (`legacy`). Та сама поведінка скидання застосовується до `plugins.slots.memory`. Редагувати конфігурацію вручну не потрібно.
</Note>

## Зв’язок із Compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — це одна з відповідальностей рушія контексту. Рушій legacy делегує його вбудованому механізму підсумовування OpenClaw. Рушії Plugin можуть реалізовувати будь-яку стратегію Compaction (підсумки DAG, векторне отримання тощо).
  </Accordion>
  <Accordion title="Плагіни пам’яті">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Плагіни пам’яті надають пошук/отримання; рушії контексту керують тим, що бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані плагіна пам’яті під час збирання. Рушії Plugin, яким потрібен шлях активного запиту пам’яті, мають віддавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює секції активного запиту пам’яті в готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен контроль нижчого рівня, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесії">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, чи ваш рушій завантажується правильно.
- Якщо ви перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією. Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія записуються в журнал і відображаються в діагностиці. Якщо рушій Plugin не вдається зареєструвати або не вдається визначити вибраний id рушія, OpenClaw не виконує автоматичний відкат; запуски завершуються помилкою, доки ви не виправите плагін або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб підключити локальний каталог плагіна без копіювання.

## Пов’язані матеріали

- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
- [Контекст](/uk/concepts/context) — як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація плагінів рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) — поля маніфесту плагіна
- [Плагіни](/uk/tools/plugin) — огляд плагінів
