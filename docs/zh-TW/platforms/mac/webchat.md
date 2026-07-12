---
read_when:
    - 偵錯 Mac WebChat 檢視或 local loopback 連接埠
summary: macOS 應用程式如何嵌入閘道 WebChat，以及如何進行偵錯
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-11T21:31:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列應用程式將 WebChat 使用者介面內嵌為原生 SwiftUI 檢視。它會連線至閘道，並預設使用所選代理程式的主要工作階段（`main`；若 `session.scope` 為 `global`，則使用 `global`）。

完整聊天視窗採用原生分割檢視：

- **工作階段側邊欄**：可搜尋的工作階段清單，包含已釘選與最近使用區段、未讀指示器，以及可釘選／取消釘選、複製工作階段金鑰和刪除的內容選單。工具列按鈕（或 Cmd-N）會透過 `sessions.create` 建立真正的新工作階段。
- **視窗工具列**：內容用量環形指示器（權杖數與工作階段費用，並附有精簡操作）、思考層級選擇器、模型選擇器，以及工作階段操作選單（新增工作階段、重新整理、複製工作階段金鑰、匯出對話記錄、壓縮、清除歷史記錄）。
- **對話記錄與輸入框**：助理訊息會搭配頭像顯示為純文字，使用者訊息則顯示為強調色對話框。輸入 `/` 會開啟由 `commands.list` 提供資料的斜線命令自動完成，並支援方向鍵／Tab／Return／Escape 鍵盤導覽。在訊息上按一下滑鼠右鍵即可複製。

從選單列開啟的錨定快速聊天面板會保留精簡的單欄版面配置與內嵌選擇器。

- **本機模式**：直接連線至本機閘道 WebSocket。
- **遠端模式**：透過 SSH 轉送閘道控制連接埠，並將該通道用作資料平面。

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
- `chat.history` 會傳回經顯示正規化的對話記錄：從可見文字中移除內嵌指令標籤；移除純文字工具呼叫 XML 承載資料（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括遭截斷的區塊）及外洩的模型控制權杖；省略只含靜默權杖的助理資料列，例如完全相符的 `NO_REPLY`／`no_reply`；過大的資料列可替換為截斷預留位置。
- 工作階段：預設使用上述主要工作階段；使用者介面可切換工作階段。
- 初始設定使用專用工作階段，將首次執行設定與其他工作階段分開。
- 離線快取：應用程式會按各閘道保留一小份唯讀的近期聊天工作階段與對話記錄快取（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）：冷啟動時會立即顯示最後已知的對話記錄，並在閘道回應後重新整理；中斷連線時仍可瀏覽近期聊天（在連線恢復前，傳送功能維持停用）。

## 安全性介面

- 遠端模式僅透過 SSH 轉送閘道 WebSocket 控制連接埠。

## 已知限制

- 此使用者介面針對聊天工作階段最佳化，並非完整的瀏覽器沙箱。

## 相關內容

- [WebChat](/zh-TW/web/webchat)
- [macOS 應用程式](/zh-TW/platforms/macos)
