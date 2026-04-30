---
read_when:
    - 執行或除錯 Gateway 程序
    - 調查單一執行個體強制機制
summary: 使用 WebSocket 監聽器繫結的 Gateway 單例防護
title: Gateway 鎖定
x-i18n:
    generated_at: "2026-04-30T16:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 確保同一主機上的每個基準連接埠只執行一個 Gateway 執行個體；額外的 Gateway 必須使用隔離的設定檔與唯一連接埠。
- 在當機/SIGKILL 後仍能恢復，且不留下過時的鎖定檔。
- 當控制連接埠已被佔用時，快速失敗並顯示清楚的錯誤。

## 機制

- Gateway 會先在狀態鎖定目錄下取得每個設定專屬的鎖定檔，並探測已設定連接埠是否已有既有監聽器。
- 如果記錄的鎖定擁有者已不存在、連接埠可用，或鎖定已過時，啟動程序會收回鎖定並繼續。
- 接著 Gateway 會使用獨占 TCP 監聽器綁定 HTTP/WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）。
- 如果綁定因 `EADDRINUSE` 失敗，啟動程序會拋出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 關閉時，Gateway 會關閉 HTTP/WebSocket 伺服器並移除鎖定檔。

## 錯誤介面

- 如果另一個程序持有該連接埠，啟動程序會拋出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他綁定失敗會呈現為 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`。

## 操作注意事項

- 如果連接埠被_另一個_程序佔用，錯誤相同；釋放該連接埠，或使用 `openclaw gateway --port <port>` 選擇另一個連接埠。
- 在服務監督程式下，若新的 Gateway 程序看到現有健康的 `/healthz` 回應者，會讓該程序維持控制權。在 systemd 上，重複啟動者會以代碼 78 結束，因此預設的 `RestartPreventExitStatus=78` 會阻止 `Restart=always` 因鎖定或 `EADDRINUSE` 衝突而不斷迴圈。如果現有程序始終無法變為健康狀態，重試次數會受限，且啟動會以清楚的鎖定錯誤失敗，而不是永遠迴圈。
- macOS App 在產生 Gateway 前仍會維護自己的輕量 PID 防護；執行階段鎖定則由鎖定檔加上 HTTP/WebSocket 綁定強制執行。

## 相關

- [多個 Gateway](/zh-TW/gateway/multiple-gateways) — 使用唯一連接埠執行多個執行個體
- [疑難排解](/zh-TW/gateway/troubleshooting) — 診斷 `EADDRINUSE` 與連接埠衝突
