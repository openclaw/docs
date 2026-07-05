---
read_when:
    - 你想在控制介面中看到 Dayflow 風格的一日時間軸
    - 你正在啟用或設定隨附的 Logbook 外掛
    - 你想要以螢幕活動為依據的站會摘要或當日回顧
summary: 可選的自動工作日誌，由定期螢幕快照建立
title: 日誌外掛
x-i18n:
    generated_at: "2026-07-05T20:18:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d15a6e0835d6916c1ad5d203d6d85d6a7946b2bcb9c2985ce53a803d471c389
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook 外掛會將螢幕活動轉成自動工作日誌。它會從配對的節點擷取定期螢幕快照，將其摘要為帶有時間戳記的觀察，並在[控制 UI](/zh-TW/web/control-ui) 中建立時間軸卡片。它也可以產生每日站會筆記，並回答關於受追蹤日期的問題。

OpenClaw 擁有的狀態會保留在閘道的 `<state-dir>/logbook/` 下，但模型處理不一定是本機執行。取樣的螢幕截圖會送到設定的視覺路由；觀察與時間軸文字會送到預設代理模型。如果螢幕內容和衍生的活動文字必須留在機器上，請在兩個階段都使用本機模型路由。

Logbook 已內建但預設停用。啟用此外掛會讓閘道選擇加入螢幕擷取，因為 `captureEnabled` 預設為 `true`。

## 開始之前

你需要：

- 一個已連線且公開 `screen.snapshot` 或 `logbook.snapshot` 的節點。macOS app 節點需要「螢幕錄製」權限。無頭 macOS 節點主機（`openclaw node host run`）會取得外掛提供的 `logbook.snapshot` 命令，並由系統 `screencapture` 工具支援。
- 已啟用並完成驗證的內建 Codex 外掛。Codex 目前提供 Logbook 所需的結構化影像擷取合約。使用 `openclaw models auth login --provider openai` 登入；其他驗證路徑請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。
- 可用的預設代理模型。Logbook 會在視覺處理後，使用它來合成卡片、站會筆記和日期問答。

## 快速開始

啟用 Codex 和 Logbook 外掛：

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

設定明確的視覺模型，以確保啟動行為可預期：

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
          visionModel: "codex/gpt-5.5",
        },
      },
    },
  },
}
```

如果你使用 `plugins.allow`，請同時包含 `codex` 和 `logbook`。變更外掛設定後重新啟動閘道，接著檢查註冊項目並開啟儀表板：

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

節點描述必須包含 `screen.snapshot` 或 `logbook.snapshot`。無頭節點只有在外掛啟用後才會宣告 `logbook.snapshot`。如果缺少該命令，請參閱[節點疑難排解](/zh-TW/nodes/troubleshooting)。

只有在外掛已啟用且控制 UI 工作階段具備 `operator.write` 時，Logbook 分頁才會出現。狀態列應顯示 **擷取中**，且沒有錯誤。分析視窗關閉時會出現時間軸卡片；或者，你也可以在活動被擷取後選取 **立即分析**。

## 運作方式

1. **擷取**：每隔 `captureIntervalSeconds`（預設 30 秒），Logbook 會叫用所選節點的擷取命令，並儲存縮放後的 JPEG 影格。連續相同的影格會標記為閒置，並從分析中排除。
2. **觀察**：分析視窗（預設 15 分鐘）結束後，外掛會最多取樣 16 個活動影格並將其傳送到視覺模型，模型會回傳帶有時間戳記的活動觀察（「VS Code：正在編輯 store.ts，修正型別錯誤」）。超過兩分鐘的擷取中斷或本機午夜也會關閉目前視窗。
3. **合成**：觀察加上最近 45 分鐘的既有卡片，會被修訂為時間軸卡片（每張 10-60 分鐘），包含標題、摘要、分類、主要 app，以及任何簡短的分心事項。
4. **修剪**：早於 `retentionDays`（預設 14）的影格會被刪除。卡片、觀察和快取的站會內容會保留。

日期邊界和時間軸時鐘使用閘道的本機時區，而不是瀏覽器的時區。影格和 SQLite 時間軸資料庫位於 `<state-dir>/logbook/` 下。

## 模型與資料流

Logbook 使用兩個不同的模型路由：

| 階段             | 傳送的資料                                                | 模型路由                                                          |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 觀察             | 最多 16 個取樣 JPEG 影格及其擷取時間                     | `visionModel`，或相容且借用的 `tools.media` Codex 項目 |
| 合成卡片         | 帶有時間戳記的觀察和近期時間軸卡片                       | 透過外掛 LLM 執行階段使用預設代理模型                |
| 產生站會內容     | 所選日期和前一天的卡片                                   | 透過外掛 LLM 執行階段使用預設代理模型                |
| 詢問你的一天     | 問題、所選日期的卡片，以及近期觀察                       | 透過外掛 LLM 執行階段使用預設代理模型                |

完整 SQLite 資料庫不會傳送給任一模型。原始螢幕截圖只會送到觀察階段；卡片合成、站會內容和問答只會接收衍生文字。

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
          visionModel: "codex/gpt-5.5",
          retentionDays: 14,
        },
      },
    },
  },
}
```

所有 Logbook 設定鍵都是選用的。數值會四捨五入為整數，並限制在支援範圍內。

| 鍵                        | 預設值  | 範圍或值                | 行為                                                                                         |
| ------------------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`  | boolean                 | 新快照的持久主開關；為 `false` 時時間軸仍可使用                                             |
| `captureIntervalSeconds`  | `30`    | `5`-`600`               | 擷取嘗試之間的延遲                                                                           |
| `analysisIntervalMinutes` | `15`    | `3`-`120`               | 目標觀察視窗；中斷和午夜可能會讓它提早關閉                                                   |
| `nodeId`                  | 未設定  | 節點 id 或顯示名稱      | 將擷取固定到一個已連線節點；比對不區分大小寫                                                 |
| `screenIndex`             | `0`     | `0`-`16`                | 以零為基準的顯示器索引                                                                       |
| `maxWidth`                | `1440`  | `480`-`3840`            | 要求的擷取大小上限；無頭 macOS 會套用到最大維度                                              |
| `visionModel`             | 未設定  | `provider/model`        | 明確的結構化路由；格式錯誤的參照會暫停分析，不支援的提供者會讓批次失敗                       |
| `retentionDays`           | `14`    | `1`-`365`               | 刪除舊影格；卡片、觀察和站會內容會保留                                                       |

沒有 `nodeId` 時，Logbook 會優先使用公開 `screen.snapshot` 的已連線 app 節點，然後退回到公開 `logbook.snapshot` 的無頭節點。在未固定的設定中，失敗的節點會輪到其他符合資格的節點之後。儀表板暫停切換是工作階段限定，並會在閘道重新啟動時重設；若要持久停止，請使用 `captureEnabled: false`。

### 視覺模型選擇

Logbook 會依此順序解析觀察模型：

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` 下第一個支援影像的 Codex 項目
3. `tools.media.models` 下第一個支援影像的 Codex 項目

其他媒體提供者會被略過，因為它們目前未公開 Logbook 所需的結構化擷取合約。設定 `tools.media.image.enabled: false` 會停用借用的媒體預設值，但明確的 Logbook `visionModel` 仍會套用。

## 儀表板分頁

- **時間軸**：每個活動的可展開卡片，包含分類顏色、主要 app、分心事項晶片，以及快照關鍵影格。
- **一天概覽**：專注比例、分類明細、熱門 app。
- **每日站會**：將昨天加上今天轉成可直接貼上的更新。
- **詢問你的一天**：從追蹤的時間軸回答自然語言問題（「我什麼時候審查 gateway PR？」）。
- **立即分析**：立即關閉目前擷取視窗，而不是等待分析間隔。

## 閘道方法

Logbook 會註冊這些閘道 RPC 方法：

| 方法                  | 參數                     | 範圍             | 結果                                                                     |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | 無                       | `operator.read`  | 擷取、分析、模型、節點、閘道日期，以及閘道時區狀態                       |
| `logbook.days`        | 無                       | `operator.read`  | 含時間軸卡片數量與卡片時間邊界的日期                                     |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | 衍生卡片和日期統計；預設為閘道目前日期                                   |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | 要求的 epoch 毫秒範圍內的影格中繼資料                                    |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | 一個以 base64 表示的原始 JPEG 影格                                       |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | 某日期的快取或重新產生站會文字                                           |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | 以時間軸為依據的某日期答案                                               |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | 工作階段限定的暫停狀態和更新後狀態                                       |
| `logbook.analyze.now` | 無                       | `operator.write` | 開始待處理的分析，或回傳無法開始的原因                                   |

讀取方法會回傳操作狀態或衍生文字。原始螢幕截圖像素、模型花費動作和執行階段變更需要 `operator.write`。控制 UI 分頁也需要 `operator.write`，因為它會公開這些動作和原始影格預覽；唯讀用戶端仍可直接呼叫衍生文字方法。

## 隱私注意事項

- 快照可能包含螢幕上的任何內容，包括秘密。影格除了作為取樣輸入傳送給設定的觀察模型外，不會離開機器。
- 在卡片合成、站會內容產生或問答期間，觀察、近期卡片和問題可能會透過預設代理模型離開機器。請將提供者的資料處理政策套用到兩個模型路由。
- 當你需要完全本機的管線時，請同時為結構化觀察模型和預設代理模型使用本機路由。
- 影格、時間軸資料庫和暫存擷取會以僅擁有者可存取的檔案權限寫入。
- 將 `screen.snapshot` 加入 `gateway.nodes.denyCommands` 是螢幕擷取終止開關：它會同時封鎖 app 節點擷取和 Logbook 自己的 `logbook.snapshot` 命令。
- 設定 `tools.media.image.enabled: false` 也會阻止 Logbook 借用媒體影像模型進行分析；此時只會使用外掛設定中明確的 `visionModel`。

## 疑難排解

### Logbook 分頁遺失

檢查三個關卡：

1. `openclaw plugins list --enabled` 包含 `logbook`。
2. 閘道已在外掛或 allowlist 變更後重新啟動。
3. 控制 UI 連線具有 `operator.write`；唯讀工作階段不會收到互動式分頁描述元。

如果已設定 `plugins.allow`，則建議設定必須同時包含 `logbook` 和 `codex`。

### 擷取回報錯誤

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- 確認節點公開 `screen.snapshot` 或 `logbook.snapshot`。
- 在擷取用的 Mac 上授予螢幕錄製權限。
- 如果已設定 `nodeId`，請確認它符合節點 ID 或顯示名稱。
- 檢查 `gateway.nodes.denyCommands` 未包含
  `screen.snapshot`。

連續失敗三次後，Logbook 會退避十個擷取週期，然後重試。未釘選的設定可以輪換到另一個符合資格的節點。

### 擷取成功但沒有卡片出現

- **模型缺失** 狀態表示找不到相容的結構化視覺路由。啟用 Codex 外掛並完成驗證，或設定有效的明確 `visionModel`。模型缺失時，擷取的畫面會保持待處理，並可在修正設定後進行分析。
- 等待 `analysisIntervalMinutes`，或在活動被擷取後選取 **立即分析**。
- 連續相同的畫面是閒置證據，不會進入分析批次。測試前請變更可見螢幕內容。
- 如果最新批次顯示錯誤，請修正模型或驗證問題，然後選取 **立即分析**。失敗批次只會在該明確動作下重試，以避免重複產生模型費用。

## 相關

- [管理外掛](/zh-TW/plugins/manage-plugins)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [節點](/zh-TW/nodes)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
- [控制 UI](/zh-TW/web/control-ui)
