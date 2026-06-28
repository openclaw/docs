---
read_when:
    - شما باید از یک Plugin، helperهای هسته را فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، subagent، nodes)
    - می‌خواهید بفهمید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - شما از کد Plugin به ابزارهای کمکی پیکربندی، عامل یا رسانه دسترسی پیدا می‌کنید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرای تزریق‌شده که در دسترس Pluginها هستند
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-06-28T20:46:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت‌نام به هر Plugin تزریق می‌شود. به‌جای وارد کردن مستقیم بخش‌های داخلی میزبان، از این کمکی‌ها استفاده کنید.

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که این کمکی‌ها را در زمینهٔ Pluginهای کانال استفاده می‌کند.
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که این کمکی‌ها را در زمینهٔ Pluginهای ارائه‌دهنده استفاده می‌کند.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت‌نام یا یک آرگومان `cfg` در callbackهای کانال/ارائه‌دهنده. این کار به‌جای تجزیهٔ دوبارهٔ پیکربندی در مسیرهای داغ، یک snapshot فرایند را در سراسر کار جاری نگه می‌دارد.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار برگشتی readonly است؛ پیش از ویرایش، آن را clone کنید یا از یک کمکی mutation استفاده کنید.

Factoryهای ابزار، `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` دریافت می‌کنند. وقتی پیکربندی می‌تواند پس از ایجاد تعریف ابزار تغییر کند، getter را داخل callback اجرای `execute` ابزار بلندمدت استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک سیاست صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload planner مربوط به gateway اعمال شود.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی نویسنده می‌داند hot reload ناامن است، یک restart تمیز را اجباری می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط وقتی caller مالک پیگیری است، reload/restart خودکار را سرکوب می‌کند.

کمکی‌های mutation، `afterWrite` به‌همراه یک خلاصهٔ typed به نام `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا test کنند که آیا درخواست restart داده‌اند یا نه. gateway همچنان مالک زمان واقعی انجام آن restart است.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` کمکی‌های سازگاری deprecated تحت `runtime-config-load-write` هستند. آن‌ها در runtime یک‌بار هشدار می‌دهند و در پنجرهٔ migration برای Pluginهای خارجی قدیمی همچنان در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن کمکی‌ها را از subpathهای plugin SDK وارد کند، guardهای مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای compatibility barrel گستردهٔ
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز پیکربندی استفاده کنید: `config-contracts` برای
typeها، `plugin-config-runtime` برای assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای writeها. تست‌های Pluginهای bundled باید این subpathهای متمرکز را
مستقیما mock کنند، نه اینکه compatibility barrel گسترده را mock کنند.

کد داخلی runtime در OpenClaw نیز همین جهت‌گیری را دارد: پیکربندی را یک‌بار در مرز CLI، gateway، یا فرایند load کنید، سپس همان مقدار را عبور دهید. mutation writeهای موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی پیکربندی، بر اساس cache key متعلق به runtime کلیدگذاری شوند. ماژول‌های runtime بلندمدت برای فراخوانی‌های ambient `loadConfig()` اسکنر با عدم تحمل کامل دارند؛ از `cfg` پاس‌داده‌شده، `context.getRuntimeConfig()` مربوط به request، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای ارائه‌دهنده و کانال باید از snapshot فعال پیکربندی runtime استفاده کنند، نه snapshot فایل که برای readback یا ویرایش پیکربندی برگشته است. snapshotهای فایل مقادیر source مثل markerهای SecretRef را برای UI و writeها حفظ می‌کنند؛ callbackهای ارائه‌دهنده به نمای runtime resolveشده نیاز دارند. وقتی یک کمکی ممکن است با snapshot فعال source یا snapshot فعال runtime فراخوانی شود، پیش از خواندن credentialها آن را از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

## ابزارهای runtime قابل استفادهٔ مجدد

برای پیام‌های ورودی نوشته‌شده توسط bot، از factهای ورودی `botLoopProtection` استفاده کنید. core، guard مشترک sliding-window درون‌حافظه‌ای را پیش از session record و dispatch اعمال می‌کند، بدون اینکه policy را به یک کانال گره بزند. guard کلیدهای `(scopeId, conversationId, participant pair)` را track می‌کند، هر دو جهت یک pair را با هم می‌شمارد، وقتی بودجهٔ window رد شود cooldown اعمال می‌کند، و entryهای inactive را به‌صورت opportunistic هرس می‌کند.

Pluginهای کانال که این رفتار را برای operatorها expose می‌کنند باید برای budgetهای baseline، شکل مشترک `channels.defaults.botLoopProtection` را ترجیح دهند، سپس overrideهای خاص کانال/ارائه‌دهنده را روی آن لایه‌بندی کنند. پیکربندی مشترک از ثانیه استفاده می‌کند چون کاربرمحور است:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

factهای bot-pair نرمال‌شده را همراه turn resolveشده پاس دهید. core defaultها، تبدیل واحد، و semantics مربوط به `enabled` را resolve می‌کند:

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

فقط برای loopهای رویداد دوطرفهٔ custom که از runner مشترک inbound reply عبور نمی‌کنند، مستقیما از `openclaw/plugin-sdk/pair-loop-guard-runtime` استفاده کنید.

## namespaceهای runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هویت agent، directoryها، و مدیریت session.

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

    `runEmbeddedAgent(...)` کمکی neutral برای شروع یک turn عادی agent در OpenClaw از کد Plugin است. از همان resolution ارائه‌دهنده/مدل و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری deprecated برای Pluginهای موجود باقی می‌ماند. کد جدید باید از `runEmbeddedAgent(...)` استفاده کند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده و default اختیاری مربوط به ارائه‌دهنده/مدل را برمی‌گرداند. Pluginهای ارائه‌دهنده، profile خاص مدل را از طریق hookهای thinking خود مالک هستند، بنابراین Pluginهای ابزار باید به‌جای وارد کردن یا duplicate کردن فهرست‌های ارائه‌دهنده، این کمکی runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مثل `on`، `x-high`، یا `extra high` را پیش از بررسی در برابر policy resolveشده، به سطح canonical ذخیره‌شده تبدیل می‌کند.

    **کمکی‌های session store** زیر `api.runtime.agent.session` هستند:

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

    برای workflowهای session، `getSessionEntry(...)`، `listSessionEntries(...)`، `patchSessionEntry(...)`، یا `upsertSessionEntry(...)` را ترجیح دهید. این کمکی‌ها sessionها را با هویت agent/session address می‌کنند تا Pluginها به شکل storage قدیمی `sessions.json` وابسته نباشند. برای patchهای فقط metadata که نباید activity session را refresh کنند، از `preserveActivity: true` استفاده کنید، و `replaceEntry: true` را فقط وقتی استفاده کنید که callback یک entry کامل برمی‌گرداند و فیلدهای حذف‌شده باید حذف‌شده بمانند.

    برای خواندن و نوشتن transcript، `openclaw/plugin-sdk/session-transcript-runtime` را import کنید و از `resolveSessionTranscriptIdentity(...)`، `resolveSessionTranscriptTarget(...)`، `readSessionTranscriptEvents(...)`، `appendSessionTranscriptMessageByIdentity(...)`، `publishSessionTranscriptUpdateByIdentity(...)`، یا `withSessionTranscriptWriteLock(...)` با `{ agentId, sessionKey, sessionId }` استفاده کنید. این APIها به Pluginها امکان می‌دهند یک transcript را identify کنند، رویدادهای آن را بخوانند، message اضافه کنند، update منتشر کنند، و operationهای مرتبط را تحت همان write lock مربوط به transcript اجرا کنند. پاس دادن `sessionFile`، استفاده از `resolveSessionTranscriptLegacyFileTarget(...)`، یا import کردن low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` از `openclaw/plugin-sdk/agent-harness-runtime` deprecated است؛ این مسیرها فقط برای کد legacy وجود دارند که از قبل یک artifact فعال transcript دریافت می‌کند.

    `loadSessionStore(...)`، `saveSessionStore(...)`، `updateSessionStore(...)`، `resolveSessionFilePath(...)`، و `resolveAndPersistSessionFile(...)` کمکی‌های سازگاری deprecated برای Pluginهایی هستند که هنوز عمدا به شکل legacy whole-store یا transcript-file وابسته‌اند. کد Plugin جدید نباید از این کمکی‌ها استفاده کند، و callerهای موجود باید به کمکی‌های entry و کمکی‌های هویت transcript مهاجرت کنند.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default مدل و ارائه‌دهنده:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    یک text completion متعلق به میزبان را بدون import کردن بخش‌های داخلی ارائه‌دهنده یا
    duplicate کردن آماده‌سازی مدل/auth/base URL در OpenClaw اجرا کنید.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    این کمکی از همان مسیر آماده‌سازی simple-completion استفاده می‌کند که runtime
    داخلی OpenClaw استفاده می‌کند، همراه با snapshot پیکربندی runtime متعلق به میزبان. engineهای context
    capability مربوط به `llm.complete` محدود به session را دریافت می‌کنند، بنابراین فراخوانی‌های مدل از
    agent مربوط به session فعال استفاده می‌کنند و بی‌صدا به agent پیش‌فرض fallback نمی‌کنند. نتیجه شامل attribution ارائه‌دهنده/مدل/agent به‌همراه token،
    cache، و estimated cost usage نرمال‌شده در صورت در دسترس بودن است.

    <Warning>
    overrideهای مدل نیازمند opt-in operator از طریق `plugins.entries.<id>.llm.allowModelOverride: true` در پیکربندی هستند. از `plugins.entries.<id>.llm.allowedModels` برای محدود کردن Pluginهای trusted به targetهای canonical مشخص `provider/model` استفاده کنید. completionهای cross-agent نیازمند `plugins.entries.<id>.llm.allowAgentIdOverride: true` هستند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    اجرای background subagentها را راه‌اندازی و مدیریت کنید.

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
    بازنویسی‌های مدل (`provider`/`model`) به اعلام موافقت اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند subagent اجرا کنند، اما درخواست‌های بازنویسی رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند نشست‌هایی را که همان Plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است حذف کند. حذف نشست‌های دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با محدوده ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    گره‌های متصل را فهرست کنید و یک فرمان میزبان گره را از کد Plugin بارگذاری‌شده در Gateway یا از فرمان‌های CLI مربوط به Plugin فراخوانی کنید. زمانی از این استفاده کنید که یک Plugin مالک کار محلی روی یک دستگاه جفت‌شده است، برای مثال یک پل مرورگر یا صدا روی یک Mac دیگر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    درون Gateway، این runtime درون‌فرایندی است. در فرمان‌های CLI مربوط به Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند گره‌های جفت‌شده را از ترمینال بررسی کنند. فرمان‌های Node همچنان از مسیر معمول جفت‌سازی گره در Gateway، فهرست‌های مجاز فرمان، سیاست‌های node-invoke مربوط به Plugin، و مدیریت فرمان محلی گره عبور می‌کنند.

    Pluginهایی که فرمان‌های خطرناک میزبان گره را در معرض استفاده قرار می‌دهند باید با `api.registerNodeInvokePolicy(...)` یک سیاست node-invoke ثبت کنند. این سیاست پس از بررسی‌های فهرست مجاز فرمان و پیش از ارسال فرمان به گره در Gateway اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح‌بالاتر Plugin مسیر اجرای یکسانی را به اشتراک می‌گذارند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime مربوط به Task Flow را به یک کلید نشست موجود OpenClaw یا زمینه ابزار مورد اعتماد متصل کنید، سپس بدون ارسال مالک در هر فراخوانی، Task Flowها را ایجاد و مدیریت کنید.

    Task Flow وضعیت ماندگار گردش‌کارهای چندمرحله‌ای را ردیابی می‌کند. زمان‌بند نیست:
    برای بیدارباش‌های آینده از Cron یا `api.session.workflow.scheduleSessionTurn(...)` استفاده کنید، سپس زمانی که آن کار
    به وضعیت flow، وظایف فرزند، انتظارها، یا لغو نیاز دارد، از `managedFlows` در نوبت زمان‌بندی‌شده استفاده کنید.

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

    وقتی از لایه اتصال خودتان از پیش یک کلید نشست مورد اعتماد OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از ورودی خام کاربر اتصال نسازید.

  </Accordion>
  <Accordion title="api.runtime.tts">
    سنتز متن به گفتار.

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

    از پیکربندی اصلی `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند. بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحلیل تصویر، صدا و ویدیو.

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

    زمانی که هیچ خروجی تولید نشود، `{ text: undefined }` را برمی‌گرداند (مثلاً ورودی رد شده باشد).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان یک نام مستعار سازگاری برای `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` باقی می‌ماند.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    تولید تصویر.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    جست‌وجوی وب.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    ابزارهای سطح پایین رسانه.

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
    عکس فوری پیکربندی runtime فعلی و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که از قبل به مسیر فراخوانی فعال ارسال شده است؛ فقط زمانی از
    `current()` استفاده کنید که handler مستقیماً به عکس فوری فرایند نیاز دارد.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` و `replaceConfigFile(...)` یک مقدار `followUp`
    برمی‌گردانند، برای مثال `{ mode: "restart", requiresRestart: true, reason }`،
    که قصد نویسنده را بدون گرفتن کنترل راه‌اندازی مجدد از
    gateway ثبت می‌کند.

  </Accordion>
  <Accordion title="api.runtime.system">
    ابزارهای سطح سیستم.

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

    `runCommandWithTimeout(...)` مقادیر ضبط‌شده `stdout` و `stderr`، شمارش‌های اختیاری
    کوتاه‌سازی، `code`، `signal`، `killed`، `termination`، و
    `noOutputTimedOut` را برمی‌گرداند. نتایج timeout و no-output-timeout زمانی `code: 124`
    گزارش می‌کنند که فرایند فرزند یک کد خروج غیرصفر ارائه نکند. خروج‌های signal
    غیر-timeout همچنان می‌توانند `code: null` برگردانند، بنابراین برای تشخیص دلایل timeout از `termination` و
    `noOutputTimedOut` استفاده کنید.

  </Accordion>
  <Accordion title="api.runtime.events">
    اشتراک‌های رویداد.

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
    ثبت لاگ.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    حل احراز هویت مدل و ارائه‌دهنده.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    حل مسیر دایرکتوری وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌گاه‌های کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و با شناسه Plugin مقید به زمان اجرا ایزوله می‌شوند. برای ادعاهای حذف تکرار اتمیک از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد `true` برمی‌گرداند، یا وقتی یک مقدار زنده از قبل وجود داشته باشد، بدون بازنویسی مقدار، زمان ایجاد یا TTL آن، `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر فضای نام، ۶٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON کمتر از ۶۴KB، و انقضای اختیاری TTL. وقتی نوشتن از سقف ردیف‌های Plugin فراتر برود، زمان اجرا ممکن است قدیمی‌ترین ردیف‌های زنده را از فضای نامی که در آن نوشته می‌شود حذف کند؛ فضاهای نام هم‌سطح برای آن نوشتن حذف نمی‌شوند، و اگر فضای نام نتواند ردیف‌های کافی آزاد کند، نوشتن همچنان ناموفق می‌شود.

    <Warning>
    فقط Pluginهای بسته‌بندی‌شده در این انتشار.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    کارخانه‌های ابزار حافظه و CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    کمک‌کننده‌های زمان اجرای مخصوص کانال (وقتی یک Plugin کانال بارگذاری شده باشد در دسترس است).

    `api.runtime.channel.media` سطح ترجیحی برای دانلود و ذخیره‌سازی رسانه کانال است:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    وقتی یک URL راه‌دور باید به رسانه OpenClaw تبدیل شود، از `saveRemoteMedia(...)` استفاده کنید. وقتی Plugin از قبل یک `Response` را با مدیریت احراز هویت، تغییرمسیر یا فهرست مجاز تحت مالکیت Plugin واکشی کرده است، از `saveResponseMedia(...)` استفاده کنید. فقط وقتی Plugin برای بازرسی، تبدیل، رمزگشایی یا بارگذاری دوباره به بایت‌های خام نیاز دارد، از `readRemoteMediaBuffer(...)` استفاده کنید. `fetchRemoteMedia(...)` همچنان یک نام مستعار سازگاری منسوخ برای `readRemoteMediaBuffer(...)` است.

    `api.runtime.channel.mentions` سطح مشترک سیاست اشاره ورودی برای Pluginهای کانال بسته‌بندی‌شده‌ای است که از تزریق زمان اجرا استفاده می‌کنند:

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

    کمک‌کننده‌های اشاره در دسترس:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمداً کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض استفاده قرار نمی‌دهد. مسیر نرمال‌سازی‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره کردن ارجاع‌های زمان اجرا

برای ذخیره ارجاع زمان اجرا جهت استفاده بیرون از callback مربوط به `register`، از `createPluginRuntimeStore` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد غیرمعمولی است که یک Plugin عمداً به بیش از یک شکاف زمان اجرا نیاز دارد.
</Note>

## دیگر فیلدهای سطح بالای `api`

فراتر از `api.runtime`، شیء API این موارد را نیز فراهم می‌کند:

<ParamField path="api.id" type="string">
  شناسه Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  نام نمایشی Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  عکس فوری پیکربندی فعلی (در صورت در دسترس بودن، عکس فوری زمان اجرای درون‌حافظه‌ای فعال).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger محدود به دامنه (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک‌وزن راه‌اندازی/تنظیم پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin حل می‌کند.
</ParamField>

## مرتبط

- [درون‌سازوکارهای Plugin](/fa/plugins/architecture) — مدل قابلیت و registry
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع subpath
