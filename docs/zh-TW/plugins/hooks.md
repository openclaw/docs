---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的 Plugin
    - 您需要阻擋、改寫，或要求核准來自 Plugin 的工具呼叫
    - 你正在決定要使用內部 hook 還是 Plugin hook
summary: Plugin 鉤子：攔截代理程式、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 鉤子
x-i18n:
    generated_at: "2026-05-02T20:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 掛鉤是 OpenClaw Plugin 的程序內擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝或 Gateway 啟動時，請使用它們。

如果你想要的是操作員安裝的小型 `HOOK.md` 指令碼，用於 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與 Gateway 事件，請改用[內部掛鉤](/zh-TW/automation/hooks)。

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

掛鉤處理常式會依遞減的 `priority` 依序執行。相同優先順序的掛鉤會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 處理常式排序（較高者先執行）。
- `timeoutMs` — 選用的每個掛鉤預算。設定時，掛鉤執行器會在預算經過後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回憶工作耗用呼叫端設定的模型逾時。省略時會使用掛鉤執行器一般套用的預設觀察/決策逾時。

每個掛鉤都會收到 `event.context.pluginConfig`，也就是註冊該處理常式之 Plugin 的已解析設定。若掛鉤決策需要目前的 Plugin 選項，請使用它；OpenClaw 會針對每個處理常式注入此設定，而不會改變其他 Plugin 看到的共用事件物件。

## 掛鉤目錄

掛鉤會依其擴充的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他全部僅供觀察。

**代理回合**

- `before_model_resolve` — 在工作階段訊息載入前覆寫提供者或模型
- `agent_turn_prepare` — 在提示掛鉤前取用已排入佇列的 Plugin 回合注入，並加入同回合脈絡
- `before_prompt_build` — 在模型呼叫前加入動態脈絡或系統提示文字
- `before_agent_start` — 僅供相容性的組合階段；優先使用上述兩個掛鉤
- **`before_agent_reply`** — 以合成回覆或靜默短路模型回合
- **`before_agent_finalize`** — 檢查自然的最終答案並要求再進行一次模型傳遞
- `agent_end` — 觀察最終訊息、成功狀態與執行持續時間
- `heartbeat_prompt_contribution` — 為背景監控與生命週期 Plugin 加入僅 Heartbeat 使用的脈絡

**對話觀察**

- `model_call_started` / `model_call_ended` — 觀察已清理的提供者/模型呼叫中繼資料、計時、結果，以及受限的請求 ID 雜湊，不包含提示或回應內容
- `llm_input` — 觀察提供者輸入（系統提示、提示、歷史）
- `llm_output` — 觀察提供者輸出

**工具**

- **`before_tool_call`** — 重寫工具參數、封鎖執行或要求核准
- `after_tool_call` — 觀察工具結果、錯誤與持續時間
- **`tool_result_persist`** — 重寫由工具結果產生的助理訊息
- **`before_message_write`** — 檢查或封鎖進行中的訊息寫入（罕見）

**訊息與傳遞**

- **`inbound_claim`** — 在代理路由前宣告處理入站訊息（合成回覆）
- `message_received` — 觀察入站內容、寄件者、執行緒與中繼資料
- **`message_sending`** — 重寫出站內容或取消傳遞
- `message_sent` — 觀察出站傳遞成功或失敗
- **`before_dispatch`** — 在通道交接前檢查或重寫出站派送
- **`reply_dispatch`** — 參與最終回覆派送管線

**工作階段與 Compaction**

- `session_start` / `session_end` — 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` — 觀察或標註 Compaction 週期
- `before_reset` — 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 協調子代理路由與完成傳遞

**生命週期**

- `gateway_start` / `gateway_stop` — 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` — 觀察 Gateway 擁有的 Cron 生命週期變更（已新增、已更新、已移除、已啟動、已完成、已排程）
- **`before_install`** — 檢查 Skill 或 Plugin 安裝掃描並可選擇封鎖

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驅動的執行中設定），以及診斷用 `ctx.trace`

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
- `params` 會重寫要執行的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准要求使用者確認。`/approve` 命令可同時核准 exec 與 Plugin 核准。
- 較低優先順序的 `block: true` 仍可在較高優先順序掛鉤要求核准後封鎖。
- `onResolution` 會收到已解析的核准決策：`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可以透過 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` 掛鉤之前，以及外部 Plugin 決策之前執行。只將它們用於主機信任的閘門，例如工作區政策、預算強制執行或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` 掛鉤。

### 工具結果持久化

工具結果可以包含結構化的 `details`，用於 UI 算繪、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而不是提示內容：

- OpenClaw 會在提供者重播與 Compaction 輸入前移除 `toolResult.details`，讓中繼資料不會成為模型脈絡。
- 持久化的工作階段項目只保留受限的 `details`。過大的 details 會以精簡摘要取代，並設定 `persistedDetailsTruncated: true`。
- `tool_result_persist` 與 `before_message_write` 會在最終持久化上限前執行。掛鉤仍應讓回傳的 `details` 保持小型，並避免只把與提示相關的文字放在 `details` 中；請將模型可見的工具輸出放在 `content`。

## 提示與模型掛鉤

新 Plugin 請使用特定階段的掛鉤：

- `before_model_resolve`：只接收目前提示與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段取出的任何恰好一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不改變使用者發起回合的背景監控。

`before_agent_start` 保留用於相容性。請優先使用上述明確掛鉤，讓你的 Plugin 不依賴舊版組合階段。

當 OpenClaw 能識別作用中的執行時，`before_agent_start` 與 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 作業 ID），讓 Plugin 掛鉤可將指標、副作用或狀態限定到特定排程作業。

對於源自通道的執行，`ctx.messageProvider` 是提供者介面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 則是在 OpenClaw 可從工作階段鍵或傳遞中繼資料推導時的對話目標識別碼。

`agent_end` 是觀察掛鉤，會在回合結束後以即發即忘方式執行。掛鉤執行器會套用 30 秒逾時，避免卡住的 Plugin 或嵌入端點讓掛鉤 promise 永久擱置。逾時會被記錄，OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則它不會取消 Plugin 擁有的網路工作。

使用 `model_call_started` 與 `model_call_ended` 進行不應接收原始提示、歷史、回應、標頭、請求本文或提供者請求 ID 的提供者呼叫遙測。這些掛鉤包含穩定的中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及 OpenClaw 可推導受限提供者請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在測試框架即將接受自然的最終助理答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。回傳 `{ action: "revise", reason }` 可要求測試框架在定稿前再進行一次模型傳遞，回傳 `{ action:
"finalize", reason? }` 可強制定稿，或省略結果以繼續。Codex 原生 `Stop` 掛鉤會作為 OpenClaw `before_agent_finalize` 決策轉送到此掛鉤。

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

可透過 `plugins.entries.<id>.hooks.allowPromptInjection=false` 針對每個 Plugin 停用會變更提示的掛鉤與持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程 Plugin 可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 相容工作階段狀態，並透過 Gateway `sessions.pluginPatch` 方法更新。工作階段列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 與其他用戶端能在不理解 Plugin 內部細節的情況下算繪 Plugin 擁有的狀態。

當 Plugin 需要讓持久脈絡恰好一次到達下一個模型回合時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示掛鉤前取出已排入佇列的注入、丟棄已過期注入，並依每個 Plugin 的 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見但不應成為永久系統提示文字的命令延續的正確銜接點。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。主機會在 reset/delete/disable 時移除擁有 Plugin 的持久工作階段擴充狀態與待處理的下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼讓 Plugin 釋放舊執行階段世代的排程器作業、執行脈絡與其他頻外資源。

## 訊息掛鉤

使用訊息掛鉤處理通道層級路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、`messageId`、
  `senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於純音訊 TTS 回覆，即使頻道承載內容沒有可見文字/標題，`content` 也可能包含隱藏的語音文字稿。重寫該
`content` 只會更新鉤子可見的文字稿；它不會呈現為媒體標題。

訊息鉤子情境會在可用時公開穩定的關聯欄位：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId`，以及 `ctx.callDepth`。在讀取舊版中繼資料前，請優先使用這些一級欄位。

在使用頻道特定的中繼資料前，請優先使用具型別的 `threadId` 與 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞到較低優先順序的鉤子，除非後續鉤子取消傳遞。

## 安裝鉤子

`before_install` 會在內建掃描 skill 與 Plugin 安裝後執行。回傳額外發現，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

針對需要 Gateway 所擁有狀態的 Plugin 服務，請使用 `gateway_start`。此情境會公開 `ctx.config`、`ctx.workspaceDir`，以及用於檢查與更新 Cron 的 `ctx.getCron?.()`。請使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` 鉤子來執行 Plugin 所擁有的執行階段服務。

`cron_changed` 會在 Gateway 所擁有的 Cron 生命週期事件中觸發，並帶有具型別的事件承載內容，涵蓋 `added`、`updated`、`removed`、`started`、`finished`，以及 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob`
快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的
`state.lastError`），再加上 `PluginHookGatewayCronDeliveryStatus`
的 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段情境中的 `ctx.getCron?.()` 與 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的事實來源。

## 即將停用

一些與鉤子相鄰的介面已被棄用，但仍受到支援。請在下一個主要版本前遷移：

- **純文字頻道信封** 在 `inbound_claim` 與 `message_received`
  處理常式中。請讀取 `BodyForAgent` 與結構化的使用者情境區塊，而不是剖析扁平信封文字。請參閱
  [純文字頻道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留以維持相容性。新的 Plugin 應使用
  `before_model_resolve` 與 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的
  `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

如需完整清單，包括記憶體能力註冊、提供者 thinking
profile、外部驗證提供者、提供者探索類型、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱
[Plugin SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) — 作用中的棄用項目與移除時程
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部鉤子](/zh-TW/automation/hooks)
- [Plugin 架構內部](/zh-TW/plugins/architecture-internals)
