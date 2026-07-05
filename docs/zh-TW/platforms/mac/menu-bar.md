---
read_when:
    - 調整 Mac 選單介面或狀態邏輯
summary: 選單列狀態邏輯與向使用者顯示的內容
title: 選單列
x-i18n:
    generated_at: "2026-07-05T11:33:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 顯示內容

- 目前的代理工作狀態會呈現在選單列圖示，以及選單的第一個狀態列中。
- 工作進行中會隱藏健康狀態；所有工作階段都閒置後會再次顯示。
- 根層級的「內容脈絡」項目會開啟包含近期工作階段的子選單，而不是在根選單中展開它們。
- 根選單中的「節點」區塊只列出已配對的**裝置**（來自 `node.list`），不列出用戶端/上線狀態項目。
- 當提供者用量快照可用時，根層級會在內容脈絡下方顯示「用量」區段，若有費用詳細資料也會接續顯示。

## 狀態模型

- 來源：`WorkActivityStore`（`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`）。
- 事件會以含有 `runId` 的 `ControlAgentEvent` 抵達；處理器（`ControlChannel.routeWorkActivity`）會從事件承載資料讀取 `sessionKey`，若不存在則預設為 `"main"`。
- 優先順序：主工作階段（預設為 `sessionKey == "main"`）永遠優先。如果主工作階段正在活動，會立即顯示其狀態。如果主工作階段閒置，則改為顯示最近活動的非主工作階段。儲存區不會在活動中途切換；只有在目前工作階段進入閒置，或主工作階段變成活動狀態時才會切換。
- 活動種類：
  - `job`：高層級命令執行（`state: started|streaming|done|error|...`）。
  - `tool`：含有 `name`、選用 `meta`/`args` 的 `phase: start|result`。

## IconState 列舉（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（偵錯覆寫）

### ActivityKind -> 徽章符號

`ActivityKind` 會包裝 `ToolKind`（`bash`、`read`、`write`、`edit`、`attach`、`other`）或單純的 `job`。每一種都會對應到繪製在小獸圖示上的 SF Symbol 徽章（`IconState.badgeSymbolName`）：

| 種類            | 符號                               |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### 視覺對應

- `idle`：一般小獸，沒有徽章。
- `workingMain`：帶符號的徽章、完整色調（`.primary` prominence）、腿部「工作中」動畫。
- `workingOther`：帶符號的徽章、柔和色調（`.secondary` prominence）、不奔跑。
- `overridden`：無論實際活動為何，都使用選定的符號/色調。

## 內容脈絡子選單

- 根選單會顯示一列「內容脈絡」，包含工作階段數量/狀態；它會開啟子選單（`MenuSessionsInjector`）。
- 子選單標頭會顯示過去 24 小時內的活動工作階段數量。
- 每個工作階段列都保留其權杖列、年齡、預覽、思考/詳細切換、重設、壓縮和刪除動作。
- 載入中、已中斷連線和工作階段載入錯誤訊息會顯示在內容脈絡子選單內。
- 用量和費用區段會保留在內容脈絡下方的根層級，因此不需開啟子選單即可快速查看。

## 狀態列文字（選單）

- 工作進行中：`<Session role> · <activity label>`（`MenuContentView` 中的 `"\(roleLabel) · \(activity.label)"`），其中角色標籤是 `Main` 或 `Other`。
- 閒置時：退回健康狀態摘要。

## 事件擷取

- 來源：control-channel `agent` 事件，由 `ControlChannel.routeWorkActivity(from:)` 路由。
- 已剖析欄位：
  - `stream: "job"` 搭配 `data.state` 表示開始/停止。
  - `stream: "tool"` 搭配 `data.phase`、`data.name`、選用 `data.meta`/`data.args`。
- 工具標籤來自 `ToolDisplayRegistry.resolve(name:args:meta:)`；無法解析的名稱會退回原始工具名稱。

## 偵錯覆寫

- 設定 > 偵錯 >「圖示覆寫」選擇器：
  - `System (auto)`（預設）
  - `Working: main` / `Working: other`（依工具種類：bash、read、write、edit、other）
  - `Idle`
- 儲存在 `UserDefaults` 鍵 `openclaw.iconOverride` 下；對應到 `IconState.overridden`。

## 測試檢查清單

- 觸發主工作階段工作：圖示會立即切換，且狀態列顯示主標籤。
- 主工作階段閒置時觸發非主工作階段工作：圖示/狀態會顯示非主工作階段；會保持穩定直到它完成。
- 另一個工作階段活動中時啟動主工作階段：圖示會立即切換到主工作階段。
- 快速工具突發：徽章不會閃爍（完成工具清除前有 2 秒寬限視窗，`WorkActivityStore.toolResultGrace`）。
- 所有工作階段都閒置後，健康狀態列會再次出現。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [選單列圖示](/zh-TW/platforms/mac/icon)
