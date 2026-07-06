---
read_when:
    - 除錯 Mac WebChat 檢視或回送連接埠
summary: Mac 應用程式如何嵌入閘道 WebChat，以及如何偵錯
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-06T10:51:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 925751d15450c816fc81b59ac89a190d88ab8b77629b635913e0862ba94af1c0
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列應用程式會將 WebChat UI 嵌入為原生 SwiftUI 檢視。它會連線到閘道，並預設使用所選代理程式的主要工作階段（`main`，或當 `session.scope` 為 `global` 時使用 `global`），且提供工作階段切換器以切換到其他工作階段。

- **本機模式**：直接連線到本機閘道 WebSocket。
- **遠端模式**：透過 SSH 轉送閘道控制連接埠，並使用該通道作為資料平面。

## 啟動與偵錯

- 手動：Lobster 選單 -> "Open Chat"。
- 測試用自動開啟：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` 可作為舊版別名使用。）

- 日誌：`./scripts/clawlog.sh`（子系統 `ai.openclaw`，分類 `WebChatSwiftUI`）。

## 連接方式

- 資料平面：閘道 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 會回傳經顯示正規化的逐字稿：可見文字中的內嵌指令標籤會被移除，純文字工具呼叫 XML 酬載（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括被截斷的區塊）和洩漏的模型控制權杖會被移除，純靜默權杖的助理列（例如完全相符的 `NO_REPLY`/`no_reply`）會被省略，過大的列可被替換為截斷佔位符。
- 工作階段：預設使用如上所述的主要工作階段；UI 可在工作階段之間切換。
- 入門設定會使用專用工作階段，將首次執行設定與其他內容分開。
- 離線快取：應用程式會為每個閘道保留最近聊天工作階段與逐字稿的小型唯讀快取（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）：冷啟動會立即繪製最後已知的逐字稿，並在閘道回應後重新整理；中斷連線時仍可瀏覽最近聊天（傳送功能會保持停用，直到連線恢復）。

## 安全性介面

- 遠端模式只會透過 SSH 轉送閘道 WebSocket 控制連接埠。

## 已知限制

- UI 針對聊天工作階段最佳化，而非完整的瀏覽器沙箱。

## 相關

- [WebChat](/zh-TW/web/webchat)
- [macOS 應用程式](/zh-TW/platforms/macos)
