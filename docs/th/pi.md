---
read_when:
    - ทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - กำลังแก้ไขวงจรชีวิตของเซสชันเอเจนต์ tooling หรือการเชื่อมต่อ provider สำหรับ Pi
summary: สถาปัตยกรรมของการผสานรวม Pi agent แบบฝังในตัวของ OpenClaw และวงจรชีวิตของเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-04-25T13:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

เอกสารนี้อธิบายว่า OpenClaw ผสานรวมกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจพี่น้องของมัน (`pi-ai`, `pi-agent-core`, `pi-tui`) เพื่อขับเคลื่อนความสามารถของ AI agent อย่างไร

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝัง AI coding agent เข้าไปในสถาปัตยกรรม messaging gateway ของตัวเอง แทนที่จะสปิน pi เป็น subprocess หรือใช้โหมด RPC OpenClaw จะ import และสร้างอินสแตนซ์ `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` แนวทางแบบฝังในตัวนี้ให้:

- การควบคุมวงจรชีวิตของเซสชันและการจัดการเหตุการณ์อย่างเต็มรูปแบบ
- การ inject tools แบบกำหนดเอง (messaging, sandbox, การกระทำเฉพาะช่องทาง)
- การปรับแต่ง system prompt ต่อช่องทาง/บริบท
- การคงอยู่ของเซสชันพร้อมการรองรับ branching/Compaction
- การหมุนเวียน auth profile หลายบัญชีพร้อม failover
- การสลับ model แบบไม่ผูกกับผู้ให้บริการ

## Dependencies ของแพ็กเกจ

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| แพ็กเกจ          | วัตถุประสงค์                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | แอบสแตรกชัน LLM หลัก: `Model`, `streamSimple`, ชนิดข้อความ, APIs ของผู้ให้บริการ                     |
| `pi-agent-core`  | ลูปเอเจนต์, การรัน tools, ชนิด `AgentMessage`                                                         |
| `pi-coding-agent` | SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, built-in tools |
| `pi-tui`         | คอมโพเนนต์ UI สำหรับเทอร์มินัล (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                              |

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

รันไทม์การกระทำข้อความเฉพาะช่องทางตอนนี้อยู่ในไดเรกทอรีส่วนขยายที่ Plugin เป็นเจ้าของ
แทนที่จะอยู่ภายใต้ `src/agents/tools` ตัวอย่างเช่น:

- ไฟล์รันไทม์การกระทำของ Discord Plugin
- ไฟล์รันไทม์การกระทำของ Slack Plugin
- ไฟล์รันไทม์การกระทำของ Telegram Plugin
- ไฟล์รันไทม์การกระทำของ WhatsApp Plugin

## โฟลว์การผสานรวมหลัก

### 1. การรัน Embedded Agent

จุดเริ่มต้นหลักคือ `runEmbeddedPiAgent()` ใน `pi-embedded-runner/run.ts`:

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

### 3. การ subscribe กับเหตุการณ์

`subscribeEmbeddedPiSession()` จะ subscribe กับเหตุการณ์ของ `AgentSession` จาก pi:

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

เหตุการณ์ที่จัดการรวมถึง:

- `message_start` / `message_end` / `message_update` (ข้อความ/การคิดแบบสตรีม)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. การส่ง prompt

หลังจากตั้งค่าเสร็จแล้ว เซสชันจะถูกส่ง prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จะจัดการลูปเอเจนต์ทั้งหมด: ส่งไปยัง LLM, รันการเรียกใช้ tool และสตรีมการตอบกลับ

การ inject รูปภาพเป็นแบบเฉพาะ prompt: OpenClaw จะโหลด refs ของรูปภาพจาก prompt ปัจจุบันและ
ส่งผ่านด้วย `images` สำหรับเทิร์นนั้นเท่านั้น มันจะไม่สแกนประวัติเทิร์นเก่าเพื่อ
inject payload ของรูปภาพซ้ำ

## สถาปัตยกรรมของ Tool

### Pipeline ของ Tool

1. **Base Tools**: `codingTools` ของ pi (`read`, `bash`, `edit`, `write`)
2. **Custom Replacements**: OpenClaw แทนที่ bash ด้วย `exec`/`process`, และปรับแต่ง read/edit/write สำหรับ sandbox
3. **OpenClaw Tools**: messaging, browser, canvas, sessions, cron, gateway ฯลฯ
4. **Channel Tools**: action tools เฉพาะของ Discord/Telegram/Slack/WhatsApp
5. **Policy Filtering**: tools ถูกกรองตามนโยบายของ profile, provider, agent, group และ sandbox
6. **Schema Normalization**: schemas ถูกทำความสะอาดสำหรับลักษณะเฉพาะของ Gemini/OpenAI
7. **AbortSignal Wrapping**: tools ถูกห่อให้เคารพ abort signals

### Adapter ของ Tool Definition

`AgentTool` ของ pi-agent-core มีลายเซ็น `execute` ต่างจาก `ToolDefinition` ของ pi-coding-agent Adapter ใน `pi-tool-definition-adapter.ts` เชื่อมสองสิ่งนี้เข้าด้วยกัน:

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

### กลยุทธ์การแยก Tool

`splitSdkTools()` จะส่ง tools ทั้งหมดผ่าน `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

สิ่งนี้ช่วยให้การกรองตามนโยบายของ OpenClaw การผสานรวม sandbox และชุดเครื่องมือที่ขยายเพิ่ม ยังคงสอดคล้องกันในทุกผู้ให้บริการ

## การสร้าง system prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยจะประกอบ prompt แบบเต็มพร้อมส่วนต่าง ๆ เช่น Tooling, Tool Call Style, ราวป้องกันด้านความปลอดภัย, เอกสารอ้างอิง OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, ข้อมูลเมตาของรันไทม์ รวมถึง Memory และ Reactions เมื่อเปิดใช้ และยังมี context files และเนื้อหา system prompt เพิ่มเติมแบบไม่บังคับ ส่วนต่าง ๆ จะถูกตัดให้สั้นลงสำหรับโหมด prompt แบบขั้นต่ำที่ใช้โดย subagents

prompt จะถูกนำไปใช้หลังการสร้างเซสชันผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการเซสชัน

### ไฟล์เซสชัน

เซสชันเป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมโยงกันด้วย id/parentId) `SessionManager` ของ Pi จัดการการคงอยู่ของข้อมูล:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw ห่อสิ่งนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์จาก tool

### การแคชเซสชัน

`session-manager-cache.ts` จะแคชอินสแตนซ์ของ SessionManager เพื่อหลีกเลี่ยงการแยกวิเคราะห์ไฟล์ซ้ำ:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` จะตัดประวัติการสนทนาตามประเภทของ channel (DM เทียบกับกลุ่ม)

### Compaction

Compaction อัตโนมัติจะทำงานเมื่อ context ล้น รูปแบบลายเซ็นที่พบบ่อยของการล้น
ได้แก่ `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` และ `ollama error: context
length exceeded` ส่วน `compactEmbeddedPiSessionDirect()` จัดการ
Compaction แบบแมนนวล:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการ resolve model

### Auth Profiles

OpenClaw ดูแล auth profile store ที่รองรับหลาย API key ต่อผู้ให้บริการ:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profiles จะหมุนเวียนเมื่อเกิดความล้มเหลว พร้อมการติดตาม cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การ resolve model

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

`FailoverError` จะกระตุ้นให้เกิด fallback ของ model เมื่อมีการกำหนดค่าไว้:

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

## Pi Extensions

OpenClaw โหลด Pi extensions แบบกำหนดเองสำหรับพฤติกรรมเฉพาะทาง:

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่มราวป้องกันให้กับ Compaction รวมถึง adaptive token budgeting พร้อมสรุปความล้มเหลวของ tool และการทำงานกับไฟล์:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` ใช้การตัดแต่ง context ตาม cache-TTL:

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

## การสตรีมและ Block Replies

### Block Chunking

`EmbeddedBlockChunker` จัดการข้อความที่สตรีมให้เป็นบล็อกคำตอบแยกกัน:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### การตัดแท็ก Thinking/Final

เอาต์พุตแบบสตรีมจะถูกประมวลผลเพื่อตัดบล็อก `<think>`/`<thinking>` และดึงเนื้อหา `<final>` ออกมา:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Reply Directives

reply directives เช่น `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูกแยกวิเคราะห์และดึงออก:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## การจัดการข้อผิดพลาด

### การจัดประเภทข้อผิดพลาด

`pi-embedded-helpers.ts` จัดประเภทข้อผิดพลาดเพื่อให้จัดการได้อย่างเหมาะสม:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback ของระดับ Thinking

หากไม่รองรับระดับ thinking ก็จะ fallback:

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

## การผสานรวม Sandbox

เมื่อเปิดใช้โหมด sandbox tools และ paths จะถูกจำกัด:

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

## การจัดการเฉพาะผู้ให้บริการ

### Anthropic

- การล้าง magic string ของการปฏิเสธ
- การตรวจสอบเทิร์นสำหรับบทบาทที่ต่อเนื่องกัน
- การตรวจสอบพารามิเตอร์ของ Pi tool แบบเข้มงวดในฝั่ง upstream

### Google/Gemini

- การทำความสะอาด schema ของ tool ที่ Plugin เป็นเจ้าของ

### OpenAI

- tool `apply_patch` สำหรับ Codex models
- การจัดการการลดระดับ thinking level

## การผสานรวม TUI

OpenClaw ยังมีโหมด TUI ในเครื่องที่ใช้คอมโพเนนต์ของ pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้มอบประสบการณ์แบบเทอร์มินัลโต้ตอบที่คล้ายกับโหมด native ของ pi

## ความแตกต่างหลักจาก Pi CLI

| ด้าน             | Pi CLI                  | OpenClaw Embedded                                                                              |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| การเรียกใช้งาน    | คำสั่ง `pi` / RPC       | SDK ผ่าน `createAgentSession()`                                                                |
| Tools            | เครื่องมือ coding เริ่มต้น | ชุดเครื่องมือแบบกำหนดเองของ OpenClaw                                                          |
| System prompt    | AGENTS.md + prompts     | แบบไดนามิกตาม channel/context                                                                  |
| Session storage  | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth             | ข้อมูลรับรองชุดเดียว      | หลายโปรไฟล์พร้อมการหมุนเวียน                                                                   |
| Extensions       | โหลดจากดิสก์             | แบบโปรแกรม + paths บนดิสก์                                                                    |
| Event handling   | การเรนเดอร์ TUI         | แบบ callback (`onBlockReply` เป็นต้น)                                                          |

## สิ่งที่ควรพิจารณาในอนาคต

จุดที่อาจต้องปรับโครงสร้างใหม่:

1. **การจัดแนวลายเซ็นของ tool**: ปัจจุบันต้องมีการแปลงระหว่างลายเซ็นของ pi-agent-core และ pi-coding-agent
2. **การห่อ session manager**: `guardSessionManager` เพิ่มความปลอดภัยแต่ก็เพิ่มความซับซ้อน
3. **การโหลด extensions**: อาจใช้ `ResourceLoader` ของ Pi โดยตรงได้มากขึ้น
4. **ความซับซ้อนของตัวจัดการสตรีม**: `subscribeEmbeddedPiSession` เติบโตจนมีขนาดใหญ่
5. **ลักษณะเฉพาะของผู้ให้บริการ**: มี codepaths เฉพาะผู้ให้บริการหลายจุด ซึ่ง Pi อาจจัดการได้เองในอนาคต

## Tests

ความครอบคลุมของการผสานรวม Pi ครอบคลุมชุดทดสอบเหล่านี้:

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

แบบสด/ต้องเปิดใช้เอง:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดด้วย `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งรันปัจจุบัน ดู [Pi Development Workflow](/th/pi-dev)

## ที่เกี่ยวข้อง

- [Pi development workflow](/th/pi-dev)
- [Install overview](/th/install)
