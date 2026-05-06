---
read_when:
    - تحتاج إلى استدعاء الدوال المساعدة الأساسية من Plugin (TTS، STT، إنشاء الصور، البحث في الويب، الوكيل الفرعي، العقد)
    - تريد فهم ما يتيحه api.runtime
    - أنت تصل إلى الدوال المساعدة الخاصة بالتكوين أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة المتاحة لـ Plugins
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل plugin أثناء التسجيل. استخدم هذه المساعدات بدلًا من استيراد داخليات المضيف مباشرة.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ar/plugins/sdk-channel-plugins">
    دليل تفصيلي خطوة بخطوة يستخدم هذه المساعدات ضمن السياق مع plugins القنوات.
  </Card>
  <Card title="Provider plugins" href="/ar/plugins/sdk-provider-plugins">
    دليل تفصيلي خطوة بخطوة يستخدم هذه المساعدات ضمن السياق مع plugins المزوّدين.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل التكوين والكتابة

فضّل التكوين الذي مُرّر بالفعل إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات القناة/المزوّد. هذا يُبقي لقطة عملية واحدة متدفقة عبر العمل بدلًا من إعادة تحليل التكوين في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم يُمرّر أي تكوين إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم مساعد تعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` بالإضافة إلى `ctx.getRuntimeConfig()`. استخدم الجالب داخل استدعاء `execute` لأداة طويلة العمر عندما يمكن أن يتغير التكوين بعد إنشاء تعريف الأداة.

احفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل عملية كتابة سياسة `afterWrite` صريحة:

- `afterWrite: { mode: "auto" }` يترك قرار إعادة التحميل لمخطط Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` يفرض إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- `afterWrite: { mode: "none", reason: "..." }` يمنع إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي إجراء المتابعة.

تعيد مساعدات التعديل `afterWrite` بالإضافة إلى ملخص `followUp` مطبوع حتى يتمكن المستدعون من تسجيل ما إذا كانوا قد طلبوا إعادة تشغيل أو اختباره. يظل Gateway هو مالك توقيت حدوث إعادة التشغيل فعليًا.

`api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` هما مساعدا توافق مهمَلان تحت `runtime-config-load-write`. يُصدران تحذيرًا مرة واحدة في وقت التشغيل، ويظلان متاحين للـ plugins الخارجية القديمة أثناء نافذة الترحيل. يجب ألا تستخدمهما plugins المضمّنة؛ تفشل حراس حدود التكوين إذا استدعى كود plugin هذه المساعدات أو استوردها من المسارات الفرعية لـ plugin SDK.

بالنسبة إلى استيرادات SDK المباشرة، استخدم المسارات الفرعية المركّزة للتكوين بدلًا من حزمة التوافق الواسعة
`openclaw/plugin-sdk/config-runtime`: استخدم `config-types` للأنواع، و`plugin-config-runtime` لتأكيدات التكوين المحمّل مسبقًا والبحث عن مدخل plugin، و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات. يجب أن تحاكي اختبارات plugins المضمّنة هذه المسارات الفرعية المركّزة مباشرة بدلًا من محاكاة حزمة التوافق الواسعة.

يتبع كود وقت تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل التكوين مرة واحدة عند حد CLI أو Gateway أو العملية، ثم مرّر تلك القيمة عبر المسار. تحدّث كتابات التعديل الناجحة لقطة وقت تشغيل العملية وتقدّم مراجعتها الداخلية؛ يجب أن تعتمد ذاكرات التخزين المؤقت طويلة العمر على مفتاح التخزين المؤقت المملوك لوقت التشغيل بدلًا من تسلسل التكوين محليًا. لدى وحدات وقت التشغيل طويلة العمر ماسح بلا تسامح مع استدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` مُمرّرًا، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ المزوّد والقناة لقطة تكوين وقت التشغيل النشطة، لا لقطة ملف مُعادة لقراءة التكوين أو تحريره. تحتفظ لقطات الملف بقيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج استدعاءات المزوّد إلى منظور وقت التشغيل المحلول. عندما يمكن استدعاء مساعد إما بلقطة المصدر النشطة أو لقطة وقت التشغيل النشطة، مرّر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## نطاقات وقت التشغيل

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هوية الوكيل، والأدلة، وإدارة الجلسات.

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

    `runEmbeddedAgent(...)` هو المساعد المحايد لبدء دور وكيل OpenClaw عادي من كود plugin. يستخدم حل المزوّد/النموذج نفسه واختيار عُدّة الوكيل نفسها كما في الردود التي تُشغّلها القنوات.

    يظل `runEmbeddedPiAgent(...)` اسمًا مستعارًا للتوافق.

    يعيد `resolveThinkingPolicy(...)` مستويات التفكير التي يدعمها المزوّد/النموذج والافتراضي الاختياري. تملك plugins المزوّدين الملف التعريفي الخاص بالنموذج عبر خطافات التفكير الخاصة بها، لذا يجب أن تستدعي plugins الأدوات مساعد وقت التشغيل هذا بدلًا من استيراد قوائم المزوّدين أو تكرارها.

    يحوّل `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزّن القياسي قبل فحصه مقابل السياسة المحلولة.

    **مساعدات مخزن الجلسات** موجودة تحت `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    فضّل `updateSessionStore(...)` أو `updateSessionStoreEntry(...)` لكتابات وقت التشغيل. تمر عبر كاتب مخزن الجلسات المملوك لـ Gateway، وتحافظ على التحديثات المتزامنة، وتعيد استخدام ذاكرة التخزين المؤقت الساخنة. يظل `saveSessionStore(...)` متاحًا للتوافق وإعادات الكتابة بأسلوب الصيانة دون اتصال.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    تشغيل وإدارة عمليات وكيل فرعي في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) موافقة المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في التكوين. لا تزال plugins غير الموثوقة قادرة على تشغيل وكلاء فرعيين، لكن طلبات التجاوز تُرفض.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأها plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدمين أو المشغّلين الاعتباطية يتطلب طلب Gateway بنطاق مسؤول.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    سرد العُقد المتصلة واستدعاء أمر مستضاف على عقدة من كود plugin المحمّل بواسطة Gateway أو من أوامر CLI الخاصة بـ plugin. استخدم هذا عندما يملك plugin عملًا محليًا على جهاز مقترن، مثل جسر متصفح أو صوت على جهاز Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يكون وقت التشغيل هذا ضمن العملية. في أوامر CLI الخاصة بـ plugin، يستدعي Gateway المُكوّن عبر RPC، لذا يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص العُقد المقترنة من الطرفية. لا تزال أوامر Node تمر عبر اقتران عُقد Gateway العادي، وقوائم السماح للأوامر، وسياسات استدعاء العقد من plugin، ومعالجة الأوامر المحلية للعقدة.

    يجب على plugins التي تكشف أوامر خطرة مستضافة على عقدة تسجيل سياسة استدعاء عقدة باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قوائم السماح للأوامر وقبل تمرير الأمر إلى العقدة، لذا تشترك استدعاءات `node.invoke` المباشرة وأدوات plugin الأعلى مستوى في مسار الإنفاذ نفسه.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط وقت تشغيل Task Flow بمفتاح جلسة OpenClaw موجود أو سياق أداة موثوق، ثم أنشئ Task Flows وأدرها دون تمرير مالك في كل استدعاء.

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

    استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تربط من إدخال مستخدم خام.

  </Accordion>
  <Accordion title="api.runtime.tts">
    تركيب النص إلى كلام.

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

    يستخدم تكوين `messages.tts` الأساسي واختيار المزوّد. يعيد مخزن صوت PCM مؤقتًا + معدل العينة.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحليل الصور والصوت والفيديو.

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

    يعيد `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (مثل الإدخال الذي تم تخطيه).

    <Info>
    يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    إنشاء الصور.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    البحث في الويب.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    أدوات وسائط منخفضة المستوى.

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
    لقطة الإعدادات الحالية في وقت التشغيل وعمليات كتابة الإعدادات المعاملاتية. فضّل
    الإعدادات التي تم تمريرها بالفعل إلى مسار الاستدعاء النشط؛ استخدم
    `current()` فقط عندما يحتاج المعالج إلى لقطة العملية مباشرة.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    يعيد `mutateConfigFile(...)` و`replaceConfigFile(...)` قيمة `followUp`،
    على سبيل المثال `{ mode: "restart", requiresRestart: true, reason }`،
    والتي تسجل نية الكاتب دون سحب التحكم في إعادة التشغيل من
    gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    أدوات على مستوى النظام.

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
    اشتراكات الأحداث.

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
    التسجيل.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    حل مصادقة النموذج والمزوّد.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    حل دليل الحالة والتخزين ذي المفاتيح المدعوم بـ SQLite.

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

    تبقى المخازن ذات المفاتيح بعد عمليات إعادة التشغيل وتُعزل حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرية: يعيد `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون قيمة حية موجودة بالفعل دون الكتابة فوق قيمتها أو وقت إنشائها أو مدة صلاحيتها. الحدود: `maxEntries` لكل مساحة اسم، و1,000 صف حي لكل Plugin، وقيم JSON أقل من 64 كيلوبايت، وانتهاء صلاحية اختياري عبر TTL.

    <Warning>
    Plugins المضمّنة فقط في هذا الإصدار.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    مصانع أدوات الذاكرة وCLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    مساعدات وقت التشغيل الخاصة بالقناة (متاحة عند تحميل Plugin قناة).

    `api.runtime.channel.mentions` هو سطح سياسة الإشارة الواردة المشترك لـ Plugins القنوات المضمّنة التي تستخدم الحقن في وقت التشغيل:

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

    مساعدات الإشارة المتاحة:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    لا يعرض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل مسار `{ facts, policy }` الموحّد.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل لاستخدامه خارج رد النداء `register`:

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. صيغة `key` الأدنى مستوى مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` علوية المستوى الأخرى

إضافة إلى `api.runtime`، يوفر كائن API أيضًا:

<ParamField path="api.id" type="string">
  معرّف Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  اسم عرض Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجل محدود النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء/إعداد خفيفة قبل الإدخال الكامل.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حل مسار نسبيًا إلى جذر Plugin.
</ParamField>

## ذات صلة

- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسار الفرعي
