---
read_when:
    - 你正在建構一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的 Plugin
    - 您需要封鎖、重寫，或要求核准 Plugin 發出的工具呼叫
    - 您正在內部掛鉤與 Plugin 掛鉤之間做選擇
summary: Plugin 掛鉤：攔截代理、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 掛鉤
x-i18n:
    generated_at: "2026-05-06T17:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 掛鉤是 OpenClaw Plugin 的行程內擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝，或 Gateway 啟動時使用它們。

如果你想要的是由操作員安裝、用於命令與 Gateway 事件的小型 `HOOK.md` 指令碼，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，請改用 [內部掛鉤](/zh-TW/automation/hooks)。

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

掛鉤處理常式會依 `priority` 由高到低依序執行。相同優先序的掛鉤會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 處理常式排序（較高者先執行）。
- `timeoutMs` - 選用的每個掛鉤預算。設定後，掛鉤執行器會在預算用盡後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回想工作耗盡呼叫端設定的模型逾時。省略它則使用掛鉤執行器通用套用的預設觀察/決策逾時。

操作員也可以不修補 Plugin 程式碼而設定掛鉤預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而後者會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 設定的值。每個設定值都必須是正整數，且不大於 600000 毫秒。對已知緩慢的掛鉤，偏好使用每個掛鉤的覆寫，避免讓單一 Plugin 在所有地方都取得較長預算。

每個掛鉤都會收到 `event.context.pluginConfig`，也就是註冊該處理常式的 Plugin 解析後設定。請將它用於需要目前 Plugin 選項的掛鉤決策；OpenClaw 會逐處理常式注入它，而不會改變其他 Plugin 看到的共用事件物件。

## 掛鉤目錄

掛鉤依其擴充的表面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他全部僅供觀察。

**代理回合**

- `before_model_resolve` - 在工作階段訊息載入前覆寫供應商或模型
- `agent_turn_prepare` - 消耗佇列中的 Plugin 回合注入，並在提示掛鉤前加入同回合內容
- `before_prompt_build` - 在模型呼叫前加入動態內容或系統提示文字
- `before_agent_start` - 僅供相容性的合併階段；偏好使用上述兩個掛鉤
- **`before_agent_run`** - 在模型提交前檢查最終提示與工作階段訊息，並可選擇性封鎖執行
- **`before_agent_reply`** - 以合成回覆或靜默短路模型回合
- **`before_agent_finalize`** - 檢查自然最終答案並要求再進行一次模型通過
- `agent_end` - 觀察最終訊息、成功狀態與執行期間
- `heartbeat_prompt_contribution` - 為背景監控器與生命週期 Plugin 加入僅限 Heartbeat 的內容

**對話觀察**

- `model_call_started` / `model_call_ended` - 觀察已清理的供應商/模型呼叫中繼資料、計時、結果，以及有界請求 ID 雜湊，不包含提示或回應內容
- `llm_input` - 觀察供應商輸入（系統提示、提示、歷史）
- `llm_output` - 觀察供應商輸出

**工具**

- **`before_tool_call`** - 重寫工具參數、封鎖執行，或要求核准
- `after_tool_call` - 觀察工具結果、錯誤與期間
- **`tool_result_persist`** - 重寫由工具結果產生的助理訊息
- **`before_message_write`** - 檢查或封鎖進行中的訊息寫入（少見）

**訊息與傳遞**

- **`inbound_claim`** - 在代理路由前認領傳入訊息（合成回覆）
- `message_received` - 觀察傳入內容、寄件者、執行緒與中繼資料
- **`message_sending`** - 重寫傳出內容或取消傳遞
- `message_sent` - 觀察傳出傳遞成功或失敗
- **`before_dispatch`** - 在通道交接前檢查或重寫傳出派送
- **`reply_dispatch`** - 參與最終回覆派送管線

**工作階段與 Compaction**

- `session_start` / `session_end` - 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` - 觀察或註記 Compaction 週期
- `before_reset` - 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 協調子代理路由與完成傳遞

**生命週期**

- `gateway_start` / `gateway_stop` - 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` - 觀察 Gateway 擁有的 Cron 生命週期變更（已新增、已更新、已移除、已啟動、已完成、已排程）
- **`before_install`** - 檢查技能或 Plugin 安裝掃描，並可選擇性封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用 `event.runId`
- 選用 `event.toolCallId`
- 內容欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用 `ctx.trace`

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

- `block: true` 是終止性決策，會略過較低優先序的處理常式。
- `block: false` 會視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准向使用者詢問。`/approve` 命令可同時核准 exec 與 Plugin 核准。
- 較低優先序的 `block: true` 仍可在較高優先序掛鉤要求核准後封鎖。
- `onResolution` 會收到解析後的核准決策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可使用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` 掛鉤與外部 Plugin 決策前執行。請只將它們用於主機信任的關卡，例如工作區政策、預算強制執行，或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` 掛鉤。

### 工具結果持久化

工具結果可以包含結構化 `details`，用於 UI 轉譯、診斷、媒體路由，或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而不是提示內容：

- OpenClaw 會在供應商重播與 Compaction 輸入前移除 `toolResult.details`，避免中繼資料成為模型內容。
- 持久化工作階段項目只保留有界的 `details`。過大的 details 會以精簡摘要與 `persistedDetailsTruncated: true` 取代。
- `tool_result_persist` 與 `before_message_write` 會在最終持久化上限前執行。掛鉤仍應保持傳回的 `details` 簡短，並避免只把與提示相關的文字放在 `details`；請將模型可見的工具輸出放在 `content`。

## 提示與模型掛鉤

新 Plugin 請使用特定階段的掛鉤：

- `before_model_resolve`：只接收目前提示與附件中繼資料。傳回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段耗盡的任何恰好一次佇列注入。傳回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。傳回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 回合執行，並傳回 `prependContext` 或 `appendContext`。它供需要摘要目前狀態且不變更使用者發起回合的背景監控器使用。

`before_agent_start` 保留用於相容性。偏好使用上述明確掛鉤，讓你的 Plugin 不依賴舊版合併階段。

`before_agent_run` 會在提示建構後、任何模型輸入前執行，包括提示本機圖片載入與 `llm_input` 觀察。它會以 `prompt` 接收目前使用者輸入，並在 `messages` 中接收已載入的工作階段歷史，以及作用中的系統提示。傳回 `{ outcome: "block", reason, message? }` 可在模型讀取提示前停止執行。`reason` 供內部使用；`message` 是面向使用者的替代內容。唯一支援的結果是 `pass` 與 `block`；不支援的決策形狀會以失敗關閉處理。

當執行遭封鎖時，OpenClaw 只會在 `message.content` 中儲存替代文字，以及非敏感的封鎖中繼資料，例如封鎖 Plugin ID 與時間戳記。原始使用者文字不會保留在逐字稿或未來內容中。內部封鎖原因會視為敏感資訊，並從逐字稿、歷史、廣播、記錄與診斷承載中排除。可觀測性應使用已清理欄位，例如封鎖者 ID、結果、時間戳記，或安全分類。

當 OpenClaw 能識別作用中執行時，`before_agent_start` 與 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 作業 ID），讓 Plugin 掛鉤可將指標、副作用或狀態限定於特定排程作業。

對於源自通道的執行，`ctx.messageProvider` 是供應商表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 能從工作階段鍵或傳遞中繼資料推導出的對話目標識別碼。

`agent_end` 是觀察掛鉤，會在回合後以發出即忘方式執行。掛鉤執行器會套用 30 秒逾時，避免卡住的 Plugin 或嵌入端點讓掛鉤 promise 永遠懸而未決。逾時會被記錄，且 OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則不會取消 Plugin 擁有的網路工作。

針對不應接收原始提示、歷史、回應、標頭、請求本文或供應商請求 ID 的供應商呼叫遙測，請使用 `model_call_started` 與 `model_call_ended`。這些掛鉤包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及當 OpenClaw 可推導有界供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在 harness 即將接受自然最終助理答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。傳回 `{ action: "revise", reason }` 可要求 harness 在最終化前再進行一次模型通過，傳回 `{ action:
"finalize", reason? }` 可強制最終化，或省略結果以繼續。Codex 原生 `Stop` 掛鉤會作為 OpenClaw `before_agent_finalize` 決策轉送至此掛鉤。

傳回 `action: "revise"` 時，Plugin 可包含 `retry` 中繼資料，使額外模型通過有界且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送至測試框架的修訂原因。
`idempotencyKey` 讓主機能針對等效 finalize 決策中的同一個 Plugin 請求計算重試次數，而 `maxAttempts` 會限制主機在繼續產生自然最終答案前允許的額外回合數。

需要原始對話 hook（`before_model_resolve`、
`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、
`agent_end` 或 `before_agent_run`）的非內建 Plugin 必須設定：

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

可依 Plugin 停用會修改提示的 hook 與持久的下一回合注入，方法是設定
`plugins.entries.<id>.hooks.allowPromptInjection=false`。

### 工作階段擴充功能與下一回合注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 保留小型 JSON 相容工作階段狀態，並透過 Gateway 的 `sessions.pluginPatch` 方法更新該狀態。工作階段列會透過 `pluginExtensions` 投射已註冊的擴充功能狀態，讓 Control UI 和其他用戶端能呈現 Plugin 擁有的狀態，而不需要了解 Plugin 內部細節。

當 Plugin 需要讓持久內容準確一次地傳遞到下一個模型回合時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示 hook 之前排空佇列中的注入、丟棄已過期的注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見、但不應成為永久系統提示文字的命令延續所適用的接縫。

清理語意是合約的一部分。工作階段擴充功能清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。針對 reset/delete/disable，主機會移除所屬 Plugin 的持久工作階段擴充功能狀態與待處理的下一回合注入；restart 則會保留持久工作階段狀態，同時清理回呼讓 Plugin 釋放舊執行階段世代的排程器工作、執行內容，以及其他頻外資源。

## 訊息 hook

使用訊息 hook 進行頻道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、寄件者、`threadId`、`messageId`、
  `senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於只有音訊的 TTS 回覆，即使頻道承載資料沒有可見文字/標題，`content` 也可能包含隱藏的語音逐字稿。重寫該 `content` 只會更新 hook 可見的逐字稿；它不會呈現為媒體標題。

訊息 hook 內容會在可用時公開穩定的關聯欄位：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在讀取舊版中繼資料之前，請優先使用這些一級欄位。

在使用頻道專屬中繼資料之前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞給較低優先順序的 hook，除非後續 hook 取消傳遞。

## 安裝 hook

`before_install` 會在內建的 Skills 與 Plugin 安裝掃描之後執行。
回傳額外發現項目或 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對於需要 Gateway 擁有狀態的 Plugin 服務，請使用 `gateway_start`。內容會公開 `ctx.config`、`ctx.workspaceDir` 和用於 Cron 檢查與更新的 `ctx.getCron?.()`。使用 `gateway_stop` 清理長時間執行的資源。

請勿依賴內部 `gateway:startup` hook 來執行 Plugin 擁有的執行階段服務。

`cron_changed` 會針對 Gateway 擁有的 Cron 生命週期事件觸發，並提供具型別的事件承載資料，涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`）加上值為 `not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。已移除事件仍會攜帶已刪除的工作快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

## 即將停用

部分與 hook 相鄰的介面已被棄用但仍受支援。請在下一個主要版本前遷移：

- `inbound_claim` 和 `message_received` 處理常式中的**純文字頻道信封**。
  請讀取 `BodyForAgent` 與結構化使用者內容區塊，而不是剖析扁平信封文字。請參閱
  [純文字頻道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留作為相容用途。新的 Plugin 應使用
  `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的
  `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

如需完整清單，包括記憶體功能註冊、提供者思考設定檔、外部驗證提供者、提供者探索型別、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱
[Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時程
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hook](/zh-TW/automation/hooks)
- [Plugin 架構內部細節](/zh-TW/plugins/architecture-internals)
