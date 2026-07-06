---
read_when:
    - 你想在控制介面中使用看板式工作看板
    - 你正在啟用或停用內建的 Workboard 外掛
    - 你想要在沒有外部專案管理工具的情況下追蹤規劃中的代理工作
summary: 代理擁有卡片與工作階段交接的選用儀表板工作看板
title: Workboard 外掛
x-i18n:
    generated_at: "2026-07-06T21:52:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e76d9f64d6117b1a9486270e385d79334a11b2658853473beaf9fb23f8327b00
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在
[控制 UI](/zh-TW/web/control-ui) 新增一個選用的看板式工作板：適合代理規模的工作卡、指派給代理，
以及連回卡片任務、執行和儀表板工作階段的連結。

Workboard 刻意保持小型：它追蹤單一 OpenClaw 閘道的本機作業工作。
它不是 GitHub Issues、Linear、Jira 或其他團隊專案管理系統的替代品。

## 啟用它

Workboard 已隨附，但預設停用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

啟用外掛後，Workboard 分頁會出現在儀表板導覽列中；
停用時，該分頁會在導覽中保持隱藏。當外掛停用，或被
`plugins.allow`/`plugins.deny` 封鎖時，直接開啟
`/workboard` 路由會顯示外掛不可用狀態，而不是卡片資料。

## 設定

Workboard 沒有外掛專屬設定。請使用標準外掛項目啟用/停用它：

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
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | 自由格式字串                                                                                                  |
| `agentId`   | 選用的已指派代理                                                                                              |
| 連結參照    | 選用的任務、執行、工作階段或來源 URL                                                                          |
| `execution` | 從卡片啟動的 Codex/Claude 執行的選用中繼資料（引擎、模式、模型、工作階段、執行 ID、狀態） |

卡片也會帶有精簡中繼資料，用於嘗試、留言、連結、證明、
成品、自動化設定、附件、工作者記錄、工作者協定狀態、
宣告、診斷、通知、範本 ID、封存狀態和過期工作階段偵測，
外加近期事件清單（`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`）。這些中繼資料讓
操作員不必開啟連結的工作階段，也能查看卡片如何在工作板上移動；
它是本機作業脈絡，不是工作階段文字記錄或 GitHub 議題歷史的替代品。

卡片會儲存在外掛自己的閘道狀態中，並與該閘道其餘的
OpenClaw 狀態一起移動（請參閱[儲存](#storage)）。

## 從卡片開始工作

未連結的卡片可以直接開始工作：

- **執行 Codex** / **執行 Claude** 會以明確的引擎啟動受任務追蹤的代理執行，
  傳送卡片提示，並將卡片標記為 `running`。Codex
  執行使用 `openai/gpt-5.5`；Claude 執行使用 `anthropic/claude-sonnet-4-6`。
- **開啟 Codex** / **開啟 Claude** 會建立連結的儀表板工作階段，
  但不會傳送卡片提示或移動卡片，適用於仍附加在工作板上的手動工作。

自主啟動會使用閘道的受任務追蹤代理執行路徑（預設代理
和模型，除非明確選擇 Codex/Claude）；接著 Workboard 會把產生的
任務、執行 ID 和工作階段金鑰連回卡片。每個連結的
執行也會記錄一次嘗試摘要（引擎、模式、模型、執行 ID、
時間戳記、狀態、滾動失敗次數），讓重複失敗保持可見。

儀表板會從閘道任務分類帳重新整理任務狀態，依任務 ID、
執行 ID 或連結的工作階段金鑰將任務對應到卡片。佇列中/執行中的
任務會保持卡片生命週期為作用中；已完成、失敗、逾時或
取消的任務，會使用與連結工作階段相同的同步規則，將卡片推向
`review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理工具

| 工具                                                                                                                                             | 目的                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出帶有宣告/診斷狀態的精簡卡片；可選用工作板篩選器。                                                                      |
| `workboard_read`                                                                                                                                 | 傳回一張卡片，加上有界的工作者脈絡（筆記、嘗試、留言、連結、證明、成品、父層結果、近期受指派者工作、作用中診斷）。        |
| `workboard_create`                                                                                                                               | 建立卡片，可選用父層、租戶、Skills、工作板、工作區中繼資料、冪等性金鑰、執行時間限制、重試預算。                          |
| `workboard_link`                                                                                                                                 | 將父卡片連結到子卡片。子卡片會保持 `todo`，直到每個父層都到達 `done`，接著派送晉升會將它們移到 `ready`。                   |
| `workboard_claim`                                                                                                                                | 為呼叫代理宣告卡片；將 `backlog`/`todo`/`ready` 移入 `running`。                                                            |
| `workboard_heartbeat`                                                                                                                            | 在較長的執行期間重新整理宣告心跳偵測。                                                                                     |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放宣告；可將卡片移到下一個狀態。                                                                     |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品和已建立卡片資訊清單的結構化生命週期工具（必須參照連回已完成卡片的卡片），或封鎖原因。            |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛 SQLite 狀態中、在卡片上建立索引，並在工作者脈絡中公開。                                           |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者記錄行，並在自動化工作者未呼叫 `workboard_complete`/`workboard_block` 就停止時封鎖卡片。                         |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化工作板中繼資料（顯示名稱、描述、封存狀態、預設工作區）。                                                        |
| `workboard_runs`                                                                                                                                 | 傳回卡片的持久化執行嘗試歷史。                                                                                             |
| `workboard_specify`                                                                                                                              | 將粗略的分診/待辦卡片轉換為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                    |
| `workboard_decompose`                                                                                                                            | 將父層編排卡片展開成連結的子卡片，繼承工作板/租戶中繼資料；可用已建立卡片資訊清單完成父層。                               |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端可繼續讀取，而不會遺失或重複讀取已完成/失敗/過期卡片事件。 |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查工作板命名空間和佇列統計。                                                                                             |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                     |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接筆記或附加證明/成品參照。                                                                                          |
| `workboard_unblock`                                                                                                                              | 將被封鎖的工作移回 `todo`。                                                                                                |
| `workboard_dispatch`                                                                                                                             | 推動相依性晉升或過期宣告清理。                                                                                             |

已認領的卡片會拒絕來自其他代理程式的代理工具變更，除非呼叫者
持有 `workboard_claim` 傳回的認領權杖。代理工具或閘道 RPC 呼叫傳回的每張卡片
都會將 `metadata.claim.token` 遮蔽為 `[redacted]`
（權杖本身只會由 `workboard_claim` 以頂層欄位傳回一次），
因此儀表板操作者和其他代理程式可以檢查認領狀態，而永遠不會
看到可用的權杖。復原會透過
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 進行，這些操作不
需要權杖。

## 分派

分派是閘道本機操作：它不會產生任意作業系統程序。一般
OpenClaw 子代理工作階段仍然負責執行。一次分派流程會：

1. 提升相依項已就緒的卡片。
2. 在就緒卡片上記錄分派中繼資料。
3. 封鎖過期認領或逾時執行。
4. 將由看板設定的分流卡片標記為協調候選項。
5. 認領一小批就緒卡片，並透過閘道子代理執行階段啟動工作者執行。

工作者會取得有界限的卡片內容，以及透過 Workboard 工具對卡片進行心跳偵測、
完成或封鎖所需的認領權杖。

### 工作者選擇

每次流程預設**最多啟動 3 個工作者**。就緒卡片會依
優先順序、位置、建立時間排序。一次流程只會為每個
擁有者/代理程式啟動一張卡片，並略過看板上已有執行中或待審核工作的
擁有者。已封存卡片、具有有效認領的卡片，以及不處於 `ready`
狀態的卡片，永遠不會被選為工作者啟動目標（它們仍可能受
分派資料面影響：過期認領清理、相依項提升、逾時清理）。

工作階段鍵會依看板/卡片決定性產生，因此重複分派會路由回
同一個工作者通道，而不是建立不相關的工作階段：

- 已指派卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理程式）

如果卡片被認領後無法啟動工作者，Workboard 會封鎖該
卡片、清除認領、記錄執行啟動失敗，並附加一行工作者
記錄 - 可在儀表板、命令列介面 JSON、代理工具和卡片
診斷中看到。

### 進入點

- 儀表板分派動作
- `openclaw workboard dispatch`
- 支援命令的頻道上的 `/workboard dispatch`

三者在閘道可用時都會使用閘道子代理執行階段。
命令列介面有一個操作者備援：如果閘道呼叫因
連線/不可用錯誤而失敗（或因較舊閘道的 `unknown method` 錯誤而失敗），
且沒有明確的 `--url`/`--token` 目標，也沒有已設定的遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`）適用，命令列介面會針對本機 SQLite 狀態
執行僅資料分派 - 它可以提升相依項、清理過期認領，
並封鎖逾時執行，但無法啟動工作者。來自可連線閘道的驗證、
權限和驗證失敗不會被視為不可用；它們會顯示為命令錯誤，
而且在提供明確 `--url`/`--token` 目標時，任何閘道
失敗也同樣會顯示為命令錯誤。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 會記錄此意圖並
在工作者內容中公開；實際規格化/分解仍會透過
一般 Workboard 工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存卡片（`--include-archived`
會覆寫）；`--json` 一律包含已封存卡片，符合既有指令碼使用的完整卡片
合約。`show` 接受明確無歧義的 id 前綴。
`list`、`create` 和 `show` 一律直接讀寫本機外掛狀態。
只有 `dispatch` 會呼叫執行中的閘道，並使用上述備援。

請參閱 [Workboard 命令列介面](/zh-TW/cli/workboard)，以了解完整旗標、JSON 輸出、閘道
備援行為、id 前綴處理、分派選擇規則和
疑難排解。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
和 `/workboard dispatch` 對應命令列介面。List 和 show 是
任何已授權命令傳送者都可執行的讀取操作。Create 和 dispatch 在
聊天介面上需要擁有者身分，或需要具有 `operator.write`/`operator.admin` 的閘道用戶端。

## 工作階段生命週期同步

卡片可以連結到既有儀表板工作階段，或連結到你從卡片
開始工作時建立的工作階段。已連結卡片會內嵌顯示工作階段生命週期：
執行中、過期、已連結閒置、完成、失敗或遺失。你也可以從 Sessions 分頁使用 **Add to Workboard**
擷取既有工作階段；該卡片會連結到該工作階段，使用工作階段標籤或近期使用者提示作為標題，
並在可用時以近期使用者提示加上最新助理回應
填入備註。

如果已連結工作階段遺失，卡片會保持連結以保留內容脈絡，
並仍提供啟動控制項，以重新啟動到新的工作階段。如果有效的
已連結工作階段停止回報近期活動，Workboard 會將卡片標記為
`stale`，並將其儲存為中繼資料，直到生命週期清除它為止。

當卡片處於有效工作狀態時，Workboard 會跟隨已連結工作階段：

| 已連結工作階段狀態                    | 卡片狀態    |
| ------------------------------------- | ----------- |
| 作用中                                | `running`   |
| 已完成                                | `review`    |
| 失敗、已終止、逾時或已中止 | `blocked`   |

**手動審核狀態優先。** 將卡片移至 `review`、`blocked` 或 `done`
會停止該卡片的自動同步，直到你將它移回 `todo` 或 `running`。

啟動卡片會使用一般閘道工作階段；Workboard 只儲存卡片
中繼資料和連結。對話逐字稿、模型選擇和執行
生命週期仍由一般工作階段系統擁有。對即時
已連結卡片使用 **Stop** 以中止有效執行 - Workboard 會將該卡片標記為 `blocked`，讓它
保持可見以便後續處理。

新卡片可以從 Workboard 範本開始（`bugfix`、`docs`、`release`、
`pr_review`、`plugin`）。範本會預先填入標題、備註、標籤和優先順序；
範本 id 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在控制 UI 中開啟 Workboard 分頁。
2. 建立包含標題、備註、優先順序、標籤、選用代理程式和
   選用已連結工作階段的卡片 - 或開啟 Sessions，並為既有工作階段選擇 **Add to Workboard**。
3. 在欄位之間拖曳卡片，或聚焦其精簡狀態控制項，並使用
   選單或 ArrowLeft/ArrowRight。
4. 從卡片開始工作，以建立或重用儀表板工作階段。
5. 在代理程式工作時，從卡片開啟已連結工作階段。
6. 讓生命週期同步將執行中的工作移至 `review`/`blocked`，然後在接受時手動
   將卡片移至 `done`。

## 診斷

診斷會從本機卡片中繼資料計算。內建檢查會標記：

| 類型                        | 條件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派的 `todo`/`backlog`/`ready` 卡片超過 1 小時未更新。             |
| `running_without_heartbeat` | `running` 卡片超過 20 分鐘沒有認領心跳偵測或執行更新。 |
| `blocked_too_long`          | `blocked` 卡片超過 24 小時未更新。                                   |
| `repeated_failures`         | 卡片追蹤的失敗計數達到 2 次或更多。                                |
| `missing_proof`             | `done` 卡片沒有證明、成品或附件。                          |
| `orphaned_session`          | `running` 卡片有 `sessionKey` 但沒有 `execution` 中繼資料。                |

## 權限

閘道 RPC 方法位於 `workboard.*` 之下：

| 範圍            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件 list/get、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件 add/delete、工作者記錄、協定違規、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知 subscribe/delete/advance |

沒有 RPC 方法需要 `operator.admin`。以唯讀
操作者存取權連線的瀏覽器可以檢查看板，但無法變更卡片。

## 儲存

Workboard 會將持久資料儲存在 OpenClaw 狀態目錄下由外掛擁有的關聯式 SQLite 資料庫中：
看板、卡片、標籤、生命週期事件、
執行嘗試、留言、相依項連結、證明、成品參照、
附件中繼資料與 blob、診斷、通知、工作者記錄、
協定狀態和訂閱全都位於 Workboard 資料表中（不是
外掛鍵值項目）。卡片匯出會保留看板敘事，
但不會內嵌附件 blob 內容。

在 `.28` 版本中使用過 Workboard 的安裝可以執行
`openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間
（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及若存在的
`workboard.attachments`）遷移到關聯式資料庫。

## 疑難排解

**分頁顯示 Workboard 不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 加入其中。如果 `plugins.deny`
包含 `workboard`，請先移除它，再啟用此外掛。

**卡片未儲存**

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作者
工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片沒有開啟預期的工作階段**

檢查卡片的代理程式 id 和已連結工作階段，然後開啟 Sessions 或 Chat
檢查實際執行狀態。

**分派未啟動工作者**

確認至少有一張沒有有效認領的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料分派，請啟動或重新啟動閘道並
重試 - 僅資料分派會更新本機看板狀態，但無法啟動
子代理工作者執行。當相同擁有者或代理程式的另一張卡片
已在執行中或等待審核時，卡片也可能被略過；請先完成、
封鎖或釋放該有效工作，再為相同
擁有者分派更多工作。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [Workboard 命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
