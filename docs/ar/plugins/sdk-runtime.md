---
read_when:
    - تحتاج إلى استدعاء مساعدات النواة من Plugin (تحويل النص إلى كلام، وتحويل الكلام إلى نص، وتوليد الصور، والبحث على الويب، ووكيل فرعي، وNodes)
    - تريد فهم ما الذي يتيحه `api.runtime`
    - أنت تصل إلى مساعدات الإعدادات أو الوكيل أو الوسائط من داخل كود Plugin
sidebarTitle: Runtime helpers
summary: '`api.runtime` -- مساعدات وقت التشغيل المحقونة المتاحة لـ Plugins'
title: مساعدات وقت التشغيل الخاصة بـ Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

مرجع لكائن `api.runtime` الذي يتم حقنه في كل Plugin أثناء التسجيل. استخدم هذه المساعدات بدلًا من استيراد الأجزاء الداخلية للمضيف مباشرةً.

<CardGroup cols={2}>
  <Card title="Plugins القنوات" href="/ar/plugins/sdk-channel-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات ضمن السياق الخاص بـ Plugins القنوات.
  </Card>
  <Card title="Plugins المزوّد" href="/ar/plugins/sdk-provider-plugins">
    دليل خطوة بخطوة يستخدم هذه المساعدات ضمن السياق الخاص بـ Plugins المزوّد.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## مساحات أسماء Runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    هوية الوكيل، والأدلة، وإدارة الجلسات.

    ```typescript
    // تحديد دليل العمل الخاص بالوكيل
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // تحديد مساحة عمل الوكيل
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // الحصول على هوية الوكيل
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // الحصول على مستوى التفكير الافتراضي
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // الحصول على مهلة الوكيل
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // التأكد من وجود مساحة العمل
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // تشغيل دورة وكيل مضمّنة
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "لخّص أحدث التغييرات",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` هي المساعدة المحايدة لبدء دورة وكيل OpenClaw عادية من داخل كود Plugin. وهي تستخدم نفس آلية تحديد المزوّد/النموذج واختيار حزمة الوكيل المستخدمة في الردود التي تُحفَّز عبر القنوات.

    لا تزال `runEmbeddedPiAgent(...)` متاحة كاسم بديل للتوافق.

    **مساعدات مخزن الجلسات** موجودة تحت `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ثوابت النموذج والمزوّد الافتراضيين:

    ```typescript
    const model = api.runtime.agent.defaults.model; // على سبيل المثال "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // على سبيل المثال "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    تشغيل وإدارة عمليات الوكيل الفرعي في الخلفية.

    ```typescript
    // بدء تشغيل وكيل فرعي
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "وسّع هذا الاستعلام إلى عمليات بحث متابعة مركّزة.",
      provider: "openai", // تجاوز اختياري
      model: "gpt-4.1-mini", // تجاوز اختياري
      deliver: false,
    });

    // انتظار الاكتمال
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // قراءة رسائل الجلسة
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // حذف جلسة
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    تتطلب عمليات تجاوز النموذج (`provider`/`model`) موافقة صريحة من المشغّل عبر `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات. لا يزال بإمكان Plugins غير الموثوقة تشغيل وكلاء فرعيين، لكن طلبات التجاوز تُرفض.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    اعرض Nodes المتصلة واستدعِ أمرًا مستضافًا على Node من داخل كود Plugin المحمّل عبر Gateway أو من أوامر CLI الخاصة بـ Plugin. استخدم هذا عندما يملك Plugin عملًا محليًا على جهاز مقترن، مثل متصفح أو جسر صوتي على Mac آخر.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    داخل Gateway، تعمل Runtime هذه ضمن العملية نفسها. وفي أوامر CLI الخاصة بـ Plugin، فإنها تستدعي Gateway المهيّأة عبر RPC، بحيث يمكن لأوامر مثل `openclaw googlemeet recover-tab` فحص Nodes المقترنة من الطرفية. وتظل أوامر Node تمر عبر اقتران Nodes العادي في Gateway، وقوائم السماح الخاصة بالأوامر، ومعالجة الأوامر المحلية على Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    اربط Runtime لـ TaskFlow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق، ثم أنشئ وأدر TaskFlow من دون تمرير مالك في كل استدعاء.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "راجع طلبات السحب الجديدة",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "راجع طلب السحب #123",
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

    استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تقم بالربط انطلاقًا من إدخال مستخدم خام.

  </Accordion>
  <Accordion title="api.runtime.tts">
    توليف تحويل النص إلى كلام.

    ```typescript
    // TTS قياسي
    const clip = await api.runtime.tts.textToSpeech({
      text: "مرحبًا من OpenClaw",
      cfg: api.config,
    });

    // TTS محسّن للاتصالات الهاتفية
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "مرحبًا من OpenClaw",
      cfg: api.config,
    });

    // عرض الأصوات المتاحة
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    يستخدم إعدادات `messages.tts` الأساسية وآلية اختيار المزوّد. ويُرجع مخزنًا مؤقتًا لصوت PCM مع معدل العيّنة.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    تحليل الصور والصوت والفيديو.

    ```typescript
    // وصف صورة
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // نسخ صوتي
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // اختياري، عندما يتعذر استنتاج MIME
    });

    // وصف فيديو
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // تحليل ملف عام
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    يُرجع `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (مثلًا عند تخطي الإدخال).

    <Info>
    لا تزال `api.runtime.stt.transcribeAudioFile(...)` متاحة كاسم بديل للتوافق مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    توليد الصور.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "روبوت يرسم غروبًا",
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
    تحميل الإعدادات وكتابتها.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    أدوات مساعدة على مستوى النظام.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
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
    تحديد مصادقة النموذج والمزوّد.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    تحديد دليل الحالة.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    مُنشئات أدوات الذاكرة وCLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    مساعدات Runtime الخاصة بالقنوات (متاحة عند تحميل Plugin قناة).

    `api.runtime.channel.mentions` هي واجهة سياسة الإشارات المشتركة الواردة لـ Plugins القنوات المضمّنة التي تستخدم الحقن عبر Runtime:

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

    لا تكشف `api.runtime.channel.mentions` عمدًا عن مساعدات التوافق الأقدم `resolveMentionGating*`. فضّل المسار الموحّد `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## تخزين مراجع Runtime

استخدم `createPluginRuntimeStore` لتخزين مرجع Runtime لاستخدامه خارج رد النداء `register`:

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
  <Step title="ربطه بنقطة الإدخال">
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
  <Step title="الوصول إليه من ملفات أخرى">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // يطلق خطأ إذا لم تتم التهيئة
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // يعيد null إذا لم تتم التهيئة
    }
    ```

  </Step>
</Steps>

<Note>
فضّل `pluginId` لهوية runtime-store. صيغة `key` ذات المستوى الأدنى مخصّصة للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة Runtime واحدة.
</Note>

## حقول `api` الأخرى ذات المستوى الأعلى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

<ParamField path="api.id" type="string">
  معرّف Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  الاسم المعروض لـ Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  لقطة الإعدادات الحالية (لقطة Runtime النشطة داخل الذاكرة عند توفرها).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  إعدادات Plugin الخاصة من `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  مسجل مقيّد النطاق (`debug` و`info` و`warn` و`error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  وضع التحميل الحالي؛ و`"setup-runtime"` هي نافذة بدء التشغيل/الإعداد الخفيفة التي تسبق الإدخال الكامل.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  حدّد مسارًا نسبةً إلى جذر Plugin.
</ParamField>

## ذو صلة

- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — نموذج الإمكانات والسجل
- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry`
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع المسارات الفرعية
