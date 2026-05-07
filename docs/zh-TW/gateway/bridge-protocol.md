---
read_when:
    - 建置或偵錯 Node 用戶端（iOS/Android/macOS Node 模式）
    - 調查配對或橋接器身分驗證失敗
    - 稽核 Gateway 所公開的節點介面
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、範圍限定 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-05-07T13:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 橋接器已被**移除**。目前的 OpenClaw 建置不再隨附橋接器監聽器，且 `bridge.*` 設定鍵也不再位於結構描述中。本頁僅保留作為歷史參考。所有 Node/操作員用戶端請使用 [Gateway Protocol](/zh-TW/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全邊界**：橋接器公開一個小型允許清單，而不是完整的
  Gateway API 表面。
- **配對 + Node 身分**：Node 准入由 Gateway 擁有，並繫結至
  每個 Node 專屬的權杖。
- **探索使用者體驗**：Node 可以透過區域網路上的 Bonjour 探索 Gateway，或
  直接透過 tailnet 連線。
- **Loopback WS**：完整的 WS 控制平面會保持在本機，除非透過 SSH 通道傳輸。

## 傳輸

- TCP，每行一個 JSON 物件 (JSONL)。
- 選用 TLS（當 `bridge.tls.enabled` 為 true 時）。
- 歷史預設監聽器連接埠是 `18790`（目前建置不會啟動
  TCP 橋接器）。

啟用 TLS 時，探索 TXT 記錄會包含 `bridgeTls=1`，以及作為非秘密提示的
`bridgeTlsSha256`。請注意，Bonjour/mDNS TXT 記錄未經驗證；用戶端不得在沒有明確使用者意圖或其他帶外驗證的情況下，將宣告的指紋視為具權威性的釘選。

## 握手 + 配對

1. 用戶端傳送帶有 Node 中繼資料 + 權杖（如果已配對）的 `hello`。
2. 如果尚未配對，Gateway 會回覆 `error` (`NOT_PAIRED`/`UNAUTHORIZED`)。
3. 用戶端傳送 `pair-request`。
4. Gateway 等待核准，然後傳送 `pair-ok` 和 `hello-ok`。

過去，`hello-ok` 會傳回 `serverName`；託管的 Plugin 表面現在會透過
`pluginSurfaceUrls` 宣告。Canvas/A2UI 使用
`pluginSurfaceUrls.canvas`；已棄用的 `canvasHostUrl` 別名不屬於
重構後的通訊協定。

## 框架

用戶端 → Gateway：

- `req` / `res`：具範圍的 Gateway RPC（聊天、工作階段、設定、健康狀態、語音喚醒、skills.bins）
- `event`：Node 訊號（語音轉錄、代理請求、聊天訂閱、執行生命週期）

Gateway → 用戶端：

- `invoke` / `invoke-res`：Node 命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已訂閱工作階段的聊天更新
- `ping` / `pong`：保持連線

舊版允許清單強制執行位於 `src/gateway/server-bridge.ts`（已移除）。

## 執行生命週期事件

Node 可以發出 `exec.finished` 或 `exec.denied` 事件，以公開 system.run 活動。
這些事件會在 Gateway 中對應到系統事件。（舊版 Node 可能仍會發出 `exec.started`。）

酬載欄位（除非註明，否則皆為選用）：

- `sessionKey`（必填）：接收系統事件的代理工作階段。
- `runId`：用於分組的唯一執行 ID。
- `command`：原始或格式化的命令字串。
- `exitCode`、`timedOut`、`success`、`output`：完成詳細資料（僅 finished）。
- `reason`：拒絕原因（僅 denied）。

## 歷史 tailnet 用法

- 將橋接器繫結至 tailnet IP：在
  `~/.openclaw/openclaw.json` 中設定 `bridge.bind: "tailnet"`（僅供歷史參考；`bridge.*` 不再有效）。
- 用戶端透過 MagicDNS 名稱或 tailnet IP 連線。
- Bonjour **不會**跨網路；需要時請使用手動主機/連接埠或廣域 DNS-SD。

## 版本控制

橋接器是**隱含 v1**（沒有最小/最大協商）。本節
僅供歷史參考；目前的 Node/操作員用戶端使用 WebSocket
[Gateway Protocol](/zh-TW/gateway/protocol)。

## 相關

- [Gateway protocol](/zh-TW/gateway/protocol)
- [Nodes](/zh-TW/nodes)
