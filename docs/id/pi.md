---
read_when:
    - Memahami desain integrasi SDK Pi di OpenClaw
    - Memodifikasi siklus hidup sesi agen, tooling, atau pengkabelan penyedia untuk Pi
summary: Arsitektur integrasi agen Pi tersemat OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-04-24T15:22:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Dokumen ini menjelaskan bagaimana OpenClaw terintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan paket saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk mendukung kapabilitas agen AI-nya.

## Gambaran umum

OpenClaw menggunakan SDK pi untuk menanamkan agen coding AI ke dalam arsitektur Gateway perpesanannya. Alih-alih menjalankan pi sebagai subproses atau menggunakan mode RPC, OpenClaw secara langsung mengimpor dan menginstansiasi `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tersemat ini menyediakan:

- Kontrol penuh atas siklus hidup sesi dan penanganan peristiwa
- Injeksi tool kustom (perpesanan, sandbox, tindakan khusus channel)
- Kustomisasi prompt sistem per channel/konteks
- Persistensi sesi dengan dukungan percabangan/Compaction
- Rotasi profil auth multi-akun dengan failover
- Peralihan model yang agnostik penyedia

## Dependensi Paket

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Tujuan                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, jenis pesan, API penyedia                                  |
| `pi-agent-core`   | Loop agen, eksekusi tool, jenis `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                          |

## Struktur File

```
src/agents/
├── pi-embedded-runner.ts          # Mengekspor ulang dari pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entri utama: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika satu percobaan dengan penyiapan sesi
│   │   ├── params.ts              # Tipe RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Membangun payload respons dari hasil run
│   │   ├── images.ts              # Injeksi gambar model vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Deteksi galat abort
│   ├── cache-ttl.ts               # Pelacakan TTL cache untuk pruning konteks
│   ├── compact.ts                 # Logika Compaction manual/otomatis
│   ├── extensions.ts              # Memuat ekstensi pi untuk run tersemat
│   ├── extra-params.ts            # Parameter stream khusus penyedia
│   ├── google.ts                  # Perbaikan urutan giliran Google/Gemini
│   ├── history.ts                 # Pembatasan riwayat (DM vs grup)
│   ├── lanes.ts                   # Lajur perintah sesi/global
│   ├── logger.ts                  # Logger subsistem
│   ├── model.ts                   # Resolusi model melalui ModelRegistry
│   ├── runs.ts                    # Pelacakan run aktif, abort, antrean
│   ├── sandbox-info.ts            # Informasi sandbox untuk prompt sistem
│   ├── session-manager-cache.ts   # Cache instance SessionManager
│   ├── session-manager-init.ts    # Inisialisasi file sesi
│   ├── system-prompt.ts           # Builder prompt sistem
│   ├── tool-split.ts              # Memisahkan tool menjadi builtIn vs kustom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Pemetaan ThinkLevel, deskripsi galat
├── pi-embedded-subscribe.ts       # Langganan/pengiriman peristiwa sesi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Pabrik handler peristiwa
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Pemotongan blok balasan streaming
├── pi-embedded-messaging.ts       # Pelacakan pengiriman tool perpesanan
├── pi-embedded-helpers.ts         # Klasifikasi galat, validasi giliran
├── pi-embedded-helpers/           # Modul helper
├── pi-embedded-utils.ts           # Utilitas pemformatan
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Pembungkusan AbortSignal untuk tool
├── pi-tools.policy.ts             # Kebijakan allowlist/denylist tool
├── pi-tools.read.ts               # Kustomisasi tool baca
├── pi-tools.schema.ts             # Normalisasi skema tool
├── pi-tools.types.ts              # Alias tipe AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override pengaturan
├── pi-hooks/                      # Hook pi kustom
│   ├── compaction-safeguard.ts    # Ekstensi pengaman
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Ekstensi pruning konteks Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolusi profil auth
├── auth-profiles.ts               # Penyimpanan profil, cooldown, failover
├── model-selection.ts             # Resolusi model default
├── models-config.ts               # Pembuatan models.json
├── model-catalog.ts               # Cache katalog model
├── context-window-guard.ts        # Validasi jendela konteks
├── failover-error.ts              # Kelas FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolusi parameter prompt sistem
├── system-prompt-report.ts        # Pembuatan laporan debug
├── tool-summaries.ts              # Ringkasan deskripsi tool
├── tool-policy.ts                 # Resolusi kebijakan tool
├── transcript-policy.ts           # Kebijakan validasi transkrip
├── skills.ts                      # Snapshot Skills/pembuatan prompt
├── skills/                        # Subsistem skill
├── sandbox.ts                     # Resolusi konteks sandbox
├── sandbox/                       # Subsistem sandbox
├── channel-tools.ts               # Injeksi tool khusus channel
├── openclaw-tools.ts              # Tool khusus OpenClaw
├── bash-tools.ts                  # Tool exec/process
├── apply-patch.ts                 # tool apply_patch (OpenAI)
├── tools/                         # Implementasi tool individual
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Runtime tindakan pesan khusus channel sekarang berada di direktori ekstensi milik Plugin, bukan lagi di bawah `src/agents/tools`, misalnya:

- file runtime tindakan Plugin Discord
- file runtime tindakan Plugin Slack
- file runtime tindakan Plugin Telegram
- file runtime tindakan Plugin WhatsApp

## Alur Integrasi Inti

### 1. Menjalankan Agen Tersemat

Titik masuk utamanya adalah `runEmbeddedPiAgent()` di `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Pembuatan Sesi

Di dalam `runEmbeddedAttempt()` (yang dipanggil oleh `runEmbeddedPiAgent()`), SDK pi digunakan:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Langganan Peristiwa

`subscribeEmbeddedPiSession()` berlangganan ke peristiwa `AgentSession` milik pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Peristiwa yang ditangani mencakup:

- `message_start` / `message_end` / `message_update` (teks/penalaran streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Setelah penyiapan, sesi diberi prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK menangani loop agen secara penuh: mengirim ke LLM, mengeksekusi pemanggilan tool, dan menayangkan respons secara streaming.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan meneruskannya melalui `images` hanya untuk giliran tersebut. OpenClaw tidak memindai ulang giliran riwayat lama untuk menginjeksi ulang payload gambar.

## Arsitektur Tool

### Pipeline Tool

1. **Tool Dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Penggantian Kustom**: OpenClaw mengganti bash dengan `exec`/`process`, serta menyesuaikan read/edit/write untuk sandbox
3. **Tool OpenClaw**: perpesanan, browser, canvas, sesi, Cron, Gateway, dan lainnya
4. **Tool Channel**: tool tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran Kebijakan**: tool difilter berdasarkan kebijakan profil, penyedia, agen, grup, sandbox
6. **Normalisasi Skema**: skema dibersihkan untuk keanehan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: tool dibungkus agar mematuhi sinyal abort

### Adapter Definisi Tool

`AgentTool` milik pi-agent-core memiliki signature `execute` yang berbeda dari `ToolDefinition` milik pi-coding-agent. Adapter di `pi-tool-definition-adapter.ts` menjembatani hal ini:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // signature pi-coding-agent berbeda dari pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategi Pemisahan Tool

`splitSdkTools()` meneruskan semua tool melalui `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Kosong. Kami menimpa semuanya
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan pemfilteran kebijakan, integrasi sandbox, dan kumpulan tool yang diperluas milik OpenClaw tetap konsisten di seluruh penyedia.

## Konstruksi Prompt Sistem

Prompt sistem dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Fungsi ini merakit prompt lengkap dengan bagian-bagian termasuk Tooling, Gaya Pemanggilan Tool, guardrail keamanan, referensi CLI OpenClaw, Skills, Dokumen, Workspace, Sandbox, Perpesanan, Tag Balasan, Suara, Balasan Senyap, Heartbeat, metadata runtime, serta Memory dan Reaksi saat diaktifkan, dan file konteks opsional serta konten prompt sistem tambahan. Bagian-bagian ini dipangkas untuk mode prompt minimal yang digunakan oleh subagen.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen Sesi

### File Sesi

Sesi adalah file JSONL dengan struktur pohon (tautan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil tool.

### Cache Sesi

`session-manager-cache.ts` menyimpan cache instance `SessionManager` untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan Riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis channel (DM vs grup).

### Compaction

Compaction otomatis dipicu saat konteks meluap. Tanda tangan luapan yang umum mencakup `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, dan `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` menangani Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Auth & Resolusi Model

### Profil Auth

OpenClaw memelihara penyimpanan profil auth dengan beberapa API key per penyedia:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profil dirotasi saat terjadi kegagalan dengan pelacakan cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolusi Model

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Menggunakan ModelRegistry dan AuthStorage milik Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` memicu fallback model saat dikonfigurasi:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Ekstensi Pi

OpenClaw memuat ekstensi Pi kustom untuk perilaku khusus:

### Pengaman Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan guardrail ke Compaction, termasuk penganggaran token adaptif serta ringkasan kegagalan tool dan operasi file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning Konteks

`src/agents/pi-hooks/context-pruning.ts` mengimplementasikan pruning konteks berbasis cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming & Balasan Blok

### Pemotongan Blok

`EmbeddedBlockChunker` mengelola teks streaming menjadi blok balasan yang terpisah:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Penghapusan Tag Thinking/Final

Output streaming diproses untuk menghapus blok `<think>`/`<thinking>` dan mengekstrak konten `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Hapus konten <think>...</think>
  // Jika enforceFinalTag, hanya kembalikan konten <final>...</final>
};
```

### Direktif Balasan

Direktif balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` diurai dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan Galat

### Klasifikasi Galat

`pi-embedded-helpers.ts` mengklasifikasikan galat untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Konteks terlalu besar
isCompactionFailureError(errorText)   // Compaction gagal
isAuthAssistantError(lastAssistant)   // Kegagalan auth
isRateLimitAssistantError(...)        // Terbatas oleh rate limit
isFailoverAssistantError(...)         // Harus failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback Tingkat Thinking

Jika tingkat thinking tidak didukung, sistem akan fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integrasi Sandbox

Saat mode sandbox diaktifkan, tool dan path dibatasi:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Gunakan tool read/edit/write tersandbox
  // Exec berjalan di container
  // Browser menggunakan URL bridge
}
```

## Penanganan Khusus Penyedia

### Anthropic

- Pembersihan magic string penolakan
- Validasi giliran untuk peran yang berurutan
- Validasi parameter tool Pi upstream yang ketat

### Google/Gemini

- Sanitasi skema tool milik Plugin

### OpenAI

- tool `apply_patch` untuk model Codex
- Penanganan penurunan tingkat thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang serupa dengan mode native Pi.

## Perbedaan Utama dari CLI Pi

| Aspek           | CLI Pi                  | OpenClaw Tersemat                                                                             |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Pemanggilan     | perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                            |
| Tool            | Tool coding default     | Suite tool OpenClaw kustom                                                                    |
| Prompt sistem   | AGENTS.md + prompt      | Dinamis per channel/konteks                                                                   |
| Penyimpanan sesi| `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Kredensial tunggal      | Multi-profil dengan rotasi                                                                    |
| Ekstensi        | Dimuat dari disk        | Jalur terprogram + jalur disk                                                                 |
| Penanganan peristiwa | Perenderan TUI     | Berbasis callback (`onBlockReply`, dll.)                                                      |

## Pertimbangan Mendatang

Area untuk potensi pengerjaan ulang:

1. **Penyelarasan signature tool**: Saat ini mengadaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambah keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` milik Pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` telah berkembang besar
5. **Keanehan penyedia**: Banyak codepath khusus penyedia yang berpotensi dapat ditangani oleh Pi

## Pengujian

Cakupan integrasi Pi mencakup suite berikut:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/opsional:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktifkan `OPENCLAW_LIVE_TEST=1`)

Untuk perintah run saat ini, lihat [Alur kerja pengembangan Pi](/id/pi-dev).

## Terkait

- [Alur kerja pengembangan Pi](/id/pi-dev)
- [Gambaran umum instalasi](/id/install)
