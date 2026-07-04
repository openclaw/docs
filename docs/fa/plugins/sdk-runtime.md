---
read_when:
    - باید کمک‌کننده‌های هسته را از یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، عامل فرعی، گره‌ها)
    - می‌خواهید بدانید `api.runtime` چه چیزهایی را در اختیار می‌گذارد
    - شما از کد Plugin به راهبرهای پیکربندی، عامل یا رسانه دسترسی دارید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌یارهای زمان اجرای تزریق‌شده که برای Pluginها در دسترس هستند
title: راهنماهای کمکی زمان اجرای Plugin
x-i18n:
    generated_at: "2026-07-04T20:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت در هر Plugin تزریق می‌شود. از این کمکی‌ها به‌جای import مستقیم internals میزبان استفاده کنید.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که این کمکی‌ها را در زمینهٔ Pluginهای کانال استفاده می‌کند.
  </Card>
  <Card title="Provider plugins" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که این کمکی‌ها را در زمینهٔ Pluginهای provider استفاده می‌کند.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت یا آرگومان `cfg` در callbackهای کانال/provider. این کار باعث می‌شود به‌جای parse دوبارهٔ پیکربندی در مسیرهای داغ، یک snapshot فرایند در سراسر کار جریان داشته باشد.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار بازگشتی readonly است؛ پیش از ویرایش، آن را clone کنید یا از یک کمکی mutation استفاده کنید.

کارخانه‌های ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` را دریافت می‌کنند. وقتی پیکربندی می‌تواند پس از ساخته‌شدن تعریف ابزار تغییر کند، از getter داخل callback بلندمدت `execute` ابزار استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک policy صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload planner بر عهدهٔ Gateway باشد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی نویسنده می‌داند hot reload ناامن است، یک restart تمیز را اجباری می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط زمانی reload/restart خودکار را سرکوب می‌کند که caller مالک پیگیری بعدی باشد.

کمکی‌های mutation مقدار `afterWrite` به‌همراه یک خلاصهٔ typed از `followUp` را برمی‌گردانند تا callerها بتوانند log کنند یا تست کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک زمان واقعی وقوع آن restart است.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` کمکی‌های سازگاری deprecated زیر `runtime-config-load-write` هستند. آن‌ها در runtime یک‌بار هشدار می‌دهند و در بازهٔ migration برای Pluginهای خارجی قدیمی همچنان در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را صدا بزند یا آن کمکی‌ها را از زیرمسیرهای plugin SDK import کند، guardهای مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گستردهٔ
`openclaw/plugin-sdk/config-runtime` از زیرمسیرهای متمرکز پیکربندی استفاده کنید: `config-contracts` برای
typeها، `plugin-config-runtime` برای assertionهای پیکربندی از قبل بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای نوشتن‌ها. تست‌های Pluginهای bundled باید این زیرمسیرهای متمرکز را مستقیماً mock کنند، به‌جای mock کردن barrel سازگاری گسترده.

کد runtime داخلی OpenClaw نیز همین جهت را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway، یا فرایند بارگذاری کنید، سپس همان مقدار را پاس دهید. نوشتن‌های mutation موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serializing محلی پیکربندی، بر اساس cache key متعلق به runtime کلید بخورند. ماژول‌های runtime بلندمدت برای فراخوانی‌های ambient `loadConfig()` scanner با تحمل صفر دارند؛ از یک `cfg` پاس‌داده‌شده، یک request `context.getRuntimeConfig()`، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای provider و کانال باید از snapshot پیکربندی runtime فعال استفاده کنند، نه snapshot فایلی که برای readback یا ویرایش پیکربندی برگشته است. snapshotهای فایل مقدارهای source مانند markerهای SecretRef را برای UI و نوشتن‌ها حفظ می‌کنند؛ callbackهای provider به view حل‌شدهٔ runtime نیاز دارند. وقتی یک کمکی ممکن است با snapshot فعال source یا snapshot فعال runtime صدا زده شود، پیش از خواندن credentialها از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

## ابزارهای runtime قابل استفادهٔ مجدد

برای پیام‌های inbound نوشته‌شده توسط bot از factهای inbound `botLoopProtection` استفاده کنید. Core پیش از ثبت session و dispatch، guard مشترک sliding-window در حافظه را اعمال می‌کند، بدون اینکه policy را به یک کانال گره بزند. این guard کلیدهای `(scopeId, conversationId, participant pair)` را track می‌کند، هر دو جهت یک pair را با هم می‌شمارد، وقتی بودجهٔ window رد شود cooldown اعمال می‌کند، و entryهای inactive را به‌صورت opportunistic prune می‌کند.

Pluginهای کانال که این رفتار را در اختیار operatorها می‌گذارند باید برای budgetهای baseline شکل مشترک `channels.defaults.botLoopProtection` را ترجیح دهند، سپس overrideهای خاص کانال/provider را روی آن layer کنند. پیکربندی مشترک از ثانیه استفاده می‌کند، چون user-facing است:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

factهای bot-pair نرمال‌شده را همراه turn حل‌شده پاس دهید. Core پیش‌فرض‌ها، تبدیل واحد، و semantics مربوط به `enabled` را resolve می‌کند:

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

از `openclaw/plugin-sdk/pair-loop-guard-runtime` مستقیماً فقط برای event loopهای سفارشی دوطرفه استفاده کنید که از reply runner مشترک inbound عبور نمی‌کنند.

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` کمکی خنثی برای شروع یک turn عادی Agent در OpenClaw از کد Plugin است. از همان resolution provider/model و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری deprecated برای Pluginهای موجود باقی می‌ماند. کد جدید باید از `runEmbeddedAgent(...)` استفاده کند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شدهٔ provider/model و default اختیاری را برمی‌گرداند. Pluginهای provider مالک profile خاص model از طریق hookهای thinking خود هستند، بنابراین Pluginهای ابزار باید به‌جای import یا duplicate کردن فهرست‌های provider، این کمکی runtime را صدا بزنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی آن در برابر policy حل‌شده، به سطح ذخیره‌شدهٔ canonical تبدیل می‌کند.

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    برای workflowهای session، `getSessionEntry(...)`، `listSessionEntries(...)`، `patchSessionEntry(...)`، یا `upsertSessionEntry(...)` را ترجیح دهید. این کمکی‌ها sessionها را بر اساس هویت agent/session address می‌کنند تا Pluginها به شکل storage قدیمی `sessions.json` وابسته نباشند. برای patchهای فقط metadata که نباید فعالیت session را refresh کنند از `preserveActivity: true` استفاده کنید، و از `replaceEntry: true` فقط وقتی استفاده کنید که callback یک entry کامل برمی‌گرداند و fieldهای حذف‌شده باید حذف‌شده باقی بمانند.

    وقتی یک Plugin کاری را روی session پایدارشده شروع می‌کند، از `runWithWorkAdmission(...)` استفاده کنید. callback، sessionهای archived یا sessionهایی را که هم‌زمان replace شده‌اند reject می‌کند، mutationهای archive/reset/delete را در طول completion هماهنگ نگه می‌دارد، و یک `AbortSignal` دریافت می‌کند که باید به agent run forward شود.

    برای خواندن و نوشتن transcript، `openclaw/plugin-sdk/session-transcript-runtime` را import کنید و از `resolveSessionTranscriptIdentity(...)`، `resolveSessionTranscriptTarget(...)`، `readSessionTranscriptEvents(...)`، `appendSessionTranscriptMessageByIdentity(...)`، `publishSessionTranscriptUpdateByIdentity(...)`، یا `withSessionTranscriptWriteLock(...)` با `{ agentId, sessionKey, sessionId }` استفاده کنید. این APIها به Pluginها اجازه می‌دهند یک transcript را شناسایی کنند، eventهای آن را بخوانند، message اضافه کنند، update منتشر کنند، و operationهای مرتبط را زیر همان write lock transcript اجرا کنند. پاس دادن `sessionFile`، استفاده از `resolveSessionTranscriptLegacyFileTarget(...)`، یا import کردن سطح پایین `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` از `openclaw/plugin-sdk/agent-harness-runtime` deprecated است؛ آن مسیرها فقط برای کد legacy وجود دارند که از قبل یک artifact فعال transcript دریافت می‌کند.

    `loadSessionStore(...)`، `saveSessionStore(...)`، `updateSessionStore(...)`، `resolveSessionFilePath(...)`، و `resolveAndPersistSessionFile(...)` کمکی‌های سازگاری deprecated برای Pluginهایی هستند که هنوز عمداً به شکل legacy whole-store یا transcript-file وابسته‌اند. کد جدید Plugin نباید از این کمکی‌ها استفاده کند، و callerهای موجود باید به کمکی‌های entry و کمکی‌های هویت transcript migrate کنند.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default برای model و provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    یک text completion متعلق به میزبان را بدون import کردن internals مربوط به provider یا
    duplicate کردن آماده‌سازی model/auth/base URL در OpenClaw اجرا کنید.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    این کمکی از همان مسیر آماده‌سازی simple-completion استفاده می‌کند که runtime
    built-in در OpenClaw و snapshot پیکربندی runtime متعلق به میزبان استفاده می‌کنند. engineهای context
    یک capability با نام `llm.complete` وابسته به session دریافت می‌کنند، بنابراین فراخوانی‌های model از
    agent مربوط به session فعال استفاده می‌کنند و بی‌صدا به agent پیش‌فرض fallback نمی‌کنند. نتیجه شامل attribution مربوط به provider/model/agent به‌همراه usage نرمال‌شدهٔ token،
    cache، و هزینهٔ تخمینی، در صورت availability، است.

    <Warning>
    بازنویسی‌های مدل به انتخاب صریح اپراتور از طریق `plugins.entries.<id>.llm.allowModelOverride: true` در پیکربندی نیاز دارند. برای محدود کردن Pluginهای مورد اعتماد به مقصدهای استاندارد مشخص `provider/model` از `plugins.entries.<id>.llm.allowedModels` استفاده کنید. تکمیل‌های بین‌عامل به `plugins.entries.<id>.llm.allowAgentIdOverride: true` نیاز دارند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    اجراهای پس‌زمینه زیرعامل را راه‌اندازی و مدیریت کنید.

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
    بازنویسی‌های مدل (`provider`/`model`) به انتخاب صریح اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند زیرعامل‌ها را اجرا کنند، اما درخواست‌های بازنویسی رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند نشست‌هایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است. حذف نشست‌های دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با محدوده ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    گره‌های متصل را فهرست کنید و یک فرمان میزبان گره را از کد Plugin بارگذاری‌شده توسط Gateway یا از فرمان‌های CLI Plugin فراخوانی کنید. زمانی از این استفاده کنید که یک Plugin مالک کار محلی روی دستگاه جفت‌شده باشد، برای مثال یک مرورگر یا پل صوتی روی یک Mac دیگر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway، این زمان اجرا درون‌فرایندی است. در فرمان‌های CLI Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند گره‌های جفت‌شده را از ترمینال بررسی کنند. فرمان‌های Node همچنان از مسیر معمول جفت‌سازی گره Gateway، فهرست‌های مجاز فرمان، سیاست‌های فراخوانی گره Plugin، و مدیریت فرمان محلی گره عبور می‌کنند.

    Pluginهایی که فرمان‌های خطرناک میزبان گره را ارائه می‌کنند، باید یک سیاست فراخوانی گره را با `api.registerNodeInvokePolicy(...)` ثبت کنند. این سیاست پس از بررسی‌های فهرست مجاز فرمان و پیش از ارسال فرمان به گره در Gateway اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح‌بالاتر Plugin مسیر اعمال یکسانی را به اشتراک می‌گذارند.

    <Warning>
    فیلد اختیاری `scopes` محدوده‌های اپراتور Gateway را برای فراخوانی درخواست می‌کند. OpenClaw فقط برای Pluginهای همراه و نصب‌های رسمی مورد اعتماد Plugin به آن احترام می‌گذارد؛ درخواست‌های دیگر Pluginها فراخوانی را ارتقا نمی‌دهند. فقط زمانی از آن استفاده کنید که یک Plugin مورد اعتماد باید فرمان گره را با محدوده سخت‌گیرانه‌تر Gateway، مانند `operator.admin`، فراخوانی کند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک زمان اجرای جریان وظیفه را به یک کلید نشست موجود OpenClaw یا زمینه ابزار مورد اعتماد متصل کنید، سپس جریان‌های وظیفه را بدون ارسال مالک در هر فراخوانی ایجاد و مدیریت کنید.

    جریان وظیفه وضعیت پایدار گردش‌کار چندمرحله‌ای را ردیابی می‌کند. زمان‌بند نیست:
    برای بیدارباش‌های آینده از Cron یا `api.session.workflow.scheduleSessionTurn(...)` استفاده کنید، سپس وقتی آن کار به وضعیت جریان، وظایف فرزند، انتظارها یا لغو نیاز دارد، از نوبت زمان‌بندی‌شده از `managedFlows` استفاده کنید.

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

    وقتی از لایه اتصال خودتان یک کلید نشست مورد اعتماد OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از ورودی خام کاربر اتصال برقرار نکنید.

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

    وقتی هیچ خروجی تولید نشود (برای مثال ورودی رد شده باشد)، `{ text: undefined }` را برمی‌گرداند.

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
    جستجوی وب.

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
    عکس فوری پیکربندی فعلی زمان اجرا و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که از قبل به مسیر فراخوانی فعال ارسال شده است؛ فقط زمانی از
    `current()` استفاده کنید که گرداننده مستقیما به عکس فوری فرایند نیاز دارد.

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
    Gateway ثبت می‌کند.

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

    `runCommandWithTimeout(...)`، `stdout` و `stderr` ضبط‌شده، شمارش‌های اختیاری
    کوتاه‌سازی، `code`، `signal`، `killed`، `termination` و
    `noOutputTimedOut` را برمی‌گرداند. نتایج مهلت زمانی و مهلت زمانی بدون خروجی، وقتی فرایند فرزند کد خروج غیرصفر ارائه نکند، `code: 124`
    را گزارش می‌کنند. خروج‌های سیگنال غیرمرتبط با مهلت زمانی همچنان می‌توانند `code: null` برگردانند، بنابراین برای تفکیک علت‌های مهلت زمانی از `termination` و
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
    ثبت گزارش.

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
    تشخیص مسیر دایرکتوری وضعیت و ذخیره‌سازی کلیددار پشتیبانی‌شده با SQLite.

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

    ذخیره‌گاه‌های کلیددار پس از راه‌اندازی‌های دوباره باقی می‌مانند و با شناسه Plugin مقید به زمان اجرا ایزوله می‌شوند. برای ادعاهای حذف تکرار اتمیک از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد `true` برمی‌گرداند، یا وقتی یک مقدار زنده از قبل وجود داشته باشد، بدون بازنویسی مقدار، زمان ایجاد، یا TTL آن، `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر فضای نام، ۶٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON کمتر از ۶۴KB، و انقضای اختیاری TTL. وقتی نوشتن از سقف ردیف‌های Plugin فراتر برود، زمان اجرا ممکن است قدیمی‌ترین ردیف‌های زنده را از فضای نامی که در آن نوشته می‌شود حذف کند؛ فضاهای نام هم‌سطح برای آن نوشتن حذف نمی‌شوند، و اگر فضای نام نتواند ردیف‌های کافی آزاد کند، نوشتن همچنان شکست می‌خورد.

    <Warning>
    در این انتشار فقط Pluginهای همراه‌شده.
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
    کمک‌کننده‌های زمان اجرای ویژه کانال (وقتی یک Plugin کانال بارگذاری شده باشد در دسترس است).

    `api.runtime.channel.media` سطح ترجیحی برای دانلود و ذخیره رسانه کانال است:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    وقتی یک URL راه دور باید به رسانه OpenClaw تبدیل شود، از `saveRemoteMedia(...)` استفاده کنید. وقتی Plugin از قبل یک `Response` را با احراز هویت، تغییر مسیر، یا مدیریت فهرست مجاز متعلق به Plugin واکشی کرده است، از `saveResponseMedia(...)` استفاده کنید. فقط وقتی Plugin برای بازرسی، تبدیل، رمزگشایی، یا بارگذاری دوباره به بایت‌های خام نیاز دارد از `readRemoteMediaBuffer(...)` استفاده کنید. `fetchRemoteMedia(...)` همچنان یک نام مستعار سازگاری منسوخ برای `readRemoteMediaBuffer(...)` است.

    `api.runtime.channel.mentions` سطح مشترک سیاست اشاره ورودی برای Pluginهای کانال همراه‌شده‌ای است که از تزریق زمان اجرا استفاده می‌کنند:

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

    `api.runtime.channel.mentions` عمدا کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره ارجاع‌های زمان اجرا

برای ذخیره ارجاع زمان اجرا جهت استفاده بیرون از callback `register` از `createPluginRuntimeStore` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد نامعمولی است که یک Plugin عمدا به بیش از یک جایگاه زمان اجرا نیاز دارد.
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
  عکس فوری پیکربندی فعلی (وقتی در دسترس باشد، عکس فوری فعال زمان اجرای درون‌حافظه‌ای).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی ویژه Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  ثبت‌کننده محدوده‌دار (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/آماده‌سازی پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin حل می‌کند.
</ParamField>

## مرتبط

- [درونیات Plugin](/fa/plugins/architecture) — مدل قابلیت و رجیستری
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع زیرمسیر
