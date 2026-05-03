---
read_when:
    - 你正在建立需要 before_tool_call、before_agent_reply、訊息 hook 或生命週期 hook 的 Plugin
    - 你需要封鎖、重寫或要求核准來自 Plugin 的工具呼叫
    - 你正在內部鉤子和 Plugin 鉤子之間做決定
summary: Plugin 鉤子：攔截代理程式、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 鉤子
x-i18n:
    generated_at: "2026-05-03T21:38:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook 是 OpenClaw Plugin 的進程內擴充點。當 Plugin 需要檢查或變更代理程式執行、工具呼叫、訊息流程、工作階段生命週期、子代理程式路由、安裝，或 Gateway 啟動時使用。

如果你需要的是由操作員安裝的小型 `HOOK.md` 指令碼，用於命令和 Gateway 事件，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，請改用[內部 hook](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 進入點使用 `api.on(...)` 註冊具型別的 Plugin hook：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook 處理常式會依 `priority` 由高到低循序執行。相同優先順序的 hook 會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 處理常式排序（較高者先執行）。
- `timeoutMs` — 可選的每個 hook 預算。設定後，hook 執行器會在預算用盡後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回想工作消耗呼叫端已設定的模型逾時。省略此值時，會使用 hook 執行器通用套用的預設觀察/決策逾時。

操作員也可以不修補 Plugin 程式碼而設定 hook 預算：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而後者會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 中設定的值。每個已設定的值都必須是正整數，且不得大於 600000 毫秒。已知較慢的 hook 應優先使用每個 hook 的覆寫，避免某個 Plugin 在所有地方都取得較長預算。

每個 hook 都會收到 `event.context.pluginConfig`，也就是註冊該處理常式之 Plugin 的已解析設定。需要目前 Plugin 選項的 hook 決策可使用它；OpenClaw 會針對每個處理常式注入此值，而不會改變其他 Plugin 看到的共享事件物件。

## Hook 目錄

Hook 依其延伸的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其餘皆僅供觀察。

**代理程式回合**

- `before_model_resolve` — 在載入工作階段訊息前覆寫供應商或模型
- `agent_turn_prepare` — 在 prompt hook 之前消耗已排入佇列的 Plugin 回合注入，並加入同回合內容
- `before_prompt_build` — 在模型呼叫前加入動態內容或系統提示文字
- `before_agent_start` — 僅供相容性的合併階段；請優先使用上方兩個 hook
- **`before_agent_reply`** — 以合成回覆或靜默短路模型回合
- **`before_agent_finalize`** — 檢查自然最終答案並要求再執行一次模型傳遞
- `agent_end` — 觀察最終訊息、成功狀態和執行期間
- `heartbeat_prompt_contribution` — 為背景監控和生命週期 Plugin 加入僅限 Heartbeat 的內容

**對話觀察**

- `model_call_started` / `model_call_ended` — 觀察已清理的供應商/模型呼叫中繼資料、時間、結果，以及有界請求 ID 雜湊，不包含 prompt 或回應內容
- `llm_input` — 觀察供應商輸入（系統提示、prompt、歷史記錄）
- `llm_output` — 觀察供應商輸出

**工具**

- **`before_tool_call`** — 重寫工具參數、封鎖執行，或要求核准
- `after_tool_call` — 觀察工具結果、錯誤和期間
- **`tool_result_persist`** — 重寫由工具結果產生的助理訊息
- **`before_message_write`** — 檢查或封鎖進行中的訊息寫入（少見）

**訊息與傳遞**

- **`inbound_claim`** — 在代理程式路由前宣告處理傳入訊息（合成回覆）
- `message_received` — 觀察傳入內容、寄件者、執行緒和中繼資料
- **`message_sending`** — 重寫傳出內容或取消傳遞
- `message_sent` — 觀察傳出傳遞成功或失敗
- **`before_dispatch`** — 在通道交接前檢查或重寫傳出分派
- **`reply_dispatch`** — 參與最終回覆分派管線

**工作階段與 Compaction**

- `session_start` / `session_end` — 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` — 觀察或註解 Compaction 週期
- `before_reset` — 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理程式**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 協調子代理程式路由與完成傳遞

**生命週期**

- `gateway_start` / `gateway_stop` — 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` — 觀察 Gateway 擁有的 Cron 生命週期變更（已新增、已更新、已移除、已開始、已完成、已排程）
- **`before_install`** — 檢查技能或 Plugin 安裝掃描，並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 可選的 `event.runId`
- 可選的 `event.toolCallId`
- 內容欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用的 `ctx.trace`

它可以傳回：

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

規則：

- `block: true` 是終止性決策，會略過較低優先順序的處理常式。
- `block: false` 會被視為沒有決策。
- `params` 會重寫用於執行的工具參數。
- `requireApproval` 會暫停代理程式執行，並透過 Plugin 核准向使用者詢問。`/approve` 命令可以同時核准 exec 和 Plugin 核准。
- 較高優先順序的 hook 要求核准後，較低優先順序的 `block: true` 仍可封鎖。
- `onResolution` 會收到已解析的核准決策 — `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的隨附 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` hook 和外部 Plugin 決策之前執行。僅應將它們用於主機信任的閘門，例如工作區政策、預算執行或保留工作流程安全。外部 Plugin 應使用一般的 `before_tool_call` hook。

### 工具結果持久化

工具結果可以包含結構化的 `details`，用於 UI 呈現、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而非 prompt 內容：

- OpenClaw 會在供應商重播和 Compaction 輸入前移除 `toolResult.details`，使中繼資料不會成為模型內容。
- 持久化的工作階段項目只保留有界的 `details`。過大的 details 會以精簡摘要取代，並設為 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限前執行。Hook 仍應保持傳回的 `details` 小巧，並避免只把 prompt 相關文字放在 `details` 中；模型可見的工具輸出應放在 `content`。

## Prompt 和模型 hook

新 Plugin 請使用階段專用的 hook：

- `before_model_resolve`：只接收目前 prompt 和附件中繼資料。傳回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前 prompt、已準備的工作階段訊息，以及為此工作階段耗盡的任何一次性佇列注入。傳回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前 prompt 和工作階段訊息。傳回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 回合執行，並傳回 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不變更使用者發起回合的背景監控器。

`before_agent_start` 保留供相容性使用。請優先使用上方明確的 hook，讓你的 Plugin 不依賴舊版合併階段。

當 OpenClaw 可以識別作用中執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 工作 ID），讓 Plugin hook 可將指標、副作用或狀態限定於特定排程工作。

對於源自通道的執行，`ctx.messageProvider` 是供應商介面，例如 `discord` 或 `telegram`，而當 OpenClaw 能從工作階段金鑰或傳遞中繼資料推導時，`ctx.channelId` 是對話目標識別碼。

`agent_end` 是觀察 hook，會在回合後以 fire-and-forget 方式執行。Hook 執行器會套用 30 秒逾時，避免卡住的 Plugin 或嵌入端點讓 hook Promise 永久未決。逾時會被記錄，OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則不會取消 Plugin 擁有的網路工作。

使用 `model_call_started` 和 `model_call_ended` 取得不應接收原始 prompt、歷史記錄、回應、標頭、請求主體或供應商請求 ID 的供應商呼叫遙測。這些 hook 包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、可選的 `api`/`transport`、終端 `durationMs`/`outcome`，以及當 OpenClaw 能推導有界供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在測試控制架構即將接受自然的最終助理答案時執行。它不是 `/stop` 取消路徑，且不會在使用者中止回合時執行。傳回 `{ action: "revise", reason }` 可要求測試控制架構在最終化前再執行一次模型傳遞，傳回 `{ action:
"finalize", reason? }` 可強制最終化，或省略結果以繼續。Codex 原生 `Stop` hook 會轉送為此 hook 中的 OpenClaw `before_agent_finalize` 決策。

需要 `llm_input`、`llm_output`、`before_agent_finalize` 或 `agent_end` 的非隨附 Plugin 必須設定：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

可依每個 Plugin 使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會變更 prompt 的 hook 和持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 相容的工作階段狀態，並透過 Gateway `sessions.pluginPatch` 方法更新它。工作階段資料列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 和其他用戶端無需了解 Plugin 內部即可呈現 Plugin 擁有的狀態。

當 Plugin 需要持久性上下文準確地只到達下一個模型回合一次時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示掛鉤之前清空佇列中的注入、丟棄過期的注入，並依每個 Plugin 使用 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見但不應成為永久系統提示文字的命令延續的正確切入點。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。主機會在 reset/delete/disable 時移除所屬 Plugin 的持久性工作階段擴充狀態與待處理的下一回合注入；restart 會保留持久性工作階段狀態，同時清理回呼可讓 Plugin 釋放排程器工作、執行內容，以及舊執行階段世代的其他頻外資源。

## 訊息掛鉤

將訊息掛鉤用於頻道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使頻道酬載沒有可見文字/標題，`content` 也可能包含隱藏的口述文字稿。重寫該 `content` 只會更新掛鉤可見的文字稿；它不會被呈現為媒體標題。

訊息掛鉤內容會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在讀取舊版中繼資料之前，請優先使用這些一級欄位。

在使用頻道特定中繼資料之前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止性決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞至較低優先順序的掛鉤，除非後續掛鉤取消傳遞。

## 安裝掛鉤

`before_install` 會在內建掃描 Skills 與 Plugin 安裝之後執行。回傳額外發現，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止性決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

將 `gateway_start` 用於需要 Gateway 擁有狀態的 Plugin 服務。內容會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，以供 Cron 檢查與更新。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` 掛鉤來處理 Plugin 擁有的執行階段服務。

`cron_changed` 會針對 Gateway 擁有的 Cron 生命週期事件觸發，並附帶涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因的具型別事件酬載。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`）加上 `PluginHookGatewayCronDeliveryStatus`，其值為 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

## 即將棄用

少數與掛鉤相鄰的介面已棄用但仍受支援。請在下一個主要版本之前遷移：

- `inbound_claim` 和 `message_received` 處理常式中的**純文字頻道信封**。請讀取 `BodyForAgent` 和結構化的使用者內容區塊，而不是剖析扁平的信封文字。請參閱[純文字頻道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍為相容性保留。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式的 `string`。

完整清單，包括記憶體能力註冊、供應商思考設定檔、外部驗證供應商、供應商探索型別、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱 [Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) — 作用中的棄用項目與移除時間表
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部掛鉤](/zh-TW/automation/hooks)
- [Plugin 架構內部原理](/zh-TW/plugins/architecture-internals)
