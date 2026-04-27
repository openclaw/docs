---
read_when:
    - Вам потрібно викликати helper-и ядра з плагіна (TTS, STT, генерація зображень, вебпошук, субагент, Nodes)
    - Ви хочете зрозуміти, що відкриває `api.runtime`
    - Ви звертаєтеся до helper-ів конфігурації, агента або медіа з коду плагіна
sidebarTitle: Runtime helpers
summary: api.runtime — інжектовані runtime helper-и, доступні плагінам
title: Runtime helper-и плагіна
x-i18n:
    generated_at: "2026-04-27T11:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47961951e096a0bef17792392b699454a72f1fc0628bcb7259f2f2730467c980
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідка для об’єкта `api.runtime`, який інжектується в кожен Plugin під час реєстрації. Використовуйте ці helper-и замість прямого імпорту внутрішніх механізмів хоста.

<CardGroup cols={2}>
  <Card title="Плагіни каналів" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який використовує ці helper-и в контексті для плагінів каналів.
  </Card>
  <Card title="Плагіни provider-ів" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який використовує ці helper-и в контексті для плагінів provider-ів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Простори імен runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Ідентичність агента, каталоги та керування сесіями.

    ```typescript
    // Визначити робочий каталог агента
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Визначити робочий простір агента
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Отримати ідентичність агента
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Отримати типовий рівень thinking
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // Отримати тайм-аут агента
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Переконатися, що робочий простір існує
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Запустити хід вбудованого агента
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

    `runEmbeddedAgent(...)` — це нейтральний helper для запуску звичайного ходу агента OpenClaw з коду Plugin. Він використовує той самий механізм визначення provider-а/моделі та вибору harness агента, що й відповіді, ініційовані каналом.

    `runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

    **Helper-и сховища сесій** розміщені в `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Константи типової моделі й provider-а:

    ```typescript
    const model = api.runtime.agent.defaults.model; // наприклад, "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // наприклад, "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте й керуйте фоновими запусками субагентів.

    ```typescript
    // Запустити субагента
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // необов’язкове перевизначення
      model: "gpt-4.1-mini", // необов’язкове перевизначення
      deliver: false,
    });

    // Дочекатися завершення
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Прочитати повідомлення сесії
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Видалити сесію
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Перевизначення моделі (`provider`/`model`) потребують явної згоди оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Ненадійні плагіни все ще можуть запускати субагентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим Plugin через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або операторських сесій, як і раніше, потребує запиту Gateway з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Показує список підключених Nodes і викликає команду хоста Node з коду Plugin, завантаженого через Gateway, або з CLI-команд Plugin. Використовуйте це, коли Plugin володіє локальною роботою на спареному пристрої, наприклад браузером чи аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в процесі. У CLI-командах Plugin він викликає налаштований Gateway через RPC, тож такі команди, як `openclaw googlemeet recover-tab`, можуть перевіряти спарені Nodes з термінала. Команди Node все одно проходять через звичайне сполучення Gateway з Node, allowlist-и команд і локальну обробку команд на Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Прив’язує runtime TaskFlow до наявного ключа сесії OpenClaw або довіреного контексту tool, а потім створює й керує TaskFlow без передавання власника в кожному виклику.

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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із власного шару прив’язки. Не прив’язуйте з сирого користувацького вводу.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез мовлення з тексту.

    ```typescript
    // Стандартний TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // TTS, оптимізований для телефонії
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Показати список доступних голосів
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Використовує конфігурацію ядра `messages.tts` і вибір provider-а. Повертає буфер аудіо PCM + частоту дискретизації.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Аналіз зображень, аудіо та відео.

    ```typescript
    // Описати зображення
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Транскрибувати аудіо
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // необов’язково, коли MIME не можна визначити
    });

    // Описати відео
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Загальний аналіз файла
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Повертає `{ text: undefined }`, коли жодного виводу не створено (наприклад, вхідні дані пропущено).

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
    Завантаження та запис конфігурації.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Системні утиліти.

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
    Визначення автентифікації моделі та provider-а.

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
    Фабрики tools пам’яті та CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper-и runtime, специфічні для каналу (доступні, коли завантажено Plugin каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для вбудованих плагінів каналів, які використовують інжекцію runtime:

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

    Доступні helper-и згадок:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` навмисно не відкриває старіші helper-и сумісності `resolveMentionGating*`. Віддавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань runtime

Використовуйте `createPluginRuntimeStore`, щоб зберігати посилання на runtime для використання поза callback `register`:

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
      return store.getRuntime(); // викидає помилку, якщо не ініціалізовано
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // повертає null, якщо не ініціалізовано
    }
    ```

  </Step>
</Steps>

<Note>
Віддавайте перевагу `pluginId` для ідентичності runtime-store. Нижчорівнева форма `key` призначена для нечастих випадків, коли одному плагіну навмисно потрібно більше ніж один слот runtime.
</Note>

## Інші поля верхнього рівня `api`

Окрім `api.runtime`, об’єкт API також надає:

<ParamField path="api.id" type="string">
  Id плагіна.
</ParamField>
<ParamField path="api.name" type="string">
  Відображувана назва плагіна.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Поточний знімок конфігурації (активний runtime-знімок у пам’яті, якщо доступний).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Специфічна для плагіна конфігурація з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger з областю дії (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного входу.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Визначити шлях відносно кореня плагіна.
</ParamField>

## Пов’язане

- [Внутрішні механізми Plugin](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідка по підшляхах
