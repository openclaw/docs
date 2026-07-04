---
read_when:
    - 你想了解代理擁有哪些工作階段工具
    - 你想要設定跨工作階段存取或產生子代理
    - 你想檢查已產生的子代理狀態
summary: 代理工具，用於跨工作階段狀態、回憶、傳訊和子代理協調
title: 工作階段工具
x-i18n:
    generated_at: "2026-07-04T20:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 讓代理能使用工具跨工作階段作業、檢查狀態，並協調子代理。

## 可用工具

| 工具               | 功能                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用選用篩選條件列出工作階段（類型、標籤、代理、封存、預覽）                |
| `sessions_history` | 讀取特定工作階段的逐字稿                                                    |
| `sessions_send`    | 傳送訊息到另一個工作階段，並可選擇等待                                      |
| `sessions_spawn`   | 產生隔離的子代理工作階段，用於背景作業                                      |
| `sessions_yield`   | 結束目前回合並等待後續子代理結果                                            |
| `subagents`        | 列出此工作階段中已產生的子代理狀態                                          |
| `session_status`   | 顯示類似 `/status` 的卡片，並可選擇設定每工作階段的模型覆寫                 |

這些工具仍受作用中的工具設定檔與允許/拒絕政策約束。`tools.profile: "coding"` 包含完整的工作階段協調工具集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨工作階段訊息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含產生子代理。若要保留訊息設定檔並仍允許原生委派，請加入：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、供應商、沙箱和每代理政策仍可在設定檔階段後移除這些工具。請在受影響的工作階段使用 `/tools` 檢查有效工具清單。

## 列出與讀取工作階段

`sessions_list` 會傳回工作階段及其鍵、agentId、類型、頻道、模型、權杖計數和時間戳記。可依類型（`main`、`group`、`cron`、`hook`、`node`）、精確 `label`、精確 `agentId`、搜尋文字或新近度（`activeMinutes`）篩選。預設會傳回作用中工作階段；傳入 `archived: true` 可檢查已封存工作階段。列會包含其釘選和封存狀態。需要信箱式分流時，也可以要求每列提供可見性範圍內衍生的標題、最後訊息預覽片段，或有界限的近期訊息。衍生標題和預覽只會針對呼叫者在已設定的工作階段工具可見性政策下已可看見的工作階段產生，因此不相關的工作階段會維持隱藏。當可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示有效模式及結果可能受範圍限制的警告。

`sessions_history` 會擷取特定工作階段的對話逐字稿。預設會排除工具結果；傳入 `includeTools: true` 可查看它們。使用 `limit` 取得最新的有界尾端。需要分頁中繼資料時傳入 `offset: 0`，再傳入傳回的 `nextOffset` 值，即可向後翻頁瀏覽較舊的 OpenClaw 逐字稿視窗，而不需讀取原始逐字稿檔案。明確的偏移頁面不會合併外部命令列介面備援匯入；需要該合併顯示歷史時，請使用預設的最新尾端檢視。
傳回的檢視刻意受到界限限制並經過安全篩選：

- 助理文字會在召回前正規化：
  - thinking 標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` 鷹架區塊會被移除
  - 純文字工具呼叫 XML 酬載區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>` 會被移除，包括從未乾淨關閉的截斷酬載
  - 降級的工具呼叫/結果鷹架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 洩漏的模型控制權杖，例如 `<|assistant|>`、其他 ASCII `<|...|>` 權杖，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` / `</minimax:tool_call>` 會被移除
- 類似憑證/權杖的文字會在傳回前遮蔽
- 長文字區塊會被截斷
- 非常大的歷史紀錄可能會捨棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列
- 工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes`，以及分頁中繼資料

兩個工具都接受 **工作階段鍵**（例如 `"main"`）或先前清單呼叫中的 **工作階段 ID**。

如果需要逐位元組完全一致的逐字稿，請檢查磁碟上的逐字稿檔案，而不是把 `sessions_history` 視為原始傾印。

## 傳送跨工作階段訊息

`sessions_send` 會把訊息遞送到另一個工作階段，並可選擇等待回應：

- **發送後即忘：** 設定 `timeoutSeconds: 0` 以排入佇列並立即傳回。
- **等待回覆：** 設定逾時並內嵌取得回應。

執行緒範圍的聊天工作階段，例如 Slack 或 Discord 中以 `:thread:<id>` 結尾的鍵，不是有效的 `sessions_send` 目標。請使用父頻道工作階段鍵進行代理間協調，讓工具路由的訊息不會出現在作用中的面向真人執行緒內。

訊息和 A2A 後續回覆會在接收提示（`[Inter-session message ... isUser=false]`）和逐字稿來源中標記為跨工作階段資料。接收代理應將其視為工具路由資料，而不是直接由終端使用者撰寫的指示。

目標回應後，OpenClaw 可以執行 **回覆回傳迴圈**，讓代理交替傳送訊息（最多 `session.agentToAgent.maxPingPongTurns`，範圍 0-20，預設 5）。目標代理可以回覆 `REPLY_SKIP` 以提前停止。

## 狀態與協調輔助工具

`session_status` 是目前或另一個可見工作階段的輕量 `/status` 對等工具。它會回報用量、時間、模型/執行階段狀態，以及存在時的已連結背景工作脈絡。與 `/status` 一樣，它可以從最新逐字稿用量項目回填稀疏的權杖/快取計數器，而 `model=default` 會清除每工作階段覆寫。使用 `sessionKey="current"` 代表呼叫者目前的工作階段；可見的用戶端標籤，例如 `openclaw-tui`，不是工作階段鍵。

當路由中繼資料可用時，`session_status` 也會包含可見的 `Route context` JSON 區塊和相符的結構化 `details` 欄位。這些欄位可區分工作階段鍵與目前正在處理即時執行的路由：

- `origin` 是工作階段建立的位置，或當較舊狀態缺少已儲存的 origin 中繼資料時，從可遞送工作階段鍵前綴推斷出的供應商。
- `active` 是目前的即時執行路由。只有正在處理中的即時或目前工作階段才會回報。
- `deliveryContext` 是儲存在工作階段上的持久遞送路由，即使作用中介面不同，OpenClaw 之後仍可重用它進行遞送。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以是你正在等待的後續事件。當你希望完成結果作為下一則訊息抵達，而不是建立輪詢迴圈時，請在產生子代理後使用它。

`subagents` 是已產生 OpenClaw 子代理的可見性輔助工具。它支援 `action: "list"` 以檢查作用中/近期執行。

## 產生子代理

`sessions_spawn` 預設會為背景工作建立隔離工作階段。它一律為非阻塞；會立即傳回 `runId` 和 `childSessionKey`。原生子代理執行會在子工作階段第一則可見的 `[Subagent Task]` 訊息中接收委派工作，而系統提示只承載子代理執行階段規則和路由脈絡。

主要選項：

- `runtime: "subagent"`（預設）或 `"acp"` 用於外部工具鏈代理。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 用於將產生綁定到聊天執行緒（Discord、Slack 等）。
- `sandbox: "require"` 用於在子項上強制沙箱。
- `context: "fork"` 用於原生子代理，當子項需要目前請求者逐字稿時使用；若要乾淨的子項，請省略它或使用 `context: "isolated"`。
  綁定執行緒的原生子代理預設為 `context: "fork"`，除非 `threadBindings.defaultSpawnContext` 另有指定。

預設葉節點子代理不會取得工作階段工具。當 `maxSpawnDepth >= 2` 時，第 1 層深度的協調者子代理會額外收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子項。葉節點執行仍不會取得遞迴協調工具。

完成後，公告步驟會將結果張貼到請求者的頻道。完成遞送會在可用時保留已綁定的執行緒/主題路由；若完成 origin 只識別頻道，OpenClaw 仍可重用請求者工作階段已儲存的路由（`lastChannel` / `lastTo`）進行直接遞送。

如需 ACP 專屬行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具會受範圍限制，以限制代理可看見的內容：

| 層級    | 範圍                                     |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                           |
| `tree`  | 目前工作階段 + 已產生的子代理            |
| `agent` | 此代理的所有工作階段                     |
| `all`   | 所有工作階段（若已設定，則跨代理）       |

預設為 `tree`。沙箱工作階段無論設定如何都會被限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session) -- 路由、生命週期、維護
- [ACP 代理](/zh-TW/tools/acp-agents) -- 外部工具鏈產生
- [多代理](/zh-TW/concepts/multi-agent) -- 多代理架構
- [閘道設定](/zh-TW/gateway/configuration) -- 工作階段工具設定旋鈕

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
