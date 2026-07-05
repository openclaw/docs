---
read_when:
    - 調查舊版節點用戶端程式碼或封存的配對記錄
    - 稽核舊版節點介面過去公開的內容
summary: 歷史橋接協定（舊版節點）：TCP JSONL、配對、範圍限定的 RPC
title: 橋接協定
x-i18n:
    generated_at: "2026-07-05T11:18:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 橋接已被**移除**。目前的 OpenClaw 建置不會隨附橋接監聽器，且 `bridge.*` 設定鍵已不再包含於結構描述中。本頁僅供歷史參考。所有節點／操作員用戶端請使用 [閘道通訊協定](/zh-TW/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全邊界**：公開小型允許清單，而不是完整的閘道 API 介面。
- **配對 + 節點身分**：節點准入由閘道擁有，並綁定到每節點權杖。
- **探索使用者體驗**：節點可以透過區域網路上的 Bonjour 探索閘道，或透過 tailnet 直接連線。
- **Loopback WS**：完整的 WS 控制平面除非透過 SSH 通道，否則保持在本機。

## 傳輸

- TCP，每行一個 JSON 物件（JSONL）。
- 選用 TLS（`bridge.tls.enabled: true`）。
- 預設監聽連接埠為 `18790`。

啟用 TLS 時，探索 TXT 記錄會包含 `bridgeTls=1` 加上 `bridgeTlsSha256` 作為非秘密提示。Bonjour/mDNS TXT 記錄未經驗證；沒有其他頻外驗證時，用戶端不能將公告的指紋視為具權威性的釘選。

## 交握與配對

1. 用戶端傳送帶有節點中繼資料加權杖的 `hello`（如果已配對）。
2. 如果未配對，閘道會回覆 `error`（`NOT_PAIRED` / `UNAUTHORIZED`）。
3. 用戶端傳送 `pair-request`。
4. 閘道等待核准，然後傳送 `pair-ok` 與 `hello-ok`。

`hello-ok` 過去會回傳 `serverName`；託管外掛介面現在透過目前閘道通訊協定上的 `pluginSurfaceUrls` 公告（Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`）。

## 訊框

用戶端到閘道：

- `req` / `res`：限定範圍的閘道 RPC（聊天、工作階段、設定、健康狀態、voicewake、skills.bins）。
- `event`：節點訊號（語音轉錄、代理程式請求、聊天訂閱、exec 生命週期）。

閘道到用戶端：

- `invoke` / `invoke-res`：節點命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）。
- `event`：已訂閱工作階段的聊天更新。
- `ping` / `pong`：keepalive。

允許清單強制執行位於 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命週期事件

節點會發出 `exec.finished` 以呈現已完成的 `system.run` 活動，並由閘道對應到系統事件（舊版節點也可以發出 `exec.started`）。`exec.denied` 會將遭拒絕的 `system.run` 嘗試標記為終端拒絕，而不會將系統事件排入佇列或喚醒代理程式工作。

承載欄位（除非另有註明，否則皆為選用）：

| 欄位                             | 備註                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sessionKey`                     | 必填。用於事件關聯的代理程式工作階段，且對於 `exec.finished`，用於系統事件傳遞。              |
| `runId`                          | 用於分組的唯一 exec ID。                                                                       |
| `command`                        | 原始或格式化的命令字串。                                                                       |
| `exitCode`, `timedOut`, `output` | 完成詳細資訊（僅 finished）。                                                                  |
| `reason`                         | 拒絕原因（僅 denied）。                                                                        |

## 歷史 tailnet 用法

- 將橋接綁定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中使用 `bridge.bind: "tailnet"`（僅限歷史；`bridge.*` 不再是有效設定）。
- 用戶端透過 MagicDNS 名稱或 tailnet IP 連線。
- Bonjour 不會跨網路；否則需要廣域 DNS-SD 或手動主機／連接埠。

## 版本管理

橋接是隱含的 v1，沒有 min/max 協商。目前的節點／操作員用戶端使用 WebSocket [閘道通訊協定](/zh-TW/gateway/protocol)，該通訊協定會協商通訊協定版本範圍。

## 相關

- [閘道通訊協定](/zh-TW/gateway/protocol)
- [節點](/zh-TW/nodes)
