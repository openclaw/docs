---
read_when:
    - 了解 OpenClaw 中的 Pi SDK 整合設計
    - 修改 Pi 的代理程式工作階段生命週期、工具或供應商串接
summary: OpenClaw 的內嵌 Pi 代理整合與工作階段生命週期架構
title: Pi 整合架構
x-i18n:
    generated_at: "2026-05-10T19:40:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw 整合了 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 及其同層套件（`pi-ai`、`pi-agent-core`、`pi-tui`），以支援其 AI agent 功能。

## 概觀

OpenClaw 使用 Pi SDK 將 AI coding agent 嵌入其訊息 Gateway 架構。OpenClaw 不會將 Pi 作為子程序啟動，也不使用 RPC 模式，而是透過 `createAgentSession()` 直接匯入並實例化 Pi 的 `AgentSession`。這種嵌入式方法提供：

- 對 session 生命週期與事件處理的完整控制
- 自訂工具注入（訊息、sandbox、channel 特定動作）
- 依 channel/context 自訂 system prompt
- 支援分支/Compaction 的 session 持久化
- 具備故障轉移的多帳號 auth profile 輪替
- 與 provider 無關的 model 切換

## 套件相依性

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| 套件              | 用途                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | 核心 LLM 抽象：`Model`、`streamSimple`、message types、provider APIs                                    |
| `pi-agent-core`   | Agent loop、工具執行、`AgentMessage` types                                                             |
| `pi-coding-agent` | 高階 SDK：`createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、內建工具              |
| `pi-tui`          | 終端 UI 元件（用於 OpenClaw 的本機 TUI 模式）                                                          |

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

Channel 特定的訊息動作 runtime 現在位於 Plugin 擁有的 plugin
目錄中，而不是 `src/agents/tools` 底下，例如：

- Discord Plugin 動作 runtime 檔案
- Slack Plugin 動作 runtime 檔案
- Telegram Plugin 動作 runtime 檔案
- WhatsApp Plugin 動作 runtime 檔案

## 核心整合流程

### 1. 執行嵌入式 Agent

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

### 2. 建立 Session

在 `runEmbeddedAttempt()`（由 `runEmbeddedPiAgent()` 呼叫）內部，會使用 Pi SDK：

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

### 3. 事件訂閱

`subscribeEmbeddedPiSession()` 會訂閱 Pi 的 `AgentSession` 事件：

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

設定完成後，會對 session 發出 prompt：

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK 會處理完整的 agent loop：傳送至 LLM、執行工具呼叫、串流回應。

圖片注入是 prompt-local：OpenClaw 會從目前 prompt 載入 image refs，並
僅透過 `images` 傳遞給該 turn。它不會重新掃描較舊的 history turns
來重新注入 image payloads。

## 工具架構

### 工具管線

1. **基礎工具**：Pi 的 `codingTools`（read、bash、edit、write）
2. **自訂替換**：OpenClaw 以 `exec`/`process` 取代 bash，並針對 sandbox 自訂 read/edit/write
3. **OpenClaw 工具**：messaging、browser、canvas、sessions、cron、gateway 等
4. **Channel 工具**：Discord/Telegram/Slack/WhatsApp 特定的 action tools
5. **Policy 過濾**：依 profile、provider、agent、group、sandbox policies 過濾工具
6. **Schema 正規化**：針對 Gemini/OpenAI 的特殊情況清理 schemas
7. **AbortSignal 包裝**：包裝工具以遵循 abort signals

### 工具定義轉接器

`pi-agent-core` 的 `AgentTool` 與 `pi-coding-agent` 的 `ToolDefinition` 具有不同的 `execute` 簽章。`pi-tool-definition-adapter.ts` 中的轉接器會銜接兩者：

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

### 工具分割策略

`splitSdkTools()` 會透過 `customTools` 傳遞所有工具：

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

這可確保 OpenClaw 的政策篩選、沙箱整合與擴充工具集在各提供者之間保持一致。

## 系統提示建構

系統提示是在 `buildAgentSystemPrompt()` (`system-prompt.ts`) 中建構。它會組合完整提示，包含 Tooling、Tool Call Style、Safety guardrails、OpenClaw Control、Skills、Docs、Workspace、Sandbox、Messaging、Assistant Output Directives、Voice、Silent Replies、Heartbeats、Runtime metadata 等區段，並在啟用時加入 Memory 與 Reactions，以及選用的脈絡檔案和額外系統提示內容。子代理程式使用的最小提示模式會修剪這些區段。

提示會在工作階段建立後透過 `applySystemPromptOverrideToSession()` 套用：

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## 工作階段管理

### 工作階段檔案

工作階段是具有樹狀結構（id/parentId 連結）的 JSONL 檔案。Pi 的 `SessionManager` 處理持久化：

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw 以 `guardSessionManager()` 包裝這項功能，以確保工具結果安全。

### 工作階段快取

`session-manager-cache.ts` 會快取 SessionManager 執行個體，避免重複解析檔案：

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 歷史記錄限制

`limitHistoryTurns()` 會根據頻道類型（DM 與群組）修剪對話歷史記錄。

### Compaction

自動 Compaction 會在脈絡溢位時觸發。常見的溢位特徵包含 `request_too_large`、`context length exceeded`、`input exceeds the
maximum number of tokens`、`input token count exceeds the maximum number of
input tokens`、`input is too long for the model`，以及 `ollama error: context
length exceeded`。`compactEmbeddedPiSessionDirect()` 會處理手動 Compaction：

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 驗證與模型解析

### 驗證設定檔

OpenClaw 維護一個驗證設定檔儲存區，每個提供者可有多個 API 金鑰：

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

設定檔會在失敗時輪替，並追蹤冷卻時間：

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

設定後，`FailoverError` 會觸發模型後援：

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

## Pi 擴充

OpenClaw 會載入自訂 pi 擴充以提供特殊行為：

### Compaction 防護

`src/agents/pi-hooks/compaction-safeguard.ts` 為 Compaction 加入防護措施，包含自適應 token 預算，以及工具失敗與檔案操作摘要：

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### 脈絡修剪

`src/agents/pi-hooks/context-pruning.ts` 實作基於快取 TTL 的脈絡修剪：

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

### 區塊切分

`EmbeddedBlockChunker` 會管理將串流文字切分為離散的回覆區塊：

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final 標籤移除

串流輸出會經過處理，以移除 `<think>`/`<thinking>` 區塊並擷取 `<final>` 內容：

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 回覆指令

系統會解析並擷取如 `[[media:url]]`、`[[voice]]`、`[[reply:id]]` 等回覆指令：

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 錯誤處理

### 錯誤分類

`pi-embedded-helpers.ts` 會分類錯誤，以便適當處理：

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### 思考層級後援

如果思考層級不受支援，系統會退回後援層級：

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

## 沙箱整合

啟用沙箱模式時，工具與路徑會受到限制：

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

## 提供者專屬處理

### Anthropic

- 拒絕魔術字串清理
- 連續角色的回合驗證
- 嚴格的上游 Pi 工具參數驗證

### Google/Gemini

- Plugin 擁有的工具 schema 清理

### OpenAI

- Codex 模型的 `apply_patch` 工具
- 思考層級降級處理

## TUI 整合

OpenClaw 也有本機 TUI 模式，會直接使用 pi-tui 元件：

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

這會提供類似 pi 原生模式的互動式終端體驗。

## 與 Pi CLI 的主要差異

| 面向            | Pi CLI                  | OpenClaw 嵌入式                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| 呼叫方式        | `pi` command / RPC      | 透過 `createAgentSession()` 的 SDK                                                                 |
| 工具            | 預設編碼工具            | 自訂 OpenClaw 工具套件                                                                     |
| 系統提示        | AGENTS.md + prompts     | 依頻道/脈絡動態產生                                                                    |
| 工作階段儲存    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（或 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 驗證            | 單一憑證                | 多設定檔並支援輪替                                                                    |
| 擴充            | 從磁碟載入              | 程式化 + 磁碟路徑                                                                      |
| 事件處理        | TUI 轉譯                | 基於回呼（onBlockReply 等）                                                            |

## 未來考量

可能重工的領域：

1. **工具簽章對齊**：目前在 pi-agent-core 與 pi-coding-agent 簽章之間轉接
2. **工作階段管理器包裝**：`guardSessionManager` 增加安全性，但也提高複雜度
3. **擴充載入**：可更直接使用 pi 的 `ResourceLoader`
4. **串流處理器複雜度**：`subscribeEmbeddedPiSession` 已變得龐大
5. **提供者特殊行為**：許多提供者專屬程式碼路徑，未來可能由 pi 處理

## 測試

Pi 整合涵蓋下列測試套件：

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

即時/選擇性啟用：

- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（啟用 `OPENCLAW_LIVE_TEST=1`）

如需目前的執行命令，請參閱 [Pi 開發工作流程](/zh-TW/pi-dev)。

## 相關

- [Pi 開發工作流程](/zh-TW/pi-dev)
- [安裝概覽](/zh-TW/install)
