---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте Plugin рушія контексту
sidebarTitle: Context engine
summary: 'Рушій контексту: підключуване збирання контексту, compaction і життєвий цикл субагентів'
title: Рушій контексту
x-i18n:
    generated_at: "2026-04-26T09:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**Рушій контексту** контролює, як OpenClaw будує контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати давнішу історію та як керувати контекстом через межі субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його за замовчуванням — більшості користувачів ніколи не потрібно це змінювати. Встановлюйте й вибирайте рушій Plugin лише тоді, коли вам потрібна інша логіка збирання, Compaction або міжсесійного відновлення.

## Швидкий початок

<Steps>
  <Step title="Перевірте, який рушій активний">
    ```bash
    openclaw doctor
    # або перевірте конфігурацію безпосередньо:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Встановіть рушій Plugin">
    Plugins рушія контексту встановлюються так само, як і будь-який інший Plugin OpenClaw.

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
          contextEngine: "lossless-claw", // має збігатися із зареєстрованим id рушія в Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Тут розміщується конфігурація, специфічна для Plugin (див. документацію Plugin)
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

Щоразу, коли OpenClaw виконує запит моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберігати або індексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Assemble">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), який уміщується в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compact">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій підсумовує старішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберегти стан, запустити фонову Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого non-ACP harness Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і запит поточного ходу. Codex, як і раніше, керує власною нативною історією потоку та нативним компактором.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Хук отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли транскриптів і необов’язковий TTL. Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли запуск завершується помилкою після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистіть ресурси, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання до системного запиту

Метод `assemble` може повертати рядок `systemPromptAddition`. OpenClaw додає його на початок системного запиту для запуску. Це дає змогу рушіям впроваджувати динамічні вказівки для відновлення, інструкції з отримання даних або підказки з урахуванням контексту без потреби у статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Ingest**: no-op (менеджер сесій сам напряму обробляє збереження повідомлень).
- **Assemble**: pass-through (наявний конвеєр sanitize → validate → limit у runtime обробляє збирання контексту).
- **Compact**: делегує вбудованій підсумковій Compaction, яка створює єдиний підсумок старіших повідомлень і зберігає недавні повідомлення без змін.
- **Після ходу**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Якщо `plugins.slots.contextEngine` не встановлено (або встановлено в `"legacy"`), цей рушій використовується автоматично.

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

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Ідентифікатор, назва, версія рушія та ознака того, чи керує він Compaction |
| `ingest(params)`   | Method   | Зберегти одне повідомлення                               |
| `assemble(params)` | Method   | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Method   | Підсумувати/скоротити контекст                           |

`assemble` повертає `AssembleResult` із такими полями:

<ParamField path="messages" type="Message[]" required>
  Упорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушієм загальної кількості токенів у зібраному контексті. OpenClaw використовує її для рішень щодо порога Compaction і для діагностичної звітності.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного запиту.
</ParamField>

Необов’язкові елементи:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпортує історію). |
| `ingestBatch(params)`          | Method | Пакетно обробити завершений хід. Викликається після завершення запуску з усіма повідомленнями цього ходу одразу. |
| `afterTurn(params)`            | Method | Робота після запуску (зберегти стан, запустити фонову Compaction).                                             |
| `prepareSubagentSpawn(params)` | Method | Налаштувати спільний стан для дочірньої сесії перед її запуском.                                               |
| `onSubagentEnded(params)`      | Method | Очистити ресурси після завершення субагента.                                                                   |
| `dispose()`                    | Method | Звільнити ресурси. Викликається під час вимкнення Gateway або перезавантаження Plugin — не для кожної сесії.   |

### ownsCompaction

`ownsCompaction` визначає, чи залишається для запуску ввімкненою вбудована автоматична Compaction Pi всередині спроби:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій сам керує поведінкою Compaction. OpenClaw вимикає вбудовану авто-Compaction Pi для цього запуску, а реалізація `compact()` у рушії відповідає за `/compact`, аварійну Compaction під час переповнення та будь-яку проактивну Compaction, яку рушій хоче виконувати в `afterTurn()`. OpenClaw усе ще може запускати захист від переповнення перед запитом; коли він прогнозує, що повний транскрипт переповнить ліміт, шлях відновлення викликає `compact()` активного рушія перед надсиланням наступного запиту.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Вбудована авто-Compaction Pi усе ще може запускатися під час виконання запиту, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
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
    Встановіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати вбудовану поведінку Compaction OpenClaw.
  </Tab>
</Tabs>

No-op `compact()` є небезпечним для активного не-власного рушія, оскільки він вимикає звичайний шлях Compaction для `/compact` і відновлення після переповнення для цього слота рушія.

## Довідник конфігурації

```json5
{
  plugins: {
    slots: {
      // Вибирає активний рушій контексту. За замовчуванням: "legacy".
      // Установіть id Plugin, щоб використовувати рушій Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Слот є ексклюзивним під час виконання — для певного запуску або операції Compaction визначається лише один зареєстрований рушій контексту. Інші ввімкнені plugins `kind: "context-engine"` усе ще можуть завантажуватися та виконувати свій код реєстрації; `plugins.slots.contextEngine` лише вибирає, який зареєстрований id рушія OpenClaw визначає, коли йому потрібен рушій контексту.
</Note>

<Note>
**Видалення Plugin:** коли ви видаляєте Plugin, який наразі вибрано в `plugins.slots.contextEngine`, OpenClaw скидає слот назад до значення за замовчуванням (`legacy`). Та сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок із Compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — одна з відповідальностей рушія контексту. Рушій legacy делегує її вбудованому підсумовуванню OpenClaw. Рушії Plugin можуть реалізувати будь-яку стратегію Compaction (підсумки DAG, векторне отримання тощо).
  </Accordion>
  <Accordion title="Plugins пам’яті">
    Plugins пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Plugins пам’яті забезпечують пошук/отримання; рушії контексту керують тим, що бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані Plugin пам’яті під час збирання. Рушіям Plugin, які хочуть використовувати шлях запиту active memory, варто надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює активні секції запиту пам’яті на готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчий рівень контролю, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесії">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується правильно.
- Якщо ви перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією. Новий рушій бере керування на себе для майбутніх запусків.
- Помилки рушія журналюються та відображаються в діагностиці. Якщо рушій Plugin не може зареєструватися або не вдається визначити вибраний id рушія, OpenClaw не виконує автоматичне повернення; запуски завершуватимуться помилкою, доки ви не виправите Plugin або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб прив’язати локальний каталог Plugin без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
- [Контекст](/uk/concepts/context) — як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація plugins рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) — поля маніфесту Plugin
- [Plugins](/uk/tools/plugin) — огляд plugins
