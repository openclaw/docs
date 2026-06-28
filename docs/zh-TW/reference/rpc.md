---
read_when:
    - 新增或變更外部 CLI 整合
    - 偵錯 RPC 配接器 (signal-cli, imsg)
summary: 外部 CLI（signal-cli、imsg）的 RPC 介接器與 Gateway 模式
title: RPC 轉接器
x-i18n:
    generated_at: "2026-05-10T19:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 透過 JSON-RPC 整合外部 CLI。今日使用兩種模式。

## 模式 A：HTTP 常駐程式 (signal-cli)

- `signal-cli` 以常駐程式形式執行，透過 HTTP 使用 JSON-RPC。
- 事件串流是 SSE (`/api/v1/events`)。
- 健康狀態探測：`/api/v1/check`。
- 當 `channels.signal.autoStart=true` 時，OpenClaw 負責生命週期。

設定和端點請參閱 [Signal](/zh-TW/channels/signal)。

## 模式 B：stdio 子行程 (imsg)

- OpenClaw 會為 [iMessage](/zh-TW/channels/imessage) 產生 `imsg rpc` 作為子行程。
- JSON-RPC 透過 stdin/stdout 以行分隔（一行一個 JSON 物件）。
- 不需要 TCP 連接埠，也不需要常駐程式。

使用的核心方法：

- `watch.subscribe` → 通知 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list`（探測/診斷）

舊版設定和定址請參閱 [iMessage](/zh-TW/channels/imessage)（首選 `chat_id`）。

## 轉接器準則

- Gateway 負責行程（啟動/停止與提供者生命週期綁定）。
- 保持 RPC 用戶端具備韌性：逾時、退出時重新啟動。
- 優先使用穩定 ID（例如 `chat_id`），而不是顯示字串。

## 相關內容

- [Gateway 通訊協定](/zh-TW/gateway/protocol)
