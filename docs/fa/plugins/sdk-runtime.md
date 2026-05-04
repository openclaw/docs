---
read_when:
    - باید کمک‌تابع‌های هسته‌ای را از داخل یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، زیرعامل، گره‌ها)
    - می‌خواهید بفهمید api.runtime چه چیزهایی را در اختیار می‌گذارد
    - شما از کد Plugin به ابزارهای کمکی پیکربندی، عامل یا رسانه دسترسی دارید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرای تزریق‌شده که برای Pluginها در دسترس هستند
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c968f30052ecba4359bdaa9b1c640c1220268933ce01ccef06bcade225b50b7d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجعی برای شیء `api.runtime` که هنگام ثبت‌نام به هر Plugin تزریق می‌شود. به‌جای import مستقیم internals میزبان، از این helperها استفاده کنید.

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که این helperها را در زمینهٔ Pluginهای کانال به‌کار می‌برد.
  </Card>
  <Card title="Pluginهای provider" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که این helperها را در زمینهٔ Pluginهای provider به‌کار می‌برد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن Config

Configای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ برای نمونه `api.config` هنگام ثبت‌نام یا آرگومان `cfg` در callbackهای کانال/provider. این کار باعث می‌شود یک snapshot فرایندی در سراسر کار جریان پیدا کند، به‌جای اینکه config در مسیرهای داغ دوباره parse شود.

از `api.runtime.config.current()` فقط زمانی استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ configای به آن تابع پاس داده نشده است. مقدار برگشتی readonly است؛ پیش از ویرایش clone کنید یا از یک helper جهش استفاده کنید.

Factoryهای ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` را دریافت می‌کنند. در callback `execute` یک ابزار بلندمدت، وقتی config ممکن است پس از ساخته‌شدن تعریف ابزار تغییر کند، از getter استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک policy صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload planner را Gateway بگیرد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی writer می‌داند hot reload امن نیست، یک restart تمیز را اجبار می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` reload/restart خودکار را فقط زمانی سرکوب می‌کند که caller مالک پیگیری بعدی باشد.

Helperهای جهش، `afterWrite` به‌همراه یک خلاصهٔ typed با نام `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا test کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک این است که آن restart واقعاً چه زمانی رخ می‌دهد.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` helperهای سازگاری deprecated تحت `runtime-config-load-write` هستند. آن‌ها در runtime یک‌بار هشدار می‌دهند و در پنجرهٔ migration برای Pluginهای خارجی قدیمی در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن helperها را از subpathهای SDK Plugin import کند، guardهای مرز config شکست می‌خورند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گستردهٔ
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز config استفاده کنید: `config-types` برای
typeها، `plugin-config-runtime` برای assertionهای config ازپیش‌بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای نوشتن‌ها. Testهای Pluginهای bundled باید این subpathهای متمرکز را
مستقیماً mock کنند، نه barrel سازگاری گسترده را.

کد runtime داخلی OpenClaw همین جهت‌گیری را دارد: config را یک‌بار در مرز CLI، Gateway یا فرایند بارگذاری کنید، سپس آن مقدار را عبور دهید. نوشتن‌های جهش موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی config، بر اساس کلید cache تحت مالکیت runtime کلیدگذاری شوند. ماژول‌های runtime بلندمدت برای فراخوانی‌های ambient `loadConfig()` یک scanner با تحمل صفر دارند؛ از یک `cfg` پاس‌داده‌شده، یک `context.getRuntimeConfig()` درخواست، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای provider و کانال باید از snapshot فعال config runtime استفاده کنند، نه snapshot فایل که برای readback یا ویرایش config برگردانده شده است. Snapshotهای فایل مقادیر source مانند markerهای SecretRef را برای UI و نوشتن‌ها حفظ می‌کنند؛ callbackهای provider به نمای runtime resolve‌شده نیاز دارند. وقتی یک helper ممکن است با snapshot source فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentialها از مسیر `selectApplicableRuntimeConfig()` عبور کنید.

## Namespaceهای runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هویت agent، directoryها و مدیریت session.

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

    `runEmbeddedAgent(...)` helper خنثی برای شروع یک turn عادی agent در OpenClaw از کد Plugin است. این helper از همان resolution provider/model و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده توسط کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری باقی می‌ماند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شدهٔ provider/model و default اختیاری را برمی‌گرداند. Pluginهای provider مالک profile مخصوص مدل از طریق hookهای thinking خود هستند، بنابراین Pluginهای ابزار باید به‌جای import یا duplicate کردن فهرست‌های provider، این helper runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high` یا `extra high` را پیش از بررسی در برابر policy resolveشده، به سطح canonical ذخیره‌شده تبدیل می‌کند.

    **Helperهای session store** زیر `api.runtime.agent.session` هستند:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    برای نوشتن‌های runtime، `updateSessionStore(...)` یا `updateSessionStoreEntry(...)` را ترجیح دهید. آن‌ها از مسیر writer مربوط به session-store تحت مالکیت Gateway عبور می‌کنند، updateهای هم‌زمان را حفظ می‌کنند، و از cache داغ دوباره استفاده می‌کنند. `saveSessionStore(...)` برای سازگاری و rewriteهای سبک maintenance آفلاین همچنان در دسترس است.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های model و provider پیش‌فرض:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

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
    Overrideهای model (`provider`/`model`) به opt-in اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در config نیاز دارند. Pluginهای نامطمئن همچنان می‌توانند subagentها را اجرا کنند، اما درخواست‌های override رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند sessionهایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ساخته است. حذف sessionهای دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با scope ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Nodeهای متصل را فهرست کنید و یک command میزبان Node را از کد Plugin بارگذاری‌شده توسط Gateway یا از commandهای CLI Plugin فراخوانی کنید. وقتی یک Plugin مالک کار محلی روی یک دستگاه paired است، برای نمونه یک browser یا audio bridge روی Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در commandهای CLI Plugin، این runtime Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین commandهایی مانند `openclaw googlemeet recover-tab` می‌توانند Nodeهای paired را از terminal inspect کنند. Commandهای Node همچنان از مسیر pairing عادی Node در Gateway، allowlistهای command، policyهای node-invoke Plugin، و handling command محلی Node عبور می‌کنند.

    Pluginهایی که commandهای خطرناک میزبان Node را expose می‌کنند باید یک policy node-invoke با `api.registerNodeInvokePolicy(...)` ثبت کنند. این policy در Gateway پس از checkهای allowlist command و پیش از forward شدن command به Node اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح بالاتر Plugin همان مسیر enforcement را share می‌کنند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime جریان وظیفه را به یک کلید session موجود OpenClaw یا context ابزار trusted bind کنید، سپس بدون پاس دادن owner در هر فراخوانی، جریان‌های وظیفه را بسازید و مدیریت کنید.

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

    وقتی از لایهٔ binding خودتان یک کلید session trusted در OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از raw user input bind نکنید.

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

    از پیکربندی core `messages.tts` و انتخاب provider استفاده می‌کند. بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند.

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
    ```

    وقتی هیچ خروجی تولید نشود، مقدار `{ text: undefined }` را برمی‌گرداند؛ برای مثال ورودی نادیده گرفته شده باشد.

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
    نمایه پیکربندی runtime فعلی و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از
    `current()` استفاده کنید که handler مستقیماً به نمایه فرایند نیاز دارد.

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
    تعیین احراز هویت مدل و provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    تعیین دایرکتوری state و فضای ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    storeهای کلیددار پس از راه‌اندازی مجدد هم باقی می‌مانند و بر اساس شناسه Plugin متصل به runtime ایزوله می‌شوند. برای ادعاهای اتمیک حذف موارد تکراری از `registerIfAbsent(...)` استفاده کنید: وقتی کلید وجود نداشته یا منقضی شده و ثبت شده باشد، `true` برمی‌گرداند؛ یا وقتی مقدار زنده‌ای از قبل وجود داشته باشد، بدون بازنویسی مقدار، زمان ایجاد، یا TTL آن، `false` برمی‌گرداند. محدودیت‌ها: `maxEntries` برای هر namespace، ۱٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON کمتر از ۶۴KB، و انقضای اختیاری TTL.

    <Warning>
    در این انتشار فقط Pluginهای همراه‌شده پشتیبانی می‌شوند.
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
    helperهای runtime مخصوص کانال، وقتی Plugin کانال بارگذاری شده باشد.

    `api.runtime.channel.mentions` سطح مشترک سیاست mention ورودی برای Pluginهای کانال همراه‌شده‌ای است که از تزریق runtime استفاده می‌کنند:

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

    helperهای mention موجود:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمداً helperهای سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض استفاده قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره‌سازی ارجاع‌های runtime

از `createPluginRuntimeStore` برای ذخیره ارجاع runtime جهت استفاده بیرون از callback `register` استفاده کنید:

<Steps>
  <Step title="ایجاد store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="اتصال به نقطه ورود">
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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد غیرمعمولی است که یک Plugin عمداً به بیش از یک اسلات runtime نیاز دارد.
</Note>

## فیلدهای سطح بالای دیگر `api`

فراتر از `api.runtime`، شیء API این موارد را نیز فراهم می‌کند:

<ParamField path="api.id" type="string">
  شناسه Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  نام نمایشی Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  نمایه پیکربندی فعلی، وقتی در دسترس باشد نمایه فعال runtime درون حافظه.
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger محدود به دامنه (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک راه‌اندازی/تنظیم پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin تعیین می‌کند.
</ParamField>

## مرتبط

- [درونیات Plugin](/fa/plugins/architecture) — مدل قابلیت و registry
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع subpath
