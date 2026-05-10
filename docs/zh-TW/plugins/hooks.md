---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息掛鉤或生命週期掛鉤的 Plugin
    - 您需要封鎖、重寫或要求核准來自 Plugin 的工具呼叫
    - 你正在決定要使用內部鉤子還是 Plugin 鉤子
summary: Plugin 鉤子：攔截代理、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 鉤子
x-i18n:
    generated_at: "2026-05-10T19:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hook 是 OpenClaw Plugin 的同行程擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝或 Gateway 啟動時，請使用它們。

當你想要為 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與 Gateway 事件使用由操作員安裝的小型 `HOOK.md` 指令碼時，請改用[內部 hook](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 入口使用 `api.on(...)` 註冊具型別的 Plugin hook：

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

Hook handler 會依 `priority` 由高到低依序執行。相同優先順序的 hook 會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` - handler 排序（數值越高越先執行）。
- `timeoutMs` - 可選的每個 hook 預算。設定時，hook runner 會在預算經過後中止該 handler，並繼續下一個，而不是讓緩慢的設定或回想工作消耗呼叫端設定的模型逾時。省略時，會使用 hook runner 通用套用的預設觀察/決策逾時。

操作員也可以在不修補 Plugin 程式碼的情況下設定 hook 預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而後者會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 設定的值。每個設定值都必須是正整數，且不得大於 600000 毫秒。對已知緩慢的 hook 優先使用每個 hook 的覆寫，避免讓某個 Plugin 在各處都取得較長的預算。

每個 hook 都會接收 `event.context.pluginConfig`，也就是註冊該 handler 的 Plugin 的已解析設定。對需要目前 Plugin 選項的 hook 決策使用它；OpenClaw 會逐一 handler 注入，不會改變其他 Plugin 看到的共用事件物件。

## Hook 目錄

Hook 依其擴充的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他所有 hook 僅供觀察。

**代理回合**

- `before_model_resolve` - 在工作階段訊息載入前覆寫提供者或模型
- `agent_turn_prepare` - 在 prompt hook 前消耗佇列中的 Plugin 回合注入，並加入同回合內容
- `before_prompt_build` - 在模型呼叫前加入動態內容或系統 prompt 文字
- `before_agent_start` - 僅為相容性保留的合併階段；優先使用上方兩個 hook
- **`before_agent_run`** - 在模型提交前檢查最終 prompt 與工作階段訊息，並可選擇封鎖執行
- **`before_agent_reply`** - 使用合成回覆或靜默來短路模型回合
- **`before_agent_finalize`** - 檢查自然產生的最終答案，並要求再執行一次模型
- `agent_end` - 觀察最終訊息、成功狀態與執行時間
- `heartbeat_prompt_contribution` - 為背景監控與生命週期 Plugin 加入僅限 Heartbeat 的內容

**對話觀察**

- `model_call_started` / `model_call_ended` - 觀察已清理的提供者/模型呼叫中繼資料、計時、結果，以及有界的請求 ID 雜湊，不包含 prompt 或回應內容
- `llm_input` - 觀察提供者輸入（系統 prompt、prompt、歷史紀錄）
- `llm_output` - 觀察提供者輸出

**工具**

- **`before_tool_call`** - 重寫工具參數、封鎖執行或要求核准
- `after_tool_call` - 觀察工具結果、錯誤與持續時間
- **`tool_result_persist`** - 重寫由工具結果產生的助理訊息
- **`before_message_write`** - 檢查或封鎖進行中的訊息寫入（少見）

**訊息與傳遞**

- **`inbound_claim`** - 在代理路由前認領輸入訊息（合成回覆）
- `message_received` - 觀察輸入內容、寄件者、討論串與中繼資料
- **`message_sending`** - 重寫輸出內容或取消傳遞
- `message_sent` - 觀察輸出傳遞成功或失敗
- **`before_dispatch`** - 在通道交接前檢查或重寫輸出分派
- **`reply_dispatch`** - 參與最終回覆分派管線

**工作階段與 Compaction**

- `session_start` / `session_end` - 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` - 觀察或註解 Compaction 週期
- `before_reset` - 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 協調子代理路由與完成傳遞

**生命週期**

- `gateway_start` / `gateway_stop` - 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` - 觀察 Gateway 擁有的 Cron 生命週期變更（新增、更新、移除、啟動、完成、排程）
- **`before_install`** - 檢查 Skills 或 Plugin 安裝掃描，並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會接收：

- `event.toolName`
- `event.params`
- 可選的 `event.derivedPaths`，包含對已知工具封套（例如 `apply_patch`）盡力由主機推導的目標路徑提示；存在時，這些路徑可能不完整，或可能高估工具實際會觸及的內容（例如輸入格式錯誤或不完整時）
- 可選的 `event.runId`
- 可選的 `event.toolCallId`
- 內容欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用的 `ctx.trace`

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

- `block: true` 是終止性決策，會略過較低優先順序的 handler。
- `block: false` 會被視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准向使用者詢問。`/approve` 命令可以核准 exec 與 Plugin 核准。
- 較低優先順序的 `block: true` 仍可在較高優先順序 hook 要求核准後封鎖。
- `onResolution` 會接收已解析的核准決策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的隨附 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` hook 與外部 Plugin 決策之前執行。僅將它們用於受主機信任的閘門，例如工作區政策、預算強制執行或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` hook。

### 工具結果持久化

工具結果可包含結構化的 `details`，供 UI 轉譯、診斷、媒體路由或 Plugin 擁有的中繼資料使用。請將 `details` 視為執行期中繼資料，而非 prompt 內容：

- OpenClaw 會在提供者重播與 Compaction 輸入前移除 `toolResult.details`，避免中繼資料成為模型內容。
- 持久化的工作階段項目只保留有界的 `details`。過大的 details 會替換為精簡摘要與 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限前執行。Hook 仍應讓回傳的 `details` 保持小型，並避免只把 prompt 相關文字放在 `details` 中；請將模型可見的工具輸出放在 `content`。

## Prompt 與模型 hook

新 Plugin 請使用階段專用 hook：

- `before_model_resolve`：只接收目前的 prompt 與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前的 prompt、已準備的工作階段訊息，以及為此工作階段排空的任何正好一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前的 prompt 與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不變更使用者發起回合的背景監控。

`before_agent_start` 仍為相容性保留。請優先使用上方明確 hook，讓你的 Plugin 不依賴舊版合併階段。

`before_agent_run` 會在 prompt 建構後、任何模型輸入前執行，包括 prompt 本地圖片載入與 `llm_input` 觀察。它會以 `prompt` 接收目前的使用者輸入，加上 `messages` 中已載入的工作階段歷史紀錄，以及作用中的系統 prompt。回傳 `{ outcome: "block", reason, message? }` 可在模型讀取 prompt 前停止執行。`reason` 為內部使用；`message` 是面向使用者的替代內容。唯一支援的結果是 `pass` 與 `block`；不支援的決策形狀會以封閉失敗處理。

當執行被封鎖時，OpenClaw 只會在 `message.content` 中儲存替代文字，以及非敏感封鎖中繼資料，例如封鎖 Plugin ID 與時間戳記。原始使用者文字不會保留在 transcript 或未來內容中。內部封鎖原因會被視為敏感資訊，並排除於 transcript、歷史紀錄、廣播、日誌與診斷酬載之外。可觀測性應使用已清理欄位，例如封鎖者 ID、結果、時間戳記或安全分類。

當 OpenClaw 能識別作用中的執行時，`before_agent_start` 與 `agent_end` 會包含 `event.runId`。同一值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 作業 ID），讓 Plugin hook 可將指標、副作用或狀態限定於特定排程作業。

對通道來源的執行，`ctx.messageProvider` 是提供者介面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 則是 OpenClaw 能從工作階段鍵或傳遞中繼資料推導時的對話目標識別碼。

`agent_end` 是觀察 hook，會在回合結束後以 fire-and-forget 方式執行。Hook runner 會套用 30 秒逾時，避免卡住的 Plugin 或嵌入端點讓 hook promise 永遠懸置。逾時會被記錄，而 OpenClaw 會繼續；除非 Plugin 也使用自己的 abort signal，否則不會取消 Plugin 擁有的網路工作。

將 `model_call_started` 與 `model_call_ended` 用於不應接收原始 prompt、歷史紀錄、回應、標頭、請求主體或提供者請求 ID 的提供者呼叫遙測。這些 hook 會包含穩定的中繼資料，例如 `runId`、`callId`、`provider`、`model`、可選的 `api`/`transport`、終止性的 `durationMs`/`outcome`，以及 OpenClaw 能推導出有界提供者請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在 harness 即將接受自然的最終 assistant 回答時執行。它不是 `/stop` 取消路徑，且不會在使用者中止某個回合時執行。回傳 `{ action: "revise", reason }` 可要求 harness 在最終化前再進行一次模型傳遞；回傳 `{ action:
"finalize", reason? }` 可強制最終化；或省略結果以繼續。Codex 原生 `Stop` hooks 會作為 OpenClaw `before_agent_finalize` 決策轉送到此 hook。

回傳 `action: "revise"` 時，Plugin 可以包含 `retry` 中繼資料，讓額外的模型傳遞有界且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給 harness 的修訂原因。`idempotencyKey` 讓 host 可跨等價的 finalize 決策，計算同一 Plugin 請求的重試次數，而 `maxAttempts` 會限制 host 在繼續使用自然最終回答前允許的額外傳遞次數。

需要原始對話 hook（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非內建 Plugin 必須設定：

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

可依 Plugin 使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會改變提示的 hook 與持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 持久保存小型 JSON 相容工作階段狀態，並透過 Gateway `sessions.pluginPatch` 方法更新它。工作階段資料列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 和其他用戶端能呈現 Plugin 擁有的狀態，而不需要了解 Plugin 內部實作。

當 Plugin 需要將持久內容精準傳遞到下一個模型回合一次時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示 hook 前清空佇列中的注入、丟棄已過期的注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是適合核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見但不應成為永久系統提示文字的命令延續的正確接縫。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。針對 reset/delete/disable，host 會移除擁有者 Plugin 的持久工作階段擴充狀態與待處理的下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼會讓 Plugin 釋放舊執行階段世代的排程器工作、執行內容與其他頻外資源。

## 訊息 hook

使用訊息 hook 處理通道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：改寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於純音訊 TTS 回覆，即使通道 payload 沒有可見文字/標題，`content` 也可能包含隱藏的口語逐字稿。改寫該 `content` 只會更新 hook 可見的逐字稿；它不會被呈現為媒體標題。

訊息 hook 內容會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在讀取舊版中繼資料前，優先使用這些一級欄位。

使用通道特定中繼資料前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止性的。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 改寫後的 `content` 會繼續傳遞給較低優先順序的 hook，除非後續 hook 取消傳遞。
- `message_sending` 可以在取消時回傳 `cancelReason` 和有界的 `metadata`。新的訊息生命週期 API 會將這公開為原因為 `cancelled_by_message_sending_hook` 的受抑制傳遞結果；舊版直接傳遞則為了相容性持續回傳空結果陣列。
- `message_sent` 僅供觀察。處理器失敗會被記錄，且不會變更傳遞結果。

## 安裝 hook

`before_install` 會在內建的 Skills 與 Plugin 安裝掃描後執行。回傳額外發現項目，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止性的。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對需要 Gateway 擁有狀態的 Plugin 服務使用 `gateway_start`。內容會公開 `ctx.config`、`ctx.workspaceDir`，以及用於 Cron 檢查與更新的 `ctx.getCron?.()`。使用 `gateway_stop` 清理長時間執行的資源。

請勿依賴內部的 `gateway:startup` hook 來處理 Plugin 擁有的執行階段服務。

`cron_changed` 會在 Gateway 擁有的 Cron 生命週期事件發生時觸發，並帶有涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因的具型別事件 payload。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的 `state.lastError`）加上 `PluginHookGatewayCronDeliveryStatus`，其值為 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的 `ctx.getCron?.()` 與 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

## 即將停用的項目

有幾個與 hook 相鄰的表面已棄用但仍受支援。請在下一個主要版本前遷移：

- **純文字通道信封**，位於 `inbound_claim` 和 `message_received` 處理器中。請讀取 `BodyForAgent` 與結構化的使用者內容區塊，而不是剖析扁平的信封文字。請參閱
  [純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留以維持相容性。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是組合階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

完整清單包括記憶體能力註冊、provider thinking 設定檔、外部驗證 provider、provider 探索型別、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱
[Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時間表
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hook](/zh-TW/automation/hooks)
- [Plugin 架構內部機制](/zh-TW/plugins/architecture-internals)
