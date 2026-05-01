---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і Plugin-рушієм
    - Ви створюєте Plugin рушія контексту
sidebarTitle: Context engine
summary: 'Рушій контексту: підключуване збирання контексту, Compaction і життєвий цикл субагента'
title: Рушій контексту
x-i18n:
    generated_at: "2026-05-01T14:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

A **рушій контексту** керує тим, як OpenClaw формує контекст моделі для кожного запуску: які повідомлення включати, як узагальнювати давнішу історію та як керувати контекстом на межах субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його за замовчуванням — більшості користувачів ніколи не потрібно це змінювати. Встановлюйте й вибирайте Plugin рушій лише тоді, коли вам потрібна інша поведінка складання, Compaction або пригадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Перевірте, який рушій активний">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Установіть Plugin рушій">
    Plugins рушія контексту встановлюються так само, як будь-який інший OpenClaw Plugin.

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

    Перезапустіть Gateway після встановлення й налаштування.

  </Step>
  <Step title="Поверніться до legacy (необов’язково)">
    Установіть `contextEngine` у `"legacy"` (або повністю видаліть ключ — `"legacy"` є значенням за замовчуванням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає запит до моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Надходження">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Складання">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), що вміщуються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compaction">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій узагальнює давнішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберігати стан, запускати фонову Compaction або оновлювати індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP Codex harness OpenClaw застосовує той самий життєвий цикл, проєктуючи складений контекст в інструкції розробника Codex і запит поточного ходу. Codex і далі володіє своєю нативною історією потоку та нативним компактором.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Хук отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли transcript та необов’язковий TTL. Якщо він повертає handle відкату, OpenClaw викликає його, коли spawn зазнає невдачі після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистіть ресурси, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання системного запиту

Метод `assemble` може повернути рядок `systemPromptAddition`. OpenClaw додає його на початок системного запиту для запуску. Це дає рушіям змогу вставляти динамічні вказівки для пригадування, інструкції з пошуку або контекстно-залежні підказки без потреби у статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Надходження**: без дії (менеджер сесій безпосередньо обробляє збереження повідомлень).
- **Складання**: наскрізна передача (наявний конвеєр sanitize → validate → limit у runtime обробляє складання контексту).
- **Compaction**: делегує вбудованій Compaction з узагальненням, яка створює один підсумок давніших повідомлень і залишає нещодавні повідомлення без змін.
- **Після ходу**: без дії.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Коли `plugins.slots.contextEngine` не задано (або задано як `"legacy"`), цей рушій використовується автоматично.

## Plugin рушії

Plugin може зареєструвати рушій контексту за допомогою Plugin API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
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

Фабрика `ctx` включає необов’язкові значення `config`, `agentDir` і `workspaceDir`,
щоб plugins могли ініціалізувати стан для кожного агента або робочого простору до запуску
першого хука життєвого циклу.

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

| Член               | Тип         | Призначення                                                |
| ------------------ | ----------- | ---------------------------------------------------------- |
| `info`             | Властивість | Ідентифікатор рушія, назва, версія та чи володіє він Compaction |
| `ingest(params)`   | Метод       | Зберегти одне повідомлення                                 |
| `assemble(params)` | Метод       | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Метод       | Узагальнити/зменшити контекст                              |

`assemble` повертає `AssembleResult` із:

<ParamField path="messages" type="Message[]" required>
  Упорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушія щодо загальної кількості токенів у складеному контексті. OpenClaw використовує це для рішень щодо порогів Compaction і діагностичної звітності.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного запиту.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Керує тим, яку оцінку токенів runner використовує для превентивних
  перевірок переповнення. За замовчуванням `"assembled"`, що означає, що
  перевіряється лише оцінка складеного запиту — це доречно для рушіїв, які повертають
  віконний, самодостатній контекст. Установлюйте `"preassembly_may_overflow"` лише
  тоді, коли ваше складене подання може приховати ризик переповнення в базовому
  transcript; тоді runner бере максимум зі складеної оцінки
  та оцінки історії сесії до складання (без віконного обмеження), вирішуючи,
  чи виконувати превентивну Compaction. У будь-якому разі повідомлення, які ви повертаєте,
  усе одно є тим, що бачить модель — `promptAuthority` впливає лише на попередню перевірку.
</ParamField>

`compact` повертає `CompactResult`. Коли Compaction ротує активний
transcript, `result.sessionId` і `result.sessionFile` ідентифікують наступну
сесію, яку має використовувати наступна повторна спроба або хід.

Необов’язкові члени:

| Член                           | Тип   | Призначення                                                                                                    |
| ------------------------------ | ----- | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Метод | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпорт історії). |
| `ingestBatch(params)`          | Метод | Прийняти завершений хід як пакет. Викликається після завершення запуску, з усіма повідомленнями цього ходу одночасно. |
| `afterTurn(params)`            | Метод | Робота життєвого циклу після запуску (зберегти стан, запустити фонову Compaction). |
| `prepareSubagentSpawn(params)` | Метод | Налаштувати спільний стан для дочірньої сесії перед її початком. |
| `onSubagentEnded(params)`      | Метод | Очистити ресурси після завершення субагента. |
| `dispose()`                    | Метод | Звільнити ресурси. Викликається під час завершення роботи Gateway або перезавантаження Plugin — не для кожної сесії. |

### ownsCompaction

`ownsCompaction` керує тим, чи вбудована в Pi автоматична Compaction усередині спроби лишається ввімкненою для запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій володіє поведінкою Compaction. OpenClaw вимикає вбудовану автоматичну Compaction Pi для цього запуску, а реалізація `compact()` у рушії відповідає за `/compact`, Compaction відновлення після переповнення та будь-яку проактивну Compaction, яку він хоче виконувати в `afterTurn()`. OpenClaw усе ще може запускати захист від переповнення перед запитом; коли він прогнозує, що повний transcript переповниться, шлях відновлення викликає `compact()` активного рушія перед надсиланням іншого запиту.
  </Accordion>
  <Accordion title="ownsCompaction: false або не задано">
    Вбудована автоматична Compaction Pi все ще може виконуватися під час виконання запиту, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху Compaction рушія legacy.
</Warning>

Це означає, що є два коректні шаблони для Plugin:

<Tabs>
  <Tab title="Режим володіння">
    Реалізуйте власний алгоритм Compaction і встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Установіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використати вбудовану поведінку Compaction OpenClaw.
  </Tab>
</Tabs>

`compact()` без дії небезпечний для активного рушія, який не володіє Compaction, бо він вимикає нормальний шлях Compaction для `/compact` і відновлення після переповнення для цього engine slot.

## Довідник конфігурації

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

<Note>
Slot є ексклюзивним під час виконання — для певного запуску або операції Compaction розв’язується лише один зареєстрований рушій контексту. Інші ввімкнені plugins з `kind: "context-engine"` усе ще можуть завантажуватися й запускати свій код реєстрації; `plugins.slots.contextEngine` лише вибирає, який зареєстрований ідентифікатор рушія OpenClaw розв’язує, коли йому потрібен рушій контексту.
</Note>

<Note>
**Видалення Plugin:** коли ви видаляєте Plugin, який зараз вибрано як `plugins.slots.contextEngine`, OpenClaw скидає slot назад до значення за замовчуванням (`legacy`). Та сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок із Compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — це одна з відповідальностей рушія контексту. Застарілий рушій делегує її вбудованому узагальненню OpenClaw. Рушії Plugin можуть реалізувати будь-яку стратегію стиснення (узагальнення DAG, векторний пошук тощо).
  </Accordion>
  <Accordion title="Плагіни пам’яті">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Плагіни пам’яті забезпечують пошук/отримання; рушії контексту контролюють, що бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані плагіна пам’яті під час складання. Рушіям Plugin, яким потрібен шлях підказки активної пам’яті, варто надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює розділи підказки активної пам’яті на готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчорівневий контроль, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесій">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується правильно.
- Якщо перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією. Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія записуються в журнал і відображаються в діагностиці. Якщо рушію Plugin не вдається зареєструватися або вибраний ідентифікатор рушія не вдається розв’язати, OpenClaw не повертається автоматично до запасного варіанта; запуски не виконуватимуться, доки ви не виправите плагін або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб прив’язати локальний каталог плагіна без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) — узагальнення довгих розмов
- [Контекст](/uk/concepts/context) — як контекст будується для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація плагінів рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) — поля маніфесту плагіна
- [Плагіни](/uk/tools/plugin) — огляд плагінів
