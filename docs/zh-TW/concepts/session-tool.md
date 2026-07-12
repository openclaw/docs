---
read_when:
    - 你想了解代理程式有哪些工作階段工具
    - 你想要設定跨工作階段存取或產生子代理程式
    - 你想要檢查已產生子代理程式的狀態
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子代理協調的代理工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-07-12T21:23:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 為代理程式提供可跨工作階段運作、檢查狀態及協調子代理程式的工具。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用選用篩選條件（種類、標籤、代理程式、封存、預覽）列出工作階段  |
| `sessions_history` | 讀取特定工作階段的對話記錄                                   |
| `sessions_send`    | 傳送訊息至另一個工作階段，並可選擇等待回覆                       |
| `sessions_spawn`   | 產生隔離的子代理程式工作階段以執行背景工作                     |
| `sessions_yield`   | 結束目前回合，並等待後續子代理程式結果               |
| `subagents`        | 列出此工作階段所產生子代理程式的狀態                              |
| `session_status`   | 顯示 `/status` 樣式的資訊卡，並可選擇設定每個工作階段的模型覆寫 |

這些工具仍受有效工具設定檔及允許／拒絕原則約束。`tools.profile: "coding"` 包含完整的工作階段協調工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨工作階段訊息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子代理程式產生功能。若要保留訊息設定檔，同時仍允許原生委派，請新增：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、供應商、沙箱及每個代理程式的原則，仍可在設定檔階段之後移除這些工具。請從受影響的工作階段使用 `/tools`，檢查實際生效的工具清單。

## 列出及讀取工作階段

`sessions_list` 會傳回工作階段的金鑰、agentId、種類、頻道、模型、權杖計數及時間戳記。可依 `kinds`（陣列；接受的值：`main`、`group`、`cron`、`hook`、`node`、`other`）、完全相符的 `label`、完全相符的 `agentId`、`search` 文字或最近活動時間（`activeMinutes`）篩選。預設會傳回作用中的工作階段；若要檢查已封存的工作階段，請改傳入 `archived: true`。資料列包含 `pinned` 和 `archived` 狀態。需要信箱式分流時，請設定 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限為 20），以在各資料列取得受可見性範圍限制的衍生標題、最後一則訊息的預覽片段，或有限數量的近期訊息。衍生標題與預覽只會針對呼叫者依照已設定的工作階段工具可見性原則原本即可查看的工作階段產生，因此不相關的工作階段仍會保持隱藏。可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示實際生效的模式，並警告結果可能受到範圍限制。

`sessions_history` 會擷取特定工作階段的對話記錄。預設不包含工具結果；傳入 `includeTools: true` 即可查看。使用 `limit` 取得最新且有限範圍的尾端內容。需要分頁中繼資料時，請傳入 `offset: 0`，接著傳入所傳回的 `nextOffset` 值，即可向後翻閱較舊的 OpenClaw 對話記錄區段，而不需讀取原始對話記錄檔。明確指定 offset 的頁面不會合併外部命令列介面備援匯入內容；需要該合併後的顯示歷程時，請使用預設的最新尾端檢視（不指定 `offset`）。

傳回的檢視刻意設有範圍限制，並經過安全篩選：

- 助理文字會在回溯前正規化：
  - 移除思考標籤
  - 移除 `<relevant-memories>` / `<relevant_memories>` 鷹架區塊
  - 移除純文字工具呼叫 XML 承載資料區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括從未正常閉合的截斷承載資料
  - 移除降級的工具呼叫／結果鷹架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除外洩的模型控制權杖，例如 `<|assistant|>`、其他 ASCII `<|...|>` 權杖及全形 `<｜...｜>` 變體
  - 移除格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 類似認證資訊／權杖的文字會在傳回前遮蔽
- 過長的文字區塊會被截斷
- 非常龐大的歷程可能會捨棄較舊的資料列，或以 `[sessions_history omitted: message too large]` 取代過大的資料列
- 此工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes`，以及分頁中繼資料

這兩項工具都接受**工作階段金鑰**（例如 `"main"`），或先前清單呼叫所取得的**工作階段 ID**。

若需要完全精確的原始對話記錄，請檢查範圍受限的 SQLite 對話記錄資料列，不要將 `sessions_history` 視為未經篩選的傾印內容。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息傳送至另一個工作階段，並可選擇等待回覆：

- **傳送後不等待：**將 `timeoutSeconds: 0` 設為 0，即可排入佇列並立即傳回。
- **等待回覆：**設定逾時時間，並直接取得內嵌回覆。

以討論串為範圍的聊天工作階段（例如金鑰以 `:thread:<id>` 結尾者）不是有效的 `sessions_send` 目標。代理程式間協調應使用父頻道工作階段金鑰，避免透過工具路由的訊息出現在作用中的使用者可見討論串內。

訊息與 A2A 後續回覆會在接收端提示詞（`[Inter-session message ... isUser=false]`）及對話記錄來源中標記為工作階段間資料。接收代理程式應將其視為工具路由的資料，而不是終端使用者直接撰寫的指示。

目標回應後，OpenClaw 可執行**回覆迴圈**，讓代理程式輪流傳送訊息（最多 `session.agentToAgent.maxPingPongTurns` 次，範圍為 0-20，預設為 5）。目標代理程式可回覆 `REPLY_SKIP` 提前停止。

傳入 `watch: true`，也可將傳送者登錄為目標的狀態變更監看者：當其他參與者之後向目標傳送直接的人類訊息或變更其目標時，傳送者會收到指向 `session_status` `changesSince` 的系統通知。登錄會在成功分派後進行，目標為實際收到訊息的工作階段，並從其目前的狀態版本開始，因此只有之後的變更才會產生通知。登錄成功時，結果會回報 `watched: true`。請參閱[工作階段狀態感知](/concepts/session-state)。

## 狀態與協調輔助工具

`session_status` 是目前或另一個可見工作階段的輕量級 `/status` 等效工具。它會回報用量、時間、模型／執行階段狀態，以及存在時所連結的背景工作內容。與 `/status` 相同，它可從最新的對話記錄用量項目回填稀疏的權杖／快取計數器，而 `model=default` 會清除每個工作階段的覆寫。呼叫者目前的工作階段請使用 `sessionKey="current"`；可見的用戶端標籤（例如 `openclaw-tui`）並不是工作階段金鑰。

路由中繼資料可用時，`session_status` 還會包含可見的 `Route context` JSON 區塊，以及相符的結構化 `details` 欄位。這些欄位可區分工作階段金鑰與目前正在處理即時執行的路由：

- `origin` 是建立工作階段的位置；若較舊狀態缺少已儲存的來源中繼資料，則為根據可傳遞的工作階段金鑰前綴推斷出的供應商。
- `active` 是目前的即時執行路由。它只會針對目前正在處理的即時或當前工作階段回報。
- `deliveryContext` 是儲存在工作階段上的持久化傳遞路由，即使作用中介面不同，OpenClaw 仍可將其重複用於之後的傳遞。

## 工作階段狀態變更

OpenClaw 會保存重要工作階段狀態變更的持久訊號記錄（傳送給受監看工作階段的直接人類訊息、子執行結果、目標變更、壓縮）。`sessions_list` 資料列與 `session_status` 會公開工作階段的 `stateVersion`，而 `session_status` 接受 `changesSince: <version>`，以傳回該版本之後的具型別事件；若所要求的版本早於保留的歷程，則會透過 `historyGap` 精確發出訊號。當其他參與者變更受監看的工作階段時，監看者（產生來源父項會自動登錄，`sessions_send watch: true` 則會明確登錄）會收到一則合併的狀態過期通知。

完整模型請參閱[工作階段狀態感知](/concepts/session-state)，其中說明事件種類、監看者登錄、防垃圾通知協定、調解流程及目前限制。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息成為你正在等待的後續事件。產生子代理程式後，若希望完成結果作為下一則訊息抵達，而不是建立輪詢迴圈，請使用此工具。

`subagents` 是已產生 OpenClaw 子代理程式的可見性輔助工具。它支援 `action: "list"`，可檢查作用中／近期的執行。

## 產生子代理程式

`sessions_spawn` 預設會為背景工作建立隔離的工作階段。它一律不會阻塞；會立即傳回 `runId` 和 `childSessionKey`。原生子代理程式執行會在子工作階段第一則可見的 `[Subagent Task]` 訊息中收到委派工作，而系統提示詞只包含子代理程式執行階段規則和路由內容。

主要選項：

- `runtime: "subagent"`（預設）或供外部控制框架代理程式使用的 `"acp"`。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 將產生作業繫結至聊天討論串（Discord、Slack 等）。
- `sandbox: "require"` 對子工作階段強制執行沙箱隔離。
- 當子代理程式需要目前請求者的對話記錄時，原生子代理程式可使用 `context: "fork"`；若要建立乾淨的子工作階段，請省略此選項或使用 `context: "isolated"`。`context: "fork"` 僅在 `runtime: "subagent"` 時有效。除非 `threadBindings.defaultSpawnContext` 另有指定，繫結至討論串的原生子代理程式預設會使用 `context: "fork"`。

預設的葉節點子代理程式不會取得工作階段工具。當 `maxSpawnDepth >= 2` 時，深度為 1 的協調器子代理程式還會取得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以管理自己的子項。葉節點執行仍不會取得遞迴協調工具。

完成後，公告步驟會將結果發布至請求者的頻道。完成傳遞會在可用時保留已繫結的討論串／主題路由；若完成來源只識別出頻道，OpenClaw 仍可重複使用請求者工作階段所儲存的路由（`lastChannel` / `lastTo`）進行直接傳遞。

關於 ACP 特定行為，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具具有範圍限制，以限制代理程式可查看的內容：

| 層級   | 範圍                                    |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                 |
| `tree`  | 目前工作階段 + 已產生的子代理程式     |
| `agent` | 此代理程式的所有工作階段              |
| `all`   | 所有工作階段（若已設定，可跨代理程式） |

預設為 `tree`。無論設定為何，沙箱工作階段都會限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session)：路由、生命週期、維護
- [子代理程式](/zh-TW/tools/subagents)：子工作階段生命週期與傳遞
- [ACP 代理程式](/zh-TW/tools/acp-agents)：產生外部控制框架
- [多代理程式](/zh-TW/concepts/multi-agent)：多代理程式架構
- [閘道設定](/zh-TW/gateway/configuration)：工作階段工具設定選項

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
