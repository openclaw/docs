---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте Plugin контекстного рушія
sidebarTitle: Context engine
summary: 'Рушій контексту: модульне складання контексту, Compaction і життєвий цикл субагента'
title: Контекстний рушій
x-i18n:
    generated_at: "2026-04-29T01:24:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

**Рушій контексту** керує тим, як OpenClaw створює контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати старішу історію та як керувати контекстом на межах субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його за замовчуванням — більшості користувачів ніколи не потрібно це змінювати. Установлюйте й вибирайте Plugin-рушій лише тоді, коли вам потрібна інша поведінка збирання, Compaction або пригадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Перевірте, який рушій активний">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Установіть Plugin-рушій">
    Plugin-и рушія контексту встановлюються як будь-який інший Plugin OpenClaw.

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
    Установіть `contextEngine` у `"legacy"` (або повністю вилучіть ключ — `"legacy"` є значенням за замовчуванням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає промпт моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Приймання">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Збирання">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), які вміщуються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Ущільнення">
    Викликається, коли контекстне вікно заповнене або коли користувач запускає `/compact`. Рушій підсумовує старішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберегти стан, запустити фоновий Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP середовища Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і промпт поточного ходу. Codex і далі керує власною нативною історією потоку та нативним ущільнювачем.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Хук отримує ключі батьківської/дочірньої сесій, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли стенограми та необов’язковий TTL. Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли створення завершується помилкою після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистьте ресурси, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання до системного промпта

Метод `assemble` може повернути рядок `systemPromptAddition`. OpenClaw додає його на початок системного промпта для запуску. Це дає рушіям змогу вставляти динамічні вказівки для пригадування, інструкції пошуку або контекстно-залежні підказки без потреби у статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Приймання**: no-op (менеджер сесій напряму обробляє збереження повідомлень).
- **Збирання**: пропускання без змін (наявний конвеєр sanitize → validate → limit у середовищі виконання обробляє збирання контексту).
- **Ущільнення**: делегує вбудованому механізму Compaction із підсумовуванням, який створює єдиний підсумок старіших повідомлень і залишає останні повідомлення без змін.
- **Після ходу**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Коли `plugins.slots.contextEngine` не задано (або його задано як `"legacy"`), цей рушій використовується автоматично.

## Plugin-рушії

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

Фабрика `ctx` містить необов’язкові значення `config`, `agentDir` і `workspaceDir`,
щоб Plugin-и могли ініціалізувати стан для окремого агента або робочого простору до того, як
запуститься перший хук життєвого циклу.

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

| Член               | Тип         | Призначення                                                      |
| ------------------ | ----------- | ---------------------------------------------------------------- |
| `info`             | Властивість | Ідентифікатор рушія, назва, версія та чи керує він Compaction    |
| `ingest(params)`   | Метод       | Зберегти одне повідомлення                                       |
| `assemble(params)` | Метод       | Створити контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Метод       | Підсумувати/зменшити контекст                                    |

`assemble` повертає `AssembleResult` з:

<ParamField path="messages" type="Message[]" required>
  Упорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушія щодо загальної кількості токенів у зібраному контексті. OpenClaw використовує це для рішень щодо порогів Compaction і діагностичних звітів.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного промпта.
</ParamField>

`compact` повертає `CompactResult`. Коли Compaction перемикає активну
стенограму, `result.sessionId` і `result.sessionFile` визначають наступну
сесію, яку має використати наступна повторна спроба або хід.

Необов’язкові члени:

| Член                           | Тип   | Призначення                                                                                                               |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Метод | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпорт історії).  |
| `ingestBatch(params)`          | Метод | Прийняти завершений хід як пакет. Викликається після завершення запуску, з усіма повідомленнями з цього ходу одночасно. |
| `afterTurn(params)`            | Метод | Робота життєвого циклу після запуску (зберегти стан, запустити фоновий Compaction).                                      |
| `prepareSubagentSpawn(params)` | Метод | Налаштувати спільний стан для дочірньої сесії перед її початком.                                                         |
| `onSubagentEnded(params)`      | Метод | Очистити ресурси після завершення субагента.                                                                              |
| `dispose()`                    | Метод | Звільнити ресурси. Викликається під час вимкнення Gateway або перезавантаження Plugin — не для кожної сесії.              |

### ownsCompaction

`ownsCompaction` керує тим, чи залишається ввімкненою вбудована в Pi авто-Compaction у межах спроби для запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій керує поведінкою Compaction. OpenClaw вимикає вбудовану авто-Compaction Pi для цього запуску, а реалізація `compact()` рушія відповідає за `/compact`, Compaction відновлення після переповнення та будь-яку проактивну Compaction, яку вона хоче виконати в `afterTurn()`. OpenClaw все ще може запускати запобіжник переповнення перед промптом; коли він прогнозує, що повна стенограма переповниться, шлях відновлення викликає `compact()` активного рушія перед надсиланням іншого промпта.
  </Accordion>
  <Accordion title="ownsCompaction: false або не задано">
    Вбудована авто-Compaction Pi все ще може виконуватися під час виконання промпта, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху Compaction рушія legacy.
</Warning>

Це означає, що існують два коректні шаблони Plugin:

<Tabs>
  <Tab title="Режим керування">
    Реалізуйте власний алгоритм Compaction і встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Установіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати вбудовану поведінку Compaction OpenClaw.
  </Tab>
</Tabs>

Порожній `compact()` небезпечний для активного рушія, який не керує Compaction, бо він вимикає звичайний шлях Compaction для `/compact` і відновлення після переповнення для цього слота рушія.

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
Слот є ексклюзивним під час виконання — для певного запуску або операції Compaction розв’язується лише один зареєстрований рушій контексту. Інші ввімкнені Plugin-и `kind: "context-engine"` усе ще можуть завантажуватися й виконувати свій код реєстрації; `plugins.slots.contextEngine` лише вибирає, який ідентифікатор зареєстрованого рушія OpenClaw розв’язує, коли йому потрібен рушій контексту.
</Note>

<Note>
**Видалення Plugin:** коли ви видаляєте Plugin, який наразі вибрано як `plugins.slots.contextEngine`, OpenClaw скидає слот назад до значення за замовчуванням (`legacy`). Така сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок із Compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction є однією з відповідальностей рушія контексту. Застарілий рушій делегує це вбудованому підсумовуванню OpenClaw. Plugin-рушії можуть реалізувати будь-яку стратегію Compaction (DAG-підсумки, векторний пошук тощо).
  </Accordion>
  <Accordion title="Плагіни пам’яті">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Плагіни пам’яті забезпечують пошук/отримання даних; рушії контексту керують тим, що бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані плагіна пам’яті під час складання. Plugin-рушіям, яким потрібен шлях запиту Active Memory, варто надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює розділи запиту Active Memory на готовий до додавання на початку `systemPromptAddition`. Якщо рушію потрібен нижчорівневий контроль, він все одно може отримувати необроблені рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Очищення сеансів">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується коректно.
- Якщо перемикаєте рушії, наявні сеанси продовжують роботу зі своєю поточною історією. Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія записуються в журнал і відображаються в діагностиці. Якщо Plugin-рушій не вдається зареєструвати або ідентифікатор вибраного рушія неможливо розв’язати, OpenClaw не повертається автоматично до запасного варіанта; запуски завершуватимуться помилкою, доки ви не виправите Plugin або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб прив’язати локальний каталог Plugin без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
- [Контекст](/uk/concepts/context) — як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація Plugin рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) — поля маніфесту Plugin
- [Плагіни](/uk/tools/plugin) — огляд Plugin
