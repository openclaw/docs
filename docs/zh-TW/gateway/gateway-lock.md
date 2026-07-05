---
read_when:
    - 執行或偵錯閘道程序
    - 正在調查單一執行個體強制機制
summary: 閘道單例防護：檔案鎖加上 WebSocket/HTTP 繫結
title: 閘道鎖定
x-i18n:
    generated_at: "2026-07-05T11:19:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 在一台主機上，只有一個閘道程序應該擁有指定的設定 + 連接埠；請使用隔離的設定檔與唯一連接埠來執行額外的閘道。
- 即使發生當機/SIGKILL，也不會留下過期的鎖定檔。
- 當另一個閘道已經擁有該連接埠時，以清楚的錯誤快速失敗。

## 兩層

啟動會依序透過兩個獨立步驟強制單一執行個體擁有權：

1. **檔案鎖定** 會在狀態鎖定目錄下取得每個設定專屬的鎖定檔。取得鎖定時，啟動流程會探測設定的連接埠是否有作用中的監聽器，以偵測過期的（已當機）鎖定擁有者。
2. **通訊端繫結** 會將 HTTP/WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）繫結為獨占 TCP 監聽器。

每一層都可能獨立失敗，並擲出自己的 `GatewayLockError`。

### 檔案鎖定

- 如果鎖定檔遺失、記錄的擁有者程序已不存在，或擁有者的連接埠探測顯示沒有作用中的監聽器，啟動流程會收回鎖定並繼續。
- 如果鎖定正被作用中的程序持有，且上述情況皆不適用，啟動流程會重試最多 5 秒（預設）後放棄：

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### 通訊端繫結

- 遇到 `EADDRINUSE` 時，啟動流程會以 500ms 間隔最多重試繫結 20 次（總計約 10 秒），以渡過最近結束的程序留下的 `TIME_WAIT` 視窗。
- 如果重試後連接埠仍在使用中：

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- 其他繫結失敗：

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

關閉時，閘道會關閉 HTTP/WebSocket 伺服器並移除鎖定檔。

## 操作注意事項

- 如果連接埠被不同的非閘道程序占用，錯誤會相同；請釋放該連接埠，或使用 `openclaw gateway --port <port>` 選擇另一個連接埠。
- 在服務監督器下，新的閘道程序若遇到上述任一錯誤，會先探測既有程序的 `/healthz`。如果該程序健康，新的程序會讓它保持控制權，而不是失敗。在 systemd 上，它會以代碼 `78` 結束；單元的 `RestartPreventExitStatus=78` 會阻止 `Restart=always` 因鎖定或 `EADDRINUSE` 衝突而不斷循環。如果既有程序始終未變健康，健康探測重試會有時間限制，接著啟動流程會以上述鎖定錯誤失敗，而不是永遠循環。
- macOS 應用程式在產生閘道之前會保留自己的輕量 PID 防護；上述檔案鎖定與通訊端繫結才是實際的執行階段強制機制。

## 相關

- [多個閘道](/zh-TW/gateway/multiple-gateways) - 使用唯一連接埠執行多個執行個體
- [疑難排解](/zh-TW/gateway/troubleshooting) - 診斷 `EADDRINUSE` 與連接埠衝突
