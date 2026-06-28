---
read_when:
    - تحتاج إلى استدعاء الدوال المساعدة الأساسية من Plugin (TTS، STT، توليد الصور، بحث الويب، وكيل فرعي، عُقد)
    - تريد أن تفهم ما يتيحه api.runtime
    - أنت تصل إلى مساعدات الإعدادات أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة المتاحة لـ Plugins
title: أدوات مساعدة لوقت تشغيل Plugin
x-i18n:
    generated_at: "2026-06-28T20:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل plugin أثناء التسجيل. استخدم هذه الأدوات المساعدة بدلًا من استيراد داخليات المضيف مباشرة.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق channel plugins.
  </Card>
  <Card title="Provider plugins" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق provider plugins.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل التكوين والكتابة

فضّل التكوين الذي مُرر بالفعل إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات channel/provider callback. هذا يُبقي لقطة عملية واحدة متدفقة عبر العمل بدلًا من إعادة تحليل التكوين في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم يُمرر أي تكوين إلى تلك الدالة. القيمة المعادة للقراءة فقط؛ انسخها أو استخدم أداة مساعدة للتعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` إضافة إلى `ctx.getRuntimeConfig()`. استخدم getter داخل callback `execute` لأداة طويلة العمر عندما يمكن أن يتغير التكوين بعد إنشاء تعريف الأداة.

احفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل كتابة سياسة `afterWrite` صريحة:

- `afterWrite: { mode: "auto" }` يترك لمخطط إعادة تحميل Gateway القرار.
- `afterWrite: { mode: "restart", reason: "..." }` يفرض إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- `afterWrite: { mode: "none", reason: "..." }` يمنع إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يكون المتصل مالكًا للمتابعة.

تعيد أدوات التعديل المساعدة `afterWrite` إضافة إلى ملخص `followUp` بنوع محدد حتى يستطيع المتصلون تسجيل ما إذا كانوا قد طلبوا إعادة تشغيل أو اختباره. يظل Gateway مالكًا لتوقيت حدوث إعادة التشغيل فعليًا.

`api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` أدوات مساعدة للتوافق مهملة ضمن `runtime-config-load-write`. تُصدر تحذيرًا مرة واحدة في وقت التشغيل، وتظل متاحة للـ plugins الخارجية القديمة خلال نافذة الترحيل. يجب ألا تستخدمها الـ plugins المضمنة؛ تفشل حواجز حدود التكوين إذا استدعاها كود plugin أو استورد هذه الأدوات المساعدة من مسارات plugin SDK الفرعية.

بالنسبة إلى استيرادات SDK المباشرة، استخدم مسارات التكوين الفرعية المركزة بدلًا من برميل التوافق الواسع
`openclaw/plugin-sdk/config-runtime`: استخدم `config-contracts` للأنواع، و`plugin-config-runtime` لتأكيدات التكوين المحمل مسبقًا والبحث عن مدخل plugin، و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات. ينبغي لاختبارات plugin المضمنة أن تحاكي هذه المسارات الفرعية المركزة مباشرة بدلًا من محاكاة برميل التوافق الواسع.

يتبع كود وقت تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل التكوين مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرر تلك القيمة عبر المسار. عمليات كتابة التعديل الناجحة تُحدث لقطة وقت تشغيل العملية وتُقدم المراجعة الداخلية؛ ينبغي للذاكرات المخبئية طويلة العمر أن تعتمد على مفتاح التخزين المؤقت المملوك لوقت التشغيل بدلًا من تسلسل التكوين محليًا. تحتوي وحدات وقت التشغيل طويلة العمر على ماسح بلا تساهل لاستدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` ممررًا، أو `context.getRuntimeConfig()` لطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ provider وchannel لقطة تكوين وقت التشغيل النشطة، لا لقطة ملف معادة لقراءة التكوين أو تحريره. تحتفظ لقطات الملفات بقيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج callbacks الخاصة بالـ provider إلى عرض وقت التشغيل المحلول. عندما قد تُستدعى أداة مساعدة إما بلقطة المصدر النشطة أو لقطة وقت التشغيل النشطة، مرر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## أدوات وقت التشغيل القابلة لإعادة الاستخدام

استخدم حقائق `botLoopProtection` الواردة للرسائل الواردة المؤلفة بواسطة bot. يطبق core الحارس المشترك ذي النافذة المنزلقة في الذاكرة قبل سجل الجلسة والتوزيع، دون ربط السياسة بـ channel واحدة. يتتبع الحارس مفاتيح `(scopeId, conversationId, participant pair)`، ويعد كلا اتجاهي الزوج معًا، ويطبق فترة تهدئة بمجرد تجاوز ميزانية النافذة، ويشذب الإدخالات غير النشطة انتهازيًا.

ينبغي لـ Channel plugins التي تعرض هذا السلوك للمشغلين أن تفضل شكل `channels.defaults.botLoopProtection` المشترك لميزانيات الأساس، ثم تضيف تجاوزات خاصة بالـ channel/provider فوقه. يستخدم التكوين المشترك الثواني لأنه موجه للمستخدم:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

مرر حقائق زوج bot المعيارية مع الدوران المحلول. يحل core الإعدادات الافتراضية، وتحويل الوحدات، ودلالات `enabled`:

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

استخدم `openclaw/plugin-sdk/pair-loop-guard-runtime` مباشرة فقط لحلقات أحداث مخصصة بين طرفين لا تمر عبر مشغل الرد الوارد المشترك.

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

    `runEmbeddedAgent(...)` هي الأداة المساعدة المحايدة لبدء دورة عادية لوكيل OpenClaw من كود plugin. تستخدم دقة provider/model نفسها واختيار agent-harness نفسه مثل الردود التي تطلقها channel.

    يبقى `runEmbeddedPiAgent(...)` اسمًا مستعارًا مهملًا للتوافق للـ plugins الموجودة. ينبغي للكود الجديد استخدام `runEmbeddedAgent(...)`.

    تعيد `resolveThinkingPolicy(...)` مستويات التفكير المدعومة للـ provider/model والافتراضي الاختياري. تملك Provider plugins الملف التعريفي الخاص بالنموذج عبر hooks التفكير الخاصة بها، لذا ينبغي لـ tool plugins استدعاء أداة وقت التشغيل هذه بدلًا من استيراد قوائم providers أو تكرارها.

    تحول `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزن القانوني قبل التحقق منه مقابل السياسة المحلولة.

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

    فضّل `getSessionEntry(...)` أو `listSessionEntries(...)` أو `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لسير عمل الجلسات. تعالج هذه الأدوات المساعدة الجلسات حسب هوية الوكيل/الجلسة حتى لا تعتمد الـ plugins على شكل التخزين القديم `sessions.json`. استخدم `preserveActivity: true` للتصحيحات الخاصة بالبيانات الوصفية فقط التي يجب ألا تُحدث نشاط الجلسة، و`replaceEntry: true` فقط عندما يعيد callback إدخالًا كاملًا ويجب أن تبقى الحقول المحذوفة محذوفة.

    لقراءات النصوص وكتابتها، استورد `openclaw/plugin-sdk/session-transcript-runtime` واستخدم `resolveSessionTranscriptIdentity(...)` أو `resolveSessionTranscriptTarget(...)` أو `readSessionTranscriptEvents(...)` أو `appendSessionTranscriptMessageByIdentity(...)` أو `publishSessionTranscriptUpdateByIdentity(...)` أو `withSessionTranscriptWriteLock(...)` مع `{ agentId, sessionKey, sessionId }`. تتيح هذه APIs للـ plugins تحديد نص جلسة، وقراءة أحداثه، وإلحاق الرسائل، ونشر التحديثات، وتشغيل العمليات ذات الصلة ضمن قفل كتابة نص الجلسة نفسه. تمرير `sessionFile`، أو استخدام `resolveSessionTranscriptLegacyFileTarget(...)`، أو استيراد `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` منخفضي المستوى من `openclaw/plugin-sdk/agent-harness-runtime` مهمل؛ هذه المسارات موجودة فقط للكود القديم الذي يتلقى بالفعل أثرًا نشطًا لنص الجلسة.

    `loadSessionStore(...)` و`saveSessionStore(...)` و`updateSessionStore(...)` و`resolveSessionFilePath(...)` و`resolveAndPersistSessionFile(...)` أدوات مساعدة للتوافق مهملة للـ plugins التي لا تزال تعتمد عمدًا على شكل المخزن الكامل القديم أو ملف النص. يجب ألا يستخدم كود plugin الجديد هذه الأدوات المساعدة، وينبغي للمتصلين الحاليين الترحيل إلى أدوات الإدخال المساعدة وأدوات هوية النص المساعدة.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والـ provider الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    شغّل إكمالًا نصيًا مملوكًا للمضيف دون استيراد داخليات provider أو
    تكرار إعداد النموذج/المصادقة/base URL في OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    تستخدم الأداة المساعدة مسار إعداد الإكمال البسيط نفسه مثل وقت التشغيل المضمن في OpenClaw
    ولقطة تكوين وقت التشغيل المملوكة للمضيف. تتلقى محركات السياق قدرة `llm.complete` مرتبطة بالجلسة، لذلك تستخدم استدعاءات النموذج وكيل الجلسة النشطة ولا تعود بصمت إلى الوكيل الافتراضي. تتضمن النتيجة نسب provider/model/agent إضافة إلى استخدام tokens، والذاكرة المخبئية، والتكلفة المقدرة بعد التطبيع عند توفره.

    <Warning>
    تتطلب تجاوزات النموذج موافقة المشغل عبر `plugins.entries.<id>.llm.allowModelOverride: true` في التكوين. استخدم `plugins.entries.<id>.llm.allowedModels` لتقييد الـ plugins الموثوقة إلى أهداف `provider/model` قانونية محددة. تتطلب الإكمالات العابرة للوكلاء `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    تتطلب تجاوزات النموذج (`provider`/`model`) اشتراكًا صريحًا من المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. لا يزال بإمكان Plugins غير الموثوقة تشغيل الوكلاء الفرعيين، لكن طلبات التجاوز تُرفض.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأها Plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدم أو المشغّل العشوائية يتطلب طلب Gateway بنطاق إداري.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد العقد المتصلة واستدعِ أمرًا مستضافًا على عقدة من كود Plugin المحمّل بواسطة Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما يمتلك Plugin عملًا محليًا على جهاز مقترن، مثل جسر متصفح أو صوت على Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يكون وقت التشغيل هذا داخل العملية نفسها. في أوامر CLI الخاصة بـ Plugin، يستدعي Gateway المهيأ عبر RPC، لذلك يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص العقد المقترنة من الطرفية. لا تزال أوامر Node تمر عبر الاقتران العادي لعقد Gateway، وقوائم الأوامر المسموح بها، وسياسات استدعاء العقد الخاصة بـ Plugin، ومعالجة الأوامر المحلية على العقدة.

    يجب على Plugins التي تكشف أوامر خطرة مستضافة على العقد تسجيل سياسة استدعاء عقدة باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة الأوامر المسموح بها وقبل تمرير الأمر إلى العقدة، لذلك تشترك استدعاءات `node.invoke` المباشرة وأدوات Plugin ذات المستوى الأعلى في مسار الإنفاذ نفسه.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط وقت تشغيل تدفق المهام بمفتاح جلسة OpenClaw موجود أو سياق أداة موثوق، ثم أنشئ تدفقات المهام وأدرها دون تمرير مالك في كل استدعاء.

    يتتبع تدفق المهام حالة سير عمل متينة متعددة الخطوات. وهو ليس مجدولًا:
    استخدم Cron أو `api.session.workflow.scheduleSessionTurn(...)` للاستيقاظات
    المستقبلية، ثم استخدم `managedFlows` من الدور المجدول عندما يحتاج ذلك العمل
    إلى حالة تدفق، أو مهام فرعية، أو انتظار، أو إلغاء.

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

    يستخدم إعدادات `messages.tts` الأساسية واختيار المزوّد. يعيد مخزن صوت PCM مؤقت + معدل العينة.

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

    يعيد `{ text: undefined }` عندما لا يُنتج أي مخرج، مثل إدخال تم تخطيه.

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
    لقطة إعدادات وقت التشغيل الحالية وعمليات كتابة الإعدادات المعاملاتية. فضّل
    الإعدادات التي مُررت بالفعل إلى مسار الاستدعاء النشط؛ استخدم
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

    يعيد `mutateConfigFile(...)` و`replaceConfigFile(...)` قيمة `followUp`
    مثل `{ mode: "restart", requiresRestart: true, reason }`،
    والتي تسجل نية الكاتب دون سحب التحكم في إعادة التشغيل من
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

    يعيد `runCommandWithTimeout(...)` قيمتي `stdout` و`stderr` الملتقطتين، وأعداد
    اقتطاع اختيارية، و`code`، و`signal`، و`killed`، و`termination`، و
    `noOutputTimedOut`. تُبلغ نتائج انتهاء المهلة وانتهاء مهلة عدم الإخراج عن `code: 124`
    عندما لا توفر العملية الفرعية رمز خروج غير صفري. لا تزال مخارج الإشارة
    غير المرتبطة بانتهاء المهلة قادرة على إرجاع `code: null`، لذلك استخدم `termination` و
    `noOutputTimedOut` للتمييز بين أسباب انتهاء المهلة.

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
    حل دليل الحالة وتخزين مفتاحي مدعوم بـ SQLite.

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

    تظل المخازن ذات المفاتيح موجودة بعد إعادة التشغيل، وتكون معزولة حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرّية: فهو يعيد `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون هناك قيمة نشطة موجودة بالفعل من دون الكتابة فوق قيمتها أو وقت إنشائها أو TTL الخاص بها. الحدود: `maxEntries` لكل مساحة أسماء، و6,000 صف نشط لكل Plugin، وقيم JSON أصغر من 64KB، وانتهاء صلاحية TTL اختياري. عندما تؤدي كتابة إلى تجاوز حد صفوف Plugin، قد يزيل وقت التشغيل أقدم الصفوف النشطة من مساحة الأسماء التي تجري الكتابة فيها؛ لا تُزال مساحات الأسماء الشقيقة بسبب تلك الكتابة، وتظل الكتابة تفشل إذا تعذّر على مساحة الأسماء تحرير عدد كافٍ من الصفوف.

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
    مساعدات وقت التشغيل الخاصة بالقنوات (متاحة عند تحميل Plugin قناة).

    `api.runtime.channel.media` هي الواجهة المفضلة لتنزيلات وسائط القناة وتخزينها:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    استخدم `saveRemoteMedia(...)` عندما ينبغي أن يصبح عنوان URL بعيد وسائط OpenClaw. استخدم `saveResponseMedia(...)` عندما يكون Plugin قد جلب بالفعل `Response` مع مصادقة أو إعادة توجيه أو معالجة قائمة سماح مملوكة لـ Plugin. استخدم `readRemoteMediaBuffer(...)` فقط عندما يحتاج Plugin إلى البايتات الخام للفحص أو التحويلات أو فك التشفير أو إعادة الرفع. يظل `fetchRemoteMedia(...)` اسمًا مستعارًا متوافقًا ومهملًا لـ `readRemoteMediaBuffer(...)`.

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

    لا يعرّض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل المسار المطبّع `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل للاستخدام خارج رد النداء `register`:

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. الصيغة ذات المستوى الأدنى `key` مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` العلوية الأخرى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

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
  مسجّل محدود النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء/إعداد خفيفة قبل الإدخال الكامل.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  يحل مسارًا نسبيًا إلى جذر Plugin.
</ParamField>

## ذات صلة

- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
