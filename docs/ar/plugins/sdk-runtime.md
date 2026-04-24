---
read_when:
    - تحتاج إلى استدعاء مساعدات النواة من داخل Plugin ‏(TTS، وSTT، وتوليد الصور، والبحث على الويب، وsubagent، وnodes)
    - تريد فهم ما الذي يكشفه `api.runtime`
    - أنت تصل إلى مساعدات config أو agent أو media من داخل كود Plugin
sidebarTitle: Runtime Helpers
summary: '`api.runtime` — مساعدات وقت التشغيل المحقونة المتاحة لـ Plugins'
title: مساعدات وقت تشغيل Plugin
x-i18n:
    generated_at: "2026-04-24T07:55:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

مرجع للكائن `api.runtime` الذي يتم حقنه في كل Plugin أثناء
التسجيل. استخدم هذه المساعدات بدلًا من استيراد مكونات المضيف الداخلية مباشرة.

<Tip>
  **هل تبحث عن شرح تطبيقي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزودين](/ar/plugins/sdk-provider-plugins) للاطلاع على أدلة خطوة بخطوة
  تُظهر هذه المساعدات في سياقها.
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

تُعد `runEmbeddedAgent(...)` المساعد المحايد لبدء دور وكيل OpenClaw
عادي من داخل كود Plugin. وهي تستخدم حلّ provider/model نفسه واختيار
agent-harness نفسه المستخدم في الردود المشغَّلة من القنوات.

ولا تزال `runEmbeddedPiAgent(...)` موجودة كاسم مستعار متوافق.

**مساعدات مخزن الجلسات** موجودة تحت `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ثوابت النموذج والـ provider الافتراضية:

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

إطلاق وإدارة تشغيلات الوكلاء الفرعيين في الخلفية.

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
  تتطلب تجاوزات النموذج (`provider`/`model`) اشتراكًا صريحًا من المشغّل عبر
  `plugins.entries.<id>.subagent.allowModelOverride: true` في الإعدادات.
  ولا تزال Plugins غير الموثوقة قادرة على تشغيل وكلاء فرعيين، لكن طلبات التجاوز تُرفض.
</Warning>

### `api.runtime.nodes`

سرد العُقد المتصلة واستدعاء أمر مستضاف على node من داخل كود Plugin
المحمّل بواسطة Gateway. استخدم هذا عندما تملك Plugin عملاً محليًا على جهاز مقترن، مثل
جسر متصفح أو صوت على Mac آخر.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

يتوفر وقت التشغيل هذا فقط داخل Gateway. ولا تزال أوامر node تمر
عبر اقتران عُقد Gateway العادي، وقوائم السماح الخاصة بالأوامر، ومعالجة الأوامر المحلية على node.

### `api.runtime.taskFlow`

اربط وقت تشغيل TaskFlow بمفتاح جلسة OpenClaw موجود أو بسياق أداة موثوق،
ثم أنشئ Task Flows وأدرها من دون تمرير مالك في كل استدعاء.

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

استخدم `bindSession({ sessionKey, requesterOrigin })` عندما تكون لديك بالفعل
جلسة OpenClaw موثوقة من طبقة الربط الخاصة بك. ولا تقم بالربط انطلاقًا من إدخال مستخدم خام.

### `api.runtime.tts`

تحويل النص إلى كلام.

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

يستخدم إعدادات `messages.tts` الأساسية واختيار provider. ويعيد مخزنًا مؤقتًا
لصوت PCM + معدل العينة.

### `api.runtime.mediaUnderstanding`

تحليل الصور، والصوت، والفيديو.

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

يعيد `{ text: undefined }` عندما لا يتم إنتاج أي مخرجات (مثل المدخلات المتخطاة).

<Info>
  لا تزال `api.runtime.stt.transcribeAudioFile(...)` موجودة كاسم مستعار متوافق
  لـ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
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

حلّ مصادقة النموذج والـ provider.

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

مصانع أدوات الذاكرة وCLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

مساعدات وقت تشغيل خاصة بالقنوات (متاحة عند تحميل Plugin قناة).

تُعد `api.runtime.channel.mentions` سطح سياسة الإشارة الواردة المشترك لـ
Plugins القنوات المجمعة التي تستخدم حقن وقت التشغيل:

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

لا تكشف `api.runtime.channel.mentions` عمدًا عن مساعدات التوافق الأقدم
`resolveMentionGating*`. ويفضّل مسار
`{ facts, policy }` المطبّع.

## تخزين مراجع وقت التشغيل

استخدم `createPluginRuntimeStore` لتخزين مرجع وقت التشغيل للاستخدام خارج
callback الخاصة بـ `register`:

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

فضّل `pluginId` لهوية runtime-store. أما صيغة `key` ذات المستوى الأدنى فهي
للحالات غير الشائعة التي تحتاج فيها Plugin واحدة عمدًا إلى أكثر من فتحة وقت تشغيل
واحدة.

## حقول `api` الأخرى ذات المستوى الأعلى

إلى جانب `api.runtime`، يوفّر كائن API أيضًا:

| الحقل | النوع | الوصف |
| ------ | ------ | ------ |
| `api.id` | `string` | معرّف Plugin |
| `api.name` | `string` | اسم العرض الخاص بالـ Plugin |
| `api.config` | `OpenClawConfig` | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند التوفر) |
| `api.pluginConfig` | `Record<string, unknown>` | الإعدادات الخاصة بالـ Plugin من `plugins.entries.<id>.config` |
| `api.logger` | `PluginLogger` | مسجل ذو نطاق محدد (`debug` و`info` و`warn` و`error`) |
| `api.registrationMode` | `PluginRegistrationMode` | وضع التحميل الحالي؛ وتُعد `"setup-runtime"` نافذة بدء تشغيل/إعداد خفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string` | حلّ مسار بالنسبة إلى جذر Plugin |

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) -- مرجع المسارات الفرعية
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) -- خيارات `definePluginEntry`
- [المكونات الداخلية للـ Plugin](/ar/plugins/architecture) -- نموذج القدرات والسجل
