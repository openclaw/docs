---
read_when:
    - 調整 Mac 選單 UI 或狀態邏輯
summary: 選單列狀態邏輯以及向使用者呈現的內容
title: 選單列
x-i18n:
    generated_at: "2026-05-02T02:53:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# 選單列狀態邏輯

## 顯示內容

- 我們會在選單列圖示，以及選單的第一個狀態列中顯示目前的代理工作狀態。
- 工作進行中時會隱藏健康狀態；當所有工作階段都閒置時會恢復顯示。
- 根層級的「上下文」子選單會包含最近的工作階段，而不是直接在根選單中展開。
- 根選單中的「節點」區塊只列出**裝置**（透過 `node.list` 配對的節點），不列出用戶端/存在狀態項目。
- 當可用提供者用量快照時，根層級會在「上下文」下方顯示「用量」區段；若有可用資料，後方會接著顯示用量成本詳細資訊。

## 狀態模型

- 工作階段：事件會帶有 `runId`（每次執行）以及承載資料中的 `sessionKey`。「主要」工作階段的鍵是 `main`；若不存在，則退回使用最近更新的工作階段。
- 優先順序：主要工作階段永遠優先。若主要工作階段為作用中，會立即顯示其狀態。若主要工作階段閒置，則顯示最近作用中的非主要工作階段。我們不會在活動進行中來回切換；只會在目前工作階段轉為閒置，或主要工作階段變為作用中時切換。
- 活動種類：
  - `job`：高層級命令執行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，包含 `toolName` 和 `meta/args`。

## IconState 列舉 (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（偵錯覆寫）

### ActivityKind → 字符號

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 預設 → 🛠️

### 視覺對應

- `idle`：一般小生物。
- `workingMain`：帶有字符號的徽章、完整色調、腿部「工作中」動畫。
- `workingOther`：帶有字符號的徽章、淡化色調、不奔跑。
- `overridden`：不論活動為何，都使用所選的字符號/色調。

## 上下文子選單

- 根選單會顯示一列「上下文」，附帶工作階段數量/狀態，並開啟一個子選單。
- 上下文子選單標頭會顯示過去 24 小時內的作用中工作階段數量。
- 每個工作階段列都會保留其權杖列、年齡、預覽、思考/詳細模式、重設、compact 和刪除動作。
- 載入中、已中斷連線，以及工作階段載入錯誤訊息會顯示在上下文子選單內。
- 提供者用量與用量成本詳細資訊會留在根層級、位於上下文下方，讓它們不需開啟子選單也能一眼查看。

## 狀態列文字（選單）

- 工作進行中時：`<Session role> · <activity label>`
  - 範例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 閒置時：退回顯示健康狀態摘要。

## 事件擷取

- 來源：控制通道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析欄位：
  - `stream: "job"` 搭配 `data.state` 用於開始/停止。
  - `stream: "tool"` 搭配 `data.phase`、`name`，以及選用的 `meta`/`args`。
- 標籤：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：縮短後的路徑。
  - `edit`：路徑加上從 `meta`/diff 計數推斷出的變更種類。
  - 後備：工具名稱。

## 偵錯覆寫

- 設定 ▸ 偵錯 ▸「圖示覆寫」選擇器：
  - `System (auto)`（預設）
  - `Working: main`（依工具種類）
  - `Working: other`（依工具種類）
  - `Idle`
- 透過 `@AppStorage("iconOverride")` 儲存；對應到 `IconState.overridden`。

## 測試檢查清單

- 觸發主要工作階段作業：確認圖示會立即切換，且狀態列會顯示主要標籤。
- 在主要工作階段閒置時觸發非主要工作階段作業：圖示/狀態會顯示非主要；直到完成前都保持穩定。
- 其他工作階段作用中時啟動主要工作階段：圖示會立即切換到主要。
- 快速工具突發：確認徽章不會閃爍（工具結果有 TTL 寬限）。
- 所有工作階段閒置後，健康狀態列會重新出現。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [選單列圖示](/zh-TW/platforms/mac/icon)
