---
read_when:
    - Вам потрібно викликати допоміжні засоби core з plugin (TTS, STT, генерація зображень, вебпошук, субагент, nodes)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви отримуєте доступ до допоміжних засобів config, агента або медіа з коду plugin
sidebarTitle: Runtime helpers
summary: api.runtime — інжектовані допоміжні засоби середовища виконання, доступні для plugins
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-27T14:19:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc6e1fd539ce9e9719af74ea4bb59d29106b9cbb8bb1bf778d9b2d212fa5623d
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідник для об’єкта `api.runtime`, який інжектується в кожен plugin під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх компонентів хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який використовує ці допоміжні засоби в контексті для channel plugins.
  </Card>
  <Card title="Provider plugins" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який використовує ці допоміжні засоби в контексті для provider plugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження та запис config

Надавайте перевагу config, який уже було передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у callback channel/provider. Це дає змогу використовувати один знімок процесу в усьому робочому потоці замість повторного парсингу config на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довгоживучому обробнику потрібен поточний знімок процесу, а в цю функцію не було передано config. Повернене значення доступне лише для читання; перед редагуванням створіть копію або використайте допоміжний засіб для мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` разом із `ctx.getRuntimeConfig()`. Використовуйте getter всередині callback `execute` довгоживучого інструмента, коли config може змінитися після створення визначення інструмента.

Зберігайте зміни через `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Для кожного запису потрібно явно вибрати політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дає планувальнику перезавантаження Gateway вирішити, що робити.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли записувач знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` вимикає автоматичне перезавантаження/перезапуск лише тоді, коли подальші дії контролює сам викликаючий код.

Допоміжні засоби мутації повертають `afterWrite` разом із типізованим підсумком `followUp`, щоб викликаючий код міг логувати або тестувати, чи було запитано перезапуск. Gateway як і раніше сам визначає, коли саме цей перезапуск відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` — це застарілі допоміжні засоби сумісності в межах `runtime-config-load-write`. Вони один раз показують попередження під час виконання й залишаються доступними для старих зовнішніх plugins протягом вікна міграції. Вбудовані plugins не повинні їх використовувати; захист меж config завершується помилкою, якщо код plugin викликає їх або імпортує ці допоміжні засоби з підшляхів SDK plugin.

Для прямих імпортів SDK використовуйте цільові підшляхи config замість широкого
barrel сумісності `openclaw/plugin-sdk/config-runtime`: `config-types` для
типів, `plugin-config-runtime` для перевірок уже завантаженого config і пошуку
записів plugin, `runtime-config-snapshot` для поточних знімків процесу та
`config-mutation` для запису. Тести вбудованих plugins мають мокати ці цільові
підшляхи напряму, а не широкий barrel сумісності.

Внутрішній код середовища виконання OpenClaw дотримується того самого напряму: завантажуйте config один раз на межі CLI, Gateway або процесу, а потім передавайте це значення далі. Успішні записи мутацій оновлюють знімок runtime процесу й збільшують його внутрішню ревізію; довгоживучі кеші мають використовувати ключ кешу, яким володіє runtime, замість локальної серіалізації config. Для довгоживучих модулів runtime діє сканер із нульовою толерантністю до фонових викликів `loadConfig()`; використовуйте переданий `cfg`, `context.getRuntimeConfig()` запиту або `getRuntimeConfig()` на явній межі процесу.

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

    `runEmbeddedAgent(...)` — це нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw із коду plugin. Він використовує той самий механізм визначення provider/model і вибору harness агента, що й відповіді, ініційовані channel.

    `runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

    `resolveThinkingPolicy(...)` повертає підтримувані provider/model рівні thinking і необов’язкове значення за замовчуванням. Provider plugins володіють профілем, специфічним для моделі, через свої hooks thinking, тому plugins інструментів мають викликати цей допоміжний засіб runtime замість імпорту або дублювання списків provider.

    `normalizeThinkingLevel(...)` перетворює текст користувача, наприклад `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою його щодо визначеної policy.

    **Допоміжні засоби сховища сесій** знаходяться в `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи моделі та provider за замовчуванням:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запуск і керування фоновими запусками субагента.

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
    Перевизначення моделі (`provider`/`model`) потребують явного дозволу оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у config. Ненадійні plugins усе ще можуть запускати субагентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим plugin через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або операторських сесій, як і раніше, потребує запиту Gateway з областю admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Показує список підключених Node і викликає команду, розміщену на Node, з коду plugin, завантаженого в Gateway, або з CLI-команд plugin. Використовуйте це, коли plugin володіє локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в межах процесу. У CLI-командах plugin він викликає налаштований Gateway через RPC, тож такі команди, як `openclaw googlemeet recover-tab`, можуть перевіряти спарені Node із термінала. Команди Node все одно проходять через звичайне спарювання Node у Gateway, allowlist команд і локальну обробку команд на Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Прив’язує runtime TaskFlow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім дає змогу створювати TaskFlow і керувати ними без передавання owner у кожному виклику.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із вашого власного шару прив’язки. Не виконуйте прив’язку на основі сирого вводу користувача.

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

    Використовує core-конфігурацію `messages.tts` і вибір provider. Повертає PCM-аудіобуфер + частоту дискретизації.

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

    Повертає `{ text: undefined }`, якщо вихідні дані не були створені (наприклад, коли вхід було пропущено).

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
    Низькорівневі утиліти для медіа.

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
    Поточний знімок config runtime і транзакційні записи config. Надавайте
    перевагу config, який уже було передано в активний шлях виклику; використовуйте
    `current()` лише тоді, коли обробнику потрібен знімок процесу безпосередньо.

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
    яке фіксує намір записувача, не забираючи в
    Gateway контроль над перезапуском.

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
    Логування.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Визначення автентифікації model і provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Визначення каталогу стану.

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
    Допоміжні засоби runtime, специфічні для channel (доступні, коли завантажено channel plugin).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих channel plugins, які використовують інжекцію runtime:

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

    `api.runtime.channel.mentions` навмисно не надає старіші допоміжні засоби сумісності `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань на runtime

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на runtime для використання поза callback `register`:

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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key` призначена для нечастих випадків, коли одному plugin навмисно потрібен більше ніж один слот runtime.
</Note>

## Інші поля `api` верхнього рівня

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Ідентифікатор plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок config (активний знімок runtime у пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Специфічний для plugin config з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Логер з областю видимості (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного старту точки входу.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Визначає шлях відносно кореня plugin.
</ParamField>

## Пов’язані матеріали

- [Plugin internals](/uk/plugins/architecture) — модель можливостей і реєстр
- [SDK entry points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [SDK overview](/uk/plugins/sdk-overview) — довідник підшляхів
