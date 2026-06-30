---
read_when:
    - تحتاج إلى استدعاء الدوال المساعدة الأساسية من Plugin (TTS، STT، توليد الصور، بحث الويب، وكيل فرعي، العُقد)
    - تريد فهم ما يوفّره api.runtime
    - أنت تصل إلى دوال مساعدة للإعدادات أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة المتاحة للـ Plugins
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-06-30T14:06:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل Plugin أثناء التسجيل. استخدم هذه الأدوات المساعدة بدلًا من استيراد داخليات المضيف مباشرة.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق Plugins القنوات.
  </Card>
  <Card title="Provider plugins" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق Plugins المزوّدين.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل الإعدادات والكتابة

فضّل الإعدادات التي مُرّرت مسبقًا إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات القناة/المزوّد. يحافظ هذا على تدفق لقطة عملية واحدة عبر العمل بدلًا من إعادة تحليل الإعدادات في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم تُمرَّر أي إعدادات إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم أداة مساعدة للتعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` بالإضافة إلى `ctx.getRuntimeConfig()`. استخدم الجالب داخل استدعاء `execute` لأداة طويلة العمر عندما يمكن أن تتغير الإعدادات بعد إنشاء تعريف الأداة.

احفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل كتابة سياسة `afterWrite` صريحة:

- يترك `afterWrite: { mode: "auto" }` القرار لمخطط إعادة تحميل Gateway.
- يفرض `afterWrite: { mode: "restart", reason: "..." }` إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- يكبت `afterWrite: { mode: "none", reason: "..." }` إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي المتابعة.

تعيد أدوات التعديل المساعدة `afterWrite` بالإضافة إلى ملخص `followUp` مضبوط النوع حتى يتمكن المستدعون من تسجيل أو اختبار ما إذا كانوا قد طلبوا إعادة تشغيل. يظل Gateway مالكًا لتوقيت حدوث إعادة التشغيل فعليًا.

`api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` هما أداتا توافق مساعدتان مهملتان ضمن `runtime-config-load-write`. تُصدران تحذيرًا مرة واحدة في وقت التشغيل، وتظلان متاحتين لـ Plugins الخارجية القديمة أثناء نافذة الترحيل. يجب ألا تستخدمهما Plugins المضمّنة؛ تفشل حواجز حدود الإعدادات إذا استدعى كود Plugin هذه الأدوات أو استوردها من مسارات فرعية في SDK الخاص بـ Plugin.

بالنسبة لاستيرادات SDK المباشرة، استخدم مسارات الإعدادات الفرعية المركزة بدلًا من برميل التوافق الواسع
`openclaw/plugin-sdk/config-runtime`: استخدم `config-contracts` للأنواع، و`plugin-config-runtime` لتأكيدات الإعدادات المحمّلة مسبقًا والبحث عن مدخل Plugin، و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات. يجب أن تحاكي اختبارات Plugin المضمّنة هذه المسارات الفرعية المركزة مباشرة بدلًا من محاكاة برميل التوافق الواسع.

يتبع كود وقت تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل الإعدادات مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرّر تلك القيمة عبر المسار. تعمل كتابات التعديل الناجحة على تحديث لقطة وقت تشغيل العملية وتقديم مراجعتها الداخلية؛ يجب أن تستند ذاكرات التخزين المؤقت طويلة العمر إلى مفتاح التخزين المؤقت المملوك لوقت التشغيل بدلًا من تسلسل الإعدادات محليًا. تمتلك وحدات وقت التشغيل طويلة العمر ماسحًا بلا تسامح مع استدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` مُمرَّرًا، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ المزوّد والقناة لقطة إعدادات وقت التشغيل النشطة، لا لقطة ملف مُعادة لقراءة الإعدادات أو تحريرها. تحفظ لقطات الملف قيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج استدعاءات المزوّد إلى عرض وقت التشغيل المحلول. عندما يمكن استدعاء أداة مساعدة إما بلقطة المصدر النشطة أو لقطة وقت التشغيل النشطة، مرّر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## أدوات وقت تشغيل قابلة لإعادة الاستخدام

استخدم حقائق `botLoopProtection` الواردة للرسائل الواردة التي ألّفها بوت. يطبّق القلب الحارس المشترك ذي نافذة الانزلاق في الذاكرة قبل سجل الجلسة والإرسال، دون ربط السياسة بقناة واحدة. يتتبع الحارس مفاتيح `(scopeId, conversationId, participant pair)`، ويحسب كلا اتجاهي الزوج معًا، ويطبق فترة تهدئة بمجرد تجاوز ميزانية النافذة، ويزيل الإدخالات غير النشطة عند توفر الفرصة.

يجب أن تفضّل Plugins القنوات التي تعرض هذا السلوك للمشغلين شكل `channels.defaults.botLoopProtection` المشترك لميزانيات الأساس، ثم تضيف فوقه تجاوزات خاصة بالقناة/المزوّد. تستخدم الإعدادات المشتركة الثواني لأنها موجهة للمستخدم:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

مرّر حقائق زوج البوتات بعد تطبيعها مع الدور المحلول. يحل القلب القيم الافتراضية، وتحويل الوحدات، ودلالات `enabled`:

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

استخدم `openclaw/plugin-sdk/pair-loop-guard-runtime` مباشرة فقط لحلقات أحداث مخصصة بين طرفين لا تمر عبر مشغّل الردود الواردة المشترك.

## مساحات أسماء وقت التشغيل

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` هي الأداة المساعدة المحايدة لبدء دورة وكيل OpenClaw عادية من كود Plugin. تستخدم آلية حل المزوّد/النموذج نفسها واختيار عدة الوكيل كما في الردود التي تطلقها القنوات.

    يبقى `runEmbeddedPiAgent(...)` كاسم مستعار للتوافق مهمل لـ Plugins الحالية. يجب أن يستخدم الكود الجديد `runEmbeddedAgent(...)`.

    يعيد `resolveThinkingPolicy(...)` مستويات التفكير التي يدعمها المزوّد/النموذج والقيمة الافتراضية الاختيارية. تملك Plugins المزوّدين ملف التعريف الخاص بالنموذج عبر خطافات التفكير الخاصة بها، لذا يجب أن تستدعي Plugins الأدوات هذه الأداة المساعدة في وقت التشغيل بدلًا من استيراد قوائم المزوّدين أو تكرارها.

    يحوّل `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزن القياسي قبل التحقق منه مقابل السياسة المحلولة.

    **أدوات مخزن الجلسات المساعدة** موجودة ضمن `api.runtime.agent.session`:

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

    فضّل `getSessionEntry(...)` أو `listSessionEntries(...)` أو `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لتدفقات عمل الجلسات. تعالج هذه الأدوات المساعدة الجلسات حسب هوية الوكيل/الجلسة حتى لا تعتمد Plugins على شكل تخزين `sessions.json` القديم. استخدم `preserveActivity: true` للتصحيحات الخاصة بالبيانات الوصفية فقط التي يجب ألا تحدّث نشاط الجلسة، و`replaceEntry: true` فقط عندما يعيد الاستدعاء إدخالًا كاملًا ويجب أن تبقى الحقول المحذوفة محذوفة.

    لقراءات وكتابات السجل النصي، استورد `openclaw/plugin-sdk/session-transcript-runtime` واستخدم `resolveSessionTranscriptIdentity(...)` أو `resolveSessionTranscriptTarget(...)` أو `readSessionTranscriptEvents(...)` أو `appendSessionTranscriptMessageByIdentity(...)` أو `publishSessionTranscriptUpdateByIdentity(...)` أو `withSessionTranscriptWriteLock(...)` مع `{ agentId, sessionKey, sessionId }`. تسمح هذه الواجهات لـ Plugins بتحديد سجل نصي، وقراءة أحداثه، وإلحاق الرسائل، ونشر التحديثات، وتشغيل العمليات ذات الصلة تحت قفل كتابة السجل النصي نفسه. تمرير `sessionFile`، أو استخدام `resolveSessionTranscriptLegacyFileTarget(...)`، أو استيراد `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` منخفضة المستوى من `openclaw/plugin-sdk/agent-harness-runtime` مهمل؛ توجد هذه المسارات فقط للكود القديم الذي يتلقى بالفعل أداة سجل نصي نشطة.

    `loadSessionStore(...)` و`saveSessionStore(...)` و`updateSessionStore(...)` و`resolveSessionFilePath(...)` و`resolveAndPersistSessionFile(...)` هي أدوات توافق مساعدة مهملة لـ Plugins التي لا تزال تعتمد عمدًا على شكل المخزن الكامل القديم أو ملف السجل النصي. يجب ألا يستخدم كود Plugin الجديد هذه الأدوات المساعدة، ويجب أن يرحّل المستدعون الحاليون إلى أدوات الإدخال المساعدة وأدوات هوية السجل النصي المساعدة.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    شغّل إكمالًا نصيًا يملكه المضيف دون استيراد داخليات المزوّد أو
    تكرار تحضير نموذج/مصادقة/عنوان URL أساسي خاص بـ OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    تستخدم الأداة المساعدة مسار تحضير الإكمال البسيط نفسه مثل وقت التشغيل
    المدمج في OpenClaw ولقطة إعدادات وقت التشغيل التي يملكها المضيف. تتلقى محركات السياق
    قدرة `llm.complete` مرتبطة بالجلسة، لذا تستخدم استدعاءات النموذج وكيل
    الجلسة النشطة ولا تعود بصمت إلى الوكيل الافتراضي. تتضمن
    النتيجة إسناد المزوّد/النموذج/الوكيل بالإضافة إلى استخدام الرموز،
    والتخزين المؤقت، والتكلفة المقدرة بعد تطبيعها عند توفرها.

    <Warning>
    تتطلب تجاوزات النموذج موافقة المشغل عبر `plugins.entries.<id>.llm.allowModelOverride: true` في الإعدادات. استخدم `plugins.entries.<id>.llm.allowedModels` لتقييد Plugins الموثوقة على أهداف `provider/model` قياسية محددة. تتطلب الإكمالات عبر الوكلاء `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    أطلق وأدر تشغيلات الوكلاء الفرعيين في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) تفعيلًا صريحًا من المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. لا يزال بإمكان Plugins غير الموثوقة تشغيل وكلاء فرعيين، لكن طلبات التجاوز تُرفض.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأها Plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدم أو المشغّل العشوائية يتطلب طلب Gateway بنطاق مسؤول.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد Nodes المتصلة واستدعِ أمرًا مستضافًا على Node من كود Plugin الذي يحمّله Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما يمتلك Plugin عملًا محليًا على جهاز مقترن، مثل متصفح أو جسر صوت على جهاز Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يكون وقت التشغيل هذا داخل العملية. في أوامر CLI الخاصة بـ Plugin، يستدعي Gateway المكوّن عبر RPC، لذلك يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص Nodes المقترنة من الطرفية. ما زالت أوامر Node تمر عبر الاقتران العادي لـ Gateway مع Node، وقوائم السماح للأوامر، وسياسات استدعاء Node الخاصة بـ Plugin، ومعالجة الأوامر المحلية على Node.

    ينبغي لـ Plugins التي تعرض أوامر خطرة مستضافة على Node تسجيل سياسة استدعاء Node باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة السماح للأوامر وقبل تمرير الأمر إلى Node، لذلك تشترك استدعاءات `node.invoke` المباشرة وأدوات Plugin ذات المستوى الأعلى في مسار الإنفاذ نفسه.

    <Warning>
    يطلب حقل `scopes` الاختياري نطاقات مشغّل Gateway للاستدعاء. يلتزم OpenClaw به فقط لـ Plugins المضمّنة وتثبيتات Plugins الرسمية الموثوقة؛ ولا ترفع الطلبات الواردة من Plugins أخرى صلاحية الاستدعاء. استخدمه فقط عندما يجب أن يستدعي Plugin موثوق أمر Node بنطاق Gateway أكثر صرامة، مثل `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط وقت تشغيل تدفق مهام بمفتاح جلسة OpenClaw موجود أو سياق أداة موثوق، ثم أنشئ تدفقات مهام وأدرها من دون تمرير مالك في كل استدعاء.

    يتتبع تدفق المهام حالة سير عمل دائمة متعددة الخطوات. ليس مجدوِلًا:
    استخدم Cron أو `api.session.workflow.scheduleSessionTurn(...)` للتنبيهات المستقبلية،
    ثم استخدم `managedFlows` من الدور المجدول عندما يحتاج ذلك العمل إلى
    حالة تدفق، أو مهام فرعية، أو انتظارات، أو إلغاء.

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
    تركيب الكلام من النص.

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

    يستخدم إعدادات `messages.tts` الأساسية واختيار المزوّد. يعيد مخزن صوت PCM المؤقت + معدل العينة.

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

    يعيد `{ text: undefined }` عند عدم إنتاج أي مخرجات (مثلًا عند تخطي الإدخال).

    <Info>
    يظل `api.runtime.stt.transcribeAudioFile(...)` اسمًا بديلًا للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    لقطة إعدادات وقت التشغيل الحالية وكتابات الإعدادات المعاملاتية. فضّل
    الإعدادات التي مُرّرت بالفعل إلى مسار الاستدعاء النشط؛ واستخدم
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
    مثل `{ mode: "restart", requiresRestart: true, reason }`،
    والتي تسجل نية الكاتب من دون سحب التحكم في إعادة التشغيل من
    Gateway.

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

    يعيد `runCommandWithTimeout(...)` قيم `stdout` و`stderr` الملتقطة، وأعداد
    الاقتطاع الاختيارية، و`code`، و`signal`، و`killed`، و`termination`، و
    `noOutputTimedOut`. تبلغ نتائج انتهاء المهلة وانتهاء مهلة عدم وجود مخرجات عن
    `code: 124` عندما لا توفر العملية الفرعية رمز خروج غير صفري. لا تزال عمليات
    الخروج بإشارة من دون انتهاء مهلة قادرة على إرجاع `code: null`، لذلك استخدم
    `termination` و`noOutputTimedOut` للتمييز بين أسباب انتهاء المهلة.

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

    تبقى المخازن ذات المفاتيح بعد إعادة التشغيل، وتكون معزولة حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرّية: فهي تُرجع `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون قيمة نشطة موجودة بالفعل دون استبدال قيمتها أو وقت إنشائها أو مدة TTL الخاصة بها. الحدود: `maxEntries` لكل مساحة أسماء، و6,000 صف نشط لكل Plugin، وقيم JSON أقل من 64KB، وانتهاء صلاحية TTL اختياري. عندما تتجاوز عملية كتابة حد صفوف Plugin، قد يزيل وقت التشغيل أقدم الصفوف النشطة من مساحة الأسماء التي تجري الكتابة إليها؛ لا تُزال مساحات الأسماء الشقيقة بسبب تلك الكتابة، وتظل الكتابة تفشل إذا لم تتمكن مساحة الأسماء من تحرير عدد كافٍ من الصفوف.

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

    `api.runtime.channel.media` هي الواجهة المفضلة لتنزيل وسائط القناة وتخزينها:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    استخدم `saveRemoteMedia(...)` عندما يجب أن يصبح عنوان URL بعيد وسائط OpenClaw. استخدم `saveResponseMedia(...)` عندما يكون Plugin قد جلب بالفعل `Response` مع معالجة المصادقة أو إعادة التوجيه أو قائمة السماح التي يملكها Plugin. استخدم `readRemoteMediaBuffer(...)` فقط عندما يحتاج Plugin إلى البايتات الخام للفحص أو التحويلات أو فك التشفير أو إعادة الرفع. يظل `fetchRemoteMedia(...)` اسمًا مستعارًا للتوافق، وقد أُلغي استخدامه، لـ `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` هي واجهة سياسة الإشارات الواردة المشتركة لـ Plugins القنوات المضمّنة التي تستخدم حقن وقت التشغيل:

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

    مساعدات الإشارات المتاحة:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    لا تكشف `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل المسار الموحّد `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل للاستخدام خارج استدعاء `register`:

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. صيغة `key` ذات المستوى الأدنى مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من موضع وقت تشغيل واحد.
</Note>

## حقول `api` العلوية الأخرى

إضافةً إلى `api.runtime`، يوفّر كائن API أيضًا:

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
  إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجّل مقيّد النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة قبل نقطة الدخول الكاملة.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حل مسار نسبةً إلى جذر Plugin.
</ParamField>

## ذات صلة

- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — نموذج الإمكانات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
