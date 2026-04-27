---
read_when:
    - Вам потрібно викликати основні допоміжні засоби з плагіна (`TTS`, `STT`, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви отримуєте доступ до допоміжних засобів конфігурації, агента або медіа з коду плагіна
sidebarTitle: Runtime helpers
summary: api.runtime — інʼєктовані допоміжні засоби середовища виконання, доступні для плагінів
title: Допоміжні засоби середовища виконання Plugin
x-i18n:
    generated_at: "2026-04-27T13:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dfd306203375c1a11e67f7e0e28b3cd7f15924457fa80d801cf99ae6dc8c26fa
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Довідник для об’єкта `api.runtime`, який інʼєктується в кожен плагін під час реєстрації. Використовуйте ці допоміжні засоби замість прямого імпорту внутрішніх компонентів хоста.

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

## Завантаження й запис конфігурації

Надавайте перевагу конфігурації, яку вже було передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у зворотних викликах каналу/провайдера. Це дає змогу використовувати один знімок процесу протягом усього виконання замість повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довготривалому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано в цю функцію. Повернуте значення доступне лише для читання; перед редагуванням створіть копію або використайте допоміжний засіб для мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` і `ctx.getRuntimeConfig()`. Використовуйте getter у зворотному виклику `execute` довготривалого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Для кожного запису потрібно вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє планувальнику перезавантаження gateway визначити подальшу дію.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли записувач знає, що гаряче перезавантаження є небезпечним.
- `afterWrite: { mode: "none", reason: "..." }` вимикає автоматичне перезавантаження/рестарт лише тоді, коли викликач сам відповідає за наступний крок.

Допоміжні засоби мутації повертають `afterWrite` разом із типізованим підсумком `followUp`, щоб викликачі могли логувати або тестувати, чи було запрошено перезапуск. Gateway усе одно сам визначає, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` — це застарілі допоміжні засоби сумісності. Вони один раз виводять попередження під час виконання, і bundled-плагіни не повинні їх використовувати; архітектурний захист завершується помилкою, якщо production-код плагіна викликає їх або імпортує ці допоміжні засоби з підшляхів SDK плагіна.

Внутрішній runtime-код OpenClaw дотримується того самого напряму: завантажуйте конфігурацію один раз на межі CLI, gateway або процесу, а потім передавайте це значення далі. Успішні записи мутацій оновлюють знімок runtime процесу й збільшують його внутрішню ревізію; довготривалі кеші мають спиратися на ключ кешу, яким керує runtime, замість локальної серіалізації конфігурації. Для довготривалих runtime-модулів діє сканер із нульовою толерантністю до ambient-викликів `loadConfig()`; використовуйте переданий `cfg`, `context.getRuntimeConfig()` запиту або `getRuntimeConfig()` на явній межі процесу.

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

    // Отримати рівень thinking за замовчуванням
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Перевірити наданий користувачем рівень thinking щодо активного профілю провайдера
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // передати level у вбудований запуск
    }

    // Отримати тайм-аут агента
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Переконатися, що робочий простір існує
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Запустити вбудований хід агента
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Підсумуй останні зміни",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` — це нейтральний допоміжний засіб для запуску звичайного ходу агента OpenClaw з коду плагіна. Він використовує той самий механізм визначення провайдера/моделі та вибору harness агента, що й відповіді, запущені каналом.

    `runEmbeddedPiAgent(...)` залишається псевдонімом сумісності.

    `resolveThinkingPolicy(...)` повертає підтримувані рівні thinking для провайдера/моделі та необов’язкове значення за замовчуванням. Плагіни провайдерів керують профілем, специфічним для моделі, через свої thinking-hooks, тому плагінам інструментів слід викликати цей runtime helper замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює текст користувача, такий як `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою щодо визначеної policy.

    **Допоміжні засоби сховища сесій** розміщено в `api.runtime.agent.session`:

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
    const model = api.runtime.agent.defaults.model; // наприклад, "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // наприклад, "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте фонові запуски субагентів і керуйте ними.

    ```typescript
    // Запустити виконання субагента
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Розгорни цей запит у сфокусовані додаткові пошуки.",
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
    Перевизначення моделі (`provider`/`model`) потребують явного дозволу оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Ненадійні плагіни все одно можуть запускати субагентів, але запити на перевизначення буде відхилено.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим плагіном через `api.runtime.subagent.run(...)`. Видалення довільних сесій користувача чи оператора, як і раніше, вимагає запиту до Gateway з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Перелічуйте підключені вузли та викликайте команду, розміщену на вузлі, з коду плагіна, завантаженого Gateway, або з CLI-команд плагіна. Використовуйте це, коли плагін керує локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в межах процесу. У CLI-командах плагіна він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди вузлів, як і раніше, проходять через звичайне спарювання вузлів Gateway, allowlist команд і обробку локальних команд вузла.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Прив’яжіть runtime TaskFlow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створюйте TaskFlow і керуйте ними без передавання власника в кожному виклику.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Перевірити нові pull request",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Перевірити PR #123",
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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із власного шару прив’язки. Не виконуйте прив’язку на основі сирого користувацького вводу.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Синтез мовлення з тексту.

    ```typescript
    // Стандартний TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Привіт від OpenClaw",
      cfg: api.config,
    });

    // TTS, оптимізований для телефонії
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Привіт від OpenClaw",
      cfg: api.config,
    });

    // Перелічити доступні голоси
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
      mime: "audio/ogg", // необов’язково, коли MIME неможливо визначити
    });

    // Описати відео
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Загальний аналіз файлу
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Повертає `{ text: undefined }`, коли вихідні дані не створюються (наприклад, якщо вхід пропущено).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` залишається псевдонімом сумісності для `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Генерація зображень.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Робот малює захід сонця",
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
    Поточний знімок конфігурації runtime і транзакційний запис конфігурації. Надавайте
    перевагу конфігурації, яку вже було передано в активний шлях виклику; використовуйте
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
    яке фіксує намір записувача, не забираючи в
    gateway контроль над перезапуском.

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
    Допоміжні засоби runtime, специфічні для каналу (доступні, коли завантажено плагін каналу).

    `api.runtime.channel.mentions` — це спільна поверхня політики вхідних згадок для bundled-плагінів каналів, які використовують інʼєкцію runtime:

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

    `api.runtime.channel.mentions` навмисно не надає старі допоміжні засоби сумісності `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань на runtime

Використовуйте `createPluginRuntimeStore`, щоб зберегти посилання на runtime для використання поза зворотним викликом `register`:

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
      return store.getRuntime(); // викидає помилку, якщо не ініціалізовано
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // повертає null, якщо не ініціалізовано
    }
    ```

  </Step>
</Steps>

<Note>
Надавайте перевагу `pluginId` для ідентичності runtime-store. Низькорівнева форма `key` призначена для нечастих випадків, коли одному плагіну навмисно потрібно більше ніж один слот runtime.
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
  Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Логер області видимості (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного старту точки входу.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Визначити шлях відносно кореня плагіна.
</ParamField>

## Пов’язане

- [Внутрішні компоненти плагіна](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
