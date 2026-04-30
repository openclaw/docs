---
read_when:
    - 新增或變更外部 CLI 整合
    - 偵錯 RPC 轉接器 (signal-cli, imsg)
summary: 外部 CLI（signal-cli、舊版 imsg）的 RPC 轉接器和 Gateway 模式
title: RPC 轉接器
x-i18n:
    generated_at: "2026-04-30T03:37:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw 透過 JSON-RPC 整合外部 CLI。目前使用兩種模式。

## 模式 A：HTTP 常駐程式（signal-cli）

- `signal-cli` 以常駐程式形式執行，透過 HTTP 使用 JSON-RPC。
- 事件串流是 SSE（`/api/v1/events`）。
- 健康狀態探測：`/api/v1/check`。
- 當 `channels.signal.autoStart=true` 時，OpenClaw 負責生命週期。

請參閱 [Signal](/zh-TW/channels/signal) 了解設定方式與端點。

## 模式 B：stdio 子程序（舊版：imsg）

> **注意：** 對於新的 iMessage 設定，請改用 [BlueBubbles](/zh-TW/channels/bluebubbles)。

- OpenClaw 會產生 `imsg rpc` 作為子程序（舊版 iMessage 整合）。
- JSON-RPC 透過 stdin/stdout 以行分隔（每行一個 JSON 物件）。
- 不需要 TCP 連接埠，也不需要常駐程式。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探測/診斷）

請參閱 [iMessage](/zh-TW/channels/imessage) 了解舊版設定與定址方式（建議使用 `chat_id`）。

## 介面卡指南

- Gateway 負責程序（啟動/停止與提供者生命週期綁定）。
- 讓 RPC 用戶端保持韌性：逾時、結束時重新啟動。
- 優先使用穩定 ID（例如 `chat_id`），而不是顯示字串。

## 相關

- [Gateway 通訊協定](/zh-TW/gateway/protocol)
