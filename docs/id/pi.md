---
read_when:
    - Memahami desain integrasi Pi SDK di OpenClaw
    - Memodifikasi siklus hidup sesi agen, peralatan, atau pengkabelan penyedia untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-05-10T19:41:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw terintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan paket-paket saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk menjalankan kemampuan agen AI-nya.

## Ikhtisar

OpenClaw menggunakan SDK pi untuk menyematkan agen pengodean AI ke dalam arsitektur Gateway perpesanannya. Alih-alih menjalankan pi sebagai subproses atau menggunakan mode RPC, OpenClaw langsung mengimpor dan menginstansiasi `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tertanam ini menyediakan:

- Kontrol penuh atas siklus hidup sesi dan penanganan peristiwa
- Injeksi alat khusus (perpesanan, sandbox, tindakan khusus kanal)
- Penyesuaian prompt sistem per kanal/konteks
- Persistensi sesi dengan dukungan percabangan/Compaction
- Rotasi profil autentikasi multi-akun dengan failover
- Peralihan model yang agnostik terhadap penyedia

## Dependensi paket

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Paket             | Tujuan                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, tipe pesan, API penyedia                                  |
| `pi-agent-core`   | Loop agen, eksekusi alat, tipe `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, alat bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                         |

## Struktur file

```
src/agents/
├── pi-embedded-runner.ts          # Mengekspor ulang dari pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entri utama: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika satu percobaan dengan penyiapan sesi
│   │   ├── params.ts              # Tipe RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Membangun payload respons dari hasil eksekusi
│   │   ├── images.ts              # Injeksi gambar model visi
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Deteksi error abort
│   ├── cache-ttl.ts               # Pelacakan TTL cache untuk pemangkasan konteks
│   ├── compact.ts                 # Logika Compaction manual/otomatis
│   ├── extensions.ts              # Memuat ekstensi pi untuk eksekusi tertanam
│   ├── extra-params.ts            # Parameter stream khusus penyedia
│   ├── google.ts                  # Perbaikan pengurutan turn Google/Gemini
│   ├── history.ts                 # Pembatasan riwayat (DM vs grup)
│   ├── lanes.ts                   # Jalur perintah sesi/global
│   ├── logger.ts                  # Logger subsistem
│   ├── model.ts                   # Resolusi model melalui ModelRegistry
│   ├── runs.ts                    # Pelacakan eksekusi aktif, abort, antrean
│   ├── sandbox-info.ts            # Info sandbox untuk prompt sistem
│   ├── session-manager-cache.ts   # Cache instance SessionManager
│   ├── session-manager-init.ts    # Inisialisasi file sesi
│   ├── system-prompt.ts           # Pembuat prompt sistem
│   ├── tool-split.ts              # Memisahkan alat menjadi builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Pemetaan ThinkLevel, deskripsi error
├── pi-embedded-subscribe.ts       # Langganan/pengiriman peristiwa sesi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory handler peristiwa
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Pemotongan balasan blok streaming
├── pi-embedded-messaging.ts       # Pelacakan pengiriman alat perpesanan
├── pi-embedded-helpers.ts         # Klasifikasi error, validasi turn
├── pi-embedded-helpers/           # Modul helper
├── pi-embedded-utils.ts           # Utilitas pemformatan
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Pembungkusan AbortSignal untuk alat
├── pi-tools.policy.ts             # Kebijakan allowlist/denylist alat
├── pi-tools.read.ts               # Kustomisasi alat baca
├── pi-tools.schema.ts             # Normalisasi skema alat
├── pi-tools.types.ts              # Alias tipe AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override pengaturan
├── pi-hooks/                      # Hook pi khusus
│   ├── compaction-safeguard.ts    # Ekstensi safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Ekstensi pemangkasan konteks Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Resolusi profil autentikasi
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
├── tool-summaries.ts              # Ringkasan deskripsi alat
├── tool-policy.ts                 # Resolusi kebijakan alat
├── transcript-policy.ts           # Kebijakan validasi transkrip
├── skills.ts                      # Pembuatan snapshot/prompt Skills
├── skills/                        # Subsistem Skills
├── sandbox.ts                     # Resolusi konteks sandbox
├── sandbox/                       # Subsistem sandbox
├── channel-tools.ts               # Injeksi alat khusus kanal
├── openclaw-tools.ts              # Alat khusus OpenClaw
├── bash-tools.ts                  # Alat exec/process
├── apply-patch.ts                 # Alat apply_patch (OpenAI)
├── tools/                         # Implementasi alat individual
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

Runtime tindakan pesan khusus kanal kini berada di direktori ekstensi milik Plugin
alih-alih di bawah `src/agents/tools`, misalnya:

- file runtime tindakan Plugin Discord
- file runtime tindakan Plugin Slack
- file runtime tindakan Plugin Telegram
- file runtime tindakan Plugin WhatsApp

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

Peristiwa yang ditangani meliputi:

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

SDK menangani seluruh loop agen: mengirim ke LLM, mengeksekusi panggilan alat, melakukan streaming respons.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk turn tersebut. OpenClaw tidak memindai ulang turn riwayat yang lebih lama
untuk menginjeksi ulang payload gambar.

## Arsitektur alat

### Pipeline alat

1. **Alat Dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Pengganti Khusus**: OpenClaw mengganti bash dengan `exec`/`process`, menyesuaikan read/edit/write untuk sandbox
3. **Alat OpenClaw**: perpesanan, browser, canvas, sesi, Cron, Gateway, dll.
4. **Alat Kanal**: alat tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran Kebijakan**: Alat difilter berdasarkan kebijakan profil, penyedia, agen, grup, sandbox
6. **Normalisasi Skema**: Skema dibersihkan untuk kekhasan Gemini/OpenAI
7. **Pembungkusan AbortSignal**: Alat dibungkus agar menghormati sinyal abort

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

Ini memastikan pemfilteran kebijakan, integrasi sandbox, dan toolset tambahan OpenClaw tetap konsisten di seluruh provider.

## Konstruksi system prompt

System prompt dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Fungsi ini menyusun prompt lengkap dengan bagian-bagian yang mencakup Tooling, Gaya Tool Call, guardrail Keamanan, Kontrol OpenClaw, Skills, Dokumentasi, Workspace, Sandbox, Messaging, Direktif Output Assistant, Voice, Balasan Senyap, Heartbeat, metadata Runtime, serta Memory dan Reactions saat diaktifkan, dan file konteks opsional serta konten system prompt tambahan. Bagian-bagian dipangkas untuk mode prompt minimal yang digunakan oleh subagent.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen sesi

### File sesi

Sesi adalah file JSONL dengan struktur pohon (tautan id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil tool.

### Caching sesi

`session-manager-cache.ts` melakukan cache instance SessionManager untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis channel (DM vs grup).

### Compaction

Auto-compaction dipicu saat konteks meluap. Signature overflow umum
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

## Autentikasi dan resolusi model

### Profil auth

OpenClaw mengelola store profil auth dengan beberapa kunci API per provider:

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

### Safeguard Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan guardrail ke compaction, termasuk penganggaran token adaptif serta ringkasan kegagalan tool dan operasi file:

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

### Pemecahan blok

`EmbeddedBlockChunker` mengelola streaming teks menjadi blok balasan diskret:

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

Direktif balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` di-parse dan diekstrak:

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

Jika level thinking tidak didukung, sistem melakukan fallback:

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

Saat mode sandbox diaktifkan, tool dan path dibatasi:

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

## Penanganan Khusus Provider

### Anthropic

- Pembersihan string ajaib refusal
- Validasi turn untuk role berurutan
- Validasi ketat parameter tool Pi upstream

### Google/Gemini

- Sanitasi skema tool yang dimiliki Plugin

### OpenAI

- Tool `apply_patch` untuk model Codex
- Penanganan downgrade level thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang serupa dengan mode native Pi.

## Perbedaan utama dari Pi CLI

| Aspek           | Pi CLI                  | OpenClaw Embedded                                                                                   |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| Pemanggilan     | Perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                                  |
| Tool            | Tool coding default     | Rangkaian tool OpenClaw kustom                                                                      |
| System prompt   | AGENTS.md + prompt      | Dinamis per channel/konteks                                                                         |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Satu kredensial         | Multi-profil dengan rotasi                                                                          |
| Ekstensi        | Dimuat dari disk        | Terprogram + path disk                                                                              |
| Penanganan event | Rendering TUI          | Berbasis callback (onBlockReply, dll.)                                                              |

## Pertimbangan masa depan

Area yang berpotensi dikerjakan ulang:

1. **Penyelarasan signature tool**: Saat ini mengadaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambahkan keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` milik pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` telah menjadi besar
5. **Keunikan provider**: Banyak codepath khusus provider yang berpotensi dapat ditangani oleh pi

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
