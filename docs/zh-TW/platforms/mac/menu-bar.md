---
read_when:
    - 微調 Mac 選單使用者介面或狀態邏輯
summary: 選單列狀態邏輯及向使用者顯示的內容
title: 選單列
x-i18n:
    generated_at: "2026-07-11T21:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 顯示內容

- 目前的代理程式工作狀態會顯示在選單列圖示，以及選單的第一個狀態列中。
- 工作進行時會隱藏健康狀態；所有工作階段都閒置後，健康狀態會再次顯示。
- 根層級的「情境」項目會開啟包含最近工作階段的子選單，而不是將它們展開在根選單中。
- 根選單中的「節點」區塊僅列出已配對的**裝置**（來自 `node.list`），不會列出用戶端／在線狀態項目。
- 當供應商用量快照可用時，根層級的「用量」區段會顯示在「情境」下方；若有費用明細，也會接續顯示。

## 狀態模型

- 來源：`WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- 事件會以含有 `runId` 的 `ControlAgentEvent` 形式傳入；處理常式（`ControlChannel.routeWorkActivity`）會從事件酬載讀取 `sessionKey`，若不存在則預設為 `"main"`。
- 優先順序：主要工作階段（預設為 `sessionKey == "main"`）永遠優先。若主要工作階段處於活動狀態，會立即顯示其狀態。若主要工作階段閒置，則改為顯示最近處於活動狀態的非主要工作階段。儲存區不會在活動進行期間切換；只有目前的工作階段轉為閒置，或主要工作階段開始活動時才會切換。
- 活動種類：
  - `job`：高階命令執行（`state: started|streaming|done|error|...`）。
  - `tool`：`phase: start|result`，包含 `name`，以及選用的 `meta`／`args`。

## IconState 列舉（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（偵錯覆寫）

### ActivityKind -> 徽章符號

`ActivityKind` 會包裝一個 `ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）或單獨的 `job`。每一種都會對應到繪製在小動物圖示上方的 SF Symbols 徽章（`IconState.badgeSymbolName`）：

| 種類            | 符號                               |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other`／`job`  | `gearshape.fill`                   |

### 視覺對應

- `idle`：一般的小動物圖示，無徽章。
- `workingMain`：帶有符號的徽章、完整色調（`.primary` 顯著度），以及腿部「工作中」動畫。
- `workingOther`：帶有符號的徽章、柔和色調（`.secondary` 顯著度），不會快速移動。
- `overridden`：無論實際活動為何，都使用所選的符號／色調。

## 上下文子選單

- 根選單顯示一個含工作階段數量／狀態的「上下文」列；點選後會開啟子選單（`MenuSessionsInjector`）。
- 子選單標頭顯示過去 24 小時內的作用中工作階段數量。
- 每個工作階段列都會保留其權杖用量列、存在時間、預覽、思考／詳細模式切換、重設、壓縮及刪除操作。
- 載入中、連線中斷及工作階段載入錯誤訊息會顯示在「上下文」子選單內。
- 用量與費用區段會保留在「上下文」下方的根層級，因此無須開啟子選單即可一目瞭然。

## 狀態列文字（選單）

- 工作進行中：`<Session role> · <activity label>`（`MenuContentView` 中的 `"\(roleLabel) · \(activity.label)"`），其中角色標籤為 `Main` 或 `Other`。
- 閒置時：退回顯示健康狀態摘要。

## 事件擷取

- 來源：控制通道的 `agent` 事件，由 `ControlChannel.routeWorkActivity(from:)` 路由。
- 解析的欄位：
  - `stream: "job"` 搭配 `data.state` 表示開始／停止。
  - `stream: "tool"` 搭配 `data.phase`、`data.name`，以及選用的 `data.meta`／`data.args`。
- 工具標籤來自 `ToolDisplayRegistry.resolve(name:args:meta:)`；無法解析的名稱會退回使用原始工具名稱。

## 偵錯覆寫

- Settings > Debug > "Icon override" 選擇器：
  - `System (auto)`（預設）
  - `Working: main` / `Working: other`（依工具類型：bash、讀取、寫入、編輯、其他）
  - `Idle`
- 儲存於 `UserDefaults` 鍵 `openclaw.iconOverride`；對應至 `IconState.overridden`。

## 測試檢查清單

- 觸發主要工作階段作業：圖示立即切換，狀態列顯示主要標籤。
- 當主要工作階段閒置時觸發非主要工作階段作業：圖示／狀態顯示非主要工作階段，並維持穩定直到作業完成。
- 在另一個工作階段處於活動狀態時啟動主要工作階段：圖示立即切換至主要工作階段。
- 快速連續使用工具：徽章不會閃爍（已完成工具在清除前有 2 秒寬限期，`WorkActivityStore.toolResultGrace`）。
- 所有工作階段皆閒置後，健康狀態列會再次出現。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [選單列圖示](/zh-TW/platforms/mac/icon)
