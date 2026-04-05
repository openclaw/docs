---
read_when:
    - Anda perlu memanggil helper core dari plugin (TTS, STT, image gen, web search, subagent)
    - Anda ingin memahami apa yang diekspos oleh api.runtime
    - Anda sedang mengakses helper config, agent, atau media dari kode plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- helper runtime yang disuntikkan dan tersedia untuk plugin
title: Helper Runtime Plugin
x-i18n:
    generated_at: "2026-04-05T14:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Helper Runtime Plugin

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap plugin selama
pendaftaran. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Channel Plugins](/plugins/sdk-channel-plugins)
  atau [Provider Plugins](/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah
  yang menunjukkan helper ini dalam konteks.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace runtime

### `api.runtime.agent`

Identitas agen, direktori, dan pengelolaan sesi.

```typescript
// Resolve working directory agen
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve workspace agen
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Dapatkan identitas agen
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Dapatkan level thinking default
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Dapatkan timeout agen
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Pastikan workspace ada
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Jalankan agen Pi tertanam
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Helper session store** berada di bawah `api.runtime.agent.session`:

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

Luncurkan dan kelola eksekusi subagent di latar belakang.

```typescript
// Mulai eksekusi subagent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // override opsional
  model: "gpt-4.1-mini", // override opsional
  deliver: false,
});

// Tunggu hingga selesai
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
  Plugin tidak tepercaya tetap dapat menjalankan subagent, tetapi permintaan override ditolak.
</Warning>

### `api.runtime.taskFlow`

Ikat runtime Task Flow ke session key OpenClaw yang ada atau konteks tool tepercaya,
lalu buat dan kelola Task Flow tanpa meneruskan owner di setiap panggilan.

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
session key OpenClaw tepercaya dari binding layer Anda sendiri. Jangan mengikat dari input
pengguna mentah.

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

Menggunakan konfigurasi core `messages.tts` dan pemilihan provider. Mengembalikan buffer audio PCM
+ sample rate.

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
```

### `api.runtime.config`

Muat dan tulis config.

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

Resolusi auth model dan provider.

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

Factory tool memory dan CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper runtime khusus channel (tersedia saat plugin channel dimuat).

## Menyimpan referensi runtime

Gunakan `createPluginRuntimeStore` untuk menyimpan referensi runtime agar dapat digunakan di luar
callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// Di titik entri Anda
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Di file lain
export function getRuntime() {
  return store.getRuntime(); // melempar jika belum diinisialisasi
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // mengembalikan null jika belum diinisialisasi
}
```

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

| Field                    | Type                      | Description                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id plugin                                                                                  |
| `api.name`               | `string`                  | nama tampilan plugin                                                                       |
| `api.config`             | `OpenClawConfig`          | snapshot config saat ini (snapshot runtime dalam memori yang aktif saat tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | config khusus plugin dari `plugins.entries.<id>.config`                                    |
| `api.logger`             | `PluginLogger`            | logger dengan scope (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | resolve path relatif terhadap root plugin                                                  |

## Terkait

- [SDK Overview](/plugins/sdk-overview) -- referensi subpath
- [SDK Entry Points](/plugins/sdk-entrypoints) -- opsi `definePluginEntry`
- [Plugin Internals](/plugins/architecture) -- model capability dan registry
