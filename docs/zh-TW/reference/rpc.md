---
read_when:
    - 新增或變更外部命令列介面整合
    - 偵錯 RPC 配接器（signal-cli、imsg）
summary: 外部命令列介面（signal-cli、imsg）的 RPC 轉接器與閘道模式
title: RPC 轉接器
x-i18n:
    generated_at: "2026-07-05T11:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw 透過 JSON-RPC 整合外部命令列介面。目前使用兩種模式。

## 模式 A：HTTP 常駐程式（signal-cli）

- `signal-cli` 以常駐程式形式執行，並透過 HTTP 使用 JSON-RPC。
- 事件串流是 SSE（`/api/v1/events`）。
- 健康探測：`/api/v1/check`。
- 當 `channels.signal.autoStart=true` 時，OpenClaw 會管理生命週期。

請參閱 [Signal](/zh-TW/channels/signal) 了解設定與端點。

## 模式 B：stdio 子程序（imsg）

- OpenClaw 會為 [iMessage](/zh-TW/channels/imessage) 產生 `imsg rpc` 作為子程序。
- JSON-RPC 透過 stdin/stdout 以逐行分隔方式傳輸（每行一個 JSON 物件）。
- 不需要 TCP 連接埠，也不需要常駐程式。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探測／診斷）

請參閱 [iMessage](/zh-TW/channels/imessage) 了解設定與定址（建議使用 `chat_id`，而不是顯示字串）。

## 轉接器指南

- 閘道擁有程序（啟動／停止綁定到提供者生命週期）。
- 讓 RPC 用戶端具備韌性：逾時、結束時重新啟動。
- 優先使用穩定 ID（例如 `chat_id`），而不是顯示字串。

## 相關

- [閘道協定](/zh-TW/gateway/protocol)
