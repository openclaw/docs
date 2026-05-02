---
read_when:
    - Потрібно викликати допоміжні функції ядра з Plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви отримуєте доступ до допоміжних функцій конфігурації, агента або медіа з коду Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- інжектовані допоміжні засоби часу виконання, доступні плагінам
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-05-02T13:56:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26df37a2ad0dcd29648e382eb579b6892068af4dea1c47460cfd379458a8081c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідник для об’єкта `api.runtime`, що впроваджується в кожен plugin під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх модулів хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті для channel plugins.
  </Card>
  <Card title="Provider plugins" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який показує використання цих допоміжних засобів у контексті для provider plugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження й запис конфігурації

Надавайте перевагу конфігурації, яку вже передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у callback-функціях каналу/провайдера. Це забезпечує проходження одного знімка процесу через роботу замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довгоживучому обробнику потрібен поточний знімок процесу й жодну конфігурацію не було передано в цю функцію. Повернене значення доступне лише для читання; перед редагуванням клонуйте його або використайте допоміжний засіб мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` плюс `ctx.getRuntimeConfig()`. Використовуйте getter усередині callback-функції `execute` довгоживучого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє Gateway reload planner ухвалити рішення.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли writer знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження/перезапуск лише тоді, коли викликач сам відповідає за подальші дії.

Допоміжні засоби мутації повертають `afterWrite` плюс типізований підсумок `followUp`, щоб викликачі могли журналювати або тестувати, чи запитали вони перезапуск. Gateway все ще відповідає за те, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` є застарілими допоміжними засобами сумісності в межах `runtime-config-load-write`. Вони один раз попереджають під час виконання й залишаються доступними для старих зовнішніх plugins протягом міграційного вікна. Вбудовані plugins не повинні їх використовувати; guards межі конфігурації завершаться помилкою, якщо код plugin викликає їх або імпортує ці допоміжні засоби з підшляхів plugin SDK.

Для прямих імпортів SDK використовуйте сфокусовані підшляхи конфігурації замість широкого compatibility barrel `openclaw/plugin-sdk/config-runtime`: `config-types` для типів, `plugin-config-runtime` для тверджень щодо вже завантаженої конфігурації та пошуку запису plugin, `runtime-config-snapshot` для поточних знімків процесу і `config-mutation` для записів. Тести вбудованих plugins мають mock-ати ці сфокусовані підшляхи напряму, а не широкий compatibility barrel.

Внутрішній runtime-код OpenClaw має той самий напрям: завантажити конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавати це значення далі. Успішні записи мутацій оновлюють runtime-знімок процесу й просувають його внутрішню ревізію; довгоживучі кеші мають спиратися на runtime-owned ключ кешу, а не серіалізувати конфігурацію локально. Для довгоживучих runtime-модулів діє сканер нульової терпимості до ambient-викликів `loadConfig()`; використовуйте переданий `cfg`, request `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання провайдерів і каналів мають використовувати активний runtime-знімок конфігурації, а не файловий знімок, повернений для читання або редагування конфігурації. Файлові знімки зберігають початкові значення, як-от маркери SecretRef, для UI та записів; callback-функціям провайдера потрібне resolved runtime-представлення. Коли допоміжний засіб може бути викликаний або з активним source-знімком, або з активним runtime-знімком, перед читанням облікових даних маршрутизуйте через `selectApplicableRuntimeConfig()`.

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

    `runEmbeddedAgent(...)` — нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw з коду plugin. Він використовує ту саму розв’язку провайдера/моделі й вибір agent-harness, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається alias сумісності.

    `resolveThinkingPolicy(...)` повертає підтримувані рівні thinking для провайдера/моделі та необов’язкове значення за замовчуванням. Provider plugins володіють model-specific профілем через свої thinking hooks, тому tool plugins мають викликати цей runtime helper замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює користувацький текст, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою щодо resolved policy.

    **Допоміжні засоби сховища сесій** розміщені в `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Надавайте перевагу `updateSessionStore(...)` або `updateSessionStoreEntry(...)` для runtime-записів. Вони проходять через Gateway-owned writer сховища сесій, зберігають паралельні оновлення та повторно використовують гарячий кеш. `saveSessionStore(...)` залишається доступним для сумісності та offline maintenance-style перезаписів.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи моделі та провайдера за замовчуванням:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте й керуйте фоновими запусками subagent.

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
    Перевизначення моделі (`provider`/`model`) потребують opt-in оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені plugins усе ще можуть запускати subagents, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим plugin через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або operator sessions усе ще потребує admin-scoped запиту Gateway.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Перелічуйте підключені nodes і викликайте node-host command з Gateway-loaded коду plugin або з CLI-команд plugin. Використовуйте це, коли plugin володіє локальною роботою на спареному пристрої, наприклад браузером або audio bridge на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime є in-process. У CLI-командах plugin він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти paired nodes з термінала. Node-команди все ще проходять через звичайне Gateway node pairing, allowlists команд, політики plugin node-invoke та node-local command handling.

    Plugins, що відкривають небезпечні node-host commands, мають реєструвати node-invoke policy за допомогою `api.registerNodeInvokePolicy(...)`. Policy виконується в Gateway після перевірок allowlist команд і перед пересиланням команди до node, тож прямі виклики `node.invoke` і higher-level plugin tools мають той самий шлях enforcement.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’яжіть runtime Task Flow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створюйте й керуйте Task Flows без передавання owner у кожному виклику.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw з вашого власного binding layer. Не прив’язуйте з необробленого введення користувача.

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

    Використовує core-конфігурацію `messages.tts` і вибір провайдера. Повертає PCM-аудіобуфер + частоту дискретизації.

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

    Повертає `{ text: undefined }`, коли не створено жодного виводу (наприклад, вхідні дані пропущено).

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
    Поточний знімок конфігурації runtime і транзакційні записи конфігурації. Надавайте перевагу
    конфігурації, яку вже передано в активний шлях виклику; використовуйте
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
    яке записує намір записувача, не забираючи керування перезапуском у
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
    Визначення каталогу стану та сховище ключів на базі SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Сховища ключів переживають перезапуски та ізольовані ідентифікатором plugin, прив’язаним до runtime. Обмеження: `maxEntries` на простір імен, 1 000 активних рядків на plugin, JSON-значення до 64 КБ і необов’язкове завершення строку дії TTL.

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
    Допоміжні засоби runtime, специфічні для каналу (доступні, коли завантажено plugin каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих plugins каналів, які використовують ін’єкцію runtime:

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

    `api.runtime.channel.mentions` навмисно не надає старі сумісні допоміжні засоби `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань runtime

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання runtime для використання поза callback `register`:

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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key` призначена для рідкісних випадків, коли одному plugin навмисно потрібно більше ніж один слот runtime.
</Note>

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Ідентифікатор plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Відображуване ім’я plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфігурація, специфічна для plugin, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Логер із заданою областю (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування перед повним entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Визначити шлях відносно кореня plugin.
</ParamField>

## Пов’язане

- [Внутрішня архітектура plugin](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
