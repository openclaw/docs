---
read_when:
    - 你正在建置一個需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的外掛
    - 你需要封鎖、改寫或要求核准來自外掛的工具呼叫
    - 你正在內部鉤子和外掛鉤子之間做決定
summary: 外掛鉤子：攔截代理、工具、訊息、工作階段與閘道生命週期事件
title: 外掛掛鉤
x-i18n:
    generated_at: "2026-07-05T11:35:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7526c109b1fe07d36cda945d64577c374539f6ccf3f2ba0a99796939aba6dd9a
    source_path: plugins/hooks.md
    workflow: 16
---

外掛鉤子是 OpenClaw 外掛的同處理程序內擴充點：檢查或變更代理程式執行、工具呼叫、訊息流程、工作階段生命週期、子代理程式路由、安裝，或閘道啟動。

若要使用由操作者安裝的小型 `HOOK.md` 指令碼，對 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與閘道事件做出反應，請改用[內部鉤子](/zh-TW/automation/hooks)。

## 快速開始

從外掛進入點使用 `api.on(...)` 註冊具型別的鉤子：

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

處理常式會依 `priority` 由高到低循序執行；相同優先序的處理常式會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

| 選項        | 效果                                                                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 排序；較高者先執行。                                                                                                                                                                  |
| `timeoutMs` | 每個鉤子的預算。設定後，執行器會在預算用完後中止該處理常式並繼續，而不是卡在設定的模型逾時上。省略則使用執行器預設的每個鉤子逾時。 |

操作者可以設定鉤子預算，而不修補外掛程式碼：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而 `hooks.timeoutMs` 會覆寫外掛作者設定的 `api.on(..., { timeoutMs })` 值。每個值都必須是最高 600000 ms 的正整數。對已知較慢的鉤子，優先使用個別鉤子覆寫，避免讓某個外掛在所有地方都取得較長預算。

每個鉤子都會收到 `event.context.pluginConfig`，也就是註冊該處理常式之外掛的已解析設定。OpenClaw 會針對每個處理常式注入它，而不會改變其他外掛看到的共享事件物件。

## 鉤子目錄

鉤子依其擴充的介面分組。**粗體**名稱接受決策結果（封鎖、取消、覆寫或要求核准）；其餘僅供觀察。

**代理程式回合**

| 鉤子                            | 用途                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 在載入工作階段訊息前覆寫提供者或模型                                                     |
| `agent_turn_prepare`            | 消耗排入佇列的外掛回合注入，並在提示鉤子前加入同回合脈絡                                 |
| `before_prompt_build`           | 在模型呼叫前加入動態脈絡或系統提示文字                                                   |
| `before_agent_start`            | 僅供相容性的合併階段；優先使用上方兩個鉤子                                               |
| **`before_agent_run`**          | 在提交給模型前檢查最終提示與工作階段訊息；可封鎖執行                                     |
| **`before_agent_reply`**        | 使用合成回覆或靜默短路模型回合                                                           |
| **`before_agent_finalize`**     | 檢查自然產生的最終答案並要求再進行一次模型傳遞                                           |
| `agent_end`                     | 觀察最終訊息、成功狀態與執行時間                                                         |
| `heartbeat_prompt_contribution` | 為背景監控與生命週期外掛加入僅供心跳偵測使用的脈絡                                       |

**對話觀察**

| 鉤子                                      | 用途                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | 已清理的提供者/模型呼叫中繼資料：時間、結果、有界請求 ID 雜湊。不含提示或回應內容。                     |
| `llm_input`                               | 提供者輸入：系統提示、提示、歷史                                                                         |
| `llm_output`                              | 提供者輸出、用量，以及可用時已解析的 `contextTokenBudget`                                                |

**工具**

| 鉤子                       | 用途                                                   |
| -------------------------- | ------------------------------------------------------ |
| **`before_tool_call`**     | 重寫工具參數、封鎖執行，或要求核准                   |
| `after_tool_call`          | 觀察工具結果、錯誤與耗時                               |
| `resolve_exec_env`         | 向 `exec` 提供外掛擁有的環境變數                       |
| **`tool_result_persist`**  | 重寫由工具結果產生的助理訊息                           |
| **`before_message_write`** | 檢查或封鎖進行中的訊息寫入（少見）                     |

**訊息與傳遞**

| 鉤子                        | 用途                                                           |
| --------------------------- | -------------------------------------------------------------- |
| **`inbound_claim`**         | 在代理程式路由前認領傳入訊息（合成回覆）                     |
| `message_received`          | 觀察傳入內容、傳送者、討論串與中繼資料                       |
| **`message_sending`**       | 重寫傳出內容或取消傳遞                                       |
| **`reply_payload_sending`** | 在傳遞前變更或取消已正規化的回覆承載                         |
| `message_sent`              | 觀察傳出傳遞成功或失敗                                       |
| **`before_dispatch`**       | 在交接給頻道前檢查或重寫傳出派送                             |
| **`reply_dispatch`**        | 參與最終回覆派送管線                                         |

**工作階段與壓縮**

| 鉤子                                     | 用途                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 追蹤工作階段生命週期邊界。`reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。當處理程序在有作用中工作階段時停止或重新啟動，`shutdown`/`restart` 會由閘道關閉終結器觸發，因此外掛（記憶、逐字稿儲存）可以完成幽靈資料列，而不是讓它們跨重新啟動保持開啟。終結器有界限，因此慢速外掛無法阻擋 SIGTERM/SIGINT。 |
| `before_compaction` / `after_compaction` | 觀察或註解壓縮週期                                                                                                                                                                                                                                                                                                                                                                         |
| `before_reset`                           | 觀察工作階段重設事件（`/reset`、程式化重設）                                                                                                                                                                                                                                                                                                                                               |

**子代理程式**

- `subagent_spawned` / `subagent_ended` - 觀察子代理程式啟動與完成。
- `subagent_delivery_target` - 當沒有核心工作階段繫結可投射路由時，用於完成傳遞的相容性鉤子。
- `subagent_spawning` - 已棄用的相容性鉤子。核心現在會在 `subagent_spawned` 觸發前，透過頻道工作階段繫結配接器準備 `thread: true` 子代理程式繫結。
- 當 OpenClaw 已在啟動前解析子工作階段的原生模型時，`subagent_spawned` 會包含 `resolvedModel` 與 `resolvedProvider`。
- `subagent_ended` 攜帶 `targetSessionKey`（身分 - 符合 `subagent_spawned.childSessionKey`）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、選用 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、選用 `error`、`runId`、`endedAt`、`accountId` 與 `sendFarewell`。它**不**包含 `agentId` 或 `childSessionKey`；請使用 `targetSessionKey` 與相符的 `subagent_spawned` 事件建立關聯。

**生命週期**

| 鉤子                             | 用途                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | 隨閘道啟動或停止外掛擁有的服務                                                                   |
| `deactivate`                     | `gateway_stop` 的已棄用相容性別名；在新外掛中使用 `gateway_stop`                                  |
| `cron_changed`                   | 觀察閘道擁有的排程生命週期變更（新增、更新、移除、啟動、完成、已排程）                           |
| **`before_install`**             | 從已載入的外掛執行階段檢查已暫存的技能或外掛安裝材料                                             |

## 偵錯執行階段鉤子

使用 `before_model_resolve` 為代理程式回合切換提供者或模型 - 它會在模型解析前執行。`llm_output` 只會在模型嘗試產生助理輸出後執行。

若要證明有效的工作階段模型，請檢查執行階段註冊，然後使用 `openclaw sessions` 或閘道工作階段/狀態介面。若要偵錯提供者承載，請使用 `--raw-stream` 和 `--raw-stream-path <path>` 啟動閘道，將原始模型串流事件寫入 jsonl 檔案。

## 工具呼叫政策

`before_tool_call` 會收到：

- `event.toolName`
- `event.params`
- 選用的 `event.toolKind` 和 `event.toolInputKind`，是工具的主機權威判別器，適用於刻意共用名稱的工具；例如，外層程式碼模式的 `exec` 呼叫會使用 `toolKind: "code_mode_exec"`，並在輸入語言已知時包含 `toolInputKind: "javascript" | "typescript"`
- 選用的 `event.derivedPaths`，是由主機盡力推導出的目標路徑提示，適用於眾所周知的工具信封，例如 `apply_patch`；這些路徑可能不完整，或過度近似工具實際會觸及的內容（例如輸入格式錯誤或不完整時）
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`，以及診斷用的 `ctx.trace`

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

型別化生命週期鉤子的防護行為：

- `block: true` 是終止性決策，並會略過較低優先順序的處理器。
- `block: false` 會被視為沒有決策。
- `params` 會重寫執行時的工具參數。
- `requireApproval` 會暫停代理執行，並透過外掛核准向使用者詢問。`/approve` 可以同時核准 exec 和外掛核准。在 Codex app-server report-mode 原生 `PreToolUse` 轉送中，這會交由相符的 app-server 核准請求處理；請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#hook-boundaries)。
- 較低優先順序的 `block: true` 仍可在較高優先順序鉤子要求核准後封鎖。
- `onResolution` 會接收已解析的決策：`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

請參閱[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)，了解核准路由、決策行為，以及何時應使用 `requireApproval`，而不是選用工具或 exec 核准。

需要主機層級政策的外掛可以使用 `api.registerTrustedToolPolicy(...)` 註冊受信任工具政策。這些政策會在一般 `before_tool_call` 鉤子之前，以及一般鉤子決策之前執行。內建受信任政策會先執行；已安裝外掛的受信任政策接著依外掛載入順序執行；一般 `before_tool_call` 鉤子會在其後執行。內建外掛會保留現有的受信任政策路徑。已安裝外掛必須明確啟用，並在 `contracts.trustedToolPolicies` 中宣告每個政策 ID；未宣告的 ID 會在註冊前遭到拒絕。政策 ID 會限定於註冊的外掛範圍內，因此不同外掛可以重複使用相同的本機 ID。此層級僅適用於主機信任的閘門，例如工作區政策、預算強制執行，或保留工作流程安全性。

### Exec 環境鉤子

`resolve_exec_env` 讓外掛可以在命令執行前，為 `exec` 工具叫用提供環境變數。它會接收：

- `event.sessionKey`
- `event.toolName`，目前一律為 `"exec"`
- `event.host`，為 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider` 和 `ctx.channelId`

傳回 `Record<string, string>` 以合併進 exec 環境。處理器會依優先順序執行；對於相同鍵，後續結果會覆寫先前結果。

鉤子輸出會先經過主機 exec 環境鍵政策篩選，再進行合併。`PATH` 一律會被移除（命令解析與 safe-bin 檢查依賴它）。無效鍵和危險的主機覆寫鍵也會被移除，例如 `LD_*`、`DYLD_*`、`NODE_OPTIONS`、代理變數（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`），以及 TLS 覆寫變數（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` 及類似項目）。篩選後的外掛 env 會包含在閘道核准/稽核中繼資料中，並轉送至節點主機執行請求。

### 工具結果持久化

工具結果可以包含結構化的 `details`，供 UI 轉譯、診斷、媒體路由或外掛擁有的中繼資料使用。請將 `details` 視為執行階段中繼資料，而非提示內容：

- OpenClaw 會在供應商重播與壓縮輸入之前移除 `toolResult.details`，使中繼資料不會成為模型上下文。
- 持久化的工作階段項目只保留有界限的 `details`。過大的 details 會以精簡摘要取代，並設定 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限之前執行。請讓傳回的 `details` 保持小型，並避免只把提示相關文字放在 `details`；請將模型可見的工具輸出放在 `content`。

## 提示與模型鉤子

新外掛請使用特定階段的鉤子：

- `before_model_resolve`：只接收目前提示和附件中繼資料。傳回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段排出的任何 exactly-once 佇列注入。傳回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示和工作階段訊息。傳回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在心跳偵測回合執行，並傳回 `prependContext` 或 `appendContext`。預期用於需要摘要目前狀態、但不改變使用者發起回合的背景監視器。

`before_agent_start` 仍為相容性保留。請優先使用上述明確鉤子，讓外掛不依賴舊版合併階段。

`before_agent_run` 會在提示建構之後、任何模型輸入之前執行，包括提示本機圖片載入與 `llm_input` 觀察。它會以 `prompt` 接收目前使用者輸入，並在 `messages` 中接收已載入的工作階段歷史，以及作用中的系統提示。傳回 `{ outcome: "block", reason, message? }` 可在模型讀取提示前停止執行。`reason` 為內部用途；`message` 是面向使用者的替代內容。僅支援 `pass` 和 `block` 結果；不支援的決策形狀會失敗關閉。

執行遭封鎖時，OpenClaw 只會在 `message.content` 中儲存替代文字，以及非敏感的封鎖中繼資料，例如封鎖外掛 ID 和時間戳記。原始使用者文字不會保留在逐字稿或未來上下文中。內部封鎖原因會被視為敏感資料，並從逐字稿、歷史、廣播、記錄和診斷酬載中排除。可觀測性應使用已淨化的欄位，例如封鎖者 ID、結果、時間戳記或安全類別。

當 OpenClaw 可以識別作用中執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`；相同值也會出現在 `ctx.runId`。由排程驅動的執行也會在代理回合上下文中公開 `ctx.jobId`（來源排程作業 ID），讓鉤子可以將指標、副作用或狀態限定到特定排程作業。`ctx.jobId` 不是 `before_tool_call` 工具上下文的一部分。

對於源自通道的執行，`ctx.channel` 和 `ctx.messageProvider` 會識別供應商表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 則是在 OpenClaw 可從工作階段鍵或傳遞中繼資料推導時使用的對話目標識別碼。

當傳送者身分可用時，代理鉤子上下文也會包含：

- `ctx.senderId` - 通道範圍的傳送者 ID（例如 Feishu `open_id`、Discord 使用者 ID）。當執行源自具有已知傳送者中繼資料的使用者訊息時填入。
- `ctx.chatId` - 傳輸原生對話識別碼（例如 Feishu `chat_id`、Telegram `chat_id`）。當來源通道提供原生對話 ID 時填入。
- `ctx.channelContext.sender.id` - 與 `ctx.senderId` 相同的傳送者 ID，位於通道擁有的物件下，外掛可使用通道特定欄位擴充該物件。
- `ctx.channelContext.chat.id` - 與 `ctx.chatId` 相同的對話 ID，位於通道擁有的物件下，外掛可使用通道特定欄位擴充該物件。

核心只定義巢狀的 `id` 欄位。透過入站輔助程式傳遞更豐富傳送者或聊天中繼資料的通道外掛，可以從 `openclaw/plugin-sdk/channel-inbound` 擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

通道外掛會透過入站 SDK 輔助程式傳遞這些欄位：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

這些欄位是選用的，且在系統來源的執行中不存在（心跳偵測、排程、exec-event）。

`ctx.senderExternalId` 仍作為較舊外掛的已棄用原始碼相容欄位保留。核心不會填入它；新的通道特定傳送者身分應透過模組擴充置於 `ctx.channelContext.sender` 下。

`agent_end` 是觀察鉤子。閘道和持久 harness 路徑會在回合後以 fire-and-forget 方式執行它，而短生命週期的一次性命令列介面路徑會在程序清理前等待鉤子 promise，讓受信任外掛可以排清終端可觀測性或擷取狀態。鉤子執行器會套用 30 秒逾時，因此卡住的外掛或嵌入端點不會讓鉤子 promise 永久懸而未決。逾時會被記錄，且 OpenClaw 會繼續；除非外掛也使用自己的中止訊號，否則不會取消外掛擁有的網路工作。

對於不應接收原始提示、歷史、回應、標頭、請求主體或供應商請求 ID 的供應商呼叫遙測，請使用 `model_call_started` 和 `model_call_ended`。這些鉤子包含穩定的中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及當 OpenClaw 可以推導出有界限供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。當執行階段已解析上下文視窗中繼資料時，鉤子事件和上下文也會包含 `contextTokenBudget`，也就是模型/設定/代理上限套用後的有效 token 預算；若套用了較低上限，也會包含 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 只會在 harness 即將接受自然的最終助理答案時執行。它不是 `/stop` 取消路徑，也不會在使用者中止回合時執行。傳回 `{ action: "revise", reason }` 可要求 harness 在最終化之前再進行一次模型傳遞；傳回 `{ action: "finalize", reason? }` 可強制最終化；或省略結果以繼續。Codex 原生 `Stop` 鉤子會被轉送為 OpenClaw `before_agent_finalize` 決策。

傳回 `action: "revise"` 時，外掛可以包含 `retry` 中繼資料，讓額外模型傳遞有界限且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給 harness 的修訂原因。`idempotencyKey` 讓主機可以跨等價的 finalize 決策，計算相同外掛請求的重試次數，而 `maxAttempts` 則限制主機在繼續採用自然最終答案之前允許的額外傳遞次數。

需要原始對話鉤子的非內建外掛（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）必須設定：

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

可變更提示的鉤子與持久的下回合注入，可透過 `plugins.entries.<id>.hooks.allowPromptInjection=false` 按外掛停用。

### 會話擴充與下一輪注入

工作流程外掛可以使用
`api.session.state.registerSessionExtension(...)` 持久化小型 JSON 相容會話狀態，並透過
閘道 `sessions.pluginPatch` 方法更新。會話資料列會透過 `pluginExtensions` 投射已註冊的
擴充狀態，讓 Control UI 和其他用戶端無需了解外掛內部實作即可呈現外掛擁有的狀態。
`api.registerSessionExtension(...)` 仍可使用，但已棄用，建議改用
`api.session.state` 命名空間。

當外掛需要讓持久化內容精確地只到達下一次模型回合一次時，請使用
`api.session.workflow.enqueueNextTurnInjection(...)`（頂層
`api.enqueueNextTurnInjection(...)` 是具備相同行為的已棄用別名）。
OpenClaw 會在提示掛鉤之前取出佇列中的注入、丟棄已過期的注入，並依每個外掛的
`idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一輪對模型可見、但不應成為永久系統提示文字的命令延續所適用的正確接縫。

清理語意是合約的一部分。會話擴充清理和執行階段生命週期清理回呼會收到
`reset`、`delete`、`disable` 或
`restart`。主機會在重設/刪除/停用時移除擁有外掛的持久化會話擴充狀態和待處理的下一輪注入；重新啟動會保留持久化會話狀態，同時清理回呼讓外掛為舊的執行階段世代釋放排程器作業、執行內容，以及其他頻外資源。

## 訊息掛鉤

使用訊息掛鉤處理通道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、
  `messageId`、`senderId`、選用的執行/會話關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `reply_payload_sending`：重寫正規化的 `ReplyPayload` 物件
  （包含 `presentation`、`delivery`、媒體參照和文字）或回傳
  `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於純音訊 TTS 回覆，即使通道承載沒有可見文字/標題，`content` 也可能包含隱藏的口說轉錄。
重寫該 `content` 只會更新掛鉤可見的轉錄；它不會被呈現為媒體標題。

`reply_payload_sending` 事件可能包含 `usageState`，這是盡力而為的即時每輪模型/用量/內容快照。
持久傳遞、復原重播，以及沒有精確執行關聯的回覆會省略它。

訊息掛鉤內容會在可用時公開穩定的關聯欄位：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。傳入和
`before_dispatch` 內容也會在通道具有可見性篩選後的引用訊息資料時公開回覆中繼資料：
`replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender` 和
`replyToIsQuote`。讀取舊版中繼資料之前，請優先使用這些一等欄位。

使用通道特定中繼資料之前，請優先使用型別化的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳給較低優先順序的掛鉤，除非後續掛鉤取消傳遞。
- `reply_payload_sending` 會在承載正規化之後、通道傳遞之前執行，包括路由回原始通道的回覆。
  處理常式會依序執行，且每個處理常式都會看到較高優先順序處理常式產生的最新承載。
- `reply_payload_sending` 承載不會公開執行階段信任標記，例如
  `trustedLocalMedia`；外掛可以編輯承載形狀，但不能授予本機媒體信任。
- `message_sending` 可以在取消時回傳 `cancelReason` 和有界的 `metadata`。
  新的訊息生命週期 API 會將其公開為原因為 `cancelled_by_message_sending_hook` 的已抑制傳遞結果；舊版直接傳遞會為了相容性繼續回傳空結果陣列。
- `message_sent` 僅供觀察。處理常式失敗會被記錄，但不會改變傳遞結果。

## 安裝掛鉤

使用 `security.installPolicy` 處理由操作者掌控的允許/封鎖決策。該政策從 OpenClaw 設定執行，涵蓋命令列介面的安裝與更新路徑，並在已啟用但無法使用時採取失敗封閉策略。

`before_install` 是外掛執行階段生命週期掛鉤。它只會在外掛掛鉤已載入的 OpenClaw 程序中，於
`security.installPolicy` 之後執行，例如由閘道支援的安裝流程。它適合外掛擁有的觀察、警告和相容性檢查，但不是安裝的主要企業或主機安全邊界。
`builtinScan` 欄位仍會保留在事件承載中以維持相容性，但 OpenClaw 不再執行內建的安裝時危險程式碼封鎖，因此它是空的 `ok` 結果。回傳額外發現項目或
`{ block: true, blockReason }` 可在該程序中停止安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。處理常式失敗會以失敗封閉方式封鎖安裝。

## 閘道生命週期

對需要閘道擁有狀態的外掛服務使用 `gateway_start`。內容會公開
`ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，供排程檢查與更新使用。
使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` 掛鉤來提供外掛擁有的執行階段服務。

`cron_changed` 會針對閘道擁有的排程生命週期事件觸發，並帶有型別化事件承載，涵蓋
`added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶
`PluginHookGatewayCronJob` 快照（包含 `state.nextRunAtMs`、`state.lastRunStatus`，以及存在時的
`state.lastError`），加上一個 `PluginHookGatewayCronDeliveryStatus`：
`not-requested` | `delivered` | `not-delivered` | `unknown`。已移除事件仍會攜帶被刪除的作業快照，讓外部排程器可以協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的
`ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

## 即將棄用

有幾個與掛鉤相鄰的介面已棄用但仍受支援。請在下一個主要版本之前遷移：

- **純文字通道信封**，位於 `inbound_claim` 和 `message_received`
  處理常式中。請讀取 `BodyForAgent` 和結構化使用者內容區塊，而不是剖析扁平信封文字。請參閱
  [純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 會為了相容性保留。新外掛應使用
  `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`subagent_spawning`** 會為了與較舊外掛相容而保留，但新外掛不應從中回傳對話串路由。
  核心會在 `subagent_spawned` 觸發之前，透過通道會話繫結配接器準備
  `thread: true` 子代理繫結。
- **`deactivate`** 會作為已棄用的清理相容性別名保留到
  2026-08-16 之後。新外掛應使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 現在使用型別化的
  `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** 會保留為頂層相容性別名。
  新外掛應使用
  `api.session.state.registerSessionExtension(...)` 和
  `api.session.workflow.enqueueNextTurnInjection(...)`。

完整清單包括記憶體能力註冊、提供者思考設定檔、外部驗證提供者、提供者探索型別、任務執行階段存取器，以及
`command-auth` → `command-status` 重新命名，請參閱
[外掛 SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [外掛 SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時程
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部掛鉤](/zh-TW/automation/hooks)
- [外掛架構內部機制](/zh-TW/plugins/architecture-internals)
