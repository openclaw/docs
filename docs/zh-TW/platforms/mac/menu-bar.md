---
read_when:
    - 微調 Mac 選單 UI 或狀態邏輯
summary: 選單列狀態邏輯與呈現給使用者的內容
title: 選單列
x-i18n:
    generated_at: "2026-04-30T03:20:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# 選單列狀態邏輯

## 顯示內容

- 我們會在選單列圖示與選單的第一個狀態列中顯示目前的代理程式工作狀態。
- 工作進行中時會隱藏健康狀態；所有工作階段都閒置後會再次顯示。
- 選單中的「Nodes」區塊只列出**裝置**（透過 `node.list` 配對的節點），不包含用戶端/存在狀態項目。
- 當可取得提供者用量快照時，Context 下方會出現「用量」區段。

## 狀態模型

- 工作階段：事件會帶有 `runId`（每次執行）以及 payload 中的 `sessionKey`。「main」工作階段的鍵是 `main`；若缺少此鍵，則會退回使用最近更新的工作階段。
- 優先順序：main 一律優先。若 main 為作用中，會立即顯示其狀態。若 main 閒置，則顯示最近作用中的非 main 工作階段。我們不會在活動中途來回切換；只有在目前工作階段進入閒置，或 main 變成作用中時才會切換。
- 活動種類：
  - `job`：高階命令執行（`state: started|streaming|done|error`）。
  - `tool`：`phase: start|result`，並帶有 `toolName` 和 `meta/args`。

## IconState enum（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（偵錯覆寫）

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 視覺對應

- `idle`：一般小動物。
- `workingMain`：帶有 glyph 的徽章、完整色調、腿部「工作中」動畫。
- `workingOther`：帶有 glyph 的徽章、柔和色調、不奔跑。
- `overridden`：無論活動為何，都使用選定的 glyph/色調。

## 狀態列文字（選單）

- 工作進行中時：`<Session role> · <activity label>`
  - 範例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 閒置時：退回顯示健康摘要。

## 事件擷取

- 來源：控制通道 `agent` 事件（`ControlChannel.handleAgentEvent`）。
- 解析欄位：
  - `stream: "job"` 搭配 `data.state` 用於開始/停止。
  - `stream: "tool"` 搭配 `data.phase`、`name`、選用的 `meta`/`args`。
- 標籤：
  - `exec`：`args.command` 的第一行。
  - `read`/`write`：縮短後的路徑。
  - `edit`：路徑加上從 `meta`/diff 計數推斷出的變更種類。
  - fallback：工具名稱。

## 偵錯覆寫

- Settings ▸ Debug ▸「圖示覆寫」選擇器：
  - `System (auto)`（預設）
  - `Working: main`（依工具種類）
  - `Working: other`（依工具種類）
  - `Idle`
- 透過 `@AppStorage("iconOverride")` 儲存；對應到 `IconState.overridden`。

## 測試檢查清單

- 觸發 main 工作階段作業：確認圖示會立即切換，且狀態列顯示 main 標籤。
- main 閒置時觸發非 main 工作階段作業：圖示/狀態會顯示非 main；在其完成前保持穩定。
- 其他工作階段作用中時啟動 main：圖示會立刻切換到 main。
- 快速工具連發：確保徽章不會閃爍（工具結果使用 TTL 寬限）。
- 所有工作階段閒置後，健康列會再次出現。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [選單列圖示](/zh-TW/platforms/mac/icon)
