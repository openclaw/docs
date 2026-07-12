---
read_when:
    - 新增或變更外部命令列介面整合功能
    - 偵錯 RPC 轉接器（signal-cli、imsg）
summary: 外部命令列介面（signal-cli、imsg）的 RPC 介接器與閘道模式
title: RPC 轉接器
x-i18n:
    generated_at: "2026-07-11T21:46:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw 透過 JSON-RPC 整合外部命令列介面。目前使用兩種模式。

## 模式 A：HTTP 常駐程式（signal-cli）

- `signal-cli` 以常駐程式形式執行，並透過 HTTP 使用 JSON-RPC。
- 事件串流使用 SSE（`/api/v1/events`）。
- 健康狀態探測：`/api/v1/check`。
- 當 `channels.signal.autoStart=true` 時，由 OpenClaw 管理生命週期。

設定方式與端點請參閱 [Signal](/zh-TW/channels/signal)。

## 模式 B：stdio 子程序（imsg）

- OpenClaw 會將 `imsg rpc` 作為 [iMessage](/zh-TW/channels/imessage) 的子程序啟動。
- JSON-RPC 透過 stdin/stdout 以逐行分隔的格式傳輸（每行一個 JSON 物件）。
- 不使用 TCP 連接埠，也不需要常駐程式。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探測／診斷）

設定方式與定址方式請參閱 [iMessage](/zh-TW/channels/imessage)（建議優先使用 `chat_id`，而非顯示字串）。

## 介面卡指南

- 閘道負責管理程序（啟動／停止與提供者的生命週期綁定）。
- 確保 RPC 用戶端具有復原能力：設定逾時，並在程序結束時重新啟動。
- 建議優先使用穩定 ID（例如 `chat_id`），而非顯示字串。

## 相關內容

- [閘道通訊協定](/zh-TW/gateway/protocol)
