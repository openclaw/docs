---
read_when:
    - 你想在控制介面中使用看板式工作面板
    - 你正在啟用或停用隨附的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下追蹤規劃中的代理程式工作
summary: 選用的儀表板工作看板，用於代理程式負責的卡片與工作階段交接
title: 工作看板外掛
x-i18n:
    generated_at: "2026-07-22T10:41:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec05c990c3559015780d9cb80f3ceedd7cc79db89ccf1afd65906c8c7630331
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在[控制介面](/zh-TW/web/control-ui)中新增選用的看板式工作板：適合代理程式處理的工作卡、指派給代理程式的功能，以及返回工作卡所屬任務、執行作業和儀表板工作階段的連結。

Workboard 刻意保持精簡：它追蹤單一 OpenClaw 閘道的本機作業工作。它不能取代 GitHub Issues、Linear、Jira 或其他團隊專案管理系統。

## 啟用

Workboard 已隨附，但預設停用：

1. 在控制介面中開啟 **Plugins**，或使用相對於已設定控制介面基底路徑的 `/settings/plugins`。例如，基底路徑為 `/openclaw` 時，會使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 並選擇 **Enable**。由於 Workboard 已包含在 OpenClaw 中，因此不需要執行 **Install**。
3. 如果介面回報需要重新啟動，請重新啟動閘道。

外掛執行階段載入後，Workboard 分頁會出現在儀表板導覽列中。停用時，該分頁不會顯示在導覽列。外掛停用或遭 `plugins.allow`/`plugins.deny` 封鎖時，直接開啟 `/workboard` 路由會顯示外掛無法使用的狀態，而非工作卡資料。

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

## 工作卡欄位

| 欄位        | 值                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`                     |
| `priority`  | `low`、`normal`、`high`、`urgent`                                                                             |
| `labels`    | 自由格式字串                                                                                                  |
| `agentId`   | 選用的已指派代理程式                                                                                          |
| 連結的參照 | 選用的任務、執行作業、工作階段或來源 URL                                                                      |
| `execution` | 從工作卡啟動的 Codex/Claude 執行作業之選用中繼資料（引擎、模式、模型、工作階段、執行作業 ID、狀態） |

工作卡也包含精簡的中繼資料，涵蓋嘗試、留言、連結、證明、成品、自動化設定、附件、工作程式記錄、工作程式通訊協定狀態、認領、診斷、通知、範本 ID、封存狀態和過期工作階段偵測，另有最近事件清單（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。此中繼資料可讓操作人員無須開啟連結的工作階段，就能查看工作卡如何在工作板上流轉；它是本機作業情境資訊，不能取代工作階段逐字稿或 GitHub Issue 歷程。

外掛與控制介面使用同一份 Workboard 工作卡合約。因此，儀表板重新整理時會保留工作區來源與權限、認領狀態、診斷動作和通知序號，而不是投影一份僅供介面使用、內容較少的工作卡副本。未知的診斷種類、診斷嚴重程度和通知種類會被忽略，直到兩個介面皆支援為止；絕不會將它們改寫成其他有效狀態。

已開啟的儀表板會根據 `plugin.workboard.changed` 失效事件進行更新。每個事件只包含儲存區世代和修訂版；介面接著會透過一般的 `operator.read` RPC 重新讀取標準工作卡。多個修訂版會合併為一次後續讀取。拖曳、編輯或寫入工作卡時，Workboard 會延後該次讀取，並在本機互動完成後恢復。每次重新連線都會執行標準重新載入。不會定期輪詢完整工作卡，而 **Refresh** 仍可用於手動復原。

存在多個工作板時，工具列會包含 **Board** 篩選器；其依據為持久保存的工作板中繼資料，而不只是目前可見的工作卡。因此，空白和已封存的工作板仍可供選取。未明確指定工作板 ID 的工作卡屬於標準 `default` 工作板。每個工作板都有標準的 `/workboard/<boardId>` 頁面，可以加入書籤、分享或釘選至側邊欄。先前發布的 `/workboard?board=<boardId>` 形式仍作為相容性別名，並會重新導向至該頁面，同時保留其他查詢參數。選擇 **All boards** 會返回 `/workboard`。

工作卡儲存在外掛自己的閘道狀態中，並會隨該閘道的其餘 OpenClaw 狀態一同移轉（請參閱[儲存空間](#storage)）。

## 從工作卡開始工作

尚未連結的工作卡可以直接開始工作：

- **Run Codex** / **Run Claude** 會使用明確指定的引擎，啟動由任務追蹤的代理程式執行作業、傳送工作卡提示，並將工作卡標記為 `running`。Codex 執行作業使用 `openai/gpt-5.6-sol`；Claude 執行作業使用 `anthropic/claude-sonnet-4-6`。
- **Open Codex** / **Open Claude** 會建立連結的儀表板工作階段，但不傳送工作卡提示，也不移動工作卡，適用於持續附加至工作板的手動工作。

自主啟動會使用閘道的任務追蹤代理程式執行路徑（除非明確選擇 Codex/Claude，否則使用預設代理程式和模型）；接著，Workboard 會將產生的任務、執行作業 ID 和工作階段金鑰連結回工作卡。每次連結的執行作業也會記錄嘗試摘要（引擎、模式、模型、執行作業 ID、時間戳記、狀態、累計失敗次數），讓重複失敗持續可見。

儀表板會從閘道任務帳本重新整理任務狀態，並依據任務 ID、執行作業 ID 或連結的工作階段金鑰，將任務與工作卡配對。已排入佇列或執行中的任務會維持工作卡生命週期的作用中狀態；已完成、失敗、逾時或取消的任務，則會使用與連結工作階段相同的同步規則，將工作卡移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含認領／診斷狀態的精簡卡片；可選擇依看板篩選。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片以及有界限的工作者情境（備註、嘗試、留言、連結、證明、成品、父項結果、受指派者近期工作、作用中診斷）。                               |
| `workboard_create`                                                                                                                               | 建立卡片，可選擇指定父項、租戶、Skills、看板、工作區中繼資料、冪等性金鑰、執行時間限制及重試額度。                                                             |
| `workboard_link`                                                                                                                                 | 將父卡片連結至子卡片。所有父項達到 `done` 前，子項會維持 `todo`；之後分派提升會將其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 為呼叫代理程式認領卡片；將 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在較長時間的執行期間重新整理認領心跳偵測。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放認領；可將卡片移至下一個狀態。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品、已建立卡片資訊清單（必須參照連結回已完成卡片的卡片）或阻礙原因的結構化生命週期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛的 SQLite 狀態中、建立卡片索引，並在工作者情境中公開。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者停止且未呼叫 `workboard_complete`/`workboard_block` 時封鎖卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板中繼資料（顯示名稱、說明、封存狀態、預設工作區）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 傳回卡片的持久化執行嘗試歷程。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 將粗略的分流／待辦卡片轉換為釐清後的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為互相連結的子項，並繼承看板／租戶中繼資料；可使用已建立卡片資訊清單完成父項。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端繼續處理時不會遺漏或重複讀取已完成／失敗／過期的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查看板命名空間與佇列統計資料。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接備註，或附加證明／成品參照。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 將封鎖的工作移回 `todo`。                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | 將卡片移至另一個狀態；已認領的卡片要求呼叫端具備其代理程式認領範圍。                                                                                                      |
| `workboard_dispatch`                                                                                                                             | 在不啟動工作者的情況下促進相依項目提升或清理過期認領；工作者啟動使用閘道或斜線命令分派。                                                        |

證明狀態是工作者回報的結果，而非獨立驗證。`passed`
項目表示工作者回報其命令或檢查成功；需要
獨立品質關卡的取用端應檢查附加的命令、URL 或成品，並
執行自己的驗證器。`workboard_proof` 會傳回新記錄的 `proofId`。當
`workboard_complete` 回報同一證明的終止狀態時，請傳入 `proofId`，以便
就地解析待處理記錄，而不遺失其身分或時間戳記。若證明
已具有相同的終止狀態，則會原樣重複使用。未包含
`proofId` 的完成證明仍採僅附加方式，因此後續重試不能只因
命令或備註相同就重寫較舊的歷程。

已認領的卡片會拒絕其他代理程式進行代理程式工具變更，除非呼叫端
持有 `workboard_claim` 傳回的認領權杖。代理程式工具或閘道 RPC
呼叫所傳回的每張卡片，都會將 `metadata.claim.token` 遮蔽為 `[redacted]`
（權杖本身只會由 `workboard_claim` 在頂層傳回一次），
因此儀表板操作人員與其他代理程式可以檢查認領狀態，而完全不會
看到可用的權杖。復原會透過
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 進行，這些項目
不需要權杖。

## 分派

分派位於閘道本機：不會產生任意的作業系統程序。一般的
OpenClaw 子代理程式工作階段仍負責執行。一次分派流程會：

1. 提升相依項目已就緒的卡片。
2. 在已就緒的卡片上記錄分派中繼資料。
3. 封鎖認領已到期或執行逾時的卡片。
4. 將依看板設定的分流卡片標記為協調候選項目。
5. 認領一小批已就緒的卡片，並透過
   閘道子代理程式執行階段啟動工作者執行。

工作者會取得有界限的卡片情境，以及透過 Workboard 工具進行心跳偵測、
完成或封鎖卡片所需的認領權杖。

工作區路徑遵循呼叫端現有的檔案系統權限。具備
`operator.write` 的閘道用戶端可以使用已設定的代理程式工作區；
`operator.admin` 用戶端可以使用其他主機簽出目錄。沙箱化代理程式工具使用
其沙箱工作區存取權，而未沙箱化且僅限工作區的工具則使用其
已設定的工作區根目錄。Workboard 會在指派工作區時記錄該權限，
並在分派時再次取其與目前呼叫端權限的交集，
因此持久化卡片無法擴大後續呼叫端的存取權。具有
明確主機工作區但沒有已記錄權限的舊卡片，必須先重新儲存該工作區，
才能進行完整主機分派；沒有主機路徑的卡片則會在首次分派時
採用目前呼叫端的權限。

以工作區為限的分派，只有在目錄或 Git 簽出目錄的
儲存庫根目錄與目標代理程式工作區完全相符時才會接受。工作樹要求
會縮限至該目錄，並持久化為目錄工作區，因此
主機不會具現化簽出內容或執行儲存庫設定程式碼。
目標工作者必須針對該確切工作區使用可寫入、非共享的 Docker 沙箱，
且不得使用提升權限的執行、持久化的主機／節點執行覆寫，或
未分類的外掛與 MCP 工具。Workboard 會列舉其已註冊工具，
而非信任 `workboard_*` 前綴，且若運作中 Docker 容器的
即時掛載／設定雜湊已過期，分派就會遭拒。分派會回報
不相容的目標原則，而不會啟動限制較少的工作者。
完整主機分派可以其他本機簽出目錄為目標，並維持一般的受管理
工作樹設定。

工作區權限不會建立第二套卡片生命週期權限模型。
可以變更 Workboard 卡片的呼叫端，能在每個介面上手動讓卡片經歷相同的
狀態；唯讀工作區存取權只會阻止需要寫入權限的
工作者分派。

### 工作者選擇

每次執行預設**最多啟動 3 個工作器**。就緒卡片會依序按
優先順序、位置、建立時間排列。每次執行只會為每位
擁有者／代理程式啟動一張卡片，並略過看板上已有執行中或審查中工作的
擁有者。已封存的卡片、有有效宣告的卡片，以及狀態不是 `ready` 的
卡片，永遠不會被選來啟動工作器（但資料端的分派仍可能影響這些卡片：
清除過期宣告、提升相依項目、逾時清理）。

工作階段金鑰會依看板／卡片以確定性方式產生，因此重複分派會路由
回相同的工作器通道，而不是建立不相關的工作階段：

- 已指派的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派的卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理程式）

若卡片被宣告後無法啟動工作器，Workboard 會封鎖該
卡片、清除宣告、記錄執行啟動失敗，並附加一行工作器
記錄；此記錄會顯示於儀表板、命令列介面 JSON、代理程式工具及卡片
診斷中。

### 進入點

- 儀表板分派動作
- `openclaw workboard dispatch`
- 支援命令的頻道上的 `/workboard dispatch`

閘道可用時，這三者都會使用閘道子代理程式執行階段。命令列介面
提供一種操作員備援：若閘道呼叫因連線／無法使用錯誤而失敗（或舊版
閘道傳回 `unknown method` 錯誤），且未套用明確的
`--url`/`--token` 目標，也未設定遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），命令列介面會對本機 SQLite
狀態執行僅限資料的分派；它可以提升相依項目、
清除過期宣告及封鎖逾時執行，但無法啟動工作器。可連線閘道所傳回的驗證、
權限及驗證檢查失敗，不會視為無法使用；這些失敗會顯示為命令錯誤，
而且若已指定明確的 `--url`/`--token` 目標，
任何閘道失敗也同樣會顯示為命令錯誤。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 會記錄此意圖並
在工作器內容中公開；實際的規格制定／分解仍會
透過一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存卡片（可用 `--include-archived`
覆寫）；`--json` 一律包含已封存卡片，符合現有指令碼使用的完整卡片
契約。`show` 和 `move` 接受無歧義的 ID
前綴。`list`、`create`、`show` 和 `move` 一律直接讀寫本機外掛
狀態。只有 `dispatch` 會呼叫執行中的閘道，並採用
上述備援。

完整旗標、JSON 輸出、閘道備援行為、ID 前綴處理、分派選取規則及
疑難排解，請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
`/workboard move <card-id> --status <status>` 和 `/workboard dispatch` 與
命令列介面一致。對任何已獲授權的命令傳送者而言，列出與顯示都是讀取操作。
在聊天介面上，建立、移動及分派需要擁有者身分；或由具備
`operator.write`/`operator.admin` 的閘道
用戶端執行。手動操作員移動使用與儀表板拖放相同的
宣告覆寫行為。其工作樹存取仍遵循上述相同的工作區
邊界。

## 工作階段生命週期同步

卡片可以連結至現有儀表板工作階段，或連結至從卡片
開始工作時建立的工作階段。已連結的卡片會內嵌顯示工作階段生命週期：
執行中、過期、已連結但閒置、完成、失敗或遺失。你也可以在 Sessions 分頁中
使用 **Add to Workboard** 擷取現有工作階段；卡片會
連結至該工作階段，使用工作階段標籤或近期使用者提示作為標題，
並在可用時，以近期使用者提示加上最新的助理回覆
預填備註。

若已連結的工作階段遺失，卡片會保留連結以提供內容，
且仍會提供啟動控制項，以重新啟動至全新的工作階段。若有效的
已連結工作階段停止回報近期活動，Workboard 會將卡片標記為
`stale`，並將其儲存為中繼資料，直到生命週期將其清除。

卡片處於有效工作狀態時，Workboard 會跟隨已連結的工作階段：

| 已連結的工作階段狀態                  | 卡片狀態 |
| ------------------------------------- | ----------- |
| 有效                                | `running`   |
| 已完成                             | `review`    |
| 失敗、遭終止、逾時或已中止 | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done`
會停止該卡片的自動同步，直到你將其移回 `todo` 或 `running`。

啟動卡片會使用一般閘道工作階段；Workboard 僅儲存卡片
中繼資料與連結。對話逐字稿、模型選擇及執行
生命週期仍由一般工作階段系統管理。對即時的
已連結卡片使用 **Stop** 可中止有效執行；Workboard 會將該卡片標記為 `blocked`，
使其維持可見以供後續處理。

新卡片可從 Workboard 範本（`bugfix`、`docs`、`release`、
`pr_review`、`plugin`）開始。範本會預填標題、備註、標籤及優先順序；
範本 ID 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在 Control UI 中開啟 Workboard 分頁。
2. 使用標題、備註、優先順序、標籤、選用的代理程式及
   選用的已連結工作階段建立卡片；或開啟 Sessions，對現有工作階段選擇 **Add to Workboard**。
3. 在欄之間拖曳卡片，或聚焦其精簡狀態控制項，並使用
   選單或 ArrowLeft/ArrowRight。拖曳期間，來源卡片會變暗，
   可用的放置欄會顯示外框。
4. 從卡片開始工作，以建立或重複使用儀表板工作階段。
5. 代理程式工作時，從卡片開啟已連結的工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，然後在接受後
   手動將卡片移至 `done`。

### 工作階段看板小工具

Workboard 提供兩個用於工作階段儀表板的原生小工具（請參閱
[儀表板](/zh-TW/web/dashboards)）。代理程式會使用其 `dashboard` 工具並透過
`content: { kind: "plugin", pluginKind, props }` 將其釘選，這些小工具會以
具備即時資料的第一方 UI 呈現，不使用沙箱框架，也不需要能力授權：

- `workboard:card` 搭配 `props: { cardId }` 會顯示一張卡片及其狀態
  控制項、優先順序和已指派的代理程式。
- `workboard:mini` 搭配選用的 `props: { boardId, limit }`，會顯示各狀態的
  數量及最前面的就緒／執行中卡片，並連結至完整看板頁面。
  若沒有 `boardId`，它會彙總所有看板；若有 `boardId`，則範圍限定於該
  看板（未指定明確看板 ID 而建立的卡片位於 `default`）。

## 診斷

診斷是根據本機卡片中繼資料計算。內建檢查會標記：

| 類型                        | 條件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派的 `todo`/`backlog`/`ready` 卡片超過 1 小時未更新。             |
| `running_without_heartbeat` | `running` 卡片超過 20 分鐘沒有宣告心跳偵測或執行更新。 |
| `blocked_too_long`          | `blocked` 卡片超過 24 小時未更新。                                   |
| `repeated_failures`         | 卡片追蹤的失敗次數達到 2 次或以上。                                |
| `missing_proof`             | `done` 卡片沒有證明、成品或附件。                          |
| `orphaned_session`          | `running` 卡片具有 `sessionKey`，但沒有 `execution` 中繼資料。                |

## 權限

閘道 RPC 方法位於 `workboard.*` 下：

| 範圍            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、工作器記錄、通訊協定違規、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

沒有任何 RPC 方法需要 `operator.admin`。以唯讀
操作員存取權連線的瀏覽器可以檢查看板，但無法修改卡片。管理員範圍
會擴大可接受的 Workboard 主機路徑，但不會改變可用的方法。

## 儲存空間

Workboard 將持久資料儲存在 OpenClaw 狀態目錄下
由外掛擁有的關聯式 SQLite 資料庫中：看板、卡片、標籤、生命週期事件、
執行嘗試、留言、相依性連結、證明、成品參照、
附件中繼資料與二進位大型物件、診斷、通知、工作器記錄、
通訊協定狀態及訂閱，全都儲存在 Workboard 資料表中（而不是
外掛鍵值項目）。卡片匯出會保留看板敘事，
但不會內嵌附件二進位大型物件內容。

曾在 `.28` 版本中使用 Workboard 的安裝，可以執行
`openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間
（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在時的
`workboard.attachments`）移轉至關聯式資料庫。

## 疑難排解

**分頁顯示 Workboard 無法使用**

```bash
openclaw plugins inspect workboard --runtime --json
```

若已設定 `plugins.allow`，請將 `workboard` 加入其中。若 `plugins.deny`
包含 `workboard`，請在啟用外掛前將其移除。

**卡片無法儲存**

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作員
工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片後未開啟預期的工作階段**

檢查卡片的代理程式 ID 與已連結工作階段，然後開啟 Sessions 或 Chat，
檢查實際執行狀態。

**分派未啟動工作器**

確認至少有一張沒有有效宣告的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料分派，請啟動或重新啟動閘道後再試一次——僅資料分派會更新本機工作看板狀態，但無法啟動子代理工作執行。當同一擁有者或代理的另一張卡片已在執行或等待審查時，卡片也可能被略過；請先完成、封鎖或釋放該進行中的工作，再為同一擁有者分派更多工作。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [工作看板命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
