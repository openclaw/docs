---
read_when:
    - 你想瞭解代理程式有哪些工作階段工具
    - 你想要設定跨工作階段存取或產生子代理程式
    - 你想要檢查已啟動子代理程式的狀態
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子代理程式協調的代理程式工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-07-12T14:29:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 為代理提供可跨工作階段運作、檢查狀態及協調子代理的工具。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 依選用篩選條件（種類、標籤、代理、封存、預覽）列出工作階段  |
| `sessions_history` | 讀取特定工作階段的對話記錄                                   |
| `sessions_send`    | 傳送訊息至另一個工作階段，並可選擇等待回應                       |
| `sessions_spawn`   | 產生隔離的子代理工作階段以執行背景工作                     |
| `sessions_yield`   | 結束目前回合，並等待後續子代理結果               |
| `subagents`        | 列出此工作階段產生的子代理狀態                              |
| `session_status`   | 顯示 `/status` 樣式的資訊卡，並可選擇設定個別工作階段的模型覆寫值 |

這些工具仍受有效工具設定檔及允許／拒絕政策約束。`tools.profile: "coding"` 包含完整的工作階段協調工具集，包括 `sessions_spawn`、`sessions_yield` 及 `subagents`。`tools.profile: "messaging"` 包含跨工作階段訊息工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子代理產生功能。若要保留訊息設定檔，同時仍允許原生委派，請新增：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群組、提供者、沙箱及個別代理政策仍可在設定檔階段後移除這些工具。請從受影響的工作階段使用 `/tools` 檢查實際生效的工具清單。

## 列出及讀取工作階段

`sessions_list` 會傳回工作階段的索引鍵、agentId、種類、頻道、模型、權杖計數及時間戳記。可依 `kinds`（陣列；接受的值：`main`、`group`、`cron`、`hook`、`node`、`other`）、完全相符的 `label`、完全相符的 `agentId`、`search` 文字或近期活動時間（`activeMinutes`）篩選。預設傳回使用中的工作階段；若要改為檢查已封存的工作階段，請傳入 `archived: true`。資料列包含 `pinned` 及 `archived` 狀態。需要信箱式分類時，請設定 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限為 20）：分別取得受可見性範圍限制的衍生標題、最後一則訊息的預覽片段，或各資料列中數量有限的近期訊息。只有呼叫者依設定的工作階段工具可見性政策原本就能看到的工作階段，才會產生衍生標題與預覽，因此不相關的工作階段仍會隱藏。可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示實際生效的模式，並警告結果可能受範圍限制。

`sessions_history` 會擷取特定工作階段的對話記錄。預設不包含工具結果；傳入 `includeTools: true` 即可查看。使用 `limit` 取得數量有限的最新尾端記錄。需要分頁中繼資料時，請傳入 `offset: 0`，接著傳入所傳回的 `nextOffset` 值，向後翻閱較舊的 OpenClaw 對話記錄區段，而不必讀取原始對話記錄檔。明確指定偏移量的頁面不會合併外部命令列介面備援匯入內容；需要合併後的顯示歷程時，請使用預設的最新尾端檢視（不指定 `offset`）。

傳回的檢視刻意限制大小，並經過安全篩選：

- 助理文字會先正規化再供回顧：
  - 移除思考標籤
  - 移除 `<relevant-memories>` / `<relevant_memories>` 鷹架區塊
  - 移除純文字工具呼叫 XML 承載內容區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 及 `<function_calls>...</function_calls>`，包括始終未正確閉合的截斷承載內容
  - 移除降級後的工具呼叫／結果鷹架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 及 `[Historical context ...]`
  - 移除外洩的模型控制權杖，例如 `<|assistant|>`、其他 ASCII `<|...|>` 權杖及全形 `<｜...｜>` 變體
  - 移除格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>` / `</minimax:tool_call>`
- 類似認證資訊／權杖的文字會在傳回前遮蔽
- 過長的文字區塊會遭截斷
- 極大的歷程可能會捨棄較舊的資料列，或以 `[sessions_history omitted: message too large]` 取代過大的資料列
- 工具會報告摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes` 及分頁中繼資料

兩項工具都接受**工作階段索引鍵**（例如 `"main"`），或先前清單呼叫所取得的**工作階段 ID**。

如果需要完全精確的原始對話記錄，請檢查範圍內的 SQLite 對話記錄資料列，而不要將 `sessions_history` 視為未經篩選的傾印。

## 傳送跨工作階段訊息

`sessions_send` 會將訊息傳送至另一個工作階段，並可選擇等待回應：

- **傳送後即不再等待：** 將 `timeoutSeconds: 0` 設為排入佇列並立即傳回。
- **等待回覆：** 設定逾時時間，並直接取得回應。

執行緒範圍的聊天工作階段，例如索引鍵以 `:thread:<id>` 結尾者，不能作為 `sessions_send` 的目標。代理間協調應使用上層頻道工作階段索引鍵，以免經工具路由的訊息出現在進行中的使用者可見執行緒內。

訊息及 A2A 後續回覆會在接收端提示詞（`[Inter-session message ... isUser=false]`）與對話記錄來源資訊中標示為工作階段間資料。接收代理應將其視為經工具路由的資料，而非終端使用者直接撰寫的指示。

目標回應後，OpenClaw 可執行**回覆循環**，讓代理交替傳送訊息（最多 `session.agentToAgent.maxPingPongTurns` 次，範圍 0-20，預設為 5）。目標代理可回覆 `REPLY_SKIP` 提前停止。

## 狀態及協調輔助工具

`session_status` 是目前工作階段或另一個可見工作階段的輕量 `/status` 對應工具。它會報告用量、時間、模型／執行階段狀態，以及存在時所連結的背景工作內容。與 `/status` 相同，它可從最新的對話記錄用量項目回填缺少的權杖／快取計數器，而 `model=default` 會清除個別工作階段的覆寫值。呼叫者的目前工作階段請使用 `sessionKey="current"`；`openclaw-tui` 等可見的用戶端標籤並非工作階段索引鍵。

有可用的路由中繼資料時，`session_status` 也會包含可見的 `Route context` JSON 區塊，以及相符的結構化 `details` 欄位。這些欄位可區分工作階段索引鍵與目前處理即時執行的路由：

- `origin` 是工作階段的建立位置；若舊狀態缺少已儲存的來源中繼資料，則為從可傳遞工作階段索引鍵前綴推斷的提供者。
- `active` 是目前的即時執行路由。僅會針對目前正處理的即時或目前工作階段報告。
- `deliveryContext` 是儲存在工作階段中的持久化傳遞路由，即使目前介面不同，OpenClaw 仍可在稍後傳遞時重複使用。

## 工作階段狀態變更

OpenClaw 會盡力保留所選工作階段狀態變更的訊號記錄：直接傳送至子工作階段的真人訊息、子執行完成或失敗、建立子項目、目標變更及壓縮。取消及逾時的子執行會記錄為失敗，事件承載內容中會保留具體結果（`cancelled`、`timeout` 或 `error`）。記錄僅包含中繼資料及單行摘要，絕不包含訊息內容。其 `stateVersion` 是工作階段的訊號記錄表頭，而非交易式變更資料擷取版本；工作階段儲存區變更與訊號附加使用不同的儲存空間，因此附加失敗會記錄下來，但不會導致原始回合失敗。

`sessions_list` 會在具有已記錄變更的資料列中包含 `stateVersion`。`session_status` 一律會在結構化詳細資料中傳回 `stateVersion`。傳入 `changesSince: <previousStateVersion>` 可擷取該版本之後最多 200 個保留事件；此讀取不會確認或推進上層通知游標。`historyGap: true` 結果表示要求的版本早於保留的歷程，因此應重新整理整個工作階段狀態，而不要將回應視為精確差異。

當另一個動作者直接向受監看子項目傳送真人回合或變更其目標時，上層會收到系統通知，要求以最後看過的版本呼叫 `session_status`。主要工作階段的上層會被主動喚醒。巢狀子代理的上層則會在下一回合收到通知，因為心跳偵測路由無法直接以其佇列為目標。一般子執行完成的傳遞仍由完成公告負責。

歷程限制為 30 天及 50,000 個資料列，而個別工作階段表頭在修剪後仍維持單調遞增。通知傳遞使用閘道的記憶體內系統事件佇列，並假設由單一閘道程序負責共用狀態資料庫的傳遞。多個閘道仍會共用持久化記錄及 `changesSince` 協調介面，但 v1 不會跨程序推送通知。上層通知需要具代理資格的上層工作階段索引鍵；在 `session.scope="global"` 下，共用的 `global` 索引鍵在各代理間含義不明，因此這些上層可取得持久化記錄及 `changesSince`，但在 v1 中不會收到主動通知。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息成為你等待的後續事件。產生子代理後，若希望完成結果作為下一則訊息送達，而非建立輪詢循環，請使用此工具。

`subagents` 是已產生 OpenClaw 子代理的可見性輔助工具。它支援 `action: "list"`，用於檢查進行中／近期的執行。

## 產生子代理

`sessions_spawn` 預設會為背景工作建立隔離的工作階段。它一律不阻塞；會立即傳回 `runId` 及 `childSessionKey`。原生子代理執行會在子工作階段第一則可見的 `[Subagent Task]` 訊息中收到委派工作，而系統提示詞只包含子代理執行階段規則及路由內容。

主要選項：

- `runtime: "subagent"`（預設）或用於外部控管代理的 `"acp"`。
- 子工作階段的 `model` 及 `thinking` 覆寫值。
- `thread: true`，將產生作業繫結至聊天執行緒（Discord、Slack 等）。
- `sandbox: "require"`，強制對子項目使用沙箱。
- 原生子代理需要目前請求者的對話記錄時，使用 `context: "fork"`；若需要乾淨的子項目，則省略它或使用 `context: "isolated"`。`context: "fork"` 僅適用於 `runtime: "subagent"`。除非 `threadBindings.defaultSpawnContext` 另有設定，繫結執行緒的原生子代理預設使用 `context: "fork"`。

預設的葉節點子代理無法使用工作階段工具。當 `maxSpawnDepth >= 2` 時，深度 1 的協調器子代理還會收到 `sessions_spawn`、`subagents`、`sessions_list` 及 `sessions_history`，以便管理自己的子項目。葉節點執行仍無法使用遞迴協調工具。

完成後，公告步驟會將結果發佈至請求者的頻道。有可用的繫結執行緒／主題路由時，完成傳遞會予以保留；如果完成來源僅識別頻道，OpenClaw 仍可重複使用請求者工作階段所儲存的路由（`lastChannel` / `lastTo`）進行直接傳遞。

如需 ACP 特有的行為，請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具具有範圍限制，以約束代理可見的內容：

| 層級   | 範圍                                    |
| ------- | ---------------------------------------- |
| `self`  | 僅目前工作階段                 |
| `tree`  | 目前工作階段與產生的子代理     |
| `agent` | 此代理的所有工作階段              |
| `all`   | 所有工作階段（若已設定，則可跨代理） |

預設值為 `tree`。無論設定為何，沙箱化工作階段都會限制為 `tree`。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session)：路由、生命週期、維護
- [子代理程式](/zh-TW/tools/subagents)：子工作階段的生命週期與傳遞
- [ACP 代理程式](/zh-TW/tools/acp-agents)：生成外部執行框架
- [多代理程式](/zh-TW/concepts/multi-agent)：多代理程式架構
- [閘道設定](/zh-TW/gateway/configuration)：工作階段工具設定選項

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
