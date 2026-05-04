---
read_when:
    - 您需要在部署前驗證操作員管理的代理路由
    - 你需要在本機擷取 OpenClaw 傳輸流量以進行偵錯
    - 你想要檢查除錯代理工作階段、二進位大型物件或內建查詢預設
summary: CLI 參考，用於 `openclaw proxy`，包括操作員管理的代理驗證與本機偵錯代理擷取檢查器
title: 代理
x-i18n:
    generated_at: "2026-05-04T07:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

驗證由操作員管理的代理路由，或執行本機明確除錯代理
並檢查擷取到的流量。

使用 `validate` 在啟用 OpenClaw 代理路由前，預先檢查由操作員管理的轉送代理。其他指令是用於傳輸層調查的除錯工具：它們可以啟動本機代理、在啟用擷取的情況下執行子指令、列出擷取工作階段、查詢常見流量模式、讀取擷取的 blob，並清除本機擷取資料。

## 指令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 驗證

`openclaw proxy validate` 會從 `--proxy-url`、設定或 `OPENCLAW_PROXY_URL` 檢查實際生效的由操作員管理的代理 URL。當沒有啟用並設定代理時，它會回報設定問題；請使用 `--proxy-url` 在變更設定前進行一次性預先檢查。預設情況下，它會驗證公開目的地可透過代理成功連線，且代理無法連線到暫時的 loopback canary。自訂拒絕目的地採用失敗關閉：HTTP 回應與不明確的傳輸失敗都會失敗，除非你可以另外驗證部署特定的拒絕訊號。

選項：

- `--json`：列印機器可讀的 JSON。
- `--proxy-url <url>`：驗證此代理 URL，而不是設定或環境變數。
- `--allowed-url <url>`：新增預期可透過代理成功連線的目的地。可重複使用以檢查多個目的地。
- `--denied-url <url>`：新增預期會被代理封鎖的目的地。可重複使用以檢查多個目的地。
- `--timeout-ms <ms>`：每個請求的逾時時間，以毫秒為單位。

請參閱[網路代理](/zh-TW/security/network-proxy)以了解部署指引與拒絕語義。

## 查詢預設集

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注意事項

- `start` 預設為 `127.0.0.1`，除非設定了 `--host`。
- `run` 會啟動本機除錯代理，然後執行 `--` 之後的指令。
- 除錯代理的直接上游轉送會開啟上游 socket 以供診斷。當 OpenClaw 受管理代理模式啟用時，預設會停用代理請求與 CONNECT 通道的直接轉送；只有在已核准的本機診斷中，才設定 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。
- 當代理設定或目的地檢查失敗時，`validate` 會以代碼 1 結束。
- 擷取內容是本機除錯資料；完成後請使用 `openclaw proxy purge`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [網路代理](/zh-TW/security/network-proxy)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)
