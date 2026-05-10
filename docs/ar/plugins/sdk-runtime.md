---
read_when:
    - تحتاج إلى استدعاء الدوال المساعدة الأساسية من Plugin (TTS، وSTT، وتوليد الصور، وبحث الويب، ووكيل فرعي، والعُقد)
    - تريد فهم ما يتيحه api.runtime
    - أنت تصل إلى مساعدات الإعدادات أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة والمتاحة للـ Plugin
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-05-10T19:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل plugin أثناء التسجيل. استخدم هذه المساعدات بدلًا من استيراد العناصر الداخلية للمضيف مباشرةً.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات في سياق channel plugins.
  </Card>
  <Card title="Provider plugins" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات في سياق provider plugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل الإعدادات والكتابة

فضّل الإعدادات التي مُررت بالفعل إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات channel/provider. هذا يُبقي لقطة عملية واحدة تتدفق عبر العمل بدلًا من إعادة تحليل الإعدادات في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم تُمرر أي إعدادات إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم مساعد تعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` إضافةً إلى `ctx.getRuntimeConfig()`. استخدم دالة الجلب داخل استدعاء `execute` لأداة طويلة العمر عندما يمكن أن تتغير الإعدادات بعد إنشاء تعريف الأداة.

احفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل عملية كتابة سياسة `afterWrite` صريحة:

- يتيح `afterWrite: { mode: "auto" }` لقرار إعادة تحميل Gateway التخطيطي أن يقرر.
- يفرض `afterWrite: { mode: "restart", reason: "..." }` إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- يمنع `afterWrite: { mode: "none", reason: "..." }` إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي المتابعة.

تعيد مساعدات التعديل `afterWrite` إضافةً إلى ملخص `followUp` بنوع محدد لكي يستطيع المستدعون تسجيل ما إذا كانوا قد طلبوا إعادة تشغيل أو اختباره. يظل Gateway مالكًا لتوقيت حدوث إعادة التشغيل فعليًا.

`api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` هما مساعدا توافق مهملان ضمن `runtime-config-load-write`. يصدران تحذيرًا مرة واحدة أثناء التشغيل، ويظلان متاحين لـ plugins الخارجية القديمة خلال نافذة الترحيل. يجب ألا تستخدمهما plugins المضمنة؛ تفشل حراسات حدود الإعدادات إذا استدعى كود plugin هذه المساعدات أو استوردها من مسارات فرعية في plugin SDK.

بالنسبة إلى استيرادات SDK المباشرة، استخدم مسارات الإعدادات الفرعية المركزة بدلًا من
برميل التوافق الواسع `openclaw/plugin-sdk/config-runtime`: استخدم `config-contracts` من أجل
الأنواع، و`plugin-config-runtime` لتأكيدات الإعدادات المحملة مسبقًا والبحث عن مدخلات plugin،
و`runtime-config-snapshot` للقطات العملية الحالية، و
`config-mutation` للكتابات. يجب أن تحاكي اختبارات plugins المضمنة هذه
المسارات الفرعية المركزة مباشرةً بدلًا من محاكاة برميل التوافق الواسع.

كود تشغيل OpenClaw الداخلي له الاتجاه نفسه: حمّل الإعدادات مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرر تلك القيمة عبر المسار. تحدّث كتابات التعديل الناجحة لقطة تشغيل العملية وتقدم مراجعتها الداخلية؛ يجب أن تعتمد الذاكرات المؤقتة طويلة العمر على مفتاح الذاكرة المؤقتة المملوك للتشغيل بدلًا من تسلسل الإعدادات محليًا. لدى وحدات التشغيل طويلة العمر ماسح بلا تسامح لاستدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` ممررة، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ provider وchannel لقطة إعدادات التشغيل النشطة، وليس لقطة ملف مُعادة لقراءة الإعدادات أو تحريرها. تحتفظ لقطات الملفات بقيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج استدعاءات provider إلى عرض التشغيل المحلول. عندما يمكن استدعاء مساعد إما بلقطة المصدر النشطة أو لقطة التشغيل النشطة، مرر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## مساحات أسماء التشغيل

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

    `runEmbeddedAgent(...)` هو المساعد المحايد لبدء دورة وكيل OpenClaw عادية من كود plugin. يستخدم آلية الحل نفسها لـ provider/model واختيار عدة الوكيل كما في الردود المُشغلة من channel.

    يظل `runEmbeddedPiAgent(...)` اسمًا مستعارًا للتوافق.

    يعيد `resolveThinkingPolicy(...)` مستويات التفكير المدعومة لـ provider/model والقيمة الافتراضية الاختيارية. تملك provider plugins ملف التعريف الخاص بالنموذج عبر خطافات التفكير الخاصة بها، لذلك يجب أن تستدعي tool plugins مساعد التشغيل هذا بدلًا من استيراد قوائم provider أو تكرارها.

    يحوّل `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزن القياسي قبل التحقق منه مقابل السياسة المحلولة.

    **مساعدات مخزن الجلسات** موجودة ضمن `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    فضّل `updateSessionStore(...)` أو `updateSessionStoreEntry(...)` لكتابات التشغيل. تمر عبر كاتب مخزن الجلسات المملوك لـ Gateway، وتحافظ على التحديثات المتزامنة، وتعيد استخدام الذاكرة المؤقتة الساخنة. يظل `saveSessionStore(...)` متاحًا للتوافق وإعادة الكتابة بأسلوب الصيانة دون اتصال.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج وprovider الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    شغّل إكمالًا نصيًا مملوكًا للمضيف دون استيراد العناصر الداخلية لـ provider أو
    تكرار إعداد OpenClaw للنموذج/المصادقة/عنوان URL الأساسي.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    يستخدم المساعد مسار إعداد الإكمال البسيط نفسه الذي يستخدمه تشغيل OpenClaw
    المدمج ولقطة إعدادات التشغيل المملوكة للمضيف. تتلقى محركات السياق
    قدرة `llm.complete` مرتبطة بالجلسة، لذلك تستخدم استدعاءات النموذج وكيل
    الجلسة النشطة ولا تعود بصمت إلى الوكيل الافتراضي. تتضمن
    النتيجة إسناد provider/model/agent إضافةً إلى استخدام normalized token،
    والذاكرة المؤقتة، والتكلفة التقديرية عند توفرها.

    <Warning>
    تتطلب تجاوزات النموذج موافقة المشغل عبر `plugins.entries.<id>.llm.allowModelOverride: true` في الإعدادات. استخدم `plugins.entries.<id>.llm.allowedModels` لتقييد plugins الموثوقة بأهداف `provider/model` قياسية محددة. تتطلب الإكمالات عبر الوكلاء `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    شغّل وأدر عمليات subagent في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) موافقة المشغل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. ما زالت plugins غير الموثوقة قادرة على تشغيل subagents، لكن تُرفض طلبات التجاوز.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأها plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدم أو المشغل العشوائية يتطلب طلب Gateway بنطاق admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد العقد المتصلة واستدعِ أمرًا مستضافًا على عقدة من كود plugin المحمل بواسطة Gateway أو من أوامر CLI الخاصة بـ plugin. استخدم هذا عندما يملك plugin عملًا محليًا على جهاز مقترن، مثل متصفح أو جسر صوت على Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يكون هذا التشغيل ضمن العملية. في أوامر CLI الخاصة بـ plugin يستدعي Gateway المكون عبر RPC، لذلك يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص العقد المقترنة من الطرفية. ما زالت أوامر Node تمر عبر اقتران عقد Gateway العادي، وقوائم السماح بالأوامر، وسياسات استدعاء عقد plugin، ومعالجة الأوامر المحلية للعقدة.

    يجب على plugins التي تعرض أوامر خطرة مستضافة على العقدة تسجيل سياسة استدعاء عقدة باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة السماح بالأوامر وقبل تمرير الأمر إلى العقدة، لذلك تشترك استدعاءات `node.invoke` المباشرة وأدوات plugin ذات المستوى الأعلى في مسار الإنفاذ نفسه.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط تشغيل Task Flow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق، ثم أنشئ وأدر Task Flows دون تمرير مالك في كل استدعاء.

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

    استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تربط من مدخلات المستخدم الخام.

  </Accordion>
  <Accordion title="api.runtime.tts">
    توليف الكلام من النص.

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

    يستخدم إعدادات `messages.tts` الأساسية واختيار المزود. يعيد مخزن صوت PCM + معدل العينة.

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

    يعيد `{ text: undefined }` عندما لا يُنتج أي مخرج (مثلًا عند تخطي الإدخال).

    <Info>
    يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا بديلًا للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    توليد الصور.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    بحث الويب.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    أدوات مساعدة منخفضة المستوى للوسائط.

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
    لقطة إعدادات وقت التشغيل الحالية وعمليات كتابة إعدادات معاملية. فضّل
    الإعدادات التي مُرّرت بالفعل إلى مسار الاستدعاء النشط؛ استخدم
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
    التي تسجل نية الكاتب من دون أخذ التحكم في إعادة التشغيل من
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    أدوات مساعدة على مستوى النظام.

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
    حل مصادقة النماذج والمزودين.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    حل دليل الحالة وتخزين مفاتيح مدعوم بـ SQLite.

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

    تبقى مخازن المفاتيح بعد إعادة التشغيل وتُعزل بواسطة معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرية: فهي تعيد `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون هناك قيمة نشطة موجودة بالفعل من دون استبدال قيمتها أو وقت إنشائها أو TTL الخاصة بها. الحدود: `maxEntries` لكل نطاق اسم، و1,000 صف نشط لكل Plugin، وقيم JSON أقل من 64KB، وانتهاء صلاحية TTL اختياري.

    <Warning>
    Plugins المضمنة فقط في هذا الإصدار.
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
    مساعدات وقت تشغيل خاصة بالقناة (متاحة عند تحميل Plugin قناة).

    `api.runtime.channel.mentions` هو سطح سياسة الإشارات الواردة المشترك لـPlugins القنوات المضمنة التي تستخدم حقن وقت التشغيل:

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

    لا يكشف `api.runtime.channel.mentions` عمدًا عن مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل مسار `{ facts, policy }` المطبّع.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل لاستخدامه خارج رد النداء `register`:

<Steps>
  <Step title="إنشاء المخزن">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="توصيله بنقطة الدخول">
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
  <Step title="الوصول من ملفات أخرى">
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
فضّل `pluginId` لهوية مخزن وقت التشغيل. صيغة `key` منخفضة المستوى مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` علوية المستوى الأخرى

إلى جانب `api.runtime`، يوفر كائن API أيضًا:

<ParamField path="api.id" type="string">
  معرّف Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  اسم عرض Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  إعدادات خاصة بـPlugin من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجل محدود النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء/إعداد خفيفة قبل نقطة الدخول الكاملة.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حل مسار نسبيًا إلى جذر Plugin.
</ParamField>

## ذو صلة

- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
