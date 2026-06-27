---
read_when:
    - باید از یک Plugin، helperهای هسته را فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، subagent، nodes)
    - می‌خواهید بدانید `api.runtime` چه چیزهایی را در دسترس قرار می‌دهد
    - از کد Plugin به helperهای پیکربندی، عامل یا رسانه دسترسی دارید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرای تزریق‌شدهٔ در دسترس Pluginها
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-06-27T18:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت‌نام به هر Plugin تزریق می‌شود. به‌جای ایمپورت مستقیم اجزای داخلی میزبان، از این کمک‌کننده‌ها استفاده کنید.

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که این کمک‌کننده‌ها را در بستر Pluginهای کانال به‌کار می‌گیرد.
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که این کمک‌کننده‌ها را در بستر Pluginهای ارائه‌دهنده به‌کار می‌گیرد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت‌نام یا آرگومان `cfg` در callbackهای کانال/ارائه‌دهنده. این کار باعث می‌شود به‌جای بازتجزیه پیکربندی در مسیرهای داغ، یک snapshot فرایند در سراسر کار جریان داشته باشد.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندعمر به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار برگشتی فقط‌خواندنی است؛ پیش از ویرایش، آن را clone کنید یا از یک کمک‌کننده mutation استفاده کنید.

کارخانه‌های ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` دریافت می‌کنند. وقتی پیکربندی می‌تواند پس از ایجاد تعریف ابزار تغییر کند، از getter داخل callback `execute` یک ابزار بلندعمر استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک سیاست صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload برنامه‌ریز Gateway اعمال شود.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی نویسنده می‌داند hot reload امن نیست، یک restart تمیز را اجباری می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط زمانی reload/restart خودکار را سرکوب می‌کند که فراخواننده مالک پیگیری بعدی باشد.

کمک‌کننده‌های mutation مقدار `afterWrite` به‌همراه یک خلاصه تایپ‌شده `followUp` برمی‌گردانند تا فراخواننده‌ها بتوانند log کنند یا تست کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک این است که آن restart در عمل چه زمانی رخ دهد.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` کمک‌کننده‌های سازگاری منسوخ‌شده زیر `runtime-config-load-write` هستند. آن‌ها در زمان اجرا یک‌بار هشدار می‌دهند و در بازه مهاجرت برای Pluginهای خارجی قدیمی در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن کمک‌کننده‌ها را از subpathهای Plugin SDK ایمپورت کند، guardهای مرز پیکربندی fail می‌شوند.

برای ایمپورت‌های مستقیم SDK، به‌جای compatibility barrel گسترده
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز پیکربندی استفاده کنید: `config-contracts` برای
typeها، `plugin-config-runtime` برای assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای نوشتن‌ها. تست‌های Pluginهای bundled باید این subpathهای متمرکز را
مستقیم mock کنند، نه اینکه compatibility barrel گسترده را mock کنند.

کد runtime داخلی OpenClaw نیز همین جهت‌گیری را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway، یا فرایند بارگذاری کنید، سپس همان مقدار را عبور دهید. نوشتن‌های mutation موفق snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندعمر باید به‌جای سریال‌سازی محلی پیکربندی، بر اساس cache key متعلق به runtime کلید بخورند. ماژول‌های runtime بلندعمر برای فراخوانی‌های ambient `loadConfig()` اسکنر با تحمل صفر دارند؛ از `cfg` پاس‌داده‌شده، `context.getRuntimeConfig()` درخواست، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای ارائه‌دهنده و کانال باید از snapshot پیکربندی runtime فعال استفاده کنند، نه از snapshot فایل که برای بازخوانی یا ویرایش پیکربندی برگردانده شده است. Snapshotهای فایل مقدارهای منبع مانند markerهای SecretRef را برای UI و نوشتن‌ها حفظ می‌کنند؛ callbackهای ارائه‌دهنده به نمای runtime resolve‌شده نیاز دارند. وقتی یک کمک‌کننده ممکن است با snapshot منبع فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentialها از مسیر `selectApplicableRuntimeConfig()` عبور کنید.

## ابزارهای runtime قابل‌استفاده مجدد

برای پیام‌های ورودی نوشته‌شده توسط bot، از factهای ورودی `botLoopProtection` استفاده کنید. Core پیش از ثبت session و dispatch، guard مشترک درون‌حافظه‌ای با sliding window را اعمال می‌کند، بدون اینکه سیاست را به یک کانال خاص گره بزند. Guard کلیدهای `(scopeId, conversationId, participant pair)` را track می‌کند، هر دو جهت یک pair را با هم می‌شمارد، وقتی بودجه window بیشتر شود cooldown اعمال می‌کند، و entryهای غیرفعال را opportunistic prune می‌کند.

Pluginهای کانالی که این رفتار را در اختیار operatorها می‌گذارند باید برای بودجه‌های baseline شکل مشترک `channels.defaults.botLoopProtection` را ترجیح دهند، سپس overrideهای خاص کانال/ارائه‌دهنده را روی آن لایه‌بندی کنند. پیکربندی مشترک از ثانیه استفاده می‌کند چون user-facing است:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Factهای bot-pair نرمال‌شده را همراه turn resolve‌شده پاس دهید. Core پیش‌فرض‌ها، تبدیل واحد، و معناشناسی `enabled` را resolve می‌کند:

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

فقط برای حلقه‌های رویداد دوطرفه سفارشی که از runner مشترک پاسخ ورودی عبور نمی‌کنند، مستقیما از `openclaw/plugin-sdk/pair-loop-guard-runtime` استفاده کنید.

## namespaceهای runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هویت Agent، دایرکتوری‌ها، و مدیریت session.

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

    `runEmbeddedAgent(...)` کمک‌کننده خنثی برای شروع یک turn عادی Agent در OpenClaw از کد Plugin است. این helper از همان resolution ارائه‌دهنده/مدل و انتخاب harness عامل استفاده می‌کند که پاسخ‌های triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری منسوخ‌شده برای Pluginهای موجود باقی می‌ماند. کد جدید باید از `runEmbeddedAgent(...)` استفاده کند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده و پیش‌فرض اختیاری ارائه‌دهنده/مدل را برمی‌گرداند. Pluginهای ارائه‌دهنده profile خاص مدل را از طریق hookهای thinking خودشان مالک هستند، بنابراین Pluginهای ابزار باید به‌جای ایمپورت یا تکرار listهای ارائه‌دهنده، این کمک‌کننده runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی آن در برابر policy resolve‌شده، به سطح canonical ذخیره‌شده تبدیل می‌کند.

    **کمک‌کننده‌های store session** زیر `api.runtime.agent.session` هستند:

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

    برای workflowهای session، `getSessionEntry(...)`، `listSessionEntries(...)`، `patchSessionEntry(...)`، یا `upsertSessionEntry(...)` را ترجیح دهید. این کمک‌کننده‌ها sessionها را با هویت agent/session آدرس‌دهی می‌کنند تا Pluginها به شکل storage قدیمی `sessions.json` وابسته نباشند. برای patchهای فقط metadata که نباید فعالیت session را refresh کنند از `preserveActivity: true` استفاده کنید، و فقط وقتی callback یک entry کامل برمی‌گرداند و fieldهای حذف‌شده باید حذف‌شده بمانند، از `replaceEntry: true` استفاده کنید.

    برای خواندن و نوشتن transcript، `openclaw/plugin-sdk/session-transcript-runtime` را ایمپورت کنید و از `resolveSessionTranscriptIdentity(...)`، `resolveSessionTranscriptTarget(...)`، `readSessionTranscriptEvents(...)`، `appendSessionTranscriptMessageByIdentity(...)`، `publishSessionTranscriptUpdateByIdentity(...)`، یا `withSessionTranscriptWriteLock(...)` با `{ agentId, sessionKey, sessionId }` استفاده کنید. این APIها به Pluginها امکان می‌دهند یک transcript را شناسایی کنند، eventهای آن را بخوانند، messageها را append کنند، updateها را publish کنند، و operationهای مرتبط را زیر همان write lock مربوط به transcript اجرا کنند. فقط زمانی `sessionFile` را پاس دهید که کدی را adapt می‌کنید که از قبل یک artifact فعال transcript دریافت می‌کند و نیاز دارد هر helper روی همان artifact عمل کند.

    `loadSessionStore(...)`، `saveSessionStore(...)`، `updateSessionStore(...)`، و `resolveSessionFilePath(...)` کمک‌کننده‌های سازگاری برای Pluginهایی هستند که هنوز عمدا به شکل قدیمی whole-store یا transcript-file وابسته‌اند. کد Plugin جدید نباید از آن helperها استفاده کند، و فراخواننده‌های موجود باید به helperهای entry مهاجرت کنند.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های پیش‌فرض مدل و ارائه‌دهنده:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    بدون ایمپورت internals ارائه‌دهنده یا تکرار آماده‌سازی مدل/auth/base URL در OpenClaw، یک completion متنی متعلق به میزبان اجرا کنید.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    این کمک‌کننده از همان مسیر آماده‌سازی simple-completion استفاده می‌کند که runtime داخلی OpenClaw استفاده می‌کند، و از snapshot پیکربندی runtime متعلق به میزبان بهره می‌برد. موتورهای context یک قابلیت `llm.complete` محدود به session دریافت می‌کنند، بنابراین فراخوانی‌های مدل از agent مربوط به session فعال استفاده می‌کنند و بی‌سروصدا به agent پیش‌فرض fallback نمی‌کنند. نتیجه شامل attribution ارائه‌دهنده/مدل/agent به‌همراه usage نرمال‌شده token، cache، و هزینه تخمینی در صورت موجود بودن است.

    <Warning>
    Overrideهای مدل نیازمند opt-in operator از طریق `plugins.entries.<id>.llm.allowModelOverride: true` در پیکربندی هستند. برای محدود کردن Pluginهای مورد اعتماد به targetهای canonical مشخص `provider/model` از `plugins.entries.<id>.llm.allowedModels` استفاده کنید. Completionهای بین-agent نیازمند `plugins.entries.<id>.llm.allowAgentIdOverride: true` هستند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    اجرای subagentهای پس‌زمینه را launch و مدیریت کنید.

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
    بازنویسی‌های مدل (`provider`/`model`) به فعال‌سازی صریح گرداننده از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند زیرعامل‌ها را اجرا کنند، اما درخواست‌های بازنویسی رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند نشست‌هایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ساخته است. حذف نشست‌های دلخواه کاربر یا گرداننده همچنان به یک درخواست Gateway با محدوده مدیر نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Nodeهای متصل را فهرست کنید و یک فرمان میزبان Node را از کد Plugin بارگذاری‌شده توسط Gateway یا از فرمان‌های CLI مربوط به Plugin فراخوانی کنید. وقتی Plugin مالک کار محلی روی یک دستگاه جفت‌شده است، برای مثال یک پل مرورگر یا صدا روی یک Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرآیندی است. در فرمان‌های CLI مربوط به Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند Nodeهای جفت‌شده را از ترمینال بررسی کنند. فرمان‌های Node همچنان از مسیر عادی جفت‌سازی Node در Gateway، فهرست‌های مجاز فرمان، سیاست‌های فراخوانی Node مربوط به Plugin، و رسیدگی محلی فرمان در Node عبور می‌کنند.

    Pluginهایی که فرمان‌های خطرناک میزبان Node را در معرض استفاده قرار می‌دهند باید یک سیاست فراخوانی Node را با `api.registerNodeInvokePolicy(...)` ثبت کنند. این سیاست پس از بررسی فهرست مجاز فرمان و پیش از ارسال فرمان به Node در Gateway اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح‌بالاتر Plugin مسیر اعمال یکسانی را به اشتراک می‌گذارند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime جریان وظیفه را به کلید نشست موجود OpenClaw یا زمینه ابزار قابل اعتماد متصل کنید، سپس بدون فرستادن مالک در هر فراخوانی، جریان‌های وظیفه را ایجاد و مدیریت کنید.

    جریان وظیفه وضعیت پایدار گردش‌کارهای چندمرحله‌ای را دنبال می‌کند. زمان‌بند نیست:
    برای بیدارسازی‌های آینده از Cron یا `api.session.workflow.scheduleSessionTurn(...)` استفاده کنید، سپس وقتی آن کار
    به وضعیت جریان، وظایف فرزند، انتظارها، یا لغو نیاز دارد، از نوبت زمان‌بندی‌شده `managedFlows` را به کار ببرید.

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

    وقتی از لایه اتصال خودتان یک کلید نشست قابل اعتماد OpenClaw در اختیار دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از ورودی خام کاربر اتصال ایجاد نکنید.

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

    از پیکربندی هسته `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند. بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحلیل تصویر، صدا و ویدئو.

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

    وقتی خروجی تولید نشود (برای مثال ورودی نادیده گرفته شود)، `{ text: undefined }` را برمی‌گرداند.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` همچنان به‌عنوان نام مستعار سازگاری برای `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` باقی می‌ماند.
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
    عکس فوری پیکربندی runtime جاری و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از
    `current()` استفاده کنید که handler مستقیما به عکس فوری فرایند نیاز دارد.

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
    که نیت نویسنده را بدون گرفتن کنترل راه‌اندازی مجدد از
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

    `runCommandWithTimeout(...)`، `stdout` و `stderr` ثبت‌شده، شمارش‌های اختیاری
    کوتاه‌سازی، `code`، `signal`، `killed`، `termination`، و
    `noOutputTimedOut` را برمی‌گرداند. نتیجه‌های timeout و no-output-timeout وقتی فرایند فرزند کد خروج غیرصفر ارائه نکند، `code: 124`
    را گزارش می‌کنند. خروج‌های سیگنالی غیر timeout همچنان می‌توانند `code: null` برگردانند، بنابراین برای تشخیص علت‌های timeout از `termination` و
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
    حل مسیر پوشه وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌گاه‌های کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و با شناسه‌ی Plugin متصل به زمان اجرا ایزوله می‌شوند. برای ادعاهای حذف تکراری اتمیک از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد، `true` برمی‌گرداند؛ یا وقتی یک مقدار زنده از قبل وجود داشته باشد، بدون بازنویسی مقدار، زمان ایجاد یا TTL آن، `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر فضای نام، ۶٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON کمتر از ۶۴KB، و انقضای اختیاری TTL. وقتی یک نوشتن از سقف ردیف‌های Plugin فراتر برود، زمان اجرا ممکن است قدیمی‌ترین ردیف‌های زنده را از فضای نامی که در آن نوشته می‌شود حذف کند؛ فضاهای نام خواهر برای آن نوشتن حذف نمی‌شوند، و اگر فضای نام نتواند ردیف‌های کافی آزاد کند، نوشتن همچنان شکست می‌خورد.

    <Warning>
    فقط Pluginهای همراه در این نسخه.
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

    `api.runtime.channel.media` سطح ترجیحی برای دانلودها و ذخیره‌سازی رسانه‌ی کانال است:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    وقتی یک URL راه‌دور باید به رسانه‌ی OpenClaw تبدیل شود، از `saveRemoteMedia(...)` استفاده کنید. وقتی Plugin از قبل یک `Response` را با احراز هویت، تغییرمسیر یا مدیریت فهرست مجازِ متعلق به Plugin دریافت کرده است، از `saveResponseMedia(...)` استفاده کنید. فقط وقتی Plugin برای بازرسی، تبدیل‌ها، رمزگشایی یا بارگذاری مجدد به بایت‌های خام نیاز دارد، از `readRemoteMediaBuffer(...)` استفاده کنید. `fetchRemoteMedia(...)` همچنان یک نام مستعار سازگاری منسوخ برای `readRemoteMediaBuffer(...)` است.

    `api.runtime.channel.mentions` سطح مشترک سیاست اشاره‌ی ورودی برای Pluginهای کانال همراهی است که از تزریق زمان اجرا استفاده می‌کنند:

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

    کمک‌کننده‌های اشاره‌ی موجود:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمداً کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض استفاده قرار نمی‌دهد. مسیر نرمال‌شده‌ی `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره‌سازی ارجاع‌های زمان اجرا

برای ذخیره‌ی ارجاع زمان اجرا جهت استفاده بیرون از callback مربوط به `register`، از `createPluginRuntimeStore` استفاده کنید:

<Steps>
  <Step title="ایجاد ذخیره‌گاه">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="اتصال به نقطه‌ی ورود">
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
  <Step title="دسترسی از فایل‌های دیگر">
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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد نامعمولی است که یک Plugin عمداً به بیش از یک شکاف زمان اجرا نیاز دارد.
</Note>

## دیگر فیلدهای سطح بالای `api`

فراتر از `api.runtime`، شیء API این موارد را نیز فراهم می‌کند:

<ParamField path="api.id" type="string">
  شناسه‌ی Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  نام نمایشی Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  snapshot پیکربندی فعلی (در صورت موجود بودن، snapshot فعال زمان اجرای درون حافظه).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger دامنه‌دار (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره‌ی سبک راه‌اندازی/آماده‌سازی پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه‌ی Plugin حل می‌کند.
</ParamField>

## مرتبط

- [داخلی‌های Plugin](/fa/plugins/architecture) — مدل قابلیت و رجیستری
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع زیرمسیر
