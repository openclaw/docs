---
read_when:
    - 建置或偵錯 Node 用戶端（iOS/Android/macOS Node 模式）
    - 調查配對或橋接驗證失敗
    - 稽核 Gateway 暴露的 Node 介面
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、範圍限定的 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-05-06T17:55:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP bridge 已被**移除**。目前的 OpenClaw 建置不再隨附 bridge listener，且 `bridge.*` 設定鍵也不再位於 schema 中。本頁僅保留作為歷史參考。所有 Node/操作者用戶端請使用 [Gateway Protocol](/zh-TW/gateway/protocol)。
</Warning>

## 它曾經存在的原因

- **安全邊界**：bridge 只公開一小組 allowlist，而不是
  完整的 Gateway API 介面。
- **配對 + Node 身分**：Node 准入由 Gateway 管理，並繫結到
  每個 Node 專屬的 token。
- **探索 UX**：Node 可透過 LAN 上的 Bonjour 探索 Gateway，或透過
  tailnet 直接連線。
- **Loopback WS**：完整的 WS 控制平面會保持在本機，除非透過 SSH 通道轉送。

## 傳輸

- TCP，每行一個 JSON 物件（JSONL）。
- 選用 TLS（當 `bridge.tls.enabled` 為 true 時）。
- 歷史預設 listener port 為 `18790`（目前建置不會啟動
  TCP bridge）。

啟用 TLS 時，探索 TXT records 會包含 `bridgeTls=1`，以及
`bridgeTlsSha256` 作為非機密提示。請注意，Bonjour/mDNS TXT records
未經驗證；用戶端不得在沒有明確使用者意圖或其他 out-of-band 驗證的情況下，
將公告的 fingerprint 視為權威 pin。

## Handshake + 配對

1. 用戶端傳送包含 Node metadata + token 的 `hello`（如果已完成配對）。
2. 若未配對，Gateway 會回覆 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 用戶端傳送 `pair-request`。
4. Gateway 等待核准，然後傳送 `pair-ok` 和 `hello-ok`。

歷史上，`hello-ok` 會傳回 `serverName`，並且可包含
`canvasHostUrl`。

## Frames

用戶端 → Gateway：

- `req` / `res`：有範圍的 Gateway RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：Node 訊號（語音 transcript、agent request、chat subscribe、exec lifecycle）

Gateway → 用戶端：

- `invoke` / `invoke-res`：Node commands（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已訂閱 sessions 的 chat updates
- `ping` / `pong`：keepalive

舊版 allowlist enforcement 位於 `src/gateway/server-bridge.ts`（已移除）。

## Exec lifecycle events

Node 可發出 `exec.finished` 或 `exec.denied` events，以呈現 system.run 活動。
這些會在 Gateway 中對應到 system events。（舊版 Node 可能仍會發出 `exec.started`。）

Payload fields（除非另有註明，否則皆為選用）：

- `sessionKey`（必填）：接收 system event 的 agent session。
- `runId`：用於分組的唯一 exec id。
- `command`：原始或已格式化的 command string。
- `exitCode`、`timedOut`、`success`、`output`：完成詳細資訊（僅 finished）。
- `reason`：拒絕原因（僅 denied）。

## 歷史 tailnet 用法

- 將 bridge 綁定至 tailnet IP：在
  `~/.openclaw/openclaw.json` 中設定 `bridge.bind: "tailnet"`（僅限歷史用途；`bridge.*` 已不再有效）。
- 用戶端透過 MagicDNS name 或 tailnet IP 連線。
- Bonjour **不會**跨網路；需要時請使用手動 host/port 或 wide-area DNS-SD。

## 版本控制

bridge 是**隱含 v1**（沒有 min/max negotiation）。本節僅為歷史參考；目前的 Node/操作者用戶端使用 WebSocket
[Gateway Protocol](/zh-TW/gateway/protocol)。

## 相關

- [Gateway protocol](/zh-TW/gateway/protocol)
- [Node](/zh-TW/nodes)
