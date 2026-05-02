---
read_when:
    - باید کمک‌کننده‌های هسته‌ای را از یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، زیرعامل، گره‌ها)
    - می‌خواهید بدانید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - شما از کد Plugin به ابزارهای کمکی پیکربندی، عامل یا رسانه دسترسی دارید
sidebarTitle: Runtime helpers
summary: api.runtime -- کمک‌کننده‌های زمان اجرای تزریق‌شده که برای Pluginها در دسترس‌اند
title: کمک‌رسان‌های زمان اجرای Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26df37a2ad0dcd29648e382eb579b6892068af4dea1c47460cfd379458a8081c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت در هر Plugin تزریق می‌شود. به‌جای import مستقیم داخلی‌های میزبان، از این helperها استفاده کنید.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گامی که این helperها را در زمینهٔ Channel plugins به کار می‌برد.
  </Card>
  <Card title="Provider plugins" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گامی که این helperها را در زمینهٔ Provider plugins به کار می‌برد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن Config

Configای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت یا آرگومان `cfg` در callbackهای channel/provider. این کار باعث می‌شود به‌جای parse دوبارهٔ config در مسیرهای داغ، یک snapshot فرایند در کل کار جریان داشته باشد.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ configای به آن تابع پاس داده نشده است. مقدار برگشتی readonly است؛ پیش از ویرایش clone بگیرید یا از یک helper جهش استفاده کنید.

Factoryهای tool مقدار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` را دریافت می‌کنند. وقتی config ممکن است پس از ایجاد تعریف tool تغییر کند، داخل callback بلندمدت `execute` آن tool از getter استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر write باید یک policy صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` اجازه می‌دهد تصمیم reload planner را gateway بگیرد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی writer می‌داند hot reload ناامن است، یک restart تمیز را اجبار می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` reload/restart خودکار را فقط وقتی سرکوب می‌کند که caller پیگیری بعدی را خودش بر عهده دارد.

Helperهای جهش، `afterWrite` به‌علاوهٔ خلاصهٔ typed شدهٔ `followUp` را برمی‌گردانند تا callerها بتوانند log کنند یا test کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک زمان واقعی رخ‌دادن آن restart است.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` helperهای سازگاری deprecated زیر `runtime-config-load-write` هستند. آن‌ها در runtime یک‌بار warn می‌کنند و در بازهٔ مهاجرت برای Pluginهای خارجی قدیمی در دسترس می‌مانند. Pluginهای bundled نباید از آن‌ها استفاده کنند؛ اگر کد Plugin آن‌ها را فراخوانی کند یا آن helperها را از subpathهای plugin SDK import کند، guardهای مرز config fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گستردهٔ
`openclaw/plugin-sdk/config-runtime` از subpathهای متمرکز config استفاده کنید: `config-types` برای
typeها، `plugin-config-runtime` برای assertionهای config ازپیش‌بارگذاری‌شده و lookup
entry مربوط به Plugin، `runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای writeها. Testهای Pluginهای bundled باید این subpathهای متمرکز
را مستقیما mock کنند، نه barrel سازگاری گسترده را.

کد داخلی runtime در OpenClaw همین جهت را دارد: config را یک‌بار در مرز CLI، gateway، یا process بارگذاری کنید، سپس همان مقدار را عبور دهید. writeهای جهش موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی config، بر اساس cache key متعلق به runtime key شوند. Moduleهای runtime بلندمدت برای فراخوانی‌های محیطی `loadConfig()` scanner با تحمل صفر دارند؛ از `cfg` پاس‌داده‌شده، `context.getRuntimeConfig()` در request، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای Provider و channel باید از snapshot فعال runtime config استفاده کنند، نه snapshot فایل که برای readback یا ویرایش config برگردانده شده است. Snapshotهای فایل، مقدارهای source مانند markerهای SecretRef را برای UI و writeها حفظ می‌کنند؛ callbackهای provider به نمای runtime resolve‌شده نیاز دارند. وقتی helper ممکن است با snapshot فعال source یا snapshot فعال runtime فراخوانی شود، پیش از خواندن credentialها از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

## Namespaceهای Runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هویت Agent، directoryها، و مدیریت session.

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

    `runEmbeddedAgent(...)` helper خنثی برای شروع یک turn عادی OpenClaw agent از کد Plugin است. از همان resolution مربوط به provider/model و انتخاب agent-harness استفاده می‌کند که replyهای channel-triggered استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری باقی می‌ماند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده و default اختیاری provider/model را برمی‌گرداند. Provider plugins مالک profile مخصوص model از طریق hookهای thinking خود هستند، بنابراین tool plugins باید به‌جای import یا تکرار فهرست‌های provider، این helper runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی در برابر policy resolve‌شده، به سطح ذخیره‌شدهٔ canonical تبدیل می‌کند.

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

    برای writeهای runtime، `updateSessionStore(...)` یا `updateSessionStoreEntry(...)` را ترجیح دهید. آن‌ها از مسیر writer مربوط به session-store که متعلق به Gateway است عبور می‌کنند، updateهای هم‌زمان را حفظ می‌کنند، و cache داغ را دوباره استفاده می‌کنند. `saveSessionStore(...)` برای سازگاری و rewriteهای سبک maintenance آفلاین همچنان در دسترس است.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default model و provider:

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
    Overrideهای model (`provider`/`model`) به opt-in اپراتور از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در config نیاز دارند. Pluginهای غیرقابل‌اعتماد همچنان می‌توانند subagent اجرا کنند، اما درخواست‌های override رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند sessionهایی را حذف کند که همان Plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است. حذف sessionهای دلخواه کاربر یا اپراتور همچنان به request با scope ادمین در Gateway نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    nodeهای متصل را فهرست کنید و یک command میزبانی‌شده روی node را از کد Plugin بارگذاری‌شده توسط Gateway یا از commandهای CLI مربوط به Plugin فراخوانی کنید. وقتی Plugin مالک کار محلی روی یک دستگاه paired است، برای مثال browser یا audio bridge روی Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در commandهای CLI مربوط به Plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین commandهایی مانند `openclaw googlemeet recover-tab` می‌توانند nodeهای paired را از terminal بررسی کنند. Commandهای node همچنان از مسیر pairing عادی node در Gateway، allowlistهای command، policyهای node-invoke مربوط به Plugin، و handling محلی command روی node عبور می‌کنند.

    Pluginهایی که commandهای خطرناک node-host را expose می‌کنند باید با `api.registerNodeInvokePolicy(...)` یک policy مربوط به node-invoke ثبت کنند. این policy در Gateway پس از checkهای allowlist command و پیش از forward شدن command به node اجرا می‌شود، بنابراین فراخوانی‌های مستقیم `node.invoke` و toolهای سطح بالاتر Plugin از همان مسیر enforcement مشترک استفاده می‌کنند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime مربوط به Task Flow را به یک session key موجود OpenClaw یا context قابل‌اعتماد tool bind کنید، سپس بدون پاس‌دادن owner در هر فراخوانی، Task Flowها را ایجاد و مدیریت کنید.

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

    وقتی از لایهٔ binding خودتان یک session key قابل‌اعتماد OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از input خام کاربر bind نکنید.

  </Accordion>
  <Accordion title="api.runtime.tts">
    synthesis متن به گفتار.

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

    از configuration اصلی `messages.tts` و selection مربوط به provider استفاده می‌کند. audio buffer نوع PCM + sample rate برمی‌گرداند.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحلیل image، audio، و video.

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

    وقتی هیچ خروجی تولید نمی‌شود (مثلاً ورودی نادیده گرفته‌شده)، `{ text: undefined }` را برمی‌گرداند.

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
    اسنپ‌شات پیکربندی فعلی محیط اجرا و نوشتن‌های تراکنشی پیکربندی. پیکربندی‌ای را ترجیح دهید
    که پیش‌تر به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از
    `current()` استفاده کنید که هندلر مستقیماً به اسنپ‌شات فرایند نیاز دارد.

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
    رفع احراز هویت مدل و ارائه‌دهنده.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    رفع مسیر دایرکتوری وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌سازهای کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و با شناسه Plugin مقید به محیط اجرا ایزوله می‌شوند. محدودیت‌ها: `maxEntries` برای هر فضای نام، ۱٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON زیر ۶۴KB، و انقضای TTL اختیاری.

    <Warning>
    در این نسخه فقط Pluginهای همراه.
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
    کمک‌کننده‌های محیط اجرای مخصوص کانال (وقتی یک Plugin کانال بارگذاری شده باشد در دسترس است).

    `api.runtime.channel.mentions` سطح مشترک سیاست mention ورودی برای Pluginهای کانال همراهی است که از تزریق محیط اجرا استفاده می‌کنند:

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

    `api.runtime.channel.mentions` عمداً کمک‌کننده‌های سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض نمی‌گذارد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره‌سازی ارجاع‌های محیط اجرا

از `createPluginRuntimeStore` برای ذخیره‌کردن ارجاع محیط اجرا جهت استفاده بیرون از callbackِ `register` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. شکل سطح پایین‌تر `key` برای موارد نامتعارفی است که یک Plugin عمداً به بیش از یک اسلات محیط اجرا نیاز دارد.
</Note>

## سایر فیلدهای سطح بالای `api`

فراتر از `api.runtime`، شیء API این موارد را نیز فراهم می‌کند:

<ParamField path="api.id" type="string">
  شناسه Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  نام نمایشی Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  اسنپ‌شات پیکربندی فعلی (در صورت دسترس بودن، اسنپ‌شات فعالِ محیط اجرای درون‌حافظه‌ای).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی مخصوص Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  لاگر scoped (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبکِ راه‌اندازی/تنظیم پیش از entry کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  یک مسیر را نسبت به ریشه Plugin رفع می‌کند.
</ParamField>

## مرتبط

- [داخلی‌های Plugin](/fa/plugins/architecture) — مدل قابلیت و رجیستری
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع زیربخش
