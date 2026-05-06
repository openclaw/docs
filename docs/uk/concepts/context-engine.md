---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте Plugin для рушія контексту
sidebarTitle: Context engine
summary: 'Контекстний рушій: підключуване складання контексту, Compaction і життєвий цикл субагента'
title: Контекстний рушій
x-i18n:
    generated_at: "2026-05-06T03:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

**механізм контексту** керує тим, як OpenClaw формує контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати давнішу історію та як керувати контекстом на межах субагентів.

OpenClaw постачається з вбудованим механізмом `legacy` і використовує його за замовчуванням - більшості користувачів ніколи не потрібно це змінювати. Установлюйте й вибирайте механізм Plugin лише тоді, коли потрібна інша поведінка збирання, Compaction або пригадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Перевірте, який механізм активний">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Установіть механізм Plugin">
    Plugin механізмів контексту встановлюються як будь-який інший Plugin OpenClaw.

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
  <Step title="Увімкніть і виберіть механізм">
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
  <Step title="Поверніться до legacy (необов’язково)">
    Установіть `contextEngine` у `"legacy"` (або повністю видаліть ключ - `"legacy"` є значенням за замовчуванням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає prompt моделі, механізм контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Приймання">
    Викликається, коли до сесії додається нове повідомлення. Механізм може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Збирання">
    Викликається перед кожним запуском моделі. Механізм повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), що вкладаються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compact">
    Викликається, коли контекстне вікно заповнене або коли користувач запускає `/compact`. Механізм підсумовує давнішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Механізм може зберегти стан, запустити фонову Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP середовища Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і prompt поточного ходу. Codex усе ще керує власною нативною історією потоку та нативним compactor.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові hooks життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Hook отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні transcript ids/files і необов’язковий TTL. Якщо він повертає rollback handle, OpenClaw викликає його, коли створення не вдається після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистьте ресурси, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання до system prompt

Метод `assemble` може повернути рядок `systemPromptAddition`. OpenClaw додає його на початок system prompt для запуску. Це дає механізмам змогу впроваджувати динамічні настанови для пригадування, інструкції з пошуку або контекстно-залежні підказки без потреби в статичних файлах workspace.

## Механізм legacy

Вбудований механізм `legacy` зберігає початкову поведінку OpenClaw:

- **Приймання**: no-op (менеджер сесій безпосередньо обробляє збереження повідомлень).
- **Збирання**: наскрізна передача (наявний конвеєр sanitize → validate → limit у runtime обробляє збирання контексту).
- **Compact**: делегує вбудованій summarization compaction, яка створює один підсумок давніших повідомлень і залишає останні повідомлення без змін.
- **Після ходу**: no-op.

Механізм legacy не реєструє tools і не надає `systemPromptAddition`.

Коли `plugins.slots.contextEngine` не задано (або задано як `"legacy"`), цей механізм використовується автоматично.

## Механізми Plugin

Plugin може зареєструвати механізм контексту за допомогою API Plugin:

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

Фабрика `ctx` містить необов’язкові значення `config`, `agentDir` і `workspaceDir`, щоб plugins могли ініціалізувати стан для окремого агента або workspace до запуску першого hook життєвого циклу.

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

| Член               | Тип        | Призначення                                                  |
| ------------------ | ---------- | ------------------------------------------------------------ |
| `info`             | Властивість | ID механізму, назва, версія та чи володіє він compaction      |
| `ingest(params)`   | Метод      | Зберегти одне повідомлення                                    |
| `assemble(params)` | Метод      | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Метод      | Підсумувати/зменшити контекст                                 |

`assemble` повертає `AssembleResult` з:

<ParamField path="messages" type="Message[]" required>
  Впорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка механізмом загальної кількості токенів у зібраному контексті. OpenClaw використовує це для рішень щодо порога compaction і діагностичних звітів.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок system prompt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Керує тим, яку оцінку токенів runner використовує для превентивних prechecks переповнення. За замовчуванням `"assembled"`, що означає: перевіряється лише оцінка зібраного prompt - доречно для механізмів, які повертають віконний, самодостатній контекст. Установлюйте `"preassembly_may_overflow"` лише тоді, коли ваше зібране представлення може приховати ризик переповнення в базовому transcript; тоді runner бере максимум між оцінкою зібраного prompt і оцінкою історії сесії до збирання (без віконного обмеження), вирішуючи, чи виконувати превентивну compaction. У будь-якому разі модель бачить саме ті повідомлення, які ви повертаєте - `promptAuthority` впливає лише на precheck.
</ParamField>

`compact` повертає `CompactResult`. Коли compaction ротирує активний transcript, `result.sessionId` і `result.sessionFile` визначають наступну сесію, яку має використати наступна повторна спроба або хід.

Необов’язкові члени:

| Член                           | Тип   | Призначення                                                                                                      |
| ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Метод | Ініціалізувати стан механізму для сесії. Викликається один раз, коли механізм уперше бачить сесію (наприклад, import history). |
| `ingestBatch(params)`          | Метод | Прийняти завершений хід як пакет. Викликається після завершення запуску, з усіма повідомленнями цього ходу одночасно. |
| `afterTurn(params)`            | Метод | Робота життєвого циклу після запуску (зберегти стан, запустити фонову compaction).                              |
| `prepareSubagentSpawn(params)` | Метод | Налаштувати спільний стан для дочірньої сесії перед її запуском.                                                  |
| `onSubagentEnded(params)`      | Метод | Очистити ресурси після завершення субагента.                                                                      |
| `dispose()`                    | Метод | Звільнити ресурси. Викликається під час вимкнення gateway або перезавантаження Plugin - не для кожної сесії.      |

### ownsCompaction

`ownsCompaction` керує тим, чи залишається ввімкненою вбудована in-attempt auto-compaction Pi для запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Механізм володіє поведінкою compaction. OpenClaw вимикає вбудовану auto-compaction Pi для цього запуску, а реалізація `compact()` механізму відповідає за `/compact`, compaction для відновлення після переповнення та будь-яку proactive compaction, яку він хоче виконувати в `afterTurn()`. OpenClaw усе ще може запускати pre-prompt захист від переповнення; коли він прогнозує, що повний transcript переповниться, шлях відновлення викликає `compact()` активного механізму перед надсиланням іншого prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false або не задано">
    Вбудована auto-compaction Pi усе ще може запускатися під час виконання prompt, але метод `compact()` активного механізму все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху compaction механізму legacy.
</Warning>

Це означає, що є два допустимі шаблони Plugin:

<Tabs>
  <Tab title="Режим володіння">
    Реалізуйте власний алгоритм compaction і встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Установіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використати вбудовану поведінку compaction OpenClaw.
  </Tab>
</Tabs>

No-op `compact()` небезпечний для активного механізму, що не володіє compaction, бо він вимикає звичайний шлях compaction `/compact` і відновлення після переповнення для цього engine slot.

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
Slot є ексклюзивним під час виконання - для заданого запуску або операції compaction розв’язується лише один зареєстрований механізм контексту. Інші ввімкнені plugins `kind: "context-engine"` усе ще можуть завантажуватися й виконувати свій код реєстрації; `plugins.slots.contextEngine` лише вибирає, який зареєстрований engine id OpenClaw розв’язує, коли йому потрібен механізм контексту.
</Note>

<Note>
**Видалення Plugin:** коли ви видаляєте Plugin, який зараз вибрано як `plugins.slots.contextEngine`, OpenClaw скидає slot назад до значення за замовчуванням (`legacy`). Та сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок із compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — це одна з відповідальностей рушія контексту. Застарілий рушій делегує це вбудованому узагальненню OpenClaw. Plugin-рушії можуть реалізувати будь-яку стратегію Compaction (DAG-узагальнення, векторний пошук тощо).
  </Accordion>
  <Accordion title="Плагіни пам’яті">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Плагіни пам’яті забезпечують пошук/отримання; рушії контексту керують тим, що бачить модель. Вони можуть працювати разом - рушій контексту може використовувати дані плагіна пам’яті під час збирання. Plugin-рушіям, яким потрібен шлях запиту активної пам’яті, слід надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює розділи запиту активної пам’яті на готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчорівневий контроль, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесій">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується правильно.
- Якщо перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією. Новий рушій бере на себе майбутні запуски.
- Помилки рушія записуються в журнал і показуються в діагностиці. Якщо Plugin-рушій не вдається зареєструвати або ідентифікатор вибраного рушія неможливо розв’язати, OpenClaw не виконує автоматичний fallback; запуски завершуються помилкою, доки ви не виправите Plugin або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб зв’язати локальний каталог плагіна без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) - узагальнення довгих розмов
- [Контекст](/uk/concepts/context) - як контекст будується для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) - реєстрація плагінів рушіїв контексту
- [Маніфест Plugin](/uk/plugins/manifest) - поля маніфесту плагіна
- [Плагіни](/uk/tools/plugin) - огляд плагінів
