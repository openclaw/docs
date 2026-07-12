---
read_when:
    - 執行或偵錯閘道程序
    - 調查單一執行個體強制機制
summary: 閘道單例防護：檔案鎖加上 WebSocket/HTTP 綁定
title: 閘道鎖定
x-i18n:
    generated_at: "2026-07-11T21:22:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 一台主機上，指定的設定與連接埠只能由一個閘道程序擁有；若要執行額外的閘道，請使用隔離的設定檔與不重複的連接埠。
- 即使發生當機或收到 SIGKILL，也不會留下過期的鎖定檔案。
- 當另一個閘道已占用該連接埠時，立即失敗並顯示明確的錯誤。

## 兩層機制

啟動時會依序透過兩個獨立步驟，確保單一執行個體的擁有權：

1. **檔案鎖定**會在狀態鎖定目錄中，取得每個設定專屬的鎖定檔案。取得鎖定時，啟動程序會探測已設定的連接埠是否有作用中的接聽程式，以偵測過期（已當機）的鎖定擁有者。
2. **通訊端繫結**會將 HTTP/WebSocket 接聽程式（預設為 `ws://127.0.0.1:18789`）繫結為獨占的 TCP 接聽程式。

每一層都可能獨立失敗，並擲回各自的 `GatewayLockError`。

### 檔案鎖定

- 如果鎖定檔案不存在、記錄的擁有者程序已結束，或擁有者的連接埠探測結果顯示沒有作用中的接聽程式，啟動程序會回收鎖定並繼續。
- 如果鎖定仍由作用中的程序持有，且上述情況皆不適用，啟動程序預設最多重試 5 秒，之後才會放棄：

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### 通訊端繫結

- 發生 `EADDRINUSE` 時，啟動程序會以 500 毫秒為間隔，最多重試繫結 20 次（總計約 10 秒），以等待近期結束的程序所留下的 `TIME_WAIT` 時段結束。
- 如果重試後連接埠仍在使用中：

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- 其他繫結失敗：

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

關閉時，閘道會關閉 HTTP/WebSocket 伺服器並移除鎖定檔案。

## 操作注意事項

- 如果連接埠由其他非閘道程序占用，錯誤訊息也會相同；請釋放該連接埠，或使用 `openclaw gateway --port <port>` 選擇另一個連接埠。
- 在服務監督程式下，新閘道程序遇到上述任一錯誤時，會先探測現有程序的 `/healthz`。如果該程序運作正常，新程序會讓它繼續掌控，而不會以失敗結束。在 systemd 上，新程序會以代碼 `78` 結束；單元的 `RestartPreventExitStatus=78` 可防止 `Restart=always` 因鎖定或 `EADDRINUSE` 衝突而反覆重新啟動。如果現有程序始終無法恢復正常，健康狀態探測會在有限時間內重試，之後啟動程序將以上述鎖定錯誤失敗，而不會無限循環。
- macOS 應用程式在產生閘道程序前，會保留其自身的輕量級 PID 防護機制；上述檔案鎖定與通訊端繫結才是實際的執行階段強制機制。

## 相關內容

- [多個閘道](/zh-TW/gateway/multiple-gateways) - 使用不重複的連接埠執行多個執行個體
- [疑難排解](/zh-TW/gateway/troubleshooting) - 診斷 `EADDRINUSE` 與連接埠衝突
