---
read_when:
    - تحتاج إلى استدعاء الدوال المساعدة الأساسية من Plugin (TTS وSTT وتوليد الصور وبحث الويب ووكيل فرعي والعُقد)
    - تريد فهم ما يتيحه api.runtime
    - أنت تصل إلى مساعدات الإعدادات أو الوكيل أو الوسائط من كود Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- مساعدات وقت التشغيل المحقونة المتاحة لـ Plugin
title: مساعدات وقت التشغيل لـ Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c968f30052ecba4359bdaa9b1c640c1220268933ce01ccef06bcade225b50b7d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

مرجع لكائن `api.runtime` الذي يُحقن في كل plugin أثناء التسجيل. استخدم هذه المساعدات بدلًا من استيراد الأجزاء الداخلية للمضيف مباشرة.

<CardGroup cols={2}>
  <Card title="plugins القنوات" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات في سياق plugins القنوات.
  </Card>
  <Card title="plugins المزوّدين" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات في سياق plugins المزوّدين.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## تحميل الإعدادات وكتابتها

فضّل الإعدادات التي مُرّرت بالفعل إلى مسار الاستدعاء النشط، مثل `api.config` أثناء التسجيل أو وسيط `cfg` في استدعاءات القنوات/المزوّدين. يُبقي هذا لقطة عملية واحدة متدفقة عبر العمل بدلًا من إعادة تحليل الإعدادات في المسارات الساخنة.

استخدم `api.runtime.config.current()` فقط عندما يحتاج معالج طويل العمر إلى لقطة العملية الحالية ولم تُمرَّر أي إعدادات إلى تلك الدالة. القيمة المُعادة للقراءة فقط؛ انسخها أو استخدم مساعد تعديل قبل التحرير.

تتلقى مصانع الأدوات `ctx.runtimeConfig` بالإضافة إلى `ctx.getRuntimeConfig()`. استخدم getter داخل استدعاء `execute` لأداة طويلة العمر عندما يمكن أن تتغير الإعدادات بعد إنشاء تعريف الأداة.

استمر في حفظ التغييرات باستخدام `api.runtime.config.mutateConfigFile(...)` أو `api.runtime.config.replaceConfigFile(...)`. يجب أن تختار كل كتابة سياسة `afterWrite` صريحة:

- `afterWrite: { mode: "auto" }` يترك لمقرر إعادة تحميل Gateway القرار.
- `afterWrite: { mode: "restart", reason: "..." }` يفرض إعادة تشغيل نظيفة عندما يعرف الكاتب أن إعادة التحميل الساخنة غير آمنة.
- `afterWrite: { mode: "none", reason: "..." }` يمنع إعادة التحميل/إعادة التشغيل التلقائية فقط عندما يملك المستدعي إجراء المتابعة.

تعيد مساعدات التعديل `afterWrite` بالإضافة إلى ملخص `followUp` مكتوب الأنواع بحيث يمكن للمستدعين تسجيل أو اختبار ما إذا كانوا قد طلبوا إعادة تشغيل. لا يزال Gateway يملك قرار متى تحدث إعادة التشغيل فعليًا.

`api.runtime.config.loadConfig()` و `api.runtime.config.writeConfigFile(...)` هما مساعدا توافق مهملان ضمن `runtime-config-load-write`. يُصدران تحذيرًا مرة واحدة في وقت التشغيل، ويظلان متاحين للـ plugins الخارجية القديمة أثناء نافذة الترحيل. يجب ألا تستخدمهما plugins المضمّنة؛ تفشل حراس حدود الإعدادات إذا استدعاها كود plugin أو استورد تلك المساعدات من مسارات فرعية في SDK الخاصة بالـ plugin.

بالنسبة إلى استيرادات SDK المباشرة، استخدم المسارات الفرعية المركّزة للإعدادات بدلًا من barrel التوافق الواسع
`openclaw/plugin-sdk/config-runtime`: استخدم `config-types` للأنواع، و`plugin-config-runtime` لتأكيدات الإعدادات المحمّلة مسبقًا والبحث عن مدخل plugin، و`runtime-config-snapshot` للقطات العملية الحالية، و`config-mutation` للكتابات. ينبغي لاختبارات plugins المضمّنة أن تحاكي هذه المسارات الفرعية المركّزة مباشرة بدلًا من محاكاة barrel التوافق الواسع.

لكود وقت تشغيل OpenClaw الداخلي الاتجاه نفسه: حمّل الإعدادات مرة واحدة عند حدود CLI أو Gateway أو العملية، ثم مرّر تلك القيمة عبر المسار. كتابات التعديل الناجحة تحدّث لقطة وقت تشغيل العملية وتزيد مراجعتها الداخلية؛ ينبغي للذاكرات المؤقتة طويلة العمر أن تستخدم مفتاح التخزين المؤقت المملوك لوقت التشغيل بدلًا من تسلسل الإعدادات محليًا. تحتوي وحدات وقت التشغيل طويلة العمر على ماسح بلا تسامح مع استدعاءات `loadConfig()` المحيطة؛ استخدم `cfg` مُمرّرًا، أو `context.getRuntimeConfig()` للطلب، أو `getRuntimeConfig()` عند حد عملية صريح.

يجب أن تستخدم مسارات تنفيذ المزوّد والقناة لقطة إعدادات وقت التشغيل النشطة، وليس لقطة ملف أُعيدت لقراءة الإعدادات أو تحريرها. تحتفظ لقطات الملفات بقيم المصدر مثل علامات SecretRef لواجهة المستخدم والكتابات؛ تحتاج استدعاءات المزوّدين إلى عرض وقت التشغيل المحلول. عندما قد يُستدعى مساعد إما بلقطة المصدر النشطة أو بلقطة وقت التشغيل النشطة، مرّر عبر `selectApplicableRuntimeConfig()` قبل قراءة بيانات الاعتماد.

## مساحات أسماء وقت التشغيل

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هوية الوكيل، الأدلة، وإدارة الجلسات.

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

    `runEmbeddedAgent(...)` هو المساعد المحايد لبدء دورة وكيل OpenClaw عادية من كود plugin. يستخدم اختيار المزوّد/النموذج نفسه واختيار حاضنة الوكيل نفسه مثل الردود التي تُشغّلها القنوات.

    يظل `runEmbeddedPiAgent(...)` اسمًا بديلًا للتوافق.

    يعيد `resolveThinkingPolicy(...)` مستويات التفكير المدعومة للمزوّد/النموذج والقيمة الافتراضية الاختيارية. تملك plugins المزوّدين الملف الشخصي الخاص بالنموذج من خلال hooks التفكير الخاصة بها، لذلك ينبغي لـ plugins الأدوات استدعاء مساعد وقت التشغيل هذا بدلًا من استيراد قوائم المزوّدين أو تكرارها.

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

    فضّل `updateSessionStore(...)` أو `updateSessionStoreEntry(...)` لكتابات وقت التشغيل. فهي تمر عبر كاتب مخزن الجلسات المملوك لـ Gateway، وتحافظ على التحديثات المتزامنة، وتعيد استخدام التخزين المؤقت الساخن. يظل `saveSessionStore(...)` متاحًا للتوافق وإعادة الكتابة بأسلوب الصيانة دون اتصال.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضية:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    شغّل وأدر تشغيلات وكلاء فرعيين في الخلفية.

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
    تتطلب تجاوزات النموذج (`provider`/`model`) موافقة المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. لا تزال plugins غير الموثوقة قادرة على تشغيل وكلاء فرعيين، لكن تُرفض طلبات التجاوز.
    </Warning>

    يمكن لـ `deleteSession(...)` حذف الجلسات التي أنشأها plugin نفسه عبر `api.runtime.subagent.run(...)`. لا يزال حذف جلسات المستخدم أو المشغّل التعسفية يتطلب طلب Gateway بنطاق إداري.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اسرد Nodes المتصلة واستدعِ أمرًا مستضافًا على Node من كود plugin المحمّل بواسطة Gateway أو من أوامر CLI الخاصة بـ plugin. استخدم هذا عندما يملك plugin عملًا محليًا على جهاز مقترن، مثل جسر متصفح أو صوت على Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway يكون وقت التشغيل هذا داخل العملية. في أوامر CLI الخاصة بـ plugin يستدعي Gateway المُعدّ عبر RPC، لذلك يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص Nodes المقترنة من الطرفية. لا تزال أوامر Node تمر عبر اقتران Node العادي في Gateway، وقوائم السماح للأوامر، وسياسات plugin لاستدعاء Node، ومعالجة الأوامر المحلية على Node.

    ينبغي للـ plugins التي تكشف أوامر خطرة مستضافة على Node أن تسجل سياسة استدعاء Node باستخدام `api.registerNodeInvokePolicy(...)`. تعمل السياسة في Gateway بعد فحوصات قائمة السماح للأوامر وقبل توجيه الأمر إلى Node، لذلك تشترك استدعاءات `node.invoke` المباشرة وأدوات plugin الأعلى مستوى في مسار الإنفاذ نفسه.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    اربط وقت تشغيل Task Flow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق، ثم أنشئ وأدر Task Flows دون تمرير مالك في كل استدعاء.

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

    استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تربطه من إدخال مستخدم خام.

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

    يستخدم إعدادات `messages.tts` الأساسية واختيار المزوّد. يعيد مخزن صوت PCM ومعدل العينة.

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

    يُرجع `{ text: undefined }` عندما لا يُنتج أي خرج (مثلًا: الإدخال المتجاوز).

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
    لقطة إعدادات وقت التشغيل الحالية وكتابات الإعدادات المعاملاتية. فضّل
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
    مثل `{ mode: "restart", requiresRestart: true, reason }`،
    التي تسجل نية الكاتب من دون سحب التحكم في إعادة التشغيل من
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
    حل دليل الحالة وتخزين بمفاتيح مدعوم بـ SQLite.

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

    تبقى المخازن ذات المفاتيح بعد إعادة التشغيل وتُعزل حسب معرّف Plugin المرتبط بوقت التشغيل. استخدم `registerIfAbsent(...)` لمطالبات إزالة التكرار الذرية: فهي تعيد `true` عندما يكون المفتاح مفقودًا أو منتهي الصلاحية وتم تسجيله، أو `false` عندما تكون قيمة حيّة موجودة بالفعل من دون استبدال قيمتها أو وقت إنشائها أو مدة صلاحيتها. الحدود: `maxEntries` لكل مساحة أسماء، و1,000 صف حي لكل Plugin، وقيم JSON أقل من 64KB، وانتهاء صلاحية اختياري عبر TTL.

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
    مساعدات وقت تشغيل خاصة بالقناة (متاحة عندما يكون Plugin قناة محمّلًا).

    `api.runtime.channel.mentions` هو سطح سياسة الإشارة الواردة المشترك لـ Plugins القنوات المضمّنة التي تستخدم حقن وقت التشغيل:

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

    لا يعرّض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل المسار الموحّد `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل لاستخدامه خارج رد نداء `register`:

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
فضّل `pluginId` لهوية مخزن وقت التشغيل. الصيغة الأدنى مستوى `key` مخصصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة وقت تشغيل واحدة.
</Note>

## حقول `api` علوية أخرى

إلى جانب `api.runtime`، يوفر كائن API أيضًا:

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
  حل مسار بالنسبة إلى جذر Plugin.
</ParamField>

## ذات صلة

- [داخليات Plugin](/ar/plugins/architecture) — نموذج القدرات والسجل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
