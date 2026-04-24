---
read_when:
    - Memahami desain integrasi SDK Pi di OpenClaw
    - Memodifikasi siklus hidup sesi agen, tooling, atau wiring provider untuk Pi
summary: Arsitektur integrasi agen Pi tertanam OpenClaw dan siklus hidup sesi
title: Arsitektur integrasi Pi
x-i18n:
    generated_at: "2026-04-24T09:16:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Dokumen ini menjelaskan bagaimana OpenClaw berintegrasi dengan [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) dan package saudaranya (`pi-ai`, `pi-agent-core`, `pi-tui`) untuk mendukung kapabilitas agen AI-nya.

## Ikhtisar

OpenClaw menggunakan SDK pi untuk menanamkan agen coding AI ke dalam arsitektur gateway pesan. Alih-alih memunculkan pi sebagai subprocess atau menggunakan mode RPC, OpenClaw langsung mengimpor dan menginstansiasi `AgentSession` milik pi melalui `createAgentSession()`. Pendekatan tertanam ini menyediakan:

- Kontrol penuh atas siklus hidup sesi dan penanganan peristiwa
- Injeksi alat kustom (pesan, sandbox, tindakan khusus kanal)
- Kustomisasi system prompt per kanal/konteks
- Persistensi sesi dengan dukungan branching/Compaction
- Rotasi profil auth multi-akun dengan failover
- Peralihan model agnostik provider

## Dependensi package

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Package           | Tujuan                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstraksi LLM inti: `Model`, `streamSimple`, tipe pesan, API provider                                  |
| `pi-agent-core`   | Loop agen, eksekusi alat, tipe `AgentMessage`                                                          |
| `pi-coding-agent` | SDK tingkat tinggi: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, alat bawaan |
| `pi-tui`          | Komponen UI terminal (digunakan dalam mode TUI lokal OpenClaw)                                         |

## Struktur file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export dari pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entri utama: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika percobaan tunggal dengan penyiapan sesi
│   │   ├── params.ts              # Tipe RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Membangun payload respons dari hasil eksekusi
│   │   ├── images.ts              # Injeksi gambar model vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Deteksi error abort
│   ├── cache-ttl.ts               # Pelacakan TTL cache untuk pruning konteks
│   ├── compact.ts                 # Logika Compaction manual/otomatis
│   ├── extensions.ts              # Muat ekstensi pi untuk eksekusi tertanam
│   ├── extra-params.ts            # Parameter stream khusus provider
│   ├── google.ts                  # Perbaikan urutan giliran Google/Gemini
│   ├── history.ts                 # Batas riwayat (DM vs grup)
│   ├── lanes.ts                   # Lane perintah sesi/global
│   ├── logger.ts                  # Logger subsistem
│   ├── model.ts                   # Resolusi model melalui ModelRegistry
│   ├── runs.ts                    # Pelacakan eksekusi aktif, abort, antrean
│   ├── sandbox-info.ts            # Info sandbox untuk system prompt
│   ├── session-manager-cache.ts   # Caching instance SessionManager
│   ├── session-manager-init.ts    # Inisialisasi file sesi
│   ├── system-prompt.ts           # Builder system prompt
│   ├── tool-split.ts              # Membagi alat menjadi builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Pemetaan ThinkLevel, deskripsi error
├── pi-embedded-subscribe.ts       # Langganan/pengiriman peristiwa sesi
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Pabrik handler peristiwa
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking balasan blok streaming
├── pi-embedded-messaging.ts       # Pelacakan pengiriman alat pesan
├── pi-embedded-helpers.ts         # Klasifikasi error, validasi giliran
├── pi-embedded-helpers/           # Modul helper
├── pi-embedded-utils.ts           # Utilitas pemformatan
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Pembungkus AbortSignal untuk alat
├── pi-tools.policy.ts             # Kebijakan allowlist/denylist alat
├── pi-tools.read.ts               # Kustomisasi alat read
├── pi-tools.schema.ts             # Normalisasi skema alat
├── pi-tools.types.ts              # Alias tipe AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override settings
├── pi-hooks/                      # Hook pi kustom
│   ├── compaction-safeguard.ts    # Ekstensi safeguard
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
├── system-prompt-params.ts        # Resolusi parameter system prompt
├── system-prompt-report.ts        # Pembuatan laporan debug
├── tool-summaries.ts              # Ringkasan deskripsi alat
├── tool-policy.ts                 # Resolusi kebijakan alat
├── transcript-policy.ts           # Kebijakan validasi transkrip
├── skills.ts                      # Snapshot skill/pembuatan prompt
├── skills/                        # Subsistem skill
├── sandbox.ts                     # Resolusi konteks sandbox
├── sandbox/                       # Subsistem sandbox
├── channel-tools.ts               # Injeksi alat khusus kanal
├── openclaw-tools.ts              # Alat khusus OpenClaw
├── bash-tools.ts                  # alat exec/process
├── apply-patch.ts                 # alat apply_patch (OpenAI)
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

Runtime tindakan pesan khusus kanal sekarang berada di direktori ekstensi
milik Plugin, bukan di bawah `src/agents/tools`, misalnya:

- file runtime tindakan Plugin Discord
- file runtime tindakan Plugin Slack
- file runtime tindakan Plugin Telegram
- file runtime tindakan Plugin WhatsApp

## Alur integrasi inti

### 1. Menjalankan agen tertanam

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

### 3. Langganan peristiwa

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

- `message_start` / `message_end` / `message_update` (streaming teks/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Setelah penyiapan, sesi diberi prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK menangani loop agen penuh: mengirim ke LLM, mengeksekusi pemanggilan alat, dan melakukan streaming respons.

Injeksi gambar bersifat lokal terhadap prompt: OpenClaw memuat referensi gambar dari prompt saat ini dan
meneruskannya melalui `images` hanya untuk giliran itu. OpenClaw tidak memindai ulang giliran riwayat lama
untuk menyisipkan ulang payload gambar.

## Arsitektur alat

### Pipeline alat

1. **Alat dasar**: `codingTools` milik pi (read, bash, edit, write)
2. **Pengganti kustom**: OpenClaw mengganti bash dengan `exec`/`process`, menyesuaikan read/edit/write untuk sandbox
3. **Alat OpenClaw**: messaging, browser, canvas, sessions, Cron, gateway, dll.
4. **Alat kanal**: alat tindakan khusus Discord/Telegram/Slack/WhatsApp
5. **Pemfilteran kebijakan**: alat difilter berdasarkan profil, provider, agen, grup, dan kebijakan sandbox
6. **Normalisasi skema**: skema dibersihkan untuk kekhasan Gemini/OpenAI
7. **Pembungkus AbortSignal**: alat dibungkus agar menghormati sinyal abort

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
      // signature pi-coding-agent berbeda dari pi-agent-core
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
    builtInTools: [], // Kosong. Kami override semuanya
    customTools: toToolDefinitions(options.tools),
  };
}
```

Ini memastikan pemfilteran kebijakan OpenClaw, integrasi sandbox, dan kumpulan alat yang diperluas tetap konsisten di seluruh provider.

## Konstruksi system prompt

System prompt dibangun di `buildAgentSystemPrompt()` (`system-prompt.ts`). Fungsi ini merakit prompt penuh dengan bagian-bagian termasuk Tooling, Tool Call Style, guardrail Safety, referensi CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadata Runtime, ditambah Memory dan Reactions saat diaktifkan, serta file konteks opsional dan konten system prompt tambahan. Bagian-bagian ini dipangkas untuk mode prompt minimal yang digunakan oleh subagen.

Prompt diterapkan setelah pembuatan sesi melalui `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Manajemen sesi

### File sesi

Sesi adalah file JSONL dengan struktur tree (penghubung id/parentId). `SessionManager` milik Pi menangani persistensi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw membungkus ini dengan `guardSessionManager()` untuk keamanan hasil alat.

### Caching sesi

`session-manager-cache.ts` melakukan cache instance SessionManager untuk menghindari parsing file berulang:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Pembatasan riwayat

`limitHistoryTurns()` memangkas riwayat percakapan berdasarkan jenis kanal (DM vs grup).

### Compaction

Auto-Compaction dipicu saat konteks meluap. Tanda umum overflow
mencakup `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, dan `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` menangani
Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autentikasi & resolusi model

### Profil auth

OpenClaw memelihara penyimpanan profil auth dengan beberapa API key per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profil berotasi saat terjadi kegagalan dengan pelacakan cooldown:

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

// Menggunakan ModelRegistry dan AuthStorage milik pi
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

### Safeguard Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` menambahkan guardrail ke Compaction, termasuk penganggaran token adaptif plus ringkasan kegagalan alat dan operasi file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning konteks

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

## Streaming & balasan blok

### Chunking blok

`EmbeddedBlockChunker` mengelola streaming teks menjadi blok balasan terpisah:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Penghapusan tag thinking/final

Output streaming diproses untuk menghapus blok `<think>`/`<thinking>` dan mengekstrak konten `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Hapus konten <think>...</think>
  // Jika enforceFinalTag, kembalikan hanya konten <final>...</final>
};
```

### Directive balasan

Directive balasan seperti `[[media:url]]`, `[[voice]]`, `[[reply:id]]` diurai dan diekstrak:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Penanganan error

### Klasifikasi error

`pi-embedded-helpers.ts` mengklasifikasikan error untuk penanganan yang sesuai:

```typescript
isContextOverflowError(errorText)     // Konteks terlalu besar
isCompactionFailureError(errorText)   // Compaction gagal
isAuthAssistantError(lastAssistant)   // Kegagalan auth
isRateLimitAssistantError(...)        // Terkena rate limit
isFailoverAssistantError(...)         // Harus failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback tingkat thinking

Jika tingkat thinking tidak didukung, digunakan fallback:

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
  // Gunakan alat read/edit/write yang di-sandbox
  // Exec berjalan di container
  // Browser menggunakan URL bridge
}
```

## Penanganan khusus provider

### Anthropic

- Scrubbing magic string refusal
- Validasi giliran untuk peran berurutan
- Validasi parameter alat Pi upstream yang ketat

### Google/Gemini

- Sanitasi skema alat milik Plugin

### OpenAI

- Alat `apply_patch` untuk model Codex
- Penanganan downgrade tingkat thinking

## Integrasi TUI

OpenClaw juga memiliki mode TUI lokal yang menggunakan komponen pi-tui secara langsung:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Ini menyediakan pengalaman terminal interaktif yang mirip dengan mode native pi.

## Perbedaan utama dari Pi CLI

| Aspek           | Pi CLI                  | OpenClaw Embedded                                                                             |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Invocation      | perintah `pi` / RPC     | SDK melalui `createAgentSession()`                                                            |
| Alat            | alat coding default     | kumpulan alat OpenClaw kustom                                                                 |
| System prompt   | `AGENTS.md` + prompt    | dinamis per kanal/konteks                                                                     |
| Penyimpanan sesi | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (atau `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | satu kredensial         | multi-profil dengan rotasi                                                                    |
| Ekstensi        | dimuat dari disk        | programatik + path disk                                                                       |
| Penanganan peristiwa | rendering TUI      | berbasis callback (`onBlockReply`, dll.)                                                      |

## Pertimbangan masa depan

Area yang berpotensi untuk dikerjakan ulang:

1. **Penyelarasan signature alat**: Saat ini melakukan adaptasi antara signature pi-agent-core dan pi-coding-agent
2. **Pembungkusan session manager**: `guardSessionManager` menambah keamanan tetapi meningkatkan kompleksitas
3. **Pemuatan ekstensi**: Dapat menggunakan `ResourceLoader` milik pi secara lebih langsung
4. **Kompleksitas handler streaming**: `subscribeEmbeddedPiSession` sudah membesar
5. **Kekhasan provider**: Banyak codepath khusus provider yang berpotensi dapat ditangani oleh pi

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktifkan `OPENCLAW_LIVE_TEST=1`)

Untuk perintah eksekusi saat ini, lihat [Alur kerja Pengembangan Pi](/id/pi-dev).

## Terkait

- [Alur kerja pengembangan Pi](/id/pi-dev)
- [Ikhtisar instalasi](/id/install)
