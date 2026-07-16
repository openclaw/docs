---
read_when:
    - 你想要在 Control UI 中使用看板式工作板
    - 你正在啟用或停用內建的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下，追蹤代理程式的規劃工作
summary: 供代理程式管理卡片與工作階段交接使用的選用儀表板工作看板
title: 工作看板外掛
x-i18n:
    generated_at: "2026-07-16T11:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在[控制介面](/zh-TW/web/control-ui)中新增選用的看板式工作板：適合代理程式處理的工作卡、將工作指派給代理程式，以及可返回工作卡所屬任務、執行作業和儀表板工作階段的連結。

Workboard 刻意保持精簡：它追蹤單一 OpenClaw 閘道的本機營運工作。它無意取代 GitHub Issues、Linear、Jira 或其他團隊專案管理系統。

## 啟用

Workboard 已隨附，但預設為停用：

1. 在控制介面中開啟 **Plugins**，或使用相對於已設定控制介面基礎路徑的 `/settings/plugins`。例如，基礎路徑為 `/openclaw` 時，會使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 並選擇 **Enable**。由於 Workboard 已包含在 OpenClaw 中，因此不需要執行 **Install** 動作。
3. 如果介面顯示需要重新啟動，請重新啟動閘道。

外掛執行階段載入後，Workboard 分頁會出現在儀表板導覽列中。停用時，該分頁會從導覽列隱藏。若外掛已停用或遭 `plugins.allow`/`plugins.deny` 封鎖，直接開啟 `/workboard` 路由時，會顯示外掛無法使用的狀態，而非工作卡資料。

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

工作卡也包含精簡的中繼資料，用於記錄嘗試、留言、連結、證明、成品、自動化設定、附件、工作程式日誌、工作程式通訊協定狀態、認領、診斷、通知、範本 ID、封存狀態和過時工作階段偵測，另有近期事件清單（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。這些中繼資料讓操作人員不必開啟連結的工作階段，就能查看工作卡如何在工作板上移動；它們是本機營運情境資訊，並非工作階段逐字稿或 GitHub 議題歷程的替代品。

此外掛與控制介面使用同一份 Workboard 工作卡契約。因此，重新整理儀表板時，會保留工作區來源與權限、認領狀態、診斷動作和通知序號，而不會將工作卡投影成較精簡、僅供介面使用的副本。未知的診斷種類、診斷嚴重程度和通知種類會被忽略，直到兩個介面都支援它們為止；絕不會將其改寫成其他有效狀態。

開啟的儀表板會透過 `plugin.workboard.changed` 失效事件進行更新。每個事件僅包含儲存區版本期和修訂版；介面隨後會透過一般的 `operator.read` RPC 重新讀取標準工作卡。多個修訂版會合併為一次後續讀取。拖曳、編輯或寫入工作卡時，Workboard 會延後該讀取，並在本機互動完成後繼續。重新連線一律會執行標準重新載入。系統不會例行輪詢完整工作卡，而 **Refresh** 仍可用於手動復原。

當有多個工作板時，工具列會包含 **Board** 篩選器，其資料來源為持久保存的工作板中繼資料，而不只是目前可見的工作卡。因此，空白和已封存的工作板仍可供選取。沒有明確工作板 ID 的工作卡屬於標準 `default` 工作板。選取的工作板會儲存在 `?board=` 查詢參數中，因此經篩選的 Workboard URL 可加入書籤或分享；選擇 **All boards** 會移除該參數。

工作卡儲存在此外掛自己的閘道狀態中，並會隨該閘道其餘的 OpenClaw 狀態一起移動（請參閱[儲存空間](#storage)）。

## 從工作卡開始工作

未連結的工作卡可直接啟動工作：

- **Run Codex** / **Run Claude** 會使用明確指定的引擎啟動由任務追蹤的代理程式執行作業、傳送工作卡提示詞，並將工作卡標記為 `running`。Codex 執行作業使用 `openai/gpt-5.6-sol`；Claude 執行作業使用 `anthropic/claude-sonnet-4-6`。
- **Open Codex** / **Open Claude** 會建立連結的儀表板工作階段，但不傳送工作卡提示詞，也不移動工作卡，適用於仍附加至工作板的手動工作。

自主啟動會使用閘道由任務追蹤的代理程式執行作業路徑（除非明確選擇 Codex/Claude，否則使用預設代理程式和模型）；接著 Workboard 會將產生的任務、執行作業 ID 和工作階段金鑰連結回工作卡。每次連結的執行也會記錄嘗試摘要（引擎、模式、模型、執行作業 ID、時間戳記、狀態、滾動失敗次數），讓重複失敗持續可見。

儀表板會從閘道任務帳本重新整理任務狀態，並依任務 ID、執行作業 ID 或連結的工作階段金鑰，將任務與工作卡進行比對。已排入佇列或執行中的任務會讓工作卡的生命週期維持作用中；已完成、失敗、逾時或取消的任務，會使用與連結工作階段相同的同步規則，將工作卡移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 以精簡卡片列出認領／診斷狀態；可選擇依看板篩選。                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片及有界限的工作者情境（備註、嘗試、留言、連結、證明、成品、父卡片結果、受指派者最近的工作、作用中的診斷）。                               |
| `workboard_create`                                                                                                                               | 建立卡片，並可選擇指定父卡片、租戶、Skills、看板、工作區中繼資料、冪等性金鑰、執行時間限制及重試額度。                                                             |
| `workboard_link`                                                                                                                                 | 將父卡片連結至子卡片。所有父卡片達到 `done` 前，子卡片會維持 `todo`；之後分派提升會將其移至 `ready`。                                                     |
| `workboard_claim`                                                                                                                                | 為呼叫代理程式認領卡片；將 `backlog`/`todo`/`ready` 移至 `running`。                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 在較長的執行期間重新整理認領心跳偵測。                                                                                                                                          |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放認領；可將卡片移至下一個狀態。                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品與已建立卡片資訊清單（必須參照連結回已完成卡片的卡片）或阻礙原因的結構化生命週期工具。                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛的 SQLite 狀態中、在卡片上建立索引，並在工作者情境中提供。                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者停止但未呼叫 `workboard_complete`/`workboard_block` 時封鎖卡片。                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久保存的看板中繼資料（顯示名稱、說明、封存狀態、預設工作區）。                                                                                            |
| `workboard_runs`                                                                                                                                 | 傳回卡片持久保存的執行嘗試歷程。                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 將粗略的分流／待辦卡片轉為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                      |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為相互連結的子卡片，並繼承看板／租戶中繼資料；可使用已建立卡片資訊清單完成父卡片。                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端恢復時不會遺失或重複讀取已完成／失敗／過期的卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查看板命名空間及佇列統計資料。                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接備註或附加證明／成品參照。                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 將受封鎖的工作移回 `todo`。                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | 將卡片移至其他狀態；已認領的卡片要求呼叫端具備代理程式認領範圍。                                                                                                      |
| `workboard_dispatch`                                                                                                                             | 在不啟動工作者的情況下促使相依項目提升或清理過期認領；工作者啟動使用閘道或斜線命令分派。                                                        |

除非呼叫端持有 `workboard_claim` 傳回的認領權杖，否則已認領的卡片會拒絕其他代理程式透過代理程式工具進行變更。代理程式工具或閘道 RPC 呼叫所傳回的每張卡片，都會將 `metadata.claim.token` 遮蔽為 `[redacted]`（權杖本身只會由 `workboard_claim` 在頂層傳回一次），因此儀表板操作人員和其他代理程式可以檢查認領狀態，卻永遠不會看到可用的權杖。復原會透過 `workboard_promote`/`workboard_reassign`/`workboard_reclaim` 進行，而這些操作不需要權杖。

## 分派

分派僅限閘道本機：不會產生任意的作業系統程序。一般的 OpenClaw 子代理程式工作階段仍負責執行。一次分派流程會：

1. 提升相依項目已就緒的卡片。
2. 在就緒卡片上記錄分派中繼資料。
3. 封鎖認領已到期或執行逾時的卡片。
4. 將看板設定的分流卡片標記為協調候選項目。
5. 認領一小批就緒卡片，並透過閘道子代理程式執行階段啟動工作者執行。

工作者會取得有界限的卡片情境，以及透過 Workboard 工具傳送心跳偵測、完成或封鎖卡片所需的認領權杖。

工作區路徑遵循呼叫端現有的檔案系統權限。具備 `operator.write` 的閘道用戶端可使用已設定的代理程式工作區；`operator.admin` 用戶端可使用主機上的其他簽出目錄。沙箱化代理程式工具使用其沙箱工作區存取權，而未經沙箱化、僅限工作區的工具則使用其設定的工作區根目錄。指派工作區時，Workboard 會記錄該權限，並在分派時再次與目前呼叫端的權限取交集，因此持久保存的卡片無法擴大後續呼叫端的存取權。具有明確主機工作區但未記錄權限的舊卡片，必須先重新儲存該工作區，才能進行完整主機分派；沒有主機路徑的卡片則會在首次分派時採用目前呼叫端的權限。

只有當目錄或 Git 簽出目錄的儲存庫根目錄與目標代理程式工作區完全相符時，工作區繫結分派才會接受該目錄。工作樹要求會縮限至該目錄，並以目錄工作區形式持久保存，因此主機不會具現化簽出目錄或執行儲存庫設定程式碼。目標工作者必須對該確切工作區使用可寫入且非共用的 Docker 沙箱，不得使用提高權限的執行、持久保存的主機／節點執行覆寫，或未分類的外掛與 MCP 工具。Workboard 會列舉其已註冊的工具，而不是信任 `workboard_*` 前綴；若熱啟動 Docker 容器的即時掛載／設定雜湊已過期，分派便會遭拒。分派會回報不相容的目標原則，而不會啟動限制較寬鬆的工作者。完整主機分派可將其他本機簽出目錄設為目標，並保留一般的受管理工作樹設定。

工作區權限不會建立第二套卡片生命週期權限模型。可變更 Workboard 卡片的呼叫端，能在每個介面上手動讓卡片經過相同狀態；唯讀工作區存取權只會阻止需要寫入權限的工作者分派。

### 工作者選擇

每次流程預設啟動**最多 3 個工作者**。就緒卡片會先依優先順序，再依位置，最後依建立時間排序。每次流程對每位擁有者／代理程式只會啟動一張卡片，並跳過看板上已有執行中或審查中工作的擁有者。已封存的卡片、具有作用中認領的卡片，以及狀態不為 `ready` 的卡片，永遠不會被選為工作者啟動項目（但仍可能受到分派資料端的影響：清理過期認領、提升相依項目、清理逾時）。

每個看板／卡片的工作階段金鑰都是確定性的，因此重複分派會導回同一個工作者通道，而不會建立互不相關的工作階段：

- 已指派的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派的卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析已設定的預設代理程式）

如果卡片被認領後無法啟動工作者，Workboard 會封鎖該卡片、清除認領、記錄執行啟動失敗，並附加一行工作者日誌；這些資訊可在儀表板、命令列介面 JSON、代理程式工具及卡片診斷中查看。

### 進入點

- 儀表板分派動作
- `openclaw workboard dispatch`
- 支援命令的頻道上的 `/workboard dispatch`

當閘道可用時，這三者都會使用閘道子代理程式執行階段。命令列介面有一種操作員備援機制：如果閘道呼叫因連線／無法使用錯誤（或較舊閘道的 `unknown method` 錯誤）而失敗，且未套用明確的 `--url`/`--token` 目標，也沒有已設定的遠端閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），命令列介面就會針對本機 SQLite 狀態執行僅資料分派；它可以提升相依項目、清除過期宣告，並阻擋逾時的執行，但無法啟動工作程式。可連線閘道所傳回的驗證、權限及驗證檢查失敗不會視為無法使用；這些失敗會顯示為命令錯誤，而提供明確的 `--url`/`--token` 目標時，任何閘道失敗也同樣會顯示為命令錯誤。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 會記錄此意圖，並在工作程式情境中公開；實際的規格制定／工作拆解仍會透過一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "修正過期卡片生命週期" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存的卡片（`--include-archived` 可覆寫此行為）；`--json` 一律包含已封存的卡片，符合現有指令碼使用的完整卡片合約。`show` 和 `move` 接受不含歧義的 ID 前綴。`list`、`create`、`show` 和 `move` 一律直接讀取／寫入本機外掛狀態。只有 `dispatch` 會呼叫執行中的閘道，並使用上述備援機制。

如需完整旗標、JSON 輸出、閘道備援行為、ID 前綴處理、分派選取規則及疑難排解，請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、`/workboard move <card-id> --status <status>` 和 `/workboard dispatch` 與命令列介面對應。對任何獲授權的命令傳送者而言，列出和顯示都是讀取操作。建立、移動及分派需要聊天介面上的擁有者狀態，或具有 `operator.write`/`operator.admin` 的閘道用戶端。操作員手動移動時，使用與儀表板拖放相同的宣告覆寫行為。其工作樹存取權仍遵循上述相同的工作區邊界。

## 工作階段生命週期同步

卡片可以連結至現有的儀表板工作階段，或連結至從卡片開始工作時建立的工作階段。已連結的卡片會直接顯示工作階段生命週期：執行中、過期、已連結但閒置、完成、失敗或遺失。你也可以在工作階段分頁中使用 **新增至 Workboard** 擷取現有工作階段；卡片會連結至該工作階段，以工作階段標籤或近期使用者提示作為標題，並在可用時，以近期使用者提示加上最新的助理回覆預先填入備註。

如果已連結的工作階段遺失，卡片仍會保留連結以提供情境，並繼續提供啟動控制項，讓你重新啟動至新的工作階段。如果使用中的已連結工作階段停止回報近期活動，Workboard 會將卡片標記為 `stale`，並將其儲存為中繼資料，直到生命週期清除該標記。

當卡片處於進行中的工作狀態時，Workboard 會依循已連結的工作階段：

| 已連結的工作階段狀態                  | 卡片狀態 |
| ------------------------------------- | ----------- |
| 使用中                                | `running`   |
| 已完成                                | `review`    |
| 失敗、遭終止、逾時或中止 | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done`，會停止該卡片的自動同步，直到你將其移回 `todo` 或 `running`。

啟動卡片會使用一般閘道工作階段；Workboard 僅儲存卡片中繼資料和連結。對話文字記錄、模型選取及執行生命週期仍由一般工作階段系統管理。在使用中的已連結卡片上使用 **停止** 可中止進行中的執行；Workboard 會將該卡片標記為 `blocked`，使其繼續顯示以供後續處理。

新卡片可從 Workboard 範本（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）開始。範本會預先填入標題、備註、標籤及優先順序；範本 ID 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在控制介面中開啟 Workboard 分頁。
2. 建立包含標題、備註、優先順序、標籤、選用代理程式及選用已連結工作階段的卡片；或開啟工作階段，並對現有工作階段選擇 **新增至 Workboard**。
3. 在各欄之間拖曳卡片，或聚焦其精簡狀態控制項，並使用選單或 ArrowLeft/ArrowRight。拖曳期間，來源卡片會變暗，而可放置的欄會顯示外框。
4. 從卡片開始工作，以建立或重複使用儀表板工作階段。
5. 代理程式工作時，從卡片開啟已連結的工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，然後在接受後手動將卡片移至 `done`。

## 診斷

診斷結果是根據本機卡片中繼資料計算。內建檢查會標示：

| 類型                        | 條件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派且超過 1 小時未更新的 `todo`/`backlog`/`ready` 卡片。             |
| `running_without_heartbeat` | 超過 20 分鐘沒有宣告心跳偵測或執行更新的 `running` 卡片。 |
| `blocked_too_long`          | 超過 24 小時未更新的 `blocked` 卡片。                                   |
| `repeated_failures`         | 卡片所追蹤的失敗次數達到 2 次以上。                                |
| `missing_proof`             | 沒有證明、成品或附件的 `done` 卡片。                          |
| `orphaned_session`          | 有 `sessionKey` 但沒有 `execution` 中繼資料的 `running` 卡片。                |

## 權限

閘道 RPC 方法位於 `workboard.*` 下：

| 範圍            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、工作程式記錄、協定違規、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

沒有任何 RPC 方法需要 `operator.admin`。以唯讀操作員存取權連線的瀏覽器可以檢視看板，但無法變更卡片。管理員範圍會擴大可接受的 Workboard 主機路徑，但不會變更可用的方法。

## 儲存空間

Workboard 將耐久資料儲存在 OpenClaw 狀態目錄下由外掛擁有的關聯式 SQLite 資料庫中：看板、卡片、標籤、生命週期事件、執行嘗試、留言、相依性連結、證明、成品參照、附件中繼資料與 Blob、診斷、通知、工作程式記錄、協定狀態及訂閱，全都存放在 Workboard 資料表中（而非外掛鍵值項目）。卡片匯出會保留看板敘事，但不會內嵌附件 Blob 內容。

曾在 `.28` 版本中使用 Workboard 的安裝環境，可以執行 `openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在時的 `workboard.attachments`）遷移至關聯式資料庫。

## 疑難排解

**分頁顯示 Workboard 無法使用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 新增至其中。如果 `plugins.deny` 包含 `workboard`，請先將其移除，再啟用外掛。

**卡片無法儲存**

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作員工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片時未開啟預期的工作階段**

檢查卡片的代理程式 ID 和已連結的工作階段，然後開啟工作階段或聊天以檢視實際執行狀態。

**分派未啟動工作程式**

確認至少有一張沒有使用中宣告的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料分派，請啟動或重新啟動閘道後再試一次；僅資料分派會更新本機看板狀態，但無法啟動子代理程式工作程式執行。如果同一擁有者或代理程式的其他卡片已在執行中或等待審查，卡片也可能會遭略過；請先完成、阻擋或釋放該進行中的工作，再為同一擁有者分派更多工作。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [Workboard 命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
