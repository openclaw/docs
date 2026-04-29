---
read_when:
    - باید کمک‌توابع هسته را از یک Plugin فراخوانی کنید (TTS، STT، تولید تصویر، جست‌وجوی وب، عامل فرعی، گره‌ها)
    - می‌خواهید بدانید api.runtime چه چیزهایی را در دسترس قرار می‌دهد
    - شما از کد Plugin به کمک‌گرهای پیکربندی، عامل یا رسانه دسترسی پیدا می‌کنید
sidebarTitle: Runtime helpers
summary: api.runtime -- راهنماهای زمان اجرای تزریق‌شده که در دسترس Pluginها هستند
title: توابع کمکی زمان اجرای Plugin
x-i18n:
    generated_at: "2026-04-29T23:19:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 399e2433e272fe30e7451690a64826df8e30a064269b8d9a7aa2dd2b0c5688b8
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع شیء `api.runtime` که هنگام ثبت در هر plugin تزریق می‌شود. به‌جای import مستقیم داخلی‌های میزبان، از این helperها استفاده کنید.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/fa/plugins/sdk-channel-plugins">
    راهنمای گام‌به‌گام که این helperها را در بستر channel plugins به‌کار می‌گیرد.
  </Card>
  <Card title="Provider plugins" href="/fa/plugins/sdk-provider-plugins">
    راهنمای گام‌به‌گام که این helperها را در بستر provider plugins به‌کار می‌گیرد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## بارگذاری و نوشتن پیکربندی

پیکربندی‌ای را ترجیح دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است، برای مثال `api.config` هنگام ثبت یا آرگومان `cfg` در callbackهای channel/provider. این کار باعث می‌شود به‌جای parse دوباره پیکربندی در مسیرهای داغ، یک snapshot فرایند در سراسر کار جریان داشته باشد.

فقط زمانی از `api.runtime.config.current()` استفاده کنید که یک handler بلندمدت به snapshot فعلی فرایند نیاز دارد و هیچ پیکربندی‌ای به آن تابع پاس داده نشده است. مقدار بازگشتی readonly است؛ پیش از ویرایش، آن را clone کنید یا از یک helper جهش استفاده کنید.

factoryهای ابزار `ctx.runtimeConfig` به‌همراه `ctx.getRuntimeConfig()` دریافت می‌کنند. وقتی پیکربندی می‌تواند بعد از ایجاد تعریف ابزار تغییر کند، getter را داخل callback `execute` یک ابزار بلندمدت استفاده کنید.

تغییرات را با `api.runtime.config.mutateConfigFile(...)` یا `api.runtime.config.replaceConfigFile(...)` پایدار کنید. هر نوشتن باید یک policy صریح `afterWrite` انتخاب کند:

- `afterWrite: { mode: "auto" }` تصمیم reload را به Gateway reload planner می‌سپارد.
- `afterWrite: { mode: "restart", reason: "..." }` وقتی writer می‌داند hot reload ناامن است، restart تمیز را اجبار می‌کند.
- `afterWrite: { mode: "none", reason: "..." }` فقط وقتی caller مالک پیگیری بعدی است، reload/restart خودکار را سرکوب می‌کند.

helperهای جهش `afterWrite` به‌همراه یک خلاصه typed به نام `followUp` برمی‌گردانند تا callerها بتوانند log کنند یا تست کنند که آیا restart درخواست کرده‌اند یا نه. Gateway همچنان مالک این است که آن restart در عمل چه زمانی رخ دهد.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` helperهای سازگاری منسوخ‌شده زیر `runtime-config-load-write` هستند. آن‌ها در زمان runtime یک‌بار هشدار می‌دهند و برای plugins خارجی قدیمی در طول بازه مهاجرت در دسترس می‌مانند. plugins همراه نباید از آن‌ها استفاده کنند؛ اگر کد plugin آن‌ها را فراخوانی کند یا آن helperها را از زیرمسیرهای plugin SDK import کند، guardهای مرز پیکربندی fail می‌شوند.

برای importهای مستقیم SDK، به‌جای barrel سازگاری گسترده
`openclaw/plugin-sdk/config-runtime` از زیرمسیرهای متمرکز پیکربندی استفاده کنید: `config-types` برای
types، `plugin-config-runtime` برای assertionهای پیکربندی ازقبل‌بارگذاری‌شده و lookup ورودی plugin،
`runtime-config-snapshot` برای snapshotهای فعلی فرایند، و
`config-mutation` برای نوشتن‌ها. تست‌های plugin همراه باید این زیرمسیرهای متمرکز را
مستقیماً mock کنند، به‌جای آنکه barrel سازگاری گسترده را mock کنند.

کد runtime داخلی OpenClaw نیز همین جهت را دارد: پیکربندی را یک‌بار در مرز CLI، Gateway یا فرایند load کنید، سپس آن مقدار را پاس دهید. نوشتن‌های جهش موفق، snapshot runtime فرایند را refresh می‌کنند و revision داخلی آن را جلو می‌برند؛ cacheهای بلندمدت باید به‌جای serialize کردن محلی پیکربندی، بر اساس کلید cache متعلق به runtime key شوند. ماژول‌های runtime بلندمدت برای فراخوانی‌های محیطی `loadConfig()` اسکنر zero-tolerance دارند؛ از یک `cfg` پاس‌داده‌شده، یک request `context.getRuntimeConfig()`، یا `getRuntimeConfig()` در یک مرز صریح فرایند استفاده کنید.

مسیرهای اجرای provider و channel باید از snapshot پیکربندی runtime فعال استفاده کنند، نه snapshot فایل که برای readback یا ویرایش پیکربندی برگردانده شده است. snapshotهای فایل مقادیر منبع مانند markerهای SecretRef را برای UI و نوشتن‌ها حفظ می‌کنند؛ callbackهای provider به نمای runtime حل‌شده نیاز دارند. وقتی ممکن است یک helper با snapshot منبع فعال یا snapshot runtime فعال فراخوانی شود، پیش از خواندن credentials از مسیر `selectApplicableRuntimeConfig()` عبور دهید.

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

    `runEmbeddedAgent(...)` helper خنثی برای شروع یک turn عادی OpenClaw agent از کد plugin است. از همان provider/model resolution و انتخاب agent-harness استفاده می‌کند که replyهای channel-triggered استفاده می‌کنند.

    `runEmbeddedPiAgent(...)` به‌عنوان alias سازگاری باقی می‌ماند.

    `resolveThinkingPolicy(...)` سطح‌های thinking پشتیبانی‌شده provider/model و default اختیاری را برمی‌گرداند. provider plugins مالک profile ویژه model از طریق hookهای thinking خود هستند، بنابراین tool plugins باید به‌جای import یا تکرار فهرست‌های provider، این helper runtime را فراخوانی کنند.

    `normalizeThinkingLevel(...)` متن کاربر مانند `on`، `x-high`، یا `extra high` را پیش از بررسی در برابر policy حل‌شده، به سطح ذخیره‌شده canonical تبدیل می‌کند.

    helperهای **Session store** زیر `api.runtime.agent.session` هستند:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثابت‌های default model و provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    اجرای subagentهای پس‌زمینه را launch و manage کنید.

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
    overrideهای model (`provider`/`model`) به opt-in operator از طریق `plugins.entries.<id>.subagent.allowModelOverride: true` در پیکربندی نیاز دارند. plugins غیرقابل‌اعتماد همچنان می‌توانند subagent اجرا کنند، اما درخواست‌های override رد می‌شوند.
    </Warning>

    `deleteSession(...)` می‌تواند sessionهایی را حذف کند که همان plugin از طریق `api.runtime.subagent.run(...)` ایجاد کرده است. حذف sessionهای دلخواه کاربر یا operator همچنان به درخواست Gateway با scope ادمین نیاز دارد.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    nodeهای متصل را فهرست کنید و از کد plugin بارگذاری‌شده در Gateway یا از فرمان‌های CLI plugin، یک فرمان node-host را invoke کنید. وقتی یک plugin مالک کار محلی روی یک دستگاه pair‌شده است، برای مثال یک browser یا audio bridge روی یک Mac دیگر، از این استفاده کنید.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway این runtime درون‌فرایندی است. در فرمان‌های CLI plugin، Gateway پیکربندی‌شده را از طریق RPC فراخوانی می‌کند، بنابراین فرمان‌هایی مانند `openclaw googlemeet recover-tab` می‌توانند nodeهای pair‌شده را از terminal inspect کنند. فرمان‌های Node همچنان از مسیر pairing عادی node در Gateway، allowlistهای فرمان، و handling فرمان محلی node عبور می‌کنند.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    یک runtime مربوط به Task Flow را به یک کلید session موجود OpenClaw یا context ابزار مورداعتماد bind کنید، سپس بدون پاس دادن owner در هر فراخوانی، Task Flows را ایجاد و manage کنید.

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

    وقتی از لایه binding خود یک کلید session مورداعتماد OpenClaw دارید، از `bindSession({ sessionKey, requesterOrigin })` استفاده کنید. از ورودی خام کاربر bind نکنید.

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

    از پیکربندی core `messages.tts` و انتخاب provider استفاده می‌کند. buffer صوتی PCM + sample rate برمی‌گرداند.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحلیل تصویر، audio، و video.

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

    وقتی هیچ خروجی‌ای تولید نشود (مثلاً ورودی skip شده باشد)، `{ text: undefined }` برمی‌گرداند.

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
    عکس فوری پیکربندی زمان اجرا و نوشتن‌های تراکنشی پیکربندی. ترجیح دهید از
    پیکربندی‌ای استفاده کنید که از قبل به مسیر فراخوانی فعال پاس داده شده است؛ فقط زمانی از
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
    که نیت نویسنده را بدون گرفتن کنترل راه‌اندازی مجدد از
    gateway ثبت می‌کند.

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
    تفکیک احراز هویت مدل و ارائه‌دهنده.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    تفکیک پوشه وضعیت و ذخیره‌سازی کلیددار مبتنی بر SQLite.

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

    ذخیره‌گاه‌های کلیددار پس از راه‌اندازی مجدد باقی می‌مانند و با شناسه Plugin متصل به زمان اجرا ایزوله می‌شوند. محدودیت‌ها: `maxEntries` برای هر namespace، ۱٬۰۰۰ ردیف زنده برای هر Plugin، مقدارهای JSON کمتر از 64KB، و انقضای اختیاری TTL.

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
    helperهای زمان اجرای ویژه کانال (وقتی یک Plugin کانال بارگذاری شده باشد، در دسترس هستند).

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

    helperهای mention موجود:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` عمداً helperهای سازگاری قدیمی‌تر `resolveMentionGating*` را در معرض قرار نمی‌دهد. مسیر نرمال‌شده `{ facts, policy }` را ترجیح دهید.

  </Accordion>
</AccordionGroup>

## ذخیره ارجاع‌های زمان اجرا

برای ذخیره ارجاع زمان اجرا جهت استفاده خارج از callback مربوط به `register` از `createPluginRuntimeStore` استفاده کنید:

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
برای هویت runtime-store، `pluginId` را ترجیح دهید. فرم سطح پایین‌تر `key` برای موارد نامعمولی است که یک Plugin عمداً به بیش از یک اسلات زمان اجرا نیاز دارد.
</Note>

## سایر فیلدهای سطح بالای `api`

فراتر از `api.runtime`، شیء API همچنین این موارد را فراهم می‌کند:

<ParamField path="api.id" type="string">
  شناسه Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  نام نمایشی Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  عکس فوری پیکربندی فعلی (در صورت موجود بودن، عکس فوری فعال زمان اجرا در حافظه).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  پیکربندی ویژه Plugin از `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger محدوده‌دار (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  حالت بارگذاری فعلی؛ `"setup-runtime"` پنجره سبک‌وزن راه‌اندازی/تنظیم پیش از ورود کامل است.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  تفکیک یک مسیر نسبت به ریشه Plugin.
</ParamField>

## مرتبط

- [درونی‌های Plugin](/fa/plugins/architecture) — مدل قابلیت و registry
- [نقاط ورود SDK](/fa/plugins/sdk-entrypoints) — گزینه‌های `definePluginEntry`
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع subpath
