---
read_when:
    - Memahami desain integrasi SDK Pi di OpenClaw
    - Mengubah siklus hidup sesi agen, perkakas, atau penghubungan penyedia untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-05-11T20:32:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw terintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan paket-paket saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk mendukung kemampuan agen AI-nya.

## Gambaran umum

OpenClaw menggunakan SDK pi untuk menyematkan agen pengodean AI ke dalam arsitektur Gateway perpesanannya. Alih-alih menjalankan pi sebagai subprocess atau menggunakan mode RPC, OpenClaw langsung mengimpor dan membuat instance `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tersemat ini menyediakan:

- Kontrol penuh atas siklus hidup sesi dan penanganan peristiwa
- Injeksi alat khusus (perpesanan, sandbox, tindakan khusus kanal)
- Penyesuaian prompt sistem per kanal/konteks
- Persistensi sesi dengan dukungan percabangan/Compaction
- Rotasi profil autentikasi multi-akun dengan failover
- Peralihan model yang agnostik terhadap penyedia

## Dependensi paket

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| Paket             | Tujuan                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, jenis pesan, API penyedia                                   |
| `pi-agent-core`   | Loop agen, eksekusi alat, jenis `AgentMessage`                                                           |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, alat bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                           |

## Struktur file

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
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

Runtime tindakan pesan khusus kanal sekarang berada di direktori ekstensi milik Plugin
alih-alih di bawah `src/agents/tools`, misalnya:

- file runtime tindakan Plugin Discord
- file runtime tindakan Plugin Slack
- file runtime tindakan Plugin Telegram
- file runtime tindakan Plugin WhatsApp

## Alur integrasi inti

### 1. Menjalankan agen tersemat

Titik masuk utama adalah `runEmbeddedPiAgent()` di `pi-embedded-runner/run.ts`:

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

### 2. Pembuatan sesi

Di dalam `runEmbeddedAttempt()` (dipanggil oleh `runEmbeddedPiAgent()`), SDK pi digunakan:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

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

### 3. Langganan peristiwa

`subscribeEmbeddedPiSession()` berlangganan peristiwa `AgentSession` milik pi:

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

- `message_start` / `message_end` / `message_update` (teks/pemikiran streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Setelah penyiapan, sesi diberi prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK menangani loop agen lengkap: mengirim ke LLM, menjalankan panggilan alat, melakukan streaming respons.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk giliran tersebut. OpenClaw tidak memindai ulang giliran riwayat yang lebih lama
untuk menginjeksi ulang payload gambar.

## Arsitektur alat

### Pipeline alat

1. **Alat dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Penggantian khusus**: OpenClaw mengganti bash dengan `exec`/`process`, menyesuaikan read/edit/write untuk sandbox
3. **Alat OpenClaw**: perpesanan, browser, canvas, sesi, cron, Gateway, dll.
4. **Alat kanal**: alat tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran kebijakan**: Alat difilter berdasarkan kebijakan profil, penyedia, agen, grup, sandbox
6. **Normalisasi skema**: Skema dibersihkan untuk keunikan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: Alat dibungkus agar mematuhi sinyal abort

### Adapter definisi alat

`AgentTool` milik pi-agent-core memiliki signature `execute` yang berbeda dari `ToolDefinition` milik pi-coding-agent. Adapter di `pi-tool-definition-adapter.ts` menjembatani ini:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategi pemisahan alat

`splitSdkTools()` meneruskan semua alat melalui `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan pemfilteran kebijakan OpenClaw, integrasi sandbox, dan perangkat alat yang diperluas tetap konsisten di seluruh penyedia.

## Konstruksi prompt sistem

Prompt sistem dibuat di `buildAgentSystemPrompt()` (`system-prompt.ts`). Ini menyusun prompt lengkap dengan bagian yang mencakup Peralatan, Gaya Pemanggilan Alat, pembatas keselamatan, Kontrol OpenClaw, Skills, Dokumentasi, Ruang kerja, Sandbox, Perpesanan, Arahan Output Asisten, Suara, Balasan Senyap, Heartbeat, metadata runtime, ditambah Memory dan Reaksi saat diaktifkan, serta file konteks opsional dan konten prompt sistem tambahan. Bagian-bagian dipangkas untuk mode prompt minimal yang digunakan oleh subagen.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen sesi

### File sesi

Sesi adalah file JSONL dengan struktur pohon (pengaitan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil alat.

### Cache sesi

`session-manager-cache.ts` menyimpan instance SessionManager dalam cache untuk menghindari penguraian file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis kanal (DM vs grup).

### Compaction

Compaction otomatis terpicu saat konteks melampaui batas. Tanda-tanda umum pelampauan
mencakup `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, dan `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` menangani
compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autentikasi dan resolusi model

### Profil autentikasi

OpenClaw mempertahankan penyimpanan profil autentikasi dengan beberapa kunci API per penyedia:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profil dirotasi saat terjadi kegagalan dengan pelacakan cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolusi model

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
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

OpenClaw memuat ekstensi pi khusus untuk perilaku khusus:

### Pengaman Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan pembatas ke compaction, termasuk penganggaran token adaptif serta ringkasan kegagalan alat dan operasi file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pemangkasan konteks

`src/agents/pi-hooks/context-pruning.ts` mengimplementasikan pemangkasan konteks berbasis cache-TTL:

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

## Streaming dan balasan blok

### Pemotongan blok

`EmbeddedBlockChunker` mengelola teks streaming menjadi blok balasan terpisah:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Penghapusan Tag Thinking/Final

Output streaming diproses untuk menghapus blok `<think>`/`<thinking>` dan mengekstrak konten `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Arahan balasan

Arahan balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` diurai dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan kesalahan

### Klasifikasi kesalahan

`pi-embedded-helpers.ts` mengklasifikasikan kesalahan untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback tingkat berpikir

Jika tingkat berpikir tidak didukung, ini akan fallback:

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

## Integrasi sandbox

Saat mode sandbox diaktifkan, alat dan path dibatasi:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Penanganan Khusus Penyedia

### Anthropic

- Pembersihan string ajaib penolakan
- Validasi giliran untuk peran berurutan
- Validasi parameter alat Pi upstream yang ketat

### Google/Gemini

- Sanitasi skema alat milik Plugin

### OpenAI

- Alat `apply_patch` untuk model Codex
- Penanganan downgrade tingkat berpikir

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang mirip dengan mode asli pi.

## Perbedaan utama dari Pi CLI

| Aspek           | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Pemanggilan     | Perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                             |
| Alat            | Alat coding bawaan      | Rangkaian alat OpenClaw khusus                                                                 |
| Prompt sistem   | AGENTS.md + prompt      | Dinamis per kanal/konteks                                                                      |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autentikasi     | Kredensial tunggal      | Multi-profil dengan rotasi                                                                     |
| Ekstensi        | Dimuat dari disk        | Programatik + path disk                                                                        |
| Penanganan peristiwa | Rendering TUI      | Berbasis callback (onBlockReply, dll.)                                                         |

## Pertimbangan mendatang

Area yang berpotensi dikerjakan ulang:

1. **Penyelarasan tanda tangan alat**: Saat ini mengadaptasi antara tanda tangan pi-agent-core dan pi-coding-agent
2. **Pembungkusan manajer sesi**: `guardSessionManager` menambahkan keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` milik pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` telah menjadi besar
5. **Kekhasan penyedia**: Banyak jalur kode khusus penyedia yang berpotensi dapat ditangani pi

## Tes

Cakupan integrasi Pi mencakup rangkaian ini:

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktifkan `OPENCLAW_LIVE_TEST=1`)

Untuk perintah run saat ini, lihat [Alur Kerja Pengembangan Pi](/id/pi-dev).

## Terkait

- [Alur kerja pengembangan Pi](/id/pi-dev)
- [Ikhtisar instalasi](/id/install)
