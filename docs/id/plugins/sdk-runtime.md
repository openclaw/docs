---
read_when:
    - Anda perlu memanggil helper inti dari plugin (TTS, STT, pembuatan gambar, pencarian web, subagen, nodes)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda sedang mengakses helper config, agen, atau media dari kode plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- helper runtime yang disuntikkan yang tersedia untuk plugin
title: Helper runtime plugin
x-i18n:
    generated_at: "2026-04-24T09:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama
registrasi. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins)
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
// Selesaikan direktori kerja agen
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Selesaikan workspace agen
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Dapatkan identitas agen
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Dapatkan tingkat thinking default
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Dapatkan timeout agen
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Pastikan workspace ada
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Jalankan giliran agen tertanam
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
normal dari kode plugin. Ini menggunakan resolusi provider/model dan
pemilihan harness agen yang sama seperti balasan yang dipicu saluran.

`runEmbeddedPiAgent(...)` tetap ada sebagai alias kompatibilitas.

**Helper penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Konstanta model dan provider default:

```typescript
const model = api.runtime.agent.defaults.model; // misalnya "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // misalnya "anthropic"
```

### `api.runtime.subagent`

Luncurkan dan kelola eksekusi subagen latar belakang.

```typescript
// Mulai eksekusi subagen
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // override opsional
  model: "gpt-4.1-mini", // override opsional
  deliver: false,
});

// Tunggu sampai selesai
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Baca pesan sesi
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Hapus sesi
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Override model (`provider`/`model`) memerlukan opt-in operator melalui
  `plugins.entries.<id>.subagent.allowModelOverride: true` di config.
  Plugin yang tidak tepercaya tetap dapat menjalankan subagen, tetapi permintaan override ditolak.
</Warning>

### `api.runtime.nodes`

Daftarkan node yang terhubung dan panggil perintah node-host dari kode plugin
yang dimuat Gateway. Gunakan ini ketika plugin memiliki pekerjaan lokal pada perangkat yang dipasangkan, misalnya bridge browser atau audio di Mac lain.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Runtime ini hanya tersedia di dalam Gateway. Perintah node tetap
melewati pairing node Gateway normal, allowlist perintah, dan penanganan perintah lokal node.

### `api.runtime.taskFlow`

Ikat runtime TaskFlow ke session key OpenClaw yang sudah ada atau konteks alat tepercaya,
lalu buat dan kelola TaskFlow tanpa meneruskan owner pada setiap pemanggilan.

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

Gunakan `bindSession({ sessionKey, requesterOrigin })` saat Anda sudah memiliki
session key OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan melakukan bind dari input pengguna mentah.

### `api.runtime.tts`

Sintesis text-to-speech.

```typescript
// TTS standar
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// TTS yang dioptimalkan untuk telepon
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Daftar suara yang tersedia
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
// Deskripsikan gambar
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transkripsikan audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // opsional, saat MIME tidak dapat disimpulkan
});

// Deskripsikan video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Analisis file generik
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Mengembalikan `{ text: undefined }` saat tidak ada output yang dihasilkan (misalnya input dilewati).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas
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

Pemuatan dan penulisan config.

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

Langganan peristiwa.

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

Resolusi auth model dan provider.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Resolusi direktori status.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factory alat memori dan CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper runtime khusus saluran (tersedia saat plugin saluran dimuat).

`api.runtime.channel.mentions` adalah permukaan kebijakan mention masuk bersama untuk
plugin saluran bawaan yang menggunakan runtime injection:

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
`resolveMentionGating*` yang lebih lama. Utamakan jalur ternormalisasi
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

// Di entry point Anda
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Di file lain
export function getRuntime() {
  return store.getRuntime(); // melempar error jika belum diinisialisasi
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // mengembalikan null jika belum diinisialisasi
}
```

Utamakan `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah
ditujukan untuk kasus yang jarang ketika satu plugin dengan sengaja memerlukan lebih dari satu slot runtime.

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

| Field                    | Tipe                      | Deskripsi                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id plugin                                                                                   |
| `api.name`               | `string`                  | nama tampilan plugin                                                                        |
| `api.config`             | `OpenClawConfig`          | snapshot config saat ini (snapshot runtime dalam memori yang aktif saat tersedia)           |
| `api.pluginConfig`       | `Record<string, unknown>` | config khusus plugin dari `plugins.entries.<id>.config`                                     |
| `api.logger`             | `PluginLogger`            | logger dengan cakupan tertentu (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum full-entry |
| `api.resolvePath(input)` | `(string) => string`      | selesaikan path relatif terhadap root plugin                                                |

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) -- referensi subpath
- [Entry Point SDK](/id/plugins/sdk-entrypoints) -- opsi `definePluginEntry`
- [Internal Plugin](/id/plugins/architecture) -- model kapabilitas dan registri
