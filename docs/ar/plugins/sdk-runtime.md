---
read_when:
    - تحتاج إلى استدعاء دوال المساعدة الأساسية من Plugin (TTS، STT، توليد الصور، البحث في الويب، وكيل فرعي، العُقد)
    - تريد أن تفهم ما يتيحه api.runtime
    - أنت تصل إلى أدوات مساعدة للإعدادات أو الوكيل أو الوسائط من شيفرة Plugin.
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المُحقنة المتاحة لـ Plugin
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-05-11T20:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل Plugin أثناء التسجيل. استخدم هذه الأدوات المساعدة بدلاً من استيراد مكوّنات المضيف الداخلية مباشرة.

<CardGroup cols={2}>
  <Card title="Plugins القنوات" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة ضمن سياق Plugins القنوات.
  </Card>
  <Card title="Plugins المزوّدين" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة ضمن سياق Plugins المزوّدين.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل الإعدادات والكتابة

فضّل الإعدادات التي مُرّرت مسبقاً إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات القناة/المزوّد الراجعة. هذا يُبقي لقطة عملية واحدة متدفقة عبر العمل بدلاً من إعادة تحليل الإعدادات في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم تُمرَّر أي إعدادات إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم أداة مساعدة للتعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` إضافة إلى `ctx.getRuntimeConfig()`. استخدم دالة الجلب داخل استدعاء `execute` الراجع لأداة طويلة العمر عندما يمكن أن تتغير الإعدادات بعد إنشاء تعريف الأداة.

استمر في حفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل عملية كتابة سياسة `afterWrite` صريحة:

- يترك `afterWrite: { mode: "auto" }` قرار إعادة التحميل لمخطِّط Gateway.
- يفرض `afterWrite: { mode: "restart", reason: "..." }` إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- يمنع `afterWrite: { mode: "none", reason: "..." }` إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي المتابعة.

تعيد أدوات التعديل المساعدة `afterWrite` إضافة إلى ملخص `followUp` نمطي بحيث يستطيع المستدعون تسجيل أو اختبار ما إذا كانوا قد طلبوا إعادة تشغيل. يبقى Gateway هو مالك توقيت حدوث إعادة التشغيل فعلياً.

`api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` هما أداتان مساعدتان مهجورتان للتوافق ضمن `runtime-config-load-write`. تعرضان تحذيراً مرة واحدة أثناء التشغيل، وتبقيان متاحتين لـ Plugins خارجية قديمة خلال نافذة الترحيل. يجب ألا تستخدمهما Plugins المضمّنة؛ تفشل حواجز حدود الإعدادات إذا استدعى كود Plugin هذه الأدوات أو استورد تلك الأدوات المساعدة من مسارات فرعية في Plugin SDK.

للاستيرادات المباشرة من SDK، استخدم المسارات الفرعية المركّزة للإعدادات بدلاً من برميل التوافق الواسع
`openclaw/plugin-sdk/config-runtime`: استخدم `config-contracts` للأنواع، و`plugin-config-runtime` لتوكيدات الإعدادات المحمّلة مسبقاً والبحث عن مدخل Plugin، و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات. يجب أن تحاكي اختبارات Plugins المضمّنة هذه المسارات الفرعية المركّزة مباشرة بدلاً من محاكاة برميل التوافق الواسع.

لكود تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل الإعدادات مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرّر تلك القيمة عبر المسار. تؤدي عمليات التعديل الناجحة إلى تحديث لقطة تشغيل العملية وتقديم مراجعتها الداخلية؛ يجب أن تعتمد التخزينات المؤقتة طويلة العمر على مفتاح التخزين المؤقت المملوك لبيئة التشغيل بدلاً من تسلسل الإعدادات محلياً. لدى وحدات التشغيل طويلة العمر ماسح بلا تسامح مع استدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` ممرَّرة، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ المزوّد والقناة لقطة إعدادات التشغيل النشطة، لا لقطة ملف مُعادة لقراءة الإعدادات أو تحريرها. تحفظ لقطات الملفات قيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج استدعاءات المزوّد الراجعة إلى عرض التشغيل المحلول. عندما يمكن استدعاء أداة مساعدة إما بلقطة المصدر النشطة أو بلقطة التشغيل النشطة، مرّر المسار عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## فضاءات أسماء التشغيل

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

    `runEmbeddedAgent(...)` هي الأداة المساعدة المحايدة لبدء دورة وكيل OpenClaw عادية من كود Plugin. تستخدم المسار نفسه لحل المزوّد/النموذج واختيار عُدّة الوكيل كما في الردود المُشغّلة من القناة.

    يبقى `runEmbeddedPiAgent(...)` اسماً مستعاراً للتوافق.

    يعيد `resolveThinkingPolicy(...)` مستويات التفكير المدعومة للمزوّد/النموذج والقيمة الافتراضية الاختيارية. تمتلك Plugins المزوّدين ملف التعريف الخاص بالنموذج عبر خطافات التفكير الخاصة بها، لذلك يجب أن تستدعي Plugins الأدوات هذه الأداة المساعدة في التشغيل بدلاً من استيراد قوائم المزوّدين أو تكرارها.

    يحوّل `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزّن القياسي قبل التحقق منه مقابل السياسة المحلولة.

    **أدوات مخزن الجلسات المساعدة** تقع ضمن `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    فضّل `updateSessionStore(...)` أو `updateSessionStoreEntry(...)` لكتابات التشغيل. تمر عبر كاتب مخزن الجلسات المملوك لـ Gateway، وتحافظ على التحديثات المتزامنة، وتعيد استخدام التخزين المؤقت الساخن. يبقى `saveSessionStore(...)` متاحاً للتوافق وإعادة الكتابة بأسلوب الصيانة دون اتصال.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    شغّل إكمال نص مملوكاً للمضيف من دون استيراد مكوّنات المزوّد الداخلية أو
    تكرار إعداد النموذج/المصادقة/عنوان URL الأساسي الخاص بـ OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    تستخدم الأداة المساعدة مسار إعداد الإكمال البسيط نفسه كما في بيئة تشغيل
    OpenClaw المدمجة ولقطة إعدادات التشغيل المملوكة للمضيف. تتلقى محركات السياق
    قدرة `llm.complete` مرتبطة بالجلسة، لذلك تستخدم استدعاءات النماذج وكيل
    الجلسة النشط ولا تعود بصمت إلى الوكيل الافتراضي. تتضمن النتيجة إسناد
    المزوّد/النموذج/الوكيل إضافة إلى استخدام الرموز، والتخزين المؤقت، والتكلفة
    المقدّرة بعد التطبيع عند توفرها.

    <Warning>
    تتطلب تجاوزات النموذج موافقة المشغّل عبر `plugins.entries.<id>.llm.allowModelOverride: true` في الإعدادات. استخدم `plugins.entries.<id>.llm.allowedModels` لتقييد Plugins الموثوقة إلى أهداف `provider/model` قياسية محددة. تتطلب الإكمالات عبر الوكلاء `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    شغّل وأدر عمليات وكلاء فرعيين في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) موافقة المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. ما زال بإمكان Plugins غير الموثوقة تشغيل الوكلاء الفرعيين، لكن تُرفض طلبات التجاوز.
    </Warning>

    يستطيع `deleteSession(...)` حذف الجلسات التي أنشأها Plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات مستخدمين أو مشغّلين اعتباطية يتطلب طلب Gateway بنطاق إداري.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد العقد المتصلة واستدعِ أمراً مستضافاً على عقدة من كود Plugin المحمّل عبر Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما يمتلك Plugin عملاً محلياً على جهاز مقترن، مثل جسر متصفح أو صوت على Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway تكون بيئة التشغيل هذه داخل العملية. في أوامر CLI الخاصة بـ Plugin تستدعي Gateway المضبوط عبر RPC، لذلك يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص العقد المقترنة من الطرفية. ما زالت أوامر Node تمر عبر اقتران عقد Gateway العادي، وقوائم السماح للأوامر، وسياسات استدعاء العقد في Plugin، ومعالجة الأوامر المحلية في العقدة.

    يجب على Plugins التي تعرض أوامر خطرة مستضافة على العقدة تسجيل سياسة استدعاء عقدة باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة سماح الأوامر وقبل تمرير الأمر إلى العقدة، لذلك تشترك استدعاءات `node.invoke` المباشرة وأدوات Plugin الأعلى مستوى في مسار الإنفاذ نفسه.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط بيئة تشغيل Task Flow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق، ثم أنشئ وأدر Task Flows من دون تمرير مالك في كل استدعاء.

    يتتبع Task Flow حالة سير عمل متينة متعددة الخطوات. إنه ليس مجدولاً:
    استخدم Cron أو `api.session.workflow.scheduleSessionTurn(...)` لعمليات
    الإيقاظ المستقبلية، ثم استخدم `managedFlows` من الدورة المجدولة عندما
    يحتاج ذلك العمل إلى حالة تدفق، أو مهام فرعية، أو انتظارات، أو إلغاء.

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
    تركيب تحويل النص إلى كلام.

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

    يستخدم تهيئة `messages.tts` الأساسية واختيار المزوّد. يُرجع مخزنًا مؤقتًا صوتيًا بصيغة PCM + معدل العينة.

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

    يُرجع `{ text: undefined }` عندما لا يُنتَج أي خرج (مثل الإدخال المتجاوز).

    <Info>
    يظل `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    البحث على الويب.

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
    لقطة تهيئة وقت التشغيل الحالية وكتابات التهيئة المعاملاتية. فضّل
    التهيئة التي مُرّرت بالفعل إلى مسار الاستدعاء النشط؛ استخدم
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

    يُرجع `mutateConfigFile(...)` و`replaceConfigFile(...)` قيمة `followUp`،
    مثل `{ mode: "restart", requiresRestart: true, reason }`،
    والتي تسجل نية الكاتب دون سحب التحكم في إعادة التشغيل من
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

    تبقى مخازن المفاتيح بعد إعادة التشغيل وتُعزل حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرية: فهي تُرجع `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما توجد قيمة حية بالفعل دون استبدال قيمتها أو وقت إنشائها أو TTL الخاص بها. الحدود: `maxEntries` لكل مساحة أسماء، و1,000 صف حي لكل Plugin، وقيم JSON أقل من 64KB، وانتهاء صلاحية TTL اختياري.

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
    مساعدات وقت التشغيل الخاصة بالقناة (تتوفر عند تحميل Plugin قناة).

    `api.runtime.channel.mentions` هو سطح سياسة الإشارة الواردة المشترك لـ Plugins القنوات المضمنة التي تستخدم حقن وقت التشغيل:

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

    لا يعرض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل المسار الموحد `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل للاستخدام خارج استدعاء `register`:

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. صيغة `key` ذات المستوى الأدنى مخصصة للحالات غير الشائعة حيث يحتاج Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` علوية أخرى

إلى جانب `api.runtime`، يوفر كائن API أيضًا:

<ParamField path="api.id" type="string">
  معرّف Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  اسم العرض لـ Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  لقطة التكوين الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  التكوين الخاص بـ Plugin من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجّل محدود النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء/إعداد خفيفة قبل الإدخال الكامل.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حلّ مسار بالنسبة إلى جذر Plugin.
</ParamField>

## ذات صلة

- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
