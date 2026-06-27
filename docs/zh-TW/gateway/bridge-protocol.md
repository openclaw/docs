---
read_when:
    - 建置或偵錯節點用戶端（iOS/Android/macOS 節點模式）
    - 調查配對或橋接驗證失敗
    - 稽核閘道公開的節點介面
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、範圍限定的 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-06-27T19:16:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 橋接器已被**移除**。目前的 OpenClaw 建置不再隨附橋接監聽器，且 `bridge.*` 設定鍵已不在結構描述中。此頁面僅保留作為歷史參考。所有節點/操作者用戶端請使用[閘道協定](/zh-TW/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全邊界**：橋接器公開的是小型允許清單，而不是完整的閘道 API 介面。
- **配對 + 節點身分**：節點准入由閘道負責，並綁定到每個節點專屬的權杖。
- **探索使用者體驗**：節點可以透過 LAN 上的 Bonjour 探索閘道，或直接透過 tailnet 連線。
- **Loopback WS**：完整的 WS 控制平面會維持在本機，除非透過 SSH 建立通道。

## 傳輸

- TCP，每行一個 JSON 物件 (JSONL)。
- 選用 TLS（當 `bridge.tls.enabled` 為 true 時）。
- 歷史預設監聽連接埠是 `18790`（目前建置不會啟動 TCP 橋接器）。

啟用 TLS 時，探索 TXT 記錄會包含 `bridgeTls=1`，以及作為非祕密提示的 `bridgeTlsSha256`。請注意，Bonjour/mDNS TXT 記錄未經驗證；用戶端不得在沒有明確使用者意圖或其他頻外驗證的情況下，將公告的指紋視為權威釘選。

## 交握 + 配對

1. 用戶端傳送帶有節點中繼資料 + 權杖（若已配對）的 `hello`。
2. 若尚未配對，閘道會回覆 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 用戶端傳送 `pair-request`。
4. 閘道等待核准，然後傳送 `pair-ok` 與 `hello-ok`。

歷史上，`hello-ok` 會回傳 `serverName`；託管外掛介面現在會透過 `pluginSurfaceUrls` 公告。Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`；已棄用的 `canvasHostUrl` 別名不是重構後協定的一部分。

## 訊框

用戶端 → 閘道：

- `req` / `res`：有範圍的閘道 RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：節點訊號（語音逐字稿、代理請求、聊天訂閱、執行生命週期）

閘道 → 用戶端：

- `invoke` / `invoke-res`：節點命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已訂閱工作階段的聊天更新
- `ping` / `pong`：保持連線

舊版允許清單強制執行曾位於 `src/gateway/server-bridge.ts`（已移除）。

## 執行生命週期事件

節點可以發出 `exec.finished` 事件，以呈現已完成的 `system.run` 活動。這些事件會在閘道中對應為系統事件。（舊版節點可能仍會發出 `exec.started`。）
節點可以針對遭拒的 `system.run` 嘗試發出 `exec.denied`；閘道會將該事件視為終止拒絕接受，且不會將系統事件排入佇列或喚醒代理工作。

承載欄位（除非註明，否則全為選用）：

- `sessionKey`（必要）：用於事件關聯的代理工作階段；對於 `exec.finished`，也用於系統事件傳遞。
- `runId`：用於分組的唯一執行 ID。
- `command`：原始或格式化的命令字串。
- `exitCode`、`timedOut`、`success`、`output`：完成詳細資料（僅限 finished）。
- `reason`：拒絕原因（僅限 denied）。

## 歷史 tailnet 用法

- 將橋接器繫結到 tailnet IP：在 `~/.openclaw/openclaw.json` 中設定 `bridge.bind: "tailnet"`（僅為歷史用法；`bridge.*` 已不再有效）。
- 用戶端透過 MagicDNS 名稱或 tailnet IP 連線。
- Bonjour **不會**跨網路運作；需要時請使用手動主機/連接埠或廣域 DNS-SD。

## 版本控管

橋接器曾是**隱含 v1**（沒有 min/max 協商）。本節僅作為歷史參考；目前的節點/操作者用戶端使用 WebSocket [閘道協定](/zh-TW/gateway/protocol)。

## 相關

- [閘道協定](/zh-TW/gateway/protocol)
- [節點](/zh-TW/nodes)
