---
read_when:
    - Ви інтегруєте поведінку життєвого циклу context-engine у середовище Codex
    - Для роботи з вбудованими сеансами тестової обв’язки codex/* потрібен lossless-claw або інший Plugin контекстного рушія
    - Ви порівнюєте поведінку контексту вбудованого PI та сервера застосунку Codex
summary: Специфікація для забезпечення підтримки Plugin-ів рушія контексту OpenClaw у вбудованому harness app-server Codex
title: Портування рушія контексту обв’язки Codex
x-i18n:
    generated_at: "2026-05-03T04:51:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Стан

Чернетка специфікації реалізації.

## Мета

Зробити так, щоб вбудована обгортка Codex app-server дотримувалася того самого
контракту життєвого циклу контекстного рушія OpenClaw, якого вже дотримуються
вбудовані PI-ходи.

Сесія, що використовує `agents.defaults.embeddedHarness.runtime: "codex"` або
модель `codex/*`, все одно має дозволяти вибраному Plugin контекстного рушія,
наприклад `lossless-claw`, керувати збиранням контексту, прийманням даних після
ходу, обслуговуванням і політикою Compaction рівня OpenClaw настільки, наскільки
це дозволяє межа Codex app-server.

## Нецілі

- Не реалізовувати заново внутрішню логіку Codex app-server.
- Не змушувати нативну Compaction потоків Codex створювати зведення lossless-claw.
- Не вимагати від моделей, що не є Codex, використовувати обгортку Codex.
- Не змінювати поведінку сесій ACP/acpx. Ця специфікація стосується лише
  шляху не-ACP вбудованої обгортки агента.
- Не змушувати сторонні Plugins реєструвати фабрики розширень Codex app-server;
  наявна межа довіри для вбудованих Plugins залишається незмінною.

## Поточна архітектура

Вбудований цикл виконання визначає налаштований контекстний рушій один раз за
запуск перед вибором конкретної низькорівневої обгортки:

- `src/agents/pi-embedded-runner/run.ts`
  - ініціалізує Plugins контекстного рушія
  - викликає `resolveContextEngine(params.config)`
  - передає `contextEngine` і `contextTokenBudget` до
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` делегує вибраній обгортці агента:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Обгортку Codex app-server реєструє вбудований Codex Plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Реалізація обгортки Codex отримує ті самі `EmbeddedRunAttemptParams`, що й
спроби на основі PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Це означає, що потрібна точка підключення розташована в коді, контрольованому
OpenClaw. Зовнішня межа - це сам протокол Codex app-server: OpenClaw може
керувати тим, що надсилає до `thread/start`, `thread/resume` і `turn/start`, і
може спостерігати сповіщення, але не може змінювати внутрішнє сховище потоків
Codex або нативний ущільнювач.

## Поточна прогалина

Вбудовані спроби PI безпосередньо викликають життєвий цикл контекстного рушія:

- bootstrap/обслуговування перед спробою
- assemble перед викликом моделі
- afterTurn або ingest після спроби
- обслуговування після успішного ходу
- Compaction контекстного рушія для рушіїв, які володіють Compaction

Відповідний код PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Спроби Codex app-server зараз виконують загальні хуки обгортки агента та
дзеркалять транскрипт, але не викликають `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` або
`params.contextEngine.maintain`.

Відповідний код Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Бажана поведінка

Для ходів обгортки Codex OpenClaw має зберігати такий життєвий цикл:

1. Прочитати дзеркальний транскрипт сесії OpenClaw.
2. Завантажити активний контекстний рушій, коли існує попередній файл сесії.
3. Запустити bootstrap-обслуговування, якщо воно доступне.
4. Зібрати контекст за допомогою активного контекстного рушія.
5. Перетворити зібраний контекст на сумісні з Codex вхідні дані.
6. Запустити або відновити потік Codex з інструкціями розробника, які містять
   будь-яке `systemPromptAddition` контекстного рушія.
7. Запустити хід Codex із зібраним видимим для користувача prompt.
8. Віддзеркалити результат Codex назад у транскрипт OpenClaw.
9. Викликати `afterTurn`, якщо реалізовано, інакше `ingestBatch`/`ingest`,
   використовуючи дзеркальний знімок транскрипта.
10. Запустити обслуговування ходу після успішних нескасованих ходів.
11. Зберегти нативні сигнали Compaction Codex і хуки Compaction OpenClaw.

## Проєктні обмеження

### Codex app-server залишається канонічним для нативного стану потоку

Codex володіє своїм нативним потоком і будь-якою внутрішньою розширеною
історією. OpenClaw не має намагатися змінювати внутрішню історію app-server,
окрім як через підтримувані виклики протоколу.

Дзеркальний транскрипт OpenClaw залишається джерелом для функцій OpenClaw:

- історія чату
- пошук
- облік `/new` і `/reset`
- майбутнє перемикання моделі або обгортки
- стан Plugin контекстного рушія

### Збирання контекстного рушія має проєктуватися у вхідні дані Codex

Інтерфейс контекстного рушія повертає OpenClaw `AgentMessage[]`, а не patch
потоку Codex. Codex app-server `turn/start` приймає поточний користувацький
вхід, тоді як `thread/start` і `thread/resume` приймають інструкції розробника.

Тому реалізації потрібен шар проєкції. Безпечна перша версія має уникати
вдавання, ніби вона може замінити внутрішню історію Codex. Вона має вставляти
зібраний контекст як детермінований матеріал prompt/інструкцій розробника
навколо поточного ходу.

### Стабільність prompt-cache важлива

Для рушіїв на кшталт lossless-claw зібраний контекст має бути детермінованим
для незмінних вхідних даних. Не додавайте timestamps, випадкові ідентифікатори
або недетермінований порядок до згенерованого тексту контексту.

### Семантика вибору runtime не змінюється

Вибір обгортки залишається таким, як є:

- `runtime: "pi"` примусово вибирає PI
- `runtime: "codex"` вибирає зареєстровану обгортку Codex
- `runtime: "auto"` дозволяє Plugin-обгорткам заявляти підтримувані провайдери
- невідповідні запуски `auto` використовують PI

Ця робота змінює те, що відбувається після вибору обгортки Codex.

## План реалізації

### 1. Експортувати або перемістити повторно використовувані helper-и спроб контекстного рушія

Сьогодні повторно використовувані helper-и життєвого циклу живуть у PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex не має імпортувати з шляху реалізації, назва якого натякає на PI, якщо
цього можна уникнути.

Створіть нейтральний до обгортки модуль, наприклад:

- `src/agents/harness/context-engine-lifecycle.ts`

Перемістіть або повторно експортуйте:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- невелику обгортку навколо `runContextEngineMaintenance`

Збережіть працездатність імпортів PI або повторним експортом зі старих файлів,
або оновленням місць виклику PI у тому самому PR.

Нейтральні назви helper-ів не мають згадувати PI.

Запропоновані назви:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Додати helper проєкції контексту Codex

Додайте новий модуль:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Обов'язки:

- Приймати зібраний `AgentMessage[]`, початкову дзеркальну історію та поточний
  prompt.
- Визначати, який контекст належить до інструкцій розробника, а який - до
  поточного користувацького вводу.
- Зберігати поточний користувацький prompt як фінальний придатний до виконання
  запит.
- Рендерити попередні повідомлення у стабільному, явному форматі.
- Уникати мінливої метаінформації.

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

- Додати `systemPromptAddition` до інструкцій розробника.
- Додати зібраний контекст транскрипта перед поточним prompt у `promptText`.
- Чітко позначити його як зібраний контекст OpenClaw.
- Залишити поточний prompt останнім.
- Виключити дубльований поточний користувацький prompt, якщо він уже є в кінці.

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

Це менш елегантно, ніж нативна зміна історії Codex, але це можна реалізувати
всередині OpenClaw, і це зберігає семантику контекстного рушія.

Майбутнє покращення: якщо Codex app-server надасть протокол для заміни або
доповнення історії потоку, перемкніть цей шар проєкції на використання цього
API.

### 3. Підключити bootstrap перед запуском потоку Codex

У `extensions/codex/src/app-server/run-attempt.ts`:

- Прочитати дзеркальну історію сесії, як сьогодні.
- Визначити, чи файл сесії існував до цього запуску. Надавайте перевагу helper-у,
  який перевіряє `fs.stat(params.sessionFile)` перед записами дзеркалення.
- Відкрити `SessionManager` або використати вузький адаптер менеджера сесій,
  якщо helper цього потребує.
- Викликати нейтральний bootstrap-helper, коли існує `params.contextEngine`.

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

Використовуйте ту саму конвенцію `sessionKey`, що й міст інструментів Codex і
дзеркало транскрипта. Сьогодні Codex обчислює `sandboxSessionKey` з
`params.sessionKey` або `params.sessionId`; використовуйте це узгоджено, якщо
немає причини зберігати сирий `params.sessionKey`.

### 4. Підключити assemble перед `thread/start` / `thread/resume` і `turn/start`

У `runCodexAppServerAttempt`:

1. Спершу побудувати динамічні інструменти, щоб контекстний рушій бачив
   фактичні доступні назви інструментів.
2. Прочитати дзеркальну історію сесії.
3. Запустити `assemble(...)` контекстного рушія, коли існує
   `params.contextEngine`.
4. Спроєктувати зібраний результат у:
   - додаток до інструкцій розробника
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

має стати контекстно обізнаним:

1. обчислити базові інструкції розробника через `buildDeveloperInstructions(params)`
2. застосувати збирання/проєкцію контекстного рушія
3. запустити `before_prompt_build` зі спроєктованими prompt/інструкціями розробника

Такий порядок дозволяє загальним prompt-hooks бачити той самий prompt, який
отримає Codex. Якщо потрібна сувора паритетність із PI, запускайте збирання
контекстного рушія перед композицією hooks, оскільки PI застосовує
`systemPromptAddition` контекстного рушія до фінального системного prompt після
свого pipeline prompt. Важливий інваріант полягає в тому, що і контекстний
рушій, і hooks отримують детермінований, задокументований порядок.

Рекомендований порядок для першої реалізації:

1. `buildDeveloperInstructions(params)`
2. `assemble()` контекстного рушія
3. додати `systemPromptAddition` до інструкцій розробника на початку або в кінці
4. спроєктувати зібрані повідомлення в текст prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. передати фінальні інструкції розробника до `startOrResumeThread(...)`
7. передати фінальний текст prompt до `buildTurnStartParams(...)`

Специфікацію слід закодувати в тестах, щоб майбутні зміни випадково не змінили
порядок.

### 5. Зберегти стабільне для prompt-cache форматування

Helper проєкції має створювати байтово стабільний вихід для ідентичних вхідних
даних:

- стабільний порядок повідомлень
- стабільні позначки ролей
- без згенерованих timestamps
- без просочування порядку ключів об'єктів
- без випадкових розділювачів
- без ідентифікаторів на кожен запуск

Використовуйте фіксовані розділювачі та явні секції.

### 6. Підключити post-turn після дзеркалення транскрипта

Codex `CodexAppServerEventProjector` створює локальний `messagesSnapshot` для
поточного ходу. `mirrorTranscriptBestEffort(...)` записує цей знімок у дзеркало
транскрипту OpenClaw.

Після успішного або невдалого дзеркалювання викличте фіналізатор контекстного
рушія з найкращим доступним знімком повідомлень:

- Віддавайте перевагу повному дзеркальному контексту сесії після запису, бо `afterTurn`
  очікує знімок сесії, а не лише поточний хід.
- Поверніться до `historyMessages + result.messagesSnapshot`, якщо файл сесії
  не вдається повторно відкрити.

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

Якщо дзеркалювання не вдається, все одно викличте `afterTurn` із резервним
знімком, але залогуйте, що контекстний рушій приймає дані з резервних даних ходу.

### 7. Нормалізуйте використання та контекст виконання кешу промптів

Результати Codex містять нормалізоване використання з токенових сповіщень
app-server, коли воно доступне. Передайте це використання в контекст виконання
контекстного рушія.

Якщо Codex app-server з часом надасть деталі читання/запису кешу, відобразьте
їх у `ContextEnginePromptCacheInfo`. До того часу пропускайте `promptCache`,
а не вигадуйте нулі.

### 8. Політика Compaction

Існують дві системи Compaction:

1. `compact()` контекстного рушія OpenClaw
2. Нативна `thread/compact/start` Codex app-server

Не змішуйте їх непомітно.

#### `/compact` і явна Compaction OpenClaw

Коли вибраний контекстний рушій має `info.ownsCompaction === true`, явна
Compaction OpenClaw має віддавати перевагу результату `compact()` контекстного
рушія для дзеркала транскрипту OpenClaw і стану Plugin.

Коли вибраний harness Codex має нативне прив'язування потоку, ми можемо
додатково запросити нативну Compaction Codex, щоб підтримувати справність
потоку app-server, але це потрібно повідомляти в деталях як окрему дію бекенда.

Рекомендована поведінка:

- Якщо `contextEngine.info.ownsCompaction === true`:
  - спочатку викликати `compact()` контекстного рушія
  - потім за принципом best-effort викликати нативну Compaction Codex, коли існує прив'язування потоку
  - повернути результат контекстного рушія як основний результат
  - включити статус нативної Compaction Codex у `details.codexNativeCompaction`
- Якщо активний контекстний рушій не володіє Compaction:
  - зберегти поточну поведінку нативної Compaction Codex

Ймовірно, це потребує зміни `extensions/codex/src/app-server/compact.ts` або
обгортання його з загального шляху Compaction, залежно від того, де викликається
`maybeCompactAgentHarnessSession(...)`.

#### Внутрішньохідні події нативного Codex `contextCompaction`

Codex може емітувати події елементів `contextCompaction` під час ходу.
Збережіть поточну емісію хуків до/після Compaction в `event-projector.ts`,
але не розглядайте це як завершену Compaction контекстного рушія.

Для рушіїв, які володіють Compaction, емітуйте явну діагностику, коли Codex
усе одно виконує нативну Compaction:

- назва потоку/події: наявний потік `compaction` прийнятний
- деталі: `{ backend: "codex-app-server", ownsCompaction: true }`

Це робить розділення придатним для аудиту.

### 9. Поведінка скидання сесії та прив'язування

Наявний `reset(...)` harness Codex очищає прив'язування Codex app-server з
файлу сесії OpenClaw. Збережіть цю поведінку.

Також переконайтеся, що очищення стану контекстного рушія й надалі відбувається
через наявні шляхи життєвого циклу сесії OpenClaw. Не додавайте очищення,
специфічне для Codex, якщо життєвий цикл контекстного рушія наразі не пропускає
події reset/delete для всіх harness.

### 10. Обробка помилок

Дотримуйтеся семантики PI:

- помилки bootstrap попереджають і продовжують виконання
- помилки assemble попереджають і повертаються до незібраних повідомлень/промпту конвеєра
- помилки afterTurn/ingest попереджають і позначають післяходову фіналізацію як неуспішну
- обслуговування виконується лише після успішних ходів без abort і yield
- помилки Compaction не слід повторювати як нові промпти

Доповнення, специфічні для Codex:

- Якщо проєкція контексту не вдається, попередьте й поверніться до початкового промпту.
- Якщо дзеркалювання транскрипту не вдається, все одно спробуйте фіналізацію
  контекстного рушія з резервними повідомленнями.
- Якщо нативна Compaction Codex не вдається після успішної Compaction
  контекстного рушія, не провалюйте всю Compaction OpenClaw, коли контекстний
  рушій є основним.

## План тестування

### Модульні тести

Додайте тести в `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex викликає `bootstrap`, коли файл сесії існує.
   - Codex викликає `assemble` із дзеркальними повідомленнями, токеновим бюджетом, назвами інструментів,
     режимом citations, id моделі та промптом.
   - `systemPromptAddition` включено в інструкції розробника.
   - Зібрані повідомлення проєктуються в промпт перед поточним запитом.
   - Codex викликає `afterTurn` після дзеркалювання транскрипту.
   - Без `afterTurn` Codex викликає `ingestBatch` або `ingest` для кожного повідомлення.
   - Обслуговування ходу виконується після успішних ходів.
   - Обслуговування ходу не виконується при помилці промпту, abort або yield abort.

2. `context-engine-projection.test.ts`
   - стабільний вихід для однакових вхідних даних
   - немає дубліката поточного промпту, коли зібрана історія містить його
   - обробляє порожню історію
   - зберігає порядок ролей
   - включає доповнення системного промпту лише в інструкції розробника

3. `compact.context-engine.test.ts`
   - основний результат контекстного рушія-власника має пріоритет
   - статус нативної Compaction Codex з'являється в деталях, коли її також спробували
   - помилка нативної Codex не провалює Compaction контекстного рушія-власника
   - контекстний рушій, який не володіє Compaction, зберігає поточну поведінку нативної Compaction

### Наявні тести для оновлення

- `extensions/codex/src/app-server/run-attempt.test.ts`, якщо є, інакше
  найближчі тести запуску Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` лише якщо змінюються
  деталі події Compaction.
- `src/agents/harness/selection.test.ts` не має потребувати змін, якщо не
  змінюється поведінка конфігурації; він має залишатися стабільним.
- Тести контекстного рушія PI мають і надалі проходити без змін.

### Інтеграційні / live-тести

Додайте або розширте smoke-тести live harness Codex:

- налаштувати `plugins.slots.contextEngine` на тестовий рушій
- налаштувати `agents.defaults.model` на модель `codex/*`
- налаштувати `agents.defaults.embeddedHarness.runtime = "codex"`
- перевірити, що тестовий рушій спостерігав:
  - bootstrap
  - assemble
  - afterTurn або ingest
  - обслуговування

Не вимагайте lossless-claw у тестах ядра OpenClaw. Використайте невеликий
фейковий Plugin контекстного рушія в репозиторії.

## Спостережуваність

Додайте debug-логи навколо викликів життєвого циклу контекстного рушія Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` з причиною
- `codex native compaction completed alongside context-engine compaction`

Уникайте логування повних промптів або вмісту транскриптів.

Додавайте структуровані поля там, де це корисно:

- `sessionId`
- `sessionKey`, відредагований або пропущений відповідно до наявної практики логування
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Міграція / сумісність

Це має бути зворотно сумісним:

- Якщо контекстний рушій не налаштовано, застаріла поведінка контекстного рушія
  має бути еквівалентною сьогоднішній поведінці harness Codex.
- Якщо `assemble` контекстного рушія не вдається, Codex має продовжити роботу
  з початковим шляхом промпту.
- Наявні прив'язування потоків Codex мають залишатися чинними.
- Динамічне fingerprinting інструментів не має включати вихід контекстного рушія; інакше
  кожна зміна контексту могла б примусово створювати новий потік Codex. На динамічний
  fingerprint інструментів має впливати лише каталог інструментів.

## Відкриті питання

1. Чи слід вставляти зібраний контекст повністю в промпт користувача, повністю
   в інструкції розробника, чи розділяти?

   Рекомендація: розділяти. Помістіть `systemPromptAddition` в інструкції розробника;
   помістіть зібраний контекст транскрипту в обгортку промпту користувача. Це найкраще
   відповідає поточному протоколу Codex без мутації нативної історії потоку.

2. Чи слід вимикати нативну Compaction Codex, коли контекстний рушій володіє
   Compaction?

   Рекомендація: ні, не спочатку. Нативна Compaction Codex усе ще може бути
   потрібною, щоб підтримувати потік app-server живим. Але її потрібно повідомляти
   як нативну Compaction Codex, а не як Compaction контекстного рушія.

3. Чи має `before_prompt_build` виконуватися до чи після збирання контекстного рушія?

   Рекомендація: після проєкції контекстного рушія для Codex, щоб загальні хуки
   harness бачили фактичний промпт/інструкції розробника, які отримає Codex. Якщо
   паритет із PI вимагає протилежного, закодуйте вибраний порядок у тестах і
   задокументуйте його тут.

4. Чи може Codex app-server прийняти майбутнє структуроване перевизначення контексту/історії?

   Невідомо. Якщо може, замініть шар текстової проєкції цим протоколом і
   залиште виклики життєвого циклу без змін.

## Критерії приймання

- Хід embedded harness `codex/*` викликає життєвий цикл assemble вибраного
  контекстного рушія.
- `systemPromptAddition` контекстного рушія впливає на інструкції розробника Codex.
- Зібраний контекст детерміновано впливає на вхідні дані ходу Codex.
- Успішні ходи Codex викликають `afterTurn` або резервний ingest.
- Успішні ходи Codex запускають обслуговування ходу контекстного рушія.
- Невдалі/aborted/yield-aborted ходи не запускають обслуговування ходу.
- Compaction, якою володіє контекстний рушій, залишається основною для стану OpenClaw/Plugin.
- Нативна Compaction Codex залишається придатною для аудиту як нативна поведінка Codex.
- Наявна поведінка контекстного рушія PI не змінюється.
- Наявна поведінка harness Codex не змінюється, коли не вибрано незастарілий
  контекстний рушій або коли збирання не вдається.
