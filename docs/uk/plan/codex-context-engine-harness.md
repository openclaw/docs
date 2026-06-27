---
read_when:
    - Ви інтегруєте поведінку життєвого циклу context-engine в обв’язку Codex
    - Вам потрібен lossless-claw або інший Plugin рушія контексту для роботи з вбудованими сесіями harness codex/*
    - Ви порівнюєте поведінку контексту вбудованого OpenClaw і сервера застосунку Codex
summary: Специфікація для забезпечення врахування bundled Codex app-server harness Plugin-ів рушія контексту OpenClaw
title: Порт рушія контексту Codex Harness
x-i18n:
    generated_at: "2026-06-27T17:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Статус

Чернетка специфікації реалізації.

## Мета

Зробити так, щоб вбудований harness app-server Codex дотримувався того самого контракту життєвого циклу context-engine OpenClaw, якого вже дотримуються вбудовані звернення OpenClaw.

Сесія, що використовує provider/model `agentRuntime.id: "codex"` або модель `codex/*`, усе одно має дозволяти вибраному Plugin context-engine, наприклад `lossless-claw`, керувати складанням контексту, ingest після звернення, maintenance та політикою Compaction на рівні OpenClaw настільки, наскільки це дозволяє межа app-server Codex.

## Нецілі

- Не реалізовувати повторно внутрішню логіку app-server Codex.
- Не змушувати нативну Compaction потоків Codex створювати зведення lossless-claw.
- Не вимагати від моделей не-Codex використовувати harness Codex.
- Не змінювати поведінку сесій ACP/acpx. Ця специфікація стосується лише
  шляху harness вбудованого агента не-ACP.
- Не змушувати сторонні plugins реєструвати фабрики розширень app-server Codex;
  наявна межа довіри bundled-plugin залишається незмінною.

## Поточна архітектура

Вбудований цикл виконання розв’язує налаштований context engine один раз на запуск перед вибором конкретного низькорівневого harness:

- `src/agents/embedded-agent-runner/run.ts`
  - ініціалізує plugins context-engine
  - викликає `resolveContextEngine(params.config)`
  - передає `contextEngine` і `contextTokenBudget` у
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` делегує вибраному harness агента:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex реєструється вбудованим Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Реалізація harness Codex отримує ті самі `EmbeddedRunAttemptParams`, що й вбудовані спроби OpenClaw:

- `extensions/codex/src/app-server/run-attempt.ts`

Це означає, що потрібна точка підключення розташована в коді, контрольованому OpenClaw. Зовнішньою межею є сам протокол app-server Codex: OpenClaw може керувати тим, що надсилає до `thread/start`, `thread/resume` і `turn/start`, і може спостерігати notifications, але не може змінювати внутрішнє сховище потоків Codex або нативний compactor.

## Поточна прогалина

Вбудовані спроби OpenClaw викликають життєвий цикл context-engine напряму:

- bootstrap/maintenance перед спробою
- assemble перед викликом моделі
- afterTurn або ingest після спроби
- maintenance після успішного звернення
- Compaction context-engine для engines, які володіють Compaction

Релевантний код OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Спроби app-server Codex зараз виконують загальні hooks agent-harness і дзеркалять transcript, але не викликають `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` або `params.contextEngine.maintain`.

Релевантний код Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Бажана поведінка

Для звернень harness Codex OpenClaw має зберігати такий життєвий цикл:

1. Прочитати дзеркальний transcript сесії OpenClaw.
2. Виконати bootstrap активного context engine, коли існує попередній файл сесії.
3. Запустити bootstrap maintenance, коли доступно.
4. Зібрати контекст за допомогою активного context engine.
5. Перетворити зібраний контекст на сумісні з Codex inputs.
6. Запустити або відновити потік Codex з developer instructions, які містять будь-який
   context-engine `systemPromptAddition`.
7. Запустити звернення Codex із зібраним prompt, видимим для користувача.
8. Дзеркалити результат Codex назад у transcript OpenClaw.
9. Викликати `afterTurn`, якщо реалізовано, інакше `ingestBatch`/`ingest`, використовуючи
   дзеркальний snapshot transcript.
10. Запустити maintenance звернення після успішних нескасованих звернень.
11. Зберігати нативні сигнали Compaction Codex і hooks Compaction OpenClaw.

## Обмеження дизайну

### App-server Codex залишається канонічним для нативного стану потоку

Codex володіє своїм нативним потоком і будь-якою внутрішньою розширеною історією. OpenClaw не має намагатися змінювати внутрішню історію app-server, окрім як через підтримувані виклики протоколу.

Дзеркало transcript OpenClaw залишається джерелом для функцій OpenClaw:

- історія чату
- пошук
- облік `/new` і `/reset`
- майбутнє перемикання моделі або harness
- стан Plugin context-engine

### Складання context engine має проєктуватися в inputs Codex

Інтерфейс context-engine повертає OpenClaw `AgentMessage[]`, а не patch потоку Codex. App-server Codex `turn/start` приймає поточний input користувача, тоді як `thread/start` і `thread/resume` приймають developer instructions.

Тому реалізації потрібен шар projection. Перша безпечна версія має уникати удавання, що вона може замінити внутрішню історію Codex. Вона має впроваджувати зібраний контекст як детермінований матеріал prompt/developer-instruction навколо поточного звернення.

### Стабільність prompt-cache має значення

Для engines на кшталт lossless-claw зібраний контекст має бути детермінованим для незмінених inputs. Не додавайте timestamps, випадкові ids або недетерміноване впорядкування до згенерованого тексту контексту.

### Семантика вибору runtime не змінюється

Вибір harness залишається як є:

- `runtime: "openclaw"` вибирає вбудований harness OpenClaw
- `runtime: "codex"` вибирає зареєстрований harness Codex
- `runtime: "auto"` дозволяє harness plugins заявляти підтримувані providers
- невідповідні запуски `auto` використовують вбудований harness OpenClaw

Ця робота змінює те, що відбувається після вибору harness Codex.

## План реалізації

### 1. Експортувати або перемістити повторно використовувані helpers спроб context-engine

Сьогодні повторно використовувані helpers життєвого циклу розташовані під embedded agent runner:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex має імпортувати нейтральні до harness helpers, а не звертатися до деталей реалізації runner.

Створіть нейтральний до harness module, наприклад:

- `src/agents/harness/context-engine-lifecycle.ts`

Перемістіть або реекспортуйте:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- невелику обгортку навколо `runContextEngineMaintenance`

Оновіть call sites вбудованого harness у тому самому PR.

Нейтральні назви helpers не мають згадувати вбудований harness.

Запропоновані назви:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Додати helper projection контексту Codex

Додайте новий module:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Обов’язки:

- Приймати зібраний `AgentMessage[]`, початкову дзеркальну history та поточний
  prompt.
- Визначати, який context належить до developer instructions, а який до поточного user
  input.
- Зберігати поточний user prompt як фінальний actionable request.
- Рендерити попередні messages у стабільному, явному format.
- Уникати volatile metadata.

Запропонований API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Рекомендована перша projection:

- Покласти `systemPromptAddition` у developer instructions.
- Покласти зібраний transcript context перед поточним prompt у `promptText`.
- Чітко позначити його як зібраний context OpenClaw.
- Тримати поточний prompt останнім.
- Виключити дубльований поточний user prompt, якщо він уже з’являється в tail.

Приклад форми prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Це менш елегантно, ніж нативна операція з history Codex, але це реалізовно всередині OpenClaw і зберігає семантику context-engine.

Майбутнє покращення: якщо app-server Codex надасть протокол для заміни або доповнення history потоку, перемкнути цей шар projection на використання того API.

### 3. Підключити bootstrap перед запуском потоку Codex

У `extensions/codex/src/app-server/run-attempt.ts`:

- Читати дзеркальну history сесії, як сьогодні.
- Визначати, чи існував файл сесії до цього запуску. Надайте перевагу helper,
  який перевіряє `fs.stat(params.sessionFile)` перед дзеркальними записами.
- Відкрити `SessionManager` або використати вузький adapter session manager, якщо helper
  цього потребує.
- Викликати нейтральний bootstrap helper, коли існує `params.contextEngine`.

Псевдопотік:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Використовуйте ту саму convention `sessionKey`, що й tool bridge Codex і дзеркало transcript. Сьогодні Codex обчислює `sandboxSessionKey` з `params.sessionKey` або `params.sessionId`; використовуйте це послідовно, якщо немає причини зберігати сирий `params.sessionKey`.

### 4. Підключити assemble перед `thread/start` / `thread/resume` і `turn/start`

У `runCodexAppServerAttempt`:

1. Спершу побудувати dynamic tools, щоб context engine бачив фактичні доступні
   назви tools.
2. Прочитати дзеркальну history сесії.
3. Запустити context-engine `assemble(...)`, коли існує `params.contextEngine`.
4. Спроєктувати зібраний result у:
   - додаток до developer instruction
   - prompt text для `turn/start`

Наявний виклик hook:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

має стати context-aware:

1. обчислити базові developer instructions через `buildDeveloperInstructions(params)`
2. застосувати context-engine assembly/projection
3. запустити `before_prompt_build` із спроєктованими prompt/developer instructions

Цей порядок дозволяє загальним prompt hooks бачити той самий prompt, який отримає Codex. Якщо потрібна строга паритетність з OpenClaw, запускайте context-engine assembly перед composition hook, бо вбудований harness застосовує context-engine `systemPromptAddition` до фінального system prompt після свого prompt pipeline. Важливий інваріант полягає в тому, що і context engine, і hooks отримують детермінований, задокументований порядок.

Рекомендований порядок для першої реалізації:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. append/prepend `systemPromptAddition` до developer instructions
4. спроєктувати assembled messages у prompt text
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. передати фінальні developer instructions до `startOrResumeThread(...)`
7. передати фінальний prompt text до `buildTurnStartParams(...)`

Специфікацію слід закодувати в tests, щоб майбутні зміни випадково не змінили порядок.

### 5. Зберегти стабільне форматування prompt-cache

Projection helper має створювати byte-stable output для однакових inputs:

- стабільний порядок messages
- стабільні role labels
- без згенерованих timestamps
- без leakage порядку object keys
- без випадкових delimiters
- без ids на кожен запуск

Використовуйте фіксовані delimiters і явні sections.

### 6. Підключити post-turn після дзеркалення transcript

Codex `CodexAppServerEventProjector` створює локальний `messagesSnapshot` для
поточного ходу. `mirrorTranscriptBestEffort(...)` записує цей знімок у
дзеркало транскрипту OpenClaw.

Після успішного або невдалого дзеркалювання викличте фіналізатор контекстного рушія з
найкращим доступним знімком повідомлень:

- Надавайте перевагу повному дзеркальному контексту сесії після запису, бо `afterTurn`
  очікує знімок сесії, а не лише поточний хід.
- Повертайтеся до `historyMessages + result.messagesSnapshot`, якщо файл сесії
  не вдається відкрити повторно.

Псевдопотік:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Якщо дзеркалювання не вдається, усе одно викличте `afterTurn` із резервним знімком, але запишіть у журнал,
що контекстний рушій приймає дані з резервних даних ходу.

### 7. Нормалізуйте використання та runtime-контекст кешу запитів

Результати Codex містять нормалізоване використання з повідомлень про токени app-server, коли
вони доступні. Передайте це використання в runtime-контекст контекстного рушія.

Якщо app-server Codex зрештою відкриє деталі читання/запису кешу, зіставте їх із
`ContextEnginePromptCacheInfo`. До того часу пропускайте `promptCache`, а не
вигадуйте нулі.

### 8. Політика Compaction

Існують дві системи Compaction:

1. `compact()` контекстного рушія OpenClaw
2. Нативний `thread/compact/start` app-server Codex

Не змішуйте їх непомітно.

#### `/compact` і явна Compaction OpenClaw

Коли вибраний контекстний рушій має `info.ownsCompaction === true`, явна
Compaction OpenClaw має віддавати перевагу результату `compact()` контекстного рушія для
дзеркала транскрипту OpenClaw і стану Plugin.

Коли вибраний harness Codex має нативну прив’язку до потоку, ми можемо додатково
запитати нативну Compaction Codex, щоб підтримувати здоровий стан потоку app-server, але це
потрібно повідомляти як окрему дію бекенда в деталях.

Рекомендована поведінка:

- Якщо `contextEngine.info.ownsCompaction === true`:
  - спочатку викличте `compact()` контекстного рушія
  - потім best-effort викличте нативну Compaction Codex, коли існує прив’язка до потоку
  - поверніть результат контекстного рушія як основний результат
  - включіть статус нативної Compaction Codex у `details.codexNativeCompaction`
- Якщо активний контекстний рушій не володіє Compaction:
  - збережіть поточну поведінку нативної Compaction Codex

Імовірно, це потребує зміни `extensions/codex/src/app-server/compact.ts` або
обгортання з універсального шляху Compaction, залежно від того, де
викликається `maybeCompactAgentHarnessSession(...)`.

#### Внутрішньоходові нативні події contextCompaction Codex

Codex може емітувати події елементів `contextCompaction` під час ходу. Збережіть поточну
емісію хуків Compaction before/after у `event-projector.ts`, але не вважайте
це завершеною Compaction контекстного рушія.

Для рушіїв, які володіють Compaction, емітуйте явну діагностику, коли Codex усе ж виконує
нативну Compaction:

- назва stream/event: наявний потік `compaction` є прийнятним
- деталі: `{ backend: "codex-app-server", ownsCompaction: true }`

Це робить розділення придатним для аудиту.

### 9. Скидання сесії та поведінка прив’язки

Наявний `reset(...)` harness Codex очищає прив’язку app-server Codex із
файлу сесії OpenClaw. Збережіть цю поведінку.

Також переконайтеся, що очищення стану контекстного рушія й надалі відбувається через наявні
шляхи життєвого циклу сесії OpenClaw. Не додавайте специфічне для Codex очищення, якщо
життєвий цикл контекстного рушія наразі не пропускає події reset/delete для всіх harness.

### 10. Обробка помилок

Дотримуйтеся вбудованої семантики OpenClaw:

- помилки bootstrap записують попередження й продовжують виконання
- помилки assemble записують попередження й повертаються до незібраних повідомлень/запиту pipeline
- помилки afterTurn/ingest записують попередження й позначають післяходову фіналізацію як неуспішну
- maintenance запускається лише після успішних, не перерваних, не yield ходів
- помилки Compaction не слід повторювати як нові запити

Специфічні для Codex доповнення:

- Якщо проєкція контексту не вдається, запишіть попередження й поверніться до початкового запиту.
- Якщо дзеркало транскрипту не вдається, усе одно спробуйте фіналізацію контекстного рушія з
  резервними повідомленнями.
- Якщо нативна Compaction Codex не вдається після успішної Compaction контекстного рушія,
  не провалюйте всю Compaction OpenClaw, коли контекстний рушій є основним.

## План тестування

### Модульні тести

Додайте тести в `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex викликає `bootstrap`, коли існує файл сесії.
   - Codex викликає `assemble` із дзеркальними повідомленнями, бюджетом токенів, назвами інструментів,
     режимом цитувань, ідентифікатором моделі та запитом.
   - `systemPromptAddition` включено в інструкції розробника.
   - Зібрані повідомлення проєктуються в запит перед поточним запитом.
   - Codex викликає `afterTurn` після дзеркалювання транскрипту.
   - Без `afterTurn` Codex викликає `ingestBatch` або `ingest` для кожного повідомлення.
   - Maintenance ходу запускається після успішних ходів.
   - Maintenance ходу не запускається під час помилки запиту, abort або yield abort.

2. `context-engine-projection.test.ts`
   - стабільний вивід для ідентичних вхідних даних
   - немає дубліката поточного запиту, коли зібрана історія містить його
   - обробляє порожню історію
   - зберігає порядок ролей
   - включає додавання системного запиту лише в інструкції розробника

3. `compact.context-engine.test.ts`
   - основний результат контекстного рушія, що володіє Compaction, перемагає
   - статус нативної Compaction Codex з’являється в деталях, коли її також спробували виконати
   - нативна помилка Codex не провалює Compaction контекстного рушія, що володіє Compaction
   - контекстний рушій, що не володіє Compaction, зберігає поточну поведінку нативної Compaction

### Наявні тести для оновлення

- `extensions/codex/src/app-server/run-attempt.test.ts`, якщо він існує, інакше
  найближчі тести запуску app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` лише якщо змінюються
  деталі подій Compaction.
- `src/agents/harness/selection.test.ts` не має потребувати змін, якщо не змінюється
  поведінка конфігурації; він має залишатися стабільним.
- Вбудовані тести контекстного рушія harness мають і надалі проходити без змін.

### Інтеграційні / live-тести

Додайте або розширте smoke-тести live harness Codex:

- налаштуйте `plugins.slots.contextEngine` на тестовий рушій
- налаштуйте `agents.defaults.model` на модель `codex/*`
- налаштуйте provider/model `agentRuntime.id = "codex"`
- перевірте, що тестовий рушій спостерігав:
  - bootstrap
  - assemble
  - afterTurn або ingest
  - maintenance

Не вимагайте lossless-claw у core-тестах OpenClaw. Використовуйте невеликий in-repo фейковий
Plugin контекстного рушія.

## Спостережуваність

Додайте debug-журнали навколо викликів життєвого циклу контекстного рушія Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` з причиною
- `codex native compaction completed alongside context-engine compaction`

Уникайте журналювання повних запитів або вмісту транскриптів.

Додавайте структуровані поля, де корисно:

- `sessionId`
- `sessionKey` редаговано або пропущено відповідно до наявної практики журналювання
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Міграція / сумісність

Це має бути зворотно сумісним:

- Якщо контекстний рушій не налаштовано, legacy-поведінка контекстного рушія має бути
  еквівалентною поточній поведінці harness Codex.
- Якщо `assemble` контекстного рушія не вдається, Codex має продовжити з початковим
  шляхом запиту.
- Наявні прив’язки потоків Codex мають залишатися валідними.
- Динамічний fingerprint інструментів не має включати вивід контекстного рушія; інакше
  кожна зміна контексту могла б примусово створювати новий потік Codex. Лише каталог інструментів
  має впливати на динамічний fingerprint інструментів.

## Відкриті питання

1. Чи потрібно ін’єктувати зібраний контекст повністю в запит користувача, повністю
   в інструкції розробника, чи розділити?

   Рекомендація: розділити. Помістіть `systemPromptAddition` в інструкції розробника;
   помістіть зібраний контекст транскрипту в обгортку запиту користувача. Це найкраще відповідає
   поточному протоколу Codex без мутації нативної історії потоку.

2. Чи потрібно вимикати нативну Compaction Codex, коли контекстний рушій володіє
   Compaction?

   Рекомендація: ні, не спочатку. Нативна Compaction Codex усе ще може бути
   необхідною, щоб підтримувати потік app-server живим. Але її потрібно повідомляти як
   нативну Compaction Codex, а не як Compaction контекстного рушія.

3. Чи має `before_prompt_build` запускатися до чи після збирання контекстного рушія?

   Рекомендація: після проєкції контекстного рушія для Codex, щоб універсальні хуки harness
   бачили фактичний запит/інструкції розробника, які отримає Codex. Якщо
   паритет із вбудованим harness потребує протилежного, закодуйте вибраний порядок у
   тестах і задокументуйте його тут.

4. Чи може app-server Codex приймати майбутнє структуроване перевизначення context/history?

   Невідомо. Якщо може, замініть шар текстової проєкції цим протоколом і
   залиште виклики життєвого циклу незмінними.

## Критерії приймання

- Хід embedded harness `codex/*` викликає життєвий цикл assemble вибраного контекстного рушія.
- `systemPromptAddition` контекстного рушія впливає на інструкції розробника Codex.
- Зібраний контекст детерміновано впливає на вхід ходу Codex.
- Успішні ходи Codex викликають `afterTurn` або резервний ingest.
- Успішні ходи Codex запускають maintenance ходу контекстного рушія.
- Невдалі/aborted/yield-aborted ходи не запускають maintenance ходу.
- Compaction, якою володіє контекстний рушій, залишається основною для стану OpenClaw/Plugin.
- Нативна Compaction Codex залишається придатною для аудиту як нативна поведінка Codex.
- Наявна поведінка вбудованого контекстного рушія harness не змінюється.
- Наявна поведінка harness Codex не змінюється, коли не вибрано non-legacy контекстний рушій
  або коли assembly не вдається.
