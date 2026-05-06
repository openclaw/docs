---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的 Plugin
    - 你需要封鎖、重寫或要求核准來自 Plugin 的工具呼叫
    - 你正在決定要使用內部掛鉤還是 Plugin 掛鉤
summary: Plugin hooks：攔截代理、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 掛鉤
x-i18n:
    generated_at: "2026-05-06T02:53:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 鉤子是 OpenClaw Plugin 的同程序內擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝，或 Gateway 啟動時使用它們。

當你想要一個由操作員安裝的小型 `HOOK.md` 指令碼，用於 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令和 Gateway 事件時，請改用[內部鉤子](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 入口使用 `api.on(...)` 註冊具型別的 Plugin 鉤子：

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

鉤子處理常式會依 `priority` 由高到低循序執行。相同優先級的鉤子會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 處理常式排序（較高者先執行）。
- `timeoutMs` - 選用的每鉤子預算。設定後，鉤子執行器會在預算用盡後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回想工作消耗呼叫端設定的模型逾時。省略它會使用鉤子執行器通用套用的預設觀察/決策逾時。

操作員也可以不修補 Plugin 程式碼而設定鉤子預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而後者會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 設定的值。每個設定值都必須是正整數，且不大於 600000 毫秒。對已知緩慢的鉤子，優先使用每鉤子覆寫，避免讓某個 Plugin 在所有地方都取得較長預算。

每個鉤子都會收到 `event.context.pluginConfig`，也就是註冊該處理常式的 Plugin 的已解析設定。將它用於需要目前 Plugin 選項的鉤子決策；OpenClaw 會依處理常式注入它，而不會改變其他 Plugin 所見的共享事件物件。

## 鉤子目錄

鉤子依其擴充的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；所有其他項目僅供觀察。

**代理回合**

- `before_model_resolve` - 在工作階段訊息載入前覆寫供應商或模型
- `agent_turn_prepare` - 在提示鉤子前，消耗已排入佇列的 Plugin 回合注入，並加入同回合情境
- `before_prompt_build` - 在模型呼叫前加入動態情境或系統提示文字
- `before_agent_start` - 僅限相容性的合併階段；請優先使用上述兩個鉤子
- **`before_agent_reply`** - 以合成回覆或靜默短路模型回合
- **`before_agent_finalize`** - 檢查自然的最終答案，並要求再進行一次模型傳遞
- `agent_end` - 觀察最終訊息、成功狀態和執行持續時間
- `heartbeat_prompt_contribution` - 為背景監視器和生命週期 Plugin 加入僅限 Heartbeat 的情境

**對話觀察**

- `model_call_started` / `model_call_ended` - 觀察已清理的供應商/模型呼叫中繼資料、時間、結果，以及有界的請求 ID 雜湊，不包含提示或回應內容
- `llm_input` - 觀察供應商輸入（系統提示、提示、歷史）
- `llm_output` - 觀察供應商輸出

**工具**

- **`before_tool_call`** - 重寫工具參數、封鎖執行，或要求核准
- `after_tool_call` - 觀察工具結果、錯誤和持續時間
- **`tool_result_persist`** - 重寫由工具結果產生的助理訊息
- **`before_message_write`** - 檢查或封鎖進行中的訊息寫入（少見）

**訊息與遞送**

- **`inbound_claim`** - 在代理路由前宣告接收一則傳入訊息（合成回覆）
- `message_received` - 觀察傳入內容、傳送者、執行緒和中繼資料
- **`message_sending`** - 重寫傳出內容或取消遞送
- `message_sent` - 觀察傳出遞送成功或失敗
- **`before_dispatch`** - 在交付給通道前檢查或重寫傳出派送
- **`reply_dispatch`** - 參與最終回覆派送管線

**工作階段與 Compaction**

- `session_start` / `session_end` - 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` - 觀察或註解 Compaction 週期
- `before_reset` - 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 協調子代理路由和完成遞送

**生命週期**

- `gateway_start` / `gateway_stop` - 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` - 觀察 Gateway 擁有的 Cron 生命週期變更（已新增、已更新、已移除、已開始、已完成、已排程）
- **`before_install`** - 檢查 Skills 或 Plugin 安裝掃描，並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 情境欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用的 `ctx.trace`

它可以回傳：

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

- `block: true` 是終止性決策，並會略過較低優先級的處理常式。
- `block: false` 會被視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准詢問使用者。`/approve` 命令可以核准 exec 和 Plugin 核准。
- 在較高優先級鉤子要求核准後，較低優先級的 `block: true` 仍然可以封鎖。
- `onResolution` 會收到已解析的核准決策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任工具政策。這些政策會在一般 `before_tool_call` 鉤子之前、也在外部 Plugin 決策之前執行。僅將它們用於主機受信任的閘門，例如工作區政策、預算執行或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` 鉤子。

### 工具結果持久化

工具結果可以包含結構化的 `details`，用於 UI 呈現、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而不是提示內容：

- OpenClaw 會在供應商重放和 Compaction 輸入前移除 `toolResult.details`，因此中繼資料不會成為模型情境。
- 已持久化的工作階段項目只保留有界的 `details`。過大的 details 會被取代為精簡摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限前執行。鉤子仍應讓回傳的 `details` 保持小型，並避免只將與提示相關的文字放在 `details`；請將模型可見的工具輸出放在 `content`。

## 提示與模型鉤子

新 Plugin 請使用階段專用鉤子：

- `before_model_resolve`：只接收目前提示和附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及此工作階段中已耗盡的任何精確一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示和工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：僅針對 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它用於需要摘要目前狀態、但不改變使用者啟動回合的背景監視器。

`before_agent_start` 仍保留作為相容性用途。請優先使用上方的明確鉤子，讓你的 Plugin 不依賴舊版合併階段。

當 OpenClaw 能識別作用中執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 工作 ID），讓 Plugin 鉤子可以將指標、副作用或狀態限定到特定排程工作。

對於通道來源的執行，`ctx.messageProvider` 是供應商介面，例如 `discord` 或 `telegram`，而當 OpenClaw 能從工作階段鍵或遞送中繼資料推導時，`ctx.channelId` 是對話目標識別碼。

`agent_end` 是觀察鉤子，並會在回合後以 fire-and-forget 方式執行。鉤子執行器會套用 30 秒逾時，因此卡住的 Plugin 或嵌入端點不會讓鉤子 promise 永遠擱置。逾時會被記錄，且 OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則它不會取消 Plugin 擁有的網路工作。

使用 `model_call_started` 和 `model_call_ended` 進行不應收到原始提示、歷史、回應、標頭、請求本文或供應商請求 ID 的供應商呼叫遙測。這些鉤子包含穩定的中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及當 OpenClaw 可以推導出有界供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在測試框架即將接受自然的最終助理答案時執行。它不是 `/stop` 取消路徑，且在使用者中止回合時不會執行。回傳 `{ action: "revise", reason }` 以要求測試框架在最終化前再進行一次模型傳遞；回傳 `{ action: "finalize", reason? }` 以強制最終化；或省略結果以繼續。Codex 原生 `Stop` 鉤子會作為 OpenClaw `before_agent_finalize` 決策轉送到此鉤子。

回傳 `action: "revise"` 時，Plugin 可以包含 `retry` 中繼資料，使額外的模型傳遞有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給測試框架的修訂原因。`idempotencyKey` 讓主機能跨等效的最終化決策，計算同一 Plugin 請求的重試次數，而 `maxAttempts` 會限制主機在繼續使用自然最終答案前允許的額外傳遞次數。

需要 `llm_input`、`llm_output`、`before_agent_finalize` 或 `agent_end` 的非內建 Plugin 必須設定：

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

可依 Plugin 使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用提示變更鉤子和持久的下一回合注入。

### 工作階段擴充與下一回合注入

Workflow Plugin 可以使用 `api.registerSessionExtension(...)` 保存少量相容 JSON 的工作階段狀態，並透過 Gateway `sessions.pluginPatch` 方法更新。工作階段資料列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓控制 UI 和其他用戶端能呈現 Plugin 擁有的狀態，而不需要了解 Plugin 內部實作。

當 Plugin 需要讓持久內容剛好一次傳遞到下一個模型回合時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在 prompt hooks 之前清空已排佇的注入、丟棄已過期的注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見、但不應成為永久系統提示文字的命令接續的正確介面。

清理語意是合約的一部分。工作階段擴充清理和 runtime 生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。對於 reset/delete/disable，主機會移除所屬 Plugin 的持久工作階段擴充狀態與待處理的下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼可讓 Plugin 釋放排程器工作、執行內容，以及舊 runtime 世代的其他帶外資源。

## 訊息 hooks

使用訊息 hooks 進行通道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、寄件者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於純音訊 TTS 回覆，即使通道承載沒有可見文字/說明文字，`content` 也可能包含隱藏的口語逐字稿。重寫該 `content` 只會更新 hook 可見的逐字稿；它不會被呈現為媒體說明文字。

可用時，訊息 hook 內容會公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。請先使用這些一級欄位，再讀取舊版中繼資料。

使用通道特定中繼資料前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞給較低優先序的 hooks，除非後續 hook 取消傳遞。

## 安裝 hooks

`before_install` 會在內建的 skill 和 Plugin 安裝掃描之後執行。回傳額外發現項目，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對於需要 Gateway 擁有狀態的 Plugin 服務，請使用 `gateway_start`。內容會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用於 cron 檢查和更新。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` hook 來執行 Plugin 擁有的 runtime 服務。

`cron_changed` 會在 Gateway 擁有的 cron 生命週期事件中觸發，並提供具型別的事件承載，涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`），再加上值為 `not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用 runtime 內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

## 即將棄用

一些與 hook 相鄰的介面已棄用但仍受支援。請在下一個主要版本之前遷移：

- **純文字通道信封**，位於 `inbound_claim` 和 `message_received` 處理常式中。請讀取 `BodyForAgent` 和結構化的使用者內容區塊，而不是剖析平面信封文字。請參閱[純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 會保留以維持相容性。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式的 `string`。

如需完整清單，包括記憶體能力註冊、提供者 thinking profile、外部驗證提供者、提供者探索型別、任務 runtime 存取器，以及 `command-auth` → `command-status` 重新命名，請參閱 [Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時程
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hooks](/zh-TW/automation/hooks)
- [Plugin 架構內部](/zh-TW/plugins/architecture-internals)
