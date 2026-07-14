---
read_when:
    - 執行或偵錯閘道程序
    - 調查單一執行個體強制機制
summary: 閘道單例防護：檔案鎖定加上 WebSocket/HTTP 繫結
title: 閘道鎖定
x-i18n:
    generated_at: "2026-07-14T13:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 一個狀態目錄應僅由一個閘道程序擁有；執行額外的閘道時，請使用彼此隔離的設定檔、狀態目錄、設定與連接埠。
- 即使發生當機或 SIGKILL，也不會留下過期的鎖定檔案。
- 當另一個閘道已占用連接埠時，立即失敗並顯示清楚的錯誤訊息。

## 三層機制

啟動時會依序透過三個步驟強制執行擁有權：

1. **狀態擁有權鎖定**會取得以標準狀態目錄為索引鍵的鎖定。每個閘道都會參與，包括使用 `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 啟動的閘道，因此破壞性的 SQLite 維護作業不會與仍在執行的擁有者產生競爭。
2. **設定鎖定**會取得既有的個別設定鎖定，並記錄執行階段連接埠。多閘道模式會略過此設定單例限制，但仍保留狀態擁有權鎖定。
3. **通訊端繫結**會將 HTTP/WebSocket 監聽器（預設為 `ws://127.0.0.1:18789`）繫結為獨占的 TCP 監聽器。

每一層都可能獨立失敗，並擲回各自的 `GatewayLockError`。

### 狀態與設定鎖定

- 鎖定是否仍有效，是根據記錄的 PID、可用時的平台程序啟動識別資訊，以及閘道程序識別資訊判定。經驗證的擁有者在啟動期間、其連接埠開始監聽之前，仍具有權威性。
- 專用的 SQLite 協調器會序列化中繼資料檢查、過期擁有者回收與鎖定取代作業。若擁有該鎖定的程序當機，其獨占交易會自動釋放。
- 如果鎖定檔案遺失，或記錄的擁有者程序已不存在，啟動程序會回收鎖定並繼續執行。
- 如果任一鎖定正被占用，啟動程序最多會重試 5 秒（預設值），之後才會放棄：

  ```text
  GatewayLockError("閘道已在執行（pid <pid>）；鎖定在 <ms>ms 後逾時")
  ```

### 通訊端繫結

- 在 `EADDRINUSE` 上，啟動程序最多會嘗試繫結 20 次，每次間隔 500ms（總計約 10 秒），以度過最近結束的程序所造成的 `TIME_WAIT` 時間窗。
- 如果重試後連接埠仍在使用中：

  ```text
  GatewayLockError("另一個閘道執行個體已在 ws://127.0.0.1:<port> 上監聽")
  ```

- 其他繫結失敗：

  ```text
  GatewayLockError("無法在 ws://127.0.0.1:<port> 上繫結閘道通訊端：<cause>")
  ```

關閉時，閘道會關閉 HTTP/WebSocket 伺服器，並移除其狀態
與設定鎖定檔案。

## 操作注意事項

- 如果連接埠被其他非閘道程序占用，錯誤訊息相同；請釋放該連接埠，或使用 `openclaw gateway --port <port>` 選擇其他連接埠。
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 允許多個設定／執行階段執行個體，但不允許共用可變狀態。每個執行個體仍需要唯一的 `OPENCLAW_STATE_DIR`。
- 在服務監督程式下，遇到上述任一錯誤的新閘道程序，會先探測現有程序上的 `/healthz`。如果該程序狀況正常，新程序會讓它繼續掌控，而不是失敗。在 systemd 上，新程序會以代碼 `78` 結束；單元的 `RestartPreventExitStatus=78` 會避免 `Restart=always` 因鎖定或 `EADDRINUSE` 衝突而不斷循環。如果現有程序始終未恢復正常，健康探測重試會受時間限制，之後啟動程序會以上述鎖定錯誤失敗，而不是永遠循環。
- macOS 應用程式在產生閘道程序前會保留自身的輕量級 PID 防護機制；上述檔案鎖定與通訊端繫結才是實際的執行階段強制機制。

## 相關內容

- [多個閘道](/zh-TW/gateway/multiple-gateways) - 使用唯一連接埠執行多個執行個體
- [疑難排解](/zh-TW/gateway/troubleshooting) - 診斷 `EADDRINUSE` 與連接埠衝突
