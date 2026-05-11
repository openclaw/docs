---
read_when:
    - 你正在建立一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的 Plugin
    - 你需要封鎖、重寫或要求核准來自 Plugin 的工具呼叫
    - 你正在決定要使用內部掛鉤還是 Plugin 掛鉤
summary: Plugin 掛鉤：攔截代理、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 掛鉤
x-i18n:
    generated_at: "2026-05-11T20:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 掛鉤是 OpenClaw Plugin 的行程內擴充點。當 Plugin 需要檢查或變更代理程式執行、工具呼叫、訊息流程、工作階段生命週期、子代理程式路由、安裝或 Gateway 啟動時，請使用它們。

如果你需要的是由操作者安裝的小型 `HOOK.md` 指令碼，用於 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與 Gateway 事件，請改用[內部掛鉤](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 入口使用 `api.on(...)` 註冊具型別的 Plugin 掛鉤：

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

掛鉤處理常式會依 `priority` 由高到低循序執行。相同優先順序的掛鉤會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 處理常式排序（較高者先執行）。
- `timeoutMs` - 選用的單一掛鉤預算。設定後，掛鉤執行器會在預算經過後中止該處理常式，並繼續執行下一個，而不是讓緩慢的設定或回憶工作消耗呼叫端設定的模型逾時。省略時會使用掛鉤執行器通用套用的預設觀察/決策逾時。

操作者也可以不修補 Plugin 程式碼而設定掛鉤預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而 `hooks.timeoutMs` 會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 中設定的值。每個設定值都必須是正整數，且不得大於 600000 毫秒。對於已知較慢的掛鉤，建議使用單一掛鉤覆寫，避免讓某個 Plugin 在所有地方都取得更長預算。

每個掛鉤都會收到 `event.context.pluginConfig`，也就是註冊該處理常式的 Plugin 已解析設定。需要目前 Plugin 選項的掛鉤決策可使用它；OpenClaw 會逐處理常式注入此值，而不會變更其他 Plugin 看到的共用事件物件。

## 掛鉤目錄

掛鉤依其擴充的介面分組。**粗體**名稱可接受決策結果（封鎖、取消、覆寫或要求核准）；其餘都僅供觀察。

**代理程式回合**

- `before_model_resolve` - 在工作階段訊息載入前覆寫提供者或模型
- `agent_turn_prepare` - 消耗已排入佇列的 Plugin 回合注入，並在提示掛鉤前加入同回合脈絡
- `before_prompt_build` - 在模型呼叫前加入動態脈絡或系統提示文字
- `before_agent_start` - 僅供相容性的合併階段；建議使用上方兩個掛鉤
- **`before_agent_run`** - 在提交給模型前檢查最終提示與工作階段訊息，並可選擇封鎖執行
- **`before_agent_reply`** - 使用合成回覆或沉默提前結束模型回合
- **`before_agent_finalize`** - 檢查自然產生的最終答案，並要求再執行一次模型傳遞
- `agent_end` - 觀察最終訊息、成功狀態與執行持續時間
- `heartbeat_prompt_contribution` - 為背景監控與生命週期 Plugin 加入僅限 Heartbeat 的脈絡

**對話觀察**

- `model_call_started` / `model_call_ended` - 觀察已清理的提供者/模型呼叫中繼資料、時間、結果，以及有界請求 ID 雜湊，不含提示或回應內容
- `llm_input` - 觀察提供者輸入（系統提示、提示、歷史記錄）
- `llm_output` - 觀察提供者輸出

**工具**

- **`before_tool_call`** - 重寫工具參數、封鎖執行或要求核准
- `after_tool_call` - 觀察工具結果、錯誤與持續時間
- **`tool_result_persist`** - 重寫由工具結果產生的助理訊息
- **`before_message_write`** - 檢查或封鎖進行中的訊息寫入（少見）

**訊息與遞送**

- **`inbound_claim`** - 在代理程式路由前宣告接收站訊息（合成回覆）
- `message_received` - 觀察接收站內容、傳送者、討論串與中繼資料
- **`message_sending`** - 重寫傳出內容或取消遞送
- `message_sent` - 觀察傳出遞送成功或失敗
- **`before_dispatch`** - 在交給頻道前檢查或重寫傳出派發
- **`reply_dispatch`** - 參與最終回覆派發管線

**工作階段與 Compaction**

- `session_start` / `session_end` - 追蹤工作階段生命週期邊界。事件的 `reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。當程序在工作階段仍作用中時停止或重新啟動，`shutdown` 與 `restart` 值會由 gateway 關閉終結器觸發，因此下游 Plugin（例如記憶體或逐字稿儲存）可以完成原本會在重新啟動後留在開啟狀態的幽靈資料列。終結器有界限，因此緩慢的 Plugin 無法封鎖 SIGTERM/SIGINT。
- `before_compaction` / `after_compaction` - 觀察或註解 Compaction 週期
- `before_reset` - 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理程式**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 協調子代理程式路由與完成遞送

**生命週期**

- `gateway_start` / `gateway_stop` - 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` - 觀察 gateway 擁有的 cron 生命週期變更（已新增、已更新、已移除、已開始、已完成、已排程）
- **`before_install`** - 檢查 Skill 或 Plugin 安裝掃描，並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.derivedPaths`，其中包含主機以盡力方式推導出的目標路徑提示，用於 `apply_patch` 等已知工具信封；若存在，這些路徑可能不完整，或可能過度近似工具實際會觸及的內容（例如輸入格式錯誤或不完整時）
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用的 `ctx.trace`

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

- `block: true` 是終止性決策，並會略過較低優先順序的處理常式。
- `block: false` 會視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理程式執行，並透過 Plugin 核准詢問使用者。`/approve` 命令可以核准 exec 與 Plugin 核准。
- 較低優先順序的 `block: true` 仍可在較高優先順序掛鉤要求核准後封鎖。
- `onResolution` 會收到已解析的核准決策：`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` 掛鉤與外部 Plugin 決策之前執行。請只將它們用於工作區政策、預算強制執行或保留工作流程安全性等主機信任閘門。外部 Plugin 應使用一般 `before_tool_call` 掛鉤。

### 工具結果持久化

工具結果可以包含結構化 `details`，用於 UI 轉譯、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而非提示內容：

- OpenClaw 會在提供者重播與 Compaction 輸入前移除 `toolResult.details`，因此中繼資料不會成為模型脈絡。
- 持久化的工作階段項目只保留有界的 `details`。過大的 details 會替換為精簡摘要，並附上 `persistedDetailsTruncated: true`。
- `tool_result_persist` 與 `before_message_write` 會在最終持久化上限前執行。掛鉤仍應讓回傳的 `details` 保持小型，並避免只把與提示相關的文字放在 `details`；模型可見的工具輸出應放在 `content`。

## 提示與模型掛鉤

新 Plugin 請使用特定階段的掛鉤：

- `before_model_resolve`：只接收目前提示與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段取出的任何正好一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不變更使用者發起回合的背景監控。

`before_agent_start` 仍保留用於相容性。請優先使用上方明確的掛鉤，避免你的 Plugin 依賴舊版合併階段。

`before_agent_run` 會在提示建構後、任何模型輸入前執行，包括提示本地圖片載入與 `llm_input` 觀察。它會以 `prompt` 接收目前使用者輸入，並在 `messages` 中接收已載入的工作階段歷史記錄，以及作用中的系統提示。回傳 `{ outcome: "block", reason, message? }` 可在模型讀取提示前停止執行。`reason` 是內部用；`message` 是面向使用者的替代文字。唯一支援的結果是 `pass` 與 `block`；不支援的決策形狀會以封閉失敗處理。

當執行遭封鎖時，OpenClaw 只會在 `message.content` 中儲存替代文字，加上非敏感封鎖中繼資料，例如封鎖 Plugin ID 與時間戳記。原始使用者文字不會保留在逐字稿或未來脈絡中。內部封鎖原因會視為敏感資訊，並排除在逐字稿、歷史記錄、廣播、記錄檔與診斷承載之外。可觀測性應使用已清理欄位，例如封鎖者 ID、結果、時間戳記或安全分類。

當 OpenClaw 可以識別作用中執行時，`before_agent_start` 與 `agent_end` 會包含 `event.runId`。同一個值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 cron 工作 ID），讓 Plugin 掛鉤可以將指標、副作用或狀態限定到特定排程工作。

對於頻道來源的執行，`ctx.messageProvider` 是提供者介面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 可從工作階段鍵或遞送中繼資料推導時的對話目標識別碼。

`agent_end` 是觀察掛鉤，會在回合後以即發即忘方式執行。掛鉤執行器會套用 30 秒逾時，因此卡住的 Plugin 或嵌入端點無法讓掛鉤 promise 永遠擱置。逾時會被記錄，OpenClaw 會繼續；除非 Plugin 也使用自己的 abort signal，否則不會取消 Plugin 擁有的網路工作。

使用 `model_call_started` 和 `model_call_ended` 來處理不應接收原始提示、歷史記錄、回應、標頭、請求主體或 provider 請求 ID 的 provider 呼叫遙測。這些 hook 包含穩定的中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終止時的 `durationMs`/`outcome`，以及 OpenClaw 可推導出有界 provider 請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在 harness 即將接受自然的最終 assistant 答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止一個 turn 時執行。回傳 `{ action: "revise", reason }` 可要求 harness 在 finalized 前再進行一次模型傳遞，回傳 `{ action:
"finalize", reason? }` 可強制 finalize，或省略結果以繼續。Codex 原生 `Stop` hooks 會被轉送為此 hook 中的 OpenClaw `before_agent_finalize` 決策。

回傳 `action: "revise"` 時，Plugin 可以包含 `retry` 中繼資料，讓額外的模型傳遞有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給 harness 的修訂原因。`idempotencyKey` 讓 host 能跨等價的 finalize 決策計算同一個 Plugin 請求的重試次數，而 `maxAttempts` 則限制 host 在繼續採用自然最終答案前允許多少次額外傳遞。

需要原始對話 hooks（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非內建 Plugin 必須設定：

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

可針對每個 Plugin 透過 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會變更提示的 hooks 和持久的下一 turn 注入。

### 工作階段擴充與下一 turn 注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 相容工作階段狀態，並透過 Gateway 的 `sessions.pluginPatch` 方法更新。工作階段資料列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 和其他用戶端能在不了解 Plugin 內部實作的情況下呈現 Plugin 擁有的狀態。

當 Plugin 需要讓持久內容恰好一次到達下一個模型 turn 時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示 hooks 前排出佇列中的注入、丟棄過期注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是適合核准恢復、政策摘要、背景監控差異，以及應在下一 turn 對模型可見但不應成為永久系統提示文字的命令延續的正確 seam。

清理語意是合約的一部分。工作階段擴充清理和執行階段生命週期清理 callback 會接收 `reset`、`delete`、`disable` 或 `restart`。host 會在 reset/delete/disable 時移除擁有 Plugin 的持久工作階段擴充狀態和待處理的下一 turn 注入；restart 會保留持久工作階段狀態，同時清理 callback 讓 Plugin 能釋放舊執行階段世代的排程器工作、執行內容和其他頻外資源。

## 訊息 hooks

使用訊息 hooks 處理通道層級路由與傳遞政策：

- `message_received`：觀察傳入內容、寄件者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使通道 payload 沒有可見文字/字幕，`content` 也可能包含隱藏的語音逐字稿。重寫該 `content` 只會更新 hook 可見的逐字稿；它不會被算繪為媒體字幕。

訊息 hook context 會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。請優先使用這些一級欄位，再讀取舊版中繼資料。

請優先使用具型別的 `threadId` 和 `replyToId` 欄位，再使用通道特定中繼資料。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫的 `content` 會繼續傳遞給較低優先序 hooks，除非後續 hook 取消傳遞。
- `message_sending` 可以在取消時回傳 `cancelReason` 和有界的 `metadata`。新的訊息生命週期 API 會將此公開為原因為 `cancelled_by_message_sending_hook` 的受抑制傳遞結果；舊版直接傳遞則為了相容性繼續回傳空結果陣列。
- `message_sent` 僅供觀察。處理常式失敗會被記錄，且不會變更傳遞結果。

## 安裝 hooks

`before_install` 會在內建的 skill 和 Plugin 安裝掃描後執行。回傳其他 findings 或 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對於需要 Gateway 擁有狀態的 Plugin 服務，請使用 `gateway_start`。context 會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，以便檢查和更新 cron。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` hook 來處理 Plugin 擁有的執行階段服務。

`cron_changed` 會針對 gateway 擁有的 cron 生命週期事件觸發，並提供涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因的具型別事件 payload。此事件會攜帶 `PluginHookGatewayCronJob` 快照（包括 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`）加上值為 `not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。已移除事件仍會攜帶已刪除的工作快照，讓外部排程器能協調狀態。同步外部喚醒排程器時，請使用執行階段 context 中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查和執行的真實來源。

## 即將棄用

有幾個 hook 相鄰介面已棄用但仍受支援。請在下一個主要版本前遷移：

- **純文字通道封套**，位於 `inbound_claim` 和 `message_received` 處理常式。請讀取 `BodyForAgent` 和結構化使用者 context 區塊，而不是剖析扁平封套文字。請參閱[純文字通道封套 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍為相容性保留。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` union（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式的 `string`。

完整清單包含記憶體能力註冊、provider thinking profile、外部 auth providers、provider discovery types、task runtime accessors，以及 `command-auth` → `command-status` 重新命名，請參閱 [Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時程
- [建構 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hooks](/zh-TW/automation/hooks)
- [Plugin 架構內部](/zh-TW/plugins/architecture-internals)
