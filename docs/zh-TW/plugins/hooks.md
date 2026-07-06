---
read_when:
    - 你正在建置需要 before_tool_call、before_agent_reply、message hooks 或 lifecycle hooks 的外掛
    - 您需要封鎖、重寫或要求核准來自外掛的工具呼叫
    - 你正在決定要使用內部鉤子還是外掛鉤子
summary: 外掛鉤子：攔截代理、工具、訊息、工作階段與閘道生命週期事件
title: 外掛鉤子
x-i18n:
    generated_at: "2026-07-06T10:51:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d26bd590b880b13843e7a4959a10ccaec11a6d986253123386f34f2ac9a74c
    source_path: plugins/hooks.md
    workflow: 16
---

外掛鉤子是 OpenClaw 外掛的程序內擴充點：檢查或
變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理
路由、安裝，或閘道啟動。

若需要由操作員安裝的小型 `HOOK.md` 指令碼，來回應 `/new`、
`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與閘道事件，
請改用[內部鉤子](/zh-TW/automation/hooks)。

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

處理器會依 `priority` 由高到低依序執行；相同優先順序的處理器
會保留註冊順序。

`api.on(name, handler, opts?)` 接受：

| 選項        | 效果                                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 排序；數值越高越先執行。                                                                                                                                                                      |
| `timeoutMs` | 每個鉤子的預算。設定時，執行器會在預算用盡後中止該處理器並繼續往下，而不是依設定的模型逾時阻塞。省略時會使用執行器預設的每個鉤子逾時。 |

操作員可以設定鉤子預算，而不必修補外掛程式碼：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，後者會覆寫
外掛作者在 `api.on(..., { timeoutMs })` 中設定的值。每個值都必須是
最大 600000 ms 的正整數。對已知較慢的鉤子，請優先使用每個鉤子的覆寫，
避免讓同一個外掛在所有地方都取得更長預算。

每個鉤子都會收到 `event.context.pluginConfig`，也就是註冊該處理器的
外掛已解析設定。OpenClaw 會逐處理器注入它，而不會改動其他外掛可見的
共享事件物件。

## 鉤子目錄

鉤子依其擴充的介面分組。**粗體**名稱接受決策
結果（封鎖、取消、覆寫或要求核准）；其餘僅供
觀察。

**代理回合**

| 鉤子                            | 用途                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 在工作階段訊息載入前覆寫提供者或模型                                                     |
| `agent_turn_prepare`            | 取用佇列中的外掛回合注入，並在提示鉤子前加入同回合內容                                   |
| `before_prompt_build`           | 在模型呼叫前加入動態內容或系統提示文字                                                   |
| `before_agent_start`            | 僅供相容性的合併階段；請優先使用上方兩個鉤子                                             |
| **`before_agent_run`**          | 在送交模型前檢查最終提示與工作階段訊息；可以封鎖該次執行                                 |
| **`before_agent_reply`**        | 以合成回覆或靜默短路模型回合                                                             |
| **`before_agent_finalize`**     | 檢查自然產生的最終回答，並要求再執行一次模型傳遞                                         |
| `agent_end`                     | 觀察最終訊息、成功狀態與執行持續時間                                                     |
| `heartbeat_prompt_contribution` | 為背景監控與生命週期外掛加入僅限心跳偵測的內容                                           |

**對話觀察**

| 鉤子                                      | 用途                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | 經清理的提供者/模型呼叫中繼資料：時間、結果、受限的要求 ID 雜湊。不含提示或回應內容。                              |
| `llm_input`                               | 提供者輸入：系統提示、提示、歷史記錄                                                                                |
| `llm_output`                              | 提供者輸出、使用量，以及可用時已解析的 `contextTokenBudget`                                                         |

**工具**

| 鉤子                       | 用途                                                       |
| -------------------------- | ---------------------------------------------------------- |
| **`before_tool_call`**     | 重寫工具參數、封鎖執行，或要求核准                       |
| `after_tool_call`          | 觀察工具結果、錯誤與持續時間                             |
| `resolve_exec_env`         | 將外掛擁有的環境變數貢獻給 `exec`                         |
| **`tool_result_persist`**  | 重寫由工具結果產生的助理訊息                             |
| **`before_message_write`** | 檢查或封鎖進行中的訊息寫入（少見）                       |

**訊息與遞送**

| 鉤子                            | 用途                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| **`inbound_claim`**             | 在代理路由前認領傳入訊息（合成回覆）                             |
| **`channel_pairing_requested`** | 觀察新建立的私人訊息配對要求                                     |
| `message_received`              | 觀察傳入內容、傳送者、執行緒與中繼資料                           |
| **`message_sending`**           | 重寫傳出內容或取消遞送                                           |
| **`reply_payload_sending`**     | 在遞送前變更或取消正規化的回覆承載                               |
| `message_sent`                  | 觀察傳出遞送成功或失敗                                           |
| **`before_dispatch`**           | 在頻道交接前檢查或重寫傳出分派                                   |
| **`reply_dispatch`**            | 參與最終回覆分派管線                                             |

**工作階段與壓縮**

| 鉤子                                     | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 追蹤工作階段生命週期邊界。`reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。當程序停止或在仍有作用中工作階段時重新啟動，`shutdown`/`restart` 會由閘道關閉終結器觸發，因此外掛（記憶體、逐字稿儲存）可以終結幽靈資料列，而不是讓它們跨重新啟動保持開啟。終結器有界限，因此緩慢的外掛無法阻塞 SIGTERM/SIGINT。 |
| `before_compaction` / `after_compaction` | 觀察或註記壓縮週期                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `before_reset`                           | 觀察工作階段重設事件（`/reset`、程式化重設）                                                                                                                                                                                                                                                                                                                                                                                                                         |

**子代理**

- `subagent_spawned` / `subagent_ended` - 觀察子代理啟動與完成。
- `subagent_delivery_target` - 當沒有核心工作階段繫結可以投射路由時，用於完成遞送的相容性鉤子。
- `subagent_spawning` - 已棄用的相容性鉤子。核心現在會在 `subagent_spawned` 觸發前，透過頻道工作階段繫結配接器準備 `thread: true` 子代理繫結。
- 當 OpenClaw 已在啟動前解析子工作階段的原生模型時，`subagent_spawned` 會包含 `resolvedModel` 和 `resolvedProvider`。
- `subagent_ended` 會攜帶 `targetSessionKey`（身分 - 符合 `subagent_spawned.childSessionKey`）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、選用的 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、選用的 `error`、`runId`、`endedAt`、`accountId` 和 `sendFarewell`。它**不**包含 `agentId` 或 `childSessionKey`；請使用 `targetSessionKey` 關聯相符的 `subagent_spawned` 事件。

**生命週期**

| 鉤子                             | 用途                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | 隨閘道啟動或停止外掛擁有的服務                                                                       |
| `deactivate`                     | `gateway_stop` 的已棄用相容性別名；新外掛請使用 `gateway_stop`                                       |
| `cron_changed`                   | 觀察閘道擁有的排程生命週期變更（新增、更新、移除、啟動、完成、已排程）                              |
| **`before_install`**             | 從已載入的外掛執行階段檢查已暫存的 skill 或外掛安裝材料                                             |

### 頻道配對要求

當外掛需要在未配對的私人訊息傳送者建立待處理配對要求後通知操作員或
寫入稽核記錄時，請使用 `channel_pairing_requested`。鉤子會在要求建立時分派；頻道遞送
配對回覆不會因緩慢或失敗的鉤子處理器而延遲。

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `New ${event.channel} pairing request from ${event.senderId}: ${event.code}`,
  });
});
```

此鉤子僅供觀察。它不會核准、拒絕、抑制或改寫配對回覆。酬載包含頻道、選用的 `accountId`、頻道範圍內的 `senderId`、配對 `code`，以及頻道中繼資料。請將配對代碼視為即時、單次使用的核准憑證，且只傳送到受信任的操作者接收端。請將 `metadata` 視為不受信任、由傳送者提供的身分文字。此鉤子不包含傳入訊息本文或媒體。

## 偵錯執行階段鉤子

使用 `before_model_resolve` 為代理程式回合切換供應商或模型 - 它會在模型解析前執行。`llm_output` 只會在某次模型嘗試產生助理輸出後執行。

若要證明有效的工作階段模型，請檢查執行階段註冊，然後使用 `openclaw sessions` 或 Gateway 工作階段/狀態介面。若要偵錯供應商酬載，請以 `--raw-stream` 和 `--raw-stream-path <path>` 啟動 Gateway，將原始模型串流事件寫入 jsonl 檔案。

## 工具呼叫政策

`before_tool_call` 會接收：

- `event.toolName`
- `event.params`
- 選用的 `event.toolKind` 和 `event.toolInputKind`，這些是主機權威的判別器，用於刻意共用名稱的工具；例如，外層程式碼模式 `exec` 呼叫會使用 `toolKind: "code_mode_exec"`，並在已知輸入語言時包含 `toolInputKind: "javascript" | "typescript"`
- 選用的 `event.derivedPaths`，這是主機盡力推導出的目標路徑提示，用於眾所周知的工具信封，例如 `apply_patch`；這些路徑可能不完整，或比工具實際會觸及的內容更寬泛（例如輸入格式錯誤或不完整時）
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`，以及診斷用 `ctx.trace`

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

型別化生命週期鉤子的防護行為：

- `block: true` 是終端決定，並會略過較低優先順序的處理常式。
- `block: false` 會視為沒有決定。
- `params` 會改寫供執行使用的工具參數。
- `requireApproval` 會暫停代理程式執行，並透過外掛核准向使用者詢問。`/approve` 可以同時核准 exec 和外掛核准。在 Codex app-server 報告模式原生 `PreToolUse` 轉送中，這會讓渡給相符的 app-server 核准請求；請參閱 [Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime#hook-boundaries)。
- 較低優先順序的 `block: true` 仍可在較高優先順序鉤子要求核准後阻擋。
- `onResolution` 會接收已解析的決定：`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

請參閱[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)，了解核准路由、決定行為，以及何時應使用 `requireApproval` 而非選用工具或 exec 核准。

需要主機層級政策的外掛，可以用 `api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般 `before_tool_call` 鉤子和一般鉤子決定之前執行。內建受信任政策最先執行；已安裝外掛的受信任政策接著依外掛載入順序執行；一般 `before_tool_call` 鉤子在它們之後執行。內建外掛保留既有的受信任政策路徑。已安裝外掛必須明確啟用，並在 `contracts.trustedToolPolicies` 中宣告每個政策 id；未宣告的 id 會在註冊前被拒絕。政策 id 的範圍限定於註冊的外掛，因此不同外掛可重複使用相同的本機 id。此層級只應用於主機信任的閘門，例如工作區政策、預算執行，或保留工作流程安全性。

### Exec 環境鉤子

`resolve_exec_env` 讓外掛能在命令執行前，為 `exec` 工具叫用提供環境變數。它會接收：

- `event.sessionKey`
- `event.toolName`，目前一律為 `"exec"`
- `event.host`，為 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- 脈絡欄位，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider` 和 `ctx.channelId`

回傳 `Record<string, string>` 以合併到 exec 環境。處理常式依優先順序執行；較晚的結果會覆寫同一鍵的較早結果。

鉤子輸出在合併前，會先經過主機 exec 環境鍵政策篩選。`PATH` 一律會被捨棄（命令解析和 safe-bin 檢查依賴它）。無效鍵和危險的主機覆寫鍵會被捨棄，例如 `LD_*`、`DYLD_*`、`NODE_OPTIONS`、代理變數（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`），以及 TLS 覆寫變數（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` 與類似項目）。篩選後的外掛 env 會包含在 Gateway 核准/稽核中繼資料中，並轉送至節點主機執行請求。

### 工具結果持久化

工具結果可以包含結構化 `details`，供 UI 呈現、診斷、媒體路由，或外掛擁有的中繼資料使用。請將 `details` 視為執行階段中繼資料，而非提示內容：

- OpenClaw 會在供應商重播和壓縮輸入前移除 `toolResult.details`，讓中繼資料不會成為模型脈絡。
- 持久化的工作階段項目只保留有界限的 `details`。過大的 details 會替換為精簡摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 會在最終持久化上限前執行。請讓回傳的 `details` 保持精簡，並避免只把與提示相關的文字放在 `details` 中；請將模型可見的工具輸出放在 `content`。

## 提示與模型鉤子

新外掛請使用階段專屬鉤子：

- `before_model_resolve`：只接收目前提示和附件中繼資料。回傳 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前提示、已準備的工作階段訊息，以及為此工作階段排空的任何恰好一次佇列注入。回傳 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前提示和工作階段訊息。回傳 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在心跳偵測回合執行，並回傳 `prependContext` 或 `appendContext`。適用於需要摘要目前狀態而不改變使用者發起回合的背景監控器。

`before_agent_start` 保留作為相容性用途。請優先使用上述明確鉤子，讓外掛不依賴舊版合併階段。

`before_agent_run` 會在提示建構後、任何模型輸入前執行，包含提示區域的圖片載入和 `llm_input` 觀察。它會以 `prompt` 接收目前使用者輸入，加上 `messages` 中已載入的工作階段歷史，以及作用中的系統提示。回傳 `{ outcome: "block", reason, message? }` 可在模型讀取提示前停止執行。`reason` 是內部用；`message` 是面向使用者的替代文字。只支援 `pass` 和 `block` 結果；不支援的決定形狀會以關閉方式失敗。

當執行被阻擋時，OpenClaw 只會在 `message.content` 中儲存替代文字，以及非敏感的阻擋中繼資料，例如阻擋外掛 id 和時間戳記。原始使用者文字不會保留在逐字稿或未來脈絡中。內部阻擋原因會視為敏感資訊，並從逐字稿、歷史、廣播、日誌和診斷酬載中排除。可觀測性應使用已清理的欄位，例如阻擋者 id、結果、時間戳記，或安全類別。

當 OpenClaw 可以識別作用中的執行時，`before_agent_start` 和 `agent_end` 會包含 `event.runId`；相同值也會在 `ctx.runId` 上。排程驅動的執行也會在代理程式回合脈絡上公開 `ctx.jobId`（來源排程工作 id），讓鉤子能將指標、副作用或狀態限定到特定排程工作。`ctx.jobId` 不是 `before_tool_call` 工具脈絡的一部分。

對於源自頻道的執行，`ctx.channel` 和 `ctx.messageProvider` 會識別供應商介面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 則是 OpenClaw 可從工作階段鍵或傳送中繼資料推導時的對話目標識別碼。

當傳送者身分可用時，代理程式鉤子脈絡也會包含：

- `ctx.senderId` - 頻道範圍內的傳送者 ID（例如 Feishu `open_id`、Discord 使用者 ID）。當執行源自具有已知傳送者中繼資料的使用者訊息時填入。
- `ctx.chatId` - 傳輸原生對話識別碼（例如 Feishu `chat_id`、Telegram `chat_id`）。當來源頻道提供原生對話 ID 時填入。
- `ctx.channelContext.sender.id` - 與 `ctx.senderId` 相同的傳送者 ID，位於頻道擁有的物件下，外掛可用頻道特定欄位擴充該物件。
- `ctx.channelContext.chat.id` - 與 `ctx.chatId` 相同的對話 ID，位於頻道擁有的物件下，外掛可用頻道特定欄位擴充該物件。

核心只定義巢狀的 `id` 欄位。透過傳入輔助工具傳遞更豐富傳送者或聊天中繼資料的頻道外掛，可以從 `openclaw/plugin-sdk/channel-inbound` 擴充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

頻道外掛會透過傳入 SDK 輔助工具傳遞這些欄位：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

這些欄位是選用的，且在系統來源的執行中不存在（心跳偵測、排程、exec 事件）。

`ctx.senderExternalId` 保留為已棄用的來源相容性欄位，供較舊外掛使用。核心不會填入它；新的頻道特定傳送者身分應透過模組擴充放在 `ctx.channelContext.sender` 下。

`agent_end` 是觀察鉤子。Gateway 和持久化測試框架路徑會在回合後以送出即忘方式執行它，而短生命週期的一次性命令列介面路徑會在程序清理前等待鉤子 promise，讓受信任外掛可以清空終端可觀測性或擷取狀態。鉤子執行器會套用 30 秒逾時，避免卡住的外掛或嵌入端點讓鉤子 promise 永遠維持 pending。逾時會被記錄，OpenClaw 會繼續；除非外掛也使用自己的 abort signal，否則它不會取消外掛擁有的網路工作。

使用 `model_call_started` 和 `model_call_ended` 進行不應接收原始提示、歷史、回應、標頭、請求本文或供應商請求 ID 的供應商呼叫遙測。這些鉤子包含穩定中繼資料，例如 `runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終端 `durationMs`/`outcome`，以及 OpenClaw 可推導出有界供應商請求 ID 雜湊時的 `upstreamRequestIdHash`。當執行階段已解析脈絡視窗中繼資料時，鉤子事件和脈絡也會包含 `contextTokenBudget`，也就是套用模型/設定/代理程式上限後的有效 token 預算；若套用了較低上限，還會包含 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 只會在測試框架即將接受自然產生的最終助理回答時執行。它不是 `/stop` 取消路徑，也不會在使用者中止一個回合時執行。回傳 `{ action: "revise", reason }` 可要求測試框架在最終定稿前再執行一次模型，回傳 `{ action:
"finalize", reason? }` 可強制最終定稿，或省略結果以繼續。Codex 原生 `Stop` hooks 會作為 OpenClaw
`before_agent_finalize` 決策轉送到此 hook。

回傳 `action: "revise"` 時，外掛可以包含 `retry` 中繼資料，讓額外的模型執行有界且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加到傳送給測試框架的修訂原因。`idempotencyKey` 可讓主機針對相同外掛請求，在等價的最終定稿決策之間計算重試次數，而 `maxAttempts` 會限制主機在繼續使用自然產生的最終回答前允許多少次額外執行。

需要原始對話 hooks（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非內建外掛必須設定：

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

可針對每個外掛使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會變更提示詞的 hooks 與持久的下一回合注入。

### 工作階段擴充與下一回合注入

工作流程外掛可以透過 `api.session.state.registerSessionExtension(...)` 持久保存小型 JSON 相容工作階段狀態，並透過閘道 `sessions.pluginPatch` 方法更新。工作階段資料列會透過 `pluginExtensions` 投射已註冊的擴充狀態，讓 Control UI 和其他用戶端能呈現外掛擁有的狀態，而不需要了解外掛內部細節。`api.registerSessionExtension(...)` 仍可運作，但已棄用，建議改用 `api.session.state` 命名空間。

當外掛需要讓持久內容剛好一次抵達下一個模型回合時，請使用 `api.session.workflow.enqueueNextTurnInjection(...)`（頂層的 `api.enqueueNextTurnInjection(...)` 是具有相同行為的已棄用別名）。OpenClaw 會在提示詞 hooks 之前清空佇列中的注入、丟棄已過期的注入，並依每個外掛的 `idempotencyKey` 去重。這是核准恢復、政策摘要、背景監控差異，以及應在下一回合對模型可見但不應成為永久系統提示詞文字的命令延續所適用的接縫。

清理語意是合約的一部分。工作階段擴充清理與執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或 `restart`。主機會在 reset/delete/disable 時移除所屬外掛的持久工作階段擴充狀態與待處理的下一回合注入；restart 會保留持久工作階段狀態，同時清理回呼可讓外掛釋放舊執行階段世代的排程器工作、執行內容與其他頻外資源。

## 訊息 hooks

使用訊息 hooks 進行通道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、`messageId`、`senderId`、選用的執行/工作階段關聯，以及中繼資料。
- `message_sending`：重寫 `content` 或回傳 `{ cancel: true }`。
- `reply_payload_sending`：重寫正規化的 `ReplyPayload` 物件（包含 `presentation`、`delivery`、媒體參照與文字）或回傳 `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗。

對於僅音訊的 TTS 回覆，即使通道承載內容沒有可見文字/字幕，`content` 也可能包含隱藏的口語逐字稿。重寫該 `content` 只會更新 hook 可見的逐字稿；它不會被呈現為媒體字幕。

`reply_payload_sending` 事件可能包含 `usageState`，這是盡力而為的即時單回合模型/用量/內容快照。持久傳遞、復原的重播，以及沒有精確執行關聯的回覆會省略它。

訊息 hook 內容會在可用時公開穩定的關聯欄位：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。傳入與 `before_dispatch` 內容也會在通道具備經可見性篩選的引用訊息資料時公開回覆中繼資料：`replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender` 和 `replyToIsQuote`。讀取舊版中繼資料前，請優先使用這些一級欄位。

使用通道特定中繼資料前，請優先使用具型別的 `threadId` 和 `replyToId` 欄位。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 會被視為沒有決策。
- 重寫後的 `content` 會繼續傳遞給較低優先序的 hooks，除非後續 hook 取消傳遞。
- `reply_payload_sending` 會在承載內容正規化後、通道傳遞前執行，包括路由回原始通道的回覆。處理常式會依序執行，且每個處理常式都會看到較高優先序處理常式產生的最新承載內容。
- `reply_payload_sending` 承載內容不會公開執行階段信任標記，例如 `trustedLocalMedia`；外掛可以編輯承載內容形狀，但不能授予本機媒體信任。
- `message_sending` 可以在取消時回傳 `cancelReason` 和有界的 `metadata`。新的訊息生命週期 API 會將其公開為原因為 `cancelled_by_message_sending_hook` 的已抑制傳遞結果；舊版直接傳遞為了相容性仍會回傳空結果陣列。
- `message_sent` 僅供觀察。處理常式失敗會被記錄，且不會改變傳遞結果。

## 安裝 hooks

使用 `security.installPolicy` 進行由操作者擁有的允許/封鎖決策。該政策會從 OpenClaw 設定執行，涵蓋命令列介面的安裝與更新路徑，並在啟用但無法使用時失敗關閉。

`before_install` 是外掛執行階段生命週期 hook。它只會在外掛 hooks 已載入的 OpenClaw 程序中，於 `security.installPolicy` 之後執行，例如由閘道支援的安裝流程。它適合外掛擁有的觀察、警告與相容性檢查，但不是安裝的主要企業或主機安全邊界。`builtinScan` 欄位會為了相容性保留在事件承載內容中，但 OpenClaw 不再執行內建的安裝時危險程式碼封鎖，因此它是空的 `ok` 結果。回傳其他發現或 `{ block: true, blockReason }` 可停止該程序中的安裝。

`block: true` 是終止決策。`block: false` 會被視為沒有決策。處理常式失敗會以失敗關閉方式封鎖安裝。

## 閘道生命週期

對於需要閘道擁有狀態的外掛服務，請使用 `gateway_start`。內容會公開 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用於檢查與更新排程。使用 `gateway_stop` 清理長時間執行的資源。

不要依賴內部 `gateway:startup` hook 來實作外掛擁有的執行階段服務。

`cron_changed` 會針對閘道擁有的排程生命週期事件觸發，並提供具型別的事件承載內容，涵蓋 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件會攜帶 `PluginHookGatewayCronJob` 快照（包含存在時的 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`）以及 `PluginHookGatewayCronDeliveryStatus`，其值為 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍會攜帶已刪除的工作快照，讓外部排程器可協調狀態。同步外部喚醒排程器時，請使用執行階段內容中的 `ctx.getCron?.()` 和 `ctx.config`，並讓 OpenClaw 作為到期檢查與執行的真實來源。

## 即將棄用

有一些與 hook 相鄰的介面已棄用但仍受支援。請在下一個主要版本前遷移：

- **純文字通道信封**，位於 `inbound_claim` 和 `message_received` 處理常式中。請讀取 `BodyForAgent` 和結構化使用者內容區塊，而不是剖析扁平信封文字。請參閱
  [純文字通道信封 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 會為了相容性保留。新的外掛應使用 `before_model_resolve` 和 `before_prompt_build`，而不是合併階段。
- **`subagent_spawning`** 會為了與較舊外掛相容而保留，但新的外掛不應從中回傳執行緒路由。核心會在 `subagent_spawned` 觸發前，透過通道工作階段繫結配接器準備 `thread: true` 子代理繫結。
- **`deactivate`** 會作為已棄用的清理相容性別名保留到 2026-08-16 之後。新的外掛應使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的 `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** 會作為頂層相容性別名保留。新的外掛應使用
  `api.session.state.registerSessionExtension(...)` 和
  `api.session.workflow.enqueueNextTurnInjection(...)`。

完整清單，包括記憶能力註冊、提供者 thinking 設定檔、外部驗證提供者、提供者探索型別、任務執行階段存取器，以及 `command-auth` → `command-status` 重新命名，請參閱
[外掛 SDK 遷移 → 作用中的棄用項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關

- [外掛 SDK 遷移](/zh-TW/plugins/sdk-migration) - 作用中的棄用項目與移除時間表
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部 hooks](/zh-TW/automation/hooks)
- [外掛架構內部細節](/zh-TW/plugins/architecture-internals)
