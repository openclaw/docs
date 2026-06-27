---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і Plugin-рушієм
    - Ви створюєте Plugin рушія контексту
sidebarTitle: Context engine
summary: 'Механізм контексту: підключуване складання контексту, Compaction і життєвий цикл субагента'
title: Рушій контексту
x-i18n:
    generated_at: "2026-06-27T17:25:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

A **рушій контексту** керує тим, як OpenClaw будує контекст моделі для кожного запуску: які повідомлення включати, як підсумовувати старішу історію та як керувати контекстом на межах субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його за замовчуванням - більшості користувачів ніколи не потрібно це змінювати. Установлюйте й вибирайте рушій Plugin лише тоді, коли вам потрібна інша поведінка збирання, Compaction або пригадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Plugin-и рушіїв контексту встановлюються так само, як будь-який інший Plugin OpenClaw.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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
  <Step title="Switch back to legacy (optional)">
    Установіть `contextEngine` на `"legacy"` (або повністю видаліть ключ - `"legacy"` є значенням за замовчуванням).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає промпт моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберегти або проіндексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Assemble">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов'язковий `systemPromptAddition`), що вкладаються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compact">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій підсумовує старішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. After turn">
    Викликається після завершення запуску. Рушій може зберегти стан, запустити фоновий Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованого не-ACP Codex harness OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і промпт поточного ходу. Codex і далі сам керує власною історією треду та власним Compaction.

### Життєвий цикл субагента (необов'язково)

OpenClaw викликає два необов'язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготувати спільний стан контексту до запуску дочірнього запуску. Хук отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні ідентифікатори/файли транскриптів і необов'язковий TTL. Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли spawn завершується помилкою після успішної підготовки. Нативні spawn-и субагентів, які запитують `lightContext` і розв'язуються в `contextMode="isolated"`, навмисно пропускають цей хук, щоб дочірній запуск стартував із легкого bootstrap-контексту без передстартового стану, керованого рушієм контексту.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистити ресурси, коли сесія субагента завершується або змітається.
</ParamField>

### Додавання до системного промпта

Метод `assemble` може повертати рядок `systemPromptAddition`. OpenClaw додає його на початок системного промпта для запуску. Це дає змогу рушіям вставляти динамічні підказки для пригадування, інструкції пошуку або контекстно-залежні підказки без потреби у статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Ingest**: no-op (менеджер сесій напряму обробляє збереження повідомлень).
- **Assemble**: наскрізна передача (наявний конвеєр sanitize → validate → limit у runtime обробляє збирання контексту).
- **Compact**: делегує вбудованому Compaction з підсумовуванням, який створює один підсумок старіших повідомлень і залишає останні повідомлення без змін.
- **After turn**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Коли `plugins.slots.contextEngine` не встановлено (або встановлено на `"legacy"`), цей рушій використовується автоматично.

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

Фабрика `ctx` містить необов'язкові значення `config`, `agentDir` і `workspaceDir`, щоб Plugin-и могли ініціалізувати стан для окремого агента або робочого простору до запуску першого хука життєвого циклу.

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

Обов'язкові члени:

| Член               | Вид       | Призначення                                             |
| ------------------ | --------- | ------------------------------------------------------- |
| `info`             | Властивість | Ідентифікатор рушія, назва, версія та чи керує він Compaction |
| `ingest(params)`   | Метод     | Зберегти одне повідомлення                              |
| `assemble(params)` | Метод     | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Метод     | Підсумувати/зменшити контекст                           |

`assemble` повертає `AssembleResult` з:

<ParamField path="messages" type="Message[]" required>
  Упорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушієм загальної кількості токенів у зібраному контексті. OpenClaw використовує це для рішень щодо порогів Compaction і діагностичного звітування.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного промпта.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Керує тим, яку оцінку токенів runner використовує для превентивних перевірок переповнення. За замовчуванням `"assembled"`, що означає перевірку лише оцінки зібраного промпта - це доречно для рушіїв, які повертають віконний, самодостатній контекст. Установлюйте `"preassembly_may_overflow"` лише тоді, коли ваше зібране представлення може приховати ризик переповнення в базовому транскрипті; тоді runner бере максимум між зібраною оцінкою та оцінкою історії сесії до збирання (без вікна), коли вирішує, чи виконувати превентивний Compaction. У будь-якому разі модель бачить саме ті повідомлення, які ви повертаєте - `promptAuthority` впливає лише на попередню перевірку.
</ParamField>

`compact` повертає `CompactResult`. Коли Compaction ротує активний транскрипт, `result.sessionId` і `result.sessionFile` визначають наступну сесію, яку має використовувати наступна повторна спроба або хід.

Необов'язкові члени:

| Член                           | Вид   | Призначення                                                                                                     |
| ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Метод | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпорт історії). |
| `ingestBatch(params)`          | Метод | Прийняти завершений хід як пакет. Викликається після завершення запуску з усіма повідомленнями з цього ходу одразу. |
| `afterTurn(params)`            | Метод | Робота життєвого циклу після запуску (збереження стану, запуск фонового Compaction).                            |
| `prepareSubagentSpawn(params)` | Метод | Налаштувати спільний стан для дочірньої сесії до її старту.                                                     |
| `onSubagentEnded(params)`      | Метод | Очистити ресурси після завершення субагента.                                                                    |
| `dispose()`                    | Метод | Звільнити ресурси. Викликається під час вимкнення gateway або перезавантаження Plugin - не для кожної сесії.     |

### Налаштування runtime

Хуки життєвого циклу, що виконуються всередині OpenClaw, отримують необов'язковий об'єкт `runtimeSettings`. Це версіонована, внутрішня, read-only поверхня API producer/consumer: OpenClaw створює її для вибраного рушія контексту, а рушій контексту споживає її всередині хуків життєвого циклу. Вона не відображається напряму користувачам і не створює окремої поверхні звітування.

- `schemaVersion`: наразі `1`
- `runtime`: хост OpenClaw, режим runtime (`normal`, `fallback` або `degraded`) і необов'язкові ідентифікатори harness/runtime
- `contextEngineSelection`: ідентифікатор вибраного рушія контексту та джерело вибору
- `executionHost`: ідентифікатор і мітка хоста для поверхні, що викликає хук
- `model`: запитана модель, розв'язана модель, provider і необов'язкова сім'я моделі
- `limits`: бюджет токенів промпта та максимальна кількість вихідних токенів, якщо відомо
- `diagnostics`: закриті коди причин fallback і degraded, якщо відомо

Поля, які можуть бути невідомими, представлені як `null`; дискримінаторні поля, як-от режим runtime і джерело вибору, залишаються non-nullable. Старіші рушії залишаються сумісними: якщо суворий рушій legacy відхиляє `runtimeSettings` як невідому властивість, OpenClaw повторює виклик життєвого циклу без нього замість того, щоб quarantining рушій.

### Вимоги до хоста

Рушії контексту можуть оголошувати вимоги до можливостей хоста в `info.hostRequirements`. OpenClaw перевіряє ці вимоги перед запуском операції та fail-closed з описовою помилкою, коли вибраний runtime не може їх задовольнити.

Для запусків агентів оголошуйте `assemble-before-prompt`, коли рушій має керувати фактичним промптом моделі через `assemble()`:

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

Нативні запуски агентів Codex і OpenClaw embedded задовольняють `assemble-before-prompt`. Generic CLI backend-и ні, тому рушії, які цього вимагають, відхиляються до старту процесу CLI.

### Ізоляція збоїв

OpenClaw ізолює вибраний рушій Plugin від основного шляху відповіді. Якщо не-legacy рушій відсутній, не проходить валідацію контракту, викидає помилку під час створення фабрики або викидає помилку з методу життєвого циклу, OpenClaw quarantines цей рушій для поточного процесу Gateway і знижує роботу рушія контексту до вбудованого рушія `legacy`. Помилка логується разом із невдалою операцією, щоб оператор міг виправити, оновити або вимкнути Plugin, не змушуючи агента замовкнути.

Відмови через вимоги хоста відрізняються: коли рушій оголошує, що runtime
не має потрібної можливості, OpenClaw відмовляє закрито перед початком запуску. Це
захищає рушії, які пошкодили б стан, якби працювали в непідтримуваному хості.

### ownsCompaction

`ownsCompaction` керує тим, чи вбудована в OpenClaw runtime автокомпакція в межах спроби залишається ввімкненою для запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій володіє поведінкою компакції. OpenClaw вимикає вбудовану автокомпакцію OpenClaw runtime для цього запуску, а реалізація `compact()` рушія відповідає за `/compact`, компакцію відновлення після переповнення та будь-яку проактивну компакцію, яку він хоче виконати в `afterTurn()`. OpenClaw усе ще може запускати запобіжник переповнення перед prompt; коли він прогнозує, що повний transcript переповниться, шлях відновлення викликає `compact()` активного рушія перед надсиланням іншого prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Вбудована автокомпакція OpenClaw runtime усе ще може запускатися під час виконання prompt, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху компакції legacy-рушія.
</Warning>

Це означає, що є два допустимі шаблони Plugin:

<Tabs>
  <Tab title="Owning mode">
    Реалізуйте власний алгоритм компакції та встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Встановіть `ownsCompaction: false` і зробіть так, щоб `compact()` викликав `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати вбудовану поведінку компакції OpenClaw.
  </Tab>
</Tabs>

Порожній `compact()` небезпечний для активного рушія, який не володіє компакцією, бо він вимикає звичайний шлях компакції `/compact` і відновлення після переповнення для цього слота рушія.

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
Слот є ексклюзивним під час виконання - для заданого запуску або операції компакції розв’язується лише один зареєстрований context engine. Інші ввімкнені плагіни `kind: "context-engine"` усе ще можуть завантажуватися й запускати свій реєстраційний код; `plugins.slots.contextEngine` лише вибирає, який зареєстрований id рушія OpenClaw розв’язує, коли йому потрібен context engine.
</Note>

<Note>
**Видалення Plugin:** коли ви видаляєте Plugin, який зараз вибрано як `plugins.slots.contextEngine`, OpenClaw скидає слот назад до стандартного значення (`legacy`). Така сама поведінка скидання застосовується до `plugins.slots.memory`. Ручне редагування конфігурації не потрібне.
</Note>

## Зв’язок із компакцією та пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction є одним з обов’язків context engine. Legacy-рушій делегує вбудованому підсумовуванню OpenClaw. Рушії Plugin можуть реалізувати будь-яку стратегію компакції (DAG-підсумки, векторний пошук тощо).
  </Accordion>
  <Accordion title="Memory plugins">
    Плагіни пам’яті (`plugins.slots.memory`) відокремлені від context engines. Плагіни пам’яті надають пошук/отримання; context engines керують тим, що бачить модель. Вони можуть працювати разом - context engine може використовувати дані плагіна пам’яті під час збирання. Рушії Plugin, яким потрібен активний шлях memory prompt, мають віддавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює активні секції memory prompt на готовий до додавання на початок `systemPromptAddition`. Якщо рушію потрібен нижчорівневий контроль, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який context engine активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб перевірити, що ваш рушій завантажується правильно.
- Якщо перемикаєте рушії, наявні сеанси продовжують роботу зі своєю поточною історією. Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія журналюються, а вибраний рушій Plugin ізолюється для поточного процесу Gateway. OpenClaw повертається до `legacy` для користувацьких ходів, щоб відповіді могли продовжуватися, але вам усе одно слід виправити, оновити, вимкнути або видалити несправний Plugin.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб зв’язати локальний каталог Plugin без копіювання.

## Пов’язане

- [Compaction](/uk/concepts/compaction) - підсумовування довгих розмов
- [Контекст](/uk/concepts/context) - як контекст будується для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) - реєстрація плагінів context engine
- [Маніфест Plugin](/uk/plugins/manifest) - поля маніфесту Plugin
- [Плагіни](/uk/tools/plugin) - огляд Plugin
