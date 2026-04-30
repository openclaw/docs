---
read_when:
    - 執行或偵錯 Gateway 程序
    - 調查單一執行個體強制執行
summary: 使用 WebSocket 監聽器繫結的 Gateway 單例防護機制
title: Gateway 鎖定
x-i18n:
    generated_at: "2026-04-30T03:06:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 確保同一主機上每個基本連接埠只執行一個 Gateway 執行個體；其他 Gateway 必須使用隔離的設定檔和唯一連接埠。
- 在當機/SIGKILL 後仍能復原，不會留下過期鎖定檔。
- 當控制連接埠已被占用時，以明確錯誤快速失敗。

## 機制

- Gateway 會先在狀態鎖定目錄下取得每個設定專用的鎖定檔，並探測已設定的連接埠是否有現有監聽器。
- 如果記錄的鎖定擁有者已不存在、連接埠可用，或鎖定已過期，啟動程序會取回鎖定並繼續。
- Gateway 接著會使用獨占 TCP 監聽器繫結 HTTP/WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）。
- 如果繫結因 `EADDRINUSE` 失敗，啟動程序會拋出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 關閉時，Gateway 會關閉 HTTP/WebSocket 伺服器並移除鎖定檔。

## 錯誤呈現

- 如果另一個程序持有該連接埠，啟動程序會拋出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他繫結失敗會呈現為 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`。

## 操作注意事項

- 如果連接埠被_另一個_程序占用，錯誤相同；請釋放該連接埠，或使用 `openclaw gateway --port <port>` 選擇另一個連接埠。
- 在服務監督器下，新的 Gateway 程序如果看到現有健康的 `/healthz` 回應者，會成功結束並讓該程序保持控制權。如果現有程序一直無法變健康，重試會有界限，且啟動會以明確的鎖定錯誤失敗，而不是永遠循環。
- macOS 應用程式在產生 Gateway 前仍會維持自己的輕量 PID 防護；執行階段鎖定由鎖定檔加上 HTTP/WebSocket 繫結強制執行。

## 相關內容

- [多個 Gateway](/zh-TW/gateway/multiple-gateways) — 使用唯一連接埠執行多個執行個體
- [疑難排解](/zh-TW/gateway/troubleshooting) — 診斷 `EADDRINUSE` 和連接埠衝突
