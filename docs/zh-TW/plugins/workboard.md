---
read_when:
    - 你想要在控制介面中使用看板式工作板
    - 你正在啟用或停用內建的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下追蹤代理程式的計畫工作
summary: 供代理程式自主管理卡片與工作階段交接使用的選用儀表板工作看板
title: Workboard 外掛
x-i18n:
    generated_at: "2026-07-11T21:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在[控制介面](/zh-TW/web/control-ui)中加入選用的看板式工作板：符合代理程式工作範圍的工作卡、指派給代理程式，以及連回工作卡之任務、執行和儀表板工作階段的連結。

Workboard 刻意保持精簡：它會追蹤單一 OpenClaw 閘道的本機作業工作。它不能取代 GitHub Issues、Linear、Jira 或其他團隊專案管理系統。

## 啟用

Workboard 已內建，但預設停用：

1. 在控制介面中開啟 **外掛**，或使用相對於已設定控制介面基底路徑的 `/settings/plugins`。例如，基底路徑為 `/openclaw` 時，請使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 並選擇 **啟用**。由於 Workboard 已隨 OpenClaw 提供，因此不需要執行 **安裝**。
3. 如果介面回報需要重新啟動，請重新啟動閘道。

外掛執行階段載入後，Workboard 分頁會出現在儀表板導覽列中。停用時，該分頁不會顯示於導覽列。當外掛已停用或遭 `plugins.allow`/`plugins.deny` 封鎖時，直接開啟 `/workboard` 路由會顯示外掛無法使用的狀態，而不是工作卡資料。

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
| 連結參照    | 選用的任務、執行、工作階段或來源 URL                                                                          |
| `execution` | 從工作卡啟動之 Codex/Claude 執行的選用中繼資料（引擎、模式、模型、工作階段、執行 ID、狀態）                   |

工作卡也包含精簡的中繼資料，用於記錄嘗試、留言、連結、證明、成品、機制設定、附件、工作者記錄、工作者協定狀態、認領、診斷、通知、範本 ID、封存狀態與過期工作階段偵測，以及近期事件清單（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。這些中繼資料讓操作人員無須開啟已連結的工作階段，即可查看工作卡如何在工作板上流轉；這是本機作業情境資訊，不能取代工作階段逐字稿或 GitHub 議題歷程。

工作卡儲存在外掛自己的閘道狀態中，並會隨該閘道的其餘 OpenClaw 狀態一起移動（請參閱[儲存空間](#storage)）。

## 從工作卡開始作業

未連結的工作卡可以直接開始作業：

- **執行 Codex** / **執行 Claude** 會使用明確指定的引擎啟動受任務追蹤的代理程式執行、傳送工作卡提示，並將工作卡標記為 `running`。Codex 執行使用 `openai/gpt-5.6-sol`；Claude 執行使用 `anthropic/claude-sonnet-4-6`。
- **開啟 Codex** / **開啟 Claude** 會建立已連結的儀表板工作階段，但不傳送工作卡提示或移動工作卡，適合持續附加於工作板的手動作業。

自主啟動會使用閘道的受任務追蹤代理程式執行路徑（除非明確選擇 Codex/Claude，否則使用預設代理程式和模型）；接著，Workboard 會將產生的任務、執行 ID 與工作階段金鑰連回工作卡。每個已連結的執行也會記錄嘗試摘要（引擎、模式、模型、執行 ID、時間戳記、狀態、累計失敗次數），讓重複失敗持續可見。

儀表板會從閘道任務帳本重新整理任務狀態，並依任務 ID、執行 ID 或已連結的工作階段金鑰，將任務與工作卡配對。已排入佇列或執行中的任務會讓工作卡的生命週期維持啟用；已完成、失敗、逾時或取消的任務，則會使用與已連結工作階段相同的同步規則，將工作卡移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含認領／診斷狀態的精簡卡片；可選擇依看板篩選。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片及有限的工作者脈絡（備註、嘗試、留言、連結、證明、成品、父項結果、受指派者近期工作、進行中的診斷）。                               |
| `workboard_create`                                                                                                                               | 建立卡片，可選擇指定父項、租戶、Skills、看板、工作區中繼資料、冪等鍵、執行時間限制及重試額度。                                                             |
| `workboard_link`                                                                                                                                 | 將父卡片連結至子卡片。所有父卡片達到 `done` 前，子卡片會維持 `todo`；之後分派提升會將其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 為呼叫的代理程式認領卡片；將 `backlog`／`todo`／`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在較長時間的執行期間重新整理認領心跳偵測。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 完成、暫停或交接後釋放認領；可將卡片移至下一個狀態。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品及已建立卡片資訊清單（必須參照連結回已完成卡片的卡片）或阻礙原因的結構化生命週期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存於外掛的 SQLite 狀態中、在卡片上建立索引，並於工作者脈絡中公開。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者停止卻未呼叫 `workboard_complete`／`workboard_block` 時封鎖卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板中繼資料（顯示名稱、說明、封存狀態、預設工作區）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 傳回卡片的持久化執行嘗試歷程。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 將粗略的分流／待辦卡片轉為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為相互連結的子卡片，並繼承看板／租戶中繼資料；可使用已建立卡片資訊清單完成父卡片。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會推進持久化游標，讓呼叫端恢復時不會遺失或重複讀取已完成／失敗／過期的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查看板命名空間及佇列統計資料。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接備註或附加證明／成品參照。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 將已封鎖的工作移回 `todo`。                                                                                                                                                         |
| `workboard_dispatch`                                                                                                                             | 觸發相依項目提升或過期認領清理。                                                                                                                                        |

已認領的卡片會拒絕來自其他代理程式的代理工具變更，除非呼叫端
持有 `workboard_claim` 傳回的認領權杖。代理工具或閘道 RPC 呼叫傳回的
每張卡片都會將 `metadata.claim.token` 遮蔽為 `[redacted]`
（權杖本身只會由 `workboard_claim` 在頂層傳回一次），
因此儀表板操作員和其他代理程式可以檢查認領狀態，卻永遠不會
看到可用的權杖。復原會透過
`workboard_promote`／`workboard_reassign`／`workboard_reclaim` 進行，這些操作
不需要權杖。

## 分派

分派僅限於閘道本機：它不會產生任意的作業系統處理程序。一般的
OpenClaw 子代理程式工作階段仍負責執行。一次分派程序會：

1. 提升相依項目已就緒的卡片。
2. 在就緒卡片上記錄分派中繼資料。
3. 封鎖認領已過期或執行已逾時的卡片。
4. 將看板設定的分流卡片標記為協調候選項目。
5. 認領一小批就緒卡片，並透過
   閘道子代理程式執行階段啟動工作者執行。

工作者會取得有限的卡片脈絡，以及透過 Workboard 工具進行心跳偵測、
完成或封鎖卡片所需的認領權杖。

### 工作者選擇

每次程序預設啟動**最多 3 個工作者**。就緒卡片會依
優先順序、位置，再依建立時間排序。一次程序只會為每個
擁有者／代理程式啟動一張卡片，並略過看板上已有執行中或審查中工作的
擁有者。已封存的卡片、已有進行中認領的卡片，以及狀態不為 `ready`
的卡片，絕不會被選中啟動工作者（它們仍可能受到分派資料端的
影響：過期認領清理、相依項目提升、逾時清理）。

工作階段金鑰會依每個看板／卡片確定性產生，因此重複分派會導回
相同的工作者通道，而非建立無關的工作階段：

- 已指派的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派的卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理程式）

如果卡片已認領後仍無法啟動工作者，Workboard 會封鎖該
卡片、清除認領、記錄執行啟動失敗，並附加一行工作者
日誌；此資訊可在儀表板、命令列介面 JSON、代理工具及卡片
診斷中查看。

### 進入點

- 儀表板分派動作
- `openclaw workboard dispatch`
- 可執行命令的頻道上的 `/workboard dispatch`

當閘道可用時，三者都會使用閘道子代理程式執行階段。命令列介面
提供一種操作員備援：如果閘道呼叫因連線／無法使用錯誤而失敗
（或舊版閘道傳回 `unknown method` 錯誤），且未指定明確的
`--url`／`--token` 目標，也沒有已設定的遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），命令列介面會針對本機
SQLite 狀態執行僅資料分派；它可以提升相依項目、
清理過期認領並封鎖逾時執行，但無法啟動工作者。可連線閘道傳回的驗證、
權限及輸入驗證失敗不會被視為無法使用；它們會呈現為命令錯誤，
而指定明確 `--url`／`--token` 目標時發生的任何閘道
失敗亦同。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 及 `orchestratorProfile`。OpenClaw 會記錄此意圖，並
在工作者脈絡中公開；實際的規格釐清／分解仍會
透過一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存的卡片（`--include-archived`
可覆寫此行為）；`--json` 一律包含已封存的卡片，與現有指令碼所使用的完整卡片
契約一致。`show` 接受不具歧義的 ID 前綴。
`list`、`create` 及 `show` 一律直接讀寫本機外掛狀態。
只有 `dispatch` 會呼叫執行中的閘道，並採用上述備援行為。

完整旗標、JSON 輸出、閘道備援行為、ID 前綴處理、
分派選擇規則及疑難排解，請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`
及 `/workboard dispatch` 會映射命令列介面的行為。清單與顯示是
任何已授權命令傳送者皆可執行的讀取操作。建立與分派在
聊天介面上需要擁有者身分，或使用具有 `operator.write`／`operator.admin` 的閘道用戶端。

## 工作階段生命週期同步

卡片可以連結至現有的儀表板工作階段，也可以連結至你從卡片開始工作時建立的工作階段。已連結的卡片會以行內方式顯示工作階段生命週期：執行中、過時、已連結但閒置、已完成、失敗或遺失。你也可以在「工作階段」分頁中使用 **新增至工作看板** 擷取現有工作階段；卡片會連結至該工作階段，以工作階段標籤或最近的使用者提示作為標題，並在可用時，以最近的使用者提示加上最新的助理回應預先填入備註。

如果已連結的工作階段遺失，卡片仍會保留連結以提供脈絡，並繼續提供啟動控制項，讓你能以新的工作階段重新開始。如果作用中的已連結工作階段停止回報近期活動，工作看板會將卡片標記為 `stale`，並將其儲存為中繼資料，直到生命週期將其清除。

當卡片處於作用中的工作狀態時，工作看板會跟隨已連結工作階段的狀態：

| 已連結工作階段狀態                    | 卡片狀態    |
| ------------------------------------- | ----------- |
| 作用中                                | `running`   |
| 已完成                                | `review`    |
| 失敗、遭終止、逾時或中止              | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done` 後，該卡片會停止自動同步，直到你將它移回 `todo` 或 `running`。

啟動卡片時會使用一般的閘道工作階段；工作看板只儲存卡片中繼資料和連結。對話逐字稿、模型選擇和執行生命週期仍由一般工作階段系統管理。對作用中的已連結卡片使用 **停止** 可中止目前的執行；工作看板會將該卡片標記為 `blocked`，使其保持可見以供後續處理。

新卡片可以從工作看板範本（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）開始建立。範本會預先填入標題、備註、標籤和優先順序；範本 ID 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在控制介面中開啟「工作看板」分頁。
2. 建立卡片並填入標題、備註、優先順序、標籤、選填的代理程式，以及選填的已連結工作階段；或開啟「工作階段」並針對現有工作階段選擇 **新增至工作看板**。
3. 在各欄之間拖曳卡片，或將焦點移至其精簡狀態控制項，並使用選單或 ArrowLeft/ArrowRight。
4. 從卡片開始工作，以建立或重用儀表板工作階段。
5. 代理程式工作時，從卡片開啟已連結的工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，接受後再手動將卡片移至 `done`。

## 診斷

診斷是根據本機卡片中繼資料計算而得。內建檢查會標記：

| 類型                        | 條件                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派的 `todo`/`backlog`/`ready` 卡片超過 1 小時未更新。                       |
| `running_without_heartbeat` | `running` 卡片超過 20 分鐘沒有認領心跳偵測或執行更新。                          |
| `blocked_too_long`          | `blocked` 卡片超過 24 小時未更新。                                              |
| `repeated_failures`         | 卡片追蹤的失敗次數達到 2 次以上。                                               |
| `missing_proof`             | `done` 卡片沒有證明、成品或附件。                                               |
| `orphaned_session`          | `running` 卡片具有 `sessionKey`，但沒有 `execution` 中繼資料。                  |

## 權限

閘道 RPC 方法位於 `workboard.*` 下：

| 範圍             | 方法                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                                           |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、工作者記錄、通訊協定違規、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

沒有任何 RPC 方法需要 `operator.admin`。使用唯讀操作員權限連線的瀏覽器可以查看看板，但無法變更卡片。

## 儲存

工作看板會將永久資料儲存在 OpenClaw 狀態目錄下、由外掛擁有的關聯式 SQLite 資料庫中：看板、卡片、標籤、生命週期事件、執行嘗試、留言、相依性連結、證明、成品參照、附件中繼資料與二進位大型物件、診斷、通知、工作者記錄、通訊協定狀態和訂閱，全都位於工作看板資料表中（而非外掛鍵值項目）。匯出卡片時會保留看板敘事，但不會內嵌附件二進位大型物件的內容。

曾在 `.28` 版本中使用工作看板的安裝，可以執行 `openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在時的 `workboard.attachments`）遷移至關聯式資料庫。

## 疑難排解

**分頁顯示工作看板無法使用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 加入其中。如果 `plugins.deny` 包含 `workboard`，請先將其移除，再啟用外掛。

**卡片無法儲存**

確認瀏覽器連線具有 `operator.write` 權限。唯讀操作員工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片後未開啟預期的工作階段**

檢查卡片的代理程式 ID 和已連結工作階段，然後開啟「工作階段」或「聊天」以查看實際執行狀態。

**分派未啟動工作者**

確認至少有一張沒有作用中認領的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料分派，請啟動或重新啟動閘道後重試；僅資料分派會更新本機看板狀態，但無法啟動子代理程式工作者執行。如果同一擁有者或代理程式已有另一張卡片正在執行或等待審查，卡片也可能被略過；請先完成、封鎖或釋放該作用中工作，再為同一擁有者分派更多工作。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [工作看板命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
