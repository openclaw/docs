---
read_when:
    - Вы подключаете поведение жизненного цикла context-engine к Codex harness
    - Для работы со встроенными сессиями harness codex/* требуется lossless-claw или другой context-engine Plugin.
    - Вы сравниваете поведение контекста встроенных OpenClaw и сервера приложений Codex
summary: Спецификация для того, чтобы встроенная обвязка app-server Codex учитывала плагины движка контекста OpenClaw
title: Порт движка контекста Codex Harness
x-i18n:
    generated_at: "2026-06-28T23:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Статус

Черновая спецификация реализации.

## Цель

Сделать так, чтобы встроенный харнесс Codex app-server соблюдал тот же контракт жизненного цикла движка контекста OpenClaw, который уже соблюдают встроенные ходы OpenClaw.

Сессия, использующая provider/model `agentRuntime.id: "codex"` или модель `codex/*`, должна по-прежнему позволять выбранному Plugin движка контекста, например `lossless-claw`, управлять сборкой контекста, ingest после хода, обслуживанием и политикой Compaction уровня OpenClaw настолько, насколько это допускает граница Codex app-server.

## Не цели

- Не реализовывать заново внутреннюю логику Codex app-server.
- Не заставлять нативную Compaction потока Codex создавать сводку lossless-claw.
- Не требовать от моделей не Codex использовать харнесс Codex.
- Не изменять поведение сессий ACP/acpx. Эта спецификация относится только к пути не-ACP встроенного агентного харнесса.
- Не заставлять сторонние Plugins регистрировать фабрики расширений Codex app-server; существующая граница доверия для встроенных Plugins остается без изменений.

## Текущая архитектура

Встроенный цикл выполнения разрешает настроенный движок контекста один раз на запуск перед выбором конкретного низкоуровневого харнесса:

- `src/agents/embedded-agent-runner/run.ts`
  - инициализирует Plugins движка контекста
  - вызывает `resolveContextEngine(params.config)`
  - передает `contextEngine` и `contextTokenBudget` в
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` делегирует выбранному агентному харнессу:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Харнесс Codex app-server регистрируется встроенным Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Реализация харнесса Codex получает те же `EmbeddedRunAttemptParams`, что и встроенные попытки OpenClaw:

- `extensions/codex/src/app-server/run-attempt.ts`

Это означает, что нужная точка hook находится в коде, контролируемом OpenClaw. Внешняя граница — сам протокол Codex app-server: OpenClaw может управлять тем, что отправляет в `thread/start`, `thread/resume` и `turn/start`, и может наблюдать уведомления, но не может изменить внутреннее хранилище потоков Codex или нативный компактор.

## Текущий пробел

Встроенные попытки OpenClaw напрямую вызывают жизненный цикл движка контекста:

- bootstrap/обслуживание перед попыткой
- сборка перед вызовом модели
- afterTurn или ingest после попытки
- обслуживание после успешного хода
- Compaction движка контекста для движков, которые владеют Compaction

Соответствующий код OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Попытки Codex app-server сейчас запускают общие hooks агентного харнесса и зеркалируют transcript, но не вызывают `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` или `params.contextEngine.maintain`.

Соответствующий код Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Желаемое поведение

Для ходов харнесса Codex OpenClaw должен сохранять этот жизненный цикл:

1. Прочитать зеркальный transcript сессии OpenClaw.
2. Выполнить bootstrap активного движка контекста, когда существует файл предыдущей сессии.
3. Запустить bootstrap-обслуживание, если оно доступно.
4. Собрать контекст с помощью активного движка контекста.
5. Преобразовать собранный контекст во входные данные, совместимые с Codex.
6. Запустить или возобновить поток Codex с developer instructions, включающими любое `systemPromptAddition` движка контекста.
7. Запустить ход Codex с собранным пользовательским prompt.
8. Зеркалировать результат Codex обратно в transcript OpenClaw.
9. Вызвать `afterTurn`, если он реализован, иначе `ingestBatch`/`ingest`, используя зеркальный снимок transcript.
10. Запустить обслуживание хода после успешных непрерванных ходов.
11. Сохранить нативные сигналы Compaction Codex и hooks Compaction OpenClaw.

## Ограничения дизайна

### Codex app-server остается каноническим для нативного состояния потока

Codex владеет своим нативным потоком и любой внутренней расширенной историей. OpenClaw не должен пытаться изменять внутреннюю историю app-server иначе как через поддерживаемые вызовы протокола.

Зеркало transcript OpenClaw остается источником для возможностей OpenClaw:

- история чата
- поиск
- учет `/new` и `/reset`
- будущее переключение модели или харнесса
- состояние Plugin движка контекста

### Сборка движка контекста должна проецироваться во входные данные Codex

Интерфейс движка контекста возвращает `AgentMessage[]` OpenClaw, а не patch потока Codex. Codex app-server `turn/start` принимает текущий пользовательский ввод, тогда как `thread/start` и `thread/resume` принимают developer instructions.

Поэтому реализации нужен слой проекции. Безопасная первая версия должна не делать вид, что может заменить внутреннюю историю Codex. Она должна внедрять собранный контекст как детерминированный материал prompt/developer-instruction вокруг текущего хода.

### Стабильность prompt-кэша важна

Для движков вроде lossless-claw собранный контекст должен быть детерминированным при неизменных входных данных. Не добавляйте временные метки, случайные id или недетерминированный порядок в сгенерированный текст контекста.

### Семантика выбора runtime не меняется

Выбор харнесса остается прежним:

- `runtime: "openclaw"` выбирает встроенный харнесс OpenClaw
- `runtime: "codex"` выбирает зарегистрированный харнесс Codex
- `runtime: "auto"` позволяет харнессам Plugins заявлять поддерживаемых providers
- несопоставленные запуски `auto` используют встроенный харнесс OpenClaw

Эта работа меняет то, что происходит после выбора харнесса Codex.

## План реализации

### 1. Экспортировать или перенести переиспользуемые helpers попытки движка контекста

Сегодня переиспользуемые helpers жизненного цикла находятся внутри встроенного agent runner:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex должен импортировать нейтральные к харнессу helpers, а не обращаться к деталям реализации runner.

Создайте нейтральный к харнессу модуль, например:

- `src/agents/harness/context-engine-lifecycle.ts`

Переместите или реэкспортируйте:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- небольшую обертку вокруг `runContextEngineMaintenance`

Обновите места вызова встроенного харнесса в том же PR.

Имена нейтральных helpers не должны упоминать встроенный харнесс.

Предлагаемые имена:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Добавить helper проекции контекста Codex

Добавьте новый модуль:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Обязанности:

- Принимать собранный `AgentMessage[]`, исходную зеркальную историю и текущий prompt.
- Определять, какой контекст относится к developer instructions, а какой — к текущему пользовательскому вводу.
- Сохранять текущий пользовательский prompt как финальный actionable-запрос.
- Отображать предыдущие сообщения в стабильном, явном формате.
- Избегать изменчивых metadata.

Предлагаемый API:

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

Рекомендуемая первая проекция:

- Поместить `systemPromptAddition` в developer instructions.
- Поместить собранный контекст transcript перед текущим prompt в `promptText`.
- Явно пометить его как собранный контекст OpenClaw.
- Оставить текущий prompt последним.
- Исключить дубликат текущего пользовательского prompt, если он уже находится в конце.

Пример формы prompt:

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

Это менее изящно, чем нативная правка истории Codex, но реализуемо внутри OpenClaw и сохраняет семантику движка контекста.

Будущее улучшение: если Codex app-server предоставит протокол для замены или дополнения истории потока, переключить этот слой проекции на использование такого API.

### 3. Подключить bootstrap перед запуском потока Codex

В `extensions/codex/src/app-server/run-attempt.ts`:

- Читать зеркальную историю сессии как сейчас.
- Определять, существовал ли файл сессии до этого запуска. Предпочтительно использовать helper, который проверяет `fs.stat(params.sessionFile)` перед зеркальными записями.
- Открыть `SessionManager` или использовать узкий адаптер session manager, если helper этого требует.
- Вызвать нейтральный helper bootstrap, когда существует `params.contextEngine`.

Псевдопоток:

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

Используйте ту же конвенцию `sessionKey`, что и bridge инструментов Codex и зеркало transcript. Сегодня Codex вычисляет `sandboxSessionKey` из `params.sessionKey` или `params.sessionId`; используйте это последовательно, если нет причины сохранять сырой `params.sessionKey`.

### 4. Подключить сборку перед `thread/start` / `thread/resume` и `turn/start`

В `runCodexAppServerAttempt`:

1. Сначала построить динамические инструменты, чтобы движок контекста видел фактические имена доступных инструментов.
2. Прочитать зеркальную историю сессии.
3. Запустить `assemble(...)` движка контекста, когда существует `params.contextEngine`.
4. Спроецировать собранный результат в:
   - добавление к developer instruction
   - текст prompt для `turn/start`

Существующий вызов hook:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

должен стать учитывающим контекст:

1. вычислить базовые developer instructions через `buildDeveloperInstructions(params)`
2. применить сборку/проекцию движка контекста
3. запустить `before_prompt_build` с спроецированными prompt/developer instructions

Такой порядок позволяет общим prompt hooks видеть тот же prompt, который получит Codex. Если нужна строгая паритетность с OpenClaw, запускайте сборку движка контекста до композиции hooks, потому что встроенный харнесс применяет `systemPromptAddition` движка контекста к финальному системному prompt после своего prompt pipeline. Важный инвариант — чтобы и движок контекста, и hooks получали детерминированный, документированный порядок.

Рекомендуемый порядок для первой реализации:

1. `buildDeveloperInstructions(params)`
2. `assemble()` движка контекста
3. добавить `systemPromptAddition` в developer instructions в конец или начало
4. спроецировать собранные сообщения в текст prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. передать финальные developer instructions в `startOrResumeThread(...)`
7. передать финальный текст prompt в `buildTurnStartParams(...)`

Спецификацию следует закодировать в тестах, чтобы будущие изменения случайно не поменяли порядок.

### 5. Сохранить стабильное для prompt-кэша форматирование

Helper проекции должен выдавать байтово стабильный результат для идентичных входных данных:

- стабильный порядок сообщений
- стабильные метки ролей
- без сгенерированных временных меток
- без утечки порядка ключей объектов
- без случайных разделителей
- без id на каждый запуск

Используйте фиксированные разделители и явные секции.

### 6. Подключить post-turn после зеркалирования transcript

`CodexAppServerEventProjector` в Codex создает локальный `messagesSnapshot` для
текущего хода. `mirrorTranscriptBestEffort(...)` записывает этот снимок в
зеркало транскрипта OpenClaw.

После успешного или неудачного зеркалирования вызовите финализатор движка
контекста с лучшим доступным снимком сообщений:

- Предпочитайте полный зеркалированный контекст сессии после записи, потому что
  `afterTurn` ожидает снимок сессии, а не только текущий ход.
- Откатывайтесь к `historyMessages + result.messagesSnapshot`, если файл сессии
  не удается открыть повторно.

Псевдопоток:

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

Если зеркалирование не удалось, все равно вызовите `afterTurn` с резервным
снимком, но запишите в лог, что движок контекста выполняет ingest из резервных
данных хода.

### 7. Нормализуйте usage и runtime-контекст кэша prompt

Результаты Codex включают нормализованный usage из уведомлений app-server о
токенах, когда он доступен. Передайте этот usage в runtime-контекст движка
контекста.

Если Codex app-server со временем начнет предоставлять сведения о чтении/записи
кэша, сопоставьте их с `ContextEnginePromptCacheInfo`. До тех пор опускайте
`promptCache`, а не придумывайте нули.

### 8. Политика Compaction

Есть две системы Compaction:

1. `compact()` движка контекста OpenClaw
2. Нативный `thread/compact/start` Codex app-server

Не смешивайте их неявно.

#### `/compact` и явная Compaction OpenClaw

Когда выбранный движок контекста имеет `info.ownsCompaction === true`, явная
Compaction OpenClaw должна предпочитать результат `compact()` движка контекста
для зеркала транскрипта OpenClaw и состояния plugin.

Когда у выбранного Codex harness есть нативная привязка thread, мы также можем
запросить нативную Compaction Codex, чтобы поддерживать работоспособность thread
app-server, но это должно быть отражено в details как отдельное действие
backend.

Рекомендуемое поведение:

- Если `contextEngine.info.ownsCompaction === true`:
  - сначала вызвать `compact()` движка контекста
  - затем best-effort вызвать нативную Compaction Codex, если существует привязка thread
  - вернуть результат движка контекста как основной результат
  - включить статус нативной Compaction Codex в `details.codexNativeCompaction`
- Если активный движок контекста не владеет Compaction:
  - сохранить текущее поведение нативной Compaction Codex

Вероятно, для этого потребуется изменить `extensions/codex/src/app-server/compact.ts`
или обернуть его из общего пути Compaction, в зависимости от того, где вызывается
`maybeCompactAgentHarnessSession(...)`.

#### In-turn события нативной Codex contextCompaction

Codex может выдавать события item `contextCompaction` во время хода. Сохраните
текущую эмиссию хуков Compaction before/after в `event-projector.ts`, но не
считайте это завершенной Compaction движка контекста.

Для движков, которые владеют Compaction, выдавайте явную диагностику, когда
Codex все равно выполняет нативную Compaction:

- имя stream/event: существующий stream `compaction` допустим
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Это делает разделение аудируемым.

### 9. Сброс сессии и поведение привязки

Существующий `reset(...)` Codex harness очищает привязку Codex app-server из
файла сессии OpenClaw. Сохраните это поведение.

Также убедитесь, что очистка состояния движка контекста продолжает выполняться
через существующие пути жизненного цикла сессии OpenClaw. Не добавляйте
специфичную для Codex очистку, если жизненный цикл движка контекста сейчас не
пропускает события reset/delete для всех harness.

### 10. Обработка ошибок

Следуйте встроенной семантике OpenClaw:

- ошибки bootstrap предупреждают и продолжают выполнение
- ошибки assemble предупреждают и откатываются к несобранным сообщениям/prompt pipeline
- ошибки afterTurn/ingest предупреждают и помечают post-turn финализацию неуспешной
- обслуживание запускается только после успешных, не прерванных и не yield ходов
- ошибки Compaction не должны повторяться как новые prompt

Дополнения, специфичные для Codex:

- Если проекция контекста не удалась, предупредите и откатитесь к исходному prompt.
- Если зеркало транскрипта не удалось, все равно попытайтесь выполнить финализацию
  движка контекста с резервными сообщениями.
- Если нативная Compaction Codex не удалась после успешной Compaction движка
  контекста, не проваливайте всю Compaction OpenClaw, когда движок контекста
  является основным.

## План тестирования

### Модульные тесты

Добавьте тесты в `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex вызывает `bootstrap`, когда существует файл сессии.
   - Codex вызывает `assemble` с зеркалированными сообщениями, бюджетом токенов,
     именами tool, режимом цитирования, id модели и prompt.
   - `systemPromptAddition` включается в инструкции разработчика.
   - Собранные сообщения проецируются в prompt перед текущим запросом.
   - Codex вызывает `afterTurn` после зеркалирования транскрипта.
   - Без `afterTurn` Codex вызывает `ingestBatch` или per-message `ingest`.
   - Обслуживание хода запускается после успешных ходов.
   - Обслуживание хода не запускается при ошибке prompt, abort или yield abort.

2. `context-engine-projection.test.ts`
   - стабильный вывод для одинаковых входных данных
   - нет дублирования текущего prompt, когда собранная история уже включает его
   - обрабатывает пустую историю
   - сохраняет порядок ролей
   - включает добавление system prompt только в инструкции разработчика

3. `compact.context-engine.test.ts`
   - основной результат владеющего движка контекста побеждает
   - статус нативной Compaction Codex появляется в details, когда она также предпринята
   - нативный сбой Codex не проваливает Compaction владеющего движка контекста
   - невладеющий движок контекста сохраняет текущее поведение нативной Compaction

### Существующие тесты для обновления

- `extensions/codex/src/app-server/run-attempt.test.ts`, если присутствует, иначе
  ближайшие тесты запуска Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` только если меняются
  details событий Compaction.
- `src/agents/harness/selection.test.ts` не должен требовать изменений, если не
  меняется поведение конфигурации; он должен оставаться стабильным.
- Встроенные тесты движка контекста harness должны продолжать проходить без изменений.

### Интеграционные / live тесты

Добавьте или расширьте live smoke-тесты Codex harness:

- настроить `plugins.slots.contextEngine` на тестовый движок
- настроить `agents.defaults.model` на модель `codex/*`
- настроить provider/model `agentRuntime.id = "codex"`
- проверить, что тестовый движок наблюдал:
  - bootstrap
  - assemble
  - afterTurn или ingest
  - обслуживание

Не требуйте lossless-claw в тестах core OpenClaw. Используйте небольшой
внутрирепозиторный fake plugin движка контекста.

## Наблюдаемость

Добавьте debug-логи вокруг вызовов жизненного цикла движка контекста Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` с причиной
- `codex native compaction completed alongside context-engine compaction`

Не логируйте полные prompt или содержимое транскрипта.

Добавляйте структурированные поля там, где полезно:

- `sessionId`
- `sessionKey` редактируется или опускается согласно существующей практике логирования
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Миграция / совместимость

Это должно быть обратно совместимо:

- Если движок контекста не настроен, поведение legacy движка контекста должно
  быть эквивалентно текущему поведению Codex harness.
- Если `assemble` движка контекста не удалось, Codex должен продолжить исходный
  путь prompt.
- Существующие привязки thread Codex должны оставаться валидными.
- Динамический отпечаток tool не должен включать вывод движка контекста; иначе
  каждое изменение контекста могло бы принудительно создавать новый thread Codex.
  Только каталог tool должен влиять на динамический отпечаток tool.

## Открытые вопросы

1. Должен ли собранный контекст внедряться полностью в пользовательский prompt,
   полностью в инструкции разработчика или разделяться?

   Рекомендация: разделять. Помещайте `systemPromptAddition` в инструкции
   разработчика; помещайте собранный контекст транскрипта в обертку
   пользовательского prompt. Это лучше всего соответствует текущему протоколу
   Codex без мутации нативной истории thread.

2. Следует ли отключать нативную Compaction Codex, когда движок контекста владеет
   Compaction?

   Рекомендация: нет, не изначально. Нативная Compaction Codex все еще может
   быть необходима, чтобы поддерживать жизнь thread app-server. Но ее нужно
   отражать как нативную Compaction Codex, а не как Compaction движка контекста.

3. Должен ли `before_prompt_build` запускаться до или после сборки движком контекста?

   Рекомендация: после проекции движка контекста для Codex, чтобы общие хуки
   harness видели фактические prompt/инструкции разработчика, которые получит
   Codex. Если паритет со встроенным harness требует противоположного, закрепите
   выбранный порядок в тестах и задокументируйте его здесь.

4. Может ли Codex app-server принять будущую структурированную переопределяющую
   context/history?

   Неизвестно. Если сможет, замените слой текстовой проекции этим протоколом и
   оставьте вызовы жизненного цикла без изменений.

## Критерии приемки

- Ход embedded harness `codex/*` вызывает lifecycle assemble выбранного движка
  контекста.
- `systemPromptAddition` движка контекста влияет на инструкции разработчика Codex.
- Собранный контекст детерминированно влияет на входные данные хода Codex.
- Успешные ходы Codex вызывают `afterTurn` или резервный ingest.
- Успешные ходы Codex запускают обслуживание хода движка контекста.
- Неудачные/aborted/yield-aborted ходы не запускают обслуживание хода.
- Compaction, которой владеет движок контекста, остается основной для состояния
  OpenClaw/plugin.
- Нативная Compaction Codex остается аудируемой как нативное поведение Codex.
- Существующее поведение движка контекста встроенного harness не меняется.
- Существующее поведение Codex harness не меняется, когда не выбран
  non-legacy движок контекста или когда assembly не удается.
