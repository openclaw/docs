---
read_when:
    - Вам потрібно викликати основні допоміжні засоби з плагіна (TTS, STT, генерація зображень, вебпошук, підлеглий агент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до допоміжних засобів конфігурації, агента або медіа з коду плагіна
sidebarTitle: Runtime helpers
summary: api.runtime — інжектовані допоміжні засоби середовища виконання, доступні плагінам
title: Допоміжні засоби середовища виконання плагінів
x-i18n:
    generated_at: "2026-04-27T12:53:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: bce429c28ce1cd5e888c757af314bc83e0236d4cf4ddf844948eea22d0ad0259
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідник для об’єкта `api.runtime`, який інжектується в кожен плагін під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх компонентів хоста.

<CardGroup cols={2}>
  <Card title="Плагіни каналів" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який використовує ці допоміжні засоби в контексті плагінів каналів.
  </Card>
  <Card title="Плагіни провайдерів" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який використовує ці допоміжні засоби в контексті плагінів провайдерів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження та запис конфігурації

Віддавайте перевагу конфігурації, яка вже була передана в активний шлях виклику, наприклад `api.config` під час реєстрації або аргументу `cfg` у callback-ах каналу/провайдера. Це дає змогу передавати один знімок процесу через усю роботу замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довгоживучому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано в цю функцію. Повернене значення доступне лише для читання; перед редагуванням створіть копію або використайте допоміжний засіб для мутацій.

Фабрики інструментів отримують `ctx.runtimeConfig` плюс `ctx.getRuntimeConfig()`. Використовуйте getter усередині callback `execute` довгоживучого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Для кожного запису потрібно вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дає змогу планувальнику перезавантаження gateway вирішити самостійно.
- `afterWrite: { mode: "restart", reason: "..." }` примусово запускає чистий перезапуск, коли записувач знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження/перезапуск лише тоді, коли викликач сам володіє подальшими діями.

Допоміжні засоби мутацій повертають `afterWrite` плюс типізоване зведення `followUp`, щоб викликачі могли журналювати або тестувати, чи запитували вони перезапуск. Gateway усе одно сам вирішує, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` — це застарілі допоміжні засоби сумісності. Вони один раз показують попередження під час виконання, і комплектні плагіни не повинні їх використовувати; архітектурний захист завершується помилкою, якщо production-код плагіна викликає їх або імпортує ці допоміжні засоби з підшляхів SDK плагінів.

Внутрішній код середовища виконання OpenClaw має той самий напрямок: завантажити конфігурацію один раз на межі CLI, gateway або процесу, а потім передавати це значення далі. Успішні записи мутацій оновлюють знімок середовища виконання процесу й просувають його внутрішню ревізію; довгоживучі кеші мають орієнтуватися на ключ кешу, що належить runtime, замість локальної серіалізації конфігурації. У довгоживучих модулях runtime є сканер із нульовою толерантністю до неявних викликів `loadConfig()`; використовуйте переданий `cfg`, `context.getRuntimeConfig()` у межах запиту або `getRuntimeConfig()` на явній межі процесу.

## Простори імен runtime

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
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

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

    `runEmbeddedAgent(...)` — це нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw з коду плагіна. Він використовує ті самі розв’язання провайдера/моделі та вибір harness агента, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

    **Допоміжні засоби сховища сесій** розміщені в `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи типової моделі та провайдера:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запуск і керування фоновими запусками підлеглого агента.

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
    Перевизначення моделі (`provider`/`model`) вимагають явного дозволу оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені плагіни все ще можуть запускати підлеглих агентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим плагіном через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або операторських сесій, як і раніше, вимагає запиту Gateway з областю admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Показувати список підключених вузлів і викликати команду вузла-хоста з коду плагіна, завантаженого в Gateway, або з CLI-команд плагіна. Використовуйте це, коли плагін володіє локальною роботою на спареному пристрої, наприклад мостом браузера або аудіо на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в тому самому процесі. У CLI-командах плагіна він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди вузлів, як і раніше, проходять через звичайне pairing вузлів Gateway, списки дозволу команд і локальну обробку команд вузла.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Прив’язати runtime TaskFlow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створювати TaskFlow і керувати ними без передавання owner у кожному виклику.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із вашого власного шару прив’язки. Не виконуйте прив’язку на основі сирого користувацького вводу.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез мовлення.

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

    Використовує основну конфігурацію `messages.tts` і вибір провайдера. Повертає PCM-буфер аудіо + частоту дискретизації.

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
    ```

    Повертає `{ text: undefined }`, коли результат не створено (наприклад, вхід пропущено).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    Поточний знімок конфігурації runtime і транзакційні записи конфігурації. Віддавайте
    перевагу конфігурації, яка вже була передана в активний шлях виклику; використовуйте
    `current()` лише тоді, коли обробнику безпосередньо потрібен знімок процесу.

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
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Утиліти системного рівня.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

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
    Розв’язання auth моделі та провайдера.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Розв’язання каталогу стану.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

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
    Допоміжні засоби runtime, специфічні для каналів (доступні, коли завантажено плагін каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для комплектних плагінів каналів, які використовують ін’єкцію runtime:

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

    `api.runtime.channel.mentions` навмисно не надає старі допоміжні засоби сумісності `resolveMentionGating*`. Віддавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань runtime

Використовуйте `createPluginRuntimeStore`, щоб зберігати посилання runtime для використання поза callback `register`:

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
  <Step title="Підключіть до точки входу">
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
  <Step title="Отримуйте доступ з інших файлів">
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
Віддавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key` призначена для рідкісних випадків, коли одному плагіну навмисно потрібно більше ніж один слот runtime.
</Note>

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Ідентифікатор плагіна.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва плагіна.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфігурація плагіна з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger з областю видимості (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування перед повним входом.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Розв’язати шлях відносно кореня плагіна.
</ParamField>

## Пов’язане

- [Внутрішня будова плагінів](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
