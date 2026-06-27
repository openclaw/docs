---
read_when:
    - Потрібно викликати допоміжні функції ядра з Plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до помічників конфігурації, агента або медіа з коду Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- інжектовані допоміжні функції середовища виконання, доступні для плагінів
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-06-27T18:05:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідник для об’єкта `api.runtime`, який впроваджується в кожен Plugin під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх модулів хоста.

<CardGroup cols={2}>
  <Card title="Plugin для каналів" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті Plugin для каналів.
  </Card>
  <Card title="Plugin для постачальників" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті Plugin для постачальників.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження та запис конфігурації

Надавайте перевагу конфігурації, яка вже була передана в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у callback-функціях каналу чи постачальника. Так один знімок процесу проходить крізь роботу замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довготривалому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано цій функції. Повернене значення доступне лише для читання; перед редагуванням клоновуйте його або використовуйте допоміжний засіб мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` плюс `ctx.getRuntimeConfig()`. Використовуйте getter усередині callback-функції `execute` довготривалого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє планувальнику перезавантаження Gateway вирішувати.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли автор запису знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження або перезапуск лише тоді, коли викликач сам відповідає за подальші дії.

Допоміжні засоби мутації повертають `afterWrite` плюс типізований підсумок `followUp`, щоб викликачі могли журналювати або тестувати, чи вони запитали перезапуск. Gateway і далі визначає, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` є застарілими допоміжними засобами сумісності в межах `runtime-config-load-write`. Вони попереджають один раз під час виконання та залишаються доступними для старих зовнішніх Plugin протягом міграційного вікна. Вбудовані Plugin не повинні їх використовувати; запобіжники межі конфігурації завершуються помилкою, якщо код Plugin викликає їх або імпортує ці допоміжні засоби з підшляхів SDK Plugin.

Для прямих імпортів SDK використовуйте вузькоспеціалізовані підшляхи конфігурації замість широкого сумісного barrel
`openclaw/plugin-sdk/config-runtime`: `config-contracts` для
типів, `plugin-config-runtime` для перевірок уже завантаженої конфігурації та пошуку
точки входу Plugin, `runtime-config-snapshot` для поточних знімків процесу, а також
`config-mutation` для записів. Тести вбудованих Plugin мають mock-ати ці вузькі
підшляхи напряму замість mock-ання широкого сумісного barrel.

Внутрішній runtime-код OpenClaw має той самий напрям: завантажити конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавати це значення далі. Успішні записи мутацій оновлюють runtime-знімок процесу та просувають його внутрішню ревізію; довготривалі кеші мають спиратися на runtime-власний ключ кешу замість локальної серіалізації конфігурації. Довготривалі runtime-модулі мають сканер нульової терпимості до фонових викликів `loadConfig()`; використовуйте переданий `cfg`, запитовий `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання постачальників і каналів мають використовувати активний знімок runtime-конфігурації, а не файловий знімок, повернений для читання чи редагування конфігурації. Файлові знімки зберігають вихідні значення, як-от маркери SecretRef для UI та записів; callback-функціям постачальників потрібне розв’язане runtime-представлення. Коли допоміжний засіб може бути викликаний або з активним вихідним знімком, або з активним runtime-знімком, маршрутизуйте через `selectApplicableRuntimeConfig()` перед читанням облікових даних.

## Багаторазові runtime-утиліти

Використовуйте вхідні факти `botLoopProtection` для вхідних повідомлень, створених ботом. Core застосовує спільний in-memory захист із ковзним вікном перед записом сесії та dispatch, не прив’язуючи політику до одного каналу. Захист відстежує ключі `(scopeId, conversationId, participant pair)`, рахує обидва напрями пари разом, застосовує cooldown після перевищення бюджету вікна та опортуністично обрізає неактивні записи.

Plugin каналів, які надають цю поведінку операторам, мають віддавати перевагу спільній формі `channels.defaults.botLoopProtection` для базових бюджетів, а потім нашаровувати поверх неї перевизначення, специфічні для каналу чи постачальника. Спільна конфігурація використовує секунди, бо вона видима користувачу:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Передавайте нормалізовані факти пари ботів із розв’язаним ходом. Core розв’язує стандартні значення, перетворення одиниць і семантику `enabled`:

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

Використовуйте `openclaw/plugin-sdk/pair-loop-guard-runtime` напряму лише для користувацьких
двосторонніх циклів подій, які не проходять через спільний runner вхідних відповідей.

## Runtime-простори імен

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Ідентичність агента, каталоги та керування сесіями.

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
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` — нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw з коду Plugin. Він використовує те саме розв’язання постачальника/моделі та вибір агентного harness, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається застарілим сумісним псевдонімом для наявних Plugin. Новий код має використовувати `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` повертає підтримувані рівні thinking для постачальника/моделі та необов’язкове стандартне значення. Plugin постачальників володіють профілем, специфічним для моделі, через свої thinking-хуки, тому Plugin інструментів мають викликати цей runtime-допоміжний засіб замість імпортування чи дублювання списків постачальників.

    `normalizeThinkingLevel(...)` перетворює користувацький текст, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою його за розв’язаною політикою.

    **Допоміжні засоби сховища сесій** розміщені в `api.runtime.agent.session`:

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

    Надавайте перевагу `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` або `upsertSessionEntry(...)` для workflow сесій. Ці допоміжні засоби адресують сесії за ідентичністю агента/сесії, щоб Plugin не залежали від застарілої форми сховища `sessions.json`. Використовуйте `preserveActivity: true` для патчів лише метаданих, які не мають оновлювати активність сесії, і `replaceEntry: true` лише тоді, коли callback повертає повний запис, а видалені поля мають залишатися видаленими.

    Для читання та запису transcript імпортуйте `openclaw/plugin-sdk/session-transcript-runtime` і використовуйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` або `withSessionTranscriptWriteLock(...)` з `{ agentId, sessionKey, sessionId }`. Ці API дають Plugin змогу ідентифікувати transcript, читати його події, додавати повідомлення, публікувати оновлення та виконувати пов’язані операції під тим самим блокуванням запису transcript. Передавайте `sessionFile` лише під час адаптації коду, який уже отримує активний артефакт transcript і потребує, щоб кожен допоміжний засіб працював із тим самим артефактом.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` і `resolveSessionFilePath(...)` є допоміжними засобами сумісності для Plugin, які досі навмисно залежать від застарілої форми цілого сховища або файлу transcript. Новий код Plugin не повинен використовувати ці допоміжні засоби, а наявні викликачі мають мігрувати на допоміжні засоби записів.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Стандартні константи моделі та постачальника:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Запустіть текстове завершення, яким володіє хост, без імпорту внутрішніх модулів постачальника або
    дублювання підготовки моделі, автентифікації чи базової URL-адреси OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Допоміжний засіб використовує той самий шлях підготовки простого завершення, що й
    вбудований runtime OpenClaw, а також runtime-знімок конфігурації, яким володіє хост. Context engines
    отримують прив’язану до сесії можливість `llm.complete`, тому виклики моделі використовують
    агента активної сесії та не виконують тихий fallback до стандартного агента. Результат
    містить атрибуцію постачальника/моделі/агента плюс нормалізоване використання токенів,
    кешу та оціненої вартості, коли воно доступне.

    <Warning>
    Перевизначення моделі потребують явної згоди оператора через `plugins.entries.<id>.llm.allowModelOverride: true` у конфігурації. Використовуйте `plugins.entries.<id>.llm.allowedModels`, щоб обмежити довірені Plugin конкретними канонічними цілями `provider/model`. Завершення між агентами потребують `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте фонові виконання subagent та керуйте ними.

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
    Перевизначення моделей (`provider`/`model`) потребують явної згоди оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені плагіни все ще можуть запускати субагентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим плагіном через `api.runtime.subagent.run(...)`. Видалення довільних сесій користувача або оператора все ще потребує Gateway-запиту з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Перелічуйте підключені вузли та викликайте команду хоста вузла з коду плагіна, завантаженого Gateway, або з CLI-команд плагіна. Використовуйте це, коли плагін володіє локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в межах процесу. У CLI-командах плагіна він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди вузлів усе ще проходять звичайне спарювання вузлів Gateway, списки дозволених команд, політики виклику вузлів плагіна та локальну обробку команд вузла.

    Плагіни, що надають небезпечні команди хоста вузла, мають реєструвати політику виклику вузла через `api.registerNodeInvokePolicy(...)`. Політика виконується в Gateway після перевірок списку дозволених команд і перед пересиланням команди до вузла, тож прямі виклики `node.invoke` і високорівневі інструменти плагіна мають спільний шлях застосування правил.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’яжіть runtime потоку завдань до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створюйте потоки завдань і керуйте ними без передавання власника в кожному виклику.

    Потік завдань відстежує довговічний стан багатоетапного workflow. Це не планувальник:
    використовуйте Cron або `api.session.workflow.scheduleSessionTurn(...)` для майбутніх
    пробуджень, а потім використовуйте `managedFlows` із запланованого ходу, коли цій роботі
    потрібні стан потоку, дочірні завдання, очікування або скасування.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із власного шару прив’язки. Не прив’язуйте з необробленого введення користувача.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез мовлення з тексту.

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

    Використовує основну конфігурацію `messages.tts` і вибір провайдера. Повертає PCM-аудіобуфер + частоту дискретизації.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Аналіз зображень, аудіо та відео.

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

    Повертає `{ text: undefined }`, коли результат не створено (наприклад, вхід пропущено).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` залишається сумісним псевдонімом для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Генерація зображень.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Вебпошук.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Низькорівневі медіаутиліти.

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
    Поточний знімок runtime-конфігурації та транзакційні записи конфігурації. Надавайте перевагу
    конфігурації, яку вже передано в активний шлях виклику; використовуйте
    `current()` лише тоді, коли обробнику потрібен безпосередньо знімок процесу.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` і `replaceConfigFile(...)` повертають значення `followUp`,
    наприклад `{ mode: "restart", requiresRestart: true, reason }`,
    яке фіксує намір записувача, не забираючи керування перезапуском у
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Утиліти системного рівня.

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

    `runCommandWithTimeout(...)` повертає захоплені `stdout` і `stderr`, необов’язкові
    лічильники обрізання, `code`, `signal`, `killed`, `termination` і
    `noOutputTimedOut`. Результати timeout і no-output-timeout повідомляють `code: 124`,
    коли дочірній процес не надає ненульовий код виходу. Виходи за сигналом без timeout
    усе ще можуть повертати `code: null`, тож використовуйте `termination` і
    `noOutputTimedOut`, щоб розрізняти причини timeout.

  </Accordion>
  <Accordion title="api.runtime.events">
    Підписки на події.

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
    Логування.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Визначення автентифікації моделі та провайдера.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Визначення каталогу стану та сховище ключів на основі SQLite.

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

    Сховища з ключами переживають перезапуски та ізольовані за id плагіна, прив’язаним до середовища виконання. Використовуйте `registerIfAbsent(...)` для атомарних заявок дедуплікації: він повертає `true`, коли ключ був відсутній або прострочений і зареєстрований, або `false`, коли активне значення вже існує без перезапису його значення, часу створення чи TTL. Обмеження: `maxEntries` на простір імен, 6 000 активних рядків на плагін, JSON-значення до 64 КБ і необов’язкове завершення строку дії TTL. Коли запис перевищив би ліміт рядків плагіна, середовище виконання може витіснити найстаріші активні рядки з простору імен, у який виконується запис; сусідні простори імен для цього запису не витісняються, і запис усе одно завершується помилкою, якщо простір імен не може звільнити достатньо рядків.

    <Warning>
    У цьому випуску лише вбудовані плагіни.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Фабрики інструментів пам’яті та CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Допоміжні засоби середовища виконання, специфічні для каналів (доступні, коли завантажено плагін каналу).

    `api.runtime.channel.media` є бажаною поверхнею для завантаження й зберігання медіа каналу:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Використовуйте `saveRemoteMedia(...)`, коли віддалений URL має стати медіа OpenClaw. Використовуйте `saveResponseMedia(...)`, коли плагін уже отримав `Response` з обробкою авторизації, перенаправлень або allowlist, що належить плагіну. Використовуйте `readRemoteMediaBuffer(...)` лише тоді, коли плагіну потрібні сирі байти для перевірки, перетворень, розшифрування або повторного завантаження. `fetchRemoteMedia(...)` залишається застарілим сумісним псевдонімом для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих плагінів каналів, які використовують ін’єкцію середовища виконання:

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

    Доступні допоміжні засоби для згадок:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` навмисно не відкриває старіші сумісні допоміжні засоби `resolveMentionGating*`. Віддавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань середовища виконання

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання середовища виконання для використання поза callback `register`:

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
Віддавайте перевагу `pluginId` для ідентичності runtime-store. Нижчорівнева форма `key` призначена для нетипових випадків, коли одному плагіну навмисно потрібно більше ніж один слот середовища виконання.
</Note>

## Інші поля `api` верхнього рівня

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Id плагіна.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва плагіна.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Логер з областю дії (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування перед повним входом.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Розв’язує шлях відносно кореня плагіна.
</ParamField>

## Пов’язане

- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
