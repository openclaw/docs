---
read_when:
    - 你想了解代理程式有哪些工作階段工具
    - 您想設定跨工作階段存取或子代理產生
    - 你想要檢查已產生的子代理狀態
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子代理協調的代理工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-06-27T19:14:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 為代理提供可跨工作階段工作、檢查狀態，以及協調子代理的工具。

## 可用工具

| 工具               | 功能                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出工作階段，可使用選用篩選條件（種類、標籤、代理、近期程度、預覽）        |
| `sessions_history` | 讀取特定工作階段的逐字稿                                                    |
| `sessions_send`    | 傳送訊息到另一個工作階段，並可選擇等待                                      |
| `sessions_spawn`   | 產生隔離的子代理工作階段以執行背景工作                                      |
| `sessions_yield`   | 結束目前回合並等待後續子代理結果                                            |
| `subagents`        | 列出此工作階段產生的子代理狀態                                              |
| `session_status`   | 顯示 `/status` 風格的卡片，並可選擇設定每個工作階段的模型覆寫               |

這些工具仍受作用中的工具設定檔與允許/拒絕政策約束。`tools.profile: "coding"` 包含完整的工作階段協調工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨工作階段訊息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子代理產生功能。若要保留訊息設定檔並仍允許原生委派，請加入：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、供應商、沙箱，以及各代理政策仍可在設定檔階段之後移除這些工具。請從受影響的工作階段使用 `/tools` 檢查實際工具清單。

## 列出與讀取工作階段

`sessions_list` 會傳回工作階段及其 key、agentId、種類、頻道、模型、權杖計數和時間戳記。可依種類（`main`、`group`、`cron`、`hook`、`node`）、精確 `label`、精確 `agentId`、搜尋文字或近期程度（`activeMinutes`）進行篩選。當你需要信箱式分流時，它也可以要求每列顯示可見範圍內衍生的標題、最後訊息預覽片段，或有界限的近期訊息。衍生標題和預覽只會針對呼叫端依設定的工作階段工具可見性政策已可看見的工作階段產生，因此不相關的工作階段會保持隱藏。當可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示有效模式，以及結果可能受範圍限制的警告。

`sessions_history` 會擷取特定工作階段的對話逐字稿。預設會排除工具結果；傳入 `includeTools: true` 可查看它們。傳回的檢視刻意設有界限並經過安全篩選：

- 助理文字會在回想前正規化：
  - 思考標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` 鷹架區塊會被移除
  - 純文字工具呼叫 XML 酬載區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>` 會被移除，包括從未乾淨關閉的截斷酬載
  - 降級的工具呼叫/結果鷹架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 洩漏的模型控制權杖，例如 `<|assistant|>`、其他 ASCII `<|...|>` 權杖，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` / `</minimax:tool_call>` 會被移除
- 類似認證/權杖的文字會在傳回前被遮蔽
- 長文字區塊會被截斷
- 非常大型的歷史記錄可能會捨棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列
- 此工具會報告摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

兩個工具都接受**工作階段 key**（例如 `"main"`）或先前清單呼叫中的**工作階段 ID**。

如果你需要逐位元組完全一致的逐字稿，請檢查磁碟上的逐字稿檔案，而不是將 `sessions_history` 視為原始傾印。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息傳遞到另一個工作階段，並可選擇等待回應：

- **送出即忘：** 設定 `timeoutSeconds: 0` 以排入佇列並立即傳回。
- **等待回覆：** 設定逾時並直接取得回應。

執行緒範圍的聊天工作階段，例如以 `:thread:<id>` 結尾的 Slack 或 Discord key，不是有效的 `sessions_send` 目標。請使用父頻道工作階段 key 進行代理間協調，讓工具路由的訊息不會出現在作用中的面向真人執行緒內。

訊息和 A2A 後續回覆會在接收提示（`[Inter-session message ... isUser=false]`）和逐字稿來源中標記為工作階段間資料。接收代理應將它們視為工具路由的資料，而不是直接由終端使用者撰寫的指令。

目標回應後，OpenClaw 可以執行**回覆循環**，讓代理輪流傳送訊息（最多 `session.agentToAgent.maxPingPongTurns`，範圍 0-20，預設 5）。目標代理可以回覆 `REPLY_SKIP` 以提前停止。

## 狀態與協調輔助工具

`session_status` 是目前或另一個可見工作階段的輕量級 `/status` 等效工具。它會報告使用量、時間、模型/執行階段狀態，以及存在時連結的背景任務脈絡。和 `/status` 一樣，它可以從最新逐字稿使用量項目回填稀疏的權杖/快取計數器，而 `model=default` 會清除每個工作階段的覆寫。請使用 `sessionKey="current"` 指向呼叫端的目前工作階段；可見的用戶端標籤，例如 `openclaw-tui`，不是工作階段 key。

當路由中繼資料可用時，`session_status` 也會包含可見的 `Route context` JSON 區塊，以及相符的結構化 `details` 欄位。這些欄位可區分工作階段 key 與目前處理即時執行的路由：

- `origin` 是工作階段建立的位置，或在較舊狀態缺少已儲存來源中繼資料時，從可傳遞工作階段 key 前綴推斷出的供應商。
- `active` 是目前即時執行路由。它只會針對現在正在處理的即時或目前工作階段回報。
- `deliveryContext` 是儲存在工作階段上的持久化傳遞路由，即使作用中介面不同，OpenClaw 之後仍可重複使用它進行傳遞。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以成為你正在等待的後續事件。當你希望完成結果作為下一則訊息抵達，而不是建立輪詢迴圈時，請在產生子代理後使用它。

`subagents` 是已產生 OpenClaw 子代理的可見性輔助工具。它支援 `action: "list"` 以檢查作用中/近期執行。

## 產生子代理

`sessions_spawn` 預設會為背景任務建立隔離工作階段。它一律為非阻塞；會立即傳回 `runId` 和 `childSessionKey`。原生子代理執行會在子工作階段第一則可見的 `[Subagent Task]` 訊息中收到委派任務，而系統提示只攜帶子代理執行階段規則和路由脈絡。

主要選項：

- `runtime: "subagent"`（預設）或外部線束代理使用的 `"acp"`。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 將產生動作繫結到聊天執行緒（Discord、Slack 等）。
- `sandbox: "require"` 強制子項使用沙箱。
- 當子項需要目前請求者逐字稿時，原生子代理使用 `context: "fork"`；若要乾淨的子項，請省略它或使用 `context: "isolated"`。除非 `threadBindings.defaultSpawnContext` 另有指定，否則繫結執行緒的原生子代理預設為 `context: "fork"`。

預設葉節點子代理不會取得工作階段工具。當 `maxSpawnDepth >= 2` 時，深度 1 的協調器子代理還會收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，讓它們可以管理自己的子項。葉節點執行仍不會取得遞迴協調工具。

完成後，公告步驟會將結果發佈到請求者的頻道。完成傳遞會在可用時保留繫結的執行緒/主題路由；如果完成來源只識別某個頻道，OpenClaw 仍可重複使用請求者工作階段已儲存的路由（`lastChannel` / `lastTo`）進行直接傳遞。

如需 ACP 特定行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具有範圍限制，以限制代理可看見的內容：

| 層級    | 範圍                                     |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                           |
| `tree`  | 目前工作階段 + 已產生的子代理            |
| `agent` | 此代理的所有工作階段                     |
| `all`   | 所有工作階段（若已設定，則跨代理）       |

預設為 `tree`。無論設定如何，沙箱化工作階段都會限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session) -- 路由、生命週期、維護
- [ACP 代理](/zh-TW/tools/acp-agents) -- 外部線束產生
- [多代理](/zh-TW/concepts/multi-agent) -- 多代理架構
- [閘道設定](/zh-TW/gateway/configuration) -- 工作階段工具設定控制項

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
