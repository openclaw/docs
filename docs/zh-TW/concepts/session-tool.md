---
read_when:
    - 你想了解代理有哪些工作階段工具
    - 你想要設定跨工作階段存取或啟動子代理程式
    - 你想要檢查狀態或控制已產生的子代理
summary: 用於跨工作階段狀態、回憶、訊息傳遞和子代理程式編排的代理程式工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-05-11T20:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 讓代理具備跨工作階段作業、檢查狀態，以及
協調子代理的工具。

## 可用工具

| 工具               | 功能                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出工作階段，可選用篩選條件（種類、標籤、代理、近期程度、預覽）           |
| `sessions_history` | 讀取特定工作階段的逐字記錄                                                  |
| `sessions_send`    | 傳送訊息到另一個工作階段，並可選擇等待                                      |
| `sessions_spawn`   | 產生隔離的子代理工作階段以執行背景工作                                      |
| `sessions_yield`   | 結束目前回合並等待後續子代理結果                                            |
| `subagents`        | 列出、導引或終止此工作階段產生的子代理                                      |
| `session_status`   | 顯示 `/status` 風格的卡片，並可選擇設定每個工作階段的模型覆寫              |

這些工具仍受作用中的工具設定檔與允許/拒絕
政策約束。`tools.profile: "coding"` 包含完整的工作階段協調
集合，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨工作階段訊息工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含子代理產生。若要保留訊息設定檔並且仍允許原生委派，請加入：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、提供者、沙箱和每個代理的政策仍可在設定檔階段之後移除這些工具。
請從受影響的工作階段使用 `/tools` 來檢查
實際工具清單。

## 列出和讀取工作階段

`sessions_list` 會回傳工作階段及其 key、agentId、種類、頻道、模型、
權杖計數和時間戳記。可依種類（`main`、`group`、`cron`、`hook`、
`node`）、精確 `label`、精確 `agentId`、搜尋文字或近期程度
（`activeMinutes`）篩選。當你需要信箱式分流時，它也可以要求在每一列提供
可見性範圍內衍生的標題、最後一則訊息預覽片段，或有界的
近期訊息。衍生標題與預覽只會為呼叫者在已設定的工作階段工具
可見性政策下已可看見的工作階段產生，因此不相關的工作階段會維持隱藏。

`sessions_history` 會擷取特定工作階段的對話逐字記錄。
預設會排除工具結果 -- 傳入 `includeTools: true` 即可查看。
回傳的檢視刻意採用有界且經安全篩選的形式：

- assistant 文字會在回憶前正規化：
  - thinking 標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` 鷹架區塊會被移除
  - 純文字工具呼叫 XML 酬載區塊，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 會被移除，包括從未乾淨關閉的
    截斷酬載
  - 降級的工具呼叫/結果鷹架，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 外洩的模型控制權杖，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` 權杖，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 會被移除
- 類似認證/權杖的文字會在回傳前被遮蔽
- 長文字區塊會被截斷
- 非常大的歷史記錄可能會丟棄較舊列，或以
  `[sessions_history omitted: message too large]` 取代過大的列
- 此工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

兩個工具都接受 **工作階段 key**（例如 `"main"`）或先前列表呼叫中的
**工作階段 ID**。

如果你需要逐位元組完全相同的逐字記錄，請檢查磁碟上的逐字記錄檔案，
而不是把 `sessions_history` 當作原始傾印。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息傳送到另一個工作階段，並可選擇等待
回應：

- **送出後不等待：** 設定 `timeoutSeconds: 0` 以排入佇列並
  立即回傳。
- **等待回覆：** 設定逾時並取得內嵌回應。

執行緒範圍的聊天工作階段，例如 Slack 或 Discord 中以
`:thread:<id>` 結尾的 key，不是有效的 `sessions_send` 目標。請使用父頻道
工作階段 key 進行代理間協調，讓工具路由的訊息不會出現在
作用中的面向真人的執行緒內。

訊息與 A2A 後續回覆會在接收提示詞中標記為工作階段間資料
（`[Inter-session message ... isUser=false]`），也會在逐字記錄
來源中標記。接收代理應將它們視為工具路由資料，而不是
直接由終端使用者撰寫的指令。

目標回應後，OpenClaw 可以執行 **回覆迴圈**，讓
代理交替傳送訊息（最多 `session.agentToAgent.maxPingPongTurns`，範圍
0-20，預設 5）。目標代理可以回覆
`REPLY_SKIP` 以提前停止。

## 狀態與協調輔助工具

`session_status` 是目前工作階段或另一個可見工作階段的輕量
`/status` 等效工具。它會回報使用量、時間、模型/執行時狀態，以及
存在時的已連結背景任務脈絡。與 `/status` 一樣，它可以從最新逐字記錄使用量項目
回填稀疏的權杖/快取計數，且
`model=default` 會清除每個工作階段的覆寫。請對呼叫者目前的工作階段使用
`sessionKey="current"`；像 `openclaw-tui` 這類可見用戶端標籤
不是工作階段 key。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以是
你正在等待的後續事件。在產生子代理後使用它，當你希望完成結果
作為下一則訊息抵達，而不是建立輪詢迴圈時。

`subagents` 是已產生 OpenClaw
子代理的控制平面輔助工具。它支援：

- `action: "list"` 用於檢查作用中/近期執行
- `action: "steer"` 用於傳送後續指引給正在執行的子項
- `action: "kill"` 用於停止一個子項或 `all`

## 產生子代理

`sessions_spawn` 預設會為背景任務建立隔離的工作階段。
它一律為非阻塞 -- 會立即回傳 `runId` 和
`childSessionKey`。

主要選項：

- `runtime: "subagent"`（預設）或 `"acp"`，用於外部 harness 代理。
- 子工作階段的 `model` 和 `thinking` 覆寫。
- `thread: true` 用於將產生動作繫結到聊天執行緒（Discord、Slack 等）。
- `sandbox: "require"` 用於強制子項使用沙箱。
- 當子項需要目前請求者逐字記錄時，原生子代理可使用 `context: "fork"`；
  若需要乾淨的子項，請省略它或使用 `context: "isolated"`。
  繫結執行緒的原生子代理預設為 `context: "fork"`，除非
  `threadBindings.defaultSpawnContext` 另有指定。

預設葉節點子代理不會取得工作階段工具。當
`maxSpawnDepth >= 2` 時，深度 1 的協調器子代理還會收到
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，讓它們
可以管理自己的子項。葉節點執行仍然不會取得遞迴
協調工具。

完成後，公告步驟會將結果發佈到請求者的頻道。
完成傳遞會在可用時保留繫結的執行緒/主題路由，而且如果
完成來源只識別頻道，OpenClaw 仍可重用
請求者工作階段儲存的路由（`lastChannel` / `lastTo`）進行直接
傳遞。

如需 ACP 特定行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具會限定範圍，以限制代理可以看見的內容：

| 層級    | 範圍                                     |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                           |
| `tree`  | 目前工作階段 + 產生的子代理              |
| `agent` | 此代理的所有工作階段                     |
| `all`   | 所有工作階段（若已設定，則跨代理）       |

預設為 `tree`。沙箱化工作階段無論設定為何都會被限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session) -- 路由、生命週期、維護
- [ACP 代理](/zh-TW/tools/acp-agents) -- 外部 harness 產生
- [多代理](/zh-TW/concepts/multi-agent) -- 多代理架構
- [Gateway 設定](/zh-TW/gateway/configuration) -- 工作階段工具設定旋鈕

## 相關

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
