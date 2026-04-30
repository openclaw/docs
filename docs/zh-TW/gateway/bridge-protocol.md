---
read_when:
    - 建置或偵錯 Node 用戶端（iOS/Android/macOS Node 模式）
    - 調查配對或橋接身分驗證失敗
    - 稽核 Gateway 暴露的節點介面
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、範圍限定 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-04-30T03:04:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 橋接器已被**移除**。目前的 OpenClaw 組建不再隨附橋接器監聽器，且 `bridge.*` 設定鍵也已不在結構描述中。本頁僅保留作為歷史參考。所有節點／操作員用戶端請使用 [Gateway 協定](/zh-TW/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全邊界**：橋接器只公開一小組允許清單，而不是
  完整的 Gateway API 介面。
- **配對 + 節點身分**：節點准入由 Gateway 擁有，並繫結至
  每個節點專屬的權杖。
- **探索使用體驗**：節點可以透過 LAN 上的 Bonjour 探索 Gateway，或
  直接經由 tailnet 連線。
- **Loopback WS**：完整的 WS 控制平面會保持在本機，除非透過 SSH 建立通道。

## 傳輸

- TCP，每行一個 JSON 物件（JSONL）。
- 選用 TLS（當 `bridge.tls.enabled` 為 true 時）。
- 歷史預設監聽連接埠為 `18790`（目前的組建不會啟動
  TCP 橋接器）。

啟用 TLS 時，探索 TXT 記錄會包含 `bridgeTls=1`，以及作為非機密提示的
`bridgeTlsSha256`。請注意，Bonjour/mDNS TXT 記錄未經驗證；用戶端不得在沒有明確使用者意圖或其他頻外驗證的情況下，將廣告的指紋視為
具權威性的釘選。

## 握手 + 配對

1. 用戶端傳送包含節點中繼資料 + 權杖的 `hello`（如果已配對）。
2. 若尚未配對，Gateway 會回覆 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 用戶端傳送 `pair-request`。
4. Gateway 等待核准，然後傳送 `pair-ok` 和 `hello-ok`。

過去，`hello-ok` 會回傳 `serverName`，且可以包含
`canvasHostUrl`。

## 訊框

用戶端 → Gateway：

- `req` / `res`：限定範圍的 Gateway RPC（聊天、工作階段、設定、健康狀態、voicewake、skills.bins）
- `event`：節點訊號（語音逐字稿、代理請求、聊天訂閱、exec 生命週期）

Gateway → 用戶端：

- `invoke` / `invoke-res`：節點命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已訂閱工作階段的聊天更新
- `ping` / `pong`：keepalive

舊版允許清單強制執行位於 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命週期事件

節點可以發出 `exec.finished` 或 `exec.denied` 事件，以公開 system.run 活動。
這些事件會在 Gateway 中對應為系統事件。（舊版節點可能仍會發出 `exec.started`。）

酬載欄位（除非註明，否則皆為選用）：

- `sessionKey`（必填）：接收系統事件的代理工作階段。
- `runId`：用於分組的唯一 exec ID。
- `command`：原始或已格式化的命令字串。
- `exitCode`、`timedOut`、`success`、`output`：完成詳細資料（僅限 finished）。
- `reason`：拒絕原因（僅限 denied）。

## 歷史 tailnet 用法

- 將橋接器繫結至 tailnet IP：在
  `~/.openclaw/openclaw.json` 中設定 `bridge.bind: "tailnet"`（僅限歷史用途；`bridge.*` 已不再有效）。
- 用戶端透過 MagicDNS 名稱或 tailnet IP 連線。
- Bonjour **不會**跨網路運作；需要時請使用手動主機／連接埠或廣域 DNS‑SD。

## 版本控制

橋接器是**隱含 v1**（沒有 min/max 協商）。本節僅作為
歷史參考；目前的節點／操作員用戶端會使用 WebSocket
[Gateway 協定](/zh-TW/gateway/protocol)。

## 相關

- [Gateway 協定](/zh-TW/gateway/protocol)
- [節點](/zh-TW/nodes)
