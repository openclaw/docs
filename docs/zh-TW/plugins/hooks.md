---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息掛鉤或生命週期掛鉤的 Plugin
    - 你需要封鎖、重寫，或要求核准來自 Plugin 的工具呼叫
    - 在內部鉤子與 Plugin 鉤子之間做選擇
summary: Plugin 掛鉤：攔截代理程式、工具、訊息、工作階段和 Gateway 生命週期事件
title: Plugin 鉤子
x-i18n:
    generated_at: "2026-05-04T18:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks 是 OpenClaw Plugin 的進程內擴充點。當 Plugin 需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝或 Gateway 啟動時，請使用它們。

如果你需要的是一個由操作者安裝的小型 `HOOK.md` 指令碼，用於 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與 Gateway 事件，請改用[內部 hooks](/zh-TW/automation/hooks)。

## 快速開始

從你的 Plugin 入口使用 `api.on(...)` 註冊具型別的 Plugin hooks：

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

Hook 處理常式會依 `priority` 由高到低依序執行。相同優先順序的 hooks 會維持註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 處理常式排序（較高者先執行）。
- `timeoutMs` — 選用的單一 hook 預算。設定後，hook runner 會在預算耗盡後中止該處理常式並繼續下一個，而不是讓緩慢的設定或回憶工作消耗呼叫端設定的模型逾時。省略時會使用 hook runner 通用套用的預設觀察/決策逾時。

操作者也可以不修改 Plugin 程式碼就設定 hook 預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而 `hooks.timeoutMs` 會覆寫 Plugin 作者在 `api.on(..., { timeoutMs })` 設定的值。每個設定值都必須是正整數，且不得大於 600000 毫秒。對已知較慢的 hooks，請優先使用單一 hook 覆寫，避免讓某個 Plugin 到處都取得較長預算。

每個 hook 都會收到 `event.context.pluginConfig`，也就是註冊該處理常式的 Plugin 的已解析設定。當 hook 決策需要目前 Plugin 選項時請使用它；OpenClaw 會逐一處理常式注入此設定，而不會改變其他 Plugin 看到的共享事件物件。

## Hook 目錄

Hooks 依其擴充的表面分組。以**粗體**標示的名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他全部僅供觀察。

**代理回合**

- `before_model_resolve` — 在載入工作階段訊息之前覆寫提供者或模型
- `agent_turn_prepare` — 消耗佇列中的 Plugin 回合注入，並在 prompt hooks 前加入同一回合的脈絡
- `before_prompt_build` — 在模型呼叫前加入動態脈絡或系統提示文字
- `before_agent_start` — 僅供相容性的合併階段；請優先使用上方兩個 hooks
- **`before_agent_reply`** — 使用合成回覆或靜默短路模型回合
- **`before_agent_finalize`** — 檢查自然最終答案並要求再執行一次模型傳遞
- `agent_end` — 觀察最終訊息、成功狀態與執行時間
- `heartbeat_prompt_contribution` — 為背景監視器與生命週期 Plugin 加入僅限 Heartbeat 的脈絡

**對話觀察**

- `model_call_started` / `model_call_ended` — 觀察已清理的提供者/模型呼叫中繼資料、時間、結果，以及有界的請求 ID 雜湊，不包含提示或回應內容
- `llm_input` — 觀察提供者輸入（系統提示、提示、歷史）
- `llm_output` — 觀察提供者輸出

**工具**

- **`before_tool_call`** — 重寫工具參數、封鎖執行或要求核准
- `after_tool_call` — 觀察工具結果、錯誤與持續時間
- **`tool_result_persist`** — 重寫由工具結果產生的助理訊息
- **`before_message_write`** — 檢查或封鎖進行中的訊息寫入（少見）

**訊息與遞送**

- **`inbound_claim`** — 在代理路由前認領入站訊息（合成回覆）
- `message_received` — 觀察入站內容、傳送者、執行緒與中繼資料
- **`message_sending`** — 重寫出站內容或取消遞送
- `message_sent` — 觀察出站遞送成功或失敗
- **`before_dispatch`** — 在通道交接前檢查或重寫出站派送
- **`reply_dispatch`** — 參與最終回覆派送管線

**工作階段與 Compaction**

- `session_start` / `session_end` — 追蹤工作階段生命週期邊界
- `before_compaction` / `after_compaction` — 觀察或標註 Compaction 週期
- `before_reset` — 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 協調子代理路由與完成遞送

**生命週期**

- `gateway_start` / `gateway_stop` — 隨 Gateway 啟動或停止 Plugin 擁有的服務
- `cron_changed` — 觀察 Gateway 擁有的 Cron 生命週期變更（新增、更新、移除、已啟動、已完成、已排程）
- **`before_install`** — 檢查 Skill 或 Plugin 安裝掃描，並可選擇封鎖

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

- `block: true` 是終止性決策，並會跳過較低優先順序的處理常式。
- `block: false` 會視為沒有決策。
- `params` 會重寫執行用的工具參數。
- `requireApproval` 會暫停代理執行，並透過 Plugin 核准向使用者詢問。`/approve` 命令可以核准 exec 與 Plugin 核准。
- 較低優先順序的 `block: true` 仍可在較高優先順序的 hook 要求核准後封鎖。
- `onResolution` 會收到已解析的核准決策 — `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主機層級政策的內建 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` hooks 和外部 Plugin 決策之前執行。請只將它們用於主機信任的閘門，例如工作區政策、預算執行或保留工作流程安全。外部 Plugin 應使用一般 `before_tool_call` hooks。

### 工具結果持久化

工具結果可以包含結構化的 `details`，用於 UI 呈現、診斷、媒體路由或 Plugin 擁有的中繼資料。請將 `details` 視為執行階段中繼資料，而非提示內容：

- OpenClaw 會在提供者重放與 Compaction 輸入前移除 `toolResult.details`，因此中繼資料不會變成模型脈絡。
- 持久化的工作階段項目只會保留有界的 `details`。過大的 details 會被精簡摘要取代，並設定 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限前執行。Hooks 仍應保持回傳的 `details` 精簡，並避免只把與提示相關的文字放在 `details`；請把模型可見的工具輸出放在 `content`。

## 提示與模型 hooks

新 Plugin 請使用特定階段的 hooks：

- `before_model_resolve`：只接收目前提示與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段清空的任何精確一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只會在 Heartbeat 回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不改變使用者啟動回合的背景監視器。

`before_agent_start` 仍保留供相容性使用。請優先使用上方明確的 hooks，避免你的 Plugin 依賴舊版合併階段。

當 OpenClaw 能識別作用中的執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`。相同值也可從 `ctx.runId` 取得。Cron 驅動的執行也會公開 `ctx.jobId`（來源 Cron 工作 ID），讓 Plugin hooks 可以將指標、副作用或狀態限定到特定排程工作。

對於通道來源的執行，`ctx.messageProvider` 是提供者表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 可從工作階段鍵或遞送中繼資料推導時的對話目標識別碼。

`agent_end` 是觀察 hook，會在回合結束後以 fire-and-forget 方式執行。Hook runner 會套用 30 秒逾時，因此卡住的 Plugin 或嵌入端點不能讓 hook promise 永遠保持 pending。逾時會被記錄，OpenClaw 會繼續；除非 Plugin 也使用自己的中止訊號，否則不會取消 Plugin 擁有的網路工作。

對於不應接收原始提示、歷史、回應、標頭、請求本文或提供者請求 ID 的提供者呼叫遙測，請使用 `model_call_started` 與 `model_call_ended`。這些 hooks 包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終止性的 `durationMs`/`outcome`，以及 OpenClaw 可推導出有界提供者請求 ID 雜湊時的 `upstreamRequestIdHash`。

`before_agent_finalize` 只會在 harness 即將接受自然的最終助理答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。回傳 `{ action: "revise", reason }` 可要求 harness 在最終化前再執行一次模型傳遞，回傳 `{ action:
"finalize", reason? }` 可強制最終化，或省略結果以繼續。Codex 原生 `Stop` hooks 會作為 OpenClaw `before_agent_finalize` 決策轉送到這個 hook。

回傳 `action: "revise"` 時，Plugin 可以包含 `retry` 中繼資料，讓額外的模型傳遞有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給 harness 的修訂原因。`idempotencyKey` 讓主機能針對等價的最終化決策，計算同一個 Plugin 請求的重試次數，而 `maxAttempts` 會限制主機在繼續使用自然最終答案前允許多少次額外傳遞。

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

可逐一 Plugin 使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會修改提示的 hooks 與持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程 Plugin 可以透過 `api.registerSessionExtension(...)` 持久化小型 JSON 相容的會話狀態，並透過 Gateway 的 `sessions.pluginPatch` 方法更新。會話列會透過 `pluginExtensions` 投影已註冊的擴充狀態，讓控制 UI 和其他用戶端能夠呈現 Plugin 擁有的狀態，而不需要了解 Plugin 內部實作。

當 Plugin 需要將持久內容精確傳遞到下一次模型回合一次時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示 hooks 之前排出佇列中的注入、丟棄已過期的注入，並依每個 Plugin 的 `idempotencyKey` 進行去重。這是核准恢復、政策摘要、背景監視器差異，以及應在下一回合對模型可見但不應成為永久系統提示文字的命令延續的正確接縫。

清理語意是合約的一部分。會話擴充清理和執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。主機會在 reset/delete/disable 時移除擁有該會話擴充狀態的 Plugin 的持久化狀態與待處理的下一回合注入；restart 會保留持久會話狀態，同時清理回呼讓 Plugin 釋放排程器工作、執行內容，以及舊執行階段世代的其他頻外資源。

## 訊息 hooks

使用訊息 hooks 處理通道層級的路由和傳遞政策：

- `message_received`：觀察傳入內容、寄件者、`threadId`、`messageId`、`senderId`、選用的執行/會話關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使通道承載沒有可見文字/標題，`content` 也可能包含隱藏的語音轉錄。重寫該 `content` 只會更新 hook 可見的轉錄；它不會呈現為媒體標題。

訊息 hook 內容會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在讀取舊版中繼資料之前，優先使用這些一級欄位。

使用通道特定中繼資料之前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止性決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞給較低優先順序的 hooks，除非後續 hook 取消傳遞。

## 安裝 hooks

`before_install` 會在內建 Skills 和 Plugin 安裝掃描之後執行。回傳其他發現，或回傳 `{ block: true, blockReason }` 以停止安裝。

`block: true` 是終止性決策。`block: false` 會被視為沒有決策。

## Gateway 生命週期

對於需要 Gateway 擁有狀態的 Plugin 服務，請使用 `gateway_start`。內容會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用於 Cron 檢查與更新。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` hook 來處理 Plugin 擁有的執行階段服務。

`cron_changed` 會針對 Gateway 擁有的 Cron 生命週期事件觸發，並帶有具型別的事件承載，涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob` 快照（包括存在時的 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`），以及 `PluginHookGatewayCronDeliveryStatus`，其值為 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除工作的快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

## 即將淘汰

少數 hook 相鄰介面已淘汰但仍受支援。請在下一個主要版本之前遷移：

- `inbound_claim` 和 `message_received` 處理常式中的**純文字通道信封**。請讀取 `BodyForAgent` 和結構化使用者內容區塊，而不是解析扁平信封文字。請參閱
  [純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留以維持相容性。新的 Plugin 應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

如需完整清單，包括記憶體能力註冊、提供者思考設定檔、外部驗證提供者、提供者探索型別、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱
[Plugin SDK 遷移 → 作用中的淘汰項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [Plugin SDK 遷移](/zh-TW/plugins/sdk-migration) — 作用中的淘汰項目與移除時間表
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin 進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hooks](/zh-TW/automation/hooks)
- [Plugin 架構內部實作](/zh-TW/plugins/architecture-internals)
