---
read_when:
    - تحتاج إلى استدعاء مساعدات النواة من Plugin (تحويل النص إلى كلام، وتحويل الكلام إلى نص، وتوليد الصور، والبحث على الويب، والوكيل الفرعي، والعُقد)
    - تريد فهم ما يتيحه api.runtime
    - أنت تصل إلى مساعدات التكوين أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة المتاحة للإضافات
title: مساعدات وقت التشغيل لـ Plugin
x-i18n:
    generated_at: "2026-07-04T20:33:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل Plugin أثناء التسجيل. استخدم هذه الأدوات المساعدة بدلًا من استيراد الأجزاء الداخلية للمضيف مباشرة.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق Plugin القنوات.
  </Card>
  <Card title="Provider plugins" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه الأدوات المساعدة في سياق Plugin المزوّدين.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل الإعدادات وكتابتها

فضّل الإعدادات التي مُرّرت بالفعل إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيطة `cfg` في استدعاءات القناة/المزوّد. هذا يُبقي لقطة عملية واحدة متدفقة عبر العمل بدلًا من إعادة تحليل الإعدادات في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم تُمرَّر أي إعدادات إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم أداة مساعدة للتعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` بالإضافة إلى `ctx.getRuntimeConfig()`. استخدم الجالب داخل رد نداء `execute` لأداة طويلة العمر عندما يمكن أن تتغير الإعدادات بعد إنشاء تعريف الأداة.

احفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل كتابة سياسة `afterWrite` صريحة:

- يتيح `afterWrite: { mode: "auto" }` لمُعيد تحميل Gateway المخطط اتخاذ القرار.
- يفرض `afterWrite: { mode: "restart", reason: "..." }` إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- يمنع `afterWrite: { mode: "none", reason: "..." }` إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي المتابعة.

تُعيد أدوات التعديل المساعدة `afterWrite` بالإضافة إلى ملخص `followUp` مُنمذج حتى يتمكن المستدعون من التسجيل أو الاختبار لمعرفة ما إذا كانوا قد طلبوا إعادة تشغيل. يظل Gateway هو المالك لتوقيت حدوث إعادة التشغيل فعليًا.

تم إهمال `api.runtime.config.loadConfig()` و`api.runtime.config.writeConfigFile(...)` كأدوات توافق مساعدة ضمن `runtime-config-load-write`. تُصدر تحذيرًا مرة واحدة أثناء وقت التشغيل، وتظل متاحة للـ Plugin الخارجية القديمة خلال نافذة الترحيل. يجب ألا تستخدمها Plugin المضمّنة؛ تفشل حواجز حدود الإعدادات إذا استدعاها كود Plugin أو استورد تلك الأدوات المساعدة من مسارات Plugin SDK الفرعية.

للاستيرادات المباشرة من SDK، استخدم مسارات الإعدادات الفرعية المركزة بدلًا من برميل التوافق الواسع
`openclaw/plugin-sdk/config-runtime`: استخدم `config-contracts` للأنواع،
و`plugin-config-runtime` لتأكيدات الإعدادات المحمّلة مسبقًا وبحث إدخالات Plugin،
و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات.
ينبغي لاختبارات Plugin المضمّنة أن تحاكي هذه المسارات الفرعية المركزة مباشرة
بدلًا من محاكاة برميل التوافق الواسع.

يتبع كود وقت تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل الإعدادات مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرّر تلك القيمة عبر المسار. تحدّث كتابات التعديل الناجحة لقطة وقت تشغيل العملية وتقدّم مراجعتها الداخلية؛ ينبغي لذاكرات التخزين المؤقت طويلة العمر أن تستخدم مفتاح التخزين المؤقت المملوك لوقت التشغيل بدلًا من تسلسل الإعدادات محليًا. لدى وحدات وقت التشغيل طويلة العمر ماسح بلا تسامح لاستدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` ممررة، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ المزوّد والقناة لقطة إعدادات وقت التشغيل النشطة، وليس لقطة ملف مُعادة لقراءة الإعدادات أو تحريرها. تحفظ لقطات الملفات قيم المصدر مثل علامات SecretRef للواجهة والكتابات؛ تحتاج استدعاءات المزوّد إلى عرض وقت التشغيل المحلول. عندما يمكن استدعاء أداة مساعدة إما بلقطة المصدر النشطة أو لقطة وقت التشغيل النشطة، مرّر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## أدوات وقت التشغيل القابلة لإعادة الاستخدام

استخدم حقائق `botLoopProtection` الواردة للرسائل الواردة المنشأة بواسطة البوت. يطبّق النواة حارس النافذة المنزلقة المشترك داخل الذاكرة قبل سجل الجلسة والإرسال، من دون ربط السياسة بقناة واحدة. يتتبع الحارس مفاتيح `(scopeId, conversationId, participant pair)`، ويحسب كلا اتجاهي الزوج معًا، ويطبّق فترة تهدئة بمجرد تجاوز ميزانية النافذة، ويزيل الإدخالات غير النشطة انتهازيًا.

ينبغي لـ Plugin القنوات التي تعرض هذا السلوك للمشغلين أن تفضّل شكل `channels.defaults.botLoopProtection` المشترك لميزانيات الأساس، ثم تضع تجاوزات خاصة بالقناة/المزوّد فوقه. تستخدم الإعدادات المشتركة الثواني لأنها موجهة للمستخدم:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

مرّر حقائق زوج البوت المُطبّعة مع الدور المحلول. يحل النواة القيم الافتراضية، وتحويل الوحدات، ودلالات `enabled`:

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

استخدم `openclaw/plugin-sdk/pair-loop-guard-runtime` مباشرة فقط لحلقات أحداث
مخصصة بين طرفين لا تمر عبر مشغّل الردود الواردة المشترك.

## فضاءات أسماء وقت التشغيل

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

    `runEmbeddedAgent(...)` هو الأداة المساعدة المحايدة لبدء دور وكيل OpenClaw عادي من كود Plugin. يستخدم المسار نفسه لحل المزوّد/النموذج واختيار حاضنة الوكيل مثل الردود التي تطلقها القنوات.

    يظل `runEmbeddedPiAgent(...)` اسمًا مستعارًا مهملًا للتوافق مع Plugin الحالية. ينبغي للكود الجديد استخدام `runEmbeddedAgent(...)`.

    يُعيد `resolveThinkingPolicy(...)` مستويات التفكير المدعومة للمزوّد/النموذج والقيمة الافتراضية الاختيارية. تملك Plugin المزوّد ملف التعريف الخاص بالنموذج عبر خطافات التفكير لديها، لذلك ينبغي لـ Plugin الأدوات استدعاء أداة وقت التشغيل المساعدة هذه بدلًا من استيراد قوائم المزوّدين أو تكرارها.

    يحوّل `normalizeThinkingLevel(...)` نص المستخدم مثل `on` أو `x-high` أو `extra high` إلى المستوى المخزن المعياري قبل التحقق منه مقابل السياسة المحلولة.

    **أدوات مخزن الجلسات المساعدة** تقع ضمن `api.runtime.agent.session`:

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    فضّل `getSessionEntry(...)` أو `listSessionEntries(...)` أو `patchSessionEntry(...)` أو `upsertSessionEntry(...)` لسير عمل الجلسات. تعالج هذه الأدوات المساعدة الجلسات بحسب هوية الوكيل/الجلسة حتى لا تعتمد Plugin على شكل تخزين `sessions.json` القديم. استخدم `preserveActivity: true` للتعديلات الخاصة بالبيانات الوصفية فقط التي لا ينبغي أن تحدّث نشاط الجلسة، و`replaceEntry: true` فقط عندما يعيد رد النداء إدخالًا كاملًا ويجب أن تبقى الحقول المحذوفة محذوفة.

    استخدم `runWithWorkAdmission(...)` عندما تبدأ Plugin عملًا على جلسة محفوظة. يرفض رد النداء الجلسات المؤرشفة أو المستبدلة بالتزامن، ويحافظ على تنسيق طفرات الأرشفة/إعادة الضبط/الحذف عبر الإكمال، ويتلقى `AbortSignal` يجب تمريره إلى تشغيل الوكيل.

    لقراءات النصوص وكتابتها، استورد `openclaw/plugin-sdk/session-transcript-runtime` واستخدم `resolveSessionTranscriptIdentity(...)` أو `resolveSessionTranscriptTarget(...)` أو `readSessionTranscriptEvents(...)` أو `appendSessionTranscriptMessageByIdentity(...)` أو `publishSessionTranscriptUpdateByIdentity(...)` أو `withSessionTranscriptWriteLock(...)` مع `{ agentId, sessionKey, sessionId }`. تتيح هذه الواجهات لـ Plugin تحديد نص جلسة، وقراءة أحداثه، وإلحاق رسائل، ونشر تحديثات، وتشغيل عمليات ذات صلة تحت قفل كتابة النص نفسه. تم إهمال تمرير `sessionFile`، أو استخدام `resolveSessionTranscriptLegacyFileTarget(...)`، أو استيراد `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` منخفضي المستوى من `openclaw/plugin-sdk/agent-harness-runtime`؛ توجد تلك المسارات فقط للكود القديم الذي يتلقى بالفعل أثر نص نشطًا.

    `loadSessionStore(...)` و`saveSessionStore(...)` و`updateSessionStore(...)` و`resolveSessionFilePath(...)` و`resolveAndPersistSessionFile(...)` هي أدوات توافق مساعدة مهملة لـ Plugin التي لا تزال تعتمد عمدًا على شكل المتجر الكامل القديم أو ملف النص. يجب ألا يستخدم كود Plugin الجديد هذه الأدوات المساعدة، وينبغي للمستدعين الحاليين الترحيل إلى أدوات الإدخال المساعدة وأدوات هوية النص المساعدة.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    شغّل إكمال نص مملوكًا للمضيف من دون استيراد الأجزاء الداخلية للمزوّد أو
    تكرار إعداد نموذج OpenClaw/المصادقة/عنوان URL الأساسي.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    تستخدم الأداة المساعدة مسار إعداد الإكمال البسيط نفسه مثل وقت التشغيل
    المضمّن في OpenClaw ولقطة إعدادات وقت التشغيل المملوكة للمضيف. تتلقى محركات السياق
    إمكانية `llm.complete` مرتبطة بالجلسة، لذلك تستخدم استدعاءات النموذج
    وكيل الجلسة النشطة ولا تعود بصمت إلى الوكيل الافتراضي. تتضمن
    النتيجة إسناد المزوّد/النموذج/الوكيل بالإضافة إلى استخدام الرموز المميزّة
    وذاكرة التخزين المؤقت والتكلفة المقدّرة عند توفرها.

    <Warning>
    تتطلب تجاوزات النموذج موافقة المشغّل عبر `plugins.entries.<id>.llm.allowModelOverride: true` في الإعدادات. استخدم `plugins.entries.<id>.llm.allowedModels` لتقييد Plugins الموثوقة بأهداف `provider/model` القانونية المحددة. تتطلب الإكمالات العابرة للوكلاء `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    شغّل وأدر عمليات الوكلاء الفرعيين في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) موافقة المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. لا تزال Plugins غير الموثوقة قادرة على تشغيل وكلاء فرعيين، لكن طلبات التجاوز تُرفض.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأتها Plugin نفسها عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدم أو المشغّل العشوائية يتطلب طلب Gateway بنطاق إداري.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد العقد المتصلة واستدعِ أمرًا مستضافًا على عقدة من كود Plugin المحمّل عبر Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما تمتلك Plugin عملًا محليًا على جهاز مقترن، مثل جسر متصفح أو صوت على جهاز Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يعمل هذا التشغيل ضمن العملية نفسها. وفي أوامر CLI الخاصة بـ Plugin، يستدعي Gateway المضبوط عبر RPC، لذا يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص العقد المقترنة من الطرفية. لا تزال أوامر Node تمر عبر الاقتران العادي لعقد Gateway، وقوائم السماح بالأوامر، وسياسات استدعاء العقد الخاصة بـ Plugin، ومعالجة الأوامر المحلية للعقدة.

    يجب على Plugins التي تكشف أوامر خطرة مستضافة على العقدة تسجيل سياسة استدعاء عقدة باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة السماح بالأوامر وقبل تمرير الأمر إلى العقدة، بحيث تشترك استدعاءات `node.invoke` المباشرة وأدوات Plugin الأعلى مستوى في مسار الإنفاذ نفسه.

    <Warning>
    يطلب الحقل الاختياري `scopes` نطاقات مشغّل Gateway للاستدعاء. يلتزم OpenClaw به فقط مع Plugins المضمنة وتثبيتات Plugin الرسمية الموثوقة؛ ولا ترفع الطلبات الصادرة من Plugins أخرى صلاحيات الاستدعاء. استخدمه فقط عندما يتعين على Plugin موثوقة استدعاء أمر عقدة بنطاق Gateway أكثر صرامة، مثل `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط وقت تشغيل تدفق المهام بمفتاح جلسة OpenClaw موجود أو سياق أداة موثوق، ثم أنشئ تدفقات المهام وأدرها دون تمرير مالك في كل استدعاء.

    يتتبع تدفق المهام حالة سير عمل متينة متعددة الخطوات. ليس مجدولًا:
    استخدم Cron أو `api.session.workflow.scheduleSessionTurn(...)` للتنبيهات المستقبلية،
    ثم استخدم `managedFlows` من الدور المجدول عندما يحتاج ذلك العمل إلى
    حالة تدفق أو مهام فرعية أو انتظار أو إلغاء.

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

    يعيد `{ text: undefined }` عندما لا يُنتج أي مخرج (مثلًا عند تخطي الإدخال).

    <Info>
    يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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
    لقطة إعدادات وقت التشغيل الحالية وكتابات إعدادات معاملية. فضّل
    الإعدادات التي مُررت بالفعل إلى مسار الاستدعاء النشط؛ واستخدم
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

    يعيد `mutateConfigFile(...)` و `replaceConfigFile(...)` قيمة `followUp`،
    على سبيل المثال `{ mode: "restart", requiresRestart: true, reason }`،
    والتي تسجل قصد الكاتب دون سحب التحكم في إعادة التشغيل من
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

    يعيد `runCommandWithTimeout(...)` قيم `stdout` و `stderr` الملتقطة، وعدّادات
    اقتطاع اختيارية، و `code`، و `signal`، و `killed`، و `termination`، و
    `noOutputTimedOut`. تبلغ نتائج انتهاء المهلة وانتهاء مهلة عدم وجود مخرجات عن `code: 124`
    عندما لا توفر العملية الفرعية رمز خروج غير صفري. يمكن لخروج الإشارة
    غير الناتج عن انتهاء المهلة أن يعيد `code: null`، لذا استخدم `termination` و
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
    حلّ دليل الحالة والتخزين بالمفاتيح المدعوم بـ SQLite.

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

    تبقى المخازن ذات المفاتيح بعد إعادة التشغيل، وتُعزل حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرّية: فهي تعيد `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون هناك قيمة نشطة موجودة بالفعل من دون استبدال قيمتها أو وقت إنشائها أو مدة TTL الخاصة بها. الحدود: `maxEntries` لكل مساحة أسماء، و6,000 صف نشط لكل Plugin، وقيم JSON أقل من 64 كيلوبايت، وانتهاء صلاحية TTL اختياري. عندما تؤدي عملية كتابة إلى تجاوز سقف صفوف Plugin، قد يزيل وقت التشغيل أقدم الصفوف النشطة من مساحة الأسماء التي تُكتب إليها؛ ولا تُزال مساحات الأسماء الشقيقة بسبب تلك الكتابة، وتظل الكتابة تفشل إذا لم تتمكن مساحة الأسماء من تحرير عدد كافٍ من الصفوف.

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

    `api.runtime.channel.media` هي الواجهة المفضلة لتنزيل وسائط القناة وتخزينها:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    استخدم `saveRemoteMedia(...)` عندما يجب أن يصبح عنوان URL بعيد وسائط OpenClaw. استخدم `saveResponseMedia(...)` عندما يكون Plugin قد جلب بالفعل `Response` مع معالجة المصادقة أو إعادة التوجيه أو قائمة السماح المملوكة لـ Plugin. استخدم `readRemoteMediaBuffer(...)` فقط عندما يحتاج Plugin إلى البايتات الخام للفحص أو التحويلات أو فك التشفير أو إعادة الرفع. يظل `fetchRemoteMedia(...)` اسمًا مستعارًا متوافقًا ومهملًا لـ `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` هي واجهة سياسة الإشارة الواردة المشتركة لـ Plugins القنوات المضمّنة التي تستخدم حقن وقت التشغيل:

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

    لا تعرض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل مسار `{ facts, policy }` المطبّع.

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. صيغة `key` ذات المستوى الأدنى مخصّصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` علوية أخرى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

<ParamField path="api.id" type="string">
  معرّف Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  اسم عرض Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  لقطة الإعداد الحالية (لقطة وقت التشغيل النشطة في الذاكرة عند توفرها).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  إعداد خاص بـ Plugin من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجّل محدود النطاق (`debug`، `info`، `warn`، `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ `"setup-runtime"` هو نافذة بدء التشغيل/الإعداد الخفيفة قبل الدخول الكامل.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حلّ مسار نسبيًا إلى جذر Plugin.
</ParamField>

## ذات صلة

- [داخليات Plugin](/ar/plugins/architecture) — نموذج الإمكانات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
