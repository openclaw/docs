---
read_when:
    - 你想了解代理程式有哪些工作階段工具
    - 您想設定跨工作階段存取或子代理生成
    - 您想要檢查已產生的子代理狀態
summary: 用於跨工作階段狀態、回憶、訊息傳遞和子代理編排的代理工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-07-05T11:15:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ae81980dd92f60ecf71516676662214a4d0445ae7ab9067238f142580d97f3
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 提供代理工具，用於跨工作階段作業、檢查狀態，以及協調子代理。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用選用篩選條件列出工作階段（種類、標籤、代理、封存、預覽）  |
| `sessions_history` | 讀取特定工作階段的逐字稿                                   |
| `sessions_send`    | 將訊息傳送到另一個工作階段，並可選擇等待                       |
| `sessions_spawn`   | 產生隔離的子代理工作階段以進行背景作業                     |
| `sessions_yield`   | 結束目前回合並等待後續子代理結果               |
| `subagents`        | 列出此工作階段產生的子代理狀態                              |
| `session_status`   | 顯示 `/status` 樣式的卡片，並可選擇設定每個工作階段的模型覆寫 |

這些工具仍受作用中工具設定檔與允許/拒絕政策約束。`tools.profile: "coding"` 包含完整的工作階段協調工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨工作階段訊息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子代理產生功能。若要保留訊息設定檔並仍允許原生委派，請加入：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、提供者、沙盒和每個代理的政策仍可在設定檔階段之後移除這些工具。請從受影響的工作階段使用 `/tools` 檢查有效工具清單。

## 列出與讀取工作階段

`sessions_list` 會傳回工作階段及其 key、agentId、種類、頻道、模型、Token 數量和時間戳記。可依 `kinds`（陣列；接受值：`main`、`group`、`cron`、`hook`、`node`、`other`）、精確 `label`、精確 `agentId`、`search` 文字或近況（`activeMinutes`）篩選。預設會傳回作用中工作階段；傳入 `archived: true` 則改為檢查已封存的工作階段。列中包含 `pinned` 和 `archived` 狀態。當你需要郵件箱式分流時，請設定 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限為 20）：可見範圍內的衍生標題、最後訊息預覽片段，或每列有界限的近期訊息。衍生標題和預覽只會針對呼叫者在已設定的工作階段工具可見性政策下已可看見的工作階段產生，因此不相關的工作階段會保持隱藏。當可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示有效模式以及結果可能受範圍限制的警告。

`sessions_history` 會擷取特定工作階段的對話逐字稿。預設會排除工具結果；傳入 `includeTools: true` 可查看它們。使用 `limit` 取得最新且有界限的尾端內容。當你需要分頁中繼資料時，傳入 `offset: 0`，再傳入傳回的 `nextOffset` 值，即可向後翻閱較舊的 OpenClaw 逐字稿視窗，而不需讀取原始逐字稿檔案。明確偏移頁面不會合併外部命令列介面備援匯入；當你需要該合併顯示歷史時，請使用預設的最新尾端檢視（不使用 `offset`）。

傳回的檢視刻意保持有界限並經過安全篩選：

- 助理文字會在召回前正規化：
  - 思考標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` 鷹架區塊會被移除
  - 純文字工具呼叫 XML 酬載區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>` 會被移除，包括從未乾淨關閉的截斷酬載
  - 降級的工具呼叫/結果鷹架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 外洩的模型控制 Token，例如 `<|assistant|>`、其他 ASCII `<|...|>` Token，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` / `</minimax:tool_call>` 會被移除
- 類似憑證/Token 的文字會在傳回前遮蔽
- 長文字區塊會被截斷
- 非常大的歷史可能會丟棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列
- 此工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes`，以及分頁中繼資料

兩個工具都接受**工作階段 key**（例如 `"main"`）或先前清單呼叫中的**工作階段 ID**。

如果你需要逐位元組完全一致的逐字稿，請檢查磁碟上的逐字稿檔案，而不要把 `sessions_history` 視為原始傾印。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息送達另一個工作階段，並可選擇等待回應：

- **送出後不等待：** 將 `timeoutSeconds: 0` 設為排入佇列後立即返回。
- **等待回覆：** 設定逾時並內嵌取得回應。

執行緒範圍的聊天工作階段，例如以 `:thread:<id>` 結尾的 key，不是有效的 `sessions_send` 目標。請使用父頻道工作階段 key 進行代理間協調，讓工具路由的訊息不會出現在作用中的人類面向執行緒內。

訊息和 A2A 後續回覆會在接收提示（`[Inter-session message ... isUser=false]`）和逐字稿來源中標示為工作階段間資料。接收代理應將其視為工具路由資料，而不是直接由終端使用者撰寫的指令。

目標回應後，OpenClaw 可執行**回覆循環**，讓代理交替傳送訊息（最多 `session.agentToAgent.maxPingPongTurns`，範圍 0-20，預設 5）。目標代理可回覆 `REPLY_SKIP` 以提早停止。

## 狀態與協調輔助工具

`session_status` 是目前或另一個可見工作階段的輕量 `/status` 等效工具。它會回報使用量、時間、模型/執行階段狀態，以及存在時的已連結背景工作內容。與 `/status` 一樣，它可從最新逐字稿使用量項目回填稀疏的 Token/快取計數器，而 `model=default` 會清除每個工作階段的覆寫。針對呼叫者目前的工作階段，請使用 `sessionKey="current"`；可見的用戶端標籤，例如 `openclaw-tui`，不是工作階段 key。

當路由中繼資料可用時，`session_status` 也會包含可見的 `Route context` JSON 區塊，以及相符的結構化 `details` 欄位。這些欄位會釐清工作階段 key 與目前正在處理即時執行的路由之間的差異：

- `origin` 是建立工作階段的位置，或是在較舊狀態缺少已儲存來源中繼資料時，從可交付工作階段 key 前綴推斷出的提供者。
- `active` 是目前的即時執行路由。它只會針對現在正在處理的即時或目前工作階段回報。
- `deliveryContext` 是儲存在工作階段上的持久化交付路由，即使作用中介面不同，OpenClaw 也可在之後交付時重用。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以是你正在等待的後續事件。當你產生子代理後，希望完成結果作為下一則訊息送達，而不是建立輪詢迴圈時，請使用它。

`subagents` 是已產生 OpenClaw 子代理的可見性輔助工具。它支援 `action: "list"` 以檢查作用中/近期執行。

## 產生子代理

`sessions_spawn` 預設會為背景工作建立隔離的工作階段。它一律為非阻塞；會立即傳回 `runId` 和 `childSessionKey`。原生子代理執行會在子工作階段的第一個可見 `[Subagent Task]` 訊息中收到委派工作，而系統提示只承載子代理執行階段規則和路由內容。

主要選項：

- `runtime: "subagent"`（預設）或 `"acp"`，用於外部測試框架代理。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 將產生動作繫結到聊天執行緒（Discord、Slack 等）。
- `sandbox: "require"` 對子工作階段強制啟用沙盒。
- 當子工作階段需要目前請求者逐字稿時，原生子代理使用 `context: "fork"`；若要乾淨的子工作階段，請省略它或使用 `context: "isolated"`。`context: "fork"` 僅在 `runtime: "subagent"` 下有效。繫結執行緒的原生子代理預設使用 `context: "fork"`，除非 `threadBindings.defaultSpawnContext` 另有指定。

預設葉節點子代理不會取得工作階段工具。當 `maxSpawnDepth >= 2` 時，深度 1 的協調器子代理會額外收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子代理。葉節點執行仍不會取得遞迴協調工具。

完成後，公告步驟會將結果發布到請求者的頻道。完成交付會在可用時保留繫結的執行緒/主題路由；如果完成來源只識別頻道，OpenClaw 仍可重用請求者工作階段已儲存的路由（`lastChannel` / `lastTo`）進行直接交付。

如需 ACP 特定行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具會限定範圍，以限制代理可見的內容：

| 層級   | 範圍                                    |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                 |
| `tree`  | 目前工作階段 + 已產生的子代理     |
| `agent` | 此代理的所有工作階段              |
| `all`   | 所有工作階段（若已設定，包含跨代理） |

預設為 `tree`。不論設定為何，沙盒工作階段都會被限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session)：路由、生命週期、維護
- [ACP 代理](/zh-TW/tools/acp-agents)：外部測試框架產生
- [多代理](/zh-TW/concepts/multi-agent)：多代理架構
- [Gateway 設定](/zh-TW/gateway/configuration)：工作階段工具設定旋鈕

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
