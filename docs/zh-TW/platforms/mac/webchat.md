---
read_when:
    - 偵錯 Mac WebChat 檢視畫面或迴送連接埠
summary: Mac 應用程式如何嵌入 Gateway WebChat，以及如何進行偵錯
title: 網頁聊天 (macOS)
x-i18n:
    generated_at: "2026-05-06T02:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b53eda688ff8786da4a4a615927a640090a1ecc71af8c08469c3a3c98a32af41
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列應用程式會將 WebChat UI 嵌入為原生 SwiftUI 檢視。它會連線到 Gateway，並預設使用所選代理程式的**主要工作階段**（可透過工作階段切換器切換到其他工作階段）。

- **本機模式**：直接連線到本機 Gateway WebSocket。
- **遠端模式**：透過 SSH 轉送 Gateway 控制連接埠，並使用該通道作為資料平面。

## 啟動與偵錯

- 手動：龍蝦選單 →「開啟聊天」。
- 測試時自動開啟：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 日誌：`./scripts/clawlog.sh`（子系統 `ai.openclaw`，類別 `WebChatSwiftUI`）。

## 連接方式

- 資料平面：Gateway WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 會回傳已針對顯示正規化的逐字稿列：內嵌指令標籤會從可見文字中移除，純文字工具呼叫 XML 承載內容（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）和洩漏的 ASCII／全形模型控制權杖會被移除，純靜默權杖的助理列（例如完全符合的 `NO_REPLY` / `no_reply`）會被省略，過大的列可以替換為預留位置。
- 工作階段：預設使用主要工作階段（`main`，或範圍為全域時的 `global`）。UI 可以在工作階段之間切換。
- 新手導引會使用專用工作階段，以將首次執行設定分開。

## 安全性介面

- 遠端模式只會透過 SSH 轉送 Gateway WebSocket 控制連接埠。

## 已知限制

- UI 已針對聊天工作階段最佳化（不是完整的瀏覽器沙箱）。

## 相關

- [WebChat](/zh-TW/web/webchat)
- [macOS 應用程式](/zh-TW/platforms/macos)
