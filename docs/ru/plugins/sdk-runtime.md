---
read_when:
    - Вам нужно вызывать основные вспомогательные функции из плагина (TTS, STT, генерация изображений, веб-поиск, Gateway, субагент, узлы)
    - Вы хотите понять, что предоставляет `api.runtime`
    - Вы обращаетесь к вспомогательным функциям конфигурации, агента или медиа из кода плагина
sidebarTitle: Runtime helpers
summary: api.runtime -- внедрённые вспомогательные функции среды выполнения, доступные плагинам
title: Вспомогательные средства среды выполнения плагина
x-i18n:
    generated_at: "2026-07-13T18:36:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Справочник по объекту `api.runtime`, внедряемому в каждый плагин при регистрации. Используйте эти вспомогательные средства вместо прямого импорта внутренних компонентов хоста.

<CardGroup cols={2}>
  <Card title="Плагины каналов" href="/ru/plugins/sdk-channel-plugins">
    Пошаговое руководство по использованию этих вспомогательных средств в контексте плагинов каналов.
  </Card>
  <Card title="Плагины провайдеров" href="/ru/plugins/sdk-provider-plugins">
    Пошаговое руководство по использованию этих вспомогательных средств в контексте плагинов провайдеров.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` — текущая версия продукта OpenClaw, полученная из общего средства определения версии, поэтому плагины видят то же значение, которое сообщает CLI.

## Загрузка и запись конфигурации

Предпочитайте конфигурацию, уже переданную в активный путь вызова, например `api.config` при регистрации или аргумент `cfg` в обратных вызовах канала или провайдера. Это позволяет использовать один снимок процесса на протяжении всей операции вместо повторного разбора конфигурации в часто выполняемых путях.

Используйте `api.runtime.config.current()` только тогда, когда долгоживущему обработчику нужен текущий снимок процесса, а конфигурация не была передана этой функции. Возвращаемое значение доступно только для чтения; перед редактированием клонируйте его или используйте вспомогательное средство изменения.

Фабрики инструментов получают `ctx.runtimeConfig` вместе с `ctx.getRuntimeConfig()`. Используйте функцию получения внутри обратного вызова `execute` долгоживущего инструмента, если конфигурация может измениться после создания определения инструмента.

Сохраняйте изменения с помощью `api.runtime.config.mutateConfigFile(...)` или `api.runtime.config.replaceConfigFile(...)`. Для каждой записи необходимо выбрать явную политику `afterWrite`:

- `afterWrite: { mode: "auto" }` позволяет планировщику перезагрузки Gateway принять решение.
- `afterWrite: { mode: "restart", reason: "..." }` принудительно выполняет чистый перезапуск, когда выполняющий запись компонент знает, что горячая перезагрузка небезопасна.
- `afterWrite: { mode: "none", reason: "..." }` подавляет автоматическую перезагрузку или перезапуск только тогда, когда вызывающая сторона отвечает за последующие действия.

Вспомогательные средства изменения возвращают `afterWrite` вместе с типизированной сводкой `followUp`, чтобы вызывающие стороны могли журналировать или проверять, запросили ли они перезапуск. Gateway по-прежнему определяет, когда этот перезапуск фактически произойдёт.

<Warning>
`api.runtime.config.loadConfig()` и `api.runtime.config.writeConfigFile(...)` устарели. Во время выполнения они однократно выводят предупреждение для каждого плагина и остаются доступными только для старых внешних плагинов в течение периода миграции. Встроенные плагины не должны их использовать: внутренняя проверка границ конфигурации приводит к сбою сборки, если код плагина вызывает их или импортирует эти вспомогательные средства из подпутей SDK плагинов. Вместо них используйте `current()`, переданный `cfg`, `mutateConfigFile(...)` или `replaceConfigFile(...)`.
</Warning>

При прямом импорте из SDK предпочитайте специализированные подпути конфигурации общему совместимому модулю `openclaw/plugin-sdk/config-runtime`: `config-contracts` для типов, `plugin-config-runtime` для проверок уже загруженной конфигурации и поиска точки входа плагина, `runtime-config-snapshot` для текущих снимков процесса и `config-mutation` для записи. Тесты встроенных плагинов должны напрямую имитировать эти специализированные подпути вместо общего совместимого модуля.

Внутренний код среды выполнения OpenClaw следует тому же подходу: загружает конфигурацию один раз на границе CLI, Gateway или процесса, а затем передаёт это значение дальше. Успешная запись изменений обновляет снимок конфигурации среды выполнения процесса и увеличивает его внутреннюю ревизию; долгоживущие кеши должны использовать ключ кеша, принадлежащий среде выполнения, вместо локальной сериализации конфигурации. Для долгоживущих модулей среды выполнения действует сканер с нулевой терпимостью к фоновым вызовам `loadConfig()`; используйте переданный `cfg`, `context.getRuntimeConfig()` запроса или `getRuntimeConfig()` на явно заданной границе процесса.

Пути выполнения провайдера и канала должны использовать активный снимок конфигурации среды выполнения, а не снимок файла, возвращаемый для чтения или редактирования конфигурации. Снимки файлов сохраняют исходные значения, например маркеры SecretRef, для пользовательского интерфейса и записи; обратным вызовам провайдера требуется разрешённое представление среды выполнения. Если вспомогательное средство может вызываться как с активным исходным снимком, так и с активным снимком среды выполнения, перед чтением учётных данных направляйте вызов через `selectApplicableRuntimeConfig()`.

## Повторно используемые утилиты среды выполнения

Используйте входящие факты `botLoopProtection` для входящих сообщений, созданных ботами. Ядро применяет общую скользящую оконную защиту в памяти до записи сеанса и диспетчеризации, не привязывая политику к одному каналу. Защита отслеживает ключи `(scopeId, conversationId, participant pair)`, совместно подсчитывает оба направления пары, применяет период ожидания после превышения лимита окна и при удобном случае удаляет неактивные записи.

Плагины каналов, предоставляющие операторам доступ к этому поведению, должны предпочитать общую структуру `channels.defaults.botLoopProtection` для базовых лимитов, а затем накладывать поверх неё переопределения, специфичные для канала или провайдера. Общая конфигурация использует секунды, поскольку она предназначена для пользователей:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Передавайте нормализованные данные о паре ботов вместе с разрешённым ходом. Ядро определяет значения по умолчанию, преобразование единиц и семантику `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Используйте `openclaw/plugin-sdk/pair-loop-guard-runtime` напрямую только для пользовательских
двусторонних циклов событий, которые не проходят через общий обработчик входящих ответов.

## Пространства имён среды выполнения

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Идентификация агента, каталоги и управление сеансами.

    ```typescript
    // Определить рабочий каталог агента (agentId обязателен)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Определить рабочее пространство агента
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // Получить идентификационные данные агента
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Получить уровень рассуждения по умолчанию
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Проверить предоставленный пользователем уровень рассуждения по активному профилю провайдера
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // передать уровень во встроенный запуск
    }

    // Получить время ожидания агента
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Убедиться, что рабочее пространство существует
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Выполнить встроенный ход агента
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Кратко изложите последние изменения",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` — нейтральное вспомогательное средство для запуска обычного хода агента OpenClaw из кода плагина. Оно использует те же механизмы определения провайдера и модели, а также выбора среды агента, что и ответы, инициированные каналом.

    `runEmbeddedPiAgent(...)` сохраняется как устаревший псевдоним совместимости для существующих плагинов. В новом коде следует использовать `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` возвращает поддерживаемые провайдером и моделью уровни рассуждения и необязательное значение по умолчанию. Плагины провайдеров управляют профилем конкретной модели через свои перехватчики рассуждения, поэтому плагины инструментов должны вызывать это вспомогательное средство среды выполнения вместо импорта или дублирования списков провайдера.

    `normalizeThinkingLevel(...)` преобразует пользовательский текст, например `on`, `x-high` или `extra high`, в канонический сохраняемый уровень перед его проверкой по определённой политике.

    **Вспомогательные средства хранилища сеансов** находятся в `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Перебирать строки сеансов без зависимости от устаревшей структуры sessions.json.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Создать или обновить сеанс, затем передать signal в допущенный запуск агента.
      },
    );
    ```

    Для рабочих процессов сеансов предпочитайте `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` или `upsertSessionEntry(...)`. Эти вспомогательные средства адресуют сеансы по идентификаторам агента и сеанса, чтобы плагины не зависели от устаревшей структуры хранения `sessions.json`. Используйте `preserveActivity: true` для изменений только метаданных, которые не должны обновлять активность сеанса, а `replaceEntry: true` — только когда обратный вызов возвращает полную запись и удалённые поля должны оставаться удалёнными. Пути диагностики и миграции могут сочетать `fallbackEntry`, `skipMaintenance` и `requireWriteSuccess` для одного атомарного исправления канонического хранилища.

    `createSessionEntry(...)` создаёт новую каноническую строку сеанса и расшифровку. Его доверенная поверхность `initialEntry` намеренно ограничена: непустой `agentHarnessId`, необязательный `modelSelectionLocked: true` и необязательный `pluginExtensions`. Внедрённая среда выполнения принимает только идентификаторы сред, принадлежащих вызывающему плагину через `registerAgentHarness(...)`; это инвариант владения, а не песочница между плагинами внутри одного процесса. Она отклоняет существующую строку; `label` и `spawnedCwd` являются отдельными полями создания, а не доверенными изменениями записи.

    Во время создания блокировка изменений жизненного цикла сеанса удерживается через `afterCreate`, поэтому новая работа ожидает завершения инициализации, принадлежащей плагину, а наличие ранее допущенной работы приводит к сбою создания. Обратный вызов получает клон созданного состояния. Если он возвращает изменение, оно может содержать только `pluginExtensions`, а его значение представляет собой полное итоговое поле `pluginExtensions`. Сбой обратного вызова или окончательного сохранения откатывает неизменённую новую строку и расшифровку; защищённый откат сохраняет строку, изменённую или занятую параллельно. `recoverMatchingInitialEntry: true` предназначен только для повторной попытки прерванной инициализации, когда сохранённые доверенные поля точно совпадают, а для восстановления требуется, чтобы `afterCreate` вернул итоговое изменение.

    Используйте `runWithWorkAdmission(...)`, когда плагин начинает работу с сохранённым сеансом. Обратный вызов отклоняет архивированные или параллельно заменённые сеансы, обеспечивает координацию операций архивирования, сброса и удаления до завершения и получает `AbortSignal`, который необходимо передать запуску агента. Среда может явно указывать доверенных делегатов выполнения через своё экспериментальное поле регистрации `delegatedExecutionPluginIds`. Делегаты могут допускать и выполнять только точно соответствующий существующий сеанс с зафиксированной моделью; все изменения сеанса остаются доступны только владельцу среды. См. [Плагины среды агента](/ru/plugins/sdk-agent-harness#delegated-execution).

    Плагины обслуживания и исправления могут использовать `deleteSessionEntry(...)` для одной записи сеанса в заданной области, `cleanupSessionLifecycleArtifacts(...)` для временных сеансов, принадлежащих жизненному циклу, и `resolveSessionStoreBackupPaths(...)` перед изменением хранилища. Это узкие поверхности исправления и управления жизненным циклом, а не универсальный API удаления хранилища.

    `resolveStorePath(...)` и `updateSessionStoreEntry(...)` дополняют набор вспомогательных функций для сеансов: `resolveStorePath` определяет путь к хранилищу сеансов для заданной области, а `updateSessionStoreEntry({ storePath, sessionKey, update })` напрямую изменяет одну запись по пути к хранилищу, если вызывающему коду он уже известен.

    `loadTranscriptEventsSync(...)` доступна для синхронных процедур doctor и восстановления, которые не могут использовать асинхронную среду выполнения транскриптов. Она возвращает необработанные записи `SessionStoreTranscriptEvent`. В обычном коде среды выполнения плагина следует предпочитать `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` и `sqliteSessionFileMarkerMatchesSession(...)` — переходные вспомогательные функции для кода, который всё ещё получает устаревшее поле с именем `sessionFile`. Разобранный маркер SQLite указывает на активный целевой транскрипт SQLite; это не путь в файловой системе. Новые API должны передавать типизированные данные идентификации сеанса вместо строковых маркеров.

    Для чтения и записи транскриптов импортируйте `openclaw/plugin-sdk/session-transcript-runtime` и используйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` или `withSessionTranscriptWriteLock(...)` совместно с `{ agentId, sessionKey, sessionId }`. Эти API позволяют плагинам идентифицировать транскрипт, читать необработанные события или видимые записи сообщений с учётом безопасных ветвей, добавлять сообщения, публиковать обновления и выполнять связанные операции под одной и той же блокировкой записи транскрипта, не завися от путей к файлам активных транскриптов. `readVisibleSessionTranscriptMessageEntries(...)` возвращает упорядоченные метаданные чтения; её поле `seq` не является курсором, с которого можно возобновить чтение.

    Устаревшие вспомогательные функции для всего хранилища и файлов активных транскриптов больше не экспортируются из SDK плагинов. Используйте вспомогательные функции записей с областью действия для метаданных сеансов и вспомогательные функции идентификации транскриптов для операций с активными транскриптами. Процессы архивирования и поддержки, которым нужны файловые артефакты, должны использовать предназначенные для этого интерфейсы архивирования вместо API среды выполнения активных сеансов.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константы модели и провайдера по умолчанию:

    ```typescript
    const model = api.runtime.agent.defaults.model; // например, "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // например, "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Выполняйте управляемое хостом дополнение текста, не импортируя внутренние
    компоненты провайдера и не дублируя подготовку модели, аутентификации и базового URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Суммируй этот транскрипт." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Механизм оркестрации провайдера также может получить настроенный жизненный
    цикл локальной службы перед отправкой HTTP-запроса:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Отправьте и полностью обработайте запрос провайдера.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` — стабильный универсальный контракт SDK
    службы провайдера. Хост определяет конфигурацию процесса из
    `models.providers.<providerId>.localService`; вызывающий код не может передавать
    команду, аргументы, окружение или политику жизненного цикла. Запуск процесса,
    проверка готовности, диагностика и политика остановки при простое остаются внутренними функциями хоста.

    Передавайте точный идентификатор настроенного провайдера и определённый базовый URL запроса. Не
    заменяйте псевдонимы идентификатором адаптера: разные псевдонимы могут указывать на разные
    локальные хосты с GPU. Хост отклоняет конечные точки, которые не соответствуют настроенному
    базовому URL провайдера, за исключением нормализации `/v1`, используемой адаптерами Ollama и LM
    Studio. Хост управляет сериализацией запуска, проверками готовности,
    арендой запросов, обработкой прерывания и завершением работы при простое.

    Вспомогательная функция использует тот же путь подготовки простого дополнения, что и встроенная
    среда выполнения OpenClaw, а также принадлежащий хосту снимок конфигурации среды выполнения. Механизмы контекста
    получают привязанную к сеансу возможность `llm.complete`, поэтому вызовы модели используют
    агента активного сеанса и не переходят незаметно к агенту по умолчанию. Результат
    содержит сведения о провайдере, модели и агенте, а также нормализованные данные об использовании токенов,
    кеша и расчётной стоимости, если они доступны.

    <Warning>
    Переопределение модели требует явного разрешения оператора через `plugins.entries.<id>.llm.allowModelOverride: true` в конфигурации. Используйте `plugins.entries.<id>.llm.allowedModels`, чтобы ограничить доверенные плагины определёнными каноническими целями `provider/model`. Дополнения между агентами требуют `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Вызывайте другой метод Gateway внутри процесса, сохраняя доверенную идентичность среды выполнения текущего плагина.
    Это предназначено для встроенных или доверенных официальных плагинов, которые объединяют принадлежащие плагинам
    возможности Gateway без открытия локального WebSocket-соединения.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Запросы используют область `operator.write` и не предоставляют область администратора. Вызовы из произвольных внешних
    плагинов отклоняются. При сбое метода создаётся исключение `GatewayClientRequestError` с сохранением структурированных
    `details`, метаданных повторной попытки и кода ошибки Gateway для процессов восстановления. Используйте `isAvailable()`,
    прежде чем выбирать этот путь в инструментах, которые также могут работать в автономных процессах агента.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте фоновые выполнения субагентов и управляйте ими.

    ```typescript
    // Запуск выполнения субагента
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Преобразуй этот запрос в набор целевых уточняющих поисковых запросов.",
      provider: "openai", // необязательное переопределение
      model: "gpt-5.6-sol", // необязательное переопределение
      deliver: false,
    });

    // Ожидание завершения
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Чтение сообщений сеанса
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Удаление сеанса
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Переопределение модели (`provider`/`model`) требует явного разрешения оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` в конфигурации. Недоверенные плагины по-прежнему могут запускать субагентов, но запросы на переопределение отклоняются.
    </Warning>

    `deleteSession(...)` может удалять сеансы, созданные тем же плагином через `api.runtime.subagent.run(...)`. Для удаления произвольных сеансов пользователей или операторов по-прежнему требуется запрос Gateway с областью администратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Получайте список подключённых узлов и вызывайте команды узла-хоста из кода плагина, загруженного Gateway, или из CLI-команд плагина. Используйте это, когда плагин управляет локальной работой на сопряжённом устройстве, например мостом браузера или аудио на другом Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` содержит объявленные каждым подключённым узлом
    дескрипторы `nodePluginTools`, если этот узел предоставляет агенту инструменты
    на основе плагинов или MCP. Эти дескрипторы отражают текущее состояние подключения: Gateway
    удаляет их при отключении узла, а узел может заменить их через
    `node.pluginTools.update` после изменения локального состава плагинов или MCP.

    Внутри Gateway эта среда выполнения работает в процессе. В CLI-командах плагина она вызывает настроенный Gateway через RPC, поэтому такие команды, как `openclaw googlemeet recover-tab`, могут проверять сопряжённые узлы из терминала. Команды узлов по-прежнему проходят обычное сопряжение узлов Gateway, списки разрешённых команд, политики вызова узлов плагинами и локальную обработку команд на узлах.

    Плагины, предоставляющие размещённые на узлах инструменты агента, могут задать `agentTool.defaultPlatforms` для безопасных команд, которые должны быть разрешены по умолчанию. Не указывайте его, если операторы должны явно разрешить команды с помощью `gateway.nodes.allowCommands`. Для опасных команд узла-хоста следует зарегистрировать политику вызова узла с помощью `api.registerNodeInvokePolicy(...)`; политика выполняется в Gateway после проверки списка разрешённых команд и до передачи команды узлу, поэтому прямые вызовы `node.invoke`, размещённые на узлах инструменты плагинов и высокоуровневые инструменты плагинов используют единый путь применения ограничений.

    <Warning>
    Необязательное поле `scopes` запрашивает области оператора Gateway для вызова. OpenClaw учитывает его только для встроенных плагинов и доверенных установок официальных плагинов; запросы других плагинов не повышают привилегии вызова. Используйте его только тогда, когда доверенному плагину необходимо вызвать команду узла с более строгой областью Gateway, например `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Привязывайте состояние потока задач и выполнения задачи к существующему ключу сеанса OpenClaw или доверенному контексту инструмента.

    - `api.runtime.tasks.managedFlows` поддерживает изменения: создание, продвижение и отмену потоков задач.
    - `api.runtime.tasks.flows` и `api.runtime.tasks.runs` — доступные только для чтения представления DTO для получения списков и проверки состояния; оба предоставляют `bindSession(...)` / `fromToolContext(...)`, а также `get`, `list`, `findLatest` и `resolve`.
    - `api.runtime.tasks.flow` — устаревший псевдоним для `managedFlows`.

    Поток задач отслеживает долговременное состояние многоэтапного рабочего процесса. Это не планировщик:
    используйте Cron или `api.session.workflow.scheduleSessionTurn(...)` для будущих
    пробуждений, а затем вызывайте `managedFlows` из запланированного хода, когда для этой работы
    требуется состояние потока, дочерние задачи, ожидание или отмена.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Проверить новые запросы на слияние",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Проверить PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Используйте `bindSession({ sessionKey, requesterOrigin })`, если у вас уже есть доверенный ключ сеанса OpenClaw из собственного уровня привязки. Не выполняйте привязку на основе необработанного пользовательского ввода.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез речи из текста.

    ```typescript
    // Стандартный TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Привет от OpenClaw",
      cfg: api.config,
    });

    // TTS, оптимизированный для телефонии
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Привет от OpenClaw",
      cfg: api.config,
    });

    // Список доступных голосов
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Использует основную конфигурацию `messages.tts` и выбор провайдера. Возвращает аудиобуфер PCM и частоту дискретизации. `textToSpeechStream` также доступна для потокового синтеза.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Анализ изображений, аудио и видео.

    ```typescript
    // Описать изображение
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Транскрибировать аудио
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // необязательно, если MIME невозможно определить
    });

    // Описать видео
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Универсальный анализ файла
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Структурированное извлечение данных из изображения с помощью конкретного провайдера и модели.
    // Укажите хотя бы одно изображение; текстовые входные данные служат дополнительным контекстом.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Предпочитать напечатанную итоговую сумму рукописным примечаниям." },
      ],
      instructions: "Извлечь продавца, итоговую сумму и теги для поиска.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Возвращает `{ text: undefined }`, если выходные данные не созданы (например, входные данные были пропущены).

    `describeImageFileWithModel(...)` описывает уже известное изображение с помощью конкретного провайдера и модели, обходя стандартное определение активной модели, которое использует `describeImageFile(...)`.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` сохраняется как псевдоним совместимости для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Генерация изображений.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Робот рисует закат",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Генерация видео с интерфейсом, аналогичным генерации изображений.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Съёмка с дрона, летящего над побережьем на рассвете",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Генерация музыки с интерфейсом, аналогичным генерации изображений.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Бодрая композиция в стиле lo-fi для сеанса программирования",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Веб-поиск.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "SDK плагинов OpenClaw", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Низкоуровневые утилиты для работы с медиафайлами.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "изображение"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Текущий снимок конфигурации среды выполнения и транзакционная запись конфигурации. Предпочитайте
    конфигурацию, уже переданную в активный путь вызова; используйте
    `current()` только тогда, когда обработчику требуется непосредственно снимок процесса.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` и `replaceConfigFile(...)` возвращают значение `followUp`,
    например `{ mode: "restart", requiresRestart: true, reason }`,
    которое фиксирует намерение записывающего компонента, не передавая ему от
    Gateway управление перезапуском.

  </Accordion>
  <Accordion title="api.runtime.system">
    Утилиты системного уровня.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Устаревший псевдоним совместимости.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` немедленно запускает один цикл Heartbeat в обход обычного таймера объединения. Передайте `{ heartbeat: { target: "last" } }`, чтобы принудительно доставить сообщение в последний активный канал вместо стандартного подавления `target: "none"`.

    `runCommandWithTimeout(...)` возвращает перехваченные `stdout` и `stderr`, необязательные
    счётчики усечения, `code`, `signal`, `killed`, `termination` и
    `noOutputTimedOut`. Результаты тайм-аута и тайм-аута отсутствия вывода содержат `code: 124`,
    если дочерний процесс не предоставляет ненулевой код завершения. Завершение
    по сигналу без тайм-аута также может вернуть `code: null`, поэтому используйте `termination` и
    `noOutputTimedOut`, чтобы различать причины тайм-аута.

  </Accordion>
  <Accordion title="api.runtime.events">
    Подписки на события.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Ведение журналов.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Определение аутентификации модели и провайдера.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // Готовая к запросу аутентификация, включая обмены в среде выполнения провайдера (например, обновление OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Определение каталога состояния и хранилище по ключам на основе SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Хранилища по ключам сохраняются после перезапусков и изолируются по идентификатору плагина, привязанному к среде выполнения. Используйте `registerIfAbsent(...)` для атомарного резервирования при дедупликации: он возвращает `true`, если ключ отсутствовал или истёк и был зарегистрирован, либо `false`, если актуальное значение уже существует, не перезаписывая его значение, время создания или TTL. Ограничения: `maxEntries` на пространство имён, 50,000 актуальных строк на плагин, значения JSON размером менее 64KB и необязательное истечение TTL. По умолчанию запись при достижении любого из ограничений на количество строк удаляет самые старые актуальные строки из записываемого пространства имён; соседние пространства имён при этой записи не вытесняются, а запись всё равно завершается ошибкой, если пространство имён не может освободить достаточно строк. Установите `overflowPolicy: "reject-new"` для долговременных записей владения, которые нельзя вытеснять: новые ключи завершаются ошибкой при достижении любого ограничения, а существующие ключи по-прежнему можно обновлять.

    `openSyncKeyedStore<T>(...)` возвращает хранилище той же структуры с синхронными методами (`register`, `registerIfAbsent`, `lookup`, `consume`, `clear` возвращают значения непосредственно, а не промисы) для вызывающих компонентов, которые не могут использовать ожидание.

    `openChannelIngressQueue<TPayload>(...)` открывает сохраняемую очередь входящих данных, ограниченную вызывающим плагином, для буферизации входящих событий, которым требуется обработка с гарантией не менее одного раза после перезапусков. Если восстановление устаревшего резервирования использует `shouldRecover`, также укажите `shouldRecoverCorrupt`, если повреждённые зарезервированные полезные данные следует поместить в карантин: его не зависящий от полезных данных идентификатор резервирования позволяет плагину сохранить действующую политику владельца и полосы до того, как очередь пометит строку как удалённую.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` и `openChannelIngressQueue` в этом выпуске доступны только встроенным плагинам и доверенным установкам официальных плагинов.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Вспомогательные функции среды выполнения для конкретных каналов (доступны, когда загружен плагин канала). Сгруппированы по назначению:

    | Группа | Назначение |
    | --- | --- |
    | `text` | Разбиение на фрагменты (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), обнаружение управляющих команд, преобразование таблиц Markdown. |
    | `reply` | Отправка ответов буферизованными блоками, форматирование конвертов, определение эффективной конфигурации сообщений и задержки, имитирующей действия человека. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, чтение списков разрешений, вставка или обновление запросов на сопряжение. |
    | `media` | Удалённая загрузка и сохранение медиафайлов (см. ниже). |
    | `activity` | Запись и чтение последней активности канала. |
    | `session` | Метаданные сеанса из входящих событий, обновление последнего маршрута. |
    | `mentions` | Вспомогательные функции политики упоминаний (см. ниже). |
    | `reactions` | Дескрипторы реакций-подтверждений для индикаторов выполняющейся обработки. |
    | `groups` | Определение групповой политики и требования упоминания. |
    | `debounce` | Устранение дребезга входящих сообщений. |
    | `commands` | Авторизация команд и управление доступностью текстовых команд. |
    | `outbound` | Загрузка адаптера исходящих сообщений канала. |
    | `inbound` | Формирование контекста входящего события и запуск общего ядра обработки входящих событий и ответов. |
    | `threadBindings` | Настройка тайм-аута бездействия и максимального возраста для привязанных веток сеансов. |
    | `runtimeContexts` | Регистрация, чтение и отслеживание локального для процесса контекста по каналам, учётным записям и возможностям. |

    `api.runtime.channel.media` — предпочтительный интерфейс для загрузки и хранения медиафайлов каналов:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Используйте `saveRemoteMedia(...)`, когда удалённый URL требуется преобразовать в медиафайл OpenClaw. Используйте `saveResponseMedia(...)`, когда плагин уже получил `Response` с собственной обработкой аутентификации, перенаправлений или списка разрешений. Используйте `readRemoteMediaBuffer(...)`, только когда плагину нужны необработанные байты для проверки, преобразования, расшифровки или повторной отправки. `fetchRemoteMedia(...)` остаётся устаревшим псевдонимом совместимости для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — это общая поверхность политики входящих упоминаний для встроенных плагинов каналов, использующих внедрение среды выполнения:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Доступные вспомогательные функции для упоминаний:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` намеренно не предоставляет устаревшие вспомогательные функции совместимости `resolveMentionGating*`. Предпочитайте нормализованный путь `{ facts, policy }`.

    Несколько полей в `reply`, `session` и `inbound` содержат относящиеся к отдельным полям примечания `@deprecated`, указывающие на текущее ядро обработки хода канала или адаптеры исходящих сообщений канала; прежде чем создавать новый код на основе конкретной вспомогательной функции, ознакомьтесь с её встроенной документацией JSDoc.

  </Accordion>
</AccordionGroup>

## Хранение ссылок на среду выполнения

Используйте `createPluginRuntimeStore`, чтобы сохранить ссылку на среду выполнения для использования вне обратного вызова `register`:

<Steps>
  <Step title="Создайте хранилище">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Подключите к точке входа">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Получите доступ из других файлов">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Для идентификатора хранилища среды выполнения предпочитайте `pluginId`. Низкоуровневая форма `key` предназначена для редких случаев, когда одному плагину намеренно требуется более одного слота среды выполнения.
</Note>

## Другие поля верхнего уровня `api`

Помимо `api.runtime`, объект API также предоставляет:

<ParamField path="api.id" type="string">
  Идентификатор плагина.
</ParamField>
<ParamField path="api.name" type="string">
  Отображаемое имя плагина.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Текущий снимок конфигурации (активный снимок среды выполнения в памяти, если доступен).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфигурация плагина из `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Регистратор с ограниченной областью действия (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Текущий режим загрузки: `"full"` (активация в реальном времени), `"discovery"` / `"tool-discovery"` (обнаружение возможностей только для чтения), `"setup-only"` (облегчённая точка входа настройки), `"setup-runtime"` (процесс настройки, которому также требуется точка входа канала среды выполнения) или `"cli-metadata"` (сбор метаданных команд CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Разрешает путь относительно корневого каталога плагина.
</ParamField>

## Связанные материалы

- [Внутреннее устройство плагинов](/ru/plugins/architecture) — модель возможностей и реестр
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — параметры `definePluginEntry`
- [Обзор SDK](/ru/plugins/sdk-overview) — справочник по подпутям
