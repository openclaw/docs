---
read_when:
    - 你想在控制介面中使用看板式工作板
    - 你正在啟用或停用內建的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下追蹤代理程式的規劃工作
summary: 選用的儀表板工作看板，用於代理程式擁有的卡片與工作階段交接
title: 工作看板外掛
x-i18n:
    generated_at: "2026-07-12T14:43:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在
[控制介面](/zh-TW/web/control-ui)中新增選用的看板式工作區：適合代理程式處理的工作卡片、將卡片指派給代理程式，以及返回卡片所屬任務、執行和儀表板工作階段的連結。

Workboard 刻意保持精簡：它追蹤單一 OpenClaw 閘道的本機營運工作。它不能取代 GitHub Issues、Linear、Jira 或其他團隊專案管理系統。

## 啟用

Workboard 已隨附，但預設為停用：

1. 在控制介面中開啟 **外掛**，或使用相對於已設定控制介面基底路徑的 `/settings/plugins`。例如，基底路徑為 `/openclaw` 時，請使用 `/openclaw/settings/plugins`。
2. 找到 **Workboard** 並選擇 **啟用**。由於 Workboard 已包含在 OpenClaw 中，因此不需要執行 **安裝** 動作。
3. 如果介面回報需要重新啟動，請重新啟動閘道。

外掛執行階段載入後，Workboard 分頁會出現在儀表板導覽列中。停用時，此分頁會在導覽列中保持隱藏。當外掛已停用或遭 `plugins.allow`/`plugins.deny` 封鎖時，直接開啟 `/workboard` 路由會顯示外掛無法使用的狀態，而不是卡片資料。

等效的命令列介面工作流程如下：

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
| 連結參照    | 選用的任務、執行、工作階段或來源 URL                                                                          |
| `execution` | 從卡片啟動之 Codex/Claude 執行的選用中繼資料（引擎、模式、模型、工作階段、執行 ID、狀態）                     |

卡片也會包含精簡的中繼資料，用於記錄嘗試、註解、連結、證明、成品、自動化設定、附件、工作代理程式日誌、工作代理程式通訊協定狀態、認領、診斷、通知、範本 ID、封存狀態和過期工作階段偵測，以及近期事件清單（`created`、`edited`、`moved`、`linked`、`specified`、`decomposed`、`claimed`、`heartbeat`、`execution_updated`、`attempt_started`、`attempt_updated`、`comment_added`、`link_added`、`proof_added`、`artifact_added`、`attachment_added`、`diagnostic`、`notification`、`dispatch`、`orchestration`、`protocol_violation`、`archived`、`unarchived`、`stale`）。這些中繼資料可讓操作者無須開啟已連結的工作階段，就能瞭解卡片如何在看板中流轉；它屬於本機營運情境，無法取代工作階段逐字記錄或 GitHub issue 歷程。

卡片儲存在外掛自己的閘道狀態中，並會與該閘道的其他 OpenClaw 狀態一同移動（請參閱[儲存空間](#storage)）。

## 從卡片開始工作

未連結的卡片可以直接開始工作：

- **執行 Codex** / **執行 Claude** 會以明確指定的引擎啟動受任務追蹤的代理程式執行、傳送卡片提示詞，並將卡片標記為 `running`。Codex 執行使用 `openai/gpt-5.6-sol`；Claude 執行使用 `anthropic/claude-sonnet-4-6`。
- **開啟 Codex** / **開啟 Claude** 會建立已連結的儀表板工作階段，但不會傳送卡片提示詞或移動卡片，適用於持續附加至看板的手動工作。

自主啟動會使用閘道受任務追蹤的代理程式執行路徑（除非明確選擇 Codex/Claude，否則使用預設代理程式和模型）；接著，Workboard 會將產生的任務、執行 ID 和工作階段金鑰連結回卡片。每個已連結的執行也會記錄嘗試摘要（引擎、模式、模型、執行 ID、時間戳記、狀態、累計失敗次數），讓重複發生的失敗持續可見。

儀表板會從閘道任務帳本重新整理任務狀態，並依任務 ID、執行 ID 或已連結的工作階段金鑰，將任務與卡片配對。已排入佇列或執行中的任務會讓卡片的生命週期保持活躍；已完成、失敗、逾時或已取消的任務，會使用與已連結工作階段相同的同步規則，將卡片移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含認領／診斷狀態的精簡卡片；可選擇依看板篩選。                                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片及有界限的工作者情境（備註、嘗試、留言、連結、證明、成品、父卡片結果、受指派者近期工作、進行中的診斷）。                                                                    |
| `workboard_create`                                                                                                                               | 建立卡片，並可選擇指定父卡片、租戶、Skills、看板、工作區中繼資料、冪等性金鑰、執行時間限制及重試額度。                                                                                  |
| `workboard_link`                                                                                                                                 | 將父卡片連結至子卡片。子卡片會維持 `todo`，直到所有父卡片都達到 `done`，接著派送提升會將其移至 `ready`。                                                                                |
| `workboard_claim`                                                                                                                                | 為呼叫的代理程式認領卡片；將 `backlog`／`todo`／`ready` 移至 `running`。                                                                                                                |
| `workboard_heartbeat`                                                                                                                            | 在較長時間的執行期間重新整理認領心跳偵測。                                                                                                                                               |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放認領；可將卡片移至下一個狀態。                                                                                                                                   |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品及已建立卡片資訊清單（必須參照連結回已完成卡片的卡片）或阻礙原因的結構化生命週期工具。                                                                          |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛 SQLite 狀態中、建立卡片索引，並在工作者情境中公開。                                                                                                            |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者未呼叫 `workboard_complete`／`workboard_block` 就停止時封鎖卡片。                                                                                     |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化的看板中繼資料（顯示名稱、說明、封存狀態、預設工作區）。                                                                                                                       |
| `workboard_runs`                                                                                                                                 | 傳回卡片的持久化執行嘗試歷程。                                                                                                                                                           |
| `workboard_specify`                                                                                                                              | 將粗略的分流／待處理卡片轉為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                                                |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為互相連結的子卡片，並繼承看板／租戶中繼資料；可用已建立卡片資訊清單完成父卡片。                                                                                        |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端能夠繼續讀取，而不會遺失或重複讀取已完成／失敗／過時的卡片事件。                                                     |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查看板命名空間與佇列統計資料。                                                                                                                                                         |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                                   |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接備註或附加證明／成品參照。                                                                                                                                                       |
| `workboard_unblock`                                                                                                                              | 將遭封鎖的工作移回 `todo`。                                                                                                                                                              |
| `workboard_dispatch`                                                                                                                             | 觸發相依性提升或過時認領清理。                                                                                                                                                           |

已認領的卡片會拒絕來自其他代理程式的代理程式工具變更，除非呼叫端持有
`workboard_claim` 傳回的認領權杖。代理程式工具或閘道 RPC 呼叫傳回的每張
卡片都會將 `metadata.claim.token` 遮蔽為 `[redacted]`
（權杖本身僅由 `workboard_claim` 在頂層傳回一次），
因此儀表板操作員和其他代理程式可以檢查認領狀態，而永遠不會
看到可用的權杖。復原會透過
`workboard_promote`／`workboard_reassign`／`workboard_reclaim` 進行，這些操作
不需要權杖。

## 派送

派送位於閘道本機：它不會產生任意的作業系統程序。一般的
OpenClaw 子代理程式工作階段仍負責執行。一次派送流程會：

1. 提升相依性已就緒的卡片。
2. 在已就緒卡片上記錄派送中繼資料。
3. 封鎖認領已到期或執行逾時的卡片。
4. 將看板設定的分流卡片標記為協調候選項目。
5. 認領一小批已就緒卡片，並透過
   閘道子代理程式執行階段啟動工作者執行。

工作者會取得有界限的卡片情境，以及透過 Workboard 工具傳送心跳偵測、
完成或封鎖卡片所需的認領權杖。

### 工作者選擇

每次派送預設啟動**至多 3 個工作者**。已就緒卡片會先依
優先順序、再依位置，最後依建立時間排序。每次派送對每個
擁有者／代理程式只會啟動一張卡片，並略過看板上已有執行中或審查中工作的
擁有者。已封存的卡片、具有有效認領的卡片，以及狀態不是 `ready`
的卡片，絕不會被選來啟動工作者（但仍可能受到派送資料端的影響：
清理過時認領、提升相依性、清理逾時）。

每個看板／卡片的工作階段金鑰皆為確定性值，因此重複派送會路由
回相同的工作者通道，而不是建立不相關的工作階段：

- 已指派的卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派的卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理程式）

若卡片被認領後無法啟動工作者，Workboard 會封鎖該
卡片、清除認領、記錄執行啟動失敗，並附加一行工作者
日誌；可在儀表板、命令列介面 JSON、代理程式工具及卡片
診斷中查看。

### 進入點

- 儀表板派送動作
- `openclaw workboard dispatch`
- 可執行命令的頻道上的 `/workboard dispatch`

閘道可用時，這三者都會使用閘道子代理程式執行階段。命令列介面
提供一種操作員後援機制：若閘道呼叫因連線／無法使用錯誤而失敗
（或舊版閘道回傳 `unknown method` 錯誤），且未指定明確的
`--url`／`--token` 目標，也沒有已設定的遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`）適用，命令列介面會針對
本機 SQLite 狀態執行僅資料派送；它可以提升相依性、
清理過時認領及封鎖逾時執行，但無法啟動工作者。可連線閘道回傳的驗證、
權限及有效性檢查失敗不會視為無法使用；這些失敗會顯示為命令錯誤，
而在指定明確的 `--url`／`--token` 目標時，任何閘道
失敗也同樣如此。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 及 `orchestratorProfile`。OpenClaw 會記錄此意圖，並
在工作者情境中公開；實際的規格制定／分解仍會
透過一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "修正過時的卡片生命週期" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 的文字輸出預設隱藏已封存卡片（`--include-archived`
可覆寫）；`--json` 一律包含已封存卡片，符合現有指令碼使用的完整卡片
契約。`show` 接受無歧義的 ID 前綴。
`list`、`create` 和 `show` 一律直接讀取／寫入本機外掛狀態。
只有 `dispatch` 會呼叫執行中的閘道，並採用上述後援機制。

完整旗標、JSON 輸出、閘道後援行為、ID 前綴處理、派送選擇規則及
疑難排解，請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`
及 `/workboard dispatch` 對應命令列介面。對任何已授權的命令傳送者而言，
list 和 show 都是讀取操作。在聊天介面上，create 和 dispatch 需要擁有者狀態；
若透過閘道用戶端操作，則需要 `operator.write`／`operator.admin`。

## 工作階段生命週期同步

卡片可以連結至現有的儀表板工作階段，或連結至你從卡片開始工作時建立的工作階段。已連結的卡片會在卡片內顯示工作階段生命週期：執行中、過期、已連結但閒置、完成、失敗或遺失。你也可以在工作階段分頁中使用 **新增至工作看板** 擷取現有工作階段；卡片會連結至該工作階段，以工作階段標籤或近期使用者提示作為標題，並在可用時以近期使用者提示加上最新的助理回應預填備註。

如果已連結的工作階段遺失，卡片仍會保留連結以提供脈絡，並繼續提供開始控制項，讓你在新的工作階段中重新啟動。如果作用中的已連結工作階段停止回報近期活動，工作看板會將卡片標記為 `stale`，並將其儲存為中繼資料，直到生命週期將其清除。

當卡片處於作用中的工作狀態時，工作看板會跟隨已連結工作階段的狀態：

| 已連結工作階段狀態 | 卡片狀態 |
| ------------------------------------- | ----------- |
| 作用中 | `running`   |
| 已完成 | `review`    |
| 失敗、遭終止、逾時或中止 | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done` 會停止該卡片的自動同步，直到你將它移回 `todo` 或 `running`。

啟動卡片會使用一般的閘道工作階段；工作看板只會儲存卡片中繼資料與連結。對話逐字稿、模型選擇與執行生命週期仍由一般工作階段系統管理。在即時連結的卡片上使用 **停止** 可中止作用中的執行；工作看板會將該卡片標記為 `blocked`，使其保持可見以便後續處理。

新卡片可從工作看板範本（`bugfix`、`docs`、`release`、`pr_review`、`plugin`）開始。範本會預填標題、備註、標籤與優先順序；範本 id 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在控制介面中開啟工作看板分頁。
2. 建立卡片並填入標題、備註、優先順序、標籤、選用的代理，以及選用的已連結工作階段；或者開啟工作階段，並為現有工作階段選擇 **新增至工作看板**。
3. 在欄之間拖曳卡片，或將焦點移至其精簡狀態控制項，並使用選單或 ArrowLeft/ArrowRight。
4. 從卡片開始工作，以建立或重複使用儀表板工作階段。
5. 當代理工作時，從卡片開啟已連結的工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，然後在接受後手動將卡片移至 `done`。

## 診斷

診斷會根據本機卡片中繼資料計算。內建檢查會標記：

| 類型 | 條件 |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派且超過 1 小時未更新的 `todo`/`backlog`/`ready` 卡片。 |
| `running_without_heartbeat` | 超過 20 分鐘沒有宣告心跳偵測或執行更新的 `running` 卡片。 |
| `blocked_too_long`          | 超過 24 小時未更新的 `blocked` 卡片。 |
| `repeated_failures`         | 卡片追蹤的失敗次數達到 2 次或更多。 |
| `missing_proof`             | 沒有證明、成品或附件的 `done` 卡片。 |
| `orphaned_session`          | 有 `sessionKey` 但沒有 `execution` 中繼資料的 `running` 卡片。 |

## 權限

閘道 RPC 方法位於 `workboard.*` 下：

| 範圍 | 方法 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件清單/取得、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs` |
| `operator.write` | `cards.diagnostics.refresh`、建立/更新/移動/刪除/留言/連結/連結相依項目/證明/成品、附件新增/刪除、工作程式記錄、通訊協定違規、宣告/心跳偵測/釋放/提升/重新指派/收回/完成/封鎖/解除封鎖、`cards.dispatch`、`cards.bulk`、封存、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知訂閱/刪除/推進 |

沒有任何 RPC 方法需要 `operator.admin`。使用唯讀操作員存取權連線的瀏覽器可以檢視看板，但無法變更卡片。

## 儲存空間

工作看板會將永久資料儲存在 OpenClaw 狀態目錄下、由外掛擁有的關聯式 SQLite 資料庫中：看板、卡片、標籤、生命週期事件、執行嘗試、留言、相依性連結、證明、成品參照、附件中繼資料與 Blob、診斷、通知、工作程式記錄、通訊協定狀態和訂閱，全都位於工作看板資料表中（而非外掛鍵值項目）。卡片匯出會保留看板敘事，而不會內嵌附件 Blob 的內容。

曾在 `.28` 版本使用工作看板的安裝環境，可以執行 `openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及存在時的 `workboard.attachments`）移轉至關聯式資料庫。

## 疑難排解

**分頁顯示工作看板無法使用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 加入其中。如果 `plugins.deny` 包含 `workboard`，請先將其移除，再啟用外掛。

**卡片無法儲存**

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作員工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片時未開啟預期的工作階段**

檢查卡片的代理 id 與已連結工作階段，然後開啟工作階段或聊天以檢查實際執行狀態。

**分派未啟動工作程式**

確認至少有一張沒有作用中宣告的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料分派，請啟動或重新啟動閘道後重試；僅資料分派會更新本機看板狀態，但無法啟動子代理工作程式執行。若同一擁有者或代理的另一張卡片已在執行中或等待審查，卡片也可能會遭到略過；請先完成、封鎖或釋放該作用中的工作，再為同一擁有者分派更多工作。

## 相關內容

- [控制介面](/zh-TW/web/control-ui)
- [工作看板命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
