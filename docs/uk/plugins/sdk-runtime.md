---
read_when:
    - Вам потрібно викликати допоміжні функції ядра з Plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до допоміжних функцій конфігурації, агента або медіа з коду Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- інʼєктовані допоміжні засоби runtime, доступні для Plugin
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-29T13:06:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 399e2433e272fe30e7451690a64826df8e30a064269b8d9a7aa2dd2b0c5688b8
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідник для об’єкта `api.runtime`, який впроваджується в кожен Plugin під час реєстрації. Використовуйте ці допоміжні функції замість прямого імпорту внутрішніх компонентів хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, що показує використання цих допоміжних функцій у контексті Plugin для каналів.
  </Card>
  <Card title="Provider plugins" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, що показує використання цих допоміжних функцій у контексті Plugin для провайдерів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження й запис конфігурації

Надавайте перевагу конфігурації, яку вже передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у callback-функціях каналу/провайдера. Це забезпечує передавання одного знімка процесу через виконання роботи замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довготривалому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано в цю функцію. Повернене значення доступне лише для читання; перед редагуванням створіть копію або використайте допоміжну функцію мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` разом із `ctx.getRuntimeConfig()`. Використовуйте getter у callback-функції `execute` довготривалого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибирати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє планувальнику перезавантаження Gateway ухвалити рішення.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли автор запису знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження/перезапуск лише тоді, коли викликач відповідає за подальші дії.

Допоміжні функції мутації повертають `afterWrite` разом із типізованим підсумком `followUp`, щоб викликачі могли логувати або тестувати, чи запитали вони перезапуск. Gateway і далі відповідає за те, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` — застарілі допоміжні функції сумісності під `runtime-config-load-write`. Вони один раз попереджають під час виконання й залишаються доступними для старих зовнішніх Plugin протягом міграційного вікна. Вбудовані Plugin не повинні їх використовувати; захисні перевірки межі конфігурації завершаться помилкою, якщо код Plugin викликає їх або імпортує ці допоміжні функції з підшляхів Plugin SDK.

Для прямих імпортів SDK використовуйте сфокусовані підшляхи конфігурації замість широкого сумісного barrel
`openclaw/plugin-sdk/config-runtime`: `config-types` для
типів, `plugin-config-runtime` для перевірок уже завантаженої конфігурації та пошуку
точки входу Plugin, `runtime-config-snapshot` для поточних знімків процесу, а
`config-mutation` для записів. Тести вбудованих Plugin мають напряму mock-ати ці сфокусовані
підшляхи замість mock широкого сумісного barrel.

Внутрішній runtime-код OpenClaw дотримується того самого напряму: завантажити конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавати це значення далі. Успішні мутаційні записи оновлюють runtime-знімок процесу й збільшують його внутрішню ревізію; довготривалі кеші мають прив’язуватися до ключа кешу, яким володіє runtime, замість локальної серіалізації конфігурації. Довготривалі runtime-модулі мають сканер із нульовою терпимістю до неявних викликів `loadConfig()`; використовуйте переданий `cfg`, запитовий `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання провайдерів і каналів мають використовувати активний знімок runtime-конфігурації, а не файловий знімок, повернений для читання або редагування конфігурації. Файлові знімки зберігають початкові значення, як-от маркери SecretRef, для UI та записів; callback-функціям провайдерів потрібне вирішене runtime-представлення. Коли допоміжну функцію можна викликати або з активним початковим знімком, або з активним runtime-знімком, перед читанням облікових даних пропускайте його через `selectApplicableRuntimeConfig()`.

## Простори імен runtime

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

    `runEmbeddedAgent(...)` — нейтральна допоміжна функція для запуску звичайного ходу агента OpenClaw з коду Plugin. Вона використовує те саме вирішення провайдера/моделі та вибір agent-harness, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається сумісним псевдонімом.

    `resolveThinkingPolicy(...)` повертає підтримувані провайдером/моделлю рівні thinking і необов’язкове значення за замовчуванням. Plugin провайдерів володіють профілем для конкретної моделі через свої thinking hooks, тому Plugin інструментів мають викликати цю runtime-допоміжну функцію замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює користувацький текст, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою щодо вирішеної політики.

    **Допоміжні функції сховища сеансів** розташовані в `api.runtime.agent.session`:

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
    Запуск і керування фоновими виконаннями subagent.

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
    Перевизначення моделі (`provider`/`model`) потребують явної згоди оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Недовірені Plugin усе ще можуть запускати subagent, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сеанси, створені тим самим Plugin через `api.runtime.subagent.run(...)`. Видалення довільних сеансів користувача або оператора все ще потребує Gateway-запиту з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Перелічує підключені вузли та викликає команду, розміщену на вузлі, з коду Plugin, завантаженого Gateway, або з CLI-команд Plugin. Використовуйте це, коли Plugin володіє локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в межах процесу. У CLI-командах Plugin він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди вузлів усе ще проходять звичайне спарювання вузлів Gateway, allowlist команд і локальну обробку команд на вузлі.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’язує runtime TaskFlow до наявного ключа сеансу OpenClaw або довіреного контексту інструмента, а потім створює TaskFlow і керує ними без передавання власника під час кожного виклику.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли вже маєте довірений ключ сеансу OpenClaw із власного шару прив’язки. Не виконуйте прив’язку з необроблених користувацьких даних.

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
    ```

    Повертає `{ text: undefined }`, коли вихідні дані не створено (наприклад, вхід пропущено).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` лишається сумісним псевдонімом для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    яке фіксує намір записувача, не забираючи контроль перезапуску в
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
    Розв’язання каталогу стану та сховище ключів на базі SQLite.

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

    Сховища ключів переживають перезапуски та ізольовані ідентифікатором Plugin, прив’язаним до середовища виконання. Обмеження: `maxEntries` на простір імен, 1 000 активних рядків на Plugin, JSON-значення до 64 КБ і необов’язкове завершення строку дії TTL.

    <Warning>
    Лише вбудовані plugins у цьому випуску.
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
    Допоміжні засоби середовища виконання, специфічні для каналу (доступні, коли завантажено Plugin каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих plugins каналів, які використовують ін’єкцію середовища виконання:

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

    `api.runtime.channel.mentions` навмисно не відкриває старі допоміжні засоби сумісності `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань на середовище виконання

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на середовище виконання для використання поза зворотним викликом `register`:

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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Нижчорівнева форма `key` призначена для рідкісних випадків, коли одному Plugin навмисно потрібно більше ніж один слот середовища виконання.
</Note>

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Ідентифікатор Plugin.
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
  Обмежений за областю logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування перед повним entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Розв’язати шлях відносно кореня Plugin.
</ParamField>

## Пов’язане

- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — модель можливостей і registry
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник subpath
