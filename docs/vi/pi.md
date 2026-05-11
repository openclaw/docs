---
read_when:
    - Tìm hiểu thiết kế tích hợp Pi SDK trong OpenClaw
    - Sửa đổi vòng đời phiên tác nhân, công cụ hoặc kết nối nhà cung cấp cho Pi
summary: Kiến trúc tích hợp tác nhân Pi nhúng của OpenClaw và vòng đời phiên
title: Kiến trúc tích hợp Pi
x-i18n:
    generated_at: "2026-05-11T20:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw tích hợp với [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) và các gói anh em của nó (`pi-ai`, `pi-agent-core`, `pi-tui`) để cung cấp năng lực AI agent.

## Tổng quan

OpenClaw dùng pi SDK để nhúng một AI coding agent vào kiến trúc Gateway nhắn tin của nó. Thay vì khởi chạy pi như một tiến trình con hoặc dùng chế độ RPC, OpenClaw trực tiếp import và khởi tạo `AgentSession` của pi qua `createAgentSession()`. Cách tiếp cận nhúng này cung cấp:

- Toàn quyền kiểm soát vòng đời phiên và xử lý sự kiện
- Chèn công cụ tùy chỉnh (nhắn tin, sandbox, hành động theo kênh)
- Tùy chỉnh system prompt theo từng kênh/ngữ cảnh
- Lưu giữ phiên với hỗ trợ phân nhánh/Compaction
- Luân phiên hồ sơ xác thực nhiều tài khoản với failover
- Chuyển đổi mô hình không phụ thuộc nhà cung cấp

## Phụ thuộc gói

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| Gói               | Mục đích                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Các trừu tượng LLM cốt lõi: `Model`, `streamSimple`, kiểu thông điệp, API nhà cung cấp                 |
| `pi-agent-core`   | Vòng lặp agent, thực thi công cụ, kiểu `AgentMessage`                                                  |
| `pi-coding-agent` | SDK cấp cao: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, công cụ tích hợp |
| `pi-tui`          | Thành phần UI terminal (dùng trong chế độ TUI cục bộ của OpenClaw)                                     |

## Cấu trúc tệp

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

Runtime hành động tin nhắn theo kênh hiện nằm trong các thư mục extension
do Plugin sở hữu thay vì dưới `src/agents/tools`, ví dụ:

- các tệp runtime hành động Plugin Discord
- tệp runtime hành động Plugin Slack
- tệp runtime hành động Plugin Telegram
- tệp runtime hành động Plugin WhatsApp

## Luồng tích hợp cốt lõi

### 1. Chạy một agent nhúng

Điểm vào chính là `runEmbeddedPiAgent()` trong `pi-embedded-runner/run.ts`:

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

### 2. Tạo phiên

Bên trong `runEmbeddedAttempt()` (được gọi bởi `runEmbeddedPiAgent()`), pi SDK được dùng:

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

### 3. Đăng ký sự kiện

`subscribeEmbeddedPiSession()` đăng ký theo dõi các sự kiện `AgentSession` của pi:

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

Các sự kiện được xử lý bao gồm:

- `message_start` / `message_end` / `message_update` (văn bản/tư duy dạng streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompt

Sau khi thiết lập, phiên được prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK xử lý toàn bộ vòng lặp agent: gửi tới LLM, thực thi lệnh gọi công cụ, streaming phản hồi.

Việc chèn ảnh là cục bộ theo prompt: OpenClaw tải các tham chiếu ảnh từ prompt hiện tại và
truyền chúng qua `images` chỉ cho lượt đó. Nó không quét lại các lượt lịch sử cũ hơn
để chèn lại payload ảnh.

## Kiến trúc công cụ

### Pipeline công cụ

1. **Công cụ cơ sở**: `codingTools` của pi (read, bash, edit, write)
2. **Thay thế tùy chỉnh**: OpenClaw thay bash bằng `exec`/`process`, tùy chỉnh read/edit/write cho sandbox
3. **Công cụ OpenClaw**: nhắn tin, trình duyệt, canvas, phiên, Cron, Gateway, v.v.
4. **Công cụ kênh**: công cụ hành động riêng cho Discord/Telegram/Slack/WhatsApp
5. **Lọc chính sách**: Công cụ được lọc theo hồ sơ, nhà cung cấp, agent, nhóm, chính sách sandbox
6. **Chuẩn hóa schema**: Schema được làm sạch cho các điểm đặc thù của Gemini/OpenAI
7. **Bọc AbortSignal**: Công cụ được bọc để tuân thủ tín hiệu hủy

### Bộ chuyển đổi định nghĩa công cụ

`AgentTool` của pi-agent-core có chữ ký `execute` khác với `ToolDefinition` của pi-coding-agent. Bộ chuyển đổi trong `pi-tool-definition-adapter.ts` kết nối khác biệt này:

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

### Chiến lược tách công cụ

`splitSdkTools()` truyền tất cả công cụ qua `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Điều này đảm bảo bộ lọc chính sách, tích hợp sandbox và bộ công cụ mở rộng của OpenClaw luôn nhất quán giữa các provider.

## Xây dựng system prompt

System prompt được xây dựng trong `buildAgentSystemPrompt()` (`system-prompt.ts`). Hàm này lắp ráp một prompt đầy đủ với các phần bao gồm Tooling, Tool Call Style, Safety guardrails, OpenClaw Control, Skills, Docs, Workspace, Sandbox, Messaging, Assistant Output Directives, Voice, Silent Replies, Heartbeats, metadata Runtime, cùng với Memory và Reactions khi được bật, cũng như các tệp ngữ cảnh tùy chọn và nội dung system prompt bổ sung. Các phần được cắt gọn cho chế độ prompt tối thiểu dùng bởi subagent.

Prompt được áp dụng sau khi tạo phiên thông qua `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Quản lý phiên

### Tệp phiên

Phiên là các tệp JSONL có cấu trúc cây (liên kết id/parentId). `SessionManager` của Pi xử lý việc lưu bền vững:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bọc lớp này bằng `guardSessionManager()` để đảm bảo an toàn kết quả công cụ.

### Bộ nhớ đệm phiên

`session-manager-cache.ts` lưu đệm các phiên bản SessionManager để tránh phân tích tệp lặp lại:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Giới hạn lịch sử

`limitHistoryTurns()` cắt gọn lịch sử hội thoại dựa trên loại kênh (DM so với nhóm).

### Compaction

Tự động Compaction kích hoạt khi tràn ngữ cảnh. Các dấu hiệu tràn phổ biến
bao gồm `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` và `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` xử lý Compaction
thủ công:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Xác thực và phân giải model

### Hồ sơ xác thực

OpenClaw duy trì kho hồ sơ xác thực với nhiều khóa API cho mỗi provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Hồ sơ được xoay vòng khi lỗi, có theo dõi thời gian chờ:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Phân giải model

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

### Chuyển dự phòng

`FailoverError` kích hoạt fallback model khi được cấu hình:

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

## Phần mở rộng Pi

OpenClaw tải các phần mở rộng pi tùy chỉnh cho hành vi chuyên biệt:

### Biện pháp bảo vệ Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` thêm các rào chắn an toàn cho Compaction, bao gồm phân bổ token thích ứng cùng với tóm tắt lỗi công cụ và thao tác tệp:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Cắt tỉa ngữ cảnh

`src/agents/pi-hooks/context-pruning.ts` triển khai cắt tỉa ngữ cảnh dựa trên cache-TTL:

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

## Streaming và trả lời theo khối

### Chia khối

`EmbeddedBlockChunker` quản lý việc streaming văn bản thành các khối trả lời riêng biệt:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Loại bỏ thẻ Thinking/Final

Đầu ra streaming được xử lý để loại bỏ các khối `<think>`/`<thinking>` và trích xuất nội dung `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Chỉ thị trả lời

Các chỉ thị trả lời như `[[media:url]]`, `[[voice]]`, `[[reply:id]]` được phân tích và trích xuất:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Xử lý lỗi

### Phân loại lỗi

`pi-embedded-helpers.ts` phân loại lỗi để xử lý phù hợp:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback mức suy nghĩ

Nếu một mức suy nghĩ không được hỗ trợ, nó sẽ fallback:

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

## Tích hợp sandbox

Khi chế độ sandbox được bật, công cụ và đường dẫn sẽ bị ràng buộc:

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

## Xử lý theo provider cụ thể

### Anthropic

- Làm sạch chuỗi ma thuật từ chối
- Xác thực lượt cho các vai trò liên tiếp
- Xác thực tham số công cụ Pi upstream nghiêm ngặt

### Google/Gemini

- Làm sạch schema công cụ do Plugin sở hữu

### OpenAI

- Công cụ `apply_patch` cho các model Codex
- Xử lý hạ cấp mức suy nghĩ

## Tích hợp TUI

OpenClaw cũng có chế độ TUI cục bộ sử dụng trực tiếp các thành phần pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

Điều này cung cấp trải nghiệm terminal tương tác tương tự chế độ native của pi.

## Khác biệt chính so với Pi CLI

| Khía cạnh       | Pi CLI                  | OpenClaw nhúng                                                                               |
| --------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Cách gọi        | lệnh `pi` / RPC         | SDK qua `createAgentSession()`                                                               |
| Công cụ         | Công cụ lập trình mặc định | Bộ công cụ OpenClaw tùy chỉnh                                                             |
| System prompt   | AGENTS.md + prompts     | Động theo kênh/ngữ cảnh                                                                       |
| Lưu trữ phiên   | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (hoặc `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Xác thực        | Một thông tin xác thực  | Nhiều hồ sơ với xoay vòng                                                                     |
| Phần mở rộng    | Tải từ đĩa              | Lập trình + đường dẫn trên đĩa                                                                |
| Xử lý sự kiện   | Kết xuất TUI            | Dựa trên callback (onBlockReply, v.v.)                                                        |

## Cân nhắc tương lai

Các khu vực có thể cần làm lại:

1. **Căn chỉnh chữ ký công cụ**: Hiện đang thích ứng giữa chữ ký pi-agent-core và pi-coding-agent
2. **Bọc session manager**: `guardSessionManager` bổ sung an toàn nhưng làm tăng độ phức tạp
3. **Tải phần mở rộng**: Có thể dùng trực tiếp hơn `ResourceLoader` của pi
4. **Độ phức tạp của trình xử lý streaming**: `subscribeEmbeddedPiSession` đã trở nên lớn
5. **Đặc thù provider**: Nhiều đường mã theo provider cụ thể mà pi có thể xử lý trong tương lai

## Kiểm thử

Phạm vi bao phủ tích hợp Pi trải rộng trên các bộ kiểm thử này:

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

Live/tùy chọn tham gia:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (bật `OPENCLAW_LIVE_TEST=1`)

Để xem các lệnh chạy hiện tại, hãy xem [Quy trình phát triển Pi](/vi/pi-dev).

## Liên quan

- [Quy trình phát triển Pi](/vi/pi-dev)
- [Tổng quan cài đặt](/vi/install)
