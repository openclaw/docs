---
read_when:
    - 你想要在控制介面中使用看板式工作板
    - 您正在啟用或停用內建的 Workboard 外掛
    - 你想在沒有外部專案管理工具的情況下追蹤規劃中的代理工作
summary: 供代理擁有卡片與工作階段交接使用的選用儀表板工作板
title: Workboard 外掛
x-i18n:
    generated_at: "2026-07-05T11:39:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70ac13ef747af38e49eb49866a9bae7a06f53b8b0b5765f47d0d0cfd2d7b4bc1
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在
[控制介面](/zh-TW/web/control-ui) 新增一個選用的看板式工作板：適合代理程式使用的工作卡、指派給代理程式，
以及連回卡片的任務、執行和儀表板工作階段的連結。

Workboard 刻意保持精簡：它會追蹤單一
OpenClaw 閘道的本機營運工作。它不是 GitHub Issues、Linear、Jira 或
其他團隊專案管理系統的替代品。

## 啟用它

Workboard 已隨附提供，但預設停用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

Workboard 分頁會出現在儀表板導覽列中。如果分頁可見，但
外掛已停用或被 `plugins.allow`/`plugins.deny` 阻擋，該分頁會顯示
外掛無法使用的狀態，而不是卡片資料。

## 設定

Workboard 沒有外掛專屬設定。請使用標準
外掛項目啟用/停用它：

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
| `agentId`   | 選用的已指派代理程式                                                                                          |
| 連結參照    | 選用的任務、執行、工作階段或來源 URL                                                                          |
| `execution` | 從卡片啟動的 Codex/Claude 執行的選用中繼資料（引擎、模式、模型、工作階段、執行 id、狀態）                    |

卡片也會攜帶精簡中繼資料，用於嘗試、留言、連結、證明、
成品、自動化設定、附件、工作者日誌、工作者通訊協定
狀態、宣告、診斷、通知、範本 id、封存狀態和
過期工作階段偵測，外加最近事件清單（`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`）。這些中繼資料讓
操作員無需開啟連結的工作階段，就能看見卡片如何在工作板中移動；
它是本機營運脈絡，不是工作階段
逐字稿或 GitHub issue 歷史的替代品。

卡片儲存在外掛自己的閘道狀態中，並會隨著該閘道的其餘
OpenClaw 狀態一起移動（請參閱[儲存](#storage)）。

## 從卡片開始工作

未連結的卡片可以直接開始工作：

- **執行 Codex** / **執行 Claude** 會以
  明確引擎啟動具任務追蹤的代理程式執行、傳送卡片提示，並將卡片標記為 `running`。Codex
  執行使用 `openai/gpt-5.5`；Claude 執行使用 `anthropic/claude-sonnet-4-6`。
- **開啟 Codex** / **開啟 Claude** 會建立一個連結的儀表板工作階段，但不會
  傳送卡片提示或移動卡片，供仍附掛在工作板上的手動工作使用。

自主啟動會使用閘道的具任務追蹤代理程式執行路徑（預設代理程式
和模型，除非明確選擇 Codex/Claude）；接著 Workboard 會把
產生的任務、執行 id 和工作階段 key 連回卡片。每個連結的
執行也會記錄嘗試摘要（引擎、模式、模型、執行 id、
時間戳記、狀態、滾動失敗計數），讓重複失敗保持可見。

儀表板會從閘道任務分類帳重新整理任務狀態，依據任務 id、執行 id 或連結的工作階段 key 將
任務對應到卡片。佇列中/執行中的
任務會讓卡片的生命週期保持作用中；已完成、失敗、逾時或
已取消的任務，會使用與連結工作階段相同的同步
規則，將卡片移向 `review` 或 `blocked`（請參閱[工作階段生命週期同步](#session-lifecycle-sync)）。

## 代理程式工具

| 工具                                                                                                                                             | 用途                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 列出包含宣告/診斷狀態的精簡卡片；可選用工作板篩選器。                                                                                                                                    |
| `workboard_read`                                                                                                                                 | 傳回一張卡片加上有界的工作者脈絡（筆記、嘗試、留言、連結、證明、成品、父項結果、最近指派對象工作、作用中診斷）。                                                                        |
| `workboard_create`                                                                                                                               | 建立一張卡片，可選用父項、租用戶、Skills、工作板、工作區中繼資料、冪等性 key、執行階段限制、重試預算。                                                                                  |
| `workboard_link`                                                                                                                                 | 將父卡片連結到子卡片。子卡片會保持 `todo`，直到每個父項都到達 `done`，接著分派晉級會將它們移至 `ready`。                                                                               |
| `workboard_claim`                                                                                                                                | 為呼叫中的代理程式宣告卡片；將 `backlog`/`todo`/`ready` 移入 `running`。                                                                                                                  |
| `workboard_heartbeat`                                                                                                                            | 在較長的執行期間重新整理宣告心跳偵測。                                                                                                                                                  |
| `workboard_release`                                                                                                                              | 在完成、暫停或交接後釋放宣告；可以將卡片移至下一個狀態。                                                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 用於最終摘要、證明、成品和已建立卡片清單（必須參照連回已完成卡片的卡片）或阻擋原因的結構化生命週期工具。                                                                                |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 將小型卡片附件儲存在外掛 SQLite 狀態中、在卡片上建立索引，並在工作者脈絡中公開。                                                                                                        |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 記錄工作者日誌行，並在自動化工作者停止且未呼叫 `workboard_complete`/`workboard_block` 時阻擋卡片。                                                                                      |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 管理持久化工作板中繼資料（顯示名稱、描述、封存狀態、預設工作區）。                                                                                                                      |
| `workboard_runs`                                                                                                                                 | 傳回卡片的持久化執行嘗試歷史。                                                                                                                                                          |
| `workboard_specify`                                                                                                                              | 將粗略的分診/待辦卡片轉換為已釐清的 `todo` 卡片；在卡片上記錄規格摘要。                                                                                                                  |
| `workboard_decompose`                                                                                                                            | 將父協調卡片展開為連結的子卡片，繼承工作板/租用戶中繼資料；可以用已建立卡片清單完成父項。                                                                                              |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 管理通知訂閱。事件讀取可安全重播；`advance` 會移動持久游標，讓呼叫端續接時不會遺失或重複讀取已完成/失敗/過期的卡片事件。                                                               |
| `workboard_boards` / `workboard_stats`                                                                                                           | 檢查工作板命名空間和佇列統計資料。                                                                                                                                                      |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 復原或交接卡住的工作。                                                                                                                                                                  |
| `workboard_comment` / `workboard_proof`                                                                                                          | 新增交接筆記或附加證明/成品參照。                                                                                                                                                       |
| `workboard_unblock`                                                                                                                              | 將被阻擋的工作移回 `todo`。                                                                                                                                                              |
| `workboard_dispatch`                                                                                                                             | 推動相依性晉級或過期宣告清理。                                                                                                                                                          |

已領取的卡片會拒絕來自其他代理的代理工具變更，除非呼叫者
持有由 `workboard_claim` 傳回的領取權杖。每張由
代理工具或閘道 RPC 呼叫傳回的卡片都會將 `metadata.claim.token` 編修為 `[redacted]`
（權杖本身只會由 `workboard_claim` 以頂層欄位傳回一次），
因此儀表板操作員與其他代理可以檢查領取狀態，而永遠不會
看見可用的權杖。復原會透過
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` 進行，這些操作不
需要權杖。

## 派送

派送是閘道本機的：它不會產生任意作業系統程序。一般
OpenClaw 子代理工作階段仍然擁有執行權。一次派送流程：

1. 提升依賴已就緒的卡片。
2. 在就緒卡片上記錄派送中繼資料。
3. 封鎖已過期的領取或逾時的執行。
4. 將由看板設定的分流卡片標記為協調候選。
5. 領取一小批就緒卡片，並透過
   閘道子代理執行階段啟動工作執行。

工作代理會取得有界限的卡片脈絡，以及透過工作板工具對卡片進行心跳偵測、
完成或封鎖所需的領取權杖。

### 工作代理選取

每次流程**預設最多啟動 3 個工作代理**。就緒卡片會依
優先順序、位置、建立時間排序。一次流程只會為每個
擁有者/代理啟動一張卡片，並略過看板上已有執行中或審查中工作的
擁有者。已封存卡片、有作用中領取的卡片，以及不處於 `ready`
狀態的卡片，絕不會被選為工作代理啟動項目（它們仍可能受到派送的
資料面影響：清理過期領取、依賴提升、逾時清理）。

工作階段鍵會依每個看板/卡片決定性產生，因此重複派送會路由
回同一個工作代理通道，而不是建立不相關的工作階段：

- 已指派卡片：`agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 未指派卡片：`subagent:workboard-<boardId>-<cardId>`（閘道會解析
  已設定的預設代理）

如果卡片被領取後無法啟動工作代理，工作板會封鎖
卡片、清除領取、記錄執行啟動失敗，並附加一行工作代理
記錄 - 可在儀表板、命令列介面 JSON、代理工具與卡片
診斷中看見。

### 進入點

- 儀表板派送動作
- `openclaw workboard dispatch`
- 在支援命令的通道上使用 `/workboard dispatch`

三者都會在閘道可用時使用閘道子代理執行階段。
命令列介面有一個操作員備援：如果閘道呼叫因
連線/不可用錯誤（或舊版閘道的 `unknown method` 錯誤）而失敗，
且沒有明確的 `--url`/`--token` 目標，也沒有套用已設定的遠端
閘道（`OPENCLAW_GATEWAY_URL` 或 `gateway.mode: remote`），命令列介面會針對本機 SQLite 狀態
執行僅資料派送 - 它可以提升依賴、
清理過期領取，並封鎖逾時執行，但無法啟動工作代理。來自可連線閘道的驗證、
權限與驗證失敗不會被視為不可用；它們會顯示為命令錯誤，
而且在已提供明確 `--url`/`--token` 目標時，任何閘道
失敗也會如此。

看板中繼資料可以設定 `autoDecompose`、`autoDecomposePerDispatch`、
`defaultAssignee` 與 `orchestratorProfile`。OpenClaw 會記錄此意圖並
在工作代理脈絡中公開；實際的規格化/分解仍會透過一般工作板工具執行。

## 命令列介面與斜線命令

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 文字輸出預設會隱藏已封存卡片（`--include-archived`
會覆寫）；`--json` 永遠包含已封存卡片，符合既有指令碼使用的完整卡片
合約。`show` 接受明確無歧義的 id 前綴。
`list`、`create` 與 `show` 一律直接讀寫本機外掛狀態。
只有 `dispatch` 會呼叫執行中的閘道，並採用上述備援。

完整旗標、JSON 輸出、閘道備援行為、id 前綴處理、派送選取規則與
疑難排解，請參閱[工作板命令列介面](/zh-TW/cli/workboard)。

`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>`、
與 `/workboard dispatch` 會鏡像命令列介面。列出與顯示是任何已授權命令傳送者
都可執行的讀取操作。建立與派送在聊天介面上需要擁有者狀態，
或需要具備 `operator.write`/`operator.admin` 的閘道用戶端。

## 工作階段生命週期同步

卡片可以連結到既有儀表板工作階段，或連結到你
從卡片開始工作時建立的工作階段。已連結卡片會內嵌顯示工作階段生命週期：
執行中、過期、已連結閒置、完成、失敗或遺失。你也可以從「工作階段」分頁以 **加入工作板** 擷取
既有工作階段；卡片會連結到該工作階段、使用工作階段標籤或最近的使用者提示作為標題，
並在可用時用最近的使用者提示加上最新的助理回應
初始化備註。

如果已連結的工作階段遺失，卡片會保留連結以供脈絡使用，
並仍提供啟動控制項，以重新啟動到新的工作階段。如果作用中的
已連結工作階段停止回報近期活動，工作板會將卡片標記為
`stale`，並將其儲存為中繼資料，直到生命週期清除它。

當卡片處於作用中工作狀態時，工作板會跟隨已連結工作階段：

| 已連結工作階段狀態                  | 卡片狀態 |
| ------------------------------------- | ----------- |
| 作用中                                | `running`   |
| 已完成                             | `review`    |
| 失敗、被終止、逾時或已中止 | `blocked`   |

**手動審查狀態優先。** 將卡片移至 `review`、`blocked` 或 `done`
會停止該卡片的自動同步，直到你將它移回 `todo` 或 `running`。

啟動卡片會使用一般閘道工作階段；工作板只儲存卡片
中繼資料與連結。對話逐字稿、模型選取與執行
生命週期仍由一般工作階段系統擁有。在即時
已連結卡片上使用 **停止** 可中止作用中執行 - 工作板會將該卡片標記為 `blocked`，
使其保持可見以便後續處理。

新卡片可以從工作板範本（`bugfix`、`docs`、`release`、
`pr_review`、`plugin`）開始。範本會預先填入標題、備註、標籤與優先順序；
範本 id 會儲存為卡片中繼資料。

## 儀表板工作流程

1. 在控制 UI 中開啟工作板分頁。
2. 建立一張包含標題、備註、優先順序、標籤、選用代理與
   選用已連結工作階段的卡片 - 或開啟「工作階段」並為既有工作階段選擇 **加入工作板**。
3. 在欄位之間拖曳卡片，或聚焦其精簡狀態控制項並使用
   選單或 ArrowLeft/ArrowRight。
4. 從卡片開始工作，以建立或重用儀表板工作階段。
5. 在代理工作時，從卡片開啟已連結工作階段。
6. 讓生命週期同步將執行中的工作移入 `review`/`blocked`，然後在接受時手動
   將卡片移至 `done`。

## 診斷

診斷會根據本機卡片中繼資料計算。內建檢查會標記：

| 種類                        | 條件                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 已指派的 `todo`/`backlog`/`ready` 卡片超過 1 小時未更新。             |
| `running_without_heartbeat` | `running` 卡片超過 20 分鐘沒有領取心跳偵測或執行更新。 |
| `blocked_too_long`          | `blocked` 卡片超過 24 小時未更新。                                   |
| `repeated_failures`         | 卡片追蹤的失敗次數達到 2 次或更多。                                |
| `missing_proof`             | `done` 卡片沒有證明、成品或附件。                          |
| `orphaned_session`          | `running` 卡片有 `sessionKey`，但沒有 `execution` 中繼資料。                |

## 權限

閘道 RPC 方法位於 `workboard.*` 底下：

| 範圍            | 方法                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`、`cards.export`、`cards.diagnostics`、附件列出/取得、通知事件讀取、`boards.list`、`cards.stats`、`cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`、create/update/move/delete/comment/link/linkDependency/proof/artifact、附件新增/刪除、工作代理記錄、協定違規、claim/heartbeat/release/promote/reassign/reclaim/complete/block/unblock、`cards.dispatch`、`cards.bulk`、archive、`boards.upsert`/`archive`/`delete`、`cards.specify`/`decompose`、通知訂閱/刪除/推進 |

沒有 RPC 方法需要 `operator.admin`。以唯讀操作員存取權連線的瀏覽器
可以檢查看板，但無法變更卡片。

## 儲存

工作板會在 OpenClaw 狀態目錄下的外掛擁有關聯式 SQLite 資料庫中儲存持久資料：
看板、卡片、標籤、生命週期事件、
執行嘗試、留言、依賴連結、證明、成品參照、
附件中繼資料與 Blob、診斷、通知、工作代理記錄、
協定狀態與訂閱，全都位於工作板資料表中（而不是
外掛鍵值項目）。卡片匯出會保留看板敘事，
但不內嵌附件 Blob 內容。

曾在 `.28` 版本使用工作板的安裝可以執行
`openclaw doctor --fix`，將已發布的舊版外掛狀態命名空間
（`workboard.cards`、`workboard.boards`、`workboard.notify`，以及如存在的
`workboard.attachments`）遷移到關聯式資料庫。

## 疑難排解

**分頁顯示工作板不可用**

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 加入其中。如果 `plugins.deny`
包含 `workboard`，請先移除它再啟用外掛。

**卡片未儲存**

確認瀏覽器連線具備 `operator.write` 存取權。唯讀操作員
工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

**啟動卡片未開啟預期的工作階段**

檢查卡片的代理 id 與已連結工作階段，然後開啟「工作階段」或「聊天」以
檢查實際執行狀態。

**派送未啟動工作代理**

確認至少有一張沒有作用中領取的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料派送，請啟動或重新啟動閘道並
重試 - 僅資料派送會更新本機看板狀態，但無法啟動
子代理工作代理執行。當同一擁有者或代理的另一張卡片
已在執行中或等待審查時，卡片也可能被略過；請先完成、
封鎖或釋放該作用中工作，再為同一
擁有者派送更多工作。

## 相關

- [控制 UI](/zh-TW/web/control-ui)
- [工作板命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
