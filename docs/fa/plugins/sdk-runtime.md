---
read_when:
    - باید توابع کمکی هسته را از یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، عامل فرعی، گره‌ها)
    - می‌خواهید بدانید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - از کد Plugin به ابزارهای کمکی پیکربندی، عامل یا رسانه دسترسی پیدا می‌کنید
sidebarTitle: Runtime helpers
summary: api.runtime -- توابع کمکی زمان اجرای تزریق‌شده که در دسترس Pluginها هستند
title: کمک‌کننده‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-04-30T09:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت در هر Plugin تزریق می‌شود. از این کمک‌تابع‌ها به‌جای وارد کردن مستقیم اجزای داخلی میزبان استفاده کنید.

<CardGroup cols={2}>
  <Card title="Pluginهای کانال" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که استفاده از این کمک‌تابع‌ها را در بستر Pluginهای کانال نشان می‌دهد.
  </Card>
  <Card title="Pluginهای ارائه‌دهنده" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که استفاده از این کمک‌تابع‌ها را در بستر Pluginهای ارائه‌دهنده نشان می‌دهد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت یا آرگومان `cfg` در callbackهای کانال/ارائه‌دهنده. این کار به‌جای بازتجزیه پیکربندی در مسیرهای داغ، یک snapshot فرایند را در سراسر کار جاری نگه می‌دارد.

از `api.runtime.config.current()` فقط وقتی استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار برگشتی فقط‌خواندنی است؛ پیش از ویرایش، آن را clone کنید یا از یک کمک‌تابع mutation استفاده کنید.

factoryهای ابزار، `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` را دریافت می‌کنند. وقتی پیکربندی ممکن است پس از ایجاد تعریف ابزار تغییر کند، از getter داخل callback `execute` یک ابزار بلندمدت استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک سیاست صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم بازبارگذاری Gateway را برنامه‌ریز بگیرد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی نویسنده می‌داند hot reload امن نیست، یک restart تمیز را اجباری می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط وقتی caller مالک پیگیری بعدی است، reload/restart خودکار را سرکوب می‌کند.

کمک‌تابع‌های mutation، `afterWrite` به‌همراه یک خلاصه تایپ‌شده `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا تست کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک این است که آن restart واقعاً چه زمانی رخ می‌دهد.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` کمک‌تابع‌های سازگاری منسوخ‌شده تحت `runtime-config-load-write` هستند. آن‌ها در زمان اجرا یک‌بار هشدار می‌دهند و در بازه مهاجرت برای Pluginهای خارجی قدیمی همچنان در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن کمک‌تابع‌ها را از subpathهای plugin SDK وارد کند، نگهبان‌های مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گسترده
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز پیکربندی استفاده کنید: `config-types` برای
typeها، `plugin-config-runtime` برای assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup ورودی Plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای نوشتن‌ها. تست‌های Pluginهای bundled باید همین subpathهای متمرکز را
مستقیماً mock کنند، نه barrel سازگاری گسترده را.

کد runtime داخلی OpenClaw نیز همین جهت را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway، یا فرایند load کنید، سپس همان مقدار را پاس دهید. نوشتن‌های mutation موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serializing پیکربندی به‌صورت محلی، بر اساس cache key متعلق به runtime key شوند. ماژول‌های runtime بلندمدت برای فراخوانی‌های ambient `loadConfig()` اسکنر zero-tolerance دارند؛ از `cfg` پاس‌داده‌شده، `context.getRuntimeConfig()` درخواست، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای ارائه‌دهنده و کانال باید از snapshot پیکربندی runtime فعال استفاده کنند، نه snapshot فایل که برای readback یا ویرایش پیکربندی برگشته است. snapshotهای فایل مقادیر source مانند markerهای SecretRef را برای UI و نوشتن‌ها حفظ می‌کنند؛ callbackهای ارائه‌دهنده به نمای runtime resolved نیاز دارند. وقتی ممکن است یک کمک‌تابع با snapshot source فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentials آن را از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

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

    `runEmbeddedAgent(...)` کمک‌تابع خنثی برای شروع یک turn معمولی Agent OpenClaw از کد Plugin است. از همان resolution ارائه‌دهنده/مدل و انتخاب agent-harness استفاده می‌کند که replyهای triggerشده از کانال استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری باقی می‌ماند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده و default اختیاری ارائه‌دهنده/مدل را برمی‌گرداند. Pluginهای ارائه‌دهنده از طریق hookهای thinking خود مالک profile خاص مدل هستند، بنابراین Pluginهای ابزار باید به‌جای وارد کردن یا تکرار فهرست‌های ارائه‌دهنده، این کمک‌تابع runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی آن در برابر policy resolved، به سطح stored canonical تبدیل می‌کند.

    **کمک‌تابع‌های session store** زیر `api.runtime.agent.session` هستند:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های پیش‌فرض مدل و ارائه‌دهنده:

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
    overrideهای مدل (`provider`/`model`) به opt-in اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. Pluginهای untrusted همچنان می‌توانند subagent اجرا کنند، اما درخواست‌های override رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند sessionهایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است. حذف sessionهای دلخواه کاربر یا اپراتور همچنان به یک درخواست Gateway با scope ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    nodeهای متصل را فهرست کنید و یک command میزبانی‌شده روی node را از کد Plugin بارگذاری‌شده توسط Gateway یا از commandهای CLI Plugin فراخوانی کنید. وقتی یک Plugin مالک کار محلی روی دستگاه pairشده است، برای مثال یک bridge مرورگر یا audio روی یک Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در commandهای CLI Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین commandهایی مانند `openclaw googlemeet recover-tab` می‌توانند nodeهای pairشده را از terminal inspect کنند. commandهای Node همچنان از مسیر pairing معمول node در Gateway، allowlistهای command، policyهای node-invoke Plugin، و handling command محلی node عبور می‌کنند.

    Pluginهایی که commandهای خطرناک node-host را expose می‌کنند باید با `api.registerNodeInvokePolicy(...)` یک policy node-invoke ثبت کنند. این policy در Gateway پس از بررسی‌های allowlist command و پیش از forward شدن command به node اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و ابزارهای سطح بالاتر Plugin مسیر enforcement یکسانی را share می‌کنند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime Task Flow را به یک session key موجود OpenClaw یا context ابزار trusted bind کنید، سپس بدون پاس دادن owner در هر call، Task Flowها را ایجاد و مدیریت کنید.

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

    وقتی از لایه binding خودتان یک session key معتبر OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از input خام کاربر bind نکنید.

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

    از پیکربندی core `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند. audio buffer PCM + sample rate را برمی‌گرداند.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحلیل تصویر، صدا، و ویدیو.

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

    وقتی هیچ خروجی‌ای تولید نشود، `{ text: undefined }` را برمی‌گرداند (برای مثال ورودی ردشده).

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
    ابزارهای رسانه‌ای سطح پایین.

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
    تصویر لحظه‌ای پیکربندی runtime فعلی و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از `current()` استفاده کنید که handler مستقیما به تصویر لحظه‌ای فرایند نیاز داشته باشد.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` و `replaceConfigFile(...)` مقدار `followUp` را برمی‌گردانند، برای مثال `{ mode: "restart", requiresRestart: true, reason }`، که قصد نویسنده را بدون گرفتن کنترل راه‌اندازی مجدد از Gateway ثبت می‌کند.

  </Accordion>
  <Accordion title="api.runtime.system">
    ابزارهای سطح سیستم.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    حل مسیر پوشه وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌گاه‌های کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و بر اساس شناسه Plugin وابسته به runtime ایزوله می‌شوند. محدودیت‌ها: `maxEntries` برای هر namespace، ۱٬۰۰۰ ردیف زنده برای هر Plugin، مقادیر JSON کمتر از ۶۴KB، و انقضای اختیاری TTL.

    <Warning>
    در این انتشار فقط Pluginهای بسته‌بندی‌شده.
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
    helperهای runtime مخصوص کانال (وقتی یک Plugin کانال بارگذاری شده باشد در دسترس است).

    `api.runtime.channel.mentions` سطح مشترک سیاست mention ورودی برای Pluginهای کانال بسته‌بندی‌شده‌ای است که از تزریق runtime استفاده می‌کنند:

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

    helperهای mention در دسترس:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمدا helperهای سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض استفاده قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد غیرمعمولی است که در آن‌ها یک Plugin عمدا به بیش از یک شیار runtime نیاز دارد.
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
  تصویر لحظه‌ای پیکربندی فعلی (تصویر لحظه‌ای runtime درون‌حافظه‌ای فعال، وقتی در دسترس باشد).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger محدوده‌دار (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک startup/setup پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حل یک مسیر نسبت به ریشه Plugin.
</ParamField>

## مرتبط

- [داخلیات Plugin](/fa/plugins/architecture) — مدل قابلیت و registry
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع subpath
