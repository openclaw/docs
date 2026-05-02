---
read_when:
    - 你想了解代理程式有哪些工作階段工具
    - 你想要設定跨工作階段存取或子代理生成
    - 您想檢查狀態或控制已產生的子代理
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子代理編排的代理工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-05-02T20:46:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 提供 agents 工具，用於跨 sessions 工作、檢查狀態，並
協調 sub-agents。

## 可用工具

| 工具               | 功能說明                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 列出 sessions，並可選擇性套用篩選條件（kind、label、agent、近期程度、預覽） |
| `sessions_history` | 讀取特定 session 的逐字記錄                                                 |
| `sessions_send`    | 傳送訊息到另一個 session，並可選擇性等待                                    |
| `sessions_spawn`   | 為背景工作生成隔離的 sub-agent session                                      |
| `sessions_yield`   | 結束目前回合並等待後續 sub-agent 結果                                       |
| `subagents`        | 列出、引導或終止此 session 生成的 sub-agents                                |
| `session_status`   | 顯示 `/status` 風格的卡片，並可選擇性設定每個 session 的模型覆寫            |

這些工具仍受作用中的工具設定檔與允許/拒絕
政策約束。`tools.profile: "coding"` 包含完整的 session 協調
工具組，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。
`tools.profile: "messaging"` 包含跨 session 訊息工具
（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但
不包含 sub-agent 生成。若要保留 messaging 設定檔並仍然
允許原生委派，請新增：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、供應商、沙箱，以及每個 agent 的政策，仍可在設定檔階段之後
移除這些工具。從受影響的 session 使用 `/tools` 來檢查
實際工具清單。

## 列出與讀取 sessions

`sessions_list` 會回傳 sessions 及其 key、agentId、kind、channel、model、
token 計數與時間戳。可依 kind（`main`、`group`、`cron`、`hook`、
`node`）、精確的 `label`、精確的 `agentId`、搜尋文字，或近期程度
（`activeMinutes`）進行篩選。當你需要信箱式分流時，它也可以要求為
每列提供可見性範圍內的衍生標題、最後一則訊息的預覽片段，或有界的
近期訊息。衍生標題與預覽只會針對呼叫者在已設定的 session 工具
可見性政策下原本就能看到的 sessions 產生，因此無關 sessions 會保持隱藏。

`sessions_history` 會擷取特定 session 的對話逐字記錄。
預設會排除工具結果；傳入 `includeTools: true` 可查看它們。
回傳的檢視會刻意受到範圍限制並經過安全過濾：

- assistant 文字會在召回前正規化：
  - thinking 標籤會被移除
  - `<relevant-memories>` / `<relevant_memories>` scaffolding 區塊會被移除
  - 純文字工具呼叫 XML payload 區塊，例如 `<tool_call>...</tool_call>`、
    `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和
    `<function_calls>...</function_calls>` 會被移除，包括被截斷且未能乾淨閉合的
    payloads
  - 降級的工具呼叫/結果 scaffolding，例如 `[Tool Call: ...]`、
    `[Tool Result ...]` 和 `[Historical context ...]` 會被移除
  - 洩漏的模型控制 tokens，例如 `<|assistant|>`、其他 ASCII
    `<|...|>` tokens，以及全形 `<｜...｜>` 變體會被移除
  - 格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` /
    `</minimax:tool_call>` 會被移除
- 憑證/token 類文字會在回傳前被遮蔽
- 長文字區塊會被截斷
- 非常大的 histories 可能會丟棄較舊的列，或以
  `[sessions_history omitted: message too large]` 取代過大的列
- 此工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、
  `contentTruncated`、`contentRedacted` 和 `bytes`

這兩個工具都接受 **session key**（例如 `"main"`）或先前 list 呼叫中的
**session ID**。

如果你需要逐位元組完全一致的逐字記錄，請檢查磁碟上的 transcript 檔案，
而不是把 `sessions_history` 視為原始 dump。

## 傳送跨 session 訊息

`sessions_send` 會將訊息送達另一個 session，並可選擇性等待
回應：

- **送出後不等待：** 設定 `timeoutSeconds: 0` 以排入佇列並
  立即回傳。
- **等待回覆：** 設定逾時時間並取得內嵌回應。

thread 範圍的聊天 sessions，例如以 `:thread:<id>` 結尾的 Slack 或 Discord keys，
不是有效的 `sessions_send` 目標。請使用父 channel
session key 進行 agent 間協調，讓工具路由的訊息不會出現在
作用中的面向人類 thread 內。

訊息與 A2A 後續回覆會在接收端提示中標記為 session 間資料
（`[Inter-session message ... isUser=false]`），也會在 transcript
來源中標記。接收端 agent 應將它們視為工具路由資料，而不是
直接由終端使用者撰寫的指令。

目標回應後，OpenClaw 可以執行 **回覆循環**，讓
agents 交替傳送訊息（最多 5 回合）。目標 agent 可以回覆
`REPLY_SKIP` 以提前停止。

## 狀態與協調輔助工具

`session_status` 是目前或另一個可見 session 的輕量級 `/status` 等效工具。
它會回報用量、時間、模型/runtime 狀態，以及存在時的
已連結背景任務脈絡。與 `/status` 類似，它可以從最新的 transcript 用量項目
回填稀疏的 token/cache 計數器，且
`model=default` 會清除每個 session 的覆寫。使用 `sessionKey="current"` 代表
呼叫者目前的 session；可見的用戶端標籤，例如 `openclaw-tui`，不是 session keys。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息可以是
你正在等待的後續事件。在生成 sub-agents 後，若你希望完成結果
作為下一則訊息送達，而不是建立輪詢循環，請使用它。

`subagents` 是已生成 OpenClaw
sub-agents 的控制平面輔助工具。它支援：

- `action: "list"` 檢查作用中/近期 runs
- `action: "steer"` 傳送後續指引給執行中的 child
- `action: "kill"` 停止一個 child 或 `all`

## 生成 sub-agents

`sessions_spawn` 預設會為背景任務建立隔離 session。
它一律為非阻塞；會立即回傳 `runId` 和
`childSessionKey`。

主要選項：

- `runtime: "subagent"`（預設）或 `"acp"`，用於外部 harness agents。
- `model` 和 `thinking` 覆寫，用於 child session。
- `thread: true` 將 spawn 綁定到聊天 thread（Discord、Slack 等）。
- `sandbox: "require"` 對 child 強制執行沙箱。
- 原生 sub-agents 若 child 需要目前 requester transcript，使用
  `context: "fork"`；若要乾淨的 child，請省略它或使用 `context: "isolated"`。
  thread 綁定的原生 sub-agents 預設使用 `context: "fork"`，除非
  `threadBindings.defaultSpawnContext` 另有設定。

預設的葉節點 sub-agents 不會取得 session 工具。當
`maxSpawnDepth >= 2` 時，depth-1 協調者 sub-agents 會額外收到
`sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，讓它們
可以管理自己的 children。葉節點 runs 仍不會取得遞迴
協調工具。

完成後，announce 步驟會將結果張貼到 requester 的 channel。
完成交付會在可用時保留綁定的 thread/topic 路由；若
完成來源只識別出 channel，OpenClaw 仍可重用
requester session 已儲存的路由（`lastChannel` / `lastTo`）進行直接
交付。

ACP 專屬行為請參閱 [ACP Agents](/zh-TW/tools/acp-agents)。

## 可見性

Session 工具會受到範圍限制，以限制 agent 可見的內容：

| 層級    | 範圍                                     |
| ------- | ---------------------------------------- |
| `self`  | 僅目前 session                           |
| `tree`  | 目前 session + 已生成的 sub-agents       |
| `agent` | 此 agent 的所有 sessions                 |
| `all`   | 所有 sessions（若已設定，則跨 agent）    |

預設為 `tree`。沙箱化 sessions 會固定限制為 `tree`，不論
設定如何。

## 延伸閱讀

- [Session Management](/zh-TW/concepts/session) -- 路由、生命週期、維護
- [ACP Agents](/zh-TW/tools/acp-agents) -- 外部 harness 生成
- [Multi-agent](/zh-TW/concepts/multi-agent) -- 多 agent 架構
- [Gateway Configuration](/zh-TW/gateway/configuration) -- session 工具設定旋鈕

## 相關

- [Session management](/zh-TW/concepts/session)
- [Session pruning](/zh-TW/concepts/session-pruning)
