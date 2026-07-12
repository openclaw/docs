---
read_when:
    - 偵錯 Mac WebChat 檢視畫面或迴路連接埠
summary: macOS App 如何嵌入閘道 WebChat，以及如何偵錯
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-12T14:36:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列 App 將 WebChat UI 內嵌為原生 SwiftUI 檢視。它會連線至閘道，並預設使用所選代理程式的主要工作階段（`main`；當 `session.scope` 為 `global` 時則為 `global`）。

完整聊天視窗採用原生分割檢視：

- **工作階段側邊欄**：可搜尋的工作階段清單，包含已釘選與最近使用區段、未讀指示，以及可供釘選／取消釘選、複製工作階段金鑰和刪除的內容選單。工具列按鈕（或 Cmd-N）會透過 `sessions.create` 建立真正的新工作階段。
- **視窗工具列**：內容用量環狀指示器（權杖數與工作階段費用，並附精簡操作）、思考層級選擇器、模型選擇器，以及工作階段操作選單（新增工作階段、重新整理、複製工作階段金鑰、匯出對話記錄、壓縮、清除記錄）。
- **對話記錄與輸入區**：助理訊息會以純文字搭配頭像呈現，使用者訊息則以強調色對話泡泡呈現。輸入 `/` 會開啟由 `commands.list` 支援的斜線命令自動完成，並可使用方向鍵／Tab／Return／Escape 操作鍵盤導覽。在訊息上按右鍵即可複製。

從選單列開啟的錨定快速聊天面板會維持精簡的單欄版面配置，並提供行內選擇器。

- **本機模式**：直接連線至本機閘道 WebSocket。
- **遠端模式**：透過 SSH 轉送閘道控制連接埠，並使用該通道作為資料平面。

## 啟動與偵錯

- 手動：Lobster 選單 -> "Open Chat"。
- 測試時自動開啟：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` 可作為舊版別名使用。）

- 日誌：`./scripts/clawlog.sh`（子系統 `ai.openclaw`，類別 `WebChatSwiftUI`）。

## 連接方式

- 資料平面：閘道 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 會傳回經顯示正規化的對話記錄：從可見文字中移除行內指令標籤；移除純文字工具呼叫 XML 承載內容（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括遭截斷的區塊）以及外洩的模型控制權杖；省略僅含靜默權杖的助理列，例如完全相符的 `NO_REPLY`／`no_reply`；過大的列則可能會以截斷預留位置取代。
- 工作階段：預設使用上述主要工作階段；UI 可在不同工作階段之間切換。
- 新手引導會使用專用工作階段，使首次執行設定與其他工作階段分開。
- 離線快取：App 會為每個閘道保留一份近期聊天工作階段與對話記錄的小型唯讀快取（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）：冷啟動時會立即呈現最後已知的對話記錄，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天（在連線恢復前，傳送功能會維持停用）。

## 安全性介面

- 遠端模式僅透過 SSH 轉送閘道 WebSocket 控制連接埠。

## 已知限制

- 此 UI 針對聊天工作階段最佳化，而非完整的瀏覽器沙箱。

## 相關內容

- [WebChat](/zh-TW/web/webchat)
- [macOS App](/zh-TW/platforms/macos)
