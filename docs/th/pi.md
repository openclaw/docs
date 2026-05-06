---
read_when:
    - ทำความเข้าใจการออกแบบการผสานรวม Pi SDK ใน OpenClaw
    - การปรับแก้วงจรชีวิตของเซสชันเอเจนต์ เครื่องมือ หรือการเชื่อมต่อผู้ให้บริการสำหรับ Pi
summary: สถาปัตยกรรมการผสานรวมเอเจนต์ Pi แบบฝังตัวของ OpenClaw และวงจรชีวิตของเซสชัน
title: สถาปัตยกรรมการผสานรวม Pi
x-i18n:
    generated_at: "2026-05-06T09:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: abd9e828b0a72ac4e796f33c247bb2b5d7143ddf5e897ad9d7380cfbfce1eb64
    source_path: pi.md
    workflow: 16
---

OpenClaw ผสานการทำงานกับ [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) และแพ็กเกจพี่น้อง (`pi-ai`, `pi-agent-core`, `pi-tui`) เพื่อขับเคลื่อนความสามารถของเอเจนต์ AI

## ภาพรวม

OpenClaw ใช้ pi SDK เพื่อฝังเอเจนต์เขียนโค้ด AI เข้าในสถาปัตยกรรม Gateway สำหรับการส่งข้อความ แทนที่จะเรียก pi เป็น subprocess หรือใช้โหมด RPC, OpenClaw จะนำเข้าและสร้าง `AgentSession` ของ pi โดยตรงผ่าน `createAgentSession()` แนวทางแบบฝังตัวนี้ให้ความสามารถต่อไปนี้:

- ควบคุมวงจรชีวิตของเซสชันและการจัดการเหตุการณ์ได้เต็มรูปแบบ
- ฉีดเครื่องมือแบบกำหนดเอง (การส่งข้อความ, sandbox, การกระทำเฉพาะช่องทาง)
- ปรับแต่ง system prompt ต่อช่องทาง/บริบท
- เก็บสถานะเซสชันพร้อมรองรับการแตกกิ่ง/Compaction
- หมุนเวียนโปรไฟล์ยืนยันตัวตนหลายบัญชีพร้อม failover
- สลับโมเดลโดยไม่ผูกกับผู้ให้บริการ

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
| `pi-ai`           | โครงสร้างนามธรรม LLM หลัก: `Model`, `streamSimple`, ประเภทข้อความ, API ของผู้ให้บริการ                           |
| `pi-agent-core`   | ลูปเอเจนต์, การเรียกใช้เครื่องมือ, ประเภท `AgentMessage`                                                       |
| `pi-coding-agent` | SDK ระดับสูง: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, เครื่องมือในตัว |
| `pi-tui`          | คอมโพเนนต์ UI ของเทอร์มินัล (ใช้ในโหมด TUI ภายในเครื่องของ OpenClaw)                                             |

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

รันไทม์การกระทำกับข้อความเฉพาะช่องทางตอนนี้อยู่ในไดเรกทอรีส่วนขยายที่ Plugin เป็นเจ้าของ
แทนที่จะอยู่ใต้ `src/agents/tools` เช่น:

- ไฟล์รันไทม์การกระทำของ Plugin Discord
- ไฟล์รันไทม์การกระทำของ Plugin Slack
- ไฟล์รันไทม์การกระทำของ Plugin Telegram
- ไฟล์รันไทม์การกระทำของ Plugin WhatsApp

## โฟลว์การผสานหลัก

### 1. การเรียกใช้เอเจนต์แบบฝังตัว

จุดเข้าหลักคือ `runEmbeddedPiAgent()` ใน `pi-embedded-runner/run.ts`:

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

### 3. การสมัครรับเหตุการณ์

`subscribeEmbeddedPiSession()` สมัครรับเหตุการณ์จาก `AgentSession` ของ pi:

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

หลังจากตั้งค่าเสร็จแล้ว จะส่ง prompt ให้เซสชัน:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK จะจัดการลูปเอเจนต์ทั้งหมด: ส่งไปยัง LLM, เรียกใช้การเรียกเครื่องมือ, และสตรีมคำตอบ

การฉีดรูปภาพเป็นแบบเฉพาะ prompt: OpenClaw โหลดการอ้างอิงรูปภาพจาก prompt ปัจจุบันและ
ส่งผ่าน `images` สำหรับรอบนั้นเท่านั้น โดยจะไม่สแกนรอบประวัติที่เก่ากว่าอีกครั้ง
เพื่อฉีด payload รูปภาพซ้ำ

## สถาปัตยกรรมเครื่องมือ

### ไปป์ไลน์เครื่องมือ

1. **เครื่องมือพื้นฐาน**: `codingTools` ของ pi (read, bash, edit, write)
2. **การแทนที่แบบกำหนดเอง**: OpenClaw แทนที่ bash ด้วย `exec`/`process`, ปรับแต่ง read/edit/write สำหรับ sandbox
3. **เครื่องมือ OpenClaw**: การส่งข้อความ, เบราว์เซอร์, canvas, เซสชัน, Cron, Gateway และอื่นๆ
4. **เครื่องมือช่องทาง**: เครื่องมือการกระทำเฉพาะ Discord/Telegram/Slack/WhatsApp
5. **การกรองตามนโยบาย**: เครื่องมือถูกกรองตามโปรไฟล์, ผู้ให้บริการ, เอเจนต์, กลุ่ม, นโยบาย sandbox
6. **การทำให้สคีมาเป็นมาตรฐาน**: สคีมาถูกทำความสะอาดสำหรับข้อเฉพาะของ Gemini/OpenAI
7. **การห่อด้วย AbortSignal**: เครื่องมือถูกห่อให้เคารพสัญญาณยกเลิก

### อะแดปเตอร์นิยามเครื่องมือ

`AgentTool` ของ pi-agent-core มี signature ของ `execute` ที่ต่างจาก `ToolDefinition` ของ pi-coding-agent อะแดปเตอร์ใน `pi-tool-definition-adapter.ts` เชื่อมสิ่งนี้:

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

สิ่งนี้ช่วยให้การกรองนโยบาย การผสานรวม sandbox และชุดเครื่องมือเพิ่มเติมของ OpenClaw ยังคงสอดคล้องกันระหว่างผู้ให้บริการ

## การสร้าง system prompt

system prompt ถูกสร้างใน `buildAgentSystemPrompt()` (`system-prompt.ts`) โดยประกอบ prompt แบบเต็มพร้อมส่วนต่างๆ รวมถึง Tooling, Tool Call Style, Safety guardrails, ข้อมูลอ้างอิง OpenClaw CLI, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata รวมถึง Memory และ Reactions เมื่อเปิดใช้งาน และไฟล์บริบทเสริมกับเนื้อหา system prompt เพิ่มเติม ส่วนต่างๆ จะถูกตัดให้สั้นลงสำหรับโหมด prompt ขั้นต่ำที่ subagents ใช้

prompt จะถูกนำไปใช้หลังจากสร้างเซสชันผ่าน `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## การจัดการเซสชัน

### ไฟล์เซสชัน

เซสชันเป็นไฟล์ JSONL ที่มีโครงสร้างแบบต้นไม้ (เชื่อมโยงด้วย id/parentId) `SessionManager` ของ Pi จัดการการคงอยู่ของข้อมูล:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw ครอบสิ่งนี้ด้วย `guardSessionManager()` เพื่อความปลอดภัยของผลลัพธ์เครื่องมือ

### การแคชเซสชัน

`session-manager-cache.ts` แคชอินสแตนซ์ SessionManager เพื่อหลีกเลี่ยงการแยกวิเคราะห์ไฟล์ซ้ำ:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### การจำกัดประวัติ

`limitHistoryTurns()` ตัดประวัติการสนทนาตามประเภทช่องทาง (DM เทียบกับกลุ่ม)

### Compaction

Auto-compaction จะทำงานเมื่อบริบทล้น ลายเซ็นการล้นที่พบบ่อยประกอบด้วย `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` และ `ollama error: context length exceeded` `compactEmbeddedPiSessionDirect()` จัดการ Compaction แบบแมนนวล:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## การยืนยันตัวตนและการ resolve โมเดล

### โปรไฟล์ auth

OpenClaw ดูแลที่เก็บโปรไฟล์ auth ที่มี API key หลายรายการต่อผู้ให้บริการ:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

โปรไฟล์จะหมุนเวียนเมื่อเกิดความล้มเหลว พร้อมการติดตาม cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### การ resolve โมเดล

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

`FailoverError` กระตุ้น fallback ของโมเดลเมื่อกำหนดค่าไว้:

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

### มาตรการป้องกัน Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` เพิ่ม guardrails ให้ Compaction รวมถึงการจัดสรรงบประมาณ token แบบปรับตัวได้ พร้อมสรุปความล้มเหลวของเครื่องมือและการดำเนินการกับไฟล์:

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

### การลบแท็ก Thinking/Final

เอาต์พุตสตรีมจะถูกประมวลผลเพื่อลบ `<think>`/`<thinking>` block และดึงเนื้อหา `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### คำสั่งตอบกลับ

คำสั่งตอบกลับอย่าง `[[media:url]]`, `[[voice]]`, `[[reply:id]]` จะถูกแยกวิเคราะห์และดึงออกมา:

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

### Thinking level fallback

หาก thinking level ไม่รองรับ ระบบจะ fallback:

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

เมื่อเปิดใช้งานโหมด sandbox เครื่องมือและพาธจะถูกจำกัด:

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

- การขัดล้าง magic string สำหรับการปฏิเสธ
- การตรวจสอบ turn สำหรับบทบาทที่ต่อเนื่องกัน
- การตรวจสอบพารามิเตอร์เครื่องมือ Pi ฝั่ง upstream แบบเข้มงวด

### Google/Gemini

- การทำให้ schema เครื่องมือที่ Plugin เป็นเจ้าของสะอาดขึ้น

### OpenAI

- เครื่องมือ `apply_patch` สำหรับโมเดล Codex
- การจัดการการลดระดับ thinking level

## การผสานรวม TUI

OpenClaw ยังมีโหมด TUI ภายในเครื่องที่ใช้คอมโพเนนต์ pi-tui โดยตรง:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

สิ่งนี้มอบประสบการณ์เทอร์มินัลแบบโต้ตอบคล้ายกับโหมด native ของ pi

## ความแตกต่างสำคัญจาก Pi CLI

| แง่มุม | Pi CLI | OpenClaw Embedded |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| การเรียกใช้ | คำสั่ง `pi` / RPC | SDK ผ่าน `createAgentSession()` |
| เครื่องมือ | เครื่องมือเขียนโค้ดเริ่มต้น | ชุดเครื่องมือ OpenClaw แบบกำหนดเอง |
| system prompt | AGENTS.md + prompts | ไดนามิกตามช่องทาง/บริบท |
| พื้นที่จัดเก็บเซสชัน | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (หรือ `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth | ข้อมูลประจำตัวรายการเดียว | หลายโปรไฟล์พร้อมการหมุนเวียน |
| ส่วนขยาย | โหลดจากดิสก์ | แบบโปรแกรม + พาธบนดิสก์ |
| การจัดการเหตุการณ์ | การเรนเดอร์ TUI | ตาม callback (onBlockReply ฯลฯ) |

## ข้อพิจารณาในอนาคต

พื้นที่ที่อาจปรับปรุงใหม่:

1. **การจัดแนวลายเซ็นเครื่องมือ**: ปัจจุบันกำลังปรับระหว่างลายเซ็น pi-agent-core และ pi-coding-agent
2. **การครอบ session manager**: `guardSessionManager` เพิ่มความปลอดภัย แต่เพิ่มความซับซ้อน
3. **การโหลดส่วนขยาย**: อาจใช้ `ResourceLoader` ของ pi ได้โดยตรงมากขึ้น
4. **ความซับซ้อนของ streaming handler**: `subscribeEmbeddedPiSession` มีขนาดใหญ่ขึ้นมาก
5. **ลักษณะเฉพาะของผู้ให้บริการ**: มี codepath จำนวนมากที่เฉพาะผู้ให้บริการ ซึ่ง pi อาจสามารถจัดการได้

## การทดสอบ

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (เปิดใช้ `OPENCLAW_LIVE_TEST=1`)

สำหรับคำสั่งรันปัจจุบัน โปรดดู [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)

## ที่เกี่ยวข้อง

- [เวิร์กโฟลว์การพัฒนา Pi](/th/pi-dev)
- [ภาพรวมการติดตั้ง](/th/install)
