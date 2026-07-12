---
read_when:
    - 調查舊版節點用戶端程式碼或封存的配對日誌
    - 稽核舊版節點介面過去公開的內容
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、限定範圍的 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-07-11T21:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 橋接器已被**移除**。目前的 OpenClaw 組建版本不再隨附橋接器監聽程式，且 `bridge.*` 設定鍵也已從結構描述中移除。本頁僅供歷史參考。所有節點／操作端用戶端皆應使用[閘道通訊協定](/zh-TW/gateway/protocol)。
</Warning>

## 過去存在的原因

- **安全邊界**：僅公開一小組允許清單，而非完整的閘道 API 介面。
- **配對與節點身分**：節點准入由閘道管理，並綁定至各節點專屬的權杖。
- **探索使用體驗**：節點可透過 Bonjour 在區域網路上探索閘道，或經由 tailnet 直接連線。
- **迴路 WS**：除非透過 SSH 建立通道，完整的 WS 控制層會維持在本機。

## 傳輸

- TCP，每行一個 JSON 物件（JSONL）。
- 選用的 TLS（`bridge.tls.enabled: true`）。
- 預設監聽連接埠為 `18790`。

啟用 TLS 時，探索 TXT 記錄會包含 `bridgeTls=1`，並附上 `bridgeTlsSha256` 作為非機密提示。Bonjour/mDNS TXT 記錄未經驗證；若沒有其他頻外驗證，用戶端不得將公告的指紋視為具權威性的固定指紋。

## 交握與配對

1. 用戶端傳送 `hello`，其中包含節點中繼資料及權杖（若已配對）。
2. 若尚未配對，閘道會回覆 `error`（`NOT_PAIRED`／`UNAUTHORIZED`）。
3. 用戶端傳送 `pair-request`。
4. 閘道等待核准，接著傳送 `pair-ok` 和 `hello-ok`。

`hello-ok` 過去會傳回 `serverName`；目前的閘道通訊協定改透過 `pluginSurfaceUrls` 公告託管的外掛介面（Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`）。

## 框架

用戶端至閘道：

- `req`／`res`：限定範圍的閘道 RPC（聊天、工作階段、設定、健康狀態、語音喚醒、skills.bins）。
- `event`：節點訊號（語音逐字稿、代理程式請求、聊天訂閱、執行生命週期）。

閘道至用戶端：

- `invoke`／`invoke-res`：節點命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）。
- `event`：已訂閱工作階段的聊天更新。
- `ping`／`pong`：保持連線。

允許清單的強制執行邏輯原先位於 `src/gateway/server-bridge.ts`（已移除）。

## 執行生命週期事件

節點會發出 `exec.finished`，以呈現已完成的 `system.run` 活動，並由閘道對應至系統事件（舊版節點也可發出 `exec.started`）。`exec.denied` 會將遭拒絕的 `system.run` 嘗試標記為終止拒絕，且不會將系統事件排入佇列，也不會喚醒代理程式工作。

承載資料欄位（除非另有註明，否則皆為選填）：

| 欄位                             | 說明                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `sessionKey`                     | 必填。用於事件關聯的代理程式工作階段；對 `exec.finished` 而言，也用於傳遞系統事件。 |
| `runId`                          | 用於分組的唯一執行 ID。                                                              |
| `command`                        | 原始或已格式化的命令字串。                                                           |
| `exitCode`, `timedOut`, `output` | 完成詳細資料（僅限已完成）。                                                         |
| `reason`                         | 拒絕原因（僅限遭拒絕）。                                                             |

## 過去的 tailnet 用法

- 將橋接器繫結至 tailnet IP：在 `~/.openclaw/openclaw.json` 中設定 `bridge.bind: "tailnet"`（僅供歷史參考；`bridge.*` 已不再是有效設定）。
- 用戶端透過 MagicDNS 名稱或 tailnet IP 連線。
- Bonjour 無法跨越網路；否則必須使用廣域 DNS-SD 或手動指定主機／連接埠。

## 版本控制

橋接器採用隱含的 v1，沒有最小／最大版本協商。目前的節點／操作端用戶端使用 WebSocket [閘道通訊協定](/zh-TW/gateway/protocol)，該通訊協定會協商通訊協定版本範圍。

## 相關內容

- [閘道通訊協定](/zh-TW/gateway/protocol)
- [節點](/zh-TW/nodes)
