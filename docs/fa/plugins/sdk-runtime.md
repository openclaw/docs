---
read_when:
    - باید از یک Plugin، helperهای هسته را فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، subagent، nodeها)
    - می‌خواهید بفهمید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - از کد Plugin به ابزارهای کمکی پیکربندی، عامل یا رسانه دسترسی پیدا می‌کنید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرا تزریق‌شده که برای plugins در دسترس هستند
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-06-30T14:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجعی برای شیء `api.runtime` که هنگام ثبت‌نام به هر plugin تزریق می‌شود. از این helperها به‌جای import مستقیم داخلی‌های میزبان استفاده کنید.

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گامی که این helperها را در زمینهٔ Pluginهای کانال به کار می‌برد.
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گامی که این helperها را در زمینهٔ Pluginهای ارائه‌دهنده به کار می‌برد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ برای نمونه `api.config` هنگام ثبت‌نام یا آرگومان `cfg` در callbackهای کانال/ارائه‌دهنده. این کار باعث می‌شود به‌جای parse دوبارهٔ پیکربندی در مسیرهای داغ، یک snapshot فرایندی در سراسر کار جریان داشته باشد.

فقط وقتی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار برگشتی readonly است؛ پیش از ویرایش، آن را clone کنید یا از یک helper جهش استفاده کنید.

کارخانه‌های ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` را دریافت می‌کنند. وقتی پیکربندی می‌تواند پس از ساخت تعریف ابزار تغییر کند، از getter داخل callback `execute` یک ابزار بلندمدت استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر write باید یک سیاست صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload برنامه‌ریز را Gateway بگیرد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی نویسنده می‌داند hot reload ناامن است، یک restart تمیز را اجباری می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` reload/restart خودکار را فقط وقتی سرکوب می‌کند که caller مالک پیگیری بعدی باشد.

helperهای جهش، `afterWrite` به‌همراه یک خلاصهٔ typed به نام `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا test کنند که آیا restart درخواست کرده‌اند یا نه. همچنان مالک زمان رخ‌دادن واقعی آن restart، Gateway است.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` helperهای سازگاری منسوخ‌شده زیر `runtime-config-load-write` هستند. آن‌ها در زمان اجرا یک‌بار warn می‌کنند و در بازهٔ migration برای Pluginهای خارجی قدیمی در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد plugin آن‌ها را فراخوانی کند یا آن helperها را از subpathهای plugin SDK import کند، guardهای مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گستردهٔ
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز پیکربندی استفاده کنید: `config-contracts` برای
typeها، `plugin-config-runtime` برای assertionهای پیکربندیِ از پیش بارگذاری‌شده و lookup ورودی plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای writeها. testهای Pluginهای bundled باید به‌جای mock کردن barrel گستردهٔ سازگاری، همین
subpathهای متمرکز را مستقیم mock کنند.

کد داخلی runtime در OpenClaw نیز همین جهت را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway یا فرایند بارگذاری کنید، سپس همان مقدار را pass دهید. writeهای جهش موفق، snapshot پیکربندی runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی پیکربندی، بر اساس کلید cache متعلق به runtime key شوند. ماژول‌های runtime بلندمدت برای فراخوانی‌های ambient `loadConfig()` اسکنر zero-tolerance دارند؛ از `cfg` پاس‌داده‌شده، `context.getRuntimeConfig()` درخواست، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای ارائه‌دهنده و کانال باید از snapshot پیکربندی runtime فعال استفاده کنند، نه snapshot فایلی که برای بازخوانی یا ویرایش پیکربندی برگشته است. snapshotهای فایل، مقدارهای source مانند markerهای SecretRef را برای UI و writeها حفظ می‌کنند؛ callbackهای ارائه‌دهنده به نمای runtime resolve‌شده نیاز دارند. وقتی helper ممکن است با snapshot source فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentials از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

## ابزارهای runtime قابل استفادهٔ مجدد

برای پیام‌های inbound نوشته‌شده توسط bot، از facts ورودی `botLoopProtection` استفاده کنید. Core، guard مشترک sliding-window در حافظه را پیش از session record و dispatch اعمال می‌کند، بدون اینکه سیاست را به یک کانال گره بزند. این guard کلیدهای `(scopeId, conversationId, participant pair)` را track می‌کند، هر دو جهت یک pair را با هم می‌شمارد، پس از عبور از بودجهٔ window یک cooldown اعمال می‌کند، و entryهای غیرفعال را opportunistic prune می‌کند.

Pluginهای کانالی که این رفتار را در اختیار operatorها می‌گذارند باید برای بودجه‌های baseline شکل مشترک `channels.defaults.botLoopProtection` را ترجیح دهند، سپس overrideهای خاص کانال/ارائه‌دهنده را روی آن layer کنند. پیکربندی مشترک از ثانیه استفاده می‌کند چون user-facing است:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

facts نرمال‌شدهٔ bot-pair را همراه با turn resolve‌شده پاس دهید. Core پیش‌فرض‌ها، تبدیل واحد، و معناشناسی `enabled` را resolve می‌کند:

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

فقط برای loopهای event دوطرفهٔ سفارشی که از reply runner مشترک inbound عبور نمی‌کنند، مستقیم از `openclaw/plugin-sdk/pair-loop-guard-runtime` استفاده کنید.

## namespaceهای runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هویت agent، دایرکتوری‌ها، و مدیریت session.

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

    `runEmbeddedAgent(...)` helper خنثی برای آغاز یک turn معمولی agent در OpenClaw از کد plugin است. از همان resolution ارائه‌دهنده/مدل و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری منسوخ‌شده برای Pluginهای موجود باقی می‌ماند. کد جدید باید از `runEmbeddedAgent(...)` استفاده کند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شدهٔ ارائه‌دهنده/مدل و default اختیاری را برمی‌گرداند. Pluginهای ارائه‌دهنده از طریق hookهای thinking خود مالک profile خاص مدل هستند، بنابراین Pluginهای ابزار باید به‌جای import یا duplication فهرست‌های ارائه‌دهنده، این helper runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی آن در برابر policy resolve‌شده، به سطح ذخیره‌شدهٔ canonical تبدیل می‌کند.

    **helperهای session store** زیر `api.runtime.agent.session` هستند:

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

    برای workflowهای session، `getSessionEntry(...)`، `listSessionEntries(...)`، `patchSessionEntry(...)`، یا `upsertSessionEntry(...)` را ترجیح دهید. این helperها sessionها را با هویت agent/session address می‌کنند تا Pluginها به شکل storage legacy `sessions.json` وابسته نباشند. برای patchهای فقط metadata که نباید activity session را refresh کنند از `preserveActivity: true` استفاده کنید، و `replaceEntry: true` را فقط وقتی به کار ببرید که callback یک entry کامل برمی‌گرداند و fieldهای حذف‌شده باید حذف‌شده بمانند.

    برای خواندن و نوشتن transcript، `openclaw/plugin-sdk/session-transcript-runtime` را import کنید و از `resolveSessionTranscriptIdentity(...)`، `resolveSessionTranscriptTarget(...)`، `readSessionTranscriptEvents(...)`، `appendSessionTranscriptMessageByIdentity(...)`، `publishSessionTranscriptUpdateByIdentity(...)`، یا `withSessionTranscriptWriteLock(...)` با `{ agentId, sessionKey, sessionId }` استفاده کنید. این APIها به Pluginها اجازه می‌دهند یک transcript را identify کنند، eventهای آن را بخوانند، messageها را append کنند، updateها را publish کنند، و عملیات مرتبط را زیر همان write lock transcript اجرا کنند. پاس دادن `sessionFile`، استفاده از `resolveSessionTranscriptLegacyFileTarget(...)`، یا import کردن سطح‌پایین `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` از `openclaw/plugin-sdk/agent-harness-runtime` منسوخ شده است؛ این مسیرها فقط برای کد legacy وجود دارند که از قبل یک artifact transcript فعال دریافت می‌کند.

    `loadSessionStore(...)`، `saveSessionStore(...)`، `updateSessionStore(...)`، `resolveSessionFilePath(...)`، و `resolveAndPersistSessionFile(...)` helperهای سازگاری منسوخ‌شده برای Pluginهایی هستند که هنوز عمداً به شکل legacy کل store یا transcript-file وابسته‌اند. کد plugin جدید نباید از آن helperها استفاده کند، و callerهای موجود باید به helperهای entry و helperهای هویت transcript migration کنند.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default مدل و ارائه‌دهنده:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    یک text completion متعلق به میزبان را بدون import کردن internalهای ارائه‌دهنده یا
    duplication آماده‌سازی مدل/auth/base URL در OpenClaw اجرا کنید.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    این helper از همان مسیر آماده‌سازی simple-completion در runtime داخلی OpenClaw و snapshot پیکربندی runtime متعلق به میزبان استفاده می‌کند. موتورهای context قابلیت `llm.complete` مقید به session را دریافت می‌کنند، بنابراین فراخوانی‌های مدل از agent مربوط به session فعال استفاده می‌کنند و بی‌صدا به agent پیش‌فرض fallback نمی‌کنند. نتیجه شامل attribution ارائه‌دهنده/مدل/agent به‌همراه usage نرمال‌شدهٔ token،
    cache، و هزینهٔ تخمینی در صورت موجود بودن است.

    <Warning>
    overrideهای مدل به opt-in operator از طریق `plugins.entries.<id>.llm.allowModelOverride: true` در پیکربندی نیاز دارند. از `plugins.entries.<id>.llm.allowedModels` برای محدود کردن Pluginهای مورداعتماد به targetهای canonical مشخص `provider/model` استفاده کنید. completionهای cross-agent به `plugins.entries.<id>.llm.allowAgentIdOverride: true` نیاز دارند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    runهای subagent پس‌زمینه را launch و مدیریت کنید.

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
    بازنویسی‌های مدل (`provider`/`model`) به موافقت صریح اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند زیردستیارها را اجرا کنند، اما درخواست‌های بازنویسی رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند نشست‌هایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ساخته است. حذف نشست‌های دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با دامنهٔ مدیر نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    گره‌های متصل را فهرست کنید و یک فرمان میزبانِ گره را از کد Plugin بارگذاری‌شده در Gateway یا از فرمان‌های CLI Plugin فراخوانی کنید. وقتی Plugin مالک کار محلی روی یک دستگاه جفت‌شده است، برای مثال یک پل مرورگر یا صدا روی یک Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در فرمان‌های CLI Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند گره‌های جفت‌شده را از ترمینال بررسی کنند. فرمان‌های Node همچنان از جفت‌سازی عادی گره در Gateway، فهرست‌های مجاز فرمان، سیاست‌های فراخوانی گرهٔ Plugin و رسیدگی محلی فرمان در گره عبور می‌کنند.

    Pluginهایی که فرمان‌های خطرناک میزبانِ گره را در معرض استفاده قرار می‌دهند باید با `api.registerNodeInvokePolicy(...)` یک سیاست فراخوانی گره ثبت کنند. این سیاست پس از بررسی‌های فهرست مجاز فرمان و پیش از ارسال فرمان به گره، در Gateway اجرا می‌شود؛ بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح بالاتر Plugin مسیر اعمال یکسانی را به اشتراک می‌گذارند.

    <Warning>
    فیلد اختیاری `scopes` دامنه‌های اپراتور Gateway را برای فراخوانی درخواست می‌کند. OpenClaw آن را فقط برای Pluginهای همراه و نصب‌های Plugin رسمی مورد اعتماد رعایت می‌کند؛ درخواست‌های Pluginهای دیگر سطح فراخوانی را ارتقا نمی‌دهند. فقط زمانی از آن استفاده کنید که یک Plugin مورد اعتماد باید فرمان گره‌ای را با دامنهٔ سخت‌گیرانه‌تر Gateway، مانند `operator.admin`، فراخوانی کند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime جریان وظیفه را به کلید نشست موجود OpenClaw یا زمینهٔ ابزار مورد اعتماد متصل کنید، سپس بدون ارسال مالک در هر فراخوانی، جریان‌های وظیفه را بسازید و مدیریت کنید.

    جریان وظیفه وضعیت بادوام گردش‌کار چندمرحله‌ای را ردیابی می‌کند. زمان‌بند نیست:
    برای بیدارسازی‌های آینده از Cron یا `api.session.workflow.scheduleSessionTurn(...)` استفاده کنید، سپس وقتی آن کار به وضعیت جریان، وظایف فرزند، انتظارها یا لغو نیاز دارد، از نوبت زمان‌بندی‌شده از `managedFlows` استفاده کنید.

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

    وقتی از لایهٔ اتصال خودتان از قبل یک کلید نشست مورد اعتماد OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از ورودی خام کاربر اتصال نسازید.

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

    از پیکربندی هستهٔ `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند. بافر صوتی PCM به‌همراه نرخ نمونه‌برداری را برمی‌گرداند.

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

    وقتی خروجی تولید نشود (برای مثال ورودی نادیده گرفته شده باشد)، `{ text: undefined }` را برمی‌گرداند.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان نام مستعار سازگاری برای `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` باقی می‌ماند.
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
    نمای فعلی پیکربندی runtime و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال ارسال شده است؛ فقط وقتی handler مستقیماً به نمای فرایند نیاز دارد از `current()` استفاده کنید.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` و `replaceConfigFile(...)` یک مقدار `followUp` برمی‌گردانند، برای مثال `{ mode: "restart", requiresRestart: true, reason }`، که قصد نویسنده را بدون گرفتن کنترل راه‌اندازی مجدد از gateway ثبت می‌کند.

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

    `runCommandWithTimeout(...)` مقدارهای ثبت‌شدهٔ `stdout` و `stderr`، شمارش‌های اختیاری کوتاه‌سازی، `code`، `signal`، `killed`، `termination` و `noOutputTimedOut` را برمی‌گرداند. نتیجه‌های timeout و no-output-timeout وقتی فرایند فرزند کد خروج غیرصفر ارائه نکند، `code: 124` گزارش می‌کنند. خروج‌های سیگنالی غیر timeout همچنان می‌توانند `code: null` برگردانند، بنابراین برای تمایز دلیل‌های timeout از `termination` و `noOutputTimedOut` استفاده کنید.

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
    حل مسیر دایرکتوری وضعیت و فضای ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    انباره‌های کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و بر اساس شناسه Plugin مقید به زمان اجرا ایزوله می‌شوند. برای ادعاهای حذف تکرار اتمیک از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد، `true` برمی‌گرداند؛ یا وقتی یک مقدار زنده از قبل وجود داشته باشد، بدون بازنویسی مقدار، زمان ایجاد یا TTL آن، `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر فضای نام، ۶٬۰۰۰ ردیف زنده برای هر Plugin، مقادیر JSON کمتر از ۶۴KB، و انقضای اختیاری TTL. وقتی یک نوشتن از سقف ردیف Plugin عبور کند، زمان اجرا ممکن است قدیمی‌ترین ردیف‌های زنده را از فضای نامی که در آن نوشته می‌شود بیرون بیندازد؛ فضاهای نام هم‌سطح برای آن نوشتن بیرون انداخته نمی‌شوند، و اگر فضای نام نتواند ردیف‌های کافی آزاد کند، نوشتن همچنان شکست می‌خورد.

    <Warning>
    فقط Pluginهای همراه در این انتشار.
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

    `api.runtime.channel.media` سطح ترجیحی برای بارگیری و ذخیره‌سازی رسانه کانال است:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    وقتی یک URL راه‌دور باید به رسانه OpenClaw تبدیل شود، از `saveRemoteMedia(...)` استفاده کنید. وقتی Plugin از قبل یک `Response` را با احراز هویت، مدیریت تغییرمسیر یا فهرست مجاز تحت مالکیت Plugin دریافت کرده است، از `saveResponseMedia(...)` استفاده کنید. فقط وقتی Plugin برای بازرسی، تبدیل، رمزگشایی یا بارگذاری مجدد به بایت‌های خام نیاز دارد، از `readRemoteMediaBuffer(...)` استفاده کنید. `fetchRemoteMedia(...)` همچنان یک نام مستعار سازگاری منسوخ برای `readRemoteMediaBuffer(...)` است.

    `api.runtime.channel.mentions` سطح مشترک سیاست اشاره ورودی برای Pluginهای کانال همراهی است که از تزریق زمان اجرا استفاده می‌کنند:

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

    کمک‌کننده‌های اشاره موجود:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمداً کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض استفاده قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره‌سازی ارجاع‌های زمان اجرا

برای ذخیره ارجاع زمان اجرا جهت استفاده بیرون از callbackِ `register` از `createPluginRuntimeStore` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد نادری است که یک Plugin عمداً به بیش از یک شکاف زمان اجرا نیاز دارد.
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
  snapshot پیکربندی فعلی (در صورت دسترس بودن، snapshot فعال درون‌حافظه‌ای زمان اجرا).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  لاگر محدود به دامنه (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک‌وزن راه‌اندازی/تنظیم پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin حل می‌کند.
</ParamField>

## مرتبط

- [درونیات Plugin](/fa/plugins/architecture) — مدل قابلیت و رجیستری
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع زیرمسیر
