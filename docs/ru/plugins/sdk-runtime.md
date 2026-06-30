---
read_when:
    - Вам нужно вызывать вспомогательные функции ядра из плагина (TTS, STT, генерация изображений, веб-поиск, субагент, узлы)
    - Вы хотите понять, что предоставляет api.runtime
    - Вы обращаетесь к помощникам конфигурации, агента или медиа из кода Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- внедренные вспомогательные средства среды выполнения, доступные для Plugin
title: Вспомогательные средства среды выполнения Plugin
x-i18n:
    generated_at: "2026-06-30T14:19:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Справочник по объекту `api.runtime`, внедряемому в каждый Plugin во время регистрации. Используйте эти вспомогательные функции вместо прямого импорта внутренних модулей хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ru/plugins/sdk-channel-plugins">
    Пошаговое руководство, которое показывает использование этих вспомогательных функций в контексте Plugin каналов.
  </Card>
  <Card title="Provider plugins" href="/ru/plugins/sdk-provider-plugins">
    Пошаговое руководство, которое показывает использование этих вспомогательных функций в контексте Plugin провайдеров.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Загрузка и запись конфигурации

Предпочитайте конфигурацию, которая уже была передана в активный путь вызова, например `api.config` при регистрации или аргумент `cfg` в обратных вызовах канала/провайдера. Так один снимок процесса проходит через работу без повторного разбора конфигурации на горячих путях.

Используйте `api.runtime.config.current()` только когда долгоживущему обработчику нужен текущий снимок процесса и в эту функцию не была передана конфигурация. Возвращаемое значение доступно только для чтения; перед изменением клонируйте его или используйте вспомогательную функцию мутации.

Фабрики инструментов получают `ctx.runtimeConfig` вместе с `ctx.getRuntimeConfig()`. Используйте getter внутри обратного вызова `execute` долгоживущего инструмента, когда конфигурация может измениться после создания определения инструмента.

Сохраняйте изменения с помощью `api.runtime.config.mutateConfigFile(...)` или `api.runtime.config.replaceConfigFile(...)`. Каждая запись должна выбрать явную политику `afterWrite`:

- `afterWrite: { mode: "auto" }` позволяет средству принятия решений о перезагрузке Gateway выбрать действие.
- `afterWrite: { mode: "restart", reason: "..." }` принудительно выполняет чистый перезапуск, когда пишущий код знает, что горячая перезагрузка небезопасна.
- `afterWrite: { mode: "none", reason: "..." }` подавляет автоматическую перезагрузку/перезапуск только когда вызывающая сторона сама отвечает за последующие действия.

Вспомогательные функции мутации возвращают `afterWrite` и типизированную сводку `followUp`, чтобы вызывающие стороны могли логировать или тестировать, запросили ли они перезапуск. Gateway по-прежнему сам решает, когда этот перезапуск фактически произойдет.

`api.runtime.config.loadConfig()` и `api.runtime.config.writeConfigFile(...)` устарели и являются вспомогательными функциями совместимости в рамках `runtime-config-load-write`. Они один раз выводят предупреждение во время выполнения и остаются доступными для старых внешних Plugin в течение периода миграции. Встроенные Plugin не должны их использовать; защитные проверки границы конфигурации завершаются ошибкой, если код Plugin вызывает их или импортирует эти вспомогательные функции из подпутей SDK Plugin.

Для прямого импорта SDK используйте специализированные подпути конфигурации вместо широкого совместимого barrel
`openclaw/plugin-sdk/config-runtime`: `config-contracts` для
типов, `plugin-config-runtime` для утверждений уже загруженной конфигурации и поиска
точки входа Plugin, `runtime-config-snapshot` для текущих снимков процесса и
`config-mutation` для записей. Тесты встроенных Plugin должны напрямую мокировать эти специализированные
подпути вместо мокирования широкого совместимого barrel.

Внутренний runtime-код OpenClaw следует тому же направлению: загрузить конфигурацию один раз на границе CLI, Gateway или процесса, а затем передавать это значение дальше. Успешные записи мутаций обновляют runtime-снимок процесса и увеличивают его внутреннюю ревизию; долгоживущие кэши должны опираться на ключ кэша, принадлежащий runtime, вместо локальной сериализации конфигурации. Для долгоживущих runtime-модулей действует сканер с нулевой терпимостью к неявным вызовам `loadConfig()`; используйте переданный `cfg`, запрос `context.getRuntimeConfig()` или `getRuntimeConfig()` на явной границе процесса.

Пути выполнения провайдера и канала должны использовать активный снимок runtime-конфигурации, а не файловый снимок, возвращенный для чтения или редактирования конфигурации. Файловые снимки сохраняют исходные значения, такие как маркеры SecretRef для UI и записей; обратным вызовам провайдера нужен разрешенный runtime-вид. Когда вспомогательная функция может быть вызвана как с активным исходным снимком, так и с активным runtime-снимком, перед чтением учетных данных направляйте выполнение через `selectApplicableRuntimeConfig()`.

## Многократно используемые runtime-утилиты

Используйте входящие факты `botLoopProtection` для входящих сообщений, созданных ботом. Core применяет общий in-memory sliding-window guard до записи сеанса и диспетчеризации, не привязывая политику к одному каналу. Guard отслеживает ключи `(scopeId, conversationId, participant pair)`, считает оба направления пары вместе, применяет cooldown после превышения бюджета окна и по возможности удаляет неактивные записи.

Plugin каналов, которые предоставляют это поведение операторам, должны предпочитать общую форму `channels.defaults.botLoopProtection` для базовых бюджетов, а затем накладывать сверху переопределения, специфичные для канала/провайдера. Общая конфигурация использует секунды, потому что она видна пользователю:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Передавайте нормализованные факты пары ботов вместе с разрешенным turn. Core разрешает значения по умолчанию, преобразование единиц и семантику `enabled`:

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
двусторонних циклов событий, которые не проходят через общий runner входящих ответов.

## Runtime-пространства имен

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Идентичность агента, каталоги и управление сеансами.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` — нейтральная вспомогательная функция для запуска обычного turn агента OpenClaw из кода Plugin. Она использует то же разрешение провайдера/модели и выбор agent-harness, что и ответы, запускаемые каналом.

    `runEmbeddedPiAgent(...)` остается устаревшим совместимым псевдонимом для существующих Plugin. Новый код должен использовать `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` возвращает поддерживаемые провайдером/моделью уровни thinking и необязательное значение по умолчанию. Plugin провайдеров владеют профилем, специфичным для модели, через свои thinking hooks, поэтому Plugin инструментов должны вызывать эту runtime-вспомогательную функцию вместо импорта или дублирования списков провайдеров.

    `normalizeThinkingLevel(...)` преобразует пользовательский текст, например `on`, `x-high` или `extra high`, в канонический сохраненный уровень перед проверкой по разрешенной политике.

    **Вспомогательные функции хранилища сеансов** находятся в `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });
    ```

    Предпочитайте `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` или `upsertSessionEntry(...)` для рабочих процессов с сеансами. Эти вспомогательные функции адресуют сеансы по идентичности агента/сеанса, чтобы Plugin не зависели от устаревшей формы хранения `sessions.json`. Используйте `preserveActivity: true` для патчей только с метаданными, которые не должны обновлять активность сеанса, и `replaceEntry: true` только когда обратный вызов возвращает полную запись и удаленные поля должны оставаться удаленными.

    Для чтения и записи стенограмм импортируйте `openclaw/plugin-sdk/session-transcript-runtime` и используйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` или `withSessionTranscriptWriteLock(...)` с `{ agentId, sessionKey, sessionId }`. Эти API позволяют Plugin идентифицировать стенограмму, читать ее события, добавлять сообщения, публиковать обновления и выполнять связанные операции под той же блокировкой записи стенограммы. Передача `sessionFile`, использование `resolveSessionTranscriptLegacyFileTarget(...)` или импорт низкоуровневых `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` из `openclaw/plugin-sdk/agent-harness-runtime` устарели; эти пути существуют только для legacy-кода, который уже получает активный артефакт стенограммы.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` и `resolveAndPersistSessionFile(...)` — устаревшие вспомогательные функции совместимости для Plugin, которые все еще намеренно зависят от устаревшей формы всего хранилища или файла стенограммы. Новый код Plugin не должен использовать эти вспомогательные функции, а существующим вызывающим сторонам следует мигрировать на вспомогательные функции записей и вспомогательные функции идентичности стенограмм.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константы модели и провайдера по умолчанию:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Запустите текстовое completion, принадлежащее хосту, без импорта внутренних модулей провайдера или
    дублирования подготовки модели, аутентификации и базового URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Эта вспомогательная функция использует тот же путь подготовки simple-completion, что и
    встроенный runtime OpenClaw, а также runtime-снимок конфигурации, принадлежащий хосту. Контекстные движки
    получают привязанную к сеансу capability `llm.complete`, поэтому вызовы модели используют
    агента активного сеанса и не выполняют неявный откат к агенту по умолчанию. Результат
    включает атрибуцию провайдера/модели/агента, а также нормализованное использование токенов,
    кэша и оценочной стоимости, когда это доступно.

    <Warning>
    Переопределения модели требуют явного согласия оператора через `plugins.entries.<id>.llm.allowModelOverride: true` в конфигурации. Используйте `plugins.entries.<id>.llm.allowedModels`, чтобы ограничить доверенные Plugin конкретными каноническими целями `provider/model`. Completion между агентами требуют `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запуск и управление фоновыми запусками subagent.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Переопределения модели (`provider`/`model`) требуют явного согласия оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` в конфигурации. Недоверенные plugins все еще могут запускать субагенты, но запросы на переопределение отклоняются.
    </Warning>

    `deleteSession(...)` может удалять сеансы, созданные тем же plugin через `api.runtime.subagent.run(...)`. Удаление произвольных пользовательских или операторских сеансов по-прежнему требует запроса Gateway с областью администратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Выводит список подключенных узлов и вызывает команду узла-хоста из кода plugin, загруженного Gateway, или из CLI-команд plugin. Используйте это, когда plugin владеет локальной работой на сопряженном устройстве, например браузером или аудиомостом на другом Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Внутри Gateway эта среда выполнения работает в том же процессе. В CLI-командах plugin она вызывает настроенный Gateway через RPC, поэтому команды вроде `openclaw googlemeet recover-tab` могут проверять сопряженные узлы из терминала. Команды узлов по-прежнему проходят обычное сопряжение узлов Gateway, списки разрешенных команд, политики вызова узлов plugin и локальную обработку команд на узле.

    Plugins, которые предоставляют опасные команды узла-хоста, должны регистрировать политику вызова узла с помощью `api.registerNodeInvokePolicy(...)`. Политика выполняется в Gateway после проверок списка разрешенных команд и до пересылки команды на узел, поэтому прямые вызовы `node.invoke` и инструменты plugin более высокого уровня используют один и тот же путь принудительного применения.

    <Warning>
    Необязательное поле `scopes` запрашивает операторские области Gateway для вызова. OpenClaw учитывает его только для встроенных plugins и доверенных установок официальных plugin; запросы от других plugins не повышают привилегии вызова. Используйте его только тогда, когда доверенному plugin нужно вызвать команду узла с более строгой областью Gateway, например `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Привязывает среду выполнения потока задач к существующему ключу сеанса OpenClaw или доверенному контексту инструмента, а затем создает и управляет потоками задач без передачи владельца в каждом вызове.

    Поток задач отслеживает долговечное состояние многошагового рабочего процесса. Это не планировщик:
    используйте Cron или `api.session.workflow.scheduleSessionTurn(...)` для будущих
    пробуждений, затем используйте `managedFlows` из запланированного хода, когда этой работе
    нужно состояние потока, дочерние задачи, ожидания или отмена.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
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

    Используйте `bindSession({ sessionKey, requesterOrigin })`, когда у вас уже есть доверенный ключ сеанса OpenClaw из собственного слоя привязки. Не выполняйте привязку из необработанного пользовательского ввода.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез речи из текста.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Использует основную конфигурацию `messages.tts` и выбор провайдера. Возвращает PCM-аудиобуфер и частоту дискретизации.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Анализ изображений, аудио и видео.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
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

    Возвращает `{ text: undefined }`, когда вывод не создан (например, входные данные пропущены).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` остается совместимым псевдонимом для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Генерация изображений.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Веб-поиск.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Низкоуровневые утилиты для медиа.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
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
    Текущий снимок конфигурации среды выполнения и транзакционные записи конфигурации. Предпочитайте
    конфигурацию, которая уже была передана в активный путь вызова; используйте
    `current()` только тогда, когда обработчику напрямую нужен снимок процесса.

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
    которое фиксирует намерение записывающего кода, не забирая управление перезапуском у
    Gateway.

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` возвращает захваченные `stdout` и `stderr`, необязательные
    счетчики усечения, `code`, `signal`, `killed`, `termination` и
    `noOutputTimedOut`. Результаты тайм-аута и тайм-аута без вывода сообщают `code: 124`,
    когда дочерний процесс не предоставляет ненулевой код выхода. Выходы по сигналу
    без тайм-аута все еще могут возвращать `code: null`, поэтому используйте `termination` и
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
    Логирование.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Разрешение аутентификации модели и провайдера.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Разрешение каталога состояния и хранилище ключей на базе SQLite.

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

    Хранилища с ключами переживают перезапуски и изолированы идентификатором Plugin, привязанным к среде выполнения. Используйте `registerIfAbsent(...)` для атомарных заявок дедупликации: он возвращает `true`, когда ключ отсутствовал или истек и был зарегистрирован, либо `false`, когда активное значение уже существует без перезаписи его значения, времени создания или TTL. Ограничения: `maxEntries` на пространство имен, 6 000 активных строк на Plugin, значения JSON меньше 64 КБ и необязательное истечение по TTL. Когда запись превысила бы лимит строк Plugin, среда выполнения может вытеснить самые старые активные строки из записываемого пространства имен; соседние пространства имен для этой записи не вытесняются, и запись все равно завершается ошибкой, если пространство имен не может освободить достаточно строк.

    <Warning>
    В этом выпуске только встроенные Plugins.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Фабрики инструментов памяти и CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Вспомогательные средства среды выполнения, специфичные для канала (доступны, когда загружен Plugin канала).

    `api.runtime.channel.media` — предпочтительная поверхность для загрузки и хранения медиа канала:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Используйте `saveRemoteMedia(...)`, когда удаленный URL должен стать медиа OpenClaw. Используйте `saveResponseMedia(...)`, когда Plugin уже получил `Response` с собственной обработкой аутентификации, перенаправлений или списка разрешений. Используйте `readRemoteMediaBuffer(...)` только когда Plugin нужны сырые байты для проверки, преобразований, расшифровки или повторной загрузки. `fetchRemoteMedia(...)` остается устаревшим совместимым псевдонимом для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — общая поверхность политики входящих упоминаний для встроенных Plugins каналов, которые используют внедрение среды выполнения:

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

    Доступные вспомогательные средства упоминаний:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` намеренно не раскрывает старые совместимые вспомогательные средства `resolveMentionGating*`. Предпочитайте нормализованный путь `{ facts, policy }`.

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
  <Step title="Доступ из других файлов">
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
Предпочитайте `pluginId` для идентичности runtime-store. Низкоуровневая форма `key` предназначена для редких случаев, когда одному Plugin намеренно требуется больше одного слота среды выполнения.
</Note>

## Другие поля `api` верхнего уровня

Помимо `api.runtime`, объект API также предоставляет:

<ParamField path="api.id" type="string">
  Идентификатор Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Отображаемое имя Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Текущий снимок конфигурации (активный снимок среды выполнения в памяти, когда доступен).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфигурация, специфичная для Plugin, из `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Логгер с областью действия (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Текущий режим загрузки; `"setup-runtime"` — легковесное окно запуска/настройки перед полной точкой входа.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Разрешает путь относительно корня Plugin.
</ParamField>

## Связанные материалы

- [Внутреннее устройство Plugin](/ru/plugins/architecture) — модель возможностей и реестр
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — параметры `definePluginEntry`
- [Обзор SDK](/ru/plugins/sdk-overview) — справочник подпутей
