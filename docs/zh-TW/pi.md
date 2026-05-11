---
read_when:
    - 了解 OpenClaw 中 Pi SDK 的整合設計
    - 修改 Pi 的代理工作階段生命週期、工具系統或提供者串接
summary: OpenClaw 內嵌 Pi 代理程式整合與工作階段生命週期的架構
title: Pi 整合架構
x-i18n:
    generated_at: "2026-05-11T20:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw 整合了 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 及其同系列套件（`pi-ai`、`pi-agent-core`、`pi-tui`），以提供其 AI 代理能力。

## 概觀

OpenClaw 使用 pi SDK，將 AI 編碼代理嵌入其訊息 Gateway 架構中。OpenClaw 不會將 pi 作為子程序啟動或使用 RPC 模式，而是透過 `createAgentSession()` 直接匯入並實例化 pi 的 `AgentSession`。這種嵌入式做法提供：

- 完整控制工作階段生命週期與事件處理
- 自訂工具注入（訊息、沙箱、通道特定動作）
- 依通道/情境自訂系統提示
- 支援分支/Compaction 的工作階段持久化
- 具備容錯移轉的多帳號驗證設定檔輪替
- 不受供應商限制的模型切換

## 套件相依性

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| 套件              | 用途                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | 核心 LLM 抽象：`Model`、`streamSimple`、訊息型別、供應商 API                                           |
| `pi-agent-core`   | 代理迴圈、工具執行、`AgentMessage` 型別                                                               |
| `pi-coding-agent` | 高階 SDK：`createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、內建工具             |
| `pi-tui`          | 終端機 UI 元件（用於 OpenClaw 的本機 TUI 模式）                                                       |

## 檔案結構

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

通道特定訊息動作執行階段現在位於 Plugin 擁有的 extension
目錄中，而不是 `src/agents/tools` 底下，例如：

- Discord Plugin 動作執行階段檔案
- Slack Plugin 動作執行階段檔案
- Telegram Plugin 動作執行階段檔案
- WhatsApp Plugin 動作執行階段檔案

## 核心整合流程

### 1. 執行嵌入式代理

主要進入點是 `pi-embedded-runner/run.ts` 中的 `runEmbeddedPiAgent()`：

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

### 2. 工作階段建立

在 `runEmbeddedAttempt()`（由 `runEmbeddedPiAgent()` 呼叫）內部，會使用 pi SDK：

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

### 3. 事件訂閱

`subscribeEmbeddedPiSession()` 會訂閱 pi 的 `AgentSession` 事件：

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

處理的事件包含：

- `message_start` / `message_end` / `message_update`（串流文字/思考）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. 提示

設定完成後，會對工作階段送出提示：

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK 會處理完整的代理迴圈：傳送給 LLM、執行工具呼叫、串流回應。

圖片注入僅限目前提示：OpenClaw 會從目前提示載入圖片參照，並
只針對該輪透過 `images` 傳遞它們。它不會重新掃描較舊的歷史輪次
來重新注入圖片承載資料。

## 工具架構

### 工具管線

1. **基礎工具**：pi 的 `codingTools`（read、bash、edit、write）
2. **自訂替換項**：OpenClaw 以 `exec`/`process` 替換 bash，並為沙箱自訂 read/edit/write
3. **OpenClaw 工具**：訊息、瀏覽器、畫布、工作階段、Cron、Gateway 等
4. **通道工具**：Discord/Telegram/Slack/WhatsApp 特定動作工具
5. **政策篩選**：依設定檔、供應商、代理、群組、沙箱政策篩選工具
6. **結構描述正規化**：針對 Gemini/OpenAI 的特殊行為清理結構描述
7. **AbortSignal 包裝**：包裝工具以遵守中止訊號

### 工具定義轉接器

pi-agent-core 的 `AgentTool` 與 pi-coding-agent 的 `ToolDefinition` 使用不同的 `execute` 簽章。`pi-tool-definition-adapter.ts` 中的轉接器會橋接兩者：

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

### 工具拆分策略

`splitSdkTools()` 會透過 `customTools` 傳遞所有工具：

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

這可確保 OpenClaw 的政策篩選、沙盒整合，以及延伸工具集在各 provider 之間保持一致。

## 系統提示建構

系統提示是在 `buildAgentSystemPrompt()`（`system-prompt.ts`）中建構的。它會組合完整提示，包含 Tooling、Tool Call Style、Safety guardrails、OpenClaw Control、Skills、Docs、Workspace、Sandbox、Messaging、Assistant Output Directives、Voice、Silent Replies、Heartbeats、Runtime metadata 等區段，並在啟用時加入 Memory 與 Reactions，以及可選的內容檔案與額外系統提示內容。子代理使用的最小提示模式會裁剪這些區段。

提示會在 session 建立後透過 `applySystemPromptOverrideToSession()` 套用：

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Session 管理

### Session 檔案

Session 是具有樹狀結構（id/parentId 連結）的 JSONL 檔案。Pi 的 `SessionManager` 會處理持久化：

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw 會用 `guardSessionManager()` 包裝它，以確保工具結果安全。

### Session 快取

`session-manager-cache.ts` 會快取 SessionManager 實例，以避免重複解析檔案：

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 歷史限制

`limitHistoryTurns()` 會依通道類型（DM 與群組）裁剪對話歷史。

### Compaction

自動 Compaction 會在 context 溢位時觸發。常見的溢位特徵包含 `request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`，以及 `ollama error: context length exceeded`。`compactEmbeddedPiSessionDirect()` 會處理手動 Compaction：

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 驗證與模型解析

### 驗證 profile

OpenClaw 維護一個驗證 profile 儲存區，每個 provider 可有多個 API key：

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile 會在失敗時輪替，並追蹤冷卻時間：

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### 模型解析

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

### 容錯移轉

設定後，`FailoverError` 會觸發模型 fallback：

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

## Pi 擴充功能

OpenClaw 會載入自訂 pi 擴充功能以支援專門行為：

### Compaction 防護

`src/agents/pi-hooks/compaction-safeguard.ts` 會為 Compaction 加上防護機制，包含自適應 token 預算，以及工具失敗與檔案操作摘要：

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context 修剪

`src/agents/pi-hooks/context-pruning.ts` 實作以快取 TTL 為基礎的 context 修剪：

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

## 串流與區塊回覆

### 區塊分段

`EmbeddedBlockChunker` 會管理串流文字，將其切分成離散的回覆區塊：

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### 思考/最終標籤剝除

串流輸出會被處理，以移除 `<think>`/`<thinking>` 區塊並擷取 `<final>` 內容：

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 回覆指令

像 `[[media:url]]`、`[[voice]]`、`[[reply:id]]` 這類回覆指令會被解析並擷取：

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 錯誤處理

### 錯誤分類

`pi-embedded-helpers.ts` 會分類錯誤，以便採用適當處理：

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### 思考等級 fallback

如果不支援某個思考等級，會 fallback：

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

## 沙盒整合

啟用沙盒模式時，工具與路徑會受到限制：

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

## Provider 專屬處理

### Anthropic

- 拒絕魔術字串清理
- 連續角色的 turn 驗證
- 嚴格的上游 Pi 工具參數驗證

### Google/Gemini

- Plugin 擁有的工具 schema 淨化

### OpenAI

- Codex 模型的 `apply_patch` 工具
- 思考等級降級處理

## TUI 整合

OpenClaw 也有本機 TUI 模式，會直接使用 pi-tui 元件：

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

這會提供類似 pi 原生模式的互動式終端體驗。

## 與 Pi CLI 的主要差異

| 面向            | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 呼叫方式        | `pi` command / RPC      | SDK via `createAgentSession()`                                                                 |
| 工具            | 預設編碼工具            | 自訂 OpenClaw 工具套件                                                                         |
| 系統提示        | AGENTS.md + prompts     | 依通道/context 動態產生                                                                        |
| Session 儲存    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (or `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| 驗證            | 單一憑證                | 多 profile 並支援輪替                                                                          |
| 擴充功能        | 從磁碟載入              | 程式化 + 磁碟路徑                                                                              |
| 事件處理        | TUI 轉譯                | 以 callback 為基礎 (onBlockReply, etc.)                                                        |

## 未來考量

可能重工的領域：

1. **工具簽章對齊**：目前在 pi-agent-core 與 pi-coding-agent 簽章之間進行適配
2. **Session manager 包裝**：`guardSessionManager` 增加安全性，但也提高複雜度
3. **擴充功能載入**：可以更直接使用 pi 的 `ResourceLoader`
4. **串流處理器複雜度**：`subscribeEmbeddedPiSession` 已變得龐大
5. **Provider 特殊情況**：許多 provider 專屬 codepath 也許可由 pi 處理

## 測試

Pi 整合涵蓋以下測試套件：

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

Live/選擇性啟用：

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（啟用 `OPENCLAW_LIVE_TEST=1`）

如需目前的執行命令，請參閱 [Pi 開發工作流程](/zh-TW/pi-dev)。

## 相關

- [Pi 開發工作流程](/zh-TW/pi-dev)
- [安裝概覽](/zh-TW/install)
