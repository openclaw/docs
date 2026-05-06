---
read_when:
    - 調整 Mac 選單 UI 或狀態邏輯
summary: 選單列狀態邏輯與呈現給使用者的內容
title: 選單列
x-i18n:
    generated_at: "2026-05-06T02:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 顯示內容

- 我們會在選單列圖示與選單第一個狀態列中顯示目前的代理程式工作狀態。
- 工作進行中會隱藏健康狀態；所有工作階段閒置後會重新顯示。
- 根層級的「Context」子選單會包含最近的工作階段，而不是直接在根選單中展開。
- 根選單中的「Nodes」區塊只列出**裝置**（透過 `node.list` 配對的節點），不包含用戶端/存在狀態項目。
- 當供應商用量快照可用時，根層級的「Usage」區段會顯示在 Context 下方；可用時也會接著顯示用量成本詳細資料。

## 狀態模型

- 工作階段：事件會帶有 `runId`（每次執行）以及酬載中的 `sessionKey`。「main」工作階段是鍵 `main`；如果缺少，則退回使用最近更新的工作階段。
- 優先順序：main 一律優先。如果 main 為作用中，會立即顯示其狀態。如果 main 閒置，則顯示最近作用中的非 main 工作階段。我們不會在活動進行中來回切換；只有在目前工作階段變成閒置，或 main 變成作用中時才會切換。
- 活動種類：
  - `job`：高層級命令執行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，並帶有 `toolName` 與 `meta/args`。

## IconState 列舉（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（偵錯覆寫）

### ActivityKind → 圖示

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 預設 → 🛠️

### 視覺對應

- `idle`：一般小生物。
- `workingMain`：帶有圖示的徽章、完整色調、腳部「working」動畫。
- `workingOther`：帶有圖示的徽章、低調色調、不疾跑。
- `overridden`：無論活動為何，都使用所選圖示/色調。

## Context 子選單

- 根選單會顯示一列「Context」，包含工作階段數量/狀態，並開啟子選單。
- Context 子選單標頭會顯示過去 24 小時內的作用中工作階段數量。
- 每個工作階段列都保留其 token 列、時間、預覽、thinking/verbose、重設、compact 與刪除動作。
- 載入中、已中斷連線與工作階段載入錯誤訊息會顯示在 Context 子選單內。
- 供應商用量與用量成本詳細資料會保留在 Context 下方的根層級，讓使用者不必開啟子選單也能快速查看。

## 狀態列文字（選單）

- 工作進行中：`<Session role> · <activity label>`
  - 範例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 閒置時：退回顯示健康摘要。

## 事件擷取

- 來源：控制通道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 已剖析欄位：
  - `stream: "job"` 搭配 `data.state` 表示開始/停止。
  - `stream: "tool"` 搭配 `data.phase`、`name`、選用的 `meta`/`args`。
- 標籤：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：縮短路徑。
  - `edit`：路徑加上從 `meta`/diff 計數推斷的變更種類。
  - 後備：工具名稱。

## 偵錯覆寫

- Settings ▸ Debug ▸「Icon override」選擇器：
  - `System (auto)`（預設）
  - `Working: main`（依工具種類）
  - `Working: other`（依工具種類）
  - `Idle`
- 透過 `@AppStorage("iconOverride")` 儲存；對應到 `IconState.overridden`。

## 測試檢查清單

- 觸發 main 工作階段作業：確認圖示立即切換，且狀態列顯示 main 標籤。
- 在 main 閒置時觸發非 main 工作階段作業：圖示/狀態顯示非 main；保持穩定直到其完成。
- 在其他工作階段作用中時啟動 main：圖示會立即切換到 main。
- 快速工具突發：確保徽章不會閃爍（工具結果的 TTL 寬限）。
- 所有工作階段閒置後，健康列會重新出現。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [選單列圖示](/zh-TW/platforms/mac/icon)
