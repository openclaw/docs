---
read_when:
    - 你想要在控制介面中使用看板式工作板
    - 你正在啟用或停用隨附的 Workboard 外掛
    - 你想在不使用外部專案管理工具的情況下追蹤規劃中的代理工作
summary: 代理擁有卡片與工作階段交接的選用儀表板工作看板
title: 工作板外掛
x-i18n:
    generated_at: "2026-06-27T19:51:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard 外掛會在
[控制介面](/zh-TW/web/control-ui)新增一個選用的 Kanban 風格看板。用它來收集代理規模的工作卡片、指派給代理，並從單一卡片追蹤連結的背景工作、執行和儀表板工作階段。

Workboard 刻意保持小巧。它會追蹤 OpenClaw 閘道的本機操作工作；它不是 GitHub Issues、Linear、Jira 或其他團隊專案管理系統的替代品。

## 預設狀態

Workboard 是 bundled 外掛，預設會停用，除非你在外掛設定中啟用它。

使用以下指令啟用：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

接著開啟儀表板：

```bash
openclaw dashboard
```

Workboard 分頁會出現在儀表板導覽中。如果分頁可見，但外掛已停用，或被 `plugins.allow` / `plugins.deny` 封鎖，該檢視會顯示外掛不可用狀態，而不是本機卡片資料。

## 卡片包含的內容

每張卡片會儲存：

- 標題和備註
- 狀態：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、
  `review`、`blocked` 或 `done`
- 優先順序：`low`、`normal`、`high` 或 `urgent`
- 標籤
- 選用代理 id
- 選用連結的工作、執行、工作階段或來源 URL
- 從卡片啟動的 Codex 或 Claude 執行所用的選用執行中繼資料
- 嘗試、留言、連結、證明、成品、自動化、附件、工作者日誌、工作者協定狀態、宣告、診斷、通知、範本、封存狀態和過期工作階段偵測的精簡中繼資料
- 最近的卡片事件，例如已建立、已移動、已連結、已宣告、心跳偵測、嘗試、證明、成品、診斷、通知、派送、封存、過期或代理更新變更

卡片會儲存在外掛的閘道狀態中。它們是閘道狀態目錄的本機資料，並會隨該閘道其餘的 OpenClaw 狀態一起移動。

Workboard 會保留每張卡片的精簡中繼資料，讓操作員無需開啟連結的工作階段，就能看到卡片如何在看板中移動。事件、嘗試摘要、證明片段、相關連結、留言、封存標記和過期工作階段標記都是刻意保持在本機的中繼資料；它們不會取代工作階段轉錄或 GitHub issue 歷史。

## 卡片執行和工作

未連結的卡片可以從卡片啟動工作。自主啟動會使用閘道的工作追蹤代理執行路徑，接著 Workboard 會把產生的工作、執行 id 和工作階段 key 連回卡片。啟動會使用閘道設定的預設代理和模型。Codex 和 Claude 動作是選用的明確模型選擇：

- Run Codex 或 Run Claude 會啟動由工作支援的代理執行，傳送卡片提示，並將卡片標記為 `running`。
- Open Codex 或 Open Claude 會建立連結的儀表板工作階段，但不傳送卡片提示或移動卡片，讓你可以手動工作，同時保持它附加到看板。

執行中繼資料會在卡片上儲存所選引擎、模式、模型參照、工作階段 key、執行 id、可用時的工作 id，以及生命週期狀態。Codex 執行使用 `openai/gpt-5.5`；Claude 執行使用
`anthropic/claude-sonnet-4-6`。

每個連結的執行也會在同一卡片記錄上記錄嘗試摘要。嘗試摘要會保留引擎、模式、模型、執行 id、時間戳記、狀態和滾動失敗次數，讓重複失敗能持續在看板上可見。

儀表板會從閘道工作 ledger 重新整理工作狀態，並依工作 id、執行 id 或連結的工作階段 key 將工作配回卡片。如果工作已佇列或正在執行，卡片生命週期會顯示作用中的工作狀態。如果工作完成、失敗、逾時或取消，卡片生命週期會使用與連結工作階段相同的生命週期同步，移向 review 或 blocked 狀態。

## 代理協調

Workboard 也為看板感知工作流程公開選用代理工具：

- `workboard_list` 會列出包含宣告和診斷狀態的精簡卡片，並可選用看板篩選器。
- `workboard_read` 會傳回一張卡片，以及由備註、嘗試、留言、連結、證明、成品、父層結果、最近受派者工作和作用中診斷建立的有限工作者情境。
- `workboard_create` 會建立卡片，可包含選用父層、租戶、Skills、看板、工作區中繼資料、冪等 key、執行時間限制和重試預算。
- `workboard_link` 會將父卡片連結到子卡片。子卡片會停留在 `todo`，直到每個父層都達到 `done`；接著派送提升會將它們移到 `ready`。
- `workboard_claim` 會為呼叫代理宣告卡片，並將 backlog、todo 或 ready 卡片移到 `running`。
- `workboard_heartbeat` 會在較長執行期間重新整理宣告心跳偵測。
- `workboard_release` 會在完成、暫停或交接後釋放宣告，並可將卡片移到下一個狀態。
- `workboard_complete` 和 `workboard_block` 是結構化生命週期工具，用於最終摘要、證明、成品、已建立卡片清單和封鎖原因。已建立卡片清單必須參照連回完成卡片的卡片，這能避免摘要中出現幽靈子項。
- `workboard_attachment_add`、`workboard_attachment_read` 和
  `workboard_attachment_delete` 會在外掛 SQLite 狀態中儲存小型卡片附件、將它們索引到卡片上，並在工作者情境中公開它們。
- `workboard_worker_log` 和 `workboard_protocol_violation` 會記錄工作者日誌行，並在自動化工作者未呼叫 `workboard_complete` 或 `workboard_block` 就停止時封鎖卡片。
- `workboard_board_create`、`workboard_board_archive` 和
  `workboard_board_delete` 會管理持久化的看板中繼資料，例如顯示名稱、描述、封存狀態和預設工作區。
- `workboard_runs` 會傳回儲存在卡片上的持久化執行嘗試歷史。
- `workboard_specify` 會將粗略的 triage 或 backlog 卡片轉成釐清後的
  `todo` 卡片，並在卡片上記錄規格摘要。
- `workboard_decompose` 會將父層協調卡片展開成連結的子項，繼承看板和租戶中繼資料，並可用已建立卡片清單完成父層。
- `workboard_notify_subscribe`、`workboard_notify_list`、
  `workboard_notify_events`、`workboard_notify_advance` 和
  `workboard_notify_unsubscribe` 會在外掛狀態中管理通知訂閱。事件讀取可安全重播；advance 工具會移動持久游標，讓呼叫端能繼續讀取，而不會遺失或重複讀取已完成、失敗或過期的卡片事件。
- `workboard_boards`、`workboard_stats`、`workboard_promote`、
  `workboard_reassign`、`workboard_reclaim`、`workboard_comment`、
  `workboard_proof`、`workboard_unblock` 和 `workboard_dispatch` 讓代理檢查看板命名空間、檢視佇列統計、復原卡住的工作、新增交接備註、附加證明或成品參照、將 blocked 工作移回 `todo`，並推進相依項提升或過期宣告清理。

已宣告的卡片會拒絕來自其他代理的代理工具變更，除非呼叫端持有 `workboard_claim` 傳回的宣告權杖。儀表板操作員仍使用一般閘道 RPC 介面，並可復原或重新指派卡片。

Workboard 會在 OpenClaw 狀態目錄底下，由外掛擁有的關聯式 SQLite 資料庫中儲存持久看板資料。看板、卡片、標籤、生命週期事件、執行嘗試、留言、相依連結、證明、成品參照、附件中繼資料和 blob、診斷、通知、工作者日誌、協定狀態和訂閱，都會持久化在 Workboard 資料表中，而不是外掛鍵值項目中。卡片匯出仍會保留看板敘事，但不會內嵌附件 blob 內容。

在 `.28` 版本使用過 Workboard 的安裝，可以執行
`openclaw doctor --fix`，將已出貨的舊版外掛狀態命名空間（`workboard.cards`、`workboard.boards` 和 `workboard.notify`）遷移到關聯式資料庫。如果存在舊版 `workboard.attachments` 命名空間，doctor 也會遷移那些附件 blob。

Workboard 診斷會從本機卡片中繼資料計算。內建檢查會標記等待過久的已指派卡片、沒有最近心跳偵測的 running 卡片、需要注意的 blocked 卡片、重複失敗、沒有證明的 done 卡片，以及只有鬆散工作階段連結的 running 卡片。

派送刻意維持在閘道本機。它不會產生任意作業系統程序；一般 OpenClaw 子代理工作階段仍負責執行。派送動作會提升相依項就緒的卡片、在 ready 卡片上記錄派送中繼資料、封鎖過期宣告或逾時執行、將看板設定的 triage 卡片標記為協調候選項，接著宣告一小批 ready 卡片，並透過閘道子代理 runtime 啟動工作者執行。已指派卡片使用 `agent:<id>:subagent:workboard-*` 工作者工作階段 key；未指派卡片使用未限定範圍的 `subagent:workboard-*` key，讓閘道仍能解析設定的預設代理。工作者會取得有限卡片情境，以及它們透過 Workboard 工具對卡片執行心跳偵測、完成或封鎖所需的宣告權杖。

### 派送工作者選擇

每次派送預設最多啟動三個工作者。Ready 卡片會依優先順序、位置和建立時間排序，接著篩選以避免重複的作用中擁有權。一次派送在同一輪中只會為指定擁有者或代理啟動一張卡片，並會略過看板上已有 running 或 review 工作的擁有者。

已封存卡片、有作用中宣告的卡片，以及狀態不是 `ready` 的卡片，不會被選為工作者啟動目標。當適用過期宣告、相依項提升或逾時清理時，它們仍可能受派送的資料面影響。

### 工作者提示和生命週期

工作者提示包含卡片標題、有限備註和情境、指派的看板，以及 Workboard 工作者協定。它也包含宣告擁有者和宣告權杖，讓工作者能呼叫 `workboard_heartbeat`、`workboard_complete` 或 `workboard_block`，而不會讓其他行為者接管卡片。

當工作者成功啟動時，Workboard 會在卡片上儲存工作階段 key、執行 id、引擎、模式、模型標籤、狀態和工作者日誌。工作階段 key 對看板和卡片是確定性的，這會讓重複派送路由回同一個工作者通道，而不是建立不相關的工作階段。

如果卡片已被宣告後無法啟動工作者，Workboard 會封鎖卡片、清除宣告、記錄執行啟動失敗，並附加一行工作者日誌。該失敗會在儀表板、命令列介面 JSON、代理工具和卡片診斷中可見。

### 派送進入點

Ready 卡片工作者啟動可以來自：

- 儀表板派送動作
- `openclaw workboard dispatch`
- 支援命令的通道上的 `/workboard dispatch`

三個進入點在閘道可用時都會使用閘道子代理 runtime。命令列介面有一個額外的操作員 fallback：如果閘道離線，或未公開 Workboard 派送方法，且未提供明確的 `--url` 或 `--token` 目標，它會對本機 SQLite 狀態執行純資料派送。該 fallback 可以提升相依項、清理過期宣告，並封鎖逾時執行，但無法啟動工作者。

看板中繼資料可以包含協調設定，例如 `autoDecompose`、`autoDecomposePerDispatch`、`defaultAssignee` 和 `orchestratorProfile`。OpenClaw 會記錄協調意圖，並在工作者情境中公開；實際規格化和分解仍會透過一般 Workboard 工具完成。

## 命令列介面和斜線命令

外掛會註冊根命令列介面命令：

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` 會呼叫正在執行的閘道，讓 worker 啟動時使用與儀表板相同的 subagent runtime。若閘道無法使用，則會退回到僅資料派送，讓依賴提升、過期 claim 清理與逾時封鎖仍可執行。驗證、權限與驗證失敗仍會顯示為命令錯誤，明確 `--url` 或 `--token` 目標的失敗也一樣。

`/workboard` slash command 支援相同的精簡操作者路徑：
`/workboard list`、`/workboard show <card-id>`、`/workboard create <title>` 與
`/workboard dispatch`。List 與 show 是授權命令傳送者的讀取操作。Create 與 dispatch 需要聊天介面上的 owner 狀態，或具備 `operator.write` 或 `operator.admin` 的閘道用戶端。

請參閱[工作板命令列介面](/zh-TW/cli/workboard)，了解命令旗標、JSON 輸出、閘道
後備行為、明確的 id 前綴處理、派送選取規則與疑難排解。

## 工作階段生命週期同步

卡片可以連結到現有的儀表板工作階段，或連結到你從卡片開始工作時建立的工作階段。已連結的卡片會內嵌顯示工作階段生命週期：
執行中、過期、已連結閒置、完成、失敗或遺失。

如果連結的工作階段遺失，卡片會保留連結作為背景脈絡，並仍提供開始控制項，讓你可以在新的儀表板工作階段中重新開始工作。
如果作用中的已連結工作階段停止回報近期活動，工作板會將卡片標記為過期，並將該標記儲存為卡片中繼資料，直到生命週期清除它。

你也可以從工作階段分頁使用「加入工作板」擷取現有的儀表板工作階段。卡片會連結到該工作階段，使用工作階段標籤或近期使用者提示作為標題，並在聊天歷史可用時，以近期使用者提示加上最新助理回覆填入 notes。

當卡片仍處於作用中工作狀態時，工作板會跟隨已連結工作階段：

- 作用中的已連結工作階段 -> `running`
- 已完成的已連結工作階段 -> `review`
- 失敗、遭終止、逾時或已中止的已連結工作階段 -> `blocked`

手動 review 狀態優先。如果你將卡片移到 `review`、`blocked` 或 `done`，工作板會停止自動移動該卡片，直到你將它移回 `todo` 或 `running`。

## 儀表板工作流程

1. 在控制介面中開啟工作板分頁。
2. 建立包含標題、notes、優先順序、標籤、選用 agent 與選用連結工作階段的卡片。
3. 或開啟工作階段，並為現有工作階段選擇加入工作板。
4. 在欄之間拖曳卡片，或聚焦卡片上的精簡狀態控制項，並使用其選單或 ArrowLeft/ArrowRight。
5. 從卡片開始工作，以建立或重用儀表板工作階段。
6. 在 agent 工作時，從卡片開啟已連結的工作階段。
7. 讓生命週期同步將執行中的工作移入 review 或 blocked，然後在接受後手動將卡片移到 done。

啟動卡片會使用一般閘道工作階段。工作板外掛只會儲存卡片中繼資料與連結；對話逐字稿、模型選取與執行生命週期仍由一般工作階段系統擁有。

在即時已連結卡片上使用停止，以中止作用中的工作階段執行。工作板會將該卡片標記為 `blocked`，讓它保持可見以便後續處理。

新卡片可以從工作板範本開始，用於 bugfix、文件、release、PR review 或外掛工作。範本會預先填入標題、notes、標籤與優先順序，且所選範本 id 會儲存為卡片中繼資料。

## 權限

此外掛會在 `workboard.*` 命名空間下註冊閘道 RPC 方法：

- `workboard.cards.list` 需要 `operator.read`
- `workboard.cards.export` 需要 `operator.read`
- `workboard.cards.diagnostics` 需要 `operator.read`
- `workboard.cards.diagnostics.refresh` 需要 `operator.write`
- attachment list/get 與 notification event 讀取需要 `operator.read`
- notification cursor 推進需要 `operator.write`
- create、update、move、delete、comment、link、dependency link、proof、artifact、
  attachment add/delete、worker log、protocol violation、claim、heartbeat、
  release、complete、block、unblock、dispatch、bulk 與 archive 方法需要
  `operator.write`

以唯讀操作者存取權連線的瀏覽器可以檢視看板，但無法變更卡片。

## 設定

工作板目前沒有外掛專用設定。使用標準外掛項目啟用或停用它：

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

再次停用：

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 疑難排解

### 分頁顯示工作板無法使用

檢查外掛政策：

```bash
openclaw plugins inspect workboard --runtime --json
```

如果已設定 `plugins.allow`，請將 `workboard` 加入該允許清單。如果
`plugins.deny` 包含 `workboard`，請先將它移除再啟用外掛。

### 卡片未儲存

確認瀏覽器連線具有 `operator.write` 存取權。唯讀操作者工作階段可以列出卡片，但無法建立、編輯、移動或刪除卡片。

### 啟動卡片沒有開啟預期的工作階段

工作板會建立到一般儀表板工作階段的連結。檢查卡片的 agent id 與連結的工作階段，然後開啟工作階段或聊天檢視以查看實際執行狀態。

### 派送沒有啟動 worker

確認至少有一張沒有作用中 claim 的 `ready` 卡片：

```bash
openclaw workboard list --status ready
```

如果命令列介面回報僅資料派送，請啟動或重新啟動閘道後重試。
僅資料派送會更新本機看板狀態，但無法啟動 subagent worker 執行。

當同一 owner 或 agent 的另一張卡片已在執行或等待 review 時，卡片也可能被略過。請先 complete、block 或 release 該作用中工作，再為同一 owner 派送更多工作。

## 相關

- [控制介面](/zh-TW/web/control-ui)
- [工作板命令列介面](/zh-TW/cli/workboard)
- [外掛](/zh-TW/tools/plugin)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [工作階段](/zh-TW/concepts/session)
