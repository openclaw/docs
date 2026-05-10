---
read_when:
    - باید توابع کمکی هسته را از یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جستجوی وب، زیرعامل، گره‌ها)
    - می‌خواهید بدانید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - شما از کد Plugin به تابع‌های کمکی پیکربندی، عامل یا رسانه دسترسی پیدا می‌کنید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرای تزریق‌شده در دسترس Pluginها
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-05-10T19:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجعی برای شیء `api.runtime` که هنگام ثبت در هر Plugin تزریق می‌شود. از این کمک‌کننده‌ها به‌جای import مستقیم اجزای داخلی میزبان استفاده کنید.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که از این کمک‌کننده‌ها در بستر Pluginهای کانال استفاده می‌کند.
  </Card>
  <Card title="Provider plugins" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که از این کمک‌کننده‌ها در بستر Pluginهای ارائه‌دهنده استفاده می‌کند.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ برای مثال `api.config` هنگام ثبت یا آرگومان `cfg` در callbackهای کانال/ارائه‌دهنده. این کار باعث می‌شود یک snapshot فرایندی در طول کار جریان داشته باشد، به‌جای اینکه پیکربندی در مسیرهای داغ دوباره parse شود.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار برگشتی readonly است؛ قبل از ویرایش آن را clone کنید یا از یک کمک‌کننده mutation استفاده کنید.

factoryهای ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` دریافت می‌کنند. وقتی پیکربندی می‌تواند پس از ایجاد تعریف ابزار تغییر کند، از getter داخل callback `execute` یک ابزار بلندمدت استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر write باید یک سیاست صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload Gateway را planner بگیرد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی writer می‌داند hot reload ناامن است، یک restart تمیز را اجبار می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط زمانی reload/restart خودکار را سرکوب می‌کند که caller مالک پیگیری بعدی باشد.

کمک‌کننده‌های mutation مقدار `afterWrite` به‌همراه یک خلاصه typed با نام `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا تست کنند که آیا restart درخواست کرده‌اند یا نه. همچنان Gateway مالک این است که آن restart واقعاً چه زمانی رخ دهد.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` کمک‌کننده‌های سازگاری منسوخ‌شده تحت `runtime-config-load-write` هستند. آن‌ها در زمان اجرا یک‌بار هشدار می‌دهند و در بازه مهاجرت برای Pluginهای خارجی قدیمی در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن کمک‌کننده‌ها را از subpathهای SDK Plugin import کند، guardهای مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گسترده
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز پیکربندی استفاده کنید: `config-contracts` برای
types، `plugin-config-runtime` برای assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای writeها. تست‌های Pluginهای bundled باید این subpathهای متمرکز را مستقیماً mock کنند، به‌جای اینکه barrel سازگاری گسترده را mock کنند.

کد runtime داخلی OpenClaw نیز همین جهت را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway، یا فرایند بارگذاری کنید، سپس آن مقدار را عبور دهید. writeهای mutation موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی پیکربندی، بر اساس کلید cache متعلق به runtime کلیدگذاری شوند. ماژول‌های runtime بلندمدت یک scanner با تحمل صفر برای فراخوانی‌های ambient `loadConfig()` دارند؛ از `cfg` پاس‌داده‌شده، یک `context.getRuntimeConfig()` درخواست، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای ارائه‌دهنده و کانال باید از snapshot پیکربندی runtime فعال استفاده کنند، نه از snapshot فایل که برای readback یا ویرایش پیکربندی برگشته است. snapshotهای فایل مقادیر منبع مانند نشانگرهای SecretRef را برای UI و writeها حفظ می‌کنند؛ callbackهای ارائه‌دهنده به نمای runtime resolveشده نیاز دارند. وقتی ممکن است یک helper با snapshot منبع فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentials از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

## فضاهای نام runtime

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

    `runEmbeddedAgent(...)` کمک‌کننده خنثی برای شروع یک turn معمول agent در OpenClaw از کد Plugin است. از همان resolve کردن provider/model و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری باقی می‌ماند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده provider/model و default اختیاری را برمی‌گرداند. Pluginهای ارائه‌دهنده از طریق hookهای thinking خود مالک profile خاص model هستند، بنابراین Pluginهای ابزار باید به‌جای import یا duplicate کردن فهرست‌های ارائه‌دهنده، این helper runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی آن در برابر policy resolveشده، به سطح ذخیره‌شده canonical تبدیل می‌کند.

    **کمک‌کننده‌های session store** زیر `api.runtime.agent.session` هستند:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    برای writeهای runtime، `updateSessionStore(...)` یا `updateSessionStoreEntry(...)` را ترجیح دهید. آن‌ها از طریق writer session-store متعلق به Gateway مسیریابی می‌شوند، updateهای هم‌زمان را حفظ می‌کنند، و cache داغ را دوباره استفاده می‌کنند. `saveSessionStore(...)` برای سازگاری و rewriteهای سبک نگهداری offline همچنان در دسترس می‌ماند.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default model و provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    یک text completion متعلق به میزبان را بدون import کردن internals ارائه‌دهنده یا
    duplicate کردن آماده‌سازی model/auth/base URL در OpenClaw اجرا کنید.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    این helper از همان مسیر آماده‌سازی simple-completion که runtime
    built-in OpenClaw استفاده می‌کند و snapshot پیکربندی runtime متعلق به میزبان بهره می‌برد. موتورهای context
    یک capability به نام `llm.complete` محدود به session دریافت می‌کنند، بنابراین فراخوانی‌های model از
    agent مربوط به session فعال استفاده می‌کنند و بی‌صدا به agent default fallback نمی‌کنند. نتیجه شامل attribution ارائه‌دهنده/model/agent به‌همراه token نرمال‌شده،
    cache، و usage هزینه تخمینی در صورت در دسترس بودن است.

    <Warning>
    overrideهای model به opt-in اپراتور از طریق `plugins.entries.<id>.llm.allowModelOverride: true` در config نیاز دارند. از `plugins.entries.<id>.llm.allowedModels` برای محدود کردن Pluginهای مورد اعتماد به targetهای canonical مشخص `provider/model` استفاده کنید. completionهای cross-agent به `plugins.entries.<id>.llm.allowAgentIdOverride: true` نیاز دارند.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    runهای subagent پس‌زمینه را launch و manage کنید.

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
    overrideهای model (`provider`/`model`) به opt-in اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در config نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند subagentها را اجرا کنند، اما درخواست‌های override رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند sessionهایی را که همان Plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است حذف کند. حذف sessionهای دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با scope ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Nodeهای متصل را فهرست کنید و یک فرمان node-host را از کد Plugin بارگذاری‌شده توسط Gateway یا از فرمان‌های CLI Plugin فراخوانی کنید. وقتی یک Plugin مالک کار محلی روی دستگاه paired است، برای مثال یک پل مرورگر یا صدا روی Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در فرمان‌های CLI Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند Nodeهای paired را از terminal inspect کنند. فرمان‌های Node همچنان از مسیر pairing عادی Node در Gateway، allowlistهای command، policyهای node-invoke مربوط به Plugin، و handling فرمان محلی Node عبور می‌کنند.

    Pluginهایی که فرمان‌های خطرناک node-host را expose می‌کنند باید یک policy مربوط به node-invoke را با `api.registerNodeInvokePolicy(...)` ثبت کنند. این policy پس از checkهای allowlist فرمان و پیش از forward شدن فرمان به Node در Gateway اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح‌بالای Plugin مسیر enforcement یکسانی را share می‌کنند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime مربوط به Task Flow را به یک کلید session موجود OpenClaw یا context ابزار مورد اعتماد bind کنید، سپس بدون پاس دادن owner در هر فراخوانی، Task Flowها را ایجاد و manage کنید.

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
    ساخت گفتار از متن.

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

    از پیکربندی اصلی `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند. بافر صوتی PCM و نرخ نمونه‌برداری را برمی‌گرداند.

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
    ```

    وقتی خروجی تولید نشود، برای نمونه ورودی نادیده گرفته شده، `{ text: undefined }` را برمی‌گرداند.

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
    عکس فوری پیکربندی زمان اجرا و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از
    `current()` استفاده کنید که هندلر مستقیما به عکس فوری فرایند نیاز دارد.

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
    برمی‌گردانند، برای نمونه `{ mode: "restart", requiresRestart: true, reason }`،
    که قصد نویسنده را ثبت می‌کند بدون اینکه کنترل راه‌اندازی مجدد را از
    Gateway بگیرد.

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
    حل دایرکتوری وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌سازهای کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و با شناسه Plugin متصل به زمان اجرا ایزوله می‌شوند. برای ادعای حذف تکراری اتمیک از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد `true` برمی‌گرداند، یا وقتی یک مقدار زنده از قبل وجود داشته باشد بدون بازنویسی مقدار، زمان ایجاد یا TTL آن `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر namespace، ۱٬۰۰۰ ردیف زنده برای هر Plugin، مقادیر JSON کمتر از ۶۴KB، و انقضای اختیاری TTL.

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
    کمک‌کننده‌های زمان اجرای مختص کانال، زمانی که یک Plugin کانال بارگذاری شده باشد در دسترس‌اند.

    `api.runtime.channel.mentions` سطح مشترک سیاست mention ورودی برای Pluginهای کانال همراه است که از تزریق زمان اجرا استفاده می‌کنند:

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

    کمک‌کننده‌های mention در دسترس:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمدا کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره ارجاع‌های زمان اجرا

برای ذخیره ارجاع زمان اجرا جهت استفاده بیرون از callback مربوط به `register` از `createPluginRuntimeStore` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. فرم سطح پایین‌تر `key` برای موارد نامعمولی است که یک Plugin عمدا به بیش از یک شکاف زمان اجرا نیاز دارد.
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
  عکس فوری پیکربندی فعلی، یعنی عکس فوری فعال زمان اجرا در حافظه، وقتی در دسترس باشد.
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مختص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  لاگر scoped (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک‌وزن راه‌اندازی/آماده‌سازی پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin حل می‌کند.
</ParamField>

## مرتبط

- [درونیات Plugin](/fa/plugins/architecture) — مدل قابلیت و رجیستری
- [نقاط ورودی SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع subpath
