---
read_when:
    - Вам нужно вызывать вспомогательные функции ядра из Plugin (TTS, STT, генерация изображений, веб-поиск, субагент, узлы)
    - Вы хотите понять, что предоставляет api.runtime
    - Вы обращаетесь к помощникам конфигурации, агента или медиа из кода Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- внедрённые вспомогательные средства runtime, доступные для Plugin
title: 'Plugin: вспомогательные средства среды выполнения'
x-i18n:
    generated_at: "2026-06-28T23:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Справочник по объекту `api.runtime`, внедряемому в каждый плагин при регистрации. Используйте эти помощники вместо прямого импорта внутренних модулей хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ru/plugins/sdk-channel-plugins">
    Пошаговое руководство, использующее эти помощники в контексте плагинов каналов.
  </Card>
  <Card title="Provider plugins" href="/ru/plugins/sdk-provider-plugins">
    Пошаговое руководство, использующее эти помощники в контексте плагинов провайдеров.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Загрузка и запись конфигурации

Предпочитайте конфигурацию, которая уже была передана в активный путь вызова, например `api.config` при регистрации или аргумент `cfg` в обратных вызовах канала/провайдера. Так один снимок процесса проходит через работу без повторного разбора конфигурации на горячих путях.

Используйте `api.runtime.config.current()` только когда долгоживущему обработчику нужен текущий снимок процесса и в эту функцию не была передана конфигурация. Возвращаемое значение доступно только для чтения; перед редактированием клонируйте его или используйте помощник мутации.

Фабрики инструментов получают `ctx.runtimeConfig` и `ctx.getRuntimeConfig()`. Используйте getter внутри обратного вызова `execute` долгоживущего инструмента, когда конфигурация может измениться после создания определения инструмента.

Сохраняйте изменения с помощью `api.runtime.config.mutateConfigFile(...)` или `api.runtime.config.replaceConfigFile(...)`. Каждая запись должна выбрать явную политику `afterWrite`:

- `afterWrite: { mode: "auto" }` позволяет механизму перезагрузки Gateway принять решение.
- `afterWrite: { mode: "restart", reason: "..." }` принудительно выполняет чистый перезапуск, когда записывающая сторона знает, что горячая перезагрузка небезопасна.
- `afterWrite: { mode: "none", reason: "..." }` подавляет автоматическую перезагрузку/перезапуск только когда вызывающая сторона сама отвечает за последующие действия.

Помощники мутации возвращают `afterWrite` и типизированную сводку `followUp`, чтобы вызывающие стороны могли логировать или тестировать, запросили ли они перезапуск. Gateway по-прежнему отвечает за то, когда этот перезапуск фактически произойдет.

`api.runtime.config.loadConfig()` и `api.runtime.config.writeConfigFile(...)` являются устаревшими помощниками совместимости под `runtime-config-load-write`. Они один раз предупреждают во время выполнения и остаются доступными для старых внешних плагинов в течение окна миграции. Встроенные плагины не должны их использовать; защитные проверки границы конфигурации завершаются ошибкой, если код плагина вызывает их или импортирует эти помощники из подпутей SDK плагина.

Для прямого импорта SDK используйте специализированные подпути конфигурации вместо широкого совместимого barrel
`openclaw/plugin-sdk/config-runtime`: `config-contracts` для типов, `plugin-config-runtime` для утверждений уже загруженной конфигурации и поиска точки входа плагина, `runtime-config-snapshot` для текущих снимков процесса и `config-mutation` для записей. Тесты встроенных плагинов должны напрямую мокировать эти специализированные подпути вместо мокирования широкого совместимого barrel.

Внутренний runtime-код OpenClaw следует тому же направлению: загрузить конфигурацию один раз на границе CLI, Gateway или процесса, затем передавать это значение дальше. Успешные записи мутаций обновляют снимок runtime процесса и продвигают его внутреннюю ревизию; долгоживущие кэши должны использовать ключ кэша, принадлежащий runtime, вместо локальной сериализации конфигурации. Для долгоживущих runtime-модулей действует сканер с нулевой терпимостью к фоновым вызовам `loadConfig()`; используйте переданный `cfg`, request `context.getRuntimeConfig()` или `getRuntimeConfig()` на явной границе процесса.

Пути выполнения провайдера и канала должны использовать активный снимок runtime-конфигурации, а не файловый снимок, возвращенный для чтения или редактирования конфигурации. Файловые снимки сохраняют исходные значения, такие как маркеры SecretRef, для UI и записей; обратным вызовам провайдера нужен разрешенный runtime-вид. Когда помощник может быть вызван как с активным исходным снимком, так и с активным runtime-снимком, перед чтением учетных данных направляйте вызов через `selectApplicableRuntimeConfig()`.

## Переиспользуемые runtime-утилиты

Используйте входящие факты `botLoopProtection` для входящих сообщений, созданных ботом. Core применяет общий in-memory sliding-window guard до записи сессии и dispatch, не привязывая политику к одному каналу. Guard отслеживает ключи `(scopeId, conversationId, participant pair)`, считает оба направления пары вместе, применяет cooldown после превышения бюджета окна и оппортунистически удаляет неактивные записи.

Плагины каналов, которые раскрывают это поведение операторам, должны предпочитать общую форму `channels.defaults.botLoopProtection` для базовых бюджетов, а затем накладывать сверху переопределения, специфичные для канала/провайдера. Общая конфигурация использует секунды, потому что она видима пользователю:

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

Используйте `openclaw/plugin-sdk/pair-loop-guard-runtime` напрямую только для пользовательских двухсторонних event loop, которые не проходят через общий inbound reply runner.

## Пространства имен runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Идентичность агента, каталоги и управление сессиями.

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

    `runEmbeddedAgent(...)` — нейтральный помощник для запуска обычного хода агента OpenClaw из кода плагина. Он использует то же разрешение провайдера/модели и выбор agent-harness, что и ответы, запущенные каналом.

    `runEmbeddedPiAgent(...)` остается устаревшим совместимым алиасом для существующих плагинов. Новый код должен использовать `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` возвращает поддерживаемые провайдером/моделью уровни thinking и необязательное значение по умолчанию. Плагины провайдеров владеют профилем конкретной модели через свои thinking hooks, поэтому плагины инструментов должны вызывать этот runtime-помощник вместо импорта или дублирования списков провайдеров.

    `normalizeThinkingLevel(...)` преобразует пользовательский текст, такой как `on`, `x-high` или `extra high`, в канонический сохраняемый уровень перед проверкой по разрешенной политике.

    **Помощники хранилища сессий** находятся в `api.runtime.agent.session`:

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

    Предпочитайте `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` или `upsertSessionEntry(...)` для рабочих процессов сессий. Эти помощники адресуют сессии по идентичности агента/сессии, чтобы плагины не зависели от устаревшей формы хранилища `sessions.json`. Используйте `preserveActivity: true` для патчей только метаданных, которые не должны обновлять активность сессии, и `replaceEntry: true` только когда обратный вызов возвращает полную запись, а удаленные поля должны остаться удаленными.

    Для чтения и записи транскриптов импортируйте `openclaw/plugin-sdk/session-transcript-runtime` и используйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` или `withSessionTranscriptWriteLock(...)` с `{ agentId, sessionKey, sessionId }`. Эти API позволяют плагинам идентифицировать транскрипт, читать его события, добавлять сообщения, публиковать обновления и выполнять связанные операции под той же блокировкой записи транскрипта. Передача `sessionFile`, использование `resolveSessionTranscriptLegacyFileTarget(...)` или импорт низкоуровневых `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` из `openclaw/plugin-sdk/agent-harness-runtime` устарели; эти пути существуют только для legacy-кода, который уже получает активный артефакт транскрипта.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` и `resolveAndPersistSessionFile(...)` являются устаревшими помощниками совместимости для плагинов, которые все еще намеренно зависят от устаревшей формы всего хранилища или файла транскрипта. Новый код плагина не должен использовать эти помощники, а существующие вызывающие стороны должны мигрировать на помощники записей и помощники идентичности транскриптов.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константы модели и провайдера по умолчанию:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Запустите текстовое completion, принадлежащее хосту, без импорта внутренних модулей провайдера или дублирования подготовки модели/аутентификации/base URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Помощник использует тот же путь подготовки простого completion, что и встроенный runtime OpenClaw, а также принадлежащий хосту снимок runtime-конфигурации. Context engines получают привязанную к сессии возможность `llm.complete`, поэтому вызовы модели используют агента активной сессии и не выполняют молчаливый fallback к агенту по умолчанию. Результат включает атрибуцию провайдера/модели/агента, а также нормализованные данные об использовании токенов, кэша и оценочной стоимости, когда они доступны.

    <Warning>
    Переопределения модели требуют явного согласия оператора через `plugins.entries.<id>.llm.allowModelOverride: true` в конфигурации. Используйте `plugins.entries.<id>.llm.allowedModels`, чтобы ограничить доверенные плагины конкретными каноническими целями `provider/model`. Completion между агентами требуют `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Переопределения модели (`provider`/`model`) требуют явного согласия оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` в конфигурации. Недоверенные plugins по-прежнему могут запускать субагентов, но запросы на переопределение отклоняются.
    </Warning>

    `deleteSession(...)` может удалять сеансы, созданные тем же plugin через `api.runtime.subagent.run(...)`. Удаление произвольных пользовательских или операторских сеансов по-прежнему требует запроса Gateway с областью администратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Выводит список подключенных узлов и вызывает команду хоста узла из кода plugin, загруженного Gateway, или из CLI-команд plugin. Используйте это, когда plugin владеет локальной работой на сопряженном устройстве, например браузером или аудиомостом на другом Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Внутри Gateway эта среда выполнения работает внутри процесса. В CLI-командах plugin она вызывает настроенный Gateway через RPC, поэтому команды вроде `openclaw googlemeet recover-tab` могут проверять сопряженные узлы из терминала. Команды узлов по-прежнему проходят через обычное сопряжение узлов Gateway, списки разрешенных команд, политики вызова узлов plugin и локальную обработку команд на узле.

    Plugins, которые предоставляют опасные команды хоста узла, должны зарегистрировать политику вызова узлов с помощью `api.registerNodeInvokePolicy(...)`. Политика выполняется в Gateway после проверок списка разрешенных команд и до пересылки команды на узел, поэтому прямые вызовы `node.invoke` и высокоуровневые инструменты plugin используют один и тот же путь принудительного применения.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Привяжите среду выполнения Task Flow к существующему ключу сеанса OpenClaw или доверенному контексту инструмента, затем создавайте Task Flows и управляйте ими без передачи владельца при каждом вызове.

    Task Flow отслеживает долговечное состояние многошагового рабочего процесса. Это не планировщик:
    используйте Cron или `api.session.workflow.scheduleSessionTurn(...)` для будущих
    пробуждений, затем используйте `managedFlows` из запланированного хода, когда этой работе
    нужны состояние потока, дочерние задачи, ожидания или отмена.

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

    Использует базовую конфигурацию `messages.tts` и выбор провайдера. Возвращает аудиобуфер PCM и частоту дискретизации.

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
    `api.runtime.stt.transcribeAudioFile(...)` остается псевдонимом совместимости для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Низкоуровневые медиаутилиты.

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
    `current()` только когда обработчику напрямую нужен снимок процесса.

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
    которое фиксирует намерение автора записи, не забирая управление перезапуском у
    gateway.

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
    `noOutputTimedOut`. Результаты тайм-аута и тайм-аута отсутствия вывода сообщают `code: 124`,
    когда дочерний процесс не предоставляет ненулевой код выхода. Выходы по сигналу
    без тайм-аута всё еще могут возвращать `code: null`, поэтому используйте `termination` и
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

    Хранилища с ключами переживают перезапуски и изолированы идентификатором плагина, привязанным к среде выполнения. Используйте `registerIfAbsent(...)` для атомарных заявок дедупликации: он возвращает `true`, когда ключ отсутствовал или истек и был зарегистрирован, либо `false`, когда уже существует активное значение без перезаписи его значения, времени создания или TTL. Ограничения: `maxEntries` на пространство имен, 6 000 активных строк на плагин, JSON-значения меньше 64 КБ и необязательное истечение по TTL. Когда запись превысила бы лимит строк плагина, среда выполнения может вытеснить самые старые активные строки из пространства имен, в которое выполняется запись; соседние пространства имен при этой записи не вытесняются, и запись все равно завершается ошибкой, если пространство имен не может освободить достаточно строк.

    <Warning>
    В этом выпуске только встроенные плагины.
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
    Вспомогательные функции среды выполнения для конкретного канала (доступны, когда загружен плагин канала).

    `api.runtime.channel.media` — предпочтительная поверхность для загрузок и хранения медиа канала:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Используйте `saveRemoteMedia(...)`, когда удаленный URL должен стать медиа OpenClaw. Используйте `saveResponseMedia(...)`, когда плагин уже получил `Response` с собственной обработкой авторизации, перенаправлений или allowlist. Используйте `readRemoteMediaBuffer(...)` только когда плагину нужны необработанные байты для проверки, преобразований, расшифровки или повторной загрузки. `fetchRemoteMedia(...)` остается устаревшим совместимым псевдонимом для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — общая поверхность политики входящих упоминаний для встроенных плагинов каналов, которые используют внедрение среды выполнения:

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

    Доступные вспомогательные функции упоминаний:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` намеренно не предоставляет старые совместимые вспомогательные функции `resolveMentionGating*`. Предпочитайте нормализованный путь `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Хранение ссылок среды выполнения

Используйте `createPluginRuntimeStore`, чтобы хранить ссылку среды выполнения для использования вне callback-функции `register`:

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
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
  <Step title="Access from other files">
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
Предпочитайте `pluginId` для идентичности runtime-store. Низкоуровневая форма `key` предназначена для редких случаев, когда одному плагину намеренно нужно больше одного слота среды выполнения.
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
  Логгер с областью (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Текущий режим загрузки; `"setup-runtime"` — легковесное окно запуска/настройки перед полной точкой входа.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Разрешить путь относительно корня плагина.
</ParamField>

## Связанные материалы

- [Внутреннее устройство Plugin](/ru/plugins/architecture) — модель возможностей и реестр
- [Точки входа SDK](/ru/plugins/sdk-entrypoints) — параметры `definePluginEntry`
- [Обзор SDK](/ru/plugins/sdk-overview) — справочник подпутей
