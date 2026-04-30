---
read_when:
    - 你想了解該代理有哪些工作階段工具
    - 您想設定跨工作階段存取或產生子代理
    - 你想檢查狀態或控制已啟動的子代理程式
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子 Agent 編排的 Agent 工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-04-30T03:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 讓代理程式具備跨工作階段工作、檢查狀態，以及
編排子代理程式的工具。

## 可用工具

| 工具               | 功能                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 使用選用篩選條件（種類、標籤、代理程式、近期程度、預覽）列出工作階段      |
| `sessions_history` | 讀取特定工作階段的逐字記錄                                                  |
| `sessions_send`    | 傳送訊息到另一個工作階段，並可選擇等待                                      |
| `sessions_spawn`   | 產生隔離的子代理程式工作階段以進行背景工作                                  |
| `sessions_yield`   | 結束目前回合並等待後續子代理程式結果                                        |
| `subagents`        | 列出、導引或終止此工作階段產生的子代理程式                                  |
| `session_status`   | 顯示 `/status` 風格的卡片，並可選擇設定每個工作階段的模型覆寫              |

這些工具仍受作用中的工具設定檔與允許/拒絕
政策限制。`tools.profile: "coding"` 包含完整的工作階段編排
集合，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨工作階段傳訊工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含子代理程式產生。若要保留傳訊設定檔並仍
允許原生委派，請加入：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、供應商、沙箱和每個代理程式的政策仍可在
設定檔階段之後移除這些工具。請從受影響的工作階段使用 `/tools` 來檢查
有效的工具清單。

## 列出並讀取工作階段

`sessions_list` 會傳回工作階段及其鍵、agentId、種類、頻道、模型、
權杖計數和時間戳記。可依種類（`main`、`group`、`cron`、`hook`、
`node`）、精確 `label`、精確 `agentId`、搜尋文字，或近期程度
（`activeMinutes`）篩選。當你需要信箱式分流時，它也可以要求
依可見性範圍產生的衍生標題、最後訊息的預覽片段，或每列有界限的
近期訊息。衍生標題和預覽只會針對呼叫者在已設定的工作階段工具
可見性政策下已能看見的工作階段產生，因此不相關的工作階段會保持隱藏。

`sessions_history` 會擷取特定工作階段的對話逐字記錄。
預設會排除工具結果 -- 傳入 `includeTools: true` 即可查看。
傳回的檢視刻意設有界限並經過安全篩選：

- 助理文字會在回想前正規化：
  - thinking 標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` 鷹架區塊會被移除
  - 純文字工具呼叫 XML 承載區塊，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 會被移除，包括從未乾淨關閉的
    截斷承載
  - 降級的工具呼叫/結果鷹架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 外洩的模型控制權杖，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` 權杖，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 會被移除
- 憑證/類似權杖的文字會在傳回前遮蔽
- 長文字區塊會被截斷
- 非常大的歷史記錄可能會捨棄較舊的列，或將過大的列替換為
  `[sessions_history omitted: message too large]`
- 此工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

兩個工具都接受 **工作階段鍵**（如 `"main"`）或先前列表呼叫取得的
**工作階段 ID**。

如果你需要逐位元組完全一致的逐字記錄，請檢查磁碟上的逐字記錄檔案，
而不是將 `sessions_history` 視為原始傾印。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息傳遞到另一個工作階段，並可選擇等待
回應：

- **發後不理：** 設定 `timeoutSeconds: 0` 以加入佇列並立即傳回。
- **等待回覆：** 設定逾時時間並內嵌取得回應。

訊息與 A2A 後續回覆會在接收提示（`[Inter-session message ... isUser=false]`）
以及逐字記錄來源中標記為工作階段間資料。接收代理程式應將其視為
工具路由資料，而不是終端使用者直接撰寫的指令。

目標回應後，OpenClaw 可以執行 **回覆返回迴圈**，讓
代理程式交替傳送訊息（最多 5 個回合）。目標代理程式可以回覆
`REPLY_SKIP` 以提前停止。

## 狀態與編排輔助工具

`session_status` 是目前或另一個可見工作階段的輕量 `/status` 等效工具。
它會在存在時回報使用量、時間、模型/執行階段狀態，以及
連結的背景工作內容。和 `/status` 一樣，它可以從最新逐字記錄使用量項目
回填稀疏的權杖/快取計數器，且 `model=default` 會清除每個工作階段的覆寫。
對呼叫者目前工作階段使用 `sessionKey="current"`；可見的用戶端標籤，
例如 `openclaw-tui`，不是工作階段鍵。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以是
你正在等待的後續事件。在產生子代理程式後，若你希望完成結果作為
下一則訊息抵達，而不是建立輪詢迴圈，請使用它。

`subagents` 是已產生 OpenClaw 子代理程式的控制平面輔助工具。
它支援：

- `action: "list"` 以檢查作用中/近期執行
- `action: "steer"` 以傳送後續指引給執行中的子項
- `action: "kill"` 以停止一個子項或 `all`

## 產生子代理程式

`sessions_spawn` 預設會為背景工作建立隔離的工作階段。
它一律非阻塞 -- 會立即傳回 `runId` 和
`childSessionKey`。

主要選項：

- `runtime: "subagent"`（預設）或外部控管代理程式的 `"acp"`。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 將產生作業綁定到聊天討論串（Discord、Slack 等）。
- `sandbox: "require"` 對子項強制執行沙箱。
- 原生子代理程式在子項需要目前
  請求者逐字記錄時使用 `context: "fork"`；若要乾淨的子項，請省略或使用 `context: "isolated"`。

預設的葉節點子代理程式不會取得工作階段工具。當
`maxSpawnDepth >= 2` 時，深度 1 的編排器子代理程式會額外收到
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，使其
可以管理自己的子項。葉節點執行仍不會取得遞迴
編排工具。

完成後，公告步驟會將結果張貼到請求者的頻道。
完成傳遞會在可用時保留已綁定的討論串/主題路由，而如果
完成來源只識別出頻道，OpenClaw 仍可重用
請求者工作階段已儲存的路由（`lastChannel` / `lastTo`）進行直接
傳遞。

ACP 專屬行為請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具會限定範圍，以限制代理程式可看見的內容：

| 層級    | 範圍                                    |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                          |
| `tree`  | 目前工作階段 + 已產生的子代理程式       |
| `agent` | 此代理程式的所有工作階段                |
| `all`   | 所有工作階段（若已設定則跨代理程式）    |

預設為 `tree`。沙箱化工作階段不論設定如何，都會限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session) -- 路由、生命週期、維護
- [ACP 代理程式](/zh-TW/tools/acp-agents) -- 外部控管產生
- [多代理程式](/zh-TW/concepts/multi-agent) -- 多代理程式架構
- [Gateway 設定](/zh-TW/gateway/configuration) -- 工作階段工具設定旋鈕

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
