---
read_when:
    - 偵錯 mac WebChat 檢視或回送連接埠
summary: Mac 應用程式如何嵌入 Gateway WebChat，以及如何進行偵錯
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-05-06T09:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 選單列應用程式會將 WebChat UI 嵌入為原生 SwiftUI 檢視。它會連線至 Gateway，並預設使用所選代理程式的 **主要工作階段**（並提供可切換至其他工作階段的工作階段切換器）。

- **本機模式**：直接連線至本機 Gateway WebSocket。
- **遠端模式**：透過 SSH 轉送 Gateway 控制連接埠，並使用該通道作為資料平面。

## 啟動與偵錯

- 手動：Lobster 選單 →「開啟聊天」。
- 測試時自動開啟：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 記錄：`./scripts/clawlog.sh`（子系統 `ai.openclaw`，類別 `WebChatSwiftUI`）。

## 連接方式

- 資料平面：Gateway WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 會傳回已針對顯示正規化的逐字稿列：行內指令標籤會從可見文字中移除；純文字工具呼叫 XML 酬載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及截斷的工具呼叫區塊）和外洩的 ASCII/全形模型控制權杖會被移除；僅含靜默權杖的助理列，例如完全符合 `NO_REPLY` / `no_reply`，會被省略；過大的列可替換為預留位置。
- 工作階段：預設使用主要工作階段（`main`，或當範圍為全域時使用 `global`）。UI 可在不同工作階段之間切換。
- 入門設定會使用專用工作階段，讓首次執行設定保持獨立。

## 安全面

- 遠端模式只會透過 SSH 轉送 Gateway WebSocket 控制連接埠。

## 已知限制

- UI 已針對聊天工作階段最佳化（不是完整的瀏覽器沙箱）。

## 相關

- [WebChat](/zh-TW/web/webchat)
- [macOS 應用程式](/zh-TW/platforms/macos)
