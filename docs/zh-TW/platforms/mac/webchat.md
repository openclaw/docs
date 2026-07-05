---
read_when:
    - 偵錯 Mac WebChat 檢視或回送連接埠
summary: mac 應用程式如何嵌入閘道 WebChat，以及如何偵錯
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-05T11:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24fe8b868fa2a7e2205bd13d32332bae903d3050073ea93f798649ccbaa478f9
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列 App 會將 WebChat 使用者介面嵌入為原生 SwiftUI 視圖。它會連線到閘道，並預設使用所選代理的主要工作階段（`main`，或當 `session.scope` 為 `global` 時使用 `global`），另有工作階段切換器可切換到其他工作階段。

- **本機模式**：直接連線到本機閘道 WebSocket。
- **遠端模式**：透過 SSH 轉送閘道控制連接埠，並使用該通道作為資料平面。

## 啟動與偵錯

- 手動：Lobster 選單 ->「開啟聊天」。
- 測試用自動開啟：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` 可作為舊版別名使用。）

- 日誌：`./scripts/clawlog.sh`（子系統 `ai.openclaw`，類別 `WebChatSwiftUI`）。

## 連接方式

- 資料平面：閘道 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 會回傳已正規化顯示的逐字稿：從可見文字中移除行內指令標籤，移除純文字工具呼叫 XML 承載內容（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包含遭截斷的區塊）與外洩的模型控制權杖，省略純靜默權杖的助理列，例如完全相符的 `NO_REPLY`/`no_reply`，且過大的列可替換為截斷佔位符。
- 工作階段：預設使用上述主要工作階段；使用者介面可在工作階段之間切換。
- 初始設定會使用專用工作階段，讓首次執行設定保持分離。

## 安全面

- 遠端模式只會透過 SSH 轉送閘道 WebSocket 控制連接埠。

## 已知限制

- 使用者介面針對聊天工作階段最佳化，而不是完整的瀏覽器沙盒。

## 相關

- [WebChat](/zh-TW/web/webchat)
- [macOS App](/zh-TW/platforms/macos)
