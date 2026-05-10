---
read_when:
    - ทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - การปรับเปลี่ยนวงจรชีวิตเซสชันของเอเจนต์ เครื่องมือ หรือการเชื่อมต่อผู้ให้บริการสำหรับ Pi
summary: สถาปัตยกรรมของการผสานรวมเอเจนต์ Pi แบบฝังตัวของ OpenClaw และวงจรชีวิตเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-05-10T19:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw ผสานการทำงานกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจพี่น้อง (`pi-ai`, `pi-agent-core`, `pi-tui`) เพื่อขับเคลื่อนความสามารถของ AI agent

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝัง AI coding agent เข้าไปในสถาปัตยกรรม messaging gateway แทนที่จะเรียก pi เป็น subprocess หรือใช้โหมด RPC, OpenClaw จะ import และสร้างอินสแตนซ์ `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` แนวทางแบบฝังนี้ให้:

- การควบคุมวงจรชีวิตของเซสชันและการจัดการอีเวนต์อย่างเต็มรูปแบบ
- การ inject เครื่องมือแบบกำหนดเอง (messaging, sandbox, การกระทำเฉพาะ channel)
- การปรับแต่ง system prompt ต่อ channel/context
- การคงอยู่ของเซสชันพร้อมรองรับ branching/compaction
- การหมุนเวียน auth profile หลายบัญชีพร้อม failover
- การสลับโมเดลแบบไม่ผูกกับผู้ให้บริการ

## การพึ่งพาแพ็กเกจ

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| แพ็กเกจ           | วัตถุประสงค์                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | abstraction หลักของ LLM: `Model`, `streamSimple`, ชนิดข้อความ, API ของผู้ให้บริการ                           |
| `pi-agent-core`   | agent loop, การเรียกใช้เครื่องมือ, ชนิด `AgentMessage`                                                       |
| `pi-coding-agent` | SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, เครื่องมือในตัว |
| `pi-tui`          | คอมโพเนนต์ Terminal UI (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                                             |

## โครงสร้างไฟล์

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

runtime ของการกระทำกับข้อความเฉพาะ channel ตอนนี้อยู่ในไดเรกทอรี extension
ที่ Plugin เป็นเจ้าของ แทนที่จะอยู่ใต้ `src/agents/tools` เช่น:

- ไฟล์ runtime ของการกระทำใน Plugin Discord
- ไฟล์ runtime ของการกระทำใน Plugin Slack
- ไฟล์ runtime ของการกระทำใน Plugin Telegram
- ไฟล์ runtime ของการกระทำใน Plugin WhatsApp

## โฟลว์การผสานหลัก

### 1. การรัน Embedded Agent

จุดเข้าใช้งานหลักคือ `runEmbeddedPiAgent()` ใน `pi-embedded-runner/run.ts`:

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

### 2. การสร้างเซสชัน

ภายใน `runEmbeddedAttempt()` (ซึ่งถูกเรียกโดย `runEmbeddedPiAgent()`) จะใช้ pi SDK:

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

### 3. การ subscribe อีเวนต์

`subscribeEmbeddedPiSession()` subscribe อีเวนต์ของ `AgentSession` ของ pi:

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

อีเวนต์ที่จัดการรวมถึง:

- `message_start` / `message_end` / `message_update` (ข้อความ/การคิดแบบ streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. การ prompt

หลังตั้งค่าเสร็จ จะส่ง prompt ให้เซสชัน:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จัดการ agent loop ทั้งหมด: ส่งไปยัง LLM, เรียกใช้ tool calls, stream คำตอบ

การ inject รูปภาพเป็นแบบเฉพาะ prompt: OpenClaw โหลด image refs จาก prompt ปัจจุบันและ
ส่งผ่าน `images` สำหรับ turn นั้นเท่านั้น โดยจะไม่สแกน turn ประวัติที่เก่ากว่าอีกครั้ง
เพื่อ inject payload รูปภาพซ้ำ

## สถาปัตยกรรมเครื่องมือ

### Pipeline ของเครื่องมือ

1. **เครื่องมือพื้นฐาน**: `codingTools` ของ pi (read, bash, edit, write)
2. **การแทนที่แบบกำหนดเอง**: OpenClaw แทนที่ bash ด้วย `exec`/`process` และปรับ read/edit/write สำหรับ sandbox
3. **เครื่องมือ OpenClaw**: messaging, browser, canvas, sessions, cron, gateway ฯลฯ
4. **เครื่องมือ Channel**: เครื่องมือการกระทำเฉพาะ Discord/Telegram/Slack/WhatsApp
5. **การกรองตามนโยบาย**: กรองเครื่องมือตาม profile, provider, agent, group, นโยบาย sandbox
6. **การ normalize schema**: ล้าง schema สำหรับพฤติกรรมเฉพาะของ Gemini/OpenAI
7. **การห่อ AbortSignal**: ห่อเครื่องมือเพื่อให้เคารพสัญญาณ abort

### Adapter ของคำจำกัดความเครื่องมือ

`AgentTool` ของ pi-agent-core มี signature ของ `execute` แตกต่างจาก `ToolDefinition` ของ pi-coding-agent Adapter ใน `pi-tool-definition-adapter.ts` เชื่อมความต่างนี้:

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

### กลยุทธ์การแยกเครื่องมือ

`splitSdkTools()` ส่งเครื่องมือทั้งหมดผ่าน `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

สิ่งนี้ทำให้การกรองนโยบาย การผสานรวม sandbox และชุดเครื่องมือที่ขยายเพิ่มของ OpenClaw ยังคงสอดคล้องกันในทุก provider

## การสร้าง system prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยประกอบ prompt เต็มรูปแบบที่มีส่วนต่าง ๆ เช่น Tooling, Tool Call Style, รั้วป้องกันด้านความปลอดภัย, OpenClaw Control, Skills, Docs, Workspace, Sandbox, Messaging, Assistant Output Directives, Voice, Silent Replies, Heartbeats, Runtime metadata รวมถึง Memory และ Reactions เมื่อเปิดใช้งาน และไฟล์บริบทเสริมกับเนื้อหา system prompt เพิ่มเติมแบบเลือกได้ ส่วนต่าง ๆ จะถูกตัดให้สั้นลงสำหรับโหมด prompt ขั้นต่ำที่ subagents ใช้

prompt จะถูกนำไปใช้หลังจากสร้าง session ผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการ session

### ไฟล์ session

Session เป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมด้วย id/parentId) `SessionManager` ของ Pi จัดการการคงอยู่ของข้อมูล:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw ครอบสิ่งนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์เครื่องมือ

### การแคช session

`session-manager-cache.ts` แคชอินสแตนซ์ SessionManager เพื่อหลีกเลี่ยงการแยกวิเคราะห์ไฟล์ซ้ำ:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` ตัดประวัติการสนทนาตามประเภทช่องทาง (DM เทียบกับกลุ่ม)

### Compaction

Auto-compaction จะทำงานเมื่อบริบทล้น ลายเซ็นการล้นที่พบบ่อย
รวมถึง `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` และ `ollama error: context
length exceeded` `compactEmbeddedPiSessionDirect()` จัดการ Compaction
ด้วยตนเอง:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการแก้ค่าโมเดล

### โปรไฟล์ยืนยันตัวตน

OpenClaw ดูแลที่เก็บโปรไฟล์ยืนยันตัวตนที่มี API key หลายรายการต่อ provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

โปรไฟล์จะหมุนเวียนเมื่อเกิดความล้มเหลว พร้อมการติดตามช่วงพัก:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การแก้ค่าโมเดล

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

### การสลับเมื่อเกิดความล้มเหลว

`FailoverError` กระตุ้นให้ถอยไปใช้โมเดลสำรองเมื่อกำหนดค่าไว้:

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

## ส่วนขยาย Pi

OpenClaw โหลดส่วนขยาย pi แบบกำหนดเองสำหรับพฤติกรรมเฉพาะทาง:

### กลไกป้องกัน Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่มรั้วป้องกันให้กับ Compaction รวมถึงการจัดสรรงบโทเค็นแบบปรับตัวได้ ตลอดจนสรุปความล้มเหลวของเครื่องมือและการดำเนินการกับไฟล์:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### การตัดบริบท

`src/agents/pi-hooks/context-pruning.ts` ใช้การตัดบริบทตาม cache-TTL:

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

## การสตรีมและการตอบกลับแบบบล็อก

### การแบ่งบล็อกเป็นชิ้น

`EmbeddedBlockChunker` จัดการข้อความสตรีมให้เป็นบล็อกตอบกลับแยกกัน:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### การตัดแท็ก Thinking/Final

เอาต์พุตสตรีมจะถูกประมวลผลเพื่อตัดบล็อก `<think>`/`<thinking>` และดึงเนื้อหา `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### คำสั่งกำกับการตอบกลับ

คำสั่งกำกับการตอบกลับ เช่น `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูกแยกวิเคราะห์และดึงออกมา:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## การจัดการข้อผิดพลาด

### การจัดประเภทข้อผิดพลาด

`pi-embedded-helpers.ts` จัดประเภทข้อผิดพลาดเพื่อการจัดการที่เหมาะสม:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### การถอยระดับ thinking

หากไม่รองรับระดับ thinking จะถอยไปใช้ระดับสำรอง:

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

## การผสานรวม sandbox

เมื่อเปิดใช้โหมด sandbox เครื่องมือและพาธจะถูกจำกัด:

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

## การจัดการเฉพาะ Provider

### Anthropic

- การล้าง magic string การปฏิเสธ
- การตรวจสอบ turn สำหรับบทบาทที่ต่อเนื่องกัน
- การตรวจสอบพารามิเตอร์เครื่องมือ Pi upstream อย่างเข้มงวด

### Google/Gemini

- การทำความสะอาด schema เครื่องมือที่ Plugin เป็นเจ้าของ

### OpenAI

- เครื่องมือ `apply_patch` สำหรับโมเดล Codex
- การจัดการการลดระดับ thinking

## การผสานรวม TUI

OpenClaw ยังมีโหมด TUI ภายในเครื่องที่ใช้คอมโพเนนต์ pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้ให้ประสบการณ์เทอร์มินัลแบบโต้ตอบที่คล้ายกับโหมดเนทีฟของ pi

## ความแตกต่างหลักจาก Pi CLI

| ด้าน | Pi CLI | OpenClaw แบบฝัง |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| การเรียกใช้งาน | คำสั่ง `pi` / RPC | SDK ผ่าน `createAgentSession()` |
| เครื่องมือ | เครื่องมือเขียนโค้ดเริ่มต้น | ชุดเครื่องมือ OpenClaw แบบกำหนดเอง |
| system prompt | AGENTS.md + prompts | แบบไดนามิกตามช่องทาง/บริบท |
| การจัดเก็บ session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| การยืนยันตัวตน | ข้อมูลลับชุดเดียว | หลายโปรไฟล์พร้อมการหมุนเวียน |
| ส่วนขยาย | โหลดจากดิสก์ | แบบโปรแกรม + พาธบนดิสก์ |
| การจัดการเหตุการณ์ | การเรนเดอร์ TUI | อิง callback (onBlockReply ฯลฯ) |

## สิ่งที่ควรพิจารณาในอนาคต

พื้นที่ที่อาจปรับปรุงใหม่:

1. **การจัดแนวลายเซ็นเครื่องมือ**: ปัจจุบันปรับระหว่างลายเซ็นของ pi-agent-core และ pi-coding-agent
2. **การครอบ session manager**: `guardSessionManager` เพิ่มความปลอดภัยแต่เพิ่มความซับซ้อน
3. **การโหลดส่วนขยาย**: อาจใช้ `ResourceLoader` ของ pi โดยตรงมากขึ้น
4. **ความซับซ้อนของตัวจัดการสตรีม**: `subscribeEmbeddedPiSession` มีขนาดใหญ่ขึ้นมาก
5. **ความเฉพาะตัวของ provider**: มี codepath เฉพาะ provider จำนวนมากที่ pi อาจจัดการได้

## การทดสอบ

ความครอบคลุมของการผสานรวม Pi อยู่ในชุดทดสอบเหล่านี้:

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

แบบ live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดใช้ `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งรันปัจจุบัน โปรดดู [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)

## ที่เกี่ยวข้อง

- [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)
- [ภาพรวมการติดตั้ง](/th/install)
