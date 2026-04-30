---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的 Plugin
    - 你需要封鎖、重寫或要求核准 Plugin 發出的工具呼叫
    - 你正在決定要使用內部掛鉤還是 Plugin 掛鉤
summary: Plugin 鉤子：攔截代理、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 掛鉤
x-i18n:
    generated_at: "2026-04-30T03:24:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 掛鉤是在程序內執行的 OpenClaw Plugin 擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝，或 Gateway 啟動時使用。

若你想為 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令和 Gateway 事件使用小型、由操作人員安裝的 `HOOK.md` 指令碼，請改用[內部掛鉤](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 進入點使用 `api.on(...)` 註冊具型別的 Plugin 掛鉤：

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

掛鉤處理常式會依 `priority` 遞減順序循序執行。相同優先權的掛鉤會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 處理常式排序（較高者先執行）。
- `timeoutMs` — 選用的每個掛鉤預算。設定後，掛鉤執行器會在預算耗盡後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回想工作消耗呼叫端設定的模型逾時。省略它以使用掛鉤執行器通用套用的預設觀察/決策逾時。

每個掛鉤都會收到 `event.context.pluginConfig`，也就是註冊該處理常式的 Plugin 解析後設定。將它用於需要目前 Plugin 選項的掛鉤決策；OpenClaw 會為每個處理常式注入它，而不會改變其他 Plugin 所見的共用事件物件。

## 掛鉤目錄

掛鉤依其擴充的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他全部僅供觀察。

**代理回合**

- `before_model_resolve` — 在載入工作階段訊息前覆寫提供者或模型
- `agent_turn_prepare` — 取用佇列中的 Plugin 回合注入，並在提示掛鉤前加入同回合內容
- `before_prompt_build` — 在模型呼叫前加入動態內容或系統提示文字
- `before_agent_start` — 僅供相容性的合併階段；偏好使用上方兩個掛鉤
- **`before_agent_reply`** — 以合成回覆或靜默短路模型回合
- **`before_agent_finalize`** — 檢查自然最終答案並要求再執行一次模型傳遞
- `agent_end` — 觀察最終訊息、成功狀態與執行時間
- `heartbeat_prompt_contribution` — 為背景監控器與生命週期 Plugin 加入僅限 Heartbeat 的內容

**對話觀察**

- `model_call_started` / `model_call_ended` — 觀察已清理的提供者/模型呼叫中繼資料、計時、結果，以及有界的請求 ID 雜湊，不含提示或回應內容
- `llm_input` — 觀察提供者輸入（系統提示、提示、歷史）
- `llm_output` — 觀察提供者輸出

**工具**

- **`before_tool_call`** — 重寫工具參數、封鎖執行，或要求核准
- `after_tool_call` — 觀察工具結果、錯誤與持續時間
- **`tool_result_persist`** — 重寫由工具結果產生的助理訊息
- **`before_message_write`** — 檢查或封鎖進行中的訊息寫入（少見）

**訊息與傳遞**

- **`inbound_claim`** — 在代理路由前認領傳入訊息（合成回覆）
- `message_received` — 觀察傳入內容、寄件者、執行緒與中繼資料
- **`message_sending`** — 重寫外寄內容或取消傳遞
- `message_sent` — 觀察外寄傳遞成功或失敗
- **`before_dispatch`** — 在頻道交接前檢查或重寫外寄分派
- **`reply_dispatch`** — 參與最終回覆分派管線

**工作階段與 Compaction**

- `session_start` / `session_end` — 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` — 觀察或註記 Compaction 週期
- `before_reset` — 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 協調子代理路由與完成傳遞

**生命週期**

- `gateway_start` / `gateway_stop` — 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` — 觀察 Gateway 擁有的 Cron 生命週期變更（已新增、已更新、已移除、已啟動、已完成、已排程）
- **`before_install`** — 檢查 Skills 或 Plugin 安裝掃描，並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 內容欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動執行中設定），以及診斷用的 `ctx.trace`

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

- `block: true` 是終止性決策，會跳過較低優先權的處理常式。
- `block: false` 會被視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准向使用者詢問。`/approve` 命令可以核准 exec 與 Plugin 核准。
- 較低優先權的 `block: true` 仍可在較高優先權掛鉤要求核准後封鎖。
- `onResolution` 會收到解析後的核准決策 — `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任工具政策。這些政策會在一般 `before_tool_call` 掛鉤與外部 Plugin 決策之前執行。僅將它們用於主機信任的閘門，例如工作區政策、預算執行或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` 掛鉤。

### 工具結果持久化

工具結果可以包含結構化 `details`，用於 UI 呈現、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而非提示內容：

- OpenClaw 會在提供者重播與 Compaction 輸入前移除 `toolResult.details`，因此中繼資料不會成為模型內容。
- 持久化的工作階段項目只會保留有界的 `details`。過大的 details 會被精簡摘要與 `persistedDetailsTruncated: true` 取代。
- `tool_result_persist` 與 `before_message_write` 會在最終持久化上限前執行。掛鉤仍應讓回傳的 `details` 保持小型，並避免只把提示相關文字放在 `details` 中；請將模型可見的工具輸出放在 `content`。

## 提示與模型掛鉤

新 Plugin 請使用階段特定掛鉤：

- `before_model_resolve`：只接收目前提示與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段取出的任何精確一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只會在 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不改變使用者發起回合的背景監控器。

`before_agent_start` 保留用於相容性。偏好使用上方的明確掛鉤，避免你的 Plugin 依賴舊版合併階段。

當 OpenClaw 可以識別作用中的執行時，`before_agent_start` 與 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 工作 ID），讓 Plugin 掛鉤可以將指標、副作用或狀態限定到特定排程工作。

`agent_end` 是觀察掛鉤，會在回合後以即發即忘方式執行。掛鉤執行器會套用 30 秒逾時，因此卡住的 Plugin 或嵌入端點不會讓掛鉤 promise 永遠擱置。逾時會被記錄，OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則它不會取消 Plugin 擁有的網路工作。

使用 `model_call_started` 與 `model_call_ended` 取得不應接收原始提示、歷史、回應、標頭、請求主體或提供者請求 ID 的提供者呼叫遙測。這些掛鉤包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端的 `durationMs`/`outcome`，以及 OpenClaw 可推導出有界提供者請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在控制框架即將接受自然最終助理答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。回傳 `{ action: "revise", reason }` 以要求控制框架在最終化前再執行一次模型傳遞，回傳 `{ action:
"finalize", reason? }` 以強制最終化，或省略結果以繼續。Codex 原生 `Stop` 掛鉤會轉送為 OpenClaw `before_agent_finalize` 決策。

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

可依每個 Plugin 使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會改變提示的掛鉤與持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 相容工作階段狀態，並透過 Gateway `sessions.pluginPatch` 方法更新。工作階段列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 與其他用戶端能呈現 Plugin 擁有的狀態，而不需要了解 Plugin 內部。

當 Plugin 需要讓持久內容精確一次到達下一個模型回合時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示掛鉤前取出佇列注入、丟棄過期注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見、但不應成為永久系統提示文字的命令延續所適合的接縫。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。主機會針對 reset/delete/disable 移除擁有 Plugin 的持久工作階段擴充狀態與待處理下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼讓 Plugin 釋放舊執行階段世代的排程器工作、執行內容與其他頻外資源。

## 訊息掛鉤

使用訊息掛鉤處理頻道層級路由與傳遞政策：

- `message_received`：觀察傳入內容、寄件者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯與中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使通道酬載沒有可見的文字/字幕，`content` 也可能包含隱藏的語音文字稿。改寫該 `content` 只會更新掛鉤可見的文字稿；它不會被呈現為媒體字幕。

訊息掛鉤情境會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。請先使用這些一等欄位，再讀取舊版中繼資料。

使用通道專屬中繼資料之前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止性決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 改寫後的 `content` 會繼續傳遞給較低優先順序的掛鉤，除非後續掛鉤取消傳遞。

## 安裝掛鉤

`before_install` 會在內建的 Skills 和 Plugin 安裝掃描之後執行。回傳額外發現項目，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止性決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對於需要 Gateway 擁有狀態的 Plugin 服務，請使用 `gateway_start`。情境會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，供 Cron 檢查與更新使用。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部的 `gateway:startup` 掛鉤來處理 Plugin 擁有的執行階段服務。

`cron_changed` 會針對 Gateway 擁有的 Cron 生命週期事件觸發，並帶有具型別的事件酬載，涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`），再加上一個 `PluginHookGatewayCronDeliveryStatus`，其值為 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器能夠協調狀態。同步外部喚醒排程器時，請使用執行階段情境中的 `ctx.getCron?.()` 和 `ctx.config`，並保持 OpenClaw 作為到期檢查與執行的真實來源。

## 即將棄用

少數與掛鉤相鄰的介面已棄用但仍受支援。請在下一個主要版本發布前遷移：

- **明文通道信封**，位於 `inbound_claim` 和 `message_received` 處理常式中。請讀取 `BodyForAgent` 和結構化的使用者情境區塊，而不是剖析扁平信封文字。請參閱 [明文通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 會保留以維持相容性。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式的 `string`。

完整清單包含記憶體能力註冊、供應商思考設定檔、外部驗證供應商、供應商探索型別、工作執行階段存取子，以及 `command-auth` → `command-status` 重新命名，請參閱 [Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) — 作用中的棄用項目與移除時程
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部掛鉤](/zh-TW/automation/hooks)
- [Plugin 架構內部細節](/zh-TW/plugins/architecture-internals)
