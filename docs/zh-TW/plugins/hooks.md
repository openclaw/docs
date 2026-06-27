---
read_when:
    - 你正在建置需要 before_tool_call、before_agent_reply、訊息掛鉤或生命週期掛鉤的外掛
    - 你需要對來自外掛的工具呼叫進行封鎖、重寫，或要求核准。
    - 你正在內部掛鉤與外掛掛鉤之間做決定
summary: 外掛鉤子：攔截代理、工具、訊息、工作階段與閘道生命週期事件
title: 外掛鉤子
x-i18n:
    generated_at: "2026-06-27T19:37:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

外掛鉤子是 OpenClaw 外掛的處理序內擴充點。當外掛需要檢查或變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理路由、安裝，或閘道啟動時，請使用它們。

如果你想要的是一個由操作員安裝的小型 `HOOK.md` 指令稿，用於 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與閘道事件，請改用[內部鉤子](/zh-TW/automation/hooks)。

## 快速開始

從你的外掛入口使用 `api.on(...)` 註冊具型別的外掛鉤子：

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

鉤子處理器會依 `priority` 由高到低依序執行。相同優先順序的鉤子會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 處理器排序（數值較高者先執行）。
- `timeoutMs` - 選用的單一鉤子預算。設定後，鉤子執行器會在預算用盡後中止該處理器並繼續下一個，而不是讓緩慢的設定或回想工作耗盡呼叫端設定的模型逾時。省略時，會使用鉤子執行器通用套用的預設觀察/決策逾時。

操作員也可以不修補外掛程式碼就設定鉤子預算：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而 `hooks.timeoutMs` 會覆寫外掛作者在 `api.on(..., { timeoutMs })` 設定的值。每個已設定的值都必須是正整數，且不得大於 600000 毫秒。已知較慢的鉤子應優先使用單一鉤子覆寫，避免讓某個外掛在所有地方都取得較長預算。

每個鉤子都會收到 `event.context.pluginConfig`，也就是註冊該處理器之外掛的已解析設定。需要目前外掛選項來進行鉤子決策時請使用它；OpenClaw 會逐一處理器注入它，且不會改動其他外掛看到的共用事件物件。

## 鉤子目錄

鉤子依其擴充的介面分組。以**粗體**標示的名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其他所有鉤子都僅供觀察。

**代理回合**

- `before_model_resolve` - 在載入工作階段訊息前覆寫提供者或模型
- `agent_turn_prepare` - 在提示鉤子之前，消耗已佇列的外掛回合注入並加入同回合脈絡
- `before_prompt_build` - 在模型呼叫前加入動態脈絡或系統提示文字
- `before_agent_start` - 僅供相容性的合併階段；請優先使用上方兩個鉤子
- **`before_agent_run`** - 在提交模型前檢查最終提示與工作階段訊息，並可選擇封鎖該執行
- **`before_agent_reply`** - 用合成回覆或靜默短路模型回合
- **`before_agent_finalize`** - 檢查自然的最終回答並要求再執行一次模型
- `agent_end` - 觀察最終訊息、成功狀態與執行時間
- `heartbeat_prompt_contribution` - 為背景監視器與生命週期外掛加入僅限心跳偵測的脈絡

**對話觀察**

- `model_call_started` / `model_call_ended` - 觀察已清理的提供者/模型呼叫中繼資料、計時、結果，以及有界的請求 ID 雜湊，不含提示或回應內容
- `llm_input` - 觀察提供者輸入（系統提示、提示、歷史）
- `llm_output` - 觀察提供者輸出、用量，以及可用時已解析的 `contextTokenBudget`

**工具**

- **`before_tool_call`** - 重寫工具參數、封鎖執行或要求核准
- `after_tool_call` - 觀察工具結果、錯誤與持續時間
- `resolve_exec_env` - 將外掛擁有的環境變數貢獻給 `exec`
- **`tool_result_persist`** - 重寫由工具結果產生的助理訊息
- **`before_message_write`** - 檢查或封鎖進行中的訊息寫入（少見）

**訊息與傳遞**

- **`inbound_claim`** - 在代理路由前認領傳入訊息（合成回覆）
- `message_received` — 觀察傳入內容、寄件者、討論串與中繼資料
- **`message_sending`** — 重寫傳出內容或取消傳遞
- **`reply_payload_sending`** — 在傳遞前改動或取消正規化的回覆承載
- `message_sent` — 觀察傳出傳遞成功或失敗
- **`before_dispatch`** - 在交付給通道前檢查或重寫傳出派送
- **`reply_dispatch`** - 參與最終回覆派送管線

**工作階段與壓縮**

- `session_start` / `session_end` - 追蹤工作階段生命週期邊界。事件的 `reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。當工作階段仍處於作用中而處理序被停止或重新啟動時，`shutdown` 與 `restart` 值會從閘道關閉最終處理器觸發，因此下游外掛（例如記憶體或逐字稿儲存）可以完成原本會在重新啟動之間留在開啟狀態的幽靈列。最終處理器有界，因此緩慢的外掛無法阻塞 SIGTERM/SIGINT。
- `before_compaction` / `after_compaction` - 觀察或註解壓縮週期
- `before_reset` - 觀察工作階段重設事件（`/reset`、程式化重設）

**子代理**

- `subagent_spawned` / `subagent_ended` - 觀察子代理啟動與完成。
- `subagent_delivery_target` - 當沒有核心工作階段繫結可以投射路由時，用於完成傳遞的相容性鉤子。
- `subagent_spawning` - 已棄用的相容性鉤子。核心現在會在 `subagent_spawned` 觸發前，透過通道工作階段繫結介面卡準備 `thread: true` 子代理繫結。
- 當 OpenClaw 已在啟動前解析子工作階段的原生模型時，`subagent_spawned` 會包含 `resolvedModel` 與 `resolvedProvider`。
- `subagent_ended` 會攜帶 `targetSessionKey`（身分識別 — 這會符合 `subagent_spawned.childSessionKey`）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、選用的 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、選用的 `error`、`runId`、`endedAt`、`accountId` 與 `sendFarewell`。它**不會**包含 `agentId` 或 `childSessionKey`；請使用 `targetSessionKey` 與對應的 `subagent_spawned` 事件建立關聯。

**生命週期**

- `gateway_start` / `gateway_stop` - 隨閘道啟動或停止外掛擁有的服務
- `deactivate` - `gateway_stop` 的已棄用相容性別名；新外掛請使用 `gateway_stop`
- `cron_changed` - 觀察閘道擁有的排程生命週期變更（已新增、已更新、已移除、已啟動、已完成、已排程）
- **`before_install`** - 從已載入的外掛執行階段檢查暫存的技能或外掛安裝材料

## 偵錯執行階段鉤子

當外掛需要為代理回合切換提供者或模型時，請使用 `before_model_resolve`。它會在模型解析前執行；`llm_output` 只會在模型嘗試產生助理輸出後執行。

若要證明有效的工作階段模型，請先檢查執行階段註冊，然後使用 `openclaw sessions` 或閘道工作階段/狀態介面。偵錯提供者承載時，使用 `--raw-stream` 與 `--raw-stream-path <path>` 啟動閘道；這些旗標會將原始模型串流事件寫入 jsonl 檔案。

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.toolKind` 與 `event.toolInputKind`，也就是主機權威的鑑別欄位，用於刻意共用名稱的工具；例如，外層程式碼模式 `exec` 呼叫會使用 `toolKind: "code_mode_exec"`，並在輸入語言已知時包含 `toolInputKind: "javascript" | "typescript"`
- 選用的 `event.derivedPaths`，包含主機盡力推導出的目標路徑提示，用於 `apply_patch` 等已知工具封套；存在時，這些路徑可能不完整，或可能過度估計工具實際會觸及的內容（例如格式錯誤或部分輸入）
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在排程驅動的執行上設定）、`ctx.toolKind`、`ctx.toolInputKind` 與診斷用 `ctx.trace`

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

具型別生命週期鉤子的鉤子防護行為：

- `block: true` 是終止決策，會略過較低優先順序的處理器。
- `block: false` 會視為沒有決策。
- `params` 會重寫工具執行用參數。
- `requireApproval` 會暫停代理執行，並透過外掛核准向使用者詢問。`/approve` 命令可以核准 exec 與外掛核准。在 Codex app-server report-mode 原生 `PreToolUse` 轉送中，這會延後到相符的 app-server 核准請求；請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#hook-boundaries)。
- 較低優先順序的 `block: true` 仍可在較高優先順序的鉤子要求核准後封鎖。
- `onResolution` 會收到已解析的核准決策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

請參閱[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)，了解核准路由、決策行為，以及何時應使用 `requireApproval` 而非選用工具或 exec 核准。

需要主機層級政策的外掛可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任工具政策。這些政策會在一般 `before_tool_call` 鉤子與一般鉤子決策之前執行。內建受信任政策會先執行；已安裝外掛的受信任政策接著依外掛載入順序執行；一般 `before_tool_call` 鉤子則在它們之後執行。內建外掛保留既有的受信任政策路徑。已安裝外掛必須明確啟用，且必須在 `contracts.trustedToolPolicies` 宣告每個政策 ID；未宣告的 ID 會在註冊前遭拒。政策 ID 的範圍限定於註冊外掛，因此不同外掛可以重複使用相同的本機 ID。此層級只應用於主機信任的閘門，例如工作區政策、預算執行或保留工作流程安全性。

### Exec 環境鉤子

`resolve_exec_env` 讓外掛可在基礎 exec 環境建立後、命令執行前，將環境變數貢獻給 `exec` 工具叫用。它會收到：

- `event.sessionKey`
- `event.toolName`，目前一律為 `"exec"`
- `event.host`，為 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider` 與 `ctx.channelId`

回傳 `Record<string, string>` 以合併到 exec 環境中。處理器會依優先順序執行，而對於相同鍵，後續鉤子結果會覆寫較早鉤子結果。

Hook 輸出會先經過主機執行環境金鑰政策篩選，再進行合併。無效金鑰、`PATH`，以及危險的主機覆寫金鑰（例如 `LD_*`、`DYLD_*`、`NODE_OPTIONS`、代理變數與 TLS 覆寫變數）都會被丟棄。篩選後的外掛環境會包含在閘道核准/稽核中繼資料中，並轉送至 node-host 執行請求。

### 工具結果持久化

工具結果可以包含結構化的 `details`，供 UI 轉譯、診斷、媒體路由或外掛擁有的中繼資料使用。請將 `details` 視為執行階段中繼資料，而不是提示內容：

- OpenClaw 會在供應商重播與壓縮輸入前移除 `toolResult.details`，讓中繼資料不會成為模型脈絡。
- 持久化的工作階段項目只會保留有界的 `details`。過大的 details 會被替換為精簡摘要與 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限之前執行。鉤子仍應讓回傳的 `details` 保持精簡，並避免把與提示相關的文字只放在 `details` 中；請把模型可見的工具輸出放在 `content` 中。

## 提示與模型鉤子

新外掛請使用階段專用鉤子：

- `before_model_resolve`：只接收目前提示與附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備好的工作階段訊息，以及任何針對此工作階段排空、恰好一次的佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示與工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在心跳偵測回合執行，並回傳 `prependContext` 或 `appendContext`。它適用於需要摘要目前狀態、但不改變使用者發起回合的背景監控器。

`before_agent_start` 仍保留供相容性使用。請優先使用上述明確鉤子，讓你的外掛不依賴舊版合併階段。

`before_agent_run` 會在提示建構後、任何模型輸入之前執行，包括提示本地圖片載入與 `llm_input` 觀察。它會以 `prompt` 接收目前使用者輸入，並透過 `messages` 接收已載入的工作階段歷史，以及目前啟用中的系統提示。回傳 `{ outcome: "block", reason, message? }` 可在模型讀取提示前停止執行。`reason` 是內部用；`message` 是面向使用者的替代文字。唯一支援的結果是 `pass` 和 `block`；不支援的決策形狀會以關閉方式失敗。

當某次執行被封鎖時，OpenClaw 只會在 `message.content` 中儲存替代文字，以及非敏感的封鎖中繼資料，例如執行封鎖的外掛 id 和時間戳記。原始使用者文字不會保留在逐字稿或未來脈絡中。內部封鎖原因會被視為敏感資訊，並排除在逐字稿、歷史、廣播、日誌與診斷酬載之外。可觀測性應使用已清理的欄位，例如封鎖者 id、結果、時間戳記或安全類別。

當 OpenClaw 能識別作用中的執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`。相同值也可在 `ctx.runId` 取得。由排程驅動的執行也會公開 `ctx.jobId`（來源排程工作 id），讓外掛鉤子可以將指標、副作用或狀態限定到特定排程工作。

對於由頻道發起的執行，`ctx.channel` 和 `ctx.messageProvider` 會識別供應商介面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 則是在 OpenClaw 能從工作階段金鑰或遞送中繼資料推導時的對話目標識別碼。

當寄件者身分可用時，代理鉤子脈絡也會包含：

- `ctx.senderId` — 頻道範圍內的寄件者 ID（例如 Feishu `open_id`、Discord 使用者 ID）。當執行源自具有已知寄件者中繼資料的使用者訊息時填入。
- `ctx.chatId` — 傳輸原生對話識別碼（例如 Feishu `chat_id`、Telegram `chat_id`）。當來源頻道提供原生對話 ID 時填入。
- `ctx.channelContext.sender.id` — 與 `ctx.senderId` 相同的寄件者 ID，位於頻道擁有的物件下，外掛可用頻道特定欄位擴充該物件。
- `ctx.channelContext.chat.id` — 與 `ctx.chatId` 相同的對話 ID，位於頻道擁有的物件下，外掛可用頻道特定欄位擴充該物件。

核心只定義巢狀的 `id` 欄位。透過入站輔助工具傳遞更豐富寄件者或聊天中繼資料的頻道外掛，可以從 `openclaw/plugin-sdk/channel-inbound` 擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

頻道外掛會透過入站 SDK 輔助工具傳遞這些欄位：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

這些欄位是選用的，且在系統發起的執行（心跳偵測、排程、exec-event）中不存在。

`ctx.senderExternalId` 仍作為舊外掛的已棄用來源相容性欄位保留。核心不會填入它；新的頻道特定寄件者身分應透過模組擴充放在 `ctx.channelContext.sender` 下。

`agent_end` 是觀察鉤子。閘道與持久化 harness 路徑會在回合結束後以 fire-and-forget 方式執行它，而短生命週期的一次性命令列介面路徑會在程序清理前等待鉤子 promise，讓受信任的外掛能清空終端可觀測性或擷取狀態。鉤子執行器會套用 30 秒逾時，讓卡住的外掛或嵌入端點不會讓鉤子 promise 永久保持 pending。逾時會被記錄，而 OpenClaw 會繼續；它不會取消外掛擁有的網路工作，除非該外掛也使用自己的中止訊號。

請使用 `model_call_started` 和 `model_call_ended` 來處理不應接收原始提示、歷史、回應、標頭、請求本文或供應商請求 ID 的供應商呼叫遙測。這些鉤子包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及當 OpenClaw 能推導有界供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。當執行階段已解析脈絡視窗中繼資料時，鉤子事件與脈絡也會包含 `contextTokenBudget`，也就是套用模型/設定/代理上限後的有效 token 預算；當套用了較低上限時，還會包含 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 只會在 harness 即將接受自然的最終助理回答時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。回傳 `{ action: "revise", reason }` 可要求 harness 在最終化前再執行一次模型傳遞，回傳 `{ action:
"finalize", reason? }` 可強制最終化，或省略結果以繼續。Codex 原生 `Stop` 鉤子會轉送為此鉤子中的 OpenClaw `before_agent_finalize` 決策。

回傳 `action: "revise"` 時，外掛可以包含 `retry` 中繼資料，讓額外模型傳遞有界且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給 harness 的修訂原因。`idempotencyKey` 可讓主機針對跨等效最終化決策的相同外掛請求計算重試次數，而 `maxAttempts` 會限制主機在繼續使用自然最終答案前允許多少次額外傳遞。

需要原始對話鉤子（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非內建外掛必須設定：

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

可依外掛透過 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用提示變更鉤子與持久下一回合注入。

### 工作階段擴充與下一回合注入

工作流程外掛可以透過 `api.registerSessionExtension(...)` 持久化小型 JSON 相容工作階段狀態，並透過閘道 `sessions.pluginPatch` 方法更新它。工作階段列會透過 `pluginExtensions` 投影已註冊的擴充狀態，讓 Control UI 和其他用戶端能轉譯外掛擁有的狀態，而不需要了解外掛內部實作。

當外掛需要讓持久脈絡恰好一次抵達下一個模型回合時，請使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 會在提示鉤子前排空佇列注入、丟棄過期注入，並依每個外掛的 `idempotencyKey` 去重。這是適合核准續接、政策摘要、背景監控增量，以及應在下一回合對模型可見、但不應成為永久系統提示文字的命令延續的介面。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會接收 `reset`、`delete`、`disable` 或 `restart`。對於 reset/delete/disable，主機會移除擁有該資料之外掛的持久工作階段擴充狀態與待處理下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼讓外掛能釋放舊執行階段世代的排程器工作、執行脈絡與其他頻外資源。

## 訊息鉤子

使用訊息鉤子處理頻道層級路由與遞送政策：

- `message_received`：觀察入站內容、寄件者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：改寫 `content` 或回傳 `{ cancel: true }`。
- `reply_payload_sending`：改寫正規化的 `ReplyPayload` 物件（包括 `presentation`、`delivery`、媒體 refs 與文字）或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使頻道酬載沒有可見文字/標題，`content` 也可能包含隱藏的口語逐字稿。改寫該 `content` 只會更新鉤子可見的逐字稿；它不會轉譯為媒體標題。

`reply_payload_sending` 事件可能包含 `usageState`，這是盡力而為的即時每回合模型/用量/脈絡快照。持久遞送、復原重播，以及沒有精確執行關聯的回覆會省略它。

訊息鉤子脈絡在可用時會公開穩定關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。當頻道具有經可見性篩選的引用訊息資料時，入站與 `before_dispatch` 脈絡也會公開回覆中繼資料：`replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender` 和 `replyToIsQuote`。在讀取舊版中繼資料前，請優先使用這些一級欄位。

在使用頻道特定中繼資料前，請優先使用型別化的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止狀態。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳給較低優先順序的鉤子，除非後續鉤子
  取消傳送。
- `reply_payload_sending` 會在承載資料正規化之後、通道傳送之前執行，
  包括路由回原始通道的回覆。處理常式會依序執行，且每個處理常式都會看到
  較高優先順序處理常式產生的最新承載資料。
- `reply_payload_sending` 承載資料不會公開執行階段信任標記，例如
  `trustedLocalMedia`；外掛可以編輯承載資料形狀，但不能授予本機
  媒體信任。
- `message_sending` 可以在取消時回傳 `cancelReason` 和有界的 `metadata`。
  新的訊息生命週期 API 會將其公開為原因為 `cancelled_by_message_sending_hook`
  的已抑制傳送結果；舊版直接傳送為了相容性，會繼續回傳空的結果陣列。
- `message_sent` 僅供觀察。處理常式失敗會被記錄，但不會
  變更傳送結果。

## 安裝鉤子

使用 `security.installPolicy` 處理由操作員擁有的允許/封鎖決策。該
政策從 OpenClaw 設定執行，涵蓋命令列介面安裝與更新路徑，並且在啟用但不可用時
以關閉方式失敗。

`before_install` 是外掛執行階段生命週期鉤子。它只會在外掛鉤子
已載入的 OpenClaw 程序中，於 `security.installPolicy` 之後執行，
例如由閘道支援的安裝流程。它適用於
外掛擁有的觀察、警告和相容性檢查，但不是
安裝的主要企業或主機安全邊界。`builtinScan`
欄位為了相容性仍保留在事件承載資料中，但 OpenClaw 不再
執行內建安裝時危險程式碼封鎖，因此它是空的 `ok`
結果。回傳其他發現或 `{ block: true, blockReason }` 可在該程序中停止
安裝。

`block: true` 是終止狀態。`block: false` 會被視為沒有決策。
處理常式失敗會封鎖安裝，並以關閉方式失敗。

## 閘道生命週期

對需要閘道擁有狀態的外掛服務使用 `gateway_start`。
該內容會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 以供
排程檢查與更新。使用 `gateway_stop` 清理長時間執行的
資源。

不要依賴內部 `gateway:startup` 鉤子來執行外掛擁有的執行階段
服務。

`cron_changed` 會針對閘道擁有的排程生命週期事件觸發，並帶有涵蓋
`added`、`updated`、`removed`、`started`、`finished`
和 `scheduled` 原因的型別化事件承載資料。事件會攜帶
`PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，
以及存在時的 `state.lastError`）加上
`not-requested` | `delivered` | `not-delivered` | `unknown` 的
`PluginHookGatewayCronDeliveryStatus`。移除事件仍會攜帶已刪除的工作快照，
讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段
內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為
到期檢查與執行的真實來源。

## 即將淘汰的項目

部分與鉤子相鄰的介面已淘汰但仍受支援。請在下一個主要版本前
遷移：

- **純文字通道信封** 位於 `inbound_claim` 和 `message_received`
  處理常式中。請讀取 `BodyForAgent` 和結構化的使用者內容區塊，
  而不是解析扁平信封文字。請參閱
  [純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 為了相容性仍會保留。新的外掛應使用
  `before_model_resolve` 和 `before_prompt_build`，而不是合併的
  階段。
- **`subagent_spawning`** 為了與較舊外掛相容仍會保留，但
  新外掛不應從中回傳執行緒路由。核心會在 `subagent_spawned`
  觸發前，透過通道工作階段繫結配接器準備 `thread: true` 子代理繫結。
- **`deactivate`** 會作為已淘汰的清理相容別名保留到
  2026-08-16 之後。新的外掛應使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 現在使用型別化的
  `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

完整清單，包括記憶體能力註冊、供應商思考
設定檔、外部驗證供應商、供應商探索型別、任務執行階段
存取子，以及 `command-auth` → `command-status` 重新命名，請參閱
[外掛 SDK 遷移 → 作用中的淘汰項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [外掛 SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的淘汰項目與移除時程
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部鉤子](/zh-TW/automation/hooks)
- [外掛架構內部細節](/zh-TW/plugins/architecture-internals)
