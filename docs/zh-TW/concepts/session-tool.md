---
read_when:
    - 你想了解代理程式具備哪些工作階段工具
    - 你想要設定跨工作階段存取或產生子代理程式
    - 你想要檢查已啟動子代理程式的狀態
summary: 用於跨工作階段狀態、回憶、訊息傳遞與子代理程式協調的代理程式工具
title: 工作階段工具
x-i18n:
    generated_at: "2026-07-20T00:48:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ceaf48addc9fc57afe2f6428cda03ed8b19f4efce93b13b58b7ef493a41c62fe
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw 為代理提供跨工作階段作業、檢查狀態及協調子代理的工具。

## 可用工具

| 工具                 | 功能                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| `sessions`           | 修補可見的工作階段設定，並管理全域工作階段群組目錄                          |
| `sessions_list`      | 使用選用篩選條件（種類、標籤、代理、封存、預覽）列出工作階段                |
| `sessions_search`    | 搜尋可見的工作階段逐字記錄，並傳回相符的摘錄                                |
| `sessions_history`   | 讀取特定工作階段的逐字記錄                                                  |
| `sessions_send`      | 在同一個閘道上執行另一個工作階段，並可選擇等待                              |
| `conversations_list` | 列出穩定的外部對話位址                                                      |
| `conversations_send` | 傳送至一個確切的外部對話，而不執行本機工作階段                              |
| `conversations_turn` | 傳送至一個確切的外部對話，並等待其關聯回覆                                  |
| `sessions_spawn`     | 產生隔離的子代理工作階段以執行背景工作                                      |
| `sessions_yield`     | 結束目前回合，並等待後續子代理結果                                          |
| `subagents`          | 列出或取消此工作階段樹中的背景工作                                          |
| `session_status`     | 顯示 `/status` 樣式的卡片，並可選擇設定個別工作階段的模型覆寫 |

這些工具仍受作用中工具設定檔及允許／拒絕原則約束。`tools.profile: "coding"` 包含完整的工作階段協調工具組。`tools.profile: "messaging"` 包含工作階段自助服務、探索、回想、跨工作階段訊息、外部對話工具，以及完整的產生生命週期（`sessions_spawn`、`sessions_yield` 和 `subagents`）。僅限 UI 的工作建議工具 `spawn_task` 和 `dismiss_task` 仍屬於程式設計設定檔工具。

群組、提供者、沙箱及個別代理原則仍可在設定檔階段之後移除這些工具。請從受影響的工作階段使用 `/tools`，以檢查實際生效的工具清單。

## 列出及讀取工作階段

`sessions_list` 會傳回聚焦的探索資料列：工作階段索引鍵、代理、種類、頻道、標籤／標題／預覽欄位、父子關係、上次更新、封存／釘選狀態、狀態版本、模型、內容／總 Token 數、執行狀態，以及上次執行是否中止。可依 `kinds`（陣列；接受的值：`main`、`group`、`cron`、`hook`、`node`、`other`）、完全相符的 `label`、完全相符的 `agentId`、`search` 文字或最近時間（`activeMinutes`）進行篩選。預設會傳回作用中的工作階段；若要改為檢查已封存的工作階段，請傳入 `archived: true`。需要信箱式分類處理時，請設定 `includeDerivedTitles`、`includeLastMessage` 或 `messageLimit`（上限為 20）：由可見性範圍限定的衍生標題、上一則訊息的預覽片段，或各資料列中數量受限的近期訊息。系統會刻意省略傳遞路由、內部工作階段 ID、個別執行的計時／設定、成本估算及逐字記錄路徑；如需這些擁有者專屬的詳細資料，請使用 `session_status`、對話工具及 `sessions_history`。只有呼叫者依已設定的工作階段工具可見性原則本來就能看見的工作階段，才會產生衍生標題及預覽，因此不相關的工作階段會保持隱藏。可見性受限時，`sessions_list` 會傳回選用的 `visibility` 中繼資料，顯示實際生效的模式，並警告結果可能受範圍限制。

`sessions_history` 會擷取特定工作階段的對話逐字記錄。預設不包含工具結果；請傳入 `includeTools: true` 以查看這些結果。使用 `limit` 可取得數量受限的最新尾端內容。需要分頁中繼資料時，請傳入 `offset: 0`，然後將傳回的 `nextOffset` 值傳入，以向後翻閱較舊的 OpenClaw 逐字記錄視窗，而無須讀取原始逐字記錄檔案。明確指定偏移量的頁面不會合併外部命令列介面備援匯入；需要該合併顯示歷程時，請使用預設的最新尾端檢視（不含 `offset`）。

傳回的檢視會刻意限制大小並進行安全篩選：

- 回想前會正規化助理文字：
  - 移除思考標籤
  - 移除 `<relevant-memories>`／`<relevant_memories>` 框架區塊
  - 移除純文字工具呼叫 XML 承載資料區塊，例如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`，包括從未正確結束的截斷承載資料
  - 移除降級的工具呼叫／結果框架，例如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]`
  - 移除洩漏的模型控制 Token，例如 `<|assistant|>`、其他 ASCII `<|...|>` Token，以及全形 `<｜...｜>` 變體
  - 移除格式錯誤的 MiniMax 工具呼叫 XML，例如 `<invoke ...>`／`</minimax:tool_call>`
- 傳回前會遮蔽類似認證資訊／Token 的文字
- 截斷過長的文字區塊
- 非常龐大的歷程可能會捨棄較舊的資料列，或以 `[sessions_history omitted: message too large]` 取代過大的資料列
- 工具會回報摘要旗標，例如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted`、`bytes`，以及分頁中繼資料

請將傳回的**工作階段索引鍵**（例如 `"main"`）搭配 `sessions_history`、`sessions_send` 和 `session_status` 使用。這些目標工具也能解析已知的工作階段 ID，但 `sessions_list` 不會公開內部 ID。

如需完全精確的原始逐字記錄，請檢查範圍限定的 SQLite 逐字記錄資料列，而不要將 `sessions_history` 視為未經篩選的傾印。

使用 [`sessions_search`](/zh-TW/concepts/session-search)，可在可見的使用者及助理逐字記錄文字中進行精確全文回想。其結果包含供後續 `sessions_history` 呼叫使用的 `sessionKey`；可見性篩選、片段遮蔽及輸出限制均與歷程邊界一致。

## 管理工作階段設定及群組

受擁有者管控的 `sessions` 工具提供兩個有界限的自助服務介面：

- `action: "patch"` 預設會變更目前工作階段，也可以變更由 `sessionKey` 選取的另一個可見工作階段。它可以設定標籤、側邊欄圖示、釘選／封存狀態、模型及思考層級。它不提供重設、刪除或壓縮操作。
- `group_list`、`group_set`、`group_rename` 和 `group_delete` 用於管理全域有序工作階段群組目錄。`group_set` 會取代有序名稱清單，而不是修補單一項目。

由代理選取的模型修補在該選擇成功完成一次執行前都可復原。如果選取的模型因驗證、帳務或找不到模型的失敗而確定無法使用，OpenClaw 會還原先前的模型，並寫入可見的系統附註。暫時性的速率限制、過載、逾時、網路及伺服器失敗不會撤銷該選擇。

## 工作階段與對話

**工作階段**是本機模型內容。**對話**則是確切的外部位址，例如一位對等端、頻道或討論串。兩者彼此連結，但不可互換：私人訊息可以共用同一個 `main` 工作階段，同時保留各自獨立的對話位址。

`conversations_list` 會傳回作用中代理的不透明 `conversationRef` 值。若明確指定 `channel`，閘道也會從該頻道的本機目錄重新整理位址，例如已核准的 Reef 對等端；若要尋找目前結果頁以外的特定對等端，請使用 `query`。探索只會將位址加入目錄，而不會建立模型內容工作階段；只有在傳遞或傳入內容需要時，才會建立支援該位址的工作階段。對話探索及傳遞僅限擁有者使用，因為它們會使用閘道的頻道認證資訊。使用 `conversations_send` 進行傳送後不等待的傳遞。當遠端回覆屬於目前模型回合時，請使用 `conversations_turn`：閘道會保留一個傳輸訊息 ID，在傳輸 I/O 前保存傳遞作業及佇列意圖，並直接從工具傳回關聯回覆，而不是啟動第二個本機代理回合。傳遞作業位於模型逐字記錄之外；擷取的回覆僅會保留為附屬成品，而模型內容由工具結果持有。如果閘道在排入佇列後重新啟動，傳遞仍可復原，但之後的回覆會遵循一般傳入分派，因為程序本機的等待者已消失。未經請求的傳入訊息一律繼續透過正常的頻道分派路徑處理。

如果已有明確的原始頻道目標，或需要頻道專屬操作，請使用共用的 `message` 工具。對話參照的範圍限於作用中代理，應透過 `conversations_list` 取得，而不是從工作階段索引鍵自行建構。

在程式碼模式中，對話工具會重複使用其確切的閘道輸出合約。單一 `exec` 儲存格可以列出位址、選取傳回的 `conversationRef`，並呼叫 `conversations_send` 或 `conversations_turn`；一般工具原則及核准仍適用於巢狀呼叫。

## 傳送跨工作階段訊息

`sessions_send` 會在同一個閘道上執行另一個工作階段，並可選擇等待回應。其 `sessionKey`、`label` 或 `agentId` 選取的是本機模型內容，而非外部目的地。產生的回覆仍可透過既有的請求者或目標傳遞內容進行宣告；此既有行為維持不變。如需精確的外部傳遞，請使用對話工具，或搭配明確的頻道及目標使用 `message`。

- **傳送後不等待：**設定 `timeoutSeconds: 0`，將工作排入佇列並立即傳回。
- **等待回覆：**設定逾時時間，並直接取得回應。

討論串範圍的聊天工作階段（例如索引鍵結尾為 `:thread:<id>`）不是有效的 `sessions_send` 目標。代理間協調應使用父頻道的工作階段索引鍵，以免工具路由的訊息出現在作用中的人員可見討論串內。

訊息及 A2A 後續回覆會在接收提示詞（`[Inter-session message ... isUser=false]`）及逐字記錄來源中標示為工作階段間資料。接收代理應將它們視為工具路由的資料，而不是終端使用者直接撰寫的指示。

目標回應後，OpenClaw 可以執行**回覆迴圈**，讓代理交替傳送訊息，次數不超過內建限制。目標代理可以回覆 `REPLY_SKIP` 以提早停止。

傳入 `watch: true`，還能將傳送者登錄為目標的狀態變更監看者：之後若其他行為者直接向目標傳送真人訊息或變更其目標，傳送者會收到指向 `session_status` `changesSince` 的系統通知。登錄會在成功分派後進行，目標為實際收到訊息的工作階段，並從其目前的狀態版本開始，因此只有之後的變更才會產生通知。登錄成功時，結果會回報 `watched: true`。請參閱[工作階段狀態感知](/zh-TW/concepts/session-state)。

## 狀態及協調輔助工具

`session_status` 是目前工作階段或另一個可見工作階段的輕量 `/status` 對應工具。它會回報用量、時間、模型／執行階段狀態，以及存在時的已連結背景工作內容。與 `/status` 相同，它可以從最新的逐字記錄用量項目回填稀疏的 Token／快取計數器，而 `model=default` 會清除個別工作階段的覆寫。請對呼叫者目前的工作階段使用 `sessionKey="current"`；`openclaw-tui` 等可見的用戶端標籤並非工作階段索引鍵。

當路由中繼資料可用時，`session_status` 也會包含可見的 `Route context` JSON 區塊及對應的結構化 `details` 欄位。這些欄位可區分工作階段金鑰與目前正在處理即時執行的路由：

- `origin` 是工作階段的建立位置；若較舊的狀態缺少已儲存的來源中繼資料，則為從可投遞工作階段金鑰前綴推斷出的提供者。
- `active` 是目前的即時執行路由。只有目前正在處理的即時或當前工作階段才會回報此欄位。
- `deliveryContext` 是儲存在工作階段上的持久化投遞路由；即使作用中的介面不同，OpenClaw 仍可重複使用此路由進行後續投遞。

## 工作階段狀態變更

OpenClaw 會持久保存重大工作階段狀態變更的訊號日誌（直接傳送至受監看工作階段的人類訊息、子執行結果、目標變更、壓縮）。`sessions_list` 資料列與 `session_status` 會公開工作階段的 `stateVersion`，而 `session_status` 接受 `changesSince: <version>`，以傳回該版本之後的型別化事件；當要求的版本早於保留的歷程記錄時，會以確切的 `historyGap` 發出訊號。監看者（自動監看的產生父工作階段，以及透過 `sessions_send watch: true` 明確監看的工作階段）會在另一個執行者變更受監看的工作階段時，收到一則合併的狀態過期通知。

狀態變更事件會省略重複的工作階段／代理程式 ID，並只公開對模型有用的承載資料欄位（`outcome`、`channel` 或 `turns`）。事件摘要及執行者／執行識別碼仍可用於協調。

如需完整模型的相關資訊，包括事件種類、監看者註冊、防濫發通知協定、協調流程及目前限制，請參閱[工作階段狀態感知](/zh-TW/concepts/session-state)。

`sessions_yield` 會刻意結束目前回合，讓下一則訊息成為你正在等待的後續事件。產生子代理程式後，如果你希望完成結果作為下一則訊息送達，而不是建立輪詢迴圈，請使用此功能。

`subagents` 是原生子代理程式執行與共用背景任務帳本的工作階段樹狀檢視。`action: "list"` 會回報作用中／近期的子代理程式，以及限定範圍的 ACP、命令列介面／媒體和排程任務。`action: "cancel"` 接受傳回的 `taskId`，且只能停止呼叫者所控制工作階段樹內的工作；葉節點子代理程式無法取消另一個工作階段的任務。

## 產生子代理程式

`sessions_spawn` 預設會為背景任務建立隔離的工作階段。此操作一律不會阻塞；它會立即傳回 `runId` 和 `childSessionKey`。原生子代理程式執行會在子工作階段第一則可見的 `[Subagent Task]` 訊息中收到委派的任務，而系統提示僅包含子代理程式執行階段規則與路由內容。

主要選項：

- `runtime: "subagent"`（預設）或供外部框架代理程式使用的 `"acp"`。
- 子工作階段的 `model` 和 `thinking` 覆寫值。
- `thread: true`，用於將產生操作繫結至聊天討論串（Discord、Slack 等）。
- `sandbox: "require"`，用於強制子工作階段採用沙箱隔離。
- 原生子代理程式需要目前請求者逐字記錄時使用的 `context: "fork"`；若要建立乾淨的子工作階段，請省略或使用 `context: "isolated"`。`context: "fork"` 僅能與 `runtime: "subagent"` 搭配使用。除非 `threadBindings.defaultSpawnContext` 另有指定，繫結至討論串的原生子代理程式預設使用 `context: "fork"`。
- `visible: true`，用於建立持久的儀表板工作階段，而非隱藏的子代理程式工作階段。可見的產生操作支援明確指定模型、工作目錄、同代理程式逐字記錄分支，以及選用的[受管理工作樹](/zh-TW/concepts/managed-worktrees)；確切的相容性限制請參閱[子代理程式](/zh-TW/tools/subagents#tool-parameters)。

預設的葉節點子代理程式不會取得工作階段工具。當 `maxSpawnDepth >= 2` 時，深度為 1 的協調器子代理程式還會取得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理自己的子工作階段。葉節點執行仍不會取得遞迴協調工具。

完成後，公告步驟會將結果發布至請求者的頻道。完成投遞會在可用時保留已繫結的討論串／主題路由；如果完成來源只能識別頻道，OpenClaw 仍可重複使用請求者工作階段中儲存的路由（`lastChannel`／`lastTo`）進行直接投遞。

如需 ACP 特有行為的相關資訊，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 可見性

工作階段工具會限定範圍，以限制代理程式可查看的內容：

| 層級   | 範圍                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | 僅限目前工作階段                                   |
| `tree`  | 目前及所產生的工作階段；讀取範圍包含受監看的同代理程式群組 |
| `agent` | 此代理程式的所有工作階段                                |
| `all`   | 所有工作階段（若已設定，則包括跨代理程式工作階段）                   |

預設為 `tree`。無論設定為何，沙箱化工作階段都會限制為 `tree`。
使用預設的 `session.dmScope: "main"` 時，群組活動會讓主工作階段能夠讀取受監看的
同代理程式群組工作階段。

## 延伸閱讀

- [工作階段管理](/zh-TW/concepts/session)：路由、生命週期、維護
- [子代理程式](/zh-TW/tools/subagents)：子工作階段生命週期與投遞
- [ACP 代理程式](/zh-TW/tools/acp-agents)：外部框架產生操作
- [多代理程式](/zh-TW/concepts/multi-agent)：多代理程式架構
- [閘道設定](/zh-TW/gateway/configuration)：工作階段工具設定選項

## 相關內容

- [工作階段管理](/zh-TW/concepts/session)
- [工作階段修剪](/zh-TW/concepts/session-pruning)
