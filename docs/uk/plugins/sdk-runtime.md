---
read_when:
    - Вам потрібно викликати основні допоміжні функції з plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до помічників конфігурації, агента або медіа з коду plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- впроваджені допоміжні засоби середовища виконання, доступні плагінам
title: Допоміжні засоби виконання Plugin
x-i18n:
    generated_at: "2026-07-04T20:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідник для об’єкта `api.runtime`, який впроваджується в кожен плагін під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх компонентів хоста.

<CardGroup cols={2}>
  <Card title="Плагіни каналів" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті плагінів каналів.
  </Card>
  <Card title="Плагіни провайдерів" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті плагінів провайдерів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження та запис конфігурації

Віддавайте перевагу конфігурації, яку вже передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у зворотних викликах каналу чи провайдера. Це зберігає один знімок процесу протягом виконання роботи замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довгоживучому обробнику потрібен поточний знімок процесу і цій функції не було передано конфігурацію. Повернене значення доступне лише для читання; перед редагуванням склонуйте його або використайте допоміжний засіб мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` і `ctx.getRuntimeConfig()`. Використовуйте гетер усередині зворотного виклику `execute` довгоживучого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє планувальнику перезавантаження Gateway ухвалити рішення.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли автор запису знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження або перезапуск лише тоді, коли викликач відповідає за подальші дії.

Допоміжні засоби мутації повертають `afterWrite` разом із типізованим підсумком `followUp`, щоб викликачі могли журналювати або тестувати, чи вони запросили перезапуск. Gateway усе ще відповідає за те, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` є застарілими допоміжними засобами сумісності в межах `runtime-config-load-write`. Вони один раз попереджають під час виконання й залишаються доступними для старих зовнішніх плагінів протягом вікна міграції. Вбудовані плагіни не повинні їх використовувати; захисні перевірки межі конфігурації завершуються помилкою, якщо код плагіна викликає їх або імпортує ці допоміжні засоби з підшляхів SDK плагінів.

Для прямих імпортів SDK використовуйте цільові підшляхи конфігурації замість широкого
сумісного barrel `openclaw/plugin-sdk/config-runtime`: `config-contracts` для
типів, `plugin-config-runtime` для тверджень щодо вже завантаженої конфігурації та пошуку
точки входу плагіна, `runtime-config-snapshot` для поточних знімків процесу, а
`config-mutation` для записів. Тести вбудованих плагінів мають мокати ці цільові
підшляхи напряму замість мокання широкого сумісного barrel.

Внутрішній код середовища виконання OpenClaw має той самий напрям: завантажуйте конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавайте це значення далі. Успішні записи мутацій оновлюють знімок середовища виконання процесу та просувають його внутрішню ревізію; довгоживучі кеші мають прив’язуватися до ключа кешу, яким володіє середовище виконання, замість локальної серіалізації конфігурації. Довгоживучі модулі середовища виконання мають сканер із нульовою терпимістю до неявних викликів `loadConfig()`; використовуйте переданий `cfg`, запит `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання провайдерів і каналів мають використовувати активний знімок конфігурації середовища виконання, а не знімок файлу, повернений для зворотного читання або редагування конфігурації. Знімки файлів зберігають вихідні значення, як-от маркери SecretRef, для UI та записів; зворотним викликам провайдерів потрібне розв’язане представлення середовища виконання. Коли допоміжний засіб може бути викликаний або з активним вихідним знімком, або з активним знімком середовища виконання, перед читанням облікових даних маршрутизуйте через `selectApplicableRuntimeConfig()`.

## Багаторазові утиліти середовища виконання

Використовуйте вхідні факти `botLoopProtection` для вхідних повідомлень, створених ботом. Ядро застосовує спільний вбудований у пам’ять захист із ковзним вікном перед записом сесії та диспетчеризацією, не прив’язуючи політику до одного каналу. Захист відстежує ключі `(scopeId, conversationId, participant pair)`, підраховує обидва напрями пари разом, застосовує період охолодження після перевищення бюджету вікна та за можливості видаляє неактивні записи.

Плагіни каналів, які відкривають цю поведінку операторам, мають віддавати перевагу спільній формі `channels.defaults.botLoopProtection` для базових бюджетів, а потім накладати поверх неї перевизначення, специфічні для каналу чи провайдера. Спільна конфігурація використовує секунди, оскільки вона орієнтована на користувача:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Передавайте нормалізовані факти пари ботів із розв’язаним ходом. Ядро розв’язує стандартні значення, перетворення одиниць і семантику `enabled`:

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

  Використовуйте `openclaw/plugin-sdk/pair-loop-guard-runtime` напряму лише для власних
  двосторонніх циклів подій, які не проходять через спільний runner вхідних відповідей.

  ## Простори імен середовища виконання

  <AccordionGroup>
  <Accordion title="api.runtime.agent">
    Ідентичність агента, каталоги та керування сеансами.

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

    `runEmbeddedAgent(...)` — нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw з коду plugin. Він використовує те саме визначення provider/model і вибір agent-harness, що й відповіді, запущені каналом.

    `runEmbeddedPiAgent(...)` залишається застарілим псевдонімом сумісності для наявних plugins. Новий код має використовувати `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` повертає підтримувані provider/model рівні мислення та необов’язкове значення за замовчуванням. Provider plugins володіють профілем, специфічним для моделі, через свої thinking hooks, тому tool plugins мають викликати цей runtime helper замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює користувацький текст, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою за розв’язаною політикою.

    **Допоміжні засоби сховища сеансів** розташовані в `api.runtime.agent.session`:

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Надавайте перевагу `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` або `upsertSessionEntry(...)` для робочих процесів сеансів. Ці допоміжні функції адресують сеанси за ідентичністю агента/сеансу, щоб plugins не залежали від застарілої форми сховища `sessions.json`. Використовуйте `preserveActivity: true` для виправлень лише метаданих, які не повинні оновлювати активність сеансу, і `replaceEntry: true` лише тоді, коли зворотний виклик повертає повний запис, а видалені поля мають залишатися видаленими.

    Використовуйте `runWithWorkAdmission(...)`, коли plugin починає роботу з персистентним сеансом. Зворотний виклик відхиляє архівовані або паралельно замінені сеанси, координує мутації архівування/скидання/видалення до завершення та отримує `AbortSignal`, який потрібно передати до запуску агента.

    Для читання й запису транскриптів імпортуйте `openclaw/plugin-sdk/session-transcript-runtime` і використовуйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` або `withSessionTranscriptWriteLock(...)` з `{ agentId, sessionKey, sessionId }`. Ці API дають plugins змогу ідентифікувати транскрипт, читати його події, додавати повідомлення, публікувати оновлення та виконувати пов’язані операції під тим самим блокуванням запису транскрипта. Передавання `sessionFile`, використання `resolveSessionTranscriptLegacyFileTarget(...)` або імпорт низькорівневих `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` з `openclaw/plugin-sdk/agent-harness-runtime` застаріли; ці шляхи існують лише для застарілого коду, який уже отримує активний артефакт транскрипта.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` і `resolveAndPersistSessionFile(...)` — це застарілі допоміжні функції сумісності для plugins, які досі навмисно залежать від застарілої форми всього сховища або файлу транскрипта. Новий код plugin не повинен використовувати ці допоміжні функції, а наявні виклики слід мігрувати на допоміжні функції записів і допоміжні функції ідентичності транскриптів.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи моделі та провайдера за замовчуванням:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Запустіть текстове доповнення, кероване хостом, без імпорту внутрішніх компонентів провайдера або
    дублювання підготовки моделі, автентифікації та базової URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Допоміжна функція використовує той самий шлях підготовки простого доповнення, що й
    вбудоване середовище виконання OpenClaw, а також знімок конфігурації середовища виконання, керований хостом. Рушії контексту
    отримують прив’язану до сеансу можливість `llm.complete`, тому виклики моделі використовують
    агента активного сеансу й не переходять непомітно до агента за замовчуванням. Результат
    містить атрибуцію провайдера/моделі/агента, а також нормалізоване використання токенів,
    кешу й оціненої вартості, коли це доступно.

    <Warning>
    Перевизначення моделей потребують явної згоди оператора через `plugins.entries.<id>.llm.allowModelOverride: true` у конфігурації. Використовуйте `plugins.entries.<id>.llm.allowedModels`, щоб обмежити довірені plugins конкретними канонічними цілями `provider/model`. Завершення між агентами потребують `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте й керуйте фоновими запусками підлеглих агентів.

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
    Перевизначення моделей (`provider`/`model`) потребують явної згоди оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені plugins усе ще можуть запускати підлеглих агентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сеанси, створені тим самим plugin через `api.runtime.subagent.run(...)`. Видалення довільних сеансів користувача або оператора все ще потребує запиту Gateway з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Перелічуйте підключені вузли й викликайте команду хоста вузла з коду plugin, завантаженого Gateway, або з CLI-команд plugin. Використовуйте це, коли plugin володіє локальною роботою на спареному пристрої, наприклад мостом браузера або аудіо на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway це середовище виконання працює в процесі. У CLI-командах plugin воно викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди Node все одно проходять звичайне спарення вузлів Gateway, списки дозволених команд, політики виклику вузлів plugin і локальну обробку команд на вузлі.

    Plugins, які відкривають небезпечні команди хоста вузла, мають зареєструвати політику виклику вузла через `api.registerNodeInvokePolicy(...)`. Політика виконується в Gateway після перевірок списку дозволених команд і перед пересиланням команди на вузол, тож прямі виклики `node.invoke` і високорівневі інструменти plugin використовують той самий шлях застосування правил.

    <Warning>
    Необов’язкове поле `scopes` запитує операторські області Gateway для виклику. OpenClaw враховує його лише для вбудованих plugins і довірених офіційних установлень plugin; запити від інших plugins не підвищують привілеї виклику. Використовуйте його лише тоді, коли довірений plugin має викликати команду вузла зі суворішою областю Gateway, як-от `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’яжіть середовище виконання Task Flow до наявного ключа сеансу OpenClaw або довіреного контексту інструмента, а потім створюйте й керуйте Task Flows без передавання власника під час кожного виклику.

    Task Flow відстежує довготривалий стан багатоетапного робочого процесу. Це не планувальник:
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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли вже маєте довірений ключ сеансу OpenClaw із власного шару прив’язки. Не прив’язуйте з необробленого введення користувача.

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

    Використовує основну конфігурацію `messages.tts` і вибір провайдера. Повертає аудіобуфер PCM + частоту дискретизації.

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

    Повертає `{ text: undefined }`, коли не створено жодного виводу (наприклад, введення пропущено).

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
    Поточний знімок конфігурації середовища виконання й транзакційні записи конфігурації. Надавайте перевагу
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
    яке записує намір записувача, не забираючи контроль перезапуску від
    gateway.

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
    `noOutputTimedOut`. Результати тайм-ауту й тайм-ауту без виводу повідомляють `code: 124`,
    коли дочірній процес не надає ненульового коду виходу. Виходи за сигналом
    без тайм-ауту все ще можуть повертати `code: null`, тому використовуйте `termination` і
    `noOutputTimedOut`, щоб розрізняти причини тайм-ауту.

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
    Журналювання.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Розв’язання автентифікації моделі та провайдера.

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

    Сховища ключів зберігаються після перезапусків і ізолюються за прив’язаним до середовища виконання id Plugin. Використовуйте `registerIfAbsent(...)` для атомарних заявок дедуплікації: він повертає `true`, коли ключ був відсутній або прострочений і зареєстрований, або `false`, коли активне значення вже існує без перезапису його значення, часу створення чи TTL. Обмеження: `maxEntries` на простір імен, 6 000 активних рядків на Plugin, JSON-значення менші за 64KB та необов’язкове завершення строку дії TTL. Коли запис перевищив би ліміт рядків Plugin, середовище виконання може витіснити найстаріші активні рядки з простору імен, у який виконується запис; суміжні простори імен для цього запису не витісняються, а запис усе одно завершується помилкою, якщо простір імен не може звільнити достатньо рядків.

    <Warning>
    У цьому випуску лише вбудовані plugins.
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
    Допоміжні засоби середовища виконання для каналів (доступні, коли завантажено Plugin каналу).

    `api.runtime.channel.media` — рекомендована поверхня для завантаження та зберігання медіа каналу:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Використовуйте `saveRemoteMedia(...)`, коли віддалена URL-адреса має стати медіа OpenClaw. Використовуйте `saveResponseMedia(...)`, коли Plugin уже отримав `Response` із власною для Plugin обробкою автентифікації, переспрямування або списку дозволених адрес. Використовуйте `readRemoteMediaBuffer(...)` лише тоді, коли Plugin потрібні необроблені байти для інспекції, перетворень, розшифрування або повторного завантаження. `fetchRemoteMedia(...)` залишається застарілим сумісним псевдонімом для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — спільна поверхня політики вхідних згадок для вбудованих plugins каналів, які використовують ін’єкцію середовища виконання:

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

    `api.runtime.channel.mentions` навмисно не відкриває старіші сумісні допоміжні засоби `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань на середовище виконання

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на середовище виконання для використання поза callback `register`:

<Steps>
  <Step title="Створіть сховище">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Під’єднайте до точки входу">
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
  <Step title="Доступ з інших файлів">
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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key` призначена для нечастих випадків, коли одному Plugin навмисно потрібно більше ніж один слот середовища виконання.
</Note>

## Інші поля `api` верхнього рівня

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Id Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфігурація, специфічна для Plugin, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Обмежений за областю логер (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — легковагове вікно запуску/налаштування перед повноцінною точкою входу.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Визначити шлях відносно кореня Plugin.
</ParamField>

## Пов’язане

- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
