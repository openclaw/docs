---
read_when:
    - 你想在控制介面中查看 Dayflow 風格的每日時間軸
    - 你正在啟用或設定內建的 Logbook 外掛
    - 你想要根據螢幕活動產生站立會議摘要或回顧當天事項
summary: 由定期螢幕快照建立的選用自動工作日誌
title: 日誌外掛
x-i18n:
    generated_at: "2026-07-22T10:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19197e580421dfe81f82f8599578e4c68a15004813bb2b6c3de761c14f426b08
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook 外掛會將螢幕活動轉換為自動工作日誌。它會定期從已配對的節點擷取螢幕快照，將其摘要為附有時間戳記的觀察結果，並在
[控制介面](/zh-TW/web/control-ui)中建立時間軸卡片。它也能產生每日站立會議筆記，並回答有關某個追蹤日期的問題。

OpenClaw 擁有的狀態會保留在閘道的 `<state-dir>/logbook/` 下，但模型處理不一定在本機執行。取樣的螢幕截圖會傳送至已設定的視覺路由；觀察結果與時間軸文字則會傳送至預設的代理程式模型。如果螢幕內容與衍生的活動文字都必須保留在該機器上，請為這兩個階段使用本機模型路由。

Logbook 已內建，但預設為停用。啟用此外掛即表示允許閘道擷取螢幕，因為 `captureEnabled` 的預設值為 `true`。

## 開始之前

你需要：

- 一個已連線且公開 `screen.snapshot` 或 `logbook.snapshot` 的節點。macOS 應用程式節點需要螢幕錄製權限。無頭 macOS 節點主機
  (`openclaw node host run`) 會取得由外掛提供、以系統 `screencapture` 工具為基礎的 `logbook.snapshot` 命令。
- 已啟用並完成驗證的內建 Codex 外掛。Codex 目前提供 Logbook 所需的結構化影像擷取合約。使用
  `openclaw models auth login --provider openai` 登入；其他驗證方式請參閱
  [Codex 控制框架](/zh-TW/plugins/codex-harness)。
- 可正常運作的預設代理程式模型。Logbook 會在視覺處理完成後，使用它合成卡片、站立會議筆記及當日問答。

## 快速開始

啟用 Codex 與 Logbook 外掛：

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

設定明確的視覺模型，以確保啟動行為一致：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

如果使用 `plugins.allow`，請同時包含 `codex` 與 `logbook`。變更外掛設定後，請重新啟動閘道，接著檢查註冊項目並開啟儀表板：

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

節點說明必須包含 `screen.snapshot` 或 `logbook.snapshot`。
無頭節點只有在外掛啟用後才會公告 `logbook.snapshot`。
如果缺少該命令，請參閱[節點疑難排解](/zh-TW/nodes/troubleshooting)。

Logbook 分頁只會在外掛已啟用且控制介面工作階段具有 `operator.write` 時顯示。狀態列應顯示 **正在擷取**，且沒有錯誤。分析時間窗關閉時會顯示時間軸卡片；你也可以在擷取活動後選取 **立即分析**。

## 運作方式

1. **擷取**：每隔 `captureIntervalSeconds`（預設 30 秒），Logbook 會叫用所選節點的擷取命令，並儲存一個縮放後的 JPEG 畫面。連續相同的畫面會標記為閒置，並從分析中排除。
2. **觀察**：分析時間窗（預設 15 分鐘）經過後，外掛會取樣最多 16 個活動畫面，並將其傳送至視覺模型；模型會傳回附有時間戳記的活動觀察結果（“VS Code：正在編輯
   store.ts，修正型別錯誤”）。超過兩分鐘的擷取間隔或本機午夜也會關閉目前的時間窗。
3. **合成**：系統會根據觀察結果及最近 45 分鐘的現有卡片，修訂產生時間軸卡片（每張 10-60 分鐘），其中包含標題、摘要、類別、主要應用程式，以及任何短暫分心活動。
4. **清除**：系統會刪除早於 `retentionDays`（預設 14）的畫面。卡片、觀察結果及快取的站立會議筆記會予以保留。

日期邊界與時間軸時鐘使用閘道的本機時區，而非瀏覽器時區。畫面與 SQLite 時間軸資料庫位於 `<state-dir>/logbook/` 下。

## 模型與資料流程

Logbook 使用兩條獨立的模型路由：

| 階段            | 傳送的資料                                                 | 模型路由                                                       |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 觀察          | 最多 16 個取樣的 JPEG 畫面及其擷取時間     | `visionModel`，或相容的借用 `tools.media` Codex 項目 |
| 合成卡片 | 附有時間戳記的觀察結果與近期時間軸卡片        | 透過外掛 LLM 執行階段使用預設代理程式模型                |
| 產生站立會議筆記 | 所選日期與前一天的卡片               | 透過外掛 LLM 執行階段使用預設代理程式模型                |
| 詢問你的一天     | 問題、所選日期的卡片及近期觀察結果 | 透過外掛 LLM 執行階段使用預設代理程式模型                |

完整的 SQLite 資料庫不會傳送至任一模型。原始螢幕截圖只會傳送至觀察階段；卡片合成、站立會議筆記及問答只會接收衍生文字。

## 設定

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

所有 Logbook 設定鍵皆為選用。數值會四捨五入為整數，並限制在支援的範圍內。

| 鍵                       | 預設值 | 範圍或值         | 行為                                                                                     |
| ------------------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`  | 布林值                 | 新快照的持續性總開關；設為 `false` 時仍可使用時間軸      |
| `captureIntervalSeconds`  | `30`    | `5`-`600`               | 擷取嘗試之間的延遲                                                               |
| `analysisIntervalMinutes` | `15`    | `3`-`120`               | 目標觀察時間窗；間隔與午夜可能使其提早關閉                            |
| `nodeId`                  | 未設定   | 節點 ID 或顯示名稱 | 將擷取固定至一個已連線節點；比對不區分大小寫                             |
| `screenIndex`             | `0`     | `0`-`16`                | 從零開始的顯示器索引                                                                     |
| `maxWidth`                | `1440`  | `480`-`3840`            | 要求的擷取大小上限；無頭 macOS 會將其套用至最長邊               |
| `visionModel`             | 未設定   | `provider/model`        | 明確的結構化路由；格式錯誤的參照會暫停分析，不受支援的供應商會導致批次失敗 |
| `retentionDays`           | `14`    | `1`-`365`               | 刪除舊畫面；卡片、觀察結果與站立會議筆記會保留                                 |

未設定 `nodeId` 時，Logbook 會優先選擇公開 `screen.snapshot` 的已連線應用程式節點，接著退回至公開 `logbook.snapshot` 的無頭節點。在未固定節點的設定中，失敗的節點會輪替至其他符合資格的節點之後。儀表板的暫停切換開關僅適用於工作階段，並會在閘道重新啟動時重設；若要持續停止，請使用 `captureEnabled: false`。

### 視覺模型選擇

Logbook 會依下列順序解析觀察模型：

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.models` 下第一個支援影像的 Codex 項目

其他媒體供應商會被略過，因為它們目前未公開 Logbook 所需的結構化擷取合約。設定 `tools.media.image.enabled: false` 會停用借用的媒體預設值，但明確設定的 Logbook `visionModel` 仍會套用。

## 儀表板分頁

- **時間軸**：每個活動都有可展開的卡片，其中包含類別色彩、主要應用程式、分心活動標籤及快照關鍵影格。
- **一日概覽**：專注比例、類別明細、常用應用程式。
- **每日站立會議筆記**：將昨天與今天的內容轉換成可直接貼上的更新。
- **詢問你的一天**：根據追蹤的時間軸回答自然語言問題（“我何時審查了閘道 PR？”）。
- **立即分析**：立即關閉目前的擷取時間窗，而不等待分析間隔。

## 閘道方法

Logbook 會註冊下列閘道 RPC 方法：

| 方法                | 參數               | 範圍            | 結果                                                                   |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | 無                     | `operator.read`  | 擷取、分析、模型、節點、閘道日期及閘道時區狀態 |
| `logbook.days`        | 無                     | `operator.read`  | 包含時間軸卡片數量與卡片時間範圍的日期                      |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 衍生卡片與日期統計資料；預設為閘道的目前日期  |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 所要求的 Epoch 毫秒範圍內的畫面中繼資料                  |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | 一個以 base64 表示的原始 JPEG 畫面                                             |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | 某日已快取或重新產生的站立會議筆記文字                             |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | 以時間軸為依據的某日回答                                       |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | 僅適用於工作階段的暫停狀態與更新後的狀態                              |
| `logbook.analyze.now` | 無                     | `operator.write` | 啟動待處理的分析，或傳回無法啟動的原因          |

讀取方法會傳回操作狀態或衍生文字。原始螢幕截圖像素、會產生模型費用的動作及執行階段變更需要 `operator.write`。控制介面分頁也需要 `operator.write`，因為它會公開這些動作與原始畫面預覽；唯讀用戶端仍可直接呼叫衍生文字方法。

## 隱私權注意事項

- 快照可能包含畫面上的任何內容，包括祕密。影格絕不會離開本機，唯一例外是作為取樣輸入傳送至已設定的觀察模型。
- 在卡片合成、產生站立會議摘要或問答期間，觀察結果、近期卡片與問題可能會透過預設代理模型離開本機。請將供應商的資料處理政策套用至這兩條模型路由。
- 若需要完全在本機執行的流水線，請讓結構化觀察模型與預設代理模型都使用本機路由。
- 影格、時間軸資料庫與暫存擷取內容都會以僅擁有者可存取的檔案權限寫入。
- 將 `screen.snapshot` 新增至 `gateway.nodes.commands.deny`，即可作為螢幕擷取的緊急停止開關：它會同時阻擋應用程式節點的擷取，以及 Logbook 本身的 `logbook.snapshot` 命令。
- 設定 `tools.media.image.enabled: false` 也會阻止 Logbook 借用媒體影像模型進行分析；此時只會使用外掛設定中明確指定的 `visionModel`。

## 疑難排解

### Logbook 分頁遺失

請檢查以下三個關卡：

1. `openclaw plugins list --enabled` 包含 `logbook`。
2. 變更外掛或允許清單後，閘道已重新啟動。
3. Control UI 連線具有 `operator.write`；唯讀工作階段不會收到互動式分頁描述元。

若已設定 `plugins.allow`，建議的設定必須同時包含 `logbook` 與 `codex`。

### 擷取回報錯誤

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- 確認節點公開 `screen.snapshot` 或 `logbook.snapshot`。
- 在執行擷取的 Mac 上授予「螢幕錄製」權限。
- 若已設定 `nodeId`，請確認它與節點 ID 或顯示名稱相符。
- 檢查 `gateway.nodes.commands.deny` 是否未包含 `screen.snapshot`。

連續失敗三次後，Logbook 會暫停十個擷取週期，然後重試。未固定節點的設定可以輪替至另一個符合資格的節點。

### 擷取成功但未出現卡片

- **缺少模型**狀態表示找不到相容的結構化視覺路由。請啟用 Codex 外掛並完成驗證，或設定有效且明確的 `visionModel`。缺少模型時，已擷取的影格會維持待處理狀態，並可在修正設定後進行分析。
- 等待 `analysisIntervalMinutes`，或在擷取到活動後選取 **立即分析**。
- 連續相同的影格會被視為閒置證據，不會進入分析批次。測試前請變更畫面上的可見內容。
- 若最新批次顯示錯誤，請修正模型或驗證問題，然後選取 **立即分析**。為避免重複產生模型費用，失敗的批次只會在執行該明確動作時重試。

## 相關內容

- [管理外掛](/zh-TW/plugins/manage-plugins)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [節點](/zh-TW/nodes)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
- [Control UI](/zh-TW/web/control-ui)
