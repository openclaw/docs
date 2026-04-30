---
read_when:
    - Memahami desain integrasi Pi SDK di OpenClaw
    - Mengubah siklus hidup sesi agen, peralatan, atau perangkaian penyedia untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-04-30T09:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw terintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan paket saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk menjalankan kapabilitas agen AI-nya.

## Gambaran Umum

OpenClaw menggunakan SDK pi untuk menyematkan agen coding AI ke dalam arsitektur Gateway perpesanannya. Alih-alih menjalankan pi sebagai subprocess atau menggunakan mode RPC, OpenClaw mengimpor dan membuat instance `AgentSession` milik pi secara langsung melalui `createAgentSession()`. Pendekatan tertanam ini menyediakan:

- Kontrol penuh atas siklus hidup sesi dan penanganan event
- Injeksi tool kustom (perpesanan, sandbox, tindakan khusus channel)
- Kustomisasi prompt sistem per channel/konteks
- Persistensi sesi dengan dukungan percabangan/Compaction
- Rotasi profil auth multi-akun dengan failover
- Peralihan model yang tidak bergantung pada provider

## Dependensi paket

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Paket             | Tujuan                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, tipe pesan, API provider                                  |
| `pi-agent-core`   | Loop agen, eksekusi tool, tipe `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                         |

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

Runtime tindakan pesan khusus channel kini berada di direktori ekstensi milik plugin
alih-alih di bawah `src/agents/tools`, misalnya:

- file runtime tindakan plugin Discord
- file runtime tindakan plugin Slack
- file runtime tindakan plugin Telegram
- file runtime tindakan plugin WhatsApp

## Alur integrasi inti

### 1. Menjalankan Agen Tertanam

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

### 2. Pembuatan Sesi

Di dalam `runEmbeddedAttempt()` (dipanggil oleh `runEmbeddedPiAgent()`), SDK pi digunakan:

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

### 3. Langganan Event

`subscribeEmbeddedPiSession()` berlangganan ke event `AgentSession` milik pi:

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

Event yang ditangani meliputi:

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

SDK menangani loop agen penuh: mengirim ke LLM, mengeksekusi panggilan tool, melakukan streaming respons.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk giliran tersebut. OpenClaw tidak memindai ulang giliran riwayat yang lebih lama
untuk menyuntikkan ulang payload gambar.

## Arsitektur tool

### Pipeline tool

1. **Tool Dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Pengganti Kustom**: OpenClaw mengganti bash dengan `exec`/`process`, mengustomisasi read/edit/write untuk sandbox
3. **Tool OpenClaw**: perpesanan, browser, canvas, sesi, cron, Gateway, dll.
4. **Tool Channel**: tool tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran Kebijakan**: Tool difilter berdasarkan profil, provider, agen, grup, kebijakan sandbox
6. **Normalisasi Skema**: Skema dibersihkan untuk kekhasan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: Tool dibungkus agar menghormati sinyal abort

### Adapter definisi tool

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

### Strategi pemisahan tool

`splitSdkTools()` meneruskan semua tool melalui `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan penyaringan kebijakan OpenClaw, integrasi sandbox, dan rangkaian alat yang diperluas tetap konsisten di seluruh penyedia.

## Penyusunan prompt sistem

Prompt sistem dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Fungsi ini menyusun prompt lengkap dengan bagian yang mencakup Tooling, Gaya Pemanggilan Alat, pagar pembatas keamanan, referensi CLI OpenClaw, Skills, Dokumen, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadata runtime, serta Memory dan Reactions saat diaktifkan, dan file konteks opsional serta konten prompt sistem tambahan. Bagian-bagian dipangkas untuk mode prompt minimal yang digunakan oleh subagent.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen sesi

### File sesi

Sesi adalah file JSONL dengan struktur pohon (penautan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil alat.

### Caching sesi

`session-manager-cache.ts` menyimpan cache instance SessionManager untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis channel (DM vs grup).

### Compaction

Auto-compaction terpicu saat konteks meluap. Tanda luapan umum
mencakup `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, dan `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` menangani compaction
manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autentikasi & Resolusi Model

### Profil auth

OpenClaw mempertahankan penyimpanan profil auth dengan beberapa API key per penyedia:

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

OpenClaw memuat ekstensi pi kustom untuk perilaku khusus:

### Pengaman Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan pagar pembatas ke compaction, termasuk penganggaran token adaptif serta ringkasan kegagalan alat dan operasi file:

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

## Streaming & Balasan Blok

### Pemotongan blok

`EmbeddedBlockChunker` mengelola streaming teks menjadi blok balasan terpisah:

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

### Direktif balasan

Direktif balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` diurai dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan error

### Klasifikasi error

`pi-embedded-helpers.ts` mengklasifikasikan error untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback level thinking

Jika level thinking tidak didukung, level tersebut menggunakan fallback:

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
- Validasi turn untuk role berurutan
- Validasi parameter alat Pi upstream yang ketat

### Google/Gemini

- Sanitasi skema alat milik Plugin

### OpenAI

- Alat `apply_patch` untuk model Codex
- Penanganan downgrade level thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang mirip dengan mode native pi.

## Perbedaan utama dari CLI Pi

| Aspek           | CLI Pi                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Pemanggilan     | Perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                             |
| Alat            | Alat coding default     | Rangkaian alat OpenClaw kustom                                                                 |
| Prompt sistem   | AGENTS.md + prompt      | Dinamis per channel/konteks                                                                    |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Satu kredensial         | Multi-profil dengan rotasi                                                                     |
| Ekstensi        | Dimuat dari disk        | Programatik + path disk                                                                        |
| Penanganan event | Rendering TUI          | Berbasis callback (onBlockReply, dll.)                                                         |

## Pertimbangan mendatang

Area untuk kemungkinan pengerjaan ulang:

1. **Penyelarasan signature alat**: Saat ini mengadaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambahkan keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` milik pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` telah berkembang besar
5. **Keunikan penyedia**: Banyak jalur kode khusus penyedia yang berpotensi dapat ditangani pi

## Pengujian

Cakupan integrasi Pi mencakup suite ini:

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
