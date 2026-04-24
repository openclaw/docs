---
read_when:
    - Ви підключаєте поведінку життєвого циклу context-engine до harness Codex
    - Вам потрібно, щоб lossless-claw або інший Plugin context-engine працював із вбудованими сесіями harness `codex/*`
    - Ви порівнюєте поведінку контексту вбудованого Pi та app-server Codex
summary: Специфікація для того, щоб вбудований harness app-server Codex враховував Plugins context-engine OpenClaw
title: Портування Context Engine для Codex Harness
x-i18n:
    generated_at: "2026-04-24T18:11:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Стан

Чернетка специфікації реалізації.

## Мета

Зробити так, щоб вбудований harness app-server Codex враховував той самий
контракт життєвого циклу context-engine OpenClaw, який уже враховують вбудовані цикли PI.

Сесія, що використовує `agents.defaults.embeddedHarness.runtime: "codex"` або
модель `codex/*`, усе одно має дозволяти вибраному Plugin context-engine, як-от
`lossless-claw`, керувати збиранням контексту, ingest після циклу, обслуговуванням і
політикою Compaction на рівні OpenClaw настільки, наскільки це дозволяє межа app-server Codex.

## Нецілі

- Не перевпроваджувати внутрішню логіку app-server Codex.
- Не змушувати native thread Compaction у Codex створювати підсумок lossless-claw.
- Не вимагати, щоб не-Codex моделі використовували harness Codex.
- Не змінювати поведінку сесій ACP/acpx. Ця специфікація стосується лише
  шляху вбудованого harness агента без ACP.
- Не дозволяти стороннім Plugins реєструвати фабрики розширень app-server Codex;
  наявна межа довіри для вбудованих Plugins залишається без змін.

## Поточна архітектура

Цикл вбудованого запуску один раз на запуск визначає налаштований context engine перед
вибором конкретного низькорівневого harness:

- `src/agents/pi-embedded-runner/run.ts`
  - ініціалізує Plugins context-engine
  - викликає `resolveContextEngine(params.config)`
  - передає `contextEngine` і `contextTokenBudget` у
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` делегує до вибраного harness агента:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex реєструється вбудованим Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Реалізація harness Codex отримує ті самі `EmbeddedRunAttemptParams`, що й спроби на основі PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Це означає, що потрібна точка hook розташована в коді, який контролює OpenClaw. Зовнішня
межа — це сам протокол app-server Codex: OpenClaw може контролювати, що він надсилає до
`thread/start`, `thread/resume` і `turn/start`, і може спостерігати за сповіщеннями, але
не може змінювати внутрішнє сховище thread Codex або native compactor.

## Поточний розрив

Вбудовані спроби PI напряму викликають життєвий цикл context-engine:

- bootstrap/обслуговування перед спробою
- assemble перед викликом моделі
- afterTurn або ingest після спроби
- обслуговування після успішного циклу
- Compaction context-engine для engine-ів, які самі керують Compaction

Відповідний код PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Спроби app-server Codex зараз запускають загальні hook-и agent-harness і дзеркалять
транскрипт, але не викликають `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` або
`params.contextEngine.maintain`.

Відповідний код Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Бажана поведінка

Для циклів harness Codex OpenClaw має зберігати такий життєвий цикл:

1. Прочитати дзеркалений транскрипт сесії OpenClaw.
2. Виконати bootstrap активного context engine, коли існує попередній файл сесії.
3. Запустити bootstrap-обслуговування, якщо воно доступне.
4. Зібрати контекст за допомогою активного context engine.
5. Перетворити зібраний контекст на input, сумісний із Codex.
6. Запустити або відновити thread Codex з developer instructions, що включають будь-який
   `systemPromptAddition` context-engine.
7. Запустити цикл Codex зі зібраним prompt, орієнтованим на користувача.
8. Віддзеркалити результат Codex назад у транскрипт OpenClaw.
9. Викликати `afterTurn`, якщо реалізовано, інакше `ingestBatch`/`ingest`, використовуючи
   знімок дзеркаленого транскрипту.
10. Запустити обслуговування циклу після успішних нескасованих циклів.
11. Зберегти native сигнали Compaction Codex і hook-и Compaction OpenClaw.

## Обмеження дизайну

### App-server Codex залишається канонічним для native стану thread

Codex володіє своїм native thread і будь-якою внутрішньою розширеною історією. OpenClaw не має
намагатися змінювати внутрішню історію app-server інакше, ніж через підтримувані виклики протоколу.

Дзеркало транскрипту OpenClaw залишається джерелом для можливостей OpenClaw:

- історія чату
- пошук
- облік `/new` і `/reset`
- майбутнє перемикання моделі або harness
- стан Plugin context-engine

### Збирання context engine має проєктуватися в input Codex

Інтерфейс context engine повертає `AgentMessage[]` OpenClaw, а не patch thread Codex.
`turn/start` app-server Codex приймає поточний input користувача, тоді як
`thread/start` і `thread/resume` приймають developer instructions.

Тому реалізації потрібен шар проєкції. Безпечна перша версія
не повинна вдавати, що може замінити внутрішню історію Codex. Вона має інжектувати
зібраний контекст як детермінований матеріал prompt/developer instructions навколо
поточного циклу.

### Важлива стабільність prompt-cache

Для engine-ів на кшталт lossless-claw зібраний контекст має бути детермінованим
за незмінних input. Не додавайте часові мітки, випадкові id або недетермінований
порядок до згенерованого тексту контексту.

### Семантика fallback PI не змінюється

Вибір harness залишається без змін:

- `runtime: "pi"` примусово вибирає PI
- `runtime: "codex"` вибирає зареєстрований harness Codex
- `runtime: "auto"` дозволяє harness Plugins заявляти про підтримувані provider-и
- `fallback: "none"` вимикає fallback PI, коли жоден Plugin harness не підходить

Ця робота змінює те, що відбувається після вибору harness Codex.

## План реалізації

### 1. Експортувати або перенести повторно використовувані helper-и спроб context-engine

Зараз повторно використовувані helper-и життєвого циклу розташовані в runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex не повинен імпортувати зі шляху реалізації, назва якого вказує на PI, якщо
цього можна уникнути.

Створіть нейтральний щодо harness модуль, наприклад:

- `src/agents/harness/context-engine-lifecycle.ts`

Перенесіть або реекспортуйте:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- невеликий wrapper навколо `runContextEngineMaintenance`

Збережіть працездатність імпортів PI або через реекспорт зі старих файлів, або
оновивши місця виклику PI у тому самому PR.

Нейтральні назви helper-ів не повинні згадувати PI.

Рекомендовані назви:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Додати helper проєкції контексту Codex

Додайте новий модуль:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Відповідальність:

- Приймати зібрані `AgentMessage[]`, оригінальну дзеркалену історію та поточний
  prompt.
- Визначати, який контекст належить до developer instructions, а який — до поточного
  input користувача.
- Зберігати поточний prompt користувача як фінальний запит до дії.
- Рендерити попередні повідомлення у стабільному, явному форматі.
- Уникати мінливих метаданих.

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

Рекомендована перша проєкція:

- Поміщати `systemPromptAddition` у developer instructions.
- Поміщати зібраний контекст транскрипту перед поточним prompt у `promptText`.
- Чітко позначати його як зібраний контекст OpenClaw.
- Залишати поточний prompt останнім.
- Виключати дубль поточного prompt користувача, якщо він уже присутній наприкінці.

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

Це менш елегантно, ніж native хірургія історії Codex, але це можна реалізувати
всередині OpenClaw і це зберігає семантику context-engine.

Майбутнє покращення: якщо app-server Codex надасть протокол для заміни або
доповнення історії thread, замініть цей шар проєкції на використання того API.

### 3. Підключити bootstrap перед запуском thread Codex

У `extensions/codex/src/app-server/run-attempt.ts`:

- Прочитайте дзеркалену історію сесії, як і зараз.
- Визначте, чи існував файл сесії до цього запуску. Віддайте перевагу helper-у,
  який перевіряє `fs.stat(params.sessionFile)` перед записами дзеркалення.
- Відкрийте `SessionManager` або використайте вузький adapter менеджера сесії, якщо helper
  цього потребує.
- Викличте нейтральний helper bootstrap, коли існує `params.contextEngine`.

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

Використовуйте ту саму домовленість `sessionKey`, що й міст інструментів Codex і дзеркало
транскрипту. Зараз Codex обчислює `sandboxSessionKey` із `params.sessionKey` або
`params.sessionId`; використовуйте це послідовно, якщо немає причини зберігати сирий `params.sessionKey`.

### 4. Підключити assemble перед `thread/start` / `thread/resume` і `turn/start`

У `runCodexAppServerAttempt`:

1. Спочатку побудуйте dynamic tools, щоб context engine бачив фактичні доступні
   назви інструментів.
2. Прочитайте дзеркалену історію сесії.
3. Запустіть `assemble(...)` context-engine, коли існує `params.contextEngine`.
4. Спроєктуйте зібраний результат у:
   - доповнення developer instructions
   - текст prompt для `turn/start`

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
2. застосувати збирання/проєкцію context-engine
3. запустити `before_prompt_build` із проєктованими prompt/developer instructions

Такий порядок дозволяє загальним hook-ам prompt бачити той самий prompt, який отримає Codex. Якщо
потрібен строгий паритет із PI, запускайте збирання context-engine перед композицією hook-ів,
оскільки PI застосовує `systemPromptAddition` context-engine до фінального system prompt після свого
конвеєра prompt. Важлива інваріанта полягає в тому, що і context engine, і hook-и отримують
детермінований, задокументований порядок.

Рекомендований порядок для першої реалізації:

1. `buildDeveloperInstructions(params)`
2. `assemble()` context-engine
3. додати або вставити `systemPromptAddition` у developer instructions
4. спроєктувати зібрані повідомлення в текст prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. передати фінальні developer instructions у `startOrResumeThread(...)`
7. передати фінальний текст prompt у `buildTurnStartParams(...)`

Специфікацію слід закодувати в тестах, щоб майбутні зміни випадково не змінили порядок.

### 5. Зберегти форматування, стабільне для prompt-cache

Helper проєкції має генерувати побайтно стабільний вивід для ідентичних input:

- стабільний порядок повідомлень
- стабільні позначки ролей
- без згенерованих часових міток
- без витоку порядку ключів об’єкта
- без випадкових роздільників
- без id на кожен запуск

Використовуйте фіксовані роздільники та явні секції.

### 6. Підключити post-turn після дзеркалення транскрипту

Codex `CodexAppServerEventProjector` будує локальний `messagesSnapshot` для
поточного циклу. `mirrorTranscriptBestEffort(...)` записує цей знімок у дзеркало
транскрипту OpenClaw.

Після успіху або помилки дзеркалення викличте фіналізатор context-engine з
найкращим доступним знімком повідомлень:

- Віддавайте перевагу повному контексту дзеркаленої сесії після запису, тому що `afterTurn`
  очікує саме знімок сесії, а не лише поточний цикл.
- Переходьте до `historyMessages + result.messagesSnapshot`, якщо файл сесії
  неможливо повторно відкрити.

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

Якщо дзеркалення не вдається, все одно викликайте `afterTurn` із резервним знімком, але записуйте в журнал,
що context-engine виконує ingest із резервних даних циклу.

### 7. Нормалізувати usage і контекст виконання prompt-cache

Результати Codex включають нормалізований usage зі сповіщень app-server про токени, коли це доступно.
Передавайте цей usage до контексту виконання context-engine.

Якщо app-server Codex у майбутньому надасть дані про читання/запис кешу, зіставте їх у
`ContextEnginePromptCacheInfo`. До того часу пропускайте `promptCache`, а не вигадуйте нульові значення.

### 8. Політика Compaction

Є дві системи Compaction:

1. `compact()` context-engine OpenClaw
2. native `thread/compact/start` app-server Codex

Не зливайте їх непомітно в одну.

#### `/compact` і явний Compaction OpenClaw

Коли вибраний context engine має `info.ownsCompaction === true`, явний Compaction OpenClaw
має віддавати перевагу результату `compact()` context-engine для дзеркала транскрипту OpenClaw
і стану Plugin.

Коли вибраний harness Codex має native прив’язку thread, ми додатково можемо
запросити native Compaction Codex, щоб підтримувати thread app-server у здоровому стані, але це
має бути відображено як окрема бекендна дія в details.

Рекомендована поведінка:

- Якщо `contextEngine.info.ownsCompaction === true`:
  - спочатку викликати `compact()` context-engine
  - потім у режимі best-effort викликати native Compaction Codex, коли існує прив’язка thread
  - повертати результат context-engine як основний
  - включати стан native Compaction Codex у `details.codexNativeCompaction`
- Якщо активний context engine не володіє Compaction:
  - зберігати поточну поведінку native Compaction Codex

Імовірно, для цього потрібно змінити `extensions/codex/src/app-server/compact.ts` або
обгорнути його із загального шляху Compaction, залежно від того, де викликається
`maybeCompactAgentHarnessSession(...)`.

#### Native події `contextCompaction` Codex під час циклу

Codex може надсилати події item `contextCompaction` під час циклу. Зберігайте поточну емісію hook-ів
до/після Compaction у `event-projector.ts`, але не трактуйте це як завершений
Compaction context-engine.

Для engine-ів, які володіють Compaction, надсилайте явну діагностику, коли Codex однаково виконує
native Compaction:

- назва потоку/події: наявний потік `compaction` підходить
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Це робить це розділення придатним для аудиту.

### 9. Поведінка reset і прив’язки сесії

Наявний `reset(...)` harness Codex очищає прив’язку app-server Codex із
файлу сесії OpenClaw. Збережіть цю поведінку.

Також переконайтеся, що очищення стану context-engine і далі відбувається через наявні
шляхи життєвого циклу сесії OpenClaw. Не додавайте очищення, специфічне для Codex, якщо
життєвий цикл context-engine зараз не пропускає події reset/delete для всіх harness.

### 10. Обробка помилок

Дотримуйтеся семантики PI:

- збої bootstrap дають попередження і не зупиняють виконання
- збої assemble дають попередження і повертаються до незібраного конвеєра повідомлень/prompt
- збої afterTurn/ingest дають попередження і позначають фіналізацію post-turn як неуспішну
- обслуговування запускається лише після успішних, нескасованих циклів без yield
- помилки Compaction не слід повторювати як нові prompt

Доповнення, специфічні для Codex:

- Якщо проєкція контексту завершується помилкою, дайте попередження і поверніться до початкового prompt.
- Якщо дзеркало транскрипту завершується помилкою, усе одно спробуйте фіналізацію context-engine з
  резервними повідомленнями.
- Якщо native Compaction Codex завершується помилкою після успішного Compaction context-engine,
  не завершуйте з помилкою весь Compaction OpenClaw, коли основним є context-engine.

## План тестування

### Модульні тести

Додайте тести в `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex викликає `bootstrap`, коли існує файл сесії.
   - Codex викликає `assemble` із дзеркаленими повідомленнями, бюджетом токенів, назвами інструментів,
     режимом citations, id моделі та prompt.
   - `systemPromptAddition` включається до developer instructions.
   - Зібрані повідомлення проєктуються в prompt перед поточним запитом.
   - Codex викликає `afterTurn` після дзеркалення транскрипту.
   - Без `afterTurn` Codex викликає `ingestBatch` або `ingest` для кожного повідомлення.
   - Обслуговування циклу запускається після успішних циклів.
   - Обслуговування циклу не запускається за помилки prompt, abort або yield abort.

2. `context-engine-projection.test.ts`
   - стабільний вивід для ідентичних input
   - без дублювання поточного prompt, коли зібрана історія вже його містить
   - обробляє порожню історію
   - зберігає порядок ролей
   - включає доповнення system prompt лише до developer instructions

3. `compact.context-engine.test.ts`
   - основний результат context engine, який володіє процесом, має пріоритет
   - стан native Compaction Codex з’являється в details, коли він також був спробований
   - збій native Codex не призводить до збою Compaction context-engine, який володіє процесом
   - context engine, який не володіє процесом, зберігає поточну поведінку native Compaction

### Наявні тести, які треба оновити

- `extensions/codex/src/app-server/run-attempt.test.ts`, якщо він існує, інакше
  найближчі тести запуску app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` лише якщо змінюються details
  подій Compaction.
- `src/agents/harness/selection.test.ts` не повинен потребувати змін, якщо не змінюється
  поведінка конфігурації; він має залишитися стабільним.
- Тести PI для context-engine мають і далі проходити без змін.

### Інтеграційні / live тести

Додайте або розширте live smoke-тести harness Codex:

- налаштуйте `plugins.slots.contextEngine` на тестовий engine
- налаштуйте `agents.defaults.model` на модель `codex/*`
- налаштуйте `agents.defaults.embeddedHarness.runtime = "codex"`
- перевірте, що тестовий engine спостерігав:
  - bootstrap
  - assemble
  - afterTurn або ingest
  - обслуговування

Уникайте потреби в lossless-claw у core-тестах OpenClaw. Використовуйте невеликий
фейковий Plugin context-engine у репозиторії.

## Спостережуваність

Додайте debug-логи навколо викликів життєвого циклу context-engine Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` із причиною
- `codex native compaction completed alongside context-engine compaction`

Уникайте логування повних prompt або вмісту транскрипту.

Додавайте структуровані поля там, де це корисно:

- `sessionId`
- `sessionKey` у заредагованому вигляді або пропущений згідно з наявною практикою логування
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Міграція / сумісність

Це має бути зворотно сумісним:

- Якщо context engine не налаштовано, застаріла поведінка context engine має бути
  еквівалентною сьогоднішній поведінці harness Codex.
- Якщо `assemble` context-engine завершується помилкою, Codex має продовжити з початковим
  шляхом prompt.
- Наявні прив’язки thread Codex мають залишатися чинними.
- Dynamic fingerprinting інструментів не повинно включати вивід context-engine; інакше
  кожна зміна контексту може змушувати створювати новий thread Codex. На dynamic fingerprint
  має впливати лише каталог інструментів.

## Відкриті питання

1. Чи слід інжектувати зібраний контекст повністю в prompt користувача, повністю
   у developer instructions чи розділяти?

   Рекомендація: розділяти. Поміщати `systemPromptAddition` у developer instructions;
   поміщати зібраний контекст транскрипту в обгортку prompt користувача. Це найкраще відповідає
   поточному протоколу Codex без зміни native історії thread.

2. Чи слід вимикати native Compaction Codex, коли context engine
   володіє Compaction?

   Рекомендація: ні, не на початку. Native Compaction Codex усе ще може бути
   потрібним, щоб підтримувати thread app-server живим. Але про нього треба повідомляти як про
   native Compaction Codex, а не як про Compaction context-engine.

3. Чи має `before_prompt_build` запускатися до чи після збирання context-engine?

   Рекомендація: після проєкції context-engine для Codex, щоб загальні hook-и harness
   бачили фактичні prompt/developer instructions, які отримає Codex. Якщо паритет із PI
   вимагає протилежного, зафіксуйте вибраний порядок у тестах і задокументуйте його
   тут.

4. Чи може app-server Codex приймати майбутнє структуроване перевизначення контексту/історії?

   Невідомо. Якщо так, замініть текстовий шар проєкції цим протоколом і
   залиште виклики життєвого циклу без змін.

## Критерії приймання

- Цикл вбудованого harness `codex/*` викликає життєвий цикл `assemble`
  вибраного context engine.
- `systemPromptAddition` context-engine впливає на developer instructions Codex.
- Зібраний контекст детерміновано впливає на input циклу Codex.
- Успішні цикли Codex викликають `afterTurn` або резервний ingest.
- Успішні цикли Codex запускають обслуговування циклу context-engine.
- Цикли з помилкою/скасовані/yield-aborted не запускають обслуговування циклу.
- Compaction, яким володіє context-engine, залишається основним для стану OpenClaw/Plugin.
- Native Compaction Codex залишається придатним для аудиту як native поведінка Codex.
- Наявна поведінка context-engine PI не змінюється.
- Наявна поведінка harness Codex не змінюється, коли не вибрано context engine, відмінний від legacy,
  або коли assemble завершується помилкою.
