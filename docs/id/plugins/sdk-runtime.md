---
read_when:
    - Anda perlu memanggil helper inti dari sebuah plugin (TTS, STT, pembuatan gambar, pencarian web, subagent)
    - Anda ingin memahami apa saja yang diekspos oleh api.runtime
    - Anda sedang mengakses helper config, agen, atau media dari kode plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- helper runtime yang diinjeksikan dan tersedia untuk plugin
title: Helper Runtime Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77a6e9cd48c84affa17dce684bbd0e072c8b63485e4a5d569f3793a4ea4f9c8
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Helper Runtime Plugin

Referensi untuk objek `api.runtime` yang diinjeksikan ke setiap plugin selama
registrasi. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<Tip>
  **Mencari panduan?** Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  atau [Plugin Provider](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah
  yang menunjukkan helper ini dalam konteks.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace runtime

### `api.runtime.agent`

Identitas agen, direktori, dan manajemen sesi.

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

`runEmbeddedAgent(...)` adalah helper netral untuk memulai giliran agen OpenClaw
normal dari kode plugin. Helper ini menggunakan resolusi provider/model dan
pemilihan agent-harness yang sama seperti balasan yang dipicu channel.

`runEmbeddedPiAgent(...)` tetap tersedia sebagai alias kompatibilitas.

**Helper penyimpanan sesi** ada di bawah `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Konstanta model dan provider default:

```typescript
const model = api.runtime.agent.defaults.model; // mis. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // mis. "anthropic"
```

### `api.runtime.subagent`

Meluncurkan dan mengelola eksekusi subagent di latar belakang.

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
  Override model (`provider`/`model`) memerlukan persetujuan operator melalui
  `plugins.entries.<id>.subagent.allowModelOverride: true` di config.
  Plugin yang tidak tepercaya tetap dapat menjalankan subagent, tetapi permintaan override akan ditolak.
</Warning>

### `api.runtime.taskFlow`

Mengikat runtime TaskFlow ke session key OpenClaw atau konteks tool tepercaya
yang sudah ada, lalu membuat dan mengelola TaskFlow tanpa meneruskan owner di setiap pemanggilan.

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

Gunakan `bindSession({ sessionKey, requesterOrigin })` ketika Anda sudah memiliki
session key OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan melakukan bind dari input pengguna mentah.

### `api.runtime.tts`

Sintesis text-to-speech.

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

Menggunakan konfigurasi inti `messages.tts` dan pemilihan provider. Mengembalikan
buffer audio PCM + sample rate.

### `api.runtime.mediaUnderstanding`

Analisis gambar, audio, dan video.

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

Mengembalikan `{ text: undefined }` saat tidak ada output yang dihasilkan (misalnya input dilewati).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas
  untuk `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Pembuatan gambar.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Pencarian web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilitas media tingkat rendah.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Memuat dan menulis config.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitas tingkat sistem.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Langganan event.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logging.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Resolusi autentikasi model dan provider.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Resolusi direktori state.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factory tool memori dan CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper runtime khusus channel (tersedia saat plugin channel dimuat).

`api.runtime.channel.mentions` adalah permukaan kebijakan mention inbound bersama untuk
plugin channel bawaan yang menggunakan injeksi runtime:

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

Helper mention yang tersedia:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` sengaja tidak mengekspos helper kompatibilitas
`resolveMentionGating*` yang lebih lama. Sebaiknya gunakan jalur yang dinormalisasi
`{ facts, policy }`.

## Menyimpan referensi runtime

Gunakan `createPluginRuntimeStore` untuk menyimpan referensi runtime agar dapat digunakan di luar
callback `register`:

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

Sebaiknya gunakan `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat rendah
ditujukan untuk kasus yang jarang terjadi, ketika satu plugin memang sengaja memerlukan lebih dari satu slot runtime.

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

| Field                    | Type                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan plugin                                                                       |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime dalam memori yang aktif jika tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                    |
| `api.logger`             | `PluginLogger`            | Logger dengan cakupan terbatas (`debug`, `info`, `warn`, `error`)                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/penyiapan ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan path relatif terhadap root plugin                                            |

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- referensi subpath
- [Titik Masuk SDK](/id/plugins/sdk-entrypoints) -- opsi `definePluginEntry`
- [Internal Plugin](/id/plugins/architecture) -- model kapabilitas dan registry
