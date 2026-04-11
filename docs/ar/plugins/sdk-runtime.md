---
read_when:
    - أنت بحاجة إلى استدعاء مساعدات النواة من إضافة (TTS وSTT وتوليد الصور والبحث على الويب وsubagent)
    - أنت تريد فهم ما الذي يتيحه `api.runtime`
    - أنت تصل إلى مساعدات الإعدادات أو العامل أو الوسائط من داخل كود الإضافة
sidebarTitle: Runtime Helpers
summary: '`api.runtime` -- مساعدات وقت التشغيل المحقونة المتاحة للإضافات'
title: مساعدات وقت تشغيل الإضافات
x-i18n:
    generated_at: "2026-04-11T02:47:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf8a6ecd970300f784b8aca20eed40ba12c83107abd27385bfdc3347d2544be
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# مساعدات وقت تشغيل الإضافات

مرجع لكائن `api.runtime` الذي يُحقن في كل إضافة أثناء
التسجيل. استخدم هذه المساعدات بدلًا من استيراد العناصر الداخلية للمضيف مباشرة.

<Tip>
  **هل تبحث عن شرح عملي؟** راجع [إضافات القنوات](/ar/plugins/sdk-channel-plugins)
  أو [إضافات الموفّرين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة
  تُظهر هذه المساعدات ضمن السياق.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## مساحات أسماء وقت التشغيل

### `api.runtime.agent`

هوية العامل، والأدلة، وإدارة الجلسات.

```typescript
// حل دليل عمل العامل
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// حل مساحة عمل العامل
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// الحصول على هوية العامل
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// الحصول على مستوى التفكير الافتراضي
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// الحصول على مهلة العامل
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// التأكد من وجود مساحة العمل
await api.runtime.agent.ensureAgentWorkspace(cfg);

// تشغيل دورة عامل مضمّن
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

يُعد `runEmbeddedAgent(...)` المساعد المحايد لبدء دورة عامل OpenClaw
عادية من داخل كود الإضافة. ويستخدم نفس آلية حل الموفّر/النموذج واختيار
حزمة العامل المستخدمة في الردود التي تُشغَّل من القنوات.

يبقى `runEmbeddedPiAgent(...)` اسمًا مستعارًا للتوافق.

**مساعدات مخزن الجلسات** موجودة تحت `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ثوابت النموذج والموفّر الافتراضية:

```typescript
const model = api.runtime.agent.defaults.model; // مثال: "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // مثال: "anthropic"
```

### `api.runtime.subagent`

تشغيل وإدارة عمليات subagent في الخلفية.

```typescript
// بدء تشغيل subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "وسّع هذا الاستعلام إلى عمليات بحث متابعة أكثر تركيزًا.",
  provider: "openai", // تجاوز اختياري
  model: "gpt-4.1-mini", // تجاوز اختياري
  deliver: false,
});

// الانتظار حتى الاكتمال
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
  تتطلب تجاوزات النموذج (`provider`/`model`) اشتراكًا صريحًا من المشغّل عبر
  `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات.
  لا تزال الإضافات غير الموثوقة قادرة على تشغيل subagents، لكن طلبات التجاوز تُرفَض.
</Warning>

### `api.runtime.taskFlow`

اربط وقت تشغيل Task Flow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق،
ثم أنشئ Task Flows وأدرها من دون تمرير مالك في كل استدعاء.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "مراجعة طلبات السحب الجديدة",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "راجع PR #123",
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

استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل
مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تربط انطلاقًا من
إدخال مستخدم خام.

### `api.runtime.tts`

تحويل النص إلى كلام.

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

// إدراج الأصوات المتاحة
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

يستخدم إعدادات `messages.tts` الأساسية واختيار الموفّر. ويُرجع مخزنًا مؤقتًا
لصوت PCM + معدل العينة.

### `api.runtime.mediaUnderstanding`

تحليل الصور والصوت والفيديو.

```typescript
// وصف صورة
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// نسخ صوت إلى نص
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // اختياري، عندما لا يمكن استنتاج MIME
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

يُرجع `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (مثل إدخال تم تخطيه).

<Info>
  يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق
  لـ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

توليد الصور.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "روبوت يرسم غروب الشمس",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

البحث على الويب.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

أدوات وسائط منخفضة المستوى.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

تحميل الإعدادات وكتابتها.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

أدوات مساعدة على مستوى النظام.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

اشتراكات الأحداث.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

التسجيل.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

حل مصادقة النموذج والموفّر.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

حل دليل الحالة.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

مصانع أدوات الذاكرة وCLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

مساعدات وقت تشغيل خاصة بالقناة (متاحة عند تحميل إضافة قناة).

يُعد `api.runtime.channel.mentions` سطح سياسة الإشارة الواردة المشتركة
لإضافات القنوات المضمّنة التي تستخدم حقن وقت التشغيل:

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

لا يكشف `api.runtime.channel.mentions` عمدًا عن مساعدات التوافق الأقدم
`resolveMentionGating*`. ويفضَّل استخدام المسار المطبّع
`{ facts, policy }`.

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل من أجل استخدامه خارج
دالة الاستدعاء `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("لم يتم تهيئة وقت تشغيل my-plugin");

// في نقطة الدخول الخاصة بك
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "مثال",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// في ملفات أخرى
export function getRuntime() {
  return store.getRuntime(); // يرمي خطأ إذا لم تتم التهيئة
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // يُرجع null إذا لم تتم التهيئة
}
```

## حقول `api` الأخرى ذات المستوى الأعلى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

| الحقل | النوع | الوصف |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | معرّف الإضافة |
| `api.name` | `string` | الاسم المعروض للإضافة |
| `api.config` | `OpenClawConfig` | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها) |
| `api.pluginConfig` | `Record<string, unknown>` | إعدادات خاصة بالإضافة من `plugins.entries.<id>.config` |
| `api.logger` | `PluginLogger` | مسجّل بنطاق محدد (`debug` و`info` و`warn` و`error`) |
| `api.registrationMode` | `PluginRegistrationMode` | وضع التحميل الحالي؛ تمثّل `"setup-runtime"` نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string` | حل مسار نسبةً إلى جذر الإضافة |

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- مرجع المسارات الفرعية
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) -- خيارات `definePluginEntry`
- [الأجزاء الداخلية للإضافات](/ar/plugins/architecture) -- نموذج الإمكانات والسجل
