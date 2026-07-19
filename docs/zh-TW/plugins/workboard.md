---
read_when:
    - 你想在控制介面中使用看板式工作板
    - 你正在啟用或停用隨附的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下追蹤規劃中的代理工作
summary: 用於代理程式所屬卡片與工作階段交接的選用儀表板工作看板
title: 工作看板外掛
x-i18n:
    generated_at: "2026-07-19T14:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38f138584fed2d052ed45798c38a342fd9fe08eddf4fef9f73c52353f4b0ded2
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在[控制介面](/zh-TW/web/control-ui)中新增一個選用的看板風格工作板：適合代理程式規模的工作卡片、指派給代理程式，以及返回卡片所屬任務、執行與儀表板工作階段的連結。

Workboard 刻意保持精簡：它會追蹤單一 OpenClaw 閘道的本機操作工作。它不能取代 GitHub Issues、Linear、Jira 或其他團隊專案管理系統。

## 啟用

Workboard 已隨附，但預設停用：

1. 在控制介面中開啟 **外掛**，或使用相對於已設定控制介面基礎路徑的 `/settings/plugins`。例如，基礎路徑為 `/openclaw` 時，會使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 並選擇 **啟用**。由於 Workboard 已包含在 OpenClaw 中，因此不需要執行 **安裝** 動作。
3. 如果介面回報需要重新啟動，請重新啟動閘道。

外掛執行階段載入後，Workboard 分頁會出現在儀表板導覽列中。停用時，該分頁會從導覽列中隱藏。若外掛已停用或遭 `plugins.allow`/`plugins.deny` 封鎖，直接開啟 `/workboard` 路由會顯示外掛無法使用的狀態，而非卡片資料。

對應的命令列介面工作流程如下：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 設定

Workboard 沒有外掛專屬設定。請使用標準外掛項目啟用或停用：

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 卡片欄位

| 欄位        | 值                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`                     |
| `priority`  | `low`、`normal`、`high`、`urgent`                                                                             |
| `labels`    | 自由格式字串                                                                                                  |
| `agentId`   | 選用的已指派代理程式                                                                                          |
| 已連結參照 | 選用的任務、執行、工作階段或來源 URL                                                                          |
| `execution` | 從卡片啟動的 Codex/Claude 執行所使用的選用中繼資料（引擎、模式、模型、工作階段、執行 ID、狀態） |

卡片也會攜帶精簡的中繼資料，包括嘗試、留言、連結、證明、成品、自動化設定、附件、工作程式日誌、工作程式通訊協定狀態、宣告、診斷、通知、範本 ID、封存狀態及過期工作階段偵測，另有近期事件清單（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。這些中繼資料可讓操作人員不必開啟已連結的工作階段，就能查看卡片如何在工作板中流轉；它是本機操作情境，不能取代工作階段逐字記錄或 GitHub Issue 歷史記錄。

此外掛與控制介面使用同一份 Workboard 卡片合約。因此，儀表板重新整理時會保留工作區來源與權限、宣告狀態、診斷動作和通知序號，而不是投影出較精簡、僅供介面使用的卡片副本。在兩個介面都支援之前，未知的診斷種類、診斷嚴重性及通知種類會被忽略；絕不會將它們改寫為其他有效狀態。

開啟的儀表板會根據 `plugin.workboard.changed` 失效事件更新。每個事件只包含儲存區世代與修訂版；接著介面會透過一般的 `operator.read` RPC 重新讀取標準卡片。多個修訂版會合併為一次後續讀取。拖曳、編輯或寫入卡片時，Workboard 會延後讀取，待本機互動完成後再繼續。重新連線時一律會執行標準重新載入。系統不會例行輪詢完整卡片，而 **重新整理** 仍可用於手動復原。

當存在多個工作板時，工具列會提供 **工作板** 篩選器，其資料來自持久保存的工作板中繼資料，而非僅來自目前可見的卡片。因此，空白和已封存的工作板仍可選取。未明確指定工作板 ID 的卡片屬於標準的 `default` 工作板。所選工作板會儲存在 `?board=` 查詢參數中，因此可將篩選後的 Workboard URL 加入書籤或分享；選擇 **所有工作板** 會移除此參數。

卡片儲存在外掛本身的閘道狀態中，並會隨該閘道的其他 OpenClaw 狀態一併移動（請參閱[儲存空間](#storage)）。

## 從卡片開始工作

未連結的卡片可直接開始工作：

- **執行 Codex** / **執行 Claude** 會以明確指定的引擎啟動由任務追蹤的代理程式執行、傳送卡片提示，並將卡片標記為 `running`。Codex 執行使用 `openai/gpt-5.6-sol`；Claude 執行使用 `anthropic/claude-sonnet-4-6`。
- **開啟 Codex** / **開啟 Claude** 會建立已連結的儀表板工作階段，但不傳送卡片提示，也不移動卡片，以供仍附加於工作板的手動工作使用。

自主啟動會使用閘道由任務追蹤的代理程式執行路徑（除非明確選擇 Codex/Claude，否則使用預設代理程式和模型）；接著 Workboard 會將產生的任務、執行 ID 和工作階段金鑰連結回卡片。每次連結的執行也會記錄嘗試摘要（引擎、模式、模型、執行 ID、時間戳記、狀態、連續失敗次數），讓重複失敗持續可見。

儀表板會從閘道任務帳本重新整理任務狀態，並透過任務 ID、執行 ID 或已連結的工作階段金鑰將任務與卡片配對。已排入佇列或執行中的任務會讓卡片的生命週期保持有效；已完成、失敗、逾時或取消的任務，會使用與已連結工作階段相同的同步規則，將卡片移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 以精簡卡片列出宣告／診斷狀態；可選擇依看板篩選。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片及有限範圍的工作者脈絡（備註、嘗試、留言、連結、證明、成品、父項結果、受指派者最近的工作、進行中的診斷）。                               |
| `workboard_create`                                                                                                                               | 建立卡片，可選擇指定父項、租戶、Skills、看板、工作區中繼資料、冪等性金鑰、執行時間限制及重試預算。                                                             |
| `workboard_link`                                                                                                                                 | 將父卡片連結至子卡片。所有父卡片達到 `done` 前，子卡片會維持 `todo`；之後，分派提升會將其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 為呼叫代理程式宣告卡片；將 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在較長的執行期間重新整理宣告心跳偵測。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放宣告；可將卡片移至下一個狀態。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品、已建立卡片資訊清單（必須參照連回已完成卡片的卡片）或阻礙原因的結構化生命週期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛 SQLite 狀態中、於卡片上建立索引，並在工作者脈絡中公開。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者停止卻未呼叫 `workboard_complete`/`workboard_block` 時封鎖卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久保存的看板中繼資料（顯示名稱、說明、封存狀態、預設工作區）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 傳回卡片持久保存的執行嘗試歷程。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 將粗略的分流／待辦卡片轉為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為相互連結的子卡片，並繼承看板／租戶中繼資料；可使用已建立卡片資訊清單完成父卡片。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端在恢復時不會遺失或重複讀取已完成／失敗／過期的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查看板命名空間與佇列統計資料。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接備註或附加證明／成品參照。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 將已封鎖的工作移回 `todo`。                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | 將卡片移至其他狀態；已宣告的卡片要求呼叫端具備其代理程式宣告範圍。                                                                                                      |
| `workboard_dispatch`                                                                                                                             | 在不啟動工作者的情況下推動相依項目提升或清理過期宣告；工作者啟動使用閘道或斜線命令分派。                                                        |

證明狀態是工作者回報的結果，而非獨立驗證。`passed`
項目表示工作者回報其命令或檢查成功；需要
獨立品質關卡的使用端應檢查所附的命令、URL 或成品，並
執行自己的驗證器。`workboard_proof` 會傳回新記錄的 `proofId`。當
`workboard_complete` 回報同一證明的終止狀態時，請傳入 `proofId`，以便
就地解析待處理記錄，而不遺失其身分或時間戳記。已有
相同終止狀態的證明會原樣重複使用。沒有
`proofId` 的完成證明仍僅能附加，因此後續重試不能只因
命令或備註相同就改寫較舊的歷程。

除非呼叫端持有 `workboard_claim` 傳回的宣告權杖，否則已宣告的卡片會拒絕
其他代理程式透過代理程式工具進行變更。代理程式工具或閘道 RPC 呼叫
傳回的每張卡片，都會將 `metadata.claim.token` 遮蔽為 `[redacted]`
（權杖本身僅由 `workboard_claim` 在頂層傳回一次），
因此儀表板操作人員及其他代理程式可以檢查宣告狀態，而永遠不會
看到可用的權杖。復原會透過
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 進行，這些操作
不需要權杖。

## 分派

分派位於閘道本機：不會產生任意的作業系統處理程序。一般
OpenClaw 子代理程式工作階段仍負責執行。一次分派流程會：

1. 提升相依項目已就緒的卡片。
2. 在就緒卡片上記錄分派中繼資料。
3. 封鎖宣告已到期或執行逾時的卡片。
4. 將看板設定的分流卡片標示為協調候選項目。
5. 宣告一小批就緒卡片，並透過
   閘道子代理程式執行階段啟動工作者執行。

工作者會取得有限範圍的卡片脈絡，以及透過 Workboard 工具進行心跳偵測、
完成或封鎖卡片所需的宣告權杖。

工作區路徑遵循呼叫端現有的檔案系統權限。具備 `operator.write` 的閘道
用戶端可以使用已設定的代理程式工作區；
`operator.admin` 用戶端可以使用主機上的其他簽出。沙箱化代理程式工具使用
其沙箱工作區存取權，而未沙箱化且僅限工作區的工具則使用其
已設定的工作區根目錄。Workboard 會在指派工作區時記錄該權限，
並在分派時再次與目前呼叫端的權限取交集，
因此持久保存的卡片無法擴大後續呼叫端的存取權。具有
明確主機工作區但未記錄權限的舊卡片，必須先重新儲存該工作區，
才能進行完整主機分派；沒有主機路徑的卡片則會在首次分派時採用
目前呼叫端的權限。

工作區繫結分派僅在儲存庫根目錄與目標代理程式工作區
完全相符時，才接受目錄或 Git 簽出。工作樹要求會縮限至該目錄，
並持久保存為目錄工作區，因此主機不會具現化簽出內容，也不會執行
儲存庫設定程式碼。目標工作者必須針對該確切工作區使用
可寫入、非共用的 Docker 沙箱，且不得使用提升權限執行、
持久保存的主機／節點 exec 覆寫，或未分類的外掛與 MCP 工具。
Workboard 會列舉其已註冊工具，而非信任 `workboard_*` 前綴，
且分派會拒絕即時掛載／設定雜湊已過期的熱 Docker
容器。分派會回報不相容的目標原則，而不會啟動限制較少的工作者。
完整主機分派可以指定其他本機簽出，並維持一般的受管理
工作樹設定。

工作區權限不會建立第二套卡片生命週期權限模型。
可變更 Workboard 卡片的呼叫端，可以在每個介面上手動讓卡片
經過相同狀態；唯讀工作區存取權只會阻止需要寫入權限的
工作者分派。

### 工作者選擇

每次執行預設啟動**最多 3 個工作者**。就緒卡片會依
優先順序、位置、建立時間排序。每次執行只會為每個
擁有者／代理程式啟動一張卡片，並跳過看板上已有執行中或審查中工作的
擁有者。封存的卡片、已有有效認領的卡片，以及狀態不是 `ready`
的卡片，絕不會被選來啟動工作者（但仍可能受到分派的
資料處理部分影響：清理過期認領、提升相依項目、清理
逾時項目）。

每個看板／卡片的工作階段金鑰都是確定性的，因此重複分派會路由
回相同的工作者通道，而不會建立無關的工作階段：

- 已指派的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派的卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理程式）

若卡片被認領後仍無法啟動工作者，Workboard 會封鎖該
卡片、清除認領、記錄執行啟動失敗，並附加一行工作者
日誌；此資訊可在儀表板、命令列介面 JSON、代理程式工具與卡片
診斷中查看。

### 進入點

- 儀表板分派動作
- `openclaw workboard dispatch`
- 支援命令之頻道上的 `/workboard dispatch`

閘道可用時，這三者都會使用閘道子代理程式執行階段。
命令列介面提供一種操作員備援方式：若閘道呼叫因
連線／無法使用錯誤而失敗（或較舊閘道傳回 `unknown method`
錯誤），且未套用明確的 `--url`/`--token` 目標，也未設定遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），命令列介面會針對本機 SQLite 狀態
執行僅資料分派；它可以提升相依項目、
清理過期認領並封鎖逾時執行，但無法啟動工作者。可連線閘道所傳回的驗證、
權限與資料檢核失敗，不會被視為無法使用；
它們會顯示為命令錯誤。若已指定明確的 `--url`/`--token`
目標，任何閘道失敗也同樣會顯示為命令錯誤。

看板中繼資料可設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 與 `orchestratorProfile`。OpenClaw 會記錄此意圖並
在工作者情境中公開；實際的規格制定／工作拆解仍會
透過一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存的卡片（可用 `--include-archived`
覆寫）；`--json` 一律包含已封存的卡片，與現有指令碼使用的完整卡片
合約一致。`show` 與 `move` 接受無歧義的 ID
前綴。`list`、`create`、`show` 與 `move` 一律直接讀寫本機外掛
狀態。只有 `dispatch` 會呼叫執行中的閘道，並採用
上述備援行為。

如需完整旗標、JSON 輸出、閘道備援行為、ID 前綴處理、
分派選取規則與疑難排解，請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
`/workboard move <card-id> --status <status>` 與 `/workboard dispatch` 對應
命令列介面的功能。任何已授權的命令傳送者都可執行列出與顯示等讀取操作。
在聊天介面上，建立、移動與分派需要擁有者身分；或由具備
`operator.write`/`operator.admin` 的閘道用戶端執行。操作員手動移動時，會採用與
儀表板拖放相同的認領覆寫行為。其工作樹存取權
仍遵循上述相同的工作區邊界。

## 工作階段生命週期同步

卡片可以連結至現有的儀表板工作階段，或連結至從卡片
開始工作時建立的工作階段。已連結的卡片會在行內顯示工作階段生命週期：
執行中、過期、已連結但閒置、完成、失敗或遺失。你也可以在
Sessions 分頁中使用**新增至 Workboard**擷取現有工作階段；該卡片
會連結至此工作階段，以工作階段標籤或最近的使用者提示作為標題，
並在可用時，使用最近的使用者提示加上最新的助理回覆
預先填入備註。

若已連結的工作階段遺失，卡片仍會保留連結以供參考，
並繼續提供啟動控制項，以便在全新的工作階段中重新啟動。若作用中的
已連結工作階段停止回報近期活動，Workboard 會將卡片標記為
`stale`，並將其儲存為中繼資料，直到生命週期將其清除。

卡片處於作用中工作狀態時，Workboard 會跟隨已連結工作階段的狀態：

| 已連結工作階段狀態                    | 卡片狀態 |
| ------------------------------------- | ----------- |
| 作用中                                | `running`   |
| 已完成                                | `review`    |
| 失敗、遭終止、逾時或中止              | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done`
會停止該卡片的自動同步，直到你將它移回 `todo` 或 `running`。

啟動卡片時會使用一般閘道工作階段；Workboard 只會儲存卡片
中繼資料與連結。對話逐字稿、模型選擇與執行
生命週期仍由一般工作階段系統管理。在作用中的
已連結卡片上使用**停止**可中止目前執行；Workboard 會將該卡片標記為 `blocked`，
讓它保持可見以供後續處理。

新卡片可以從 Workboard 範本（`bugfix`、`docs`、`release`、
`pr_review`、`plugin`）開始。範本會預先填入標題、備註、標籤與優先順序；
範本 ID 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在 Control UI 中開啟 Workboard 分頁。
2. 建立一張包含標題、備註、優先順序、標籤、選填代理程式及
   選填已連結工作階段的卡片；或開啟 Sessions，為現有工作階段選擇**新增至 Workboard**。
3. 將卡片拖曳至不同欄，或聚焦其精簡狀態控制項，並使用
   選單或 ArrowLeft/ArrowRight。拖曳期間，來源卡片會變暗，
   可放置的欄位則會顯示外框。
4. 從卡片開始工作，以建立或重複使用儀表板工作階段。
5. 代理程式工作時，從卡片開啟已連結的工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，接著在接受後
   手動將卡片移至 `done`。

## 診斷

診斷會根據本機卡片中繼資料計算。內建檢查會標示：

| 類型                        | 條件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派的 `todo`/`backlog`/`ready` 卡片超過 1 小時未更新。             |
| `running_without_heartbeat` | `running` 卡片超過 20 分鐘沒有認領心跳偵測或執行更新。 |
| `blocked_too_long`          | `blocked` 卡片超過 24 小時未更新。                                   |
| `repeated_failures`         | 卡片追蹤的失敗次數達到 2 次以上。                                |
| `missing_proof`             | `done` 卡片沒有證明、成品或附件。                          |
| `orphaned_session`          | `running` 卡片有 `sessionKey`，但沒有 `execution` 中繼資料。                |

## 權限

閘道 RPC 方法位於 `workboard.*` 下：

| 範圍            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件列出／取得、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、建立／更新／移動／刪除／留言／連結／連結相依項目／證明／成品、附件新增／刪除、工作者日誌、通訊協定違規、認領／心跳偵測／釋放／提升／重新指派／重新認領／完成／封鎖／解除封鎖、`cards.dispatch`、`cards.bulk`、封存、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知訂閱／刪除／推進 |

沒有任何 RPC 方法需要 `operator.admin`。以唯讀
操作員存取權連線的瀏覽器可以查看看板，但無法修改卡片。管理員範圍
會擴大可接受的 Workboard 主機路徑，但不會改變可用的方法。

## 儲存

Workboard 會將持久資料儲存在 OpenClaw 狀態目錄下、由外掛擁有的
關聯式 SQLite 資料庫中：看板、卡片、標籤、生命週期事件、
執行嘗試、留言、相依性連結、證明、成品參照、
附件中繼資料與 Blob、診斷、通知、工作者日誌、
通訊協定狀態與訂閱，全都儲存在 Workboard 資料表中（而非
外掛鍵值項目）。卡片匯出會保留看板脈絡，
但不會內嵌附件 Blob 內容。

曾在 `.28` 版本使用 Workboard 的安裝環境，可以執行
`openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間
（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在時的
`workboard.attachments`）移轉至關聯式資料庫。

## 疑難排解

**分頁顯示 Workboard 無法使用**

```bash
openclaw plugins inspect workboard --runtime --json
```

若已設定 `plugins.allow`，請將 `workboard` 加入其中。若 `plugins.deny`
包含 `workboard`，請先將其移除，再啟用此外掛。

**卡片無法儲存**

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作員
工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片後未開啟預期的工作階段**

檢查卡片的代理程式 ID 與已連結工作階段，接著開啟 Sessions 或 Chat，
查看實際執行狀態。

**分派未啟動工作者**

確認至少有一張沒有有效認領的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

若命令列介面回報僅資料分派，請啟動或重新啟動閘道後
重試；僅資料分派會更新本機看板狀態，但無法啟動
子代理程式工作者執行。若同一擁有者或代理程式的另一張卡片
已在執行中或等待審查，也可能跳過卡片；請先完成、
封鎖或釋放該作用中工作，再為同一
擁有者分派更多工作。

## 相關內容

- [Control UI](/zh-TW/web/control-ui)
- [Workboard 命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
