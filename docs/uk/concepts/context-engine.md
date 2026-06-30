---
read_when:
    - Ви хочете зрозуміти, як OpenClaw формує контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте Plugin рушія контексту
sidebarTitle: Context engine
summary: 'Механізм контексту: підключуване складання контексту, Compaction і життєвий цикл субагента'
title: Рушій контексту
x-i18n:
    generated_at: "2026-06-30T14:25:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

<contextengine_docs_i18n_input>
**Рушій контексту** керує тим, як OpenClaw формує контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати давнішу історію та як керувати контекстом на межах підагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його типово - більшості користувачів ніколи не потрібно це змінювати. Встановлюйте й вибирайте рушій Plugin лише тоді, коли вам потрібна інша поведінка складання, Compaction або пригадування між сеансами.

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
    Plugin рушія контексту встановлюються як будь-який інший Plugin OpenClaw.

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

    Перезапустіть gateway після встановлення та налаштування.

  </Step>
  <Step title="Поверніться до legacy (необов'язково)">
    Установіть `contextEngine` на `"legacy"` (або повністю видаліть ключ - `"legacy"` є типовим значенням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає запит до моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Поглинання">
    Викликається, коли до сеансу додається нове повідомлення. Рушій може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Складання">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов'язковий `systemPromptAddition`), що вкладаються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compact">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій підсумовує давнішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберігати стан, запускати фонову Compaction або оновлювати індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP harness Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і запит поточного ходу. Codex і надалі керує власною нативною історією треду та нативним компактором.

### Життєвий цикл підагентів (необов'язково)

OpenClaw викликає два необов'язкові hooks життєвого циклу підагентів:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Hook отримує ключі батьківського/дочірнього сеансів, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли транскриптів і необов'язковий TTL. Якщо він повертає rollback handle, OpenClaw викликає його, коли spawn завершується невдачею після успішної підготовки. Нативні spawn підагентів, які запитують `lightContext` і розв'язуються в `contextMode="isolated"`, навмисно пропускають цей hook, щоб дочірній запуск починався з легкого bootstrap-контексту без керованого рушієм контексту стану перед spawn.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистіть ресурси, коли сеанс підагента завершується або прибирається.
</ParamField>

### Додавання системного prompt

Метод `assemble` може повернути рядок `systemPromptAddition`. OpenClaw додає його на початок системного prompt для запуску. Це дає рушіям змогу ін'єктувати динамічні вказівки для пригадування, інструкції retrieval або контекстно-залежні підказки без потреби в статичних файлах workspace.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Ingest**: no-op (менеджер сеансу напряму обробляє збереження повідомлень).
- **Assemble**: pass-through (наявний pipeline sanitize → validate → limit у runtime обробляє складання контексту).
- **Compact**: делегує вбудованій summarization compaction, яка створює єдиний підсумок давніших повідомлень і залишає нещодавні повідомлення без змін.
- **After turn**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Коли `plugins.slots.contextEngine` не задано (або задано як `"legacy"`), цей рушій використовується автоматично.

## Рушії Plugin

Plugin може зареєструвати рушій контексту за допомогою API Plugin:

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

Factory `ctx` містить необов'язкові значення `config`, `agentDir` і `workspaceDir`,
щоб Plugin могли ініціалізувати стан для кожного агента або workspace до запуску
першого hook життєвого циклу.

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

Обов'язкові members:

| Member             | Kind     | Призначення                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| `info`             | Property | Ідентифікатор рушія, назва, версія та чи керує він Compaction |
| `ingest(params)`   | Method   | Зберегти одне повідомлення                              |
| `assemble(params)` | Method   | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Method   | Підсумувати/зменшити контекст                           |

`assemble` повертає `AssembleResult` з:

<ParamField path="messages" type="Message[]" required>
  Впорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушія щодо загальної кількості токенів у зібраному контексті. OpenClaw використовує її для рішень щодо порога Compaction і діагностичного звітування.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного prompt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Керує тим, яку оцінку токенів runner використовує для превентивних
  prechecks переповнення. Типово `"assembled"`, що означає: для рушіїв,
  які не керують Compaction, перевіряється лише оцінка зібраного
  prompt. Рушії, що задають `ownsCompaction: true`, самі керують admission
  свого prompt, тому OpenClaw типово пропускає загальний precheck перед prompt.
  Установлюйте `"preassembly_may_overflow"` лише тоді, коли ваше зібране подання
  може приховати ризик переповнення в базовому транскрипті; тоді runner залишає
  загальний precheck активним і бере максимум із оцінки зібраного та
  оцінки історії сеансу до складання (без вікна), коли вирішує, чи виконувати
  превентивну Compaction. У будь-якому разі повідомлення, які ви повертаєте,
  усе ще є тим, що бачить модель - `promptAuthority` впливає лише на precheck.
</ParamField>

`compact` повертає `CompactResult`. Коли Compaction ротирує активний
транскрипт, `result.sessionId` і `result.sessionFile` ідентифікують наступний
сеанс, який має використовувати наступна повторна спроба або хід.

Необов'язкові members:

| Member                         | Kind   | Призначення                                                                                                     |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Ініціалізувати стан рушія для сеансу. Викликається один раз, коли рушій уперше бачить сеанс (наприклад, import history). |
| `ingestBatch(params)`          | Method | Поглинути завершений хід як batch. Викликається після завершення запуску з усіма повідомленнями з цього ходу одночасно. |
| `afterTurn(params)`            | Method | Робота життєвого циклу після запуску (збереження стану, запуск фонової Compaction). |
| `prepareSubagentSpawn(params)` | Method | Налаштувати спільний стан для дочірнього сеансу перед його початком. |
| `onSubagentEnded(params)`      | Method | Очистити після завершення підагента.                                                                            |
| `dispose()`                    | Method | Звільнити ресурси. Викликається під час завершення роботи gateway або перезавантаження Plugin - не для кожного сеансу. |

### Налаштування runtime

Hooks життєвого циклу, що виконуються всередині OpenClaw, отримують необов'язковий
об'єкт `runtimeSettings`. Це версіонована, внутрішня, read-only поверхня API
producer/consumer: OpenClaw створює її для вибраного рушія контексту,
а рушій контексту споживає її всередині hooks життєвого циклу. Вона не
рендериться напряму користувачам і не створює окремої поверхні звітування.

- `schemaVersion`: зараз `1`
- `runtime`: хост OpenClaw, режим runtime (`normal`, `fallback` або
  `degraded`) і необов'язкові ідентифікатори harness/runtime
- `contextEngineSelection`: вибраний ідентифікатор рушія контексту та джерело вибору
- `executionHost`: ідентифікатор і мітка хоста для поверхні, що викликає hook
- `model`: запитана модель, розв'язана модель, провайдер і необов'язкова сім'я моделей
- `limits`: бюджет токенів prompt і максимальна кількість вихідних токенів, якщо відомо
- `diagnostics`: закриті коди fallback і degraded reason, якщо відомо

Поля, які можуть бути невідомими, подаються як `null`; discriminator-поля, такі
як режим runtime і джерело вибору, залишаються non-nullable. Старіші рушії
залишаються сумісними: якщо strict legacy рушій відхиляє `runtimeSettings` як
невідому властивість, OpenClaw повторює виклик життєвого циклу без нього, замість
того щоб ізолювати рушій у карантин.

### Вимоги хоста

Рушії контексту можуть оголошувати вимоги до можливостей хоста в `info.hostRequirements`.
OpenClaw перевіряє ці вимоги перед запуском операції та fail closed
з описовою помилкою, коли вибраний runtime не може їх задовольнити.

Для запусків агентів оголошуйте `assemble-before-prompt`, коли рушій має керувати
фактичним prompt моделі через `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Нативні Codex і вбудовані агентські запуски OpenClaw задовольняють `assemble-before-prompt`.
Generic CLI backends не задовольняють, тому рушії, які цього вимагають, відхиляються до запуску
CLI process.

### Ізоляція збоїв
</contextengine_docs_i18n_input>

OpenClaw ізолює вибраний рушій плагіна від основного шляху відповіді. Якщо
незастарілий рушій відсутній, не проходить перевірку контракту, викидає помилку під час створення фабрики
або викидає помилку з методу життєвого циклу, OpenClaw поміщає цей рушій у карантин
для поточного процесу Gateway і понижує роботу context-engine до
вбудованого рушія `legacy`. Помилка записується в журнал разом із невдалою операцією, щоб
оператор міг виправити, оновити або вимкнути плагін без того, щоб агент
замовк.

Збої вимог хоста відрізняються: коли рушій оголошує, що середовище виконання
не має потрібної можливості, OpenClaw завершує роботу закрито до запуску виконання. Це
захищає рушії, які могли б пошкодити стан, якби працювали в непідтримуваному хості.

### ownsCompaction

`ownsCompaction` керує тим, чи залишається вбудоване в середовище виконання OpenClaw автоматичне стиснення всередині спроби ввімкненим для виконання:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій володіє поведінкою стиснення. OpenClaw вимикає вбудоване автоматичне стиснення середовища виконання OpenClaw і загальну попередню перевірку переповнення перед prompt для цього виконання, а реалізація `compact()` рушія відповідає за `/compact`, стиснення для відновлення після переповнення провайдера та будь-яке проактивне стиснення, яке рушій хоче виконувати в `afterTurn()`. OpenClaw все одно запускає захист від переповнення перед prompt, коли рушій повертає `promptAuthority: "preassembly_may_overflow"` з `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false або не задано">
    Вбудоване автоматичне стиснення середовища виконання OpenClaw усе ще може запускатися під час виконання prompt, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху стиснення рушія legacy.
</Warning>

Це означає, що існують два допустимі шаблони плагінів:

<Tabs>
  <Tab title="Режим володіння">
    Реалізуйте власний алгоритм стиснення та встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Встановіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використати вбудовану поведінку стиснення OpenClaw.
  </Tab>
</Tabs>

Порожній `compact()` небезпечний для активного рушія без володіння, тому що він вимикає звичайний шлях стиснення `/compact` і відновлення після переповнення для цього слота рушія.

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
Слот є ексклюзивним під час виконання - для заданого виконання або операції стиснення розв’язується лише один зареєстрований рушій контексту. Інші ввімкнені плагіни `kind: "context-engine"` усе ще можуть завантажуватися й виконувати свій реєстраційний код; `plugins.slots.contextEngine` лише вибирає, який зареєстрований id рушія OpenClaw розв’язує, коли йому потрібен рушій контексту.
</Note>

<Note>
**Видалення плагіна:** коли ви видаляєте плагін, який наразі вибрано як `plugins.slots.contextEngine`, OpenClaw скидає слот назад до типового значення (`legacy`). Така сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок зі стисненням і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction є однією з відповідальностей рушія контексту. Рушій legacy делегує вбудованому підсумовуванню OpenClaw. Рушії плагінів можуть реалізовувати будь-яку стратегію стиснення (підсумки DAG, векторний пошук тощо).
  </Accordion>
  <Accordion title="Плагіни пам’яті">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Плагіни пам’яті забезпечують пошук/отримання; рушії контексту контролюють, що бачить модель. Вони можуть працювати разом - рушій контексту може використовувати дані плагіна пам’яті під час складання. Рушіям плагінів, яким потрібен активний шлях prompt пам’яті, слід надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює активні секції prompt пам’яті на готовий для додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчорівневий контроль, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесії">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується правильно.
- Якщо перемикаєте рушії, наявні сесії продовжують працювати з поточною історією. Новий рушій перебирає майбутні виконання.
- Помилки рушія записуються в журнал, а вибраний рушій плагіна поміщається в карантин для поточного процесу Gateway. OpenClaw повертається до `legacy` для ходів користувача, щоб відповіді могли продовжуватися, але вам усе одно слід виправити, оновити, вимкнути або видалити несправний плагін.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб зв’язати локальний каталог плагіна без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) - підсумовування довгих розмов
- [Контекст](/uk/concepts/context) - як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) - реєстрація плагінів рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) - поля маніфесту плагіна
- [Plugins](/uk/tools/plugin) - огляд плагінів
