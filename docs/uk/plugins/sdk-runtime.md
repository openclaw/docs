---
read_when:
    - Потрібно викликати допоміжні функції ядра з Plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до допоміжних засобів конфігурації, агента або медіа з коду Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- впроваджені допоміжні засоби середовища виконання, доступні для плагінів
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-28T11:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d332e9ab4a163a55b7edaefc420d845cfda8486646e13a758ec3133097c17be1
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідник для об’єкта `api.runtime`, який вводиться в кожен плагін під час реєстрації. Використовуйте ці допоміжні функції замість прямого імпорту внутрішніх модулів хоста.

<CardGroup cols={2}>
  <Card title="Плагіни каналів" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який використовує ці допоміжні функції в контексті плагінів каналів.
  </Card>
  <Card title="Плагіни провайдерів" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який використовує ці допоміжні функції в контексті плагінів провайдерів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження й запис конфігурації

Надавайте перевагу конфігурації, яку вже передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у callback-ах каналу чи провайдера. Це дає змогу проводити один знімок процесу крізь роботу замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довгоживучому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано цій функції. Повернене значення доступне лише для читання; перед редагуванням клонуйте його або використайте допоміжну функцію мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` плюс `ctx.getRuntimeConfig()`. Використовуйте getter у callback-у `execute` довгоживучого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дає планувальнику перезавантаження Gateway змогу вирішити.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли автор запису знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження або перезапуск лише тоді, коли викликач сам відповідає за подальшу дію.

Допоміжні функції мутації повертають `afterWrite` плюс типізований підсумок `followUp`, щоб викликачі могли логувати або тестувати, чи вони запросили перезапуск. Gateway усе ще відповідає за те, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` є застарілими допоміжними функціями сумісності під `runtime-config-load-write`. Вони попереджають один раз під час виконання й залишаються доступними для старих зовнішніх плагінів протягом міграційного вікна. Вбудовані плагіни не повинні їх використовувати; охоронні перевірки межі конфігурації падають, якщо код плагіна викликає їх або імпортує ці допоміжні функції з підшляхів SDK плагінів.

Для прямих імпортів SDK використовуйте спеціалізовані підшляхи конфігурації замість широкого агрегувального модуля сумісності
`openclaw/plugin-sdk/config-runtime`: `config-types` для
типів, `plugin-config-runtime` для перевірок уже завантаженої конфігурації та пошуку
запису плагіна, `runtime-config-snapshot` для поточних знімків процесу та
`config-mutation` для записів. Тести вбудованих плагінів мають напряму мокати ці спеціалізовані
підшляхи замість мокання широкого агрегувального модуля сумісності.

Внутрішній код середовища виконання OpenClaw має той самий напрям: завантажити конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавати це значення далі. Успішні записи мутацій оновлюють знімок середовища виконання процесу й просувають його внутрішню ревізію; довгоживучі кеші мають прив’язуватися до ключа кешу, яким володіє середовище виконання, замість локальної серіалізації конфігурації. Довгоживучі модулі середовища виконання мають сканер із нульовою терпимістю до неявних викликів `loadConfig()`; використовуйте переданий `cfg`, запит `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання провайдерів і каналів мають використовувати активний знімок конфігурації середовища виконання, а не файловий знімок, повернений для читання чи редагування конфігурації. Файлові знімки зберігають вихідні значення, як-от маркери SecretRef, для UI та записів; callback-и провайдерів потребують вирішеного runtime-представлення. Коли допоміжну функцію можна викликати або з активним вихідним знімком, або з активним runtime-знімком, перед читанням облікових даних пропустіть його через `selectApplicableRuntimeConfig()`.

## Простори імен середовища виконання

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

    `runEmbeddedAgent(...)` є нейтральною допоміжною функцією для запуску звичайного ходу агента OpenClaw з коду плагіна. Вона використовує те саме вирішення провайдера/моделі та вибір agent-harness, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

    `resolveThinkingPolicy(...)` повертає підтримувані провайдером/моделлю рівні мислення й необов’язкове значення за замовчуванням. Плагіни провайдерів володіють профілем, специфічним для моделі, через свої thinking-хуки, тому плагіни інструментів мають викликати цю допоміжну функцію середовища виконання замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює текст користувача, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою його проти вирішеної політики.

    **Допоміжні функції сховища сесій** містяться в `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи моделі та провайдера за замовчуванням:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте та керуйте фоновими запусками субагентів.

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
    Перевизначення моделі (`provider`/`model`) потребують явного дозволу оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені плагіни все одно можуть запускати субагентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим плагіном через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або операторських сесій усе ще потребує запиту Gateway з адміністративною областю дії.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Виводьте список підключених вузлів і викликайте команду вузла-хоста з коду плагіна, завантаженого Gateway, або з CLI-команд плагіна. Використовуйте це, коли плагін володіє локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway це середовище виконання працює в процесі. У CLI-командах плагіна воно викликає налаштований Gateway через RPC, тому команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди Node й далі проходять через звичайне спарювання вузлів Gateway, списки дозволених команд і локальну обробку команд на вузлі.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’яжіть середовище виконання TaskFlow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створюйте й керуйте TaskFlow без передавання власника в кожному виклику.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw з вашого власного шару прив’язки. Не прив’язуйте з необробленого користувацького введення.

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
    Аналіз зображень, аудіо й відео.

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

    Повертає `{ text: undefined }`, коли вивід не створено (наприклад, пропущені вхідні дані).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` залишається сумісним псевдонімом для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Генерування зображень.

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
    Поточний знімок конфігурації середовища виконання та транзакційні записи конфігурації. Надавайте перевагу
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
    яке фіксує намір автора запису, не забираючи керування перезапуском у
    Gateway.

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
    Розв’язання автентифікації моделей і провайдерів.

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
    Допоміжні засоби середовища виконання, специфічні для каналу (доступні, коли завантажено plugin каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих plugin каналів, які використовують ін’єкцію середовища виконання:

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

    Доступні допоміжні засоби згадок:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` навмисно не надає старіші сумісні допоміжні засоби `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань на середовище виконання

Використовуйте `createPluginRuntimeStore`, щоб зберігати посилання на середовище виконання для використання поза зворотним викликом `register`:

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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Нижчорівнева форма `key` призначена для рідкісних випадків, коли одному plugin навмисно потрібно більше ніж один слот середовища виконання.
</Note>

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Ідентифікатор plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Конфігурація, специфічна для plugin, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Журналювальник з областю видимості (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування перед повним входом.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Розв’язати шлях відносно кореня plugin.
</ParamField>

## Пов’язане

- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
