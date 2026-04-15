---
read_when:
    - تحتاج إلى استدعاء مساعدات النواة من Plugin (TTS وSTT وتوليد الصور والبحث على الويب وsubagent)
    - تريد فهم ما الذي يتيحه `api.runtime`
    - أنت تصل إلى مساعدات التكوين أو الوكيل أو الوسائط من داخل كود Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- مساعدات وقت التشغيل المُحقنة المتاحة للإضافات
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77a6e9cd48c84affa17dce684bbd0e072c8b63485e4a5d569f3793a4ea4f9c8
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# مساعدات وقت التشغيل لـ Plugin

مرجع لكائن `api.runtime` الذي يُحقن في كل Plugin أثناء
التسجيل. استخدم هذه المساعدات بدلًا من استيراد مكوّنات المضيف الداخلية مباشرةً.

<Tip>
  **هل تبحث عن شرح عملي؟** راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  أو [Provider Plugins](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة
  تعرض هذه المساعدات ضمن سياقها.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## مساحات أسماء وقت التشغيل

### `api.runtime.agent`

هوية الوكيل، والأدلة، وإدارة الجلسات.

```typescript
// Resolve the agent's working directory
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve agent workspace
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Get agent identity
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Get default thinking level
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

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

`runEmbeddedAgent(...)` هي المساعدة المحايدة لبدء دورة وكيل عادية في OpenClaw
من كود Plugin. وهي تستخدم نفس آلية حل الموفّر/النموذج واختيار
تجهيز الوكيل المستخدمة في الردود التي تُفعَّل عبر القنوات.

يبقى `runEmbeddedPiAgent(...)` اسمًا مستعارًا للتوافق.

**مساعدات مخزن الجلسات** موجودة تحت `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ثوابت النموذج والموفّر الافتراضيين:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

تشغيل عمليات subagent في الخلفية وإدارتها.

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
  تتطلب تجاوزات النموذج (`provider`/`model`) موافقة صريحة من المشغّل عبر
  `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات.
  لا يزال بإمكان Plugins غير الموثوقة تشغيل subagents، لكن طلبات التجاوز تُرفض.
</Warning>

### `api.runtime.taskFlow`

اربط وقت تشغيل TaskFlow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق،
ثم أنشئ Task Flows وأدرها دون تمرير مالك مع كل استدعاء.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

استخدم `bindSession({ sessionKey, requesterOrigin })` عندما يكون لديك بالفعل
مفتاح جلسة OpenClaw موثوق من طبقة الربط الخاصة بك. لا تُجرِ الربط من
إدخال مستخدم خام.

### `api.runtime.tts`

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

يستخدم إعدادات `messages.tts` الأساسية واختيار الموفّر. ويعيد مخزنًا مؤقتًا
لصوت PCM مع معدل العينة.

### `api.runtime.mediaUnderstanding`

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

يعيد `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (على سبيل المثال، عند
تخطي الإدخال).

<Info>
  يبقى `api.runtime.stt.transcribeAudioFile(...)` اسمًا مستعارًا للتوافق
  مع `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

توليد الصور.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
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

أدوات الوسائط منخفضة المستوى.

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

أدوات على مستوى النظام.

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

حلّ مصادقة النموذج والموفّر.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

حلّ دليل الحالة.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

مصانع أداة الذاكرة وCLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

مساعدات وقت تشغيل خاصة بالقناة (تكون متاحة عند تحميل Channel Plugin).

`api.runtime.channel.mentions` هي واجهة سياسة الإشارة الواردة المشتركة
لـ Channel Plugins المضمّنة التي تستخدم حقن وقت التشغيل:

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

لا يعرّض `api.runtime.channel.mentions` عمدًا مساعدات التوافق الأقدم
`resolveMentionGating*`. يُفضَّل استخدام المسار الموحّد
`{ facts, policy }`.

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل لاستخدامه خارج
دالة `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

يُفضَّل `pluginId` لهوية runtime-store. أما الصيغة الأدنى مستوى `key`
فهي للحالات غير الشائعة التي يحتاج فيها Plugin واحد عمدًا إلى أكثر من خانة
وقت تشغيل واحدة.

## حقول `api` العلوية الأخرى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

| الحقل                    | النوع                     | الوصف                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                |
| `api.name`               | `string`                  | الاسم المعروض لـ Plugin                                                                     |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                    |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بـ Plugin من `plugins.entries.<id>.config`                                    |
| `api.logger`             | `PluginLogger`            | مسجّل بنطاق محدد (`debug` و`info` و`warn` و`error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ يشير `"setup-runtime"` إلى نافذة بدء/إعداد خفيفة قبل التشغيل الكامل     |
| `api.resolvePath(input)` | `(string) => string`      | حلّ مسار نسبةً إلى جذر Plugin                                                               |

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- مرجع المسارات الفرعية
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) -- خيارات `definePluginEntry`
- [المكوّنات الداخلية لـ Plugin](/ar/plugins/architecture) -- نموذج القدرات والسجل
