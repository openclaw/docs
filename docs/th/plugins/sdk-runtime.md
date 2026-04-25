---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยของ core จาก Plugin (TTS, STT, image gen, web search, subagent, nodes)
    - คุณต้องการทำความเข้าใจว่า `api.runtime` เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้าน config, agent หรือ media จากโค้ด Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูก inject ซึ่งพร้อมใช้งานสำหรับ plugins
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-04-25T13:55:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

เอกสารอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูก inject เข้าไปในทุก Plugin ระหว่าง
การลงทะเบียน ให้ใช้ตัวช่วยเหล่านี้แทนการ import internals ของโฮสต์โดยตรง

<Tip>
  **กำลังมองหาคำแนะนำแบบทีละขั้นตอนอยู่หรือไม่?** ดู [Channel Plugins](/th/plugins/sdk-channel-plugins)
  หรือ [Provider Plugins](/th/plugins/sdk-provider-plugins) สำหรับคู่มือแบบทีละขั้นตอน
  ที่แสดงการใช้ตัวช่วยเหล่านี้ในบริบทจริง
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## เนมสเปซของรันไทม์

### `api.runtime.agent`

ตัวตนของ agent, ไดเรกทอรี และการจัดการเซสชัน

```typescript
// Resolve ไดเรกทอรีทำงานของ agent
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve workspace ของ agent
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// รับตัวตนของ agent
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// รับระดับการคิดเริ่มต้น
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// รับ timeout ของ agent
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// ตรวจสอบให้แน่ใจว่ามี workspace อยู่
await api.runtime.agent.ensureAgentWorkspace(cfg);

// รัน agent turn แบบฝังตัว
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "สรุปการเปลี่ยนแปลงล่าสุด",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` เป็นตัวช่วยแบบเป็นกลางสำหรับเริ่มต้น OpenClaw
agent turn ปกติจากโค้ด Plugin โดยใช้การ resolve provider/model และ
การเลือก agent harness แบบเดียวกับคำตอบที่ถูกกระตุ้นจาก channel

`runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias เพื่อความเข้ากันได้

**ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

ค่าคงที่ของโมเดลและ provider เริ่มต้น:

```typescript
const model = api.runtime.agent.defaults.model; // เช่น "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // เช่น "anthropic"
```

### `api.runtime.subagent`

เปิดและจัดการการรัน subagent เบื้องหลัง

```typescript
// เริ่มการรัน subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "ขยายคำค้นนี้เป็นการค้นหาติดตามผลที่มีเป้าหมายชัดเจน",
  provider: "openai", // override เพิ่มเติม
  model: "gpt-4.1-mini", // override เพิ่มเติม
  deliver: false,
});

// รอให้เสร็จสิ้น
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// อ่านข้อความของเซสชัน
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// ลบเซสชัน
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  การ override โมเดล (`provider`/`model`) ต้องได้รับการ opt-in จาก operator ผ่าน
  `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config
  Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagents ได้ แต่คำขอ override จะถูกปฏิเสธ
</Warning>

### `api.runtime.nodes`

แสดงรายการ Node ที่เชื่อมต่ออยู่ และเรียกคำสั่งของ node host จากโค้ด Plugin
ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงาน local
บนอุปกรณ์ที่จับคู่ไว้ เช่น เบราว์เซอร์หรือ audio bridge บน Mac อีกเครื่องหนึ่ง

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

ภายใน Gateway รันไทม์นี้ทำงาน in-process ในคำสั่ง CLI ของ Plugin มันจะเรียก
Gateway ที่ตั้งค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet
recover-tab` จึงสามารถตรวจสอบ Node ที่จับคู่จากเทอร์มินัลได้ คำสั่งของ Node
ยังคงผ่านการจับคู่ Node ปกติของ Gateway, allowlist ของคำสั่ง และการจัดการคำสั่งในฝั่ง Node ตามปกติ

### `api.runtime.taskFlow`

ผูกรันไทม์ของ TaskFlow เข้ากับ session key ของ OpenClaw ที่มีอยู่แล้ว หรือ trusted tool
context แล้วจึงสร้างและจัดการ TaskFlow โดยไม่ต้องส่ง owner ทุกครั้งที่เรียก

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "รีวิว pull request ใหม่",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "รีวิว PR #123",
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

ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี
session key ของ OpenClaw ที่เชื่อถือได้อยู่แล้วจากเลเยอร์การ bind ของคุณเอง อย่าผูกจากอินพุตผู้ใช้ดิบ

### `api.runtime.tts`

การสังเคราะห์ข้อความเป็นเสียง

```typescript
// TTS มาตรฐาน
const clip = await api.runtime.tts.textToSpeech({
  text: "สวัสดีจาก OpenClaw",
  cfg: api.config,
});

// TTS ที่ปรับให้เหมาะกับงานโทรศัพท์
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "สวัสดีจาก OpenClaw",
  cfg: api.config,
});

// แสดงรายการเสียงที่พร้อมใช้งาน
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ใช้การตั้งค่า `messages.tts` และการเลือก provider ของ core โดยคืนค่า PCM audio
buffer + sample rate

### `api.runtime.mediaUnderstanding`

การวิเคราะห์ภาพ เสียง และวิดีโอ

```typescript
// อธิบายภาพ
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// ถอดเสียงจากไฟล์เสียง
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // เพิ่มเติม สำหรับกรณีที่อนุมาน MIME ไม่ได้
});

// อธิบายวิดีโอ
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// วิเคราะห์ไฟล์แบบทั่วไป
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

คืนค่า `{ text: undefined }` เมื่อไม่มีการสร้างผลลัพธ์ (เช่น อินพุตถูกข้าม)

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` ยังคงอยู่ในฐานะ alias เพื่อความเข้ากันได้
  สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
</Info>

### `api.runtime.imageGeneration`

การสร้างภาพ

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "หุ่นยนต์กำลังวาดภาพพระอาทิตย์ตก",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

การค้นหาเว็บ

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

ยูทิลิตีสื่อระดับล่าง

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

การโหลดและการเขียน config

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

ยูทิลิตีระดับระบบ

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

การสมัครรับเหตุการณ์

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

การบันทึกล็อก

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

การ resolve การยืนยันตัวตนของโมเดลและ provider

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

การ resolve ไดเรกทอรีสถานะ

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

factory ของ memory tool และ CLI

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

ตัวช่วยรันไทม์เฉพาะ channel (ใช้ได้เมื่อโหลด channel Plugin แล้ว)

`api.runtime.channel.mentions` คือพื้นผิวนโยบาย mention ขาเข้าที่ใช้ร่วมกันสำหรับ
channel Plugin แบบ bundled ที่ใช้ runtime injection:

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

ตัวช่วย mention ที่มีให้ใช้:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยเพื่อความเข้ากันได้แบบเดิม
`resolveMentionGating*` ให้ใช้เส้นทางแบบ normalized
`{ facts, policy }` แทน

## การจัดเก็บการอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อเก็บการอ้างอิงรันไทม์ไว้ใช้นอก
callback ของ `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// ใน entry point ของคุณ
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "ตัวอย่าง",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// ในไฟล์อื่น ๆ
export function getRuntime() {
  return store.getRuntime(); // โยนข้อผิดพลาดหากยังไม่ถูก initialize
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // คืนค่า null หากยังไม่ถูก initialize
}
```

ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับล่างนั้นมีไว้
สำหรับกรณีที่ไม่พบบ่อย ซึ่ง Plugin เดียวตั้งใจต้องการช่องรันไทม์มากกว่าหนึ่งช่อง

## ฟิลด์ `api` ระดับบนอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจ็กต์ API ยังมีสิ่งต่อไปนี้ด้วย:

| ฟิลด์                    | ชนิดข้อมูล                | คำอธิบาย                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id ของ Plugin                                                                               |
| `api.name`               | `string`                  | ชื่อแสดงผลของ Plugin                                                                       |
| `api.config`             | `OpenClawConfig`          | snapshot ของ config ปัจจุบัน (snapshot ของรันไทม์ในหน่วยความจำที่กำลังใช้งาน หากมี)      |
| `api.pluginConfig`       | `Record<string, unknown>` | config เฉพาะของ Plugin จาก `plugins.entries.<id>.config`                                   |
| `api.logger`             | `PluginLogger`            | logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าก่อนเข้า full entry แบบเบา |
| `api.resolvePath(input)` | `(string) => string`      | resolve พาธโดยอิงจากรากของ Plugin                                                         |

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง subpath
- [จุดเริ่มต้น SDK](/th/plugins/sdk-entrypoints) — ตัวเลือกของ `definePluginEntry`
- [โครงสร้างภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ registry
