---
read_when:
    - Вам потрібно викликати допоміжні функції ядра з Plugin (TTS, STT, генерація зображень, вебпошук, субагент, вузли)
    - Ви хочете зрозуміти, що надає api.runtime
    - Ви звертаєтеся до допоміжних засобів конфігурації, агента або медіа з коду plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- впроваджені допоміжні засоби середовища виконання, доступні для плагінів
title: Допоміжні засоби середовища виконання для Plugin
x-i18n:
    generated_at: "2026-06-30T14:26:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Довідка для об’єкта `api.runtime`, який впроваджується в кожен плагін під час реєстрації. Використовуйте ці допоміжні функції замість прямого імпорту внутрішніх компонентів хоста.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/uk/plugins/sdk-channel-plugins">
    Покроковий посібник, який показує використання цих допоміжних функцій у контексті плагінів каналів.
  </Card>
  <Card title="Provider plugins" href="/uk/plugins/sdk-provider-plugins">
    Покроковий посібник, який показує використання цих допоміжних функцій у контексті плагінів провайдерів.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Завантаження та запис конфігурації

Надавайте перевагу конфігурації, яку вже передано в активний шлях виклику, наприклад `api.config` під час реєстрації або аргумент `cfg` у зворотних викликах каналу чи провайдера. Так один знімок процесу проходить крізь роботу без повторного розбору конфігурації на гарячих шляхах.

Використовуйте `api.runtime.config.current()` лише тоді, коли довготривалому обробнику потрібен поточний знімок процесу, а конфігурацію не було передано в цю функцію. Повернене значення доступне лише для читання; перед редагуванням клоновуйте його або використовуйте допоміжну функцію мутації.

Фабрики інструментів отримують `ctx.runtimeConfig` і `ctx.getRuntimeConfig()`. Використовуйте гетер усередині зворотного виклику `execute` довготривалого інструмента, коли конфігурація може змінитися після створення визначення інструмента.

Зберігайте зміни за допомогою `api.runtime.config.mutateConfigFile(...)` або `api.runtime.config.replaceConfigFile(...)`. Кожен запис має вибрати явну політику `afterWrite`:

- `afterWrite: { mode: "auto" }` дозволяє планувальнику перезавантаження Gateway ухвалити рішення.
- `afterWrite: { mode: "restart", reason: "..." }` примусово виконує чистий перезапуск, коли автор запису знає, що гаряче перезавантаження небезпечне.
- `afterWrite: { mode: "none", reason: "..." }` пригнічує автоматичне перезавантаження або перезапуск лише тоді, коли викликач сам відповідає за подальші дії.

Допоміжні функції мутації повертають `afterWrite` разом із типізованим підсумком `followUp`, щоб викликачі могли журналювати або тестувати, чи вони запросили перезапуск. Gateway і далі відповідає за те, коли цей перезапуск фактично відбудеться.

`api.runtime.config.loadConfig()` і `api.runtime.config.writeConfigFile(...)` є застарілими допоміжними функціями сумісності в межах `runtime-config-load-write`. Вони один раз попереджають під час виконання й залишаються доступними для старих зовнішніх плагінів протягом вікна міграції. Вбудовані плагіни не повинні їх використовувати; захисні перевірки межі конфігурації завершуються помилкою, якщо код плагіна викликає їх або імпортує ці допоміжні функції з підшляхів SDK плагіна.

Для прямих імпортів SDK використовуйте сфокусовані підшляхи конфігурації замість широкого
сумісного бареля `openclaw/plugin-sdk/config-runtime`: `config-contracts` для
типів, `plugin-config-runtime` для тверджень щодо вже завантаженої конфігурації та пошуку
входу плагіна, `runtime-config-snapshot` для поточних знімків процесу, а
`config-mutation` для записів. Тести вбудованих плагінів мають мокати ці сфокусовані
підшляхи напряму, а не широкий сумісний барель.

Внутрішній runtime-код OpenClaw має той самий напрям: завантажити конфігурацію один раз на межі CLI, Gateway або процесу, а потім передавати це значення далі. Успішні записи мутацій оновлюють знімок runtime процесу та просувають його внутрішню ревізію; довготривалі кеші мають спиратися на ключ кешу, яким володіє runtime, замість локальної серіалізації конфігурації. Довготривалі runtime-модулі мають сканер із нульовою терпимістю до неявних викликів `loadConfig()`; використовуйте переданий `cfg`, запит `context.getRuntimeConfig()` або `getRuntimeConfig()` на явній межі процесу.

Шляхи виконання провайдера й каналу мають використовувати активний знімок runtime-конфігурації, а не файловий знімок, повернений для зворотного читання або редагування конфігурації. Файлові знімки зберігають вихідні значення, як-от маркери SecretRef для UI та записів; зворотним викликам провайдера потрібне розв’язане runtime-представлення. Коли допоміжну функцію можна викликати як з активним вихідним знімком, так і з активним runtime-знімком, перед читанням облікових даних маршрутизуйте через `selectApplicableRuntimeConfig()`.

## Багаторазові runtime-утиліти

Використовуйте вхідні факти `botLoopProtection` для вхідних повідомлень, створених ботом. Ядро застосовує спільний захист ковзного вікна в пам’яті перед записом сесії та диспетчеризацією, не прив’язуючи політику до одного каналу. Захист відстежує ключі `(scopeId, conversationId, participant pair)`, рахує обидва напрями пари разом, застосовує період охолодження після перевищення бюджету вікна та за можливості прибирає неактивні записи.

Плагіни каналів, які показують цю поведінку операторам, мають надавати перевагу спільній формі `channels.defaults.botLoopProtection` для базових бюджетів, а потім накладати зверху перевизначення, специфічні для каналу або провайдера. Спільна конфігурація використовує секунди, бо вона призначена для користувача:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Передавайте нормалізовані факти пари ботів разом із розв’язаним ходом. Ядро розв’язує типові значення, перетворення одиниць і семантику `enabled`:

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` — нейтральна допоміжна функція для запуску звичайного ходу агента OpenClaw з коду плагіна. Вона використовує те саме розв’язання провайдера/моделі та вибір агентського harness, що й відповіді, запущені каналом.

    `runEmbeddedPiAgent(...)` залишається застарілим сумісним псевдонімом для наявних плагінів. Новий код має використовувати `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` повертає підтримувані рівні мислення провайдера/моделі та необов’язкове типове значення. Плагіни провайдерів володіють профілем, специфічним для моделі, через свої hooks мислення, тому плагіни інструментів мають викликати цю runtime-допоміжну функцію замість імпорту або дублювання списків провайдерів.

    `normalizeThinkingLevel(...)` перетворює користувацький текст, як-от `on`, `x-high` або `extra high`, на канонічний збережений рівень перед перевіркою щодо розв’язаної політики.

    **Допоміжні функції сховища сесій** містяться в `api.runtime.agent.session`:

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

    Надавайте перевагу `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` або `upsertSessionEntry(...)` для робочих процесів сесій. Ці допоміжні функції адресують сесії за ідентичністю агента/сесії, щоб плагіни не залежали від застарілої форми сховища `sessions.json`. Використовуйте `preserveActivity: true` для патчів лише метаданих, які не мають оновлювати активність сесії, і `replaceEntry: true` лише тоді, коли зворотний виклик повертає повний запис, а видалені поля мають залишатися видаленими.

    Для читання та запису транскриптів імпортуйте `openclaw/plugin-sdk/session-transcript-runtime` і використовуйте `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` або `withSessionTranscriptWriteLock(...)` з `{ agentId, sessionKey, sessionId }`. Ці API дають змогу плагінам ідентифікувати транскрипт, читати його події, додавати повідомлення, публікувати оновлення та виконувати пов’язані операції під тим самим блокуванням запису транскрипта. Передавання `sessionFile`, використання `resolveSessionTranscriptLegacyFileTarget(...)` або імпорт низькорівневих `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` з `openclaw/plugin-sdk/agent-harness-runtime` є застарілими; ці шляхи існують лише для legacy-коду, який уже отримує активний артефакт транскрипта.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` і `resolveAndPersistSessionFile(...)` є застарілими допоміжними функціями сумісності для плагінів, які все ще навмисно залежать від застарілої форми всього сховища або файла транскрипта. Новий код плагінів не повинен використовувати ці допоміжні функції, а наявні викликачі мають мігрувати на допоміжні функції записів і допоміжні функції ідентичності транскриптів.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Типові константи моделі та провайдера:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Запускайте текстове доповнення, яким володіє хост, без імпорту внутрішніх компонентів провайдера або
    дублювання підготовки моделі/автентифікації/базового URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Допоміжна функція використовує той самий шлях підготовки простого доповнення, що й
    вбудований runtime OpenClaw, а також знімок runtime-конфігурації, яким володіє хост. Контекстні рушії
    отримують прив’язану до сесії можливість `llm.complete`, тож виклики моделі використовують
    агента активної сесії та не виконують мовчазний fallback до типового агента. Результат
    містить атрибуцію провайдера/моделі/агента, а також нормалізоване використання токенів,
    кешу й орієнтовної вартості, коли воно доступне.

    <Warning>
    Перевизначення моделі потребують явної згоди оператора через `plugins.entries.<id>.llm.allowModelOverride: true` у конфігурації. Використовуйте `plugins.entries.<id>.llm.allowedModels`, щоб обмежити довірені плагіни конкретними канонічними цілями `provider/model`. Доповнення між агентами потребують `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Запускайте та керуйте фоновими запусками subagent.

    ```typescript
    // Запустити виконання субагента
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
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
    Перевизначення моделі (`provider`/`model`) вимагають явної згоди оператора через `plugins.entries.<id>.subagent.allowModelOverride: true` у конфігурації. Ненадійні plugins усе ще можуть запускати субагентів, але запити на перевизначення відхиляються.
    </Warning>

    `deleteSession(...)` може видаляти сесії, створені тим самим plugin через `api.runtime.subagent.run(...)`. Видалення довільних користувацьких або операторських сесій усе ще вимагає запиту Gateway з областю адміністратора.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Виводьте список підключених вузлів і викликайте команду хосту вузла з коду plugin, завантаженого Gateway, або з CLI-команд plugin. Використовуйте це, коли plugin володіє локальною роботою на спареному пристрої, наприклад браузером або аудіомостом на іншому Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Усередині Gateway цей runtime працює в межах процесу. У CLI-командах plugin він викликає налаштований Gateway через RPC, тож команди на кшталт `openclaw googlemeet recover-tab` можуть перевіряти спарені вузли з термінала. Команди Node усе ще проходять через звичайне спарення вузлів Gateway, списки дозволених команд, політики виклику вузлів plugin і локальну обробку команд на вузлі.

    Plugins, які відкривають небезпечні команди хосту вузла, мають зареєструвати політику виклику вузлів за допомогою `api.registerNodeInvokePolicy(...)`. Політика виконується в Gateway після перевірок списку дозволених команд і перед пересиланням команди на вузол, тож прямі виклики `node.invoke` і високорівневі інструменти plugin використовують той самий шлях застосування правил.

    <Warning>
    Необов’язкове поле `scopes` запитує операторські області Gateway для виклику. OpenClaw враховує його лише для вбудованих plugins і довірених інсталяцій офіційних plugin; запити від інших plugins не підвищують привілеї виклику. Використовуйте його лише тоді, коли довірений plugin має викликати команду вузла зі суворішою областю Gateway, як-от `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Прив’яжіть runtime Task Flow до наявного ключа сесії OpenClaw або довіреного контексту інструмента, а потім створюйте й керуйте Task Flows без передавання власника під час кожного виклику.

    Task Flow відстежує стійкий стан багатоетапного робочого процесу. Це не планувальник:
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

    Використовуйте `bindSession({ sessionKey, requesterOrigin })`, коли у вас уже є довірений ключ сесії OpenClaw із вашого власного шару прив’язування. Не прив’язуйте з необробленого користувацького вводу.

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

    // Перелічити доступні голоси
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Використовує базову конфігурацію `messages.tts` і вибір провайдера. Повертає аудіобуфер PCM + частоту дискретизації.

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
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
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

    // Структуроване витягнення із зображення через певного провайдера/модель.
    // Додайте принаймні одне зображення; текстові входи є додатковим контекстом.
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

    Повертає `{ text: undefined }`, коли вивід не створено (наприклад, вхід пропущено).

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
    Поточний знімок конфігурації runtime і транзакційні записи конфігурації. Віддавайте перевагу
    конфігурації, яку вже передали в активний шлях виклику; використовуйте
    `current()` лише коли обробнику потрібен безпосередньо знімок процесу.

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
    `noOutputTimedOut`. Результати тайм-ауту й тайм-ауту без виводу повідомляють `code: 124`,
    коли дочірній процес не надає ненульовий код виходу. Виходи за сигналом без тайм-ауту
    усе ще можуть повертати `code: null`, тому використовуйте `termination` і
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

    Сховища з ключами переживають перезапуски та ізольовані ідентифікатором плагіна, прив’язаним до середовища виконання. Використовуйте `registerIfAbsent(...)` для атомарних заявок на дедуплікацію: він повертає `true`, коли ключ був відсутній або прострочений і зареєстрований, або `false`, коли активне значення вже існує без перезапису його значення, часу створення чи TTL. Обмеження: `maxEntries` на простір імен, 6 000 активних рядків на плагін, значення JSON до 64 КБ і необов’язкове завершення дії TTL. Коли запис перевищив би ліміт рядків плагіна, середовище виконання може витіснити найстаріші активні рядки з простору імен, у який виконується запис; сусідні простори імен для цього запису не витісняються, а запис усе одно завершується помилкою, якщо простір імен не може звільнити достатньо рядків.

    <Warning>
    Лише вбудовані плагіни в цьому випуску.
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
    Допоміжні засоби середовища виконання, специфічні для каналу (доступні, коли завантажено плагін каналу).

    `api.runtime.channel.media` — рекомендована поверхня для завантаження та зберігання медіа каналів:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Використовуйте `saveRemoteMedia(...)`, коли віддалена URL-адреса має стати медіа OpenClaw. Використовуйте `saveResponseMedia(...)`, коли плагін уже отримав `Response` із власною обробкою автентифікації, переспрямувань або списку дозволених адрес. Використовуйте `readRemoteMediaBuffer(...)` лише тоді, коли плагіну потрібні сирі байти для інспекції, перетворень, розшифрування або повторного завантаження. `fetchRemoteMedia(...)` залишається застарілим сумісним псевдонімом для `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` — спільна поверхня політики вхідних згадок для вбудованих плагінів каналів, які використовують ін’єкцію середовища виконання:

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

    `api.runtime.channel.mentions` навмисно не експонує старіші сумісні допоміжні засоби `resolveMentionGating*`. Надавайте перевагу нормалізованому шляху `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Зберігання посилань середовища виконання

Використовуйте `createPluginRuntimeStore`, щоб зберігати посилання на середовище виконання для використання поза callback `register`:

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
Надавайте перевагу `pluginId` для ідентичності runtime-store. Нижчорівнева форма `key` призначена для рідкісних випадків, коли одному плагіну навмисно потрібно більше ніж один слот середовища виконання.
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
  Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Обмежений за областю журналер (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування перед повним входом.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Розв’язати шлях відносно кореня плагіна.
</ParamField>

## Пов’язане

- [Внутрішні механізми Plugin](/uk/plugins/architecture) — модель можливостей і реєстр
- [Точки входу SDK](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry`
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник підшляхів
