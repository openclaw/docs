---
read_when:
    - 你正在建置需要 before_tool_call、before_agent_reply、訊息鉤子或生命週期鉤子的外掛
    - 你需要封鎖、改寫或要求核准外掛的工具呼叫
    - 你正在內部鉤子與外掛鉤子之間做選擇
    - 你正在將 OpenClaw 排程喚醒事件投射至外部主機排程器
summary: 外掛掛鉤：攔截代理程式、工具、訊息、工作階段及閘道生命週期事件
title: 外掛鉤子
x-i18n:
    generated_at: "2026-07-12T14:39:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

外掛掛鉤是 OpenClaw 外掛的程序內擴充點：可檢查或
變更代理執行、工具呼叫、訊息流程、工作階段生命週期、子代理
路由、安裝或閘道啟動。

若要使用由操作者安裝的小型 `HOOK.md` 指令碼，回應 `/new`、
`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令與閘道事件，
請改用[內部掛鉤](/zh-TW/automation/hooks)。

## 快速開始

從外掛進入點使用 `api.on(...)` 註冊具型別的掛鉤：

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

可以傳回決策或修改的處理常式會依 `priority` 由高至低循序執行；
優先順序相同的處理常式維持註冊順序。僅供觀察的處理常式會平行執行，
且即發即棄的觀察分派可能與後續事件重疊。請勿使用優先順序安排
觀察副作用的順序。

`api.on(name, handler, opts?)` 接受：

| 選項        | 效果                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 排序；數值較高者先執行。                                                                                                                                                                      |
| `timeoutMs` | 每個掛鉤的等待時間配額。到期時，OpenClaw 會停止等待該處理常式並繼續執行。這不會取消處理常式或其副作用。省略時，會使用執行器預設的每掛鉤逾時時間。 |

操作者可以設定掛鉤時間配額，而不必修補外掛程式碼：

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

`hooks.timeouts.<hookName>` 會覆寫 `hooks.timeoutMs`，而後者會覆寫
外掛撰寫的 `api.on(..., { timeoutMs })` 值。每個值都必須是
不超過 600000 ms 的正整數。對已知較慢的掛鉤，應優先使用個別掛鉤覆寫，
以免某個外掛在所有位置都取得較長的時間配額。

逾時的處理常式 Promise 會繼續執行，因為掛鉤回呼不會
收到取消訊號。掛鉤分派可在該外掛工作仍在進行時，
釋放其閘道准入。擁有長時間執行工作的外掛必須
自行提供取消與關閉生命週期。

外送修改掛鉤 `message_sending` 和 `reply_payload_sending` 對每個處理常式
預設為 15 秒。如果其中一個逾時，OpenClaw 會記錄外掛錯誤，
並使用最新的承載資料繼續執行，讓序列化傳遞通道得以結束。
對於刻意在傳遞前執行較慢工作的外掛，請設定較大的個別掛鉤時間配額。

使用 `createReplyDispatcher` 的頻道外掛同樣可以透過
`beforeDeliverOptions: { timeoutMs }` 宣告較大的正數個別階段時間配額，
或在使用 `dispatcher.appendBeforeDeliver(handler, { timeoutMs })` 附加工作時宣告。
若擁有者未宣告時間配額，這些回呼會使用相同的 15 秒預設值，
避免卡住的回呼持續占用序列化傳遞通道。

每個掛鉤都會收到 `event.context.pluginConfig`，也就是為註冊該處理常式的
外掛解析出的設定。OpenClaw 會針對每個處理常式注入此設定，
而不會改變其他外掛所看到的共用事件物件。

## 掛鉤目錄

掛鉤依其擴充的介面分組。**粗體**名稱可接受決策
結果（封鎖、取消、覆寫或要求核准）；其餘僅供
觀察。

**代理回合**

| 掛鉤                            | 用途                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 在載入工作階段訊息前覆寫供應商或模型                                  |
| `agent_turn_prepare`            | 取用已排入佇列的外掛回合注入內容，並在提示掛鉤前加入同一回合的上下文      |
| `before_prompt_build`           | 在呼叫模型前加入動態上下文或系統提示文字                          |
| `before_agent_start`            | 僅供相容性的合併階段；建議使用上方兩個掛鉤                            |
| **`before_agent_run`**          | 在提交至模型前檢查最終提示與工作階段訊息；可封鎖執行 |
| **`before_agent_reply`**        | 以合成回覆或不回覆直接結束模型回合                           |
| **`before_agent_finalize`**     | 檢查自然產生的最終答案，並要求模型再執行一次                         |
| `agent_end`                     | 觀察最終訊息、成功狀態與執行時間                                  |
| `heartbeat_prompt_contribution` | 為背景監控與生命週期外掛加入僅供心跳偵測使用的上下文                  |

**對話觀察**

| 掛鉤                                      | 用途                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | 經過清理的供應商／模型呼叫中繼資料：時間、結果、長度受限的請求 ID 雜湊。不含提示或回應內容。 |
| `llm_input`                               | 供應商輸入：系統提示、提示、歷史記錄                                                                     |
| `llm_output`                              | 供應商輸出、用量，以及可用時解析出的 `contextTokenBudget`                                       |

**工具**

| 掛鉤                       | 用途                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | 重寫工具參數、封鎖執行或要求核准 |
| `after_tool_call`          | 觀察工具結果、錯誤與執行時間                |
| `resolve_exec_env`         | 將外掛擁有的環境變數提供給 `exec`   |
| **`tool_result_persist`**  | 重寫根據工具結果產生的助理訊息 |
| **`before_message_write`** | 檢查或封鎖進行中的訊息寫入（少見）      |

**訊息與傳遞**

| 掛鉤                            | 用途                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | 在代理路由前接管傳入訊息（合成回覆） |
| **`channel_pairing_requested`** | 觀察新建立的私訊配對要求                         |
| `message_received`              | 觀察傳入內容、傳送者、討論串與中繼資料             |
| **`message_sending`**           | 重寫外送內容或取消傳遞                       |
| **`reply_payload_sending`**     | 在傳遞前修改或取消標準化回覆承載資料        |
| `message_sent`                  | 觀察外送傳遞成功或失敗                      |
| **`before_dispatch`**           | 在交接給頻道前檢查或重寫外送分派    |
| **`reply_dispatch`**            | 參與最終回覆分派管線                  |

**工作階段與壓縮**

| 掛鉤                                     | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 追蹤工作階段生命週期邊界。`reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。當處理程序在仍有使用中工作階段的情況下停止或重新啟動時，`shutdown`／`restart` 會由閘道關閉終結器觸發，讓外掛（記憶體、逐字稿儲存區）可以完成幽靈資料列，而不是讓它們在重新啟動後仍保持開啟。終結器有時間限制，因此緩慢的外掛無法阻擋 SIGTERM/SIGINT。 |
| `before_compaction` / `after_compaction` | 觀察壓縮週期或為其加上註解                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | 觀察工作階段重設事件（`/reset`、程式化重設）                                                                                                                                                                                                                                                                                                                                                                                                     |

**子代理**

- `subagent_spawned` / `subagent_ended` - 觀察子代理的啟動與完成。
- `subagent_delivery_target` - 當沒有核心工作階段繫結可投射路由時，用於完成傳遞的相容性掛鉤。
- `subagent_spawning` - 已棄用的相容性掛鉤。核心現在會在觸發 `subagent_spawned` 前，透過頻道工作階段繫結配接器準備 `thread: true` 子代理繫結。
- 當 OpenClaw 已在啟動前解析子工作階段的原生模型時，`subagent_spawned` 會包含 `resolvedModel` 和 `resolvedProvider`。
- `subagent_ended` 帶有 `targetSessionKey`（身分識別值，與 `subagent_spawned.childSessionKey` 相符）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、選用的 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、選用的 `error`、`runId`、`endedAt`、`accountId` 和 `sendFarewell`。它**不會**包含 `agentId` 或 `childSessionKey`；請使用 `targetSessionKey` 與相符的 `subagent_spawned` 事件建立關聯。

**生命週期**

| Hook                             | 用途                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | 隨閘道啟動或停止外掛擁有的服務                                                 |
| `deactivate`                     | `gateway_stop` 的已棄用相容性別名；新外掛請使用 `gateway_stop`                 |
| `cron_reconciled`                | 啟動或重新載入後，根據完整的閘道排程狀態進行協調                            |
| `cron_changed`                   | 觀察閘道擁有的排程生命週期變更（已新增、已更新、已移除、已啟動、已完成、已排程） |
| **`before_install`**             | 從已載入的外掛執行階段檢查已暫存的 Skill 或外掛安裝資料                         |

### 頻道配對請求

當未配對的私訊傳送者建立待處理的配對請求後，外掛需要通知操作員或
寫入稽核記錄時，請使用 `channel_pairing_requested`。此 Hook 會在請求建立時派送；
配對回覆的頻道傳送不會因 Hook 處理常式緩慢或失敗而延遲。

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `來自 ${event.senderId} 的新 ${event.channel} 配對請求：${event.code}`,
  });
});
```

此 Hook 僅供觀察。它不會核准、拒絕、抑制或改寫
配對回覆。承載資料包含頻道、選用的 `accountId`、
頻道範圍的 `senderId`、配對 `code`，以及頻道中繼資料。請將
配對碼視為有效且僅能使用一次的核准認證資訊，並只傳送至
受信任的操作員接收端。請將 `metadata` 視為不受信任、由傳送者提供的身分
文字。此 Hook 不包含傳入訊息的本文或媒體。

## 偵錯執行階段 Hook

使用 `before_model_resolve` 為代理程式回合切換提供者或模型——它會在
模型解析前執行。`llm_output` 僅在模型嘗試
產生助理輸出後執行。

若要證明工作階段的實際模型，請檢查執行階段註冊項目，然後
使用 `openclaw sessions` 或閘道的工作階段／狀態介面。若要偵錯
提供者承載資料，請使用 `--raw-stream` 和
`--raw-stream-path <path>` 啟動閘道，將原始模型串流事件寫入 jsonl 檔案。

## 工具呼叫政策

`before_tool_call` 會接收：

- `event.toolName`
- `event.params`
- 選用的 `event.toolKind` 與 `event.toolInputKind`，它們是由主機判定的權威
  判別欄位，用於刻意共用名稱的工具；例如，外層
  程式碼模式的 `exec` 呼叫使用 `toolKind: "code_mode_exec"`，且在已知輸入語言時
  包含 `toolInputKind: "javascript" | "typescript"`
- 選用的 `event.derivedPaths`，由主機盡力推導的目標路徑提示，
  適用於 `apply_patch` 等已知工具封裝；這些路徑可能不完整，或比
  工具實際會觸及的範圍更廣（例如輸入格式錯誤或不完整時）
- 選用的 `event.runId`
- 選用的 `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、
  `ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind` 等情境欄位，以及診斷用的 `ctx.trace`

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
    /** @deprecated 未解決的核准一律拒絕。 */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

具型別生命週期 Hook 的防護行為：

- `block: true` 是終止決定，並會略過優先順序較低的處理常式。
- `block: false` 視為未做決定。
- `params` 會改寫執行工具時使用的參數。
- `requireApproval` 會暫停代理程式執行，並透過外掛
  核准向使用者提出要求。`/approve` 可以核准 exec 與外掛核准。在 Codex
  app-server 回報模式的原生 `PreToolUse` 轉送中，這會交由
  對應的 app-server 核准請求處理；請參閱
  [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime#hook-boundaries)。
- 即使優先順序較高的 Hook 已要求核准，優先順序較低的 `block: true`
  仍可進行封鎖。
- `onResolution` 會接收已解析的決定：`allow-once`、`allow-always`、
  `deny`、`timeout` 或 `cancelled`。

如需核准路由、決定行為，以及何時應使用 `requireApproval` 而非
選用工具或 exec 核准，請參閱[外掛權限請求](/zh-TW/plugins/plugin-permission-requests)。

需要主機層級政策的外掛，可以使用
`api.registerTrustedToolPolicy(...)` 註冊受信任的工具政策。這些政策會在一般的
`before_tool_call` Hook 與一般 Hook 決定之前執行。內建的受信任
政策最先執行；已安裝外掛的受信任政策接著依外掛載入
順序執行；一般的 `before_tool_call` Hook 最後執行。內建外掛沿用
既有的受信任政策路徑。已安裝的外掛必須明確啟用，
並在 `contracts.trustedToolPolicies` 中宣告每個政策 ID；未宣告的 ID
會在註冊前遭到拒絕。政策 ID 的範圍限定於註冊該政策的
外掛，因此不同外掛可以重複使用相同的本機 ID。此層級僅適用於
受主機信任的關卡，例如工作區政策、預算強制執行或
保留工作流程的安全性。

### Exec 環境 Hook

`resolve_exec_env` 可讓外掛在命令執行前，為 `exec`
工具叫用提供環境變數。它會接收：

- `event.sessionKey`
- `event.toolName`，目前一律為 `"exec"`
- `event.host`，值為 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- `ctx.agentId`、`ctx.sessionKey`、
  `ctx.messageProvider` 與 `ctx.channelId` 等情境欄位

傳回 `Record<string, string>`，即可合併至 exec 環境。處理常式
會依優先順序執行；若鍵相同，較晚的結果會覆寫較早的結果。

Hook 輸出會先經過主機的 exec 環境鍵政策篩選，再進行
合併。`PATH` 一律會被捨棄（命令解析與安全二進位檔檢查
依賴它）。無效的鍵，以及危險的主機覆寫鍵，例如 `LD_*`、
`DYLD_*`、`NODE_OPTIONS`、Proxy 變數（`HTTP_PROXY`、`HTTPS_PROXY`、
`ALL_PROXY`、`NO_PROXY`）與 TLS 覆寫變數（`NODE_TLS_REJECT_UNAUTHORIZED`、
`SSL_CERT_FILE` 及類似變數）都會被捨棄。篩選後的外掛環境會納入
閘道核准／稽核中繼資料，並轉送至節點主機的執行
請求。

### 工具結果持久化

工具結果可包含結構化的 `details`，用於 UI 呈現、診斷、
媒體路由或外掛擁有的中繼資料。請將 `details` 視為執行階段中繼資料，
而非提示內容：

- OpenClaw 會在提供者重播與壓縮
  輸入前移除 `toolResult.details`，避免中繼資料成為模型情境。
- 持久化的工作階段項目只保留大小受限的 `details`。過大的 details 會
  替換為精簡摘要，並設定 `persistedDetailsTruncated: true`。
- `tool_result_persist` 與 `before_message_write` 會在最終
  持久化上限套用前執行。請保持傳回的 `details` 精簡，並避免只將
  與提示相關的文字放在 `details` 中；模型可見的工具輸出應放在
  `content` 中。

## 提示與模型 Hook

新外掛請使用特定階段的 Hook：

- `before_model_resolve`：僅接收目前的提示與附件
  中繼資料。傳回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收目前的提示、已準備的工作階段
  訊息，以及針對此工作階段取出且僅處理一次的所有佇列注入內容。
  傳回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收目前的提示與工作階段訊息。
  傳回 `prependContext`、`appendContext`、`systemPrompt`、
  `prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：僅在心跳偵測回合執行，並傳回
  `prependContext` 或 `appendContext`。適用於需要
  摘要目前狀態、但不應變更使用者發起之回合的背景監控程式。

`before_agent_start` 保留供相容性使用。請優先使用上述明確的 Hook，
避免外掛依賴舊版的合併階段。

`before_agent_run` 會在提示建構完成後、任何模型輸入之前執行，
包括提示本機圖片載入與 `llm_input` 觀察。它會接收
目前的使用者輸入作為 `prompt`，並在 `messages`
中包含已載入的工作階段歷程與啟用中的系統提示。傳回 `{ outcome: "block", reason, message? }`
即可在模型讀取提示前停止執行。`reason` 供內部使用；
`message` 是面向使用者的替代文字。僅支援 `pass` 與 `block` 結果；
不支援的決定格式會以封閉方式失敗。

當執行遭到封鎖時，OpenClaw 只會在
`message.content` 中儲存替代文字，以及封鎖外掛 ID 與時間戳記等
非敏感封鎖中繼資料。原始使用者文字不會保留在逐字記錄
或未來情境中。內部封鎖原因會視為敏感資訊，並從
逐字記錄、歷程、廣播、記錄與診斷承載資料中排除。
可觀測性應使用已清理的欄位，例如封鎖者 ID、結果、
時間戳記或安全的分類。

當 OpenClaw 能識別啟用中的執行時，`before_agent_start` 與 `agent_end`
會包含 `event.runId`；相同的值也會位於 `ctx.runId`。由排程驅動的
執行也會在代理程式回合情境中公開 `ctx.jobId`（原始排程工作 ID），
讓 Hook 能將指標、副作用或狀態限定於特定的
排程工作。`ctx.jobId` 不屬於 `before_tool_call` 工具情境。

對於源自頻道的執行，`ctx.channel` 與 `ctx.messageProvider` 會識別
`discord` 或 `telegram` 等提供者介面，而當 OpenClaw 能從
工作階段金鑰或傳送中繼資料推導時，`ctx.channelId` 是
對話目標識別碼。

若可取得傳送者身分，代理程式 Hook 情境也會包含：

- `ctx.senderId`——頻道範圍的傳送者 ID（例如 Feishu `open_id`、Discord
  使用者 ID）。當執行源自具有已知
  傳送者中繼資料的使用者訊息時填入。
- `ctx.chatId`——傳輸原生的對話識別碼（例如 Feishu
  `chat_id`、Telegram `chat_id`）。當原始頻道
  提供原生對話 ID 時填入。
- `ctx.channelContext.sender.id`——與 `ctx.senderId` 相同的傳送者 ID，位於
  外掛可使用頻道特定欄位擴充的頻道擁有物件下。
- `ctx.channelContext.chat.id`——與 `ctx.chatId` 相同的對話 ID，
  位於外掛可使用頻道特定欄位擴充的頻道擁有物件下。

核心僅定義巢狀的 `id` 欄位。透過傳入輔助函式傳遞更豐富
傳送者或聊天中繼資料的頻道外掛，可以從
`openclaw/plugin-sdk/channel-inbound` 擴充
`PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

頻道外掛透過傳入 SDK 輔助函式傳遞這些欄位：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

這些欄位是選用的，且不會出現在源自系統的執行中（心跳偵測、
排程、exec 事件）。

`ctx.senderExternalId` 保留為舊版外掛的已棄用原始碼相容性欄位。
核心不會填入此欄位；新的頻道特定傳送者
身分應透過模組擴充放在 `ctx.channelContext.sender` 下。

`agent_end` 是觀察掛鉤。閘道與持久型執行框架路徑會在該輪結束後以
fire-and-forget 方式執行它，而短生命週期的一次性命令列介面路徑會在程序清理前等待
掛鉤 Promise 完成，讓受信任的外掛可以排清終端可觀測性資料或擷取狀態。掛鉤執行器會套用 30 秒
逾時，避免卡住的外掛或嵌入端點讓掛鉤 Promise
永遠處於待處理狀態。逾時會記錄至日誌，而 OpenClaw 會繼續執行；除非外掛也使用自己的中止
訊號，否則它不會取消外掛所擁有的網路工作。

針對不應接收原始提示、歷程記錄、回應、標頭、要求
主體或供應商要求 ID 的供應商呼叫遙測，請使用 `model_call_started` 和 `model_call_ended`。
這些掛鉤包含穩定的中繼資料，例如
`runId`、`callId`、`provider`、`model`、選用的 `api`/`transport`、終止時的
`durationMs`/`outcome`，以及 OpenClaw 能推導出有界供應商要求 ID 雜湊時的
`upstreamRequestIdHash`。當執行階段已解析
上下文視窗中繼資料時，掛鉤事件與上下文也會包含
`contextTokenBudget`，也就是套用模型／設定／代理程式
上限後的有效權杖預算；若套用了較低上限，還會包含 `contextWindowSource` 和
`contextWindowReferenceTokens`。

`before_agent_finalize` 只會在執行框架即將接受自然產生的
最終助理回答時執行。它不是 `/stop` 取消路徑，使用者中止某一輪時也不會
執行。傳回 `{ action: "revise", reason }` 可要求
執行框架在定稿前再執行一次模型流程；傳回 `{ action:
"finalize", reason? }` 可強制定稿；也可以省略結果以繼續執行。
處理常式的預設時間預算為 15 秒；若逾時，OpenClaw 會記錄失敗並
繼續使用原始最終回答。
Codex 原生 `Stop` 掛鉤會轉送至此掛鉤，作為 OpenClaw
`before_agent_finalize` 決策。

傳回 `action: "revise"` 時，外掛可以包含 `retry` 中繼資料，讓
額外的模型流程有界且可安全重播：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 會附加至傳送給執行框架的修訂原因。
`idempotencyKey` 讓主機能跨等價的定稿決策，計算同一個外掛要求的重試次數；
`maxAttempts` 則限制主機允許的額外
流程次數，達到上限後會繼續使用自然產生的最終回答。

需要原始對話掛鉤（`before_model_resolve`、
`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、
`agent_end` 或 `before_agent_run`）的非內建外掛必須設定：

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

可以針對每個外掛使用
`plugins.entries.<id>.hooks.allowPromptInjection=false` 停用會修改提示的掛鉤與持久的下一輪注入。

### 工作階段擴充功能與下一輪注入

工作流程外掛可以使用
`api.session.state.registerSessionExtension(...)` 保存小型且與 JSON 相容的工作階段狀態，並透過
閘道 `sessions.pluginPatch` 方法更新它。工作階段資料列會透過 `pluginExtensions`
投射已註冊的擴充狀態，讓控制介面與其他
用戶端可以呈現外掛擁有的狀態，而不必了解外掛內部實作。
`api.registerSessionExtension(...)` 仍可使用，但已淘汰，建議改用
`api.session.state` 命名空間。

當外掛需要讓持久上下文恰好一次傳遞至下一個模型輪次時，請使用
`api.session.workflow.enqueueNextTurnInjection(...)`（頂層的
`api.enqueueNextTurnInjection(...)` 是行為相同的已淘汰別名）。
OpenClaw 會在提示掛鉤前取出佇列中的注入、捨棄
已過期的注入，並依每個外掛的 `idempotencyKey` 去除重複項目。這是適合用於核准後繼續執行、政策摘要、背景監控器
差異，以及命令延續內容的接合點；這些內容應在下一輪對模型可見，
但不應成為永久的系統提示文字。

清理語意是合約的一部分。工作階段擴充功能清理與
執行階段生命週期清理回呼會收到 `reset`、`delete`、`disable` 或
`restart`。針對重設／刪除／停用，主機會移除所屬外掛的持久工作階段擴充功能
狀態與待處理的下一輪注入；重新啟動則會
保留持久工作階段狀態，同時讓外掛透過清理回呼釋放
舊執行階段世代的排程器工作、執行上下文及其他頻帶外資源。

## 訊息掛鉤

使用訊息掛鉤處理頻道層級的路由與傳遞政策：

- `message_received`：觀察傳入內容、傳送者、`threadId`、
  `messageId`、`senderId`、選用的執行／工作階段關聯資訊，以及中繼資料。
- `message_sending`：重寫 `content` 或傳回 `{ cancel: true }`。
- `reply_payload_sending`：重寫正規化的 `ReplyPayload` 物件
  （包括 `presentation`、`delivery`、媒體參照與文字），或傳回
  `{ cancel: true }`。
- `message_sent`：觀察最終成功或失敗結果。

對於只有音訊的 TTS 回覆，即使頻道承載內容沒有可見文字／字幕，
`content` 仍可能包含隱藏的語音逐字稿。
重寫該 `content` 只會更新掛鉤可見的逐字稿；它不會
呈現為媒體字幕。

`reply_payload_sending` 事件可能包含 `usageState`，這是盡力而為的即時
每輪模型／用量／上下文快照。持久傳遞、復原後重播，以及
缺少精確執行關聯的回覆會省略它。

訊息掛鉤上下文會在可用時公開穩定的關聯欄位：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。當頻道
具有經可見性篩選的引用訊息資料時，傳入與 `before_dispatch` 上下文也會公開回覆中繼資料：
`replyToId`、`replyToIdFull`、
`replyToBody`、`replyToSender` 和 `replyToIsQuote`。請優先使用這些
一級欄位，再讀取舊版中繼資料。

請優先使用具型別的 `threadId` 與 `replyToId` 欄位，再使用頻道專屬
中繼資料。

決策規則：

- 帶有 `cancel: true` 的 `message_sending` 是終止決策。
- 帶有 `cancel: false` 的 `message_sending` 視為未做決策。
- 重寫後的 `content` 會繼續傳遞給優先順序較低的掛鉤，除非後續掛鉤
  取消傳遞。
- `reply_payload_sending` 會在承載內容正規化後、頻道
  傳遞前執行，包括路由回原始頻道的回覆。
  處理常式會依序執行，每個處理常式都會看到優先順序較高的處理常式所產生的最新承載內容。
- `reply_payload_sending` 承載內容不會公開如
  `trustedLocalMedia` 等執行階段信任標記；外掛可以編輯承載內容的結構，但無法授予本機
  媒體信任。
- `message_sending` 可以在取消時傳回 `cancelReason` 與有界的 `metadata`。
  新版訊息生命週期 API 會將此公開為原因是
  `cancelled_by_message_sending_hook` 的已抑制傳遞結果；舊版
  直接傳遞則為了相容性繼續傳回空的結果陣列。
- `message_sent` 僅供觀察。處理常式失敗會記錄至日誌，且不會
  變更傳遞結果。

## 安裝掛鉤

使用 `security.installPolicy` 處理由操作者擁有的允許／封鎖決策。該
政策由 OpenClaw 設定執行、涵蓋命令列介面的安裝與更新路徑，並且在啟用但無法使用時
採取失敗關閉。

`before_install` 是外掛執行階段生命週期掛鉤。它只會在
已載入外掛掛鉤的 OpenClaw 程序中，於
`security.installPolicy` 之後執行，例如由閘道支援的安裝流程。它適合用於
外掛擁有的觀察、警告與相容性檢查，但不是
安裝作業的主要企業或主機安全邊界。為了相容性，
事件承載內容仍保留 `builtinScan` 欄位，但
OpenClaw 已不再執行內建的安裝時危險程式碼封鎖，因此它是空的 `ok` 結果。
傳回額外的發現項目或
`{ block: true, blockReason }` 可停止該程序中的安裝。

`block: true` 是終止決策。`block: false` 視為未做決策。處理常式
失敗會以失敗關閉方式封鎖安裝。

## 閘道生命週期

使用 `gateway_start` 啟動一般外掛服務，並使用 `gateway_stop`
清理長時間執行的資源。`gateway_start` 執行時，排程器可能仍在載入，
因此不要將它用作外部
排程投射的基準訊號。

外掛擁有的執行階段服務不應依賴內部 `gateway:startup` 掛鉤。

`cron_reconciled` 會在閘道排程器及其結束時
監看器完成持久狀態對帳後觸發。初始
啟動與設定重新載入期間更換排程器時都會觸發。事件會回報
`reason`（`startup` 或 `reload`）與有效的 `enabled` 狀態。停用的
排程仍會以 `enabled: false` 發出，讓外部投射可以
清除過時的喚醒。使用 `ctx.getCron?.()` 取得完成對帳的確切排程器執行個體；
後續重新載入不會讓該回呼重新指向其他執行個體。
`ctx.abortSignal` 擁有同一份排程器快照。只要更新的排程器準備就緒或關閉開始，
閘道就會立即中止它。請將它傳遞給每個
持久副作用，並且在快照中止後不要接受該快照。
這是排程器生命週期訊號，不是外掛啟用訊號：
只重新載入外掛不會重播它。新啟用的消費者會在下一次更換排程器或閘道啟動時
收到第一份基準資料。

如同其他觀察掛鉤，`gateway_start` 與 `cron_reconciled` 回呼
可能重疊。如果兩個處理常式共用外掛初始化，請使用
外掛本機的就緒 Promise 來協調，而不要依賴回呼順序。

`cron_changed` 會針對閘道擁有的排程生命週期事件觸發，並提供涵蓋
`added`、`updated`、`removed`、`started`、`finished`
和 `scheduled` 原因的具型別事件承載內容。事件會攜帶
`PluginHookGatewayCronJob` 快照（包括 `state.nextRunAtMs`、`state.lastRunStatus`，以及
存在時的 `state.lastError`）與值為
`not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。移除事件
會在提交後觸發：它們只會在持久刪除成功後觸發，並仍會攜帶
已刪除的工作快照，讓外部排程器可以對帳狀態。

`scheduled` 事件會在提交後觸發：只有在成功的持久
寫入變更現有工作的有效 `nextRunAtMs` 後才會觸發，但不包括該工作的
明確 `added`、`updated` 或 `removed` 生命週期事件。頂層的
`event.nextRunAtMs` 是已提交的下一次喚醒時間；若不存在，該工作就沒有
下一次喚醒。請將這些事件視為對帳提示，而不是有序差異
日誌。將它們用作可合併的提示，以重新讀取
`cron_reconciled` 上次擷取的排程器；不要採用 `cron_changed` 上下文中的排程器。
讓 OpenClaw 繼續作為到期檢查與執行的事實來源。

### 安全的外部排程投射

請投射完整的喚醒快照，而不是轉送排程事件差異。外部
配接器的 `replaceAll` 作業必須是不可分割且具冪等性的，並且只能在
主機持久接受快照後解析完成。它也必須
遵守提供的中止訊號：如果訊號在持久
接受前中止，配接器不得接受該快照。

此模式會讓執行中的工作者始終只有一個最新狀態。只有 `cron_reconciled`
會採用排程器執行個體；`cron_changed` 只會要求該工作者重新讀取
權威執行個體，因此延遲抵達的提示無法還原較舊的排程器。
較新的修訂會在主機目前的嘗試接受過時快照前中止它。

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

當 `cron_reconciled` 回報 `enabled: false` 時，同一路徑會呼叫
`replaceAll([])`，並清除過時的外部喚醒。在此範例中，重試／退避機制僅限於處理程序本機，
並將執行階段轉接器失敗視為暫時性錯誤；請在註冊前驗證不可重試的設定。
OpenClaw 不提供用於處理外掛掛鉤副作用的寄件匣。若處理程序在持久化接受完成前結束，
下次啟動閘道時，會發出新的權威 `cron_reconciled` 快照。
`gateway_stop` 會中止進行中的主機工作、等待工作程序結束，然後
關閉轉接器。

## 即將淘汰的功能

部分與掛鉤相鄰的介面已淘汰，但仍受支援。請在下一個主要版本發布前
完成移轉：

- `inbound_claim` 與 `message_received` 處理常式中的**純文字頻道封裝**。
  請讀取 `BodyForAgent` 與結構化使用者情境區塊，
  不要剖析扁平的封裝文字。請參閱
  [純文字頻道封裝 → BodyForAgent](/zh-TW/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 為了相容性仍會保留。新外掛應使用
  `before_model_resolve` 與 `before_prompt_build`，而非合併的
  階段。
- **`subagent_spawning`** 為了與舊版外掛相容仍會保留，但
  新外掛不應從中傳回討論串路由。核心會在
  `subagent_spawned` 觸發前，透過頻道工作階段繫結轉接器準備
  `thread: true` 子代理程式繫結。
- **`deactivate`** 在 2026-08-16 之後之前，仍會作為已淘汰的清理相容性別名
  保留。新外掛應使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 現在使用具型別的
  `PluginApprovalResolution` 聯集（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而非自由格式的 `string`。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** 仍會
  作為頂層相容性別名保留。新外掛應使用
  `api.session.state.registerSessionExtension(...)` 與
  `api.session.workflow.enqueueNextTurnInjection(...)`。

如需完整清單，包括記憶體能力註冊、供應商思考
設定檔、外部驗證供應商、供應商探索型別、任務執行階段
存取子，以及 `command-auth` → `command-status` 重新命名，請參閱
[外掛 SDK 移轉 → 使用中的淘汰項目](/zh-TW/plugins/sdk-migration#active-deprecations)。

## 相關內容

- [外掛 SDK 移轉](/zh-TW/plugins/sdk-migration) - 使用中的淘汰項目與移除時程
- [建構外掛](/zh-TW/plugins/building-plugins)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [內部掛鉤](/zh-TW/automation/hooks)
- [外掛架構內部機制](/zh-TW/plugins/architecture-internals)
